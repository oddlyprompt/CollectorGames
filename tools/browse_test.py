#!/usr/bin/env python3
"""Browsing and navigation: python3 tools/browse_test.py [port]   (needs dist/ served)
Online singles shops show what can be bought first, can be searched, page compactly; Collection keeps the franchise you just bought from and never looks empty by accident."""
import sys, asyncio
from playwright.async_api import async_playwright
PORT=sys.argv[1] if len(sys.argv)>1 else '8770'; URL=f'http://localhost:{PORT}/tcg/index.html'; FAIL=[]
def check(ok,msg,x=''):
    print(('PASS ' if ok else 'FAIL ')+msg, ('' if ok else x))
    if not ok: FAIL.append(msg)
SH=[('Wildkin','shop','tstore','kv','kvpage','kvbuy','kvs','kvq'),('Tidemark','xt','xtstore','kv','xkvpage','xkvbuy','xkvs','xkvq'),('Broken Reach','br','brstore','kv','bkvpage','bkvbuy','bkvs','bkvq')]
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(viewport={'width':390,'height':844}, is_mobile=True, has_touch=True); pg=await ctx.new_page(); errs=[]
        pg.on('pageerror', lambda e: errs.append(str(e)[:300])); await pg.route('**/fonts.g*/**', lambda r: r.abort())
        await pg.goto(URL); await pg.wait_for_selector('#launch'); await pg.click('[data-lact=new]'); await pg.click('[data-lact=start]')
        await pg.wait_for_function("window.G && G.player && G.player.start>0 && document.getElementById('boot').style.display==='none'", timeout=280000)
        # empty collection: a useful recovery action, not a bare "nothing matches"
        await pg.evaluate("UI.tab='coll'; UI.cg='wk'; render(true)"); t=(await pg.evaluate("document.getElementById('view').innerText")).lower()
        check('nothing here yet' in t and 'browse the market' in t, 'an empty collection offers the Market and the shops', t[:240])
        await pg.evaluate("(()=>{ while (G.day<brSetDef(1).rel+10) advanceDay(); G.player.cash=5000; })()")
        for n,tab,store,_,pageAct,buyAct,sf,qf in SH:
            await pg.evaluate(f"UI.tab='{tab}'; UI.{store}='kv'; UI.{sf}=undefined; UI.{qf}=''; render(true)"); await pg.wait_for_timeout(250)
            rows=await pg.evaluate("Array.from(document.querySelectorAll('#view .row')).filter(r=>r.querySelector('[data-act$=\"kvbuy\"]')).map(r=>({txt:r.innerText.toLowerCase(), dis:r.querySelector('[data-act$=\"kvbuy\"]').disabled}))")
            check(len(rows)>0 and all('out of stock' not in r['txt'] for r in rows), f'{n}: the singles shop shows in-stock cards first and by default', rows[:2])
            nb=await pg.evaluate(f"document.querySelectorAll('[data-act=\"{pageAct}\"]').length"); check(nb<=4, f'{n}: the pager has at most four controls, not a numbered strip', nb)
            check('page 1 of' in (await pg.evaluate("document.getElementById('view').innerText")).lower(), f'{n}: the pager says where you are')
            # search narrows, a missing name offers the out-of-stock view
            first=await pg.evaluate("(()=>{ const r=Array.from(document.querySelectorAll('#view .row')).find(r=>r.querySelector('[data-act$=\"kvbuy\"]')); return r? r.querySelector('b').textContent : ''; })()")
            word=max(first.replace(',',' ').split(' '), key=len).lower()
            await pg.evaluate(f"ACT.{qf}('{word}')"); await pg.wait_for_timeout(500)
            rows=await pg.evaluate("Array.from(document.querySelectorAll('#view .row')).filter(r=>r.querySelector('[data-act$=\"kvbuy\"]')).map(r=>r.innerText.toLowerCase())"); check(rows and all(word in r for r in rows), f'{n}: searching for "{word}" narrows the list', rows[:2])
            await pg.evaluate(f"ACT.{qf}('zzzz-no-such-card')"); await pg.wait_for_timeout(500); t=(await pg.evaluate("document.getElementById('view').innerText")).lower(); check('nothing here' in t or 'nothing in stock' in t, f'{n}: an unmatched search explains itself')
            await pg.evaluate(f"ACT.{qf}(''); ACT.{sf}('0')"); await pg.wait_for_timeout(300)
            outs=await pg.evaluate("Array.from(document.querySelectorAll('#view .row')).filter(r=>r.innerText.toLowerCase().includes('out of stock')).length"); check(outs>0, f'{n}: unavailable cards stay reachable with the switch off', outs)
            await pg.evaluate(f"UI.{sf}=true; render(true)")
        # context: buying from Broken Reach lands Collection on Broken Reach; another game selected explains where your cards are
        await pg.evaluate("(()=>{ const s=brKvStock(G.day); const k=brAllKeys(1).find(k=>s[k]>0&&!brD(k).sealed); UI.cg='wk'; ACT.bkvbuy(k); })()")
        cg=await pg.evaluate("UI.cg"); check(cg=='br', 'after a Broken Reach purchase, Collection opens on Broken Reach', cg)
        await pg.evaluate("UI.tab='coll'; UI.cg='wk'; UI.sub.coll='cards'; render(true)"); t=(await pg.evaluate("document.getElementById('view').innerText")).lower()
        check('you have no wildkin cards yet' in t and 'broken reach: 1' in t, 'selecting an empty franchise points at the games where your cards are', t[:300])
        await pg.click('[data-act=cg][data-a=br]'); await pg.wait_for_timeout(300); t=(await pg.evaluate("document.getElementById('view').innerText")).lower(); check('you have no' not in t, 'tapping that game shows its cards')
        check(not errs, 'no page errors', errs[:3])
        await b.close()
    print('RESULT', 'FAIL '+str(len(FAIL)) if FAIL else 'ALL PASS'); sys.exit(1 if FAIL else 0)
asyncio.run(main())
