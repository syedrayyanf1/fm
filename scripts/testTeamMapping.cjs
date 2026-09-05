const fs = require('fs');
const fc25Teams = require('./fc25_teams_by_league.json');

// Extract LEAGUE_DEFINITIONS from generateGameData.cjs
const genScript = fs.readFileSync('./scripts/generateGameData.cjs', 'utf8');
const match = genScript.match(/const LEAGUE_DEFINITIONS = (\[[\s\S]*?\]);\s*\/\//);
if (!match) {
  console.error('Could not find LEAGUE_DEFINITIONS in generateGameData.cjs');
  process.exit(1);
}

const LEAGUE_DEFINITIONS = eval(match[1]);

const unmapped = [];
const mapped = [];

LEAGUE_DEFINITIONS.forEach(league => {
  const fc25List = fc25Teams[league.id] || [];
  league.clubs.forEach(club => {
    // Check if club.name or aliases matches any team in fc25List
    const aliases = [club.name, club.shortName, ...(club.aliases || [])].map(s => s.toLowerCase().trim());
    const matchedTeam = fc25List.find(t => aliases.includes(t.toLowerCase().trim()));
    if (matchedTeam) {
      mapped.push({ league: league.id, clubId: club.id, clubName: club.name, fc25Team: matchedTeam });
    } else {
      unmapped.push({ league: league.id, clubId: club.id, clubName: club.name, available: fc25List });
    }
  });
});

console.log(`Successfully mapped: ${mapped.length} / 202 clubs`);
if (unmapped.length > 0) {
  console.log(`Unmapped clubs count: ${unmapped.length}`);
  console.log('Unmapped details:');
  unmapped.forEach(u => {
    console.log(`[${u.league}] Club: "${u.clubName}" (id: ${u.clubId})`);
    console.log(' Available in FC 25:', u.available);
  });
}
