import asyncio, sys, json
from playwright.async_api import async_playwright
PACK=sys.argv[1]; PORT=sys.argv[2] if len(sys.argv)>2 else '8770'
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(viewport={'width':390,'height':844}); pg=await ctx.new_page(); errs=[]
        pg.on('pageerror', lambda e: errs.append('PAGE '+str(e)[:200]))
        pg.on('console', lambda m: errs.append('CON '+m.text[:200]) if m.type=='error' and 'fonts.g' not in m.text and 'ERR_' not in m.text else None)
        await pg.route('**/fonts.g*/**', lambda r: r.abort())
        url=f'http://localhost:{PORT}/{PACK}/index.html'; await pg.goto(url); await pg.wait_for_selector('#launch', timeout=30000)
        await pg.screenshot(path=f'/tmp/sh_{PACK}_1launch.png')
        await pg.click('[data-lact=new]'); await pg.wait_for_selector('.lsc'); 
        scn=await pg.evaluate("[...document.querySelectorAll('.lsc b')].map(x=>x.textContent)"); print(PACK,'scenarios:',scn)
        await pg.screenshot(path=f'/tmp/sh_{PACK}_2new.png')
        await pg.click('[data-lact=start]')
        await pg.wait_for_function("window.G && G.player && G.player.start>0 && document.getElementById('boot').style.display==='none'", timeout=280000)
        w=await pg.evaluate("({day:G.day,cm:!!G.cm,tcg:!!G.tcg,cards:Object.keys(G.cards).length,tab:UI.tab,slot:SLOT.name})"); print('world', w)
        tabs=await pg.evaluate("TABS.map(t=>t[0])"); print('tabs', tabs)
        for t in tabs:
            await pg.evaluate(f"ACT.tab('{t}')"); await pg.wait_for_timeout(500); await pg.screenshot(path=f'/tmp/sh_{PACK}_tab_{t}.png')
            body=await pg.evaluate("document.querySelector('#view,#app')? document.querySelector('#app').innerText : ''")
            if 'went wrong' in body: print('BAD tab', t)
        await pg.evaluate("ACT.adv('7')"); await pg.wait_for_function("!UI.busy", timeout=120000); await pg.wait_for_timeout(1500)
        await pg.evaluate("closeSheet(true); if (UI.rvl) rvClose();")
        d1=await pg.evaluate("G.day"); await pg.evaluate("saveGame(true)"); await pg.wait_for_timeout(1500)
        sl=await pg.evaluate("slotList(PACK.id).then(a=>a.map(r=>({n:r.name,day:r.meta&&r.meta.day,size:r.size,enc:r.enc})))"); print('slots', sl)
        await pg.reload(); await pg.wait_for_selector('#launch'); await pg.screenshot(path=f'/tmp/sh_{PACK}_3continue.png')
        await pg.click('[data-lact=open]'); await pg.wait_for_function("window.G && G.player && document.getElementById('boot').style.display==='none'", timeout=120000)
        print('continued: day', d1, '->', await pg.evaluate("G.day"), 'same:', d1==await pg.evaluate("G.day"))
        await pg.evaluate("ACT.adv('1')"); await pg.wait_for_function("!UI.busy", timeout=60000)
        r=await pg.evaluate("""(async()=>{ const x=await slotExportBlob(SLOT.id); const f=new File([x.blob], x.name); const rec=await slotImportFile(f); const l=await slotList(PACK.id); return {file:x.name, kb:Math.round(x.blob.size/1024), imported:rec.name, total:l.length}; })()"""); print('export/import', r)
        await pg.evaluate("ACT.slots()"); await pg.wait_for_selector('#launch'); await pg.screenshot(path=f'/tmp/sh_{PACK}_4slots.png')
        print('ERRS', errs[:6]); await b.close()
asyncio.run(main())
