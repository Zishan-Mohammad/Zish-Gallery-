import React from 'react';
import { Search, X, Heart, ArrowUpDown, Image as ImageIcon, Video } from 'lucide-react';
import { FilterExtension, SortOption } from '../types';

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
  totalFilteredCount,
  totalOriginalCount,
}) => {
  return (
    <div className="w-full space-y-3 bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-3 sm:p-4 backdrop-blur-md">
      {/* Search Input Row & Sort selector */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            id="input-search-media"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search photos and videos by filename..."
            className="w-full rounded-xl bg-neutral-950/80 border border-neutral-700/80 pl-9 pr-9 py-2.5 text-sm text-neutral-100 placeholder-neutral-500 focus:border-amber-500/80 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              id="btn-clear-search"
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white p-1 rounded-md"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sort Selector */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-950/80 border border-neutral-700/80 text-xs text-neutral-300">
            <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline text-neutral-400">Sort:</span>
            <select
              id="select-sort-media"
              value={sortOption}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              className="bg-transparent text-xs text-neutral-200 focus:outline-none cursor-pointer pr-1"
            >
              <option value="name-asc">Filename A → Z</option>
              <option value="name-desc">Filename Z → A</option>
              <option value="date-newest">Newest First</option>
              <option value="date-oldest">Oldest First</option>
              <option value="size-desc">Largest Size</option>
            </select>
          </div>

          {/* Favorites Filter Toggle */}
          <button
            type="button"
            id="btn-filter-favorites"
            onClick={onToggleFavoritesOnly}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              showFavoritesOnly
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm'
                : 'bg-neutral-950/80 hover:bg-neutral-800 text-neutral-400 border-neutral-700/80'
            }`}
            title="Filter by Favorites"
          >
            <Heart className={`w-3.5 h-3.5 ${showFavoritesOnly ? 'fill-rose-400 text-rose-400' : ''}`} />
            <span>Favorites</span>
            {favoriteCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-rose-500/30 text-[10px] text-rose-200">
                {favoriteCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pt-1 pb-0.5 no-scrollbar">
        <div className="flex items-center gap-1.5">
          {EXTENSION_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => onFilterChange(f.value)}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeFilter === f.value
                  ? 'bg-amber-500 text-neutral-950 shadow-sm'
                  : 'bg-neutral-950/60 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/80 border border-neutral-800'
              }`}
            >
              {f.icon}
              <span>{f.label}</span>
            </button>
          ))}
        </div>

        {/* Counter Info */}
        <div className="text-[11px] text-neutral-400 shrink-0 font-mono">
          {totalFilteredCount} of {totalOriginalCount} items
        </div>
      </div>
    </div>
  );
};
