import { Fixture } from '../types/game';

export interface CupRoundConfig {
  name: string;
  roundNumber: number;
  date: string;
}

export const DOMESTIC_CUP_SCHEDULES: Record<string, CupRoundConfig[]> = {
  copadelrey: [
    { name: 'Round of 32', roundNumber: 1, date: '2026-10-28' },
    { name: 'Round of 16', roundNumber: 2, date: '2027-01-13' },
    { name: 'Quarter-Finals', roundNumber: 3, date: '2027-02-03' },
    { name: 'Semi-Finals', roundNumber: 4, date: '2027-03-03' },
    { name: 'Final', roundNumber: 5, date: '2027-04-17' },
  ],
  facup: [
    { name: 'Third Round Proper', roundNumber: 1, date: '2027-01-09' },
    { name: 'Fourth Round Proper', roundNumber: 2, date: '2027-01-30' },
    { name: 'Fifth Round', roundNumber: 3, date: '2027-02-27' },
    { name: 'Quarter-Finals', roundNumber: 4, date: '2027-03-20' },
    { name: 'Semi-Finals', roundNumber: 5, date: '2027-04-24' },
    { name: 'Final', roundNumber: 6, date: '2027-05-15' },
  ],
  carabaocup: [
    { name: 'Round 3', roundNumber: 1, date: '2026-09-23' },
    { name: 'Round 4', roundNumber: 2, date: '2026-10-28' },
    { name: 'Quarter-Finals', roundNumber: 3, date: '2026-12-16' },
    { name: 'Semi-Finals', roundNumber: 4, date: '2027-01-13' },
    { name: 'Final', roundNumber: 5, date: '2027-02-28' },
  ],
  dfbpokal: [
    { name: 'Round 2', roundNumber: 1, date: '2026-10-28' },
    { name: 'Round of 16', roundNumber: 2, date: '2026-12-02' },
    { name: 'Quarter-Finals', roundNumber: 3, date: '2027-02-03' },
    { name: 'Semi-Finals', roundNumber: 4, date: '2027-04-07' },
    { name: 'Final', roundNumber: 5, date: '2027-05-22' },
  ],
  coppaitalia: [
    { name: 'Round of 16', roundNumber: 1, date: '2026-12-16' },
    { name: 'Quarter-Finals', roundNumber: 2, date: '2027-01-27' },
    { name: 'Semi-Finals', roundNumber: 3, date: '2027-04-07' },
    { name: 'Final', roundNumber: 4, date: '2027-05-19' },
  ],
  coupedefrance: [
    { name: 'Round of 32', roundNumber: 1, date: '2027-01-09' },
    { name: 'Round of 16', roundNumber: 2, date: '2027-02-03' },
    { name: 'Quarter-Finals', roundNumber: 3, date: '2027-03-03' },
    { name: 'Semi-Finals', roundNumber: 4, date: '2027-04-21' },
    { name: 'Final', roundNumber: 5, date: '2027-05-08' },
  ],
};

/**
 * Generates single-elimination knockout cup fixtures.
 * Pairs participating clubs randomly or seeded for Round 1, and creates placeholder slots for subsequent rounds.
 */
export function generateCupFixtures(
  competitionId: string,
  clubIds: string[],
  customRounds?: CupRoundConfig[]
): Fixture[] {
  const rounds = customRounds || DOMESTIC_CUP_SCHEDULES[competitionId] || DOMESTIC_CUP_SCHEDULES.copadelrey;
  const fixtures: Fixture[] = [];

  // Shuffle clubs deterministically or order by seed
  const clubs = [...clubIds];
  if (clubs.length % 2 !== 0) clubs.push('BYE');

  // Round 1
  const r1Config = rounds[0];
  const r1Matches = clubs.length / 2;
  for (let m = 0; m < r1Matches; m++) {
    const home = clubs[m];
    const away = clubs[clubs.length - 1 - m];
    if (home !== 'BYE' && away !== 'BYE') {
      fixtures.push({
        id: `${competitionId}_r1_m${m}_${home}_${away}`,
        competitionId,
        matchday: 1,
        date: r1Config.date,
        homeClubId: home,
        awayClubId: away,
        isPlayed: false,
      });
    }
  }

  return fixtures;
}
