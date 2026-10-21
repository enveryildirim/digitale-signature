import crypto from 'crypto';
import { prisma } from '../db.js';
import { EmergencyService, EmergencyAlert } from './emergencyService.js';

export interface ManifestResult {
  screenId: string;
  screenName: string;
  groupName: string | null;
  emergency?: EmergencyAlert | null;
  playlist: {
    id: string;
    name: string;
    items: Array<{
      id: string;
      order: number;
      duration: number;
      media: {
        id: string;
        title: string;
        type: string;
        url: string;
        duration: number;
      };
    }>;
  } | null;
  hash: string;
}

export class ManifestResolver {
  /**
   * Evaluates active assignments for a screen at a given timestamp.
   * Priority:
   * 0. Emergency Alert Override (SCH-5)
   * 1. Screen-specific scheduled rule
   * 2. Group-specific scheduled rule
   * 3. Screen-specific default assignment
   * 4. Group-specific default assignment
   */
  static async resolveForScreen(screenId: string, atTime: Date = new Date()): Promise<ManifestResult> {
    const screen = await prisma.screen.findUnique({
      where: { id: screenId },
      include: {
        group: true
      }
    });

    if (!screen) {
      throw new Error('Ekran bulunamadı.');
    }

    // Level 0: Global Emergency Override (SCH-5)
    const emergency = EmergencyService.getState();
    if (emergency.active) {
      return {
        screenId: screen.id,
        screenName: screen.name,
        groupName: screen.group ? screen.group.name : null,
        emergency,
        playlist: null,
        hash: `emergency-${emergency.activatedAt ? emergency.activatedAt.getTime() : 'active'}`
      };
    }

    // Fetch all assignments for this screen or its group
    const targetFilter = screen.groupId
      ? { OR: [{ screenId: screen.id }, { groupId: screen.groupId }] }
      : { screenId: screen.id };

    const assignments = await prisma.assignment.findMany({
      where: targetFilter,
      include: {
        playlist: {
          include: {
            items: {
              include: { media: true },
              orderBy: { order: 'asc' }
            }
          }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    // Determine current day of week (1=Monday ... 7=Sunday)
    const jsDay = atTime.getDay();
    const dayOfWeek = jsDay === 0 ? 7 : jsDay;
    const currentMinutes = atTime.getHours() * 60 + atTime.getMinutes();

    function isTimeMatch(assignment: typeof assignments[0]): boolean {
      // 1. Date Range Check
      if (assignment.startDate && atTime < assignment.startDate) return false;
      if (assignment.endDate && atTime > assignment.endDate) return false;

      // 2. Day of Week Check
      if (assignment.daysOfWeek && assignment.daysOfWeek.trim().length > 0) {
        const allowedDays = assignment.daysOfWeek.split(',').map(d => parseInt(d.trim(), 10));
        if (!allowedDays.includes(dayOfWeek)) return false;
      }

      // 3. Time Range Check (HH:mm)
      if (assignment.startTime && assignment.endTime) {
        const [startH, startM] = assignment.startTime.split(':').map(Number);
        const [endH, endM] = assignment.endTime.split(':').map(Number);
        const startTotal = startH * 60 + startM;
        const endTotal = endH * 60 + endM;

        if (startTotal <= endTotal) {
          if (currentMinutes < startTotal || currentMinutes >= endTotal) return false;
        } else {
          // Cross-midnight range (e.g. 22:00 - 02:00)
          if (currentMinutes < startTotal && currentMinutes >= endTotal) return false;
        }
      }

      return true;
    }

    // Categorize
    let chosenAssignment: typeof assignments[0] | null = null;

    // Level 1: Screen-specific scheduled rule
    chosenAssignment = assignments.find(a => a.screenId === screen.id && !a.isDefault && isTimeMatch(a)) || null;

    // Level 2: Group-specific scheduled rule
    if (!chosenAssignment && screen.groupId) {
      chosenAssignment = assignments.find(a => a.groupId === screen.groupId && !a.isDefault && isTimeMatch(a)) || null;
    }

    // Level 3: Screen-specific default assignment
    if (!chosenAssignment) {
      chosenAssignment = assignments.find(a => a.screenId === screen.id && a.isDefault) || null;
    }

    // Level 4: Group-specific default assignment
    if (!chosenAssignment && screen.groupId) {
      chosenAssignment = assignments.find(a => a.groupId === screen.groupId && a.isDefault) || null;
    }

    if (!chosenAssignment || !chosenAssignment.playlist) {
      return {
        screenId: screen.id,
        screenName: screen.name,
        groupName: screen.group ? screen.group.name : null,
        playlist: null,
        hash: 'empty'
      };
    }

    const playlist = chosenAssignment.playlist;
    const formattedItems = playlist.items.map(item => ({
      id: item.id,
      order: item.order,
      duration: item.duration || item.media.duration || 10,
      media: {
        id: item.media.id,
        title: item.media.title,
        type: item.media.type,
        url: item.media.url,
        duration: item.media.duration
      }
    }));

    const contentForHash = JSON.stringify({
      playlistId: playlist.id,
      items: formattedItems.map(i => ({ id: i.id, url: i.media.url, duration: i.duration }))
    });
    const hash = crypto.createHash('md5').update(contentForHash).digest('hex');

    return {
      screenId: screen.id,
      screenName: screen.name,
      groupName: screen.group ? screen.group.name : null,
      playlist: {
        id: playlist.id,
        name: playlist.name,
        items: formattedItems
      },
      hash
    };
  }
}
