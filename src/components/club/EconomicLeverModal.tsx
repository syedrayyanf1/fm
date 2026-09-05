import React from 'react';
import { AlertTriangle, DollarSign, TrendingDown, ShieldAlert, X } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';

export default function EconomicLeverModal() {
  const isLeverModalOpen = useGameStore(state => state.isLeverModalOpen);
  const setIsLeverModalOpen = useGameStore(state => state.setIsLeverModalOpen);
  const club = useGameStore(state => state.clubs[state.userClubId]);
  const activateEconomicLever = useGameStore(state => state.activateEconomicLever);

  if (!club) return null;

  const currentSold = club.finances.economicLeversSoldPercentage || 0;
  const isMaxedOut = currentSold >= 30;

  // Formula: annualOperatingRevenue * 5.0 * (10 / 100) = 0.5 * annualOperatingRevenue
  const injectionAmount = Math.round(club.finances.annualOperatingRevenue * 5.0 * 0.10);
  const formattedInjection = `$${(injectionAmount / 1e6).toFixed(1)}M`;

  const handleAuthorize = () => {
    activateEconomicLever(10);
  };

  return (
    <>
      {/* The Trigger Card */}
      <div className="hairline-card p-5 bg-zinc-900/40 border border-amber-500/30 hover:border-amber-500/50 transition-all space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-zinc-100 tracking-tight">
                Emergency Capital Injection (Economic Levers)
              </h3>
              <p className="text-xs font-mono text-zinc-400">
                Securitize and sell future domestic television & merchandising rights
              </p>
            </div>
          </div>

          <div className="font-mono text-xs">
            <span className="text-zinc-500 mr-2">Status:</span>
            <span className={`font-semibold ${isMaxedOut ? 'text-rose-400' : 'text-amber-400'}`}>
              Levers Activated: {currentSold}% / 30% Maximum
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-white/[0.04]">
          <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">
            Mortgage up to 30% of future media earnings for immediate liquidity. Injects instant transfer budget at the cost of long-term operational income and reduced board margin for error.
          </p>

          <button
            disabled={isMaxedOut}
            onClick={() => setIsLeverModalOpen(true)}
            className={`px-4 py-2 rounded-lg text-xs font-mono font-medium transition-all whitespace-nowrap flex-shrink-0 ${
              isMaxedOut
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/40'
                : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:border-amber-500/50 shadow-sm'
            }`}
          >
            {isMaxedOut ? 'Cap Reached (30%)' : 'Activate 10% Media Lever'}
          </button>
        </div>
      </div>

      {/* The Confirmation Modal */}
      {isLeverModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div 
            className="w-full max-w-md bg-zinc-950 border border-amber-500/40 rounded-xl shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150"
            role="dialog"
            aria-label="Authorize Economic Lever"
          >
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-100 tracking-tight">
                    Authorize Asset Securitization
                  </h3>
                  <span className="text-[11px] font-mono text-amber-400">
                    Irrevocable Commercial Transaction
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsLeverModalOpen(false)}
                className="p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              You are about to syndicate a 10% stake in the club&apos;s domestic broadcast rights to private equity consortia. Review the binding covenant consequences:
            </p>

            {/* Impact Breakdown Cards */}
            <div className="space-y-2.5 font-mono text-xs">
              <div className="p-3 rounded-lg bg-zinc-900/60 border border-emerald-500/20 flex items-start gap-2.5">
                <DollarSign className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-[11px] text-zinc-500 uppercase block">Immediate Cash Injection</span>
                  <span className="font-bold text-emerald-400 text-sm">+{formattedInjection}</span>
                  <p className="text-[11px] text-zinc-400 font-sans mt-0.5">
                    Added to treasury balance and transfer kitty today.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-zinc-900/60 border border-rose-500/20 flex items-start gap-2.5">
                <TrendingDown className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-[11px] text-zinc-500 uppercase block">Long-Term Penalty</span>
                  <span className="font-bold text-rose-400 text-sm">-10% future annual revenue for 10 years</span>
                  <p className="text-[11px] text-zinc-400 font-sans mt-0.5">
                    Operating revenue is permanently impaired each financial year.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-zinc-900/60 border border-amber-500/20 flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-[11px] text-zinc-500 uppercase block">Boardroom Pressure</span>
                  <span className="font-bold text-amber-400 text-sm">Sacking threshold tightens by +5%</span>
                  <p className="text-[11px] text-zinc-400 font-sans mt-0.5">
                    Executive confidence margin drops; less tolerance for poor match results.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-800">
              <button
                onClick={() => setIsLeverModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-mono text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAuthorize}
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-mono font-semibold transition-all shadow-md shadow-amber-500/20"
              >
                Authorize Asset Sale
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
