import { Player, TacticalSetup } from '../types/game';

export interface MatchEvent {
  minute: number;
  type: 'GOAL' | 'CHANCE_MISSED' | 'SAVED' | 'YELLOW' | 'RED' | 'INJURY' | 'SUBSTITUTION';
  team: 'HOME' | 'AWAY';
  playerId: string;
  playerName: string;
  assistPlayerId?: string;
  assistPlayerName?: string;
  xg?: number;
  description: string;
}

export interface InGamePlayerState {
  player: Player;
  currentStamina: number; // 0-100% (drains during match)
  effectiveRating: number; // Recomputed dynamically based on fatigue
  matchRating: number;    // 5.0 to 10.0 scale
  goals: number;
  assists: number;
  shots: number;
  xgContributed: number;
  yellowCard: boolean;
  redCard: boolean;
  injured: boolean;
}

export interface MatchSimulationState {
  fixtureId: string;
  homeClubId: string;
  awayClubId: string;
  homeTactics: TacticalSetup;
  awayTactics: TacticalSetup;
  homeLineup: InGamePlayerState[];
  awayLineup: InGamePlayerState[];
  homeBench: InGamePlayerState[];
  awayBench: InGamePlayerState[];
  currentMinute: number;
  homeScore: number;
  awayScore: number;
  homeXg: number;
  awayXg: number;
  homeShots: number;
  awayShots: number;
  homeShotsOnTarget: number;
  awayShotsOnTarget: number;
  homePossessionPct: number;
  momentum: number; // -100 (pure Away dominance) to +100 (pure Home dominance)
  events: MatchEvent[];
  isFinished: boolean;
  subsRemaining: { home: number; away: number };
}

export type SidelineShout = 'DEMAND_MORE' | 'PRAISE' | 'FOCUS';
