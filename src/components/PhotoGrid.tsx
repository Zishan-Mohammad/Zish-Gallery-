import React, { useState, useRef } from 'react';
import { Heart, Maximize2, Video, Play, Image as ImageIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { MediaItem, GridDensity } from '../types';
import { formatBytes } from '../utils/imageUtils';

interface PhotoGridProps {
  photos: MediaItem[];
  density: GridDensity;
  showMetadataOverlay: boolean;
  onPhotoClick: (item: MediaItem, index: number) => void;
  onToggleFavorite: (itemId: string) => void;
  favoritesSet: Set<string>;
}

export const PhotoGrid: React.FC<PhotoGridProps> = ({
  photos,
  density,
  showMetadataOverlay,
  onPhotoClick,
  onToggleFavorite,
  favoritesSet,
}) => {
  // Density layout mapping optimized for phones, tablets and large screens
  const gridClasses = {
    compact: 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-1.5 sm:gap-2.5',
    comfortable: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-4',
    large: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6',
  }[density];

  return (
    <div className={`grid ${gridClasses} w-full py-3 sm:py-4`}>
      {photos.map((item, index) => (
        <MediaCard
          key={item.id}
          item={item}
          index={index}
          density={density}
          isFavorite={favoritesSet.has(item.id)}
          showMetadataOverlay={showMetadataOverlay}
          onClick={() => onPhotoClick(item, index)}
          onToggleFavorite={(e) => {
            e.stopPropagation();
            onToggleFavorite(item.id);
          }}
        />
      ))}
    </div>
  );
};

interface MediaCardProps {
  item: MediaItem;
  index: number;
  density: GridDensity;
  isFavorite: boolean;
  showMetadataOverlay: boolean;
  onClick: () => void;
  onToggleFavorite: (e: React.MouseEvent) => void;
}

const MediaCard: React.FC<MediaCardProps> = ({
  item,
  index,
  density,
  isFavorite,
  showMetadataOverlay,
  onClick,
  onToggleFavorite,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isVideo = item.mediaType === 'video';

  const handleMouseEnter = () => {
    if (isVideo && videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay may be restricted without user interaction
      });
    }
  };

  const handleMouseLeave = () => {
    if (isVideo && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.015, 0.25) }}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`group relative cursor-pointer overflow-hidden rounded-xl sm:rounded-2xl bg-neutral-900 border border-neutral-800/80 shadow-sm hover:border-amber-500/50 hover:shadow-xl transition-all duration-300 transform active:scale-[0.98] sm:hover:-translate-y-1 ${
        density === 'large' ? 'max-w-2xl mx-auto w-full' : ''
      }`}
    >
      {/* Aspect Ratio Container */}
      <div className={`relative ${density === 'large' ? 'aspect-[4/3] sm:aspect-video' : 'aspect-square'} w-full overflow-hidden bg-neutral-950/60 flex items-center justify-center`}>
        {/* Skeleton Placeholder while loading */}
        {!isLoaded && !hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-900 animate-pulse">
            <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full border-2 border-neutral-700 border-t-amber-500 animate-spin" />
          </div>
        )}

        {/* Placeholder for unloaded / empty media */}
        {hasError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-2.5 sm:p-4 text-center bg-gradient-to-b from-neutral-900 via-neutral-900 to-neutral-950">
            <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-neutral-800/90 border border-neutral-700/80 text-amber-400 mb-1.5 shadow-inner">
              {isVideo ? <Video className="w-4 h-4 sm:w-5 sm:h-5" /> : <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5" />}
            </div>
            <span className="text-[10px] sm:text-xs font-medium text-neutral-300 truncate max-w-full px-1">
              {item.name}
            </span>
            <span className="text-[8px] sm:text-[9px] uppercase tracking-wider text-neutral-500 mt-0.5">
              {item.extension} • {formatBytes(item.size)}
            </span>
          </div>
        ) : isVideo ? (
          /* Video Thumbnail / Preview */
          <div className="relative w-full h-full">
            <video
              ref={videoRef}
              src={item.url}
              preload="metadata"
              muted
              playsInline
              loop
              onLoadedData={() => setIsLoaded(true)}
              onError={() => {
                setHasError(true);
                setIsLoaded(true);
              }}
              className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                isLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
            {/* Centered Play Button Indicator */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:scale-110 transition-transform">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-black/65 backdrop-blur-md border border-white/20 text-white shadow-lg">
                <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white ml-0.5" />
              </div>
            </div>
          </div>
        ) : (
          /* Photo Image */
          <img
            src={item.url}
            alt={item.name}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onLoad={() => setIsLoaded(true)}
            onError={() => {
              setHasError(true);
              setIsLoaded(true);
            }}
            className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}

        {/* Top Badges (Format + Favorite Button) */}
        <div className="absolute top-1.5 sm:top-2 left-1.5 sm:left-2 right-1.5 sm:right-2 flex items-center justify-between pointer-events-none z-10">
          <span
            className={`flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-md backdrop-blur-md text-[9px] sm:text-[10px] font-bold tracking-wider uppercase border shadow-sm ${
              isVideo
                ? 'bg-amber-500/90 text-neutral-950 border-amber-400/60 font-black'
                : 'bg-black/60 text-neutral-300 border-white/10'
            }`}
          >
            {isVideo && <Video className="w-2.5 h-2.5" />}
            <span>{item.extension}</span>
          </span>

          <button
            type="button"
            onClick={onToggleFavorite}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            className={`pointer-events-auto p-1.5 sm:p-1.5 rounded-full transition-all active:scale-90 shadow-md min-w-[32px] min-h-[32px] flex items-center justify-center ${
              isFavorite
                ? 'bg-rose-500 text-white opacity-100'
                : 'bg-black/60 backdrop-blur-md text-neutral-300 hover:text-rose-400 hover:bg-black/80 opacity-75 sm:opacity-0 sm:group-hover:opacity-100'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-white' : ''}`} />
          </button>
        </div>

        {/* Bottom Metadata Overlay */}
        <div
          className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-2 sm:p-3 pt-4 sm:pt-6 text-left transition-opacity duration-200 z-10 ${
            showMetadataOverlay ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 sm:opacity-0'
          }`}
        >
          <div className="flex items-center justify-between gap-1">
            <p className="text-[11px] sm:text-xs font-semibold text-white truncate max-w-[85%]" title={item.name}>
              {item.name}
            </p>
            <Maximize2 className="w-3 h-3 text-neutral-400 group-hover:text-amber-300 transition-colors shrink-0 hidden sm:block" />
          </div>

          <div className="mt-0.5 sm:mt-1 flex items-center justify-between text-[9px] sm:text-[10px] text-neutral-400">
            <span className="capitalize">{item.mediaType}</span>
            <span>{formatBytes(item.size)}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
