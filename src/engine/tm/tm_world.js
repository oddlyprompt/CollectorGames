// ===================== TIDEMARK: THE METAGAME =====================
// The player never plays matches. The rules engine (tools/tidemark/v1, bundled as TMR) plays them: the decks the format allows and how
// they match up were played at build time (TM_LIB, tools/tidemark/v1/library.js) and the results decide what the simulated players bring,
// who wins events, what gets banned, and through usage and hype, what cards are worth. Finals, ban tests and the lists rebuilt after
// a ban are played live. The format is Tenth Tide: its 220 cards (150 new, 70 reprints); every older card is Eternal-only.
function tcInit(){ G.tc=G.tc||{}; G.tpop=G.tpop||{}; G.nextTid=G.nextTid||1; G.tcg={v:1, cv:TC_CV, mv:1, rv:TMR.RV, usage:{}, t8:{}, hy:{}, ban:{}, arch:[], ev:[], dom:{}, shop:{}, pre:[], ann:{}, rev:{}, rel:{}, last:G.day, lastBan:0, mx:null}; tmLegacyUsage(); }
function tcNews(h, b, ref){ if (!G.live || !G.tcg) return; const n={t:G.day,h,b,p:null,k:'tcg'}; if (ref){ if (ref.set!=null) n.ts=ref.set; if (ref.cid!=null) n.tcid=ref.cid; } G.news.unshift(n); if (G.news.length>320) G.news.length=320; }
function tcCardByCid(cid){ return tcCardByCidX(cid); }
// Standard before Tenth Tide is the last two years of sets; Tenth Tide alone once it is out (rotation, as announced in the news)
function tcLegalSets(t){ const rel=tcReleasedSets(t); if (rel.includes(TM_TT)) return [TM_TT]; return rel.filter(n=>tcSetDef(n).rel>t-730); }
function tcBanned(cid,t){ const b=G.tcg&&G.tcg.ban[cid]; return !!(b && b.d<=(t==null?G.day:t)); }
const TM_PRINTS={}; for (const p of TM_PR) if (p.k!=='alt'){ const c=tmCid(p.c); (TM_PRINTS[c]=TM_PRINTS[c]||[]).push(p.s); }
// 'std' playable in Standard now, 'rot' only in Eternal, 'ban' banned
function tcLegalState(cid, t){
  t=t==null?G.day:t; if (tcBanned(cid,t)) return 'ban';
  const legal=tcLegalSets(t); return (TM_PRINTS[cid]||[]).some(s=>legal.includes(s))? 'std' : 'rot';
}
function tcLegalIdentities(t){ if (!tcReleasedSets(t).includes(TM_TT)) return []; return tcSetCards(TM_TT).filter(c=>!tcAlt(c) && !tcBanned(c.cid,t)); }
const TCP={eta:1.1, noise:0.012, hate:0.6, dom:0.18, domWeeks:10};
// Before Tenth Tide there is no simulated field (the older Standard is not in the engine). Cards of the last two years carry a modest
// play value from their rating alone, which disappears when they rotate (unless Tenth Tide reprints them).
function tmLegacyUsage(){ const U=G.tcg.usage; for (const n of tcLegalSets(G.day)) for (const c of tcSetCards(n)){ if (tcAlt(c)) continue; const u=+(c.pw*2.6).toFixed(2); if (u>U[c.cid]||!U[c.cid]) U[c.cid]=u; } }
const tmBanNames=t=>Object.keys(G.tcg.ban).filter(cid=>tcBanned(+cid,t)).map(cid=>TMR.byCid.get(+cid).n).sort();
// ---------- the field: the decks that exist and their simulated matchups ----------
const TC_FIELD0={};
function tcFieldKey(t){ return 'TT|'+tmBanNames(t==null?G.day:t).join(','); }
// the opening field of the format: the build's start decks and how they did against each other (TM_LIB)
function tcBaseField(){ if (TC_FIELD0.f) return TC_FIELD0.f; const S=TM_LIB.start; const top=S.map(i=>Object.assign({},TMR.lib[i])); const M=S.map(i=>S.map(j=>i===j? 0.5 : TM_LIB.M[i][j]));
  return TC_FIELD0.f={top, M, rv:TMR.RV}; }
const tmLeadOf=p=>{ if (p.lead!=null) return p.lead; let best=null, bs=-9; for (const [cid] of p.c){ const c=TMR.byCid.get(cid); const s=({L:3,R:2,U:1,C:0})[c.r]*2+TMR.rate(c)*0.3; if (s>bs){ bs=s; best=cid; } } return best; };
const tmCnt=p=>Object.fromEntries(p.c);
// the field now. With nothing banned it is the build's field; after a ban, decks that played the banned card are rebuilt without it
// (the same mix, plan and tech package) and re-tested live against everything else.
function tcField(t){
  const T=G.tcg, key=tcFieldKey(t); if (T.mx && T.mx.key===key && T.mx.rv===TMR.RV) return T.mx;
  if (!T.mx || T.mx.rv!==TMR.RV){ const b=tcBaseField(); T.mx={key:'TT|', rv:TMR.RV, top:b.top.map(p=>Object.assign({},p)), M:b.M.map(r=>r.slice())}; }
  const bn=tmBanNames(t); const names=new Set(bn); const X=T.mx; let drop=[], fresh=[];
  for (let i=0;i<X.top.length;i++){ const p=X.top[i]; if (!p.c.some(([cid])=>names.has(TMR.byCid.get(cid).n))) continue;
    const lead=p.lead!=null && names.has(TMR.byCid.get(p.lead).n)? null : p.lead; const d=TMR.brew({id:p.id,mix:p.mix,plan:p.plan,tech:p.tech,lead,seed:p.seed}, bn);
    if (!d){ drop.push(i); continue; } const np=TMR.pack(d,{id:p.id,name:p.name,why:p.why,mix:p.mix,plan:p.plan,tech:p.tech,tn:p.tn,lead,seed:p.seed,li:-1});
    X.top[i]=np; fresh.push(i); }
  // re-test the rebuilt decks against everyone (rows between decks that did not change stay as they were)
  const decks=X.top.map(p=>TMR.unpack(p)); for (const i of fresh){ for (let j=0;j<X.top.length;j++){ if (j===i || (fresh.includes(j) && j<i) || drop.includes(j)) continue; const m=TMR.matchup(decks[i],decks[j],6,hsh('ban'+i+':'+j+':'+G.day)); X.M[i][j]=+m.toFixed(4); X.M[j][i]=+(1-m).toFixed(4); } }
  drop.sort((a,b)=>b-a).forEach(i=>{ X.top.splice(i,1); X.M.splice(i,1); X.M.forEach(r=>r.splice(i,1)); });
  const seen=new Set(); for (let i=X.top.length-1;i>=0;i--){ if (seen.has(X.top[i].sig)){ X.top.splice(i,1); X.M.splice(i,1); X.M.forEach(r=>r.splice(i,1)); } else seen.add(X.top[i].sig); }
  X.key=key; return X;
}
function tcDeckOf(a){ const p=G.tcg.mx&&G.tcg.mx.top[a.ix]; return p? TMR.unpack(p) : null; }
function tcRaw(a, b){ const M=G.tcg.mx&&G.tcg.mx.M; const p=M&&M[a.ix]&&M[a.ix][b.ix]; return p==null? 0.5 : p; }
const tcRough=a=>a.born==null? 0 : -TCM.rough*Math.max(0,1-(G.day-a.born)/TCM.fresh);   // an unrefined list: up to 5 points worse, gone after six weeks
function tcMatch(a, b){ if (a===b) return 0.5; return Math.max(0.03, Math.min(0.97, tcRaw(a,b)+tcRough(a)-tcRough(b))); }
const TM_PLANST={aggro:'aggro', midrange:'mid', control:'control'};
function tmArchOf(p, i, f){ const lead=tmLeadOf(p); const str=(f.M[i].reduce((x,y)=>x+y,0)-0.5)/Math.max(1,f.top.length-1); const mf=p.mix.find(x=>x!=='NE')||'CR';
  return {id:p.id, ix:i, el:TM_FAC[mf].n, st:p.tech==='tmp'||p.tech==='flt'? 'combo' : p.tech==='fort'? 'stall' : TM_PLANST[p.plan]||'mid', name:p.name, str:+str.toFixed(4), core:p.c.map(x=>x[0]), tr:[], cnt:tmCnt(p), line:[], lead, partner:null}; }
function tcRebuildMeta(t){
  const f=tcField(t); if (!f || !f.top.length) return; const old={}; for (const a of G.tcg.arch) old[a.id]=a; const n=f.top.length;
  const list=f.top.map((p,i)=>tmArchOf(p,i,f));
  const tot=list.reduce((s,a)=>s+Math.exp(6*a.str),0);
  const ids=new Set(); for (const a of list){ let k=a.id, q=2; while (ids.has(k)) k=a.id+'#'+(q++); a.id=k; ids.add(k); }
  for (const a of list){ const o=old[a.id]; a.sh= o? o.sh : Math.exp(6*a.str)/tot*0.6; a.hist=o?o.hist:[]; a.wr=o?o.wr:a.str; a.conv=o?o.conv:1; a.born=o? o.born : (G.tcg.arch.length? t : undefined); a.low=o?o.low:0; if (o && o.why) a.why=o.why; }
  const S=list.reduce((s,a)=>s+a.sh,0); list.forEach(a=>a.sh/=S); list.sort((a,b)=>b.sh-a.sh); G.tcg.arch=list; G.tcg.rv=TMR.RV; tcUsage();
}
function tcUsage(){
  const U={}; for (const a of G.tcg.arch) for (const cid in a.cnt) U[cid]=(U[cid]||0)+a.sh*a.cnt[cid];
  const old=G.tcg.usage; for (const cid in U) old[cid]=0.6*(old[cid]||0)+0.4*Math.min(3,U[cid]); for (const cid in old){ if (U[cid]==null){ old[cid]*=0.7; if (old[cid]<0.02) delete old[cid]; } }
}
// each week players drift toward what wins against what everyone else plays (and away from what everyone is ready for)
function tcMetaWeek(t){
  const A=G.tcg.arch; if (!A.length) return;
  for (const a of A){ let w=0; for (const b of A) w+=b.sh*tcMatch(a,b); a.wr=w-TCP.hate*(a.sh-1/A.length); }
  const avg=A.reduce((s,a)=>s+a.sh*a.wr,0); const tg=A.map(a=>a.sh*Math.exp(TCP.eta*6*(a.wr-avg))); const T=tg.reduce((x,y)=>x+y,0);
  const nz=TCP.noise*(t-tcLastRelease(t)<35? 3 : 1);   // the first weeks of a new format are chaotic
  A.forEach((a,i)=>{ a.sh=Math.max(0.004, 0.8*a.sh+0.2*tg[i]/T+(R()-0.5)*nz); }); const S=A.reduce((s,a)=>s+a.sh,0);
  A.forEach(a=>{ a.sh/=S; a.hist.push(+a.sh.toFixed(3)); if (a.hist.length>20) a.hist.shift(); }); A.sort((a,b)=>b.sh-a.sh); tcUsage();
  for (const k in G.tcg.hy){ G.tcg.hy[k]*=0.86; if (G.tcg.hy[k]<0.02) delete G.tcg.hy[k]; } for (const k in G.tcg.t8){ G.tcg.t8[k]*=0.95; if (G.tcg.t8[k]<0.05) delete G.tcg.t8[k]; }
}
// ---------- a living field: new decks are found, lists are re-tuned, dead decks leave ----------
// Real formats do not cycle through a fixed list. Players brew (often to beat what is popular), established decks get re-tuned with
// a tech package, build-arounds form around a Legendary or a card that rewards a kind of card, new lists start rough and improve, and
// decks nobody plays are dropped and rarely come back. Brewing is busiest after a release, when one deck has led for weeks, and late in a
// format. The candidates are the library's lists (tested at build time against every other list); the player's field tests the best of four
// against the six most played decks before one can catch on.
const TCM={brew:0.3, rel:0.55, stale:0.35, late:0.15, tries:6, accept:0.45, games:6, row:8, enter:0.03, drop:0.008, dropWeeks:6, minField:12, maxField:22, fresh:42, rough:0.05, gone:365};
function tcLastRelease(t){ const r=tcReleasedSets(t); return r.length? tcSetDef(r[r.length-1]).rel : -1e9; }
const tmM=(i,j)=>i===j? 0.5 : TM_LIB.M[i][j];
// the library's gauntlet: its average result against the opening field, a rough measure of how good a list is
const tmG=(()=>{ let g=null; return i=>{ if (!g){ g=TMR.lib.map((d,k)=>TM_LIB.start.reduce((s,j)=>s+tmM(k,j),0)/TM_LIB.start.length); } return g[i]; }; })();
function tcBrewWeek(t){
  const T=G.tcg, A=T.arch; if (!A.length || !T.mx || A.length>=TCM.maxField) return null;
  const sinceRel=t-tcLastRelease(t), top=A[0]; T.lead=T.lead&&T.lead.id===top.id? {id:top.id, w:T.lead.w+1} : {id:top.id, w:1};
  const p=TCM.brew+(sinceRel<42?TCM.rel:0)+(T.lead.w>=6 && top.sh>0.17?TCM.stale:0)+(sinceRel>270?TCM.late:0); if (R()>=p) return null;
  const X=T.mx, have=new Set(X.top.map(q=>q.sig)); T.gone=T.gone||{}; const bn=new Set(tmBanNames(t));
  const bannedIn=d=>d.c.some(([cid])=>bn.has(TMR.byCid.get(cid).n));
  const ok=d=>!have.has(d.sig) && !(T.gone[d.sig] && t-T.gone[d.sig]<TCM.gone) && !bannedIn(d);
  const targets=A.slice(0,6); const tdeck=a=>X.top[a.ix];
  const mixes=new Set(A.slice(0,8).map(a=>X.top[a.ix].mix.join()));
  const byWhy={brew:TMR.lib.filter(d=>d.why==='brew'&&ok(d)), around:TMR.lib.filter(d=>d.why==='around'&&ok(d)), tech:TMR.lib.filter(d=>d.why==='tech'&&ok(d)&&mixes.has(d.mix.join()))};
  const pickW=arr=>{ const w=arr.reduce((x,d)=>x+Math.exp(8*tmG(d.li)),0); let x=R()*w, q=arr[0]; for (const d of arr){ x-=Math.exp(8*tmG(d.li)); if (x<=0){ q=d; break; } } return q; };
  const score=d=>{ let w=0, n=0; for (const a of targets){ const q=tdeck(a); const m= q.li>=0? tmM(d.li,q.li) : TMR.matchup(TMR.unpack(d),TMR.unpack(q),4,hsh('brew'+t+d.li+a.ix)); w+=a.sh*m; n+=a.sh; } return n? w/n : 0.5; };
  const tries=[];
  for (let i=0;i<TCM.tries;i++){ const r=R(); const cls= r<0.35? 'brew' : r<0.65? 'tech' : 'around'; let arr=byWhy[cls]; if (!arr.length) arr=byWhy.brew.length? byWhy.brew : byWhy.around; if (!arr.length) continue; const d=pickW(arr); if (tries.some(x=>x.d===d)) continue; tries.push({d, why:d.why, sc:score(d)}); }
  if (!tries.length) return null; tries.sort((x,y)=>y.sc-x.sc); const b=tries[0];
  if (b.sc<TCM.accept-R()*0.06) return null;   // nothing tested well enough to bring (a slightly worse deck still gets a try now and then)
  const d=Object.assign({},b.d); const row=X.top.map(q=> q.li>=0? tmM(d.li,q.li) : TMR.matchup(TMR.unpack(d),TMR.unpack(q),TCM.row,hsh('row'+t+d.li+q.sig.length)));
  X.top.push(d); X.M.forEach((r,i)=>r.push(+(1-row[i]).toFixed(4))); X.M.push(row.concat([0.5]).map(x=>+x.toFixed(4)));
  const lead=tcCardByCid(tmLeadOf(d)); const str=row.reduce((x,y)=>x+y,0)/Math.max(1,row.length);
  const a=Object.assign(tmArchOf(d, X.top.length-1, {top:X.top, M:X.M}), {str:+str.toFixed(4), sh:TCM.enter, hist:[], wr:b.sc, conv:1, born:t, low:0, why:b.why});
  const ids=new Set(A.map(x=>x.id)); let k=a.id, q=2; while (ids.has(k)) k=d.id+'#'+(q++); a.id=k;
  A.push(a); const S=A.reduce((x,y)=>x+y.sh,0); A.forEach(y=>y.sh/=S); A.sort((x,y)=>y.sh-x.sh); tcUsage();
  const beats=targets.slice().sort((x,y)=>(tdeck(y).li>=0&&d.li>=0?tmM(d.li,tdeck(y).li):0.5)-(tdeck(x).li>=0&&d.li>=0?tmM(d.li,tdeck(x).li):0.5))[0];
  const npcs=G.npcs.filter(n=>n.ty==='tpl'); const who=npcs.length? pick(npcs).h : 'A local player'; const name=a.name;
  tcNews(b.why==='tech'? `NEW TECH: ${name.toUpperCase()}` : b.why==='around'? `NEW BUILD-AROUND: ${name.toUpperCase()}` : `NEW DECK: ${name.toUpperCase()}`,
    b.why==='tech'? `${who} is running a re-tuned list with a ${(d.tn||'new').toLowerCase()} package, built to handle ${beats?beats.name:'the top decks'}. Testers are copying it.` : b.why==='around'? `${who} built a deck around ${lead?lead.name:'one card'} and it held up against ${beats?beats.name:'the top decks'}. Testers are copying it.` : `${who} brought ${name} to a local event${beats?' and it held up against '+beats.name:''}. Nobody was playing it a week ago.`, {cid:lead&&lead.cid});
  return a;
}
// a deck nobody plays for six weeks leaves the field (one a week, and never below twelve decks)
function tcPruneWeek(t){
  const T=G.tcg, A=T.arch; if (!T.mx) return; for (const a of A) a.low= a.sh<TCM.drop? (a.low||0)+1 : 0;
  if (A.length<=TCM.minField) return; const out=A.filter(a=>a.low>=TCM.dropWeeks && (a.born==null || t-a.born>=TCM.fresh)).sort((x,y)=>x.sh-y.sh)[0]; if (!out) return;
  const i=out.ix; T.gone=T.gone||{}; T.gone[T.mx.top[i].sig]=t; T.mx.top.splice(i,1); T.mx.M.splice(i,1); T.mx.M.forEach(r=>r.splice(i,1));
  A.splice(A.indexOf(out),1); for (const a of A) if (a.ix>i) a.ix--; const S=A.reduce((x,y)=>x+y.sh,0); A.forEach(y=>y.sh/=S); tcUsage();
  for (const k in T.gone) if (t-T.gone[k]>TCM.gone) delete T.gone[k];
  return out;
}
// a tournament: Swiss rounds decided by the simulated matchups (plus each player's skill), a top-8 bracket, and a final that is played out by the engine
function tcRunEvent(t, kind, N){
  const A=G.tcg.arch; if (!A.length) return; const cum=[]; let s=0; for (const a of A){ s+=a.sh; cum.push(s); }
  const P=[]; for (let i=0;i<N;i++){ const x=R()*s; let k=0; while (k<cum.length-1 && cum[k]<x) k++; P.push({a:A[k], sk:gauss()*0.35, w:0, tb:R()}); }
  const game=(x,y)=>{ const p=tcMatch(x.a,y.a); const q=1/(1+Math.exp(-(Math.log(p/(1-p))+x.sk-y.sk))); return R()<q? x : y; };
  const rounds=Math.ceil(Math.log2(N))+(kind==='champ'?1:0);
  for (let r=0;r<rounds;r++){ P.sort((x,y)=>y.w-x.w||y.tb-x.tb); for (let i=0;i+1<P.length;i+=2) game(P[i],P[i+1]).w++; if (P.length%2) P[P.length-1].w++; P.forEach(p=>p.tb=R()); }
  P.sort((x,y)=>y.w-x.w||y.sk-x.sk); const top=P.slice(0,8);
  const qf=[[0,7],[3,4],[1,6],[2,5]].map(([i,j])=>game(top[i],top[j])); const sf=[game(qf[0],qf[1]), game(qf[2],qf[3])];
  // the final, played out by the rules engine
  let champ=game(sf[0],sf[1]), fin=null; const da=tcDeckOf(sf[0].a), db=tcDeckOf(sf[1].a);
  if (da && db && !G._tcCatch){ const r=TMR.play(da,db,hsh('final'+G.seed+':'+t)); if (r.w>=0){ champ=r.w===0? sf[0] : sf[1]; } fin={turns:r.turns, why:r.why, hb:r.harbor}; }
  const win=champ.a, ru=(champ===sf[0]?sf[1]:sf[0]).a;
  const cnt={}; for (const d of top) cnt[d.a.id]=(cnt[d.a.id]||0)+1;
  const exp=kind==='local'?0.03:0.1; for (const a of A){ const f=Math.max(0.004,a.sh); const conv=((cnt[a.id]||0)/8)/f; a.conv=conv; a.sh*=Math.max(0.9,Math.min(1.12,Math.pow(Math.max(0.2,conv),exp))); } win.sh+=kind==='champ'?0.02:kind==='regional'?0.008:0.002;
  const S=A.reduce((q,a)=>q+a.sh,0); A.forEach(a=>a.sh/=S);
  const hot=kind==='champ'?0.5:kind==='regional'?0.22:0.05; const key=Object.keys(win.cnt).filter(cid=>{ const c=tcCardByCid(+cid); return !!c; }).sort((x,y)=>win.cnt[y]-win.cnt[x]).slice(0,8);
  for (const cid of key) G.tcg.hy[cid]=(G.tcg.hy[cid]||0)+hot; for (const d of top) for (const cid in d.a.cnt) G.tcg.t8[cid]=(G.tcg.t8[cid]||0)+1/8;
  const npcs=G.npcs.filter(n=>n.ty==='tpl'); const who=npcs.length? pick(npcs).h : 'a local player';
  const ev={d:t, k:kind, n:N, top:top.map(d=>d.a.id), win:win.id, ru:ru.id, winner:who, cnt, fin}; G.tcg.ev.unshift(ev); if (G.tcg.ev.length>40) G.tcg.ev.length=40;
  if (kind!=='local'){ const lead=Object.keys(cnt).sort((a,b)=>cnt[b]-cnt[a])[0]; const nm=id=>(A.find(a=>a.id===id)||{name:id}).name;
    const how=fin? (fin.why==='harbor'? ` The final went ${fin.turns} turns and ended when ${ru.name}'s Harbor fell.` : fin.why==='deck'? ` The final ended with ${ru.name} decked out.` : ` The final went to the turn limit, decided on Harbor.`) : '';
    tcNews(`${win.name.toUpperCase()} WINS THE ${kind==='champ'?'TIDEMARK CHAMPIONSHIP':'REGIONAL'}`, `${who} piloted ${win.name} to the title among ${N} players, beating ${ru.name} in the final.${how} ${nm(lead)} put ${cnt[lead]} of the top 8 into the bracket.`, {cid:win.lead}); }
  return ev;
}
function tcEventsDay(t){ if (dowOf(t)!==6 || !G.tcg.arch.length) return; const [m,d]=mdOf(t); if ((m===6||m===12) && d>=8 && d<=14) tcRunEvent(t,'champ',640); else if (d<=7) tcRunEvent(t,'regional',140); else tcRunEvent(t,'local',24); }
// the rules committee: when one deck holds too much of the field for too long, ban the card whose loss hurts that deck most
// (never a format staple that every deck plays). Each candidate is tested by rebuilding the deck without it and replaying its matchups.
function tcBanImpact(a, cid, t){
  const T=G.tcg, p=T.mx.top[a.ix], c=TMR.byCid.get(cid); const bn=tmBanNames(t).concat([c.n]); const opp=T.arch.filter(b=>b!==a).slice(0,6);
  const nd=TMR.brew({id:p.id,mix:p.mix,plan:p.plan,tech:p.tech,lead:p.lead===cid? null : p.lead,seed:p.seed}, bn); if (!nd) return 0;
  const cur=TMR.unpack(p); let now=0, after=0, w=0;
  for (const b of opp){ const od=TMR.unpack(T.mx.top[b.ix]); if (!od) continue; const seed=hsh('ban'+t+cid+b.id); now+=b.sh*TMR.matchup(cur,od,6,seed); after+=b.sh*TMR.matchup(nd,od,6,seed); w+=b.sh; }
  return w? (now-after)/w : 0;
}
function tcBanCheck(t){
  const A=G.tcg.arch; if (!A.length) return; const D=G.tcg.dom; for (const a of A) D[a.id]= a.sh>TCP.dom? (D[a.id]||0)+1 : 0; const top=A.slice().sort((a,b)=>b.sh-a.sh)[0];
  if (top && D[top.id]>=TCP.domWeeks && t-(G.tcg.lastBan||0)>120){
    const staple=cid=>A.filter(b=>b!==top && b.cnt[cid]).reduce((s,b)=>s+b.sh,0)>0.3;
    const cand=Object.keys(top.cnt).map(Number).filter(cid=>{ const c=tcCardByCid(cid); return c && !G.tcg.ban[cid] && !staple(cid); })
      .sort((x,y)=>(y===top.lead?100:0)+TMR.rate(TMR.byCid.get(y))*0.3+top.cnt[y]-(x===top.lead?100:0)-TMR.rate(TMR.byCid.get(x))*0.3-top.cnt[x]).slice(0,4);
    // score: how much the dominant deck loses, minus collateral damage to every other deck that plays the card
    let best=null, bs=-9, bi=0; for (const cid of cand){ const im=tcBanImpact(top,cid,t); const col=A.filter(b=>b!==top && b.cnt[cid]).reduce((q,b)=>q+b.sh,0);
      const sc=im-0.5*col; if (sc>bs){ bs=sc; bi=im; best=cid; } }
    const c=best!=null? tcCardByCid(best) : null;
    if (c){ G.tcg.ban[c.cid]={d:t+14, ann:t, why:top.name, imp:+bi.toFixed(3)}; G.tcg.lastBan=t; D[top.id]=0; tcNews(`BAN ANNOUNCED: ${c.name.toUpperCase()}`, `The rules committee will remove ${c.name} from Standard on ${fmtDate(t+14)}, after ${top.name} held more than ${Math.round(TCP.dom*100)}% of the field for ${TCP.domWeeks} straight weeks. In testing, the deck wins ${Math.round(bi*100)} points less often without it. Copies are already moving.`, {cid:c.cid}); G.tcg.hy[c.cid]=(G.tcg.hy[c.cid]||0)+0.6; } }
}
// previews: Tenth Tide is shown in stages, long before you can buy it. What gets revealed is a signal, not a verdict.
function tcRevealed(n){ return (G.tcg&&G.tcg.rev[n])||[]; }
function tcSetLife(t){
  const nx=tcNextSet(t); if (!nx) return; const def=tcSetDef(nx), days=def.rel-t; const T=G.tcg; const cards=tcSetCards(nx);
  const show=(k)=>{ const r=T.rev[nx]||(T.rev[nx]=[]); for (const x of k) if (!r.includes(x)) r.push(x); };
  if (days<=35 && !T.ann['pv'+nx]){ T.ann['pv'+nx]=1; show(cards.filter(c=>c.rar==='alt'||c.rar==='leg').map(c=>c.no).concat(cards.filter(c=>c.rar==='rare'&&!tcAlt(c)).sort((a,b)=>b.pw-a.pw).slice(0,4).map(c=>c.no)));
    tcNews(`${def.name.toUpperCase()}: THE TENTH-ANNIVERSARY SET IS ANNOUNCED`, `${def.name} arrives ${fmtDate(def.rel)} with ${cards.length} cards: 150 new ones and 70 reprints from ten years of Tidemark, plus ten alternate-art versions. The Legendaries have been shown. Preorders are open.`, {set:nx}); }
  if (days<=21 && !T.ann['pv2'+nx]){ T.ann['pv2'+nx]=1; show(cards.filter(c=>c.rar==='rare'||c.rar==='unc'&&c.pk==='n').map(c=>c.no)); tcNews(`${def.name.toUpperCase()}: MORE CARDS REVEALED`, `The rest of the rares and the new uncommons are out. Players are already testing lists.`, {set:nx}); }
  if (days<=7 && !T.ann['pv3'+nx]){ T.ann['pv3'+nx]=1; show(cards.map(c=>c.no)); }
  if (days<=42 && !T.ann['rot'+nx]){ T.ann['rot'+nx]=1; const now=tcLegalSets(t); if (nx===TM_TT && now.length) tcNews('ROTATION: THE OLD STANDARD ENDS', `When ${def.name} releases on ${fmtDate(def.rel)}, Standard becomes the 220 cards of ${def.name} alone. Cards of the 2024 and 2025 sets that it does not reprint become Eternal-only, and ${def.reprint?'':'its 70 reprints are legal again'}.`, {set:nx}); }
}
function tcRelease(n, t){
  const def=tcSetDef(n); G.tcg.rel[n]=t; tcRebuildMeta(t); tcShopWeek(t, n);
  tcNews(`${def.name.toUpperCase()} IS OUT TODAY`, `Stores report long lines for ${def.name}. Boxes are expected to sell out within days.`, {set:n});
  if (typeof tcReleaseMarket==='function') tcReleaseMarket(n,t);
  if (typeof tcFulfilPreorders==='function') tcFulfilPreorders(n,t);
}
// ---------- the retail lifecycle ----------
// Only the anniversary set is printed: the publisher stopped printing everything older (decided 2026-10-19). It is on retail shelves for about
// 14 months (TC_PRINT_DAYS), restocked every Monday; afterwards the shelves only sell down. The market prices sealed product against that:
// near retail while it is on shelves, rising once it is gone (tcSealedFair).
const TC_PRINT_DAYS=425;
function tcPrintEnd(n){ return n===TM_TT? tcSetDef(n).rel+TC_PRINT_DAYS : tcSetDef(n).rel; }
function tcInPrint(n,t){ return n===TM_TT && t<tcPrintEnd(n) && t>=tcSetDef(n).rel; }
function tcShopWeek(t, only){
  const rel=tcReleasedSets(t), live=rel.filter(n=>tcInPrint(n,t));
  for (const n of live){ if (only!=null && n!==only) continue; const s=G.tcg.shop[n]||(G.tcg.shop[n]={pack:0,box:0}); const cur=true;
    const wind=tcPrintEnd(n)-t<60? 0.5 : 1;   // the last two months of the print run ship less
    const age=t-tcSetDef(n).rel; const big=age<100;
    s.pack=Math.min(300, s.pack+Math.round((big? ri(70,150) : ri(15,45))*wind)); s.box=Math.min(20, s.box+Math.round((big? ri(4,9) : ri(1,3))*wind)); }
}
// what the store still sells: sets in print, plus whatever is left on the shelf of a set that is not
function tcRetailSets(t){ return tcReleasedSets(t).filter(n=>tcInPrint(n,t) || (G.tcg && G.tcg.shop[n] && (G.tcg.shop[n].pack>0 || G.tcg.shop[n].box>0))); }
function tcShopDay(t){
  for (const n of tcRetailSets(t)){ const s=G.tcg.shop[n]; if (!s) continue; const age=t-tcSetDef(n).rel; let hot=age<=14?3.2: age<=45?1.2:0.35; const v=tcPackRetailPressure(n);
    if (!tcInPrint(n,t)) hot=Math.max(hot,1.2);   // once the print run is over, collectors clear the shelves
    s.pack=Math.max(0, s.pack-poisson(hot*14*v)); const sb=poisson(hot*1.2*v); s.box=Math.max(0, s.box-sb);
    s.so=(s.so==null?1:s.so)*0.9+(s.box<1?0.1:0); s.sop=(s.sop==null?1:s.sop)*0.9+(s.pack<1?0.1:0); }   // how often the shelf has been empty lately
}
function tcPrintNews(t){ const n=TM_TT, e=tcPrintEnd(n), def=tcSetDef(n); if (def.rel>t) return;
  if (t===e-30) tcNews(`FINAL PRINT RUN FOR ${def.name.toUpperCase()}`, `Tidemark Games says ${def.name} retail restocks end on ${fmtDate(e,true)}. Whatever is on shelves after that is all there will be.`, {set:n});
  if (t===e) tcNews(`${def.name.toUpperCase()} IS OUT OF PRINT`, `Stores received their last ${def.name} shipment. Sealed product now only gets scarcer.`, {set:n}); }
function tcPackRetailPressure(n){ return 0.7+0.9*Math.max(0, Math.min(1.6, tcSetPrestige(n)-0.7)); }
function tcApplyBans(t){ for (const cid in G.tcg.ban){ if (G.tcg.ban[cid].d===t){ tcRebuildMeta(t); const c=tcCardByCid(+cid); if (c) tcNews(c.name.toUpperCase()+' IS NOW BANNED', `${c.name} is no longer legal in Standard. ${G.tcg.ban[cid].why} players are retooling.`, {cid:+cid}); } } }
function tcDay(t){
  const T=G.tcg; if (!T) return; const nx=tcNextSet(t-1); if (nx && tcSetDef(nx).rel===t) tcRelease(nx,t);
  if (!T.arch.length && tcReleasedSets(t).includes(TM_TT)) tcRebuildMeta(t);
  tcApplyBans(t); tcPrintNews(t);
  if (dowOf(t)===1){ tcSetLife(t); if (T.arch.length){ tcMetaWeek(t); tcBanCheck(t); tcPruneWeek(t); tcBrewWeek(t); } tcShopWeek(t); }
  tcEventsDay(t); tcShopDay(t);
}
// existing saves and new worlds: play the metagame forward from the first release so it has a history
function tcCatchUp(t0, t1){ const live=G.live; G.live=false; G._tcCatch=true; for (let t=t0; t<=t1; t++){ tcDay(t); G.tcg.last=t; } G._tcCatch=false; G.live=live; }
