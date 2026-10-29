'use strict';
// Seeded simulation harness for the Broken Reach resolver.  node tools/brokenreach/sim.js [games=2000] [tacticalGames=200] [--seed N]
const E=require('./engine.js'); const cards=require('../../broken-reach-production/set01/cards.json').cards; E.loadCards(cards);
const units=cards.filter(c=>c.type!=='planet').map(c=>c.base_card_id), planets=cards.filter(c=>c.type==='planet').map(c=>c.base_card_id);
const N=+process.argv[2]||2000, NT=+process.argv[3]||200, SEED=+((process.argv.indexOf('--seed')>0&&process.argv[process.argv.indexOf('--seed')+1])||1);
const lead=(s,p)=>{ const c=E.score(s); return c[p]-c[1-p]; };

const AI={
  random:(s,rng)=>{ const m=E.legalMoves(s); return m[Math.floor(rng()*m.length)]; },
  // greedy: maximise ownership lead after this placement (ties broken at random)
  greedy:(s,rng)=>{ const p=s.cur; let best=[],bv=-99; for (const m of E.legalMoves(s)){ const v=lead(E.applyMove(s,m).state,p); if(v>bv){bv=v;best=[m];} else if(v===bv) best.push(m); } return best[Math.floor(rng()*best.length)]; },
  // tactical: 2-ply, assumes the opponent answers greedily WITH ITS REAL HAND (perfect information, an upper bound on skill)
  tactical:(s,rng)=>{ const p=s.cur; const cand=E.legalMoves(s).map(m=>{ const n=E.applyMove(s,m).state; return {m,n,v:lead(n,p)}; }).sort((a,b)=>b.v-a.v).slice(0,6);
    let best=[],bv=-99; for (const c of cand){ let v=c.v; if(!c.n.over){ let worst=99; for (const r of E.legalMoves(c.n)){ const w=lead(E.applyMove(c.n,r).state,p); if(w<worst) worst=w; } v=worst; }
      if(v>bv){bv=v;best=[c.m];} else if(v===bv) best.push(c.m); } return best[Math.floor(rng()*best.length)]; },
};
function randomDeck(rng){ return E.shuffle(units,rng).slice(0,20); }
const typeOf=id=>E.def(id).typeName;

function stats(){ return {n:0,w:[0,0],tie:0,firstWin:0,caps:[],maxGen:[],chain:{},biggest:0,byPlanet:{},byCard:{},byArrows:{},maxQueue:0,maxChall:0,loops:0,margins:[]}; }
function play(a,b,planet,seed,st,track){
  const rng=E.mulberry32(seed*7919+13);
  let s=E.newMatch({deckA:randomDeck(rng),deckB:randomDeck(rng),planet,seed});
  const decks=[s.hands[0].concat(s.decks[0]),s.hands[1].concat(s.decks[1])], ais=[a,b], first=s.first, played=[[],[]];
  let guard=0;
  while(!s.over){ if(++guard>40) throw new Error('match did not end'); const p=s.cur, m=AI[ais[p]](s,rng); const r=E.applyMove(s,m);
    const c=r.stats.captures; if(c>15||r.stats.challenges>15*8) { st.loops++; throw new Error('cascade bound broken'); }
    if(track){ st.caps.push(c); st.maxGen.push(r.stats.maxGen); st.chain[c]=(st.chain[c]||0)+1; st.biggest=Math.max(st.biggest,c);
      const d=E.def(m.cid), k=E.pop(d.mask); const A=st.byArrows[k]||(st.byArrows[k]={n:0,caps:0}); A.n++; A.caps+=c;
      const C=st.byCard[m.cid]||(st.byCard[m.cid]={n:0,caps:0}); C.n++; C.caps+=c; }
    played[p].push(m.cid); s=r.state; }
  const w=E.winner(s); st.n++; { const sc=E.score(s); st.margins.push(sc[first]-sc[1-first]); } if(w<0) st.tie++; else { st.w[w]++; if(w===first) st.firstWin++; }
  const P=st.byPlanet[planet||'none']||(st.byPlanet[planet||'none']={n:0,first:0,dec:0,margin:0}); P.n++; if(w>=0){P.dec++; if(w===first)P.first++;} P.margin+=Math.abs(E.score(s)[0]-E.score(s)[1]);
  if(track){ for (let p=0;p<2;p++) for (const id of decks[p]){ const C=st.byCard[id]||(st.byCard[id]={n:0,caps:0}); C.inDeck=(C.inDeck||0)+1; if(w===p) C.wins=(C.wins||0)+1; if(w<0) C.ties=(C.ties||0)+1; } }
  return {s,w,first};
}
const med=a=>{ const b=a.slice().sort((x,y)=>x-y); return b[Math.floor(b.length/2)]; };
const pct=x=>(100*x).toFixed(1)+'%';
function report(name,st){
  console.log(`\n== ${name}: ${st.n} games`);
  console.log(`first player wins ${pct(st.firstWin/st.n)}, second ${pct((st.w[0]+st.w[1]-st.firstWin)/st.n)}, ties ${pct(st.tie/st.n)}`);
  { const m=st.margins; const k=x=>{ const win=m.filter(v=>v+x>0).length,tie=m.filter(v=>v+x===0).length; return `${pct(win/m.length)} (ties ${pct(tie/m.length)})`; };
    console.log(`first player's win rate if it were given a bonus of: 0 -> ${k(0)}  1 -> ${k(1)}  3 -> ${k(3)}  5 -> ${k(5)}  (a bonus of 2 = one square)`); }
  if (st.caps.length){ const mean=st.caps.reduce((a,b)=>a+b,0)/st.caps.length; console.log(`placements ${st.caps.length/st.n} per game (always 16 in total, 8 per player); captures per placement mean ${mean.toFixed(2)}, median ${med(st.caps)}, largest ${st.biggest}; deepest chain generation ${Math.max(...st.maxGen)}`);
    const keys=Object.keys(st.chain).map(Number).sort((a,b)=>a-b); console.log('chain length (captures in one placement): '+keys.map(k=>`${k}:${pct(st.chain[k]/st.caps.length)}`).join('  ')); }
  const pl=Object.entries(st.byPlanet).map(([k,v])=>`${k==='none'?'none':E.def(k).name.split(' — ')[0]} first ${pct(v.first/Math.max(1,v.dec))} margin ${(v.margin/v.n).toFixed(1)}`); console.log('by planet: '+pl.join(' | '));
  if (st.caps.length){ console.log('captures per placement by arrow count: '+Object.keys(st.byArrows).sort().map(k=>`${k}→${(st.byArrows[k].caps/st.byArrows[k].n).toFixed(2)} (${st.byArrows[k].n})`).join('  '));
    const rows=Object.entries(st.byCard).filter(([k,v])=>v.n>=20&&v.inDeck>=40).map(([k,v])=>({id:k,caps:v.caps/v.n,wr:((v.wins||0)+(v.ties||0)/2)/v.inDeck,n:v.n}));
    const show=(t,a)=>console.log(t+'\n'+a.map(r=>`  ${r.id} ${E.def(r.id).name.slice(0,34).padEnd(34)} ${E.def(r.id).atk}/${E.def(r.id).grd} arrows ${E.pop(E.def(r.id).mask)} captures/play ${r.caps.toFixed(2)} deck win rate ${pct(r.wr)}`).join('\n'));
    show('strongest cards by deck win rate (random-deck baseline 50%, noisy):',rows.slice().sort((a,b)=>b.wr-a.wr).slice(0,6));
    show('weakest:',rows.slice().sort((a,b)=>a.wr-b.wr).slice(0,4)); }
}
const t0=Date.now();
for (const [name,a,b,n,track] of [['random vs random',  'random','random',N,true],['greedy vs greedy','greedy','greedy',N,true],['greedy (A) vs random (B)','greedy','random',Math.min(N,500),false],['tactical vs greedy','tactical','greedy',NT,false]]){
  const st=stats(); for (let i=0;i<n;i++){ const pl=i%9===8?null:planets[i%9===8?0:i%8]; play(a,b,pl,SEED*100000+i,st,track); } report(name,st);
}
console.log(`\nno cascade exceeded 15 captures or 120 challenges; ${((Date.now()-t0)/1000).toFixed(0)} s`);
