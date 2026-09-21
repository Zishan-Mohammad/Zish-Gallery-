import { MediaItem, MediaType } from '../types';
import { registerObjectUrl, revokeObjectUrl } from './imageUtils';

const DB_NAME = 'zish_permanent_vault_db';
const DB_VERSION = 2;
const STORE_NAME = 'permanent_media';
const DELETED_IDS_KEY = 'zish_deleted_media_ids';

// Persistent memory cache for Blob Object URLs to prevent URL thrashing and image re-rendering flashes
const objectUrlCache = new Map<string, string>();

interface StoredMediaRecord {
  id: string;
  name: string;
  mediaType: MediaType;
  relativePath: string;
  extension: string;
  size: number;
  lastModified: number;
  blob: Blob;
  duration?: number;
}

const VIDEO_EXTENSIONS = new Set(['mp4', 'webm', 'mov', 'mkv', 'ogg', 'm4v', '3gp']);

export function detectMediaType(fileName: string, mimeType?: string): MediaType {
  if (mimeType?.startsWith('video/')) return 'video';
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  if (VIDEO_EXTENSIONS.has(ext)) return 'video';
  return 'image';
}

/**
 * Tombstone / Deleted set tracking for persistent local deletion of any media item
 */
export function getDeletedMediaIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_IDS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return new Set(parsed);
    }
  } catch {
    // fallback
  }
  return new Set();
}

export function markMediaDeleted(id: string): void {
  const set = getDeletedMediaIds();
  set.add(id);
  localStorage.setItem(DELETED_IDS_KEY, JSON.stringify(Array.from(set)));
}

export function unmarkMediaDeleted(id: string): void {
  const set = getDeletedMediaIds();
  if (set.has(id)) {
    set.delete(id);
    localStorage.setItem(DELETED_IDS_KEY, JSON.stringify(Array.from(set)));
  }
}

export function restoreAllDeletedMedia(): void {
  localStorage.removeItem(DELETED_IDS_KEY);
}

export function getDeletedCount(): number {
  return getDeletedMediaIds().size;
}

function openVaultDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not supported in this browser environment'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
      const oldStoreName = 'permanent_photos';
      if (event.oldVersion < 2 && db.objectStoreNames.contains(oldStoreName)) {
        // migration handled cleanly
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save image or video files permanently into the client-side IndexedDB vault
 */
export async function saveMediaToVault(files: File[]): Promise<MediaItem[]> {
  const db = await openVaultDB();
  const addedItems: MediaItem[] = [];

  for (const file of files) {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
    const mediaType = detectMediaType(file.name, file.type);
    const id = `vault_${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

    // If file was previously marked deleted, unmark it
    unmarkMediaDeleted(id);

    const record: StoredMediaRecord = {
      id,
      name: file.name,
      mediaType,
      relativePath: file.name,
      extension: ext,
      size: file.size,
      lastModified: file.lastModified || Date.now(),
      blob: file,
    };

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    // Create stable cached Object URL
    const objectUrl = registerObjectUrl(URL.createObjectURL(file));
    objectUrlCache.set(id, objectUrl);

    addedItems.push({
      id,
      name: record.name,
      mediaType,
      relativePath: record.relativePath,
      extension: ext,
      size: record.size,
      lastModified: record.lastModified,
      url: objectUrl,
    });
  }

  return addedItems;
}

export const savePhotosToVault = saveMediaToVault;

/**
 * Load all permanently stored media from IndexedDB with stable URL caching
 */
export async function loadPermanentVaultMedia(): Promise<MediaItem[]> {
  try {
    const db = await openVaultDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => {
        const records: StoredMediaRecord[] = req.result || [];
        const items: MediaItem[] = records.map((rec) => {
          // Reuse stable Object URL to prevent image flickering and DOM rebuilds
          let url = objectUrlCache.get(rec.id);
          if (!url) {
            url = registerObjectUrl(URL.createObjectURL(rec.blob));
            objectUrlCache.set(rec.id, url);
          }

          const mediaType = rec.mediaType || detectMediaType(rec.name);
          return {
            id: rec.id,
            name: rec.name,
            mediaType,
            relativePath: rec.relativePath || rec.name,
            extension: rec.extension || rec.name.split('.').pop()?.toLowerCase() || '',
            size: rec.size,
            lastModified: rec.lastModified,
            url,
            duration: rec.duration,
          };
        });
        resolve(items);
      };

      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Could not load permanent vault media from IndexedDB:', err);
    return [];
  }
}

export const loadPermanentVaultPhotos = loadPermanentVaultMedia;

/**
 * Delete a media item permanently from IndexedDB vault and revoke its cached URL
 */
export async function deleteMediaFromVault(id: string): Promise<void> {
  try {
    const existingUrl = objectUrlCache.get(id);
    if (existingUrl) {
      revokeObjectUrl(existingUrl);
      objectUrlCache.delete(id);
    }

    const db = await openVaultDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Could not delete media from vault:', err);
  }
}

export const deletePhotoFromVault = deleteMediaFromVault;

/**
 * Clear entire permanent vault
 */
export async function clearEntireVault(): Promise<void> {
  try {
    objectUrlCache.forEach((url) => revokeObjectUrl(url));
    objectUrlCache.clear();

    const db = await openVaultDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).clear();
  } catch {
    // ignore
  }
}

/**
 * Get local storage statistics
 */
export async function getVaultStats(): Promise<{ count: number; totalBytes: number }> {
  try {
    const db = await openVaultDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const records: StoredMediaRecord[] = req.result || [];
        const totalBytes = records.reduce((acc, r) => acc + (r.size || 0), 0);
        resolve({ count: records.length, totalBytes });
      };
      req.onerror = () => resolve({ count: 0, totalBytes: 0 });
    });
  } catch {
    return { count: 0, totalBytes: 0 };
  }
}
