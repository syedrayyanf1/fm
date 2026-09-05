import React from 'react';
import { ShieldCheck, Trophy, Flame, DollarSign, Star, CheckCircle2, Clock } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';

export default function BoardObjectivesCard() {
  const club = useGameStore(state => state.clubs[state.userClubId]);

  if (!club) return null;

  const trust = club.boardTrust;
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (trust / 100) * circumference;

  const objectives = [
    {
      id: 'obj-league',
      category: 'Primary League',
      title: 'Finish in UEFA Champions League Spots (Top 4)',
      status: 'Matchday 0/38',
      type: 'LEAGUE',
      statusType: 'in_progress',
      icon: Trophy,
      weight: '40% Sacking Weight',
    },
    {
      id: 'obj-rivalry',
      category: 'Rivalry Revenge',
      title: 'Restore Pride: Avoid defeat against Real Madrid',
      status: '0/2 Matches Played',
      type: 'RIVALRY',
      statusType: 'in_progress',
      icon: Flame,
      weight: '20% Sacking Weight',
    },
    {
      id: 'obj-finance',
      category: 'Financial Rebuild',
      title: 'Maintain Squad Cost Ratio below 70%',
      status: `${club.finances.squadCostRatio}% (Compliant)`,
      type: 'FINANCIAL',
      statusType: 'compliant',
      icon: DollarSign,
      weight: '20% Sacking Weight',
    },
    {
      id: 'obj-ucl',
      category: 'Holy Grail (Aspirational)',
      title: 'The European Dream: Reach UCL Semi-Finals',
      status: 'Pending draw',
      type: 'HOLY_GRAIL',
      statusType: 'pending',
      icon: Star,
      weight: '20% Sacking Weight',
    },
  ];

  return (
    <div className="hairline-card p-5 bg-zinc-900/40 space-y-5">
      {/* Header & Board Trust Meter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-zinc-400">Boardroom Governance</span>
            <span className="text-zinc-600">•</span>
            <span className="text-xs text-emerald-400 font-mono">Season 2026/27</span>
          </div>
          <h2 className="text-base sm:text-lg font-semibold text-zinc-100 tracking-tight mt-0.5">
            Executive Mandate & Season Objectives
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Failure to satisfy key performance metrics triggers an immediate emergency vote of confidence.
          </p>
        </div>

        {/* Board Trust Radial Gauge */}
        <div className="flex items-center gap-3.5 bg-zinc-950/80 p-3 rounded-lg border border-white/[0.06] flex-shrink-0">
          <div className="relative w-16 h-16 flex items-center justify-center">
            <svg className="w-16 h-16 transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r={radius}
                stroke="currentColor"
                strokeWidth="4"
                fill="transparent"
                className="text-zinc-800"
              />
              <circle
                cx="32"
                cy="32"
                r={radius}
                stroke="currentColor"
                strokeWidth="4"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="text-emerald-400 transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-sm font-mono font-bold text-zinc-100 tabular-nums">
                {trust}%
              </span>
            </div>
          </div>

          <div>
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">
              Confidence Index
            </span>
            <div className="text-xs font-mono font-semibold text-emerald-400 flex items-center gap-1 mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              {trust >= 80 ? 'Solid Support' : trust >= 60 ? 'Guarded' : 'Critical Threat'}
            </div>
            <span className="text-[10px] text-zinc-500 block mt-0.5 font-mono">
              Sacking threshold: &lt;45%
            </span>
          </div>
        </div>
      </div>

      {/* Dynamic Board Objectives Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {objectives.map((obj) => {
          const IconComponent = obj.icon;
          const isCompliant = obj.statusType === 'compliant';
          const isPending = obj.statusType === 'pending';

          return (
            <div
              key={obj.id}
              className="p-3.5 rounded-lg bg-zinc-950/60 border border-white/[0.05] hover:border-white/[0.1] transition-all flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400">
                    <IconComponent className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{obj.category}</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500">
                    {obj.weight}
                  </span>
                </div>

                <h4 className="text-xs font-medium text-zinc-200 leading-snug">
                  {obj.title}
                </h4>
              </div>

              <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between">
                <span className="text-[11px] font-mono text-zinc-400">Status</span>
                <span
                  className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded flex items-center gap-1 ${
                    isCompliant
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : isPending
                      ? 'bg-zinc-800 text-zinc-400 border border-zinc-700/40'
                      : 'bg-zinc-900 text-zinc-300 border border-zinc-800'
                  }`}
                >
                  {isCompliant ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  ) : isPending ? (
                    <Clock className="w-3 h-3 text-zinc-400" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/80 animate-pulse" />
                  )}
                  {obj.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
