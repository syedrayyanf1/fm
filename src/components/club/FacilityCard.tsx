import React from 'react';
import { LucideIcon, CheckCircle, ArrowUpCircle } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import { ClubFacilities } from '../../types/game';

interface FacilityCardProps {
  name: string;
  facilityKey: keyof ClubFacilities;
  level: number;
  maxLevel?: number;
  stats?: string[];
  perk: string;
  upgradeActionLabel: string;
  icon: LucideIcon;
}

const COST_TABLE: Record<number, number> = {
  1: 4,
  2: 8,
  3: 16,
  4: 32,
};

export default function FacilityCard({
  name,
  facilityKey,
  level,
  maxLevel = 5,
  stats,
  perk,
  upgradeActionLabel,
  icon: Icon,
}: FacilityCardProps) {
  const upgradeFacility = useGameStore(state => state.upgradeFacility);
  const club = useGameStore(state => state.clubs[state.userClubId]);

  const isMaxTier = level >= maxLevel;
  const nextCost = COST_TABLE[level] || 16;
  const canAfford = club ? club.finances.balance >= nextCost * 1_000_000 : false;

  const handleUpgrade = () => {
    if (!isMaxTier) {
      upgradeFacility(facilityKey);
    }
  };

  return (
    <div className="hairline-card p-4 bg-zinc-950/70 border border-white/[0.06] hover:border-white/[0.12] transition-all flex flex-col justify-between space-y-4">
      <div className="space-y-3">
        {/* Header with Icon & Level Pips */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-zinc-900 border border-white/[0.06] flex items-center justify-center text-zinc-300">
              <Icon className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-zinc-100 tracking-tight">
                {name}
              </h4>
              <div className="flex items-center gap-1.5 mt-0.5">
                {/* Visual Level Pips [■][■][■][ ][ ] */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: maxLevel }).map((_, i) => (
                    <span
                      key={i}
                      className={`w-2.5 h-1.5 rounded-sm transition-colors ${
                        i < level
                          ? 'bg-emerald-400 shadow-sm shadow-emerald-400/20'
                          : 'bg-zinc-800'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[11px] font-mono text-zinc-400 ml-1">
                  Level {level}/{maxLevel} {isMaxTier ? '(World Class)' : ''}
                </span>
              </div>
            </div>
          </div>

          {isMaxTier && (
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              MAX TIER
            </span>
          )}
        </div>

        {/* Stats Row */}
        {stats && stats.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {stats.map((st, idx) => (
              <span
                key={idx}
                className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900/80 border border-white/[0.04] text-zinc-300"
              >
                {st}
              </span>
            ))}
          </div>
        )}

        {/* Operational Perk */}
        <div className="p-2.5 rounded bg-zinc-900/40 border border-white/[0.03]">
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block mb-0.5">
            Operational Perk
          </span>
          <p className="text-xs text-zinc-300 leading-relaxed italic">
            {perk}
          </p>
        </div>
      </div>

      {/* Upgrade Action Footer */}
      <div className="pt-2 border-t border-white/[0.04]">
        {isMaxTier ? (
          <div className="w-full py-2 text-center text-xs font-mono text-emerald-400/90 font-medium flex items-center justify-center gap-1.5 bg-emerald-500/5 rounded border border-emerald-500/10">
            <CheckCircle className="w-3.5 h-3.5" />
            Elite Global Standard
          </div>
        ) : (
          <button
            onClick={handleUpgrade}
            className={`w-full py-2 px-3 rounded-lg text-xs font-mono font-medium transition-all flex items-center justify-center gap-1.5 ${
              canAfford
                ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-100 border border-white/[0.1] hover:border-emerald-500/40 hover:text-emerald-400'
                : 'bg-zinc-900/40 text-zinc-500 border border-zinc-800 cursor-not-allowed'
            }`}
          >
            <ArrowUpCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>{upgradeActionLabel} — ${nextCost}.0M</span>
          </button>
        )}
      </div>
    </div>
  );
}
