export type Position = 
  | 'GK' 
  | 'CB' | 'LB' | 'RB' 
  | 'CDM' | 'CM' | 'CAM' 
  | 'LM' | 'RM' 
  | 'LW' | 'RW' | 'ST';

export interface PlayerAttributes {
  attacking: number;  // 1-99
  creative: number;   // 1-99
  defending: number;  // 1-99
  physical: number;   // 1-99
  mental: number;     // 1-99
}

export interface PlayerTraits {
  clutch: number;         // 1-20
  consistency: number;    // 1-20
  adaptability: number;   // 1-20 (Dictates Transfer Settlement speed)
  workRate: 'LOW' | 'MEDIUM' | 'HIGH';
  injuryProneness: 'LOW' | 'NORMAL' | 'FRAGILE';
}

export interface Player {
  id: string;
  clubId: string;
  name: string;
  fullName?: string;
  shirtNumber?: number;
  photoUrl: string;
  nationality: string;
  age: number;
  primaryPosition: Position;
  secondaryPositions: Position[];
  reputation: number;       // 1-100
  attributes: PlayerAttributes;
  traits: PlayerTraits;
  overallRating: number;    // 1-99
  dynamicPotential: number;
  potentialCap: number;     // Absolute ceiling limit (Base + 5)
  sharpness: number;        // 0-100%
  stamina: number;          // 0-100%
  morale: number;           // 0-100
  formHistory: number[];    // Last 5 match scores (5.0 to 10.0 scale)
  settlementProgress: number; // 0.0 to 1.0 (Adaptation modifier)
  daysAtClub: number;
  isRetraining: boolean;
  targetPosition?: Position;
  retrainingProgress?: number;
  wagePerWeek: number;
  contractYearsLeft: number;
  releaseClause: number | null;
  marketValue: number;
  amortizationAnnualCost: number; // Fee / Years
  squadRole: 'STAR' | 'IMPORTANT' | 'ROTATION' | 'PROSPECT';
  unsettledStage: 0 | 1 | 2 | 3;
  isStarter: boolean;
  pitchX?: number;          // 0-100 tactical pitch X coordinate
  pitchY?: number;          // 0-100 tactical pitch Y coordinate
  role?: string;            // e.g. "Advanced Playmaker", "Inverted Winger"
  isInjured?: boolean;
  injuryDaysLeft?: number;
  injuryType?: string;
  isOnStrike?: boolean;
  honors?: string[];
}

export type Archetype = 'GEGENPRESS' | 'TIKI_TAKA' | 'DIRECT_COUNTER' | 'LOW_BLOCK';

export interface TacticalSetup {
  formation: '4-3-3' | '4-2-3-1' | '3-5-2' | '4-4-2' | '5-3-2';
  archetype: Archetype;
  defensiveLine: 'DEEP' | 'BALANCED' | 'HIGH';
  pressingIntensity: 'CONSERVATIVE' | 'BALANCED' | 'RELENTLESS';
  buildUpSpeed: 'SLOW_PATIENT' | 'BALANCED' | 'DIRECT_FAST';
  pitchWidth: 'NARROW' | 'BALANCED' | 'WIDE';
  roleToggles: {
    invertedFullbacks: boolean;
    poacherFocus: boolean;
    sweeperKeeper: boolean;
  };
}

export type ClubDNA = 'MONEYBALL' | 'WONDERKID_HOARDER' | 'GALACTICO' | 'DOMESTIC_POACHER' | 'HYBRID_LEGACY';

export interface ClubFacilities {
  stadiumCapacity: number;
  stadiumExecutiveBoxes: number;
  stadiumAtmosphereLevel: number; // 1-5
  commercialMegastoreLevel: number;// 1-5
  trainingGroundLevel: number;    // 1-5
  medicalCenterLevel: number;      // 1-5
  youthAcademyLevel: number;      // 1-5
}

export interface ClubFinances {
  balance: number;
  transferBudget: number;
  wageBudgetWeekly: number;
  totalBudgetPool?: number;
  allocatedFeePercentage: number; // Slider state: 0 to 100%
  annualOperatingRevenue: number;
  squadCostRatio: number;         // FFP compliance: Squad Cost / Revenue <= 0.70
  activeLoans: Array<{ id: string; principal: number; annualRepayment: number; yearsLeft: number }>;
  economicLeversSoldPercentage: number;
}


export interface BoardObjective {
  id: string;
  type: 'LEAGUE' | 'RIVALRY' | 'FINANCIAL' | 'HOLY_GRAIL';
  description: string;
  weight: number;
  targetProgress: number;
  currentProgress: number;
  isCompleted: boolean;
}

export interface Club {
  id: string;
  name: string;
  shortName: string;
  crestUrl: string;
  leagueId: string;
  reputation: number;
  dna: ClubDNA;
  rivalClubIds: string[];
  boardTrust: number; // 0-100%
  boardObjectives: BoardObjective[];
  tactics: TacticalSetup;
  facilities: ClubFacilities;
  finances: ClubFinances;
  relationsWithUser: number; // -100 to +100
  trophyHistory?: Array<{ id: string; name: string; season: string; category: string }>;
}

export interface FixtureEvent {
  minute: number;
  type: 'GOAL' | 'YELLOW' | 'RED' | 'INJURY';
  playerId: string;
  clubId: string;
  detail?: string;
}

export interface FixtureResult {
  homeScore: number;
  awayScore: number;
  homeXg: number;
  awayXg: number;
  events: FixtureEvent[];
}

export interface Fixture {
  id: string;
  competitionId: string;
  matchday: number;
  date: string; // 'YYYY-MM-DD'
  homeClubId: string;
  awayClubId: string;
  isPlayed: boolean;
  result?: FixtureResult;
}

export interface TableRow {
  clubId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: ('W' | 'D' | 'L')[];
  pointsDeduction?: number;
}

export interface Competition {
  id: string;
  name: string;
  country: string;
  tier: 1 | 2;
  simulationTier: 'DEEP' | 'SHALLOW';
  clubIds: string[];
  currentMatchday: number;
  totalMatchdays: number;
  table: TableRow[];
}

export interface RumorWireItem {
  id: string;
  headline: string;
  source: string;
  credibilityTier: 1 | 2 | 3;
  targetPlayerName: string;
  buyerClubName: string;
  timestamp: string;
}

export interface ScoutingRadarTarget {
  id: string;
  playerId?: string;
  name: string;
  photoUrl?: string;
  clubName: string;
  clubId?: string;
  position: string;
  age: number;
  nationality: string;
  fogRange: string;
  exactOvr: number;
  estFeeFormatted: string;
  wageEstimateFormatted: string;
  scoutConfidenceText: string;
  scoutPercent: number;
  baseFee: number;
  addons: number;
  weeklyWage: number;
  fogLevel?: 0 | 1 | 2 | 3;
  scoutedDays?: number;
  attributes?: PlayerAttributes;
  traits?: PlayerTraits;
  potentialCeiling?: string;
}

export interface FacilityUpgradeItem {
  id: string;
  name: string;
  category: string;
  level: number;
  maxLevel: number;
  summary: string;
  stat: string;
  cost: number;
  facilityKey: keyof ClubFacilities;
}

export interface GameDataPack {
  clubs: Record<string, Club>;
  players: Record<string, Player>;
  competitions: Record<string, Competition>;
  fixtures: Fixture[];
  rumors: RumorWireItem[];
}

export type SimInterruptReason =
  | 'MATCHDAY'
  | 'TRANSFER_BID'
  | 'MAJOR_INJURY'
  | 'PLAYER_MUTINY'
  | 'DEADLINE_DAY'
  | 'TARGET_REACHED'
  | 'YOUTH_INTAKE'
  | 'AWARDS_GALA'
  | 'SEASON_END'
  | 'BOARD_SACKED';

export interface SimInterruptPayload {
  reason: SimInterruptReason;
  detail: string;
  currentDate: string;
  relatedFixtureId?: string;
  relatedPlayerId?: string;
  relatedBidAmount?: number;
  relatedClubName?: string;
}

export interface InterruptPreferences {
  pauseOnBids: boolean;
  pauseOnInjuries: boolean;
  pauseOnMatchday: boolean;
}

