import React, { useState, useEffect } from 'react';
import { api } from './api';
import { User, Screen, ScreenGroup, Media as MediaType, Playlist, Assignment } from './types';
import { Navbar } from './components/Navbar';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Screens } from './pages/Screens';
import { Groups } from './pages/Groups';
import { Media } from './pages/Media';
import { Playlists } from './pages/Playlists';
import { Schedules } from './pages/Schedules';
import { PairScreenModal } from './components/PairScreenModal';
import { MediaUploadModal } from './components/MediaUploadModal';
import { PlaylistModal } from './components/PlaylistModal';
import { ScheduleModal } from './components/ScheduleModal';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('signage_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('signage_auth_token'));
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  // Data states
  const [screens, setScreens] = useState<Screen[]>([]);
  const [groups, setGroups] = useState<ScreenGroup[]>([]);
  const [media, setMedia] = useState<MediaType[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals
  const [isPairModalOpen, setIsPairModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadAllData = async () => {
    if (!token) return;
    try {
      const [screensData, groupsData, mediaData, playlistsData, assignmentsData] = await Promise.all([
        api.getScreens(),
        api.getGroups(),
        api.getMedia(),
        api.getPlaylists(),
        api.getAssignments()
      ]);
      setScreens(screensData);
      setGroups(groupsData);
      setMedia(mediaData);
      setPlaylists(playlistsData);
      setAssignments(assignmentsData);
    } catch (err: any) {
      console.error('Veri yükleme hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadAllData();
      // Periodically refresh screen heartbeat status every 10s
      const timer = setInterval(loadAllData, 10000);
      return () => clearInterval(timer);
    } else {
      setLoading(false);
    }
  }, [token]);

  const handleLoginSuccess = (loggedInUser: User, authToken: string) => {
    setUser(loggedInUser);
    setToken(authToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('signage_auth_token');
    localStorage.removeItem('signage_user');
    setUser(null);
    setToken(null);
  };

  // Screen Actions
  const handlePairScreen = async (data: { pairingCode: string; name: string; groupId?: string }) => {
    await api.pairScreen(data);
    showToast('TV ekranı başarıyla eşleştirildi!');
    loadAllData();
  };

  const handleSyncScreen = async (id: string) => {
    await api.syncScreen(id);
    showToast('Ekran yenileme sinyali gönderildi.');
  };

  const handleSyncAll = async () => {
    await api.syncAllScreens();
    showToast('Tüm TV ekranlarına anlık yayın yenileme sinyali iletildi!');
  };

  const handleUnpairScreen = async (id: string) => {
    if (confirm('Bu ekranın eşleştirmesini sıfırlamak istediğinize emin misiniz?')) {
      await api.unpairScreen(id);
      showToast('Ekran eşleştirmesi kaldırıldı.');
      loadAllData();
    }
  };

  const handleDeleteScreen = async (id: string) => {
    if (confirm('Bu TV ekranını sistemden tamamen silmek istediğinize emin misiniz?')) {
      await api.deleteScreen(id);
      showToast('Ekran silindi.');
      loadAllData();
    }
  };

  const handleUpdateScreenGroup = async (id: string, groupId: string | null) => {
    await api.updateScreen(id, { groupId });
    showToast('Ekranın kat grubu güncellendi.');
    loadAllData();
  };

  // Group Actions
  const handleCreateGroup = async (data: { name: string; description?: string }) => {
    await api.createGroup(data);
    showToast('Yeni kat grubu oluşturuldu.');
    loadAllData();
  };

  const handleUpdateGroup = async (id: string, data: { name?: string; description?: string }) => {
    await api.updateGroup(id, data);
    showToast('Grup güncellendi.');
    loadAllData();
  };

  const handleDeleteGroup = async (id: string) => {
    if (confirm('Bu grubu silmek istediğinize emin misiniz?')) {
      await api.deleteGroup(id);
      showToast('Grup silindi.');
      loadAllData();
    }
  };

  // Media Actions
  const handleUploadFile = async (formData: FormData) => {
    await api.uploadMedia(formData);
    showToast('Medya dosyası yüklendi.');
    loadAllData();
  };

  const handleAddUrl = async (data: { title: string; url: string; duration?: number }) => {
    await api.addUrlMedia(data);
    showToast('Web sayfası medyası eklendi.');
    loadAllData();
  };

  const handleDeleteMedia = async (id: string) => {
    if (confirm('Bu medyayı silmek istediğinize emin misiniz?')) {
      await api.deleteMedia(id);
      showToast('Medya silindi.');
      loadAllData();
    }
  };

  // Playlist Actions
  const handleSavePlaylist = async (data: { name: string; description?: string; items: Array<{ mediaId: string; duration: number }> }) => {
    if (editingPlaylist) {
      await api.updatePlaylist(editingPlaylist.id, data);
      showToast('Playlist başarıyla güncellendi.');
    } else {
      await api.createPlaylist(data);
      showToast('Yeni playlist oluşturuldu.');
    }
    loadAllData();
  };

  const handleDeletePlaylist = async (id: string) => {
    if (confirm('Bu playlisti silmek istediğinize emin misiniz?')) {
      await api.deletePlaylist(id);
      showToast('Playlist silindi.');
      loadAllData();
    }
  };

  // Schedule Actions
  const handleSaveSchedule = async (data: any) => {
    await api.createAssignment(data);
    showToast('Yayın planı kaydedildi ve TV ekranlarına iletildi!');
    loadAllData();
  };

  const handleDeleteSchedule = async (id: string) => {
    if (confirm('Bu yayın atamasını kaldırmak istediğinize emin misiniz?')) {
      await api.deleteAssignment(id);
      showToast('Yayın ataması kaldırıldı.');
      loadAllData();
    }
  };

  if (!token) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const onlineScreensCount = screens.filter((s) => s.isPaired && s.status === 'ONLINE').length;
  const totalPairedScreens = screens.filter((s) => s.isPaired).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        user={user}
        onLogout={handleLogout}
        onSyncAll={handleSyncAll}
        onlineCount={onlineScreensCount}
        totalScreens={totalPairedScreens}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {currentTab === 'dashboard' && (
              <Dashboard
                screens={screens}
                groups={groups}
                playlists={playlists}
                media={media}
                onOpenPairModal={() => setIsPairModalOpen(true)}
                onOpenUploadModal={() => setIsUploadModalOpen(true)}
                onOpenPlaylistModal={() => { setEditingPlaylist(null); setIsPlaylistModalOpen(true); }}
                onOpenScheduleModal={() => setIsScheduleModalOpen(true)}
                onSyncScreen={handleSyncScreen}
              />
            )}

            {currentTab === 'screens' && (
              <Screens
                screens={screens}
                groups={groups}
                onOpenPairModal={() => setIsPairModalOpen(true)}
                onSyncScreen={handleSyncScreen}
                onSyncAll={handleSyncAll}
                onUnpairScreen={handleUnpairScreen}
                onDeleteScreen={handleDeleteScreen}
                onUpdateScreenGroup={handleUpdateScreenGroup}
              />
            )}

            {currentTab === 'groups' && (
              <Groups
                groups={groups}
                onCreateGroup={handleCreateGroup}
                onUpdateGroup={handleUpdateGroup}
                onDeleteGroup={handleDeleteGroup}
              />
            )}

            {currentTab === 'media' && (
              <Media
                mediaList={media}
                onOpenUploadModal={() => setIsUploadModalOpen(true)}
                onDeleteMedia={handleDeleteMedia}
              />
            )}

            {currentTab === 'playlists' && (
              <Playlists
                playlists={playlists}
                onOpenCreateModal={() => { setEditingPlaylist(null); setIsPlaylistModalOpen(true); }}
                onOpenEditModal={(pl) => { setEditingPlaylist(pl); setIsPlaylistModalOpen(true); }}
                onDeletePlaylist={handleDeletePlaylist}
              />
            )}

            {currentTab === 'schedules' && (
              <Schedules
                assignments={assignments}
                onOpenScheduleModal={() => setIsScheduleModalOpen(true)}
                onDeleteAssignment={handleDeleteSchedule}
              />
            )}
          </>
        )}
      </main>

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl border text-xs font-semibold animate-in slide-in-from-bottom-5 ${
            toast.type === 'success'
              ? 'bg-slate-900 border-emerald-500/50 text-emerald-400'
              : 'bg-slate-900 border-red-500/50 text-red-400'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Modals */}
      <PairScreenModal
        isOpen={isPairModalOpen}
        onClose={() => setIsPairModalOpen(false)}
        groups={groups}
        onPair={handlePairScreen}
      />

      <MediaUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadFile={handleUploadFile}
        onAddUrl={handleAddUrl}
      />

      <PlaylistModal
        isOpen={isPlaylistModalOpen}
        onClose={() => { setIsPlaylistModalOpen(false); setEditingPlaylist(null); }}
        playlist={editingPlaylist}
        allMedia={media}
        onSave={handleSavePlaylist}
      />

      <ScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        playlists={playlists}
        screens={screens.filter((s) => s.isPaired)}
        groups={groups}
        onSave={handleSaveSchedule}
      />
    </div>
  );
};
export default App;
