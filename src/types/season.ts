import { Position, PlayerAttributes, PlayerTraits } from './game';

export interface YouthProspect {
  id: string;
  name: string;
  position: Position;
  age: number; // 15-17
  nominalOvr: number; // 60-73
  dynamicPotential: number; // 72-94
  scoutedRating: string; // e.g. "68 (POT: 88–93)"
  personalityTag: '★ GENERATIONAL TALENT' | 'FIRST-TEAM PROSPECT' | 'SQUAD DEPTH' | 'RAW DIAMOND';
  attributes: PlayerAttributes;
  traits: PlayerTraits;
  isGenerationalWonderkid: boolean;
}

export interface AwardWinner {
  playerId: string;
  playerName: string;
  clubId: string;
  clubName: string;
  statValue: number | string; // e.g. 38 goals or 8.42 rating
  score?: number;
  awardType: 'BALLON_DOR' | 'GOLDEN_SHOE' | 'PLAYMAKER' | 'GOLDEN_GLOVE' | 'MANAGER_OF_YEAR';
}

export interface BallonDorPodium {
  winner: AwardWinner;
  second: AwardWinner;
  third: AwardWinner;
}

export interface AwardsGalaPayload {
  seasonYear: string; // e.g. '2026/27'
  ballonDor: BallonDorPodium;
  goldenShoe: AwardWinner;
  playmaker: AwardWinner;
  goldenGlove: AwardWinner;
  managerOfTheYear: {
    managerName: string;
    clubName: string;
    objectiveScore: number;
    description: string;
  };
}

export interface TrophyRecord {
  id: string;
  name: string;
  season: string;
  category: 'LEAGUE' | 'DOMESTIC_CUP' | 'UCL' | 'SUPER_CUP';
}

export interface ManagerProfile {
  name: string;
  reputation: number; // 1-100
  careerMatches: number;
  careerWins: number;
  careerDraws: number;
  careerLosses: number;
  trophies: TrophyRecord[];
  awards: string[];
  isUnemployed: boolean;
}

export interface JobVacancy {
  clubId: string;
  clubName: string;
  leagueId: string;
  leagueName: string;
  reputation: number;
  transferBudget: number;
  wageBudgetWeekly: number;
  expectation: string;
  requiredReputation: number;
}

export interface FfpAuditReport {
  seasonYear: string;
  squadCostRatio: number; // e.g. 0.64 (64%)
  totalSquadCost: number; // Wages + Amortization
  annualRevenue: number;
  status: 'COMPLIANT' | 'WARNING' | 'DEDUCTION';
  penaltyDetail: string;
  pointsDeduction: number;
  budgetFrozen: boolean;
}

export interface SeasonTransitionReport {
  previousSeason: string;
  newSeason: string;
  promotedClubs: Array<{ clubId: string; clubName: string; fromLeague: string; toLeague: string }>;
  relegatedClubs: Array<{ clubId: string; clubName: string; fromLeague: string; toLeague: string }>;
  leagueChampion: { clubId: string; clubName: string; points: number };
  uclWinner: { clubId: string; clubName: string };
  playersAgedCount: number;
  playersPotentialAdjustedCount: number;
}
