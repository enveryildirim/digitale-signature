import React, { useState } from 'react';
import { Tv, Lock, User as UserIcon, AlertCircle, ArrowRight } from 'lucide-react';
import { api } from '../api';
import { User } from '../types';

interface LoginProps {
  onLoginSuccess: (user: User, token: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const data = await api.login({ username: username.trim(), password });
      localStorage.setItem('signage_auth_token', data.token);
      localStorage.setItem('signage_user', JSON.stringify(data.user));
      onLoginSuccess(data.user, data.token);
    } catch (err: any) {
      if (err.message && (err.message.includes('fetch') || err.message.includes('yapılandırma'))) {
        setError('Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edin.');
      } else {
        setError(err.message || 'E-posta veya parola hatalı.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-sky-600/10 text-sky-400 border border-sky-500/20 mb-3 shadow-lg shadow-sky-600/10">
            <Tv className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-wide">Dijital Bilgi Ekranı</h2>
          <p className="text-xs text-slate-400 mt-1">Merkezi Yönetici Paneli Oturumu</p>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2.5 p-3.5 text-xs text-rose-400 bg-rose-950/50 border border-rose-800/60 rounded-xl leading-relaxed">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              E-posta <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="input-standard pl-10"
                placeholder="yonetici@kurum.edu.tr"
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Parola <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input-standard pl-10 font-mono"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary min-h-[44px]"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Giriş Yapılıyor...
                </>
              ) : (
                <>
                  Yönetici Paneline Giriş Yap
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
