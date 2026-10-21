import http from 'http';
import path from 'path';
import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { WsServer } from './ws/wsServer.js';
import { HeartbeatService } from './services/heartbeatService.js';
import { runSeed } from './seed.js';

import authRoutes from './routes/authRoutes.js';
import screenRoutes from './routes/screenRoutes.js';
import groupRoutes from './routes/groupRoutes.js';
import mediaRoutes from './routes/mediaRoutes.js';
import playlistRoutes from './routes/playlistRoutes.js';
import assignmentRoutes from './routes/assignmentRoutes.js';
import playerRoutes from './routes/playerRoutes.js';

const app = express();
const server = http.createServer(app);

// Enable CORS for local network and dev tools
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded media files statically
app.use('/uploads', express.static(config.uploadDir));

// Serve TV Player standalone web app statically at /player
const playerStaticDir = path.resolve(process.cwd(), '../player');
app.use('/player', express.static(playerStaticDir));

// Mount REST API endpoints
app.use('/api/auth', authRoutes);
app.use('/api/screens', screenRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/player', playerRoutes);

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    system: 'Kurum İçi Dijital Bilgi Ekranı',
    uptime: process.uptime()
  });
});

// Serve built Admin SPA if dist folder exists
const clientDistDir = path.resolve(process.cwd(), '../client/dist');
app.use(express.static(clientDistDir));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/player') || req.path.startsWith('/uploads') || req.path.startsWith('/ws')) {
    return next();
  }
  res.sendFile(path.join(clientDistDir, 'index.html'), (err) => {
    if (err) {
      // If client not built yet, redirect or show message
      res.redirect('/player');
    }
  });
});

// Initialize WebSocket Server
WsServer.init(server);

// Start periodic heartbeat scanner (30s check, 90s timeout)
HeartbeatService.startScanner(30000, 90);

// Initialize DB and start listening
async function bootstrap() {
  try {
    await runSeed();
  } catch (seedErr) {
    console.warn('Initial seed check warning:', seedErr);
  }

  server.listen(config.port, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(` Kurum İçi Dijital Bilgi Ekranı Sunucusu Başlatıldı `);
    console.log(` Port: ${config.port}`);
    console.log(` Admin Paneli: http://localhost:${config.port}`);
    console.log(` TV Player:   http://localhost:${config.port}/player`);
    console.log(` API:         http://localhost:${config.port}/api`);
    console.log(`=======================================================`);
  });
}

bootstrap().catch((err) => {
  console.error('Sunucu başlatma hatası:', err);
  process.exit(1);
});
