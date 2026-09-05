import React, { useEffect, useRef } from 'react';
import { MatchEvent } from '../../engine/matchTypes';
import { Terminal } from 'lucide-react';

interface MatchCommentaryTickerProps {
  events: MatchEvent[];
}

export default function MatchCommentaryTicker({ events }: MatchCommentaryTickerProps) {
  const scrollBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events.length]);

  const renderBadge = (type: MatchEvent['type']) => {
    switch (type) {
      case 'GOAL':
        return (
          <span className="px-1.5 py-0.2 rounded font-mono font-bold text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            [GOAL!]
          </span>
        );
      case 'YELLOW':
        return (
          <span className="px-1.5 py-0.2 rounded font-mono font-bold text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/30">
            [YELLOW]
          </span>
        );
      case 'RED':
        return (
          <span className="px-1.5 py-0.2 rounded font-mono font-bold text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/30">
            [RED CARD]
          </span>
        );
      case 'INJURY':
        return (
          <span className="px-1.5 py-0.2 rounded font-mono font-bold text-[10px] bg-rose-500/10 text-rose-300 border border-rose-500/30">
            [INJURY]
          </span>
        );
      case 'SAVED':
        return (
          <span className="px-1.5 py-0.2 rounded font-mono font-bold text-[10px] bg-zinc-800 text-zinc-300 border border-zinc-700/60">
            [SAVED]
          </span>
        );
      case 'CHANCE_MISSED':
        return (
          <span className="px-1.5 py-0.2 rounded font-mono font-bold text-[10px] bg-zinc-800 text-zinc-400 border border-zinc-700/40">
            [CHANCE]
          </span>
        );
      case 'SUBSTITUTION':
        return (
          <span className="px-1.5 py-0.2 rounded font-mono font-bold text-[10px] bg-sky-500/10 text-sky-400 border border-sky-500/30">
            [EVENT]
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-zinc-950 border border-zinc-800/80 rounded-xl overflow-hidden flex flex-col h-64 sm:h-72">
      {/* Terminal Title Bar */}
      <div className="px-3.5 py-2 border-b border-zinc-800/80 bg-zinc-900/50 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2 text-zinc-300">
          <Terminal className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-semibold text-zinc-200">Match Commentary Ticker</span>
        </div>
        <span className="text-[10px] text-zinc-500">Live Telemetry Feed</span>
      </div>

      {/* Auto-scrolling High-Density Log */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 font-mono text-xs select-text">
        {events.length === 0 ? (
          <div className="text-zinc-600 text-xs italic text-center py-6">
            Awaiting referee whistle...
          </div>
        ) : (
          events.map((ev, index) => (
            <div
              key={index}
              className={`flex items-start gap-2.5 leading-relaxed p-1.5 rounded transition-colors ${
                ev.type === 'GOAL'
                  ? 'bg-emerald-500/[0.06] border-l-2 border-emerald-400'
                  : ev.type === 'RED'
                  ? 'bg-rose-500/[0.06] border-l-2 border-rose-500'
                  : 'hover:bg-zinc-900/50'
              }`}
            >
              {/* Minute Stamp */}
              <span className="text-[11px] font-bold text-zinc-500 w-8 flex-shrink-0 tabular-nums">
                {ev.minute}&apos;
              </span>

              {/* Event Badge */}
              <div className="flex-shrink-0">
                {renderBadge(ev.type)}
              </div>

              {/* Description */}
              <span className="text-zinc-300 flex-1 break-words">
                {ev.description}
              </span>
            </div>
          ))
        )}
        <div ref={scrollBottomRef} />
      </div>
    </div>
  );
}
