export interface User {
  id: string;
  username: string;
  name: string;
  role: 'ADMIN' | 'EDITOR';
  email?: string;
}

export interface ScreenGroup {
  id: string;
  name: string;
  description?: string;
  screens?: Screen[];
  assignments?: Assignment[];
  createdAt: string;
}

export interface Screen {
  id: string;
  name: string;
  pairingCode?: string | null;
  deviceToken?: string | null;
  isPaired: boolean;
  groupId?: string | null;
  group?: ScreenGroup | null;
  ipAddress?: string | null;
  lastSeen?: string | null;
  status: 'ONLINE' | 'OFFLINE';
  currentMedia?: string | null;
  playerVersion?: string | null;
  assignments?: Assignment[];
  createdAt: string;
}

export interface Media {
  id: string;
  title: string;
  type: 'IMAGE' | 'VIDEO' | 'URL';
  url: string;
  mimeType?: string | null;
  fileSize?: number | null;
  duration: number;
  soundEnabled: boolean;
  _count?: { items: number };
  createdAt: string;
}

export interface PlaylistItem {
  id: string;
  playlistId: string;
  mediaId: string;
  media: Media;
  order: number;
  duration: number;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  items: PlaylistItem[];
  assignments?: Assignment[];
  totalDuration?: number;
  itemCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Assignment {
  id: string;
  playlistId: string;
  playlist?: Playlist;
  screenId?: string | null;
  screen?: Screen | null;
  groupId?: string | null;
  group?: ScreenGroup | null;
  isDefault: boolean;
  daysOfWeek?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  priority: number;
  createdAt: string;
}
