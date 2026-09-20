import { PhotoItem } from '../types';
import { registerObjectUrl } from './imageUtils';

const DB_NAME = 'zish_permanent_vault_db';
const DB_VERSION = 1;
const STORE_NAME = 'permanent_photos';

interface StoredPhotoRecord {
  id: string;
  name: string;
  folder: string;
  relativePath: string;
  extension: string;
  size: number;
  lastModified: number;
  blob: Blob;
}

function openVaultDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save image files into the permanent client-side IndexedDB vault
 */
export async function savePhotosToVault(
  files: File[],
  defaultFolder = 'Vault'
): Promise<PhotoItem[]> {
  const db = await openVaultDB();
  const addedItems: PhotoItem[] = [];

  for (const file of files) {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const relativePath = file.webkitRelativePath || `${defaultFolder}/${file.name}`;
    const pathParts = relativePath.split('/');
    const folder = pathParts.length > 1 ? pathParts[pathParts.length - 2] : defaultFolder;
    const id = `vault_${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${file.name}`;

    const record: StoredPhotoRecord = {
      id,
      name: file.name,
      folder,
      relativePath,
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
      relativePath: record.relativePath,
      folder: record.folder,
      extension: ext,
      size: record.size,
      lastModified: record.lastModified,
      url: objectUrl,
    });
  }

  return addedItems;
}

/**
 * Load all permanently stored photos from IndexedDB
 */
export async function loadPermanentVaultPhotos(): Promise<PhotoItem[]> {
  try {
    const db = await openVaultDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => {
        const records: StoredPhotoRecord[] = req.result || [];
        const items: PhotoItem[] = records.map((rec) => {
          const url = registerObjectUrl(URL.createObjectURL(rec.blob));
          return {
            id: rec.id,
            name: rec.name,
            relativePath: rec.relativePath,
            folder: rec.folder,
            extension: rec.extension,
            size: rec.size,
            lastModified: rec.lastModified,
            url,
          };
        });
        resolve(items);
      };

      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Could not load permanent vault photos from IndexedDB:', err);
    return [];
  }
}

/**
 * Delete a photo permanently from IndexedDB vault
 */
export async function deletePhotoFromVault(id: string): Promise<void> {
  try {
    const db = await openVaultDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Could not delete photo from vault:', err);
  }
}

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
