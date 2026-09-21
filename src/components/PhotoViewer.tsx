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
  Calendar,
  HardDrive,
  Trash2,
  Video,
  Clock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MediaItem } from '../types';
import { formatBytes, formatDate } from '../utils/imageUtils';

interface PhotoViewerProps {
  photos: MediaItem[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (newIndex: number) => void;
  onToggleFavorite: (itemId: string) => void;
  onDeletePhoto?: (itemId: string) => void;
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
  const item = photos[currentIndex];
  const [showInfo, setShowInfo] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [mediaDims, setMediaDims] = useState<{ width: number; height: number } | null>(null);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);

  // Swipe detection refs
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);
  const lastTapTime = useRef<number>(0);
  const activeThumbnailRef = useRef<HTMLButtonElement | null>(null);
  const minSwipeDistance = 45;

  // Auto-scroll active thumbnail into view
  useEffect(() => {
    if (activeThumbnailRef.current) {
      activeThumbnailRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [currentIndex]);

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
      setMediaDims(null);
      setVideoDuration(null);
    }
  }, [currentIndex, onNavigate]);

  const handleNext = useCallback(() => {
    if (currentIndex < photos.length - 1) {
      onNavigate(currentIndex + 1);
      setIsZoomed(false);
      setMediaDims(null);
      setVideoDuration(null);
    }
  }, [currentIndex, photos.length, onNavigate]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'f' || e.key === 'F') {
        if (item) onToggleFavorite(item.id);
      } else if (e.key === 'i' || e.key === 'I') {
        setShowInfo((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrev, handleNext, onClose, onToggleFavorite, item]);

  // Touch gesture handling (Swipe Left/Right to Navigate, Swipe Down to Close)
  const onTouchStart = (e: React.TouchEvent) => {
    touchEndX.current = null;
    touchEndY.current = null;
    touchStartX.current = e.targetTouches[0].clientX;
    touchStartY.current = e.targetTouches[0].clientY;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
    touchEndY.current = e.targetTouches[0].clientY;
  };

  const onTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const deltaX = touchStartX.current - touchEndX.current;
    const deltaY = (touchStartY.current ?? 0) - (touchEndY.current ?? 0);

    // If swipe down is significant and mostly vertical -> close viewer (mobile gesture)
    if (deltaY < -65 && Math.abs(deltaX) < 55) {
      onClose();
      return;
    }

    // If horizontal swipe is significant and mostly horizontal -> next/prev
    if (Math.abs(deltaX) > minSwipeDistance && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
      if (deltaX > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
  };

  // Double tap to zoom handler for mobile photos
  const handlePhotoTap = () => {
    const now = Date.now();
    if (now - lastTapTime.current < 300) {
      setIsZoomed((prev) => !prev);
    }
    lastTapTime.current = now;
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setMediaDims({ width: img.naturalWidth, height: img.naturalHeight });
  };

  const handleVideoMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const vid = e.currentTarget;
    setMediaDims({ width: vid.videoWidth, height: vid.videoHeight });
    if (vid.duration && !isNaN(vid.duration)) {
      setVideoDuration(vid.duration);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (!item) return null;
  const isVideo = item.mediaType === 'video';

  return (
    <div
      id="lightbox-container"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl text-neutral-100 select-none overflow-hidden"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Top Controls Bar */}
      <div className="absolute top-0 inset-x-0 z-30 flex items-center justify-between p-2.5 sm:p-6 pt-[max(0.75rem,env(safe-area-inset-top))] bg-gradient-to-b from-black/90 via-black/50 to-transparent">
        {/* Left: Counter & Filename */}
        <div className="flex items-center gap-2 sm:gap-3 shrink min-w-0">
          <span className="px-2.5 sm:px-3 py-1 rounded-full bg-neutral-900/90 border border-neutral-700 text-xs font-semibold text-neutral-300 shrink-0">
            {currentIndex + 1} / {photos.length}
          </span>
          <span className="text-xs sm:text-sm font-medium text-white truncate max-w-[120px] sm:max-w-xs md:max-w-md" title={item.name}>
            {item.name}
          </span>
          {isVideo && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold uppercase shrink-0">
              <Video className="w-3 h-3" />
              <span className="hidden xs:inline">Video</span>
            </span>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Zoom Toggle (only for photos) */}
          {!isVideo && (
            <button
              type="button"
              id="btn-lightbox-zoom"
              onClick={() => setIsZoomed(!isZoomed)}
              className="p-2 sm:p-2.5 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center active:scale-95"
              title={isZoomed ? 'Fit to Screen' : 'Zoom In'}
            >
              {isZoomed ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
            </button>
          )}

          {/* Info Toggle */}
          <button
            type="button"
            id="btn-lightbox-info"
            onClick={() => setShowInfo(!showInfo)}
            className={`p-2 sm:p-2.5 rounded-xl border transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center active:scale-95 ${
              showInfo
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border-neutral-800'
            }`}
            title="Toggle Media Details"
          >
            <Info className="w-4 h-4" />
          </button>

          {/* Favorite Toggle */}
          <button
            type="button"
            id="btn-lightbox-favorite"
            onClick={() => onToggleFavorite(item.id)}
            className={`p-2 sm:p-2.5 rounded-xl border transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center active:scale-95 ${
              isFavorite
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                : 'bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-rose-400 border-neutral-800'
            }`}
            title={isFavorite ? 'Remove from Favorites (F)' : 'Mark as Favorite (F)'}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-400' : ''}`} />
          </button>

          {/* Download Media Button */}
          <a
            id="btn-lightbox-download"
            href={item.url}
            download={item.name}
            className="p-2 sm:p-2.5 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center active:scale-95"
            title="Download / Save copy"
          >
            <Download className="w-4 h-4" />
          </a>

          {/* Delete Media Button (Permanent local deletion) */}
          {onDeletePhoto && (
            <button
              type="button"
              id="btn-lightbox-delete"
              onClick={() => {
                if (window.confirm(`Permanently remove "${item.name}" from your vault?`)) {
                  onDeletePhoto(item.id);
                  onClose();
                }
              }}
              className="p-2 sm:p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 hover:text-rose-300 border border-rose-500/30 transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center active:scale-95"
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
            className="p-2 sm:p-2.5 rounded-xl bg-neutral-900/90 hover:bg-rose-950 hover:text-rose-300 text-neutral-300 border border-neutral-800 transition-colors ml-1 min-h-[38px] min-w-[38px] flex items-center justify-center active:scale-95"
            title="Close Viewer (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Media Stage */}
      <div
        className="relative w-full h-full flex items-center justify-center p-2 sm:p-8 pt-16 pb-20 sm:pb-24 overflow-hidden"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <AnimatePresence mode="wait">
          {isVideo ? (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="max-h-[75vh] sm:max-h-[82vh] max-w-[95vw] sm:max-w-[90vw] flex items-center justify-center"
            >
              <video
                ref={videoRef}
                src={item.url}
                controls
                autoPlay
                playsInline
                onLoadedMetadata={handleVideoMetadata}
                className="max-h-[74vh] sm:max-h-[80vh] max-w-[94vw] sm:max-w-[88vw] rounded-2xl shadow-2xl border border-neutral-800 bg-black outline-none"
              />
            </motion.div>
          ) : (
            <motion.img
              key={item.id}
              src={item.url}
              alt={item.name}
              onLoad={handleImageLoad}
              onClick={handlePhotoTap}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className={`transition-all duration-300 select-none shadow-2xl rounded-lg ${
                isZoomed
                  ? 'max-w-none max-h-none cursor-zoom-out'
                  : 'max-h-[74vh] sm:max-h-[82vh] max-w-[95vw] sm:max-w-[90vw] object-contain cursor-zoom-in'
              }`}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Left Navigation Arrow */}
      {currentIndex > 0 && (
        <button
          type="button"
          id="btn-lightbox-prev"
          onClick={handlePrev}
          aria-label="Previous media"
          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 p-2.5 sm:p-3 rounded-full sm:rounded-2xl bg-black/60 sm:bg-neutral-900/80 hover:bg-neutral-800 text-neutral-200 hover:text-white border border-neutral-800/80 shadow-xl transition-all active:scale-90"
        >
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      )}

      {/* Right Navigation Arrow */}
      {currentIndex < photos.length - 1 && (
        <button
          type="button"
          id="btn-lightbox-next"
          onClick={handleNext}
          aria-label="Next media"
          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 p-2.5 sm:p-3 rounded-full sm:rounded-2xl bg-black/60 sm:bg-neutral-900/80 hover:bg-neutral-800 text-neutral-200 hover:text-white border border-neutral-800/80 shadow-xl transition-all active:scale-90"
        >
          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      )}

      {/* Bottom Thumbnail Strip (Smooth mobile filmstrip) */}
      <div className="absolute bottom-0 inset-x-0 z-30 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 bg-gradient-to-t from-black via-black/80 to-transparent">
        <div className="flex items-center gap-1.5 overflow-x-auto px-4 py-1.5 no-scrollbar max-w-2xl mx-auto touch-pan-x justify-start sm:justify-center">
          {photos.map((thumb, idx) => {
            const isActive = idx === currentIndex;
            return (
              <button
                key={thumb.id}
                ref={isActive ? activeThumbnailRef : null}
                type="button"
                onClick={() => {
                  onNavigate(idx);
                  setIsZoomed(false);
                }}
                className={`relative shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden border transition-all duration-200 active:scale-95 ${
                  isActive
                    ? 'border-amber-400 ring-2 ring-amber-400/40 scale-105 opacity-100 z-10'
                    : 'border-neutral-800 opacity-40 hover:opacity-80'
                }`}
                aria-label={`Jump to item ${idx + 1}`}
              >
                {thumb.mediaType === 'video' ? (
                  <div className="w-full h-full bg-neutral-900 flex items-center justify-center">
                    <Video className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                ) : (
                  <img
                    src={thumb.url}
                    alt={thumb.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Details / Metadata Drawer */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="absolute bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-24 z-40 sm:w-80 rounded-2xl bg-neutral-900/95 border border-neutral-800 p-4 shadow-2xl backdrop-blur-xl text-neutral-200 text-xs"
          >
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-800">
              <span className="font-semibold text-white">Media Details</span>
              <button
                onClick={() => setShowInfo(false)}
                className="text-neutral-400 hover:text-white p-1"
                aria-label="Close details"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <div>
                <span className="text-neutral-400 block text-[10px] uppercase tracking-wider">Filename</span>
                <span className="font-medium text-white break-all">{item.name}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Media Type:</span>
                <span className="font-semibold text-amber-300 uppercase">{item.mediaType}</span>
              </div>

              {mediaDims && (
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Resolution:</span>
                  <span className="font-mono text-neutral-200">{mediaDims.width} × {mediaDims.height} px</span>
                </div>
              )}

              {videoDuration && (
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Duration:</span>
                  </span>
                  <span className="font-mono text-neutral-200">{formatDuration(videoDuration)}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-neutral-400 flex items-center gap-1">
                  <HardDrive className="w-3 h-3" />
                  <span>File Size:</span>
                </span>
                <span className="font-mono text-neutral-200">{formatBytes(item.size)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-neutral-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>Modified:</span>
                </span>
                <span className="text-neutral-300">{formatDate(item.lastModified)}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
