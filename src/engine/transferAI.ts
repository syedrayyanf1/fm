import { Club, Player, ClubDNA, Position } from '../types/game';

export interface SquadHole {
  position: Position;
  currentOvr: number;
  urgency: 'HIGH' | 'CRITICAL';
  reason: string;
}

export interface RivalClubBid {
  clubId: string;
  clubName: string;
  wageOfferWeekly: number;
  transferFeeOffered: number;
  squadRole: 'STAR' | 'IMPORTANT' | 'ROTATION';
  preferenceScore: number;
}

/**
 * 5.1 AI Squad Hole Detection:
 * Scans each position. If a starter's OVR is 3+ points lower than the club's reputation tier,
 * or if a starter reaches age >= 32, generates a high-priority recruitment target.
 */
export function detectSquadHoles(club: Club, players: Player[]): SquadHole[] {
  const clubPlayers = players.filter(p => p.clubId === club.id);
  const targetOvr = Math.max(70, Math.round(club.reputation * 0.92));
  const holes: SquadHole[] = [];

  const keyPositions: Position[] = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST'];

  for (const pos of keyPositions) {
    const posPlayers = clubPlayers.filter(p => p.primaryPosition === pos);
    const starter = posPlayers.find(p => p.isStarter) || posPlayers[0];

    if (!starter) {
      holes.push({
        position: pos,
        currentOvr: 0,
        urgency: 'CRITICAL',
        reason: `Vacant starting role for ${pos}`,
      });
    } else if (starter.overallRating < targetOvr - 3) {
      holes.push({
        position: pos,
        currentOvr: starter.overallRating,
        urgency: 'HIGH',
        reason: `${starter.name} (${starter.overallRating} OVR) below target standard (${targetOvr} OVR)`,
      });
    } else if (starter.age >= 32) {
      holes.push({
        position: pos,
        currentOvr: starter.overallRating,
        urgency: 'HIGH',
        reason: `${starter.name} is ${starter.age} years old; succession planning required`,
      });
    }
  }

  return holes;
}

/**
 * 5.2 Club DNA Filtering:
 * Validates if an AI club would pursue a target based on their ideological DNA.
 */
export function matchesClubDNA(dna: ClubDNA, player: { age: number; marketValue: number; overallRating: number; dynamicPotential?: number }, targetClubLeagueId: string, playerClubLeagueId: string): boolean {
  switch (dna) {
    case 'MONEYBALL':
      // Only bids for players age <= 23 with value < $35M
      return player.age <= 23 && player.marketValue <= 35_000_000;

    case 'WONDERKID_HOARDER':
      // Aggressively bids for U-21 players with high dynamic potential
      return player.age <= 21 && (player.dynamicPotential ?? player.overallRating + 4) >= 86;

    case 'GALACTICO':
      // Only bids for players with OVR >= 87 or generational wonderkids (POT >= 92)
      return player.overallRating >= 87 || ((player.dynamicPotential ?? 0) >= 92 && player.age <= 20);

    case 'DOMESTIC_POACHER':
      // Prioritizes top-performing stars from rival teams in its own league
      return targetClubLeagueId === playerClubLeagueId && player.overallRating >= 82;

    case 'HYBRID_LEGACY':
    default:
      return player.overallRating >= 80;
  }
}

/**
 * 5.3 Bidding Wars & Player Preference Decision Score:
 * Score = (Wage Offer * 0.35) + (Club Reputation * 0.30) + (UCL Qual * 0.20) + (Squad Role * 0.15)
 */
export function calculatePlayerPreferenceScore(
  wageWeekly: number,
  clubReputation: number,
  hasUcl: boolean,
  squadRole: 'STAR' | 'IMPORTANT' | 'ROTATION' | 'PROSPECT'
): number {
  // Normalize wage: $100k/wk = 50, $300k/wk = 85, $500k/wk = 100
  const wageScore = Math.min(100, (wageWeekly / 500_000) * 100);
  const repScore = clubReputation; // 1-100
  const uclScore = hasUcl ? 100 : 30;

  const roleScoreMap = {
    STAR: 100,
    IMPORTANT: 80,
    ROTATION: 50,
    PROSPECT: 40,
  };
  const roleScore = roleScoreMap[squadRole] || 50;

  const totalScore =
    wageScore * 0.35 +
    repScore * 0.30 +
    uclScore * 0.20 +
    roleScore * 0.15;

  return Number(totalScore.toFixed(1));
}

/**
 * Generates an AI counter-bid from an elite rival (e.g. Man City, PSG, Bayern) to spark a bidding war.
 */
export function generateRivalBiddingWar(
  targetPlayer: { name: string; marketValue: number; weeklyWage: number },
  userBidBaseFee: number
): RivalClubBid {
  const eliteRivals = [
    { id: 'mancity', name: 'Manchester City', reputation: 94, ucl: true },
    { id: 'psg', name: 'Paris Saint-Germain', reputation: 91, ucl: true },
    { id: 'bayern', name: 'Bayern Munich', reputation: 93, ucl: true },
    { id: 'realmadrid', name: 'Real Madrid', reputation: 95, ucl: true },
    { id: 'chelsea', name: 'Chelsea', reputation: 85, ucl: false },
    { id: 'arsenal', name: 'Arsenal', reputation: 88, ucl: true },
  ];

  const rival = eliteRivals[Math.floor(Math.random() * eliteRivals.length)];
  const escalatedFee = Math.round(userBidBaseFee * (1.05 + Math.random() * 0.15));
  const escalatedWage = Math.round(targetPlayer.weeklyWage * (1.2 + Math.random() * 0.3));

  const prefScore = calculatePlayerPreferenceScore(
    escalatedWage,
    rival.reputation,
    rival.ucl,
    'STAR'
  );

  return {
    clubId: rival.id,
    clubName: rival.name,
    wageOfferWeekly: escalatedWage,
    transferFeeOffered: escalatedFee,
    squadRole: 'STAR',
    preferenceScore: prefScore,
  };
}

/**
 * 5.4 AI Squad Minimums Guardrail:
 * Protects AI clubs from selling themselves into unplayable squads.
 * Minimum requirements: 2 GKs, 4 CBs/Fullbacks, 4 Midfielders, 2 Attackers, and total squad >= 18.
 */
export const SQUAD_MINIMUMS = {
  GK: 2,
  DEF: 5,
  MID: 5,
  ATT: 3,
  TOTAL: 18,
};

export function enforceSquadMinimums(club: Club, players: Player[]): boolean {
  const clubPlayers = players.filter(p => p.clubId === club.id);
  if (clubPlayers.length < SQUAD_MINIMUMS.TOTAL) return false;

  const gks = clubPlayers.filter(p => p.primaryPosition === 'GK').length;
  if (gks < SQUAD_MINIMUMS.GK) return false;

  const defs = clubPlayers.filter(p => ['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(p.primaryPosition)).length;
  if (defs < SQUAD_MINIMUMS.DEF) return false;

  const mids = clubPlayers.filter(p => ['CDM', 'CM', 'CAM', 'LM', 'RM'].includes(p.primaryPosition)).length;
  if (mids < SQUAD_MINIMUMS.MID) return false;

  const atts = clubPlayers.filter(p => ['ST', 'CF', 'LW', 'RW'].includes(p.primaryPosition)).length;
  if (atts < SQUAD_MINIMUMS.ATT) return false;

  return true;
}

/**
 * Promotes emergency academy youth players if injuries or transfers deplete a position.
 */
export function fillDepletedPositions(club: Club, clubPlayers: Player[]): Player[] {
  const newPlayers: Player[] = [];
  const gks = clubPlayers.filter(p => p.primaryPosition === 'GK');

  if (gks.length < SQUAD_MINIMUMS.GK) {
    const baseOvr = Math.max(62, club.reputation - 15);
    newPlayers.push({
      id: `${club.id}_youth_gk_${Date.now()}`,
      clubId: club.id,
      name: `Academy Keeper`,
      fullName: `Academy Keeper`,
      photoUrl: `/crests/${club.id}.svg`,
      nationality: 'ESP',
      age: 18,
      primaryPosition: 'GK',
      secondaryPositions: [],
      reputation: baseOvr,
      attributes: {
        attacking: 20,
        creative: 30,
        defending: Math.min(99, Math.round(baseOvr * 1.1)),
        physical: baseOvr - 5,
        mental: baseOvr - 8,
      },
      traits: {
        clutch: 10,
        consistency: 10,
        adaptability: 12,
        workRate: 'MEDIUM',
        injuryProneness: 'LOW',
      },
      overallRating: baseOvr,
      dynamicPotential: baseOvr + 12,
      potentialCap: baseOvr + 15,
      sharpness: 75,
      stamina: 85,
      morale: 80,
      formHistory: [6.8],
      settlementProgress: 1.0,
      daysAtClub: 300,
      isRetraining: false,
      wagePerWeek: 3000,
      contractYearsLeft: 3,
      releaseClause: 15_000_000,
      marketValue: 1_500_000,
      amortizationAnnualCost: 0,
      squadRole: 'PROSPECT',
      unsettledStage: 0,
      isStarter: false,
    });
  }

  return newPlayers;
}

/**
 * Generates realistic AI transfer bids for a user player offered to clubs or transfer listed.
 */
export function generateIncomingBids(
  listedPlayer: Player,
  clubs: Record<string, Club>,
  currentDate: string
): Array<{
  id: string;
  playerId: string;
  playerName: string;
  buyingClubId: string;
  buyingClubName: string;
  feeOffered: number;
  date: string;
  status: 'PENDING';
}> {
  const eligibleClubs = Object.values(clubs).filter(c => {
    if (c.id === listedPlayer.clubId) return false;
    // Club needs to afford the player or have similar/higher tier reputation
    const repDiff = c.reputation - listedPlayer.overallRating;
    return repDiff >= -10;
  });

  if (eligibleClubs.length === 0) return [];

  // Pick 1 to 3 interested suitors
  const suitorsCount = Math.min(eligibleClubs.length, 1 + Math.floor(Math.random() * 3));
  // Shuffle suitors
  const shuffled = [...eligibleClubs].sort(() => Math.random() - 0.5);
  const suitors = shuffled.slice(0, suitorsCount);

  return suitors.map((buyer, idx) => {
    // Valuation multiplier: 0.85x to 1.20x of market value depending on buyer reputation
    const repBonus = (buyer.reputation - 75) * 0.005;
    const randVariance = (Math.random() * 0.25) - 0.10;
    const factor = Math.max(0.80, Math.min(1.30, 0.95 + repBonus + randVariance));
    const feeOffered = Math.round(listedPlayer.marketValue * factor);

    return {
      id: `bid_${listedPlayer.id}_${buyer.id}_${Date.now()}_${idx}`,
      playerId: listedPlayer.id,
      playerName: listedPlayer.name,
      buyingClubId: buyer.id,
      buyingClubName: buyer.name,
      feeOffered,
      date: currentDate,
      status: 'PENDING' as const,
    };
  });
}

