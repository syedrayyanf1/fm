import { Club, Player } from '../types/game';
import { FfpAuditReport } from '../types/season';

export interface FfpAuditResult {
  report: FfpAuditReport;
  updatedClub: Club;
  rumorHeadline?: string;
}

export function auditClubFfp(
  club: Club,
  players: Record<string, Player>,
  seasonYear: string
): FfpAuditResult {
  // 1. Gather all players belonging to this club
  const clubPlayers = Object.values(players).filter(p => p.clubId === club.id);

  // 2. Annual Gross Wages = sum(wagePerWeek * 52)
  const annualGrossWages = clubPlayers.reduce((acc, p) => acc + (p.wagePerWeek * 52), 0);

  // 3. Annual Amortization = sum(amortizationAnnualCost)
  const annualAmortization = clubPlayers.reduce((acc, p) => acc + (p.amortizationAnnualCost || 0), 0);

  const totalSquadCost = annualGrossWages + annualAmortization;

  // 4. Operating Revenue (accounting for economic levers drag)
  let baseRevenue = club.finances.annualOperatingRevenue || 650000000;
  const leverPercentage = club.finances.economicLeversSoldPercentage || 0;
  if (leverPercentage > 0) {
    baseRevenue = Math.round(baseRevenue * (1 - (leverPercentage / 100)));
  }

  // 5. Final 70% Squad Cost Ratio
  const rawRatio = totalSquadCost / Math.max(1, baseRevenue);
  const squadCostRatio = Number(rawRatio.toFixed(3));

  let status: FfpAuditReport['status'] = 'COMPLIANT';
  let penaltyDetail = 'Compliant with UEFA Financial Sustainability 70% Squad Cost Regulations.';
  let pointsDeduction = 0;
  let budgetFrozen = false;
  let boardTrustDelta = 0;
  let rumorHeadline: string | undefined;

  const updatedClub: Club = {
    ...club,
    finances: {
      ...club.finances,
      squadCostRatio,
      annualOperatingRevenue: baseRevenue,
    },
  };

  if (squadCostRatio <= 0.70) {
    // Compliant: Board satisfaction +10%
    status = 'COMPLIANT';
    boardTrustDelta = 10;
    penaltyDetail = `Audited ratio of ${(squadCostRatio * 100).toFixed(1)}% is fully compliant with the 70% statutory limit. Board trust increased by +10%.`;
  } else if (squadCostRatio <= 0.80) {
    // Stage 1 Breach: Transfer budget locked to 0 for the summer window
    status = 'WARNING';
    budgetFrozen = true;
    boardTrustDelta = -10;
    updatedClub.finances.transferBudget = 0;
    penaltyDetail = `WARNING (Stage 1 Breach): Audited ratio of ${(squadCostRatio * 100).toFixed(1)}% exceeds the 70% limit. Transfer budget frozen to $0 for upcoming window.`;
  } else {
    // Stage 2 Severe Breach: 6-point deduction sanction for next season
    status = 'DEDUCTION';
    budgetFrozen = true;
    pointsDeduction = 6;
    boardTrustDelta = -25;
    updatedClub.finances.transferBudget = 0;
    penaltyDetail = `CRITICAL SANCTION (Stage 2 Breach): Audited ratio of ${(squadCostRatio * 100).toFixed(1)}% heavily violates FFP. 6-point league table deduction imposed for next season.`;
    rumorHeadline = `[Tier 1] FFP audit confirms 6-point deduction sanction for ${club.shortName} next season.`;
  }

  updatedClub.boardTrust = Math.max(0, Math.min(100, (club.boardTrust ?? 75) + boardTrustDelta));

  const report: FfpAuditReport = {
    seasonYear,
    squadCostRatio,
    totalSquadCost,
    annualRevenue: baseRevenue,
    status,
    penaltyDetail,
    pointsDeduction,
    budgetFrozen,
  };

  return {
    report,
    updatedClub,
    rumorHeadline,
  };
}
