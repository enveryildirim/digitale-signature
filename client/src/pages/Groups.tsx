import React, { useState } from 'react';
import { FolderTree, Plus, Trash2, Edit2, X, Check, AlertCircle } from 'lucide-react';
import { ScreenGroup } from '../types';

interface GroupsProps {
  groups: ScreenGroup[];
  onCreateGroup: (data: { name: string; description?: string }) => Promise<void>;
  onUpdateGroup: (id: string, data: { name?: string; description?: string }) => Promise<void>;
  onDeleteGroup: (id: string) => Promise<void>;
}

export const Groups: React.FC<GroupsProps> = ({
  groups,
  onCreateGroup,
  onUpdateGroup,
  onDeleteGroup
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setCreateError('Lütfen kat veya grup için bir isim giriniz.');
      return;
    }
    try {
      setLoading(true);
      setCreateError(null);
      await onCreateGroup({ name: name.trim(), description: description.trim() || undefined });
      setName('');
      setDescription('');
      setIsCreating(false);
    } catch (err: any) {
      setCreateError(err.message || 'Grup oluşturulamadı.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async (id: string) => {
    if (!editName.trim()) return;
    try {
      await onUpdateGroup(id, { name: editName.trim(), description: editDesc.trim() || undefined });
      setEditingId(null);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">Katlar ve Ekran Grupları</h2>
          <p className="text-xs text-slate-400 mt-1">
            TV'leri kat veya bina bölümlerine göre gruplandırarak toplu yayın atayın
          </p>
        </div>
        <button
          onClick={() => {
            setIsCreating(true);
            setCreateError(null);
          }}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" />
          Yeni Kat / Grup Tanımla
        </button>
      </div>

      {/* Create New Group Card */}
      {isCreating && (
        <form
          onSubmit={handleCreate}
          className="bg-slate-900 border border-sky-500/40 rounded-2xl p-5 space-y-4 shadow-xl animate-in fade-in"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-white">Yeni Kat / Grup Tanımla</h4>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              aria-label="Kapat"
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {createError && (
            <div className="flex items-center gap-2 p-3 text-xs text-rose-400 bg-rose-950/50 border border-rose-800/60 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{createError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Kat / Grup Adı <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (createError) setCreateError(null);
                }}
                placeholder="Ör: 4. Kat - Ar-Ge Laboratuvarı"
                className="input-standard"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Açıklama (İsteğe bağlı)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ör: Ar-Ge katındaki ekranlar için yayın grubu"
                className="input-standard"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="btn-secondary"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Kaydediliyor...' : 'Kat Grubunu Kaydet'}
            </button>
          </div>
        </form>
      )}

      {/* Groups List */}
      {groups.length === 0 ? (
        <div className="border border-dashed border-slate-800 rounded-2xl p-12 text-center bg-slate-900/40">
          <FolderTree className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h4 className="text-sm font-semibold text-slate-200">Tanımlı Kat Grubu Bulunmuyor</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            TV'lerinizi katlara göre yönetebilmek için (Örn: Zemin Kat, Yemekhane, 1. Kat) grup oluşturun.
          </p>
          <button
            onClick={() => setIsCreating(true)}
            className="mt-5 btn-primary"
          >
            <Plus className="w-4 h-4" />
            İlk Kat Grubunu Oluştur
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => {
            const isEditing = editingId === group.id;

            return (
              <div
                key={group.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 transition shadow-lg space-y-4"
              >
                {isEditing ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">Grup Adı</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="input-standard text-xs py-2"
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">Açıklama</label>
                      <input
                        type="text"
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        placeholder="Açıklama"
                        className="input-standard text-xs py-2"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        onClick={() => setEditingId(null)}
                        className="btn-secondary text-xs px-3 py-1.5 min-h-[32px]"
                      >
                        İptal
                      </button>
                      <button
                        onClick={() => handleSaveEdit(group.id)}
                        className="btn-primary text-xs px-3 py-1.5 min-h-[32px]"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Kaydet
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20">
                          <FolderTree className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-white text-sm tracking-wide">{group.name}</h4>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {group.screens?.length || 0} TV Ekranı Bağlı
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingId(group.id);
                            setEditName(group.name);
                            setEditDesc(group.description || '');
                          }}
                          title="Kat Grubunu Düzenle"
                          aria-label={`${group.name} grubunu düzenle`}
                          className="btn-ghost"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteGroup(group.id)}
                          title="Kat Grubunu Sil"
                          aria-label={`${group.name} grubunu sil`}
                          className="btn-ghost text-slate-400 hover:text-rose-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 mt-3 line-clamp-2 leading-relaxed">
                      {group.description || 'Açıklama girilmedi.'}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
