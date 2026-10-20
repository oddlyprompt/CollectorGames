// ===================== XTG: STOREFRONTS =====================
// Three places to buy Tidemark:
//  - Big-box retail (xtRetailV): sealed at list price. Restocks every Monday; other shoppers buy every day (xtShopWeek, xtShopDay).
//  - The Lantern Room, a local game store: sealed a little over list, a smaller allocation restocked every Thursday, a glass case of
//    singles that turns over each Thursday, and a buylist that pays cash for your cards on the spot.
//  - Saltmarket, an online singles shop: every printed card, near mint, a little over market, stock refreshed every Monday.
// Store state lives in G.xtg.lgs and G.xtg.kv and is created on first use, so older saves pick it up without a migration.
const XLGS_PRICE={P:5.49,B:159.99}, XLGS_CASE=30, XLGS_MARKUP=1.3, XLGS_BUY=0.55, XKV_MARKUP=1.15, XKV_MIN=0.35;
UI.xtstore=UI.xtstore||'retail'; UI.xkvf=UI.xkvf||'hits'; UI.xkvp=0;
function xtLgs(){ const T=G.xtg; if (!T.lgs) T.lgs={pack:0,box:0,caseWk:-1,cs:[],nid:1}; return T.lgs; }
function xtKv(){ const T=G.xtg; if (!T.kv) T.kv={wk:-1,s:{}}; return T.kv; }
const xtNewestSet=t=>xtInPrint(TM_TT,t)? TM_TT : null;   // the only set the stores still stock
// ---------- the local game store ----------
function xtLgsWeek(t){ const L=xtLgs(), n=xtNewestSet(t); if (n){ const age=t-xtSetDef(n).rel, cur=age<100;
  L.pack=Math.min(72, L.pack+(cur? ri(24,48) : ri(8,16))); L.box=Math.min(8, L.box+(cur? ri(2,4) : ri(0,1))); } xtLgsCase(t, true); }
function xtLgsDay(t){ const L=xtLgs(), n=xtNewestSet(t); const age=n? t-xtSetDef(n).rel : 999; const hot=age<=14?3.2: age<=45?1.2:0.35;
  if (n){ L.pack=Math.max(0, L.pack-poisson(hot*4)); L.box=Math.max(0, L.box-poisson(hot*0.35)); }
  for (const x of L.cs) if (!x.sold && R()<0.04*Math.max(hot,0.5)) x.sold=1; L.cs=L.cs.filter(x=>!x.sold); }
// the glass case: a mix that leans toward the cards people come in for, priced at the store's markup over market
function xtLgsCase(t, force){ const L=xtLgs(), wk=weekNo(t); if (!force && L.caseWk===wk) return; const rel=xtReleasedSets(t).filter(n=>!xtV2()||n===TM_TT||(t-xtSetDef(n).rel)/365<XT_E2.vintageYears); if (!rel.length) return; L.caseWk=wk;
  const r=mkRng(hsh('lgs'+G.seed+wk)); const sets=new Set(); if (rel.includes(TM_TT)) sets.add(TM_TT); while (sets.size<Math.min(rel.length,7)) sets.add(rel[Math.floor(r()*rel.length)]);
  const keys=[...sets].flatMap(xtAllKeys);
  const w=k=>{ const d=xtD(k), o=XT_RAROR[d.card.rar]; return (d.v==='F'? 0.6 : 1)*(o<=0? 0.5 : o===1? 0.8 : o===2? 2.2 : o===3? 1.6 : 0.8)*(d.set===TM_TT? 2 : 1); }; const tot=keys.reduce((s,k)=>s+w(k),0);
  L.cs=[]; for (let i=0;i<XLGS_CASE;i++){ let x=r()*tot, k=keys[0]; for (const kk of keys){ x-=w(kk); if (x<=0){ k=kk; break; } }
    const c=r()<0.7? condFresh(r,0.6) : condWorn(r, Math.max(0,(t-xtSetDef(xtD(k).set).rel)/365), 1); L.cs.push({id:L.nid++, k, c}); } }
// ---------- Saltmarket, online singles ----------
function xtKvStock(t){ if (xtV2()) return xtV2KvStock(t);
  const K=xtKv(), wk=weekNo(t); if (K.wk===wk) return K.s; K.wk=wk; K.s={}; const r=mkRng(hsh('kv'+G.seed+wk));
  for (const n of xtReleasedSets(t)) for (const k of xtAllKeys(n)){ const d=xtD(k), o=XT_RAROR[d.card.rar]; let q;
    if (o<=0) q= d.v==='F'? xRi2(r,1,3) : xRi2(r,4,12); else if (o===1) q= d.v==='F'? xRi2(r,1,3) : xRi2(r,3,8); else if (o===2) q=d.v==='F'? xRi2(r,0,2) : xRi2(r,2,5); else q= r()<(xtFairRaw(k)>100? 0.3 : 0.65)? 1 : 0;
    if (q) K.s[k]=q; } return K.s; }
const xRi2=(r,a,b)=>a+Math.floor(r()*(b-a+1));
// ---------- buying and selling (src/tcg/kit/stores.js) ----------
const XT_STORE=cardStores({ lgsName:'The Lantern Room', kvName:'Saltmarket', world:()=>G.xtg, copies:()=>G.xtc, newestSet:xtNewestSet, key:xtKey, lgs:xtLgs, kv:xtKv, kvStock:xtKvStock, kvPriceReal:k=>xtKvPriceReal(k), kvBuyReal:k=>xtKvBuyReal(k),
  listPrice:XLGS_PRICE, markup:XLGS_MARKUP, buy:XLGS_BUY, kvMarkup:XKV_MARKUP, kvMin:XKV_MIN, D:xtD, fairRaw:xtFairRaw, makeCopy:(...a)=>xtMakeCopy(...a), copyValue:cp=>xtCopyValue(cp), econ:XT_ECON });
const xtLgsPrice=XT_STORE.lgsPrice, xtLgsBuySingle=XT_STORE.lgsBuySingle, xtLgsBuySealed=XT_STORE.lgsBuySealed, xtLgsOffer=XT_STORE.lgsOffer, xtLgsSellTo=XT_STORE.lgsSellTo, xtKvPrice=XT_STORE.kvPrice, xtKvBuy=XT_STORE.kvBuy;
// ---------- daily and weekly ticks ----------
(function(){ const d=xtDay; xtDay=function(t){ d(t); const T=G.xtg; if (!T || !xtReleasedSets(t).length) return; try { if (dowOf(t)===4 || !T.lgs || t===xtSetDef(TM_TT).rel) xtLgsWeek(t); else xtLgsDay(t); } catch(e){ console.error(e); } }; })();
// ---------- views ----------
function xtSealedPanel(){
  const own=myXt().filter(c=>xtD(c.k).sealed&&!c.l); const grp=new Map(); for (const c of own){ const g=grp.get(c.k); if (g) g.push(c); else grp.set(c.k,[c]); }
  const rows=[...grp].map(([k,cs])=>{ const d=xtD(k), n=cs.length, box=d.v==='B'; const paid=cs.reduce((s,c)=>s+((c.a&&c.a[2])||0),0);
    return `<div class="row" style="cursor:default;flex-wrap:wrap">${xMiniT(cs[0])}<div class="rt"><b>${esc(d.title)}${n>1?' ×'+n:''}</b><span>Worth about ${money(xtCopyValue(cs[0]),true)}${n>1?' each':''}${paid?' · paid '+money(paid,true)+(n>1?' in all':''):''}</span></div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;flex-basis:100%">${n>1?`<button class="btn sm pri" data-act="xtopenall" data-a="${esc(k)}" ${box?`data-confirm="Open ${n*36} packs"`:''}>Open all ${n}</button>`:''}<button class="btn sm ${n>1?'':'pri'}" data-act="xtopen" data-a="${cs[0].id}" ${box?'data-confirm="Open all 36 packs"':''}>Open ${n>1?'one':''}</button><button class="btn sm" data-act="xtopy" data-a="${cs[0].id}">Sell</button></div></div>`; });
  return `<div class="panel"><h3>Your sealed product</h3><div class="rows">${rows.join('')||'<div class="empty">Buy a pack to get started.</div>'}</div>${own.length>1?'<p class="small muted" style="margin:6px 0 0">Opening several at once shows every pack as a tile; the ones with a good card inside glow.</p>':''}</div>`; }
function xtRestockPanel(){ return `<div class="panel"><h3>How restocking works</h3><p class="small" style="margin:0 0 6px">Big-box retail restocks every Monday (next: ${fmtDate(cardNextDow(1),true)}). For its first 100 days a set gets 70 to 150 packs and 4 to 9 boxes a week; after that 15 to 45 packs and 1 to 3 boxes, up to 300 packs and 20 boxes on the shelf.</p><p class="small muted" style="margin:0">Other shoppers buy every day: heavily in the first two weeks, less until about day 45, then slowly. So at launch boxes sell out within a day or two of each restock; later they pile up. The Lantern Room restocks on Thursdays with a smaller allocation.</p>${[TM_TT].filter(n=>xtSetDef(n).rel<=G.day).map(n=>{ const e=xtPrintEnd(n), def=xtSetDef(n); return `<p class="small" style="margin:6px 0 0"><b>${esc(def.name)}</b>: ${G.day<e? `printed until ${fmtDate(e,true)}. Restocks shrink in the last two months and stop after that; then the shelves only sell down, and sealed prices start to climb.` : `out of print since ${fmtDate(e,true)}. No more restocks anywhere; what is on shelves is the last of it.`}</p>`; }).join('')}</div>`; }
function xtStoreTabs(){ const b=(k,t)=>`<button class="chip ${UI.xtstore===k?'on':''}" data-act="xtstore" data-a="${k}">${t}</button>`; return `<div class="chips" style="margin-bottom:8px">${b('retail','Big-box retail')}${b('lgs','The Lantern Room (game store)')}${b('kv','Saltmarket (online singles)')}</div>`; }
function xtShopV(){ const v=UI.xtstore==='lgs'? xtLgsV() : UI.xtstore==='kv'? xtKvV() : xtRetailV(); return xtStoreTabs()+v+xtHistoryPanel(); }
// which market this world has, and for an older save the choice to rebuild its vintage market
function xtHistoryPanel(){
  if (xtV2()) return `<div class="panel"><h3>The vintage market</h3><p class="small muted" style="margin:0">Old Tidemark cards are what ten years of play left behind: print runs, cards opened, lost, worn and graded, and what collectors still hold. Near Mint copies of the first sets are rare, some old cards may take months to find, and estate sales and big collection sales add inventory that was already in the world.</p></div>`;
  return `<div class="panel"><h3>The vintage market (original version)</h3><p class="small muted" style="margin:0 0 8px">This save uses the original Tidemark market, where old cards are plentiful and many are Near Mint. You can rebuild the vintage market so it follows ten years of simulated history.</p>
    <p class="small" style="margin:0 0 4px"><b>What changes:</b> the cards collectors hold (fewer old cards, older ones more worn), sealed old product, Saltmarket's stock and the prices of old cards.</p>
    <p class="small" style="margin:0 0 8px"><b>What does not change:</b> everything you own (cards, conditions, slabs, listings, history), your cash, the metagame and Wildkin. A backup copy of this save is stored first, in your save slots.</p>
    <div class="formrow"><button class="btn sm" data-act="xtrebuild" data-confirm="Rebuild the vintage market (a backup is saved first)">Rebuild the vintage market</button></div></div>`;
}
ACT.xtstore=a=>{ UI.xtstore=a; UI.xkvp=0; render(true); };
function xtLgsV(){
  const n=xtNewestSet(G.day); const L=xtLgs(); xtLgsCase(G.day,false); const def=xtSetDef(n||TM_TT);
  const cs=L.cs.slice().sort((a,b)=>xtLgsPrice(b)-xtLgsPrice(a));
  const sealed=!n? `<div class="panel"><h3>The Lantern Room</h3><p class="small muted" style="margin:0">Your local game store. It has no sealed Tidemark to sell until ${esc(def.name)} releases (${fmtDate(def.rel,true)}), and none after the print run ends, but its glass case of singles and its buylist are open.</p></div>` : `<div class="panel"><h3>The Lantern Room</h3><p class="small muted" style="margin:0 0 8px">Your local game store. A little over list price, but a separate allocation that restocks every Thursday (next: ${fmtDate(cardNextDow(4),true)}), a case of singles that turns over each week, and a buylist.</p>
    <dl class="kv"><dt>${esc(def.name)} pack</dt><dd>${money(XLGS_PRICE.P,true)} · ${L.pack} in stock</dd><dt>${esc(def.name)} box</dt><dd>${money(XLGS_PRICE.B,true)} · ${L.box} in stock</dd></dl>
    <div class="formrow"><button class="btn sm" data-act="xlgsbuy" data-a="P|1" ${L.pack<1||G.player.cash<XLGS_PRICE.P?'disabled':''}>Buy a pack</button><button class="btn sm" data-act="xlgsbuy" data-a="P|6" ${L.pack<6||G.player.cash<XLGS_PRICE.P*6?'disabled':''}>Buy 6 packs</button><button class="btn sm pri" data-act="xlgsbuy" data-a="B|1" data-confirm="Pay ${money(XLGS_PRICE.B,true)}" ${L.box<1||G.player.cash<XLGS_PRICE.B?'disabled':''}>Buy a box</button></div></div>`;
  const caseP=`<div class="panel"><h3>The singles case</h3><p class="small muted" style="margin:0 0 8px">${cs.length} cards, priced about ${Math.round((XLGS_MARKUP-1)*100)}% over market. What sells is gone until the case is refilled on Thursday.</p><div class="rows">${cs.slice(0,UI.xlgsAll?cs.length:12).map(x=>{ const d=xtD(x.k), p=xtLgsPrice(x);
    return `<div class="row" style="cursor:default"><button class="mini" style="background:none;border:0;padding:0;width:40px" data-act="xtdesign" data-a="${esc(x.k)}">${xMiniTKey(x.k)}</button><div class="rt"><b>${esc(d.title)}</b><span>${xtRV(d)} · ${COND_LABN[condLabel(x.c)]}</span><span class="muted">market about ${money(xtFairRaw(x.k)*XT_ECON.condition.price(x.c,xtD(x.k).card),true)}</span></div><div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px"><b>${money(p,true)}</b><button class="btn sm" data-act="xlgssingle" data-a="${x.id}" ${G.player.cash<p?'disabled':''}>Buy</button></div></div>`; }).join('')||'<div class="empty">The case is empty until Thursday.</div>'}</div>${cs.length>12&&!UI.xlgsAll?`<div class="formrow"><button class="btn sm" data-act="xlgsall">Show all ${cs.length}</button></div>`:''}</div>`;
  const mine=myXt().filter(c=>c.g===0&&!c.l&&!xtD(c.k).sealed).map(c=>({c,p:xtLgsOffer(c)})).filter(x=>x.p>=0.5).sort((a,b)=>b.p-a.p).slice(0,15);
  const buy=`<div class="panel"><h3>Sell to the store</h3><p class="small muted" style="margin:0 0 8px">The buylist pays ${Math.round(XLGS_BUY*100)}% of market in cash, right now. Less than the marketplace, but no listing, no waiting and no fee.</p><div class="rows">${mine.map(x=>{ const d=xtD(x.c.k); return `<div class="row" style="cursor:default">${xMiniT(x.c)}<div class="rt"><b>${esc(d.title)}</b><span>${COND_LABN[condLabel(x.c.c)]} · worth about ${money(xtCopyValue(x.c),true)}</span></div><button class="btn sm" data-act="xlgssell" data-a="${x.c.id}" data-confirm="Sell for ${money(x.p,true)}">Sell ${money(x.p,true)}</button></div>`; }).join('')||'<div class="empty">Nothing the store wants right now (it buys raw cards worth about a dollar or more).</div>'}</div></div>`;
  return `<div class="cols"><div class="stack">${sealed}${caseP}</div><div class="stack">${buy}${xtSealedPanel()}</div></div>`; }
function xtKvV(){
  const sets=xtReleasedSets(G.day); if (!sets.length) return `<div class="panel"><div class="empty">Saltmarket opens its catalogue when the first set is released.</div></div>`;
  const s=xtKvStock(G.day); const f=UI.xkvf; const chip=(k,t)=>`<button class="chip ${f===k?'on':''}" data-act="xkvf" data-a="${k}">${t}</button>`;
  const keys=sets.flatMap(xtAllKeys).filter(k=>{ const d=xtD(k), o=XT_RAROR[d.card.rar]; return f==='hits'? o>=3 : f==='rare'? o===2 : f==='unc'? o===1 : f==='common'? o<=0 : f==='stock'? s[k]>0 : true; }).sort((a,b)=>xtKvPrice(b)-xtKvPrice(a));
  const per=20, pages=Math.max(1,Math.ceil(keys.length/per)), pg=Math.min(UI.xkvp,pages-1);
  const row=k=>{ const d=xtD(k), q=s[k]||0, p=xtKvPrice(k); return `<div class="row" style="cursor:default"><button class="mini" style="background:none;border:0;padding:0;width:40px" data-act="xtdesign" data-a="${esc(k)}">${xMiniTKey(k)}</button><div class="rt"><b>${esc(d.title)}</b><span>${xtRV(d)} · ${xtKvCondText(k)}</span><span class="${q?'muted':'down'}">${q? q+' in stock' : 'out of stock'}</span></div><div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px"><b>${money(p,true)}</b><button class="btn sm" data-act="xkvbuy" data-a="${esc(k)}" ${!q||G.player.cash<p?'disabled':''}>Buy</button></div></div>`; };
  return `<div class="cols"><div class="stack"><div class="panel"><h3>Saltmarket</h3><p class="small muted" style="margin:0 0 8px">${xtV2()? 'An online singles shop. Recent sets are always stocked near mint; older cards are only what its dealers have bought from collectors, in the condition they came, at about '+Math.round((XKV_MARKUP-1)*100)+'% over market. When a card is gone it is gone until someone sells another (next dealer buying day: '+fmtDate(cardNextDow(1),true)+').' : 'An online singles shop with every printed card, always near mint, at about '+Math.round((XKV_MARKUP-1)*100)+'% over market (shipping included). Stock is refreshed every Monday (next: '+fmtDate(cardNextDow(1),true)+'); the biggest chase cards are often out.'}</p>
    <div class="chips">${chip('hits','Legendary and alt art')}${chip('rare','Rares')}${chip('unc','Uncommons')}${chip('common','Commons')}${chip('stock','In stock')}${chip('all','Everything')}</div>
    <div class="rows">${keys.slice(pg*per,pg*per+per).map(row).join('')||'<div class="empty">Nothing here.</div>'}</div>${pages>1?`<div class="chips">${Array.from({length:pages},(_,i)=>`<button class="chip ${i===pg?'on':''}" data-act="xkvpage" data-a="${i}">${i+1}</button>`).join('')}</div>`:''}</div></div>
    <div class="stack">${xtSealedPanel()}</div></div>`; }
ACT.xlgsall=()=>{ UI.xlgsAll=1; render(true); };
ACT.xkvf=a=>{ UI.xkvf=a; UI.xkvp=0; render(true); }; ACT.xkvpage=a=>{ UI.xkvp=+a; render(true); };
const xtStoreDone=(e,ok)=>{ if (e){ showToast(e); return; } showToast(ok, true); render(true); queueSave(); };
ACT.xlgsbuy=(a,el)=>{ if (el && el.dataset && el.dataset.confirm && !armed(el)) return; const [f,q]=a.split('|'); xtStoreDone(xtLgsBuySealed(f,+q), 'Bought. It is in Your sealed product.'); };
ACT.xlgssingle=a=>xtStoreDone(xtLgsBuySingle(+a), 'Bought. It is in Your cards, marked New.');
ACT.xlgssell=(a,el)=>{ if (el && el.dataset && el.dataset.confirm && !armed(el)) return; xtStoreDone(xtLgsSellTo(+a), 'Sold to The Lantern Room.'); };
ACT.xkvbuy=a=>xtStoreDone(xtKvBuy(a), 'Bought. It is in Your cards, marked New.');

function xtKvCondText(k){ if (xtV2()){ const c=xtKvBest(k); if (c) return COND_LABN[condLabel(c.c)].toLowerCase(); } return 'near mint'; }
