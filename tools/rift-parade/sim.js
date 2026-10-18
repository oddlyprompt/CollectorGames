// Rift Parade balance run: node tools/rift-parade/sim.js [games-per-pairing] [--agent balanced] [--agentB x] [--out file.json] [--seed0 n] [--decks a,b,..] [--workers n]
// Plays a full round robin of the representative decks (decks.js). Each pairing plays N games, half with each seat going first.
// Results (win matrix, game length, how games end, first-player win rate, per-card play and win rates) are written as JSON;
// report.js turns them into markdown. Games are reproducible: seed = f(pairing, game number, seed0).
'use strict';
const cp=require('child_process'), fs=require('fs');
const L=require('./lib.js');
const arg=(k,d)=>{ const i=process.argv.indexOf(k); return i>0? process.argv[i+1] : d; };
const N=+(process.argv[2]&&!process.argv[2].startsWith('--')? process.argv[2] : 100);
const agentA=arg('--agent','balanced'), agentB=arg('--agentB',agentA), seed0=+arg('--seed0',0), W=+arg('--workers',4);
const RUL=Object.fromEntries((arg('--rules','')||'').split(',').filter(Boolean).map(x=>{ const [k,v]=x.split('='); return [k,+v]; }));
if(arg('--off',null)) RUL.off=arg('--off').split(',');   // ablations: anomaly, nextEpisode, reaction, step
const ids=arg('--decks',null); const DK=ids? ids.split(',').map(i=>L.DECKS.find(d=>d.id===i)) : L.DECKS;
function runPairs(pairs){ const out=[]; for(const [i,j] of pairs){ const r={i,j,wins:0,games:0,turns:0,why:{},firstWins:0,asFirstWins:0,asFirstGames:0,res:[],played:[{},{}],slipped:[{},{}],trig:{},cnt:{},anoms:0,maxRift:0,seatWins:0,hist:{}};
    for(let k=0;k<N;k++){ const first=k%2, seed=1000003*(i+1)+7919*(j+1)+k+seed0*104729; const g=L.game(DK[i].list,DK[j].list,seed,[agentA,agentB],first,{rules:RUL}); const s=L.summary(g);
      r.games++; r.turns+=s.rounds; r.why[s.why]=(r.why[s.why]||0)+1; r.hist[s.rounds]=(r.hist[s.rounds]||0)+1;
      r.wins+= s.winner===0?1 : s.winner===1?0 : 0.5; if(s.winner===s.first) r.firstWins++; if(s.winner===0) r.seatWins++;
      if(first===0){ r.asFirstGames++; if(s.winner===0) r.asFirstWins++; }
      r.anoms+=s.anomalies; r.maxRift+=s.maxRift; for(const k in s.cnt) r.cnt[k]=(r.cnt[k]||0)+s.cnt[k];
      for(const p of [0,1]){ for(const id in s.played[p]){ const o=r.played[p]; o[id]=o[id]||[0,0,0]; o[id][0]+=s.played[p][id]; o[id][1]+=1; if(s.winner===p) o[id][2]+=1; } for(const id in s.slipped[p]){ const o=r.slipped[p]; o[id]=(o[id]||0)+s.slipped[p][id]; } }
      for(const id in s.trig) r.trig[id]=(r.trig[id]||0)+s.trig[id]; }
    out.push(r); } return out; }
if(process.argv.includes('--worker')){ const pairs=JSON.parse(arg('--pairs','[]')); process.send({res:runPairs(pairs)}); process.exit(0); }
const ASYM=agentA!==agentB;   // different pilots per seat: every ordered pair is played (deck i with pilot A against deck j with pilot B)
const pairs=[]; for(let i=0;i<DK.length;i++) for(let j=ASYM?0:i;j<DK.length;j++) pairs.push([i,j]);
const buckets=Array.from({length:W},()=>[]); pairs.forEach((p,n)=>buckets[n%W].push(p));
const t0=Date.now(); let done=0; const all=[];
buckets.forEach(b=>{ if(!b.length){ done++; return; } const c=cp.fork(__filename,[String(N),'--worker','--pairs',JSON.stringify(b),'--agent',agentA,'--agentB',agentB,'--seed0',String(seed0),'--rules',arg('--rules',''),'--off',arg('--off',''),'--decks',DK.map(d=>d.id).join(',')]);
  c.on('message',m=>{ all.push(...m.res); }); c.on('exit',()=>{ done++; if(done===W) finish(); }); });
function finish(){ const out={meta:{asym:ASYM,rules:RUL,N,agentA,agentB,seed0,decks:DK.map(d=>d.id),games:all.reduce((a,r)=>a+r.games,0),seconds:(Date.now()-t0)/1000,date:new Date().toISOString().slice(0,10)},pairs:all};
  const f=arg('--out',null); if(f) fs.writeFileSync(f,JSON.stringify(out)); const M=DK.map(()=>DK.map(()=>0.5)); for(const r of all){ if(ASYM||r.i!==r.j){ M[r.i][r.j]=r.wins/r.games; if(!ASYM) M[r.j][r.i]=1-r.wins/r.games; } }
  console.log(`${out.meta.games} games, ${out.meta.seconds.toFixed(0)}s, agents ${agentA} vs ${agentB}`);
  console.log('deck'.padEnd(11)+'avg  '+DK.map(d=>d.id.slice(0,6).padStart(7)).join(''));
  DK.forEach((d,i)=>{ const avg=(M[i].reduce((a,b)=>a+b,0)-0.5)/(DK.length-1); console.log(d.id.padEnd(11)+(avg*100).toFixed(0).padStart(3)+'% '+M[i].map((v,j)=>i===j?'     - ':(v*100).toFixed(0).padStart(5)+'% ').join('')); });
  const tot=all.reduce((a,r)=>{ a.t+=r.turns; a.g+=r.games; a.fw+=r.firstWins; for(const k in r.why) a.why[k]=(a.why[k]||0)+r.why[k]; return a; },{t:0,g:0,fw:0,why:{}});
  console.log(`rounds/game ${(tot.t/tot.g).toFixed(1)}  first-player wins ${(tot.fw/tot.g*100).toFixed(1)}%  ends ${JSON.stringify(tot.why)}`); }
