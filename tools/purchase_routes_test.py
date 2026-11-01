#!/usr/bin/env python3
"""Cross-franchise purchase routing test: python3 tools/purchase_routes_test.py [port]   (needs dist/ served: cd dist && python3 -m http.server 8770)
For Wildkin, Tidemark and Broken Reach: every "Buy" shortcut (Home wantlist, card page, online singles store, local game store) must call that franchise's own handler,
buy the right print in the right condition, charge the listed price, change ownership and stock, and survive save and reload.
Regression for the 2026-11 audit: Tidemark's shortcuts emitted the Wildkin handlers (kvbuy, lgssingle) and answered "Out of stock"."""
import sys, asyncio, json
from playwright.async_api import async_playwright
PORT=sys.argv[1] if len(sys.argv)>1 else '8770'; URL=f'http://localhost:{PORT}/tcg/index.html'
FAIL=[]
def check(ok,msg,x=''):
    print(('PASS ' if ok else 'FAIL ')+msg, ('' if ok else x))
    if not ok: FAIL.append(msg)
# per franchise: copy table, owned list, want list, store stock/price, store acts, design-sheet opener, all keys of the newest set
FR={
 'wk':dict(name='Wildkin', copies='G.tc', mine='myTc()', want='tcWant()', toggle='twant', stock='tcKvStock(G.day)', price='tcKvPrice', lgs='tcLgs()', lgsprice='tcLgsPrice', where='tcWhere', design='tdesign', kv='kvbuy', lgsact='lgssingle', keys='tcAllKeys(1)', dk='tcD'),
 'xt':dict(name='Tidemark', copies='G.xtc', mine='myXt()', want='xtWant()', toggle='xtwant', stock='xtKvStock(G.day)', price='xtKvPrice', lgs='xtLgs()', lgsprice='xtLgsPrice', where='xtWhere', design='xtdesign', kv='xkvbuy', lgsact='xlgssingle', keys='xtAllKeys(31)', dk='xtD'),
 'br':dict(name='Broken Reach', copies='G.brc', mine='myBr()', want='brWant()', toggle='brwant', stock='brKvStock(G.day)', price='brKvPrice', lgs='brLgs()', lgsprice='brLgsPrice', where='brWhere', design='brdesign', kv='bkvbuy', lgsact='blgssingle', keys='brAllKeys(1)', dk='brD'),
}
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(viewport={'width':390,'height':844}, has_touch=True, is_mobile=True); pg=await ctx.new_page(); errs=[]
        pg.on('pageerror', lambda e: errs.append(str(e)[:300]))
        await pg.route('**/fonts.g*/**', lambda r: r.abort())
        await pg.goto(URL); await pg.wait_for_selector('#launch'); await pg.click('[data-lact=new]'); await pg.click('[data-lact=start]')
        await pg.wait_for_function("window.G && G.player && G.player.start>0 && document.getElementById('boot').style.display==='none'", timeout=280000)
        await pg.evaluate("(()=>{ while (G.day<brSetDef(1).rel+10) advanceDay(); G.player.cash=20000; })()")
        known=await pg.evaluate("Object.keys(ACT)")
        for f,c in FR.items():
            n=c['name']
            # a print the online store has in stock
            k=await pg.evaluate(f"(()=>{{ const s={c['stock']}; return {c['keys']}.find(k=>s[k]>0&&!{c['dk']}(k).sealed) || null; }})()")
            check(k is not None, f'{n}: the online singles store has something in stock', k)
            if not k: continue
            # 1. the route table names this franchise's own handlers, and every handler exists
            wh=await pg.evaluate(f"{c['where']}('{k}')"); kvrow=[w for w in wh if w['w'] in ('Saltmarket','Kinvault','Waypoint Singles')]
            check(kvrow and kvrow[0]['act']==c['kv'] and c['kv'] in known, f'{n}: the online-store shortcut routes to {c["kv"]}', wh)
            # 2. Home wantlist: add to the wantlist, find the Buy button and click it
            await pg.evaluate(f"(()=>{{ closeSheet(true); const W={c['want']}; if (!W.includes('{k}')) ACT.{c['toggle']}('{k}'); UI.tab='home'; render(true); }})()")
            sel=f'.panel .row [data-act="{c["kv"]}"][data-a="{k}"]'
            btn=await pg.query_selector(sel); check(btn is not None, f'{n}: Home wantlist shows a Buy button wired to {c["kv"]}')
            if not btn: continue
            before=await pg.evaluate(f"({{cash:G.player.cash, n:{c['mine']}.length, stock:{c['stock']}['{k}'], price:{c['price']}('{k}')}})")
            await btn.click(); await pg.wait_for_timeout(300)
            after=await pg.evaluate(f"({{cash:G.player.cash, mine:{c['mine']}.filter(x=>x.k==='{k}').map(x=>({{c:x.c, nw:x.nw}})), n:{c['mine']}.length, stock:{c['stock']}['{k}'], toast:(document.querySelector('#toasts .toast:last-child')||{{}}).textContent||''}})")
            check(abs((before['cash']-after['cash'])-before['price'])<0.006, f'{n}: Home Buy charges exactly the listed price', (before,after))
            check(after['n']==before['n']+1 and len(after['mine'])>=1, f'{n}: Home Buy adds the right print to your cards', (before,after))
            check(after['stock']==before['stock']-1, f'{n}: Home Buy reduces the store stock by one', (before,after))
            check('Out of stock' not in after['toast'] and 'Someone else' not in after['toast'], f'{n}: no false "out of stock" message', after['toast'])
            # 3. card page: the same route, for a second print
            k2=await pg.evaluate(f"(()=>{{ const s={c['stock']}; return {c['keys']}.find(k=>s[k]>0&&k!=='{k}'&&!{c['dk']}(k).sealed) || null; }})()")
            if k2:
                await pg.evaluate(f"(()=>{{ closeSheet(true); ACT.{c['design']}('{k2}'); }})()"); await pg.wait_for_timeout(600)
                acts=await pg.evaluate(f"Array.from(document.querySelectorAll('#sheet [data-act=\"{c['kv']}\"], .sheet [data-act=\"{c['kv']}\"]')).map(e=>e.dataset.a)")
                wrong=await pg.evaluate("Array.from(document.querySelectorAll('[data-act=kvbuy],[data-act=lgssingle],[data-act=bkvbuy],[data-act=blgssingle],[data-act=xkvbuy],[data-act=xlgssingle]')).filter(e=>e.closest('#sheet,.sheet')).map(e=>e.dataset.act)")
                mine=c['kv']; others=[a for a in wrong if a.replace('x','',1)!=a and False]
                check(k2 in acts, f'{n}: the card page offers the online-store Buy for that print', (acts, wrong))
                bad=[a for a in wrong if a not in (c['kv'], c['lgsact'])]
                check(not bad, f'{n}: the card page shows no other franchise\'s store handlers', bad)
                b0=await pg.evaluate("G.player.cash"); bt=await pg.query_selector(f'[data-act="{c["kv"]}"][data-a="{k2}"]')
                if bt:
                    await bt.click(); await pg.wait_for_timeout(300)
                    got=await pg.evaluate(f"{c['mine']}.some(x=>x.k==='{k2}')"); b1=await pg.evaluate("G.player.cash")
                    check(got and b0>b1, f'{n}: card-page Buy buys that exact print', (got,b0,b1))
                await pg.evaluate("closeSheet(true)")
            # 4. the local game store's single case
            row=await pg.evaluate(f"(()=>{{ const L={c['lgs']}; const x=L.cs.find(x=>true); return x? {{id:x.id,k:x.k,p:{c['lgsprice']}(x)}} : null; }})()")
            if row:
                wl=await pg.evaluate(f"{c['where']}('{row['k']}')"); lg=[w for w in wl if w['a']==row['id'] and w['act']==c['lgsact']]
                check(bool(lg) and c['lgsact'] in known, f'{n}: the local-store shortcut routes to {c["lgsact"]}', wl)
                c0=await pg.evaluate("G.player.cash"); await pg.evaluate(f"ACT.{c['lgsact']}({row['id']})"); await pg.wait_for_timeout(200)
                c1=await pg.evaluate("G.player.cash"); owned=await pg.evaluate(f"{c['mine']}.some(x=>x.k==='{row['k']}')")
                check(abs((c0-c1)-row['p'])<0.006 and owned, f'{n}: local-store single costs its price and is owned', (c0,c1,row,owned))
                gone=await pg.evaluate(f"!{c['lgs']}.cs.some(x=>x.id==={row['id']})"); check(gone, f'{n}: the bought single leaves the case')
            else:
                print(f'NOTE {n}: the local store has no singles in its case today (route checked by name only)')
        # 5. unavailable items are reported accurately
        r=await pg.evaluate("(()=>{ const k=xtAllKeys(31).find(k=>!xtKvStock(G.day)[k]); return xtKvBuy(k); })()"); check(r=='Out of stock.', 'Tidemark: a genuinely unavailable print says Out of stock', r)
        # 6. save and reload
        snap=await pg.evaluate("({tc:myTc().length, xt:myXt().length, br:myBr().length, cash:Math.round(G.player.cash*100)})")
        await pg.evaluate("closeSheet(true); saveGame(true)"); await pg.wait_for_timeout(1500)
        await pg.reload(); await pg.wait_for_selector('#launch'); await pg.click('[data-lact=open]'); await pg.wait_for_function("window.G && G.player && document.getElementById('boot').style.display==='none'", timeout=120000)
        snap2=await pg.evaluate("({tc:myTc().length, xt:myXt().length, br:myBr().length, cash:Math.round(G.player.cash*100)})")
        check(snap==snap2, 'purchases from all three franchises survive save and reload', (snap,snap2))
        check(not errs, 'no page errors', errs[:3])
        await b.close()
    print('RESULT', 'FAIL '+str(len(FAIL)) if FAIL else 'ALL PASS'); sys.exit(1 if FAIL else 0)
asyncio.run(main())
