// Computes the First Bond field (candidate decks, gauntlet, round robin) with the rules engine, for the build.
//   node tools/wildkin_meta.js <canon.json>      prints the WK_META JSON
// Called by tools/wildkin_build.py. The game can compute the same thing itself; doing it at build time keeps new
// games fast. Results depend only on the cards and the engine, never on a world's seed.
const fs=require('fs'), path=require('path');
const WKR=require(path.join(__dirname,'..','src','engine','tcg_rules.js'));
const canon=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
const cards=WKR.setFromCanon(canon,1).filter(c=>c.same==null);
const pool=cards.filter(c=>c.kind!=='essence'); const essOf={}; for (const c of cards) if (c.kind==='essence') essOf[c.el]=c;
process.stdout.write(JSON.stringify(WKR.buildMeta(pool,essOf)));
