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
function tcWeak(el){ const i=TC_EL.indexOf(el); return TC_EL[(i+8)%9]; }
const TC_CACHE=new Map(), TCD=new Map(), TC_BYCID=new Map();
// ---------- play power and style (the metagame's hidden numbers; derived from provisional stats) ----------
function tcEffTags(t){ const s=t||''; return { ctl:/Asleep|Paralyzed|Confused|Switch|retreat|Burned|Poisoned|can't|cannot|shuffles their hand|Discard an Essence/i.test(s), stl:/Heal|less damage|Prevent|no Retreat/i.test(s), cmb:/Draw|Search|Attach|Look at|onto your Bench|into your hand/i.test(s) }; }
function tcPw(c, r){
  if (c.kind!=='creature') return c.pw0+(r()-0.5)*0.14;
  let dpe=0, eff=0; for (const a of c.atk){ dpe=Math.max(dpe,(a.d||0)/Math.max(1,a.cost)); const t=tcEffTags(a.t); if (t.ctl||t.stl||t.cmb) eff=0.08; }
  const stageB={'Basic':0,'Stage 1':0.03,'Stage 2':0.07}[c.stage]||0;
  return Math.max(0.05, Math.min(0.98, 0.16+0.42*Math.min(1,dpe/30)+0.24*Math.min(1,c.hp/230)+eff+stageB+({common:0,unc:0.03,rare:0.07}[c.rar]||0)+(r()-0.5)*0.22));
}
function tcStyle(c){ if (c.kind!=='creature') return c.st0||'mid'; let ctl=0,stl=0,cmb=0,dpe=0; for (const a of c.atk){ dpe=Math.max(dpe,(a.d||0)/Math.max(1,a.cost)); const t=tcEffTags(a.t); ctl+=t.ctl?1:0; stl+=t.stl?1:0; cmb+=t.cmb?1:0; } if (ctl) return 'control'; if (cmb) return 'combo'; if (stl) return 'stall'; return dpe>=26?'aggro':'mid'; }
// ---------- building the set from the manifest ----------
function tcBuildSet(n){
  const r=mkRng(hsh('tcs'+G.seed+':'+n)); const S=WK_CANON.set; const cards=[]; const byNo={};
  for (const x of WK_CANON.cards){
    const c={set:n, no:x.no, id:x.id, cid:n*1000+x.no, kind:x.kind, rar:x.rar, name:x.name, art:x.art, rs:x.rs, fan:x.fan||0.3};
    if (x.kind==='creature'){ Object.assign(c,{el:x.el, el2:x.el2, els:x.els, stage:x.stage, from:x.from, to:x.to, fam:x.fam, fams:x.fams, mascot:x.mascot, sp:x.sp, hp:x.hp, weak:x.weak, ret:x.ret,
      atk:x.atk.map(a=>({n:a[0], cost:a[1], d:a[2]||'', t:a[3]}))}); }
    else { c.rules=x.rules; c.st0=x.st0; c.pw0=x.pw0; if (x.el) c.el=x.el; }
    if (x.same!=null){ c.same=x.same; c.pk=x.pk; }
    // collector appeal: fandom sets the level, a little deterministic spread per card
    c.ap=+(0.75+0.55*c.fan+0.25*((hsh('ap'+x.id)%1000)/1000)).toFixed(2); c.hue=0;
    cards.push(c); byNo[c.no]=c;
  }
  for (const c of cards) if (c.same!=null){ const b=byNo[c.same]; c.cid=b.cid; for (const k of ['el','el2','els','stage','from','to','fam','fams','mascot','sp','hp','weak','ret','atk','rules','st0','pw0']) if (b[k]!==undefined && c[k]===undefined) c[k]=b[k]; c.kind=b.kind; }
  for (const c of cards) if (c.same==null){ c.pw=+tcPw(c,r).toFixed(3); c.st=tcStyle(c); }
  for (const c of cards) if (c.same!=null){ const b=byNo[c.same]; c.pw=b.pw; c.st=b.st; }
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
