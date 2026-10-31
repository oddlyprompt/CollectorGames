#!/usr/bin/env python3
"""Browser test for the Broken Reach Play Alpha: python3 tools/brokenreach_uitest.py [port]  (needs dist/ served, e.g. cd dist && python3 -m http.server 8770)
Plays complete matches against all three AI levels, checks rematch, deckbuilder, planets, save separation and mobile layout."""
import sys, asyncio, json
from playwright.async_api import async_playwright
PORT=sys.argv[1] if len(sys.argv)>1 else '8770'; URL=f'http://localhost:{PORT}/tcg/broken-reach/'
res=[]; errs=[]
def check(ok,msg,x=''):
    res.append(ok); print(('PASS ' if ok else 'FAIL ')+msg, x if (x!='' and not ok) else '')
async def play_match(pg, maxsteps=60):
    for _ in range(maxsteps*6):
        if await pg.query_selector('#result'): return True
        try:
            if await pg.query_selector('#mhand .bcard:not(.dis)'):
                sel=await pg.query_selector('#mhand .bcard:not(.dis)'); await sel.click(timeout=2000)
                cell=await pg.query_selector('.cell.ok')
                if cell:
                    await cell.click(timeout=2000); await pg.wait_for_selector('.cell.pend',timeout=2000)
                    btn=await pg.query_selector('[data-act=confirm]'); await btn.click(timeout=2000)
        except Exception:
            pass                                    # the board changed under the bot (the opponent's move or the result screen): look again
        await pg.wait_for_timeout(120)
    return False
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); 
        for name,vp in (('desktop',{'width':1280,'height':800}),('mobile',{'width':390,'height':780})):
            ctx=await b.new_context(viewport=vp, has_touch=(name=='mobile'), is_mobile=(name=='mobile')); pg=await ctx.new_page(); pg.on('pageerror',lambda e:errs.append(str(e)+' | '+str(getattr(e,'stack',''))[:600])); pg.on('console',lambda m: errs.append(m.text) if m.type=='error' and 'fonts.g' not in m.text and 'Failed to load resource' not in m.text else None)
            await pg.goto(URL); await pg.wait_for_selector('[data-act=play]')
            await pg.screenshot(path=f'/tmp/br_{name}_menu.png')
            await pg.click('[data-act=play]'); await pg.wait_for_selector('[data-act=start]'); await pg.screenshot(path=f'/tmp/br_{name}_setup.png')
            await pg.click('[data-act=speed]') if False else None
            levels=['easy','standard','hard'] if name=='desktop' else ['standard']
            for lv in levels:
                await pg.click(f'[data-act=sellevel][data-id={lv}]')
                await pg.click('[data-act=start]'); await pg.wait_for_selector('#mboard .cell')
                if lv=='standard': 
                    await pg.evaluate("BR_TEST.ST.speed='0'")
                await pg.wait_for_timeout(300); await pg.screenshot(path=f'/tmp/br_{name}_match_{lv}_start.png')
                ok=await play_match(pg); check(ok,f'{name}: a full match against {lv} AI reaches a result screen')
                if ok:
                    t=await pg.inner_text('#result h2'); sc=await pg.inner_text('#result .sc'); print('   result',t,sc)
                    cnt=await pg.evaluate("BR_TEST.E.score(BR_TEST.M.S)"); check(sum(cnt)==16,f'{name}: board full at the end, 16 cards',cnt)
                    await pg.screenshot(path=f'/tmp/br_{name}_result_{lv}.png')
                    await pg.click('#result [data-act=rematch]'); await pg.wait_for_selector('#mboard .cell'); n=await pg.evaluate("BR_TEST.M.S.turn"); check(n==0,f'{name}: rematch starts a fresh match')
                    await pg.evaluate("BR_TEST.show('setup')")
            # animation mid-cascade screenshot on desktop: run a forced cascade with animations on
            if name=='desktop':
                await pg.evaluate("BR_TEST.ST.speed='1'"); await pg.click('[data-act=start]'); await pg.wait_for_selector('#mboard .cell')
                await pg.wait_for_timeout(2500)
                for _ in range(40):
                    if await pg.query_selector('#mhand .bcard:not(.dis)'): break
                    await pg.wait_for_timeout(250)
                await pg.screenshot(path='/tmp/br_desktop_match_mid.png')
                # preview: select a card, hover a cell
                await pg.click('#mhand .bcard:not(.dis)'); await pg.hover('.cell.ok'); await pg.wait_for_timeout(200); await pg.screenshot(path='/tmp/br_desktop_preview.png')
                await pg.evaluate("BR_TEST.show('menu')")
            if name=='desktop':   # greedy human bot with animations ON: capture screenshots of a cascade banner
                await pg.evaluate("BR_TEST.show('setup')"); await pg.click('[data-act=sellevel][data-id=standard]'); await pg.evaluate("window.__sawBanner=false; new MutationObserver(()=>{ if(document.querySelector('.banner')) window.__sawBanner=true; }).observe(document.body,{subtree:true,childList:true})"); await pg.click('[data-act=start]'); await pg.wait_for_selector('#mboard .cell'); shot=False; seen_banner=False
                for _ in range(400):
                    if await pg.query_selector('#result'): break
                    if await pg.query_selector('.banner'):
                        seen_banner=True
                        if not shot: await pg.screenshot(path='/tmp/br_desktop_cascade.png'); shot=True
                    if await pg.query_selector('#mhand .bcard:not(.dis)'):
                        mv=await pg.evaluate("(()=>{const E=BR_TEST.E,S=BR_TEST.M.S;let best=null,bv=-1;for(const m of E.legalMoves(S)){const r=E.applyMove(S,m);const v=r.stats.captures+r.stats.maxGen*0.1;if(v>bv){bv=v;best=m}}return best})()")
                        await pg.click(f'#mhand .bcard[data-cid="{mv["cid"]}"]'); await pg.click(f'.cell[data-i="{mv["cell"]}"]'); 
                        await pg.evaluate("(mv)=>{BR_TEST.M.pend=mv;BR_TEST.render()}",mv); await pg.click('[data-act=confirm]')
                    await pg.wait_for_timeout(80)
                seen_banner=await pg.evaluate('window.__sawBanner'); check(seen_banner,'a cascade banner appears during a greedy human game with animations on')
                await pg.screenshot(path='/tmp/br_desktop_afterbot.png')
                await pg.evaluate("BR_TEST.ST.speed='0'; BR_TEST.show('menu')")
            if name=='desktop':   # the card you select is the card that is placed (not the first card in hand)
                await pg.evaluate("document.querySelectorAll('.ov').forEach(o=>o.remove()); BR_TEST.ST.speed='0'; BR_TEST.show('setup')"); await pg.click('[data-act=sellevel][data-id=easy]'); await pg.click('[data-act=start]'); await pg.wait_for_selector('#mboard .cell')
                for _ in range(80):
                    if await pg.query_selector('#mhand .bcard:not(.dis)'): break
                    await pg.wait_for_timeout(100)
                cards=await pg.query_selector_all('#mhand .bcard'); cid=await cards[3].get_attribute('data-cid'); await pg.click(f'#mhand .bcard[data-cid="{cid}"]'); await pg.click('.cell.ok'); await pg.click('[data-act=confirm]'); await pg.wait_for_timeout(400)
                placed=await pg.evaluate("BR_TEST.M.S.log[BR_TEST.M.S.log.length>1&&BR_TEST.M.S.log[0].p===1?1:0].cid") if False else await pg.evaluate("(()=>{const l=BR_TEST.M.S.log.filter(x=>x.p===0);return l[l.length-1].cid})()")
                check(placed==cid,'the card you select is the card that is placed',(placed,cid))
            # deckbuilder
            await pg.evaluate("BR_TEST.show('decks')"); await pg.click('[data-act=newdeck]'); await pg.wait_for_selector('[data-act=add]')
            for i in range(24):
                a=await pg.query_selector('[data-act=add]:not([disabled])')
                if a: await a.click()
            n=await pg.evaluate("document.querySelector('.cnt').textContent"); check(n=='20/20','deckbuilder stops at 20 cards',n)
            await pg.screenshot(path=f'/tmp/br_{name}_deck.png')
            await pg.click('[data-act=savedeck]'); await pg.wait_for_selector('[data-act=usedeck]')
            dn=await pg.evaluate("BR_TEST.ST.decks.length"); check(dn==1,'a custom deck is saved in this browser only',dn)
            ls=await pg.evaluate("Object.keys(localStorage)"); check(ls==['br_alpha_v1'],'only the Broken Reach localStorage key is used',ls)
            dbs=await pg.evaluate("indexedDB.databases ? indexedDB.databases().then(d=>d.map(x=>x.name)) : []"); check(not dbs,'no IndexedDB (CollectorGames saves) is created or touched',dbs)
            ok2=await pg.evaluate("document.documentElement.scrollWidth<=window.innerWidth+1"); check(ok2,f'{name}: no horizontal scroll')
            await ctx.close()
        # launcher entry in the Trading Card Collector
        ctx=await b.new_context(viewport={'width':420,'height':800}); pg=await ctx.new_page(); await pg.goto(f'http://localhost:{PORT}/tcg/'); await pg.wait_for_selector('.launch',timeout=20000)
        link=await pg.query_selector('.launch a[href="broken-reach/"]'); check(bool(link),'the Trading Card Collector launcher has a Play Alpha entry')
        await b.close()
    check(not errs,'no page errors or console errors',errs[:5])
    print('RESULT','ALL PASS' if all(res) else 'FAIL %d'%(len(res)-sum(res))); sys.exit(0 if all(res) else 1)
asyncio.run(main())
