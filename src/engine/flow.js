function tcase(h){ return String(h).toLowerCase().replace(/(^|[\s(\-"'#])([a-z])/g,(m,a,b)=>a+b.toUpperCase()).replace(/\b(A|An|The|Of|In|On|At|To|For|And|Or|As|By|With|From)\b(?!$)/g,(m,w,i)=>i===0?w:w.toLowerCase()); }
// ===================== FLOW: keeping track of a moving hobby =====================
const DOW=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
function dayTxt(d){ const n=d-G.day; return n===0?'Today': n===1?'Tomorrow': DOW[dowOf(d)]+' '+fmtDate(d); }
function nextDow(w, from){ let d=(from==null?G.day:from)+1; while (dowOf(d)!==w) d++; return d; }
// ---------- everything with a date on it, in one list ----------
function upNext(){
  const out=[]; const add=(d,txt,act,a,kind)=>{ if (d>=G.day) out.push({d,txt,act,a,kind}); };
  for (const s of G.player.subs||[]){ const c=C(s.cid); if (c) add(s.t1,'Back from GCS: '+cardName(c),'card',c.id,'grade'); }
  for (const s of G.player.csubs||[]){ const c=MC(s.cid); if (c) add(s.t1,(s.kind==='press'?'Back from pressing: ':'Back from GCS: ')+cmD(c.k).title,'ccopy',c.id,'grade'); }
  for (const l of myListings()) if (l.ty==='auc') add(l.en,'Your auction ends: '+itemLabel(l),'listing',l.id,'market');
  for (const l of G.lst) if (l.ty==='auc' && l.sel!==0 && l.bids.some(b=>b[0]===0)) add(l.en,(l.lead===0?'Winning':'Outbid')+': '+itemLabel(l),'listing',l.id,'market');
  if (G.cm){ add(nextDow(3, G.day-1)===G.day?G.day:nextDow(3),'New comics at '+SHOP_NAME,'goto','comics:week','comics');
    const pre=new Map(); for (const p of G.cm.pre){ const s=S_(p.sid); const k=p.d; pre.set(k,(pre.get(k)||[]).concat(sTitle(s)+' #'+p.n)); }
    for (const [d,l] of pre) add(d,'Preorder arrives: '+l.slice(0,2).join(', ')+(l.length>2?' +'+(l.length-2):''),'goto','comics:week','comics'); }
  { const pay=G.player.pay!=null?G.player.pay:50; if (pay>0) add(dowOf(G.day)===5?G.day:nextDow(5),'Payday: +'+money(pay),null,null,'cash'); }   // the scenario's real allowance (none for Deep pockets)
  const rel=G.products.filter(p=>!p.cl && p.rel>=G.day).sort((a,b)=>a.rel-b.rel)[0]; if (rel) add(rel.rel,'Release: '+prodName(rel),'product',rel.id,'cards');
  if (G.hunt){ for (const ev of G.hunt.ev.filter(ev=>ev.ann<=G.day && ev.d+ev.days>G.day && ev.ty!=='flea' && ev.ty!=='garage').sort((a,b)=>a.d-b.d).slice(0,4)) add(Math.max(ev.d,G.day), ev.n+(ev.cost>40?' ('+money(ev.cost)+' to attend)':''),'goto','hunt:events','hunt');
    const gs=G.hunt.ev.filter(ev=>ev.ty==='garage' && ev.ann<=G.day && ev.d>=G.day); if (gs.length) add(gs[0].d, gs.length>1? gs.length+' garage sales':gs[0].n,'goto','hunt:events','hunt');
    for (const a of G.hunt.auc.filter(a=>!a.done && a.ann<=G.day)) add(a.d, a.n+' closes'+(a.lots.some(l=>l.mx)?' (you have bids)':''),'goto','hunt:auction','hunt');
    for (const pv of G.hunt.pv) add(pv.exp,'Last day to buy: '+pvSeller(pv).n,'hpv',pv.id,'hunt'); }
  return out.sort((a,b)=>a.d-b.d || (a.kind==='grade'?-1:1));
}
function upRow(x, skip){ const btn = x.d>G.day && skip ? `<button class="btn sm ${skip==='pri'?'pri':''}" data-act="skipto" data-a="${x.d}">Skip ${x.d-G.day}d</button>` : ''; return `<div class="row upn"><div class="upd">${esc(dayTxt(x.d))}</div>${x.act?`<button class="linkbtn rt" style="text-align:left" data-act="${x.act}" data-a="${esc(String(x.a))}"><b>${esc(x.txt)}</b></button>`:`<div class="rt"><b>${esc(x.txt)}</b></div>`}${btn}</div>`; }
function upNextPanel(){ const u=upNext().slice(0,7); return `<div class="panel"><div class="phead"><h3>Up next</h3><button class="linkbtn" data-act="skipsheet">Skip ahead</button></div><div class="rows">${u.map(x=>upRow(x,1)).join('')||'<div class="empty">Nothing scheduled.</div>'}</div></div>`; }
function skipSheet(){
  const u=upNext(); const seen=new Set(); const opts=u.filter(x=>x.d>G.day && !seen.has(x.d+'|'+x.kind) && seen.add(x.d+'|'+x.kind)).slice(0,10);
  return { t:'Skip ahead', h:`<div class="stack"><p class="small muted" style="margin:0">Jump straight to the next thing you care about. The skip stops early if you're outbid or get an offer.</p>
    <div class="panel"><div class="rows">${opts.map(x=>`<button class="row" data-act="skipto" data-a="${x.d}"><div class="upd">${esc(dayTxt(x.d))}</div><div class="rt"><b>${esc(x.txt)}</b><span>${x.d-G.day} day${x.d-G.day>1?'s':''} from now</span></div></button>`).join('')}</div></div>
    <div class="formrow"><button class="btn" data-act="skipto" data-a="${G.day+7}">One week</button><button class="btn" data-act="skipto" data-a="${G.day+14}">Two weeks</button><button class="btn" data-act="skipto" data-a="${G.day+30}">A month</button></div></div>` };
}
ACT.skipsheet = ()=>openSheet(skipSheet);
ACT.skipto = a=>{ closeSheet(true); const n=(+a)-G.day; if (n>0) ACT.adv(String(n)); };

// ---------- what changed while time passed ----------
function holdingSnap(){ const m=new Map(); for (const c of myCards()) m.set('c'+c.id,[cardValue(c), c.k, cardName(c)+' '+shortLine(c)]); if (G.cm) for (const c of myComics()) m.set('m'+c.id,[cmCopyValue(c), c.k, cmItemLabel(c)]); for (const s of mySealed()){ const prod=G.products[s.p]; m.set('s'+s.id,[sealedFair(prod,s.f), sealedKey(prod,s.f), prodName(prod)+' '+FMT_NAME[s.f].toLowerCase()]); } return m; }
function ownedPlayers(){ const m=new Map(); for (const c of myCards()){ const pid=D(c.k).pid; m.set(pid,(m.get(pid)||0)+1); } return m; }
function ownedSeries(){ const m=new Map(); if (G.cm) for (const c of myComics()){ const sid=cmD(c.k).sid; m.set(sid,(m.get(sid)||0)+1); } return m; }
function newsWhy(n){ return n? `<span class="why">${esc(tcase(n.h))}</span>` : ''; }
function reasonFor(key){ // the most recent headline that plausibly moved this
  const t0=G.day-35;
  if (key[0]==='M'){ const sid=cmD(key).sid; const s=S_(sid); const chars=new Set(issueKeys(s,cmD(key).n).map(k=>k[2])); return G.news.find(n=>n.t>=t0 && n.k==='comic' && (n.cs===sid || (n.cc!=null && chars.has(n.cc)))); }
  if (key[0]==='S') return null; const pid=D(key).pid; return G.news.find(n=>n.t>=t0 && n.p===pid);
}
function recapHTML(r){
  const moves=r.moves.slice(0,6), mine=r.mine.slice(0,5), other=r.other.slice(0,4);
  return `<div class="stack">
    ${r.stop?`<div class="note small">${esc(r.stop)}</div>`:''}
    ${r.log.length?`<div class="panel"><h3>What happened</h3><div class="rows">${r.log.map(x=>`<div class="newsrow"><div class="meta">${fmtDate(x[0])}</div><div>${esc(x[1])}</div></div>`).join('')}</div></div>`:''}
    ${moves.length?`<div class="panel"><h3>Your collection moved</h3><p class="small muted" style="margin:0 0 6px">Estimated value, ${fmtDate(r.t0)} to ${fmtDate(r.t1)}. Collection ${money(r.v0)} → ${money(r.v1)}.</p><div class="rows">${moves.map(m=>`<button class="row" data-act="${m.id[0]==='c'?'card':m.id[0]==='m'?'ccopy':'sealed'}" data-a="${m.id.slice(1)}"><div class="rt"><b>${esc(m.label)}</b>${m.why?newsWhy(m.why):'<span>No headline; sales and supply moved it.</span>'}</div><div class="rv"><b class="${m.d>0?'up':'down'}">${m.d>0?'▲':'▼'} ${Math.abs(Math.round(m.pct))}%</b><span>${money(m.v1,true)}</span></div></button>`).join('')}</div></div>`:''}
    ${mine.length?`<div class="panel"><h3>News about things you own</h3>${mine.map(anyNewsRow).join('')}</div>`:''}
    ${other.length?`<div class="panel"><h3>Other headlines</h3>${other.map(anyNewsRow).join('')}</div>`:''}
    ${marketPulse(true)}
    <div class="panel"><h3>Coming up</h3><div class="rows">${upNext().slice(0,4).map(x=>upRow(x,0)).join('')}</div></div></div>`;
}
function buildRecap(t0, snap0, log, stop){
  const snap1=holdingSnap(); const moves=[]; let v0=0, v1=0;
  for (const [id,[v,k,label]] of snap1){ v1+=v; const o=snap0.get(id); if (!o) continue; v0+=o[0]; const d=v-o[0]; const pct=o[0]>0? d/o[0]*100 : 0; if (Math.abs(d)>=Math.max(1, o[0]*0.08)) moves.push({id, label, d, pct, v1:v, why:reasonFor(k)}); }
  moves.sort((a,b)=>Math.abs(b.d)-Math.abs(a.d));
  const op=ownedPlayers(), os=ownedSeries(); const recent=G.news.filter(n=>n.t>t0);
  const isMine=n=> (n.p!=null && op.has(n.p)) || (n.cs!=null && os.has(n.cs));
  const r={ t0, t1:G.day, v0, v1, moves, log, stop, mine:recent.filter(isMine), other:recent.filter(n=>!isMine(n) && (n.k==='comic'||n.k==='tcg'||n.k==='xtg'||n.p!=null||n.k==='hobby')) };
  G.player.lastRecap={ t0, t1:G.day, n:moves.length+r.mine.length };
  return r;
}
function anyNewsRow(n){ return n.k==='comic'&&G.cm? cmNewsRow(n) : newsRow(n); }
// ---------- market pulse: what's moving and why ----------
function playerMove(p, days){ const h=p.hx; if (!h || h.length<3) return 0; const t=G.day-days; let old=null; for (const x of h){ if (x[0]<=t) old=x[1]; } if (old==null) old=h[0][1]; const now=playerBase(p); return old>0? (now-old)/old : 0; }
function seriesMove(s){ const h=s.vw; if (!h || h.length<2) return 0; const old=h[0], now=h[h.length-1]; return old>0? (now-old)/old : 0; }
function trackSeries(t){ // weekly: remember what a #1 was worth, for the series people are watching
  if (!G.cm) return;
  const fol=new Set((G.player.cfol)||[]), own=ownedSeries();
  for (const s of G.cm.ser){ if (!s.n) continue; const h=s.heat+s.spec; if (h<0.5 && !fol.has(s.id) && !own.has(s.id) && !s.vw) continue;
    const v=Math.round(cmFair(mk(s.id,1,1,''),0)*100)/100; (s.vw=s.vw||[]).push(v); if (s.vw.length>5) s.vw.shift(); if (h<0.3 && !fol.has(s.id) && !own.has(s.id) && s.vw.every(x=>x<3)) delete s.vw; }
}
function marketPulse(compact){
  const ps=G.players.filter(p=>p.hx && p.hx.length>5 && playerBase(p)>0.35).map(p=>[p, playerMove(p,21)]).filter(x=>Math.abs(x[1])>=0.12);
  const up=ps.filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1]).slice(0,compact?3:5), dn=ps.filter(x=>x[1]<0).sort((a,b)=>a[1]-b[1]).slice(0,compact?2:4);
  const ss=G.cm? G.cm.ser.filter(s=>s.vw && s.vw.length>=3).map(s=>[s, seriesMove(s)]).filter(x=>Math.abs(x[1])>=0.15 && x[0].vw[x[0].vw.length-1]>=3) : [];
  const sup=ss.filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1]).slice(0,compact?3:5), sdn=ss.filter(x=>x[1]<0).sort((a,b)=>a[1]-b[1]).slice(0,compact?2:4);
  const why=(pid)=>G.news.find(n=>n.p===pid && n.t>=G.day-30); const swhy=(sid)=>G.news.find(n=>n.cs===sid && n.t>=G.day-45);
  const prow=([p,m])=>{ const w=why(p.id); return `<button class="row" data-act="player" data-a="${p.id}"><div class="rt"><b>${esc(pname(p))}</b>${w?newsWhy(w):`<span>${esc(pulseGuess(p,m))}</span>`}</div><div class="rv"><b class="${m>0?'up':'down'}">${m>0?'▲':'▼'} ${Math.round(Math.abs(m)*100)}%</b><span>card index</span></div></button>`; };
  const srow=([s,m])=>{ const w=swhy(s.id); return `<button class="row" data-act="cseries" data-a="${s.id}"><div class="rt"><b>${esc(sTitle(s))}</b>${w?newsWhy(w):`<span>${esc(m>0?'Buyers are chasing it; no single headline':'Interest is fading')}</span>`}</div><div class="rv"><b class="${m>0?'up':'down'}">${m>0?'▲':'▼'} ${Math.round(Math.abs(m)*100)}%</b><span>#1 value</span></div></button>`; };
  if (!up.length && !dn.length && !sup.length && !sdn.length) return compact? '' : '<div class="panel"><h3>Market pulse</h3><div class="empty">Nothing is moving much right now.</div></div>';
  return `<div class="panel"><div class="phead"><h3>Market pulse</h3><span class="muted small">last 3 to 4 weeks</span></div><p class="small muted" style="margin:0 0 6px">What's moving, and the most likely reason. Prices follow news, performance, sales and supply.</p>
    ${up.length||dn.length?`<div class="small muted" style="margin:4px 0">Baseball cards</div><div class="rows">${up.concat(dn).map(prow).join('')}</div>`:''}
    ${sup.length||sdn.length?`<div class="small muted" style="margin:8px 0 4px">Comics</div><div class="rows">${sup.concat(sdn).map(srow).join('')}</div>`:''}</div>`;
}
function pulseGuess(p, m){ if (p.tm===-1) return m>0?'No single headline: prospect buzz and buying':'No single headline: prospect buzz fading'; if (p.tm===-2) return m>0?'No single headline: collectors revisiting a retired name':'No single headline: interest drifting'; return m>0?'No single headline: recent play and buying pressure':'No single headline: recent play and selling'; }
// ---------- time: skip with early stop, then recap ----------
ACT.adv = async (a)=>{
  if (UI.busy) return; UI.busy=true;
  const n=+a||1; UI.log=[]; const t0=G.day; const snap0=holdingSnap();
  const ob0 = new Set(outbidLive().map(l=>l.id)); const off0 = myListings().reduce((s,l)=>s+l.offers.length,0);
  document.querySelectorAll('[data-act="adv"],[data-act="skipsheet"]').forEach(b=>b.disabled=true);
  let stop='';
  try {
    for (let i=0;i<n;i++){ advanceDay(); if (dowOf(G.day)===3) trackSeries(G.day);
      if (n>1){ updateHeader(); await new Promise(r=>setTimeout(r,0));
        if (i<n-1){ const ob=outbidLive().filter(l=>!ob0.has(l.id)); const off=myListings().reduce((s,l)=>s+l.offers.length,0)-off0; if (ob.length||off>0){ stop='Stopped early on '+fmtDate(G.day)+': '+(ob.length?'you were outbid.':'you have a new offer.'); break; } } } }
  } catch(e){ console.error(e); }
  const log=UI.log; UI.log=null; UI.busy=false;
  document.querySelectorAll('[data-act="adv"],[data-act="skipsheet"]').forEach(b=>b.disabled=false);
  const ob = outbidLive().filter(l=>!ob0.has(l.id)); const off = myListings().reduce((s,l)=>s+l.offers.length,0)-off0;
  if (ob.length) log.push([G.day, 'Outbid on '+ob.length+(ob.length>1?' auctions':' auction')+': '+ob.map(itemLabel).slice(0,2).join('; ')]);
  if (off>0) log.push([G.day, off+(off>1?' new offers':' new offer')+' on your listings']);
  const r=buildRecap(t0, snap0, log, stop); UI.recap=r;
  refresh();
  const days=G.day-t0;
  if (days>1 || log.length>2 || r.moves.length>=2 || r.mine.length || (r.world&&r.world.length)) openSheet(()=>({ t: days>1? 'While you were away' : 'Today, '+fmtDate(G.day), h: recapHTML(r) }));
  else log.forEach(x=>showToast(x[1], x[2]));
  queueSave();
};
ACT.recap = ()=>{ if (UI.recap) openSheet(()=>({ t:'Last update', h:recapHTML(UI.recap) })); };
// ---------- news knows what you own ----------
const _newsRow=newsRow; newsRow = function(n){ if (n.k==='comic' && G.cm) return cmNewsRow(n); let h=_newsRow(n); if (n.p!=null){ const c=ownedPlayers().get(n.p); if (c) h=h.replace('<div class="meta">',`<div class="meta"><span class="tag own">You own ${c}</span> `); } return h; };
const _cmNewsRow=cmNewsRow; cmNewsRow = function(n){ let h=_cmNewsRow(n); if (n.cs!=null){ const c=ownedSeries().get(n.cs); if (c) h=h.replace('<div class="meta">',`<div class="meta"><span class="tag own">You own ${c}</span> `); } return h; };
// ---------- a reason line on player and series pages ----------
playerSheet = (function(f){ return function(pid){ const r=f(pid); if (!r) return r; const p=P(pid); const m=playerMove(p,21); if (Math.abs(m)<0.1) return r; const w=G.news.find(n=>n.p===pid && n.t>=G.day-30);
  const line=`<div class="note small"><b class="${m>0?'up':'down'}">${m>0?'▲':'▼'} ${Math.round(Math.abs(m)*100)}% in three weeks.</b> ${w?'Probably: '+esc(tcase(w.h))+'.':esc(pulseGuess(p,m))+'.'}</div>`;
  const i=r.h.indexOf('<div class="kpis">'); if (i>=0) r.h=r.h.slice(0,i)+line+r.h.slice(i); return r; }; })(playerSheet);
seriesSheet = (function(f){ return function(sid){ const r=f(sid); if (!r) return r; const s=S_(sid); const m=seriesMove(s); if (!s.vw || s.vw.length<3 || Math.abs(m)<0.12) return r; const w=G.news.find(n=>n.cs===sid && n.t>=G.day-45);
  const line=`<div class="note small"><b class="${m>0?'up':'down'}">#1 ${m>0?'up':'down'} ${Math.round(Math.abs(m)*100)}% in the last few weeks.</b> ${w?'Probably: '+esc(tcase(w.h))+'.':''}</div>`;
  const i=r.h.indexOf('<p class="small" style="margin:0">'); if (i>=0) r.h=r.h.slice(0,i)+line+r.h.slice(i); return r; }; })(seriesSheet);
// ---------- home: up next, pulse, recap link ----------
(function(){ const homeV=VIEWS.home; VIEWS.home=()=>{ let h=homeV(); const a=h.indexOf('<div class="panel" style="margin-bottom:14px">'), b=h.indexOf('<div class="cols">'); const i = a>=0 && a<b ? a : b; if (i<0) return h;
  const rc = UI.recap && UI.recap.t1===G.day ? `<button class="btn sm" data-act="recap">What changed since ${fmtDate(UI.recap.t0)}</button>` : '';
  const top=`<div class="cols" style="margin-bottom:14px"><div class="stack">${upNextPanel()}${rc?`<div>${rc}</div>`:''}</div><div class="stack">${marketPulse(true)}</div></div>`;
  return h.slice(0,i)+top+h.slice(i); }; })();
// the header: "+7" becomes "Skip", which knows what's coming
(function(){ const uh=updateHeader; updateHeader=function(){ uh(); const b=document.querySelector('.adv [data-a="7"]'); if (b){ b.dataset.act='skipsheet'; b.textContent='Skip'; b.title='Skip ahead to the next thing'; } }; })();

function seedTracking(){ if (!G.cm) return; if (!G.cm.ser.some(s=>s.vw)) trackSeries(G.day); }
