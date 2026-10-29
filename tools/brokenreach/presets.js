'use strict';
// Builds the three preset decks from simulation statistics.  node tools/brokenreach/presets.js  (writes broken-reach-production/set01/presets.json)
const fs=require('fs'), path=require('path'); const E=require('./engine.js'); const cards=require('../../broken-reach-production/set01/cards.json').cards; E.loadCards(cards);
const units=cards.filter(c=>c.type!=='planet'), ids=units.map(c=>c.base_card_id);
const lead=(s,p)=>{ const c=E.final(s); return c[p]-c[1-p]; };
const greedy=(s,r)=>{ let best=[],bv=-99; for (const m of E.legalMoves(s)){ const v=lead(E.applyMove(s,m).state,s.cur); if(v>bv){bv=v;best=[m];} else if(v===bv) best.push(m); } return best[Math.floor(r()*best.length)]; };
const stat={}; for (const id of ids) stat[id]={inDeck:0,wins:0,n:0,caps:0};
for (let i=0;i<3000;i++){ const r=E.mulberry32(777+i*13); const da=E.shuffle(ids,r).slice(0,20), db=E.shuffle(ids,r).slice(0,20);
  let s=E.newMatch({deckA:da,deckB:db,planet:null,seed:i}); while(!s.over){ const rr=E.applyMove(s,greedy(s,r)); const c=stat[rr.state.log[rr.state.log.length-1].cid]; c.n++; c.caps+=rr.stats.captures; s=rr.state; }
  const w=E.winner(s); for (const p of [0,1]) for (const id of (p?db:da)){ stat[id].inDeck++; if(w===p) stat[id].wins++; else if(w<0) stat[id].wins+=0.5; } }
const val=id=>{ const t=stat[id]; return t.wins/Math.max(1,t.inDeck); };
const caps=id=>stat[id].caps/Math.max(1,stat[id].n);
const arrows=id=>E.pop(E.def(id).mask), grd=id=>E.def(id).grd;
const types=['Ship','Character','Crew & Military','Drone & Creature','Tech Unit'];
function pick(sorter,minPerType,filter){
  const pool=ids.filter(filter||(()=>true)).sort(sorter), deck=[];
  for (const t of types) for (const id of pool.filter(i=>E.def(i).typeName===t).slice(0,minPerType)) deck.push(id);
  for (const id of pool) if (deck.length<20 && !deck.includes(id)) deck.push(id);
  return deck.slice(0,20);
}
const out=[
 {id:'dockside',name:'Dockside Starter',blurb:'Balanced: the strongest cards from every unit type. A good first deck.',cards:pick((a,b)=>val(b)-val(a),3)},
 {id:'openlanes',name:'Open Lanes',blurb:'Aggressive: wide arrows that start long chains. Fragile when you are the one being attacked.',cards:pick((a,b)=>caps(b)-caps(a),2,id=>arrows(id)>=4)},
 {id:'bulwark',name:'Bulwark',blurb:'Defensive: high Guard and supporting auras. Hard to flip, slower to snowball.',cards:pick((a,b)=>(grd(b)+val(b)*4)-(grd(a)+val(a)*4),2,id=>grd(id)>=3)},
];
for (const d of out){ d.stats={avgAtk:+(d.cards.reduce((a,i)=>a+E.def(i).atk,0)/20).toFixed(2),avgGuard:+(d.cards.reduce((a,i)=>a+E.def(i).grd,0)/20).toFixed(2),avgArrows:+(d.cards.reduce((a,i)=>a+arrows(i),0)/20).toFixed(2),types:Object.fromEntries(types.map(t=>[t,d.cards.filter(i=>E.def(i).typeName===t).length]))}; }
// round robin between the presets (greedy AI both sides, all 8 planets, alternating who starts)
const rr={}; for (const a of out) for (const b of out) if (a!==b){ let w=0,t=0,n=600; for (let i=0;i<n;i++){ const r=E.mulberry32(i*7+5); let s=E.newMatch({deckA:a.cards,deckB:b.cards,planet:cards.filter(c=>c.type==='planet')[i%8].base_card_id,seed:i,first:i%2}); while(!s.over) s=E.applyMove(s,greedy(s,r)).state; const x=E.winner(s); if(x===0)w++; else if(x<0)t++; } rr[a.id+' vs '+b.id]=(100*(w+t/2)/n).toFixed(0)+'%'; }
fs.writeFileSync(path.join(__dirname,'..','..','broken-reach-production','set01','presets.json'),JSON.stringify({status:'proposed test decks (not balanced, not final)',decks:out,roundRobinGreedy:rr},null,1)+'\n');
for (const d of out) console.log(d.id,JSON.stringify(d.stats),d.cards.map(i=>E.def(i).name.split(' — ')[0]).join(', ')); console.log(rr);
