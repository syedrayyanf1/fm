import React from 'react';
import { Player, Club } from '../../types/game';
import SafePlayerPhoto from '../common/SafePlayerPhoto';
import {
  X,
  Shield,
  Zap,
  TrendingUp,
  DollarSign,
  Briefcase,
  Eye,
  Send,
  UserCheck,
  AlertTriangle,
  Flame,
} from 'lucide-react';

interface PlayerActionDrawerProps {
  player: Player | null;
  club?: Club;
  userClubId: string;
  isTransferListed: boolean;
  onClose: () => void;
  onDeployScout: (playerId: string) => void;
  onApproach: (playerId: string) => void;
  onBid: (playerId: string) => void;
  onToggleTransferList: (playerId: string) => void;
  onOfferToClubs: (playerId: string) => void;
}

export default function PlayerActionDrawer({
  player,
  club,
  userClubId,
  isTransferListed,
  onClose,
  onDeployScout,
  onApproach,
  onBid,
  onToggleTransferList,
  onOfferToClubs,
}: PlayerActionDrawerProps) {
  if (!player) return null;

  const isUserPlayer = player.clubId === userClubId;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-zinc-950 border-l border-zinc-800/90 shadow-2xl h-full flex flex-col z-10 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800/80 bg-zinc-900/60">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-zinc-800 text-amber-400 border border-amber-500/20">
              {player.primaryPosition}
            </span>
            <span className="text-xs font-mono text-zinc-400">
              {club?.name || 'Free Agent'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 font-mono text-xs">
          {/* Profile Card */}
          <div className="flex items-center gap-4 bg-zinc-900/40 p-4 rounded-xl border border-zinc-800/60">
            <div className="relative">
              <SafePlayerPhoto
                photoUrl={player.photoUrl}
                name={player.name}
                className="w-20 h-20 rounded-full object-cover border-2 border-zinc-700/80 shadow-md"
              />
              <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 text-xs font-bold rounded bg-amber-500 text-zinc-950 font-mono shadow">
                {player.overallRating}
              </span>
            </div>

            <div className="flex-1 min-w-0 space-y-1">
              <h3 className="text-base font-bold text-zinc-100 truncate font-sans">
                {player.name}
              </h3>
              <p className="text-zinc-400 text-xs flex items-center gap-1.5">
                <span>{player.nationality}</span>
                <span>•</span>
                <span>{player.age} yrs</span>
              </p>
              <div className="flex items-center gap-3 pt-1 text-zinc-300">
                <div>
                  <span className="text-zinc-500 text-[10px] block">VALUE</span>
                  <span className="font-bold text-emerald-400">
                    €{(player.marketValue / 1e6).toFixed(1)}M
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px] block">WAGE</span>
                  <span className="font-bold text-zinc-200">
                    €{(player.wagePerWeek / 1e3).toFixed(0)}k/wk
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Status Badge */}
          {isUserPlayer ? (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-blue-950/40 border border-blue-800/50 text-blue-300">
              <UserCheck className="w-4 h-4 text-blue-400 shrink-0" />
              <span>Registered squad member in your first team.</span>
            </div>
          ) : isTransferListed ? (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-950/40 border border-amber-800/50 text-amber-300">
              <Flame className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Player has been transfer listed by their club!</span>
            </div>
          ) : null}

          {/* Pillar Attributes */}
          <div className="space-y-2">
            <h4 className="text-zinc-400 font-semibold tracking-wider text-[11px] uppercase">
              Core Attributes
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {player.attributes && (
                <>
                  <div className="bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800/60 flex justify-between items-center">
                    <span className="text-zinc-400">Attacking</span>
                    <span className={`font-bold tabular-nums ${player.attributes.attacking >= 80 ? 'text-amber-400' : 'text-zinc-200'}`}>
                      {player.attributes.attacking}
                    </span>
                  </div>
                  <div className="bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800/60 flex justify-between items-center">
                    <span className="text-zinc-400">Creative</span>
                    <span className={`font-bold tabular-nums ${player.attributes.creative >= 80 ? 'text-amber-400' : 'text-zinc-200'}`}>
                      {player.attributes.creative}
                    </span>
                  </div>
                  <div className="bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800/60 flex justify-between items-center">
                    <span className="text-zinc-400">Defending</span>
                    <span className={`font-bold tabular-nums ${player.attributes.defending >= 80 ? 'text-amber-400' : 'text-zinc-200'}`}>
                      {player.attributes.defending}
                    </span>
                  </div>
                  <div className="bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800/60 flex justify-between items-center">
                    <span className="text-zinc-400">Physical</span>
                    <span className={`font-bold tabular-nums ${player.attributes.physical >= 80 ? 'text-amber-400' : 'text-zinc-200'}`}>
                      {player.attributes.physical}
                    </span>
                  </div>
                  <div className="bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800/60 flex justify-between items-center col-span-2">
                    <span className="text-zinc-400">Mental & Leadership</span>
                    <span className={`font-bold tabular-nums ${player.attributes.mental >= 80 ? 'text-amber-400' : 'text-zinc-200'}`}>
                      {player.attributes.mental}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Personality Traits */}
          {player.traits && (
            <div className="space-y-2">
              <h4 className="text-zinc-400 font-semibold tracking-wider text-[11px] uppercase">
                Psychological Profile
              </h4>
              <div className="bg-zinc-900/40 p-3 rounded-lg border border-zinc-800/60 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Clutch Rating</span>
                  <span className="text-zinc-200 tabular-nums">{player.traits.clutch}/20</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Consistency</span>
                  <span className="text-zinc-200 tabular-nums">{player.traits.consistency}/20</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Adaptability</span>
                  <span className="text-zinc-200 tabular-nums">{player.traits.adaptability}/20</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Work Rate</span>
                  <span className="text-amber-400">{player.traits.workRate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Injury Risk</span>
                  <span className={player.traits.injuryProneness === 'HIGH' ? 'text-red-400' : 'text-emerald-400'}>
                    {player.traits.injuryProneness}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Contract Details */}
          <div className="space-y-2">
            <h4 className="text-zinc-400 font-semibold tracking-wider text-[11px] uppercase">
              Contract Terms
            </h4>
            <div className="bg-zinc-900/40 p-3 rounded-lg border border-zinc-800/60 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-zinc-500">Years Remaining</span>
                <span className="text-zinc-200">{player.contractYearsLeft || 3} seasons</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Release Clause</span>
                <span className="text-zinc-200">
                  {player.releaseClause ? `€${(player.releaseClause / 1e6).toFixed(1)}M` : 'None'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Squad Role</span>
                <span className="text-zinc-200">{player.squadRole || 'REGULAR'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-4 border-t border-zinc-800/80 bg-zinc-900/80 font-mono space-y-2">
          {isUserPlayer ? (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onToggleTransferList(player.id)}
                className={`w-full py-2.5 px-3 rounded-lg font-semibold text-xs transition border flex items-center justify-center gap-1.5 ${
                  isTransferListed
                    ? 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/40 hover:bg-amber-500/20'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                {isTransferListed ? 'Remove Listed' : 'Transfer List'}
              </button>
              <button
                onClick={() => onOfferToClubs(player.id)}
                className="w-full py-2.5 px-3 rounded-lg font-semibold text-xs transition bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60 flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5 text-amber-400" />
                Offer to Clubs
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <button
                onClick={() => onBid(player.id)}
                className="w-full py-2.5 px-4 rounded-lg font-bold text-xs bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-md transition flex items-center justify-center gap-2"
              >
                <DollarSign className="w-4 h-4" />
                Submit Formal Bid
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onApproach(player.id)}
                  className="py-2 px-3 rounded-lg font-semibold text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60 transition flex items-center justify-center gap-1.5"
                >
                  <Briefcase className="w-3.5 h-3.5 text-zinc-400" />
                  Inquire / Approach
                </button>
                <button
                  onClick={() => onDeployScout(player.id)}
                  className="py-2 px-3 rounded-lg font-semibold text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60 transition flex items-center justify-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5 text-zinc-400" />
                  Deploy Scout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
