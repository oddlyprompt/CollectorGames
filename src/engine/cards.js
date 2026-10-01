// ===================== COLLECTIBLE CATEGORIES =====================
// Category registry: each collectible industry plugs in its own subject database,
// product families, design templates and demand model. Phase 1 registers baseball only.
const CATEGORIES = {
  baseball: {
    label: 'Baseball cards',
    subjectName: p => pname(p),
    subjectDemand: p => playerScore(p),
    gradeScale: 10,
  }
};

// Product families (brand lines). Odds are "1 in N packs" at hobby; retail formats use retailMult.
const BRANDS = {
  DIA: { name:'Diamond Baseball', short:'Diamond', prestige:1.0, rel:[2,19], base:320, rc:40, tmpl:'dia', blurb:'The flagship. Big checklist, deep parallel rainbow, the rookie card most collectors think of first.',
    formats:{ pack:{price:6,cards:10,packs:1,retail:1}, blaster:{price:32,cards:10,packs:7,retail:1}, hobby:{price:140,cards:10,packs:24,g:{auto:1,num:1}} },
    par:[{id:'sil',n:'Silver',odds:8,fin:'foil',col:'#b9c1c9'},{id:'blu',n:'Blue',run:199,odds:45,fin:'color',col:'#2459b8'},{id:'pur',n:'Purple',run:99,odds:90,fin:'color',col:'#6a3fa0'},{id:'gld',n:'Gold',run:50,odds:180,fin:'color',col:'#c9a227'},{id:'org',n:'Orange',run:25,odds:360,fin:'color',col:'#e0761c'},{id:'red',n:'Red',run:10,odds:900,fin:'color',col:'#c0282d'},{id:'blk',n:'Black',run:5,odds:1800,fin:'color',col:'#151515'},{id:'sup',n:'Super',run:1,odds:9000,fin:'super',col:'#e8e2c0'}],
    ins:[{n:'Grand Slam Legends',size:15,odds:12,focus:'legends'},{n:'Future Stars',size:25,odds:6,focus:'rookies'},{n:'Power Surge',size:20,odds:10,focus:'power'}],
    auto:{n:'Diamond Autographs',odds:60,size:60,par:[{id:'ag',n:'Gold',run:50,share:0.14},{id:'ar',n:'Red',run:10,share:0.04},{id:'a1',n:'Super',run:1,share:0.006}]},
    relic:{n:'Game-Used Jersey',odds:48,size:40}, sp:{odds:64, ssp:600}, caseHit:{n:'Crown Jewels',size:15,odds:320} },
  NAT: { name:'National Series', short:'National', prestige:0.7, rel:[3,18], base:250, rc:25, tmpl:'nat', blurb:'Budget retail. Cheap rips, bright borders, long odds on anything big.',
    formats:{ pack:{price:4,cards:10,packs:1,retail:1}, blaster:{price:20,cards:10,packs:7,retail:1} },
    par:[{id:'sil',n:'Silver',odds:6,fin:'foil',col:'#b9c1c9'},{id:'grn',n:'Green',run:150,odds:70,fin:'color',col:'#23865a'},{id:'red',n:'Red',run:25,odds:450,fin:'color',col:'#c0282d'},{id:'plt',n:'Printing Plate',run:1,odds:7000,fin:'plate',col:'#1f6fb2'}],
    ins:[{n:'Hometown Heroes',size:20,odds:6,focus:'stars'},{n:'Rookie Rush',size:15,odds:8,focus:'rookies'}],
    auto:{n:'National Signatures',odds:420,size:30,par:[]}, relic:{n:'Stadium Swatches',odds:260,size:20}, sp:null, caseHit:null },
  HER: { name:'Heritage Club', short:'Heritage', prestige:0.9, rel:[4,8], base:300, rc:30, tmpl:'her', hiSP:50, blurb:'Retro card stock and a painted look. Collectors chase the short-printed high numbers to finish the set.',
    formats:{ pack:{price:5,cards:9,packs:1,retail:1}, blaster:{price:28,cards:9,packs:8,retail:1}, hobby:{price:100,cards:9,packs:24,g:{auto:1}} },
    par:[{id:'thr',n:'Throwback Stock',odds:14,fin:'stock',col:'#d9c9a3'},{id:'flp',n:'Flip Stock',run:76,odds:130,fin:'stock',col:'#b98c4a'}],
    ins:[{n:'Clubhouse Classics',size:15,odds:12,focus:'legends'},{n:'Box Score',size:20,odds:8,focus:'stars'}],
    auto:{n:'Real Ink',odds:96,size:50,par:[{id:'ar',n:'Red Ink',run:76,share:0.15}]}, relic:{n:'Clubhouse Relics',odds:48,size:30}, sp:null, caseHit:null },
  SPR: { name:'Summit Prospects', short:'Summit', prestige:1.15, rel:[5,13], base:250, pros:150, rc:20, tmpl:'spr', blurb:'Prospect-first. The earliest cards of tomorrow\'s names, and autographs of players who haven\'t debuted yet.',
    formats:{ pack:{price:7,cards:8,packs:1,retail:1}, hobby:{price:150,cards:8,packs:20,g:{auto:2}} },
    par:[{id:'rf',n:'Refractor',odds:4,fin:'refr',col:'#cfd8e3'},{id:'sky',n:'Sky Refractor',run:250,odds:32,fin:'refr',col:'#57a8e0'},{id:'grn',n:'Green Refractor',run:99,odds:80,fin:'refr',col:'#2f9a5d'},{id:'gld',n:'Gold Refractor',run:50,odds:160,fin:'refr',col:'#d4a72c'},{id:'org',n:'Orange Refractor',run:25,odds:320,fin:'refr',col:'#ea7a1c'},{id:'red',n:'Red Refractor',run:5,odds:1600,fin:'refr',col:'#cf2a2a'},{id:'sup',n:'Superfractor',run:1,odds:8000,fin:'super',col:'#e8e2c0'}],
    ins:[{n:'Summit Climbers',size:25,odds:6,focus:'prospects'},{n:'Pinnacle',size:15,odds:15,focus:'stars'}],
    auto:{n:'Prospect Autographs',odds:16,size:80,focus:'prospects',par:[{id:'arf',n:'Refractor',run:499,share:0.25},{id:'ag',n:'Gold Refractor',run:50,share:0.08},{id:'ao',n:'Orange Refractor',run:25,share:0.04},{id:'ar',n:'Red Refractor',run:5,share:0.01},{id:'a1',n:'Superfractor',run:1,share:0.003}]},
    relic:null, sp:null, caseHit:{n:'Peak Performers',size:12,odds:300} },
  VEL: { name:'Velocity Chrome', short:'Velocity', prestige:1.3, rel:[6,24], base:220, rc:35, tmpl:'vel', blurb:'Chrome stock and a refractor for every colour. Rookie autographs are the chase.',
    formats:{ pack:{price:7,cards:4,packs:1,retail:1}, blaster:{price:28,cards:4,packs:6,retail:1}, hobby:{price:190,cards:4,packs:24,g:{auto:2}} },
    par:[{id:'rf',n:'Refractor',odds:3,fin:'refr',col:'#cfd8e3'},{id:'sky',n:'Sky Refractor',run:250,odds:40,fin:'refr',col:'#57a8e0'},{id:'aqu',n:'Aqua Refractor',run:150,odds:65,fin:'refr',col:'#1fb5ad'},{id:'blu',n:'Blue Refractor',run:99,odds:100,fin:'refr',col:'#2459b8'},{id:'gld',n:'Gold Refractor',run:50,odds:200,fin:'refr',col:'#d4a72c'},{id:'org',n:'Orange Refractor',run:25,odds:400,fin:'refr',col:'#ea7a1c'},{id:'red',n:'Red Refractor',run:5,odds:2000,fin:'refr',col:'#cf2a2a'},{id:'sup',n:'Superfractor',run:1,odds:10000,fin:'super',col:'#e8e2c0'}],
    ins:[{n:'Launch Angle',size:20,odds:8,focus:'power'},{n:'Next Up',size:25,odds:6,focus:'rookies'}],
    auto:{n:'Chrome Rookie Autographs',odds:40,size:50,focus:'rookies',par:[{id:'arf',n:'Refractor',run:499,share:0.3},{id:'ag',n:'Gold Refractor',run:50,share:0.1},{id:'ao',n:'Orange Refractor',run:25,share:0.05},{id:'ar',n:'Red Refractor',run:5,share:0.012},{id:'a1',n:'Superfractor',run:1,share:0.003}]},
    relic:null, sp:{odds:120, ssp:900}, caseHit:{n:'Velocity Vortex',size:15,odds:288} },
  LUX: { name:'Summit Luxe', short:'Luxe', prestige:1.6, rel:[9,16], base:100, rc:30, tmpl:'lux', luxe:true, baseRun:199, autoRun:99, blurb:'One pack, six cards, all numbered. Three on-card autographs per box. Built for high-end collectors.',
    formats:{ hobby:{price:320,cards:6,packs:1,luxe:1} },
    par:[{id:'gld',n:'Gold',run:25,odds:6,fin:'color',col:'#c9a227'},{id:'sup',n:'Platinum',run:1,odds:200,fin:'super',col:'#e8e2c0'}],
    ins:[], auto:{n:'Luxe Signatures',odds:1,size:70,par:[{id:'ag',n:'Gold',run:25,share:0.18},{id:'ar',n:'Emerald',run:5,share:0.04},{id:'a1',n:'Platinum',run:1,share:0.008}]},
    relic:{n:'Luxe Patch',odds:1,size:30,run:99}, sp:null, caseHit:null },
  UPD: { name:'Diamond Update', short:'Update', prestige:0.95, rel:[10,21], base:200, rc:45, tmpl:'dia', update:true, blurb:'The flagship\'s second act: this season\'s call-ups, trades and All-Stars.',
    formats:{ pack:{price:6,cards:10,packs:1,retail:1}, blaster:{price:32,cards:10,packs:7,retail:1}, hobby:{price:125,cards:10,packs:24,g:{auto:1,num:1}} },
    par:[{id:'sil',n:'Silver',odds:8,fin:'foil',col:'#b9c1c9'},{id:'blu',n:'Blue',run:199,odds:45,fin:'color',col:'#2459b8'},{id:'gld',n:'Gold',run:50,odds:180,fin:'color',col:'#c9a227'},{id:'red',n:'Red',run:10,odds:900,fin:'color',col:'#c0282d'},{id:'blk',n:'Black',run:5,odds:1800,fin:'color',col:'#151515'},{id:'sup',n:'Super',run:1,odds:9000,fin:'super',col:'#e8e2c0'}],
    ins:[{n:'Rookie Debut',size:30,odds:5,focus:'rookies'},{n:'Midsummer Classic',size:20,odds:10,focus:'stars'}],
    auto:{n:'Update Autographs',odds:60,size:50,focus:'rookies',par:[{id:'ag',n:'Gold',run:50,share:0.14},{id:'a1',n:'Super',run:1,share:0.006}]},
    relic:{n:'Update Relics',odds:48,size:30}, sp:{odds:64, ssp:600}, caseHit:{n:'Crown Jewels',size:15,odds:320} }
};
const BRAND_ORDER = ['DIA','NAT','HER','SPR','VEL','LUX','UPD'];
const FMT_NAME = { pack:'Pack', blaster:'Blaster box', hobby:'Hobby box' };
const FMT_PL = { pack:'packs', blaster:'blaster boxes', hobby:'hobby boxes' };
const RETAIL_HIT_MULT = 2.4;

function B(prod){ return BRANDS[prod.b]; }
function prodName(prod){ return prod.yr+' '+B(prod).name; }

// ---- schedule & product creation ----
function scheduleYear(yr){
  for (const b of BRAND_ORDER){
    const br=BRANDS[b];
    const rel = dateToDay(yr, br.rel[0], br.rel[1]) + (yr===2026?0:ri(-6,6));
    const prod = { id:G.products.length, b, yr, rel, cat:'baseball', cl:null, stock:{}, oop:0, rs0:0 };
    G.products.push(prod);
  }
}
function prodById(id){ return G.products[id]; }
function releasedProducts(){ return G.products.filter(p=>p.cl); }

function genChecklist(prod){
  const br=B(prod), yr=prod.yr;
  const actives = G.players.filter(p=>p.tm>=0);
  const rcPool = (br.update ? G.players.filter(p=>p.dy===yr && (p.tm>=0 || p.dd)) : (G.rookieClass[yr]||[]).map(P)).sort((a,b)=>(b.pot+b.ab*0.3)-(a.pot+a.ab*0.3));
  const rcs = rcPool.slice(0, br.rc);
  const used = new Set(rcs.map(p=>p.id));
  let entries = rcs.map(p=>[p.id,1]);
  if (br.pros){
    const pros = G.players.filter(p=>p.tm===-1 && !used.has(p.id)).sort((a,b)=>(b.pot*0.8+b.ab*0.3)-(a.pot*0.8+a.ab*0.3)).slice(0, br.pros);
    pros.forEach(p=>{ used.add(p.id); entries.push([p.id,2]); });
  }
  const pool = actives.filter(p=>!used.has(p.id));
  const vetN = br.base - entries.length;
  const ws = pool.map(p=>{ const x=Math.max(0,p.ab-40)/50; return 0.25 + x*x*2 + p.pop; });
  let tot = ws.reduce((a,b)=>a+b,0);
  for (let i=0;i<vetN && tot>0;i++){ let x=R()*tot, j=0; for (; j<ws.length; j++){ x-=ws[j]; if (x<=0 && ws[j]>0) break; } if (j>=ws.length) j=ws.findIndex(v=>v>0); entries.push([pool[j].id,0]); tot-=ws[j]; ws[j]=0; }
  shuffle(entries);
  if (br.hiSP){ // high-number short prints: put some stars/rookies at the end
    const hi = entries.splice(entries.length-br.hiSP, br.hiSP); hi.forEach(e=>e[1]|=4); entries=entries.concat(hi);
  }
  const sc={}; const sOf=p=> sc[p.id]!=null? sc[p.id] : (sc[p.id]=playerScore(p)); const byS = (arr)=>arr.slice().sort((a,b)=>sOf(b)-sOf(a));
  const listFor = (focus, size)=>{
    let src;
    if (focus==='legends') src = byS(G.players.filter(p=>p.tm===-2 && p.war>35));
    else if (focus==='rookies') src = rcs.length? rcs.slice() : byS(actives).slice(0,size);
    else if (focus==='prospects') src = entries.filter(e=>e[1]&2).map(e=>P(e[0]));
    else if (focus==='power') src = actives.filter(p=>!isPitcher(p)).sort((a,b)=>(b.ab*(0.5+b.pw))-(a.ab*(0.5+a.pw)));
    else src = byS(actives);
    return src.slice(0, Math.round(size*1.4)).sort(()=>R()-0.5).slice(0,size).map(p=>p.id);
  };
  const cl = { base: entries, ins: br.ins.map(x=>listFor(x.focus, x.size)) };
  if (br.auto){ const size=br.auto.size; const f=br.auto.focus;
    let pool2;
    if (f==='prospects') pool2 = entries.filter(e=>e[1]&2).map(e=>e[0]).slice(0,Math.round(size*0.7)).concat(rcs.slice(0,Math.round(size*0.3)).map(p=>p.id));
    else if (f==='rookies') pool2 = rcs.map(p=>p.id).concat(byS(actives).filter(p=>ageOf(p)<=26).slice(0,size).map(p=>p.id));
    else pool2 = rcs.slice(0,Math.round(size*0.45)).map(p=>p.id).concat(actives.filter(p=>!used.has(p.id)).sort(()=>R()-0.5).slice(0,Math.round(size*0.35)).map(p=>p.id)).concat(byS(actives).slice(0,Math.round(size*0.4)).map(p=>p.id));
    cl.auto = Array.from(new Set(pool2)).slice(0,size);
    cl.autoRc = cl.auto.map(id=>rcs.some(p=>p.id===id)?1:(entries.some(e=>e[0]===id && e[1]&2)?2:0));
  }
  if (br.relic) cl.relic = byS(actives).slice(0, br.relic.size*2).sort(()=>R()-0.5).slice(0,br.relic.size).map(p=>p.id);
  if (br.sp) cl.sp = byS(actives).slice(0,30).map(p=>p.id).concat(rcs.slice(0,10).map(p=>p.id));
  if (br.caseHit) cl.caseHit = byS(actives).slice(0,10).map(p=>p.id).concat(byS(G.players.filter(p=>p.tm===-2)).slice(0,br.caseHit.size-10).map(p=>p.id));
  prod.cl = cl;
  prod.rs0 = rookieIndex(prod) || 0.3;
  const retailDays = 110;
  prod.stock = {}; for (const f in br.formats) prod.stock[f] = f==='hobby'? ri(30,60) : ri(80,160);
  prod.retailEnd = prod.rel + retailDays;
}
function rookieIndex(prod){
  if (!prod.cl) return 0;
  const rcs = prod.cl.base.filter(e=>e[1]&3).map(e=>playerScore(P(e[0]))).sort((a,b)=>b-a).slice(0,6);
  if (!rcs.length) return 0.3;
  return rcs.reduce((a,b)=>a+b,0)/rcs.length;
}

// ---- design keys ----
// key = prodId|sec|no|par   sec: b base, v SP variation, w SSP variation, i0.. inserts, a auto, r relic, c case hit
const DCACHE = new Map();
function dk(prod, sec, no, par){ return prod.id+'|'+sec+'|'+no+'|'+(par||''); }
function D(key){
  let d = DCACHE.get(key); if (d) return d;
  const [pi, sec, noS, par] = key.split('|'); const prod=G.products[+pi]; const br=B(prod); const no=+noS;
  let pid, flags=0, setName, run=0, parObj=null, typeLbl, cardNo;
  if (sec==='b'||sec==='v'||sec==='w'){ const e=prod.cl.base[no]; pid=e[0]; flags=e[1]; setName='Base'; cardNo=String(no+1); if(sec!=='b'){ typeLbl = sec==='v'?'SP Variation':'SSP Variation'; setName='Base'; } }
  else if (sec[0]==='i'){ const ii=+sec.slice(1); pid=prod.cl.ins[ii][no]; setName=br.ins[ii].n; cardNo=br.ins[ii].n.split(' ').map(w=>w[0]).join('')+'-'+(no+1); }
  else if (sec==='a'){ pid=prod.cl.auto[no]; flags=prod.cl.autoRc[no]; setName=br.auto.n; cardNo=(br.short[0]+'A')+'-'+(no+1); if (br.autoRun) run=br.autoRun; }
  else if (sec==='r'){ pid=prod.cl.relic[no]; setName=br.relic.n; cardNo='GU-'+(no+1); if (br.relic.run) run=br.relic.run; }
  else if (sec==='c'){ pid=prod.cl.caseHit[no]; setName=br.caseHit.n; cardNo='CJ-'+(no+1); }
  if (sec==='b' && br.baseRun) run=br.baseRun;
  if (par){ parObj = (sec==='a' ? br.auto.par : br.par).find(x=>x.id===par); if (parObj && parObj.run) run=parObj.run; }
  d = { key, prod, sec, no, par, parObj, pid, flags, setName, run, cardNo,
    rc: !!(flags&1), first: !!(flags&2), hisp: !!(flags&4), auto: sec==='a', relic: sec==='r', ins: sec[0]==='i', caseHit: sec==='c', variation: sec==='v'||sec==='w' };
  d.title = designTitle(d);
  DCACHE.set(key, d); return d;
}
function designTitle(d){
  const parts=[];
  if (d.sec==='b') parts.push(d.parObj? d.parObj.n : 'Base');
  else if (d.variation) parts.push(d.sec==='v'?'SP Image Variation':'SSP Image Variation');
  else { parts.push(d.setName); if (d.parObj) parts.push(d.parObj.n); }
  return parts.join(' ');
}
function tags(d){
  const t=[];
  if (d.rc) t.push('RC'); if (d.first) t.push('1st'); if (d.auto) t.push('Auto'); if (d.relic) t.push('Relic');
  if (d.run) t.push('/'+d.run); else if (d.parObj) t.push('Parallel');
  if (d.ins) t.push('Insert'); if (d.variation) t.push(d.sec==='v'?'SP':'SSP'); if (d.hisp) t.push('SP'); if (d.caseHit) t.push('Case hit');
  return t;
}

// ---- pack generation ----
function randBaseNo(prod, excludeHi){ const n=prod.cl.base.length; const br=B(prod); const lim = (br.hiSP && excludeHi)? n-br.hiSP : n; return Math.floor(R()*lim); }
function pickAutoPar(prod){ const ps=B(prod).auto.par; let x=R(); for (const p of ps.slice().sort((a,b)=>a.share-b.share)){ if (x<p.share) return p.id; x-=p.share; } return ''; }
function genPack(prod, fmt){
  const br=B(prod), f=br.formats[fmt]; const m = f.retail? RETAIL_HIT_MULT : 1;
  const keys=[];
  if (br.luxe){
    for (let i=0;i<3;i++) keys.push(dk(prod,'a',Math.floor(R()*prod.cl.auto.length), pickAutoPar(prod)));
    keys.push(dk(prod,'r',Math.floor(R()*prod.cl.relic.length),''));
    for (let i=0;i<2;i++){ let par=''; for (const p of br.par) if (R()<1/p.odds) par=p.id; keys.push(dk(prod,'b',randBaseNo(prod),par)); }
    return keys;
  }
  const hits=[];
  for (const p of br.par) if (R() < 1/p.odds) hits.push(dk(prod,'b',randBaseNo(prod,false),p.id));
  br.ins.forEach((ins,ii)=>{ if (R()<1/ins.odds) hits.push(dk(prod,'i'+ii,Math.floor(R()*prod.cl.ins[ii].length),'')); });
  if (br.auto && R()<1/(br.auto.odds*m)) hits.push(dk(prod,'a',Math.floor(R()*prod.cl.auto.length),pickAutoPar(prod)));
  if (br.relic && R()<1/(br.relic.odds*m)) hits.push(dk(prod,'r',Math.floor(R()*prod.cl.relic.length),''));
  if (br.sp){ if (R()<1/br.sp.odds) hits.push(dk(prod,'v',spNo(prod),'')); if (R()<1/br.sp.ssp) hits.push(dk(prod,'w',spNo(prod),'')); }
  if (br.caseHit && R()<1/(br.caseHit.odds*m)) hits.push(dk(prod,'c',Math.floor(R()*prod.cl.caseHit.length),''));
  if (br.hiSP && R()<1/3) hits.push(dk(prod,'b',prod.cl.base.length-1-Math.floor(R()*br.hiSP),''));
  const nBase = Math.max(0, f.cards - hits.length);
  for (let i=0;i<nBase;i++) keys.push(dk(prod,'b',randBaseNo(prod,true),''));
  // hits go to the back of the pack
  return keys.concat(hits.slice(0,f.cards));
}
function spNo(prod){ const id=pick(prod.cl.sp); const i=prod.cl.base.findIndex(e=>e[0]===id); return i>=0?i:randBaseNo(prod,true); }
function isHitKey(k){ const d=D(k); return d.sec!=='b' || !!d.par || d.hisp; }
function isNumberedHit(k){ return D(k).run>0 && !B(D(k).prod).luxe; }
function genSealed(prod, fmt, seed){
  return withRng(mkRng(seed), ()=>{
    const f=B(prod).formats[fmt]; const packs=[];
    for (let i=0;i<f.packs;i++) packs.push(genPack(prod, fmt));
    if (f.g){ // box guarantees, implemented separately from pack odds
      const need = (test, n, make)=>{ let have=packs.flat().filter(test).length; let guard=0; while (have<n && guard++<50){ const pk=packs[ri(0,packs.length-1)]; const bi=pk.findIndex(k=>!isHitKey(k)); if (bi<0) continue; pk.splice(bi,1); pk.push(make()); have++; } };
      if (f.g.auto) need(k=>D(k).auto, f.g.auto, ()=>dk(prod,'a',Math.floor(R()*prod.cl.auto.length),pickAutoPar(prod)));
      if (f.g.num) need(k=>isNumberedHit(k), f.g.num, ()=>{ const nums=B(prod).par.filter(p=>p.run); const p=wpick(nums, x=>1/x.odds); return dk(prod,'b',randBaseNo(prod,false),p.id); });
    }
    return packs;
  });
}

// ---- physical instances ----
function allocSerial(key, run){
  const c = G.ser[key]||0; if (c>=run) return 0;
  const h = hashStr(key); let a = (h % (run>2?run-1:1)) + 1; while (gcd(a,run)!==1) a++;
  G.ser[key]=c+1; return ((a*c + (h>>>8)) % run) + 1;
}
function genCondition(prod){
  const chrome = /vel|spr|lux/.test(B(prod).tmpl);
  const sd = [chrome?9.5:8, 6, 5.5, chrome?7:5.5, 4.5];
  const c = sd.map(s=>Math.round(clamp(100 - Math.abs(gauss())*s, 30, 100)));
  if (R()<0.07){ const i=ri(0,4); c[i]=Math.round(c[i]-rf(12,40)); }
  if (R()<0.03){ const i=ri(0,4); c[i]=Math.round(c[i]-rf(8,20)); }
  return c.map(x=>clamp(x,20,100));
}
function makeCard(key, owner, acq, rng){
  const d=D(key);
  let serial=0;
  if (d.run){ serial = allocSerial(key, d.run); if (!serial){ // print run exhausted: fall back to the base version
    key = dk(d.prod, d.sec==='a'?'a':'b', d.no, ''); return makeCard(key, owner, acq, rng); } }
  const c = rng? withRng(rng, ()=>genCondition(d.prod)) : genCondition(d.prod);
  const id = G.nextCid++;
  const card = { id, k:key, s:serial, c, g:0, o:owner, a:acq };
  G.cards[id]=card; return card;
}
function C(id){ return G.cards[id]; }

// ---- grading ----
const GRADE_NAMES = {10:'GEM MT',9:'MINT',8:'NM-MT',7:'NM',6:'EX-MT',5:'EX',4:'VG-EX',3:'VG',2:'GOOD',1:'POOR'};
function gradeFrom(card){
  const c=card.c; const mn=Math.min(...c); const avg=c.reduce((a,b)=>a+b,0)/5;
  const noise = withRng(mkRng(card.id*7919+13+(card.gt||0)*104729), ()=>gauss()*1.4);
  const s = mn*0.55 + avg*0.45 + noise;
  return s>=95.3?10: s>=91.6?9: s>=87?8: s>=81?7: s>=72?6: s>=64?5: s>=55?4: s>=45?3: s>=35?2:1;
}
function popAdd(key, g){ fvClear(key); const a = G.pop[key] || (G.pop[key]=[0,0,0,0,0,0,0,0,0,0,0]); a[g]++; }
function popOf(key){ return G.pop[key] || [0,0,0,0,0,0,0,0,0,0,0]; }

// ---- demand & value ----
function prospectBonus(p){
  const age=ageOf(p); if (p.tm===-2 || age>26 || p.pot<=p.ab) return 0;
  return clamp((p.pot-56)/40,0,1)*0.45*(age<=23?1:(27-age)/4)*(p._bust?0.5:1);
}
function playerScore(p){
  const leg = clamp(p.war/110, 0, 1);
  let S;
  if (p.tm===-2){ const pop = p._faded?0: p.pop;
    S = leg*0.72 + pop*0.16 + p.hy + (p.aw.some(a=>a[1]==='HOH')?0.1:0); if (!p.dy || p._faded) S = p.hy*0.5 + 0.02; }
  else {
    const an = clamp((p.ab-45)/50, 0, 1.05);
    S = 0.7*an + 0.25*p.pop + 0.3*leg + prospectBonus(p) + p.hy + clamp(p.fm/60,-0.05,0.05);
    if (p.inj>40) S -= 0.05;
  }
  return clamp(S, -0.1, 1.55);
}
function playerBase(p){ return 0.05*Math.exp(4.6*(p.S!=null?p.S:playerScore(p))) * Math.exp(-(G.sat[p.id]||0)); }
function rcMult(p){ return 2.1 + 2.9*clamp(prospectBonus(p)/0.45,0,1) + (p.tm===-2 && p.war>50 ? 1 : 0); }
const PAR_M = r=> r>=250?3.4: r>=199?4: r>=150?5: r>=99?6: r>=76?7: r>=50?10: r>=25?18: r>=10?35: r>=5?60: 220;
const APAR_M = r=> r>=499?1.3: r>=99?1.6: r>=76?1.8: r>=50?2.1: r>=25?3: r>=10?5: r>=5?7.5: 16;
function designMult(d){
  const br=B(d.prod), p=P(d.pid); let m = br.prestige;
  const yrsOld = yearOf(G.day)-d.prod.yr;
  if (d.sec==='b'){
    if (d.rc) m*=rcMult(p); else if (d.first) m*=2.2*(1+clamp(prospectBonus(p)/0.45,0,1)); else m*=Math.pow(0.85, Math.min(3,yrsOld));
    if (d.hisp) m*=4;
    if (br.luxe) m*=5;
    if (d.parObj) m *= d.parObj.run ? PAR_M(d.parObj.run) : (d.parObj.fin==='refr'?1.8: d.parObj.fin==='stock'?1.7:1.4);
  } else if (d.variation){ m *= (d.sec==='v'?9:32) * (d.rc?1.8:1); }
  else if (d.ins){ const ins=br.ins[+d.sec.slice(1)]; m *= clamp(1+ins.odds/5,1.8,5); }
  else if (d.auto){ m *= 22 * (d.flags&1? rcMult(p)*0.8 : d.flags&2? 2.2+clamp(prospectBonus(p)/0.45,0,1)*3 : 1) * (br.autoRun?1.15:1); if (d.parObj) m*=APAR_M(d.parObj.run); }
  else if (d.relic){ m *= 3.5*(br.relic.run?2.5:1); }
  else if (d.caseHit){ m *= 45; }
  return m;
}
function designFloor(d){
  let f = 0.05;
  if (d.run) f = 1.5 + 55/Math.pow(d.run,0.85);
  if (d.parObj && !d.run) f = 0.2;
  if (d.variation) f = d.sec==='v'?2:8;
  if (d.hisp) f = 0.5;
  if (d.ins) f = 0.25;
  if (d.auto) f = Math.max(f, 3.5 + (d.run? 40/Math.pow(d.run,0.7):0));
  if (d.relic) f = Math.max(f, 2);
  if (d.caseHit) f = 10;
  return f;
}
function gradeMult(g, pop){
  if (!g) return 1;
  if (g===10){ const p10=pop[10]||0; return 2.6 * (1 + 0.7/(1+p10/2)); }
  return {9:1.35, 8:0.85, 7:0.62, 6:0.5, 5:0.42, 4:0.36, 3:0.32, 2:0.28, 1:0.25}[g];
}
const SLAB_FLOOR = {10:12,9:7,8:5,7:4,6:3,5:3,4:3,3:3,2:3,1:3};
const FV = new Map();
function fvClear(key){ if (!key){ FV.clear(); return; } for (let g=0; g<=10; g++) FV.delete(key+'#'+g); }
function fairValue(key, g){
  const ck=key+'#'+(g||0); const hit=FV.get(ck); if (hit!==undefined) return hit;
  const v=fairValue0(key,g); FV.set(ck,v); return v;
}
function fairValue0(key, g){
  const d=D(key); const p=P(d.pid);
  let v = Math.max(designFloor(d), playerBase(p)*designMult(d));
  v *= Math.exp(-(G.dp[key]||0));
  if (g>0) v = Math.max(v*gradeMult(g, popOf(key)), SLAB_FLOOR[g]);
  return v;
}
function visibleCondFactor(card){ const mn=Math.min(...card.c); return mn<55?0.55: mn<68?0.75: mn<78?0.9:1; }
function cardValue(card){ let v=fairValue(card.k, card.g>0?card.g:0); if (card.sg && typeof cardSigMult==='function') v*=cardSigMult(card); return card.g>0? v : v*visibleCondFactor(card); }

// ---- sealed product value ----
function sealedFair(prod, fmt){
  const price = B(prod).formats[fmt].price;
  const t=G.day;
  const inRetail = t < prod.retailEnd && t>=prod.rel;
  const now = rookieIndex(prod), then = prod.rs0||0.3;
  const hype = Math.exp((now-then)*2.2);
  let f;
  if (inRetail) f = (prod.stock[fmt]<=0 ? 1.15 : 1.0) * clamp(Math.pow(hype,0.4),0.85,1.4);
  else { const yrs=(t-prod.retailEnd)/365; f = (1.12 + yrs*0.14) * clamp(hype,0.45,6); }
  const k='S|'+prod.id+'|'+fmt; f *= Math.exp(-(G.dp[k]||0));
  return price*f;
}
function sealedKey(prod, fmt){ return 'S|'+prod.id+'|'+fmt; }

// ---- estimate ranges shown to the player ----
function salesFor(key, g){ return (G.sales[key]||[]).filter(s=>(g==null) || (s[2]||0)===(g||0)); }
function estRange(key, g, rawCard){
  const isSealed = key[0]==='S';
  let fv = isSealed ? sealedFair(G.products[+key.split('|')[1]], key.split('|')[2]) : fairValue(key, g||0);
  if (rawCard && !(g>0)) fv *= visibleCondFactor(rawCard);
  const recent = salesFor(key, isSealed?null:(g||0)).filter(s=>s[0]>G.day-120);
  const n = recent.length;
  const center = n ? 0.45*fv + 0.55*median(recent.slice(0,6).map(s=>s[1])) : fv;
  const run = isSealed?0:D(key).run;
  let w = 0.1 + 0.42/Math.sqrt(n+1) + (run && run<=10?0.25:0) + (run===1?0.45:0);
  if (isSealed) w*=0.6;
  const lo = nicePrice(Math.max(0.05, center*(1-w*0.75))), hi = nicePrice(Math.max(0.1,center*(1+w)));
  return { lo, hi: Math.max(hi, lo), n, limited: n===0 && (run && run<=25 || fv>150) };
}
function fmtRange(r){ return r.lo===r.hi ? '~'+money(r.lo) : money(r.lo)+'–'+money(r.hi); }
// auto parallels borrow the colour language of the base rainbow
(function(){ const col={Gold:'#c9a227','Gold Refractor':'#d4a72c',Red:'#c0282d','Red Ink':'#b3261e','Red Refractor':'#cf2a2a',Super:'#e8e2c0',Superfractor:'#e8e2c0',Platinum:'#e8e2c0',Refractor:'#cfd8e3','Orange Refractor':'#ea7a1c',Emerald:'#1f8a5a'};
  for (const b in BRANDS){ const a=BRANDS[b].auto; if (!a) continue; for (const p of a.par){ if (!p.col) p.col=col[p.n]||'#999'; if (!p.fin) p.fin = p.run===1?'super': /Refractor|fractor/.test(p.n)?'refr':'color'; } } })();
