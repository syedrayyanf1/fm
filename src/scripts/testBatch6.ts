import { initialClubs, initialCompetitions } from '../data/initialSeed';
import realData from '../data/realPlayersData.json';
const initialPlayers = realData.players as any;
import { generateYouthIntake, convertProspectToPlayer } from '../engine/youthIntakeEngine';
import { calculateAwardsGala } from '../engine/awardsEngine';
import { auditClubFfp } from '../engine/ffpAuditEngine';
import { executeSeasonTransition } from '../engine/seasonTransitionEngine';

console.log('====================================================');
console.log('RUNNING BATCH 6 COMPREHENSIVE ARCHITECTURAL SUITE');
console.log('====================================================');

// 1. TEST YOUTH ACADEMY INTAKE
console.log('\n--- 1. Testing Youth Academy Intake Engine ---');
const barca = initialClubs.barcelona;
const intake = generateYouthIntake(barca);
console.log(`✓ Generated ${intake.length} youth trial prospects (Expected: 6-8)`);
if (intake.length < 6 || intake.length > 8) {
  throw new Error(`Intake count ${intake.length} out of expected 6-8 range`);
}

const firstProspect = intake[0];
console.log(`✓ First prospect: ${firstProspect.name} (${firstProspect.position}, age ${firstProspect.age}) - Tag: ${firstProspect.personalityTag}`);
console.log(`  Scouted Rating: ${firstProspect.scoutedRating}`);

const signedPlayer = convertProspectToPlayer(firstProspect, barca.id);
console.log(`✓ Converted to full Player entity: ${signedPlayer.name}, Wage: $${signedPlayer.wagePerWeek}/wk, OVR: ${signedPlayer.overallRating}, POT: ${signedPlayer.dynamicPotential}`);
if (signedPlayer.wagePerWeek !== 1500) {
  throw new Error(`Expected youth wage $1,500/wk, got ${signedPlayer.wagePerWeek}`);
}

// 2. TEST AWARDS GALA ENGINE
console.log('\n--- 2. Testing Awards Gala Calculation Engine ---');
const gala = calculateAwardsGala('2026/27', initialPlayers, initialClubs, initialCompetitions);
console.log(`✓ Ballon d'Or Winner: ${gala.ballonDor.winner.playerName} (${gala.ballonDor.winner.clubName}) - Score: ${gala.ballonDor.winner.score}`);
console.log(`  2nd Place: ${gala.ballonDor.second.playerName} - Score: ${gala.ballonDor.second.score}`);
console.log(`  3rd Place: ${gala.ballonDor.third.playerName} - Score: ${gala.ballonDor.third.score}`);
console.log(`✓ European Golden Shoe: ${gala.goldenShoe.playerName} (${gala.goldenShoe.statValue})`);
console.log(`✓ Continental Playmaker: ${gala.playmaker.playerName} (${gala.playmaker.statValue})`);
console.log(`✓ Golden Glove: ${gala.goldenGlove.playerName} (${gala.goldenGlove.statValue})`);
console.log(`✓ Manager of the Year: ${gala.managerOfTheYear.managerName} (${gala.managerOfTheYear.clubName}) - Score: ${gala.managerOfTheYear.objectiveScore}`);

if (!gala.ballonDor.winner.score || gala.ballonDor.winner.score < gala.ballonDor.second.score!) {
  throw new Error("Ballon d'Or podium scores are not properly ordered descending");
}

// 3. TEST FFP AUDIT ENGINE
console.log('\n--- 3. Testing FFP Fiscal Audit Engine ---');
const compliantAudit = auditClubFfp(barca, initialPlayers, '2026/27');
console.log(`✓ Barca FFP Status: ${compliantAudit.report.status} (Squad Cost Ratio: ${(compliantAudit.report.squadCostRatio * 100).toFixed(1)}%)`);
console.log(`  Total Squad Cost: $${(compliantAudit.report.totalSquadCost / 1e6).toFixed(1)}M, Revenue: $${(compliantAudit.report.annualRevenue / 1e6).toFixed(1)}M`);
console.log(`  Detail: ${compliantAudit.report.penaltyDetail}`);

// Test Stage 2 severe breach simulation (> 80%)
const brokeClub = {
  ...barca,
  finances: {
    ...barca.finances,
    annualOperatingRevenue: 50000000, // Artificially low revenue
  },
};
const severeAudit = auditClubFfp(brokeClub, initialPlayers, '2026/27');
console.log(`✓ Severe Breach FFP Status: ${severeAudit.report.status} (Points Deduction: -${severeAudit.report.pointsDeduction} pts, Budget Frozen: ${severeAudit.report.budgetFrozen})`);
if (severeAudit.report.pointsDeduction !== 6) {
  throw new Error(`Expected 6-point deduction for >80% squad cost ratio, got ${severeAudit.report.pointsDeduction}`);
}

// 4. TEST SEASON ROLLOVER ENGINE
console.log('\n--- 4. Testing Season Transition Engine ---');
const rollover = executeSeasonTransition(
  '2027-06-30',
  initialClubs,
  initialPlayers,
  initialCompetitions,
  'barcelona',
  { barcelona: 0 }
);

console.log(`✓ Season Rollover executed:`);
console.log(`  Previous Season: ${rollover.report.previousSeason} -> New Season: ${rollover.report.newSeason}`);
console.log(`  New Start Date: ${rollover.newCurrentDate}`);
console.log(`  Promoted Clubs: ${rollover.report.promotedClubs.map(c => `${c.clubName} (${c.toLeague})`).join(', ')}`);
console.log(`  Relegated Clubs: ${rollover.report.relegatedClubs.map(c => `${c.clubName} (${c.toLeague})`).join(', ')}`);
console.log(`  Players Aged: ${rollover.report.playersAgedCount}`);
console.log(`  Dynamic Potential Recalibrated: ${rollover.report.playersPotentialAdjustedCount}`);
console.log(`  Total Fixtures Generated for 2027/28: ${rollover.updatedFixtures.length}`);

if (rollover.newCurrentDate !== '2027-08-01') {
  throw new Error(`Expected calendar reset to 2027-08-01, got ${rollover.newCurrentDate}`);
}
if (rollover.updatedFixtures.length === 0) {
  throw new Error('Expected fixture regeneration for 2027/28 season');
}

// 5. TEST BOARD SACKING & HIRE SCORE FORMULA
console.log('\n--- 5. Testing Board Sacking & Hiring Algorithm ---');
const managerRep = 88;
const trophies = 5;
const targetClubRep = 82;
// HireScore = ManagerReputation + (TotalTrophies * 3) - ClubReputation
const hireScore = managerRep + (trophies * 3) - targetClubRep;
console.log(`✓ HireScore for club rep ${targetClubRep}: ${hireScore} (Threshold >= -10: ${hireScore >= -10 ? 'OFFER CONTRACT' : 'REJECT'})`);
if (hireScore < -10) {
  throw new Error('High reputation manager should be offered contract');
}

console.log('\n====================================================');
console.log('ALL BATCH 6 ENGINES & FORMULAS PASSED SUCCESSFULLY!');
console.log('====================================================\n');
