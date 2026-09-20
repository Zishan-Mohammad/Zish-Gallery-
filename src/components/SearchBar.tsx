import React from 'react';
import { Search, X, Heart, ArrowUpDown, Image as ImageIcon, Video, Grid3X3, Grid2X2, Square } from 'lucide-react';
import { FilterExtension, SortOption, GridDensity } from '../types';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeFilter: FilterExtension;
  onFilterChange: (f: FilterExtension) => void;
  showFavoritesOnly: boolean;
  onToggleFavoritesOnly: () => void;
  favoriteCount: number;
  sortOption: SortOption;
  onSortChange: (s: SortOption) => void;
  density: GridDensity;
  onDensityChange: (d: GridDensity) => void;
  totalFilteredCount: number;
  totalOriginalCount: number;
}

const EXTENSION_FILTERS: { label: string; value: FilterExtension; icon?: React.ReactNode }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Photos', value: 'PHOTOS', icon: <ImageIcon className="w-3 h-3" /> },
  { label: 'Videos', value: 'VIDEOS', icon: <Video className="w-3 h-3" /> },
  { label: 'MP4', value: 'MP4' },
  { label: 'WebM', value: 'WEBM' },
  { label: 'JPG', value: 'JPG' },
  { label: 'PNG', value: 'PNG' },
  { label: 'WEBP', value: 'WEBP' },
];

export const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  showFavoritesOnly,
  onToggleFavoritesOnly,
  favoriteCount,
  sortOption,
  onSortChange,
  density,
  onDensityChange,
  totalFilteredCount,
  totalOriginalCount,
}) => {
  return (
    <div className="w-full space-y-2.5 sm:space-y-3 bg-neutral-900/70 border border-neutral-800/90 rounded-2xl p-2.5 sm:p-4 backdrop-blur-md shadow-sm">
      {/* Search Input Row & Mobile-Optimized Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 sm:gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
          <input
            id="input-search-media"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search photos & videos..."
            className="w-full rounded-xl bg-neutral-950/85 border border-neutral-700/80 pl-9 pr-9 py-2.5 text-sm text-neutral-100 placeholder-neutral-500 focus:border-amber-500/80 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all min-h-[42px]"
          />
          {searchQuery && (
            <button
              type="button"
              id="btn-clear-search"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white p-1.5 rounded-lg active:scale-90"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Secondary controls row: Sort, Density & Favorites */}
        <div className="flex items-center justify-between sm:justify-start gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar">
          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-neutral-950/85 border border-neutral-700/80 text-xs text-neutral-300 min-h-[40px] shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <select
              id="select-sort-media"
              value={sortOption}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              className="bg-transparent text-xs text-neutral-200 focus:outline-none cursor-pointer pr-1"
            >
              <option value="name-asc" className="bg-neutral-900 text-white">Name A→Z</option>
              <option value="name-desc" className="bg-neutral-900 text-white">Name Z→A</option>
              <option value="date-newest" className="bg-neutral-900 text-white">Newest First</option>
              <option value="date-oldest" className="bg-neutral-900 text-white">Oldest First</option>
              <option value="size-desc" className="bg-neutral-900 text-white">Largest Size</option>
            </select>
          </div>

          {/* Grid Density Switcher (1-Col Feed, 2-Col Regular, 3-Col Dense) */}
          <div className="flex items-center p-0.5 rounded-xl bg-neutral-950/85 border border-neutral-700/80 shrink-0 min-h-[40px]">
            <button
              type="button"
              onClick={() => onDensityChange('large')}
              className={`p-2 rounded-lg transition-all ${
                density === 'large'
                  ? 'bg-amber-500 text-neutral-950 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="1 Column (Feed view)"
              aria-label="1 column view"
            >
              <Square className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onDensityChange('comfortable')}
              className={`p-2 rounded-lg transition-all ${
                density === 'comfortable'
                  ? 'bg-amber-500 text-neutral-950 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="2 Columns (Standard grid)"
              aria-label="2 columns view"
            >
              <Grid2X2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onDensityChange('compact')}
              className={`p-2 rounded-lg transition-all ${
                density === 'compact'
                  ? 'bg-amber-500 text-neutral-950 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="3+ Columns (Compact view)"
              aria-label="3 columns view"
            >
              <Grid3X3 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Favorites Filter Toggle */}
          <button
            type="button"
            id="btn-filter-favorites"
            onClick={onToggleFavoritesOnly}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer min-h-[40px] shrink-0 active:scale-95 ${
              showFavoritesOnly
                ? 'bg-rose-500/25 text-rose-300 border-rose-500/50 shadow-sm'
                : 'bg-neutral-950/85 hover:bg-neutral-800 text-neutral-400 border-neutral-700/80'
            }`}
            title="Filter by Favorites"
          >
            <Heart className={`w-3.5 h-3.5 ${showFavoritesOnly ? 'fill-rose-400 text-rose-400' : ''}`} />
            <span className="hidden sm:inline">Favorites</span>
            {favoriteCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500/30 text-[10px] text-rose-200">
                {favoriteCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Filter Chips Bar (Touch-Optimized Horizontal Scroll) */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pt-1 pb-0.5 no-scrollbar touch-pan-x">
        <div className="flex items-center gap-1 sm:gap-1.5">
          {EXTENSION_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => onFilterChange(f.value)}
              className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap min-h-[32px] ${
                activeFilter === f.value
                  ? 'bg-amber-500 text-neutral-950 font-bold shadow-sm'
                  : 'bg-neutral-950/70 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/80 border border-neutral-800/90'
              }`}
            >
              {f.icon}
              <span>{f.label}</span>
            </button>
          ))}
        </div>

        {/* Counter Info */}
        <div className="text-[11px] text-neutral-400 shrink-0 font-mono pl-2">
          {totalFilteredCount} <span className="hidden sm:inline">of {totalOriginalCount}</span>
        </div>
      </div>
    </div>
  );
};
