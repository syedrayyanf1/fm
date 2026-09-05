import React, { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { Radio, Newspaper, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';

export default function RumorWireCard() {
  const rumors = useGameStore(state => state.rumors);
  const [tierFilter, setTierFilter] = useState<'ALL' | 1 | 2 | 3>('ALL');

  const filteredRumors = rumors.filter(item => {
    if (tierFilter === 'ALL') return true;
    return item.credibilityTier === tierFilter;
  });

  return (
    <div className="hairline-card p-4 bg-zinc-900/40 space-y-3">
      {/* Header & Filter Ribbons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span className="text-xs font-mono font-medium text-zinc-300">Journalist Rumor Wire</span>
        </div>

        {/* Tier Filter Pills */}
        <div className="flex items-center gap-1 text-[10px] font-mono">
          <button
            onClick={() => setTierFilter('ALL')}
            className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
              tierFilter === 'ALL'
                ? 'bg-zinc-800 text-zinc-100 font-semibold border border-zinc-700'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setTierFilter(1)}
            className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
              tierFilter === 1
                ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/40'
                : 'text-zinc-500 hover:text-emerald-400'
            }`}
          >
            Tier 1
          </button>
          <button
            onClick={() => setTierFilter(2)}
            className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
              tierFilter === 2
                ? 'bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/40'
                : 'text-zinc-500 hover:text-blue-400'
            }`}
          >
            Tier 2
          </button>
          <button
            onClick={() => setTierFilter(3)}
            className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
              tierFilter === 3
                ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40'
                : 'text-zinc-500 hover:text-amber-400'
            }`}
          >
            Tier 3
          </button>
        </div>
      </div>

      {/* Rumors Stream */}
      <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
        {filteredRumors.map(item => {
          const isTier1 = item.credibilityTier === 1;
          const isTier2 = item.credibilityTier === 2;

          return (
            <div
              key={item.id}
              className="p-3 rounded-lg bg-zinc-900/50 border border-white/[0.04] hover:border-white/[0.08] transition-colors space-y-1.5"
            >
              <div className="flex items-center justify-between text-[10px] font-mono">
                {/* Source Tier Badge */}
                <span
                  className={`px-1.5 py-0.5 rounded border font-medium flex items-center gap-1 ${
                    isTier1
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : isTier2
                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}
                >
                  {isTier1 && <CheckCircle2 className="w-2.5 h-2.5" />}
                  {isTier2 && <AlertCircle className="w-2.5 h-2.5" />}
                  {!isTier1 && !isTier2 && <HelpCircle className="w-2.5 h-2.5" />}
                  <span>
                    {isTier1 ? 'Tier 1 • Gurus (98%)' : isTier2 ? 'Tier 2 • Beat Reporter (75%)' : 'Tier 3 • Tabloid (25%)'}
                  </span>
                </span>
                <span className="text-zinc-500">{item.timestamp}</span>
              </div>

              <p className="text-xs text-zinc-200 leading-snug font-sans">
                {item.headline}
              </p>

              <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-0.5">
                <span>Source: <strong className="text-zinc-400 font-normal">{item.source}</strong></span>
                {item.buyerClubName && (
                  <span>Linked: <strong className="text-zinc-400 font-normal">{item.buyerClubName}</strong></span>
                )}
              </div>
            </div>
          );
        })}

        {filteredRumors.length === 0 && (
          <p className="text-xs font-mono text-zinc-500 py-4 text-center">
            No market rumors in this credibility tier.
          </p>
        )}
      </div>
    </div>
  );
}
