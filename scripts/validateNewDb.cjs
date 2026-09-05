const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./public/data/gameData.json', 'utf8'));

console.log('=== DATABASE VERIFICATION (FC 25 / SOFIFA) ===');
console.log('Total players:', Object.keys(data.players).length);
console.log('Total clubs:', Object.keys(data.clubs).length);
console.log('Total competitions:', Object.keys(data.competitions).length);

const players = Object.values(data.players);

// 1. Check Arsenal and Liverpool squads
const arsenal = players.filter(p => p.clubId === 'arsenal');
const liverpool = players.filter(p => p.clubId === 'liverpool');
const realmadrid = players.filter(p => p.clubId === 'realmadrid');
const barca = players.filter(p => p.clubId === 'barcelona');
const mancity = players.filter(p => p.clubId === 'mancity');
const psg = players.filter(p => p.clubId === 'psg');

console.log(`\nSquad sizes:`);
console.log(`- Arsenal: ${arsenal.length} players (Starters: ${arsenal.filter(p => p.isStarter).length})`);
console.log(`- Liverpool: ${liverpool.length} players (Starters: ${liverpool.filter(p => p.isStarter).length})`);
console.log(`- Real Madrid: ${realmadrid.length} players (Starters: ${realmadrid.filter(p => p.isStarter).length})`);
console.log(`- Barcelona: ${barca.length} players (Starters: ${barca.filter(p => p.isStarter).length})`);
console.log(`- Man City: ${mancity.length} players (Starters: ${mancity.filter(p => p.isStarter).length})`);
console.log(`- PSG: ${psg.length} players (Starters: ${psg.filter(p => p.isStarter).length})`);

// 2. Check for duplicate player names across the database
const nameMap = new Map();
const exactDuplicates = [];
players.forEach(p => {
  const norm = p.name.toLowerCase().trim();
  if (nameMap.has(norm)) {
    exactDuplicates.push({ name: p.name, club1: nameMap.get(norm), club2: p.clubId });
  } else {
    nameMap.set(norm, p.clubId);
  }
});
console.log(`\nDuplicate names: ${exactDuplicates.length}`);
if (exactDuplicates.length) {
  console.log('Sample duplicates:', exactDuplicates.slice(0, 5));
}

// 3. Check Rodri and Vitinha
const rodris = players.filter(p => p.name === 'Rodri');
console.log('\nRodri players in DB:');
rodris.forEach(r => console.log(`- ${r.name} | Club: ${r.clubId} | Pos: ${r.primaryPosition} | OVR: ${r.overallRating} | Starter: ${r.isStarter}`));

const vitinhas = players.filter(p => p.name === 'Vitinha');
console.log('\nVitinha players in DB:');
vitinhas.forEach(v => console.log(`- ${v.name} | Club: ${v.clubId} | Pos: ${v.primaryPosition} | OVR: ${v.overallRating} | Starter: ${v.isStarter}`));

// 4. Check Goalkeepers Defending Attributes
const gks = players.filter(p => p.primaryPosition === 'GK');
console.log(`\nTotal Goalkeepers in DB: ${gks.length}`);
const sampleGks = gks.filter(g => g.overallRating >= 85);
console.log('Top Goalkeepers:');
sampleGks.forEach(g => {
  console.log(`- ${g.name} (${g.clubId}) | OVR: ${g.overallRating} | DEF (shot-stop): ${g.attributes.defending} | MEN: ${g.attributes.mental} | PHY: ${g.attributes.physical}`);
});

// 5. Check clubs with 0 GKs
const clubsWithoutGk = Object.entries(data.clubs).filter(([cId, c]) => {
  return players.filter(p => p.clubId === cId && p.primaryPosition === 'GK').length === 0;
});
console.log(`\nClubs without GK: ${clubsWithoutGk.length}`);

// 6. Check Starting 11 count across ALL clubs
const starterStats = {};
Object.entries(data.clubs).forEach(([cId, c]) => {
  const sCount = players.filter(p => p.clubId === cId && p.isStarter).length;
  starterStats[sCount] = (starterStats[sCount] || 0) + 1;
});
console.log('\nStarters distribution across all clubs:', starterStats);

// 7. Check Top 20 Superstars & Market Values
const top20 = players.slice().sort((a,b) => b.overallRating - a.overallRating).slice(0, 20);
console.log('\nTop 20 Superstars in DB:');
top20.forEach((p, i) => {
  console.log(`${i+1}. ${p.name} (${p.clubId}) - OVR: ${p.overallRating} | Age: ${p.age} | Pos: ${p.primaryPosition} | Value: €${(p.marketValue / 1e6).toFixed(1)}M | Wage: €${(p.wagePerWeek / 1e3).toFixed(0)}k/wk`);
});

// 8. Check Barcelona Squad Details
console.log('\nBarcelona Squad:');
barca.sort((a, b) => b.overallRating - a.overallRating).forEach(p => {
  console.log(`- ${p.name} | ${p.primaryPosition} | OVR: ${p.overallRating} | Starter: ${p.isStarter} | Age: ${p.age}`);
});
