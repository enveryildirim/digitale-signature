// Kurum İçi Dijital Bilgi Ekranı - Kiosk Player Client (v2.0.0, Firebase)
(function () {
  'use strict';

  const PLAYER_VERSION = '2.0.0';

  // State Variables
  const urlParams = new URLSearchParams(window.location.search);
  const paramToken = urlParams.get('token');
  const isPreview = urlParams.get('preview') === 'true';

  let deviceToken = paramToken || localStorage.getItem('signage_device_token') || null;
  let dbUrl = null;
  let device = readCache('signage_device_cache');
  let emergency = readCache('signage_emergency_cache');
  let livePlayback = null;
  let lastSync = null;
  let activeManifest = null;
  let playlistItems = [];
  let currentIndex = -1;
  let itemTimer = null;
  let heartbeatTimer = null;
  let wakeLock = null;
  let activeSlot = 'a'; // 'a' or 'b' for double-buffering

  // DOM Elements
  const slotA = document.getElementById('slot-a');
  const slotB = document.getElementById('slot-b');
  const idleScreen = document.getElementById('idle-screen');
  const idleClock = document.getElementById('idle-clock');
  const idleDate = document.getElementById('idle-date');
  const idleInfo = document.getElementById('idle-screen-info');
  const pairingScreen = document.getElementById('pairing-screen');
  const pairingCodeDisplay = document.getElementById('pairing-code-display');
  const pairingStatusText = document.getElementById('pairing-status-text');
  const statusPill = document.getElementById('status-pill');

  // Helpers
  // Preview iframe'i admin tarayıcısında çalışır; TV önbelleğine dokunmaz
  function readCache(key) {
    if (isPreview) return null;
    try {
      return JSON.parse(localStorage.getItem(key) || 'null');
    } catch (e) {
      return null;
    }
  }

  function writeCache(key, value) {
    if (isPreview) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }

  function showStatus(text, duration = 3000) {
    if (!statusPill || isPreview) return;
    statusPill.textContent = text;
    statusPill.classList.remove('hidden');
    setTimeout(() => {
      statusPill.classList.add('hidden');
    }, duration);
  }

  function updateClock() {
    if (!idleClock) return;
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    idleClock.textContent = `${hours}:${minutes}`;

    if (idleDate) {
      idleDate.textContent = now.toLocaleDateString('tr-TR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  }

  // Wake Lock API: Prevent TV display from sleeping (only for physical TV)
  async function requestWakeLock() {
    if (isPreview) return;
    try {
      if ('wakeLock' in navigator) {
        wakeLock = await navigator.wakeLock.request('screen');
        wakeLock.addEventListener('release', () => {
          setTimeout(requestWakeLock, 2000);
        });
      }
    } catch (err) {
      console.warn('Wake Lock request failed:', err);
    }
  }

  document.addEventListener('visibilitychange', () => {
    if (!isPreview && wakeLock !== null && document.visibilityState === 'visible') {
      requestWakeLock();
    }
  });

  // Nightly soft reload at 03:30 to clear Chromium memory leaks (PLR-7)
  function scheduleNightlyReload() {
    if (isPreview) return;
    const now = new Date();
    const nextReload = new Date();
    nextReload.setHours(3, 30, 0, 0);
    if (nextReload <= now) {
      nextReload.setDate(nextReload.getDate() + 1);
    }
    setTimeout(() => {
      window.location.reload();
    }, nextReload.getTime() - now.getTime());
  }

  // Service Worker Registration for Offline Caching
  function registerServiceWorker() {
    if (!isPreview && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js')
        .then((reg) => {
          console.log('ServiceWorker registered:', reg.scope);
        })
        .catch((err) => {
          console.warn('ServiceWorker registration error:', err);
        });
    }
  }

  function precacheAssets(urls) {
    if (!isPreview && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        action: 'PRECACHE_MEDIA',
        urls: urls
      });
    }
  }

  // --- Firebase Realtime Database (REST + EventSource, SDK'sız) ---
  // Hosting'in otomatik sunduğu /__/firebase/init.json'dan databaseURL okunur; offline açılış için saklanır.
  async function loadConfig() {
    try {
      const res = await fetch('/__/firebase/init.json');
      if (res.ok) {
        const cfg = await res.json();
        if (cfg.databaseURL) {
          localStorage.setItem('signage_db_url', cfg.databaseURL);
          return cfg.databaseURL;
        }
      }
    } catch (e) {
      console.warn('Firebase config fetch failed, using cached:', e);
    }
    return localStorage.getItem('signage_db_url');
  }

  function dbWrite(method, path, body, keepalive) {
    return fetch(`${dbUrl}/${path}.json`, {
      method: method,
      body: JSON.stringify(body),
      keepalive: Boolean(keepalive)
    });
  }

  function setIn(obj, segs, data) {
    if (segs.length === 0) return data;
    const out = Object.assign({}, obj && typeof obj === 'object' ? obj : {});
    const value = setIn(out[segs[0]], segs.slice(1), data);
    if (value === null || value === undefined) delete out[segs[0]];
    else out[segs[0]] = value;
    return Object.keys(out).length ? out : null;
  }

  // Streams a path; keeps a local mirror of put/patch events. EventSource reconnects by itself.
  function dbStream(path, onValue) {
    let value = null;
    const es = new EventSource(`${dbUrl}/${path}.json`);
    const segs = (p) => p.split('/').filter(Boolean);
    es.addEventListener('put', (e) => {
      const msg = JSON.parse(e.data);
      value = setIn(value, segs(msg.path), msg.data);
      onValue(value);
    });
    es.addEventListener('patch', (e) => {
      const msg = JSON.parse(e.data);
      Object.keys(msg.data || {}).forEach((key) => {
        value = setIn(value, segs(msg.path).concat(segs(key)), msg.data[key]);
      });
      onValue(value);
    });
    es.addEventListener('cancel', () => {
      console.warn('Stream cancelled (permission):', path);
      es.close();
    });
    return es;
  }

  function generatePairingCode() {
    // Karıştırılabilen karakterler yok (0, O, 1, I)
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    const bytes = crypto.getRandomValues(new Uint8Array(6));
    return Array.from(bytes, (b) => chars[b % chars.length]).join('');
  }

  function generateDeviceToken() {
    const bytes = crypto.getRandomValues(new Uint8Array(24));
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  }

  // --- Registration & Pairing Flow (SCR-1, SCR-2) ---
  async function startPairingFlow() {
    idleScreen.classList.add('hidden');
    pairingScreen.classList.remove('hidden');
    pairingStatusText.textContent = 'Eşleştirme kodu alınıyor...';

    if (!deviceToken) {
      deviceToken = generateDeviceToken();
      localStorage.setItem('signage_device_token', deviceToken);
    }

    try {
      const code = generatePairingCode();
      const res = await dbWrite('PUT', `pairing/${code}`, {
        token: deviceToken,
        createdAt: { '.sv': 'timestamp' },
        userAgent: navigator.userAgent.slice(0, 200),
        resolution: `${window.screen.width}x${window.screen.height}`
      });
      if (res.status === 401 || res.status === 403) {
        // Kod çakışması: yeni kod üret
        startPairingFlow();
        return;
      }
      if (!res.ok) throw new Error('Kayıt isteği başarısız.');

      pairingCodeDisplay.textContent = code;
      pairingStatusText.textContent = 'Panele kodun girilmesi bekleniyor...';

      const es = dbStream(`devices/${deviceToken}`, (value) => {
        if (value && value.screenId) {
          es.close();
          onPairingSuccess(value);
        }
      });
    } catch (err) {
      pairingStatusText.textContent = 'Sunucuya bağlanılamadı. Tekrar deneniyor...';
      setTimeout(startPairingFlow, 10000);
    }
  }

  function onPairingSuccess(value) {
    localStorage.setItem('signage_paired', '1');
    device = value;
    writeCache('signage_device_cache', device);
    showStatus('Ekran başarıyla eşleştirildi!');
    pairingScreen.classList.add('hidden');
    startPlayer();
  }

  // --- Main Player Logic ---
  function startPlayer() {
    pairingScreen.classList.add('hidden');

    // Cached state first: internet yokken de yayın hemen başlar
    evaluate();

    dbStream(`devices/${deviceToken}`, (value) => {
      if (value === null) {
        handleUnpair();
        return;
      }
      if (lastSync !== null && value.sync !== lastSync) {
        console.log('Instant manifest sync triggered by admin.');
        activeManifest = null;
        currentIndex = -1;
      }
      lastSync = value.sync || 0;
      device = value;
      writeCache('signage_device_cache', device);
      evaluate();
    });

    dbStream('emergency', (value) => {
      emergency = value;
      writeCache('signage_emergency_cache', emergency);
      evaluate();
    });

    if (isPreview) {
      dbStream(`telemetry/${deviceToken}/playback`, (state) => {
        livePlayback = state;
        followLivePlayback();
      });
    } else {
      sendHeartbeat();
    }

    // Zaman pencereli kurallar için periyodik yeniden değerlendirme + heartbeat (PLR-4)
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    heartbeatTimer = setInterval(() => {
      evaluate();
      sendHeartbeat();
    }, 30000);
  }

  function evaluate() {
    if (!device) {
      idleScreen.classList.remove('hidden');
      return;
    }
    applyManifest(window.SignageResolver.resolveManifest(device, emergency, new Date()));
  }

  function handleUnpair() {
    if (isPreview) return;
    ['signage_device_token', 'signage_paired', 'signage_device_cache'].forEach((k) => localStorage.removeItem(k));
    deviceToken = null;
    if (itemTimer) clearTimeout(itemTimer);
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    window.location.reload();
  }

  function sendTelemetry(extra, keepalive) {
    if (!deviceToken || isPreview || !dbUrl) return;
    const currentItem = playlistItems[currentIndex];
    const payload = Object.assign({
      lastSeen: { '.sv': 'timestamp' },
      online: true,
      currentMedia: currentItem ? currentItem.media.title : null,
      playerVersion: PLAYER_VERSION
    }, extra);
    dbWrite('PATCH', `telemetry/${deviceToken}`, payload, keepalive).catch(() => {});
  }

  function sendHeartbeat() {
    sendTelemetry({});
  }

  // Preview Client: synchronize immediately with the real TV
  function followLivePlayback() {
    const state = livePlayback;
    if (!state || playlistItems.length === 0) return;
    const targetIdx = state.currentIndex;
    if (targetIdx >= 0 && targetIdx < playlistItems.length && targetIdx !== currentIndex) {
      const elapsedSec = state.startedAt ? Math.max(0, (Date.now() - state.startedAt) / 1000) : 0;
      playItemAtIndex(targetIdx, elapsedSec);
    }
  }

  function applyManifest(manifest) {
    // Check Emergency Override (SCH-5)
    const emergencyScreen = document.getElementById('emergency-screen');
    const emergencyTitle = document.getElementById('emergency-title');
    const emergencyMessage = document.getElementById('emergency-message');

    if (manifest.emergency && manifest.emergency.active) {
      if (itemTimer) {
        clearTimeout(itemTimer);
        itemTimer = null;
      }
      activeManifest = null;
      currentIndex = -1;
      if (emergencyTitle) emergencyTitle.textContent = manifest.emergency.title || 'ACİL DURUM';
      if (emergencyMessage) emergencyMessage.textContent = manifest.emergency.message || '';
      if (emergencyScreen) emergencyScreen.classList.remove('hidden');
      idleScreen.classList.add('hidden');
      return;
    } else {
      if (emergencyScreen) emergencyScreen.classList.add('hidden');
    }

    if (manifest.screenName && idleInfo) {
      idleInfo.textContent = `${manifest.screenName} ${manifest.groupName ? '(' + manifest.groupName + ')' : ''}`;
    }

    // Check if manifest items changed
    const newItems = (manifest.playlist && manifest.playlist.items) || [];
    const hash = manifest.hash || JSON.stringify(newItems.map(i => i.id));

    if (activeManifest && activeManifest.hash === hash) {
      return;
    }

    activeManifest = { ...manifest, hash };
    playlistItems = newItems;

    if (playlistItems.length === 0) {
      if (itemTimer) clearTimeout(itemTimer);
      itemTimer = null;
      currentIndex = -1;
      slotA.innerHTML = '';
      slotB.innerHTML = '';
      idleScreen.classList.remove('hidden');
    } else {
      idleScreen.classList.add('hidden');
      precacheAssets(playlistItems.map(item => item.media.url));
      startSyncedPlayback();
    }
  }

  /**
   * Starts playback synchronized with the physical TV or timeline wall-clock.
   * Prevents restarting from item 0 on preview!
   */
  function startSyncedPlayback() {
    if (playlistItems.length === 0) return;

    const state = livePlayback;
    if (isPreview && state) {
      const elapsed = Math.max(0, (Date.now() - state.startedAt) / 1000);
      if (elapsed < state.duration && state.currentIndex < playlistItems.length) {
        console.log(`Preview: Synced with live TV at item ${state.currentIndex}, seek: ${elapsed.toFixed(1)}s`);
        playItemAtIndex(state.currentIndex, elapsed);
        return;
      }
    }

    // Deterministic Timeline (Wall-Clock) Sync:
    // Guarantees all screens and previews without live state are at the exact same item and second
    const totalDuration = playlistItems.reduce((acc, it) => acc + (it.duration || it.media.duration || 10), 0);
    if (totalDuration > 0) {
      const loopOffset = Math.floor(Date.now() / 1000) % totalDuration;
      let accum = 0;
      for (let i = 0; i < playlistItems.length; i++) {
        const itemDur = playlistItems[i].duration || playlistItems[i].media.duration || 10;
        if (loopOffset >= accum && loopOffset < accum + itemDur) {
          playItemAtIndex(i, loopOffset - accum);
          return;
        }
        accum += itemDur;
      }
    }

    playItemAtIndex(0, 0);
  }

  // Play specific item with seeking support (for preview & instant live sync)
  function playItemAtIndex(index, seekSeconds = 0) {
    if (itemTimer) {
      clearTimeout(itemTimer);
      itemTimer = null;
    }

    if (playlistItems.length === 0) {
      idleScreen.classList.remove('hidden');
      return;
    }

    currentIndex = index % playlistItems.length;
    const item = playlistItems[currentIndex];
    const targetSlot = activeSlot === 'a' ? slotB : slotA;
    const outgoingSlot = activeSlot === 'a' ? slotA : slotB;

    const durationSeconds = item.duration || item.media.duration || 10;
    const remainingSeconds = Math.max(1, durationSeconds - seekSeconds);

    renderMediaIntoSlot(item, targetSlot, seekSeconds, () => {
      // Transition complete: Cross-fade
      targetSlot.classList.add('active');
      outgoingSlot.classList.remove('active');
      activeSlot = activeSlot === 'a' ? 'b' : 'a';

      // Clear outgoing slot after transition
      setTimeout(() => {
        outgoingSlot.innerHTML = '';
      }, 900);

      // Report live playback so preview clients can follow
      sendTelemetry({
        currentMedia: item.media.title,
        playback: {
          currentIndex: currentIndex,
          mediaId: item.media.id,
          mediaTitle: item.media.title,
          startedAt: Date.now() - (seekSeconds * 1000),
          duration: durationSeconds
        }
      });

      // Schedule next item
      if (item.media.type === 'VIDEO') {
        const videoEl = targetSlot.querySelector('video');
        if (videoEl) {
          videoEl.onended = () => playNextItem();
          videoEl.onerror = () => {
            console.warn('Video playback error, skipping in 2s');
            itemTimer = setTimeout(playNextItem, 2000);
          };
          itemTimer = setTimeout(playNextItem, (remainingSeconds + 2) * 1000);
          return;
        }
      }

      itemTimer = setTimeout(playNextItem, remainingSeconds * 1000);
    });
  }

  // Play next item in cyclic sequence
  function playNextItem() {
    if (playlistItems.length === 0) return;
    playItemAtIndex((currentIndex + 1) % playlistItems.length, 0);
  }

  function renderMediaIntoSlot(item, slot, seekSeconds, onReady) {
    slot.innerHTML = '';
    const media = item.media;

    if (media.type === 'IMAGE') {
      const img = new Image();
      img.onload = () => {
        slot.appendChild(img);
        onReady();
      };
      img.onerror = () => {
        console.warn('Image failed to load:', media.url, 'skipping in 2s');
        setTimeout(playNextItem, 2000);
      };
      img.src = media.url;

    } else if (media.type === 'VIDEO') {
      const video = document.createElement('video');
      video.src = media.url;
      video.autoplay = true;
      video.muted = true; // Required for reliable browser autoplay
      video.playsInline = true;
      video.controls = false;

      video.onloadeddata = () => {
        if (seekSeconds > 0) {
          try {
            video.currentTime = seekSeconds;
          } catch (e) {
            console.warn('Video seek failed:', e);
          }
        }
        slot.appendChild(video);
        video.play().catch(e => console.warn('Autoplay prevented:', e));
        onReady();
      };
      video.onerror = () => {
        console.warn('Video failed to load:', media.url, 'skipping in 2s');
        setTimeout(playNextItem, 2000);
      };

    } else if (media.type === 'URL') {
      const iframe = document.createElement('iframe');
      iframe.src = media.url;
      iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups');
      iframe.onload = () => {
        onReady();
      };
      iframe.onerror = () => {
        setTimeout(playNextItem, 2000);
      };
      slot.appendChild(iframe);
      setTimeout(onReady, 1000);

    } else {
      setTimeout(playNextItem, 1000);
    }
  }

  // Notify instantly when tab is closed or navigated away (Instant Offline)
  function notifyOffline() {
    sendTelemetry({ online: false }, true);
  }

  window.addEventListener('beforeunload', notifyOffline);
  window.addEventListener('pagehide', notifyOffline);

  // --- Initialization ---
  async function init() {
    registerServiceWorker();
    requestWakeLock();
    scheduleNightlyReload();

    updateClock();
    setInterval(updateClock, 1000);

    dbUrl = await loadConfig();
    if (!dbUrl) {
      // İlk açılışta ağ yoksa: config gelene kadar bekle
      pairingScreen.classList.remove('hidden');
      pairingStatusText.textContent = 'Sunucuya bağlanılamadı. Tekrar deneniyor...';
      setTimeout(() => window.location.reload(), 10000);
      return;
    }

    // If persistent token passed in URL, prioritize and store it
    if (paramToken && !isPreview) {
      localStorage.setItem('signage_device_token', paramToken);
      localStorage.setItem('signage_paired', '1');
    }

    if (isPreview || localStorage.getItem('signage_paired') === '1') {
      startPlayer();
    } else {
      startPairingFlow();
    }
  }

  window.addEventListener('DOMContentLoaded', init);
})();
