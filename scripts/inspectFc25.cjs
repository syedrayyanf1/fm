const fs = require('fs');
const csv = require('csv-parser');

const rows = [];
fs.createReadStream('./male_players_fc25.csv').pipe(csv())
  .on('data', r => {
    if (rows.length < 20) rows.push(r);
  })
  .on('end', () => {
    console.log('--- FIRST 20 PLAYERS IN FC 25 DATASET ---');
    rows.forEach(r => {
      console.log(`[Rank ${r.Rank}] ${r.Name} | Team: "${r.Team}" | League: "${r.League}" | OVR: ${r.OVR} | POS: ${r.Position} | Age: ${r.Age} | GK: "${r.GK}"`);
    });
  });
