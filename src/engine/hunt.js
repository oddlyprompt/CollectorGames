// ===================== THE HUNT: ENGINE =====================
// Every seller owns real objects from the world (G.cards, G.mc, G.sealed) under owner id -(1000+sellerId).
// Prices come from each seller's own knowledge, not from the game's fair value.
const HSID = id=>-(1000+id);
const HS = o=>G.hunt && o<=-1000 ? G.hunt.sel[-o-1000] : null;
const HCARD=()=>packHas('sports'), HCOMIC=()=>packHas('comics');
const CARD_CATS=['mod','pros','vcard','slab','auto','team','wax'], COMIC_CATS=['comic','ocomic','key','cslab','cvar','indie','tpb'];
const CAT_TO_COMIC={mod:'comic',pros:'key',vcard:'ocomic',slab:'cslab',auto:'cvar',team:'comic',wax:'comic'}, CAT_TO_CARD={comic:'mod',ocomic:'vcard',key:'pros',cslab:'slab',cvar:'auto',indie:'mod',tpb:'mod'};
function shopFits(prof){ const ks=Object.keys(prof||{}); if (ks.includes('mixed')) return true; return ks.some(k=> CARD_CATS.includes(k)? HCARD() : COMIC_CATS.includes(k)? HCOMIC() : true); }
const HUNT_KINDS = {
  pro:    {n:'Professional dealer', mg:[1.15,1.35], minF:[1.02,1.1], pat:0.6, bb:[0.62,0.75], cash:[3000,15000]},
  spec:   {n:'Specialist', mg:[1.12,1.3], minF:[1.0,1.08], pat:0.55, bb:[0.6,0.72], cash:[2000,9000]},
  gen:    {n:'Generalist', mg:[1.1,1.35], minF:[0.92,1.05], pat:0.5, bb:[0.55,0.7], cash:[1500,6000]},
  old:    {n:'Old-school dealer', mg:[1.15,1.4], minF:[0.95,1.05], pat:0.35, bb:[0.5,0.65], cash:[2000,8000]},
  casual: {n:'Casual seller', mg:[0.9,1.3], minF:[0.7,0.9], pat:0.45, bb:[0.4,0.55], cash:[200,1200]},
  liq:    {n:'Liquidator', mg:[0.8,1.1], minF:[0.6,0.8], pat:0.7, bb:[0.35,0.5], cash:[500,3000]},
  estate: {n:'Estate seller', mg:[0.9,1.2], minF:[0.6,0.85], pat:0.5, bb:[0,0], cash:[0,0]},
  pawn:   {n:'Pawn shop', mg:[1.3,1.7], minF:[0.9,1.05], pat:0.3, bb:[0.3,0.45], cash:[2000,8000]},
  priv:   {n:'Private collector', mg:[1.0,1.25], minF:[0.8,0.95], pat:0.5, bb:[0,0], cash:[0,0]},
  kid:    {n:'Private seller', mg:[0.8,1.4], minF:[0.55,0.8], pat:0.4, bb:[0,0], cash:[0,0]}
};
// knowledge: card (modern cards and prospects), vcard (older card products), comic (modern comics), ocomic (pre-1980 comics), sealed
const SHOP_DEFS = [
  ['Diamond Den Cards','Rico Bannon','pro',{card:0.95,vcard:0.85,comic:0.2,ocomic:0.15,sealed:0.9},{mod:3,pros:3,slab:2,auto:1.5,wax:2,box1:1},'A baseball-first shop. Rico knows this year\'s rookies to the dollar.'],
  ['Northside Hobby Emporium','Janet Okafor','pro',{card:0.8,vcard:0.75,comic:0.75,ocomic:0.6,sealed:0.85},{mod:2,slab:1.5,wax:2,comic:2,key:1,tpb:1},'Big, bright and efficiently priced. Rarely a bargain, rarely a rip-off.'],
  ['Old Mill Vintage','Walter Pryce','old',{card:0.35,vcard:0.9,comic:0.35,ocomic:0.95,sealed:0.5},{vcard:3,ocomic:3,slab:1,mixed:1},'Walter has handled old paper for forty years. New stuff, he admits, moves too fast for him.'],
  ['Kettle & Crate Antiques','Maud Salcedo','gen',{card:0.2,vcard:0.3,comic:0.2,ocomic:0.4,sealed:0.25},{ocomic:1,vcard:1,mixed:2,box1:1},'Mostly furniture and glassware. There\'s a shelf of paper collectibles in the back.'],
  ['Paperback Exchange','Colin Whitlock','gen',{card:0.1,vcard:0.1,comic:0.35,ocomic:0.45,sealed:0.1},{comic:2,ocomic:1,tpb:3,box1:2},'A used bookstore with a comics corner and a very full dollar crate.'],
  ['Quick Cash Pawn','Dale Hollis','pawn',{card:0.3,vcard:0.3,comic:0.25,ocomic:0.3,sealed:0.4},{slab:3,auto:1,wax:1,mixed:1},'Prices slabs by the big number on the label. Negotiable, to a point.'],
  ['Second Chance Consignment','Priya Varga','casual',{card:0.45,vcard:0.4,comic:0.45,ocomic:0.4,sealed:0.5},{mixed:3,mod:1,comic:1,box1:1},'Everything here is a consignor\'s item, priced by the consignor.']
];
const DEALER_NAMES = ['Mike\'s Cards','Heartland Sportscards','Top Loader Traders','Dugout Collectibles','Rookie Row','Slab City','Wax Pack Warehouse','Bullpen Breaks','Box Seat Cards','Old Timer\'s Table','Hall Pass Cards','Pennant Race Collectibles','Grand Slam Graded','Bench Clearing Cards','The Card Cave','Signed & Sealed','Double Play Dealers','Chalk Line Cards','Home Plate Hobby','Minor League Mike',
  'Longbox Larry','Panel Pushers','Silver Spine Comics','Four Color Finds','Key Issue Kings','Back Issue Barn','Mylar Mike','Gutter Space Comics','Splash Page Books','The Variant Vault','Pulp & Paper','Bronze Age Bruce','Indie Alley','Newsstand Nostalgia','Slabbed & Graded Comics','Cover Price Comics',
  'Pickers Paradise','Attic Finds','Odds & Ends Trading','Grab Bag Collectibles'];
const DEALER_PROFILES = [
  ['pro',{mod:3,pros:2,slab:1,wax:1,box1:1}],['spec',{pros:4,mod:1,box1:1}],['pro',{slab:4,auto:1}],['spec',{vcard:3,slab:1,box1:1}],['gen',{mod:2,box1:2,mixed:1}],['spec',{wax:4}],['spec',{auto:3,slab:1}],['gen',{team:3,mod:1,box1:1}],['casual',{mixed:2,mod:2,box5:1}],['old',{vcard:3,mixed:1}],
  ['pro',{mod:2,slab:2,box5:1}],['gen',{mod:2,pros:1,box1:1}],['pro',{slab:3,pros:1}],['casual',{mod:2,box1:2}],['gen',{mixed:2,box1:1,wax:1}],['spec',{auto:2,slab:2}],['gen',{mod:2,team:2,box5:1}],['casual',{box1:3,mod:1}],['pro',{mod:2,wax:2}],['spec',{pros:3,box5:1}],
  ['spec',{comic:2,key:2,box1:1}],['pro',{key:3,cslab:2}],['old',{ocomic:4,box1:1}],['gen',{comic:2,ocomic:1,box1:2}],['pro',{key:3,comic:1}],['gen',{comic:3,box1:2}],['casual',{comic:2,box1:2,cvar:1}],['spec',{indie:3,comic:1,box1:1}],['gen',{comic:2,tpb:1,box1:1}],['spec',{cvar:4}],['old',{ocomic:3,key:1}],['spec',{ocomic:2,comic:1,box1:1}],['spec',{indie:4,box1:1}],['old',{ocomic:2,box1:2}],['pro',{cslab:4}],['gen',{comic:3,box1:1}],
  ['casual',{mixed:3,box1:2}],['casual',{mixed:3,box1:1}],['gen',{mixed:2,mod:1,comic:1}],['casual',{mixed:2,box5:1,box1:1}]
];
const DEALER_KNOW = { card:[0.5,0.95], vcard:[0.4,0.9], comic:[0.4,0.95], ocomic:[0.3,0.9], sealed:[0.5,0.9] };
const GARAGE_STREETS = ['Birch Street','Maple Crescent','Juniper Lane','Oak Hollow Drive','Cedar Court','Willow Row','Lakeview Road','Harrow Avenue','Pine Ridge Way','Elm Terrace','Chestnut Close','Mill Road'];
const GARAGE_BLURB = ['boxes of old toys and "some comics"','moving sale, everything must go','kids\' stuff from the attic, including trading cards','household goods, records, a box of comics','downsizing: books, games, sports memorabilia','"collectibles" in the listing, no photos'];
const FLEA_JUNK = ['VHS tapes','board games missing pieces','die-cast cars','a stack of hobby price-guide magazines','souvenir mugs','vinyl records','action figures, loose','a box of cables','old baseball caps','paperback westerns','commemorative plates','mass-produced figurines'];
const AUCTION_HOUSE = 'Harrow & Finch Auctions';
const PV_STORIES = {
  team:['A lifelong {team} fan is selling the collection he built over the years.','{team} team collection: rookies, stars, autographs and a couple of sealed boxes.'],
  child:['A parent is selling the cards their kid collected a few years back. "He\'s moved on to other things."','Cards from someone\'s school years, kept in shoeboxes and binders.'],
  horror:['A horror reader is clearing shelves: a long run of one series plus a lot of other horror books.'],
  indie:['An indie comics reader is downsizing. Lots of small-press series, a few signed at conventions.'],
  oldread:['Reader copies from the 60s through the 80s, inherited from an uncle who read everything.'],
  dealer:['A dealer is selling part of his inventory wholesale to raise cash.'],
  inherit:['A family is selling an inherited collection. They know it has "some old stuff" and not much more.']
};

function huntInit(){
  if (!packHas('hunt')) return;
  G.hunt = { v:1, sel:[], ev:[], pv:[], auc:[], want:[], nid:1, sess:null, tbl:null, found:[], last:G.day };
  SHOP_DEFS.forEach((d,i)=>{ if ((i===0 && !HCARD()) || (i===4 && !HCOMIC())) return; const s=newSeller(d[2], {n:d[0], who:d[1], know:d[3], prof:d[4], blurb:d[5], shop:1}); stockSeller(s, ri(35,55)); });
  DEALER_PROFILES.forEach((p,i)=>{ if ((i<20 && !HCARD()) || (i>=20 && i<36 && !HCOMIC())) return; const know={}; for (const k in DEALER_KNOW){ const r=DEALER_KNOW[k]; know[k]=+rf(r[0],r[1]).toFixed(2); } const comicy=i>=20&&i<36, cardy=i<20;
    if (cardy){ know.comic*=0.4; know.ocomic*=0.4; } if (comicy){ know.card*=0.35; know.vcard*=0.35; }
    if (p[0]==='casual'){ for (const k in know) know[k]=+(know[k]*0.6).toFixed(2); }
    const s=newSeller(p[0], {n:DEALER_NAMES[i], who:personName(), know, prof:p[1], dealer:cardy?'card':comicy?'comic':'mixed'}); stockSeller(s, ri(28,48)); });
  // flea regulars
  for (let i=0;i<3;i++){ const s=newSeller('casual',{n:['Hank\'s Table','The Bin Lady','Two Brothers Trading'][i], who:personName(), know:{card:rf(0.2,0.5),vcard:rf(0.2,0.5),comic:rf(0.2,0.5),ocomic:rf(0.2,0.5),sealed:0.4}, prof:{mixed:3,box1:1,comic:1,mod:1}, flea:1}); stockSeller(s, ri(25,40)); }
  scheduleEvents(G.day, G.day+70);
  makePrivate();
}
function newSeller(kind, o){
  const K=HUNT_KINDS[kind];
  const s={ id:G.hunt.sel.length, n:o.n, who:o.who||'', kind, know:o.know, prof:o.prof||{mixed:1}, mg:+rf(K.mg[0],K.mg[1]).toFixed(2), minF:+rf(K.minF[0],K.minF[1]).toFixed(2), pat:K.pat, bb:+rf(K.bb[0],K.bb[1]).toFixed(2), cash:Math.round(rf(K.cash[0],K.cash[1])), inv:[], rel:0, mood:0, sp:0 };
  for (const k of ['blurb','shop','dealer','flea','temp','ev','story','exp','urg']) if (o[k]!=null) s[k]=o[k];
  s.urg = o.urg!=null? o.urg : +rf(0,0.5).toFixed(2);
  G.hunt.sel.push(s); return s;
}
// ---- getting real objects into a seller's hands ----
function fmtOf(prod, pref){ const f=Object.keys(B(prod).formats); return f.includes(pref)?pref:f[0]; }
function objOf(e){ return e.t==='c'? G.cards[e.id] : e.t==='m'? G.mc[e.id] : G.sealed[e.id]; }
function objKey(e){ const o=objOf(e); if (!o) return ''; return e.t==='s'? sealedKey(G.products[o.p],o.f) : o.k; }
function takeNpc(t, fn){
  const ids = t==='c'? G._npcCardIds : G._npcComicIds; if (!ids || !ids.length) return null;
  for (let i=0;i<25;i++){ const id=ids[Math.floor(R()*ids.length)]; const o = t==='c'?G.cards[id]:G.mc[id]; if (!o || o.o<=0 || o.l || o.g<0) continue; if (fn && !fn(o)) continue; return o; }
  return null;
}
function randCardKey(opts){
  opts=opts||{}; let prods=releasedProducts(); if (opts.old) prods=prods.filter(p=>yearOf(G.day)-p.yr>=3); if (opts.recent) prods=prods.filter(p=>yearOf(G.day)-p.yr<=1); if (!prods.length) prods=releasedProducts();
  const prod=pick(prods); const fmts=Object.keys(B(prod).formats);
  const packs=genSealed(prod, fmts.includes('pack')?'pack':fmts[0], Math.floor(R()*2e9)); const keys=packs.flat();
  if (opts.hit){ const hits=keys.filter(k=>{ const d=D(k); return d.auto||d.run||d.rc||d.par; }); if (hits.length) return pick(hits); }
  return pick(keys);
}
function randComicKey(opts){
  opts=opts||{};
  for (let i=0;i<20;i++){ const s=pick(G.cm.ser); if (!s.n) continue; const yr=yearOf(s.st);
    if (opts.old && yr>=1980) continue; if (opts.modern && yr<1990) continue; if (opts.indie && tierOf(s)<2) continue; if (opts.horror && s.g!==GI.horror) continue;
    let n=1+Math.floor(R()*s.n); if (opts.key){ const ks=s.keys.filter(k=>['fa','cam','team','dth','ss','ic','fin'].includes(k[1])); if (ks.length) n=pick(ks)[0]; else n=1; }
    let v=''; if (opts.var && s.v[n]){ const vs=s.v[n].split(',').filter(x=>x!=='B'); if (vs.length) v=pick(vs); }
    return mk(s.id,n,1,v); }
  return mk(G.cm.ser.find(s=>s.n).id,1,1,'');
}
function acquireFor(s, cat){
  if (!HCOMIC() && COMIC_CATS.includes(cat)) cat=CAT_TO_CARD[cat]; else if (!HCARD() && CARD_CATS.includes(cat)) cat=CAT_TO_COMIC[cat];
  const own=HSID(s.id); let o=null, t='c';
  const fromNpc = !s.temp && R()<0.55;
  switch(cat){
    case 'mod': o = fromNpc? takeNpc('c', c=>!D(c.k).prod || yearOf(G.day)-D(c.k).prod.yr<=2) : makeCard(randCardKey({recent:1,hit:R()<0.3}),own,null); break;
    case 'pros': o = takeNpc('c', c=>{ const p=P(D(c.k).pid); return p.tm===-1 || D(c.k).first || D(c.k).rc; }) || makeCard(randCardKey({hit:1}),own,null); break;
    case 'vcard': o = fromNpc? takeNpc('c', c=>yearOf(G.day)-D(c.k).prod.yr>=3) : makeCard(randCardKey({old:1,hit:R()<0.3}),own,null); break;
    case 'slab': o = takeNpc('c', c=>c.g>0); break;
    case 'auto': o = takeNpc('c', c=>D(c.k).auto) || makeCard(randCardKey({hit:1}),own,null); break;
    case 'team': { const tm=s.tm!=null?s.tm:(s.tm=ri(0,TEAMS_DEF.length-1)); o = takeNpc('c', c=>P(D(c.k).pid).tm===tm) || makeCard(randCardKey({}),own,null); break; }
    case 'wax': { const prods=releasedProducts().filter(p=>!inRetail(p)||R()<0.3); const pool=Object.values(G.sealed).filter(x=>x.o>0 && !x.l); if (pool.length && R()<0.6) o=pick(pool); else { const prod=pick(prods.length?prods:releasedProducts()); const f=pick(Object.keys(B(prod).formats)); o=makeSealed(prod.id,f,own,null); } t='s'; break; }
    case 'comic': t='m'; o = fromNpc? takeNpc('m', c=>cmD(c.k).yr>=1985) : cmMakeCopy(randComicKey({modern:1}),own,null,'npc'); break;
    case 'ocomic': t='m'; o = fromNpc? takeNpc('m', c=>cmD(c.k).yr<1980) : cmMakeCopy(randComicKey({old:1}),own,null,'npc'); break;
    case 'key': t='m'; o = takeNpc('m', c=>{ const d=cmD(c.k); return !d.tr && (d.n===1 || issueKeys(d.s,d.n).length>0); }) || cmMakeCopy(randComicKey({key:1}),own,null,'npc'); break;
    case 'cslab': t='m'; o = takeNpc('m', c=>c.g>0); break;
    case 'cvar': t='m'; o = takeNpc('m', c=>!!cmD(c.k).v) || cmMakeCopy(randComicKey({modern:1,var:1}),own,null,'npc'); break;
    case 'indie': t='m'; o = takeNpc('m', c=>tierOf(cmD(c.k).s)>=2) || cmMakeCopy(randComicKey({indie:1}),own,null,'npc'); break;
    case 'tpb': { t='m'; const trs=[]; for (let i=0;i<30 && !trs.length;i++){ const x=pick(G.cm.ser); if (x.tr.length) trs.push([x,pick(x.tr)]); } if (trs.length){ const [x,e]=trs[0]; if (e[2]<=G.day) o=cmMakeCopy(mk(x.id,e[0]+e[1],1,''),own,null,'npc'); } break; }
    default: if (HCARD() && (!HCOMIC() || R()<0.5)){ o=makeCard(randCardKey({old:R()<0.5}),own,null); } else { t='m'; o=cmMakeCopy(randComicKey({}),own,null,'lot'); }
  }
  if (!o) return null;
  o.o=own; return {t, id:o.id};
}
function stockSeller(s, n){
  const prof=Object.entries(s.prof).filter(([k])=>!k.startsWith('box'));
  for (let i=0;i<n;i++){ const cat = prof.length? wpick(prof, x=>x[1])[0] : 'mixed'; const e=acquireFor(s,cat); if (e) addEntry(s,e); }
}
function addEntry(s, e, price){
  const o=objOf(e); if (!o) return;
  e.d=G.day;
  // misidentification: rare for pros, less rare for casual sellers
  const pm = {pro:0.004,spec:0.006,gen:0.02,old:0.015,casual:0.05,liq:0.04,estate:0.07,pawn:0.03,priv:0.03,kid:0.08}[s.kind]||0.02;
  if (!price && R()<pm){ const ck=misKey(e); if (ck) e.ck=ck; }
  e.p = price || priceFor(s,e);
  s.inv.push(e);
}
function misKey(e){
  const o=objOf(e);
  if (e.t==='c'){ const d=D(o.k); if (d.parObj && !d.auto) return dk(d.prod, d.sec==='a'?'a':'b', d.no, ''); return null; }
  if (e.t==='m'){ const d=cmD(o.k); if (d.tr) return null; const s=d.s;
    if (d.v && d.v!=='B' && R()<0.7) return mk(s.id,d.n,d.p,'');       // variant sold as a regular cover
    if (d.p===1 && s.pp[d.n] && R()<0.5) return mk(s.id,d.n,2,'');       // first print sold as a reprint
    if ((d.p>1) && R()<0.8) return mk(s.id,d.n,1,d.v||'');               // reprint sold as a first print
    return null; }
  return null;
}
// ---- what a seller thinks something is worth ----
function domainOf(e){ const o=objOf(e); if (e.t==='c'){ const d=D(o.k); return yearOf(G.day)-d.prod.yr>=3?'vcard':'card'; } if (e.t==='m') return cmD(o.k).yr<1980?'ocomic':'comic'; return 'sealed'; }
function trueValue(e){ const o=objOf(e); if (!o) return 0; if (e.t==='c') return cardValue(o); if (e.t==='m') return cmCopyValue(o); return sealedFair(G.products[o.p],o.f); }
function valueAs(e, key, stale){ // value of this object if it were `key`, with the same condition
  const o=objOf(e);
  if (e.t==='c'){ const g=o.g>0?o.g:0; let v=fairValue(key,g); if (!(g>0)) v*=visibleCondFactor(o); if (o.sg) v*=cardSigMult(o); if (stale){ const p=P(D(key).pid); v*=staleFactor(p, stale); } return v; }
  if (e.t==='m'){ const g=o.g>0?o.g:apparentGrade(o); let v = stale? cmFairStale(key,g) : cmFair(key,g); if (!(o.g>0)) v=v/1.08*0.84; if (o.gr) v*=0.35; return v*sigMult(o,cmD(key)); }
  return sealedFair(G.products[o.p],o.f);
}
function staleFactor(p, lag){ const h=p.hx; if (!h || h.length<2) return 1; const t=G.day-lag; let v=h[0][1]; for (const x of h){ if (x[0]<=t) v=x[1]; else break; } const now=playerBase(p); return clamp(v/Math.max(0.0001,now), 0.15, 6); }
function genericValue(e){
  const o=objOf(e);
  if (e.t==='c'){ const d=D(o.k); if (o.g>0) return 12+o.g*3; return d.auto?8: d.run?4: d.parObj?1.2: d.rc?0.75: 0.25; }
  if (e.t==='m'){ const d=cmD(o.k); if (o.g>0) return 30; if (d.tr) return 6; const age=yearOf(G.day)-d.yr; return (age>=45?6: age>=25?1.5:1) * (d.n===1?2:1); }
  const prod=G.products[o.p]; return B(prod).formats[o.f].price*1.1;
}
function sellerEst(s, e){
  const o=objOf(e); if (!o) return 0; const dom=domainOf(e); const k=clamp(s.know[dom]||0.3,0,1);
  const key = e.ck || objKey(e);
  const cur = e.t==='s' ? trueValue(e) : valueAs(e, key, 0);
  const lagDays = Math.round((1-k)*420);
  const stale = e.t==='s' ? B(G.products[o.p]).formats[o.f].price*1.05 : valueAs(e, key, lagDays||1);
  const gen = genericValue(e);
  const L=x=>Math.log(Math.max(0.05,x));
  const base = k>=0.5 ? Math.exp(L(stale)+(L(cur)-L(stale))*(k-0.5)*2) : Math.exp(L(gen)+(L(stale)-L(gen))*k*2);
  const r=mkRng(hashStr(s.id+':'+e.t+':'+e.id)); const u=(r()+r()+r()-1.5)*2;
  return base*Math.exp(u*(0.05+(1-k)*0.32));
}
function priceFor(s, e){ return Math.max(0.5, nicePrice(sellerEst(s,e)*s.mg)); }
function sellerMin(s, e){ // the lowest they'll take today
  const est=sellerEst(s,e); let m=Math.max(0.5, est*s.minF);
  const age=G.day-(e.d||G.day); if (age>60) m*=0.9; if (age>150) m*=0.88;
  const ss=G.hunt.sess; const here = ss && (s.ev===ss.ev || (G.hunt.ev.find(x=>x.id===ss.ev)||{tb:[]}).tb.includes(s.id)); if (here && ss.clock>300) m*=0.93; if (here && ss.clock>390) m*=0.93;
  m *= 1 - Math.min(0.08, s.rel*0.015) - s.urg*0.08;
  return Math.min(m, e.p);
}
// ---- the structures other systems understand ----
function huntItem(e){ const o=objOf(e); if (!o) return {v:0}; if (e.t==='c') return {card:o, key:o.k, v:cardValue(o), heat:1}; if (e.t==='m') return {comic:true, cm:o, key:o.k, v:cmCopyValue(o), heat:1}; const prod=G.products[o.p]; return {sealed:true, s:o, prod, key:sealedKey(prod,o.f), v:sealedFair(prod,o.f), heat:1}; }
function huntLabel(e, claimed){ const o=objOf(e); if (!o) return '?';
  if (e.t==='c'){ const d=D(claimed&&e.ck?e.ck:o.k); return pname(P(d.pid))+' '+d.prod.yr+' '+B(d.prod).short+' '+d.title+(o.g>0?' (GCS '+o.g+')':''); }
  if (e.t==='m'){ const d=cmD(claimed&&e.ck?e.ck:o.k); return d.title+(d.label&&d.label!=='Cover A'?' ('+d.label+')':'')+(o.g>0?' (GCS '+gTxt(o.g)+')':''); }
  return prodName(G.products[o.p])+' '+FMT_NAME[o.f].toLowerCase(); }
function removeEntry(s, e){ const i=s.inv.indexOf(e); if (i>=0) s.inv.splice(i,1); if (G.hunt.cart) G.hunt.cart=G.hunt.cart.filter(x=>x!==e.id+':'+e.t); }
function entryById(s, t, id){ return s.inv.find(e=>e.t===t && e.id===id); }
function whereName(s){ if (s.shop) return s.n; const ev=s.ev!=null? G.hunt.ev.find(x=>x.id===s.ev) : null; return ev? s.n+' at '+ev.n : s.n; }
function giveTo(e, owner, price, how, where){
  const o=objOf(e); o.o=owner; const hist = how==='found'? 'Found at '+where : how==='lot'? 'Came in a collection bought from '+where : how==='signed'? 'Bought at '+where : 'Bought at '+where;
  if (owner===0){ if (e.t==='s') o.a=[G.day,'bought',price,where]; else { o.a=[G.day, how==='found'?'found':how==='lot'?'lot':'bought', price, where]; (o.h=o.h||[]).push([G.day, hist+(e.bx?' ('+money(e.bx)+' box)':''), price, '']); o.nw=1; } }
  else if (owner>0){ if (e.t==='c' && G._npcCardIds) G._npcCardIds.push(o.id); if (e.t==='m' && G._npcComicIds) G._npcComicIds.push(o.id); }
}
function playerBuy(s, entries, total, how){
  if (G.player.cash < total) return 'You need '+money(total,true)+'.';
  G.player.cash -= total; G.player.bought += total; s.cash += total; s.sp += total;
  const where = whereName(s); const sum=entries.reduce((a,e)=>a+e.p,0)||1;
  for (const e of entries){ const share=Math.round(total*e.p/sum*100)/100; giveTo(e, 0, share, how || (e.bx||s.kind==='estate'||s.kind==='kid'||s.flea?'found':'bought'), where); removeEntry(s,e);
    G.hunt.found.unshift([G.day, e.t, e.id, share, where, trueValue(e)]); }
  if (G.hunt.found.length>80) G.hunt.found.length=80;
  s.rel = Math.min(8, s.rel + Math.min(1.5, total/150) + 0.2);
  return null;
}
// ---- negotiation ----
function negotiate(s, entries, offer, trade){
  const ask = entries.reduce((a,e)=>a+e.p,0);
  const n = entries.length; const bundle = n>1 ? 1 - Math.min(0.12, 0.03*(n-1))*(0.5+s.urg) : 1;
  let min = entries.reduce((a,e)=>a+sellerMin(s,e),0) * bundle;
  const desired = Math.max(min, ask*(n>1?0.93:0.96)*(1-s.urg*0.05));
  const credit = trade ? tradeCredit(s, trade) : 0;
  const total = offer + credit;
  if (s.mood>=3) return {no:`${s.who||s.n} isn't taking any more offers from you today.`};
  const key=entries.map(e=>e.t+e.id).join(',');
  if (total >= desired || total >= ask) return {ok:1, price:offer, credit};
  if (total >= min){ if (R()<0.35+s.urg*0.4 || (G.hunt.lastCounter&&G.hunt.lastCounter.k===key && total>=G.hunt.lastCounter.p*0.97)) return {ok:1, price:offer, credit};
    const c=nicePrice(Math.max(total,(total+desired)/2)); G.hunt.lastCounter={k:key,p:c,s:s.id}; return {counter:c, credit, msg: n>1?`I can do ${money(c,true)} for the lot.`:`Meet me at ${money(c,true)}?`}; }
  if (total < min*0.6){ s.mood++; s.rel=Math.max(0,s.rel-0.3); return {no: s.mood>=3? 'That\'s insulting. We\'re done for today.' : pick(['Not even close.','I paid more than that for it.','Come on, be serious.'])}; }
  const c=nicePrice(Math.max(min*1.02,(total+ask)/2)); G.hunt.lastCounter={k:key,p:c,s:s.id};
  return {counter:c, credit, msg:`Best I can do is ${money(c,true)}.`};
}
function bestPrice(s, entries){ const ask=entries.reduce((a,e)=>a+e.p,0); const n=entries.length; const bundle=n>1?1-Math.min(0.12,0.03*(n-1))*(0.5+s.urg):1; const min=entries.reduce((a,e)=>a+sellerMin(s,e),0)*bundle; return nicePrice(Math.min(ask, min + (ask-min)*rf(0.35,0.6))); }
// ---- selling and trading to sellers ----
function playerObjs(){ const out=[]; for (const c of myCards()) if (!c.l && c.g>=0) out.push({t:'c',id:c.id}); for (const c of myComics()) if (!c.l && c.g>=0) out.push({t:'m',id:c.id}); for (const x of mySealed()) if (!x.l) out.push({t:'s',id:x.id}); return out; }
function dealerQuote(s, e){ const want = s.prof[{c:'mod',m:'comic',s:'wax'}[e.t]] || s.prof.mixed || 0.5; const k=clamp(s.know[domainOf(e)]||0.3,0,1); const est=sellerEst(s,e); const liq = est>300?0.85: est<3?0.4:1; return Math.max(0, Math.round(est*s.bb*liq*(want>=2?1.08:1)*(k<0.35?0.8:1)*100)/100); }
function tradeCredit(s, items){ return Math.round(items.reduce((a,e)=>a+dealerQuote(s,e)*1.18,0)*100)/100; }
function sellToSeller(s, items){
  const total=items.reduce((a,e)=>a+dealerQuote(s,e),0); if (total>s.cash) return 'They don\'t have that much cash on hand.';
  for (const e of items){ const o=objOf(e); const q=dealerQuote(s,e); if (!o || o.o!==0) continue; o.o=HSID(s.id); if (e.t!=='s') (o.h=o.h||[]).push([G.day,'Sold to '+whereName(s),q,'']); const ne={t:e.t,id:e.id}; addEntry(s, ne); }
  s.cash-=total; G.player.cash+=total; G.player.sold+=total; s.rel=Math.min(8,s.rel+0.3); return null;
}
function applyTrade(s, items){ for (const e of items){ const o=objOf(e); if (!o || o.o!==0) continue; o.o=HSID(s.id); if (e.t!=='s') (o.h=o.h||[]).push([G.day,'Traded to '+whereName(s),0,'']); addEntry(s,{t:e.t,id:e.id}); } }
// ---- NPC competition ----
function npcBrowse(s, visits){
  for (let v=0; v<visits; v++){
    if (!s.inv.length) return; const e=s.inv[Math.floor(R()*s.inv.length)]; if (!objOf(e)){ removeEntry(s,e); continue; } if (e.hold && e.hold>=G.day) continue;
    const it=huntItem(e); if (!it.v) continue; const n=pick(npcPool(e.t==='m'?{comic:1}:{})); if (n.cash<e.p) continue;
    const val=npcValuation(n, it); const need = (n.ty==='dealer'||n.ty==='flip'||n.ty==='cdlr'||n.ty==='deal')? e.p*1.25 : e.p*1.05;
    if (val>=need){ n.cash-=e.p; s.cash+=e.p; giveTo(e, n.id, e.p, 'bought', whereName(s)); removeEntry(s,e); }
  }
}
// ---- events ----
const EV_T = {
  garage:{n:'Garage sale', cost:0, days:1}, estate:{n:'Estate sale', cost:0, days:2}, flea:{n:'Riverside Flea Market', cost:2, days:1},
  lshow:{n:'Russell County Card Show', cost:5, days:1, tables:[7,10], kind:'card'}, rshow:{n:'Capital Sports Collectibles Show', cost:65, days:2, tables:[14,18], kind:'card'},
  nshow:{n:'National Collectors Convention', cost:340, days:3, tables:[22,28], kind:'both'}, meet:{n:'Collector meetup at the Legion Hall', cost:0, days:1, tables:[4,6], kind:'both'},
  scon:{n:'Paper Trails Small Press Fest', cost:8, days:1, tables:[6,8], kind:'comic'}, rcon:{n:'Northfall Comic Con', cost:55, days:2, tables:[12,16], kind:'comic'},
  bcon:{n:'Harbor City Comic Expo', cost:260, days:3, tables:[18,24], kind:'comic'}, ccon:{n:'Capital Comics Expo', cost:60, days:2, tables:[12,16], kind:'comic'},
  whse:{n:'Dealer warehouse sale', cost:15, days:1, tables:[1,1], kind:'both'}
};
function scheduleEvents(from, to){
  const H=G.hunt; const has=(ty,d)=>H.ev.some(e=>e.ty===ty && e.d===d);
  for (let t=Math.max(from, H.sched||from); t<=to; t++){
    const dw=dowOf(t), [m,dd]=mdOf(t); const add=(ty,o)=>{ if (has(ty,t)) return; const T=EV_T[ty]; if ((T.kind==='card' && !HCARD()) || (T.kind==='comic' && !HCOMIC())) return; H.ev.push(Object.assign({ id:H.nid++, ty, n:T.n, d:t, days:T.days, cost:T.cost, st:0, ann:t-42 }, o||{})); };
    if (dw===6){ const n=ri(1,3); for (let i=0;i<n;i++) add('garage',{n:'Garage sale on '+pick(GARAGE_STREETS), blurb:pick(GARAGE_BLURB), ann:t-ri(1,4), seed:ri(1,1e9), gi:i}); }
    if (dw===0) add('flea',{ann:t-60});
    if (dw===5 && R()<0.45) add('estate',{n:'Estate sale on '+pick(GARAGE_STREETS), ann:t-ri(5,9), seed:ri(1,1e9), blurb:pick(['the listing mentions "old comic books"','"sports memorabilia and trading cards" in the listing','a long-time collector\'s home, contents to go','furniture, tools, and "boxes from the basement"'])});
    if (dw===6 && dd<=7) add('lshow',{ann:t-35});
    if (dw===6 && dd>=15 && dd<=21 && [3,6,9,12].includes(m)) add('rshow',{ann:t-49});
    if (dw===5 && m===8 && dd>=7 && dd<=13) add('nshow',{ann:t-90});
    if (dw===4 && dd>=15 && dd<=21) add('meet',{ann:t-21});
    if (m===9 && dd===17) add('scon',{ann:t-60}); if (m===10 && dd===8) add('rcon',{ann:t-60}); if (m===7 && dd===23) add('bcon',{ann:t-75}); if (m===4 && dw===6 && dd<=7) add('ccon',{ann:t-60});
    if (dw===3 && R()<0.04) add('whse',{ann:t-ri(2,6), seed:ri(1,1e9)});
  }
  H.sched=to+1;
}
function evLive(ev){ return G.day>=ev.d && G.day<ev.d+ev.days; }
function evSellers(ev){ return G.hunt.sel.filter(s=>s.ev===ev.id || (ev.tb && ev.tb.includes(s.id))); }
function startEvent(ev){
  if (ev.st) return; ev.st=1; const T=EV_T[ev.ty]; const H=G.hunt;
  if (ev.ty==='garage'||ev.ty==='estate'){ const r=mkRng(ev.seed); withRng(r, ()=>makeHouseSale(ev)); return; }
  if (ev.ty==='whse'){ const d=pick(H.sel.filter(s=>s.dealer)); ev.tb=[d.id]; ev.n=d.n+' warehouse sale'; d.urg=Math.min(0.9,d.urg+0.3); stockSeller(d, ri(20,40)); addBox(d, ev, 1, 50); return; }
  const pool = H.sel.filter(s=>s.dealer && !s.temp && (T.kind==='both' || s.dealer===T.kind || s.dealer==='mixed'));
  const n=T.tables? ri(T.tables[0],T.tables[1]) : 0; const chosen=[]; const cand=pool.slice(); while (chosen.length<n && cand.length){ chosen.push(cand.splice(Math.floor(R()*cand.length),1)[0]); }
  if (ev.ty==='flea') chosen.push(...H.sel.filter(s=>s.flea));
  ev.tb=chosen.map(s=>s.id);
  for (const s of chosen){ if (s.inv.length<30) stockSeller(s, ri(6,14)); if (s.prof.box1) addBox(s, ev, 1, 40); if (s.prof.box5) addBox(s, ev, 5, 25); }
  // one-off sellers at flea markets and meetups
  if (ev.ty==='flea'||ev.ty==='meet'){ for (let i=0;i<(ev.ty==='flea'?ri(3,6):ri(1,3)); i++){ const s=newSeller(R()<0.7?'kid':'casual',{n:(ev.ty==='flea'?'Table ':'Swap table ')+(i+1), who:personName(), know:{card:rf(0,0.4),vcard:rf(0,0.4),comic:rf(0,0.4),ocomic:rf(0,0.4),sealed:0.3}, prof:{mixed:2,mod:1,comic:1}, temp:1, ev:ev.id}); s.junk=[pick(FLEA_JUNK),pick(FLEA_JUNK)]; stockSeller(s, ri(4,16)); if (R()<0.5) addBox(s,ev,1,ri(15,40)); } }
  // indie creators and signers
  if (HCOMIC() && (T.kind==='comic' || ev.ty==='nshow')){ ev.sign=[]; const cr=G.cm.cr.filter(c=>c.deb && !c.ret && (c.r==='W'||c.r==='A'||c.r==='WA'||c.r==='C'));
    const stars=cr.filter(c=>c.fame>1).sort(()=>R()-0.5).slice(0, ev.ty==='scon'?1:ri(2,4)); const indie=cr.filter(c=>c.fame<0.5 && c.works.some(id=>tierOf(S_(id))>=3 && S_(id).n)).sort(()=>R()-0.5).slice(0, ev.ty==='scon'?ri(4,7):ri(1,3));
    for (const c of stars) ev.sign.push({k:'cr', id:c.id, fee: Math.round(10+c.fame*15)});
    for (const c of indie){ ev.sign.push({k:'cr', id:c.id, fee:0, indie:1}); const s=newSeller('casual',{n:c.n+' (creator table)', who:c.n, know:{card:0,vcard:0,comic:1,ocomic:0.5,sealed:0}, prof:{}, temp:1, ev:ev.id}); s.cr=c.id; s.mg=1; s.minF=1;
      for (const sid of c.works.slice(-3)){ const x=S_(sid); if (!x.n || tierOf(x)<3) continue; for (let n=Math.max(1,x.n-3); n<=x.n; n++){ const cp=cmMakeCopy(mk(x.id,n,1,''), HSID(s.id), null, 'pre'); addEntry(s,{t:'m',id:cp.id}, cmD(cp.k).cp); } } }
  }
  if (HCARD() && (T.kind==='card' || ev.ty==='nshow')){ ev.sign=ev.sign||[]; const pl=G.players.filter(p=>p.tm!==-1 && (p.S>0.5 || p.tm===-2 && p.S>0.3)).sort(()=>R()-0.5).slice(0, ev.ty==='lshow'?1:ri(2,3)); const pr=G.players.filter(p=>p.tm===-1 && p.pot>=60).sort(()=>R()-0.5).slice(0, 1);
    for (const p of pl) ev.sign.push({k:'pl', id:p.id, fee:Math.round(15+p.S*60)}); for (const p of pr) ev.sign.push({k:'pl', id:p.id, fee:10}); }
}
function addBox(s, ev, price, n){
  const own=HSID(s.id); const est=x=>sellerEst(s,x);
  for (let i=0;i<n;i++){
    let e=null; for (let k=0;k<4 && !e;k++){ const card = !HCOMIC()? true : !HCARD()? false : s.dealer==='comic'? false : s.dealer==='card'? true : R()<0.5;
      const o = card? makeCard(randCardKey({old:R()<0.4, hit:R()<0.08}), own, null) : cmMakeCopy(randComicKey({}), own, null, 'bin');
      const x={t:card?'c':'m', id:o.id}; if (est(x) < price*1.2) e=x; else { if (card) delete G.cards[o.id]; else delete G.mc[o.id]; } }
    if (e){ e.bx=price; e.ev=ev.id; addEntry(s,e,price); }
  }
}
function makeHouseSale(ev){
  const estate=ev.ty==='estate'; const s=newSeller(estate?'estate':'kid',{n:ev.n, who:personName(), know:{card:rf(0,0.25),vcard:rf(0,0.25),comic:rf(0,0.2),ocomic:rf(0,0.3),sealed:0.3}, prof:{}, temp:1, ev:ev.id, urg:rf(0.3,0.8)});
  ev.tb=[s.id]; s.junk=[pick(FLEA_JUNK),pick(FLEA_JUNK),pick(FLEA_JUNK)];
  const r=R(); const own=HSID(s.id);
  if (!estate && r<0.45) return; // nothing collectible at all
  const era = estate? pick([1950,1960,1970,1980,1990]) : pick([1985,1990,1995,2005,2015]);
  const nComics = !HCOMIC()? 0 : estate? ri(0,1)? ri(10,60):0 : R()<0.5? ri(3,25):0; const nCards = !HCARD()? 0 : R()<(estate?0.5:0.6)? ri(5,estate?60:40):0;
  for (let i=0;i<nComics;i++){ let key; for (let k=0;k<10;k++){ key=randComicKey({}); const y=cmD(key).yr; if (Math.abs(y-era)<14) break; } const cp=cmMakeCopy(key, own, null, 'lot'); addEntry(s,{t:'m',id:cp.id}); }
  // a kid's shoebox is the leftovers of real packs
  if (nCards){ const prods=releasedProducts(); const prod=pick(prods); const packs=genSealed(prod, Object.keys(B(prod).formats).includes('pack')?'pack':Object.keys(B(prod).formats)[0], Math.floor(R()*2e9)); const keys=packs.flat();
    for (let i=0;i<Math.min(nCards,keys.length);i++){ const c=makeCard(keys[i], own, null); c.c=c.c.map(v=>Math.max(20, v-ri(4,22))); addEntry(s,{t:'c',id:c.id}); } }
  if (HCARD() && R()<(estate?0.2:0.06)){ const prod=pick(releasedProducts()); const x=makeSealed(prod.id, fmtOf(prod,'pack'), own, null); addEntry(s,{t:'s',id:x.id}); }
  // flat pricing: most house sales price by the box
  if (R()<0.6){ const flat = pick([0.25,0.5,1,1,2]); for (const e of s.inv){ if (e.t!=='s') { e.p=flat; e.bx=flat; } } }
}
function endEvent(ev){
  ev.st=2; const H=G.hunt;
  for (const s of evSellers(ev)){
    if (s.temp){ // leftovers: most go back to the house or the bin; the good stuff finds a buyer eventually
      for (const e of s.inv.slice()){ const v=trueValue(e); if (v>8 && R()<0.6){ const n=pick(npcPool(e.t==='m'?{comic:1}:{})); giveTo(e,n.id,e.p,'bought',whereName(s)); } else delObj(e); }
      s.inv=[]; s.gone=1;
    } else { for (const e of s.inv.slice()) if (e.ev===ev.id){ delObj(e); removeEntry(s,e); } s.mood=0; }
  }
}
function delObj(e){ const o=objOf(e); if (!o || o.o>=0) return; if (e.t==='c') delete G.cards[e.id]; else if (e.t==='m') delete G.mc[e.id]; else delete G.sealed[e.id]; }
// ---- attending ----
function evCost(ev){ return ev.cost + (ev.days>1 && ev.cost>40 ? 0 : 0); }
function enterEvent(evId, late){
  const ev=G.hunt.ev.find(x=>x.id===evId); if (!ev || !evLive(ev)) return 'That event isn\'t on today.';
  if (!ev.paid){ if (G.player.cash<ev.cost) return 'Getting there costs '+money(ev.cost)+'.'; G.player.cash-=ev.cost; G.player.fees+=ev.cost; ev.paid=1; }
  startEvent(ev);
  const ss = G.hunt.sess;
  if (ss && ss.ev===evId && ss.day===G.day) return null;
  G.hunt.sess={ev:evId, day:G.day, clock: late?240:0, seen:[], dug:{}};
  if (late) evClock(240, true);
  return null;
}
function evClock(min, silent){
  const ss=G.hunt.sess; if (!ss) return; const ev=G.hunt.ev.find(x=>x.id===ss.ev);
  if (!silent) ss.clock=Math.min(480, ss.clock+min);
  const busy = {nshow:3, bcon:3, rshow:2, rcon:2, ccon:2}[ev.ty]||1;
  for (const s of evSellers(ev)) npcBrowse(s, poisson(min/60*1.6*busy*(ss.clock<120?1.6:1)));
  if (G.hunt.tbl && G.hunt.tbl.ev===ev.id) tableSales(min);
}
function leaveEvent(){ const ss=G.hunt.sess; if (!ss) return; const ev=G.hunt.ev.find(x=>x.id===ss.ev); if (ss.clock<480) evClock(480-ss.clock); G.hunt.sess=null; }
// ---- player's own table ----
function rentTable(evId, items, pct){
  const ev=G.hunt.ev.find(x=>x.id===evId); const fee = ev.ty==='nshow'||ev.ty==='bcon'?250: ev.ty==='rshow'||ev.ty==='rcon'||ev.ty==='ccon'?90: 30;
  if (G.player.cash<fee) return 'A table costs '+money(fee)+'.';
  G.player.cash-=fee; G.player.fees+=fee;
  G.hunt.tbl={ ev:evId, fee, items: items.map(e=>{ const it=huntItem(e); return {t:e.t, id:e.id, p:nicePrice(Math.max(1,it.v*pct))}; }), sold:[] };
  return null;
}
function tableSales(min){
  const T=G.hunt.tbl; if (!T) return;
  for (const x of T.items.slice()){ const o=objOf(x); if (!o || o.o!==0){ T.items=T.items.filter(y=>y!==x); continue; }
    const it=huntItem(x); const lam = min/60*0.35*(it.v>=x.p?1.4:it.v>=x.p*0.85?0.5:0.1);
    if (R() < 1-Math.exp(-lam)){ const n=pick(npcPool(x.t==='m'?{comic:1}:{})); let pr=x.p; const val=npcValuation(n,it); if (val<pr*0.92) continue; if (val<pr) pr=nicePrice(Math.max(val, pr*0.9));
      if (n.cash<pr) continue; n.cash-=pr; G.player.cash+=pr; G.player.sold+=pr; giveTo(x,n.id,pr,'bought','your table'); if (x.t!=='s') (o.h=o.h||[]).push([G.day,'Sold at your table',pr,n.h]);
      T.sold.push([x.t,x.id,pr,n.h]); T.items=T.items.filter(y=>y!==x); toast('Sold at your table: '+huntLabel(x)+' for '+money(pr,true), true); }
  }
}
// ---- signings ----
function cardSigMult(c){ const sg=c.sg; if (!sg) return 1; const p=P(sg.pid); const d=D(c.k); return 1 + Math.min(2.2, 0.8*Math.max(0,p.S||0)*(d.rc||d.first?1.6:1)); }
function signItem(evId, si, t, id){
  const ev=G.hunt.ev.find(x=>x.id===evId); const sg=ev.sign[si]; if (!sg) return 'They\'ve packed up.';
  if (G.player.cash<sg.fee) return 'The signing fee is '+money(sg.fee)+'.';
  if (t==='m'){ const cp=G.mc[id]; if (!cp || cp.o!==0 || cp.l || cp.g!==0 || cp.sg) return 'That comic can\'t be signed.'; cp.sg={c:sg.id, s:'w', real:1, ev:ev.n, d:G.day}; (cp.h=cp.h||[]).push([G.day,'Signed in person by '+CR_(sg.id).n+' at '+ev.n,sg.fee,'']); }
  else { const c=G.cards[id]; if (!c || c.o!==0 || c.l || c.g!==0 || c.sg || D(c.k).auto) return 'That card can\'t be signed.'; c.sg={pid:sg.id, s:'w', ev:ev.n, d:G.day}; (c.h=c.h||[]).push([G.day,'Signed in person by '+pname(P(sg.id))+' at '+ev.n,sg.fee,'']); }
  G.player.cash-=sg.fee; G.player.fees+=sg.fee; if (G.hunt.sess) evClock(20); return null;
}
// ---- private collections ----
function makePrivate(fromDealer){
  const H=G.hunt; const type = fromDealer? 'dealer' : pick((HCARD()&&HCOMIC())? ['team','child','horror','indie','oldread','dealer','inherit','team','child','indie'] : HCARD()? ['team','child','dealer','inherit','team','child'] : ['horror','indie','oldread','dealer','inherit','indie']);
  const kind = type==='dealer'?'liq': type==='child'||type==='inherit'?'kid':'priv';
  const know = type==='dealer'? {card:0.8,vcard:0.7,comic:0.75,ocomic:0.7,sealed:0.8} : type==='child'||type==='inherit'? {card:0.1,vcard:0.1,comic:0.1,ocomic:0.15,sealed:0.3} : {card:0.55,vcard:0.5,comic:0.6,ocomic:0.5,sealed:0.6};
  const tm=ri(0,TEAMS_DEF.length-1);
  const s=newSeller(kind,{n:'', who:personName(), know, prof:{}, temp:1, urg:rf(0.1,0.8)}); const own=HSID(s.id);
  s.n = {team:teamName(tm)+' collection', child:'Childhood card collection', horror:'Horror comics collection', indie:'Indie comics collection', oldread:'Old reader copies', dealer:'Dealer inventory lot', inherit:'Inherited collection'}[type];
  s.story = pick(PV_STORIES[type]).replace('{team}', teamName(tm));
  const add=(t,o)=>{ if (o){ o.o=own; s.inv.push({t, id:o.id, d:G.day}); } };
  if (type==='team'){ for (let i=0;i<ri(60,180);i++){ const o=takeNpc('c', c=>P(D(c.k).pid).tm===tm) || makeCard(randCardKey({}),own,null); add('c',o); } for (let i=0;i<ri(0,2);i++){ const prod=pick(releasedProducts()); add('s', makeSealed(prod.id,pick(Object.keys(B(prod).formats)),own,null)); } }
  else if (type==='child'){ const prods=releasedProducts().filter(p=>yearOf(G.day)-p.yr>=2); for (let b=0;b<ri(4,14);b++){ const prod=pick(prods.length?prods:releasedProducts()); const packs=genSealed(prod,Object.keys(B(prod).formats)[0],Math.floor(R()*2e9)); for (const k of packs.flat()){ const c=makeCard(k,own,null); c.c=c.c.map(v=>Math.max(20,v-ri(0,18))); add('c',c); } } }
  else if (type==='horror'){ const runs=G.cm.ser.filter(x=>x.g===GI.horror && x.n>=10); const run=runs.length?pick(runs):pick(G.cm.ser.filter(x=>x.n>=10)); for (let n=1;n<=Math.min(run.n,80);n++) if (R()<0.85) add('m', cmMakeCopy(mk(run.id,n,1,''),own,null,'lot')); for (let i=0;i<ri(30,90);i++) add('m', cmMakeCopy(randComicKey({horror:1}),own,null,'lot')); s.run=run.id; }
  else if (type==='indie'){ const runs=G.cm.ser.filter(x=>tierOf(x)>=2 && x.n>=4 && yearOf(x.st)>=2005).sort(()=>R()-0.5).slice(0,ri(4,9)); for (const x of runs) for (let n=1;n<=Math.min(x.n,30);n++) if (R()<0.7){ const cp=cmMakeCopy(mk(x.id,n,1,R()<0.08&&x.v[n]?x.v[n].split(',')[0]:''),own,null,'npc'); if (n===1 && R()<0.15) cp.sg={c:x.w, s:'u', real:R()<0.8?1:0}; add('m',cp); } }
  else if (type==='oldread'){ for (let i=0;i<ri(80,300);i++){ const cp=cmMakeCopy(randComicKey({old:1}),own,null,'lot'); cp.c=cp.c.map(v=>Math.max(5,v-ri(0,12))); add('m',cp); } }
  else if (type==='dealer'){ for (let i=0;i<ri(40,120);i++){ const cat=pick(['mod','slab','key','comic','pros','ocomic']); const e=acquireFor(s,cat); if (e) s.inv.push({t:e.t,id:e.id,d:G.day}); } }
  else { for (let i=0;i<ri(40,160);i++){ if (HCOMIC() && (!HCARD() || R()<0.5)){ const cp=cmMakeCopy(randComicKey({old:R()<0.6}),own,null,'lot'); add('m',cp); } else add('c', makeCard(randCardKey({old:1}),own,null)); } if (HCARD() && R()<0.3){ const prod=pick(releasedProducts()); add('s', makeSealed(prod.id,fmtOf(prod,'hobby'),own,null)); } }
  // what the seller believes it's worth: the highlights they know about, plus a bulk rate
  const ests=s.inv.map(e=>[e, sellerEst(s,e)]).sort((a,b)=>b[1]-a[1]);
  let perceived = 0; ests.forEach(([e,v],i)=>{ perceived += i<15 ? v*0.85 : Math.min(v,8)*0.55; });
  const ask = nicePrice(Math.max(40, perceived*rf(0.95,1.25)));
  const pv={ id:H.nid++, sid:s.id, type, ask, desired:nicePrice(ask*rf(0.85,0.95)), min:nicePrice(ask*rf(type==='dealer'?0.8:0.68, 0.86)), mode: type==='dealer'||type==='indie'||R()<0.25?'cherry':'all',
    samp: kind==='kid'?ri(25,60):ri(12,35), rev:[], hl: ests.slice(0,4).filter(x=>x[1]>4).map(x=>x[0].t+':'+x[0].id), exp:G.day+ri(6,14), made:G.day, mood:0, from:fromDealer||null };
  if (pv.mode==='cherry') for (const [e,v] of ests) e.p = Math.max(0.5, nicePrice(v*s.mg));
  H.pv.push(pv); return pv;
}
function pvSeller(pv){ return G.hunt.sel[pv.sid]; }
function pvReveal(pv, n){ const s=pvSeller(pv); const hidden=s.inv.map((e,i)=>i).filter(i=>!pv.rev.includes(i)); for (let k=0;k<n && pv.rev.length<pv.samp && hidden.length;k++){ pv.rev.push(hidden.splice(Math.floor(R()*hidden.length),1)[0]); } }
function pvOffer(pv, amt){
  if (pv.mood>=3) return {no:'The seller has stopped taking your calls.'};
  if (amt>=pv.desired) return {ok:1,price:amt};
  if (amt>=pv.min){ if (R()<0.4) return {ok:1,price:amt}; const c=nicePrice((amt+pv.desired)/2); pv.counter=c; return {counter:c, msg:`The seller comes back at ${money(c)}.`}; }
  if (amt<pv.min*0.65){ pv.mood++; return {no:'The seller thinks that\'s a lowball. "I\'ll wait for someone serious."'}; }
  const c=nicePrice(Math.max(pv.min*1.03,(amt+pv.ask)/2)); pv.counter=c; return {counter:c, msg:`"I could maybe do ${money(c)}."`};
}
function pvBuyAll(pv, price){
  const s=pvSeller(pv); if (G.player.cash<price) return 'You need '+money(price)+'.';
  G.player.cash-=price; G.player.bought+=price; const n=s.inv.length; const where=s.n+' ('+s.who+')';
  const ids=[]; for (const e of s.inv.slice()){ giveTo(e,0,Math.round(price/n*100)/100,'lot',where); ids.push(e.t+':'+e.id); G.hunt.found.unshift([G.day,e.t,e.id,price/n,where,trueValue(e)]); }
  G.hunt.found.length=Math.min(G.hunt.found.length,80);
  s.inv=[]; s.gone=1; G.hunt.pv=G.hunt.pv.filter(x=>x!==pv); G.player.lastLot={t:G.day, kn:s.n, ids, price};
  return null;
}
function expirePrivate(pv){ const s=pvSeller(pv); for (const e of s.inv.slice()){ const v=trueValue(e); if (v>5){ const n=pick(npcPool(e.t==='m'?{comic:1}:{})); giveTo(e,n.id,0,'bought',s.n); } else delObj(e); } s.inv=[]; s.gone=1; G.hunt.pv=G.hunt.pv.filter(x=>x!==pv); }
// ---- major auctions ----
function makeAuction(t){
  const H=G.hunt; const lots=[];
  const cards=!HCARD()? [] : Object.values(G.cards).filter(c=>c.o>0 && !c.l && c.g>=0).map(c=>['c',c,cardValue(c)]).filter(x=>x[2]>120).sort((a,b)=>b[2]-a[2]).slice(0,40);
  const comics=!HCOMIC()? [] : Object.values(G.mc).filter(c=>c.o>0 && !c.l && c.g>=0).map(c=>['m',c,cmCopyValue(c)]).filter(x=>x[2]>120).sort((a,b)=>b[2]-a[2]).slice(0,40);
  const pool=cards.concat(comics).sort(()=>R()-0.5).slice(0,ri(12,20));
  // a few grails come out of long-held collections
  if (HCOMIC()) for (let i=0;i<2;i++){ const s=pick(G.cm.ser.filter(x=>x.n && x.heat+x.spec>2)); if (!s) break; const cp=cmMakeCopy(mk(s.id,1,1,''), 0, null, 'npc'); cp.c=cp.c.map(v=>Math.min(100,v+ri(8,20))); cmGradeCopy(cp); const n=pick(npcPool({comic:1})); cp.o=n.id; pool.push(['m',cp,cmCopyValue(cp)]); }
  for (const [ty,o,v] of pool){ lots.push({ n:lots.length+1, t:ty, id:o.id, from:o.o, est:[nicePrice(v*0.75), nicePrice(v*1.3)], res:nicePrice(v*0.6), mx:0, res2:null }); o.o=-900; }
  const a={ id:H.nid++, n:AUCTION_HOUSE+' '+['Spring','Summer','Fall','Winter'][Math.floor((mdOf(t)[0]-1)/3)]+' Signature Auction', ann:t-35, d:t, lots, done:0 };
  H.auc.push(a); return a;
}
function closeAuction(a){
  a.done=1; const bidders=G.npcs.filter(n=>['high','dealer','cgold','cslab','ckey','cdlr','pc','auto','vintage','cfa','cadp'].includes(n.ty) || n.cash>4000);
  for (const L_ of a.lots){ const e={t:L_.t,id:L_.id}; const o=objOf(e); if (!o) continue; const it=huntItem(e);
    const vals=bidders.map(n=>[n, Math.min(n.cash, npcValuation(n,it)*rf(0.9,1.15))]).sort((x,y)=>y[1]-x[1]);
    const top=vals[0], second=vals[1]; const pl=L_.mx||0;
    let win=null, price=0;
    if (pl>0 && pl>=top[1] && pl>=L_.res){ win=0; price=Math.max(L_.res, Math.min(pl, top[1]+bidInc(top[1]))); }
    else if (top[1]>=L_.res){ win=top[0]; price=Math.max(L_.res, Math.min(top[1], Math.max(second[1], pl)+bidInc(Math.max(second[1],pl)))); }
    price=Math.round(price*100)/100; const prem=Math.round(price*0.15*100)/100;
    const from=NPC(L_.from);
    if (win===null){ o.o=L_.from; L_.res2={unsold:1}; continue; }
    if (win===0){ if (G.player.cash<price+prem){ o.o=L_.from; L_.res2={unsold:1, pnc:1}; toast('You couldn\'t cover lot '+L_.n+'. It went unsold.'); continue; } G.player.cash-=price+prem; G.player.bought+=price+prem; o.o=0; o.a=[G.day,'won',price+prem,AUCTION_HOUSE]; if (L_.t!=='s') (o.h=o.h||[]).push([G.day,'Won at '+a.n,price+prem,'']); o.nw=1; toast('You won lot '+L_.n+' at '+AUCTION_HOUSE+': '+money(price+prem,true)+' with premium', true); }
    else { win.cash-=price+prem; o.o=win.id; giveTo(e, win.id, price, 'bought', AUCTION_HOUSE); }
    if (from) from.cash+=price*0.9;
    L_.res2={p:price, w: win===0?'You':win.h};
    recordSale(it.key, price+prem, (L_.t==='c'?(o.g>0?o.g:0):(o.g>0?o.g:0)), win===0?0:win.id, L_.from);
  }
  addNews(`${AUCTION_HOUSE.toUpperCase()} SALE REALIZES ${money(a.lots.reduce((s,l)=>s+(l.res2&&l.res2.p||0),0)).toUpperCase()}`, `Top lot: ${(()=>{ const b=a.lots.filter(l=>l.res2&&l.res2.p).sort((x,y)=>y.res2.p-x.res2.p)[0]; return b? huntLabel({t:b.t,id:b.id})+' at '+money(b.res2.p) : 'nothing sold'; })()}.`, null, 'hobby');
}
// ---- want list ----
function wantHas(w){ return G.hunt.want.some(x=>x.t===w.t && x.id===w.id); }
function wantToggle(w){ const i=G.hunt.want.findIndex(x=>x.t===w.t && x.id===w.id); if (i>=0) G.hunt.want.splice(i,1); else G.hunt.want.push(w); }
function wantMatch(e){
  const o=objOf(e); if (!o || e.t==='s') return false; const W=G.hunt.want; if (!W.length) return false;
  if (e.t==='c'){ const d=D(o.k); return W.some(w=>(w.t==='p'&&w.id===d.pid)||(w.t==='k'&&w.id===o.k)||(w.t==='pr'&&w.id===d.prod.id)); }
  const d=cmD(o.k); const s=d.s; return W.some(w=>(w.t==='s'&&w.id===s.id)||(w.t==='i'&&(w.id===o.k||w.id===mk(s.id,d.n,1,'')))||(w.t==='cr'&&(s.w===w.id||s.a===w.id||s.cv===w.id)));
}
// ---- the daily tick ----
function huntDay(t){
  if (!G.hunt) return;
  const H=G.hunt; if (!H) return;
  if (H.sess && H.sess.day!==t) leaveEvent();
  // shops: customers browse, dealers restock and reprice
  for (const s of H.sel){ if (s.gone) continue;
    if (s.shop) npcBrowse(s, poisson(s.kind==='pro'?5:2.5));
    else if (s.flea || (s.dealer && R()<0.3)) npcBrowse(s, poisson(0.6));
    if (dowOf(t)===1 && !s.temp){ const target = s.shop? 50 : s.flea? 32 : 40; if (s.inv.length<target) stockSeller(s, Math.min(8, target-s.inv.length)); for (const e of s.inv){ if (e.bx) continue; if (t-e.d>28 && R()<0.25) e.p=Math.max(0.5,nicePrice(e.p*0.9)); else if (R()<0.15) e.p=priceFor(s,e); }
      // stale stock goes to a dealer who will auction it online
      for (const e of s.inv.slice()){ if (!e.bx && t-e.d>120 && R()<0.3){ const n=pick(G.npcs.filter(x=>x.ty==='dealer'||x.ty==='cdlr')); giveTo(e,n.id,e.p*0.7,'bought',s.n); removeEntry(s,e); } }
      s.mood=0; if (s.cash<500) s.cash+=ri(300,900); }
  }
  // events
  for (const ev of H.ev){ if (!ev.st && ev.d===t) startEvent(ev); if (ev.st===1 && t>=ev.d+ev.days) endEvent(ev); }
  H.ev = H.ev.filter(ev=>ev.d+ev.days>t-21);
  H.sel.forEach(s=>{ if (s.gone && s.inv.length===0){ s.inv=[]; } });
  if (dowOf(t)===1) scheduleEvents(t, t+70);
  // private collections
  for (const pv of H.pv.slice()) if (t>pv.exp) expirePrivate(pv);
  if (H.pv.length<3 && R()<0.14) makePrivate();
  const friend = H.sel.find(s=>s.shop && s.rel>=5 && R()<0.01); if (friend && H.pv.length<4){ const pv=makePrivate(friend.id); pv.samp+=20; toast(`${friend.who} from ${friend.n} called: they're sitting on a dealer lot and wanted you to have first look.`, true); }
  // major auctions, quarterly
  if (!H.auc.some(a=>!a.done) && [2,5,8,11].includes(mdOf(t)[0]) && mdOf(t)[1]===1) makeAuction(t+35);
  for (const a of H.auc) if (!a.done && t>=a.d) closeAuction(a);
  H.auc=H.auc.filter(a=>!a.done || a.d>t-60);
  if (H.tbl){ const ev=H.ev.find(x=>x.id===H.tbl.ev); if (!ev || t>=ev.d+ev.days){ H.tbl=null; } else if (evLive(ev) && (!H.sess || H.sess.ev!==ev.id)) tableSales(240); }
  // prune the dead temporary sellers occasionally, keeping ids stable
  if (t%30===0) for (const s of H.sel) if (s.gone && s.inv.length===0){ s.junk=null; s.story=null; }
}
function huntNormalize(){ const H=G.hunt; if (!H) return; H.want=H.want||[]; H.found=H.found||[]; H.pv=H.pv||[]; H.auc=H.auc||[]; if (H.sess && H.sess.day!==G.day) H.sess=null; }
