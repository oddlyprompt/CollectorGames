#!/usr/bin/env python3
"""Headless Wildkin economy run: starts a world and plays it forward, printing prices and metagame health every month.

  python3 tools/wildkin_econ.py [months] [port]      (needs the dist server; default 12 months)

Reads the numbers the CLAUDE.md economy section talks about: pack and box value against $4.50 / $150, median value per rarity,
the top chase cards, the top deck's share, archetype count and bans."""
import asyncio, sys, json
from playwright.async_api import async_playwright
MONTHS=int(sys.argv[1]) if len(sys.argv)>1 else 12; PORT=sys.argv[2] if len(sys.argv)>2 else '8770'
SNAP="""(()=>{ const ks=tcAllKeys(1).filter(k=>!tcD(k).sealed); const v=ks.map(k=>[k,tcFairRaw(k)]).sort((a,b)=>b[1]-a[1]);
  const by={}; for (const [k,x] of v){ const d=tcD(k); const g=d.rar+(d.v==='H'?' holo':d.v==='R'?' rev':''); (by[g]=by[g]||[]).push(x); }
  const med=a=>a.slice().sort((x,y)=>x-y)[Math.floor(a.length/2)]; const t={}; for (const g of ['common','unc','rare','rare holo','ir','fa','sir','csr']) if (by[g]) t[g]=+med(by[g]).toFixed(2);
  const A=G.tcg.arch; return {date:fmtDate(G.day), ev:+tcPackEV(1).toFixed(2), pack:+tcFairRaw(tcKey(1,0,'P')).toFixed(2), box:+tcFairRaw(tcKey(1,0,'B')).toFixed(0), med:t,
    top:v.slice(0,3).map(([k,x])=>tcD(k).card.name+' '+TC_VARN[tcD(k).v]+' $'+x.toFixed(0)), g10:+tcFair(tcKey(1,173,'X'),10).toFixed(0),
    decks:A.length, topDeck:A.length? A[0].name+' '+(A[0].sh*100).toFixed(0)+'%':'', bans:Object.keys(G.tcg.ban).length, stock:G.tcg.shop[1],
    dsk:tcReleasedSets(G.day).includes(2)? (()=>{ const w=tcAllKeys(2).filter(k=>!tcD(k).sealed).map(k=>[k,tcFairRaw(k)]).sort((a,b)=>b[1]-a[1]); return {ev:+tcPackEV(2).toFixed(2), box:+tcFairRaw(tcKey(2,0,'B')).toFixed(0), top:w.slice(0,3).map(([k,x])=>tcD(k).card.name+' '+TC_VARN[tcD(k).v]+' $'+x.toFixed(0)), share:+A.filter(a=>Object.keys(a.cnt).some(c=>+c>=2000)).reduce((s,a)=>s+a.sh,0).toFixed(2)}; })() : null}; })()"""
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); pg=await (await b.new_context()).new_page(); errs=[]
        pg.on('pageerror', lambda e: errs.append(str(e)[:200])); await pg.route('**/fonts.g*/**', lambda r: r.abort())
        await pg.goto(f'http://localhost:{PORT}/tcg/index.html'); await pg.wait_for_selector('#launch'); await pg.click('[data-lact=new]'); await pg.click('[data-lact=start]')
        await pg.wait_for_function("window.G && G.player && G.player.start>0 && document.getElementById('boot').style.display==='none'", timeout=280000)
        rows=[await pg.evaluate(SNAP)]
        for m in range(MONTHS):
            await pg.evaluate("(()=>{ for (let i=0;i<30;i++) advanceDay(); })()"); rows.append(await pg.evaluate(SNAP))
        for r in rows: print(json.dumps(r))
        print('ERRS', errs[:3]); await b.close()
asyncio.run(main())
