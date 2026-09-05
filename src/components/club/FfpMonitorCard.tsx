import React from 'react';
import { AlertTriangle, CheckCircle, ShieldCheck } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';

export default function FfpMonitorCard() {
  const club = useGameStore(state => state.clubs[state.userClubId]);
  const players = useGameStore(state => state.players);
  const userClubId = useGameStore(state => state.userClubId);

  if (!club) return null;

  const squad = Object.values(players).filter(p => p.clubId === userClubId);
  const totalWagesAnnual = squad.reduce((acc, p) => acc + (p.wagePerWeek * 52), 0);
  const totalAmortization = squad.reduce((acc, p) => acc + (p.amortizationAnnualCost || 0), 0);
  const totalSquadCost = totalWagesAnnual + totalAmortization;

  const revenue = club.finances.annualOperatingRevenue || 290_000_000;
  
  // Calculate precise ratio
  const rawRatio = (totalSquadCost / revenue) * 100;
  const squadCostRatio = Number(rawRatio.toFixed(1));

  const isSafe = squadCostRatio <= 70.0;
  const isCritical = squadCostRatio > 80.0;

  const squadCostMillions = (totalSquadCost / 1e6).toFixed(1);
  const revenueMillions = (revenue / 1e6).toFixed(1);

  return (
    <div className="hairline-card p-5 bg-zinc-900/40 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/[0.05]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-zinc-400">Financial Fair Play (FFP) Monitor</span>
            <span className="text-zinc-600">•</span>
            <span className="text-xs font-mono text-emerald-400">UEFA & LaLiga Cost Control</span>
          </div>
          <h3 className="text-sm sm:text-base font-semibold text-zinc-100 tracking-tight mt-0.5">
            70% Squad Cost Ratio Compliance
          </h3>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className={`px-2.5 py-1 rounded border flex items-center gap-1.5 font-medium ${
            isSafe
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : isCritical
              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
          }`}>
            {isSafe ? <ShieldCheck className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
            {isSafe ? 'SAFE & COMPLIANT' : isCritical ? 'SEVERE EMBARGO RISK' : 'WARNING THRESHOLD'}
          </span>
        </div>
      </div>

      {/* Main Ratio Metric Display */}
      <div className="flex items-baseline justify-between font-mono">
        <div className="space-y-0.5">
          <span className="text-xs text-zinc-400">Annual Squad Cost / Operating Revenue</span>
          <div className="text-lg sm:text-xl font-bold text-zinc-100 tabular-nums">
            ${squadCostMillions}M <span className="text-zinc-500 font-normal">/</span> ${revenueMillions}M
            <span className={`ml-2 text-sm sm:text-base ${isSafe ? 'text-emerald-400' : 'text-rose-400'}`}>
              ({squadCostRatio}% — {isSafe ? 'SAFE & COMPLIANT' : 'NON-COMPLIANT'})
            </span>
          </div>
        </div>

        <div className="text-right hidden sm:block">
          <span className="text-[10px] text-zinc-500 uppercase block">Statutory Ceiling</span>
          <span className="text-sm font-semibold text-zinc-300">70.0% Max</span>
        </div>
      </div>

      {/* Visual Gauge Bar with Markers */}
      <div className="space-y-1.5 pt-1">
        <div className="relative w-full h-3 bg-zinc-950 rounded-full overflow-hidden border border-white/[0.08]">
          {/* Progress Bar Fill */}
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              isSafe ? 'bg-emerald-500' : isCritical ? 'bg-rose-500' : 'bg-amber-500'
            }`}
            style={{ width: `${Math.min(100, squadCostRatio)}%` }}
          />

          {/* 70% Limit Line Marker */}
          <div 
            className="absolute top-0 bottom-0 w-[2px] bg-amber-400 z-10"
            style={{ left: '70%' }}
            title="70% Legal Limit"
          />

          {/* 80% Critical Penalty Line Marker */}
          <div 
            className="absolute top-0 bottom-0 w-[2px] bg-rose-500 z-10"
            style={{ left: '80%' }}
            title="80% Deduction Point"
          />
        </div>

        {/* Marker Labels */}
        <div className="relative w-full text-[10px] font-mono text-zinc-500 pt-1 flex justify-between">
          <span>0%</span>
          <span className="absolute" style={{ left: '70%', transform: 'translateX(-50%)' }}>
            ▲ 70% Cap
          </span>
          <span className="absolute text-rose-400/80" style={{ left: '80%', transform: 'translateX(-50%)' }}>
            ▲ 80% Penalty
          </span>
          <span>100%</span>
        </div>
      </div>

      {/* Breakdown Details & Explanatory Subtext */}
      <div className="pt-2 border-t border-white/[0.04] grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
        <div className="space-y-1 text-zinc-400">
          <div className="flex justify-between">
            <span>Annual Squad Wages:</span>
            <span className="text-zinc-200">${(totalWagesAnnual / 1e6).toFixed(1)}M / yr</span>
          </div>
          <div className="flex justify-between">
            <span>Annual Amortization:</span>
            <span className="text-zinc-200">${(totalAmortization / 1e6).toFixed(1)}M / yr</span>
          </div>
        </div>

        <div className="text-[11px] text-zinc-400 bg-zinc-950/70 p-2.5 rounded border border-white/[0.04] flex items-center">
          <p className="leading-relaxed">
            <span className="text-zinc-300 font-medium">Regulatory Framework:</span> Breaching 70% results in an immediate transfer embargo. Breaching 80% incurs an automatic 6-point league deduction.
          </p>
        </div>
      </div>
    </div>
  );
}
