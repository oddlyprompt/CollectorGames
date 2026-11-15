// Multi-seed economy validation (build tcg first). Runs robot strategies over several worlds and writes a table.
//   node tools/agents/validate.cjs [--seeds 11,23,7,5,42] [--days 540] [--agents a,b,...] [--extra scalper:7,scalper:23] [--out design/economy-validation.json]
// For each run: cash, what the holdings would fetch if sold quickly (liquidation, see agents_vm.js), and their paper value.
// "Return" is (cash + liquidation - money put in) / money put in; "paper" uses full card values instead of liquidation.
// Money put in: the $2,000 start, or for the allowance player its $75 plus every Friday's $50.
const path=require('node:path'), fs=require('node:fs'), cp=require('node:child_process');
const arg=(n,d)=>{ const i=process.argv.indexOf('--'+n); return i>0? process.argv[i+1] : d; };
const seeds=arg('seeds','11,23,7,5,42').split(',').map(Number), days=+arg('days',540), cash=+arg('cash',2000);
const agents=arg('agents','idle,ripper,ripseller,dumper,sniper,clearance,investor,grader,picker,hunter,allowance').split(',').filter(Boolean);
const extra=arg('extra','scalper:7,scalper:23').split(',').filter(Boolean).map(x=>x.split(':')), out=arg('out',null), jobsN=+arg('jobs',4);
const jobs=[]; for (const a of agents) for (const s of seeds) jobs.push([a,s]); for (const [a,s] of extra) jobs.push([a,+s]);
const res=[]; const t0=Date.now();
const runOne=([a,s])=>new Promise(ok=>cp.execFile(process.execPath,[path.join(__dirname,'play.cjs'),'--one',a,'--days',days,'--seed',s,'--cash',cash],{maxBuffer:1<<27},(e,so,se)=>{ let r; try { r=e? {agent:a,crash:String(se||e).slice(0,400)} : JSON.parse(so); } catch(x){ r={agent:a,crash:'bad output '+String(so).slice(0,200)}; } r.seed=s; ok(r); }));
(async()=>{
  const q=jobs.slice(); const worker=async()=>{ while (q.length){ const j=q.shift(); const r=await runOne(j); res.push(r); process.stderr.write(`${res.length}/${jobs.length} ${j[0]} seed ${j[1]} (${Math.round((Date.now()-t0)/1000)} s)\n`); } };
  await Promise.all(Array.from({length:jobsN},worker));
  const put=r=>r.agent==='allowance'? r.start+(r.income||0) : r.start;
  const real=r=>(r.cash+r.liq-put(r))/put(r), paper=r=>(r.cash+r.holdings-put(r))/put(r);
  const pct=x=>(x>=0?'+':'')+Math.round(x*100)+'%', med=a=>{ const s=a.slice().sort((x,y)=>x-y); return s[Math.floor(s.length/2)]; };
  const names=[...new Set(jobs.map(j=>j[0]))];
  console.log(`${days} days; seeds ${seeds.join(', ')}; return = (cash + quick-sale value - money put in) / money put in; paper uses full card values`);
  console.log('agent      runs  return median   min    max   | paper median  min    max  | acts/day | errors');
  for (const n of names){ const R=res.filter(r=>r.agent===n&&!r.crash), C=res.filter(r=>r.agent===n&&r.crash); if (!R.length){ console.log(n.padEnd(10),'CRASH',C[0]&&C[0].crash); continue; }
    const a=R.map(real), p=R.map(paper); console.log(n.padEnd(10), String(R.length).padStart(4), pct(med(a)).padStart(12), pct(Math.min(...a)).padStart(7), pct(Math.max(...a)).padStart(6), ' |', pct(med(p)).padStart(10), pct(Math.min(...p)).padStart(6), pct(Math.max(...p)).padStart(6), ' |', (med(R.map(r=>r.acts/r.days))).toFixed(1).padStart(6), '  |', R.reduce((x,r)=>x+(r.err||0)+(r.pageErrors||[]).length,0)+C.length); }
  console.log('\nper run: agent seed | cash | quick-sale | paper holdings | put in | standing tiers at the five shops | hunt goals | notes');
  for (const r of res.slice().sort((a,b)=>names.indexOf(a.agent)-names.indexOf(b.agent)||a.seed-b.seed)){ if (r.crash){ console.log(r.agent,r.seed,'CRASH',r.crash); continue; }
    console.log(r.agent.padEnd(10), String(r.seed).padStart(3), '|', String(Math.round(r.cash)).padStart(6), '|', String(Math.round(r.liq)).padStart(6), '|', String(r.holdings).padStart(6), '|', String(put(r)).padStart(5), '|', (r.tiers||[]).join(''), '|', r.goals, '|', [r.focus?`newest Wildkin set ${r.focus[1]}% complete, First Bond ${r.focus[2]}%`:'', r.packsOpened?`${r.packsOpened} packs`:'', r.lots?`${r.lots} lots`:'', r.shows?`${r.shows} shows`:'', r.hunt&&r.hunt.finds?`${r.hunt.finds} finds`:'', r.flips?`${r.flips} buys $${r.flipCost}`:'', r.buylist?`sold to shops $${r.buylist}`:'', r.err?`ERR x${r.err} ${r.lastErr}`:''].filter(Boolean).join(', ')); }
  if (out) fs.writeFileSync(out, JSON.stringify({days,seeds,cash,res:res.map(r=>{ const c=Object.assign({},r); delete c.series; return c; })})+'\n');
})();
