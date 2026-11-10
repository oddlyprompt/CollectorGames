// Full built-game state tests. No browser/DOM layout is simulated here.
// Build tcg first, then: node tools/retail_test.cjs
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const code=fs.readFileSync('dist/tcg/game.js','utf8').replace(/shellBoot\(\);\s*$/,'');
const errors=[];
const document={addEventListener(){},documentElement:{dataset:{}},getElementById(){return null},querySelector(){return null},querySelectorAll(){return []},body:{style:{},classList:{add(){},remove(){}}}};
const ctx={console:{...console,error(...x){errors.push(x.map(e=>e.stack||String(e)).join(' '));}},document,navigator:{},setTimeout,clearTimeout,performance,Blob,TextEncoder,TextDecoder,CompressionStream,DecompressionStream,URL,addEventListener(){},scrollTo(){},localStorage:{getItem(){return null},setItem(){}}};
ctx.window=ctx;vm.createContext(ctx);vm.runInContext(code,ctx);
const run=s=>vm.runInContext(s,ctx);
run('showToast=()=>{};toast=()=>{};celebrate=()=>{};'); // DOM notifications belong to browser tests.
const check=(ok,msg)=>{assert.ok(ok,msg);console.log('PASS '+msg);};
(async()=>{
  await run('newGame(731)');
  check(run("RETAIL.profiles.filter(p=>p.kind==='local').length===5&&RETAIL.profiles.filter(p=>p.kind==='big').length===7"),'five shared LCS and seven big-box locations');
  run('while(G.day<brSetDef(1).rel+10)advanceDay();G.player.cash=100000;');
  check(run("RETAIL.profiles.every(p=>p.kind!=='big'||!G.retail.locations[p.id].singles.length)"),'big-box locations never stock singles');
  check(run("!G.retail.locations.corner.singles.length"),'sealed-only LCS has no singles');
  check(run("['wk','xt','br'].every(g=>Object.values(G.retail.locations['super-centre'].stock).some(x=>x.g===g&&x.q>0))"),'one physical location carries all three games');
  check(run("G.retail.locations.cargo.singles.length>G.retail.locations.glass.singles.length"),'budget case is larger than the selective premium case');
  check(run("G.retail.locations.glass.singles.every(r=>RETAIL.accepts(RETAIL.profile('glass'),r.g,RETAIL.adapters[r.g].table()[r.id]))"),'premium case contains only qualifying raw cards or slabs');
  for(const g of ['wk','xt','br']){
    run(`globalThis.testG='${g}';globalThis.testA=RETAIL.adapters[testG];globalThis.testS=G.retail.locations['super-centre'];globalThis.testX=Object.entries(testS.stock).find(([k,x])=>x.g===testG&&x.f==='P'&&x.q>0);globalThis.testKey=testX[0];globalThis.testBefore={cash:G.player.cash,q:testX[1].q,n:Object.values(testA.table()).filter(c=>c.o===0).length,price:RETAIL.sealedPrice(testS.id,testX[1])};`);
    check(run("RETAIL.sealedBuy(testS.id,testKey,1)===null&&Math.abs(testBefore.cash-G.player.cash-testBefore.price)<.006&&testX[1].q===testBefore.q-1&&Object.values(testA.table()).filter(c=>c.o===0).length===testBefore.n+1"),g+': sealed purchase charges exact price and consumes one unit');
    check(run("[-1,0,1.5,101,NaN].every(q=>RETAIL.sealedBuy(testS.id,testKey,q)!==null)"),g+': invalid quantities rejected');
    check(run("RETAIL.where(testG,testKey).some(x=>x.act==='rsealed'&&x.a.startsWith(testS.id+'~'))"),g+': card-page routes identify a real stocked location');
  }
  run("globalThis.testS=G.retail.locations.cargo;globalThis.testRef=testS.singles[0];globalThis.testA=RETAIL.adapters[testRef.g];globalThis.testC=testA.table()[testRef.id];globalThis.testIdentity=JSON.stringify([testC.id,testC.k,testC.g,testC.c,testC.cert]);globalThis.testCash=G.player.cash;globalThis.testPrice=RETAIL.singlePrice('cargo',testRef.g,testC);");
  check(run("RETAIL.singleBuy('cargo',testRef.g,testRef.id)===null&&testC.o===0&&JSON.stringify([testC.id,testC.k,testC.g,testC.c,testC.cert])===testIdentity&&Math.abs(testCash-G.player.cash-testPrice)<.006"),'buying a single transfers the same copy, condition and certificate');
  check(run("RETAIL.singleBuy('cargo',testRef.g,testRef.id)!==null"),'sold single cannot be bought twice');
  run('globalThis.testCash=G.player.cash;globalThis.testOffer=RETAIL.offer("cargo",testRef.g,testC);');
  check(run("RETAIL.sell('cargo',testRef.g,testRef.id)===null&&testC.o===-2&&testC.rs==='cargo'&&Math.abs(G.player.cash-testCash-testOffer)<.006"),'selling returns the actual copy to the shop and credits its offer');
  run("RETAIL.singleBuy('cargo',testRef.g,testRef.id);globalThis.testBudget=testS.cash;testS.cash=0;");
  check(run("RETAIL.sell('cargo',testRef.g,testRef.id)!==null&&testC.o===0"),'shop cannot buy without sufficient cash');
  run('testS.cash=testBudget;');
  check(run("RETAIL.sell('super-centre',testRef.g,testRef.id)!==null&&RETAIL.sell('corner',testRef.g,testRef.id)!==null"),'big-box and sealed-only shops refuse singles');
  run("globalThis.testSlab=tcMakeCopy(tcAllKeys(1).find(k=>!tcD(k).sealed&&tcFairRaw(k)>25),0,null,'pull');tcGradeCopy(testSlab);globalThis.testSlabIdentity=JSON.stringify([testSlab.id,testSlab.k,testSlab.g,testSlab.c,testSlab.cert]);");
  check(run("RETAIL.sell('glass','wk',testSlab.id)===null&&RETAIL.singleBuy('glass','wk',testSlab.id)===null&&JSON.stringify([testSlab.id,testSlab.k,testSlab.g,testSlab.c,testSlab.cert])===testSlabIdentity"),'premium shop buys and resells a slab with grade, condition and certificate intact');
  run("globalThis.testSnap=JSON.stringify(G,saveReplacer);G=JSON.parse(testSnap);migrate();globalThis.testRetail=JSON.stringify(G.retail);RETAIL.ensure();migrate();");
  check(run('testRetail===JSON.stringify(G.retail)'),'save normalization and repeated migration do not duplicate stock');
  check(run("Object.values(G.retail.locations).every(s=>s.singles.every(r=>{const c=RETAIL.adapters[r.g].table()[r.id];return c&&Array.isArray(c.c)&&c.o===-2&&c.rs===s.id}))"),'saved inventory references and condition data survive reload');
  // Render the real HTML producers; this catches missing symbols but is not a visual test.
  for(const id of run('RETAIL.profiles.map(p=>p.id)'))for(const mode of ['sealed','singles','sell']){
    check(run(`UI.retailLocation='${id}';UI.retailMode='${mode}';UI.retailGame='all';RETAIL.view().length>300`),id+': '+mode+' view produces HTML');
  }
  check(run("UI.retailLocation=null;UI.retailOnline=null;VIEWS.stores().includes('The Lantern Room')&&tcShopV().includes('Your sealed product')&&xtShopV().includes('Your sealed product')&&brShopV().includes('Your sealed product')"),'store directory and franchise sealed-opening panels remain reachable');
  for(const g of ['wk','xt','br'])check(run(`UI.retailOnline='${g}';VIEWS.stores().length>300`),g+': online singles catalogue still renders');
  run("UI.retailOnline=null;globalThis.testStart=G.day;globalThis.testOrders=Object.values(G.retail.locations['super-centre'].stock).reduce((n,x)=>n+x.orders,0);for(let i=0;i<420;i++)advanceDay();");
  check(run("Object.values(G.retail.locations).every(s=>Number.isFinite(s.cash)&&s.cash>=0&&Object.values(s.stock).every(x=>Number.isSafeInteger(x.q)&&x.q>=x.refs.length&&x.q>=0))"),'420-day full simulation keeps stock and budgets valid');
  // Version 2: demand, not age, decides. Quiet branches drop an old line; the busiest keep at least one game going through its print run.
  check(run("['family-outlet','value-east'].every(id=>Object.values(G.retail.locations[id].stock).every(x=>G.day-RETAIL.adapters[x.g].def(x.n).rel<130||x.clearance))"),'quiet big-box branches withdraw old low-demand products from replenishment');
  check(run("['super-centre','mega-mall'].some(id=>Object.values(G.retail.locations[id].stock).some(x=>G.day-RETAIL.adapters[x.g].def(x.n).rel>130&&!x.clearance))"),'a busy big-box branch still carries an older in-print product');
  check(run("Object.values(G.retail.locations.lantern.stock).some(x=>x.q>0&&G.day-RETAIL.adapters[x.g].def(x.n).rel>100&&!x.clearance)"),'collector LCS retains long-tail sealed stock');
  check(run("Object.values(G.retail.locations).every(s=>s.singles.every(r=>{const c=RETAIL.adapters[r.g].table()[r.id];return c&&c.o===-2&&c.rs===s.id}))"),'long simulation retains valid single ownership');
  check(run("Object.values(G.retail.locations).every(s=>s.singles.every(r=>!G[RETAIL.adapters[r.g].ids].includes(r.id)))"),'shop singles are excluded from NPC listing and grading pools');
  // Old saves have aggregate shelves and descriptor cases. Replay migration exactly once.
  run("delete G.retail;G.tcg.shop={1:{pack:7,box:2,so:0,sop:0}};G.xtg.shop={};G.brg.shop={};tcLgs().cs=[{id:999,k:tcAllKeys(1)[0],c:[91,92,93,94]}];globalThis.testOwned=JSON.stringify(CARD_LINES.map(l=>l.mine().map(c=>[c.id,c.k,c.c,c.g])));RETAIL.ensure();globalThis.testMigrated=JSON.stringify(G.retail);RETAIL.ensure();");
  check(run('testMigrated===JSON.stringify(G.retail)&&testOwned===JSON.stringify(CARD_LINES.map(l=>l.mine().map(c=>[c.id,c.k,c.c,c.g])))'),'legacy migration is idempotent and preserves all player copies');
  check(!errors.length,'no simulation console errors: '+errors.slice(0,3).join('; '));
  console.log('RESULT ALL PASS');
})().catch(e=>{console.error(e);process.exitCode=1;});
