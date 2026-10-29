// ===================== BROKEN REACH: THE WORLD =====================
// There is no metagame to simulate yet: the battler is a prototype and nobody plays organised events. The world is the set's life: the announcement and previews, preorders,
// release day, the retail lifecycle (printed for 14 months, restocked every Monday, then out of print), and how much collectors care (hype around the crew and rivals).
function brInit(){ G.brc=G.brc||{}; G.bpop=G.bpop||{}; G.nextBid=G.nextBid||1; G.brg={v:1, cv:BR_CV, usage:{}, hy:{}, shop:{}, pre:[], ann:{}, rev:{}, rel:{}, last:G.day, want:[], goals:{}}; brUsage(); }
function brUsage(){ const U=G.brg.usage; for (const c of brSetCards(1)) if (!brAlt(c) && !c.planet && U[c.cid]==null) U[c.cid]=+(c.pw*2.2).toFixed(2); }
function brNews(h, b, ref){ if (!G.live || !G.brg) return; const n={t:G.day,h,b,p:null,k:'brg'}; if (ref){ if (ref.set!=null) n.ts=ref.set; if (ref.cid!=null) n.brid=ref.cid; } G.news.unshift(n); if (G.news.length>320) G.news.length=320; }
// ---------- previews: the set is shown in stages before you can buy it ----------
function brRevealed(n){ return (G.brg&&G.brg.rev[n])||[]; }
// the set is announced 35 days before release: preorders open, the Legendaries, Super Rares and premium arts are shown first
const BR_ANN_DAYS=35;
function brAnnouncedSet(t){ const n=brNextSet(t); if (!n) return null; return brSetDef(n).rel-t<=BR_ANN_DAYS? n : null; }
function brSetLife(t){
  const nx=brNextSet(t); if (!nx) return; const def=brSetDef(nx), days=def.rel-t; const T=G.brg; const cards=brSetCards(nx);
  const show=(k)=>{ const r=T.rev[nx]||(T.rev[nx]=[]); for (const x of k) if (!r.includes(x)) r.push(x); };
  if (days<=BR_ANN_DAYS && !T.ann['pv'+nx]){ T.ann['pv'+nx]=1; show(cards.filter(c=>c.rar==='leg'||c.pk==='alt'||c.rar==='sr').map(c=>c.no));
    brNews(`${def.name.toUpperCase()}: THE BROKEN REACH ARRIVES`, `The Broken Reach, a new card game of the collapsed Lattice, releases ${fmtDate(def.rel)} with ${def.base} cards (172 ships, crews, creatures and tech, and 8 planets) and ${def.total-def.base} premium alternate arts. The Legendaries, Super Rares and premium arts have been shown. Preorders are open.`, {set:nx}); }
  if (days<=21 && !T.ann['pv2'+nx]){ T.ann['pv2'+nx]=1; show(cards.filter(c=>c.rar==='rare'&&c.pk==='base').map(c=>c.no)); brNews(`${def.name.toUpperCase()}: THE RARES ARE REVEALED`, `The rest of the Rares are out, along with the planets that change how a match plays. Early testers say the arrows are the whole game.`, {set:nx}); }
  if (days<=7 && !T.ann['pv3'+nx]){ T.ann['pv3'+nx]=1; show(cards.map(c=>c.no)); }
}
function brRelease(n, t){
  const def=brSetDef(n); G.brg.rel[n]=t; brShopWeek(t, n);
  for (const c of brSetCards(n)) if (!brAlt(c) && !c.planet && BR_CREW.some(x=>c.name.startsWith(x))) G.brg.hy[c.cid]=0.35;   // the crew are what people want on launch day
  brNews(`${def.name.toUpperCase()} IS OUT TODAY`, `Stores report long lines for ${def.name}. Boxes are expected to sell out within days.`, {set:n});
  if (typeof brReleaseMarket==='function') brReleaseMarket(n,t);
  if (typeof brFulfilPreorders==='function') brFulfilPreorders(n,t);
}
// ---------- the retail lifecycle ----------
// Lattice Games prints the set for about 14 months (BR_PRINT_DAYS), restocked every Monday; afterwards the shelves only sell down. The market prices sealed product against that: near retail
// while it is on shelves, rising once it is gone (brSealedFair).
const BR_PRINT_DAYS=425;
function brPrintEnd(n){ return brSetDef(n).rel+BR_PRINT_DAYS; }
function brInPrint(n,t){ const d=brSetDef(n); return !!d && t>=d.rel && t<brPrintEnd(n); }
function brShopWeek(t, only){
  for (const n of brReleasedSets(t).filter(n=>brInPrint(n,t))){ if (only!=null && n!==only) continue; const s=G.brg.shop[n]||(G.brg.shop[n]={pack:0,box:0}); const wind=brPrintEnd(n)-t<60? 0.5 : 1;
    const age=t-brSetDef(n).rel, big=age<100; s.pack=Math.min(300, s.pack+Math.round((big? ri(70,150) : ri(15,45))*wind)); s.box=Math.min(20, s.box+Math.round((big? ri(4,9) : ri(1,3))*wind)); }
}
const brRetailSets=t=>brReleasedSets(t).filter(n=>brInPrint(n,t) || (G.brg && G.brg.shop[n] && (G.brg.shop[n].pack>0 || G.brg.shop[n].box>0)));
function brShopDay(t){
  for (const n of brRetailSets(t)){ const s=G.brg.shop[n]; if (!s) continue; const age=t-brSetDef(n).rel; let hot=age<=14?3.2: age<=45?1.2:0.35; if (!brInPrint(n,t)) hot=Math.max(hot,1.2);
    s.pack=Math.max(0, s.pack-poisson(hot*14)); s.box=Math.max(0, s.box-poisson(hot*1.2)); s.so=(s.so==null?1:s.so)*0.9+(s.box<1?0.1:0); s.sop=(s.sop==null?1:s.sop)*0.9+(s.pack<1?0.1:0); }
}
function brPrintNews(t){ const n=1, e=brPrintEnd(n), def=brSetDef(n); if (def.rel>t) return;
  if (t===e-30) brNews(`FINAL PRINT RUN FOR ${def.name.toUpperCase()}`, `Lattice Games says ${def.name} retail restocks end on ${fmtDate(e,true)}. Whatever is on shelves after that is all there will be.`, {set:n});
  if (t===e) brNews(`${def.name.toUpperCase()} IS OUT OF PRINT`, `Stores received their last ${def.name} shipment. Sealed product now only gets scarcer.`, {set:n}); }
function brDay(t){
  const T=G.brg; if (!T) return; const nx=brNextSet(t-1); if (nx && brSetDef(nx).rel===t) brRelease(nx,t);
  brPrintNews(t);
  if (dowOf(t)===1){ brSetLife(t); for (const k in T.hy){ T.hy[k]*=0.86; if (T.hy[k]<0.02) delete T.hy[k]; } brShopWeek(t); }
  brShopDay(t);
}
// existing saves: play the lifecycle forward from the release so the shelves and news have a history
function brCatchUp(t0, t1){ const live=G.live; G.live=false; G._brCatch=true; for (let t=t0; t<=t1; t++){ brDay(t); G.brg.last=t; } G._brCatch=false; G.live=live; }
