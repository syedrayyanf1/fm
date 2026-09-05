import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { Flame, AlertTriangle, ShieldX, UserX, MessageSquare, ArrowRight, DollarSign } from 'lucide-react';
import { resolveStage1Decision, resolveStrikeAction } from '../../engine/mutinyEngine';

export default function MutinyAlertModal() {
  const activeMutinyConfrontation = useGameStore(state => state.activeMutinyConfrontation);
  const resolveMutinyConfrontation = useGameStore(state => state.resolveMutinyConfrontation);
  const players = useGameStore(state => state.players);

  if (!activeMutinyConfrontation) return null;

  const { playerId, playerName, buyerClubName, bidAmount, wageOfferWeekly, stage, headline, quote } =
    activeMutinyConfrontation;

  const player = players[playerId];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="bg-zinc-950 border border-orange-500/40 shadow-2xl rounded-xl max-w-lg w-full p-6 relative space-y-5 text-zinc-200">
        
        {/* Top Badge */}
        <div className="flex items-center justify-between">
          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-orange-500/10 text-orange-400 border border-orange-500/30 font-semibold flex items-center gap-1.5">
            <Flame className="w-3 h-3" />
            <span>MUTINY ESCALATION • STAGE {stage} OF 3</span>
          </span>
          <span className="text-[11px] font-mono text-zinc-400">
            Internal Squad Crisis
          </span>
        </div>

        {/* Title & Incident Header */}
        <div className="space-y-1">
          <h3 className="text-base font-bold text-zinc-100 tracking-tight leading-snug">
            {headline}
          </h3>
          <p className="text-xs text-zinc-400 font-mono">
            {playerName} has confronted the coaching staff regarding a blocked departure to {buyerClubName}.
          </p>
        </div>

        {/* Confrontation Quote Box */}
        <div className="p-3.5 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs italic text-zinc-300 leading-relaxed relative">
          <MessageSquare className="w-4 h-4 text-zinc-600 absolute top-2 right-2 opacity-50" />
          "{quote}"
        </div>

        {/* Offer Context Card */}
        <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-zinc-900/50 p-2.5 rounded border border-zinc-800">
          <div>
            <span className="text-[10px] text-zinc-500 block uppercase">Rejected Bid</span>
            <span className="text-zinc-200 font-semibold">${(bidAmount / 1e6).toFixed(1)}M</span>
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 block uppercase">Bidding Club Wage</span>
            <span className="text-amber-400 font-semibold">${Math.round(wageOfferWeekly / 1000)}k/wk</span>
          </div>
        </div>

        {/* Decision Actions based on Stage */}
        <div className="pt-2 border-t border-zinc-800/80 space-y-2">
          {stage === 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={() => resolveMutinyConfrontation(playerId, 'PROMISE')}
                className="p-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-left transition-colors cursor-pointer"
              >
                <div className="text-xs font-semibold text-zinc-200">
                  Promise to Sell
                </div>
                <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                  Agree to sanction sale if valuation is matched. Defuses immediate strike.
                </div>
              </button>

              <button
                onClick={() => resolveMutinyConfrontation(playerId, 'REFUSE')}
                className="p-3 rounded-lg bg-rose-950/30 hover:bg-rose-900/40 border border-rose-500/40 text-left transition-colors cursor-pointer"
              >
                <div className="text-xs font-semibold text-rose-300">
                  Refuse & Demand Professionalism
                </div>
                <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                  Strict stance. Player will leak to media and submit formal transfer request.
                </div>
              </button>
            </div>
          )}

          {stage === 3 && (
            <div className="space-y-2">
              <div className="p-2.5 rounded bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300 font-mono flex items-center gap-2">
                <ShieldX className="w-4 h-4 shrink-0" />
                <span>Player has refused to train. Matchday selection is locked.</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={() => resolveMutinyConfrontation(playerId, 'SELL_DISCOUNT')}
                  className="p-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-left transition-colors cursor-pointer"
                >
                  <div className="text-xs font-semibold text-zinc-200">
                    Sell at 15% Discount
                  </div>
                  <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                    Clear toxic element from squad immediately.
                  </div>
                </button>

                <button
                  onClick={() => resolveMutinyConfrontation(playerId, 'FREEZE_OUT')}
                  className="p-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-left transition-colors cursor-pointer"
                >
                  <div className="text-xs font-semibold text-zinc-200">
                    Banish to Reserves
                  </div>
                  <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                    Freeze player out from first team. Asset value depreciates.
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
