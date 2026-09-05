import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { Check } from 'lucide-react';

export default function ClubFinancesView() {
  const club = useGameStore(state => state.clubs[state.userClubId]);
  const facilities = useGameStore(state => state.facilities);
  const upgradeFacility = useGameStore(state => state.upgradeFacility);
  const leverModalOpen = useGameStore(state => state.leverModalOpen);
  const setLeverModalOpen = useGameStore(state => state.setLeverModalOpen);
  const leverConfirmed = useGameStore(state => state.leverConfirmed);
  const executeEconomicLever = useGameStore(state => state.executeEconomicLever);

  const finances = club?.finances || {
    transferBudget: 45000000,
    wageBudgetWeekly: 1200000,
    squadCostRatio: 62.0,
  };
  const boardTrust = club?.boardTrust ?? 84;
  const transferBudget = finances.transferBudget / 1e6;
  const squadCostRatio = finances.squadCostRatio;



  return (
    <div className="space-y-4">
      
      {/* Top Header */}
      <div className="hairline-card p-4 bg-zinc-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-zinc-400">Governance</span>
            <span className="text-zinc-600">•</span>
            <span className="text-xs text-zinc-500">Fiscal Year 2026/27</span>
          </div>
          <h2 className="text-base sm:text-lg font-semibold text-zinc-100 tracking-tight mt-0.5">
            Club Infrastructure & Governance
          </h2>
        </div>

        {/* Discreet "Activate Economic Lever" Action */}
        <div>
          {leverConfirmed ? (
            <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-md border border-emerald-500/20">
              <Check className="w-3.5 h-3.5" />
              <span>Economic Lever Activated</span>
            </div>
          ) : (
            <button
              onClick={() => setLeverModalOpen(true)}
              className="btn-secondary text-xs text-zinc-300 hover:text-white"
            >
              <span>Activate Economic Lever</span>
            </button>
          )}
        </div>
      </div>

      {/* Low-Profile 70% Squad Cost Ratio (FFP) Progress Bar */}
      <div className="hairline-card p-4 bg-zinc-900/40 space-y-2 font-mono">
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-300 font-sans font-medium">
            Squad Cost Ratio (UEFA & LaLiga FFP)
          </span>
          <span className="text-zinc-400">
            <strong className="text-emerald-400 font-medium">{squadCostRatio}%</strong> / 70.0% Ceiling
          </span>
        </div>

        {/* Slim Low-Profile Bar */}
        <div className="relative h-2 bg-zinc-900 rounded-full overflow-hidden border border-white/[0.04]">
          <div
            style={{ width: `${(squadCostRatio / 80) * 100}%` }}
            className={`h-full rounded-full transition-all duration-300 ${
              squadCostRatio > 70 ? 'bg-rose-500' : squadCostRatio > 65 ? 'bg-amber-400' : 'bg-emerald-500'
            }`}
          />
          {/* 70% Marker Line */}
          <div
            style={{ left: `${(70 / 80) * 100}%` }}
            className="absolute top-0 bottom-0 w-0.5 bg-zinc-400 z-10"
            title="70% Threshold"
          />
        </div>

        <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-0.5">
          <span>Compliant (1:1 registration headroom)</span>
          <span>70% Regulatory Cap</span>
        </div>
      </div>

      {/* Hairline Cards for Facilities (Stadium, Training, Academy, Medical) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span className="font-medium text-zinc-300">Club Facilities</span>
          <span className="font-mono text-zinc-500">
            Reserve: <strong className="text-zinc-200 font-medium">${transferBudget.toFixed(1)}M</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {facilities.map((fac) => {
            const isMax = fac.level >= fac.maxLevel;
            const canAfford = transferBudget >= fac.cost;

            return (
              <div
                key={fac.id}
                className="hairline-card p-4 bg-zinc-900/40 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between pb-2 border-b border-white/[0.05]">
                    <div>
                      <span className="text-[10px] font-mono text-zinc-500 uppercase">
                        {fac.category}
                      </span>
                      <h4 className="text-sm font-semibold text-zinc-100 mt-0.5">
                        {fac.name}
                      </h4>
                    </div>
                    <span className="quiet-chip font-mono text-[10px]">
                      Lvl {fac.level}/{fac.maxLevel}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                    {fac.summary}
                  </p>

                  <div className="mt-2 text-xs font-mono text-emerald-400 flex items-center justify-between">
                    <span className="text-zinc-500">Output:</span>
                    <span>{fac.stat}</span>
                  </div>
                </div>

                {/* Footer / Upgrade Action */}
                <div className="border-t border-white/[0.05] pt-2.5 flex items-center justify-between text-xs">
                  {!isMax ? (
                    <span className="font-mono text-zinc-400 text-[11px]">
                      Upgrade: <strong className="text-zinc-200 font-medium">${fac.cost.toFixed(1)}M</strong>
                    </span>
                  ) : (
                    <span className="text-emerald-400 text-xs font-medium">Max Level</span>
                  )}

                  {!isMax && (
                    <button
                      onClick={() => upgradeFacility(fac.id)}
                      disabled={!canAfford}
                      className={`text-xs py-1 px-3 rounded-md transition-all ${
                        canAfford
                          ? 'btn-secondary text-xs'
                          : 'bg-zinc-900 text-zinc-600 border border-white/[0.02] cursor-not-allowed'
                      }`}
                    >
                      Upgrade
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Economic Lever Confirmation Dialog */}
      {leverModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="hairline-card-elevated max-w-md w-full p-5 bg-zinc-900 border border-white/[0.08] relative space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <h3 className="text-sm font-semibold text-zinc-100 font-sans">
                Economic Lever Authorization
              </h3>
              <button
                onClick={() => setLeverModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-300"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-zinc-400 text-xs leading-relaxed font-sans">
                Securitize 10% future broadcast and media rights in exchange for immediate capital allocation into the active transfer budget.
              </p>

              <div className="p-3 rounded bg-zinc-950/80 border border-white/[0.05] space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Immediate Liquidity:</span>
                  <span className="text-emerald-400 font-medium">+$35.0M</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Squad Cost Cap:</span>
                  <span className="text-emerald-400 font-medium">-3.8%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Board Trust Impact:</span>
                  <span className="text-rose-400 font-medium">-6%</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setLeverModalOpen(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={executeEconomicLever}
                  className="btn-primary text-xs"
                >
                  Confirm & Activate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
