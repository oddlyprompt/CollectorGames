// Tidemark living metagame (Tenth Tide format), headless: the same model as Wildkin's field (src/engine/tcg_world.js:
// tcMetaWeek, tcBrewWeek, tcPruneWeek, tcRunEvent, tcBanCheck), so the two games behave alike when Tidemark joins the game.
//  - each week players drift toward decks that beat what everyone else plays, and away from what everyone is ready for;
//  - most weeks there is a chance (higher in the first six weeks, when one deck has led for six weeks, and late in the format)
//    that players try four new lists: a known list nobody plays, an established deck re-tuned with a tech package, or a
//    build-around: a deck around one card (a Legendary or a card that rewards Beasts, Enchantments, Vessels...) with the cards
//    that work with it. Each is tested by the rules engine against the six most played decks; the best is brought if it holds up;
//  - a new list plays up to 5 points worse for its first six weeks; a deck under 0.8% for six weeks leaves (12 to 22 decks) and
//    is not rediscovered for a year;
//  - weekly events (Swiss rounds and a top 8) nudge shares toward what wins;
//  - a rules committee bans the card whose loss hurts a deck most when that deck holds over 24% of the field for 10 weeks.
// node tools/tidemark/v1/meta.js [weeks=156] [--seed N] [--quiet]
const E=require('./engine.js'); const D=require('./decks.js'); const {CARDS}=require('./cards.js');
const P={eta:1.1, noise:0.012, hate:0.6, dom:0.24, domWeeks:10, brew:0.3, rel:0.55, stale:0.35, late:0.15, tries:4, games:6, row:8, enter:0.03, drop:0.008, dropWeeks:6, minField:12, maxField:22, fresh:6, rough:0.05, gone:52, start:15, mx:10};
const FAC=['CR','TW','IR','TB','FF','AC','HL'], SIDE={CR:'L',TW:'L',IR:'L',TB:'S',FF:'S',AC:'S',HL:'D'};
const FN={CR:'Crownlands',TW:'Thornwild',IR:'Iron Reach',TB:'Tideborn',FF:'Free Fleets',AC:'Abyssal Choir',HL:'Harbor Leagues'};
function rng(seed){ let h=(seed>>>0)^0x9e3779b9||1; return ()=>{ h^=h<<13; h>>>=0; h^=h>>>17; h^=h<<5; h>>>=0; return h/4294967296; }; }
const sig=d=>{ const k={}; for (const c of d) k[c.id]=(k[c.id]||0)+1; return Object.keys(k).sort().map(id=>id+'x'+k[id]).join(','); };
let SEEDN=1; function matchup(a, b, n){ let w=0; for (let k=0;k<n;k++){ const r=E.play(a,b,(SEEDN++)*2654435761>>>0); w+= r.w===0?1 : r.w===1?0 : 0.5; } return w/n; }
// partners a faction is often paired with: its own side, the Harbor Leagues, or (rarely) the other side
function partner(f, R){ const own=FAC.filter(x=>x!==f && SIDE[x]===SIDE[f]); const x=R(); if (f==='HL') return FAC.filter(y=>y!=='HL')[Math.floor(R()*6)]; if (x<0.62) return own[Math.floor(R()*own.length)]; if (x<0.92) return 'HL'; return FAC.filter(y=>y!==f && SIDE[y]!==SIDE[f] && y!=='HL')[Math.floor(R()*3)]; }
const PLANS=['aggro','midrange','control'];
// cards worth building around: Legendaries and Tenth Tide cards that reward a kind of card
const AROUND=CARDS.filter(c=>c.tt && c.f!=='NE' && (c.r==='L' || CARDS.some(o=>o!==c && o.tt && D.synergy(c,o)>=1)));
function name(spec){ const t=spec.tech? ' ('+spec.tech.n+')' : ''; if (spec.lead) return spec.lead.n+' '+FN[spec.lead.f].split(' ')[0]+t; return spec.mix.filter(f=>f!=='NE').map(f=>FN[f]).join(' / ')+' '+spec.plan[0].toUpperCase()+spec.plan.slice(1)+t; }
function run(weeks, seed, quiet){ const R=rng(seed); SEEDN=seed*7919+1; const ban=new Set(); const log=[]; const say=s=>{ if (!quiet) console.log(s); log.push(s); };
  const brew=spec=>D.brew(Object.assign({},spec,{ban:[...ban]}));
  const banFix=d=>d;
  // ---- the starting field: the ten tuned archetypes and a batch of brewed lists, gauntleted against the archetypes
  const base=D.ARCH.map(a=>({spec:{id:a.id, mix:a.mix, plan:a.plan}, d:D.build(a,'tt'), why:'start', name:a.name}));
  const cands=base.slice();
  for (let i=0;i<30;i++){ const f=FAC[i%7]; const r=R(); const spec={mix:[f,partner(f,R)], plan:PLANS[Math.floor(R()*3)], tech:r<0.6? D.TECH[Math.floor(R()*D.TECH.length)] : null, seed:Math.floor(R()*1e9)};
    if (r>=0.6 && r<0.85){ const L=AROUND.filter(c=>c.f===f); if (L.length) spec.lead=L[Math.floor(R()*L.length)]; }
    const d=D.brew(spec); if (d.length===50) cands.push({spec, d, why:spec.lead?'around':'brew', name:name(spec)}); }
  for (const c of cands) c.g=base.reduce((q,b)=>q+(b===c?0.5:matchup(c.d,b.d,4)),0)/base.length;
  const seen=new Set(); const field=[]; for (const c of cands.sort((x,y)=>y.g-x.g)){ const k=sig(c.d); if (seen.has(k)) continue; seen.add(k); field.push(c); if (field.length>=P.start) break; }
  const known=cands.filter(c=>!field.includes(c));   // lists people know about but nobody plays yet
  const M=field.map(()=>field.map(()=>0.5)); for (let i=0;i<field.length;i++) for (let j=i+1;j<field.length;j++){ const m=matchup(field[i].d,field[j].d,P.mx); M[i][j]=m; M[j][i]=1-m; }
  field.forEach((a,i)=>{ a.str=(M[i].reduce((x,y)=>x+y,0)-0.5)/(field.length-1); a.born=null; a.low=0; a.hist=[]; });
  const tot=field.reduce((s,a)=>s+Math.exp(6*a.str),0); field.forEach(a=>a.sh=Math.exp(6*a.str)/tot);
  const gone={}; let lead={id:null,w:0}; const dom={}; const S={leaders:new Set(), top5:new Set(), sizes:[], tops:[], run:0, best:0, prev:null, entered:{brew:0,tech:0,around:0}, left:0, bans:[]};
  // a brew refined by testing: swap one card for another of its factions and keep the swap when the list does better against
  // the decks it expects to face (the same games for both lists, so the comparison is fair)
  function refine(d, spec, targets, swaps){ const pool=CARDS.filter(c=>c.tt && !ban.has(c.n) && (spec.mix.includes(c.f)||c.f==='NE')); const base=SEEDN; SEEDN+=1000;
    const score=dd=>{ let w=0, n=0; for (const j of targets){ for (let k=0;k<4;k++){ const r=E.play(dd,field[j].d,(base+j*31+k)*2654435761>>>0); w+= r.w===0?1 : r.w===1?0 : 0.5; } n+=4; } return w/n; };
    let s0=score(d); for (let i=0;i<swaps;i++){ const names=[...new Set(d.map(c=>c.n))].filter(n=>!spec.lead || n!==spec.lead.n); const out=names[Math.floor(R()*names.length)]; const ins=pool.filter(c=>!names.includes(c.n)); if (!ins.length) break;
      const W=spec.tech&&spec.tech.w; const lean=W? ins.filter(c=>[...D.roles(c)].some(r=>(W[r]||1)>1.4)) : []; const from=(lean.length && R()<0.6)? lean : ins; const cand=from[Math.floor(R()*from.length)]; const k=d.filter(c=>c.n===out).length; const nd=d.filter(c=>c.n!==out); for (let q=0;q<Math.min(k,cand.r==='L'?1:3);q++) nd.push(cand);
      while (nd.length<50){ const f=d.find(c=>c.n!==out && nd.filter(x=>x===c).length<(c.r==='L'?1:3)); if (!f) break; nd.push(f); } if (nd.length!==50) continue;
      const s1=score(nd); if (s1>s0){ d=nd; s0=s1; } }
    return d; }
  const rough=(a,t)=> a.born==null? 0 : -P.rough*Math.max(0,1-(t-a.born)/P.fresh);
  const mt=(i,j,t)=> i===j? 0.5 : Math.max(0.03, Math.min(0.97, M[i][j]+rough(field[i],t)-rough(field[j],t)));
  const norm=()=>{ const s=field.reduce((q,a)=>q+a.sh,0); field.forEach(a=>a.sh/=s); };
  const addDeck=(x,t,why)=>{ const row=field.map(o=>matchup(x.d,o.d,P.row)); M.forEach((r,i)=>r.push(1-row[i])); M.push(row.concat([0.5])); Object.assign(x,{sh:P.enter, born:t, low:0, hist:[], why, str:row.reduce((p,q)=>p+q,0)/row.length}); field.push(x); norm(); };
  const dropDeck=i=>{ field.splice(i,1); M.splice(i,1); M.forEach(r=>r.splice(i,1)); norm(); };
  for (let t=0;t<weeks;t++){
    // shares drift toward what wins against the current field
    const wr=field.map((a,i)=>field.reduce((q,b,j)=>q+b.sh*mt(i,j,t),0)-P.hate*(a.sh-1/field.length)); const avg=field.reduce((q,a,i)=>q+a.sh*wr[i],0);
    const tg=field.map((a,i)=>a.sh*Math.exp(P.eta*6*(wr[i]-avg))); const T=tg.reduce((x,y)=>x+y,0); const nz=P.noise*(t<5?3:1);
    field.forEach((a,i)=>{ a.sh=Math.max(0.004,0.8*a.sh+0.2*tg[i]/T+(R()-0.5)*nz); }); norm();
    // a weekly event: 32 players, Swiss, top 8; decks that convert gain a little
    { const cum=[]; let s=0; for (const a of field){ s+=a.sh; cum.push(s); } const pl=[]; for (let k=0;k<32;k++){ const x=R()*s; let q=0; while (q<cum.length-1 && cum[q]<x) q++; pl.push({i:q, w:0, sk:(R()+R()+R()-1.5)*0.6}); }
      for (let r=0;r<5;r++){ pl.sort((x,y)=>y.w-x.w||R()-0.5); for (let k=0;k+1<pl.length;k+=2){ const a=pl[k], b=pl[k+1]; const p=mt(a.i,b.i,t); const q=1/(1+Math.exp(-(Math.log(p/(1-p))+a.sk-b.sk))); (R()<q? a : b).w++; } }
      pl.sort((x,y)=>y.w-x.w); const top8={}; for (const p of pl.slice(0,8)) top8[p.i]=(top8[p.i]||0)+1; field.forEach((a,i)=>{ const conv=((top8[i]||0)/8)/Math.max(0.004,a.sh); a.sh*=Math.max(0.95,Math.min(1.06,Math.pow(Math.max(0.2,conv),0.05))); }); norm(); }
    // brewing
    const order=field.map((a,i)=>i).sort((x,y)=>field[y].sh-field[x].sh); const top=field[order[0]]; lead= lead.id===top.name? {id:top.name, w:lead.w+1} : {id:top.name, w:1};
    const p=P.brew+(t<6?P.rel:0)+(lead.w>=6 && top.sh>0.17?P.stale:0)+(t>weeks*0.75?P.late:0);
    if (field.length<P.maxField && R()<p){ const have=new Set(field.map(a=>sig(a.d))); const fresh=d=>{ const k=sig(d); return !have.has(k) && !(gone[k]!=null && t-gone[k]<P.gone); };
      const targets=order.slice(0,6); const tries=[];
      for (let i=0;i<P.tries;i++){ const r=R(); let x=null;
        if (r<0.3){ const ks=known.filter(k=>fresh(k.d) && !k.d.some(c=>ban.has(c.n))); if (ks.length){ const k=ks[Math.floor(R()*ks.length)]; x={spec:k.spec, d:k.d, why:'brew', name:k.name}; } }
        else if (r<0.6){ // an established deck re-tuned: its own list, adjusted against what is popular now, leaning to a tech package
          const a=field[order[Math.floor(R()*Math.min(8,field.length))]]; const tech=D.TECH[Math.floor(R()*D.TECH.length)]; const spec=Object.assign({},a.spec,{tech, id:'t'+t+i});
          x={spec, d:a.d.slice(), why:'tech', retune:true, name:(a.spec.lead? a.spec.lead.n+' '+FN[a.spec.lead.f].split(' ')[0] : a.name.replace(/ \(.*\)$/,''))+' ('+tech.n+')'}; }
        else { const L=AROUND.filter(c=>!ban.has(c.n)); const lc=L[Math.floor(R()*L.length)]; const spec={mix:[lc.f, partner(lc.f,R)], plan:PLANS[Math.floor(R()*3)], lead:lc, tech:R()<0.4? D.TECH[Math.floor(R()*D.TECH.length)] : null, seed:Math.floor(R()*1e9), id:'r'+t+i};
          const d=brew(spec); if (d.length===50) x={spec, d, why:'around', name:name(spec)}; }
        if (!x || (!x.retune && !fresh(x.d))) continue; let w=0, n=0; for (const j of targets){ w+=field[j].sh*matchup(x.d,field[j].d,P.games); n+=field[j].sh; } x.sc=w/n; tries.push(x); }
      tries.sort((a,b)=>b.sc-a.sc); for (const x of tries.filter(x=>x.retune).concat(tries.filter(x=>!x.retune && x.why!=='brew').slice(0,2))){ x.d=refine(x.d, x.spec, targets, 14); let w=0, n=0; for (const j of targets){ w+=field[j].sh*matchup(x.d,field[j].d,P.games); n+=field[j].sh; } x.sc=w/n; }
      const ok=tries.filter(x=>fresh(x.d)); ok.sort((a,b)=>b.sc-a.sc); const b=ok[0];
      if (b && b.sc>=0.5-R()*0.06){ addDeck(b,t,b.why); S.entered[b.why]++; say(`week ${t+1}: NEW ${b.why==='tech'?'TECH':b.why==='around'?'BUILD-AROUND':'DECK'} ${b.name} (tested ${(b.sc*100).toFixed(0)}% against the top decks)`); } }
    // a deck nobody plays leaves
    for (const a of field) a.low= a.sh<P.drop? a.low+1 : 0;
    if (field.length>P.minField){ const out=field.filter(a=>a.low>=P.dropWeeks && (a.born==null || t-a.born>=P.fresh)).sort((x,y)=>x.sh-y.sh)[0]; if (out){ gone[sig(out.d)]=t; dropDeck(field.indexOf(out)); S.left++; } }
    // the rules committee
    for (const a of field) dom[a.name]= a.sh>P.dom? (dom[a.name]||0)+1 : 0; const t0=field.slice().sort((x,y)=>y.sh-x.sh)[0];
    if (dom[t0.name]>=P.domWeeks && t-(S.lastBan==null?-1e9:S.lastBan)>17){ const ti=field.indexOf(t0); const others=field.filter(a=>a!==t0);
      const staple=n=>others.filter(a=>a.d.some(c=>c.n===n)).reduce((s,a)=>s+a.sh,0)>0.3; const opp=field.map((a,i)=>i).filter(i=>i!==ti).sort((x,y)=>field[y].sh-field[x].sh).slice(0,6);
      // the candidates are the deck's key cards (its rarest and most-copied, by the card rate), each tested by rebuilding the deck without it
      const keys=[...new Set(t0.d.map(c=>c.n))].filter(n=>!staple(n) && !ban.has(n)).map(n=>t0.d.find(c=>c.n===n)).sort((x,y)=>(({L:3,R:2,U:1,C:0})[y.r]+D.rate(y)*0.3+t0.d.filter(c=>c===y).length*0.3)-(({L:3,R:2,U:1,C:0})[x.r]+D.rate(x)*0.3+t0.d.filter(c=>c===x).length*0.3)).slice(0,8).map(c=>c.n);
      let best=null, bv=-1; for (const n of keys){ const nd=D.brew(Object.assign({},t0.spec,{id:'ban', ban:[...ban, n]})); const d2=t0.d.filter(c=>c.n!==n); while (d2.length<50){ const f=nd.find(c=>!d2.includes(c) || d2.filter(x=>x===c).length<(c.r==='L'?1:3)); if (!f) break; d2.push(f); }
        let now=0, after=0, w=0; for (const j of opp){ now+=field[j].sh*mt(ti,j,t); after+=field[j].sh*matchup(d2,field[j].d,12); w+=field[j].sh; } const v=(now-after)/w; if (v>bv){ bv=v; best=n; } }
      if (best){ ban.add(best); S.lastBan=t; S.bans.push(best); say(`week ${t+1}: BAN ${best} (${t0.name} held ${(t0.sh*100).toFixed(0)}% for ${dom[t0.name]} weeks)`);
        for (let i=0;i<field.length;i++) if (field[i].d.some(c=>ban.has(c.n))){ const d=refine(brew(Object.assign({},field[i].spec,{seed:7})), field[i].spec, order.filter(j=>j!==i).slice(0,6), 8); if (d.length===50){ field[i].d=d; for (let j=0;j<field.length;j++) if (j!==i){ const m=matchup(d,field[j].d,P.row); M[i][j]=m; M[j][i]=1-m; } } } } }
    // records
    const ord=field.slice().sort((x,y)=>y.sh-x.sh); S.leaders.add(ord[0].name); for (const a of ord.slice(0,5)) S.top5.add(a.name); S.sizes.push(field.length); S.tops.push(ord[0].sh);
    if (S.prev===ord[0].name) S.run++; else { S.run=1; S.prev=ord[0].name; } S.best=Math.max(S.best,S.run);
    if (!quiet && (t%13===12 || t===weeks-1)) say(`-- week ${t+1}: ${field.length} decks. `+ord.slice(0,5).map(a=>a.name+' '+(a.sh*100).toFixed(0)+'%').join(', ')); }
  const fmt=x=>(x*100).toFixed(0)+'%';
  const sum=`META ${weeks} weeks (seed ${seed}): ${S.leaders.size} different leading decks, ${S.top5.size} decks reached the top 5, field ${Math.min(...S.sizes)} to ${Math.max(...S.sizes)} decks, longest run at #1 ${S.best} weeks, top deck ${fmt(Math.min(...S.tops))} to ${fmt(Math.max(...S.tops))} of the field; new decks: ${S.entered.brew} known lists, ${S.entered.tech} re-tunes, ${S.entered.around} build-arounds; ${S.left} left; bans: ${S.bans.length? S.bans.join(', ') : 'none'}`;
  console.log(sum); return {S, sum, log}; }
module.exports={run, P};
if (require.main===module){ const a=process.argv.slice(2); const w=+a.find(x=>/^\d+$/.test(x))||156; const s=a.includes('--seed')? +a[a.indexOf('--seed')+1] : 1; run(w, s, a.includes('--quiet')); }
