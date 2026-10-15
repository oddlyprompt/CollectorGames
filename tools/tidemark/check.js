// Tidemark prototype self-test: node tools/tidemark/check.js
// Fast checks that the engine still works: every configuration and ablation runs, games are deterministic per seed,
// mirror matches show no seat bias, every game ends, the logs stay consistent, and the round 2 engine mode (oldEntry)
// still reproduces the committed round 2 results. Exits 1 on any failure.
const L=require('./lib.js'); const {E,DECKS}=L; let fail=0; const ok=(c,m)=>{ console.log((c?'ok   ':'FAIL ')+m); if (!c) fail++; };
const REC=['targets','escort'];
const cfgs=[{ai:1},{ai:2},{ai:2,v:REC},{ai:[2,1],v:REC},{ai:2,v:['targets','escort','reef','raid']},{ai:2,v:REC,bonus:{inf:1,card:1}},{ai:2,v:REC,scale:{cost7:0.8}}]
  .concat(['homeground','strand','carry','escort','screen','walls','surge','domains','tricks','fronts'].map(k=>({ai:2,v:REC,off:[k]})))
  .concat([{rules:'0.3',ai:2},{rules:'0.3',ai:1},{rules:'0.3',ai:[2,1]},{rules:'0.3',pool:'0.2',ai:2},{rules:'0.3',ai:2,tide:12},{ai:2,v:REC,oldEntry:true}])
  .concat(['strand','ferry','screen','walls','surge','domains','tricks','fronts'].map(k=>({rules:'0.3',ai:2,off:[k]})));
for (const cfg of cfgs){ let err=null, n=0, bad=0; const DK=L.decksOf(cfg);
  try { for (let i=0;i<6;i++) for (let j=0;j<6;j++){ const r=E.play(DK[i].d,DK[j].d,31*i+j,cfg); n++; if (![0,1,-1].includes(r.w) || !(r.turns>0) || r.log.attacks[0]<0) bad++; } } catch(e){ err=e; }
  ok(!err && !bad, `config ${JSON.stringify(cfg)}: ${n} games${err? ' threw '+err.message : bad? ', '+bad+' bad results' : ''}`); }
const a=E.play(DECKS[2].d,DECKS[0].d,12345,{ai:2,v:REC}), b=E.play(DECKS[2].d,DECKS[0].d,12345,{ai:2,v:REC});
ok(a.w===b.w && a.turns===b.turns && JSON.stringify(a.harbor)===JSON.stringify(b.harbor), 'same seed, same game');
let w=0,g=0,f=0; for (let i=0;i<6;i++) for (let k=0;k<500;k++){ const r=E.play(DECKS[i].d,DECKS[i].d,1000*i+k,{ai:1}); g++; if (r.w===0) w++; if (r.first===0) f++; }
ok(Math.abs(w/g-0.5)<0.04 && Math.abs(f/g-0.5)<0.04, `mirror matches: seat A wins ${(w/g*100).toFixed(1)}%, goes first ${(f/g*100).toFixed(1)}% (both should be near 50%)`);
const r=L.runConfig({ai:1},10); ok(Math.abs(r.M[0][1]+r.M[1][0]-1)<1e-9 && r.games===150, 'round robin bookkeeping');
// pool 0.3 really differs from pool 0.2 and pool 0.2 is untouched (rounds 1 and 2 used it)
const fp=p=>require('crypto').createHash('md5').update(JSON.stringify(p.map(c=>[c.n,c.t,c.al,c.req,c.cost,c.pow,c.tgh,c.kw,c.fx,c.fort,c.front,c.carry,c.ferry]))).digest('hex');
ok(fp(L.CARDS)==='cb8f345bd30e824e999813a41b8ce694', `pool 0.2 unchanged (fingerprint ${fp(L.CARDS)})`); ok(fp(L.CARDS3)!==fp(L.CARDS) && L.CARDS3.length===60, 'pool 0.3 is a separate 60-card pool');
// the round 2 engine mode reproduces the committed round 2 engine exactly (same games, same logs)
{ const o=[]; for (const cfg of [{ai:1},{ai:2,v:REC},{ai:2,v:REC,off:['tricks']}]){ const r=L.runConfig(Object.assign({oldEntry:true},cfg),15); o.push(JSON.stringify(r.M)+r.turnsAvg+JSON.stringify(Object.fromEntries(Object.entries(r.c).filter(([k])=>k!=='tideDmg')))); }
  const h=require('crypto').createHash('md5').update(o.join('|')).digest('hex'); ok(h==='e9ca953d473e21415484dcadbd26e70e', 'oldEntry mode reproduces the round 2 engine ('+h+')'); }
console.log(fail? `${fail} FAILED` : 'all checks passed'); process.exit(fail?1:0);
