// Metagame evolution experiment: node tools/rift-parade/meta.js [--quick] [--weeks 52]
// A population of players (shares of the field) copies what wins, while builders keep testing new variants; the engine plays all the games.
//   frozen    : the eight representative decks only, shares follow results, nobody invents anything
//   discovery : every week builders try new decks (variants of what is popular, plus fresh theme packages); a deck that holds up joins the field
//   release   : like discovery, but the game starts with only episodes 1-9 legal (91 cards) and episodes 10-12 (39 cards) are released in week 26
// Output: design/tcg3/data/meta.json (weekly shares, leaders) and design/tcg3/meta-report.md.
'use strict';
const cp=require('child_process'), fs=require('fs'), path=require('path');
const L=require('./lib.js'); const B=require('./builders.js'); const E=L.E; const {CARDS,ORDER}=B;
const quick=process.argv.includes('--quick'); const arg=(k,d)=>{ const i=process.argv.indexOf(k); return i>0? process.argv[i+1] : d; };
if(process.argv.includes('--worker')){ process.on('message',m=>{ let w=0; for(let k=0;k<m.n;k++){ const r=L.game(m.a,m.b,m.seed+k*7919,['balanced','balanced'],k%2); w+= r.winner===0?1:r.winner===1?0:0.5; } process.send({id:m.id,w,g:m.n}); }); return; }
const WEEKS=+arg('--weeks',quick?10:52), RELEASE=Math.floor(WEEKS/2);
const W=4, idle=[], queue=[], pending=new Map(); let nid=1;
for(let i=0;i<W;i++){ const c=cp.fork(__filename,['--worker']); idle.push(c); c.on('message',m=>{ const p=pending.get(m.id); pending.delete(m.id); idle.push(c); p(m); pump(); }); }
function pump(){ while(idle.length&&queue.length){ const c=idle.pop(); const j=queue.shift(); pending.set(j.id,j.res); c.send(j.msg); } }
const play=(a,b,n,seed)=>new Promise(res=>{ const id=nid++; queue.push({id,res,msg:{id,a:a.list,b:b.list,n,seed}}); pump(); });
// payoff cache: key of the two lists -> accumulated games, topped up to CELL games
const CELL=quick?6:10, cache=new Map(); const key=(a,b)=>a.key+'|'+b.key;
async function cell(a,b){ if(a===b) return 0.5; const k1=key(a,b), k2=key(b,a); if(cache.has(k1)) return cache.get(k1); if(cache.has(k2)) return 1-cache.get(k2);
  const r=await play(a,b,CELL,a.seedBase*31+b.seedBase); const v=r.w/r.g; cache.set(k1,v); return v; }
let deckSeq=0; const REGISTRY={}; const mkDeck=(list,origin,week)=>{ const d={id:'D'+(++deckSeq),key:list.slice().sort().join(),seedBase:deckSeq*97+13,list,origin,born:week,share:0,low:0}; REGISTRY[d.id]={origin,born:week,list}; return d; };
// make a list legal for a restricted card pool: swap each illegal card for the closest legal one (same type, nearest cost, shared themes)
function repair(list,legal){ const out=[]; const n={}; for(const id of list){ if(legal.has(id)){ out.push(id); n[id]=(n[id]||0)+1; } }
  for(const id of list.filter(i=>!legal.has(i))){ const d=CARDS[id]; const c=[...legal].filter(x=>CARDS[x].type===d.type&&(n[x]||0)<CARDS[x].max).sort((a,b)=>score(b)-score(a)); function score(x){ const e=CARDS[x]; let s=-Math.abs(e.cost-d.cost); for(const t of d.themes) if(e.themes.has(t)) s+=1.2; return s; } const x=c[0]||[...legal].find(y=>(n[y]||0)<CARDS[y].max); out.push(x); n[x]=(n[x]||0)+1; } return out; }
async function run(cond,seed){ const r=B.mulberry(seed*7+cond.length*131); const weeks=[]; const restricted=cond==='release';
  const early=new Set(ORDER.filter(i=>CARDS[i].ep<=9)); let legal=restricted? early : new Set(ORDER);
  let field=L.DECKS.map(d=>mkDeck(restricted? repair(d.list,legal) : d.list.slice(),'representative:'+d.id,0));
  const dd=(x,y)=>x; field.forEach(d=>{ d.share=1/field.length; });
  const gone=[]; const born=[]; for(let w=1;w<=WEEKS;w++){
    if(restricted&&w===RELEASE){ legal=new Set(ORDER); // release: the full representative decks (using the new cards) arrive, small at first
      for(const d of L.DECKS){ const nd=mkDeck(d.list.slice(),'release:'+d.id,w); nd.share=0.02; field.push(nd); } normalize(field); }
    // payoffs against the current field
    const M=[]; for(const a of field){ const row=await Promise.all(field.map(b=>cell(a,b))); M.push(row); }
    const win=field.map((a,i)=>field.reduce((s,b,j)=>s+b.share*M[i][j],0)); const avg=field.reduce((s,a,i)=>s+a.share*win[i],0);
    // players move toward what wins (with inertia) and a little noise; low-share decks that are not worth the trouble fade
    field.forEach((d,i)=>{ const target=d.share*Math.exp(6*(win[i]-avg)); d.share=0.6*d.share+0.4*target*(1+0.06*(r()-0.5)); if(d.share<0.012) d.low++; else d.low=0; });
    normalize(field);
    // builders try new decks
    if(cond!=='frozen'){ const topK=field.slice().sort((a,b)=>b.share-a.share).slice(0,6); const tries=quick?2:3;
      for(let t=0;t<tries;t++){ let list; const pool=[...legal]; const roll=r();
        if(roll<0.6){ const base=topK[Math.floor(r()*topK.length)]; list=B.mutate(base.list,r,pool); }       // tech a popular deck
        else { const s=B.synergySeed(r,pool); list=s.list; }                                                  // a fresh theme package
        if(E.validateDeck(list).length||list.some(i=>!legal.has(i))) continue; const nd=mkDeck(list,roll<0.6?'variant':'new package',w); if(field.some(f=>f.key===nd.key)) continue;
        const rs=await Promise.all(topK.map(o=>play(nd,o,quick?4:6,nd.seedBase+o.seedBase))); const sc=rs.reduce((s,x)=>s+x.w,0)/rs.reduce((s,x)=>s+x.g,0); const base=topK.reduce((s,o)=>s+o.share*0.5,0)/1; // field decks average about 0.5 against each other
        if(sc>=0.47){ nd.share=0.015; field.push(nd); born.push({week:w,id:nd.id,origin:nd.origin,score:+sc.toFixed(2)}); } }
      normalize(field); }
    // retire decks nobody plays
    for(let i=field.length-1;i>=0;i--) if(field[i].low>=6&&field.length>6){ gone.push({week:w,id:field[i].id}); field.splice(i,1); } normalize(field);
    const sorted=field.slice().sort((a,b)=>b.share-a.share);
    weeks.push({week:w,leader:sorted[0].id,leaderOrigin:sorted[0].origin,top5:sorted.slice(0,5).map(d=>[d.id,+d.share.toFixed(3)]),decks:field.length,effective:+(1/field.reduce((s,d)=>s+d.share*d.share,0)).toFixed(2),topShare:+sorted[0].share.toFixed(3),
      shares:Object.fromEntries(field.map(d=>[d.id,+d.share.toFixed(3)]))});
    if(w%4===0) console.log(`${cond} seed ${seed} week ${w}: leader ${sorted[0].id} (${sorted[0].origin}) ${(sorted[0].share*100).toFixed(0)}%, ${field.length} decks, effective ${weeks[weeks.length-1].effective}`); }
  const info={}; const reg=d=>{ info[d.id]={origin:d.origin,born:d.born,list:d.list}; }; field.forEach(reg); // also keep retired ones' origin via weeks only
  return {cond,seed,weeks,born,gone,deckInfo:info,allDecks:Object.fromEntries([...new Set(weeks.flatMap(w=>Object.keys(w.shares)))].map(id=>[id,id])),catalog:catalog}; }
const catalog={}; 
function normalize(f){ const s=f.reduce((a,d)=>a+d.share,0)||1; f.forEach(d=>{ d.share/=s; }); }
// remember every deck ever fielded (for the report)
const _mk=mkDeck; 
(async()=>{ const t0=Date.now(); const conds=['frozen','discovery','release']; const seeds=quick?[1]:[1,2]; const results=[];
  const jobs=[]; for(const c of conds) for(const s of seeds) jobs.push(run(c,s).then(r=>{ results.push(r); console.log(`done ${c} ${s} after ${((Date.now()-t0)/1000).toFixed(0)}s`); }));
  await Promise.all(jobs);
  const dir=path.join(__dirname,'../../design/tcg3/data'); const f=path.join(dir,'meta'+(quick?'-quick':'')+'.json');
  const decks={}; // every list that was ever in a field, by key id, for later inspection
  fs.writeFileSync(f,JSON.stringify({date:new Date().toISOString().slice(0,10),weeks:WEEKS,release:RELEASE,cell:CELL,registry:REGISTRY,runs:results.map(r=>({cond:r.cond,seed:r.seed,weeks:r.weeks,born:r.born,gone:r.gone}))}));
  console.log('wrote '+f); process.exit(0); })();
