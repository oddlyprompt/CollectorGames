// ===================== TIDEMARK ECONOMY V2: A TEN-YEAR HISTORY THAT CHANGES WHAT EXISTS =====================
// design/tidemark-economy-v2.md. A new world replays ten years of every historical set (cards opened, sealed product hoarded, copies lost, worn, graded) and
// ends with the copies that survived, held by the collectors. From then on the same rules run a little every day, so what is for sale is always a
// consequence of what is left: a copy that is bought, graded, opened or lost is gone from the supply, and prices answer to how many copies are left.
// A world carries G.xtg.ecv=2; older saves have no ecv and keep the first economy (v1) untouched. Everything here uses its own random stream
// (withRng), never the world's, so it cannot move the metagame. Decided by Claude, not canon.
const XT_E2={
  // cards opened in a set's first year (the game world is a sample of the market), growing as the game grew; sealed product kept by hoarders
  q0:150, q1:0.3, q2:1.7, sealedMul:0.45, boxFrac:0.8,
  // who holds a card: collector (sleeved, binder), player (decks, travels), casual (loose). Share of cards by release year, lost and worn per year
  hold:{ collector:{lost:0.008, wear:0.06}, player:{lost:0.06, wear:0.28}, casual:{lost:0.14, wear:0.34} },
  mix(year){ const t=Math.min(1,Math.max(0,(year-2016)/9)); return { collector:0.12+0.23*t, player:0.38+0.02*t, casual:0.50-0.25*t }; },
  rarLost:{common:1.6, unc:1.2, rare:0.8, leg:0.4}, rarWear:{common:1, unc:0.92, rare:0.8, leg:0.65},
  grade:{rare:0.02, leg:0.08},                          // yearly chance that a raw NM or LP copy is sent to be graded, by rarity
  sealedOpen:{box:0.005, pack:0.025}, sealedLost:{box:0.015, pack:0.02},   // yearly: opened, lost
  attic:0.07, atticSealed:0.6,                         // share of surviving cards and sealed product kept off the market until an estate sale
  vintageYears:2,                                       // sets older than this get the census, scarcity pricing and seller-backed shops
  elast:0.35, cap:[0.5,3], smooth:45                    // price answers to (copies at the start / copies now)^elast, bounded, over a 45-day average
};
function xtEconPin(){ return typeof window!=='undefined' && window.__xtEcon==='v1'? 1 : 2; }   // tests pin the first economy
const XT_HOLDER={ xpl:'player', xtl:'collector', xtm:'collector', xsl:'collector', xgr:'collector', xfl:'collector' };
function xtYearOf(day){ return dayToDate(day).getUTCFullYear(); }
function xtHolderOf(npc){ return npc&&XT_HOLDER[npc.ty]||'casual'; }
function xtVintage(d){ return d.set!==TM_TT && (G.day-d.def.rel)/365>=XT_E2.vintageYears; }
// ---------- condition ----------
function xtStepDown(c, r){   // one band worse (NM to LP to MP to HP to DMG): lower the weakest score into the next band
  const lab=condLabel(c); const fl={NM:86,LP:72,MP:55,HP:38}, nx={NM:72,LP:55,MP:38,HP:0}; if (!fl[lab]) return;
  let ix=0; for (let i=1;i<4;i++) if (c[i]<c[ix]) ix=i; const hi=fl[lab]-1, lo=nx[lab];
  c[ix]=Math.max(20,Math.round(lo+(hi-lo)*r()*0.9));
}
// ---------- the census: copies that can be bought, counted per print ----------
function xtEconCounts(){ const m={}; for (const id in G.xtc){ const c=G.xtc[id]; if (c.o>0||c.o===-2) m[c.k]=(m[c.k]||0)+1; } return m; }
function xtEconRef(keysOnly){   // remember how many copies there were at the start (or when a set became vintage); prices measure scarcity against it
  const T=G.xtg, m=xtEconCounts(); T.ref=T.ref||{}; T.sm=T.sm||{};
  for (let s=1;s<TM_TT;s++){ const def=xtSetDef(s); if (!def||def.rel>G.day) continue; if ((G.day-def.rel)/365<XT_E2.vintageYears) continue;
    for (const k of xtAllKeys(s).concat([xtKey(s,0,'P'),xtKey(s,0,'B')])) if (T.ref[k]==null){ T.ref[k]=m[k]||0; T.sm[k]=m[k]||0; } }
}
function xtEconSmooth(){ const T=G.xtg; if (!T.ref) return; const m=xtEconCounts(), a=1/XT_E2.smooth; for (const k in T.ref){ const live=m[k]||0; T.sm[k]+= (live-T.sm[k])*a; } }
// the price factor of a vintage print: a premium that grows with age and rarity (the NM premium) times how scarce it has become, bounded
function xtV2Mult(d, key){
  const T=G.xtg, yrs=(G.day-d.def.rel)/365; if (d.set===TM_TT || yrs<XT_E2.vintageYears || !T.ref || T.ref[key]==null) return 1;
  let prem=1; if (!d.sealed){ const c=d.card; const rk={common:0.15,unc:0.25,rare:0.6,leg:0.95}[c.rar]||0.3; prem=1+rk*Math.min(1,(yrs-1)/9)*(c.res?1.35:1); }
  const ref=Math.max(1,T.ref[key]), now=Math.max(0.5,T.sm[key]==null?T.ref[key]:T.sm[key]); const sc=Math.pow(ref/now, XT_E2.elast);
  return Math.min(XT_E2.cap[1], Math.max(XT_E2.cap[0], prem*sc));
}
function xtV2GradeScarce(key,g,pop,d){
  if (g<9||(XT_RAROR[d.rar]||0)<2) return 1; const n=pop? pop[g]||0 : 0; const yrs=Math.max(0,(G.day-d.def.rel)/365);
  return (1+(g===10?0.25:0.1)/Math.sqrt(1+n))*(1+0.1*Math.min(1,yrs/10));
}
// ---------- the replay: ten years of a set, once, when a world is made ----------
function xtV2Replay(){
  G._npcXtIds=G._npcXtIds||[]; const T=G.xtg, led=T.led={ made:0, lost:0, opened:0, graded:0, cull:0 }; T.ref={}; T.sm={}; T.e2={ lots:[], nlot:1 };
  withRng(mkRng(hsh('xthist'+G.seed)), ()=>{
    const npcs=G.npcs.filter(isXtNPC), byTy={}; for (const n of npcs) (byTy[n.ty]=byTy[n.ty]||[]).push(n);
    const pickTy=(tys)=>{ const pool=tys.flatMap(t=>byTy[t]||[]); return pool[Math.floor(R()*pool.length)]; };
    const own=(cls,s)=> cls==='collector'? ( R()<0.35? (pickTy(['xtm'])&&(byTy.xtm.filter(n=>n.setN===s)[0]||pickTy(['xtm']))) : pickTy(['xtl','xtm','xsl','xgr','xfl']) ) : cls==='player'? pickTy(['xpl','xpl','xfl']) : pickTy(['xpl','xfl','xtl']);
    const mk=(k,o,c,extra)=>{ const cp=Object.assign({ id:G.nextXid++, k, o, g:0, c }, extra||{}); cp.a=[G.day,'held',0,'']; G.xtc[cp.id]=cp; return cp; };
    const attic=[];
    for (let s=1;s<TM_TT;s++){
      const def=xtSetDef(s); const T0=(G.day-def.rel)/365; if (T0<0) continue; const T1=Math.max(0.3,T0); const y0=xtYearOf(def.rel);
      const nT=Math.ceil(T1-1e-9); const Q=Math.round(XT_E2.q0*(XT_E2.q1+(XT_E2.q2-XT_E2.q1)*(s-1)/29)), Qs=Math.round(Q*XT_E2.sealedMul);
      const cards=[]; const addPack=(born,cls)=>{ const keys=xtRollPack(s,R); for (const k of keys){ const d=xtD(k); cards.push({k, born, cls: cls||pickClass(born), c:condFresh(()=>R(),0.55), g:0, rar:d.rar, foil:d.v==='F', alive:true}); } };
      const pickClass=(born)=>{ const m=XT_E2.mix(y0+Math.floor(born)); const x=R(); return x<m.collector? 'collector' : x<m.collector+m.player? 'player' : 'casual'; };
      for (let i=0;i<Q;i++) addPack(0);
      let B=Math.round(Qs*XT_E2.boxFrac/36+ (R()-0.5)), P=Math.round(Qs*(1-XT_E2.boxFrac)+ (R()-0.5)*4); B=Math.max(0,B); P=Math.max(0,P);
      for (let j=1;j<=nT;j++){
        const e0=j-1, dt=(j<nT)? 1 : (T1-(nT-1)); if (dt<=0) continue;
        const pOpen=(y)=>1-Math.pow(1-y,dt), pLost=(y)=>1-Math.pow(1-y,dt);
        let b2=0; for (let i=0;i<B;i++){ if (R()<pLost(XT_E2.sealedLost.box)) b2++; else if (R()<pOpen(XT_E2.sealedOpen.box)){ b2++; for (let q=0;q<36;q++) addPack(e0+dt/2, R()<0.7?'collector':null); led.opened++; } } B-=b2;
        let p2=0; for (let i=0;i<P;i++){ if (R()<pLost(XT_E2.sealedLost.pack)) p2++; else if (R()<pOpen(XT_E2.sealedOpen.pack)){ p2++; addPack(e0+dt/2, R()<0.5?'collector':null); led.opened++; } } P-=p2;
        for (const c of cards){ if (!c.alive||c.born>=e0+dt) continue; const eff=e0+dt-Math.max(e0,c.born); if (eff<=0) continue;
          if (c.g){ if (R()<1-Math.pow(1-0.003,eff)) { c.alive=false; led.lost++; } continue; }
          const h=XT_E2.hold[c.cls]; const lost=h.lost*XT_E2.rarLost[c.rar]*(c.foil?0.8:1), wear=h.wear*XT_E2.rarWear[c.rar];
          if (R()<1-Math.pow(1-lost,eff)){ c.alive=false; led.lost++; continue; }
          if (R()<1-Math.pow(1-wear,eff)) xtStepDown(c.c,R);
          const gp=XT_E2.grade[c.rar]; if (gp){ const lab=condLabel(c.c); if ((lab==='NM'||lab==='LP') && R()<1-Math.pow(1-gp*(lab==='NM'?1:0.3),eff)) { c.g=1; } } }
      }
      // the survivors become copies, held by collectors; some are kept off the market in an attic until an estate sale
      const live=cards.filter(c=>c.alive);
      for (const c of live){
        const val=({common:1,unc:1.3,rare:2.2,leg:3.5})[c.rar]||1; const toAttic=R()<XT_E2.attic*val*(c.cls==='collector'?1.4:0.6);
        const holder=toAttic? null : own(c.cls,s); const cp=mk(c.k, toAttic?-3:holder.id, c.c.slice());
        if (c.g){ cp.gt=1; cp.g=gradeOf(cp); cp.cert=10000000+Math.floor(R()*89999999); const p=G.xpop[cp.k]||(G.xpop[cp.k]=Array(11).fill(0)); p[cp.g]++; led.graded++; }
        led.made++; if (toAttic) attic.push(cp.id); else G._npcXtIds.push(cp.id); }
      for (const [f,n] of [['P',P],['B',B]]) for (let i=0;i<n;i++){ const toAttic=R()<XT_E2.atticSealed; const holder=toAttic? null : pickTy(['xsl','xsl','xsl','xtl']); const cp=mk(xtKey(s,0,f), toAttic?-3:holder.id, [100,100,100,100]); led.made++; if (toAttic) attic.push(cp.id); else G._npcXtIds.push(cp.id); }
    }
    // every named card has at least one surviving copy somewhere: a card that was printed in number does not vanish (the last copy sits in an attic)
    const have=new Set(); for (const id in G.xtc) have.add(G.xtc[id].k);
    for (let s=1;s<TM_TT;s++){ const def=xtSetDef(s); if (def.rel>G.day) continue; for (const c of xtSetCards(s)){ if (c.pk==='alt') continue; const k=xtKey(s,c.no,'N'); if (have.has(k)) continue;
      const age=Math.max(0,(G.day-def.rel)/365); const cc=condWorn(()=>R(), age, 1.2); const cp=mk(k,-3,cc); led.made++; attic.push(cp.id); } }
    // attic lots: finite collections that surface in estate sales and warehouse finds
    // the best of what is in the attics goes into a few prize lots (a collector's prized binder); the rest is mixed into ordinary lots
    const worth=id=>{ const c=G.xtc[id], d=xtD(c.k); if (d.sealed) return d.v==='B'? 6 : 1.5; const nm=condLabel(c.c)==='NM'||c.g>0; return ({common:0.2,unc:0.4,rare:1.5,leg:4})[d.rar]*(nm?2:1)*(d.card.res?2:1)*(d.v==='F'?1.5:1); };
    attic.sort((a,b)=>worth(b)-worth(a)); const nPrize=Math.round(attic.length*0.18); const prize=attic.slice(0,nPrize), rest=attic.slice(nPrize);
    for (let i=rest.length-1;i>0;i--){ const j=Math.floor(R()*(i+1)); [rest[i],rest[j]]=[rest[j],rest[i]]; }
    let i=0; while (i<rest.length){ const n=Math.min(rest.length-i, 4+Math.floor(R()*20)); const lot=T.e2.nlot++; for (let q=0;q<n;q++) G.xtc[rest[i+q]].lt=lot; T.e2.lots.push(lot); i+=n; }
    i=0; T.e2.prize=[]; while (i<prize.length){ const n=Math.min(prize.length-i, 3+Math.floor(R()*5)); const lot=T.e2.nlot++; for (let q=0;q<n;q++) G.xtc[prize[i+q]].lt=lot; T.e2.prize.push(lot); i+=n; }
    T.e2.next=G.day+10+Math.floor(R()*25); T.e2.nextP=G.day+30+Math.floor(R()*60); T.e2.nextL=G.day+50+Math.floor(R()*80);
    // history of sales: a few past sales per print so trends and estimates start from somewhere (eras are decided, not canon)
    const ERA={2016:0.45,2017:0.55,2018:0.7,2019:0.85,2020:1.05,2021:1.5,2022:1.25,2023:0.92,2024:1.02,2025:1.12,2026:1.18};
    const eraAt=day=>ERA[xtYearOf(day)]||1;
    for (let s=1;s<TM_TT;s++){ const def=xtSetDef(s); if (def.rel>G.day) continue; for (const k of xtAllKeys(s)){ const d=xtD(k); if (d.sealed) continue; const n=Math.floor(R()*3.2); for (let q=0;q<n;q++){ const day=G.day-Math.floor(30+R()*520); if (day<def.rel) continue; (G.sales[k]=G.sales[k]||[]).push([day, Math.round(100*Math.max(0.1,xtFairRaw(k)*eraAt(day)/eraAt(G.day)*(0.8+0.4*R())))/100, 0]); } if (G.sales[k]) G.sales[k].sort((a,b)=>b[0]-a[0]); } }
  });
  xtEconRef();
  XTFV.clear();
}
// ---------- the world, day by day ----------
function xtEconDay(t){
  const T=G.xtg; if (!T || T.ecv!==2) return;
  withRng(mkRng(hsh('xte'+G.seed+':'+t)), ()=>{
    if (t%7===0 || !T.ref) xtEconRef();   // sets that became vintage get their reference count
    xtEconSmooth(); xtAgeSlice(t); xtKvDay(t); xtEstateTick(t);
  });
}
function xtDrop(id, why){ const c=G.xtc[id]; if (!c) return; delete G.xtc[id]; const L=G.xtg.led; if (L) L[why]=(L[why]||0)+1; xTfvClear(c.k); }
// each day one thirtieth of the collectors' copies ages by a month: some are lost, some wear one band; collectors open some sealed product
function xtAgeSlice(t){
  const ids=G._npcXtIds; if (!ids||!ids.length) return; const day=t%30, L=G.xtg.led||(G.xtg.led={made:0,lost:0,opened:0,graded:0,cull:0}), mo=30/365;
  for (let i=0;i<ids.length;i++){ const id=ids[i]; if (id%30!==day) continue; const c=G.xtc[id]; if (!c||c.o<=0||c.l||c.g<0) continue; const d=xtD(c.k); if (d.set===TM_TT && (t-d.def.rel)/365<1) continue; if ((t-d.def.rel)/365<1) continue;
    const n=NPC(c.o); if (!n) continue; const cls=xtHolderOf(n);
    if (d.sealed){ const f=d.v==='B'; const po=(f? (n.ty==='xsl'?0.0003:0.0006) : (n.ty==='xsl'?0.0015:0.004)); if (R()<po){ xtNpcOpen(c,n,d,t); } else if (R()<(f?0.012:0.02)*mo) { delete G.xtc[id]; L.lost++; } continue; }
    if (c.g>0){ continue; }   // a slab does not wear
    const h=XT_E2.hold[cls], rl=h.lost*XT_E2.rarLost[d.rar]*(d.v==='F'?0.8:1), rw=h.wear*XT_E2.rarWear[d.rar]; const wearMul= (cls==='player'&&xtLegalState(d.cid)==='std')? 1.5 : 1;
    if (R()<1-Math.pow(1-rl,mo)){ delete G.xtc[id]; L.lost++; xTfvClear(c.k); continue; }
    if (R()<1-Math.pow(1-rw*wearMul,mo)){ xtStepDown(c.c,R); xTfvClear(c.k); }
  }
}
function xtNpcOpen(c,n,d,t){   // a collector cracks a sealed pack or box: the cards are fresh, and they are theirs
  const L=G.xtg.led, packs=d.v==='P'?1:36; delete G.xtc[c.id]; L.opened++;
  for (let i=0;i<packs;i++) for (const k of xtRollPack(d.set,R)){ const cp={ id:G.nextXid++, k, o:n.id, g:0, c:condFresh(()=>R(),0.55), a:[t,'pulled',0,'a '+d.title] }; G.xtc[cp.id]=cp; (G._npcXtIds=G._npcXtIds||[]).push(cp.id); L.made++; }
}
// ---------- estate sales, warehouse finds and collection sales: finite inventory that was already in the world ----------
function xtEstateTick(t){
  const E=G.xtg.e2; if (!E) return;
  if (t>=E.next){ E.next=t+25+Math.floor(R()*35); xtEstate(t,false); }
  if (t>=E.nextP){ E.nextP=t+70+Math.floor(R()*60); xtEstate(t,true); }
  if (t>=E.nextL){ E.nextL=t+60+Math.floor(R()*100); xtLiquidation(t); }
}
const XT_SELLERS=['xtl','xtm','xfl','xsl'];
function xtListLot(ids, seller, t, disc){
  let top=[]; for (const id of ids){ const c=G.xtc[id]; if (!c) continue; c.o=seller.id; (G._npcXtIds=G._npcXtIds||[]).push(id); const v=xtCopyValue(c); top.push([v,c]);
    if (v<0.6) continue; if (v>=40 && R()<0.55) createListing('x',id,seller.id,'auc',Math.max(0.5,nicePrice(v*rf(0.3,0.7))),pick([3,5,7]),false); else createListing('x',id,seller.id,'bin',Math.max(0.25,nicePrice(v*rf(disc[0],disc[1]))),0,R()<0.5); }
  top.sort((a,b)=>b[0]-a[0]); return top;
}
function xtEstate(t, prize){
  const E=G.xtg.e2; const pool=prize? E.prize : E.lots; if (!pool||!pool.length) return; const li=Math.floor(R()*pool.length), lot=pool.splice(li,1)[0];
  const ids=Object.keys(G.xtc).filter(id=>G.xtc[id].lt===lot&&G.xtc[id].o===-3).map(Number); if (!ids.length) return;
  const sellers=G.npcs.filter(n=>isXtNPC(n)&&XT_SELLERS.includes(n.ty)); const seller=sellers[Math.floor(R()*sellers.length)];
  for (const id of ids) delete G.xtc[id].lt;
  const top=xtListLot(ids, seller, t, [0.95,1.3]); const named=top.slice(0,3).map(([v,c])=>{ const d=xtD(c.k); return d.sealed? d.title : d.card.name+' ('+d.def.code+', '+COND_LABN[condLabel(c.c)].toLowerCase()+')'; });
  const kind=prize? 'ESTATE SALE' : R()<0.5?'ESTATE SALE':'WAREHOUSE FIND';
  xtNews(kind+': '+(prize? 'A COLLECTOR\'S PRIZED BINDER SURFACES' : ids.length+' OLD TIDEMARK ITEMS SURFACE'), (kind==='ESTATE SALE'? (prize? 'The best cards of a lifetime collection are being sold. ' : 'A collector\'s estate is being sold. ') : 'A closed shop\'s back room has been cleared. ')+'The lot includes '+named.join(', ')+'. It is listed on the marketplace now; once it is sold there is no more where it came from.', {});
}
function xtLiquidation(t){
  const by={}; for (const id of G._npcXtIds||[]){ const c=G.xtc[id]; if (!c||c.o<=0||c.l||c.g<0) continue; const d=xtD(c.k); if (d.sealed||!xtVintage(d)) continue; (by[c.o]=by[c.o]||[]).push(id); }
  let best=null; for (const o in by){ const n=NPC(+o); if (!n||!['xtm','xsl','xtl'].includes(n.ty)) continue; if (!best||by[o].length>by[best].length) best=o; }
  if (!best||by[best].length<12) return; const n=NPC(+best); const ids=by[best].slice().sort(()=>R()-0.5).slice(0,Math.min(25,Math.ceil(by[best].length*0.7)));
  const top=xtListLot(ids, n, t, [0.93,1.15]); xtNews('A MAJOR COLLECTION IS BEING SOLD', n.h+' is selling '+ids.length+' vintage cards, led by '+top.slice(0,2).map(([v,c])=>xtD(c.k).card.name+' ('+xtD(c.k).def.code+')').join(' and ')+'. Prices are close to the market.', {});
}
// ---------- Saltmarket and the Lantern Room: stock that is really in the world ----------
const XT_KV_BUY={ xfl:0.7, xpl:0.45, xtl:0.08, xtm:0.03, xsl:0.15, xgr:0.3 };
function xtKvInv(){ const K=xtKv(); K.inv=K.inv||[]; return K.inv; }
function xtKvDay(t){
  const K=xtKv(), inv=xtKvInv(); const r=R;
  // dealers sell: each item has a small chance of going to a collector each day, at once if it is cheap
  for (let i=inv.length-1;i>=0;i--){ const c=G.xtc[inv[i]]; if (!c){ inv.splice(i,1); continue; } if (R()<0.018){ const b=pick(G.npcs.filter(isXtNPC)); c.o=b.id; (G._npcXtIds=G._npcXtIds||[]).push(c.id); inv.splice(i,1); } }
  if (dowOf(t)!==1) return;
  const want=24+Math.floor(R()*15), cand=G._npcXtIds||[]; let got=0;
  for (let tries=0; tries<500 && got<want && inv.length<420 && cand.length; tries++){ const id=cand[Math.floor(R()*cand.length)]; const c=G.xtc[id]; if (!c||c.o<=0||c.l||c.g<0) continue; const d=xtD(c.k); if (d.sealed||!xtVintage(d)) continue; const n=NPC(c.o); if (!n) continue;
    const v=xtCopyValue(c); if (v<0.05) continue; const p=(XT_KV_BUY[n.ty]||0.15)*(n.ty==='xtm'&&n.setN===d.set?0.1:1)*((d.card.res||d.rar==='leg')&&n.ty!=='xfl'?0.5:1); if (R()>p) continue;
    n.cash+=Math.round(v*0.7*100)/100; c.o=-2; c.a=[t,'held',0,'']; inv.push(id); got++; }
}
function xtV2KvStock(t){   // recent sets are stocked as before; older prints are only what dealers have bought
  const K=xtKv(), wk=weekNo(t); const inv=xtKvInv(); const s={};
  if (K.wk!==wk || !K.syn){ K.wk=wk; K.syn={}; const r=mkRng(hsh('kv'+G.seed+wk));
    for (const n of xtReleasedSets(t)) { if (n!==TM_TT && (t-xtSetDef(n).rel)/365>=XT_E2.vintageYears) continue; for (const k of xtAllKeys(n)){ const d=xtD(k), o=XT_RAROR[d.card.rar]; let q;
      if (o<=0) q= d.v==='F'? xRi2(r,1,3) : xRi2(r,4,12); else if (o===1) q= d.v==='F'? xRi2(r,1,3) : xRi2(r,3,8); else if (o===2) q=d.v==='F'?xRi2(r,0,2) : xRi2(r,2,5); else q= r()<(xtFairRaw(k)>100? 0.3 : 0.65)? 1 : 0;
      if (q) K.syn[k]=q; } } }
  for (const k in K.syn) s[k]=K.syn[k]; for (const id of inv){ const c=G.xtc[id]; if (c) s[c.k]=(s[c.k]||0)+1; }
  return s;
}
function xtKvBest(k){ const inv=xtKvInv(); let best=null; for (const id of inv){ const c=G.xtc[id]; if (!c||c.k!==k) continue; if (!best||xtCopyValue(c)>xtCopyValue(best)) best=c; } return best; }
function xtKvPriceReal(k){ if (!xtV2()) return null; const c=xtKvBest(k); return c? Math.max(XKV_MIN, Math.ceil(xtCopyValue(c)*XKV_MARKUP*100)/100) : null; }
function xtKvBuyReal(k){
  if (!xtV2()) return undefined; const c=xtKvBest(k); if (!c) return undefined; const p=xtKvPriceReal(k); if (G.player.cash<p) return 'You need '+money(p,true)+'.';
  G.player.cash-=p; G.player.bought+=p; const inv=xtKvInv(); inv.splice(inv.indexOf(c.id),1); c.o=0; c.a=[G.day,'bought',p,'Saltmarket']; c.nw=1; c.h=[[G.day,'Bought from Saltmarket',p,'']]; c.pv={d:G.day,v:Math.round(xtCopyValue(c)*100)/100,n:''}; xTfvClear(c.k); return null;
}
// ---------- rebuilding an older save's vintage market (optional, with a backup) ----------
function xtRebuildSummary(){ const mine=myXt().length; const npc=Object.values(G.xtc).filter(c=>c.o!==0).length; return {mine, npc}; }
function xtRebuildVintage(){
  const T=G.xtg; if (!T||T.ecv===2) return 'This market is already the new one.';
  // collectors' copies, their listings and the dealers' stock are replaced; everything the player owns, every slab, offer, history entry and the metagame stay
  const keep=new Set(); for (const id in G.xtc){ if (G.xtc[id].o===0) keep.add(+id); }
  G.lst=G.lst.filter(l=>{ if (l.it!=='x') return true; const c=G.xtc[l.ref]; return !c || c.o===0 || l.sel===0; });
  for (const id of Object.keys(G.xtc)) if (!keep.has(+id)) delete G.xtc[id];
  // population report: only the player's slabs remain from the old world; the replay adds the new world's
  G.xpop={}; for (const id of keep){ const c=G.xtc[id]; if (c.g>0){ const p=G.xpop[c.k]||(G.xpop[c.k]=Array(11).fill(0)); p[c.g]++; } }
  G._npcXtIds=[]; T.ecv=2; T.kv=null; XT_CACHE.clear(); XTD.clear(); XTFV.clear();
  xtV2Replay();
  // released sets that are not vintage still need collectors' copies: the release market gives Tenth Tide its glut again
  if (xtReleasedSets(G.day).includes(TM_TT)) xtRelease_market_rebuild();
  for (let i=0;i<300;i++) xNpcListTc();
  return null;
}
function xtRelease_market_rebuild(){ const live=G.live; G.live=false; const c=G._xtCatch; G._xtCatch=false; try { xtReleaseMarket(TM_TT, xtSetDef(TM_TT).rel); } finally { G.live=live; G._xtCatch=c; } }
async function xtRebuildWithBackup(){
  try { const pk=await packBytes(); const rec=await slotCreate((typeof SLOT!=='undefined'&&SLOT.name? SLOT.name : 'Collection')+' (before market rebuild)'); await slotWrite(rec.id, pk.bytes, pk.enc, slotMetaNow()); } catch(e){ return 'Could not make the backup, so nothing was changed: '+(e&&e.message||e); }
  const e=xtRebuildVintage(); if (!e){ xtNews('THE VINTAGE MARKET IS REBUILT','Collectors\' binders, sealed product and dealers\' stock now follow ten years of print runs, openings, wear and losses.',{}); queueSave(); } return e;
}
ACT.xtrebuild=(a,el)=>{ if (!armed(el)) return; xtRebuildWithBackup().then(e=>{ if (e) showToast(e); else showToast('Vintage market rebuilt. A backup of the old save is in your slots.', true); render(true); }); };

// do collectors let go of a copy? (base is the first economy's answer; v2 adds who collects what)
function xtKeep(n,c,v,base){
  const d=xtD(c.k); const prem=!d.sealed&&(d.card.rar==='leg'||d.card.res||d.v==='F'||d.rar==='alt');
  // ordinary cards (commons and uncommons) are what collectors trade and release: they do not sit in binders for good
  if (!d.sealed && d.v==='N' && (d.rar==='common'||d.rar==='unc')) return n.ty==='xtm'&&n.setN===d.set? 0.72 : n.ty==='xfl'? 0.05 : Math.min(base,0.45);
  switch(n.ty){
    case 'xtm': return d.sealed? 0.9 : n.setN===d.set? 0.95 : 0.4;
    case 'xsl': return d.sealed? 0.985 : 0.6;
    case 'xtl': return d.sealed? 0.9 : prem? (d.card.res? 0.985 : 0.93) : base;
    case 'xfl': return d.sealed? 0.5 : 0.05;
    case 'xgr': return d.sealed? 0.8 : 0.3;
    default: return d.sealed? Math.max(base,0.85) : base;
  }
}
