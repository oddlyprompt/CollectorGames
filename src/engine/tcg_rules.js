// ===================== TCG: THE WILDKIN RULES ENGINE =====================
// Plays real games of Wildkin between two decks, card by card, with the rules in wildkin-production/manifest.json ("rules").
// Nobody in the game plays matches by hand: this engine decides which decks beat which, and the metagame, tournaments
// and bans are built on its results (tcg_world.js). It is pure: no globals from the game except what is passed in,
// so tools/wildkin_sim.js runs the same file in Node for balance checks.
// Card effects are small operations ("ops", written by tools/wildkin_design.py); the printed text is generated from
// the same ops, so what a card says and what it does cannot drift apart.
const WKR=(()=>{
const RV=1, BENCH=5, PRIZES=4, HAND0=7, DECK=40, MAXC=4, TURN_CAP=90;
const LET={V:'Verdant',T:'Tide',S:'Stone',I:'Iron',E:'Ember',L:'Storm',A:'Astral',D:'Dusk',W:'Wonder'};
const STG={'Basic':0,'Stage 1':1,'Stage 2':2};
function mk(seed){ let h=(seed>>>0)||1; return ()=>{ h^=h<<13; h>>>=0; h^=h>>>17; h^=h<<5; h>>>=0; return h/4294967296; }; }
function hs(s){ let h=2166136261; for (let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; }
// ---------- card preparation (cached on the card object, never saved) ----------
function prep(c){
  if (c._w) return c._w; const w={c, name:c.name, kind:c.kind, el:c.el||null, el2:c.el2||null};
  if (c.kind==='creature'){ w.stg=STG[c.stage]||0; w.from=c.from||null; w.hp=c.hp; w.weak=c.weak; w.ret=c.ret||0; w.pz=c.pz||1;
    w.atk=(c.atk||[]).map(a=>({n:a.n, cost:String(a.cost).split('').map(x=>x==='C'?'C':LET[x]), d:+a.d||0, fx:a.fx||[]}));
    w.ab=c.ab? {n:c.ab.n, k:c.ab.k, fx:c.ab.fx||[]} : null;
    w.pas={}; if (w.ab && w.ab.k==='passive') for (const o of w.ab.fx) w.pas[o[0]]=o[1]==null?true:o[1]; }
  else { w.fx=c.fx||[]; w.role=c.role||null; w.sub=c.sub||null;
    if (c.kind==='biome'){ const o=w.fx[0]||[]; w.bio=o[1]||c.el; const d=o[2]? [o[2],o[3]||0] : (BIO_DEF[w.bio]||['none',0]); w.be=d[0]; w.bn=d[1]; } }
  c._w=w; return w;
}
// biome effects: ['biome', affinity, effect, amount]. First Bond's biomes name only the affinity and use its effect below.
const BIO_DEF={Verdant:['heal',10], Tide:['free_retreat',0], Stone:['reduce',10], Iron:['hp',20], Ember:['dmg',10], Storm:['extra_attach',0], Astral:['draw',0], Dusk:['poison',10], Wonder:['rush',0]};
function bioOn(S, eff, x){ const b=S.bio&&S.bio.w; return !!(b && b.be===eff && (!x || x.w.el===b.bio)); }
function bioN(S, eff, x){ return bioOn(S,eff,x)? S.bio.w.bn : 0; }
// ---------- state helpers ----------
let UID=1;
function inst(card, t){ return {id:UID++, w:prep(card), card, under:[], en:[], tool:null, dmg:0, sl:0, pa:0, co:0, po:0, bu:0, t, guard:0, noRet:0, noAtk:0, vuln:0}; }
function maxHp(S, x){ let h=x.w.hp; if (x.tool) for (const o of x.tool._w.fx) if (o[0]==='tool_hp') h+=o[1]; h+=bioN(S,'hp',x); return h; }
function hpLeft(S, x){ return maxHp(S,x)-x.dmg; }
function hasCond(x){ return x.sl||x.pa||x.co||x.po||x.bu; }
function toolHas(x, k){ return !!(x.tool && x.tool._w.fx.some(o=>o[0]===k)); }
function toolVal(x, k){ if (!x.tool) return 0; let v=0; for (const o of x.tool._w.fx) if (o[0]===k) v+=o[1]||0; return v; }
function inPlay(p){ return p.act? [p.act, ...p.bench] : p.bench.slice(); }
function clearCond(x){ x.sl=x.pa=x.co=x.po=x.bu=0; }
function shuffle(S, a){ for (let i=a.length-1;i>0;i--){ const j=Math.floor(S.r()*(i+1)); const t=a[i]; a[i]=a[j]; a[j]=t; } return a; }
function flip(S){ return S.r()<0.5; }
function draw(S, p, n){ for (let i=0;i<n && p.deck.length;i++) p.hand.push(p.deck.pop()); }
function owns(sym, x){ return sym===x.w.el || sym===x.w.el2; }
// can these Essence pay this cost? (a dual-affinity creature pays its own symbols with either of its Essence)
function payable(x, cost, ens){
  const pool=(ens||x.en).map(e=>e._w.el); const need=cost.filter(s=>s!=='C'); let anyN=cost.length-need.length; const used=new Array(pool.length).fill(false);
  for (const s of need){ let k=pool.findIndex((e,i)=>!used[i] && e===s); if (k<0 && owns(s,x)) k=pool.findIndex((e,i)=>!used[i] && owns(e,x)); if (k<0) return false; used[k]=true; }
  return used.filter(u=>!u).length>=anyN;
}
// how many more Essence (and of what kind) this creature needs for this attack
function missing(x, cost){
  const pool=x.en.map(e=>e._w.el); const used=new Array(pool.length).fill(false); const miss=[];
  for (const s of cost.filter(s=>s!=='C')){ let k=pool.findIndex((e,i)=>!used[i] && e===s); if (k<0 && owns(s,x)) k=pool.findIndex((e,i)=>!used[i] && owns(e,x)); if (k<0) miss.push(s); else used[k]=true; }
  const anyN=cost.filter(s=>s==='C').length; const free=used.filter(u=>!u).length; for (let i=free;i<anyN;i++) miss.push('C'); return miss;
}
function fits(e, sym, x){ return sym==='C' || e===sym || (owns(sym,x) && owns(e,x)); }
function retreatCost(S, p, x){ if (toolHas(x,'tool_free_retreat')) return 0; if (bioOn(S,'free_retreat',x)) return 0; return x.w.ret; }
// ---------- damage ----------
function reduceOf(S, x){ let r=0; const P=x.w.pas; if (P.reduce) r+=P.reduce; if (P.tool_reduce && x.tool) r+=P.tool_reduce; r+=toolVal(x,'tool_reduce'); r+=bioN(S,'reduce',x); r+=x.guard; return r; }
function calcDmg(S, me, att, def, base){
  if (base<=0) return 0; let d=base+me.boost+toolVal(att,'tool_dmg'); d+=bioN(S,'dmg',att);
  if (def.w.weak===att.w.el && !toolHas(def,'tool_no_weak')) d*=2;
  d+=def.vuln; d-=reduceOf(S,def); return Math.max(0,d);
}
// ---------- knockouts and winning ----------
function discardInst(p, x){ p.disc.push(x.card, ...x.under, ...x.en); if (x.tool) p.disc.push(x.tool); }
function checkKO(S){
  for (const k of [1-S.cur, S.cur]){ const p=S.p[k], o=S.p[1-k];
    for (const x of inPlay(p)){ if (x.dmg<maxHp(S,x)) continue;
      discardInst(p,x); if (p.act===x) p.act=null; else p.bench.splice(p.bench.indexOf(x),1);
      for (let i=0;i<x.w.pz && o.prizes.length;i++) o.hand.push(o.prizes.pop()); o.kos++;
      if (!o.prizes.length) return end(S, 1-k, 'prizes'); } }
  for (const k of [1-S.cur, S.cur]){ const p=S.p[k]; if (!p.act){ if (!p.bench.length) return end(S,1-k,'wipe'); promote(S,p); } }
  return false;
}
function end(S, w, why){ if (S.over) return true; S.over=true; S.win=w; S.why=why; return true; }
function promote(S, p){ let best=null, bs=-1e9; for (const x of p.bench){ const s=readyScore(S,p,x); if (s>bs){ bs=s; best=x; } } p.bench.splice(p.bench.indexOf(best),1); p.act=best; }
function readyScore(S, p, x){ const a=bestAffordable(S,p,x); return (a? 60+a.d : 0)+x.en.length*12+x.w.stg*15+hpLeft(S,x)*0.2; }
function bestAffordable(S, p, x){ let b=null; for (const a of x.w.atk) if (payable(x,a.cost) && (!b || a.d>b.d)) b=a; return b; }
function mainAttack(x){ let b=null; for (const a of x.w.atk) if (!b || a.d+a.fx.length*5>b.d+b.fx.length*5) b=a; return b; }
// ---------- conditions ----------
function setCond(S, x, k){ if (toolHas(x,'tool_status_immune')) return; if (k==='asleep'||k==='paralyzed'||k==='confused'){ x.sl=x.pa=x.co=0; } if (k==='asleep') x.sl=1; else if (k==='paralyzed') x.pa=S.t+1; else if (k==='confused') x.co=1; else if (k==='poisoned') x.po=1; else if (k==='burned') x.bu=1; }
function checkup(S){
  for (const p of S.p){ const x=p.act; if (!x) continue;
    if (x.po) x.dmg+=10+bioN(S,'poison');
    if (x.bu){ x.dmg+=20; if (flip(S)) x.bu=0; }
    if (x.sl && flip(S)) x.sl=0;
    if (x.pa && S.t>=x.pa) x.pa=0; }
  if (bioOn(S,'heal')) for (const p of S.p) for (const x of inPlay(p)) if (bioOn(S,'heal',x)) x.dmg=Math.max(0,x.dmg-S.bio.w.bn);
}
// ---------- moving cards ----------
function benchBasic(S, p, card){ if (p.bench.length>=BENCH) return false; const i=p.hand.indexOf(card); if (i>=0) p.hand.splice(i,1); p.bench.push(inst(card,S.t)); return true; }
function canEvolve(S, p, x, card){ const w=prep(card); if (w.kind!=='creature' || w.from!==x.w.name) return false; if (p.first) return false;
  if (x.t<S.t) return true; return p.rush===x.id || (bioOn(S,'rush') && w.el===S.bio.w.bio); }
function evolve(S, p, x, card){ p.hand.splice(p.hand.indexOf(card),1); x.under.push(x.card); x.card=card; x.w=prep(card); x.t=S.t; clearCond(x); x.evolvedOn=S.t; }
function switchActive(S, p, x){ const a=p.act; clearCond(a); a.guard=0; p.bench.splice(p.bench.indexOf(x),1); p.bench.push(a); p.act=x; }
function searchDeck(S, p, pred, n){ const out=[]; for (let i=p.deck.length-1;i>=0 && out.length<n;i--) if (pred(p.deck[i])){ out.push(p.deck[i]); p.deck.splice(i,1); } shuffle(S,p.deck); return out; }
// ---------- what the AI wants ----------
// the creature this player is building to attack with: the strongest attacker in play, preferring the Active
function evoInDeckOrHand(p, x){ const nm=x.w.name; return p.hand.some(c=>prep(c).from===nm) || p.deck.some(c=>prep(c).from===nm); }
function wantsEvolution(p, card){ const w=prep(card); return inPlay(p).some(x=>x.w.name===w.from); }
function attackerValue(S, p, x){ const a=mainAttack(x); return (a? a.d : 0)+x.w.stg*25+(evoInDeckOrHand(p,x)? 20:0); }
function chooseAttachTarget(S, p, e){
  let best=null, bs=-1e9; const el=e._w.el;
  for (const x of inPlay(p)){ const a=mainAttack(x); if (!a) continue; const miss=missing(x,a.cost); let s=0;
    const useful=miss.some(m=>fits(el,m,x)); if (!miss.length) s=-30; else if (!useful) s=-60; else s=40-miss.length*4;
    if (x===p.act){ const now=x.w.atk.some(b=>!payable(x,b.cost) && payable(x,b.cost,[...x.en,e])); if (now) s+=60; else s+=10; }
    s+=attackerValue(S,p,x)*0.15; if (hpLeft(S,x)<=30 && x===p.act) s-=40;
    if (s>bs){ bs=s; best=x; } }
  return bs>-50? best : null;
}
function canKO(S, me, op, att, def, extra){ const a=bestAffordable(S,me,att); if (!a) return false; return calcDmg(S,me,att,def,a.d+(extra||0))>=hpLeft(S,def); }
function oppThreat(S, op){ const x=op.act; if (!x) return 0; let d=0; for (const a of x.w.atk) d=Math.max(d,a.d); return d; }
// ---------- playing trainers ----------
function trainerScore(S, me, op, card){
  const w=prep(card), fx=w.fx; let s=0; const hand=me.hand.length, deck=me.deck.length;
  if (w.kind==='ally' && (me.ally || S.t===1)) return -1; if (w.kind==='tactic' && me.tac) return -1; if (w.kind==='biome'){ if (me.bio) return -1; const cur=S.bio&&S.bio.w; if (cur && cur.name===w.name) return -1; const mine=inPlay(me).filter(x=>x.w.el===w.bio).length; const theirs=inPlay(op).filter(x=>x.w.el===w.bio).length; return mine>theirs? 20+mine*3 : -1; }
  if (w.sub==='tool'){ const t=toolTarget(S,me,op,card); return t? 25 : -1; }
  for (const o of fx){ const k=o[0];
    if (k==='draw') s+= deck>o[1]+8? (hand<=3?14:hand<=5?9:2)*o[1]/2 : -50;
    else if (k==='discard_draw') s+= deck>16? (hand<=2?30:hand<=3?18:hand<=5?4:-10) : -50;
    else if (k==='shuffle_draw') s+= hand<=3? 20 : hand<=5? 8 : -5;
    else if (k==='draw_to') s+= (o[1]-hand)*7-4;
    else if (k==='look_take') s+= deck>o[1]? o[2]*7+(hand<=4?4:0) : -50;
    else if (k==='draw_per_bench') s+= me.bench.length*6-4;
    else if (k==='search'){ const what=o[1]; s+= searchWant(S,me,what)? 14 : -6; }
    else if (k==='bench_basic' || k==='first_bond' || k==='revive_basic'){ const room=BENCH-me.bench.length; const has=k==='revive_basic'? me.disc.some(c=>prep(c).kind==='creature'&&prep(c).stg===0) : me.deck.some(c=>prep(c).kind==='creature'&&prep(c).stg===0); s+= has && room>0 && me.bench.length<4? 16+(me.bench.length<2?12:0) : -10; }
    else if (k==='heal_all'){ const t=inPlay(me).reduce((q,x)=>q+Math.min(o[1],x.dmg),0); s+= t>=40? t*0.4 : -5; }
    else if (k==='heal_one'){ const t=Math.max(0,...inPlay(me).map(x=>Math.min(o[1],x.dmg))); s+= t>=30? t*0.4 : -5; }
    else if (k==='heal_active'){ const t=me.act? Math.min(o[1],me.act.dmg):0; s+= t>=30 && hpLeft(S,me.act)<=oppThreat(S,op)+20? t*0.5 : -5; }
    else if (k==='heal_full_discard'){ const x=me.act; s+= x && x.dmg>=90 && x.en.length<=2 && hpLeft(S,x)<=oppThreat(S,op)? 30 : -20; }
    else if (k==='cure') s+= me.act && hasCond(me.act)? 12 : 0;
    else if (k==='cure_all') s+= inPlay(me).some(hasCond)? 10 : 0;
    else if (k==='switch'){ s+= switchWant(S,me,op)? 22 : (fx.length>1? 0 : -10); }
    else if (k==='gust' || k==='coin_gust'){ const g=gustTarget(S,me,op); s+= g? (k==='coin_gust'? 12 : 30)+g.w.pz*8 : -10; }
    else if (k==='cost_discard_essence'){ s+= me.hand.filter(c=>prep(c).kind==='essence').length>=2? 0 : -100; }
    else if (k==='recover'){ const n=me.disc.filter(c=>prep(c).kind==='creature').length; s+= n? Math.min(n,o[1])*8 : -10; }
    else if (k==='recover_ess'){ const n=me.disc.filter(c=>prep(c).kind==='essence').length; s+= Math.min(n,o[1])*4; }
    else if (k==='essence_from_discard'){ const n=me.disc.filter(c=>prep(c).kind==='essence').length; s+= n? 14 : -10; }
    else if (k==='opp_shuffle_draw') s+= op.hand.length-o[1]>=2? (op.hand.length-o[1])*4 : -4;
    else if (k==='strip_any' || k==='strip_active'){ const t=op.act; s+= t && t.en.length? 10+(bestAffordable(S,op,t)?8:0) : -10; }
    else if (k==='boost' || k==='rally'){ const x=me.act, d=op.act; const add=k==='boost'? o[1] : me.bench.length*10; s+= x && d && !canKO(S,me,op,x,d) && canKO(S,me,op,x,d,add)? 35 : -10; }
    else if (k==='opp_discard_choice') s+= op.hand.length? 9 : -5;
    else if (k==='opp_discard_random') s+= op.hand.length? 6 : -5;
    else if (k==='discard_hand') s-= 3;
    else if (k==='skip_evolve') s+= skipTarget(S,me)? 40 : -10;
    else if (k==='rush_evolve'){ s+= me.hand.some(c=>prep(c).kind==='creature'&&prep(c).stg===0&&me.hand.some(e=>prep(e).from===prep(c).name)) && me.bench.length<BENCH && !me.first? 15 : -10; }
    else if (k==='no_retreat_def') s+= 1;
    else if (k==='vuln'){ const x=me.act, d=op.act; s+= x && d && !canKO(S,me,op,x,d) && canKO(S,me,op,x,d,o[1])? 25 : -6; }
  }
  return s;
}
function skipTarget(S, p){ if (p.first) return null; for (const c of p.hand){ const w=prep(c); if (w.kind!=='creature' || w.stg!==2) continue; const mid=p.deck.concat(p.hand,p.disc).find(m=>prep(m).name===w.from); if (!mid) continue;
  const x=inPlay(p).find(y=>y.w.stg===0 && y.w.name===prep(mid).from && y.t<S.t); if (x) return [x,c]; } return null; }
function searchWant(S, p, what){
  const lacksBasic=p.bench.length<3, ev=p.deck.some(c=>prep(c).kind==='creature'&&prep(c).stg>0&&wantsEvolution(p,c)&&!p.hand.some(h=>prep(h).name===prep(c).name));
  const noEss=!p.hand.some(c=>prep(c).kind==='essence');
  if (what==='creature') return (lacksBasic && p.deck.some(c=>prep(c).kind==='creature'&&prep(c).stg===0)) || ev;
  if (what==='basic') return lacksBasic && p.deck.some(c=>prep(c).kind==='creature'&&prep(c).stg===0);
  if (what==='evolution' || what==='evolves_in_play') return ev;
  if (what==='essence' || what==='biome_or_essence') return noEss && p.deck.some(c=>prep(c).kind==='essence');
  return false;
}
function switchWant(S, me, op){ const a=me.act; if (!a || !me.bench.length) return false; const stuck=(a.sl||a.pa) || (!bestAffordable(S,me,a) && retreatCost(S,me,a)>a.en.length); const ready=me.bench.some(x=>bestAffordable(S,me,x)); return (stuck||!bestAffordable(S,me,a)) && ready || (a.po && hpLeft(S,a)<=20 && ready); }
function gustTarget(S, me, op){ const x=me.act; if (!x || !op.bench.length || me.first) return null; let best=null, bs=0;
  for (const y of op.bench){ if (!canKO(S,me,op,x,y)) continue; const s=y.w.pz*10+y.w.stg*5+y.en.length*2; if (s>bs){ bs=s; best=y; } }
  if (best && op.act && canKO(S,me,op,x,op.act) && op.act.w.pz>=best.w.pz) return null; return best; }
function toolTarget(S, me, op, card){ const w=prep(card); const fx=w.fx.map(o=>o[0]); const cand=inPlay(me).filter(x=>!x.tool); if (!cand.length) return null;
  const main=cand.slice().sort((a,b)=>attackerValue(S,me,b)-attackerValue(S,me,a))[0];
  if (fx.includes('tool_free_retreat')){ const t=cand.find(x=>x===me.act && x.w.ret>=2) || cand.find(x=>x.w.ret>=3); return t||null; }
  if (fx.includes('tool_no_weak')){ const t=cand.find(x=>op.act && x.w.weak===op.act.w.el); return t||null; }
  if (fx.includes('tool_status_immune')){ const opStatus=op.act && op.act.w.atk.some(a=>a.fx.some(o=>o[0]==='status')); return opStatus? (cand.includes(me.act)? me.act : main) : (cand.includes(me.act) && me.act.w.stg>0? me.act : null); }
  if (fx.includes('tool_dmg')) return cand.includes(me.act) && bestAffordable(S,me,me.act)? me.act : (main && main!==me.act && main.w.stg>0? main : null);
  return main;
}
function applyTrainer(S, me, op, card){
  const w=prep(card); me.hand.splice(me.hand.indexOf(card),1);
  if (w.kind==='ally') me.ally=true; if (w.kind==='tactic') me.tac=true;
  if (w.kind==='biome'){ me.bio=true; if (S.bio) S.p[S.bio.o].disc.push(S.bio.card); S.bio={w, card, o:me.i}; return; }
  if (w.sub==='tool'){ const t=toolTarget(S,me,op,card); if (t) t.tool=card; else me.disc.push(card); return; }
  let target=null;
  for (const o of w.fx){ const k=o[0];
    if (k==='draw') draw(S,me,o[1]);
    else if (k==='discard_draw'){ me.disc.push(...me.hand.splice(0)); draw(S,me,o[1]); }
    else if (k==='shuffle_draw'){ me.deck.push(...me.hand.splice(0)); shuffle(S,me.deck); draw(S,me,o[1]); }
    else if (k==='draw_to'){ draw(S,me,Math.max(0,o[1]-me.hand.length)); }
    else if (k==='draw_per_bench') draw(S,me,me.bench.length);
    else if (k==='look_take'){ const top=me.deck.splice(Math.max(0,me.deck.length-o[1])); top.sort((a,b)=>cardWant(S,me,b)-cardWant(S,me,a)); me.hand.push(...top.splice(0,o[2])); me.deck.push(...top); shuffle(S,me.deck); }
    else if (k==='search'){ const what=o[1]; const pick=bestInDeck(S,me,c=>{ const x=prep(c); return what==='creature'? x.kind==='creature' : what==='basic'? x.kind==='creature'&&x.stg===0 : what==='evolution'? x.kind==='creature'&&x.stg>0 : what==='evolves_in_play'? x.kind==='creature'&&wantsEvolution(me,c) : what==='essence'? x.kind==='essence' : (x.kind==='essence'||x.kind==='biome'); });
      if (pick){ me.deck.splice(me.deck.indexOf(pick),1); me.hand.push(pick); } shuffle(S,me.deck); }
    else if (k==='bench_basic'){ for (let i=0;i<o[1] && me.bench.length<BENCH;i++){ const c=bestInDeck(S,me,c=>prep(c).kind==='creature'&&prep(c).stg===0); if (!c) break; me.deck.splice(me.deck.indexOf(c),1); me.bench.push(inst(c,S.t)); } shuffle(S,me.deck); }
    else if (k==='first_bond'){ const c=bestInDeck(S,me,c=>prep(c).kind==='creature'&&prep(c).stg===0); if (c && me.bench.length<BENCH){ me.deck.splice(me.deck.indexOf(c),1); const x=inst(c,S.t); me.bench.push(x); const e=me.deck.find(d=>prep(d).kind==='essence' && owns(prep(d).el,x)); if (e){ me.deck.splice(me.deck.indexOf(e),1); x.en.push(e); } } shuffle(S,me.deck); }
    else if (k==='revive_basic'){ const c=me.disc.find(c=>prep(c).kind==='creature'&&prep(c).stg===0); if (c && me.bench.length<BENCH){ me.disc.splice(me.disc.indexOf(c),1); me.bench.push(inst(c,S.t)); } }
    else if (k==='heal_all') for (const x of inPlay(me)) x.dmg=Math.max(0,x.dmg-o[1]);
    else if (k==='heal_one'){ const x=inPlay(me).sort((a,b)=>b.dmg-a.dmg)[0]; if (x) x.dmg=Math.max(0,x.dmg-o[1]); }
    else if (k==='heal_active'){ if (me.act) me.act.dmg=Math.max(0,me.act.dmg-o[1]); }
    else if (k==='heal_full_discard'){ const x=me.act; if (x){ x.dmg=0; clearCond(x); me.disc.push(...x.en.splice(0)); } }
    else if (k==='cure'){ if (me.act) clearCond(me.act); }
    else if (k==='cure_all') for (const x of inPlay(me)) clearCond(x);
    else if (k==='switch'){ if (me.bench.length){ const b=bestBench(S,me); switchActive(S,me,b); } }
    else if (k==='gust' || (k==='coin_gust' && flip(S))){ const g=gustTarget(S,me,op) || op.bench.slice().sort((a,b)=>hpLeft(S,a)-hpLeft(S,b))[0]; if (g){ const a=op.act; clearCond(a); op.bench.splice(op.bench.indexOf(g),1); op.bench.push(a); op.act=g; } }
    else if (k==='cost_discard_essence'){ const e=me.hand.find(c=>prep(c).kind==='essence'); if (e){ me.hand.splice(me.hand.indexOf(e),1); me.disc.push(e); } }
    else if (k==='recover'){ for (let i=0;i<o[1];i++){ const c=me.disc.filter(c=>prep(c).kind==='creature').sort((a,b)=>prep(b).stg-prep(a).stg)[0]; if (!c) break; me.disc.splice(me.disc.indexOf(c),1); me.hand.push(c); } }
    else if (k==='recover_ess'){ for (let i=0;i<o[1];i++){ const c=me.disc.find(c=>prep(c).kind==='essence'); if (!c) break; me.disc.splice(me.disc.indexOf(c),1); me.hand.push(c); } }
    else if (k==='essence_from_discard'){ const e=me.disc.find(c=>prep(c).kind==='essence'); if (e){ const x=chooseAttachTarget(S,me,e)||me.act; me.disc.splice(me.disc.indexOf(e),1); x.en.push(e); } }
    else if (k==='opp_shuffle_draw'){ op.deck.push(...op.hand.splice(0)); shuffle(S,op.deck); draw(S,op,o[1]); }
    else if (k==='strip_any' || k==='strip_active'){ const t=k==='strip_active'? op.act : inPlay(op).filter(x=>x.en.length).sort((a,b)=>attackerValue(S,op,b)-attackerValue(S,op,a))[0]; if (t && t.en.length) op.disc.push(t.en.pop()); }
    else if (k==='boost') me.boost+=o[1];
    else if (k==='rally') me.boost+=10*me.bench.length;
    else if (k==='opp_discard_choice'){ const c=op.hand.filter(c=>prep(c).kind!=='essence').sort((a,b)=>cardWant(S,op,b)-cardWant(S,op,a))[0]; if (c){ op.hand.splice(op.hand.indexOf(c),1); op.disc.push(c); } }
    else if (k==='opp_discard_random'){ for (let i=0;i<o[1] && op.hand.length;i++){ const j=Math.floor(S.r()*op.hand.length); op.disc.push(op.hand.splice(j,1)[0]); } }
    else if (k==='discard_hand'){ if (me.hand.length){ const c=me.hand.slice().sort((a,b)=>cardWant(S,me,a)-cardWant(S,me,b))[0]; me.hand.splice(me.hand.indexOf(c),1); me.disc.push(c); } }
    else if (k==='skip_evolve'){ const t=skipTarget(S,me); if (t) evolve(S,me,t[0],t[1]); }
    else if (k==='rush_evolve'){ const c=me.hand.find(c=>prep(c).kind==='creature'&&prep(c).stg===0&&me.hand.some(e=>prep(e).from===prep(c).name)); if (c && me.bench.length<BENCH){ benchBasic(S,me,c); me.rush=me.bench[me.bench.length-1].id; } }
    else if (k==='no_retreat_def'){ if (op.act) op.act.noRet=S.t+1; }
    else if (k==='vuln'){ if (op.act) op.act.vuln+=o[1]; }
  }
  me.disc.push(card);
}
function cardWant(S, p, c){ const w=prep(c); if (w.kind==='essence') return p.hand.some(h=>prep(h).kind==='essence')? 3 : 9; if (w.kind==='creature') return w.stg>0? (wantsEvolution(p,c)? 12 : 5) : (p.bench.length<3? 10 : 4); return 6; }
function bestInDeck(S, p, pred){ let best=null, bs=-1e9; for (const c of p.deck){ if (!pred(c)) continue; const s=cardWant(S,p,c)+(prep(c).kind==='creature'? attackerPotential(c)*0.05 : 0); if (s>bs){ bs=s; best=c; } } return best; }
function attackerPotential(c){ const w=prep(c); if (w.kind!=='creature') return 0; let d=0; for (const a of w.atk) d=Math.max(d,a.d); return d+w.hp*0.2; }
function bestBench(S, p){ let best=null, bs=-1e9; for (const x of p.bench){ const s=readyScore(S,p,x); if (s>bs){ bs=s; best=x; } } return best; }
// ---------- abilities ----------
function abilityUse(S, me, op, x){
  const ab=x.w.ab; if (!ab || ab.k!=='once' || me.abUsed.has(x.id)) return false; const o=ab.fx[0], k=o[0];
  if (k==='heal_one'){ const t=inPlay(me).filter(y=>!o[2]||y.w.el===o[2]||y.w.el2===o[2]).sort((a,b)=>b.dmg-a.dmg)[0]; if (!t || t.dmg<10) return false; t.dmg=Math.max(0,t.dmg-o[1]); }
  else if (k==='draw'){ if (me.deck.length<6) return false; draw(S,me,o[1]); }
  else if (k==='coin_draw'){ if (me.deck.length<6) return false; if (flip(S)) draw(S,me,o[1]); }
  else if (k==='attach_hand'){ const e=me.hand.find(c=>prep(c).kind==='essence'); if (!e || !me.bench.length) return false; const t=me.bench.slice().sort((a,b)=>attackerValue(S,me,b)-attackerValue(S,me,a)).find(y=>{ const a=mainAttack(y); return a && missing(y,a.cost).length; }); if (!t) return false; me.hand.splice(me.hand.indexOf(e),1); t.en.push(e); }
  else if (k==='switch_in'){ if (me.act===x || !me.act) return false; const a=me.act; const better=bestAffordable(S,me,x) && (!bestAffordable(S,me,a) || hasCond(a) || hpLeft(S,a)<=oppThreat(S,op)); if (!better) return false; clearCond(a); me.bench.splice(me.bench.indexOf(x),1); me.bench.push(a); me.act=x; }
  else if (k==='status_def'){ if (me.act!==x || !op.act || op.act.po) return false; setCond(S,op.act,o[1]); }
  else return false;
  me.abUsed.add(x.id); return true;
}
// ---------- the main phase: a greedy player that takes the best-looking action until none is worth it ----------
function mainPhase(S, me, op){
  for (let guard=0; guard<40 && !S.over; guard++){
    // 1. Basics onto the Bench (keep room; never bench more than 4 unless the deck is all Basics)
    const basics=me.hand.filter(c=>prep(c).kind==='creature' && prep(c).stg===0);
    if (basics.length && me.bench.length<4){ const b=basics.sort((a,b)=>attackerPotential(b)-attackerPotential(a))[0]; benchBasic(S,me,b); continue; }
    // 2. evolve anything that can
    let did=false;
    for (const x of inPlay(me)){ const e=me.hand.filter(c=>canEvolve(S,me,x,c)); if (e.length){ evolve(S,me,x,e[0]); did=true; break; } }
    if (did) continue;
    // 3. the best trainer
    let best=null, bs=0; for (const c of me.hand){ const k=prep(c).kind; if (k==='creature'||k==='essence') continue; const s=trainerScore(S,me,op,c); if (s>bs){ bs=s; best=c; } }
    if (best){ applyTrainer(S,me,op,best); if (S.over) return; continue; }
    // 4. abilities
    for (const x of inPlay(me)) if (abilityUse(S,me,op,x)){ did=true; break; }
    if (did) continue;
    // 5. attach Essence (once), plus the Storm biome's extra Storm attachment
    if (!me.ess){ const opts=me.hand.filter(c=>prep(c).kind==='essence'); let bt=null, be=null, bsc=-1e9; for (const e of opts){ const t=chooseAttachTarget(S,me,e); if (!t) continue; const sc=(t===me.act?5:0)+(missing(t,mainAttack(t).cost).some(m=>m===prep(e).el)?3:0); if (sc>bsc){ bsc=sc; bt=t; be=e; } }
      if (be){ me.hand.splice(me.hand.indexOf(be),1); bt.en.push(be); me.ess=true; continue; } if (!opts.length) me.ess=true; }
    if (!me.xs && bioOn(S,'extra_attach')){ me.xs=true; const ba=S.bio.w.bio; const e=me.hand.find(c=>prep(c).el===ba && prep(c).kind==='essence'); const t=e && inPlay(me).filter(x=>x.w.el===ba).find(x=>{ const a=mainAttack(x); return a && missing(x,a.cost).length; }); if (t){ me.hand.splice(me.hand.indexOf(e),1); t.en.push(e); continue; } }
    if (!me.xa && bioOn(S,'draw')){ me.xa=true; if (inPlay(me).some(x=>bioOn(S,'draw',x)) && me.deck.length>5){ draw(S,me,1); continue; } }
    // 6. retreat if the Active cannot do anything and someone on the Bench can
    if (!me.ret && me.act && me.bench.length){ const a=me.act; const rc=retreatCost(S,me,a);
      if (!a.sl && !a.pa && a.noRet<S.t && rc<=a.en.length){ const cand=bestBench(S,me); const aReady=bestAffordable(S,me,a);
        const should=(!aReady && bestAffordable(S,me,cand)) || ((a.co||a.po) && bestAffordable(S,me,cand) && rc<=1) || (hpLeft(S,a)<=oppThreat(S,op) && a.w.pz===2 && bestAffordable(S,me,cand) && rc<=1);
        if (should){ for (let i=0;i<rc;i++) me.disc.push(a.en.pop()); switchActive(S,me,cand); me.ret=true; continue; } } }
    break;
  }
}
// ---------- attacking ----------
function attackScore(S, me, op, x, a){
  const d=op.act; let base=a.d, exp=0; const fx=a.fx; let ko=false;
  for (const o of fx){ if (o[0]==='per_essence') base+=o[1]*x.en.length; if (o[0]==='bonus_self_damaged' && x.dmg>0) base+=o[1]; if (o[0]==='bonus_status' && hasCond(d)) base+=o[1]; if (o[0]==='coin_bonus') exp+=o[1]/2; if (o[0]==='multi_coin') base=o[1]*o[2]/2; }
  const dm=calcDmg(S,me,x,d,base+exp); ko=dm>=hpLeft(S,d); let s=dm+(ko? 80+30*d.w.pz : 0);
  for (const o of fx){ const k=o[0];
    if (k==='status' && !toolHas(d,'tool_status_immune')) s+= (o[2]? 0.5:1)*({asleep:18,paralyzed:26,confused:14,poisoned:12,burned:14}[o[1]]||0)*(ko?0:1);
    else if (k==='draw') s+= me.deck.length>o[1]+4? 8*o[1] : -20;
    else if (k==='heal_self') s+= Math.min(o[1],x.dmg)*0.6;
    else if (k==='heal_team') s+= inPlay(me).reduce((q,y)=>q+Math.min(o[1],y.dmg),0)*0.5;
    else if (k==='snipe'){ const t=op.bench.length? Math.max(...op.bench.map(y=>Math.min(o[1],hpLeft(S,y))+(o[1]>=hpLeft(S,y)?60:0))) : 0; s+= t; }
    else if (k==='spread') s+= op.bench.reduce((q,y)=>q+Math.min(o[1],hpLeft(S,y))+(o[1]>=hpLeft(S,y)?50:0),0);
    else if (k==='strip') s+= d.en.length? (o[1]?6:12) : 0;
    else if (k==='discard_self') s-= o[1]*9;
    else if (k==='recoil') s-= hpLeft(S,x)<=o[1]? 200 : o[1]*0.5;
    else if (k==='guard') s+= ko? 0 : o[1]*0.5;
    else if (k==='cant_attack_next') s-= ko? 10 : 30;
    else if (k==='accel') s+= me.bench.length && me.deck.some(c=>prep(c).el===o[1]&&prep(c).kind==='essence')? 18 : 0;
    else if (k==='gust'){ const g=gustTarget(S,me,op); if (g) s+= 80+30*g.w.pz; }
    else if (k==='self_switch') s+= me.bench.length? 4 : 0;
    else if (k==='opp_discard_random') s+= op.hand.length? 7 : 0;
    else if (k==='no_retreat_def') s+= ko? 0 : 5;
  }
  return s;
}
function doAttack(S, me, op){
  const x=me.act; if (!x || x.sl || x.pa || x.noAtk>=S.t || (S.t<=1)) return;
  let best=null, bs=-1e9; for (const a of x.w.atk){ if (!payable(x,a.cost)) continue; const s=attackScore(S,me,op,x,a); if (s>bs){ bs=s; best=a; } }
  if (!best || bs<=0 && best.d===0 && !best.fx.length) return;
  me.attacked=true; S.atks[me.i]++;
  if (x.co && !flip(S)){ x.dmg+=30; checkKO(S); return; }
  const fx=best.fx; let base=best.d;
  for (const o of fx) if (o[0]==='gust'){ const g=gustTarget(S,me,op); if (g){ const a=op.act; clearCond(a); op.bench.splice(op.bench.indexOf(g),1); op.bench.push(a); op.act=g; } }
  const d=op.act; let heads={};
  for (const o of fx){ const k=o[0];
    if (k==='per_essence') base+=o[1]*x.en.length; else if (k==='bonus_self_damaged' && x.dmg>0) base+=o[1]; else if (k==='bonus_status' && hasCond(d)) base+=o[1];
    else if (k==='coin_bonus' && flip(S)) base+=o[1]; else if (k==='multi_coin'){ let h=0; for (let i=0;i<o[1];i++) if (flip(S)) h++; base=h*o[2]; } }
  const dm=calcDmg(S,me,x,d,base); d.dmg+=dm; S.dealt[me.i]+=dm;
  for (const o of fx){ const k=o[0];
    if (k==='status'){ if (!o[2] || flip(S)) setCond(S,d,o[1]); }
    else if (k==='draw') draw(S,me,o[1]);
    else if (k==='heal_self') x.dmg=Math.max(0,x.dmg-o[1]);
    else if (k==='heal_team') for (const y of inPlay(me)) y.dmg=Math.max(0,y.dmg-o[1]);
    else if (k==='snipe' || k==='spread'){ if (op.act && op.act.w.pas.bench_shield) continue; const shield=inPlay(op).some(y=>y.w.pas.bench_shield); if (shield) continue;
      const tg= k==='spread'? op.bench.slice() : [op.bench.slice().sort((a,b)=>((o[1]>=hpLeft(S,b))?1000:0)-((o[1]>=hpLeft(S,a))?1000:0)+b.w.stg-a.w.stg)[0]].filter(Boolean); for (const y of tg) y.dmg+=Math.max(0,o[1]-reduceOf(S,y)); }
    else if (k==='strip'){ if (d.en.length && (!o[1] || flip(S))) op.disc.push(d.en.pop()); }
    else if (k==='discard_self'){ for (let i=0;i<o[1] && x.en.length;i++){ const j=discardChoice(x); me.disc.push(x.en.splice(j,1)[0]); } }
    else if (k==='recoil') x.dmg+=o[1];
    else if (k==='guard') x.guard=o[1];
    else if (k==='cant_attack_next') x.noAtk=S.t+2;
    else if (k==='no_retreat_def') d.noRet=S.t+1;
    else if (k==='accel'){ const e=me.deck.find(c=>prep(c).kind==='essence' && prep(c).el===o[1]); if (e && me.bench.length){ const t=me.bench.slice().sort((a,b)=>attackerValue(S,me,b)-attackerValue(S,me,a))[0]; me.deck.splice(me.deck.indexOf(e),1); t.en.push(e); shuffle(S,me.deck); } }
    else if (k==='opp_discard_random'){ if (op.hand.length){ const j=Math.floor(S.r()*op.hand.length); op.disc.push(op.hand.splice(j,1)[0]); } }
  }
  if (x.tool && me.attacked){ const rc=toolVal(x,'tool_recoil'); if (rc) x.dmg+=rc; }
  if (checkKO(S)) return;
  if (fx.some(o=>o[0]==='self_switch') && me.act===x && me.bench.length){ const b=bestBench(S,me); switchActive(S,me,b); }
}
function discardChoice(x){ const a=mainAttack(x); let best=x.en.length-1; for (let i=0;i<x.en.length;i++){ const rest=x.en.filter((_,j)=>j!==i); if (payable(x,a.cost,rest)) { best=i; break; } } return best; }
// ---------- a whole game ----------
function setup(S, p){
  for (let tries=0; tries<20; tries++){ shuffle(S,p.deck); draw(S,p,HAND0); if (p.hand.some(c=>prep(c).kind==='creature' && prep(c).stg===0)) break; p.deck.push(...p.hand.splice(0)); p.mull++; }
  const basics=p.hand.filter(c=>prep(c).kind==='creature' && prep(c).stg===0).sort((a,b)=>startScore(b)-startScore(a));
  if (!basics.length) return false; p.hand.splice(p.hand.indexOf(basics[0]),1); p.act=inst(basics[0],0);
  for (const b of basics.slice(1, 4)) benchBasic(S,p,b);
  for (let i=0;i<PRIZES;i++) p.prizes.push(p.deck.pop()); return true;
}
function startScore(c){ const w=prep(c); const cheap=w.atk.some(a=>a.cost.length<=1); return (cheap?20:0)+w.hp*0.1+(w.ab&&w.ab.fx[0][0]==='switch_in'?-15:0); }
function play(deckA, deckB, seed, opt){
  const S={r:mk(seed), t:0, cur:0, bio:null, over:false, win:-1, why:'', atks:[0,0], dealt:[0,0]};
  S.p=[deckA,deckB].map((d,i)=>({i, deck:d.slice(), hand:[], disc:[], prizes:[], act:null, bench:[], mull:0, kos:0, first:true}));
  for (const p of S.p) setup(S,p);
  for (let k=0;k<2;k++) for (let i=0;i<S.p[1-k].mull;i++) draw(S,S.p[k],1);
  S.cur=flip(S)?0:1; const goFirst=S.cur;
  while (!S.over && S.t<TURN_CAP){
    const me=S.p[S.cur], op=S.p[1-S.cur]; S.t++;
    if (!me.deck.length){ end(S,1-S.cur,'deck'); break; }
    draw(S,me,S.t===2?2:1); me.ally=me.tac=me.ess=me.bio=me.ret=me.attacked=me.xs=me.xa=false; me.abUsed=new Set(); me.boost=0; me.rush=null;
    for (const x of inPlay(me)) x.guard=0;
    mainPhase(S,me,op); if (S.over) break;
    if (!(S.t===1)) doAttack(S,me,op); if (S.over) break;
    for (const x of inPlay(op)) x.vuln=0; me.boost=0;
    checkup(S); if (checkKO(S)) break;
    me.first=false; S.cur=1-S.cur;
  }
  if (!S.over){ const a=S.p[0].prizes.length, b=S.p[1].prizes.length; S.win= a<b?0 : b<a?1 : -1; S.why='time'; }
  return {w:S.win, why:S.why, turns:S.t, first:goFirst, pz:[PRIZES-S.p[0].prizes.length, PRIZES-S.p[1].prizes.length], dealt:S.dealt};
}
// ---------- deck building ----------
// A deck is built around a lead: the final form (or a standalone) the deck wins with. A partner line and the best
// trainers for the plan fill the rest. Built only from the cards passed in (legal, not banned).
// trainer slots, filled in this order until the deck has 40 cards: [kind, role, copies]
const TR_PLAN=[['ally','draw',3],['ally','search',2],['gear','search',2],['tactic','search',2],['ally','gust',1],['tactic','switch',2],['biome','biome',1],['gear','tool',1],
  ['ally','draw',1],['gear','draw',1],['ally','gust',1],['gear','heal',1],['tactic','draw',1],['ally','disrupt',1],['gear','tool',1],['tactic','heal',1],['gear','recover',1],['ally','search',1],['biome','biome',1]];
function lineOf(pool, c){ const by={}; for (const x of pool) if (x.kind==='creature' && (!by[x.name] || (x.set===c.set && by[x.name].set!==c.set))) by[x.name]=x; const out=[c]; let cur=c; while (cur && cur.from){ cur=by[cur.from]; if (!cur) return null; out.unshift(cur); } return out; }
function creatureRating(c){ const w=prep(c); let best=0; for (const a of w.atk){ let d=a.d; for (const o of a.fx){ if (o[0]==='per_essence') d+=o[1]*a.cost.length; if (o[0]==='multi_coin') d=o[1]*o[2]/2; if (o[0]==='coin_bonus'||o[0]==='bonus_status') d+=o[1]/2; if (o[0]==='snipe'||o[0]==='spread') d+=o[1]*0.8; if (o[0]==='discard_self') d-=o[1]*12; if (o[0]==='cant_attack_next') d*=0.6; }
  best=Math.max(best, d/Math.max(1.5,a.cost.length)); } return best*2+w.hp*0.25+(w.ab?12:0)-w.ret*3; }
function trainerRating(c, ctx){ const w=prep(c); let s=0; ctx=ctx||{}; for (const o of w.fx){ const k=o[0]; s+= {draw:o[1]*1.1, discard_draw:5.5, shuffle_draw:3.6, draw_to:4, look_take:2.4, draw_per_bench:3, search:2.6, bench_basic:3.4, first_bond:3.6, revive_basic:1.6,
  heal_all:o[1]/12, heal_one:o[1]/18, heal_active:o[1]/20, heal_full_discard:2.5, cure:0.5, cure_all:0.5, switch:2.4, gust:4, coin_gust:1.8, cost_discard_essence:-1.2, recover:o[1]*1.1, recover_ess:o[1]*0.5, essence_from_discard:2.2,
  opp_shuffle_draw:1.5, strip_any:2.2, strip_active:2, boost:2.4, rally:2.2, opp_discard_choice:2, opp_discard_random:o[1]*1.1, discard_hand:-0.8, rush_evolve:1.6, no_retreat_def:0.6, vuln:0.6,
  tool_hp:o[1]/12, tool_reduce:o[1]/7, tool_free_retreat:1.6, tool_dmg:o[1]/8, tool_recoil:-o[1]/12, tool_no_weak:1.6, tool_status_immune:1.2, biome:2}[k]||0; }
  if (w.kind==='ally') s*=0.95;
  for (const o of w.fx){ if (o[0]==='search' && (o[1]==='evolution'||o[1]==='evolves_in_play')) s+= ctx.evo? 2.5 : -9; if (o[0]==='skip_evolve') s+= ctx.st2? 5 : -9; if (o[0]==='search' && o[1]==='creature') s+= ctx.evo? 1.5 : 0; }
  return s; }
// tune (optional): how players change a list to fight the field. w: role weights (above 1 plays more of that role, below 1
// fewer), s: a seed that reorders close trainer choices. With no tune the list is the standard one (every result so far).
function buildDeck(pool, lead, variant, tune){
  variant=variant||0; const line=lineOf(pool, lead); if (!line) return null; const L=prep(lead); const els=new Set([L.el, L.el2].filter(Boolean));
  const counts=new Map(); const add=(c,n)=>counts.set(c,(counts.get(c)||0)+n);
  const plan=line.length===3? [4,3,3] : line.length===2? [4,3] : [4]; line.forEach((c,i)=>add(c,plan[i]));
  // partner: the best other final of a compatible affinity
  const finals=pool.filter(c=>c.kind==='creature' && c!==lead && !line.includes(c) && !pool.some(d=>d.kind==='creature' && d.from===c.name) && lineOf(pool,c));
  const comp=c=>{ const w=prep(c); return els.has(w.el) || (w.el2 && els.has(w.el2)); };
  const heavy=line.length===3; const pscore=c=>creatureRating(c)-(heavy? 30*(lineOf(pool,c).length-1) : 0);
  const partners=finals.filter(comp).sort((a,b)=>pscore(b)-pscore(a));
  const partner=partners[variant]||partners[0]||null;
  if (partner){ const pl=lineOf(pool,partner); const pp=pl.length===3? [3,2,2] : pl.length===2? [3,2] : [3]; pl.forEach((c,i)=>add(c,pp[i])); }
  const ctx={evo:line.length>1 || (partner && lineOf(pool,partner).length>1), st2:line.length===3 || (partner && lineOf(pool,partner).length===3)};
  let nCreat=[...counts.values()].reduce((a,b)=>a+b,0);
  // Essence: about a third of the deck, split by what the attacks ask for
  const need={}; for (const [c,n] of counts){ const w=prep(c); for (const a of w.atk) for (const s of a.cost) if (s!=='C') need[s]=(need[s]||0)+n*(w.stg+1); }
  const nEss=12; const ess=[]; const tot=Object.values(need).reduce((a,b)=>a+b,0)||1; let left=nEss;
  const keys=Object.keys(need).sort((a,b)=>need[b]-need[a]); keys.forEach((k,i)=>{ const n= i===keys.length-1? left : Math.max(2,Math.round(nEss*need[k]/tot)); ess.push([k,Math.min(left,n)]); left-=Math.min(left,n); });
  if (left>0 && ess.length) ess[0][1]+=left;
  // trainers by role
  const nTr=DECK-nCreat-nEss; const tr=pool.filter(c=>c.kind!=='creature' && c.kind!=='essence'); const picks=new Map();
  let have=0;
  const fitsDeck=c=>{ const w=prep(c); if (w.kind==='biome') return els.has(w.bio); if (w.fx.some(o=>o[0]==='search' && (o[1]==='evolution'||o[1]==='evolves_in_play'))) return line.length>1; if (w.fx.some(o=>o[0]==='skip_evolve')) return ctx.st2; return true; };
  const W=tune&&tune.w||{}, js=tune&&tune.s; const rate=c=>{ let r=trainerRating(c,ctx)*(W[prep(c).role]||1); if (js!=null) r*=0.8+0.4*((hs(js+':'+c.cid)%1000)/1000); return r; };
  const tplan=tune? TR_PLAN.map(([k,r,n])=>[k,r,Math.max(0,n+((W[r]||1)>=1.3?1:(W[r]||1)<=0.7?-1:0))]) : TR_PLAN;
  for (const [kind,role,n0] of tplan){ let n=Math.min(n0, nTr-have); if (n<=0) break; const cand=tr.filter(c=>c.kind===kind && prep(c).role===role && fitsDeck(c)).sort((a,b)=>rate(b)-rate(a));
    for (const c of cand){ if (n<=0) break; const k=Math.min(MAXC-(picks.get(c)||0), n, c.kind==='biome'?2:MAXC); if (k>0){ picks.set(c,(picks.get(c)||0)+k); n-=k; have+=k; } } }
  if (have<nTr){ const rest=tr.filter(c=>c.kind!=='biome').sort((a,b)=>rate(b)-rate(a)); for (const c of rest){ if (have>=nTr) break; const k=Math.min(MAXC-(picks.get(c)||0), nTr-have); if (k>0){ picks.set(c,(picks.get(c)||0)+k); have+=k; } } }
  while (have>nTr){ const worst=[...picks.keys()].sort((a,b)=>rate(a)-rate(b))[0]; picks.set(worst,picks.get(worst)-1); if (!picks.get(worst)) picks.delete(worst); have--; }
  return {lead, partner, line, creatures:[...counts], trainers:[...picks], essence:ess};
}
function deckCards(deck, essOf){ const out=[]; for (const [c,n] of deck.creatures) for (let i=0;i<n;i++) out.push(c); for (const [c,n] of deck.trainers) for (let i=0;i<n;i++) out.push(c); for (const [el,n] of deck.essence) for (let i=0;i<n;i++) out.push(essOf[el]); return out; }
function deckStyle(deck){
  let ctl=0, stl=0, cmb=0, agg=0, n=0;
  for (const [c,k] of deck.creatures){ const w=prep(c); for (const a of w.atk) for (const o of a.fx){ const t=o[0]; if (/status|strip|no_retreat|opp_discard|gust/.test(t)) ctl+=k; if (/heal|guard/.test(t)) stl+=k; if (/draw|accel/.test(t)) cmb+=k; if (/snipe|spread|coin_bonus|multi_coin|per_essence|bonus/.test(t)) agg+=k; } if (w.ab) cmb+=k*0.5; if (w.pas.reduce||w.pas.tool_reduce) stl+=k*1.5; n+=k; }
  for (const [c,k] of deck.trainers){ const r=prep(c).role; if (r==='disrupt'||r==='gust') ctl+=k*0.6; if (r==='heal'||r==='tool') stl+=k*0.4; if (r==='draw'||r==='search') cmb+=k*0.15; if (r==='boost') agg+=k; }
  const L=prep(deck.lead); let dpe=0; for (const a of L.atk) dpe=Math.max(dpe,a.d/a.cost.length); agg+= dpe>=40? 6 : dpe>=30? 3 : 0;
  const sc={aggro:agg, control:ctl, stall:stl, combo:cmb*0.8}; const top=Object.entries(sc).sort((a,b)=>b[1]-a[1])[0]; return top[1]>=5? top[0] : 'mid';
}
function sig(deck){ return [...deck.creatures.map(([c,n])=>c.cid+'x'+n), ...deck.trainers.map(([c,n])=>c.cid+'x'+n), ...deck.essence.map(([e,n])=>e+n)].sort().join(','); }
// win rate of a against b over n games (each side goes first half the time; seed from the deck lists, so it is the same in every world)
function matchup(a, b, essOf, n){ const A=deckCards(a,essOf), B=deckCards(b,essOf); const base=hs(sig(a)+'|'+sig(b)); let w=0, g=0; for (let i=0;i<n;i++){ const r= i%2? play(B,A,base+i) : play(A,B,base+i); const aw= i%2? (r.w===1?1:r.w===0?0:0.5) : (r.w===0?1:r.w===1?0:0.5); w+=aw; g++; } return w/g; }
// ---------- the field: which decks exist, and who beats whom ----------
// Every final form (and standalone) leads a deck, in two partner variants. Each candidate plays a gauntlet against a
// spread of the field; the best 15 then play a full round robin. Seeds come from the deck lists, so every world sees
// the same matchups; what differs between worlds is how players move between decks (tcg_world.js).
const META={gauntlet:8, field:10, pair:12, top:15};
function packDeck(d){ return {lead:d.lead.cid, partner:d.partner?d.partner.cid:null, v:d.v||0, c:d.creatures.map(([c,n])=>[c.cid,n]), t:d.trainers.map(([c,n])=>[c.cid,n]), e:d.essence.map(x=>x.slice()), st:d.st||deckStyle(d), g:d.g!=null?+d.g.toFixed(4):null, sig:sig(d)}; }
function unpackDeck(p, byCid){ const g=id=>byCid.get(id); const d={lead:g(p.lead), partner:p.partner?g(p.partner):null, v:p.v, creatures:p.c.map(([id,n])=>[g(id),n]), trainers:p.t.map(([id,n])=>[g(id),n]), essence:p.e, st:p.st, g:p.g};
  if (!d.lead || d.creatures.some(x=>!x[0]) || d.trainers.some(x=>!x[0])) return null; d.line=d.creatures.map(x=>x[0]); return d; }
function candidates(pool){ const finals=pool.filter(c=>c.kind==='creature' && !pool.some(d=>d.kind==='creature' && d.from===c.name)); const out=[], seen=new Set();
  for (const f of finals) for (const v of [0,1]){ const d=buildDeck(pool,f,v); if (!d) continue; const k=sig(d); if (seen.has(k)) continue; seen.add(k); d.v=v; d.st=deckStyle(d); out.push(d); } return out; }
function fieldOf(cands, k){ const step=Math.max(1,Math.floor(cands.length/k)); return cands.filter((_,i)=>i%step===0).slice(0,k); }
function gauntlet(d, field, essOf, n){ let w=0, k=0; for (const o of field){ if (sig(o)===sig(d)) continue; w+=matchup(d,o,essOf,n); k++; } return k? w/k : 0.5; }
function roundRobin(top, essOf, n, prev){ const M=top.map(()=>top.map(()=>0.5)); const old=new Map(); if (prev) prev.top.forEach((a,i)=>prev.top.forEach((b,j)=>old.set(a.sig+'|'+b.sig, prev.M[i][j])));
  for (let i=0;i<top.length;i++) for (let j=i+1;j<top.length;j++){ const si=sig(top[i]), sj=sig(top[j]); let p=old.get(si+'|'+sj); if (p==null) p=matchup(top[i],top[j],essOf,n); M[i][j]=+p.toFixed(4); M[j][i]=+(1-p).toFixed(4); } return M; }
function buildMeta(pool, essOf, opt){ const o=Object.assign({},META,opt||{}); const cands=candidates(pool); const field=fieldOf(cands,o.field);
  for (const d of cands) d.g=gauntlet(d,field,essOf,o.gauntlet); cands.sort((a,b)=>b.g-a.g); const top=cands.slice(0,o.top);
  return {rv:RV, cands:cands.map(packDeck), field:field.map(sig), top:top.map(packDeck), M:roundRobin(top,essOf,o.pair)}; }
// after a ban: rebuild only the decks that played the banned cards, re-test them, keep every result that did not change
function rebuildMeta(base, pool, essOf, byCid, opt){ const o=Object.assign({},META,opt||{}); const legal=new Set(pool.map(c=>c.cid)); const out=[]; const seen=new Set();
  const fieldSigs=new Set(base.field); let field=[];
  for (const p of base.cands){ let d=unpackDeck(p,byCid); const touched=!d || !legal.has(p.lead) || p.c.concat(p.t).some(([id])=>!legal.has(id));
    if (touched){ if (!legal.has(p.lead)) continue; d=buildDeck(pool,byCid.get(p.lead),p.v); if (!d) continue; d.v=p.v; d.st=deckStyle(d); d.g=null; }
    const k=sig(d); if (seen.has(k)) continue; seen.add(k); out.push(d); if (fieldSigs.has(p.sig)) field.push(d); }
  field=field.length>=4? field : fieldOf(out,o.field);
  for (const d of out) if (d.g==null) d.g=gauntlet(d,field,essOf,o.gauntlet);
  out.sort((a,b)=>b.g-a.g); const top=out.slice(0,o.top);
  const prev={top:base.top, M:base.M}; return {rv:RV, cands:out.map(packDeck), field:field.map(sig), top:top.map(packDeck), M:roundRobin(top,essOf,o.pair,prev)}; }
// the card objects the game and the harness use, from WK_CANON (one mapping for both)
function cardFromCanon(x, set){
  const c={set, no:x.no, id:x.id, cid:x.ident!=null? x.ident : set*1000+x.no, kind:x.kind, rar:x.rar, name:x.name, art:x.art, rs:x.rs, fan:x.fan||0.3};
  if (x.kind==='creature') Object.assign(c,{el:x.el, el2:x.el2, els:x.els, stage:x.stage, from:x.from, to:x.to, fam:x.fam, fams:x.fams, mascot:x.mascot, sp:x.sp, hp:x.hp, weak:x.weak, ret:x.ret, pz:x.pz||1,
    atk:x.atk.map(a=>({n:a[0], cost:a[1], d:a[2]||0, t:a[3], fx:a[4]||[], dl:a[5]!=null?a[5]:(a[2]?String(a[2]):'')})), ab:x.ab? {n:x.ab[0], k:x.ab[1], t:x.ab[2], fx:x.ab[3]} : null});
  else { c.rules=x.rules; c.fx=x.fx||[]; c.role=x.role||null; c.sub=x.sub||null; if (x.el) c.el=x.el; }
  if (x.same!=null){ c.same=x.same; c.pk=x.pk; }
  return c;
}
function setFromCanon(canon, set){ const cards=canon.cards.map(x=>cardFromCanon(x,set)); const byNo={}; for (const c of cards) byNo[c.no]=c;
  for (const c of cards) if (c.same!=null){ const b=byNo[c.same]; c.cid=b.cid; for (const k of ['el','el2','els','stage','from','to','fam','fams','mascot','sp','hp','weak','ret','pz','atk','ab','rules','fx','role','sub']) if (b[k]!==undefined && c[k]===undefined) c[k]=b[k]; c.kind=b.kind; }
  return cards; }
return {RV, META, cardFromCanon, setFromCanon, buildMeta, rebuildMeta, roundRobin, packDeck, unpackDeck, candidates, play, buildDeck, deckCards, deckStyle, sig, matchup, prep, lineOf, creatureRating, trainerRating, hs, payable};
})();
if (typeof module!=='undefined') module.exports=WKR;
