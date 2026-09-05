#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.resolve(__dirname, '../public/data/gameData.json');

console.log('='.repeat(60));
console.log('  FOOTBALL MANAGER - GAME DATA AUDIT');
console.log('='.repeat(60));

if (!fs.existsSync(DATA_PATH)) {
  console.error(`[FATAL] gameData.json not found at: ${DATA_PATH}`);
  process.exit(1);
}

const raw = fs.readFileSync(DATA_PATH, 'utf8');
let data;
try { data = JSON.parse(raw); } catch (e) { console.error('[FATAL]', e.message); process.exit(1); }

const clubs = data.clubs || {};
const players = data.players || {};
const competitions = data.competitions || {};
const allClubs = Object.values(clubs);
const allPlayers = Object.values(players);
const allComps = Object.values(competitions);

let errors = 0, warnings = 0;
const pass = msg => console.log(`  OK  ${msg}`);
const warn = msg => { console.warn(`  WRN ${msg}`); warnings++; };
const fail = msg => { console.error(`  ERR ${msg}`); errors++; };

console.log('\n--- 1. TOP-LEVEL COUNTS ---');
console.log(`  Competitions: ${allComps.length}  Clubs: ${allClubs.length}  Players: ${allPlayers.length}`);
if (allComps.length === 10) pass('10 competitions'); else fail(`Expected 10, got ${allComps.length}`);
if (allClubs.length === 198) pass('198 clubs'); else fail(`Expected 198, got ${allClubs.length}`);
if (allPlayers.length >= 5000) pass(`${allPlayers.length} players (>=5000)`); else warn(`Only ${allPlayers.length} players`);

console.log('\n--- 2. LEAGUE VERIFICATION ---');
['laliga','segunda','premier','championship','seriea','serieb','bundesliga','bundesliga2','ligue1','ligue2'].forEach(lid => {
  const count = allClubs.filter(c => c.leagueId === lid).length;
  if (competitions[lid]) pass(`${lid}: ${count} clubs`);
  else fail(`Missing league: ${lid}`);
});

console.log('\n--- 3. STARTER INTEGRITY ---');
let starterIssues = 0;
allClubs.forEach(c => {
  const count = allPlayers.filter(p => p.clubId === c.id && p.isStarter).length;
  if (count !== 11) { fail(`${c.name}: ${count} starters`); starterIssues++; }
});
if (!starterIssues) pass('All 198 clubs have exactly 11 starters');

console.log('\n--- 4. GK COVERAGE ---');
let gkIssues = 0;
allClubs.forEach(c => {
  const count = allPlayers.filter(p => p.clubId === c.id && p.primaryPosition === 'GK').length;
  if (count < 2) { fail(`${c.name}: only ${count} GK`); gkIssues++; }
});
if (!gkIssues) pass('All clubs have >=2 GKs');

console.log('\n--- 5. ATTRIBUTE INTEGRITY ---');
let attrBad = 0;
allPlayers.forEach(p => {
  ['attacking','creative','defending','physical','mental'].forEach(a => {
    const v = p.attributes?.[a];
    if (v == null || isNaN(v) || v < 1 || v > 99) attrBad++;
  });
  ['clutch','consistency','adaptability'].forEach(t => {
    const v = p.traits?.[t];
    if (v == null || isNaN(v) || v < 1 || v > 20) attrBad++;
  });
});
if (!attrBad) pass('All attributes and traits valid'); else fail(`${attrBad} attribute violations`);

console.log('\n--- 6. KEY ROSTER CHECKS ---');
const find = name => allPlayers.find(p => (p.name||'').toLowerCase().includes(name.toLowerCase()));

const yamal = find('Yamal');
if (!yamal) fail('Lamine Yamal not found');
else { if (yamal.clubId==='barcelona') pass(`Yamal: barcelona OVR=${yamal.overallRating} age=${yamal.age}`); else fail(`Yamal at ${yamal.clubId}`); }

const mbappe = find('Mbappe') || find('Mbapp');
if (!mbappe) fail('Mbappe not found');
else { if (mbappe.clubId==='realmadrid') pass(`Mbappe: realmadrid OVR=${mbappe.overallRating} age=${mbappe.age}`); else fail(`Mbappe at ${mbappe.clubId}`); }

const cubarsi = find('Cubarsi') || find('Cubars');
if (!cubarsi) warn('Cubars not found');
else { if (cubarsi.clubId==='barcelona') pass(`Cubars: barcelona OVR=${cubarsi.overallRating}`); else fail(`Cubars at ${cubarsi.clubId}`); }

const casado = allPlayers.find(p => (p.name||'').toLowerCase().includes('casad') && p.clubId === 'barcelona');
if (!casado) warn('Casado not found');
else { if (casado.clubId==='barcelona') pass(`Casado: barcelona OVR=${casado.overallRating}`); else fail(`Casado at ${casado.clubId}`); }

const olmo = find('Olmo');
if (!olmo) fail('Dani Olmo not found');
else { if (olmo.clubId==='barcelona') pass(`Olmo: barcelona OVR=${olmo.overallRating}`); else fail(`Olmo at ${olmo.clubId}`); }

const haaland = find('Haaland');
if (!haaland) fail('Haaland not found');
else { if (haaland.clubId==='mancity') pass(`Haaland: mancity OVR=${haaland.overallRating}`); else fail(`Haaland at ${haaland.clubId}`); }

console.log('\n--- 7. TOP VALUES ---');
[...allPlayers].sort((a,b)=>b.marketValue-a.marketValue).slice(0,5).forEach((p,i)=>
  console.log(`  ${i+1}. ${p.name} (${p.clubId}) EUR${(p.marketValue/1e6).toFixed(1)}M`)
);

console.log('\n--- 8. GK DEF CALIBRATION ---');
allPlayers.filter(p=>p.primaryPosition==='GK').sort((a,b)=>b.overallRating-a.overallRating).slice(0,5).forEach(gk=>{
  const def=gk.attributes.defending;
  if (def<85) fail(`${gk.name} OVR=${gk.overallRating} DEF=${def} (too low)`);
  else pass(`${gk.name} OVR=${gk.overallRating} DEF=${def}`);
});

console.log('\n' + '='.repeat(60));
console.log(`  RESULT: ${errors} errors, ${warnings} warnings`);
if (!errors) console.log('  DATABASE IS HEALTHY');
console.log('='.repeat(60));
process.exit(errors > 0 ? 1 : 0);

