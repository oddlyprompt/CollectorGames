// ===================== MARKET & COLLECTORS =====================
const NPC_TYPES = {
  set:{n:'Set collector',w:12,cash:[150,900]}, rookie:{n:'Rookie collector',w:18,cash:[200,2500]}, team:{n:'Team collector',w:14,cash:[150,1500]},
  prospect:{n:'Prospect speculator',w:14,cash:[300,4000]}, high:{n:'High-end collector',w:8,cash:[4000,40000]}, auto:{n:'Autograph collector',w:10,cash:[300,5000]},
  vintage:{n:'Older-issue collector',w:8,cash:[300,3000]}, pc:{n:'Player collector',w:14,cash:[200,6000]}, deal:{n:'Deal hunter',w:10,cash:[200,2000]},
  flip:{n:'Flipper',w:12,cash:[400,5000]}, casual:{n:'Casual collector',w:14,cash:[40,300]}, dealer:{n:'Dealer',w:6,cash:[3000,25000]}
};
const FEE = 0.10;
function NPC(id){ return G.npcs[id-1]; }
function ownerName(o){ if (o<=-1000 && typeof HS==='function'){ const s=HS(o); if (s) return s.n; } return o===0? 'You' : o===-5? SHOP_NAME : o===-900? 'Harrow & Finch Auctions' : (NPC(o)||{h:'collector'}).h; }
function makeNPCs(){
  const types=[]; for (const k in NPC_TYPES) for (let i=0;i<NPC_TYPES[k].w;i++) types.push(k);
  const used={};
  types.forEach((ty,i)=>{
    let h; do { h = pick(HANDLES_A)+pick(HANDLES_B)+(R()<0.6?ri(1,99):''); } while(used[h]); used[h]=1;
    const c=NPC_TYPES[ty].cash;
    const n={ id:i+1, h, ty, cash:Math.round(rf(c[0],c[1])), inc:Math.round(rf(c[0],c[1])*0.06), tm:ri(0,29), pids:[], gr:+R().toFixed(2), kn:+rf(0.08,0.4).toFixed(2), setProd:-1 };
    if (ty==='dealer'||ty==='high') n.kn=+rf(0.05,0.15).toFixed(2);
    if (ty==='casual') n.kn=+rf(0.25,0.55).toFixed(2);
    G.npcs.push(n);
  });
}
function refreshNPCTastes(){
  const stars = G.players.filter(p=>p.tm!==-1 && (p.S>0.45 || p.war>30));
  for (const n of G.npcs){
    if (n.ty==='pc' && !n.pids.length) n.pids = [pick(stars).id, pick(stars).id];
    if (n.ty==='set' && (n.setProd<0 || R()<0.02)){ const rel=releasedProducts().filter(p=>B(p).name!=='Summit Luxe'); if (rel.length) n.setProd = pick(rel.slice(-14)).id; }
  }
}
function interest(n, item){
  if (item.comic) return cmInterest(n, item);
  if (isComicNPC(n)) return n.cd ? 0.6 : 0.04;
  if (item.sealed){ const f={dealer:1,casual:item.v<70?1.05:0.3,flip:0.9,high:0.95,set:1.05,prospect:0.9,rookie:0.85,deal:0.8}[n.ty]; return f||0.5; }
  const card=item.card, d=D(card.k), p=P(d.pid), v=item.v; const yrsOld=yearOf(G.day)-d.prod.yr;
  let f;
  switch(n.ty){
    case 'set': f = d.prod.id===n.setProd && d.sec==='b' && !d.par ? 1.3 : v<4?0.75:0.3; break;
    case 'rookie': f = d.rc||d.first ? 1.15 : 0.3; break;
    case 'team': f = p.tm===n.tm ? 1.3 : 0.2; break;
    case 'prospect': f = prospectBonus(p)>0.12 ? 1.05+Math.max(0,p.hy) : 0.2; break;
    case 'high': f = v>=80 ? 1.05 : 0.05; break;
    case 'auto': f = d.auto ? 1.2 : 0.2; break;
    case 'vintage': f = (yrsOld>=4 || p.tm===-2) ? 1.15 : 0.25; break;
    case 'pc': f = n.pids.includes(p.id) ? 1.6 : 0.1; break;
    case 'deal': f = 0.72; break;
    case 'flip': f = 0.84; break;
    case 'casual': f = v<25 ? 1.0 : 0.25; break;
    case 'dealer': f = 0.72; break;
    default: f=0.5;
  }
  if (card.g>0) f *= 0.85+0.35*n.gr; else f *= 1.08-0.2*n.gr;
  return f;
}
function itemOf(l){
  if (l.it==='m'){ const cp=G.mc[l.ref]; const d=cmD(cp.k); const s=d.s; const H=s.heat+s.spec; return { comic:true, cm:cp, key:cp.k, v:cmCopyValue(cp), heat:0.3+0.3*Math.min(4,H)+(!d.tr&&(d.n===1||issueKeys(s,d.n).length)?0.35:0)+(s.fro>0?s.fro:0) }; }
  if (l.it==='s'){ const s=G.sealed[l.ref]; const prod=G.products[s.p]; return { sealed:true, s, prod, key:sealedKey(prod,s.f), v:sealedFair(prod,s.f), heat:0.9+Math.max(0,rookieIndex(prod))*1.2 }; }
  const card=C(l.ref); const d=D(card.k);
  return { card, key:card.k, v:cardValue(card), heat:0.35+1.8*clamp(playerScore(P(d.pid)),0,1.3) };
}
function liquidity(item){ return item.heat*1.3/(1+Math.pow(item.v/30,0.7)) * (item.v<1?0.35:1); }
function bidInc(x){ return x<10?0.5: x<50?1: x<200?2.5: x<1000?10: 25; }

// ---- listings ----
function createListing(it, ref, seller, ty, price, dur, off){
  const l={ id:G.nextLid++, it, ref, sel:seller, ty, pr:Math.round(price*100)/100, st:G.day, en: ty==='auc'? G.day+dur : G.day+45, off:!!off, bids:[], cur:0, hist:[], offers:[] };
  if (ty==='auc') l.cur = l.pr;
  G.lst.push(l);
  if (it==='c') C(ref).l=l.id; else if (it==='m') G.mc[ref].l=l.id; else G.sealed[ref].l=l.id;
  return l;
}
function L(id){ return G.lst.find(l=>l.id===id); }
function removeListing(l){ const i=G.lst.indexOf(l); if (i>=0) G.lst.splice(i,1); if (l.it==='c'){ const c=C(l.ref); if(c) delete c.l; } else if (l.it==='m'){ const c=G.mc[l.ref]; if (c) delete c.l; } else { const s=G.sealed[l.ref]; if(s) delete s.l; } }
function transfer(l, buyer, price, how){
  const seller=l.sel; const item=itemOf(l);
  const gross=Math.round(price*100)/100;
  if (buyer===0){ G.player.cash-=gross; G.player.bought+=gross; } else NPC(buyer).cash-=gross;
  const net=Math.round(gross*(1-FEE)*100)/100;
  if (seller===0){ G.player.cash+=net; G.player.sold+=gross; G.player.fees+=gross-net; } else NPC(seller).cash+=net;
  const g = item.sealed?0: item.comic? (item.cm.g>0?item.cm.g:0) : (item.card.g>0?item.card.g:0);
  if (item.comic && buyer>0 && gross>=item.v*1.02){ const s=cmD(item.key).s; s.fro=Math.min(0.9,(s.fro||0)+0.012); }
  recordSale(item.key, gross, g, buyer, seller);
  if (l.it==='m'){ const c=item.cm; c.o=buyer; if (buyer===0){ c.a=[G.day,how==='auc'?'won':'bought',gross,ownerName(seller)]; (c.h=c.h||[]).push([G.day,how==='auc'?'Won at auction':'Bought',gross,ownerName(seller)]); } if (seller===0){ (c.h=c.h||[]).push([G.day,'Sold',gross,ownerName(buyer)]); (G.player.soldComics=G.player.soldComics||[]).push(c.id); if (G.player.soldComics.length>200) G.player.soldComics.shift(); } if (buyer>0 && G._npcComicIds && seller===0) G._npcComicIds.push(c.id); }
  else if (l.it==='c'){ const c=item.card; c.o=buyer; if (buyer===0){ c.a=[G.day,how==='auc'?'won':'bought',gross,ownerName(seller)]; (c.h=c.h||[]).push([G.day,how==='auc'?'Won at auction':'Bought',gross,ownerName(seller)]); } if (seller===0){ (c.h=c.h||[]).push([G.day,'Sold',gross,ownerName(buyer)]); G.player.soldCards.push(c.id); if (G.player.soldCards.length>200) G.player.soldCards.shift(); }
    if (buyer>0){ if (NPC(buyer).ty==='flip' && gross < item.v*0.88) c.fl=1; if (G._npcCardIds && seller===0) G._npcCardIds.push(c.id); } }
  else { const s=item.s; s.o=buyer; if (buyer===0) s.a=[G.day,'bought',gross,ownerName(seller)]; }
  removeListing(l);
  if (seller===0||buyer===0) toast((seller===0? 'Sold ':'Bought ')+itemLabel(l)+' for '+money(gross)+(seller===0?' (you receive '+money(net)+')':''));
}
function itemLabel(l){ if (l.it==='m') return cmItemLabel(G.mc[l.ref]); if (l.it==='s'){ const s=G.sealed[l.ref]; return prodName(G.products[s.p])+' '+FMT_NAME[s.f].toLowerCase(); } const c=C(l.ref), d=D(c.k); return pname(P(d.pid))+' '+d.prod.yr+' '+B(d.prod).short+' '+d.title; }
function recordSale(key, price, g, buyer, seller){
  const a = G.sales[key] || (G.sales[key]=[]);
  a.unshift([G.day, price, g]); if (a.length>24) a.length=24;
  G.dp[key]=(G.dp[key]||0)+0.035; if (key[0]==='M') cfvClear(key); else fvClear(key);
  if (key[0]!=='S' && key[0]!=='M'){ const pid=D(key).pid; G.sat[pid]=(G.sat[pid]||0)+ (price<3?0.002:0.006); }
  if (price>=25 || buyer===0 || seller===0){ G.feed.unshift([G.day,key,price,g,buyer,seller]); if (G.feed.length>200) G.feed.length=200; }
}

// ---- NPC side of the market ----
function npcValuation(n, item){ return item.v * interest(n,item) * Math.exp(gauss()*n.kn); }
function findBuyer(item, price, exclude){
  for (let tries=0; tries<10; tries++){
    const n=pick(npcPool(item)); if (n.id===exclude) continue;
    if (n.cash < price) continue;
    const val = npcValuation(n, item);
    const need = (n.ty==='deal'||n.ty==='flip'||n.ty==='dealer') ? price*1.12 : price;
    if (val >= need) return n;
  }
  return null;
}
function marketTick(){
  const t=G.day;
  const boughtKey={};
  // 1. auctions: new bidders, endings
  for (const l of G.lst.slice()){
    if (l.ty!=='auc') continue;
    const item=itemOf(l);
    const last = l.en-t;
    if (last>=0){
      const lam = liquidity(item)*1.25*(last===0?2.5:1);
      const k = poisson(lam);
      for (let i=0;i<k;i++){
        const n=pick(npcPool(item)); if (n.id===l.sel || l.bids.some(b=>b[0]===n.id)) continue;
        let mx = npcValuation(n,item)*Math.exp(gauss()*0.12);
        if (n.ty==='deal'||n.ty==='flip'||n.ty==='dealer') mx*=0.82;
        mx = Math.min(mx, n.cash);
        if (mx >= l.cur + (l.bids.length?bidInc(l.cur):0)) placeBid(l, n.id, Math.round(mx*100)/100);
      }
    }
    if (t>=l.en) endAuction(l);
  }
  // 2. Buy Now purchases
  const bins = G.lst.filter(l=>l.ty==='bin').sort((a,b)=>a.pr-b.pr);
  for (const l of bins){
    if (!G.lst.includes(l)) continue;
    const item=itemOf(l); if (item.v<=0) continue;
    const ratio = l.pr/item.v;
    const resp = clamp(Math.exp(-5*(ratio-0.92)), 0, 3);
    const lam = liquidity(item)*resp*0.6*Math.pow(0.45, boughtKey[item.key]||0);
    if (R() < 1-Math.exp(-lam)){
      const b = findBuyer(item, l.pr, l.sel);
      if (b){ transfer(l, b.id, l.pr, 'bin'); boughtKey[item.key]=(boughtKey[item.key]||0)+1; continue; }
    }
    // 3. offers on the player's listings
    if (l.sel===0 && l.off && l.offers.length<3 && R() < liquidity(item)*0.35){
      const n=pick(npcPool(item)); const val=npcValuation(n,item); const amt = nicePrice(Math.min(val*rf(0.78,0.95), l.pr*0.97));
      if (amt>=l.pr*0.55 && n.cash>=amt) { l.offers.push({id:G.nextLid++, who:n.id, amt, exp:t+2, val}); G.player.newOffers=(G.player.newOffers||0)+1; }
    }
    // stale NPC listings drop price or expire
    if (l.sel>0){ const age=t-l.st; if (age>0 && age%8===0) l.pr = Math.max(0.99, Math.round(l.pr*0.92*100)/100); if (t>=l.en) removeListing(l); }
  }
  for (const l of G.lst) if (l.offers.length) l.offers = l.offers.filter(o=>o.exp>=t);
  // 4. NPC listing creation
  const npcListings = G.lst.filter(l=>l.sel>0 && (l.it==='c'||l.it==='s')).length;
  const target = 520;
  const nNew = clamp(Math.round((target-npcListings)/4)+ri(6,14), 4, 60);
  const ncards = G._npcCardIds || (G._npcCardIds = Object.keys(G.cards).map(Number).filter(id=>G.cards[id].o>0));
  for (let i=0;i<nNew;i++) npcListOne();
  if (R()<0.05) npcLiquidation();
  // sealed listings
  if (R()<0.5) npcListSealed();
}
function placeBid(l, who, mx){
  const ex = l.bids.find(b=>b[0]===who);
  if (ex) ex[1]=Math.max(ex[1],mx); else l.bids.push([who,mx]);
  l.bids.sort((a,b)=>b[1]-a[1]);
  const top=l.bids[0], second=l.bids[1];
  const prevLeader = l.lead;
  const newCur = second ? Math.min(top[1], second[1]+bidInc(second[1])) : l.pr;
  if (newCur!==l.cur || prevLeader!==top[0]){ l.cur = Math.round(newCur*100)/100; l.lead=top[0]; l.hist.unshift([G.day, top[0], l.cur]); if (l.hist.length>40) l.hist.length=40; }
  if (prevLeader===0 && top[0]!==0 && l.sel!==0) G.player.outbid=(G.player.outbid||[]).concat([l.id]).slice(-20);
}
function endAuction(l){
  const item=itemOf(l);
  const mine = l.bids.some(b=>b[0]===0);
  const label = mine ? itemLabel(l) : '';
  while (l.bids.length){
    const top=l.bids[0];
    const price = l.bids[1] ? Math.min(top[1], l.bids[1][1]+bidInc(l.bids[1][1])) : l.pr;
    const cash = top[0]===0 ? G.player.cash : NPC(top[0]).cash;
    if (cash >= price){ transfer(l, top[0], price, 'auc'); if (mine && top[0]!==0) toast('Auction lost: '+label+' went to '+ownerName(top[0])+' for '+money(price,true)); return; }
    l.bids.shift();
  }
  if (l.sel===0) toast('Your auction for '+itemLabel(l)+' ended with no bids');
  removeListing(l);
}
function npcListOne(){
  const ids = G._npcCardIds; if (!ids.length) return;
  let card=null;
  for (let tries=0; tries<14 && !card; tries++){
    const c=G.cards[ids[Math.floor(R()*ids.length)]];
    if (!c || c.o<=0 || c.l || c.g<0) continue;
    const v=cardValue(c); if (v<1.5) continue;
    const n=NPC(c.o); const p=P(D(c.k).pid);
    // collectors hold favourites, speculators sell into hype or panic-sell into slumps
    const keep = interest(n,{card:c,v})>1.1 ? 0.75 : 0.1;
    let sellBias = 0;
    if (n.ty==='prospect'||n.ty==='flip') sellBias = p.hy>0.25?0.4 : p.hy<-0.12?0.45:0;
    if (c.fl) sellBias=0.9;
    if (R() < keep - sellBias) continue;
    card=c;
  }
  if (!card) return;
  const n=NPC(card.o); const item={card, v:cardValue(card)};
  const sv = item.v*Math.exp(gauss()*n.kn);
  const auc = R()<0.3;
  if (auc){ createListing('c', card.id, n.id, 'auc', Math.max(0.99, nicePrice(sv*rf(0.25,0.8))), pick([3,5,5,7]), false); }
  else {
    let mult = {dealer:rf(1.1,1.4), flip:rf(1.05,1.3), casual:rf(0.75,1.45), high:rf(1.05,1.35)}[n.ty] || rf(0.95,1.35);
    createListing('c', card.id, n.id, 'bin', Math.max(0.99, nicePrice(sv*mult)), 0, R()<0.6);
  }
  delete card.fl;
}
function npcLiquidation(){
  const n=pick(G.npcs.filter(x=>x.ty!=='dealer'));
  const cards=G._npcCardIds.map(id=>G.cards[id]).filter(c=>c && c.o===n.id && !c.l && c.g>=0);
  if (cards.length<6) return;
  const sel=cards.sort((a,b)=>cardValue(b)-cardValue(a)).slice(0,ri(6,16));
  for (const c of sel){ const v=cardValue(c); if (v<2) continue; if (R()<0.5) createListing('c',c.id,n.id,'auc',Math.max(0.99,nicePrice(v*rf(0.2,0.5))),pick([5,7]),false); else createListing('c',c.id,n.id,'bin',Math.max(0.99,nicePrice(v*rf(0.78,1.05))),0,true); }
  addNews(`COLLECTOR ${n.h.toUpperCase()} SELLING OFF A COLLECTION`, `${sel.length} cards hit the market at once, some at no-reserve auction.`, null, 'hobby');
}
function npcListSealed(){
  const pool=Object.values(G.sealed).filter(s=>s.o>0 && !s.l);
  if (!pool.length) return;
  const s=pick(pool); const prod=G.products[s.p]; const n=NPC(s.o); const v=sealedFair(prod,s.f)*Math.exp(gauss()*n.kn*0.5);
  if (R()<0.25) createListing('s',s.id,n.id,'auc',nicePrice(v*rf(0.5,0.85)),pick([3,5,7]),false);
  else createListing('s',s.id,n.id,'bin',nicePrice(v*rf(1.02,1.3)),0,R()<0.5);
}

// ---- world supply: packs the rest of the hobby opens ----
function worldOpen(prod, packs, fmtPref){
  const br=B(prod);
  const fmt = fmtPref && br.formats[fmtPref] ? fmtPref : (br.formats.hobby? 'hobby' : Object.keys(br.formats)[0]);
  const perSealed = br.formats[fmt].packs;
  let opened=0;
  while (opened<packs){
    const pk = genSealed(prod, fmt, Math.floor(R()*2e9));
    for (const pack of pk){ for (const key of pack){
      const d=D(key); let keep;
      if (d.sec!=='b' || d.par || d.hisp) keep = d.ins && !d.par ? R()<0.45 : true;
      else keep = (d.rc||d.first) ? R()<0.22 : R()<0.012;
      if (!keep) continue;
      const owners=[pick(G.npcs),pick(G.npcs),pick(G.npcs),pick(G.npcs)];
      const card=makeCard(key, 0, null);
      const it={card, v:cardValue(card)};
      const own = owners.sort((a,b)=>interest(b,it)-interest(a,it))[0];
      card.o=own.id; card.a=[G.day,'pulled',0,''];
      if (G._npcCardIds) G._npcCardIds.push(card.id);
    } }
    opened+=perSealed;
  }
}
function gradeNPCHoldings(){
  for (const id in G.cards){ const c=G.cards[id]; if (c.o<=0 || c.g) continue; const v=cardValue(c);
    const pG = v>60?0.5: v>20?0.25: v>8?0.08:0.01;
    if (R()<pG){ c.g=gradeFrom(c); popAdd(c.k,c.g); c.cert=ri(10000000,99999999); } }
}
function cullNPCCards(){
  const ids=G._npcCardIds; if (ids.length<9000) return;
  const cand=ids.filter(id=>{ const c=G.cards[id]; return c && c.o>0 && !c.l && c.g===0; }).sort((a,b)=>cardValue(G.cards[a])-cardValue(G.cards[b])).slice(0,ids.length-8000);
  const del=new Set(cand); for (const id of cand) delete G.cards[id];
  G._npcCardIds = ids.filter(id=>!del.has(id) && G.cards[id] && G.cards[id].o>0);
}

// ---- retail ----
function inRetail(prod){ return prod.cl && G.day>=prod.rel && G.day<prod.retailEnd; }
function retailTick(){
  for (const prod of G.products){
    if (!prod.cl) continue;
    if (G.day===prod.retailEnd && !prod.oopNews){ prod.oopNews=1; if (G.live) addNews(`${prodName(prod).toUpperCase()} LEAVES RETAIL SHELVES`, `Remaining sealed product now trades on the secondary market only.`, null,'hobby'); }
    if (!inRetail(prod)) continue;
    const age=G.day-prod.rel; const hype=clamp(Math.exp((rookieIndex(prod)-(prod.rs0||0.3))*2),0.6,2.5);
    const early = age<10 ? 3 : 1;
    for (const f in prod.stock){
      const drain = poisson((f==='hobby'?0.5:f==='pack'?2.6:1.5)*hype*early);
      const before=prod.stock[f];
      prod.stock[f]=Math.max(0, before-drain);
      if (before>0 && prod.stock[f]===0 && G.live) addNews(`${prodName(prod).toUpperCase()} ${FMT_PL[f].toUpperCase()} SELL OUT`, `Retail inventory is gone for now. Restocks aren't guaranteed.`, null,'hobby');
      if ((dowOf(G.day)===2||dowOf(G.day)===5) && prod.stock[f]<12 && R()<0.55 && age<95){ prod.stock[f]+= f==='hobby'? ri(6,16): ri(25,60); if (G.live && prod.stock[f]>0 && before===0) addNews(`${prodName(prod).toUpperCase()} RESTOCKED`, `A fresh shipment of ${FMT_PL[f]} landed at the card shop.`, null,'hobby'); }
      // some of what sells at retail becomes NPC sealed inventory to flip later
      if (drain>0 && R()<0.12){ const n=pick(G.npcs.filter(x=>x.ty==='dealer'||x.ty==='flip')); makeSealed(prod.id, f, n.id, [G.day,'bought',B(prod).formats[f].price,'retail']); }
    }
    worldOpen(prod, Math.round(10*hype*early), null);
  }
}
function makeSealed(pid, f, owner, acq){ const id=G.nextSid++; G.sealed[id]={id, p:pid, f, o:owner, seed:Math.floor(R()*2e9), a:acq}; return G.sealed[id]; }

// ---- daily advance ----
function releaseTick(){
  for (const prod of G.products){
    if (!prod.cl && prod.rel===G.day){ genChecklist(prod); DCACHE.clear();
      if (G.live) addNews(`${prodName(prod).toUpperCase()} RELEASES TODAY`, B(prod).blurb, null,'release'); }
    if (G.live && !prod.cl && prod.rel===G.day+7) addNews(`${prodName(prod).toUpperCase()} ARRIVES NEXT WEEK`, `Collectors are lining up for ${B(prod).short}. Rookie checklist speculation has begun.`, null,'release');
  }
}
function advanceDay(){
  G.day++;
  const t=G.day;
  { const md=mdOf(t); if (md[0]===12 && md[1]===1 && !G.products.some(p=>p.yr===yearOf(t)+1)) scheduleYear(yearOf(t)+1); }
  simLeagueDay(t);
  releaseTick();
  for (const p of G.players){ p.S = playerScore(p); }
  fvClear();
  retailTick();
  if (dowOf(t)===1) { for (const n of G.npcs) n.cash += n.inc; refreshNPCTastes(); }
  if (G.cm && dowOf(t)===3) cmCatchUp();
  if (G.cm) cfvClear();
  marketTick();
  if (G.cm) cmMarketDay(t);
  if (G.hunt) huntDay(t);
  fvClear();
  for (const k in G.dp){ G.dp[k]*=0.955; if (G.dp[k]<0.004) delete G.dp[k]; }
  for (const k in G.sat){ G.sat[k]*=0.95; if (G.sat[k]<0.002) delete G.sat[k]; }
  if (t%3===0) for (const p of G.players){ if (p.tm===-1 && p.pot<60) continue; p.hx.push([t, Math.round(playerBase(p)*100)/100]); if (p.hx.length>140) p.hx.shift(); }
  if (G.live){
    if (dowOf(t)===5){ const pay=G.player.pay!=null?G.player.pay:50; if (pay>0){ G.player.cash += pay; G.player.paid=(G.player.paid||0)+pay; toast('Payday: '+money(pay)+' hobby money added'); } }
    gradingTick();
  }
  if (t%10===0) cullNPCCards();
}

// ---- grading service ----
const GRADE_TIERS = [ {id:'eco',n:'Economy',fee:18,days:14}, {id:'std',n:'Standard',fee:35,days:7}, {id:'exp',n:'Express',fee:80,days:3} ];
function submitGrading(cid, tier){
  const T=GRADE_TIERS.find(x=>x.id===tier); const c=C(cid);
  if (G.player.cash<T.fee) return 'Not enough cash for the '+T.n+' fee.';
  if (c.o!==0 || c.g!==0 || c.l) return 'That card can\'t be submitted right now.';
  G.player.cash-=T.fee; G.player.fees+=T.fee; c.g=-1;
  G.player.subs.push({id:G.nextLid++, cid, tier, t0:G.day, t1:G.day+T.days, fee:T.fee, raw:Math.round(cardValue(c)*100)/100});
  (c.h=c.h||[]).push([G.day,'Sent to GCS ('+T.n+')',T.fee,'']);
  return null;
}
function gradingTick(){
  const back = G.player.subs.filter(s=>s.t1<=G.day);
  for (const s of back){
    const c=C(s.cid); const g=gradeFrom(c); c.g=g; c.cert=ri(10000000,99999999); popAdd(c.k,g);
    c.gt=(c.gt||0)+1; G.player.skill++; if (!G.player.firstGraded) G.player.firstGraded=c.id;
    (G.player.rv=G.player.rv||[]).push({k:'c', id:c.id, g, raw:s.raw||0, fee:s.fee||0, t:G.day});
    (c.h=c.h||[]).push([G.day,'Graded GCS '+g+' '+GRADE_NAMES[g],0,'']);
    G.player.returned.unshift({cid:c.id, t:G.day, g}); if (G.player.returned.length>60) G.player.returned.length=60;
    toast('GCS returned '+pname(P(D(c.k).pid))+': '+g+' '+GRADE_NAMES[g], true);
  }
  G.player.subs = G.player.subs.filter(s=>s.t1>G.day);
}

// ---- player actions ----
function buyRetail(pid, f){
  const prod=G.products[pid]; const price=B(prod).formats[f].price;
  if (!inRetail(prod)) return 'This product is no longer at retail.';
  if (prod.stock[f]<=0) return 'Sold out at retail. Check the marketplace.';
  if (G.player.cash<price) return 'You need '+money(price)+' for this.';
  G.player.cash-=price; G.player.bought+=price; prod.stock[f]--;
  makeSealed(pid, f, 0, [G.day,'bought',price,'Card shop']);
  return null;
}
function openSealed(sid){
  const s=G.sealed[sid]; if (!s || s.o!==0 || s.l) return 'Can\'t open that.';
  const prod=G.products[s.p]; const packs=genSealed(prod, s.f, s.seed);
  const rng=mkRng(s.seed^0x5bd1e995);
  const cost=(s.a&&s.a[2])||0; const nCards=packs.flat().length;
  const src = prodName(prod)+' '+FMT_NAME[s.f].toLowerCase();
  const out = packs.map((pk,pi)=>pk.map(k=>{ const c=makeCard(k,0,[G.day,'pulled',Math.round(cost/nCards*100)/100, src+(packs.length>1?' · pack '+(pi+1):'')], rng); c.h=[[G.day,'Pulled from '+src,0,'']]; c.nw=1; return c.id; }));
  G.player.packs += packs.length;
  G.player.opened.unshift({t:G.day, p:s.p, f:s.f, cost, cards:out.flat()}); if (G.player.opened.length>40) G.player.opened.length=40;
  delete G.sealed[sid];
  G.player.pending = { p:s.p, f:s.f, packs:out, pi:0 };
  return null;
}
function buyListing(lid){
  const l=L(lid); if (!l || l.ty!=='bin') return 'That listing is gone.';
  if (l.sel===0) return 'That\'s your own listing.';
  if (G.player.cash<l.pr) return 'You need '+money(l.pr)+'.';
  transfer(l, 0, l.pr, 'bin'); return null;
}
function playerBid(lid, amt){
  const l=L(lid); if (!l || l.ty!=='auc') return 'That auction is over.';
  if (l.sel===0) return 'You can\'t bid on your own auction.';
  const min = l.bids.length ? l.cur+bidInc(l.cur) : l.pr;
  if (amt < min) return 'Your max bid must be at least '+money(min,true)+'.';
  if (G.player.cash < amt) return 'Your max bid can\'t exceed your cash.';
  placeBid(l, 0, amt);
  if (!G.player.watch.includes(lid)) G.player.watch.push(lid);
  return l.lead===0 ? null : 'Outbid instantly — another collector\'s max is higher. Current bid '+money(l.cur,true)+'.';
}
function playerOffer(lid, amt){
  const l=L(lid); if (!l || l.ty!=='bin' || l.sel===0) return {err:'Offers aren\'t possible here.'};
  if (G.player.cash<amt) return {err:'You don\'t have '+money(amt)+'.'};
  if (l.tried && l.tried>=2) return {err:'The seller has stopped responding to offers on this listing.'};
  l.tried=(l.tried||0)+1;
  const n=NPC(l.sel); const item=itemOf(l);
  const floor = Math.min(l.pr, item.v*Math.exp(gauss()*n.kn*0.5)) * ({dealer:0.9,flip:0.92,casual:0.8,high:0.9}[n.ty]||0.86);
  if (amt>=floor){ transfer(l,0,amt,'offer'); return {ok:'Offer accepted.'}; }
  if (amt>=floor*0.85){ const counter=nicePrice((floor+l.pr)/2); l.counter=counter; return {counter}; }
  return {no:'Declined. The seller isn\'t close to that number.'};
}
function playerList(it, ref, ty, price, dur, off){
  if (!(price>0)) return 'Enter a price.';
  const obj = it==='c'? C(ref) : it==='m'? G.mc[ref] : G.sealed[ref];
  if (!obj || obj.o!==0 || obj.l) return 'Not available to list.';
  if (it==='c' && obj.g<0) return 'That card is at the grader.';
  if (it==='m' && obj.g<0) return 'That comic is away being graded or pressed.';
  createListing(it, ref, 0, ty, price, dur, off); G.player.listed++;
  return null;
}
function answerOffer(lid, oid, accept, counter){
  const l=L(lid); if (!l) return 'Listing gone.'; const o=l.offers.find(x=>x.id===oid); if (!o) return 'Offer expired.';
  if (accept){ if (NPC(o.who).cash<o.amt) { l.offers=l.offers.filter(x=>x!==o); return 'The buyer backed out.'; } transfer(l,o.who,o.amt,'offer'); return null; }
  if (counter){ l.offers=l.offers.filter(x=>x!==o); if (counter<=o.val*0.98 && NPC(o.who).cash>=counter){ transfer(l,o.who,counter,'offer'); return null; } return 'Counter declined by '+NPC(o.who).h+'.'; }
  l.offers=l.offers.filter(x=>x!==o); return null;
}
function cancelListing(lid){ const l=L(lid); if (!l || l.sel!==0) return 'Listing not found.'; if (l.ty==='auc' && l.bids.length) return 'Auctions with bids can\'t be cancelled.'; removeListing(l); return null; }
function acceptCounter(lid){ const l=L(lid); if (!l || !l.counter) return 'The counteroffer has expired.'; if (G.player.cash<l.counter) return 'You need '+money(l.counter)+'.'; const amt=l.counter; delete l.counter; transfer(l,0,amt,'offer'); return null; }
function bulkSell(ids){ let n=0; for (const id of ids){ const c=C(id); if (!c||c.o!==0||c.l||c.g) continue; c.o=-9; delete G.cards[id]; n++; } const cash=Math.round(n*0.04*100)/100; G.player.cash+=cash; G.player.sold+=cash; return [n,cash]; }

// ---- new game ----
async function newGame(seed, prog){
  if (typeof resetCaches==='function') resetCaches();
  prog = prog || (async()=>{});
  G = { v:1, seed, rs:seed|0, day:dateToDay(2020,1,12), products:[], cards:{}, sealed:{}, npcs:[], lst:[], sales:{}, feed:[], dp:{}, sat:{}, ser:{}, pop:{},
    nextCid:1, nextSid:1, nextLid:1, live:false,
    player:{ cash:75, bought:0, sold:0, fees:0, packs:0, listed:0, skill:0, subs:[], returned:[], watch:[], follow:[], show:{}, opened:[], soldCards:[], notes:{}, tips:{}, pending:null, paid:0, start:0, fav:[] } };
  R = worldRnd; DCACHE.clear(); fvClear();
  initLeague();
  for (let yr=2020; yr<=2025; yr++){
    await prog(0.05+(yr-2020)*0.09, 'Playing the '+yr+' season');
    G.day = dateToDay(yr,1,12);
    if (yr===2020) G.rookieClass[2020] = G.players.filter(p=>p.dy===2020 && p.tm>=0).map(p=>p.id); else newYear(yr,false);
    for (const id of G.rookieClass[yr]) { const p=P(id); if (p.tm===-1){ p.tm=p.org; } p.dy=yr; p.dd=0; }
    for (const p of G.players) p.S=playerScore(p);
    scheduleYear(yr);
    for (const prod of G.products.filter(p=>p.yr===yr)){ G.day=prod.rel; genChecklist(prod); }
    simSeasonFast(yr);
    offseason(yr,false);
  }
  for (const p of G.players){ p.S=playerScore(p); careerTotals(p); markMilestones(p); }
  G.day=dateToDay(2026,1,2); scheduleYear(2026);
  await prog(0.6,'Printing six years of cards'); makeNPCs(); refreshNPCTastes();
  G._npcCardIds=[];
  for (const prod of G.products.filter(p=>p.cl)) worldOpen(prod, B(prod).luxe? 40 : 190, null);
  await prog(0.64,'Sending slabs to GCS'); gradeNPCHoldings();
  if (packHas('comics')){ const d0=G.day; await cmGenerate(async(f,m)=>prog(0.65+f*0.06, m), dateToDay(2026,2,26)); G.day=d0; withCm(()=>{ makeComicNPCs(); G.day=dateToDay(2026,2,26); cmSeedMarket(); cmShopWeek(G.cm.last); G.day=d0; }); }
  for (const prod of G.products.filter(p=>p.cl)) for (const f in B(prod).formats){ const n=f==='hobby'?ri(2,5):ri(1,3); for (let i=0;i<n;i++) makeSealed(prod.id,f,pick(G.npcs.filter(x=>x.ty==='dealer'||x.ty==='high'||x.ty==='flip'||x.ty==='set')).id,[G.day,'bought',0,'']); }
  // run the world forward: league from Jan, market from March
  const start = dateToDay(2026,6,1);
  while (G.day < start-1){
    const marketOn = G.day >= dateToDay(2026,3,1);
    if (marketOn) advanceDay(); else { G.day++; simLeagueDay(G.day); releaseTick(); for (const p of G.players) p.S=playerScore(p); fvClear(); retailTick(); }
    if (G.day===dateToDay(2026,4,1)) G.live=true;
    if (G.day%6===0) await prog(0.7+0.3*(G.day-dateToDay(2026,1,2))/(start-dateToDay(2026,1,2)), G.day<dateToDay(2026,3,1)?'Spring training':'Opening the marketplace');
  }
  G.live=true;
  G.news = G.news.filter(n=>n.t>=dateToDay(2026,3,1));
  G.day = start-1; advanceDay();
  huntInit();
  G.player.cash=75; G.player.start=G.day; G.player.paid=0;
  return G;
}
function markMilestones(p){ const ct=careerTotals(p); const checks=isPitcher(p)?[[3,[150,200,250,300]],[5,[2000,2500,3000,3500]]]:[[3,[300,400,500,600]],[2,[2000,2500,3000]]]; for (const [i,ms] of checks) for (const m of ms) if (ct[i]>=m) p.ms[i+':'+m]=1; }

// ---- save / load ----
const SAVE_KEY='ccs_save_v1';
async function packState(){
  const json = JSON.stringify(G, saveReplacer);
  if (typeof CompressionStream!=='undefined'){
    const cs = new Blob([json]).stream().pipeThrough(new CompressionStream('gzip'));
    const buf = new Uint8Array(await new Response(cs).arrayBuffer());
    let bin=''; for (let i=0;i<buf.length;i+=0x8000) bin+=String.fromCharCode.apply(null, buf.subarray(i,i+0x8000));
    return 'gz:'+btoa(bin);
  }
  return 'js:'+json;
}
async function unpackState(s){
  if (s.startsWith('gz:')){
    const bin=atob(s.slice(3)); const buf=new Uint8Array(bin.length); for (let i=0;i<bin.length;i++) buf[i]=bin.charCodeAt(i);
    const ds = new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip'));
    return JSON.parse(await new Response(ds).text());
  }
  return JSON.parse(s.slice(3));
}
// Saves go to two places: this browser (fast) and the player's private
// slot in the artifact's database (survives leaving the page, other devices).
const CLOUD={ db:null, uid:null, slot:null, lastTs:0, lastOk:0, err:'' };
CLOUD.ready = (async()=>{
  try {
    if (typeof window==='undefined' || !window.claude || !window.claude.use) return false;
    const timeout = new Promise(r=>setTimeout(()=>r(null), 8000));
    const [db,user] = await Promise.all([Promise.race([window.claude.use('db'),timeout]), Promise.race([window.claude.use('user'),timeout])]);
    if (!db || !user) return false;
    const uid = await user.id(); if (!uid) return false;
    CLOUD.db=db; CLOUD.uid=uid; return true;
  } catch(e){ CLOUD.err=String(e&&e.message||e); return false; }
})();
const CHUNK=230000;
async function cloudSave(s, ts){
  if (!(await CLOUD.ready)) return false;
  const u='data/users/'+CLOUD.uid; const n=Math.ceil(s.length/CHUNK); const slot = CLOUD.slot==='A'?'B':'A';
  for (let i=0;i<n;i++) await CLOUD.db.doc(u+'/'+slot+i).set({ d:s.slice(i*CHUNK,(i+1)*CHUNK) });
  await CLOUD.db.doc(u+'/meta').set({ slot, n, ts, day:G.day, len:s.length, v:1 });
  CLOUD.slot=slot; CLOUD.lastOk=Date.now(); CLOUD.err=''; return true;
}
async function cloudLoad(){
  if (!(await CLOUD.ready)) return null;
  const u='data/users/'+CLOUD.uid;
  const m=await CLOUD.db.doc(u+'/meta').get(); if (!m.exists) return null;
  const meta=m.data(); CLOUD.slot=meta.slot;
  const parts=await Promise.all(Array.from({length:meta.n},(_,i)=>CLOUD.db.doc(u+'/'+meta.slot+i).get()));
  if (parts.some(p=>!p.exists)) return null;
  const s=parts.map(p=>p.data().d).join(''); if (s.length!==meta.len) return null;
  return { s, ts:meta.ts||0 };
}
let saving=false, saveAgain=false, lastCloud=0, cloudTimer=null, pendingStr=null;
async function saveGame(force){
  if (saving){ saveAgain=true; return; } saving=true;
  try {
    const ts=Date.now(); const s=await packState(); G._saveTs=ts;
    try { localStorage.setItem(SAVE_KEY, s); localStorage.setItem(SAVE_KEY+'_ts', String(ts)); G._localOk=true; } catch(e){ G._localOk=false; }
    pendingStr=[s,ts];
    const wait = force? 0 : Math.max(0, 4000-(Date.now()-lastCloud));
    clearTimeout(cloudTimer); cloudTimer=setTimeout(flushCloud, wait);
    G._saveOk = G._localOk || !!CLOUD.db;
  } catch(e){ G._saveOk=false; console.warn('save failed', e); }
  saving=false; if (saveAgain){ saveAgain=false; saveGame(); }
}
let flushing=false;
async function flushCloud(){
  if (!pendingStr || flushing) return; flushing=true;
  const [s,ts]=pendingStr; pendingStr=null; lastCloud=Date.now();
  try { await cloudSave(s,ts); } catch(e){ CLOUD.err=String(e&&e.code||e&&e.message||e); console.warn('cloud save failed', e); }
  flushing=false; if (pendingStr) flushCloud();
}
if (typeof document!=='undefined') document.addEventListener('visibilitychange', ()=>{ if (document.visibilityState==='hidden' && G && G.player && G.player.start) { clearTimeout(cloudTimer); flushCloud(); } });
async function loadGame(){
  let local=null, lts=0;
  try { local=localStorage.getItem(SAVE_KEY); lts=+(localStorage.getItem(SAVE_KEY+'_ts')||0); } catch(e){}
  let cloud=null; try { cloud=await cloudLoad(); } catch(e){ console.warn('cloud load failed', e); }
  const pickCloud = cloud && (!local || cloud.ts>=lts);
  const cands = pickCloud? [cloud.s, local] : [local, cloud&&cloud.s];
  for (const s of cands){ if (!s) continue;
    try { G = await unpackState(s); R=worldRnd; if (typeof resetCaches==='function') resetCaches(); DCACHE.clear(); fvClear(); G._npcCardIds=Object.keys(G.cards).map(Number).filter(id=>G.cards[id].o>0); if (G.cm) cmNormalize(); huntNormalize(); return true; }
    catch(e){ console.warn('load failed', e); } }
  return false;
}
async function importSave(s){ const g=await unpackState(s.trim()); if (!g || !g.player || !g.cards) throw new Error('Not a save file'); G=g; R=worldRnd; if (typeof resetCaches==='function') resetCaches(); DCACHE.clear(); fvClear(); G._npcCardIds=Object.keys(G.cards).map(Number).filter(id=>G.cards[id].o>0); if (G.cm) cmNormalize(); await saveGame(true); }
var toast = function(){};
