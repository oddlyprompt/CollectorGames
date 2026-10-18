// "Player persona" experiment: node tools/rift-parade/personas.js [--quick]
// Three kinds of deck builder search the 130-card pool and their decks are tested against the eight representative decks and each other.
//   1 synergy pro   (all cards, balanced pilot): themed packages improved by testing swaps against the field
//   2 rich player   (rarest cards, greedy pilot): piles of Secret/Super/Rare cards, weak at deploying them
//   3 budget combo  (Commons and Uncommons only, balanced pilot): the same search, on the cheap pool
// Writes design/tcg3/data/personas.json and design/tcg3/persona-report.md.
'use strict';
const cp=require('child_process'), fs=require('fs'), path=require('path');
const quick=process.argv.includes('--quick');
const L=require('./lib.js'); const B=require('./builders.js'); const E=L.E;
if(process.argv.includes('--worker')){ process.on('message',m=>{ let w=0,g=0; for(let k=0;k<m.n;k++){ const first=k%2; const r=L.game(m.a.list,m.b.list,m.seed+k*7919,[m.a.pilot,m.b.pilot],first); g++; w+= r.winner===0?1:r.winner===1?0:0.5; } process.send({id:m.id,w,g}); }); return; }
const W=4, workers=[], queue=[], idle=[], pending=new Map(); let nextId=1;
for(let i=0;i<W;i++){ const c=cp.fork(__filename,['--worker']); workers.push(c); idle.push(c); c.on('message',m=>{ const p=pending.get(m.id); pending.delete(m.id); idle.push(c); p(m); pump(); }); }
function pump(){ while(idle.length&&queue.length){ const c=idle.pop(); const j=queue.shift(); pending.set(j.id,j.resolve); c.send(j.msg); } }
function match(a,b,n,seed){ return new Promise(res=>{ const id=nextId++; queue.push({id,resolve:res,msg:{id,a,b,n,seed}}); pump(); }); }
const REPS=L.DECKS.map(d=>({id:d.id,list:d.list,pilot:'balanced'}));
async function gauntlet(deck,n,seed){ const rs=await Promise.all(REPS.map((o,i)=>match(deck,o,n,seed+i*104729))); const per={}; let w=0,g=0; rs.forEach((r,i)=>{ per[REPS[i].id]=r.w/r.g; w+=r.w; g+=r.g; }); return {rate:w/g,per,games:g}; }

const NSEARCH=quick?4:6, ITER=quick?3:8, NFINAL=quick?10:40, NH2H=quick?4:12, DECKS_PER=quick?2:6;
const ALL=B.ORDER, CHEAP=B.ORDER.filter(i=>['C','UC'].includes(B.CARDS[i].rarity));
async function searchChain(kind,idx){ const pool=kind==='budget'?CHEAP:ALL; const r=B.mulberry(1000*(kind==='budget'?2:1)+idx*17+3);
  let best; do{ best=B.synergySeed(r,pool); }while(E.validateDeck(best.list).length);
  if(kind==='budget'){ // a budget deck can only hold what it can afford: repair anything above Uncommon
    const ok=new Set(CHEAP); best.list=best.list.map(id=>ok.has(id)?id:B.pick(r,CHEAP.filter(c=>B.legalAdd(B.counts(best.list),c)))); }
  const seedBase=77777+idx*131; let cur=await gauntlet({list:best.list,pilot:'balanced'},NSEARCH,seedBase); const trail=[cur.rate];
  for(let it=0;it<ITER;it++){ const cand=B.mutate(best.list,r,pool); if(E.validateDeck(cand).length) continue; const res=await gauntlet({list:cand,pilot:'balanced'},NSEARCH,seedBase); if(res.rate>=cur.rate){ best.list=cand; cur=res; } trail.push(cur.rate); }
  return {kind,idx,themes:best.themes,list:best.list,searchRate:cur.rate,trail}; }
(async()=>{ const t0=Date.now(); const log=m=>console.log(`[${((Date.now()-t0)/1000).toFixed(0)}s] ${m}`);
  log(`searching: ${DECKS_PER} synergy and ${DECKS_PER} budget chains, ${ITER} swaps each`);
  const chains=[]; for(let i=0;i<DECKS_PER;i++){ chains.push(searchChain('synergy',i)); chains.push(searchChain('budget',i)); }
  const found=await Promise.all(chains); log('search done');
  const r=B.mulberry(4242); const rich=[]; for(let i=0;i<DECKS_PER;i++) rich.push({kind:'rich',idx:i,themes:[],list:B.richDeck(r)});
  const personas=[...found.filter(d=>d.kind==='synergy').map(d=>Object.assign(d,{pilot:'balanced'})),...rich.map(d=>Object.assign(d,{pilot:'greedy'})),...found.filter(d=>d.kind==='budget').map(d=>Object.assign(d,{pilot:'balanced'}))];
  for(const d of personas){ const errs=E.validateDeck(d.list); if(errs.length) throw new Error(d.kind+d.idx+': '+errs.join('; ')); d.id=d.kind+(d.idx+1); Object.assign(d,B.overlap(d.list)); d.avgCost=B.avgCost(d.list); d.value=B.value(d.list); }
  log('final evaluation against the eight representative decks');
  const finals=await Promise.all(personas.map(d=>gauntlet(d,NFINAL,555000+d.idx*37)));
  personas.forEach((d,i)=>{ d.final=finals[i]; });
  // controls: the rich player's decks with a good pilot, and the same decks as the synergy search would play them
  const ctrl=await Promise.all(personas.filter(d=>d.kind==='rich').map(d=>gauntlet({list:d.list,pilot:'balanced'},NFINAL,555000+d.idx*37)));
  personas.filter(d=>d.kind==='rich').forEach((d,i)=>{ d.withGoodPilot=ctrl[i]; });
  log('head to head between the personas');
  const kinds=['synergy','rich','budget']; const h2h={}; const jobs=[];
  for(const a of personas) for(const b of personas) if(a.kind<b.kind) jobs.push(match(a,b,NH2H,909090+a.idx*3+b.idx).then(res=>{ const k=a.kind+'|'+b.kind; h2h[k]=h2h[k]||{w:0,g:0}; h2h[k].w+=res.w; h2h[k].g+=res.g; }));
  await Promise.all(jobs);
  const out={date:new Date().toISOString().slice(0,10),quick,config:{NSEARCH,ITER,NFINAL,NH2H,DECKS_PER},decks:personas.map(d=>({id:d.id,kind:d.kind,pilot:d.pilot,themes:d.themes,list:d.list,searchRate:d.searchRate,trail:d.trail,overlap:d.overlap,closest:d.closest,avgCost:d.avgCost,value:d.value,final:d.final,withGoodPilot:d.withGoodPilot})),h2h};
  const f=path.join(__dirname,'../../design/tcg3/data/personas'+(quick?'-quick':'')+'.json'); fs.writeFileSync(f,JSON.stringify(out)); log('wrote '+f); workers.forEach(w=>w.kill()); process.exit(0); })();
