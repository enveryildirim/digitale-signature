import { Router } from 'express';
import { prisma } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import { WsServer } from '../ws/wsServer.js';

const router = Router();
router.use(authMiddleware);

// GET /api/groups
router.get('/', async (_req, res) => {
  try {
    const groups = await prisma.screenGroup.findMany({
      include: {
        screens: {
          select: { id: true, name: true, status: true, isPaired: true }
        },
        assignments: {
          include: {
            playlist: { select: { id: true, name: true } }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json(groups);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/groups
router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Grup adı zorunludur.' });
    }

    const existing = await prisma.screenGroup.findUnique({
      where: { name: name.trim() }
    });
    if (existing) {
      return res.status(400).json({ error: 'Bu isimde bir grup zaten mevcut.' });
    }

    const group = await prisma.screenGroup.create({
      data: {
        name: name.trim(),
        description: description ? description.trim() : null
      }
    });

    res.status(201).json(group);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/groups/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const group = await prisma.screenGroup.update({
      where: { id },
      data: {
        name: name ? name.trim() : undefined,
        description: description !== undefined ? description?.trim() : undefined
      }
    });

    res.json(group);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/groups/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Unassign screens from this group
    await prisma.screen.updateMany({
      where: { groupId: id },
      data: { groupId: null }
    });

    await prisma.screenGroup.delete({
      where: { id }
    });

    res.json({ message: 'Grup silindi.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/groups/:id/quick-assign - Instantly assign default playlist to an entire floor/group
router.post('/:id/quick-assign', async (req, res) => {
  try {
    const { id } = req.params;
    const { playlistId } = req.body;

    const group = await prisma.screenGroup.findUnique({ where: { id } });
    if (!group) {
      return res.status(404).json({ error: 'Grup bulunamadı.' });
    }

    if (playlistId) {
      const playlist = await prisma.playlist.findUnique({ where: { id: playlistId } });
      if (!playlist) {
        return res.status(404).json({ error: 'Playlist bulunamadı.' });
      }

      const existing = await prisma.assignment.findFirst({
        where: { groupId: id, isDefault: true }
      });

      let assignment;
      if (existing) {
        assignment = await prisma.assignment.update({
          where: { id: existing.id },
          data: { playlistId }
        });
      } else {
        assignment = await prisma.assignment.create({
          data: {
            groupId: id,
            playlistId,
            isDefault: true,
            priority: 1
          }
        });
      }

      WsServer.notifyGroupSync(id);
      res.json({ message: `${group.name} katı yayını '${playlist.name}' olarak güncellendi.`, assignment });
    } else {
      await prisma.assignment.deleteMany({
        where: { groupId: id, isDefault: true }
      });

      WsServer.notifyGroupSync(id);
      res.json({ message: `${group.name} katı varsayılan yayını kaldırıldı.` });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
