// Eşleştirme ve Player Entegrasyon Testi (Firebase sürümü)
// Gerçek player.js, FakeDb (Realtime Database REST/EventSource + TV yazma kuralları) üzerinde koşturulur.
// Admin tarafı, client/src/lib/bundle.ts ile aynı paketleri üretip yazar.
import assert from 'assert';
import { FakeDb, startPlayer, until } from './harness.mjs';
import { buildDeviceNodes } from '../client/src/lib/bundle.ts';

const db = new FakeDb();
const players = [];
const boot = (opts) => {
  const p = startPlayer(db, opts);
  players.push(p);
  return p;
};

const data = {
  groups: {},
  screens: {},
  media: {
    m1: { title: 'Tanıtım', type: 'IMAGE', url: 'https://cdn/m1.png', duration: 10, createdAt: '2026-01-01T00:00:00.000Z' },
    m2: { title: 'Video', type: 'VIDEO', url: 'https://cdn/m2.mp4', duration: 15, createdAt: '2026-01-01T00:00:01.000Z' }
  },
  playlists: {
    p1: { name: 'Sabah', items: [{ id: 'i1', mediaId: 'm1', order: 0, duration: 10 }], createdAt: 'x', updatedAt: 'x' },
    p2: { name: 'Öğle', items: [{ id: 'i2', mediaId: 'm2', order: 0, duration: 15 }], createdAt: 'x', updatedAt: 'x' }
  },
  assignments: {}
};

// api.ts publish() karşılığı
function publish() {
  for (const [token, node] of Object.entries(buildDeviceNodes(data))) {
    db.update(`devices/${token}`, { screenId: node.screenId, name: node.name, groupName: node.groupName, bundle: node.bundle });
  }
}

// api.ts pairScreen() karşılığı
function adminPair(code, screenId, name) {
  const request = db.get(`pairing/${code}`);
  assert.ok(request?.token, 'Eşleştirme kodu veritabanında bulunamadı');
  data.screens[screenId] = { name, groupId: null, deviceToken: request.token, isPaired: true, createdAt: new Date().toISOString() };
  db.set(`pairing/${code}`, null);
  publish();
  return request.token;
}

let passed = 0;
async function test(name, fn) {
  await fn();
  passed++;
  console.log(`✓ ${name}`);
}

console.log('====================================================');
console.log(' Eşleştirme ve Player Entegrasyon Testi (Firebase) ');
console.log('====================================================');

let tv, token, code;

try {
  await test('Test 1: Eşleşmemiş TV kod üretir ve /pairing altına kaydeder', async () => {
    tv = boot();
    await until(() => /^[2-9A-HJ-NP-Z]{6}$/.test(tv.elements['pairing-code-display'].textContent), { label: 'pairing kodu' });
    code = tv.elements['pairing-code-display'].textContent;
    const req = db.get(`pairing/${code}`);
    assert.match(req.token, /^[0-9a-f]{48}$/);
    assert.strictEqual(typeof req.createdAt, 'number', 'createdAt sunucu zaman damgası olmalı');
    assert.ok(tv.isVisible('pairing-screen'));
  });

  await test('Test 2: Aynı kod ikinci kez yazılamaz (kural: !data.exists())', async () => {
    const res = await db.fetch(`${'https://signage-test-default-rtdb.firebaseio.com'}/pairing/${code}.json`, {
      method: 'PUT',
      body: JSON.stringify({ token: 'b'.repeat(48), createdAt: { '.sv': 'timestamp' } })
    });
    assert.strictEqual(res.status, 401);
  });

  await test('Test 3: Eşleşmemiş TV telemetry yazamaz', async () => {
    const res = await db.fetch(`https://signage-test-default-rtdb.firebaseio.com/telemetry/${'c'.repeat(48)}.json`, {
      method: 'PATCH',
      body: JSON.stringify({ online: true })
    });
    assert.strictEqual(res.status, 401);
  });

  await test('Test 4: Admin kodu girince TV anında eşleşir ve atanan yayını oynatır', async () => {
    token = adminPair(code, 's1', 'Lobi TV');
    data.assignments.a1 = { playlistId: 'p1', screenId: 's1', isDefault: true, priority: 1, createdAt: 'x' };
    publish();
    await until(() => tv.activeMediaUrl() === 'https://cdn/m1.png', { label: 'ilk medya' });
    assert.ok(!tv.isVisible('pairing-screen'));
    assert.ok(!tv.isVisible('idle-screen'));
    assert.strictEqual(tv.storage.get('signage_paired'), '1');
    assert.strictEqual(db.get(`pairing/${code}`), null, 'Kullanılan kod silinmeli');
  });

  await test('Test 5: TV heartbeat ve canlı oynatma durumunu telemetry\'ye yazar', async () => {
    await until(() => db.get(`telemetry/${token}/playback`), { label: 'playback' });
    const t = db.get(`telemetry/${token}`);
    assert.strictEqual(t.online, true);
    assert.strictEqual(typeof t.lastSeen, 'number');
    assert.strictEqual(t.playerVersion, '2.0.0');
    assert.strictEqual(t.currentMedia, 'Tanıtım');
    assert.strictEqual(t.playback.mediaId, 'm1');
  });

  await test('Test 6: Playlist değişikliği WebSocket olmadan anında TV\'ye ulaşır', async () => {
    data.assignments.a1.playlistId = 'p2';
    publish();
    await until(() => tv.activeMediaUrl() === 'https://cdn/m2.mp4', { label: 'yeni medya' });
  });

  await test('Test 7: Acil durum anında basılır, kaldırılınca yayın kaldığı yerden döner', async () => {
    db.set('emergency', { active: true, title: 'Tahliye', message: 'Binayı terk edin', level: 'CRITICAL', activatedAt: Date.now() });
    await until(() => tv.isVisible('emergency-screen'), { label: 'acil durum' });
    assert.strictEqual(tv.elements['emergency-title'].textContent, 'Tahliye');
    db.set('emergency', { active: false, title: '', message: '', level: 'CRITICAL', activatedAt: null });
    await until(() => !tv.isVisible('emergency-screen'), { label: 'acil durum kalkması' });
    await until(() => tv.activeMediaUrl() === 'https://cdn/m2.mp4' && db.get(`telemetry/${token}/playback/mediaId`) === 'm2', { label: 'yayına dönüş' });
  });

  await test('Test 8: Önizleme TV\'yi izler ama telemetry yazmaz ve önbelleğe dokunmaz', async () => {
    const preview = boot({ search: `?preview=true&token=${token}` });
    await until(() => preview.activeMediaUrl() === 'https://cdn/m2.mp4', { label: 'önizleme medyası' });
    assert.strictEqual(preview.storage.size, 1, 'Önizleme yalnızca db URL\'sini saklamalı');
    preview.dispatch('pagehide');
    await new Promise((r) => setTimeout(r, 30));
    assert.strictEqual(preview.writes, 0, 'Önizleme veritabanına yazmamalı');
    preview.dispose();
  });

  await test('Test 9: Sekme kapanınca anında OFFLINE sinyali gönderilir', async () => {
    tv.dispatch('pagehide');
    await until(() => db.get(`telemetry/${token}/online`) === false, { label: 'offline sinyali' });
  });

  await test('Test 10: İnternet yokken yeniden açılan TV önbellekten yayına devam eder', async () => {
    tv.dispose();
    db.online = false;
    const rebooted = boot({ storage: tv.storage });
    await until(() => rebooted.activeMediaUrl() === 'https://cdn/m2.mp4', { label: 'offline yayın' });
    assert.ok(!rebooted.isVisible('pairing-screen'));
    rebooted.dispose();
    db.online = true;
  });

  await test('Test 11: Eşleştirme kaldırılınca TV kimliğini siler ve yeniden yüklenir', async () => {
    const again = boot({ storage: tv.storage });
    await until(() => again.activeMediaUrl() === 'https://cdn/m2.mp4', { label: 'yeniden bağlanma' });
    data.screens.s1.isPaired = false;
    db.set(`devices/${token}`, null);
    db.set(`telemetry/${token}`, null);
    await until(() => again.reloads === 1, { label: 'reload' });
    assert.strictEqual(again.storage.get('signage_device_token'), undefined);
    assert.strictEqual(again.storage.get('signage_paired'), undefined);
  });

  await test('Test 12: Kalıcı ?token= bağlantısı TV\'yi eşleşmiş olarak başlatır', async () => {
    data.screens.s1 = { ...data.screens.s1, isPaired: true, deviceToken: token };
    publish();
    const kiosk = boot({ search: `?token=${token}` });
    await until(() => kiosk.activeMediaUrl() === 'https://cdn/m2.mp4', { label: 'kalıcı bağlantı' });
    assert.strictEqual(kiosk.storage.get('signage_paired'), '1');
  });

  console.log('====================================================');
  console.log(` Tüm Eşleştirme ve Player Testleri Geçti (${passed}/${passed}) `);
  console.log('====================================================');
} finally {
  players.forEach((p) => p.dispose());
}
