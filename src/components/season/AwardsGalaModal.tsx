import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { Trophy, Award, Crown, Zap, Shield, Sparkles, X, Check, Star } from 'lucide-react';

export default function AwardsGalaModal() {
  const isAwardsGalaOpen = useGameStore(state => state.isAwardsGalaOpen);
  const activeGalaPayload = useGameStore(state => state.activeGalaPayload);
  const closeAwardsGalaModal = useGameStore(state => state.closeAwardsGalaModal);

  if (!isAwardsGalaOpen || !activeGalaPayload) return null;

  const { ballonDor, goldenShoe, playmaker, goldenGlove, managerOfTheYear, seasonYear } = activeGalaPayload;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-zinc-950 border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden shadow-amber-950/20">
        {/* Top Gold Accent Bar */}
        <div className="h-1 bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-600" />

        {/* Gala Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-zinc-800/80 bg-zinc-900/40">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-zinc-100 tracking-tight">
                  Annual World Football Awards Gala
                </h1>
                <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 font-semibold">
                  {seasonYear} EDITION
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Honoring the pinnacle of global sporting excellence across domestic and continental campaigns
              </p>
            </div>
          </div>
          <button
            onClick={closeAwardsGalaModal}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* BALLON D'OR PODIUM */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Crown className="w-4 h-4 text-amber-400" />
              <h2 className="text-xs font-mono uppercase tracking-wider text-amber-400/90 font-bold">
                The Ballon d'Or • World Player of the Year
              </h2>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {/* 2nd Place */}
              <div className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800 flex flex-col items-center text-center relative overflow-hidden">
                <div className="absolute top-3 right-3 text-xs font-mono text-zinc-500 font-bold">
                  2ND
                </div>
                <div className="w-16 h-16 rounded-full bg-zinc-800 border-2 border-zinc-600 flex items-center justify-center text-zinc-300 mb-3 font-mono text-lg font-bold">
                  🥈
                </div>
                <div className="font-semibold text-zinc-200 text-sm">{ballonDor.second.playerName}</div>
                <div className="text-xs text-zinc-400 mt-0.5">{ballonDor.second.clubName}</div>
                <div className="mt-3 text-xs font-mono text-zinc-400 bg-zinc-800/60 px-3 py-1 rounded-md border border-zinc-700/50">
                  {ballonDor.second.statValue}
                </div>
                <div className="mt-2 text-[11px] font-mono text-zinc-500">
                  Rating Score: <span className="text-zinc-300 font-semibold">{ballonDor.second.score}</span>
                </div>
              </div>

              {/* 1st Place (WINNER) */}
              <div className="p-6 rounded-xl bg-gradient-to-b from-amber-500/10 via-zinc-900/70 to-zinc-950 border-2 border-amber-500/50 flex flex-col items-center text-center relative shadow-xl shadow-amber-950/30 scale-105 z-10">
                <div className="absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  WINNER
                </div>
                <div className="w-20 h-20 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-amber-300 mb-3 shadow-lg shadow-amber-500/20">
                  <Trophy className="w-10 h-10 text-amber-400" />
                </div>
                <div className="font-bold text-zinc-100 text-base flex items-center gap-1.5">
                  {ballonDor.winner.playerName}
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                </div>
                <div className="text-xs text-amber-300/80 font-medium mt-0.5">{ballonDor.winner.clubName}</div>
                <div className="mt-3 text-xs font-mono text-amber-200 bg-amber-500/10 px-3 py-1.5 rounded-md border border-amber-500/30 font-semibold">
                  {ballonDor.winner.statValue}
                </div>
                <div className="mt-2 text-xs font-mono text-zinc-400">
                  Ballon d'Or Index: <span className="text-amber-400 font-bold">{ballonDor.winner.score} pts</span>
                </div>
              </div>

              {/* 3rd Place */}
              <div className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800 flex flex-col items-center text-center relative overflow-hidden">
                <div className="absolute top-3 right-3 text-xs font-mono text-zinc-500 font-bold">
                  3RD
                </div>
                <div className="w-16 h-16 rounded-full bg-zinc-800 border-2 border-amber-900/60 flex items-center justify-center text-amber-700 mb-3 font-mono text-lg font-bold">
                  🥉
                </div>
                <div className="font-semibold text-zinc-200 text-sm">{ballonDor.third.playerName}</div>
                <div className="text-xs text-zinc-400 mt-0.5">{ballonDor.third.clubName}</div>
                <div className="mt-3 text-xs font-mono text-zinc-400 bg-zinc-800/60 px-3 py-1 rounded-md border border-zinc-700/50">
                  {ballonDor.third.statValue}
                </div>
                <div className="mt-2 text-[11px] font-mono text-zinc-500">
                  Rating Score: <span className="text-zinc-300 font-semibold">{ballonDor.third.score}</span>
                </div>
              </div>
            </div>
          </div>

          {/* INDIVIDUAL MAJOR HONORS */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-4 h-4 text-zinc-400" />
              <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold">
                European & Continental Laurels
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Golden Shoe */}
              <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono uppercase text-zinc-500 font-semibold">Golden Shoe</span>
                  <Zap className="w-4 h-4 text-amber-400" />
                </div>
                <div className="font-semibold text-zinc-200 text-sm truncate">{goldenShoe.playerName}</div>
                <div className="text-xs text-zinc-400 mt-0.5 truncate">{goldenShoe.clubName}</div>
                <div className="mt-3 font-mono text-xs text-amber-400 font-semibold bg-zinc-900 px-2.5 py-1 rounded border border-zinc-800">
                  {goldenShoe.statValue}
                </div>
              </div>

              {/* Playmaker */}
              <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono uppercase text-zinc-500 font-semibold">Playmaker of Year</span>
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="font-semibold text-zinc-200 text-sm truncate">{playmaker.playerName}</div>
                <div className="text-xs text-zinc-400 mt-0.5 truncate">{playmaker.clubName}</div>
                <div className="mt-3 font-mono text-xs text-cyan-400 font-semibold bg-zinc-900 px-2.5 py-1 rounded border border-zinc-800">
                  {playmaker.statValue}
                </div>
              </div>

              {/* Golden Glove */}
              <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono uppercase text-zinc-500 font-semibold">Golden Glove</span>
                  <Shield className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="font-semibold text-zinc-200 text-sm truncate">{goldenGlove.playerName}</div>
                <div className="text-xs text-zinc-400 mt-0.5 truncate">{goldenGlove.clubName}</div>
                <div className="mt-3 font-mono text-xs text-emerald-400 font-semibold bg-zinc-900 px-2.5 py-1 rounded border border-zinc-800">
                  {goldenGlove.statValue}
                </div>
              </div>

              {/* Manager of the Year */}
              <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono uppercase text-zinc-500 font-semibold">Manager of Year</span>
                  <Crown className="w-4 h-4 text-purple-400" />
                </div>
                <div className="font-semibold text-zinc-200 text-sm truncate">{managerOfTheYear.managerName}</div>
                <div className="text-xs text-zinc-400 mt-0.5 truncate">{managerOfTheYear.clubName}</div>
                <div className="mt-3 font-mono text-[11px] text-purple-300 font-semibold bg-zinc-900 px-2 py-1 rounded border border-zinc-800 truncate">
                  {managerOfTheYear.description.split('by ')[1] || managerOfTheYear.description}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 border-t border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
          <div className="text-xs text-zinc-500">
            Awards history recorded to player profiles & club trophies.
          </div>
          <button
            onClick={closeAwardsGalaModal}
            className="px-5 py-2 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            Conclude Awards Gala
          </button>
        </div>
      </div>
    </div>
  );
}
