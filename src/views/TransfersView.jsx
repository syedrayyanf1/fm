import React, { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import {
  Search,
  Binoculars,
  DollarSign,
  UserCheck,
  ShieldAlert,
  Sparkles,
  Lock,
  Radio,
  Flame,
  Globe,
} from 'lucide-react';
import { resolveFogOfWar } from '../engine/scoutingEngine';
import RumorWireCard from '../components/transfers/RumorWireCard';
import SafePlayerPhoto from '../components/common/SafePlayerPhoto';
import GlobalPlayerList from '../components/transfers/GlobalPlayerList';
import PlayerActionDrawer from '../components/transfers/PlayerActionDrawer';
import IncomingOffersPanel from '../components/transfers/IncomingOffersPanel';

export default function TransfersView() {
  const club = useGameStore(state => state.clubs[state.userClubId]);
  const userClubId = useGameStore(state => state.userClubId);
  const clubs = useGameStore(state => state.clubs);
  const players = useGameStore(state => state.players);
  const competitions = useGameStore(state => state.competitions);
  const setBudgetSlider = useGameStore(state => state.setBudgetSlider);
  const targets = useGameStore(state => state.targets);
  const selectedTargetId = useGameStore(state => state.selectedTargetId);
  const setSelectedTargetId = useGameStore(state => state.setSelectedTargetId);
  const initiateApproach = useGameStore(state => state.initiateApproach);
  const setIsScoutModalOpen = useGameStore(state => state.setIsScoutModalOpen);
  const setIsApproachModalOpen = useGameStore(state => state.setIsApproachModalOpen);
  const setIsTransferModalOpen = useGameStore(state => state.setIsTransferModalOpen);
  const scouts = useGameStore(state => state.scouts);

  // Transfer store additions
  const transferListedPlayerIds = useGameStore(state => state.transferListedPlayerIds || []);
  const incomingOffers = useGameStore(state => state.incomingOffers || []);
  const transferListPlayer = useGameStore(state => state.transferListPlayer);
  const offerToClubs = useGameStore(state => state.offerToClubs);
  const acceptIncomingOffer = useGameStore(state => state.acceptIncomingOffer);
  const counterIncomingOffer = useGameStore(state => state.counterIncomingOffer);
  const rejectIncomingOffer = useGameStore(state => state.rejectIncomingOffer);

  const finances = club?.finances || {
    transferBudget: 45000000,
    wageBudgetWeekly: 1200000,
    allocatedFeePercentage: 60,
  };
  const allocatedFeePercentage = finances.allocatedFeePercentage ?? 60;

  // Active sub-tab state: 'search' | 'radar' | 'offers' | 'rumors'
  const [activeTab, setActiveTab] = useState('search');

  // Selected player for right-side action drawer
  const [drawerPlayer, setDrawerPlayer] = useState(null);

  // Radar-specific filters
  const [radarSearchQuery, setRadarSearchQuery] = useState('');
  const [radarFilter, setRadarFilter] = useState('All');

  const selectedTarget = targets.find(t => t.id === selectedTargetId) || targets[0];
  const selectedFog = selectedTarget
    ? resolveFogOfWar(selectedTarget, selectedTarget.scoutedDays || 0)
    : null;

  const filteredTargets = targets.filter(t => {
    const matchesSearch =
      t.name.toLowerCase().includes(radarSearchQuery.toLowerCase()) ||
      t.clubName.toLowerCase().includes(radarSearchQuery.toLowerCase());
    const matchesFilter = radarFilter === 'All' || t.position.includes(radarFilter);
    return matchesSearch && matchesFilter;
  });

  const activeScoutsCount = scouts.filter(s => s.assignedTargetId !== null).length;
  const pendingOffersCount = incomingOffers.filter(o => o.status === 'PENDING' || o.status === 'COUNTERED').length;

  const handleOpenBid = (playerId) => {
    useGameStore.setState({ transferTargetId: playerId });
    setIsTransferModalOpen(true);
  };

  const handleOpenApproach = (playerId) => {
    useGameStore.setState({ approachTargetId: playerId });
    setIsApproachModalOpen(true);
  };

  const handleDeployScout = (playerId) => {
    const freeScout = scouts.find(s => s.assignedTargetId === null);
    if (freeScout) {
      useGameStore.getState().assignScout(freeScout.id, playerId);
    } else {
      setIsScoutModalOpen(true);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Understated Budget Slider */}
      <div className="hairline-card p-4 bg-zinc-900/30 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-zinc-400">Transfer Market</span>
              <span className="text-zinc-600">•</span>
              <span className="text-xs text-zinc-500">2026/27 Window</span>
            </div>
            <h2 className="text-base sm:text-lg font-semibold text-zinc-100 tracking-tight mt-0.5">
              Transfer Hub & Scouting Operations
            </h2>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            {/* Deploy Scouts CTA */}
            <button
              onClick={() => setIsScoutModalOpen(true)}
              className="btn-secondary text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Binoculars className="w-3.5 h-3.5 text-emerald-400" />
              <span>Scouting Staff ({activeScoutsCount}/5 Deployed)</span>
            </button>

            <span className="quiet-chip">
              Treasury: <strong className="text-emerald-400 ml-1 font-medium">${(finances.transferBudget / 1e6).toFixed(1)}M</strong>
            </span>
            <span className="quiet-chip">
              Wage Room: <strong className="text-zinc-200 ml-1 font-medium">${(finances.wageBudgetWeekly / 1e6).toFixed(2)}M/wk</strong>
            </span>
          </div>
        </div>

        {/* Budget Allocation Slider */}
        <div className="p-3 rounded-lg bg-zinc-900/40 border border-white/[0.05] space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-400">Financial Levers Allocation</span>
            <span className="text-zinc-400">
              {allocatedFeePercentage}% Fees / {100 - allocatedFeePercentage}% Wages
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono text-zinc-500 w-12">Wages</span>
            <input
              type="range"
              min="20"
              max="80"
              value={allocatedFeePercentage}
              onChange={e => setBudgetSlider(Number(e.target.value))}
              className="w-full accent-zinc-200 h-1 bg-zinc-800 rounded appearance-none cursor-pointer"
            />
            <span className="text-[11px] font-mono text-zinc-500 w-12 text-right">Transfers</span>
          </div>
        </div>
      </div>

      {/* Transfer Hub Sub-Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-1">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('search')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-medium transition ${
              activeTab === 'search'
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Market Search (5,000+)</span>
          </button>

          <button
            onClick={() => setActiveTab('radar')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-medium transition ${
              activeTab === 'radar'
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
          >
            <Binoculars className="w-3.5 h-3.5" />
            <span>Scouting Radar ({targets.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('offers')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-medium transition relative ${
              activeTab === 'offers'
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Incoming Bids</span>
            {pendingOffersCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-zinc-950 font-bold text-[10px] tabular-nums">
                {pendingOffersCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('rumors')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-medium transition ${
              activeTab === 'rumors'
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Rumor Wire</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Global Market Search */}
      {activeTab === 'search' && (
        <GlobalPlayerList
          players={players}
          clubs={clubs}
          competitions={competitions}
          userClubId={userClubId}
          transferListedIds={transferListedPlayerIds}
          onSelectPlayer={player => setDrawerPlayer(player)}
        />
      )}

      {/* Tab 2: Scouting Radar Targets */}
      {activeTab === 'radar' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left: Search & Scouted Player List (8 cols) */}
          <div className="lg:col-span-8 space-y-3">
            <div className="hairline-card p-4 bg-zinc-900/40 space-y-3">
              {/* Search Bar & Filters */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Filter shortlisted targets..."
                    value={radarSearchQuery}
                    onChange={e => setRadarSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-12 py-1.5 bg-zinc-900/60 border border-white/[0.06] rounded-md text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-white/[0.15] transition-colors font-mono"
                  />
                </div>

                <div className="flex items-center gap-1 text-xs font-mono">
                  {['All', 'ST', 'LW', 'RW', 'CAM', 'DM'].map(pos => (
                    <button
                      key={pos}
                      onClick={() => setRadarFilter(pos)}
                      className={`px-2.5 py-1 text-xs rounded transition-colors cursor-pointer ${
                        radarFilter === pos
                          ? 'bg-zinc-800 text-zinc-100 font-medium border border-white/[0.08]'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scouted Player List with 3-Stage Fog of War */}
              <div className="overflow-x-auto -mx-2 sm:mx-0">
                <table className="w-full text-left border-collapse text-xs font-mono">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-zinc-500 font-mono text-[11px]">
                      <th className="pb-2 font-medium">Target</th>
                      <th className="pb-2 font-medium text-center">Pos</th>
                      <th className="pb-2 font-medium text-center">Age</th>
                      <th className="pb-2 font-medium text-center">Fog OVR</th>
                      <th className="pb-2 font-medium text-center">Scout Intel</th>
                      <th className="pb-2 font-medium text-right">Valuation</th>
                      <th className="pb-2 font-medium text-right pr-2">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {filteredTargets.map(t => {
                      const isSelected = selectedTarget?.id === t.id;
                      const fog = resolveFogOfWar(t, t.scoutedDays || 0);

                      return (
                        <tr
                          key={t.id}
                          onClick={() => setSelectedTargetId(t.id)}
                          className={`cursor-pointer transition-colors ${
                            isSelected ? 'bg-white/[0.05]' : 'hover:bg-white/[0.02]'
                          }`}
                        >
                          <td className="py-2.5">
                            <div className="flex items-center gap-2.5">
                              <SafePlayerPhoto name={t.name} photoUrl={t.photoUrl} className="w-7 h-7 rounded-full text-[10px]" />
                              <div>
                                <div className="font-medium text-zinc-200">{t.name}</div>
                                <div className="text-[11px] text-zinc-500 font-mono">{t.clubName}</div>
                              </div>
                            </div>
                          </td>

                          <td className="py-2.5 text-center font-mono text-zinc-400">
                            {t.position}
                          </td>

                          <td className="py-2.5 text-center font-mono text-zinc-500">
                            {t.age}
                          </td>

                          <td className="py-2.5 text-center">
                            <span className={`font-mono text-xs px-2 py-0.5 rounded border ${
                              fog.fogLevel === 3
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-bold'
                                : fog.fogLevel >= 1
                                ? 'bg-zinc-800 text-zinc-200 border-zinc-700'
                                : 'bg-white/[0.03] text-zinc-400 border-white/[0.04]'
                            }`}>
                              {fog.ovrDisplay}
                            </span>
                          </td>

                          <td className="py-2.5 text-center">
                            <span className="text-[10px] font-mono text-zinc-500">
                              {fog.fogLevel === 3 ? (
                                <span className="text-emerald-400">Dossier Complete</span>
                              ) : (
                                `${fog.progressPercent}% Investigated`
                              )}
                            </span>
                          </td>

                          <td className="py-2.5 text-right font-mono text-zinc-300">
                            {fog.valuationDisplay}
                          </td>

                          <td className="py-2.5 text-right pr-2">
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                handleOpenApproach(t.id);
                              }}
                              className="btn-primary text-[11px] py-1 px-2.5 cursor-pointer"
                            >
                              Inquire
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right: Selected Target Dossier & Rumor Wire */}
          <div className="lg:col-span-4 space-y-3">
            {selectedTarget && selectedFog && (
              <div className="hairline-card p-4 bg-zinc-900/40 space-y-3 text-xs font-mono">
                <div className="flex items-center justify-between pb-1.5 border-b border-white/[0.06]">
                  <span className="text-zinc-500 font-mono text-[10px] uppercase">
                    Target Dossier Inspection
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                    selectedFog.fogLevel === 3
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                  }`}>
                    Fog Level {selectedFog.fogLevel}/3
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <SafePlayerPhoto name={selectedTarget.name} photoUrl={selectedTarget.photoUrl} className="w-10 h-10 rounded-full text-xs" />
                  <div>
                    <div className="font-semibold text-zinc-100 text-sm font-sans">{selectedTarget.name}</div>
                    <div className="text-zinc-400 text-[11px] font-mono">
                      {selectedTarget.clubName} • {selectedTarget.position} • Age {selectedTarget.age}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-1.5 text-center font-mono text-[11px]">
                  <div className="p-1.5 rounded bg-zinc-900/60 border border-zinc-800">
                    <span className="text-[9px] text-zinc-500 block">ATT</span>
                    <span className="text-zinc-200 font-semibold">{selectedFog.attributes.attacking}</span>
                  </div>
                  <div className="p-1.5 rounded bg-zinc-900/60 border border-zinc-800">
                    <span className="text-[9px] text-zinc-500 block">CRE</span>
                    <span className="text-zinc-200 font-semibold">{selectedFog.attributes.creative}</span>
                  </div>
                  <div className="p-1.5 rounded bg-zinc-900/60 border border-zinc-800">
                    <span className="text-[9px] text-zinc-500 block">DEF</span>
                    <span className="text-zinc-200 font-semibold">{selectedFog.attributes.defending}</span>
                  </div>
                  <div className="p-1.5 rounded bg-zinc-900/60 border border-zinc-800">
                    <span className="text-[9px] text-zinc-500 block">PHY</span>
                    <span className="text-zinc-200 font-semibold">{selectedFog.attributes.physical}</span>
                  </div>
                  <div className="p-1.5 rounded bg-zinc-900/60 border border-zinc-800">
                    <span className="text-[9px] text-zinc-500 block">MEN</span>
                    <span className="text-zinc-200 font-semibold">{selectedFog.attributes.mental}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setIsScoutModalOpen(true)}
                    className="w-1/2 btn-secondary text-xs justify-center cursor-pointer"
                  >
                    <Binoculars className="w-3.5 h-3.5 mr-1" />
                    <span>Staff</span>
                  </button>

                  <button
                    onClick={() => handleOpenBid(selectedTarget.id)}
                    className="w-1/2 btn-primary text-xs justify-center cursor-pointer"
                  >
                    <span>Formal Bid</span>
                  </button>
                </div>
              </div>
            )}

            <RumorWireCard />
          </div>
        </div>
      )}

      {/* Tab 3: Incoming Offers Panel */}
      {activeTab === 'offers' && (
        <IncomingOffersPanel
          offers={incomingOffers}
          players={players}
          clubs={clubs}
          onAccept={acceptIncomingOffer}
          onReject={rejectIncomingOffer}
          onCounter={counterIncomingOffer}
        />
      )}

      {/* Tab 4: Standalone Rumor Wire */}
      {activeTab === 'rumors' && (
        <div className="max-w-2xl mx-auto">
          <RumorWireCard />
        </div>
      )}

      {/* Slide-out Player Action Drawer */}
      <PlayerActionDrawer
        player={drawerPlayer}
        club={drawerPlayer ? clubs[drawerPlayer.clubId] : undefined}
        userClubId={userClubId}
        isTransferListed={drawerPlayer ? transferListedPlayerIds.includes(drawerPlayer.id) : false}
        onClose={() => setDrawerPlayer(null)}
        onDeployScout={handleDeployScout}
        onApproach={handleOpenApproach}
        onBid={handleOpenBid}
        onToggleTransferList={transferListPlayer}
        onOfferToClubs={offerToClubs}
      />
    </div>
  );
}
