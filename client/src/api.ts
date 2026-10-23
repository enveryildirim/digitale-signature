import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { ref, onValue, get, update, push, serverTimestamp, Unsubscribe } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { getFirebase, getCurrentUser } from './firebase';
import { User, Screen, ScreenGroup, Media, Playlist, Assignment } from './types';
import {
  DbData, DbGroup, DbScreen, DbMedia, DbPlaylist, DbAssignment,
  buildDeviceNodes, playlistItems, sortAssignments
} from './lib/bundle';

// --- Live store -------------------------------------------------------------
// Admin paneli her 10 sn'de get*() çağırır; veriyi her seferinde indirmek yerine
// Realtime Database dinleyicileriyle canlı bir yerel kopya tutulur (bant genişliği kotası).

interface Telemetry {
  lastSeen?: number;
  online?: boolean;
  currentMedia?: string | null;
  playerVersion?: string | null;
}

interface PairingRequest {
  token: string;
  createdAt: number;
}

interface EmergencyState {
  active: boolean;
  title: string;
  message: string;
  level: string;
  activatedAt?: number | null;
}

interface Store extends DbData {
  emergency: EmergencyState | null;
  pairing: Record<string, PairingRequest>;
  telemetry: Record<string, Telemetry>;
}

const NODES = ['groups', 'screens', 'media', 'playlists', 'assignments', 'emergency', 'pairing', 'telemetry'] as const;
const OFFLINE_AFTER_MS = 90 * 1000;
const PAIRING_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_UPLOAD_BYTES = 200 * 1024 * 1024;
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/ogg'];

const store: Store = {
  groups: {}, screens: {}, media: {}, playlists: {}, assignments: {},
  emergency: null, pairing: {}, telemetry: {}
};
let storeReady: Promise<void> | null = null;
let unsubscribers: Unsubscribe[] = [];
let lastPublished: Record<string, string> = {};

function ensureStore(): Promise<void> {
  if (!storeReady) {
    storeReady = (async () => {
      const { db } = await getFirebase();
      await Promise.all(NODES.map((node) => new Promise<void>((resolve, reject) => {
        const unsub = onValue(ref(db, node), (snap) => {
          (store as any)[node] = snap.val() ?? (node === 'emergency' ? null : {});
          resolve();
        }, (err) => {
          storeReady = null;
          reject(err);
        });
        unsubscribers.push(unsub);
      })));
    })();
  }
  return storeReady;
}

function resetStore() {
  unsubscribers.forEach((u) => u());
  unsubscribers = [];
  storeReady = null;
  lastPublished = {};
}

function sessionExpired(): never {
  localStorage.removeItem('signage_auth_token');
  localStorage.removeItem('signage_user');
  window.location.reload();
  throw new Error('Oturum süresi doldu. Lütfen tekrar giriş yapın.');
}

async function ready() {
  const user = await getCurrentUser();
  if (!user) sessionExpired();
  try {
    await ensureStore();
  } catch (err: any) {
    if (String(err?.code || err?.message).toLowerCase().includes('permission')) sessionExpired();
    throw err;
  }
  const { db } = await getFirebase();
  return db;
}

const now = () => new Date().toISOString();

async function newKey(path: string): Promise<string> {
  const { db } = await getFirebase();
  return push(ref(db, path)).key!;
}

async function write(updates: Record<string, unknown>) {
  const db = await ready();
  await update(ref(db), updates);
}

// Recomputes every paired TV's bundle and writes only the ones that changed.
// TVs stream /devices/{token} and react instantly (eski WebSocket SYNC_MANIFEST karşılığı).
async function publish() {
  const db = await ready();
  const nodes = buildDeviceNodes(store);
  const updates: Record<string, unknown> = {};
  for (const [token, node] of Object.entries(nodes)) {
    const json = JSON.stringify(node);
    if (lastPublished[token] === json) continue;
    updates[`devices/${token}/screenId`] = node.screenId;
    updates[`devices/${token}/name`] = node.name;
    updates[`devices/${token}/groupName`] = node.groupName;
    updates[`devices/${token}/bundle`] = node.bundle;
    lastPublished[token] = json;
  }
  if (Object.keys(updates).length > 0) {
    await update(ref(db), updates);
  }
}

async function mutate(updates: Record<string, unknown>) {
  await write(updates);
  await publish();
}

// --- Joins (eski REST yanıtlarıyla aynı şekil) ------------------------------

function screenStatus(token?: string | null): Pick<Screen, 'status' | 'lastSeen' | 'currentMedia' | 'playerVersion'> {
  const t = token ? store.telemetry[token] : undefined;
  const online = Boolean(t?.lastSeen && t.online !== false && Date.now() - t.lastSeen < OFFLINE_AFTER_MS);
  return {
    status: online ? 'ONLINE' : 'OFFLINE',
    lastSeen: t?.lastSeen ? new Date(t.lastSeen).toISOString() : null,
    currentMedia: t?.currentMedia || null,
    playerVersion: t?.playerVersion || null
  };
}

function playlistRef(id: string) {
  const p = store.playlists[id];
  return p ? ({ id, name: p.name } as Playlist) : undefined;
}

function toAssignment(id: string, a: DbAssignment): Assignment {
  return {
    id,
    playlistId: a.playlistId,
    screenId: a.screenId || null,
    groupId: a.groupId || null,
    isDefault: Boolean(a.isDefault),
    daysOfWeek: a.daysOfWeek || null,
    startTime: a.startTime || null,
    endTime: a.endTime || null,
    startDate: a.startDate || null,
    endDate: a.endDate || null,
    priority: a.priority || 1,
    createdAt: a.createdAt
  };
}

function assignmentsWhere(pred: (a: DbAssignment) => boolean): Assignment[] {
  return Object.entries(store.assignments)
    .filter(([, a]) => pred(a))
    .map(([id, a]) => ({ ...toAssignment(id, a), playlist: playlistRef(a.playlistId) }));
}

function toGroup(id: string, g: DbGroup): ScreenGroup {
  return { id, name: g.name, description: g.description || undefined, createdAt: g.createdAt };
}

function toMedia(id: string, m: DbMedia): Media {
  return {
    id,
    title: m.title,
    type: m.type,
    url: m.url,
    mimeType: m.mimeType || null,
    fileSize: m.fileSize ?? null,
    duration: m.duration,
    createdAt: m.createdAt
  };
}

function toPlaylist(id: string, p: DbPlaylist): Playlist {
  const items = playlistItems(p).flatMap((item) => {
    const m = store.media[item.mediaId];
    return m ? [{ ...item, playlistId: id, media: toMedia(item.mediaId, m) }] : [];
  });
  return {
    id,
    name: p.name,
    description: p.description || undefined,
    items,
    assignments: assignmentsWhere((a) => a.playlistId === id).map(({ playlist: _p, ...a }) => a),
    totalDuration: items.reduce((sum, item) => sum + (item.duration || item.media.duration || 10), 0),
    itemCount: items.length,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt
  };
}

function toScreen(id: string, s: DbScreen): Screen {
  const g = s.groupId ? store.groups[s.groupId] : undefined;
  return {
    id,
    name: s.name,
    pairingCode: null,
    deviceToken: s.deviceToken || null,
    isPaired: Boolean(s.isPaired),
    groupId: s.groupId || null,
    group: g && s.groupId
      ? { ...toGroup(s.groupId, g), assignments: assignmentsWhere((a) => a.groupId === s.groupId && a.isDefault) }
      : null,
    ipAddress: null,
    assignments: assignmentsWhere((a) => a.screenId === id),
    createdAt: s.createdAt,
    ...screenStatus(s.isPaired ? s.deviceToken : null)
  };
}

// Pairing requests written by TVs show up as unpaired screens (eski /register kayıtları gibi)
const PAIRING_PREFIX = 'pairing:';

function pendingScreens(): Screen[] {
  return Object.entries(store.pairing)
    .filter(([, p]) => p && Date.now() - p.createdAt < PAIRING_TTL_MS)
    .map(([code, p]) => ({
      id: `${PAIRING_PREFIX}${code}`,
      name: 'Yeni TV',
      pairingCode: code,
      isPaired: false,
      status: 'OFFLINE' as const,
      createdAt: new Date(p.createdAt).toISOString()
    }));
}

function cascadeAssignments(pred: (a: DbAssignment) => boolean, updates: Record<string, unknown>) {
  for (const [id, a] of Object.entries(store.assignments)) {
    if (pred(a)) updates[`assignments/${id}`] = null;
  }
}

async function quickAssign(target: { screenId?: string; groupId?: string }, playlistId: string | null) {
  const match = (a: DbAssignment) => a.isDefault && (target.screenId ? a.screenId === target.screenId : a.groupId === target.groupId);
  const existing = Object.entries(store.assignments).find(([, a]) => match(a));
  const updates: Record<string, unknown> = {};
  let assignment: Assignment | undefined;

  if (playlistId) {
    if (existing) {
      updates[`assignments/${existing[0]}/playlistId`] = playlistId;
      updates[`assignments/${existing[0]}/updatedAt`] = now();
      assignment = toAssignment(existing[0], { ...existing[1], playlistId });
    } else {
      const id = await newKey('assignments');
      const data: DbAssignment = {
        playlistId,
        screenId: target.screenId || null,
        groupId: target.groupId || null,
        isDefault: true,
        priority: 1,
        createdAt: now(),
        updatedAt: now()
      };
      updates[`assignments/${id}`] = data;
      assignment = toAssignment(id, data);
    }
  } else {
    cascadeAssignments(match, updates);
  }
  await mutate(updates);
  return assignment;
}

// --- Media helpers ----------------------------------------------------------

function escapeXml(text: string) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function uploadFile(file: Blob, name: string, contentType: string) {
  if (!ALLOWED_MIMES.includes(contentType.toLowerCase()) && contentType !== 'image/svg+xml') {
    throw new Error('Desteklenmeyen dosya türü. Yalnızca JPG, PNG, WebP ve MP4/WebM yükleyebilirsiniz.');
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error('Dosya boyutu 200 MB sınırını aşıyor.');
  }
  const { storage } = await getFirebase();
  const ext = (name.match(/\.[a-z0-9]+$/i)?.[0] || '').toLowerCase();
  const unique = Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) => b.toString(16).padStart(2, '0')).join('');
  const storagePath = `media/${Date.now()}-${unique}${ext}`;
  const objectRef = storageRef(storage, storagePath);
  await uploadBytes(objectRef, file, { contentType, cacheControl: 'public, max-age=31536000' });
  return { url: await getDownloadURL(objectRef), storagePath };
}

async function removeStorageObject(path?: string | null) {
  if (!path) return;
  try {
    const { storage } = await getFirebase();
    await deleteObject(storageRef(storage, path));
  } catch (e) {
    console.warn('Could not delete file from storage:', e);
  }
}

function fileFields(file: File) {
  const isVideo = file.type.startsWith('video/');
  return { type: (isVideo ? 'VIDEO' : 'IMAGE') as DbMedia['type'], mimeType: file.type, fileSize: file.size, isVideo };
}

function parseDuration(value: unknown, fallback: number) {
  const parsed = parseInt(String(value ?? ''), 10);
  return !isNaN(parsed) && parsed > 0 ? parsed : fallback;
}

function toIsoDate(value?: string | null) {
  return value ? new Date(value).toISOString() : null;
}

// --- Public API (eski REST istemcisiyle aynı imzalar) -----------------------

export const api = {
  // Auth
  login: async (credentials: { username: string; password: string }): Promise<{ token: string; user: User }> => {
    const { auth, db } = await getFirebase();
    try {
      const cred = await signInWithEmailAndPassword(auth, credentials.username.trim(), credentials.password);
      const isAdmin = await get(ref(db, `admins/${cred.user.uid}`)).then((s) => s.exists()).catch(() => false);
      if (!isAdmin) {
        await signOut(auth);
        throw new Error('Bu hesap yönetici olarak tanımlı değil.');
      }
      const email = cred.user.email || credentials.username;
      return {
        token: cred.user.uid,
        user: { id: cred.user.uid, username: email, name: cred.user.displayName || email, role: 'ADMIN', email }
      };
    } catch (err: any) {
      if (err?.code?.startsWith('auth/')) throw new Error('E-posta veya parola hatalı.');
      throw err;
    }
  },
  logout: async () => {
    resetStore();
    const { auth } = await getFirebase();
    await signOut(auth);
  },

  // Screens
  getScreens: async (): Promise<Screen[]> => {
    await ready();
    const paired = Object.entries(store.screens).map(([id, s]) => toScreen(id, s));
    return [...paired, ...pendingScreens()].sort((a, b) =>
      Number(b.isPaired) - Number(a.isPaired) || b.createdAt.localeCompare(a.createdAt)
    );
  },
  getScreen: async (id: string): Promise<Screen> => {
    await ready();
    const s = store.screens[id];
    if (!s) throw new Error('Ekran bulunamadı.');
    return toScreen(id, s);
  },
  pairScreen: async (data: { pairingCode: string; name: string; groupId?: string }) => {
    const db = await ready();
    const code = data.pairingCode.toUpperCase().trim();
    if (!code) throw new Error('Eşleştirme kodu zorunludur.');
    const snap = await get(ref(db, `pairing/${code}`));
    const request = snap.val() as PairingRequest | null;
    if (!request?.token || Date.now() - request.createdAt > PAIRING_TTL_MS) {
      throw new Error('Geçersiz veya süresi dolmuş eşleştirme kodu.');
    }
    const id = await newKey('screens');
    const screen: DbScreen = {
      name: data.name?.trim() || 'Yeni TV',
      groupId: data.groupId || null,
      deviceToken: request.token,
      isPaired: true,
      createdAt: now(),
      updatedAt: now()
    };
    await mutate({ [`screens/${id}`]: screen, [`pairing/${code}`]: null });
    return { message: 'Ekran başarıyla eşleştirildi.', screen: toScreen(id, screen), deviceToken: request.token };
  },
  updateScreen: async (id: string, data: { name?: string; groupId?: string | null }) => {
    await ready();
    if (!store.screens[id]) throw new Error('Ekran bulunamadı.');
    const updates: Record<string, unknown> = { [`screens/${id}/updatedAt`]: now() };
    if (data.name) updates[`screens/${id}/name`] = data.name.trim();
    if (data.groupId !== undefined) updates[`screens/${id}/groupId`] = data.groupId || null;
    await mutate(updates);
    return toScreen(id, store.screens[id]);
  },
  unpairScreen: async (id: string) => {
    await ready();
    const s = store.screens[id];
    if (!s) throw new Error('Ekran bulunamadı.');
    const updates: Record<string, unknown> = {
      [`screens/${id}/isPaired`]: false,
      [`screens/${id}/deviceToken`]: null,
      [`screens/${id}/updatedAt`]: now()
    };
    if (s.deviceToken) {
      // TV, /devices/{token} silinince eşleştirme ekranına döner
      updates[`devices/${s.deviceToken}`] = null;
      updates[`telemetry/${s.deviceToken}`] = null;
      delete lastPublished[s.deviceToken];
    }
    await mutate(updates);
    return { message: 'Ekran eşleştirmesi kaldırıldı.', screen: toScreen(id, store.screens[id]) };
  },
  deleteScreen: async (id: string) => {
    await ready();
    if (id.startsWith(PAIRING_PREFIX)) {
      await write({ [`pairing/${id.slice(PAIRING_PREFIX.length)}`]: null });
      return { message: 'Ekran silindi.' };
    }
    const s = store.screens[id];
    if (!s) throw new Error('Ekran bulunamadı.');
    const updates: Record<string, unknown> = { [`screens/${id}`]: null };
    if (s.deviceToken) {
      updates[`devices/${s.deviceToken}`] = null;
      updates[`telemetry/${s.deviceToken}`] = null;
      delete lastPublished[s.deviceToken];
    }
    cascadeAssignments((a) => a.screenId === id, updates);
    await mutate(updates);
    return { message: 'Ekran silindi.' };
  },
  syncScreen: async (id: string) => {
    await ready();
    const token = store.screens[id]?.deviceToken;
    if (token) await write({ [`devices/${token}/sync`]: serverTimestamp() });
    return { message: 'Yenileme sinyali gönderildi.' };
  },
  quickAssignScreen: async (id: string, playlistId: string | null) => {
    await ready();
    if (!store.screens[id]) throw new Error('Ekran bulunamadı.');
    const playlist = playlistId ? store.playlists[playlistId] : null;
    if (playlistId && !playlist) throw new Error('Playlist bulunamadı.');
    const assignment = await quickAssign({ screenId: id }, playlistId);
    return playlist
      ? { message: `Yayın '${playlist.name}' olarak ayarlandı.`, assignment }
      : { message: 'Ekrana özel yayın kaldırıldı, kat yayınına dönüldü.' };
  },
  syncAllScreens: async () => {
    await ready();
    const updates: Record<string, unknown> = {};
    for (const s of Object.values(store.screens)) {
      if (s.isPaired && s.deviceToken) updates[`devices/${s.deviceToken}/sync`] = serverTimestamp();
    }
    if (Object.keys(updates).length > 0) await write(updates);
    return { message: 'Tüm ekranlara yenileme sinyali iletildi.' };
  },
  getEmergencyStatus: async () => {
    await ready();
    const e = store.emergency;
    return { active: Boolean(e?.active), title: e?.title || '', message: e?.message || '', level: e?.level || 'CRITICAL' };
  },
  activateEmergency: async (data: { title: string; message: string; level?: string }) => {
    if (!data.title || !data.message) throw new Error('Acil durum başlığı ve mesajı zorunludur.');
    const state: EmergencyState = {
      active: true,
      title: data.title.trim(),
      message: data.message.trim(),
      level: data.level || 'CRITICAL',
      activatedAt: Date.now()
    };
    await write({ emergency: state });
    return { message: 'Acil durum yayını tüm TV ekranlarına basıldı.', state };
  },
  deactivateEmergency: async () => {
    const state: EmergencyState = { active: false, title: '', message: '', level: 'CRITICAL', activatedAt: null };
    await write({ emergency: state });
    return { message: 'Acil durum yayını kaldırıldı, olağan yayına dönüldü.', state };
  },

  // Groups
  getGroups: async (): Promise<ScreenGroup[]> => {
    await ready();
    return Object.entries(store.groups)
      .map(([id, g]) => ({
        ...toGroup(id, g),
        screens: Object.entries(store.screens)
          .filter(([, s]) => s.groupId === id)
          .map(([sid, s]) => ({ id: sid, name: s.name, isPaired: Boolean(s.isPaired), status: screenStatus(s.deviceToken).status } as Screen)),
        assignments: assignmentsWhere((a) => a.groupId === id)
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'tr'));
  },
  createGroup: async (data: { name: string; description?: string }) => {
    await ready();
    const name = data.name?.trim();
    if (!name) throw new Error('Grup adı zorunludur.');
    if (Object.values(store.groups).some((g) => g.name === name)) throw new Error('Bu isimde bir grup zaten mevcut.');
    const id = await newKey('groups');
    const group: DbGroup = { name, description: data.description?.trim() || null, createdAt: now(), updatedAt: now() };
    await write({ [`groups/${id}`]: group });
    return toGroup(id, group);
  },
  updateGroup: async (id: string, data: { name?: string; description?: string }) => {
    await ready();
    if (!store.groups[id]) throw new Error('Grup bulunamadı.');
    const updates: Record<string, unknown> = { [`groups/${id}/updatedAt`]: now() };
    if (data.name) updates[`groups/${id}/name`] = data.name.trim();
    if (data.description !== undefined) updates[`groups/${id}/description`] = data.description?.trim() || null;
    await mutate(updates);
    return toGroup(id, store.groups[id]);
  },
  deleteGroup: async (id: string) => {
    await ready();
    const updates: Record<string, unknown> = { [`groups/${id}`]: null };
    for (const [sid, s] of Object.entries(store.screens)) {
      if (s.groupId === id) updates[`screens/${sid}/groupId`] = null;
    }
    cascadeAssignments((a) => a.groupId === id, updates);
    await mutate(updates);
    return { message: 'Grup silindi.' };
  },
  quickAssignGroup: async (id: string, playlistId: string | null) => {
    await ready();
    const group = store.groups[id];
    if (!group) throw new Error('Grup bulunamadı.');
    const playlist = playlistId ? store.playlists[playlistId] : null;
    if (playlistId && !playlist) throw new Error('Playlist bulunamadı.');
    const assignment = await quickAssign({ groupId: id }, playlistId);
    return playlist
      ? { message: `${group.name} katı yayını '${playlist.name}' olarak güncellendi.`, assignment }
      : { message: `${group.name} katı varsayılan yayını kaldırıldı.` };
  },

  // Media
  getMedia: async (): Promise<Media[]> => {
    await ready();
    const usage: Record<string, number> = {};
    for (const p of Object.values(store.playlists)) {
      for (const item of playlistItems(p)) usage[item.mediaId] = (usage[item.mediaId] || 0) + 1;
    }
    return Object.entries(store.media)
      .map(([id, m]) => ({ ...toMedia(id, m), _count: { items: usage[id] || 0 } }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  uploadMedia: async (formData: FormData) => {
    await ready();
    const file = formData.get('file');
    if (!(file instanceof File)) throw new Error('Dosya yüklenmedi.');
    const { type, mimeType, fileSize, isVideo } = fileFields(file);
    const { url, storagePath } = await uploadFile(file, file.name, file.type);
    const id = await newKey('media');
    const media: DbMedia = {
      title: String(formData.get('title') || '').trim() || file.name,
      type, url, storagePath, mimeType, fileSize,
      duration: parseDuration(formData.get('duration'), isVideo ? 15 : 10),
      createdAt: now(),
      updatedAt: now()
    };
    await write({ [`media/${id}`]: media });
    return toMedia(id, media);
  },
  addUrlMedia: async (data: { title: string; url: string; duration?: number }) => {
    await ready();
    if (!data.title || !data.url) throw new Error('Başlık ve URL zorunludur.');
    try {
      new URL(data.url);
    } catch {
      throw new Error('Geçersiz URL formatı.');
    }
    const id = await newKey('media');
    const media: DbMedia = {
      title: data.title.trim(),
      type: 'URL',
      url: data.url.trim(),
      duration: parseDuration(data.duration, 15),
      createdAt: now(),
      updatedAt: now()
    };
    await write({ [`media/${id}`]: media });
    return toMedia(id, media);
  },
  // MED-6: Başlık + metin + arka plan rengi ile vektörel SVG duyuru
  createTextAnnouncement: async (data: { title: string; message: string; bgColor?: string; textColor?: string; duration?: number }) => {
    await ready();
    if (!data.title || !data.message) throw new Error('Duyuru başlığı ve metni zorunludur.');
    const bg = escapeXml(data.bgColor || '#0f172a');
    const fg = escapeXml(data.textColor || '#ffffff');
    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${bg};stop-opacity:1" />
      <stop offset="100%" style="stop-color:#000000;stop-opacity:0.8" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#grad)" />
  <rect x="80" y="80" width="1760" height="920" rx="30" fill="none" stroke="${fg}" stroke-opacity="0.2" stroke-width="3" />
  <foreignObject x="140" y="140" width="1640" height="800">
    <div xmlns="http://www.w3.org/1999/xhtml" style="display:flex;flex-direction:column;justify-content:center;height:100%;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;color:${fg};text-align:center;box-sizing:border-box;padding:40px;">
      <div style="font-size:32px;font-weight:700;text-transform:uppercase;letter-spacing:4px;color:#38bdf8;margin-bottom:30px;">
        Kurum İçi Duyuru
      </div>
      <h1 style="font-size:72px;font-weight:800;margin:0 0 40px 0;line-height:1.2;text-shadow:0 4px 20px rgba(0,0,0,0.6);">
        ${escapeXml(data.title)}
      </h1>
      <p style="font-size:42px;font-weight:400;line-height:1.5;margin:0;opacity:0.9;max-width:1400px;margin:0 auto;text-shadow:0 2px 10px rgba(0,0,0,0.5);">
        ${escapeXml(data.message)}
      </p>
    </div>
  </foreignObject>
</svg>`;
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const { url, storagePath } = await uploadFile(blob, 'announcement.svg', 'image/svg+xml');
    const id = await newKey('media');
    const media: DbMedia = {
      title: data.title.trim(),
      type: 'IMAGE',
      url,
      storagePath,
      mimeType: 'image/svg+xml',
      fileSize: blob.size,
      duration: parseDuration(data.duration, 12),
      createdAt: now(),
      updatedAt: now()
    };
    await write({ [`media/${id}`]: media });
    return toMedia(id, media);
  },
  updateMedia: async (id: string, data: { title?: string; duration?: number; url?: string } | FormData) => {
    await ready();
    const existing = store.media[id];
    if (!existing) throw new Error('Medya bulunamadı.');
    const isForm = data instanceof FormData;
    const title = isForm ? data.get('title') : data.title;
    const duration = isForm ? data.get('duration') : data.duration;
    const url = isForm ? data.get('url') : data.url;
    const file = isForm ? data.get('file') : null;

    const patch: Partial<DbMedia> = { updatedAt: now() };
    if (typeof title === 'string' && title.trim()) patch.title = title.trim();
    if (duration !== undefined && duration !== null) {
      const parsed = parseDuration(duration, 0);
      if (parsed > 0) patch.duration = parsed;
    }
    if (file instanceof File) {
      // Replace file: upload new, then delete old object
      const { type, mimeType, fileSize } = fileFields(file);
      const uploaded = await uploadFile(file, file.name, file.type);
      Object.assign(patch, { type, mimeType, fileSize, url: uploaded.url, storagePath: uploaded.storagePath });
      await removeStorageObject(existing.storagePath);
    } else if (typeof url === 'string' && url.trim()) {
      try {
        new URL(url.trim());
      } catch {
        throw new Error('Geçersiz URL formatı.');
      }
      patch.url = url.trim();
    }

    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(patch)) updates[`media/${id}/${key}`] = value;
    await mutate(updates);
    return toMedia(id, store.media[id]);
  },
  deleteMedia: async (id: string) => {
    await ready();
    const media = store.media[id];
    if (!media) throw new Error('Medya bulunamadı.');
    const updates: Record<string, unknown> = { [`media/${id}`]: null };
    // Playlist öğeleri medyayla birlikte silinir (eski onDelete: Cascade)
    for (const [pid, p] of Object.entries(store.playlists)) {
      const items = playlistItems(p);
      const kept = items.filter((item) => item.mediaId !== id);
      if (kept.length !== items.length) {
        updates[`playlists/${pid}/items`] = kept.map((item, order) => ({ ...item, order }));
      }
    }
    await mutate(updates);
    await removeStorageObject(media.storagePath);
    return { message: 'Medya silindi.' };
  },

  // Playlists
  getPlaylists: async (): Promise<Playlist[]> => {
    await ready();
    return Object.entries(store.playlists)
      .map(([id, p]) => toPlaylist(id, p))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },
  getPlaylist: async (id: string): Promise<Playlist> => {
    await ready();
    const p = store.playlists[id];
    if (!p) throw new Error('Playlist bulunamadı.');
    return toPlaylist(id, p);
  },
  createPlaylist: async (data: { name: string; description?: string; items?: Array<{ mediaId: string; duration: number }> }) => {
    await ready();
    if (!data.name || !data.name.trim()) throw new Error('Playlist adı zorunludur.');
    const id = await newKey('playlists');
    const playlist: DbPlaylist = {
      name: data.name.trim(),
      description: data.description?.trim() || null,
      items: await toItems(data.items || []),
      createdAt: now(),
      updatedAt: now()
    };
    await write({ [`playlists/${id}`]: playlist });
    return toPlaylist(id, playlist);
  },
  updatePlaylist: async (id: string, data: { name?: string; description?: string; items?: Array<{ mediaId: string; duration: number }> }) => {
    await ready();
    if (!store.playlists[id]) throw new Error('Playlist bulunamadı.');
    const updates: Record<string, unknown> = { [`playlists/${id}/updatedAt`]: now() };
    if (data.name) updates[`playlists/${id}/name`] = data.name.trim();
    if (data.description !== undefined) updates[`playlists/${id}/description`] = data.description?.trim() || null;
    if (Array.isArray(data.items)) updates[`playlists/${id}/items`] = await toItems(data.items);
    await mutate(updates);
    return toPlaylist(id, store.playlists[id]);
  },
  deletePlaylist: async (id: string) => {
    await ready();
    const updates: Record<string, unknown> = { [`playlists/${id}`]: null };
    cascadeAssignments((a) => a.playlistId === id, updates);
    await mutate(updates);
    return { message: 'Playlist silindi.' };
  },

  // Assignments / Scheduling
  getAssignments: async (): Promise<Assignment[]> => {
    await ready();
    const list = Object.entries(store.assignments).map(([id, a]) => {
      const screen = a.screenId ? store.screens[a.screenId] : undefined;
      const group = a.groupId ? store.groups[a.groupId] : undefined;
      return {
        ...toAssignment(id, a),
        playlist: playlistRef(a.playlistId),
        screen: screen && a.screenId ? ({ id: a.screenId, name: screen.name, groupId: screen.groupId || null } as Screen) : null,
        group: group && a.groupId ? ({ id: a.groupId, name: group.name } as ScreenGroup) : null
      };
    });
    return sortAssignments(list).sort((a, b) => Number(a.isDefault) - Number(b.isDefault));
  },
  createAssignment: async (data: Partial<Assignment>) => {
    await ready();
    if (!data.playlistId) throw new Error('Playlist seçimi zorunludur.');
    if (!data.screenId && !data.groupId) throw new Error('Hedef ekran veya kat grubu seçilmelidir.');
    const id = await newKey('assignments');
    const assignment: DbAssignment = {
      playlistId: data.playlistId,
      screenId: data.screenId || null,
      groupId: data.groupId || null,
      isDefault: Boolean(data.isDefault),
      daysOfWeek: data.daysOfWeek || null,
      startTime: data.startTime || null,
      endTime: data.endTime || null,
      startDate: toIsoDate(data.startDate),
      endDate: toIsoDate(data.endDate),
      priority: parseDuration(data.priority, 1),
      createdAt: now(),
      updatedAt: now()
    };
    await mutate({ [`assignments/${id}`]: assignment });
    return toAssignment(id, assignment);
  },
  updateAssignment: async (id: string, data: Partial<Assignment>) => {
    await ready();
    const existing = store.assignments[id];
    if (!existing) throw new Error('Atama bulunamadı.');
    const next: DbAssignment = {
      ...existing,
      playlistId: data.playlistId || existing.playlistId,
      screenId: data.screenId !== undefined ? data.screenId || null : existing.screenId || null,
      groupId: data.groupId !== undefined ? data.groupId || null : existing.groupId || null,
      isDefault: data.isDefault !== undefined ? Boolean(data.isDefault) : existing.isDefault,
      daysOfWeek: data.daysOfWeek !== undefined ? data.daysOfWeek || null : existing.daysOfWeek || null,
      startTime: data.startTime !== undefined ? data.startTime || null : existing.startTime || null,
      endTime: data.endTime !== undefined ? data.endTime || null : existing.endTime || null,
      startDate: data.startDate ? toIsoDate(data.startDate) : existing.startDate || null,
      endDate: data.endDate ? toIsoDate(data.endDate) : existing.endDate || null,
      priority: data.priority ? parseDuration(data.priority, 1) : existing.priority,
      updatedAt: now()
    };
    await mutate({ [`assignments/${id}`]: next });
    return toAssignment(id, next);
  },
  deleteAssignment: async (id: string) => {
    await ready();
    if (!store.assignments[id]) throw new Error('Atama bulunamadı.');
    await mutate({ [`assignments/${id}`]: null });
    return { message: 'Atama silindi.' };
  }
};

async function toItems(items: Array<{ mediaId: string; duration: number }>) {
  return Promise.all(items.map(async (item, order) => ({
    id: await newKey('playlistItems'),
    mediaId: item.mediaId,
    order,
    duration: item.duration || 10
  })));
}
