// Tidemark Version 1 balance check: every archetype deck of the Tenth Tide format plays every other.
// node tools/tidemark/v1/sim.js [games-per-pair] [--pool all] [--cards]   (--cards lists how often each card is played and wins)
const E=require('./engine.js'); const {ARCH, build}=require('./decks.js'); const {CARDS}=require('./cards.js');
const args=process.argv.slice(2); const n=+args.find(a=>/^\d+$/.test(a))||40; const pool=args.includes('--pool')? args[args.indexOf('--pool')+1] : 'tt';
function roundRobin(decks, n, cfg){ const M=decks.map(()=>decks.map(()=>0.5)); const T={games:0, turns:[], why:{}, first:0, played:{}, won:{}, ops:{}};
  for (let i=0;i<decks.length;i++) for (let j=i+1;j<decks.length;j++){ let w=0;
    for (let g=0;g<n;g++){ const r=E.play(decks[i].d,decks[j].d,1000003*i+7919*j+g,cfg); T.games++; T.turns.push(r.turns); T.why[r.why]=(T.why[r.why]||0)+1; if (r.w===r.first) T.first++; w+= r.w===0?1 : r.w===1?0 : 0.5;
      const seen=[new Set(),new Set()]; for (const [p,id] of r.log.played) seen[p].add(id); for (const p of [0,1]) for (const id of seen[p]){ T.played[id]=(T.played[id]||0)+1; if (r.w===p) T.won[id]=(T.won[id]||0)+1; }
      for (const [k,v] of Object.entries(r.log.ops)) T.ops[k]=(T.ops[k]||0)+v; }
    M[i][j]=w/n; M[j][i]=1-w/n; }
  T.turns.sort((a,b)=>a-b); const rate=decks.map((x,i)=>(M[i].reduce((p,q)=>p+q,0)-0.5)/(decks.length-1));
  return {M, rate, T, avg:T.turns.reduce((a,b)=>a+b,0)/T.turns.length, med:T.turns[T.turns.length>>1]}; }
module.exports={roundRobin};
if (require.main===module){ const decks=ARCH.map(a=>({a, d:build(a,pool)})).filter(x=>x.d.length===50);
  const t0=Date.now(); const R=roundRobin(decks,n);
  console.log(`Tidemark rules 1.0, format ${pool==='all'?'all cards':'Tenth Tide'}: ${decks.length} decks, ${n} games a pair, ${R.T.games} games in ${((Date.now()-t0)/1000).toFixed(0)}s`);
  decks.map((x,i)=>[x,R.rate[i],i]).sort((a,b)=>b[1]-a[1]).forEach(([x,v,i])=>console.log('  '+x.a.name.padEnd(18), (v*100).toFixed(1).padStart(5)+'%', '  '+x.a.mix.join('+').padEnd(10), ' worst '+(Math.min(...R.M[i].filter((_,k)=>k!==i))*100).toFixed(0)+'% best '+(Math.max(...R.M[i].filter((_,k)=>k!==i))*100).toFixed(0)+'%'));
  console.log(`turns avg ${R.avg.toFixed(1)} median ${R.med}, endings ${JSON.stringify(R.T.why)}, first player wins ${(R.T.first/R.T.games*100).toFixed(1)}%`);
  const pairs=[]; for (let i=0;i<decks.length;i++) for (let j=i+1;j<decks.length;j++) pairs.push(R.M[i][j]); console.log(`pairs within 40-60%: ${pairs.filter(p=>p>=0.4&&p<=0.6).length}/${pairs.length}`);
  if (args.includes('--cards')){ const byId=new Map(CARDS.map(c=>[c.id,c])); const rows=Object.entries(R.T.played).filter(([id])=>byId.has(id)).map(([id,k])=>[byId.get(id),k,(R.T.won[id]||0)/k]).sort((a,b)=>b[2]-a[2]);
    console.log('card                              games  win%'); for (const [c,k,w] of rows) if (k>=n) console.log('  '+c.n.padEnd(32), String(k).padStart(5), (w*100).toFixed(0).padStart(5)+'%', c.f, c.cost);
    console.log('ops used', JSON.stringify(R.T.ops)); } }
