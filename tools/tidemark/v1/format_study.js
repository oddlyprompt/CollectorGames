// Historical format study (offline, read-only): how diverse is a competitive format built from a given pool of Tidemark cards?
// Builds candidate decks from the pool with the same deck builder as the game's library, plays a round robin with the rules engine, runs the game's
// share model (shares follow exp(6 x strength)) and reports how many decks matter and how much of the top decks a chosen core set supplies.
//   node tools/tidemark/v1/format_study.js LABEL --sets FT,SB,... [--core FT] [--fill 215] [--nofill-core] [--decks 34] [--games 6]
// The pool is every identity with a printing in the --sets window (plus --core sets); --fill adds random other historical identities up to that size (a stand-in for
// larger flagship expansions that do not exist yet). Output: one JSON line on stdout.
const fs=require('fs'), path=require('path');
const E=require('./engine.js'), D=require('./decks.js'), {CARDS}=require('./cards.js');
const arg=(k,d)=>{ const i=process.argv.indexOf(k); return i>=0? process.argv[i+1] : d; };
const LABEL=process.argv[2], SETS=(arg('--sets','')||'').split(',').filter(Boolean), CORE=(arg('--core','')||'').split(',').filter(Boolean), FILL=+arg('--fill',0), NDECK=+arg('--decks',34), GAMES=+arg('--games',6), SEED=+arg('--seed',7);
const cj=JSON.parse(fs.readFileSync(path.join(__dirname,'..','..','..','tidemark-production','cards.json'),'utf8'));
const setsOf={}; for (const p of cj.printings){ if (p.alt) continue; (setsOf[p.card]=setsOf[p.card]||new Set()).add(p.set); }
function rng(seed){ let h=(seed>>>0)^0x9e3779b9||1; return ()=>{ h^=h<<13; h>>>=0; h^=h>>>17; h^=h<<5; h>>>=0; return h/4294967296; }; }
const R=rng(SEED*977+13);
const inSets=(c,L)=>{ const s=setsOf[c.id]; return s && L.some(x=>s.has(x)); };
const legal=new Set(); for (const c of CARDS) if (inSets(c,SETS)||inSets(c,CORE)) legal.add(c);
const hist=CARDS.filter(c=>!c.tt || (setsOf[c.id] && [...setsOf[c.id]].some(s=>s!=='TT')));
if (FILL>legal.size){ const others=hist.filter(c=>!legal.has(c) && !(process.argv.includes('--nofill-core') && inSets(c,['FT']))); for (let i=others.length-1;i>0;i--){ const j=Math.floor(R()*(i+1)); [others[i],others[j]]=[others[j],others[i]]; } for (const c of others){ if (legal.size>=FILL) break; legal.add(c); } }
for (const c of CARDS) c.tt=legal.has(c);   // the deck builder's legality test is the tt flag
const coreIds=new Set(CARDS.filter(c=>inSets(c,CORE)).map(c=>c.id));
const FAC=['CR','TW','IR','TB','FF','AC','HL'], PLANS=['aggro','midrange','control'];
const sig=d=>d.map(c=>c.id).sort().join(','); const seen=new Set(), decks=[], names=[];
const add=(d,n)=>{ if (d.length!==50) return; const k=sig(d); if (seen.has(k)) return; seen.add(k); decks.push(d); names.push(n); };
for (const a of D.ARCH) add(D.build(a,'tt',{fresh:true}), a.name);
for (let i=0; decks.length<NDECK && i<400; i++){ const f=FAC[i%7], g=FAC[Math.floor(R()*7)]; if (g===f) continue; const spec={id:'b'+i, mix:[f,g], plan:PLANS[Math.floor(R()*3)], tech:R()<0.6? D.TECH[Math.floor(R()*D.TECH.length)] : null, lead:null, seed:Math.floor(R()*1e9)}; add(D.brew(spec), f+'/'+g+' '+spec.plan); }
const n=decks.length; const M=Array.from({length:n},()=>Array(n).fill(0.5));
for (let i=0;i<n;i++) for (let j=i+1;j<n;j++){ let w=0; for (let k=0;k<GAMES;k++){ const seed=(((i*7919+j)*131+k)*2654435761+SEED)>>>0; const r=k%2? E.play(decks[j],decks[i],seed) : E.play(decks[i],decks[j],seed); const a=k%2? (r.w===1?1:r.w===0?0:0.5) : (r.w===0?1:r.w===1?0:0.5); w+=a; } M[i][j]=w/GAMES; M[j][i]=1-w/GAMES; }
let s=Array(n).fill(1/n); for (let it=0;it<60;it++){ const str=s.map((_,i)=>{ let x=0; for (let j=0;j<n;j++) x+=s[j]*M[i][j]; return x; }); const w=str.map(x=>Math.exp(6*x)); const T=w.reduce((a,b)=>a+b,0); s=s.map((x,i)=>0.5*x+0.5*w[i]/T); }
const order=s.map((x,i)=>i).sort((a,b)=>s[b]-s[a]); const top=order.slice(0,5);
let copies=0, coreCopies=0; const coreUsed=new Set(); for (const i of top) for (const c of decks[i]){ copies++; if (coreIds.has(c.id)){ coreCopies++; coreUsed.add(c.id); } }
const strs=s.map((_,i)=>{ let x=0; for (let j=0;j<n;j++) x+=s[j]*M[i][j]; return x; });
// decks that share most of their cards are one archetype: cluster by overlap (Jaccard 0.55 or more of the distinct cards), then count archetypes by share
const sets=decks.map(d=>new Set(d.map(c=>c.id))); const jac=(x,y)=>{ let i=0; for (const v of x) if (y.has(v)) i++; return i/(x.size+y.size-i); };
const cl=[]; for (const i of order){ let hit=null; for (const c of cl) if (jac(sets[i],sets[c.rep])>=0.55){ hit=c; break; } if (hit){ hit.share+=s[i]; hit.n++; } else cl.push({rep:i,share:s[i],n:1}); }
const csh=cl.map(c=>c.share).sort((a,b)=>b-a); const chhi=csh.reduce((a,x)=>a+x*x,0);
const hhi=s.reduce((a,x)=>a+x*x,0); const poolCore=[...legal].filter(c=>coreIds.has(c.id)).length;
const distinctTop=new Set(); for (const i of top) for (const c of decks[i]) distinctTop.add(c.id);
console.log(JSON.stringify({label:LABEL, pool:legal.size, core:poolCore, decks:n, topShare:+s[order[0]].toFixed(3), effDecks:+(1/hhi).toFixed(1), over3:s.filter(x=>x>=0.03).length, archetypes:cl.length, archOver3:csh.filter(x=>x>=0.03).length, effArch:+(1/chhi).toFixed(1), topArch:+csh[0].toFixed(3), over1:s.filter(x=>x>=0.01).length, strSpread:+(Math.max(...strs)-Math.min(...strs)).toFixed(3), coreShareTop5:+(copies? coreCopies/copies : 0).toFixed(3), coreShareOfPool:+(legal.size? poolCore/legal.size : 0).toFixed(3), coreDistinctInTop5:coreUsed.size, distinctInTop5:distinctTop.size, topDecks:top.slice(0,3).map(i=>names[i]+' '+(s[i]*100).toFixed(1)+'%')}));
