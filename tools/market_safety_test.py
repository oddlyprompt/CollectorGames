#!/usr/bin/env python3
"""Offer protection and valuation clarity: python3 tools/market_safety_test.py [port]   (needs dist/ served)"""
import sys, asyncio
from playwright.async_api import async_playwright
PORT=sys.argv[1] if len(sys.argv)>1 else '8770'; URL=f'http://localhost:{PORT}/tcg/index.html'; FAIL=[]
def check(ok,msg,x=''):
    print(('PASS ' if ok else 'FAIL ')+msg, ('' if ok else x))
    if not ok: FAIL.append(msg)
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(viewport={'width':390,'height':844}, is_mobile=True, has_touch=True); pg=await ctx.new_page(); errs=[]
        pg.on('pageerror', lambda e: errs.append(str(e)[:300])); await pg.route('**/fonts.g*/**', lambda r: r.abort())
        await pg.goto(URL); await pg.wait_for_selector('#launch'); await pg.click('[data-lact=new]'); await pg.click('[data-lact=start]')
        await pg.wait_for_function("window.G && G.player && G.player.start>0 && document.getElementById('boot').style.display==='none'", timeout=280000)
        await pg.evaluate("(()=>{ while (G.day<brSetDef(1).rel+10) advanceDay(); G.player.cash=5000; })()")
        # --- offers above the asking price are refused and cost nothing ---
        r=await pg.evaluate("""(()=>{ const l=G.lst.find(x=>x.ty==='bin'&&x.off&&x.sel!==0&&x.pr>=1); if(!l) return null; const c0=G.player.cash, t0=l.tried||0;
          const hi=playerOffer(l.id, Math.round((l.pr*7.75)*100)/100), eq=playerOffer(l.id, l.pr); const same=G.lst.includes(l);
          return {pr:l.pr, hi, eq, cash:G.player.cash===c0, tried:(l.tried||0)===t0, listed:same}; })()""")
        check(r is not None, 'a buy-it-now listing that takes offers exists')
        if r:
            check('err' in r['hi'] and 'asking price' in r['hi']['err'] and 'Buy now' in r['hi']['err'], 'an offer far above the ask is refused with an explanation', r['hi'])
            check('err' in r['eq'], 'an offer equal to the ask is refused too (use Buy now)', r['eq'])
            check(r['cash'] and r['tried'] and r['listed'], 'a refused offer costs nothing, uses no attempt and leaves the listing', r)
        # an offer below the ask settles at exactly the offered amount, to the cent
        s=await pg.evaluate("""(()=>{ for (const l of G.lst.filter(x=>x.ty==='bin'&&x.off&&x.sel!==0&&x.pr>=2)){ const amt=Math.round(l.pr*0.97*100)/100; const c0=G.player.cash; const res=playerOffer(l.id, amt); if (res.ok){ return {amt, paid:Math.round((c0-G.player.cash)*100)/100}; } } return null; })()""")
        if s: check(abs(s['amt']-s['paid'])<0.0001, 'an accepted offer is charged exactly the offered amount to the cent', s)
        else: print('NOTE no seller accepted a 97% offer in this world (settlement rounding not exercised)')
        # --- estimates: one odd sale cannot move a thin market, a real market move still does ---
        e=await pg.evaluate("""(()=>{ const k=brAllKeys(1).find(k=>!brD(k).sealed&&brD(k).v==='N'&&brD(k).card.rar==='rare'); G.sales[k]=[]; const a=brEst(k,0); const fv=a.fv;
          G.sales[k]=[[G.day-1, fv*8, 0]]; const one=brEst(k,0);
          G.sales[k]=Array.from({length:10},(_,i)=>[G.day-1-i, fv*3, 0]); const many=brEst(k,0); G.sales[k]=[];
          const mid=x=>(x.lo+x.hi)/2; return {fv, base:mid(a), one:mid(one), many:mid(many), oneObj:one, manyObj:many}; })()""")
        check(e['one']<e['fv']*1.8, 'one sale at 8x fair value barely moves a thin estimate', e)
        check(e['many']>e['fv']*1.8, 'ten consistent sales at 3x fair value do move the estimate (price discovery survives)', e)
        check(e['oneObj']['n']==1 and e['oneObj']['thin'] and e['manyObj']['n']==10 and not e['manyObj']['thin'] and e['oneObj']['med']>e['fv']*7, 'the estimate reports sample size, thinness, fair value and the raw median', e['oneObj'])
        # the card page explains the pieces
        t=await pg.evaluate("""(()=>{ const k=brAllKeys(1).find(k=>!brD(k).sealed&&brD(k).v==='N'&&brD(k).card.rar==='rare'); G.sales[k]=[[G.day-1,9,0]]; brBuySealed(1,'P',1); const cp=Object.values(G.brc).find(c=>c.k===k)||null; return {has:!!cp}; })()""")
        html=await pg.evaluate("""(()=>{ const k=brAllKeys(1).find(k=>!brD(k).sealed); const cp=brMakeCopy(k,0,[G.day,'bought',1,'test'],'shop'); const sh=brCopySheet? brCopySheet(cp.id):null; return sh? sh.h : 'NOSHEET'; })()""")
        if html!='NOSHEET':
            low=html.lower(); check('model fair value' in low and 'recent sales of this print and grade' in low and 'asking prices' in low, 'the card page separates model fair value, recent sales and asking prices', low[:200])
        check(not errs, 'no page errors', errs[:3])
        await b.close()
    print('RESULT', 'FAIL '+str(len(FAIL)) if FAIL else 'ALL PASS'); sys.exit(1 if FAIL else 0)
asyncio.run(main())
