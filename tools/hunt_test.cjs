// Stores version 2 and the Hunt (out and about): state, invariants and edge cases on the built game, without a browser.
// Build tcg first, then: node tools/hunt_test.cjs
const {load}=require('./agents/harness.cjs');
let fails=0; const check=(ok,msg,x)=>{ console.log((ok?'PASS ':'FAIL ')+msg+(ok||x===undefined?'':' '+JSON.stringify(x))); if (!ok) fails++; };
// every copy that is "somewhere in town" is in exactly one place, and nothing is held for a lead, show or shop that no longer exists
const INVARIANT=`(()=>{ const bad=[], seen=new Set(), h=CIRCUIT.H(), tags=new Set();
  for (const p of RETAIL.profiles){ const s=G.retail.locations[p.id]; tags.add(p.id);
    for (const ref of s.singles){ const c=RETAIL.getCopy(ref.g,ref.id), k=ref.g+ref.id; if (!c||c.o!==-2||c.rs!==p.id) bad.push('shop ref '+p.id+' '+k); if (seen.has(k)) bad.push('twice '+k); seen.add(k); if (!(ref.p>0)) bad.push('no tag '+k); }
    for (const x of Object.values(s.stock)){ if (!Number.isSafeInteger(x.q)||x.q<0||x.q<x.refs.length) bad.push('stock '+p.id); }
    if (!(s.cash>=0)||!isFinite(s.cash)) bad.push('cash '+p.id); if (!(s.rep>=0&&s.rep<=180)) bad.push('rep '+p.id+' '+s.rep); }
  for (const L of h.leads){ tags.add('lead:'+L.id); for (const ref of L.refs){ const c=RETAIL.getCopy(ref.g,ref.id), k=ref.g+ref.id; if (c&&c.o===-2&&c.rs==='lead:'+L.id){ if (seen.has(k)) bad.push('twice '+k); seen.add(k); } } if (!(L.ask>=1)) bad.push('ask '+L.id); }
  if (h.show) for (const T of h.show.tables){ tags.add('show:'+T.id); for (const ref of T.refs){ const k=ref.g+ref.id; if (seen.has(k)) bad.push('twice '+k); seen.add(k); } }
  for (const a of Object.values(RETAIL.adapters)) for (const c of Object.values(a.table())){ if (c.o===-2&&c.rs!=null&&!tags.has(c.rs)) bad.push('orphan '+a.id+c.id+' '+c.rs); if (c.o===-2&&c.rs!=null&&String(c.rs).includes(':')&&G[a.ids]&&G[a.ids].includes(c.id)) bad.push('held copy still in collector pool '+c.id); }
  for (const a of Object.values(RETAIL.adapters)) for (const n of a.sets(G.day)){ const z=a.world().shop[n]; if (z&&(!(z.so>=0&&z.so<=1)||!(z.sop>=0&&z.sop<=1))) bad.push('sold-out index '+a.id+n); }
  return bad.slice(0,6); })()`;
const SIG=`JSON.stringify(CIRCUIT.H().leads.map(L=>[L.ty,L.kind||'',L.g,L.day,L.ask,L.refs.length,L.where]))`;
(async()=>{
  // ---------- determinism ----------
  const sig=async(seed,days)=>{ const g=load(); await g.run(`newGame(${seed})`); g.run(`for(let i=0;i<${days};i++)advanceDay()`); return [g.run(SIG), g.run(`JSON.stringify(Object.values(G.retail.locations).map(s=>[s.id,s.singles.length,s.singles.slice(0,5).map(r=>r.p)]))`)]; };
  const [a1,a2,b1]=[await sig(5,40),await sig(5,40),await sig(6,40)];
  check(a1[0]===a2[0]&&a1[1]===a2[1],'the same seed gives the same leads, shop cases and price tags');
  check(a1[0]!==b1[0],'a different seed gives different leads');
  check(JSON.parse(a1[0]).length>0,'leads exist within six weeks of a new game',a1[0].slice(0,200));

  const g=load(), run=g.run; await run('newGame(731)');
  check(run('G.retail.v===RETAIL.VERSION&&!!CIRCUIT.H()'),'a new world has stores version 2 and the hunt state');
  check(run(INVARIANT).length===0,'invariants hold on day one',run(INVARIANT));
  check(run('CIRCUIT.H().leads.length===0&&VIEWS.stores().length>300'),'before the first Thursday there are no leads and the page still renders');
  // ---------- price tags and shop personality ----------
  run('while(G.day<brSetDef(1).rel+20)advanceDay();G.player.cash=5000;');
  check(run(INVARIANT).length===0,'invariants hold after three releases',run(INVARIANT));
  check(run("(()=>{const s=G.retail.locations.lantern,r=s.singles[0],c=RETAIL.getCopy(r.g,r.id);const p1=RETAIL.singlePrice('lantern',r.g,c);advanceDay;return p1===RETAIL.singlePrice('lantern',r.g,c)&&p1===r.p})()"),'a price tag is a stored number, not a live formula');
  check(run("(()=>{const s=G.retail.locations.cargo;return s.singles.some(r=>r.b)&&s.singles.filter(r=>r.b).every(r=>[0.25,0.5,1,2,3,5,6,10].includes(r.p))})()"),'the Cargo Cage prices its bins by rarity');
  check(run("(()=>{const out={};for(const id of ['tidepool','lantern','cargo','glass']){const s=G.retail.locations[id];out[id]=s.singles.map(r=>r.p/RETAIL.adapters[r.g].value(RETAIL.getCopy(r.g,r.id)));}const spread=a=>{a=a.slice().sort((x,y)=>x-y);return a[Math.floor(a.length*.9)]/a[Math.floor(a.length*.1)]};globalThis.testSpread={glass:spread(out.glass),tide:spread(out.tidepool)};return spread(out.glass)<1.35&&spread(out.tidepool)>spread(out.glass)})()"),'the Glass Cabinet prices tightly, the Tidepool does not',run('testSpread'));
  check(run("(()=>{let n=0;for(const p of RETAIL.profiles){const s=G.retail.locations[p.id];for(const r of s.singles){const v=RETAIL.adapters[r.g].value(RETAIL.getCopy(r.g,r.id));if(v>=2&&r.p<=v*0.75)n++;}}globalThis.testBargains=n;return n>=1&&n<=60})()"),'there are a few real bargains in town, not none and not a flood',run('testBargains'));
  // a card sold to a shop cannot be bought back for less (no loop through one counter)
  check(run("(()=>{let worst=0;for(const id of ['tidepool','lantern','cargo','glass']){const p=RETAIL.profile(id);for(const a of Object.values(RETAIL.adapters))for(const c of Object.values(a.table()).filter(c=>c.o>0&&!c.l&&c.g===0).slice(0,400)){if(a.D(c.k).sealed||!RETAIL.accepts(p,a.id,c))continue;const off=RETAIL.offer(id,a.id,c),tag=RETAIL.tagFor(p,a.id,c).p;if(off>tag)worst=Math.max(worst,off-tag);}}globalThis.testLoop=worst;return worst===0})()"),'no shop pays more for a card than it would tag it at',run('testLoop'));
  // ---------- limits and the sold-out index ----------
  check(run("(()=>{const key='T|1|0|B';const s=G.retail.locations['super-centre'];const x=s.stock[key]||(s.stock[key]={g:'wk',n:1,f:'B',q:0,refs:[],ema:1,born:G.day,lastSale:G.day,received:0,sold:0,orders:0,clearance:false});x.q=5;G.tcg.shop[1].so=1;G.tcg.shop[1].sop=1;tfvClear(key);const lim=RETAIL.limitOf('super-centre',x);const e1=RETAIL.sealedBuy('super-centre',key,1),e2=RETAIL.sealedBuy('super-centre',key,1);globalThis.testLim=[lim,e1,e2,tcFairRaw(key),RETAIL.sealedPrice('super-centre',x)];return lim===1&&e1===null&&typeof e2==='string'&&e2.includes('Limit')&&RETAIL.sealedPrice('super-centre',x)===TC_MSRP.B})()"),'a product selling above list is limited to one box a week at a chain, which still charges list',run('testLim'));
  check(run("(()=>{G.tcg.shop[1].so=0;G.tcg.shop[1].sop=0;tfvClear('T|1|0|B');const f=tcFairRaw('T|1|0|B');return f<=TC_MSRP.B*1.16&&f*0.9<TC_MSRP.B*1.05})()"),'with full shelves a box is worth about list, so buying it to resell loses money after the fee');
  // ---------- standing ----------
  check(run("(()=>{const s=G.retail.locations.tidepool;s.rep=0;s.repWeek=null;s.repDay=null;RETAIL.visit('tidepool');const a=s.rep;RETAIL.visit('tidepool');const b=s.rep;RETAIL.credit(s,'spend',1000);const c=s.rep;RETAIL.credit(s,'spend',1000);return a===1&&b===1&&c===6&&s.rep===6})()"),'standing: one point for showing up in a week, at most five a day for spending');
  check(run("(()=>{const s=G.retail.locations.glass,p=RETAIL.profile('glass');let c=null,g=null;for(const a of Object.values(RETAIL.adapters)){c=Object.values(a.table()).find(c=>!c.l&&c.g>=0&&!a.D(c.k).sealed&&RETAIL.accepts(p,a.id,c));if(c){g=a.id;break;}}if(!c)return 'no card';s.rep=0;const o0=RETAIL.offer('glass',g,c);s.rep=50;const o1=RETAIL.offer('glass',g,c);s.rep=120;const o2=RETAIL.offer('glass',g,c);s.rep=0;return o1>o0&&o2>o1})()")===true,'a regular and a friend of the shop get better offers for their cards');
  check(run("RETAIL.standing({rep:0}).tier===0&&RETAIL.standing({rep:15}).tier===1&&RETAIL.standing({rep:45}).tier===2&&RETAIL.standing({rep:110}).tier===3"),'standing tiers at 15, 45 and 110');
  check(run("(()=>{RETAIL.credit(G.retail.locations['super-centre'],'spend',500);return !G.retail.locations['super-centre'].rep})()"),'a chain store never gets to know you');
  // ---------- yard sales ----------
  run("while(!(CIRCUIT.H().leads.some(L=>L.ty==='yard'&&L.day>G.day)))advanceDay();globalThis.testL=CIRCUIT.H().leads.find(L=>L.ty==='yard'&&L.day>G.day);");
  check(run("typeof CIRCUIT.go(testL.id)==='string'"),'a yard sale cannot be visited before its day');
  run("while(G.day<testL.day)advanceDay();G.player.cash=5000;globalThis.testBefore={cash:G.player.cash,n:CIRCUIT.liveRefs(testL).length,ids:CIRCUIT.liveRefs(testL).map(r=>r.id),left:CIRCUIT.outingsLeft()};");
  check(run("testBefore.n>=8&&testBefore.left===2"),'the box holds real cards and the day starts with two outings',run('testBefore.n'));
  check(run("typeof CIRCUIT.buyLot(testL.id)==='string'&&typeof CIRCUIT.haggle(testL.id)==='string'"),'buying or haggling needs you to go there first');
  check(run("CIRCUIT.go(testL.id)===null&&CIRCUIT.outingsLeft()===1&&CIRCUIT.go(testL.id)===null&&CIRCUIT.outingsLeft()===1"),'going there costs one outing, once');
  check(run("(()=>{const ask0=testL.ask;const r=CIRCUIT.haggle(testL.id);const ok=(r===null&&testL.ask<ask0)||(r==='no'&&testL.ask===ask0);return ok&&typeof CIRCUIT.haggle(testL.id)==='string'&&CIRCUIT.haggle(testL.id)!=='no'})()"),'one lower offer: taken or refused, never a second try');
  check(run("(()=>{const ask=testL.ask,g=testL.g;const r=CIRCUIT.buyLot(testL.id);const tab=RETAIL.adapters[g].table();return r&&r.n===testBefore.n&&Math.abs(testBefore.cash-G.player.cash-ask)<0.006&&testBefore.ids.every(id=>tab[id].o===0&&tab[id].rs===undefined&&tab[id].a[1]==='bought')&&!CIRCUIT.leadOf(testL.id)&&CIRCUIT.H().stats.yard===1&&CIRCUIT.H().log[0].ty==='yard'})()"),'buying the lot charges the ask, hands over every card and logs it');
  check(run(INVARIANT).length===0,'invariants hold after a lot purchase',run(INVARIANT));
  check(run("(()=>{G.player.cash=0;const L=CIRCUIT.H().leads.find(L=>CIRCUIT.canGo(L));if(!L){G.player.cash=5000;return true}CIRCUIT.go(L.id);const r=CIRCUIT.buyLot(L.id);G.player.cash=5000;return typeof r==='string'})()"),'no money, no lot');
  check(run("(()=>{const h=CIRCUIT.H();h.out={d:G.day,n:2};const L=h.leads.find(L=>CIRCUIT.canGo(L)&&L.went!==G.day);return !L||typeof CIRCUIT.go(L.id)==='string'})()"),'a third outing in a day is refused');
  // ---------- an unsold yard sale and collection leave nothing behind ----------
  run("globalThis.testHeld=()=>Object.values(RETAIL.adapters).reduce((n,a)=>n+Object.values(a.table()).filter(c=>c.o===-2&&String(c.rs).startsWith('lead:')).length,0);for(let i=0;i<10;i++)advanceDay();");
  run("globalThis.testC=null;for(let i=0;i<200&&!testC;i++){advanceDay();testC=CIRCUIT.H().leads.find(L=>L.ty==='coll');}");
  check(run("!!testC&&testC.refs.length>=25&&testC.ask>=10"),'a private collection turns up within the year',run("testC&&[testC.refs.length,testC.ask]"));
  check(run("(()=>{const w=CIRCUIT.leadWorth(testC);globalThis.testCR=w/testC.ask;return testCR>0.95&&testCR<1.8})()"),'its asking price is the seller’s rough idea of the worth (60 to 95%)',run('testCR'));
  run("globalThis.testCIds=testC.refs.map(r=>[r.g,r.id]);globalThis.testLogN=(G.retail.log||[]).length;while(CIRCUIT.leadOf(testC.id))advanceDay();");
  check(run("testCIds.every(([g,id])=>{const c=RETAIL.getCopy(g,id);return !c||c.o>0||(c.o===-2&&RETAIL.profile(c.rs))||c.o===0})"),'an unsold collection goes to a shop case or back to collectors; nothing stays held');
  check(run("(G.retail.log||[]).some(x=>x[1]==='collection')"),'the shop that bought the collection is on record');
  check(run(INVARIANT).length===0,'invariants hold after leads expire',run(INVARIANT));
  // ---------- card show ----------
  run("while(CIRCUIT.showDay(G.day)!==G.day)advanceDay();G.player.cash=5000;globalThis.testS=CIRCUIT.H().show;");
  check(run("!!testS&&testS.day===G.day&&testS.tables.length>=3&&testS.tables.every(T=>T.refs.length>0)&&dowOf(G.day)===6"),'on show Saturday the dealers have set up',run("testS&&testS.tables.map(T=>T.id+':'+T.refs.length)"));
  check(run("typeof CIRCUIT.showBuy(testS.tables[0].id,testS.tables[0].refs[0].g,testS.tables[0].refs[0].id,false)==='string'"),'nothing can be bought from outside the hall');
  check(run("(()=>{const c0=G.player.cash;const e=CIRCUIT.enterShow();return e===null&&Math.abs(c0-G.player.cash-5)<0.006&&CIRCUIT.outingsLeft()===0&&CIRCUIT.enterShow()===null&&Math.abs(c0-G.player.cash-5)<0.006&&CIRCUIT.H().stats.show===1})()"),'entry costs $5 once and takes the day');
  check(run("(()=>{const T=testS.tables.find(T=>T.id!=='bulk'),ref=T.refs[0],c0=G.player.cash,p=ref.p;const e=CIRCUIT.showBuy(T.id,ref.g,ref.id,false);const c=RETAIL.getCopy(ref.g,ref.id);return e===null&&c.o===0&&Math.abs(c0-G.player.cash-p)<0.006&&!T.refs.includes(ref)})()"),'buying from a dealer charges the tag and hands over that copy');
  check(run("(()=>{const T=testS.tables.find(T=>T.id!=='bulk'&&T.refs.length>2);let took=0,no=0;for(const ref of T.refs.slice(0,8)){const p=ref.p,c0=G.player.cash;const e=CIRCUIT.showBuy(T.id,ref.g,ref.id,true);if(e===null){took++;if(Math.abs(c0-G.player.cash-Math.round(p*90)/100)>0.011)return 'price';}else if(e==='no'){no++;if(CIRCUIT.showBuy(T.id,ref.g,ref.id,true)==='no')return 'second try';}}globalThis.testOff=[took,no];return took+no>0})()")===true,'an offer of 10% less is taken or makes the price firm',run('testOff'));
  check(run("typeof CIRCUIT.showBuy('bulk',testS.tables.find(T=>T.id==='bulk').refs[0].g,testS.tables.find(T=>T.id==='bulk').refs[0].id,true)==='string'"),'the bulk table does not haggle');
  check(run(INVARIANT).length===0,'invariants hold during a show',run(INVARIANT));
  run("globalThis.testShowIds=testS.tables.flatMap(T=>T.refs.map(r=>[r.g,r.id]));advanceDay();");
  check(run("!CIRCUIT.H().show&&testShowIds.every(([g,id])=>{const c=RETAIL.getCopy(g,id);return !c||c.o>0})"),'the day after, the dealers have gone home with their unsold cards');
  // ---------- tips, goals, Home ----------
  run("for(const id of ['tidepool','lantern','cargo','glass','corner'])G.retail.locations[id].rep=50;while(dowOf(G.day)!==4)advanceDay();advanceDay();");
  check(run("CIRCUIT.H().tips.every(x=>RETAIL.profile(x.from)&&RETAIL.profile(x.at)&&x.from!==x.at)"),'tips name a real shop and a real card',run('CIRCUIT.H().tips.length'));
  check(run("(()=>{const h=CIRCUIT.H();return h.goals.regular&&h.goals.familiar&&h.goals.yard&&h.goals.show&&!h.goals.friend})()"),'goals are marked as they are reached');
  check(run("Array.isArray(CIRCUIT.needs())&&CIRCUIT.needs().every(x=>x.length===5)"),'Home rows are well formed');
  for (const tab of ['shops','out']) check(run(`UI.retailLocation=null;UI.retailOnline=null;UI.huntLead=null;UI.huntShow=false;UI.retailTab='${tab}';VIEWS.stores().length>400`),'Stores renders: '+tab);
  check(run("UI.retailTab='shops';tcShopV().includes('around town')&&xtShopV().includes('around town')&&brShopV().includes('around town')"),'each game tab shows where that game is on a shelf');
  // ---------- saves ----------
  run("globalThis.testSnap=JSON.stringify(G,saveReplacer);globalThis.testHunt=JSON.stringify(G.retail.hunt);G=JSON.parse(testSnap);migrate();RETAIL.ensure();");
  check(run("testHunt===JSON.stringify(G.retail.hunt)"),'the hunt state survives save and load unchanged');
  check(run(INVARIANT).length===0,'invariants hold after save and load',run(INVARIANT));
  // a version 1 world (pull request 39): tags, standing and the hunt are added, stock and cash kept
  run("globalThis.testV1={cash:G.player.cash,mine:myTc().length+myXt().length+myBr().length,stock:JSON.stringify(Object.values(G.retail.locations).map(s=>Object.values(s.stock).map(x=>x.q)))};G.retail.v=1;delete G.retail.hunt;for(const s of Object.values(G.retail.locations)){delete s.rep;delete s.lim;for(const r of s.singles){delete r.p;delete r.b;delete r.d;delete r.n;}}RETAIL.ensure();");
  check(run("G.retail.v===RETAIL.VERSION&&Object.values(G.retail.locations).every(s=>s.rep===0&&s.singles.every(r=>r.p>0))&&testV1.cash===G.player.cash&&testV1.mine===myTc().length+myXt().length+myBr().length&&testV1.stock===JSON.stringify(Object.values(G.retail.locations).map(s=>Object.values(s.stock).map(x=>x.q)))"),'a version 1 store world is upgraded in place; nothing the player owns changes');
  check(run("!!CIRCUIT.H()&&CIRCUIT.H().leads.length===0&&testHeld()===0"),'the upgraded world gets an empty hunt state, and cards held for leads it no longer knows go back to collectors');
  // ---------- a long run ----------
  run("for(let i=0;i<400;i++){advanceDay();if(i%50===0){const b="+INVARIANT+";if(b.length)globalThis.testLong=(globalThis.testLong||[]).concat(b);}}");
  check(run("!globalThis.testLong"),'invariants hold through 400 more days',run('globalThis.testLong'));
  check(g.errors.length===0,'no errors logged by the game',g.errors.slice(0,3));
  console.log('RESULT', fails? 'FAIL '+fails : 'ALL PASS'); process.exit(fails?1:0);
})();
