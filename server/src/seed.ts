import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { prisma } from './db.js';
import { config } from './config.js';

export async function runSeed() {
  console.log('Seeding initial database state...');

  // 1. Create or ensure default admin user: admin / admin123
  const existingAdmin = await prisma.user.findFirst({
    where: { username: 'admin' }
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@kurum.local',
        name: 'Sistem Yöneticisi',
        role: 'ADMIN',
        passwordHash
      }
    });
    console.log('✓ Varsayılan yönetici hesabı oluşturuldu (Kullanıcı: admin / Parola: admin123)');
  } else {
    console.log('✓ Yönetici hesabı zaten mevcut.');
  }

  // 2. Create initial floor groups if none exist
  const groupCount = await prisma.screenGroup.count();
  if (groupCount === 0) {
    const groups = [
      { name: 'Zemin Kat - Giriş Holü', description: 'Ana bina giriş holü ve danışma TV ekranları' },
      { name: '1. Kat - İdari Birimler', description: 'İnsan kaynakları ve yönetim katı ekranları' },
      { name: '2. Kat - Toplantı Salonları', description: 'Kurumsal toplantı holü ekranları' },
      { name: '3. Kat - Teknik & Operasyon', description: 'Operasyon ve BT katı ekranları' },
      { name: 'Yemekhane & Dinlenme Alanı', description: 'Yemek menüsü ve sosyal duyuru ekranları' }
    ];

    for (const g of groups) {
      await prisma.screenGroup.create({ data: g });
    }
    console.log('✓ 5 adet kurumsal kat/alan grubu tanımlandı.');
  }

  console.log('Seed işlemi tamamlandı.');
}

export async function resetAllData() {
  console.log('--- TÜM VERİLER SIFIRLANIYOR (FRESH START) ---');

  // 1. Delete all relational data
  await prisma.assignment.deleteMany({});
  await prisma.playlistItem.deleteMany({});
  await prisma.playlist.deleteMany({});
  await prisma.screen.deleteMany({});
  await prisma.media.deleteMany({});
  await prisma.screenGroup.deleteMany({});
  console.log('✓ Ekranlar, oynatma listeleri, zamanlama atamaları ve medyalar veritabanından silindi.');

  // 2. Clean uploads folder (keep .gitkeep)
  try {
    if (fs.existsSync(config.uploadDir)) {
      const files = fs.readdirSync(config.uploadDir);
      for (const file of files) {
        if (file !== '.gitkeep') {
          fs.unlinkSync(path.join(config.uploadDir, file));
        }
      }
      console.log('✓ uploads/ klasöründeki eski dosyalar temizlendi.');
    }
  } catch (err) {
    console.warn('Uploads klasörü temizlenirken hata:', err);
  }

  // 3. Re-seed base admin and standard groups
  await runSeed();
  console.log('=======================================================');
  console.log(' Sistem Sıfırdan Başlatıldı! (Tertemiz Kütüphane & Katlar) ');
  console.log('=======================================================');
}

if (process.argv[1] && process.argv[1].endsWith('seed.ts')) {
  const isReset = process.argv.includes('--reset');
  const action = isReset ? resetAllData() : runSeed();
  action
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seed/Reset hatası:', err);
      process.exit(1);
    });
}
