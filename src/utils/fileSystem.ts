import { PhotoItem } from '../types';
import { registerObjectUrl, revokeAllObjectUrls } from './imageUtils';

export const SUPPORTED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif']);

/**
 * Check if the browser supports the File System Access API
 */
export function isFileSystemAccessSupported(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

/**
 * Store and retrieve DirectoryHandle in IndexedDB for seamless refresh / reload
 */
const DB_NAME = 'zish_gallery_db';
const DB_VERSION = 1;
const STORE_NAME = 'handles';

function openHandleDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function storeDirectoryHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  try {
    const db = await openHandleDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(handle, 'activeFolder');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Could not store directory handle in IndexedDB:', err);
  }
}

export async function getStoredDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const db = await openHandleDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get('activeFolder');
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function clearStoredDirectoryHandle(): Promise<void> {
  try {
    const db = await openHandleDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete('activeFolder');
  } catch {
    // ignore
  }
}

/**
 * Check and request permission on a FileSystemHandle
 */
export async function verifyPermission(handle: FileSystemHandle, readWrite = false): Promise<boolean> {
  const options = {
    mode: (readWrite ? 'readwrite' : 'read') as 'read' | 'readwrite',
  };

  try {
    const handleWithPerm = handle as unknown as {
      queryPermission?: (opt: { mode: string }) => Promise<string>;
      requestPermission?: (opt: { mode: string }) => Promise<string>;
    };

    if (handleWithPerm.queryPermission && (await handleWithPerm.queryPermission(options)) === 'granted') {
      return true;
    }
    if (handleWithPerm.requestPermission && (await handleWithPerm.requestPermission(options)) === 'granted') {
      return true;
    }
  } catch (err) {
    console.warn('Permission query/request failed:', err);
  }
  return false;
}

/**
 * Pick a directory using window.showDirectoryPicker()
 */
export async function pickPhotosDirectory(): Promise<FileSystemDirectoryHandle> {
  if (!isFileSystemAccessSupported()) {
    throw new Error('UNSUPPORTED_BROWSER');
  }

  try {
    // @ts-expect-error - standard browser API in modern Chromium
    const dirHandle: FileSystemDirectoryHandle = await window.showDirectoryPicker({
      id: 'zish-gallery-root',
      mode: 'read',
    });
    await storeDirectoryHandle(dirHandle);
    return dirHandle;
  } catch (err: unknown) {
    const error = err as Error;
    if (error.name === 'AbortError') {
      throw new Error('USER_CANCELLED');
    }
    if (error.name === 'SecurityError') {
      throw new Error('SECURITY_RESTRICTED');
    }
    throw error;
  }
}

/**
 * Recursively scans directory handle for image files
 */
export async function scanDirectoryHandle(
  dirHandle: FileSystemDirectoryHandle,
  includeSubfolders = true,
  onProgress?: (count: number) => void
): Promise<PhotoItem[]> {
  const results: PhotoItem[] = [];

  async function traverse(currentDir: FileSystemDirectoryHandle, currentPath: string, folderName: string) {
    for await (const entry of currentDir.values()) {
      if (entry.kind === 'file') {
        const ext = entry.name.split('.').pop()?.toLowerCase() || '';
        if (SUPPORTED_EXTENSIONS.has(ext)) {
          try {
            const file = await entry.getFile();
            // Validate MIME type strictly: must be image/*
            if (file.type && !file.type.startsWith('image/')) {
              continue;
            }

            const objectUrl = registerObjectUrl(URL.createObjectURL(file));
            const relPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
            const uniqueId = `${relPath}_${file.lastModified}_${file.size}`;

            results.push({
              id: uniqueId,
              name: entry.name,
              relativePath: relPath,
              folder: folderName || 'Root',
              extension: ext,
              size: file.size,
              lastModified: file.lastModified,
              url: objectUrl,
              fileHandle: entry,
            });

            if (onProgress && results.length % 5 === 0) {
              onProgress(results.length);
            }
          } catch (fileErr) {
            console.warn(`Skipping unreadable file: ${entry.name}`, fileErr);
          }
        }
      } else if (entry.kind === 'directory' && includeSubfolders) {
        // Skip hidden directories (like .git, .vscode)
        if (entry.name.startsWith('.')) continue;

        const subPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
        await traverse(entry, subPath, entry.name);
      }
    }
  }

  await traverse(dirHandle, '', 'Root');
  return results;
}

/**
 * Scan standard HTML FileList (fallback for browsers without showDirectoryPicker or iframes)
 */
export function scanFileList(files: FileList | File[], includeSubfolders = true): PhotoItem[] {
  revokeAllObjectUrls();
  const results: PhotoItem[] = [];

  const fileArray = Array.from(files);
  for (const file of fileArray) {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (SUPPORTED_EXTENSIONS.has(ext)) {
      if (file.type && !file.type.startsWith('image/')) {
        continue;
      }

      // webkitRelativePath contains "photos/Vacation/beach.jpg"
      const relativePath = file.webkitRelativePath || file.name;
      const pathParts = relativePath.split('/');
      
      // If it has subdirectories and includeSubfolders is false, only keep files in root directory
      if (!includeSubfolders && pathParts.length > 2) {
        continue;
      }

      const folder = pathParts.length > 1 ? pathParts[pathParts.length - 2] : 'Root';
      const objectUrl = registerObjectUrl(URL.createObjectURL(file));
      const uniqueId = `${relativePath}_${file.lastModified}_${file.size}`;

      results.push({
        id: uniqueId,
        name: file.name,
        relativePath,
        folder,
        extension: ext,
        size: file.size,
        lastModified: file.lastModified,
        url: objectUrl,
      });
    }
  }

  return results;
}
