const fs = require('fs');
const data = require('../public/data/gameData.json');
const players = Object.values(data.players);

// 1. Inspect Rodri and Vitinha
console.log('--- RODRI AT MAN CITY ---');
console.log(players.filter(p => p.name.toLowerCase().includes('rodri') && p.clubId === 'mancity'));

console.log('--- VITINHA AT PSG ---');
console.log(players.filter(p => p.name.toLowerCase().includes('vitinha') && p.clubId === 'psg'));

// 2. Club without GK
Object.entries(data.clubs).forEach(([cId, club]) => {
  const clubPlayers = players.filter(p => p.clubId === cId);
  const gks = clubPlayers.filter(p => p.primaryPosition === 'GK');
  if (gks.length === 0) {
    console.log('--- CLUB WITHOUT GK ---', cId, club.name, 'Total players:', clubPlayers.length);
    console.log('Their players:', clubPlayers.map(p => `${p.name} (${p.primaryPosition})`));
  }
});

// 3. Inspect clubs with very small or unbalanced squads
const smallSquads = [];
Object.entries(data.clubs).forEach(([cId, club]) => {
  const clubPlayers = players.filter(p => p.clubId === cId);
  const posCounts = {};
  clubPlayers.forEach(p => {
    posCounts[p.primaryPosition] = (posCounts[p.primaryPosition] || 0) + 1;
  });
  if (clubPlayers.length < 18 || !posCounts.GK || posCounts.GK < 1) {
    smallSquads.push({ cId, name: club.name, count: clubPlayers.length, posCounts });
  }
});
console.log('--- UNBALANCED / SMALL SQUADS ---', smallSquads);

// 4. Check wage budget sanity vs actual squad weekly wage
const wageIssues = [];
Object.entries(data.clubs).forEach(([cId, club]) => {
  const clubPlayers = players.filter(p => p.clubId === cId);
  const totalWeeklyWage = clubPlayers.reduce((sum, p) => sum + (p.wagePerWeek || 0), 0);
  if (totalWeeklyWage > club.finances.wageBudgetWeekly * 1.5 || totalWeeklyWage < club.finances.wageBudgetWeekly * 0.2) {
    wageIssues.push({
      cId,
      name: club.name,
      wageBudgetWeekly: club.finances.wageBudgetWeekly,
      totalWeeklyWage,
      ratio: (totalWeeklyWage / club.finances.wageBudgetWeekly).toFixed(2)
    });
  }
});
console.log('--- WAGE DISCREPANCIES COUNT ---', wageIssues.length);
console.log('Sample wage issues:', wageIssues.slice(0, 5));

// 5. Starters count across all clubs
const starterCounts = {};
Object.entries(data.clubs).forEach(([cId, club]) => {
  const clubPlayers = players.filter(p => p.clubId === cId);
  const starters = clubPlayers.filter(p => p.isStarter);
  starterCounts[starters.length] = (starterCounts[starters.length] || 0) + 1;
});
console.log('--- STARTERS DISTRIBUTION (number of starters -> number of clubs) ---', starterCounts);
