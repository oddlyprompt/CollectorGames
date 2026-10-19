#!/usr/bin/env python3
"""Headless Tidemark economy run: starts a world and plays it forward, printing prices and metagame health every month.

  python3 tools/tidemark_econ.py [months] [port]      (needs the dist server; default 12 months)

Reads the numbers the CLAUDE.md Tidemark section talks about: pack and box value against $4.99 / $144, median value per rarity for
Tenth Tide and for the history, the top chase cards, the top deck's share, field size and bans."""
import asyncio, sys, json
from playwright.async_api import async_playwright
MONTHS=int(sys.argv[1]) if len(sys.argv)>1 else 12; PORT=sys.argv[2] if len(sys.argv)>2 else '8770'
SNAP="""(()=>{ const T=31; const rel=tcReleasedSets(G.day).includes(T); const med=a=>a.length? +a.slice().sort((x,y)=>x-y)[Math.floor(a.length/2)].toFixed(2):0;
  const grp=(set)=>{ const by={}; for (const k of tcAllKeys(set)){ const d=tcD(k); const g=d.rar+(d.v==='F'?' foil':''); (by[g]=by[g]||[]).push(tcFairRaw(k)); } const t={}; for (const g in by) t[g]=med(by[g]); return t; };
  const top=(sets,n)=>sets.flatMap(tcAllKeys).map(k=>[k,tcFairRaw(k)]).sort((a,b)=>b[1]-a[1]).slice(0,n).map(([k,x])=>tcD(k).card.name+' '+tcD(k).def.code+' '+tcD(k).v+' $'+x.toFixed(0));
  const A=G.tcg.arch; const hist=[]; for (let s=1;s<T;s++) hist.push(s);
  return {date:fmtDate(G.day,true), tt:{ev:+tcPackEV(T).toFixed(2), pack:+tcFairRaw(tcKey(T,0,'P')).toFixed(2), box:+tcFairRaw(tcKey(T,0,'B')).toFixed(0), med:grp(T), top:top([T],3)},
    old:{ft:{ev:+tcPackEV(1).toFixed(2), box:+tcFairRaw(tcKey(1,0,'B')).toFixed(0), med:grp(1)}, tl:{ev:+tcPackEV(30).toFixed(2), box:+tcFairRaw(tcKey(30,0,'B')).toFixed(0), med:grp(30)}, top:top(hist,5)},
    decks:A.length, topDeck:A.length? A[0].name+' '+(A[0].sh*100).toFixed(0)+'%':'', bans:Object.keys(G.tcg.ban).length, stock:G.tcg.shop[T], t5:A.slice(0,5).map(a=>[a.id,a.name,+a.sh.toFixed(3)]), nf:A.length, tc:Object.keys(G.tc).length, lst:G.lst.length}; })()"""
def meta_summary(rows):
    R=[r for r in rows if r.get('t5')]
    if not R: return
    first={}; leads=[]; streak=best=0; prev=None
    for i,r in enumerate(R):
        for x in r['t5']: first.setdefault(x[0],(i,x[1]))
        lid=r['t5'][0][0]; leads.append(lid); streak=streak+1 if lid==prev else 1; best=max(best,streak); prev=lid
    late=[n for k,(i,n) in first.items() if i>=3]
    print('META months %d | different leading decks %d | decks ever in the top 5: %d | new to the top 5 after month 3: %d %s | longest run at #1: %d months'%(len(R),len(set(leads)),len(first),len(late),late[:12],best))
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); pg=await (await b.new_context()).new_page(); errs=[]
        pg.on('pageerror', lambda e: errs.append(str(e)[:200])); await pg.route('**/fonts.g*/**', lambda r: r.abort())
        await pg.goto(f'http://localhost:{PORT}/tidemark/index.html'); await pg.wait_for_selector('#launch'); await pg.click('[data-lact=new]'); await pg.click('[data-lact=start]')
        await pg.wait_for_function("window.G && G.player && G.player.start>0 && document.getElementById('boot').style.display==='none'", timeout=280000)
        rows=[await pg.evaluate(SNAP)]
        for m in range(MONTHS):
            await pg.evaluate("(()=>{ for (let i=0;i<30;i++) advanceDay(); })()"); rows.append(await pg.evaluate(SNAP))
        for r in rows: print(json.dumps(r))
        meta_summary(rows)
        print('ERRS', errs[:3]); await b.close()
asyncio.run(main())
