#!/usr/bin/env python3
"""Phone-width layout (browser viewport emulation, not a physical phone): python3 tools/phone_layout_test.py [port]   (needs dist/ served)
At 320, 360 and 390 px: no sideways scrolling, nothing pushed past the screen edge, sheets have a reachable close control, card pages fit."""
import sys, asyncio
from playwright.async_api import async_playwright
PORT=sys.argv[1] if len(sys.argv)>1 else '8770'; URL=f'http://localhost:{PORT}/tcg/index.html'; FAIL=[]
def check(ok,msg,x=''):
    print(('PASS ' if ok else 'FAIL ')+msg, ('' if ok else x))
    if not ok: FAIL.append(msg)
MEASURE="""(()=>{ const W=innerWidth; const sw=document.documentElement.scrollWidth; const bad=[]; for (const e of document.querySelectorAll('#view *, .nav *, .hdr *')){ const r=e.getBoundingClientRect(); if (r.width===0||r.height===0) continue; if (e instanceof SVGElement && e.tagName.toLowerCase()!=='svg') continue; const cs=getComputedStyle(e); if (cs.position==='fixed') continue; let p=e.parentElement, scroller=false; while (p && p!==document.body){ const o=getComputedStyle(p).overflowX; if ((o==='auto'||o==='scroll'||o==='hidden') && p.scrollWidth>p.clientWidth+1){ scroller=true; break; } p=p.parentElement; } if (!scroller && (r.right>W+1.5||r.left<-1.5)) bad.push((e.className||e.tagName)+':'+Math.round(r.left)+'-'+Math.round(r.right)); } return {W, sw, bad:bad.slice(0,6)}; })()"""
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); errs=[]
        for W in (320,360,390):
            ctx=await b.new_context(viewport={'width':W,'height':780}, is_mobile=True, has_touch=True); pg=await ctx.new_page(); pg.on('pageerror', lambda e: errs.append(str(e)[:200])); await pg.route('**/fonts.g*/**', lambda r: r.abort())
            await pg.goto(URL); await pg.wait_for_selector('#launch'); await pg.click('[data-lact=new]'); await pg.click('[data-lact=start]'); await pg.wait_for_function("window.G && G.player && G.player.start>0 && document.getElementById('boot').style.display==='none'", timeout=280000)
            await pg.evaluate("(()=>{ while (G.day<brSetDef(1).rel+10) advanceDay(); G.player.cash=4000; for (const [bs,om,gs] of [[tcBuySealed,tcOpenMany,1],[xtBuySealed,xtOpenMany,31],[brBuySealed,brOpenMany,1]]){ bs(gs,'P',3); } const ids=[...myTc(),...myXt(),...myBr()].filter(c=>0); try{ brOpenMany(myBr().filter(c=>brD(c.k).sealed).map(c=>c.id)); tcOpenMany(myTc().filter(c=>tcD(c.k).sealed).map(c=>c.id)); xtOpenMany(myXt().filter(c=>xtD(c.k).sealed).map(c=>c.id)); }catch(e){} })()")
            for tab,sub in [('home',None),('shop',None),('xt',None),('br',None),('market',None),('coll','cards'),('coll','sets'),('coll','grading'),('coll','journal')]:
                await pg.evaluate(f"UI.tab='{tab}'; {'UI.sub.coll=\"'+sub+'\";' if sub else ''} closeSheet(true); render(true); window.scrollTo(0,0)"); await pg.wait_for_timeout(250)
                m=await pg.evaluate(MEASURE); check(m['sw']<=m['W']+1 and not m['bad'], f"{W}px {tab}{'/'+sub if sub else ''}: no sideways scroll or overflow", m)
            # a card page and its close control
            for n,act,key in [('Wildkin','tcopy',"myTc().find(c=>!tcD(c.k).sealed).id"),('Tidemark','xtopy',"myXt().find(c=>!xtD(c.k).sealed).id"),('Broken Reach','bropy',"myBr().find(c=>!brD(c.k).sealed).id")]:
                await pg.evaluate(f"closeSheet(true); ACT.{act}({key})"); await pg.wait_for_timeout(500)
                r=await pg.evaluate("""(()=>{ const sh=document.querySelector('#sheet, .sheet'); if(!sh) return {none:true}; const sr=sh.getBoundingClientRect(); const x=sh.querySelector('[data-act=close],[data-act=sheetclose],.x,[aria-label*=Close],[aria-label*=close]'); const xr=x? x.getBoundingClientRect():null; return {w:Math.round(sr.width), W:innerWidth, sw:document.documentElement.scrollWidth, close: xr? [Math.round(xr.left),Math.round(xr.right),Math.round(xr.top),Math.round(xr.bottom)] : null, wide:Array.from(sh.querySelectorAll('*')).filter(e=>{ const r=e.getBoundingClientRect(); return r.width>0 && r.right>innerWidth+1.5 && !(e instanceof SVGElement && e.tagName.toLowerCase()!=='svg'); }).length, which:Array.from(sh.querySelectorAll('*')).filter(e=>{ const r=e.getBoundingClientRect(); return r.width>0 && r.right>innerWidth+1.5 && !(e instanceof SVGElement && e.tagName.toLowerCase()!=='svg'); }).slice(0,3).map(e=>e.tagName+' '+Math.round(e.getBoundingClientRect().right)+' '+(e.outerHTML||'').slice(0,120))}; })()""")
                check(not r.get('none') and r['sw']<=r['W']+1 and r['wide']==0 and r['close'] is not None and r['close'][1]<=r['W']+1 and r['close'][0]>=0, f'{W}px {n} card page fits the screen and its close control is reachable', r)
                await pg.evaluate("closeSheet(true)")
            await ctx.close()
        check(not errs, 'no page errors', errs[:3]); await b.close()
    print('RESULT', 'FAIL '+str(len(FAIL)) if FAIL else 'ALL PASS'); sys.exit(1 if FAIL else 0)
asyncio.run(main())
