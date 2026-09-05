import { ScoutingRadarTarget, PlayerAttributes, PlayerTraits } from '../types/game';
import { Scout, FogLevel, FoggedAttributes, FoggedTraits } from '../types/transfer';

export const DEFAULT_SCOUTS: Scout[] = [
  { id: 'scout-1', name: 'Carles Puyol (Senior Scout)', reputation: 90, assignedTargetId: null, daysRemaining: 0 },
  { id: 'scout-2', name: 'Albert Valentín (Western Europe)', reputation: 84, assignedTargetId: 't1', daysRemaining: 7 }, // Nico Williams partially scouted
  { id: 'scout-3', name: 'Mateu Alemany (Domestic Talent)', reputation: 88, assignedTargetId: null, daysRemaining: 0 },
  { id: 'scout-4', name: 'André Cury (South America Specialist)', reputation: 82, assignedTargetId: null, daysRemaining: 0 },
  { id: 'scout-5', name: 'Paco Martinez (Youth & Wonderkids)', reputation: 85, assignedTargetId: null, daysRemaining: 0 },
];

/**
 * Derives the Fog Level based on completed scouting days.
 * L0: 0-6 days (Unscouted)
 * L1: 7-13 days (Physical & Positional clarity)
 * L2: 14-20 days (Full macro pillars & financial transparency)
 * L3: 21+ days (Complete profile: hidden traits & dynamic potential)
 */
export function getFogLevel(daysScouted: number): FogLevel {
  if (daysScouted >= 21) return 3;
  if (daysScouted >= 14) return 2;
  if (daysScouted >= 7) return 1;
  return 0;
}

export interface FoggedDisplayProfile {
  fogLevel: FogLevel;
  ovrDisplay: string;
  isExactOvrKnown: boolean;
  attributes: FoggedAttributes;
  traits: FoggedTraits;
  potentialDisplay: string;
  valuationDisplay: string;
  wageDisplay: string;
  confidenceText: string;
  progressPercent: number;
}

/**
 * Resolves Fog of War for a given scouting target based on accumulated investigation days.
 */
export function resolveFogOfWar(
  target: ScoutingRadarTarget,
  daysScouted: number
): FoggedDisplayProfile {
  const level = getFogLevel(daysScouted);
  const exactOvr = target.exactOvr || 85;

  const defaultAttrs: PlayerAttributes = target.attributes || {
    attacking: Math.min(95, exactOvr + 2),
    creative: Math.min(95, exactOvr - 1),
    defending: Math.max(45, exactOvr - 20),
    physical: Math.min(95, exactOvr + 1),
    mental: Math.min(95, exactOvr - 2),
  };

  const defaultTraits: PlayerTraits = target.traits || {
    clutch: 16,
    consistency: 15,
    adaptability: 17,
    workRate: 'HIGH',
    injuryProneness: 'LOW',
  };

  const pct = Math.min(100, Math.round((daysScouted / 21) * 100));

  // Level 0: Completely obscured (0 - 6 days)
  if (level === 0) {
    const minBand = Math.max(50, exactOvr - 3);
    const maxBand = Math.min(99, exactOvr + 3);
    return {
      fogLevel: 0,
      ovrDisplay: `${minBand}–${maxBand}`,
      isExactOvrKnown: false,
      attributes: {
        attacking: `[${Math.max(50, defaultAttrs.attacking - 6)}–${Math.min(99, defaultAttrs.attacking + 6)}]`,
        creative: '??',
        defending: '??',
        physical: '??',
        mental: '??',
      },
      traits: {
        clutch: '??',
        consistency: '??',
        adaptability: '??',
        workRate: '??',
        injuryProneness: '??',
      },
      potentialDisplay: 'POT: ??',
      valuationDisplay: target.estFeeFormatted || `$${target.baseFee.toFixed(1)}M (Est.)`,
      wageDisplay: target.wageEstimateFormatted || `$${Math.round(target.weeklyWage / 1000)}k/wk (Est.)`,
      confidenceText: `Scouting: ${daysScouted}/21 Days • Unscouted (Band ±3)`,
      progressPercent: pct,
    };
  }

  // Level 1: Physical stats & tightened OVR band (7 - 13 days)
  if (level === 1) {
    const minBand = Math.max(50, exactOvr - 1);
    const maxBand = Math.min(99, exactOvr + 1);
    return {
      fogLevel: 1,
      ovrDisplay: `${minBand}–${maxBand}`,
      isExactOvrKnown: false,
      attributes: {
        attacking: `[${Math.max(50, defaultAttrs.attacking - 3)}–${Math.min(99, defaultAttrs.attacking + 3)}]`,
        creative: `[${Math.max(50, defaultAttrs.creative - 4)}–${Math.min(99, defaultAttrs.creative + 4)}]`,
        defending: `[${Math.max(40, defaultAttrs.defending - 5)}–${Math.min(99, defaultAttrs.defending + 5)}]`,
        physical: String(defaultAttrs.physical), // Physical fully revealed
        mental: '??',
      },
      traits: {
        clutch: '??',
        consistency: '??',
        adaptability: '??',
        workRate: '??',
        injuryProneness: '??',
      },
      potentialDisplay: `POT: [${exactOvr + 1}–${exactOvr + 6}]`,
      valuationDisplay: `$${target.baseFee.toFixed(1)}M (±10%)`,
      wageDisplay: `$${Math.round(target.weeklyWage / 1000)}k/wk`,
      confidenceText: `Scouting: ${daysScouted}/21 Days • Phase 1 Clear (Physicals Revealed)`,
      progressPercent: pct,
    };
  }

  // Level 2: All 5 macro pillars fully revealed (14 - 20 days)
  if (level === 2) {
    return {
      fogLevel: 2,
      ovrDisplay: String(exactOvr),
      isExactOvrKnown: true,
      attributes: {
        attacking: String(defaultAttrs.attacking),
        creative: String(defaultAttrs.creative),
        defending: String(defaultAttrs.defending),
        physical: String(defaultAttrs.physical),
        mental: String(defaultAttrs.mental),
      },
      traits: {
        clutch: '??',
        consistency: '??',
        adaptability: '??',
        workRate: defaultTraits.workRate,
        injuryProneness: '??',
      },
      potentialDisplay: `POT: [${exactOvr + 2}–${exactOvr + 5}]`,
      valuationDisplay: `$${target.baseFee.toFixed(1)}M`,
      wageDisplay: `$${Math.round(target.weeklyWage / 1000)}k/wk`,
      confidenceText: `Scouting: ${daysScouted}/21 Days • Phase 2 Clear (Full Pillars Revealed)`,
      progressPercent: pct,
    };
  }

  // Level 3: Complete Dossier (21+ days)
  return {
    fogLevel: 3,
    ovrDisplay: String(exactOvr),
    isExactOvrKnown: true,
    attributes: {
      attacking: String(defaultAttrs.attacking),
      creative: String(defaultAttrs.creative),
      defending: String(defaultAttrs.defending),
      physical: String(defaultAttrs.physical),
      mental: String(defaultAttrs.mental),
    },
    traits: {
      clutch: `${defaultTraits.clutch}/20`,
      consistency: `${defaultTraits.consistency}/20`,
      adaptability: `${defaultTraits.adaptability}/20`,
      workRate: defaultTraits.workRate,
      injuryProneness: defaultTraits.injuryProneness,
    },
    potentialDisplay: `POT: ${exactOvr + 3} Ceiling`,
    valuationDisplay: `$${target.baseFee.toFixed(1)}M`,
    wageDisplay: `$${Math.round(target.weeklyWage / 1000)}k/wk`,
    confidenceText: 'Complete Dossier • 100% Revealed (All Traits & Ceiling)',
    progressPercent: 100,
  };
}
