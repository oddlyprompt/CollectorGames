// Turns sim.js JSON output into a markdown report: node tools/rift-parade/report.js results.json [more.json ...] > report.md
'use strict';
const fs=require('fs'); const {CARDS,ORDER}=require('./cards.js'); const {DECKS}=require('./decks.js');
const files=process.argv.slice(2).filter(f=>!f.startsWith('--')); if(!files.length){ console.error('usage: report.js results.json'); process.exit(1); }
const pct=(x,d)=>(x*100).toFixed(d===undefined?0:d)+'%';
const se=(p,n)=>Math.sqrt(p*(1-p)/n);
function load(f){ return JSON.parse(fs.readFileSync(f,'utf8')); }
function summarize(R){ const ids=R.meta.decks; const K=ids.length; const M=ids.map(()=>ids.map(()=>null)), G=ids.map(()=>ids.map(()=>0));
  const T={games:0,rounds:0,first:0,why:{},hist:{},anoms:0,maxRift:0}; const card={}; const slipped={}; const trig={}; const deckGames=ids.map(()=>0), deckWins=ids.map(()=>0), deckFirstG=ids.map(()=>0), deckFirstW=ids.map(()=>0), deckSecondG=ids.map(()=>0), deckSecondW=ids.map(()=>0);
  for(const r of R.pairs){ T.games+=r.games; T.rounds+=r.turns; T.first+=r.firstWins; T.anoms+=r.anoms; T.maxRift+=r.maxRift; for(const k in r.why) T.why[k]=(T.why[k]||0)+r.why[k]; for(const k in r.hist) T.hist[k]=(T.hist[k]||0)+r.hist[k];
    if(r.i!==r.j){ M[r.i][r.j]=r.wins/r.games; M[r.j][r.i]=1-r.wins/r.games; G[r.i][r.j]=G[r.j][r.i]=r.games; deckGames[r.i]+=r.games; deckGames[r.j]+=r.games; deckWins[r.i]+=r.wins; deckWins[r.j]+=r.games-r.wins;
      deckFirstG[r.i]+=r.asFirstGames; deckFirstW[r.i]+=r.asFirstWins; deckSecondG[r.i]+=r.games-r.asFirstGames; deckSecondW[r.i]+=r.seatWins-r.asFirstWins;
      // deck j: it is first when deck i is not
      deckFirstG[r.j]+=r.games-r.asFirstGames; deckFirstW[r.j]+=(r.games-r.asFirstGames)-(r.games-r.seatWins-(r.asFirstGames-r.asFirstWins))*0-0; }
    for(const p of [0,1]){ const di=p===0?r.i:r.j; for(const id in r.played[p]){ const key=ids[di]+'|'+id; card[key]=card[key]||{deck:ids[di],id,n:0,g:0,w:0}; card[key].n+=r.played[p][id][0]; card[key].g+=r.played[p][id][1]; card[key].w+=r.played[p][id][2]; } for(const id in r.slipped[p]){ const key=ids[di]+'|'+id; slipped[key]=(slipped[key]||0)+r.slipped[p][id]; } }
    for(const id in r.trig) trig[id]=(trig[id]||0)+r.trig[id]; }
  return {ids,M,G,T,card,slipped,trig,deckGames,deckWins}; }
const out=[]; const w=s=>out.push(s);
const R=files.map(load); const S=files.map((f,i)=>summarize(R[i]));
const title=process.env.TITLE||'Rift Parade simulation report';
w(`# ${title}`); w('');
R.forEach((r,fi)=>{ const s=S[fi]; const m=r.meta; w(`## Run ${fi+1}: ${m.agentA}${m.agentB!==m.agentA?' vs '+m.agentB:''} pilots, ${m.games} games`); w('');
  w(`Generated ${m.date} by \`node tools/rift-parade/sim.js ${m.N}${m.agentA!=='balanced'?' --agent '+m.agentA:''}${m.agentB!==m.agentA?' --agentB '+m.agentB:''}${m.seed0?' --seed0 '+m.seed0:''}${Object.keys(m.rules||{}).length?' --rules '+Object.entries(m.rules).map(([k,v])=>k+'='+v).join(','):''}\`. ${m.N} games per pairing (half with each seat first), ${s.ids.length} decks, ${s.ids.length*(s.ids.length+1)/2} pairings including mirrors, ${m.games} games in total (${m.seconds.toFixed(0)} s on 4 cores).`); w('');
  const T=s.T; w('### Game shape'); w('');
  const rounds=[]; for(const k in T.hist) for(let i=0;i<T.hist[k];i++) rounds.push(+k); rounds.sort((a,b)=>a-b); const q=f=>rounds[Math.floor(rounds.length*f)];
  w(`- Rounds per game (a round is one turn each): average ${(T.rounds/T.games).toFixed(1)}, median ${q(0.5)}, middle half ${q(0.25)} to ${q(0.75)}, shortest ${rounds[0]}, longest ${rounds[rounds.length-1]}.`);
  w(`- How games end: ${Object.entries(T.why).map(([k,v])=>({resolve:'Resolve reduced to 0',deck:'a player could not draw',turnlimit:'turn limit (stall)',both:'both players at 0'}[k]||k)+' '+pct(v/T.games,1)+' ('+v+')').join(', ')}.`);
  const fp=T.first/T.games; w(`- First player wins ${pct(fp,1)} (${T.first} of ${T.games}; one standard error is ${pct(se(fp,T.games),1)}).`);
  w(`- Anomalies fired per game: ${(T.anoms/T.games).toFixed(2)}; highest Rift reached averages ${(T.maxRift/T.games).toFixed(1)}.`); w('');
  w('### Matchups (row deck\'s win rate against column deck)'); w('');
  w('| Deck | Avg | '+s.ids.map(i=>i).join(' | ')+' |'); w('|---|---|'+s.ids.map(()=>'---').join('|')+'|');
  const avgs=s.ids.map((id,i)=>{ let a=0,n=0; s.M[i].forEach((v,j)=>{ if(v!==null){ a+=v; n++; } }); return a/n; });
  s.ids.forEach((id,i)=>{ const d=DECKS.find(x=>x.id===id); w(`| ${d.name} | **${pct(avgs[i])}** | `+s.M[i].map((v,j)=>v===null?'-':pct(v)).join(' | ')+' |'); });
  const pairsN=[]; for(let i=0;i<s.ids.length;i++) for(let j=i+1;j<s.ids.length;j++) pairsN.push(s.M[i][j]);
  const nGames=s.G[0][1]||1; w(''); w(`Each cell is ${nGames} games (one standard error about ${pct(se(0.5,nGames),0)} points). Matchups inside 40-60%: ${pairsN.filter(p=>p>=0.4&&p<=0.6).length} of ${pairsN.length}; inside 45-55%: ${pairsN.filter(p=>p>=0.45&&p<=0.55).length}. Spread between best and worst average: ${pct(Math.max(...avgs)-Math.min(...avgs))} points.`); w('');
  // mirror seat
  const mir=R[fi].pairs.filter(r=>r.i===r.j); if(mir.length){ const g=mir.reduce((a,r)=>a+r.games,0), f=mir.reduce((a,r)=>a+r.firstWins,0); w(`Mirror matches (${g} games): first player wins ${pct(f/g,1)}; seat A wins ${pct(mir.reduce((a,r)=>a+r.seatWins,0)/g,1)} (should be near 50%).`); w(''); }
  w('### Card play and win rate (all decks, cards the deck played at least 30 times)'); w('');
  const rows=Object.values(s.card).filter(c=>c.g>=30); const by={}; for(const c of rows){ const b=by[c.id]=by[c.id]||{id:c.id,n:0,g:0,w:0,decks:new Set()}; b.n+=c.n; b.g+=c.g; b.w+=c.w; b.decks.add(c.deck); }
  const list=Object.values(by).sort((a,b)=>b.w/b.g-a.w/a.g); w('Win rate is the share of games a deck won when it played the card at least once in that game (a card played in 2 of 3 games the deck won).'); w('');
  w('| Card | Type | Cost | Games played in | Win rate | Decks |'); w('|---|---|---|---|---|---|');
  for(const c of list.slice(0,10).concat([null],list.slice(-10))){ if(!c){ w('| ... | | | | | |'); continue; } const d=CARDS[c.id]; w(`| ${d.name} | ${d.type} | ${d.cost} | ${c.g} | ${pct(c.w/c.g)} | ${[...c.decks].join(', ')} |`); }
  w(''); const unplayed=ORDER.filter(id=>!by[id]); w(`Cards never played 30+ times by any deck (in decks that contain them): ${unplayed.length}${unplayed.length? ' - '+unplayed.map(id=>CARDS[id].name).join('; ') :''}.`); w(''); });
if(R.length===1){ const s=S[0]; w('### Per-deck detail'); w(''); w('| Deck | Wins vs field | Style |'); w('|---|---|---|'); s.ids.forEach((id,i)=>{ const d=DECKS.find(x=>x.id===id); w(`| ${d.name} | ${pct(s.deckWins[i]/s.deckGames[i],1)} of ${s.deckGames[i]} games | ${d.style} |`); }); w(''); }
console.log(out.join('\n'));
