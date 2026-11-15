// Proves the Tidemark engine's attack-planning cache (tools/tidemark/v1/engine.js, lines marked PERF-ONLY) and the matchup memory
// (TMR.matchup / TMR.warm in src/engine/tm/tm_rules.js) change nothing. Build tcg first, then: node tools/perf/memo_check.cjs [games]
//  1. the same games with the cache off and on give the same winner, turns, ending and Harbor totals;
//  2. with every cached answer recomputed and compared during play, nothing differs (the engine throws if it does);
//  3. a matchup warmed one game at a time, in a different order and among other games, equals the matchup played in one go.
const {load}=require('../agents/harness.cjs'); const N=+process.argv[2]||400; let fails=0;
const check=(ok,msg,x)=>{ console.log((ok?'PASS ':'FAIL ')+msg+(ok||x===undefined?'':' '+JSON.stringify(x))); if (!ok) fails++; };
const g=load(), run=g.run;
run(`globalThis.__D=TMR.lib.map(p=>TMR.unpack(p)).filter(Boolean); globalThis.__games=(n)=>{ const out=[]; for (let k=0;k<n;k++){ const i=(k*7)%__D.length, j=(k*13+5)%__D.length; if (i===j) continue; const r=TMR.play(__D[i],__D[j],1000+k*97); out.push([r.w,r.turns,r.why,r.harbor[0],r.harbor[1]]); } return JSON.stringify(out); };`);
run('globalThis.__TM_MEMO_OFF=true'); let t=Date.now(); const off=run(`__games(${N})`); const tOff=Date.now()-t;
run('globalThis.__TM_MEMO_OFF=false'); t=Date.now(); const on=run(`__games(${N})`); const tOn=Date.now()-t;
check(off===on, `${JSON.parse(on).length} games: identical results with the planning cache off (${tOff} ms) and on (${tOn} ms, ${(tOff/tOn).toFixed(2)}x faster)`);
run('globalThis.__TM_MEMO_CHECK=true'); let err=null, same=null; try { same=run(`__games(${Math.min(N,250)})`); } catch(e){ err=String(e).slice(0,300); } run('globalThis.__TM_MEMO_CHECK=false');
check(!err && JSON.stringify(JSON.parse(on).slice(0,JSON.parse(same||'[]').length))===same, 'every cached power, toughness and keyword equals a fresh calculation, in every plan of '+Math.min(N,250)+' games', err);
const direct=run(`JSON.stringify([0,1,2,3,4,5,6,7].map(k=>TMR.matchup(__D[k],__D[k+9],6,5000+k)))`);
const g2=load(); g2.run(`globalThis.__D=TMR.lib.map(p=>TMR.unpack(p)).filter(Boolean);`);
const warmed=g2.run(`(()=>{ let more=true; while (more){ more=false; for (const k of [7,3,5,1,6,0,2,4]){ if (!TMR.warm(__D[k],__D[k+9],6,5000+k)) more=true; TMR.play(__D[k+2],__D[k+20],77+k); } } return JSON.stringify([0,1,2,3,4,5,6,7].map(k=>TMR.matchup(__D[k],__D[k+9],6,5000+k))); })()`);
check(direct===warmed, 'matchups played ahead one game at a time, out of order and among other games, equal matchups played in one go', [direct,warmed]);
check(g2.run('TMR.stats.hits')===8, 'a matchup already played is not played again');
check(g.errors.length===0&&g2.errors.length===0,'no errors',g.errors.concat(g2.errors).slice(0,2));
console.log('RESULT', fails? 'FAIL '+fails : 'ALL PASS'); process.exit(fails?1:0);
