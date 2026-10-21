import assert from 'assert';
import { prisma } from '../db.js';
import { ManifestResolver } from '../services/manifestResolver.js';

async function testScheduler() {
  console.log('--- Testing Manifest Resolver & Scheduling Conflict Rules ---');

  // Clean test data
  await prisma.assignment.deleteMany({});
  await prisma.playlistItem.deleteMany({});
  await prisma.playlist.deleteMany({});
  await prisma.media.deleteMany({});
  await prisma.screen.deleteMany({});
  await prisma.screenGroup.deleteMany({});

  // 1. Create Floor Group and TV Screen
  const group = await prisma.screenGroup.create({
    data: { name: 'Test 1. Kat' }
  });

  const screen = await prisma.screen.create({
    data: {
      name: 'TV-101 Koridor',
      groupId: group.id,
      isPaired: true,
      status: 'ONLINE'
    }
  });

  // 2. Create Media Items
  const mediaDefault = await prisma.media.create({
    data: { title: 'Kurum Tanıtım', type: 'IMAGE', url: '/uploads/tanitim.jpg', duration: 10 }
  });
  const mediaScreenDefault = await prisma.media.create({
    data: { title: '101 Özel Duyuru', type: 'IMAGE', url: '/uploads/ozel.jpg', duration: 10 }
  });
  const mediaLunch = await prisma.media.create({
    data: { title: 'Günün Menüsü', type: 'IMAGE', url: '/uploads/menu.jpg', duration: 15 }
  });

  // 3. Create Playlists
  const plGroupDefault = await prisma.playlist.create({
    data: { name: 'Grup Varsayılan Playlist' }
  });
  await prisma.playlistItem.create({
    data: { playlistId: plGroupDefault.id, mediaId: mediaDefault.id, order: 0, duration: 10 }
  });

  const plScreenDefault = await prisma.playlist.create({
    data: { name: 'Ekran Özel Varsayılan Playlist' }
  });
  await prisma.playlistItem.create({
    data: { playlistId: plScreenDefault.id, mediaId: mediaScreenDefault.id, order: 0, duration: 10 }
  });

  const plLunch = await prisma.playlist.create({
    data: { name: 'Öğle Yemeği Playlist' }
  });
  await prisma.playlistItem.create({
    data: { playlistId: plLunch.id, mediaId: mediaLunch.id, order: 0, duration: 15 }
  });

  // --- TEST 1: Group Default Playlist Fallback ---
  console.log('Test 1: Grup varsayılan yayını doğrulanıyor...');
  await prisma.assignment.create({
    data: {
      playlistId: plGroupDefault.id,
      groupId: group.id,
      isDefault: true
    }
  });

  let manifest = await ManifestResolver.resolveForScreen(screen.id, new Date('2026-10-21T10:00:00'));
  assert.strictEqual(manifest.playlist?.id, plGroupDefault.id, 'Grup varsayılanı çözümlenemedi');
  console.log('✓ Test 1 Başarılı: Grup varsayılan yayını aktif.');

  // --- TEST 2: Screen-Specific Default Overrides Group Default (Ekran Özel > Grup) ---
  console.log('Test 2: Ekrana özel varsayılan yayının grup varsayılanını ezdiği doğrulanıyor...');
  await prisma.assignment.create({
    data: {
      playlistId: plScreenDefault.id,
      screenId: screen.id,
      isDefault: true
    }
  });

  manifest = await ManifestResolver.resolveForScreen(screen.id, new Date('2026-10-21T10:00:00'));
  assert.strictEqual(manifest.playlist?.id, plScreenDefault.id, 'Ekran özel varsayılanı grup varsayılanını ezmedi');
  console.log('✓ Test 2 Başarılı: Ekran özel varsayılanı grup varsayılanını ezdi.');

  // --- TEST 3: Scheduled Assignment Overrides Default (Zamanlanmış > Varsayılan) ---
  console.log('Test 3: Zamanlanmış öğle yemeği yayını doğrulanıyor (12:00 - 13:30)...');
  await prisma.assignment.create({
    data: {
      playlistId: plLunch.id,
      groupId: group.id,
      isDefault: false,
      startTime: '12:00',
      endTime: '13:30',
      daysOfWeek: '1,2,3,4,5' // Weekdays
    }
  });

  // At 12:30 on Wednesday (day 3) -> should be plLunch
  const lunchTime = new Date('2026-10-21T12:30:00'); // 2026-10-21 is Wednesday
  manifest = await ManifestResolver.resolveForScreen(screen.id, lunchTime);
  assert.strictEqual(manifest.playlist?.id, plLunch.id, 'Zamanlanmış öğle yayını devreye girmedi');
  console.log('✓ Test 3 Başarılı: Zamanlanmış yayın doğru saatte varsayılanı ezerek devreye girdi.');

  // --- TEST 4: Outside scheduled time window, reverts to screen default ---
  console.log('Test 4: Saat 14:00 olduğunda tekrar varsayılan yayına döndüğü doğrulanıyor...');
  const afterLunchTime = new Date('2026-10-21T14:00:00');
  manifest = await ManifestResolver.resolveForScreen(screen.id, afterLunchTime);
  assert.strictEqual(manifest.playlist?.id, plScreenDefault.id, 'Zaman penceresi bitince varsayılana dönmedi');
  console.log('✓ Test 4 Başarılı: Zaman penceresi bitince ekran varsayılan yayınına otomatik döndü.');

  // --- TEST 5: Weekend check (Day filter) ---
  console.log('Test 5: Hafta sonu zamanlanmış kuralın çalışmadığı doğrulanıyor...');
  const weekendLunch = new Date('2026-10-25T12:30:00'); // Sunday
  manifest = await ManifestResolver.resolveForScreen(screen.id, weekendLunch);
  assert.strictEqual(manifest.playlist?.id, plScreenDefault.id, 'Hafta sonu kural filtresi çalışmadı');
  console.log('✓ Test 5 Başarılı: Gün maskesi filtresi başarıyla uygulandı.');

  console.log('====================================================');
  console.log(' Tüm Zamanlama ve Çakışma Birim Testleri Geçti (5/5) ');
  console.log('====================================================');
}

testScheduler()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Scheduler test hatası:', err);
    process.exit(1);
  });
