// Headless balance check for the Wildkin rules engine (src/engine/tcg_rules.js) on the First Bond cards.
//   node tools/wildkin_sim.js [games-per-pair] [--all]
// Needs a built tcg game (python3 tools/build.py tcg): it reads WK_CANON from dist/tcg/game.js.
// Builds every deck the game's metagame would consider, plays them against each other and prints win rates,
// game length, how games end, and per-card use. Exit code 1 if a basic sanity check fails.
const fs=require('fs'), path=require('path');
const ROOT=path.join(__dirname,'..');
const WKR=require(path.join(ROOT,'src/engine/tcg_rules.js'));
const js=fs.readFileSync(path.join(ROOT,'dist/tcg/game.js'),'utf8'); const m=js.match(/const WK_CANON=(\{.*?\});\n/s);
if (!m){ console.error('WK_CANON not found: build the tcg game first'); process.exit(2); }
const CANON=JSON.parse(m[1]);
const N=+(process.argv[2]||16), ALL=process.argv.includes('--all');
const cards=WKR.setFromCanon(CANON,1).filter(c=>c.same==null);
const pool=cards.filter(c=>c.kind!=='essence'); const essOf={}; for (const c of cards) if (c.kind==='essence') essOf[c.el]=c;
const errs=[];
// 1. every card is playable by the engine
for (const c of cards){ WKR.prep(c); if (c.kind==='creature'){ if (!(c.hp>0) || !c.atk.length) errs.push('no stats: '+c.name); for (const a of c.atk) if (!/^[VTSIELADWC]+$/.test(a.cost)) errs.push('bad cost '+c.name+' '+a.cost); if (c.from && !cards.some(x=>x.name===c.from)) errs.push('evolves from unknown '+c.name); }
  else if (c.kind!=='essence' && !(c.fx||[]).length) errs.push('no effect: '+c.name); }
// 2. candidate decks: one per final form (two partner variants)
const finals=pool.filter(c=>c.kind==='creature' && !pool.some(d=>d.from===c.name));
const decks=[]; const seen=new Set();
for (const f of finals) for (const v of [0,1]){ const d=WKR.buildDeck(pool,f,v); if (!d) continue; const s=WKR.sig(d); if (seen.has(s)) continue; seen.add(s);
  const n=WKR.deckCards(d,essOf).length; if (n!==40) errs.push('deck size '+n+' for '+f.name); d.name=f.name+(d.partner?' / '+d.partner.name:''); d.style=WKR.deckStyle(d); decks.push(d); }
console.log('cards', cards.length, 'finals', finals.length, 'candidate decks', decks.length);
// 3. speed and game shape
let t0=Date.now(); const why={}; let turns=0, games=0, firstWins=0;
for (let i=0;i<400;i++){ const a=decks[i%decks.length], b=decks[(i*7+3)%decks.length]; const r=WKR.play(WKR.deckCards(a,essOf),WKR.deckCards(b,essOf),1000+i); why[r.why]=(why[r.why]||0)+1; turns+=r.turns; games++; if (r.w===r.first) firstWins++; }
const ms=(Date.now()-t0)/games; console.log('ms per game', ms.toFixed(3), 'avg turns', (turns/games).toFixed(1), 'ends', JSON.stringify(why), 'first player wins', (firstWins/games*100).toFixed(1)+'%');
if (ms>3) errs.push('too slow: '+ms+' ms per game');
if ((why.time||0)/games>0.05) errs.push('too many games hit the turn cap');
// 4. gauntlet: every candidate against a spread of the field
t0=Date.now(); const field=decks.filter((_,i)=>i%Math.max(1,Math.floor(decks.length/12))===0).slice(0,12);
for (const d of decks){ let w=0; for (const o of field) if (o!==d) w+=WKR.matchup(d,o,essOf,ALL?N:8); d.g=w/(field.length-(field.includes(d)?1:0)); }
decks.sort((a,b)=>b.g-a.g);
console.log('gauntlet ('+((Date.now()-t0)/1000).toFixed(1)+'s):');
for (const d of decks) console.log('  '+(d.g*100).toFixed(1).padStart(5)+'%  '+d.style.padEnd(8)+' '+d.name);
// 5. the top 15: full round robin
const top=decks.slice(0,15); t0=Date.now(); const M=top.map(()=>top.map(()=>0.5));
for (let i=0;i<top.length;i++) for (let j=i+1;j<top.length;j++){ const p=WKR.matchup(top[i],top[j],essOf,N); M[i][j]=p; M[j][i]=1-p; }
console.log('round robin of the top 15 ('+((Date.now()-t0)/1000).toFixed(1)+'s, '+N+' games per pair):');
top.forEach((d,i)=>{ const avg=M[i].reduce((a,b)=>a+b,0)/(top.length-1)-0.5/(top.length-1); console.log('  '+(avg*100).toFixed(1).padStart(5)+'%  '+d.name.padEnd(30)+M[i].map(x=>String(Math.round(x*100)).padStart(4)).join('')); });
// 6. card use across candidate decks
const use={}; for (const d of top) for (const [c,n] of d.creatures.concat(d.trainers)) use[c.name]=(use[c.name]||0)+n;
console.log('cards in the top 15:', Object.entries(use).sort((a,b)=>b[1]-a[1]).map(([k,v])=>k+' '+v).join(', '));
const unused=pool.filter(c=>!decks.some(d=>d.creatures.concat(d.trainers).some(([x])=>x===c))).map(c=>c.name);
console.log('never in any candidate deck ('+unused.length+'):', unused.join(', '));
if (errs.length){ console.log('ERRORS', errs); process.exit(1); } console.log('OK');
