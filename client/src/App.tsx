import React, { useState, useEffect } from 'react';
import { api } from './api';
import { User, Screen, ScreenGroup, Media as MediaType, Playlist, Assignment } from './types';
import { Navbar, Tab, TAB_IDS } from './components/Navbar';
import { Login } from './pages/Login';
import { Screens } from './pages/Screens';
import { Media } from './pages/Media';
import { Playlists } from './pages/Playlists';
import { Schedules } from './pages/Schedules';
import { PairScreenModal } from './components/PairScreenModal';
import { MediaUploadModal } from './components/MediaUploadModal';
import { MediaEditModal } from './components/MediaEditModal';
import { PlaylistModal } from './components/PlaylistModal';
import { ScheduleModal } from './components/ScheduleModal';
import { EmergencyModal } from './components/EmergencyModal';
import { ConfirmModal, ConfirmModalState } from './components/ConfirmModal';
import { Toast, ToastData, ToastType } from './components/Toast';
import { PageSkeleton } from './components/skeletons/PageSkeleton';

// Active tab lives in the URL hash so refresh and the browser back button work
const readTabFromHash = (): Tab => {
  const hash = window.location.hash.slice(1) as Tab;
  return TAB_IDS.includes(hash) ? hash : 'screens';
};

export const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('signage_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('signage_auth_token'));
  const [currentTab, setCurrentTabState] = useState<Tab>(readTabFromHash);

  // Data states
  const [screens, setScreens] = useState<Screen[]>([]);
  const [groups, setGroups] = useState<ScreenGroup[]>([]);
  const [media, setMedia] = useState<MediaType[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isEmergencyActive, setIsEmergencyActive] = useState<boolean>(false);

  // Modals
  const [isPairModalOpen, setIsPairModalOpen] = useState(false);
  const [pairModalInitialCode, setPairModalInitialCode] = useState<string>('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [editingMedia, setEditingMedia] = useState<MediaType | null>(null);
  const [isEditMediaModalOpen, setIsEditMediaModalOpen] = useState(false);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);

  // Confirm Modal state
  const [confirmModalState, setConfirmModalState] = useState<ConfirmModalState | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Toast state
  const [toast, setToast] = useState<ToastData | null>(null);

  const showToast = (
    message: string,
    type: ToastType = 'success',
    description?: string,
    undoAction?: { label?: string; onClick: () => void }
  ) => {
    setToast({
      message,
      type,
      description,
      undoAction
    });
  };

  useEffect(() => {
    const onHashChange = () => setCurrentTabState(readTabFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const setCurrentTab = (tab: Tab) => {
    window.location.hash = tab;
  };

  const loadAllData = async () => {
    if (!token) return;
    try {
      const [screensData, groupsData, mediaData, playlistsData, assignmentsData, emergencyData] = await Promise.all([
        api.getScreens(),
        api.getGroups(),
        api.getMedia(),
        api.getPlaylists(),
        api.getAssignments(),
        api.getEmergencyStatus().catch(() => ({ active: false, title: '', message: '', level: 'CRITICAL' }))
      ]);
      setScreens(screensData);
      setGroups(groupsData);
      setMedia(mediaData);
      setPlaylists(playlistsData);
      setAssignments(assignmentsData);
      setIsEmergencyActive(emergencyData.active);
    } catch (err: any) {
      console.error('Veri yükleme hatası:', err);
      showToast('Sunucu bağlantı hatası oluştu.', 'error', 'Lütfen yerel ağ bağlantınızı kontrol edin.');
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
    showToast('TV ekranı başarıyla sisteme bağlandı!', 'success', `${data.name} yayına hazır.`);
    loadAllData();
  };

  const handleSyncScreen = async (id: string) => {
    await api.syncScreen(id);
    showToast('Ekran yenileme sinyali iletildi.', 'info', 'TV yeni manifestoyu çekiyor.');
  };

  const handleSyncAll = async () => {
    await api.syncAllScreens();
    showToast('Tüm TV ekranlarına anlık yayın yenileme sinyali iletildi!', 'success');
  };

  const handleUnpairScreen = (id: string) => {
    const target = screens.find((s) => s.id === id);
    setConfirmModalState({
      isOpen: true,
      title: 'TV Eşleştirmesini Sıfırla',
      message: `"${target?.name || 'Bu TV'}" ekranının sunucu bağlantısı kesilecektir. TV ekranı bekleme moduna geçecek ve yeni bir 6 haneli eşleştirme kodu üretecektir.`,
      confirmLabel: 'Eşleştirmeyi Sıfırla',
      cancelLabel: 'Vazgeç',
      isDestructive: true,
      onConfirm: async () => {
        try {
          setConfirmLoading(true);
          await api.unpairScreen(id);
          showToast('Ekran eşleştirmesi kaldırıldı.', 'info', 'TV ekranında yeni eşleştirme kodu görüntülenecektir.');
          loadAllData();
        } finally {
          setConfirmLoading(false);
        }
      }
    });
  };

  const handleDeleteScreen = (id: string) => {
    const target = screens.find((s) => s.id === id);
    setConfirmModalState({
      isOpen: true,
      title: 'TV Ekranını Sistemden Kaldır',
      message: `"${target?.name || 'Bu TV'}" ekranı ve tüm yayın ayarları veritabanından kalıcı olarak silinecektir.`,
      confirmLabel: 'Evet, TV Ekranını Sil',
      cancelLabel: 'Vazgeç',
      isDestructive: true,
      onConfirm: async () => {
        try {
          setConfirmLoading(true);
          await api.deleteScreen(id);
          showToast('TV ekranı sistemden tamamen kaldırıldı.', 'success');
          loadAllData();
        } finally {
          setConfirmLoading(false);
        }
      }
    });
  };

  const handleUpdateScreen = async (id: string, data: { name?: string; groupId?: string | null }) => {
    try {
      await api.updateScreen(id, data);
      showToast('TV ekranı bilgileri başarıyla güncellendi.', 'success');
      loadAllData();
    } catch (err: any) {
      showToast(err.message || 'Güncelleme yapılamadı.', 'error');
    }
  };

  const handleQuickAssignScreen = async (screenId: string, playlistId: string | null) => {
    try {
      const res = await api.quickAssignScreen(screenId, playlistId);
      showToast(res.message, 'success', 'TV ekranına anlık yayın sinyali iletildi.');
      loadAllData();
    } catch (err: any) {
      showToast(err.message || 'Yayın atanamadı.', 'error');
    }
  };

  const handleQuickAssignGroup = async (groupId: string, playlistId: string | null) => {
    try {
      const res = await api.quickAssignGroup(groupId, playlistId);
      showToast(res.message, 'success', 'Bu kattaki tüm TV ekranlarına anlık yayın iletildi.');
      loadAllData();
    } catch (err: any) {
      showToast(err.message || 'Kat yayını atanamadı.', 'error');
    }
  };

  // Group Actions
  const handleCreateGroup = async (data: { name: string }) => {
    await api.createGroup(data);
    showToast(`"${data.name}" katı eklendi.`, 'success');
    loadAllData();
  };

  const handleUpdateGroup = async (id: string, data: { name: string }) => {
    try {
      await api.updateGroup(id, data);
      showToast('Kat adı güncellendi.', 'success');
      loadAllData();
    } catch (err: any) {
      showToast(err.message || 'Kat güncellenemedi.', 'error');
    }
  };

  const handleDeleteGroup = async (id: string) => {
    const target = groups.find((g) => g.id === id);
    setConfirmModalState({
      isOpen: true,
      title: 'Katı Sil',
      message: `"${target?.name || 'Bu kat'}" silindiğinde bu kattaki TV'ler "Kat atanmamış" bölümüne taşınır ve kata atanmış yayınlar sonlanır.`,
      confirmLabel: 'Katı Sil',
      cancelLabel: 'Vazgeç',
      isDestructive: true,
      onConfirm: async () => {
        try {
          setConfirmLoading(true);
          await api.deleteGroup(id);
          showToast('Kat silindi.', 'success');
          loadAllData();
        } finally {
          setConfirmLoading(false);
        }
      }
    });
  };

  // Media Actions
  const handleUploadFile = async (formData: FormData) => {
    await api.uploadMedia(formData);
    showToast('Medya dosyası kütüphaneye başarıyla yüklendi.', 'success');
    loadAllData();
  };

  const handleAddUrl = async (data: { title: string; url: string; duration?: number }) => {
    await api.addUrlMedia(data);
    showToast('Web sayfası medyası başarıyla eklendi.', 'success');
    loadAllData();
  };

  const handleAddTextAnnouncement = async (data: { title: string; message: string; bgColor?: string; textColor?: string; duration?: number }) => {
    await api.createTextAnnouncement(data);
    showToast('Metin duyurusu başarıyla oluşturuldu ve kütüphaneye eklendi.', 'success');
    loadAllData();
  };

  const handleUpdateMedia = async (id: string, data: { title?: string; duration?: number; url?: string; soundEnabled?: boolean } | FormData) => {
    try {
      await api.updateMedia(id, data);
      showToast('Medya bilgileri başarıyla güncellendi.', 'success');
      loadAllData();
    } catch (err: any) {
      showToast(err.message || 'Medya güncellenemedi.', 'error');
      throw err;
    }
  };

  const handleActivateEmergency = async (title: string, message: string) => {
    await api.activateEmergency({ title, message });
    setIsEmergencyActive(true);
    showToast('🚨 ACİL DURUM YAYINI TÜM EKRANLARA BASILDI!', 'error', 'Tüm normal yayınlar durduruldu.');
    loadAllData();
  };

  const handleDeactivateEmergency = async () => {
    await api.deactivateEmergency();
    setIsEmergencyActive(false);
    showToast('Acil durum yayını kaldırıldı.', 'success', 'TV ekranları olağan yayın akışına geri döndü.');
    loadAllData();
  };

  const handleDeleteMedia = async (id: string) => {
    const target = media.find((m) => m.id === id);
    setConfirmModalState({
      isOpen: true,
      title: 'Medyayı Kütüphaneden Sil',
      message: `"${target?.title || 'Bu medya'}" dosyası sunucudan kalıcı olarak silinecektir. Bu medyayı içeren oynatma listeleri güncellenecektir.`,
      confirmLabel: 'Evet, Kalıcı Olarak Sil',
      cancelLabel: 'Vazgeç',
      isDestructive: true,
      onConfirm: async () => {
        try {
          setConfirmLoading(true);
          await api.deleteMedia(id);
          showToast('Medya kütüphaneden silindi.', 'success');
          loadAllData();
        } finally {
          setConfirmLoading(false);
        }
      }
    });
  };

  // Playlist Actions
  const handleSavePlaylist = async (data: { name: string; description?: string; items: Array<{ mediaId: string; duration: number }> }) => {
    if (editingPlaylist) {
      await api.updatePlaylist(editingPlaylist.id, data);
      showToast('Oynatma listesi başarıyla güncellendi.', 'success');
    } else {
      await api.createPlaylist(data);
      showToast('Yeni oynatma listesi oluşturuldu.', 'success');
    }
    loadAllData();
  };

  const handleDeletePlaylist = async (id: string) => {
    const target = playlists.find((p) => p.id === id);
    setConfirmModalState({
      isOpen: true,
      title: 'Oynatma Listesini Sil',
      message: `"${target?.name || 'Bu oynatma listesi'}" silindiğinde, bu listeye bağlı TV ekranları varsayılan yayına veya bekleme ekranına dönecektir.`,
      confirmLabel: 'Evet, Listeyi Sil',
      cancelLabel: 'Vazgeç',
      isDestructive: true,
      onConfirm: async () => {
        try {
          setConfirmLoading(true);
          await api.deletePlaylist(id);
          showToast('Oynatma listesi silindi.', 'success');
          loadAllData();
        } finally {
          setConfirmLoading(false);
        }
      }
    });
  };

  // Schedule Actions
  const handleSaveSchedule = async (data: any) => {
    await api.createAssignment(data);
    showToast('Yayın planı kaydedildi ve TV ekranlarına iletildi!', 'success');
    loadAllData();
  };

  const handleDeleteSchedule = async (id: string) => {
    setConfirmModalState({
      isOpen: true,
      title: 'Yayın Planını Kaldır',
      message: 'Bu zamanlanmış yayın kuralı kaldırılacak ve hedef ekranlar varsayılan akışa dönecektir.',
      confirmLabel: 'Yayın Planını Kaldır',
      cancelLabel: 'Vazgeç',
      isDestructive: true,
      onConfirm: async () => {
        try {
          setConfirmLoading(true);
          await api.deleteAssignment(id);
          showToast('Yayın ataması kaldırıldı.', 'success');
          loadAllData();
        } finally {
          setConfirmLoading(false);
        }
      }
    });
  };

  if (!token) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const onlineScreensCount = screens.filter((s) => s.isPaired && s.status === 'ONLINE').length;
  const totalPairedScreens = screens.filter((s) => s.isPaired).length;
  const openNewPlaylistModal = () => {
    setEditingPlaylist(null);
    setIsPlaylistModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        user={user}
        onLogout={handleLogout}
        onlineCount={onlineScreensCount}
        totalScreens={totalPairedScreens}
        isEmergencyActive={isEmergencyActive}
        onOpenEmergencyModal={() => setIsEmergencyModalOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <PageSkeleton tab={currentTab} />
        ) : (
          <>
            {currentTab === 'screens' && (
              <Screens
                screens={screens}
                groups={groups}
                playlists={playlists}
                onOpenPairModal={(code) => {
                  setPairModalInitialCode(code || '');
                  setIsPairModalOpen(true);
                }}
                onSyncScreen={handleSyncScreen}
                onSyncAll={handleSyncAll}
                onUnpairScreen={handleUnpairScreen}
                onDeleteScreen={handleDeleteScreen}
                onUpdateScreen={handleUpdateScreen}
                onQuickAssignScreen={handleQuickAssignScreen}
                onQuickAssignGroup={handleQuickAssignGroup}
                onOpenPlaylistModal={openNewPlaylistModal}
                onCreateGroup={handleCreateGroup}
                onUpdateGroup={handleUpdateGroup}
                onDeleteGroup={handleDeleteGroup}
              />
            )}

            {currentTab === 'media' && (
              <Media
                mediaList={media}
                onOpenUploadModal={() => setIsUploadModalOpen(true)}
                onEditMedia={(m) => {
                  setEditingMedia(m);
                  setIsEditMediaModalOpen(true);
                }}
                onDeleteMedia={handleDeleteMedia}
              />
            )}

            {currentTab === 'playlists' && (
              <Playlists
                playlists={playlists}
                onOpenCreateModal={openNewPlaylistModal}
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

      {/* Toast Notification (UX-1.2) */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Custom Accessible Confirm Modal (UX-1.1) */}
      <ConfirmModal
        state={confirmModalState}
        onClose={() => setConfirmModalState(null)}
        loading={confirmLoading}
      />

      {/* Modals */}
      <PairScreenModal
        isOpen={isPairModalOpen}
        onClose={() => {
          setIsPairModalOpen(false);
          setPairModalInitialCode('');
        }}
        groups={groups}
        initialPairingCode={pairModalInitialCode}
        onPair={handlePairScreen}
      />

      <MediaUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadFile={handleUploadFile}
        onAddUrl={handleAddUrl}
        onAddTextAnnouncement={handleAddTextAnnouncement}
      />

      <MediaEditModal
        isOpen={isEditMediaModalOpen}
        onClose={() => {
          setIsEditMediaModalOpen(false);
          setEditingMedia(null);
        }}
        media={editingMedia}
        onUpdate={handleUpdateMedia}
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

      <EmergencyModal
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
        isActive={isEmergencyActive}
        onActivate={handleActivateEmergency}
        onDeactivate={handleDeactivateEmergency}
      />
    </div>
  );
};

export default App;
