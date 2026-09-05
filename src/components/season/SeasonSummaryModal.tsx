import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { Trophy, ArrowUpRight, ArrowDownRight, AlertTriangle, ShieldCheck, Play, X, Calendar, Sparkles } from 'lucide-react';

export default function SeasonSummaryModal() {
  const isSeasonSummaryOpen = useGameStore(state => state.isSeasonSummaryOpen);
  const closeSeasonSummaryModal = useGameStore(state => state.closeSeasonSummaryModal);
  const latestAuditReport = useGameStore(state => state.latestAuditReport);
  const latestTransitionReport = useGameStore(state => state.latestTransitionReport);
  const executeSeasonRollover = useGameStore(state => state.executeSeasonRollover);
  const userClub = useGameStore(state => state.getUserClub());
  const competitions = useGameStore(state => state.competitions);

  if (!isSeasonSummaryOpen) return null;

  // Derive league champion from primary competition
  const primaryComp = Object.values(competitions).find(c => c.tier === 1) || Object.values(competitions)[0];
  const sortedTable = primaryComp?.table ? [...primaryComp.table].sort((a, b) => b.points - a.points) : [];
  const championId = sortedTable[0]?.clubId;
  const isUserChampion = championId === userClub?.id;

  const handleStartNextSeason = () => {
    executeSeasonRollover();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-zinc-800 bg-zinc-900/40">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-zinc-100 tracking-tight">
                  Season 2026/27 Official Concluding Dossier
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 font-semibold">
                  FISCAL YEAR-END
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Promotion, relegation, dynamic potential adjustments, and FFP fiscal compliance review
              </p>
            </div>
          </div>
          <button
            onClick={closeSeasonSummaryModal}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {/* Championship Banner */}
          <div
            className={`p-6 rounded-xl border flex items-center justify-between ${
              isUserChampion
                ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
                : 'bg-zinc-900/40 border-zinc-800 text-zinc-200'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <Trophy className="w-7 h-7" />
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase text-amber-400/80 font-bold">
                  {primaryComp?.name || 'Domestic League'} Champions
                </div>
                <h3 className="text-lg font-bold text-zinc-100">
                  {isUserChampion ? `${userClub?.name} (Champions!)` : (sortedTable[0]?.clubId ? `${sortedTable[0].clubId.toUpperCase()} (Champions)` : 'FC Barcelona')}
                </h3>
                <div className="text-xs text-zinc-400 mt-0.5 font-mono">
                  Final Points: <span className="text-zinc-200 font-bold">{sortedTable[0]?.points || 92} pts</span> • Goal Diff: +{sortedTable[0]?.goalDifference || 54}
                </div>
              </div>
            </div>
            {isUserChampion && (
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                SILVERWARE SECURED
              </span>
            )}
          </div>

          {/* FFP Audit Card */}
          {latestAuditReport && (
            <div className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {latestAuditReport.status === 'COMPLIANT' ? (
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-rose-400" />
                  )}
                  <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-300 font-bold">
                    Annual UEFA FFP Fiscal Audit • 70% Squad Cost Ratio
                  </h4>
                </div>
                <span
                  className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                    latestAuditReport.status === 'COMPLIANT'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : latestAuditReport.status === 'WARNING'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  }`}
                >
                  {latestAuditReport.status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800/80">
                  <span className="text-zinc-500 text-[10px] uppercase font-mono block">Squad Cost Ratio</span>
                  <span
                    className={`font-mono text-sm font-bold ${
                      latestAuditReport.squadCostRatio <= 0.70 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {(latestAuditReport.squadCostRatio * 100).toFixed(1)}% / 70% Limit
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800/80">
                  <span className="text-zinc-500 text-[10px] uppercase font-mono block">Wages + Amortization</span>
                  <span className="font-mono text-sm font-bold text-zinc-200">
                    ${(latestAuditReport.totalSquadCost / 1000000).toFixed(1)}M
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800/80">
                  <span className="text-zinc-500 text-[10px] uppercase font-mono block">Operating Revenue</span>
                  <span className="font-mono text-sm font-bold text-zinc-200">
                    ${(latestAuditReport.annualRevenue / 1000000).toFixed(1)}M
                  </span>
                </div>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed bg-zinc-950/60 p-3 rounded-lg border border-zinc-800/60">
                {latestAuditReport.penaltyDetail}
              </p>
            </div>
          )}

          {/* Transition Report: Promoted / Relegated / Aging if available */}
          {latestTransitionReport ? (
            <div className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-3">
              <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Rollover Recalibration Summary
              </h4>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/60">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-semibold mb-1">
                    <ArrowUpRight className="w-4 h-4" />
                    Promoted Clubs
                  </div>
                  <div className="space-y-1 text-zinc-300">
                    {latestTransitionReport.promotedClubs.map(c => (
                      <div key={c.clubId} className="flex justify-between">
                        <span>{c.clubName}</span>
                        <span className="text-zinc-500 font-mono text-[11px]">{c.toLeague}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/60">
                  <div className="flex items-center gap-1.5 text-rose-400 font-semibold mb-1">
                    <ArrowDownRight className="w-4 h-4" />
                    Relegated Clubs
                  </div>
                  <div className="space-y-1 text-zinc-300">
                    {latestTransitionReport.relegatedClubs.map(c => (
                      <div key={c.clubId} className="flex justify-between">
                        <span>{c.clubName}</span>
                        <span className="text-zinc-500 font-mono text-[11px]">{c.toLeague}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-zinc-400 pt-2 border-t border-zinc-800/60">
                <span>Players Aged (+1y): <span className="font-mono text-zinc-200 font-semibold">{latestTransitionReport.playersAgedCount}</span></span>
                <span>Dynamic Potential Recalibrated: <span className="font-mono text-emerald-400 font-semibold">{latestTransitionReport.playersPotentialAdjustedCount}</span></span>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-zinc-900/20 border border-zinc-800/60 text-xs text-zinc-400 flex items-center gap-3">
              <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>
                Commencing the next season will automatically trigger European Promotion & Relegation swaps, dynamic potential updates for prospects under 24, aging decline for players 29+, and seed fresh 2027/28 fixture schedules.
              </span>
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div className="px-8 py-4 border-t border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
          <button
            onClick={closeSeasonSummaryModal}
            className="px-4 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            Review Standings Later
          </button>
          <button
            onClick={handleStartNextSeason}
            className="px-6 py-2.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all"
          >
            <Play className="w-4 h-4 fill-white" />
            Begin Next Season (2027/28)
          </button>
        </div>
      </div>
    </div>
  );
}
