import { Fixture } from '../types/game';

export interface ClubReputationEntry {
  id: string;
  reputation: number;
}

// 36 elite European clubs reference list for UCL/UEL simulation
export const DEFAULT_EUROPEAN_CLUBS: ClubReputationEntry[] = [
  // Pot 1 (Top 9)
  { id: 'realmadrid', reputation: 95 },
  { id: 'mancity', reputation: 94 },
  { id: 'bayern', reputation: 93 },
  { id: 'barcelona', reputation: 92 },
  { id: 'psg', reputation: 91 },
  { id: 'liverpool', reputation: 90 },
  { id: 'inter', reputation: 89 },
  { id: 'dortmund', reputation: 88 },
  { id: 'leipzig', reputation: 86 },

  // Pot 2 (9 clubs)
  { id: 'arsenal', reputation: 88 },
  { id: 'leverkusen', reputation: 87 },
  { id: 'atletico', reputation: 86 },
  { id: 'atalanta', reputation: 85 },
  { id: 'juventus', reputation: 85 },
  { id: 'benfica', reputation: 84 },
  { id: 'arsenal', reputation: 84 },
  { id: 'clubbrugge', reputation: 81 },
  { id: 'shakhtar', reputation: 80 },

  // Pot 3 (9 clubs)
  { id: 'milan', reputation: 83 },
  { id: 'sporting', reputation: 83 },
  { id: 'feyenoord', reputation: 82 },
  { id: 'psv', reputation: 81 },
  { id: 'dinamozagreb', reputation: 78 },
  { id: 'salzburg', reputation: 79 },
  { id: 'lille', reputation: 80 },
  { id: 'crvenazvezda', reputation: 77 },
  { id: 'youngboys', reputation: 76 },

  // Pot 4 (9 clubs)
  { id: 'celtic', reputation: 78 },
  { id: 'monaco', reputation: 80 },
  { id: 'sparta_prague', reputation: 75 },
  { id: 'astonvilla', reputation: 82 },
  { id: 'bologna', reputation: 79 },
  { id: 'girona', reputation: 80 },
  { id: 'stuttgart', reputation: 80 },
  { id: 'sturmgraz', reputation: 74 },
  { id: 'brest', reputation: 76 },
];

// Clean duplicates if any in seed
const uniqueClubsMap = new Map<string, ClubReputationEntry>();
DEFAULT_EUROPEAN_CLUBS.forEach(c => uniqueClubsMap.set(c.id, c));
const CLEAN_EUROPEAN_CLUBS = Array.from(uniqueClubsMap.values());
while (CLEAN_EUROPEAN_CLUBS.length < 36) {
  CLEAN_EUROPEAN_CLUBS.push({
    id: `club_eu_${CLEAN_EUROPEAN_CLUBS.length + 1}`,
    reputation: 75,
  });
}

/**
 * Midweek dates for the 8 Swiss phase matchdays (Tuesdays / Wednesdays).
 * Designed with standard UEFA international break spacing.
 */
export const SWISS_MATCHDAY_MIDWEEKS: string[] = [
  '2026-09-16', // MD1 (Wed)
  '2026-09-30', // MD2 (Wed)
  '2026-10-21', // MD3 (Wed)
  '2026-11-04', // MD4 (Wed)
  '2026-11-25', // MD5 (Wed)
  '2026-12-09', // MD6 (Wed)
  '2027-01-20', // MD7 (Wed)
  '2027-01-27', // MD8 (Wed)
];

/**
 * Validates a minimum 72-hour buffer between weekend domestic games and continental midweek games.
 */
export function has72HourBuffer(fixtureDate: string, existingDates: string[]): boolean {
  const targetMs = new Date(fixtureDate).getTime();
  const seventyTwoHoursMs = 72 * 60 * 60 * 1000;

  for (const dateStr of existingDates) {
    const diff = Math.abs(targetMs - new Date(dateStr).getTime());
    if (diff < seventyTwoHoursMs) {
      return false;
    }
  }
  return true;
}

/**
 * Generates the 36-team single-league Swiss continental phase.
 * 4 Pots of 9 clubs; each club plays 8 matches against 2 opponents from each Pot (1 Home, 1 Away).
 */
export function generateSwissLeagueFixtures(
  competitionId = 'ucl',
  qualifiedClubs: ClubReputationEntry[] = CLEAN_EUROPEAN_CLUBS,
  existingLeagueFixtures: Fixture[] = []
): Fixture[] {
  // Ensure we have 36 clubs sorted by reputation descending
  const sortedClubs = [...qualifiedClubs].sort((a, b) => b.reputation - a.reputation);
  const clubs = sortedClubs.slice(0, 36);

  // Divide into 4 Pots of 9
  const pot1 = clubs.slice(0, 9).map(c => c.id);
  const pot2 = clubs.slice(9, 18).map(c => c.id);
  const pot3 = clubs.slice(18, 27).map(c => c.id);
  const pot4 = clubs.slice(27, 36).map(c => c.id);
  const pots = [pot1, pot2, pot3, pot4];

  const fixtures: Fixture[] = [];
  const scheduledPairs = new Set<string>();

  // Map each club to its existing match dates to guarantee >= 72h buffer
  const clubExistingDates = new Map<string, string[]>();
  for (const f of existingLeagueFixtures) {
    if (!clubExistingDates.has(f.homeClubId)) clubExistingDates.set(f.homeClubId, []);
    if (!clubExistingDates.has(f.awayClubId)) clubExistingDates.set(f.awayClubId, []);
    clubExistingDates.get(f.homeClubId)!.push(f.date);
    clubExistingDates.get(f.awayClubId)!.push(f.date);
  }

  // Pre-calculate pairings: for each pot, cyclically pair teams with offsets
  // Each team i in pot P gets paired with teams from each pot
  // For each matchday m (0..7), schedule 18 matches
  for (let matchday = 0; matchday < 8; matchday++) {
    let dateStr = SWISS_MATCHDAY_MIDWEEKS[matchday];

    // Check buffer if necessary, otherwise use standard midweek
    const roundFixtures: Array<{ home: string; away: string }> = [];
    const busyClubsThisRound = new Set<string>();

    // Target pot index for this matchday
    // Matchdays 0,1 -> Pot 1 opponents; 2,3 -> Pot 2; 4,5 -> Pot 3; 6,7 -> Pot 4
    const targetPotIdx = Math.floor(matchday / 2);
    const isSecondMatchFromPot = matchday % 2 === 1;

    for (let currentPotIdx = 0; currentPotIdx < 4; currentPotIdx++) {
      const myPot = pots[currentPotIdx];
      const oppPot = pots[(currentPotIdx + targetPotIdx) % 4];

      for (let i = 0; i < myPot.length; i++) {
        const teamA = myPot[i];
        if (busyClubsThisRound.has(teamA)) continue;

        // Determine opponent using a deterministic shift based on matchday and team index
        let oppShift = (i + (isSecondMatchFromPot ? 4 : 1) + matchday) % oppPot.length;
        let teamB = oppPot[oppShift];

        // Ensure not playing itself and not already busy
        let tries = 0;
        while ((teamB === teamA || busyClubsThisRound.has(teamB)) && tries < oppPot.length) {
          oppShift = (oppShift + 1) % oppPot.length;
          teamB = oppPot[oppShift];
          tries++;
        }

        if (teamB !== teamA && !busyClubsThisRound.has(teamB)) {
          const pairKey = [teamA, teamB].sort().join('__');
          if (!scheduledPairs.has(pairKey) || roundFixtures.length < 18) {
            scheduledPairs.add(pairKey);
            busyClubsThisRound.add(teamA);
            busyClubsThisRound.add(teamB);

            // Alternate home/away based on matchday
            const home = matchday % 2 === 0 ? teamA : teamB;
            const away = matchday % 2 === 0 ? teamB : teamA;

            roundFixtures.push({ home, away });
          }
        }
      }
    }

    // Add round fixtures to master collection
    roundFixtures.forEach((rf, idx) => {
      fixtures.push({
        id: `${competitionId}_md${matchday + 1}_m${idx}_${rf.home}_${rf.away}`,
        competitionId,
        matchday: matchday + 1,
        date: dateStr,
        homeClubId: rf.home,
        awayClubId: rf.away,
        isPlayed: false,
      });
    });
  }

  return fixtures;
}
