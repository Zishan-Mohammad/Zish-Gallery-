import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  RefreshCw,
  Settings,
  Lock,
  Image as ImageIcon,
  Plus,
  UploadCloud,
  CheckCircle2,
  HardDrive,
} from 'lucide-react';
import { PhotoItem, GallerySettings, FilterExtension, SortOption } from '../types';
import { comparePhotos } from '../utils/imageUtils';
import { getFavoriteIds, toggleFavoriteId } from '../utils/favorites';
import { SearchBar } from './SearchBar';
import { PhotoGrid } from './PhotoGrid';
import { PhotoViewer } from './PhotoViewer';
import { SettingsPanel } from './SettingsPanel';
import { PWAInstallButton } from './PWAInstallButton';

interface GalleryProps {
  photos: PhotoItem[];
  folderName: string;
  onUpdatePhotos: (photos: PhotoItem[]) => void;
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
  const [selectedFolderFilter, setSelectedFolderFilter] = useState<string | null>(null);
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

  // Collect unique subfolders
  const availableFolders = useMemo(() => {
    const set = new Set<string>();
    photos.forEach((p) => {
      if (p.folder && p.folder !== 'Root' && p.folder !== 'General') {
        set.add(p.folder);
      }
    });
    return Array.from(set);
  }, [photos]);

  // Filter and sort photos
  const filteredPhotos = useMemo(() => {
    return photos
      .filter((photo) => {
        // Search query: filename and relative path
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesName = photo.name.toLowerCase().includes(q);
          const matchesPath = photo.relativePath.toLowerCase().includes(q);
          if (!matchesName && !matchesPath) return false;
        }

        // Extension filter
        if (activeFilter !== 'ALL') {
          const ext = photo.extension.toUpperCase();
          if (activeFilter === 'JPG') {
            if (ext !== 'JPG' && ext !== 'JPEG') return false;
          } else if (ext !== activeFilter) {
            return false;
          }
        }

        // Favorites filter
        if (showFavoritesOnly && !favoritesSet.has(photo.id)) {
          return false;
        }

        // Subfolder filter
        if (selectedFolderFilter && photo.folder !== selectedFolderFilter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => comparePhotos(a, b, currentSort));
  }, [photos, searchQuery, activeFilter, showFavoritesOnly, selectedFolderFilter, currentSort, favoritesSet]);

  // Rescan / Refresh photos
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setStatusNotification(null);
    try {
      await onRefresh();
      setStatusNotification('Photos refreshed from permanent folder & vault.');
      setTimeout(() => setStatusNotification(null), 3000);
    } catch {
      setStatusNotification('Refresh failed.');
      setTimeout(() => setStatusNotification(null), 3000);
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh]);

  // Handle adding photos via file input or drag-and-drop
  const handleFilesSelected = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const validFiles: File[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (file.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|avif|svg)$/i.test(file.name)) {
        validFiles.push(file);
      }
    }

    if (validFiles.length === 0) {
      alert('Please select valid image files (.jpg, .png, .webp, .gif, .avif, .svg).');
      return;
    }

    try {
      await onAddPhotos(validFiles);
      setStatusNotification(`Added ${validFiles.length} photo${validFiles.length === 1 ? '' : 's'} permanently to your vault!`);
      setTimeout(() => setStatusNotification(null), 3500);
    } catch (err) {
      console.warn('Failed to save photos to vault:', err);
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
      {/* Hidden File Input for Add Photos */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          handleFilesSelected(e.target.files);
          e.target.value = '';
        }}
        multiple
        accept="image/*,.jpg,.jpeg,.png,.webp,.gif,.avif,.svg"
        className="hidden"
      />

      {/* Drag & Drop Visual Overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md border-4 border-dashed border-amber-500 pointer-events-none">
          <div className="text-center p-8 rounded-3xl bg-neutral-900/90 border border-neutral-800 shadow-2xl">
            <UploadCloud className="w-16 h-16 text-amber-400 mx-auto animate-bounce mb-4" />
            <h2 className="text-xl font-bold text-white">Drop images to add to your Private Vault</h2>
            <p className="mt-1 text-sm text-neutral-400">
              Photos are permanently and securely stored on your local device.
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-4">
          {/* Brand & Photo Counter */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 text-neutral-950 shadow-md">
              <ImageIcon className="h-5 w-5" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-500">
                  Private Vault
                </span>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                    settings.theme === 'light'
                      ? 'bg-neutral-200 text-neutral-700'
                      : 'bg-neutral-800 text-neutral-300'
                  }`}
                >
                  {photos.length} {photos.length === 1 ? 'Photo' : 'Photos'}
                </span>
              </div>
              <p
                className="text-xs text-neutral-400 truncate max-w-[160px] sm:max-w-xs flex items-center gap-1"
                title={`Permanent Folder: ${folderName}`}
              >
                <HardDrive className="w-3 h-3 text-amber-500 shrink-0" />
                <span>{folderName}</span>
              </p>
            </div>
          </div>

          {/* Action Buttons: Add Photos, Refresh, Settings, Lock */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* PWA Compact install */}
            <PWAInstallButton compact />

            {/* Add Photos Button */}
            <button
              id="btn-add-photos"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-md transition-all cursor-pointer active:scale-95"
              title="Add photos permanently to your secure vault"
            >
              <Plus className="w-4 h-4" />
              <span>Add Photos</span>
            </button>

            {/* Refresh Button */}
            <button
              id="btn-refresh-photos"
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                settings.theme === 'light'
                  ? 'bg-neutral-50 hover:bg-neutral-100 border-neutral-300 text-neutral-700'
                  : 'bg-neutral-900 hover:bg-neutral-800 border-neutral-800 text-neutral-200'
              } active:scale-95 disabled:opacity-50`}
              title="Rescan permanent folder and vault"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
              <span className="hidden md:inline">Refresh</span>
            </button>

            {/* Settings Button */}
            <button
              id="btn-open-settings"
              type="button"
              onClick={() => setShowSettings(true)}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                settings.theme === 'light'
                  ? 'bg-neutral-50 hover:bg-neutral-100 border-neutral-300 text-neutral-700'
                  : 'bg-neutral-900 hover:bg-neutral-800 border-neutral-800 text-neutral-200'
              }`}
              title="Gallery Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Lock / Logout Button */}
            <button
              id="btn-gallery-logout"
              type="button"
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/25 transition-all cursor-pointer active:scale-95"
              title="Lock Gallery"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lock</span>
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
          availableFolders={availableFolders}
          selectedFolderFilter={selectedFolderFilter}
          onFolderFilterChange={setSelectedFolderFilter}
          totalFilteredCount={filteredPhotos.length}
          totalOriginalCount={photos.length}
        />

        {/* Empty state: If folder has zero photos */}
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
              Drag and drop your photos anywhere, or click to add images directly into your permanent secure vault.
            </p>
            <button
              type="button"
              className="mt-6 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-neutral-950 font-bold text-xs hover:bg-amber-400 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Photos to Vault</span>
            </button>
          </div>
        )}

        {/* Empty state: If filters yield zero photos */}
        {photos.length > 0 && filteredPhotos.length === 0 && (
          <div className="py-16 flex flex-col items-center justify-center text-center">
            <h3 className="text-base font-semibold text-white">No matching photos</h3>
            <p className="mt-1 text-xs text-neutral-400">
              Try adjusting your search keywords, format filters, or favorites toggle.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveFilter('ALL');
                setShowFavoritesOnly(false);
                setSelectedFolderFilter(null);
              }}
              className="mt-4 text-xs font-semibold text-amber-400 hover:underline cursor-pointer"
            >
              Clear all filters
            </button>
          </div>
        )}

        {/* The Photo Grid */}
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

      {/* Fullscreen Lightbox Viewer */}
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
