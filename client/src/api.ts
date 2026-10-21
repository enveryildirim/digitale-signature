import { User, Screen, ScreenGroup, Media, Playlist, Assignment } from './types';

const BASE_URL = '/api';

function getHeaders(isFormData = false): HeadersInit {
  const token = localStorage.getItem('signage_auth_token');
  const headers: Record<string, string> = {};
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const isFormData = options.body instanceof FormData;
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...getHeaders(isFormData),
      ...options.headers
    }
  });

  if (res.status === 401) {
    localStorage.removeItem('signage_auth_token');
    localStorage.removeItem('signage_user');
    window.location.reload();
    throw new Error('Oturum süresi doldu. Lütfen tekrar giriş yapın.');
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'İşlem sırasında bir hata oluştu.');
  }

  return data as T;
}

export const api = {
  // Auth
  login: (credentials: { username: string; password: string }) =>
    request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    }),
  getMe: () => request<User>('/auth/me'),

  // Screens
  getScreens: () => request<Screen[]>('/screens'),
  getScreen: (id: string) => request<Screen>(`/screens/${id}`),
  pairScreen: (data: { pairingCode: string; name: string; groupId?: string }) =>
    request<{ message: string; screen: Screen; deviceToken: string }>('/screens/pair', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateScreen: (id: string, data: { name?: string; groupId?: string | null }) =>
    request<Screen>(`/screens/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  unpairScreen: (id: string) =>
    request<{ message: string; screen: Screen }>(`/screens/${id}/unpair`, {
      method: 'POST'
    }),
  deleteScreen: (id: string) =>
    request<{ message: string }>(`/screens/${id}`, {
      method: 'DELETE'
    }),
  syncScreen: (id: string) =>
    request<{ message: string }>(`/screens/${id}/sync`, {
      method: 'POST'
    }),
  syncAllScreens: () =>
    request<{ message: string }>('/screens/sync-all', {
      method: 'POST'
    }),

  // Groups
  getGroups: () => request<ScreenGroup[]>('/groups'),
  createGroup: (data: { name: string; description?: string }) =>
    request<ScreenGroup>('/groups', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateGroup: (id: string, data: { name?: string; description?: string }) =>
    request<ScreenGroup>(`/groups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteGroup: (id: string) =>
    request<{ message: string }>(`/groups/${id}`, {
      method: 'DELETE'
    }),

  // Media
  getMedia: () => request<Media[]>('/media'),
  uploadMedia: (formData: FormData) =>
    request<Media>('/media/upload', {
      method: 'POST',
      body: formData
    }),
  addUrlMedia: (data: { title: string; url: string; duration?: number }) =>
    request<Media>('/media/url', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateMedia: (id: string, data: { title?: string; duration?: number }) =>
    request<Media>(`/media/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteMedia: (id: string) =>
    request<{ message: string }>(`/media/${id}`, {
      method: 'DELETE'
    }),

  // Playlists
  getPlaylists: () => request<Playlist[]>('/playlists'),
  getPlaylist: (id: string) => request<Playlist>(`/playlists/${id}`),
  createPlaylist: (data: { name: string; description?: string; items?: Array<{ mediaId: string; duration: number }> }) =>
    request<Playlist>('/playlists', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updatePlaylist: (id: string, data: { name?: string; description?: string; items?: Array<{ mediaId: string; duration: number }> }) =>
    request<Playlist>(`/playlists/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deletePlaylist: (id: string) =>
    request<{ message: string }>(`/playlists/${id}`, {
      method: 'DELETE'
    }),

  // Assignments / Scheduling
  getAssignments: () => request<Assignment[]>('/assignments'),
  createAssignment: (data: Partial<Assignment>) =>
    request<Assignment>('/assignments', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateAssignment: (id: string, data: Partial<Assignment>) =>
    request<Assignment>(`/assignments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteAssignment: (id: string) =>
    request<{ message: string }>(`/assignments/${id}`, {
      method: 'DELETE'
    })
};
