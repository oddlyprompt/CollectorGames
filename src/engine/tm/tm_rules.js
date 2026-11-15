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
  // The same two lists, number of games and seed always give the same share, so finished (and half-finished) matchups are remembered.
  // Nothing about the result changes; a matchup asked for twice, or played ahead of time by warm(), is not played again. Not saved.
  const MC=new Map(), MC_MAX=6000; const stats={played:0, hits:0, warmed:0};
  const deckKey=d=>d._k||(d._k=d.map(c=>cidOf(c.id)).join(','));   // the list in order: the order of a list matters to the shuffle
  function mcGet(a, b, n, base){ const key=deckKey(a)+'|'+deckKey(b)+'|'+n+'|'+(base||1); let st=MC.get(key); if (!st){ if (MC.size>=MC_MAX){ let i=0; for (const k of MC.keys()){ MC.delete(k); if (++i>=MC_MAX/4) break; } } st={w:0,k:0}; MC.set(key,st); } return st; }
  function game(a, b, base, k){ const seed=Math.imul((base||1)*131+k+1, 2654435761)>>>0; const r=k%2? play(b,a,seed) : play(a,b,seed); stats.played++; return k%2? (r.w===1?1:r.w===0?0:0.5) : (r.w===0?1:r.w===1?0:0.5); }
  function matchup(a, b, n, base){ const st=mcGet(a,b,n,base); if (st.k>=n) stats.hits++; while (st.k<n){ st.w+=game(a,b,base,st.k); st.k++; } return st.w/n; }
  // play one more game of a matchup that will be wanted later; true once it is complete
  function warm(a, b, n, base){ const st=mcGet(a,b,n,base); if (st.k<n){ st.w+=game(a,b,base,st.k); st.k++; stats.warmed++; } return st.k>=n; }
  // a deck from a spec {mix, plan, tech (key), lead (cid), seed}, without the banned cards (card names)
  function brew(spec, banNames){ const lead=spec.lead!=null? byCid.get(spec.lead) : null; const d=D.brew({id:spec.id||'brew', mix:spec.mix, plan:spec.plan||'midrange', tech:spec.tech? techOf(spec.tech) : null, lead, seed:spec.seed||1, ban:banNames||[]}); return d.length===50? d : null; }
  return {E, D, CARDS, byId, byCid, cidOf, pack, unpack, lib, techOf, play, matchup, warm, stats, brew, sigOf, rate:D.rate, roles:D.roles, synergy:D.synergy, TECH:D.TECH, RV:1+(TM_LIB.fp? parseInt(TM_LIB.fp.slice(0,6),16) : 0)};
})();
