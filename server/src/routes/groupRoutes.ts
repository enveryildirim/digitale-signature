import { Router } from 'express';
import { prisma } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

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

export default router;
