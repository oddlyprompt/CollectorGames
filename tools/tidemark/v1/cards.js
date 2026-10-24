// Tidemark Version 1 cards: the checklist (tidemark-production/manifest.json: names, types, factions, rarities, sets) plus the
// designs (design_*.js in this folder: cost, Allegiance, Power/Toughness, keywords, abilities as ops). Validates every card and
// generates its text from the ops. node tools/tidemark/v1/cards.js lists problems (exit 1 if any) and a summary.
const fs=require('fs'), path=require('path');
const {KEYWORDS, KWNAME, OPS, checkAbility, abilityText, parseF}=require('./ops.js');
const ROOT=path.resolve(__dirname,'../../..');
const MAN=JSON.parse(fs.readFileSync(path.join(ROOT,'tidemark-production/manifest.json'),'utf8'));
const FCODE={Crownlands:'CR',Thornwild:'TW','Iron Reach':'IR',Tideborn:'TB','Free Fleets':'FF','Abyssal Choir':'AC','Harbor Leagues':'HL',Neutral:'NE'};
const ALC={Land:'L',Sea:'S',Dual:'D',Neutral:'N'};
const TYPE={Unit:'unit',Spell:'spell',Relic:'relic',Vessel:'vessel',Stronghold:'stronghold',Domain:'domain',Enchantment:'enchantment'};
function loadDesigns(){ const D={}, from={};
  for (const f of fs.readdirSync(__dirname).filter(f=>/^design_.*\.js$/.test(f)).sort()){ const m=require(path.join(__dirname,f));
    for (const [k,v] of Object.entries(m)){ if (D[k]) throw new Error('designed twice: '+k+' ('+from[k]+', '+f+')'); D[k]=v; from[k]=f; } }
  const wf=path.join(__dirname,'design_waves.json'); if (fs.existsSync(wf)){ const W=JSON.parse(fs.readFileSync(wf,'utf8')); for (const [k,v] of Object.entries(W)){ if (D[k]) throw new Error('designed twice: '+k+' (design_waves.json)'); D[k]=v; from[k]='design_waves.json'; } }
  return {D, from}; }
function kwList(d){ const k=(d.k||'').trim(); return k? k.split(/\s+/) : []; }
function textOf(c){ const kws=c.kw.filter(k=>k!=='swift'||c.t!=='spell').map(k=>KWNAME[k]); if (c.ferry) kws.push('Ferry '+c.ferry);
  const lines=[]; if (c.t==='stronghold') lines.push('Durability '+c.fort+'.');
  const ctx={spell:c.t==='spell', domain:c.t==='domain'};
  for (const ab of c.fx) lines.push(abilityText(ab, ctx));
  c.kwline=kws.length? kws.join(', ') : ''; c.rules=lines.join(' ').replace(/\s+/g,' ').trim();
  return ((c.kwline? c.kwline+'. ' : '')+c.rules).trim(); }
// balance patches (balance.js): [title, changes to the design, reason], applied after the designs so every change is on record
function applyBalance(D){ let B=[]; try { B=require('./balance.js'); } catch(e){ if (e.code!=='MODULE_NOT_FOUND') throw e; } const log=[];
  for (const [t,ch,why] of B){ const d=D[t]; if (!d) throw new Error('balance: no card '+t); const before={}; for (const k of Object.keys(ch)) before[k]=d[k]; Object.assign(d, JSON.parse(JSON.stringify(ch))); log.push({n:t, before, after:ch, why}); }
  return log; }
function build(){ const {D, from}=loadDesigns(); const BAL=applyBalance(D); const errs=[], warns=[]; const cards=[]; const seen=new Set();
  for (const m of MAN.cards){ const d=D[m.title]; if (!d){ errs.push('no design: '+m.title+' ('+m.card_id+')'); continue; } seen.add(m.title);
    const t=TYPE[m.type]; const c={id:m.card_id, n:m.title, t, sub:m.subtype, f:FCODE[m.faction], fac:m.faction, al:ALC[m.allegiance], r:m.rarity[0], era:m.era, set:m.first_printing,
      tt:m.era==='Tenth Anniversary'||m.reprinted_in_anniversary, cost:d.c, req:d.q||0, pow:d.p, tgh:d.t, fort:d.f, ferry:d.y||0, kw:kwList(d), fx:(d.x||[]).map(a=>a.slice()), note:d.n||'', src:from[m.title]};
    if (t==='domain') c.front=m.subtype==='Shore'?'S':'D';
    if (t==='spell' && m.subtype==='Swift' && !c.kw.includes('swift')) c.kw.push('swift');
    const E=s=>errs.push(m.title+': '+s), W=s=>warns.push(m.title+': '+s);
    if (!Number.isInteger(c.cost) || c.cost<0 || c.cost>10) E('cost must be 0 to 10');
    if (!Number.isInteger(c.req) || c.req<0 || c.req>4) E('Allegiance requirement must be 0 to 4'); if (c.al==='N' && c.req) E('Neutral cards have no Allegiance requirement');
    if (t==='unit'||t==='vessel'){ if (!Number.isInteger(c.pow)||!Number.isInteger(c.tgh)||c.pow<0||c.tgh<1) E('Units and Vessels need Power (0+) and Toughness (1+)'); }
    else if (c.pow!=null||c.tgh!=null) E('only Units and Vessels have Power/Toughness');
    if (t==='stronghold'){ if (!Number.isInteger(c.fort)||c.fort<1) E('Strongholds need durability f'); } else if (c.fort!=null) E('only Strongholds have durability');
    for (const k of c.kw) if (!KEYWORDS.includes(k) || k==='ferry') E('unknown keyword '+k+' (Ferry is y: N)');
    if (c.ferry && !(t==='vessel'||t==='unit')) E('Ferry is for Units and Vessels'); if (c.ferry && t==='unit' && c.f!=='HL') W('Ferry on a non-Harbor Leagues unit');
    if (c.kw.includes('swift') && !['unit','vessel','spell'].includes(t)) E('Swift is for spells, Units and Vessels');
    if (m.subtype==='Swift' && t==='spell' && !c.kw.includes('swift')) E('Swift spell');
    if (t==='spell' && m.subtype!=='Swift' && c.kw.includes('swift')) E('a Swift spell must have the Swift subtype in the checklist');
    for (const ab of c.fx){ const e=checkAbility(ab); if (e) E(e); else if (t==='spell' && ab[0]!=='play') E('spells only have play abilities'); }
    if (t==='relic' && m.subtype==='Equipment' && !c.fx.some(a=>a[1]==='equip')) E('Equipment needs an equip static');
    if (!(t==='relic' && m.subtype==='Equipment') && c.fx.some(a=>a[1]==='equip')) E('equip is for Equipment');
    if (t==='enchantment' && m.subtype==='Unit' && !c.fx.some(a=>a[1]==='aura')) E('Unit Enchantments (Auras) need an aura static');
    if (!(t==='enchantment' && m.subtype==='Unit') && c.fx.some(a=>a[1]==='aura')) E('aura is for Unit Enchantments');
    if (t==='spell' && !c.fx.length) E('a spell needs an effect');
    if (['relic','enchantment','domain'].includes(t) && !c.fx.length) E('needs an effect');
    try { c.text=textOf(c); } catch(e){ E('text: '+e.message); }
    cards.push(c); }
  for (const k of Object.keys(D)) if (!seen.has(k)) errs.push('designed but not in the checklist: '+k+' ('+from[k]+')');
  return {cards, errs, warns, BAL}; }
const B=build();
module.exports={CARDS:B.cards, ERRS:B.errs, WARNS:B.warns, BALANCE:B.BAL, MAN, FCODE};
if (require.main===module){ const {cards,errs,warns}=B;
  const by=(k)=>{ const o={}; for (const c of cards){ const v=k(c); o[v]=(o[v]||0)+1; } return o; };
  console.log('designed', cards.length, 'of', MAN.cards.length, by(c=>c.f));
  if (process.argv.includes('--text')) for (const c of cards.filter(c=>{ const q=process.argv.slice(2).find(a=>!a.startsWith('--')); return !q||c.f===q||c.n===q; })) console.log(`${c.id} ${c.n} [${c.t} ${c.al}${c.req||''} ${c.cost}${c.pow!=null?' '+c.pow+'/'+c.tgh:''}${c.fort?' D'+c.fort:''}] ${c.text}`);
  for (const w of warns) console.log('warn', w);
  for (const e of errs.slice(0,80)) console.log('ERR', e); if (errs.length>80) console.log('...', errs.length-80, 'more');
  process.exit(errs.filter(e=>!e.startsWith('no design')).length || (errs.length && !process.argv.includes('--partial'))? 1 : 0); }
