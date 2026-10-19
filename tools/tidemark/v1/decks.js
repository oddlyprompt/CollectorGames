// Tidemark Version 1 decks: archetypes from faction mixes and a deck builder that picks 50 cards by rate and curve.
// The format is Tenth Tide (the 220 cards of the anniversary set: its 150 new cards and 70 reprints); historical cards play
// only in Legacy experiments (pool 'all'). Up to 3 copies of a card, 1 of each Legendary.
const {CARDS}=require('./cards.js');
const ARCH=[
 {id:'bastion', name:'Crown Bastion', mix:['CR','IR'], side:'Land', plan:'control'},
 {id:'wild', name:'Thornwild Rush', mix:['TW','CR'], side:'Land', plan:'aggro'},
 {id:'forge', name:'Iron Wilds', mix:['IR','TW'], side:'Land', plan:'midrange'},
 {id:'tempo', name:'Tideborn Tempo', mix:['TB','FF'], side:'Sea', plan:'tempo'},
 {id:'depths', name:'Abyssal Depths', mix:['AC','TB'], side:'Sea', plan:'control'},
 {id:'raiders', name:'Black Sails', mix:['FF','AC'], side:'Sea', plan:'aggro'},
 {id:'fleet', name:'League Fleet', mix:['FF','HL'], side:'Sea', plan:'midrange'},
 {id:'harbor', name:'Harbor Hybrid', mix:['HL','CR','TB'], side:'Hybrid', plan:'midrange'},
 {id:'lanterns', name:'Lantern Watch', mix:['HL','IR'], side:'Hybrid', plan:'control'},
 {id:'wanderers', name:'Grey Roads', mix:['HL','NE','TW'], side:'Hybrid', plan:'aggro'},
];
const KWV={charge:1,surge:1,rampart:1,trample:1,undertow:1,swift:1,tough:2,leader:2};
const curve=c=> c<=2? 2*c+1 : c<=6? 2*c : 2*c-1;
// a rough rate: how much a card gives for its cost, in stat points over the curve (the design guide's prices)
const OPV={draw:2,scry:0.5,dig:1.5,tutor:1.8,regrow:1.5,reanimate:3,harbor:0.4,lose:-0.4,inf:0.6,ramp:2.5,dmg:1.5,dmg_multi:2.5,sweep:2,dmg_harbor:0.8,dmg_hold:0.5,dmg_attackers:1.5,
  destroy:4,exile:4.5,bounce:2,bounce_all:3,tokens:1,pump:1,pump_all:1.5,grant:1,weaken:1,stun:1.5,noblock:0.7,unblockable:1,shift:1.2,move:0.5,ready:1,ready_all:2,fortify:0.5,fortify_all:1,
  control:5,discard:1.2,fight:3,skip_rise:4,opp_draw:-1.5,loot:1,mend:0.5,copy:3,recur:1.5,grow:1,tax_next:1,calm:2,lord:2,cost:1.5,tax:1.5,nostrand:1,athome:2,strand_front:1,strand2:1,
  bounce_cross:1,ward:2,hold_ward:1,screen_both:1,both_allegiance:1,twice:1,survive:1.5,spellproof:1,nobounce:0.3,guard_both:1,home:1,max_attack:1,thorns:1.5,echo:2,pacify:2,equip:0,aura:0,grant_static:2,scale:1.5};
function rate(c){ let v=0; const trig={play:1,rise:2,death:0.7,attack:1,block:0.8,hit:0.8,static:1};
  for (const ab of c.fx){ const w=ab[0].startsWith('on:')? 1.2 : (trig[ab[0]]||1); let x=OPV[ab[1]]||1; const n=typeof ab[2]==='number'? ab[2] : 1;
    if (['draw','dmg','harbor','ramp','tokens','dmg_harbor','fortify','mend','discard','inf'].includes(ab[1])) x*=n; if (ab[1]==='tokens') x=n*(ab[3]+ab[4])*0.5;
    if (ab[1]==='equip'||ab[1]==='aura') x=(ab[2]+ab[3])+(ab[4]?ab[4].split(' ').reduce((q,k)=>q+(KWV[k]||1),0):0);
    if (ab[1]==='lord') x=(Math.abs(ab[2])+Math.abs(ab[3]))*1.5; v+=x*w; }
  if (c.t==='unit'||c.t==='vessel'){ v+=c.pow+c.tgh-curve(c.cost)+c.kw.reduce((q,k)=>q+(KWV[k]||0),0)+(c.ferry||0)*(c.t==='vessel'?0.3:1); }
  else if (c.t==='stronghold') v+=c.fort-(2*c.cost+2);
  else v-=c.cost*1.6;
  return v+c.req*0.5; }
function legal(c, pool){ return pool==='all'? true : c.tt; }
// build a 50-card deck for an archetype: rate each card, keep the curve, 3 copies (Legendaries 1)
let TUNED=null; try { TUNED=JSON.parse(require('fs').readFileSync(require('path').join(__dirname,'decks_tuned.json'),'utf8')); } catch(e){}
const BYN=new Map(CARDS.map(c=>[c.n,c]));
function build(a, pool, opt){ opt=opt||{};
  if (TUNED && TUNED[a.id] && !opt.fresh && pool!=='all' && !opt.ban && !opt.bonus){ const d=TUNED[a.id].map(n=>BYN.get(n)); if (d.length===50 && d.every(c=>c && legal(c,pool))) return d; } const cands=CARDS.filter(c=>legal(c,pool) && (a.mix.includes(c.f) || c.f==='NE') && !(opt.ban||[]).includes(c.n));
  const lean=a.plan==='aggro'? -0.35 : a.plan==='control'? 0.25 : 0;
  const score=c=> rate(c) + (a.mix[0]===c.f? 0.6 : c.f==='NE'? -0.6 : 0) + lean*(c.cost-3.5) + (c.t==='unit'||c.t==='vessel'? 0.4 : 0) + (opt.bonus&&opt.bonus[c.n]||0);
  const sorted=cands.slice().sort((x,y)=>score(y)-score(x));
  const want={'1-2':a.plan==='aggro'?16:12,'3-4':18,'5-6':a.plan==='aggro'?10:13,'7+':a.plan==='aggro'?4:7};
  const slot=c=> c.cost<=2?'1-2':c.cost<=4?'3-4':c.cost<=6?'5-6':'7+'; const have={'1-2':0,'3-4':0,'5-6':0,'7+':0};
  const deck=[]; let units=0;
  for (const pass of [0,1]) for (const c of sorted){ if (deck.length>=50) break; const k=c.r==='L'?1:3; const s=slot(c);
    const already=deck.filter(x=>x===c).length; if (already>=k) continue;
    if (pass===0 && have[s]>=want[s]) continue; const n=Math.min(k-already, 50-deck.length); for (let i=0;i<n;i++){ deck.push(c); have[s]++; if (c.t==='unit'||c.t==='vessel') units++; } }
  return deck; }
const DECKS=pool=>ARCH.map(a=>({a, d:build(a,pool)}));
// ---- brewing (used by the living metagame, meta.js): what a card does in a deck (its roles), what it works with (synergy), and
// a deck built from a faction mix, a plan, a tech package (role weights) and optionally a build-around card
const ROLE_OPS={removal:['dmg','dmg_multi','destroy','exile','sweep','control','fight','stun','weaken','dmg_attackers'], tempo:['bounce','bounce_all','shift','noblock','unblockable','calm'],
  draw:['draw','dig','tutor','scry','loot','regrow','reanimate'], wide:['tokens','pump_all','lord','grant','grant_static','scale','copy'], defense:['mend','fortify','fortify_all','ward','hold_ward','harbor','thorns','max_attack','strand_front'],
  ramp:['ramp','inf','cost']};
function roles(c){ const R=new Set(); for (const ab of c.fx) for (const [r,ops] of Object.entries(ROLE_OPS)) if (ops.includes(ab[1])) R.add(r);
  if (c.kw.includes('swift')) R.add('tempo'); if (c.kw.includes('rampart')||c.kw.includes('tough')||c.t==='stronghold') R.add('defense');
  if ((c.t==='unit'||c.t==='vessel') && (c.kw.includes('charge')||c.kw.includes('surge')||c.cost<=2)) R.add('aggro'); if ((c.t==='unit'||c.t==='vessel') && c.cost>=6) R.add('big');
  if (c.t==='vessel'||c.ferry) R.add('fleet'); return R; }
const TECH=[{k:'rem',n:'Removal',w:{removal:1.8,draw:0.8}}, {k:'tmp',n:'Tempo',w:{tempo:1.8,aggro:1.2,big:0.7}}, {k:'drw',n:'Card Draw',w:{draw:1.8,ramp:1.2,aggro:0.8}},
  {k:'wide',n:'Go Wide',w:{wide:1.8,aggro:1.3,big:0.6}}, {k:'fort',n:'Fortress',w:{defense:1.8,big:1.2,aggro:0.6}}, {k:'ramp',n:'Ramp',w:{ramp:1.8,big:1.5,aggro:0.6}},
  {k:'agg',n:'Aggro',w:{aggro:1.8,removal:1.1,big:0.5,draw:0.7}}, {k:'big',n:'Big Threats',w:{big:1.8,ramp:1.3,aggro:0.7}}, {k:'flt',n:'Fleet',w:{fleet:1.9,tempo:1.1}}];
// filters a card's abilities mention (what it rewards), with the bare ones ('unit', 'own unit') left out
const FRAG=/^(own|enemy|any|unit|other|self|foe)( (own|enemy|any|unit|other))*$/;
const KWS=new Set(['charge','surge','rampart','leader','swift','undertow','tough','trample','ferry']);
// ops whose filter names your own cards (what the card rewards); removal and taxes name the opponent's
const OWN_OPS=new Set(['lord','cost','grant','grant_static','pump','pump_all','scale','tutor','dig','regrow','reanimate','nostrand','athome','ready','ready_all','copy','mend','move','unblockable']);
function filtersOf(c){ const F=[]; for (const ab of c.fx){ const ev=ab[0].startsWith('on:')? ab[0].split(':') : null; if (ev && ev[2]) F.push(ev[2].replace(/_/g,' '));
    if (OWN_OPS.has(ab[1])) for (const v of ab.slice(2)) if (typeof v==='string' && !v.split(' ').every(w=>KWS.has(w))) F.push(v); }
  return F.filter(f=>specific(f)); }
// a filter that rewards a kind of card worth building around: one of yours (not the enemy's), naming a subtype, a card type other than
// plain units, a keyword, Legendaries or tokens
const SPEC=/\b(vessel|relic|equipment|enchantment|aura|domain|stronghold|spell|legend|token|land|sea|dual|neutral|charge|surge|rampart|leader|swift|undertow|tough|trample|ferry|beast|spirit|bird|construct|cultist|druid|hunter|worker|archer|cleric|knight|mercenary|mercenaries|noble|official|privateer|sailor|soldier|trader|wanderer|mason|miner|smith|scout|guardian|mage|warrior|horror|leviathan|kraken|fish|eel|levy|wolf|boar|fox|badger|singer|spawn|drowned|tideborn|reachfolk|folk)\b/;
function specific(f){ return !/\benemy\b/.test(f) && !FRAG.test(f) && SPEC.test(f); }
let MC=null; const matchC=(c,f)=>{ if (!MC) MC=require('./engine.js').matchC; try { return MC(c,f); } catch(e){ return false; } };
// how well card c works with the build-around card L (0 = not at all): L rewards what c is, or c rewards what L is
function synergy(L, c){ if (c===L) return 0; let v=0; for (const f of filtersOf(L)) if (matchC(c,f)) v+=1; for (const f of filtersOf(c)) if (matchC(L,f)) v+=0.6;
  const ls=(L.sub||'').toLowerCase().split(/\s+/), cs=(c.sub||'').toLowerCase().split(/\s+/); if (c.t==='unit' && ls.some(w=>w.length>3 && cs.includes(w) && !['human'].includes(w))) v+=0.3; return Math.min(3,v); }
// a brewed deck: spec {id, mix, plan, tech (a TECH entry or null), lead (a card or null), seed (number: reorders close choices)}
function brew(spec, pool){ pool=pool||'tt'; const bonus={}; const T=spec.tech&&spec.tech.w||{}; let x=(spec.seed>>>0)||1; const rnd=()=>{ x=(Math.imul(x,1103515245)+12345)>>>0; return x/4294967296; };
  for (const c of CARDS){ if (!legal(c,pool) || !(spec.mix.includes(c.f)||c.f==='NE')) continue; let b=0; for (const r of roles(c)) b+=((T[r]||1)-1)*2.2;
    if (spec.lead) b+=synergy(spec.lead,c)*2.5; if (spec.seed!=null) b+=(rnd()-0.5)*1.6; if (b) bonus[c.n]=b; }
  if (spec.lead) bonus[spec.lead.n]=(bonus[spec.lead.n]||0)+30;
  return build({id:spec.id||'brew', mix:spec.mix, plan:spec.plan||'midrange'}, pool, {fresh:true, bonus, ban:spec.ban||[]}); }
module.exports={ARCH, build, DECKS, rate, legal, roles, synergy, brew, TECH};
