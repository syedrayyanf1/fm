import React from 'react';
import { Club } from '../../types/game';
import { MatchSimulationState } from '../../engine/matchTypes';
import { Trophy, CheckCircle2, Award, Zap, ShieldCheck } from 'lucide-react';

interface PostMatchSummaryProps {
  state: MatchSimulationState;
  homeClub: Club;
  awayClub: Club;
  onComplete: () => void;
}

export default function PostMatchSummary({
  state,
  homeClub,
  awayClub,
  onComplete,
}: PostMatchSummaryProps) {
  // Determine Player of the Match (highest match rating)
  const allPlayers = [...state.homeLineup, ...state.awayLineup];
  allPlayers.sort((a, b) => b.matchRating - a.matchRating || b.goals - a.goals);
  const potm = allPlayers[0];

  const isHomeWinner = state.homeScore > state.awayScore;
  const isAwayWinner = state.awayScore > state.homeScore;

  return (
    <div className="bg-zinc-950 border border-zinc-800/90 rounded-xl p-5 sm:p-6 space-y-6 animate-in fade-in zoom-in-95 duration-200">
      {/* 1. Header Banner & Whistle */}
      <div className="text-center space-y-1 pb-4 border-b border-white/[0.06]">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-xs font-semibold">
          <CheckCircle2 className="w-3.5 h-3.5" />
          FULL TIME OFFICIAL RESULT
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-zinc-100 tracking-tight mt-1 font-mono">
          {homeClub.name} {state.homeScore} — {state.awayScore} {awayClub.name}
        </h3>
        <p className="text-xs font-mono text-zinc-400">
          Expected Goals: {homeClub.shortName} {state.homeXg.toFixed(2)} xG — {state.awayXg.toFixed(2)} xG {awayClub.shortName}
        </p>
      </div>

      {/* 2. Player of the Match Feature Card */}
      {potm && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-zinc-900/90 to-zinc-900/40 border border-amber-500/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[10px] font-mono text-amber-400 uppercase tracking-wider font-semibold">
                Player of the Match
              </div>
              <h4 className="text-sm sm:text-base font-bold text-zinc-100 tracking-tight">
                {potm.player.fullName || potm.player.name}
              </h4>
              <div className="text-xs font-mono text-zinc-400 mt-0.5">
                {potm.player.primaryPosition} • {potm.goals} Goals • {potm.assists} Assists • {potm.shots} Shots
              </div>
            </div>
          </div>

          <div className="text-right font-mono">
            <span className="text-[10px] text-zinc-500 uppercase block">Match Rating</span>
            <span className="text-xl sm:text-2xl font-bold text-emerald-400 tabular-nums">
              {potm.matchRating.toFixed(1)}
            </span>
          </div>
        </div>
      )}

      {/* 3. Both Teams Lineup Ratings Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
        {/* Home Lineup Ratings */}
        <div className="p-3.5 rounded-lg bg-zinc-900/40 border border-white/[0.05] space-y-2">
          <div className="flex items-center justify-between pb-1.5 border-b border-white/[0.06]">
            <span className="font-semibold text-zinc-200">{homeClub.name} Ratings</span>
            <span className="text-zinc-500 text-[11px]">{state.homeScore} Goals</span>
          </div>
          <div className="space-y-1">
            {state.homeLineup.map((pState) => (
              <div key={pState.player.id} className="flex items-center justify-between py-1 border-b border-white/[0.02]">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-7 text-[10px] text-zinc-400">{pState.player.primaryPosition}</span>
                  <span className="text-zinc-200 truncate">{pState.player.name}</span>
                  {pState.goals > 0 && <span className="text-emerald-400 font-bold">⚽{pState.goals}</span>}
                </div>
                <span className={`font-bold tabular-nums ${pState.matchRating >= 7.5 ? 'text-emerald-400' : pState.matchRating >= 6.5 ? 'text-zinc-300' : 'text-rose-400'}`}>
                  {pState.matchRating.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Away Lineup Ratings */}
        <div className="p-3.5 rounded-lg bg-zinc-900/40 border border-white/[0.05] space-y-2">
          <div className="flex items-center justify-between pb-1.5 border-b border-white/[0.06]">
            <span className="font-semibold text-zinc-200">{awayClub.name} Ratings</span>
            <span className="text-zinc-500 text-[11px]">{state.awayScore} Goals</span>
          </div>
          <div className="space-y-1">
            {state.awayLineup.map((pState) => (
              <div key={pState.player.id} className="flex items-center justify-between py-1 border-b border-white/[0.02]">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-7 text-[10px] text-zinc-400">{pState.player.primaryPosition}</span>
                  <span className="text-zinc-200 truncate">{pState.player.name}</span>
                  {pState.goals > 0 && <span className="text-emerald-400 font-bold">⚽{pState.goals}</span>}
                </div>
                <span className={`font-bold tabular-nums ${pState.matchRating >= 7.5 ? 'text-emerald-400' : pState.matchRating >= 6.5 ? 'text-zinc-300' : 'text-rose-400'}`}>
                  {pState.matchRating.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Complete Match Button */}
      <div className="pt-3 border-t border-white/[0.06] flex items-center justify-end">
        <button
          onClick={onComplete}
          className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-mono text-xs font-bold transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Complete Match & Flush Data</span>
        </button>
      </div>
    </div>
  );
}
