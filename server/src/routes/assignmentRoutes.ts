import { Router } from 'express';
import { prisma } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import { WsServer } from '../ws/wsServer.js';

const router = Router();
router.use(authMiddleware);

// GET /api/assignments
router.get('/', async (_req, res) => {
  try {
    const assignments = await prisma.assignment.findMany({
      include: {
        playlist: { select: { id: true, name: true } },
        screen: { select: { id: true, name: true, groupId: true } },
        group: { select: { id: true, name: true } }
      },
      orderBy: [
        { isDefault: 'asc' },
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    res.json(assignments);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/assignments
router.post('/', async (req, res) => {
  try {
    const {
      playlistId,
      screenId,
      groupId,
      isDefault,
      daysOfWeek,
      startTime,
      endTime,
      startDate,
      endDate,
      priority
    } = req.body;

    if (!playlistId) {
      return res.status(400).json({ error: 'Playlist seçimi zorunludur.' });
    }

    if (!screenId && !groupId) {
      return res.status(400).json({ error: 'Hedef ekran veya kat grubu seçilmelidir.' });
    }

    const assignment = await prisma.assignment.create({
      data: {
        playlistId,
        screenId: screenId || null,
        groupId: groupId || null,
        isDefault: Boolean(isDefault),
        daysOfWeek: daysOfWeek || null,
        startTime: startTime || null,
        endTime: endTime || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        priority: priority ? parseInt(priority, 10) : 1
      },
      include: {
        playlist: true,
        screen: true,
        group: true
      }
    });

    // Notify affected screen(s)
    if (screenId) {
      WsServer.notifyScreenSync(screenId);
    } else if (groupId) {
      WsServer.notifyGroupSync(groupId);
    } else {
      WsServer.notifyAllScreensSync();
    }

    res.status(201).json(assignment);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/assignments/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      playlistId,
      screenId,
      groupId,
      isDefault,
      daysOfWeek,
      startTime,
      endTime,
      startDate,
      endDate,
      priority
    } = req.body;

    const assignment = await prisma.assignment.update({
      where: { id },
      data: {
        playlistId: playlistId || undefined,
        screenId: screenId !== undefined ? (screenId || null) : undefined,
        groupId: groupId !== undefined ? (groupId || null) : undefined,
        isDefault: isDefault !== undefined ? Boolean(isDefault) : undefined,
        daysOfWeek: daysOfWeek !== undefined ? daysOfWeek : undefined,
        startTime: startTime !== undefined ? startTime : undefined,
        endTime: endTime !== undefined ? endTime : undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        priority: priority ? parseInt(priority, 10) : undefined
      },
      include: {
        playlist: true,
        screen: true,
        group: true
      }
    });

    // Notify affected screens
    if (assignment.screenId) {
      WsServer.notifyScreenSync(assignment.screenId);
    } else if (assignment.groupId) {
      WsServer.notifyGroupSync(assignment.groupId);
    } else {
      WsServer.notifyAllScreensSync();
    }

    res.json(assignment);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/assignments/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.assignment.findUnique({ where: { id } });

    if (!existing) {
      return res.status(404).json({ error: 'Atama bulunamadı.' });
    }

    await prisma.assignment.delete({ where: { id } });

    if (existing.screenId) {
      WsServer.notifyScreenSync(existing.screenId);
    } else if (existing.groupId) {
      WsServer.notifyGroupSync(existing.groupId);
    } else {
      WsServer.notifyAllScreensSync();
    }

    res.json({ message: 'Atama silindi.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
