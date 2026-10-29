'use strict';
// The Broken Reach: headless, pure, deterministic battle resolver (combat rules v0.2, PROVISIONAL).
// State is plain JSON; applyMove never mutates its input.  Card definitions live in a registry (loadCards).
// Rules decisions that the handoff leaves open are listed in broken-reach-production/RULES_NOTES.md (AMB-n).
const DIRS=['N','NE','E','SE','S','SW','W','NW'];
const DX=[0,1,1,1,0,-1,-1,-1], DY=[-1,-1,0,1,1,1,0,-1];
const opp=i=>(i+4)%8, isDiag=i=>i%2===1;
const rot90=m=>{ let r=0; for (let i=0;i<8;i++) if (m>>i&1) r|=1<<((i+2)%8); return r; };
const rotMask=(m,deg)=>{ for (let k=0;k<deg/90;k++) m=rot90(m); return m; };
const pop=m=>{ let n=0; for (let i=0;i<8;i++) n+=m>>i&1; return n; };
const xy=c=>[c&3,c>>2], at=(x,y)=>x<0||y<0||x>3||y>3?-1:y*4+x;
const nbr=(c,d)=>at((c&3)+DX[d],(c>>2)+DY[d]);
const isCorner=c=>((c&3)===0||(c&3)===3)&&((c>>2)===0||(c>>2)===3);
const isEdge=c=>(c&3)===0||(c&3)===3||(c>>2)===0||(c>>2)===3;
const isCenter=c=>!isEdge(c);
const POS={corner:isCorner,edge:isEdge,center:isCenter};

const REG={}; let CARDS=REG;
function loadCards(list){ for (const c of list) REG[c.base_card_id]=c; }
const def=id=>REG[id];
const hasOp=(id,k)=>(REG[id].ops||[]).filter(o=>o.k===k);

function mulberry32(a){ return ()=>{ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function shuffle(arr,rng){ const a=arr.slice(); for (let i=a.length-1;i>0;i--){ const j=Math.floor(rng()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }

const freshTmp=()=>({atk:0,diag:0,ignoreRecip:false,noRecip:false,grdMinus:0,cap:0,extra:0});

// deckA, deckB: arrays of 20 base_card_ids.  first: 0|1 (null = chosen by seed).
// rules: optional experimental turn-order variants (all off by default = combat rules v0.2):
//   komi (points added to the first player's final count), lastPassive (the 16th placement makes no challenges),
//   lastMinus (all Attack -n on the 16th placement), firstHand (extra cards in the first player's opening hand),
//   firstGuard (+n Guard to every unit the first player controls), secondDraw (extra card for the second player)
// Tetra-Master-style options (2026-10-30): noRecip (no +1 Guard for a pointing-back arrow), maxGen (a card captured at generation > maxGen
//   flips but does not attack, so combos stop after maxGen levels; default unlimited), auto (an arrow at an enemy that does not point back
//   captures with no stat comparison; only arrow-to-arrow contacts are Attack-vs-Guard duels)
function newMatch({deckA,deckB,planet=null,seed=1,first=null,rules={}}){
  const rng=mulberry32(seed);
  if (first==null) first=rng()<0.5?0:1;
  const decks=[shuffle(deckA,rng),shuffle(deckB,rng)];
  const hands=[decks[0].splice(0,5+(first===0?(rules.firstHand||0):(rules.secondDraw||0))),decks[1].splice(0,5+(first===1?(rules.firstHand||0):(rules.secondDraw||0)))];
  return {rules,cells:Array(16).fill(null),planet,turn:0,cur:first,first,hands,decks,placed:[0,0],onceUsed:[false,false],pen:[0,0],log:[],over:false,drawn:[false,false]};
}

function planetOps(s){ return s.planet?def(s.planet).ops:[]; }
function matchF(f,u){ const d=def(u.cid); return (!f.type||d.typeName===f.type)&&(!f.aff||d.aff===f.aff); }
function neighbors(s,c){ const out=[]; for (let d=0;d<8;d++){ const n=nbr(c,d); if(n>=0&&s.cells[n]) out.push(n); } return out; }
const effMask=u=>u.mask|u.tmp.extra;

function attackOf(s,u,cell,dir,tgt){
  const d=def(u.cid); let a=d.atk+u.perm.atk+u.tmp.atk+u.tmp.cap;
  if (isDiag(dir)) a+=u.tmp.diag;
  for (const n of neighbors(s,cell)){ const v=s.cells[n]; if(v.owner!==u.owner) continue; for (const o of hasOp(v.cid,'aura')) if(o.stat==='atk'&&matchF(o.f,u)) a+=o.amt; }
  for (const o of planetOps(s)){
    if (o.k==='pl_two_arrow_atk'&&pop(effMask(u))===2) a+=o.amt;
    if (o.k==='pl_diag_penalty'&&isDiag(dir)&&!hasOp(u.cid,'ignore_neg_planet').length) a=Math.max(0,a-o.amt);
  }
  for (const o of hasOp(u.cid,'atk_vs_higher')) if (def(tgt.cid).grd>d.grd) a+=o.amt;
  if (s.pen[u.owner]>0) a-=s.pen[u.owner];
  if (s.rules&&s.rules.lastMinus&&s.turn===15) a-=s.rules.lastMinus;
  return Math.max(0,a);
}
function guardOf(s,v,cell,att){
  const d=def(v.cid); let g=d.grd+v.perm.grd-v.tmp.grdMinus;
  for (const o of d.ops) if (o.k==='stat_guard_pos'&&POS[o.pos](cell)) g+=o.amt;
  for (const n of neighbors(s,cell)){ const w=s.cells[n]; if(w.owner!==v.owner) continue; for (const o of hasOp(w.cid,'aura')) if(o.stat==='guard'&&matchF(o.f,v)) g+=o.amt; }
  for (const o of planetOps(s)) if (o.k==='pl_guard_pos'&&POS[o.pos](cell)) g+=o.amt;
  if (s.rules&&s.rules.firstGuard&&v.owner===s.first) g+=s.rules.firstGuard;
  return Math.max(0,g);
}
const points=(v,fromDir)=>!!(effMask(v)>>opp(fromDir)&1);
function recip(s,v,fromDir,att){ if (s.rules&&s.rules.noRecip) return false; return points(v,fromDir) && !att.tmp.ignoreRecip && !v.tmp.noRecip; }

// legal moves: one per (distinct card in hand, empty cell, optional planet rotation, ability target)
function targetsFor(s,player,cid,cell,rot){
  const d=def(cid), tg=[];
  const need=d.ops.find(o=>o.k==='place_rotate'||o.k==='place_enemy_norecip'||o.k==='place_enemy_guard'||o.k==='place_add_diag');
  if (!need) return [null];
  if (need.k==='place_add_diag'){
    let m=rotMask(d.mask,rot); if (d.ops.some(o=>o.k==='place_rotate_self')) m=rot90(m);
    for (let i=1;i<8;i+=2) if(!(m>>i&1)) tg.push(i);
    return tg.length?tg:[null];
  }
  const want=need.k==='place_rotate'&&need.who==='friend'?'friend':'enemy';
  for (let dd=0;dd<8;dd++){ const n=nbr(cell,dd); if(n<0||!s.cells[n]) continue; const own=s.cells[n].owner===player; if((want==='friend')===own) tg.push(n); }
  return tg.length?tg:[null];
}
function legalMoves(s){
  if (s.over) return [];
  const p=s.cur, moves=[], seen=new Set();
  const rots=[0]; for (const o of planetOps(s)) if (o.k==='pl_once_rotate'&&!s.onceUsed[p]) rots.push(o.deg);
  for (const cid of s.hands[p]){ if(seen.has(cid)) continue; seen.add(cid);
    for (let c=0;c<16;c++) if(!s.cells[c]) for (const rot of rots) for (const t of targetsFor(s,p,cid,c,rot)) moves.push({cid,cell:c,rot,target:t}); }
  return moves;
}

function mkUnit(cid,owner){ return {cid,owner,orig:owner,mask:def(cid).mask,perm:{atk:0,grd:0},tmp:freshTmp(),flipped:false}; }

// resolve one placement turn.  returns {state, events, stats}
function applyMove(s0,mv){
  const s=JSON.parse(JSON.stringify(s0)); const p=s.cur, ev=[];
  const hi=s.hands[p].indexOf(mv.cid); if(hi<0) throw new Error('card not in hand: '+mv.cid);
  if (s.cells[mv.cell]) throw new Error('cell occupied');
  s.hands[p].splice(hi,1);
  for (const c of s.cells) if (c){ c.tmp=freshTmp(); c.flipped=false; }
  s.pen=[0,0];
  const u=mkUnit(mv.cid,p); s.cells[mv.cell]=u; const D=def(mv.cid);
  ev.push({t:'place',cell:mv.cell,player:p,cid:mv.cid});
  // planet effects at placement
  for (const o of planetOps(s)){
    if (o.k==='pl_place_atk_edge'&&isEdge(mv.cell)) u.tmp.atk+=o.amt;
    if (o.k==='pl_first_placement_guard'&&s.placed[p]===0) u.perm.grd+=o.amt;
    if (o.k==='pl_once_rotate'&&mv.rot){ if(o.deg!==mv.rot||s.onceUsed[p]) throw new Error('rotation not allowed'); u.mask=rotMask(u.mask,mv.rot); s.onceUsed[p]=true; ev.push({t:'rotate',cell:mv.cell,deg:mv.rot,why:'planet'}); }
  }
  if (mv.rot&&!planetOps(s).some(o=>o.k==='pl_once_rotate')) throw new Error('rotation not allowed');
  // the unit's own placement abilities, in printed order
  const adj=neighbors(s,mv.cell);
  for (const o of D.ops){
    switch(o.k){
      case 'place_atk': { const ok=o.if==='adjFriend'?adj.some(n=>s.cells[n].owner===p)
          :o.if==='adjEnemyShip'?adj.some(n=>s.cells[n].owner!==p&&def(s.cells[n].cid).typeName==='Ship')
          :adj.some(n=>s.cells[n].owner===p&&def(s.cells[n].cid).typeName==='Character'); if(ok) u.tmp.atk+=o.amt; break; }
      case 'place_diag_atk': u.tmp.diag+=o.amt; break;
      case 'place_ignore_recip': u.tmp.ignoreRecip=true; break;
      case 'place_rotate_self': u.mask=rot90(u.mask); ev.push({t:'rotate',cell:mv.cell,deg:90,why:'ability'}); break;
      case 'place_add_diag': if(mv.target!=null&&!(effMask(u)>>mv.target&1)&&isDiag(mv.target)) { u.tmp.extra|=1<<mv.target; ev.push({t:'extra',cell:mv.cell,dir:mv.target}); } break;
      case 'place_rotate': if(mv.target!=null){ const t=s.cells[mv.target]; if(!t||adj.indexOf(mv.target)<0||((o.who==='friend')!==(t.owner===p))) throw new Error('bad target'); t.mask=rot90(t.mask); t.tmp.extra=rot90(t.tmp.extra); ev.push({t:'rotate',cell:mv.target,deg:90,why:'ability'}); } break;
      case 'place_enemy_norecip': if(mv.target!=null){ const t=s.cells[mv.target]; if(!t||adj.indexOf(mv.target)<0||t.owner===p) throw new Error('bad target'); t.tmp.noRecip=true; } break;
      case 'place_enemy_guard': if(mv.target!=null){ const t=s.cells[mv.target]; if(!t||adj.indexOf(mv.target)<0||t.owner===p) throw new Error('bad target'); t.tmp.grdMinus+=o.amt; } break;
    }
  }
  // cascade: FIFO queue, directions N..NW, each unit changes owner at most once
  const q=(s.rules&&s.rules.lastPassive&&s.turn===15)?[]:[{cell:mv.cell,gen:0}]; let captures=0, maxGen=0; const attempts=[];
  while (q.length){
    const {cell,gen}=q.shift(), a=s.cells[cell];
    if (gen>0){ for (const o of hasOp(a.cid,'cap_rotate')){ a.mask=rot90(a.mask); a.tmp.extra=rot90(a.tmp.extra); ev.push({t:'rotate',cell,deg:90,why:'captured'}); }
      for (const o of hasOp(a.cid,'cap_atk')) a.tmp.cap+=o.amt; }
    const m=effMask(a);
    for (let d=0;d<8;d++){ if(!(m>>d&1)) continue; const n=nbr(cell,d); if(n<0) continue; const v=s.cells[n]; if(!v||v.owner===a.owner||v.flipped) continue;
      const atk=attackOf(s,a,cell,d,v), grd=guardOf(s,v,n,a)+(recip(s,v,d,a)?1:0);
      const auto=!!(s.rules&&s.rules.auto)&&!points(v,d), win=auto||atk>grd; ev.push({t:'challenge',from:cell,to:n,dir:d,atk,grd,win,auto,order:attempts.length}); attempts.push(win);
      if (s.pen[a.owner]>0) s.pen[a.owner]=0;
      if (win){ v.owner=a.owner; v.flipped=true; captures++; maxGen=Math.max(maxGen,gen+1); ev.push({t:'capture',cell:n,by:cell,gen:gen+1,to:a.owner});
        for (const o of hasOp(v.cid,'cap_next_attacker_penalty')) s.pen[a.owner]+=o.amt;
        if (!(s.rules&&s.rules.maxGen!=null&&gen+1>s.rules.maxGen)) q.push({cell:n,gen:gen+1}); }
    }
    a.tmp.cap=0;
  }
  s.pen=[0,0];
  s.placed[p]++; s.turn++;
  s.log.push({p,cid:mv.cid,cell:mv.cell,caps:captures});
  if (s.turn>=16){ s.over=true; } else {
    s.cur=1-p; const q2=s.cur; if (s.decks[q2].length) s.hands[q2].push(s.decks[q2].shift());
  }
  return {state:s,events:ev,stats:{captures,maxGen,challenges:attempts.length}};
}
function score(s){ const c=[0,0]; for (const u of s.cells) if(u) c[u.owner]++; return c; }
// final result: the board count plus the optional komi for the first player
function final(s){ const c=score(s); if (s.rules&&s.rules.komi) c[s.first]+=s.rules.komi; return c; }
function winner(s){ const c=final(s); return c[0]>c[1]?0:c[1]>c[0]?1:-1; }

// test helper: a blank state with units put directly on the board
function board({planet=null,cur=0,hands=[[],[]]}={}){ return {rules:{},cells:Array(16).fill(null),planet,turn:0,cur,first:cur,hands,decks:[[],[]],placed:[1,1],onceUsed:[false,false],pen:[0,0],log:[],over:false,drawn:[true,true]}; }
function put(s,cell,cid,owner){ s.cells[cell]=mkUnit(cid,owner); return s; }

module.exports={final,DIRS,DX,DY,opp,isDiag,rot90,rotMask,pop,nbr,loadCards,REG,def,mulberry32,shuffle,newMatch,legalMoves,applyMove,score,winner,board,put,mkUnit,attackOf,guardOf,isCorner,isEdge,isCenter};
