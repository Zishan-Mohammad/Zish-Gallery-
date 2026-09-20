import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  RefreshCw,
  Settings,
  Lock,
  Plus,
  UploadCloud,
  CheckCircle2,
  HardDrive,
  Film,
  Image as ImageIcon,
  Heart,
} from 'lucide-react';
import { MediaItem, GallerySettings, FilterExtension, SortOption } from '../types';
import { comparePhotos } from '../utils/imageUtils';
import { getFavoriteIds, toggleFavoriteId } from '../utils/favorites';
import { SearchBar } from './SearchBar';
import { PhotoGrid } from './PhotoGrid';
import { PhotoViewer } from './PhotoViewer';
import { SettingsPanel } from './SettingsPanel';
import { PWAInstallButton } from './PWAInstallButton';

interface GalleryProps {
  photos: MediaItem[];
  folderName: string;
  onUpdatePhotos: (photos: MediaItem[]) => void;
  onAddPhotos: (files: File[]) => Promise<void>;
  onDeletePhoto: (photoId: string) => Promise<void>;
  onRefresh: () => Promise<void>;
  onLogout: () => void;
  settings: GallerySettings;
  onUpdateSettings: (newSettings: Partial<GallerySettings>) => void;
}

export const Gallery: React.FC<GalleryProps> = ({
  photos,
  folderName,
  onAddPhotos,
  onDeletePhoto,
  onRefresh,
  onLogout,
  settings,
  onUpdateSettings,
}) => {
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterExtension>('ALL');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [currentSort, setCurrentSort] = useState<SortOption>(settings.defaultSort);

  // Favorites state
  const [favoritesSet, setFavoritesSet] = useState<Set<string>>(getFavoriteIds());

  // Lightbox viewer state
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  // Settings modal
  const [showSettings, setShowSettings] = useState(false);

  // Rescan loading state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  // Drag & drop state
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update favorites set
  const handleToggleFavorite = (photoId: string) => {
    toggleFavoriteId(photoId);
    setFavoritesSet(getFavoriteIds());
  };

  // Filter and sort media
  const filteredPhotos = useMemo(() => {
    return photos
      .filter((item) => {
        // Search query: filename
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          if (!item.name.toLowerCase().includes(q)) return false;
        }

        // Media Type or Format Filter
        if (activeFilter === 'PHOTOS') {
          if (item.mediaType !== 'image') return false;
        } else if (activeFilter === 'VIDEOS') {
          if (item.mediaType !== 'video') return false;
        } else if (activeFilter !== 'ALL') {
          const ext = item.extension.toUpperCase();
          if (activeFilter === 'JPG') {
            if (ext !== 'JPG' && ext !== 'JPEG') return false;
          } else if (ext !== activeFilter) {
            return false;
          }
        }

        // Favorites filter
        if (showFavoritesOnly && !favoritesSet.has(item.id)) {
          return false;
        }

        return true;
      })
      .sort((a, b) => comparePhotos(a, b, currentSort));
  }, [photos, searchQuery, activeFilter, showFavoritesOnly, currentSort, favoritesSet]);

  // Counts
  const videoCount = useMemo(() => photos.filter((p) => p.mediaType === 'video').length, [photos]);
  const photoCount = useMemo(() => photos.filter((p) => p.mediaType === 'image').length, [photos]);

  // Rescan / Refresh photos and videos
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setStatusNotification(null);
    try {
      await onRefresh();
      setStatusNotification('Refreshed media from permanent folder & vault.');
      setTimeout(() => setStatusNotification(null), 3000);
    } catch {
      setStatusNotification('Refresh failed.');
      setTimeout(() => setStatusNotification(null), 3000);
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh]);

  // Handle adding photos and videos
  const handleFilesSelected = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const validFiles: File[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (
        file.type.startsWith('image/') ||
        file.type.startsWith('video/') ||
        /\.(jpe?g|png|webp|gif|avif|svg|mp4|webm|mov|ogg|mkv|m4v)$/i.test(file.name)
      ) {
        validFiles.push(file);
      }
    }

    if (validFiles.length === 0) {
      alert('Please select supported image or video files (.mp4, .webm, .mov, .jpg, .png, .webp, .gif, .avif).');
      return;
    }

    try {
      await onAddPhotos(validFiles);
      setStatusNotification(`Added ${validFiles.length} media item${validFiles.length === 1 ? '' : 's'} permanently to your vault!`);
      setTimeout(() => setStatusNotification(null), 3500);
    } catch (err) {
      console.warn('Failed to save media to vault:', err);
    }
  };

  // Drag and Drop listeners
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      await handleFilesSelected(e.dataTransfer.files);
    }
  };

  // Inactivity timeout handler
  useEffect(() => {
    if (!settings.inactivityTimeoutMinutes || settings.inactivityTimeoutMinutes <= 0) return;

    const timeoutMs = settings.inactivityTimeoutMinutes * 60 * 1000;
    let timer: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        alert('Vault automatically locked due to inactivity.');
        onLogout();
      }, timeoutMs);
    };

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    events.forEach((evt) => window.addEventListener(evt, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      clearTimeout(timer);
      events.forEach((evt) => window.removeEventListener(evt, resetTimer));
    };
  }, [settings.inactivityTimeoutMinutes, onLogout]);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative min-h-screen w-full transition-colors ${
        settings.theme === 'light'
          ? 'bg-neutral-100 text-neutral-900'
          : 'bg-neutral-950 text-neutral-100'
      }`}
    >
      {/* Hidden File Input for Add Media (Images + Videos) */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          handleFilesSelected(e.target.files);
          e.target.value = '';
        }}
        multiple
        accept="image/*,video/*,.mp4,.webm,.mov,.ogg,.mkv,.jpg,.jpeg,.png,.webp,.gif,.avif,.svg"
        className="hidden"
      />

      {/* Drag & Drop Visual Overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md border-4 border-dashed border-amber-500 pointer-events-none">
          <div className="text-center p-8 rounded-3xl bg-neutral-900/90 border border-neutral-800 shadow-2xl">
            <UploadCloud className="w-16 h-16 text-amber-400 mx-auto animate-bounce mb-4" />
            <h2 className="text-xl font-bold text-white">Drop photos & videos into your Private Vault</h2>
            <p className="mt-1 text-sm text-neutral-400">
              Media is permanently and securely stored on your local device.
            </p>
          </div>
        </div>
      )}

      {/* Top Header Bar */}
      <header
        className={`sticky top-0 z-40 w-full border-b backdrop-blur-xl transition-colors ${
          settings.theme === 'light'
            ? 'bg-white/85 border-neutral-200 shadow-sm'
            : 'bg-neutral-950/85 border-neutral-800/80 shadow-lg'
        }`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-15 sm:h-18 flex items-center justify-between gap-2 sm:gap-4">
          {/* Brand & Media Counter */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 text-neutral-950 shadow-md shrink-0">
              <Film className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-500 truncate">
                  Zish-Gallery
                </span>
                <span
                  className={`text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 rounded-full font-semibold shrink-0 ${
                    settings.theme === 'light'
                      ? 'bg-neutral-200 text-neutral-700'
                      : 'bg-neutral-800 text-neutral-300'
                  }`}
                >
                  {photos.length}
                </span>
              </div>
              <p
                className="text-[11px] text-neutral-400 truncate max-w-[130px] sm:max-w-xs flex items-center gap-1 sm:gap-1.5"
                title={`Permanent Folder: ${folderName}`}
              >
                <span>{photoCount}p</span>
                <span>•</span>
                <span>{videoCount}v</span>
              </p>
            </div>
          </div>

          {/* Action Buttons: Add Media, Refresh, Settings, Lock */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* PWA Compact install */}
            <PWAInstallButton compact />

            {/* Add Media Button */}
            <button
              id="btn-add-media"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-md transition-all cursor-pointer active:scale-95 min-h-[38px]"
              title="Add photos & videos permanently to your vault"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Media</span>
              <span className="sm:hidden text-[11px] font-bold">Add</span>
            </button>

            {/* Refresh Button */}
            <button
              id="btn-refresh-photos"
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`flex items-center justify-center p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer min-h-[38px] min-w-[38px] ${
                settings.theme === 'light'
                  ? 'bg-neutral-50 hover:bg-neutral-100 border-neutral-300 text-neutral-700'
                  : 'bg-neutral-900 hover:bg-neutral-800 border-neutral-800 text-neutral-200'
              } active:scale-95 disabled:opacity-50`}
              title="Rescan permanent folder and vault"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
              <span className="hidden md:inline ml-1.5">Refresh</span>
            </button>

            {/* Settings Button */}
            <button
              id="btn-open-settings"
              type="button"
              onClick={() => setShowSettings(true)}
              className={`p-2 rounded-xl border transition-all cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center ${
                settings.theme === 'light'
                  ? 'bg-neutral-50 hover:bg-neutral-100 border-neutral-300 text-neutral-700'
                  : 'bg-neutral-900 hover:bg-neutral-800 border-neutral-800 text-neutral-200'
              }`}
              title="Vault Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Lock / Logout Button */}
            <button
              id="btn-gallery-logout"
              type="button"
              onClick={onLogout}
              className="flex items-center justify-center p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/25 transition-all cursor-pointer active:scale-95 min-h-[38px] min-w-[38px]"
              title="Lock Vault"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline ml-1.5">Lock</span>
            </button>
          </div>
        </div>
      </header>

      {/* Notification Toast for feedback */}
      {statusNotification && (
        <div className="max-w-md mx-auto my-3 px-4">
          <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs text-center font-medium shadow-lg flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{statusNotification}</span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24 sm:pb-8">
        {/* Search & Filter Toolbar */}
        <SearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          showFavoritesOnly={showFavoritesOnly}
          onToggleFavoritesOnly={() => setShowFavoritesOnly(!showFavoritesOnly)}
          favoriteCount={favoritesSet.size}
          sortOption={currentSort}
          onSortChange={setCurrentSort}
          totalFilteredCount={filteredPhotos.length}
          totalOriginalCount={photos.length}
          density={settings.density}
          onDensityChange={(density) => onUpdateSettings({ density })}
        />

        {/* Empty state: If folder has zero media */}
        {photos.length === 0 && (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="my-12 p-12 rounded-3xl border-2 border-dashed border-neutral-800 hover:border-amber-500/60 bg-neutral-900/40 hover:bg-neutral-900/70 transition-all flex flex-col items-center justify-center text-center cursor-pointer group"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-neutral-900 border border-neutral-800 text-neutral-400 group-hover:text-amber-400 group-hover:scale-105 transition-all mb-4">
              <UploadCloud className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-bold text-white">Your Private Vault is Ready</h3>
            <p className="mt-1 text-sm text-neutral-400 max-w-md">
              Drag and drop photos or videos anywhere, or click to add files directly into your permanent secure vault.
            </p>
            <button
              type="button"
              className="mt-6 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-neutral-950 font-bold text-xs hover:bg-amber-400 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Media to Vault</span>
            </button>
          </div>
        )}

        {/* Empty state: If filters yield zero media */}
        {photos.length > 0 && filteredPhotos.length === 0 && (
          <div className="py-16 flex flex-col items-center justify-center text-center">
            <h3 className="text-base font-semibold text-white">No matching media</h3>
            <p className="mt-1 text-xs text-neutral-400">
              Try adjusting your search keywords, format filters, or favorites toggle.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveFilter('ALL');
                setShowFavoritesOnly(false);
              }}
              className="mt-4 text-xs font-semibold text-amber-400 hover:underline cursor-pointer"
            >
              Clear all filters
            </button>
          </div>
        )}

        {/* The Media Grid */}
        {filteredPhotos.length > 0 && (
          <PhotoGrid
            photos={filteredPhotos}
            density={settings.density}
            showMetadataOverlay={settings.showMetadataOverlay}
            onPhotoClick={(_, index) => setViewerIndex(index)}
            onToggleFavorite={handleToggleFavorite}
            favoritesSet={favoritesSet}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar (Phone-First UX) */}
      <nav
        aria-label="Mobile Navigation"
        className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-neutral-950/95 backdrop-blur-xl border-t border-neutral-800/80 px-3 py-1.5 pb-[max(0.6rem,env(safe-area-inset-bottom))] shadow-2xl transition-colors"
      >
        <div className="flex items-center justify-between max-w-md mx-auto">
          {/* All Media */}
          <button
            type="button"
            onClick={() => {
              setActiveFilter('ALL');
              setShowFavoritesOnly(false);
            }}
            className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all min-w-[52px] ${
              activeFilter === 'ALL' && !showFavoritesOnly
                ? 'text-amber-400 font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span className="text-[10px] mt-0.5">All</span>
          </button>

          {/* Photos Filter */}
          <button
            type="button"
            onClick={() => {
              setActiveFilter('PHOTOS');
              setShowFavoritesOnly(false);
            }}
            className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all min-w-[52px] ${
              activeFilter === 'PHOTOS' && !showFavoritesOnly
                ? 'text-amber-400 font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span className="text-[10px] mt-0.5">Photos</span>
          </button>

          {/* Center Add Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center -mt-5 h-12 w-12 rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 text-neutral-950 shadow-lg shadow-amber-500/30 active:scale-90 border-2 border-neutral-950 cursor-pointer"
            title="Add Media to Vault"
            aria-label="Add photos or videos"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>

          {/* Videos Filter */}
          <button
            type="button"
            onClick={() => {
              setActiveFilter('VIDEOS');
              setShowFavoritesOnly(false);
            }}
            className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all min-w-[52px] ${
              activeFilter === 'VIDEOS' && !showFavoritesOnly
                ? 'text-amber-400 font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Film className="w-4 h-4" />
            <span className="text-[10px] mt-0.5">Videos</span>
          </button>

          {/* Favorites Filter */}
          <button
            type="button"
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all min-w-[52px] ${
              showFavoritesOnly
                ? 'text-rose-400 font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Heart className={`w-4 h-4 ${showFavoritesOnly ? 'fill-rose-400' : ''}`} />
            <span className="text-[10px] mt-0.5">Favorites</span>
          </button>
        </div>
      </nav>

      {/* Fullscreen Lightbox Viewer (Images & Videos) */}
      {viewerIndex !== null && (
        <PhotoViewer
          photos={filteredPhotos}
          currentIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
          onNavigate={(newIndex) => setViewerIndex(newIndex)}
          onToggleFavorite={handleToggleFavorite}
          onDeletePhoto={async (id) => {
            await onDeletePhoto(id);
            setViewerIndex(null);
          }}
          isFavorite={filteredPhotos[viewerIndex] ? favoritesSet.has(filteredPhotos[viewerIndex].id) : false}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsPanel
          settings={settings}
          onUpdateSettings={onUpdateSettings}
          onClose={() => setShowSettings(false)}
          onRefreshGallery={handleRefresh}
          onClearCache={() => {
            setFavoritesSet(new Set());
          }}
        />
      )}
    </div>
  );
};
