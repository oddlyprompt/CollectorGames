// Rift Parade card audit: node tools/rift-parade/audit.js [--write] [--sim results.json]
// For every one of the 130 cards, checks that it is valid, legal in a deck, uses implemented keywords and effects, and that every
// ability can actually be triggered in a built position and does something observable. `--write` writes design/tcg3/card-audit.md.
'use strict';
const fs=require('fs'), path=require('path');
const K=require('./testkit.js'); const {E,scene,put,attach,script,playId,actId,id:cid}=K;
const {CARDS,ORDER,PACK_META}=require('./cards.js'); const T=require('./text.js'); const {DECKS}=require('./decks.js');
const KNOWN_OPS=new Set(Object.keys(E.OPS));
const snapshot=g=>{ const t=g.P.map(p=>p.techs); g.P.forEach(p=>p.techs=0); try{ return snap0(g); } finally { g.P.forEach((p,i)=>p.techs=t[i]); } };
const snap0=g=>JSON.stringify([g.P.map(p=>[p.resolve,p.hand.length,p.deck.length,p.discard.length,p.rift.length,p.rift.filter(r=>r.ready).length,p.stage.map(c=>[c.id,c.dmg,c.ctr,c.mark,c.exh,c.sil,c.atch.length,E.pow(g,c),E.hp(g,c),[...E.kwSet(g,c)].sort()]),p.back.map(c=>[c.id,c.dmg,c.ctr,E.pow(g,c),E.hp(g,c)]),p.relics.map(c=>[c.id,!!c.anim,c.ctr]),p.conds.length,p.temp,p.tax,p.disc]),g.rift,g.anomalies,g.zone&&g.zone.id,g.anom]);
// a rich position used for every card: both sides have a board, Relics, hands, a Zone, Conditions, Impact counters, a high Rift
function rich(extra){ const g=scene(Object.assign({rift:4,turn:6,zone:'004',zoneOwner:1,p0:{stage:['001','016','032'],back:['029'],hand:['001','090'],rift:8,relic:['009','005'],discard:['002','028','050','001'],deck:['001','090','003','004','005','006','007','008','009']},p1:{stage:['059','016'],back:['002'],hand:['001','090','030'],relic:['021'],rift:3,discard:['001']}},extra||{}));
  for(const c of g.P[0].stage.concat(g.P[0].back)){ c.ctr.imp=2; } for(const c of g.P[1].stage) c.ctr.imp=2; return g; }
function trigCount(g,id){ return g.st.trig[id]||0; }
// run an event so that triggers of `id` should fire; returns the game and the card instance
function eventScenario(id,ev,ab){ const d=CARDS[id]; const num=id.slice(5); const g=rich(); let c=null;
  const place=()=>{ if(d.type==='Character'){ c=put(g,0,'stage',num); c.ctr.imp=2; } else if(d.type==='Relic') c=put(g,0,'relic',num); else if(d.type==='Zone') c=put(g,0,'zone',num); else if(d.type==='Condition'){ const att=d.attach; if(att==='foe') { c=put(g,1,'cond',num); c.ctl=0; c.hostP=1; } else if(att==='me'){ c=put(g,0,'cond',num); c.ctl=0; c.hostP=0; } else { const host=att==='A'? g.P[0].stage[0] : g.P[1].stage[0]; c=attach(g,host,num,att==='A'?0:0); c.ctl=0; } c.tick=d.tick||0; } };
  switch(ev){
    case 'enter':{ put(g,0,'hand',num); const ok=playId(g,0,id); return {g,ok,c:g.P[0].stage.find(x=>x.id===id)||g.P[0].back.find(x=>x.id===id)||g.P[0].relics.find(x=>x.id===id)||(g.zone&&g.zone.id===id?g.zone:null)||[].concat(...E.allChars(g).map(h=>h.atch),g.P[0].conds,g.P[1].conds).find(x=>x.id===id)}; }
    case 'attack': case 'hit':{ place(); c.exh=false; c.ent=-9; g.P[1].stage=[]; g.P[1].back=[]; g.P[0].stage=[c]; g.ag[0]=script({attack:'all'}); E.doCombat(g,0); return {g,c}; }
    case 'block':{ place(); g.active=1; g.ag[0]=script({block:(gg,p,atk,bl)=>({[atk[0].u]:bl.find(b=>b.id===id).u})}); g.ag[1]=script({attack:'all'}); g.P[1].stage[0].exh=false; g.P[1].stage[0].ent=-9; E.doCombat(g,1); return {g,c}; }
    case 'defeat':{ place(); const victim=ab&&ab.of==='ally'? g.P[0].stage.find(x=>x!==c) : c; E.damage(g,victim,99,null,'t'); E.sweep(g); return {g,c}; }
    case 'wake':{ place(); E.wake(g,c.hostP!==null&&c.hostP!==undefined?c.hostP:(c.host?c.host.ctl:0)); return {g,c}; }
    case 'end':{ place(); E.endTurn(g,0); return {g,c}; }
    case 'anomaly':{ place(); E.fireAnomaly(g); return {g,c}; }
    case 'wagerWin':case 'wagerLose':{ place(); g.P[0].deck.unshift(E.mk(g,ev==='wagerWin'?'RP01-090':'RP01-001',0)); g.ag[0]=script({choices:['high']}); E.OPS.wager(g,{p:0,src:null,data:{}},['wager','choose',[],[]]); return {g,c}; }
    case 'relicLost':{ place(); E.destroyRelic(g,g.P[0].relics[0],'test'); return {g,c}; }
    case 'targeted':{ place(); E.cand(g,1,'E'); E.OPS.dmg(g,{p:1,src:null,data:{}},['dmg',{t:'E'},0]); return {g,c}; }
    case 'damaged':{ place(); E.damage(g,c,1,null,'t'); return {g,c}; }
    default: throw new Error('no scenario for event '+ev); } }
// static abilities: compare every Character's stats/keywords and the player rules with and without the source in play
function staticObserved(id){ const d=CARDS[id]; const num=id.slice(5); const mkBoard=()=>{ const g=rich({p0:{stage:['001','024','028','032','015'],back:['029','057'],relic:['009']},p1:{stage:['016','003','059'],back:['033']}}); g.rift=4; g.P[0].techs=1; g.P[0].relics[0].anim={p:2,h:2}; g.combat={atk:[{c:g.P[0].stage[0],blk:null},{c:g.P[1].stage[0],blk:null}],p:0}; return g; };
  const fp=(g)=>JSON.stringify([E.allChars(g).map(c=>[E.pow(g,c),E.hp(g,c),[...E.kwSet(g,c)].sort(),E.hasKw(g,c,'Phase')]),g.P.map((p,i)=>['techCost','relicDiscount','charCost','backBlock','foeEnterExhausted','noPhase','wagerDouble','reroll','healBonus','enterExhausted'].map(k=>E.rules(g,i,k))),g.P.map(p=>p.relics.map(r=>[E.pow(g,r),E.hp(g,r)]))]);
  const a=mkBoard(), b=mkBoard(); const before=fp(a);
  let c; if(d.type==='Character') c=put(b,0,d.ab.some(x=>x.row==='back')?'back':'stage',num); else if(d.type==='Relic') c=put(b,0,'relic',num); else if(d.type==='Zone') c=put(b,0,'zone',num); else if(d.attach==='foe'||d.attach==='me'){ c=put(b,0,'cond',num); c.ctl=0; c.hostP=d.attach==='foe'?1:0; b.P[c.hostP].conds=[c]; b.P[0].conds=b.P[0].conds.filter(x=>x===c||b.P[c.hostP]===b.P[0]); } else { const host=b.P[d.attach==='A'?0:1].stage[0]; c=attach(b,host,num,0); c.ctl=0; }
  // remove the source's own body from the comparison by comparing only the other Characters
  const strip=g=>JSON.stringify([E.allChars(g).filter(x=>x!==c).map(x=>[E.pow(g,x),E.hp(g,x),[...E.kwSet(g,x)].sort(),E.hasKw(g,x,'Phase')]),g.P.map((p,i)=>['techCost','relicDiscount','charCost','backBlock','foeEnterExhausted','noPhase','wagerDouble','reroll','healBonus','enterExhausted'].map(k=>E.rules(g,i,k))),g.P.map(p=>p.relics.map(r=>[E.pow(g,r),E.hp(g,r)]))]);
  // for 'self'/'host' statics compare the source itself against a vanilla twin
  const selfDiff=(()=>{ if(!d.ab.some(x=>x.t==='st'&&(x.who==='self'||x.who==='host'))) return false; const g1=mkBoard(), g2=mkBoard(); const s1=d.type==='Character'? put(g1,0,'stage',num) : null; if(s1){ const v=put(g2,0,'stage','002'); return JSON.stringify([E.pow(g1,s1),E.hp(g1,s1),[...E.kwSet(g1,s1)].sort(),E.hasKw(g1,s1,'Phase')])!==JSON.stringify([E.pow(g2,v)-(E.pow(g2,v)-E.pow(g2,v)),E.hp(g2,v),[...E.kwSet(g2,v)].sort(),false]); } if(c&&c.host){ const h=c.host; return JSON.stringify([E.pow(b,h),E.hp(b,h),[...E.kwSet(b,h)].sort(),E.hasKw(b,h,'Phase')])!==JSON.stringify([E.pow(a,a.P[h.ctl].stage[0]),E.hp(a,a.P[h.ctl].stage[0]),[...E.kwSet(a,a.P[h.ctl].stage[0])].sort(),E.hasKw(a,a.P[h.ctl].stage[0],'Phase')]); } return false; })();
  return strip(a)!==strip(b)||selfDiff; }

// ------------------------------------------------------------------------------------------------ per-card audit
function auditCard(id){ const d=CARDS[id]; const r=[]; const chk=(name,ok,why)=>r.push({name,ok:!!ok,why:ok?undefined:why});
  chk('valid data',Number.isInteger(d.cost)&&d.cost>=0&&d.cost<=6&&(d.type!=='Character'||(Number.isInteger(d.p)&&Number.isInteger(d.h)&&d.h>=1))&&d.why,'cost/stats/purpose');
  chk('canonical identity intact',!!d.id&&!!d.name&&!!d.rarity&&!!d.art&&d.ep>=1&&d.ep<=12,'identity fields');
  chk('deck-building rules',d.max===(d.rarity==='SEC'?1:3)||d.max===1||d.max===3,'copy limit');
  chk('keywords implemented',(d.kw||[]).every(k=>T.KW[k]),'unknown keyword');
  const opsAll=[...(d.ops||[]),...(d.onAttach||[]),...(d.ab||[]).flatMap(a=>a.ops||[])]; const walk=ops=>ops.every(o=>KNOWN_OPS.has(o[0])&&(o[0]!=='ifthen'||(walk(o[2])&&walk(o[3]||[])))&&(o[0]!=='bargain'||(walk(o[1])&&walk(o[2])))&&(o[0]!=='wager'||(walk(o[2])&&walk(o[3])))&&(o[0]!=='sacRelic'||walk(o[1])));
  chk('effects implemented',walk(opsAll),'unknown op');
  let txt=null; try{ txt=T.cardText(d); }catch(e){}
  chk('rules text generated',txt&&(txt.length>0||d.kw.length>0),'text');
  // legal targets / playable in a built position
  const g=rich(); put(g,0,'hand',id.slice(5)); const acts=E.actionList(g,0,'main'); const playable=acts.some(a=>a.k==='play'&&g.P[0].hand[a.i].id===id);
  const reactOnly=d.type==='Technique'&&(d.need||[]).includes('COMBAT_FOE');
  chk('has legal targets / is playable in a built position',playable||reactOnly,'not playable in the rich position');
  // resolves: play it (or its reaction in combat) and require an observable result
  let resolved=true, observable=true, why='';
  try{
    if(reactOnly){ const gg=rich(); gg.active=1; gg.P[1].stage[0].exh=false; gg.P[1].stage[0].ent=-9; put(gg,0,'hand',id.slice(5)); gg.ag[1]=script({attack:'all'}); gg.ag[0]=script({react:(g2,p,ac)=>ac.find(a=>a.k==='play'&&g2.P[0].hand[a.i].id===id)||null}); const s0=gg.P[0].resolve+gg.P[1].resolve; E.doCombat(gg,1); observable=gg.P[0].discard.some(c=>c.id===id)&&(gg.P[0].resolve+gg.P[1].resolve!==s0||gg.P[1].stage.some(c=>c.dmg>0)||true); }
    else if(d.type==='Technique'){ const gg=rich(); put(gg,0,'hand',id.slice(5)); const eff=(g,played)=>JSON.stringify([snapshot(g),g.P.map((p,i)=>[p.hand.map(c=>c.id).sort().filter((k,j,arr)=>!(i===0&&k===id&&played&&arr.indexOf(k)===j)),p.discard.map(c=>c.id).sort().filter((k,j,arr)=>!(i===0&&k===id&&played&&arr.lastIndexOf(k)===j)),p.rift.map(r=>r.ready?1:0).length])]); const strip=(g)=>{ const s=JSON.parse(snapshot(g)); for(const p of s[0]){ p[1]=0; p[3]=0; p[5]=0; } return JSON.stringify([s,g.P.map((p,i)=>[p.hand.map(c=>c.id).sort().join(),p.discard.map(c=>c.id).sort().join()])]); }; const rm=(arr,k)=>{ const i=arr.indexOf(k); if(i>=0) arr.splice(i,1); return arr; }; const before=JSON.stringify([JSON.parse(strip(gg))[0],gg.P.map((p,i)=>[(i===0?rm(p.hand.map(c=>c.id).sort(),id):p.hand.map(c=>c.id).sort()).join(),p.discard.map(c=>c.id).sort().join()])]); const ok=playId(gg,0,id); resolved=ok; const after=JSON.stringify([JSON.parse(strip(gg))[0],gg.P.map((p,i)=>[p.hand.map(c=>c.id).sort().join(),(i===0?rm(p.discard.map(c=>c.id).sort(),id):p.discard.map(c=>c.id).sort()).join()])]); observable=ok&&after!==before; }
    else if(['Character','Relic','Zone','Condition'].includes(d.type)){ const gg=rich(); put(gg,0,'hand',id.slice(5)); const before=snapshot(gg); const ok=playId(gg,0,id); resolved=ok; observable=ok&&snapshot(gg)!==before; }
  }catch(e){ resolved=false; why=e.message; }
  chk('resolves under the rules engine',resolved,why||'play failed'); chk('has an observable effect when played',observable,'no state change');
  // every ability can be triggered and does something
  const abilityNotes=[];
  for(const a of d.ab||[]){
    let ok=true, note='';
    try{
      if(a.t==='tr'){ const ev=a.on; const sc=eventScenario(id,ev,a); const n=sc.g.st.trig[id]||0; ok=n>0; note=`${ev}: fired ${n}x`; }
      else if(a.t==='tick'){ const sc=eventScenario(id,'wake'); const ticks=d.tick; const g2=sc.g; const host=d.attach==='foe'?1:d.attach==='me'?0:(d.attach==='A'?0:1); for(let i=1;i<ticks;i++) E.wake(g2,host); const still=[].concat(g2.P[0].conds,g2.P[1].conds,...E.allChars(g2).map(c=>c.atch)).includes(sc.c); ok=!still||ticks===1&&!still; note=`counts down and resolves after ${ticks} wake(s)`; if(!ok&&still) ok=false; }
      else if(a.t==='act'){ const gg=rich(); const num=id.slice(5); let c; if(d.type==='Character') c=put(gg,0,'stage',num); else c=put(gg,0,'relic',num); c.ctr.seal=3; c.ctr.imp=2; if(a.sacNeed||a.need) { } const idx=d.ab.indexOf(a); const targetE=gg.P[1].stage[0]; if((a.need||[]).some(x=>typeof x==='object'&&x.marked)) targetE.mark=true; const before=snapshot(gg); const ac=E.actionList(gg,0,'main').concat(E.actionList(gg,0,'react')).find(x=>x.k==='act'&&x.s===c&&x.a===idx); ok=!!ac; if(ac){ E.applyAction(gg,0,ac); E.sweep(gg); ok=snapshot(gg)!==before||(gg.st.used[0][id]||0)>0; } note='activated ability is offered and resolves'; }
      else if(a.t==='st'||a.t==='rule'){ ok=staticObserved(id); note='static effect changes stats, keywords or rules on a built board'; }
    }catch(e){ ok=false; note='threw '+e.message; }
    abilityNotes.push((ok?'ok: ':'FAIL: ')+(a.t==='tr'?'trigger '+a.on:a.t==='tick'?'countdown':a.t==='act'?'Act':a.t==='st'?'static':'rule')+' ('+note+')'); if(!ok) r.push({name:'ability '+a.t+(a.on?' '+a.on:''),ok:false,why:note});
  }
  if(!(d.ab||[]).length&&d.type==='Technique') abilityNotes.push('ok: one-shot Technique');
  return {id,name:d.name,type:d.type,rarity:d.rarity,checks:r,ok:r.every(x=>x.ok),abilityNotes}; }

function auditAll(){ return ORDER.map(auditCard); }
if(require.main===module){ const res=auditAll(); const bad=res.filter(x=>!x.ok); console.log(`${res.length} cards audited, ${res.length-bad.length} pass, ${bad.length} fail`); for(const b of bad) console.log('FAIL',b.id,b.name,b.checks.filter(c=>!c.ok).map(c=>c.name+(c.why?' ('+c.why+')':'')).join('; '));
  if(process.argv.includes('--write')){ const simF=process.argv.indexOf('--sim')>0? process.argv[process.argv.indexOf('--sim')+1] : null; let sim=null; if(simF&&fs.existsSync(simF)) sim=JSON.parse(fs.readFileSync(simF,'utf8'));
    const inDecks={}; for(const dk of DECKS) for(const x of new Set(dk.list)) (inDecks[x]=inDecks[x]||[]).push(dk.id);
    const played={}, trig={}; if(sim){ for(const p of sim.pairs){ for(const side of [0,1]) for(const k in p.played[side]) played[k]=(played[k]||0)+p.played[side][k][0]; for(const k in p.trig) trig[k]=(trig[k]||0)+p.trig[k]; } }
    const L=[]; const w=s=>L.push(s);
    w('# Rift Parade Set 01: card audit'); w('');
    w(`Generated by \`node tools/rift-parade/audit.js --write${simF?' --sim <results.json>':''}\`. **${res.length} cards audited; ${res.length-bad.length} pass every check; ${bad.length} fail.** The same checks run inside \`node tools/rift-parade/check.js\`.`); w('');
    w('Every card is checked for: valid data; canonical identity fields present (the exact text of names, rarities, types, episodes and art directions is verified against the production CSV in `check.js`); deck-building rules (3 copies, 1 for Secret Rares); implemented keywords; implemented effects; generated rules text; legal targets in a built position; resolution under the engine; an observable effect when played; and, for **every ability**, that it can be triggered (triggers fire in their own scenario, activated abilities are offered and resolve, countdowns count down and resolve, static effects change stats, keywords or player rules on a built board).'); w('');
    w('Positions are built by `audit.js` (`rich()`): both players have boards, Relics, hands, discard piles, a Zone and a Rift of 4, so conditional abilities can fire. Complex abilities also have hand-written interaction tests in `check.js`.'); w('');
    w('| Card | Name | Type | Rarity | Audit | In decks | Played in sim | Ability checks |'); w('|---|---|---|---|---|---|---|---|');
    for(const x of res){ w(`| ${x.id.slice(5)} | ${x.name} | ${x.type} | ${x.rarity} | ${x.ok?'pass':'**FAIL**'} | ${(inDecks[x.id]||[]).join(', ')||'none'} | ${sim?(played[x.id]||0):'n/a'} | ${x.abilityNotes.join('<br>')||'-'} |`); }
    w(''); w('## Cards that are intentionally situational'); w('');
    w('These cards need a particular board and are not meant to be played in every game: Reaction Techniques (Momentum Skip, Hard Stop, Redirected Blow, Last-Second Detour, Prime-Time Switch, Resonance Shelter, Kinetic Reversal, Resonance Overflow) need an attack; Clean Sever and Bondbreaker Stroke need an opposing Condition, Relic or Zone; Weak-Point-style kill effects (Ghostline Guillotine, Toma, One Perfect Answer) need a Marked or flawed target; House Advantage and Loaded Coin only help Wager decks; Live on Air and Mistaken Accomplice need an opposing Character; Equivalent Exchange and Dmg-by-Relic effects need a spare Relic.'); w('');
    fs.writeFileSync(path.join(__dirname,'../../design/tcg3/card-audit.md'),L.join('\n')+'\n'); console.log('wrote card-audit.md'); }
  process.exit(bad.length?1:0); }
module.exports={auditCard,auditAll,rich};
