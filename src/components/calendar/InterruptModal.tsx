import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import {
  AlertTriangle,
  Flame,
  Swords,
  DollarSign,
  HeartPulse,
  Clock,
  ArrowRight,
  X,
  Play,
  Sparkles,
  Award,
  Check,
  FastForward,
  Square,
} from 'lucide-react';
import { SimInterruptReason } from '../../types/game';

export default function InterruptModal() {
  const interruptData = useGameStore(state => state.interruptData);
  const clearInterrupt = useGameStore(state => state.clearInterrupt);
  const dismissInterruptAndResume = useGameStore(state => state.dismissInterruptAndResume);
  const dismissInterruptAndStop = useGameStore(state => state.dismissInterruptAndStop);
  const launchMatchModal = useGameStore(state => state.launchMatchModal);
  const setActiveTab = useGameStore(state => state.setActiveTab);
  const setSelectedPlayerId = useGameStore(state => state.setSelectedPlayerId);
  const originalSimTargetDate = useGameStore(state => state.originalSimTargetDate);

  if (!interruptData) return null;

  const {
    reason,
    detail,
    currentDate,
    relatedFixtureId,
    relatedPlayerId,
    relatedBidAmount,
    relatedClubName,
  } = interruptData;

  const getReasonConfig = (r: SimInterruptReason) => {
    switch (r) {
      case 'MATCHDAY':
        return {
          title: 'MATCHDAY REACHED',
          badge: 'FIXTURE TODAY',
          badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          icon: <Swords className="w-5 h-5 text-emerald-400" />,
          primaryCta: 'Enter Matchday Command Center',
          action: () => {
            clearInterrupt();
            launchMatchModal(relatedFixtureId);
          },
        };
      case 'TRANSFER_BID':
        return {
          title: 'OFFICIAL TRANSFER BID RECEIVED',
          badge: 'INCOMING BID',
          badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          icon: <DollarSign className="w-5 h-5 text-amber-400" />,
          primaryCta: 'View Transfer Offer & Negotiate',
          action: () => {
            clearInterrupt();
            setActiveTab('transfers');
          },
        };
      case 'MAJOR_INJURY':
        return {
          title: 'FIRST-TEAM STARTER INJURY',
          badge: 'MEDICAL ALERT',
          badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
          icon: <HeartPulse className="w-5 h-5 text-rose-400" />,
          primaryCta: 'Open Medical Room & Squad',
          action: () => {
            clearInterrupt();
            if (relatedPlayerId) setSelectedPlayerId(relatedPlayerId);
            setActiveTab('squad');
          },
        };
      case 'PLAYER_MUTINY':
        return {
          title: 'SQUAD UNREST / PLAYER MUTINY',
          badge: 'MUTINY STAGE',
          badgeColor: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
          icon: <Flame className="w-5 h-5 text-orange-400" />,
          primaryCta: 'Confront Player & Resolve Unrest',
          action: () => {
            clearInterrupt();
            const players = useGameStore.getState().players;
            if (relatedPlayerId && players[relatedPlayerId]) {
              const p = players[relatedPlayerId];
              useGameStore.getState().triggerMutinyAlert({
                playerId: p.id,
                playerName: p.name,
                buyerClubName: 'Manchester City',
                bidAmount: Math.round(p.marketValue * 1.15),
                wageOfferWeekly: Math.round(p.wagePerWeek * 1.8),
                stage: (p.unsettledStage || 1) as any,
                headline: 'PLAYER CONFRONTATION: CAREER PATH BLOCKED',
                quote: `Boss, Manchester City offered to double my wages and guarantee continental football. Why are you blocking my career?`,
              });
            } else {
              setActiveTab('squad');
            }
          },
        };
      case 'DEADLINE_DAY':
        return {
          title: 'TRANSFER DEADLINE DAY',
          badge: 'WINDOW CLOSING',
          badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          icon: <Clock className="w-5 h-5 text-amber-400" />,
          primaryCta: 'Go to Transfer Desk',
          action: () => {
            clearInterrupt();
            setActiveTab('transfers');
          },
        };
      case 'YOUTH_INTAKE':
        return {
          title: 'ANNUAL YOUTH ACADEMY INTAKE',
          badge: 'TRIAL SHOWCASE',
          badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          icon: <Sparkles className="w-5 h-5 text-emerald-400" />,
          primaryCta: 'Inspect Youth Trial Class & Signings',
          action: () => {
            clearInterrupt();
            useGameStore.getState().openYouthIntakeModal();
          },
        };
      case 'AWARDS_GALA':
        return {
          title: 'WORLD FOOTBALL AWARDS GALA',
          badge: 'BALLON D\'OR',
          badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          icon: <Award className="w-5 h-5 text-amber-400" />,
          primaryCta: 'Attend Gala Presentation',
          action: () => {
            clearInterrupt();
            useGameStore.getState().openAwardsGalaModal();
          },
        };
      case 'SEASON_END':
        return {
          title: 'CAMPAIGN COMPLETED & FFP AUDIT',
          badge: 'SEASON ROLLOVER',
          badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
          icon: <Check className="w-5 h-5 text-cyan-400" />,
          primaryCta: 'Open Concluding Season Dossier',
          action: () => {
            clearInterrupt();
            useGameStore.getState().openSeasonSummaryModal();
          },
        };
      case 'BOARD_SACKED':
        return {
          title: 'MANAGERIAL CONTRACT TERMINATED',
          badge: 'SACKED BY BOARD',
          badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
          icon: <AlertTriangle className="w-5 h-5 text-rose-400" />,
          primaryCta: 'Acknowledge Termination & View Vacancies',
          action: () => {
            clearInterrupt();
            useGameStore.getState().handleBoardSacking();
          },
        };
      case 'TARGET_REACHED':
      default: {
        const nextFix = useGameStore.getState().getNextFixture();
        const hasMatchToday = nextFix && nextFix.date === currentDate;
        if (hasMatchToday) {
          return {
            title: 'MATCHDAY REACHED',
            badge: 'FIXTURE TODAY',
            badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
            icon: <Swords className="w-5 h-5 text-emerald-400" />,
            primaryCta: 'Enter Matchday Command Center',
            action: () => {
              clearInterrupt();
              launchMatchModal(nextFix.id);
            },
          };
        }
        return {
          title: 'CALENDAR ARRIVAL',
          badge: 'SCHEDULED ARRIVAL',
          badgeColor: 'bg-zinc-700/20 text-zinc-300 border-zinc-700/40',
          icon: <Clock className="w-5 h-5 text-zinc-400" />,
          primaryCta: 'Review Calendar',
          action: () => {
            clearInterrupt();
            setActiveTab('calendar');
          },
        };
      }
    }
  };

  const config = getReasonConfig(reason);

  // Hard events that must be acknowledged — no "continue simulating" option
  const isHardEvent = ['SEASON_END', 'YOUTH_INTAKE', 'AWARDS_GALA', 'BOARD_SACKED'].includes(reason);
  // Whether we have a valid simulation target to resume toward
  const canResume = !isHardEvent && !!originalSimTargetDate && reason !== 'MATCHDAY';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in zoom-in-95 duration-150">
      <div className="bg-zinc-950 border border-zinc-800 shadow-2xl rounded-xl max-w-lg w-full p-6 relative space-y-5 text-zinc-200">
        
        {/* Top Tag & Close */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider border font-medium ${config.badgeColor}`}>
              {config.badge}
            </span>
            <span className="text-zinc-600 font-mono">•</span>
            <span className="text-[11px] font-mono text-zinc-400">
              {currentDate}
            </span>
          </div>

          <button
            onClick={clearInterrupt}
            className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 rounded hover:bg-zinc-900 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Title & Icon Header */}
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
            {config.icon}
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-zinc-100 tracking-tight leading-snug">
              {config.title}
            </h3>
            <p className="text-xs text-zinc-300 leading-relaxed font-sans">
              {detail}
            </p>
          </div>
        </div>

        {/* Highlight Stats Card if Applicable */}
        {relatedBidAmount && relatedClubName && (
          <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-lg p-3 grid grid-cols-2 gap-2 text-xs font-mono">
            <div>
              <span className="text-[10px] text-zinc-500 block uppercase">Bidding Club</span>
              <span className="text-zinc-100 font-medium">{relatedClubName}</span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 block uppercase">Offer Value</span>
              <span className="text-amber-400 font-semibold tabular-nums">
                ${(relatedBidAmount / 1e6).toFixed(1)}M
              </span>
            </div>
          </div>
        )}

        {/* Action CTAs */}
        <div className="space-y-2 pt-2 border-t border-zinc-800/80">
          {/* Primary action row */}
          <div className="flex items-center justify-end gap-2">
            {/* For MATCHDAY: Stop Here + Enter Match */}
            {reason === 'MATCHDAY' && (
              <>
                <button
                  onClick={dismissInterruptAndStop}
                  className="px-3 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-400 hover:text-zinc-200 transition-colors font-mono cursor-pointer flex items-center gap-1.5"
                >
                  <Square className="w-3 h-3" />
                  <span>Stop & View</span>
                </button>
                <button
                  onClick={config.action}
                  className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{config.primaryCta}</span>
                </button>
              </>
            )}

            {/* For hard events: single acknowledge button */}
            {isHardEvent && reason !== 'MATCHDAY' && (
              <button
                onClick={config.action}
                className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>{config.primaryCta}</span>
              </button>
            )}

            {/* For dismissable events (bids, injuries, deadline day): two-button layout */}
            {!isHardEvent && reason !== 'MATCHDAY' && (
              <>
                {canResume && (
                  <button
                    onClick={dismissInterruptAndResume}
                    className="px-3 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-400 hover:text-zinc-200 transition-colors font-mono cursor-pointer flex items-center gap-1.5"
                  >
                    <FastForward className="w-3 h-3 text-emerald-500" />
                    <span className="text-emerald-400">Continue Simulating</span>
                  </button>
                )}
                <button
                  onClick={() => { dismissInterruptAndStop(); config.action(); }}
                  className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>{config.primaryCta}</span>
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
