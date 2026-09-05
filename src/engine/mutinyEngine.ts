import { Player, RumorWireItem } from '../types/game';
import { MutinyStage, MutinyConfrontation } from '../types/transfer';

export interface MutinyResolutionResult {
  updatedPlayer: Player;
  rumorCreated?: RumorWireItem;
  toastMessage: { title: string; detail: string; type: 'success' | 'error' | 'normal' };
}

/**
 * Creates the initial Stage 1 confrontation dialog when an elite bid is rejected.
 */
export function createMutinyConfrontation(
  player: Player,
  buyerClubName: string,
  bidAmount: number
): MutinyConfrontation {
  return {
    playerId: player.id,
    playerName: player.name,
    buyerClubName,
    bidAmount,
    wageOfferWeekly: Math.round(player.wagePerWeek * 1.8),
    stage: 1,
    headline: 'PLAYER CONFRONTATION: CAREER PATH BLOCKED',
    quote: `Boss, ${buyerClubName} have put forward a massive offer and guaranteed me European football. Why are you standing in the way of my career development?`,
  };
}

/**
 * Resolves player decision at Stage 1:
 * - 'PROMISE': Manager promises to sell if a fair valuation is matched -> avoids immediate escalation.
 * - 'REFUSE': Demands professionalism -> Player immediately escalates to Stage 2 (Transfer Request & Media Leak).
 */
export function resolveStage1Decision(
  player: Player,
  decision: 'PROMISE' | 'REFUSE',
  buyerClubName: string
): MutinyResolutionResult {
  if (decision === 'PROMISE') {
    return {
      updatedPlayer: {
        ...player,
        unsettledStage: 1,
        morale: Math.max(30, player.morale - 20),
      },
      toastMessage: {
        title: 'Pact Agreed',
        detail: `You promised ${player.name} he can depart if valuation is met. Morale remains fragile.`,
        type: 'normal',
      },
    };
  }

  // Refuse -> escalate to Stage 2
  const rumor: RumorWireItem = {
    id: `rumor_mutiny_${Date.now()}`,
    headline: `BREAKING: ${player.name} formally tenders transfer request after heated manager confrontation.`,
    source: 'The Athletic',
    credibilityTier: 2,
    targetPlayerName: player.name,
    buyerClubName,
    timestamp: 'Just now',
  };

  return {
    updatedPlayer: {
      ...player,
      unsettledStage: 2,
      morale: 15,
    },
    rumorCreated: rumor,
    toastMessage: {
      title: 'Transfer Request Submitted',
      detail: `${player.name} has leaked frustration to the press and formally submitted a transfer request.`,
      type: 'error',
    },
  };
}

/**
 * Escalates an unsettled player to Stage 3: Full Strike.
 * Sharpness set to 0, locked from matchday team selection.
 */
export function escalateToFullStrike(player: Player): MutinyResolutionResult {
  const rumor: RumorWireItem = {
    id: `rumor_strike_${Date.now()}`,
    headline: `TOXICITY IN SQUAD: ${player.name} goes on full strike, refusing to train or travel with the first team.`,
    source: 'Sport Diario',
    credibilityTier: 2,
    targetPlayerName: player.name,
    buyerClubName: 'Open Market',
    timestamp: '1h ago',
  };

  return {
    updatedPlayer: {
      ...player,
      unsettledStage: 3,
      sharpness: 0,
      isOnStrike: true,
      morale: 5,
    },
    rumorCreated: rumor,
    toastMessage: {
      title: 'PLAYER ON FULL STRIKE',
      detail: `${player.name} is refusing to report to training. Locked from matchday selection.`,
      type: 'error',
    },
  };
}

/**
 * Resolves Stage 3 Strike:
 * - 'SELL_DISCOUNT': Puts player on transfer list at 15% discount to purge toxicity.
 * - 'FREEZE_OUT': Banishes player to reserves (depreciates value, removes strike lock but morale stays 10).
 */
export function resolveStrikeAction(
  player: Player,
  action: 'SELL_DISCOUNT' | 'FREEZE_OUT'
): MutinyResolutionResult {
  if (action === 'SELL_DISCOUNT') {
    const discountedValue = Math.round(player.marketValue * 0.85);
    return {
      updatedPlayer: {
        ...player,
        marketValue: discountedValue,
        unsettledStage: 3,
        isOnStrike: true,
      },
      toastMessage: {
        title: 'Transfer Listed at 15% Discount',
        detail: `${player.name} market value reduced to $${(discountedValue / 1e6).toFixed(1)}M to attract rapid buyers.`,
        type: 'normal',
      },
    };
  }

  // Freeze out in reserves
  return {
    updatedPlayer: {
      ...player,
      isOnStrike: true,
      sharpness: 20,
      morale: 10,
    },
    toastMessage: {
      title: 'Player Banished to Reserves',
      detail: `${player.name} has been frozen out of first-team facilities.`,
      type: 'error',
    },
  };
}
