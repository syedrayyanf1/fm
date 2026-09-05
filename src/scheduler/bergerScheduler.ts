import { Fixture } from '../types/game';

/**
 * Generates a full double round-robin league schedule using the Berger tables algorithm.
 * Evenly alternates home/away fixtures across totalRounds = (N-1) * 2.
 */
export function generateLeagueFixtures(
  competitionId: string,
  clubIds: string[],
  seasonStartDate = '2026-08-15'
): Fixture[] {
  const teams = [...clubIds];
  if (teams.length % 2 !== 0) {
    teams.push('BYE');
  }
  const n = teams.length;
  const totalRounds = (n - 1) * 2;
  const matchesPerRound = n / 2;
  const fixtures: Fixture[] = [];

  const currentDate = new Date(seasonStartDate);

  for (let round = 0; round < totalRounds; round++) {
    // Schedule league matchday on weekends (Saturday / Sunday)
    const matchDateStr = currentDate.toISOString().split('T')[0];

    for (let match = 0; match < matchesPerRound; match++) {
      let home = (round + match) % (n - 1);
      let away = (n - 1 - match + round) % (n - 1);
      if (match === 0) away = n - 1;

      // Swap home/away for the second half of the season
      if (round >= n - 1) {
        const temp = home;
        home = away;
        away = temp;
      }

      const homeId = teams[home];
      const awayId = teams[away];

      if (homeId !== 'BYE' && awayId !== 'BYE') {
        fixtures.push({
          id: `${competitionId}_r${round + 1}_m${match}_${homeId}_${awayId}`,
          competitionId,
          matchday: round + 1,
          date: matchDateStr,
          homeClubId: homeId,
          awayClubId: awayId,
          isPlayed: false,
        });
      }
    }
    // Advance 7 days to next weekend
    currentDate.setDate(currentDate.getDate() + 7);
  }

  return fixtures;
}
