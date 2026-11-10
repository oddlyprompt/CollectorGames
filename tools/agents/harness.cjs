// Loads the built Trading Card Collector (dist/tcg/game.js) in Node without a browser, for simulations and player agents.
// Build tcg first. Usage: const H=require('./harness.cjs'); const g=H.load(); await g.run('newGame(7)');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
function load(opts={}){
  const file=opts.file||path.join(__dirname,'..','..','dist','tcg','game.js');
  const code=fs.readFileSync(file,'utf8').replace(/shellBoot\(\);\s*$/,'');
  const errors=[];
  const document={addEventListener(){},documentElement:{dataset:{}},getElementById(){return null},querySelector(){return null},querySelectorAll(){return []},body:{style:{},classList:{add(){},remove(){}}}};
  const ctx={console:{...console,error(...x){errors.push(x.map(e=>e&&e.stack||String(e)).join(' '));}},document,navigator:{},setTimeout,clearTimeout,performance,Blob,TextEncoder,TextDecoder,CompressionStream,DecompressionStream,URL,addEventListener(){},scrollTo(){},localStorage:{getItem(){return null},setItem(){}}};
  ctx.window=ctx; vm.createContext(ctx); vm.runInContext(code,ctx,{filename:'game.js'});
  const run=s=>vm.runInContext(s,ctx);
  run('showToast=()=>{};toast=()=>{};celebrate=()=>{};');   // DOM notifications belong to the browser tests
  for (const f of opts.inject||[]) vm.runInContext(fs.readFileSync(f,'utf8'),ctx,{filename:path.basename(f)});
  return {run,ctx,errors};
}
module.exports={load};
