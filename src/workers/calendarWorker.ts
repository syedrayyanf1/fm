import {
  Fixture,
  Club,
  Player,
  Competition,
  SimInterruptPayload,
  InterruptPreferences,
} from '../types/game';

interface StartSimPayload {
  targetDate: string;
  userClubId: string;
  currentDate: string;
  fixtures: Fixture[];
  clubs: Record<string, Club>;
  players: Record<string, Player>;
  competitions: Record<string, Competition>;
  interruptPreferences: InterruptPreferences;
  /** Preserved across interrupt/resume cycles so the worker always knows its canonical target */
  originalTargetDate?: string;
}

// Persistent bid throttle across simulation sessions/resumes
let isPaused = false;
let globalMonthlyBidCount: Record<string, number> = {};
let globalLastBidDateStr: string | null = null;

function daysBetween(d1: string, d2: string): number {
  const [y1, m1, day1] = d1.split('-').map(Number);
  const [y2, m2, day2] = d2.split('-').map(Number);
  const ms1 = Date.UTC(y1, m1 - 1, day1);
  const ms2 = Date.UTC(y2, m2 - 1, day2);
  return Math.abs(Math.round((ms2 - ms1) / (1000 * 60 * 60 * 24)));
}

function samplePoisson(lambda: number): number {
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do { k++; p *= Math.random(); } while (p > L);
  return k - 1;
}

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().split('T')[0];
}

function isInTransferWindow(dateStr: string): boolean {
  const month = parseInt(dateStr.split('-')[1], 10);
  return month === 8 || month === 1;
}

function getMonthKey(dateStr: string): string {
  return dateStr.slice(0, 7);
}

self.onmessage = (e: MessageEvent<{ type: string; payload?: StartSimPayload }>) => {
  const { type, payload } = e.data;
  if (type === 'PAUSE_SIMULATION') { isPaused = true; return; }
  if (type === 'START_SIMULATION' && payload) { isPaused = false; runSimulationLoop(payload); }
};

async function runSimulationLoop(data: StartSimPayload) {
  let { targetDate, userClubId, currentDate, fixtures, clubs, players, competitions, interruptPreferences } = data;
  const originalTargetDate = data.originalTargetDate ?? targetDate;

  const [sy, sm, sd] = currentDate.split('-').map(Number);
  const [ty, tm, td] = targetDate.split('-').map(Number);
  const startMs = Date.UTC(sy, sm - 1, sd);
  const targetMs = Date.UTC(ty, tm - 1, td);
  const totalDaysSpan = Math.max(1, Math.round((targetMs - startMs) / (1000 * 60 * 60 * 24)));

  const buyersPool = ['Manchester City', 'Paris Saint-Germain', 'Bayern Munich', 'Arsenal', 'Liverpool', 'Chelsea'];
  const injuryTypes = ['Torn Hamstring', 'Ankle Ligament Sprain', 'Knee Meniscus Strain', 'Adductor Muscle Tear'];

  const postInterrupt = (interrupt: SimInterruptPayload, extraState: Record<string, unknown> = {}) => {
    self.postMessage({
      type: 'SIMULATION_INTERRUPTED',
      payload: interrupt,
      stateSnapshot: { currentDate, fixtures, players, competitions, clubs, originalTargetDate, ...extraState },
    });
  };

  while (!isPaused) {
    // 1. USER MATCHDAY CHECK (Highest Priority)
    const userMatchToday = fixtures.find(f =>
      f.date === currentDate && !f.isPlayed &&
      (f.homeClubId === userClubId || f.awayClubId === userClubId)
    );

    if (userMatchToday && interruptPreferences.pauseOnMatchday) {
      const isHome = userMatchToday.homeClubId === userClubId;
      const oppId = isHome ? userMatchToday.awayClubId : userMatchToday.homeClubId;
      const oppClub = clubs[oppId] || { name: oppId };
      const comp = competitions[userMatchToday.competitionId] || { name: 'League Match' };
      postInterrupt({
        reason: 'MATCHDAY',
        detail: `${comp.name} Matchday vs ${oppClub.name} (${isHome ? 'Home' : 'Away'}).`,
        currentDate,
        relatedFixtureId: userMatchToday.id,
      });
      return;
    }

    // 2. TARGET DATE REACHED (Clean completion if no user fixture today)
    if (currentDate >= targetDate) {
      self.postMessage({
        type: 'SIMULATION_COMPLETE',
        stateSnapshot: { currentDate, fixtures, players, competitions, clubs, originalTargetDate },
      });
      return;
    }

    // 3. HARD-STOP CALENDAR EVENTS
    if (currentDate.endsWith('-08-31') || currentDate.endsWith('-01-31')) {
      postInterrupt({ reason: 'DEADLINE_DAY', detail: 'Transfer Deadline Day has arrived. The transfer window closes tonight at midnight.', currentDate });
      return;
    }
    if (currentDate.endsWith('-03-25')) {
      postInterrupt({ reason: 'YOUTH_INTAKE', detail: 'The Annual Youth Academy Intake trial showcase has arrived. New trialists are awaiting your assessment.', currentDate });
      return;
    }
    if (currentDate.endsWith('-06-02')) {
      postInterrupt({ reason: 'AWARDS_GALA', detail: "The Annual World Football Awards Gala is underway. The Ballon d'Or and European Golden Shoe winners are about to be unveiled.", currentDate });
      return;
    }
    if (currentDate.endsWith('-06-10')) {
      postInterrupt({ reason: 'SEASON_END', detail: 'The campaign has reached fiscal year-end. Complete the annual FFP audit and prepare for season rollover.', currentDate });
      return;
    }

    const userClubRef = clubs[userClubId];
    if (userClubRef && userClubRef.boardTrust <= 0) {
      postInterrupt({ reason: 'BOARD_SACKED', detail: 'The Board of Directors has terminated your managerial contract effective immediately.', currentDate });
      return;
    }

    // 4. SIMULATE AI MATCHES FOR TODAY
    let simulatedMatchesCount = 0;
    const dayFixtures = fixtures.filter(f => f.date === currentDate && !f.isPlayed);
    for (const fixture of dayFixtures) {
      if (fixture.homeClubId === userClubId || fixture.awayClubId === userClubId) continue;
      const homeOvr = (clubs[fixture.homeClubId]?.reputation || 78);
      const awayOvr = (clubs[fixture.awayClubId]?.reputation || 78);
      // Calibrated: additive home advantage (+2), capped delta, 1.44/1.18 base
      const cappedDelta = Math.max(-15, Math.min(15, (homeOvr + 2) - awayOvr));
      const lambdaHome = Math.max(0.5, Math.min(4.5, 1.44 + cappedDelta * 0.035));
      const lambdaAway = Math.max(0.5, Math.min(4.0, 1.18 - cappedDelta * 0.025));
      let homeScore = samplePoisson(lambdaHome);
      let awayScore = samplePoisson(lambdaAway);
      if (homeScore === 0 && Math.random() < 0.45) homeScore = 1;
      if (awayScore === 0 && Math.random() < 0.45) awayScore = 1;
      if (homeScore === awayScore && Math.random() < 0.22) {
        if (Math.random() < 0.50) homeScore += 1; else awayScore += 1;
      }

      fixture.isPlayed = true;
      fixture.result = {
        homeScore, awayScore,
        homeXg: Number((Math.max(0.3, homeScore * 0.85 + Math.random() * 0.4)).toFixed(2)),
        awayXg: Number((Math.max(0.2, awayScore * 0.85 + Math.random() * 0.3)).toFixed(2)),
        events: [],
      };
      simulatedMatchesCount++;

      const comp = competitions[fixture.competitionId];
      if (comp?.table) {
        comp.table = comp.table.map(row => {
          if (row.clubId === fixture.homeClubId) {
            const won = homeScore > awayScore, lost = homeScore < awayScore;
            return { ...row, played: row.played+1, won: row.won+(won?1:0), drawn: row.drawn+(!won&&!lost?1:0), lost: row.lost+(lost?1:0), goalsFor: row.goalsFor+homeScore, goalsAgainst: row.goalsAgainst+awayScore, goalDifference: row.goalDifference+(homeScore-awayScore), points: row.points+(won?3:!lost?1:0), form: [(won?'W':lost?'L':'D') as any, ...(row.form||[]).slice(0,4)] };
          }
          if (row.clubId === fixture.awayClubId) {
            const won = awayScore > homeScore, lost = awayScore < homeScore;
            return { ...row, played: row.played+1, won: row.won+(won?1:0), drawn: row.drawn+(!won&&!lost?1:0), lost: row.lost+(lost?1:0), goalsFor: row.goalsFor+awayScore, goalsAgainst: row.goalsAgainst+homeScore, goalDifference: row.goalDifference+(awayScore-homeScore), points: row.points+(won?3:!lost?1:0), form: [(won?'W':lost?'L':'D') as any, ...(row.form||[]).slice(0,4)] };
          }
          return row;
        });
        comp.table.sort((a,b) => b.points-a.points || b.goalDifference-a.goalDifference || b.goalsFor-a.goalsFor);
      }
    }

    // 5. PLAYER TRAINING TICK
    const userPlayers = Object.values(players).filter(p => p.clubId === userClubId);
    let majorInjuryOccurred: { player: Player; type: string; days: number } | null = null;
    let mutinyOccurredPlayer: Player | null = null;

    // Medical center scales injury risk: Level 5 → 20% of base risk; Level 1 → 100%
    const medicalLevel = userClubRef?.facilities?.medicalCenterLevel ?? 3;
    const medicalRiskFactor = Math.max(0.2, 1 - (medicalLevel - 1) * 0.20);

    for (const player of userPlayers) {
      if (player.stamina < 100) player.stamina = Math.min(100, player.stamina + 15);
      if (player.sharpness > 40) player.sharpness = Math.max(40, Number((player.sharpness - 0.8).toFixed(1)));

      if (player.isInjured && player.injuryDaysLeft) {
        player.injuryDaysLeft -= 1;
        if (player.injuryDaysLeft <= 0) { player.isInjured = false; player.injuryDaysLeft = 0; player.injuryType = undefined; }
      }

      if (interruptPreferences.pauseOnInjuries && player.isStarter && !player.isInjured && !majorInjuryOccurred) {
        const proneness = player.traits?.injuryProneness || 'NORMAL';
        const baseRisk = proneness === 'FRAGILE' ? 0.006 : proneness === 'LOW' ? 0.001 : 0.003;
        if (Math.random() < baseRisk * medicalRiskFactor) {
          const daysOut = Math.floor(14 + Math.random() * 16);
          const injType = injuryTypes[Math.floor(Math.random() * injuryTypes.length)];
          player.isInjured = true; player.injuryDaysLeft = daysOut; player.injuryType = injType;
          majorInjuryOccurred = { player, type: injType, days: daysOut };
        }
      }

      if (player.isRetraining && player.retrainingProgress !== undefined) {
        player.retrainingProgress = Math.min(100, Number((player.retrainingProgress + 0.4).toFixed(1)));
        if (player.retrainingProgress >= 100 && player.targetPosition) {
          if (!player.secondaryPositions.includes(player.targetPosition)) player.secondaryPositions = [...player.secondaryPositions, player.targetPosition];
          player.isRetraining = false;
        }
      }

      if (player.settlementProgress !== undefined && player.settlementProgress < 1.0) {
        player.settlementProgress = Math.min(1.0, Number((player.settlementProgress + 0.003).toFixed(3)));
      }

      if (player.unsettledStage && player.unsettledStage >= 2 && !mutinyOccurredPlayer) {
        mutinyOccurredPlayer = player;
      }
    }

    // 6. MAJOR INJURY INTERRUPT
    if (majorInjuryOccurred) {
      const { player, type, days } = majorInjuryOccurred;
      postInterrupt({ reason: 'MAJOR_INJURY', detail: `${player.name} suffered a ${type} in training (Out for ${Math.max(2, Math.round(days/7))} weeks).`, currentDate, relatedPlayerId: player.id });
      return;
    }

    // 7. PLAYER MUTINY INTERRUPT
    if (mutinyOccurredPlayer) {
      postInterrupt({ reason: 'PLAYER_MUTINY', detail: `${mutinyOccurredPlayer.name} has escalated unsettled status to Stage ${mutinyOccurredPlayer.unsettledStage} (Formal Transfer Request submitted).`, currentDate, relatedPlayerId: mutinyOccurredPlayer.id });
      return;
    }

    // 8. INCOMING TRANSFER BID — max 2 per month during transfer windows with 7-day cooldown
    if (interruptPreferences.pauseOnBids && isInTransferWindow(currentDate)) {
      const monthKey = getMonthKey(currentDate);
      const bidsThisMonth = globalMonthlyBidCount[monthKey] || 0;
      const cooldownElapsed = !globalLastBidDateStr || daysBetween(globalLastBidDateStr, currentDate) >= 7;

      if (bidsThisMonth < 2 && cooldownElapsed && Math.random() < 0.018) {
        const potentialTargets = userPlayers.filter(p => p.marketValue >= 30_000_000);
        if (potentialTargets.length > 0) {
          const targetPlayer = potentialTargets[Math.floor(Math.random() * potentialTargets.length)];
          const buyer = buyersPool[Math.floor(Math.random() * buyersPool.length)];
          const bidAmount = Math.round(targetPlayer.marketValue * (1.1 + Math.random() * 0.2));
          globalMonthlyBidCount[monthKey] = bidsThisMonth + 1;
          globalLastBidDateStr = currentDate;
          postInterrupt({ reason: 'TRANSFER_BID', detail: `${buyer} has submitted a €${(bidAmount/1e6).toFixed(1)}M cash bid for ${targetPlayer.name}.`, currentDate, relatedPlayerId: targetPlayer.id, relatedBidAmount: bidAmount, relatedClubName: buyer });
          return;
        }
      }
    }

    // 9. ADVANCE DATE
    currentDate = addDays(currentDate, 1);
    const [cy, cm, cd] = currentDate.split('-').map(Number);
    const elapsedDays = Math.max(0, Math.round((Date.UTC(cy, cm - 1, cd) - startMs) / (1000 * 60 * 60 * 24)));
    const progressPercentage = Math.min(100, Math.round((elapsedDays / totalDaysSpan) * 100));

    self.postMessage({
      type: 'DATE_TICK',
      payload: { currentDate, progressPercentage, updatedFixtures: fixtures, updatedPlayers: players, updatedCompetitions: competitions, updatedClubs: clubs, simulatedMatchesCount },
    });

    await new Promise(res => setTimeout(res, 55));
  }
}

