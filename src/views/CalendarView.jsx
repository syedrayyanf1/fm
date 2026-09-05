import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';
import {
  Play,
  FastForward,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Shield,
  Trophy,
} from 'lucide-react';

export default function CalendarView() {
  const currentDate = useGameStore(state => state.currentDate);
  const fixtures = useGameStore(state => state.fixtures);
  const clubs = useGameStore(state => state.clubs);
  const userClubId = useGameStore(state => state.userClubId);
  const getNextFixture = useGameStore(state => state.getNextFixture);
  const simulateNextMatch = useGameStore(state => state.simulateNextMatch);
  const launchMatchModal = useGameStore(state => state.launchMatchModal);
  const startSimulation = useGameStore(state => state.startSimulation);
  const isSimulating = useGameStore(state => state.isSimulating);
  const setJumpDateModalOpen = useGameStore(state => state.setJumpDateModalOpen);

  const nextFixture = getNextFixture();
  const [selectedFixtureId, setSelectedFixtureId] = useState(null);

  // Active month/year navigation state
  const [yearStr, monthStr] = (currentDate || '2026-08-10').split('-');
  const [viewYear, setViewYear] = useState(parseInt(yearStr, 10) || 2026);
  const [viewMonth, setViewMonth] = useState(parseInt(monthStr, 10) || 8);

  // Automatically keep view synchronized with simulation date
  useEffect(() => {
    if (currentDate) {
      const [y, m] = currentDate.split('-').map(Number);
      setViewYear(y);
      setViewMonth(m);
    }
  }, [currentDate]);

  const handlePrevMonth = () => {
    if (viewMonth === 1) {
      setViewYear(y => y - 1);
      setViewMonth(12);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 12) {
      setViewYear(y => y + 1);
      setViewMonth(1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  const handleResetToToday = () => {
    const [y, m] = currentDate.split('-').map(Number);
    setViewYear(y);
    setViewMonth(m);
  };

  // Format YYYY-MM-DD to "12 Aug 2026"
  const formatDate = (isoStr) => {
    if (!isoStr) return '';
    const parts = isoStr.split('-');
    if (parts.length !== 3) return isoStr;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = parseInt(parts[2], 10);
    const month = months[parseInt(parts[1], 10) - 1] || parts[1];
    const year = parts[0];
    return `${day} ${month} ${year}`;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const currentMonthName = monthNames[viewMonth - 1] || 'August';

  // User club fixtures
  const userFixtures = fixtures.filter(
    f => f.homeClubId === userClubId || f.awayClubId === userClubId
  );

  const selectedFixture = selectedFixtureId
    ? userFixtures.find(f => f.id === selectedFixtureId) || nextFixture || userFixtures[0]
    : nextFixture || userFixtures[0];

  const getFixtureDetails = (fixture) => {
    if (!fixture) return null;
    const isHome = fixture.homeClubId === userClubId;
    const opponentId = isHome ? fixture.awayClubId : fixture.homeClubId;
    const oppClub = clubs[opponentId] || {
      name: opponentId ? opponentId.charAt(0).toUpperCase() + opponentId.slice(1) : 'Opponent',
      shortName: opponentId?.slice(0, 3).toUpperCase() || 'OPP',
    };
    const isNext = nextFixture && nextFixture.id === fixture.id;
    const status = fixture.isPlayed ? 'Played' : isNext ? 'Next' : 'Upcoming';

    let scoreDisplay = null;
    if (fixture.isPlayed && fixture.result) {
      scoreDisplay = `${fixture.result.homeScore}–${fixture.result.awayScore}`;
    }

    const compName =
      fixture.competitionId === 'ucl'
        ? 'UEFA Champions League'
        : fixture.competitionId === 'copadelrey'
        ? 'Copa del Rey'
        : 'LaLiga EA Sports';

    return {
      ...fixture,
      isHome,
      opponent: oppClub.name,
      short: oppClub.shortName?.slice(0, 3).toUpperCase() || 'OPP',
      status,
      score: scoreDisplay,
      comp: compName,
      dateStr: formatDate(fixture.date),
      dayNumber: parseInt(fixture.date.split('-')[2], 10),
    };
  };

  const activeDossier = getFixtureDetails(selectedFixture);

  // Calculate days until active dossier fixture
  let daysUntil = 0;
  if (activeDossier && activeDossier.date) {
    const currentMs = new Date(currentDate).getTime();
    const fixtureMs = new Date(activeDossier.date).getTime();
    daysUntil = Math.max(0, Math.round((fixtureMs - currentMs) / (1000 * 60 * 60 * 24)));
  }

  // Dynamic Monthly Calendar Grid calculation
  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
  const firstDayOfWeek = (new Date(viewYear, viewMonth - 1, 1).getDay() + 6) % 7; // Monday=0
  const prevMonthDays = new Date(viewYear, viewMonth - 1, 0).getDate();

  const calendarDays = [];

  // Trailing days from previous month
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    calendarDays.push({
      dayNumber: prevMonthDays - i,
      isCurrentMonth: false,
      dateStr: null,
      fixture: null,
      isToday: false,
    });
  }

  // Days in current month
  for (let d = 1; d <= daysInMonth; d++) {
    const dayStr = String(d).padStart(2, '0');
    const mStr = String(viewMonth).padStart(2, '0');
    const cellDateStr = `${viewYear}-${mStr}-${dayStr}`;

    const rawFixture = userFixtures.find(f => f.date === cellDateStr);
    const mappedFixture = rawFixture ? getFixtureDetails(rawFixture) : null;

    calendarDays.push({
      dayNumber: d,
      isCurrentMonth: true,
      dateStr: cellDateStr,
      fixture: mappedFixture,
      isToday: cellDateStr === currentDate,
      isPast: cellDateStr < currentDate,
    });
  }

  // Leading days into next month
  const totalGridCells = Math.ceil(calendarDays.length / 7) * 7;
  const remainingCells = totalGridCells - calendarDays.length;
  for (let i = 1; i <= remainingCells; i++) {
    calendarDays.push({
      dayNumber: i,
      isCurrentMonth: false,
      dateStr: null,
      fixture: null,
      isToday: false,
    });
  }

  return (
    <div className="space-y-4">
      {/* Action Header Ribbon */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 hairline-card p-4 bg-zinc-900/40">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-zinc-400">Season Schedule</span>
            <span className="text-zinc-600">•</span>
            <span className="text-xs font-mono text-emerald-400">
              {currentMonthName} {viewYear}
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-semibold text-zinc-100 tracking-tight mt-0.5">
            Matchday Calendar & Fast-Sim Runner
          </h2>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Secondary Button: [ Jump to Date ] */}
          <button
            onClick={() => setJumpDateModalOpen(true)}
            disabled={isSimulating}
            className="btn-secondary text-xs disabled:opacity-50 cursor-pointer"
          >
            <FastForward className="w-3.5 h-3.5 mr-1.5 text-zinc-400" />
            <span>Jump to Date</span>
          </button>

          {/* Primary Button: [ Simulate to Next Fixture ] */}
          <button
            onClick={simulateNextMatch}
            disabled={isSimulating}
            className="btn-primary text-xs disabled:opacity-50 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 mr-1.5 fill-current" />
            <span>Simulate to Next Fixture</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Quiet Calendar + Matchday Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Monthly Calendar Grid (8 cols on lg) */}
        <div className="lg:col-span-8 hairline-card p-4 bg-zinc-900/40 space-y-3">
          
          {/* Month Navigation Header */}
          <div className="flex items-center justify-between text-xs text-zinc-400 pb-2 border-b border-white/[0.05]">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-zinc-200 font-mono text-sm">
                {currentMonthName} {viewYear}
              </span>
              <div className="flex items-center gap-1 ml-2">
                <button
                  onClick={handlePrevMonth}
                  className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                  title="Next Month"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleResetToToday}
                  className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 ml-1 cursor-pointer"
                >
                  Today
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-500">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Current Day
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span> Match Scheduled
              </span>
            </div>
          </div>

          {/* Day Names Header */}
          <div className="grid grid-cols-7 gap-1 text-center font-mono text-[11px] text-zinc-500">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Day Tiles */}
          <div className="grid grid-cols-7 gap-1.5">
            {calendarDays.map((cell, idx) => {
              const hasFixture = cell.fixture;
              const isSelected = selectedFixture && cell.fixture?.id === selectedFixture.id;

              if (!cell.isCurrentMonth) {
                return (
                  <div
                    key={idx}
                    className="min-h-[60px] sm:min-h-[76px] rounded p-1.5 opacity-20 text-zinc-600 font-mono text-xs select-none"
                  >
                    {cell.dayNumber}
                  </div>
                );
              }

              return (
                <div
                  key={idx}
                  onClick={() => cell.fixture && setSelectedFixtureId(cell.fixture.id)}
                  className={`min-h-[60px] sm:min-h-[76px] rounded-md p-1.5 flex flex-col justify-between transition-colors ${
                    cell.isToday
                      ? 'bg-zinc-800/90 border border-emerald-500/60 text-white shadow-sm ring-1 ring-emerald-500/20'
                      : hasFixture
                      ? 'bg-zinc-900/70 border border-white/[0.08] hover:border-white/[0.2] cursor-pointer'
                      : 'bg-zinc-900/20 border border-white/[0.03] hover:bg-zinc-900/40'
                  } ${isSelected ? 'ring-1 ring-white/50 border-white/40' : ''}`}
                >
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className={cell.isToday ? 'text-emerald-400 font-bold' : 'text-zinc-400'}>
                      {cell.dayNumber}
                    </span>
                    {cell.isToday && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    )}
                  </div>

                  {/* Subtle Match Chip */}
                  {hasFixture && (
                    <div className="mt-1">
                      <div
                        className={`px-1.5 py-1 rounded text-[10px] font-mono flex items-center justify-between border ${
                          cell.fixture.status === 'Played'
                            ? 'bg-zinc-800/60 border-white/[0.04] text-zinc-400'
                            : cell.fixture.status === 'Next'
                            ? 'bg-zinc-800 border-white/[0.25] text-zinc-100 font-medium shadow-sm ring-1 ring-emerald-500/30'
                            : 'bg-zinc-900 border-white/[0.06] text-zinc-300'
                        }`}
                      >
                        <span className="font-semibold truncate max-w-[42px] sm:max-w-none">
                          {cell.fixture.short}
                        </span>
                        <span className="text-[9px] text-zinc-500 ml-1">
                          {cell.fixture.isHome ? 'H' : 'A'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Fixture Details Dossier (4 cols on lg) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="hairline-card p-4 bg-zinc-900/40 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <span className="text-xs font-mono text-zinc-400">Fixture Dossier</span>
              <span
                className={`quiet-chip text-[10px] ${
                  activeDossier?.status === 'Next'
                    ? 'border-emerald-500/40 text-emerald-400 font-medium'
                    : ''
                }`}
              >
                {activeDossier?.status || 'Scheduled'}
              </span>
            </div>

            {activeDossier ? (
              <div className="space-y-3">
                <div>
                  <div className="text-[11px] font-mono text-zinc-500 uppercase flex items-center gap-1.5">
                    <Trophy className="w-3 h-3 text-zinc-400" />
                    <span>{activeDossier.comp}</span>
                  </div>
                  <h3 className="text-sm sm:text-base font-semibold text-zinc-100 mt-1">
                    FC Barcelona vs {activeDossier.opponent}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-zinc-400">
                    <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{activeDossier.isHome ? 'Spotify Camp Nou (Home)' : 'Away Fixture'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-xs">
                  <div className="p-2.5 rounded bg-zinc-900/60 border border-white/[0.04]">
                    <span className="text-[10px] text-zinc-500 block uppercase">Scheduled</span>
                    <strong className="text-zinc-200 text-xs">{activeDossier.dateStr}</strong>
                  </div>
                  <div className="p-2.5 rounded bg-zinc-900/60 border border-white/[0.04]">
                    <span className="text-[10px] text-zinc-500 block uppercase">Outcome</span>
                    <strong className="text-emerald-400 text-xs">
                      {activeDossier.score ? activeDossier.score : 'Pending'}
                    </strong>
                  </div>
                </div>

                {/* Matchday Action CTA */}
                {activeDossier && !activeDossier.isPlayed && (
                  <div className="pt-1">
                    {currentDate === activeDossier.date ? (
                      <button
                        onClick={() => launchMatchModal(activeDossier.id)}
                        className="w-full py-2.5 px-3 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-lg flex items-center justify-center gap-2 mt-1 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Enter Matchday Command Center</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => startSimulation(activeDossier.date)}
                        className="w-full btn-primary text-xs justify-center mt-1 cursor-pointer"
                      >
                        <FastForward className="w-3.5 h-3.5 fill-current" />
                        <span>
                          Simulate to Matchday ({daysUntil} {daysUntil === 1 ? 'Day' : 'Days'})
                        </span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-zinc-500">Select a fixture to inspect tactical dossier.</p>
            )}
          </div>

          {/* Quick Schedule Manifest */}
          <div className="hairline-card p-4 bg-zinc-900/40 space-y-2">
            <h4 className="text-xs font-mono text-zinc-400 pb-1 border-b border-white/[0.06] flex items-center justify-between">
              <span>Season Fixture Manifest</span>
              <span className="text-zinc-500 font-mono text-[11px]">{userFixtures.length} Matches</span>
            </h4>

            <div className="divide-y divide-white/[0.04] text-xs max-h-[380px] overflow-y-auto pr-1">
              {userFixtures.map(f => {
                const details = getFixtureDetails(f);
                if (!details) return null;
                const isSelected = selectedFixture?.id === f.id;

                return (
                  <div
                    key={f.id}
                    onClick={() => setSelectedFixtureId(f.id)}
                    className={`py-2 px-1.5 flex items-center justify-between cursor-pointer rounded transition-colors ${
                      isSelected
                        ? 'bg-white/[0.06] text-zinc-100 font-medium'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          details.status === 'Next'
                            ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50'
                            : details.status === 'Played'
                            ? 'bg-zinc-600'
                            : 'bg-zinc-500'
                        }`}
                      ></span>
                      <div className="truncate">
                        <span className="text-zinc-200">{details.opponent}</span>
                        <span className="text-[10px] font-mono text-zinc-500 ml-1.5">
                          {details.isHome ? 'H' : 'A'}
                        </span>
                      </div>
                    </div>
                    <span className="font-mono text-[11px] text-zinc-500 shrink-0 ml-2">
                      {details.score ? (
                        <span className="text-emerald-400 font-semibold">{details.score}</span>
                      ) : (
                        details.dateStr.split(' ')[0] + ' ' + details.dateStr.split(' ')[1]
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
