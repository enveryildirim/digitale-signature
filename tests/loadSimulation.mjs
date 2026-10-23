// 10 TV Eşzamanlı Yük ve Anlık Sync Simülasyonu (Firebase sürümü)
// 10 gerçek player.js örneği aynı anda eşleşir; grup yayını değişikliği ve acil durum
// yayınının tüm ekranlara ulaşma süresi ölçülür.
import assert from 'assert';
import { FakeDb, startPlayer, until } from './harness.mjs';
import { buildDeviceNodes } from '../client/src/lib/bundle.ts';

const TV_COUNT = 10;
const db = new FakeDb();
const tvs = [];

const data = {
  groups: { g1: { name: 'Zemin Kat', createdAt: 'x' }, g2: { name: '1. Kat', createdAt: 'x' } },
  screens: {},
  media: {
    m1: { title: 'Tanıtım', type: 'IMAGE', url: 'https://cdn/m1.png', duration: 10, createdAt: 'x' },
    m2: { title: 'Menü', type: 'IMAGE', url: 'https://cdn/m2.png', duration: 10, createdAt: 'x' }
  },
  playlists: {
    p1: { name: 'Genel', items: [{ id: 'i1', mediaId: 'm1', order: 0, duration: 10 }], createdAt: 'x', updatedAt: 'x' },
    p2: { name: 'Zemin', items: [{ id: 'i2', mediaId: 'm2', order: 0, duration: 10 }], createdAt: 'x', updatedAt: 'x' }
  },
  assignments: {
    a1: { playlistId: 'p1', groupId: 'g1', isDefault: true, priority: 1, createdAt: 'x' },
    a2: { playlistId: 'p1', groupId: 'g2', isDefault: true, priority: 1, createdAt: 'x' }
  }
};

function publish() {
  for (const [token, node] of Object.entries(buildDeviceNodes(data))) {
    db.update(`devices/${token}`, { screenId: node.screenId, name: node.name, groupName: node.groupName, bundle: node.bundle });
  }
}

console.log('====================================================');
console.log(` ${TV_COUNT} TV Eşzamanlı Yük ve Anlık Sync Simülasyonu `);
console.log('====================================================');

try {
  let t0 = Date.now();
  for (let i = 0; i < TV_COUNT; i++) tvs.push(startPlayer(db));
  await until(() => tvs.every((tv) => /^[2-9A-HJ-NP-Z]{6}$/.test(tv.elements['pairing-code-display'].textContent)), { label: 'kodlar' });
  const codes = tvs.map((tv) => tv.elements['pairing-code-display'].textContent);
  assert.strictEqual(new Set(codes).size, TV_COUNT, 'Eşleştirme kodları benzersiz olmalı');
  console.log(`✓ ${TV_COUNT} TV eşleştirme kodu aldı (${Date.now() - t0} ms)`);

  t0 = Date.now();
  codes.forEach((code, i) => {
    const { token } = db.get(`pairing/${code}`);
    data.screens[`s${i}`] = { name: `TV ${i + 1}`, groupId: i < 5 ? 'g1' : 'g2', deviceToken: token, isPaired: true, createdAt: 'x' };
    db.set(`pairing/${code}`, null);
  });
  publish();
  await until(() => tvs.every((tv) => tv.activeMediaUrl() === 'https://cdn/m1.png'), { label: 'ilk yayın' });
  console.log(`✓ ${TV_COUNT} TV eşleşip yayına başladı (${Date.now() - t0} ms)`);

  t0 = Date.now();
  data.assignments.a1.playlistId = 'p2';
  publish();
  await until(() => tvs.slice(0, 5).every((tv) => tv.activeMediaUrl() === 'https://cdn/m2.png'), { label: 'grup sync' });
  assert.ok(tvs.slice(5).every((tv) => tv.activeMediaUrl() === 'https://cdn/m1.png'), 'Diğer kat etkilenmemeli');
  console.log(`✓ Zemin kat yayını 5 TV'de değişti, 1. kat etkilenmedi (${Date.now() - t0} ms)`);

  t0 = Date.now();
  db.set('emergency', { active: true, title: 'Yangın Tatbikatı', message: 'Toplanma alanına gidin', level: 'CRITICAL', activatedAt: Date.now() });
  const emergencyMs = await until(() => tvs.every((tv) => tv.isVisible('emergency-screen')), { label: 'acil durum' });
  console.log(`✓ Acil durum ${TV_COUNT} TV'ye ulaştı (${emergencyMs} ms)`);

  db.set('emergency', { active: false, title: '', message: '', level: 'CRITICAL', activatedAt: null });
  await until(() => tvs.every((tv) => !tv.isVisible('emergency-screen') && tv.activeMediaUrl()), { label: 'olağan yayın' });
  console.log(`✓ Tüm TV'ler olağan yayına döndü (${Date.now() - t0} ms toplam)`);

  const online = Object.values(db.get('telemetry') || {}).filter((t) => t.online && typeof t.lastSeen === 'number');
  assert.strictEqual(online.length, TV_COUNT, 'Tüm TV\'ler telemetry yazmalı');
  console.log(`✓ ${online.length}/${TV_COUNT} TV çevrimiçi (heartbeat), toplam TV yazma isteği: ${db.writes}`);

  const bundleBytes = JSON.stringify(db.get('devices')).length;
  console.log(`✓ ${TV_COUNT} TV yayın paketi toplam ${bundleBytes} bayt (Realtime Database bant genişliği için)`);

  console.log('====================================================');
  console.log(' Yük ve Anlık Sync Simülasyonu Başarılı ');
  console.log('====================================================');
} finally {
  tvs.forEach((tv) => tv.dispose());
}
