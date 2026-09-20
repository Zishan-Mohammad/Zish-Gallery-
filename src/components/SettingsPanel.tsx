import React, { useState } from 'react';
import {
  X,
  Moon,
  Sun,
  Grid3X3,
  ArrowUpDown,
  Lock,
  Check,
  AlertCircle,
  ShieldCheck,
  Trash2,
  Clock,
  LayoutGrid,
} from 'lucide-react';
import { GallerySettings, GridDensity, SortOption, ThemeMode } from '../types';
import { updatePassword, resetPasswordToDefault, DEFAULT_PASSWORD } from '../utils/password';
import { clearFavorites } from '../utils/favorites';
import { clearStoredDirectoryHandle } from '../utils/fileSystem';
import { clearEntireVault } from '../utils/vaultStorage';
import { PWAInstallButton } from './PWAInstallButton';

interface SettingsPanelProps {
  settings: GallerySettings;
  onUpdateSettings: (newSettings: Partial<GallerySettings>) => void;
  onClose: () => void;
  onRefreshGallery: () => void;
  onClearCache: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  onUpdateSettings,
  onClose,
  onRefreshGallery,
  onClearCache,
}) => {
  // Password change state
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdMessage, setPwdMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [isChangingPwd, setIsChangingPwd] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPwd || !newPwd) {
      setPwdMessage({ text: 'Please fill in all password fields.', isError: true });
      return;
    }
    if (newPwd !== confirmPwd) {
      setPwdMessage({ text: 'New passwords do not match.', isError: true });
      return;
    }
    if (newPwd.length < 4) {
      setPwdMessage({ text: 'Password must be at least 4 characters long.', isError: true });
      return;
    }

    setIsChangingPwd(true);
    setPwdMessage(null);

    const res = await updatePassword(currentPwd, newPwd);
    if (res.success) {
      setPwdMessage({ text: 'Master password updated successfully!', isError: false });
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
    } else {
      setPwdMessage({ text: res.error || 'Failed to update password', isError: true });
    }
    setIsChangingPwd(false);
  };

  const handleResetPassword = async () => {
    if (window.confirm(`Reset password to default (${DEFAULT_PASSWORD})?`)) {
      await resetPasswordToDefault();
      setPwdMessage({ text: `Password has been reset to default (${DEFAULT_PASSWORD}).`, isError: false });
    }
  };

  const handleClearAllStorage = async () => {
    if (window.confirm('Clear stored favorites and vault photos? Photos in src/photos/ will NOT be touched.')) {
      clearFavorites();
      await clearStoredDirectoryHandle();
      await clearEntireVault();
      onClearCache();
      onRefreshGallery();
      alert('Local vault photos, preferences and favorites cleared.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-xl rounded-3xl bg-neutral-900 border border-neutral-800 shadow-2xl text-neutral-100 max-h-[90dvh] flex flex-col overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-amber-400" />
            <h2 className="text-base sm:text-lg font-bold">Gallery Settings</h2>
          </div>
          <button
            id="btn-close-settings"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 sm:space-y-6 text-sm">
          {/* Theme & Display Mode */}
          <div>
            <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-2.5">
              Appearance & Theme
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                id="btn-theme-dark"
                onClick={() => onUpdateSettings({ theme: 'dark' })}
                className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl border font-medium transition-all ${
                  settings.theme === 'dark'
                    ? 'bg-neutral-800 border-amber-500 text-amber-300 shadow-sm'
                    : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Moon className="w-4 h-4" />
                <span>Dark Mode</span>
              </button>

              <button
                type="button"
                id="btn-theme-light"
                onClick={() => onUpdateSettings({ theme: 'light' })}
                className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl border font-medium transition-all ${
                  settings.theme === 'light'
                    ? 'bg-neutral-800 border-amber-500 text-amber-300 shadow-sm'
                    : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Sun className="w-4 h-4" />
                <span>Light Mode</span>
              </button>
            </div>
          </div>

          {/* Grid Density */}
          <div>
            <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-2.5">
              Grid Density
            </label>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {(['compact', 'comfortable', 'large'] as GridDensity[]).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => onUpdateSettings({ density: d })}
                  className={`py-2.5 px-3 rounded-xl border text-xs capitalize font-medium transition-all flex flex-col items-center gap-1 ${
                    settings.density === d
                      ? 'bg-amber-500/10 border-amber-500 text-amber-300'
                      : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                  <span>{d}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Media & Sorting Options */}
          <div className="space-y-3 pt-4 border-t border-neutral-800">
            <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">
              Vault & Sorting
            </label>

            {/* Default Sort Option */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-950/70 border border-neutral-800">
              <div className="flex items-center gap-3">
                <ArrowUpDown className="w-4 h-4 text-amber-400" />
                <div>
                  <p className="font-medium text-white text-xs sm:text-sm">Default Sorting</p>
                  <p className="text-[11px] text-neutral-400">Initial photo ordering</p>
                </div>
              </div>
              <select
                value={settings.defaultSort}
                onChange={(e) => onUpdateSettings({ defaultSort: e.target.value as SortOption })}
                className="rounded-lg bg-neutral-900 border border-neutral-700 px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="name-asc">Filename A → Z</option>
                <option value="name-desc">Filename Z → A</option>
                <option value="date-newest">Newest First</option>
                <option value="date-oldest">Oldest First</option>
                <option value="size-desc">Largest Size</option>
              </select>
            </div>

            {/* Inactivity Timeout */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-950/70 border border-neutral-800">
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-amber-400" />
                <div>
                  <p className="font-medium text-white text-xs sm:text-sm">Inactivity Auto-Lock</p>
                  <p className="text-[11px] text-neutral-400">Lock vault after period of inactivity</p>
                </div>
              </div>
              <select
                value={settings.inactivityTimeoutMinutes}
                onChange={(e) => onUpdateSettings({ inactivityTimeoutMinutes: Number(e.target.value) })}
                className="rounded-lg bg-neutral-900 border border-neutral-700 px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value={0}>Disabled</option>
                <option value={5}>5 Minutes</option>
                <option value={10}>10 Minutes</option>
                <option value={15}>15 Minutes</option>
                <option value={30}>30 Minutes</option>
              </select>
            </div>
          </div>

          {/* Change Master Password Form */}
          <div className="space-y-3 pt-4 border-t border-neutral-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">
                Vault Password
              </label>
              <button
                type="button"
                onClick={handleResetPassword}
                className="text-[11px] text-neutral-400 hover:text-amber-400 transition"
              >
                Reset to Default
              </button>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-2.5 p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800">
              <input
                type="password"
                value={currentPwd}
                onChange={(e) => setCurrentPwd(e.target.value)}
                placeholder="Current Password"
                className="w-full rounded-xl bg-neutral-900 border border-neutral-700/80 px-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="password"
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  placeholder="New Password"
                  className="w-full rounded-xl bg-neutral-900 border border-neutral-700/80 px-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
                />
                <input
                  type="password"
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                  placeholder="Confirm New Password"
                  className="w-full rounded-xl bg-neutral-900 border border-neutral-700/80 px-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
                />
              </div>

              {pwdMessage && (
                <p className={`text-xs flex items-center gap-1.5 ${pwdMessage.isError ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {pwdMessage.isError ? <AlertCircle className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                  <span>{pwdMessage.text}</span>
                </p>
              )}

              <button
                type="submit"
                disabled={isChangingPwd}
                className="w-full mt-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 transition cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{isChangingPwd ? 'Updating...' : 'Update Password Hash'}</span>
              </button>
            </form>
          </div>

          {/* Progressive Web App Section */}
          <div className="pt-4 border-t border-neutral-800 space-y-2">
            <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">
              Install App (PWA)
            </label>
            <PWAInstallButton />
          </div>

          {/* Clear Cache / Data */}
          <div className="pt-4 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
            <span>Reset Local Preferences & Favorites</span>
            <button
              type="button"
              onClick={handleClearAllStorage}
              className="flex items-center gap-1.5 text-rose-400 hover:text-rose-300 py-1.5 px-3 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Data</span>
            </button>
          </div>

          {/* Client-Side Security Notice */}
          <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-xs text-neutral-400 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <span className="font-semibold text-amber-200">Client-Side Architecture:</span> This app uses the Web Crypto API to hash passwords and reads directly from your device via the File System Access API. No images or passwords are ever sent to any remote server.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
