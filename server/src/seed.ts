import bcrypt from 'bcryptjs';
import { prisma } from './db.js';

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

  // 3. Create a sample web page announcement media if empty
  const mediaCount = await prisma.media.count();
  let sampleMediaId: string | null = null;
  if (mediaCount === 0) {
    const media = await prisma.media.create({
      data: {
        title: 'Kurumsal Hoş Geldiniz Duyurusu',
        type: 'URL',
        url: 'https://news.ycombinator.com', // fallback accessible sample page
        duration: 15
      }
    });
    sampleMediaId = media.id;
    console.log('✓ Örnek kurumsal duyuru medyası eklendi.');
  }

  // 4. Create sample playlist if empty
  const playlistCount = await prisma.playlist.count();
  if (playlistCount === 0 && sampleMediaId) {
    const playlist = await prisma.playlist.create({
      data: {
        name: 'Genel Kurum Yayını (Varsayılan)',
        description: 'Tüm katlar için geçerli varsayılan bilgilendirme yayını'
      }
    });

    await prisma.playlistItem.create({
      data: {
        playlistId: playlist.id,
        mediaId: sampleMediaId,
        order: 0,
        duration: 15
      }
    });
    console.log('✓ Örnek varsayılan oynatma listesi oluşturuldu.');
  }

  console.log('Seed işlemi tamamlandı.');
}

if (process.argv[1] && process.argv[1].endsWith('seed.ts')) {
  runSeed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seed hatası:', err);
      process.exit(1);
    });
}
