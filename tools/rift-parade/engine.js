// Rift Parade rules engine (headless). Rules: design/tcg3/rules.md. Cards: cards.js. Parameters: rules.json.
// The whole game state `g` is plain data (cloneable with structuredClone); agents live outside it (g.ag, non-enumerable).
// Everything random comes from g.rs (mulberry32), so a game is reproducible from its seed and the two decks.
'use strict';
const {CARDS}=require('./cards.js');
const RULES=require('./rules.json');

// ---------------------------------------------------------------- random numbers
const mix=seed=>{ let h=(seed>>>0)^0x9e3779b9; h=Math.imul(h^(h>>>16),0x85ebca6b); h=Math.imul(h^(h>>>13),0xc2b2ae35); return (h^(h>>>16))|0; };
function rnd(g){ g.rs=(g.rs+0x6D2B79F5)|0; let t=Math.imul(g.rs^(g.rs>>>15),1|g.rs); t=(t+Math.imul(t^(t>>>7),61|t))^t; return ((t^(t>>>14))>>>0)/4294967296; }
function shuffle(g,a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(rnd(g)*(i+1)); const t=a[i]; a[i]=a[j]; a[j]=t; } return a; }

// ---------------------------------------------------------------- anomalies (the Rift's reality shifts)
const ANOMALIES={
  gravity:{name:'Gravity Fault', text:'Each Character takes 1 damage.', run(g){ for(const c of allChars(g)) damage(g,c,g.R.anomalyDamage,null,'anomaly'); sweep(g); }},
  bleed:{name:'Static Bleed', text:'Each player loses 2 Resolve.', run(g){ for(const p of [g.active,1-g.active]) loseResolve(g,p,g.R.anomalyBleed,'anomaly'); }},
  rowslip:{name:'Row Slip', text:'Each player moves their highest-Power Stage Character Backstage, if there is room.', run(g){ for(const p of [0,1]){ const pl=g.P[p]; if(pl.back.length>=g.R.backMax||!pl.stage.length) continue; const c=pl.stage.slice().sort((a,b)=>pow(g,b)-pow(g,a)||a.u-b.u)[0]; moveRow(g,c,'back'); } }},
  overflow:{name:'Overflow', text:'Each player has 2 extra energy on their next turn.', run(g){ for(const pl of g.P) pl.nextEnergy+=g.R.anomalyOverflow; }},
  echo:{name:'Echo Hour', text:'Each player draws a card.', run(g){ for(const p of [g.active,1-g.active]) draw(g,p,1); }},
  reset:{name:'Blank Page', text:'The Zone and every Condition are destroyed.', run(g){ if(g.zone) destroyZone(g); for(const c of allChars(g)) for(const a of c.atch.slice()) removeCond(g,a); for(const pl of g.P) for(const a of pl.conds.slice()) removeCond(g,a); }},
};
const ANOM_KEYS=Object.keys(ANOMALIES);

// ---------------------------------------------------------------- helpers
const def=c=>CARDS[c.id];
const L=(g,m)=>{ if(!g.nolog) g.log.push(`[T${g.turn} P${g.active}] ${m}`); };
const nm=c=>def(c).name;
function mk(g,id,owner){ return {u:++g.uid, id, owner, ctl:owner, dmg:0, ctr:{}, buf:[], atch:[], exh:false, ent:-9, used:-9, mark:false, sil:-9, shield:false, anim:null, tick:0, host:null, hostP:null}; }
const chars=(g,p)=>g.P[p].stage.concat(g.P[p].back);
const allChars=g=>chars(g,g.active).concat(chars(g,1-g.active));
const isChar=c=>def(c).type==='Character';
function rowOf(g,c){ const pl=g.P[c.ctl]; return pl.stage.includes(c)?'stage':pl.back.includes(c)?'back':null; }
const inPlayChar=(g,c)=>!!rowOf(g,c);
function inPlay(g,c){ if(rowOf(g,c)) return true; const pl=g.P[c.ctl]; if(pl.relics.includes(c)||g.P[0].conds.includes(c)||g.P[1].conds.includes(c)) return true; if(g.zone===c) return true; for(const q of g.P) for(const h of q.stage.concat(q.back)) if(h.atch.includes(c)) return true; return false; }
function energy(g,p){ const pl=g.P[p]; let n=pl.temp; for(const r of pl.rift) if(r.ready) n++; return n; }
function silenced(g,c){ return g.turn<=c.sil; }

// ---------------------------------------------------------------- sources, statics, rules
function sources(g){ const s=[]; for(const pl of g.P){ for(const c of pl.stage.concat(pl.back)){ s.push(c); for(const a of c.atch) s.push(a); } for(const r of pl.relics) s.push(r); for(const a of pl.conds) s.push(a); } if(g.zone) s.push(g.zone); return s; }
function statSrc(g){ const s=[]; for(const pl of g.P){ for(const c of pl.stage.concat(pl.back)){ if(CARDS[c.id].hasSt) s.push(c); for(const a of c.atch) if(CARDS[a.id].hasSt) s.push(a); } for(const r of pl.relics) if(CARDS[r.id].hasSt) s.push(r); for(const a of pl.conds) if(CARDS[a.id].hasSt) s.push(a); } if(g.zone&&CARDS[g.zone.id].hasSt) s.push(g.zone); return s; }
function abilities(g,s){ // abilities of a source in play (a silenced Character loses them; its row limits Backstage-only ones)
  const d=def(s); if(!d.ab) return []; if(isChar(s)){ if(silenced(g,s)) return []; const row=rowOf(g,s); return d.ab.filter(a=>!a.row||a.row===row); } return d.ab; }
function condOk(g,s,k){ if(!k) return true; const [w,op,v]=k; let x;
  switch(w){
    case 'and': return k.slice(1).every(q=>condOk(g,s,q));
    case 'not': return !condOk(g,s,k[1]);
    case 'rift': x=g.rift; break;
    case 'stage': x=g.P[s.ctl].stage.length; break;
    case 'chars': x=chars(g,s.ctl).length; break;
    case 'foeChars': x=chars(g,1-s.ctl).length; break;
    case 'techs': x=g.P[s.ctl].techs; break;
    case 'relics': x=g.P[s.ctl].relics.length; break;
    case 'resolve': x=g.P[s.ctl].resolve; break;
    case 'foeResolve': x=g.P[1-s.ctl].resolve; break;
    case 'hand': x=g.P[s.ctl].hand.length; break;
    case 'foeHand': x=g.P[1-s.ctl].hand.length; break;
    case 'rift pool': x=g.P[s.ctl].rift.length; break;
    case 'myTurn': return g.active===s.ctl;
    case 'zoneMine': return !!g.zone&&g.zone.ctl===s.ctl;
    case 'marked': return !!(s.host||s).mark;
    case 'hostMarked': return !!(s.host&&s.host.mark);
    case 'kwAlly': x=chars(g,s.ctl).filter(c=>c!==s&&hasKw(g,c,v)).length; return cmp(x,'>=',1);
    case 'hasCond': return !!(s.host&&s.host.atch.length);
    case 'hasRelic': x=g.P[s.ctl].relics.length; break;
    case 'counters': x=s.ctr.seal||0; break;
    case 'impact': x=s.ctr.imp||0; break;
    case 'attacking': return !!g.combat&&g.combat.atk.some(e=>e.c===s);
    default: throw new Error('bad condition '+w);
  } return cmp(x,op,v); }
function cmp(x,op,v){ return op==='>='?x>=v:op==='<='?x<=v:op==='>'?x>v:op==='<'?x<v:op==='=='?x===v:false; }
function appliesTo(g,s,a,t){ // does static `a` of source s apply to Character-like target t?
  const sc=s.ctl, tc=t.ctl, st=!!rowOf(g,t); let ok=false;
  switch(a.who){
    case 'self': ok=s===t; break;
    case 'host': ok=s.host===t; break;
    case 'ally': ok=sc===tc; break;
    case 'allyOther': ok=sc===tc&&s!==t; break;
    case 'allyStage': ok=sc===tc&&rowOf(g,t)==='stage'; break;
    case 'allyBack': ok=sc===tc&&rowOf(g,t)==='back'; break;
    case 'foe': ok=sc!==tc; break;
    case 'foeStage': ok=sc!==tc&&rowOf(g,t)==='stage'; break;
    case 'all': ok=true; break;
    case 'animAlly': ok=sc===tc&&!!t.anim; break;
    default: ok=false; }
  if(!ok) return false; if(a.f && !matchF(g,t,a.f,s)) return false; if(a.if && !condOk(g,s,a.if)) return false; return true; }
function matchF(g,c,f,src){
  if(f.stage&&rowOf(g,c)!=='stage') return false; if(f.back&&rowOf(g,c)!=='back') return false;
  if(f.marked&&!c.mark) return false; if(f.unmarked&&c.mark) return false;
  if(f.maxCost!==undefined&&def(c).cost>f.maxCost) return false; if(f.minCost!==undefined&&def(c).cost<f.minCost) return false;
  if(f.kw&&!printed(g,c,f.kw)) return false; if(f.noKw&&printed(g,c,f.noKw)) return false;
  if(f.other&&src&&c===src) return false; if(f.cond&&!c.atch.length) return false;
  if(f.weak&&!(c.mark||c.atch.length||hasKw(g,c,'Phase')||hasKw(g,c,'Haunt')||silenced(g,c))) return false;
  if(f.attacking&&!(g.combat&&g.combat.atk.some(e=>e.c===c))) return false; if(f.damaged&&!c.dmg) return false; if(f.ready&&c.exh) return false; if(f.char&&def(c).char!==f.char) return false; return true; }
function printed(g,c,k){ return isChar(c)&&!silenced(g,c)&&(def(c).kw||[]).includes(k); }
function kwSet(g,c){ const out=new Set(); if(isChar(c)&&!silenced(g,c)) for(const k of def(c).kw||[]) out.add(k);
  for(const s of statSrc(g)){ for(const a of abilities(g,s)) if(a.t==='st'&&a.kw&&appliesTo(g,s,a,c)) for(const k of a.kw) out.add(k);
    for(const a of abilities(g,s)) if(a.t==='st'&&a.noKw&&appliesTo(g,s,a,c)) for(const k of a.noKw) out.delete(k); }
  return out; }
function hasKw(g,c,k){ const s=kwSet(g,c); if(!s.has(k)) return false; if(k==='Phase'){ if(c.mark||g.rift<g.R.phaseMinRift||rules(g,c.ctl,'noPhase')>0) return false; } return true; }
function pow(g,c){ let n=c.anim? c.anim.p : (def(c).p||0); n+=c.ctr.p||0; for(const b of c.buf) n+=b.p;
  for(const s of statSrc(g)) for(const a of abilities(g,s)) if(a.t==='st'&&a.p&&appliesTo(g,s,a,c)) n+=a.p;
  if(!c.anim){ const ks=kwSet(g,c);
    if(ks.has('Momentum')) n+=Math.min(g.R.momentumCap,g.P[c.ctl].techs);
    if(ks.has('Resonance')) n+=Math.min(g.R.resonanceCap,chars(g,c.ctl).filter(o=>o!==c&&hasKw(g,o,'Resonance')).length); }
  return Math.max(0,n); }
function hp(g,c){ let n=c.anim? c.anim.h : (def(c).h||0); n+=c.ctr.h||0; for(const b of c.buf) n+=b.h;
  for(const s of statSrc(g)) for(const a of abilities(g,s)) if(a.t==='st'&&a.h&&appliesTo(g,s,a,c)) n+=a.h;
  if(!c.anim&&kwSet(g,c).has('Resonance')) n+=Math.min(g.R.resonanceCap,chars(g,c.ctl).filter(o=>o!==c&&hasKw(g,o,'Resonance')).length);
  return n; }
function rules(g,p,key){ let n=0; for(const s of statSrc(g)) for(const a of abilities(g,s)) if(a.t==='rule'&&a.rule===key){
    const sc=a.scope||'me'; const hostP=s.host? s.host.ctl : s.hostP;
    const ok= sc==='both' || (sc==='me'&&s.ctl===p&&hostP===null) || (sc==='foe'&&s.ctl!==p) || (sc==='host'&&hostP===p) || (sc==='me'&&s.ctl===p&&hostP!==null&&a.me);
    if(ok&&(!a.if||condOk(g,s,a.if))) n+=a.n===undefined?1:a.n; } return n; }
function cost(g,p,card){ const d=def(card); let c=d.cost; if(d.type==='Technique') c+=rules(g,p,'techCost'); if(d.type==='Relic') c-=rules(g,p,'relicDiscount'); if(d.type==='Character') c+=rules(g,p,'charCost'); c-=g.P[p].disc; c+=g.P[p].tax; return Math.max(0,c); }

// ---------------------------------------------------------------- state changes
function loseResolve(g,p,n,why){ if(n<=0||g.winner!==null&&g.winner!==undefined&&g.over) return; const pl=g.P[p]; pl.resolve-=n; L(g,`P${p} loses ${n} Resolve (${pl.resolve})${why?' - '+why:''}`); checkEnd(g,p); }
function checkEnd(g,p){ if(g.over) return; const dead=[0,1].filter(q=>g.P[q].resolve<=0); if(!dead.length) return; g.over=true; if(dead.length===2){ g.winner=-1; g.why='both'; } else { g.winner=1-dead[0]; g.why='resolve'; } }
function heal(g,p,n){ const pl=g.P[p]; n+=rules(g,p,'healBonus'); const before=pl.resolve; pl.resolve=Math.min(g.R.resolve,pl.resolve+n); if(pl.resolve!==before) L(g,`P${p} restores ${pl.resolve-before} Resolve (${pl.resolve})`); }
function draw(g,p,n){ const pl=g.P[p]; for(let i=0;i<n;i++){ if(g.over) return; if(!pl.deck.length){ g.over=true; g.winner=1-p; g.why='deck'; L(g,`P${p} cannot draw and loses`); return; } pl.hand.push(thaw(g,pl.deck.shift())); pl.drawn++; } }
function setRift(g,n){ const before=g.rift; g.rift=Math.max(0,Math.min(g.R.riftMax,n)); if(g.rift!==before&&!g.nolog) L(g,`Rift ${before} -> ${g.rift}`); if(g.rift>g.st.maxRift) g.st.maxRift=g.rift; if(g.rift>=g.R.riftMax) fireAnomaly(g); }
function fireAnomaly(g){ const a=ANOMALIES[g.anom]; L(g,`ANOMALY: ${a.name} - ${a.text}`); g.rift=g.R.riftReset; g.anomalies++; a.run(g); fire(g,'anomaly',{}); g.anom=ANOM_KEYS[Math.floor(rnd(g)*ANOM_KEYS.length)]; }
function moveRow(g,c,to){ const pl=g.P[c.ctl]; const from=rowOf(g,c); if(!from||from===to) return false; const dst=to==='stage'?pl.stage:pl.back, max=to==='stage'?g.R.stageMax:g.R.backMax; if(dst.length>=max) return false; (from==='stage'?pl.stage:pl.back).splice((from==='stage'?pl.stage:pl.back).indexOf(c),1); dst.push(c); return true; }
function damage(g,c,n,src,kind){ if(n<=0) return 0; if(c.shield) { L(g,`${nm(c)}'s damage is prevented`); return 0; }
  if(c.anim){ c.dmg+=n; return n; }
  if(c.mark) n+=1; for(const s of statSrc(g)) for(const a of abilities(g,s)) if(a.t==='rule'&&a.rule==='bonusDamageTo'&&matchF(g,c,a.f||{},s)&&((a.scope||'foe')==='foe'?s.ctl!==c.ctl:s.ctl===c.ctl)) n+=a.n;
  c.dmg+=n; L(g,`${nm(c)} takes ${n}`); const ks=kwSet(g,c); if(ks.has('Absorb')) c.ctr.imp=Math.min(absorbCap(g,c),(c.ctr.imp||0)+n);
  for(const o of chars(g,c.ctl)) if(o!==c&&kwSet(g,o).has('Reservoir')) o.ctr.imp=Math.min(absorbCap(g,o),(o.ctr.imp||0)+n);
  fire(g,'damaged',{card:c,n,src}); return n; }
function absorbCap(g,c){ return kwSet(g,c).has('Reservoir')? 10 : g.R.absorbCap; }
function sweep(g){ // state-based: defeat every Character with damage >= health, repeat until stable
  if(g.sweeping) return; g.sweeping=true; try{ sweep2(g); } finally { g.sweeping=false; } }
function sweep2(g){
  for(let guard=0;guard<10;guard++){ if(g.over) return; const dead=[]; for(const c of allChars(g)) if(!c.dying&&c.dmg>=hp(g,c)) dead.push(c);
    const dr=[]; for(const p of [0,1]) for(const r of g.P[p].relics) if(r.anim&&r.dmg>=r.anim.h) dr.push(r);
    if(!dead.length&&!dr.length) return; for(const c of dead) defeat(g,c); for(const r of dr) destroyRelic(g,r,'defeated'); } }
function defeat(g,c){ if(!inPlayChar(g,c)||c.dying) return; c.dying=true; L(g,`${nm(c)} is defeated`); const ev={card:c}; fire(g,'defeat',ev); if(!inPlayChar(g,c)){ c.dying=false; return; }
  const pl=g.P[c.ctl], row=rowOf(g,c); (row==='stage'?pl.stage:pl.back).splice((row==='stage'?pl.stage:pl.back).indexOf(c),1);
  for(const a of c.atch) g.P[a.ctl].discard.push(a); c.atch=[];
  const haunt=kwSet(g,c).has('Haunt'); resetCard(c);
  const op=g.P[c.owner]; if(haunt&&op.rift.length<g.R.energyCap){ op.rift.push({card:c,ready:false}); L(g,`${nm(c)} haunts the Rift pool of P${c.owner}`); } else op.discard.push(c); }
function resetCard(c){ c.dying=false; c.dmg=0; c.ctr={}; c.buf=[]; c.mark=false; c.exh=false; c.sil=-9; c.shield=false; c.anim=null; c.used=-9; c.ctl=c.owner; }
function leaveToHand(g,c){ const pl=g.P[c.ctl], row=rowOf(g,c); (row==='stage'?pl.stage:pl.back).splice((row==='stage'?pl.stage:pl.back).indexOf(c),1); for(const a of c.atch) g.P[a.ctl].discard.push(a); c.atch=[]; resetCard(c); g.P[c.owner].hand.push(c); }
function removeCond(g,a){ if(a.host){ const i=a.host.atch.indexOf(a); if(i>=0) a.host.atch.splice(i,1); } else { const pl=g.P[a.hostP]; const i=pl.conds.indexOf(a); if(i>=0) pl.conds.splice(i,1); } a.host=null; a.hostP=null; g.P[a.owner].discard.push(a); }
function destroyRelic(g,r,why){ const pl=g.P[r.ctl]; const i=pl.relics.indexOf(r); if(i<0) return; pl.relics.splice(i,1); L(g,`${nm(r)} is destroyed`); r.anim=null; r.dmg=0; r.used=-9; g.P[r.owner].discard.push(r); fire(g,'relicLost',{card:r,pl:r.ctl,why}); }
function destroyZone(g){ if(!g.zone) return; L(g,`${nm(g.zone)} is destroyed`); g.P[g.zone.owner].discard.push(g.zone); g.zone=null; }

// ---------------------------------------------------------------- agents and choices
function agent(g,p){ return g.ag[p]; }
function choose(g,p,kind,opts,ctx){ if(!opts.length) return null; if(opts.length===1&&!ctx.ask) return opts[0]; const i=agent(g,p).choose(g,p,kind,opts,ctx||{}); return opts[Math.max(0,Math.min(opts.length-1,i|0))]; }

// ---------------------------------------------------------------- targeting
function cand(g,p,spec){ const o=typeof spec==='string'?{t:spec}:spec; let t=o.t; const all=t.startsWith('ALL_'); if(all) t=t.slice(4);
  let list; const my=chars(g,p), their=chars(g,1-p);
  switch(t){ case 'E': list=their; break; case 'ES': list=g.P[1-p].stage.slice(); break; case 'A': list=my; break; case 'AS': list=g.P[p].stage.slice(); break; case 'X': list=my.concat(their); break; case 'XS': list=g.P[p].stage.concat(g.P[1-p].stage); break; default: list=[]; }
  list=list.filter(c=>matchF(g,c,o,o.src));
  if(!all&&(t==='E'||t==='ES'||t==='X'||t==='XS')){ const sp=list.filter(c=>c.ctl!==p&&rowOf(g,c)==='stage'&&hasKw(g,c,'Spotlight')); if(sp.length) list=list.filter(c=>c.ctl===p||sp.includes(c)); }
  return {list,all}; }
function pickT(g,ctx,spec,op){ if(spec==='SELF') return ctx.src&&isChar(ctx.src)&&inPlayChar(g,ctx.src)? [ctx.src] : []; if(spec==='HOST') return ctx.src&&ctx.src.host&&inPlayChar(g,ctx.src.host)? [ctx.src.host] : [];
  if(spec==='LAST') return ctx.last&&inPlayChar(g,ctx.last)? [ctx.last] : [];
  const o=typeof spec==='string'?{t:spec}:Object.assign({},spec); o.src=ctx.src; const {list,all}=cand(g,ctx.p,o); if(all) return list; if(!list.length) return [];
  const c=choose(g,ctx.p,'target',list,{op,ctx}); if(c){ ctx.last=c; if(c.ctl!==ctx.p) fire(g,'targeted',{card:c,pl:ctx.p}); } return c?[c]:[]; }
function hasTarget(g,p,spec){ if(typeof spec==='string'){ switch(spec){
    case 'SELF': case 'LAST': case 'HOST': return true;
    case 'COMBAT_FOE': return !!g.combat&&g.combat.atk.some(e=>e.c.ctl!==p);
    case 'COND_ANY': return allChars(g).some(c=>c.atch.length)||g.P[0].conds.length+g.P[1].conds.length>0;
    case 'RELIC_ME': return g.P[p].relics.length>0;
    case 'SEVERABLE': return !!g.zone&&g.zone.ctl!==p||g.P[1-p].relics.length>0||chars(g,1-p).some(c=>c.atch.length)||g.P[1-p].conds.length>0||chars(g,p).some(c=>c.atch.some(a=>a.ctl!==p))||g.P[p].conds.some(a=>a.ctl!==p)||(!!g.zone&&g.zone.ctl===1-p);
    case 'DISCARD_CHAR': return g.P[p].discard.some(c=>isChar(c));
    case 'FOEHAND': return g.P[1-p].hand.length>0; } }
  return cand(g,p,spec).list.length>0; }

// ---------------------------------------------------------------- operations
const sel=(g,ctx,T,op)=>pickT(g,ctx,T,op);
const OPS={
  dmg(g,ctx,[_,T,n,o]){ for(const c of sel(g,ctx,T,'dmg')){ let k=n; if(o&&o.ifMarked&&c.mark) k=o.ifMarked; if(o&&o.perCharge) k=ctx.src?(ctx.src.ctr.imp||0):0; damage(g,c,k,ctx.src,'effect'); } sweep(g); },
  dmgPow(g,ctx,[_,T,o]){ const best=Math.max(0,...g.P[ctx.p].stage.map(c=>pow(g,c))); for(const c of sel(g,ctx,T,'dmg')) damage(g,c,best,ctx.src,'effect'); sweep(g); },
  hurt(g,ctx,[_,n]){ loseResolve(g,1-ctx.p,n,'effect'); },
  payLife(g,ctx,[_,n]){ loseResolve(g,ctx.p,n,'cost'); },
  heal(g,ctx,[_,n]){ heal(g,ctx.p,n); },
  draw(g,ctx,[_,n]){ draw(g,ctx.p,n); },
  foeDraw(g,ctx,[_,n]){ draw(g,1-ctx.p,n); },
  discard(g,ctx,[_,n]){ for(let i=0;i<n;i++){ const pl=g.P[ctx.p]; if(!pl.hand.length) return; const c=choose(g,ctx.p,'discard',pl.hand,{}); pl.hand.splice(pl.hand.indexOf(c),1); pl.discard.push(c); L(g,`P${ctx.p} discards ${nm(c)}`); } },
  foeDiscard(g,ctx,[_,n]){ for(let i=0;i<n;i++){ const pl=g.P[1-ctx.p]; if(!pl.hand.length) return; const c=choose(g,1-ctx.p,'discard',pl.hand,{}); pl.hand.splice(pl.hand.indexOf(c),1); pl.discard.push(c); L(g,`P${1-ctx.p} discards ${nm(c)}`); } },
  foeSacrifice(g,ctx,[_,n]){ for(let i=0;i<n;i++){ const l=chars(g,1-ctx.p); if(!l.length) return; const c=choose(g,1-ctx.p,'sacrifice',l,{}); L(g,`P${1-ctx.p} sacrifices ${nm(c)}`); defeat(g,c); } sweep(g); },
  foeSacrificeBest(g,ctx){ const l=g.P[1-ctx.p].stage; if(!l.length) return; const c=l.slice().sort((a,b)=>(pow(g,b)+hp(g,b))-(pow(g,a)+hp(g,a)))[0]; L(g,`P${1-ctx.p} sacrifices ${nm(c)}`); defeat(g,c); sweep(g); },
  pump(g,ctx,[_,T,p,h,dur]){ for(const c of sel(g,ctx,T,'pump')){ if(dur==='perm'){ c.ctr.p=(c.ctr.p||0)+p; c.ctr.h=(c.ctr.h||0)+h; } else c.buf.push({p,h}); } },
  rift(g,ctx,[_,n]){ setRift(g,g.rift+n); },
  riftPM(g,ctx,[_,n]){ const d=choose(g,ctx.p,'riftdir',[n,-n],{}); setRift(g,g.rift+d); },
  setRift(g,ctx,[_,n]){ setRift(g,n); },
  setAnomaly(g,ctx){ const k=choose(g,ctx.p,'anomaly',ANOM_KEYS,{ask:true}); g.anom=k; L(g,`The next Anomaly is now ${ANOMALIES[k].name}`); },
  fireAnomaly(g){ fireAnomaly(g); },
  energy(g,ctx,[_,n]){ g.P[ctx.p].temp+=n; },
  pull(g,ctx,[_,n]){ const pl=g.P[ctx.p]; for(let i=0;i<n;i++){ if(!pl.rift.length) return; const r=choose(g,ctx.p,'pull',pl.rift,{ask:true}); pl.rift.splice(pl.rift.indexOf(r),1); pl.hand.push(r.card); L(g,`P${ctx.p} pulls ${nm(r.card)} from the Rift pool`); } },
  slip(g,ctx,[_,n]){ const pl=g.P[ctx.p]; for(let i=0;i<n;i++){ if(!pl.hand.length||pl.rift.length>=g.R.energyCap) return; const c=choose(g,ctx.p,'slip',pl.hand,{}); pl.hand.splice(pl.hand.indexOf(c),1); pl.rift.push({card:c,ready:true}); L(g,`P${ctx.p} slips a card (extra)`); fire(g,'slip',{pl:ctx.p}); } },
  mark(g,ctx,[_,T]){ for(const c of sel(g,ctx,T,'mark')){ c.mark=true; L(g,`${nm(c)} is Marked`); } },
  unmark(g,ctx,[_,T]){ for(const c of sel(g,ctx,T,'unmark')) c.mark=false; },
  bounce(g,ctx,[_,T]){ for(const c of sel(g,ctx,T,'bounce')){ L(g,`${nm(c)} returns to hand`); if(g.combat) g.combat.atk=g.combat.atk.filter(e=>e.c!==c).map(e=>e.blk===c?Object.assign(e,{blk:null,gone:true}):e); leaveToHand(g,c); } },
  kill(g,ctx,[_,T]){ for(const c of sel(g,ctx,T,'kill')) defeat(g,c); sweep(g); },
  shove(g,ctx,[_,T]){ for(const c of sel(g,ctx,T,'shove')){ if(moveRow(g,c,'back')){ L(g,`${nm(c)} is shoved Backstage`); if(g.combat) for(const e of g.combat.atk) if(e.blk===c) e.blk=null,e.gone=true; } } },
  step(g,ctx,[_,T]){ for(const c of sel(g,ctx,T,'step')){ if(hasKw(g,c,'NoStep')) continue; const to=rowOf(g,c)==='stage'?'back':'stage'; if(moveRow(g,c,to)) L(g,`${nm(c)} steps ${to==='stage'?'onto the Stage':'Backstage'}`); } },
  stepAny(g,ctx,[_,T]){ for(const c of sel(g,ctx,T,'stepAny')){ if(hasKw(g,c,'NoStep')) continue; const to=rowOf(g,c)==='stage'?'back':'stage'; if(moveRow(g,c,to)) L(g,`${nm(c)} is moved ${to==='stage'?'onto the Stage':'Backstage'}`); } },
  tap(g,ctx,[_,T]){ for(const c of sel(g,ctx,T,'tap')){ c.exh=true; L(g,`${nm(c)} is exhausted`); } },
  ready(g,ctx,[_,T]){ for(const c of sel(g,ctx,T,'ready')) c.exh=false; },
  silence(g,ctx,[_,T]){ for(const c of sel(g,ctx,T,'silence')){ c.sil=(g.active===c.ctl? g.turn+2 : g.turn+1); L(g,`${nm(c)} is silenced`); } },
  purge(g,ctx,[_,T]){ for(const c of sel(g,ctx,T,'purge')){ for(const a of c.atch.slice()) removeCond(g,a); c.mark=false; } },
  purgeMe(g,ctx){ for(const a of g.P[ctx.p].conds.slice()) removeCond(g,a); },
  sever(g,ctx,[_,kind]){ // destroy one Condition, Relic or Zone controlled by or attached to the opponent (or any Condition)
    const opts=[]; const foe=1-ctx.p;
    if(kind==='cond'||kind==='any'){ for(const c of chars(g,foe)) for(const a of c.atch) opts.push(a); for(const a of g.P[foe].conds) opts.push(a); for(const c of chars(g,ctx.p)) for(const a of c.atch) if(a.ctl===foe) opts.push(a); for(const a of g.P[ctx.p].conds) if(a.ctl===foe) opts.push(a); }
    if(kind==='relic'||kind==='any') for(const r of g.P[foe].relics) opts.push(r);
    if(kind==='zone'||kind==='any') if(g.zone) opts.push(g.zone);
    const seen=[...new Set(opts)]; const t=choose(g,ctx.p,'sever',seen,{}); if(!t) return;
    L(g,`Sever: ${nm(t)}`); if(t===g.zone) destroyZone(g); else if(t.anim!==undefined&&g.P[t.ctl].relics.includes(t)) destroyRelic(g,t,'sever'); else removeCond(g,t); },
  severCond(g,ctx){ const opts=[]; for(const c of allChars(g)) for(const a of c.atch) opts.push(a); for(const pl of g.P) for(const a of pl.conds) opts.push(a); const t=choose(g,ctx.p,'sever',opts,{}); if(t){ L(g,`Sever: ${nm(t)}`); removeCond(g,t); } },
  animate(g,ctx,[_,p,h]){ const rl=g.P[ctx.p].relics; if(!rl.length) return; const r=choose(g,ctx.p,'relic',rl,{}); animate(g,r,p,h); },
  animateAll(g,ctx,[_,p,h]){ for(const r of g.P[ctx.p].relics.slice()) animate(g,r,p,h); },
  sacRelic(g,ctx,[_,then]){ const rl=g.P[ctx.p].relics.filter(r=>r!==ctx.src); if(!rl.length) return false; const r=choose(g,ctx.p,'relic',rl,{sac:true}); L(g,`P${ctx.p} sacrifices ${nm(r)}`); ctx.sacCost=def(r).cost; destroyRelic(g,r,'sacrifice'); run(g,then,ctx); return true; },
  dmgByRelic(g,ctx,[_,T,add]){ const rl=g.P[ctx.p].relics.filter(r=>r!==ctx.src); if(!rl.length) return; const r=choose(g,ctx.p,'relic',rl,{sac:true}); const k=def(r).cost+add; L(g,`P${ctx.p} sacrifices ${nm(r)}`); destroyRelic(g,r,'sacrifice'); for(const c of sel(g,ctx,T,'dmg')) damage(g,c,k,ctx.src,'effect'); sweep(g); },
  wager(g,ctx,[_,call,win,lose]){ wager(g,ctx,call,win,lose); },
  search(g,ctx,[_,f]){ const pl=g.P[ctx.p]; const o=pl.deck.filter(c=>matchCard(c,f)); const c=choose(g,ctx.p,'search',o,{}); if(c){ pl.deck.splice(pl.deck.indexOf(c),1); pl.hand.push(thaw(g,c)); L(g,`P${ctx.p} searches for ${nm(c)}`); } shuffle(g,pl.deck); },
  dig(g,ctx,[_,n,f]){ const pl=g.P[ctx.p]; const top=pl.deck.splice(0,n); const o=top.filter(c=>matchCard(c,f)); const c=choose(g,ctx.p,'search',o,{}); if(c){ top.splice(top.indexOf(c),1); pl.hand.push(thaw(g,c)); L(g,`P${ctx.p} finds ${nm(c)}`); } pl.deck.push(...top); },
  recur(g,ctx,[_,f,n]){ const pl=g.P[ctx.p]; for(let i=0;i<(n||1);i++){ const o=pl.discard.filter(c=>matchCard(c,f)); const c=choose(g,ctx.p,'recur',o,{}); if(!c) return; pl.discard.splice(pl.discard.indexOf(c),1); pl.hand.push(thaw(g,c)); L(g,`P${ctx.p} returns ${nm(c)} from the discard`); } },
  revive(g,ctx,[_,f,row,heal2]){ const pl=g.P[ctx.p]; const o=pl.discard.filter(c=>matchCard(c,f)); const c=choose(g,ctx.p,'recur',o,{}); if(!c) return; const r=row==='stage'&&pl.stage.length<g.R.stageMax?'stage':(pl.back.length<g.R.backMax?'back':(pl.stage.length<g.R.stageMax?'stage':null)); if(!r) return;
    pl.discard.splice(pl.discard.indexOf(c),1); enterPlay(g,thaw(g,c),ctx.p,r,{revived:true}); if(heal2) heal(g,ctx.p,heal2); },
  scry(g,ctx,[_,n]){ const pl=g.P[ctx.p]; const top=pl.deck.splice(0,n); const keep=[], bot=[]; for(const c of top){ (choose(g,ctx.p,'scry',['top','bottom'],{card:c,ask:true})==='top'?keep:bot).push(c); } pl.deck.unshift(...keep); pl.deck.push(...bot); },
  strip(g,ctx,[_,f]){ const fh=g.P[1-ctx.p].hand; if(!fh.length) return; L(g,`P${ctx.p} looks at P${1-ctx.p}'s hand`); const o=fh.filter(c=>matchCard(c,f)); const c=choose(g,ctx.p,'strip',o,{}); if(c){ fh.splice(fh.indexOf(c),1); g.P[1-ctx.p].discard.push(c); L(g,`P${1-ctx.p} discards ${nm(c)}`); } },
  steal(g,ctx,[_,f]){ const fh=g.P[1-ctx.p].hand; const o=fh.filter(c=>matchCard(c,f)); const c=choose(g,ctx.p,'strip',o,{}); if(c){ fh.splice(fh.indexOf(c),1); g.P[ctx.p].hand.push(c); L(g,`P${ctx.p} takes ${nm(c)} from P${1-ctx.p}'s hand`); } },
  peek(g,ctx){ L(g,`P${ctx.p} looks at P${1-ctx.p}'s hand`); g.P[ctx.p].seen=g.P[1-ctx.p].hand.map(c=>c.id); },
  bargain(g,ctx,[_,A,B]){ const pick=choose(g,1-ctx.p,'bargain',['A','B'],{A,B,ctx,ask:true}); L(g,`Bargain: P${1-ctx.p} chooses ${pick==='A'?'the first':'the second'} option`); run(g,pick==='A'?A:B,ctx); },
  tax(g,ctx,[_,n]){ g.P[1-ctx.p].tax+=n; },
  discount(g,ctx,[_,n]){ g.P[ctx.p].disc+=n; },
  impact(g,ctx,[_,T,n]){ for(const c of sel(g,ctx,T,'impact')) c.ctr.imp=Math.min(absorbCap(g,c),(c.ctr.imp||0)+n); },
  release(g,ctx,[_,to]){ const s=ctx.src; if(!s||!s.ctr.imp) return; const n=s.ctr.imp; s.ctr.imp=0; L(g,`${nm(s)} releases ${n} Impact`); if(to==='foe') loseResolve(g,1-ctx.p,n,'Impact'); else { for(const c of sel(g,ctx,to,'dmg')) damage(g,c,n,s,'effect'); sweep(g); } },
  prevent(g,ctx,[_,T]){ if(!g.combat) return; const list=g.combat.atk.filter(e=>e.c.ctl!==ctx.p).map(e=>e.c); const c=choose(g,ctx.p,'target',list,{op:'prevent'}); if(c){ ctx.last=c; g.combat.atk.find(e=>e.c===c).prevent=true; L(g,`${nm(c)}'s combat damage is prevented`); } },
  reflect(g,ctx){ if(!g.combat) return; const list=g.combat.atk.filter(e=>e.c.ctl!==ctx.p).map(e=>e.c); const c=choose(g,ctx.p,'target',list,{op:'prevent'}); if(c){ g.combat.atk.find(e=>e.c===c).reflect=true; L(g,`${nm(c)}'s combat damage is turned back on P${c.ctl}`); } },
  dodge(g,ctx,[_,T]){ for(const c of sel(g,ctx,T,'pump')){ c.shield=true; if(rowOf(g,c)==='stage') moveRow(g,c,'back'); } },
  shield(g,ctx,[_,T]){ for(const c of sel(g,ctx,T,'pump')) c.shield=true; },
  counter(g,ctx,[_,n]){ if(ctx.src) ctx.src.ctr.seal=(ctx.src.ctr.seal||0)+n; },
  sacSelf(g,ctx){ const s=ctx.src; if(s&&g.P[s.ctl].relics.includes(s)) destroyRelic(g,s,'sacrifice'); },
  ifthen(g,ctx,[_,k,a,b]){ run(g,condOk(g,ctx.src||{ctl:ctx.p,ctr:{},host:null},k)?a:(b||[]),ctx); },
  drawSeal(g,ctx,[_,max]){ const n=Math.min(max,ctx.src?ctx.src.ctr.seal||0:0); draw(g,ctx.p,n); },
  grantCharge(g,ctx,[_,T]){ for(const c of sel(g,ctx,T,'pump')){ c.ent=-9; c.buf.push({p:0,h:0}); c.rush=g.turn; } },
  pullStage(g,ctx,[_,T]){ const foe=1-ctx.p; for(const c of g.P[foe].back.slice()){ moveRow(g,c,'stage'); } },
  fatigue(g,ctx,[_,T]){ for(const c of sel(g,ctx,T,'tap')) c.exh=true; },
  halveAnomaly(g,ctx){ setRift(g,Math.max(0,g.rift-3)); },
  loot(g,ctx){ const pl=g.P[ctx.p]; if(!pl.hand.length) return; const c=choose(g,ctx.p,'loot',[null].concat(pl.hand),{ask:true}); if(c){ pl.hand.splice(pl.hand.indexOf(c),1); pl.discard.push(c); L(g,`P${ctx.p} discards ${nm(c)} to draw`); draw(g,ctx.p,1); } },
  hostStage(g,ctx){ const h=ctx.src&&ctx.src.host; if(h&&rowOf(g,h)==='back') { if(!moveRow(g,h,'stage')) L(g,'no room on the Stage'); } },
};
function matchCard(c,f){ if(!f) return true; const d=def(c); if(f.type&&d.type!==f.type) return false; if(f.maxCost!==undefined&&d.cost>f.maxCost) return false; if(f.minCost!==undefined&&d.cost<f.minCost) return false; if(f.char&&d.char!==f.char) return false; if(f.kw&&!(d.kw||[]).includes(f.kw)) return false; return true; }
function animate(g,r,p,h){ const bonus=sourcesAnimBonus(g,r); r.anim={p:p,h:h}; r.dmg=0; r.exh=false; r.ent=-9; L(g,`${nm(r)} animates (${p}/${h})`); }
function sourcesAnimBonus(){ return 0; }
function run(g,ops,ctx){ for(const o of ops){ if(g.over) return; const f=OPS[o[0]]; if(!f) throw new Error('unknown op '+o[0]); f(g,ctx,o); } }
function wager(g,ctx,call,win,lose){ const p=ctx.p, pl=g.P[p]; const c=call==='choose'?choose(g,p,'call',['high','low'],{ask:true}):call;
  const rev=()=>{ if(!pl.deck.length) return null; const n=rules(g,p,'wagerDouble')>0?2:1; const cs=pl.deck.splice(0,n); const hit=x=>c==='high'?def(x).cost>=3:def(x).cost<=2; const good=cs.find(hit); pl.deck.push(...cs); return {cs,won:!!good}; };
  let r=rev(); if(!r){ r={cs:[],won:false}; } L(g,`Wager (${c}): reveals ${r.cs.map(nm).join(', ')||'nothing'} - ${r.won?'WIN':'LOSE'}`);
  if(!r.won&&rules(g,p,'reroll')>0&&pl.rerolled!==g.turn){ pl.rerolled=g.turn; r=rev()||{cs:[],won:false}; L(g,`Wager rerolled: ${r.cs.map(nm).join(', ')||'nothing'} - ${r.won?'WIN':'LOSE'}`); }
  pl.wagers.push(r.won); fire(g,r.won?'wagerWin':'wagerLose',{pl:p}); run(g,r.won?win:lose,ctx); }

// ---------------------------------------------------------------- events (triggers and ticking Conditions)
const OF_DEFAULT={enter:'self',attack:'self',block:'self',defeat:'self',damaged:'self',hit:'self',wake:'me',end:'me',tech:'me',slip:'me',anomaly:'any',wagerWin:'me',wagerLose:'me',relicLost:'me',targeted:'self'};
function ofMatch(g,s,a,ev,data){ const of=a.of||OF_DEFAULT[ev]||'self'; const who=s.host||s; const ctl=s.host? s.host.ctl : (s.hostP!==null&&s.hostP!==undefined? s.hostP : s.ctl);
  switch(of){
    case 'self': return data.card===who||(data.card===s);
    case 'ally': return !!data.card&&data.card!==s&&data.card.ctl===s.ctl&&isChar(data.card);
    case 'allyAny': return !!data.card&&data.card.ctl===s.ctl&&isChar(data.card);
    case 'foeCard': return !!data.card&&data.card.ctl!==s.ctl&&isChar(data.card);
    case 'me': return data.pl===s.ctl;
    case 'opp': return data.pl!==undefined&&data.pl!==s.ctl;
    case 'host': return data.pl===ctl;
    case 'any': return true;
    default: return false; } }
function fire(g,ev,data){ if(g.over) return; const list=sources(g); if(data.card&&!list.includes(data.card)&&ev==='defeat') list.push(data.card);
  for(const s of list){ if(g.over) return; if(!(inPlay(g,s)||s===data.card)) continue; const abs= (s===data.card&&ev==='defeat')? (def(s).ab||[]) : abilities(g,s);
    for(const a of abs){
      if(a.t==='tr'&&a.on===ev&&ofMatch(g,s,a,ev,data)&&(!a.if||condOk(g,s,a.if))){ const ctx={p:s.ctl,src:s,data}; bump(g.st.trig,s.id); L(g,`${nm(s)} triggers`); run(g,a.ops,ctx); if(g.combat||true) sweep(g); }
      else if(a.t==='tick'&&a.on===ev&&ofMatch(g,s,a,ev,data)){ s.tick-=1; if(s.tick<=0){ const ctx={p:s.ctl,src:s,data}; L(g,`${nm(s)} resolves`); const hostP=s.host? s.host.ctl : s.hostP; removeCond(g,s); run(g,a.ops,Object.assign(ctx,{hostP})); sweep(g); } else L(g,`${nm(s)}: ${s.tick} left`); }
    } } }

// ---------------------------------------------------------------- playing cards
function newInstanceAttach(g,card,host,hostP){ card.host=host; card.hostP=hostP; const d=def(card); card.tick=d.tick||0; if(host) host.atch.push(card); else g.P[hostP].conds.push(card); }
function enterPlay(g,c,p,row,info){ const pl=g.P[p]; c.ctl=p; c.ent=g.turn; c.exh= rules(g,p,'enterExhausted')>0 || (rules(g,1-p,'foeEnterExhausted')>0); (row==='stage'?pl.stage:pl.back).push(c); L(g,`P${p} puts ${nm(c)} ${row==='stage'?'on the Stage':'Backstage'}`);
  fire(g,'enter',{card:c,pl:p,info}); sweep(g); }
function payEnergy(g,p,n){ const pl=g.P[p]; const t=Math.min(pl.temp,n); pl.temp-=t; n-=t; for(const r of pl.rift) if(n>0&&r.ready){ r.ready=false; n--; } }
function canPay(g,p,n){ return energy(g,p)>=n; }
function techOk(g,p,card){ const d=def(card); for(const s of d.need||[]) if(!hasTarget(g,p,s)) return false; return true; }

function playCard(g,p,hi,opt){ opt=opt||{}; const pl=g.P[p]; const card=pl.hand[hi]; const d=def(card); let c=cost(g,p,card);
  if(opt.upgrade){ c=Math.max(0,c-def(opt.upgrade).cost); }
  payEnergy(g,p,c); pl.hand.splice(hi,1); pl.disc=0; pl.tax=0; bump(g.st.played[p],d.id);
  L(g,`P${p} plays ${d.name}${opt.upgrade?' (Next Episode)':''} [${c}]`);
  switch(d.type){
    case 'Character':{ if(opt.upgrade){ const o=opt.upgrade, row=rowOf(g,o); const arr=row==='stage'?pl.stage:pl.back; arr[arr.indexOf(o)]=card; card.ctl=p; card.ent=o.ent; card.exh=o.exh; card.dmg=o.dmg; card.ctr=o.ctr; card.buf=o.buf; card.mark=o.mark; card.atch=o.atch; for(const a of card.atch) a.host=card; card.sil=o.sil; o.atch=[]; const oo=o; resetCard(oo); pl.discard.push(oo); fire(g,'enter',{card,pl:p,info:{upgrade:true}}); sweep(g); }
      else enterPlay(g,card,p,opt.row||(pl.stage.length<g.R.stageMax?'stage':'back'),{}); break; }
    case 'Technique':{ pl.techs++; const ctx={p,src:null,data:{},tech:card}; fire(g,'tech',{pl:p,card}); run(g,d.ops,ctx); sweep(g); pl.discard.push(card); break; }
    case 'Relic':{ if(pl.relics.length>=g.R.relicMax){ const r=choose(g,p,'relic',pl.relics,{replace:true}); destroyRelic(g,r,'replaced'); } pl.relics.push(card); card.ctl=p; card.tick=0; card.ctr={}; fire(g,'enter',{card,pl:p}); break; }
    case 'Zone':{ if(g.zone) destroyZone(g); g.zone=card; card.ctl=p; fire(g,'enter',{card,pl:p}); break; }
    case 'Condition':{ card.ctl=p; let host=null, hostP=null;
      if(d.attach==='foe') hostP=1-p; else if(d.attach==='me') hostP=p; else { const ctx={p,src:card}; const t=pickT(g,ctx,d.attach,'cond'); if(!t.length){ pl.discard.push(card); break; } host=t[0]; }
      newInstanceAttach(g,card,host,hostP); L(g,`${d.name} is attached to ${host?nm(host):'P'+hostP}`); fire(g,'enter',{card,pl:p}); if(d.onAttach){ run(g,d.onAttach,{p,src:card}); } sweep(g); break; }
  } }

const bump=(o,k)=>{ o[k]=(o[k]||0)+1; };
function canAttach(g,p,d){ if(d.attach==='foe'||d.attach==='me') return true; return hasTarget(g,p,d.attach); }

// ---------------------------------------------------------------- actions
function actionList(g,p,window){ // window: 'main' | 'react'. Every legal action for player p right now.
  const pl=g.P[p]; const acts=[]; const en=energy(g,p);
  if(window==='main'){
    if(pl.slipped<g.R.slipPerTurn+pl.extraSlip && pl.rift.length<g.R.energyCap) { const seen=new Set(); pl.hand.forEach((c,i)=>{ if(!seen.has(c.id)){ seen.add(c.id); acts.push({k:'slip',i}); } }); }
  }
  pl.hand.forEach((card,i)=>{ const d=def(card); const c=cost(g,p,card);
    if(window==='react'){ if(d.type!=='Technique'||!d.react) return; }
    if(c<=en||d.type==='Character'){ }
    if(d.type==='Character'){ if(window!=='main') return;
      if(c<=en){ if(pl.stage.length<g.R.stageMax) acts.push({k:'play',i,row:'stage'}); if(pl.back.length<g.R.backMax) acts.push({k:'play',i,row:'back'}); }
      if(d.char) for(const o of chars(g,p)) if(def(o).char===d.char&&def(o).cost<d.cost&&Math.max(0,c-def(o).cost)<=en) acts.push({k:'play',i,upgrade:o});
    } else if(c<=en){ if(d.type==='Technique'){ if(techOk(g,p,card)) acts.push({k:'play',i}); } else if(window==='main'){ if(d.type==='Condition'&&!canAttach(g,p,d)) return; acts.push({k:'play',i}); } } });
  // activated abilities
  for(const s of sources(g)){ if(s.ctl!==p) continue; const alive= isChar(s)? true : true; for(const a of abilities(g,s)){ if(a.t!=='act') continue; if(window==='react'&&!a.react) continue; if(window==='main'&&false) continue;
      if(s.used===g.turn&&a.once!==false) continue; if(a.cost>en) continue; if(a.if&&!condOk(g,s,a.if)) continue;
      if(a.need&&!a.need.every(sp=>hasTarget(g,p,sp))) continue; if(a.sacNeed&&!g.P[p].relics.some(r=>r!==s)) continue;
      if(a.req&&a.req.pool&&!pl.rift.length) continue; if(a.req&&a.req.disc&&!pl.discard.length) continue;
      if(isChar(s)&&s.ent===g.turn&&a.cost>0&&false) continue;
      acts.push({k:'act',s,a:def(s).ab.indexOf(a)}); } }
  if(window==='main'){
    if(!pl.stepped){ for(const c of chars(g,p)){ if(hasKw(g,c,'NoStep')) continue; const to=rowOf(g,c)==='stage'?'back':'stage'; const dst=to==='stage'?pl.stage:pl.back, max=to==='stage'?g.R.stageMax:g.R.backMax; if(dst.length<max) acts.push({k:'step',c}); else { for(const o of (to==='stage'?pl.stage:pl.back)) if(!hasKw(g,o,'NoStep')&&c.u<o.u) acts.push({k:'swap',a:c,b:o}); } } }
    for(const co of pl.conds.concat(...chars(g,p).map(c=>c.atch))){ const rn=def(co).ransom; if(rn!==undefined&&co.ctl!==p&&rn<=en) acts.push({k:'ransom',s:co}); }
  }
  return acts; }
function applyAction(g,p,a){ const pl=g.P[p];
  switch(a.k){
    case 'slip':{ const c=pl.hand.splice(a.i,1)[0]; pl.rift.push({card:c,ready:true}); pl.slipped++; bump(g.st.slipped[p],c.id); L(g,`P${p} slips a card into the Rift pool (${pl.rift.length})`); fire(g,'slip',{pl:p}); break; }
    case 'play': playCard(g,p,a.i,a); break;
    case 'act':{ const s=a.s, ab=def(s).ab[a.a]; payEnergy(g,p,ab.cost); s.used=g.turn; bump(g.st.used[p],s.id); L(g,`P${p} uses ${nm(s)}`); const ctx={p,src:s,data:{}};
      if(ab.sac){ L(g,`${nm(s)} is sacrificed`); const ctxs=Object.assign({},ctx); if(g.P[s.ctl].relics.includes(s)) destroyRelic(g,s,'sacrifice'); ctxs.src=s; run(g,ab.ops,ctxs); } else run(g,ab.ops,ctx); sweep(g); break; }
    case 'step':{ const to=rowOf(g,a.c)==='stage'?'back':'stage'; moveRow(g,a.c,to); pl.stepped=true; L(g,`P${p} steps ${nm(a.c)} ${to==='stage'?'onto the Stage':'Backstage'}`); break; }
    case 'swap':{ const ra=rowOf(g,a.a), rb=rowOf(g,a.b); const A=ra==='stage'?pl.stage:pl.back, B=rb==='stage'?pl.stage:pl.back; A[A.indexOf(a.a)]=a.b; B[B.indexOf(a.b)]=a.a; pl.stepped=true; L(g,`P${p} swaps ${nm(a.a)} and ${nm(a.b)}`); break; }
    case 'ransom':{ payEnergy(g,p,def(a.s).ransom); L(g,`P${p} pays to remove ${nm(a.s)}`); removeCond(g,a.s); break; }
  } }

// ---------------------------------------------------------------- combat
function attackersOf(g,p){ return g.P[p].stage.filter(c=>!c.exh&&!hasKw(g,c,'NoAttack')&&(c.ent<g.turn||hasKw(g,c,'Rush')||c.rush===g.turn)).concat(g.P[p].relics.filter(r=>r.anim&&!r.exh)); }
function blockersOf(g,p){ const pl=g.P[p]; let l=pl.stage.slice(); if(rules(g,p,'backBlock')>0) l=l.concat(pl.back); return l.filter(c=>!c.exh&&!hasKw(g,c,'NoBlock')); }
function canBlock(g,b,a){ if(a.anim) return true; if(hasKw(g,a,'Phase')&&!(hasKw(g,b,'Phase')||hasKw(g,b,'Sever'))) return false; return true; }
function declareAttack(g,p,chosen){ g.combat={atk:chosen.map(c=>({c,blk:null,prevent:false,reflect:false,gone:false})),p};
  for(const c of chosen){ c.exh=true; L(g,`P${p} attacks with ${nm(c)} (${pow(g,c)})`); } for(const c of chosen) fire(g,'attack',{card:c,pl:p});
  sweep(g); g.combat.atk=g.combat.atk.filter(e=>inPlayChar(g,e.c)||e.c.anim); }
function applyBlocks(g,q,asg,blockers){ const used=new Set();
  for(const e of g.combat.atk){ const bu=asg[e.c.u]; if(bu===undefined||bu===null) continue; const b=blockers.find(x=>x.u===bu); if(!b||used.has(b.u)||!canBlock(g,b,e.c)) continue; used.add(b.u); e.blk=b; L(g,`P${q} blocks ${nm(e.c)} with ${nm(b)}`); }
  for(const e of g.combat.atk) if(e.blk) fire(g,'block',{card:e.blk,attacker:e.c,pl:q}); sweep(g); }
function resolveDamage(g){ const todo=[]; for(const e of g.combat.atk){ if(!(inPlayChar(g,e.c)||e.c.anim)) continue; const blk=e.blk&&inPlayChar(g,e.blk)? e.blk : null; todo.push({e,blk,dealt:e.prevent?0:pow(g,e.c),bdealt:blk? pow(g,blk):0}); }
  for(const t of todo){ if(g.over) break; const {e,blk}=t;
    if(blk){ if(t.dealt>0){ damage(g,blk,t.dealt,e.c,'combat'); if(hasKw(g,e.c,'Sever')&&inPlayChar(g,blk)){ blk.sil=(g.active===blk.ctl? g.turn+2 : g.turn+1); L(g,`${nm(blk)} is severed`); } } if(t.bdealt>0) damage(g,e.c,t.bdealt,blk,'combat'); }
    else if(e.gone||e.blk){ /* the blocker left: the attacker stays blocked and deals no damage */ }
    else if(t.dealt>0){ if(e.reflect) loseResolve(g,e.c.ctl,t.dealt,'reflected'); else { loseResolve(g,1-e.c.ctl,t.dealt,'combat'); fire(g,'hit',{card:e.c,n:t.dealt,pl:e.c.ctl}); } } }
  sweep(g); g.combat=null; }
function doCombat(g,p){ const q=1-p; const avail=attackersOf(g,p); if(!avail.length) return;
  const chosen=agent(g,p).attack(g,p,avail).filter(c=>avail.includes(c)); if(!chosen.length) return;
  declareAttack(g,p,chosen); if(g.over||!g.combat.atk.length){ g.combat=null; return; }
  const blockers=blockersOf(g,q); if(blockers.length){ const asg=agent(g,q).block(g,q,g.combat.atk.map(e=>e.c),blockers)||{}; applyBlocks(g,q,asg,blockers); }
  let passes=0, who=q, guard=0; while(passes<2&&guard++<16&&!g.over){ const acts=actionList(g,who,'react'); let choice=null; if(acts.length) choice=agent(g,who).react(g,who,acts); if(choice){ applyAction(g,who,choice); passes=0; sweep(g); } else passes++; who=1-who; }
  if(g.over){ g.combat=null; return; }
  resolveDamage(g); }

// ---------------------------------------------------------------- turn structure
function wake(g,p){ const pl=g.P[p]; g.active=p; g.turn++; pl.techs=0; pl.slipped=0; pl.stepped=false; pl.extraSlip=0; pl.temp=pl.nextEnergy; pl.nextEnergy=0; pl.disc=0;
  for(const r of pl.rift) r.ready=true; for(const c of chars(g,p)) c.exh=false; for(const r of pl.relics) { r.exh=false; }
  if(p===g.first){ g.round++; if(g.round>1&&g.R.riftPerRound) setRift(g,g.rift+g.R.riftPerRound); }
  L(g,`--- P${p} wakes (Rift ${g.rift}, Resolve ${pl.resolve}/${g.P[1-p].resolve}) ---`); fire(g,'wake',{pl:p}); sweep(g); }
function endTurn(g,p){ const pl=g.P[p]; fire(g,'end',{pl:p}); sweep(g);
  for(const c of allChars(g)){ c.dmg=0; c.buf=[]; c.shield=false; } for(const q of g.P) for(const r of q.relics){ if(r.anim){ r.anim=null; r.dmg=0; } }
  for(const q of g.P){ q.techs=q.techs; } pl.temp=0;
  while(pl.hand.length>g.R.handMax){ const c=choose(g,p,'discard',pl.hand,{}); pl.hand.splice(pl.hand.indexOf(c),1); pl.discard.push(c); L(g,`P${p} discards ${nm(c)} (hand limit)`); }
  for(const c of g.P[0].stage.concat(g.P[0].back,g.P[1].stage,g.P[1].back)) if(c.dmg||c.buf.length){ c.dmg=0; c.buf=[]; } }
function takeTurn(g,p){ const pl=g.P[p]; wake(g,p); if(g.over) return;
  const first=g.turn===1; draw(g,p,first? g.R.firstPlayerFirstDraw : g.R.drawPerTurn+(g.turn===2? (g.R.secondPlayerExtraDraw||0):0)); if(g.over) return;
  mainPhase(g,p); if(g.over) return; doCombat(g,p); if(g.over) return; mainPhase(g,p,true); if(g.over) return; endTurn(g,p); }
function mainPhase(g,p,second){ let guard=0; while(guard++<60&&!g.over){ const acts=actionList(g,p,'main'); if(!acts.length) break; const a=agent(g,p).main(g,p,acts,second); if(!a||a.k==='pass') break; applyAction(g,p,a); sweep(g); } }

// ---------------------------------------------------------------- copying the state (for look-ahead)
// Cards in a deck or discard pile are shared between a game and its copies (nothing mutates them there); every move out of those
// piles goes through thaw(), which makes a private copy first when the game is a copy.
function thaw(g,c){ if(!g.isCopy) return c; const n=Object.assign({},c); n.ctr=Object.assign({},c.ctr); n.buf=c.buf.map(b=>Object.assign({},b)); n.atch=[]; n.anim=c.anim?Object.assign({},c.anim):null; return n; }
function copyGame(g){ const map=new Map(); const cl=c=>{ if(!c) return c; let n=map.get(c); if(n) return n; n=Object.assign({},c); map.set(c,n); n.ctr=Object.assign({},c.ctr); n.buf=c.buf.map(b=>Object.assign({},b)); n.anim=c.anim?Object.assign({},c.anim):null; n.atch=c.atch.map(cl); n.host=cl(c.host); return n; };
  const h={R:g.R,rs:g.rs,uid:g.uid,turn:g.turn,round:g.round,active:g.active,first:g.first,rift:g.rift,anom:g.anom,anomalies:g.anomalies,zone:cl(g.zone),over:g.over,winner:g.winner,why:g.why,log:[],nolog:true,isCopy:true,sweeping:g.sweeping,
    st:{played:[{},{}],slipped:[{},{}],used:[{},{}],trig:{},maxRift:0,wins:[0,0]},combat:null,P:[]};
  for(const pl of g.P) h.P.push(Object.assign({},pl,{deck:pl.deck.slice(),discard:pl.discard.slice(),hand:pl.hand.map(cl),rift:pl.rift.map(r=>({card:cl(r.card),ready:r.ready})),stage:pl.stage.map(cl),back:pl.back.map(cl),relics:pl.relics.map(cl),conds:pl.conds.map(cl),wagers:pl.wagers.slice(),seen:pl.seen.slice()}));
  if(g.combat) h.combat={p:g.combat.p,atk:g.combat.atk.map(e=>({c:cl(e.c),blk:cl(e.blk),prevent:e.prevent,reflect:e.reflect,gone:e.gone}))};
  Object.defineProperty(h,'ag',{value:[null,null],writable:true,enumerable:false}); return h; }

// ---------------------------------------------------------------- game setup and loop
function validateDeck(ids){ const errs=[]; if(ids.length!==RULES.deckSize) errs.push(`deck has ${ids.length} cards, needs ${RULES.deckSize}`); const n={}; for(const id of ids){ if(!CARDS[id]) { errs.push('unknown card '+id); continue; } n[id]=(n[id]||0)+1; }
  for(const id in n){ const mx=CARDS[id].max||RULES.copies; if(n[id]>mx) errs.push(`${n[id]} copies of ${CARDS[id].name} (max ${mx})`); } return errs; }
function newGame(deckA,deckB,seed,opts){ opts=opts||{}; const R=Object.assign({},RULES,opts.rules||{});
  const g={R,rs:mix(seed),uid:0,turn:0,round:0,active:0,first:0,rift:R.riftStart,anom:null,anomalies:0,zone:null,over:false,winner:null,why:null,log:[],nolog:!!opts.nolog,combat:null,P:[],st:{played:[{},{}],slipped:[{},{}],used:[{},{}],trig:{},maxRift:0,wins:[0,0]}};
  g.first = opts.first!==undefined? opts.first : (rnd(g)<0.5?0:1); g.anom=ANOM_KEYS[Math.floor(rnd(g)*ANOM_KEYS.length)];
  [deckA,deckB].forEach((d,i)=>{ g.P.push({deck:shuffle(g,d.map(id=>mk(g,id,i))),hand:[],rift:[],stage:[],back:[],relics:[],conds:[],discard:[],resolve:R.resolve,slipped:0,extraSlip:0,stepped:false,techs:0,temp:0,nextEnergy:0,disc:0,tax:0,drawn:0,wagers:[],seen:[],rerolled:-9}); });
  Object.defineProperty(g,'ag',{value:[null,null],writable:true,enumerable:false}); return g; }
function setAgents(g,a,b){ g.ag[0]=a; g.ag[1]=b; }
function start(g){ for(const p of [g.first,1-g.first]){ const pl=g.P[p]; draw(g,p,g.R.openingHand); }
  for(const p of [g.first,1-g.first]){ const pl=g.P[p]; const idx=agent(g,p).mulligan(g,p)||[]; if(idx.length){ const out=idx.sort((a,b)=>b-a).map(i=>pl.hand.splice(i,1)[0]); draw(g,p,out.length); pl.deck.push(...out); shuffle(g,pl.deck); L(g,`P${p} mulligans ${out.length}`); } }
  const sp=1-g.first; for(let i=0;i<g.R.secondPlayerRift;i++){ const c=g.P[sp].deck.shift(); if(c) g.P[sp].rift.push({card:c,ready:true}); } }
function play(deckA,deckB,seed,agents,opts){ const g=newGame(deckA,deckB,seed,opts); setAgents(g,agents[0],agents[1]); start(g); let p=g.first; while(!g.over&&g.turn<g.R.turnLimit){ takeTurn(g,p); p=1-p; }
  if(!g.over){ g.over=true; g.winner=-1; g.why='turnlimit'; } return g; }

module.exports={copyGame,thaw,RULES,ANOMALIES,ANOM_KEYS,CARDS,newGame,setAgents,start,play,takeTurn,wake,mainPhase,doCombat,endTurn,actionList,applyAction,playCard,validateDeck,
  def,nm,pow,hp,hasKw,kwSet,energy,cost,chars,allChars,rowOf,rules,cand,hasTarget,run,OPS,fire,sweep,damage,defeat,draw,setRift,fireAnomaly,loseResolve,heal,shuffle,rnd,mk,enterPlay,moveRow,
  attackersOf,blockersOf,canBlock,declareAttack,applyBlocks,resolveDamage,sources,abilities,condOk,matchF,matchCard,techOk,leaveToHand,destroyRelic,destroyZone,removeCond,newInstanceAttach,choose,inPlay,silenced,L};
