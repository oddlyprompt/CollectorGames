// ===================== TCG: COLLECTING GOALS, WANTLIST AND BINDER TOOLS =====================
// From the owner's three-year playtest: the long game needed ways to define a collection, not just more money.
//  - Goals: optional milestones (a premium pull, a whole evolution family, one of each affinity, the base set...), with progress.
//  - Wantlist: star any print; Home shows where each one is cheapest right now, and the card page can buy it.
//  - Binder tools: mark everything seen, and sell spare duplicates to The Tidepool after reviewing exactly what goes.
//  - News says when it touches cards or sealed product you own.
// State: G.tcg.goals {id: day completed}, G.tcg.want [print keys], G.tcg.bl (cards sold to a store). Created on first use.
const tcWant=()=>G.tcg.want||(G.tcg.want=[]);
function tcOwnedCopies(){ const by=new Map(); for (const c of myTc()){ const d=tcD(c.k); if (d.sealed) continue; const g=by.get(c.k); if (g) g.push(c); else by.set(c.k,[c]); } return by; }
// which card numbers you own at least one print of, and which prints
function tcOwnState(){ const prints=new Set(), nos=new Set(); for (const c of myTc()){ const d=tcD(c.k); if (d.sealed) continue; prints.add(c.k); nos.add(d.set+'|'+d.no); } return {prints, nos}; }
// ---------- goals ----------
// each: id, title, what it asks, and progress [have, need] measured on the current collection
const TC_GOALS=[
 {id:'prem', t:'A premium pull', d:'Own an Illustration rare or better.', p:S=>[S.prem>0?1:0,1]},
 {id:'sale', t:'First sale', d:'Sell a Wildkin card, on the marketplace or to a store.', p:S=>[S.sold>0?1:0,1]},
 {id:'aff', t:'Every affinity', d:'Own a Wildkin of each of the nine affinities.', p:S=>[S.aff,9]},
 {id:'fam', t:'A whole family', d:'Own every member of one evolution family of three or more.', p:S=>[S.famBest[0],Math.max(1,S.famBest[1])]},
 {id:'gem', t:'Gem Mint', d:'Own a GCS 10.', p:S=>[S.gem>0?1:0,1]},
 {id:'hold', t:'Patient collector', d:'Keep a sealed booster box for a full year.', p:S=>[Math.min(365,S.held),365]},
 {id:'base', t:'The base set', d:'Own every base card of every set that is out (any print, holo or not).', p:S=>[S.base[0],S.base[1]]},
 {id:'premall', t:'Every premium card', d:'Own all the premium cards of every set that is out: illustration, full art, special and clasped.', p:S=>[S.premAll[0],S.premAll[1]]},
 {id:'master', t:'Master set', d:'Own every print of every set that is out, including each holo and reverse holo.', p:S=>[S.master[0],S.master[1]]},
];
function tcGoalStats(){
  const own=tcOwnState(), mine=myTc(); const S={prem:0, sold:G.tcg.bl||0, aff:0, famBest:[0,1], gem:0, held:0, base:[0,0], premAll:[0,0], master:[0,0]};
  const els=new Set(), fam=new Map();
  for (const n of tcReleasedSets(G.day)){ const cs=tcSetCards(n), base=tcSetDef(n).base;
    for (const c of cs){ const have=own.nos.has(n+'|'+c.no);
      if (c.no<=base && c.kind!=='essence'){ S.base[1]++; if (have) S.base[0]++; }
      if (tcIsPrem(c)){ S.premAll[1]++; if (have){ S.premAll[0]++; S.prem++; } }
      if (c.kind==='creature' && !tcAlt(c)){ if (have) els.add(c.el); if (c.fam){ const f=fam.get(c.fam)||[0,0]; f[1]++; if (have) f[0]++; fam.set(c.fam,f); } }
      for (const v of tcVariants(c)){ if (c.kind==='essence') continue; S.master[1]++; if (own.prints.has(tcKey(n,c.no,v))) S.master[0]++; } } }
  S.aff=els.size; for (const f of fam.values()) if (f[1]>2 && (f[0]/f[1]>S.famBest[0]/S.famBest[1] || (f[0]===f[1] && f[1]>S.famBest[1]))) S.famBest=f;
  for (const c of mine){ if (c.g===10) S.gem++; const d=tcD(c.k); if (d.sealed && d.v==='B' && c.a && c.a[0]!=null) S.held=Math.max(S.held, G.day-c.a[0]); }
  for (const id in G.tc){ const c=G.tc[id]; if (c.o!==0 && (c.h||[]).some(h=>typeof h[1]==='string' && h[1].startsWith('Sold'))) { S.sold++; break; } }
  return S; }
function tcGoalCheck(quiet){ if (!G.tcg || !tcReleasedSets(G.day).length) return; const done=G.tcg.goals||(G.tcg.goals={}); if (quiet!==true && TC_GOALS.every(g=>done[g.id])) return; const S=tcGoalStats(); const fresh=[];
  for (const g of TC_GOALS){ if (done[g.id]) continue; const [h,n]=g.p(S); if (h>=n){ done[g.id]=G.day; fresh.push(g); } }
  if (!quiet && fresh.length && G.live!==false){ const g=fresh[fresh.length-1]; if (typeof celebrate==='function') celebrate('Goal complete', g.t); for (const x of fresh) tcNews('GOAL: '+x.t.toUpperCase(), x.d+' Done on '+fmtDate(G.day,true)+'.', {}); }
  return S; }
function tcGoalsPanel(){ const S=tcGoalCheck(true)||tcGoalStats(); const done=G.tcg.goals||{}; const n=TC_GOALS.filter(g=>done[g.id]).length;
  const open=TC_GOALS.filter(g=>!done[g.id]).slice(0,4), fin=TC_GOALS.filter(g=>done[g.id]);
  const row=g=>{ const [h,need]=g.p(S); const pct=Math.round(Math.min(1,h/need)*100); return `<div class="row" style="cursor:default"><div class="rt"><b>${esc(g.t)}</b><span>${esc(g.d)}</span><div class="bar" style="margin-top:4px;max-width:240px"><i style="width:${pct}%;background:#2f9e5b"></i></div></div><div class="rv"><b>${g.id==='hold'? Math.floor(h)+' / 365 days' : h+' / '+need}</b></div></div>`; };
  return `<div class="panel"><h3>Collection goals</h3><p class="small muted" style="margin:0 0 6px">Optional milestones. ${n} of ${TC_GOALS.length} done.</p><div class="rows">${open.map(row).join('')}</div>${fin.length?`<p class="small" style="margin:8px 0 0">Done: ${fin.map(g=>`<b>${esc(g.t)}</b> <span class="muted">(${fmtDate(done[g.id],true)})</span>`).join(', ')}</p>`:''}</div>`; }
// ---------- wantlist ----------
// where a print can be had right now: the cheapest of Kinvault (near mint), The Tidepool's case and marketplace listings
function tcWhere(k){ const out=[]; const s=tcKvStock(G.day); if (s[k]>0) out.push({w:'Kinvault', p:tcKvPrice(k), act:'kvbuy', a:k, note:'near mint'});
  const L=tcLgs(); for (const x of L.cs) if (x.k===k) out.push({w:'The Tidepool', p:tcLgsPrice(x), act:'lgssingle', a:x.id, note:TC_LABN[tcLabel(x.c)]});
  for (const l of G.lst) if (l.it==='t' && l.sel!==0 && l.ty==='bin' && G.tc[l.ref] && G.tc[l.ref].k===k) out.push({w:'Marketplace', p:l.pr, act:'buy', a:l.id, note:G.tc[l.ref].g>0?'GCS '+G.tc[l.ref].g:TC_LABN[tcLabel(G.tc[l.ref].c)]});
  return out.sort((a,b)=>a.p-b.p); }
function tcWantPanel(){ const W=tcWant(); if (!W.length) return ''; const own=tcOwnState();
  return `<div class="panel"><h3>Your wantlist</h3><div class="rows">${W.map(k=>{ const d=tcD(k), wh=tcWhere(k), b=wh[0], got=own.prints.has(k);
    return `<div class="row" style="cursor:default"><button class="mini" style="background:none;border:0;padding:0;width:40px" data-act="tdesign" data-a="${esc(k)}">${miniTKey(k)}</button><div class="rt"><b>${esc(d.title)}</b><span>${tcRV(d)}${got?' · <span class="up">you have one</span>':''}</span><span class="muted">${b? `cheapest: ${b.w}, ${money(b.p,true)} (${b.note})` : 'nobody has one for sale right now'}</span></div>${b?`<button class="btn sm" data-act="${b.act}" data-a="${esc(String(b.a))}" ${G.player.cash<b.p?'disabled':''}>Buy</button>`:''}</div>`; }).join('')}</div></div>`; }
ACT.twant=a=>{ const W=tcWant(); const i=W.indexOf(a); if (i>=0){ W.splice(i,1); showToast('Removed from your wantlist.'); } else { W.push(a); showToast('On your wantlist. Home shows where it is cheapest.', true); } refreshSheet(); render(true); queueSave(); };
// the card page: want it, and every place you can buy it right now
(function(){ const ds=tcDesignSheet; tcDesignSheet=function(key){ const r=ds(key); const d=tcD(key); if (!r || d.sealed) return r; const on=tcWant().includes(key); const wh=tcWhere(key);
  const p=`<div class="panel"><h3>Get a copy</h3><div class="formrow" style="margin-bottom:6px"><button class="btn sm ${on?'':'pri'}" data-act="twant" data-a="${esc(key)}">${on?'★ On your wantlist':'☆ Add to wantlist'}</button></div><div class="rows">${wh.slice(0,6).map(x=>`<div class="row" style="cursor:default"><div class="rt"><b>${esc(x.w)}</b><span>${esc(x.note)}</span></div><div style="display:flex;align-items:center;gap:8px"><b>${money(x.p,true)}</b><button class="btn sm" data-act="${x.act}" data-a="${esc(String(x.a))}" ${G.player.cash<x.p?'disabled':''}>Buy</button></div></div>`).join('')||'<div class="empty">Nobody has one for sale right now. Kinvault restocks on Mondays, The Tidepool\'s case on Thursdays.</div>'}</div></div>`;
  r.h=r.h.replace('<div class="panel"><h3>In tournaments</h3>', p+'<div class="panel"><h3>In tournaments</h3>'); return r; }; })();
// ---------- the set checklist: missing and wanted ----------
(function(){ const ss=tcSetSheet; tcSetSheet=function(n){ const r=ss(n); if (!r) return r; const f=UI.tcf; const own=tcOwnState(); const cs=tcSetCards(n); const miss=cs.filter(c=>c.kind!=='essence'&&!own.nos.has(n+'|'+c.no)).length;
  const chips=`<button class="chip ${f==='miss'?'on':''}" data-act="tcf" data-a="miss">Missing (${miss})</button><button class="chip ${f==='want'?'on':''}" data-act="tcf" data-a="want">Wantlist (${tcWant().length})</button>`;
  r.h=r.h.replace('<div class="chips">','<p class="small muted" style="margin:0">Two ways to count: '+cs.length+' different cards, or '+tcAllKeys(n).length+' prints once each holo, reverse holo and premium version counts separately. The goals on Home track both.</p><div class="chips">'+chips);
  return r; }; })();
// ---------- binder tools ----------
function tcDupes(){ const out=[]; for (const [k,cs] of tcOwnedCopies()){ const raw=cs.filter(c=>c.g===0&&!c.l).sort((a,b)=>tcCopyValue(b)-tcCopyValue(a)); const keep=cs.length-raw.length>0? 0 : 1; for (const c of raw.slice(keep)){ const p=tcLgsOffer(c); if (p>=0.25) out.push({c,p}); } } return out.sort((a,b)=>b.p-a.p); }
function tcDupesSheet(){ const D=tcDupes(); const tot=D.reduce((s,x)=>s+x.p,0);
  return { t:'Sell duplicates', h:`<div class="stack"><div class="panel"><p class="small" style="margin:0 0 8px">For every card you own more than once, this keeps your best copy (or your slab) and offers the spares to The Tidepool's buylist at ${Math.round(LGS_BUY*100)}% of market. Cards worth less than about 45 cents stay in your binder. Listed and graded cards are never included.</p><div class="kpis"><div class="kpi"><small>Spare copies</small><b>${D.length}</b></div><div class="kpi"><small>The store pays</small><b>${money(tot,true)}</b></div></div>
    <div class="rows">${D.slice(0,40).map(x=>`<div class="row" style="cursor:default">${miniT(x.c)}<div class="rt"><b>${esc(tcD(x.c.k).title)}</b><span>${tcRV(tcD(x.c.k))} · ${TC_LABN[tcLabel(x.c.c)]}</span></div><div class="rv"><b>${money(x.p,true)}</b></div></div>`).join('')||'<div class="empty">No spare copies worth selling.</div>'}${D.length>40?`<p class="small muted">…and ${D.length-40} more.</p>`:''}</div>
    ${D.length?`<div class="formrow"><button class="btn pri" data-act="tdupesell" data-confirm="Sell ${D.length} for ${money(tot,true)}">Sell all ${D.length} for ${money(tot,true)}</button></div>`:''}</div></div>` }; }
ACT.tdupes=()=>openSheet(tcDupesSheet);
ACT.tdupesell=(a,el)=>{ if (!armed(el)) return; let n=0, cash=0; for (const x of tcDupes()){ const c0=G.player.cash; if (!tcLgsSellTo(x.c.id)){ n++; cash+=G.player.cash-c0; } } closeSheet(); showToast(`Sold ${n} spare cards to The Tidepool for ${money(cash,true)}.`, true); render(true); queueSave(); };
ACT.tseen=()=>{ let n=0; for (const c of myTc()) if (c.nw){ delete c.nw; n++; } showToast(n? `Marked ${n} card${n>1?'s':''} as seen.` : 'Nothing new.'); render(true); queueSave(); };
(function(){ const cv=tcCollV; tcCollV=function(){ const nNew=myTc().filter(c=>c.nw).length, nD=tcDupes().length;
  return `<div class="formrow" style="margin-bottom:8px">${nNew?`<button class="btn sm" data-act="tseen">Mark all ${nNew} as seen</button>`:''}${nD?`<button class="btn sm" data-act="tdupes">Sell duplicates (${nD})</button>`:''}<button class="btn sm" data-act="tset" data-a="1">Set checklist</button></div>`+cv(); }; })();
// ---------- news that touches your collection ----------
function tcNewsMine(n){ if (!G.tcg) return ''; const bits=[];
  if (n.tcid!=null){ const k=myTc().filter(c=>{ const d=tcD(c.k); return !d.sealed && d.card.cid===n.tcid; }).length; if (k) bits.push(`You own ${k} cop${k>1?'ies':'y'} of this card.`); }
  if (n.ts!=null){ const s=myTc().filter(c=>{ const d=tcD(c.k); return d.sealed && d.set===n.ts && !c.l; }); if (s.length) bits.push(`You hold ${s.length} sealed ${tcSetDef(n.ts).name} item${s.length>1?'s':''}, worth about ${money(s.reduce((a,c)=>a+tcCopyValue(c),0),true)}.`); }
  return bits.length? `<p class="small up" style="margin:2px 0 0">${bits.join(' ')}</p>` : ''; }
// ---------- Home: goals and wantlist next to the collection ----------
(function(){ const hp=tcHomePanels; tcHomePanels=function(){ const P=hp(); P.goals=tcGoalsPanel(); P.want=tcWantPanel(); P.coll=P.coll+P.goals+P.want;
  P.news=`<div class="panel"><h3>Wildkin news</h3>${G.news.filter(n=>n.k==='tcg').slice(0,5).map(n=>`<div class="newsrow"><b>${esc(n.h)}</b><p>${esc(n.b)}</p>${tcNewsMine(n)}<div class="meta">${fmtDate(n.t)}</div></div>`).join('')||'<div class="empty">Quiet.</div>'}</div>`; return P; }; })();
// goals are checked once a day and after anything that changes the collection
(function(){ const d=tcDay; tcDay=function(t){ d(t); try { if (G.tcg && !G._tcCatch) tcGoalCheck(); } catch(e){ console.error(e); } }; })();
(function(){ const r=render; render=function(){ const out=r.apply(this,arguments); try { if (G && G.tcg && G.player && !UI.busy) tcGoalCheck(); } catch(e){ console.error(e); } return out; }; })();
