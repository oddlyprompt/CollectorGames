// ===================== TCG: STOREFRONTS =====================
// Three places to buy Wildkin:
//  - Big-box retail (tcRetailV): sealed at list price. Restocks every Monday; other shoppers buy every day (tcShopWeek, tcShopDay).
//  - The Tidepool, a local game store: sealed a little over list, a smaller allocation restocked every Thursday, a glass case of
//    singles that turns over each Thursday, and a buylist that pays cash for your cards on the spot.
//  - Kinvault, an online singles shop: every printed card, near mint, a little over market, stock refreshed every Monday.
// Store state lives in G.tcg.lgs and G.tcg.kv and is created on first use, so older saves pick it up without a migration.
const LGS_PRICE={P:4.99,B:164.99}, LGS_CASE=30, LGS_MARKUP=1.3, LGS_BUY=0.55, KV_MARKUP=1.15, KV_MIN=0.35;
UI.tstore=UI.tstore||'retail'; UI.kvf=UI.kvf||'hits'; UI.kvp=0;
function tcLgs(){ const T=G.tcg; if (!T.lgs) T.lgs={pack:0,box:0,caseWk:-1,cs:[],nid:1}; return T.lgs; }
function tcKv(){ const T=G.tcg; if (!T.kv) T.kv={wk:-1,s:{}}; return T.kv; }
const tcNewestSet=t=>{ const r=tcReleasedSets(t); return r[r.length-1]; };
// ---------- the local game store ----------
function tcLgsWeek(t){ const L=tcLgs(), n=tcNewestSet(t); if (!n) return; const age=t-tcSetDef(n).rel, cur=age<100; if (!tcInPrint(n,t)){ tcLgsCase(t, true); return; }   // no allocation once the print run ends
  L.pack=Math.min(72, L.pack+(cur? ri(24,48) : ri(8,16))); L.box=Math.min(8, L.box+(cur? ri(2,4) : ri(0,1))); tcLgsCase(t, true); }
function tcLgsDay(t){ const L=tcLgs(), n=tcNewestSet(t); if (!n) return; const age=t-tcSetDef(n).rel; const hot=age<=14?3.2: age<=45?1.2:0.35;
  L.pack=Math.max(0, L.pack-poisson(hot*4)); L.box=Math.max(0, L.box-poisson(hot*0.35));
  for (const x of L.cs) if (!x.sold && R()<0.04*hot) x.sold=1; L.cs=L.cs.filter(x=>!x.sold); }
// the glass case: a mix that leans toward the cards people come in for, priced at the store's markup over market
function tcLgsCase(t, force){ const L=tcLgs(), wk=weekNo(t); if (!force && L.caseWk===wk) return; const n=tcNewestSet(t); if (!n) return; L.caseWk=wk;
  const r=mkRng(hsh('lgs'+G.seed+wk)); const keys=tcAllKeys(n).filter(k=>tcD(k).card.kind!=='essence');
  const w=k=>{ const d=tcD(k), o=TC_RAROR[d.card.rar]; return d.v==='R'? 0.5 : o<=0? 0.5 : o===1? 0.8 : o===2? 2.2 : o<=4? 1.4 : 0.35; }; const tot=keys.reduce((s,k)=>s+w(k),0);
  L.cs=[]; for (let i=0;i<LGS_CASE;i++){ let x=r()*tot, k=keys[0]; for (const kk of keys){ x-=w(kk); if (x<=0){ k=kk; break; } }
    const c=r()<0.7? condFresh(r,0.6) : condWorn(r, Math.max(0,(t-tcSetDef(n).rel)/365), 1); L.cs.push({id:L.nid++, k, c}); } }
function tcLgsPrice(x){ const v=tcFairRaw(x.k)*WK_ECON.condition.price(x.c,tcD(x.k).card)*LGS_MARKUP; return Math.max(0.5, Math.ceil(v*4)/4-0.01); }
function tcLgsBuySingle(id){ const L=tcLgs(); const x=L.cs.find(y=>y.id===id); if (!x) return 'Someone else bought that one.'; const p=tcLgsPrice(x); if (G.player.cash<p) return 'You need '+money(p,true)+'.';
  G.player.cash-=p; G.player.bought+=p; const cp=tcMakeCopy(x.k,0,[G.day,'bought',p,'The Tidepool'],'shop'); cp.c=x.c.slice(); cp.nw=1; cp.h=[[G.day,'Bought from the case at The Tidepool',p,'']]; cp.pv={d:G.day,v:Math.round(tcCopyValue(cp)*100)/100,n:''};
  L.cs=L.cs.filter(y=>y.id!==id); return null; }
function tcLgsBuySealed(f, q){ const L=tcLgs(), n=tcNewestSet(G.day); const have=f==='P'?L.pack:L.box, p=LGS_PRICE[f]; if (!n || have<q) return 'Not enough in stock.'; if (G.player.cash<p*q) return 'You need '+money(p*q,true)+'.';
  G.player.cash-=p*q; G.player.bought+=p*q; if (f==='P') L.pack-=q; else L.box-=q; const key=tcKey(n,0,f);
  for (let i=0;i<q;i++){ const cp=tcMakeCopy(key,0,[G.day,'bought',p,'The Tidepool'],'shop'); cp.nw=1; cp.pv={d:G.day,v:Math.round(tcFairRaw(key)*100)/100,n:''}; } return null; }
// the buylist: the store pays a fixed share of market for raw cards, on the spot (the card leaves the game's market)
function tcLgsOffer(cp){ return Math.floor(tcCopyValue(cp)*LGS_BUY*100)/100; }
function tcLgsSellTo(id){ const cp=TC(id); if (!cp || cp.o!==0 || cp.l || cp.g!==0 || tcD(cp.k).sealed) return 'The store can\'t take that card.'; const p=tcLgsOffer(cp); if (p<0.25) return 'The store passes on that one.';
  G.player.cash+=p; G.player.sold=(G.player.sold||0)+p; G.tcg.bl=(G.tcg.bl||0)+1; delete G.tc[id]; return null; }
// ---------- Kinvault, online singles ----------
function tcKvStock(t){ const K=tcKv(), wk=weekNo(t); if (K.wk===wk) return K.s; K.wk=wk; K.s={}; const r=mkRng(hsh('kv'+G.seed+wk));
  for (const n of tcReleasedSets(t)) for (const k of tcAllKeys(n)){ const d=tcD(k), o=TC_RAROR[d.card.rar]; let q;
    if (d.v==='R') q=ri2(r,1,4); else if (o<=0) q=ri2(r,4,12); else if (o===1) q=ri2(r,3,8); else if (o===2) q=d.v==='H'? ri2(r,1,3) : ri2(r,2,5); else q= r()<(tcFairRaw(k)>100? 0.3 : 0.65)? 1 : 0;
    if (q) K.s[k]=q; } return K.s; }
const ri2=(r,a,b)=>a+Math.floor(r()*(b-a+1));
function tcKvPrice(k){ return Math.max(KV_MIN, Math.ceil(tcFairRaw(k)*KV_MARKUP*100)/100); }
function tcKvBuy(k){ const s=tcKvStock(G.day); if (!s[k]) return 'Out of stock.'; const p=tcKvPrice(k); if (G.player.cash<p) return 'You need '+money(p,true)+'.';
  G.player.cash-=p; G.player.bought+=p; s[k]--; const cp=tcMakeCopy(k,0,[G.day,'bought',p,'Kinvault'],'shop'); cp.c=cp.c.map(v=>Math.max(v,90)); cp.nw=1; cp.h=[[G.day,'Bought near mint from Kinvault',p,'']]; cp.pv={d:G.day,v:Math.round(tcCopyValue(cp)*100)/100,n:''}; return null; }
// ---------- daily and weekly ticks ----------
(function(){ const d=tcDay; tcDay=function(t){ d(t); const T=G.tcg; if (!T || !tcReleasedSets(t).length) return; try { if (dowOf(t)===4 || !T.lgs) tcLgsWeek(t); else tcLgsDay(t); } catch(e){ console.error(e); } }; })();
// ---------- views ----------
function tcSealedPanel(){
  const own=myTc().filter(c=>tcD(c.k).sealed&&!c.l); const grp=new Map(); for (const c of own){ const g=grp.get(c.k); if (g) g.push(c); else grp.set(c.k,[c]); }
  const rows=[...grp].map(([k,cs])=>{ const d=tcD(k), n=cs.length, box=d.v==='B'; const paid=cs.reduce((s,c)=>s+((c.a&&c.a[2])||0),0);
    return `<div class="row" style="cursor:default;flex-wrap:wrap">${miniT(cs[0])}<div class="rt"><b>${esc(d.title)}${n>1?' ×'+n:''}</b><span>Worth about ${money(tcCopyValue(cs[0]),true)}${n>1?' each':''}${paid?' · paid '+money(paid,true)+(n>1?' in all':''):''}</span></div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;flex-basis:100%">${n>1?`<button class="btn sm pri" data-act="tcopenall" data-a="${esc(k)}" ${box?`data-confirm="Open ${n*36} packs"`:''}>Open all ${n}</button>`:''}<button class="btn sm ${n>1?'':'pri'}" data-act="tcopen" data-a="${cs[0].id}" ${box?'data-confirm="Open all 36 packs"':''}>Open ${n>1?'one':''}</button><button class="btn sm" data-act="tcopy" data-a="${cs[0].id}">Sell</button></div></div>`; });
  return `<div class="panel"><h3>Your sealed product</h3><div class="rows">${rows.join('')||'<div class="empty">Buy a pack to get started.</div>'}</div>${own.length>1?'<p class="small muted" style="margin:6px 0 0">Opening several at once shows every pack as a tile; the ones with a good card inside glow.</p>':''}</div>`; }
function tcRestockPanel(){ return `<div class="panel"><h3>How restocking works</h3><p class="small" style="margin:0 0 6px">Big-box retail restocks every Monday (next: ${fmtDate(cardNextDow(1),true)}). For its first 100 days a set gets 70 to 150 packs and 4 to 9 boxes a week; after that 15 to 45 packs and 1 to 3 boxes, up to 300 packs and 20 boxes on the shelf.</p><p class="small muted" style="margin:0">Other shoppers buy every day: heavily in the first two weeks, less until about day 45, then slowly. So at launch boxes sell out within a day or two of each restock; later they pile up. The Tidepool restocks on Thursdays with a smaller allocation.</p>${tcReleasedSets(G.day).map(n=>{ const e=tcPrintEnd(n), def=tcSetDef(n); return `<p class="small" style="margin:6px 0 0"><b>${esc(def.name)}</b>: ${G.day<e? `printed until ${fmtDate(e,true)}. Restocks shrink in the last two months and stop after that; then the shelves only sell down, and sealed prices start to climb.` : `out of print since ${fmtDate(e,true)}. No more restocks anywhere; what is on shelves is the last of it.`}</p>`; }).join('')}</div>`; }
function tcStoreTabs(){ const b=(k,t)=>`<button class="chip ${UI.tstore===k?'on':''}" data-act="tstore" data-a="${k}">${t}</button>`; return `<div class="chips" style="margin-bottom:8px">${b('retail','Big-box retail')}${b('lgs','The Tidepool (game store)')}${b('kv','Kinvault (online singles)')}</div>`; }
function tcShopV(){ const v=UI.tstore==='lgs'? tcLgsV() : UI.tstore==='kv'? tcKvV() : tcRetailV(); return tcStoreTabs()+v; }
ACT.tstore=a=>{ UI.tstore=a; UI.kvp=0; render(true); };
function tcLgsV(){
  const n=tcNewestSet(G.day); if (!n) return `<div class="panel"><div class="empty">The Tidepool is waiting for the first set to come out.</div></div>`; const L=tcLgs(); tcLgsCase(G.day,false); const def=tcSetDef(n);
  const cs=L.cs.slice().sort((a,b)=>tcLgsPrice(b)-tcLgsPrice(a));
  const sealed=`<div class="panel"><h3>The Tidepool</h3><p class="small muted" style="margin:0 0 8px">Your local game store. A little over list price, but a separate allocation that restocks every Thursday (next: ${fmtDate(cardNextDow(4),true)}), a case of singles that turns over each week, and a buylist.</p>
    <dl class="kv"><dt>${esc(def.name)} pack</dt><dd>${money(LGS_PRICE.P,true)} · ${L.pack} in stock</dd><dt>${esc(def.name)} box</dt><dd>${money(LGS_PRICE.B,true)} · ${L.box} in stock</dd></dl>
    <div class="formrow"><button class="btn sm" data-act="lgsbuy" data-a="P|1" ${L.pack<1||G.player.cash<LGS_PRICE.P?'disabled':''}>Buy a pack</button><button class="btn sm" data-act="lgsbuy" data-a="P|6" ${L.pack<6||G.player.cash<LGS_PRICE.P*6?'disabled':''}>Buy 6 packs</button><button class="btn sm pri" data-act="lgsbuy" data-a="B|1" data-confirm="Pay ${money(LGS_PRICE.B,true)}" ${L.box<1||G.player.cash<LGS_PRICE.B?'disabled':''}>Buy a box</button></div></div>`;
  const caseP=`<div class="panel"><h3>The singles case</h3><p class="small muted" style="margin:0 0 8px">${cs.length} cards, priced about ${Math.round((LGS_MARKUP-1)*100)}% over market. What sells is gone until the case is refilled on Thursday.</p><div class="rows">${cs.slice(0,UI.lgsAll?cs.length:12).map(x=>{ const d=tcD(x.k), p=tcLgsPrice(x);
    return `<div class="row" style="cursor:default"><button class="mini" style="background:none;border:0;padding:0;width:40px" data-act="tdesign" data-a="${esc(x.k)}">${miniTKey(x.k)}</button><div class="rt"><b>${esc(d.title)}</b><span>${tcRV(d)} · ${COND_LABN[condLabel(x.c)]}</span><span class="muted">market about ${money(tcFairRaw(x.k)*WK_ECON.condition.price(x.c,tcD(x.k).card),true)}</span></div><div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px"><b>${money(p,true)}</b><button class="btn sm" data-act="lgssingle" data-a="${x.id}" ${G.player.cash<p?'disabled':''}>Buy</button></div></div>`; }).join('')||'<div class="empty">The case is empty until Thursday.</div>'}</div>${cs.length>12&&!UI.lgsAll?`<div class="formrow"><button class="btn sm" data-act="lgsall">Show all ${cs.length}</button></div>`:''}</div>`;
  const mine=myTc().filter(c=>c.g===0&&!c.l&&!tcD(c.k).sealed).map(c=>({c,p:tcLgsOffer(c)})).filter(x=>x.p>=0.5).sort((a,b)=>b.p-a.p).slice(0,15);
  const buy=`<div class="panel"><h3>Sell to the store</h3><p class="small muted" style="margin:0 0 8px">The buylist pays ${Math.round(LGS_BUY*100)}% of market in cash, right now. Less than the marketplace, but no listing, no waiting and no fee.</p><div class="rows">${mine.map(x=>{ const d=tcD(x.c.k); return `<div class="row" style="cursor:default">${miniT(x.c)}<div class="rt"><b>${esc(d.title)}</b><span>${COND_LABN[condLabel(x.c.c)]} · worth about ${money(tcCopyValue(x.c),true)}</span></div><button class="btn sm" data-act="lgssell" data-a="${x.c.id}" data-confirm="Sell for ${money(x.p,true)}">Sell ${money(x.p,true)}</button></div>`; }).join('')||'<div class="empty">Nothing the store wants right now (it buys raw cards worth about a dollar or more).</div>'}</div></div>`;
  return `<div class="cols"><div class="stack">${sealed}${caseP}</div><div class="stack">${buy}${tcSealedPanel()}</div></div>`; }
function tcKvV(){
  const sets=tcReleasedSets(G.day); if (!sets.length) return `<div class="panel"><div class="empty">Kinvault opens its catalogue when the first set is released.</div></div>`;
  const s=tcKvStock(G.day); const f=UI.kvf; const chip=(k,t)=>`<button class="chip ${f===k?'on':''}" data-act="kvf" data-a="${k}">${t}</button>`;
  const keys=sets.flatMap(tcAllKeys).filter(k=>{ const d=tcD(k), o=TC_RAROR[d.card.rar]; return f==='hits'? o>=3 : f==='rare'? o===2 : f==='unc'? o===1 : f==='common'? o<=0 && d.card.kind!=='essence' : f==='stock'? s[k]>0 : true; }).sort((a,b)=>tcKvPrice(b)-tcKvPrice(a));
  const per=20, pages=Math.max(1,Math.ceil(keys.length/per)), pg=Math.min(UI.kvp,pages-1);
  const row=k=>{ const d=tcD(k), q=s[k]||0, p=tcKvPrice(k); return `<div class="row" style="cursor:default"><button class="mini" style="background:none;border:0;padding:0;width:40px" data-act="tdesign" data-a="${esc(k)}">${miniTKey(k)}</button><div class="rt"><b>${esc(d.title)}</b><span>${tcRV(d)} · near mint</span><span class="${q?'muted':'down'}">${q? q+' in stock' : 'out of stock'}</span></div><div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px"><b>${money(p,true)}</b><button class="btn sm" data-act="kvbuy" data-a="${esc(k)}" ${!q||G.player.cash<p?'disabled':''}>Buy</button></div></div>`; };
  return `<div class="cols"><div class="stack"><div class="panel"><h3>Kinvault</h3><p class="small muted" style="margin:0 0 8px">An online singles shop with every printed card, always near mint, at about ${Math.round((KV_MARKUP-1)*100)}% over market (shipping included). Stock is refreshed every Monday (next: ${fmtDate(cardNextDow(1),true)}); the biggest chase cards are often out.</p>
    <div class="chips">${chip('hits','Premium')}${chip('rare','Rares')}${chip('unc','Uncommons')}${chip('common','Commons')}${chip('stock','In stock')}${chip('all','Everything')}</div>
    <div class="rows">${keys.slice(pg*per,pg*per+per).map(row).join('')||'<div class="empty">Nothing here.</div>'}</div>${pages>1?`<div class="chips">${Array.from({length:pages},(_,i)=>`<button class="chip ${i===pg?'on':''}" data-act="kvpage" data-a="${i}">${i+1}</button>`).join('')}</div>`:''}</div></div>
    <div class="stack">${tcSealedPanel()}</div></div>`; }
ACT.lgsall=()=>{ UI.lgsAll=1; render(true); };
ACT.kvf=a=>{ UI.kvf=a; UI.kvp=0; render(true); }; ACT.kvpage=a=>{ UI.kvp=+a; render(true); };
const tcStoreDone=(e,ok)=>{ if (e){ showToast(e); return; } showToast(ok, true); render(true); queueSave(); };
ACT.lgsbuy=(a,el)=>{ if (el && el.dataset && el.dataset.confirm && !armed(el)) return; const [f,q]=a.split('|'); tcStoreDone(tcLgsBuySealed(f,+q), 'Bought. It is in Your sealed product.'); };
ACT.lgssingle=a=>tcStoreDone(tcLgsBuySingle(+a), 'Bought. It is in Your cards, marked New.');
ACT.lgssell=(a,el)=>{ if (el && el.dataset && el.dataset.confirm && !armed(el)) return; tcStoreDone(tcLgsSellTo(+a), 'Sold to The Tidepool.'); };
ACT.kvbuy=a=>tcStoreDone(tcKvBuy(a), 'Bought. It is in Your cards, marked New.');
