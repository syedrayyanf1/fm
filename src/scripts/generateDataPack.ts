import { GameDataPack, Player, Position } from '../types/game';
import { deriveMacroAttributes, deriveTraits, calculateOvr, RawPlayerAttributes, RawTraitInputs } from '../data/derivation';
import { initialClubs, initialCompetitions, initialFixtures, initialRumors } from '../data/initialSeed';

declare const process: any;

interface RawPlayerRecord {
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
  reputation: number;
  rawAttrs: RawPlayerAttributes;
  traitInputs: RawTraitInputs;
  careerLeagueCount: number;
  wagePerWeek: number;
  contractYearsLeft: number;
  releaseClause: number | null;
  marketValue: number;
  squadRole: 'STAR' | 'IMPORTANT' | 'ROTATION' | 'PROSPECT';
  isStarter: boolean;
  pitchX?: number;
  pitchY?: number;
  role?: string;
}

/**
 * Transforms raw player scout/scraped data into a domain-compliant Player entity
 */
export function transformRawPlayer(raw: RawPlayerRecord): Player {
  const attributes = deriveMacroAttributes(raw.rawAttrs);
  const traits = deriveTraits(raw.traitInputs, raw.careerLeagueCount);
  const overallRating = calculateOvr(attributes, raw.primaryPosition);
  const dynamicPotential = Math.min(99, overallRating + Math.max(1, Math.round((28 - raw.age) * 0.8)));
  const potentialCap = Math.min(99, overallRating + 5);

  return {
    id: raw.id,
    clubId: raw.clubId,
    name: raw.name,
    fullName: raw.fullName || raw.name,
    shirtNumber: raw.shirtNumber,
    photoUrl: raw.photoUrl,
    nationality: raw.nationality,
    age: raw.age,
    primaryPosition: raw.primaryPosition,
    secondaryPositions: raw.secondaryPositions,
    reputation: raw.reputation,
    attributes,
    traits,
    overallRating,
    dynamicPotential,
    potentialCap,
    sharpness: 90,
    stamina: raw.rawAttrs.stamina || 85,
    morale: 90,
    formHistory: [7.5, 7.8, 7.6, 8.0, 7.9],
    settlementProgress: 0.95,
    daysAtClub: 365,
    isRetraining: false,
    wagePerWeek: raw.wagePerWeek,
    contractYearsLeft: raw.contractYearsLeft,
    releaseClause: raw.releaseClause,
    marketValue: raw.marketValue,
    amortizationAnnualCost: raw.marketValue > 0 ? Math.round(raw.marketValue / Math.max(1, raw.contractYearsLeft)) : 0,
    squadRole: raw.squadRole,
    unsettledStage: 0,
    isStarter: raw.isStarter,
    pitchX: raw.pitchX,
    pitchY: raw.pitchY,
    role: raw.role,
  };
}

/**
 * Builds a full GameDataPack JSON bundle from raw collections
 */
export function generateDataPack(rawPlayers: RawPlayerRecord[] = []): GameDataPack {
  const transformedPlayers: Record<string, Player> = {};

  for (const raw of rawPlayers) {
    const player = transformRawPlayer(raw);
    transformedPlayers[player.id] = player;
  }

  return {
    clubs: initialClubs,
    players: transformedPlayers,
    competitions: initialCompetitions,
    fixtures: initialFixtures,
    rumors: initialRumors,
  };
}

// If executed directly via Node / tsx:
if (typeof process !== 'undefined' && process.argv && process.argv[1]?.includes('generateDataPack')) {
  const dataPack = generateDataPack([]);
  console.log(`[ETL DataPack Generated]: ${Object.keys(dataPack.clubs).length} clubs, ${dataPack.fixtures.length} fixtures.`);
}
