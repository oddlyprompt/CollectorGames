// Deck tuning by play, the way players refine a list: for each archetype, try swapping its weakest-rated card for a better
// candidate from its factions and keep the swap when the deck does better against the field on the same seeds.
// Writes decks_tuned.json (lists by card name), which decks.js uses when present. node tools/tidemark/v1/tune.js [rounds] [games]
const fs=require('fs'), path=require('path'); const E=require('./engine.js'); const {ARCH, build, rate, legal}=require('./decks.js'); const {CARDS}=require('./cards.js');
const args=process.argv.slice(2).filter(a=>/^\d+$/.test(a)); const rounds=+args[0]||3, n=+args[1]||8, TRIES=16;
const OUT=path.join(__dirname,'decks_tuned.json');
let seed=12345; const rnd=()=>{ seed=(Math.imul(seed,1103515245)+12345)>>>0; return seed/4294967296; };
const byName=new Map(CARDS.map(c=>[c.n,c]));
let decks=ARCH.map(a=>({a, d:build(a,'tt',{fresh:true})}));
function score(i, d){ let w=0, g=0; for (let j=0;j<decks.length;j++){ if (j===i) continue; for (let k=0;k<n;k++){ const r=E.play(d,decks[j].d,5003*i+97*j+k+1); w+= r.w===0?1:r.w===1?0:0.5; g++; } } return w/g; }
const t0=Date.now();
for (let r=0;r<rounds;r++){ let kept=0;
  for (let i=0;i<decks.length;i++){ const a=decks[i].a; let d=decks[i].d; let s=score(i,d);
    const pool=CARDS.filter(c=>legal(c,'tt') && (a.mix.includes(c.f) || c.f==='NE'));
    for (let t=0;t<TRIES;t++){ const names=[...new Set(d.map(c=>c.n))]; const out=byName.get(names[Math.floor(rnd()*names.length)]);
      const ins=pool.filter(c=>!names.includes(c.n)); if (!ins.length) break; const cand=ins[Math.floor(rnd()*ins.length)];
      const k=d.filter(c=>c===out).length; const nd=d.filter(c=>c!==out); for (let q=0;q<Math.min(k,cand.r==='L'?1:3);q++) nd.push(cand); while (nd.length<50) nd.push(d.find(c=>c!==out && nd.filter(x=>x===c).length<(c.r==='L'?1:3)) || cand);
      if (nd.length!==50) continue; const ns=score(i,nd); if (ns>s+0.02){ d=nd; s=ns; kept++; } }
    decks[i].d=d; decks[i].s=s; }
  console.log(`round ${r+1}: ${kept} swaps kept, ${((Date.now()-t0)/1000).toFixed(0)}s; `+decks.map(x=>x.a.id+' '+(x.s*100).toFixed(0)).join(', ')); }
fs.writeFileSync(OUT, JSON.stringify(Object.fromEntries(decks.map(x=>[x.a.id, x.d.map(c=>c.n)])),null,1));
console.log('wrote', path.relative(process.cwd(), OUT));
