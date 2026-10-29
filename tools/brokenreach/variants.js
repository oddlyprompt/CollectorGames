'use strict';
// Tetra-Master-style rule variants: node tools/brokenreach/variants.js [games=1200] [aiGames=120]
const E=require('./engine.js'), AI=require('./ai.js'); const cards=require('../../broken-reach-production/set01/cards.json').cards; E.loadCards(cards);
const units=cards.filter(c=>c.type!=='planet').map(c=>c.base_card_id), planets=cards.filter(c=>c.type==='planet').map(c=>c.base_card_id);
const N=+process.argv[2]||1200, NA=+process.argv[3]||120;
const K=+(process.env.K||2);   // first-player bonus used throughout so turn order is comparable (env K to change)
const V=[['current v0.2',{}],['A no pointing-back bonus',{noRecip:true}],['B  A + combos stop after 1 level',{noRecip:true,maxGen:1}],['B2 A + combos stop after 2 levels',{noRecip:true,maxGen:2}],['C  arrow-to-arrow duels, one-way arrows capture',{noRecip:true,auto:true}],['D  C + combos stop after 1 level',{noRecip:true,auto:true,maxGen:1}],['E  keep +1, combos stop after 1 level',{maxGen:1}],['G  A + no combos (only the placed card attacks)',{noRecip:true,maxGen:0}],['H  keep +1, no combos',{maxGen:0}]].filter(x=>x[1]&&(!process.env.ONLY||process.env.ONLY.split(',').includes(x[0].split(' ')[0])));
const lead=(s,p)=>{ const c=E.score(s); return c[p]-c[1-p]; };
const PL={random:(s,r)=>{ const m=E.legalMoves(s); return m[Math.floor(r()*m.length)]; },
 greedy:(s,r)=>{ let best=[],bv=-99; for (const m of E.legalMoves(s)){ const v=lead(E.applyMove(s,m).state,s.cur); if(v>bv){bv=v;best=[m];} else if(v===bv) best.push(m); } return best[Math.floor(r()*best.length)]; },
 standard:(s,r)=>AI.chooseMove(s,'standard',r,units)};
function game(rules,seed,pa,pb,first){ const r=E.mulberry32(seed*31+5), planet=seed%9===8?null:planets[seed%8];
  let s=E.newMatch({deckA:E.shuffle(units,r).slice(0,20),deckB:E.shuffle(units,r).slice(0,20),planet,seed,first,rules:Object.assign({komi:K},rules)}); const pl=[pa,pb]; const o={caps:[],chal:[],leadAt:[],gens:0};
  while(!s.over){ const rr=E.applyMove(s,PL[pl[s.cur]](s,r)); o.caps.push(rr.stats.captures); o.chal.push(rr.stats.challenges); o.gens=Math.max(o.gens,rr.stats.maxGen); s=rr.state; if(s.turn===12) o.at12=E.final(s).slice(); }
  o.w=E.winner(s); o.s=s; o.fin=E.final(s); return o; }
const pc=x=>(100*x).toFixed(0)+'%';
console.log(`Tetra-Master-style variants (komi ${K} for turn order; random decks; ${N} games per player type, ${NA} for AI skill)\n`);
for (const [name,rules] of V){
  const row={};
  for (const kind of ['random','greedy']){ let f=0,d=0,caps=0,pl=0,big=0,max=0,chal=0,flipchg=0,dec=0,lead12=0,lead12n=0,swing=0;
    for (let i=0;i<N;i++){ const o=game(rules,1000+i,kind,kind,undefined); const first=o.s.first; if(o.w>=0){ d++; if(o.w===first) f++; }
      o.caps.forEach(c=>{ caps+=c; pl++; if(c>=4)big++; max=Math.max(max,c); }); o.chal.forEach(c=>chal+=c);
      // does the position after 12 of 16 placements predict the result?  (higher = earlier moves matter)
      const a=o.at12; if (a && a[0]!==a[1] && o.w>=0){ lead12n++; if ((a[0]>a[1]?0:1)===o.w) lead12++; }
      // swing: the final 4 placements captured more than the margin at placement 12 (the end is decisive)
      const last4=o.caps.slice(12).reduce((x,y)=>x+y,0); swing+=last4; }
    row[kind]={fs:f/Math.max(1,d),caps:caps/pl,big:big/pl,max,chal:chal/pl,pred12:lead12/Math.max(1,lead12n),last4:swing/N}; }
  // skill gap: 1-ply greedy vs Standard AI (seats alternate); win rate of Standard
  let sw=0,st=0; for (let i=0;i<NA;i++){ const sa=i%2; const o=game(rules,5000+i,sa?'greedy':'standard',sa?'standard':'greedy',i%2); const s=o.w; if(s<0) st+=0.5; else if((s===0&&!sa)||(s===1&&sa)) sw++; }
  const g=row.greedy, rn=row.random;
  console.log(name.padEnd(48)+` greedy: ${g.caps.toFixed(2)} caps/placement, 4+ in ${pc(g.big)}, longest ${g.max}, ${g.chal.toFixed(1)} challenges/placement | leader after 12 placements wins ${pc(g.pred12)} (random ${pc(rn.pred12)}), captures in last 4 placements ${g.last4.toFixed(1)} | first share ${pc(g.fs)} | Standard AI beats 1-ply greedy ${pc((sw+st)/NA)}`); }
