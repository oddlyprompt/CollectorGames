// ===================== TCG: COPIES, VALUE AND THE MARKET =====================
const TC_MSRP={P:4.5,B:150};
const TC_RB={'common|N':0.05,'common|R':0.30,'unc|N':0.18,'unc|R':0.55,'rare|N':0.22,'rare|R':0.5,'rare|H':1.3,'ess|N':0.03,'ir|I':7,'fa|F':10,'sir|X':130,'csr|C':150};   // provisional, tuned with tools/econtest.py
const TC_TUNE={fanPrem:4.5, fanRare:1.2};   // how hard collector fandom (manifest, provisional) bends prices: premium prints feel it most
const TC_PB={ess:0,common:1.6,unc:2.5,rare:3.5,ir:9,fa:12,sir:14,csr:12};
const TC_GS={ess:0.3,common:0.55,unc:0.7,rare:1,ir:1.4,fa:1.5,sir:1.7,csr:1.8};
const TCFV=new Map(), TCCV=new Map(); const TC_K=0.45;
function tfvClear(k){ if (k){ for (const x of TCFV.keys()) if (x.startsWith(k+'@')) TCFV.delete(x); } else TCFV.clear(); }
// ---------- copies ----------
const TC=id=>G.tc[id]; const myTc=()=>Object.values(G.tc).filter(c=>c.o===0);
// ---------- value ----------
function tcSetPrestige(n){ const d=tcSetDef(n); return d.reprint?0.8 : n===1?1.35 : n===2?1.25 : 1.0; }
function tcPrintCount(cid){ const c=G.tcg._pc||(G.tcg._pc={day:-1,m:{}}); if (c.day!==G.day){ c.day=G.day; c.m={}; } if (c.m[cid]) return c.m[cid]; let n=0; for (const s of tcReleasedSets(G.day)) if (tcSetCards(s).some(x=>x.cid===cid&&!tcAlt(x))) n++; return c.m[cid]=Math.max(1,n); }
function tcFairRaw(key){
  const ck=key+'@'+G.day; let v=TCFV.get(ck); if (v!=null) return v;
  const d=tcD(key); if (d.sealed){ v=tcSealedFair(d); } else {
    const c=d.card, wk=Math.max(0,(G.day-d.def.rel)/7); const base=TC_RB[c.rar+'|'+d.v]||0.1;
    const nov=Math.max(0.6, 1+0.55*Math.exp(-wk/3)-0.3*Math.exp(-wk/9)), oop=Math.min(2.2, 1+0.28*Math.max(0,(G.day-tcPrintEnd(d.set))/365));   // the out-of-print premium starts when printing stops
    const fan=Math.pow(0.35+c.fan, tcIsPrem(c)? TC_TUNE.fanPrem : c.rar==='rare'? TC_TUNE.fanRare : 0); const coll=base*c.ap*fan*tcSetPrestige(d.set)*nov*oop;
    const st=tcLegalState(c.cid), u=Math.min(1,(G.tcg.usage[c.cid]||0)/4), f=st==='std'?1: st==='rot'?0.3:0.06, hy=G.tcg.hy[c.cid]||0;
    const play=TC_PB[c.rar]*Math.pow(u,0.85)*f*(1+hy)*Math.exp(1.4*(c.pw-0.5))*(tcIsPrem(c)?0.6:1)*(1-0.12*(tcPrintCount(c.cid)-1));
    v=Math.max(0.03,(coll+play)*TC_K*priceJitter(key)*(1+Math.min(0.6,G.dp[key]||0))); }
  TCFV.set(ck,v); if (TCFV.size>5000) TCFV.clear(); return v;
}
// ---------- packs and sealed ----------
function tcPools(set){ const m=G.tcg._pl||(G.tcg._pl={}); if (m[set]) return m[set]; const cs=tcSetCards(set); const f=r=>cs.filter(c=>c.rar===r);
  const P={c:f('common'),u:f('unc'),r:f('rare'),ess:f('ess'),ir:f('ir'),fa:f('fa'),sir:f('sir'),csr:f('csr')}; P.rv=P.c.concat(P.u,P.r); if (!P.c.length) P.c=P.u; if (!P.u.length) P.u=P.c; if (!P.r.length) P.r=P.u; return m[set]=P; }
// pack: 6 commons (one may be a reverse holo of any common, uncommon or rare), 2 uncommons, 1 rare-or-better, 1 Essence (manifest: set.pack)
const TC_ODDS=WK_CANON.set.odds, TC_REV=0.5;
function tcRareSlot(P, r){ const x=r(); let a=0; const O=TC_ODDS; const arr=p=>p[Math.floor(r()*p.length)];
  if (x<(a+=O.csr) && P.csr.length) return [arr(P.csr),'C']; if (x<(a+=O.sir) && P.sir.length) return [arr(P.sir),'X']; if (x<(a+=O.fa) && P.fa.length) return [arr(P.fa),'F']; if (x<(a+=O.ir) && P.ir.length) return [arr(P.ir),'I'];
  if (x<(a+=O.rare_holo)) return [arr(P.r),'H']; return [arr(P.r),'N']; }
function tcRollPack(set, r){
  const P=tcPools(set), keys=[], taken=new Set(); const pc=a=>{ let c; for (let i=0;i<6;i++){ c=a[Math.floor(r()*a.length)]; if (!taken.has(c.no)){ taken.add(c.no); return c; } } return c; };
  const rev=r()<TC_REV; for (let i=0;i<(rev?5:6);i++) keys.push(tcKey(set,pc(P.c).no,'N'));
  if (rev){ const x=r(); const pool= x<0.62? P.c : x<0.92? P.u : P.r; keys.push(tcKey(set,pc(pool).no,'R')); }
  for (let i=0;i<2;i++) keys.push(tcKey(set,pc(P.u).no,'N'));
  const [rc,rv]=tcRareSlot(P,r); keys.push(tcKey(set,rc.no,rv));
  if (P.ess.length) keys.push(tcKey(set,P.ess[Math.floor(r()*P.ess.length)].no,'N'));
  return keys;
}
function tcPackEV(set){
  const c=G.tcg._ev||(G.tcg._ev={}); const k=set+'@'+Math.floor(G.day/7); if (c[k]) return c[k]; const P=tcPools(set); const avg=(a,v)=>a.length? a.reduce((s,x)=>s+tcFairRaw(tcKey(set,x.no,v)),0)/a.length : 0;
  const O=TC_ODDS, rn=1-O.csr-O.sir-O.fa-O.ir-O.rare_holo;
  const ev=(6-TC_REV)*avg(P.c,'N')+TC_REV*(0.62*avg(P.c,'R')+0.3*avg(P.u,'R')+0.08*avg(P.r,'R'))+2*avg(P.u,'N')+rn*avg(P.r,'N')+O.rare_holo*avg(P.r,'H')+O.ir*avg(P.ir,'I')+O.fa*avg(P.fa,'F')+O.sir*avg(P.sir,'X')+O.csr*avg(P.csr,'C')+avg(P.ess,'N'); return c[k]=ev;
}
function tcSealedFair(d){
  const def=d.def, n=d.set; const days=G.day-def.rel, age=days/365; const ev=tcPackEV(n); const pr=tcSetPrestige(n); let pack;
  if (age<=1) pack=Math.max(TC_MSRP.P*0.8, Math.min(TC_MSRP.P*2.2, ev*1.02))*(1+0.18*Math.exp(-days/21)*(pr-0.6)); else pack=Math.max(TC_MSRP.P*0.9, ev);
  const s=(G.tcg&&G.tcg.shop[n])||{}; const shelf=d.v==='P'? (s.pack||0) : (s.box||0); const so=d.v==='P'? (s.sop==null?1:s.sop) : (s.so==null?1:s.so);
  if (tcInPrint(n,G.day) || shelf>0){ if (days>30) pack=Math.min(pack, TC_MSRP.P*(1.15+0.6*so)); }   // on retail shelves: anchored to retail (higher while it keeps selling out)
  else pack=Math.max(TC_MSRP.P*1.15, ev)*(1+0.3*pr*Math.max(0,(G.day-tcPrintEnd(n))/365));   // out of print and off the shelves: scarcity grows
  return d.v==='P'? pack : pack*36*(age<=1?0.93:1.02);
}
function tcStock(set,f){ const s=G.tcg.shop[set]; return s? (f==='P'?s.pack:s.box) : 0; }
function tcBuySealed(set, f, q){
  const s=G.tcg.shop[set]; const price=TC_MSRP[f]; if (!s || tcStock(set,f)<q) return 'Not enough in stock.'; if (G.player.cash<price*q) return 'You need '+money(price*q)+'.';
  G.player.cash-=price*q; G.player.bought+=price*q; if (f==='P') s.pack-=q; else s.box-=q; const key=tcKey(set,0,f);
  for (let i=0;i<q;i++){ const cp=tcMakeCopy(key,0,[G.day,'bought',price,'Wildkin Games shop'],'shop'); cp.nw=1; cp.pv={d:G.day,v:Math.round(tcFairRaw(key)*100)/100,n:''}; } return null;
}
function tcPreorder(set, f, q){ const T=G.tcg; const lim=f==='B'?2:12; const have=T.pre.filter(p=>p.set===set&&p.f===f).reduce((s,p)=>s+p.q,0); if (have+q>lim) return 'Limit '+lim+' per account.'; const e=T.pre.find(p=>p.set===set&&p.f===f); if (e) e.q+=q; else T.pre.push({set,f,q}); return null; }
function tcFulfilPreorders(set, t){ const T=G.tcg; const mine=T.pre.filter(p=>p.set===set); T.pre=T.pre.filter(p=>p.set!==set); const key0=n=>tcKey(set,0,n);
  for (const p of mine){ const price=p.paid? 0 : TC_MSRP[p.f]; let got=0; for (let i=0;i<p.q;i++){ if (G.player.cash<price){ toast('Preorder: you ran out of cash after '+got+'.'); break; } G.player.cash-=price; G.player.bought+=price; const cp=tcMakeCopy(key0(p.f),0,[t,'preorder',p.paid? TC_MSRP[p.f] : price,'Wildkin Games shop'],'shop'); cp.nw=1; cp.pv={d:t,v:Math.round(tcFairRaw(key0(p.f))*100)/100,n:'Preordered before release.'}; got++; }
    if (got) toast('Preorder in: '+got+' '+tcD(key0(p.f)).title, true); }
}
// opening: returns the cards, never charges anything (the sealed copy is what you paid for)
function tcOpenSealed(id){
  const cp=TC(id); if (!cp || cp.o!==0 || cp.l) return null; const d=tcD(cp.k); if (!d.sealed) return null; const paid=(cp.a&&cp.a[2])||0; const packs=d.v==='P'?1:36; const r=mkRng(hsh('open'+cp.id+G.day)); const out=[];
  for (let i=0;i<packs;i++){ const keys=tcRollPack(d.set,r); const ei=keys.findIndex(k=>tcD(k).card.kind==='essence'); if (ei>0) keys.unshift(keys.splice(ei,1)[0]);   // reveal order: the Essence first, the rare slot last
    const ids=keys.map(k=>{ const c=tcMakeCopy(k,0,[G.day,'pulled',Math.round(paid/packs/10*100)/100,'a '+d.title],'pull',r); c.nw=1; c.h=[[G.day,'Pulled from a '+d.title,0,'']]; const rr=tcCopyValue(c); c.pv={d:G.day,v:Math.round(rr*100)/100,n:''}; return c.id; }); out.push(ids); }
  const sv=Math.round(tcCopyValue(cp)*100)/100;   // what it was worth sealed, the moment it was opened
  delete G.tc[id]; G.player.packs=(G.player.packs||0)+packs; return {packs:out, set:d.set, title:d.title, paid, sv};
}
// open several sealed items at once (every pack from 'Open all'): one result, packs in order
function tcOpenMany(ids){ const res={packs:[], set:1, title:'', paid:0}; let n=0, t='';
  for (const id of ids){ const r=tcOpenSealed(id); if (!r) continue; res.packs.push(...r.packs); res.set=r.set; res.paid+=r.paid; res.sv=(res.sv||0)+r.sv; t=r.title; n++; }
  if (!n) return null; res.title=n>1? n+' × '+t : t; return res; }
// ---------- grading ----------
// ---------- collectors ----------
const TC_NT={tpl:{w:16,cash:[250,3500]}, tcl:{w:10,cash:[300,5000]}, tcm:{w:6,cash:[200,2500]}, tfl:{w:6,cash:[500,6000]}, tsl:{w:5,cash:[1500,12000]}, tgr:{w:4,cash:[400,6000]}};
const TC_HA=['Deck','Wild','Foil','Shiny','Pack','Binder','Holo','Rip','Energy','Meta','Slab','Kin','Sleeve','Top8'], TC_HB=['Doctor','Hunter','Wrangler','King','Goblin','Sage','Rat','Fiend','Ranger','Keeper','Scout','Tamer'];
function isTcgNPC(n){ return !!TC_NT[n.ty]; }
function makeTcgNPCs(){
  const used={}; for (const n of G.npcs) used[n.h]=1;
  for (const ty in TC_NT) for (let i=0;i<TC_NT[ty].w;i++){ let h; do { h=pick(TC_HA)+pick(TC_HB)+(R()<0.55?ri(1,99):''); } while(used[h]); used[h]=1; const c=TC_NT[ty].cash;
    G.npcs.push({ id:G.npcs.length+1, h, ty, cash:Math.round(rf(c[0],c[1])), inc:Math.round(rf(c[0],c[1])*0.05), tm:0, pids:[], gr:+R().toFixed(2), kn:+rf(0.08,0.4).toFixed(2), setProd:-1, setN:1+Math.floor(R()*3) }); }
  for (const n of G.npcs) if (!isTcgNPC(n) && R()<0.07) n.tc=1; delete G._tcPool; delete G._cmPool; delete G._cdPool;
}
function tcInterest(n, item){
  const c=item.tc, d=tcD(c.k);
  if (!isTcgNPC(n)) return n.tc? (d.sealed?0.5:0.3) : 0.03;
  if (d.sealed) return {tsl:1.25,tfl:0.95,tcl:0.7,tpl:0.55,tcm:0.5}[n.ty]||0.2;
  const card=d.card, u=(G.tcg.usage[card.cid]||0)/4, st=tcLegalState(card.cid); let f;
  switch(n.ty){ case 'tpl': f= st==='std'&&u>0.18? 1.1+u*0.6 : st==='std'? 0.45 : 0.18; break; case 'tcl': f=(tcIsPrem(card)||d.v==='H'||d.v==='R')? 1.2+0.2*card.ap+0.4*card.fan : 0.3; break; case 'tcm': f= n.setN===d.set? 1.3 : 0.25; break; case 'tfl': f=0.84; break; case 'tsl': f=0.12; break; case 'tgr': f= c.g>0? 1.3 : 0.12; break; default: f=0.5; }
  if (n.ty!=='tgr' && c.g>0) f*=0.9; return f;
}
function tcSeedMarket(){
  G._npcTcIds=[]; const rel=tcReleasedSets(G.day);
  for (const s of rel){ const age=(G.day-tcSetDef(s).rel)/30; const nP=Math.round(120+90*Math.min(1,age/3)); const r=mkRng(hsh('seed'+G.seed+s));
    for (let i=0;i<nP;i++){ for (const k of tcRollPack(s,r)) tcGive(k, r()<0.4?'deck':'pull'); }
    if (G.day-tcSetDef(s).rel<=365){ const nb=ri(5,12), np=ri(20,50); for (let i=0;i<nb;i++) tcGive(tcKey(s,0,'B'),'shop'); for (let i=0;i<np;i++) tcGive(tcKey(s,0,'P'),'shop'); } }
  for (const id of G._npcTcIds){ const cp=G.tc[id]; if (tcD(cp.k).sealed) continue; const v=tcCopyValue(cp); const p=v>60?0.5: v>20?0.28: v>7?0.08: 0.005; if (R()<p) tcGradeCopy(cp); }
}
// a new set lands: collectors open it, the glut hits the market
function tcReleaseMarket(n, t){ if (G._tcCatch) return; const r=mkRng(hsh('rel'+G.seed+n)); const nP=ri(170,260); for (let i=0;i<nP;i++) for (const k of tcRollPack(n,r)) tcGive(k,'pull'); for (let i=0;i<ri(4,9);i++) tcGive(tcKey(n,0,'B'),'shop'); for (let i=0;i<ri(25,50);i++) tcGive(tcKey(n,0,'P'),'shop'); for (let i=0;i<60;i++) npcListTc(); }
// ---------- hooking into the shared market ----------
// ---------- the shared market functions, for this line (src/tcg/kit/market.js) ----------
const WK_MKT={ kind:'t', keyPrefix:'T', flag:'tcg', cpf:'tc', copies:()=>G.tc, nextId:()=>G.nextTid++, pop:()=>G.tpop, world:()=>G.tcg, subs:'tsubs', ids:'_npcTcIds',
  D:tcD, fairRaw:tcFairRaw, interest:tcInterest, label:tcCardLabel, fvClear:tfvClear, scale:TC_GS, raror:TC_RAROR, econ:WK_ECON, isNPC:isTcgNPC,
  listMult(n){ return {tfl:rf(1.1,1.45), tgr:rf(1.05,1.3), tsl:rf(1.1,1.5)}[n.ty]||rf(0.95,1.35); } };   // what a collector asks over value, by type
const WK_MK=cardMarket(WK_MKT);
const tcMakeCopy=WK_MK.makeCopy, tcFair=WK_MK.fair, tcCopyValue=WK_MK.copyValue, tcSales=WK_MK.sales, tcEst=WK_MK.est, tcHeat=WK_MK.heat, tcGradeCopy=WK_MK.gradeCopy, tcSubmitGrade=WK_MK.submitGrade, tcGradingTick=WK_MK.gradingTick;
const tcGive=WK_MK.give, npcListTc=WK_MK.npcList, tcMarketDay=WK_MK.marketDay, tcCull=WK_MK.cull;
WK_MK.installHooks();
npcPool=function(item){ const k=item&&item.tcg?'_tcPool': item&&item.comic?'_cmPool':'_cdPool'; if (!G[k]){ G._tcPool=G.npcs.filter(n=>isTcgNPC(n)||n.tc); G._cmPool=G.npcs.filter(n=>isComicNPC(n)||n.cm); G._cdPool=G.npcs.filter(n=>(!isComicNPC(n)&&!isTcgNPC(n)&&!(typeof isXtNPC==='function'&&isXtNPC(n)))||n.cd); } return G[k]; };
