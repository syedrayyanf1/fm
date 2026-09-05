import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { Pause, Square } from 'lucide-react';

export default function SimulationProgressHUD() {
  const isSimulating = useGameStore(state => state.isSimulating);
  const currentDate = useGameStore(state => state.currentDate);
  const simulationTargetDate = useGameStore(state => state.simulationTargetDate);
  const simulationProgress = useGameStore(state => state.simulationProgress);
  const pauseSimulation = useGameStore(state => state.pauseSimulation);

  if (!isSimulating) return null;

  // Format YYYY-MM-DD to "12 AUG 2026"
  const formatMonospaceDate = (isoStr: string | null) => {
    if (!isoStr) return '---';
    const parts = isoStr.split('-');
    if (parts.length !== 3) return isoStr;
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const day = parts[2].padStart(2, '0');
    const month = months[parseInt(parts[1], 10) - 1] || parts[1];
    const year = parts[0];
    return `${day} ${month} ${year}`;
  };

  const currentDisplay = formatMonospaceDate(currentDate);
  const targetDisplay = formatMonospaceDate(simulationTargetDate);

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
      <div className="bg-zinc-950/95 border border-zinc-800/90 shadow-2xl backdrop-blur-md rounded-lg px-4 py-2.5 flex items-center gap-4 text-xs font-mono text-zinc-200">
        
        {/* Pulsing Emerald Indicator */}
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
            Simulating
          </span>
        </div>

        <div className="h-3.5 w-px bg-zinc-800"></div>

        {/* Rolling Date Display */}
        <div className="flex items-center gap-2 text-zinc-300 font-mono tracking-tight text-xs">
          <span className="text-zinc-100 font-medium tabular-nums">{currentDisplay}</span>
          <span className="text-zinc-600">──►</span>
          <span className="text-zinc-400 tabular-nums">{targetDisplay}</span>
        </div>

        <div className="h-3.5 w-px bg-zinc-800"></div>

        {/* 2px Emerald Progress Track */}
        <div className="flex items-center gap-2.5">
          <div className="w-24 sm:w-32 bg-zinc-800/80 rounded-full h-1 overflow-hidden relative">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-75"
              style={{ width: `${Math.min(100, Math.max(0, simulationProgress))}%` }}
            ></div>
          </div>
          <span className="text-[11px] tabular-nums text-zinc-400 w-8 text-right">
            {Math.round(simulationProgress)}%
          </span>
        </div>

        <div className="h-3.5 w-px bg-zinc-800"></div>

        {/* Control Button: [ Pause / Cancel ] */}
        <button
          onClick={pauseSimulation}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-300 hover:text-white transition-colors text-[11px] font-mono cursor-pointer"
          title="Pause execution immediately on the current day"
        >
          <Pause className="w-3 h-3 text-amber-400 fill-amber-400" />
          <span>Pause</span>
        </button>
      </div>
    </div>
  );
}
