// Tidemark simulation library: the six archetype decks and runConfig(), which plays a full round robin for one
// configuration and returns every measurement the reports use. Used by sim.js, compare.js and round2.js.
const {CARDS, CARDS3, CHANGES3}=require('./cards.js'); const E=require('./engine.js');
const ARCH=[
 {id:'bastion', name:'Crown Bastion (Land control)', side:'Land', mix:[['CR',3],['IR',3]]},
 {id:'wild', name:'Thornwild Rush (Land aggro)', side:'Land', mix:[['TW',3],['CR',3]]},
 {id:'tempo', name:'Tideborn Tempo (Sea tempo)', side:'Sea', mix:[['TB',3],['FF',3]]},
 {id:'deep', name:'Abyssal Depths (Sea late game)', side:'Sea', mix:[['AC',3],['TB',3]]},
 {id:'fleet', name:'Fleet Raiders (Sea, Vessels)', side:'Sea', mix:[['FF',3],['HL',3]]},
 {id:'harbor', name:'Harbor Hybrid (Land and Sea)', side:'Hybrid', mix:[['HL',3],['CR',2],['FF',2]]},
];
function build(a, pool){ pool=pool||CARDS; const deck=[]; for (const [f,k] of a.mix) for (const c of pool.filter(c=>c.f===f)) for (let i=0;i<(c.r==='L'?1:k);i++) deck.push(c);
  const neutral=pool.filter(c=>c.f==='NE'); let i=0; while (deck.length<50){ deck.push(neutral[i%neutral.length]); i++; }
  while (deck.length>50){ const counts={}; for (const c of deck) counts[c.id]=(counts[c.id]||0)+1; const cand=deck.filter(c=>counts[c.id]>1).sort((x,y)=>y.cost-x.cost)[0]||deck[deck.length-1]; deck.splice(deck.indexOf(cand),1); }
  return deck; }
const DECKS=ARCH.map(a=>({a, d:build(a)}));            // pool 0.2 (rounds 1 and 2)
const DECKS3=ARCH.map(a=>({a, d:build(a,CARDS3)}));    // pool 0.3 (round 3)
// the pool, decks and id lookup for a configuration: rules 0.3 plays pool 0.3 unless cfg.pool says otherwise
const poolOf=cfg=> (cfg.pool||cfg.rules||'0.2')==='0.3'? CARDS3 : CARDS;
const decksOf=cfg=> poolOf(cfg)===CARDS3? DECKS3 : DECKS;
const EXTRA={};   // cards made by experiments (probe.js), by id
const card=(cfg,id)=> EXTRA[id] || poolOf(cfg).find(c=>c.id===id);
const sum2=x=>x[0]+x[1];
// one round robin: every pair of the six decks plays n games (seat order alternates through the seed's coin flip)
function runConfig(cfg, n){
  const D=cfg.decks||decksOf(cfg); const M=D.map(()=>D.map(()=>0.5)); const T={games:0, firstW:0, turns:[], why:{}, played:{}, wonWith:{}, big:[], tricks:{}, c:{}, costTurn:{}, state:{}};
  const add=(k,v)=>{ T.c[k]=(T.c[k]||0)+v; };
  for (let i=0;i<D.length;i++) for (let j=i+1;j<D.length;j++){ let w=0;
    for (let g=0; g<n; g++){ const r=E.play(D[i].d, D[j].d, 1000003*i+7919*j+g+(cfg.seedOff||0), cfg); T.games++; if (r.w===r.first) T.firstW++; T.turns.push(r.turns); T.why[r.why]=(T.why[r.why]||0)+1; w+= r.w===0?1 : r.w===1?0 : 0.5;
      const L=r.log; for (const k of Object.keys(L)) if (Array.isArray(L[k]) && L[k].length===2 && typeof L[k][0]==='number') add(k,sum2(L[k]));
      const seen=[new Set(),new Set()]; for (const [p,id,t,hd,bd] of L.played){ seen[p].add(id); const c=card(cfg,id); const b=c.cost>=7?'7+':c.cost>=5?'5-6':c.cost>=3?'3-4':'1-2'; (T.costTurn[b]=T.costTurn[b]||[]).push(Math.ceil(t/2));
        const st=hd<=-4?'behind':hd>=4?'ahead':'even'; for (const k of [b+'|'+st, b+'|'+st+'|'+(Math.ceil(t/2)>=7?'late':'early')]){ const x=T.state[k]||(T.state[k]=[0,0]); x[0]++; if (r.w===p) x[1]++; } if (c.cost>=7) T.big.push({p, id, t:Math.ceil(t/2), hd, bd, won:r.w===p}); }
      for (const p of [0,1]) for (const id of seen[p]){ T.played[id]=(T.played[id]||0)+1; if (r.w===p) T.wonWith[id]=(T.wonWith[id]||0)+1; }
      for (const [p,id,kind,sw] of L.tricks){ const x=T.tricks[id]||(T.tricks[id]={n:0,flipped:0,wasted:0,removed:0}); x.n++; x[kind]++; } }
    M[i][j]=w/n; M[j][i]=1-w/n; }
  const avg=a=>a.reduce((x,y)=>x+y,0)/a.length; T.turns.sort((a,b)=>a-b);
  const decks={}; D.forEach((x,i)=>{ decks[x.a.id]=(M[i].reduce((p,q)=>p+q,0)-0.5)/(D.length-1); });
  const pairs=[]; for (let i=0;i<D.length;i++) for (let j=i+1;j<D.length;j++) pairs.push(M[i][j]);
  const side={}; for (const x of D){ (side[x.a.side]=side[x.a.side]||[]).push(decks[x.a.id]); } for (const k in side) side[k]=avg(side[k]);
  const hist={}; for (const t of T.turns) hist[t]=(hist[t]||0)+1;
  return {cfg, n, games:T.games, M, decks, side, band:pairs.filter(p=>p>=0.45&&p<=0.55).length, near:pairs.filter(p=>p>=0.40&&p<=0.60).length, spread:Math.max(...Object.values(decks))-Math.min(...Object.values(decks)),
    first:T.firstW/T.games, turnsAvg:avg(T.turns), turnsMed:T.turns[Math.floor(T.turns.length/2)], q1:T.turns[Math.floor(T.turns.length/4)], q3:T.turns[Math.floor(T.turns.length*3/4)], hist, why:T.why,
    c:T.c, played:T.played, wonWith:T.wonWith, big:T.big, tricks:T.tricks, state:T.state, costTurn:Object.fromEntries(Object.entries(T.costTurn).map(([b,a])=>[b,avg(a)]))};
}
module.exports={ARCH, DECKS, DECKS3, build, runConfig, CARDS, CARDS3, CHANGES3, EXTRA, poolOf, decksOf, card, E};
