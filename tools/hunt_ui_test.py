#!/usr/bin/env python3
"""Out and about (the Hunt) and stores version 2 in a real browser: python3 tools/hunt_ui_test.py [port] [screenshot_dir]
Needs dist/ served (cd dist && python3 -m http.server 8770). Real clicks at phone size: the Out & about tab, a yard sale
(go, look, offer, buy), a shop's standing and price tags, a card show (enter, a table, buy), Home rows, layout from 320 to 1280 px,
save and reload."""
import sys, asyncio
from playwright.async_api import async_playwright
PORT=sys.argv[1] if len(sys.argv)>1 else '8770'; SHOTS=sys.argv[2] if len(sys.argv)>2 else None
URL=f'http://localhost:{PORT}/tcg/index.html'; FAIL=[]
def check(ok,msg,x=''):
    print(('PASS ' if ok else 'FAIL ')+msg, ('' if ok else x))
    if not ok: FAIL.append(msg)
OVER="(()=>{const w=document.documentElement.clientWidth;return [...document.querySelectorAll('#view *')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.right>w+2&&!e.closest('.chips,.tabs,[style*=overflow]')}).slice(0,3).map(e=>e.className+':'+Math.round(e.getBoundingClientRect().right))})()"
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(viewport={'width':390,'height':844}, is_mobile=True, has_touch=True); pg=await ctx.new_page(); errs=[]
        pg.on('pageerror', lambda e: errs.append(str(e)[:300]))
        await pg.route('**/fonts.g*/**', lambda r: r.abort())
        async def shot(name):
            if SHOTS: await pg.screenshot(path=f'{SHOTS}/{name}.png', full_page=True)
        await pg.goto(URL); await pg.wait_for_selector('#launch'); await pg.click('[data-lact=new]'); await pg.click('[data-lact=start]')
        await pg.wait_for_function("window.G && G.player && G.player.start>0 && document.getElementById('boot').style.display==='none'", timeout=280000)
        # --- the tab exists and explains itself before anything is posted ---
        await pg.evaluate("UI.tab='stores'; render(true)")
        await pg.click('[data-act=rtab][data-a=out]'); t=(await pg.inner_text('#view')).lower()
        check('outings left today' in t and 'yard sales this weekend' in t and 'card show' in t and 'hunting log' in t, 'Out & about shows outings, yard sales, the card show and the log')
        check('thursday' in t, 'an empty weekend says when sales are posted')
        await shot('01-out-empty')
        # --- a yard sale ---
        await pg.evaluate("(()=>{ let n=0; while(!CIRCUIT.H().leads.some(L=>L.ty==='yard'&&L.day===G.day) && n++<30) advanceDay(); G.player.cash=200; UI.tab='home'; render(true); })()")
        home=await pg.inner_text('#view'); check('yard sale today' in home, 'Home lists a yard sale that is on today')
        await pg.click('[data-act=hopen]'); await pg.wait_for_timeout(150)
        cards=await pg.query_selector_all('.hunt-card'); check(len(cards)>=1, 'the weekend\'s yard sales are listed as cards')
        await shot('02-out-saturday')
        go=await pg.query_selector('.hunt-card [data-act=hgo]:not([disabled])'); check(go is not None, 'today\'s sale has a Go button')
        await go.click(); await pg.wait_for_timeout(200); t=(await pg.inner_text('#view')).lower()
        check('what you can see' in t and 'buy the lot' in t, 'the sale shows what is on top and a price for the whole box')
        n=await pg.evaluate("document.querySelectorAll('.retail-inventory .retail-product').length"); check(4<=n<=6, 'six cards or fewer are visible at first', n)
        check((await pg.evaluate("CIRCUIT.outingsLeft()"))==1, 'going used one outing')
        check(not await pg.evaluate(OVER), 'the sale page fits a 390 px screen', await pg.evaluate(OVER))
        await shot('03-yard-sale')
        await pg.click('.retail-inventory .retail-product .mini'); await pg.wait_for_timeout(500)
        check(await pg.evaluate("UI.sheets.length>0"), 'tapping a card opens what you know about it')
        await pg.evaluate("closeSheet(true)")
        before=await pg.evaluate("({cash:G.player.cash, n:myTc().length+myXt().length+myBr().length, ask:CIRCUIT.leadOf(UI.huntLead).ask, cards:CIRCUIT.liveRefs(CIRCUIT.leadOf(UI.huntLead)).length})")
        await pg.click('[data-act=hhag]'); await pg.wait_for_timeout(150)
        ask=await pg.evaluate("CIRCUIT.leadOf(UI.huntLead).ask"); check((ask<before['ask'] or ask==round(before['ask']*1.1)) and await pg.query_selector('[data-act=hhag]') is None, 'one offer: taken, or refused and the price goes up; then the button is gone', (before['ask'],ask))
        await pg.click('[data-act=hbuy]'); await pg.wait_for_timeout(300)
        after=await pg.evaluate("({cash:G.player.cash, n:myTc().length+myXt().length+myBr().length, yard:CIRCUIT.H().stats.yard, lead:UI.huntLead})")
        check(abs(before['cash']-after['cash']-ask)<0.006 and after['n']==before['n']+before['cards'] and after['yard']==1 and after['lead'] is None, 'buying the box charges the ask and puts every card in the collection', (before,after))
        t=await pg.inner_text('#view'); check('Buy a lot at a yard sale' in t and 'your estimate' in t, 'the log records the lot and the goal')
        await shot('04-log')
        # --- a shop: standing, tags, limits ---
        await pg.evaluate("(()=>{ while (G.day<tcSetDef(1).rel+3) advanceDay(); G.player.cash=400; UI.retailTab='shops'; UI.tab='stores'; render(true); })()")
        await pg.click('[data-act=rvisit][data-a=cargo]'); await pg.wait_for_timeout(150); t=await pg.inner_text('#view')
        check('New face' in t and 'Saturdays' in t, 'a shop shows your standing and its new-stock day')
        check('’S COUNTER' not in t and '’s counter' in t.lower(), 'the owner line is spelled properly')
        await pg.click('[data-act=rmode][data-a=singles]'); await pg.wait_for_timeout(150); t=await pg.inner_text('#view')
        check('bargain bin' in t, 'the Cargo Cage shows what is in the bins')
        check(not await pg.evaluate(OVER), 'the shop page fits a 390 px screen', await pg.evaluate(OVER))
        await shot('05-cargo-singles')
        r=await pg.evaluate("(()=>{ const s=G.retail.locations.cargo; const ref=s.singles[0]; const c=RETAIL.getCopy(ref.g,ref.id); const p=RETAIL.singlePrice('cargo',ref.g,c), c0=G.player.cash; document.querySelector('[data-act=rsingle]').click(); return {paid:Math.round((c0-G.player.cash)*100)/100, rep:s.rep}; })()")
        check(r['paid']>0 and r['rep']>=1, 'buying a single charges its tag and the shop notices you', r)
        await pg.evaluate("G.retail.locations.cargo.rep=20; render(true)"); await pg.evaluate("document.querySelector('.retail-store-head details').open=true")
        t=await pg.inner_text('#view'); check('Familiar face' in t and 'What you have learned' in t and 'by rarity' in t, 'a familiar face learns how the owner prices')
        await shot('06-cargo-familiar')
        await pg.click('[data-act=rback]'); await pg.click('[data-act=rvisit][data-a=super-centre]'); await pg.wait_for_timeout(150); t=await pg.inner_text('#view')
        check('limit' in t.lower(), 'a launch-week product at a chain shows its per-customer limit', t[:600])
        await shot('07-bigbox-launch')
        await pg.evaluate("UI.tab='shop'; render(true)"); t=(await pg.inner_text('#view')).lower(); check('wildkin around town' in t, 'the Wildkin tab shows where Wildkin is on a shelf')
        await shot('08-wildkin-tab')
        # --- the card show ---
        await pg.evaluate("(()=>{ while (CIRCUIT.showDay(G.day)!==G.day) advanceDay(); G.player.cash=300; UI.tab='home'; render(true); })()")
        home=await pg.inner_text('#view'); check('Card show today' in home, 'Home announces the card show on its day')
        await pg.click('[data-act=hshowgo]'); await pg.wait_for_timeout(150)
        await shot('09-show-door')
        c0=await pg.evaluate("G.player.cash"); await pg.click('[data-act=hshow]'); await pg.wait_for_timeout(200)
        check(abs(c0-await pg.evaluate("G.player.cash")-5)<0.006, 'entry costs $5')
        tabs=await pg.query_selector_all('[data-act=htable]'); check(len(tabs)>=3, 'the dealers\' tables are there', len(tabs))
        await tabs[-1].click(); await pg.wait_for_timeout(150)
        check(not await pg.evaluate(OVER), 'the show fits a 390 px screen', await pg.evaluate(OVER))
        await shot('10-show-table')
        n0=await pg.evaluate("myTc().length+myXt().length+myBr().length"); await pg.click('[data-act=hsb]:not([disabled])'); await pg.wait_for_timeout(200)
        check(await pg.evaluate("myTc().length+myXt().length+myBr().length")==n0+1, 'buying at a table adds the card')
        # --- widths ---
        for w in [320,360,430,768,1280]:
            await pg.set_viewport_size({'width':w,'height':844})
            for setup in ["UI.tab='stores';UI.retailTab='out';UI.huntShow=false;UI.huntLead=null;UI.retailLocation=null", "UI.tab='stores';UI.retailTab='out';UI.huntShow=true", "UI.tab='stores';UI.retailTab='shops';UI.huntShow=false;UI.retailLocation='lantern';UI.retailMode='singles'", "UI.tab='stores';UI.retailLocation=null;UI.retailTab='shops'"]:
                await pg.evaluate(setup+"; render(true)"); o=await pg.evaluate(OVER)
                if o: check(False, f'no overflow at {w}px ({setup[:60]})', o)
        check(True, 'layouts checked at 320, 360, 430, 768 and 1280 px')
        await pg.set_viewport_size({'width':390,'height':844})
        # --- save and reload ---
        snap=await pg.evaluate("JSON.stringify([CIRCUIT.H().stats, G.retail.locations.cargo.rep, Object.keys(CIRCUIT.H().goals).sort()])")
        await pg.evaluate("closeSheet(true); saveGame(true)"); await pg.wait_for_timeout(1500)
        await pg.reload(); await pg.wait_for_selector('#launch'); await pg.click('[data-lact=open]'); await pg.wait_for_function("window.G && G.player && document.getElementById('boot').style.display==='none'", timeout=120000)
        check(snap==await pg.evaluate("JSON.stringify([CIRCUIT.H().stats, G.retail.locations.cargo.rep, Object.keys(CIRCUIT.H().goals).sort()])"), 'the log, goals and standing survive save and reload')
        check(not errs, 'no page errors', errs[:3])
        await b.close()
    print('RESULT', 'FAIL '+str(len(FAIL)) if FAIL else 'ALL PASS'); sys.exit(1 if FAIL else 0)
asyncio.run(main())
