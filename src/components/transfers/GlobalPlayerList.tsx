import React, { useState, useMemo } from 'react';
import { Player, Club, Competition } from '../../types/game';
import SafePlayerPhoto from '../common/SafePlayerPhoto';
import PlayerSearchBar, { SearchFilters } from './PlayerSearchBar';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ExternalLink } from 'lucide-react';

interface GlobalPlayerListProps {
  players: Record<string, Player>;
  clubs: Record<string, Club>;
  competitions: Record<string, Competition>;
  userClubId: string;
  transferListedIds: string[];
  onSelectPlayer: (player: Player) => void;
}

const PAGE_SIZE = 50;

export default function GlobalPlayerList({
  players,
  clubs,
  competitions,
  userClubId,
  transferListedIds,
  onSelectPlayer,
}: GlobalPlayerListProps) {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    positionCategory: 'ALL',
    leagueId: 'ALL',
    minAge: 16,
    maxAge: 40,
    maxValue: 200,
    sortBy: 'ovr',
    sortOrder: 'desc',
  });

  const allPlayersArray = useMemo(() => Object.values(players), [players]);

  // Filter & Sort Logic
  const filteredPlayers = useMemo(() => {
    const query = filters.query.toLowerCase().trim();

    return allPlayersArray.filter(p => {
      // Name & Club query
      if (query) {
        const clubName = clubs[p.clubId]?.name?.toLowerCase() || '';
        const playerName = p.name.toLowerCase();
        const nat = p.nationality.toLowerCase();
        if (!playerName.includes(query) && !clubName.includes(query) && !nat.includes(query)) {
          return false;
        }
      }

      // Position category
      if (filters.positionCategory !== 'ALL') {
        const pos = p.primaryPosition;
        if (filters.positionCategory === 'GK' && pos !== 'GK') return false;
        if (filters.positionCategory === 'DEF' && !['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(pos)) return false;
        if (filters.positionCategory === 'MID' && !['CDM', 'CM', 'CAM', 'LM', 'RM'].includes(pos)) return false;
        if (filters.positionCategory === 'ATT' && !['ST', 'CF', 'LW', 'RW'].includes(pos)) return false;
      }

      // League filter
      if (filters.leagueId !== 'ALL') {
        const club = clubs[p.clubId];
        if (!club || club.leagueId !== filters.leagueId) return false;
      }

      // Age filter
      if (p.age < filters.minAge || p.age > filters.maxAge) return false;

      // Max value filter (in millions)
      const valM = p.marketValue / 1_000_000;
      if (valM > filters.maxValue) return false;

      return true;
    }).sort((a, b) => {
      let comparison = 0;
      if (filters.sortBy === 'ovr') {
        comparison = b.overallRating - a.overallRating;
      } else if (filters.sortBy === 'value') {
        comparison = b.marketValue - a.marketValue;
      } else if (filters.sortBy === 'wage') {
        comparison = b.wagePerWeek - a.wagePerWeek;
      } else if (filters.sortBy === 'age') {
        comparison = a.age - b.age;
      }
      return filters.sortOrder === 'asc' ? -comparison : comparison;
    });
  }, [allPlayersArray, clubs, filters]);

  // Reset page when filters change
  React.useEffect(() => {
    setPage(1);
  }, [filters]);

  const totalPages = Math.max(1, Math.ceil(filteredPlayers.length / PAGE_SIZE));
  const paginatedPlayers = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredPlayers.slice(start, start + PAGE_SIZE);
  }, [filteredPlayers, page]);

  const getPositionBadgeColor = (pos: string) => {
    if (pos === 'GK') return 'bg-amber-950/60 text-amber-300 border-amber-800/40';
    if (['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(pos)) return 'bg-blue-950/60 text-blue-300 border-blue-800/40';
    if (['CDM', 'CM', 'CAM', 'LM', 'RM'].includes(pos)) return 'bg-emerald-950/60 text-emerald-300 border-emerald-800/40';
    return 'bg-rose-950/60 text-rose-300 border-rose-800/40';
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <PlayerSearchBar
        filters={filters}
        onChange={setFilters}
        competitions={competitions}
        totalCount={allPlayersArray.length}
        filteredCount={filteredPlayers.length}
      />

      {/* Players Table */}
      <div className="bg-zinc-950 border border-zinc-800/80 rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-zinc-900/90 text-zinc-400 border-b border-zinc-800/80 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Player</th>
                <th className="py-3 px-3">Club / League</th>
                <th className="py-3 px-3 text-center">Pos</th>
                <th className="py-3 px-3 text-center">Age</th>
                <th className="py-3 px-3 text-center">OVR</th>
                <th className="py-3 px-3 text-right">Value</th>
                <th className="py-3 px-3 text-right">Wage</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/40">
              {paginatedPlayers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-500">
                    No players matching the active filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedPlayers.map(player => {
                  const club = clubs[player.clubId];
                  const league = club ? competitions[club.leagueId] : undefined;
                  const isUser = player.clubId === userClubId;
                  const isListed = transferListedIds.includes(player.id);

                  return (
                    <tr
                      key={player.id}
                      onClick={() => onSelectPlayer(player)}
                      className="hover:bg-zinc-900/60 transition cursor-pointer group"
                    >
                      {/* Player Info */}
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-3">
                          <SafePlayerPhoto
                            photoUrl={player.photoUrl}
                            name={player.name}
                            className="w-8 h-8 rounded-full object-cover border border-zinc-700/60 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-semibold text-zinc-100 group-hover:text-amber-400 transition truncate">
                              {player.name}
                            </div>
                            <div className="text-zinc-500 text-[10px] flex items-center gap-1">
                              <span>{player.nationality}</span>
                              {isUser && (
                                <span className="text-blue-400 font-bold">• YOUR SQUAD</span>
                              )}
                              {isListed && (
                                <span className="text-amber-400 font-bold">• LISTED</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Club & League */}
                      <td className="py-2.5 px-3">
                        <div className="text-zinc-300 truncate max-w-[140px]">
                          {club?.name || 'Unknown'}
                        </div>
                        <div className="text-zinc-500 text-[10px] truncate max-w-[140px]">
                          {league?.name || 'Top Division'}
                        </div>
                      </td>

                      {/* Position */}
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${getPositionBadgeColor(
                            player.primaryPosition
                          )}`}
                        >
                          {player.primaryPosition}
                        </span>
                      </td>

                      {/* Age */}
                      <td className="py-2.5 px-3 text-center text-zinc-400 tabular-nums">
                        {player.age}
                      </td>

                      {/* OVR */}
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`font-bold tabular-nums px-1.5 py-0.5 rounded ${
                            player.overallRating >= 85
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : player.overallRating >= 80
                              ? 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                              : 'text-zinc-400'
                          }`}
                        >
                          {player.overallRating}
                        </span>
                      </td>

                      {/* Value */}
                      <td className="py-2.5 px-3 text-right font-medium text-emerald-400 tabular-nums">
                        €{(player.marketValue / 1_000_000).toFixed(1)}M
                      </td>

                      {/* Wage */}
                      <td className="py-2.5 px-3 text-right text-zinc-400 tabular-nums">
                        €{(player.wagePerWeek / 1_000).toFixed(0)}k/w
                      </td>

                      {/* Action */}
                      <td className="py-2.5 px-4 text-center">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            onSelectPlayer(player);
                          }}
                          className="px-2.5 py-1 rounded bg-zinc-800/80 hover:bg-amber-500 hover:text-zinc-950 text-zinc-300 text-[11px] font-semibold transition border border-zinc-700/60 inline-flex items-center gap-1"
                        >
                          <span>View</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 border-t border-zinc-800/80 bg-zinc-900/60 font-mono text-xs">
          <div className="text-zinc-400">
            Showing{' '}
            <span className="text-zinc-200 tabular-nums font-semibold">
              {filteredPlayers.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}
            </span>{' '}
            to{' '}
            <span className="text-zinc-200 tabular-nums font-semibold">
              {Math.min(page * PAGE_SIZE, filteredPlayers.length)}
            </span>{' '}
            of{' '}
            <span className="text-zinc-200 tabular-nums font-semibold">
              {filteredPlayers.length.toLocaleString()}
            </span>{' '}
            players
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(1)}
              disabled={page === 1}
              className="p-1 rounded bg-zinc-800 text-zinc-300 disabled:opacity-30 hover:bg-zinc-700 transition"
              title="First Page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1 rounded bg-zinc-800 text-zinc-300 disabled:opacity-30 hover:bg-zinc-700 transition"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 py-1 bg-zinc-950 border border-zinc-800 rounded text-zinc-200 tabular-nums">
              Page {page} of {totalPages}
            </span>

            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1 rounded bg-zinc-800 text-zinc-300 disabled:opacity-30 hover:bg-zinc-700 transition"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
              className="p-1 rounded bg-zinc-800 text-zinc-300 disabled:opacity-30 hover:bg-zinc-700 transition"
              title="Last Page"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
