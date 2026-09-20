import { MediaItem, MediaType } from '../types';
import { registerObjectUrl } from './imageUtils';

const DB_NAME = 'zish_permanent_vault_db';
const DB_VERSION = 2;
const STORE_NAME = 'permanent_media';

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

function openVaultDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
      // Migrate from old store if existed
      const oldStoreName = 'permanent_photos';
      if (event.oldVersion < 2 && db.objectStoreNames.contains(oldStoreName)) {
        // Can be copied or handled
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save image or video files into the permanent client-side IndexedDB vault
 */
export async function saveMediaToVault(files: File[]): Promise<MediaItem[]> {
  const db = await openVaultDB();
  const addedItems: MediaItem[] = [];

  for (const file of files) {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
    const mediaType = detectMediaType(file.name, file.type);
    const id = `vault_${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${file.name}`;

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

    const objectUrl = registerObjectUrl(URL.createObjectURL(file));

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

// Backwards-compatible alias
export const savePhotosToVault = saveMediaToVault;

/**
 * Load all permanently stored media from IndexedDB
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
          const url = registerObjectUrl(URL.createObjectURL(rec.blob));
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
 * Delete a media item permanently from IndexedDB vault
 */
export async function deleteMediaFromVault(id: string): Promise<void> {
  try {
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
    const db = await openVaultDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).clear();
  } catch {
    // ignore
  }
}
