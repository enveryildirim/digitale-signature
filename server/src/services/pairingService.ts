import crypto from 'crypto';
import { prisma } from '../db.js';

// Clean character set without easily confused characters (no 0, O, 1, I)
const CODE_CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

export function generatePairingCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    const randomIndex = crypto.randomInt(0, CODE_CHARS.length);
    code += CODE_CHARS[randomIndex];
  }
  return code;
}

export class PairingService {
  /**
   * Registers a new screen or re-registers an existing one requesting a pairing code.
   */
  static async registerScreen(ipAddress?: string, userAgent?: string) {
    let pairingCode = generatePairingCode();

    // Check collision
    let exists = await prisma.screen.findUnique({ where: { pairingCode } });
    while (exists) {
      pairingCode = generatePairingCode();
      exists = await prisma.screen.findUnique({ where: { pairingCode } });
    }

    // Default screen name
    const count = await prisma.screen.count();
    const defaultName = `Ekran ${count + 1}`;

    const screen = await prisma.screen.create({
      data: {
        name: defaultName,
        pairingCode,
        isPaired: false,
        ipAddress: ipAddress || null,
        status: 'OFFLINE',
        playerVersion: '1.0.0'
      }
    });

    return {
      screenId: screen.id,
      pairingCode: screen.pairingCode,
      name: screen.name
    };
  }

  /**
   * Approves a pairing code by admin, assigning screen name, group, and generating deviceToken.
   */
  static async pairScreen(pairingCode: string, name: string, groupId?: string) {
    const screen = await prisma.screen.findUnique({
      where: { pairingCode: pairingCode.toUpperCase().trim() }
    });

    if (!screen) {
      throw new Error('Geçersiz veya süresi dolmuş eşleştirme kodu.');
    }

    const deviceToken = crypto.randomUUID();

    const updated = await prisma.screen.update({
      where: { id: screen.id },
      data: {
        name: name.trim() || screen.name,
        groupId: groupId || null,
        deviceToken,
        isPaired: true,
        pairingCode: null, // Clear used pairing code
        status: 'ONLINE',
        lastSeen: new Date()
      },
      include: {
        group: true
      }
    });

    return {
      screen: updated,
      deviceToken
    };
  }

  /**
   * Unpairs a screen and generates a fresh pairing code.
   */
  static async unpairScreen(screenId: string) {
    let pairingCode = generatePairingCode();

    const screen = await prisma.screen.update({
      where: { id: screenId },
      data: {
        isPaired: false,
        deviceToken: null,
        pairingCode,
        status: 'OFFLINE'
      }
    });

    return screen;
  }
}
