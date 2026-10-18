// Rift Parade computer players. Every agent only has to answer the engine's questions (see engine.js):
//   mulligan(g,p) -> indices to replace      main(g,p,actions) -> one action or {k:'pass'}
//   attack(g,p,available) -> Characters      block(g,p,attackers,blockers) -> {attackerUid: blockerUid}
//   react(g,p,actions) -> action or null     choose(g,p,kind,options,ctx) -> index into options
// 'search' agents (the default personas) look one decision ahead: they copy the game state, try each option and score the
// result with a weighted evaluation (so they understand every card through its effects, not through card-specific rules).
// They never read the opponent's hidden hand to decide; the copied state does contain it, so a few effects that look at
// the hand (Strip) resolve on real data, exactly as they would for a human who is allowed to look.
'use strict';
const E=require('./engine.js');
const {def,pow,hp,chars,energy,cost,rowOf,hasKw}=E;

// ------------------------------------------------------------------ state evaluation
const PERSONA={
  balanced:{life:1.0,foeLife:1.0,board:1.0,hand:0.8,energy:0.7,perm:0.9,spend:0.35,aggro:0.0,caution:0.0,pressure:0.6,expose:0.3},
  aggro:{life:0.65,foeLife:1.5,board:0.9,hand:0.55,energy:0.6,perm:0.8,spend:0.5,aggro:0.6,caution:-0.3,pressure:0.8,expose:0.15},
  control:{life:1.35,foeLife:0.75,board:1.1,hand:1.05,energy:0.8,perm:1.0,spend:0.2,aggro:-0.4,caution:0.5,pressure:0.4,expose:0.5},
};
const poolVal=n=>{ let v=0; for(let k=1;k<=Math.min(8,n);k++) v+= k<=3?2.4 : k<=5?1.7 : k<=7?0.9 : 0.3; return v; };
const lifeVal=r=>r+(r<9?(9-r)*0.9:0)+(r<=4?(5-r)*2:0);
function charVal(g,c,w){ const d=def(c); const row=rowOf(g,c); let v=(pow(g,c)*1.15+Math.max(0,hp(g,c)-c.dmg)*0.7)+d.cost*0.45+(d.ab.length?0.9:0)+(c.mark?-1.5:0)+c.atch.length*-0.5+(c.ctr.imp||0)*0.5; if(row==='back') v*=0.72; if(c.exh) v-=0.3; return v; }
function evalG(g,me,w){ if(g.over){ return g.winner===me? 1e5 : g.winner===1-me? -1e5 : 0; }
  const A=g.P[me], B=g.P[1-me]; let s=w.life*lifeVal(A.resolve)-w.foeLife*lifeVal(B.resolve);
  for(const c of chars(g,me)) s+=w.board*charVal(g,c,w); for(const c of chars(g,1-me)) s-=w.board*charVal(g,c,w);
  s+=w.hand*(A.hand.length*1.0+A.hand.reduce((x,c)=>x+def(c).cost*0.12,0))-w.hand*0.9*(B.hand.length*1.0+B.hand.reduce((x,c)=>x+def(c).cost*0.12,0));
  s+=w.energy*(poolVal(A.rift.length)-poolVal(B.rift.length));
  s+=0.7*Math.min(2,A.hand.filter(c=>def(c).type==='Technique'&&def(c).react).length);   // a Reaction held in hand is worth something
  for(const r of A.relics) s+=w.perm*(def(r).cost+1.3); for(const r of B.relics) s-=w.perm*(def(r).cost+1.3);
  if(g.zone) s+=(g.zone.ctl===me?1:-1)*w.perm*(def(g.zone).cost+1.2);
  for(const c of A.conds.concat(...chars(g,me).map(x=>x.atch))) s+=(c.ctl===me?1:-1)*w.perm*0.6*(def(c).cost+0.8);
  for(const c of B.conds.concat(...chars(g,1-me).map(x=>x.atch))) s+=(c.ctl===me?1:-1)*w.perm*0.8*(def(c).cost+0.8);
  s+=0.05*(A.deck.length-B.deck.length); if(A.deck.length<4) s-=(4-A.deck.length)*4; return s; }

// ------------------------------------------------------------------ copying the state for look-ahead
let SIM=null;
function clone(g){ const h=E.copyGame(g); h.ag[0]=SIM; h.ag[1]=SIM; return h; }
function cloneFor(g,me){ const h=clone(g); h.P[me].deck=E.shuffle(h,h.P[me].deck); return h; }   // my own deck order is unknown to me: shuffle it in the copy
const byU=(h,u)=>{ for(const c of h.P[0].stage.concat(h.P[0].back,h.P[1].stage,h.P[1].back,h.P[0].relics,h.P[1].relics)) if(c.u===u) return c; for(const pl of h.P){ for(const x of pl.hand) if(x.u===u) return x; } return null; };
function mapAction(h,p,a){ // translate an action made for g into the copy h
  const pl=h.P[p]; const b=Object.assign({},a); if(a.s) b.s=byU(h,a.s.u)||h.P[0].conds.concat(h.P[1].conds,...E.allChars(h).map(c=>c.atch)).find(c=>c.u===a.s.u)||(h.zone&&h.zone.u===a.s.u?h.zone:null);
  if(a.c) b.c=byU(h,a.c.u); if(a.a!==undefined&&a.k==='swap'){ b.a=byU(h,a.a.u); b.b=byU(h,a.b.u); } if(a.upgrade) b.upgrade=byU(h,a.upgrade.u); return b; }
// the first card of hand with the same uid as in g
function mapAct(h,p,a,gHand){ const b=mapAction(h,p,a); if(a.k==='slip'||a.k==='play'){ const u=gHand[a.i].u; b.i=h.P[p].hand.findIndex(c=>c.u===u); } return b; }

// ------------------------------------------------------------------ heuristic choices (also used inside copies)
const HARM=new Set(['dmg','kill','bounce','mark','silence','shove','tap','stepAny']);
function keep(c){ const d=def(c); return d.cost+(d.type==='Character'?1.2:0.6); }
function deckOdds(g,p){ let hi=0,lo=0; for(const c of g.P[p].deck){ if(def(c).cost>=3) hi++; else lo++; } return [hi,lo]; }
function chooseHeur(g,p,kind,opts,ctx,w){ w=w||PERSONA.balanced; const I=f=>{ let b=0,bs=-Infinity; opts.forEach((o,i)=>{ const s=f(o); if(s>bs){ bs=s; b=i; } }); return b; };
  switch(kind){
    case 'target':{ const op=ctx.op; const harm=HARM.has(op); return I(c=>{ const mine=c.ctl===p; let v=charVal(g,c,w); if(op==='dmg'&&ctx.ctx&&ctx.ctx.src){ v+=pow(g,c)*0.2; }
        if(op==='purge') return mine? c.atch.filter(a=>a.ctl!==p).length*3+(c.mark?2:0)+(c.dmg?0:0) : -99;
        if(op==='stepAny'){ if(mine) return rowOf(g,c)==='back'?v*0.4: -50; return rowOf(g,c)==='stage'? v : -50; }
        if(op==='step') return mine? (rowOf(g,c)==='back'? v*0.6 : (c.atch.length||c.mark? 3 : 0.5)) : -99;
        if(op==='prevent') return pow(g,c);
        if(op==='mark') return mine? -99 : v+(c.mark?-20:0);
        if(harm) return mine? -100-v : v; return mine? v+(c.exh?-1:0)+(rowOf(g,c)==='stage'?1:0) : -100; }); }
    case 'discard': return I(c=>-keep(c));
    case 'sacrifice': return I(c=>-charVal(g,c,w));
    case 'relic': return ctx.sac? I(r=>-def(r).cost) : ctx.replace? I(r=>-def(r).cost) : I(r=>def(r).cost);
    case 'search': case 'recur': return I(c=>keep(c)+(def(c).type==='Character'?0.5:0));
    case 'strip': return I(c=>keep(c));
    case 'pull':{ const pool=opts.slice(1); if(pool.length<4) return 0; let bi=0,bs=-1; pool.forEach((r,i)=>{ if(keep(r.card)>bs){ bs=keep(r.card); bi=i; } }); return bs>=4? bi+1 : 0; }
    case 'slip': return I(c=>-keep(c));
    case 'call':{ const [hi,lo]=deckOdds(g,p); return hi>=lo? 0 : 1; }
    case 'riftdir': return g.P[p].resolve>=g.P[1-p].resolve+4&&ctx.dir!==undefined? 0 : (E.chars(g,p).some(c=>hasKw(g,c,'Phase'))&&g.rift<5? 0 : 1);
    case 'anomaly':{ let b=0,bs=-Infinity; opts.forEach((k,i)=>{ const h=clone(g); try{ E.ANOMALIES[k].run(h); }catch(e){} const s=evalG(h,p,w); if(s>bs){ bs=s; b=i; } }); return b; }
    case 'bargain':{ const best=['A','B'].map(k=>{ const h=cloneFor(g,p); const cp=ctx.ctx.p; try{ E.run(h,ctx[k],{p:cp,src:null,data:{}}); }catch(e){} return evalG(h,p,w); }); return best[0]>=best[1]? 0 : 1; }
    case 'scry': return keep(ctx.card)>=6&&g.P[p].rift.length<5? 1 : keep(ctx.card)<=2.5&&g.P[p].rift.length>=5? 1 : 0;
    case 'loot':{ const hand=opts.slice(1); if(!hand.length) return 0; let wi=0; hand.forEach((c,i)=>{ if(keep(c)<keep(hand[wi])) wi=i; }); return keep(hand[wi])<=2.2&&hand.length>=3? wi+1 : 0; }
    case 'sever': return I(c=>def(c).cost+(def(c).type==='Zone'?1:0));
    default: return 0; } }

// ------------------------------------------------------------------ blocking helpers
function heurBlocks(g,q,atkCards,blockers,w){ // quick, no copies: used to model the opponent while planning an attack
  const asg={}, used=new Set(); const p=1-q; let incoming=atkCards.reduce((n,c)=>n+pow(g,c),0); const life=g.P[q].resolve;
  const order=atkCards.slice().sort((a,b)=>pow(g,b)-pow(g,a));
  for(const a of order){ const pa=pow(g,a), ha=Math.max(1,hp(g,a)-a.dmg); let best=null,bs=-Infinity;
    for(const b of blockers){ if(used.has(b.u)||!E.canBlock(g,b,a)) continue; const pb=pow(g,b), hb=Math.max(1,hp(g,b)-b.dmg); const kills=pb>=ha, dies=pa>=hb; let s=0;
      if(a.anim) s=pb>=hp(g,a)? 2: -1; else { s=(kills?charVal(g,a,w):0)-(dies?charVal(g,b,w):0)+ (kills&&!dies?2:0); }
      s+=pa*0.6*(incoming>=life-pa? 3 : 0.35); if(s>bs){ bs=s; best=b; } }
    if(best&&(bs>0.4||incoming>=life)){ asg[a.u]=best.u; used.add(best.u); incoming-=pa; } }
  return asg; }

// ------------------------------------------------------------------ the copy-and-score agents
function makeSearchAgent(name,w){ w=Object.assign({},PERSONA.balanced,w||{});
  const ag={name,w,
    mulligan(g,p){ const hand=g.P[p].hand; const idx=[]; let cheap=hand.filter(c=>def(c).cost<=3).length; hand.forEach((c,i)=>{ if(def(c).cost>=5&&hand.filter(x=>def(x).cost>=5).length>1&&idx.length<2) idx.push(i); }); if(cheap<2){ hand.forEach((c,i)=>{ if(def(c).cost>=4&&!idx.includes(i)&&idx.length<3) idx.push(i); }); } return idx; },
    choose(g,p,kind,opts,ctx){ return chooseHeur(g,p,kind,opts,ctx,w); },
    main(g,p,acts,second){ const pl=g.P[p];
      // Slip: decided once at the start of the turn by trying each card (and not slipping) and playing the rest greedily
      const slips=acts.filter(a=>a.k==='slip');
      if(slips.length&&pl.slipDecided!==g.turn&&!second){ pl.slipDecided=g.turn;
        const opts=[null].concat(slips.slice().sort((a,b)=>keep(pl.hand[a.i])-keep(pl.hand[b.i])).slice(0,5)); let best=null,bs=-Infinity;
        for(const o of opts){ const h=cloneFor(g,p); let hh=h; if(o) E.applyAction(h,p,mapAct(h,p,o,pl.hand)); greedy(hh,p,w); const s=evalG(hh,p,w)+pressure(hh,p,w)+(o&&pl.rift.length>=4? -0.3:0); if(s>bs){ bs=s; best=o; } }
        if(best) return best; }
      const r=bestStep(g,p,acts.filter(a=>a.k!=='slip'),w); return r? r : {k:'pass'}; },
    attack(g,p,avail){ const q=1-p; const subs=subsets(avail); let best=[],bs=-Infinity;
      for(const S of subs){ const h=cloneFor(g,p); const mine=S.map(c=>byU(h,c.u)); let sc;
        if(S.length){ E.declareAttack(h,p,mine); if(!h.over&&h.combat.atk.length){ const bl=E.blockersOf(h,q); const asg=heurBlocks(h,q,h.combat.atk.map(e=>e.c),bl,w); E.applyBlocks(h,q,asg,bl); E.resolveDamage(h); } h.combat=null; }
        sc=evalG(h,p,w)-exposure(h,p,w); sc+= S.length*w.aggro*0.6; if(sc>bs+1e-9){ bs=sc; best=S; } }
      return best; },
    block(g,p,atkCards,blockers){ const opts=blockOptions(g,atkCards,blockers); let best=null,bs=-Infinity;
      for(const asg of opts){ const h=cloneFor(g,p); const bl=E.blockersOf(h,p); E.applyBlocks(h,p,asg,bl); if(!h.over) E.resolveDamage(h); const s=evalG(h,p,w)+Object.keys(asg).length*w.caution*0.4; if(s>bs+1e-9){ bs=s; best=asg; } }
      return best||{}; },
    react(g,p,acts){ if(!g.combat) return null; const base=sim(g,p,null,w); let best=null,bs=base+0.25; for(const a of acts){ const s=sim(g,p,a,w); if(s>bs){ bs=s; best=a; } } return best; },
  };
  return ag; }
function sim(g,p,a,w){ const h=cloneFor(g,p); if(a) E.applyAction(h,p,mapAct(h,p,a,g.P[p].hand)); if(!h.over&&h.combat) E.resolveDamage(h); return evalG(h,p,w); }
function subsets(a){ if(a.length<=4){ const out=[]; for(let m=0;m<(1<<a.length);m++) out.push(a.filter((_,i)=>m&(1<<i))); return out; } const out=[[]]; for(let k=1;k<=a.length;k++) out.push(a.slice(0,k)); out.push(a); return out; }
function blockOptions(g,atk,blockers){ const res=[]; const n=atk.length; const used=new Set(); const rec=(i,asg)=>{ if(res.length>200) return; if(i===blockers.length){ res.push(Object.assign({},asg)); return; }
    const b=blockers[i]; rec(i+1,asg); for(const a of atk){ if(Object.values(asg).includes(b.u)||asg[a.u]!==undefined||!E.canBlock(g,b,a)) continue; asg[a.u]=b.u; rec(i+1,asg); delete asg[a.u]; } }; rec(0,{}); return res; }
// the crack-back: what the opponent could do to me next turn through the blockers I still have ready (attackers I just sent are
// exhausted and cannot block). Lethal exposure is a loss; otherwise a share of the damage counts against the attack.
function exposure(h,me,w){ if(h.over) return 0; const q=1-me; const atk=h.P[q].stage.filter(c=>!E.hasKw(h,c,'NoAttack')&&!(E.silenced(h,c)&&false)); if(!atk.length) return 0; const bl=E.blockersOf(h,me);
  const asg=bl.length? heurBlocks(h,me,atk,bl,w) : {}; let d=0; for(const a of atk) if(asg[a.u]===undefined) d+=E.pow(h,a); const res=h.P[me].resolve; if(d>=res) return 60; return w.expose*(lifeVal(res)-lifeVal(res-d)); }
// how much damage the attackers that can swing this turn are likely to get through (blocks guessed with heurBlocks): lets one-ply
// search see the point of Rush, Imbue and removal, which only pay off in the attack that follows
function pressure(h,p,w){ if(h.over) return 0; const q=1-p; const atk=E.attackersOf(h,p); if(!atk.length) return 0; const bl=E.blockersOf(h,q); const asg=bl.length?heurBlocks(h,q,atk,bl,w):{}; let d=0; for(const a of atk) if(asg[a.u]===undefined) d+=E.pow(h,a); else { const b=bl.find(x=>x.u===asg[a.u]); if(b&&E.pow(h,a)>=E.hp(h,b)-b.dmg) d+=0.8; }
  return Math.min(d,h.P[q].resolve)*w.pressure; }
// one greedy pass: evaluates every action on a copy and takes the best until nothing improves
function bestStep(g,p,acts,w){ if(!acts.length) return null; const base=evalG(g,p,w)+pressure(g,p,w); let best=null,bs=base+0.05; const pl=g.P[p];
  for(const a of acts){ const h=cloneFor(g,p); const ma=mapAct(h,p,a,pl.hand); const e0=energy(h,p); E.applyAction(h,p,ma); E.sweep(h); const spent=e0-energy(h,p); const s=evalG(h,p,w)+pressure(h,p,w)+w.spend*spent+(a.k==='step'||a.k==='swap'?-0.1:0); if(s>bs){ bs=s; best=a; } }
  return best; }
function greedy(h,p,w){ for(let i=0;i<8&&!h.over;i++){ const acts=E.actionList(h,p,'main').filter(a=>a.k!=='slip'); if(!acts.length) break; const a=bestStep(h,p,acts,w); if(!a) break; E.applyAction(h,p,a); E.sweep(h); } }

// ------------------------------------------------------------------ simple agents
function makeSimAgent(){ // used inside copies: forced attack set, heuristic blocks, no reactions, heuristic choices
  return {name:'sim',mulligan:()=>[],choose(g,p,k,o,c){ return chooseHeur(g,p,k,o,c); },main:()=>({k:'pass'}),attack:(g,p,av)=>av,block(g,p,a,b){ return heurBlocks(g,p,a,b,PERSONA.balanced); },react:()=>null}; }
SIM=makeSimAgent();

function makeGreedyAgent(){ // a weak pilot: no look-ahead. Slips its most expensive card until it has 3 energy, then its cheapest; plays the biggest card it can afford.
  return {name:'greedy',mulligan:()=>[],choose(g,p,k,o,c){ return chooseHeur(g,p,k,o,c); },
    main(g,p,acts){ const pl=g.P[p]; const slips=acts.filter(a=>a.k==='slip');
      const plays=acts.filter(a=>a.k==='play'||a.k==='act').sort((a,b)=>costOf(g,p,b)-costOf(g,p,a));
      if(slips.length&&pl.slipped===0&&(pl.rift.length<3||!plays.length)){ const s=slips.slice().sort((a,b)=>pl.rift.length<3? keep(pl.hand[b.i])-keep(pl.hand[a.i]) : keep(pl.hand[a.i])-keep(pl.hand[b.i]))[0]; return s; }
      if(plays.length) return plays[0]; const st=acts.find(a=>a.k==='step'&&rowOf(g,a.c)==='back'&&false); return {k:'pass'}; },
    attack(g,p,av){ const foeBl=E.blockersOf(g,1-p); return av.filter(c=>pow(g,c)>=2||foeBl.length===0); },
    block(g,p,a,b){ return heurBlocks(g,p,a,b,PERSONA.balanced); }, react:()=>null}; }
const costOf=(g,p,a)=> a.k==='play'? cost(g,p,g.P[p].hand[a.i]) : 0;
function makeRandomAgent(seed){ let s=(seed|0)||1; const r=()=>{ s^=s<<13; s^=s>>>17; s^=s<<5; return ((s>>>0)%100000)/100000; };
  return {name:'random',mulligan:()=>[],choose(g,p,k,o){ return Math.floor(r()*o.length); },
    main(g,p,acts){ if(r()<0.15) return {k:'pass'}; return acts[Math.floor(r()*acts.length)]; },
    attack(g,p,av){ return av.filter(()=>r()<0.5); },
    block(g,p,atk,bl){ const asg={}; const used=new Set(); for(const a of atk){ if(r()<0.5) continue; const b=bl.find(x=>!used.has(x.u)&&E.canBlock(g,x,a)); if(b){ asg[a.u]=b.u; used.add(b.u); } } return asg; },
    react(g,p,acts){ return r()<0.3? acts[Math.floor(r()*acts.length)] : null; }}; }

const AGENTS={
  balanced:()=>makeSearchAgent('balanced',PERSONA.balanced),
  aggro:()=>makeSearchAgent('aggro',PERSONA.aggro),
  control:()=>makeSearchAgent('control',PERSONA.control),
  greedy:()=>makeGreedyAgent(),
  random:(seed)=>makeRandomAgent(seed),
};
module.exports={AGENTS,PERSONA,evalG,chooseHeur,clone,heurBlocks,keep};
