// Simulated playthroughs by automated player agents (build tcg first).
//   node tools/agents/play.cjs [--days 540] [--seed 11] [--cash 2000] [--agents idle,ripper,...] [--json out.json]
// Each agent plays its own copy of the same world (same seed), with no allowance, so the result is its own doing.
// Prints one line per agent: money in, cash and holdings out, return, actions per day. See design/studio-audit-2026-11.md for how to read it.
const {load}=require('./harness.cjs'); const path=require('node:path'), fs=require('node:fs'), cp=require('node:child_process');
const arg=(n,d)=>{ const i=process.argv.indexOf('--'+n); return i>0? process.argv[i+1] : d; };
const days=+arg('days',540), seed=+arg('seed',11), cash=+arg('cash',2000), only=arg('agents','idle,ripper,ripseller,dumper,sniper,clearance,investor,grader').split(','), out=arg('json',null), one=arg('one',null);
async function playOne(name){
  const g=load({inject:[path.join(__dirname,'agents_vm.js')]}); await g.run(`newGame(${seed})`);
  g.run(`AG.start(${JSON.stringify(name)},${cash})`);
  for (let d=0; d<days; d++) g.run('AG.step()');
  const r=JSON.parse(g.run('JSON.stringify(AG.report())')); r.pageErrors=g.errors.slice(0,3); return r;
}
if (one){ playOne(one).then(r=>{ process.stdout.write(JSON.stringify(r)); }); }
else (async()=>{
  // one process per agent, four at a time
  const res=[]; const q=only.slice(); const worker=async()=>{ while (q.length){ const n=q.shift(); const r=await new Promise(ok=>cp.execFile(process.execPath,[__filename,'--one',n,'--days',days,'--seed',seed,'--cash',cash],{maxBuffer:1<<26},(e,so,se)=>ok(e?{agent:n,crash:String(se||e).slice(0,500)}:JSON.parse(so)))); res.push(r); } };
  await Promise.all([worker(),worker(),worker(),worker()]);
  res.sort((a,b)=>only.indexOf(a.agent)-only.indexOf(b.agent));
  console.log(`seed ${seed}, ${days} days, start $${cash}, no allowance`);
  console.log('agent      cash    holdings  total   return  bought  sold   fees  acts/day  notes');
  for (const r of res){ if (r.crash){ console.log(r.agent.padEnd(10),'CRASH',r.crash); continue; }
    const ret=((r.total-r.start)/r.start*100).toFixed(0)+'%';
    console.log(r.agent.padEnd(10), String(Math.round(r.cash)).padStart(6), String(r.holdings).padStart(8), String(r.total).padStart(7), ret.padStart(7), String(r.bought).padStart(7), String(r.sold).padStart(6), String(r.fees).padStart(5), (r.acts/r.days).toFixed(1).padStart(8), ' ', [r.packsOpened?`${r.packsOpened} packs for $${r.packsCost}`:'', r.flips?`${r.flips} buys $${r.flipCost}`:'', r.bids?`${r.bids} bids`:'', r.graded?`${r.graded} graded`:'', r.buylist?`buylist $${r.buylist}`:'', r.listedNow?`${r.listedNow} listed`:'', r.err?`ERR x${r.err} ${r.lastErr}`:'', (r.pageErrors||[]).length?'pageErr '+r.pageErrors[0].slice(0,200):''].filter(Boolean).join(', '));
  }
  if (out) fs.writeFileSync(out, JSON.stringify({seed,days,cash,res},null,1));
})();
