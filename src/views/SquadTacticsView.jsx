import React, { useState } from 'react';
import { Sliders, Users } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import PlayerDetailDrawer from '../components/squad/PlayerDetailDrawer';
import TacticsModal from '../components/squad/TacticsModal';
import SafePlayerPhoto from '../components/common/SafePlayerPhoto';

export default function SquadTacticsView() {
  const club = useGameStore(state => state.clubs[state.userClubId]);
  const players = useGameStore(state => state.players);
  const userClubId = useGameStore(state => state.userClubId);
  const selectedPlayerId = useGameStore(state => state.selectedPlayerId);
  const setSelectedPlayerId = useGameStore(state => state.setSelectedPlayerId);
  const setIsTacticsModalOpen = useGameStore(state => state.setIsTacticsModalOpen);

  const [activeRosterSection, setActiveRosterSection] = useState('all');

  const squad = Object.values(players).filter(p => p.clubId === userClubId);
  const starters = squad.filter(p => p.isStarter);
  const bench = squad.filter(p => !p.isStarter);
  const selectedPlayer = squad.find(p => p.id === selectedPlayerId) || starters[0] || squad[0];

  const avgOvr = starters.length > 0 
    ? (starters.reduce((acc, p) => acc + p.overallRating, 0) / starters.length).toFixed(1)
    : '86.0';

  // Stamina ring component (SVG circular progress ring)
  const renderStaminaRing = (stamina) => {
    const radius = 10;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (stamina / 100) * circumference;
    const isHigh = stamina >= 85;
    const isMed = stamina >= 70 && stamina < 85;

    return (
      <div className="flex items-center gap-2" title={`Stamina: ${stamina}%`}>
        <div className="relative w-6 h-6 flex items-center justify-center">
          <svg className="w-6 h-6 transform -rotate-90">
            <circle
              cx="12"
              cy="12"
              r={radius}
              stroke="currentColor"
              strokeWidth="2.5"
              fill="transparent"
              className="text-zinc-800"
            />
            <circle
              cx="12"
              cy="12"
              r={radius}
              stroke="currentColor"
              strokeWidth="2.5"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className={isHigh ? 'text-emerald-500' : isMed ? 'text-zinc-300' : 'text-rose-400'}
            />
          </svg>
        </div>
        <span className="font-mono text-xs text-zinc-300">{stamina}%</span>
      </div>
    );
  };

  const getFormLetter = (score) => {
    if (score >= 7.8) return 'W';
    if (score >= 7.3) return 'D';
    return 'L';
  };

  const displayedPlayers = activeRosterSection === 'starters' 
    ? starters 
    : activeRosterSection === 'bench' 
    ? bench 
    : squad;

  return (
    <div className="space-y-4">
      
      {/* View Header */}
      <div className="hairline-card p-4 bg-zinc-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div 
            onClick={() => setIsTacticsModalOpen(true)}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <span className="text-xs font-mono text-zinc-400 group-hover:text-zinc-200 transition-colors">Tactics & Roster</span>
            <span className="text-zinc-600">•</span>
            <span className="text-xs text-emerald-400 font-mono">
              {club.tactics.formation} {club.tactics.archetype.replace('_', ' ')}
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-semibold text-zinc-100 tracking-tight mt-0.5">
            First Team Pitch & Macro Pillars
          </h2>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
          <span className="quiet-chip">{starters.length} Starters</span>
          <span className="quiet-chip">{bench.length} Bench</span>
          <span className="quiet-chip">Avg OVR: {avgOvr}</span>
        </div>
      </div>

      {/* Split View: Minimalist Pitch Board (Left/Top) & Sleek Data Table (Right/Bottom) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left/Top: Minimalist Pitch Board (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="hairline-card p-3 bg-zinc-900/40 space-y-2">
            <div className="flex items-center justify-between text-xs pb-1.5 border-b border-white/[0.05]">
              <div className="flex items-center gap-2">
                <span className="text-zinc-300 font-medium">Tactical Board</span>
                <span className="text-zinc-500 font-mono text-[11px]">Formation {club.tactics.formation}</span>
              </div>
              <button
                onClick={() => setIsTacticsModalOpen(true)}
                className="px-2 py-1 rounded bg-zinc-800/80 hover:bg-zinc-800 text-zinc-200 border border-white/[0.08] hover:border-emerald-500/40 text-[11px] font-mono flex items-center gap-1.5 transition-colors"
                title="Configure Formation, Archetypes & Knobs"
              >
                <Sliders className="w-3 h-3 text-emerald-400" />
                <span>Tactical Settings</span>
              </button>
            </div>

            {/* Minimalist Dark Pitch Surface */}
            <div 
              onClick={() => setIsTacticsModalOpen(true)}
              className="relative w-full aspect-[3/4] bg-zinc-950 rounded-md border border-white/[0.06] overflow-hidden cursor-pointer group"
              title="Click pitch to open Tactical System Blueprint"
            >
              
              {/* Subtle Hairline Pitch Markings */}
              <div className="absolute inset-3 border border-white/[0.05] rounded pointer-events-none"></div>
              <div className="absolute left-3 right-3 top-1/2 border-t border-white/[0.05] pointer-events-none"></div>
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 border border-white/[0.05] rounded-full pointer-events-none"></div>

              {/* Goal areas */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-32 h-14 border-b border-x border-white/[0.05] pointer-events-none"></div>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-32 h-14 border-t border-x border-white/[0.05] pointer-events-none"></div>

              {/* Clean Geometric Position Badges */}
              {starters.map((p) => {
                const isSelected = selectedPlayer?.id === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPlayerId(p.id);
                    }}
                    style={{
                      left: `${p.pitchX || 50}%`,
                      top: `${p.pitchY || 50}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    className={`absolute z-10 flex flex-col items-center cursor-pointer transition-all duration-150 ${
                      isSelected ? 'scale-110 z-20' : 'hover:scale-105'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-md flex items-center justify-center font-mono text-[11px] font-semibold transition-all border ${
                        isSelected
                          ? 'bg-white text-zinc-950 border-white shadow-md shadow-white/10'
                          : 'bg-zinc-900/90 text-zinc-200 border-white/[0.12] hover:border-white/30'
                      }`}
                    >
                      {p.overallRating}
                    </div>
                    <span className="mt-1 px-1 py-0.2 rounded bg-zinc-950/80 border border-white/[0.06] text-[9px] font-mono text-zinc-300 whitespace-nowrap">
                      {p.name.split(' ').pop()}
                    </span>
                  </button>
                );
              })}

            </div>
          </div>

          {/* Selected Player Inspector Card */}
          {selectedPlayer && (
            <div 
              onClick={() => setSelectedPlayerId(selectedPlayer.id)}
              className="hairline-card p-3.5 bg-zinc-900/40 space-y-2.5 cursor-pointer hover:border-white/[0.12] transition-colors"
              title="Click to view full player details drawer"
            >
              <div className="flex items-center justify-between pb-1.5 border-b border-white/[0.06]">
                <span className="text-xs font-mono text-zinc-400">Player Inspector (Click to inspect)</span>
                <span className="text-xs font-mono text-zinc-300 font-medium">
                  #{selectedPlayer.shirtNumber || 1} {selectedPlayer.primaryPosition}
                </span>
              </div>

              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-zinc-100">
                    {selectedPlayer.fullName || selectedPlayer.name}
                  </h4>
                  <div className="text-xs text-zinc-400 mt-0.5">
                    {selectedPlayer.role || selectedPlayer.primaryPosition} • {selectedPlayer.age} yrs ({selectedPlayer.nationality})
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase block">OVR</span>
                  <span className="text-xl font-mono font-semibold text-emerald-400">
                    {selectedPlayer.overallRating}
                  </span>
                </div>
              </div>

              {/* Macro Pillar Mini Bar */}
              <div className="grid grid-cols-5 gap-1.5 pt-1 text-center font-mono text-xs">
                <div className="p-1.5 rounded bg-zinc-900/50 border border-white/[0.04]">
                  <span className="text-[10px] text-zinc-500 block">ATT</span>
                  <span className="font-semibold text-zinc-200">{selectedPlayer.attributes.attacking}</span>
                </div>
                <div className="p-1.5 rounded bg-zinc-900/50 border border-white/[0.04]">
                  <span className="text-[10px] text-zinc-500 block">CRE</span>
                  <span className="font-semibold text-zinc-200">{selectedPlayer.attributes.creative}</span>
                </div>
                <div className="p-1.5 rounded bg-zinc-900/50 border border-white/[0.04]">
                  <span className="text-[10px] text-zinc-500 block">DEF</span>
                  <span className="font-semibold text-zinc-200">{selectedPlayer.attributes.defending}</span>
                </div>
                <div className="p-1.5 rounded bg-zinc-900/50 border border-white/[0.04]">
                  <span className="text-[10px] text-zinc-500 block">PHY</span>
                  <span className="font-semibold text-zinc-200">{selectedPlayer.attributes.physical}</span>
                </div>
                <div className="p-1.5 rounded bg-zinc-900/50 border border-white/[0.04]">
                  <span className="text-[10px] text-zinc-500 block">MEN</span>
                  <span className="font-semibold text-zinc-200">{selectedPlayer.attributes.mental}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right/Bottom: Sleek Data Table (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="hairline-card p-4 bg-zinc-900/40 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.05] text-xs">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setActiveRosterSection('all')}
                  className={`px-2 py-1 rounded text-xs font-mono font-medium transition-colors ${
                    activeRosterSection === 'all'
                      ? 'bg-zinc-800 text-zinc-100'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  All Squad ({squad.length})
                </button>
                <button
                  onClick={() => setActiveRosterSection('starters')}
                  className={`px-2 py-1 rounded text-xs font-mono font-medium transition-colors ${
                    activeRosterSection === 'starters'
                      ? 'bg-zinc-800 text-zinc-100'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Starting XI ({starters.length})
                </button>
                <button
                  onClick={() => setActiveRosterSection('bench')}
                  className={`px-2 py-1 rounded text-xs font-mono font-medium transition-colors ${
                    activeRosterSection === 'bench'
                      ? 'bg-zinc-800 text-zinc-100'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Bench ({bench.length})
                </button>
              </div>

              <span className="text-zinc-500 font-mono text-[11px] hidden sm:inline">
                Click any player row to inspect
              </span>
            </div>

            {/* Sleek Data Table */}
            <div className="overflow-x-auto -mx-2 sm:mx-0">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] text-zinc-500 font-mono text-[11px]">
                    <th className="pb-2 font-medium">Player</th>
                    <th className="pb-2 font-medium text-center">Pos</th>
                    <th className="pb-2 font-medium text-center">Age</th>
                    <th className="pb-2 font-medium text-center text-zinc-300">OVR</th>
                    <th className="pb-2 font-medium text-center">ATT</th>
                    <th className="pb-2 font-medium text-center">CRE</th>
                    <th className="pb-2 font-medium text-center">DEF</th>
                    <th className="pb-2 font-medium text-center">PHY</th>
                    <th className="pb-2 font-medium text-center">MEN</th>
                    <th className="pb-2 font-medium">Stamina</th>
                    <th className="pb-2 font-medium text-center">Form</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {displayedPlayers.map((p) => {
                    const isSelected = selectedPlayer?.id === p.id;
                    const formDisplay = (p.formHistory || [7.5, 7.8, 7.6]).slice(0, 3);
                    return (
                      <tr
                        key={p.id}
                        onClick={() => setSelectedPlayerId(p.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-white/[0.05]' : 'hover:bg-white/[0.02]'
                        }`}
                      >
                        {/* Name */}
                        <td className="py-2.5 pr-2">
                          <div className="flex items-center gap-2">
                            <SafePlayerPhoto
                              src={p.photoUrl}
                              name={p.name}
                              className="w-5 h-5 rounded-full object-cover"
                            />
                            {!p.isStarter && (
                              <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 flex-shrink-0" title="Bench player" />
                            )}
                            <span className="font-medium text-zinc-200 block truncate max-w-[120px]">
                              {p.name}
                            </span>
                          </div>
                        </td>

                        {/* Position */}
                        <td className="py-2.5 px-1 text-center">
                          <span className="font-mono text-[10px] text-zinc-400 px-1 py-0.5 rounded bg-white/[0.03] border border-white/[0.04]">
                            {p.primaryPosition}
                          </span>
                        </td>

                        {/* Age */}
                        <td className="py-2.5 px-1 text-center font-mono text-zinc-500">
                          {p.age}
                        </td>

                        {/* OVR */}
                        <td className="py-2.5 px-1 text-center font-mono font-medium text-emerald-400">
                          {p.overallRating}
                        </td>

                        {/* 5 Macro Pillars */}
                        <td className="py-2.5 px-1 text-center font-mono text-zinc-300">{p.attributes.attacking}</td>
                        <td className="py-2.5 px-1 text-center font-mono text-zinc-300">{p.attributes.creative}</td>
                        <td className="py-2.5 px-1 text-center font-mono text-zinc-300">{p.attributes.defending}</td>
                        <td className="py-2.5 px-1 text-center font-mono text-zinc-300">{p.attributes.physical}</td>
                        <td className="py-2.5 px-1 text-center font-mono text-zinc-300">{p.attributes.mental}</td>

                        {/* Stamina Ring */}
                        <td className="py-2.5 px-2 whitespace-nowrap">
                          {renderStaminaRing(p.stamina)}
                        </td>

                        {/* Quiet Form Dot-Trail */}
                        <td className="py-2.5 px-1 text-center">
                          <div className="flex items-center justify-center gap-1 font-mono text-[10px]">
                            {formDisplay.map((score, i) => {
                              const res = getFormLetter(score);
                              return (
                                <span
                                  key={i}
                                  title={`Match Rating: ${score.toFixed(1)}`}
                                  className={`w-4 h-4 rounded-full flex items-center justify-center font-semibold text-[9px] ${
                                    res === 'W'
                                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                      : res === 'D'
                                      ? 'bg-zinc-800 text-zinc-400'
                                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                  }`}
                                >
                                  {res}
                                </span>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="text-[11px] font-mono text-zinc-500 pt-1 flex items-center justify-between border-t border-white/[0.04]">
              <span>Form trail reflects last 3 official match evaluations</span>
              <span className="text-zinc-400">{displayedPlayers.length} of {squad.length} Players</span>
            </div>
          </div>
        </div>

      </div>

      {/* Slide-out Player Detail Drawer */}
      <PlayerDetailDrawer />

      {/* Tactical System Configuration Modal */}
      <TacticsModal />

    </div>
  );
}
