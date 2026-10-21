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

export default router;
