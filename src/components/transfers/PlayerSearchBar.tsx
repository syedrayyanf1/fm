import React from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';

export interface SearchFilters {
  query: string;
  positionCategory: 'ALL' | 'GK' | 'DEF' | 'MID' | 'ATT';
  leagueId: string;
  maxAge: number;
  minAge: number;
  maxValue: number; // in millions
  sortBy: 'ovr' | 'value' | 'wage' | 'age';
  sortOrder: 'asc' | 'desc';
}

interface PlayerSearchBarProps {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
  competitions: Record<string, { id: string; name: string }>;
  totalCount: number;
  filteredCount: number;
}

export default function PlayerSearchBar({
  filters,
  onChange,
  competitions,
  totalCount,
  filteredCount,
}: PlayerSearchBarProps) {
  const updateFilter = <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
    onChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onChange({
      query: '',
      positionCategory: 'ALL',
      leagueId: 'ALL',
      minAge: 16,
      maxAge: 40,
      maxValue: 200,
      sortBy: 'ovr',
      sortOrder: 'desc',
    });
  };

  const isFiltered =
    filters.query !== '' ||
    filters.positionCategory !== 'ALL' ||
    filters.leagueId !== 'ALL' ||
    filters.maxAge !== 40 ||
    filters.minAge !== 16 ||
    filters.maxValue !== 200;

  return (
    <div className="bg-zinc-900/90 border border-zinc-800/80 rounded-xl p-4 shadow-xl backdrop-blur-md space-y-3">
      {/* Top Search Input + Quick Stats */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search 5,000+ players by name, nationality or club..."
            value={filters.query}
            onChange={e => updateFilter('query', e.target.value)}
            className="w-full bg-zinc-950/80 border border-zinc-800/80 rounded-lg pl-9 pr-8 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition font-mono"
          />
          {filters.query && (
            <button
              onClick={() => updateFilter('query', '')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto text-xs text-zinc-400 font-mono">
          <span className="tabular-nums px-2 py-1 bg-zinc-800/50 rounded border border-zinc-700/40">
            {filteredCount.toLocaleString()} / {totalCount.toLocaleString()}
          </span>
          {isFiltered && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-amber-400 hover:text-amber-300 underline underline-offset-2 px-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Position Filter Pills */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-zinc-800/50">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['ALL', 'GK', 'DEF', 'MID', 'ATT'] as const).map(pos => (
            <button
              key={pos}
              onClick={() => updateFilter('positionCategory', pos)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition font-mono ${
                filters.positionCategory === pos
                  ? 'bg-amber-500 text-zinc-950 shadow-sm'
                  : 'bg-zinc-800/60 text-zinc-300 hover:bg-zinc-800 border border-zinc-700/40'
              }`}
            >
              {pos}
            </button>
          ))}
        </div>

        {/* League Selector */}
        <div className="flex items-center gap-2 text-xs">
          <label className="text-zinc-500 font-mono">League:</label>
          <select
            value={filters.leagueId}
            onChange={e => updateFilter('leagueId', e.target.value)}
            className="bg-zinc-950/80 border border-zinc-800/80 rounded-md px-2.5 py-1 text-xs text-zinc-200 focus:outline-none focus:border-amber-500/50 font-mono"
          >
            <option value="ALL">All Leagues (10)</option>
            {Object.values(competitions).map(comp => (
              <option key={comp.id} value={comp.id}>
                {comp.name}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Selector */}
        <div className="flex items-center gap-2 text-xs">
          <label className="text-zinc-500 font-mono">Sort:</label>
          <select
            value={`${filters.sortBy}-${filters.sortOrder}`}
            onChange={e => {
              const [by, order] = e.target.value.split('-') as [SearchFilters['sortBy'], SearchFilters['sortOrder']];
              onChange({ ...filters, sortBy: by, sortOrder: order });
            }}
            className="bg-zinc-950/80 border border-zinc-800/80 rounded-md px-2.5 py-1 text-xs text-zinc-200 focus:outline-none focus:border-amber-500/50 font-mono"
          >
            <option value="ovr-desc">OVR (Highest)</option>
            <option value="ovr-asc">OVR (Lowest)</option>
            <option value="value-desc">Value (Highest)</option>
            <option value="value-asc">Value (Lowest)</option>
            <option value="wage-desc">Wage (Highest)</option>
            <option value="age-asc">Age (Youngest)</option>
            <option value="age-desc">Age (Oldest)</option>
          </select>
        </div>
      </div>

      {/* Sliders for Age and Max Valuation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-zinc-400 font-mono">
        <div className="flex items-center gap-2">
          <span className="w-20 text-zinc-500">Max Age:</span>
          <input
            type="range"
            min="18"
            max="40"
            value={filters.maxAge}
            onChange={e => updateFilter('maxAge', Number(e.target.value))}
            className="flex-1 accent-amber-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
          />
          <span className="w-10 text-right tabular-nums text-zinc-200">{filters.maxAge} yrs</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-24 text-zinc-500">Max Value:</span>
          <input
            type="range"
            min="5"
            max="200"
            step="5"
            value={filters.maxValue}
            onChange={e => updateFilter('maxValue', Number(e.target.value))}
            className="flex-1 accent-amber-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
          />
          <span className="w-12 text-right tabular-nums text-zinc-200">€{filters.maxValue}M</span>
        </div>
      </div>
    </div>
  );
}
