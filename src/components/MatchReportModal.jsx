import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { ArrowRight } from 'lucide-react';

export default function MatchReportModal() {
  const simModalOpen = useGameStore(state => state.simModalOpen);
  const setSimModalOpen = useGameStore(state => state.setSimModalOpen);
  const simReport = useGameStore(state => state.simReport);

  if (!simModalOpen || !simReport) return null;

  const { homeClubName, awayClubName, barcaGoals, oppGoals, scorers, attendance, xG } = simReport;
  const isHome = homeClubName === 'FC Barcelona';


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="hairline-card-elevated max-w-md w-full p-5 bg-zinc-900 border border-white/[0.08] relative space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="text-xs font-mono text-zinc-300">Match Concluded</span>
          </div>
          <button
            onClick={() => setSimModalOpen(false)}
            className="text-zinc-500 hover:text-zinc-300 text-xs"
          >
            ✕
          </button>
        </div>

        {/* Score Card */}
        <div className="p-4 rounded-lg bg-zinc-950/80 border border-white/[0.04] text-center space-y-2">
          <div className="text-[11px] font-mono text-zinc-500 uppercase">
            LaLiga EA Sports • {fixture?.date || 'August 2026'}
          </div>

          <div className="flex items-center justify-center gap-6 py-2">
            <div className="text-right flex-1">
              <div className="text-sm font-semibold text-zinc-100">{homeClubName}</div>
              <div className="text-[10px] font-mono text-zinc-500">{isHome ? 'Home' : 'Away'}</div>
            </div>

            <div className="font-mono text-2xl font-semibold text-white px-3 py-1 rounded bg-zinc-900 border border-white/[0.08]">
              {barcaGoals} – {oppGoals}
            </div>

            <div className="text-left flex-1">
              <div className="text-sm font-semibold text-zinc-100">{awayClubName}</div>
              <div className="text-[10px] font-mono text-zinc-500">{isHome ? 'Away' : 'Home'}</div>
            </div>
          </div>


          {scorers.length > 0 && (
            <div className="border-t border-white/[0.04] pt-2 text-xs font-mono text-zinc-400">
              <span className="text-zinc-500">Scorers: </span>
              {scorers.join(', ')}
            </div>
          )}
        </div>

        {/* Telemetry Metrics */}
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="p-2.5 rounded bg-zinc-950/40 border border-white/[0.04]">
            <span className="text-[10px] text-zinc-500 block uppercase">Expected Goals</span>
            <strong className="text-emerald-400 text-xs mt-0.5 block">{xG}</strong>
          </div>
          <div className="p-2.5 rounded bg-zinc-950/40 border border-white/[0.04]">
            <span className="text-[10px] text-zinc-500 block uppercase">Attendance</span>
            <strong className="text-zinc-300 text-xs mt-0.5 block">{attendance}</strong>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-1">
          <button
            onClick={() => setSimModalOpen(false)}
            className="w-full btn-primary text-xs justify-center"
          >
            <span>Continue to Schedule</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </button>
        </div>

      </div>
    </div>
  );
}
