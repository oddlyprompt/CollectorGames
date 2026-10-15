// Tidemark prototype rules engine (headless). Rules: design/tcg2/prototype-rules.md. Cards: cards.js.
// Plays full games between two 50-card decks with a greedy player on both sides, and records what happened
// (game length, which cards were played when, how games ended) for the balance report (sim.js).
const {CARDS}=require('./cards.js');
const R0={HARBOR:+(process.env.TM_HARBOR||20), HAND:6, DECK:50, MAXCAP:10, TURNCAP:40, SECOND_BONUS:+(process.env.TM_BONUS||2)};
function mk(seed){ let h=(seed>>>0)||1; return ()=>{ h^=h<<13; h>>>=0; h^=h>>>17; h^=h<<5; h>>>=0; return h/4294967296; }; }
const VAR=new Set((process.env.TM_VAR||'').split(',').filter(Boolean));
// variant 'raid': the fast raiders get Raid (an away attacker that goes unblocked deals +1 to the Harbor)
if (VAR.has('raid')) for (const c of CARDS) if (['Thicket Fox','Mossback Boar','Royal Lancer','Reef Scout','Current Dancer','Deckhand Brawler','Privateer Captain','Swift Cutter'].includes(c.n)) c.kw=c.kw.concat('raid');
// variant 'reef': Coral Spire rewards crossing instead of punishing it (the first Sea unit attacking the Shore each turn can't be blocked)
if (VAR.has('reef')) for (const c of CARDS) if (c.n==='Coral Spire') c.fx=[['reef_cross']];
const ID={}; for (const c of CARDS) ID[c.id]=c;
const has=(c,k)=>c.kw.includes(k);
const fxOf=(c,k)=>c.fx.find(o=>o[0]===k);
// where a card is at home: Land on the Shore, Sea in the Deep, Dual and Neutral in both. Vessels belong to the Deep.
function homes(c){ if (c.t==='vessel') return ['D']; return c.al==='L'? ['S'] : c.al==='S'? ['D'] : ['S','D']; }
let UID=1;
function newUnit(c, front, S, tok){ return {uid:UID++, c, front, dmg:0, ready:false, entered:S.turn, stranded:false, eq:[], tp:0, tt:0, tok:!!tok}; }
// ---------- statics ----------
function domainFx(S, front, k){ const d=S.dom[front]; return d && fxOf(d.c,k); }
function powOf(S, P, u){ let p=u.c.pow+u.tp; for (const e of u.eq) p+=e.fx[0][1]; for (const o of P.units) if (o!==u && o.front===u.front && has(o.c,'leader')) p+=1;
  const fb=domainFx(S,u.front,'front_buff'); if (fb) p+=fb[1]; if (P.rally) p+=P.rally; return Math.max(0,p); }
function tghOf(S, P, u, blockingHome){ let t=u.c.tgh+u.tt; for (const e of u.eq) t+=e.fx[0][2];
  for (const s of P.holds) { const f=fxOf(s.c,'shore_toughness'); if (f && u.front==='S') t+=f[1]; const g=fxOf(s.c,'all_toughness'); if (g) t+=g[1]; }
  const fb=domainFx(S,u.front,'front_buff'); if (fb) t+=fb[2];
  if (blockingHome && (has(u.c,'rampart') || u.eq.some(e=>e.fx[0][3]==='rampart'))) t+=2; return t; }
const surgeOf=(P,u)=>has(u.c,'surge') || (P.ench.some(e=>fxOf(e,'grant_surge')) && (u.c.al==='S'||u.c.t==='vessel'));
function allegiance(P, side){ let n=0; const cnt=c=>{ if (c.al===side || c.al==='D') n++; };
  for (const u of P.units) if (!u.tok) cnt(u.c); for (const h of P.holds) cnt(h.c); for (const e of P.ench) cnt(e); for (const u of P.units) for (const r of u.eq) cnt(r); for (const r of P.relics) cnt(r);
  return n+P.domCount[side]; }
function reqOk(P, c){ if (!c.req) return true; if (c.al==='L') return allegiance(P,'L')>=c.req; if (c.al==='S') return allegiance(P,'S')>=c.req; if (c.al==='D') return Math.max(allegiance(P,'L'),allegiance(P,'S'))>=c.req; return true; }
// ---------- damage and death ----------
function damageUnit(S, P, u, n){ if (has(u.c,'tough')) n=Math.max(0,n-1); u.dmg+=n; }
function cleanup(S){ for (const P of S.p){ for (const u of P.units.slice()) if (u.dmg>=tghOf(S,P,u,false)){ P.units.splice(P.units.indexOf(u),1); if (!u.tok) P.disc.push(u.c); P.disc.push(...u.eq); S.log.deaths[P.i]++; } P.holds=P.holds.filter(h=>h.dur>0); } }
function hitHarbor(S, P, n, fromFront){ const w=P.ench.find(e=>fxOf(e,'harbor_ward')); if (w) n=Math.max(0,n-1); P.harbor-=n; S.log.harborDmg[1-P.i]+=n; }
// ---------- targeting helpers (the greedy player's choices) ----------
const val=(S,P,u)=>powOf(S,P,u)*1.1+tghOf(S,P,u,false)*0.8+u.c.cost*0.4+(u.tok?-1:0);
function bestKill(S, P, n, pred){ let best=null, bs=-1e9; for (const u of P.units){ if (pred && !pred(u)) continue; const left=tghOf(S,P,u,false)-u.dmg; const kill=(has(u.c,'tough')?n-1:n)>=left; const s=(kill?100:0)+val(S,P,u); if (s>bs){ bs=s; best=u; } } return best; }
function chooseFront(P, c){ const h=homes(c); if (h.length===1) return h[0]; const s=P.units.filter(u=>u.front==='S').length, d=P.units.filter(u=>u.front==='D').length; return s<=d?'S':'D'; }
// ---------- playing cards ----------
function enter(S, P, O, c, front){ const u=newUnit(c, front||chooseFront(P,c), S); P.units.push(u); S.log.unitsPlayed[P.i]++; for (const o of c.fx) applyFx(S,P,O,c,o,u); cleanup(S); return u; }
function applyFx(S, P, O, c, o, self){
  const k=o[0];
  if (k==='draw') draw(S,P,o[1]);
  else if (k==='scry_draw') draw(S,P,o[1]);
  else if (k==='draw_if_both'){ const L=P.units.some(u=>u.c.al==='L')||P.holds.length, Sa=P.units.some(u=>u.c.al==='S'||u.c.t==='vessel'); if (L&&Sa) draw(S,P,o[1]); }
  else if (k==='heal') P.harbor=Math.min(R0.HARBOR,P.harbor+o[1]);
  else if (k==='ramp') P.cap=Math.min(R0.MAXCAP,P.cap+o[1]);
  else if (k==='ping'||k==='damage'){ const t=bestKill(S,O,o[1]); if (t) damageUnit(S,O,t,o[1]); }
  else if (k==='broadside'){ const t=bestKill(S,O,o[1],u=>u.front==='S'); if (t) damageUnit(S,O,t,o[1]); }
  else if (k==='bounce'){ const t=O.units.filter(u=>u.c.cost<=o[1]).sort((a,b)=>val(S,O,b)-val(S,O,a))[0]; if (t){ O.units.splice(O.units.indexOf(t),1); if (!t.tok) O.hand.push(t.c); O.disc.push(...t.eq); } }
  else if (k==='destroy'){ const t=O.units.filter(u=>u.c.cost<=o[1]).sort((a,b)=>val(S,O,b)-val(S,O,a))[0]; if (t) t.dmg=999; }
  else if (k==='tokens'){ for (let i=0;i<o[1];i++) P.units.push(Object.assign(newUnit({n:o[2],t:'unit',al:'L',cost:0,pow:o[3],tgh:o[4],kw:[],fx:[]}, 'S', S, true))); }
  else if (k==='fortify'){ const h=P.holds.sort((a,b)=>a.dur-b.dur)[0]; if (h) h.dur+=o[1]; }
  else if (k==='damage_each_front'){ for (const f of ['S','D']){ const t=bestKill(S,O,o[1],u=>u.front===f); if (t) damageUnit(S,O,t,o[1]); } }
  else if (k==='sweep_front'){ let bf=null, bs=-1e9; for (const f of ['S','D']){ let s=0; for (const u of O.units) if (u.front===f && tghOf(S,O,u,false)-u.dmg<=o[1]) s+=val(S,O,u); for (const u of P.units) if (u.front===f && tghOf(S,P,u,false)-u.dmg<=o[1]) s-=val(S,P,u); if (s>bs){ bs=s; bf=f; } } for (const Q of [P,O]) for (const u of Q.units) if (u.front===bf) damageUnit(S,Q,u,o[1]); }
  else if (k==='rally') P.rally=(P.rally||0)+o[1];
  else if (k==='equip'){ const t=P.units.filter(u=>!u.tok).sort((a,b)=>val(S,P,b)-val(S,P,a))[0]; if (t) t.eq.push(c); else P.disc.push(c); }
  cleanup(S);
}
function draw(S, P, n){ for (let i=0;i<n;i++){ if (!P.deck.length){ P.decked=true; return; } P.hand.push(P.deck.pop()); } }
// how much the greedy player wants to play this card now (<=0: not now)
function wantScore(S, P, O, c){
  const t=c.t; let s=c.cost*1.0+0.5;
  if (t==='unit'||t==='vessel'){ if (P.units.length>=8) return -1; return s+(c.pow+c.tgh)*0.2; }
  if (t==='stronghold') return P.holds.length>=2? -1 : s+1;
  if (t==='domain'){ const cur=S.dom[c.front]; if (cur && cur.owner===P.i) return -1; return s-0.5; }
  if (t==='enchantment') return P.ench.some(e=>e.id===c.id)? -1 : s;
  if (t==='relic'){ if (fxOf(c,'equip')) return P.units.some(u=>!u.tok)? s : -1; return P.relics.some(r=>r.id===c.id)? -1 : s+0.5; }
  // spells
  for (const o of c.fx){ const k=o[0];
    if (k==='damage'||k==='ping'){ const tg=bestKill(S,O,o[1]); if (!tg || tghOf(S,O,tg,false)-tg.dmg>(has(tg.c,'tough')?o[1]-1:o[1])) return -1; return s+val(S,O,tg)*0.3; }
    if (k==='destroy'||k==='bounce'){ const tg=O.units.filter(u=>u.c.cost<=o[1]&&!u.tok).sort((a,b)=>val(S,O,b)-val(S,O,a))[0]; if (!tg || tg.c.cost<Math.min(c.cost,4)) return -1; return s+val(S,O,tg)*0.3; }
    if (k==='damage_each_front'){ return O.units.length>=2? s : -1; }
    if (k==='sweep_front'){ let best=-1e9; for (const f of ['S','D']){ let v=0; for (const u of O.units) if (u.front===f && tghOf(S,O,u,false)-u.dmg<=o[1]) v+=val(S,O,u); for (const u of P.units) if (u.front===f && tghOf(S,P,u,false)-u.dmg<=o[1]) v-=val(S,P,u); best=Math.max(best,v); } return best>=8? s+best*0.2 : -1; }
    if (k==='tokens') return P.units.length<=6? s : -1;
    if (k==='rally'){ const n=P.units.filter(u=>canAttack(S,P,u)).length; return n>=3? s+n : -1; }
    if (k==='pump'||k==='shift') return -1;     // swift tricks are kept for battle
  }
  return s;
}
function canAttack(S, P, u){ return u.ready && !u.stranded && (u.entered<S.turn || has(u.c,'charge')); }
function play(S, P, O, c, front){
  P.hand.splice(P.hand.indexOf(c),1); P.inf-=c.cost; S.log.played.push([P.i,c.id,S.turn]);
  if (c.t==='unit'||c.t==='vessel') return enter(S,P,O,c,front);
  if (c.t==='stronghold'){ P.holds.push({c,dur:c.fort}); return; }
  if (c.t==='domain'){ const cur=S.dom[c.front]; if (cur){ S.p[cur.owner].disc.push(cur.c); S.p[cur.owner].domCount[cur.c.al==='L'?'L':cur.c.al==='S'?'S':'X']--; } S.dom[c.front]={c,owner:P.i}; P.domCount[c.al==='L'?'L':c.al==='S'?'S':'X']++; return; }
  if (c.t==='enchantment'){ P.ench.push(c); return; }
  if (c.t==='relic'){ if (fxOf(c,'equip')) applyFx(S,P,O,c,fxOf(c,'equip')); else { P.relics.push(c); for (const o of c.fx) if (o[0]==='ramp') P.cap=Math.min(R0.MAXCAP,P.cap+o[1]); } return; }
  for (const o of c.fx) applyFx(S,P,O,c,o); P.disc.push(c);
}
// keep Influence back for Ambush units and Swift spells when the opponent's board is threatening
function reserveFor(S, P, O){ const oppPow=O.units.reduce((q,u)=>q+powOf(S,O,u),0), myPow=P.units.reduce((q,u)=>q+powOf(S,P,u),0); if (oppPow<myPow) return 0;
  const tricks=P.hand.filter(c=>(has(c,'ambush')||has(c,'swift')) && c.cost<=P.cap && reqOk(P,c)); return tricks.length? Math.min(...tricks.map(c=>c.cost)) : 0; }
function mainPhase(S, P, O, post){
  const keep=post? reserveFor(S,P,O) : reserveFor(S,P,O);
  for (let guard=0; guard<12; guard++){
    let best=null, bs=0;
    for (const c of P.hand){ if (c.cost>P.inf-(has(c,'ambush')||has(c,'swift')?0:keep) || !reqOk(P,c)) continue; const s=wantScore(S,P,O,c); if (s>bs){ bs=s; best=c; } }
    if (!best) break; play(S,P,O,best); if (over(S)) return;
  }
  // a Shift before battle: move the opponent's best blocker out of position (it arrives exhausted)
  if (!post){ const sh=P.hand.find(c=>fxOf(c,'shift') && c.cost<=P.inf && reqOk(P,c)); const atk=P.units.filter(u=>canAttack(S,P,u)); const tg=O.units.filter(u=>u.ready).sort((a,b)=>val(S,O,b)-val(S,O,a))[0];
    if (sh && atk.length>=2 && tg && val(S,O,tg)>=6){ P.hand.splice(P.hand.indexOf(sh),1); P.inf-=sh.cost; S.log.played.push([P.i,sh.id,S.turn]); tg.front=tg.front==='S'?'D':'S'; tg.ready=false; P.disc.push(sh); } }
}
// ---------- battle ----------
function atHome(S, P, u, front, carriedSet){ if (homes(u.c).includes(front)){ return true; }
  if (front==='S' && surgeOf(P,u)) return true;
  if (front==='D' && carriedSet && carriedSet.has(u.uid) && !domainFx(S,'D','strand_all')) return true; return false; }
// result of one fight (who dies), honouring Home ground: a unit at home strikes first against one that is not
function fight(S, A, a, aHome, B, b, bHome, apply){
  const pa=powOf(S,A,a)+(a.trickP||0), pb=powOf(S,B,b)+(b.trickP||0); const ta=tghOf(S,A,a,false)+(a.trickT||0)-a.dmg, tb=tghOf(S,B,b,bHome)+(b.trickT||0)-b.dmg;
  const dA=has(a.c,'tough')?Math.max(0,pb-1):pb, dB=has(b.c,'tough')?Math.max(0,pa-1):pa;
  let aDies, bDies;
  if (aHome && !bHome){ bDies=dB>=tb; aDies=!bDies && dA>=ta; } else if (bHome && !aHome){ aDies=dA>=ta; bDies=!aDies && dB>=tb; } else { aDies=dA>=ta; bDies=dB>=tb; }
  if (apply){ if (!(bHome&&!aHome&&aDies)) b.dmg+=dB; if (!(aHome&&!bHome&&bDies)) a.dmg+=dA; if (aDies) a.dmg=999; if (bDies) b.dmg=999; }
  return {aDies, bDies, excess: Math.max(0, dB-tb)};
}
function battle(S, P, O){
  const atkers=P.units.filter(u=>canAttack(S,P,u)); if (!atkers.length) return;
  // carriers: Vessels (and the Dockmaster) let Land units fight in the Deep as if at home
  let carry=0; for (const u of P.units) if (u.c.carry) carry+=u.c.carry;
  const oppHarbor=O.harbor; const oppBlockers=f=>O.units.filter(u=>u.ready && !u.stranded && !(u.c.t==='vessel' && f==='S'));
  const bHome=(b,f)=>homes(b.c).includes(f);
  const totalPow=atkers.reduce((q,u)=>q+powOf(S,P,u),0);
  const lethal=totalPow>=oppHarbor+ (O.holds.reduce((q,h)=>q+h.dur,0)>0? 0:0) && oppBlockers('S').length+oppBlockers('D').length<=1;
  const plan=[]; const carried=new Set(); let usedCarry=0; const maxS=domainFx(S,'S','max_attackers'); let nS=0;
  // the counterattack we must survive: keep blockers back when the opponent could hit hard next turn
  const oppNext=O.units.reduce((q,u)=>q+powOf(S,O,u),0); const danger=oppNext>=P.harbor-4;
  const sorted=atkers.sort((a,b)=>powOf(S,P,b)-powOf(S,P,a));
  let escorts=VAR.has('escort')? atkers.filter(u=>u.c.al==='D').length : 0; let reefFree=VAR.has('reef') && S.dom.D && fxOf(S.dom.D.c,'reef_cross') ? 1 : 0;
  for (const u of sorted){
    if (danger && !lethal && P.units.filter(x=>x.ready && !plan.some(p=>p.u===x)).length<=2 && u.c.t!=='vessel'){ continue; }
    let best=null, bs=-1e9;
    for (const f of ['S','D']){
      if (u.c.t==='vessel' && f==='S' && !surgeOf(P,u)) { /* a ship can raid the Shore only with Surge-like help, otherwise stranded */ }
      if (f==='S' && maxS && nS>=maxS[1]) continue;
      let home=homes(u.c).includes(f) || (f==='S' && surgeOf(P,u)); let carriedHere=false;
      if (!home && f==='D' && u.c.al==='L' && usedCarry<carry && !domainFx(S,'D','strand_all')){ home=true; carriedHere=true; }
      let escorted=false; if (!home && escorts>0 && u.c.al!=='D'){ home=true; escorted=true; }
      const reefHere= reefFree>0 && f==='S' && u.c.al==='S';
      const bl=oppBlockers(f); let s=powOf(S,P,u);
      // would a blocker beat it? (the defender picks the best block)
      let worst=0; if (!reefHere) for (const b of bl){ const r=fight(S,P,u,home,O,b,bHome(b,f),false); if (r.aDies && !r.bDies) worst=Math.max(worst, 2); else if (r.aDies && r.bDies) worst=Math.max(worst, val(S,P,u)>val(S,O,b)? 1:0.3); }
      s-= worst*val(S,P,u)*0.6;
      if (O.holds.length && (f==='S' || (process.env.TM_WALLS||'shore')!=='shore') && u.c.t!=='vessel') s*=0.55;          // a Stronghold soaks unblocked damage on the Shore
      if (f==='S' && domainFx(S,'S','raid_bonus')) s+=1;
      if (!home) s-=2.5;                                  // stranded next turn and struck first by home defenders
      if (!home && has(u.c,'raid')) s+=1.5;
      if (reefHere) s+=2;
      if (VAR.has('targets') && f==='D' && O.units.some(x=>x.c.t==='vessel') && u.c.t!=='vessel') s*=0.6;   // the defender's Vessels screen the Deep
      if (s>bs){ bs=s; best={f,home,carriedHere,escorted,reefHere}; }
    }
    if (!best) continue;
    if (bs<=0.5 && !lethal) continue;
    if (best.carriedHere){ usedCarry++; carried.add(u.uid); } if (best.f==='S') nS++; if (best.escorted){ escorts--; S.log.escorted[P.i]++; } if (best.reefHere){ reefFree--; S.log.reef[P.i]++; }
    plan.push({u, f:best.f, home:best.home, unb:!!best.reefHere});
  }
  if (!plan.length) return; S.log.attacks[P.i]+=plan.length; for (const a of plan) if (!homes(a.u.c).includes(a.f)) S.log.cross[P.i]++;
  for (const a of plan) a.u.ready=false;
  // defender: Ambush units come in from hand to block
  for (const c of O.hand.slice()){ if (!has(c,'ambush') || c.cost>O.inf || !reqOk(O,c)) continue; const front=homes(c)[0]; O.hand.splice(O.hand.indexOf(c),1); O.inf-=c.cost; S.log.played.push([O.i,c.id,S.turn]); const nu=enter(S,O,P,c,front); nu.ready=true; S.log.ambush[O.i]++; }
  // defender: Shift an attacker away (it ends up exhausted on the other front, out of the fight)
  const sh=O.hand.find(c=>fxOf(c,'shift') && c.cost<=O.inf && reqOk(O,c)); if (sh){ const big=plan.slice().sort((x,y)=>powOf(S,P,y.u)-powOf(S,P,x.u))[0]; if (big && powOf(S,P,big.u)>=4){ O.hand.splice(O.hand.indexOf(sh),1); O.inf-=sh.cost; S.log.played.push([O.i,sh.id,S.turn]); plan.splice(plan.indexOf(big),1); big.u.front=big.u.front==='S'?'D':'S'; O.disc.push(sh); } }
  // defender blocks
  const incoming=plan.reduce((q,a)=>q+powOf(S,P,a.u),0); const desperate=incoming>=O.harbor-3;
  const used=new Set(); const blocks=new Map();
  for (const a of plan.slice().sort((x,y)=>powOf(S,P,y.u)-powOf(S,P,x.u))){
    const cand=a.unb? [] : oppBlockers(a.f).filter(b=>!used.has(b.uid)); let pick=null, ps=-1e9;
    for (const b of cand){ const r=fight(S,P,a.u,a.home,O,b,bHome(b,a.f),false); let s=0;
      if (r.aDies && !r.bDies) s=10+val(S,P,a.u); else if (r.aDies && r.bDies) s= val(S,P,a.u)-val(S,O,b)+1; else if (!r.aDies && !r.bDies) s=powOf(S,P,a.u)>=3? 1 : -1; else s= desperate? 2-val(S,O,b)*0.2 : -5;
      if (s>ps){ ps=s; pick=b; } }
    if (pick && ps>0){ used.add(pick.uid); blocks.set(a,pick); S.log.blocks[O.i]++; if (!bHome(pick,a.f)) S.log.awayBlocks[O.i]++; }
  }
  // Swift tricks: the defender pumps a blocker that would lose; the attacker pumps an attacker that would lose
  const trick=(Q,unit,enemy,qHome,eHome,isAtt)=>{ const c=Q.hand.find(x=>fxOf(x,'pump') && x.cost<=Q.inf && reqOk(Q,x)); if (!c) return; const r=isAtt? fight(S,P,unit,qHome,O,enemy,eHome,false) : fight(S,P,enemy,eHome,O,unit,qHome,false); const loses=isAtt? r.aDies : r.bDies; if (!loses) return;
    const o=fxOf(c,'pump'); unit.trickP=(unit.trickP||0)+o[1]; unit.trickT=(unit.trickT||0)+o[2]; Q.hand.splice(Q.hand.indexOf(c),1); Q.inf-=c.cost; Q.disc.push(c); S.log.played.push([Q.i,c.id,S.turn]); };
  for (const [a,b] of blocks){ trick(O,b,a.u,bHome(b,a.f),a.home,false); trick(P,a.u,b,a.home,bHome(b,a.f),true); }
  // resolve
  const toHarbor={S:0,D:0};
  for (const a of plan){ const b=blocks.get(a);
    if (b){ const r=fight(S,P,a.u,a.home,O,b,bHome(b,a.f),true); if (has(a.u.c,'trample') && r.bDies) toHarbor[a.f]+=r.excess;
      if (has(a.u.c,'undertow') && !r.bDies && O.units.includes(b)){ O.units.splice(O.units.indexOf(b),1); if (!b.tok) O.hand.push(b.c); O.disc.push(...b.eq); }
      if (has(b.c,'undertow') && !r.aDies && P.units.includes(a.u)){ P.units.splice(P.units.indexOf(a.u),1); if (!a.u.tok) P.hand.push(a.u.c); P.disc.push(...a.u.eq); } }
    else { let d=powOf(S,P,a.u); if (a.f==='S' && domainFx(S,'S','raid_bonus')) d+=1; if (!a.home && has(a.u.c,'raid')){ d+=1; S.log.raids[P.i]++; } if (a.u.c.t==='vessel' && (process.env.TM_WALLS||'shore')!=='shore') toHarbor.V=(toHarbor.V||0)+d; else toHarbor[a.f]+=d; }
    if (!a.home){ S.log.away[P.i]++; if (P.units.includes(a.u) && a.u.dmg<999) a.u.stranded=true; } if (carried.has(a.u.uid)) S.log.carried[P.i]++; }
  for (const u of P.units.concat(O.units)){ delete u.trickP; delete u.trickT; }
  // unblocked damage: on the Shore a Stronghold takes it first, then the Harbor
  let s=toHarbor.S+((process.env.TM_WALLS||'shore')==='shore'?0:toHarbor.D); if ((process.env.TM_WALLS||'shore')!=='shore') toHarbor.D=toHarbor.V||0; for (const h of O.holds){ if (s<=0) break; const k=Math.min(s,h.dur); h.dur-=k; s-=k; S.log.holdDmg[P.i]+=k; }
  if (VAR.has('targets')){ for (const v of O.units.filter(x=>x.c.t==='vessel')){ if (toHarbor.D<=0) break; const left=Math.max(0,tghOf(S,O,v,false)-v.dmg); const k=Math.min(toHarbor.D,left); v.dmg+=k; toHarbor.D-=k; S.log.vesselDmg[P.i]+=k; } }
  const w=O.ench.find(e=>fxOf(e,'harbor_ward')); const nUnb=plan.filter(a=>!blocks.has(a)).length;
  let total=s+toHarbor.D; if (w) total=Math.max(0,total-nUnb); O.harbor-=total; S.log.harborDmg[P.i]+=total;
  cleanup(S);
}
// ---------- turn loop ----------
function over(S){ for (const P of S.p) if (P.harbor<=0 || P.decked){ S.over=true; S.win=1-P.i; S.why=P.harbor<=0?'harbor':'deck'; return true; } return false; }
function rise(S, P, O){
  P.cap=Math.min(R0.MAXCAP,P.cap+1); P.inf=P.cap; P.rally=0;
  for (const u of P.units){ if (u.stranded){ u.stranded=false; u.ready=false; S.log.strandedTurns[P.i]++; } else u.ready=true; }
  for (const r of P.relics){ const f=fxOf(r,'rise_ping'); if (f){ const t=bestKill(S,O,f[2],u=>u.front===f[1]); if (t) damageUnit(S,O,t,f[2]); } }
  for (const h of P.holds){ const f=fxOf(h.c,'rise_heal'); if (f) P.harbor=Math.min(R0.HARBOR,P.harbor+f[1]); }
  for (const e of P.ench){ const f=fxOf(e,'rise_sweep'); if (f) for (const u of O.units) if (u.front===f[1]) damageUnit(S,O,u,f[2]); }
  cleanup(S);
}
function play1(deckA, deckB, seed){
  const r=mk(seed); const S={r, turn:0, dom:{S:null,D:null}, over:false, win:-1, why:'',
    log:{cross:[0,0], escorted:[0,0], reef:[0,0], raids:[0,0], vesselDmg:[0,0], blocks:[0,0], awayBlocks:[0,0], away:[0,0], carried:[0,0], played:[], deaths:[0,0], harborDmg:[0,0], holdDmg:[0,0], attacks:[0,0], ambush:[0,0], strandedTurns:[0,0], unitsPlayed:[0,0]}};
  S.p=[deckA,deckB].map((d,i)=>{ const deck=d.slice(); for (let k=deck.length-1;k>0;k--){ const j=Math.floor(r()*(k+1)); [deck[k],deck[j]]=[deck[j],deck[k]]; }
    return {i, deck, hand:[], disc:[], units:[], holds:[], ench:[], relics:[], harbor:R0.HARBOR, cap:0, inf:0, domCount:{L:0,S:0,X:0}}; });
  for (const P of S.p){ draw(S,P,R0.HAND); if (!P.hand.some(c=>c.cost<=3)){ P.deck.push(...P.hand.splice(0)); for (let k=P.deck.length-1;k>0;k--){ const j=Math.floor(r()*(k+1)); [P.deck[k],P.deck[j]]=[P.deck[j],P.deck[k]]; } draw(S,P,R0.HAND); } }
  let cur=r()<0.5?0:1; const first=cur;
  while (!S.over && S.turn<R0.TURNCAP*2){
    S.turn++; const P=S.p[cur], O=S.p[1-cur];
    rise(S,P,O); if (S.turn===2) P.inf+=R0.SECOND_BONUS; if (over(S)) break;
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
