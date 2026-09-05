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
  "Ligue 2 BKT": 'ligue2',
};

const teamsByLeague = {};
Object.values(leagueMap).forEach(l => { teamsByLeague[l] = []; });

fs.createReadStream('./male_players_fc25.csv').pipe(csv())
  .on('data', r => {
    const lId = leagueMap[r.League];
    if (lId && r.Team && !teamsByLeague[lId].includes(r.Team.trim())) {
      teamsByLeague[lId].push(r.Team.trim());
    }
  })
  .on('end', () => {
    fs.writeFileSync('./scripts/fc25_teams_by_league.json', JSON.stringify(teamsByLeague, null, 2));
    console.log('Saved teams by league to ./scripts/fc25_teams_by_league.json');
    Object.entries(teamsByLeague).forEach(([l, teams]) => {
      console.log(`${l}: ${teams.length} teams`);
    });
  });
