// Zamanlama ve Çakışma Motoru Birim Testi (Firebase sürümü)
// Admin tarafındaki bundle üretimi (client/src/lib/bundle.ts) + TV tarafındaki çözümleyici (player/resolver.js)
// uçtan uca eski sunucu ManifestResolver senaryolarıyla doğrulanır.
import assert from 'assert';
import { createRequire } from 'module';
import { buildDeviceNodes } from '../client/src/lib/bundle.ts';

const require = createRequire(import.meta.url);
const { resolveManifest } = require('../player/resolver.js');

const TOKEN = 'a'.repeat(48);
let seq = 0;
const ts = () => new Date(Date.UTC(2026, 0, 1, 0, 0, seq++)).toISOString();

const data = {
  groups: { g1: { name: 'Zemin Kat', createdAt: ts() } },
  screens: {
    s1: { name: 'Lobi TV', groupId: 'g1', deviceToken: TOKEN, isPaired: true, createdAt: ts() },
    s2: { name: 'Eşleşmemiş TV', groupId: 'g1', deviceToken: null, isPaired: false, createdAt: ts() }
  },
  media: {
    m1: { title: 'Kurum Tanıtım', type: 'IMAGE', url: 'https://x/m1.png', duration: 10, createdAt: ts() },
    m2: { title: 'Lobi Video', type: 'VIDEO', url: 'https://x/m2.mp4', duration: 15, createdAt: ts() },
    m3: { title: 'Öğle Menüsü', type: 'IMAGE', url: 'https://x/m3.png', duration: 8, createdAt: ts() }
  },
  playlists: {
    plGroupDefault: { name: 'Grup Varsayılan', items: [{ id: 'i1', mediaId: 'm1', order: 0, duration: 10 }], createdAt: ts(), updatedAt: ts() },
    plScreenDefault: { name: 'Ekran Varsayılan', items: [{ id: 'i2', mediaId: 'm2', order: 0, duration: 15 }], createdAt: ts(), updatedAt: ts() },
    plLunch: {
      name: 'Öğle Yayını',
      items: [
        { id: 'i4', mediaId: 'missing', order: 1, duration: 5 },
        { id: 'i3', mediaId: 'm3', order: 0, duration: 0 }
      ],
      createdAt: ts(),
      updatedAt: ts()
    }
  },
  assignments: {}
};

const resolveAt = (iso, emergency = null) => {
  const device = buildDeviceNodes(data)[TOKEN];
  return resolveManifest(device, emergency, new Date(iso));
};

let passed = 0;
function test(name, fn) {
  fn();
  passed++;
  console.log(`✓ ${name}`);
}

console.log('====================================================');
console.log(' Zamanlama ve Çakışma Motoru Birim Testi (Firebase) ');
console.log('====================================================');

test('Test 0: Atama yokken boş manifest', () => {
  const m = resolveAt('2026-10-21T10:00:00');
  assert.strictEqual(m.playlist, null);
  assert.strictEqual(m.hash, 'empty');
  assert.strictEqual(m.screenName, 'Lobi TV');
  assert.strictEqual(m.groupName, 'Zemin Kat');
});

test('Test 1: Grup varsayılan yayını aktif', () => {
  data.assignments.a1 = { playlistId: 'plGroupDefault', groupId: 'g1', isDefault: true, priority: 1, createdAt: ts() };
  assert.strictEqual(resolveAt('2026-10-21T10:00:00').playlist?.id, 'plGroupDefault');
});

test('Test 2: Ekran özel varsayılanı grup varsayılanını ezer', () => {
  data.assignments.a2 = { playlistId: 'plScreenDefault', screenId: 's1', isDefault: true, priority: 1, createdAt: ts() };
  assert.strictEqual(resolveAt('2026-10-21T10:00:00').playlist?.id, 'plScreenDefault');
});

test('Test 3: Zamanlanmış öğle yayını (12:00-13:30, hafta içi) varsayılanı ezer', () => {
  data.assignments.a3 = {
    playlistId: 'plLunch', groupId: 'g1', isDefault: false,
    startTime: '12:00', endTime: '13:30', daysOfWeek: '1,2,3,4,5', priority: 1, createdAt: ts()
  };
  const m = resolveAt('2026-10-21T12:30:00'); // Çarşamba
  assert.strictEqual(m.playlist?.id, 'plLunch');
  // Eksik medya atlanır, öğeler sıraya göre gelir, süre 0 ise medya süresine düşer
  assert.deepStrictEqual(m.playlist.items.map((i) => [i.id, i.duration]), [['i3', 8]]);
});

test('Test 4: Zaman penceresi bitince varsayılana döner (14:00)', () => {
  assert.strictEqual(resolveAt('2026-10-21T14:00:00').playlist?.id, 'plScreenDefault');
});

test('Test 5: Hafta sonu gün maskesi filtresi', () => {
  assert.strictEqual(resolveAt('2026-10-25T12:30:00').playlist?.id, 'plScreenDefault'); // Pazar
});

test('Test 6: Gece yarısını aşan aralık (22:00-02:00)', () => {
  data.assignments.a4 = { playlistId: 'plGroupDefault', screenId: 's1', isDefault: false, startTime: '22:00', endTime: '02:00', priority: 1, createdAt: ts() };
  assert.strictEqual(resolveAt('2026-10-21T23:30:00').playlist?.id, 'plGroupDefault');
  assert.strictEqual(resolveAt('2026-10-22T01:59:00').playlist?.id, 'plGroupDefault');
  assert.strictEqual(resolveAt('2026-10-22T02:00:00').playlist?.id, 'plScreenDefault');
  delete data.assignments.a4;
});

test('Test 7: Ekran zamanlı kuralı grup zamanlı kuralını ezer; öncelik sırası uygulanır', () => {
  data.assignments.a5 = { playlistId: 'plGroupDefault', screenId: 's1', isDefault: false, startTime: '12:00', endTime: '13:00', priority: 1, createdAt: ts() };
  assert.strictEqual(resolveAt('2026-10-21T12:30:00').playlist?.id, 'plGroupDefault');
  data.assignments.a6 = { playlistId: 'plLunch', screenId: 's1', isDefault: false, startTime: '12:00', endTime: '13:00', priority: 5, createdAt: '2025-01-01T00:00:00.000Z' };
  assert.strictEqual(resolveAt('2026-10-21T12:30:00').playlist?.id, 'plLunch');
  delete data.assignments.a5;
  delete data.assignments.a6;
});

test('Test 8: Tarih aralığı dışındaki kural devreye girmez', () => {
  data.assignments.a7 = {
    playlistId: 'plGroupDefault', screenId: 's1', isDefault: false,
    startDate: '2026-11-01T00:00:00.000Z', endDate: '2026-11-30T00:00:00.000Z', priority: 1, createdAt: ts()
  };
  assert.strictEqual(resolveAt('2026-10-21T10:00:00').playlist?.id, 'plScreenDefault');
  assert.strictEqual(resolveAt('2026-11-10T10:00:00').playlist?.id, 'plGroupDefault');
  delete data.assignments.a7;
});

test('Test 9: Acil durum her şeyi ezer, kalkınca yayına döner', () => {
  const m = resolveAt('2026-10-21T10:00:00', { active: true, title: 'Tahliye', message: 'Binayı terk edin', activatedAt: 123 });
  assert.strictEqual(m.playlist, null);
  assert.strictEqual(m.emergency.title, 'Tahliye');
  assert.strictEqual(m.hash, 'emergency-123');
  assert.strictEqual(resolveAt('2026-10-21T10:00:00', { active: false }).playlist?.id, 'plScreenDefault');
});

test('Test 10: Yalnızca eşleşmiş ekranlar için paket üretilir; hash içerik değişince değişir', () => {
  const nodes = buildDeviceNodes(data);
  assert.deepStrictEqual(Object.keys(nodes), [TOKEN]);
  const before = resolveAt('2026-10-21T10:00:00').hash;
  data.playlists.plScreenDefault.items[0].duration = 20;
  assert.notStrictEqual(resolveAt('2026-10-21T10:00:00').hash, before);
  data.media.m2.title = 'Yeni başlık';
  const afterTitle = resolveAt('2026-10-21T10:00:00').hash;
  data.media.m2.title = 'Lobi Video';
  assert.strictEqual(resolveAt('2026-10-21T10:00:00').hash, afterTitle, 'Başlık değişikliği yayını yeniden başlatmamalı');
});

test('Test 11: Paket JSON\'a undefined içermez (Realtime Database set() reddeder)', () => {
  const json = JSON.stringify(buildDeviceNodes(data), (_k, v) => {
    assert.notStrictEqual(v, undefined);
    return v;
  });
  assert.ok(json.length > 0);
});

console.log('====================================================');
console.log(` Tüm Zamanlama ve Çakışma Birim Testleri Geçti (${passed}/${passed}) `);
console.log('====================================================');
