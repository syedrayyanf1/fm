import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { Binoculars, UserCheck, Clock, X, Check, ShieldAlert } from 'lucide-react';
import { resolveFogOfWar } from '../../engine/scoutingEngine';

export default function ScoutAssignmentModal() {
  const isScoutModalOpen = useGameStore(state => state.isScoutModalOpen);
  const setIsScoutModalOpen = useGameStore(state => state.setIsScoutModalOpen);
  const selectedTargetId = useGameStore(state => state.selectedTargetId);
  const targets = useGameStore(state => state.targets);
  const scouts = useGameStore(state => state.scouts);
  const assignScout = useGameStore(state => state.assignScout);
  const recallScout = useGameStore(state => state.recallScout);

  if (!isScoutModalOpen) return null;

  const target = targets.find(t => t.id === selectedTargetId) || targets[0];
  const targetDays = target?.scoutedDays || 0;
  const targetFog = resolveFogOfWar(target, targetDays);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-zinc-950 border border-zinc-800 shadow-2xl rounded-xl max-w-lg w-full p-5 relative space-y-4 text-zinc-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Binoculars className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-100 tracking-tight">
                Scout Deployment & Assignments
              </h3>
              <p className="text-[11px] font-mono text-zinc-400">
                5 Active Global Scout Slots • 21-Day Complete Dossier Lifecycle
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsScoutModalOpen(false)}
            className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 rounded hover:bg-zinc-900 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Selected Target Summary */}
        {target && (
          <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-between text-xs">
            <div>
              <div className="font-semibold text-zinc-100">{target.name}</div>
              <div className="text-[11px] font-mono text-zinc-400">
                {target.clubName} • {target.position}
              </div>
            </div>
            <div className="text-right font-mono">
              <span className="text-emerald-400 font-medium">{targetFog.confidenceText}</span>
              <div className="w-24 bg-zinc-800 h-1 rounded-full overflow-hidden mt-1 ml-auto">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all"
                  style={{ width: `${targetFog.progressPercent}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* Scouts List */}
        <div className="space-y-2 pt-1">
          <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
            Scouting Staff Roster
          </div>

          <div className="space-y-2">
            {scouts.map(scout => {
              const isAssignedToThisTarget = scout.assignedTargetId === target?.id;
              const isBusy = !!scout.assignedTargetId;
              const assignedTargetName = isBusy
                ? targets.find(t => t.id === scout.assignedTargetId)?.name || 'Target'
                : 'Available';

              return (
                <div
                  key={scout.id}
                  className={`p-3 rounded-lg border transition-all flex items-center justify-between ${
                    isAssignedToThisTarget
                      ? 'bg-emerald-950/20 border-emerald-500/40'
                      : 'bg-zinc-900/40 border-zinc-800/80 hover:bg-zinc-900/60'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-zinc-200">{scout.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                        Rep {scout.reputation}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-zinc-400 flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-zinc-500" />
                      {isBusy ? (
                        <span>Assigned to: <strong className="text-zinc-200">{assignedTargetName}</strong> ({scout.daysRemaining}d left)</span>
                      ) : (
                        <span className="text-emerald-400 font-medium">Idle & Ready for Deployment</span>
                      )}
                    </div>
                  </div>

                  <div>
                    {isAssignedToThisTarget ? (
                      <button
                        onClick={() => recallScout(scout.id)}
                        className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-rose-400 text-xs font-mono border border-zinc-700 transition-colors cursor-pointer"
                      >
                        Recall
                      </button>
                    ) : isBusy ? (
                      <button
                        disabled
                        className="px-2.5 py-1 rounded bg-zinc-900 text-zinc-600 text-xs font-mono border border-zinc-800 cursor-not-allowed"
                      >
                        Occupied
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          if (target) assignScout(scout.id, target.id);
                        }}
                        className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                      >
                        <UserCheck className="w-3 h-3" />
                        <span>Deploy</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-2 border-t border-zinc-800/80">
          <button
            onClick={() => setIsScoutModalOpen(false)}
            className="btn-secondary text-xs"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
