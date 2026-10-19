// ===================== COLLECTION =====================
function isMajor(c){ const d=D(c.k); return d.auto || d.caseHit || d.sec==='w' || (d.run && d.run<=50) || cardValue(c)>=25; }
function shortLine(c){ const d=D(c.k); return d.prod.yr+' '+B(d.prod).short+' '+d.title+(serialTxt(c)?' '+serialTxt(c):''); }
function gcell(c, extra){
  const d=D(c.k); const flag = c.nw? '<span class="flag">New</span>' : '';
  const st = c.l? '<span class="flag ls">Listed</span>' : c.g<0? '<span class="flag ls">At GCS</span>' : '';
  return `<button class="gcell" data-act="card" data-a="${c.id}">${flag}${st}${thumbHTML(c)}<div class="cap"><b>${esc(cardName(c))}</b><span>${esc(shortLine(c))}</span>${extra!==false?`<span>${fmtRange(estRange(c.k,c.g>0?c.g:0,c))}</span>`:''}</div></button>`;
}
function bulkEligible(){ const show=Object.values(G.player.show); return myCards().filter(c=>{ if (c.l||c.g||G.player.fav.includes(c.id)||show.includes(c.id)) return false; const d=D(c.k); return d.sec==='b' && !d.par && !d.rc && !d.first && !d.hisp && cardValue(c)<0.45; }); }
function collFiltered(){
  const f=UI.cf; const words=f.q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  let a=myCards().filter(c=>{
    const d=D(c.k);
    if (f.f==='new' && !c.nw) return false;
    if (f.f==='hits' && !isHitKey(c.k)) return false;
    if (f.f==='rc' && !(d.rc||d.first)) return false;
    if (f.f==='graded' && !(c.g>0)) return false;
    if (f.f==='raw' && c.g!==0) return false;
    if (f.f==='fav' && !G.player.fav.includes(c.id)) return false;
    if (f.f==='listed' && !c.l) return false;
    if (words.length){ const p=P(d.pid); const s=(pname(p)+' '+d.prod.yr+' '+B(d.prod).name+' '+d.title+' '+teamName(p.tm>=0?p.tm:p.org)+(d.rc?' rc rookie':'')+(d.auto?' auto':'')).toLowerCase(); for (const w of words) if (!s.includes(w)) return false; }
    return true;
  });
  if (f.sort==='val') a.sort((x,y)=>cardValue(y)-cardValue(x));
  else if (f.sort==='name') a.sort((x,y)=>cardName(x).localeCompare(cardName(y)));
  else if (f.sort==='year') a.sort((x,y)=>D(y.k).prod.yr-D(x.k).prod.yr || D(x.k).no-D(y.k).no);
  else a.sort((x,y)=>y.id-x.id);
  return a;
}
function ownedBaseSets(){ const m={}; for (const c of myCards()){ const [pi,sec,no]=c.k.split('|'); if (sec==='b'||sec==='v'||sec==='w'){ (m[pi]||(m[pi]=new Set())).add(+no); } } return m; }
VIEWS.coll = ()=>{
  const s=UI.sub.coll; const tabs=[['cards','Cards'],['sealed','Sealed'],['sets','Sets'],['show','Showcase'],['stats','Stats']];
  let body='';
  if (s==='cards'){
    const f=UI.cf; const all=collFiltered(); const per=48; const page=Math.min(f.page, Math.max(0,Math.ceil(all.length/per)-1));
    const chip=(k,n)=>`<button class="chip ${f.f===k?'on':''}" data-act="cff" data-a="${k}">${n}</button>`;
    const nNew=myCards().filter(c=>c.nw).length; const bulk=bulkEligible();
    body=`${tip('coll', `Everything you own lives here. Tap a card to inspect it, see what it's worth, list it for sale, send it to GCS or pin it to your showcase. Value ranges are estimates from recent sales, not promises.`)}
    <div class="tools"><input class="inp grow" type="search" placeholder="Search your cards" value="${esc(f.q)}" data-inp="cfq" aria-label="Search collection">
      <select class="inp" data-chg="cfsort" aria-label="Sort">${[['new','Newest'],['val','Value'],['name','Player'],['year','Year']].map(([k,n])=>`<option value="${k}" ${f.sort===k?'selected':''}>${n}</option>`).join('')}</select></div>
    <div class="chips" style="margin-bottom:12px">${chip('all','All')}${chip('new','New'+(nNew?' ('+nNew+')':''))}${chip('hits','Hits')}${chip('rc','Rookies')}${chip('graded','Graded')}${chip('raw','Raw')}${chip('fav','Favourites')}${chip('listed','Listed')}</div>
    <div class="small muted" style="margin-bottom:8px">${all.length} card${all.length===1?'':'s'}${nNew?` <button class="linkbtn" data-act="seenall">Mark all as seen</button>`:''}</div>
    <div class="grid">${all.slice(page*per,page*per+per).map(c=>gcell(c)).join('')}</div>
    ${all.length?'':`<div class="empty">${myCards().length?'Nothing matches.':'No cards yet. Buy a pack under Cards.'}</div>`}
    ${pager(all.length,per,page,'cpage')}
    ${bulk.length>=10?`<div class="panel" style="margin-top:16px"><div class="phead"><h3>Bulk commons</h3></div><p class="small muted" style="margin:0 0 8px">${bulk.length} raw base cards worth well under a dollar each. A dealer will take them as bulk at 4 cents a card. Rookies, parallels, favourites and showcase cards are never included.</p><button class="btn sm" data-act="bulk" data-confirm="Sell ${bulk.length} for ${money(bulk.length*0.04,true)}">Sell bulk for ${money(bulk.length*0.04,true)}</button></div>`:''}`;
  } else if (s==='sealed'){
    const mine=mySealed();
    body=`${tip('sealed', `Sealed product is a decision: open it now, or hold it. Boxes that leave retail shelves can climb in value if the rookie class gets hot, or sag if it doesn't.`)}
    <div class="panel"><div class="rows">${mine.map(sd=>{ const prod=G.products[sd.p]; return `<div class="row" data-act="sealed" data-a="${sd.id}">${miniSealed(sd)}<div class="rt"><b>${esc(prodName(prod))}</b><span>${FMT_NAME[sd.f]}, ${formatLine(prod,sd.f)}</span><span>Est. ${fmtRange(estRange(sealedKey(prod,sd.f)))}${sd.l?', listed':''}</span></div>${sd.l?'':`<button class="btn pri sm" data-act="opensealed" data-a="${sd.id}">Open</button>`}</div>`; }).join('')||'<div class="empty">No sealed product. The Shop and the Market both sell it.</div>'}</div></div>`;
  } else if (s==='sets'){
    const own=ownedBaseSets(); const rel=G.products.filter(p=>p.cl).sort((a,b)=>b.rel-a.rel);
    body=`${tip('sets', `Set collectors chase every base card in a product. Tap a set to see its checklist; tap a missing number to find it on the market.`)}
    <div class="panel"><div class="rows">${rel.map(prod=>{ const n=own[prod.id]?own[prod.id].size:0, t=prod.cl.base.length; return `<button class="row" data-act="setsheet" data-a="${prod.id}"><div class="rt"><b>${esc(prodName(prod))}</b><span>${n} of ${t} base cards</span><div class="bar" style="margin-top:4px;max-width:260px"><i style="width:${(n/t*100).toFixed(1)}%"></i></div></div><div class="rv"><b>${Math.floor(n/t*100)}%</b></div></button>`; }).join('')}</div></div>`;
  } else if (s==='show'){
    const sh=G.player.show;
    body=`${tip('show', `Your showcase has six slots for the cards you're proudest of. Pin a card from its detail sheet.`)}<div class="slotgrid">${[0,1,2,3,4,5].map(i=>{ const c=sh[i]!=null?C(sh[i]):null; if (sh[i]!=null && (!c||c.o!==0)) delete sh[i];
      return `<div class="slot"><h3>Slot ${i+1}</h3>${c&&c.o===0?`<button class="gcell" style="width:100%" data-act="card" data-a="${c.id}">${thumbHTML(c)}<div class="cap"><b>${esc(cardName(c))}</b><span>${esc(shortLine(c))}</span></div></button>`:'<div class="ph">Empty. Pin a card from its detail sheet.</div>'}</div>`; }).join('')}</div>`;
  } else {
    const P_=G.player; const opened=P_.opened.flatMap(o=>o.cards).map(C).filter(Boolean).sort((a,b)=>cardValue(b)-cardValue(a)).slice(0,6);
    const gr=[0,0,0,0,0,0,0,0,0,0,0]; P_.returned.forEach(r=>gr[r.g]++);
    const T=collectionTotals();
    body=`<div class="kpis"><div class="kpi"><small>Packs opened</small><b>${P_.packs}</b></div><div class="kpi"><small>Cards owned</small><b>${myCards().length}</b></div><div class="kpi"><small>Collection estimate</small><b>${rng2(T.total)}</b></div><div class="kpi"><small>Cash</small><b>${money(P_.cash,true)}</b></div>
      <div class="kpi"><small>Hobby money received</small><b>${money(75+P_.paid)}</b></div><div class="kpi"><small>Spent on cards</small><b>${money(P_.bought)}</b></div><div class="kpi"><small>Sales</small><b>${money(P_.sold)}</b></div><div class="kpi"><small>Fees paid</small><b>${money(P_.fees)}</b></div></div>
      <div class="panel" style="margin-top:14px"><h3>Best pulls still in the world</h3><div class="grid" style="margin-top:8px">${opened.map(c=>gcell(c)).join('')||'<div class="empty">Open a pack.</div>'}</div></div>
      <div class="panel" style="margin-top:14px"><h3>Your GCS record</h3>${P_.returned.length?`<table class="tbl"><tbody>${[10,9,8,7,6,5,4,3,2,1].filter(g=>gr[g]).map(g=>`<tr><td>GCS ${g} ${GRADE_NAMES[g]}</td><td class="r">${gr[g]}</td></tr>`).join('')}</tbody></table>`:'<div class="empty">Nothing graded yet.</div>'}<div class="small muted" style="margin-top:6px">${SKILL_NAMES[skillLevel()]}, ${P_.skill} card${P_.skill===1?'':'s'} graded.</div></div>`;
  }
  return `<div class="pagetitle"><h1>Collection</h1><span class="muted small">${myCards().length} cards, ${mySealed().length} sealed</span></div>
  <div class="subtabs">${tabs.map(([k,n])=>`<button class="${s===k?'on':''}" data-act="sub" data-a="coll:${k}">${n}</button>`).join('')}</div>${body}`;
};
let cfqT=null;
ACT.cfq = v=>{ UI.cf.q=v; UI.cf.page=0; clearTimeout(cfqT); cfqT=setTimeout(()=>{ const a=document.activeElement; const pos=a&&a.selectionStart; render(true); const i=$('[data-inp="cfq"]'); if (i){ i.focus(); try{ i.setSelectionRange(pos,pos); }catch(e){} } }, 220); };
ACT.cfsort = v=>{ UI.cf.sort=v; UI.cf.page=0; render(true); };
ACT.cff = a=>{ UI.cf.f=a; UI.cf.page=0; render(true); };
ACT.cpage = a=>{ UI.cf.page=+a; render(); window.scrollTo(0,0); };
ACT.seenall = ()=>{ myCards().forEach(c=>delete c.nw); render(true); queueSave(); };
ACT.bulk = (a,el)=>{ if (!armed(el)) return; const [n,cash]=bulkSell(bulkEligible().map(c=>c.id)); showToast('Sold '+n+' commons as bulk for '+money(cash,true), true); render(true); afterAction(); };

function setSheet(pid){
  const prod=G.products[pid]; const own=ownedBaseSets()[pid]||new Set(); const cl=prod.cl;
  const mineByNo={}; for (const c of myCards()){ const [pi,sec,no]=c.k.split('|'); if (+pi===pid && (sec==='b'||sec==='v'||sec==='w') && !mineByNo[no]) mineByNo[no]=c.id; }
  const insProg = B(prod).ins.map((ins,ii)=>{ const have=new Set(myCards().filter(c=>c.k.startsWith(pid+'|i'+ii+'|')).map(c=>c.k.split('|')[2])); return `<tr><td>${esc(ins.n)}</td><td class="r">${have.size} of ${cl.ins[ii].length}</td></tr>`; }).join('');
  return { t: prodName(prod)+' set', h:`<div class="stack"><div class="kpis"><div class="kpi"><small>Base set</small><b>${own.size} / ${cl.base.length}</b></div><div class="kpi"><small>Missing</small><b>${cl.base.length-own.size}</b></div></div>
    <p class="small muted" style="margin:0">Dark squares are cards you own. A red underline marks rookies and first cards. Tap a missing number to see that card and any copies for sale.</p>
    <div class="checkgrid">${cl.base.map((e,i)=>`<button class="${own.has(i)?'have':''} ${e[1]&3?'rc':''}" title="#${i+1} ${esc(pname(P(e[0])))}" data-act="${own.has(i)?'card':'design'}" data-a="${own.has(i)?mineByNo[i]:dk(prod,'b',i,'')}">${i+1}</button>`).join('')}</div>
    ${insProg?`<div class="panel"><h3>Insert sets</h3><table class="tbl"><tbody>${insProg}</tbody></table></div>`:''}</div>` };
}
ACT.setsheet = a=>openSheet(()=>setSheet(+a));

// ---- card detail ----
function listForm(it, ref, key, g, card){
  const r=estRange(key, g, card); const mid=nicePrice((r.lo+r.hi)/2); const f=UI.lf||(UI.lf={ty:'bin'});
  return `<div class="panel"><h3>Sell it</h3>
    <div class="seg" style="margin-top:6px"><button class="${f.ty==='bin'?'on':''}" data-act="lfty" data-a="bin">Buy now</button><button class="${f.ty==='auc'?'on':''}" data-act="lfty" data-a="auc">Auction</button></div>
    <div class="formrow"><label class="small muted" for="lprice">${f.ty==='bin'?'Price':'Starting bid'}</label><input class="inp money-in" type="number" id="lprice" min="0.5" step="0.5" value="${f.ty==='bin'?mid:nicePrice(Math.max(0.99,mid*0.5))}" data-inp="lfp">
      ${f.ty==='auc'?`<select class="inp" id="ldur" aria-label="Duration"><option value="3">3 days</option><option value="5" selected>5 days</option><option value="7">7 days</option></select>`:`<label class="small"><input type="checkbox" id="loff" checked> Accept offers</label>`}</div>
    <div class="small muted" id="lnet" style="margin-top:6px">${payoutTxt(f.ty==='bin'?mid:nicePrice(Math.max(0.99,mid*0.5)))}</div>
    <div class="formrow"><button class="btn pri" data-act="listit" data-a="${it}:${ref}">List it</button></div><div id="lmsg"></div></div>`;
}
function payoutTxt(v){ return v>0? `If it sells at ${money(v,true)}, you receive ${money(v*(1-FEE),true)} after the 10% marketplace fee.` : ''; }
ACT.lfty = a=>{ UI.lf={ty:a}; refreshSheet(); };
ACT.lfp = v=>{ const el=$('#lnet'); if (el) el.textContent=payoutTxt(parseFloat(v)); };
ACT.listit = a=>{
  const [it,ref]=a.split(':'); const ty=(UI.lf||{ty:'bin'}).ty; const price=Math.round(parseFloat($('#lprice').value)*100)/100;
  const dur = ty==='auc'? +$('#ldur').value : 0; const off = ty==='bin'? $('#loff').checked : false;
  const err=playerList(it, +ref, ty, price, dur, off);
  if (err){ $('#lmsg').innerHTML=`<div class="err" style="margin-top:6px">${esc(err)}</div>`; return; }
  showToast((ty==='auc'?'Auction started at ':'Listed for ')+money(price,true), true); refresh(); afterAction();
};
function historyHTML(c){
  const h=(c.h||[]).slice().reverse(); if (!h.length) return '';
  return `<div class="panel"><h3>This card's history</h3><table class="tbl"><tbody>${h.map(x=>`<tr><td>${fmtDate(x[0],true)}</td><td>${esc(x[1])}${x[3]?' <span class="muted">'+(x[1]==='Sold'?'to ':'from ')+esc(x[3])+'</span>':''}</td><td class="r">${x[2]?money(x[2],true):''}</td></tr>`).join('')}</tbody></table></div>`;
}
function cardSheet(cid){
  const c=C(cid); if (!c) return null; delete c.nw;
  const d=D(c.k), p=P(d.pid); const mine=c.o===0;
  const acq = c.a ? (c.a[1]==='pulled'? 'Pulled from a pack, '+fmtDate(c.a[0],true) : ({won:'Won at auction',found:'Found',lot:'Came in a collection',break:'Won in a group break',inherited:'Inherited'}[c.a[1]]||'Bought')+' for '+money(c.a[2],true)+(c.a[3]?' from '+c.a[3]:'')+', '+fmtDate(c.a[0],true)) : '';
  const fav=G.player.fav.includes(c.id); const slot=Object.keys(G.player.show).find(k=>G.player.show[k]===c.id);
  let act='';
  if (mine){
    if (c.l) act=`<div class="panel"><h3>Listed for sale</h3><button class="btn" data-act="listing" data-a="${c.l}">View your listing</button></div>`;
    else if (c.g<0){ const s=G.player.subs.find(x=>x.cid===c.id); act=`<div class="panel"><h3>At GCS</h3><p class="small" style="margin:0">Due back ${s?fmtDate(s.t1,true):'soon'}.</p></div>`; }
    else act=listForm('c', c.id, c.k, c.g>0?c.g:0, c) + (c.g===0?`<div class="panel"><h3>Grading</h3><p class="small muted" style="margin:0 0 8px">A GCS slab locks in a condition grade. High grades on the right card multiply value; low grades can sell for less than raw.</p><button class="btn" data-act="gradesheet" data-a="${c.id}">Send to GCS</button></div>`:'');
  }
  const note = mine? `<div class="panel"><h3>Your notes</h3><textarea class="inp" style="width:100%;min-height:60px" data-inp="note" data-cid="${c.id}" placeholder="Where you got it, what you paid, why it matters">${esc(G.player.notes[c.id]||'')}</textarea></div>` : '';
  return { t:pname(p), h:`<div class="stack"><div class="detail">${bigCardHTML(c)}<div class="stack">
    <div class="title-block"><div class="yr">${esc(cardLine(d))}</div><h1>${esc(pname(p))}</h1><div class="sub">${esc(d.title)}</div>${tagsHTML(d,c)}</div>
    <dl class="kv"><dt>Player</dt><dd>${pLink(p)}, ${esc(p.pos)}, ${esc(statusOf(p))}</dd><dt>Estimated value</dt><dd class="est">${rangeTxt(c.k,c.g>0?c.g:0,c)}</dd>${c.g>0?`<dt>Grade</dt><dd>GCS ${c.g} ${GRADE_NAMES[c.g]}, cert ${c.cert}</dd>`:''}${acq?`<dt>Acquired</dt><dd>${esc(acq)}</dd>`:''}${!mine?`<dt>Owner</dt><dd>${esc(ownerName(c.o))}</dd>`:''}</dl>
    ${mine?`<div class="formrow"><button class="btn sm" data-act="fav" data-a="${c.id}">${fav?'Unfavourite':'Favourite'}</button><button class="btn sm" data-act="pin" data-a="${c.id}">${slot!=null?'Remove from showcase':'Pin to showcase'}</button><button class="btn sm" data-act="design" data-a="${esc(c.k)}">All copies</button></div>`:''}
    ${c.g>0?`<div><b class="small">GCS population</b>${popHTML(c.k)}</div>`:c.g===0?`<div><b class="small">${mine?'Condition in hand':'Condition'}</b>${inspectHTML(c,!mine)}</div>`:''}
  </div></div>${act}${salesPanel(c.k, c.g>0?c.g:0)}${compsHTML(d)}${historyHTML(c)}${note}</div>` };
}
ACT.card = a=>{ UI.lf={ty:'bin'}; if (UI.open) closeOpener(); openSheet(()=>cardSheet(+a)); };
ACT.fav = a=>{ const id=+a, f=G.player.fav, i=f.indexOf(id); if (i>=0) f.splice(i,1); else f.push(id); refresh(); queueSave(); };
ACT.pin = a=>{ const id=+a, sh=G.player.show; const k=Object.keys(sh).find(k=>sh[k]===id); if (k!=null) delete sh[k]; else { const free=[0,1,2,3,4,5].find(i=>sh[i]==null || !C(sh[i]) || C(sh[i]).o!==0); if (free==null){ showToast('Your showcase is full. Remove a card first.'); return; } sh[free]=id; showToast('Pinned to showcase slot '+(free+1)); } refresh(); queueSave(); };
let noteT=null; ACT.note = (v,el)=>{ G.player.notes[el.dataset.cid]=v; if (!v) delete G.player.notes[el.dataset.cid]; clearTimeout(noteT); noteT=setTimeout(queueSave,500); };

// ---- sealed detail ----
function sealedSheet(sid){
  const s=G.sealed[sid]; if (!s || s.o!==0) return null; const prod=G.products[s.p]; const k=sealedKey(prod,s.f);
  return { t:prodName(prod), h:`<div class="stack"><div class="detail"><div class="bigcard"><div class="face">${packArt(prod,s.f)}</div></div><div class="stack">
    <div class="title-block"><div class="yr">Sealed ${FMT_NAME[s.f].toLowerCase()}, ${formatLine(prod,s.f)}</div><h1>${esc(prodName(prod))}</h1></div>
    <dl class="kv"><dt>Estimated value</dt><dd class="est">${fmtRange(estRange(k))}</dd>${s.a?`<dt>Acquired</dt><dd>${s.a[2]?'Paid '+money(s.a[2],true)+(s.a[3]?' at '+esc(s.a[3]==='Card shop'?'the card shop':s.a[3]):''):''} ${fmtDate(s.a[0],true)}</dd>`:''}<dt>At retail</dt><dd>${inRetail(prod)?'Yes, '+money(B(prod).formats[s.f].price):'No longer'}</dd></dl>
    ${s.l?`<button class="btn" data-act="listing" data-a="${s.l}">View your listing</button>`:`<div class="formrow"><button class="btn pri" data-act="opensealed" data-a="${s.id}" data-confirm="Rip it">Open it</button><button class="linkbtn" data-act="product" data-a="${prod.id}">Odds and checklist</button></div>`}
  </div></div>${s.l?'':listForm('s', s.id, k, null, null)}${salesPanel(k,null,'Recent sealed sales')}</div>` };
}
ACT.sealed = a=>{ UI.lf={ty:'bin'}; openSheet(()=>sealedSheet(+a)); };
ACT.opensealed = (a,el,e)=>{ if (e) e.stopPropagation(); const err=openSealed(+a); if (err){ showToast(err); return; } closeSheet(true); refresh(); saveGame(); startOpener(); };
ACT.resume = ()=>{ closeSheet(true); startOpener(); };

// ===================== GRADING =====================
function gradeSheet(cid){
  const c=C(cid); if (!c || c.o!==0 || c.g!==0 || c.l) return null; const d=D(c.k), p=P(d.pid);
  const vals=[10,9,8,7].map(g=>`<tr><td>GCS ${g} ${GRADE_NAMES[g]}</td><td class="r">${fmtRange(estRange(c.k,g))}</td></tr>`).join('');
  return { t:'Send to GCS', h:`<div class="stack"><div class="detail">${bigCardHTML(c)}<div class="stack">
    <div class="title-block"><div class="yr">${esc(cardLine(d))}</div><h1>${esc(pname(p))}</h1><div class="sub">${esc(d.title)}</div></div>
    <dl class="kv"><dt>Raw today</dt><dd class="est">${rangeTxt(c.k,0,c)}</dd></dl>
    <div><b class="small">Your inspection</b>${inspectHTML(c,false)}</div></div></div>
    <div class="panel"><h3>What slabs of this card sell for</h3><table class="tbl"><tbody>${vals}</tbody></table><p class="small muted" style="margin:6px 0 0">GCS grades what it sees, not what you hope. Fees are paid up front and aren't refunded.</p></div>
    <div class="panel"><h3>Choose a service level</h3><div class="rows">${GRADE_TIERS.map(T=>`<div class="row" style="cursor:default"><div class="rt"><b>${T.n}, ${money(T.fee)}</b><span>Back in ${T.days} days, around ${fmtDate(G.day+T.days)}</span></div><button class="btn ${T.id==='std'?'pri':''} sm" data-act="submitgrade" data-a="${c.id}:${T.id}" data-confirm="Pay ${money(T.fee)}" ${G.player.cash<T.fee?'disabled':''}>Submit</button></div>`).join('')}</div></div></div>` };
}
ACT.gradesheet = a=>openSheet(()=>gradeSheet(+a));
ACT.submitgrade = (a,el)=>{ if (!armed(el)) return; const [cid,t]=a.split(':'); const err=submitGrading(+cid,t); if (err){ showToast(err); return; } showToast('Shipped to GCS. It will be back around '+fmtDate(G.player.subs[G.player.subs.length-1].t1)+'.', true); closeSheet(); refresh(); afterAction(); };
VIEWS.grade = ()=>{
  const P_=G.player; const back=P_.returned.slice(0,12);
  const el=myCards().filter(c=>c.g===0 && !c.l).sort((a,b)=>cardValue(b)-cardValue(a)).slice(0,40);
  const html=`<div class="pagetitle"><h1>Grading</h1><span class="muted small">${SKILL_NAMES[skillLevel()]}</span></div>
  ${tip('grade', `GCS (Grading Certification Services) seals cards in a slab with a 1 to 10 grade. Condition is hidden: you inspect a card and form a read, and your read gets sharper the more cards you send in. A 10 on a popular rookie can be worth many times the raw card; a 7 usually isn't.`)}
  <div class="kpis"><div class="kpi"><small>Economy</small><b>${money(18)}, 14 days</b></div><div class="kpi"><small>Standard</small><b>${money(35)}, 7 days</b></div><div class="kpi"><small>Express</small><b>${money(80)}, 3 days</b></div><div class="kpi"><small>Cards graded</small><b>${P_.skill}</b></div></div>
  <div class="cols" style="margin-top:14px"><div class="stack">
    <div class="panel"><div class="phead"><h3>Your best raw cards</h3></div><div class="rows">${el.map(c=>`<div class="row" data-act="gradesheet" data-a="${c.id}">${miniCard(c)}<div class="rt"><b>${esc(cardName(c))}</b><span>${esc(shortLine(c))}</span><span>Raw ${fmtRange(estRange(c.k,0,c))}</span></div><button class="btn sm" data-act="gradesheet" data-a="${c.id}">Inspect</button></div>`).join('')||'<div class="empty">No raw cards to submit.</div>'}</div></div>
  </div><div class="stack">
    <div class="panel"><div class="phead"><h3>At GCS now</h3></div><div class="rows">${P_.subs.map(s=>{ const c=C(s.cid); const T=GRADE_TIERS.find(x=>x.id===s.tier); return `<div class="row" data-act="card" data-a="${c.id}">${miniCard(c)}<div class="rt"><b>${esc(cardName(c))}</b><span>${T.n}, due ${fmtDate(s.t1)}</span></div></div>`; }).join('')||'<div class="empty">Nothing submitted.</div>'}</div></div>
    <div class="panel"><div class="phead"><h3>Recently returned</h3></div><div class="rows">${back.map(r=>{ const c=C(r.cid); if (!c) return ''; return `<div class="row" data-act="card" data-a="${c.id}">${miniCard(c)}<div class="rt"><b>${esc(cardName(c))}</b><span>${fmtDate(r.t)}${r.seen?'':', new'}</span></div><div class="rv"><b>GCS ${r.g}</b><span>${GRADE_NAMES[r.g]}</span></div></div>`; }).join('')||'<div class="empty">Nothing back yet.</div>'}</div></div>
  </div></div>`;
  P_.returned.forEach(r=>r.seen=1);
  return html;
};

// ===================== BASEBALL =====================
function leaders(){
  const act=G.players.filter(p=>p.tm>=0 && p.cur);
  const hit=act.filter(p=>!isPitcher(p)), pit=act.filter(isPitcher);
  const maxAB=Math.max(1,...hit.map(p=>p.cur[1])), maxO=Math.max(1,...pit.filter(p=>p.pos==='SP').map(p=>p.cur[2]));
  const q=hit.filter(p=>p.cur[1]>=maxAB*0.55), qp=pit.filter(p=>p.cur[2]>=maxO*0.5);
  const top=(arr,f,n,asc)=>arr.map(p=>[p,f(p)]).sort((a,b)=>asc?a[1]-b[1]:b[1]-a[1]).slice(0,n||5);
  return [
    ['Batting average', top(q,p=>p.cur[2]/Math.max(1,p.cur[1])), v=>v.toFixed(3).replace(/^0/,'')],
    ['Home runs', top(hit,p=>p.cur[3]), v=>v], ['Runs batted in', top(hit,p=>p.cur[4]), v=>v], ['Stolen bases', top(hit,p=>p.cur[5]), v=>v],
    ['ERA', top(qp,p=>p.cur[6]*27/Math.max(1,p.cur[2]),5,true), v=>v.toFixed(2)], ['Wins', top(pit,p=>p.cur[3]), v=>v], ['Strikeouts', top(pit,p=>p.cur[5]), v=>v], ['Saves', top(pit,p=>p.cur[7]), v=>v]
  ];
}
function standingsHTML(){
  return LEAGUES.map((lg,li)=>{ const ts=TEAMS_DEF.map((T,i)=>i).filter(i=>i%2===li).sort((a,b)=>winPct(b)-winPct(a)); const lead=G.stand[ts[0]];
    return `<div class="panel"><h3>${lg} League</h3><div class="tblwrap"><table class="tbl"><thead><tr><th>Team</th><th class="r">W</th><th class="r">L</th><th class="r">Pct</th><th class="r">GB</th></tr></thead><tbody>${ts.map(i=>{ const s=G.stand[i]; const gb=((lead[0]-s[0])+(s[1]-lead[1]))/2; return `<tr><td>${esc(teamName(i))}</td><td class="r">${s[0]}</td><td class="r">${s[1]}</td><td class="r">${winPct(i).toFixed(3).replace(/^0/,'')}</td><td class="r">${gb?gb.toFixed(1):'–'}</td></tr>`; }).join('')}</tbody></table></div></div>`; }).join('');
}
function playerRow(p, right){ return `<button class="row" data-act="player" data-a="${p.id}"><div class="rt"><b>${esc(pname(p))}</b><span>${esc(p.pos)}, ${esc(p.tm>=0?teamName(p.tm):statusOf(p))}, age ${ageOf(p)}</span></div><div class="rv">${right||''}</div></button>`; }
function scoutGrade(p){ return Math.round(clamp(p.pot + (hashStr('sc'+p.id)%9-4),20,80)/5)*5; }
VIEWS.ball = ()=>{
  const s=UI.sub.ball; const tabs=[['news','News'],['stand','Standings'],['lead','Leaders'],['pros','Prospects'],['players','Players']];
  const yr=yearOf(G.day); const d=seasonDates(yr); const phase = G.day<d.open?'Spring training': G.day<=d.end?'Regular season': G.day<=d.champ?'Postseason':'Offseason';
  let body='';
  if (s==='news'){
    const fol=new Set(G.player.follow); const only=UI.newsF==='f';
    const ns=G.news.filter(n=>n.k!=='comic' && n.k!=='tcg' && n.k!=='xtg' && (!only || (n.p!=null && fol.has(n.p)))).slice(0,60);
    body=`<div class="chips" style="margin-bottom:10px"><button class="chip ${only?'':'on'}" data-act="newsf" data-a="a">Everything</button><button class="chip ${only?'on':''}" data-act="newsf" data-a="f">Players you follow</button></div><div class="panel">${ns.map(newsRow).join('')||'<div class="empty">'+(only?'Follow players from their pages to filter news here.':'No news.')+'</div>'}</div>`;
  } else if (s==='stand'){
    const ch=G.champs[yr-1]; body=`${ch!=null?`<p class="small muted" style="margin:0 0 10px">${yr-1} champions: ${esc(teamName(ch))}.</p>`:''}<div class="cols">${standingsHTML()}</div>`;
  } else if (s==='lead'){
    body=`<div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px">${leaders().map(([n,arr,fmt])=>`<div class="panel"><h3>${n}</h3><div class="rows">${arr.map(([p,v])=>playerRow(p,`<b>${fmt(v)}</b>`)).join('')}</div></div>`).join('')}</div>`;
  } else if (s==='pros'){
    const pr=prospectRank().slice(0,50);
    body=`${tip('pros', `Prospect cards are pure speculation: their value rides on hype and scouting reports before a single big-league at-bat. Scouting grades are estimates, and some prospects bust.`)}<div class="panel"><div class="rows">${pr.map((p,i)=>`<button class="row" data-act="player" data-a="${p.id}"><div class="rv" style="text-align:left;min-width:30px"><b>${i+1}</b></div><div class="rt"><b>${esc(pname(p))}</b><span>${esc(p.pos)}, age ${ageOf(p)}, ${esc(p.tm>=0?teamName(p.tm)+' (called up)':TEAMS_DEF[p.org][0]+' system')}</span></div><div class="rv"><b>${scoutGrade(p)}</b><span>scout grade</span></div></button>`).join('')}</div></div>`;
  } else {
    const q=UI.pq.trim().toLowerCase(); const words=q.split(/\s+/).filter(Boolean);
    const res = words.length? G.players.filter(p=>{ const s=(pname(p)+' '+teamName(p.tm>=0?p.tm:p.org)+' '+p.pos).toLowerCase(); return words.every(w=>s.includes(w)); }).sort((a,b)=>b.S-a.S).slice(0,40) : [];
    const fol=G.player.follow.map(P);
    const hot=G.players.filter(p=>p.tm!==-1).sort((a,b)=>b.hy-a.hy).slice(0,8);
    body=`<div class="tools"><input class="inp grow" type="search" placeholder="Search players or teams" value="${esc(UI.pq)}" data-inp="pq" aria-label="Search players"></div>
    ${words.length?`<div class="panel"><div class="rows">${res.map(p=>playerRow(p,`<span>${esc(interestLabel(p))}</span>`)).join('')||'<div class="empty">No players found.</div>'}</div></div>`:''}
    <div class="cols" style="margin-top:12px"><div class="panel"><h3>Following</h3><div class="rows">${fol.map(p=>playerRow(p,`<span class="${trendOf(p)[1]}">${trendOf(p)[0]}</span>`)).join('')||'<div class="empty">Follow players from their pages.</div>'}</div></div>
    <div class="panel"><h3>Names the hobby is talking about</h3><div class="rows">${hot.map(p=>playerRow(p,`<span class="${trendOf(p)[1]}">${trendOf(p)[0]}</span>`)).join('')}</div></div></div>`;
  }
  return `<div class="pagetitle"><h1>Baseball</h1><span class="muted small">${yr} ${phase}</span></div><div class="subtabs">${tabs.map(([k,n])=>`<button class="${s===k?'on':''}" data-act="sub" data-a="ball:${k}">${n}</button>`).join('')}</div>${body}`;
};
ACT.newsf = a=>{ UI.newsF=a; render(true); };
let pqT=null; ACT.pq = v=>{ UI.pq=v; clearTimeout(pqT); pqT=setTimeout(()=>{ const a=document.activeElement; const pos=a&&a.selectionStart; render(true); const i=$('[data-inp="pq"]'); if (i){ i.focus(); try{ i.setSelectionRange(pos,pos); }catch(e){} } }, 220); };

const AWN={MVP:'Most Valuable Player',ACE:'Top Pitcher award',ROY:'Rookie of the Year',AS:'All-Star',CH:'Champion',HOH:'Hall of Honor'};
function playerSheet(pid){
  const p=P(pid); if (!p) return null; const pit=isPitcher(p); const fol=G.player.follow.includes(p.id);
  const [tr,tc]=trendOf(p);
  const yrs=Object.keys(p.car).filter(k=>k!=='tot').map(Number).sort((a,b)=>b-a);
  const hdr = pit? ['Year','Team','G','W-L','ERA','K','SV'] : ['Year','Team','G','AVG','HR','RBI','SB'];
  const line=(y,t,s)=> pit? [y,teamAbbr(t),s[0],s[3]+'-'+s[4],s[2]?(s[6]*27/s[2]).toFixed(2):'–',s[5],s[7]] : [y,teamAbbr(t),s[0],s[1]?(s[2]/s[1]).toFixed(3).replace(/^0/,''):'–',s[3],s[4],s[5]];
  const rows=[]; if (p.cur && p.cur[0]>0) rows.push(line(yearOf(G.day),p.tm,p.cur)); yrs.forEach(y=>rows.push(line(y,p.car[y].t,p.car[y].s)));
  const aw={}; p.aw.forEach(([y,c])=>{ (aw[c]=aw[c]||[]).push(y); });
  const mine=myCards().filter(c=>D(c.k).pid===p.id);
  const lst=G.lst.filter(l=>l.it==='c' && D(C(l.ref).k).pid===p.id).sort((a,b)=>(b.ty==='auc'?b.cur:b.pr)-(a.ty==='auc'?a.cur:a.pr)).slice(0,12);
  const sales=[]; for (const k in G.sales){ if (k[0]==='S'||k[0]==='M'||k[0]==='T') continue; if (D(k).pid!==p.id) continue; for (const s of G.sales[k].slice(0,3)) sales.push([s,k]); }
  sales.sort((a,b)=>b[0][0]-a[0][0]);
  const news=G.news.filter(n=>n.p===p.id).slice(0,6);
  const hx=p.hx.slice(-60);
  return { t:pname(p), h:`<div class="stack">
    <div class="title-block"><div class="yr">${esc(p.pos)}, age ${ageOf(p)}${p.num?', #'+p.num:''}</div><h1>${esc(pname(p))}</h1><div class="sub">${esc(statusOf(p))}</div>${p.dy&&p.tm!==-1?`<span class="tag">Debut ${p.dy}</span>`:''}${p.tm===-1?`<span class="tag">Scout grade ${scoutGrade(p)}</span>`:''}${p.inj>0?'<span class="tag">Injured</span>':''}</div>
    <div class="formrow"><button class="btn sm ${fol?'':'pri'}" data-act="follow" data-a="${p.id}">${fol?'Following':'Follow'}</button><button class="btn sm" data-act="findplayer" data-a="${p.id}">Find cards on the market</button></div>
    <div class="kpis"><div class="kpi"><small>Hobby interest</small><b>${esc(interestLabel(p))}</b></div><div class="kpi"><small>Card demand</small><b class="${tc}">${tr}</b></div><div class="kpi"><small>This season</small><b style="font-size:16px">${p.cur&&p.cur[0]?esc(lineStr(p,p.cur)):'–'}</b></div><div class="kpi"><small>Your cards</small><b>${mine.length}</b></div></div>
    ${hx.length>=3?`<div class="panel"><h3>Card market index</h3><p class="small muted" style="margin:0 0 4px">How the hobby has valued this player's cards lately.</p>${sparkSVG(hx,{h:90})}</div>`:''}
    ${Object.keys(aw).length?`<div class="panel"><h3>Honours</h3><dl class="kv">${Object.keys(aw).map(c=>`<dt>${AWN[c]||c}</dt><dd>${aw[c].sort().join(', ')}</dd>`).join('')}</dl></div>`:''}
    ${rows.length?`<div class="panel"><h3>Career</h3><div class="tblwrap"><table class="tbl"><thead><tr>${hdr.map((h,i)=>`<th class="${i>1?'r':''}">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map((v,i)=>`<td class="${i>1?'r':''}">${v}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>`:''}
    ${news.length?`<div class="panel"><h3>In the news</h3>${news.map(newsRow).join('')}</div>`:''}
    ${mine.length?`<div class="panel"><h3>In your collection</h3><div class="grid" style="margin-top:6px">${mine.slice(0,12).map(c=>gcell(c)).join('')}</div></div>`:''}
    <div class="panel"><h3>For sale now</h3><div class="rows">${lst.map(listingRow).join('')||'<div class="empty">No cards of this player listed.</div>'}</div></div>
    <div class="panel"><h3>Recent card sales</h3><div class="rows">${sales.slice(0,10).map(([s,k])=>{ const d=D(k); return `<button class="row" data-act="design" data-a="${esc(k)}">${miniKey(k)}<div class="rt"><b>${esc(d.prod.yr+' '+B(d.prod).short+' '+d.title)}</b><span>${s[2]>0?'GCS '+s[2]:'Raw'}${d.rc?', RC':''}</span></div><div class="rv"><b>${money(s[1],true)}</b><span>${fmtDate(s[0])}</span></div></button>`; }).join('')||'<div class="empty">No recorded sales.</div>'}</div></div>
  </div>` };
}
ACT.player = a=>{ if (UI.open) closeOpener(); openSheet(()=>playerSheet(+a)); };
ACT.follow = a=>{ const id=+a, f=G.player.follow, i=f.indexOf(id); if (i>=0) f.splice(i,1); else f.push(id); refresh(); queueSave(); };
ACT.findplayer = a=>{ const p=P(+a); UI.mf={ q:pname(p).toLowerCase(), type:'all', fmt:'all', sort:'low', page:0 }; ACT.goto('market:browse'); };

// ===================== SETTINGS =====================
function saveStatus(){
  if (CLOUD.db && CLOUD.lastOk) return `Saved to your Claude account at ${new Date(CLOUD.lastOk).toLocaleTimeString([], {hour:'numeric', minute:'2-digit'})}. You can close this page and pick up later, on any device where you're signed in.`;
  if (CLOUD.db && CLOUD.err) return `<span class="err">Couldn't reach your account storage (${esc(CLOUD.err)}). Progress is saved in this browser for now and will sync on the next save.</span>`;
  if (CLOUD.db) return 'Connected to your Claude account storage. Your next save goes there.';
  return G._localOk===false? '<span class="err">Saving isn\'t available in this view. Download a backup before you leave.</span>' : 'Saved in this browser only. Account storage isn\'t available in this view, so download a backup now and then.';
}
function settingsSheet(){
  const th=document.documentElement.dataset.theme||'auto';
  return { t:'Settings', h:`<div class="stack">
    <div class="panel"><h3>Saving</h3><p class="small" style="margin:0 0 8px">${saveStatus()}</p><div class="formrow"><button class="btn sm" data-act="savenow">Save now</button><button class="btn sm" data-act="exportsave">Download a backup</button><label class="btn sm" style="cursor:pointer">Restore a backup<input type="file" accept=".txt,text/plain" data-chg="importsave" style="display:none"></label></div><div id="savemsg"></div></div>
    <div class="panel"><h3>Sound</h3><div class="seg"><button class="${UI.sound?'on':''}" data-act="sound" data-a="1">On</button><button class="${UI.sound?'':'on'}" data-act="sound" data-a="0">Off</button></div></div>
    <div class="panel"><h3>Appearance</h3><div class="seg">${[['auto','Match device'],['light','Light'],['dark','Dark']].map(([k,n])=>`<button class="${th===k?'on':''}" data-act="theme" data-a="${k}">${n}</button>`).join('')}</div></div>
    <div class="panel"><h3>Start over</h3><p class="small muted" style="margin:0 0 8px">Generates a brand-new baseball universe: new players, new histories, new cards. Your current save is replaced.</p><button class="btn sm" data-act="newgame" data-confirm="Tap again to erase and restart">New game</button></div>
    <div class="panel"><h3>About</h3><p class="small muted" style="margin:0">Card Collector Simulator, phase one: baseball. Every team, player, brand and grading company is fictional. The league plays itself; card prices come from what simulated collectors are willing to pay.</p></div></div>` };
}
ACT.exportsave = async ()=>{
  const m=$('#savemsg'); const s=await packState(); const name='card-collector-'+dayToDate(G.day).toISOString().slice(0,10)+'.txt';
  try {
    const dl = window.claude && window.claude.use ? await window.claude.use('downloads') : null;
    if (dl){ await dl.save({ filename:name, data:s }); if (m) m.innerHTML='<div class="ok" style="margin-top:6px">Backup ready.</div>'; return; }
  } catch(e){ if (e && e.code==='declined'){ return; } }
  const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([s],{type:'text/plain'})); a.download=name; document.body.appendChild(a); a.click(); a.remove();
};
ACT.importsave = async (v,el)=>{
  const f=el.files&&el.files[0]; if (!f) return; const m=$('#savemsg');
  try { await importSave(await f.text()); migrate(); closeSheet(true); UI.tab='home'; render(); showToast('Backup restored: '+fmtDate(G.day,true), true); }
  catch(e){ if (m) m.innerHTML='<div class="err" style="margin-top:6px">That file isn\'t a Card Collector save.</div>'; }
};
ACT.settings = ()=>openSheet(settingsSheet);
ACT.savenow = async ()=>{ await saveGame(true); await new Promise(r=>setTimeout(r,50)); await flushCloud(); showToast(CLOUD.lastOk?'Saved to your account.':G._localOk?'Saved in this browser.':'Save failed.', !!(CLOUD.lastOk||G._localOk)); refreshSheet(); };
ACT.sound = a=>{ UI.sound=a==='1'; G.player.sound=UI.sound; refreshSheet(); queueSave(); };
ACT.theme = a=>{ if (a==='auto') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme=a; G.player.theme=a; refreshSheet(); queueSave(); };
ACT.newgame = async (a,el)=>{ if (!armed(el)) return; closeSheet(true); try { localStorage.removeItem(SAVE_KEY); } catch(e){} await startNew(); };
