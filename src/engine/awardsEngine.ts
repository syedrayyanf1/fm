import { Club, Competition, Player } from '../types/game';
import { AwardsGalaPayload, AwardWinner, BallonDorPodium } from '../types/season';

interface PlayerPerformance {
  player: Player;
  club: Club;
  competition?: Competition;
  avgRating: number;
  goals: number;
  assists: number;
  cleanSheets: number;
  trophyBonus: number;
  isUclWinner: boolean;
  isLeagueWinner: boolean;
  isCupWinner: boolean;
}

export function calculateAwardsGala(
  seasonYear: string,
  players: Record<string, Player>,
  clubs: Record<string, Club>,
  competitions: Record<string, Competition>
): AwardsGalaPayload {
  // 1. Identify Champions across competitions
  const leagueWinners: Record<string, string> = {}; // leagueId -> champion clubId
  let uclWinnerClubId = '';

  Object.values(competitions).forEach(comp => {
    if (!comp.table || comp.table.length === 0) return;
    const sorted = [...comp.table].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return b.goalDifference - a.goalDifference;
    });
    const championId = sorted[0]?.clubId;
    if (comp.id === 'comp-ucl' || comp.name.toLowerCase().includes('champions')) {
      uclWinnerClubId = championId;
    } else {
      leagueWinners[comp.id] = championId;
    }
  });

  // Fallback for UCL winner if no ucl table yet: highest reputation club in Tier 1
  if (!uclWinnerClubId) {
    const topClubs = Object.values(clubs).sort((a, b) => b.reputation - a.reputation);
    uclWinnerClubId = topClubs[0]?.id || 'club-real-madrid';
  }

  // 2. Compute performance metrics for every player
  const performances: PlayerPerformance[] = [];

  Object.values(players).forEach(player => {
    const club = clubs[player.clubId];
    if (!club) return;
    const comp = competitions[club.leagueId];
    const tableRow = comp?.table?.find(r => r.clubId === club.id);
    const matchesPlayed = tableRow?.played || 34;
    const clubGoalsFor = tableRow?.goalsFor || 65;
    const clubGoalsAgainst = tableRow?.goalsAgainst || 38;

    // Avg form
    const formSum = (player.formHistory || [7.0, 7.0, 7.0]).reduce((a, b) => a + b, 0);
    const avgForm = formSum / Math.max(1, player.formHistory?.length || 1);
    const ratingBase = 6.7 + ((player.overallRating - 75) * 0.035) + ((avgForm - 7.0) * 0.35);
    const avgRating = Number(Math.min(8.95, Math.max(6.2, ratingBase)).toFixed(2));

    // Derive realistic goals based on position and attacking attributes
    let goals = 0;
    const isForward = ['ST', 'LW', 'RW'].includes(player.primaryPosition);
    const isMidfielder = ['CAM', 'CM', 'LM', 'RM'].includes(player.primaryPosition);
    const isDefender = ['CB', 'LB', 'RB'].includes(player.primaryPosition);
    const isGk = player.primaryPosition === 'GK';

    if (isForward) {
      const share = player.primaryPosition === 'ST' ? 0.38 : 0.22;
      goals = Math.round((player.attributes.attacking / 90) * (clubGoalsFor * share));
      if (player.overallRating >= 88) goals += 5;
    } else if (isMidfielder) {
      const share = player.primaryPosition === 'CAM' ? 0.16 : 0.08;
      goals = Math.round((player.attributes.attacking / 95) * (clubGoalsFor * share));
    } else if (isDefender) {
      goals = Math.round((player.attributes.attacking / 100) * 3);
    }

    // Derive assists
    let assists = 0;
    if (isMidfielder) {
      const share = player.primaryPosition === 'CAM' ? 0.32 : 0.22;
      assists = Math.round((player.attributes.creative / 90) * (clubGoalsFor * share));
      if (player.overallRating >= 88) assists += 4;
    } else if (isForward) {
      assists = Math.round((player.attributes.creative / 95) * (clubGoalsFor * 0.18));
    } else if (isDefender) {
      assists = ['LB', 'RB'].includes(player.primaryPosition) ? Math.round((player.attributes.creative / 100) * 6) : 1;
    }

    // Derive clean sheets for GK
    let cleanSheets = 0;
    if (isGk) {
      const csRate = Math.max(0.2, (100 - clubGoalsAgainst * 1.5) / 100);
      cleanSheets = Math.round(matchesPlayed * csRate);
    }

    // Trophy bonuses: UCL +25, Domestic League (Tier 1) +15, Domestic Cup +5
    const isUcl = club.id === uclWinnerClubId;
    const isLeague = leagueWinners[club.leagueId] === club.id;
    const isCup = Math.random() < 0.15; // Simulated domestic cup

    let trophyBonus = 0;
    if (isUcl) trophyBonus += 25;
    if (isLeague && comp?.tier === 1) trophyBonus += 15;
    if (isCup) trophyBonus += 5;

    performances.push({
      player,
      club,
      competition: comp,
      avgRating,
      goals,
      assists,
      cleanSheets,
      trophyBonus,
      isUclWinner: isUcl,
      isLeagueWinner: isLeague,
      isCupWinner: isCup,
    });
  });

  // 1. BALLON D'OR FORMULA:
  // Score = (AvgMatchRating * 40) + (Goals * 1.2) + (Assists * 0.9) + TrophyBonus + (Reputation * 0.15)
  const ballonDorScores = performances
    .map(perf => {
      const score = Number((
        (perf.avgRating * 40) +
        (perf.goals * 1.2) +
        (perf.assists * 0.9) +
        perf.trophyBonus +
        (perf.player.reputation * 0.15)
      ).toFixed(1));

      return {
        playerId: perf.player.id,
        playerName: perf.player.name,
        clubId: perf.club.id,
        clubName: perf.club.name,
        statValue: `${perf.goals}G / ${perf.assists}A • ${perf.avgRating} RTG`,
        score,
        awardType: 'BALLON_DOR' as const,
      };
    })
    .sort((a, b) => (b.score || 0) - (a.score || 0));

  const podium: BallonDorPodium = {
    winner: ballonDorScores[0] || {
      playerId: 'p-1',
      playerName: 'Kylian Mbappé',
      clubId: 'club-real-madrid',
      clubName: 'Real Madrid',
      statValue: '42G / 14A • 8.45 RTG',
      score: 412.5,
      awardType: 'BALLON_DOR',
    },
    second: ballonDorScores[1] || {
      playerId: 'p-2',
      playerName: 'Erling Haaland',
      clubId: 'club-man-city',
      clubName: 'Manchester City',
      statValue: '44G / 6A • 8.32 RTG',
      score: 398.2,
      awardType: 'BALLON_DOR',
    },
    third: ballonDorScores[2] || {
      playerId: 'p-3',
      playerName: 'Lamine Yamal',
      clubId: 'club-barcelona',
      clubName: 'FC Barcelona',
      statValue: '21G / 24A • 8.38 RTG',
      score: 391.0,
      awardType: 'BALLON_DOR',
    },
  };

  // 2. EUROPEAN GOLDEN SHOE:
  // Highest league goals: Tier 1 * 2.0 vs Tier 2 * 1.5
  const goldenShoeList = performances
    .map(perf => {
      const tierMult = perf.competition?.tier === 2 ? 1.5 : 2.0;
      const shoePoints = Number((perf.goals * tierMult).toFixed(1));
      return {
        playerId: perf.player.id,
        playerName: perf.player.name,
        clubId: perf.club.id,
        clubName: perf.club.name,
        statValue: `${perf.goals} Goals (${shoePoints} pts)`,
        score: shoePoints,
        awardType: 'GOLDEN_SHOE' as const,
      };
    })
    .sort((a, b) => (b.score || 0) - (a.score || 0));

  const goldenShoeWinner: AwardWinner = goldenShoeList[0] || {
    playerId: 'p-gs',
    playerName: 'Erling Haaland',
    clubId: 'club-man-city',
    clubName: 'Manchester City',
    statValue: '36 Goals (72.0 pts)',
    score: 72,
    awardType: 'GOLDEN_SHOE',
  };

  // 3. CONTINENTAL PLAYMAKER AWARD:
  // Highest total assists
  const playmakerList = performances
    .map(perf => ({
      playerId: perf.player.id,
      playerName: perf.player.name,
      clubId: perf.club.id,
      clubName: perf.club.name,
      statValue: `${perf.assists} Assists`,
      score: perf.assists,
      awardType: 'PLAYMAKER' as const,
    }))
    .sort((a, b) => (b.score || 0) - (a.score || 0));

  const playmakerWinner: AwardWinner = playmakerList[0] || {
    playerId: 'p-pm',
    playerName: 'Kevin De Bruyne',
    clubId: 'club-man-city',
    clubName: 'Manchester City',
    statValue: '22 Assists',
    score: 22,
    awardType: 'PLAYMAKER',
  };

  // 4. GOLDEN GLOVE:
  // Goalkeeper with highest clean sheets
  const gloveList = performances
    .filter(p => p.player.primaryPosition === 'GK')
    .map(perf => ({
      playerId: perf.player.id,
      playerName: perf.player.name,
      clubId: perf.club.id,
      clubName: perf.club.name,
      statValue: `${perf.cleanSheets} Clean Sheets`,
      score: perf.cleanSheets,
      awardType: 'GOLDEN_GLOVE' as const,
    }))
    .sort((a, b) => (b.score || 0) - (a.score || 0));

  const goldenGloveWinner: AwardWinner = gloveList[0] || {
    playerId: 'p-gg',
    playerName: 'Thibaut Courtois',
    clubId: 'club-real-madrid',
    clubName: 'Real Madrid',
    statValue: '19 Clean Sheets',
    score: 19,
    awardType: 'GOLDEN_GLOVE',
  };

  // 5. MANAGER OF THE YEAR:
  // Team that outperformed preseason Board Objective delta by the highest margin
  const managerCandidates = Object.values(clubs).map(club => {
    const comp = competitions[club.leagueId];
    const tableRow = comp?.table?.find(r => r.clubId === club.id);
    const actualPoints = tableRow?.points || 50;
    const expectedPoints = Math.round(club.reputation * 0.9);
    const delta = actualPoints - expectedPoints;
    const trustDelta = (club.boardTrust ?? 75) - 50;
    const score = delta + (trustDelta * 0.3);

    return {
      clubName: club.name,
      managerName: club.name.includes('Barcelona') ? 'Hansi Flick' : (club.name.includes('Madrid') ? 'Carlo Ancelotti' : `${club.shortName} Manager`),
      objectiveScore: Number(score.toFixed(1)),
      description: `Overachieved preseason objective by +${Math.max(0, delta)} pts and ${club.boardTrust}% board satisfaction`,
    };
  }).sort((a, b) => b.objectiveScore - a.objectiveScore);

  const bestManager = managerCandidates[0] || {
    clubName: 'FC Barcelona',
    managerName: 'Hansi Flick',
    objectiveScore: 24.5,
    description: 'Overachieved preseason objective by +18 pts and 95% board satisfaction',
  };

  return {
    seasonYear,
    ballonDor: podium,
    goldenShoe: goldenShoeWinner,
    playmaker: playmakerWinner,
    goldenGlove: goldenGloveWinner,
    managerOfTheYear: bestManager,
  };
}
