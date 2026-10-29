// ===================== BROKEN REACH: COPIES, VALUE AND THE MARKET =====================
const BR_MSRP={P:4.99,B:109};
// base prices (raw, near mint) before fandom, set and play: decided 2026-10-30, tuned with tools/brokenreach_econ.py. Premium arts are the chase: an Illustration Rare, a Signature Rare, an Eclipse Rare.
const BR_RB={'common|N':0.05,'common|F':0.3,'unc|N':0.12,'unc|F':0.65,'rare|N':0.45,'rare|F':1.5,'sr|N':1.4,'sr|F':4,'leg|N':5,'leg|F':15,'ir|A':6,'sig|A':36,'ecl|A':300};
const BR_TUNE={fanLeg:1.4, fanRare:0.8};   // how hard collector fandom bends prices
const BR_PB={common:0.1,unc:0.3,rare:0.7,sr:1.3,leg:2.4,ir:1,sig:1.4,ecl:2};   // what a card is worth in play at full use
const BR_GS={common:0.55,unc:0.7,rare:1,sr:1.25,leg:1.5,ir:1.6,sig:1.8,ecl:2};
const BRFV=new Map(); const BR_K=0.72;
function brFvClear(k){ if (k){ for (const x of BRFV.keys()) if (x.startsWith(k+'@')) BRFV.delete(x); } else BRFV.clear(); }
// ---------- copies ----------
const BRC=id=>G.brc[id]; const myBr=()=>Object.values(G.brc).filter(c=>c.o===0);
// ---------- value ----------
function brSetPrestige(n){ return 1.0; }
function brFairRaw(key){
  const ck=key+'@'+G.day; let v=BRFV.get(ck); if (v!=null) return v;
  const d=brD(key); if (d.sealed){ v=brSealedFair(d); } else {
    const c=d.card, wk=Math.max(0,(G.day-d.def.rel)/7); const base=BR_RB[c.rar+'|'+d.v]||0.1; const yrs=Math.max(0,(G.day-d.def.rel)/365);
    // a new set is hyped while new and, once out of print, rises; collectors' premium for age grows slowly
    const nov=Math.max(0.6, 1+0.55*Math.exp(-wk/3)-0.3*Math.exp(-wk/9)), oop=Math.min(2.2, 1+0.28*Math.max(0,(G.day-brPrintEnd(d.set))/365));
    const age=1+0.07*Math.min(10,yrs);
    const fan=Math.pow(0.35+c.fan, brIsPrem(c)||c.rar==='leg'||c.rar==='sr'? BR_TUNE.fanLeg : c.rar==='rare'? BR_TUNE.fanRare : 0); const coll=base*c.ap*fan*brSetPrestige(d.set)*nov*oop*age;
    const u=Math.min(1,(G.brg.usage[c.cid]||0)/3), hy=G.brg.hy[c.cid]||0;
    const play=BR_PB[c.rar]*Math.pow(u,0.85)*(1+hy)*Math.exp(1.4*(c.pw-0.5))*(brIsPrem(c)?0.6:1)*(brFoilish(d.v)&&!brIsPrem(c)?1.15:1);
    v=Math.max(0.03,(coll+play)*BR_K*priceJitter(key)*(1+Math.min(0.6,G.dp[key]||0))); }
  BRFV.set(ck,v); if (BRFV.size>5000) BRFV.clear(); return v;
}
// ---------- packs and sealed ----------
// Pack (10 cards, a proposal from the handoff): 4 Commons, 3 Uncommons, 1 Rare slot (Rare 80%, Super Rare 17%, Legendary 3%), 1 wildcard base card of any rarity, and 1 foil-or-premium slot: a premium
// alternate art about 1 pack in 10 (Illustration Rare 1 in 12, Signature Rare 1 in 72, Eclipse Rare 1 in 720, mutually exclusive), otherwise a foil of any rarity. The
// premium replaces the foil, so every pack is exactly 10 cards and the slot is never two things at once. No card repeats inside a pack. A box is 24 packs.
const BR_ODDS={rare:{R:0.8,SR:0.17,L:0.03}, ir:1/12, sig:1/72, ecl:1/720, foil:{C:0.52,U:0.30,R:0.13,SR:0.04,L:0.01}, wild:{C:0.45,U:0.30,R:0.17,SR:0.06,L:0.02}};
const BR_PACK=10, BR_BOX=24;
function brPools(set){ const m=G.brg._pl||(G.brg._pl={}); if (m[set]) return m[set]; const cs=brSetCards(set); const f=r=>cs.filter(c=>c.rar===r&&c.pk==='base'); const g=r=>cs.filter(c=>c.rar===r);
  return m[set]={C:f('common'),U:f('unc'),R:f('rare'),SR:f('sr'),L:f('leg'),ir:g('ir'),sig:g('sig'),ecl:g('ecl')}; }
function brRollPack(set, r){
  const P=brPools(set), keys=[], taken=new Set(); const tk=c=>{ taken.add(c.same!=null? c.same : c.no); };
  const pick=(a,v)=>{ const av=a.filter(c=>!taken.has(c.no)); const src=av.length? av : a; const c=src[Math.floor(r()*src.length)]; tk(c); keys.push(brKey(set,c.no,v)); return c; };
  const byR=(w,v)=>{ const x=r(); let acc=0; for (const k of ['C','U','R','SR','L']){ acc+=(w[k]||0); if (w[k] && x<acc && P[k].length) return pick(P[k],v); } return pick(P.C,v); };
  for (let i=0;i<4;i++) pick(P.C,'N');
  for (let i=0;i<3;i++) pick(P.U,'N');
  byR(BR_ODDS.wild,'N');                                             // the wildcard: any base card
  const x=r(), O=BR_ODDS;                                            // the foil-or-premium slot
  const prem=a=>{ const av=a.filter(c=>!taken.has(c.same)); const src=av.length? av : a; const c=src[Math.floor(r()*src.length)]; tk(c); keys.push(brKey(set,c.no,'A')); };   // a premium art never doubles a card already in the pack
  if (x<O.ecl && P.ecl.length) prem(P.ecl);
  else if (x<O.ecl+O.sig && P.sig.length) prem(P.sig);
  else if (x<O.ecl+O.sig+O.ir && P.ir.length) prem(P.ir);
  else byR(O.foil,'F');
  byR(O.rare,'N');                                                   // the rare slot is last
  return keys;
}
function brRollUnit(set, r){ return brRollPack(set,r); }
function brPackEV(set){
  const c=G.brg._ev||(G.brg._ev={}); const k=set+'@'+Math.floor(G.day/7); if (c[k]) return c[k]; const P=brPools(set), O=BR_ODDS;
  const val=(a,v)=> a.length? a.reduce((s,x)=>s+brFairRaw(brKey(set,x.no,v)),0)/a.length : 0;
  const slot=(w,v)=>w.C*val(P.C,v)+(w.U||0)*val(P.U,v)+(w.R||0)*val(P.R,v)+(w.SR||0)*val(P.SR,v)+(w.L||0)*val(P.L,v);
  const Vc=val(P.C,'N'), Vu=val(P.U,'N'); const rare=O.rare.R*val(P.R,'N')+O.rare.SR*val(P.SR,'N')+O.rare.L*val(P.L,'N');
  const wild=slot(O.wild,'N'); const pr=O.ir*val(P.ir,'A')+O.sig*val(P.sig,'A')+O.ecl*val(P.ecl,'A'); const foil=(1-O.ir-O.sig-O.ecl)*slot(O.foil,'F');
  return c[k]=4*Vc+3*Vu+wild+rare+pr+foil;
}
function brSealedFair(d){
  const def=d.def, n=d.set; const days=G.day-def.rel, age=days/365; const ev=brPackEV(n); const pr=brSetPrestige(n); let pack;
  if (age<=1) pack=Math.max(BR_MSRP.P*0.8, Math.min(BR_MSRP.P*2.2, ev*1.02))*(1+0.18*Math.exp(-days/21)*(pr-0.6)); else pack=Math.max(BR_MSRP.P*0.9, ev);
  const s=(G.brg&&G.brg.shop[n])||{}; const shelf=d.v==='P'? (s.pack||0) : (s.box||0); const so=d.v==='P'? (s.sop==null?1:s.sop) : (s.so==null?1:s.so);
  if (brInPrint(n,G.day) || shelf>0){ if (days>30) pack=Math.min(pack, BR_MSRP.P*(1.15+0.6*so)); }   // on retail shelves: anchored to retail (higher while it keeps selling out)
  else pack=Math.max(BR_MSRP.P*1.15, ev)*(1+0.3*pr*Math.max(0,(G.day-brPrintEnd(n))/365));           // out of print and off the shelves: scarcity grows
  return d.v==='P'? pack : pack*BR_BOX*(age<=1?0.93:1.02);
}
function brStock(set,f){ const s=G.brg.shop[set]; return s? (f==='P'?s.pack:s.box) : 0; }
function brBuySealed(set, f, q){
  const s=G.brg.shop[set]; const price=BR_MSRP[f]; if (!s || brStock(set,f)<q) return 'Not enough in stock.'; if (G.player.cash<price*q) return 'You need '+money(price*q)+'.';
  G.player.cash-=price*q; G.player.bought+=price*q; if (f==='P') s.pack-=q; else s.box-=q; const key=brKey(set,0,f);
  for (let i=0;i<q;i++){ const cp=brMakeCopy(key,0,[G.day,'bought',price,'Lattice Games shop'],'shop'); cp.nw=1; cp.pv={d:G.day,v:Math.round(brFairRaw(key)*100)/100,n:''}; } return null;
}
function brPreorder(set, f, q){ const T=G.brg; const lim=f==='B'?2:12; const have=T.pre.filter(p=>p.set===set&&p.f===f).reduce((s,p)=>s+p.q,0); if (have+q>lim) return 'Limit '+lim+' per account.'; const e=T.pre.find(p=>p.set===set&&p.f===f); if (e) e.q+=q; else T.pre.push({set,f,q}); return null; }
function brFulfilPreorders(set, t){ const T=G.brg; const mine=T.pre.filter(p=>p.set===set); T.pre=T.pre.filter(p=>p.set!==set); const key0=n=>brKey(set,0,n);
  for (const p of mine){ const price=p.paid? 0 : BR_MSRP[p.f]; let got=0; for (let i=0;i<p.q;i++){ if (G.player.cash<price){ toast('Preorder: you ran out of cash after '+got+'.'); break; } G.player.cash-=price; G.player.bought+=price; const cp=brMakeCopy(key0(p.f),0,[t,'preorder',p.paid? BR_MSRP[p.f] : price,'Lattice Games shop'],'shop'); cp.nw=1; cp.pv={d:t,v:Math.round(brFairRaw(key0(p.f))*100)/100,n:'Preordered before release.'}; got++; }
    if (got) toast('Preorder in: '+got+' '+brD(key0(p.f)).title, true); }
}
// opening: returns the cards, never charges anything (the sealed copy is what you paid for)
function brOpenSealed(id){
  const cp=BRC(id); if (!cp || cp.o!==0 || cp.l) return null; const d=brD(cp.k); if (!d.sealed) return null; const paid=(cp.a&&cp.a[2])||0; const packs=d.v==='P'?1:BR_BOX; const r=mkRng(hsh('open'+cp.id+G.day)); const out=[];
  for (let i=0;i<packs;i++){ const keys=brRollUnit(d.set,r);
    const ids=keys.map(k=>{ const c=brMakeCopy(k,0,[G.day,'pulled',Math.round(paid/packs/BR_PACK*100)/100,'a '+d.title],'pull',r); c.nw=1; c.h=[[G.day,'Pulled from a '+d.title,0,'']]; const rr=brCopyValue(c); c.pv={d:G.day,v:Math.round(rr*100)/100,n:''}; return c.id; }); out.push(ids); }
  const sv=Math.round(brCopyValue(cp)*100)/100;   // what it was worth sealed, the moment it was opened
  delete G.brc[id]; G.player.packs=(G.player.packs||0)+packs; return {packs:out, set:d.set, title:d.title, paid, sv, bulk:0, bulkPer:out.map(()=>0), bulkValue:0};
}
function brOpenMany(ids){ const res={packs:[], bulkPer:[], set:1, title:'', paid:0, bulk:0, bulkValue:0}; let n=0, t='';
  for (const id of ids){ const r=brOpenSealed(id); if (!r) continue; res.packs.push(...r.packs); res.bulkPer.push(...r.bulkPer); res.set=r.set; res.paid+=r.paid; res.sv=(res.sv||0)+r.sv; t=r.title; n++; }
  if (!n) return null; res.title=n>1? n+' × '+t : t; return res; }
// ---------- collectors ----------
const BR_NT={bpl:{w:16,cash:[250,3500]}, btl:{w:10,cash:[300,5000]}, bfm:{w:8,cash:[200,2500]}, bfl:{w:6,cash:[500,6000]}, bsl:{w:5,cash:[1500,12000]}, bgr:{w:4,cash:[400,6000]}};
const BR_HA=['Lattice','Dock','Gate','Void','Pit','Scrap','Hull','Drift','Relay','Vector','Crew','Sundering','Slip','Vault','Ember','Orbit'], BR_HB=['Runner','Hauler','Broker','Pilot','Smuggler','Gunner','Fixer','Warden','Scout','Rigger','Captain','Mate'];
function isBrNPC(n){ return !!BR_NT[n.ty]; }
function makeBrNPCs(){
  const used={}; for (const n of G.npcs) used[n.h]=1;
  for (const ty in BR_NT) for (let i=0;i<BR_NT[ty].w;i++){ let h; do { h=pick(BR_HA)+pick(BR_HB)+(R()<0.55?ri(1,99):''); } while(used[h]); used[h]=1; const c=BR_NT[ty].cash;
    G.npcs.push({ id:G.npcs.length+1, h, ty, cash:Math.round(rf(c[0],c[1])), inc:Math.round(rf(c[0],c[1])*0.05), tm:0, pids:[], gr:+R().toFixed(2), kn:+rf(0.08,0.4).toFixed(2), setProd:-1, setN:1 }); }
  for (const n of G.npcs) if (!isBrNPC(n) && R()<0.07) n.br=1; delete G._brPool; delete G._xtPool; delete G._cmPool; delete G._cdPool;
}
function brInterest(n, item){
  const c=item.br, d=brD(c.k);
  if (!isBrNPC(n)) return n.br? (d.sealed?0.5:0.3) : 0.03;
  if (d.sealed) return {bsl:1.25,bfl:0.95,btl:0.7,bpl:0.55,bfm:0.5}[n.ty]||0.2;
  const card=d.card; let f;
  switch(n.ty){ case 'bpl': f= card.planet? 0.5 : 0.25+1.3*card.pw; break; case 'btl': f=(brIsPrem(card)||d.v==='F'||card.rar==='leg'||card.rar==='sr')? 1.2+0.2*card.ap+0.4*card.fan : 0.3; break; case 'bfm': f= card.fan>0.6? 1.1+0.8*card.fan : 0.25; break; case 'bfl': f=0.84; break; case 'bsl': f=0.12; break; case 'bgr': f= c.g>0? 1.3 : 0.12; break; default: f=0.5; }
  if (n.ty!=='bgr' && c.g>0) f*=0.9; return f;
}
// a new set lands: collectors open it, the glut hits the market
function brReleaseMarket(n, t, scale){ if (G._brCatch) return; const r=mkRng(hsh('rel'+G.seed+'br'+n)); const nP=Math.round(ri(210,330)*(scale||1)); for (let i=0;i<nP;i++) for (const k of brRollUnit(n,r)) brGive(k,'pull'); for (let i=0;i<ri(4,9);i++) brGive(brKey(n,0,'B'),'shop'); for (let i=0;i<ri(25,50);i++) brGive(brKey(n,0,'P'),'shop'); for (let i=0;i<60;i++) bNpcList(); }
// ---------- the shared market functions, for this line (src/tcg/kit/market.js) ----------
const BR_MKT={ kind:'b', keyPrefix:'B', flag:'brg', cpf:'br', copies:()=>G.brc, nextId:()=>G.nextBid++, pop:()=>G.bpop, world:()=>G.brg, subs:'bsubs', ids:'_npcBrIds',
  D:brD, fairRaw:brFairRaw, interest:brInterest, label:brCardLabel, fvClear:brFvClear, scale:BR_GS, raror:BR_RAROR, econ:BR_ECON, isNPC:isBrNPC,
  keep(n,c,v){ return brInterest(n,{br:c,v})>1.1? 0.7 : 0.12; },
  listMult(n){ return {bfl:rf(1.1,1.45), bfm:rf(1.05,1.3), bsl:rf(1.1,1.5)}[n.ty]||rf(0.95,1.35); } };   // what a collector asks over value, by type
const BR_MK=cardMarket(BR_MKT);
const brMakeCopy=BR_MK.makeCopy, brFair=BR_MK.fair, brCopyValue=BR_MK.copyValue, brSales=BR_MK.sales, brEst=BR_MK.est, brHeat=BR_MK.heat, brGradeCopy=BR_MK.gradeCopy, brSubmitGrade=BR_MK.submitGrade, brGradingTick=BR_MK.gradingTick;
const brGive=BR_MK.give, bNpcList=BR_MK.npcList, brMarketDay=BR_MK.marketDay, brCull=BR_MK.cull;
BR_MK.installHooks();
const B_npcPool=npcPool; npcPool=function(item){ if (item&&item.brg){ if (!G._brPool) G._brPool=G.npcs.filter(n=>isBrNPC(n)||n.br); return G._brPool; } return B_npcPool(item); };
function crackBr(id){ const c=BRC(id); if (!c || c.o!==0 || c.l || !(c.g>0)) return 'That slab can\'t be opened.'; const g=c.g; c.pg=g; c.g=0; delete c.cert; c.cr=(c.cr||0)+1; (c.h=c.h||[]).push([G.day,'Cracked out of a GCS '+g+' slab',0,'']); G.player.rv=(G.player.rv||[]).filter(x=>!(x.k==='b'&&x.id===id)); brFvClear(c.k); return null; }
