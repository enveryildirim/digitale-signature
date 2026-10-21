import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage, Server } from 'http';
import { URL } from 'url';
import { prisma } from '../db.js';
import { HeartbeatService } from '../services/heartbeatService.js';

export interface PlaybackState {
  currentIndex: number;
  mediaId: string;
  mediaTitle: string;
  startedAt: number;
  duration: number;
}

export class WsServer {
  private static wss: WebSocketServer;
  // screenId -> WebSocket
  private static pairedSockets = new Map<string, WebSocket>();
  // screenId -> Set<WebSocket> (preview clients watching the screen)
  private static previewSockets = new Map<string, Set<WebSocket>>();
  // screenId -> WebSocket (unpaired screens waiting for 6-digit code approval)
  private static pairingSockets = new Map<string, WebSocket>();
  // screenId -> current live playback state
  private static livePlaybackStates = new Map<string, PlaybackState>();

  static getPlaybackState(screenId: string): PlaybackState | null {
    return this.livePlaybackStates.get(screenId) || null;
  }

  static async getPlaybackStateByToken(token: string): Promise<PlaybackState | null> {
    const screen = await prisma.screen.findUnique({
      where: { deviceToken: token },
      select: { id: true }
    });
    if (!screen) return null;
    return this.livePlaybackStates.get(screen.id) || null;
  }

  static init(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/ws/player' });

    this.wss.on('connection', async (ws: WebSocket, req: IncomingMessage) => {
      try {
        const fullUrl = `http://${req.headers.host}${req.url}`;
        const parsed = new URL(fullUrl);
        const token = parsed.searchParams.get('token');
        const isPreview = parsed.searchParams.get('preview') === 'true';
        const screenIdParam = parsed.searchParams.get('screenId');

        if (token) {
          // Screen with deviceToken
          const screen = await prisma.screen.findUnique({
            where: { deviceToken: token }
          });

          if (!screen) {
            ws.send(JSON.stringify({ action: 'ERROR', message: 'Geçersiz aygıt belirteci.' }));
            ws.close();
            return;
          }

          const screenId = screen.id;

          if (isPreview) {
            // Register as preview client
            if (!this.previewSockets.has(screenId)) {
              this.previewSockets.set(screenId, new Set());
            }
            this.previewSockets.get(screenId)!.add(ws);

            // Send current live playback state immediately if available
            const currentState = this.livePlaybackStates.get(screenId);
            if (currentState) {
              ws.send(JSON.stringify({
                action: 'PLAYBACK_STATUS',
                ...currentState
              }));
            }

            ws.on('close', () => {
              const set = this.previewSockets.get(screenId);
              if (set) {
                set.delete(ws);
                if (set.size === 0) this.previewSockets.delete(screenId);
              }
            });
            return;
          }

          // Real TV Device Connection
          this.pairedSockets.set(screenId, ws);

          // Update online status immediately
          await HeartbeatService.recordHeartbeat(screenId, null, '1.0.0');

          ws.on('message', async (data) => {
            try {
              const msg = JSON.parse(data.toString());
              if (msg.action === 'HEARTBEAT') {
                await HeartbeatService.recordHeartbeat(
                  screenId,
                  msg.currentMedia,
                  msg.playerVersion
                );
              } else if (msg.action === 'PLAYBACK_STATUS') {
                // TV is reporting what it is playing right now
                const state: PlaybackState = {
                  currentIndex: msg.currentIndex,
                  mediaId: msg.mediaId,
                  mediaTitle: msg.mediaTitle,
                  startedAt: msg.startedAt || Date.now(),
                  duration: msg.duration || 10
                };
                this.livePlaybackStates.set(screenId, state);

                // Update database currentMedia
                if (msg.mediaTitle) {
                  prisma.screen.update({
                    where: { id: screenId },
                    data: { currentMedia: msg.mediaTitle }
                  }).catch(() => {});
                }

                // Broadcast live playback status to any preview modals watching this TV
                const previews = this.previewSockets.get(screenId);
                if (previews && previews.size > 0) {
                  const payload = JSON.stringify({
                    action: 'PLAYBACK_STATUS',
                    ...state
                  });
                  for (const pWs of previews) {
                    if (pWs.readyState === WebSocket.OPEN) {
                      pWs.send(payload);
                    }
                  }
                }
              }
            } catch (err) {
              console.warn('WS message parse error:', err);
            }
          });

          ws.on('close', () => {
            this.pairedSockets.delete(screenId);
          });

        } else if (screenIdParam) {
          // Unpaired screen waiting for pairing code
          this.pairingSockets.set(screenIdParam, ws);

          ws.on('close', () => {
            this.pairingSockets.delete(screenIdParam);
          });
        }
      } catch (err) {
        console.error('WS Connection error:', err);
        ws.close();
      }
    });

    console.log('WebSocket server initialized at /ws/player');
  }

  /**
   * Notifies an unpaired TV that it has been paired, delivering its deviceToken.
   */
  static notifyPairingSuccess(screenId: string, deviceToken: string, screenName: string) {
    const ws = this.pairingSockets.get(screenId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        action: 'PAIRED',
        deviceToken,
        screenName
      }));
      this.pairingSockets.delete(screenId);
    }
  }

  /**
   * Signals a specific screen to re-sync its manifest immediately.
   */
  static notifyScreenSync(screenId: string) {
    const ws = this.pairedSockets.get(screenId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ action: 'SYNC_MANIFEST' }));
    }
  }

  /**
   * Signals all screens in a group (floor) to re-sync their manifest immediately.
   */
  static async notifyGroupSync(groupId: string) {
    const screens = await prisma.screen.findMany({
      where: { groupId, isPaired: true },
      select: { id: true }
    });

    for (const screen of screens) {
      this.notifyScreenSync(screen.id);
    }
  }

  /**
   * Signals all connected paired screens to re-sync.
   */
  static notifyAllScreensSync() {
    for (const ws of this.pairedSockets.values()) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ action: 'SYNC_MANIFEST' }));
      }
    }
  }

  /**
   * Tells a screen that it was unpaired by admin.
   */
  static notifyUnpair(screenId: string) {
    const ws = this.pairedSockets.get(screenId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ action: 'UNPAIR' }));
      ws.close();
    }
    this.pairedSockets.delete(screenId);
  }
}
