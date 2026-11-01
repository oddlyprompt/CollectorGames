#!/usr/bin/env python3
"""Pack opening behaviour: python3 tools/opening_test.py [port]   (needs dist/ served)
New saves start with pack hints OFF (surprise preserved), older saves keep their setting, a goal completed by an opening is celebrated only at the summary,
and every summary leads with what the pulls did for the collection."""
import sys, asyncio
from playwright.async_api import async_playwright
PORT=sys.argv[1] if len(sys.argv)>1 else '8770'; URL=f'http://localhost:{PORT}/tcg/index.html'; FAIL=[]
def check(ok,msg,x=''):
    print(('PASS ' if ok else 'FAIL ')+msg, ('' if ok else x))
    if not ok: FAIL.append(msg)
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(viewport={'width':390,'height':844}, is_mobile=True, has_touch=True); pg=await ctx.new_page(); errs=[]
        pg.on('pageerror', lambda e: errs.append(str(e)[:300])); await pg.route('**/fonts.g*/**', lambda r: r.abort())
        await pg.goto(URL); await pg.wait_for_selector('#launch'); await pg.click('[data-lact=new]'); await pg.click('[data-lact=start]')
        await pg.wait_for_function("window.G && G.player && G.player.start>0 && document.getElementById('boot').style.display==='none'", timeout=280000)
        h=await pg.evaluate("({tc:G.tcg.opt&&G.tcg.opt.nohint, xt:G.xtg.opt&&G.xtg.opt.nohint, br:G.brg.opt&&G.brg.opt.nohint, htc:tcHints(), hxt:xtHints(), hbr:brHints()})")
        check(h['tc'] and h['xt'] and h['br'] and not (h['htc'] or h['hxt'] or h['hbr']), 'a new game starts with pack hints off for all three franchises', h)
        old=await pg.evaluate("(()=>{ const s=G.brg.opt; delete G.brg.opt; const a=brHints(); G.brg.opt={nohint:false}; const b=brHints(); G.brg.opt={nohint:true}; const c=brHints(); G.brg.opt=s; return [a,b,c]; })()")
        check(old==[True,True,False], 'an older save without the setting keeps hints on; an explicit choice is respected', old)
        await pg.evaluate("(()=>{ while (G.day<brSetDef(1).rel+3) advanceDay(); G.player.cash=9000; })()")
        # Broken Reach: three packs complete the 'every faction' goal; the celebration must wait for the summary
        await pg.evaluate("(()=>{ brBuySealed(1,'P',4); const ids=myBr().filter(c=>brD(c.k).sealed&&!c.l).map(c=>c.id); window.__res=brOpenMany(ids); broStart(window.__res); })()"); await pg.wait_for_timeout(1200)
        txt=(await pg.evaluate("document.body.innerText")).lower(); cele=await pg.evaluate("(document.getElementById('cele')||{}).innerText||''")
        check('GOAL' not in cele.upper() and 'no standout' not in txt and 'standout cards in this lot' not in txt, 'during the opening: no goal banner and no "no standout cards" spoiler', (cele, txt[:200]))
        q=await pg.evaluate("(UI.celQ||[]).length")
        await pg.evaluate("ACT.brosum()"); await pg.wait_for_timeout(1000)
        sm=(await pg.evaluate("document.body.innerText")).lower(); cele2=await pg.evaluate("(document.getElementById('cele')||{}).innerText||''")
        check('for your collection' in sm and 'new to your collection' in sm and 'set progress' in sm, 'the summary leads with collection progress', sm[:300])
        check(sm.index('for your collection')<sm.index('worth about'), 'progress comes before the money figures')
        if q: check('GOAL' in cele2.upper(), 'a goal completed by the opening is celebrated at the summary', (q,cele2)); check('goal' in sm and 'completed' in sm, 'the summary lists the completed goal', sm[:400])
        else: print('NOTE no goal completed in this opening (celebration timing not exercised)')
        await pg.evaluate("closeSheet(true)")
        # the mechanism itself: a goal celebration raised during an opening waits for the summary
        await pg.evaluate("(()=>{ G.player.cash=9000; brBuySealed(1,'P',1); const ids=myBr().filter(c=>brD(c.k).sealed&&!c.l).map(c=>c.id); broStart(brOpenMany(ids)); celebrate('Goal complete','Held goal'); })()"); await pg.wait_for_timeout(500)
        c1=await pg.evaluate("(document.getElementById('cele')||{}).innerText||''"); q1=await pg.evaluate("(UI.celQ||[]).length")
        check(c1=='' and q1==1, 'a goal celebration raised during an opening is held, not shown', (c1,q1))
        await pg.evaluate("ACT.brosum()"); await pg.wait_for_timeout(600)
        c2=(await pg.evaluate("(document.getElementById('cele')||{}).innerText||''")).lower(); q2=await pg.evaluate("(UI.celQ||[]).length"); s2=(await pg.evaluate("document.body.innerText")).lower()
        check('held goal' in c2 and q2==0 and 'held goal' in s2, 'it is celebrated at the summary and listed there', (c2,q2))
        await pg.evaluate("closeSheet(true)")
        # Wildkin and Tidemark: open packs through each franchise's own flow and read the summary
        for n,pre,buy,openm,start,summ,sel in [('Wildkin','tc',"tcBuySealed(1,'P',2)","tcOpenMany","tcoStart","tcosum",'myTc()'),('Tidemark','xt',"xtBuySealed(31,'P',2)","xtOpenMany","xtoStart","xtosum",'myXt()')]:
            r=await pg.evaluate(f"""(()=>{{ G.player.cash=9000; const e={buy}; if (e) return 'ERR '+e; const ids={sel}.filter(c=>{pre}D(c.k).sealed&&!c.l).map(c=>c.id); window.__r={openm}(ids); {start}(window.__r); return 'ok'; }})()""")
            check(r=='ok', f'{n}: packs bought and opened', r)
            if r!='ok': continue
            await pg.wait_for_timeout(800); t1=(await pg.evaluate("document.body.innerText")).lower()
            check('standout cards in this lot' not in t1 and 'no standout' not in t1, f'{n}: the opening screen does not announce whether the lot holds anything', t1[:160])
            await pg.evaluate(f"ACT.{summ}()"); await pg.wait_for_timeout(800); t2=(await pg.evaluate("document.body.innerText")).lower()
            check('for your collection' in t2 and 'new to your collection' in t2 and 'set progress' in t2, f'{n}: the summary leads with collection progress', t2[:260])
            await pg.evaluate("closeSheet(true)")
        check(not errs, 'no page errors', errs[:3])
        await b.close()
    print('RESULT', 'FAIL '+str(len(FAIL)) if FAIL else 'ALL PASS'); sys.exit(1 if FAIL else 0)
asyncio.run(main())
