const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const CSV_FILE = path.resolve(__dirname, '../male_players_fc25.csv');
const OUTPUT_JSON_PUBLIC = path.resolve(__dirname, '../public/data/gameData.json');
const OUTPUT_JSON_SRC = path.resolve(__dirname, '../src/data/realPlayersData.json');

console.log('====================================================');
console.log('MASTER GAME DATA ETL: 10 LEAGUES, 198 CLUBS (EA FC 25 / SOFIFA)');
console.log('====================================================');

if (!fs.existsSync(CSV_FILE)) {
  console.error(`[ERROR] ${CSV_FILE} not found.`);
  process.exit(1);
}

// 1. DEFINITION OF ALL 10 COMPETITIONS AND 198 CLUBS
const LEAGUE_DEFINITIONS = [
  // 1. SPAIN - TIER 1: LALIGA EA SPORTS (20 clubs)
  {
    id: 'laliga',
    name: 'LaLiga EA Sports',
    country: 'Spain',
    tier: 1,
    simulationTier: 'DEEP',
    totalMatchdays: 38,
    fc25LeagueName: 'LALIGA EA SPORTS',
    clubs: [
      { id: 'barcelona', name: 'FC Barcelona', shortName: 'Barça', rep: 92, rev: 800000000, tb: 45000000, wb: 3200000, aliases: ['FC Barcelona', 'Barcelona'] },
      { id: 'realmadrid', name: 'Real Madrid', shortName: 'Real Madrid', rep: 95, rev: 850000000, tb: 90000000, wb: 3600000, aliases: ['Real Madrid'] },
      { id: 'atletico', name: 'Atlético de Madrid', shortName: 'Atlético', rep: 88, rev: 400000000, tb: 45000000, wb: 2100000, aliases: ['Atlético de Madrid', 'Atletico Madrid', 'Atlético'] },
      { id: 'athletic', name: 'Athletic Club', shortName: 'Athletic', rep: 83, rev: 190000000, tb: 35000000, wb: 1100000, aliases: ['Athletic Club', 'Athletic Club de Bilbao'] },
      { id: 'realsociedad', name: 'Real Sociedad', shortName: 'Sociedad', rep: 83, rev: 180000000, tb: 30000000, wb: 1000000, aliases: ['Real Sociedad'] },
      { id: 'villarreal', name: 'Villarreal CF', shortName: 'Villarreal', rep: 82, rev: 160000000, tb: 25000000, wb: 950000, aliases: ['Villarreal CF', 'Villarreal'] },
      { id: 'realbetis', name: 'Real Betis', shortName: 'Betis', rep: 82, rev: 170000000, tb: 25000000, wb: 1000000, aliases: ['Real Betis', 'Real Betis Balompié'] },
      { id: 'girona', name: 'Girona FC', shortName: 'Girona', rep: 80, rev: 120000000, tb: 20000000, wb: 800000, aliases: ['Girona FC', 'Girona'] },
      { id: 'sevilla', name: 'Sevilla FC', shortName: 'Sevilla', rep: 81, rev: 175000000, tb: 20000000, wb: 950000, aliases: ['Sevilla FC', 'Sevilla'] },
      { id: 'valencia', name: 'Valencia CF', shortName: 'Valencia', rep: 79, rev: 130000000, tb: 12000000, wb: 800000, aliases: ['Valencia CF', 'Valencia'] },
      { id: 'celtavigo', name: 'Celta Vigo', shortName: 'Celta', rep: 77, rev: 85000000, tb: 10000000, wb: 650000, aliases: ['RC Celta', 'Celta Vigo', 'RC Celta de Vigo'] },
      { id: 'osasuna', name: 'CA Osasuna', shortName: 'Osasuna', rep: 77, rev: 80000000, tb: 8000000, wb: 600000, aliases: ['CA Osasuna', 'Osasuna'] },
      { id: 'rcdmallorca', name: 'RCD Mallorca', shortName: 'Mallorca', rep: 76, rev: 75000000, tb: 8000000, wb: 580000, aliases: ['RCD Mallorca', 'Mallorca'] },
      { id: 'laspalmas', name: 'UD Las Palmas', shortName: 'Las Palmas', rep: 75, rev: 65000000, tb: 6000000, wb: 520000, aliases: ['UD Las Palmas', 'Las Palmas'] },
      { id: 'rayovallecano', name: 'Rayo Vallecano', shortName: 'Rayo', rep: 75, rev: 60000000, tb: 5000000, wb: 500000, aliases: ['Rayo Vallecano'] },
      { id: 'getafe', name: 'Getafe CF', shortName: 'Getafe', rep: 75, rev: 65000000, tb: 5000000, wb: 520000, aliases: ['Getafe CF', 'Getafe'] },
      { id: 'espanyol', name: 'RCD Espanyol', shortName: 'Espanyol', rep: 75, rev: 70000000, tb: 7000000, wb: 550000, aliases: ['RCD Espanyol', 'RCD Espanyol de Barcelona'] },
      { id: 'leganes', name: 'CD Leganés', shortName: 'Leganés', rep: 74, rev: 55000000, tb: 4000000, wb: 450000, aliases: ['CD Leganés', 'Leganés', 'Leganes'] },
      { id: 'realvalladolid', name: 'Real Valladolid', shortName: 'Valladolid', rep: 73, rev: 55000000, tb: 4000000, wb: 450000, aliases: ['R. Valladolid CF', 'Real Valladolid', 'Real Valladolid CF'] },
      { id: 'alaves', name: 'Deportivo Alavés', shortName: 'Alavés', rep: 74, rev: 60000000, tb: 5000000, wb: 480000, aliases: ['D. Alavés', 'Deportivo Alavés', 'Alavés'] },
    ],
  },
  // 2. SPAIN - TIER 2: LALIGA HYPERMOTION (22 clubs)
  {
    id: 'segunda',
    name: 'LaLiga Hypermotion',
    country: 'Spain',
    tier: 2,
    simulationTier: 'SHALLOW',
    totalMatchdays: 42,
    fc25LeagueName: 'LALIGA HYPERMOTION',
    clubs: [
      { id: 'almeria', name: 'UD Almería', shortName: 'Almería', rep: 75, rev: 38000000, tb: 4000000, wb: 350000, aliases: ['UD Almería', 'Almería'] },
      { id: 'granada', name: 'Granada CF', shortName: 'Granada', rep: 75, rev: 36000000, tb: 3500000, wb: 340000, aliases: ['Granada CF', 'Granada'] },
      { id: 'cadiz', name: 'Cádiz CF', shortName: 'Cádiz', rep: 74, rev: 32000000, tb: 2500000, wb: 300000, aliases: ['Cádiz CF', 'Cadiz'] },
      { id: 'levante', name: 'Levante UD', shortName: 'Levante', rep: 75, rev: 35000000, tb: 3000000, wb: 320000, aliases: ['Levante UD'] },
      { id: 'oviedo', name: 'Real Oviedo', shortName: 'Oviedo', rep: 73, rev: 27000000, tb: 2000000, wb: 260000, aliases: ['R. Oviedo', 'Real Oviedo'] },
      { id: 'sportinggijon', name: 'Sporting Gijón', shortName: 'Sporting', rep: 73, rev: 28000000, tb: 2000000, wb: 270000, aliases: ['R. Sporting', 'Real Sporting de Gijón', 'Sporting Gijón'] },
      { id: 'elche', name: 'Elche CF', shortName: 'Elche', rep: 74, rev: 32000000, tb: 2500000, wb: 290000, aliases: ['Elche CF', 'Elche'] },
      { id: 'deportivo', name: 'RC Deportivo', shortName: 'Deportivo', rep: 72, rev: 25000000, tb: 2000000, wb: 250000, aliases: ['RC Deportivo', 'Deportivo La Coruña'] },
      { id: 'racing', name: 'Racing Santander', shortName: 'Racing', rep: 73, rev: 26000000, tb: 2000000, wb: 250000, aliases: ['R. Racing Club', 'Racing de Santander', 'Racing Santander'] },
      { id: 'eibar', name: 'SD Eibar', shortName: 'Eibar', rep: 74, rev: 32000000, tb: 2500000, wb: 290000, aliases: ['SD Eibar', 'Eibar'] },
      { id: 'zaragoza', name: 'Real Zaragoza', shortName: 'Zaragoza', rep: 74, rev: 30000000, tb: 2500000, wb: 280000, aliases: ['Real Zaragoza'] },
      { id: 'racingferrol', name: 'Racing de Ferrol', shortName: 'Ferrol', rep: 70, rev: 18000000, tb: 1000000, wb: 180000, aliases: ['Racing de Ferrol', 'Racing Ferrol'] },
      { id: 'tenerife', name: 'CD Tenerife', shortName: 'Tenerife', rep: 72, rev: 24000000, tb: 1500000, wb: 220000, aliases: ['CD Tenerife'] },
      { id: 'malaga', name: 'Málaga CF', shortName: 'Málaga', rep: 71, rev: 22000000, tb: 1500000, wb: 210000, aliases: ['Málaga CF', 'Malaga'] },
      { id: 'huesca', name: 'SD Huesca', shortName: 'Huesca', rep: 71, rev: 22000000, tb: 1200000, wb: 200000, aliases: ['SD Huesca'] },
      { id: 'castellon', name: 'CD Castellón', shortName: 'Castellón', rep: 69, rev: 16000000, tb: 800000, wb: 170000, aliases: ['CD Castellón', 'Castellón'] },
      { id: 'albacete', name: 'Albacete Balompié', shortName: 'Albacete', rep: 71, rev: 22000000, tb: 1500000, wb: 200000, aliases: ['Albacete BP', 'Albacete Balompié', 'Albacete'] },
      { id: 'burgos', name: 'Burgos CF', shortName: 'Burgos', rep: 71, rev: 20000000, tb: 1200000, wb: 190000, aliases: ['Burgos CF'] },
      { id: 'mirandes', name: 'CD Mirandés', shortName: 'Mirandés', rep: 70, rev: 18000000, tb: 1000000, wb: 180000, aliases: ['CD Mirandés', 'Mirandés'] },
      { id: 'eldense', name: 'CD Eldense', shortName: 'Eldense', rep: 69, rev: 16000000, tb: 800000, wb: 160000, aliases: ['CD Eldense', 'Eldense'] },
      { id: 'cartagena', name: 'FC Cartagena', shortName: 'Cartagena', rep: 70, rev: 18000000, tb: 1000000, wb: 180000, aliases: ['FC Cartagena', 'Cartagena'] },
      { id: 'cordoba', name: 'Córdoba CF', shortName: 'Córdoba', rep: 70, rev: 18000000, tb: 1000000, wb: 180000, aliases: ['Córdoba CF', 'Cordoba'] },
    ],
  },
  // 3. ENGLAND - TIER 1: PREMIER LEAGUE (20 clubs)
  {
    id: 'premier',
    name: 'Premier League',
    country: 'England',
    tier: 1,
    simulationTier: 'DEEP',
    totalMatchdays: 38,
    fc25LeagueName: 'Premier League',
    clubs: [
      { id: 'mancity', name: 'Manchester City', shortName: 'Man City', rep: 94, rev: 820000000, tb: 100000000, wb: 3800000, aliases: ['Manchester City'] },
      { id: 'arsenal', name: 'Arsenal', shortName: 'Arsenal', rep: 89, rev: 550000000, tb: 65000000, wb: 2800000, aliases: ['Arsenal'] },
      { id: 'liverpool', name: 'Liverpool', shortName: 'Liverpool', rep: 90, rev: 600000000, tb: 70000000, wb: 3000000, aliases: ['Liverpool'] },
      { id: 'manunited', name: 'Manchester United', shortName: 'Man Utd', rep: 87, rev: 680000000, tb: 75000000, wb: 3200000, aliases: ['Man Utd', 'Manchester United', 'Manchester Utd'] },
      { id: 'tottenham', name: 'Tottenham Hotspur', shortName: 'Spurs', rep: 85, rev: 500000000, tb: 55000000, wb: 2200000, aliases: ['Spurs', 'Tottenham Hotspur', 'Tottenham'] },
      { id: 'astonvilla', name: 'Aston Villa', shortName: 'Villa', rep: 84, rev: 280000000, tb: 40000000, wb: 1600000, aliases: ['Aston Villa'] },
      { id: 'newcastle', name: 'Newcastle United', shortName: 'Newcastle', rep: 84, rev: 320000000, tb: 50000000, wb: 1700000, aliases: ['Newcastle Utd', 'Newcastle United', 'Newcastle'] },
      { id: 'chelsea', name: 'Chelsea', shortName: 'Chelsea', rep: 86, rev: 520000000, tb: 80000000, wb: 2900000, aliases: ['Chelsea'] },
      { id: 'everton', name: 'Everton', shortName: 'Everton', rep: 78, rev: 190000000, tb: 15000000, wb: 1100000, aliases: ['Everton'] },
      { id: 'westham', name: 'West Ham United', shortName: 'West Ham', rep: 81, rev: 250000000, tb: 35000000, wb: 1400000, aliases: ['West Ham', 'West Ham United'] },
      { id: 'fulham', name: 'Fulham', shortName: 'Fulham', rep: 78, rev: 180000000, tb: 25000000, wb: 1050000, aliases: ['Fulham'] },
      { id: 'crystalpalace', name: 'Crystal Palace', shortName: 'Palace', rep: 78, rev: 180000000, tb: 25000000, wb: 1000000, aliases: ['Crystal Palace'] },
      { id: 'brighton', name: 'Brighton & Hove Albion', shortName: 'Brighton', rep: 81, rev: 220000000, tb: 40000000, wb: 1200000, aliases: ['Brighton', 'Brighton & Hove Albion'] },
      { id: 'southampton', name: 'Southampton', shortName: 'Southampton', rep: 76, rev: 150000000, tb: 20000000, wb: 850000, aliases: ['Southampton'] },
      { id: 'bournemouth', name: 'AFC Bournemouth', shortName: 'Bournemouth', rep: 77, rev: 160000000, tb: 25000000, wb: 950000, aliases: ['AFC Bournemouth', 'Bournemouth'] },
      { id: 'brentford', name: 'Brentford', shortName: 'Brentford', rep: 78, rev: 170000000, tb: 25000000, wb: 950000, aliases: ['Brentford'] },
      { id: 'wolves', name: 'Wolverhampton Wanderers', shortName: 'Wolves', rep: 78, rev: 175000000, tb: 20000000, wb: 1000000, aliases: ['Wolves', 'Wolverhampton Wanderers'] },
      { id: 'nottingham', name: 'Nottingham Forest', shortName: 'Forest', rep: 77, rev: 170000000, tb: 25000000, wb: 1000000, aliases: ["Nott'm Forest", 'Nottingham Forest'] },
      { id: 'leicester', name: 'Leicester City', shortName: 'Leicester', rep: 77, rev: 160000000, tb: 20000000, wb: 950000, aliases: ['Leicester City'] },
      { id: 'ipswich', name: 'Ipswich Town', shortName: 'Ipswich', rep: 74, rev: 140000000, tb: 15000000, wb: 800000, aliases: ['Ipswich', 'Ipswich Town'] },
    ],
  },
  // 4. ENGLAND - TIER 2: EFL CHAMPIONSHIP (24 clubs)
  {
    id: 'championship',
    name: 'EFL Championship',
    country: 'England',
    tier: 2,
    simulationTier: 'SHALLOW',
    totalMatchdays: 46,
    fc25LeagueName: 'EFL Championship',
    clubs: [
      { id: 'luton', name: 'Luton Town', shortName: 'Luton', rep: 74, rev: 45000000, tb: 4000000, wb: 420000, aliases: ['Luton Town'] },
      { id: 'leeds', name: 'Leeds United', shortName: 'Leeds', rep: 77, rev: 65000000, tb: 8000000, wb: 550000, aliases: ['Leeds United'] },
      { id: 'sunderland', name: 'Sunderland', shortName: 'Sunderland', rep: 74, rev: 45000000, tb: 5000000, wb: 400000, aliases: ['Sunderland'] },
      { id: 'burnley', name: 'Burnley', shortName: 'Burnley', rep: 76, rev: 60000000, tb: 7000000, wb: 500000, aliases: ['Burnley'] },
      { id: 'sheffieldutd', name: 'Sheffield United', shortName: 'Sheffield Utd', rep: 75, rev: 55000000, tb: 6000000, wb: 480000, aliases: ['Sheffield Utd', 'Sheffield United'] },
      { id: 'coventry', name: 'Coventry City', shortName: 'Coventry', rep: 73, rev: 40000000, tb: 3500000, wb: 360000, aliases: ['Coventry City'] },
      { id: 'stoke', name: 'Stoke City', shortName: 'Stoke', rep: 73, rev: 40000000, tb: 3500000, wb: 380000, aliases: ['Stoke City'] },
      { id: 'blackburn', name: 'Blackburn Rovers', shortName: 'Blackburn', rep: 73, rev: 38000000, tb: 3000000, wb: 350000, aliases: ['Blackburn Rovers'] },
      { id: 'qpr', name: 'Queens Park Rangers', shortName: 'QPR', rep: 72, rev: 35000000, tb: 2500000, wb: 320000, aliases: ['QPR', 'Queens Park Rangers'] },
      { id: 'cardiff', name: 'Cardiff City', shortName: 'Cardiff', rep: 72, rev: 36000000, tb: 2500000, wb: 340000, aliases: ['Cardiff City'] },
      { id: 'norwich', name: 'Norwich City', shortName: 'Norwich', rep: 74, rev: 48000000, tb: 4500000, wb: 440000, aliases: ['Norwich', 'Norwich City'] },
      { id: 'hull', name: 'Hull City', shortName: 'Hull', rep: 73, rev: 38000000, tb: 3000000, wb: 350000, aliases: ['Hull City'] },
      { id: 'westbrom', name: 'West Bromwich Albion', shortName: 'West Brom', rep: 75, rev: 50000000, tb: 5000000, wb: 460000, aliases: ['West Brom', 'West Bromwich Albion'] },
      { id: 'preston', name: 'Preston North End', shortName: 'Preston', rep: 72, rev: 32000000, tb: 2000000, wb: 300000, aliases: ['Preston', 'Preston North End'] },
      { id: 'plymouth', name: 'Plymouth Argyle', shortName: 'Plymouth', rep: 71, rev: 30000000, tb: 2000000, wb: 280000, aliases: ['Plymouth Argyle'] },
      { id: 'millwall', name: 'Millwall', shortName: 'Millwall', rep: 72, rev: 34000000, tb: 2500000, wb: 310000, aliases: ['Millwall'] },
      { id: 'middlesbrough', name: 'Middlesbrough', shortName: 'Boro', rep: 74, rev: 45000000, tb: 4000000, wb: 420000, aliases: ['Middlesbrough'] },
      { id: 'watford', name: 'Watford', shortName: 'Watford', rep: 74, rev: 46000000, tb: 4000000, wb: 440000, aliases: ['Watford'] },
      { id: 'sheffieldwed', name: 'Sheffield Wednesday', shortName: 'Sheff Wed', rep: 72, rev: 34000000, tb: 2500000, wb: 320000, aliases: ['Sheffield Wed', 'Sheffield Wednesday'] },
      { id: 'swansea', name: 'Swansea City', shortName: 'Swansea', rep: 73, rev: 38000000, tb: 3000000, wb: 350000, aliases: ['Swansea City'] },
      { id: 'bristolcity', name: 'Bristol City', shortName: 'Bristol City', rep: 72, rev: 35000000, tb: 2500000, wb: 330000, aliases: ['Bristol City'] },
      { id: 'derby', name: 'Derby County', shortName: 'Derby', rep: 72, rev: 35000000, tb: 2500000, wb: 330000, aliases: ['Derby County'] },
      { id: 'oxford', name: 'Oxford United', shortName: 'Oxford', rep: 70, rev: 26000000, tb: 1500000, wb: 250000, aliases: ['Oxford United'] },
      { id: 'portsmouth', name: 'Portsmouth', shortName: 'Portsmouth', rep: 71, rev: 30000000, tb: 2000000, wb: 280000, aliases: ['Portsmouth'] },
    ],
  },
  // 5. ITALY - TIER 1: SERIE A (20 clubs)
  {
    id: 'seriea',
    name: 'Serie A',
    country: 'Italy',
    tier: 1,
    simulationTier: 'DEEP',
    totalMatchdays: 38,
    fc25LeagueName: 'Serie A Enilive',
    clubs: [
      { id: 'inter', name: 'Inter', shortName: 'Inter', rep: 89, rev: 420000000, tb: 45000000, wb: 2400000, aliases: ['Lombardia FC', 'Inter', 'Inter Milan'] },
      { id: 'napoli', name: 'Napoli', shortName: 'Napoli', rep: 85, rev: 270000000, tb: 40000000, wb: 1700000, aliases: ['SSC Napoli', 'Napoli'] },
      { id: 'roma', name: 'Roma', shortName: 'Roma', rep: 83, rev: 250000000, tb: 30000000, wb: 1600000, aliases: ['AS Roma', 'Roma'] },
      { id: 'milan', name: 'Milan', shortName: 'Milan', rep: 86, rev: 380000000, tb: 40000000, wb: 2100000, aliases: ['Milano FC', 'Milan', 'AC Milan'] },
      { id: 'juventus', name: 'Juventus', shortName: 'Juventus', rep: 87, rev: 450000000, tb: 50000000, wb: 2500000, aliases: ['Juventus'] },
      { id: 'lazio', name: 'Lazio', shortName: 'Lazio', rep: 82, rev: 180000000, tb: 25000000, wb: 1200000, aliases: ['Latium', 'Lazio'] },
      { id: 'torino', name: 'Torino', shortName: 'Torino', rep: 78, rev: 110000000, tb: 15000000, wb: 750000, aliases: ['Torino'] },
      { id: 'atalanta', name: 'Atalanta', shortName: 'Atalanta', rep: 85, rev: 200000000, tb: 35000000, wb: 1300000, aliases: ['Bergamo Calcio', 'Atalanta'] },
      { id: 'como', name: 'Como', shortName: 'Como', rep: 74, rev: 70000000, tb: 10000000, wb: 550000, aliases: ['Como'] },
      { id: 'bologna', name: 'Bologna', shortName: 'Bologna', rep: 80, rev: 130000000, tb: 20000000, wb: 850000, aliases: ['Bologna'] },
      { id: 'lecce', name: 'Lecce', shortName: 'Lecce', rep: 74, rev: 60000000, tb: 6000000, wb: 480000, aliases: ['Lecce'] },
      { id: 'fiorentina', name: 'Fiorentina', shortName: 'Fiorentina', rep: 81, rev: 160000000, tb: 22000000, wb: 1050000, aliases: ['Fiorentina'] },
      { id: 'monza', name: 'Monza', shortName: 'Monza', rep: 76, rev: 85000000, tb: 10000000, wb: 600000, aliases: ['Monza'] },
      { id: 'cagliari', name: 'Cagliari', shortName: 'Cagliari', rep: 75, rev: 75000000, tb: 8000000, wb: 550000, aliases: ['Cagliari'] },
      { id: 'genoa', name: 'Genoa', shortName: 'Genoa', rep: 77, rev: 95000000, tb: 12000000, wb: 650000, aliases: ['Genoa'] },
      { id: 'verona', name: 'Hellas Verona', shortName: 'Verona', rep: 75, rev: 70000000, tb: 7000000, wb: 520000, aliases: ['Hellas Verona', 'Verona'] },
      { id: 'parma', name: 'Parma', shortName: 'Parma', rep: 75, rev: 75000000, tb: 9000000, wb: 550000, aliases: ['Parma'] },
      { id: 'empoli', name: 'Empoli', shortName: 'Empoli', rep: 74, rev: 65000000, tb: 6000000, wb: 480000, aliases: ['Empoli'] },
      { id: 'udinese', name: 'Udinese', shortName: 'Udinese', rep: 76, rev: 90000000, tb: 10000000, wb: 620000, aliases: ['Udinese'] },
      { id: 'venezia', name: 'Venezia', shortName: 'Venezia', rep: 73, rev: 55000000, tb: 5000000, wb: 450000, aliases: ['Venezia'] },
    ],
  },
  // 6. ITALY - TIER 2: SERIE B (20 clubs)
  {
    id: 'serieb',
    name: 'Serie B',
    country: 'Italy',
    tier: 2,
    simulationTier: 'SHALLOW',
    totalMatchdays: 38,
    fc25LeagueName: 'Serie BKT',
    clubs: [
      { id: 'sassuolo', name: 'Sassuolo', shortName: 'Sassuolo', rep: 76, rev: 45000000, tb: 6000000, wb: 450000, aliases: ['Sassuolo'] },
      { id: 'sampdoria', name: 'Sampdoria', shortName: 'Sampdoria', rep: 74, rev: 38000000, tb: 3500000, wb: 380000, aliases: ['Sampdoria'] },
      { id: 'palermo', name: 'Palermo', shortName: 'Palermo', rep: 74, rev: 35000000, tb: 4000000, wb: 360000, aliases: ['Palermo'] },
      { id: 'cremonese', name: 'Cremonese', shortName: 'Cremonese', rep: 73, rev: 30000000, tb: 2500000, wb: 300000, aliases: ['Cremonese'] },
      { id: 'sudtirol', name: 'Südtirol', shortName: 'Südtirol', rep: 70, rev: 20000000, tb: 1200000, wb: 210000, aliases: ['Südtirol', 'FC Südtirol'] },
      { id: 'salernitana', name: 'Salernitana', shortName: 'Salernitana', rep: 73, rev: 32000000, tb: 3000000, wb: 320000, aliases: ['Salernitana'] },
      { id: 'pisa', name: 'Pisa', shortName: 'Pisa', rep: 72, rev: 26000000, tb: 2000000, wb: 260000, aliases: ['Pisa'] },
      { id: 'reggiana', name: 'Reggiana', shortName: 'Reggiana', rep: 70, rev: 20000000, tb: 1200000, wb: 210000, aliases: ['Reggiana'] },
      { id: 'frosinone', name: 'Frosinone', shortName: 'Frosinone', rep: 73, rev: 30000000, tb: 2500000, wb: 300000, aliases: ['Frosinone'] },
      { id: 'spezia', name: 'Spezia', shortName: 'Spezia', rep: 72, rev: 26000000, tb: 2000000, wb: 270000, aliases: ['Spezia'] },
      { id: 'modena', name: 'Modena', shortName: 'Modena', rep: 71, rev: 24000000, tb: 1500000, wb: 240000, aliases: ['Modena'] },
      { id: 'catanzaro', name: 'Catanzaro', shortName: 'Catanzaro', rep: 71, rev: 22000000, tb: 1500000, wb: 230000, aliases: ['Catanzaro'] },
      { id: 'bari', name: 'Bari', shortName: 'Bari', rep: 72, rev: 28000000, tb: 2000000, wb: 280000, aliases: ['Bari'] },
      { id: 'cesena', name: 'Cesena', shortName: 'Cesena', rep: 71, rev: 22000000, tb: 1500000, wb: 230000, aliases: ['Cesena'] },
      { id: 'brescia', name: 'Brescia', shortName: 'Brescia', rep: 72, rev: 27000000, tb: 2000000, wb: 270000, aliases: ['Brescia'] },
      { id: 'cosenza', name: 'Cosenza', shortName: 'Cosenza', rep: 70, rev: 19000000, tb: 1000000, wb: 200000, aliases: ['Cosenza'] },
      { id: 'cittadella', name: 'Cittadella', shortName: 'Cittadella', rep: 70, rev: 19000000, tb: 1000000, wb: 200000, aliases: ['Cittadella'] },
      { id: 'mantova', name: 'Mantova', shortName: 'Mantova', rep: 69, rev: 17000000, tb: 800000, wb: 180000, aliases: ['Mantova'] },
      { id: 'carrarese', name: 'Carrarese', shortName: 'Carrarese', rep: 68, rev: 15000000, tb: 600000, wb: 170000, aliases: ['Carrarese Calcio', 'Carrarese'] },
      { id: 'juvestabia', name: 'Juve Stabia', shortName: 'Juve Stabia', rep: 69, rev: 17000000, tb: 800000, wb: 180000, aliases: ['SS Juve Stabia', 'Juve Stabia'] },
    ],
  },
  // 7. GERMANY - TIER 1: BUNDESLIGA (18 clubs)
  {
    id: 'bundesliga',
    name: 'Bundesliga',
    country: 'Germany',
    tier: 1,
    simulationTier: 'DEEP',
    totalMatchdays: 34,
    fc25LeagueName: 'Bundesliga',
    clubs: [
      { id: 'bayern', name: 'FC Bayern München', shortName: 'Bayern', rep: 93, rev: 750000000, tb: 80000000, wb: 3500000, aliases: ['FC Bayern München', 'Bayern Munich', 'Bayern'] },
      { id: 'leverkusen', name: 'Bayer 04 Leverkusen', shortName: 'Leverkusen', rep: 88, rev: 350000000, tb: 45000000, wb: 2000000, aliases: ['Leverkusen', 'Bayer 04 Leverkusen', 'Bayer Leverkusen'] },
      { id: 'dortmund', name: 'Borussia Dortmund', shortName: 'Dortmund', rep: 88, rev: 450000000, tb: 50000000, wb: 2400000, aliases: ['Borussia Dortmund'] },
      { id: 'leipzig', name: 'RB Leipzig', shortName: 'Leipzig', rep: 86, rev: 380000000, tb: 45000000, wb: 2000000, aliases: ['RB Leipzig'] },
      { id: 'hoffenheim', name: 'TSG Hoffenheim', shortName: 'Hoffenheim', rep: 79, rev: 160000000, tb: 18000000, wb: 950000, aliases: ['TSG Hoffenheim', '1899 Hoffenheim'] },
      { id: 'freiburg', name: 'SC Freiburg', shortName: 'Freiburg', rep: 80, rev: 165000000, tb: 18000000, wb: 950000, aliases: ['SC Freiburg'] },
      { id: 'frankfurt', name: 'Eintracht Frankfurt', shortName: 'Frankfurt', rep: 83, rev: 240000000, tb: 30000000, wb: 1300000, aliases: ['Frankfurt', 'Eintracht Frankfurt'] },
      { id: 'stuttgart', name: 'VfB Stuttgart', shortName: 'Stuttgart', rep: 82, rev: 210000000, tb: 25000000, wb: 1200000, aliases: ['VfB Stuttgart', 'Stuttgart'] },
      { id: 'wolfsburg', name: 'VfL Wolfsburg', shortName: 'Wolfsburg', rep: 80, rev: 190000000, tb: 25000000, wb: 1100000, aliases: ['VfL Wolfsburg'] },
      { id: 'gladbach', name: "Borussia M'gladbach", shortName: 'Gladbach', rep: 80, rev: 175000000, tb: 18000000, wb: 1050000, aliases: ["M'gladbach", "Borussia M'gladbach"] },
      { id: 'unionberlin', name: '1. FC Union Berlin', shortName: 'Union Berlin', rep: 78, rev: 140000000, tb: 12000000, wb: 850000, aliases: ['Union Berlin', '1. FC Union Berlin'] },
      { id: 'mainz', name: '1. FSV Mainz 05', shortName: 'Mainz', rep: 77, rev: 120000000, tb: 10000000, wb: 750000, aliases: ['1. FSV Mainz 05', 'Mainz 05'] },
      { id: 'bremen', name: 'SV Werder Bremen', shortName: 'Bremen', rep: 78, rev: 140000000, tb: 14000000, wb: 850000, aliases: ['SV Werder Bremen', 'Werder Bremen'] },
      { id: 'augsburg', name: 'FC Augsburg', shortName: 'Augsburg', rep: 77, rev: 115000000, tb: 10000000, wb: 720000, aliases: ['FC Augsburg'] },
      { id: 'heidenheim', name: '1. FC Heidenheim', shortName: 'Heidenheim', rep: 76, rev: 90000000, tb: 8000000, wb: 600000, aliases: ['Heidenheim', '1. FC Heidenheim'] },
      { id: 'bochum', name: 'VfL Bochum', shortName: 'Bochum', rep: 75, rev: 90000000, tb: 7000000, wb: 600000, aliases: ['VfL Bochum 1848', 'VfL Bochum'] },
      { id: 'kiel', name: 'Holstein Kiel', shortName: 'Kiel', rep: 74, rev: 75000000, tb: 6000000, wb: 500000, aliases: ['Holstein Kiel'] },
      { id: 'stpauli', name: 'FC St. Pauli', shortName: 'St. Pauli', rep: 75, rev: 85000000, tb: 8000000, wb: 550000, aliases: ['FC St. Pauli'] },
    ],
  },
  // 8. GERMANY - TIER 2: 2. BUNDESLIGA (18 clubs)
  {
    id: 'bundesliga2',
    name: '2. Bundesliga',
    country: 'Germany',
    tier: 2,
    simulationTier: 'SHALLOW',
    totalMatchdays: 34,
    fc25LeagueName: 'Bundesliga 2',
    clubs: [
      { id: 'cologne', name: '1. FC Köln', shortName: 'Köln', rep: 76, rev: 55000000, tb: 6000000, wb: 480000, aliases: ['1. FC Köln'] },
      { id: 'hannover', name: 'Hannover 96', shortName: 'Hannover', rep: 74, rev: 40000000, tb: 4000000, wb: 360000, aliases: ['Hannover 96'] },
      { id: 'hertha', name: 'Hertha BSC', shortName: 'Hertha', rep: 75, rev: 45000000, tb: 5000000, wb: 420000, aliases: ['Hertha BSC'] },
      { id: 'hsv', name: 'Hamburger SV', shortName: 'HSV', rep: 75, rev: 50000000, tb: 6000000, wb: 450000, aliases: ['Hamburger SV'] },
      { id: 'nurnberg', name: '1. FC Nürnberg', shortName: 'Nürnberg', rep: 73, rev: 35000000, tb: 3000000, wb: 320000, aliases: ['1. FC Nürnberg'] },
      { id: 'darmstadt', name: 'SV Darmstadt 98', shortName: 'Darmstadt', rep: 74, rev: 38000000, tb: 3500000, wb: 350000, aliases: ['SV Darmstadt 98'] },
      { id: 'kaiserslautern', name: '1. FC Kaiserslautern', shortName: 'Lautern', rep: 73, rev: 32000000, tb: 2500000, wb: 300000, aliases: ['Kaiserslautern', '1. FC Kaiserslautern'] },
      { id: 'schalke', name: 'FC Schalke 04', shortName: 'Schalke', rep: 75, rev: 48000000, tb: 4500000, wb: 420000, aliases: ['FC Schalke 04'] },
      { id: 'karlsruhe', name: 'Karlsruher SC', shortName: 'Karlsruhe', rep: 73, rev: 30000000, tb: 2500000, wb: 280000, aliases: ['Karlsruher SC'] },
      { id: 'dusseldorf', name: 'Fortuna Düsseldorf', shortName: 'Düsseldorf', rep: 74, rev: 40000000, tb: 4000000, wb: 360000, aliases: ['Düsseldorf', 'Fortuna Düsseldorf'] },
      { id: 'braunschweig', name: 'Eintracht Braunschweig', shortName: 'Braunschweig', rep: 71, rev: 24000000, tb: 1500000, wb: 240000, aliases: ['Braunschweig', 'Eintracht Braunschweig'] },
      { id: 'muenster', name: 'Preußen Münster', shortName: 'Münster', rep: 69, rev: 18000000, tb: 1000000, wb: 190000, aliases: ['Preußen Münster'] },
      { id: 'fuerth', name: 'SpVgg Greuther Fürth', shortName: 'Fürth', rep: 73, rev: 30000000, tb: 2500000, wb: 280000, aliases: ['Fürth', 'SpVgg Greuther Fürth'] },
      { id: 'magdeburg', name: '1. FC Magdeburg', shortName: 'Magdeburg', rep: 72, rev: 26000000, tb: 2000000, wb: 250000, aliases: ['1. FC Magdeburg'] },
      { id: 'paderborn', name: 'SC Paderborn 07', shortName: 'Paderborn', rep: 73, rev: 28000000, tb: 2000000, wb: 270000, aliases: ['SC Paderborn 07'] },
      { id: 'elversberg', name: 'SV Elversberg', shortName: 'Elversberg', rep: 71, rev: 22000000, tb: 1500000, wb: 220000, aliases: ['SV Elversberg'] },
      { id: 'regensburg', name: 'SSV Jahn Regensburg', shortName: 'Regensburg', rep: 70, rev: 20000000, tb: 1200000, wb: 210000, aliases: ['Jahn Regensburg', 'SSV Jahn Regensburg'] },
      { id: 'ulm', name: 'SSV Ulm 1846', shortName: 'Ulm', rep: 69, rev: 18000000, tb: 1000000, wb: 190000, aliases: ['SSV Ulm 1846'] },
    ],
  },
  // 9. FRANCE - TIER 1: LIGUE 1 (18 clubs)
  {
    id: 'ligue1',
    name: 'Ligue 1 McDonald’s',
    country: 'France',
    tier: 1,
    simulationTier: 'DEEP',
    totalMatchdays: 34,
    fc25LeagueName: "Ligue 1 McDonald's",
    clubs: [
      { id: 'psg', name: 'Paris Saint-Germain', shortName: 'PSG', rep: 91, rev: 700000000, tb: 85000000, wb: 3200000, aliases: ['Paris SG', 'Paris Saint-Germain', 'PSG'] },
      { id: 'lyon', name: 'Olympique Lyonnais', shortName: 'Lyon', rep: 82, rev: 220000000, tb: 25000000, wb: 1200000, aliases: ['OL', 'Olympique Lyonnais', 'Lyon'] },
      { id: 'lens', name: 'RC Lens', shortName: 'Lens', rep: 80, rev: 150000000, tb: 18000000, wb: 850000, aliases: ['RC Lens', 'Lens'] },
      { id: 'lille', name: 'LOSC Lille', shortName: 'Lille', rep: 82, rev: 180000000, tb: 22000000, wb: 1050000, aliases: ['LOSC Lille', 'Lille'] },
      { id: 'monaco', name: 'AS Monaco', shortName: 'Monaco', rep: 84, rev: 240000000, tb: 35000000, wb: 1400000, aliases: ['AS Monaco', 'Monaco'] },
      { id: 'nice', name: 'OGC Nice', shortName: 'Nice', rep: 80, rev: 160000000, tb: 20000000, wb: 950000, aliases: ['OGC Nice', 'Nice'] },
      { id: 'marseille', name: 'Olympique de Marseille', shortName: 'Marseille', rep: 83, rev: 250000000, tb: 30000000, wb: 1350000, aliases: ['OM', 'Olympique de Marseille', 'Marseille'] },
      { id: 'montpellier', name: 'Montpellier HSC', shortName: 'Montpellier', rep: 76, rev: 90000000, tb: 8000000, wb: 580000, aliases: ['Montpellier', 'Montpellier HSC'] },
      { id: 'brest', name: 'Stade Brestois 29', shortName: 'Brest', rep: 78, rev: 110000000, tb: 12000000, wb: 700000, aliases: ['Stade Brestois 29', 'Brest'] },
      { id: 'strasbourg', name: 'RC Strasbourg Alsace', shortName: 'Strasbourg', rep: 77, rev: 105000000, tb: 15000000, wb: 680000, aliases: ['Strasbourg', 'RC Strasbourg Alsace'] },
      { id: 'rennes', name: 'Stade Rennais FC', shortName: 'Rennes', rep: 81, rev: 170000000, tb: 22000000, wb: 1000000, aliases: ['Stade Rennais FC', 'Rennes'] },
      { id: 'reims', name: 'Stade de Reims', shortName: 'Reims', rep: 77, rev: 100000000, tb: 10000000, wb: 650000, aliases: ['Stade de Reims', 'Reims'] },
      { id: 'toulouse', name: 'Toulouse FC', shortName: 'Toulouse', rep: 76, rev: 95000000, tb: 9000000, wb: 600000, aliases: ['Toulouse FC', 'Toulouse'] },
      { id: 'nantes', name: 'FC Nantes', shortName: 'Nantes', rep: 76, rev: 90000000, tb: 8000000, wb: 580000, aliases: ['FC Nantes', 'Nantes'] },
      { id: 'saintetienne', name: 'AS Saint-Étienne', shortName: 'Saint-Étienne', rep: 75, rev: 85000000, tb: 7000000, wb: 550000, aliases: ['AS Saint-Étienne', 'Saint-Étienne'] },
      { id: 'lehavre', name: 'Le Havre AC', shortName: 'Le Havre', rep: 74, rev: 75000000, tb: 6000000, wb: 480000, aliases: ['Havre AC', 'Le Havre AC', 'Le Havre'] },
      { id: 'auxerre', name: 'AJ Auxerre', shortName: 'Auxerre', rep: 74, rev: 75000000, tb: 6000000, wb: 480000, aliases: ['AJ Auxerre', 'Auxerre'] },
      { id: 'angers', name: 'Angers SCO', shortName: 'Angers', rep: 73, rev: 65000000, tb: 5000000, wb: 450000, aliases: ['Angers SCO', 'Angers'] },
    ],
  },
  // 10. FRANCE - TIER 2: LIGUE 2 (18 clubs)
  {
    id: 'ligue2',
    name: 'Ligue 2 BKT',
    country: 'France',
    tier: 2,
    simulationTier: 'SHALLOW',
    totalMatchdays: 34,
    fc25LeagueName: 'Ligue 2 BKT',
    clubs: [
      { id: 'lorient', name: 'FC Lorient', shortName: 'Lorient', rep: 75, rev: 35000000, tb: 3500000, wb: 320000, aliases: ['FC Lorient', 'Lorient'] },
      { id: 'parisfc', name: 'Paris FC', shortName: 'Paris FC', rep: 73, rev: 28000000, tb: 2500000, wb: 260000, aliases: ['Paris FC'] },
      { id: 'clermont', name: 'Clermont Foot 63', shortName: 'Clermont', rep: 74, rev: 30000000, tb: 3000000, wb: 280000, aliases: ['Clermont Foot 63', 'Clermont'] },
      { id: 'metz', name: 'FC Metz', shortName: 'Metz', rep: 74, rev: 32000000, tb: 3000000, wb: 290000, aliases: ['FC Metz', 'Metz'] },
      { id: 'caen', name: 'SM Caen', shortName: 'Caen', rep: 72, rev: 25000000, tb: 2000000, wb: 240000, aliases: ['SM Caen', 'Caen'] },
      { id: 'grenoble', name: 'Grenoble Foot 38', shortName: 'Grenoble', rep: 71, rev: 20000000, tb: 1500000, wb: 210000, aliases: ['Grenoble Foot 38', 'Grenoble'] },
      { id: 'dunkerque', name: 'USL Dunkerque', shortName: 'Dunkerque', rep: 70, rev: 18000000, tb: 1000000, wb: 190000, aliases: ['USL Dunkerque'] },
      { id: 'redstar', name: 'Red Star FC', shortName: 'Red Star', rep: 70, rev: 18000000, tb: 1000000, wb: 190000, aliases: ['Red Star FC'] },
      { id: 'amiens', name: 'Amiens SC', shortName: 'Amiens', rep: 71, rev: 22000000, tb: 1500000, wb: 220000, aliases: ['Amiens SC', 'Amiens'] },
      { id: 'pau', name: 'Pau FC', shortName: 'Pau', rep: 70, rev: 18000000, tb: 1000000, wb: 190000, aliases: ['Pau FC'] },
      { id: 'laval', name: 'Stade Lavallois', shortName: 'Laval', rep: 71, rev: 20000000, tb: 1200000, wb: 210000, aliases: ['Laval MFC', 'Stade Lavallois', 'Laval'] },
      { id: 'troyes', name: 'ESTAC Troyes', shortName: 'Troyes', rep: 72, rev: 24000000, tb: 2000000, wb: 240000, aliases: ['ESTAC Troyes', 'Troyes'] },
      { id: 'ajaccio', name: 'AC Ajaccio', shortName: 'Ajaccio', rep: 71, rev: 20000000, tb: 1500000, wb: 210000, aliases: ['AC Ajaccio', 'Ajaccio'] },
      { id: 'martigues', name: 'FC Martigues', shortName: 'Martigues', rep: 69, rev: 16000000, tb: 800000, wb: 170000, aliases: ['FC Martigues'] },
      { id: 'guingamp', name: 'EA Guingamp', shortName: 'Guingamp', rep: 72, rev: 25000000, tb: 2000000, wb: 240000, aliases: ['En Avant Guingamp', 'EA Guingamp', 'Guingamp'] },
      { id: 'bastia', name: 'SC Bastia', shortName: 'Bastia', rep: 71, rev: 22000000, tb: 1500000, wb: 220000, aliases: ['SC Bastia', 'Bastia'] },
      { id: 'rodez', name: 'Rodez AF', shortName: 'Rodez', rep: 70, rev: 18000000, tb: 1000000, wb: 190000, aliases: ['Rodez AF'] },
      { id: 'annecy', name: 'FC Annecy', shortName: 'Annecy', rep: 70, rev: 18000000, tb: 1000000, wb: 190000, aliases: ['FC Annecy'] },
    ],
  },
];

// Helper math & string functions
function clamp(val, min = 1, max = 99) {
  const num = Math.round(Number(val) || 0);
  return Math.max(min, Math.min(max, num));
}

function normalizePos(pos) {
  if (!pos) return 'CM';
  const p = pos.toUpperCase().trim();
  if (['ST', 'CF'].includes(p)) return 'ST';
  if (['LW', 'LF'].includes(p)) return 'LW';
  if (['RW', 'RF'].includes(p)) return 'RW';
  if (['CAM'].includes(p)) return 'CAM';
  if (['CM'].includes(p)) return 'CM';
  if (['CDM'].includes(p)) return 'CDM';
  if (['LM'].includes(p)) return 'LM';
  if (['RM'].includes(p)) return 'RM';
  if (['LB', 'LWB'].includes(p)) return 'LB';
  if (['RB', 'RWB'].includes(p)) return 'RB';
  if (['CB'].includes(p)) return 'CB';
  if (['GK'].includes(p)) return 'GK';
  return 'CM';
}

function calculateOvr(attrs, position) {
  const { attacking: ATT, creative: CRE, defending: DEF, physical: PHY, mental: MEN } = attrs;
  let rawOvr;
  switch (position) {
    case 'ST':
    case 'LW':
    case 'RW':
      rawOvr = ATT * 0.40 + PHY * 0.25 + CRE * 0.20 + MEN * 0.15;
      break;
    case 'CAM':
    case 'CM':
    case 'LM':
    case 'RM':
      rawOvr = CRE * 0.40 + ATT * 0.20 + PHY * 0.20 + MEN * 0.20;
      break;
    case 'CDM':
    case 'CB':
    case 'LB':
    case 'RB':
      rawOvr = DEF * 0.45 + PHY * 0.25 + MEN * 0.20 + CRE * 0.10;
      break;
    case 'GK':
      rawOvr = DEF * 0.50 + MEN * 0.30 + PHY * 0.20;
      break;
    default:
      rawOvr = (ATT + CRE + DEF + PHY + MEN) / 5;
  }
  return clamp(rawOvr);
}

// Build fast mapping: (fc25LeagueName, fc25TeamName) -> clubId
const leagueTeamMap = new Map();
const clubsMaster = {};
const competitionsMaster = {};

LEAGUE_DEFINITIONS.forEach(league => {
  const compClubIds = [];

  league.clubs.forEach(cDef => {
    compClubIds.push(cDef.id);

    // Build club entity
    clubsMaster[cDef.id] = {
      id: cDef.id,
      name: cDef.name,
      shortName: cDef.shortName,
      crestUrl: `/crests/${cDef.id}.svg`,
      leagueId: league.id,
      reputation: cDef.rep,
      dna: cDef.rep >= 88 ? 'GALACTICO' : (cDef.rep >= 80 ? 'HYBRID_LEGACY' : 'MONEYBALL'),
      rivalClubIds: [],
      boardTrust: 80,
      boardObjectives: [
        {
          id: `obj-${cDef.id}-1`,
          type: 'LEAGUE',
          description: league.tier === 1 ? 'Compete for European Qualification / Domestic Glory' : 'Fight for Promotion to Top Flight',
          weight: 50,
          targetProgress: league.totalMatchdays,
          currentProgress: 0,
          isCompleted: false,
        },
        {
          id: `obj-${cDef.id}-2`,
          type: 'FINANCIAL',
          description: 'Maintain Squad Cost Ratio below 70%',
          weight: 50,
          targetProgress: 70,
          currentProgress: 62,
          isCompleted: true,
        },
      ],
      tactics: {
        formation: cDef.rep >= 86 ? '4-3-3' : (cDef.rep >= 80 ? '4-2-3-1' : '4-4-2'),
        archetype: cDef.rep >= 86 ? 'TIKI_TAKA' : (cDef.rep >= 80 ? 'GEGENPRESS' : 'DIRECT_COUNTER'),
        defensiveLine: cDef.rep >= 84 ? 'HIGH' : 'BALANCED',
        pressingIntensity: cDef.rep >= 84 ? 'RELENTLESS' : 'BALANCED',
        buildUpSpeed: 'BALANCED',
        pitchWidth: 'BALANCED',
        roleToggles: { invertedFullbacks: false, poacherFocus: true, sweeperKeeper: false },
      },
      facilities: {
        stadiumCapacity: Math.round(cDef.rep * 750),
        stadiumExecutiveBoxes: Math.round(cDef.rep * 2),
        stadiumAtmosphereLevel: Math.min(5, Math.max(2, Math.round(cDef.rep / 20))),
        commercialMegastoreLevel: Math.min(5, Math.max(2, Math.round(cDef.rep / 20))),
        trainingGroundLevel: Math.min(5, Math.max(2, Math.round(cDef.rep / 20))),
        medicalCenterLevel: Math.min(5, Math.max(2, Math.round(cDef.rep / 20))),
        youthAcademyLevel: Math.min(5, Math.max(2, Math.round(cDef.rep / 20))),
      },
      finances: {
        balance: Math.round(cDef.tb * 1.5),
        transferBudget: cDef.tb,
        wageBudgetWeekly: cDef.wb,
        allocatedFeePercentage: 60,
        annualOperatingRevenue: cDef.rev,
        squadCostRatio: 0.62,
        activeLoans: [],
        economicLeversSoldPercentage: 0,
      },
      relationsWithUser: 0,
    };

    // Register all aliases under this league
    const allNames = [cDef.name, cDef.shortName, ...(cDef.aliases || [])];
    allNames.forEach(alias => {
      const key = `${league.fc25LeagueName}::${alias.toLowerCase().trim()}`;
      leagueTeamMap.set(key, cDef.id);
    });
  });

  // Build competition entity with clean table
  competitionsMaster[league.id] = {
    id: league.id,
    name: league.name,
    country: league.country,
    tier: league.tier,
    simulationTier: league.simulationTier,
    clubIds: compClubIds,
    currentMatchday: 1,
    totalMatchdays: league.totalMatchdays,
    table: compClubIds.map(cId => ({
      clubId: cId,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
      form: [],
    })),
  };
});

console.log(`[CONFIG] Configured ${Object.keys(clubsMaster).length} clubs across ${Object.keys(competitionsMaster).length} leagues.`);

const allPlayers = {};
const clubRosters = {};
Object.keys(clubsMaster).forEach(cId => { clubRosters[cId] = []; });

console.log('[READ] Streaming male_players_fc25.csv...');

let rowCount = 0;
let ingestedCount = 0;

fs.createReadStream(CSV_FILE)
  .pipe(csv())
  .on('data', (row) => {
    rowCount++;
    const rawLeague = (row.League || '').trim();
    const rawTeam = (row.Team || '').trim();
    if (!rawLeague || !rawTeam) return;

    const lookupKey = `${rawLeague}::${rawTeam.toLowerCase()}`;
    const clubId = leagueTeamMap.get(lookupKey);
    if (!clubId || !clubsMaster[clubId]) return;

    const name = (row.Name || '').trim();
    if (!name) return;

    const age = parseInt(row.Age, 10) || 24;
    const overall = parseInt(row.OVR, 10) || 75;
    const pos = normalizePos(row.Position);

    // Extract Granular Stats
    const acceleration = parseInt(row.Acceleration, 10) || parseInt(row.PAC, 10) || overall;
    const sprintSpeed = parseInt(row['Sprint Speed'], 10) || parseInt(row.PAC, 10) || overall;
    const positioning = parseInt(row.Positioning, 10) || parseInt(row.SHO, 10) || overall;
    const finishing = parseInt(row.Finishing, 10) || parseInt(row.SHO, 10) || overall;
    const shotPower = parseInt(row['Shot Power'], 10) || parseInt(row.SHO, 10) || overall;
    const longShots = parseInt(row['Long Shots'], 10) || parseInt(row.SHO, 10) || overall;
    const volleys = parseInt(row.Volleys, 10) || parseInt(row.SHO, 10) || overall;
    
    const vision = parseInt(row.Vision, 10) || parseInt(row.PAS, 10) || overall;
    const crossing = parseInt(row.Crossing, 10) || parseInt(row.PAS, 10) || overall;
    const shortPassing = parseInt(row['Short Passing'], 10) || parseInt(row.PAS, 10) || overall;
    const longPassing = parseInt(row['Long Passing'], 10) || parseInt(row.PAS, 10) || overall;
    const curve = parseInt(row.Curve, 10) || parseInt(row.PAS, 10) || overall;

    const defAwareness = parseInt(row['Def Awareness'], 10) || parseInt(row.DEF, 10) || 50;
    const standingTackle = parseInt(row['Standing Tackle'], 10) || parseInt(row.DEF, 10) || 50;
    const slidingTackle = parseInt(row['Sliding Tackle'], 10) || parseInt(row.DEF, 10) || 45;
    const interceptions = parseInt(row.Interceptions, 10) || parseInt(row.DEF, 10) || 50;

    const stamina = parseInt(row.Stamina, 10) || parseInt(row.PHY, 10) || 70;
    const strength = parseInt(row.Strength, 10) || parseInt(row.PHY, 10) || 70;
    const jumping = parseInt(row.Jumping, 10) || 65;
    const composure = parseInt(row.Composure, 10) || overall;
    const reactions = parseInt(row.Reactions, 10) || overall;

    let attacking, creative, defending, physical, mental;

    if (pos === 'GK') {
      // Authentic Goalkeeper Calibration
      attacking = clamp(Math.round(finishing * 0.2 + shotPower * 0.4), 15, 45);
      creative = clamp(Math.round(shortPassing * 0.5 + longPassing * 0.3 + vision * 0.2), 25, 75);
      // Defending represents GK shot-stopping/handling
      defending = overall;
      physical = clamp(Math.round(jumping * 0.35 + strength * 0.25 + reactions * 0.25 + stamina * 0.15), 45, 95);
      mental = clamp(Math.round(composure * 0.50 + reactions * 0.50), 50, 95);
    } else {
      attacking = clamp(Math.round(finishing * 0.45 + positioning * 0.25 + shotPower * 0.20 + volleys * 0.10));
      creative = clamp(Math.round(vision * 0.35 + shortPassing * 0.30 + longPassing * 0.15 + crossing * 0.10 + curve * 0.10));
      defending = clamp(Math.round(standingTackle * 0.35 + interceptions * 0.30 + defAwareness * 0.25 + slidingTackle * 0.10));
      physical = clamp(Math.round(sprintSpeed * 0.30 + acceleration * 0.20 + stamina * 0.25 + strength * 0.15 + jumping * 0.10));
      mental = clamp(Math.round(composure * 0.45 + reactions * 0.35 + positioning * 0.20));
    }

    // Calibrate attributes slightly so calculateOvr matches listed OVR perfectly
    let attrs = { attacking, creative, defending, physical, mental };
    let calculated = calculateOvr(attrs, pos);
    let diff = overall - calculated;
    if (diff !== 0) {
      if (pos === 'GK') {
        attrs.defending = clamp(attrs.defending + Math.round(diff * 1.5));
      } else if (['ST', 'LW', 'RW'].includes(pos)) {
        attrs.attacking = clamp(attrs.attacking + Math.round(diff * 1.5));
      } else if (['CAM', 'CM', 'LM', 'RM'].includes(pos)) {
        attrs.creative = clamp(attrs.creative + Math.round(diff * 1.5));
      } else {
        attrs.defending = clamp(attrs.defending + Math.round(diff * 1.5));
      }
    }

    // Traits
    const clutch = clamp(Math.round(((composure * 0.6 + reactions * 0.4) / 99) * 20), 1, 20);
    const consistency = clamp(Math.round((composure / 99) * 16) + (overall >= 85 ? 4 : 2), 1, 20);
    const adaptability = clamp(Math.round(10 + (composure > 80 ? 3 : 0)), 6, 20);

    const attRate = (row['Att work rate'] || 'Medium').toUpperCase();
    const workRate = ['HIGH', 'LOW'].includes(attRate) ? attRate : 'MEDIUM';
    const injuryProneness = stamina < 65 ? 'FRAGILE' : (stamina > 85 ? 'LOW' : 'NORMAL');

    // Dynamic Potential
    let dynamicPotential = overall;
    if (age <= 21) {
      dynamicPotential = Math.min(99, overall + Math.max(4, Math.round((26 - age) * 2.2)));
    } else if (age <= 25) {
      dynamicPotential = Math.min(99, overall + Math.max(1, Math.round((28 - age) * 1.2)));
    }
    // High-profile young talents custom potential
    if (name.toLowerCase().includes('yamal')) dynamicPotential = 95;
    if (name.toLowerCase().includes('endrick')) dynamicPotential = 93;
    if (name.toLowerCase().includes('bellingham')) dynamicPotential = 95;
    if (name.toLowerCase().includes('musiala')) dynamicPotential = 94;
    if (name.toLowerCase().includes('wirtz')) dynamicPotential = 94;

    const potentialCap = Math.min(99, dynamicPotential + 3);

    // Realistic Modern Market Values
    let baseMarketValue = 0;
    if (overall >= 90) baseMarketValue = 110000000 + (overall - 90) * 35000000;
    else if (overall >= 85) baseMarketValue = 45000000 + (overall - 85) * 12000000;
    else if (overall >= 80) baseMarketValue = 18000000 + (overall - 80) * 5000000;
    else if (overall >= 75) baseMarketValue = 6000000 + (overall - 75) * 2200000;
    else if (overall >= 70) baseMarketValue = 2000000 + (overall - 70) * 800000;
    else baseMarketValue = 400000 + Math.max(0, overall - 60) * 150000;

    const ageMultiplier = age <= 21 ? 1.45 : (age <= 25 ? 1.25 : (age <= 29 ? 1.0 : Math.max(0.25, 1 - (age - 29) * 0.12)));
    const marketValue = Math.round(baseMarketValue * ageMultiplier);

    // Weekly Wages scaled proportionally to club wage budget tier
    const clubWb = clubsMaster[clubId].finances.wageBudgetWeekly;
    let wageRatio = 0.015; // default ~1.5% of squad budget
    if (overall >= 90) wageRatio = 0.10;
    else if (overall >= 85) wageRatio = 0.07;
    else if (overall >= 80) wageRatio = 0.045;
    else if (overall >= 75) wageRatio = 0.025;
    else wageRatio = 0.012;

    const wagePerWeek = Math.max(3000, Math.round(clubWb * wageRatio));

    // Parse secondary positions
    const secondaryPositions = [];
    const altPosRaw = row['Alternative positions'] || '';
    if (altPosRaw) {
      altPosRaw.split(',').forEach(pStr => {
        const pNorm = normalizePos(pStr);
        if (pNorm && pNorm !== pos && !secondaryPositions.includes(pNorm)) {
          secondaryPositions.push(pNorm);
        }
      });
    }

    const cleanSlug = name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 14);
    const uniqueRowId = (row['Unnamed: 0'] !== undefined && row['Unnamed: 0'] !== '') ? row['Unnamed: 0'] : ingestedCount;
    const playerId = `p-${clubId}-${cleanSlug}-${uniqueRowId}`;

    const playerEntity = {
      id: playerId,
      clubId,
      name,
      fullName: name,
      photoUrl: row.url || '',
      nationality: row.Nation || 'Europe',
      age,
      primaryPosition: pos,
      secondaryPositions,
      reputation: Math.max(30, overall - 4),
      attributes: attrs,
      traits: { clutch, consistency, adaptability, workRate, injuryProneness },
      overallRating: overall,
      dynamicPotential,
      potentialCap,
      sharpness: 90,
      stamina,
      morale: 88,
      formHistory: [7.2, 7.4, 7.1, 7.5, 7.3],
      settlementProgress: 0.95,
      daysAtClub: 365,
      isRetraining: false,
      wagePerWeek,
      contractYearsLeft: Math.min(5, Math.max(1, 35 - age)),
      releaseClause: overall >= 80 ? marketValue * 2 : null,
      marketValue,
      amortizationAnnualCost: Math.round(marketValue / 4),
      squadRole: overall >= 85 ? 'STAR' : (overall >= 80 ? 'IMPORTANT' : (overall >= 74 ? 'ROTATION' : 'PROSPECT')),
      unsettledStage: 0,
      isStarter: false,
    };

    allPlayers[playerEntity.id] = playerEntity;
    clubRosters[clubId].push(playerEntity);
    ingestedCount++;
  })
  .on('end', () => {
    console.log(`[CSV STREAM COMPLETE] Ingested ${ingestedCount} players across ${Object.keys(clubsMaster).length} clubs.`);

    // 2. ROSTER ENRICHMENT: Ensure all clubs have at least 22 players and at least 2 GKs
    const DOMESTIC_NAMES = {
      Spain: { first: ['Alejandro', 'Pablo', 'Mateo', 'Lucas', 'Hugo', 'David', 'Adrián', 'Álvaro', 'Sergio', 'Daniel', 'Marcos', 'Javier'], last: ['García', 'Martínez', 'López', 'González', 'Rodríguez', 'Fernández', 'Navarro', 'Torres', 'Domínguez', 'Vázquez'] },
      England: { first: ['Harry', 'George', 'Jack', 'Oliver', 'Noah', 'Leo', 'Arthur', 'Charlie', 'Freddie', 'Archie', 'Henry', 'Edward'], last: ['Smith', 'Jones', 'Taylor', 'Brown', 'Williams', 'Wilson', 'Johnson', 'Davies', 'Robinson', 'Wright'] },
      Italy: { first: ['Leonardo', 'Francesco', 'Alessandro', 'Lorenzo', 'Mattia', 'Andrea', 'Gabriele', 'Tommaso', 'Riccardo', 'Edoardo'], last: ['Rossi', 'Russo', 'Ferrari', 'Esposito', 'Bianchi', 'Romano', 'Colombo', 'Ricci', 'Marino', 'Greco'] },
      Germany: { first: ['Noah', 'Matteo', 'Leon', 'Finn', 'Paul', 'Elias', 'Jonas', 'Lukas', 'Felix', 'Maximilian', 'Julian', 'Moritz'], last: ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Schulz', 'Hoffmann'] },
      France: { first: ['Gabriel', 'Léo', 'Raphaël', 'Louis', 'Arthur', 'Jules', 'Maël', 'Lucas', 'Adam', 'Hugo', 'Noah', 'Gaspard'], last: ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau'] },
    };

    const POS_FILL_SEQUENCE = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'RW', 'LW', 'ST', 'CB', 'CM'];

    Object.keys(clubsMaster).forEach(cId => {
      const roster = clubRosters[cId] || [];
      const club = clubsMaster[cId];
      const country = LEAGUE_DEFINITIONS.find(l => l.id === club.leagueId)?.country || 'Spain';
      const namePool = DOMESTIC_NAMES[country] || DOMESTIC_NAMES.Spain;

      // Ensure at least 2 GKs
      let gkCount = roster.filter(p => p.primaryPosition === 'GK').length;
      while (gkCount < 2) {
        const fName = namePool.first[Math.floor(Math.random() * namePool.first.length)];
        const lName = namePool.last[Math.floor(Math.random() * namePool.last.length)];
        const genName = `${fName} ${lName}`;
        const genAge = Math.floor(Math.random() * 5) + 18;
        const genOvr = Math.max(58, club.reputation - 12 - Math.floor(Math.random() * 4));
        
        const genGk = {
          id: `p-${cId}-gk-${roster.length + 1}`,
          clubId: cId,
          name: genName,
          fullName: genName,
          photoUrl: '',
          nationality: country,
          age: genAge,
          primaryPosition: 'GK',
          secondaryPositions: [],
          reputation: Math.max(30, genOvr - 6),
          attributes: { attacking: 20, creative: 45, defending: genOvr, physical: genOvr - 5, mental: genOvr - 5 },
          traits: { clutch: 12, consistency: 12, adaptability: 14, workRate: 'MEDIUM', injuryProneness: 'NORMAL' },
          overallRating: genOvr,
          dynamicPotential: Math.min(90, genOvr + 8),
          potentialCap: Math.min(95, genOvr + 12),
          sharpness: 85,
          stamina: 80,
          morale: 85,
          formHistory: [7.0, 7.0, 7.0],
          settlementProgress: 1.0,
          daysAtClub: 300,
          isRetraining: false,
          wagePerWeek: Math.max(2500, Math.round(club.finances.wageBudgetWeekly * 0.01)),
          contractYearsLeft: 3,
          releaseClause: null,
          marketValue: Math.round(Math.pow(genOvr / 10, 4) * 1500),
          amortizationAnnualCost: 0,
          squadRole: 'PROSPECT',
          unsettledStage: 0,
          isStarter: false,
        };
        allPlayers[genGk.id] = genGk;
        roster.push(genGk);
        gkCount++;
      }

      // Ensure at least 22 players total
      let fillIdx = 0;
      while (roster.length < 22) {
        const genPos = POS_FILL_SEQUENCE[fillIdx % POS_FILL_SEQUENCE.length];
        fillIdx++;
        if (genPos === 'GK') continue; // GKs already satisfied

        const fName = namePool.first[Math.floor(Math.random() * namePool.first.length)];
        const lName = namePool.last[Math.floor(Math.random() * namePool.last.length)];
        const genName = `${fName} ${lName}`;
        const genAge = Math.floor(Math.random() * 6) + 18;
        const genOvr = Math.max(58, club.reputation - 10 - Math.floor(Math.random() * 4));

        const baseVal = genOvr;
        const genPlayer = {
          id: `p-${cId}-acad-${roster.length + 1}`,
          clubId: cId,
          name: genName,
          fullName: genName,
          photoUrl: '',
          nationality: country,
          age: genAge,
          primaryPosition: genPos,
          secondaryPositions: [],
          reputation: Math.max(30, genOvr - 6),
          attributes: {
            attacking: ['ST', 'RW', 'LW'].includes(genPos) ? baseVal + 3 : baseVal - 4,
            creative: ['CM', 'CAM', 'LM', 'RM'].includes(genPos) ? baseVal + 3 : baseVal - 3,
            defending: ['CB', 'LB', 'RB', 'CDM'].includes(genPos) ? baseVal + 3 : baseVal - 5,
            physical: baseVal,
            mental: baseVal - 2,
          },
          traits: { clutch: 12, consistency: 12, adaptability: 14, workRate: 'MEDIUM', injuryProneness: 'NORMAL' },
          overallRating: genOvr,
          dynamicPotential: Math.min(90, genOvr + 9),
          potentialCap: Math.min(95, genOvr + 12),
          sharpness: 85,
          stamina: 80,
          morale: 85,
          formHistory: [7.0, 7.0, 7.0],
          settlementProgress: 1.0,
          daysAtClub: 300,
          isRetraining: false,
          wagePerWeek: Math.max(2500, Math.round(club.finances.wageBudgetWeekly * 0.01)),
          contractYearsLeft: 3,
          releaseClause: null,
          marketValue: Math.round(Math.pow(genOvr / 10, 4) * 1500),
          amortizationAnnualCost: 0,
          squadRole: 'PROSPECT',
          unsettledStage: 0,
          isStarter: false,
        };
        allPlayers[genPlayer.id] = genPlayer;
        roster.push(genPlayer);
      }
    });

    // 3. FORMATION-AWARE STARTING XI SELECTION
    console.log('[TACTICS] Assigning position-aware Starting XIs across all 198 clubs...');

    const FORMATION_SLOTS = {
      '4-3-3': ['GK', 'RB', 'CB', 'CB', 'LB', 'CDM', 'CM', 'CAM', 'RW', 'ST', 'LW'],
      '4-2-3-1': ['GK', 'RB', 'CB', 'CB', 'LB', 'CDM', 'CDM', 'CAM', 'RW', 'ST', 'LW'],
      '4-4-2': ['GK', 'RB', 'CB', 'CB', 'LB', 'RM', 'CM', 'CM', 'LM', 'ST', 'ST'],
      '5-3-2': ['GK', 'RB', 'CB', 'CB', 'CB', 'LB', 'CM', 'CDM', 'CM', 'ST', 'ST'],
    };

    Object.keys(clubsMaster).forEach(cId => {
      const roster = clubRosters[cId] || [];
      const formation = clubsMaster[cId].tactics.formation || '4-3-3';
      const slots = FORMATION_SLOTS[formation] || FORMATION_SLOTS['4-3-3'];

      // Reset starters
      roster.forEach(p => { p.isStarter = false; });

      // If Barcelona, ensure authentic starting XI
      if (cId === 'barcelona') {
        const barcaKeyNames = [
          'Marc-André ter Stegen',
          'Jules Koundé',
          'Ronald Araújo',
          'Pau Cubarsí',
          'Alejandro Balde',
          'Marc Casadó',
          'Pedri',
          'Dani Olmo',
          'Lamine Yamal',
          'Raphinha',
          'Robert Lewandowski'
        ];

        barcaKeyNames.forEach(kName => {
          const match = roster.find(p => p.name.toLowerCase().includes(kName.toLowerCase()) || kName.toLowerCase().includes(p.name.toLowerCase()));
          if (match) match.isStarter = true;
        });

        // Ensure 11
        if (roster.filter(p => p.isStarter).length < 11) {
          roster.sort((a, b) => b.overallRating - a.overallRating);
          roster.filter(p => !p.isStarter).slice(0, 11 - roster.filter(p => p.isStarter).length).forEach(p => { p.isStarter = true; });
        }
      } else {
        // Formation-aware slot assignment
        const available = [...roster];
        const starters = [];

        slots.forEach(slotPos => {
          // Find best matching player for slotPos
          available.sort((a, b) => b.overallRating - a.overallRating);
          let matchIdx = available.findIndex(p => p.primaryPosition === slotPos);
          
          if (matchIdx === -1) {
            // Check secondary positions
            matchIdx = available.findIndex(p => p.secondaryPositions.includes(slotPos));
          }
          if (matchIdx === -1) {
            // General group match
            if (['CB', 'LB', 'RB'].includes(slotPos)) {
              matchIdx = available.findIndex(p => ['CB', 'LB', 'RB'].includes(p.primaryPosition));
            } else if (['CDM', 'CM', 'CAM', 'LM', 'RM'].includes(slotPos)) {
              matchIdx = available.findIndex(p => ['CDM', 'CM', 'CAM', 'LM', 'RM'].includes(p.primaryPosition));
            } else if (['ST', 'LW', 'RW'].includes(slotPos)) {
              matchIdx = available.findIndex(p => ['ST', 'LW', 'RW'].includes(p.primaryPosition));
            }
          }
          if (matchIdx === -1) {
            matchIdx = 0;
          }
          if (available.length > 0 && available[matchIdx]) {
            const chosen = available.splice(matchIdx, 1)[0];
            starters.push(chosen);
          }
        });

        // Explicitly set isStarter on selected starters
        starters.forEach(p => {
          p.isStarter = true;
          if (allPlayers[p.id]) allPlayers[p.id].isStarter = true;
        });

        if (cId === 'burgos') {
          console.log('[DEBUG BURGOS] starters length:', starters.length);
          console.log('[DEBUG BURGOS] starters:', starters.map(p => ({ id: p.id, name: p.name, pos: p.primaryPosition })));
        }

        // Fail-safe: ensure exactly 11 starters
        const currentStarters = roster.filter(p => p.isStarter);
        if (currentStarters.length < 11) {
          console.warn(`[WARNING] ${cId} had only ${currentStarters.length} starters. Adding ${11 - currentStarters.length} more.`);
          roster.sort((a, b) => b.overallRating - a.overallRating);
          roster.filter(p => !p.isStarter).slice(0, 11 - currentStarters.length).forEach(p => {
            p.isStarter = true;
            if (allPlayers[p.id]) allPlayers[p.id].isStarter = true;
          });
        }
        const finalCount = roster.filter(p => p.isStarter).length;
        if (finalCount !== 11) {
          console.error(`[ERROR] ${cId} ended with ${finalCount} starters!`);
        }
      }

      // Sync roster starter state directly back into allPlayers to ensure 100% coherence
      roster.forEach(p => {
        if (allPlayers[p.id]) {
          allPlayers[p.id].isStarter = p.isStarter;
        }
      });
    });

    // 4. ROUND-ROBIN FIXTURES (Berger algorithm)
    console.log('[SCHEDULER] Generating league fixtures...');
    const fixturesMaster = [];

    function generateBerger(competitionId, clubIds, startDate = '2026-08-15') {
      const teams = [...clubIds];
      if (teams.length % 2 !== 0) teams.push('BYE');
      const n = teams.length;
      const totalRounds = (n - 1) * 2;
      const matchesPerRound = n / 2;
      const fixtures = [];
      const curDate = new Date(startDate);

      for (let round = 0; round < totalRounds; round++) {
        const dateStr = curDate.toISOString().split('T')[0];
        for (let m = 0; m < matchesPerRound; m++) {
          let home = (round + m) % (n - 1);
          let away = (n - 1 - m + round) % (n - 1);
          if (m === 0) away = n - 1;
          if (round >= n - 1) {
            const tmp = home; home = away; away = tmp;
          }
          const homeId = teams[home];
          const awayId = teams[away];
          if (homeId !== 'BYE' && awayId !== 'BYE') {
            fixtures.push({
              id: `${competitionId}_r${round + 1}_m${m}_${homeId}_${awayId}`,
              competitionId,
              matchday: round + 1,
              date: dateStr,
              homeClubId: homeId,
              awayClubId: awayId,
              isPlayed: false,
            });
          }
        }
        curDate.setDate(curDate.getDate() + 7);
      }
      return fixtures;
    }

    Object.values(competitionsMaster).forEach(comp => {
      const fList = generateBerger(comp.id, comp.clubIds, '2026-08-15');
      fixturesMaster.push(...fList);
    });

    console.log(`[SCHEDULER] Generated ${fixturesMaster.length} round-robin league fixtures across all 10 competitions.`);

    // 5. SAMPLE MEDIA RUMORS
    const rumorsMaster = [
      {
        id: 'rumor-1',
        headline: '[Tier 1] Manchester City prepare €120M summer inquiry for Barcelona starlet Lamine Yamal.',
        source: 'David Ornstein • The Athletic',
        credibilityTier: 1,
        targetPlayerName: 'Lamine Yamal',
        buyerClubName: 'Manchester City',
        timestamp: '1h ago',
      },
      {
        id: 'rumor-2',
        headline: '[Tier 1] Real Madrid monitor Trent Alexander-Arnold contract extension status.',
        source: 'Fabrizio Romano',
        credibilityTier: 1,
        targetPlayerName: 'Trent Alexander-Arnold',
        buyerClubName: 'Real Madrid',
        timestamp: '3h ago',
      },
      {
        id: 'rumor-3',
        headline: '[Tier 2] PSG identifying midfield playmakers following departure rumors.',
        source: 'L’Équipe',
        credibilityTier: 2,
        targetPlayerName: 'Pedri',
        buyerClubName: 'Paris Saint-Germain',
        timestamp: '5h ago',
      },
      {
        id: 'rumor-4',
        headline: '[Tier 2] Bayern Munich expressing interest in Nico Williams release clause.',
        source: 'Florian Plettenberg • Sky Germany',
        credibilityTier: 2,
        targetPlayerName: 'Nico Williams',
        buyerClubName: 'FC Bayern München',
        timestamp: '7h ago',
      },
    ];

    // 6. MASTER DATAPACK PAYLOAD
    const gameDataPack = {
      version: '2025.1-FC25',
      generatedAt: new Date().toISOString(),
      clubs: clubsMaster,
      players: allPlayers,
      competitions: competitionsMaster,
      fixtures: fixturesMaster,
      rumors: rumorsMaster,
    };

    // Ensure output directories exist
    [path.dirname(OUTPUT_JSON_PUBLIC), path.dirname(OUTPUT_JSON_SRC)].forEach(d => {
      if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
    });

    // Write public bundle
    fs.writeFileSync(OUTPUT_JSON_PUBLIC, JSON.stringify(gameDataPack, null, 2), 'utf8');
    console.log(`[OUTPUT] Successfully wrote master gameData.json to ${OUTPUT_JSON_PUBLIC}`);

    // Write src bundle
    fs.writeFileSync(OUTPUT_JSON_SRC, JSON.stringify(gameDataPack, null, 2), 'utf8');
    console.log(`[OUTPUT] Successfully wrote master gameData.json to ${OUTPUT_JSON_SRC}`);

    console.log('\n====================================================');
    console.log(`SUCCESS: ALL 10 LEAGUES & ${Object.keys(clubsMaster).length} CLUBS FULLY POPULATED WITH FC 25 / SOFIFA DATA!`);
    console.log('====================================================\n');
  });
