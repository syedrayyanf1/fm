import { PlayerAttributes, PlayerTraits, Position } from '../types/game';

export interface RawPlayerAttributes {
  finishing: number;
  positioning: number;
  shotPower: number;
  volleys: number;
  vision: number;
  shortPassing: number;
  longPassing: number;
  crossing: number;
  curve: number;
  standingTackle: number;
  interceptions: number;
  marking: number;
  slidingTackle: number;
  pace: number;
  acceleration: number;
  stamina: number;
  strength: number;
  jumping: number;
  composure: number;
  reactions: number;
}

export interface RawTraitInputs {
  composure: number;
  reactions: number;
  internationalReputation: number; // 1-5 scale
  attackingWorkRate?: 'Low' | 'Medium' | 'High' | 'LOW' | 'MEDIUM' | 'HIGH';
  defendingWorkRate?: 'Low' | 'Medium' | 'High' | 'LOW' | 'MEDIUM' | 'HIGH';
  stamina: number;
}

const clamp = (val: number, min = 1, max = 99): number => {
  return Math.min(max, Math.max(min, Math.round(val)));
};

/**
 * Derives 5 core macro pillars from granular attributes
 */
export function deriveMacroAttributes(raw: RawPlayerAttributes): PlayerAttributes {
  const attacking = clamp(
    raw.finishing * 0.45 +
    raw.positioning * 0.25 +
    raw.shotPower * 0.20 +
    raw.volleys * 0.10
  );

  const creative = clamp(
    raw.vision * 0.35 +
    raw.shortPassing * 0.30 +
    raw.longPassing * 0.15 +
    raw.crossing * 0.10 +
    raw.curve * 0.10
  );

  const defending = clamp(
    raw.standingTackle * 0.35 +
    raw.interceptions * 0.30 +
    raw.marking * 0.25 +
    raw.slidingTackle * 0.10
  );

  const physical = clamp(
    raw.pace * 0.30 +
    raw.acceleration * 0.20 +
    raw.stamina * 0.25 +
    raw.strength * 0.15 +
    raw.jumping * 0.10
  );

  const mental = clamp(
    raw.composure * 0.45 +
    raw.reactions * 0.35 +
    raw.positioning * 0.20
  );

  return {
    attacking,
    creative,
    defending,
    physical,
    mental,
  };
}

/**
 * Derives personality & behavioral traits
 */
export function deriveTraits(raw: RawTraitInputs, careerLeagueCount = 1): PlayerTraits {
  const clutch = Math.min(20, Math.max(1, Math.round(((raw.composure * 0.6 + raw.reactions * 0.4) / 99) * 20)));
  const consistency = Math.min(20, Math.max(1, Math.round((raw.composure / 99) * 16) + raw.internationalReputation));
  const adaptability = Math.min(20, Math.max(6, Math.round(10 + (careerLeagueCount > 1 ? 4 : 0) + (raw.composure > 80 ? 3 : 0))));

  const attRate = (raw.attackingWorkRate || 'Medium').toUpperCase();
  const defRate = (raw.defendingWorkRate || 'Medium').toUpperCase();

  let workRate: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';
  if (attRate === 'HIGH' || defRate === 'HIGH') {
    workRate = 'HIGH';
  } else if (attRate === 'LOW' && defRate === 'LOW') {
    workRate = 'LOW';
  }

  let injuryProneness: 'LOW' | 'NORMAL' | 'FRAGILE' = 'NORMAL';
  if (raw.stamina < 65) {
    injuryProneness = 'FRAGILE';
  } else if (raw.stamina > 85) {
    injuryProneness = 'LOW';
  }

  return {
    clutch,
    consistency,
    adaptability,
    workRate,
    injuryProneness,
  };
}

/**
 * Calculates overall rating (1-99) weighted by positional archetype
 */
export function calculateOvr(attrs: PlayerAttributes, position: Position): number {
  const { attacking: ATT, creative: CRE, defending: DEF, physical: PHY, mental: MEN } = attrs;

  let rawOvr: number;

  switch (position) {
    case 'ST':
    case 'LW':
    case 'RW':
      rawOvr = ATT * 0.40 + PHY * 0.25 + CRE * 0.20 + MEN * 0.15;
      break;

    case 'CAM':
    case 'CM':
    case 'LM':
    case 'RM':
      rawOvr = CRE * 0.40 + ATT * 0.20 + PHY * 0.20 + MEN * 0.20;
      break;

    case 'CDM':
    case 'CB':
    case 'LB':
    case 'RB':
      rawOvr = DEF * 0.45 + PHY * 0.25 + MEN * 0.20 + CRE * 0.10;
      break;

    case 'GK':
      rawOvr = DEF * 0.50 + MEN * 0.30 + PHY * 0.20;
      break;

    default:
      rawOvr = (ATT + CRE + DEF + PHY + MEN) / 5;
  }

  return clamp(rawOvr);
}
