import { Position, PlayerAttributes, PlayerTraits } from './game';

export type FogLevel = 0 | 1 | 2 | 3;

export interface Scout {
  id: string;
  name: string;
  reputation: number; // 1-100
  assignedTargetId: string | null;
  daysRemaining: number;
}

export interface FoggedAttributes {
  attacking: string; // e.g. "[70-82]" or "79"
  creative: string;  // e.g. "??" or "[75-84]" or "81"
  defending: string; // e.g. "??" or "[60-70]" or "65"
  physical: string;  // e.g. "82" or "??"
  mental: string;    // e.g. "??" or "80"
}

export interface FoggedTraits {
  clutch?: string;       // e.g. "??" or "16"
  consistency?: string;  // e.g. "??" or "15"
  adaptability?: string; // e.g. "??" or "17"
  workRate?: string;     // e.g. "??" or "HIGH"
  injuryProneness?: string; // e.g. "??" or "LOW"
}

export interface TransferAddons {
  appearances30: boolean;    // e.g. +$5.0M
  appearancesAmount: number;
  uclQualification: boolean; // e.g. +$7.5M
  uclAmount: number;
  leagueTitle: boolean;      // e.g. +$10.0M
  leagueTitleAmount: number;
}

export interface PlayerContractOffer {
  weeklyWage: number;
  contractYears: 2 | 3 | 4 | 5;
  squadRole: 'STAR' | 'IMPORTANT' | 'ROTATION' | 'PROSPECT';
  releaseClause: number | null;
  agentFee: number;
}

export interface TransferOffer {
  id: string;
  targetId: string;
  targetPlayerName: string;
  buyerClubId: string;
  sellerClubId: string;
  approachType: 'PRIVATE' | 'PUBLIC';
  baseFee: number;
  installments: 1 | 2 | 3;
  addons: TransferAddons;
  sellOnPct: 0 | 10 | 15 | 20;
  contractOffer: PlayerContractOffer;
  status: 'PENDING' | 'ACCEPTED' | 'COUNTERED' | 'REJECTED';
  counterFee?: number;
  counterSellOnPct?: number;
  rejectionReason?: string;
  timestamp: string;
}

export type MutinyStage = 0 | 1 | 2 | 3;

export interface MutinyConfrontation {
  playerId: string;
  playerName: string;
  buyerClubName: string;
  bidAmount: number;
  wageOfferWeekly: number;
  stage: MutinyStage;
  headline: string;
  quote: string;
}
