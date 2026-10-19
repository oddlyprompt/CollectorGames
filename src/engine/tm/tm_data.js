// ===================== TIDEMARK: THE CATALOG =====================
// Cards, printings and sets come from tidemark-production/ (TM_SETS, TM_CARDS, TM_PR, written into the build by tools/tidemark_build.py).
// 31 sets, oldest first: First Tide (1, 2016) to Tenth Tide (31, 2026). Only the named cards of the 30 historical sets exist (500 cards);
// the rest of each set is bulk that packs hand out but the game does not track. A card is one identity (cid, the checklist's TMC number)
// printed in one or more sets; every printing has its own key and price. Saves only hold what changes (copies, prices, the field, bans).
const TC_CV=1;                                            // content version in saves
const TM_TT=TM_SETS.length;                               // the anniversary set is the last one
const TC_RAROR={common:0,unc:1,rare:2,leg:3,alt:4};
const TC_RARN={common:'Common',unc:'Uncommon',rare:'Rare',leg:'Legendary',alt:'Anniversary alternate art'};
const TC_VARN={N:'Regular',F:'Foil',A:'Alternate art',P:'Booster pack',B:'Booster box'};
const TC_KINDN={unit:'Unit',spell:'Spell',relic:'Relic',vessel:'Vessel',stronghold:'Stronghold',domain:'Domain',enchantment:'Enchantment'};
const TM_FAC={CR:{n:'Crownlands',c:'#2f5fae',d:'#1b3a72',l:'#8fb0e6',w:0.50},TW:{n:'Thornwild',c:'#3d7a3a',d:'#234a22',l:'#9ccc8f',w:0.55},IR:{n:'Iron Reach',c:'#a2452c',d:'#62281a',l:'#e5a189',w:0.46},
  TB:{n:'Tideborn',c:'#1f8a8a',d:'#0f5050',l:'#86d3cf',w:0.52},FF:{n:'Free Fleets',c:'#c49a2e',d:'#7a5c14',l:'#f0d58a',w:0.66},AC:{n:'Abyssal Choir',c:'#6a3f9c',d:'#3d2160',l:'#bf9be6',w:0.62},
  HL:{n:'Harbor Leagues',c:'#8a5a34',d:'#53351c',l:'#d9b08a',w:0.42},NE:{n:'Neutral',c:'#85898e',d:'#4c4f53',l:'#cfd2d5',w:0.34}};
const TC_EL=Object.keys(TM_FAC).map(k=>TM_FAC[k].n);
const TC_ELF={}; for (const k in TM_FAC) TC_ELF[TM_FAC[k].n]=k;
function tcIsPrem(c){ return c.rar==='alt'; }
const tcAlt=c=>c.same!=null;                              // an alternate-art print of another card in the same set: same identity in play
const TM_BYID=new Map(TM_CARDS.map(c=>[c.id,c]));
const tmCid=id=>+id.slice(4);
const TM_FIRST={}; (function(){ const code=n=>TM_SETS[n-1].code; for (const p of TM_PR){ const pid='TM-'+code(p.s)+'-'+String(p.n).padStart(3,'0'); const e=TM_BYID.get(p.c); if (e.first===pid) TM_FIRST[tmCid(p.c)]=p.s; } })();
function tcSetDef(n){
  const s=TM_SETS[n-1]; if (!s) return null; const [y,m,d]=s.rel.split('-').map(Number);
  return {n, id:s.code, name:s.name, code:s.code, rel:dateToDay(y,m,d), reprint:false, base:s.named, total:s.size, year:s.year, era:s.era, tot:s.tot, named:s.named, tt:n===TM_TT};
}
const TC_STYLES=['aggro','mid','control','combo','stall'], TC_STYN={aggro:'Aggro',mid:'Midrange',control:'Control',combo:'Tempo',stall:'Fortress'};
const TC_CACHE=new Map(), TCD=new Map(), TC_BYCID=new Map();
// ---------- how strong a card is in play, from the engine's own rate ----------
// pw 0..1: Tenth Tide cards ranked among themselves (they are what the format plays), older cards ranked among theirs and a little lower.
// st: what plan it serves. Both are the same in every world; the metagame (tm_world.js) decides how much each card is actually played.
const TM_PW=new Map(), TM_ST=new Map();
(function(){
  for (const grp of [TM_CARDS.filter(c=>c.tt), TM_CARDS.filter(c=>!c.tt)]){ const s=grp.map(c=>[c,TMR.rate(c)]).sort((a,b)=>a[1]-b[1]); const k=grp[0]&&grp[0].tt? 1 : 0.8; s.forEach(([c],i)=>TM_PW.set(c.id,+((0.12+0.84*i/Math.max(1,s.length-1))*k).toFixed(3))); }
  for (const c of TM_CARDS){ const r=TMR.roles(c); TM_ST.set(c.id, r.has('removal')||r.has('tempo')&&!r.has('aggro')? 'control' : r.has('draw')||r.has('ramp')? 'combo' : r.has('aggro')? 'aggro' : r.has('defense')||c.t==='stronghold'? 'stall' : 'mid'); }
})();
// collector fandom (decided 2026-10-19, not canon): faction weight, Legendaries, Vessels and the reserve list
const tmFan=e=>Math.min(1, TM_FAC[e.f].w+(e.r==='L'?0.12:e.r==='R'?0.04:0)+(e.t==='vessel'?0.04:0)+(e.res?0.1:0)+0.1*((hsh('fan'+e.id)%1000)/1000));
function tcBuildSet(n){
  const prs=TM_PR.filter(p=>p.s===n).sort((a,b)=>a.n-b.n); const cards=[];
  prs.forEach((p,i)=>{ const e=TM_BYID.get(p.c); const alt=p.k==='alt'; const fan=+tmFan(e).toFixed(3);
    cards.push({no:i+1, cn:p.n, set:n, id:e.id, cid:tmCid(e.id), name:e.n, kind:e.t, rar:alt?'alt':{C:'common',U:'unc',R:'rare',L:'leg'}[e.r], r:e.r, f:e.f, el:TM_FAC[e.f].n, al:e.al, sub:e.sub||'', cost:e.cost, req:e.req||0, pow:e.pow, tgh:e.tgh, fort:e.fort,
      ferry:e.ferry||0, kwl:e.kwline||'', rules:e.rules||'', res:e.res||0, tt:!!e.tt, pk:p.k, ill:p.i, fan, ap:+(0.75+0.55*fan+0.25*((hsh('ap'+e.id)%1000)/1000)).toFixed(2), pw:TM_PW.get(e.id), st:TM_ST.get(e.id), hue:0}); });
  const byId={}; for (const c of cards) if (c.pk!=='alt') byId[c.id]=c; for (const c of cards) if (c.pk==='alt' && byId[c.id]) c.same=byId[c.id].no;
  for (const c of cards) if (c.same==null && TM_FIRST[c.cid]===n) TC_BYCID.set(c.cid,c);   // a reprint never replaces the first print
  return cards;
}
function tcSetCards(n){ const k=G.seed+':'+n; let c=TC_CACHE.get(k); if (c) return c; if (!tcSetDef(n)) return []; c=tcBuildSet(n); TC_CACHE.set(k,c); return c; }
function tcVariants(c){ return c.rar==='alt'? ['A'] : ['N','F']; }
// ---------- keys and designs ----------
const tcKey=(set,no,v)=>'T|'+set+'|'+no+'|'+v;
function tcD(key){
  let d=TCD.get(key); if (d) return d;
  const [,s,no,v]=key.split('|'); const set=+s, num=+no; const def=tcSetDef(set); if (!def) throw new Error('no such set '+key);
  if (num===0){ d={key,set,no:0,v,sealed:true,def,card:null,title:def.name+' '+(v==='P'?'booster pack':'booster box'),rar:'sealed',cid:0}; }
  else { const card=tcSetCards(set)[num-1]; if (!card || card.no!==num) throw new Error('no such card '+key); d={key,set,no:num,v,sealed:false,def,card,title:card.name+(v==='F'?' (foil)':''),rar:card.rar,cid:card.cid,kind:card.kind,el:card.el||null}; }
  TCD.set(key,d); return d;
}
function tcAllKeys(set){ const out=[]; for (const c of tcSetCards(set)) for (const v of tcVariants(c)) out.push(tcKey(set,c.no,v)); return out; }
function tcPrintsOf(cid){ const out=[]; for (let s=1;s<=TM_TT;s++){ if (!tcSetDef(s) || tcSetDef(s).rel>G.day+400) continue; for (const c of tcSetCards(s)) if (c.cid===cid) out.push(c); } return out; }
function tcReleasedSets(t){ const out=[]; for (let n=1;n<=TM_TT;n++){ const d=tcSetDef(n); if (d && d.rel<=t) out.push(n); else break; } return out; }
// the next set the player knows about: Tenth Tide, announced on the first day
function tcAnnounced(t){ const n=tcNextSet(t); return n; }
function tcNextSet(t){ for (let n=1;n<=TM_TT;n++){ const d=tcSetDef(n); if (!d) return null; if (d.rel>t) return n; } return null; }
function tcCardKey(c){ return tcKey(c.set,c.no,tcVariants(c)[0]); }
function tcCardLabel(key){ const d=tcD(key); if (d.sealed) return d.title; return d.card.name+' ('+d.def.code+' '+String(d.card.cn).padStart(3,'0')+(d.v!=='N'?', '+TC_VARN[d.v].toLowerCase():'')+')'; }
function tcNumLabel(c){ const s=tcSetDef(c.set); return s.code+' '+String(c.cn).padStart(3,'0')+'/'+s.total; }
// ---------- art: one painting per printing, only approved paintings are in TM_ART ----------
function tcArtOf(card){ return {l:'illustration', i:card.ill}; }
function tcArtUrl(id){ const a=id&&TM_ART[id]; return a? a.u : null; }
function tcArtState(card){ return TM_ART[card.ill]? {state:'final', missing:[]} : {state:'pending', missing:[card.ill]}; }
function tcCardByCidX(cid){ const s=TM_FIRST[cid]; if (s) tcSetCards(s); return TC_BYCID.get(+cid)||null; }
