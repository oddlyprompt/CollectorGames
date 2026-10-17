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
    decks:A.length, topDeck:A.length? A[0].name+' '+(A[0].sh*100).toFixed(0)+'%':'', bans:Object.keys(G.tcg.ban).length, stock:G.tcg.shop[1], t5:A.slice(0,5).map(a=>[a.id,a.name,+a.sh.toFixed(3)]), nf:A.length,
    dsk:tcReleasedSets(G.day).includes(2)? (()=>{ const w=tcAllKeys(2).filter(k=>!tcD(k).sealed).map(k=>[k,tcFairRaw(k)]).sort((a,b)=>b[1]-a[1]); return {ev:+tcPackEV(2).toFixed(2), box:+tcFairRaw(tcKey(2,0,'B')).toFixed(0), top:w.slice(0,3).map(([k,x])=>tcD(k).card.name+' '+TC_VARN[tcD(k).v]+' $'+x.toFixed(0)), share:+A.filter(a=>Object.keys(a.cnt).some(c=>+c>=2000)).reduce((s,a)=>s+a.sh,0).toFixed(2)}; })() : null}; })()"""
def meta_summary(rows):
    """How much the metagame moves: different leading decks, decks that ever reach the top 5, and decks that were never
    in the top 5 during the first three months but reach it later (new metas, not the same few cycling)."""
    R=[r for r in rows if r.get('t5')]
    if not R: return
    first={}; leads=[]; streak=best=0; prev=None
    for i,r in enumerate(R):
        for x in r['t5']: first.setdefault(x[0],(i,x[1]))
        lid=r['t5'][0][0]; leads.append(lid); streak=streak+1 if lid==prev else 1; best=max(best,streak); prev=lid
    late=[n for k,(i,n) in first.items() if i>=3]
    print('META months %d | different leading decks %d | decks ever in the top 5: %d | new to the top 5 after month 3: %d %s | longest run at #1: %d months'%(len(R),len(set(leads)),len(first),len(late),late[:12],best))
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
        meta_summary(rows)
        print('ERRS', errs[:3]); await b.close()
asyncio.run(main())
