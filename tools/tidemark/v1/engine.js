// Tidemark Version 1 rules engine (rules 1.0 = prototype rules 0.3 plus the rising tide), headless, with a computer player
// on both sides. Cards come from cards.js; every ability is an op from ops.js. Descended from tools/tidemark/engine.js
// (the prototype engine, which stays as it was so rounds 1 to 3 remain reproducible); the attack and block logic is its v2.
// play(deckA, deckB, seed, cfg) plays one game. cfg: {tide: turn after which each Harbor loses 1 at its Rise (default 12;
// 0 = off), harbor: starting Harbor (20), off: Set of rules switched off for experiments ('strand','screen','fronts','tide')}.
const {parseF}=require('./ops.js');
const R0={HAND:6, DECK:50, MAXCAP:10, TURNCAP:40, UNITS:8};
function mk(seed){ let h=(seed>>>0)^0x9e3779b9; h=Math.imul(h^(h>>>16),0x85ebca6b); h=Math.imul(h^(h>>>13),0xc2b2ae35); h=(h^(h>>>16))>>>0||1;
  const nx=()=>{ h^=h<<13; h>>>=0; h^=h>>>17; h^=h<<5; h>>>=0; return h/4294967296; }; for (let i=0;i<8;i++) nx(); return nx; }
let CFG=null, UID=1;
const FC=new Map(); const PF=f=>{ let o=FC.get(f); if (!o){ o=parseF(f||''); FC.set(f,o); } return o; };
const isUnitT=c=>c.t==='unit'||c.t==='vessel';
const baseHomes=c=> c.t==='vessel'? ['D'] : c.al==='L'? ['S'] : c.al==='S'? ['D'] : ['S','D'];
// ---------- statics: every continuous ability in play, cached until the board changes ----------
function bump(S){ S.ver++; }
function statics(S){ if (S._sv===S.ver) return S._st; const L=[];
  for (const P of S.p){
    for (const u of P.units){ for (const ab of u.c.fx) if (ab[0]==='static') L.push({ab, P, src:u.c, host:u, kind:'unit'});
      for (const e of u.eq) for (const ab of e.fx) if (ab[0]==='static') L.push({ab, P, src:e, host:u, kind:'equip'});
      for (const e of u.auras) for (const ab of e.fx) if (ab[0]==='static') L.push({ab, P, src:e, host:u, kind:'aura'}); }
    for (const h of P.holds) for (const ab of h.c.fx) if (ab[0]==='static') L.push({ab, P, src:h.c, hold:h, kind:'hold'});
    for (const e of P.ench) for (const ab of e.c.fx) if (ab[0]==='static') L.push({ab, P, src:e.c, front:e.front, kind:'ench'});
    for (const r of P.relics) for (const ab of r.fx) if (ab[0]==='static') L.push({ab, P, src:r, kind:'relic'}); }
  for (const f of ['S','D']){ const d=S.dom[f]; if (d) for (const ab of d.c.fx) if (ab[0]==='static') L.push({ab, P:S.p[d.owner], src:d.c, front:f, kind:'domain'}); }
  S._st=L; S._sv=S.ver; S._by={}; for (const x of L) (S._by[x.ab[1]]=S._by[x.ab[1]]||[]).push(x); return L; }
const st=(S,op)=>{ statics(S); return S._by[op]||[]; };
// ---------- matching a filter ----------
// does unit u (controlled by Q) match filter f, for an ability controlled by R? x: {self, foe, front (the source's front)}
function matchU(S, R, Q, u, f, x, dflt){ const o=PF(f); const F=o.flags; x=x||{};
  if (F.has('self')) return u===x.self; if (F.has('foe')) return u===x.foe; if (F.has('homeblock') && !x.blockHome) return false;
  const side=F.has('own')?'own':F.has('enemy')?'enemy':F.has('any')?'any':(dflt||'any');
  if (side==='own' && Q!==R) return false; if (side==='enemy' && Q===R) return false;
  if (F.has('other') && u===x.self) return false;
  if (F.has('vessel') && u.c.t!=='vessel') return false; if (F.has('nonvessel') && u.c.t==='vessel') return false;
  if (F.has('damaged') && !(u.dmg>0)) return false; if (F.has('token') && !u.tok) return false; if (F.has('nontoken') && u.tok) return false;
  if (F.has('legend') && u.c.r!=='L') return false;
  if (F.has('attacker') && !u.attacking) return false; if (F.has('blocker') && !u.blocking) return false;
  if (F.has('crossing') && !(u.attacking && !u.atHome)) return false;
  if (F.has('shore') && u.front!=='S') return false; if (F.has('deep') && u.front!=='D') return false;
  if (F.has('home') && !homesOf(S,Q,u).includes(u.front)) return false;
  for (const a of ['land','sea','dual','neutral']) if (F.has(a) && u.c.al!=={land:'L',sea:'S',dual:'D',neutral:'N'}[a]) return false;
  for (const k of ['charge','surge','rampart','leader','swift','undertow','tough','trample']) if (F.has('kw:'+k) && !hasKw(S,Q,u,k)) return false;
  if (F.has('kw:ferry') && !u.c.ferry) return false;
  for (const s of o.sub) if (!subOk(u.c,s)) return false;
  for (const [k,c,n] of o.cmp){ const v= k==='cost'? u.c.cost : k==='pow'? powOf(S,Q,u) : tghOf(S,Q,u,false); if (c==='<='? v>n : v<n) return false; }
  return true; }
function subOk(c, s){ const w=(c.sub||'').toLowerCase(); if (s==='mercenaries') s='mercenary'; if (s==='folk') return w.includes('forest folk'); if (s==='spirit') return w.includes('spirit');
  return w.split(/\s+/).includes(s) || (c.tokName||'').toLowerCase()===s; }
// does card c match a card filter (cost, tax, cast, tutor)?
function matchC(c, f){ const o=PF(f); const F=o.flags; const T=c.t; if (F.has('token')) return false;
  for (const k of ['unit','vessel','relic','enchantment','domain','stronghold','spell']) if (F.has(k) && !(T===k || (k==='unit' && T==='vessel'))) return false;
  if (F.has('equipment') && !(T==='relic' && c.sub==='Equipment')) return false; if (F.has('aura') && !(T==='enchantment' && c.sub==='Unit')) return false;
  if (F.has('legend') && c.r!=='L') return false;
  for (const a of ['land','sea','dual','neutral']) if (F.has(a) && c.al!=={land:'L',sea:'S',dual:'D',neutral:'N'}[a]) return false;
  for (const k of ['charge','surge','rampart','leader','swift','undertow','tough','trample']) if (F.has('kw:'+k) && !c.kw.includes(k)) return false;
  if (F.has('kw:ferry') && !c.ferry) return false;
  for (const s of o.sub) if (!subOk(c,s)) return false;
  for (const [k,cm,n] of o.cmp){ const v= k==='cost'? c.cost : k==='pow'? (c.pow||0) : (c.tgh||0); if (cm==='<='? v>n : v<n) return false; }
  return true; }
// ---------- unit stats ----------
function kwBase(u){ return u.c.kw; }
function hasKw(S, Q, u, k){ if (u.c.kw.includes(k) || u.kwT.has(k)) return true;
  for (const e of u.eq){ const q=e.fx.find(a=>a[1]==='equip'); if (q && q[4] && q[4].split(' ').includes(k)) return true; }
  for (const e of u.auras){ const q=e.fx.find(a=>a[1]==='aura'); if (q && q[4] && q[4].split(' ').includes(k)) return true; }
  if (S._gk!==S.ver){ S._gk=S.ver; S._gkm=new Map(); }
  for (const x of st(S,'grant_static')){ const [, , ks, f]=x.ab; if (!ks.split(' ').includes(k)) continue; if (x.kind==='domain'){ if (u.front===x.front && matchU(S,x.P,Q,u,f||'any unit',{self:x.host},'any')) return true; } else if (matchU(S,x.P,Q,u,f||'own unit',{self:x.host},'own')) return true; }
  return false; }
function homesOf(S, Q, u){ let h=baseHomes(u.c); if (!CFG.fronts) return ['S','D'];
  for (const x of st(S,'athome')){ if (x.kind==='domain'){ if (matchU(S,x.P,Q,u,x.ab[2]||'any unit',{},'any') && !h.includes(x.front)) h=h.concat([x.front]); } else if (matchU(S,x.P,Q,u,x.ab[2]||'own unit',{self:x.host},'own')) return ['S','D']; }
  return h; }
function lordSum(S, Q, u, which, bh){ let v=0;
  for (const x of st(S,'lord')){ const [, , p, t, f]=x.ab; const d= which==='p'? p : t; if (!d) continue;
    if (x.kind==='domain'){ if (u.front===x.front && matchU(S,x.P,Q,u,f||'any unit',{blockHome:bh},'any')) v+=d; }
    else if (x.kind==='ench' && x.src.sub==='Front' && PF(f||'').flags.has('front')){ if (u.front===x.front && matchU(S,x.P,Q,u,f,{self:x.host,blockHome:bh},'own')) v+=d; }
    else if (matchU(S,x.P,Q,u,f||'own unit',{self:x.host,blockHome:bh},'own')) v+=d; }
  return v; }
function scaleSum(S, Q, u, which){ let v=0; for (const ab of u.c.fx){ if (ab[1]!=='scale') continue; const n=countOwn(S,Q,ab[4],u); v+= (which==='p'?ab[2]:ab[3])*n; } return v; }
function countOwn(S, Q, f, self){ const o=PF(f); const F=o.flags; let n=0;
  if (F.has('stronghold')) return Q.holds.length; if (F.has('enchantment')) return Q.ench.length+Q.units.reduce((a,u)=>a+u.auras.length,0);
  if (F.has('relic')||F.has('equipment')) return Q.relics.length*(F.has('equipment')?0:1)+Q.units.reduce((a,u)=>a+u.eq.length,0);
  if (F.has('domain')) return ['S','D'].filter(f=>S.dom[f] && S.dom[f].owner===Q.i).length;
  for (const v of Q.units) if (matchU(S,Q,Q,v,f,{self},'own')) n++; return n; }
function powOf(S, Q, u){ let p=u.c.pow+u.gp+u.tp;
  for (const e of u.eq){ const q=e.fx.find(a=>a[1]==='equip'); if (q) p+=q[2]; } for (const e of u.auras){ const q=e.fx.find(a=>a[1]==='aura'); if (q) p+=q[2]; }
  { let k=0; for (const o of Q.units) if (o!==u && o.front===u.front && hasKw(S,Q,o,'leader')) k++; p+= CFG.leaderStack===false? Math.min(1,k) : k; }
  p+=lordSum(S,Q,u,'p')+scaleSum(S,Q,u,'p'); const hm=u.c.fx.find(a=>a[1]==='home'); if (hm && homesOf(S,Q,u).includes(u.front)) p+=hm[2];
  return Math.max(0,p); }
function tghOf(S, Q, u, blockHome){ let t=u.c.tgh+u.gt+u.tt+(u.mend||0);
  for (const e of u.eq){ const q=e.fx.find(a=>a[1]==='equip'); if (q) t+=q[3]; } for (const e of u.auras){ const q=e.fx.find(a=>a[1]==='aura'); if (q) t+=q[3]; }
  t+=lordSum(S,Q,u,'t',blockHome)+scaleSum(S,Q,u,'t'); const hm=u.c.fx.find(a=>a[1]==='home'); if (hm && homesOf(S,Q,u).includes(u.front)) t+=hm[3];
  if (blockHome && hasKw(S,Q,u,'rampart')) t+=2;
  return t; }
const has=(S,Q,u,k)=>hasKw(S,Q,u,k);
const statOn=(c,op)=>c.fx.some(a=>a[0]==='static' && a[1]===op);
function unitHas(S, Q, u, op){ if (statOn(u.c,op)) return true; for (const e of u.auras.concat(u.eq)) if (statOn(e,op)) return true; return false; }
// ---------- Allegiance and cost ----------
function allegiance(S, P, side){ let n=0; const cnt=c=>{ if (c.al===side || c.al==='D' || statOn(c,'both_allegiance')) n++; };
  for (const u of P.units){ if (!u.tok) cnt(u.c); for (const e of u.eq) cnt(e); for (const e of u.auras) cnt(e); }
  for (const h of P.holds) cnt(h.c); for (const e of P.ench) cnt(e.c); for (const r of P.relics) cnt(r);
  for (const f of ['S','D']){ const d=S.dom[f]; if (d && d.owner===P.i) cnt(d.c); } return n; }
function reqOk(S, P, c){ if (!c.req) return true; if (c.al==='L') return allegiance(S,P,'L')>=c.req; if (c.al==='S') return allegiance(S,P,'S')>=c.req; if (c.al==='D') return Math.max(allegiance(S,P,'L'),allegiance(S,P,'S'))>=c.req; return true; }
function costOf(S, P, c){ let k=c.cost;
  for (const x of st(S,'cost')){ const [, , n, f]=x.ab; if ((x.kind==='domain' || x.P===P) && matchC(c,f)) k-=n; }
  for (const x of st(S,'tax')){ const [, , n, f]=x.ab; if (x.P!==P && matchC(c,f)) k+=n; }
  if (c.t==='spell' && P.taxNext) k+=P.taxNext;
  return Math.max(c.cost>0?1:0, k); }
// ---------- entering, dying, leaving ----------
function newUnit(S, P, c, front, tok){ return {uid:UID++, c, front, dmg:0, ready:true, entered:S.turn, stranded:0, eq:[], auras:[], tp:0, tt:0, gp:0, gt:0, mend:0, kwT:new Set(), tok:!!tok, owner:P.i}; }
function chooseFront(S, P, O, c){ const h=baseHomes(c); if (!CFG.fronts) return 'S'; if (h.length===1) return h[0];
  const score=f=>{ let v=0; if (P.units.some(u=>u.front===f && has(S,P,u,'leader'))) v+=2; const d=S.dom[f]; if (d && d.owner===P.i) v+=1; v-=0.3*P.units.filter(u=>u.front===f).length; v+=0.2*O.units.filter(u=>u.front===f).length; return v; };
  return score('S')>=score('D')? 'S' : 'D'; }
function enterUnit(S, P, O, c, front, tok){ if (P.units.length>=R0.UNITS+2) return null; const u=newUnit(S,P,c,front||chooseFront(S,P,O,c),tok); P.units.push(u); bump(S); S.log.units[P.i]++;
  for (const ab of c.fx) if (ab[0]==='play') run(S,P,O,ab,{card:c,self:u});
  fire(S,'enter',{Q:P,u}); cleanup(S); return u; }
function destroyUnit(S, Q, u, how){ if (!Q.units.includes(u)) return; u.dmg=999; cleanup(S); }
// remove dead units (and empty Strongholds) until nothing changes; fire death abilities and 'dies' events
function cleanup(S){ for (let guard=0; guard<20; guard++){ let changed=false;
  for (const Q of S.p){ for (const u of Q.units.slice()){ if (u.dmg<tghOf(S,Q,u,false)) continue;
      if (u.dmg<999 && unitHas(S,Q,u,'survive') && !u.survived){ u.survived=true; u.dmg=0; continue; }
      Q.units.splice(Q.units.indexOf(u),1); bump(S); changed=true; S.log.deaths[Q.i]++;
      Q.disc.push(...u.eq, ...u.auras); if (!u.tok) Q.disc.push(u.c);
      const O=S.p[1-Q.i];
      for (const ab of u.c.fx) if (ab[0]==='death'){ if (ab[1]==='recur'){ if (!u.tok && Q.disc.includes(u.c)){ Q.disc.splice(Q.disc.lastIndexOf(u.c),1); Q.hand.push(u.c); } } else run(S,Q,O,ab,{card:u.c,self:u,dead:true}); }
      fire(S,'dies',{Q,u}); }
    const before=Q.holds.length; Q.holds=Q.holds.filter(h=>{ if (h.dur>0) return true; Q.disc.push(h.c); return false; }); if (Q.holds.length!==before){ bump(S); changed=true; } }
  if (!changed) return; } }
function bounceUnit(S, Q, u){ if (!Q.units.includes(u)) return false; if (unitHas(S,Q,u,'nobounce')) return false; Q.units.splice(Q.units.indexOf(u),1); bump(S); Q.disc.push(...u.eq, ...u.auras); if (!u.tok){ const owner=S.p[u.owner]; owner.hand.push(u.c); fire(S,'returned',{Q:owner,u}); } return true; }
function draw(S, P, n, extra){ for (let i=0;i<n;i++){ if (!P.deck.length){ P.decked=true; return; } P.hand.push(P.deck.pop()); if (extra) fire(S,'opp_draw',{Q:P}); } }
// ---------- triggered abilities ----------
function fire(S, ev, d){ const out=[];
  const look=(R, c, ab, host, domain)=>{ const w=ab[0]; if (!w.startsWith('on:')) return; const [,e,ff]=w.split(':'); if (e!==ev) return; const f=ff? ff.replace(/_/g,' ') : '';
    const O=S.p[1-R.i];
    if (ev==='dies'||ev==='enter'){ if (!matchU(S,R,d.Q,d.u,f||'any unit',{self:host},'any')) return; }
    else if (ev==='cast'){ if (d.Q!==R && !domain) return; if (f && !matchC(d.c,f)) return; }
    else if (ev==='returned'||ev==='harbor'||ev==='hold_hit'){ if (d.Q!==R && !domain) return; }
    else if (ev==='opp_draw'||ev==='cross'){ if (d.Q===R) return; }
    out.push([domain? d.Q : R, ab, c, host]); };
  for (const R of S.p){ for (const u of R.units){ for (const ab of u.c.fx) look(R,u.c,ab,u); for (const e of u.eq.concat(u.auras)) for (const ab of e.fx) look(R,e,ab,u); }
    for (const h of R.holds) for (const ab of h.c.fx) look(R,h.c,ab,null); for (const e of R.ench) for (const ab of e.c.fx) look(R,e.c,ab,null); for (const r of R.relics) for (const ab of r.fx) look(R,r,ab,null); }
  for (const f of ['S','D']){ const dm=S.dom[f]; if (dm) for (const ab of dm.c.fx) look(S.p[dm.owner],dm.c,ab,null,true); }
  if (S.depth>6) return; S.depth++;
  for (const [R,ab,c,host] of out) if (!S.over) run(S,R,S.p[1-R.i],ab,{card:c,self:host,trig:ev,ev:d});
  S.depth--; }
function runAll(S, P, O, c, when, x){ for (const ab of c.fx) if (ab[0]===when) run(S,P,O,ab,Object.assign({card:c},x||{})); }
// ---------- unit value (for the computer player) ----------
function val(S, Q, u){ return powOf(S,Q,u)*1.1+tghOf(S,Q,u,false)*0.8+u.c.cost*0.4+(u.tok?-1:0)+(has(S,Q,u,'leader')?1:0); }
function targets(S, R, f, x, dflt){ const L=[]; for (const Q of S.p) for (const u of Q.units) if (matchU(S,R,Q,u,f,x,dflt)) L.push([Q,u]); return L; }
const spellproof=(S,Q,u)=>unitHas(S,Q,u,'spellproof');
function dmgUnit(S, Q, u, n){ if (n<=0) return 0; if (has(S,Q,u,'tough')) n=Math.max(0,n-1); u.dmg+=n; return n; }
function bestKill(S, R, n, f, x, dflt, fromSpell, skip){ let best=null, bs=-1e9; for (const [Q,u] of targets(S,R,f,x,dflt)){ if (fromSpell && spellproof(S,Q,u)) continue; if (skip && skip.has(u.uid)) continue; const left=tghOf(S,Q,u,false)-u.dmg; const kill=(has(S,Q,u,'tough')?n-1:n)>=left; const s=(kill?100:0)+val(S,Q,u)*(Q===R?-1:1); if (s>bs){ bs=s; best=[Q,u,kill]; } } return best; }
function bestVal(S, R, f, x, dflt, pred){ let best=null, bs=-1e9; for (const [Q,u] of targets(S,R,f,x,dflt)){ if (pred && !pred(Q,u)) continue; const s=val(S,Q,u)*(Q===R?-1:1); if (s>bs){ bs=s; best=[Q,u]; } } return best; }
function chooseFrontFor(S, R, f, score){ const o=PF(f); if (o.flags.has('shore')) return 'S'; if (o.flags.has('deep')) return 'D'; return score('S')>=score('D')? 'S':'D'; }
function permTargets(S, R, f){ const o=PF(f); const F=o.flags; const side=F.has('own')?'own':F.has('any')?'any':'enemy'; const L=[];
  for (const Q of S.p){ if (side==='own' && Q!==R) continue; if (side==='enemy' && Q===R) continue;
    if (F.has('relic')||F.has('equipment')){ for (const r of Q.relics) if (!F.has('equipment')) L.push({Q,kind:'relic',c:r}); for (const u of Q.units) for (const e of u.eq) L.push({Q,kind:'eq',c:e,u}); }
    if (F.has('enchantment')||F.has('aura')){ for (const e of Q.ench) if (!F.has('aura')) L.push({Q,kind:'ench',c:e.c,e}); for (const u of Q.units) for (const a of u.auras) L.push({Q,kind:'aura',c:a,u}); }
    if (F.has('stronghold')) for (const h of Q.holds) L.push({Q,kind:'hold',c:h.c,h});
    if (F.has('domain')) for (const fr of ['S','D']){ const d=S.dom[fr]; if (d && d.owner===Q.i) L.push({Q,kind:'dom',c:d.c,fr}); } }
  if (F.has('domain') && side!=='own'){ for (const fr of ['S','D']){ const d=S.dom[fr]; if (d && d.owner===R.i && side==='any') {} } }
  return L.filter(t=>!o.cmp.length || matchC(t.c, f)); }
function removePerm(S, t, to){ const Q=t.Q; const dest=to==='hand'? Q.hand : Q.disc;
  if (t.kind==='relic'){ Q.relics.splice(Q.relics.indexOf(t.c),1); } else if (t.kind==='eq'){ t.u.eq.splice(t.u.eq.indexOf(t.c),1); }
  else if (t.kind==='ench'){ Q.ench.splice(Q.ench.indexOf(t.e),1); } else if (t.kind==='aura'){ t.u.auras.splice(t.u.auras.indexOf(t.c),1); }
  else if (t.kind==='hold'){ Q.holds.splice(Q.holds.indexOf(t.h),1); } else if (t.kind==='dom'){ S.dom[t.fr]=null; }
  dest.push(t.c); bump(S); cleanup(S); }
const permIsTarget=f=>{ const F=PF(f).flags; return ['relic','equipment','enchantment','aura','stronghold','domain'].some(k=>F.has(k)); };
// ---------- running an ability ----------
function run(S, R, O, ab, x){ if (S.over) return; const [w, op, ...a]=ab; const spell=x.card && x.card.t==='spell'; const ctx={self:x.self, foe:x.foe};
  const L=S.log; L.ops[op]=(L.ops[op]||0)+1;
  switch(op){
  case 'draw': draw(S,R,a[0],true); break;
  case 'scry': { const n=Math.min(a[0],R.deck.length); const top=R.deck.splice(R.deck.length-n,n); const keep=top.filter(c=>costOf(S,R,c)<=R.cap+2), bot=top.filter(c=>!keep.includes(c)); R.deck.unshift(...bot); R.deck.push(...keep); break; }
  case 'dig': { const n=Math.min(a[0],R.deck.length); const top=R.deck.splice(R.deck.length-n,n); const ok=top.filter(c=>!a[1]||matchC(c,a[1])).sort((p,q)=>cardWorth(S,R,q)-cardWorth(S,R,p)); if (ok.length){ R.hand.push(ok[0]); top.splice(top.indexOf(ok[0]),1); } R.deck.unshift(...top); break; }
  case 'tutor': { const n=a[1]||1; for (let i=0;i<n;i++){ const ok=R.deck.filter(c=>matchC(c,a[0])).sort((p,q)=>cardWorth(S,R,q)-cardWorth(S,R,p)); if (!ok.length) break; R.deck.splice(R.deck.indexOf(ok[0]),1); R.hand.push(ok[0]); } shuffle(S,R.deck); break; }
  case 'regrow': { const ok=R.disc.filter(c=>matchC(c,a[0]) && c!==x.card).sort((p,q)=>cardWorth(S,R,q)-cardWorth(S,R,p)); if (ok.length){ R.disc.splice(R.disc.lastIndexOf(ok[0]),1); R.hand.push(ok[0]); } break; }
  case 'reanimate': { const ok=R.disc.filter(c=>isUnitT(c) && matchC(c,a[0])).sort((p,q)=>q.cost-p.cost); if (ok.length){ R.disc.splice(R.disc.lastIndexOf(ok[0]),1); enterUnit(S,R,O,ok[0]); } break; }
  case 'harbor': R.harbor=Math.min(CFG.harbor,R.harbor+a[0]); break;
  case 'lose': R.harbor-=a[0]; S.log.selfDmg[R.i]+=a[0]; break;
  case 'inf': R.inf+=a[0]; break;
  case 'ramp': R.cap=Math.min(R0.MAXCAP,R.cap+a[0]); break;
  case 'dmg': { const t=x.target? [x.target[0],x.target[1]] : bestKill(S,R,a[0],a[1]||'enemy unit',ctx,'enemy',spell); if (t) dmgUnit(S,t[0],t[1],a[0]); break; }
  case 'dmg_multi': { const done=new Set(); for (let i=0;i<a[1];i++){ const t=bestKill(S,R,a[0],a[2]||'enemy unit',ctx,'enemy',spell,done); if (!t) break; done.add(t[1].uid); dmgUnit(S,t[0],t[1],a[0]); } break; }
  case 'sweep': { const f=a[1]||'any unit'; const fr=chooseFrontFor(S,R,f,fr=>sweepNet(S,R,a[0],f,fr,ctx)); for (const [Q,u] of targets(S,R,f,ctx,'any')) if (u.front===fr && !(spell && spellproof(S,Q,u))) dmgUnit(S,Q,u,a[0]); break; }
  case 'dmg_harbor': O.harbor-=a[0]; S.log.directDmg[R.i]+=a[0]; break;
  case 'dmg_hold': { const h=O.holds.slice().sort((p,q)=>p.dur-q.dur)[0]; if (h){ h.dur-=a[0]; fire(S,'hold_hit',{Q:O}); } break; }
  case 'dmg_attackers': { if (!S.battle) break; for (const at of S.battle.plan) if (S.p[S.battle.att].units.includes(at.u) && S.battle.att!==R.i) dmgUnit(S,S.p[S.battle.att],at.u,a[0]); break; }
  case 'destroy': case 'exile': { const f=a[0]||'enemy unit'; if (permIsTarget(f)){ const T=permTargets(S,R,f).sort((p,q)=>q.c.cost-p.c.cost)[0]; if (T) removePerm(S,T); break; }
    const t=x.target || bestVal(S,R,f,ctx,'enemy',(Q,u)=>!(spell && spellproof(S,Q,u))); if (t){ if (op==='exile'){ t[1].tok=true; } destroyUnit(S,t[0],t[1]); } break; }
  case 'bounce': { const f=a[0]||'enemy unit'; if (permIsTarget(f)){ const T=permTargets(S,R,f).sort((p,q)=>q.c.cost-p.c.cost)[0]; if (T) removePerm(S,T,'hand'); break; }
    const own=PF(f).flags.has('own'); const t= x.target? x.target : own? ownBounceTarget(S,R,f,ctx) : bestVal(S,R,f,ctx,'enemy',(Q,u)=>!(spell && spellproof(S,Q,u)) && !unitHas(S,Q,u,'nobounce')); if (t) bounceUnit(S,t[0],t[1]); break; }
  case 'bounce_all': { const f=a[0]; const fr=PF(f).flags.has('front')? chooseFrontFor(S,R,f,fr=>bounceNet(S,R,f,fr,ctx)) : null; for (const [Q,u] of targets(S,R,f,ctx,'any')) if ((!fr || u.front===fr) && !(spell && spellproof(S,Q,u))) bounceUnit(S,Q,u); break; }
  case 'tokens': { for (let i=0;i<a[0];i++){ if (R.units.length>=R0.UNITS+2) break; const al=x.card? (x.card.al==='N'? 'N' : x.card.al) : 'N'; const c={n:a[3],tokName:a[3],t:'unit',al,cost:0,pow:a[1],tgh:a[2],kw:a[4]?a[4].split(' '):[],fx:[],sub:a[3],r:'C',id:'TOKEN'}; const u=newUnit(S,R,c,x.self? x.self.front : chooseFront(S,R,O,c),true); R.units.push(u); bump(S); fire(S,'enter',{Q:R,u}); } break; }
  case 'pump': { const t=pumpTarget(S,R,a[2]||'own unit',ctx,x); if (t){ t[1].tp+=a[0]; t[1].tt+=a[1]; } break; }
  case 'pump_all': for (const [Q,u] of targets(S,R,a[2]||'own unit',ctx,'own')){ u.tp+=a[0]; u.tt+=a[1]; } break;
  case 'grant': for (const [Q,u] of targets(S,R,a[1]||'own unit',ctx,'own')) for (const k of a[0].split(' ')) u.kwT.add(k); break;
  case 'weaken': { const t= PF(a[2]||'').flags.has('foe')? (x.foe? [S.p[x.foe.owner],x.foe] : null) : (x.target || bestVal(S,R,a[2]||'enemy unit',ctx,'enemy')); if (t){ t[1].tp-=a[0]; t[1].tt-=a[1]; } break; }
  case 'stun': { const t=x.target || bestVal(S,R,a[0]||'enemy unit',ctx,'enemy',(Q,u)=>powOf(S,Q,u)>0); if (t){ const Q=t[0]; t[1].noAtk= S.cur===Q.i? S.turn+2 : S.turn+1; } break; }
  case 'noblock': { const t=x.target || bestVal(S,R,a[0]||'enemy unit',ctx,'enemy',(Q,u)=>u.ready); if (t) t[1].noBlock=S.turn; break; }
  case 'unblockable': { const t=x.target || bestVal(S,R,a[0]||'own unit',ctx,'own',(Q,u)=>canAttack(S,Q,u)); if (t) t[1].unb=S.turn; break; }
  case 'shift': { const t=x.target || bestVal(S,R,a[0]||'enemy unit',ctx,'enemy',(Q,u)=>u.ready); if (t){ t[1].front=t[1].front==='S'?'D':'S'; t[1].ready=false; bump(S); } break; }
  case 'move': { const t=x.target || moveTarget(S,R,a[0]||'own unit',ctx); if (t){ t[1].front=t[1].front==='S'?'D':'S'; bump(S); } break; }
  case 'ready': { const t=bestVal(S,R,a[0]||'own unit',ctx,'own',(Q,u)=>!u.ready||u.stranded); if (t){ t[1].ready=true; t[1].stranded=0; } break; }
  case 'ready_all': for (const [Q,u] of targets(S,R,a[0]||'own unit',ctx,'own')){ u.ready=true; u.stranded=0; } break;
  case 'fortify': { const h=R.holds.slice().sort((p,q)=>p.dur-q.dur)[0]; if (h) h.dur+=a[0]; break; }
  case 'fortify_all': for (const h of R.holds) h.dur+=a[0]; break;
  case 'control': { const t=bestVal(S,R,a[0]||'enemy unit',ctx,'enemy',(Q,u)=>!(spell && spellproof(S,Q,u))); if (t && R.units.length<R0.UNITS+2){ const [Q,u]=t; Q.units.splice(Q.units.indexOf(u),1); u.owner=u.tok? R.i : u.owner; u.ctrl=R.i; u.ready=false; u.entered=S.turn; u.front=baseHomes(u.c).includes(u.front)? u.front : baseHomes(u.c)[0]; R.units.push(u); bump(S); S.log.stolen[R.i]++; } break; }
  case 'discard': for (let i=0;i<a[0] && O.hand.length;i++){ const k=Math.floor(S.r()*O.hand.length); O.disc.push(O.hand.splice(k,1)[0]); } break;
  case 'fight': { const mine=R.units.slice().sort((p,q)=>powOf(S,R,q)-powOf(S,R,p))[0]; const t=mine && bestKill(S,R,powOf(S,R,mine),a[0]||'enemy unit',ctx,'enemy',spell); if (mine && t){ const pm=powOf(S,R,mine), pt=powOf(S,t[0],t[1]); dmgUnit(S,t[0],t[1],pm); dmgUnit(S,R,mine,pt); } break; }
  case 'skip_rise': O.skipRise=true; break;
  case 'opp_draw': draw(S,O,a[0],false); break;
  case 'loot': { for (let i=0;i<a[0] && R.hand.length;i++){ const worst=R.hand.slice().sort((p,q)=>cardWorth(S,R,p)-cardWorth(S,R,q))[0]; R.hand.splice(R.hand.indexOf(worst),1); R.disc.push(worst); } draw(S,R,a[1],true); break; }
  case 'mend': { const t=pumpTarget(S,R,a[1]||'own unit other',ctx,x); if (t) t[1].mend=(t[1].mend||0)+a[0]; break; }
  case 'copy': { const t=bestVal(S,R,a[0]||'own unit',ctx,'own'); if (t && R.units.length<R0.UNITS+2){ const u=newUnit(S,R,t[1].c,t[1].front,true); R.units.push(u); bump(S); } break; }
  case 'recur': break;
  case 'grow': if (x.self){ x.self.gp+=a[0]; x.self.gt+=a[1]; } break;
  case 'tax_next': O.taxNext=(O.taxNext||0)+a[0]; break;
  case 'calm': { const fr= powSum(S,O,'S')>=powSum(S,O,'D')? 'S' : 'D'; S.calm[fr]=S.turn+1; break; }
  default: throw new Error('engine: op not implemented: '+op);
  }
  cleanup(S); }
function shuffle(S, a){ for (let k=a.length-1;k>0;k--){ const j=Math.floor(S.r()*(k+1)); [a[k],a[j]]=[a[j],a[k]]; } }
const powSum=(S,Q,fr)=>Q.units.filter(u=>!fr||u.front===fr).reduce((q,u)=>q+powOf(S,Q,u),0);
function sweepNet(S, R, n, f, fr, ctx){ let v=0; for (const [Q,u] of targets(S,R,f,ctx,'any')){ if (u.front!==fr) continue; const left=tghOf(S,Q,u,false)-u.dmg; if ((has(S,Q,u,'tough')?n-1:n)>=left) v+=val(S,Q,u)*(Q===R?-1:1); } return v; }
function bounceNet(S, R, f, fr, ctx){ let v=0; for (const [Q,u] of targets(S,R,f,ctx,'any')) if (u.front===fr) v+=(val(S,Q,u)*0.6+(u.tok?2:0))*(Q===R?-1:1); return v; }
function ownBounceTarget(S, R, f, ctx){ let best=null, bs=-1e9; for (const [Q,u] of targets(S,R,f,ctx,'own')){ if (u.tok) continue; const s=(u.c.fx.some(a=>a[0]==='play')?3:0)+(u.stranded?2:0)+(u.dmg>0?1:0)-u.c.cost*0.3; if (s>bs){ bs=s; best=[Q,u]; } } return bs>0? best : null; }
function pumpTarget(S, R, f, ctx, x){ if (x.target) return x.target; let best=null, bs=-1e9; for (const [Q,u] of targets(S,R,f,ctx,'own')){ const s=(canAttack(S,Q,u)?2:0)+powOf(S,Q,u)*0.3+(u.attacking||u.blocking?3:0); if (s>bs){ bs=s; best=[Q,u]; } } return best; }
function moveTarget(S, R, f, ctx){ let best=null, bs=0; for (const [Q,u] of targets(S,R,f,ctx,'own')){ const h=homesOf(S,Q,u); if (h.length===1 && u.front!==h[0]){ const s=val(S,Q,u); if (s>bs){ bs=s; best=[Q,u]; } } } return best; }
// how much a card in hand is worth to its player (for tutors, discards and scry)
function cardWorth(S, P, c){ let v=c.cost; if (!reqOk(S,P,c)) v-=2; if (c.cost>P.cap+3) v-=2; if (isUnitT(c)) v+=(c.pow+c.tgh)*0.2; if (c.r==='L'||c.r==='R') v+=1; return v; }
// ---------- what playing a card is worth now (computer player) ----------
function abValue(S, P, O, ab, c, self){ const [w, op, ...a]=ab; const spell=c.t==='spell'; const ctx={self};
  switch(op){
  case 'draw': return P.deck.length>a[0]+4? 2*a[0] : -1;
  case 'scry': return 0.4*a[0]; case 'dig': return 1.6; case 'tutor': return P.deck.some(x=>matchC(x,a[0]))? 1.8*(a[1]||1) : -1;
  case 'regrow': return P.disc.some(x=>matchC(x,a[0]))? 1.6 : -1;
  case 'reanimate': { const t=P.disc.filter(x=>isUnitT(x) && matchC(x,a[0])).sort((p,q)=>q.cost-p.cost)[0]; return t? t.cost+(t.pow+t.tgh)*0.2 : -1; }
  case 'harbor': return Math.min(a[0], CFG.harbor-P.harbor)*(P.harbor<=10?0.8:0.35);
  case 'lose': return -a[0]*(P.harbor<=a[0]+3? 10 : P.harbor<=10? 0.8 : 0.4);
  case 'inf': return a[0]*0.6; case 'ramp': return P.cap<9? 2.4*a[0] : 0.2;
  case 'dmg': { const t=bestKill(S,P,a[0],a[1]||'enemy unit',ctx,'enemy',spell); if (!t || t[0]===P) return -1; return t[2]? val(S,t[0],t[1]) : (spell? -1 : 0.4); }
  case 'dmg_multi': { let v=0, n=0; for (const [Q,u] of targets(S,P,a[2]||'enemy unit',ctx,'enemy')){ if (n>=a[1]) break; if ((has(S,Q,u,'tough')?a[0]-1:a[0])>=tghOf(S,Q,u,false)-u.dmg){ v+=val(S,Q,u); n++; } } return v>0? v : (spell?-1:0.3); }
  case 'sweep': { const f=a[1]||'any unit'; const v=Math.max(sweepNet(S,P,a[0],f,'S',ctx), PF(f).flags.has('shore')? -99 : sweepNet(S,P,a[0],f,'D',ctx)); const vv=PF(f).flags.has('shore')? sweepNet(S,P,a[0],f,'S',ctx) : PF(f).flags.has('deep')? sweepNet(S,P,a[0],f,'D',ctx) : v; return vv>=(spell?5:0)? vv : -1; }
  case 'dmg_harbor': return O.harbor<=a[0]? 1000 : a[0]*(O.harbor<=8?1.3:0.8);
  case 'dmg_hold': return O.holds.length? Math.min(a[0],O.holds[0].dur)*0.6 : (spell?-1:0);
  case 'dmg_attackers': return spell? -1 : 0;
  case 'destroy': case 'exile': { const f=a[0]||'enemy unit'; if (permIsTarget(f)){ const T=permTargets(S,P,f); return T.length? Math.max(...T.map(t=>t.c.cost))+0.5 : (spell?-1:0); }
    const t=bestVal(S,P,f,ctx,'enemy',(Q,u)=>!(spell && spellproof(S,Q,u))); if (!t || t[0]===P) return -1; const v=val(S,t[0],t[1]); return (spell && t[1].c.cost<Math.min(c.cost,4))? -1 : v; }
  case 'bounce': { const f=a[0]||'enemy unit'; if (permIsTarget(f)){ const T=permTargets(S,P,f); return T.length? Math.max(...T.map(t=>t.c.cost))*0.6 : (spell?-1:0); }
    if (PF(f).flags.has('own')){ const t=ownBounceTarget(S,P,f,ctx); return t? 0.5 : -1; } const t=bestVal(S,P,f,ctx,'enemy'); if (!t || t[0]===P) return spell?-1:0; if (spell && c.kw.includes('swift')) return -1; return val(S,t[0],t[1])*0.55+(t[1].tok?2:0); }
  case 'bounce_all': { const f=a[0]; const v= PF(f).flags.has('attacker')? -1 : Math.max(bounceNet(S,P,f,'S',ctx), bounceNet(S,P,f,'D',ctx)); return v>=(spell?4:0)? v : -1; }
  case 'tokens': return P.units.length<=R0.UNITS-a[0]? a[0]*(a[1]+a[2])*0.45+0.3 : -1;
  case 'pump': if (spell && c.kw.includes('swift')) return -1; return P.units.some(u=>canAttack(S,P,u))? (a[0]+a[1]*0.5)*0.8 : (spell?-1:0.2);
  case 'pump_all': { if (spell && c.kw.includes('swift')) return -1; const n=P.units.filter(u=>canAttack(S,P,u) && matchU(S,P,P,u,a[2]||'own unit',ctx,'own')).length; return n>=2? n*(a[0]*0.9+a[1]*0.3) : (spell?-1:0); }
  case 'grant': { const ks=a[0].split(' '); const n=P.units.filter(u=>matchU(S,P,P,u,a[1]||'own unit',ctx,'own')).length; if (ks.includes('charge')){ const fresh=P.units.filter(u=>u.entered===S.turn && !has(S,P,u,'charge')).length+(self?1:0); return fresh>=1? fresh*1.8 : (spell?-1:0); } return n>=2? n*0.8 : (spell?-1:0); }
  case 'weaken': return spell && c.kw.includes('swift')? -1 : (O.units.length? 1 : -1);
  case 'stun': { const t=bestVal(S,P,a[0]||'enemy unit',ctx,'enemy',(Q,u)=>powOf(S,Q,u)>0); return t && t[0]!==P? powOf(S,t[0],t[1])*0.6 : -1; }
  case 'noblock': case 'unblockable': return P.units.some(u=>canAttack(S,P,u)) && O.units.some(u=>u.ready)? 1.5 : -1;
  case 'shift': { if (c.kw.includes('swift')) return -1; const t=bestVal(S,P,a[0]||'enemy unit',ctx,'enemy',(Q,u)=>u.ready); return t && P.units.some(u=>canAttack(S,P,u))? val(S,t[0],t[1])*0.35 : -1; }
  case 'move': return moveTarget(S,P,a[0]||'own unit',ctx)? 1 : (spell?-1:0);
  case 'ready': case 'ready_all': return P.units.some(u=>!u.ready||u.stranded)? 1.5 : (spell?-1:0);
  case 'fortify': case 'fortify_all': return P.holds.length? a[0]*0.5 : (spell?-1:0);
  case 'control': { const t=bestVal(S,P,a[0]||'enemy unit',ctx,'enemy'); return t && t[0]!==P? val(S,t[0],t[1])*1.8 : -1; }
  case 'discard': return O.hand.length? a[0]*1.2 : -0.5;
  case 'fight': { const mine=P.units.slice().sort((p,q)=>powOf(S,P,q)-powOf(S,P,p))[0]; if (!mine) return -1; const t=bestKill(S,P,powOf(S,P,mine),a[0]||'enemy unit',ctx,'enemy',spell); return t && t[0]!==P && t[2]? val(S,t[0],t[1])-(powOf(S,t[0],t[1])>=tghOf(S,P,mine,false)? val(S,P,mine) : 0) : -1; }
  case 'skip_rise': return 4; case 'opp_draw': return -1.5*a[0]; case 'loot': return (a[1]-a[0])*1.6+0.6;
  case 'mend': return P.units.length>1? 0.4 : 0; case 'copy': { const t=bestVal(S,P,a[0]||'own unit',ctx,'own'); return t? val(S,P,t[1])*0.8 : -1; }
  case 'grow': return 0.5; case 'tax_next': return 1; case 'calm': return powSum(S,O)>powSum(S,P)? 2 : -1;
  case 'recur': return 0.5;
  default: return 0; } }
function wantScore(S, P, O, c){ const t=c.t; let s=c.cost+0.5; const plays=c.fx.filter(a=>a[0]==='play');
  if (t==='unit'||t==='vessel'){ if (P.units.length>=R0.UNITS) return -1; let v=s+(c.pow+c.tgh)*0.2+(c.ferry? 0.4*Math.min(c.ferry,P.units.length) : 0); for (const ab of plays) v+=Math.max(-1,abValue(S,P,O,ab,c,null))*0.6; return v; }
  if (t==='stronghold'){ if (P.holds.length>=3) return -1; return s+0.5+1.5*shoreLean(S,O); }
  if (t==='domain'){ const cur=S.dom[c.front]; if (cur && cur.owner===P.i) return -1; return s-0.5+domainNet(S,P,O,c); }
  if (t==='enchantment'){ if (c.sub==='Unit') return P.units.some(u=>!u.tok)? s : -1; return P.ench.some(e=>e.c.id===c.id)? -1 : s; }
  if (t==='relic'){ if (c.sub==='Equipment') return P.units.some(u=>!u.tok)? s : -1; return P.relics.some(r=>r.id===c.id)? -1 : s+0.3; }
  // spells: the sum of what their effects are worth now; nothing worth doing means not now
  let v=0; for (const ab of plays){ const x=abValue(S,P,O,ab,c,null); if (x<=-1 && plays.length===1) return -1; v+=x; }
  if (v<=0.3) return -1; return Math.min(s+v*0.4, s+6); }
function shoreLean(S, O){ if (!O.units.length) return 0.5; let n=0; for (const u of O.units) if (homesOf(S,O,u).includes('S') || has(S,O,u,'surge')) n++; return n/O.units.length; }
function domainNet(S, P, O, c){ let v=0.4; const fr=c.front; const mine=P.units.filter(u=>u.front===fr).length, theirs=O.units.filter(u=>u.front===fr).length;
  for (const ab of c.fx){ if (ab[1]==='lord'){ const nm=P.units.filter(u=>u.front===fr && matchU(S,P,P,u,ab[4]||'any unit',{},'any')).length, no=O.units.filter(u=>u.front===fr && matchU(S,P,O,u,ab[4]||'any unit',{},'any')).length; v+=(ab[2]+ab[3]*0.7)*(nm-no)*(PF(ab[4]||'').flags.has('attacker')? -1:1); }
    else if (ab[1]==='cost'){ v+=0.5*P.hand.filter(x=>matchC(x,ab[3])).length-0.3; } else v+=(mine-theirs)*0.3+0.3; }
  return v; }
function canAttack(S, P, u){ if (!u.ready || u.stranded || u.noAtk===S.turn) return false; if (!(u.entered<S.turn || has(S,P,u,'charge'))) return false;
  for (const x of st(S,'pacify')) if (matchU(S,x.P,P,u,x.ab[2],{self:x.host},'any')) return false; return true; }
// ---------- Influence held for the opponent's turn (Swift cards) ----------
const isSwift=c=>c.kw.includes('swift');
function reserveFor(S, P, O){ const tricks=P.hand.filter(c=>isSwift(c) && costOf(S,P,c)<=P.cap && reqOk(S,P,c)); if (!tricks.length) return 0;
  const threats=O.units.filter(u=>!u.stranded && powOf(S,O,u)>=2); if (!threats.length) return 0;
  const cheap=tricks.filter(c=>costOf(S,P,c)<=3); if (!cheap.length) return 0; const incoming=threats.reduce((q,u)=>q+powOf(S,O,u),0);
  let best=null, bv=0; for (const c of cheap){ let v= isUnitT(c)? Math.min(c.pow, Math.max(...threats.map(u=>powOf(S,O,u))))+c.tgh*0.3 : 2.5; if (incoming>=P.harbor-4) v*=1.6; v-=costOf(S,P,c)*0.5; if (v>bv){ bv=v; best=c; } }
  P._resV=bv; return best? costOf(S,P,best) : 0; }
function playCard(S, P, O, c, target){ P.hand.splice(P.hand.indexOf(c),1); const k=costOf(S,P,c); P.inf-=k; if (c.t==='spell' && P.taxNext) P.taxNext=0;
  S.log.played.push([P.i,c.id,S.turn]); fire(S,'cast',{Q:P,c});
  if (isUnitT(c)) return enterUnit(S,P,O,c);
  if (c.t==='stronghold'){ P.holds.push({c,dur:c.fort}); bump(S); runAll(S,P,O,c,'play'); return; }
  if (c.t==='domain'){ const cur=S.dom[c.front]; if (cur) S.p[cur.owner].disc.push(cur.c); S.dom[c.front]={c,owner:P.i}; bump(S); runAll(S,P,O,c,'play'); return; }
  if (c.t==='enchantment'){ if (c.sub==='Unit'){ const u=P.units.filter(u=>!u.tok).sort((a,b)=>val(S,P,b)-val(S,P,a))[0]; if (u){ u.auras.push(c); bump(S); } else P.disc.push(c); }
    else { P.ench.push({c, front: c.al==='L'? 'S' : c.al==='S'? 'D' : (powSum(S,O,'S')>=powSum(S,O,'D')?'S':'D')}); bump(S); } runAll(S,P,O,c,'play'); return; }
  if (c.t==='relic'){ if (c.sub==='Equipment'){ const u=P.units.filter(u=>!u.tok).sort((a,b)=>val(S,P,b)-val(S,P,a))[0]; if (u){ u.eq.push(c); bump(S); } else P.disc.push(c); } else { P.relics.push(c); bump(S); } runAll(S,P,O,c,'play'); return; }
  // a spell: its play abilities, twice for the first Swift spell of the turn with an echo
  const times= isSwift(c) && st(S,'echo').some(x=>x.P===P) && P.echoT!==S.turn? 2 : 1; if (times===2) P.echoT=S.turn;
  for (let i=0;i<times;i++) for (const ab of c.fx) if (ab[0]==='play') run(S,P,O,ab,{card:c,target:i===0?target:null});
  P.disc.push(c); }
function mainPhase(S, P, O, post){
  let keep=reserveFor(S,P,O);
  if (keep>0){ let all=0, res=0; for (const c of P.hand){ if (isSwift(c) || !reqOk(S,P,c)) continue; const w=wantScore(S,P,O,c); if (w<=0) continue; const k=costOf(S,P,c); if (k<=P.inf) all=Math.max(all,w); if (k<=P.inf-keep) res=Math.max(res,w); } if (all-res > (P._resV||0)*1.2) keep=0; }
  for (let guard=0; guard<14; guard++){ let best=null, bs=0;
    for (const c of P.hand){ if (!reqOk(S,P,c)) continue; const k=costOf(S,P,c); const sw=isSwift(c);
      if (k>P.inf-(sw? 0 : keep)) continue;
      if (sw && isUnitT(c) && keep>0 && k<=keep) continue;
      if (sw && !isUnitT(c) && battleOnly(c)) continue;
      const s=wantScore(S,P,O,c); if (s>bs){ bs=s; best=c; } }
    if (!best) break; playCard(S,P,O,best); if (over(S)) return; }
}
// Swift spells whose effect only makes sense in a battle are kept for one
const BATTLE_OPS=new Set(['pump','pump_all','weaken','dmg_attackers','bounce','bounce_all','shift','stun','destroy','dmg','exile','unblockable','noblock','mend','calm']);
const fOf=ab=>ab.slice(2).find(v=>typeof v==='string') || '';
const battleOnly=c=> c.fx.some(a=>a[0]==='play' && ['pump','weaken','dmg_attackers','shift','mend'].includes(a[1])) || c.fx.some(a=>a[0]==='play' && a[1]==='bounce_all' && PF(fOf(a)).flags.has('attacker')) || c.fx.some(a=>a[0]==='play' && ['bounce','stun','destroy','exile','dmg'].includes(a[1]) && (PF(fOf(a)).flags.has('attacker') || PF(fOf(a)).flags.has('crossing')));
// ---------- battle ----------
function atHome(S, P, u, f, ferryLeft){ let h=homesOf(S,P,u).includes(f) || (f==='S' && has(S,P,u,'surge')); let fer=false; if (!h && ferryLeft>0){ h=true; fer=true; } return {h, fer}; }
const ferryCap=(S,P)=>P.units.reduce((q,u)=>q+(u.c.ferry||0)+u.eq.reduce((a,e)=>{ const q=e.fx.find(z=>z[1]==='equip'); return a+(q&&q[4]&&q[4].split(' ').includes('ferry')?1:0); },0),0);
const bHomeOf=(S,Q,b,f)=> homesOf(S,Q,b).includes(f) || unitHas(S,Q,b,'guard_both');
function fight(S, A, a, B, b, bHome){ const pa=powOf(S,A,a), pb=powOf(S,B,b); const ta=tghOf(S,A,a,false)-a.dmg, tb=tghOf(S,B,b,bHome)-b.dmg;
  const dA=has(S,A,a,'tough')? Math.max(0,pb-1) : pb, dB=has(S,B,b,'tough')? Math.max(0,pa-1) : pa;
  return {aDies:dA>=ta, bDies:dB>=tb, dA, dB, excess:Math.max(0,dB-tb)}; }
function screenOf(S, O, f, u){ let left=0; if (!CFG.screens) return 0; const hs=O.holds.filter(h=>f==='S' || statOn(h.c,'screen_both'));
  left+=hs.reduce((q,h)=>q+h.dur,0); if (f==='D' && u.c.t!=='vessel') left+=O.units.filter(x=>x.c.t==='vessel').reduce((q,v)=>q+Math.max(0,tghOf(S,O,v,false)-v.dmg),0); return left; }
function blockersOf(S, O, f){ return O.units.filter(u=>u.ready && !u.stranded && u.noBlock!==S.turn && !(u.c.t==='vessel' && f==='S' && CFG.fronts)); }
function chooseBlocks(S, P, O, plan){ const incoming=plan.reduce((q,a)=>q+powOf(S,P,a.u),0); let unblocked=incoming; const uses=new Map(); const blocks=new Map();
  for (const a of plan.slice().sort((x,y)=>powOf(S,P,y.u)-powOf(S,P,x.u))){ if (a.unb) continue; let pick=null, ps=-1e9;
    for (const b of blockersOf(S,O,a.f)){ const n=uses.get(b.uid)||0; if (n>=(unitHas(S,O,b,'twice')?2:1)) continue; const bh=bHomeOf(S,O,b,a.f); const r=fight(S,P,a.u,O,b,bh);
      const stop=Math.max(0,powOf(S,P,a.u)-screenOf(S,O,a.f,a.u)); const stopW= unblocked>=O.harbor? 3 : O.harbor<=8? 1.2 : 0.6;
      let v=(r.aDies?val(S,P,a.u):0)+stop*stopW-(r.bDies?val(S,O,b):0)+(bh?0.3:0); if (r.bDies && !r.aDies && !(unblocked>=O.harbor)) v-=2; if (n) v-=0.5;
      if (v>ps){ ps=v; pick=b; } }
    if (pick && ps>0){ uses.set(pick.uid,(uses.get(pick.uid)||0)+1); blocks.set(a,pick); unblocked-=powOf(S,P,a.u); } }
  return blocks; }
function planValue(S, P, O, plan){ const blocks=chooseBlocks(S,P,O,plan); let v=0; const toH={S:0,D:0}; let toScreen=0;
  for (const a of plan){ const b=blocks.get(a); if (b){ const r=fight(S,P,a.u,O,b,bHomeOf(S,O,b,a.f)); v+=(r.bDies?val(S,O,b):0)-(r.aDies?val(S,P,a.u):0); if (!a.home && !r.aDies && !a.ns) v-=powOf(S,P,a.u)*0.5; if (r.bDies && has(S,P,a.u,'trample')) toH[a.f]+=r.excess; }
    else { toH[a.f]+=powOf(S,P,a.u); if (!a.home && !a.ns) v-=powOf(S,P,a.u)*0.5; } if (a.thorn) v-=a.thorn*0.8; }
  for (const f of ['S','D']){ const scr=screenOf(S,O,f,{c:{t:'unit'}}); const k=Math.min(scr,toH[f]); toScreen+=k; toH[f]-=k; }
  const harborHit=toH.S+toH.D; if (harborHit>=O.harbor) return 1000+harborHit;
  v+=harborHit*(O.harbor<=10?1.6:1.0)+toScreen*0.45;
  const stay=P.units.filter(u=>!u.stranded && !plan.some(a=>a.u===u)).length;
  const theirs=O.units.filter(u=>!u.stranded).map(u=>powOf(S,O,u)).sort((a,b)=>b-a); const through=theirs.slice(stay).reduce((q,x)=>q+x,0);
  const ourPow=Math.max(1,P.units.reduce((q,u)=>q+powOf(S,P,u),0)), theirPow=Math.max(1,theirs.reduce((q,x)=>q+x,0)); const ahead=O.harbor/ourPow < P.harbor/theirPow;
  if (through>=P.harbor) v-=60; else v-=through*(P.harbor<=10?0.9:0.35)*(ahead?0.4:1);
  return v; }
function frontAllowed(S, f, nInto){ if (S.calm[f]>=S.turn) return false; for (const x of st(S,'max_attack')) if ((x.front||'S')===f && nInto>=x.ab[2]) return false; return true; }
function thornsOn(S, P, u, f, home){ let n=0; for (const x of st(S,'thorns')){ if (x.kind!=='domain' && x.P===P) continue; const fl=PF(x.ab[3]||'').flags; const fr=fl.has('shore')?'S':fl.has('deep')?'D':(x.front||null); if (fr && fr!==f) continue; if (fl.has('crossing') && home) continue; if (!fr && !fl.has('crossing') && x.kind!=='domain') continue; n+=x.ab[2]; } return n; }
function realise(S, P, sel){ let fer=ferryCap(S,P); const n={S:0,D:0}; const out=[]; for (const [u,f] of sel){ if (!frontAllowed(S,f,n[f])) continue; const r=atHome(S,P,u,f,fer); if (r.fer) fer--; n[f]++;
    const ns=nostrandOf(S,P,u,f); out.push({u,f,home:r.h,fer:r.fer,ns,unb:u.unb===S.turn,thorn:thornsOn(S,P,u,f,r.h)}); } return out; }
function nostrandOf(S, P, u, f){ for (const x of st(S,'nostrand')){ if (x.kind==='domain'){ if (x.front===f && matchU(S,x.P,P,u,x.ab[2]||'any unit',{},'any')) return true; } else if (matchU(S,x.P,P,u,x.ab[2]||'own unit',{self:x.host},'own')) return true; } return false; }
function planAttack(S, P, O, atkers){ const fronts=CFG.fronts? ['S','D'] : ['S'];
  const natural=u=>{ const h=homesOf(S,P,u); return h.length===1? h[0] : (screenOf(S,O,'S',u)<=screenOf(S,O,'D',u)? 'S':'D'); };
  let sel=atkers.map(u=>[u,natural(u)]); let best=planValue(S,P,O,realise(S,P,sel));
  for (let pass=0; pass<3; pass++){ let improved=false;
    for (const u of atkers){ const cur=sel.find(x=>x[0]===u); const alts=[]; if (cur) alts.push(sel.filter(x=>x[0]!==u)); for (const f of fronts){ if (cur && cur[1]===f) continue; alts.push(sel.filter(x=>x[0]!==u).concat([[u,f]])); }
      for (const alt of alts){ const v=planValue(S,P,O,realise(S,P,alt)); if (v>best+0.01){ best=v; sel=alt; improved=true; } } }
    if (!improved) break; }
  if (best<=0) return []; return realise(S,P,sel); }
function battle(S, P, O){ const atkers=P.units.filter(u=>canAttack(S,P,u)); if (!atkers.length) return;
  // before battle: a pre-battle Swift or a main-phase trick that opens the way (unblockable, noblock, shift) is played by mainPhase
  const plan=planAttack(S,P,O,atkers.sort((a,b)=>powOf(S,P,b)-powOf(S,P,a))); if (!plan.length) return;
  S.battle={att:P.i, plan}; S.log.attacks[P.i]+=plan.length;
  for (const a of plan){ a.u.ready=false; a.u.attacking=true; a.u.atHome=a.home; if (!homesOf(S,P,a.u).includes(a.f)) S.log.cross[P.i]++; a.u.front=a.f===a.u.front? a.u.front : a.u.front; a.u.atkFront=a.f; }
  bump(S);
  for (const a of plan){ for (const ab of a.u.c.fx) if (ab[0]==='attack') run(S,P,O,ab,{card:a.u.c,self:a.u}); if (!a.home) fire(S,'cross',{Q:P,u:a.u}); if (a.thorn && P.units.includes(a.u)) dmgUnit(S,P,a.u,a.thorn); }
  cleanup(S); let live=plan.filter(a=>P.units.includes(a.u));
  // the defender's Swift units enter to block
  for (const c of O.hand.slice()){ if (!(isSwift(c) && isUnitT(c)) || costOf(S,O,c)>O.inf || !reqOk(S,O,c)) continue; const front=baseHomes(c)[0];
    const tmp={uid:-1,c,front,dmg:0,eq:[],auras:[],tp:0,tt:0,gp:0,gt:0,mend:0,kwT:new Set(),owner:O.i}; let good=false;
    for (const a of live){ if (a.unb) continue; const r=fight(S,P,a.u,O,tmp,baseHomes(c).includes(a.f)); if ((r.aDies && !r.bDies) || (r.aDies && val(S,P,a.u)>=c.cost*1.5+2) || (!r.aDies && !r.bDies && powOf(S,P,a.u)>=4)) good=true; }
    if (!good) continue; O.hand.splice(O.hand.indexOf(c),1); O.inf-=costOf(S,O,c); S.log.played.push([O.i,c.id,S.turn]); fire(S,'cast',{Q:O,c}); const nu=enterUnit(S,O,P,c,front); if (nu) S.log.flash[O.i]++; }
  // the defender's Swift spells against the attack
  defendSwift(S,P,O,live); live=live.filter(a=>P.units.includes(a.u) && a.u.attacking);
  if (over(S)) return;
  const blocks=chooseBlocks(S,P,O,live);
  for (const [a,b] of blocks){ b.blocking=true; S.log.blocks[O.i]++; for (const ab of b.c.fx) if (ab[0]==='block') run(S,O,P,ab,{card:b.c,self:b,foe:a.u}); }
  cleanup(S);
  // combat tricks (pump / weaken Swift spells) on both sides
  for (const [a,b] of blocks){ if (!P.units.includes(a.u) || !O.units.includes(b)) continue; trick(S,O,P,b,a.u,bHomeOf(S,O,b,a.f),false,a); trick(S,P,O,a.u,b,bHomeOf(S,O,b,a.f),true,a); }
  // resolve
  const toH={S:0,D:0}; const byA=new Map();
  for (const a of live){ if (!P.units.includes(a.u)) continue; const b=blocks.get(a);
    if (b && O.units.includes(b)){ const bh=bHomeOf(S,O,b,a.f); const r=fight(S,P,a.u,O,b,bh); dmgUnit2(a.u,r.dA); dmgUnit2(b,r.dB); S.log.fights[P.i]++;
      if (r.bDies && has(S,P,a.u,'trample')){ toH[a.f]+=r.excess; byA.set(a,(byA.get(a)||0)+r.excess); }
      if (has(S,P,a.u,'undertow') && !r.bDies) a._uo=b; if (has(S,O,b,'undertow') && !r.aDies) a._ua=true; }
    else if (!b){ const d=powOf(S,P,a.u); toH[a.f]+=d; byA.set(a,(byA.get(a)||0)+d); } }
  cleanup(S);
  for (const a of live){ if (a._uo && O.units.includes(a._uo)) bounceUnit(S,O,a._uo); if (a._ua && P.units.includes(a.u)) bounceUnit(S,P,a.u); }
  // unblocked damage: Strongholds screen the Shore (and the Deep with screen_both), Vessels screen the Deep, then the Harbor
  const hw=st(S,'hold_ward').filter(x=>x.P===O).reduce((q,x)=>q+x.ab[2],0), ww=st(S,'ward').filter(x=>x.P===O).reduce((q,x)=>q+x.ab[2],0);
  let holdHit=false, total=0;
  for (const a of live){ let d=byA.get(a)||0; if (!d) continue;
    if (CFG.screens){ for (const h of O.holds){ if (d<=0) break; if (!(a.f==='S' || statOn(h.c,'screen_both'))) continue; const k=Math.min(d,h.dur); h.dur-=Math.max(0,k-hw); d-=k; if (k>0){ holdHit=true; S.log.holdDmg[P.i]+=k; } }
      if (a.f==='D' && a.u.c.t!=='vessel') for (const v of O.units.filter(x=>x.c.t==='vessel')){ if (d<=0) break; const left=Math.max(0,tghOf(S,O,v,false)-v.dmg); const k=Math.min(d,left); v.dmg+=k; d-=k; S.log.vesselDmg[P.i]+=k; } }
    if (d>0 && !blocks.has(a)) d=Math.max(0,d-ww);
    if (d>0){ O.harbor-=d; total+=d; S.log.harborDmg[P.i]+=d; if (P.units.includes(a.u)) for (const ab of a.u.c.fx) if (ab[0]==='hit') run(S,P,O,ab,{card:a.u.c,self:a.u}); } }
  if (total>0) fire(S,'harbor',{Q:P}); if (holdHit) fire(S,'hold_hit',{Q:O});
  cleanup(S);
  // Stranded, and Domains that send crossers home
  const two=st(S,'strand2').length>0;
  for (const a of live){ if (!P.units.includes(a.u)) continue; const forced=st(S,'strand_front').some(x=>(x.front||'S')===a.f);
    if (CFG.strand && ((!a.home && !a.ns) || forced)){ a.u.stranded=two? 2 : 1; S.log.stranded[P.i]++; }
    if (!a.home && st(S,'bounce_cross').some(x=>x.front===a.f)) bounceUnit(S,P,a.u); }
  for (const Q of S.p) for (const u of Q.units){ u.attacking=false; u.blocking=false; u.atHome=false; }
  S.battle=null; bump(S); cleanup(S); }
function dmgUnit2(u, n){ u.dmg+=n; }
// the defender's Swift answers: remove or shrink the biggest attackers, or punish the whole attack
function defendSwift(S, P, O, live){ for (let guard=0; guard<3; guard++){ const incoming=live.filter(a=>P.units.includes(a.u)).reduce((q,a)=>q+powOf(S,P,a.u),0); if (!incoming) return;
  let best=null, bv=0;
  for (const c of O.hand){ if (!isSwift(c) || isUnitT(c) || costOf(S,O,c)>O.inf || !reqOk(S,O,c)) continue; let v=0, tgt=null;
    for (const ab of c.fx){ if (ab[0]!=='play') continue; const op=ab[1], a=ab.slice(2);
      const big=live.filter(x=>P.units.includes(x.u) && matchU(S,O,P,x.u,fOf(ab)||'enemy unit',{},'enemy')).sort((x,y)=>powOf(S,P,y.u)-powOf(S,P,x.u))[0];
      if (['bounce','shift','destroy','exile','stun'].includes(op) && !permIsTarget(a[0]||'unit') && big){ const p=powOf(S,P,big.u); if (op==='stun') continue; if (p>=4 || incoming>=O.harbor){ v+=p+val(S,P,big.u)*(op==='destroy'||op==='exile'?0.6:0.2); tgt=[P,big.u]; } }
      else if (op==='dmg' && big){ const t=bestKill(S,O,a[0],(a[1]||'enemy unit')+' attacker',{},'enemy',true); if (t && t[2] && t[0]===P){ v+=val(S,P,t[1]); tgt=[t[0],t[1]]; } }
      else if (op==='dmg_attackers'){ let k=0; for (const x of live) if (P.units.includes(x.u) && (has(S,P,x.u,'tough')?a[0]-1:a[0])>=tghOf(S,P,x.u,false)-x.u.dmg) k+=val(S,P,x.u); v+=k; }
      else if (op==='bounce_all' && PF(a[0]).flags.has('attacker')){ const n=live.filter(x=>P.units.includes(x.u)).length; if (n>=2 || incoming>=O.harbor) v+=incoming*0.8; }
      else if (op==='calm'){ if (incoming>=O.harbor-3) v+=incoming; } }
    v-=costOf(S,O,c)*0.6; if (v>bv){ bv=v; best=[c,tgt]; } }
  if (!best || bv<2) return; const [c,tgt]=best; O.hand.splice(O.hand.indexOf(c),1); O.inf-=costOf(S,O,c); S.log.played.push([O.i,c.id,S.turn]); S.log.swift[O.i]++; fire(S,'cast',{Q:O,c});
  const times= st(S,'echo').some(x=>x.P===O) && O.echoT!==S.turn? 2 : 1; if (times===2) O.echoT=S.turn;
  for (let i=0;i<times;i++) for (const ab of c.fx) if (ab[0]==='play'){ if (ab[1]==='calm'){ for (const x of live) x.u.attacking=false; } else run(S,O,P,ab,{card:c,target:i===0?tgt:null}); }
  O.disc.push(c); cleanup(S); } }
// a pump or weaken Swift spell in one fight, only if it changes the outcome and the swing is worth the card
function trick(S, Q, E, unit, enemy, bHome, isAtt, a){ for (const c of Q.hand){ if (!isSwift(c) || isUnitT(c) || costOf(S,Q,c)>Q.inf || !reqOk(S,Q,c)) continue;
    const ab=c.fx.find(x=>x[0]==='play' && (x[1]==='pump'||x[1]==='weaken'||x[1]==='mend')); if (!ab) continue;
    const res=()=> isAtt? fight(S,Q,unit,E,enemy,bHome) : fight(S,E,enemy,Q,unit,bHome);
    const r0=res(); const loses0=isAtt? r0.aDies : r0.bDies, kills0=isAtt? r0.bDies : r0.aDies; if (!loses0 && kills0) continue;
    const op=ab[1], dp= op==='mend'? 0 : ab[2], dt= op==='mend'? ab[2] : ab[3]; const tg= op==='weaken'? enemy : unit; const sg= op==='weaken'? -1 : 1; tg.tp+=sg*dp; tg.tt+=sg*dt;
    const r1=res(); const loses1=isAtt? r1.aDies : r1.bDies, kills1=isAtt? r1.bDies : r1.aDies;
    const swing=(loses0&&!loses1?val(S,Q,unit):0)+(!kills0&&kills1?val(S,E,enemy):0); tg.tp-=sg*dp; tg.tt-=sg*dt;
    if (swing<costOf(S,Q,c)*1.5) continue;
    Q.hand.splice(Q.hand.indexOf(c),1); Q.inf-=costOf(S,Q,c); S.log.played.push([Q.i,c.id,S.turn]); S.log.swift[Q.i]++; fire(S,'cast',{Q,c});
    for (const x of c.fx) if (x[0]==='play') run(S,Q,E,x,{card:c,target:x[1]==='weaken'?[E,enemy]:[Q,unit]}); Q.disc.push(c); return; } }
// ---------- turn loop ----------
function over(S){ for (const P of S.p) if (P.harbor<=0 || P.decked){ S.over=true; S.win=1-P.i; S.why=P.harbor<=0?'harbor':'deck'; return true; } return false; }
function rise(S, P, O){
  if (P.skipRise){ P.skipRise=false; P.inf=P.cap; S.log.skipped[P.i]++; }
  else { P.cap=Math.min(R0.MAXCAP,P.cap+1); P.inf=P.cap; for (const u of P.units){ if (u.stranded>0){ u.stranded--; u.ready=false; S.log.strandedTurns[P.i]++; } else u.ready=true; u.mend=0; } }
  P.turns++; if (CFG.tide && P.turns>CFG.tide){ P.harbor-=1; S.log.tideDmg[P.i]++; }
  for (const u of P.units.slice()){ for (const ab of u.c.fx) if (ab[0]==='rise') run(S,P,O,ab,{card:u.c,self:u}); for (const e of u.eq.concat(u.auras)) for (const ab of e.fx) if (ab[0]==='rise') run(S,P,O,ab,{card:e,self:u}); }
  for (const h of P.holds.slice()) runAll(S,P,O,h.c,'rise'); for (const e of P.ench.slice()) runAll(S,P,O,e.c,'rise'); for (const r of P.relics.slice()) runAll(S,P,O,r,'rise');
  for (const f of ['S','D']){ const d=S.dom[f]; if (d) runAll(S,P,O,d.c,'rise'); }   // Domains are shared: their Rise effects happen for each player
  cleanup(S); }
const Z=()=>[0,0];
function play(deckA, deckB, seed, cfg){ cfg=cfg||{}; const off=new Set(cfg.off||[]);
  CFG={tide: off.has('tide')? 0 : (cfg.tide==null? 12 : cfg.tide), harbor:cfg.harbor||20, strand:!off.has('strand'), screens:!off.has('screen'), fronts:!off.has('fronts'), leaderStack:cfg.leaderStack!==false};
  const r=mk(seed); const S={r, turn:0, cur:0, ver:1, ver2:0, depth:0, dom:{S:null,D:null}, calm:{S:0,D:0}, over:false, win:-1, why:'', battle:null,
    log:{played:[], ops:{}}};
  for (const k of ['units','deaths','attacks','cross','blocks','fights','harborDmg','holdDmg','vesselDmg','stranded','strandedTurns','flash','swift','tideDmg','selfDmg','directDmg','stolen','skipped']) S.log[k]=Z();
  S.p=[deckA,deckB].map((d,i)=>{ const deck=d.slice(); for (let k=deck.length-1;k>0;k--){ const j=Math.floor(r()*(k+1)); [deck[k],deck[j]]=[deck[j],deck[k]]; }
    return {i, deck, hand:[], disc:[], units:[], holds:[], ench:[], relics:[], harbor:CFG.harbor, cap:0, inf:0, turns:0, taxNext:0}; });
  for (const P of S.p){ draw(S,P,R0.HAND); if (!P.hand.some(c=>c.cost<=3)){ P.deck.push(...P.hand.splice(0)); shuffle(S,P.deck); draw(S,P,R0.HAND); } }
  let cur=r()<0.5?0:1; const first=cur;
  while (!S.over && S.turn<R0.TURNCAP*2){ S.turn++; S.cur=cur; const P=S.p[cur], O=S.p[1-cur];
    rise(S,P,O); if (S.turn===2) P.inf+=2; if (over(S)) break;
    if (S.turn!==1) draw(S,P,1); if (over(S)) break;
    mainPhase(S,P,O,false); if (over(S)) break;
    battle(S,P,O); if (over(S)) break;
    mainPhase(S,P,O,true); if (over(S)) break;
    for (const Q of S.p) for (const u of Q.units){ u.dmg=0; u.tp=0; u.tt=0; u.kwT.clear(); }
    bump(S); cur=1-cur; }
  if (!S.over){ S.win=S.p[0].harbor>S.p[1].harbor?0:S.p[1].harbor>S.p[0].harbor?1:-1; S.why='time'; }
  return {w:S.win, first, turns:Math.ceil(S.turn/2), why:S.why, log:S.log, harbor:[S.p[0].harbor,S.p[1].harbor]}; }
module.exports={play, R0, costOf, matchC};
