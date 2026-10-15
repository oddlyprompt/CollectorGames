// ===================== STARTING SCENARIOS =====================
// Each one changes the opening hand and the weekly allowance, not the world. Same simulation, different first decisions.
const SCENARIOS = [
  {id:'classic', n:'A fresh start', d:'$75 and $50 every Friday. Rip a pack, dig a dollar bin, see what grabs you.', cash:75, pay:50},
  {id:'pocket', n:'Pocket change', d:'$20 and $15 a week. Every dollar is a decision. A hard, honest start.', cash:20, pay:15},
  {id:'inherit', n:"Uncle Ray's comics", d:'You inherited a few hundred old comics and $150. Most are ordinary. You will not know which until you look.', cash:150, pay:40},
  {id:'storage', n:'The storage unit', d:'A semi-retired dealer\'s leftover stock, $1,200, and no allowance. Sell to eat.', cash:1200, pay:0},
  {id:'fan', n:'Diehard fan', d:'A shoebox of one team\'s cards from childhood, $200, and $40 a week. You already know who your guys are.', cash:200, pay:40},
  {id:'reader', n:'Pull-list reader', d:'You have read one series since issue #1, and you have every issue. $200 and $40 a week.', cash:200, pay:40},
  {id:'tcgbinder', n:'The old binder', d:'A binder of First Bond cards you actually played with since launch, four unopened packs, $100 and $40 a week.', cash:100, pay:40},
  {id:'tcgbox', n:'A box to open', d:'Two sealed boxes of First Bond and $50. Open them, or hold them and see what happens. $40 a week.', cash:50, pay:40},
  {id:'windfall', n:'Deep pockets', d:'$10,000 and no allowance. Nothing forces you. See how the market treats a whale.', cash:10000, pay:0}
];
function pickScenario(){
  return new Promise(res=>{
    let el=$('#scn'); if (el) el.remove(); el=document.createElement('div'); el.id='scn'; el.className='scn'; el.setAttribute('role','dialog'); el.setAttribute('aria-label','Choose how you start');
    el.innerHTML=`<div class="scn-in"><h1>How does your story begin?</h1><p>Every start plays the same world. What changes is what you have on day one.</p><div class="scn-list">${SCENARIOS.map(s=>`<button class="scn-card" data-act="scnpick" data-a="${s.id}"><b>${esc(s.n)}</b><span>${esc(s.d)}</span><em>${money(s.cash)} to start${s.pay? ', '+money(s.pay)+' a week' : ', no allowance'}</em></button>`).join('')}</div></div>`;
    document.body.appendChild(el); UI._scnRes=res;
  });
}
ACT.scnpick = a=>{ const el=$('#scn'); if (el) el.remove(); const r=UI._scnRes; UI._scnRes=null; if (r) r(a); };
newGame = (function(f){ return async function(seed, prog){ const g=await f(seed, prog); try { applyScenario(UI.scn||'classic'); } catch(e){ console.error(e); } UI.scn=null; return g; }; })(newGame);
function scnCard(key, how, from, note){ const d=D(key); const c=makeCard(key,0,[G.day,how,0,from]); c.h=[[G.day,note||'Came with the start',0,'']]; c.c=c.c.map(v=>Math.max(15,v-ri(0,14))); c.nw=1; c.sc=1; return c; }
function scnComic(key, how, from, note, src){ const c=cmMakeCopy(key,0,[G.day,how,0,from],src||'lot'); c.h=[[G.day,note,0,'']]; c.nw=1; c.sc=1; return c; }
function applyScenario(id){
  G._scnId=id; const sc=SCENARIOS.find(x=>x.id===id)||SCENARIOS[0]; const P_=G.player; P_.cash=sc.cash; P_.pay=sc.pay; P_.scn=sc.id; P_.scnN=sc.n;
  if (sc.id==='inherit'){ for (let i=0;i<ri(220,300);i++){ const key=randComicKey(R()<0.7?{old:1}:{}); const c=scnComic(key,'inherited','Uncle Ray','Inherited from Uncle Ray'); c.c=c.c.map(v=>Math.max(5,v-ri(0,10))); } }
  else if (sc.id==='storage'){ if (packHas('sports')) for (let i=0;i<ri(50,70);i++) scnCard(randCardKey({old:R()<0.5,hit:R()<0.1}),'found','the storage unit','Came out of the storage unit'); if (packHas('comics')) for (let i=0;i<ri(180,230);i++) scnComic(randComicKey(R()<0.5?{}:{old:1}),'found','the storage unit','Came out of the storage unit'); if (packHas('sports')) for (let i=0;i<4;i++){ const prod=pick(releasedProducts()); makeSealed(prod.id, fmtOf(prod,R()<0.5?'blaster':'hobby'), 0, [G.day,'found',0,'the storage unit']); } }
  else if (sc.id==='fan'){
    const tm=ri(0,TEAMS_DEF.length-1); const pids=new Set(G.players.filter(p=>p.tm===tm||(p.tm===-1&&p.org===tm)).map(p=>p.id)); const prods=releasedProducts().slice(-5); const keys=[];
    for (const prod of prods){ prod.cl.base.forEach((e,i)=>{ if (pids.has(e[0])) keys.push(dk(prod,'b',i,'')); }); }
    shuffleWith(keys, hsh('fan'+G.seed)).slice(0,45).forEach(k=>scnCard(k,'found','your childhood','Your team, from a shoebox'));
    P_.scnN='Diehard fan of the '+teamName(tm); const top=G.players.filter(p=>pids.has(p.id)).sort((a,b)=>playerBase(b)-playerBase(a)).slice(0,2);
    for (const p of top){ if (!P_.follow.includes(p.id)) P_.follow.push(p.id); } if (top[0]) startChase('pc', top[0].id);
  }
  else if (sc.id==='reader'){
    let pool=G.cm.ser.filter(s=>s.sts==='on' && s.n>=25 && s.n<=110 && tierOf(s)>=1); if (!pool.length) pool=G.cm.ser.filter(s=>s.sts==='on' && s.n>=12); const s=pool[Math.floor(R()*pool.length)];
    for (let n=1;n<=s.n;n++){ if (R()<0.92){ const d=cmD(mk(s.id,n,1,'')); const c=cmMakeCopy(mk(s.id,n,1,''),0,[issueDay(s,n),'bought',d.cp,'Your pull list'],'npc'); c.c=c.c.map(v=>Math.min(100,v+ri(2,10))); c.h=[[issueDay(s,n),'Bought new off the rack',d.cp,'']]; c.nw=1; c.sc=1; } }
    P_.pull=[s.id]; toggleFollow('s',s.id); startChase('run',s.id); P_.scnN='Pull-list reader of '+sTitle(s);
  }
  G.player.nw=[]; if (typeof snapNW==='function') snapNW(true);
  addNews((sc.id==='classic'?'A NEW COLLECTOR ARRIVES':'YOUR STORY STARTS: '+P_.scnN.toUpperCase()), sc.d, null, 'hobby');
}
