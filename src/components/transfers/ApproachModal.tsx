import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { ShieldCheck, Megaphone, AlertTriangle, X, ArrowRight, Lock, Radio } from 'lucide-react';

export default function ApproachModal() {
  const isApproachModalOpen = useGameStore(state => state.isApproachModalOpen);
  const setIsApproachModalOpen = useGameStore(state => state.setIsApproachModalOpen);
  const approachTargetId = useGameStore(state => state.approachTargetId);
  const targets = useGameStore(state => state.targets);
  const players = useGameStore(state => state.players);
  const clubs = useGameStore(state => state.clubs);
  const userClubId = useGameStore(state => state.userClubId);
  const initiateNegotiation = useGameStore(state => state.initiateNegotiation);
  const addRumor = useGameStore(state => state.addRumor);
  const showToast = useGameStore(state => state.showToast);

  if (!isApproachModalOpen || !approachTargetId) return null;

  const targetFromList = targets.find(t => t.id === approachTargetId);
  const dbPlayer = approachTargetId ? players[approachTargetId] : undefined;
  const target = targetFromList || (dbPlayer ? {
    id: dbPlayer.id,
    name: dbPlayer.name,
    clubName: clubs[dbPlayer.clubId]?.name || 'Current Club',
    clubId: dbPlayer.clubId,
  } : null);

  if (!target) return null;

  const sellingClub = target.clubId ? clubs[target.clubId] : null;
  const currentRelations = sellingClub?.relationsWithUser ?? 0;

  const handlePrivateApproach = () => {
    setIsApproachModalOpen(false);
    initiateNegotiation(target.id, 'PRIVATE');
    showToast(
      'Private Inquiry Initiated',
      `Quiet channel opened with ${target.clubName} sporting directors.`,
      'normal'
    );
  };

  const handlePublicApproach = () => {
    setIsApproachModalOpen(false);

    // 1. Post press leak to Rumor Wire
    addRumor({
      id: `rumor_tapup_${Date.now()}`,
      headline: `FC Barcelona publicly declare admiration for ${target.name}. Selling club furious at unsanctioned tap-up.`,
      source: 'Fabrizio Romano',
      credibilityTier: 1,
      targetPlayerName: target.name,
      buyerClubName: 'FC Barcelona',
      timestamp: 'Just now',
    });

    // 2. Launch negotiation with public approach type
    initiateNegotiation(target.id, 'PUBLIC');
    showToast(
      'Public Statement Issued',
      `Press headlines circulating. ${target.clubName} relations damaged (-35). Rival clubs alerted!`,
      'normal'
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-zinc-950 border border-zinc-800/90 shadow-2xl rounded-xl max-w-lg w-full p-5 relative space-y-4 text-zinc-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
              Transfer Strategy Dossier
            </span>
            <h3 className="text-base font-semibold text-zinc-100 tracking-tight mt-0.5">
              Approach Strategy: {target.name}
            </h3>
            <p className="text-[11px] font-mono text-zinc-500">
              {target.clubName} • {target.position} • Est. ${target.baseFee.toFixed(1)}M
            </p>
          </div>
          <button
            onClick={() => setIsApproachModalOpen(false)}
            className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 rounded hover:bg-zinc-900 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Club Relations Status */}
        <div className="p-2.5 rounded-md bg-zinc-900/50 border border-zinc-800/80 flex items-center justify-between text-xs font-mono">
          <span className="text-zinc-400">Relations with {target.clubName}:</span>
          <span className={`font-medium ${
            currentRelations > 10 ? 'text-emerald-400' : currentRelations < -10 ? 'text-rose-400' : 'text-zinc-300'
          }`}>
            {currentRelations > 10 ? `+${currentRelations} (Cordial)` : currentRelations < -10 ? `${currentRelations} (Strained / Hostile)` : `${currentRelations} (Neutral)`}
          </span>
        </div>

        {/* Strategy Options */}
        <div className="space-y-3 pt-1">
          
          {/* Option A: Private Inquiry */}
          <div
            onClick={handlePrivateApproach}
            className="p-3.5 rounded-lg bg-zinc-900/40 border border-zinc-800/80 hover:border-emerald-500/50 hover:bg-zinc-900/80 transition-all cursor-pointer space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <h4 className="text-xs font-semibold text-zinc-100 group-hover:text-emerald-300 transition-colors">
                  Private Inquiry (Discreet Professionalism)
                </h4>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300">
                Zero Leaks
              </span>
            </div>

            <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
              Contact {target.clubName} directly behind closed doors. Preserves club relations and avoids tipping off continental rivals.
            </p>

            <div className="text-[10px] font-mono text-zinc-500 flex items-center gap-2">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>
                {currentRelations < -20 ? 'Hostile Relations: 25% Spite Surcharge applies' : 'Fair market valuation baseline'}
              </span>
            </div>
          </div>

          {/* Option B: Public Declaration (Tap-Up) */}
          <div
            onClick={handlePublicApproach}
            className="p-3.5 rounded-lg bg-zinc-900/40 border border-zinc-800/80 hover:border-amber-500/50 hover:bg-zinc-900/80 transition-all cursor-pointer space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Megaphone className="w-3.5 h-3.5" />
                </div>
                <h4 className="text-xs font-semibold text-zinc-100 group-hover:text-amber-300 transition-colors">
                  Public Declaration (Media Tap-Up)
                </h4>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400">
                High Risk / Reward
              </span>
            </div>

            <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
              Publicly praise {target.name} to the media. The player's head is turned, agitating for a move, but infuriates the selling club and risks a rival bidding war.
            </p>

            <div className="text-[10px] font-mono text-rose-400 flex items-center gap-2">
              <AlertTriangle className="w-3 h-3" />
              <span>-35 Club Relations Penalty • 85% Chance of Rival Hijack (Man City / PSG / Bayern)</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
