// ===================== HOME =====================
function collectionTotals(){
  const t={ raw:[0,0], gr:[0,0], sealed:[0,0], listed:[0,0], nRaw:0, nGr:0, nSealed:0, nListed:0 };
  for (const c of myCards()){
    const r=estRange(c.k, c.g>0?c.g:0, c); const bucket = c.l? 'listed' : c.g>0? 'gr' : 'raw';
    t[bucket][0]+=r.lo; t[bucket][1]+=r.hi; t['n'+(bucket==='gr'?'Gr':bucket==='raw'?'Raw':'Listed')]++;
  }
  for (const s of mySealed()){ const r=estRange(sealedKey(G.products[s.p],s.f)); const b=s.l?'listed':'sealed'; t[b][0]+=r.lo; t[b][1]+=r.hi; if (s.l) t.nListed++; else t.nSealed++; }
  t.total=[t.raw[0]+t.gr[0]+t.sealed[0]+t.listed[0], t.raw[1]+t.gr[1]+t.sealed[1]+t.listed[1]];
  return t;
}
function rng2(a){ return a[1]<0.5? '$0' : money(nicePrice(a[0]))+'–'+money(nicePrice(a[1])); }
function feedLabel(key){ if (key[0]==='S'){ const [,pid,f]=key.split('|'); return [prodName(G.products[+pid]), FMT_NAME[f]]; } const d=D(key); return [pname(P(d.pid)), d.prod.yr+' '+B(d.prod).short+' '+d.title]; }
VIEWS.home = ()=>{
  const T=collectionTotals();
  const pend=G.player.pending;
  const up=G.products.filter(p=>!p.cl && p.rel>G.day).sort((a,b)=>a.rel-b.rel)[0];
  const alerts=[];
  const offers=myListings().filter(l=>l.offers.length);
  offers.forEach(l=>alerts.push(`<button class="row" data-act="listing" data-a="${l.id}"><div class="rt"><b>${l.offers.length} offer${l.offers.length>1?'s':''} on ${esc(itemLabel(l))}</b><span>Best: ${money(Math.max(...l.offers.map(o=>o.amt)),true)} against your ${money(l.pr,true)}</span></div></button>`));
  outbidLive().forEach(l=>alerts.push(`<button class="row" data-act="listing" data-a="${l.id}"><div class="rt"><b>Outbid: ${esc(itemLabel(l))}</b><span>Now ${money(l.cur,true)}, ${daysLeft(l).toLowerCase()}</span></div></button>`));
  const newG=G.player.returned.filter(r=>!r.seen);
  newG.forEach(r=>{ const c=C(r.cid); if (c) alerts.push(`<button class="row" data-act="card" data-a="${c.id}">${miniCard(c)}<div class="rt"><b>Back from GCS: ${esc(cardName(c))}</b><span>GCS ${r.g} ${GRADE_NAMES[r.g]}</span></div></button>`); });
  const feed=G.feed.filter(f=>f[0]>=G.day-4).slice().sort((a,b)=>b[2]-a[2]).slice(0,6);
  const watch=G.player.watch.map(L).filter(Boolean).slice(0,5);
  const news=G.news.slice(0,7);
  return `<div class="stack">
  ${tip('home', `<b>Welcome to the hobby.</b> ${(G.player.pay||0)>0? 'Hobby money arrives every Friday ('+money(G.player.pay)+').' : 'There is no allowance, so what you spend has to come from what you sell.'} Rip packs under <b>Cards</b>, dig the bins and card shows in the <b>Hunt</b>, find singles in the <b>Market</b>, and press <b>Next day</b> to move time forward: auctions end, grading comes back, games get played and prices react.`)}
  <div class="kpis">
    <div class="kpi"><small>Cash</small><b>${money(G.player.cash,true)}</b></div>
    <div class="kpi"><small>Collection estimate</small><b>${rng2(T.total)}</b></div>
    <div class="kpi"><small>Cards owned</small><b>${T.nRaw+T.nGr+ (myCards().filter(c=>c.l).length)}</b></div>
    <div class="kpi"><small>Listed for sale</small><b>${myListings().length}</b></div>
  </div>
  ${pend?`<div class="panel"><div class="phead"><h3>Unfinished rip</h3></div><p class="small muted" style="margin:0 0 8px">${esc(prodName(G.products[pend.p]))} ${FMT_NAME[pend.f].toLowerCase()}, pack ${pend.pi+1} of ${pend.packs.length}. The cards are already yours; you just haven't looked yet.</p><button class="btn pri" data-act="resume">Keep opening</button></div>`:''}
  <div class="cols">
    <div class="stack">
      ${alerts.length?`<div class="panel"><div class="phead"><h3>Needs your attention</h3></div><div class="rows">${alerts.join('')}</div></div>`:''}
      <div class="panel"><div class="phead"><h3>Hobby and baseball news</h3><button class="linkbtn" data-act="goto" data-a="ball:news">All news</button></div>
        ${news.map(newsRow).join('')||'<div class="empty">Quiet day.</div>'}</div>
    </div>
    <div class="stack">
      ${up?`<div class="panel"><div class="phead"><h3>Next release</h3><button class="linkbtn" data-act="goto" data-a="shop">Schedule</button></div><button class="prod row" data-act="product" data-a="${up.id}"><div class="art">${packArt(up,'pack')}</div><div class="rt"><b>${esc(prodName(up))}</b><span>${fmtDate(up.rel)}, in ${up.rel-G.day} day${up.rel-G.day>1?'s':''}</span><span>${esc(B(up).blurb)}</span></div></button></div>`:''}
      <div class="panel"><div class="phead"><h3>Big sales this week</h3><button class="linkbtn" data-act="goto" data-a="market:sales">More</button></div>
        <div class="rows">${feed.map(f=>{ const [a,b]=feedLabel(f[1]); return `<button class="row" data-act="${f[1][0]==='S'?'product':'design'}" data-a="${f[1][0]==='S'?f[1].split('|')[1]:f[1]}">${f[1][0]==='S'?'':miniKey(f[1])}<div class="rt"><b>${esc(a)}</b><span>${esc(b)}${f[3]>0?', GCS '+(f[1][0]==='M'?gTxt(f[3]):f[3]):''}</span></div><div class="rv"><b>${money(f[2],true)}</b><span>${fmtDate(f[0])}</span></div></button>`; }).join('')||'<div class="empty">No notable sales yet.</div>'}</div></div>
      ${watch.length?`<div class="panel"><div class="phead"><h3>Watching</h3><button class="linkbtn" data-act="goto" data-a="market:watch">All</button></div><div class="rows">${watch.map(listingRow).join('')}</div></div>`:''}
      ${G.player.subs.length?`<div class="panel"><div class="phead"><h3>At GCS</h3><button class="linkbtn" data-act="goto" data-a="grade">Grading</button></div><div class="rows">${G.player.subs.map(s=>{ const c=C(s.cid); return `<button class="row" data-act="card" data-a="${c.id}">${miniCard(c)}<div class="rt"><b>${esc(cardName(c))}</b><span>Due back ${fmtDate(s.t1)}</span></div></button>`; }).join('')}</div></div>`:''}
    </div>
  </div></div>`;
};
function newsRow(n){
  const p = n.p!=null ? P(n.p) : null;
  return `<div class="newsrow"><b>${esc(n.h)}</b><p>${esc(n.b)}</p><div class="meta">${fmtDate(n.t)}${p?` <span aria-hidden="true">|</span> ${pLink(p)}`:''}</div></div>`;
}
ACT.goto = a=>{ const [t,s]=a.split(':'); UI.tab=t; if (s) UI.sub[t]=s; closeSheet(true); render(); window.scrollTo(0,0); };

// ===================== SHOP =====================
function formatLine(prod, f){ const F=B(prod).formats[f]; return F.packs>1 ? `${F.packs} packs of ${F.cards}` : `${F.cards} cards`; }
VIEWS.shop = ()=>{
  const inStore=G.products.filter(inRetail).sort((a,b)=>b.rel-a.rel);
  const soon=G.products.filter(p=>!p.cl && p.rel>G.day).sort((a,b)=>a.rel-b.rel);
  const oop=G.products.filter(p=>p.cl && G.day>=p.retailEnd).sort((a,b)=>b.rel-a.rel);
  const mine=mySealed().filter(s=>!s.l);
  return `<div class="stack">
  ${tip('shop', `Retail product costs what it costs. Expected card value is usually <b>below</b> the price of the pack, so ripping is a gamble. Sealed product is also inventory: it can sell out, leave shelves, and gain or lose value on the secondary market.`)}
  ${mine.length?`<div class="panel"><div class="phead"><h3>Ready to open</h3><button class="linkbtn" data-act="goto" data-a="coll:sealed">Sealed inventory</button></div><div class="rows">${mine.slice(0,6).map(s=>{ const prod=G.products[s.p]; return `<div class="row" data-act="sealed" data-a="${s.id}">${miniSealed(s)}<div class="rt"><b>${esc(prodName(prod))}</b><span>${FMT_NAME[s.f]}</span></div><button class="btn pri sm" data-act="opensealed" data-a="${s.id}">Open</button></div>`; }).join('')}</div></div>`:''}
  <div class="panel"><div class="phead"><h3>On the shelf</h3></div>
  ${inStore.map(prod=>{ const br=B(prod); return `<div style="padding:10px 0;border-top:1px solid var(--line2)">
    <button class="prod row" style="border:0;padding:0" data-act="product" data-a="${prod.id}"><div class="art">${packArt(prod,'pack')}</div><div class="rt"><b style="font-family:var(--hd);font-size:20px">${esc(prodName(prod))}</b><span>Released ${fmtDate(prod.rel)}, on shelves until ${fmtDate(prod.retailEnd)}</span><span>${esc(br.blurb)}</span></div></button>
    <div class="fmts">${Object.keys(br.formats).map(f=>{ const F=br.formats[f]; const st=prod.stock[f]; return `<div class="fmt"><div class="ft"><b>${FMT_NAME[f]} <span class="num">${money(F.price)}</span></b><span>${formatLine(prod,f)}${F.g?', guaranteed '+guarText(F.g):''}. ${st<=0?'<span class="down">Sold out</span>': st<12?`<span class="down">Only ${st} left</span>`:`${st} in stock`}</span></div><button class="btn ${st>0?'pri':''} sm" data-act="buyretail" data-a="${prod.id}:${f}" data-confirm="Pay ${money(F.price)}" ${st<=0||G.player.cash<F.price?'disabled':''}>Buy</button></div>`; }).join('')}</div>
  </div>`; }).join('') || '<div class="empty">Nothing on shelves right now.</div>'}
  </div>
  <div class="cols">
    <div class="panel"><div class="phead"><h3>Release calendar</h3></div><div class="rows">${soon.map(prod=>`<button class="row" data-act="product" data-a="${prod.id}"><div class="rt"><b>${esc(prodName(prod))}</b><span>${esc(B(prod).blurb)}</span></div><div class="rv"><b>${fmtDate(prod.rel)}</b><span>${prod.rel-G.day} days</span></div></button>`).join('')||'<div class="empty">Next year\'s schedule is announced December 1.</div>'}</div></div>
    <div class="panel"><div class="phead"><h3>Off the shelves</h3></div><p class="small muted" style="margin:0 0 6px">No longer at retail. Sealed copies only trade on the marketplace now.</p><div class="rows">${oop.slice(0,14).map(prod=>{ const n=G.lst.filter(l=>l.it==='s'&&G.sealed[l.ref].p===prod.id).length; return `<button class="row" data-act="product" data-a="${prod.id}"><div class="rt"><b>${esc(prodName(prod))}</b><span>${n? n+' sealed listing'+(n>1?'s':'')+' on the market':'No sealed listings right now'}</span></div></button>`; }).join('')}</div></div>
  </div></div>`;
};
function guarText(g){ const a=[]; if (g.auto) a.push(g.auto+' autograph'+(g.auto>1?'s':'')); if (g.num) a.push(g.num+' numbered parallel'); return a.join(' and '); }
ACT.buyretail = (a,el)=>{
  if (!armed(el)) return;
  const [pid,f]=a.split(':'); const err=buyRetail(+pid,f);
  if (err) showToast(err); else { showToast('Added to your sealed inventory: '+prodName(G.products[+pid])+' '+FMT_NAME[f].toLowerCase(), true); }
  refresh(); afterAction();
};
function oddsRows(prod, fmt){
  const br=B(prod), F=br.formats[fmt]; const m=F.retail?RETAIL_HIT_MULT:1; const rows=[];
  const o=n=>'1:'+Math.round(n).toLocaleString('en-US');
  if (br.luxe){ rows.push(['Every pack','3 on-card autographs, 1 patch relic /99, 2 base cards /199']); br.par.forEach(p=>rows.push([p.n+' parallel /'+p.run, o(p.odds)+' base cards'])); br.auto.par.forEach(p=>rows.push(['Autograph '+p.n+' /'+p.run, 'about '+(p.share*100).toFixed(1)+'% of autos'])); return rows; }
  br.par.forEach(p=>rows.push([p.n+(p.run?' /'+p.run:'')+' parallel', o(p.odds)]));
  br.ins.forEach(i=>rows.push([i.n+' insert', o(i.odds)]));
  if (br.sp){ rows.push(['SP image variation', o(br.sp.odds)]); rows.push(['SSP image variation', o(br.sp.ssp)]); }
  if (br.hiSP) rows.push(['High-number short print', '1:3']);
  if (br.auto) rows.push([br.auto.n, o(br.auto.odds*m)]);
  if (br.auto) br.auto.par.forEach(p=>rows.push(['  '+p.n+' auto /'+p.run, 'about '+(p.share*100).toFixed(1)+'% of autos']));
  if (br.relic) rows.push([br.relic.n, o(br.relic.odds*m)]);
  if (br.caseHit) rows.push([br.caseHit.n+' (case hit)', o(br.caseHit.odds*m)]);
  return rows;
}
function productSheet(pid){
  const prod=G.products[pid]; const br=B(prod);
  const fmts=Object.keys(br.formats);
  const retail=inRetail(prod);
  let checklist='<div class="empty">Checklist revealed on release day.</div>';
  if (prod.cl){
    const rcs=prod.cl.base.map((e,i)=>[e,i]).filter(x=>x[0][1]&3).slice(0,60);
    checklist = `<p class="small" style="margin:0 0 6px">${prod.cl.base.length} base cards, ${prod.cl.base.filter(e=>e[1]&1).length} rookies${br.pros?', '+prod.cl.base.filter(e=>e[1]&2).length+' first-card prospects':''}. ${br.ins.length?'Inserts: '+br.ins.map(i=>i.n+' ('+i.size+')').join(', ')+'. ':''}${br.auto?br.auto.n+': '+prod.cl.auto.length+' signers. ':''}${br.relic?br.relic.n+': '+prod.cl.relic.length+' players. ':''}${br.caseHit?br.caseHit.n+': '+prod.cl.caseHit.length+' cards.':''}</p>
    <div class="small"><b>Rookies and first cards</b></div><div class="small" style="columns:2;column-gap:14px">${rcs.map(([e,i])=>`<div>#${i+1} <button class="linkbtn" data-act="player" data-a="${e[0]}">${esc(pname(P(e[0])))}</button> ${e[1]&1?'RC':'1st'}</div>`).join('')}</div>`;
  }
  const sk=fmts.map(f=>{ const k=sealedKey(prod,f); const s=(G.sales[k]||[]).slice(0,5); const n=G.lst.filter(l=>l.it==='s'&&G.sealed[l.ref].p===prod.id&&G.sealed[l.ref].f===f).length;
    return prod.cl && (s.length||n||!retail)? `<div style="margin-top:8px"><b>${FMT_NAME[f]}</b> <span class="muted small">market estimate ${fmtRange(estRange(k))}${n?', '+n+' listed':''}</span>${s.length?saleRows(s,false):''}</div>` : ''; }).join('');
  return { t: prodName(prod), h: `<div class="stack">
    <div class="prod"><div class="art" style="width:90px">${packArt(prod,'pack')}</div><div><div class="small muted">${prod.cl?'Released '+fmtDate(prod.rel,true):'Releases '+fmtDate(prod.rel,true)}</div><p style="margin:4px 0">${esc(br.blurb)}</p>${prod.cl?`<div class="small muted">${retail?'At retail until '+fmtDate(prod.retailEnd):'No longer at retail'}</div>`:''}</div></div>
    ${fmts.map(f=>{ const F=br.formats[f]; const st=prod.stock[f]; return `<div class="fmt"><div class="ft"><b>${FMT_NAME[f]} ${money(F.price)}</b><span>${formatLine(prod,f)}${F.g?', guaranteed '+guarText(F.g):''}${retail? (st<=0?'. Sold out':'. '+st+' in stock'):''}</span></div>${retail?`<button class="btn pri sm" data-act="buyretail" data-a="${prod.id}:${f}" data-confirm="Pay ${money(F.price)}" ${st<=0||G.player.cash<F.price?'disabled':''}>Buy</button>`:`<button class="btn sm" data-act="findsealed" data-a="${prod.id}">Market</button>`}</div>`; }).join('')}
    <div class="panel"><h3>Odds</h3><p class="small muted" style="margin:0 0 6px">Published per pack. ${br.formats.hobby&&!br.luxe?'Hobby box guarantees are added on top of normal pack odds. ':''}${Object.values(br.formats).some(f=>f.retail)&&br.auto?'Autographs, relics and case hits are rarer in retail formats (shown: '+(br.formats.hobby?'hobby':'retail')+').':''}</p>
      <table class="tbl"><tbody>${oddsRows(prod, br.formats.hobby?'hobby':fmts[0]).map(r=>`<tr><td>${esc(r[0])}</td><td class="r">${esc(r[1])}</td></tr>`).join('')}</tbody></table></div>
    <div class="panel"><h3>Checklist</h3>${checklist}</div>
    ${sk?`<div class="panel"><h3>Sealed market</h3>${sk}</div>`:''}
  </div>` };
}
ACT.product = a=>openSheet(()=>productSheet(+a));
ACT.findsealed = a=>{ const prod=G.products[+a]; UI.mf={ q:prod.yr+' '+B(prod).short, type:'sealed', fmt:'all', sort:'low', page:0 }; ACT.goto('market:browse'); };

// ===================== MARKET =====================
const LSCACHE=new Map();
function lsText(l){
  let s=LSCACHE.get(l.id); if (s) return s;
  if (l.it==='s'){ const sd=G.sealed[l.ref]; const prod=G.products[sd.p]; s=(prodName(prod)+' '+B(prod).short+' '+FMT_NAME[sd.f]+' sealed').toLowerCase(); }
  else { const c=C(l.ref), d=D(c.k), p=P(d.pid); s=(pname(p)+' '+d.prod.yr+' '+B(d.prod).name+' '+d.title+' '+d.setName+' '+teamName(p.tm>=0?p.tm:p.org)+' '+teamAbbr(p.tm)+' '+p.pos+(d.rc?' rc rookie':'')+(d.auto?' auto autograph':'')+(c.g>0?' gcs '+c.g:'')).toLowerCase(); }
  LSCACHE.set(l.id,s); return s;
}
function listingRow(l){
  const it=l.it==='s'; let th, a, b;
  if (it){ const s=G.sealed[l.ref]; const prod=G.products[s.p]; th=miniSealed(s); a=prodName(prod); b=FMT_NAME[s.f]+', sealed'; }
  else { const c=C(l.ref), d=D(c.k); th=miniCard(c); a=cardName(c); b=[d.prod.yr+' '+B(d.prod).short+' '+d.title, serialTxt(c), c.g>0?'GCS '+c.g:'', d.rc?'RC':''].filter(Boolean).join(', '); }
  const mine=l.sel===0; const lead=l.lead===0 && l.bids.length;
  const right = l.ty==='auc'
    ? `<b>${money(l.cur,true)}</b><span>${l.bids.length} bid${l.bids.length===1?'':'s'}, ${daysLeft(l).replace('Ends ','').replace(' left','')}</span>`
    : `<b>${money(l.pr,true)}</b><span>${mine?(l.offers.length?l.offers.length+' offer'+(l.offers.length>1?'s':''):'Your listing'):'Buy now'+(l.off?' or offer':'')}</span>`;
  return `<button class="row" data-act="listing" data-a="${l.id}">${th}<div class="rt"><b>${esc(a)}</b><span>${esc(b)}</span>${lead?'<span class="up">You\'re the high bidder</span>':(l.ty==='auc'&&l.bids.some(x=>x[0]===0)?'<span class="down">Outbid</span>':'')}</div><div class="rv">${right}</div></button>`;
}
function marketFiltered(){
  const f=UI.mf; const q=f.q.trim().toLowerCase(); const words=q?q.split(/\s+/):[];
  let a=G.lst.filter(l=>l.sel!==0 || f.type==='mine');
  a=a.filter(l=>{
    if (f.fmt!=='all' && l.ty!==f.fmt) return false;
    if (f.type==='sealed'){ if (l.it!=='s') return false; }
    else if (f.type!=='all'){ if (l.it!=='c') return false; const c=C(l.ref), d=D(c.k);
      if (f.type==='raw' && c.g>0) return false; if (f.type==='graded' && !(c.g>0)) return false; if (f.type==='rc' && !(d.rc||d.first)) return false;
      if (f.type==='auto' && !d.auto) return false; if (f.type==='num' && !d.run) return false; if (f.type==='cheap' && l.pr>5 && l.cur>5) return false; }
    if (words.length){ const s=lsText(l); for (const w of words) if (!s.includes(w)) return false; }
    return true;
  });
  const price=l=>l.ty==='auc'?l.cur:l.pr;
  if (f.sort==='end') a.sort((x,y)=>(x.ty==='auc'?x.en:1e9)-(y.ty==='auc'?y.en:1e9) || y.st-x.st);
  else if (f.sort==='new') a.sort((x,y)=>y.st-x.st||y.id-x.id);
  else if (f.sort==='low') a.sort((x,y)=>price(x)-price(y));
  else if (f.sort==='high') a.sort((x,y)=>price(y)-price(x));
  else if (f.sort==='bids') a.sort((x,y)=>y.bids.length-x.bids.length);
  return a;
}
VIEWS.market = ()=>{
  const s=UI.sub.market;
  const tabs=[['browse','Browse'],['watch','Watching'],['sell','Selling'],['sales','Recent sales']];
  let body='';
  if (s==='browse'){
    const f=UI.mf; const all=marketFiltered(); const per=30; const page=Math.min(f.page, Math.max(0,Math.ceil(all.length/per)-1));
    const chip=(k,n)=>`<button class="chip ${f.type===k?'on':''}" data-act="mft" data-a="${k}">${n}</button>`;
    body=`${tip('market', `Every listing here belongs to another collector with their own taste and budget, and some of them misjudge value. Prices are theirs, not the game's. Check recent sales and comparable parallels before you pay up. Sales carry a 10% marketplace fee for the seller.`)}
    <div class="tools"><input class="inp grow" type="search" placeholder="Player, team, product, parallel..." value="${esc(f.q)}" data-inp="mfq" aria-label="Search listings">
      <select class="inp" data-chg="mfsort" aria-label="Sort">${[['end','Ending soon'],['new','Newly listed'],['low','Price: low to high'],['high','Price: high to low'],['bids','Most bids']].map(([k,n])=>`<option value="${k}" ${f.sort===k?'selected':''}>${n}</option>`).join('')}</select>
      <div class="seg">${[['all','All'],['bin','Buy now'],['auc','Auctions']].map(([k,n])=>`<button class="${f.fmt===k?'on':''}" data-act="mff" data-a="${k}">${n}</button>`).join('')}</div></div>
    <div class="chips" style="margin-bottom:10px">${chip('all','Everything')}${chip('raw','Raw')}${chip('graded','Graded')}${chip('rc','Rookies')}${chip('auto','Autographs')}${chip('num','Numbered')}${chip('sealed','Sealed')}${chip('cheap','Under $5')}</div>
    <div class="panel"><div class="small muted" style="margin-bottom:4px">${all.length} listing${all.length===1?'':'s'}</div><div class="rows" id="mrows">${all.slice(page*per,page*per+per).map(listingRow).join('')||'<div class="empty">Nothing matches. Try fewer words.</div>'}</div>${pager(all.length,per,page,'mpage')}</div>`;
  } else if (s==='watch'){
    const w=G.player.watch.map(L).filter(Boolean); G.player.watch=w.map(l=>l.id);
    const bidding=G.lst.filter(l=>l.ty==='auc'&&l.bids.some(b=>b[0]===0)&&!G.player.watch.includes(l.id));
    body=`<div class="panel"><div class="rows">${w.concat(bidding).map(listingRow).join('')||'<div class="empty">Tap Watch on any listing to follow it here. Auctions you bid on appear automatically.</div>'}</div></div>`;
  } else if (s==='sell'){
    const mine=myListings();
    body=`${tip('sell', `List cards from your <b>Collection</b>. Buy-now listings sell when a collector values the card above your price; auctions let buyers compete; offers let you negotiate. Nothing sells instantly: hot, cheap cards move in days, rare expensive ones can sit for weeks.`)}
    <div class="kpis"><div class="kpi"><small>Active listings</small><b>${mine.length}</b></div><div class="kpi"><small>Lifetime sales</small><b>${money(G.player.sold)}</b></div><div class="kpi"><small>Fees paid</small><b>${money(G.player.fees)}</b></div><div class="kpi"><small>Lifetime purchases</small><b>${money(G.player.bought)}</b></div></div>
    <div class="panel" style="margin-top:14px"><div class="rows">${mine.map(listingRow).join('')||'<div class="empty">You have nothing listed.</div>'}</div></div>
    ${G.player.soldCards.length?`<div class="panel" style="margin-top:14px"><h3>Recently sold</h3><div class="rows">${G.player.soldCards.slice(-12).reverse().map(id=>{ const c=C(id); if(!c) return ''; const h=(c.h||[]).filter(x=>x[1]==='Sold').pop(); return `<button class="row" data-act="design" data-a="${c.k}">${miniCard(c)}<div class="rt"><b>${esc(cardName(c))}</b><span>${h?'to '+esc(h[3])+', '+fmtDate(h[0]):''}</span></div><div class="rv"><b>${h?money(h[2],true):''}</b></div></button>`; }).join('')}</div></div>`:''}`;
  } else {
    const feed=G.feed.slice(0,60);
    body=`<div class="panel"><p class="small muted" style="margin:0 0 6px">Notable completed sales across the hobby, newest first.</p><div class="rows">${feed.map(f=>{ const [a,b]=feedLabel(f[1]); const who = f[4]===0?'You bought':f[5]===0?'You sold':''; return `<button class="row" data-act="${f[1][0]==='S'?'product':'design'}" data-a="${f[1][0]==='S'?f[1].split('|')[1]:f[1]}">${f[1][0]==='S'?'':miniKey(f[1])}<div class="rt"><b>${esc(a)}</b><span>${esc(b)}${f[3]>0?', GCS '+(f[1][0]==='M'?gTxt(f[3]):f[3]):''}${who?', '+who.toLowerCase():''}</span></div><div class="rv"><b>${money(f[2],true)}</b><span>${fmtDate(f[0])}</span></div></button>`; }).join('')}</div></div>`;
  }
  return `<div class="pagetitle"><h1>Marketplace</h1><span class="muted small">${G.lst.length} live listings</span></div>
  <div class="subtabs">${tabs.map(([k,n])=>`<button class="${s===k?'on':''}" data-act="sub" data-a="market:${k}">${n}</button>`).join('')}</div>${body}`;
};
let mfqT=null;
ACT.mfq = v=>{ UI.mf.q=v; UI.mf.page=0; clearTimeout(mfqT); mfqT=setTimeout(()=>{ const el=$('#mrows'); if (!el) return; const all=marketFiltered(); el.innerHTML=all.slice(0,30).map(listingRow).join('')||'<div class="empty">Nothing matches. Try fewer words.</div>'; const pnl=el.parentNode; const pg=pnl.querySelector('.pager'); if (pg) pg.remove(); pnl.insertAdjacentHTML('beforeend', pager(all.length,30,0,'mpage')); pnl.querySelector('.small').textContent=all.length+' listing'+(all.length===1?'':'s'); }, 180); };
ACT.mfsort = v=>{ UI.mf.sort=v; UI.mf.page=0; render(true); };
ACT.mff = a=>{ UI.mf.fmt=a; UI.mf.page=0; render(true); };
ACT.mft = a=>{ UI.mf.type=a; UI.mf.page=0; if (a==='sealed'&&UI.mf.sort==='end') UI.mf.sort='low'; render(true); };
ACT.mpage = a=>{ UI.mf.page=+a; render(); window.scrollTo(0,0); };

// ---- comparables & sales for a design ----
function siblings(d){
  const br=B(d.prod); let list=[];
  if (d.sec==='b') list=[''].concat(br.par.map(p=>p.id));
  else if (d.sec==='a') list=[''].concat(br.auto.par.map(p=>p.id));
  else return [];
  return list.map(par=>dk(d.prod,d.sec,d.no,par));
}
function compsHTML(d){
  const sib=siblings(d); if (sib.length<2) return '';
  const rows=sib.map(k=>{ const e=D(k); const s=(G.sales[k]||[]); const last=s[0]; const n=G.lst.filter(l=>l.it==='c'&&C(l.ref).k===k).length;
    return `<tr class="${k===d.key?'hl':''}" data-act="design" data-a="${k}" style="cursor:pointer"><td>${esc(e.parObj?e.parObj.n:'Base')}${e.run?' /'+e.run:''}</td><td class="r">${last?money(last[1],true)+'<span class="muted small"> '+(last[2]>0?'GCS '+last[2]:'raw')+', '+fmtDate(last[0])+'</span>':'<span class="muted">No sales</span>'}</td><td class="r muted">${s.length} sold${n?', '+n+' listed':''}</td></tr>`; }).join('');
  return `<div class="panel"><h3>Same card, other versions</h3><p class="small muted" style="margin:0 0 6px">Last sale of each parallel. Useful when a version has never sold.</p><div class="tblwrap"><table class="tbl"><tbody>${rows}</tbody></table></div></div>`;
}
function salesPanel(key, g, title){
  const s=salesFor(key, g).slice(0,12); const all=(G.sales[key]||[]);
  const chartPts=salesFor(key,g).slice(0,18).reverse().map(x=>[x[0],x[1]]);
  return `<div class="panel"><h3>${title||'Recent sales'}</h3>${chartPts.length>=3?sparkSVG(chartPts,{axis:true,dots:true,h:110}):''}${s.length?saleRows(s):`<div class="empty">No sales at this grade.${all.length?' Other grades: '+all.slice(0,4).map(x=>money(x[1],true)+' ('+(x[2]>0?'GCS '+x[2]:'raw')+')').join(', '):''}</div>`}</div>`;
}
function popHTML(key){ const p=popOf(key); const tot=p.reduce((a,b)=>a+b,0); if (!tot) return '<span class="muted small">No copies graded yet.</span>'; return `<table class="tbl"><tbody>${[10,9,8,7,6,5].filter(g=>p[g]).map(g=>`<tr><td>GCS ${g} ${GRADE_NAMES[g]}</td><td class="r">${p[g]}</td></tr>`).join('')}${p.slice(1,5).some(x=>x)?`<tr><td>GCS 1 to 4</td><td class="r">${p[1]+p[2]+p[3]+p[4]}</td></tr>`:''}<tr><td><b>Total graded</b></td><td class="r"><b>${tot}</b></td></tr></tbody></table>`; }
function bigCardHTML(c, key){
  const k=c?c.k:key; const s=c?c.s:0;
  const face = c && c.g>0 ? slabSVG(c) : cardFront(k,s);
  return `<div class="bigcard"><div class="face ${c&&c.g>0?'slab':''}" id="bigface" data-front="1">${face}</div><div class="under"><button class="btn sm" data-act="flipbig" data-a="${esc(k)}|${s}|${c?c.id:''}">Flip</button></div></div>`;
}
ACT.flipbig = (a)=>{ const [p0,p1,p2,p3,s,cid]=a.split('|'); const k=[p0,p1,p2,p3].join('|'); const el=$('#bigface'); if (!el) return; const c=cid?C(+cid):null;
  if (el.dataset.front==='1'){ el.innerHTML=cardBack(k,+s); el.dataset.front='0'; el.classList.remove('slab'); } else { el.innerHTML = c&&c.g>0? slabSVG(c) : cardFront(k,+s); el.dataset.front='1'; if (c&&c.g>0) el.classList.add('slab'); } };

function listingSheet(lid){
  const l=L(lid); if (!l) return null;
  const mine=l.sel===0; const watch=G.player.watch.includes(l.id);
  let head, cond='', extra='', title;
  if (l.it==='s'){
    const s=G.sealed[l.ref]; const prod=G.products[s.p]; const k=sealedKey(prod,s.f); title=prodName(prod);
    head=`<div class="bigcard"><div class="face">${packArt(prod,s.f)}</div></div>`;
    cond=`<div class="title-block"><div class="yr">Sealed ${FMT_NAME[s.f].toLowerCase()}, ${formatLine(prod,s.f)}</div><h1>${esc(prodName(prod))}</h1></div>
      <dl class="kv"><dt>Seller</dt><dd>${esc(ownerName(l.sel))}</dd><dt>Market estimate</dt><dd class="est">${fmtRange(estRange(k))}</dd><dt>At retail</dt><dd>${inRetail(prod)?'Yes, '+money(B(prod).formats[s.f].price)+(prod.stock[s.f]<=0?' (sold out)':''):'No longer'}</dd></dl>
      <button class="linkbtn" data-act="product" data-a="${prod.id}">Product details and odds</button>`;
    extra=salesPanel(k,null,'Recent sealed sales');
  } else if (l.it==='m'||l.it==='t'){ title=''; head=''; }
  else {
    const c=C(l.ref), d=D(c.k), p=P(d.pid); title=pname(p);
    head=bigCardHTML(c);
    cond=`<div class="title-block"><div class="yr">${esc(cardLine(d))}</div><h1>${esc(pname(p))}</h1><div class="sub">${esc(d.title)}</div>${tagsHTML(d,c)}</div>
      <dl class="kv"><dt>Seller</dt><dd>${esc(ownerName(l.sel))}</dd><dt>Player</dt><dd>${pLink(p)}, ${esc(p.pos)}, ${esc(statusOf(p))}</dd><dt>Estimated market</dt><dd class="est">${rangeTxt(c.k, c.g>0?c.g:0, c)}</dd>${c.g>0?`<dt>Grade</dt><dd>GCS ${c.g} ${GRADE_NAMES[c.g]}, cert ${c.cert}</dd>`:''}</dl>
      ${c.g>0?`<div style="margin-top:8px"><b class="small">Population</b>${popHTML(c.k)}</div>`:`<div style="margin-top:8px"><b class="small">Condition from the listing photos</b>${inspectHTML(c,!mine)}</div>`}`;
    extra=salesPanel(c.k, c.g>0?c.g:0)+compsHTML(d);
  }
  let act='';
  if (mine){
    act = l.ty==='auc'
      ? `<div class="panel"><h3>Your auction</h3><dl class="kv"><dt>Current bid</dt><dd class="est">${money(l.cur,true)}</dd><dt>Bids</dt><dd>${l.bids.length}</dd><dt>Ends</dt><dd>${fmtDate(l.en)} (${daysLeft(l).toLowerCase()})</dd></dl>${l.bids.length?'':`<div class="formrow"><button class="btn sm" data-act="endlisting" data-a="${l.id}">End listing</button></div>`}</div>`
      : `<div class="panel"><h3>Your listing</h3><dl class="kv"><dt>Price</dt><dd class="est">${money(l.pr,true)}</dd><dt>Listed</dt><dd>${fmtDate(l.st)}, ${G.day-l.st} days ago</dd><dt>Offers</dt><dd>${l.off?'Accepting offers':'Not accepting offers'}</dd></dl>
        <div class="formrow"><input class="inp money-in" type="number" min="0.5" step="0.5" id="reprice" value="${l.pr}" aria-label="New price"><button class="btn sm" data-act="reprice" data-a="${l.id}">Change price</button><button class="btn sm" data-act="endlisting" data-a="${l.id}">End listing</button></div>
        ${l.offers.length?`<h3 style="margin-top:12px">Offers</h3><div class="rows">${l.offers.map(o=>`<div class="row" style="cursor:default"><div class="rt"><b>${money(o.amt,true)} from ${esc(ownerName(o.who))}</b><span>Expires ${fmtDate(o.exp)}. You'd receive ${money(o.amt*(1-FEE),true)}.</span></div><button class="btn pri sm" data-act="offeracc" data-a="${l.id}:${o.id}">Accept</button><button class="btn sm" data-act="offercounter" data-a="${l.id}:${o.id}">Counter</button><button class="btn sm" data-act="offerdec" data-a="${l.id}:${o.id}">Decline</button></div>`).join('')}</div>`:''}</div>`;
  } else if (l.ty==='bin'){
    act = `<div class="panel"><h3>Buy now</h3><div class="est">${money(l.pr,true)}</div>
      <div class="formrow"><button class="btn pri" data-act="buy" data-a="${l.id}" data-confirm="Pay ${money(l.pr,true)}" ${G.player.cash<l.pr?'disabled':''}>Buy now</button><button class="btn" data-act="watch" data-a="${l.id}">${watch?'Watching':'Watch'}</button></div>
      ${l.off?`<div class="formrow"><input class="inp money-in" type="number" min="0.5" step="0.5" id="offeramt" placeholder="Your offer" aria-label="Offer amount"><button class="btn" data-act="offer" data-a="${l.id}">Make offer</button></div>`:'<div class="small muted" style="margin-top:6px">This seller isn\'t taking offers.</div>'}
      ${l.counter?`<div class="formrow"><span class="small">The seller countered at <b>${money(l.counter,true)}</b>.</span><button class="btn sm pri" data-act="acccounter" data-a="${l.id}" data-confirm="Pay ${money(l.counter,true)}">Accept counter</button></div>`:''}
      <div id="offermsg"></div></div>`;
  } else {
    const myb=l.bids.find(b=>b[0]===0); const min = l.bids.length? l.cur+bidInc(l.cur) : l.pr;
    act = `<div class="panel"><h3>Auction</h3><dl class="kv"><dt>${l.bids.length?'Current bid':'Starting bid'}</dt><dd class="est">${money(l.cur,true)}</dd><dt>Bids</dt><dd>${l.bids.length}</dd><dt>Ends</dt><dd>${fmtDate(l.en)} (${daysLeft(l).toLowerCase()})</dd>${myb?`<dt>Your max</dt><dd>${money(myb[1],true)} ${l.lead===0?'<span class="up">(winning)</span>':'<span class="down">(outbid)</span>'}</dd>`:''}</dl>
      <div class="formrow"><input class="inp money-in" type="number" min="${min}" step="0.5" id="bidamt" placeholder="${money(min,true)}+" aria-label="Maximum bid"><button class="btn pri" data-act="bid" data-a="${l.id}">Place max bid</button><button class="btn" data-act="watch" data-a="${l.id}">${watch?'Watching':'Watch'}</button></div>
      <div class="small muted" style="margin-top:6px">Enter the most you'd pay. You'll be bid up automatically, only as far as needed. Keep enough cash to cover it when the auction closes.</div><div id="bidmsg"></div>
      ${l.hist.length?`<h3 style="margin-top:12px">Bid history</h3><table class="tbl"><tbody>${l.hist.slice(0,12).map(h=>`<tr><td>${fmtDate(h[0])}</td><td>${esc(ownerName(h[1]))}</td><td class="r">${money(h[2],true)}</td></tr>`).join('')}</tbody></table>`:''}</div>`;
  }
  return { t:title, h:`<div class="stack"><div class="detail">${head}<div class="stack">${cond}${act}</div></div>${extra}</div>` };
}
ACT.listing = a=>openSheet(()=>listingSheet(+a));
ACT.watch = a=>{ const id=+a; const w=G.player.watch; const i=w.indexOf(id); if (i>=0) w.splice(i,1); else w.push(id); refresh(); queueSave(); };
ACT.buy = (a,el)=>{ if (!armed(el)) return; const l=G.lst.find(x=>x.id===+a); const lab=l? itemLabel(l) : '', kind=l&&l.it, ref=l&&l.ref, price=l&&l.pr; const err=buyListing(+a); if (err){ showToast(err); refresh(); afterAction(); return; }
  // the listing is gone because we bought it: say so, with a way to the item, instead of the generic 'Gone' sheet
  if (UI.sheets.length){ const act=kind==='x'?'xtopy':kind==='t'?'tcopy':kind==='m'?'ccopy':'card'; UI.sheets[UI.sheets.length-1]={fn:()=>({t:'Bought', h:`<div class="stack"><div class="panel"><h3>It's yours</h3><p class="small" style="margin:0 0 8px">${esc(lab)}${price?' for '+money(price,true):''}.</p><div class="formrow">${kind==="s"?"":`<button class="btn pri" data-act="${act}" data-a="${ref}">See it</button>`}<button class="btn" data-act="sheetclose">Done</button></div></div></div>`})}; }
  showToast('Bought.', true); refresh(); afterAction(); };
ACT.acccounter = (a,el)=>{ if (!armed(el)) return; const l=L(+a); if (!l||!l.counter) return; if (G.player.cash<l.counter){ showToast('Not enough cash.'); return; } transfer(l,0,l.counter,'offer'); refresh(); afterAction(); };
ACT.offer = a=>{ const v=parseFloat($('#offeramt').value); if (!(v>0)){ $('#offermsg').innerHTML='<div class="err">Enter an amount.</div>'; return; } const r=playerOffer(+a, Math.round(v*100)/100);
  if (r.ok){ refresh(); afterAction(); return; }
  if (r.counter){ refreshSheet(); return; }
  $('#offermsg').innerHTML=`<div class="err" style="margin-top:6px">${esc(r.err||r.no)}</div>`; };
ACT.bid = a=>{ const v=parseFloat($('#bidamt').value); const err=playerBid(+a, Math.round(v*100)/100); refresh(); const m=$('#bidmsg'); if (m) m.innerHTML = err? `<div class="err" style="margin-top:6px">${esc(err)}</div>` : '<div class="ok" style="margin-top:6px">You\'re the high bidder.</div>'; afterAction(); };
ACT.reprice = a=>{ const l=L(+a); const v=parseFloat($('#reprice').value); if (!l || !(v>0)) return; l.pr=Math.round(v*100)/100; l.st=G.day; showToast('Price updated to '+money(l.pr,true)); refresh(); afterAction(); };
ACT.endlisting = a=>{ const l=L(+a); if (!l) return; if (l.ty==='auc'&&l.bids.length){ showToast('Auctions with bids have to run their course.'); return; } removeListing(l); showToast('Listing ended.'); closeSheet(); refresh(); afterAction(); };
ACT.offeracc = a=>{ const [lid,oid]=a.split(':').map(Number); const e=answerOffer(lid,oid,true); if (e) showToast(e); closeSheet(); refresh(); afterAction(); };
ACT.offerdec = a=>{ const [lid,oid]=a.split(':').map(Number); answerOffer(lid,oid,false); refresh(); afterAction(); };
ACT.offercounter = a=>{ const [lid,oid]=a.split(':').map(Number); const l=L(lid); const o=l&&l.offers.find(x=>x.id===oid); if (!o) return;
  const v=parseFloat(prompt('Counter at what price? They offered '+money(o.amt,true)+'.', nicePrice((o.amt+l.pr)/2)));
  if (!(v>0)) return; const e=answerOffer(lid,oid,false,Math.round(v*100)/100); showToast(e||'Counter accepted. Sold.'); refresh(); afterAction(); };

function designSheet(key){
  const d=D(key), p=P(d.pid);
  const lst=G.lst.filter(l=>l.it==='c'&&C(l.ref).k===key);
  const own=myCards().filter(c=>c.k===key);
  return { t:pname(p), h:`<div class="stack"><div class="detail">${bigCardHTML(null,key)}<div class="stack">
    <div class="title-block"><div class="yr">${esc(cardLine(d))}</div><h1>${esc(pname(p))}</h1><div class="sub">${esc(d.title)}</div>${tagsHTML(d)}</div>
    <dl class="kv"><dt>Player</dt><dd>${pLink(p)}, ${esc(statusOf(p))}</dd><dt>Raw estimate</dt><dd class="est">${rangeTxt(key,0)}</dd>${d.run?`<dt>Print run</dt><dd>/${d.run}${G.ser[key]?', '+G.ser[key]+' known to be pulled':''}</dd>`:''}<dt>You own</dt><dd>${own.length?own.length+' cop'+(own.length>1?'ies':'y'):'None'}</dd></dl>
    <div><b class="small">GCS population</b>${popHTML(key)}</div>
  </div></div>
  <div class="panel"><h3>For sale now</h3><div class="rows">${lst.map(listingRow).join('')||'<div class="empty">No copies listed right now.</div>'}</div>${own.length?`<div class="formrow">${own.slice(0,4).map(c=>`<button class="btn sm" data-act="card" data-a="${c.id}">Your copy ${c.s?'#'+c.s:''} ${c.g>0?'(GCS '+c.g+')':''}</button>`).join('')}</div>`:''}</div>
  ${salesPanel(key,null,'Sales history, all grades')}${compsHTML(d)}</div>` };
}
ACT.design = a=>openSheet(()=>designSheet(a));
