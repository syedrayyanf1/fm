const fs = require('fs');
const readline = require('readline');
const csv = require('csv-parser');

const rl = fs.createReadStream('./male_players.csv').pipe(csv());

const byName = new Map();
rl.on('data', (row) => {
  const name = (row.Name || '').trim();
  const club = (row.Club || '').trim();
  const pos = (row.Position || '').trim();
  const ovr = (row.Overall || '').trim();
  const url = (row.URL || '').trim();
  const idMatch = url.match(/\/(\d+)\/?$/);
  const eaId = idMatch ? idMatch[1] : '';

  if (!byName.has(name.toLowerCase())) {
    byName.set(name.toLowerCase(), []);
  }
  byName.get(name.toLowerCase()).push({ name, club, pos, ovr, eaId, url });
});

rl.on('end', () => {
  console.log('Total unique player names in CSV:', byName.size);
  const dupes = [];
  byName.forEach((list, name) => {
    if (list.length > 1) {
      dupes.push({ name, count: list.length, players: list });
    }
  });
  console.log('Names with multiple players:', dupes.length);
  // Check high profile dupes
  const famous = ['rodri', 'vitinha', 'danilo', 'fernando', 'marquinhos', 'gabriel', 'pedro', 'joao pedro', 'pepe', 'raul', 'williams', 'silva', 'santos'];
  famous.forEach(f => {
    const found = dupes.find(d => d.name === f || d.name.includes(f));
    if (found) {
      console.log(`\nDuplicate: ${found.name} (${found.count} players):`);
      found.players.forEach(p => console.log(`  - ${p.name} | Club in CSV: "${p.club}" | Pos: ${p.pos} | OVR: ${p.ovr} | EA ID: ${p.eaId}`));
    }
  });
});
