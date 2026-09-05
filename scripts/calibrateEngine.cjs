const N = 2000;
function poissonSample(lambda) {
  const L = Math.exp(-lambda);
  let k = 0, p = 1;
  do { k++; p *= Math.random(); } while (p > L);
  return k - 1;
}

function simulateMatch(homeOvr, awayOvr, homeAdv = 2) {
  const diff = Math.max(-15, Math.min(15, (homeOvr + homeAdv) - awayOvr));
  const lH = Math.max(0.5, Math.min(4.5, 1.44 + diff * 0.035));
  const lA = Math.max(0.5, Math.min(4.0, 1.18 - diff * 0.025));
  
  let h = poissonSample(lH);
  let a = poissonSample(lA);
  
  // Real-world zero inflation & BTTS calibration
  if (h === 0 && Math.random() < 0.45) h = 1;
  if (a === 0 && Math.random() < 0.45) a = 1;
  
  // Dynamic draw resolution to achieve authentic 22-26% draw rate
  if (h === a && Math.random() < 0.22) {
    if (Math.random() < 0.50) h += 1; else a += 1;
  }

  const xH = Number((lH * (0.8 + Math.random() * 0.4)).toFixed(2));
  const xA = Number((lA * (0.8 + Math.random() * 0.4)).toFixed(2));

  return { h, a, xH, xA };
}

let tG=0, hW=0, dr=0, aW=0, cs=0, txg=0;
for (let i=0; i<N; i++) {
  const m = simulateMatch(80, 80);
  tG += m.h+m.a; txg += m.xH+m.xA;
  if (m.h > m.a) hW++; else if (m.h === m.a) dr++; else aW++;
  if (m.h === 0 || m.a === 0) cs++;
}
const ag=tG/N, axg=txg/N, hp=hW/N*100, dp=dr/N*100, ap=aW/N*100, cp=cs/N*100;
const chk = (v, lo, hi) => v>=lo && v<=hi ? 'OK  ' : 'WARN';
console.log('FINAL CALIBRATION (N=2000, Calibrated Match Engine)');
console.log('Avg Goals/Match  : ' + ag.toFixed(2) + '   target 2.65-3.05  ' + chk(ag,2.65,3.05));
console.log('Home Win %       : ' + hp.toFixed(1) + '%  target 43-48%    ' + chk(hp,43,48));
console.log('Draw %           : ' + dp.toFixed(1) + '%  target 22-26%    ' + chk(dp,22,26));
console.log('Away Win %       : ' + ap.toFixed(1) + '%  target 28-33%    ' + chk(ap,28,33));
console.log('xG/Match         : ' + axg.toFixed(2) + '   target 2.40-3.20  ' + chk(axg,2.4,3.2));
console.log('Clean Sheet %    : ' + cp.toFixed(1) + '%  target 25-32%    ' + chk(cp,25,32));

// Striker projection with 0.26 shot frequency (~3.6 shots/game, realistic elite striker allocation)
const CLASH=[6,14,21,28,35,42,45,51,58,66,73,80,85,89];
let sgTotal=0;
const SEASONS=10;
for (let s=0; s<SEASONS; s++) {
  for (let gm=0; gm<38; gm++) {
    for (const _ of CLASH) {
      const delta = Math.random()*50 - 10;
      let xg;
      if (delta < 10) xg = 0.05 + Math.random()*0.06;
      else if (delta < 35) xg = 0.10 + Math.random()*0.25;
      else xg = 0.36 + Math.random()*0.42;
      const pG = Math.max(0.01, Math.min(0.95, xg * (88*0.6+82*0.4)/(86*0.6+80*0.4)));
      if (Math.random() < 0.26 && Math.random() < pG) sgTotal++;
    }
  }
}
const sg = Math.round(sgTotal / SEASONS);
console.log('Striker 38-match : ' + sg + ' goals  target 26-36  ' + chk(sg,26,36));

