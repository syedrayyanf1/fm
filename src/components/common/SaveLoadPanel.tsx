import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../../store/useGameStore';
import {
  saveGameToSlot,
  loadGameFromSlot,
  getAllSaveSlots,
  deleteSaveSlot,
  exportSaveToFile,
  importSaveFromFile,
  SaveSlotId,
  SaveSlotMetadata,
} from '../../storage/saveManager';
import {
  X,
  Save,
  Download,
  Upload,
  Trash2,
  Clock,
  Shield,
  CheckCircle2,
  FileDown,
  FileUp,
  FolderOpen,
} from 'lucide-react';

interface SaveLoadPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SaveLoadPanel({ isOpen, onClose }: SaveLoadPanelProps) {
  const store = useGameStore();
  const showToast = store.showToast;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [slotsMeta, setSlotsMeta] = useState<Record<SaveSlotId, SaveSlotMetadata | null>>({
    autosave: null,
    slot_1: null,
    slot_2: null,
    slot_3: null,
  });
  const [loading, setLoading] = useState(false);

  const refreshSlots = async () => {
    try {
      const data = await getAllSaveSlots();
      setSlotsMeta(data);
    } catch (e) {
      console.error('Failed to load save slots', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshSlots();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async (slotId: SaveSlotId) => {
    setLoading(true);
    try {
      await saveGameToSlot(slotId, store);
      await refreshSlots();
      showToast('Game Saved', `Successfully saved progress into ${slotId}.`, 'success');
    } catch (err: any) {
      showToast('Save Failed', err?.message || 'Error saving state.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLoad = async (slotId: SaveSlotId) => {
    setLoading(true);
    try {
      const data = await loadGameFromSlot(slotId);
      // Hydrate zustand store
      useGameStore.setState({
        currentDate: data.currentDate,
        userClubId: data.userClubId,
        clubs: data.clubs,
        players: data.players,
        competitions: data.competitions,
        fixtures: data.fixtures,
        rumors: data.rumors,
        targets: data.targets || [],
        facilities: data.facilities || [],
        scouts: data.scouts || [],
        activeTransferOffers: data.activeTransferOffers || [],
        transferListedPlayerIds: data.transferListedPlayerIds || [],
        incomingOffers: data.incomingOffers || [],
        managerProfile: data.managerProfile || store.managerProfile,
        youthProspects: data.youthProspects || [],
        interruptData: null,
        isSimulating: false,
      } as any);

      showToast('Game Loaded', `Restored game state from ${data.currentDate}.`, 'success');
      onClose();
    } catch (err: any) {
      showToast('Load Failed', err?.message || 'Error loading save.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (slotId: SaveSlotId) => {
    if (!window.confirm(`Are you sure you want to delete save in ${slotId}?`)) return;
    try {
      await deleteSaveSlot(slotId);
      await refreshSlots();
      showToast('Save Deleted', `Slot ${slotId} is now empty.`, 'normal');
    } catch (err: any) {
      showToast('Delete Failed', err?.message || 'Error deleting save.', 'error');
    }
  };

  const handleExport = async (slotId: SaveSlotId) => {
    try {
      await exportSaveToFile(slotId);
      showToast('Export Started', 'Downloaded save JSON file.', 'success');
    } catch (err: any) {
      showToast('Export Failed', err?.message || 'Error exporting.', 'error');
    }
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const data = await importSaveFromFile(file);
      useGameStore.setState({
        currentDate: data.currentDate,
        userClubId: data.userClubId,
        clubs: data.clubs,
        players: data.players,
        competitions: data.competitions,
        fixtures: data.fixtures,
        rumors: data.rumors,
        targets: data.targets || [],
        facilities: data.facilities || [],
        scouts: data.scouts || [],
        activeTransferOffers: data.activeTransferOffers || [],
        transferListedPlayerIds: data.transferListedPlayerIds || [],
        incomingOffers: data.incomingOffers || [],
        managerProfile: data.managerProfile || store.managerProfile,
        youthProspects: data.youthProspects || [],
        interruptData: null,
        isSimulating: false,
      } as any);

      showToast('Save Imported', `Restored career from ${file.name}.`, 'success');
      onClose();
    } catch (err: any) {
      showToast('Import Failed', err?.message || 'Invalid save file.', 'error');
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const slotsList: { id: SaveSlotId; title: string; subtitle: string }[] = [
    { id: 'autosave', title: 'Autosave', subtitle: 'Automatic milestone backup' },
    { id: 'slot_1', title: 'Manual Slot 1', subtitle: 'Career progress point' },
    { id: 'slot_2', title: 'Manual Slot 2', subtitle: 'Career progress point' },
    { id: 'slot_3', title: 'Manual Slot 3', subtitle: 'Career progress point' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800/90 rounded-2xl shadow-2xl z-10 overflow-hidden font-mono text-xs">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800/80 bg-zinc-900/60">
          <div className="flex items-center gap-2">
            <Save className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-sm text-zinc-100 font-sans tracking-wide">
              CAREER SAVES & PERSISTENCE
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Slot Grid */}
        <div className="p-5 space-y-3 max-h-[65vh] overflow-y-auto">
          {slotsList.map(s => {
            const meta = slotsMeta[s.id];
            const isOccupied = meta !== null;
            const timeStr = isOccupied
              ? new Date(meta.savedAt).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : null;

            return (
              <div
                key={s.id}
                className="p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800/80 hover:border-zinc-700/80 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-zinc-100 font-sans text-sm">
                      {s.title}
                    </span>
                    {isOccupied ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                        SAVED
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-400">
                        EMPTY
                      </span>
                    )}
                  </div>

                  {isOccupied ? (
                    <div className="text-zinc-400 text-xs flex flex-wrap items-center gap-2">
                      <span className="text-amber-400 font-medium">{meta.clubName}</span>
                      <span>•</span>
                      <span>Date: <strong className="text-zinc-200">{meta.currentDate}</strong></span>
                      <span>•</span>
                      <span className="text-zinc-500 text-[11px]">Saved: {timeStr}</span>
                    </div>
                  ) : (
                    <div className="text-zinc-500 text-xs">{s.subtitle}</div>
                  )}
                </div>

                {/* Slot Actions */}
                <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                  <button
                    onClick={() => handleSave(s.id)}
                    disabled={loading}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700/60 transition flex items-center gap-1 font-semibold"
                    title="Save current game to this slot"
                  >
                    <Save className="w-3.5 h-3.5 text-amber-400" />
                    <span>Save</span>
                  </button>

                  {isOccupied && (
                    <>
                      <button
                        onClick={() => handleLoad(s.id)}
                        disabled={loading}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1 font-bold shadow-sm"
                        title="Load game from this slot"
                      >
                        <FolderOpen className="w-3.5 h-3.5" />
                        <span>Load</span>
                      </button>

                      <button
                        onClick={() => handleExport(s.id)}
                        className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 border border-zinc-700/40 transition"
                        title="Export JSON file"
                      >
                        <FileDown className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDelete(s.id)}
                        className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-rose-950 hover:text-rose-400 text-zinc-500 border border-zinc-700/40 transition"
                        title="Delete this save"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer: External File Import */}
        <div className="p-4 border-t border-zinc-800/80 bg-zinc-900/60 flex items-center justify-between gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileImport}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-zinc-100 border border-zinc-700/60 transition flex items-center gap-1.5 font-medium"
          >
            <FileUp className="w-4 h-4 text-amber-400" />
            <span>Import Save File (.json)</span>
          </button>

          <span className="text-[11px] text-zinc-500">
            IndexedDB storage • Offline persistent
          </span>
        </div>
      </div>
    </div>
  );
}
