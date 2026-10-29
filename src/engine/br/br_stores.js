// ===================== XTG: STOREFRONTS =====================
// Three places to buy Broken Reach:
//  - Big-box retail (brRetailV): sealed at list price. Restocks every Monday; other shoppers buy every day (brShopWeek, brShopDay).
//  - The Cargo Cage, a local game store: sealed a little over list, a smaller allocation restocked every Thursday, a glass case of
//    singles that turns over each Thursday, and a buylist that pays cash for your cards on the spot.
//  - Waypoint Singles, an online singles shop: every printed card, near mint, a little over market, stock refreshed every Monday.
// Store state lives in G.brg.lgs and G.brg.kv and is created on first use, so older saves pick it up without a migration.
const BLGS_PRICE={P:5.49,B:119.99}, BLGS_CASE=30, BLGS_MARKUP=1.3, BLGS_BUY=0.55, BKV_MARKUP=1.15, BKV_MIN=0.35;
UI.brstore=UI.brstore||'retail'; UI.bkvf=UI.bkvf||'hits'; UI.bkvp=0;
function brLgs(){ const T=G.brg; if (!T.lgs) T.lgs={pack:0,box:0,caseWk:-1,cs:[],nid:1}; return T.lgs; }
function brKv(){ const T=G.brg; if (!T.kv) T.kv={wk:-1,s:{}}; return T.kv; }
const brNewestSet=t=>brInPrint(1,t)? 1 : null;   // the only set the stores still stock
// ---------- the local game store ----------
function brLgsWeek(t){ const L=brLgs(), n=brNewestSet(t); if (n){ const age=t-brSetDef(n).rel, cur=age<100;
  L.pack=Math.min(72, L.pack+(cur? ri(24,48) : ri(8,16))); L.box=Math.min(8, L.box+(cur? ri(2,4) : ri(0,1))); } brLgsCase(t, true); }
function brLgsDay(t){ const L=brLgs(), n=brNewestSet(t); const age=n? t-brSetDef(n).rel : 999; const hot=age<=14?3.2: age<=45?1.2:0.35;
  if (n){ L.pack=Math.max(0, L.pack-poisson(hot*4)); L.box=Math.max(0, L.box-poisson(hot*0.35)); }
  for (const x of L.cs) if (!x.sold && R()<0.04*Math.max(hot,0.5)) x.sold=1; L.cs=L.cs.filter(x=>!x.sold); }
// the glass case: a mix that leans toward the cards people come in for, priced at the store's markup over market
function brLgsCase(t, force){ const L=brLgs(), wk=weekNo(t); if (!force && L.caseWk===wk) return; if (!brReleasedSets(t).length) return; L.caseWk=wk;
  const r=mkRng(hsh('lgs'+G.seed+'br'+wk)); const keys=brAllKeys(1);
  const w=k=>{ const d=brD(k), o=BR_RAROR[d.card.rar]; return (d.v==='F'? 0.6 : 1)*(o<=0? 0.5 : o===1? 0.8 : o===2? 2.2 : o===3? 2 : o===4? 1.6 : 0.8); }; const tot=keys.reduce((s,k)=>s+w(k),0);
  L.cs=[]; for (let i=0;i<BLGS_CASE;i++){ let x=r()*tot, k=keys[0]; for (const kk of keys){ x-=w(kk); if (x<=0){ k=kk; break; } }
    const c=r()<0.7? condFresh(r,0.6) : condWorn(r, Math.max(0,(t-brSetDef(brD(k).set).rel)/365), 1); L.cs.push({id:L.nid++, k, c}); } }
// ---------- Waypoint Singles, online singles ----------
function brKvStock(t){
  const K=brKv(), wk=weekNo(t); if (K.wk===wk) return K.s; K.wk=wk; K.s={}; const r=mkRng(hsh('kv'+G.seed+'br'+wk));
  for (const n of brReleasedSets(t)) for (const k of brAllKeys(n)){ const d=brD(k), o=BR_RAROR[d.card.rar]; let q;
    if (o<=0) q= d.v==='F'? bRi2(r,1,3) : bRi2(r,4,12); else if (o===1) q= d.v==='F'? bRi2(r,1,3) : bRi2(r,3,8); else if (o===2) q=d.v==='F'? bRi2(r,0,2) : bRi2(r,2,5); else q= r()<(brFairRaw(k)>100? 0.3 : 0.65)? 1 : 0;
    if (q) K.s[k]=q; } return K.s; }
const bRi2=(r,a,b)=>a+Math.floor(r()*(b-a+1));
// ---------- buying and selling (src/tcg/kit/stores.js) ----------
const BR_STORE=cardStores({ lgsName:'The Cargo Cage', kvName:'Waypoint Singles', world:()=>G.brg, copies:()=>G.brc, newestSet:brNewestSet, key:brKey, lgs:brLgs, kv:brKv, kvStock:brKvStock,
  listPrice:BLGS_PRICE, markup:BLGS_MARKUP, buy:BLGS_BUY, kvMarkup:BKV_MARKUP, kvMin:BKV_MIN, D:brD, fairRaw:brFairRaw, makeCopy:(...a)=>brMakeCopy(...a), copyValue:cp=>brCopyValue(cp), econ:BR_ECON });
const brLgsPrice=BR_STORE.lgsPrice, brLgsBuySingle=BR_STORE.lgsBuySingle, brLgsBuySealed=BR_STORE.lgsBuySealed, brLgsOffer=BR_STORE.lgsOffer, brLgsSellTo=BR_STORE.lgsSellTo, brKvPrice=BR_STORE.kvPrice, brKvBuy=BR_STORE.kvBuy;
// ---------- daily and weekly ticks ----------
(function(){ const d=brDay; brDay=function(t){ d(t); const T=G.brg; if (!T || !brReleasedSets(t).length) return; try { if (dowOf(t)===4 || !T.lgs || t===brSetDef(1).rel) brLgsWeek(t); else brLgsDay(t); } catch(e){ console.error(e); } }; })();
// ---------- views ----------
function brSealedPanel(){
  const own=myBr().filter(c=>brD(c.k).sealed&&!c.l); const grp=new Map(); for (const c of own){ const g=grp.get(c.k); if (g) g.push(c); else grp.set(c.k,[c]); }
  const rows=[...grp].map(([k,cs])=>{ const d=brD(k), n=cs.length, box=d.v==='B'; const paid=cs.reduce((s,c)=>s+((c.a&&c.a[2])||0),0);
    return `<div class="row" style="cursor:default;flex-wrap:wrap">${bMiniT(cs[0])}<div class="rt"><b>${esc(d.title)}${n>1?' ×'+n:''}</b><span>Worth about ${money(brCopyValue(cs[0]),true)}${n>1?' each':''}${paid?' · paid '+money(paid,true)+(n>1?' in all':''):''}</span></div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;flex-basis:100%">${n>1?`<button class="btn sm pri" data-act="bropenall" data-a="${esc(k)}" ${box?`data-confirm="Open ${n*24} packs"`:''}>Open all ${n}</button>`:''}<button class="btn sm ${n>1?'':'pri'}" data-act="bropen" data-a="${cs[0].id}" ${box?'data-confirm="Open all 24 packs"':''}>Open ${n>1?'one':''}</button><button class="btn sm" data-act="bropy" data-a="${cs[0].id}">Sell</button></div></div>`; });
  return `<div class="panel"><h3>Your sealed product</h3><div class="rows">${rows.join('')||'<div class="empty">Buy a pack to get started.</div>'}</div>${own.length>1?'<p class="small muted" style="margin:6px 0 0">Opening several at once shows every pack as a tile; the ones with a good card inside glow.</p>':''}</div>`; }
function brRestockPanel(){ const e=brPrintEnd(1), def=brSetDef(1); return `<div class="panel"><h3>How restocking works</h3><p class="small" style="margin:0 0 6px">Big-box retail restocks every Monday (next: ${fmtDate(cardNextDow(1),true)}). For its first 100 days a set gets 70 to 150 packs and 4 to 9 boxes a week; after that 15 to 45 packs and 1 to 3 boxes, up to 300 packs and 20 boxes on the shelf.</p><p class="small muted" style="margin:0">Other shoppers buy every day: heavily in the first two weeks, less until about day 45, then slowly. So at launch boxes sell out within a day or two of each restock; later they pile up. The Cargo Cage restocks on Thursdays with a smaller allocation.</p>${def.rel<=G.day? `<p class="small" style="margin:6px 0 0"><b>${esc(def.name)}</b>: ${G.day<e? `printed until ${fmtDate(e,true)}. Restocks shrink in the last two months and stop after that; then the shelves only sell down, and sealed prices start to climb.` : `out of print since ${fmtDate(e,true)}. No more restocks anywhere; what is on shelves is the last of it.`}</p>` : ''}</div>`; }
function brStoreTabs(){ const b=(k,t)=>`<button class="chip ${UI.brstore===k?'on':''}" data-act="brstore" data-a="${k}">${t}</button>`; return `<div class="chips" style="margin-bottom:8px">${b('retail','Big-box retail')}${b('lgs','The Cargo Cage (game store)')}${b('kv','Waypoint Singles (online singles)')}</div>`; }
function brShopV(){ const v=UI.brstore==='lgs'? brLgsV() : UI.brstore==='kv'? brKvV() : brRetailV(); return brStoreTabs()+v; }
ACT.brstore=a=>{ UI.brstore=a; UI.bkvp=0; render(true); };
function brLgsV(){
  const n=brNewestSet(G.day); const L=brLgs(); brLgsCase(G.day,false); const def=brSetDef(n||1);
  const cs=L.cs.slice().sort((a,b)=>brLgsPrice(b)-brLgsPrice(a));
  const sealed=!n? `<div class="panel"><h3>The Cargo Cage</h3><p class="small muted" style="margin:0">Your local game store. It has no sealed Broken Reach to sell until ${esc(def.name)} releases (${fmtDate(def.rel,true)}), and none after the print run ends, but its glass case of singles and its buylist are open.</p></div>` : `<div class="panel"><h3>The Cargo Cage</h3><p class="small muted" style="margin:0 0 8px">Your local game store. A little over list price, but a separate allocation that restocks every Thursday (next: ${fmtDate(cardNextDow(4),true)}), a case of singles that turns over each week, and a buylist.</p>
    <dl class="kv"><dt>${esc(def.name)} pack</dt><dd>${money(BLGS_PRICE.P,true)} · ${L.pack} in stock</dd><dt>${esc(def.name)} box</dt><dd>${money(BLGS_PRICE.B,true)} · ${L.box} in stock</dd></dl>
    <div class="formrow"><button class="btn sm" data-act="blgsbuy" data-a="P|1" ${L.pack<1||G.player.cash<BLGS_PRICE.P?'disabled':''}>Buy a pack</button><button class="btn sm" data-act="blgsbuy" data-a="P|6" ${L.pack<6||G.player.cash<BLGS_PRICE.P*6?'disabled':''}>Buy 6 packs</button><button class="btn sm pri" data-act="blgsbuy" data-a="B|1" data-confirm="Pay ${money(BLGS_PRICE.B,true)}" ${L.box<1||G.player.cash<BLGS_PRICE.B?'disabled':''}>Buy a box</button></div></div>`;
  const caseP=`<div class="panel"><h3>The singles case</h3><p class="small muted" style="margin:0 0 8px">${cs.length} cards, priced about ${Math.round((BLGS_MARKUP-1)*100)}% over market. What sells is gone until the case is refilled on Thursday.</p><div class="rows">${cs.slice(0,UI.blgsAll?cs.length:12).map(x=>{ const d=brD(x.k), p=brLgsPrice(x);
    return `<div class="row" style="cursor:default"><button class="mini" style="background:none;border:0;padding:0;width:40px" data-act="brdesign" data-a="${esc(x.k)}">${bMiniTKey(x.k)}</button><div class="rt"><b>${esc(d.title)}</b><span>${brRV(d)} · ${COND_LABN[condLabel(x.c)]}</span><span class="muted">market about ${money(brFairRaw(x.k)*BR_ECON.condition.price(x.c,brD(x.k).card),true)}</span></div><div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px"><b>${money(p,true)}</b><button class="btn sm" data-act="blgssingle" data-a="${x.id}" ${G.player.cash<p?'disabled':''}>Buy</button></div></div>`; }).join('')||'<div class="empty">The case is empty until Thursday.</div>'}</div>${cs.length>12&&!UI.blgsAll?`<div class="formrow"><button class="btn sm" data-act="blgsall">Show all ${cs.length}</button></div>`:''}</div>`;
  const mine=myBr().filter(c=>c.g===0&&!c.l&&!brD(c.k).sealed).map(c=>({c,p:brLgsOffer(c)})).filter(x=>x.p>=0.5).sort((a,b)=>b.p-a.p).slice(0,15);
  const buy=`<div class="panel"><h3>Sell to the store</h3><p class="small muted" style="margin:0 0 8px">The buylist pays ${Math.round(BLGS_BUY*100)}% of market in cash, right now. Less than the marketplace, but no listing, no waiting and no fee.</p><div class="rows">${mine.map(x=>{ const d=brD(x.c.k); return `<div class="row" style="cursor:default">${bMiniT(x.c)}<div class="rt"><b>${esc(d.title)}</b><span>${COND_LABN[condLabel(x.c.c)]} · worth about ${money(brCopyValue(x.c),true)}</span></div><button class="btn sm" data-act="blgssell" data-a="${x.c.id}" data-confirm="Sell for ${money(x.p,true)}">Sell ${money(x.p,true)}</button></div>`; }).join('')||'<div class="empty">Nothing the store wants right now (it buys raw cards worth about a dollar or more).</div>'}</div></div>`;
  return `<div class="cols"><div class="stack">${sealed}${caseP}</div><div class="stack">${buy}${brSealedPanel()}</div></div>`; }
function brKvV(){
  const sets=brReleasedSets(G.day); if (!sets.length) return `<div class="panel"><div class="empty">Waypoint Singles opens its catalogue when the first set is released.</div></div>`;
  const s=brKvStock(G.day); const f=UI.bkvf; const chip=(k,t)=>`<button class="chip ${f===k?'on':''}" data-act="bkvf" data-a="${k}">${t}</button>`;
  const keys=sets.flatMap(brAllKeys).filter(k=>{ const d=brD(k), o=BR_RAROR[d.card.rar]; return f==='hits'? o>=3 : f==='rare'? o===2 : f==='unc'? o===1 : f==='common'? o<=0 : f==='stock'? s[k]>0 : true; }).sort((a,b)=>brKvPrice(b)-brKvPrice(a));
  const per=20, pages=Math.max(1,Math.ceil(keys.length/per)), pg=Math.min(UI.bkvp,pages-1);
  const row=k=>{ const d=brD(k), q=s[k]||0, p=brKvPrice(k); return `<div class="row" style="cursor:default"><button class="mini" style="background:none;border:0;padding:0;width:40px" data-act="brdesign" data-a="${esc(k)}">${bMiniTKey(k)}</button><div class="rt"><b>${esc(d.title)}</b><span>${brRV(d)} · ${brKvCondText(k)}</span><span class="${q?'muted':'down'}">${q? q+' in stock' : 'out of stock'}</span></div><div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px"><b>${money(p,true)}</b><button class="btn sm" data-act="bkvbuy" data-a="${esc(k)}" ${!q||G.player.cash<p?'disabled':''}>Buy</button></div></div>`; };
  return `<div class="cols"><div class="stack"><div class="panel"><h3>Waypoint Singles</h3><p class="small muted" style="margin:0 0 8px">${'An online singles shop with every printed card, always near mint, at about '+Math.round((BKV_MARKUP-1)*100)+'% over market (shipping included). Stock is refreshed every Monday (next: '+fmtDate(cardNextDow(1),true)+'); the biggest chase cards are often out.'}</p>
    <div class="chips">${chip('hits','Super Rare and up')}${chip('rare','Rares')}${chip('unc','Uncommons')}${chip('common','Commons')}${chip('stock','In stock')}${chip('all','Everything')}</div>
    <div class="rows">${keys.slice(pg*per,pg*per+per).map(row).join('')||'<div class="empty">Nothing here.</div>'}</div>${pages>1?`<div class="chips">${Array.from({length:pages},(_,i)=>`<button class="chip ${i===pg?'on':''}" data-act="bkvpage" data-a="${i}">${i+1}</button>`).join('')}</div>`:''}</div></div>
    <div class="stack">${brSealedPanel()}</div></div>`; }
ACT.blgsall=()=>{ UI.blgsAll=1; render(true); };
ACT.bkvf=a=>{ UI.bkvf=a; UI.bkvp=0; render(true); }; ACT.bkvpage=a=>{ UI.bkvp=+a; render(true); };
const brStoreDone=(e,ok)=>{ if (e){ showToast(e); return; } showToast(ok, true); render(true); queueSave(); };
ACT.blgsbuy=(a,el)=>{ if (el && el.dataset && el.dataset.confirm && !armed(el)) return; const [f,q]=a.split('|'); brStoreDone(brLgsBuySealed(f,+q), 'Bought. It is in Your sealed product.'); };
ACT.blgssingle=a=>brStoreDone(brLgsBuySingle(+a), 'Bought. It is in Your cards, marked New.');
ACT.blgssell=(a,el)=>{ if (el && el.dataset && el.dataset.confirm && !armed(el)) return; brStoreDone(brLgsSellTo(+a), 'Sold to The Cargo Cage.'); };
ACT.bkvbuy=a=>brStoreDone(brKvBuy(a), 'Bought. It is in Your cards, marked New.');

function brKvCondText(k){ return 'near mint'; }
