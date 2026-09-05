import React, { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { Calendar, FastForward, ShieldAlert, X } from 'lucide-react';
import { InterruptPreferences } from '../../types/game';

export default function JumpToDateModal() {
  const jumpDateModalOpen = useGameStore(state => state.jumpDateModalOpen);
  const setJumpDateModalOpen = useGameStore(state => state.setJumpDateModalOpen);
  const currentDate = useGameStore(state => state.currentDate);
  const startSimulation = useGameStore(state => state.startSimulation);
  const interruptPreferences = useGameStore(state => state.interruptPreferences);
  const setInterruptPreferences = useGameStore(state => state.setInterruptPreferences);

  // Default target date: 7 days ahead or preset
  const [selectedTarget, setSelectedTarget] = useState('2026-09-01');
  const [localPrefs, setLocalPrefs] = useState<InterruptPreferences>({
    pauseOnMatchday: interruptPreferences.pauseOnMatchday,
    pauseOnBids: interruptPreferences.pauseOnBids,
    pauseOnInjuries: interruptPreferences.pauseOnInjuries,
  });

  if (!jumpDateModalOpen) return null;

  const presets = [
    { label: 'End of Summer Window', date: '2026-09-01' },
    { label: 'Winter Break', date: '2027-01-01' },
    { label: 'End of Season', date: '2027-05-25' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTarget || selectedTarget <= currentDate) {
      return;
    }
    setInterruptPreferences(localPrefs);
    setJumpDateModalOpen(false);
    startSimulation(selectedTarget);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-zinc-950 border border-zinc-800 shadow-2xl rounded-xl max-w-md w-full p-5 relative space-y-4 text-zinc-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FastForward className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-100 tracking-tight">
                Jump to Date
              </h3>
              <p className="text-[11px] font-mono text-zinc-400">
                Non-blocking multi-day calendar fast-forward
              </p>
            </div>
          </div>
          <button
            onClick={() => setJumpDateModalOpen(false)}
            className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 rounded hover:bg-zinc-900 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Quick Presets */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-2">
              Quick Target Presets
            </label>
            <div className="grid grid-cols-3 gap-2">
              {presets.map(p => (
                <button
                  key={p.date}
                  type="button"
                  onClick={() => setSelectedTarget(p.date)}
                  className={`px-2.5 py-2 rounded text-[11px] font-mono border text-center transition-all cursor-pointer ${
                    selectedTarget === p.date
                      ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300 font-medium'
                      : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                  }`}
                >
                  <span className="block truncate font-sans text-xs">{p.label}</span>
                  <span className="text-[10px] text-zinc-500 mt-0.5 block">{p.date}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Date Input */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
              Custom Calendar Target
            </label>
            <div className="relative">
              <input
                type="date"
                min={currentDate}
                max="2027-05-31"
                value={selectedTarget}
                onChange={e => setSelectedTarget(e.target.value)}
                className="w-full bg-zinc-900/90 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-emerald-500/60 transition-colors"
                required
              />
              <Calendar className="w-4 h-4 text-zinc-500 absolute right-3 top-2.5 pointer-events-none" />
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 mt-1">
              <span>Current: {currentDate}</span>
              <span>Max: 2027-05-31</span>
            </div>
          </div>

          {/* Interrupt Preferences Matrix */}
          <div className="pt-2 border-t border-zinc-800/80 space-y-2.5">
            <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-zinc-400">
              <ShieldAlert className="w-3.5 h-3.5 text-zinc-500" />
              <span>Hard-Stop Interrupt Matrix</span>
            </div>

            <div className="space-y-2 bg-zinc-900/40 p-3 rounded-lg border border-zinc-800/60 text-xs">
              <label className="flex items-center gap-2.5 text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localPrefs.pauseOnMatchday}
                  onChange={e => setLocalPrefs(prev => ({ ...prev, pauseOnMatchday: e.target.checked }))}
                  className="rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-0 w-3.5 h-3.5"
                />
                <span className="font-mono text-[11px]">Halt on scheduled user matchdays</span>
              </label>

              <label className="flex items-center gap-2.5 text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localPrefs.pauseOnBids}
                  onChange={e => setLocalPrefs(prev => ({ ...prev, pauseOnBids: e.target.checked }))}
                  className="rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-0 w-3.5 h-3.5"
                />
                <span className="font-mono text-[11px]">Halt on incoming transfer bids</span>
              </label>

              <label className="flex items-center gap-2.5 text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localPrefs.pauseOnInjuries}
                  onChange={e => setLocalPrefs(prev => ({ ...prev, pauseOnInjuries: e.target.checked }))}
                  className="rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-0 w-3.5 h-3.5"
                />
                <span className="font-mono text-[11px]">Halt on major starter injuries (≥14 days)</span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800/80">
            <button
              type="button"
              onClick={() => setJumpDateModalOpen(false)}
              className="px-3 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-400 hover:text-zinc-200 transition-colors font-mono cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedTarget || selectedTarget <= currentDate}
              className="px-4 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-white transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <FastForward className="w-3.5 h-3.5 fill-current" />
              <span>Start Fast Simulation</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
