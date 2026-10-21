import assert from 'assert';
import http from 'http';
import express from 'express';
import cors from 'cors';
import { prisma } from '../db.js';
import { runSeed } from '../seed.js';

import authRoutes from '../routes/authRoutes.js';
import screenRoutes from '../routes/screenRoutes.js';
import groupRoutes from '../routes/groupRoutes.js';
import mediaRoutes from '../routes/mediaRoutes.js';
import playlistRoutes from '../routes/playlistRoutes.js';
import assignmentRoutes from '../routes/assignmentRoutes.js';
import playerRoutes from '../routes/playerRoutes.js';

async function testApi() {
  console.log('--- Testing REST API, Authentication & TV Player Endpoints ---');

  // Setup express test server
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.use('/api/auth', authRoutes);
  app.use('/api/screens', screenRoutes);
  app.use('/api/groups', groupRoutes);
  app.use('/api/media', mediaRoutes);
  app.use('/api/playlists', playlistRoutes);
  app.use('/api/assignments', assignmentRoutes);
  app.use('/api/player', playerRoutes);

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(3099, '127.0.0.1', resolve));

  const baseUrl = 'http://127.0.0.1:3099';

  try {
    // 1. Seed admin
    await runSeed();

    // 2. Auth Login Test
    console.log('Test 1: Admin girişi test ediliyor (admin / admin123)...');
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });

    assert.strictEqual(loginRes.status, 200, 'Giriş başarısız oldu');
    const loginData = (await loginRes.json()) as any;
    assert(loginData.token, 'JWT token üretilemedi');
    assert.strictEqual(loginData.user.username, 'admin');
    console.log('✓ Test 1 Başarılı: Admin girişi ve JWT token üretimi doğrulandı.');

    const adminToken = loginData.token;
    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    };

    // 3. Screen Registration by TV (Unpaired)
    console.log('Test 2: TV Player ilk açılış ve 6 haneli kod üretimi...');
    const regRes = await fetch(`${baseUrl}/api/player/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userAgent: 'Chromium Kiosk Test' })
    });
    assert.strictEqual(regRes.status, 200);
    const regData = (await regRes.json()) as any;
    assert(regData.pairingCode, 'Eşleştirme kodu üretilemedi');
    assert.strictEqual(regData.pairingCode.length, 6, 'Eşleştirme kodu 6 haneli değil');
    console.log(`✓ Test 2 Başarılı: TV için 6 haneli eşleştirme kodu üretildi (${regData.pairingCode}).`);

    // 4. Admin pairs the screen
    console.log('Test 3: Admin panelinden kod ile eşleştirme yapılıyor...');
    const pairRes = await fetch(`${baseUrl}/api/screens/pair`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        pairingCode: regData.pairingCode,
        name: 'Giriş Danışma TV'
      })
    });
    assert.strictEqual(pairRes.status, 200);
    const pairData = (await pairRes.json()) as any;
    assert(pairData.deviceToken, 'Device token oluşturulamadı');
    assert(pairData.screen.isPaired, 'Ekran eşleşmiş olarak işaretlenmedi');
    console.log('✓ Test 3 Başarılı: Ekran başarıyla onaylandı ve kalıcı deviceToken atandı.');

    const deviceToken = pairData.deviceToken;

    // 5. TV fetches manifest with its deviceToken
    console.log('Test 4: TV Player yayın manifestini alıyor...');
    const manifestRes = await fetch(`${baseUrl}/api/player/manifest?token=${deviceToken}`);
    assert.strictEqual(manifestRes.status, 200);
    const manifestData = (await manifestRes.json()) as any;
    assert.strictEqual(manifestData.screenId, pairData.screen.id);
    console.log('✓ Test 4 Başarılı: TV Player yayın manifestini başarıyla aldı.');

    // 6. TV sends heartbeat
    console.log('Test 5: TV Player heartbeat bildirimi...');
    const hbRes = await fetch(`${baseUrl}/api/player/heartbeat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: deviceToken,
        currentMedia: 'Kurumsal Hoş Geldiniz',
        playerVersion: '1.0.0'
      })
    });
    assert.strictEqual(hbRes.status, 200);
    console.log('✓ Test 5 Başarılı: Heartbeat alındı ve ekran durumu ONLINE güncellendi.');

    // 7. Media creation and update test
    console.log('Test 6: Medya oluşturma ve güncelleme (PUT /api/media/:id)...');
    const createMediaRes = await fetch(`${baseUrl}/api/media/url`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        title: 'Eski Web Sayfası Başlığı',
        url: 'https://ornek.yerel.lan/eski',
        duration: 10
      })
    });
    assert.strictEqual(createMediaRes.status, 201);
    const createdMedia = (await createMediaRes.json()) as any;
    assert.strictEqual(createdMedia.title, 'Eski Web Sayfası Başlığı');

    // Update media title, url and duration
    const updateMediaRes = await fetch(`${baseUrl}/api/media/${createdMedia.id}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        title: 'Yeni Güncel Web Sayfası Başlığı',
        url: 'https://ornek.yerel.lan/yeni',
        duration: 25
      })
    });
    assert.strictEqual(updateMediaRes.status, 200);
    const updatedMedia = (await updateMediaRes.json()) as any;
    assert.strictEqual(updatedMedia.title, 'Yeni Güncel Web Sayfası Başlığı');
    assert.strictEqual(updatedMedia.url, 'https://ornek.yerel.lan/yeni');
    assert.strictEqual(updatedMedia.duration, 25);
    console.log('✓ Test 6 Başarılı: Medya başlığı, süresi ve URL bilgisi başarıyla güncellendi.');

    // Cleanup test media
    await fetch(`${baseUrl}/api/media/${createdMedia.id}`, {
      method: 'DELETE',
      headers: authHeaders
    });

    console.log('====================================================');
    console.log(' Tüm REST API & TV Player Entegrasyon Testleri Başarılı ');
    console.log('====================================================');

  } finally {
    try {
      await prisma.screen.deleteMany({
        where: { name: 'Giriş Danışma TV' }
      });
    } catch {}
    server.close();
  }
}

testApi()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('API test hatası:', err);
    process.exit(1);
  });
