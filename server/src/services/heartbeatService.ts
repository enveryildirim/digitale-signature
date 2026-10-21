import { prisma } from '../db.js';

export class HeartbeatService {
  private static checkInterval: NodeJS.Timeout | null = null;

  /**
   * Records a heartbeat from a screen device.
   */
  static async recordHeartbeat(screenId: string, currentMedia?: string | null, playerVersion?: string | null) {
    return prisma.screen.update({
      where: { id: screenId },
      data: {
        lastSeen: new Date(),
        status: 'ONLINE',
        currentMedia: currentMedia || null,
        playerVersion: playerVersion || '1.0.0'
      }
    });
  }

  /**
   * Starts periodic scanner to flag screens as OFFLINE if no heartbeat in 90 seconds.
   */
  static startScanner(intervalMs: number = 30000, timeoutSeconds: number = 90) {
    if (this.checkInterval) return;

    this.checkInterval = setInterval(async () => {
      try {
        const threshold = new Date(Date.now() - timeoutSeconds * 1000);
        await prisma.screen.updateMany({
          where: {
            isPaired: true,
            status: 'ONLINE',
            lastSeen: {
              lt: threshold
            }
          },
          data: {
            status: 'OFFLINE'
          }
        });
      } catch (err) {
        console.error('Heartbeat scanner error:', err);
      }
    }, intervalMs);
  }

  static stopScanner() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}
