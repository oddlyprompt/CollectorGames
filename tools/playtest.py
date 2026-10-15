import asyncio, sys
from playwright.async_api import async_playwright
PACK=sys.argv[1]
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); pg=await (await b.new_context(viewport={'width':390,'height':844})).new_page(); errs=[]
        pg.on('pageerror', lambda e: errs.append('PAGE '+str(e)[:240])); pg.on('console', lambda m: errs.append('CON '+m.text[:240]) if m.type=='error' and 'fonts' not in m.text and 'ERR_' not in m.text else None)
        await pg.route('**/fonts.g*/**', lambda r: r.abort())
        await pg.goto(f'http://localhost:8770/{PACK}/index.html'); await pg.wait_for_selector('#launch'); await pg.click('[data-lact=new]'); await pg.click('[data-lact=start]')
        await pg.wait_for_function("window.G && G.player && G.player.start>0 && document.getElementById('boot').style.display==='none'", timeout=280000)
        if PACK=='tcg':   # First Bond launches a week after the game starts: play to launch day first
            while await pg.evaluate("!tcReleasedSets(G.day).length"):
                await pg.evaluate("ACT.adv('1')"); await pg.wait_for_function("!UI.busy", timeout=120000); await pg.wait_for_timeout(150)
                await pg.evaluate("closeSheet(true); if (UI.rvl) rvClose(); const t=document.getElementById('tco'); if (t) ACT.tcoclose();")
        r=await pg.evaluate("""(()=>{ G.player.cash=8000; const out={};
          const kind = PACK.id==='sports'?'c': PACK.id==='comics'?'m':'t';
          const l=G.lst.filter(x=>x.it===kind&&x.sel>0&&x.ty==='bin').sort((a,b)=>a.pr-b.pr)[2]; out.listing=l? itemLabel(l):'none'; if (l){ const e=buyListing(l.id); out.buy=e||'ok'; }
          if (PACK.id==='tcg'){ out.shop=tcBuySealed(tcReleasedSets(G.day).slice(-1)[0],'P',2)||'ok'; const pk=myTc().find(c=>tcD(c.k).sealed); const o=tcOpenSealed(pk.id); out.pulled=o.packs.flat().length; const c=myTc().filter(c=>!tcD(c.k).sealed).sort((a,b)=>tcCopyValue(b)-tcCopyValue(a))[0]; out.grade=tcSubmitGrade(c.id,'exp')||'sent'; const d=myTc().filter(c=>!tcD(c.k).sealed&&c.g===0)[0]; out.list=playerList('t',d.id,'bin',Math.max(1,tcCopyValue(d)*1.2),0,true)||'listed'; }
          if (PACK.id==='sports'){ const c=myCards().filter(c=>c.g===0)[0]; if (c){ out.grade=submitGrading(c.id,'exp')||'sent'; } }
          if (PACK.id==='comics'){ const c=myComics().filter(c=>c.g===0)[0]; if (c){ out.grade=cmSubmitGrade(c.id,'exp',false)||'sent'; } }
          return out; })()""")
        print(PACK,'actions',r)
        for i in range(8):
            await pg.evaluate("ACT.adv('7')"); await pg.wait_for_function("!UI.busy", timeout=120000); await pg.wait_for_timeout(300); await pg.evaluate("closeSheet(true); if (UI.rvl) rvClose(); const t=document.getElementById('tco'); if (t) ACT.tcoclose();")
        h=await pg.evaluate("""(()=>{ const H=G.hunt; if (!H) return 'no hunt'; let c=0,m=0,s=0,n=0; for (const x of H.sel) for (const e of x.inv){ n++; if (e.t==='c') c++; else if (e.t==='m') m++; else s++; } return {sellers:H.sel.length, items:n, cards:c, comics:m, sealed:s, events:H.ev.length, kinds:[...new Set(H.ev.map(e=>EV_T[e.ty].kind||'any'))]}; })()""")
        print('hunt', h); print('day', await pg.evaluate("fmtDate(G.day)"), 'cash', await pg.evaluate("Math.round(G.player.cash)"), 'news', await pg.evaluate("G.news.filter(n=>packNews(n)).slice(0,3).map(n=>n.h)"))
        print('ERRS', errs[:5]); await b.close()
asyncio.run(main())
