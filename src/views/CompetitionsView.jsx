import React, { useState } from 'react';
import { useGameStore } from '../store/useGameStore';

export default function CompetitionsView() {
  const competitions = useGameStore(state => state.competitions);
  const clubs = useGameStore(state => state.clubs);
  const userClubId = useGameStore(state => state.userClubId);

  const competitionList = Object.values(competitions);
  const userClub = clubs[userClubId];
  const defaultCompId = userClub?.leagueId || 'laliga';

  const [selectedCompId, setSelectedCompId] = useState(defaultCompId);

  const activeComp = competitions[selectedCompId] || competitions.laliga || {
    id: 'laliga',
    name: 'LaLiga EA Sports',
    currentMatchday: 1,
    totalMatchdays: 38,
    table: [],
    tier: 1,
  };

  const table = activeComp.table || [];
  const userIndex = table.findIndex(row => row.clubId === userClubId);
  const userPos = userIndex !== -1 ? userIndex + 1 : null;

  const getOrdinal = (n) => {
    if (!n) return '-';
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  return (
    <div className="space-y-4">
      {/* League Switcher Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {competitionList.map(comp => {
          const isSelected = comp.id === activeComp.id;
          return (
            <button
              key={comp.id}
              onClick={() => setSelectedCompId(comp.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium whitespace-nowrap transition-all border ${
                isSelected
                  ? 'bg-zinc-800 text-zinc-100 border-zinc-700 shadow-sm'
                  : 'bg-zinc-900/40 text-zinc-400 border-zinc-800/80 hover:text-zinc-200 hover:border-zinc-700'
              }`}
            >
              {comp.name}
            </button>
          );
        })}
      </div>

      {/* Top Header */}
      <div className="hairline-card p-4 bg-zinc-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-zinc-400">{activeComp.country || 'European'} Football</span>
            <span className="text-zinc-600">•</span>
            <span className="text-xs text-zinc-500">Tier {activeComp.tier || 1} Classification</span>
          </div>
          <h2 className="text-base sm:text-lg font-semibold text-zinc-100 tracking-tight mt-0.5">
            {activeComp.name} Table
          </h2>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
          <span className="quiet-chip">Matchday {activeComp.currentMatchday || 1} of {activeComp.totalMatchdays || 38}</span>
          {userPos && <span className="quiet-chip">Your Pos: {getOrdinal(userPos)}</span>}
        </div>
      </div>

      {/* Elegant Dense League Table */}
      <div className="hairline-card p-4 bg-zinc-900/40 space-y-3">
        
        {/* Table Cutoff Legend */}
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.05] text-xs font-mono text-zinc-500">
          <div className="flex items-center gap-4 text-[11px]">
            {activeComp.tier === 1 ? (
              <>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> UEFA Champions League (1–4)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span> Relegation Zone
                </span>
              </>
            ) : (
              <>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Promotion to Tier 1 (1–2)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span> Playoff Zone (3–6)
                </span>
              </>
            )}
          </div>
          <span>Points Order</span>
        </div>

        <div className="overflow-x-auto -mx-2 sm:mx-0">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b border-white/[0.06] text-zinc-500 text-[11px]">
                <th className="pb-2 w-10 text-center font-medium">Pos</th>
                <th className="pb-2 font-medium font-sans">Club</th>
                <th className="pb-2 text-center font-medium">P</th>
                <th className="pb-2 text-center font-medium">W</th>
                <th className="pb-2 text-center font-medium">D</th>
                <th className="pb-2 text-center font-medium">L</th>
                <th className="pb-2 text-center font-medium">GD</th>
                <th className="pb-2 text-center font-medium text-zinc-200">PTS</th>
                <th className="pb-2 text-center font-medium">Form</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {table.map((row, idx) => {
                const pos = idx + 1;
                const club = clubs[row.clubId];
                const clubName = club ? club.name : (row.clubId.charAt(0).toUpperCase() + row.clubId.slice(1));
                const isUserClub = row.clubId === userClubId;
                const isUCL = pos <= 4;
                const isRelegation = pos >= 18;

                const formItems = row.form && row.form.length > 0 
                  ? row.form 
                  : ['-', '-', '-'];

                return (
                  <React.Fragment key={row.clubId}>
                    <tr
                      className={`transition-colors ${
                        isUserClub ? 'bg-white/[0.04]' : 'hover:bg-white/[0.02]'
                      }`}
                    >
                      {/* Position */}
                      <td className="py-2 text-center">
                        <span className={`text-xs ${
                          isUCL ? 'text-emerald-400 font-semibold' : isRelegation ? 'text-rose-400' : 'text-zinc-500'
                        }`}>
                          {pos}
                        </span>
                      </td>

                      {/* Club Name */}
                      <td className="py-2 font-sans font-medium text-zinc-200">
                        <div className="flex items-center gap-2">
                          {isUserClub && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
                          )}
                          <span className={isUserClub ? 'text-white font-semibold' : 'text-zinc-300'}>
                            {clubName}
                          </span>
                          {isUserClub && (
                            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-white/[0.06] text-zinc-300 border border-white/[0.06]">
                              You
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Stats */}
                      <td className="py-2 text-center text-zinc-400">{row.played}</td>
                      <td className="py-2 text-center text-zinc-400">{row.won}</td>
                      <td className="py-2 text-center text-zinc-500">{row.drawn}</td>
                      <td className="py-2 text-center text-zinc-500">{row.lost}</td>
                      <td className="py-2 text-center text-zinc-400">
                        {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                      </td>
                      <td className="py-2 text-center font-semibold text-zinc-100">
                        {row.points}
                      </td>

                      {/* Form Dots */}
                      <td className="py-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {formItems.map((res, i) => (
                            <span
                              key={i}
                              className={`w-3.5 h-3.5 rounded-full text-[8px] flex items-center justify-center ${
                                res === 'W'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : res === 'D'
                                  ? 'bg-zinc-800 text-zinc-400'
                                  : res === 'L'
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                  : 'bg-zinc-900 text-zinc-600'
                              }`}
                            >
                              {res}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>

                    {/* Subtle Promotion Divider Line */}
                    {pos === 4 && (
                      <tr>
                        <td colSpan={9} className="py-0.5 px-3 text-[10px] text-zinc-500 bg-emerald-500/[0.03] border-b border-emerald-500/20">
                          <span className="text-emerald-400 font-medium">UCL Group Stage Cutoff</span>
                        </td>
                      </tr>
                    )}

                    {/* Subtle Relegation Divider Line */}
                    {pos === 17 && (
                      <tr>
                        <td colSpan={9} className="py-0.5 px-3 text-[10px] text-zinc-500 bg-rose-500/[0.03] border-b border-rose-500/20">
                          <span className="text-rose-400 font-medium">Relegation Cutoff</span>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}

