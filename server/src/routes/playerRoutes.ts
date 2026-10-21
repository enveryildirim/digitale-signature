import { Router } from 'express';
import { prisma } from '../db.js';
import { PairingService } from '../services/pairingService.js';
import { ManifestResolver } from '../services/manifestResolver.js';
import { HeartbeatService } from '../services/heartbeatService.js';

const router = Router();

// POST /api/player/register - Called on initial TV launch without token
router.post('/register', async (req, res) => {
  try {
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const result = await PairingService.registerScreen(ip, userAgent);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/player/check-pair/:screenId - Polling fallback for pairing
router.get('/check-pair/:screenId', async (req, res) => {
  try {
    const { screenId } = req.params;
    const screen = await prisma.screen.findUnique({
      where: { id: screenId },
      select: { id: true, isPaired: true, deviceToken: true, name: true }
    });

    if (!screen) {
      return res.status(404).json({ error: 'Ekran bulunamadı.' });
    }

    res.json({
      isPaired: screen.isPaired,
      deviceToken: screen.deviceToken,
      screenName: screen.name
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/player/manifest - Fetches active playlist manifest for TV player
router.get('/manifest', async (req, res) => {
  try {
    const token = (req.query.token as string) || (req.headers['x-device-token'] as string);

    if (!token) {
      return res.status(401).json({ error: 'Cihaz belirteci (token) gerekli.' });
    }

    const screen = await prisma.screen.findUnique({
      where: { deviceToken: token }
    });

    if (!screen) {
      return res.status(401).json({ error: 'Geçersiz cihaz belirteci. Lütfen tekrar eşleştirin.' });
    }

    // Resolve manifest based on current time and assignment priority rules
    const manifest = await ManifestResolver.resolveForScreen(screen.id, new Date());
    res.json(manifest);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/player/heartbeat - HTTP fallback for player heartbeat
router.post('/heartbeat', async (req, res) => {
  try {
    const { token, currentMedia, playerVersion } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token zorunludur.' });
    }

    const screen = await prisma.screen.findUnique({
      where: { deviceToken: token }
    });

    if (!screen) {
      return res.status(404).json({ error: 'Ekran bulunamadı.' });
    }

    await HeartbeatService.recordHeartbeat(screen.id, currentMedia, playerVersion);
    res.json({ status: 'ok' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
