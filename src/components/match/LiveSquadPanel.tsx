import React, { useState } from 'react';
import { InGamePlayerState } from '../../engine/matchTypes';
import { ArrowRightLeft, AlertCircle, X } from 'lucide-react';
import SafePlayerPhoto from '../common/SafePlayerPhoto';

interface LiveSquadPanelProps {
  lineup: InGamePlayerState[];
  bench: InGamePlayerState[];
  subsRemaining: number;
  onSubstitute: (playerOutId: string, playerInId: string) => void;
}

export default function LiveSquadPanel({
  lineup,
  bench,
  subsRemaining,
  onSubstitute,
}: LiveSquadPanelProps) {
  const [selectedSubOutId, setSelectedSubOutId] = useState<string | null>(null);

  const selectedSubOutPlayer = lineup.find(p => p.player.id === selectedSubOutId);

  const handleSubIn = (playerInId: string) => {
    if (selectedSubOutId) {
      onSubstitute(selectedSubOutId, playerInId);
      setSelectedSubOutId(null);
    }
  };

  const renderStaminaMiniRing = (stamina: number) => {
    const radius = 9;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (stamina / 100) * circumference;
    const isHigh = stamina >= 70;
    const isMed = stamina >= 50 && stamina < 70;

    return (
      <div className="relative w-5 h-5 flex items-center justify-center flex-shrink-0">
        <svg className="w-5 h-5 transform -rotate-90">
          <circle
            cx="10"
            cy="10"
            r={radius}
            stroke="currentColor"
            strokeWidth="2"
            fill="transparent"
            className="text-zinc-800"
          />
          <circle
            cx="10"
            cy="10"
            r={radius}
            stroke="currentColor"
            strokeWidth="2"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={isHigh ? 'text-emerald-400' : isMed ? 'text-amber-400' : 'text-rose-400'}
          />
        </svg>
      </div>
    );
  };

  return (
    <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-white/[0.06] text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-zinc-200">First Team Lineup</span>
          <span className="text-zinc-500">•</span>
          <span className="text-zinc-400">11 Starters</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px]">
          <span className="text-zinc-500">Subs Left:</span>
          <span className={`font-bold ${subsRemaining > 0 ? 'text-emerald-400' : 'text-zinc-500'}`}>
            {subsRemaining}/5
          </span>
        </div>
      </div>

      {/* Grid of Starters */}
      <div className="space-y-1.5">
        {lineup.map((pState) => {
          const p = pState.player;
          const isSelected = selectedSubOutId === p.id;
          return (
            <div
              key={p.id}
              className={`p-2 rounded-lg border transition-all flex items-center justify-between gap-2 text-xs font-mono ${
                isSelected
                  ? 'bg-zinc-800 border-emerald-500/60 ring-1 ring-emerald-500/30'
                  : 'bg-zinc-950/60 border-white/[0.04] hover:border-white/[0.12] hover:bg-zinc-950/90'
              }`}
            >
              {/* Player Pos & Name */}
              <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                <SafePlayerPhoto name={p.name} src={p.photoUrl} className="w-5 h-5 rounded-full text-[8px] shrink-0" />
                <span className="w-8 text-center text-[10px] font-bold px-1 py-0.5 rounded bg-zinc-800 text-zinc-300 flex-shrink-0">
                  {p.primaryPosition}
                </span>
                <span className="font-medium text-zinc-200 truncate">
                  {p.name}
                </span>

                {/* Status Icons */}
                {pState.goals > 0 && (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1 rounded flex-shrink-0">
                    ⚽ {pState.goals}
                  </span>
                )}
                {pState.assists > 0 && (
                  <span className="text-[10px] font-bold text-sky-400 bg-sky-500/10 px-1 rounded flex-shrink-0">
                    🅰 {pState.assists}
                  </span>
                )}
                {pState.yellowCard && !pState.redCard && (
                  <span className="w-2.5 h-3.5 bg-amber-400 rounded-sm flex-shrink-0" title="Yellow Card" />
                )}
                {pState.redCard && (
                  <span className="w-2.5 h-3.5 bg-rose-500 rounded-sm flex-shrink-0" title="Red Card" />
                )}
                {pState.injured && (
                  <span className="text-rose-400 flex-shrink-0" title="Injured">
                    <AlertCircle className="w-3 h-3" />
                  </span>
                )}
              </div>

              {/* Stamina & Match Rating */}
              <div className="flex items-center gap-3 flex-shrink-0">
                {/* Stamina */}
                <div className="flex items-center gap-1" title={`Stamina: ${Math.round(pState.currentStamina)}%`}>
                  {renderStaminaMiniRing(pState.currentStamina)}
                  <span className="text-[11px] text-zinc-400 w-7 tabular-nums text-right">
                    {Math.round(pState.currentStamina)}%
                  </span>
                </div>

                {/* Match Rating */}
                <div className="w-7 text-right">
                  <span className={`text-xs font-bold tabular-nums ${
                    pState.matchRating >= 7.5 ? 'text-emerald-400' : pState.matchRating >= 6.5 ? 'text-zinc-200' : 'text-rose-400'
                  }`}>
                    {pState.matchRating.toFixed(1)}
                  </span>
                </div>

                {/* Sub Button */}
                {subsRemaining > 0 && !pState.redCard && (
                  <button
                    onClick={() => setSelectedSubOutId(isSelected ? null : p.id)}
                    className={`p-1 rounded transition-colors ${
                      isSelected 
                        ? 'bg-emerald-500/20 text-emerald-400' 
                        : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
                    }`}
                    title="Substitute player"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bench Substitution Overlay Drawer */}
      {selectedSubOutPlayer && (
        <div className="mt-3 p-3 bg-zinc-950 border border-emerald-500/30 rounded-xl space-y-2.5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-xs font-mono pb-1.5 border-b border-zinc-800">
            <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
              <ArrowRightLeft className="w-3 h-3" />
              Replace {selectedSubOutPlayer.player.name}
            </span>
            <button
              onClick={() => setSelectedSubOutId(null)}
              className="text-zinc-400 hover:text-zinc-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="max-h-40 overflow-y-auto space-y-1 font-mono text-xs">
            {bench.length === 0 ? (
              <p className="text-zinc-500 text-xs italic py-2">No bench players available.</p>
            ) : (
              bench.map((bState) => (
                <div
                  key={bState.player.id}
                  className="p-1.5 rounded bg-zinc-900/60 border border-white/[0.04] flex items-center justify-between gap-2 hover:bg-zinc-900 transition-colors"
                >
                  <div className="flex items-center gap-2 truncate">
                    <SafePlayerPhoto name={bState.player.name} src={bState.player.photoUrl} className="w-5 h-5 rounded-full text-[8px] shrink-0" />
                    <span className="w-7 text-center text-[10px] font-bold px-1 py-0.5 rounded bg-zinc-800 text-zinc-300">
                      {bState.player.primaryPosition}
                    </span>
                    <span className="text-zinc-200 truncate">{bState.player.name}</span>
                    <span className="text-[10px] text-zinc-500">OVR {bState.player.overallRating}</span>
                  </div>

                  <button
                    onClick={() => handleSubIn(bState.player.id)}
                    className="px-2 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold transition-colors whitespace-nowrap"
                  >
                    Sub In
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
