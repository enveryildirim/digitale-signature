// Pure functions shared by the admin API layer and node tests (no imports, erasable types only).
// Eski sunucudaki ManifestResolver sorgusunun karşılığı: her eşleşmiş TV için aday atamaları
// playlist + medya ile gömülü olarak hazırlar; TV hangisinin oynayacağını player/resolver.js ile seçer.

export interface DbGroup { name: string; description?: string | null; createdAt: string; updatedAt?: string }
export interface DbScreen {
  name: string;
  groupId?: string | null;
  deviceToken?: string | null;
  isPaired: boolean;
  createdAt: string;
  updatedAt?: string;
}
export interface DbMedia {
  title: string;
  type: 'IMAGE' | 'VIDEO' | 'URL';
  url: string;
  storagePath?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  duration: number;
  createdAt: string;
  updatedAt?: string;
}
export interface DbPlaylistItem { id: string; mediaId: string; order: number; duration: number }
export interface DbPlaylist {
  name: string;
  description?: string | null;
  items?: DbPlaylistItem[];
  createdAt: string;
  updatedAt: string;
}
export interface DbAssignment {
  playlistId: string;
  screenId?: string | null;
  groupId?: string | null;
  isDefault: boolean;
  daysOfWeek?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  priority: number;
  createdAt: string;
  updatedAt?: string;
}

export interface DbData {
  groups: Record<string, DbGroup>;
  screens: Record<string, DbScreen>;
  media: Record<string, DbMedia>;
  playlists: Record<string, DbPlaylist>;
  assignments: Record<string, DbAssignment>;
}

export interface BundleAssignment {
  id: string;
  target: 'screen' | 'group';
  isDefault: boolean;
  daysOfWeek: string | null;
  startTime: string | null;
  endTime: string | null;
  startDate: string | null;
  endDate: string | null;
  priority: number;
  playlist: {
    id: string;
    name: string;
    items: Array<{
      id: string;
      order: number;
      duration: number;
      media: { id: string; title: string; type: string; url: string; duration: number };
    }>;
  };
}

export interface DeviceNode {
  screenId: string;
  name: string;
  groupName: string | null;
  bundle: { assignments: BundleAssignment[] };
}

export function playlistItems(playlist: DbPlaylist | undefined): DbPlaylistItem[] {
  return [...(playlist?.items || [])].filter(Boolean).sort((a, b) => a.order - b.order);
}

function embedPlaylist(data: DbData, playlistId: string): BundleAssignment['playlist'] | null {
  const playlist = data.playlists[playlistId];
  if (!playlist) return null;
  const items = playlistItems(playlist).flatMap((item) => {
    const media = data.media[item.mediaId];
    if (!media) return [];
    return [{
      id: item.id,
      order: item.order,
      duration: item.duration || media.duration || 10,
      media: { id: item.mediaId, title: media.title, type: media.type, url: media.url, duration: media.duration }
    }];
  });
  return { id: playlistId, name: playlist.name, items };
}

// Priority desc, then newest first (same ordering as the old Prisma query)
export function sortAssignments<T extends { priority: number; createdAt: string }>(list: T[]): T[] {
  return [...list].sort((a, b) => (b.priority - a.priority) || b.createdAt.localeCompare(a.createdAt));
}

export function buildDeviceNode(data: DbData, screenId: string): DeviceNode | null {
  const screen = data.screens[screenId];
  if (!screen || !screen.isPaired || !screen.deviceToken) return null;
  const groupId = screen.groupId || null;

  const relevant = Object.entries(data.assignments)
    .filter(([, a]) => a.screenId === screenId || (groupId !== null && a.groupId === groupId))
    .map(([id, a]) => ({ id, ...a }));

  const assignments = sortAssignments(relevant).flatMap((a): BundleAssignment[] => {
    const playlist = embedPlaylist(data, a.playlistId);
    if (!playlist) return [];
    return [{
      id: a.id,
      target: a.screenId === screenId ? 'screen' : 'group',
      isDefault: Boolean(a.isDefault),
      daysOfWeek: a.daysOfWeek || null,
      startTime: a.startTime || null,
      endTime: a.endTime || null,
      startDate: a.startDate || null,
      endDate: a.endDate || null,
      priority: a.priority || 1,
      playlist
    }];
  });

  return {
    screenId,
    name: screen.name,
    groupName: groupId && data.groups[groupId] ? data.groups[groupId].name : null,
    bundle: { assignments }
  };
}

// deviceToken -> device node for every paired screen
export function buildDeviceNodes(data: DbData): Record<string, DeviceNode> {
  const out: Record<string, DeviceNode> = {};
  for (const [id, screen] of Object.entries(data.screens)) {
    const node = buildDeviceNode(data, id);
    if (node && screen.deviceToken) out[screen.deviceToken] = node;
  }
  return out;
}
