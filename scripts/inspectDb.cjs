const fs = require('fs');
const data = require('../public/data/gameData.json');

console.log('Total players:', Object.keys(data.players).length);
console.log('Total clubs:', Object.keys(data.clubs).length);
console.log('Total competitions:', Object.keys(data.competitions).length);

const players = Object.values(data.players);
const autoGen = players.filter(p => p.id.includes('autogen'));
console.log('Auto-generated players count:', autoGen.length);
console.log('Real players count:', players.length - autoGen.length);

const clubsWithFewReal = [];
const clubsStats = [];
Object.entries(data.clubs).forEach(([cId, club]) => {
  const clubPlayers = players.filter(p => p.clubId === cId);
  const realCount = clubPlayers.filter(p => !p.id.includes('autogen')).length;
  clubsStats.push({ id: cId, name: club.name, realCount, total: clubPlayers.length, league: club.leagueId });
  if (realCount < 11) {
    clubsWithFewReal.push({ id: cId, name: club.name, realCount, total: clubPlayers.length, league: club.leagueId });
  }
});
console.log('Clubs with < 11 real players:', clubsWithFewReal.length);
if (clubsWithFewReal.length > 0) {
  console.log('Sample clubs with few real players:', clubsWithFewReal.slice(0, 10));
}

// Top players
const topPlayers = players.slice().sort((a,b) => b.overallRating - a.overallRating).slice(0, 25);
console.log('\nTop 25 players:');
topPlayers.forEach(p => {
  console.log(`- ${p.name} | Club: ${p.clubId} | OVR: ${p.overallRating} | Pos: ${p.primaryPosition} | Age: ${p.age}`);
});

// Check clubs without proper positions (e.g. no GK)
const clubsWithoutGk = [];
Object.entries(data.clubs).forEach(([cId, club]) => {
  const clubPlayers = players.filter(p => p.clubId === cId);
  const gks = clubPlayers.filter(p => p.primaryPosition === 'GK');
  if (gks.length === 0) {
    clubsWithoutGk.push({ id: cId, name: club.name });
  }
});
console.log('\nClubs without GK:', clubsWithoutGk.length);

// Check duplicate players or duplicate names
const nameMap = new Map();
const duplicates = [];
players.forEach(p => {
  const norm = p.name.toLowerCase().trim();
  if (nameMap.has(norm)) {
    duplicates.push({ name: p.name, clubs: [nameMap.get(norm), p.clubId], id: p.id });
  } else {
    nameMap.set(norm, p.clubId);
  }
});
console.log('\nPotential duplicate player names across database:', duplicates.length);
if (duplicates.length > 0) {
  console.log('Sample duplicates:', duplicates.slice(0, 10));
}
