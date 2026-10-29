'use strict';
// Opponent AI for The Broken Reach.  It only sees what a player sees: the board, the planet, its own hand, the NUMBER of cards in
// the opponent's hand, and the card catalogue.  It never reads the opponent's hand or deck; unseen cards are sampled from the catalogue
// (minus cards already on the board and in its own hand).  No hidden stat advantages.
const E=(typeof require!=='undefined')?require('./engine.js'):window.BR_E;
const LEVELS={
  easy:    {noise:0.35, cand:0,  samples:0, tempo:0},       // 1-ply, often takes the first decent capture, sometimes random
  standard:{noise:0.04, cand:6,  samples:3, tempo:0},    // 1-ply + expected reply over a few sampled opponent hands
  hard:    {noise:0,    cand:12, samples:14, tempo:0},     // wider search, more samples
};
const lead=(s,p)=>{ const c=E.final(s); return c[p]-c[1-p]; };
// (a 'keep strong cards for later' term was tried and measured worse, so tempo stays 0)
const cardWeight=id=>{ const d=E.def(id); return d.atk+d.grd+0.4*E.pop(d.mask); };
function chooseMove(s,level,rng,pool){
  const L=LEVELS[level]||LEVELS.standard, p=s.cur, moves=E.legalMoves(s);
  if (!moves.length) return null;
  const scored=moves.map(m=>{ const n=E.applyMove(s,m); return {m,n:n.state,v:lead(n.state,p),caps:n.stats.captures}; });
  const empties=16-s.turn;
  if (L.noise && rng()<L.noise) return scored[Math.floor(rng()*scored.length)].m;
  const tempo=m=> empties>5 ? L.tempo*0.1*cardWeight(m.cid) : 0;           // spend weak cards early, keep strong ones for later
  if (!L.samples){ let best=[],bv=-99; for (const c of scored){ const v=c.v+(L.noise?(rng()-0.5)*3:0); if(v>bv){bv=v;best=[c.m];} else if(Math.abs(v-bv)<1e-9) best.push(c.m); } return best[Math.floor(rng()*best.length)]; }
  scored.sort((a,b)=>(b.v-tempo(b.m))-(a.v-tempo(a.m)));
  // unseen cards: the catalogue minus the board and my own hand
  const known=new Set(); for (const u of s.cells) if (u) known.add(u.cid); for (const id of s.hands[p]) known.add(id);
  const unseen=(pool||[]).filter(id=>!known.has(id)), opp=1-p, nOpp=s.hands[opp].length+((s.decks[opp]&&s.decks[opp].length)?1:0);   // the opponent draws before replying
  const hands=[]; for (let i=0;i<L.samples;i++){ const h=[]; const used=new Set(); while(h.length<Math.min(nOpp,unseen.length)){ const id=unseen[Math.floor(rng()*unseen.length)]; if(!used.has(id)){used.add(id);h.push(id);} } hands.push(h); }
  let best=[],bv=-99;
  for (const c of scored.slice(0,L.cand)){
    let total=0;
    if (c.n.over) total=c.v*L.samples;
    else for (const h of hands){ const t=JSON.parse(JSON.stringify(c.n)); t.hands[opp]=h; let worst=c.v;                       // opponent's best reply for it
      let bestOpp=-99, myAfter=c.v; for (const r of E.legalMoves(t)){ const rs=E.applyMove(t,r).state; const ov=lead(rs,opp); if(ov>bestOpp){bestOpp=ov;myAfter=-ov;} }
      total+=myAfter; }
    const v=total/L.samples-tempo(c.m)+c.caps*0.01;
    if(v>bv+1e-9){bv=v;best=[c.m];} else if(Math.abs(v-bv)<=1e-9) best.push(c.m);
  }
  return best[Math.floor(rng()*best.length)];
}
if (typeof module!=='undefined') module.exports={chooseMove,LEVELS};
