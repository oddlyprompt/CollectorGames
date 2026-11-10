// Player agents. This file runs INSIDE the game's script context (see harness.cjs), so it can call the game's own functions.
// Each agent only does what a player can do through the game's actions (buy, open, list, answer offers, bid, grade, sell to a shop).
// AG.start(name, cash) prepares a world for one agent; AG.step() plays one day (act, then advanceDay); AG.report() returns the numbers.
var AG=(function(){
  const lines=()=>CARD_LINES.filter(L=>L.has());
  const AD=()=> (typeof RETAIL!=='undefined'&&RETAIL)? RETAIL.adapters : null;
  const adOfKind=k=>{ const A=AD(); return A? A[({t:'wk',x:'xt',b:'br'})[k]] : null; };
  const isSealed=(L,c)=>{ const a=adOfKind(L.kind); return a? !!a.D(c.k).sealed : false; };
  const openMany={t:ids=>tcOpenMany(ids), x:ids=>xtOpenMany(ids), b:ids=>brOpenMany(ids)};
  const S={name:'',acts:0,log:[],spentPacks:0,pulled:0,flips:0,flipCost:0,flipNet:0,series:[]};
  const act=()=>{ S.acts++; };
  // ---- shared helpers ----
  function shelves(){ // every sealed SKU in every location with its price and the model's fair value
    const out=[]; if (!AD()||!G.retail) return out;
    for (const p of RETAIL.profiles){ const s=G.retail.locations[p.id]; for (const [k,x] of Object.entries(s.stock)){ if (x.q<=0) continue; const a=RETAIL.adapters[x.g]; out.push({loc:p.id,kind:p.kind,k,x,g:x.g,price:RETAIL.sealedPrice(p.id,x),fair:a.fair(k),inPrint:a.inPrint(x.n,G.day)}); } }
    return out;
  }
  function listAt(L,c,mult){ const v=L.value(c); if (v<0.5) return; const e=playerList(L.kind,c.id,'bin',Math.max(0.5,Math.round(v*mult*100)/100),0,true); if (!e) act(); }
  function answerOffers(minFrac){ for (const l of G.lst.filter(l=>l.sel===0&&l.offers&&l.offers.length)){ const o=l.offers.slice().sort((a,b)=>b.amt-a.amt)[0]; if (o.amt>=l.pr*minFrac){ answerOffer(l.id,o.id,true); act(); } } }
  function relistStale(mult){ for (const L of lines()) for (const c of L.mine()){ if (c.l||c.g<0||c._hold) continue; if (c._sell) listAt(L,c,mult); } }
  function buyPacks(n, pickSet){ // cheapest in-print packs across locations, optionally a line filter
    let left=n; const sh=shelves().filter(s=>s.x.f==='P'&&s.inPrint&&(!pickSet||pickSet(s))).sort((a,b)=>a.price-b.price);
    for (const s of sh){ while (left>0 && s.x.q>0 && G.player.cash>=s.price){ const e=RETAIL.sealedBuy(s.loc,s.k,1); if (e) break; left--; S.spentPacks+=s.price; act(); } if (!left) break; }
    return n-left;
  }
  function openAll(){ for (const L of lines()){ const ids=L.mine().filter(c=>isSealed(L,c)&&!c.l&&!c._hold).map(c=>c.id); if (ids.length){ const r=openMany[L.kind](ids); if (r){ S.pulled+=r.packs.length; act(); } } } }
  // ---- strategies ----
  // walk every independent shop and buy singles tagged at 70% of value or less (value $2+)
  function pickShops(){
    if (!AD()) return;
    for (const p of RETAIL.profiles){
      if (p.kind!=='local') continue;
      const st=G.retail.locations[p.id]; RETAIL.visit(p.id);
      for (const ref of st.singles.slice()){
        const c=RETAIL.getCopy(ref.g,ref.id); if (!c) continue;
        const v=RETAIL.adapters[ref.g].value(c), pr=RETAIL.singlePrice(p.id,ref.g,c);
        if (v<2 || pr>v*0.7 || pr>G.player.cash*0.3) continue;
        if (!RETAIL.singleBuy(p.id,ref.g,c.id)){ act(); S.flips++; S.flipCost+=pr; c._sell=1; }
      }
    }
  }
  function markPulls(){ for (const LL of lines()) for (const c of LL.mine()) if (!c.l && !isSealed(LL,c) && c.g>=0 && LL.value(c)>=2) c._sell=1; }
  // yard sales, collections and card shows, the way a careful and knowledgeable player would do them
  function huntDay(){
    const h=CIRCUIT.H();
    for (const L of h.leads.slice()){
      if (!CIRCUIT.canGo(L) || CIRCUIT.go(L.id)) continue;
      act(); const a=RETAIL.adapters[L.g]; let est;
      if (L.ty==='yard'){ const top=L.top.slice(0,L.shown).map(id=>RETAIL.getCopy(L.g,id)).filter(Boolean); est=top.reduce((x,c)=>x+a.value(c),0)/Math.max(1,top.length)*CIRCUIT.liveRefs(L).length; }
      else { const top=CIRCUIT.liveRefs(L).map(r=>a.value(RETAIL.getCopy(r.g,r.id))).sort((x,y)=>y-x).slice(0,8); est=top.reduce((x,v)=>x+v,0)*1.25; }
      if (est<L.ask*1.3) continue;
      CIRCUIT.haggle(L.id); if (G.player.cash<L.ask) continue;
      const r=CIRCUIT.buyLot(L.id);
      if (r && r.n){ act(); S.lots=(S.lots||0)+1; S.flipCost+=L.ask; S.lotPaid=(S.lotPaid||0)+L.ask; S.lotWorth=(S.lotWorth||0)+r.worth; markPulls(); }
    }
    if (h.show && h.show.day===G.day && !CIRCUIT.enterShow()){
      act(); S.shows=(S.shows||0)+1;
      for (const T of h.show.tables) for (const ref of T.refs.slice()){
        const c=RETAIL.getCopy(ref.g,ref.id); if (!c) continue;
        const v=RETAIL.adapters[ref.g].value(c); if (v<2 || ref.p>G.player.cash*0.3) continue;
        const offer=ref.p>v*0.75 && ref.p*0.9<=v*0.75 && !T.firm[ref.g+ref.id];
        if (ref.p<=v*0.75 || offer){ if (!CIRCUIT.showBuy(T.id,ref.g,ref.id,offer)){ act(); S.flips++; S.flipCost+=ref.p; c._sell=1; } }
      }
    }
  }
  const STRATS={
    idle(){},
    // shop picker: the independent shops every day, bargains listed online at full value
    picker(){ pickShops(); relistStale(1.0); answerOffers(0.85); },
    // the full hunt: shops, yard sales, collections and card shows
    hunter(){ pickShops(); huntDay(); relistStale(1.0); answerOffers(0.85); },
    // buys ten packs a week from the cheapest shelf, opens them, keeps everything
    ripper(){ if (dowOf(G.day)===6){ buyPacks(10); openAll(); } },
    // the same, but lists every pull worth $2 or more at its value and sells the rest to shop buylists once a month
    ripseller(){ if (dowOf(G.day)===6){ buyPacks(10); openAll(); for (const L of lines()) for (const c of L.mine()) if (!c.l&&!isSealed(L,c)&&c.g===0&&L.value(c)>=2){ c._sell=1; } } relistStale(1.0); answerOffers(0.85);
      if (G.day%28===0 && AD()) for (const L of lines()){ const g=({t:'wk',x:'xt',b:'br'})[L.kind]; for (const c of L.mine()){ if (c.l||c._sell||isSealed(L,c)||c.g!==0) continue; let best=null,bp=0; for (const p of RETAIL.profiles){ const o=RETAIL.offer(p.id,g,c); if (o>bp){ bp=o; best=p.id; } } if (best && bp>=0.05 && !RETAIL.sell(best,g,c.id)){ act(); S.buylist=(S.buylist||0)+bp; } } } },
    // market sniper: buys any buy-it-now listing at 70% of the card's value or less (value $2+), relists at full value, takes offers of 85%
    sniper(){ for (const l of G.lst.slice()){ if (l.sel<=0||l.ty!=='bin') continue; const it=itemOf(l); if (!(it.v>=2) || l.pr>it.v*0.7 || l.pr>G.player.cash*0.5) continue; const L=cardLineOfKind(l.it); if (!L) continue; const ref=l.ref, pr=l.pr; if (!buyListing(l.id)){ act(); S.flips++; S.flipCost+=pr; const c=L.copies()[ref]; c._sell=1; } }
      // auctions ending today: bid up to 60% of value
      for (const l of G.lst.slice()){ if (l.sel<=0||l.ty!=='auc'||l.en!==G.day) continue; const it=itemOf(l); if (!(it.v>=4)) continue; const cap=it.v*0.6; const min=l.bids.length? l.cur+bidInc(l.cur) : l.pr; if (min<=cap && min<=G.player.cash*0.5){ const e=playerBid(l.id,Math.round(cap*100)/100); if (!e){ act(); S.bids=(S.bids||0)+1; } } }
      for (const L of lines()) for (const c of L.mine()) if (!c._sell && !c.l && c.a && c.a[1]==='won'){ c._sell=1; S.flips++; S.flipCost+=c.a[2]; }
      relistStale(1.0); answerOffers(0.85); },
    // buys sealed product from any shop that prices it at 80% of its fair value or less, relists it at 95% of fair value
    clearance(){ for (const s of shelves()){ if (s.price>s.fair*0.8) continue; let n=0; while (s.x.q>0 && G.player.cash>=s.price && n<20){ if (RETAIL.sealedBuy(s.loc,s.k,1)) break; n++; act(); S.flips++; S.flipCost+=s.price; } }
      for (const L of lines()) for (const c of L.mine()) if (isSealed(L,c)&&!c.l&&!c._sell){ c._sell=1; }
      relistStale(0.95); answerOffers(0.9); },
    // buys boxes in the first week of each release and holds them; sells nothing
    investor(){ for (const s of shelves().filter(s=>s.x.f==='B'&&s.inPrint&&G.day-RETAIL.adapters[s.g].def(s.x.n).rel<7).sort((a,b)=>a.price-b.price)){ let have=0; const L=cardLineOfKind(({wk:'t',xt:'x',br:'b'})[s.g]); for (const c of L.mine()) if (c.k===s.k) have++; while (have<6 && s.x.q>0 && G.player.cash>=s.price){ if (RETAIL.sealedBuy(s.loc,s.k,1)) break; have++; act(); S.flipCost+=s.price; } }
      for (const L of lines()) for (const c of L.mine()) c._hold=1; },
    // buys near-mint raw cards worth $25+ at or under value, sends them for grading, lists the slabs at value
    grader(){ if (G.day%3===0) for (const l of G.lst.slice()){ if (l.sel<=0||l.ty!=='bin') continue; const L=cardLineOfKind(l.it); if (!L) continue; const c=L.copies()[l.ref]; if (!c||c.g!==0||isSealed(L,c)) continue; const v=L.value(c); if (v<25||l.pr>v*1.0||condLabel(c.c)!=='NM'||l.pr+25>G.player.cash*0.4) continue; if (!buyListing(l.id)){ act(); S.flipCost+=l.pr; S.flips++; const e=L.submit(c.id); if (!e){ act(); S.graded=(S.graded||0)+1; S.flipCost+=20; } } }
      for (const L of lines()) for (const c of L.mine()) if (c.g>0&&!c.l) c._sell=1;
      if (G.player.rv) G.player.rv.length=0; relistStale(1.0); answerOffers(0.85); },
    // price pumper: every sale of a print lifts its model value a little (G.dp). Buys up one print's listings to lift it, then sells into the lift
    pumper(){ if (!S.target && G.day-S.day0>=20){ const by={}; for (const l of G.lst){ if (l.sel<=0||l.ty!=='bin') continue; const it=itemOf(l); if (it.v<3||it.v>30||l.pr>it.v*1.3) continue; (by[it.key]=by[it.key]||[]).push(l); } const best=Object.entries(by).sort((a,b)=>b[1].length-a[1].length)[0]; if (best){ S.target=best[0]; S.v0=itemOf(best[1][0]).v; S.log.push('target '+best[0]+' listings '+best[1].length+' v0 '+S.v0.toFixed(2)); } }
      if (S.target && !S.selling){ for (const l of G.lst.slice()){ if (l.sel<=0||l.ty!=='bin') continue; const it=itemOf(l); if (it.key!==S.target||l.pr>it.v*1.3||l.pr>G.player.cash) continue; const L=cardLineOfKind(l.it), ref=l.ref, pr=l.pr; if (!buyListing(l.id)){ act(); S.flips++; S.flipCost+=pr; L.copies()[ref]._p=1; } }
        if ((G.dp[S.target]||0)>=0.45 || G.day-S.day0>=60){ S.selling=1; S.log.push('selling at dp '+(G.dp[S.target]||0).toFixed(2)+' after '+S.flips+' buys'); } }
      if (S.selling){ for (const L of lines()) for (const c of L.mine()) if (c._p) c._sell=1; relistStale(1.0); answerOffers(0.85); } },
    // sells everything it is dealt (scenario binder/box) and whatever it pulls to shop buylists at once: the "fast cash" floor
    dumper(){ if (dowOf(G.day)===6){ buyPacks(10); openAll(); if (AD()) for (const L of lines()){ const g=({t:'wk',x:'xt',b:'br'})[L.kind]; for (const c of L.mine()){ if (c.l||isSealed(L,c)||c.g!==0) continue; let best=null,bp=0; for (const p of RETAIL.profiles){ const o=RETAIL.offer(p.id,g,c); if (o>bp){ bp=o; best=p.id; } } if (best && bp>=0.05 && !RETAIL.sell(best,g,c.id)){ act(); S.buylist=(S.buylist||0)+bp; } } } } }
  };
  function start(name,cash){ S.name=name; G.player.cash=cash; G.player.pay=0; S.start=cash; S.day0=G.day; S.acts=0; S.series=[]; }
  function step(){ try { STRATS[S.name](); } catch(e){ S.err=(S.err||0)+1; S.lastErr=String(e&&e.stack||e).slice(0,400); } advanceDay(); if ((G.day-S.day0)%30===0) S.series.push([G.day-S.day0, Math.round(G.player.cash), Math.round(netWorthNow())]); }
  function report(){ const hold=netWorthNow(); const P=G.player; return {agent:S.name, days:G.day-S.day0, start:S.start, cash:Math.round(P.cash*100)/100, holdings:Math.round(hold), total:Math.round(P.cash+hold), bought:Math.round(P.bought), sold:Math.round(P.sold), fees:Math.round(P.fees), acts:S.acts, packsCost:Math.round(S.spentPacks), packsOpened:S.pulled, flips:S.flips, flipCost:Math.round(S.flipCost), bids:S.bids||0, graded:S.graded||0, buylist:Math.round(S.buylist||0), listedNow:G.lst.filter(l=>l.sel===0).length, log:S.log, lots:S.lots||0, lotPaid:Math.round(S.lotPaid||0), lotWorth:Math.round(S.lotWorth||0), shows:S.shows||0, hunt:(typeof CIRCUIT!=='undefined'&&CIRCUIT&&CIRCUIT.H())? CIRCUIT.H().stats : null, standing:(typeof RETAIL!=='undefined'&&RETAIL&&G.retail)? RETAIL.profiles.filter(p=>p.kind==='local').map(p=>Math.round(G.retail.locations[p.id].rep||0)) : null, err:S.err||0, lastErr:S.lastErr||'', series:S.series}; }
  return {start,step,report,shelves,STRATS,S};
})();
