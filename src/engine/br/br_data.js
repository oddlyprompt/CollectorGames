// ===================== BROKEN REACH: THE CATALOG =====================
// The third card game in the card-game world. Cards come from broken-reach-production/set01/cards.json (BR_SETS, BR_CARDS, BR_ALTS, written into
// the build by tools/brokenreach_collect_build.py). Version 1 has one set, Set 01 "A Ship of Our Own": 180 base cards (172 units and 8 planets) printed
// regular and foil, and 27 premium alternate arts (16 Illustration Rare, 8 Signature Rare, 3 Eclipse Rare). Everything is PROPOSED (the owner's handoff),
// never canon; release date, prices, pack odds and collector taste are decided by Claude (2026-10-30). The playable battler lives in dist/tcg/broken-reach/.
const BR_CV=1;                                            // content version in saves
const BR_ECON={version:'v1', condition:CONDITION_V1};
const BR_RARN={common:'Common',unc:'Uncommon',rare:'Rare',sr:'Super Rare',leg:'Legendary',ir:'Illustration Rare',sig:'Signature Rare',ecl:'Eclipse Rare'};
const BR_RAROR={common:0,unc:1,rare:2,sr:3,leg:4,ir:5,sig:6,ecl:7};
const BR_RMAP={C:'common',U:'unc',R:'rare',SR:'sr',L:'leg'}, BR_TMAP={IR:'ir',SR:'sig',SI:'sig',EC:'ecl'};
const BR_VARN={N:'Regular',F:'Foil',A:'Premium art',P:'Booster pack',B:'Booster box'};
const BR_SUF={F:' (foil)'};
const brFoilish=v=>v==='F'||v==='A';
const BR_TYPEN={Ship:'Ship',Character:'Character','Crew & Military':'Crew & Military','Drone & Creature':'Drone & Creature','Tech Unit':'Tech Unit',Planet:'Planet'};
const BR_AFF={'Free Captains':{c:'#9b6b22',d:'#2b1d0a',l:'#e0b060'},'Veyne Exchange':{c:'#8a2a3a',d:'#260c13',l:'#d98a98'},'Concordance Remnant':{c:'#3f6b8f',d:'#0f1b27',l:'#8fb8d8'},'Veyr Consortium':{c:'#6d5a8f',d:'#1a1426',l:'#b3a3d6'},Independent:{c:'#4f7a62',d:'#10201a',l:'#9fcdb2'},'Quiet Assembly':{c:'#3d8a96',d:'#0d1f24',l:'#8fd0da'}};
const BR_ICON={'Ship':'<path d="M50 8 L74 78 L50 64 L26 78 Z"/><path d="M50 24 V54"/>','Character':'<circle cx="50" cy="32" r="14"/><path d="M20 86 C20 58 80 58 80 86 Z"/>','Crew & Military':'<path d="M50 10 L82 22 V48 C82 68 66 80 50 90 C34 80 18 68 18 48 V22 Z"/>','Drone & Creature':'<path d="M50 12 L84 32 V68 L50 88 L16 68 V32 Z"/><circle cx="50" cy="50" r="10"/>','Tech Unit':'<circle cx="50" cy="50" r="16"/><path d="M50 10V28M50 72V90M10 50H28M72 50H90M22 22L35 35M65 65L78 78M78 22L65 35M35 65L22 78"/>','Planet':'<circle cx="50" cy="50" r="26"/><ellipse cx="50" cy="50" rx="44" ry="12" transform="rotate(-22 50 50)"/>'};
const BR_DIRN=['N','NE','E','SE','S','SW','W','NW'];
const BR_CACHE=new Map(), BRD=new Map(), BR_BYCID=new Map();
const brIsPrem=c=>c.pk==='alt';
const brAlt=c=>c.same!=null;                               // a premium alternate art of another card: the same card in play
function brSetDef(n){
  const s=BR_SETS[n-1]; if (!s) return null; const [y,m,d]=s.rel.split('-').map(Number);
  return {n, id:s.code, name:s.name, code:s.code, rel:dateToDay(y,m,d), reprint:false, base:s.tot, total:s.size, year:s.year, era:s.era, named:s.size};
}
// ---------- how strong a card is in play, from its own numbers ----------
// pw 0..1: units ranked among themselves by Attack, Guard and arrows (a 5-arrow card has lower stats on purpose, so arrows count a little); planets sit in the middle.
// There is no simulated tournament field yet (the battler is a prototype), so this is a static rating.
const BR_PW=new Map(); (function(){ const us=BR_CARDS.filter(c=>!c.p).map(c=>[c,c.A+0.8*c.G+0.35*brPop(c.m)+(c.x? 0.4 : 0)]).sort((a,b)=>a[1]-b[1]); us.forEach(([c],i)=>BR_PW.set(c.i,+(0.12+0.84*i/Math.max(1,us.length-1)).toFixed(3))); for (const c of BR_CARDS) if (c.p) BR_PW.set(c.i,0.5); })();
function brPop(m){ let n=0; for (let i=0;i<8;i++) n+=m>>i&1; return n; }
// collector fandom (decided 2026-10-30, not canon): the six crew, the two rivals and named operatives are what people chase
const BR_CREW=['Kaia Venn','Tavi','Dorrak','Elias Voss','Lyssara Vale','Neru Sael'], BR_RIVAL=['Rix Vanno','Silas Veyne'], BR_HERO_SHIPS=['The First Promise','The Last Argument'];
function brFan(c){ const nm=c.n; let f=0.35+0.2*((hsh('fan'+c.i)%1000)/1000);
  if (BR_CREW.some(x=>nm.startsWith(x))) f=0.95; else if (BR_RIVAL.some(x=>nm.startsWith(x))) f=0.85; else if (BR_HERO_SHIPS.includes(nm)) f=0.8; else if (c.t==='Character' && nm.includes(' — ')) f=Math.max(f,0.6);
  return Math.min(1,f+(c.r==='L'?0.1:c.r==='SR'?0.05:0)); }
const BR_BASEBYID=new Map(BR_CARDS.map((c,i)=>[c.i,i]));
function brBuildSet(n){
  const cards=[]; let no=0; const byId={};
  BR_CARDS.forEach((e,i)=>{ no++; const fan=+brFan(e).toFixed(3); const c={no, cn:no, set:n, id:e.i, cid:no, name:e.n, kind:e.t, type:e.t, aff:e.a, el:e.a, rar:BR_RMAP[e.r], r:e.r, mask:e.m, atk:e.A, grd:e.G, text:e.x||'', role:e.ro, era:e.e, planet:!!e.p, pk:'base', fan, ap:+(0.75+0.55*fan+0.25*((hsh('ap'+e.i)%1000)/1000)).toFixed(2), pw:BR_PW.get(e.i), hue:0};
    cards.push(c); byId[e.i]=c; });
  for (const a of BR_ALTS){ no++; const b=byId[a.b]; const c=Object.assign({}, b, {no, cn:no, id:a.i, cid:b.cid, rar:BR_TMAP[a.tr], r:a.tr, pk:'alt', same:b.no, fan:Math.min(1,b.fan+0.1), ap:+(b.ap*1.1).toFixed(2)}); cards.push(c); }
  for (const c of cards) if (c.pk==='base') BR_BYCID.set(c.cid,c);
  return cards;
}
function brSetCards(n){ let c=BR_CACHE.get(n); if (c) return c; if (!brSetDef(n)) return []; c=brBuildSet(n); BR_CACHE.set(n,c); return c; }
function brVariants(c){ return c.rar==='ir'||c.rar==='sig'||c.rar==='ecl'? ['A'] : ['N','F']; }   // what completing a set means
function brVariantsAll(c){ return brVariants(c); }
// ---------- keys and designs ----------
const brKey=(set,no,v)=>'B|'+set+'|'+no+'|'+v;
function brD(key){
  let d=BRD.get(key); if (d) return d;
  const [,s,no,v]=key.split('|'); const set=+s, num=+no; const def=brSetDef(set); if (!def) throw new Error('no such set '+key);
  if (num===0){ d={key,set,no:0,v,sealed:true,def,card:null,title:def.name+' '+(v==='P'?'booster pack':'booster box'),rar:'sealed',cid:0}; }
  else { const card=brSetCards(set)[num-1]; if (!card || card.no!==num) throw new Error('no such card '+key); d={key,set,no:num,v,sealed:false,def,card,title:card.name+(BR_SUF[v]||''),rar:card.rar,cid:card.cid,kind:card.kind,el:card.aff}; }
  BRD.set(key,d); return d;
}
function brAllKeys(set){ const out=[]; for (const c of brSetCards(set)) for (const v of brVariants(c)) out.push(brKey(set,c.no,v)); return out; }
function brReleasedSets(t){ const out=[]; for (let n=1;n<=BR_SETS.length;n++){ const d=brSetDef(n); if (d && d.rel<=t) out.push(n); else break; } return out; }
function brNextSet(t){ for (let n=1;n<=BR_SETS.length;n++){ const d=brSetDef(n); if (!d) return null; if (d.rel>t) return n; } return null; }
const brAnnounced=t=>brNextSet(t);
function brCardKey(c){ return brKey(c.set,c.no,brVariants(c)[0]); }
function brCardLabel(key){ const d=brD(key); if (d.sealed) return d.title; return d.card.name+' ('+d.def.code+' '+String(d.card.cn).padStart(3,'0')+(d.v!=='N'?', '+BR_VARN[d.v].toLowerCase():'')+')'; }
function brNumLabel(c){ const s=brSetDef(c.set); return s.code+' '+String(c.cn).padStart(3,'0')+'/'+s.total; }
function brRV(d){ const r=BR_RARN[d.card.rar], v=BR_VARN[d.v]; return d.card.pk==='alt'? r : r+(v!==r&&d.v!=='N'? ' · '+v : ''); }
function brPrintsOf(cid){ return brSetCards(1).filter(c=>c.cid===cid); }
function brCardByCid(cid){ brSetCards(1); return BR_BYCID.get(+cid)||null; }
// art: nothing is approved yet (the handoff says no production artwork before the master character sheets); every card draws a labelled placeholder
const BR_ART=BR_ART_MAP;   // id -> {u}: only owner-approved pictures (tools/brokenreach_collect_build.py)
function brArtUrl(id){ const a=id&&BR_ART[id]; return a? a.u : null; }
function brArtState(card){ return BR_ART[card.id]? {state:'final', missing:[]} : {state:'pending', missing:[card.id]}; }
