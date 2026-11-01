#!/usr/bin/env python3
"""Home and the first steps: python3 tools/home_test.py [port]   (needs dist/ served)"""
import sys, asyncio
from playwright.async_api import async_playwright
PORT=sys.argv[1] if len(sys.argv)>1 else '8770'; URL=f'http://localhost:{PORT}/tcg/index.html'; FAIL=[]
def check(ok,msg,x=''):
    print(('PASS ' if ok else 'FAIL ')+msg, ('' if ok else x))
    if not ok: FAIL.append(msg)
async def txt(pg): return (await pg.evaluate("document.getElementById('view').innerText")).lower()
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(viewport={'width':390,'height':844}, is_mobile=True, has_touch=True); pg=await ctx.new_page(); errs=[]
        pg.on('pageerror', lambda e: errs.append(str(e)[:300])); await pg.route('**/fonts.g*/**', lambda r: r.abort())
        await pg.goto(URL); await pg.wait_for_selector('#launch'); await pg.click('[data-lact=new]'); await pg.click('[data-lact=start]')
        await pg.wait_for_function("window.G && G.player && G.player.start>0 && document.getElementById('boot').style.display==='none'", timeout=280000)
        t=await txt(pg)
        check('getting started' in t and 'time moves when you say so' in t and '$50' in t and 'friday' in t, 'day 1: the start panel explains manual days and the Friday allowance', t[:300])
        check('open a pack' not in t, 'day 1: Home never invites a pack opening while shelves are empty', t[:200])
        check('releases jun 8, 2026' in t and 'releases jun 26, 2026' in t and 'preview' in t, 'day 1: upcoming releases are listed with their dates and a Preview action')
        tiles=(await pg.evaluate("Array.from(document.querySelectorAll('.gtile small')).map(e=>e.textContent)"))
        check(len(tiles)==3 and all(('Preview' in x or 'Market' in x) for x in tiles), 'day 1: every game tile says Preview (or Market), not Open a pack', tiles)
        await pg.click('[data-act=introack]'); await pg.wait_for_timeout(200); t=await txt(pg)
        check('get something to hold' in t and 'browse the market' in t and 'arrives jun 8, 2026' in t, 'step 2 offers something actually available and names the release date', t[:400])
        # skipping works and is remembered
        await pg.click('[data-act=introdone]'); await pg.wait_for_timeout(200); t=await txt(pg)
        check('getting started' not in t, 'the start panel can be skipped')
        # after the releases: shelves have stock, goal choice, focus
        await pg.evaluate("(()=>{ G.player.ui.introDone=false; G.player.ui.seen={}; G.player.ui.goal=null; while(G.day<brSetDef(1).rel+3) advanceDay(); G.player.cash=2000; UI.tab='home'; render(true); })()"); await pg.wait_for_timeout(300)
        t=await txt(pg); check('shop wildkin' in t or 'shop ' in t, 'with stock on the shelves the acquire step points at a shop', t[:300])
        tiles=(await pg.evaluate("Array.from(document.querySelectorAll('.gtile small')).map(e=>e.textContent)")); check(all(x=='Packs on the shelf' for x in tiles), 'tiles say Packs on the shelf once there is stock', tiles)
        await pg.evaluate("(()=>{ brBuySealed(1,'P',2); const ids=myBr().filter(c=>brD(c.k).sealed&&!c.l).map(c=>c.id); window.__r=brOpenMany(ids); G.player.ui.seen.time=1; G.player.ui.seen.look=1; UI.tab='home'; render(true); })()"); await pg.wait_for_timeout(300)
        t=await txt(pg); check('choose what you are collecting' in t, 'after getting and looking at something, the goal step appears', t[:300])
        await pg.click('[data-act=introgoal][data-a=set]'); await pg.wait_for_timeout(300); t=await txt(pg)
        check('your next useful move' in t and 'your focus' in t and ' of ' in t, 'choosing a set goal shows the next move and a Your focus panel with progress', t[:500])
        # needs-you: wantlist item for sale, an offer, an ending auction, a grading return
        r=await pg.evaluate("""(()=>{ const s=brKvStock(G.day); const k=brAllKeys(1).find(k=>s[k]>0&&!brD(k).sealed); ACT.brwant(k); UI.tab='home'; render(true); return k; })()"""); await pg.wait_for_timeout(300)
        btn=await pg.query_selector(f'.hp [data-act="bkvbuy"][data-a="{r}"]'); check(btn is not None, 'Needs you shows a wanted card that is for sale, wired to its own store', r)
        if btn:
            c0=await pg.evaluate("G.player.cash"); await btn.click(); await pg.wait_for_timeout(300); got=await pg.evaluate(f"myBr().some(c=>c.k==='{r}')"); c1=await pg.evaluate("G.player.cash")
            check(got and c1<c0, 'its Buy button buys that exact print', (got,c0,c1))
        off=await pg.evaluate("""(()=>{ const c=myBr().find(c=>!brD(c.k).sealed&&!c.l); if(!c) return null; const err=playerList('b',c.id,'bin',50,30,true); const l=G.lst.find(x=>x.sel===0&&x.ref===c.id); l.offers.push({id:G.nextLid++, who:G.npcs[0].id, amt:Math.round(l.pr*0.8*100)/100, exp:G.day+2, val:l.pr}); UI.tab='home'; render(true); return {err, id:l.id}; })()"""); await pg.wait_for_timeout(300)
        t=await txt(pg); check(off and 'respond' in t and '1 offer' in t, 'an offer on your listing appears in Needs you with a Respond action', (off,t[:300]))
        await pg.evaluate("""(()=>{ const l=G.lst.find(x=>x.ty==='auc'); if(l){ l.en=G.day+1; if(!G.player.watch.includes(l.id)) G.player.watch.push(l.id); } UI.tab='home'; render(true); })()"""); await pg.wait_for_timeout(300)
        t=await txt(pg); check('ends' in t and ('open' in t), 'a watched auction ending soon appears in Needs you')
        # pins: pinned card shows on Home and survives save and reload
        k=await pg.evaluate("brAllKeys(1)[10]"); await pg.evaluate(f"ACT.pinkey('{k}'); UI.tab='home'; render(true)"); await pg.wait_for_timeout(200); t=await txt(pg)
        check('your focus' in t and (await pg.evaluate(f"G.player.ui.pins.includes('{k}')")), 'a pinned card appears under Your focus')
        await pg.evaluate(f"ACT.brdesign('{k}')"); await pg.wait_for_timeout(500); sh=(await pg.evaluate("document.body.innerText")).lower(); check('pinned to home' in sh and 'wantlist' in sh, 'the card page shows the pin next to the wantlist star')
        await pg.evaluate("closeSheet(true); saveGame(true)"); await pg.wait_for_timeout(1500)
        await pg.reload(); await pg.wait_for_selector('#launch'); await pg.click('[data-lact=open]'); await pg.wait_for_function("window.G && G.player && document.getElementById('boot').style.display==='none'", timeout=120000)
        ui=await pg.evaluate("JSON.stringify(G.player.ui)"); check(k in ui and '"goal":"set"' in ui and '"focus":{' in ui, 'goal, focus and pins survive save and reload', ui[:200])
        check(not errs, 'no page errors', errs[:3])
        await b.close()
    print('RESULT', 'FAIL '+str(len(FAIL)) if FAIL else 'ALL PASS'); sys.exit(1 if FAIL else 0)
asyncio.run(main())
