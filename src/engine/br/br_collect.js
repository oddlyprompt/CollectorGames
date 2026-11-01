// ===================== XTG: COLLECTING GOALS, WANTLIST AND BINDER TOOLS =====================
// From the owner's three-year playtest: the long game needed ways to define a collection, not just more money.
//  - Goals: optional milestones (an alternate-art pull, one of each faction, a card from every set, the base set...), with progress.
//  - Wantlist: star any print; Home shows where each one is cheapest right now, and the card page can buy it.
//  - Binder tools: mark everything seen, and sell spare duplicates to The Cargo Cage after reviewing exactly what goes.
//  - News says when it touches cards or sealed product you own.
// State: G.brg.goals {id: day completed}, G.brg.want [print keys], G.brg.bl (cards sold to a store). Created on first use.
const brWant=()=>G.brg.want||(G.brg.want=[]);
function brOwnedCopies(){ const by=new Map(); for (const c of myBr()){ const d=brD(c.k); if (d.sealed) continue; const g=by.get(c.k); if (g) g.push(c); else by.set(c.k,[c]); } return by; }
// which card numbers you own at least one print of, and which prints
function brOwnState(){ const prints=new Set(), nos=new Set(); for (const c of myBr()){ const d=brD(c.k); if (d.sealed) continue; prints.add(c.k); nos.add(d.set+'|'+d.no); } return {prints, nos}; }
// ---------- goals ----------
// each: id, title, what it asks, and progress [have, need] measured on the current collection
const BR_GOALS=[
 {id:'prem', t:'A chase pull', d:'Own a premium alternate art (Illustration, Signature or Eclipse Rare) or a foil Legendary.', p:S=>[S.prem>0?1:0,1]},
 {id:'sale', t:'First sale', d:'Sell a Broken Reach card, on the marketplace or to a store.', p:S=>[S.sold>0?1:0,1]},
 {id:'fac', t:'Every faction', d:'Own a card of each of the six factions.', p:S=>[S.fac,6]},
 {id:'type', t:'One of each type', d:'Own a Ship, Character, Crew & Military, Drone & Creature, Tech Unit and Planet.', p:S=>[S.types,6]},
 {id:'crew', t:'The crew', d:'Own a card of each of the six crew: Kaia, Tavi, Dorrak, Elias, Lyssara and Neru.', p:S=>[S.crew,6]},
 {id:'planets', t:'All eight planets', d:'Own every planet card.', p:S=>[S.planets,8]},
 {id:'gem', t:'Gem Mint', d:'Own a GCS 10.', p:S=>[S.gem>0?1:0,1]},
 {id:'hold', t:'Patient collector', d:'Keep a sealed booster box for a full year.', p:S=>[Math.min(365,S.held),365]},
 {id:'base', t:'The base set', d:'Own every one of the 180 base cards (any print).', p:S=>[S.base[0],Math.max(1,S.base[1])]},
 {id:'altall', t:'Every premium art', d:'Own all 27 premium alternate arts.', p:S=>[S.premAll[0],Math.max(1,S.premAll[1])]},
 {id:'master', t:'The master set', d:'Own every print of Set 01: regular, foil and premium art.', p:S=>[S.master[0],Math.max(1,S.master[1])]},
];
function brGoalStats(){
  const own=brOwnState(), mine=myBr(); const S={prem:0, sold:G.brg.bl||0, fac:0, types:0, crew:0, planets:0, gem:0, held:0, base:[0,0], premAll:[0,0], master:[0,0]};
  const facs=new Set(), types=new Set(), crew=new Set();
  for (const n of brReleasedSets(G.day)){ const cs=brSetCards(n);
    for (const c of cs){ const have=own.nos.has(n+'|'+c.no);
      if (have){ facs.add(c.aff); types.add(c.type); if (brIsPrem(c)) S.prem++; if (c.planet && c.pk==='base') S.planets++; for (const x of BR_CREW) if (c.name.startsWith(x) && c.pk==='base') crew.add(x); }
      if (c.pk!=='alt'){ S.base[1]++; if (own.nos.has(n+'|'+c.no)) S.base[0]++; } else { S.premAll[1]++; if (have) S.premAll[0]++; } for (const v of brVariants(c)){ S.master[1]++; if (own.prints.has(brKey(n,c.no,v))) S.master[0]++; } } }
  for (const c of mine){ const d=brD(c.k); if (!d.sealed && d.v==='F' && d.card.rar==='leg') S.prem++; }
  S.fac=facs.size; S.types=types.size; S.crew=crew.size;
  for (const c of mine){ if (c.g===10) S.gem++; const d=brD(c.k); if (d.sealed && d.v==='B' && c.a && c.a[0]!=null) S.held=Math.max(S.held, G.day-c.a[0]); }
  for (const id in G.brc){ const c=G.brc[id]; if (c.o!==0 && (c.h||[]).some(h=>typeof h[1]==='string' && h[1].startsWith('Sold'))) { S.sold++; break; } }
  return S; }
function brGoalCheck(quiet){ if (!G.brg || !brReleasedSets(G.day).length) return; const done=G.brg.goals||(G.brg.goals={}); if (quiet!==true && BR_GOALS.every(g=>done[g.id])) return; const S=brGoalStats(); const fresh=[];
  for (const g of BR_GOALS){ if (done[g.id]) continue; const [h,n]=g.p(S); if (h>=n){ done[g.id]=G.day; fresh.push(g); } }
  if (!quiet && fresh.length && G.live!==false){ const g=fresh[fresh.length-1]; if (typeof celebrate==='function') celebrate('Goal complete', g.t); for (const x of fresh) brNews('GOAL: '+x.t.toUpperCase(), x.d+' Done on '+fmtDate(G.day,true)+'.', {}); }
  return S; }
function brGoalsPanel(){ const S=brGoalCheck(true)||brGoalStats(); const done=G.brg.goals||{}; const n=BR_GOALS.filter(g=>done[g.id]).length;
  const open=BR_GOALS.filter(g=>!done[g.id]).slice(0,4), fin=BR_GOALS.filter(g=>done[g.id]);
  const row=g=>{ const [h,need]=g.p(S); const pct=Math.round(Math.min(1,h/need)*100); return `<div class="row" style="cursor:default"><div class="rt"><b>${esc(g.t)}</b><span>${esc(g.d)}</span><div class="bar" style="margin-top:4px;max-width:240px"><i style="width:${pct}%;background:#2f9e5b"></i></div></div><div class="rv"><b>${g.id==='hold'? Math.floor(h)+' / 365 days' : h+' / '+need}</b></div></div>`; };
  return `<div class="panel"><h3>Collection goals</h3><p class="small muted" style="margin:0 0 6px">Optional milestones. ${n} of ${BR_GOALS.length} done.</p><div class="rows">${open.map(row).join('')}</div>${fin.length?`<p class="small" style="margin:8px 0 0">Done: ${fin.map(g=>`<b>${esc(g.t)}</b> <span class="muted">(${fmtDate(done[g.id],true)})</span>`).join(', ')}</p>`:''}</div>`; }
// ---------- wantlist ----------
// where a print can be had right now: the cheapest of Waypoint Singles (near mint), The Cargo Cage's case and marketplace listings
function brWhere(k){ const out=[]; const s=brKvStock(G.day); if (s[k]>0) out.push({w:'Waypoint Singles', p:brKvPrice(k), act:'bkvbuy', a:k, note:'near mint'});
  const L=brLgs(); for (const x of L.cs) if (x.k===k) out.push({w:'The Cargo Cage', p:brLgsPrice(x), act:'blgssingle', a:x.id, note:COND_LABN[condLabel(x.c)]});
  for (const l of G.lst) if (l.it==='b' && l.sel!==0 && l.ty==='bin' && G.brc[l.ref] && G.brc[l.ref].k===k) out.push({w:'Marketplace', p:l.pr, act:'buy', a:l.id, note:G.brc[l.ref].g>0?'GCS '+G.brc[l.ref].g:COND_LABN[condLabel(G.brc[l.ref].c)]});
  return out.sort((a,b)=>a.p-b.p); }
function brWantPanel(){ const W=brWant(); if (!W.length) return ''; const own=brOwnState();
  return `<div class="panel"><h3>Your wantlist</h3><div class="rows">${W.map(k=>{ const d=brD(k), wh=brWhere(k), b=wh[0], got=own.prints.has(k);
    return `<div class="row" style="cursor:default"><button class="mini" style="background:none;border:0;padding:0;width:40px" data-act="brdesign" data-a="${esc(k)}">${bMiniTKey(k)}</button><div class="rt"><b>${esc(d.title)}</b><span>${brRV(d)}${got?' · <span class="up">you have one</span>':''}</span><span class="muted">${b? `cheapest: ${b.w}, ${money(b.p,true)} (${b.note})` : 'nobody has one for sale right now'}</span></div>${b?`<button class="btn sm" data-act="${b.act}" data-a="${esc(String(b.a))}" ${G.player.cash<b.p?'disabled':''}>Buy</button>`:''}</div>`; }).join('')}</div></div>`; }
ACT.brwant=a=>{ const W=brWant(); const i=W.indexOf(a); if (i>=0){ W.splice(i,1); showToast('Removed from your wantlist.'); } else { W.push(a); showToast('On your wantlist. Home shows where it is cheapest.', true); } refreshSheet(); render(true); queueSave(); };
// the card page: want it, and every place you can buy it right now
(function(){ const ds=brDesignSheet; brDesignSheet=function(key){ const r=ds(key); const d=brD(key); if (!r || d.sealed) return r; const on=brWant().includes(key); const wh=brWhere(key);
  const p=`<div class="panel"><h3>Get a copy</h3><div class="formrow" style="margin-bottom:6px"><button class="btn sm ${on?'':'pri'}" data-act="brwant" data-a="${esc(key)}">${on?'★ On your wantlist':'☆ Add to wantlist'}</button><button class="btn sm" data-act="pinkey" data-a="${esc(key)}">${(G.player.ui&&G.player.ui.pins||[]).includes(key)?'📌 Pinned to Home':'📌 Pin to Home'}</button></div><div class="rows">${wh.slice(0,6).map(x=>`<div class="row" style="cursor:default"><div class="rt"><b>${esc(x.w)}</b><span>${esc(x.note)}</span></div><div style="display:flex;align-items:center;gap:8px"><b>${money(x.p,true)}</b><button class="btn sm" data-act="${x.act}" data-a="${esc(String(x.a))}" ${G.player.cash<x.p?'disabled':''}>Buy</button></div></div>`).join('')||'<div class="empty">Nobody has one for sale right now. Waypoint Singles restocks on Mondays, The Cargo Cage\'s case on Thursdays.</div>'}</div></div>`;
  r.h=r.h.replace('<div class="panel"><h3>In play</h3>', p+'<div class="panel"><h3>In play</h3>'); return r; }; })();
// ---------- the set checklist: missing and wanted ----------
(function(){ const ss=brSetSheet; brSetSheet=function(n){ const r=ss(n); if (!r) return r; const f=UI.brf; const own=brOwnState(); const cs=brSetCards(n); const miss=cs.filter(c=>!own.nos.has(n+'|'+c.no)).length;
  const chips=`<button class="chip ${f==='miss'?'on':''}" data-act="brf" data-a="miss">Missing (${miss})</button><button class="chip ${f==='want'?'on':''}" data-act="brf" data-a="want">Wantlist (${brWant().length})</button>`;
  r.h=r.h.replace('<div class="chips">','<p class="small muted" style="margin:0">Two ways to count: '+cs.filter(c=>!brAlt(c)).length+' cards, or '+brAllKeys(n).length+' prints once each foil and alternate art counts separately.</p><div class="chips">'+chips);
  return r; }; })();
// ---------- binder tools ----------
function brDupes(){ const out=[]; for (const [k,cs] of brOwnedCopies()){ const raw=cs.filter(c=>c.g===0&&!c.l).sort((a,b)=>brCopyValue(b)-brCopyValue(a)); const keep=cs.length-raw.length>0? 0 : 1; for (const c of raw.slice(keep)){ const p=brLgsOffer(c); if (p>=0.25) out.push({c,p}); } } return out.sort((a,b)=>b.p-a.p); }
function brDupesSheet(){ const D=brDupes(); const tot=D.reduce((s,x)=>s+x.p,0);
  return { t:'Sell duplicates', h:`<div class="stack"><div class="panel"><p class="small" style="margin:0 0 8px">For every card you own more than once, this keeps your best copy (or your slab) and offers the spares to The Cargo Cage's buylist at ${Math.round(BLGS_BUY*100)}% of market. Cards worth less than about 45 cents stay in your binder. Listed and graded cards are never included.</p><div class="kpis"><div class="kpi"><small>Spare copies</small><b>${D.length}</b></div><div class="kpi"><small>The store pays</small><b>${money(tot,true)}</b></div></div>
    <div class="rows">${D.slice(0,40).map(x=>`<div class="row" style="cursor:default">${bMiniT(x.c)}<div class="rt"><b>${esc(brD(x.c.k).title)}</b><span>${brRV(brD(x.c.k))} · ${COND_LABN[condLabel(x.c.c)]}</span></div><div class="rv"><b>${money(x.p,true)}</b></div></div>`).join('')||'<div class="empty">No spare copies worth selling.</div>'}${D.length>40?`<p class="small muted">…and ${D.length-40} more.</p>`:''}</div>
    ${D.length?`<div class="formrow"><button class="btn pri" data-act="brdupesell" data-confirm="Sell ${D.length} for ${money(tot,true)}">Sell all ${D.length} for ${money(tot,true)}</button></div>`:''}</div></div>` }; }
ACT.brdupes=()=>openSheet(brDupesSheet);
ACT.brdupesell=(a,el)=>{ if (!armed(el)) return; let n=0, cash=0; for (const x of brDupes()){ const c0=G.player.cash; if (!brLgsSellTo(x.c.id)){ n++; cash+=G.player.cash-c0; } } closeSheet(); showToast(`Sold ${n} spare cards to The Cargo Cage for ${money(cash,true)}.`, true); render(true); queueSave(); };
ACT.brseen=()=>{ let n=0; for (const c of myBr()) if (c.nw){ delete c.nw; n++; } showToast(n? `Marked ${n} card${n>1?'s':''} as seen.` : 'Nothing new.'); render(true); queueSave(); };
(function(){ const cv=brCollV; brCollV=function(){ const nNew=myBr().filter(c=>c.nw).length, nD=brDupes().length;
  return `<div class="formrow" style="margin-bottom:8px">${nNew?`<button class="btn sm" data-act="brseen">Mark all ${nNew} as seen</button>`:''}${nD?`<button class="btn sm" data-act="brdupes">Sell duplicates (${nD})</button>`:''}<button class="btn sm" data-act="brset" data-a="1">Set checklist</button></div>`+cv(); }; })();
// ---------- news that touches your collection ----------
function brNewsMine(n){ if (!G.brg) return ''; const bits=[];
  if (n.brid!=null){ const k=myBr().filter(c=>{ const d=brD(c.k); return !d.sealed && d.card.cid===n.brid; }).length; if (k) bits.push(`You own ${k} cop${k>1?'ies':'y'} of this card.`); }
  if (n.ts!=null){ const s=myBr().filter(c=>{ const d=brD(c.k); return d.sealed && d.set===n.ts && !c.l; }); if (s.length) bits.push(`You hold ${s.length} sealed ${brSetDef(n.ts).name} item${s.length>1?'s':''}, worth about ${money(s.reduce((a,c)=>a+brCopyValue(c),0),true)}.`); }
  return (bits.length? `<p class="small up" style="margin:2px 0 0">${bits.join(' ')}</p>` : '')+newsActionHTML(n,{tab:'br',design:'brdesign'},n=>{ if (n.brid==null) return null; const c=brCardByCid(n.brid); return c? brKey(c.set,c.no,'N') : null; }); }
// ---------- Home: goals and wantlist next to the collection ----------
(function(){ const hp=brHomePanels; brHomePanels=function(){ const P=hp(); P.goals=brGoalsPanel(); P.want=brWantPanel(); P.coll=P.coll+P.goals+P.want;
  P.news=`<div class="panel"><h3>Broken Reach news</h3>${G.news.filter(n=>n.k==='brg').slice(0,5).map(n=>`<div class="newsrow"><b>${esc(n.h)}</b><p>${esc(n.b)}</p>${brNewsMine(n)}<div class="meta">${fmtDate(n.t)}</div></div>`).join('')||'<div class="empty">Quiet.</div>'}</div>`; return P; }; })();
// goals are checked once a day and after anything that changes the collection
(function(){ const d=brDay; brDay=function(t){ d(t); try { if (G.brg && !G._xtCatch) brGoalCheck(); } catch(e){ console.error(e); } }; })();
(function(){ const r=render; render=function(){ const out=r.apply(this,arguments); try { if (G && G.brg && G.player && !UI.busy) brGoalCheck(); } catch(e){ console.error(e); } return out; }; })();

function brOpenProgress(res, all){ return openProgressHTML(all,{D:brD, mine:myBr, own:brOwnState, cards:brSetCards, want:brWant(), notable:d=>brIsPrem(d.card)||brFoilish(d.v), goals:res.goals}); }
