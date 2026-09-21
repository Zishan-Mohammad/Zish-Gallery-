import { useState, useEffect, useCallback } from 'react';
import { GallerySettings, MediaItem } from './types';
import { LoginScreen } from './components/LoginScreen';
import { Gallery } from './components/Gallery';
import {
  loadAllPermanentMedia,
  addMediaToSecureVault,
  removeMedia,
} from './utils/folderLoader';

const DEFAULT_SETTINGS: GallerySettings = {
  theme: 'dark',
  density: 'comfortable',
  defaultSort: 'name-asc',
  inactivityTimeoutMinutes: 15,
  showMetadataOverlay: false,
};

const SETTINGS_STORAGE_KEY = 'zish_gallery_settings';

export default function App() {
  // Authentication state (stored in sessionStorage so it clears on browser close)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('zish_gallery_authenticated') === 'true';
  });

  // Media state from permanent folder & secure vault
  const [photos, setPhotos] = useState<MediaItem[]>([]);
  const [, setIsLoadingPhotos] = useState<boolean>(false);

  // Settings state
  const [settings, setSettings] = useState<GallerySettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch {
      // fallback
    }
    return DEFAULT_SETTINGS;
  });

  // Register PWA service worker
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('Service worker registration failed:', err);
      });
    }
  }, []);

  // Fetch media from the permanent folder and permanent vault with memoized diff
  const refreshPhotos = useCallback(async () => {
    setIsLoadingPhotos(true);
    try {
      const loaded = await loadAllPermanentMedia();
      setPhotos((prev) => {
        if (
          prev.length === loaded.length &&
          prev.every((item, idx) => item.id === loaded[idx]?.id && item.url === loaded[idx]?.url)
        ) {
          return prev;
        }
        return loaded;
      });
    } catch (err) {
      console.warn('Error loading permanent media:', err);
    } finally {
      setIsLoadingPhotos(false);
    }
  }, []);

  // Pre-load photos immediately on mount so unlocking is instantaneous
  useEffect(() => {
    refreshPhotos();
  }, [refreshPhotos]);

  // Sync settings changes to localStorage
  const handleUpdateSettings = (newSettings: Partial<GallerySettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  // Add media (images & videos) permanently to vault
  const handleAddPhotos = async (files: File[]) => {
    const newItems = await addMediaToSecureVault(files);
    setPhotos((prev) => [...prev, ...newItems]);
  };

  // Remove media from vault permanently
  const handleDeletePhoto = async (photoId: string) => {
    await removeMedia(photoId);
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
  };

  // Lock vault session
  const handleLogout = () => {
    sessionStorage.removeItem('zish_gallery_authenticated');
    sessionStorage.removeItem('zish_gallery_auth_time');
    setIsAuthenticated(false);
  };

  // 1. Master Password Lock Screen
  if (!isAuthenticated) {
    return <LoginScreen onUnlock={() => setIsAuthenticated(true)} />;
  }

  // 2. Permanent Private Media Vault (No compartments, videos + photos supported)
  return (
    <Gallery
      photos={photos}
      folderName="photos/"
      onUpdatePhotos={setPhotos}
      onAddPhotos={handleAddPhotos}
      onDeletePhoto={handleDeletePhoto}
      onRefresh={refreshPhotos}
      onLogout={handleLogout}
      settings={settings}
      onUpdateSettings={handleUpdateSettings}
    />
  );
}
