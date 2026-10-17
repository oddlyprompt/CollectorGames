// Computes the field (candidate decks, gauntlet, round robin) for a group of sets with the rules engine, for the build.
//   node tools/wildkin_meta.js <canon.json> [<canon2.json> ...]      prints the field JSON (sets in order: 1, 2, ...)
// Called by tools/wildkin_build.py. The game can compute the same thing itself; doing it at build time keeps new
// games fast. Results depend only on the cards and the engine, never on a world's seed. A card printed in several sets
// (a reprint) is one identity, taken from its first set, exactly as the game's legal pool does (tcLegalIdentities).
const fs=require('fs'), path=require('path');
const WKR=require(path.join(__dirname,'..','src','engine','tcg_rules.js'));
const cards=[], seen=new Set();
process.argv.slice(2).forEach((f,i)=>{ const canon=JSON.parse(fs.readFileSync(f,'utf8')); const n=canon.set.n||i+1;
  for (const c of WKR.setFromCanon(canon,n)) if (c.same==null && !seen.has(c.cid)){ seen.add(c.cid); cards.push(c); } });
const pool=cards.filter(c=>c.kind!=='essence'); const essOf={}; for (const c of cards) if (c.kind==='essence') essOf[c.el]=c;
process.stdout.write(JSON.stringify(WKR.buildMeta(pool,essOf)));
