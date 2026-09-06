import React, { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import {
  DollarSign,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  X,
  Swords,
  Scale,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { TransferOffer, TransferAddons, PlayerContractOffer } from '../../types/transfer';
import { evaluateClubOffer, evaluateContractOffer } from '../../engine/negotiationEngine';
import { generateRivalBiddingWar, RivalClubBid } from '../../engine/transferAI';
import SafePlayerPhoto from '../common/SafePlayerPhoto';

export default function TransferModal() {
  const isTransferModalOpen = useGameStore(state => state.isTransferModalOpen);
  const setIsTransferModalOpen = useGameStore(state => state.setIsTransferModalOpen);
  const transferTargetId = useGameStore(state => state.transferTargetId);
  const transferApproachType = useGameStore(state => state.transferApproachType);
  const targets = useGameStore(state => state.targets);
  const players = useGameStore(state => state.players);
  const clubs = useGameStore(state => state.clubs);
  const userClubId = useGameStore(state => state.userClubId);
  const executeTransferSigning = useGameStore(state => state.executeTransferSigning);
  const addRumor = useGameStore(state => state.addRumor);
  const showToast = useGameStore(state => state.showToast);

  const userClub = clubs[userClubId];
  const userFinances = userClub?.finances || {
    transferBudget: 45000000,
    wageBudgetWeekly: 1200000,
    balance: 55000000,
  };

  const targetFromList = targets.find(t => t.id === transferTargetId);
  const playerFromDb = transferTargetId ? players[transferTargetId] : undefined;

  const target = React.useMemo(() => {
    if (targetFromList) return targetFromList;
    if (!playerFromDb) return undefined;
    return {
      id: playerFromDb.id,
      playerId: playerFromDb.id,
      name: playerFromDb.name,
      photoUrl: playerFromDb.photoUrl,
      clubName: clubs[playerFromDb.clubId]?.name || 'Current Club',
      clubId: playerFromDb.clubId,
      position: playerFromDb.primaryPosition,
      age: playerFromDb.age,
      nationality: playerFromDb.nationality,
      fogRange: `${playerFromDb.overallRating}`,
      exactOvr: playerFromDb.overallRating,
      estFeeFormatted: `€${(playerFromDb.marketValue / 1e6).toFixed(1)}M`,
      wageEstimateFormatted: `€${(playerFromDb.wagePerWeek / 1e3).toFixed(0)}k/wk`,
      scoutConfidenceText: 'Dossier Available',
      scoutPercent: 100,
      baseFee: Math.max(1, Math.round(playerFromDb.marketValue / 1e6)),
      addons: Math.round((playerFromDb.marketValue * 0.15) / 1e6),
      weeklyWage: playerFromDb.wagePerWeek,
      attributes: playerFromDb.attributes,
      traits: playerFromDb.traits,
    };
  }, [targetFromList, playerFromDb, clubs]);

  // Form State
  const initialBaseFee = target?.baseFee ? target.baseFee * 1_000_000 : (playerFromDb?.marketValue || 50_000_000);
  const [baseFee, setBaseFee] = useState<number>(initialBaseFee);
  const [installments, setInstallments] = useState<1 | 2 | 3>(1);
  const [addons, setAddons] = useState<TransferAddons>({
    appearances30: false,
    appearancesAmount: 5_000_000,
    uclQualification: false,
    uclAmount: 7_500_000,
    leagueTitle: false,
    leagueTitleAmount: 10_000_000,
  });
  const [sellOnPct, setSellOnPct] = useState<0 | 10 | 15 | 20>(10);

  // Contract Terms
  const [weeklyWage, setWeeklyWage] = useState<number>(target?.weeklyWage || 200_000);
  const [contractYears, setContractYears] = useState<2 | 3 | 4 | 5>(4);
  const [squadRole, setSquadRole] = useState<'STAR' | 'IMPORTANT' | 'ROTATION' | 'PROSPECT'>('STAR');
  const [releaseClause, setReleaseClause] = useState<number>(Math.round((target?.baseFee || 60) * 2_500_000));
  const [agentFee, setAgentFee] = useState<number>(3_000_000);

  // Negotiation Result Dialog State
  const [negotiationStatus, setNegotiationStatus] = useState<
    'EDITING' | 'ACCEPTED' | 'COUNTERED' | 'REJECTED' | 'BIDDING_WAR'
  >('EDITING');
  const [counterDetails, setCounterDetails] = useState<{ fee: number; sellOn: number; note: string } | null>(null);
  const [rivalBidDetails, setRivalBidDetails] = useState<RivalClubBid | null>(null);

  React.useEffect(() => {
    if (isTransferModalOpen && target) {
      const fee = target.baseFee ? target.baseFee * 1_000_000 : (playerFromDb?.marketValue || 50_000_000);
      setBaseFee(fee);
      setWeeklyWage(target.weeklyWage || playerFromDb?.wagePerWeek || 150_000);
      setNegotiationStatus('EDITING');
      setCounterDetails(null);
      setRivalBidDetails(null);
    }
  }, [transferTargetId, isTransferModalOpen]);

  if (!isTransferModalOpen || !target) return null;

  const sellingClub = target.clubId ? clubs[target.clubId] : undefined;
  const currentRelations = sellingClub?.relationsWithUser ?? 0;

  // Financial calculations
  let addonsSum = 0;
  if (addons.appearances30) addonsSum += addons.appearancesAmount;
  if (addons.uclQualification) addonsSum += addons.uclAmount;
  if (addons.leagueTitle) addonsSum += addons.leagueTitleAmount;

  const totalPackageFee = baseFee + addonsSum;
  const annualAmortization = Math.round(baseFee / contractYears);
  const upfrontCashDeduction = Math.round(baseFee / installments) + agentFee;

  const isAffordable = upfrontCashDeduction <= userFinances.balance && baseFee <= userFinances.transferBudget;

  const handleSubmitFormalBid = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAffordable) {
      showToast('Insufficient Funds', 'Upfront fee exceeds transfer treasury.', 'error');
      return;
    }

    const offer: TransferOffer = {
      id: `offer_${Date.now()}`,
      targetId: target.id,
      targetPlayerName: target.name,
      buyerClubId: userClubId,
      sellerClubId: target.clubId || 'opp',
      approachType: transferApproachType || 'PRIVATE',
      baseFee,
      installments,
      addons,
      sellOnPct,
      contractOffer: {
        weeklyWage,
        contractYears,
        squadRole,
        releaseClause,
        agentFee,
      },
      status: 'PENDING',
      timestamp: 'Today',
    };

    // 1. Evaluate Bidding War trigger if public approach
    if (transferApproachType === 'PUBLIC' && Math.random() < 0.85) {
      const rival = generateRivalBiddingWar(
        { name: target.name, marketValue: target.baseFee * 1_000_000, weeklyWage: target.weeklyWage },
        baseFee
      );
      setRivalBidDetails(rival);
      setNegotiationStatus('BIDDING_WAR');

      addRumor({
        id: `rumor_war_${Date.now()}`,
        headline: `GAZUMP WARNING: ${rival.clubName} enter bidding war for ${target.name} with $${(rival.transferFeeOffered / 1e6).toFixed(1)}M counter-bid!`,
        source: 'David Ornstein',
        credibilityTier: 1,
        targetPlayerName: target.name,
        buyerClubName: rival.clubName,
        timestamp: 'Just now',
      });
      return;
    }

    // 2. Evaluate club offer
    const clubResult = evaluateClubOffer(
      sellingClub,
      target.baseFee * 1_000_000,
      offer,
      transferApproachType === 'PUBLIC' ? currentRelations - 35 : currentRelations
    );

    if (clubResult.accepted) {
      // Evaluate player personal terms
      const contractResult = evaluateContractOffer(
        target.weeklyWage,
        target.exactOvr || 85,
        offer.contractOffer
      );

      if (contractResult.accepted) {
        setNegotiationStatus('ACCEPTED');
      } else {
        setCounterDetails({
          fee: baseFee,
          sellOn: sellOnPct,
          note: `Personal Terms Rejected: ${contractResult.rejectionReason}`,
        });
        setNegotiationStatus('COUNTERED');
      }
    } else if (clubResult.counterFee) {
      setCounterDetails({
        fee: clubResult.counterFee,
        sellOn: clubResult.counterSellOnPct || sellOnPct,
        note: clubResult.rejectionReason || 'Club counter-proposal submitted.',
      });
      setNegotiationStatus('COUNTERED');
    } else {
      setCounterDetails({
        fee: 0,
        sellOn: 0,
        note: clubResult.rejectionReason || 'Offer rejected outright.',
      });
      setNegotiationStatus('REJECTED');
    }
  };

  const handleFinalizeSigning = () => {
    executeTransferSigning(target.id, {
      baseFee,
      weeklyWage,
      contractYears,
      squadRole,
      releaseClause,
    });
    setIsTransferModalOpen(false);
  };

  const handleAcceptCounter = () => {
    if (counterDetails?.fee) {
      setBaseFee(counterDetails.fee);
      setSellOnPct(counterDetails.sellOn as any);
      setNegotiationStatus('ACCEPTED');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="bg-zinc-950 border border-zinc-800 shadow-2xl rounded-xl max-w-2xl w-full p-5 relative max-h-[92vh] overflow-y-auto space-y-4 text-zinc-200">
        
        {/* Header Ribbon */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
          <div className="flex items-center gap-3">
            <SafePlayerPhoto name={target.name} src={target.photoUrl} className="w-10 h-10 rounded-full text-xs shrink-0" />
            <div>
              <h3 className="text-base font-semibold text-zinc-100 tracking-tight">
                Transfer Deal Sheet: {target.name}
              </h3>
              <p className="text-[11px] font-mono text-zinc-500">
                {target.clubName} • {transferApproachType === 'PUBLIC' ? 'Public Press Tap-Up' : 'Private Channel'} • Market: ${(target.baseFee).toFixed(1)}M
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsTransferModalOpen(false)}
            className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 rounded hover:bg-zinc-900 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* DIALOG RESULT OVERLAYS */}
        {negotiationStatus === 'ACCEPTED' && (
          <div className="p-4 rounded-lg bg-emerald-950/40 border border-emerald-500/40 space-y-3 animate-in zoom-in-95">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
              <CheckCircle2 className="w-5 h-5" />
              <span>OFFER ACCEPTED BY CLUB & PLAYER</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              {target.clubName} and {target.name}'s representative have officially agreed to all club valuation and personal contract terms.
            </p>
            <div className="grid grid-cols-3 gap-2 text-xs font-mono bg-zinc-900/60 p-2.5 rounded border border-zinc-800">
              <div>
                <span className="text-[10px] text-zinc-500 block uppercase">Guaranteed Fee</span>
                <span className="text-emerald-400 font-semibold">${(baseFee / 1e6).toFixed(1)}M</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 block uppercase">Weekly Wage</span>
                <span className="text-zinc-200">${Math.round(weeklyWage / 1000)}k/wk</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 block uppercase">Contract</span>
                <span className="text-zinc-200">{contractYears} Years</span>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={handleFinalizeSigning}
                className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Finalize Signing & Register Player</span>
              </button>
            </div>
          </div>
        )}

        {negotiationStatus === 'COUNTERED' && (
          <div className="p-4 rounded-lg bg-amber-950/40 border border-amber-500/40 space-y-3 animate-in zoom-in-95">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
              <Scale className="w-5 h-5" />
              <span>OFFICIAL COUNTER-PROPOSAL RECEIVED</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              {counterDetails?.note}
            </p>
            {counterDetails?.fee ? (
              <div className="flex items-center justify-between text-xs font-mono bg-zinc-900/60 p-2.5 rounded border border-zinc-800">
                <span>Demanded Fee: <strong className="text-amber-400">${(counterDetails.fee / 1e6).toFixed(1)}M</strong></span>
                <span>Demanded Sell-On: <strong className="text-amber-400">{counterDetails.sellOn}%</strong></span>
              </div>
            ) : null}
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setNegotiationStatus('EDITING')}
                className="btn-secondary text-xs"
              >
                Restructure Offer
              </button>
              {counterDetails?.fee ? (
                <button
                  onClick={handleAcceptCounter}
                  className="btn-primary text-xs"
                >
                  Accept Counter & Finalize
                </button>
              ) : null}
            </div>
          </div>
        )}

        {negotiationStatus === 'REJECTED' && (
          <div className="p-4 rounded-lg bg-rose-950/40 border border-rose-500/40 space-y-3 animate-in zoom-in-95">
            <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm">
              <AlertCircle className="w-5 h-5" />
              <span>OFFER REJECTED OUTRIGHT</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              {counterDetails?.note}
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setNegotiationStatus('EDITING')}
                className="btn-secondary text-xs"
              >
                Return to Deal Sheet
              </button>
            </div>
          </div>
        )}

        {negotiationStatus === 'BIDDING_WAR' && rivalBidDetails && (
          <div className="p-4 rounded-lg bg-purple-950/40 border border-purple-500/40 space-y-3 animate-in zoom-in-95">
            <div className="flex items-center gap-2 text-purple-400 font-semibold text-sm">
              <Swords className="w-5 h-5" />
              <span>RIVAL BIDDING WAR ESCALATION!</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Following your public approach, <strong>{rivalBidDetails.clubName}</strong> have officially submitted an improved package:
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-zinc-900/60 p-2.5 rounded border border-zinc-800">
              <div>
                <span className="text-[10px] text-zinc-500 block uppercase">Rival Fee Offered</span>
                <span className="text-purple-300 font-semibold">${(rivalBidDetails.transferFeeOffered / 1e6).toFixed(1)}M</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 block uppercase">Rival Wage Package</span>
                <span className="text-purple-300 font-semibold">${Math.round(rivalBidDetails.wageOfferWeekly / 1000)}k/wk</span>
              </div>
            </div>
            <p className="text-[11px] text-zinc-400 font-mono">
              You must outbid their wage offer or match the fee to win the player's preference.
            </p>
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => {
                  setBaseFee(rivalBidDetails.transferFeeOffered + 2_000_000);
                  setWeeklyWage(rivalBidDetails.wageOfferWeekly + 25_000);
                  setNegotiationStatus('EDITING');
                }}
                className="btn-primary text-xs"
              >
                Match & Outbid Rival
              </button>
            </div>
          </div>
        )}

        {/* MAIN EDITABLE DEAL SHEET FORM */}
        {negotiationStatus === 'EDITING' && (
          <form onSubmit={handleSubmitFormalBid} className="space-y-4">
            
            {/* Section 1: Club-to-Club Financials */}
            <div className="p-3.5 rounded-lg bg-zinc-900/40 border border-zinc-800/80 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-zinc-400 border-b border-zinc-800 pb-1.5">
                <span className="uppercase text-zinc-300 font-semibold">1. Club-to-Club Fee & Structure</span>
                <span>Budget Available: ${(userFinances.transferBudget / 1e6).toFixed(1)}M</span>
              </div>

              {/* Base Fee Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-zinc-400">Guaranteed Base Fee:</span>
                  <span className="text-emerald-400 font-bold text-sm tabular-nums">
                    ${(baseFee / 1e6).toFixed(1)}M
                  </span>
                </div>
                <input
                  type="range"
                  min={10_000_000}
                  max={Math.max(baseFee, userFinances.transferBudget)}
                  step={1_000_000}
                  value={baseFee}
                  onChange={e => setBaseFee(Number(e.target.value))}
                  className="w-full accent-emerald-400 h-1 bg-zinc-800 rounded appearance-none cursor-pointer"
                />
              </div>

              {/* Payment Installments */}
              <div className="space-y-1">
                <label className="block text-[11px] font-mono text-zinc-400">Payment Installments</label>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map(inst => (
                    <button
                      key={inst}
                      type="button"
                      onClick={() => setInstallments(inst as any)}
                      className={`px-2 py-1.5 rounded text-xs font-mono border text-center transition-all cursor-pointer ${
                        installments === inst
                          ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300 font-medium'
                          : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {inst === 1 ? '100% Upfront' : `${inst} Annual Tranches`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Performance Add-ons */}
              <div className="space-y-1.5 pt-1">
                <label className="block text-[11px] font-mono text-zinc-400">Performance Milestones</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] font-mono">
                  <label className="flex items-center gap-2 p-2 rounded bg-zinc-900/60 border border-zinc-800/80 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={addons.appearances30}
                      onChange={e => setAddons(prev => ({ ...prev, appearances30: e.target.checked }))}
                      className="rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-0"
                    />
                    <span>30 Matches (+$5M)</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded bg-zinc-900/60 border border-zinc-800/80 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={addons.uclQualification}
                      onChange={e => setAddons(prev => ({ ...prev, uclQualification: e.target.checked }))}
                      className="rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-0"
                    />
                    <span>UCL Qual (+$7.5M)</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded bg-zinc-900/60 border border-zinc-800/80 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={addons.leagueTitle}
                      onChange={e => setAddons(prev => ({ ...prev, leagueTitle: e.target.checked }))}
                      className="rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-0"
                    />
                    <span>Title Win (+$10M)</span>
                  </label>
                </div>
              </div>

              {/* Sell-On Clause */}
              <div className="space-y-1">
                <label className="block text-[11px] font-mono text-zinc-400">Sell-On Clause Percentage</label>
                <div className="grid grid-cols-4 gap-2">
                  {[0, 10, 15, 20].map(pct => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setSellOnPct(pct as any)}
                      className={`px-2 py-1.5 rounded text-xs font-mono border text-center transition-all cursor-pointer ${
                        sellOnPct === pct
                          ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300 font-medium'
                          : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Section 2: Player Contract & Agent Demands */}
            <div className="p-3.5 rounded-lg bg-zinc-900/40 border border-zinc-800/80 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-zinc-400 border-b border-zinc-800 pb-1.5">
                <span className="uppercase text-zinc-300 font-semibold">2. Contract Terms & Wages</span>
                <span>Wage Room: ${(userFinances.wageBudgetWeekly / 1e6).toFixed(2)}M/wk</span>
              </div>

              {/* Wage Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-zinc-400">Weekly Wage:</span>
                  <span className="text-emerald-400 font-bold tabular-nums">
                    ${Math.round(weeklyWage / 1000)}k/wk
                  </span>
                </div>
                <input
                  type="range"
                  min={50_000}
                  max={Math.min(600_000, userFinances.wageBudgetWeekly)}
                  step={10_000}
                  value={weeklyWage}
                  onChange={e => setWeeklyWage(Number(e.target.value))}
                  className="w-full accent-emerald-400 h-1 bg-zinc-800 rounded appearance-none cursor-pointer"
                />
              </div>

              {/* Squad Role & Contract Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 mb-1">Squad Role Promise</label>
                  <select
                    value={squadRole}
                    onChange={e => setSquadRole(e.target.value as any)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none"
                  >
                    <option value="STAR">STAR PLAYER</option>
                    <option value="IMPORTANT">IMPORTANT STARTER</option>
                    <option value="ROTATION">ROTATION</option>
                    <option value="PROSPECT">PROSPECT</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 mb-1">Duration</label>
                  <select
                    value={contractYears}
                    onChange={e => setContractYears(Number(e.target.value) as any)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none"
                  >
                    <option value={2}>2 Years (until 2028)</option>
                    <option value={3}>3 Years (until 2029)</option>
                    <option value={4}>4 Years (until 2030)</option>
                    <option value={5}>5 Years (until 2031)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Summary & Submission */}
            <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/80 grid grid-cols-3 gap-2 text-xs font-mono">
              <div>
                <span className="text-[10px] text-zinc-500 block uppercase">Total Package</span>
                <span className="text-zinc-200 font-semibold">${(totalPackageFee / 1e6).toFixed(1)}M</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 block uppercase">Initial Cash Outflow</span>
                <span className="text-emerald-400 font-semibold">${(upfrontCashDeduction / 1e6).toFixed(1)}M</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 block uppercase">Annual Amortization</span>
                <span className="text-zinc-300 font-semibold">${(annualAmortization / 1e6).toFixed(1)}M/yr</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setIsTransferModalOpen(false)}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isAffordable}
                className="btn-primary text-xs disabled:opacity-40"
              >
                Submit Formal Bid
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
