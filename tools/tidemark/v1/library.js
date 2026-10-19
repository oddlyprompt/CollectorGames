// Tidemark metagame library: the decks the game's living field draws from, and how every deck does against every other,
// played by the rules engine. The game (src/engine/tm/tm_world.js) never plays these matchups itself: Tidemark games take
// about 25 ms each, so the field is precomputed here (like Wildkin's WK_META) and only bans and finals are played live.
//  stage 1  the 10 tuned archetypes (decks_tuned.json), three re-tuned versions of each with tech packages, and brewed lists for every
//           faction pair and plan (some built around a Legendary or a card that rewards a kind of card); everyone plays everyone
//  start    the fifteen decks the format opens with: the archetypes and the lists that did best against them
//  stage 2  answers, in six rounds: lists brewed like the stage-1 ones and then refined by testing card swaps against the eight strongest decks of the library so far; each round's answers play the whole library before the next round, so later answers target decks that are themselves answers.
//           When a deck rises in the game there are lists that can beat it (the game finds them as 'new decks')
//  M[i][j]  is the share of games deck i wins against deck j (draws count half), GAMES games per pair, both seats
// node tools/tidemark/v1/library.js [--check]    writes tidemark-production/meta_library.json (about 15 minutes; --check only verifies it is current)
const fs=require('fs'), path=require('path'), crypto=require('crypto');
const {Worker, isMainThread, parentPort, workerData}=require('worker_threads');
const ROOT=path.resolve(__dirname,'../../..'), OUT=path.join(ROOT,'tidemark-production/meta_library.json');
const E=require('./engine.js'), D=require('./decks.js'), {CARDS}=require('./cards.js');
const GAMES=8, START=15, N1=70, N2=180, SWAPS=20, ROUNDS=6;
const FAC=['CR','TW','IR','TB','FF','AC','HL'], SIDE={CR:'L',TW:'L',IR:'L',TB:'S',FF:'S',AC:'S',HL:'D'};
const FN={CR:'Crownlands',TW:'Thornwild',IR:'Iron Reach',TB:'Tideborn',FF:'Free Fleets',AC:'Abyssal Choir',HL:'Harbor Leagues'};
const PLANS=['aggro','midrange','control'];
const byId=new Map(CARDS.map(c=>[c.id,c])), byName=new Map(CARDS.map(c=>[c.n,c]));
const fingerprint=()=>crypto.createHash('sha256').update(JSON.stringify(CARDS.map(c=>[c.id,c.cost,c.req,c.pow,c.tgh,c.fort,c.kw,c.fx]))+fs.readFileSync(path.join(__dirname,'engine.js'),'utf8')+fs.readFileSync(path.join(__dirname,'decks.js'),'utf8')+fs.readFileSync(__filename,'utf8')).digest('hex').slice(0,16);
function rng(seed){ let h=(seed>>>0)^0x9e3779b9||1; return ()=>{ h^=h<<13; h>>>=0; h^=h>>>17; h^=h<<5; h>>>=0; return h/4294967296; }; }
const sigOf=d=>{ const k={}; for (const c of d) k[c.id]=(k[c.id]||0)+1; return Object.keys(k).sort().map(id=>id+'x'+k[id]).join(','); };
const cntOf=d=>{ const k={}; for (const c of d) k[c.id]=(k[c.id]||0)+1; return k; };
function partner(f, R){ const own=FAC.filter(x=>x!==f && SIDE[x]===SIDE[f]); const x=R(); if (f==='HL') return FAC.filter(y=>y!=='HL')[Math.floor(R()*6)]; if (x<0.62) return own[Math.floor(R()*own.length)]; if (x<0.92) return 'HL'; return FAC.filter(y=>y!==f && y!=='HL')[Math.floor(R()*5)]; }
const PLANN={aggro:'Aggro',midrange:'Midrange',control:'Control'};
const name=spec=>{ const t=spec.tech? ' ('+spec.tech.n+')' : ''; if (spec.lead) return spec.lead.n+' '+PLANN[spec.plan]+t; return spec.mix.filter(f=>f!=='NE').map(f=>FN[f]).join(' / ')+' '+PLANN[spec.plan]+t; };
function seat(decks, i, j, k, base, nmatch){ const seed=(((i*7919+j)*131+k)*2654435761+base)>>>0; const r=k%2? E.play(decks[j],decks[i],seed) : E.play(decks[i],decks[j],seed); return k%2? (r.w===1?1:r.w===0?0:0.5) : (r.w===0?1:r.w===1?0:0.5); }
function matchRow(decks, i, js, base){ const out=[]; for (const j of js){ let w=0; for (let k=0;k<GAMES;k++) w+=seat(decks,i,j,k,base); out.push(w/GAMES); } return out; }
// a brew refined by testing swaps against some decks (the same seeds for both lists, so the comparison is fair)
function refine(d, spec, targets, swaps, R, base){
  const pool=CARDS.filter(c=>c.tt && (spec.mix.includes(c.f)||c.f==='NE'));
  const G4=targets.length>6? 3 : 4; const score=dd=>{ let w=0, n=0; targets.forEach((t,j)=>{ for (let k=0;k<G4;k++){ const seed=((base+j*31+k)*2654435761)>>>0; const r=E.play(dd,t,seed); w+= r.w===0?1 : r.w===1?0 : 0.5; } n+=G4; }); return w/n; };
  let s0=score(d); for (let i=0;i<swaps;i++){ const names=[...new Set(d.map(c=>c.n))].filter(n=>!spec.lead || n!==spec.lead.n); const out=names[Math.floor(R()*names.length)]; const ins=pool.filter(c=>!names.includes(c.n)); if (!ins.length) break;
    const W=spec.tech&&spec.tech.w; const lean=W? ins.filter(c=>[...D.roles(c)].some(r=>(W[r]||1)>1.4)) : []; const from=(lean.length && R()<0.6)? lean : ins; const cand=from[Math.floor(R()*from.length)];
    const k=d.filter(c=>c.n===out).length; const nd=d.filter(c=>c.n!==out); for (let q=0;q<Math.min(k,cand.r==='L'?1:3);q++) nd.push(cand);
    while (nd.length<50){ const f=d.find(c=>c.n!==out && nd.filter(x=>x===c).length<(c.r==='L'?1:3)); if (!f) break; nd.push(f); } if (nd.length!==50) continue;
    const s1=score(nd); if (s1>s0){ d=nd; s0=s1; } }
  return d; }
if (!isMainThread){
  const w=workerData; if (w.task==='rows'){ const ds=w.decks.map(ids=>ids.map(id=>byId.get(id))); const res=[]; for (const [i,js] of w.jobs) res.push([i, matchRow(ds,i,js,w.base)]); parentPort.postMessage(res); }
  else { const res=[]; for (const s of w.specs){ const R=rng(s.seed+17); const spec={id:s.id,mix:s.mix,plan:s.plan,tech:s.tech? D.TECH.find(t=>t.k===s.tech) : null,lead:s.lead? byId.get(s.lead) : null,seed:s.seed}; const d0=D.brew(spec); if (d0.length!==50){ continue; }
      const d=refine(d0, spec, s.targets.map(ids=>ids.map(id=>byId.get(id))), SWAPS, R, s.seed); res.push({id:s.id, ids:d.map(c=>c.id)}); } parentPort.postMessage(res); }
  return; }
function run(task, parts){ return Promise.all(parts.map(p=>new Promise((res,rej)=>{ const wk=new Worker(__filename,{workerData:Object.assign({task},p)}); wk.on('message',res); wk.on('error',rej); }))); }
const NW=Math.max(1,Math.min(8,require('os').cpus().length));
async function matrix(decks, M, done){ const n=decks.length; const jobs=Array.from({length:NW},()=>[]); let w=0; for (let i=0;i<n;i++){ const js=[]; for (let j=i+1;j<n;j++) if (!done(i,j)) js.push(j); if (js.length) jobs[w++%NW].push([i,js]); }
  const ids=decks.map(d=>d.map(c=>c.id)); const out=await run('rows', jobs.map(j=>({decks:ids, jobs:j, base:12345}))); for (const part of out) for (const [i,r] of part){ let q=0; for (let jj=i+1;jj<n;jj++){ if (done(i,jj)) continue; M[i][jj]=r[q]; M[jj][i]=1-r[q]; q++; } } }
async function main(){
  const fp=fingerprint(); if (process.argv.includes('--check')){ let cur=null; try { cur=JSON.parse(fs.readFileSync(OUT,'utf8')).fp; } catch(e){} if (cur!==fp){ console.log('Tidemark meta library is out of date (node tools/tidemark/v1/library.js)'); process.exit(1); } console.log('Tidemark meta library OK'); return; }
  const R=rng(20261019), cands=[], seen=new Set(); const add=(spec,d,why,nm)=>{ if (d.length!==50) return false; const k=sigOf(d); if (seen.has(k)) return false; seen.add(k); cands.push({spec,d,why,name:nm||name(spec)}); return true; };
  const t0=Date.now(); const lap=s=>console.log(s,'('+Math.round((Date.now()-t0)/1000)+' s)');
  // ---- stage 1
  for (const a of D.ARCH) add({id:a.id,mix:a.mix,plan:a.plan==='tempo'?'midrange':a.plan,tech:null,lead:null,seed:0}, D.build(a,'tt'), 'start', a.name);
  const AROUND=CARDS.filter(c=>c.tt && c.f!=='NE' && (c.r==='L' || CARDS.some(o=>o!==c && o.tt && D.synergy(c,o)>=1)));
  for (const a of D.ARCH) for (let i=0;i<3;i++){ const tech=D.TECH[Math.floor(R()*D.TECH.length)]; const spec={id:a.id+'-'+tech.k,mix:a.mix,plan:a.plan==='tempo'?'midrange':a.plan,tech,lead:null,seed:Math.floor(R()*1e9)}; add(spec, D.brew(spec), 'tech'); }
  const mk=(i,R)=>{ const f=FAC[i%7]; const r=R(); const spec={id:'b'+i,mix:[f,partner(f,R)],plan:PLANS[Math.floor(R()*3)],tech:r<0.6? D.TECH[Math.floor(R()*D.TECH.length)] : null,lead:null,seed:Math.floor(R()*1e9)};
    let why='brew'; if (r>=0.45){ const L=AROUND.filter(c=>c.f===f); if (L.length){ spec.lead=L[Math.floor(R()*L.length)]; why='around'; } } return {spec, why}; };
  for (let i=0;cands.length<N1 && i<2000;i++){ const {spec,why}=mk(i,R); add(spec, D.brew(spec), why); }
  const n1=cands.length; console.log(n1,'decks in stage 1,',n1*(n1-1)/2,'pairs x',GAMES,'games');
  const M1=cands.map(()=>cands.map(()=>0.5)); await matrix(cands.map(c=>c.d), M1, ()=>false); lap('stage 1 matchups played');
  const arch=cands.map((c,i)=>c.why==='start'? i : -1).filter(i=>i>=0); const g1=cands.map((c,i)=>arch.reduce((s,a)=>s+(a===i?0.5:M1[i][a]),0)/arch.length);
  const start=arch.concat(cands.map((c,i)=>i).filter(i=>!arch.includes(i)).sort((a,b)=>g1[b]-g1[a])).slice(0,START);
  // ---- stage 2: answers, in rounds. Each round the strongest decks of the library so far are found and lists are refined against some of them (and
  // against a few others); every answer plays the whole library before the next round, so later answers target decks that are themselves answers.
  const st=start.map(i=>start.reduce((x,j)=>x+(i===j?0:M1[i][j]),0)/(start.length-1)); const strongest=start.map((i,k)=>[i,st[k]]).sort((a,b)=>b[1]-a[1]).map(x=>x[0]);
  let M=M1.map(r=>r.slice()); const grow=()=>{ const n=cands.length; for (const r of M) while (r.length<n) r.push(0.5); while (M.length<n) M.push(Array(n).fill(0.5)); };
  const R2=rng(777); let nSpec=0;
  for (let round=1; round<=ROUNDS; round++){
    const n=cands.length; const avg=M.map((r,i)=>r.reduce((x,y,j)=>x+(i===j?0:y),0)/(n-1)); const t20=avg.map((a,i)=>i).sort((a,b)=>avg[b]-avg[a]).slice(0,20);
    const str=t20.map(i=>t20.reduce((x,j)=>x+(i===j?0:M[i][j]),0)/19); const top8=t20.map((i,k)=>[i,str[k]]).sort((a,b)=>b[1]-a[1]).slice(0,8).map(x=>x[0]);
    const specs=[]; for (let i=0;i<N2/ROUNDS*2 && specs.length<N2/ROUNDS;i++){ const {spec,why}=mk(1000+nSpec++,R2); const tg=top8.slice();   // an answer must do well against all of the strongest decks at once, not one of them
      specs.push({id:spec.id, mix:spec.mix, plan:spec.plan, tech:spec.tech?spec.tech.k:null, lead:spec.lead?spec.lead.id:null, seed:spec.seed, why, targets:[...new Set(tg)].map(j=>cands[j].d.map(c=>c.id))}); }
    const parts=Array.from({length:NW},()=>({specs:[]})); specs.forEach((s,i)=>parts[i%NW].specs.push(s)); const outs=(await run('refine', parts)).flat(); const why2=new Map(specs.map(s=>[s.id,s]));
    const nOld=cands.length; let added=0; for (const o of outs){ const s=why2.get(o.id); const spec={id:s.id,mix:s.mix,plan:s.plan,tech:s.tech?D.TECH.find(t=>t.k===s.tech):null,lead:s.lead?byId.get(s.lead):null,seed:s.seed}; if (add(spec, o.ids.map(id=>byId.get(id)), s.why)) added++; }
    grow(); await matrix(cands.map(c=>c.d), M, (i,j)=>i<nOld && j<nOld); lap('round '+round+': '+added+' answers refined and tested ('+cands.length+' decks)'); }
  const decks=cands.map(c=>({id:c.spec.id||c.name, name:c.name, why:c.why, mix:c.spec.mix, plan:c.spec.plan, tech:c.spec.tech? c.spec.tech.k : null, techName:c.spec.tech? c.spec.tech.n : null, lead:c.spec.lead? c.spec.lead.id : null, seed:c.spec.seed||0, cnt:cntOf(c.d), sig:sigOf(c.d)}));
  const names=new Set(), ROM=['','',' II',' III',' IV',' V',' VI',' VII',' VIII']; for (const d of decks){ let q=1, k=d.name; while (names.has(k)) k=d.name+(ROM[++q]||' '+q); names.add(k); d.name=k; }
  fs.writeFileSync(OUT, JSON.stringify({schema:'tidemark-meta-library/1', fp, games:GAMES, decks, M:M.map(r=>r.map(x=>+x.toFixed(3))), start})+'\n');
  const sh=start.map(i=>decks[i].name+' '+(st[start.indexOf(i)]*100).toFixed(0)+'%'); console.log('wrote',path.relative(ROOT,OUT),'; opening field:',sh.join(' | '));
  // how many lists outside the opening field beat the opening field's six strongest decks
  const top6=strongest.slice(0,6); const rest=cands.map((c,i)=>i).filter(i=>!start.includes(i)); const sc=rest.map(i=>top6.reduce((s,j)=>s+M[i][j],0)/6).sort((a,b)=>b-a);
  console.log('lists outside the opening field:',rest.length,'; against its six strongest decks: best',sc[0].toFixed(2),', 90th pct',sc[Math.floor(sc.length*0.1)].toFixed(2),', median',sc[sc.length>>1].toFixed(2),'; at 0.47 or better:',sc.filter(x=>x>=0.47).length);
}
main();
