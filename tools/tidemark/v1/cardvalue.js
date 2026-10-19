// What each Tenth Tide card is worth in play: in the first archetype deck that runs it, every copy is swapped for a plain unit
// of the same cost, allegiance and requirement (Power + Toughness on the design guide's curve, no abilities), and the deck plays
// the whole field again on the same seeds. value = deck win rate with the card minus with the plain unit, in points:
// positive = better than a plain unit. node tools/tidemark/v1/cardvalue.js [games-per-opponent] [--json out.json]
const E=require('./engine.js'); const {ARCH, build}=require('./decks.js'); const {CARDS}=require('./cards.js'); const fs=require('fs');
const args=process.argv.slice(2); const n=+args.find(a=>/^\d+$/.test(a))||16;
const decks=ARCH.map(a=>({a, d:build(a,'tt')}));
const curve=c=> c<=2? 2*c+1 : c<=6? 2*c : 2*c-1;
function plain(c){ const s=curve(Math.max(1,c.cost))+(c.req>({1:0,2:0,3:1,4:1,5:2,6:2}[c.cost]??3)?1:0); const p=Math.ceil(s/2);
  return {id:'PLAIN-'+c.id, n:'plain unit', t:'unit', sub:'', f:c.f, al:c.al==='N'?'N':c.al, r:'C', cost:c.cost, req:c.req, pow:p, tgh:Math.max(1,s-p), ferry:0, kw:[], fx:[]}; }
function rateOf(i, deck){ let w=0, g=0; for (let j=0;j<decks.length;j++){ if (j===i) continue; for (let k=0;k<n;k++){ const seed=77003*i+131*j+k; const a=E.play(deck,decks[j].d,seed); w+= a.w===0?1:a.w===1?0:0.5; g++; } } return w/g; }
const base=decks.map((x,i)=>rateOf(i,x.d));
const out=[]; const done=new Set(); const t0=Date.now();
const only=args.includes('--deck')? args[args.indexOf('--deck')+1] : null;
for (let i=0;i<decks.length;i++){ if (only && !only.split(',').includes(decks[i].a.id)) continue; const ids=[...new Set(decks[i].d.map(c=>c.id))];
  for (const id of ids){ if (done.has(id)) continue; done.add(id); const c=decks[i].d.find(x=>x.id===id); const pl=plain(c);
    const r=rateOf(i, decks[i].d.map(x=>x.id===id? pl : x)); out.push({n:c.n, id, f:c.f, t:c.t, r:c.r, cost:c.cost, deck:decks[i].a.id, copies:decks[i].d.filter(x=>x.id===id).length, value:+((base[i]-r)*100).toFixed(1)}); } }
out.sort((a,b)=>b.value-a.value);
console.log(`card value, ${n} games a opponent, ${out.length} cards in ${((Date.now()-t0)/1000).toFixed(0)}s. Deck base rates: `+decks.map((x,i)=>x.a.id+' '+(base[i]*100).toFixed(0)).join(', '));
for (const x of out) console.log((x.value>=0?'+':'')+x.value.toFixed(1).padStart(5), x.n.padEnd(34), x.f, x.t.padEnd(11), x.r, x.cost, x.deck, x.copies+'x');
const j=args.indexOf('--json'); if (j>=0) fs.writeFileSync(args[j+1], JSON.stringify({n, base:Object.fromEntries(decks.map((x,i)=>[x.a.id,base[i]])), cards:out},null,1));
