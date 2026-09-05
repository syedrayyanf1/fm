import { get, set, del, keys } from 'idb-keyval';
import { GameStoreState } from '../store/useGameStore';
import { Fixture } from '../types/game';

export type SaveSlotId = 'autosave' | 'slot_1' | 'slot_2' | 'slot_3';

export interface SaveSlotMetadata {
  slotId: SaveSlotId;
  label: string;
  savedAt: number; // epoch ms
  currentDate: string;
  clubName: string;
  managerName: string;
  reputation: number;
  trophiesCount: number;
}

const METADATA_KEY_PREFIX = 'fm_meta_';
const SAVE_PAYLOAD_PREFIX = 'fm_save_';

/**
 * Prunes non-user fixture match events to reduce serialized payload from ~30MB to <2MB.
 */
function pruneFixturesForSaving(fixtures: Fixture[], userClubId: string): Fixture[] {
  return fixtures.map(f => {
    if (f.homeClubId === userClubId || f.awayClubId === userClubId) {
      return f;
    }
    if (!f.result) return f;
    return {
      ...f,
      result: {
        homeScore: f.result.homeScore,
        awayScore: f.result.awayScore,
        homeXg: f.result.homeXg,
        awayXg: f.result.awayXg,
        events: [],
      },
    };
  });
}

/**
 * Extracts serializable state from zustand GameStoreState.
 */
function extractSerializableState(state: GameStoreState) {
  const userClub = state.clubs[state.userClubId];

  return {
    version: 2,
    savedAt: Date.now(),
    currentDate: state.currentDate,
    userClubId: state.userClubId,
    clubs: state.clubs,
    players: state.players,
    competitions: state.competitions,
    fixtures: pruneFixturesForSaving(state.fixtures, state.userClubId),
    rumors: state.rumors.slice(0, 50),
    targets: state.targets,
    facilities: state.facilities,
    scouts: state.scouts,
    activeTransferOffers: state.activeTransferOffers,
    transferListedPlayerIds: (state as any).transferListedPlayerIds || [],
    incomingOffers: (state as any).incomingOffers || [],
    managerProfile: state.managerProfile,
    annualAwardsHistory: state.annualAwardsHistory,
    youthProspects: state.youthProspects,
    interruptPreferences: state.interruptPreferences,
  };
}

/**
 * Saves game state into an IndexedDB slot.
 */
export async function saveGameToSlot(
  slotId: SaveSlotId,
  state: GameStoreState,
  slotLabel?: string
): Promise<SaveSlotMetadata> {
  const serializable = extractSerializableState(state);
  const userClub = state.clubs[state.userClubId];

  const metadata: SaveSlotMetadata = {
    slotId,
    label: slotLabel || (slotId === 'autosave' ? 'Autosave' : `Save Slot ${slotId.replace('slot_', '')}`),
    savedAt: Date.now(),
    currentDate: state.currentDate,
    clubName: userClub?.name || 'FC Barcelona',
    managerName: state.managerProfile?.name || 'Manager',
    reputation: userClub?.reputation || 85,
    trophiesCount: state.managerProfile?.trophies?.length || 0,
  };

  await set(`${SAVE_PAYLOAD_PREFIX}${slotId}`, serializable);
  await set(`${METADATA_KEY_PREFIX}${slotId}`, metadata);

  return metadata;
}

/**
 * Loads game state from an IndexedDB slot.
 */
export async function loadGameFromSlot(slotId: SaveSlotId): Promise<any> {
  const payload = await get(`${SAVE_PAYLOAD_PREFIX}${slotId}`);
  if (!payload) {
    throw new Error(`No save data found in slot ${slotId}`);
  }
  return payload;
}

/**
 * Retrieves metadata for all 4 slots.
 */
export async function getAllSaveSlots(): Promise<Record<SaveSlotId, SaveSlotMetadata | null>> {
  const slots: SaveSlotId[] = ['autosave', 'slot_1', 'slot_2', 'slot_3'];
  const result: Record<SaveSlotId, SaveSlotMetadata | null> = {
    autosave: null,
    slot_1: null,
    slot_2: null,
    slot_3: null,
  };

  for (const s of slots) {
    try {
      const meta = await get<SaveSlotMetadata>(`${METADATA_KEY_PREFIX}${s}`);
      result[s] = meta || null;
    } catch {
      result[s] = null;
    }
  }

  return result;
}

/**
 * Deletes a save slot.
 */
export async function deleteSaveSlot(slotId: SaveSlotId): Promise<void> {
  await del(`${SAVE_PAYLOAD_PREFIX}${slotId}`);
  await del(`${METADATA_KEY_PREFIX}${slotId}`);
}

/**
 * Exports save state to a downloaded JSON file.
 */
export async function exportSaveToFile(slotId: SaveSlotId): Promise<void> {
  const data = await loadGameFromSlot(slotId);
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `fm-career-${data.currentDate || 'save'}-${slotId}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Imports a save state from an uploaded file.
 */
export function importSaveFromFile(file: File): Promise<any> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);
        if (!parsed.currentDate || !parsed.clubs || !parsed.players) {
          throw new Error('Invalid Football Manager save file schema.');
        }
        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsText(file);
  });
}
