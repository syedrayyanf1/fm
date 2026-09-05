const fs = require('fs');
const csv = require('csv-parser');

const leagueMap = {
  'LALIGA EA SPORTS': 'laliga',
  'LALIGA HYPERMOTION': 'segunda',
  'Premier League': 'premier',
  'EFL Championship': 'championship',
  'Serie A Enilive': 'seriea',
  'Serie BKT': 'serieb',
  'Bundesliga': 'bundesliga',
  'Bundesliga 2': 'bundesliga2',
  "Ligue 1 McDonald's": 'ligue1',
  'Ligue 2 BKT': 'ligue2',
};

const teamsByLeague = {};
Object.values(leagueMap).forEach(l => { teamsByLeague[l] = new Set(); });

fs.createReadStream('./male_players_fc25.csv').pipe(csv())
  .on('data', r => {
    const lId = leagueMap[r.League];
    if (lId && r.Team) {
      teamsByLeague[lId].add(r.Team.trim());
    }
  })
  .on('end', () => {
    console.log('Teams count per league in FC 25:');
    Object.entries(teamsByLeague).forEach(([lId, set]) => {
      console.log(`- ${lId}: ${set.size} clubs -> [${[...set].slice(0, 5).join(', ')}...]`);
    });
  });
