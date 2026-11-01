#!/usr/bin/env python3
"""Broken Reach card faces: every ability text is shown in full and fits its box. python3 tools/br_layout_test.py [port] (needs dist/ served)"""
import sys, asyncio
from playwright.async_api import async_playwright
PORT=sys.argv[1] if len(sys.argv)>1 else '8770'
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); pg=await b.new_page(viewport={'width':390,'height':844}); await pg.route('**/fonts.g*/**', lambda r: r.abort())
        await pg.goto(f'http://localhost:{PORT}/tcg/index.html'); await pg.wait_for_selector('#launch'); await pg.click('[data-lact=new]'); await pg.click('[data-lact=start]'); await pg.wait_for_function("window.G && G.player && G.player.start>0 && document.getElementById('boot').style.display==='none'", timeout=280000)
        r=await pg.evaluate("""(()=>{ const out=[]; const host=document.createElement('div'); host.style.cssText='position:fixed;left:0;top:0;width:250px;opacity:0;pointer-events:none'; document.body.appendChild(host);
          for (const k of brAllKeys(1)){ const d=brD(k); if (d.sealed) continue; host.innerHTML=brFront(k); const svg=host.querySelector('svg'); const texts=Array.from(svg.querySelectorAll('text')).filter(t=>{ const y=+t.getAttribute('y'); return y>=245 && y<=281; });
            const full=(d.card.text||'').replace(/\\s+/g,' ').trim(); const shown=texts.map(t=>t.textContent).join(' ').replace(/\\s+/g,' '); let bottom=0, right=0, left=999; for (const t of texts){ const bb=t.getBBox(); bottom=Math.max(bottom,bb.y+bb.height); right=Math.max(right,bb.x+bb.width); left=Math.min(left,bb.x); }
            out.push({k, missing:full.split(' ').filter(w=>w.length>3&&!shown.includes(w)).length, bottom, right, left}); } host.remove(); return out; })()""")
        dropped=[x for x in r if x['missing']]; over=[x for x in r if x['bottom']>280.5]; wide=[x for x in r if x['right']>226 or (x['left']<24 and x['left']!=999)]
        print(f'{len(r)} face variants checked'); print(('PASS' if not dropped else 'FAIL'),'no ability text is dropped', dropped[:3]); print(('PASS' if not over else 'FAIL'),'every line sits inside the text box', over[:3]); print(('PASS' if not wide else 'FAIL'),'no line runs outside the box sides', wide[:3])
        await b.close(); sys.exit(1 if (dropped or over or wide) else 0)
asyncio.run(main())
