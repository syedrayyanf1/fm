import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { Trophy, Award, Shield, Star, X, Medal, Sparkles, TrendingUp, User } from 'lucide-react';
import { TrophyRecord } from '../../types/season';

export default function TrophyCabinetView() {
  const isTrophyCabinetOpen = useGameStore(state => state.isTrophyCabinetOpen);
  const closeTrophyCabinet = useGameStore(state => state.closeTrophyCabinet);
  const managerProfile = useGameStore(state => state.managerProfile);
  const userClub = useGameStore(state => state.getUserClub());

  if (!isTrophyCabinetOpen) return null;

  const totalMatches = managerProfile.careerMatches;
  const winRate = totalMatches > 0 ? ((managerProfile.careerWins / totalMatches) * 100).toFixed(1) : '0.0';

  // Group trophies by category
  const leagueTitles = managerProfile.trophies.filter(t => t.category === 'LEAGUE');
  const domesticCups = managerProfile.trophies.filter(t => t.category === 'DOMESTIC_CUP');
  const uclTrophies = managerProfile.trophies.filter(t => t.category === 'UCL');
  const superCups = managerProfile.trophies.filter(t => t.category === 'SUPER_CUP');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-zinc-800 bg-zinc-900/40">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100 tracking-tight">
                Managerial Profile & Silverware Cabinet
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Official Hall of Fame record and career achievements
              </p>
            </div>
          </div>
          <button
            onClick={closeTrophyCabinet}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {/* Profile Card */}
          <div className="p-6 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300">
                  <User className="w-8 h-8 text-zinc-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-lg font-bold text-zinc-100">{managerProfile.name}</h3>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                      {managerProfile.isUnemployed ? 'UNATTACHED' : `${userClub?.name || 'Club'} Head Coach`}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1.5 text-xs text-zinc-400">
                    <span>
                      Reputation: <span className="font-mono text-amber-400 font-semibold">{managerProfile.reputation}/100</span>
                    </span>
                    <span>•</span>
                    <span>
                      Silverware: <span className="font-mono text-zinc-200 font-semibold">{managerProfile.trophies.length} Titles</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Career Record Grid */}
              <div className="grid grid-cols-4 gap-3">
                <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800/80 text-center">
                  <div className="text-[10px] font-mono text-zinc-500 uppercase">Matches</div>
                  <div className="text-sm font-mono font-bold text-zinc-200 mt-0.5">{managerProfile.careerMatches}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800/80 text-center">
                  <div className="text-[10px] font-mono text-zinc-500 uppercase">Record</div>
                  <div className="text-xs font-mono font-bold text-emerald-400 mt-0.5">
                    {managerProfile.careerWins}W-{managerProfile.careerDraws}D-{managerProfile.careerLosses}L
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800/80 text-center">
                  <div className="text-[10px] font-mono text-zinc-500 uppercase">Win Rate</div>
                  <div className="text-sm font-mono font-bold text-cyan-400 mt-0.5">{winRate}%</div>
                </div>
                <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800/80 text-center">
                  <div className="text-[10px] font-mono text-zinc-500 uppercase">Trophies</div>
                  <div className="text-sm font-mono font-bold text-amber-400 mt-0.5">{managerProfile.trophies.length}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Trophy Cabinet Visual Grid */}
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold mb-3 flex items-center gap-1.5">
              <Medal className="w-4 h-4 text-amber-400" />
              Trophy Cabinet & Major Honors
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {/* Champions League */}
              <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                  <Trophy className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-200">UEFA Champions League</span>
                    <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                      x{uclTrophies.length}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-1 truncate">
                    {uclTrophies.length > 0 ? uclTrophies.map(t => t.season).join(', ') : 'No titles yet'}
                  </div>
                </div>
              </div>

              {/* Domestic League */}
              <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                  <Trophy className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-200">Domestic League Title</span>
                    <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      x{leagueTitles.length}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-1 truncate">
                    {leagueTitles.length > 0 ? leagueTitles.map(t => t.season).join(', ') : 'No titles yet'}
                  </div>
                </div>
              </div>

              {/* Domestic Cup */}
              <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <Trophy className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-200">Domestic Cup (Copa/FA)</span>
                    <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      x{domesticCups.length}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-1 truncate">
                    {domesticCups.length > 0 ? domesticCups.map(t => t.season).join(', ') : 'No titles yet'}
                  </div>
                </div>
              </div>

              {/* Super Cups */}
              <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                  <Award className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-200">Super Cups</span>
                    <span className="font-mono text-xs font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                      x{superCups.length}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-1 truncate">
                    {superCups.length > 0 ? superCups.map(t => t.season).join(', ') : 'No titles yet'}
                  </div>
                </div>
              </div>

              {/* Manager of the Year Awards */}
              <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400 shrink-0">
                  <Star className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-200">Manager of Year</span>
                    <span className="font-mono text-xs font-bold text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20">
                      x{managerProfile.awards.filter(a => a.includes('Manager')).length}
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-1 truncate">
                    {managerProfile.awards.length > 0 ? managerProfile.awards.join(', ') : 'No personal awards'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 border-t border-zinc-800 bg-zinc-900/40 flex justify-end">
          <button
            onClick={closeTrophyCabinet}
            className="px-4 py-2 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
          >
            Close Cabinet
          </button>
        </div>
      </div>
    </div>
  );
}
