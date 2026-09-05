import React, { useState } from 'react';
import { X, ShieldAlert, Zap, Award, Activity, CheckCircle2, ArrowRight } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import { Position } from '../../types/game';
import SafePlayerPhoto from '../common/SafePlayerPhoto';

const ALL_POSITIONS: Position[] = [
  'GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LM', 'RM', 'LW', 'RW', 'ST'
];

export default function PlayerDetailDrawer() {
  const selectedPlayerId = useGameStore(state => state.selectedPlayerId);
  const setSelectedPlayerId = useGameStore(state => state.setSelectedPlayerId);
  const players = useGameStore(state => state.players);
  const startRetrainingPosition = useGameStore(state => state.startRetrainingPosition);

  const player = selectedPlayerId ? players[selectedPlayerId] : null;

  const [selectedTargetPos, setSelectedTargetPos] = useState<Position>('RW');

  if (!player) return null;

  // Qualitative traits helpers
  const getClutchTag = (val: number) => {
    if (val >= 18) return 'Ice in Veins';
    if (val >= 15) return 'Big Match Weapon';
    if (val >= 12) return 'Composed';
    return 'Pressure Sensitive';
  };

  const getConsistencyTag = (val: number) => {
    if (val >= 18) return 'Clockwork Precision';
    if (val >= 15) return 'Reliable Machine';
    if (val >= 12) return 'Steady';
    return 'Volatile Form';
  };

  const getAdaptabilityTag = (val: number) => {
    if (val >= 18) return 'Instant Integration';
    if (val >= 15) return 'Rapid Settlement';
    if (val >= 12) return 'Adaptable';
    return 'Slow Acclimatizer';
  };

  const settlementPct = Math.round((player.settlementProgress ?? 0.9) * 100);
  const effectiveCapacity = (90 + (settlementPct * 0.1)).toFixed(1);

  // Pillar tracks
  const pillars = [
    { label: 'ATTACKING', code: 'ATT', value: player.attributes.attacking },
    { label: 'CREATIVE', code: 'CRE', value: player.attributes.creative },
    { label: 'DEFENDING', code: 'DEF', value: player.attributes.defending },
    { label: 'PHYSICAL', code: 'PHY', value: player.attributes.physical },
    { label: 'MENTAL', code: 'MEN', value: player.attributes.mental },
  ];

  const handleStartRetraining = () => {
    if (selectedTargetPos && selectedTargetPos !== player.primaryPosition) {
      startRetrainingPosition(player.id, selectedTargetPos);
    }
  };

  return (
    <>
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-200"
        onClick={() => setSelectedPlayerId(null)}
      />

      {/* Slide-out Drawer Panel */}
      <aside 
        className="fixed top-0 right-0 h-full w-full sm:w-[480px] bg-zinc-950 border-l border-zinc-800/80 z-50 p-6 overflow-y-auto space-y-6 shadow-2xl animate-in slide-in-from-right duration-200"
        role="dialog"
        aria-label="Player Detail Inspector"
      >
        {/* 1. Header */}
        <div className="flex items-start justify-between pb-4 border-b border-zinc-800/80">
          <div className="flex items-center gap-3.5">
            {/* Cutout / Avatar */}
            <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 border border-zinc-800">
              <SafePlayerPhoto
                src={player.photoUrl}
                name={player.name}
                className="w-14 h-14 rounded-lg object-cover"
              />
              <div className="absolute bottom-0 inset-x-0 bg-zinc-950/80 backdrop-blur-xs py-0.5 text-center text-[9px] font-mono text-zinc-300">
                #{player.shirtNumber || '10'}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-zinc-100 tracking-tight">
                  {player.fullName || player.name}
                </h3>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {player.primaryPosition}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 mt-1">
                <span>{player.age} yrs</span>
                <span>•</span>
                <span>{player.nationality}</span>
                <span>•</span>
                <span className="text-zinc-500">{player.role || 'Squad Member'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Rating Badges */}
            <div className="text-right">
              <div className="flex items-center gap-1.5 justify-end">
                <span className="text-[10px] font-mono text-zinc-500">OVR</span>
                <span className="text-xl font-mono font-bold text-emerald-400 tabular-nums">
                  {player.overallRating}
                </span>
              </div>
              <div className="text-[10px] font-mono text-zinc-400">
                POT: <span className="text-zinc-200">{player.overallRating}–{player.dynamicPotential}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedPlayerId(null)}
              className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 transition-colors border border-transparent hover:border-zinc-700/50"
              title="Close inspection"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mutiny / Strike Warning Banner */}
        {player.isOnStrike ? (
          <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-center gap-2.5 animate-pulse">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <div>
              <span className="font-bold block">FULL STRIKE (STAGE 3)</span>
              <span>Player is refusing to train. Inactive from matchday selection.</span>
            </div>
          </div>
        ) : player.unsettledStage && player.unsettledStage > 0 ? (
          <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs font-mono flex items-center gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <span className="font-bold block">UNSETTLED SQUAD STATUS (STAGE {player.unsettledStage})</span>
              <span>Player has expressed desire to leave following blocked transfer talks.</span>
            </div>
          </div>
        ) : null}

        {/* 2. 5 Macro Pillars (Horizontal Progress Tracks) */}
        <section className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-zinc-400 uppercase tracking-wider text-[11px]">Macro Pillar Profile</span>
            <span className="font-mono text-[11px] text-zinc-500">Scale 1–99</span>
          </div>

          <div className="space-y-2.5 bg-zinc-900/40 p-3.5 rounded-lg border border-zinc-800/60">
            {pillars.map(p => (
              <div key={p.code} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-400 text-[11px]">{p.label} ({p.code})</span>
                  <span className="font-semibold text-zinc-200 tabular-nums">{p.value}</span>
                </div>
                <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden border border-white/[0.04]">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(5, p.value))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Hidden Character Traits Grid (2x2 Grid) */}
        <section className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-zinc-400 uppercase tracking-wider text-[11px]">Psychological & Character Traits</span>
            <span className="font-mono text-[11px] text-zinc-500">Scout Unmasked</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* Clutch */}
            <div className="p-2.5 rounded-md bg-zinc-900/40 border border-zinc-800/60 space-y-1">
              <div className="text-[10px] font-mono text-zinc-500 uppercase">Clutch Rating</div>
              <div className="font-mono text-sm font-semibold text-zinc-200 tabular-nums">
                {player.traits.clutch}/20
              </div>
              <div className="text-[11px] text-emerald-400/90 truncate font-medium">
                {getClutchTag(player.traits.clutch)}
              </div>
            </div>

            {/* Consistency */}
            <div className="p-2.5 rounded-md bg-zinc-900/40 border border-zinc-800/60 space-y-1">
              <div className="text-[10px] font-mono text-zinc-500 uppercase">Consistency</div>
              <div className="font-mono text-sm font-semibold text-zinc-200 tabular-nums">
                {player.traits.consistency}/20
              </div>
              <div className="text-[11px] text-zinc-300 truncate font-medium">
                {getConsistencyTag(player.traits.consistency)}
              </div>
            </div>

            {/* Adaptability */}
            <div className="p-2.5 rounded-md bg-zinc-900/40 border border-zinc-800/60 space-y-1">
              <div className="text-[10px] font-mono text-zinc-500 uppercase">Adaptability</div>
              <div className="font-mono text-sm font-semibold text-zinc-200 tabular-nums">
                {player.traits.adaptability}/20
              </div>
              <div className="text-[11px] text-zinc-300 truncate font-medium">
                {getAdaptabilityTag(player.traits.adaptability)}
              </div>
            </div>

            {/* Work Rate & Injury */}
            <div className="p-2.5 rounded-md bg-zinc-900/40 border border-zinc-800/60 space-y-1">
              <div className="text-[10px] font-mono text-zinc-500 uppercase">Work Rate & Resilience</div>
              <div className="flex items-center gap-1.5 pt-0.5">
                <span className={`px-1.5 py-0.2 rounded font-mono text-[10px] font-semibold ${
                  player.traits.workRate === 'HIGH' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-zinc-800 text-zinc-300'
                }`}>
                  {player.traits.workRate} WR
                </span>
                <span className={`px-1.5 py-0.2 rounded font-mono text-[10px] font-semibold ${
                  player.traits.injuryProneness === 'LOW' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                  player.traits.injuryProneness === 'FRAGILE' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-zinc-800 text-zinc-300'
                }`}>
                  {player.traits.injuryProneness} INJ
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Transfer Settlement Meter */}
        <section className="space-y-2 p-3.5 rounded-lg bg-zinc-900/40 border border-zinc-800/60">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-400 text-[11px]">Transfer Settlement</span>
            <span className="text-emerald-400 font-semibold tabular-nums">Settled: {settlementPct}%</span>
          </div>

          <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden border border-white/[0.04]">
            <div 
              className="bg-emerald-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${settlementPct}%` }}
            />
          </div>

          <p className="text-[11px] text-zinc-500 italic pt-0.5">
            Effective match rating operates at {effectiveCapacity}% of nominal capacity.
          </p>
        </section>

        {/* 5. Positional Versatility & Retraining Matrix */}
        <section className="space-y-3 p-3.5 rounded-lg bg-zinc-900/40 border border-zinc-800/60">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-zinc-400 uppercase tracking-wider text-[11px]">Versatility & Retraining</span>
            <span className="text-zinc-500 text-[11px] font-mono">Tactical Flexibility</span>
          </div>

          {/* Positional Badges */}
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded bg-zinc-950/60 border border-zinc-800/50">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span className="font-mono font-medium text-zinc-200">{player.primaryPosition}</span>
                <span className="text-[11px] text-zinc-400">Primary Natural</span>
              </div>
              <span className="font-mono text-emerald-400 text-[11px]">100% (0% Penalty)</span>
            </div>

            {player.secondaryPositions && player.secondaryPositions.length > 0 && (
              <div className="flex items-center justify-between p-2 rounded bg-zinc-950/60 border border-zinc-800/50">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-zinc-400"></span>
                  <span className="font-mono font-medium text-zinc-300">{player.secondaryPositions.join(', ')}</span>
                  <span className="text-[11px] text-zinc-400">Accomplished</span>
                </div>
                <span className="font-mono text-zinc-300 text-[11px]">97% (-3% Penalty)</span>
              </div>
            )}
          </div>

          {/* Retraining Program Status / Launcher */}
          {player.isRetraining ? (
            <div className="p-3 rounded bg-zinc-950/80 border border-emerald-500/30 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 animate-pulse" />
                  Retraining to {player.targetPosition}
                </span>
                <span className="text-zinc-300 font-semibold">{player.retrainingProgress || 35}%</span>
              </div>
              <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${player.retrainingProgress || 35}%` }}
                />
              </div>
              <div className="text-[11px] text-zinc-500 font-mono">
                Estimated {Math.ceil((100 - (player.retrainingProgress || 35)) / 15)} weeks remaining
              </div>
            </div>
          ) : (
            <div className="pt-2 border-t border-zinc-800/60 space-y-2">
              <div className="text-[11px] font-mono text-zinc-400">Retrain to New Position</div>
              <div className="flex items-center gap-2">
                <select
                  value={selectedTargetPos}
                  onChange={(e) => setSelectedTargetPos(e.target.value as Position)}
                  className="bg-zinc-900 border border-zinc-700/60 rounded px-2.5 py-1.5 text-xs font-mono text-zinc-200 flex-1 focus:outline-none focus:border-emerald-500"
                >
                  {ALL_POSITIONS.filter(pos => pos !== player.primaryPosition).map(pos => (
                    <option key={pos} value={pos}>
                      {pos} {player.secondaryPositions?.includes(pos) ? '(Accomplished)' : ''}
                    </option>
                  ))}
                </select>

                <button
                  onClick={handleStartRetraining}
                  className="px-3 py-1.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-medium transition-colors whitespace-nowrap"
                >
                  Start Program
                </button>
              </div>
            </div>
          )}
        </section>

        {/* 6. Contract & Financial Footprint */}
        <section className="space-y-2.5 p-3.5 rounded-lg bg-zinc-900/40 border border-zinc-800/60">
          <div className="flex items-center justify-between text-xs pb-1 border-b border-zinc-800/60">
            <span className="font-mono text-zinc-400 uppercase tracking-wider text-[11px]">Financial Footprint</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-zinc-800 text-zinc-300">
              {player.squadRole === 'STAR' ? 'STAR PLAYER' : player.squadRole}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
            <div>
              <span className="text-[10px] text-zinc-500 block uppercase">Weekly Wage</span>
              <span className="font-semibold text-zinc-200">
                ${player.wagePerWeek.toLocaleString()} / wk
              </span>
            </div>

            <div>
              <span className="text-[10px] text-zinc-500 block uppercase">Contract Expiry</span>
              <span className="font-semibold text-zinc-200">
                {player.contractYearsLeft} Years Left
              </span>
            </div>

            <div>
              <span className="text-[10px] text-zinc-500 block uppercase">Release Clause</span>
              <span className="font-semibold text-zinc-200">
                {player.releaseClause ? `$${(player.releaseClause / 1e6).toFixed(1)}M` : 'None'}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-zinc-500 block uppercase">Annual Amortization</span>
              <span className="font-semibold text-zinc-200">
                {player.amortizationAnnualCost > 0 
                  ? `$${(player.amortizationAnnualCost / 1e6).toFixed(1)}M / yr` 
                  : '$0.0M / yr'}
              </span>
            </div>
          </div>
        </section>
      </aside>
    </>
  );
}
