import { WsServer } from '../ws/wsServer.js';

export interface EmergencyAlert {
  active: boolean;
  title: string;
  message: string;
  level: 'CRITICAL' | 'WARNING' | 'INFO';
  activatedAt: Date | null;
}

export class EmergencyService {
  private static state: EmergencyAlert = {
    active: false,
    title: '',
    message: '',
    level: 'CRITICAL',
    activatedAt: null
  };

  static getState(): EmergencyAlert {
    return { ...this.state };
  }

  static activate(title: string, message: string, level: 'CRITICAL' | 'WARNING' | 'INFO' = 'CRITICAL'): EmergencyAlert {
    this.state = {
      active: true,
      title: title.trim(),
      message: message.trim(),
      level,
      activatedAt: new Date()
    };

    // Broadcast instant emergency alert to all TVs via WebSocket
    WsServer.notifyAllScreensSync();

    return this.getState();
  }

  static deactivate(): EmergencyAlert {
    this.state = {
      active: false,
      title: '',
      message: '',
      level: 'CRITICAL',
      activatedAt: null
    };

    // Broadcast resume normal playback to all TVs
    WsServer.notifyAllScreensSync();

    return this.getState();
  }
}

