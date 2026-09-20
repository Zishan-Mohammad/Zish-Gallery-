import React from 'react';
import { Search, X, Heart, SlidersHorizontal, ArrowUpDown, Folder } from 'lucide-react';
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
  availableFolders: string[];
  selectedFolderFilter: string | null;
  onFolderFilterChange: (folder: string | null) => void;
  totalFilteredCount: number;
  totalOriginalCount: number;
}

const EXTENSION_FILTERS: FilterExtension[] = ['ALL', 'JPG', 'PNG', 'WEBP', 'GIF', 'AVIF'];

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
  availableFolders,
  selectedFolderFilter,
  onFolderFilterChange,
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
            id="input-search-photos"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by filename or folder (e.g. birthday, Vacation)..."
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

        {/* Sort dropdown */}
        <div className="flex items-center gap-2">
          <div className="relative inline-flex items-center">
            <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400 absolute left-3 pointer-events-none" />
            <select
              id="select-sort-photos"
              value={sortOption}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              className="rounded-xl bg-neutral-950/80 border border-neutral-700/80 pl-8 pr-8 py-2.5 text-xs sm:text-sm text-neutral-200 focus:border-amber-500 focus:outline-none cursor-pointer appearance-none"
            >
              <option value="name-asc">Filename A → Z</option>
              <option value="name-desc">Filename Z → A</option>
              <option value="date-newest">Newest First</option>
              <option value="date-oldest">Oldest First</option>
              <option value="size-desc">Largest Size</option>
            </select>
          </div>

          {/* Favorites toggle */}
          <button
            type="button"
            id="btn-filter-favorites"
            onClick={onToggleFavoritesOnly}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              showFavoritesOnly
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm shadow-rose-500/10'
                : 'bg-neutral-950/80 text-neutral-400 border-neutral-700/80 hover:text-neutral-200'
            }`}
            title="Filter favorite photos"
          >
            <Heart
              className={`w-4 h-4 ${
                showFavoritesOnly ? 'fill-rose-400 text-rose-400' : 'text-neutral-400'
              }`}
            />
            <span>Favorites</span>
            {favoriteCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-neutral-800 text-[10px] text-neutral-300">
                {favoriteCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Filter Row: Extension pills and Subfolder pills */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-neutral-800/60">
        {/* Extension filter pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-medium text-neutral-400 mr-1 flex items-center gap-1">
            <SlidersHorizontal className="w-3 h-3" />
            <span>Format:</span>
          </span>
          {EXTENSION_FILTERS.map((ext) => (
            <button
              key={ext}
              type="button"
              onClick={() => onFilterChange(ext)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeFilter === ext
                  ? 'bg-amber-500 text-neutral-950 font-bold shadow-sm'
                  : 'bg-neutral-950/60 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
              }`}
            >
              {ext}
            </button>
          ))}
        </div>

        {/* Counts display */}
        <div className="text-xs text-neutral-400">
          Showing <span className="font-semibold text-white">{totalFilteredCount}</span> of{' '}
          <span className="text-neutral-300">{totalOriginalCount}</span> photos
        </div>
      </div>

      {/* Optional Subfolder Category Pills if subfolders are present */}
      {availableFolders.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] font-medium text-neutral-400 flex items-center gap-1 shrink-0">
            <Folder className="w-3 h-3" />
            <span>Folder:</span>
          </span>
          <button
            type="button"
            onClick={() => onFolderFilterChange(null)}
            className={`px-2.5 py-0.8 rounded-lg text-[11px] shrink-0 font-medium transition-colors cursor-pointer ${
              selectedFolderFilter === null
                ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                : 'bg-neutral-950/60 text-neutral-400 hover:bg-neutral-800'
            }`}
          >
            All Folders
          </button>
          {availableFolders.map((folder) => (
            <button
              key={folder}
              type="button"
              onClick={() => onFolderFilterChange(folder)}
              className={`px-2.5 py-0.8 rounded-lg text-[11px] shrink-0 font-medium transition-colors cursor-pointer ${
                selectedFolderFilter === folder
                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                  : 'bg-neutral-950/60 text-neutral-400 hover:bg-neutral-800'
              }`}
            >
              {folder}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
