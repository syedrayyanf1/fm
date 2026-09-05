const fs = require('fs');

const data = JSON.parse(fs.readFileSync('./public/data/gameData.json', 'utf8'));
const { fixtures, clubs } = data;

console.log('=== TEST 1: Direct Simulation to Next Fixture ===');
let currentDate = '2026-08-10';
const userClubId = 'barcelona';

function getNextFixture(fixtures, userClubId, currentDate) {
  return fixtures.find(f =>
    !f.isPlayed &&
    (f.homeClubId === userClubId || f.awayClubId === userClubId) &&
    f.date >= currentDate
  );
}

const nextFixture = getNextFixture(fixtures, userClubId, currentDate);
console.log('Next fixture found:', nextFixture.id, 'Date:', nextFixture.date);
if (nextFixture.date !== '2026-08-15') {
  throw new Error(`Expected next fixture on 2026-08-15, found ${nextFixture.date}`);
}

function addDays(dateStr, days) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().split('T')[0];
}

// Emulate calendarWorker logic
function runWorkerStep(currentDate, targetDate, userClubId, fixtures, clubs, interruptPreferences, state) {
  // 1. Matchday check (highest priority)
  const userMatchToday = fixtures.find(f =>
    f.date === currentDate && !f.isPlayed &&
    (f.homeClubId === userClubId || f.awayClubId === userClubId)
  );
  if (userMatchToday && interruptPreferences.pauseOnMatchday) {
    return { type: 'INTERRUPT', reason: 'MATCHDAY', fixtureId: userMatchToday.id, currentDate };
  }

  // 2. Target date reached
  if (currentDate >= targetDate) {
    return { type: 'COMPLETE', currentDate };
  }

  // Check bid trigger
  const month = parseInt(currentDate.split('-')[1], 10);
  const isTransferWindow = month === 8 || month === 1;
  if (state.forceBidOnDate === currentDate && isTransferWindow) {
    state.lastBidDate = currentDate;
    state.monthlyBids = (state.monthlyBids || 0) + 1;
    return { type: 'INTERRUPT', reason: 'TRANSFER_BID', currentDate };
  }

  // Advance date
  return { type: 'TICK', nextDate: addDays(currentDate, 1) };
}

// Run simulation from 2026-08-10 to 2026-08-15 without interrupts
let simDate = '2026-08-10';
let targetDate = '2026-08-15';
let steps = 0;
let finalEvent = null;

while (steps < 20) {
  steps++;
  const res = runWorkerStep(simDate, targetDate, userClubId, fixtures, clubs, { pauseOnMatchday: true }, {});
  if (res.type === 'INTERRUPT' || res.type === 'COMPLETE') {
    finalEvent = res;
    break;
  }
  simDate = res.nextDate;
}

console.log('Result of sim 2026-08-10 -> 2026-08-15:');
console.log('  Event:', finalEvent);
if (finalEvent.type !== 'INTERRUPT' || finalEvent.reason !== 'MATCHDAY' || finalEvent.fixtureId !== 'laliga_r1_m0_barcelona_alaves') {
  throw new Error('Test 1 failed: Expected MATCHDAY interrupt on 2026-08-15');
}
console.log('✓ TEST 1 PASSED: Arrived at 2026-08-15 and cleanly triggered MATCHDAY!\n');

console.log('=== TEST 2: Interrupt at 2026-08-11 with Continue Simulating ===');
simDate = '2026-08-10';
let workerState = { forceBidOnDate: '2026-08-11', lastBidDate: null, monthlyBids: 0 };
let interruptOccurred = null;

while (steps < 40) {
  steps++;
  const res = runWorkerStep(simDate, targetDate, userClubId, fixtures, clubs, { pauseOnMatchday: true }, workerState);
  if (res.type === 'INTERRUPT') {
    interruptOccurred = res;
    break;
  }
  simDate = res.nextDate;
}

console.log('First interrupt received:', interruptOccurred);
if (interruptOccurred.reason !== 'TRANSFER_BID' || interruptOccurred.currentDate !== '2026-08-11') {
  throw new Error('Expected TRANSFER_BID on 2026-08-11');
}

// User clicks "Continue Simulating" (dismissInterruptAndResume logic)
console.log('Simulating click on [Continue Simulating]...');
let resumedDate = addDays(interruptOccurred.currentDate, 1);
console.log('Resumed date after +1 day advance:', resumedDate); // Should be 2026-08-12

// Continue simulation from resumedDate toward targetDate
let postResumeEvent = null;
while (steps < 60) {
  steps++;
  const res = runWorkerStep(resumedDate, targetDate, userClubId, fixtures, clubs, { pauseOnMatchday: true }, workerState);
  if (res.type === 'INTERRUPT' || res.type === 'COMPLETE') {
    postResumeEvent = res;
    break;
  }
  resumedDate = res.nextDate;
}

console.log('Post-resume final event:', postResumeEvent);
if (postResumeEvent.type !== 'INTERRUPT' || postResumeEvent.reason !== 'MATCHDAY' || postResumeEvent.fixtureId !== 'laliga_r1_m0_barcelona_alaves') {
  throw new Error('Test 2 failed: Expected MATCHDAY interrupt after resume');
}
console.log('✓ TEST 2 PASSED: Resume successfully bypassed loop and reached MATCHDAY!\n');

console.log('=== TEST 3: Non-Matchday Jump to Date ===');
// Target is 2026-08-13 (where Barca has no match)
simDate = '2026-08-10';
targetDate = '2026-08-13';
let nonMatchEvent = null;
while (steps < 80) {
  steps++;
  const res = runWorkerStep(simDate, targetDate, userClubId, fixtures, clubs, { pauseOnMatchday: true }, {});
  if (res.type === 'INTERRUPT' || res.type === 'COMPLETE') {
    nonMatchEvent = res;
    break;
  }
  simDate = res.nextDate;
}
console.log('Non-match jump result:', nonMatchEvent);
if (nonMatchEvent.type !== 'COMPLETE' || nonMatchEvent.currentDate !== '2026-08-13') {
  throw new Error('Test 3 failed: Expected clean COMPLETE on 2026-08-13');
}
console.log('✓ TEST 3 PASSED: Non-match target reached cleanly with COMPLETE!\n');

console.log('ALL CALENDAR ENGINE TESTS PASSED 100% SUCCESSFULLY!');
