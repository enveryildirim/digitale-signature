import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { prisma } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { config } from '../config.js';

const router = Router();
router.use(authMiddleware);

// GET /api/media
router.get('/', async (_req, res) => {
  try {
    const media = await prisma.media.findMany({
      include: {
        _count: {
          select: { items: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(media);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/media/upload (File upload: Image or Video)
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Dosya yüklenmedi.' });
    }

    const { title, duration } = req.body;
    const isVideo = req.file.mimetype.startsWith('video/');
    const type = isVideo ? 'VIDEO' : 'IMAGE';
    const relativeUrl = `/uploads/${req.file.filename}`;

    const media = await prisma.media.create({
      data: {
        title: title ? title.trim() : req.file.originalname,
        type,
        url: relativeUrl,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
        duration: duration ? parseInt(duration, 10) : (isVideo ? 15 : 10)
      }
    });

    res.status(201).json(media);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/media/url (Web page / URL media)
router.post('/url', async (req, res) => {
  try {
    const { title, url, duration } = req.body;

    if (!title || !url) {
      return res.status(400).json({ error: 'Başlık ve URL zorunludur.' });
    }

    // Validate URL syntax
    try {
      new URL(url);
    } catch {
      return res.status(400).json({ error: 'Geçersiz URL formatı.' });
    }

    const media = await prisma.media.create({
      data: {
        title: title.trim(),
        type: 'URL',
        url: url.trim(),
        duration: duration ? parseInt(duration, 10) : 15
      }
    });

    res.status(201).json(media);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/media/:id (Rename or change default duration)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, duration } = req.body;

    const media = await prisma.media.update({
      where: { id },
      data: {
        title: title ? title.trim() : undefined,
        duration: duration !== undefined ? parseInt(duration, 10) : undefined
      }
    });

    res.json(media);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/media/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const media = await prisma.media.findUnique({ where: { id } });
    if (!media) {
      return res.status(404).json({ error: 'Medya bulunamadı.' });
    }

    // Delete local file if present
    if (media.url.startsWith('/uploads/')) {
      const filename = path.basename(media.url);
      const filePath = path.join(config.uploadDir, filename);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          console.warn('Could not delete file from disk:', e);
        }
      }
    }

    await prisma.media.delete({ where: { id } });

    res.json({ message: 'Medya silindi.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/media/text-announcement (MED-6: Başlık + metin + arka plan rengi ile vektörel SVG duyuru)
router.post('/text-announcement', async (req, res) => {
  try {
    const { title, message, bgColor, textColor, duration } = req.body;

    if (!title || !message) {
      return res.status(400).json({ error: 'Duyuru başlığı ve metni zorunludur.' });
    }

    const bg = bgColor || '#0f172a';
    const fg = textColor || '#ffffff';
    const filename = `announcement-${Date.now()}.svg`;
    const filePath = path.join(config.uploadDir, filename);

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
        ${title.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
      </h1>
      <p style="font-size:42px;font-weight:400;line-height:1.5;margin:0;opacity:0.9;max-width:1400px;margin:0 auto;text-shadow:0 2px 10px rgba(0,0,0,0.5);">
        ${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
      </p>
    </div>
  </foreignObject>
</svg>`;

    fs.writeFileSync(filePath, svgContent, 'utf-8');

    const media = await prisma.media.create({
      data: {
        title: title.trim(),
        type: 'IMAGE',
        url: `/uploads/${filename}`,
        mimeType: 'image/svg+xml',
        fileSize: Buffer.byteLength(svgContent),
        duration: duration ? parseInt(duration, 10) : 12
      }
    });

    res.status(201).json(media);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
