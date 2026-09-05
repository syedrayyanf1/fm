import { Club, Competition, Fixture, Player, TableRow } from '../types/game';
import { SeasonTransitionReport } from '../types/season';
import { calculateOvr } from '../data/derivation';
import { generateLeagueFixtures } from '../scheduler/bergerScheduler';
import { generateSwissLeagueFixtures } from '../scheduler/swissScheduler';

export interface SeasonTransitionResult {
  report: SeasonTransitionReport;
  updatedClubs: Record<string, Club>;
  updatedPlayers: Record<string, Player>;
  updatedCompetitions: Record<string, Competition>;
  updatedFixtures: Fixture[];
  newCurrentDate: string;
}

const NATION_TIER2_SEEDS: Record<string, Array<{ id: string; name: string; rep: number }>> = {
  Spain: [
    { id: 'levante', name: 'Levante UD', rep: 74 },
    { id: 'zaragoza', name: 'Real Zaragoza', rep: 73 },
    { id: 'sportinggijon', name: 'Sporting Gijón', rep: 72 },
    { id: 'racing', name: 'Racing Santander', rep: 72 },
    { id: 'eibar', name: 'SD Eibar', rep: 73 },
    { id: 'oviedo', name: 'Real Oviedo', rep: 72 },
  ],
  England: [
    { id: 'leeds', name: 'Leeds United', rep: 77 },
    { id: 'burnley', name: 'Burnley FC', rep: 76 },
    { id: 'sheffieldutd', name: 'Sheffield United', rep: 75 },
    { id: 'sunderland', name: 'Sunderland AFC', rep: 74 },
    { id: 'norwich', name: 'Norwich City', rep: 74 },
  ],
  Italy: [
    { id: 'sassuolo', name: 'Sassuolo', rep: 76 },
    { id: 'salernitana', name: 'Salernitana', rep: 73 },
    { id: 'frosinone', name: 'Frosinone', rep: 72 },
    { id: 'palermo', name: 'Palermo FC', rep: 73 },
  ],
  Germany: [
    { id: 'schalke', name: 'FC Schalke 04', rep: 75 },
    { id: 'hertha', name: 'Hertha BSC', rep: 75 },
    { id: 'hamburger', name: 'Hamburger SV', rep: 76 },
    { id: 'cologne', name: '1. FC Köln', rep: 76 },
  ],
  France: [
    { id: 'lorient', name: 'FC Lorient', rep: 74 },
    { id: 'metz', name: 'FC Metz', rep: 73 },
    { id: 'clermont', name: 'Clermont Foot', rep: 72 },
    { id: 'bordeaux', name: 'Girondins de Bordeaux', rep: 73 },
  ],
};

export function executeSeasonTransition(
  currentDate: string,
  clubs: Record<string, Club>,
  players: Record<string, Player>,
  competitions: Record<string, Competition>,
  userClubId: string,
  penaltiesByClubId: Record<string, number> = {}
): SeasonTransitionResult {
  const previousSeason = '2026/27';
  const newSeason = '2027/28';
  const newStartDate = '2027-08-01';

  const updatedClubs: Record<string, Club> = JSON.parse(JSON.stringify(clubs));
  const updatedPlayers: Record<string, Player> = JSON.parse(JSON.stringify(players));
  const updatedCompetitions: Record<string, Competition> = JSON.parse(JSON.stringify(competitions));

  const promotedClubs: SeasonTransitionReport['promotedClubs'] = [];
  const relegatedClubs: SeasonTransitionReport['relegatedClubs'] = [];

  // =========================================================================
  // STEP 1: PROMOTION & RELEGATION (Spain, England, Italy, Germany, France)
  // =========================================================================
  Object.values(updatedCompetitions).forEach(comp => {
    if (comp.tier === 1 && comp.table && comp.table.length > 0) {
      // Sort final table
      const sorted = [...comp.table].sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        return b.goalDifference - a.goalDifference;
      });

      // Bottom clubs to relegate
      const relegateCount = comp.country === 'Germany' || comp.country === 'France' ? 2 : 3;
      const relegatedRows = sorted.slice(-relegateCount);

      // Candidate promoted clubs from Nation Tier 2 seed
      const tier2Candidates = NATION_TIER2_SEEDS[comp.country] || NATION_TIER2_SEEDS.Spain;
      const promotedCandidates = tier2Candidates.slice(0, relegateCount);

      relegatedRows.forEach((row, idx) => {
        const relClub = updatedClubs[row.clubId];
        const promSeed = promotedCandidates[idx];

        if (relClub && promSeed) {
          relegatedClubs.push({
            clubId: relClub.id,
            clubName: relClub.name,
            fromLeague: comp.name,
            toLeague: `${comp.country} Tier 2`,
          });

          // If promoted seed doesn't exist in clubs, create it
          if (!updatedClubs[promSeed.id]) {
            updatedClubs[promSeed.id] = {
              id: promSeed.id,
              name: promSeed.name,
              shortName: promSeed.name.split(' ')[0],
              crestUrl: '/crests/generic.svg',
              leagueId: comp.id,
              reputation: promSeed.rep,
              dna: 'MONEYBALL',
              rivalClubIds: [],
              boardTrust: 75,
              boardObjectives: [],
              tactics: relClub.tactics,
              facilities: {
                stadiumCapacity: 28000,
                stadiumExecutiveBoxes: 20,
                stadiumAtmosphereLevel: 3,
                commercialMegastoreLevel: 3,
                trainingGroundLevel: 3,
                medicalCenterLevel: 3,
                youthAcademyLevel: 3,
              },
              finances: {
                balance: 15000000,
                transferBudget: 10000000,
                wageBudgetWeekly: 400000,
                allocatedFeePercentage: 50,
                annualOperatingRevenue: 85000000,
                squadCostRatio: 0.65,
                activeLoans: [],
                economicLeversSoldPercentage: 0,
              },
              relationsWithUser: 0,
            };
          } else {
            updatedClubs[promSeed.id].leagueId = comp.id;
          }

          promotedClubs.push({
            clubId: promSeed.id,
            clubName: promSeed.name,
            fromLeague: `${comp.country} Tier 2`,
            toLeague: comp.name,
          });

          // Swap in competition clubIds
          const swapIdx = comp.clubIds.indexOf(relClub.id);
          if (swapIdx !== -1) {
            comp.clubIds[swapIdx] = promSeed.id;
          }
          relClub.leagueId = `${comp.id}_tier2`;
        }
      });

      // Re-initialize table to 0-0-0
      comp.currentMatchday = 1;
      comp.table = comp.clubIds.map(cId => {
        const deduction = penaltiesByClubId[cId] || 0;
        return {
          clubId: cId,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0,
          points: deduction > 0 ? -deduction : 0,
          pointsDeduction: deduction > 0 ? deduction : undefined,
          form: [],
        };
      });
    }
  });

  // Identify league and UCL champions for report
  const primaryComp = Object.values(updatedCompetitions).find(c => c.tier === 1) || Object.values(updatedCompetitions)[0];
  const sortedFirstTable = primaryComp?.table ? [...primaryComp.table].sort((a, b) => b.points - a.points) : [];
  const topClubId = sortedFirstTable[0]?.clubId || 'barcelona';
  const leagueChamp = updatedClubs[topClubId] || { name: 'FC Barcelona' };

  // =========================================================================
  // STEP 2: DYNAMIC POTENTIAL RECALIBRATION PASS (Players < 24)
  // =========================================================================
  let playersPotentialAdjustedCount = 0;

  Object.values(updatedPlayers).forEach(p => {
    if (p.age < 24) {
      const isStarterRate = p.isStarter ? 0.85 : 0.25;
      let playtimeBonus = 0;
      if (isStarterRate >= 0.70) playtimeBonus = 2;
      else if (isStarterRate < 0.30) playtimeBonus = -2;

      const formSum = (p.formHistory || [7.0, 7.0, 7.0]).reduce((a, b) => a + b, 0);
      const avgForm = formSum / Math.max(1, p.formHistory?.length || 1);
      let formBonus = 0;
      if (avgForm >= 7.30) formBonus = 2;
      else if (avgForm < 6.50) formBonus = -2;

      const delta = playtimeBonus + formBonus;
      if (delta !== 0) {
        const currentPot = p.dynamicPotential || p.overallRating + 4;
        const newPot = Math.max(p.overallRating, Math.min(p.potentialCap || 99, currentPot + delta));
        p.dynamicPotential = newPot;
        playersPotentialAdjustedCount++;
      }
    }
  });

  // =========================================================================
  // STEP 3: DYNAMIC AGING & LONGEVITY PASS (All players age + 1, age >= 29 decline)
  // =========================================================================
  let playersAgedCount = 0;

  Object.values(updatedPlayers).forEach(p => {
    p.age += 1;
    playersAgedCount++;

    if (p.age >= 29) {
      const pos = p.primaryPosition;
      const isPaceAttacker = ['ST', 'LW', 'RW', 'LM', 'RM'].includes(pos);
      const isPlaymakerOrCb = ['CAM', 'CM', 'CB'].includes(pos);
      const isGk = pos === 'GK';

      if (isPaceAttacker) {
        const drop = Math.floor(Math.random() * 3) + 3; // -3 to -5
        p.attributes.physical = Math.max(35, p.attributes.physical - drop);
      } else if (isPlaymakerOrCb) {
        p.attributes.physical = Math.max(40, p.attributes.physical - 2);
        p.attributes.mental = Math.min(99, p.attributes.mental + 1);
      } else if (isGk) {
        p.attributes.physical = Math.max(45, p.attributes.physical - 1);
      }

      // Permanent injury drag if player experienced severe injury
      if (p.injuryType && (p.injuryType.includes('ligament') || p.injuryType.includes('torn') || p.injuryType.includes('cruciate'))) {
        p.attributes.physical = Math.max(30, p.attributes.physical - 2);
      }

      p.overallRating = calculateOvr(p.attributes, p.primaryPosition);
      p.dynamicPotential = Math.min(p.dynamicPotential, p.overallRating);
      p.marketValue = Math.round(p.marketValue * 0.85);
    }
  });

  // =========================================================================
  // STEP 4: CALENDAR RESET, SCHEDULE REGENERATION & BUDGET ALLOCATION
  // =========================================================================
  const updatedFixtures: Fixture[] = [];

  // Regenerate league fixtures for all competitions using Berger Scheduler
  Object.values(updatedCompetitions).forEach(comp => {
    if (comp.clubIds && comp.clubIds.length >= 2) {
      const newLeagueFixtures = generateLeagueFixtures(comp.id, comp.clubIds, '2027-08-14');
      updatedFixtures.push(...newLeagueFixtures);
    }
  });

  // Regenerate Swiss continental phase
  try {
    const swissFixtures = generateSwissLeagueFixtures('comp-ucl', undefined, updatedFixtures);
    updatedFixtures.push(...swissFixtures);
  } catch (err) {
    console.warn('Swiss scheduler generated with fallback', err);
  }

  // Allocate fresh transfer budgets
  Object.values(updatedClubs).forEach(club => {
    const revenue = club.finances.annualOperatingRevenue || 200000000;
    const isFrozen = club.finances.transferBudget === 0 && penaltiesByClubId[club.id] !== undefined;

    if (!isFrozen) {
      const freshAllocation = Math.round(revenue * 0.18);
      club.finances.transferBudget = Math.max(club.finances.transferBudget, freshAllocation);
      club.finances.balance += Math.round(freshAllocation * 0.5);
    }

    // Refresh user board objectives
    if (club.id === userClubId) {
      club.boardTrust = Math.max(70, club.boardTrust);
      club.boardObjectives = [
        {
          id: `obj-2027-1`,
          type: 'LEAGUE',
          description: 'Defend & Secure Domestic League Title',
          weight: 40,
          targetProgress: 38,
          currentProgress: 0,
          isCompleted: false,
        },
        {
          id: `obj-2027-2`,
          type: 'HOLY_GRAIL',
          description: 'Reach Continental UEFA Champions League Final',
          weight: 30,
          targetProgress: 1,
          currentProgress: 0,
          isCompleted: false,
        },
        {
          id: `obj-2027-3`,
          type: 'FINANCIAL',
          description: 'Maintain Squad Cost Ratio strictly below 70%',
          weight: 30,
          targetProgress: 70,
          currentProgress: Math.round(club.finances.squadCostRatio * 100),
          isCompleted: club.finances.squadCostRatio <= 0.70,
        },
      ];
    }
  });

  const report: SeasonTransitionReport = {
    previousSeason,
    newSeason,
    promotedClubs,
    relegatedClubs,
    leagueChampion: {
      clubId: topClubId,
      clubName: leagueChamp.name,
      points: sortedFirstTable[0]?.points || 88,
    },
    uclWinner: {
      clubId: 'club-real-madrid',
      clubName: 'Real Madrid',
    },
    playersAgedCount,
    playersPotentialAdjustedCount,
  };

  return {
    report,
    updatedClubs,
    updatedPlayers,
    updatedCompetitions,
    updatedFixtures,
    newCurrentDate: newStartDate,
  };
}
