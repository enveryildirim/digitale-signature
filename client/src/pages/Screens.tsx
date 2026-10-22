import React, { useState } from 'react';
import {
  Tv,
  Plus,
  RefreshCw,
  Building2,
  Film,
  WifiOff,
  Edit2,
  Trash2,
  Check,
  X,
  ChevronRight,
  Link2
} from 'lucide-react';
import { Screen, ScreenGroup, Playlist } from '../types';
import { ScreenDetailModal } from '../components/ScreenDetailModal';
import { EmptyState } from '../components/ui/EmptyState';
import { FilterChips } from '../components/ui/FilterChips';
import { formatLastSeen } from '../utils/format';

const NEW_PLAYLIST = '__new__';

interface ScreensProps {
  screens: Screen[];
  groups: ScreenGroup[];
  playlists: Playlist[];
  onOpenPairModal: (initialCode?: string) => void;
  onSyncScreen: (id: string) => void;
  onSyncAll: () => void;
  onUnpairScreen: (id: string) => void;
  onDeleteScreen: (id: string) => void;
  onUpdateScreen: (id: string, data: { name?: string; groupId?: string | null }) => Promise<void>;
  onQuickAssignScreen: (screenId: string, playlistId: string | null) => Promise<void>;
  onQuickAssignGroup: (groupId: string, playlistId: string | null) => Promise<void>;
  onOpenPlaylistModal: () => void;
  onCreateGroup: (data: { name: string }) => Promise<void>;
  onUpdateGroup: (id: string, data: { name: string }) => Promise<void>;
  onDeleteGroup: (id: string) => void;
}

type StatusFilter = 'all' | 'online' | 'offline';

const groupDefaultPlaylist = (group?: ScreenGroup | null) =>
  group?.assignments?.find((a) => a.isDefault)?.playlist ?? null;

export const Screens: React.FC<ScreensProps> = ({
  screens,
  groups,
  playlists,
  onOpenPairModal,
  onSyncScreen,
  onSyncAll,
  onUnpairScreen,
  onDeleteScreen,
  onUpdateScreen,
  onQuickAssignScreen,
  onQuickAssignGroup,
  onOpenPlaylistModal,
  onCreateGroup,
  onUpdateGroup,
  onDeleteGroup
}) => {
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [selectedScreenId, setSelectedScreenId] = useState<string | null>(null);
  const [isAddingGroup, setIsAddingGroup] = useState(false);

  const paired = screens.filter((s) => s.isPaired);
  const pending = screens.filter((s) => !s.isPaired);
  const online = paired.filter((s) => s.status === 'ONLINE');
  const offline = paired.filter((s) => s.status === 'OFFLINE');

  const visible = filter === 'online' ? online : filter === 'offline' ? offline : paired;
  const ungrouped = visible.filter((s) => !s.groupId || !groups.some((g) => g.id === s.groupId));
  // Floors with TVs first, empty floors (compact) at the bottom
  const sortedGroups = [...groups].sort(
    (a, b) => Number(!paired.some((s) => s.groupId === a.id)) - Number(!paired.some((s) => s.groupId === b.id))
  );
  // Detail modal reads the live object so status/preview stay current during polling
  const selectedScreen = screens.find((s) => s.id === selectedScreenId) ?? null;

  const rowProps = {
    groups,
    playlists,
    onAssign: onQuickAssignScreen,
    onOpenPlaylistModal,
    onOpenDetail: (s: Screen) => setSelectedScreenId(s.id)
  };

  return (
    <div className="space-y-5">
      {/* Header: the single place for counts and page-level actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">TV Ekranları</h2>
          <p className="text-sm text-slate-400 mt-1">
            <span className="text-emerald-400 font-semibold">{online.length}</span> / {paired.length} ekran çevrimiçi
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {paired.length > 0 && (
            <button onClick={onSyncAll} className="btn-secondary" title="Tüm TV'lere yayın yenileme sinyali gönder">
              <RefreshCw className="w-4 h-4" />
              Tümünü yenile
            </button>
          )}
          <button onClick={() => setIsAddingGroup(true)} className="btn-secondary">
            <Building2 className="w-4 h-4" />
            Kat ekle
          </button>
          <button onClick={() => onOpenPairModal()} className="btn-primary">
            <Plus className="w-4 h-4" />
            Yeni TV eşleştir
          </button>
        </div>
      </div>

      {/* Pending pairing requests */}
      {pending.length > 0 && (
        <div className="rounded-2xl border border-amber-700/50 bg-amber-950/30 p-4 space-y-3">
          <p className="text-sm font-semibold text-amber-300 flex items-center gap-2">
            <Link2 className="w-4 h-4" />
            Eşleşme bekleyen {pending.length} TV var
          </p>
          <div className="flex flex-wrap gap-2">
            {pending.map((s) => (
              <div key={s.id} className="flex items-center gap-1 bg-slate-950/60 border border-amber-800/40 rounded-xl pl-3 pr-1 py-1">
                <span className="font-mono font-bold tracking-widest text-amber-300 text-sm mr-2">{s.pairingCode}</span>
                <button onClick={() => onOpenPairModal(s.pairingCode || '')} className="px-2.5 py-1 rounded-lg text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950">
                  Eşleştir
                </button>
                <button
                  onClick={() => onDeleteScreen(s.id)}
                  title="Bu bekleyen kaydı sil"
                  aria-label={`${s.pairingCode} kodlu bekleyen kaydı sil`}
                  className="btn-ghost min-w-0 min-h-0 p-1.5"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Offline warning */}
      {offline.length > 0 && (
        <div className="rounded-2xl border border-rose-800/60 bg-rose-950/30 p-4 flex items-start gap-3">
          <WifiOff className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-rose-300">{offline.length} TV çevrimdışı</p>
            <p className="text-slate-400 mt-0.5">
              {offline.map((s) => s.name).join(', ')} — ekranın açık ve ağa bağlı olduğunu kontrol edin.
            </p>
          </div>
        </div>
      )}

      {isAddingGroup && (
        <AddGroupForm
          onCancel={() => setIsAddingGroup(false)}
          onSave={async (name) => {
            await onCreateGroup({ name });
            setIsAddingGroup(false);
          }}
        />
      )}

      {paired.length === 0 && groups.length === 0 ? (
        <EmptyState
          icon={Tv}
          title="Henüz eşleştirilmiş TV yok"
          description={
            <>
              TV tarayıcısında <span className="font-mono text-sky-400">/player</span> adresini açın, ekranda görünen 6 haneli kodu buraya girin.
            </>
          }
        >
          <button onClick={() => onOpenPairModal()} className="btn-primary">
            <Plus className="w-4 h-4" />
            İlk TV'yi eşleştir
          </button>
        </EmptyState>
      ) : (
        <>
          {paired.length > 0 && (
            <FilterChips
              value={filter}
              onChange={setFilter}
              options={[
                { value: 'all', label: 'Tümü', count: paired.length },
                { value: 'online', label: 'Çevrimiçi', count: online.length },
                { value: 'offline', label: 'Çevrimdışı', count: offline.length }
              ]}
            />
          )}

          <div className="space-y-4">
            {ungrouped.length > 0 && (
              <section className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <header className="px-4 py-3 border-b border-slate-800 flex items-center gap-2">
                  <Tv className="w-4 h-4 text-slate-400" />
                  <h3 className="text-sm font-semibold text-slate-300">Kat atanmamış</h3>
                  <span className="text-xs text-slate-500">{ungrouped.length} TV · detaydan bir kat seçin</span>
                </header>
                <ul className="divide-y divide-slate-800/70">
                  {ungrouped.map((s) => (
                    <ScreenRow key={s.id} screen={s} {...rowProps} />
                  ))}
                </ul>
              </section>
            )}

            {sortedGroups.map((group) => {
              const groupScreens = visible.filter((s) => s.groupId === group.id);
              if (filter !== 'all' && groupScreens.length === 0) return null;
              return (
                <FloorSection
                  key={group.id}
                  group={group}
                  screens={groupScreens}
                  totalOnline={online.filter((s) => s.groupId === group.id).length}
                  totalScreens={paired.filter((s) => s.groupId === group.id).length}
                  playlists={playlists}
                  onAssignGroup={onQuickAssignGroup}
                  onOpenPlaylistModal={onOpenPlaylistModal}
                  onRename={(name) => onUpdateGroup(group.id, { name })}
                  onDelete={() => onDeleteGroup(group.id)}
                  rowProps={rowProps}
                />
              );
            })}

            {visible.length === 0 && filter !== 'all' && (
              <EmptyState icon={Tv} title="Bu filtreye uyan TV yok">
                <button onClick={() => setFilter('all')} className="btn-secondary">
                  Tümünü göster
                </button>
              </EmptyState>
            )}
          </div>
        </>
      )}

      <ScreenDetailModal
        screen={selectedScreen}
        groups={groups}
        onClose={() => setSelectedScreenId(null)}
        onUpdate={onUpdateScreen}
        onSync={onSyncScreen}
        onUnpair={onUnpairScreen}
        onDelete={onDeleteScreen}
      />
    </div>
  );
};

// ==========================================
// Floor section: header with floor-wide playlist + compact TV rows
// ==========================================
interface RowSharedProps {
  groups: ScreenGroup[];
  playlists: Playlist[];
  onAssign: (screenId: string, playlistId: string | null) => Promise<void>;
  onOpenPlaylistModal: () => void;
  onOpenDetail: (screen: Screen) => void;
}

interface FloorSectionProps {
  group: ScreenGroup;
  screens: Screen[];
  totalOnline: number;
  totalScreens: number;
  playlists: Playlist[];
  onAssignGroup: (groupId: string, playlistId: string | null) => Promise<void>;
  onOpenPlaylistModal: () => void;
  onRename: (name: string) => Promise<void>;
  onDelete: () => void;
  rowProps: RowSharedProps;
}

const FloorSection: React.FC<FloorSectionProps> = ({
  group,
  screens,
  totalOnline,
  totalScreens,
  playlists,
  onAssignGroup,
  onOpenPlaylistModal,
  onRename,
  onDelete,
  rowProps
}) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const [draftName, setDraftName] = useState(group.name);
  const currentPlaylistId = group.assignments?.find((a) => a.isDefault)?.playlistId ?? '';

  const saveRename = async () => {
    const name = draftName.trim();
    if (!name || name === group.name) {
      setIsRenaming(false);
      return;
    }
    await onRename(name);
    setIsRenaming(false);
  };

  return (
    <section className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
      <header
        className={`px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          screens.length > 0 ? 'border-b border-slate-800' : ''
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Building2 className="w-4 h-4 text-sky-400 shrink-0" />
          {isRenaming ? (
            <form
              className="flex items-center gap-1"
              onSubmit={(e) => {
                e.preventDefault();
                saveRename();
              }}
            >
              <input
                autoFocus
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onKeyDown={(e) => e.key === 'Escape' && setIsRenaming(false)}
                aria-label="Kat adı"
                className="input-standard py-1 px-2 w-56"
              />
              <button type="submit" aria-label="Kaydet" className="btn-ghost">
                <Check className="w-4 h-4 text-emerald-400" />
              </button>
              <button type="button" onClick={() => setIsRenaming(false)} aria-label="Vazgeç" className="btn-ghost">
                <X className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <>
              <h3 className="text-sm font-semibold text-white truncate">{group.name}</h3>
              <span className="text-xs text-slate-400 whitespace-nowrap">
                {totalScreens === 0 ? 'TV yok' : `${totalOnline}/${totalScreens} çevrimiçi`}
              </span>
              <button
                onClick={() => {
                  setDraftName(group.name);
                  setIsRenaming(true);
                }}
                title="Katı yeniden adlandır"
                aria-label={`${group.name} katını yeniden adlandır`}
                className="btn-ghost min-w-0 min-h-0 p-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onDelete}
                title="Katı sil"
                aria-label={`${group.name} katını sil`}
                className="btn-ghost min-w-0 min-h-0 p-1.5 hover:text-rose-400"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-400">
          <span className="whitespace-nowrap">Kat yayını</span>
          <PlaylistSelect
            value={currentPlaylistId}
            playlists={playlists}
            emptyLabel="Yayın yok"
            onChange={(id) => onAssignGroup(group.id, id)}
            onCreateNew={onOpenPlaylistModal}
          />
        </label>
      </header>

      {screens.length > 0 && (
        <ul className="divide-y divide-slate-800/70">
          {screens.map((s) => (
            <ScreenRow key={s.id} screen={s} {...rowProps} />
          ))}
        </ul>
      )}
    </section>
  );
};

// ==========================================
// One TV = one row: status · name · now playing · playlist · detail
// ==========================================
const ScreenRow: React.FC<RowSharedProps & { screen: Screen }> = ({
  screen,
  groups,
  playlists,
  onAssign,
  onOpenPlaylistModal,
  onOpenDetail
}) => {
  const isOnline = screen.status === 'ONLINE';
  const directDefault = screen.assignments?.find((a) => a.isDefault);
  const group = groups.find((g) => g.id === screen.groupId);
  const floorPlaylist = groupDefaultPlaylist(group);

  const sourceLabel = directDefault
    ? 'Bu ekrana özel'
    : floorPlaylist
    ? 'Kat yayını'
    : 'Yayın atanmamış';

  return (
    <li className="px-4 py-3 grid grid-cols-1 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.2fr)_minmax(0,1.2fr)_auto] md:items-center gap-x-4 gap-y-2 hover:bg-slate-800/30 transition">
      {/* Status + name */}
      <button
        type="button"
        onClick={() => onOpenDetail(screen)}
        className="flex items-center gap-2.5 min-w-0 text-left group"
      >
        <span
          className={`w-2.5 h-2.5 rounded-full shrink-0 ${isOnline ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-rose-500'}`}
          aria-hidden="true"
        />
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-white truncate group-hover:text-sky-300">{screen.name}</span>
          <span className={`block text-xs ${isOnline ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isOnline ? 'Çevrimiçi' : `Çevrimdışı · ${formatLastSeen(screen.lastSeen)}`}
          </span>
        </span>
      </button>

      {/* Now playing */}
      <div className="flex items-center gap-2 min-w-0 text-sm">
        <Film className={`w-4 h-4 shrink-0 ${isOnline ? 'text-sky-400' : 'text-slate-600'}`} />
        <span className={`truncate ${isOnline ? 'text-slate-200' : 'text-slate-500'}`} title={screen.currentMedia || undefined}>
          {screen.currentMedia
            ? isOnline
              ? screen.currentMedia
              : `Son: ${screen.currentMedia}`
            : isOnline
            ? 'Yayın bekleniyor'
            : '—'}
        </span>
      </div>

      {/* Playlist */}
      <div className="min-w-0">
        <PlaylistSelect
          value={directDefault?.playlistId ?? ''}
          playlists={playlists}
          emptyLabel={screen.groupId ? `Kat yayınına uy${floorPlaylist ? ` (${floorPlaylist.name})` : ''}` : 'Yayın yok'}
          onChange={(id) => onAssign(screen.id, id)}
          onCreateNew={onOpenPlaylistModal}
        />
        <span className="block text-xs text-slate-500 mt-1">{sourceLabel}</span>
      </div>

      <button
        type="button"
        onClick={() => onOpenDetail(screen)}
        className="btn-ghost justify-self-end hidden md:inline-flex"
        aria-label={`${screen.name} detayları`}
        title="Önizleme ve ayarlar"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </li>
  );
};

// ==========================================
// Playlist dropdown with "create new" shortcut
// ==========================================
const PlaylistSelect: React.FC<{
  value: string;
  playlists: Playlist[];
  emptyLabel: string;
  onChange: (playlistId: string | null) => void;
  onCreateNew: () => void;
}> = ({ value, playlists, emptyLabel, onChange, onCreateNew }) => (
  <select
    value={value}
    onChange={(e) => {
      const val = e.target.value;
      if (val === NEW_PLAYLIST) onCreateNew();
      else onChange(val || null);
    }}
    className="w-full sm:w-auto sm:min-w-[200px] max-w-full bg-slate-950 border border-slate-700 hover:border-sky-500 rounded-lg px-2.5 py-1.5 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500 transition cursor-pointer"
  >
    <option value="">{emptyLabel}</option>
    {playlists.map((pl) => (
      <option key={pl.id} value={pl.id}>
        {pl.name}
      </option>
    ))}
    <option value={NEW_PLAYLIST}>+ Yeni playlist oluştur…</option>
  </select>
);

// ==========================================
// Inline "add floor" form
// ==========================================
const AddGroupForm: React.FC<{ onSave: (name: string) => Promise<void>; onCancel: () => void }> = ({ onSave, onCancel }) => {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Kat adı boş olamaz.');
      return;
    }
    try {
      setSaving(true);
      setError(null);
      await onSave(name.trim());
    } catch (err: any) {
      setError(err.message || 'Kat oluşturulamadı.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-900 border border-sky-600/40 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-start gap-3">
      <div className="flex-1">
        <input
          autoFocus
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={(e) => e.key === 'Escape' && onCancel()}
          placeholder="Yeni kat adı, ör: 2. Kat – Yemekhane"
          aria-label="Yeni kat adı"
          className="input-standard"
        />
        {error && <p className="text-xs text-rose-400 mt-1.5">{error}</p>}
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Vazgeç
        </button>
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Kaydediliyor...' : 'Katı ekle'}
        </button>
      </div>
    </form>
  );
};
