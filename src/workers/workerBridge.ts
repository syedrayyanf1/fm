import {
  Fixture,
  Club,
  Player,
  Competition,
  SimInterruptPayload,
  InterruptPreferences,
} from '../types/game';

export interface StartSimPayload {
  targetDate: string;
  userClubId: string;
  currentDate: string;
  fixtures: Fixture[];
  clubs: Record<string, Club>;
  players: Record<string, Player>;
  competitions: Record<string, Competition>;
  interruptPreferences: InterruptPreferences;
}

export interface DayTickPayload {
  currentDate: string;
  progressPercentage: number;
  updatedFixtures: Fixture[];
  updatedPlayers: Record<string, Player>;
  updatedCompetitions: Record<string, Competition>;
  updatedClubs: Record<string, Club>;
  simulatedMatchesCount: number;
}

export interface SimStateSnapshot {
  currentDate: string;
  fixtures: Fixture[];
  players: Record<string, Player>;
  competitions: Record<string, Competition>;
  clubs: Record<string, Club>;
  /** The original simulation target; preserved across interrupt/resume cycles */
  originalTargetDate?: string;
}

export interface SimInterruptedMessage {
  type: 'SIMULATION_INTERRUPTED';
  payload: SimInterruptPayload;
  stateSnapshot: SimStateSnapshot;
}

export interface DateTickMessage {
  type: 'DATE_TICK';
  payload: DayTickPayload;
}

export interface SimCompleteMessage {
  type: 'SIMULATION_COMPLETE';
  stateSnapshot: SimStateSnapshot;
}

export interface SimErrorMessage {
  type: 'SIMULATION_ERROR';
  error: string;
}

export type WorkerToMainMessage =
  | SimInterruptedMessage
  | DateTickMessage
  | SimCompleteMessage
  | SimErrorMessage;

export interface WorkerBridgeCallbacks {
  onTick: (data: DayTickPayload) => void;
  onInterrupt: (interrupt: SimInterruptPayload, state: SimStateSnapshot) => void;
  onComplete: (state: SimStateSnapshot) => void;
  onError: (error: string) => void;
}

class WorkerBridgeManager {
  private worker: Worker | null = null;
  private callbacks: WorkerBridgeCallbacks | null = null;
  private isRunning = false;

  public initWorker(callbacks: WorkerBridgeCallbacks): void {
    this.callbacks = callbacks;
    if (this.worker) return;

    try {
      this.worker = new Worker(
        new URL('./calendarWorker.ts', import.meta.url),
        { type: 'module' }
      );

      this.worker.onmessage = (event: MessageEvent<WorkerToMainMessage>) => {
        const msg = event.data;
        if (!msg) return;

        switch (msg.type) {
          case 'DATE_TICK':
            this.callbacks?.onTick(msg.payload);
            break;
          case 'SIMULATION_INTERRUPTED':
            this.isRunning = false;
            this.callbacks?.onInterrupt(msg.payload, msg.stateSnapshot);
            break;
          case 'SIMULATION_COMPLETE':
            this.isRunning = false;
            this.callbacks?.onComplete(msg.stateSnapshot);
            break;
          case 'SIMULATION_ERROR':
            this.isRunning = false;
            this.callbacks?.onError(msg.error);
            break;
        }
      };

      this.worker.onerror = (err) => {
        this.isRunning = false;
        console.error('Calendar Worker Error:', err);
        this.callbacks?.onError(err.message || 'Worker thread execution error');
      };
    } catch (e: any) {
      console.warn('Dedicated Web Worker failed to initialize, falling back:', e);
    }
  }

  public startSimulation(payload: StartSimPayload & { originalTargetDate?: string }): void {
    this.isRunning = true;
    if (!this.worker && this.callbacks) {
      this.initWorker(this.callbacks);
    }
    if (this.worker) {
      this.worker.postMessage({
        type: 'START_SIMULATION',
        payload,
      });
    }
  }

  public pauseSimulation(): void {
    this.isRunning = false;
    if (this.worker) {
      this.worker.postMessage({
        type: 'PAUSE_SIMULATION',
      });
    }
  }

  public terminate(): void {
    this.isRunning = false;
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }
}

export const workerBridge = new WorkerBridgeManager();
