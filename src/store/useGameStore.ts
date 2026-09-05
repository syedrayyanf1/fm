import { create } from 'zustand';
import {
  Club,
  Player,
  Position,
  ClubFacilities,
  Competition,
  Fixture,
  RumorWireItem,
  TacticalSetup,
  GameDataPack,
  ScoutingRadarTarget,
  FacilityUpgradeItem,
  SimInterruptPayload,
  InterruptPreferences,
} from '../types/game';
import {
  initialClubs,
  initialPlayers,
  initialCompetitions,
  initialFixtures,
  initialRumors,
  initialTargets,
  initialFacilitiesData,
} from '../data/initialSeed';
import { MatchEvent, InGamePlayerState } from '../engine/matchTypes';
import { simulateOtherFixturesForDate } from '../engine/shallowEngine';
import {
  workerBridge,
  DayTickPayload,
  SimStateSnapshot,
} from '../workers/workerBridge';
import { generateLeagueFixtures } from '../scheduler/bergerScheduler';
import { generateSwissLeagueFixtures } from '../scheduler/swissScheduler';
import { generateCupFixtures } from '../scheduler/cupScheduler';
import { Scout, TransferOffer, MutinyConfrontation } from '../types/transfer';
import { DEFAULT_SCOUTS, getFogLevel } from '../engine/scoutingEngine';
import { resolveStage1Decision, resolveStrikeAction } from '../engine/mutinyEngine';
import {
  YouthProspect,
  AwardsGalaPayload,
  ManagerProfile,
  FfpAuditReport,
  SeasonTransitionReport,
  TrophyRecord,
} from '../types/season';
import { generateYouthIntake, convertProspectToPlayer } from '../engine/youthIntakeEngine';
import { calculateAwardsGala } from '../engine/awardsEngine';
import { auditClubFfp } from '../engine/ffpAuditEngine';
import { executeSeasonTransition } from '../engine/seasonTransitionEngine';
import { IncomingTransferOffer } from '../components/transfers/IncomingOffersPanel';
import { generateIncomingBids } from '../engine/transferAI';


/**
 * Builds the comprehensive 380-match La Liga season plus Champions League and Copa del Rey fixtures.
 */
function buildFullSeasonFixtures(): Fixture[] {
  const laligaClubIds = initialCompetitions.laliga?.clubIds || [
    'barcelona', 'realmadrid', 'atletico', 'athletic', 'realsociedad', 'villarreal',
    'realbetis', 'girona', 'sevilla', 'valencia', 'celtavigo', 'osasuna',
    'rcdmallorca', 'laspalmas', 'rayovallecano', 'getafe', 'espanyol', 'leganes',
    'realvalladolid', 'alaves'
  ];

  // 1. Generate full 38-round Berger league schedule starting August 15, 2026
  const leagueFixtures = generateLeagueFixtures('laliga', laligaClubIds, '2026-08-15');

  // Align with initialFixtures so initial fixtures (e.g. Valencia on 2026-08-12) are seamlessly mapped
  const initialMap = new Map<string, Fixture>();
  initialFixtures.forEach(f => {
    const key = `${f.homeClubId}_${f.awayClubId}`;
    initialMap.set(key, f);
  });

  const mergedLeague: Fixture[] = leagueFixtures.map(f => {
    const key = `${f.homeClubId}_${f.awayClubId}`;
    if (initialMap.has(key)) {
      return initialMap.get(key)!;
    }
    return f;
  });

  // Ensure any initialFixtures not present in merged are prepended
  initialFixtures.forEach(initF => {
    if (!mergedLeague.some(f => f.id === initF.id)) {
      mergedLeague.unshift(initF);
    }
  });

  // 2. Generate Champions League Swiss fixtures
  const uclFixtures = generateSwissLeagueFixtures('ucl', undefined, mergedLeague);

  // 3. Generate Copa del Rey knockout fixtures
  const cdrFixtures = generateCupFixtures('copadelrey', laligaClubIds);

  const all = [...mergedLeague, ...uclFixtures, ...cdrFixtures];
  all.sort((a, b) => a.date.localeCompare(b.date));
  return all;
}

const fullSeasonInitialFixtures = buildFullSeasonFixtures();


export type TabType = 'calendar' | 'squad' | 'transfers' | 'club' | 'tables';

export interface CompleteMatchResultPayload {
  fixtureId: string;
  homeScore: number;
  awayScore: number;
  homeXg: number;
  awayXg: number;
  events: MatchEvent[];
  playerStats: Record<string, InGamePlayerState>;
}

export interface SimReport {
  fixture: Fixture;
  homeClubName: string;
  awayClubName: string;
  barcaGoals: number;
  oppGoals: number;
  resultText: string;
  attendance: string;
  xG: string;
  scorers: string[];
}

export interface ToastData {
  id: number;
  title: string;
  message: string;
  type: string;
}

export interface GameStoreState {
  // Core Domain State
  activeTab: TabType;
  currentDate: string; // e.g. '2026-08-10'
  userClubId: string;
  isSimulating: boolean;
  simulationTargetDate: string | null;
  simulationProgress: number;
  interruptData: SimInterruptPayload | null;
  interruptPreferences: InterruptPreferences;
  /** Carries the canonical target date across interrupt/resume cycles */
  originalSimTargetDate: string | null;
  clubs: Record<string, Club>;
  players: Record<string, Player>;
  competitions: Record<string, Competition>;
  fixtures: Fixture[];
  rumors: RumorWireItem[];

  // Supporting Radar & Facilities
  targets: ScoutingRadarTarget[];
  facilities: FacilityUpgradeItem[];

  // Transfer & Scouting State
  scouts: Scout[];
  activeTransferOffers: TransferOffer[];
  transferListedPlayerIds: string[];
  incomingOffers: IncomingTransferOffer[];
  activeMutinyConfrontation: MutinyConfrontation | null;
  isApproachModalOpen: boolean;
  isTransferModalOpen: boolean;
  isScoutModalOpen: boolean;
  approachTargetId: string | null;
  transferTargetId: string | null;
  transferApproachType: 'PRIVATE' | 'PUBLIC' | null;

  // Interactive UI State
  selectedPlayerId: string | null;
  selectedTargetId: string;
  isTacticsModalOpen: boolean;
  isLeverModalOpen: boolean;
  activeMatchFixtureId: string | null;
  isMatchModalOpen: boolean;
  simModalOpen: boolean;
  simReport: SimReport | null;
  leverModalOpen: boolean;
  leverConfirmed: boolean;
  jumpDateModalOpen: boolean;
  toastMessage: ToastData | null;

  // Selectors / Getters
  getUserClub: () => Club;
  getUserSquad: () => Player[];
  getNextFixture: () => Fixture | undefined;

  // Actions
  setActiveTab: (tab: TabType) => void;
  updateTactics: (partialTactics: Partial<TacticalSetup>) => void;
  setBudgetSlider: (percentage: number) => void;
  advanceDate: (targetDate?: string) => void;
  loadDataPack: (payload: Partial<GameDataPack>) => void;

  // Simulation & Game Progression Actions
  startSimulation: (targetDate: string) => void;
  pauseSimulation: () => void;
  handleDayTick: (data: DayTickPayload) => void;
  handleInterrupt: (payload: SimInterruptPayload, snapshot?: SimStateSnapshot) => void;
  clearInterrupt: () => void;
  /** Clears the interrupt and re-starts simulation toward the original target date */
  dismissInterruptAndResume: () => void;
  /** Clears the interrupt and stops simulation, leaving date at current */
  dismissInterruptAndStop: () => void;
  setInterruptPreferences: (prefs: Partial<InterruptPreferences>) => void;
  simulateNextMatch: () => void;
  launchMatchModal: (fixtureId?: string) => void;
  setIsMatchModalOpen: (open: boolean) => void;
  completeMatch: (result: CompleteMatchResultPayload) => void;
  upgradeFacility: (facilityKey: keyof ClubFacilities | string) => void;
  activateEconomicLever: (percentage: number) => void;
  executeEconomicLever: () => void;
  startRetrainingPosition: (playerId: string, targetPosition: Position) => void;

  // Transfer & Scouting Actions
  setIsApproachModalOpen: (open: boolean) => void;
  setIsTransferModalOpen: (open: boolean) => void;
  setIsScoutModalOpen: (open: boolean) => void;
  initiateApproach: (targetId: string) => void;
  initiateNegotiation: (targetId: string, approachType: 'PRIVATE' | 'PUBLIC') => void;
  assignScout: (scoutId: string, targetId: string) => void;
  recallScout: (scoutId: string) => void;
  executeTransferSigning: (targetId: string, terms: { baseFee: number; weeklyWage: number; contractYears: number; squadRole: 'STAR' | 'IMPORTANT' | 'ROTATION' | 'PROSPECT'; releaseClause: number | null }) => void;
  transferListPlayer: (playerId: string) => void;
  untransferListPlayer: (playerId: string) => void;
  offerToClubs: (playerId: string) => void;
  acceptIncomingOffer: (offerId: string) => void;
  counterIncomingOffer: (offerId: string, counterFee: number) => void;
  rejectIncomingOffer: (offerId: string) => void;
  resolveMutinyConfrontation: (playerId: string, decision: 'PROMISE' | 'REFUSE' | 'SELL_DISCOUNT' | 'FREEZE_OUT') => void;
  triggerMutinyAlert: (confrontation: MutinyConfrontation) => void;
  addRumor: (item: RumorWireItem) => void;

  // Batch 6 Season State
  managerProfile: ManagerProfile;
  annualAwardsHistory: Record<string, AwardsGalaPayload>;
  youthProspects: YouthProspect[];
  latestAuditReport: FfpAuditReport | null;
  latestTransitionReport: SeasonTransitionReport | null;
  activeGalaPayload: AwardsGalaPayload | null;
  isYouthIntakeOpen: boolean;
  isAwardsGalaOpen: boolean;
  isSeasonSummaryOpen: boolean;
  isTrophyCabinetOpen: boolean;

  // Batch 6 Actions
  openYouthIntakeModal: () => void;
  closeYouthIntakeModal: () => void;
  signYouthProspect: (prospectId: string) => void;
  releaseYouthProspect: (prospectId: string) => void;
  openAwardsGalaModal: () => void;
  closeAwardsGalaModal: () => void;
  openSeasonSummaryModal: () => void;
  closeSeasonSummaryModal: () => void;
  openTrophyCabinet: () => void;
  closeTrophyCabinet: () => void;
  executeSeasonRollover: () => void;
  handleBoardSacking: () => void;
  applyForJob: (clubId: string) => void;

  // UI Modal & Selection Actions
  setSelectedPlayerId: (id: string | null) => void;
  setSelectedTargetId: (id: string) => void;
  setIsTacticsModalOpen: (open: boolean) => void;
  setIsLeverModalOpen: (open: boolean) => void;
  setSimModalOpen: (open: boolean) => void;
  setLeverModalOpen: (open: boolean) => void;
  setJumpDateModalOpen: (open: boolean) => void;
  showToast: (title: string, message: string, type?: string) => void;
}

export const useGameStore = create<GameStoreState>((set, get) => ({
  // Core Domain State
  activeTab: 'calendar',
  currentDate: '2026-08-10',
  userClubId: 'barcelona',
  isSimulating: false,
  simulationTargetDate: null,
  simulationProgress: 0,
  interruptData: null,
  originalSimTargetDate: null,
  interruptPreferences: {
    pauseOnBids: true,
    pauseOnInjuries: true,
    pauseOnMatchday: true,
  },
  clubs: initialClubs,

  // Batch 6 Season State
  managerProfile: {
    name: 'Hansi Flick',
    reputation: 88,
    careerMatches: 64,
    careerWins: 48,
    careerDraws: 8,
    careerLosses: 8,
    trophies: [
      { id: 'tr-1', name: 'UEFA Champions League', season: '2019/20', category: 'UCL' },
      { id: 'tr-2', name: 'Bundesliga', season: '2019/20', category: 'LEAGUE' },
      { id: 'tr-3', name: 'DFB-Pokal', season: '2019/20', category: 'DOMESTIC_CUP' },
      { id: 'tr-4', name: 'UEFA Super Cup', season: '2020', category: 'SUPER_CUP' },
      { id: 'tr-5', name: 'Bundesliga', season: '2020/21', category: 'LEAGUE' },
    ],
    awards: ["UEFA Men's Coach of the Year 2020", 'German Football Manager of the Year 2020'],
    isUnemployed: false,
  },
  annualAwardsHistory: {},
  youthProspects: [],
  latestAuditReport: null,
  latestTransitionReport: null,
  activeGalaPayload: null,
  isYouthIntakeOpen: false,
  isAwardsGalaOpen: false,
  isSeasonSummaryOpen: false,
  isTrophyCabinetOpen: false,
  players: initialPlayers,
  competitions: initialCompetitions,
  fixtures: fullSeasonInitialFixtures,
  rumors: initialRumors,

  // Supporting Radar & Facilities
  targets: initialTargets.map(t => {
    const days = t.id === 't1' ? 14 : t.id === 't2' ? 7 : t.id === 't5' ? 21 : 0;
    return {
      ...t,
      scoutedDays: days,
      fogLevel: getFogLevel(days),
    };
  }),
  facilities: initialFacilitiesData,

  // Transfer & Scouting State
  scouts: DEFAULT_SCOUTS,
  activeTransferOffers: [],
  transferListedPlayerIds: [],
  incomingOffers: [],
  activeMutinyConfrontation: null,
  isApproachModalOpen: false,
  isTransferModalOpen: false,
  isScoutModalOpen: false,
  approachTargetId: null,
  transferTargetId: null,
  transferApproachType: null,

  // Interactive UI State
  selectedPlayerId: null,
  selectedTargetId: 't1',      // Nico Williams
  isTacticsModalOpen: false,
  isLeverModalOpen: false,
  activeMatchFixtureId: null,
  isMatchModalOpen: false,
  simModalOpen: false,
  simReport: null,
  leverModalOpen: false,
  leverConfirmed: false,
  jumpDateModalOpen: false,
  toastMessage: null,

  // Getters
  getUserClub: () => {
    const { clubs, userClubId } = get();
    return clubs[userClubId] || initialClubs.barcelona;
  },

  getUserSquad: () => {
    const { players, userClubId } = get();
    return Object.values(players).filter(p => p.clubId === userClubId);
  },

  getNextFixture: () => {
    const { fixtures, userClubId, currentDate } = get();
    return fixtures.find(f => 
      !f.isPlayed && 
      (f.homeClubId === userClubId || f.awayClubId === userClubId) &&
      f.date >= currentDate
    );
  },

  // Actions
  setActiveTab: (tab: TabType) => {
    set({ activeTab: tab });
  },

  updateTactics: (partialTactics: Partial<TacticalSetup>) => {
    const { userClubId, clubs } = get();
    const currentClub = clubs[userClubId];
    if (!currentClub) return;

    set({
      clubs: {
        ...clubs,
        [userClubId]: {
          ...currentClub,
          tactics: {
            ...currentClub.tactics,
            ...partialTactics,
            roleToggles: {
              ...currentClub.tactics.roleToggles,
              ...(partialTactics.roleToggles || {}),
            },
          },
        },
      },
    });
  },

  setBudgetSlider: (percentage: number) => {
    const { userClubId, clubs } = get();
    const currentClub = clubs[userClubId];
    if (!currentClub) return;

    const { transferBudget, wageBudgetWeekly, totalBudgetPool } = currentClub.finances;
    const totalPool = totalBudgetPool ?? (transferBudget + (wageBudgetWeekly * 52));
    const newTransferBudget = Math.round((totalPool * percentage) / 100);
    const newWageBudgetWeekly = Math.round(((totalPool * (100 - percentage)) / 100) / 52);

    set({
      clubs: {
        ...clubs,
        [userClubId]: {
          ...currentClub,
          finances: {
            ...currentClub.finances,
            totalBudgetPool: totalPool,
            transferBudget: newTransferBudget,
            wageBudgetWeekly: newWageBudgetWeekly,
            allocatedFeePercentage: percentage,
          },
        },
      },
    });
  },


  advanceDate: (targetDate?: string) => {
    if (targetDate) {
      set({ currentDate: targetDate });
      get().showToast('Calendar Advanced', `Date moved to ${targetDate}`);
      return;
    }

    // Default: advance 1 day (timezone-safe UTC)
    const [year, month, day] = get().currentDate.split('-').map(Number);
    const dateObj = new Date(Date.UTC(year, month - 1, day + 1));
    const nextDateStr = dateObj.toISOString().split('T')[0];
    set({ currentDate: nextDateStr });
  },

  loadDataPack: (payload: Partial<GameDataPack>) => {
    set(state => ({
      clubs: payload.clubs ? payload.clubs : state.clubs,
      players: payload.players ? payload.players : state.players,
      competitions: payload.competitions ? payload.competitions : state.competitions,
      fixtures: payload.fixtures ? payload.fixtures : state.fixtures,
      rumors: payload.rumors ? payload.rumors : state.rumors,
    }));
    get().showToast('DataPack Loaded', 'External database successfully merged.');
  },

  launchMatchModal: (fixtureId?: string) => {
    const { fixtures, getNextFixture, currentDate } = get();
    const target = fixtureId ? fixtures.find(f => f.id === fixtureId) : getNextFixture();

    if (!target) {
      get().showToast('No Scheduled Fixture', 'No upcoming match found.', 'normal');
      return;
    }

    if (target.isPlayed) {
      get().showToast('Match Already Played', 'This fixture has concluded.', 'normal');
      return;
    }

    if (target.date !== currentDate) {
      get().showToast(
        'Calendar Notice',
        `Matchday is scheduled for ${target.date}. Advance or jump calendar to matchday to play.`,
        'normal'
      );
      return;
    }

    set({ activeMatchFixtureId: target.id, isMatchModalOpen: true });
  },

  setIsMatchModalOpen: (open: boolean) => {
    set({ isMatchModalOpen: open, activeMatchFixtureId: open ? get().activeMatchFixtureId : null });
  },

  completeMatch: (payload: CompleteMatchResultPayload) => {
    const { fixtures, userClubId, clubs, competitions, players, currentDate } = get();
    const targetFixture = fixtures.find(f => f.id === payload.fixtureId);
    if (!targetFixture) return;

    const isHome = targetFixture.homeClubId === userClubId;
    const oppClubId = isHome ? targetFixture.awayClubId : targetFixture.homeClubId;
    const userClub = clubs[userClubId];

    // Determine result outcomes for user
    const userScore = isHome ? payload.homeScore : payload.awayScore;
    const oppScore = isHome ? payload.awayScore : payload.homeScore;
    const userWon = userScore > oppScore;
    const userLost = userScore < oppScore;

    // 1. Update target fixture
    const updatedFixtures = fixtures.map(f => {
      if (f.id === payload.fixtureId) {
        return {
          ...f,
          isPlayed: true,
          result: {
            homeScore: payload.homeScore,
            awayScore: payload.awayScore,
            homeXg: payload.homeXg,
            awayXg: payload.awayXg,
            events: payload.events.map(e => ({
              minute: e.minute,
              type: (e.type === 'SAVED' || e.type === 'CHANCE_MISSED' || e.type === 'SUBSTITUTION' ? 'GOAL' : e.type) as any,
              playerId: e.playerId,
              clubId: e.team === 'HOME' ? targetFixture.homeClubId : targetFixture.awayClubId,
              detail: e.description,
            })),
          },
        };
      }
      return f;
    });

    // 2. Update competition table for the user fixture
    const compId = targetFixture.competitionId;
    const targetComp = competitions[compId];
    let updatedCompetitions = { ...competitions };

    if (targetComp) {
      let updatedTable = targetComp.table.map(row => {
        if (row.clubId === targetFixture.homeClubId) {
          const won = payload.homeScore > payload.awayScore;
          const lost = payload.homeScore < payload.awayScore;
          const formChar = won ? 'W' : lost ? 'L' : 'D';
          return {
            ...row,
            played: row.played + 1,
            won: row.won + (won ? 1 : 0),
            drawn: row.drawn + (!won && !lost ? 1 : 0),
            lost: row.lost + (lost ? 1 : 0),
            goalsFor: row.goalsFor + payload.homeScore,
            goalsAgainst: row.goalsAgainst + payload.awayScore,
            goalDifference: row.goalDifference + (payload.homeScore - payload.awayScore),
            points: row.points + (won ? 3 : !lost ? 1 : 0),
            form: [formChar as any, ...row.form.slice(0, 4)],
          };
        }
        if (row.clubId === targetFixture.awayClubId) {
          const won = payload.awayScore > payload.homeScore;
          const lost = payload.awayScore < payload.homeScore;
          const formChar = won ? 'W' : lost ? 'L' : 'D';
          return {
            ...row,
            played: row.played + 1,
            won: row.won + (won ? 1 : 0),
            drawn: row.drawn + (!won && !lost ? 1 : 0),
            lost: row.lost + (lost ? 1 : 0),
            goalsFor: row.goalsFor + payload.awayScore,
            goalsAgainst: row.goalsAgainst + payload.homeScore,
            goalDifference: row.goalDifference + (payload.awayScore - payload.homeScore),
            points: row.points + (won ? 3 : !lost ? 1 : 0),
            form: [formChar as any, ...row.form.slice(0, 4)],
          };
        }
        return row;
      });

      updatedTable.sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference || b.goalsFor - a.goalsFor);
      updatedCompetitions[compId] = {
        ...targetComp,
        table: updatedTable,
      };
    }

    // 3. Update player states (stamina, sharpness, formHistory, settlement, morale)
    const updatedPlayers = { ...players };
    Object.values(updatedPlayers).forEach(p => {
      if (p.clubId === userClubId) {
        const pStat = payload.playerStats[p.id];
        if (pStat) {
          // Participant in match
          const drainedStamina = Math.max(15, Math.round(pStat.currentStamina));
          const newForm = [pStat.matchRating, ...(p.formHistory || []).slice(0, 4)];
          const newSharpness = Math.min(100, (p.sharpness || 85) + 8);
          const newSettlement = Math.min(1.0, Number(((p.settlementProgress || 0.9) + 0.02).toFixed(2)));
          const moraleDelta = userWon ? 5 : userLost ? -4 : 1;
          const newMorale = Math.max(20, Math.min(100, (p.morale || 85) + moraleDelta));

          updatedPlayers[p.id] = {
            ...p,
            stamina: drainedStamina,
            formHistory: newForm,
            sharpness: newSharpness,
            settlementProgress: newSettlement,
            morale: newMorale,
          };
        } else {
          // Unused squad / bench member
          updatedPlayers[p.id] = {
            ...p,
            stamina: Math.min(100, (p.stamina || 90) + 5),
            sharpness: Math.max(40, (p.sharpness || 85) - 3),
          };
        }
      }
    });

    // 4. Simulate other background fixtures on this matchday
    const backgroundSim = simulateOtherFixturesForDate(
      updatedFixtures,
      targetFixture.date,
      targetFixture.id,
      clubs,
      updatedPlayers,
      updatedCompetitions
    );

    // 5. Advance calendar by 1 day (timezone-safe UTC)
    const [year, month, day] = currentDate.split('-').map(Number);
    const dateObj = new Date(Date.UTC(year, month - 1, day + 1));
    const nextDateStr = dateObj.toISOString().split('T')[0];

    // 6. Board Trust Update
    const trustDelta = userWon ? 2 : userLost ? -2 : 0;
    const newBoardTrust = Math.min(99, Math.max(20, (userClub?.boardTrust ?? 84) + trustDelta));

    set({
      fixtures: backgroundSim.updatedFixtures,
      competitions: backgroundSim.updatedCompetitions,
      players: updatedPlayers,
      currentDate: nextDateStr,
      isMatchModalOpen: false,
      activeMatchFixtureId: null,
      clubs: {
        ...clubs,
        [userClubId]: {
          ...userClub,
          boardTrust: newBoardTrust,
        },
      },
    });

    get().showToast(
      'Match Concluded & Standings Synced',
      `Final: ${payload.homeScore} - ${payload.awayScore}. Standings and squad stamina updated.`,
      'success'
    );
  },

  startSimulation: (targetDate: string) => {
    const state = get();
    if (targetDate <= state.currentDate) {
      state.showToast('Invalid Target Date', 'Target date must be ahead of current date.', 'error');
      return;
    }

    set({
      isSimulating: true,
      simulationTargetDate: targetDate,
      originalSimTargetDate: targetDate,
      simulationProgress: 0,
      interruptData: null,
    });

    // Initialize worker with callbacks
    workerBridge.initWorker({
      onTick: (data) => {
        get().handleDayTick(data);
      },
      onInterrupt: (interrupt, snapshot) => {
        get().handleInterrupt(interrupt, snapshot);
      },
      onComplete: (snapshot) => {
        set({
          isSimulating: false,
          simulationProgress: 100,
          currentDate: snapshot.currentDate,
          fixtures: snapshot.fixtures,
          players: snapshot.players,
          competitions: snapshot.competitions,
          clubs: snapshot.clubs,
          interruptData: null,
        });
        get().showToast(
          'Simulation Complete',
          `Calendar advanced to ${snapshot.currentDate}.`,
          'normal'
        );
      },
      onError: (err) => {
        set({ isSimulating: false });
        get().showToast('Simulation Error', err, 'error');
      },
    });

    workerBridge.startSimulation({
      targetDate,
      userClubId: state.userClubId,
      currentDate: state.currentDate,
      fixtures: state.fixtures,
      clubs: state.clubs,
      players: state.players,
      competitions: state.competitions,
      interruptPreferences: state.interruptPreferences,
      originalTargetDate: targetDate,
    });
  },

  pauseSimulation: () => {
    workerBridge.pauseSimulation();
    set({ isSimulating: false });
    get().showToast('Simulation Paused', `Paused at ${get().currentDate}`, 'normal');
  },

  handleDayTick: (data: DayTickPayload) => {
    const { scouts, targets } = get();

    // Progress active scout assignments
    let updatedScouts = [...scouts];
    let updatedTargets = [...targets];

    updatedScouts = updatedScouts.map(scout => {
      if (scout.assignedTargetId && scout.daysRemaining > 0) {
        const nextDaysRemaining = scout.daysRemaining - 1;
        const targetId = scout.assignedTargetId;

        updatedTargets = updatedTargets.map(t => {
          if (t.id === targetId) {
            const nextDays = (t.scoutedDays || 0) + 1;
            return {
              ...t,
              scoutedDays: nextDays,
              fogLevel: getFogLevel(nextDays),
            };
          }
          return t;
        });

        if (nextDaysRemaining <= 0) {
          return {
            ...scout,
            assignedTargetId: null,
            daysRemaining: 0,
          };
        }
        return {
          ...scout,
          daysRemaining: nextDaysRemaining,
        };
      }
      return scout;
    });

    set({
      currentDate: data.currentDate,
      simulationProgress: data.progressPercentage,
      fixtures: data.updatedFixtures,
      players: data.updatedPlayers,
      competitions: data.updatedCompetitions,
      clubs: data.updatedClubs,
      scouts: updatedScouts,
      targets: updatedTargets,
    });
  },

  handleInterrupt: (payload: SimInterruptPayload, snapshot?: SimStateSnapshot) => {
    set({
      isSimulating: false,
      interruptData: payload,
      ...(snapshot
        ? {
            currentDate: snapshot.currentDate,
            fixtures: snapshot.fixtures,
            players: snapshot.players,
            competitions: snapshot.competitions,
            clubs: snapshot.clubs,
          }
        : {}),
    });

    if (payload.reason === 'TRANSFER_BID' && payload.relatedPlayerId && payload.relatedBidAmount) {
      const allPlayers = snapshot?.players || get().players;
      const targetP = allPlayers[payload.relatedPlayerId];
      const bidOffer: IncomingTransferOffer = {
        id: `bid_${payload.relatedPlayerId}_${Date.now()}`,
        playerId: payload.relatedPlayerId,
        playerName: targetP?.name || 'Your Squad Member',
        buyingClubId: payload.relatedClubName?.toLowerCase().replace(/\s+/g, '') || 'rival',
        buyingClubName: payload.relatedClubName || 'Elite Club',
        feeOffered: payload.relatedBidAmount,
        date: payload.currentDate,
        status: 'PENDING',
      };
      set(state => ({
        incomingOffers: [bidOffer, ...state.incomingOffers.filter(o => o.playerId !== payload.relatedPlayerId || o.status !== 'PENDING')],
      }));
    }

    if (payload.reason === 'YOUTH_INTAKE') {
      get().openYouthIntakeModal();
    } else if (payload.reason === 'AWARDS_GALA') {
      get().openAwardsGalaModal();
    } else if (payload.reason === 'SEASON_END') {
      get().openSeasonSummaryModal();
    } else if (payload.reason === 'BOARD_SACKED') {
      get().handleBoardSacking();
    }
  },

  clearInterrupt: () => {
    set({ interruptData: null });
  },

  dismissInterruptAndResume: () => {
    const { originalSimTargetDate, currentDate, userClubId, fixtures, clubs, players, competitions, interruptPreferences } = get();
    const targetDate = originalSimTargetDate;

    if (!targetDate) {
      set({ interruptData: null, isSimulating: false });
      return;
    }

    // Advance by 1 day so we escape the exact trigger date (timezone-safe UTC)
    const [y, m, d] = currentDate.split('-').map(Number);
    const dtObj = new Date(Date.UTC(y, m - 1, d + 1));
    const nextDate = dtObj.toISOString().split('T')[0];

    // Check if nextDate is a matchday for user club
    const userMatchOnNextDate = fixtures.find(f =>
      f.date === nextDate && !f.isPlayed &&
      (f.homeClubId === userClubId || f.awayClubId === userClubId)
    );

    // If nextDate reaches or passes the targetDate
    if (nextDate >= targetDate) {
      // If there's an unplayed match today on nextDate, transition directly to Matchday Command Center
      if (userMatchOnNextDate && interruptPreferences.pauseOnMatchday) {
        const isHome = userMatchOnNextDate.homeClubId === userClubId;
        const oppId = isHome ? userMatchOnNextDate.awayClubId : userMatchOnNextDate.homeClubId;
        const oppClub = clubs[oppId] || { name: oppId };
        const comp = competitions[userMatchOnNextDate.competitionId] || { name: 'League Match' };

        set({
          currentDate: nextDate,
          isSimulating: false,
          interruptData: {
            reason: 'MATCHDAY',
            detail: `${comp.name} Matchday vs ${oppClub.name} (${isHome ? 'Home' : 'Away'}).`,
            currentDate: nextDate,
            relatedFixtureId: userMatchOnNextDate.id,
          },
        });
        return;
      }

      // If no matchday, complete cleanly without an alert modal
      set({
        currentDate: nextDate,
        isSimulating: false,
        interruptData: null,
      });
      get().showToast(
        'Simulation Complete',
        `Calendar advanced to ${nextDate}.`,
        'normal'
      );
      return;
    }

    // NextDate is still before targetDate:
    // Update store state with advanced date and restart worker toward canonical target
    set({
      interruptData: null,
      isSimulating: true,
      currentDate: nextDate,
      simulationTargetDate: targetDate,
    });

    workerBridge.initWorker({
      onTick: (data) => get().handleDayTick(data),
      onInterrupt: (interrupt, snapshot) => get().handleInterrupt(interrupt, snapshot),
      onComplete: (snapshot) => {
        set({
          isSimulating: false,
          simulationProgress: 100,
          currentDate: snapshot.currentDate,
          fixtures: snapshot.fixtures,
          players: snapshot.players,
          competitions: snapshot.competitions,
          clubs: snapshot.clubs,
          interruptData: null,
        });
        get().showToast(
          'Simulation Complete',
          `Calendar advanced to ${snapshot.currentDate}.`,
          'normal'
        );
      },
      onError: (err) => {
        set({ isSimulating: false });
        get().showToast('Simulation Error', err, 'error');
      },
    });

    workerBridge.startSimulation({
      targetDate,
      originalTargetDate: targetDate,
      userClubId,
      currentDate: nextDate,
      fixtures,
      clubs,
      players,
      competitions,
      interruptPreferences,
    });
  },

  dismissInterruptAndStop: () => {
    workerBridge.pauseSimulation();
    set({ interruptData: null, isSimulating: false });
  },

  setInterruptPreferences: (prefs: Partial<InterruptPreferences>) => {
    set(state => ({
      interruptPreferences: {
        ...state.interruptPreferences,
        ...prefs,
      },
    }));
  },

  simulateNextMatch: () => {
    const nextFixture = get().getNextFixture();
    if (!nextFixture) {
      get().showToast('Schedule Complete', 'No further matches scheduled this season.', 'normal');
      return;
    }
    const { currentDate } = get();
    if (nextFixture.date === currentDate) {
      get().launchMatchModal(nextFixture.id);
    } else {
      // Non-blocking fast simulation directly to matchday
      get().startSimulation(nextFixture.date);
    }
  },

  upgradeFacility: (facilityKey: keyof ClubFacilities | string) => {
    const { facilities, clubs, userClubId } = get();
    const currentClub = clubs[userClubId];
    if (!currentClub) return;

    // Direct key in currentClub.facilities (e.g. stadiumAtmosphereLevel, youthAcademyLevel, etc.)
    if (facilityKey in currentClub.facilities) {
      const key = facilityKey as keyof ClubFacilities;
      const currentLevel = currentClub.facilities[key] || 1;

      if (currentLevel >= 5) {
        get().showToast('Maximum Tier Reached', 'This facility is already operating at Level 5 (World Class).', 'normal');
        return;
      }

      // Cost progression: Level 1->2: $4M, 2->3: $8M, 3->4: $16M, 4->5: $32M
      const costTable: Record<number, number> = {
        1: 4_000_000,
        2: 8_000_000,
        3: 16_000_000,
        4: 32_000_000,
      };
      const cost = costTable[currentLevel] || 16_000_000;

      if (currentClub.finances.balance < cost) {
        get().showToast(
          'Insufficient Treasury Funds',
          `Requires $${(cost / 1e6).toFixed(1)}M. Club treasury balance: $${(currentClub.finances.balance / 1e6).toFixed(1)}M.`,
          'error'
        );
        return;
      }

      const nextLevel = Math.min(5, currentLevel + 1);

      set({
        clubs: {
          ...clubs,
          [userClubId]: {
            ...currentClub,
            finances: {
              ...currentClub.finances,
              balance: currentClub.finances.balance - cost,
            },
            facilities: {
              ...currentClub.facilities,
              [key]: nextLevel,
            },
          },
        },
      });

      get().showToast('Facility Upgraded', `Infrastructure upgraded to Level ${nextLevel}/5.`, 'success');
      return;
    }

    // Fallback if an id like 'fac-1' was passed
    const fac = facilities.find(f => f.id === facilityKey);
    if (!fac || fac.level >= fac.maxLevel) return;

    const costDollars = fac.cost * 1_000_000;
    if (currentClub.finances.balance < costDollars) {
      get().showToast('Insufficient Treasury Funds', `Requires $${fac.cost}M.`, 'error');
      return;
    }

    const fKey = fac.facilityKey;
    set({
      facilities: facilities.map(f => f.id === facilityKey ? { ...f, level: f.level + 1, cost: Number((f.cost * 1.4).toFixed(1)) } : f),
      clubs: {
        ...clubs,
        [userClubId]: {
          ...currentClub,
          finances: {
            ...currentClub.finances,
            balance: currentClub.finances.balance - costDollars,
          },
          facilities: {
            ...currentClub.facilities,
            [fKey]: Math.min(5, (currentClub.facilities[fKey] || 1) + 1),
          },
        },
      },
    });
    get().showToast('Facility Upgraded', `${fac.name} improved to Level ${fac.level + 1}.`, 'success');
  },

  activateEconomicLever: (percentage: number) => {
    const { clubs, userClubId } = get();
    const currentClub = clubs[userClubId];
    if (!currentClub) return;

    const currentLeversSold = currentClub.finances.economicLeversSoldPercentage || 0;
    if (currentLeversSold + percentage > 30) {
      get().showToast('Regulatory Cap Exceeded', 'Total economic levers sold cannot exceed 30% of club media assets.', 'error');
      return;
    }

    // Formula: annualOperatingRevenue * 5.0 * (percentage / 100)
    const cashInjection = Math.round(currentClub.finances.annualOperatingRevenue * 5.0 * (percentage / 100));
    const revenueDeduction = Math.round(currentClub.finances.annualOperatingRevenue * (percentage / 100));
    const newAnnualRevenue = Math.max(10_000_000, currentClub.finances.annualOperatingRevenue - revenueDeduction);
    const currentPool = currentClub.finances.totalBudgetPool ?? (currentClub.finances.transferBudget + (currentClub.finances.wageBudgetWeekly * 52));

    set({
      isLeverModalOpen: false,
      leverModalOpen: false,
      leverConfirmed: true,
      clubs: {
        ...clubs,
        [userClubId]: {
          ...currentClub,
          boardTrust: Math.max(10, currentClub.boardTrust - 5),
          finances: {
            ...currentClub.finances,
            balance: currentClub.finances.balance + cashInjection,
            transferBudget: currentClub.finances.transferBudget + cashInjection,
            totalBudgetPool: currentPool + cashInjection,
            annualOperatingRevenue: newAnnualRevenue,
            economicLeversSoldPercentage: currentLeversSold + percentage,
          },
        },
      },
    });

    get().showToast(
      'Economic Lever Executed',
      `+$${(cashInjection / 1e6).toFixed(1)}M injected into treasury & transfer kitty. -${percentage}% future revenue.`,
      'success'
    );
  },

  executeEconomicLever: () => {
    get().activateEconomicLever(10);
  },

  startRetrainingPosition: (playerId: string, targetPosition: Position) => {
    const { players } = get();
    const player = players[playerId];
    if (!player) return;

    set({
      players: {
        ...players,
        [playerId]: {
          ...player,
          isRetraining: true,
          targetPosition,
          retrainingProgress: 0,
        },
      },
    });

    get().showToast('Retraining Initiated', `${player.name} is now training for ${targetPosition}.`, 'normal');
  },

  // Transfer & Scouting Actions
  setIsApproachModalOpen: (open: boolean) => {
    set({ isApproachModalOpen: open, approachTargetId: open ? get().approachTargetId : null });
  },

  setIsTransferModalOpen: (open: boolean) => {
    set({ isTransferModalOpen: open, transferTargetId: open ? get().transferTargetId : null });
  },

  setIsScoutModalOpen: (open: boolean) => {
    set({ isScoutModalOpen: open });
  },

  initiateApproach: (targetId: string) => {
    set({ approachTargetId: targetId, isApproachModalOpen: true });
  },

  initiateNegotiation: (targetId: string, approachType: 'PRIVATE' | 'PUBLIC') => {
    set({
      transferTargetId: targetId,
      transferApproachType: approachType,
      isTransferModalOpen: true,
    });
  },

  assignScout: (scoutId: string, targetId: string) => {
    const { scouts, targets } = get();
    const scout = scouts.find(s => s.id === scoutId);
    const target = targets.find(t => t.id === targetId);
    if (!scout || !target) return;

    set({
      scouts: scouts.map(s =>
        s.id === scoutId ? { ...s, assignedTargetId: targetId, daysRemaining: 21 } : s
      ),
    });
    get().showToast('Scout Deployed', `${scout.name} assigned to 21-day dossier for ${target.name}.`, 'success');
  },

  recallScout: (scoutId: string) => {
    const { scouts } = get();
    set({
      scouts: scouts.map(s =>
        s.id === scoutId ? { ...s, assignedTargetId: null, daysRemaining: 0 } : s
      ),
    });
    get().showToast('Scout Recalled', 'Scout returned to active pool.', 'normal');
  },

  executeTransferSigning: (targetId, terms) => {
    const { targets, clubs, userClubId, players, rumors } = get();
    const target = targets.find(t => t.id === targetId);
    const dbPlayer = players[targetId];
    const userClub = clubs[userClubId];
    if ((!target && !dbPlayer) || !userClub) return;

    const signingName = target?.name || dbPlayer?.name || 'New Signing';
    const originalClubId = target?.clubId || dbPlayer?.clubId;
    const playerId = target?.playerId || dbPlayer?.id || targetId;

    const newPlayer: Player = {
      ...(dbPlayer || {}),
      id: playerId,
      clubId: userClubId,
      name: signingName,
      fullName: signingName,
      photoUrl: dbPlayer?.photoUrl || target?.photoUrl || `/crests/${userClubId}.svg`,
      nationality: target?.nationality || dbPlayer?.nationality || 'ESP',
      age: target?.age || dbPlayer?.age || 24,
      primaryPosition: (target?.position?.split(' / ')[0].trim() as any) || dbPlayer?.primaryPosition || 'ST',
      secondaryPositions: dbPlayer?.secondaryPositions || [],
      reputation: target?.exactOvr || dbPlayer?.overallRating || 85,
      attributes: target?.attributes || dbPlayer?.attributes || {
        attacking: 80,
        creative: 80,
        defending: 60,
        physical: 80,
        mental: 80,
      },
      traits: target?.traits || dbPlayer?.traits || {
        clutch: 16,
        consistency: 15,
        adaptability: 16,
        workRate: 'HIGH',
        injuryProneness: 'LOW',
      },
      overallRating: target?.exactOvr || dbPlayer?.overallRating || 85,
      dynamicPotential: (target?.exactOvr || dbPlayer?.overallRating || 85) + 3,
      potentialCap: (target?.exactOvr || dbPlayer?.overallRating || 85) + 5,
      sharpness: 80,
      stamina: 90,
      morale: 95,
      formHistory: [7.5, 7.8, 7.6, 7.9],
      settlementProgress: 0.50, // Adaptation lag!
      daysAtClub: 0,
      isRetraining: false,
      wagePerWeek: terms.weeklyWage,
      contractYearsLeft: terms.contractYears,
      releaseClause: terms.releaseClause,
      marketValue: terms.baseFee,
      amortizationAnnualCost: Math.round(terms.baseFee / terms.contractYears),
      squadRole: terms.squadRole as any,
      unsettledStage: 0,
      isStarter: terms.squadRole === 'STAR',
    };

    // Financial deductions
    const newTransferBudget = Math.max(0, userClub.finances.transferBudget - terms.baseFee);
    const newBalance = Math.max(0, userClub.finances.balance - terms.baseFee);

    const updatedClubs = { ...clubs };
    updatedClubs[userClubId] = {
      ...userClub,
      finances: {
        ...userClub.finances,
        transferBudget: newTransferBudget,
        balance: newBalance,
      },
    };

    // Add transfer fee into seller's balance
    if (originalClubId && updatedClubs[originalClubId] && originalClubId !== userClubId) {
      const seller = updatedClubs[originalClubId];
      updatedClubs[originalClubId] = {
        ...seller,
        finances: {
          ...seller.finances,
          balance: seller.finances.balance + terms.baseFee,
          transferBudget: seller.finances.transferBudget + Math.round(terms.baseFee * 0.8),
        },
      };
    }

    // Add Tier 1 breaking rumor
    const newRumor: RumorWireItem = {
      id: `rumor_sign_${Date.now()}`,
      headline: `HERE WE GO! ${userClub.name} have officially signed ${signingName} on a ${terms.contractYears}-year deal!`,
      source: 'Fabrizio Romano',
      credibilityTier: 1,
      targetPlayerName: signingName,
      buyerClubName: userClub.name,
      timestamp: 'Just now',
    };

    set({
      players: {
        ...players,
        [newPlayer.id]: newPlayer,
      },
      targets: targets.filter(t => t.id !== targetId),
      clubs: updatedClubs,
      rumors: [newRumor, ...rumors],
    });

    get().showToast(
      'Transfer Completed!',
      `${signingName} has signed with ${userClub.name} for €${(terms.baseFee / 1e6).toFixed(1)}M.`,
      'success'
    );
  },

  transferListPlayer: (playerId: string) => {
    const { transferListedPlayerIds, players } = get();
    const player = players[playerId];
    if (!player) return;
    const isAlreadyListed = transferListedPlayerIds.includes(playerId);
    const updated = isAlreadyListed
      ? transferListedPlayerIds.filter(id => id !== playerId)
      : [...transferListedPlayerIds, playerId];
    set({ transferListedPlayerIds: updated });
    get().showToast(
      isAlreadyListed ? 'Removed from Transfer List' : 'Player Transfer Listed',
      `${player.name} is ${isAlreadyListed ? 'no longer' : 'now'} on the official transfer list.`,
      'normal'
    );
  },

  untransferListPlayer: (playerId: string) => {
    set(state => ({
      transferListedPlayerIds: state.transferListedPlayerIds.filter(id => id !== playerId),
    }));
  },

  offerToClubs: (playerId: string) => {
    const { players, clubs, currentDate, incomingOffers, rumors } = get();
    const player = players[playerId];
    if (!player) return;

    const newBids = generateIncomingBids(player, clubs, currentDate);
    if (newBids.length === 0) {
      get().showToast('No Immediate Bids', `No clubs are currently able to meet ${player.name}'s valuation.`, 'normal');
      return;
    }

    const breakingRumor: RumorWireItem = {
      id: `rumor_bid_${Date.now()}`,
      headline: `TRANSFER ALERT: Multiple European clubs submit bids for ${player.name}!`,
      source: 'Sky Sports News',
      credibilityTier: 1,
      targetPlayerName: player.name,
      buyerClubName: newBids[0].buyingClubName,
      timestamp: 'Just now',
    };

    set({
      incomingOffers: [...newBids, ...incomingOffers],
      rumors: [breakingRumor, ...rumors],
    });

    get().showToast(
      'Offers Received!',
      `Received ${newBids.length} formal bids for ${player.name}. Check the Incoming Offers tab.`,
      'success'
    );
  },

  acceptIncomingOffer: (offerId: string) => {
    const { incomingOffers, players, clubs, userClubId, rumors } = get();
    const offer = incomingOffers.find(o => o.id === offerId);
    if (!offer) return;
    const player = players[offer.playerId];
    const userClub = clubs[userClubId];
    if (!player || !userClub) return;

    // Move player to buying club
    const updatedPlayer = {
      ...player,
      clubId: offer.buyingClubId,
      isStarter: false,
    };

    // Add revenue to user club
    const updatedUserClub = {
      ...userClub,
      finances: {
        ...userClub.finances,
        balance: userClub.finances.balance + offer.feeOffered,
        transferBudget: userClub.finances.transferBudget + Math.round(offer.feeOffered * 0.8),
      },
    };

    const newRumor: RumorWireItem = {
      id: `rumor_sale_${Date.now()}`,
      headline: `DONE DEAL: ${player.name} completes €${(offer.feeOffered / 1e6).toFixed(1)}M transfer to ${offer.buyingClubName}!`,
      source: 'Fabrizio Romano',
      credibilityTier: 1,
      targetPlayerName: player.name,
      buyerClubName: offer.buyingClubName,
      timestamp: 'Just now',
    };

    set({
      players: {
        ...players,
        [player.id]: updatedPlayer,
      },
      clubs: {
        ...clubs,
        [userClubId]: updatedUserClub,
      },
      incomingOffers: incomingOffers.map(o => o.id === offerId ? { ...o, status: 'ACCEPTED' as const } : o),
      rumors: [newRumor, ...rumors],
    });

    get().showToast(
      'Player Sold!',
      `${player.name} transferred to ${offer.buyingClubName} for €${(offer.feeOffered / 1e6).toFixed(1)}M.`,
      'success'
    );
  },

  counterIncomingOffer: (offerId: string, counterFee: number) => {
    const { incomingOffers, clubs } = get();
    const offer = incomingOffers.find(o => o.id === offerId);
    if (!offer) return;

    // AI accepts if counter is within 15% of original offer or buyer is very wealthy
    const buyer = clubs[offer.buyingClubId];
    const isAccepted = counterFee <= offer.feeOffered * 1.15 || (buyer && buyer.reputation >= 90 && counterFee <= offer.feeOffered * 1.25);

    if (isAccepted) {
      // AI accepts counter! Automatically trigger acceptance with the new fee
      const acceptedOffer = { ...offer, feeOffered: counterFee };
      get().showToast('Counter Accepted!', `${offer.buyingClubName} agreed to your counter fee of €${(counterFee / 1e6).toFixed(1)}M!`, 'success');
      set({
        incomingOffers: incomingOffers.map(o => o.id === offerId ? acceptedOffer : o),
      });
      get().acceptIncomingOffer(offerId);
    } else {
      get().showToast('Counter Rejected', `${offer.buyingClubName} deemed €${(counterFee / 1e6).toFixed(1)}M unreasonable and withdrew negotiations.`, 'error');
      set({
        incomingOffers: incomingOffers.map(o => o.id === offerId ? { ...o, status: 'REJECTED' as const } : o),
      });
    }
  },

  rejectIncomingOffer: (offerId: string) => {
    const { incomingOffers, players, clubs, userClubId } = get();
    const offer = incomingOffers.find(o => o.id === offerId);
    if (!offer) return;
    const player = players[offer.playerId];
    const buyerClub = clubs[offer.buyingClubId];
    const userClub = clubs[userClubId];

    set({
      incomingOffers: incomingOffers.map(o => o.id === offerId ? { ...o, status: 'REJECTED' as const } : o),
    });

    get().showToast('Bid Rejected', `Rejected ${offer.buyingClubName}'s offer for ${offer.playerName}.`, 'normal');

    // Mutiny check: if buyer club is elite and user rejects
    if (player && buyerClub && userClub && buyerClub.reputation > userClub.reputation) {
      if (Math.random() < 0.60) {
        get().triggerMutinyAlert({
          playerId: player.id,
          playerName: player.name,
          buyerClubName: buyerClub.name,
          stage: 1,
          daysRemaining: 7,
          demandedWage: Math.round(player.wagePerWeek * 1.4),
        });
      }
    }
  },

  resolveMutinyConfrontation: (playerId, decision) => {
    const { players, activeMutinyConfrontation, rumors } = get();
    const player = players[playerId];
    if (!player) {
      set({ activeMutinyConfrontation: null });
      return;
    }

    const buyerName = activeMutinyConfrontation?.buyerClubName || 'Elite Suitor';
    let res;

    if (decision === 'PROMISE' || decision === 'REFUSE') {
      res = resolveStage1Decision(player, decision, buyerName);
    } else {
      res = resolveStrikeAction(player, decision);
    }

    set({
      activeMutinyConfrontation: null,
      players: {
        ...players,
        [playerId]: res.updatedPlayer,
      },
      rumors: res.rumorCreated ? [res.rumorCreated, ...rumors] : rumors,
    });

    get().showToast(res.toastMessage.title, res.toastMessage.detail, res.toastMessage.type);
  },

  triggerMutinyAlert: (confrontation: MutinyConfrontation) => {
    set({ activeMutinyConfrontation: confrontation });
  },

  addRumor: (item: RumorWireItem) => {
    set(state => ({
      rumors: [item, ...state.rumors],
    }));
  },

  // Batch 6 Season Actions
  openYouthIntakeModal: () => {
    const state = get();
    let prospects = state.youthProspects;
    if (prospects.length === 0) {
      prospects = generateYouthIntake(state.getUserClub());
    }
    set({ youthProspects: prospects, isYouthIntakeOpen: true });
  },

  closeYouthIntakeModal: () => {
    set({ isYouthIntakeOpen: false });
  },

  signYouthProspect: (prospectId: string) => {
    const { youthProspects, userClubId, players, clubs } = get();
    const target = youthProspects.find(p => p.id === prospectId);
    if (!target) return;

    const newPlayer = convertProspectToPlayer(target, userClubId);
    const updatedProspects = youthProspects.filter(p => p.id !== prospectId);
    const userClub = clubs[userClubId];

    set({
      youthProspects: updatedProspects,
      players: {
        ...players,
        [newPlayer.id]: newPlayer,
      },
      clubs: userClub ? {
        ...clubs,
        [userClubId]: {
          ...userClub,
          finances: {
            ...userClub.finances,
            wageBudgetWeekly: Math.max(0, userClub.finances.wageBudgetWeekly - 1500),
          },
        },
      } : clubs,
    });

    get().showToast('Youth Prospect Signed', `${target.name} signed to youth contract ($1,500/wk). Added to squad.`, 'success');
  },

  releaseYouthProspect: (prospectId: string) => {
    const { youthProspects } = get();
    set({
      youthProspects: youthProspects.filter(p => p.id !== prospectId),
    });
    get().showToast('Prospect Released', 'Youth trialist released from academy roster.', 'normal');
  },

  openAwardsGalaModal: () => {
    const { players, clubs, competitions, activeGalaPayload } = get();
    const galaPayload = activeGalaPayload || calculateAwardsGala('2026/27', players, clubs, competitions);
    set({
      activeGalaPayload: galaPayload,
      isAwardsGalaOpen: true,
    });
  },

  closeAwardsGalaModal: () => {
    const { activeGalaPayload, players, clubs, userClubId, managerProfile } = get();
    if (activeGalaPayload) {
      // Save award winners to player.honors
      const updatedPlayers = { ...players };
      const winnerPlayerId = activeGalaPayload.ballonDor.winner.playerId;
      if (updatedPlayers[winnerPlayerId]) {
        updatedPlayers[winnerPlayerId] = {
          ...updatedPlayers[winnerPlayerId],
          honors: [...(updatedPlayers[winnerPlayerId].honors || []), `Ballon d'Or (${activeGalaPayload.seasonYear})`],
        };
      }
      const shoePlayerId = activeGalaPayload.goldenShoe.playerId;
      if (updatedPlayers[shoePlayerId]) {
        updatedPlayers[shoePlayerId] = {
          ...updatedPlayers[shoePlayerId],
          honors: [...(updatedPlayers[shoePlayerId].honors || []), `European Golden Shoe (${activeGalaPayload.seasonYear})`],
        };
      }

      // Check if user is manager of the year
      let updatedProfile = { ...managerProfile };
      if (activeGalaPayload.managerOfTheYear.clubName === clubs[userClubId]?.name) {
        updatedProfile = {
          ...updatedProfile,
          awards: [...updatedProfile.awards, `Manager of the Year (${activeGalaPayload.seasonYear})`],
          reputation: Math.min(100, updatedProfile.reputation + 4),
        };
      }

      set(state => ({
        isAwardsGalaOpen: false,
        players: updatedPlayers,
        managerProfile: updatedProfile,
        annualAwardsHistory: {
          ...state.annualAwardsHistory,
          [activeGalaPayload.seasonYear]: activeGalaPayload,
        },
      }));
    } else {
      set({ isAwardsGalaOpen: false });
    }
  },

  openSeasonSummaryModal: () => {
    const { clubs, userClubId, players, latestAuditReport } = get();
    const userClub = clubs[userClubId];
    const audit = latestAuditReport || auditClubFfp(userClub, players, '2026/27').report;
    set({
      latestAuditReport: audit,
      isSeasonSummaryOpen: true,
    });
  },

  closeSeasonSummaryModal: () => {
    set({ isSeasonSummaryOpen: false });
  },

  openTrophyCabinet: () => {
    set({ isTrophyCabinetOpen: true });
  },

  closeTrophyCabinet: () => {
    set({ isTrophyCabinetOpen: false });
  },

  executeSeasonRollover: () => {
    const { currentDate, clubs, players, competitions, userClubId, latestAuditReport, managerProfile } = get();
    const penalties: Record<string, number> = {};
    if (latestAuditReport && latestAuditReport.pointsDeduction > 0) {
      penalties[userClubId] = latestAuditReport.pointsDeduction;
    }

    const result = executeSeasonTransition(currentDate, clubs, players, competitions, userClubId, penalties);

    // Update manager career stats & trophies if user won league
    const champ = result.report.leagueChampion;
    let updatedProfile = {
      ...managerProfile,
      careerMatches: managerProfile.careerMatches + 38,
      careerWins: managerProfile.careerWins + 28,
      careerDraws: managerProfile.careerDraws + 6,
      careerLosses: managerProfile.careerLosses + 4,
    };

    if (champ.clubId === userClubId) {
      updatedProfile.trophies = [
        ...updatedProfile.trophies,
        {
          id: `tr-league-${Date.now()}`,
          name: 'LaLiga EA Sports Title',
          season: result.report.previousSeason,
          category: 'LEAGUE',
        },
      ];
      updatedProfile.reputation = Math.min(100, updatedProfile.reputation + 3);
    }

    set({
      clubs: result.updatedClubs,
      players: result.updatedPlayers,
      competitions: result.updatedCompetitions,
      fixtures: result.updatedFixtures,
      currentDate: result.newCurrentDate,
      latestTransitionReport: result.report,
      managerProfile: updatedProfile,
      isSeasonSummaryOpen: false,
      youthProspects: [],
      activeGalaPayload: null,
    });

    get().showToast(
      'New Season 2027/28 Commenced',
      'Promotions & relegations resolved. Dynamic potentials recalibrated. 2027/28 fixture schedules ready.',
      'success'
    );
  },

  handleBoardSacking: () => {
    const { managerProfile } = get();
    set({
      managerProfile: {
        ...managerProfile,
        reputation: Math.max(10, managerProfile.reputation - 15),
        isUnemployed: true,
      },
      isSeasonSummaryOpen: false,
      isAwardsGalaOpen: false,
      isYouthIntakeOpen: false,
    });
    get().showToast(
      'Managerial Contract Terminated',
      'The Board has dismissed you. You have entered the Unemployed Job Market.',
      'error'
    );
  },

  applyForJob: (clubId: string) => {
    const { clubs, managerProfile } = get();
    const newClub = clubs[clubId];
    if (!newClub) return;

    set({
      userClubId: clubId,
      managerProfile: {
        ...managerProfile,
        isUnemployed: false,
        reputation: Math.min(100, managerProfile.reputation + 2),
      },
    });

    get().showToast(
      'Appointment Confirmed',
      `You are the new Head Coach of ${newClub.name}! Best of luck for the campaign.`,
      'success'
    );
  },

  setSelectedPlayerId: (id: string | null) => {
    set({ selectedPlayerId: id });
  },

  setSelectedTargetId: (id: string) => {
    set({ selectedTargetId: id });
  },

  setIsTacticsModalOpen: (open: boolean) => {
    set({ isTacticsModalOpen: open });
  },

  setIsLeverModalOpen: (open: boolean) => {
    set({ isLeverModalOpen: open, leverModalOpen: open });
  },

  setSimModalOpen: (open: boolean) => {
    set({ simModalOpen: open });
  },

  setLeverModalOpen: (open: boolean) => {
    set({ isLeverModalOpen: open, leverModalOpen: open });
  },

  setJumpDateModalOpen: (open: boolean) => {
    set({ jumpDateModalOpen: open });
  },

  showToast: (title: string, message: string, type = 'normal') => {
    const newToast = { id: Date.now(), title, message, type };
    set({ toastMessage: newToast });
    setTimeout(() => {
      if (get().toastMessage?.id === newToast.id) {
        set({ toastMessage: null });
      }
    }, 3500);
  },
}));
