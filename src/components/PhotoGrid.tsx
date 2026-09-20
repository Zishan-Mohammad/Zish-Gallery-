import React, { useState } from 'react';
import { Heart, Maximize2, ImageOff, Folder } from 'lucide-react';
import { motion } from 'motion/react';
import { PhotoItem, GridDensity } from '../types';
import { formatBytes } from '../utils/imageUtils';

interface PhotoGridProps {
  photos: PhotoItem[];
  density: GridDensity;
  showMetadataOverlay: boolean;
  onPhotoClick: (photo: PhotoItem, index: number) => void;
  onToggleFavorite: (photoId: string) => void;
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
  // Density layout mapping
  const gridClasses = {
    compact: 'grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2.5',
    comfortable: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4',
    large: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6',
  }[density];

  return (
    <div className={`grid ${gridClasses} w-full py-4`}>
      {photos.map((photo, index) => (
        <PhotoCard
          key={photo.id}
          photo={photo}
          index={index}
          isFavorite={favoritesSet.has(photo.id)}
          showMetadataOverlay={showMetadataOverlay}
          onClick={() => onPhotoClick(photo, index)}
          onToggleFavorite={(e) => {
            e.stopPropagation();
            onToggleFavorite(photo.id);
          }}
        />
      ))}
    </div>
  );
};

interface PhotoCardProps {
  photo: PhotoItem;
  index: number;
  isFavorite: boolean;
  showMetadataOverlay: boolean;
  onClick: () => void;
  onToggleFavorite: (e: React.MouseEvent) => void;
}

const PhotoCard: React.FC<PhotoCardProps> = ({
  photo,
  index,
  isFavorite,
  showMetadataOverlay,
  onClick,
  onToggleFavorite,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.02, 0.3) }}
      onClick={onClick}
      className="group relative cursor-pointer overflow-hidden rounded-2xl bg-neutral-900 border border-neutral-800/80 shadow-md hover:border-amber-500/50 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
    >
      {/* Aspect Ratio Container */}
      <div className="relative aspect-square w-full overflow-hidden bg-neutral-950/60">
        {/* Skeleton Placeholder while loading */}
        {!isLoaded && !hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-900 animate-pulse">
            <div className="h-6 w-6 rounded-full border-2 border-neutral-700 border-t-amber-500 animate-spin" />
          </div>
        )}

        {/* Broken image fallback */}
        {hasError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center text-neutral-500">
            <ImageOff className="w-8 h-8 mb-1 text-neutral-600" />
            <span className="text-[11px] truncate max-w-full">{photo.name}</span>
            <span className="text-[9px] text-neutral-600 mt-0.5">Corrupted / Unreadable</span>
          </div>
        ) : (
          <img
            src={photo.url}
            alt={photo.name}
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
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
          <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-bold tracking-wider uppercase text-neutral-300 border border-white/10 shadow-sm">
            {photo.extension}
          </span>

          <button
            type="button"
            onClick={onToggleFavorite}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            className={`pointer-events-auto p-1.5 rounded-full transition-transform active:scale-90 shadow-md ${
              isFavorite
                ? 'bg-rose-500/90 text-white'
                : 'bg-black/60 backdrop-blur-md text-neutral-300 hover:text-rose-400 hover:bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-white' : ''}`} />
          </button>
        </div>

        {/* Bottom Metadata Overlay */}
        <div
          className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 pt-6 text-left transition-opacity duration-200 ${
            showMetadataOverlay ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          <div className="flex items-center justify-between gap-1">
            <p className="text-xs font-semibold text-white truncate max-w-[80%]" title={photo.name}>
              {photo.name}
            </p>
            <Maximize2 className="w-3.5 h-3.5 text-neutral-400 group-hover:text-amber-300 transition-colors shrink-0" />
          </div>

          <div className="mt-1 flex items-center justify-between text-[10px] text-neutral-400">
            {photo.folder && photo.folder !== 'Root' ? (
              <span className="flex items-center gap-1 truncate text-amber-300/90 font-medium">
                <Folder className="w-2.5 h-2.5" />
                <span className="truncate">{photo.folder}</span>
              </span>
            ) : (
              <span>{formatBytes(photo.size)}</span>
            )}
            <span>{formatBytes(photo.size)}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
