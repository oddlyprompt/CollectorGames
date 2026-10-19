// ===================== TIDEMARK: THE RULES ENGINE IN THE BROWSER =====================
// tools/tidemark/v1 (ops.js, engine.js, decks.js) is bundled by tools/tidemark_build.py as browser modules; the cards are TM_CARDS
// (the engine's own card objects plus printed text). Nothing here changes a rule. This file is the game's view of the engine:
// packed decks (what the save keeps), unpacking them into 50-card lists, playing games, and brewing decks.
// A game takes about 25 ms, so the field of decks and how they match up is precomputed (TM_LIB, tools/tidemark/v1/library.js);
// the game itself only plays finals, ban tests and the rebuilt decks after a ban.
const TMR=(function(){
  const E=tmRequire('engine.js'), D=tmRequire('decks.js'); const CARDS=TM_CARDS;
  const byId=new Map(CARDS.map(c=>[c.id,c])), cidOf=id=>+id.slice(4), byCid=new Map(CARDS.map(c=>[cidOf(c.id),c]));
  const sigOf=cnt=>cnt.slice().sort((a,b)=>a[0]-b[0]).map(x=>x[0]+'x'+x[1]).join(',');
  const cntOfDeck=d=>{ const k=new Map(); for (const c of d) k.set(cidOf(c.id),(k.get(cidOf(c.id))||0)+1); return [...k]; };
  // a packed deck: {id, name, why, mix, plan, tech, tn, lead, seed, c:[[cid,count]], sig, li}   (li: its index in TM_LIB, or -1 once rebuilt)
  function pack(d, meta){ const cnt=cntOfDeck(d); return Object.assign({c:cnt, sig:sigOf(cnt)}, meta); }
  function unpack(p){ const out=[]; for (const [cid,n] of p.c){ const c=byCid.get(cid); if (!c) return null; for (let i=0;i<n;i++) out.push(c); } return out.length===50? out : null; }
  const lib=TM_LIB.decks.map((d,i)=>{ const cnt=Object.keys(d.cnt).map(id=>[cidOf(id),d.cnt[id]]); return {id:d.id, name:d.name, why:d.why, mix:d.mix, plan:d.plan, tech:d.tech, tn:d.techName, lead:d.lead? cidOf(d.lead) : null, seed:d.seed, c:cnt, sig:sigOf(cnt), li:i}; });
  const techOf=k=>D.TECH.find(t=>t.k===k)||null;
  // play one game: 0 if deck a wins, 1 if b, -1 a draw (turn cap, equal Harbor)
  function play(a, b, seed, cfg){ return E.play(a, b, seed>>>0, cfg); }
  // share of n games a wins against b (draws count half); seat and seed vary with the game
  function matchup(a, b, n, base){ let w=0; for (let k=0;k<n;k++){ const seed=Math.imul((base||1)*131+k+1, 2654435761)>>>0; const r=k%2? play(b,a,seed) : play(a,b,seed); const win= k%2? (r.w===1?1:r.w===0?0:0.5) : (r.w===0?1:r.w===1?0:0.5); w+=win; } return w/n; }
  // a deck from a spec {mix, plan, tech (key), lead (cid), seed}, without the banned cards (card names)
  function brew(spec, banNames){ const lead=spec.lead!=null? byCid.get(spec.lead) : null; const d=D.brew({id:spec.id||'brew', mix:spec.mix, plan:spec.plan||'midrange', tech:spec.tech? techOf(spec.tech) : null, lead, seed:spec.seed||1, ban:banNames||[]}); return d.length===50? d : null; }
  return {E, D, CARDS, byId, byCid, cidOf, pack, unpack, lib, techOf, play, matchup, brew, sigOf, rate:D.rate, roles:D.roles, synergy:D.synergy, TECH:D.TECH, RV:1+(TM_LIB.fp? parseInt(TM_LIB.fp.slice(0,6),16) : 0)};
})();
