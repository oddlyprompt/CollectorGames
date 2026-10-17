// ===================== TCG: THE METAGAME =====================
// The player never plays matches. The rules engine (tcg_rules.js) plays them: it builds the decks the cards allow, plays
// them against each other, and the results decide what the simulated players bring, who wins events, what gets banned,
// and through usage and hype, what cards are worth.
function tcInit(){ G.tc=G.tc||{}; G.tpop=G.tpop||{}; G.nextTid=G.nextTid||1; G.tcg={v:1, cv:TC_CV, mv:WK_CANON.set.mv, rv:WKR.RV, usage:{}, t8:{}, hy:{}, ban:{}, arch:[], ev:[], dom:{}, shop:{}, pre:[], ann:{}, rev:{}, rel:{}, last:G.day, lastBan:0, mx:null}; }
function tcNews(h, b, ref){ if (!G.live || !G.tcg) return; const n={t:G.day,h,b,p:null,k:'tcg'}; if (ref){ if (ref.set!=null) n.ts=ref.set; if (ref.cid!=null) n.tcid=ref.cid; } G.news.unshift(n); if (G.news.length>320) G.news.length=320; }
function tcCardByCid(cid){ tcSetCards(Math.floor(cid/1000)); return TC_BYCID.get(+cid)||null; }
function tcLegalSets(t){ return tcReleasedSets(t).slice(-3); }
function tcBanned(cid,t){ const b=G.tcg&&G.tcg.ban[cid]; return !!(b && b.d<=(t==null?G.day:t)); }
// 'std' playable in Standard now, 'rot' only in the open format, 'ban' banned
function tcLegalState(cid, t){
  t=t==null?G.day:t; if (tcBanned(cid,t)) return 'ban';
  const legal=tcLegalSets(t); const c=G.tcg._lg||(G.tcg._lg={}); if (c.day!==t){ c.day=t; c.m=new Map(); }
  let r=c.m.get(cid); if (r) return r;
  const sets=[]; for (const s of tcReleasedSets(t)){ if (tcSetCards(s).some(x=>x.cid===cid&&!tcAlt(x))) sets.push(s); }
  r= sets.some(s=>legal.includes(s))? 'std':'rot'; c.m.set(cid,r); return r;
}
function tcLegalIdentities(t, all){ const out=new Map(); for (const s of tcLegalSets(t)) for (const c of tcSetCards(s)){ if (tcAlt(c)||c.kind==='essence') continue; if (!all && tcBanned(c.cid,t)) continue; if (!out.has(c.cid)) out.set(c.cid,c); } return [...out.values()]; }
function tcEssOf(t){ const m={}; for (const s of tcLegalSets(t)) for (const c of tcSetCards(s)) if (c.kind==='essence' && !tcAlt(c) && !m[c.el]) m[c.el]=c; return m; }
const TCP={eta:1.1, noise:0.012, hate:0.6, dom:0.24, domWeeks:10};
// ---------- the field: the decks that exist and their simulated matchups ----------
// With nothing banned this is the build's field for the sets in Standard (WK_METAS: "1" First Bond alone, "1,2" with
// Duskfall), computed with the same engine. After a ban, only the decks that played the banned card are rebuilt and
// re-tested; the result is kept in the save (G.tcg.mx).
const TC_FIELD0={};
function tcFieldKey(t){ return tcLegalSets(t).join(',')+'|'+Object.keys(G.tcg.ban).filter(cid=>tcBanned(+cid,t)).sort().join(','); }
// t: a day (the sets in Standard that day) or a set list such as "1,2"
function tcBaseField(t){
  t=t==null?G.day:t; const sk=typeof t==='string'? t : (tcLegalSets(t).join(',')||'1'); if (TC_FIELD0[sk]) return TC_FIELD0[sk];
  const pre=typeof WK_METAS!=='undefined' && WK_METAS && WK_METAS[sk]; if (pre && pre.rv===WKR.RV) return TC_FIELD0[sk]=pre;
  const ids=new Map(), ess={}; for (const s of sk.split(',').map(Number)) for (const c of tcSetCards(s)){ if (tcAlt(c)) continue; if (c.kind==='essence'){ ess[c.el]=ess[c.el]||c; continue; } if (!ids.has(c.cid)) ids.set(c.cid,c); }
  return TC_FIELD0[sk]=WKR.buildMeta([...ids.values()], ess, {gauntlet:4, field:8, pair:8});
}
// a fingerprint of the base field: when card rules or the engine change, saved matchups are rebuilt
function tcBaseSig(t){ const b=tcBaseField(t); return b._bs||(b._bs=String(hsh(b.top.map(p=>p.sig).join(';')+'|'+b.cands.length))); }
function tcField(t){
  const T=G.tcg, key=tcFieldKey(t); if (T.mx && T.mx.key===key && T.mx.rv===WKR.RV && T.mx.bs===tcBaseSig(t)) return T.mx;
  const base=tcBaseField(t); const sets=key.split('|')[0]; const same=T.mx && T.mx.rv===WKR.RV && T.mx.bs===tcBaseSig(T.mx.key.split('|')[0]||'1');
  let f;
  if (!same && key.endsWith('|')) f=base;   // nothing played yet (or the engine changed), nothing banned: exactly what the build computed
  else {
    // the decks people play now: the whole living field after a ban; after a release the new set's field plus the old decks still holding 3%
    const now=same && T.mx.key.split('|')[0]===sets; const share={}; for (const a of T.arch) share[a.ix]=a.sh;
    const packs= now? T.mx.top.slice() : base.top.concat(same? T.mx.top.filter((p,i)=>(share[i]||0)>=0.03) : []);
    const pool=tcLegalIdentities(t), legal=new Set(pool.map(c=>c.cid)); const byCid=new Map(); for (const s2 of tcLegalSets(t)) for (const c of tcSetCards(s2)) if (!tcAlt(c) && !byCid.has(c.cid)) byCid.set(c.cid,c);
    const decks=[], seen=new Set();
    for (const p of packs){ let d=WKR.unpackDeck(p,byCid); const touched=!d || !legal.has(p.lead) || p.c.concat(p.t).some(([id])=>!legal.has(id));
      if (touched){ if (!legal.has(p.lead)) continue; d=WKR.buildDeck(pool,byCid.get(p.lead),p.v||0); if (!d) continue; d.v=p.v||0; d.st=WKR.deckStyle(d); }
      const k=WKR.sig(d); if (seen.has(k)) continue; seen.add(k); d.aid=p.aid; d.tn=p.tn; d.g=p.g; decks.push(d); }
    const prev=same? {top:T.mx.top, M:T.mx.M} : {top:base.top, M:base.M};
    f={top:decks.map(d=>Object.assign(WKR.packDeck(d),{aid:d.aid,tn:d.tn})), M:WKR.roundRobin(decks, tcEssOf(t), 8, prev)};
  }
  T.mx={key, rv:WKR.RV, bs:tcBaseSig(t), top:f.top, M:f.M}; return T.mx;
}
function tcDeckOf(a){ const p=G.tcg.mx&&G.tcg.mx.top[a.ix]; if (!p) return null; const byCid=new Map(); for (const id of p.c.concat(p.t).map(x=>x[0]).concat([p.lead])) byCid.set(id,tcCardByCid(id)); const d=WKR.unpackDeck(p,byCid); return d? WKR.deckCards(d,tcEssOf(G.day)) : null; }
function tcRaw(a, b){ const M=G.tcg.mx&&G.tcg.mx.M; const p=M&&M[a.ix]&&M[a.ix][b.ix]; return p==null? 0.5 : p; }
const tcRough=a=>a.born==null? 0 : -TCM.rough*Math.max(0,1-(G.day-a.born)/TCM.fresh);   // an unrefined list: up to 5 points worse, gone after six weeks
function tcMatch(a, b){ if (a===b) return 0.5; return Math.max(0.03, Math.min(0.97, tcRaw(a,b)+tcRough(a)-tcRough(b))); }
function tcRebuildMeta(t){
  const f=tcField(t); if (!f || !f.top.length) return; const old={}; for (const a of G.tcg.arch) old[a.id]=a; const n=f.top.length;
  const list=f.top.map((p,i)=>{ const lead=tcCardByCid(p.lead), par=p.partner!=null? tcCardByCid(p.partner) : null; const str=(f.M[i].reduce((x,y)=>x+y,0)-0.5)/Math.max(1,n-1);
    return {id:p.aid||p.lead+(p.partner!=null?'+'+p.partner:''), ix:i, el:lead.el, st:p.st, name:lead.name+(par&&par.name!==lead.name?' / '+par.name:'')+(p.tn?' ('+p.tn+')':''), str:+str.toFixed(4),
      core:p.c.map(x=>x[0]), tr:p.t.map(x=>x[0]), cnt:Object.fromEntries(p.c.concat(p.t)), ess:p.e, line:[], lead:p.lead, partner:p.partner}; });
  const tot=list.reduce((s,a)=>s+Math.exp(6*a.str),0);
  const ids=new Set(); for (const a of list){ let k=a.id, n=2; while (ids.has(k)) k=a.id+'#'+(n++); a.id=k; ids.add(k); }
  for (const a of list){ const o=old[a.id]; a.sh= o? o.sh : Math.exp(6*a.str)/tot*0.6; a.hist=o?o.hist:[]; a.wr=o?o.wr:a.str; a.conv=o?o.conv:1; a.born=o? o.born : (G.tcg.arch.length? t : undefined); a.low=o?o.low:0; }
  const S=list.reduce((s,a)=>s+a.sh,0); list.forEach(a=>a.sh/=S); list.sort((a,b)=>b.sh-a.sh); G.tcg.arch=list; G.tcg.rv=WKR.RV; tcUsage();
}
function tcUsage(){
  const U={}; for (const a of G.tcg.arch) for (const cid in a.cnt) U[cid]=(U[cid]||0)+a.sh*a.cnt[cid];
  const old=G.tcg.usage; for (const cid in U) old[cid]=0.6*(old[cid]||0)+0.4*Math.min(4,U[cid]); for (const cid in old){ if (U[cid]==null){ old[cid]*=0.7; if (old[cid]<0.02) delete old[cid]; } }
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
// Real formats do not cycle through a fixed list. Players brew (often to beat what is popular), established decks get
// re-tuned with different trainer packages, new lists start rough and improve, and decks nobody plays are dropped and
// rarely come back. Brewing is busiest after a release, when one deck has led for weeks, and late in a format.
// Every candidate is tested with the rules engine against the decks people actually play before it can catch on.
const TCM={brew:0.3, rel:0.55, stale:0.35, late:0.15, tries:4, games:6, row:8, enter:0.03, drop:0.008, dropWeeks:6, minField:12, maxField:22, fresh:42, rough:0.05, gone:365};
const TC_TECH=[{k:'dis',n:'Disruption',w:{disrupt:1.6,gust:1.3,draw:0.8}}, {k:'heal',n:'Heal',w:{heal:1.6,tool:1.3,draw:0.8}}, {k:'turbo',n:'Turbo',w:{draw:1.4,search:1.4,heal:0.6,disrupt:0.6}},
  {k:'gust',n:'Gust',w:{gust:1.6,boost:1.3,heal:0.7}}, {k:'tools',n:'Tools',w:{tool:1.6,boost:1.3,disrupt:0.7}}];
function tcLastRelease(t){ const r=tcReleasedSets(t); return r.length? tcSetDef(r[r.length-1]).rel : -1e9; }
function tcBrewWeek(t){
  const T=G.tcg, A=T.arch; if (!A.length || !T.mx || A.length>=TCM.maxField) return null;
  const sinceRel=t-tcLastRelease(t), top=A[0]; T.lead=T.lead&&T.lead.id===top.id? {id:top.id, w:T.lead.w+1} : {id:top.id, w:1};
  const p=TCM.brew+(sinceRel<42?TCM.rel:0)+(T.lead.w>=6 && top.sh>0.17?TCM.stale:0)+(sinceRel>270?TCM.late:0); if (R()>=p) return null;
  const pool=tcLegalIdentities(t), essOf=tcEssOf(t); const byCid=new Map(); for (const s2 of tcLegalSets(t)) for (const c of tcSetCards(s2)) if (!tcAlt(c) && !byCid.has(c.cid)) byCid.set(c.cid,c);
  const field=T.mx.top.map(q=>WKR.unpackDeck(q,byCid)); const have=new Set(T.mx.top.map(q=>q.sig)); T.gone=T.gone||{};
  const targets=A.slice(0,6).filter(a=>field[a.ix]); const fresh=d=>{ const k=WKR.sig(d); return !have.has(k) && !(T.gone[k] && t-T.gone[k]<TCM.gone); };
  const finals=pool.filter(c=>c.kind==='creature' && !pool.some(d=>d.kind==='creature' && d.from===c.name));
  const tries=[];
  for (let i=0;i<TCM.tries;i++){ const r=R(); let d=null, tech=null, why;
    if (r<0.35){ const base=tcBaseField(t).cands.filter(q=>!have.has(q.sig) && !(T.gone[q.sig] && t-T.gone[q.sig]<TCM.gone)); if (!base.length) continue;   // a known list nobody plays yet
      const wsum=base.reduce((x,q)=>x+Math.exp(8*(q.g||0.5)),0); let x=R()*wsum, q=base[0]; for (const b of base){ x-=Math.exp(8*(b.g||0.5)); if (x<=0){ q=b; break; } } d=WKR.unpackDeck(q,byCid); why='brew'; }
    else if (r<0.65){ const a=A[Math.floor(R()*Math.min(8,A.length))]; const lead=tcCardByCid(a.lead); tech=TC_TECH[Math.floor(R()*TC_TECH.length)];   // an established deck, re-tuned
      d=lead && WKR.buildDeck(pool,lead,T.mx.top[a.ix].v||0,{w:tech.w, s:'t'+t+i}); why='tech'; }
    else { const lead=finals[Math.floor(R()*finals.length)]; tech=R()<0.5? TC_TECH[Math.floor(R()*TC_TECH.length)] : null;   // a rogue build around another final form
      d=lead && WKR.buildDeck(pool,lead,Math.floor(R()*4),tech? {w:tech.w, s:'r'+t+i} : null); why='rogue'; }
    if (!d || WKR.deckCards(d,essOf).length!==40 || !fresh(d)) continue; d.st=d.st||WKR.deckStyle(d);
    let w=0, n=0; for (const a of targets){ w+=a.sh*WKR.matchup(d,field[a.ix],essOf,TCM.games); n+=a.sh; } tries.push({d, tech, why, sc:n? w/n : 0.5}); }
  if (!tries.length) return null; tries.sort((x,y)=>y.sc-x.sc); const b=tries[0];
  if (b.sc<0.5-R()*0.06) return null;   // nothing tested well enough to bring (a slightly worse deck still gets a try now and then)
  const d=b.d; d.v=d.v||0; const row=field.map(o=>o? +WKR.matchup(d,o,essOf,TCM.row).toFixed(4) : 0.5);
  const pk=Object.assign(WKR.packDeck(d),{aid:d.lead.cid+(d.partner?'+'+d.partner.cid:'')+(b.tech?':'+b.tech.k:'')+'@'+t, tn:b.tech?b.tech.n:null});
  T.mx.top.push(pk); T.mx.M.forEach((r,i)=>r.push(+(1-row[i]).toFixed(4))); T.mx.M.push(row.concat([0.5]));
  const lead=d.lead, par=d.partner; const name=lead.name+(par&&par.name!==lead.name?' / '+par.name:'')+(b.tech?' ('+b.tech.n+')':'');
  const str=(row.reduce((x,y)=>x+y,0))/Math.max(1,row.length);
  const a={id:pk.aid, ix:T.mx.top.length-1, el:lead.el, st:pk.st, name, str:+str.toFixed(4), core:pk.c.map(x=>x[0]), tr:pk.t.map(x=>x[0]), cnt:Object.fromEntries(pk.c.concat(pk.t)), ess:pk.e, line:[], lead:pk.lead, partner:pk.partner,
    sh:TCM.enter, hist:[], wr:b.sc, conv:1, born:t, low:0, why:b.why};
  A.push(a); const S=A.reduce((x,y)=>x+y.sh,0); A.forEach(y=>y.sh/=S); A.sort((x,y)=>y.sh-x.sh); tcUsage();
  const beats=targets.slice().sort((x,y)=>WKR.matchup(d,field[y.ix],essOf,2)-WKR.matchup(d,field[x.ix],essOf,2))[0];
  const npcs=G.npcs.filter(n=>n.ty==='tpl'); const who=npcs.length? pick(npcs).h : 'A local player';
  tcNews(b.why==='tech'? `NEW TECH: ${name.toUpperCase()}` : `NEW DECK: ${name.toUpperCase()}`, b.why==='tech'? `${who} is running a re-tuned ${lead.name} list with a ${b.tech.n.toLowerCase()} package, built to handle ${beats?beats.name:'the top decks'}. Testers are copying it.` : `${who} brought ${name} to a local event${beats?' and it held up against '+beats.name:''}. Nobody was playing it a week ago.`, {cid:lead.cid});
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
// a tournament: Swiss rounds decided by the simulated matchups (plus each player's skill), a top-8 bracket, and a final that is played out card by card
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
  if (da && db){ const r=WKR.play(da,db,hsh('final'+G.seed+':'+t)); if (r.w>=0){ champ=r.w===0? sf[0] : sf[1]; } fin={turns:r.turns, why:r.why, pz:r.pz}; }
  const win=champ.a, ru=(champ===sf[0]?sf[1]:sf[0]).a;
  const cnt={}; for (const d of top) cnt[d.a.id]=(cnt[d.a.id]||0)+1;
  const exp=kind==='local'?0.03:0.1; for (const a of A){ const f=Math.max(0.004,a.sh); const conv=((cnt[a.id]||0)/8)/f; a.conv=conv; a.sh*=Math.max(0.9,Math.min(1.12,Math.pow(Math.max(0.2,conv),exp))); } win.sh+=kind==='champ'?0.02:kind==='regional'?0.008:0.002;
  const S=A.reduce((q,a)=>q+a.sh,0); A.forEach(a=>a.sh/=S);
  const hot=kind==='champ'?0.5:kind==='regional'?0.22:0.05; const key=Object.keys(win.cnt).filter(cid=>{ const c=tcCardByCid(+cid); return c && c.kind!=='essence'; }).sort((x,y)=>win.cnt[y]-win.cnt[x]).slice(0,8);
  for (const cid of key) G.tcg.hy[cid]=(G.tcg.hy[cid]||0)+hot; for (const d of top) for (const cid in d.a.cnt) G.tcg.t8[cid]=(G.tcg.t8[cid]||0)+1/8;
  const npcs=G.npcs.filter(n=>n.ty==='tpl'); const who=npcs.length? pick(npcs).h : 'a local player';
  const ev={d:t, k:kind, n:N, top:top.map(d=>d.a.id), win:win.id, ru:ru.id, winner:who, cnt, fin}; G.tcg.ev.unshift(ev); if (G.tcg.ev.length>40) G.tcg.ev.length=40;
  if (kind!=='local'){ const lead=Object.keys(cnt).sort((a,b)=>cnt[b]-cnt[a])[0]; const nm=id=>(A.find(a=>a.id===id)||{name:id}).name;
    const how=fin? (fin.why==='prizes'? ` The final went ${Math.ceil(fin.turns/2)} turns and ended on the last Prize card.` : fin.why==='wipe'? ` The final ended when ${ru.name} ran out of creatures.` : fin.why==='deck'? ` The final ended with ${ru.name} decked out.` : '') : '';
    tcNews(`${win.name.toUpperCase()} WINS THE ${kind==='champ'?'WILDKIN CHAMPIONSHIP':'REGIONAL'}`, `${who} piloted ${win.name} to the title among ${N} players, beating ${ru.name} in the final.${how} ${nm(lead)} put ${cnt[lead]} of the top 8 into the bracket.`, {cid:win.lead}); }
  return ev;
}
function tcEventsDay(t){ if (dowOf(t)!==6 || !G.tcg.arch.length) return; const [m,d]=mdOf(t); if ((m===6||m===12) && d>=8 && d<=14) tcRunEvent(t,'champ',640); else if (d<=7) tcRunEvent(t,'regional',140); else tcRunEvent(t,'local',24); }
// the rules committee: when one deck holds too much of the field for too long, ban the card whose loss hurts that deck most
// (never a format staple that every deck plays). Each candidate is tested by rebuilding the deck without it and replaying its matchups.
function tcBanImpact(a, cid, t){
  const pool=tcLegalIdentities(t).filter(c=>c.cid!==cid); const essOf=tcEssOf(t); const cur=G.tcg.mx.top[a.ix]; const lead=cid===a.lead? (a.partner!=null? tcCardByCid(a.partner) : null) : tcCardByCid(a.lead);
  let d=lead && WKR.buildDeck(pool, lead, cur.v); if (!d && a.partner!=null && cid!==a.partner) d=WKR.buildDeck(pool, tcCardByCid(a.partner), 0);
  const now0=G.tcg.arch.filter(b=>b!==a).slice(0,6).reduce((q,b)=>q+b.sh*tcMatch(a,b),0)/Math.max(1e-9,G.tcg.arch.filter(b=>b!==a).slice(0,6).reduce((q,b)=>q+b.sh,0));
  if (!d) return now0-0.3; const byCid=new Map(); for (const s of tcLegalSets(t)) for (const c of tcSetCards(s)) if (!tcAlt(c) && !byCid.has(c.cid)) byCid.set(c.cid,c);
  const opp=G.tcg.arch.filter(b=>b!==a).slice(0,6); let now=0, after=0, w=0;
  for (const b of opp){ const od=WKR.unpackDeck(G.tcg.mx.top[b.ix],byCid); if (!od) continue; now+=b.sh*tcMatch(a,b); after+=b.sh*WKR.matchup(d,od,essOf,8); w+=b.sh; }
  return w? (now-after)/w : 0;
}
function tcBanCheck(t){
  const A=G.tcg.arch; if (!A.length) return; const D=G.tcg.dom; for (const a of A) D[a.id]= a.sh>TCP.dom? (D[a.id]||0)+1 : 0; const top=A.slice().sort((a,b)=>b.sh-a.sh)[0];
  if (top && D[top.id]>=TCP.domWeeks && t-(G.tcg.lastBan||0)>120){
    const staple=cid=>A.filter(b=>b!==top && b.cnt[cid]).reduce((s,b)=>s+b.sh,0)>0.3;
    const cand=Object.keys(top.cnt).map(Number).filter(cid=>{ const c=tcCardByCid(cid); return c && c.kind!=='essence' && !G.tcg.ban[cid] && !staple(cid); })
      .sort((x,y)=>(y===top.lead?100:0)+(y===top.partner?50:0)+top.cnt[y]-(x===top.lead?100:0)-(x===top.partner?50:0)-top.cnt[x]).slice(0,5);
    // score: how much the dominant deck loses, minus collateral damage to every other deck that plays the card
    let best=null, bs=-9, bi=0; for (const cid of cand){ const im=tcBanImpact(top,cid,t); const col=A.filter(b=>b!==top && b.cnt[cid]).reduce((q,b)=>q+b.sh,0); const c=tcCardByCid(cid);
      const sc=im-0.5*col-(c.kind==='creature' && c.to? 0.04 : 0); if (sc>bs){ bs=sc; bi=im; best=cid; } }
    const c=best!=null? tcCardByCid(best) : null;
    if (c){ G.tcg.ban[c.cid]={d:t+14, ann:t, why:top.name, imp:+bi.toFixed(3)}; G.tcg.lastBan=t; D[top.id]=0; tcNews(`BAN ANNOUNCED: ${c.name.toUpperCase()}`, `The rules committee will remove ${c.name} from Standard on ${fmtDate(t+14)}, after ${top.name} held more than ${Math.round(TCP.dom*100)}% of the field for ${TCP.domWeeks} straight weeks. In testing, the deck wins ${Math.round(bi*100)} points less often without it. Copies are already moving.`, {cid:c.cid}); G.tcg.hy[c.cid]=(G.tcg.hy[c.cid]||0)+0.6; } }
}
// previews: a new set is shown in stages, long before you can buy it. What gets revealed is a signal, not a verdict.
function tcRevealed(n){ return (G.tcg&&G.tcg.rev[n])||[]; }
function tcSetLife(t){
  const nx=tcNextSet(t); if (!nx) return; const def=tcSetDef(nx), days=def.rel-t; const T=G.tcg; const cards=tcSetCards(nx);
  const show=(k)=>{ const r=T.rev[nx]||(T.rev[nx]=[]); for (const x of k) if (!r.includes(x)) r.push(x); };
  if (days<=35 && !T.ann['pv'+nx]){ T.ann['pv'+nx]=1; show(cards.filter(c=>tcIsPrem(c)&&(c.rar==='sir'||c.rar==='fa')).map(c=>c.no).concat(cards.filter(c=>c.rar==='rare'&&c.kind==='creature').sort((a,b)=>b.pw-a.pw).slice(0,2).map(c=>c.no)));
    tcNews(`${def.name.toUpperCase()}: ${def.reprint?'A GREATEST-HITS SET IS ANNOUNCED': nx===1?'THE FIRST WILDKIN SET IS ANNOUNCED':'THE NEXT SET IS ANNOUNCED'}`, `${def.name} arrives ${fmtDate(def.rel)} with ${cards.length} cards${def.reprint?', reprinting fan favourites from earlier sets':''}. The first cards have been shown. Preorders are open.`, {set:nx}); }
  if (days<=21 && !T.ann['pv2'+nx]){ T.ann['pv2'+nx]=1; show(cards.filter(c=>c.kind!=='creature'||c.rar==='rare').map(c=>c.no)); tcNews(`${def.name.toUpperCase()}: MORE CARDS REVEALED`, `The rest of the rares and the trainers are out. Players are already testing lists.`, {set:nx}); }
  if (days<=7 && !T.ann['pv3'+nx]){ T.ann['pv3'+nx]=1; show(cards.map(c=>c.no)); }
  if (days<=42 && !T.ann['rot'+nx]){ T.ann['rot'+nx]=1; const after=tcReleasedSets(def.rel).slice(-3), now=tcLegalSets(t); const out=now.filter(s=>!after.includes(s)); if (out.length) tcNews('ROTATION: '+out.map(s=>tcSetDef(s).name.toUpperCase()).join(', ')+' LEAVES STANDARD', `When ${def.name} releases on ${fmtDate(def.rel)}, ${out.map(s=>tcSetDef(s).name).join(' and ')} cards stop being legal in Standard. Anything not reprinted becomes open-format only.`, {set:nx}); }
}
function tcRelease(n, t){
  const def=tcSetDef(n); G.tcg.rel[n]=t; tcRebuildMeta(t); tcShopWeek(t, n);
  tcNews(`${def.name.toUpperCase()} IS OUT TODAY`, `Stores report long lines for ${def.name}. Boxes are expected to sell out within days.`, {set:n});
  if (typeof tcReleaseMarket==='function') tcReleaseMarket(n,t);
  if (typeof tcFulfilPreorders==='function') tcFulfilPreorders(n,t);
}
// ---------- the retail lifecycle ----------
// A set is printed for about 14 months (TC_PRINT_DAYS). Until then retail restocks it every Monday; afterwards the shelves
// only sell down. The market prices sealed product against that: near retail while it is on shelves, rising once it is gone
// (tcSealedFair). Before this, the newest set was printed forever while its sealed price kept climbing, so buying at
// retail and reselling was free money (found in the owner's three-year playtest).
const TC_PRINT_DAYS=425;
function tcPrintEnd(n){ return tcSetDef(n).rel+TC_PRINT_DAYS; }
function tcInPrint(n,t){ return t<tcPrintEnd(n); }
function tcShopWeek(t, only){
  const rel=tcReleasedSets(t), live=rel.filter(n=>tcInPrint(n,t));
  for (const n of live){ if (only!=null && n!==only) continue; const s=G.tcg.shop[n]||(G.tcg.shop[n]={pack:0,box:0}); const age=t-tcSetDef(n).rel; const cur=age<100||n===live[live.length-1];   // the newest set in print keeps the big allocation
    const wind=tcPrintEnd(n)-t<60? 0.5 : 1;   // the last two months of the print run ship less
    s.pack=Math.min(300, s.pack+Math.round((cur? ri(70,150) : ri(15,45))*wind)); s.box=Math.min(20, s.box+Math.round((cur? ri(4,9) : ri(1,3))*wind)); }
}
// what the store still sells: sets in print, plus whatever is left on the shelf of a set that is not
function tcRetailSets(t){ return tcReleasedSets(t).filter(n=>tcInPrint(n,t) || (G.tcg && G.tcg.shop[n] && (G.tcg.shop[n].pack>0 || G.tcg.shop[n].box>0))); }
function tcShopDay(t){
  for (const n of tcRetailSets(t)){ const s=G.tcg.shop[n]; if (!s) continue; const age=t-tcSetDef(n).rel; let hot=age<=14?3.2: age<=45?1.2:0.35; const v=tcPackRetailPressure(n);
    if (!tcInPrint(n,t)) hot=Math.max(hot,1.2);   // once the print run is over, collectors clear the shelves
    s.pack=Math.max(0, s.pack-poisson(hot*14*v)); const sb=poisson(hot*1.2*v); s.box=Math.max(0, s.box-sb);
    s.so=(s.so==null?1:s.so)*0.9+(s.box<1?0.1:0); s.sop=(s.sop==null?1:s.sop)*0.9+(s.pack<1?0.1:0); }   // how often the shelf has been empty lately
}
function tcPrintNews(t){ for (const n of tcReleasedSets(t)){ const e=tcPrintEnd(n), def=tcSetDef(n);
  if (t===e-30) tcNews(`FINAL PRINT RUN FOR ${def.name.toUpperCase()}`, `Wildkin Games says ${def.name} retail restocks end on ${fmtDate(e,true)}. Whatever is on shelves after that is all there will be.`, {set:n});
  if (t===e) tcNews(`${def.name.toUpperCase()} IS OUT OF PRINT`, `Stores received their last ${def.name} shipment. Sealed product now only gets scarcer.`, {set:n}); } }
function tcPackRetailPressure(n){ return 0.7+0.9*Math.max(0, Math.min(1.6, tcSetPrestige(n)-0.7)); }
function tcApplyBans(t){ for (const cid in G.tcg.ban){ if (G.tcg.ban[cid].d===t){ tcRebuildMeta(t); const c=tcCardByCid(+cid); if (c) tcNews(c.name.toUpperCase()+' IS NOW BANNED', `${c.name} is no longer legal in Standard. ${G.tcg.ban[cid].why} players are retooling.`, {cid:+cid}); } } }
function tcDay(t){
  const T=G.tcg; if (!T) return; const nx=tcNextSet(t-1); if (nx && tcSetDef(nx).rel===t) tcRelease(nx,t);
  if (!T.arch.length && tcReleasedSets(t).length) tcRebuildMeta(t);
  tcApplyBans(t); tcPrintNews(t);
  if (dowOf(t)===1){ tcSetLife(t); if (T.arch.length){ tcMetaWeek(t); tcBanCheck(t); tcPruneWeek(t); tcBrewWeek(t); } tcShopWeek(t); }
  tcEventsDay(t); tcShopDay(t);
}
// existing saves and new worlds: play the metagame forward from the first release so it has a history
function tcCatchUp(t0, t1){ const live=G.live; G.live=false; G._tcCatch=true; for (let t=t0; t<=t1; t++){ tcDay(t); G.tcg.last=t; } G._tcCatch=false; G.live=live; }
