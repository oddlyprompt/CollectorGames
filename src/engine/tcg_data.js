// ===================== TCG: THE WILDKIN CATALOG (Version 1) =====================
// The cards come from wildkin-production/manifest.json (WK_CANON, written into the build by tools/wildkin_build.py).
// Set 001 is First Bond: 180 cards (140 base + 40 premium). Nothing here invents cards: no other set is defined yet.
// Saves only hold what changes (copies, prices, the metagame, bans); the catalog is rebuilt from the manifest on load.
const TC_EL=WK_CANON.set.aff.map(a=>a.n);                 // Verdant Tide Stone Iron Ember Storm Astral Dusk Wonder
const TC_CV=2;                                            // content version in saves: 2 = Version 1 cards. Saves without it are prototype saves.
const TC_RAROR={ess:-1,common:0,unc:1,rare:2,ir:3,fa:4,sir:5,csr:6};
const TC_RARN={ess:'Essence',common:'Common',unc:'Uncommon',rare:'Rare',ir:'Illustration rare',fa:'Full art',sir:'Special illustration rare',csr:'Clasped secret rare'};
const TC_VARN={N:'Regular',R:'Reverse holo',H:'Holo',I:'Illustration rare',F:'Full art',X:'Special illustration',C:'Clasped secret',P:'Booster pack',B:'Booster box'};
const TC_KINDN={creature:'Wildkin',ally:'Ally',gear:'Gear',biome:'Biome',tactic:'Tactic',essence:'Essence'};
const TC_PREMV={ir:'I',fa:'F',sir:'X',csr:'C'};
function tcIsPrem(c){ return !!TC_PREMV[c.rar]; }
const tcAlt=c=>c.same!=null;                              // a premium print of another card: same identity in play
function tcSetDef(n){
  if (n!==1) return null; const s=WK_CANON.set; const [y,m,d]=s.rel.split('-').map(Number);
  return {n:1, id:s.id, name:s.name, code:s.code, rel:dateToDay(y,m,d), reprint:false, base:s.base, total:s.total};
}
const TC_STYLES=['aggro','mid','control','combo','stall'], TC_STYN={aggro:'Aggro',mid:'Midrange',control:'Control',combo:'Combo',stall:'Stall'};
const TC_CACHE=new Map(), TCD=new Map(), TC_BYCID=new Map();
// ---------- building the set from the manifest (the card mapping lives in tcg_rules.js, shared with the headless tools) ----------
// pw: how strong a card is in play (0..1), from the rules engine's own ratings; st: what plan it serves. Both are the
// same in every world: the metagame (tcg_world.js) decides how much each card is actually played.
function tcBuildSet(n){
  const cards=WKR.setFromCanon(WK_CANON,n);
  const base=cards.filter(c=>c.same==null && c.kind!=='essence'); const rate=c=>c.kind==='creature'? WKR.creatureRating(c) : WKR.trainerRating(c,{evo:true,st2:true})*10;
  const sorted=base.map(c=>[c,rate(c)]).sort((a,b)=>a[1]-b[1]); sorted.forEach(([c],i)=>{ c.pw=+(0.12+0.84*i/Math.max(1,sorted.length-1)).toFixed(3); });
  const role={draw:'combo',search:'combo',accel:'combo',heal:'stall',tool:'stall',gust:'control',disrupt:'control',switch:'control',recover:'combo',boost:'aggro',biome:'mid'};
  for (const c of cards){ c.ap=+(0.75+0.55*c.fan+0.25*((hsh('ap'+c.id)%1000)/1000)).toFixed(2); c.hue=0;
    if (c.kind==='essence'){ c.pw=0.05; c.st='mid'; } else if (c.kind!=='creature') c.st=role[c.role]||'mid';
    else { const fx=c.atk.flatMap(a=>a.fx.map(o=>o[0])); c.st= fx.some(k=>/status|strip|gust|opp_discard|no_retreat/.test(k))? 'control' : fx.some(k=>/heal|guard/.test(k))||(c.ab&&c.ab.k==='passive')? 'stall' : fx.some(k=>/draw|accel/.test(k))? 'combo' : Math.max(...c.atk.map(a=>a.d/a.cost.length))>=40? 'aggro' : 'mid'; } }
  const byNo={}; for (const c of cards) byNo[c.no]=c; for (const c of cards) if (c.same!=null){ c.pw=byNo[c.same].pw; c.st=byNo[c.same].st; }
  for (const c of cards) if (c.same==null) TC_BYCID.set(c.cid,c);
  return cards;
}
function tcSetCards(n){ const k=G.seed+':'+n; let c=TC_CACHE.get(k); if (c) return c; if (!tcSetDef(n)) return []; c=tcBuildSet(n); TC_CACHE.set(k,c); return c; }
function tcVariants(c){ if (TC_PREMV[c.rar]) return [TC_PREMV[c.rar]]; if (c.rar==='ess') return ['N']; return c.rar==='rare'? ['N','H','R'] : ['N','R']; }
// ---------- keys and designs ----------
const tcKey=(set,no,v)=>'T|'+set+'|'+no+'|'+v;
function tcD(key){
  let d=TCD.get(key); if (d) return d;
  const [,s,no,v]=key.split('|'); const set=+s, num=+no; const def=tcSetDef(set); if (!def) throw new Error('no such set '+key);
  if (num===0){ d={key,set,no:0,v,sealed:true,def,card:null,title:def.name+' '+(v==='P'?'booster pack':'booster box'),rar:'sealed',cid:0}; }
  else { const card=tcSetCards(set)[num-1]; if (!card || card.no!==num) throw new Error('no such card '+key); d={key,set,no:num,v,sealed:false,def,card,title:card.name,rar:card.rar,cid:card.cid,kind:card.kind,el:card.el||null}; }
  TCD.set(key,d); return d;
}
function tcAllKeys(set){ const out=[]; for (const c of tcSetCards(set)) for (const v of tcVariants(c)) out.push(tcKey(set,c.no,v)); return out; }
function tcPrintsOf(cid){ const out=[]; for (const s of tcReleasedSets(G.day+400)) for (const c of tcSetCards(s)) if (c.cid===cid) out.push(c); return out; }
function tcReleasedSets(t){ const out=[]; for (let n=1;n<60;n++){ const d=tcSetDef(n); if (d && d.rel<=t) out.push(n); else break; } return out; }
function tcNextSet(t){ for (let n=1;n<60;n++){ const d=tcSetDef(n); if (!d) return null; if (d.rel>t) return n; } return null; }
function tcCardKey(c){ return tcKey(c.set,c.no,tcVariants(c)[0]); }
function tcCardLabel(key){ const d=tcD(key); if (d.sealed) return d.title; return d.card.name+' ('+d.def.code+' '+String(d.no).padStart(3,'0')+(d.v!=='N'?', '+TC_VARN[d.v].toLowerCase():'')+')'; }
function tcNumLabel(c){ return String(c.no).padStart(3,'0')+'/'+String(WK_CANON.set.base).padStart(3,'0'); }
// ---------- art: every card names its pieces; only approved pieces are in WK_ART ----------
function tcArtOf(card){ return card.art||{l:'none'}; }
function tcArtUrl(id){ const a=id&&WK_ART[id]; return a? a.u : null; }
function tcArtState(card){ const a=tcArtOf(card); const need=[a.s,a.b,a.i].filter(Boolean); const have=need.filter(x=>WK_ART[x]);
  if (a.l==='vector-essence') return {state:'vector', missing:[]}; if (!need.length) return {state:'none', missing:[]};
  const missing=need.filter(x=>!WK_ART[x]); if (!missing.length) return {state:'final', missing}; if (a.l==='illustration' && a.x && WK_ART[a.x]) return {state:'interim', missing};
  return {state: have.length? 'partial':'pending', missing}; }
