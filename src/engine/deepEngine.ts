import { Player, Club, Position } from '../types/game';
import { InGamePlayerState, MatchEvent, MatchSimulationState, SidelineShout } from './matchTypes';

export const CLASH_MINUTES = [6, 14, 21, 28, 35, 42, 45, 51, 58, 66, 73, 80, 85, 89];

// Normal distribution approximation: mean 0, stdev sigma
function normalRandom(sigma = 0.035): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z * sigma;
}

// Position Modifier: Natural = 1.00, Sibling = 0.97, Line shift = 0.90, Foreign = 0.65
export function getPositionModifier(player: Player, targetPosition?: Position): number {
  if (!targetPosition || player.primaryPosition === targetPosition) return 1.00;
  if (player.secondaryPositions && player.secondaryPositions.includes(targetPosition)) return 0.97;

  const posFamilies: Record<string, string[]> = {
    DEF: ['CB', 'LB', 'RB'],
    MID: ['CDM', 'CM', 'CAM', 'LM', 'RM'],
    ATT: ['LW', 'RW', 'ST'],
    GK: ['GK'],
  };

  const findFam = (p: string) => {
    for (const [k, v] of Object.entries(posFamilies)) {
      if (v.includes(p)) return k;
    }
    return 'MID';
  };

  const pFam = findFam(player.primaryPosition);
  const tFam = findFam(targetPosition);

  if (pFam === tFam) return 0.97;
  if ((pFam === 'DEF' && tFam === 'MID') || (pFam === 'MID' && tFam === 'ATT')) return 0.90;
  return 0.65;
}

// Step 1: Effective Rating (Reff) Calculation
export function calculateEffectiveRating(
  player: Player,
  stamina: number,
  targetPosition?: Position,
  activeShout?: SidelineShout | null,
  isUserTeam = false
): number {
  const baseOvr = player.overallRating;

  // 1. Position Modifier
  const mPos = getPositionModifier(player, targetPosition);

  // 2. Form Modifier: 0.85 + ((AvgForm - 5.0) / 5.0) * 0.30 in [0.85, 1.15]
  const forms = player.formHistory && player.formHistory.length > 0 ? player.formHistory : [7.5];
  const avgForm = forms.reduce((a, b) => a + b, 0) / forms.length;
  const mForm = Math.min(1.15, Math.max(0.85, 0.85 + ((avgForm - 5.0) / 5.0) * 0.30));

  // 3. Sharpness Modifier: 0.70 + (0.30 * (Sharpness / 100))
  const sharpness = player.sharpness ?? 90;
  const mSharp = 0.70 + 0.30 * (sharpness / 100);

  // 4. Transfer Settlement: 0.75 + (0.25 * settlementProgress)
  const settle = player.settlementProgress ?? 0.95;
  const mSettle = 0.75 + 0.25 * settle;

  // 5. Fatigue Modifier: If stamina >= 70 => 1.00; if < 70 => 1.00 - ((70 - stamina) / 100) * 0.40
  const mFatigue = stamina >= 70 ? 1.00 : 1.00 - ((70 - stamina) / 100) * 0.40;

  let rEff = baseOvr * mPos * mForm * mSharp * mSettle * mFatigue;

  // Shout modifiers for user team
  if (isUserTeam && activeShout) {
    if (activeShout === 'DEMAND_MORE') {
      rEff *= 1.05;
    } else if (activeShout === 'FOCUS') {
      rEff *= 1.03;
    }
  }

  return Number(rEff.toFixed(1));
}

// Convert Player to InGamePlayerState
export function createInGamePlayer(player: Player): InGamePlayerState {
  const stamina = player.stamina || 95;
  return {
    player,
    currentStamina: stamina,
    effectiveRating: calculateEffectiveRating(player, stamina),
    matchRating: 6.5,
    goals: 0,
    assists: 0,
    shots: 0,
    xgContributed: 0,
    yellowCard: false,
    redCard: false,
    injured: false,
  };
}

// Step 2: In-Game Stamina Drain
export function calculateMinuteStaminaDrain(
  playerState: InGamePlayerState,
  tactics: Club['tactics'],
  medicalLevel = 3,
  activeShout?: SidelineShout | null
): number {
  const baseRate = 0.40; // 0.40% per minute → ~64% stamina at full-time under BALANCED (was 0.25, too low)

  // Work Rate Multiplier
  const wr = playerState.player.traits.workRate;
  const wrMult = wr === 'HIGH' ? 1.15 : wr === 'LOW' ? 0.85 : 1.00;

  // Pressing Multiplier
  const press = tactics.pressingIntensity;
  const pressMult = press === 'RELENTLESS' ? 1.45 : press === 'CONSERVATIVE' ? 0.80 : 1.00;

  // Low stamina multiplier
  const lowStaminaMult = playerState.currentStamina < 65 ? 1.20 : 1.00;

  // Medical discount: up to 15%
  const medicalDiscount = 1 - (medicalLevel / 5) * 0.15;

  let drain = baseRate * wrMult * pressMult * lowStaminaMult * medicalDiscount;

  if (activeShout === 'DEMAND_MORE') {
    drain *= 1.25;
  }

  return drain;
}

// Generate synthetic squad if opponent club does not have full 11 starters
export function generateSyntheticSquad(club: Club): Player[] {
  const formation = club.tactics?.formation || '4-3-3';
  const formationPositions: Record<string, Position[]> = {
    '4-3-3': ['GK', 'RB', 'CB', 'CB', 'LB', 'CDM', 'CM', 'CAM', 'RW', 'ST', 'LW'],
    '4-2-3-1': ['GK', 'RB', 'CB', 'CB', 'LB', 'CDM', 'CDM', 'CAM', 'RM', 'ST', 'LM'],
    '3-5-2': ['GK', 'CB', 'CB', 'CB', 'RM', 'CM', 'CDM', 'CM', 'LM', 'ST', 'ST'],
    '4-4-2': ['GK', 'RB', 'CB', 'CB', 'LB', 'RM', 'CM', 'CM', 'LM', 'ST', 'ST'],
    '5-3-2': ['GK', 'RB', 'CB', 'CB', 'CB', 'LB', 'CM', 'CDM', 'CM', 'ST', 'ST'],
  };
  const positions = formationPositions[formation] || formationPositions['4-3-3'];
  const benchPositions: Position[] = ['GK', 'CB', 'CM', 'RW', 'ST'];

  const baseOvr = club.reputation || 78;
  const clubPrefix = club.shortName ? club.shortName.toLowerCase().replace(/[^a-z0-9]/g, '') : 'opp';

  const defaultNames: Record<Position, string[]> = {
    GK: ['Mamardashvili', 'Dimitrievski', 'Remiro', 'Soria'],
    CB: ['Mosquera', 'Vivian', 'Pezzella', 'Le Normand', 'Giménez'],
    LB: ['Gayà', 'Yuri', 'Galán', 'Miranda'],
    RB: ['Foulquier', 'De Marcos', 'Gorosabel', 'Sabaly'],
    CDM: ['Pepelu', 'Guevara', 'Vesga', 'Guillamón'],
    CM: ['Javi Guerra', 'Turrientes', 'Darder', 'Herrera'],
    CAM: ['Almeida', 'Sancet', 'Baena', 'Robertone'],
    LM: ['Diego López', 'Berenguer', 'Bryan Gil', 'Ayoze'],
    RM: ['Fran Pérez', 'Iñaki Williams', 'Tsygankov', 'Fekir'],
    LW: ['Rioja', 'N. Williams', 'Riquelme', 'Danjuma'],
    RW: ['Canós', 'Kubo', 'Greenwood', 'Ilias'],
    ST: ['Hugo Duro', 'Guruzeta', 'Sorloth', 'Muriqi'],
  };

  const players: Player[] = [];

  // Starters
  positions.forEach((pos, idx) => {
    const namePool = defaultNames[pos] || ['Player'];
    const name = namePool[idx % namePool.length] || `Starter ${idx + 1}`;
    const ovr = Math.min(94, Math.max(70, Math.round(baseOvr + (Math.random() * 4 - 2))));
    players.push({
      id: `${clubPrefix}-s${idx + 1}`,
      clubId: club.id,
      name,
      shirtNumber: idx + 1,
      photoUrl: `/players/${name.toLowerCase().replace(/\s+/g, '')}.png`,
      nationality: 'ESP',
      age: 23 + (idx % 8),
      primaryPosition: pos,
      secondaryPositions: [],
      reputation: ovr,
      attributes: {
        attacking: Math.min(99, Math.max(40, pos === 'ST' || pos === 'LW' || pos === 'RW' ? ovr + 3 : ovr - 10)),
        creative: Math.min(99, Math.max(40, pos === 'CAM' || pos === 'CM' ? ovr + 4 : ovr - 5)),
        defending: Math.min(99, Math.max(40, pos === 'CB' || pos === 'GK' || pos === 'LB' || pos === 'RB' ? ovr + 4 : ovr - 15)),
        physical: Math.min(99, Math.max(50, ovr - 2)),
        mental: Math.min(99, Math.max(50, ovr - 1)),
      },
      traits: {
        clutch: 14,
        consistency: 15,
        adaptability: 16,
        workRate: 'HIGH',
        injuryProneness: 'LOW',
      },
      overallRating: ovr,
      dynamicPotential: ovr + 3,
      potentialCap: ovr + 5,
      sharpness: 90,
      stamina: 95,
      morale: 85,
      formHistory: [7.2, 7.5, 7.4],
      settlementProgress: 0.95,
      daysAtClub: 800,
      isRetraining: false,
      wagePerWeek: 45000,
      contractYearsLeft: 3,
      releaseClause: 60000000,
      marketValue: 20000000,
      amortizationAnnualCost: 0,
      squadRole: idx < 6 ? 'STAR' : 'IMPORTANT',
      unsettledStage: 0,
      isStarter: true,
    });
  });

  // Bench
  benchPositions.forEach((pos, idx) => {
    const namePool = defaultNames[pos] || ['Sub'];
    const name = `${namePool[(idx + 2) % namePool.length]} (Sub)`;
    const ovr = Math.min(90, Math.max(68, baseOvr - 3));
    players.push({
      id: `${clubPrefix}-b${idx + 1}`,
      clubId: club.id,
      name,
      shirtNumber: 13 + idx,
      photoUrl: `/players/${name.toLowerCase().replace(/\s+/g, '')}.png`,
      nationality: 'ESP',
      age: 21 + idx,
      primaryPosition: pos,
      secondaryPositions: [],
      reputation: ovr,
      attributes: {
        attacking: ovr - 5,
        creative: ovr - 5,
        defending: ovr - 5,
        physical: ovr - 2,
        mental: ovr - 4,
      },
      traits: { clutch: 12, consistency: 13, adaptability: 15, workRate: 'MEDIUM', injuryProneness: 'LOW' },
      overallRating: ovr,
      dynamicPotential: ovr + 5,
      potentialCap: ovr + 8,
      sharpness: 85,
      stamina: 95,
      morale: 80,
      formHistory: [7.0, 7.1],
      settlementProgress: 0.95,
      daysAtClub: 400,
      isRetraining: false,
      wagePerWeek: 25000,
      contractYearsLeft: 2,
      releaseClause: 30000000,
      marketValue: 10000000,
      amortizationAnnualCost: 0,
      squadRole: 'ROTATION',
      unsettledStage: 0,
      isStarter: false,
    });
  });

  return players;
}

// Initialize a new match state
export function initMatchState(
  fixtureId: string,
  homeClub: Club,
  awayClub: Club,
  homePlayers: Player[],
  awayPlayers: Player[]
): MatchSimulationState {
  const effectiveHomePlayers = homePlayers.length >= 11 ? homePlayers : generateSyntheticSquad(homeClub);
  const effectiveAwayPlayers = awayPlayers.length >= 11 ? awayPlayers : generateSyntheticSquad(awayClub);

  const homeStarters = effectiveHomePlayers.filter(p => p.isStarter);
  const homeBench = effectiveHomePlayers.filter(p => !p.isStarter);
  const awayStarters = effectiveAwayPlayers.filter(p => p.isStarter);
  const awayBench = effectiveAwayPlayers.filter(p => !p.isStarter);

  const homeLineup = (homeStarters.length >= 11 ? homeStarters.slice(0, 11) : effectiveHomePlayers.slice(0, 11)).map(createInGamePlayer);
  const awayLineup = (awayStarters.length >= 11 ? awayStarters.slice(0, 11) : effectiveAwayPlayers.slice(0, 11)).map(createInGamePlayer);
  const hBench = homeBench.map(createInGamePlayer);
  const aBench = awayBench.map(createInGamePlayer);

  return {
    fixtureId,
    homeClubId: homeClub.id,
    awayClubId: awayClub.id,
    homeTactics: homeClub.tactics,
    awayTactics: awayClub.tactics,
    homeLineup,
    awayLineup,
    homeBench: hBench,
    awayBench: aBench,
    currentMinute: 0,
    homeScore: 0,
    awayScore: 0,
    homeXg: 0,
    awayXg: 0,
    homeShots: 0,
    awayShots: 0,
    homeShotsOnTarget: 0,
    awayShotsOnTarget: 0,
    homePossessionPct: 50,
    momentum: 0,
    events: [
      {
        minute: 0,
        type: 'SUBSTITUTION',
        team: 'HOME',
        playerId: '',
        playerName: 'Referee',
        description: `Kickoff at ${homeClub.name} home ground! Match underway.`,
      },
    ],
    isFinished: false,
    subsRemaining: { home: 5, away: 5 },
  };
}

// Simulation Tick (One Minute Step)
export function simulateMinute(
  prevState: MatchSimulationState,
  userClubId: string,
  homeClub: Club,
  awayClub: Club,
  activeShout?: SidelineShout | null
): MatchSimulationState {
  if (prevState.isFinished || prevState.currentMinute >= 90) {
    return { ...prevState, isFinished: true, currentMinute: 90 };
  }

  const minute = prevState.currentMinute + 1;
  const newEvents: MatchEvent[] = [...prevState.events];

  const isHomeUser = prevState.homeClubId === userClubId;
  const homeShout = isHomeUser ? activeShout : null;
  const awayShout = !isHomeUser ? activeShout : null;

  // 1. Drain Stamina & Recompute Reff for both lineups
  const homeMedLevel = homeClub.facilities?.medicalCenterLevel || 3;
  const awayMedLevel = awayClub.facilities?.medicalCenterLevel || 3;

  const homeLineup = prevState.homeLineup.map(pState => {
    if (pState.redCard || pState.injured) return pState;
    const drain = calculateMinuteStaminaDrain(pState, prevState.homeTactics, homeMedLevel, homeShout);
    const newStamina = Math.max(10, Number((pState.currentStamina - drain).toFixed(1)));
    const newReff = calculateEffectiveRating(pState.player, newStamina, undefined, homeShout, isHomeUser);
    return {
      ...pState,
      currentStamina: newStamina,
      effectiveRating: newReff,
    };
  });

  const awayLineup = prevState.awayLineup.map(pState => {
    if (pState.redCard || pState.injured) return pState;
    const drain = calculateMinuteStaminaDrain(pState, prevState.awayTactics, awayMedLevel, awayShout);
    const newStamina = Math.max(10, Number((pState.currentStamina - drain).toFixed(1)));
    const newReff = calculateEffectiveRating(pState.player, newStamina, undefined, awayShout, !isHomeUser);
    return {
      ...pState,
      currentStamina: newStamina,
      effectiveRating: newReff,
    };
  });

  let homeScore = prevState.homeScore;
  let awayScore = prevState.awayScore;
  let homeXg = prevState.homeXg;
  let awayXg = prevState.awayXg;
  let homeShots = prevState.homeShots;
  let awayShots = prevState.awayShots;
  let homeShotsOnTarget = prevState.homeShotsOnTarget;
  let awayShotsOnTarget = prevState.awayShotsOnTarget;
  let momentum = prevState.momentum;

  // 2. Cards & Injuries check
  const checkDisciplineAndInjury = (
    lineup: InGamePlayerState[],
    team: 'HOME' | 'AWAY',
    tactics: Club['tactics'],
    shout?: SidelineShout | null
  ) => {
    const pressFactor = tactics.pressingIntensity === 'RELENTLESS' ? 1.35 : 1.0;
    const shoutFactor = shout === 'DEMAND_MORE' ? 1.20 : 1.0;

    lineup.forEach(p => {
      if (p.redCard || p.injured) return;

      // Booking check
      if (Math.random() < 0.007 * pressFactor * shoutFactor) {
        if (!p.yellowCard) {
          p.yellowCard = true;
          p.matchRating = Math.max(5.0, Number((p.matchRating - 0.2).toFixed(1)));
          newEvents.push({
            minute,
            type: 'YELLOW',
            team,
            playerId: p.player.id,
            playerName: p.player.name,
            description: `${p.player.name} booked for a tactical challenge in midfield.`,
          });
        } else {
          p.redCard = true;
          p.matchRating = Math.max(5.0, Number((p.matchRating - 1.5).toFixed(1)));
          newEvents.push({
            minute,
            type: 'RED',
            team,
            playerId: p.player.id,
            playerName: p.player.name,
            description: `SECOND YELLOW! ${p.player.name} sent off!`,
          });
        }
      }

      // Fatigue injury check
      if (p.currentStamina < 30 && Math.random() < 0.003) {
        p.injured = true;
        p.matchRating = Math.max(5.0, Number((p.matchRating - 0.5).toFixed(1)));
        newEvents.push({
          minute,
          type: 'INJURY',
          team,
          playerId: p.player.id,
          playerName: p.player.name,
          description: `${p.player.name} pulls up with soft-tissue muscle fatigue and is injured!`,
        });
      }
    });
  };

  checkDisciplineAndInjury(homeLineup, 'HOME', prevState.homeTactics, homeShout);
  checkDisciplineAndInjury(awayLineup, 'AWAY', prevState.awayTactics, awayShout);

  // 3. Sector Clashes
  if (CLASH_MINUTES.includes(minute)) {
    // Step 3.1: Sector Ratings
    const isMid = (pos: Position) => ['CDM', 'CM', 'CAM', 'LM', 'RM'].includes(pos);
    const isDef = (pos: Position) => ['CB', 'LB', 'RB'].includes(pos);
    const isAtt = (pos: Position) => ['ST', 'LW', 'RW'].includes(pos);

    let homeMid = homeLineup.filter(p => !p.redCard && isMid(p.player.primaryPosition)).reduce((sum, p) => sum + p.effectiveRating, 0);
    let awayMid = awayLineup.filter(p => !p.redCard && isMid(p.player.primaryPosition)).reduce((sum, p) => sum + p.effectiveRating, 0);

    // Inverted fullbacks transfer 15% FB Reff from Def to Mid
    if (prevState.homeTactics.roleToggles?.invertedFullbacks) {
      const fbRating = homeLineup.filter(p => ['LB', 'RB'].includes(p.player.primaryPosition)).reduce((sum, p) => sum + p.effectiveRating, 0);
      homeMid += fbRating * 0.15;
    }
    if (prevState.awayTactics.roleToggles?.invertedFullbacks) {
      const fbRating = awayLineup.filter(p => ['LB', 'RB'].includes(p.player.primaryPosition)).reduce((sum, p) => sum + p.effectiveRating, 0);
      awayMid += fbRating * 0.15;
    }

    // High Line +10% Midfield bonus
    if (prevState.homeTactics.defensiveLine === 'HIGH') homeMid *= 1.10;
    if (prevState.awayTactics.defensiveLine === 'HIGH') awayMid *= 1.10;

    // Home advantage: Atmosphere and Capacity
    const atmosphere = homeClub.facilities?.stadiumAtmosphereLevel || 4;
    const capacity = homeClub.facilities?.stadiumCapacity || 99354;
    const hAdv = 1.00 + (atmosphere / 5) * 0.04 + (capacity / 100000) * 0.04;

    // Midfield contest
    const homeWinProb = (homeMid * hAdv) / ((homeMid * hAdv) + awayMid);
    const homeWinsBattle = Math.random() < homeWinProb;

    // Shift momentum
    if (homeWinsBattle) {
      momentum = Math.min(100, momentum + Math.round(15 + Math.random() * 10));
    } else {
      momentum = Math.max(-100, momentum - Math.round(15 + Math.random() * 10));
    }

    // Step 3.2: Attack vs Defense Penetration
    const attackingLineup = homeWinsBattle ? homeLineup : awayLineup;
    const defendingLineup = homeWinsBattle ? awayLineup : homeLineup;
    const attackTeam = homeWinsBattle ? 'HOME' : 'AWAY';
    const defendingTactics = homeWinsBattle ? prevState.awayTactics : prevState.homeTactics;

    const attackers = attackingLineup.filter(p => !p.redCard && (isAtt(p.player.primaryPosition) || isMid(p.player.primaryPosition)));
    const defenders = defendingLineup.filter(p => !p.redCard && (isDef(p.player.primaryPosition) || p.player.primaryPosition === 'CDM'));

    const avgAttack = attackers.length > 0
      ? attackers.reduce((sum, p) => sum + (p.player.attributes.attacking * 0.55 + p.player.attributes.creative * 0.45), 0) / attackers.length
      : 75;
    const avgDefend = defenders.length > 0
      ? defenders.reduce((sum, p) => sum + (p.player.attributes.defending * 0.60 + p.player.attributes.mental * 0.40), 0) / defenders.length
      : 75;

    const deltaSector = avgAttack - avgDefend;

    // Generate Chance based on deltaSector
    if (deltaSector >= -15) {
      let baseChanceXg = 0;
      let chanceTier: 'HALF' | 'GOOD' | 'BIG' = 'HALF';

      if (deltaSector < 10) {
        chanceTier = 'HALF';
        baseChanceXg = 0.05 + Math.random() * 0.06; // Raised from 0.03: half-chances should register ~0.07 avg xG
      } else if (deltaSector < 35) {
        chanceTier = 'GOOD';
        baseChanceXg = 0.10 + Math.random() * 0.25;
      } else {
        chanceTier = 'BIG';
        baseChanceXg = 0.36 + Math.random() * 0.42;
      }

      // If defending team uses High Line and lost clash: 1.35x breakaway multiplier
      if (defendingTactics.defensiveLine === 'HIGH') {
        baseChanceXg *= 1.35;
      }

      const xg = Number(baseChanceXg.toFixed(2));

      // Select shooter and assister (realistic distribution among forwards & attacking midfielders)
      const validShooters = attackingLineup.filter(p => !p.redCard && !p.injured);
      validShooters.sort((a, b) => b.player.attributes.attacking - a.player.attributes.attacking);
      
      const randShooter = Math.random();
      let shooter: InGamePlayerState;
      if (randShooter < 0.45 || validShooters.length < 2) {
        shooter = validShooters[0]; // Primary forward / striker (~45% shot share)
      } else if (randShooter < 0.75 || validShooters.length < 3) {
        shooter = validShooters[1]; // Secondary forward / winger (~30% shot share)
      } else if (randShooter < 0.90 || validShooters.length < 4) {
        shooter = validShooters[2]; // Attacking mid / inside forward (~15% shot share)
      } else {
        const randRest = 3 + Math.floor(Math.random() * (validShooters.length - 3));
        shooter = validShooters[randRest] || validShooters[0];
      }
      if (!shooter) return { ...prevState, currentMinute: minute };

      const validAssisters = attackingLineup.filter(p => !p.redCard && p.player.id !== shooter.player.id);
      validAssisters.sort((a, b) => b.player.attributes.creative - a.player.attributes.creative);
      const assister = validAssisters[0];

      // Goalkeeper
      const keeper = defendingLineup.find(p => p.player.primaryPosition === 'GK') || defendingLineup[0] || shooter;
      if (!keeper) return { ...prevState, currentMinute: minute };

      // Step 4: Shot Resolution & Clutch Chaos
      const shooterScore = shooter.player.attributes.attacking * 0.6 + shooter.player.attributes.mental * 0.4;
      const keeperScore = keeper.player.attributes.defending * 0.6 + keeper.player.attributes.mental * 0.4;

      // Clutch calculation
      const scoreDiff = Math.abs(homeScore - awayScore);
      let cClutch = 1.0;
      if (minute >= 80 && scoreDiff <= 1) {
        cClutch = 1.0 + (shooter.player.traits.clutch - 10) / 50;
      }

      const pGoal = Math.max(0.01, Math.min(0.95, (xg * (shooterScore / keeperScore) * cClutch) + normalRandom(0.035)));

      shooter.shots += 1;
      shooter.xgContributed = Number((shooter.xgContributed + xg).toFixed(2));

      if (attackTeam === 'HOME') {
        homeShots += 1;
        homeXg = Number((homeXg + xg).toFixed(2));
      } else {
        awayShots += 1;
        awayXg = Number((awayXg + xg).toFixed(2));
      }

      if (Math.random() < pGoal) {
        // GOAL!
        if (attackTeam === 'HOME') {
          homeScore += 1;
          homeShotsOnTarget += 1;
        } else {
          awayScore += 1;
          awayShotsOnTarget += 1;
        }

        shooter.goals += 1;
        shooter.matchRating = Math.min(10.0, Number((shooter.matchRating + 1.0).toFixed(1)));
        if (assister) {
          assister.assists += 1;
          assister.matchRating = Math.min(10.0, Number((assister.matchRating + 0.6).toFixed(1)));
        }

        // Defenders & keeper rating drop on conceded goal
        defendingLineup.forEach(dp => {
          if (['CB', 'LB', 'RB', 'GK'].includes(dp.player.primaryPosition)) {
            dp.matchRating = Math.max(5.0, Number((dp.matchRating - 0.35).toFixed(1)));
          }
        });

        newEvents.push({
          minute,
          type: 'GOAL',
          team: attackTeam,
          playerId: shooter.player.id,
          playerName: shooter.player.name,
          assistPlayerId: assister?.player.id,
          assistPlayerName: assister?.player.name,
          xg,
          description: assister 
            ? `GOAL! ${shooter.player.name} (${xg} xG) slots it home after an incisive pass from ${assister.player.name}!`
            : `GOAL! ${shooter.player.name} (${xg} xG) finishes a brilliant individual effort!`,
        });
      } else {
        // SAVED or CHANCE MISSED
        const isOnTarget = Math.random() < 0.65;
        if (isOnTarget) {
          if (attackTeam === 'HOME') homeShotsOnTarget += 1;
          else awayShotsOnTarget += 1;

          keeper.matchRating = Math.min(10.0, Number((keeper.matchRating + 0.35).toFixed(1)));

          newEvents.push({
            minute,
            type: 'SAVED',
            team: attackTeam,
            playerId: shooter.player.id,
            playerName: shooter.player.name,
            xg,
            description: `GREAT SAVE! ${keeper.player.name} dives to deny ${shooter.player.name} from close range (${xg} xG).`,
          });
        } else {
          newEvents.push({
            minute,
            type: 'CHANCE_MISSED',
            team: attackTeam,
            playerId: shooter.player.id,
            playerName: shooter.player.name,
            xg,
            description: `MISSED! ${shooter.player.name} fires wide of the post (${xg} xG, ${chanceTier.toLowerCase()} chance).`,
          });
        }
      }
    } else {
      // Interception commentary
      const interceptor = defendingLineup.find(p => ['CB', 'CDM'].includes(p.player.primaryPosition)) || defendingLineup[0];
      interceptor.matchRating = Math.min(10.0, Number((interceptor.matchRating + 0.1).toFixed(1)));
      newEvents.push({
        minute,
        type: 'SAVED',
        team: attackTeam === 'HOME' ? 'AWAY' : 'HOME',
        playerId: interceptor.player.id,
        playerName: interceptor.player.name,
        description: `Clean defensive interception by ${interceptor.player.name} to shut down the build-up.`,
      });
    }
  }

  // Half time milestone
  if (minute === 45) {
    newEvents.push({
      minute: 45,
      type: 'SUBSTITUTION',
      team: 'HOME',
      playerId: '',
      playerName: 'Referee',
      description: `HALF TIME! Score stands at ${homeScore} - ${awayScore}. Players head down the tunnel.`,
    });
  }

  // Full time milestone
  if (minute === 90) {
    newEvents.push({
      minute: 90,
      type: 'SUBSTITUTION',
      team: 'HOME',
      playerId: '',
      playerName: 'Referee',
      description: `FULL TIME WHISTLE! Final Score: ${homeScore} - ${awayScore}.`,
    });
  }

  // Calculate dynamic possession %
  const totalMomentumWeight = 50 + (momentum / 2);
  const homePossessionPct = Math.min(75, Math.max(25, Math.round(totalMomentumWeight)));

  return {
    ...prevState,
    currentMinute: minute,
    homeLineup,
    awayLineup,
    homeScore,
    awayScore,
    homeXg,
    awayXg,
    homeShots,
    awayShots,
    homeShotsOnTarget,
    awayShotsOnTarget,
    homePossessionPct,
    momentum,
    events: newEvents,
    isFinished: minute >= 90,
  };
}

// In-game substitution handler
export function makeSubstitution(
  state: MatchSimulationState,
  team: 'HOME' | 'AWAY',
  playerOutId: string,
  playerInId: string
): MatchSimulationState {
  const isHome = team === 'HOME';
  const lineup = isHome ? [...state.homeLineup] : [...state.awayLineup];
  const bench = isHome ? [...state.homeBench] : [...state.awayBench];
  const subsRem = isHome ? state.subsRemaining.home : state.subsRemaining.away;

  if (subsRem <= 0) return state;

  const outIndex = lineup.findIndex(p => p.player.id === playerOutId);
  const inIndex = bench.findIndex(p => p.player.id === playerInId);

  if (outIndex === -1 || inIndex === -1) return state;

  const playerOut = lineup[outIndex];
  const playerIn = bench[inIndex];

  // Transfer player
  lineup[outIndex] = {
    ...playerIn,
    effectiveRating: calculateEffectiveRating(playerIn.player, playerIn.currentStamina),
  };
  bench.splice(inIndex, 1);

  const newEvent: MatchEvent = {
    minute: state.currentMinute,
    type: 'SUBSTITUTION',
    team,
    playerId: playerIn.player.id,
    playerName: playerIn.player.name,
    description: `SUBSTITUTION (${team}): ${playerIn.player.name} replaces ${playerOut.player.name}.`,
  };

  return {
    ...state,
    homeLineup: isHome ? lineup : state.homeLineup,
    awayLineup: !isHome ? lineup : state.awayLineup,
    homeBench: isHome ? bench : state.homeBench,
    awayBench: !isHome ? bench : state.awayBench,
    subsRemaining: {
      ...state.subsRemaining,
      [isHome ? 'home' : 'away']: subsRem - 1,
    },
    events: [...state.events, newEvent],
  };
}

// Instant Skip: Fast-forwards match to 90 minutes
export function simulateFullDeepMatch(
  initialState: MatchSimulationState,
  userClubId: string,
  homeClub: Club,
  awayClub: Club
): MatchSimulationState {
  let curr = initialState;
  while (!curr.isFinished && curr.currentMinute < 90) {
    curr = simulateMinute(curr, userClubId, homeClub, awayClub);
  }
  return curr;
}
