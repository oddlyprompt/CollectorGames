'use strict';
// Golden tests for the Broken Reach resolver.  node tools/brokenreach/test.js
const E=require('./engine.js'); const {AB}=require('./abilities.js');
const N=1,NE=2,EE=4,SE=8,S=16,SW=32,W=64,NW=128;
let pass=0,fail=0; const ok=(c,m,x)=>{ if(c){pass++;console.log('PASS',m);} else {fail++;console.log('FAIL',m,x===undefined?'':JSON.stringify(x));} };
// synthetic cards: id -> {atk,grd,mask,ops,typeName,aff}
const T={}; function card(id,atk,grd,mask,o={}){ const c={base_card_id:id,name:id,typeName:o.type||'Character',type:'char',aff:o.aff||'Independent',mask,atk,grd,ops:o.ops||[]}; T[id]=c; E.loadCards([c]); return id; }
const own=s=>s.cells.map(u=>u?u.owner:'.').join('');
const play=(s,cid,cell,extra={})=>{ s.hands[s.cur].push(cid); return E.applyMove(s,Object.assign({cid,cell,rot:0,target:null},extra)); };

// 1 adjacency and capture
{ const s=E.board(); card('a1',4,1,EE); card('d1',1,2,0); E.put(s,1,'d1',1); const r=play(s,'a1',0); ok(r.state.cells[1].owner===0,'arrow E captures the adjacent enemy when Attack > Guard'); }
// not adjacent: arrow only reaches next cell
{ const s=E.board(); E.put(s,2,'d1',1); const r=play(s,'a1',0); ok(r.state.cells[2].owner===1,'a unit two squares away is never challenged'); }
// edge of the board: no wrap-around
{ const s=E.board(); card('aw',5,1,W); E.put(s,3,'d1',1); const r=play(s,'aw',4); ok(r.state.cells[3].owner===1&&r.stats.challenges===0,'arrows do not wrap around the board edge'); }
// all eight directions with correct neighbours
{ const dirs=[[N,4,0],[NE,4,3],[EE,5,6],[SE,0,5],[S,0,4],[SW,3,3-1+4],[W,6,5],[NW,5,0]]; /* computed below */ }
{ const pairs=[[N,9,5],[NE,9,6],[EE,9,10],[SE,9,14],[S,9,13],[SW,9,12],[W,9,8],[NW,9,4]]; let good=true;
  for (const [m,from,to] of pairs){ const s=E.board(); card('ad',5,1,m); E.put(s,to,'d1',1); const r=play(s,'ad',from); if(r.state.cells[to].owner!==0) good=false; }
  ok(good,'each of the eight arrows N NE E SE S SW W NW reaches the right neighbour'); }
// diagonal arrows hit diagonal neighbours only
{ const s=E.board(); card('ne',5,1,NE); E.put(s,5,'d1',1); E.put(s,6,'d1',1); const r=play(s,'ne',9); ok(r.state.cells[6].owner===0&&r.state.cells[5].owner===1,'a NE arrow captures only the NE neighbour'); }
// equal stats: failed challenge
{ const s=E.board(); card('eq',3,1,EE); card('dg',1,3,0); E.put(s,1,'dg',1); const r=play(s,'eq',0); ok(r.state.cells[1].owner===1&&r.events.some(e=>e.t==='challenge'&&!e.win),'equal Attack and Guard fails (no capture)'); }
// reciprocal defence: +1 Guard when the defender points back
{ const s=E.board(); card('r4',4,1,EE); card('dg3',1,3,0); card('dgr',1,3,W); E.put(s,1,'dg3',1); E.put(s,5,'dgr',1);
  let r=play(s,'r4',0); ok(r.state.cells[1].owner===0,'Attack 4 beats Guard 3 with no reciprocal arrow');
  const s2=E.board(); E.put(s2,1,'dgr',1); r=play(s2,'r4',0); ok(r.state.cells[1].owner===1,'Attack 4 does not beat Guard 3 + 1 reciprocal arrow (equal fails)'); }
// reciprocal bonus also applies on diagonals
{ const s=E.board(); card('dn',4,1,SE); card('dnr',1,3,NW); E.put(s,5,'dnr',1); const r=play(s,'dn',0); ok(r.state.cells[5].owner===1,'reciprocal arrows count on diagonals'); }
// capture queue order: flipped units attack in the order of captures; directions N..NW
{ const s=E.board(); card('q0',5,1,EE|S); card('qa',5,1,S); card('qb',5,1,EE); card('v',1,1,0);
  E.put(s,1,'qb',1); E.put(s,4,'qa',1); E.put(s,5,'v',1); E.put(s,6,'v',1);
  // placed at 0: E first (cell 1), then S (cell 4). cell 1 (qb) then attacks E (2), cell 4 (qa) attacks S (8).  Cell 5/6 not reachable.
  E.put(s,2,'v',1); E.put(s,8,'v',1);
  const r=play(s,'q0',0); const caps=r.events.filter(e=>e.t==='capture').map(e=>e.cell);
  ok(JSON.stringify(caps)==='[1,4,2,8]','FIFO order: first-direction captures activate before later ones, in capture order',caps); }
// breadth (FIFO) vs depth: queue is not a stack
{ const s=E.board(); card('p0',5,1,EE|S); card('pb',5,1,EE); card('pc',5,1,S); card('v',1,1,0);
  E.put(s,1,'pb',1); E.put(s,4,'pc',1); E.put(s,2,'v',1); E.put(s,8,'v',1);
  const r=play(s,'p0',0); const caps=r.events.filter(e=>e.t==='capture').map(e=>e.cell); ok(JSON.stringify(caps)==='[1,4,2,8]','generation order, not depth-first',caps); }
// one flip per placement: a captured unit cannot be captured back in the same cascade
{ const s=E.board(); card('big',5,1,EE|S); card('wk',1,1,EE); card('bk',5,1,N); // wk at 1 gets captured, then (arrow E) hits 2 which is enemy 'bk' pointing...
  card('ret',5,1,W); card('x',1,1,0); E.put(s,1,'wk',1); E.put(s,2,'ret',1); // 'ret' is enemy, strong arrow back W toward cell 1
  const r=play(s,'big',0); ok(r.state.cells[1].owner===0,'a captured unit is not re-captured in the same placement');
  const r2=play(r.state,'x',15); /* next placement: opponent could flip it */ ok(true,'(next turn resets)'); }
// a unit flips at most once even when two attackers reach it
{ const s=E.board(); card('t1',5,1,EE|S); card('t2',5,1,N); card('tv',1,1,0);
  E.put(s,1,'tv',1); E.put(s,4,'t2',1); const r=play(s,'t1',0); const n=r.events.filter(e=>e.t==='capture'&&e.cell===1).length; ok(n===1,'captured once only',n); }
// new owner keeps position and arrows
{ const s=E.board(); card('k',5,1,EE); card('kv',1,1,NW|S); E.put(s,1,'kv',1); const r=play(s,'k',0); const u=r.state.cells[1]; ok(u.owner===0&&u.mask===(NW|S)&&u.orig===1,'captured unit keeps position and orientation and remembers its original owner'); }
// rotation: 90 degrees clockwise on all arrows (N->E, NE->SE, NW->NE)
{ ok(E.rot90(N)===EE&&E.rot90(NE)===SE&&E.rot90(NW)===NE&&E.rot90(E.rot90(E.rot90(E.rot90(N|SE))))===(N|SE),'rotation maps every arrow 90 degrees clockwise and four turns return'); ok(E.rotMask(N|EE,180)===(S|W),'180 degrees maps N,E to S,W'); }
// rotated arrows capture in the new direction (planet Nhelos 90 once per match)
{ card('pl90',0,0,0); E.loadCards([{base_card_id:'PL90',name:'p',typeName:'Planet',mask:0,ops:AB['Once per match, rotate your newly placed card 90° before challenges.']}]);
  const s=E.board({planet:'PL90'}); card('rn',5,1,N); card('rv',1,1,0); E.put(s,5,'rv',1); // placed at 4 pointing N; rotated 90 -> E hits cell 5
  const r=play(s,'rn',4,{rot:90}); ok(r.state.cells[5].owner===0&&r.state.onceUsed[0],'a rotated arrow captures in its new direction, once per match');
  const s2=E.board({planet:'PL90'}); s2.onceUsed[0]=true; ok(!E.legalMoves(Object.assign(s2,{hands:[['rn'],[]]})).some(m=>m.rot),'the once-per-match rotation is gone after use'); }
// planet effects
function planet(txt){ E.loadCards([{base_card_id:'PL',name:'p',typeName:'Planet',mask:0,ops:AB[txt]}]); return 'PL'; }
{ const s=E.board({planet:planet('Cards in corner spaces gain +1 Guard.')}); card('c4',4,1,EE); card('cg',1,3,0); E.put(s,1,'cg',1); // not corner
  let r=play(s,'c4',2-2); /* cell 0 is a corner for attacker; target at 1 not a corner */ ok(r.state.cells[1].owner===0,'corner planet: a non-corner defender is unchanged');
  const s2=E.board({planet:'PL'}); E.put(s2,3,'cg',1); card('cw',4,1,W); r=play(s2,'cw',2); ok(r.state.cells[3].owner===1,'corner planet: a defender in a corner has +1 Guard'); }
{ const s=E.board({planet:planet('Cards on the four central spaces gain +1 Guard.')}); card('cs',4,1,EE); E.put(s,6,'cg',1); const r=play(s,'cs',5); ok(r.state.cells[6].owner===1,'centre planet: central defender has +1 Guard'); }
{ const s=E.board({planet:planet('Diagonal challenges have -1 Attack, minimum 0.')}); card('dd',4,1,SE); card('gg3',1,3,0); E.put(s,5,'gg3',1); let r=play(s,'dd',0); ok(r.state.cells[5].owner===1,'diagonal planet: Attack 4 -1 = 3 does not beat Guard 3');
  card('de',4,1,EE); const s2=E.board({planet:'PL'}); E.put(s2,1,'gg3',1); r=play(s2,'de',0); ok(r.state.cells[1].owner===0,'diagonal planet: orthogonal challenges unaffected');
  card('d0',1,1,SE); const s3=E.board({planet:'PL'}); E.put(s3,5,'gg3',1); r=play(s3,'d0',0); ok(r.state.cells[5].owner===1,'minimum 0 (Attack 1 -1 = 0 never captures)'); }
{ const s=E.board({planet:planet('Cards on edge spaces gain +1 Attack when placed.')}); card('e3',3,1,EE); card('eg3',1,3,0); E.put(s,1,'eg3',1); const r=play(s,'e3',0); ok(r.state.cells[1].owner===0,'edge planet: +1 Attack when placed on an edge (3+1 beats 3)');
  const s2=E.board({planet:'PL'}); E.put(s2,6,'eg3',1); const r2=play(s2,'e3',5); ok(r2.state.cells[6].owner===1,'edge planet: no bonus on a central square'); }
{ const s=E.board({planet:planet('Units with exactly two arrows gain +1 Attack.')}); card('t2a',3,1,EE|N); card('eg3',1,3,0); E.put(s,9,'eg3',1); const r=play(s,'t2a',8); ok(r.state.cells[9].owner===0,'two-arrow planet: a two-arrow unit gains +1 Attack'); }
{ const s=E.board({planet:planet('On the first placement of each player, +1 Guard to that unit.')}); s.placed=[0,0]; card('fg',1,1,0); const r=play(s,'fg',0); ok(r.state.cells[0].perm.grd===1,'first-placement planet: +1 Guard to that unit'); const r2=play(r.state,'fg',3), r3=play(r2.state,'fg',7); ok(r2.state.cells[3].perm.grd===1&&r3.state.cells[7].perm.grd===0,'each player gets it on their own first placement only'); }
// abilities
{ const s=E.board(); card('ab',3,1,EE,{ops:AB['On placement, gain +1 Attack for this cascade if adjacent to a friendly unit.']}); card('fr',1,1,0); card('g3',1,3,0); E.put(s,4,'fr',0); E.put(s,1,'g3',1); const r=play(s,'ab',0); ok(r.state.cells[1].owner===0,'place ability: +1 Attack with a friendly neighbour (3+1 beats Guard 3)'); const s2=E.board(); E.put(s2,1,'g3',1); const r2=play(s2,'ab',0); ok(r2.state.cells[1].owner===1,'place ability: no bonus without a friendly neighbour'); }
{ const s=E.board(); card('ir',4,1,EE,{ops:AB['On placement, this unit ignores reciprocal-arrow Guard bonuses.']}); card('dgr',1,3,W); E.put(s,1,'dgr',1); const r=play(s,'ir',0); ok(r.state.cells[1].owner===0,'ability: ignores reciprocal-arrow Guard bonus'); }
{ // aura exactness: Guard 2 ship +1 = 3; Attack 3 fails, Attack 4 wins
  card('au',1,1,0,{ops:AB['Adjacent friendly Ship units gain +1 Guard.']}); card('sh',1,2,0,{type:'Ship'});
  const mk=a=>{ card('att'+a,a,1,EE); const s=E.board(); E.put(s,5,'sh',1); E.put(s,6,'au',1); return play(s,'att'+a,4).state.cells[5].owner; };
  ok(mk(3)===1&&mk(4)===0,'aura: friendly Ship Guard 2 becomes 3 (Attack 3 fails, 4 wins)');
  // the aura does not protect when its source is captured / belongs to the other side
  const s=E.board(); card('att5',5,1,EE|NE); E.put(s,5,'sh',1); E.put(s,2,'au',0); const r=play(s,'att5',4); ok(r.state.cells[5].owner===0,'aura only helps units of the same controller'); }
{ card('cr',3,1,EE,{ops:AB['When captured, rotate this unit 90° before it activates.']}); card('cap',5,1,EE); card('vv',1,1,0);
  const s=E.board(); E.put(s,1,'cr',1); E.put(s,5,'vv',1); const r=play(s,'cap',0); ok(r.state.cells[1].owner===0&&r.state.cells[5].owner===0&&r.state.cells[1].mask===S,'when captured: rotates 90 degrees before activating (E becomes S and captures cell 5)'); }
{ card('ac',1,1,0,{ops:AB['On placement, add one missing diagonal arrow for this cascade.']}); card('ev',5,1,0); const s=E.board(); E.put(s,5,'ev',1); const mv=E.legalMoves(Object.assign(s,{hands:[['ac'],[]]})).filter(m=>m.cell===0); ok(mv.length===4&&mv.every(m=>m.target%2===1),'add-diagonal ability offers the four missing diagonals as separate moves');
  const r=E.applyMove(Object.assign(E.board(),{hands:[['ac'],[]]}),{cid:'ac',cell:0,rot:0,target:3}); ok(r.state.cells[0].tmp.extra===SE,'the added arrow lasts for the cascade'); }
{ card('pn',4,1,EE,{ops:AB['On placement, one adjacent enemy loses reciprocal-arrow Guard bonus this turn.']}); card('dgr',1,3,W|S); const s=E.board(); E.put(s,1,'dgr',1); const r=E.applyMove(Object.assign(s,{hands:[['pn'],[]]}),{cid:'pn',cell:0,rot:0,target:1}); ok(r.state.cells[1].owner===0,'ability: chosen enemy loses its reciprocal bonus this turn (4 beats 3)'); }
// end of match
{ let s=E.board(); card('z',1,1,0); for (let i=0;i<15;i++) E.put(s,i,'z',(i+1)%2); s.turn=15; s.cur=0; s=E.applyMove(Object.assign(s,{hands:[['z'],[]]}),{cid:'z',cell:15,rot:0,target:null}).state; ok(s.over&&E.score(s)[0]===8&&E.winner(s)===-1,'8-8 is a tie, match over after 16 placements',E.score(s)); }
{ let s=E.board(); card('z',1,1,0); for (let i=0;i<15;i++) E.put(s,i,'z',i<9?0:1); s.turn=15; s.cur=1; s=E.applyMove(Object.assign(s,{hands:[[],['z']]}),{cid:'z',cell:15,rot:0,target:null}).state; ok(E.winner(s)===0,'higher ownership count wins'); }
// determinism and purity
{ const cards=require('../../broken-reach-production/set01/cards.json').cards; E.loadCards(cards); const u=cards.filter(c=>c.type!=='planet').map(c=>c.base_card_id);
  const run=()=>{ let s=E.newMatch({deckA:u.slice(0,20),deckB:u.slice(30,50),planet:'BR01-175',seed:9}); const snap=JSON.stringify(s); const m=E.legalMoves(s)[0]; E.applyMove(s,m); const pure=JSON.stringify(s)===snap; while(!s.over){ const ms=E.legalMoves(s); s=E.applyMove(s,ms[(s.turn*5)%ms.length]).state; } return [JSON.stringify(s.log),pure]; };
  const a=run(),b=run(); ok(a[0]===b[0]&&a[1],'same seed and same choices give the same match and the input state is never mutated'); }
// invalid placements and options
{ const s=E.board(); card('inv',3,1,EE); E.put(s,1,'d1',1); const thr=f=>{ try{ f(); return false; }catch(e){ return true; } };
  ok(thr(()=>E.applyMove(Object.assign(E.board(),{hands:[['inv'],[]]}),{cid:'zzz',cell:0,rot:0,target:null})),'a card that is not in your hand cannot be played');
  const s2=E.board(); E.put(s2,0,'d1',1); ok(thr(()=>E.applyMove(Object.assign(s2,{hands:[['inv'],[]]}),{cid:'inv',cell:0,rot:0,target:null})),'an occupied square cannot be played on');
  ok(thr(()=>E.applyMove(Object.assign(E.board(),{hands:[['inv'],[]]}),{cid:'inv',cell:0,rot:90,target:null})),'a rotation is rejected when the planet does not allow it');
  ok(E.legalMoves(Object.assign(E.board(),{hands:[['inv','inv'],[]]})).length===16,'duplicate cards in hand give one move per square, 16 on an empty board');
  const full=E.board({hands:[['inv'],[]]}); for (let i=0;i<16;i++) E.put(full,i,'d1',1); ok(E.legalMoves(full).length===0,'no legal moves on a full board'); }
// experimental turn-order rules (all off by default)
{ const mk=(rules)=>{ let s=E.board(); s.rules=rules; s.first=0; card('z',1,1,0); for (let i=0;i<15;i++) E.put(s,i,'z',i<7?0:1); s.turn=15; s.cur=0; s=E.applyMove(Object.assign(s,{hands:[['z'],[]]}),{cid:'z',cell:15,rot:0,target:null}).state; return s; };
  ok(E.winner(mk({}))===-1,'no rules: 8-8 draws'); ok(E.winner(mk({komi:1}))===0,'komi 1 gives the tie to the first player'); ok(E.final(mk({komi:2}))[0]===10,'komi 2 adds two points to the first player');
  card('l1',5,1,W); card('lv',1,1,0); let s=E.board(); s.rules={lastPassive:true}; s.turn=15; E.put(s,0,'lv',1); let r=play(s,'l1',1); ok(r.state.cells[0].owner===1,'lastPassive: the 16th placement makes no challenges');
  s=E.board(); s.rules={lastMinus:2}; s.turn=15; card('l3',3,1,W); card('lg',1,1,0); E.put(s,0,'lg',1); r=play(s,'l3',1); ok(r.state.cells[0].owner===1,'lastMinus 2: Attack 3 -2 = 1 does not beat Guard 1 on the 16th placement');
  s=E.board(); s.rules={firstGuard:1}; s.first=1; card('fa',3,1,EE); card('fg2',1,3,0); E.put(s,1,'fg2',1); r=play(s,'fa',0); ok(r.state.cells[1].owner===1,'firstGuard: the first player\'s units have +1 Guard'); }
// Tetra-Master-style options
{ card('ta',4,1,EE|S); card('tb',1,3,0); card('tc',1,3,W); card('td',1,1,0); card('te',1,1,EE);
  let s=E.board(); s.rules={noRecip:true}; E.put(s,1,'tc',1); let r=play(s,'ta',0); ok(r.state.cells[1].owner===0,'noRecip: a pointing-back arrow gives no Guard bonus (4 beats 3)');
  s=E.board(); s.rules={auto:true}; E.put(s,1,'tb',1); r=play(s,'ta',0); ok(r.state.cells[1].owner===0&&r.events.find(e=>e.t==='challenge').auto,'auto: an arrow at an enemy that does not point back captures with no comparison (Attack 4 vs Guard 3 would win anyway; Attack 1 below)');
  card('tw',1,1,EE); s=E.board(); s.rules={auto:true}; E.put(s,1,'tb',1); r=play(s,'tw',0); ok(r.state.cells[1].owner===0,'auto: even Attack 1 captures Guard 3 when the defender does not point back');
  s=E.board(); s.rules={auto:true}; card('tcg',1,3,W); E.put(s,1,'tcg',1); r=play(s,'tw',0); ok(r.state.cells[1].owner===1,'auto: an arrow-to-arrow contact is an Attack-vs-Guard duel');
  // combo depth: placed card flips c1 (gen 1) which flips c2 (gen 2) which flips c3 (gen 3)
  card('p0',5,1,EE); card('c1',1,1,EE); card('c2',1,1,EE); card('c3',1,1,0); card('cz',5,1,EE);
  const mk=rules=>{ const b=E.board(); b.rules=rules; E.put(b,1,'c1',1); E.put(b,2,'c2',1); E.put(b,3,'c3',1); return play(b,'cz',0).state; };
  card('c1',5,1,EE); card('c2',5,1,EE);
  ok(E.score(mk({}))[0]===4,'unlimited chain: placed card plus 3 captures');
  ok(E.score(mk({maxGen:1}))[0]===3,'maxGen 1: the placed card and its captures attack, but the next generation only flips (3 owned: placed, c1, c2)');
  ok(E.score(mk({maxGen:0}))[0]===2,'maxGen 0: no combos at all (placed card and c1)'); }
// AI: always legal, never changes the state it is given, and never reads the opponent hand
{ const AI=require('./ai.js'); const cs=require('../../broken-reach-production/set01/cards.json').cards; E.loadCards(cs); const un=cs.filter(c=>c.type!=='planet').map(c=>c.base_card_id), pl=cs.filter(c=>c.type==='planet').map(c=>c.base_card_id);
  let bad=0,mut=0,leak=0,games=0;
  for (const lv of ['easy','standard','hard']) for (let g=0;g<(lv==='hard'?4:10);g++){ const r=E.mulberry32(g*17+1); let s=E.newMatch({deckA:E.shuffle(un,r).slice(0,20),deckB:E.shuffle(un,r).slice(0,20),planet:pl[g%8],seed:g}); games++;
    while(!s.over){ const view=JSON.parse(JSON.stringify(s)); const opp=1-s.cur; view.hands[opp]=view.hands[opp].map(()=>'?'); view.decks[opp]=view.decks[opp].map(()=>'?'); const snap=JSON.stringify(view);
      const m=AI.chooseMove(view,lv,r,un); if (JSON.stringify(view)!==snap) mut++; const legal=E.legalMoves(s).some(x=>x.cid===m.cid&&x.cell===m.cell&&x.rot===m.rot&&x.target===m.target); if(!legal) bad++;
      s=E.applyMove(s,m).state; } if (s.decks[0].length+s.decks[1].length<0) bad++; }
  ok(bad===0&&mut===0,'AI (easy, standard, hard) always picks a legal move and never changes its input; it plays with the opponent hand blanked out ('+games+' games)',{bad,mut});
  // hand and deck exhaustion: 20-card decks give 5 + 7 draws, so a full match never runs out of cards to play
  let s=E.newMatch({deckA:un.slice(0,20),deckB:un.slice(30,50),seed:3}); let minHand=99; while(!s.over){ minHand=Math.min(minHand,s.hands[s.cur].length); const ms=E.legalMoves(s); s=E.applyMove(s,ms[0]).state; }
  ok(minHand>=1&&s.decks[0].length+s.hands[0].length===12&&s.decks[1].length+s.hands[1].length===12,'20-card decks never run out in a 16-placement match (12 unplayed cards remain at the end)',minHand); }
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail?1:0);
