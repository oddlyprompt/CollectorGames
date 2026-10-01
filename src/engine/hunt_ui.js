// ===================== THE HUNT: UI =====================
ICONS.hunt = '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/><path d="M8 10.5a2.5 2.5 0 0 1 2.5-2.5"/>';
UI.sub.hunt='near'; UI.hpg=0; UI.hsort='d'; UI.hf='all'; UI.htrade=[]; UI.hsel=[]; UI.hmsg=null;
TABS.length=0; TABS.push(['home','Home'],['shop','Cards'],['comics','Comics'],['hunt','Hunt'],['market','Market'],['coll','Collection']);
function clockTxt(m){ const h=9+Math.floor(m/60), mm=m%60; return ((h-1)%12+1)+':'+String(mm).padStart(2,'0')+(h<12?' AM':' PM'); }
function evDates(ev){ return ev.days>1? fmtDate(ev.d)+'–'+fmtDate(ev.d+ev.days-1) : fmtDate(ev.d); }
function sess(){ const ss=G.hunt&&G.hunt.sess; return ss && ss.day===G.day ? ss : null; }
function sessEv(){ const ss=sess(); return ss? G.hunt.ev.find(x=>x.id===ss.ev) : null; }
function profTxt(s){ const N={mod:'modern cards',pros:'prospects',vcard:'older card sets',slab:'graded cards',auto:'autographs',team:'team lots',wax:'sealed wax',comic:'back issues',ocomic:'older comics',key:'key issues',cslab:'slabbed comics',cvar:'variant covers',indie:'indie comics',tpb:'trades and graphic novels',mixed:'a bit of everything'}; return Object.keys(s.prof).filter(k=>N[k]).sort((a,b)=>s.prof[b]-s.prof[a]).slice(0,3).map(k=>N[k]).join(', ')||'their own work'; }
function relTxt(s){ return s.rel>=5?'Greets you by name and asks what you\'re looking for.': s.rel>=2?'Seems to recognize you.':''; }
function hThumb(e){ const o=objOf(e); if (!o) return '<div class="mini"></div>'; if (e.t==='c') return miniCard(o); if (e.t==='m') return `<div class="mini cm">${e.ck && o.g===0? comicCover(e.ck) : cmThumb(o)}</div>`; return miniSealed(o); }
function hRow(s, e, extra){ const star=wantMatch(e)?'<span class="up small">★ want list</span>':''; return `<button class="row" data-act="hitem" data-a="${s.id}:${e.t}:${e.id}">${hThumb(e)}<div class="rt"><b>${esc(huntLabel(e,true))}</b><span>${e.t==='c'?'Card':e.t==='m'?'Comic':'Sealed'}${e.hold&&e.hold>=G.day?', on hold for you':''}</span>${star}${extra||''}</div><div class="rv"><b>${money(e.p,true)}</b></div></button>`; }
function sessBanner(){ const ss=sess(); if (!ss) return ''; const ev=sessEv(); return `<div class="note" style="margin-bottom:12px;display:flex;gap:8px;align-items:center;flex-wrap:wrap"><b style="flex:1">At ${esc(ev.n)} · ${clockTxt(ss.clock)}${ss.clock>=480?' (closing)':''}</b>${UI.sub.hunt!=='floor'?'<button class="btn sm pri" data-act="sub" data-a="hunt:floor">Back to the floor</button>':''}<button class="btn sm" data-act="hleave">Leave</button></div>`; }
// ---------- views ----------
function evRow(ev, go){ const live=evLive(ev); const T=EV_T[ev.ty];
  return `<div class="row" style="cursor:default"><div class="rt"><b>${esc(ev.n)}</b><span>${evDates(ev)}${ev.cost?', costs '+money(ev.cost)+(ev.cost>40?' (travel'+(ev.days>1?' and hotel':'')+')':''):', free'}${ev.paid?', paid':''}</span><span>${esc(ev.blurb|| (T.tables?`About ${T.tables[1]} tables`+(T.kind==='comic'?', creators signing':T.kind==='card'?', an athlete signing':''):'') )}</span></div>${live&&go?`<div style="display:flex;flex-direction:column;gap:4px"><button class="btn pri sm" data-act="hgo" data-a="${ev.id}:0" ${!ev.paid&&G.player.cash<ev.cost?'disabled':''}>Go now</button>${ev.ty!=='garage'?`<button class="btn sm" data-act="hgo" data-a="${ev.id}:1">Go this afternoon</button>`:''}</div>`:''}</div>`; }
function huntNear(){
  const H=G.hunt; const today=H.ev.filter(ev=>evLive(ev)); const week=H.ev.filter(ev=>ev.d>G.day && ev.d<=G.day+7 && ev.ann<=G.day);
  const shops=H.sel.filter(s=>s.shop); const pv=H.pv; const au=H.auc.find(a=>!a.done && a.ann<=G.day);
  return `${tip('hunt', `<b>The Hunt</b> is the physical side of the hobby: shops, shows, flea markets, garage sales and private collections. Every item is a real object with a real history, and every price is the seller's own opinion. Nothing here tells you what's underpriced. That's your job.`)}
  <div class="cols"><div class="stack">
    <div class="panel"><h3>Today, ${fmtDate(G.day)}</h3><div class="rows">${today.map(ev=>evRow(ev,1)).join('')||'<div class="empty">Nothing on today. Shops are open.</div>'}</div></div>
    <div class="panel"><div class="phead"><h3>This week</h3><button class="linkbtn" data-act="sub" data-a="hunt:events">Calendar</button></div><div class="rows">${week.map(ev=>evRow(ev,0)).join('')||'<div class="empty">Nothing announced yet.</div>'}</div></div>
  </div><div class="stack">
    <div class="panel"><div class="phead"><h3>Local shops</h3><button class="linkbtn" data-act="sub" data-a="hunt:shops">All</button></div><div class="rows">${shops.map(s=>`<button class="row" data-act="hseller" data-a="${s.id}"><div class="rt"><b>${esc(s.n)}</b><span>${esc(profTxt(s))}</span></div><div class="rv"><span>${s.inv.length} items</span></div></button>`).join('')}<button class="row" data-act="goto" data-a="comics:shop"><div class="rt"><b>${SHOP_NAME}</b><span>New comics, back issues, the dollar bin</span></div></button></div></div>
    ${pv.length?`<div class="panel"><div class="phead"><h3>Private collections</h3><button class="linkbtn" data-act="sub" data-a="hunt:private">All</button></div><div class="rows">${pv.map(pvRow).join('')}</div></div>`:''}
    ${au?`<div class="panel"><div class="phead"><h3>${esc(AUCTION_HOUSE)}</h3><button class="linkbtn" data-act="sub" data-a="hunt:auction">Catalogue</button></div><p class="small" style="margin:0">${au.lots.length} lots close ${fmtDate(au.d,true)}.</p></div>`:''}
  </div></div>`;
}
function huntEvents(){
  const H=G.hunt; const up=H.ev.filter(ev=>ev.ann<=G.day && ev.d+ev.days>G.day).sort((a,b)=>a.d-b.d);
  const byDay=new Map(); for (const ev of up){ const k=ev.d; if (!byDay.has(k)) byDay.set(k,[]); byDay.get(k).push(ev); }
  return `${tip('hevents', `Card shows and conventions are announced weeks ahead. Garage and estate sales pop up a few days before. Regional and national shows cost travel money. Morning gets you first pick; late in the day dealers bend on price, if the good stuff is still there.`)}
  <div class="panel">${[...byDay.entries()].map(([d,evs])=>`<h3 style="margin:10px 0 4px">${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dowOf(d)]} ${fmtDate(d,true)}${d===G.day?' · today':''}</h3><div class="rows">${evs.map(ev=>evRow(ev,1)).join('')}</div>`).join('')||'<div class="empty">Nothing announced.</div>'}</div>`;
}
function huntShops(){ const shops=G.hunt.sel.filter(s=>s.shop);
  return `<div class="panel"><div class="rows">${shops.map(s=>`<button class="row" data-act="hseller" data-a="${s.id}"><div class="rt"><b>${esc(s.n)}</b><span>${esc(s.who)}, ${esc(HUNT_KINDS[s.kind].n.toLowerCase())}. ${esc(profTxt(s))}.</span><span>${esc(s.blurb||'')}</span></div><div class="rv"><span>${s.inv.length} items</span></div></button>`).join('')}<button class="row" data-act="goto" data-a="comics:shop"><div class="rt"><b>${SHOP_NAME}</b><span>Your comic shop: new comics Wednesdays, back-issue wall, dollar bin, collections.</span></div></button></div></div>`; }
function pvRow(pv){ const s=pvSeller(pv); return `<button class="row" data-act="hpv" data-a="${pv.id}"><div class="rt"><b>${esc(s.n)}</b><span>${s.inv.length} items, asking ${money(pv.ask)}${pv.mode==='cherry'?', will sell pieces':', all or nothing'}</span><span>Until ${fmtDate(pv.exp)}</span></div></button>`; }
function huntPrivate(){ const pv=G.hunt.pv; return `${tip('hpv', `Private sellers price from what they know, which is sometimes a lot and sometimes nothing. You can look through a sample before you buy, but not everything. Big lots are a bet on the parts you didn't see.`)}<div class="panel"><div class="rows">${pv.map(pvRow).join('')||'<div class="empty">No collections on offer right now. New ones turn up every week or two.</div>'}</div></div>`; }
function huntAuction(){
  const H=G.hunt; const cur=H.auc.filter(a=>!a.done && a.ann<=G.day); const past=H.auc.filter(a=>a.done);
  return `${tip('hauc', `${AUCTION_HOUSE} runs a big sale every quarter. Serious collectors bid; some lots will be out of reach. Set a maximum bid before the close; a 15% buyer's premium is added to the hammer price.`)}
  ${cur.map(a=>`<div class="panel"><div class="phead"><h3>${esc(a.n)}</h3><span class="muted small">Closes ${fmtDate(a.d,true)}</span></div><div class="rows">${a.lots.map(L_=>{ const e={t:L_.t,id:L_.id}; return objOf(e)?`<button class="row" data-act="hlot" data-a="${a.id}:${L_.n}">${hThumb(e)}<div class="rt"><b>Lot ${L_.n}: ${esc(huntLabel(e))}</b><span>Estimate ${money(L_.est[0])}–${money(L_.est[1])}</span>${L_.mx?`<span class="up">Your max: ${money(L_.mx)}</span>`:''}</div></button>`:''; }).join('')}</div></div>`).join('')||'<div class="panel"><div class="empty">The next catalogue is announced about five weeks before the sale.</div></div>'}
  ${past.map(a=>`<div class="panel"><h3>${esc(a.n)}: results</h3><div class="rows">${a.lots.map(L_=>{ const e={t:L_.t,id:L_.id}; return objOf(e)?`<div class="row" style="cursor:default">${hThumb(e)}<div class="rt"><b>Lot ${L_.n}: ${esc(huntLabel(e))}</b><span>${L_.res2&&L_.res2.p?'Sold for '+money(L_.res2.p)+' to '+esc(L_.res2.w):'Unsold'}</span></div></div>`:''; }).join('')}</div></div>`).join('')}`;
}
function wantLabel(w){ if (w.t==='p') return ['Player', pname(P(w.id))]; if (w.t==='k') return ['Card', cardLine(D(w.id))+' '+pname(P(D(w.id).pid))]; if (w.t==='pr') return ['Set', prodName(G.products[w.id])]; if (w.t==='s') return ['Series', sTitle(S_(w.id))]; if (w.t==='i') return ['Issue', cmD(w.id).title+(cmD(w.id).label&&cmD(w.id).label!=='Cover A'?' ('+cmD(w.id).label+')':'')]; if (w.t==='cr') return ['Creator', CR_(w.id).n]; return ['',''] }
function wantAct(w){ return w.t==='p'?`player" data-a="${w.id}`: w.t==='k'||w.t==='i'?`design" data-a="${esc(w.id)}`: w.t==='s'?`cseries" data-a="${w.id}`: w.t==='cr'?`ccreator" data-a="${w.id}`:`product" data-a="${w.id}`; }
function huntWant(){
  const W=G.hunt.want; const F=G.hunt.found.slice(0,25);
  return `${tip('hwant', `Add players, cards, sets, series, issues and creators from their pages. When you browse a table or a shop, anything matching gets a ★. The list won't tell you where to look.`)}
  <div class="cols"><div class="panel"><h3>Want list</h3><div class="rows">${W.map((w,i)=>{ const [a,b]=wantLabel(w); return `<div class="row"><button class="linkbtn" style="flex:1;text-align:left" data-act="${wantAct(w)}"><b>${esc(b)}</b><span class="muted small" style="display:block">${a}</span></button><button class="btn sm" data-act="hwantdel" data-a="${i}">Remove</button></div>`; }).join('')||'<div class="empty">Nothing yet. Look for "Add to want list" on player, card, set, series, issue and creator pages.</div>'}</div></div>
  <div class="panel"><h3>Your finds</h3><p class="small muted" style="margin:0 0 6px">What you've bought out in the world, and where.</p><div class="rows">${F.map(f=>{ const e={t:f[1],id:f[2]}; const o=objOf(e); if (!o || o.o!==0) return ''; return `<button class="row" data-act="${f[1]==='c'?'card':f[1]==='m'?'ccopy':'sealed'}" data-a="${f[2]}">${hThumb(e)}<div class="rt"><b>${esc(huntLabel(e))}</b><span>${esc(f[4])}, ${fmtDate(f[0])}</span></div><div class="rv"><b>${money(f[3],true)}</b><span>paid</span></div></button>`; }).join('')||'<div class="empty">Nothing yet.</div>'}</div></div></div>`;
}
function huntFloor(){
  const ss=sess(); const ev=sessEv(); if (!ss||!ev) return '<div class="empty">You\'re not at an event right now.</div>';
  const sellers=evSellers(ev); const T=EV_T[ev.ty];
  if (ev.ty==='garage'||ev.ty==='estate'){ const s=sellers[0]; const loose=s.inv.filter(e=>!e.bx), box=s.inv.filter(e=>e.bx);
    return `<div class="panel"><h3>${esc(ev.n)}</h3><p class="small" style="margin:0 0 8px">${esc(ev.blurb||'')}. Run by ${esc(s.who)}. Also on the tables: ${esc((s.junk||[]).join(', '))}.</p>${s.inv.length?'':'<div class="empty">Nothing collectible here. You look around, thank them, and go.</div>'}
      ${box.length?`<p class="small muted" style="margin:0 0 6px">Everything's in boxes at ${money(box[0].bx,true)} apiece.</p><button class="btn pri" data-act="hbox" data-a="${s.id}:${box[0].bx}">Go through the boxes (${box.length})</button>`:''}
      <div class="rows">${loose.map(e=>hRow(s,e)).join('')}</div></div>`; }
  const sig=ev.sign||[]; const T2=G.hunt.tbl && G.hunt.tbl.ev===ev.id ? G.hunt.tbl : null; const canRent = T.tables && !T2;
  return `<div class="panel"><div class="phead"><h3>${esc(ev.n)}</h3><span class="muted small">Day ${G.day-ev.d+1} of ${ev.days}</span></div><p class="small muted" style="margin:0 0 6px">Visiting a table takes about 20 minutes. Doors close at 5.</p>
    <div class="rows">${sellers.map(s=>`<button class="row" data-act="hseller" data-a="${s.id}"><div class="rt"><b>${esc(s.n)}${ss.seen.includes(s.id)?' <span class="muted small">visited</span>':''}</b><span>${esc(s.cr!=null?'Creator table: '+s.inv.length+' comics':profTxt(s))}</span>${relTxt(s)?`<span>${esc(relTxt(s))}</span>`:''}</div><div class="rv"><span>${s.inv.filter(e=>!e.bx).length} items${s.inv.some(e=>e.bx)?' + boxes':''}</span></div></button>`).join('')}</div></div>
    ${sig.length?`<div class="panel"><h3>Signing today</h3><div class="rows">${sig.map((g,i)=>`<div class="row" style="cursor:default"><div class="rt"><b>${g.k==='cr'?crLink(CR_(g.id)):pLink(P(g.id))}</b><span>${g.k==='cr'?esc(ROLE_N[CR_(g.id).r])+(g.indie?', at their own table':''):esc(statusOf(P(g.id)))}. ${g.fee?money(g.fee)+' a signature':'Free with purchase, or just ask'}.</span></div><button class="btn sm" data-act="hsign" data-a="${i}">Get something signed</button></div>`).join('')}</div></div>`:''}
    ${T2?`<div class="panel"><h3>Your table</h3><p class="small" style="margin:0 0 6px">${T2.items.length} items still out. Sold so far: ${T2.sold.length} for ${money(T2.sold.reduce((a,x)=>a+x[2],0),true)}.</p><div class="rows">${T2.sold.map(x=>`<div class="row" style="cursor:default"><div class="rt"><b>${esc(huntLabel({t:x[0],id:x[1]}))}</b><span>to ${esc(x[3])}</span></div><div class="rv"><b>${money(x[2],true)}</b></div></div>`).join('')}</div></div>`:''}
    ${canRent?`<div class="panel"><h3>Sell from your own table</h3><p class="small muted" style="margin:0 0 8px">Rent a table for the rest of the show, bring up to 25 items, and let the crowd come to you. No marketplace fee; walk-up buyers haggle.</p><button class="btn" data-act="hrent">Rent a table</button></div>`:''}`;
}
VIEWS.hunt = ()=>{
  if (!G.hunt) return '<div class="empty">Loading.</div>';
  let s=UI.sub.hunt; if (s==='floor' && !sess()) s=UI.sub.hunt='near';
  const tabs=[['near','Nearby'],['events','Events'],['shops','Shops'],['private','Private sales'],['auction','Auctions'],['want','Want list']]; if (sess()) tabs.unshift(['floor','The floor']);
  const body = s==='floor'?huntFloor(): s==='events'?huntEvents(): s==='shops'?huntShops(): s==='private'?huntPrivate(): s==='auction'?huntAuction(): s==='want'?huntWant(): huntNear();
  return `<div class="pagetitle"><h1>The Hunt</h1><span class="muted small">${sess()?clockTxt(sess().clock):fmtDate(G.day,true)}</span></div><div class="subtabs">${tabs.map(([k,n])=>`<button class="${s===k?'on':''}" data-act="sub" data-a="hunt:${k}">${n}</button>`).join('')}</div>${sessBanner()}${body}`;
};
// ---------- seller, item, box ----------
function sellerSheet(sid){
  const s=G.hunt.sel[sid]; if (!s) return null; const ss=sess();
  const main=s.inv.filter(e=>!e.bx); const boxes={}; for (const e of s.inv) if (e.bx) boxes[e.bx]=(boxes[e.bx]||0)+1;
  let arr=main.filter(e=>UI.hf==='all'||e.t===UI.hf);
  if (UI.hsort==='hi') arr.sort((a,b)=>b.p-a.p); else if (UI.hsort==='lo') arr.sort((a,b)=>a.p-b.p);
  const per=15, pg=Math.min(UI.hpg, Math.max(0,Math.ceil(arr.length/per)-1));
  const cart=(G.hunt.cart||[]).filter(x=>{ const [id,t]=x.split(':'); return entryById(s,t,+id); });
  const chip=(k,n)=>`<button class="chip ${UI.hf===k?'on':''}" data-act="hf" data-a="${k}">${n}</button>`;
  return { t:s.n, h:`<div class="stack"><div class="title-block"><div class="yr">${esc(s.who)}${s.who?', ':''}${esc(HUNT_KINDS[s.kind].n.toLowerCase())}</div><h1>${esc(s.n)}</h1><div class="sub">${esc(s.blurb||('Deals in '+profTxt(s)))}</div></div>
    ${relTxt(s)?`<p class="small" style="margin:0">${esc(relTxt(s))}</p>`:''}${s.junk&&s.junk.length?`<p class="small muted" style="margin:0">Also on the table: ${esc(s.junk.join(', '))}.</p>`:''}
    ${Object.keys(boxes).length?`<div class="panel"><h3>Boxes</h3><div class="rows">${Object.entries(boxes).map(([p,n])=>`<button class="row" data-act="hbox" data-a="${s.id}:${p}"><div class="rt"><b>${money(+p,true)} box</b><span>${n} items, flip through ten at a time</span></div></button>`).join('')}</div></div>`:''}
    <div class="panel"><div class="phead"><h3>${s.shop?'In the cases':'On the table'}</h3><span class="muted small">${arr.length} items</span></div>
      <div class="chips" style="margin-bottom:8px">${chip('all','All')}${chip('c','Cards')}${chip('m','Comics')}${chip('s','Sealed')}<select class="inp" style="padding:3px 8px;font-size:13px" data-chg="hsort"><option value="d" ${UI.hsort==='d'?'selected':''}>As displayed</option><option value="hi" ${UI.hsort==='hi'?'selected':''}>Price, high</option><option value="lo" ${UI.hsort==='lo'?'selected':''}>Price, low</option></select></div>
      <div class="rows">${arr.slice(pg*per,pg*per+per).map(e=>hRow(s,e)).join('')||'<div class="empty">Nothing here.</div>'}</div>${pager(arr.length,per,pg,'hpage')}</div>
    <div class="formrow">${cart.length?`<button class="btn pri" data-act="hbundle" data-a="${s.id}">Make an offer on ${cart.length} item${cart.length>1?'s':''}</button>`:''}${s.bb>0 && !s.temp?`<button class="btn" data-act="hsell" data-a="${s.id}">Sell or trade to them</button>`:''}</div></div>` };
}
function discrepancy(e){
  if (!e.ck) return ''; const o=objOf(e);
  if (e.t==='m'){ const d=cmD(o.k); return `<li>${d.p>1? `The indicia inside reads "${esc(d.label.split(',')[0])}".` : d.v? `The cover doesn't match the regular edition: this is the ${esc(VAR_N(d.v))}.` : `The indicia shows no later-printing line; this looks like a first printing.`} ${iLink(o.k,'Look up this version')}</li>`; }
  if (e.t==='c'){ const d=D(o.k); return `<li>Tilted under the light, it has a ${esc(d.parObj.n)} finish${d.run?`, and the back is stamped ${o.s}/${d.run}`:''}. <button class="linkbtn" data-act="design" data-a="${esc(o.k)}">Look up this version</button></li>`; }
  return '';
}
function itemSheet(sid, t, id){
  const s=G.hunt.sel[sid]; const e=s&&entryById(s,t,id); if (!e) return {t:'Gone', h:'<div class="empty">Someone else bought it.</div>'};
  const o=objOf(e); const inCart=(G.hunt.cart||[]).includes(id+':'+t); const m=UI.hmsg&&UI.hmsg.k===sid+':'+t+':'+id?UI.hmsg:null;
  let art, look, research;
  if (t==='c'){ const d=D(e.ck||o.k); art=bigCardHTML(e.ck&&o.g===0?null:o, e.ck||o.k); look = o.g>0? `<div class="small">Graded GCS ${o.g}. ${popHTML(o.k)}</div>` : inspectHTML(o,false).replace('<ul class="inspect">','<ul class="inspect">'+discrepancy(e)); research=`${pLink(P(d.pid))} · <button class="linkbtn" data-act="design" data-a="${esc(e.ck||o.k)}">Sales and comps</button>`; }
  else if (t==='m'){ const k=e.ck||o.k; art=`<div class="bigcard cm"><div class="face ${o.g>0?'slab':''}">${e.ck&&o.g===0?comicCover(k):cmThumb(o)}</div></div>`; look = o.g>0? `<div class="small">GCS ${gTxt(o.g)} ${CGN[o.g]}${o.gr?', restored':''}.</div>` : cmInspectHTML(o,false).replace('<ul class="inspect">','<ul class="inspect">'+discrepancy(e)); research=`${sLink(cmD(k).s)} · ${iLink(k,'Issue history and sales')}`; }
  else { const prod=G.products[o.p]; art=`<div class="bigcard"><div class="face">${packArt(prod,o.f)}</div></div>`; look=`<p class="small" style="margin:0">Factory sealed. ${formatLine(prod,o.f)}.</p>`; research=`<button class="linkbtn" data-act="product" data-a="${prod.id}">Product details</button>`; }
  const hold = s.shop && s.rel>=2 && !(e.hold>=G.day);
  return { t:huntLabel(e,true), h:`<div class="stack"><div class="detail">${art}<div class="stack">
    <div class="title-block"><div class="yr">${esc(s.n)}</div><h1>${esc(huntLabel(e,true))}</h1>${wantMatch(e)?'<div class="sub up">On your want list</div>':''}</div>
    <dl class="kv"><dt>Asking</dt><dd class="est">${money(e.p,true)}</dd>${e.bx?`<dt>From</dt><dd>The ${money(e.bx,true)} box</dd>`:''}<dt>Research</dt><dd>${research}</dd></dl>
    <div><b class="small">Your look at it</b>${look}</div></div></div>
    <div class="panel"><h3>Deal</h3>
      <div class="formrow"><button class="btn pri" data-act="hbuy" data-a="${sid}:${t}:${id}" data-confirm="Pay ${money(e.p,true)}" ${G.player.cash<e.p?'disabled':''}>Buy for ${money(e.p,true)}</button>${e.bx?'':`<button class="btn" data-act="hcart" data-a="${sid}:${t}:${id}">${inCart?'Remove from offer':'Add to a bundle offer'}</button>`}</div>
      ${e.bx?'':`<div class="formrow"><input class="inp money-in" type="number" min="0.5" step="0.5" id="hoffer" placeholder="Your offer"><button class="btn" data-act="hoffer" data-a="${sid}:${t}:${id}">Make offer</button><button class="btn" data-act="hbest" data-a="${sid}:${t}:${id}">Best price?</button></div>`}
      ${hold?`<div class="formrow"><button class="btn sm" data-act="hhold" data-a="${sid}:${t}:${id}">Ask them to hold it until tomorrow</button></div>`:''}
      ${m?`<div class="${m.ok?'ok':'err'}" style="margin-top:8px">${esc(m.txt)}${m.counter?` <button class="btn sm pri" data-act="haccept" data-a="${sid}:${t}:${id}:${m.counter}" data-confirm="Pay ${money(m.counter,true)}">Accept ${money(m.counter,true)}</button>`:''}</div>`:''}
    </div></div>` };
}
function boxSheet(sid, price){
  const s=G.hunt.sel[sid]; if (!s) return null; const key=sid+':'+price; const ss=sess(); const dug=G.hunt.dug=G.hunt.dug||{}; if (dug.day!==G.day){ G.hunt.dug={day:G.day}; }
  const n=G.hunt.dug[key]||0; const items=s.inv.filter(e=>e.bx===+price); const shown=items.slice(0,n*10);
  return { t:money(+price,true)+' box', h:`<div class="stack"><p class="small muted" style="margin:0">${items.length} items at ${money(+price,true)} each. Tap anything to look closer.</p>
    <div class="grid">${shown.map(e=>{ const o=objOf(e); return `<button class="gcell" data-act="hitem" data-a="${s.id}:${e.t}:${e.id}">${e.t==='c'?thumbHTML(o):`<div class="thumb cmthumb">${comicCover(o.k)}</div>`}<div class="cap"><b>${esc(e.t==='c'?cardName(o):cmD(o.k).title)}</b><span>${esc(e.t==='c'?D(o.k).prod.yr+' '+B(D(o.k).prod).short:String(cmD(o.k).yr))}</span></div></button>`; }).join('')}</div>
    ${n*10<items.length?`<button class="btn pri" data-act="hdig" data-a="${key}">${n?'Next stack':'Start flipping'}</button>`:'<p class="small muted">That\'s the whole box.</p>'}</div>` };
}
function bundleSheet(sid){
  const s=G.hunt.sel[sid]; const cart=(G.hunt.cart||[]).map(x=>{ const [id,t]=x.split(':'); return entryById(s,t,+id); }).filter(Boolean);
  const tr=UI.htrade.map(x=>{ const [t,id]=x.split(':'); return {t,id:+id}; }).filter(e=>{ const o=objOf(e); return o&&o.o===0; });
  const ask=cart.reduce((a,e)=>a+e.p,0); const credit=tr.length?tradeCredit(s,tr):0; const m=UI.hmsg&&UI.hmsg.k==='b'+sid?UI.hmsg:null;
  const mine=playerObjs().slice(0,300).map(e=>[e,trueValue(e)]).sort((a,b)=>b[1]-a[1]).slice(0,30);
  return { t:'Offer to '+s.n, h:`<div class="stack"><div class="panel"><h3>You want</h3><div class="rows">${cart.map(e=>hRow(s,e)).join('')||'<div class="empty">Add items from their table first.</div>'}</div><p class="small" style="margin:6px 0 0">Asking total ${money(ask,true)}.</p></div>
    ${s.bb>0?`<div class="panel"><h3>Add a trade</h3><p class="small muted" style="margin:0 0 6px">Dealers give more in trade credit than they'd pay in cash.${tr.length?` They'd credit you <b>${money(credit,true)}</b> for what you've picked.`:''}</p><div class="rows">${mine.map(([e])=>{ const k=e.t+':'+e.id; const on=UI.htrade.includes(k); return `<button class="row" data-act="htrade" data-a="${k}">${hThumb(e)}<div class="rt"><b>${esc(huntLabel(e))}</b><span>${on?'In the trade':'Tap to add'}</span></div>${on?'<div class="rv"><b class="up">✓</b></div>':''}</button>`; }).join('')}</div></div>`:''}
    <div class="panel"><h3>Your offer</h3><div class="formrow"><input class="inp money-in" type="number" min="0" step="1" id="hboffer" placeholder="Cash" value=""><button class="btn pri" data-act="hbofferGo" data-a="${sid}" ${cart.length?'':'disabled'}>Propose deal</button><button class="btn" data-act="hbbest" data-a="${sid}" ${cart.length?'':'disabled'}>Best price for all?</button></div>
    ${m?`<div class="${m.ok?'ok':'err'}" style="margin-top:8px">${esc(m.txt)}${m.counter!=null?` <button class="btn sm pri" data-act="hbaccept" data-a="${sid}:${m.counter}" data-confirm="Pay ${money(m.counter,true)}">Accept</button>`:''}</div>`:''}</div></div>` };
}
function sellSheet(sid){
  const s=G.hunt.sel[sid]; const mine=playerObjs().map(e=>[e,dealerQuote(s,e)]).filter(x=>x[1]>=0.5).sort((a,b)=>b[1]-a[1]).slice(0,60);
  const sel=UI.hsel.filter(k=>mine.some(([e])=>e.t+':'+e.id===k)); const tot=mine.filter(([e])=>sel.includes(e.t+':'+e.id)).reduce((a,x)=>a+x[1],0);
  return { t:'Sell to '+s.n, h:`<div class="stack"><p class="small muted" style="margin:0">${esc(s.who||s.n)} makes cash offers on the spot. Fast and certain, but dealers need margin: expect well under what patient marketplace selling can get. They have ${money(s.cash)} on hand.</p>
    <div class="panel"><div class="rows">${mine.map(([e,q])=>{ const k=e.t+':'+e.id; const on=sel.includes(k); return `<button class="row" data-act="hselpick" data-a="${k}">${hThumb(e)}<div class="rt"><b>${esc(huntLabel(e))}</b><span>${on?'Selected':'Tap to select'}</span></div><div class="rv"><b>${money(q,true)}</b><span>their offer</span></div></button>`; }).join('')||'<div class="empty">Nothing they want.</div>'}</div></div>
    <button class="btn pri" data-act="hsellgo" data-a="${sid}" data-confirm="Sell for ${money(tot,true)}" ${sel.length?'':'disabled'}>Sell ${sel.length} for ${money(tot,true)}</button></div>` };
}
// ---------- private collections ----------
function pvComposition(s){ const c=s.inv.filter(e=>e.t==='c').length, m=s.inv.filter(e=>e.t==='m').length, x=s.inv.filter(e=>e.t==='s').length; const yrs=s.inv.filter(e=>e.t==='m').map(e=>cmD(objOf(e).k).yr).sort((a,b)=>a-b); const cy=s.inv.filter(e=>e.t==='c').map(e=>D(objOf(e).k).prod.yr).sort((a,b)=>a-b);
  const parts=[]; if (c) parts.push(`about ${Math.round(c/10)*10||c} cards${cy.length?', mostly '+cy[Math.floor(cy.length*0.2)]+'–'+cy[Math.floor(cy.length*0.8)]:''}`); if (m) parts.push(`about ${Math.round(m/10)*10||m} comics${yrs.length?', mostly '+Math.floor(yrs[Math.floor(yrs.length*0.2)]/10)*10+'s to '+Math.floor(yrs[Math.floor(yrs.length*0.8)]/10)*10+'s':''}`); if (x) parts.push(x+' sealed item'+(x>1?'s':'')); return parts.join('; '); }
function pvSheet(id){
  const pv=G.hunt.pv.find(x=>x.id===id); if (!pv) return {t:'Sold', h:'<div class="empty">That collection is gone.</div>'}; const s=pvSeller(pv);
  const rev=pv.rev.map(i=>s.inv[i]).filter(Boolean); const hl=pv.hl.map(x=>{ const [t,id]=x.split(':'); return s.inv.find(e=>e.t===t&&e.id===+id); }).filter(Boolean);
  const m=UI.hmsg&&UI.hmsg.k==='pv'+id?UI.hmsg:null; const left=pv.samp-pv.rev.length;
  return { t:s.n, h:`<div class="stack"><div class="title-block"><div class="yr">Private sale · ${esc(s.who)}</div><h1>${esc(s.n)}</h1><div class="sub">${esc(s.story)}</div></div>
    <dl class="kv"><dt>Size</dt><dd>${s.inv.length} items: ${esc(pvComposition(s))}</dd><dt>Asking</dt><dd class="est">${money(pv.ask)}</dd><dt>Deal</dt><dd>${pv.mode==='cherry'?'Will sell the whole lot or individual pieces':'Whole collection only'}</dd><dt>Offer good until</dt><dd>${fmtDate(pv.exp,true)}</dd></dl>
    ${hl.length?`<div class="panel"><h3>What the seller mentions</h3><div class="rows">${hl.map(e=>`<button class="row" data-act="hpvitem" data-a="${id}:${e.t}:${e.id}">${hThumb(e)}<div class="rt"><b>${esc(huntLabel(e,true))}</b><span>"This one's supposed to be good."</span></div></button>`).join('')}</div></div>`:''}
    <div class="panel"><div class="phead"><h3>What you've looked through</h3><span class="muted small">${rev.length} of ${s.inv.length}</span></div>
      <div class="rows">${rev.map(e=>`<button class="row" data-act="hpvitem" data-a="${id}:${e.t}:${e.id}">${hThumb(e)}<div class="rt"><b>${esc(huntLabel(e,true))}</b><span>${esc(quickCond(e))}</span></div>${pv.mode==='cherry'&&e.p?`<div class="rv"><b>${money(e.p,true)}</b></div>`:''}</button>`).join('')||'<div class="empty">You haven\'t opened any boxes yet.</div>'}</div>
      ${left>0?`<button class="btn" style="margin-top:8px" data-act="hpvlook" data-a="${id}">Look through a few more (${left} left before the seller gets impatient)</button>`:'<p class="small muted" style="margin:8px 0 0">The seller wants a decision.</p>'}</div>
    <div class="panel"><h3>Make a deal</h3><div class="formrow"><input class="inp money-in" type="number" min="1" step="5" id="hpvoffer" placeholder="Offer for everything"><button class="btn" data-act="hpvoffer" data-a="${id}">Offer</button><button class="btn pri" data-act="hpvbuy" data-a="${id}:${pv.ask}" data-confirm="Pay ${money(pv.ask)}" ${G.player.cash<pv.ask?'disabled':''}>Pay the asking price</button></div>
      ${m?`<div class="${m.ok?'ok':'err'}" style="margin-top:8px">${esc(m.txt)}${m.counter?` <button class="btn sm pri" data-act="hpvbuy" data-a="${id}:${m.counter}" data-confirm="Pay ${money(m.counter)}">Accept ${money(m.counter)}</button>`:''}</div>`:''}</div></div>` };
}
function quickCond(e){ const o=objOf(e); if (e.t==='s') return 'Sealed'; if (o.g>0) return 'Graded '+(e.t==='m'?gTxt(o.g):o.g); if (e.t==='m'){ const g=cmGradeOf(o); const lo=CGL[Math.min(CGL.length-1,CGL.indexOf(g)+2)], hi=CGL[Math.max(0,CGL.indexOf(g)-1)]; return 'Looks like '+gTxt(lo)+' to '+gTxt(hi)+(o.c[6]<55?', tanned pages':'')+(o.c[3]<70?', a crease':''); } const mn=Math.min(...o.c); return mn>=90?'Looks sharp':mn>=78?'Light wear':mn>=65?'Visible wear':'Well-loved'; }
function pvItemSheet(pid, t, id){ const pv=G.hunt.pv.find(x=>x.id===pid); if (!pv) return null; const s=pvSeller(pv); const e=s.inv.find(x=>x.t===t&&x.id===id); if (!e) return null; const r=itemSheet(s.id,t,id);
  if (pv.mode!=='cherry') r.h=r.h.replace(/<div class="panel"><h3>Deal<\/h3>[\s\S]*$/, '<p class="small muted">The seller only sells the collection as a whole.</p></div>'); return r; }
// ---------- auction lot, signing, table rental ----------
function lotSheet2(aid, n){ const a=G.hunt.auc.find(x=>x.id===aid); const L_=a&&a.lots.find(x=>x.n===n); if (!L_) return null; const e={t:L_.t,id:L_.id}; const o=objOf(e);
  const art = e.t==='c'? bigCardHTML(o) : `<div class="bigcard cm"><div class="face ${o.g>0?'slab':''}">${cmThumb(o)}</div></div>`;
  const research = e.t==='c'? `${pLink(P(D(o.k).pid))} · <button class="linkbtn" data-act="design" data-a="${esc(o.k)}">Sales and comps</button>` : `${sLink(cmD(o.k).s)} · ${iLink(o.k,'Issue history and sales')}`;
  return { t:'Lot '+n, h:`<div class="stack"><div class="detail">${art}<div class="stack"><div class="title-block"><div class="yr">${esc(a.n)}</div><h1>${esc(huntLabel(e))}</h1></div>
    <dl class="kv"><dt>Estimate</dt><dd class="est">${money(L_.est[0])}–${money(L_.est[1])}</dd><dt>Closes</dt><dd>${fmtDate(a.d,true)}</dd><dt>Research</dt><dd>${research}</dd>${L_.mx?`<dt>Your maximum</dt><dd>${money(L_.mx)}</dd>`:''}</dl>
    <div><b class="small">Catalogue description</b>${e.t==='c'?(o.g>0?`<p class="small">GCS ${o.g}.</p>`:inspectHTML(o,true)):(o.g>0?`<p class="small">GCS ${gTxt(o.g)} ${CGN[o.g]}.</p>`:cmInspectHTML(o,true))}</div></div></div>
    <div class="panel"><h3>Absentee bid</h3><p class="small muted" style="margin:0 0 6px">The house bids for you up to your maximum. Winning adds a 15% premium. Keep the cash on hand for the close.</p><div class="formrow"><input class="inp money-in" type="number" min="1" step="5" id="hlotmax" value="${L_.mx||''}" placeholder="Max bid"><button class="btn pri" data-act="hlotbid" data-a="${aid}:${n}">Set maximum</button>${L_.mx?`<button class="btn" data-act="hlotclr" data-a="${aid}:${n}">Withdraw</button>`:''}</div></div></div>` }; }
function signSheet(si){ const ev=sessEv(); const g=ev&&ev.sign[si]; if (!g) return null;
  let items=[]; if (g.k==='cr'){ items=myComics().filter(c=>c.g===0 && !c.l && !c.sg && (()=>{ const s=cmD(c.k).s; return s.w===g.id||s.a===g.id||s.cv===g.id; })()).map(c=>({t:'m',id:c.id})); }
  else items=myCards().filter(c=>c.g===0 && !c.l && !c.sg && !D(c.k).auto && D(c.k).pid===g.id).map(c=>({t:'c',id:c.id}));
  const who = g.k==='cr'? CR_(g.id).n : pname(P(g.id));
  return { t:'Signing: '+who, h:`<div class="stack"><p class="small muted" style="margin:0">${esc(who)} will sign ${g.k==='cr'?'comics they worked on':'their own cards'}. The signature is witnessed at the event. ${g.fee?money(g.fee)+' each.':'No charge.'}</p>
    <div class="panel"><div class="rows">${items.map(e=>`<div class="row" style="cursor:default">${hThumb(e)}<div class="rt"><b>${esc(huntLabel(e))}</b></div><button class="btn sm pri" data-act="hsigngo" data-a="${si}:${e.t}:${e.id}" ${g.fee?`data-confirm="Pay ${money(g.fee)}"`:''}>Sign it</button></div>`).join('')||`<div class="empty">You don't own anything ${esc(who)} can sign.${g.indie?' Their table has copies for sale.':''}</div>`}</div></div></div>` }; }
function rentSheet(){ const ev=sessEv(); if (!ev) return null; const mine=playerObjs().map(e=>[e,trueValue(e)]).sort((a,b)=>b[1]-a[1]).slice(0,80); const sel=UI.hsel;
  const fee = ev.ty==='nshow'||ev.ty==='bcon'?250: ev.ty==='rshow'||ev.ty==='rcon'||ev.ty==='ccon'?90: 30;
  return { t:'Rent a table', h:`<div class="stack"><p class="small muted" style="margin:0">A table costs ${money(fee)}. Pick up to 25 items. Prices start from recent market estimates; choose how aggressive to be.</p>
    <div class="panel"><div class="rows">${mine.map(([e])=>{ const k=e.t+':'+e.id; const on=sel.includes(k); return `<button class="row" data-act="hselpick" data-a="${k}">${hThumb(e)}<div class="rt"><b>${esc(huntLabel(e))}</b><span>${on?'Bringing it':'Tap to bring'}</span></div>${on?'<div class="rv"><b class="up">✓</b></div>':''}</button>`; }).join('')}</div></div>
    <div class="formrow"><select class="inp" id="hpct"><option value="0.9">Priced to move (90%)</option><option value="1" selected>Market (100%)</option><option value="1.15">Firm (115%)</option><option value="1.35">Testing the room (135%)</option></select><button class="btn pri" data-act="hrentgo" data-confirm="Pay ${money(fee)}" ${sel.length&&sel.length<=25?'':'disabled'}>Rent and set up (${sel.length})</button></div></div>` }; }
// ---------- actions ----------
const hsplit=a=>{ const [sid,t,id,x]=a.split(':'); return [G.hunt.sel[+sid], t, +id, x]; };
ACT.hgo = (a,el)=>{ const [id,late]=a.split(':').map(Number); const ev=G.hunt.ev.find(x=>x.id===id); if (ev && !ev.paid && ev.cost>0 && !armed(el)) return; const err=enterEvent(id, !!late); if (err){ showToast(err); return; } UI.sub.hunt='floor'; UI.tab='hunt'; closeSheet(true); render(); window.scrollTo(0,0); afterAction(); };
ACT.hleave = ()=>{ leaveEvent(); UI.sub.hunt='near'; closeSheet(true); render(); afterAction(); };
ACT.hseller = a=>{ const s=G.hunt.sel[+a]; const ss=sess(); if (ss && !ss.seen.includes(s.id) && evSellers(sessEv()).includes(s)){ if (ss.clock>=480){ showToast('The show is closing up.'); return; } ss.seen.push(s.id); evClock(s.cr!=null?10:20); updateHeader(); } UI.hpg=0; UI.hf='all'; UI.hsort='d'; openSheet(()=>sellerSheet(+a)); };
ACT.hitem = a=>{ UI.hmsg=null; const [s,t,id]=hsplit(a); openSheet(()=>itemSheet(s.id,t,id)); };
ACT.hbox = a=>{ const [sid,p]=a.split(':'); openSheet(()=>boxSheet(+sid,+p)); };
ACT.hdig = a=>{ const ss=sess(); if (ss){ if (ss.clock>=480){ showToast('The show is closing up.'); return; } evClock(8); } G.hunt.dug[a]=(G.hunt.dug[a]||0)+1; refreshSheet(); updateHeader(); };
ACT.hpage = a=>{ UI.hpg=+a; refreshSheet(); }; ACT.hf = a=>{ UI.hf=a; UI.hpg=0; refreshSheet(); }; ACT.hsort = v=>{ UI.hsort=v; refreshSheet(); };
ACT.hbuy = (a,el)=>{ if (!armed(el)) return; const [s,t,id]=hsplit(a); const e=entryById(s,t,id); if (!e){ showToast('Gone.'); return; } const err=playerBuy(s,[e],e.p); if (err){ showToast(err); return; } showToast('Bought. It\'s in your collection.', true); closeSheet(); refresh(); afterAction(); };
ACT.hoffer = a=>{ const [s,t,id]=hsplit(a); const e=entryById(s,t,id); const v=Math.round(parseFloat($('#hoffer').value)*100)/100; if (!e||!(v>0)) return; if (G.player.cash<v){ showToast('You don\'t have that much.'); return; }
  const r=negotiate(s,[e],v); if (r.ok){ playerBuy(s,[e],v); showToast('Deal at '+money(v,true)+'.', true); closeSheet(); refresh(); afterAction(); return; }
  UI.hmsg={k:a, ok:0, txt:r.no||r.msg, counter:r.counter}; refreshSheet(); queueSave(); };
ACT.hbest = a=>{ const [s,t,id]=hsplit(a); const e=entryById(s,t,id); const k=a+':best'; if (G.hunt.asked===k+G.day){ UI.hmsg={k:a, txt:'"I already told you my best."'}; refreshSheet(); return; } G.hunt.asked=k+G.day; const b=bestPrice(s,[e]); G.hunt.lastCounter={k:e.t+e.id,p:b,s:s.id}; UI.hmsg={k:a, ok:1, txt:b<e.p?`"For you, ${money(b,true)}."`:'"The price is the price."', counter:b<e.p?b:null}; refreshSheet(); };
ACT.haccept = (a,el)=>{ if (!armed(el)) return; const [sid,t,id,c]=a.split(':'); const s=G.hunt.sel[+sid]; const e=entryById(s,t,+id); if (!e) return; const err=playerBuy(s,[e],+c); if (err){ showToast(err); return; } showToast('Deal at '+money(+c,true)+'.', true); closeSheet(); refresh(); afterAction(); };
ACT.hcart = a=>{ const [s,t,id]=hsplit(a); const k=id+':'+t; const c=G.hunt.cart=G.hunt.cart||[]; const i=c.indexOf(k); if (i>=0) c.splice(i,1); else c.push(k); refreshSheet(); };
ACT.hhold = a=>{ const [s,t,id]=hsplit(a); const e=entryById(s,t,id); e.hold=G.day+1; showToast(s.who+' puts it behind the counter for you until tomorrow.', true); refreshSheet(); queueSave(); };
ACT.hbundle = a=>{ UI.hmsg=null; UI.htrade=[]; openSheet(()=>bundleSheet(+a)); };
ACT.htrade = a=>{ const i=UI.htrade.indexOf(a); if (i>=0) UI.htrade.splice(i,1); else UI.htrade.push(a); refreshSheet(); };
function bundleParts(sid){ const s=G.hunt.sel[sid]; const cart=(G.hunt.cart||[]).map(x=>{ const [id,t]=x.split(':'); return entryById(s,t,+id); }).filter(Boolean); const tr=UI.htrade.map(x=>{ const [t,id]=x.split(':'); return {t,id:+id}; }).filter(e=>{ const o=objOf(e); return o&&o.o===0; }); return [s,cart,tr]; }
function doBundle(s,cart,tr,cash){ if (G.player.cash<cash){ showToast('You don\'t have that much.'); return false; } if (tr.length) applyTrade(s,tr); playerBuy(s,cart,cash); G.hunt.cart=[]; UI.htrade=[]; showToast('Deal done.', true); closeSheet(); refresh(); afterAction(); return true; }
ACT.hbofferGo = a=>{ const [s,cart,tr]=bundleParts(+a); const v=Math.max(0,Math.round((parseFloat($('#hboffer').value)||0)*100)/100); const r=negotiate(s,cart,v,tr.length?tr:null); if (r.ok){ doBundle(s,cart,tr,v); return; } UI.hmsg={k:'b'+a, txt:r.no||r.msg, counter:r.counter!=null? Math.max(0,Math.round((r.counter-(r.credit||0))*100)/100) : null}; refreshSheet(); queueSave(); };
ACT.hbbest = a=>{ const [s,cart,tr]=bundleParts(+a); const b=bestPrice(s,cart); const cr=tr.length?tradeCredit(s,tr):0; UI.hmsg={k:'b'+a, ok:1, txt:`"All of it for ${money(b,true)}${cr?', less '+money(cr,true)+' for your trade':''}."`, counter:Math.max(0,Math.round((b-cr)*100)/100)}; refreshSheet(); };
ACT.hbaccept = (a,el)=>{ if (!armed(el)) return; const [sid,c]=a.split(':'); const [s,cart,tr]=bundleParts(+sid); doBundle(s,cart,tr,+c); };
ACT.hsell = a=>{ UI.hsel=[]; openSheet(()=>sellSheet(+a)); };
ACT.hselpick = a=>{ const i=UI.hsel.indexOf(a); if (i>=0) UI.hsel.splice(i,1); else UI.hsel.push(a); refreshSheet(); };
ACT.hsellgo = (a,el)=>{ if (!armed(el)) return; const s=G.hunt.sel[+a]; const items=UI.hsel.map(x=>{ const [t,id]=x.split(':'); return {t,id:+id}; }); const err=sellToSeller(s,items); if (err){ showToast(err); return; } UI.hsel=[]; showToast('Sold. Cash in hand.', true); closeSheet(); refresh(); afterAction(); };
ACT.hpv = a=>{ UI.hmsg=null; openSheet(()=>pvSheet(+a)); };
ACT.hpvlook = a=>{ const pv=G.hunt.pv.find(x=>x.id===+a); pvReveal(pv,5); refreshSheet(); queueSave(); };
ACT.hpvitem = a=>{ const [pid,t,id]=a.split(':'); UI.hmsg=null; openSheet(()=>pvItemSheet(+pid,t,+id)); };
ACT.hpvoffer = a=>{ const pv=G.hunt.pv.find(x=>x.id===+a); const v=Math.round(parseFloat($('#hpvoffer').value)); if (!pv||!(v>0)) return; if (G.player.cash<v){ showToast('You don\'t have that much.'); return; } const r=pvOffer(pv,v); if (r.ok){ ACT.hpvbuy(pv.id+':'+v, null, null, true); return; } UI.hmsg={k:'pv'+a, txt:r.no||r.msg, counter:r.counter}; refreshSheet(); queueSave(); };
ACT.hpvbuy = (a,el,e,skip)=>{ if (!skip && !armed(el)) return; const [id,p]=a.split(':').map(Number); const pv=G.hunt.pv.find(x=>x.id===id); if (!pv) return; const n=pvSeller(pv).inv.length; const err=pvBuyAll(pv,p); if (err){ showToast(err); return; } showToast('Bought the collection: '+n+' items. They\'re in your collection, marked New.', true); closeSheet(true); UI.cf.f='new'; UI.ccf.f='new'; refresh(); afterAction(); };
ACT.hlot = a=>{ const [aid,n]=a.split(':').map(Number); openSheet(()=>lotSheet2(aid,n)); };
ACT.hlotbid = a=>{ const [aid,n]=a.split(':').map(Number); const L_=G.hunt.auc.find(x=>x.id===aid).lots.find(x=>x.n===n); const v=Math.round(parseFloat($('#hlotmax').value)); if (!(v>0)) return; L_.mx=v; showToast('Absentee bid set at '+money(v)+'.', true); refreshSheet(); render(true); queueSave(); };
ACT.hlotclr = a=>{ const [aid,n]=a.split(':').map(Number); G.hunt.auc.find(x=>x.id===aid).lots.find(x=>x.n===n).mx=0; refreshSheet(); render(true); queueSave(); };
ACT.hsign = a=>openSheet(()=>signSheet(+a));
ACT.hsigngo = (a,el)=>{ const [si,t,id]=a.split(':'); const ev=sessEv(); if (ev.sign[+si].fee && !armed(el)) return; const err=signItem(ev.id,+si,t,+id); if (err){ showToast(err); return; } showToast('Signed, with a witness sticker.', true); refreshSheet(); updateHeader(); afterAction(); };
ACT.hrent = ()=>{ UI.hsel=[]; openSheet(rentSheet); };
ACT.hrentgo = (a,el)=>{ if (!armed(el)) return; const ev=sessEv(); const items=UI.hsel.map(x=>{ const [t,id]=x.split(':'); return {t,id:+id}; }); const err=rentTable(ev.id, items, parseFloat($('#hpct').value)); if (err){ showToast(err); return; } UI.hsel=[]; showToast('Table set up. Buyers will come to you while you walk the show.', true); closeSheet(true); render(); afterAction(); };
ACT.hwantdel = a=>{ G.hunt.want.splice(+a,1); render(true); queueSave(); };
ACT.hwant = a=>{ const [t,...r]=a.split('~'); const id = (t==='k'||t==='i')? r.join('~') : +r[0]; wantToggle({t,id}); showToast(wantHas({t,id})?'Added to your want list.':'Removed from your want list.', wantHas({t,id})); refreshSheet(); queueSave(); };
// ---------- want-list buttons on existing pages ----------
function wantBtn(t,id){ const on=G.hunt&&wantHas({t,id}); return `<div class="formrow" style="margin:0"><button class="btn sm" data-act="hwant" data-a="${t}~${esc(String(id))}">${on?'★ On your want list':'Add to want list'}</button></div>`; }
function injectWant(fn, mk_){ return function(){ const r=fn.apply(null, arguments); if (!r || !G.hunt) return r; const w=mk_.apply(null, arguments); if (!w) return r; const i=r.h.indexOf('<div class="stack">'); if (i<0) return r; const j=i+'<div class="stack">'.length; r.h=r.h.slice(0,j)+wantBtn(w[0],w[1])+r.h.slice(j); return r; }; }
playerSheet = injectWant(playerSheet, pid=>['p',pid]);
designSheet = injectWant(designSheet, key=>[key[0]==='M'?'i':'k', key]);
seriesSheet = injectWant(seriesSheet, sid=>['s',sid]);
creatorSheet = injectWant(creatorSheet, id=>['cr',id]);
productSheet = injectWant(productSheet, pid=>['pr',pid]);
// ---------- nav & collection glue ----------
(function(){
  const collV=VIEWS.coll; VIEWS.coll=()=>{ const h=collV(); const i=h.indexOf('<div class="subtabs">'); if (i<0) return h; const j=h.indexOf('</div>',i); return h.slice(0,j)+'<button data-act="tab" data-a="grade">Grading</button>'+h.slice(j); };
  const gradeV=VIEWS.grade; VIEWS.grade=()=>{ const h=gradeV(); const i=h.indexOf('<div class="subtabs">'); if (i<0) return h; const j=i+'<div class="subtabs">'.length; return h.slice(0,j)+'<button data-act="tab" data-a="coll">← Collection</button>'+h.slice(j); };
  const bf=badgeFor; badgeFor=function(t){ if (t==='coll') return bf('coll')+bf('grade'); if (t==='hunt') return G.hunt? G.hunt.ev.filter(ev=>evLive(ev) && !['garage','flea'].includes(ev.ty) && !ev.paid).length : 0; return bf(t); };
  const homeV=VIEWS.home; VIEWS.home=()=>{ const h=homeV(); if (!G.hunt) return h; const today=G.hunt.ev.filter(ev=>evLive(ev)); const i=h.indexOf('<div class="cols">'); if (i<0) return h;
    const strip=`<div class="panel" style="margin-bottom:14px"><div class="phead"><h3>Out and about</h3><button class="linkbtn" data-act="goto" data-a="hunt:near">The Hunt</button></div><div class="rows">${today.length? today.map(ev=>evRow(ev,1)).join('') : '<div class="small muted">No shows or sales today. The local shops are open.</div>'}${G.hunt.pv.slice(0,2).map(pvRow).join('')}</div></div>`;
    return h.slice(0,i)+strip+h.slice(i); };
})();
