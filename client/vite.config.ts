import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

const PLAYER_DIR = path.resolve(__dirname, '../player');

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml'
};

// Firebase Hosting'in sunduğu /player/ ve /__/firebase/init.json yollarını yerelde taklit eder,
// derlemede player'ı dist/player altına kopyalar (tek Hosting klasörü).
function signageHosting(mode: string): Plugin {
  const env = loadEnv(mode, __dirname, 'VITE_FIREBASE_');
  const firebaseConfig = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: env.VITE_FIREBASE_DATABASE_URL,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    appId: env.VITE_FIREBASE_APP_ID
  };

  return {
    name: 'signage-hosting',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url || '').split('?')[0];
        if (url === '/__/firebase/init.json') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(firebaseConfig));
          return;
        }
        if (url === '/player') {
          res.statusCode = 301;
          res.setHeader('Location', '/player/' + (req.url || '').slice('/player'.length));
          res.end();
          return;
        }
        if (url.startsWith('/player/')) {
          const file = path.join(PLAYER_DIR, url.slice('/player/'.length) || 'index.html');
          if (file.startsWith(PLAYER_DIR + path.sep) && fs.existsSync(file) && fs.statSync(file).isFile()) {
            res.setHeader('Content-Type', MIME[path.extname(file)] || 'application/octet-stream');
            res.end(fs.readFileSync(file));
            return;
          }
        }
        next();
      });
    },
    closeBundle() {
      fs.cpSync(PLAYER_DIR, path.resolve(__dirname, 'dist/player'), { recursive: true });
    }
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), signageHosting(mode)],
  server: {
    host: '0.0.0.0',
    port: 3000
  }
}));
