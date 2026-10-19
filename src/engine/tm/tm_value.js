// ===================== XTG: COPIES, VALUE AND THE MARKET =====================
const XT_MSRP={P:4.99,B:144};
// base prices (raw, near mint) before fandom, set and play: provisional, tuned with tools/tidemark_econ.py
const XT_RB={'common|N':0.07,'common|F':0.45,'unc|N':0.2,'unc|F':1.0,'rare|N':0.75,'rare|F':2.6,'leg|N':3.2,'leg|F':9,'alt|A':45};
const XT_TUNE={fanLeg:1.4, fanRare:0.8};   // how hard collector fandom (decided, not canon) bends prices
const XT_PB={common:1.2,unc:2.2,rare:3.6,leg:7,alt:9};   // what a card is worth in play at full use
const XT_GS={common:0.55,unc:0.7,rare:1,leg:1.4,alt:1.7};
const XTFV=new Map(), XTCV=new Map(); const XT_K=0.72, XT_BULK=0.02;
function xTfvClear(k){ if (k){ for (const x of XTFV.keys()) if (x.startsWith(k+'@')) XTFV.delete(x); } else XTFV.clear(); }
// ---------- copies ----------
function xtMakeCopy(key, owner, acq, src, rng){
  const r=rng||R; const d=xtD(key); const cp={ id:G.nextXid++, k:key, o:owner, g:0 };
  if (d.sealed) cp.c=[100,100,100,100]; else { const age=Math.max(0,(G.day-d.def.rel)/365); cp.c = XT_ECON.condition.sample(r, src, age); }
  if (acq) cp.a=acq; G.xtc[cp.id]=cp; return cp;
}
const XT=id=>G.xtc[id]; const myXt=()=>Object.values(G.xtc).filter(c=>c.o===0);
// ---------- value ----------
// how much collectors care about a set: the founding sets most, the modern ones least, the anniversary set a lot while it is new
function xtSetPrestige(n){ const d=xtSetDef(n); return n===TM_TT? 1.3 : ({Founding:1.55,Expansion:1.25,'The Deep':1.05,Modern:0.9})[d.era]||1; }
function xtPrintCount(cid){ const rel=xtReleasedSets(G.day); return Math.max(1,(TM_PRINTS[cid]||[]).filter(s=>rel.includes(s)).length); }
function xtFairRaw(key){
  const ck=key+'@'+G.day; let v=XTFV.get(ck); if (v!=null) return v;
  const d=xtD(key); if (d.sealed){ v=xtSealedFair(d); } else {
    const c=d.card, wk=Math.max(0,(G.day-d.def.rel)/7); const base=XT_RB[c.rar+'|'+d.v]||0.1;
    // the anniversary set is hyped while new and, once out of print, rises; older sets keep a collector premium that grows with the years
    // (originals more than reprints) and the reserve list (cards never reprinted) most of all
    const tt=d.set===TM_TT; const yrs=Math.max(0,(G.day-d.def.rel)/365);
    const nov=tt? Math.max(0.6, 1+0.55*Math.exp(-wk/3)-0.3*Math.exp(-wk/9)) : 1, oop=tt? Math.min(2.2, 1+0.28*Math.max(0,(G.day-xtPrintEnd(d.set))/365)) : 1;
    const age=1+(c.pk==='o'?0.22:0.07)*Math.min(10,yrs), rsv=c.res? 1+3*Math.min(1,yrs/4) : 1;
    const fan=Math.pow(0.35+c.fan, xtIsPrem(c)||c.rar==='leg'? XT_TUNE.fanLeg : c.rar==='rare'? XT_TUNE.fanRare : 0); const coll=base*c.ap*fan*xtSetPrestige(d.set)*nov*oop*age*rsv;
    const st=xtLegalState(c.cid), u=Math.min(1,(G.xtg.usage[c.cid]||0)/3), f=st==='std'?1: st==='rot'?0.3:0.06, hy=G.xtg.hy[c.cid]||0;
    const eter=st==='rot'? 0.1*c.pw*c.pw : 0;   // Eternal demand, from the card's rating alone (the engine only plays the Tenth Tide format)
    const play=XT_PB[c.rar]*(Math.pow(u,0.85)*f+eter)*(1+hy)*Math.exp(1.4*(c.pw-0.5))*(xtIsPrem(c)?0.6:1)*(d.v==='F'?1.15:1)*(1-0.1*(xtPrintCount(c.cid)-1));
    v=Math.max(0.03,(coll+play)*XT_K*priceJitter(key)*(1+Math.min(0.6,G.dp[key]||0))); }
  XTFV.set(ck,v); if (XTFV.size>5000) XTFV.clear(); return v;
}
function xtFair(key, g){ const raw=xtFairRaw(key); if (!(g>0)) return raw; const d=xtD(key); if (d.sealed) return raw; const pop=G.xpop[key]; const scarce= pop&&g===10&&pop[10]<4&&(XT_RAROR[d.rar]>=2)? 1.12 : 1; return Math.max(raw*cardGradeMult(XT_GS,d.rar,g)*scarce, g>=10?4: g>=9?2.2: g>=8?1.2:0.7); }
function xtCopyValue(cp){ if (cp.g>0) return xtFair(cp.k, cp.g); const raw=xtFairRaw(cp.k); const d=xtD(cp.k); return d.sealed? raw : raw*XT_ECON.condition.price(cp.c, d.card); }
function xtSales(key,g){ return (G.sales[key]||[]).filter(s=>(s[2]||0)===(g||0)); }
function xtEst(key, g, cp){
  const fv= cp? xtCopyValue(cp) : xtFair(key,g||0); const same=xtSales(key, cp?(cp.g>0?cp.g:0):(g||0)).filter(s=>s[0]>G.day-120); const n=same.length;
  const center= n? 0.45*fv+0.55*median(same.slice(0,6).map(s=>s[1])) : fv; const w=0.1+0.42/Math.sqrt(n+1);
  const lo=nicePrice(Math.max(0.05,center*(1-w*0.75))), hi=nicePrice(Math.max(0.1,center*(1+w))); return {lo, hi:Math.max(hi,lo), n};
}
function xtHeat(cp){ const d=xtD(cp.k); if (d.sealed) return 0.9+0.8*Math.exp(-(G.day-d.def.rel)/45); const u=(G.xtg.usage[d.cid]||0)/4, hy=G.xtg.hy[d.cid]||0; return 0.4+1.2*u+hy+(XT_RAROR[d.rar]>=3?0.5:0)+0.7*Math.exp(-(G.day-d.def.rel)/21); }
// ---------- packs and sealed ----------
// Pack (12 cards): 8 commons, 3 uncommons, 1 rare slot (a Legendary about 1 pack in 8; an anniversary alternate art about 1 in 60 in Tenth Tide).
// About 1 pack in 6 swaps one common for a foil of any rarity. A historical set is 200 cards but only its named cards (the checklist's) are tracked:
// a slot that lands on an unnamed card is bulk, counted in the pack and worth about two cents (xtRollPack().bulk).
const TM_ODDS={legR:0.125, alt:1/60, foil:1/6, fr:{C:0.6,U:0.28,R:0.1,L:0.02}};
function xtPools(set){ const m=G.xtg._pl||(G.xtg._pl={}); if (m[set]) return m[set]; const cs=xtSetCards(set); const def=xtSetDef(set); const f=r=>cs.filter(c=>c.rar===r);
  const P={c:f('common'),u:f('unc'),r:f('rare'),l:f('leg'),alt:f('alt')}; P.q={C:Math.min(1,P.c.length/def.tot.C), U:Math.min(1,P.u.length/def.tot.U), R:Math.min(1,P.r.length/def.tot.R), L:Math.min(1,P.l.length/def.tot.L)};
  if (!P.l.length){ P.l=P.r; P.q.L=P.q.R; } if (!P.r.length){ P.r=P.u; P.q.R=P.q.U; } if (!P.u.length){ P.u=P.c; P.q.U=P.q.C; } if (!P.c.length){ P.c=P.u; P.q.C=P.q.U; } return m[set]=P; }
function xtRollPack(set, r){
  const P=xtPools(set), keys=[], taken=new Set(); keys.bulk=0; const pick=(a,q,v)=>{ if (r()>=q){ keys.bulk++; return; } let c; for (let i=0;i<6;i++){ c=a[Math.floor(r()*a.length)]; if (!taken.has(c.no)){ taken.add(c.no); break; } } keys.push(xtKey(set,c.no,v)); };
  const foil=r()<TM_ODDS.foil;
  for (let i=0;i<8;i++){ if (foil && i===7){ const x=r(), F=TM_ODDS.fr; const [a,q]= x<F.C? [P.c,P.q.C] : x<F.C+F.U? [P.u,P.q.U] : x<F.C+F.U+F.R? [P.r,P.q.R] : [P.l,P.q.L]; pick(a,q,'F'); } else pick(P.c,P.q.C,'N'); }
  for (let i=0;i<3;i++) pick(P.u,P.q.U,'N');
  const x=r(); if (P.alt.length && x<TM_ODDS.alt){ const c=P.alt[Math.floor(r()*P.alt.length)]; keys.push(xtKey(set,c.no,'A')); } else if (r()<TM_ODDS.legR) pick(P.l,P.q.L,'N'); else pick(P.r,P.q.R,'N');
  return keys;
}
function xtPackEV(set){
  const c=G.xtg._ev||(G.xtg._ev={}); const k=set+'@'+Math.floor(G.day/7); if (c[k]) return c[k]; const P=xtPools(set), O=TM_ODDS;
  const val=(a,v,q)=> a.length? q*a.reduce((s,x)=>s+xtFairRaw(xtKey(set,x.no,v)),0)/a.length+(1-q)*XT_BULK : XT_BULK;
  const Vc=val(P.c,'N',P.q.C), Vu=val(P.u,'N',P.q.U), Vr=val(P.r,'N',P.q.R), Vl=val(P.l,'N',P.q.L), Va=P.alt.length? P.alt.reduce((s,x)=>s+xtFairRaw(xtKey(set,x.no,'A')),0)/P.alt.length : 0;
  const Vf=O.fr.C*val(P.c,'F',P.q.C)+O.fr.U*val(P.u,'F',P.q.U)+O.fr.R*val(P.r,'F',P.q.R)+O.fr.L*val(P.l,'F',P.q.L);
  const alt=P.alt.length? O.alt : 0; const slot=alt*Va+(1-alt)*(O.legR*Vl+(1-O.legR)*Vr);
  return c[k]=(8-O.foil)*Vc+O.foil*Vf+3*Vu+slot;
}
function xtSealedFair(d){
  const def=d.def, n=d.set; const days=G.day-def.rel, age=days/365; const ev=xtPackEV(n); const pr=xtSetPrestige(n); let pack;
  if (n===TM_TT && age<=1) pack=Math.max(XT_MSRP.P*0.8, Math.min(XT_MSRP.P*2.2, ev*1.02))*(1+0.18*Math.exp(-days/21)*(pr-0.6)); else pack=Math.max(XT_MSRP.P*0.9, ev);
  const s=(G.xtg&&G.xtg.shop[n])||{}; const shelf=d.v==='P'? (s.pack||0) : (s.box||0); const so=d.v==='P'? (s.sop==null?1:s.sop) : (s.so==null?1:s.so);
  if (xtInPrint(n,G.day) || (n===TM_TT && shelf>0)){ if (days>30) pack=Math.min(pack, XT_MSRP.P*(1.15+0.6*so)); }   // on retail shelves: anchored to retail (higher while it keeps selling out)
  else pack=Math.max(XT_MSRP.P*1.15, ev)*(1+0.3*pr*Math.max(0,(G.day-xtPrintEnd(n))/365));   // out of print and off the shelves: scarcity grows
  return d.v==='P'? pack : pack*36*(age<=1?0.93:1.02);
}
function xtStock(set,f){ const s=G.xtg.shop[set]; return s? (f==='P'?s.pack:s.box) : 0; }
function xtBuySealed(set, f, q){
  const s=G.xtg.shop[set]; const price=XT_MSRP[f]; if (!s || xtStock(set,f)<q) return 'Not enough in stock.'; if (G.player.cash<price*q) return 'You need '+money(price*q)+'.';
  G.player.cash-=price*q; G.player.bought+=price*q; if (f==='P') s.pack-=q; else s.box-=q; const key=xtKey(set,0,f);
  for (let i=0;i<q;i++){ const cp=xtMakeCopy(key,0,[G.day,'bought',price,'Tidemark Games shop'],'shop'); cp.nw=1; cp.pv={d:G.day,v:Math.round(xtFairRaw(key)*100)/100,n:''}; } return null;
}
function xtPreorder(set, f, q){ const T=G.xtg; const lim=f==='B'?2:12; const have=T.pre.filter(p=>p.set===set&&p.f===f).reduce((s,p)=>s+p.q,0); if (have+q>lim) return 'Limit '+lim+' per account.'; const e=T.pre.find(p=>p.set===set&&p.f===f); if (e) e.q+=q; else T.pre.push({set,f,q}); return null; }
function xtFulfilPreorders(set, t){ const T=G.xtg; const mine=T.pre.filter(p=>p.set===set); T.pre=T.pre.filter(p=>p.set!==set); const key0=n=>xtKey(set,0,n);
  for (const p of mine){ const price=p.paid? 0 : XT_MSRP[p.f]; let got=0; for (let i=0;i<p.q;i++){ if (G.player.cash<price){ toast('Preorder: you ran out of cash after '+got+'.'); break; } G.player.cash-=price; G.player.bought+=price; const cp=xtMakeCopy(key0(p.f),0,[t,'preorder',p.paid? XT_MSRP[p.f] : price,'Tidemark Games shop'],'shop'); cp.nw=1; cp.pv={d:t,v:Math.round(xtFairRaw(key0(p.f))*100)/100,n:'Preordered before release.'}; got++; }
    if (got) toast('Preorder in: '+got+' '+xtD(key0(p.f)).title, true); }
}
// opening: returns the cards, never charges anything (the sealed copy is what you paid for)
function xtOpenSealed(id){
  const cp=XT(id); if (!cp || cp.o!==0 || cp.l) return null; const d=xtD(cp.k); if (!d.sealed) return null; const paid=(cp.a&&cp.a[2])||0; const packs=d.v==='P'?1:36; const r=mkRng(hsh('open'+cp.id+G.day)); const out=[]; let bulk=0;
  for (let i=0;i<packs;i++){ const keys=xtRollPack(d.set,r); bulk+=keys.bulk;
    const ids=keys.map(k=>{ const c=xtMakeCopy(k,0,[G.day,'pulled',Math.round(paid/packs/12*100)/100,'a '+d.title],'pull',r); c.nw=1; c.h=[[G.day,'Pulled from a '+d.title,0,'']]; const rr=xtCopyValue(c); c.pv={d:G.day,v:Math.round(rr*100)/100,n:''}; return c.id; }); out.push(ids); }
  const sv=Math.round(xtCopyValue(cp)*100)/100;   // what it was worth sealed, the moment it was opened
  const bv=Math.round(bulk*XT_BULK*100)/100; if (bv>0){ G.player.cash+=bv; G.player.sold=(G.player.sold||0)+bv; }   // the bulk goes to the store's bulk bin at once
  delete G.xtc[id]; G.player.packs=(G.player.packs||0)+packs; return {packs:out, set:d.set, title:d.title, paid, sv, bulk, bulkValue:bv};
}
// open several sealed items at once (every pack from 'Open all'): one result, packs in order
function xtOpenMany(ids){ const res={packs:[], set:1, title:'', paid:0, bulk:0, bulkValue:0}; let n=0, t='';
  for (const id of ids){ const r=xtOpenSealed(id); if (!r) continue; res.packs.push(...r.packs); res.set=r.set; res.paid+=r.paid; res.sv=(res.sv||0)+r.sv; res.bulk+=r.bulk; res.bulkValue+=r.bulkValue; t=r.title; n++; }
  if (!n) return null; res.title=n>1? n+' × '+t : t; return res; }
// ---------- grading ----------
function xtGradeCopy(cp){ const g=gradeOf(cp); cp.gt=(cp.gt||0)+1; cp.g=g; cp.cert=10000000+Math.floor(R()*89999999); const p=G.xpop[cp.k]||(G.xpop[cp.k]=Array(11).fill(0)); p[g]++; xTfvClear(cp.k); return g; }
function xtSubmitGrade(id, tier){ const T=GRADE_TIERS.find(x=>x.id===tier); const cp=XT(id); if (!cp||cp.o!==0||cp.g!==0||cp.l||xtD(cp.k).sealed) return 'That card can\'t be submitted right now.'; if (G.player.cash<T.fee) return 'You need '+money(T.fee)+'.'; G.player.cash-=T.fee; G.player.fees+=T.fee; cp.g=-1; (G.player.xsubs=G.player.xsubs||[]).push({id:G.nextLid++,cid:id,tier,t0:G.day,t1:G.day+T.days,fee:T.fee,raw:Math.round(xtCopyValue(cp)*100)/100}); (cp.h=cp.h||[]).push([G.day,'Sent to GCS ('+T.n+')',T.fee,'']); return null; }
function xtGradingTick(t){ const subs=G.player.xsubs||[]; if (!subs.length) return; for (const s of subs.filter(x=>x.t1<=t)){ const cp=XT(s.cid); if (!cp) continue; const g=xtGradeCopy(cp); (G.player.rv=G.player.rv||[]).push({k:'x',id:cp.id,g,raw:s.raw||0,fee:s.fee||0,t}); (cp.h=cp.h||[]).push([t,'Graded GCS '+g+' '+GRADE_NAMES[g],0,'']); toast('Back from GCS: '+xtD(cp.k).title+' is a '+g, g>=9); } G.player.xsubs=subs.filter(x=>x.t1>t); }
// ---------- collectors ----------
const XT_NT={xpl:{w:16,cash:[250,3500]}, xtl:{w:10,cash:[300,5000]}, xtm:{w:6,cash:[200,2500]}, xfl:{w:6,cash:[500,6000]}, xsl:{w:5,cash:[1500,12000]}, xgr:{w:4,cash:[400,6000]}};
const XT_HA=['Deck','Tide','Foil','Salt','Pack','Binder','Harbor','Keep','Fleet','Meta','Slab','Reef','Sleeve','Top8','Lantern','Wave'], XT_HB=['Admiral','Hunter','Skipper','King','Druid','Sage','Rat','Warden','Ranger','Keeper','Scout','Mate'];
function isXtNPC(n){ return !!XT_NT[n.ty]; }
function makeXtNPCs(){
  const used={}; for (const n of G.npcs) used[n.h]=1;
  for (const ty in XT_NT) for (let i=0;i<XT_NT[ty].w;i++){ let h; do { h=pick(XT_HA)+pick(XT_HB)+(R()<0.55?ri(1,99):''); } while(used[h]); used[h]=1; const c=XT_NT[ty].cash;
    G.npcs.push({ id:G.npcs.length+1, h, ty, cash:Math.round(rf(c[0],c[1])), inc:Math.round(rf(c[0],c[1])*0.05), tm:0, pids:[], gr:+R().toFixed(2), kn:+rf(0.08,0.4).toFixed(2), setProd:-1, setN:1+Math.floor(R()*TM_TT) }); }
  for (const n of G.npcs) if (!isXtNPC(n) && R()<0.07) n.xt=1; delete G._xtPool; delete G._cmPool; delete G._cdPool;
}
function xtInterest(n, item){
  const c=item.xt, d=xtD(c.k);
  if (!isXtNPC(n)) return n.xt? (d.sealed?0.5:0.3) : 0.03;
  if (d.sealed) return {xsl:1.25,xfl:0.95,xtl:0.7,xpl:0.55,xtm:0.5}[n.ty]||0.2;
  const card=d.card, u=(G.xtg.usage[card.cid]||0)/4, st=xtLegalState(card.cid); let f;
  switch(n.ty){ case 'xpl': f= st==='std'&&u>0.18? 1.1+u*0.6 : st==='std'? 0.45 : 0.18; break; case 'xtl': f=(xtIsPrem(card)||d.v==='F'||card.rar==='leg')? 1.2+0.2*card.ap+0.4*card.fan : 0.3; break; case 'xtm': f= n.setN===d.set? 1.3 : 0.25; break; case 'xfl': f=0.84; break; case 'xsl': f=0.12; break; case 'xgr': f= c.g>0? 1.3 : 0.12; break; default: f=0.5; }
  if (n.ty!=='xgr' && c.g>0) f*=0.9; return f;
}
function xtGive(key, src){ const cp=xtMakeCopy(key,0,null,src||'npc'); const it={xt:cp,v:xtCopyValue(cp)}; const pool=npcPool({xtg:1}); const c=[pick(pool),pick(pool),pick(pool),pick(pool)]; cp.o=c.sort((a,b)=>xtInterest(b,it)-xtInterest(a,it))[0].id; cp.a=[G.day,'held',0,'']; (G._npcXtIds=G._npcXtIds||[]).push(cp.id); return cp; }
// the world on day one: ten years of collectors. Copies of every named card exist in proportion to its rarity and age (older prints survive in
// smaller numbers, the reserve list in fewer still); historical sealed product is rare and old.
function xtSeedMarket(){
  G._npcXtIds=[]; const rel=xtReleasedSets(G.day); const r=mkRng(hsh('seed'+G.seed));
  for (const s of rel){ const def=xtSetDef(s), yrs=(G.day-def.rel)/365; const surv=Math.max(0.35,1-0.07*yrs);
    for (const c of xtSetCards(s)){ if (c.pk==='alt') continue; const base={common:5,unc:4,rare:3.2,leg:2.2}[c.rar]*(c.res?0.6:1)*surv; const share=Math.min(1,def.named/60)*0.5+0.5;
      for (const v of ['N','F']){ const lam=base*share*(v==='F'?0.22:1); const n=poisson(lam); for (let i=0;i<n;i++) xtGive(xtKey(s,c.no,v), r()<0.5?'deck':'pull'); } }
    const nb=Math.max(0,Math.round(4-yrs*0.35+gauss()*1.2)), np=Math.max(1,Math.round(26-yrs*2+gauss()*4)); for (let i=0;i<nb;i++) xtGive(xtKey(s,0,'B'),'shop'); for (let i=0;i<np;i++) xtGive(xtKey(s,0,'P'),'shop'); }
  for (const id of G._npcXtIds){ const cp=G.xtc[id]; if (xtD(cp.k).sealed) continue; const v=xtCopyValue(cp); const p=v>60?0.5: v>20?0.28: v>7?0.08: 0.005; if (R()<p) xtGradeCopy(cp); }
}
function xNpcListTc(){
  const ids=G._npcXtIds; if (!ids||!ids.length) return; let cp=null;
  for (let tries=0; tries<14 && !cp; tries++){ const c=G.xtc[ids[Math.floor(R()*ids.length)]]; if (!c||c.o<=0||c.l||c.g<0) continue; const v=xtCopyValue(c); if (v<0.25) continue; const n=NPC(c.o); if (!n) continue; const keep=xtInterest(n,{xt:c,v})>1.1? 0.7 : 0.12; if (R()<keep) continue; cp=c; }
  if (!cp) return; const n=NPC(cp.o); const v=xtCopyValue(cp); const sv=v*Math.exp(gauss()*n.kn);
  if (R()<0.25 && v>1.5) createListing('x',cp.id,n.id,'auc',Math.max(0.5,nicePrice(sv*rf(0.3,0.8))),pick([3,5,5,7]),false);
  else { const mult={xfl:rf(1.1,1.45), xgr:rf(1.05,1.3), xsl:rf(1.1,1.5)}[n.ty]||rf(0.95,1.35); createListing('x',cp.id,n.id,'bin',Math.max(0.25,nicePrice(sv*mult)),0,R()<0.6); }
}
// a new set lands: collectors open it, the glut hits the market
function xtReleaseMarket(n, t){ if (G._xtCatch) return; const r=mkRng(hsh('rel'+G.seed+n)); const nP=ri(210,330); for (let i=0;i<nP;i++) for (const k of xtRollPack(n,r)) xtGive(k,'pull'); for (let i=0;i<ri(4,9);i++) xtGive(xtKey(n,0,'B'),'shop'); for (let i=0;i<ri(25,50);i++) xtGive(xtKey(n,0,'P'),'shop'); for (let i=0;i<60;i++) xNpcListTc(); }
function xtMarketDay(t){
  if (!G.xtg || !G._npcXtIds) return; const nL=G.lst.filter(l=>l.it==='x'&&l.sel>0).length; const k=clamp(Math.round((300-nL)/5)+ri(3,8),2,40); for (let i=0;i<k;i++) xNpcListTc();
  xtGradingTick(t); if (t%10===0) xtCull();
  if (R()<0.3){ for (const id of G._npcXtIds.slice(-300)){ const cp=G.xtc[id]; if (!cp||cp.g||cp.l||xtD(cp.k).sealed) continue; if (xtCopyValue(cp)>25 && R()<0.1) xtGradeCopy(cp); } }
}
function xtCull(){ const ids=G._npcXtIds; if (!ids||ids.length<9000) return; const keep=[]; let drop=ids.length-7800; for (const id of ids){ const c=G.xtc[id]; if (!c||c.o<=0){ continue; } if (drop>0 && !c.l && !c.g && c.o>0 && xtCopyValue(c)<0.6 && R()<0.7){ delete G.xtc[id]; drop--; continue; } keep.push(id); } G._npcXtIds=keep; }
// ---------- hooking into the shared market ----------
const X_interest=interest; interest=function(n,item){ if (item.xtg) return xtInterest(n,item); if (isXtNPC(n)) return 0.03; return X_interest(n,item); };
const X_itemOf=itemOf; itemOf=function(l){ if (l.it==='x'){ const cp=G.xtc[l.ref]; return { xtg:true, xt:cp, key:cp.k, v:xtCopyValue(cp), heat:xtHeat(cp) }; } return X_itemOf(l); };
const X_createListing=createListing; createListing=function(it,ref,seller,ty,price,dur,off){ if (it!=='x') return X_createListing.apply(this,arguments);
  const l={ id:G.nextLid++, it, ref, sel:seller, ty, pr:Math.round(price*100)/100, st:G.day, en: ty==='auc'? G.day+dur : G.day+45, off:!!off, bids:[], cur:0, hist:[], offers:[] }; if (ty==='auc') l.cur=l.pr; G.lst.push(l); G.xtc[ref].l=l.id; return l; };
const X_removeListing=removeListing; removeListing=function(l){ if (l.it!=='x') return X_removeListing(l); const i=G.lst.indexOf(l); if (i>=0) G.lst.splice(i,1); const c=G.xtc[l.ref]; if (c) delete c.l; };
const X_itemLabel=itemLabel; itemLabel=function(l){ if (l.it!=='x') return X_itemLabel(l); const c=G.xtc[l.ref]; return xtCardLabel(c.k)+(c.g>0?' GCS '+c.g:''); };
const X_recordSale=recordSale; recordSale=function(key,price,g,buyer,seller){ if (key[0]!=='X') return X_recordSale(key,price,g,buyer,seller);
  const a=G.sales[key]||(G.sales[key]=[]); a.unshift([G.day,price,g]); if (a.length>24) a.length=24; G.dp[key]=(G.dp[key]||0)+0.035; xTfvClear(key); if (price>=8||buyer===0||seller===0){ G.feed.unshift([G.day,key,price,g,buyer,seller]); if (G.feed.length>200) G.feed.length=200; } };
const X_transfer=transfer; transfer=function(l,buyer,price,how){ if (l.it!=='x') return X_transfer(l,buyer,price,how);
  const seller=l.sel, item=itemOf(l), gross=Math.round(price*100)/100; if (buyer===0){ G.player.cash-=gross; G.player.bought+=gross; } else NPC(buyer).cash-=gross; const net=Math.round(gross*(1-FEE)*100)/100;
  if (seller===0){ G.player.cash+=net; G.player.sold+=gross; G.player.fees+=gross-net; } else NPC(seller).cash+=net;
  const c=item.xt; recordSale(item.key,gross,c.g>0?c.g:0,buyer,seller); c.o=buyer;
  if (buyer===0){ c.a=[G.day,how==='auc'?'won':'bought',gross,ownerName(seller)]; (c.h=c.h||[]).push([G.day,how==='auc'?'Won at auction':'Bought',gross,ownerName(seller)]); c.nw=1; c.pv={d:G.day,v:Math.round(item.v*100)/100,n:''}; }
  if (seller===0) (c.h=c.h||[]).push([G.day,'Sold',gross,ownerName(buyer)]); if (buyer>0 && G._npcXtIds && seller===0) G._npcXtIds.push(c.id);
  removeListing(l); if (seller===0||buyer===0) toast((seller===0?'Sold ':'Bought ')+itemLabel({it:'x',ref:c.id})+' for '+money(gross)+(seller===0?' (you receive '+money(net)+')':'')); };
const X_playerList=playerList; playerList=function(it,ref,ty,price,dur,off){ if (it!=='x') return X_playerList(it,ref,ty,price,dur,off); if (!(price>0)) return 'Enter a price.'; const o=G.xtc[ref]; if (!o||o.o!==0||o.l) return 'Not available to list.'; if (o.g<0) return 'That card is at the grader.'; createListing('x',ref,0,ty,price,dur,off); G.player.listed++; return null; };
const X_npcPool=npcPool; npcPool=function(item){ if (item&&item.xtg){ if (!G._xtPool) G._xtPool=G.npcs.filter(n=>isXtNPC(n)||n.xt); return G._xtPool; } return X_npcPool(item); };
function crackXt(id){ const c=XT(id); if (!c || c.o!==0 || c.l || !(c.g>0)) return 'That slab can\'t be opened.'; const g=c.g; c.pg=g; c.g=0; delete c.cert; c.cr=(c.cr||0)+1; (c.h=c.h||[]).push([G.day,'Cracked out of a GCS '+g+' slab',0,'']); G.player.rv=(G.player.rv||[]).filter(x=>!(x.k==='x'&&x.id===id)); xTfvClear(c.k); return null; }
