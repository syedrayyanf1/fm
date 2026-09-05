import { Club } from '../types/game';
import { TransferOffer, PlayerContractOffer } from '../types/transfer';

export interface ClubEvaluationResult {
  accepted: boolean;
  counterFee?: number;
  counterSellOnPct?: number;
  rejectionReason?: string;
  relationsPenalty?: number;
}

export interface ContractEvaluationResult {
  accepted: boolean;
  rejectionReason?: string;
  demandedWage?: number;
  strikesRemaining: number;
}

/**
 * Evaluates a club-to-club transfer proposal.
 * Considers base fee, structured installments, discounted add-on milestone probability,
 * future sell-on equity, and inter-club relations (spite tax vs discount).
 */
export function evaluateClubOffer(
  sellerClub: Club | undefined,
  targetMarketValue: number,
  offer: TransferOffer,
  currentRelations = 0
): ClubEvaluationResult {
  let valuation = targetMarketValue;

  // Inter-club relations modifier:
  // If relations < -20: +25% Spite Tax
  // If relations > +20: -5% Courtesy Discount
  if (currentRelations < -20) {
    valuation *= 1.25;
  } else if (currentRelations > 20) {
    valuation *= 0.95;
  }

  // Calculate total package value:
  // Addons discounted to 60% probability
  let addonsTotal = 0;
  if (offer.addons.appearances30) addonsTotal += offer.addons.appearancesAmount;
  if (offer.addons.uclQualification) addonsTotal += offer.addons.uclAmount;
  if (offer.addons.leagueTitle) addonsTotal += offer.addons.leagueTitleAmount;

  // Installment penalty: If paid over 3 years, slightly discounted present value (-4%)
  const installmentDiscount = offer.installments === 3 ? 0.96 : offer.installments === 2 ? 0.98 : 1.0;

  const totalValue =
    offer.baseFee * installmentDiscount +
    addonsTotal * 0.60 +
    (offer.sellOnPct / 100) * 0.20 * targetMarketValue;

  // Accept threshold: >= 102% of adjusted valuation
  if (totalValue >= valuation * 1.02) {
    return { accepted: true };
  }

  // Counter threshold: >= 82% of adjusted valuation
  if (totalValue >= valuation * 0.82) {
    const suggestedCounter = Math.round(valuation * 1.08);
    const suggestedSellOn = Math.max(offer.sellOnPct, 15);
    return {
      accepted: false,
      counterFee: suggestedCounter,
      counterSellOnPct: suggestedSellOn,
      rejectionReason: `We require a guaranteed base fee of $${(suggestedCounter / 1e6).toFixed(1)}M plus a ${suggestedSellOn}% sell-on clause to sanction this departure.`,
    };
  }

  // Below 82%: Insulting lowball offer
  return {
    accepted: false,
    rejectionReason: 'Your proposal is insulting and falls far beneath our valuation. We are terminating discussions.',
    relationsPenalty: -5,
  };
}

/**
 * Evaluates the player's personal contract terms and agent demands.
 */
export function evaluateContractOffer(
  currentWeeklyWage: number,
  playerReputation: number,
  contractOffer: PlayerContractOffer,
  currentStrikes = 3
): ContractEvaluationResult {
  // Expected wage: scaled by reputation and current earnings
  const expectedWage = Math.round(Math.max(currentWeeklyWage * 1.15, (playerReputation / 90) * 200_000));

  // Role expectations
  if (playerReputation >= 88 && (contractOffer.squadRole === 'ROTATION' || contractOffer.squadRole === 'PROSPECT')) {
    return {
      accepted: false,
      rejectionReason: 'An elite player of this stature will not accept a squad rotation role.',
      demandedWage: expectedWage,
      strikesRemaining: Math.max(0, currentStrikes - 1),
    };
  }

  // Wage checks
  if (contractOffer.weeklyWage < expectedWage * 0.85) {
    return {
      accepted: false,
      rejectionReason: `Wage offer is below market expectations. We demand at least $${Math.round(expectedWage / 1000)}k/week.`,
      demandedWage: expectedWage,
      strikesRemaining: Math.max(0, currentStrikes - 1),
    };
  }

  // Agreement
  return {
    accepted: true,
    strikesRemaining: currentStrikes,
  };
}
