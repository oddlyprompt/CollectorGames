#!/usr/bin/env python3
"""Tidemark screens, driven like a player (needs the dist server on 8770 and a built tcg).

Taps every Tidemark marketplace listing, a spread of price pages, the player's own card sheets, the shop tabs, the Saltmarket page, the grading
return list and the collection, and fails on any 'Something went wrong' sheet or page error. Runs on both economies.
  python3 tools/tidemark_ui_test.py"""
import asyncio, sys, json
from playwright.async_api import async_playwright
PORT='8770'; ERRS=[]; RES=[]
def check(name, ok, detail=''):
    RES.append(ok); print(('PASS ' if ok else 'FAIL ')+name+(' | '+str(detail)[:400] if detail!='' else ''))
TAPS="""async(ver)=>{ window.__xtEcon=ver; await newGame(77,null); migrate(); UI.scn=null; G.player.cash=1e6; for (let i=0;i<30;i++) advanceDay();
  const bad=[]; const txt=()=>document.querySelector('#sheetroot').innerText; const tap=(label,fn)=>{ try { fn(); const t=txt(); if (/Something went wrong|Unavailable/.test(t)) bad.push(label); } catch(e){ bad.push(label+' threw '+String(e.message).slice(0,80)); } closeSheet(true); };
  const out={}; const xl=G.lst.filter(l=>l.it==='x'); out.listings=xl.length;
  for (const l of xl) tap('listing '+l.id+' '+G.xtc[l.ref].k, ()=>ACT.listing(String(l.id)));
  // price pages: sealed, foil, alt, old, new, one per rarity and set group
  const keys=[]; for (let s of [1,2,7,12,18,25,29,30,31]){ const ks=xtAllKeys(s); keys.push(ks[0], ks[Math.floor(ks.length/2)], ks[ks.length-1], xtKey(s,0,'P'), xtKey(s,0,'B')); }
  out.designs=keys.length; for (const k of keys) tap('design '+k, ()=>ACT.xtdesign(k));
  // the player's own cards: buy a spread of listings, then open each card sheet, list one, grade one
  let bought=0; for (const l of xl.slice(0,60)){ if (l.ty==='bin' && l.sel!==0 && buyListing(l.id)==null) bought++; }
  const mine=myXt(); out.bought=bought; out.mine=mine.length; for (const c of mine.slice(0,40)) tap('own '+c.k, ()=>ACT.xtopy(String(c.id)));
  const raw=mine.find(c=>c.g===0&&!xtD(c.k).sealed); if (raw){ out.grade=xtSubmitGrade(raw.id, GRADE_TIERS[0].id); for (let i=0;i<GRADE_TIERS[0].days+1;i++) advanceDay(); out.rv=(G.player.rv||[]).length; tap('grading return list', ()=>openSheet(()=>rvSummary((G.player.rv||[]).slice()))); }
  const s2=mine.find(c=>xtD(c.k).sealed); if (s2){ tap('sealed copy', ()=>ACT.xtopy(String(s2.id))); }
  // opening: every kind of pack and box, through the opening screen, card by card
  const openBad=[]; const NL=String.fromCharCode(10); for (let s=1;s<=31;s++){ for (const f of ['P','B']){ for (let t=0;t<(f==='B'?1:3);t++){ let step='give'; try { const cp=xtMakeCopy(xtKey(s,0,f),0,[G.day,'bought',5,'test'],'shop'); cp.nw=1; step='open'; const r=xtOpenSealed(cp.id); step='screen'; xtoStart(r); const st=UI.xto; for (let p=0;p<st.res.packs.length;p++){ ACT.xtopack(String(p)); for (let c=0;c<st.res.packs[p].length+1;c++){ ACT.xtoflip(); ACT.xtonextcard(); } } ACT.xtosum(); closeSheet(true); const o=document.getElementById('tco'); if (o) o.remove(); UI.xto=null; } catch(e){ openBad.push(s+f+' '+step+' '+String(e.message).slice(0,60)); UI.xto=null; } } } } out.openBad=openBad;
  // the Tidemark tab, its three shops, Saltmarket pages, the collection and Home
  const views=[]; for (const sub of ['retail','lgs','kv']){ UI.xtstore=sub; try { const h=xtShopV(); if (!h||/Something went wrong/.test(h)) views.push('shop '+sub); } catch(e){ views.push('shop '+sub+' threw '+String(e.message).slice(0,80)); } }
  for (const v of ['xt','market','coll','home']){ try { const h=VIEWS[v](); if (typeof h!=='string'||h.length<50) views.push('view '+v); } catch(e){ views.push('view '+v+' threw '+String(e.message).slice(0,80)); } }
  UI.mf=UI.mf||{}; for (const t of ['xt','xts','xtsl','xtgr','xtraw','xthol']){ try { UI.mf.type=t; marketFiltered(); VIEWS.market(); } catch(e){ views.push('market filter '+t+' threw '+String(e.message).slice(0,80)); } } UI.mf.type='all';
  out.bad=bad; out.views=views; return out; }"""
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(viewport={'width':430,'height':900}); pg=await ctx.new_page(); pg.on('pageerror', lambda e: ERRS.append(str(e)[:300]))
        pg.on('console', lambda m: ERRS.append('console: '+m.text[:200]) if m.type=='error' and 'Failed to load resource' not in m.text else None)
        await pg.route('**/fonts.g*/**', lambda r: r.abort()); await pg.goto(f'http://localhost:{PORT}/tcg/index.html'); await pg.wait_for_selector('#launch'); await pg.click('[data-lact=new]'); await pg.click('[data-lact=start]')
        await pg.wait_for_function("window.G && G.player && G.player.start>0 && document.getElementById('boot').style.display==='none'", timeout=90000)
        for ver in ('v2','v1'):
            r=await pg.evaluate(TAPS, ver); print(ver, {k:r[k] for k in ('listings','designs','bought','mine','grade','rv')})
            check(ver+': every Tidemark listing, price page and own card opens ('+str(r['listings'])+' listings, '+str(r['designs'])+' price pages, '+str(r['mine'])+' cards)', not r['bad'], r['bad'][:6])
            check(ver+': every kind of pack and box (all 31 sets) opens card by card on the opening screen', not r['openBad'], r['openBad'][:6])
            check(ver+': the shop tabs, Saltmarket, collection, market filters and Home render', not r['views'], r['views'])
        await b.close()
    check('no page errors or console errors', not ERRS, ERRS[:4])
    print('RESULT', 'ALL PASS' if all(RES) else 'FAILED'); sys.exit(0 if all(RES) else 1)
asyncio.run(main())
