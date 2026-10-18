// Helpers for hand-built test positions. scene({...}) returns a game with exactly the cards you describe.
'use strict';
const E=require('./engine.js'); const {NUM}=require('./cards.js');
const id=n=>typeof n==='number'||/^\d+$/.test(n)? NUM[String(n).padStart(3,'0')].id : n;
const FILLER=NUM['004'].id;   // a Zone nobody ever draws in a test that matters
// scripted agent: answers come from queues; anything not queued uses the first option / pass
function script(o){ o=o||{}; const q=o.choices||[]; return {name:'script',mulligan:()=>[],
  choose(g,p,kind,opts,ctx){ if(o.pick){ const r=o.pick(g,p,kind,opts,ctx); if(r!==undefined) return r; } if(q.length){ const want=q.shift(); if(typeof want==='function'){ const i=opts.findIndex(want); return i<0?0:i; } const i=opts.findIndex(x=>x===want||(x&&x.id===want)||(x&&x.card&&x.card.id===want)); return i<0?0:i; } return 0; },
  main:(g,p,acts)=>({k:'pass'}), attack:(g,p,av)=>o.attack? av.filter(c=>o.attack.includes(c.id)||o.attack==='all') : [], block:(g,p,atk,bl)=>o.block? o.block(g,p,atk,bl) : {}, react:(g,p,acts)=>o.react? o.react(g,p,acts) : null}; }
function put(g,p,zone,idn,extra){ const c=E.mk(g,id(idn),p); c.ent=-9; if(extra) Object.assign(c,extra); const pl=g.P[p];
  switch(zone){ case 'stage': pl.stage.push(c); break; case 'back': pl.back.push(c); break; case 'hand': pl.hand.push(c); break; case 'relic': pl.relics.push(c); break; case 'discard': pl.discard.push(c); break;
    case 'rift': pl.rift.push({card:c,ready:true}); break; case 'deck': pl.deck.unshift(c); break; case 'zone': g.zone=c; c.ctl=p; break; case 'cond': c.host=null; c.hostP=p; c.tick=E.CARDS[c.id].tick||0; pl.conds.push(c); c.ctl=1-p; break; }
  return c; }
function attach(g,host,idn,caster){ const c=E.mk(g,id(idn),caster===undefined?1-host.ctl:caster); c.ctl=caster===undefined?1-host.ctl:caster; c.host=host; c.tick=E.CARDS[c.id].tick||0; host.atch.push(c); return c; }
// spec: {rift:n, active:0, turn:n, p0:{stage:[..],back:[..],hand:[..],relic:[..],discard:[..],rift:n(ready energy),deck:[top..],resolve:n}, p1:{..}, zone:id}
function scene(spec){ spec=spec||{}; const filler=Array(40).fill(FILLER); const g=E.newGame(filler,filler,spec.seed||1,{first:0,nolog:false}); E.setAgents(g,script(spec.a0),script(spec.a1));
  for(const p of [0,1]){ const pl=g.P[p]; pl.deck=[]; for(let i=0;i<30;i++) pl.deck.push(E.mk(g,FILLER,p)); const s=spec['p'+p]||{};
    for(const z of ['stage','back','hand','relic','discard']) for(const c of (s[z]||[])) put(g,p,z,c);
    for(let i=0;i<(typeof s.rift==='number'?s.rift:0);i++) put(g,p,'rift',FILLER);
    for(const c of (s.deck||[]).slice().reverse()) put(g,p,'deck',c); if(s.resolve!==undefined) pl.resolve=s.resolve; }
  g.rift=spec.rift||0; g.active=spec.active||0; g.turn=spec.turn||5; g.round=3; g.first=0; g.anom=spec.anom||'echo'; if(spec.zone) put(g,spec.zoneOwner||0,'zone',spec.zone); return g; }
const inStage=(g,p,idn)=>g.P[p].stage.find(c=>c.id===id(idn)), inBack=(g,p,idn)=>g.P[p].back.find(c=>c.id===id(idn));
const handIdx=(g,p,idn)=>g.P[p].hand.findIndex(c=>c.id===id(idn));
// play a card from hand by id (pays energy); returns false if it was not legal
function playId(g,p,idn,opt){ const i=handIdx(g,p,idn); if(i<0) throw new Error('not in hand: '+idn); const acts=E.actionList(g,p,opt&&opt.window||'main'); const a=acts.find(x=>x.k==='play'&&x.i===i&&(!opt||!opt.row||x.row===opt.row)&&(!opt||!opt.upgrade||(x.upgrade&&x.upgrade.id===id(opt.upgrade)))); if(!a) return false; E.applyAction(g,p,a); E.sweep(g); return true; }
function actId(g,p,src,idx){ const acts=E.actionList(g,p,'main').concat(E.actionList(g,p,'react')); const a=acts.find(x=>x.k==='act'&&x.s===src&&(idx===undefined||x.a===idx)); if(!a) return false; E.applyAction(g,p,a); E.sweep(g); return true; }
module.exports={scene,put,attach,script,id,inStage,inBack,handIdx,playId,actId,E,FILLER};
