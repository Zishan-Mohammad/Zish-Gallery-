import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Heart,
  Download,
  Info,
  ZoomIn,
  ZoomOut,
  Folder,
  Calendar,
  HardDrive,
  Trash2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PhotoItem } from '../types';
import { formatBytes, formatDate } from '../utils/imageUtils';

interface PhotoViewerProps {
  photos: PhotoItem[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (newIndex: number) => void;
  onToggleFavorite: (photoId: string) => void;
  onDeletePhoto?: (photoId: string) => void;
  isFavorite: boolean;
}

export const PhotoViewer: React.FC<PhotoViewerProps> = ({
  photos,
  currentIndex,
  onClose,
  onNavigate,
  onToggleFavorite,
  onDeletePhoto,
  isFavorite,
}) => {
  const photo = photos[currentIndex];
  const [showInfo, setShowInfo] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [imageDims, setImageDims] = useState<{ width: number; height: number } | null>(null);

  // Swipe detection refs
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const minSwipeDistance = 50;

  // Prevent background scrolling while modal is open
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      onNavigate(currentIndex - 1);
      setIsZoomed(false);
    }
  }, [currentIndex, onNavigate]);

  const handleNext = useCallback(() => {
    if (currentIndex < photos.length - 1) {
      onNavigate(currentIndex + 1);
      setIsZoomed(false);
    }
  }, [currentIndex, photos.length, onNavigate]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'f' || e.key === 'F') {
        if (photo) onToggleFavorite(photo.id);
      } else if (e.key === 'i' || e.key === 'I') {
        setShowInfo((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrev, handleNext, onClose, onToggleFavorite, photo]);

  // Touch swipe handling
  const onTouchStart = (e: React.TouchEvent) => {
    touchEndX.current = null;
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    if (distance > minSwipeDistance) {
      // Swiped left -> next
      handleNext();
    } else if (distance < -minSwipeDistance) {
      // Swiped right -> prev
      handlePrev();
    }
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageDims({ width: img.naturalWidth, height: img.naturalHeight });
  };

  if (!photo) return null;

  return (
    <div
      id="lightbox-container"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl text-neutral-100 select-none overflow-hidden"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Top Controls Bar */}
      <div className="absolute top-0 inset-x-0 z-30 flex items-center justify-between p-4 sm:p-6 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        {/* Left: Counter & Filename */}
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full bg-neutral-900/90 border border-neutral-700 text-xs font-semibold text-neutral-300">
            {currentIndex + 1} / {photos.length}
          </span>
          <span className="hidden sm:inline-block text-sm font-medium text-white max-w-xs truncate" title={photo.name}>
            {photo.name}
          </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Zoom Toggle */}
          <button
            type="button"
            id="btn-lightbox-zoom"
            onClick={() => setIsZoomed(!isZoomed)}
            className="p-2.5 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 transition-colors"
            title={isZoomed ? 'Fit to Screen' : 'Zoom In'}
          >
            {isZoomed ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
          </button>

          {/* Info Toggle */}
          <button
            type="button"
            id="btn-lightbox-info"
            onClick={() => setShowInfo(!showInfo)}
            className={`p-2.5 rounded-xl border transition-colors ${
              showInfo
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border-neutral-800'
            }`}
            title="Toggle Photo Details"
          >
            <Info className="w-4 h-4" />
          </button>

          {/* Favorite Toggle */}
          <button
            type="button"
            id="btn-lightbox-favorite"
            onClick={() => onToggleFavorite(photo.id)}
            className={`p-2.5 rounded-xl border transition-colors ${
              isFavorite
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                : 'bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-rose-400 border-neutral-800'
            }`}
            title={isFavorite ? 'Remove from Favorites (F)' : 'Mark as Favorite (F)'}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-400' : ''}`} />
          </button>

          {/* Download Photo Button */}
          <a
            id="btn-lightbox-download"
            href={photo.url}
            download={photo.name}
            className="p-2.5 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 transition-colors"
            title="Download / Save copy"
          >
            <Download className="w-4 h-4" />
          </a>

          {/* Delete Photo Button (if user-stored in vault) */}
          {onDeletePhoto && photo.id.startsWith('vault_') && (
            <button
              type="button"
              id="btn-lightbox-delete"
              onClick={() => {
                if (window.confirm(`Permanently remove "${photo.name}" from your vault?`)) {
                  onDeletePhoto(photo.id);
                  onClose();
                }
              }}
              className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 hover:text-rose-300 border border-rose-500/30 transition-colors"
              title="Delete from Vault"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          {/* Close Button */}
          <button
            type="button"
            id="btn-lightbox-close"
            onClick={onClose}
            className="p-2.5 rounded-xl bg-neutral-900/90 hover:bg-rose-950 hover:text-rose-300 text-neutral-300 border border-neutral-800 transition-colors ml-2"
            title="Close Viewer (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div
        className="relative w-full h-full flex items-center justify-center p-4 sm:p-12 overflow-auto"
        onClick={(e) => {
          // If clicked directly on the dark backdrop, close
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={photo.id}
            src={photo.url}
            alt={photo.name}
            onLoad={handleImageLoad}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className={`transition-all duration-300 select-none shadow-2xl rounded-lg ${
              isZoomed
                ? 'max-w-none cursor-zoom-out'
                : 'max-h-[86vh] max-w-[90vw] object-contain cursor-zoom-in'
            }`}
            onClick={() => setIsZoomed(!isZoomed)}
          />
        </AnimatePresence>
      </div>

      {/* Left Navigation Arrow */}
      {currentIndex > 0 && (
        <button
          type="button"
          id="btn-lightbox-prev"
          onClick={handlePrev}
          aria-label="Previous photo"
          className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-2xl bg-neutral-900/80 hover:bg-neutral-800 text-neutral-200 hover:text-white border border-neutral-800 shadow-xl transition-all active:scale-95"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {/* Right Navigation Arrow */}
      {currentIndex < photos.length - 1 && (
        <button
          type="button"
          id="btn-lightbox-next"
          onClick={handleNext}
          aria-label="Next photo"
          className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-2xl bg-neutral-900/80 hover:bg-neutral-800 text-neutral-200 hover:text-white border border-neutral-800 shadow-xl transition-all active:scale-95"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* Details / Metadata Drawer */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-30 sm:w-80 rounded-2xl bg-neutral-900/95 border border-neutral-800 p-4 shadow-2xl backdrop-blur-xl text-neutral-200 text-xs"
          >
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-800">
              <span className="font-semibold text-white">Photo Details</span>
              <button
                onClick={() => setShowInfo(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <div>
                <span className="text-neutral-400 block text-[10px] uppercase tracking-wider">Filename</span>
                <span className="font-medium text-white break-all">{photo.name}</span>
              </div>

              {photo.relativePath !== photo.name && (
                <div className="flex items-start gap-1.5">
                  <Folder className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-neutral-400 block text-[10px] uppercase tracking-wider">Folder Path</span>
                    <span className="text-neutral-300 font-mono text-[11px] break-all">{photo.relativePath}</span>
                  </div>
                </div>
              )}

              {imageDims && (
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Dimensions:</span>
                  <span className="font-mono text-neutral-200">{imageDims.width} × {imageDims.height} px</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-neutral-400 flex items-center gap-1">
                  <HardDrive className="w-3 h-3" />
                  <span>File Size:</span>
                </span>
                <span className="font-mono text-neutral-200">{formatBytes(photo.size)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-neutral-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>Modified:</span>
                </span>
                <span className="text-neutral-300">{formatDate(photo.lastModified)}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
