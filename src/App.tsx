import { useState, useEffect, useCallback } from 'react';
import { GallerySettings, PhotoItem } from './types';
import { LoginScreen } from './components/LoginScreen';
import { Gallery } from './components/Gallery';
import { revokeAllObjectUrls } from './utils/imageUtils';
import {
  loadAllPermanentPhotos,
  addPhotosToSecureVault,
  removePhoto,
} from './utils/folderLoader';

const DEFAULT_SETTINGS: GallerySettings = {
  theme: 'dark',
  density: 'comfortable',
  includeSubfolders: true,
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

  // Photos state from permanent folder & secure vault
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState<boolean>(false);

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

  // Fetch photos from the permanent folder and permanent vault
  const refreshPhotos = useCallback(async () => {
    setIsLoadingPhotos(true);
    try {
      const loaded = await loadAllPermanentPhotos();
      setPhotos(loaded);
    } catch (err) {
      console.warn('Error loading permanent photos:', err);
    } finally {
      setIsLoadingPhotos(false);
    }
  }, []);

  // Load photos immediately upon unlocking
  useEffect(() => {
    if (isAuthenticated) {
      refreshPhotos();
    }
  }, [isAuthenticated, refreshPhotos]);

  // Sync settings changes to localStorage
  const handleUpdateSettings = (newSettings: Partial<GallerySettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  // Add photos permanently to vault
  const handleAddPhotos = async (files: File[]) => {
    const newItems = await addPhotosToSecureVault(files);
    setPhotos((prev) => [...prev, ...newItems]);
  };

  // Remove photo from vault
  const handleDeletePhoto = async (photoId: string) => {
    await removePhoto(photoId);
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
  };

  // Clean up object URLs when logging out or locking
  const handleLogout = () => {
    revokeAllObjectUrls();
    sessionStorage.removeItem('zish_gallery_authenticated');
    sessionStorage.removeItem('zish_gallery_auth_time');
    setIsAuthenticated(false);
  };

  // 1. Master Password Lock Screen
  if (!isAuthenticated) {
    return <LoginScreen onUnlock={() => setIsAuthenticated(true)} />;
  }

  // 2. Permanent Private Photo Gallery (No folder selection barrier)
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
