#!/usr/bin/env python3
"""Checks a release candidate made by tools/release.py: python3 tools/release_test.py [port]
Serve it first: cd release/trading-card-collector-<version> && python3 -m http.server 8780
The package differs from the ordinary build in how Tidemark's paintings are stored (pak files), so this checks exactly that:
the package's own facts, that no file request fails, that paintings come out of the paks and are the same pictures as the loose
files in dist/, that card faces and pack wrappers draw with them, and that it works at a sub-path inside a frame (as on a host)."""
import sys, os, json, asyncio, hashlib
from playwright.async_api import async_playwright
PORT=sys.argv[1] if len(sys.argv)>1 else '8780'; URL=f'http://localhost:{PORT}/index.html'; ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); FAIL=[]
def check(ok,msg,x=''):
    print(('PASS ' if ok else 'FAIL ')+msg, ('' if ok else x))
    if not ok: FAIL.append(msg)
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(viewport={'width':390,'height':844}, is_mobile=True, has_touch=True); pg=await ctx.new_page(); errs=[]; bad=[]; reqs=[]
        pg.on('pageerror', lambda e: errs.append(str(e)[:300]))
        pg.on('response', lambda r: (reqs.append(r.url), bad.append((r.status,r.url)) if r.status>=400 and 'localhost' in r.url else None))
        await pg.route('**/fonts.g*/**', lambda r: r.abort())
        await pg.goto(URL); await pg.wait_for_selector('#launch')
        meta=json.loads(await (await ctx.request.get(f'http://localhost:{PORT}/RELEASE.json')).text())
        check(meta['files']<=1000 and meta['bytes']<=500*10**6, 'the package is within 1,000 files and 500 MB', meta)
        ver=await pg.evaluate("window.TCG_VERSION"); check(ver==meta['version'] and ver in await pg.title(), 'the version is in the page title and matches RELEASE.json', (ver, await pg.title()))
        check(await pg.evaluate("!!window.TM_PAKS && Object.keys(TM_PAKS.idx).length")==meta['tidemark_paintings_packed'], 'the painting index lists every packed painting')
        check(ver in await pg.evaluate("PACK.about"), 'the About text names the build')
        await pg.click('[data-lact=new]'); await pg.click('[data-lact=start]')
        await pg.wait_for_function("window.G && G.player && G.player.start>0 && document.getElementById('boot').style.display==='none'", timeout=280000)
        # paintings out of the paks are byte-for-byte the loose files of the ordinary build
        ids=await pg.evaluate("Object.keys(TM_PAKS.idx).filter((_,i)=>i%97===0)")
        same=0
        for i in ids:
            h=await pg.evaluate("""async id=>{ const p=tmPakOf('art/'+id+'.webp'); const b=await tmPakBytes(p); const d=await crypto.subtle.digest('SHA-256', b.slice()); return Array.from(new Uint8Array(d)).map(x=>x.toString(16).padStart(2,'0')).join(''); }""", i)
            f=os.path.join(ROOT,'dist','tcg','art',i+'.webp')
            if os.path.isfile(f) and hashlib.sha256(open(f,'rb').read()).hexdigest()==h: same+=1
        check(same==len(ids) and len(ids)>=10, f'{len(ids)} sampled paintings read from the paks are identical to the files in dist/', same)
        r=await pg.evaluate("""(async()=>{ const c=xtSetCards(31).find(c=>TM_ART[c.ill]&&TM_PAKS.idx[c.ill]); const im=await tmLoad(TM_ART[c.ill].u); return im? [im.naturalWidth, im.naturalHeight, im.src.slice(0,5)] : null; })()""")
        check(r and r[0]>100 and r[2]=='blob:', 'a Tidemark painting loads as a picture from its pak', r)
        r2=await pg.evaluate("""(async()=>{ const ids=Object.keys(TM_PAKS.idx).filter(i=>/^TMI-A/.test(i)); let ok=0; for (const id of ids){ const im=await tmLoad(TM_ART[id].u); if (im&&im.naturalWidth>100&&im.src.startsWith('blob:')) ok++; } return [ok, ids.length]; })()""")
        check(r2[1]>=10 and r2[0]==r2[1], 'every alternate-art painting (TMI-A..) loads from its pak', r2)
        # a card face drawn with it, in the game's own screens
        await pg.evaluate("(()=>{ while (G.day<xtSetDef(31).rel+2) advanceDay(); G.player.cash=500; })()")
        await pg.evaluate("(()=>{ RETAIL.ensure(); const k=xtKey(31,0,'P'); const p=RETAIL.profiles.find(p=>{ const x=G.retail.locations[p.id].stock[k]; return x&&x.q>=3; }); RETAIL.sealedBuy(p.id,k,2); const ids=myXt().filter(c=>xtD(c.k).sealed).map(c=>c.id).slice(0,1); xtOpenMany(ids); UI.tab='coll'; UI.cg='xt'; render(true); })()")
        await pg.wait_for_timeout(2500)
        drawn=await pg.evaluate("(()=>{ const c=myXt().find(c=>!xtD(c.k).sealed); ACT.xtopy(c.id); return true; })()"); await pg.wait_for_timeout(2500)
        faces=await pg.evaluate("Array.from(document.querySelectorAll('image')).filter(i=>(i.getAttribute('href')||'').startsWith('data:image')).length")
        check(faces>=1, 'Tidemark card faces are drawn (pictures made on a canvas from pak paintings)', faces)
        await pg.evaluate("closeSheet(true); UI.tab='xt'; render(true)"); await pg.wait_for_timeout(2000)
        wrap=await pg.evaluate("Array.from(document.querySelectorAll('#view image')).map(i=>(i.getAttribute('href')||'').slice(0,16))")
        check(any(w.startswith('data:image/webp') for w in wrap), 'a sealed pack\'s wrapper shows its painting once the pak has arrived', wrap[:4])
        check(not any('/art/TMI-' in u and 'TMI-0040' not in u for u in reqs), 'no loose Tidemark painting is requested', [u for u in reqs if '/art/TMI-' in u][:3])
        check(any('.pak' in u for u in reqs), 'pak files are requested', len(reqs))
        for tab in ['home','stores','shop','xt','br','market','coll']:
            await pg.evaluate(f"UI.tab='{tab}'; render(true)"); await pg.wait_for_timeout(250)
        check(not bad, 'no request for a file of the package fails', bad[:4])
        # save, reload, continue
        await pg.evaluate("closeSheet(true); saveGame(true)"); await pg.wait_for_timeout(1500); n=await pg.evaluate("myXt().length")
        await pg.reload(); await pg.wait_for_selector('#launch'); await pg.click('[data-lact=open]'); await pg.wait_for_function("window.G && G.player && document.getElementById('boot').style.display==='none'", timeout=120000)
        check(n==await pg.evaluate("myXt().length"), 'the game saves and continues in the package')
        check(not errs, 'no page errors', errs[:3])
        # inside a frame on another page, as a host embeds it (storage and relative paths must still work)
        pg2=await ctx.new_page(); e2=[]; pg2.on('pageerror', lambda e: e2.append(str(e)[:200]))
        await pg2.route('**/fonts.g*/**', lambda r: r.abort())
        await pg2.route('**/host.html', lambda r: r.fulfill(content_type='text/html', body=f'<html><body style="margin:0"><iframe src="{URL}" style="border:0;width:390px;height:800px" allow="fullscreen"></iframe></body></html>'))
        await pg2.goto(f'http://127.0.0.1:{PORT}/host.html'); fr=pg2.frames[-1] if len(pg2.frames)>1 else None
        await pg2.wait_for_timeout(1500); fr=[f for f in pg2.frames if f.url.endswith('index.html')]
        ok=False
        if fr:
            f=fr[0]; await f.wait_for_selector('#launch'); await f.click('[data-lact=new]'); await f.click('[data-lact=start]')
            await f.wait_for_function("window.G && G.player && G.player.start>0 && document.getElementById('boot').style.display==='none'", timeout=280000)
            await f.evaluate("saveGame(true)"); await pg2.wait_for_timeout(1500); ok=await f.evaluate("(async()=>(await slotList(PACK.id)).length>=1)()")
        check(ok and not e2, 'inside a cross-origin frame a new game starts and saves (as embedded by a host)', e2[:2])
        await b.close()
    print('RESULT', 'FAIL '+str(len(FAIL)) if FAIL else 'ALL PASS'); sys.exit(1 if FAIL else 0)
asyncio.run(main())
