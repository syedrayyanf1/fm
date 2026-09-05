import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { 
  initMatchState, 
  simulateMinute, 
  simulateFullDeepMatch, 
  makeSubstitution 
} from '../../engine/deepEngine';
import { MatchSimulationState, SidelineShout } from '../../engine/matchTypes';
import MomentumBar from './MomentumBar';
import MatchCommentaryTicker from './MatchCommentaryTicker';
import LiveSquadPanel from './LiveSquadPanel';
import PostMatchSummary from './PostMatchSummary';
import { Play, Pause, FastForward, Megaphone, X, ShieldAlert } from 'lucide-react';

export default function MatchModal() {
  const isMatchModalOpen = useGameStore(state => state.isMatchModalOpen);
  const setIsMatchModalOpen = useGameStore(state => state.setIsMatchModalOpen);
  const activeMatchFixtureId = useGameStore(state => state.activeMatchFixtureId);
  const fixtures = useGameStore(state => state.fixtures);
  const clubs = useGameStore(state => state.clubs);
  const players = useGameStore(state => state.players);
  const userClubId = useGameStore(state => state.userClubId);
  const completeMatch = useGameStore(state => state.completeMatch);
  const showToast = useGameStore(state => state.showToast);

  const fixture = fixtures.find(f => f.id === activeMatchFixtureId);
  const homeClub = fixture ? clubs[fixture.homeClubId] : null;
  const awayClub = fixture ? clubs[fixture.awayClubId] : null;

  // Simulation Controls
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speed, setSpeed] = useState<'1x' | '2x'>('1x');
  const [activeShout, setActiveShout] = useState<SidelineShout | null>(null);
  const [shoutExpiryMinute, setShoutExpiryMinute] = useState<number>(0);

  // Match State
  const [simState, setSimState] = useState<MatchSimulationState | null>(null);

  // Initialize match state when modal opens
  useEffect(() => {
    if (isMatchModalOpen && fixture && homeClub && awayClub) {
      const homePlayers = Object.values(players).filter(p => p.clubId === homeClub.id);
      const awayPlayers = Object.values(players).filter(p => p.clubId === awayClub.id);

      const initial = initMatchState(
        fixture.id,
        homeClub,
        awayClub,
        homePlayers,
        awayPlayers
      );

      setSimState(initial);
      setIsPlaying(true);
      setActiveShout(null);
      setShoutExpiryMinute(0);
    }
  }, [isMatchModalOpen, fixture?.id]);

  // Main simulation timer loop
  useEffect(() => {
    if (!isMatchModalOpen || !isPlaying || !simState || simState.isFinished) return;

    // Pause at Half Time (45')
    if (simState.currentMinute === 45 && isPlaying) {
      setIsPlaying(false);
      showToast('Half Time Whistle', '45 minutes played. Review tactics and resume 2nd half.', 'normal');
      return;
    }

    const intervalTime = speed === '1x' ? 320 : 120;

    const timer = setInterval(() => {
      setSimState(prev => {
        if (!prev || prev.isFinished || prev.currentMinute >= 90) {
          clearInterval(timer);
          return prev ? { ...prev, isFinished: true } : null;
        }

        // Shout expiration check
        let currentShout = activeShout;
        if (activeShout && prev.currentMinute >= shoutExpiryMinute) {
          setActiveShout(null);
          currentShout = null;
        }

        return simulateMinute(prev, userClubId, homeClub!, awayClub!, currentShout);
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isMatchModalOpen, isPlaying, speed, simState?.currentMinute, simState?.isFinished, activeShout, shoutExpiryMinute]);

  if (!isMatchModalOpen || !fixture || !homeClub || !awayClub || !simState) return null;

  // Handle Instant Skip
  const handleInstantSkip = () => {
    const finished = simulateFullDeepMatch(simState, userClubId, homeClub, awayClub);
    setSimState(finished);
    setIsPlaying(false);
  };

  // Handle Sideline Shouts
  const handleShout = (shout: SidelineShout) => {
    setActiveShout(shout);
    setShoutExpiryMinute(simState.currentMinute + 10);
    const label = shout === 'DEMAND_MORE' ? 'Demand More' : shout === 'PRAISE' ? 'Praise Squad' : 'Focus Defense';
    showToast('Sideline Shout Applied', `${label} active for the next 10 match minutes.`, 'normal');
  };

  // Handle Substitutions
  const handleSubstitute = (playerOutId: string, playerInId: string) => {
    const isUserHome = simState.homeClubId === userClubId;
    const team = isUserHome ? 'HOME' : 'AWAY';
    const updated = makeSubstitution(simState, team, playerOutId, playerInId);
    setSimState(updated);
    showToast('Substitution Confirmed', 'Player introduced onto the pitch.', 'success');
  };

  // Post-match flush to store
  const handleFlushMatch = () => {
    // Map player stats for both lineups
    const playerStats: Record<string, any> = {};
    [...simState.homeLineup, ...simState.awayLineup].forEach(pState => {
      playerStats[pState.player.id] = pState;
    });

    completeMatch({
      fixtureId: fixture.id,
      homeScore: simState.homeScore,
      awayScore: simState.awayScore,
      homeXg: simState.homeXg,
      awayXg: simState.awayXg,
      events: simState.events,
      playerStats,
    });

    setIsMatchModalOpen(false);
  };

  const isUserHome = simState.homeClubId === userClubId;
  const userLineup = isUserHome ? simState.homeLineup : simState.awayLineup;
  const userBench = isUserHome ? simState.homeBench : simState.awayBench;
  const userSubsRemaining = isUserHome ? simState.subsRemaining.home : simState.subsRemaining.away;

  const matchStatus = simState.isFinished 
    ? 'FULL TIME' 
    : simState.currentMinute === 45 
    ? 'HALF TIME (PAUSED)' 
    : simState.currentMinute < 45 
    ? 'FIRST HALF' 
    : 'SECOND HALF';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div 
        className="w-full max-w-5xl bg-zinc-950 border border-zinc-800/90 rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[96vh]"
        role="dialog"
        aria-label="Live Match Command Terminal"
      >
        {/* 1. Header Scoreboard Ribbon */}
        <div className="px-5 py-4 bg-zinc-900/40 border-b border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Club Crests & Big Score */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-sm sm:text-base font-bold text-zinc-100">
                {homeClub.name}
              </span>
              <span className="text-zinc-500 font-mono text-xs hidden md:inline">
                ({homeClub.tactics.formation})
              </span>
            </div>

            {/* Large Bold Score & Minute */}
            <div className="flex items-center gap-2 bg-zinc-950 px-4 py-1.5 rounded-lg border border-white/[0.08] shadow-inner font-mono">
              <span className="text-xl sm:text-2xl font-black text-emerald-400 tabular-nums">
                {simState.homeScore}
              </span>
              <span className="text-zinc-600 font-bold">-</span>
              <span className="text-xl sm:text-2xl font-black text-zinc-100 tabular-nums">
                {simState.awayScore}
              </span>
              <div className="ml-2 pl-2 border-l border-zinc-800 flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${simState.isFinished ? 'bg-zinc-600' : 'bg-emerald-400 animate-pulse'}`} />
                <span className="text-xs font-bold text-zinc-300 tabular-nums">
                  {simState.currentMinute}&apos;
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="font-mono text-sm sm:text-base font-bold text-zinc-100">
                {awayClub.name}
              </span>
              <span className="text-zinc-500 font-mono text-xs hidden md:inline">
                ({awayClub.tactics.formation})
              </span>
            </div>
          </div>

          {/* Simulation Controls (Play/Pause, 1x/2x, Instant Skip) */}
          <div className="flex items-center gap-2 font-mono text-xs">
            {!simState.isFinished && (
              <>
                {/* Play / Pause Toggle */}
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-1.5 rounded bg-zinc-800 text-zinc-200 hover:bg-zinc-700 border border-white/[0.06] transition-colors"
                  title={isPlaying ? 'Pause simulation' : 'Resume simulation'}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                </button>

                {/* Speed Toggles */}
                <div className="flex items-center bg-zinc-950 p-0.5 rounded border border-white/[0.06]">
                  <button
                    onClick={() => setSpeed('1x')}
                    className={`px-2 py-1 rounded text-[11px] font-semibold transition-all ${
                      speed === '1x' ? 'bg-zinc-800 text-emerald-400' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    1x
                  </button>
                  <button
                    onClick={() => setSpeed('2x')}
                    className={`px-2 py-1 rounded text-[11px] font-semibold transition-all ${
                      speed === '2x' ? 'bg-zinc-800 text-emerald-400' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    2x
                  </button>
                </div>

                {/* Instant Skip Button */}
                <button
                  onClick={handleInstantSkip}
                  className="px-2.5 py-1.5 rounded bg-zinc-800/80 hover:bg-zinc-800 text-zinc-200 border border-white/[0.08] hover:border-emerald-500/40 text-[11px] flex items-center gap-1 transition-colors"
                  title="Simulate instantly to 90th minute"
                >
                  <FastForward className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Instant Skip</span>
                </button>
              </>
            )}

            {/* Dismiss Modal Button */}
            <button
              onClick={() => setIsMatchModalOpen(false)}
              className="p-1.5 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 ml-1 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. Main Live Command Center Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {/* Post Match Summary Card (Displayed when match reaches 90') */}
          {simState.isFinished ? (
            <PostMatchSummary
              state={simState}
              homeClub={homeClub}
              awayClub={awayClub}
              onComplete={handleFlushMatch}
            />
          ) : (
            <>
              {/* Top: Momentum Bar & Stats */}
              <MomentumBar
                homeClub={homeClub}
                awayClub={awayClub}
                momentum={simState.momentum}
                homePossessionPct={simState.homePossessionPct}
                homeShots={simState.homeShots}
                awayShots={simState.awayShots}
                homeShotsOnTarget={simState.homeShotsOnTarget}
                awayShotsOnTarget={simState.awayShotsOnTarget}
                homeXg={simState.homeXg}
                awayXg={simState.awayXg}
              />

              {/* Sideline Shouts Toolbar */}
              <div className="p-3 bg-zinc-900/40 border border-zinc-800/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
                <div className="flex items-center gap-2 text-zinc-300">
                  <Megaphone className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold">Sideline Shouts:</span>
                  {activeShout && (
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
                      Active: {activeShout} (until {shoutExpiryMinute}&apos;)
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleShout('DEMAND_MORE')}
                    className={`px-2.5 py-1.5 rounded border transition-all ${
                      activeShout === 'DEMAND_MORE'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        : 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    [ Demand More ]
                  </button>

                  <button
                    onClick={() => handleShout('PRAISE')}
                    className={`px-2.5 py-1.5 rounded border transition-all ${
                      activeShout === 'PRAISE'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        : 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    [ Praise ]
                  </button>

                  <button
                    onClick={() => handleShout('FOCUS')}
                    className={`px-2.5 py-1.5 rounded border transition-all ${
                      activeShout === 'FOCUS'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        : 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    [ Focus ]
                  </button>
                </div>
              </div>

              {/* Split View: Commentary Ticker (Left) & Live Squad Energy/Ratings (Right) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Left: Terminal Commentary Feed */}
                <div className="lg:col-span-7">
                  <MatchCommentaryTicker events={simState.events} />
                </div>

                {/* Right: Live Squad Energy & Substitutions */}
                <div className="lg:col-span-5">
                  <LiveSquadPanel
                    lineup={userLineup}
                    bench={userBench}
                    subsRemaining={userSubsRemaining}
                    onSubstitute={handleSubstitute}
                  />
                </div>
              </div>
            </>
          )}

        </div>

        {/* Footer Status Line */}
        <div className="px-5 py-2.5 bg-zinc-950 border-t border-white/[0.04] flex items-center justify-between text-[11px] font-mono text-zinc-500">
          <span>Simulation Engine: Deep Tactical Battle v26.4</span>
          <span>Status: {matchStatus}</span>
        </div>
      </div>
    </div>
  );
}
