import React, { useState, useRef } from 'react';
import {
  FolderOpen,
  FolderSearch,
  Sparkles,
  Layers,
  AlertTriangle,
  FolderPlus,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  HardDrive
} from 'lucide-react';
import { motion } from 'motion/react';
import {
  isFileSystemAccessSupported,
  pickPhotosDirectory,
  scanDirectoryHandle,
  scanFileList,
} from '../utils/fileSystem';
import { PhotoItem } from '../types';

interface FolderSelectorProps {
  onPhotosLoaded: (photos: PhotoItem[], folderName: string, handle?: FileSystemDirectoryHandle) => void;
  includeSubfolders: boolean;
  onToggleSubfolders: (val: boolean) => void;
  isLoading: boolean;
  setIsLoading: (val: boolean) => void;
  onLogout: () => void;
}

export const FolderSelector: React.FC<FolderSelectorProps> = ({
  onPhotosLoaded,
  includeSubfolders,
  onToggleSubfolders,
  isLoading,
  setIsLoading,
  onLogout,
}) => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [scannedCount, setScannedCount] = useState<number>(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isFSAAvailable = isFileSystemAccessSupported();

  const handlePickDirectory = async () => {
    setErrorMsg(null);
    setIsLoading(true);
    setScannedCount(0);

    try {
      const dirHandle = await pickPhotosDirectory();
      const photos = await scanDirectoryHandle(dirHandle, includeSubfolders, (count) => {
        setScannedCount(count);
      });
      onPhotosLoaded(photos, dirHandle.name, dirHandle);
    } catch (err: unknown) {
      const error = err as Error;
      if (error.message === 'USER_CANCELLED') {
        // User voluntarily dismissed the folder picker dialog
        setErrorMsg(null);
      } else if (error.message === 'UNSUPPORTED_BROWSER') {
        setErrorMsg(
          'Your browser does not support direct folder access. Please use a Chromium-based browser such as Chrome or Edge, or select the folder using the fallback folder picker below.'
        );
      } else if (error.message === 'SECURITY_RESTRICTED') {
        setErrorMsg(
          'Direct folder picker is restricted in this embedded view. You can open the gallery in a new browser tab or use the folder selector below.'
        );
      } else {
        setErrorMsg(
          `Unable to read folder: ${error.message || 'Please check folder permissions and try again.'}`
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFallbackFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const files = e.target.files;
      const folderName = files[0]?.webkitRelativePath?.split('/')[0] || 'photos';
      const photos = scanFileList(files, includeSubfolders);
      onPhotosLoaded(photos, folderName);
    } catch (err) {
      setErrorMsg('Failed to read image files from the selected folder.');
    } finally {
      setIsLoading(false);
    }
  };

  // Drag & drop support
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (!e.dataTransfer.items) return;

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const items = Array.from(e.dataTransfer.items);
      // Check if getAsFileSystemHandle is supported
      const firstEntry = items[0];
      if (firstEntry && 'getAsFileSystemHandle' in firstEntry) {
        // @ts-expect-error - Chromium experimental web spec
        const handle = await firstEntry.getAsFileSystemHandle();
        if (handle && handle.kind === 'directory') {
          const dirHandle = handle as FileSystemDirectoryHandle;
          const photos = await scanDirectoryHandle(dirHandle, includeSubfolders);
          onPhotosLoaded(photos, dirHandle.name, dirHandle);
          return;
        }
      }

      // Fallback: extract files
      const files: File[] = [];
      for (const item of items) {
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file) files.push(file);
        }
      }
      if (files.length > 0) {
        const photos = scanFileList(files, includeSubfolders);
        onPhotosLoaded(photos, 'Dropped Photos');
      } else {
        setErrorMsg('Please drop a valid folder or image files.');
      }
    } catch {
      setErrorMsg('Could not read dropped folder. Please click "Choose Photos Folder" instead.');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick demo collection option for rapid zero-friction preview
  const handleLoadDemoPhotos = () => {
    setIsLoading(true);
    const demoItems: PhotoItem[] = [
      {
        id: 'demo_1',
        name: 'mountain_sunset.webp',
        relativePath: 'Vacation/mountain_sunset.webp',
        folder: 'Vacation',
        extension: 'webp',
        size: 1420580,
        lastModified: Date.now() - 86400000 * 2,
        url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=80',
        width: 1600,
        height: 1067,
      },
      {
        id: 'demo_2',
        name: 'ocean_waves.jpg',
        relativePath: 'Vacation/ocean_waves.jpg',
        folder: 'Vacation',
        extension: 'jpg',
        size: 2150420,
        lastModified: Date.now() - 86400000 * 5,
        url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80',
        width: 1600,
        height: 1067,
      },
      {
        id: 'demo_3',
        name: 'family_birthday.png',
        relativePath: 'Family/family_birthday.png',
        folder: 'Family',
        extension: 'png',
        size: 3240100,
        lastModified: Date.now() - 86400000 * 12,
        url: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1600&q=80',
        width: 1600,
        height: 1067,
      },
      {
        id: 'demo_4',
        name: 'forest_trail.webp',
        relativePath: 'Vacation/forest_trail.webp',
        folder: 'Vacation',
        extension: 'webp',
        size: 1840000,
        lastModified: Date.now() - 86400000 * 20,
        url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1600&q=80',
        width: 1600,
        height: 1067,
      },
      {
        id: 'demo_5',
        name: 'friends_gathering.jpg',
        relativePath: 'Friends/friends_gathering.jpg',
        folder: 'Friends',
        extension: 'jpg',
        size: 2650000,
        lastModified: Date.now() - 86400000 * 35,
        url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1600&q=80',
        width: 1600,
        height: 1067,
      },
      {
        id: 'demo_6',
        name: 'night_sky_aurora.webp',
        relativePath: 'Nature/night_sky_aurora.webp',
        folder: 'Nature',
        extension: 'webp',
        size: 2980000,
        lastModified: Date.now() - 86400000 * 45,
        url: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=1600&q=80',
        width: 1600,
        height: 1067,
      },
    ];
    setTimeout(() => {
      onPhotosLoaded(demoItems, 'demo-photos');
      setIsLoading(false);
    }, 400);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 bg-neutral-950 text-neutral-100">
      {/* Top Bar with Logout */}
      <div className="w-full max-w-2xl flex items-center justify-between mb-8">
        <div className="flex items-center gap-2 text-xs text-neutral-400">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Vault Unlocked</span>
        </div>
        <button
          id="btn-folder-logout"
          onClick={onLogout}
          className="text-xs text-neutral-400 hover:text-white px-3 py-1.5 rounded-lg border border-neutral-800 hover:bg-neutral-900 transition-colors"
        >
          Lock Gallery
        </button>
      </div>

      {/* Main Folder Selection Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35 }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`w-full max-w-2xl rounded-3xl border ${
          isDragOver
            ? 'border-amber-500 bg-amber-500/5 ring-4 ring-amber-500/20'
            : 'border-neutral-800/80 bg-neutral-900/70'
        } p-8 sm:p-10 shadow-2xl backdrop-blur-xl transition-all`}
      >
        <div className="flex flex-col items-center text-center">
          {/* Animated Folder Icon */}
          <div className="relative mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-tr from-amber-500/20 via-neutral-800 to-amber-400/5 border border-amber-500/30 text-amber-400 shadow-xl">
            <FolderOpen className="h-12 w-12 stroke-[1.5]" />
            <span className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-950 border border-neutral-700 text-amber-400">
              <FolderSearch className="h-4 w-4" />
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            No photo folder selected
          </h2>
          <p className="mt-2 text-sm sm:text-base text-neutral-400 max-w-md">
            Choose your local photos folder to begin. The gallery will automatically scan and display your photos.
          </p>

          {/* Subfolder Toggle Setting */}
          <div className="mt-6 inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-neutral-950/80 border border-neutral-800">
            <label className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm text-neutral-300">
              <input
                id="checkbox-include-subfolders"
                type="checkbox"
                checked={includeSubfolders}
                onChange={(e) => onToggleSubfolders(e.target.checked)}
                className="w-4 h-4 rounded border-neutral-700 text-amber-500 focus:ring-amber-500/40 bg-neutral-900 cursor-pointer"
              />
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Include subfolders (recursive scan)</span>
            </label>
          </div>

          {/* Primary Action Button: "Choose Photos Folder" */}
          <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <button
              id="btn-choose-photos-folder"
              onClick={handlePickDirectory}
              disabled={isLoading}
              className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 font-bold text-base shadow-xl shadow-amber-500/10 hover:from-amber-400 hover:to-amber-500 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <span className="w-5 h-5 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                  <span>Scanning Photos... {scannedCount > 0 && `(${scannedCount})`}</span>
                </>
              ) : (
                <>
                  <FolderPlus className="w-5 h-5" />
                  <span>Choose Photos Folder</span>
                </>
              )}
            </button>

            {/* Hidden Input for directory fallback */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFallbackFolderSelect}
              // @ts-expect-error - webkitdirectory standard
              webkitdirectory=""
              directory=""
              multiple
              className="hidden"
            />
          </div>

          <p className="mt-3 text-xs text-neutral-500">
            or drag and drop your <code className="text-neutral-400 font-mono">photos/</code> folder anywhere onto this box
          </p>

          {/* Browser compatibility / Fallback note */}
          {!isFSAAvailable && (
            <div className="mt-6 w-full rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4 text-left">
              <div className="flex items-start gap-3 text-amber-300">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <p className="font-semibold text-amber-200">
                    Direct Directory Picker Notice
                  </p>
                  <p className="mt-1 text-amber-300/90">
                    Your browser does not support direct folder access via the File System Access API. Please use a Chromium-based browser such as Chrome or Edge for full direct folder scanning, or use the alternative folder picker:
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-200 font-medium hover:bg-amber-500/30 transition-colors"
                  >
                    <HardDrive className="w-3.5 h-3.5" />
                    <span>Select Folder via File Dialog</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Error message */}
          {errorMsg && (
            <div className="mt-6 w-full rounded-2xl bg-rose-500/10 border border-rose-500/30 p-4 text-left">
              <div className="flex items-start gap-3 text-rose-300">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-semibold text-rose-200">Folder Selection Notice</p>
                  <p className="mt-1 text-rose-300/90">{errorMsg}</p>
                  <div className="mt-3 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-neutral-800 text-neutral-200 hover:bg-neutral-700 transition"
                    >
                      Use Alternative Folder Picker
                    </button>
                    <a
                      href={window.location.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-amber-400 hover:underline"
                    >
                      <span>Open in New Window</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Zero Friction Demo Preview Button */}
          <div className="mt-8 pt-6 border-t border-neutral-800/80 w-full flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Supports JPG, PNG, WEBP, GIF, AVIF</span>
            </span>

            <button
              id="btn-load-demo-photos"
              onClick={handleLoadDemoPhotos}
              className="inline-flex items-center gap-1.5 text-neutral-400 hover:text-amber-300 px-3 py-1.5 rounded-lg bg-neutral-800/60 hover:bg-neutral-800 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Preview with Sample Photos</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* How it works simple guide */}
      <div className="mt-8 w-full max-w-2xl grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-neutral-400">
        <div className="p-4 rounded-2xl bg-neutral-900/40 border border-neutral-800/50">
          <div className="font-semibold text-neutral-200 mb-1 flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-neutral-800 text-amber-400 flex items-center justify-center text-[10px] font-bold">1</span>
            <span>Create Folder</span>
          </div>
          <p className="text-neutral-500">
            Keep images in a local folder named <code className="text-neutral-300 font-mono">photos/</code> on your device.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-neutral-900/40 border border-neutral-800/50">
          <div className="font-semibold text-neutral-200 mb-1 flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-neutral-800 text-amber-400 flex items-center justify-center text-[10px] font-bold">2</span>
            <span>Zero Upload</span>
          </div>
          <p className="text-neutral-500">
            Images never leave your computer. Browsing happens 100% locally in browser memory.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-neutral-900/40 border border-neutral-800/50">
          <div className="font-semibold text-neutral-200 mb-1 flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-neutral-800 text-amber-400 flex items-center justify-center text-[10px] font-bold">3</span>
            <span>Live Rescan</span>
          </div>
          <p className="text-neutral-500">
            Add or remove images anytime, then click &ldquo;Refresh Photos&rdquo; to update immediately.
          </p>
        </div>
      </div>
    </div>
  );
};
