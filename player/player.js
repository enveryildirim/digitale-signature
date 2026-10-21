// Kurum İçi Dijital Bilgi Ekranı - Kiosk Player Client (v1.0.0)
(function () {
  'use strict';

  // State Variables
  const urlParams = new URLSearchParams(window.location.search);
  const paramToken = urlParams.get('token');
  const isPreview = urlParams.get('preview') === 'true';

  let deviceToken = paramToken || localStorage.getItem('signage_device_token') || null;
  let currentScreenId = localStorage.getItem('signage_screen_id') || null;
  let activeManifest = null;
  let playlistItems = [];
  let currentIndex = -1;
  let itemTimer = null;
  let heartbeatTimer = null;
  let pollingTimer = null;
  let ws = null;
  let wakeLock = null;
  let activeSlot = 'a'; // 'a' or 'b' for double-buffering

  // DOM Elements
  const container = document.getElementById('player-container');
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
    const delay = nextReload.getTime() - now.getTime();
    setTimeout(() => {
      window.location.reload();
    }, delay);
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

  // --- Registration & Pairing Flow (SCR-1, SCR-2) ---
  async function startPairingFlow() {
    idleScreen.classList.add('hidden');
    pairingScreen.classList.remove('hidden');
    pairingStatusText.textContent = 'Eşleştirme kodu alınıyor...';

    try {
      const res = await fetch('/api/player/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAgent: navigator.userAgent,
          screenResolution: `${window.screen.width}x${window.screen.height}`
        })
      });

      if (!res.ok) throw new Error('Kayıt isteği başarısız.');

      const data = await res.json();
      currentScreenId = data.screenId;
      localStorage.setItem('signage_screen_id', currentScreenId);
      pairingCodeDisplay.textContent = data.pairingCode || '------';
      pairingStatusText.textContent = 'Panele kodun girilmesi bekleniyor...';

      connectWebSocketForPairing(data.screenId);

      if (pollingTimer) clearInterval(pollingTimer);
      pollingTimer = setInterval(async () => {
        try {
          const statusRes = await fetch(`/api/player/check-pair/${data.screenId}`);
          if (statusRes.ok) {
            const statusData = await statusRes.json();
            if (statusData.isPaired && statusData.deviceToken) {
              onPairingSuccess(statusData.deviceToken, statusData.screenName);
            }
          }
        } catch (e) {
          // ignore
        }
      }, 5000);

    } catch (err) {
      pairingStatusText.textContent = 'Sunucuya bağlanılamadı. Tekrar deneniyor...';
      setTimeout(startPairingFlow, 10000);
    }
  }

  function connectWebSocketForPairing(screenId) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/player?screenId=${screenId}`;

    try {
      const pairingWs = new WebSocket(wsUrl);
      pairingWs.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.action === 'PAIRED' && msg.deviceToken) {
            pairingWs.close();
            onPairingSuccess(msg.deviceToken, msg.screenName);
          }
        } catch (e) {
          console.error(e);
        }
      };
    } catch (e) {
      console.warn('Pairing WS connection failed:', e);
    }
  }

  function onPairingSuccess(token, screenName) {
    if (pollingTimer) {
      clearInterval(pollingTimer);
      pollingTimer = null;
    }
    deviceToken = token;
    localStorage.setItem('signage_device_token', deviceToken);
    showStatus('Ekran başarıyla eşleştirildi!');
    pairingScreen.classList.add('hidden');
    startPlayer();
  }

  // --- Main Player Logic ---
  async function startPlayer() {
    pairingScreen.classList.add('hidden');
    connectWebSocket();
    startHeartbeat();
    await fetchManifestAndSync();

    // Fallback polling every 30s in case WebSocket drops
    if (pollingTimer) clearInterval(pollingTimer);
    pollingTimer = setInterval(fetchManifestAndSync, 30000);
  }

  // WebSocket Connection for instant updates (PLR-2) and Live Playback Sync (SCR-6)
  function connectWebSocket() {
    if (!deviceToken) return;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const previewParam = isPreview ? '&preview=true' : '';
    const wsUrl = `${protocol}//${window.location.host}/ws/player?token=${encodeURIComponent(deviceToken)}${previewParam}`;

    try {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('Player WebSocket connected. isPreview:', isPreview);
        if (!isPreview) {
          sendHeartbeat();
        }
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.action === 'SYNC_MANIFEST') {
            console.log('Instant manifest sync triggered via WebSocket.');
            fetchManifestAndSync();
          } else if (msg.action === 'PLAYBACK_STATUS') {
            // Preview Client: synchronize immediately with the real TV!
            if (isPreview && playlistItems.length > 0) {
              const targetIdx = msg.currentIndex;
              if (targetIdx >= 0 && targetIdx < playlistItems.length && targetIdx !== currentIndex) {
                const elapsedSec = msg.startedAt ? Math.max(0, (Date.now() - msg.startedAt) / 1000) : 0;
                playItemAtIndex(targetIdx, elapsedSec);
              }
            }
          } else if (msg.action === 'UNPAIR') {
            handleUnpair();
          }
        } catch (e) {
          console.error('WS message error:', e);
        }
      };

      ws.onclose = () => {
        if (!isPreview) {
          console.log('WS closed. Reconnecting in 5s...');
          setTimeout(connectWebSocket, 5000);
        }
      };

      ws.onerror = (err) => {
        console.warn('WS error:', err);
      };
    } catch (e) {
      console.warn('WS create error:', e);
      if (!isPreview) setTimeout(connectWebSocket, 10000);
    }
  }

  function handleUnpair() {
    if (isPreview) return;
    localStorage.removeItem('signage_device_token');
    localStorage.removeItem('signage_screen_id');
    deviceToken = null;
    currentScreenId = null;
    if (itemTimer) clearTimeout(itemTimer);
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    if (pollingTimer) clearInterval(pollingTimer);
    window.location.reload();
  }

  // Heartbeat every 30s (PLR-4)
  function startHeartbeat() {
    if (isPreview) return;
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    heartbeatTimer = setInterval(sendHeartbeat, 30000);
  }

  function sendHeartbeat() {
    if (!deviceToken || isPreview) return;
    const currentItem = playlistItems[currentIndex];
    const payload = {
      action: 'HEARTBEAT',
      token: deviceToken,
      currentMedia: currentItem ? currentItem.media.title : null,
      playerVersion: '1.0.0'
    };

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    } else {
      fetch('/api/player/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => {});
    }
  }

  // Manifest Resolver & Sync
  async function fetchManifestAndSync() {
    if (!deviceToken) return;

    try {
      const res = await fetch(`/api/player/manifest?token=${encodeURIComponent(deviceToken)}`);
      if (res.status === 401 || res.status === 403) {
        handleUnpair();
        return;
      }

      if (!res.ok) throw new Error('Manifest alınamadı');

      const manifest = await res.json();
      applyManifest(manifest);
    } catch (err) {
      console.warn('Manifest fetch failed, continuing with cached playlist if any:', err);
      if (playlistItems.length > 0 && currentIndex === -1) {
        startSyncedPlayback();
      }
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
      currentIndex = -1;
      slotA.innerHTML = '';
      slotB.innerHTML = '';
      idleScreen.classList.remove('hidden');
    } else {
      idleScreen.classList.add('hidden');
      const assetUrls = playlistItems.map(item => item.media.url);
      precacheAssets(assetUrls);

      // Start synchronized playback (ensuring preview shows what TV is playing right now!)
      if (currentIndex === -1 || !itemTimer) {
        startSyncedPlayback();
      }
    }
  }

  /**
   * Starts playback synchronized with the physical TV or timeline wall-clock.
   * Prevents restarting from item 0 on preview!
   */
  async function startSyncedPlayback() {
    if (playlistItems.length === 0) return;

    if (isPreview) {
      try {
        const res = await fetch(`/api/player/live-status?token=${encodeURIComponent(deviceToken)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.live && data.state) {
            const elapsed = Math.max(0, (Date.now() - data.state.startedAt) / 1000);
            if (elapsed < data.state.duration && data.state.currentIndex < playlistItems.length) {
              console.log(`Preview: Synced with live TV at item ${data.state.currentIndex}, seek: ${elapsed.toFixed(1)}s`);
              playItemAtIndex(data.state.currentIndex, elapsed);
              return;
            }
          }
        }
      } catch (err) {
        console.warn('Could not fetch live-status, using wall-clock sync:', err);
      }
    }

    // Deterministic Timeline (Wall-Clock) Sync:
    // Guarantees all screens and previews without live socket are at the exact same item and second
    const totalDuration = playlistItems.reduce((acc, it) => acc + (it.duration || it.media.duration || 10), 0);
    if (totalDuration > 0) {
      const nowSec = Math.floor(Date.now() / 1000);
      const loopOffset = nowSec % totalDuration;
      let accum = 0;
      for (let i = 0; i < playlistItems.length; i++) {
        const itemDur = playlistItems[i].duration || playlistItems[i].media.duration || 10;
        if (loopOffset >= accum && loopOffset < accum + itemDur) {
          const elapsedInItem = loopOffset - accum;
          console.log(`Wall-clock sync: item ${i}, elapsed: ${elapsedInItem}s`);
          playItemAtIndex(i, elapsedInItem);
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

      // Report live playback to server so preview clients can follow
      if (!isPreview && ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          action: 'PLAYBACK_STATUS',
          token: deviceToken,
          currentIndex: currentIndex,
          mediaId: item.media.id,
          mediaTitle: item.media.title,
          startedAt: Date.now() - (seekSeconds * 1000),
          duration: durationSeconds
        }));
      }

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
    const nextIdx = (currentIndex + 1) % playlistItems.length;
    playItemAtIndex(nextIdx, 0);
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

  // --- Initialization ---
  function init() {
    registerServiceWorker();
    requestWakeLock();
    scheduleNightlyReload();

    updateClock();
    setInterval(updateClock, 1000);

    if (!deviceToken) {
      startPairingFlow();
    } else {
      startPlayer();
    }
  }

  window.addEventListener('DOMContentLoaded', init);
})();
