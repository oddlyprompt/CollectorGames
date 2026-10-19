// Engine sanity check: the 60-card prototype (pool 0.3) converted to the Version 1 format and played by the Version 1 engine,
// next to the round 3 results of the prototype engine (rules 0.3 with the rising tide from turn 12). The two engines differ
// in their computer players, so the numbers should be close, not equal. node tools/tidemark/v1/proto_check.js [games]
const {CARDS3}=require('../cards.js'); const L=require('../lib.js'); const E=require('./engine.js');
const n=+process.argv[2]||60;
const T={unit:'unit',vessel:'vessel',spell:'spell',relic:'relic',stronghold:'stronghold',domain:'domain',enchantment:'enchantment'};
function conv(c){ const fx=[]; const add=(...a)=>fx.push(a);
  for (const o of c.fx){ const [k,...a]=o;
    if (k==='tokens') add('play','tokens',a[0],a[2],a[3],a[1]); else if (k==='fortify') add('play','fortify',a[0]); else if (k==='draw'||k==='scry_draw'||k==='draw_if_both') add('play','draw',a[0]);
    else if (k==='damage'||k==='ping') add('play','dmg',a[0],'enemy unit'); else if (k==='destroy') add('play','destroy',a[0]>=99?'enemy unit':'enemy unit cost<='+a[0]);
    else if (k==='bounce') add('play','bounce',a[0]>=99?'any unit':'enemy unit cost<='+a[0]); else if (k==='pump') add('play','pump',a[0],a[1],'own unit'); else if (k==='shift') add('play','shift','enemy unit');
    else if (k==='ramp') add('play','ramp',a[0]); else if (k==='equip') add('static','equip',a[0],a[1],...(a[2]?[a[2]]:[]));
    else if (k==='rise_ping') add('rise','dmg',a[1],'enemy unit '+(a[0]==='D'?'deep':'shore')); else if (k==='rise_heal') add('rise','harbor',a[0]);
    else if (k==='rise_sweep') add('rise','sweep',a[1],'enemy '+(a[0]==='D'?'deep':'shore')); else if (k==='front_buff') add('static','lord',a[0],a[1],'any unit');
    else if (k==='home_guard') add('static','lord',0,a[0],'homeblock'); else if (k==='max_attackers') add('static','max_attack',a[0]);
    else if (k==='shore_toughness') add('static','lord',0,a[0],'own shore'); else if (k==='all_toughness') add('static','lord',0,a[0],'own unit');
    else if (k==='grant_surge') add('static','grant_static','surge','own sea'); else if (k==='broadside') add('play','dmg',a[0],'enemy unit shore');
    else if (k==='harbor_ward') add('static','ward',1); else if (k==='heal') add('play','harbor',a[0]); else if (k==='damage_each_front') add('play','dmg_multi',a[0],2,'enemy unit');
    else if (k==='sweep_front') add('play','sweep',a[0],'any unit'); else if (k==='rally') add('play','pump_all',a[0],0,'own unit'); else if (k==='raid_bonus') add('static','lord',1,0,'attacker');
    else if (k==='strand_all') add('static','strand2'); else throw new Error('no conversion for '+k); }
  const sub= c.t==='spell'? (c.kw.includes('swift')?'Swift':'') : c.t==='relic'? (fx.some(a=>a[1]==='equip')?'Equipment':'Tool') : c.t==='domain'? (c.front==='S'?'Shore':'Deep') : c.t==='enchantment'? 'Player' : '';
  return {id:c.id, n:c.n, t:T[c.t], sub, f:c.f, al:c.al, r:c.r, cost:c.cost, req:c.req, pow:c.pow, tgh:c.tgh, fort:c.fort, ferry:c.ferry||0, kw:c.kw.filter(k=>k!=='ambush'), fx, front:c.front}; }
const V=new Map(CARDS3.map(c=>[c.id,conv(c)]));
const D=L.DECKS3.map(x=>({a:x.a, d:x.d.map(c=>V.get(c.id))}));
const M=D.map(()=>D.map(()=>0.5)); let games=0, turns=0; const why={};
for (let i=0;i<D.length;i++) for (let j=i+1;j<D.length;j++){ let w=0; for (let g=0;g<n;g++){ const r=E.play(D[i].d,D[j].d,1000003*i+7919*j+g); games++; turns+=r.turns; why[r.why]=(why[r.why]||0)+1; w+= r.w===0?1 : r.w===1?0 : 0.5; } M[i][j]=w/n; M[j][i]=1-w/n; }
const old=L.runConfig({rules:'0.3',ai:2,tide:12},n);
console.log('deck                              v1 engine   prototype engine');
D.forEach((x,i)=>{ const v=(M[i].reduce((p,q)=>p+q,0)-0.5)/(D.length-1); console.log(x.a.name.padEnd(34), (v*100).toFixed(1).padStart(6)+'%', (old.decks[x.a.id]*100).toFixed(1).padStart(12)+'%'); });
console.log('turns', (turns/games).toFixed(1), 'vs', old.turnsAvg.toFixed(1), 'endings', JSON.stringify(why), 'vs', JSON.stringify(old.why));
