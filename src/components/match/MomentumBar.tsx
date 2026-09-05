import React from 'react';
import { Club } from '../../types/game';

interface MomentumBarProps {
  homeClub: Club;
  awayClub: Club;
  momentum: number; // -100 to +100
  homePossessionPct: number;
  homeShots: number;
  awayShots: number;
  homeShotsOnTarget: number;
  awayShotsOnTarget: number;
  homeXg: number;
  awayXg: number;
}

export default function MomentumBar({
  homeClub,
  awayClub,
  momentum,
  homePossessionPct,
  homeShots,
  awayShots,
  homeShotsOnTarget,
  awayShotsOnTarget,
  homeXg,
  awayXg,
}: MomentumBarProps) {
  const awayPossessionPct = 100 - homePossessionPct;

  // Normalize momentum (-100 to +100) to percentage width from center
  const absMomentum = Math.abs(momentum);
  const isHomeDominant = momentum >= 0;

  return (
    <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 space-y-3.5">
      {/* Top Stat Pills */}
      <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs">
        {/* Possession */}
        <div className="p-2 rounded bg-zinc-950/60 border border-white/[0.04]">
          <span className="text-[10px] text-zinc-500 uppercase block mb-0.5">Possession</span>
          <div className="flex items-center justify-center gap-1.5 font-bold tabular-nums">
            <span className="text-emerald-400">{homePossessionPct}%</span>
            <span className="text-zinc-600 font-normal">-</span>
            <span className="text-zinc-300">{awayPossessionPct}%</span>
          </div>
        </div>

        {/* Total Shots (On Target) */}
        <div className="p-2 rounded bg-zinc-950/60 border border-white/[0.04]">
          <span className="text-[10px] text-zinc-500 uppercase block mb-0.5">Shots (Target)</span>
          <div className="flex items-center justify-center gap-1.5 font-bold tabular-nums">
            <span className="text-zinc-200">
              {homeShots} <span className="text-xs text-zinc-500 font-normal">({homeShotsOnTarget})</span>
            </span>
            <span className="text-zinc-600 font-normal">-</span>
            <span className="text-zinc-200">
              {awayShots} <span className="text-xs text-zinc-500 font-normal">({awayShotsOnTarget})</span>
            </span>
          </div>
        </div>

        {/* Expected Goals (xG) */}
        <div className="p-2 rounded bg-zinc-950/60 border border-white/[0.04]">
          <span className="text-[10px] text-zinc-500 uppercase block mb-0.5">Expected Goals (xG)</span>
          <div className="flex items-center justify-center gap-1.5 font-bold tabular-nums">
            <span className="text-emerald-400">{homeXg.toFixed(2)}</span>
            <span className="text-zinc-600 font-normal">-</span>
            <span className="text-rose-400">{awayXg.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Bi-directional Sector Dominance Momentum Gauge */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
          <span className="flex items-center gap-1">
            <span className="font-semibold text-zinc-200">{homeClub.shortName}</span> Dominance
          </span>
          <span className="text-zinc-500 text-[10px]">Sector Tug-of-War</span>
          <span className="flex items-center gap-1">
            <span className="font-semibold text-zinc-200">{awayClub.shortName}</span> Dominance
          </span>
        </div>

        {/* Bi-directional Gauge Bar */}
        <div className="relative w-full h-2.5 bg-zinc-950 rounded-full overflow-hidden border border-white/[0.08] flex">
          {/* Left half (Home) */}
          <div className="w-1/2 h-full flex justify-end">
            {isHomeDominant && (
              <div
                className="h-full bg-emerald-500 rounded-l-full transition-all duration-300"
                style={{ width: `${Math.min(100, absMomentum)}%` }}
              />
            )}
          </div>

          {/* Center Divider Tick */}
          <div className="w-0.5 h-full bg-zinc-600 z-10" />

          {/* Right half (Away) */}
          <div className="w-1/2 h-full flex justify-start">
            {!isHomeDominant && (
              <div
                className="h-full bg-rose-500 rounded-r-full transition-all duration-300"
                style={{ width: `${Math.min(100, absMomentum)}%` }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
