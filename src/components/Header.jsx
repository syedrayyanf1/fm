import React, { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { Save } from 'lucide-react';
import SaveLoadPanel from './common/SaveLoadPanel';

export default function Header() {
  const [isSaveLoadOpen, setIsSaveLoadOpen] = useState(false);
  const currentDate = useGameStore(state => state.currentDate);
  const isMatchModalOpen = useGameStore(state => state.isMatchModalOpen);
  const club = useGameStore(state => state.clubs[state.userClubId]);
  const finances = club?.finances || {
    transferBudget: 45000000,
    wageBudgetWeekly: 1200000,
    allocatedFeePercentage: 60,
  };
  const boardTrust = club?.boardTrust ?? 84;


  // Format YYYY-MM-DD to DD MMM YYYY
  const formatDate = (isoStr) => {
    if (!isoStr) return '';
    if (isoStr.includes('Aug') || isoStr.includes('Sep')) return isoStr;
    const parts = isoStr.split('-');
    if (parts.length !== 3) return isoStr;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = parseInt(parts[2], 10);
    const month = months[parseInt(parts[1], 10) - 1] || parts[1];
    const year = parts[0];
    return `${day} ${month} ${year}`;
  };

  const formattedDate = formatDate(currentDate);
  const leagueDisplay = club?.leagueId === 'laliga' ? 'LaLiga' : (club?.leagueId || 'LaLiga');

  return (
    <header className="border-b border-white/[0.06] bg-zinc-950/90 backdrop-blur-md sticky top-0 z-40 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        
        {/* Left: Subtle Club Mark & Club Name */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/[0.08] flex items-center justify-center p-1 relative overflow-hidden">
            <div className="w-full h-full flex flex-col justify-between">
              <div className="flex justify-between w-full">
                <span className="w-1.5 h-1.5 bg-rose-500/80 rounded-full"></span>
                <span className="w-1.5 h-1.5 bg-amber-400/80 rounded-full"></span>
              </div>
              <div className="text-[10px] font-mono font-bold text-zinc-300 leading-none text-center">
                {club?.shortName?.toUpperCase().slice(0, 3) || 'FCB'}
              </div>
              <div className="w-full h-0.5 bg-emerald-500/60 rounded"></div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold text-zinc-100 tracking-tight leading-none">
                {club?.name || 'FC Barcelona'}
              </h1>
              <span className="text-[11px] font-mono text-zinc-500 hidden sm:inline uppercase">
                {leagueDisplay}
              </span>
            </div>
          </div>
        </div>

        {/* Center / Right: Date & Discreet Financial Status Ticker */}
        <div className="flex items-center gap-4 sm:gap-6 text-xs">
          
          {/* Match In Progress Indicator */}
          {isMatchModalOpen && (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[11px] font-semibold animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>Match In Progress</span>
            </div>
          )}

          {/* Current Date */}
          <div className="flex items-center gap-2 text-zinc-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-mono text-zinc-300 text-xs font-medium">
              {formattedDate}
            </span>
          </div>

          <div className="h-3.5 w-px bg-white/[0.08] hidden sm:block"></div>

          {/* Discreet Financial Status Ticker */}
          <div className="flex items-center gap-3 font-mono text-xs text-zinc-400">
            <span>
              <strong className="text-zinc-200 font-medium">${(finances.transferBudget / 1e6).toFixed(0)}M</strong> Transfer
            </span>
            <span className="text-zinc-600">|</span>
            <span>
              <strong className="text-zinc-200 font-medium">${(finances.wageBudgetWeekly / 1e6).toFixed(2)}M/wk</strong> Wage
            </span>
            <span className="text-zinc-600">|</span>
            <span>
              <strong className="text-zinc-200 font-medium">{boardTrust}%</strong> Board Trust
            </span>
          </div>

          <div className="h-3.5 w-px bg-white/[0.08] hidden sm:block"></div>

          {/* Trophy Cabinet & Manager Ledger Button */}
          <button
            onClick={() => useGameStore.getState().openTrophyCabinet()}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-500/40 text-zinc-300 hover:text-amber-300 transition-all font-mono text-xs shadow-sm"
            title="Open Trophy Cabinet & Manager Profile"
          >
            <span className="text-amber-400">🏆</span>
            <span className="hidden md:inline font-sans text-xs font-medium">Cabinet</span>
          </button>

          {/* Save & Load Career Button */}
          <button
            onClick={() => setIsSaveLoadOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-500/40 text-zinc-300 hover:text-amber-300 transition-all font-mono text-xs shadow-sm"
            title="Save / Load Career Progress"
          >
            <Save className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline font-sans text-xs font-medium">Save</span>
          </button>

        </div>

      </div>

      <SaveLoadPanel isOpen={isSaveLoadOpen} onClose={() => setIsSaveLoadOpen(false)} />
    </header>
  );
}

