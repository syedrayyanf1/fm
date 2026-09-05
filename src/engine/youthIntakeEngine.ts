import { Club, Player, Position } from '../types/game';
import { YouthProspect } from '../types/season';

const FIRST_NAMES = [
  'Mateo', 'Lucas', 'Julian', 'Thiago', 'Liam', 'Noah', 'Leo', 'Gabriel',
  'Alejandro', 'Enzo', 'Florian', 'Arda', 'Luka', 'Kenan', 'Gavi', 'Pau',
  'Nico', 'Warren', 'Desire', 'Archie', 'Kobbie', 'Franco', 'Mathys', 'Estevao'
];

const LAST_NAMES = [
  'Silva', 'Fernandez', 'Moreno', 'Garcia', 'Navarro', 'Torres', 'Svensson',
  'Schmidt', 'Dubois', 'Laurent', 'Ricci', 'Conti', 'Yilmaz', 'Kovacic',
  'Vukovic', 'Mainoo', 'Gray', 'Yamal', 'Cubarsi', 'Zaïre-Emery', 'Tel', 'Doue'
];

const POSITIONS: Position[] = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST'];

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateYouthIntake(club: Club): YouthProspect[] {
  const academyLevel = club.facilities?.youthAcademyLevel ?? 3;
  const clubRep = club.reputation ?? 75;
  const count = randInt(6, 8);
  const prospects: YouthProspect[] = [];

  // Determine wonderkid roll for Level 5 Academy
  const hasWonderkid = academyLevel >= 5 && Math.random() < 0.15;
  let wonderkidCreated = false;

  for (let i = 0; i < count; i++) {
    const isWonderkid = hasWonderkid && !wonderkidCreated && (i === 0 || Math.random() < 0.3);
    if (isWonderkid) {
      wonderkidCreated = true;
    }

    const pos = getRandomItem(POSITIONS);
    const firstName = getRandomItem(FIRST_NAMES);
    const lastName = getRandomItem(LAST_NAMES);
    const name = `${firstName} ${lastName}`;

    let age = randInt(15, 17);
    let nominalOvr = 0;
    let dynamicPotential = 0;
    let personalityTag: YouthProspect['personalityTag'] = 'SQUAD DEPTH';
    let clutch = randInt(8, 14);
    let consistency = randInt(8, 14);
    let adaptability = randInt(10, 15);

    if (isWonderkid) {
      age = 16;
      nominalOvr = randInt(68, 73);
      dynamicPotential = randInt(89, 94);
      clutch = randInt(15, 19);
      consistency = randInt(14, 18);
      adaptability = randInt(16, 20);
      personalityTag = '★ GENERATIONAL TALENT';
    } else if (academyLevel >= 5 && i < 2) {
      // Guaranteed 2 first-team caliber prospects (POT 82-86)
      nominalOvr = randInt(64, 69);
      dynamicPotential = randInt(82, 86);
      personalityTag = 'FIRST-TEAM PROSPECT';
      clutch = randInt(12, 16);
      consistency = randInt(12, 16);
    } else if (academyLevel >= 3 && i < 2) {
      // Level 3-4 guaranteed at least 1-2 prospects with POT 78-84
      nominalOvr = randInt(61, 66);
      dynamicPotential = randInt(78, 84);
      personalityTag = Math.random() > 0.4 ? 'FIRST-TEAM PROSPECT' : 'RAW DIAMOND';
      clutch = randInt(10, 14);
    } else if (academyLevel <= 2) {
      // Level 1-2: Max potential capped at 72-76
      nominalOvr = randInt(56, 62);
      dynamicPotential = randInt(68, Math.min(76, 70 + academyLevel * 2));
      personalityTag = Math.random() > 0.5 ? 'SQUAD DEPTH' : 'RAW DIAMOND';
    } else {
      // Generic academy prospect
      const repBonus = Math.floor(clubRep / 20);
      nominalOvr = randInt(58 + repBonus, 65 + repBonus);
      dynamicPotential = randInt(nominalOvr + 8, Math.min(84, nominalOvr + 18));
      personalityTag = dynamicPotential >= 80 ? 'FIRST-TEAM PROSPECT' : (Math.random() > 0.5 ? 'RAW DIAMOND' : 'SQUAD DEPTH');
    }

    // Generate balanced attributes based on position & nominalOvr
    const baseAttr = nominalOvr;
    const isAttacker = ['ST', 'LW', 'RW', 'CAM'].includes(pos);
    const isMidfielder = ['CM', 'CDM', 'CAM', 'LM', 'RM'].includes(pos);
    const isDefender = ['CB', 'LB', 'RB'].includes(pos);
    const isGk = pos === 'GK';

    const attributes = {
      attacking: isAttacker ? baseAttr + randInt(2, 6) : (isGk ? randInt(20, 35) : baseAttr - randInt(2, 8)),
      creative: isMidfielder ? baseAttr + randInt(2, 6) : (isGk ? randInt(25, 40) : baseAttr - randInt(4, 10)),
      defending: isDefender ? baseAttr + randInt(3, 7) : (isGk ? baseAttr + randInt(4, 8) : baseAttr - randInt(5, 15)),
      physical: randInt(baseAttr - 4, baseAttr + 5),
      mental: randInt(baseAttr - 5, baseAttr + 3),
    };

    // Fog of war potential range
    const potMargin = randInt(2, 4);
    const potMin = Math.max(nominalOvr + 4, dynamicPotential - potMargin);
    const potMax = Math.min(99, dynamicPotential + potMargin);
    const scoutedRating = `${nominalOvr} (POT: ${potMin}–${potMax})`;

    prospects.push({
      id: `youth-${club.id}-${Date.now()}-${i}`,
      name,
      position: pos,
      age,
      nominalOvr,
      dynamicPotential,
      scoutedRating,
      personalityTag,
      attributes,
      traits: {
        clutch,
        consistency,
        adaptability,
        workRate: Math.random() > 0.5 ? 'HIGH' : 'MEDIUM',
        injuryProneness: Math.random() > 0.8 ? 'FRAGILE' : 'NORMAL',
      },
      isGenerationalWonderkid: isWonderkid,
    });
  }

  return prospects;
}

export function convertProspectToPlayer(prospect: YouthProspect, clubId: string): Player {
  const potCeiling = Math.min(99, prospect.dynamicPotential + 3);
  return {
    id: `player-${prospect.id}`,
    clubId,
    name: prospect.name,
    fullName: prospect.name,
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    nationality: 'Spain',
    age: prospect.age,
    primaryPosition: prospect.position,
    secondaryPositions: [],
    reputation: Math.max(30, prospect.nominalOvr - 20),
    attributes: prospect.attributes,
    traits: prospect.traits,
    overallRating: prospect.nominalOvr,
    dynamicPotential: prospect.dynamicPotential,
    potentialCap: potCeiling,
    sharpness: 75,
    stamina: 85,
    morale: 82,
    formHistory: [6.8, 7.0, 7.1],
    settlementProgress: 1.0,
    daysAtClub: 0,
    isRetraining: false,
    wagePerWeek: 1500, // $1,500/wk standard youth contract
    contractYearsLeft: 3,
    releaseClause: prospect.nominalOvr >= 70 ? 45000000 : null,
    marketValue: Math.round(prospect.nominalOvr * prospect.nominalOvr * 1400),
    amortizationAnnualCost: 0,
    squadRole: 'PROSPECT',
    unsettledStage: 0,
    isStarter: false,
    honors: [],
  };
}
