'use strict';
// Turn-order experiments: node tools/brokenreach/balance.js [randomGames=1500] [greedyGames=1500] [standardGames=240] > report
const E=require('./engine.js'), AI=require('./ai.js'); const cards=require('../../broken-reach-production/set01/cards.json').cards; E.loadCards(cards);
const units=cards.filter(c=>c.type!=='planet').map(c=>c.base_card_id), planets=cards.filter(c=>c.type==='planet').map(c=>c.base_card_id);
const [NR,NG,NS]=[+process.argv[2]||1500,+process.argv[3]||1500,+process.argv[4]||240];
const VARIANTS=[
 ['v0.2 baseline',{}],['tie to first player (komi 1)',{komi:1}],['komi 2',{komi:2}],['komi 3 (1.5 squares)',{komi:3}],
 ['final placement makes no challenges',{lastPassive:true}],['final placement Attack -1',{lastMinus:1}],['final placement Attack -2',{lastMinus:2}],
 ['first player +1 Guard on all units',{firstGuard:1}],['first player opens with 6 cards',{firstHand:1}],['komi 1 + final Attack -1',{komi:1,lastMinus:1}],
];
const lead=(s,p)=>{ const c=E.final(s); return c[p]-c[1-p]; };
const PLAYERS={
  random:(s,r)=>{ const m=E.legalMoves(s); return m[Math.floor(r()*m.length)]; },
  greedy:(s,r)=>{ let best=[],bv=-99; for (const m of E.legalMoves(s)){ const v=lead(E.applyMove(s,m).state,s.cur); if(v>bv){bv=v;best=[m];} else if(v===bv) best.push(m); } return best[Math.floor(r()*best.length)]; },
  standard:(s,r)=>AI.chooseMove(s,'standard',r,units),
};
function run(kind,n,rules,seed0){
  const o={n,first:0,second:0,tie:0,caps:0,plc:0,big:0,max:0,pl:{}}; const f=PLAYERS[kind];
  for (let i=0;i<n;i++){ const r=E.mulberry32(seed0+i*31), planet=i%9===8?null:planets[i%8];
    let s=E.newMatch({deckA:E.shuffle(units,r).slice(0,20),deckB:E.shuffle(units,r).slice(0,20),planet,seed:seed0+i,rules});
    while(!s.over){ const rr=E.applyMove(s,f(s,r)); o.caps+=rr.stats.captures; o.plc++; if(rr.stats.captures>=4)o.big++; o.max=Math.max(o.max,rr.stats.captures); s=rr.state; }
    const w=E.winner(s), k=planet||'none'; const P=o.pl[k]||(o.pl[k]={n:0,f:0,d:0}); P.n++; if(w<0){o.tie++;P.d++;} else if(w===s.first){o.first++;P.f++;} else o.second++; }
  return o;
}
const pc=x=>(100*x).toFixed(1).padStart(5)+'%';
function line(name,o){ const dec=o.first+o.second; const pls=Object.values(o.pl).filter(p=>p.n>=20).map(p=>p.f/Math.max(1,p.n-p.d)); 
  return `  ${name.padEnd(8)} first ${pc(o.first/o.n)} second ${pc(o.second/o.n)} draw ${pc(o.tie/o.n)} | first share of decided ${pc(o.first/Math.max(1,dec))} | captures/placement ${(o.caps/o.plc).toFixed(2)}, placements with 4+ ${pc(o.big/o.plc)}, largest ${o.max} | planet spread of first-player win rate ${pc(Math.min(...pls))}..${pc(Math.max(...pls))}`; }
console.log(`Turn-order experiments, ${NR} random, ${NG} greedy, ${NS} standard-AI games per rule; random decks of 20 different units; all 8 planets and none in rotation\n(first share of decided = first player's wins / (wins+losses): 50% is fair)\n`);
for (const [name,rules] of VARIANTS){ console.log(name+'  '+JSON.stringify(rules));
  console.log(line('random',run('random',NR,rules,1000))); console.log(line('greedy',run('greedy',NG,rules,5000))); console.log(line('standard',run('standard',NS,rules,9000))); console.log(''); }
