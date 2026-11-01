// ===================== XTG: COLLECTING GOALS, WANTLIST AND BINDER TOOLS =====================
// From the owner's three-year playtest: the long game needed ways to define a collection, not just more money.
//  - Goals: optional milestones (an alternate-art pull, one of each faction, a card from every set, the base set...), with progress.
//  - Wantlist: star any print; Home shows where each one is cheapest right now, and the card page can buy it.
//  - Binder tools: mark everything seen, and sell spare duplicates to The Lantern Room after reviewing exactly what goes.
//  - News says when it touches cards or sealed product you own.
// State: G.xtg.goals {id: day completed}, G.xtg.want [print keys], G.xtg.bl (cards sold to a store). Created on first use.
const xtWant=()=>G.xtg.want||(G.xtg.want=[]);
function xtOwnedCopies(){ const by=new Map(); for (const c of myXt()){ const d=xtD(c.k); if (d.sealed) continue; const g=by.get(c.k); if (g) g.push(c); else by.set(c.k,[c]); } return by; }
// which card numbers you own at least one print of, and which prints
function xtOwnState(){ const prints=new Set(), nos=new Set(); for (const c of myXt()){ const d=xtD(c.k); if (d.sealed) continue; prints.add(c.k); nos.add(d.set+'|'+d.no); } return {prints, nos}; }
// ---------- goals ----------
// each: id, title, what it asks, and progress [have, need] measured on the current collection
const XT_GOALS=[
 {id:'prem', t:'A chase pull', d:'Own an anniversary alternate-art card or a foil Legendary.', p:S=>[S.prem>0?1:0,1]},
 {id:'sale', t:'First sale', d:'Sell a Tidemark card, on the marketplace or to a store.', p:S=>[S.sold>0?1:0,1]},
 {id:'fac', t:'Every faction', d:'Own a card of each of the seven factions and a Neutral card.', p:S=>[S.fac,8]},
 {id:'type', t:'One of each type', d:'Own a Unit, Spell, Relic, Vessel, Stronghold, Domain and Enchantment.', p:S=>[S.types,7]},
 {id:'gem', t:'Gem Mint', d:'Own a GCS 10.', p:S=>[S.gem>0?1:0,1]},
 {id:'hold', t:'Patient collector', d:'Keep a sealed booster box for a full year.', p:S=>[Math.min(365,S.held),365]},
 {id:'reserve', t:'The reserve list', d:'Own a reserve-list card: a Founding-era card that will never be reprinted.', p:S=>[S.reserve>0?1:0,1]},
 {id:'history', t:'A card from every era', d:'Own a card from each of the 31 sets, 2016 to 2026.', p:S=>[S.sets,TM_SETS.length]},
 {id:'base', t:'The anniversary base set', d:'Own every one of the 220 cards of Tenth Tide (any print).', p:S=>[S.base[0],Math.max(1,S.base[1])]},
 {id:'altall', t:'Every alternate art', d:'Own all ten anniversary alternate-art cards.', p:S=>[S.premAll[0],Math.max(1,S.premAll[1])]},
 {id:'master', t:'Tenth Tide master set', d:'Own every print of Tenth Tide, regular, foil and alternate art.', p:S=>[S.master[0],Math.max(1,S.master[1])]},
];
function xtGoalStats(){
  const own=xtOwnState(), mine=myXt(); const S={prem:0, sold:G.xtg.bl||0, fac:0, types:0, sets:0, reserve:0, gem:0, held:0, base:[0,0], premAll:[0,0], master:[0,0]};
  const facs=new Set(), types=new Set(), sets=new Set();
  for (const n of xtReleasedSets(G.day)){ const cs=xtSetCards(n); const tt=n===TM_TT;
    for (const c of cs){ const have=own.nos.has(n+'|'+c.no);
      if (have){ sets.add(n); facs.add(c.f); types.add(c.kind); if (c.res) S.reserve++; if (xtIsPrem(c)) S.prem++; }
      if (tt){ if (c.pk!=='alt'){ S.base[1]++; if (have) S.base[0]++; } else { S.premAll[1]++; if (have) S.premAll[0]++; } for (const v of xtVariants(c)){ S.master[1]++; if (own.prints.has(xtKey(n,c.no,v))) S.master[0]++; } } } }
  for (const c of mine){ const d=xtD(c.k); if (!d.sealed && xtFoilish(d.v) && d.card.rar==='leg') S.prem++; }
  S.fac=facs.size; S.types=types.size; S.sets=sets.size;
  for (const c of mine){ if (c.g===10) S.gem++; const d=xtD(c.k); if (d.sealed && d.v==='B' && c.a && c.a[0]!=null) S.held=Math.max(S.held, G.day-c.a[0]); }
  for (const id in G.xtc){ const c=G.xtc[id]; if (c.o!==0 && (c.h||[]).some(h=>typeof h[1]==='string' && h[1].startsWith('Sold'))) { S.sold++; break; } }
  return S; }
function xtGoalCheck(quiet){ if (!G.xtg || !xtReleasedSets(G.day).length) return; const done=G.xtg.goals||(G.xtg.goals={}); if (quiet!==true && XT_GOALS.every(g=>done[g.id])) return; const S=xtGoalStats(); const fresh=[];
  for (const g of XT_GOALS){ if (done[g.id]) continue; const [h,n]=g.p(S); if (h>=n){ done[g.id]=G.day; fresh.push(g); } }
  if (!quiet && fresh.length && G.live!==false){ const g=fresh[fresh.length-1]; if (typeof celebrate==='function') celebrate('Goal complete', g.t); for (const x of fresh) xtNews('GOAL: '+x.t.toUpperCase(), x.d+' Done on '+fmtDate(G.day,true)+'.', {}); }
  return S; }
function xtGoalsPanel(){ const S=xtGoalCheck(true)||xtGoalStats(); const done=G.xtg.goals||{}; const n=XT_GOALS.filter(g=>done[g.id]).length;
  const open=XT_GOALS.filter(g=>!done[g.id]).slice(0,4), fin=XT_GOALS.filter(g=>done[g.id]);
  const row=g=>{ const [h,need]=g.p(S); const pct=Math.round(Math.min(1,h/need)*100); return `<div class="row" style="cursor:default"><div class="rt"><b>${esc(g.t)}</b><span>${esc(g.d)}</span><div class="bar" style="margin-top:4px;max-width:240px"><i style="width:${pct}%;background:#2f9e5b"></i></div></div><div class="rv"><b>${g.id==='hold'? Math.floor(h)+' / 365 days' : h+' / '+need}</b></div></div>`; };
  return `<div class="panel"><h3>Collection goals</h3><p class="small muted" style="margin:0 0 6px">Optional milestones. ${n} of ${XT_GOALS.length} done.</p><div class="rows">${open.map(row).join('')}</div>${fin.length?`<p class="small" style="margin:8px 0 0">Done: ${fin.map(g=>`<b>${esc(g.t)}</b> <span class="muted">(${fmtDate(done[g.id],true)})</span>`).join(', ')}</p>`:''}</div>`; }
// ---------- wantlist ----------
// where a print can be had right now: the cheapest of Saltmarket (near mint), The Lantern Room's case and marketplace listings
function xtWhere(k){ const out=[]; const s=xtKvStock(G.day); if (s[k]>0) out.push({w:'Saltmarket', p:xtKvPrice(k), act:'xkvbuy', a:k, note:'near mint'});
  const L=xtLgs(); for (const x of L.cs) if (x.k===k) out.push({w:'The Lantern Room', p:xtLgsPrice(x), act:'xlgssingle', a:x.id, note:COND_LABN[condLabel(x.c)]});
  for (const l of G.lst) if (l.it==='x' && l.sel!==0 && l.ty==='bin' && G.xtc[l.ref] && G.xtc[l.ref].k===k) out.push({w:'Marketplace', p:l.pr, act:'buy', a:l.id, note:G.xtc[l.ref].g>0?'GCS '+G.xtc[l.ref].g:COND_LABN[condLabel(G.xtc[l.ref].c)]});
  return out.sort((a,b)=>a.p-b.p); }
function xtWantPanel(){ const W=xtWant(); if (!W.length) return ''; const own=xtOwnState();
  return `<div class="panel"><h3>Your wantlist</h3><div class="rows">${W.map(k=>{ const d=xtD(k), wh=xtWhere(k), b=wh[0], got=own.prints.has(k);
    return `<div class="row" style="cursor:default"><button class="mini" style="background:none;border:0;padding:0;width:40px" data-act="xtdesign" data-a="${esc(k)}">${xMiniTKey(k)}</button><div class="rt"><b>${esc(d.title)}</b><span>${xtRV(d)}${got?' · <span class="up">you have one</span>':''}</span><span class="muted">${b? `cheapest: ${b.w}, ${money(b.p,true)} (${b.note})` : 'nobody has one for sale right now'}</span></div>${b?`<button class="btn sm" data-act="${b.act}" data-a="${esc(String(b.a))}" ${G.player.cash<b.p?'disabled':''}>Buy</button>`:''}</div>`; }).join('')}</div></div>`; }
ACT.xtwant=a=>{ const W=xtWant(); const i=W.indexOf(a); if (i>=0){ W.splice(i,1); showToast('Removed from your wantlist.'); } else { W.push(a); showToast('On your wantlist. Home shows where it is cheapest.', true); } refreshSheet(); render(true); queueSave(); };
// the card page: want it, and every place you can buy it right now
(function(){ const ds=xtDesignSheet; xtDesignSheet=function(key){ const r=ds(key); const d=xtD(key); if (!r || d.sealed) return r; const on=xtWant().includes(key); const wh=xtWhere(key);
  const p=`<div class="panel"><h3>Get a copy</h3><div class="formrow" style="margin-bottom:6px"><button class="btn sm ${on?'':'pri'}" data-act="xtwant" data-a="${esc(key)}">${on?'★ On your wantlist':'☆ Add to wantlist'}</button></div><div class="rows">${wh.slice(0,6).map(x=>`<div class="row" style="cursor:default"><div class="rt"><b>${esc(x.w)}</b><span>${esc(x.note)}</span></div><div style="display:flex;align-items:center;gap:8px"><b>${money(x.p,true)}</b><button class="btn sm" data-act="${x.act}" data-a="${esc(String(x.a))}" ${G.player.cash<x.p?'disabled':''}>Buy</button></div></div>`).join('')||'<div class="empty">Nobody has one for sale right now. Saltmarket restocks on Mondays, The Lantern Room\'s case on Thursdays.</div>'}</div></div>`;
  r.h=r.h.replace('<div class="panel"><h3>In tournaments</h3>', p+'<div class="panel"><h3>In tournaments</h3>'); return r; }; })();
// ---------- the set checklist: missing and wanted ----------
(function(){ const ss=xtSetSheet; xtSetSheet=function(n){ const r=ss(n); if (!r) return r; const f=UI.xtf; const own=xtOwnState(); const cs=xtSetCards(n); const miss=cs.filter(c=>!own.nos.has(n+'|'+c.no)).length;
  const chips=`<button class="chip ${f==='miss'?'on':''}" data-act="xtf" data-a="miss">Missing (${miss})</button><button class="chip ${f==='want'?'on':''}" data-act="xtf" data-a="want">Wantlist (${xtWant().length})</button>`;
  r.h=r.h.replace('<div class="chips">','<p class="small muted" style="margin:0">Two ways to count: '+cs.filter(c=>!xtAlt(c)).length+' cards, or '+xtAllKeys(n).length+' prints once each foil and alternate art counts separately.</p><div class="chips">'+chips);
  return r; }; })();
// ---------- binder tools ----------
function xtDupes(){ const out=[]; for (const [k,cs] of xtOwnedCopies()){ const raw=cs.filter(c=>c.g===0&&!c.l).sort((a,b)=>xtCopyValue(b)-xtCopyValue(a)); const keep=cs.length-raw.length>0? 0 : 1; for (const c of raw.slice(keep)){ const p=xtLgsOffer(c); if (p>=0.25) out.push({c,p}); } } return out.sort((a,b)=>b.p-a.p); }
function xtDupesSheet(){ const D=xtDupes(); const tot=D.reduce((s,x)=>s+x.p,0);
  return { t:'Sell duplicates', h:`<div class="stack"><div class="panel"><p class="small" style="margin:0 0 8px">For every card you own more than once, this keeps your best copy (or your slab) and offers the spares to The Lantern Room's buylist at ${Math.round(XLGS_BUY*100)}% of market. Cards worth less than about 45 cents stay in your binder. Listed and graded cards are never included.</p><div class="kpis"><div class="kpi"><small>Spare copies</small><b>${D.length}</b></div><div class="kpi"><small>The store pays</small><b>${money(tot,true)}</b></div></div>
    <div class="rows">${D.slice(0,40).map(x=>`<div class="row" style="cursor:default">${xMiniT(x.c)}<div class="rt"><b>${esc(xtD(x.c.k).title)}</b><span>${xtRV(xtD(x.c.k))} · ${COND_LABN[condLabel(x.c.c)]}</span></div><div class="rv"><b>${money(x.p,true)}</b></div></div>`).join('')||'<div class="empty">No spare copies worth selling.</div>'}${D.length>40?`<p class="small muted">…and ${D.length-40} more.</p>`:''}</div>
    ${D.length?`<div class="formrow"><button class="btn pri" data-act="xtdupesell" data-confirm="Sell ${D.length} for ${money(tot,true)}">Sell all ${D.length} for ${money(tot,true)}</button></div>`:''}</div></div>` }; }
ACT.xtdupes=()=>openSheet(xtDupesSheet);
ACT.xtdupesell=(a,el)=>{ if (!armed(el)) return; let n=0, cash=0; for (const x of xtDupes()){ const c0=G.player.cash; if (!xtLgsSellTo(x.c.id)){ n++; cash+=G.player.cash-c0; } } closeSheet(); showToast(`Sold ${n} spare cards to The Lantern Room for ${money(cash,true)}.`, true); render(true); queueSave(); };
ACT.xtseen=()=>{ let n=0; for (const c of myXt()) if (c.nw){ delete c.nw; n++; } showToast(n? `Marked ${n} card${n>1?'s':''} as seen.` : 'Nothing new.'); render(true); queueSave(); };
(function(){ const cv=xtCollV; xtCollV=function(){ const nNew=myXt().filter(c=>c.nw).length, nD=xtDupes().length;
  return `<div class="formrow" style="margin-bottom:8px">${nNew?`<button class="btn sm" data-act="xtseen">Mark all ${nNew} as seen</button>`:''}${nD?`<button class="btn sm" data-act="xtdupes">Sell duplicates (${nD})</button>`:''}<button class="btn sm" data-act="xtset" data-a="${TM_TT}">Tenth Tide checklist</button></div>`+cv(); }; })();
// ---------- news that touches your collection ----------
function xtNewsMine(n){ if (!G.xtg) return ''; const bits=[];
  if (n.xtid!=null){ const k=myXt().filter(c=>{ const d=xtD(c.k); return !d.sealed && d.card.cid===n.xtid; }).length; if (k) bits.push(`You own ${k} cop${k>1?'ies':'y'} of this card.`); }
  if (n.ts!=null){ const s=myXt().filter(c=>{ const d=xtD(c.k); return d.sealed && d.set===n.ts && !c.l; }); if (s.length) bits.push(`You hold ${s.length} sealed ${xtSetDef(n.ts).name} item${s.length>1?'s':''}, worth about ${money(s.reduce((a,c)=>a+xtCopyValue(c),0),true)}.`); }
  return bits.length? `<p class="small up" style="margin:2px 0 0">${bits.join(' ')}</p>` : ''; }
// ---------- Home: goals and wantlist next to the collection ----------
(function(){ const hp=xtHomePanels; xtHomePanels=function(){ const P=hp(); P.goals=xtGoalsPanel(); P.want=xtWantPanel(); P.coll=P.coll+P.goals+P.want;
  P.news=`<div class="panel"><h3>Tidemark news</h3>${G.news.filter(n=>n.k==='xtg').slice(0,5).map(n=>`<div class="newsrow"><b>${esc(n.h)}</b><p>${esc(n.b)}</p>${xtNewsMine(n)}<div class="meta">${fmtDate(n.t)}</div></div>`).join('')||'<div class="empty">Quiet.</div>'}</div>`; return P; }; })();
// goals are checked once a day and after anything that changes the collection
(function(){ const d=xtDay; xtDay=function(t){ d(t); try { if (G.xtg && !G._xtCatch) xtGoalCheck(); } catch(e){ console.error(e); } }; })();
(function(){ const r=render; render=function(){ const out=r.apply(this,arguments); try { if (G && G.xtg && G.player && !UI.busy) xtGoalCheck(); } catch(e){ console.error(e); } return out; }; })();
