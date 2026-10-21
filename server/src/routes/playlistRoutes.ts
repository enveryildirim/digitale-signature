import { Router } from 'express';
import { prisma } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import { WsServer } from '../ws/wsServer.js';

const router = Router();
router.use(authMiddleware);

// GET /api/playlists
router.get('/', async (_req, res) => {
  try {
    const playlists = await prisma.playlist.findMany({
      include: {
        items: {
          include: { media: true },
          orderBy: { order: 'asc' }
        },
        assignments: {
          select: { id: true, screenId: true, groupId: true, isDefault: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Calculate total loop duration
    const enriched = playlists.map(pl => {
      const totalDuration = pl.items.reduce((sum, item) => sum + (item.duration || item.media.duration || 10), 0);
      return {
        ...pl,
        totalDuration,
        itemCount: pl.items.length
      };
    });

    res.json(enriched);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/playlists/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const playlist = await prisma.playlist.findUnique({
      where: { id },
      include: {
        items: {
          include: { media: true },
          orderBy: { order: 'asc' }
        },
        assignments: true
      }
    });

    if (!playlist) {
      return res.status(404).json({ error: 'Playlist bulunamadı.' });
    }

    const totalDuration = playlist.items.reduce((sum, item) => sum + (item.duration || item.media.duration || 10), 0);

    res.json({
      ...playlist,
      totalDuration,
      itemCount: playlist.items.length
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/playlists
router.post('/', async (req, res) => {
  try {
    const { name, description, items } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Playlist adı zorunludur.' });
    }

    const playlist = await prisma.playlist.create({
      data: {
        name: name.trim(),
        description: description ? description.trim() : null
      }
    });

    // Add initial items if provided
    if (items && Array.isArray(items) && items.length > 0) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        await prisma.playlistItem.create({
          data: {
            playlistId: playlist.id,
            mediaId: item.mediaId,
            order: i,
            duration: item.duration || 10
          }
        });
      }
    }

    const created = await prisma.playlist.findUnique({
      where: { id: playlist.id },
      include: {
        items: { include: { media: true }, orderBy: { order: 'asc' } }
      }
    });

    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/playlists/:id (Update name and/or reorder/update items)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, items } = req.body;

    await prisma.playlist.update({
      where: { id },
      data: {
        name: name ? name.trim() : undefined,
        description: description !== undefined ? description?.trim() : undefined
      }
    });

    // If items array is explicitly provided, replace playlist items
    if (items && Array.isArray(items)) {
      // Delete existing items
      await prisma.playlistItem.deleteMany({
        where: { playlistId: id }
      });

      // Insert new ordered items
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        await prisma.playlistItem.create({
          data: {
            playlistId: id,
            mediaId: item.mediaId,
            order: i,
            duration: item.duration || 10
          }
        });
      }
    }

    // Trigger instant manifest sync on all connected screens
    WsServer.notifyAllScreensSync();

    const updated = await prisma.playlist.findUnique({
      where: { id },
      include: {
        items: { include: { media: true }, orderBy: { order: 'asc' } }
      }
    });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/playlists/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.playlist.delete({ where: { id } });

    // Trigger sync since active playlist might have been removed
    WsServer.notifyAllScreensSync();

    res.json({ message: 'Playlist silindi.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
