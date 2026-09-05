import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { Sparkles, UserPlus, X, ShieldAlert, Award, Star, CheckCircle } from 'lucide-react';
import { YouthProspect } from '../../types/season';

export default function YouthIntakeModal() {
  const isYouthIntakeOpen = useGameStore(state => state.isYouthIntakeOpen);
  const youthProspects = useGameStore(state => state.youthProspects);
  const signYouthProspect = useGameStore(state => state.signYouthProspect);
  const releaseYouthProspect = useGameStore(state => state.releaseYouthProspect);
  const closeYouthIntakeModal = useGameStore(state => state.closeYouthIntakeModal);
  const userClub = useGameStore(state => state.getUserClub());

  if (!isYouthIntakeOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[90vh] flex flex-col bg-zinc-950 border border-zinc-800/80 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-zinc-100 tracking-tight">
                  Annual Youth Academy Intake Showcase
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  MARCH 25 TRIAL CLASS
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                {userClub?.name} Academy U-18s vs Local Prospects (4–2) • Trial Match Analysis
              </p>
            </div>
          </div>
          <button
            onClick={closeYouthIntakeModal}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Academy Status Bar */}
        <div className="px-6 py-3 bg-zinc-900/20 border-b border-zinc-800/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-zinc-500">Academy Facility:</span>
              <span className="font-mono text-zinc-200 font-medium">
                Level {userClub?.facilities?.youthAcademyLevel || 4} / 5
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-zinc-500">Trial Class Size:</span>
              <span className="font-mono text-zinc-200 font-medium">{youthProspects.length} Prospects</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-zinc-500">Standard Youth Wage:</span>
              <span className="font-mono text-emerald-400 font-medium">$1,500 / wk</span>
            </div>
          </div>
          <div className="text-zinc-500 text-[11px]">
            Fog of War partially lifted by Head of Youth Development
          </div>
        </div>

        {/* Prospect Roster Table */}
        <div className="flex-1 overflow-y-auto p-6">
          {youthProspects.length === 0 ? (
            <div className="py-16 text-center text-zinc-500 text-sm">
              <CheckCircle className="w-10 h-10 mx-auto text-emerald-400/60 mb-2" />
              All youth trial decisions resolved for this season.
            </div>
          ) : (
            <div className="space-y-3">
              {youthProspects.map((prospect: YouthProspect) => {
                const isWonderkid = prospect.isGenerationalWonderkid;
                return (
                  <div
                    key={prospect.id}
                    className={`p-4 rounded-lg border transition-all ${
                      isWonderkid
                        ? 'bg-amber-950/10 border-amber-500/40 hover:border-amber-500/60'
                        : 'bg-zinc-900/40 border-zinc-800/80 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      {/* Left: Info */}
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center font-mono text-xs font-bold border ${
                            isWonderkid
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-zinc-800/80 text-zinc-200 border-zinc-700'
                          }`}
                        >
                          <span>{prospect.position}</span>
                          <span className="text-[10px] font-normal text-zinc-400">{prospect.age}y</span>
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-zinc-100">{prospect.name}</span>
                            <span
                              className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded-full border ${
                                isWonderkid
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                                  : prospect.personalityTag === 'FIRST-TEAM PROSPECT'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : prospect.personalityTag === 'RAW DIAMOND'
                                  ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                                  : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                              }`}
                            >
                              {prospect.personalityTag}
                            </span>
                          </div>

                          <div className="flex items-center gap-4 mt-1 text-xs">
                            <span className="text-zinc-400">
                              Scouted: <span className="font-mono text-zinc-200">{prospect.scoutedRating}</span>
                            </span>
                            <span className="text-zinc-400">
                              Pace/Phy: <span className="font-mono text-zinc-200">{prospect.attributes.physical}</span>
                            </span>
                            <span className="text-zinc-400">
                              Tech/Atk: <span className="font-mono text-zinc-200">{prospect.attributes.attacking}</span>
                            </span>
                            <span className="text-zinc-400">
                              Clutch: <span className="font-mono text-amber-400">{prospect.traits.clutch}/20</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => releaseYouthProspect(prospect.id)}
                          className="px-3 py-1.5 rounded-md text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800 transition-colors"
                        >
                          Release
                        </button>
                        <button
                          onClick={() => signYouthProspect(prospect.id)}
                          className={`px-4 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
                            isWonderkid
                              ? 'bg-amber-500 hover:bg-amber-400 text-black font-semibold shadow-lg shadow-amber-500/20'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20'
                          }`}
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          Sign ($1,500/wk)
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-zinc-800 bg-zinc-900/40 flex justify-end">
          <button
            onClick={closeYouthIntakeModal}
            className="px-4 py-2 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
          >
            Complete Intake Review
          </button>
        </div>
      </div>
    </div>
  );
}
