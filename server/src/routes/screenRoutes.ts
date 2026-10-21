import { Router } from 'express';
import { prisma } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import { PairingService } from '../services/pairingService.js';
import { WsServer } from '../ws/wsServer.js';
import { EmergencyService } from '../services/emergencyService.js';

const router = Router();
router.use(authMiddleware);

// GET /api/screens/emergency/status
router.get('/emergency/status', (_req, res) => {
  res.json(EmergencyService.getState());
});

// POST /api/screens/emergency/activate
router.post('/emergency/activate', (req, res) => {
  const { title, message, level } = req.body;
  if (!title || !message) {
    return res.status(400).json({ error: 'Acil durum başlığı ve mesajı zorunludur.' });
  }
  const state = EmergencyService.activate(title, message, level || 'CRITICAL');
  res.json({ message: 'Acil durum yayını tüm TV ekranlarına basıldı.', state });
});

// POST /api/screens/emergency/deactivate
router.post('/emergency/deactivate', (_req, res) => {
  const state = EmergencyService.deactivate();
  res.json({ message: 'Acil durum yayını kaldırıldı, olağan yayına dönüldü.', state });
});

// GET /api/screens
router.get('/', async (_req, res) => {
  try {
    const screens = await prisma.screen.findMany({
      include: {
        group: {
          select: {
            id: true,
            name: true,
            assignments: {
              where: { isDefault: true },
              include: {
                playlist: { select: { id: true, name: true } }
              }
            }
          }
        },
        assignments: {
          include: {
            playlist: { select: { id: true, name: true } }
          }
        }
      },
      orderBy: [
        { isPaired: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    res.json(screens);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/screens/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const screen = await prisma.screen.findUnique({
      where: { id },
      include: {
        group: true,
        assignments: {
          include: {
            playlist: true
          }
        }
      }
    });

    if (!screen) {
      return res.status(404).json({ error: 'Ekran bulunamadı.' });
    }

    res.json(screen);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/screens/pair - Admin pairs an unpaired TV by entering the 6-digit code
router.post('/pair', async (req, res) => {
  try {
    const { pairingCode, name, groupId } = req.body;

    if (!pairingCode) {
      return res.status(400).json({ error: 'Eşleştirme kodu zorunludur.' });
    }

    const { screen, deviceToken } = await PairingService.pairScreen(
      pairingCode,
      name || 'Yeni TV',
      groupId
    );

    // Notify the waiting TV Player via WebSocket
    WsServer.notifyPairingSuccess(screen.id, deviceToken, screen.name);

    res.json({
      message: 'Ekran başarıyla eşleştirildi.',
      screen,
      deviceToken
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Eşleştirme başarısız.' });
  }
});

// PUT /api/screens/:id - Update screen name or group
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, groupId } = req.body;

    const screen = await prisma.screen.update({
      where: { id },
      data: {
        name: name ? name.trim() : undefined,
        groupId: groupId !== undefined ? (groupId || null) : undefined
      },
      include: { group: true }
    });

    // Notify screen to re-evaluate manifest if group changed
    WsServer.notifyScreenSync(id);

    res.json(screen);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/screens/:id/unpair
router.post('/:id/unpair', async (req, res) => {
  try {
    const { id } = req.params;
    WsServer.notifyUnpair(id);
    const screen = await PairingService.unpairScreen(id);
    res.json({ message: 'Ekran eşleştirmesi kaldırıldı.', screen });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/screens/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    WsServer.notifyUnpair(id);
    await prisma.screen.delete({ where: { id } });
    res.json({ message: 'Ekran silindi.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/screens/:id/quick-assign - Instantly assign or remove a default playlist for a screen
router.post('/:id/quick-assign', async (req, res) => {
  try {
    const { id } = req.params;
    const { playlistId } = req.body;

    const screen = await prisma.screen.findUnique({ where: { id } });
    if (!screen) {
      return res.status(404).json({ error: 'Ekran bulunamadı.' });
    }

    if (playlistId) {
      // Check if playlist exists
      const playlist = await prisma.playlist.findUnique({ where: { id: playlistId } });
      if (!playlist) {
        return res.status(404).json({ error: 'Playlist bulunamadı.' });
      }

      // Upsert default assignment for this screen
      const existing = await prisma.assignment.findFirst({
        where: { screenId: id, isDefault: true }
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
            screenId: id,
            playlistId,
            isDefault: true,
            priority: 1
          }
        });
      }

      // Notify screen via WebSocket
      WsServer.notifyScreenSync(id);
      res.json({ message: `Yayın '${playlist.name}' olarak ayarlandı.`, assignment });
    } else {
      // Remove screen-level default assignment so it falls back to floor/group
      await prisma.assignment.deleteMany({
        where: { screenId: id, isDefault: true }
      });

      // Notify screen via WebSocket
      WsServer.notifyScreenSync(id);
      res.json({ message: 'Ekrana özel yayın kaldırıldı, kat yayınına dönüldü.' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/screens/:id/sync - Force immediate refresh on TV
router.post('/:id/sync', async (req, res) => {
  try {
    const { id } = req.params;
    WsServer.notifyScreenSync(id);
    res.json({ message: 'Yenileme sinyali gönderildi.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/screens/sync-all - Force refresh on all screens
router.post('/sync-all', async (_req, res) => {
  try {
    WsServer.notifyAllScreensSync();
    res.json({ message: 'Tüm ekranlara yenileme sinyali iletildi.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
