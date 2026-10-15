// Tidemark prototype rules engine (headless). Rules: design/tcg2/prototype-rules.md. Cards: cards.js.
// play(deckA, deckB, seed, cfg) plays one full game with a computer player on both sides and returns what happened.
// cfg (all optional):
//   v     Set of rule variants: 'targets' (Vessels screen the Deep), 'escort' (Dual units escort a crossing attacker),
//         'reef' (Coral Spire rewards crossing), 'raid' (Raid keyword on eight raiders)
//   ai    1 = the original greedy player (round 1), 2 = the improved player (round 2; see design/tcg2/round2-report.md)
//   off   Set of mechanics switched off for ablation tests: 'homeground','strand','carry','escort','screen','walls',
//         'surge','domains','fronts' (one shared battlefield), 'tricks' (Swift spells and Ambush never used)
//   bonus {inf, card}: the second player's opening compensation (default +2 Influence)
//   scale {cost7: factor} scales Power/Toughness of 7+ cost cards (balance experiments)
//   blk 1|2 or [b0,b1] uses that version's blocking logic only (AI experiments)
//   harbor starting Harbor (default 20)
const {CARDS}=require('./cards.js');
const R0={HAND:6, DECK:50, MAXCAP:10, TURNCAP:40};
// xorshift32 with a mixed seed: small consecutive seeds (0, 1, 2...) used to give nearly unshuffled first decks and a
// 54-56% edge to the player in seat A (found in round 2); the seed is now scrambled and the first outputs discarded.
function mk(seed){ let h=(seed>>>0)^0x9e3779b9; h=Math.imul(h^(h>>>16),0x85ebca6b); h=Math.imul(h^(h>>>13),0xc2b2ae35); h=(h^(h>>>16))>>>0||1;
  const nx=()=>{ h^=h<<13; h>>>=0; h^=h>>>17; h^=h<<5; h>>>=0; return h/4294967296; }; for (let i=0;i<8;i++) nx(); return nx; }
const RAIDERS=new Set(['Thicket Fox','Mossback Boar','Royal Lancer','Reef Scout','Current Dancer','Deckhand Brawler','Privateer Captain','Swift Cutter']);
const ID={}; for (const c of CARDS) ID[c.id]=c;
let CFG=null;   // the configuration of the game being played (single-threaded)
const ON=k=>!CFG.off.has(k), V=k=>CFG.v.has(k);
const AI=P=>CFG.ais[P.i];   // which computer player controls this side (1 or 2)
const BLK=P=>CFG.blk? CFG.blk[P.i] : AI(P);   // blocking logic, normally the same as AI (cfg.blk overrides it for experiments)
const has=(c,k)=> c.kw.includes(k) || (k==='raid' && V('raid') && RAIDERS.has(c.n));
const effFx=c=> (V('reef') && c.n==='Coral Spire')? [['reef_cross']] : c.fx;
const fxOf=(c,k)=>effFx(c).find(o=>o[0]===k);
const powBase=c=> c.cost>=7 && CFG.scale.cost7? Math.round(c.pow*CFG.scale.cost7) : c.pow;
const tghBase=c=> c.cost>=7 && CFG.scale.cost7? Math.max(1,Math.round(c.tgh*CFG.scale.cost7)) : c.tgh;
// where a card is at home: Land on the Shore, Sea in the Deep, Dual and Neutral in both. Vessels belong to the Deep.
function homes(c){ if (!CFG || !ON('fronts')) return ['S','D']; if (c.t==='vessel') return ['D']; return c.al==='L'? ['S'] : c.al==='S'? ['D'] : ['S','D']; }
let UID=1;
function newUnit(c, front, S, tok){ return {uid:UID++, c, front, dmg:0, ready:false, entered:S.turn, stranded:false, eq:[], tp:0, tt:0, tok:!!tok}; }
// ---------- statics ----------
function domainFx(S, front, k){ if (!ON('domains')) return null; if (!ON('fronts')){ for (const f of ['S','D']){ const d=S.dom[f]; const x=d&&fxOf(d.c,k); if (x) return x; } return null; } const d=S.dom[front]; return d && fxOf(d.c,k); }
function powOf(S, P, u){ let p=powBase(u.c)+u.tp; for (const e of u.eq) p+=e.fx[0][1]; for (const o of P.units) if (o!==u && o.front===u.front && has(o.c,'leader')) p+=1;
  const fb=domainFx(S,u.front,'front_buff'); if (fb) p+=fb[1]; if (P.rally) p+=P.rally; return Math.max(0,p); }
function tghOf(S, P, u, blockingHome){ let t=tghBase(u.c)+u.tt; for (const e of u.eq) t+=e.fx[0][2];
  for (const s of P.holds) { const f=fxOf(s.c,'shore_toughness'); if (f && u.front==='S') t+=f[1]; const g=fxOf(s.c,'all_toughness'); if (g) t+=g[1]; }
  const fb=domainFx(S,u.front,'front_buff'); if (fb) t+=fb[2];
  if (blockingHome && (has(u.c,'rampart') || u.eq.some(e=>e.fx[0][3]==='rampart'))) t+=2; return t; }
const surgeOf=(P,u)=> ON('surge') && (has(u.c,'surge') || (P.ench.some(e=>fxOf(e,'grant_surge')) && (u.c.al==='S'||u.c.t==='vessel')));
function allegiance(P, side){ let n=0; const cnt=c=>{ if (c.al===side || c.al==='D') n++; };
  for (const u of P.units) if (!u.tok) cnt(u.c); for (const h of P.holds) cnt(h.c); for (const e of P.ench) cnt(e); for (const u of P.units) for (const r of u.eq) cnt(r); for (const r of P.relics) cnt(r);
  return n+P.domCount[side]; }
function reqOk(P, c){ if (!c.req) return true; if (c.al==='L') return allegiance(P,'L')>=c.req; if (c.al==='S') return allegiance(P,'S')>=c.req; if (c.al==='D') return Math.max(allegiance(P,'L'),allegiance(P,'S'))>=c.req; return true; }
// ---------- damage and death ----------
function damageUnit(S, P, u, n){ if (has(u.c,'tough')) n=Math.max(0,n-1); u.dmg+=n; }
function cleanup(S){ for (const P of S.p){ for (const u of P.units.slice()) if (u.dmg>=tghOf(S,P,u,false)){ P.units.splice(P.units.indexOf(u),1); if (!u.tok) P.disc.push(u.c); P.disc.push(...u.eq); S.log.deaths[P.i]++; } P.holds=P.holds.filter(h=>h.dur>0); } }
// ---------- targeting helpers ----------
const val=(S,P,u)=>powOf(S,P,u)*1.1+tghOf(S,P,u,false)*0.8+u.c.cost*0.4+(u.tok?-1:0);
function bestKill(S, P, n, pred){ let best=null, bs=-1e9; for (const u of P.units){ if (pred && !pred(u)) continue; const left=tghOf(S,P,u,false)-u.dmg; const kill=(has(u.c,'tough')?n-1:n)>=left; const s=(kill?100:0)+val(S,P,u); if (s>bs){ bs=s; best=u; } } return best; }
// where a Dual unit stands. v1: the emptier front. v2: next to a Leader, into a friendly Domain, away from the enemy's front-wide damage.
function chooseFront(S, P, O, c){ const h=homes(c); if (!ON('fronts')) return 'S'; if (h.length===1) return h[0];
  if (AI(P)===1){ const s=P.units.filter(u=>u.front==='S').length, d=P.units.filter(u=>u.front==='D').length; return s<=d?'S':'D'; }
  const score=f=>{ let v=0; if (P.units.some(u=>u.front===f && has(u.c,'leader'))) v+=2; const fb=domainFx(S,f,'front_buff'); if (fb) v+=1.5; if (O.ench.some(e=>{ const x=fxOf(e,'rise_sweep'); return x && x[1]===f; })) v-=2; if (O.relics.some(r=>{ const x=fxOf(r,'rise_ping'); return x && x[1]===f; })) v-=1; v-=0.3*P.units.filter(u=>u.front===f).length; return v; };
  return score('S')>=score('D')? 'S' : 'D'; }
// ---------- playing cards ----------
function enter(S, P, O, c, front){ const u=newUnit(c, front||chooseFront(S,P,O,c), S); P.units.push(u); S.log.unitsPlayed[P.i]++; for (const o of effFx(c)) applyFx(S,P,O,c,o,u); cleanup(S); return u; }
function applyFx(S, P, O, c, o, self){
  const k=o[0];
  if (k==='draw'||k==='scry_draw') draw(S,P,o[1]);
  else if (k==='draw_if_both'){ const L=P.units.some(u=>u.c.al==='L')||P.holds.length, Sa=P.units.some(u=>u.c.al==='S'||u.c.t==='vessel'); if (L&&Sa) draw(S,P,o[1]); }
  else if (k==='heal') P.harbor=Math.min(CFG.harbor,P.harbor+o[1]);
  else if (k==='ramp') P.cap=Math.min(R0.MAXCAP,P.cap+o[1]);
  else if (k==='ping'||k==='damage'){ const t=bestKill(S,O,o[1]); if (t) damageUnit(S,O,t,o[1]); }
  else if (k==='broadside'){ const t=bestKill(S,O,o[1],u=>u.front==='S'); if (t) damageUnit(S,O,t,o[1]); }
  else if (k==='bounce'){ const t=O.units.filter(u=>u.c.cost<=o[1]).sort((a,b)=>val(S,O,b)-val(S,O,a))[0]; if (t) bounceUnit(O,t); }
  else if (k==='destroy'){ const t=O.units.filter(u=>u.c.cost<=o[1]).sort((a,b)=>val(S,O,b)-val(S,O,a))[0]; if (t) t.dmg=999; }
  else if (k==='tokens'){ for (let i=0;i<o[1];i++) P.units.push(newUnit({n:o[2],t:'unit',al:'L',cost:0,pow:o[3],tgh:o[4],kw:[],fx:[]}, ON('fronts')?'S':'S', S, true)); }
  else if (k==='fortify'){ const h=P.holds.sort((a,b)=>a.dur-b.dur)[0]; if (h) h.dur+=o[1]; }
  else if (k==='damage_each_front'){ for (const f of ['S','D']){ const t=bestKill(S,O,o[1],u=>u.front===f); if (t) damageUnit(S,O,t,o[1]); } }
  else if (k==='sweep_front'){ let bf=null, bs=-1e9; for (const f of ['S','D']){ let s=0; for (const u of O.units) if (u.front===f && tghOf(S,O,u,false)-u.dmg<=o[1]) s+=val(S,O,u); for (const u of P.units) if (u.front===f && tghOf(S,P,u,false)-u.dmg<=o[1]) s-=val(S,P,u); if (s>bs){ bs=s; bf=f; } } for (const Q of [P,O]) for (const u of Q.units) if (u.front===bf) damageUnit(S,Q,u,o[1]); }
  else if (k==='rally') P.rally=(P.rally||0)+o[1];
  else if (k==='equip'){ const t=P.units.filter(u=>!u.tok).sort((a,b)=>val(S,P,b)-val(S,P,a))[0]; if (t) t.eq.push(c); else P.disc.push(c); }
  cleanup(S);
}
function bounceUnit(Q, t){ Q.units.splice(Q.units.indexOf(t),1); if (!t.tok) Q.hand.push(t.c); Q.disc.push(...t.eq); }
function draw(S, P, n){ for (let i=0;i<n;i++){ if (!P.deck.length){ P.decked=true; return; } P.hand.push(P.deck.pop()); } }
// how much the opponent's armies lean on each front: share of their units that attack the Shore at home
function shoreLean(S, O){ if (!O.units.length) return 0.5; let n=0; for (const u of O.units) if (homes(u.c).includes('S') || surgeOf(O,u)) n++; return n/O.units.length; }
// how much the player wants to play this card now (<=0: not now)
function wantScore(S, P, O, c){
  const t=c.t; let s=c.cost*1.0+0.5;
  if (t==='unit'||t==='vessel'){ if (P.units.length>=8) return -1; let v=s+(c.pow+c.tgh)*0.2;
    if (AI(P)===2){ if (t==='vessel'){ v+=0.4*Math.min(c.carry||0, P.units.filter(u=>u.c.al==='L').length); if (V('targets') && ON('screen')) v+=1.5*(1-shoreLean(S,O)); }
      if (c.al==='D' && V('escort') && ON('escort')) v+=0.4*P.units.filter(u=>u.c.al!=='D').length; }
    return v; }
  if (t==='stronghold'){ if (P.holds.length>=2) return -1; return AI(P)===2 && ON('walls')? s+0.5+2.5*shoreLean(S,O) : s+1; }
  if (t==='domain'){ const cur=S.dom[c.front]; if (cur && cur.owner===P.i) return -1; if (AI(P)===1) return s-0.5; return s-0.5+domainNet(S,P,O,c); }
  if (t==='enchantment') return P.ench.some(e=>e.id===c.id)? -1 : s;
  if (t==='relic'){ if (fxOf(c,'equip')) return P.units.some(u=>!u.tok)? s : -1; return P.relics.some(r=>r.id===c.id)? -1 : s+0.5; }
  for (const o of effFx(c)){ const k=o[0];
    if (k==='damage'||k==='ping'){ const tg=bestKill(S,O,o[1]); if (!tg || tghOf(S,O,tg,false)-tg.dmg>(has(tg.c,'tough')?o[1]-1:o[1])) return -1; return s+val(S,O,tg)*0.3; }
    if (k==='destroy'||k==='bounce'){ if (AI(P)===2 && has(c,'swift')) return -1;   // v2 keeps Swift bounce for the opponent's attack
      const tg=O.units.filter(u=>u.c.cost<=o[1]&&!u.tok).sort((a,b)=>val(S,O,b)-val(S,O,a))[0]; if (!tg || tg.c.cost<Math.min(c.cost,4)) return -1; return s+val(S,O,tg)*0.3; }
    if (k==='damage_each_front'){ return O.units.length>=2? s : -1; }
    if (k==='sweep_front'){ let best=-1e9; for (const f of ['S','D']){ let v=0; for (const u of O.units) if (u.front===f && tghOf(S,O,u,false)-u.dmg<=o[1]) v+=val(S,O,u); for (const u of P.units) if (u.front===f && tghOf(S,P,u,false)-u.dmg<=o[1]) v-=val(S,P,u); best=Math.max(best,v); } return best>=8? s+best*0.2 : -1; }
    if (k==='tokens') return P.units.length<=6? s : -1;
    if (k==='rally'){ const n=P.units.filter(u=>canAttack(S,P,u)).length; return n>=3? s+n : -1; }
    if (k==='pump'||k==='shift') return -1;     // Swift tricks are kept for battle
  }
  return s;
}
// what a Domain is worth to its player right now (v2): Domains affect both players, so count who benefits
function domainNet(S, P, O, c){ if (!ON('domains')) return -9; const o=effFx(c)[0]; const k=o[0]; const cnt=(Q,f)=>Q.units.filter(u=>u.front===f).length;
  if (k==='front_buff') return 1.2*(cnt(P,c.front)-cnt(O,c.front))+0.5;
  if (k==='strand_all') return O.units.some(u=>u.c.al==='L') && O.units.some(u=>u.c.carry)? 2 : -1;
  if (k==='max_attackers') return O.units.length>=3 && shoreLean(S,O)>0.5? 2 : -1;
  if (k==='raid_bonus') return shoreLean(S,P)-shoreLean(S,O)>0? 1 : -1;
  if (k==='reef_cross') return P.units.filter(u=>u.c.al==='S').length>=2? 2 : -1;
  return 0; }
function canAttack(S, P, u){ return u.ready && !u.stranded && (u.entered<S.turn || has(u.c,'charge')); }
function play(S, P, O, c, front){
  P.hand.splice(P.hand.indexOf(c),1); P.inf-=c.cost; S.log.played.push([P.i,c.id,S.turn,P.harbor-O.harbor,boardVal(S,P)-boardVal(S,O)]);
  if (c.t==='unit'||c.t==='vessel') return enter(S,P,O,c,front);
  if (c.t==='stronghold'){ P.holds.push({c,dur:c.fort}); return; }
  if (c.t==='domain'){ const cur=S.dom[c.front]; if (cur){ S.p[cur.owner].disc.push(cur.c); S.p[cur.owner].domCount[cur.c.al==='L'?'L':cur.c.al==='S'?'S':'X']--; } S.dom[c.front]={c,owner:P.i}; P.domCount[c.al==='L'?'L':c.al==='S'?'S':'X']++; return; }
  if (c.t==='enchantment'){ P.ench.push(c); return; }
  if (c.t==='relic'){ if (fxOf(c,'equip')) applyFx(S,P,O,c,fxOf(c,'equip')); else { P.relics.push(c); for (const o of effFx(c)) if (o[0]==='ramp') P.cap=Math.min(R0.MAXCAP,P.cap+o[1]); } return; }
  for (const o of effFx(c)) applyFx(S,P,O,c,o); P.disc.push(c);
}
const boardVal=(S,P)=>P.units.reduce((q,u)=>q+val(S,P,u),0);
const isReactive=c=>has(c,'ambush')||has(c,'swift');
// ---------- holding Influence for the opponent's turn ----------
// v1: hold the cheapest trick whenever the opponent's board power is at least ours.
// v2: hold for the most useful reactive card only when the opponent can really attack next turn, and only what that card costs.
function reserveFor(S, P, O){
  if (!ON('tricks')) return 0;
  const tricks=P.hand.filter(c=>isReactive(c) && c.cost<=P.cap && reqOk(P,c)); if (!tricks.length) return 0;
  if (AI(P)===1){ const oppPow=O.units.reduce((q,u)=>q+powOf(S,O,u),0), myPow=P.units.reduce((q,u)=>q+powOf(S,P,u),0); if (oppPow<myPow) return 0; return Math.min(...tricks.map(c=>c.cost)); }
  const threats=O.units.filter(u=>!u.stranded && powOf(S,O,u)>=2); if (!threats.length) return 0;
  // only cheap reactive cards are worth idling Influence for; big Ambush creatures are better played as ordinary units
  const cheap=tricks.filter(c=>c.cost<=3); if (!cheap.length) return 0;
  const incoming=threats.reduce((q,u)=>q+powOf(S,O,u),0);
  let best=null, bv=0;
  for (const c of cheap){ let v=0;
    if (has(c,'ambush')) v=Math.min(powOf(S,O,threats.sort((a,b)=>powOf(S,O,b)-powOf(S,O,a))[0]), c.pow)+tghBase(c)*0.3;
    else if (fxOf(c,'pump')) v= P.units.length? 3 : 0;
    else if (fxOf(c,'shift')||fxOf(c,'bounce')) v= Math.max(...threats.map(u=>powOf(S,O,u)))>=4? 4 : 1;
    if (incoming>=P.harbor-4) v*=1.6;
    v-=c.cost*0.5; if (v>bv){ bv=v; best=c; } }
  P._resV=bv; return best? best.cost : 0;
}
function mainPhase(S, P, O, post){
  let keep=reserveFor(S,P,O);
  // v2: holding Influence costs the play it displaces; hold only if the trick is worth more than that play
  if (AI(P)===2 && keep>0){ let all=0, res=0; for (const c of P.hand){ if (isReactive(c) || !reqOk(P,c)) continue; const w=wantScore(S,P,O,c); if (w<=0) continue; if (c.cost<=P.inf) all=Math.max(all,w); if (c.cost<=P.inf-keep) res=Math.max(res,w); }
    if (all-res > (P._resV||0)*1.2) keep=0; }
  for (let guard=0; guard<12; guard++){
    let best=null, bs=0;
    for (const c of P.hand){ if (!reqOk(P,c)) continue; const reactive=isReactive(c);
      // v1 let reactive cards ignore the reserve (and played Ambush units in its own turn); v2 never plays reactive cards in its own main phase unless it is the last chance to use the Influence well
      const room=P.inf-(reactive? 0 : keep); if (c.cost>room) continue;
      if (AI(P)===2 && reactive && has(c,'ambush') && keep>0 && c.cost<=keep) continue;
      if (AI(P)===2 && reactive && !has(c,'ambush') && (fxOf(c,'pump')||fxOf(c,'shift')||fxOf(c,'bounce'))) continue;   // Swift tricks wait for battle
      const s=wantScore(S,P,O,c); if (s>bs){ bs=s; best=c; } }
    if (!best) break; play(S,P,O,best); if (over(S)) return;
  }
  // a Shift before battle: move the opponent's best blocker out of position (it arrives exhausted)
  if (!post && ON('tricks')){ const sh=P.hand.find(c=>fxOf(c,'shift') && c.cost<=P.inf && reqOk(P,c)); const atk=P.units.filter(u=>canAttack(S,P,u)); const tg=O.units.filter(u=>u.ready).sort((a,b)=>val(S,O,b)-val(S,O,a))[0];
    if (sh && atk.length>=2 && tg && val(S,O,tg)>=6 && (AI(P)===1 || O.units.filter(u=>u.ready).length<=atk.length)){ P.hand.splice(P.hand.indexOf(sh),1); P.inf-=sh.cost; S.log.played.push([P.i,sh.id,S.turn,0,0]); tg.front=tg.front==='S'?'D':'S'; tg.ready=false; P.disc.push(sh); S.log.shiftOff[P.i]++; } }
}
// ---------- battle ----------
// result of one fight (who dies), honouring Home ground: a unit at home strikes first against one that is not
function fight(S, A, a, aHome, B, b, bHome, apply){
  const pa=powOf(S,A,a)+(a.trickP||0), pb=powOf(S,B,b)+(b.trickP||0); const ta=tghOf(S,A,a,false)+(a.trickT||0)-a.dmg, tb=tghOf(S,B,b,bHome)+(b.trickT||0)-b.dmg;
  const dA=has(a.c,'tough')?Math.max(0,pb-1):pb, dB=has(b.c,'tough')?Math.max(0,pa-1):pa;
  let aDies, bDies; const prio=ON('homeground');
  if (prio && aHome && !bHome){ bDies=dB>=tb; aDies=!bDies && dA>=ta; } else if (prio && bHome && !aHome){ aDies=dA>=ta; bDies=!aDies && dB>=tb; } else { aDies=dA>=ta; bDies=dB>=tb; }
  const simA=dA>=ta, simB=dB>=tb; const prioDecided=(aDies!==simA)||(bDies!==simB);
  if (apply){ if (!(prio&&bHome&&!aHome&&aDies)) b.dmg+=dB; if (!(prio&&aHome&&!bHome&&bDies)) a.dmg+=dA; if (aDies) a.dmg=999; if (bDies) b.dmg=999; }
  return {aDies, bDies, excess: Math.max(0, dB-tb), prioDecided};
}
const bHome=(b,f)=>homes(b.c).includes(f);
// v2: the defender's best answer to one attacker in one front, from the attacker's point of view (positive = good for the attacker)
function attackOutlook(S, P, O, u, f, home, blockers){
  let worst=1e9, how='open';
  for (const b of blockers){ const r=fight(S,P,u,home,O,b,bHome(b,f),false); let v;
    if (r.aDies && !r.bDies) v=-val(S,P,u); else if (r.aDies && r.bDies) v=val(S,O,b)-val(S,P,u); else if (!r.aDies && r.bDies) v=val(S,O,b)*0.8; else v=0;
    if (v<worst){ worst=v; how=r.aDies?'loses':'bounce'; } }
  return worst===1e9? null : worst;
}
function screenOf(S, O, f, u){ let left=0; if (f==='S' && ON('walls')) left+=O.holds.reduce((q,h)=>q+h.dur,0); if (f==='D' && V('targets') && ON('screen') && u.c.t!=='vessel') left+=O.units.filter(x=>x.c.t==='vessel').reduce((q,v)=>q+Math.max(0,tghOf(S,O,v,false)-v.dmg),0); return left; }
// v2 defender: choose blocks for a declared attack (also used by the attacker to predict the defence)
function chooseBlocks(S, P, O, plan, oppBlockers){
  const incoming=plan.reduce((q,a)=>q+powOf(S,P,a.u),0); let unblocked=incoming; const used=new Set(); const blocks=new Map();
  for (const a of plan.slice().sort((x,y)=>powOf(S,P,y.u)-powOf(S,P,x.u))){
    if (a.unb) continue; let pick=null, ps=-1e9;
    for (const b of oppBlockers(a.f)){ if (used.has(b.uid)) continue; const r=fight(S,P,a.u,a.home,O,b,bHome(b,a.f),false);
      const stop=Math.max(0,powOf(S,P,a.u)-screenOf(S,O,a.f,a.u)); const stopW= unblocked>=O.harbor? 3 : O.harbor<=8? 1.2 : 0.6;
      let v=(r.aDies?val(S,P,a.u):0) + stop*stopW - (r.bDies?val(S,O,b):0) + (bHome(b,a.f)?0.3:0); if (r.bDies && !r.aDies && !(unblocked>=O.harbor)) v-=2;
      if (v>ps){ ps=v; pick=b; } }
    if (pick && ps>0){ used.add(pick.uid); blocks.set(a,pick); unblocked-=powOf(S,P,a.u); } }
  return blocks;
}
// v2 attacker: value of a whole attack plan against the predicted defence, including the counterattack it invites
function planValue(S, P, O, plan, oppBlockers, atkers){
  const blocks=chooseBlocks(S,P,O,plan,oppBlockers); let v=0; const toH={S:0,D:0}; let toScreen=0;
  for (const a of plan){ const b=blocks.get(a);
    if (b){ const r=fight(S,P,a.u,a.home,O,b,bHome(b,a.f),false); v+=(r.bDies?val(S,O,b):0)-(r.aDies?val(S,P,a.u):0); if (!a.home && !r.aDies) v-=powOf(S,P,a.u)*0.5; }
    else { toH[a.f]+=powOf(S,P,a.u)+(!a.home && has(a.u.c,'raid')?1:0); if (!a.home) v-=powOf(S,P,a.u)*0.5; } }
  for (const f of ['S','D']){ const scr=screenOf(S,O,f,{c:{t:'unit'}}); const k=Math.min(scr,toH[f]); toScreen+=k; toH[f]-=k; }
  const harborHit=toH.S+toH.D; if (harborHit>=O.harbor) return 1000+harborHit;
  v+= harborHit*(O.harbor<=10?1.6:1.0) + toScreen*0.45;
  // counterattack: our attackers are exhausted on the opponent's turn; each remaining ready unit can stop one attacker
  const stay=P.units.filter(u=>!u.stranded && !plan.some(a=>a.u===u)).length;
  const theirs=O.units.filter(u=>!u.stranded).map(u=>powOf(S,O,u)).sort((a,b)=>b-a); const through=theirs.slice(stay).reduce((q,x)=>q+x,0);
  // racing: when our clock is faster than theirs, the counterattack matters less
  const ourPow=Math.max(1,P.units.reduce((q,u)=>q+powOf(S,P,u),0)), theirPow=Math.max(1,theirs.reduce((q,x)=>q+x,0)); const ahead=O.harbor/ourPow < P.harbor/theirPow;
  if (through>=P.harbor) v-=60; else v-=through*(P.harbor<=10?0.9:0.35)*(ahead?0.4:1);
  return v;
}
function frontOption(S, P, u, f, ctx){ let home=homes(u.c).includes(f) || (f==='S' && surgeOf(P,u)); let car=false, esc=false;
  if (!home && f==='D' && u.c.al==='L' && ctx.carry>0 && !domainFx(S,'D','strand_all')){ home=true; car=true; }
  if (!home && ctx.escorts>0 && u.c.al!=='D'){ home=true; esc=true; }
  const unb= ctx.reef>0 && f==='S' && u.c.al==='S'; return {u, f, home, car, esc, unb}; }
function planAttackV2(S, P, O, atkers, oppBlockers, fronts, maxS){
  const ctx0=()=>({carry:ON('carry')? P.units.reduce((q,u)=>q+(u.c.carry||0),0) : 0, escorts:V('escort') && ON('escort')? atkers.filter(u=>u.c.al==='D').length : 0, reef:domainFx(S,'D','reef_cross')? 1 : 0});
  // rebuild options so carry/escort/reef capacity is honoured in plan order
  const realise=sel=>{ const ctx=ctx0(); const out=[]; let nS=0; for (const [u,f] of sel){ if (f==='S' && maxS && nS>=maxS[1]) continue; const o=frontOption(S,P,u,f,ctx); if (o.car) ctx.carry--; if (o.esc) ctx.escorts--; if (o.unb) ctx.reef--; if (f==='S') nS++; out.push(o); } return out; };
  const natural=u=>{ const h=homes(u.c); return h.length===1? h[0] : (screenOf(S,O,'S',u)<=screenOf(S,O,'D',u)? 'S':'D'); };
  let sel=atkers.map(u=>[u,natural(u)]); let best=planValue(S,P,O,realise(sel),oppBlockers,atkers);
  for (let pass=0; pass<3; pass++){ let improved=false;
    for (const u of atkers){ const cur=sel.find(x=>x[0]===u);
      const alts=[]; if (cur) alts.push(sel.filter(x=>x[0]!==u)); for (const f of fronts){ if (cur && cur[1]===f) continue; alts.push(sel.filter(x=>x[0]!==u).concat([[u,f]])); }
      for (const alt of alts){ const v=planValue(S,P,O,realise(alt),oppBlockers,atkers); if (v>best+0.01){ best=v; sel=alt; improved=true; } } }
    if (!improved) break; }
  // record whether the choice between the fronts was a real one for each attacker: both fronts within 25% in plan value
  if (fronts.length===2) for (const [u,f] of sel){ const other=f==='S'?'D':'S'; const alt=sel.map(x=>x[0]===u?[u,other]:x); const v2=planValue(S,P,O,realise(alt),oppBlockers,atkers);
    S.log.decisions[P.i]++; if (best>0.5 && v2>0.5 && best-v2<=Math.max(1,0.25*best)) S.log.closeChoices[P.i]++; if (homes(u.c).length===1 && f!==homes(u.c)[0]) S.log.chooseCross[P.i]++; }
  if (best<=0) return [];
  return realise(sel);
}
function battle(S, P, O){
  const atkers=P.units.filter(u=>canAttack(S,P,u)); if (!atkers.length) return;
  let carry=0; if (ON('carry')) for (const u of P.units) if (u.c.carry) carry+=u.c.carry;
  const oppBlockers=f=>O.units.filter(u=>u.ready && !u.stranded && (!(u.c.t==='vessel' && f==='S') || !ON('fronts')));
  const fronts=ON('fronts')? ['S','D'] : ['S'];
  const totalPow=atkers.reduce((q,u)=>q+powOf(S,P,u),0);
  const lethal=totalPow>=O.harbor && oppBlockers('S').length+oppBlockers('D').length<=1;
  const plan=[]; const carried=new Set(); let usedCarry=0; const maxS=domainFx(S,'S','max_attackers'); let nS=0;
  const oppNext=O.units.reduce((q,u)=>q+powOf(S,O,u),0); const danger=oppNext>=P.harbor-4;
  const sorted=atkers.sort((a,b)=>powOf(S,P,b)-powOf(S,P,a));
  let escorts=V('escort') && ON('escort')? atkers.filter(u=>u.c.al==='D').length : 0; let reefFree=domainFx(S,'D','reef_cross')? 1 : 0;
  if (AI(P)===2){ for (const o of planAttackV2(S,P,O,sorted,oppBlockers,fronts,maxS)){ if (o.car) carried.add(o.u.uid); if (o.esc) S.log.escorted[P.i]++; if (o.unb) S.log.reef[P.i]++; plan.push({u:o.u, f:o.f, home:o.home, unb:o.unb, esc:o.esc, car:o.car}); } }
  else for (const u of sorted){
    if (AI(P)===1 && danger && !lethal && P.units.filter(x=>x.ready && !plan.some(p=>p.u===x)).length<=2 && u.c.t!=='vessel') continue;
    if (AI(P)===2 && danger && !lethal){ // v2: keep enough blockers to survive the counterattack (its blockers can come from either front)
      const keepers=P.units.filter(x=>x!==u && x.ready && !plan.some(p=>p.u===x)); const cover=keepers.reduce((q,x)=>q+powOf(S,P,x),0);
      if (oppNext-cover>=P.harbor-2 && u.c.t!=='vessel') continue; }
    let best=null, bs=-1e9; const opt={};
    for (const f of fronts){
      if (f==='S' && maxS && nS>=maxS[1]) continue;
      let home=homes(u.c).includes(f) || (f==='S' && surgeOf(P,u)); let carriedHere=false, escorted=false;
      if (!home && f==='D' && u.c.al==='L' && usedCarry<carry && !domainFx(S,'D','strand_all')){ home=true; carriedHere=true; }
      if (!home && escorts>0 && u.c.al!=='D'){ home=true; escorted=true; }
      const reefHere= reefFree>0 && f==='S' && u.c.al==='S';
      const bl=reefHere? [] : oppBlockers(f); let s;
      if (AI(P)===1){
        s=powOf(S,P,u); let worst=0; for (const b of bl){ const r=fight(S,P,u,home,O,b,bHome(b,f),false); if (r.aDies && !r.bDies) worst=Math.max(worst, 2); else if (r.aDies && r.bDies) worst=Math.max(worst, val(S,P,u)>val(S,O,b)? 1:0.3); }
        s-= worst*val(S,P,u)*0.6;
        if (O.holds.length && f==='S' && ON('walls') && u.c.t!=='vessel') s*=0.55;
        if (f==='S' && domainFx(S,'S','raid_bonus')) s+=1;
        if (!home) s-=2.5; if (!home && has(u.c,'raid')) s+=1.5; if (reefHere) s+=2;
        if (V('targets') && ON('screen') && f==='D' && O.units.some(x=>x.c.t==='vessel') && u.c.t!=='vessel') s*=0.6;
      } else {
        // v2: weigh the defender's best block, what unblocked damage actually reaches (Strongholds, Vessel screens),
        // the cost of being Stranded (no attack and no block next round), and how close the opponent is to defeat
        const out=attackOutlook(S,P,O,u,f,home,bl); let dmg=powOf(S,P,u)+(f==='S' && domainFx(S,'S','raid_bonus')?1:0)+(!home && has(u.c,'raid')?1:0);
        const scr=screenOf(S,O,f,u); const toHarbor=Math.max(0,dmg-scr); const harborW= O.harbor<=10? 1.6 : 1.0;
        const openV= toHarbor*harborW + Math.min(dmg,scr)*0.45;
        s= out===null? openV : Math.min(openV, out+0.5*openV*(bl.length<=1?0.6:0.2));
        if (!home){ const strandCost= powOf(S,P,u)*0.5 + (danger? val(S,P,u)*0.4 : 0.8); s-=strandCost; }
        if (reefHere) s+=1;
      }
      opt[f]=s; if (s>bs){ bs=s; best={f,home,carriedHere,escorted,reefHere}; }
    }
    if (!best) continue;
    if (bs<=0.5 && !lethal) continue;
    // decision records: a choice between the fronts is "real" when both are worth attacking and close in value
    if (fronts.length===2 && opt.S!=null && opt.D!=null){ S.log.decisions[P.i]++; const lo=Math.min(opt.S,opt.D), hi=Math.max(opt.S,opt.D); if (lo>0.5 && hi-lo<=Math.max(1,0.25*hi)) S.log.closeChoices[P.i]++; if (best.f!==homes(u.c)[0] && homes(u.c).length===1) S.log.chooseCross[P.i]++; }
    if (best.carriedHere){ usedCarry++; carried.add(u.uid); } if (best.f==='S') nS++; if (best.escorted){ escorts--; S.log.escorted[P.i]++; } if (best.reefHere){ reefFree--; S.log.reef[P.i]++; }
    plan.push({u, f:best.f, home:best.home, unb:!!best.reefHere, esc:best.escorted, car:best.carriedHere});
  }
  if (!plan.length) return; S.log.attacks[P.i]+=plan.length; for (const a of plan) if (!homes(a.u.c).includes(a.f) || (ON('fronts') && a.f==='S' && a.u.c.t==='vessel')) S.log.cross[P.i]++;
  for (const a of plan) a.u.ready=false;
  const tricksOn=ON('tricks');
  // defender: Ambush units come in from hand to block. v1 plays every one it can afford; v2 only those that make a good block
  if (tricksOn) for (const c of O.hand.slice()){ if (!has(c,'ambush') || c.cost>O.inf || !reqOk(O,c)) continue; const front=homes(c)[0];
    if (AI(O)===2){ const tmp={uid:-1,c,front,dmg:0,eq:[],tp:0,tt:0}; let good=false; for (const a of plan){ if (a.unb) continue; const r=fight(S,P,a.u,a.home,O,tmp,bHome(tmp,a.f),false); if ((r.aDies && !r.bDies) || (r.aDies && val(S,P,a.u)>=c.cost*1.5+2) || (!r.aDies && !r.bDies && powOf(S,P,a.u)>=4)) good=true; } if (!good) continue; }
    O.hand.splice(O.hand.indexOf(c),1); O.inf-=c.cost; S.log.played.push([O.i,c.id,S.turn,0,0]); const nu=enter(S,O,P,c,front); nu.ready=true; nu.amb=true; S.log.ambush[O.i]++; }
  // defender: Shift or a Swift bounce removes an attacker from the fight
  if (tricksOn){ const incoming0=plan.reduce((q,a)=>q+powOf(S,P,a.u),0);
    const sh=O.hand.find(c=>(fxOf(c,'shift')||(AI(O)===2 && has(c,'swift') && fxOf(c,'bounce'))) && c.cost<=O.inf && reqOk(O,c));
    if (sh){ const big=plan.slice().sort((x,y)=>powOf(S,P,y.u)-powOf(S,P,x.u))[0];
      const use= AI(O)===1? (fxOf(sh,'shift') && big && powOf(S,P,big.u)>=4) : (big && (powOf(S,P,big.u)>=4 || incoming0>=O.harbor) );
      if (use){ O.hand.splice(O.hand.indexOf(sh),1); O.inf-=sh.cost; S.log.played.push([O.i,sh.id,S.turn,0,0]); plan.splice(plan.indexOf(big),1); S.log.tricks.push([O.i,sh.id,'removed',powOf(S,P,big.u)]);
        if (fxOf(sh,'bounce')) bounceUnit(P,big.u); else big.u.front=big.u.front==='S'?'D':'S'; O.disc.push(sh); } } }
  // defender blocks
  const incoming=plan.reduce((q,a)=>q+powOf(S,P,a.u),0); const desperate=incoming>=O.harbor-3;
  const used=new Set(); const blocks=new Map();
  const order=BLK(O)===2? [] : plan.slice().sort((x,y)=>powOf(S,P,y.u)-powOf(S,P,x.u));
  if (BLK(O)===2) for (const [a,b] of chooseBlocks(S,P,O,plan,oppBlockers)){ used.add(b.uid); blocks.set(a,b); S.log.blocks[O.i]++; if (!bHome(b,a.f)) S.log.awayBlocks[O.i]++; if (b.amb) S.log.ambushBlocks[O.i]++; }
  let unblockedSoFar=incoming;
  for (const a of order){
    const cand=a.unb? [] : oppBlockers(a.f).filter(b=>!used.has(b.uid)); let pick=null, ps=-1e9;
    for (const b of cand){ const r=fight(S,P,a.u,a.home,O,b,bHome(b,a.f),false); let s=0;
      if (BLK(O)===1){ if (r.aDies && !r.bDies) s=10+val(S,P,a.u); else if (r.aDies && r.bDies) s= val(S,P,a.u)-val(S,O,b)+1; else if (!r.aDies && !r.bDies) s=powOf(S,P,a.u)>=3? 1 : -1; else s= desperate? 2-val(S,O,b)*0.2 : -5; }
      else { // v2: value of the block = what it kills + damage it stops - what it loses, with a home-front preference and a lethal check
        const stop=Math.max(0,powOf(S,P,a.u)-screenOf(S,O,a.f,a.u)); const stopW= unblockedSoFar>=O.harbor? 3 : O.harbor<=8? 1.2 : 0.6;
        s=(r.aDies?val(S,P,a.u):0) + stop*stopW - (r.bDies?val(S,O,b):0) + (bHome(b,a.f)?0.3:0); if (r.bDies && !r.aDies && !(unblockedSoFar>=O.harbor)) s-=2; }
      if (s>ps){ ps=s; pick=b; } }
    if (pick && ps>0){ used.add(pick.uid); blocks.set(a,pick); unblockedSoFar-=powOf(S,P,a.u); S.log.blocks[O.i]++; if (!bHome(pick,a.f)) S.log.awayBlocks[O.i]++; if (pick.amb) S.log.ambushBlocks[O.i]++; }
  }
  // Swift pump tricks. v1: whenever its unit would lose. v2: only if the pump actually changes the fight and the swing is worth the card.
  const trick=(Q,unit,enemy,qHome,eHome,isAtt)=>{ if (!tricksOn) return; const c=Q.hand.find(x=>fxOf(x,'pump') && x.cost<=Q.inf && reqOk(Q,x)); if (!c) return;
    const res=()=> isAtt? fight(S,P,unit,qHome,O,enemy,eHome,false) : fight(S,P,enemy,eHome,O,unit,qHome,false);
    const r0=res(); const loses0=isAtt? r0.aDies : r0.bDies, kills0=isAtt? r0.bDies : r0.aDies; if (!loses0 && (AI(Q)===1 || kills0)) return;
    const o=fxOf(c,'pump'); unit.trickP=(unit.trickP||0)+o[1]; unit.trickT=(unit.trickT||0)+o[2];
    const r1=res(); const loses1=isAtt? r1.aDies : r1.bDies, kills1=isAtt? r1.bDies : r1.aDies; const swing=(loses0&&!loses1?val(S,Q,unit):0)+(!kills0&&kills1?val(S,isAtt?O:P,enemy):0);
    if (AI(Q)===2 && swing<c.cost*1.5){ unit.trickP-=o[1]; unit.trickT-=o[2]; return; }
    Q.hand.splice(Q.hand.indexOf(c),1); Q.inf-=c.cost; Q.disc.push(c); S.log.played.push([Q.i,c.id,S.turn,0,0]); S.log.tricks.push([Q.i,c.id,swing>0?'flipped':'wasted',swing]); };
  for (const [a,b] of blocks){ trick(O,b,a.u,bHome(b,a.f),a.home,false); trick(P,a.u,b,a.home,bHome(b,a.f),true); }
  // resolve
  const toHarbor={S:0,D:0};
  for (const a of plan){ const b=blocks.get(a);
    if (b){ const r=fight(S,P,a.u,a.home,O,b,bHome(b,a.f),true); if (has(a.u.c,'trample') && r.bDies) toHarbor[a.f]+=r.excess;
      S.log.fights[P.i]++; if (r.prioDecided){ S.log.prioDecided[P.i]++; if (a.esc) S.log.escortDecided[P.i]++; if (a.car) S.log.carryDecided[P.i]++; if (!homes(a.u.c).includes(a.f)) S.log.crossDecided[P.i]++; }
      if (has(a.u.c,'undertow') && !r.bDies && O.units.includes(b)) bounceUnit(O,b);
      if (has(b.c,'undertow') && !r.aDies && P.units.includes(a.u)) bounceUnit(P,a.u); }
    else { let d=powOf(S,P,a.u); if (a.f==='S' && domainFx(S,'S','raid_bonus')) d+=1; if (!a.home && has(a.u.c,'raid')){ d+=1; S.log.raids[P.i]++; } toHarbor[a.f]+=d; }
    if (!a.home){ S.log.away[P.i]++; if (ON('strand') && P.units.includes(a.u) && a.u.dmg<999) a.u.stranded=true; } if (a.car) S.log.carried[P.i]++; }
  for (const u of P.units.concat(O.units)){ delete u.trickP; delete u.trickT; }
  const before=toHarbor.S+toHarbor.D;
  let s=toHarbor.S; if (ON('walls')) for (const h of O.holds){ if (s<=0) break; const k=Math.min(s,h.dur); h.dur-=k; s-=k; S.log.holdDmg[P.i]+=k; }
  let d=toHarbor.D; if (V('targets') && ON('screen')){ for (const v of O.units.filter(x=>x.c.t==='vessel')){ if (d<=0) break; const left=Math.max(0,tghOf(S,O,v,false)-v.dmg); const k=Math.min(d,left); v.dmg+=k; d-=k; S.log.vesselDmg[P.i]+=k; } }
  const w=O.ench.find(e=>fxOf(e,'harbor_ward')); const nUnb=plan.filter(a=>!blocks.has(a)).length;
  let total=s+d; if (w) total=Math.max(0,total-nUnb);
  const absorbed=before-(s+d);
  if (absorbed>0 && O.harbor>total && O.harbor<=before) S.log.screenSaved[O.i]++;   // the screens kept the defender alive this turn
  O.harbor-=total; S.log.harborDmg[P.i]+=total;
  cleanup(S);
}
// ---------- turn loop ----------
function over(S){ for (const P of S.p) if (P.harbor<=0 || P.decked){ S.over=true; S.win=1-P.i; S.why=P.harbor<=0?'harbor':'deck'; return true; } return false; }
function rise(S, P, O){
  P.cap=Math.min(R0.MAXCAP,P.cap+1); P.inf=P.cap; P.rally=0;
  for (const u of P.units){ if (u.stranded){ u.stranded=false; u.ready=false; S.log.strandedTurns[P.i]++; } else u.ready=true; }
  for (const r of P.relics){ const f=fxOf(r,'rise_ping'); if (f){ const t=bestKill(S,O,f[2],u=>u.front===f[1]); if (t) damageUnit(S,O,t,f[2]); } }
  for (const h of P.holds){ const f=fxOf(h.c,'rise_heal'); if (f) P.harbor=Math.min(CFG.harbor,P.harbor+f[1]); }
  for (const e of P.ench){ const f=fxOf(e,'rise_sweep'); if (f) for (const u of O.units) if (u.front===f[1] || !ON('fronts')) damageUnit(S,O,u,f[2]); }
  cleanup(S);
}
const ZERO=()=>[0,0];
function play1(deckA, deckB, seed, cfg){
  cfg=cfg||{}; CFG={v:cfg.v instanceof Set? cfg.v : new Set(cfg.v||[]), off:cfg.off instanceof Set? cfg.off : new Set(cfg.off||[]), blk:cfg.blk? (Array.isArray(cfg.blk)? cfg.blk : [cfg.blk,cfg.blk]) : null, ai:cfg.ai||1, ais:Array.isArray(cfg.ai)? cfg.ai : [cfg.ai||1,cfg.ai||1], bonus:cfg.bonus||{inf:2,card:0}, scale:cfg.scale||{}, harbor:cfg.harbor||20};
  const r=mk(seed); const S={r, turn:0, dom:{S:null,D:null}, over:false, win:-1, why:'', log:{played:[], tricks:[]}};
  for (const k of ['cross','escorted','reef','raids','vesselDmg','blocks','awayBlocks','away','carried','deaths','harborDmg','holdDmg','attacks','ambush','ambushBlocks','strandedTurns','unitsPlayed','fights','prioDecided','escortDecided','carryDecided','crossDecided','screenSaved','decisions','closeChoices','chooseCross','shiftOff']) S.log[k]=ZERO();
  S.p=[deckA,deckB].map((d,i)=>{ const deck=d.slice(); for (let k=deck.length-1;k>0;k--){ const j=Math.floor(r()*(k+1)); [deck[k],deck[j]]=[deck[j],deck[k]]; }
    return {i, deck, hand:[], disc:[], units:[], holds:[], ench:[], relics:[], harbor:CFG.harbor, cap:0, inf:0, domCount:{L:0,S:0,X:0}}; });
  for (const P of S.p){ draw(S,P,R0.HAND); if (!P.hand.some(c=>c.cost<=3)){ P.deck.push(...P.hand.splice(0)); for (let k=P.deck.length-1;k>0;k--){ const j=Math.floor(r()*(k+1)); [P.deck[k],P.deck[j]]=[P.deck[j],P.deck[k]]; } draw(S,P,R0.HAND); } }
  let cur=r()<0.5?0:1; const first=cur;
  if (CFG.bonus.card) draw(S,S.p[1-first],CFG.bonus.card);
  while (!S.over && S.turn<R0.TURNCAP*2){
    S.turn++; const P=S.p[cur], O=S.p[1-cur];
    rise(S,P,O); if (S.turn===2) P.inf+=CFG.bonus.inf; if (over(S)) break;
    if (!(S.turn===1)) draw(S,P,1); if (over(S)) break;
    mainPhase(S,P,O,false); if (over(S)) break;
    battle(S,P,O); if (over(S)) break;
    mainPhase(S,P,O,true); if (over(S)) break;
    for (const Q of S.p) for (const u of Q.units) u.dmg=0;
    cur=1-cur;
  }
  if (!S.over){ S.win=S.p[0].harbor>S.p[1].harbor?0:S.p[1].harbor>S.p[0].harbor?1:-1; S.why='time'; }
  return {w:S.win, first, turns:Math.ceil(S.turn/2), why:S.why, log:S.log, harbor:[S.p[0].harbor,S.p[1].harbor]};
}
module.exports={play:play1, homes, R0, ID};
