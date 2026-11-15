// Day-advance profiler for the Trading Card Collector (build tcg first).
//   node tools/perf/profile.cjs [--seed 11] [--days 720] [--json out.json] [--top 12]
// Plays an idle world for --days and times every advanceDay, attributing the time to the game's own tick functions
// (each is wrapped with a timer; a function's time includes the functions it calls). Prints: per-day median, p95 and
// worst case overall, by day of week and for early / middle / late game; the functions that cost most; the slowest days
// with what they were doing; and how the saved state grows. A fingerprint of the world at the end lets two runs be compared
// (an optimisation must not change it).
const {load}=require('../agents/harness.cjs'); const fs=require('node:fs'), crypto=require('node:crypto');
const arg=(n,d)=>{ const i=process.argv.indexOf('--'+n); return i>0? process.argv[i+1] : d; };
const seed=+arg('seed',11), days=+arg('days',720), out=arg('json',null), top=+arg('top',14);
const warm=process.argv.includes('--warm');   // play ahead before each day, as an idle browser does (no limit on idle time)
const FN=['marketTick','refreshNPCTastes','fvClear',
  'tcDay','tcMarketDay','tcMetaWeek','tcBanCheck','tcPruneWeek','tcBrewWeek','tcEventsDay','tcSetLife','tcRelease','tcRebuildMeta','tcApplyBans',
  'xtDay','xtMarketDay','xtEconDay','xtMetaWeek','xtBanCheck','xtPruneWeek','xtBrewWeek','xtEventsDay','xtSetLife','xtRelease','xtRebuildMeta','xtApplyBans',
  'brDay','brMarketDay','brEventsDay','snapNW'];
const q=(a,p)=>{ if (!a.length) return 0; const s=a.slice().sort((x,y)=>x-y); return s[Math.min(s.length-1,Math.floor(p*s.length))]; };
const ms=x=>x>=1000? (x/1000).toFixed(1)+' s' : x.toFixed(0)+' ms';
(async()=>{
  const g=load(); const t0=Date.now(); await g.run(`newGame(${seed})`); const boot=Date.now()-t0;
  g.run(`globalThis.__P={}; globalThis.__wrapped=[]; for (const n of ${JSON.stringify(FN)}){ const f=globalThis[n]; if (typeof f!=='function') continue; __wrapped.push(n); globalThis[n]=function(){ const s=performance.now(); try { return f.apply(this,arguments); } finally { __P[n]=(__P[n]||0)+performance.now()-s; } }; }
    if (typeof RETAIL!=='undefined'&&RETAIL){ const d=RETAIL.day; RETAIL.day=function(){ const s=performance.now(); try { return d.apply(this,arguments); } finally { __P['RETAIL.day']=(__P['RETAIL.day']||0)+performance.now()-s; } }; }
    if (typeof CIRCUIT!=='undefined'&&CIRCUIT){ const d=CIRCUIT.tick; CIRCUIT.tick=function(){ const s=performance.now(); try { return d.apply(this,arguments); } finally { __P['CIRCUIT.tick']=(__P['CIRCUIT.tick']||0)+performance.now()-s; } }; }`);
  const day0=g.run('G.day'); const rows=[], tot={}, growth=[]; let warmMs=0;
  const size=()=>JSON.parse(g.run(`JSON.stringify({bytes:JSON.stringify(G,saveReplacer).length, tc:Object.keys(G.tc).length, xtc:Object.keys(G.xtc).length, brc:Object.keys(G.brc).length, lst:G.lst.length, sales:Object.keys(G.sales).length, news:G.news.length, npcs:G.npcs.length, heap:0})`));
  for (let d=1; d<=days; d++){
    if (warm){ const w=performance.now(); g.run('xtWarmTick(1e9)'); warmMs+=performance.now()-w; }
    g.run('__P={}'); const s=performance.now(); g.run('advanceDay()'); const dt=performance.now()-s;
    const P=JSON.parse(g.run('JSON.stringify(__P)')); const dow=g.run('dowOf(G.day)');
    rows.push({d,dow,dt,P}); for (const k in P) tot[k]=(tot[k]||0)+P[k];
    if (d===1 || d%90===0 || d===days){ const z=size(); z.d=d; z.heapMB=Math.round(process.memoryUsage().heapUsed/1048576); growth.push(z); }
  }
  const fp=crypto.createHash('sha1').update(g.run(`JSON.stringify([G.day,G.player.cash,Object.keys(G.tc).length,Object.keys(G.xtc).length,Object.keys(G.brc).length,G.lst.length,G.lst.slice(0,40).map(l=>[l.id,l.pr]),G.tcg.arch.map(a=>[a.id||a.n,Math.round((a.sh||0)*1e6)]),G.xtg.arch.map(a=>[a.id||a.n,Math.round((a.sh||0)*1e6)]),Object.values(G.retail.locations).map(s=>[Math.round(s.cash),s.singles.length]),(G.news||[]).length,G.news.slice(0,30).map(n=>n.h)])`)).digest('hex').slice(0,12);
  const all=rows.map(r=>r.dt), DOW=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  console.log(`seed ${seed}, ${days} days, new game ${ms(boot)}, world fingerprint ${fp}`);
  console.log(`all days      median ${ms(q(all,0.5))}  p95 ${ms(q(all,0.95))}  p99 ${ms(q(all,0.99))}  worst ${ms(Math.max(...all))}  total ${ms(all.reduce((a,b)=>a+b,0))}`);
  for (let w=0;w<7;w++){ const a=rows.filter(r=>r.dow===w).map(r=>r.dt); console.log(`  ${DOW[w]}         median ${ms(q(a,0.5)).padStart(7)}  p95 ${ms(q(a,0.95)).padStart(7)}  worst ${ms(Math.max(...a)).padStart(7)}`); }
  const third=Math.floor(days/3); for (const [n,a,b] of [['early',0,third],['middle',third,2*third],['late',2*third,days]]){ const x=rows.slice(a,b).map(r=>r.dt), mo=rows.slice(a,b).filter(r=>r.dow===1).map(r=>r.dt); console.log(`  ${n.padEnd(7)}(days ${a+1}-${b}) median ${ms(q(x,0.5))}  p95 ${ms(q(x,0.95))}  worst ${ms(Math.max(...x))}  Monday median ${ms(q(mo,0.5))}`); }
  console.log('time by function (inclusive), share of all day-advance time:');
  const sum=all.reduce((a,b)=>a+b,0); for (const [k,v] of Object.entries(tot).sort((a,b)=>b[1]-a[1]).slice(0,top)) console.log(`  ${k.padEnd(16)} ${ms(v).padStart(8)}  ${(100*v/sum).toFixed(1).padStart(5)}%`);
  console.log('slowest days:'); for (const r of rows.slice().sort((a,b)=>b.dt-a.dt).slice(0,8)) console.log(`  day ${String(r.d).padStart(4)} ${DOW[r.dow]} ${ms(r.dt).padStart(8)}  `+Object.entries(r.P).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([k,v])=>k+' '+ms(v)).join(', '));
  console.log('state growth (save JSON bytes before compression, copies, listings, node heap):'); for (const z of growth) console.log(`  day ${String(z.d).padStart(4)}  ${(z.bytes/1048576).toFixed(1)} MB  wk ${z.tc} tm ${z.xtc} br ${z.brc} copies  ${z.lst} listings  ${z.sales} sale histories  heap ${z.heapMB} MB`);
  console.log('Tidemark engine: '+g.run('JSON.stringify(TMR.stats)')+(warm?'  played ahead in idle time: '+ms(warmMs):''));
  if (g.errors.length) console.log('game errors:',g.errors.slice(0,3));
  if (out) fs.writeFileSync(out,JSON.stringify({seed,days,fp,rows:rows.map(r=>[r.d,r.dow,Math.round(r.dt)]),tot,growth},null,0));
})();
