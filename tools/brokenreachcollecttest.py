#!/usr/bin/env python3
"""The Broken Reach collector line inside the Trading Card Collector: catalogue against cards.json, packs and odds, the release timeline, prices, the shops,
opening, collection, market, grading, screens, saves and an old save upgraded.   python3 tools/brokenreachcollecttest.py [port]   (build tcg first; serve dist)"""
import asyncio, sys, json, os
from playwright.async_api import async_playwright
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); PORT=sys.argv[1] if len(sys.argv)>1 else '8770'
FAIL=[]
def check(ok, what, detail=''):
    print(('PASS ' if ok else 'FAIL ')+what+(('  '+str(detail)) if detail!='' else '')); (FAIL.append(what) if not ok else None)
CJ=json.load(open(os.path.join(ROOT,'broken-reach-production','set01','cards.json'),encoding='utf-8'))
async def boot(pg):
    await pg.goto(f'http://localhost:{PORT}/tcg/index.html'); await pg.wait_for_selector('#launch'); await pg.click('[data-lact=new]'); await pg.click('[data-lact=start]')
    await pg.wait_for_function("window.G && G.player && G.player.start>0 && document.getElementById('boot').style.display==='none'", timeout=280000)
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(viewport={'width':430,'height':900}); pg=await ctx.new_page(); errs=[]
        pg.on('pageerror', lambda e: errs.append('PAGE '+str(e)[:300]))
        pg.on('console', lambda m: errs.append('CON '+m.text[:300]) if m.type=='error' and 'fonts.g' not in m.text and 'ERR_' not in m.text else None)
        await pg.route('**/fonts.g*/**', lambda r: r.abort())
        await boot(pg)
        # ---------------- the catalogue against the handoff ----------------
        c=await pg.evaluate("""(()=>{ const cs=brSetCards(1); const base=cs.filter(c=>c.pk==='base'), alt=cs.filter(c=>c.pk==='alt'); const cnt=a=>{ const o={}; a.forEach(c=>o[c.rar]=(o[c.rar]||0)+1); return o; };
          let badKey=0, badFront=0, badPrice=0, badDesign=0; for (const k of brAllKeys(1)){ try { const d=brD(k); if (!(brFairRaw(k)>0)) badPrice++; if (brFront(k).length<500) badFront++; const r=brDesignSheet(k); if (!r||!r.h) badDesign++; } catch(e){ badKey++; } }
          return {n:cs.length, base:base.length, alt:alt.length, br:cnt(base), ar:cnt(alt), planets:base.filter(c=>c.planet).length, keys:brAllKeys(1).length, badKey, badFront, badPrice, badDesign, sameOk:alt.every(a=>base[a.same-1].cid===a.cid), ids:new Set(cs.map(c=>c.id)).size}; })()""")
        check(c['base']==180 and c['alt']==27 and c['n']==207 and c['ids']==207, '180 base cards and 27 premium arts, every id unique', c)
        check(c['br']=={'common':64,'unc':48,'rare':40,'sr':20,'leg':8} and c['ar']=={'ir':16,'sig':8,'ecl':3} and c['planets']==8, 'rarity counts match the handoff (64/48/40/20/8; 16 Illustration, 8 Signature, 3 Eclipse; 8 planets)', (c['br'],c['ar']))
        check(c['keys']==180*2+27 and c['sameOk'], 'every base card prints regular and foil; a premium art shares its base card identity', c['keys'])
        check(c['badKey']==0 and c['badFront']==0 and c['badPrice']==0 and c['badDesign']==0, 'every print has a price, a face and a card page', c)
        # ---------------- packs and odds ----------------
        pk=await pg.evaluate("""(()=>{ const r=mkRng(77), N=60000; const o={bad:0, dup:0, compBad:0, slotBad:0, prem:0, ir:0, sig:0, ecl:0, rare:{rare:0,sr:0,leg:0}, foilAny:0};
          for (let i=0;i<N;i++){ const k=brRollPack(1,r); if (k.length!==10) o.bad++; const ds=k.map(brD); if (new Set(ds.map(d=>d.card.cid)).size!==10) o.dup++;
            const first7=ds.slice(0,7); if (first7.slice(0,4).some(d=>d.v!=='N'||d.card.rar!=='common')||first7.slice(4).some(d=>d.v!=='N'||d.card.rar!=='unc')) o.compBad++;
            const wild=ds[7], slot=ds[8], rare=ds[9]; if (wild.v!=='N'||wild.card.pk!=='base') o.slotBad++; if (!(slot.v==='F'||slot.v==='A')) o.slotBad++; if (rare.v!=='N'||!['rare','sr','leg'].includes(rare.card.rar)) o.slotBad++;
            if (slot.v==='A'){ o.prem++; o[slot.card.rar]++; } o.rare[rare.card.rar]++; }
          o.N=N; return o; })()""")
        N=pk['N']; near=lambda x,t,tol: abs(x-t)<=tol
        check(pk['bad']==0 and pk['dup']==0 and pk['compBad']==0 and pk['slotBad']==0, 'every pack is exactly 10 cards: 4 Commons, 3 Uncommons, a wildcard, one foil-or-premium slot and the rare slot last; no card twice', pk)
        check(near(pk['ir']/N,1/12,0.004) and near(pk['sig']/N,1/72,0.0025) and near(pk['ecl']/N,1/720,0.0008), 'premium art odds: Illustration Rare about 1 in 12, Signature Rare 1 in 72, Eclipse Rare 1 in 720 (mutually exclusive)', (pk['ir']/N,pk['sig']/N,pk['ecl']/N))
        check(near(pk['rare']['rare']/N,0.8,0.01) and near(pk['rare']['sr']/N,0.17,0.01) and near(pk['rare']['leg']/N,0.03,0.006), 'the rare slot is Rare 80%, Super Rare 17%, Legendary 3%', {k:v/N for k,v in pk['rare'].items()})
        # ---------------- the timeline ----------------
        t=await pg.evaluate("""(()=>{ const o={}; const rel=brSetDef(1).rel; o.d0=G.day; o.relIn=rel-G.day; o.notAnn=!brAnnouncedSet(G.day); o.newsBefore=G.news.filter(n=>n.k==='brg').length; o.shopBefore=Object.keys(G.brg.shop).length; o.stockBefore=0; return o; })()""")
        check(t['relIn']>60 and t['notAnn'] and t['newsBefore']==0, 'on day one the set is unannounced and nothing is on the shelves', t)
        await pg.evaluate("(()=>{ const rel=brSetDef(1).rel; while (G.day<rel-28) advanceDay(); })()")
        a=await pg.evaluate("({ann:!!brAnnouncedSet(G.day), rev:brRevealed(1).length, news:G.news.filter(n=>n.k==='brg').map(n=>n.h)})")
        check(a['ann'] and a['rev']>=30 and any('ARRIVES' in h for h in a['news']), 'announced 35 days before release: previews, news and preorders open', (a['rev'],a['news']))
        pre=await pg.evaluate("(()=>{ const e=brPreorder(1,'P',6), e2=brPreorder(1,'B',1), e3=brPreorder(1,'B',2); return [e,e2,e3, G.brg.pre.map(p=>p.f+p.q)]; })()")
        check(pre[0] is None and pre[1] is None and pre[2] is not None, 'preorders respect the limit (12 packs, 2 boxes)', pre)
        cash0=await pg.evaluate("G.player.bought"); await pg.evaluate("(()=>{ const rel=brSetDef(1).rel; while (G.day<rel) advanceDay(); })()")
        r=await pg.evaluate("({sealed:myBr().filter(c=>brD(c.k).sealed).map(c=>brD(c.k).v), shop:G.brg.shop[1], news:G.news.filter(n=>n.k==='brg').map(n=>n.h).slice(0,2), lst:G.lst.filter(l=>l.it==='b').length, cash:G.player.bought})")
        check(sorted(r['sealed'])==['B']+['P']*6 and abs((r['cash']-cash0)-(6*4.99+109))<0.5, 'release day: the preorder arrives (6 packs and a box) and is charged at retail', (r['sealed'],r['cash']-cash0))
        check(r['shop']['pack']>50 and r['lst']>60 and any('IS OUT TODAY' in h for h in r['news']), 'release day: shelves stocked, collectors list copies, news says it is out', (r['shop'],r['lst'],r['news']))
        # ---------------- prices ----------------
        pr=await pg.evaluate("""(()=>{ const S=brSetCards(1); const med=a=>{ a=a.slice().sort((x,y)=>x-y); return a[a.length>>1]; }; const m=(r,v)=>med(S.filter(c=>c.rar===r&&c.pk==='base').map(c=>brFairRaw(brKey(1,c.no,v)))); const al=r=>med(S.filter(c=>c.rar===r).map(c=>brFairRaw(brKey(1,c.no,'A'))));
          return {ev:brPackEV(1), pack:brFairRaw(brKey(1,0,'P')), box:brFairRaw(brKey(1,0,'B')), c:m('common','N'), u:m('unc','N'), r:m('rare','N'), sr:m('sr','N'), l:m('leg','N'), lf:m('leg','F'), ir:al('ir'), sg:al('sig'), ec:al('ecl')}; })()""")
        check(4.2<=pr['ev']<=7.5 and pr['pack']<=pr['ev']*1.3, 'a pack is worth about $4.20 to $7.50 in cards at launch (retail $4.99)', pr)
        check(pr['c']<pr['u']<pr['r']<pr['sr']<pr['l']<pr['lf'] and pr['ir']<pr['sg']<pr['ec'] and pr['ec']>200, 'prices rise with rarity: Common < Uncommon < Rare < Super Rare < Legendary < foil Legendary; premium arts rise Illustration < Signature < Eclipse', pr)
        mc=await pg.evaluate("(()=>{ const r=mkRng(99), N=20000; let s=0; for (let i=0;i<N;i++) for (const k of brRollPack(1,r)) s+=brFairRaw(k); return {mc:s/N, ev:brPackEV(1)}; })()")
        check(abs(mc['mc']/mc['ev']-1)<0.12, 'the expected pack value the shop prices from matches what rolled packs are actually worth (within 12%)', mc)
        # ---------------- the play loop: buy, open, collect, sell, grade ----------------
        await pg.evaluate("(()=>{ G.player.cash=5000; })()")
        e=await pg.evaluate("brBuySealed(1,'P',3)"); check(e is None, 'buy packs at retail', e)
        o=await pg.evaluate("""(()=>{ const ids=myBr().filter(c=>brD(c.k).sealed).map(c=>c.id); const before=myBr().length; const res=brOpenMany(ids); return {n:res.packs.length, sizes:res.packs.map(p=>p.length), after:myBr().filter(c=>!brD(c.k).sealed).length, sealedLeft:myBr().filter(c=>brD(c.k).sealed).length, title:res.title}; })()""")
        check(o['sealedLeft']==0 and set(o['sizes'])=={10} and o['n']>=9 and o['after']==o['n']*10, 'opening many packs and a box gives 10 cards a pack, into the collection', o)
        s=await pg.evaluate("""(()=>{ const mine=myBr().filter(c=>!brD(c.k).sealed).sort((a,b)=>brCopyValue(b)-brCopyValue(a)); const top=mine[0]; const e=playerList('b',top.id,'bin',Math.max(1,brCopyValue(top)*1.1),5,true); const l=G.lst.find(x=>x.it==='b'&&x.ref===top.id);
          const g=mine.find(c=>c.g===0&&!c.l); const e2=brSubmitGrade(g.id,'std'); return {e, listed:!!l, e2, gst:g.g, subs:(G.player.bsubs||[]).length, gid:g.id}; })()""")
        check(s['e'] is None and s['listed'] and s['e2'] is None and s['gst']==-1 and s['subs']==1, 'list a card on the marketplace and send one to the grader', s)
        await pg.evaluate("(()=>{ for (let i=0;i<30;i++) advanceDay(); })()")
        g=await pg.evaluate(f"(()=>{{ const c=BRC({s['gid']}); return {{g:c.g, rv:(G.player.rv||[]).filter(x=>x.k==='b').length, pop:Object.keys(G.bpop).length, sub:(G.player.bsubs||[]).length}}; }})()")
        check(g['g']>=1 and g['rv']>=1 and g['pop']>=1 and g['sub']==0, 'grading comes back with a grade, a reveal and a population entry', g)
        sh=await pg.evaluate("""(()=>{ const L=brLgs(); const k=brAllKeys(1)[10]; const s=brKvStock(G.day); const kk=Object.keys(s)[0]; const c0=G.player.cash; const e=brKvBuy(kk); const e2=L.cs.length? brLgsBuySingle(L.cs[0].id) : 'none'; const sells=myBr().filter(c=>c.g===0&&!c.l&&!brD(c.k).sealed&&brLgsOffer(c)>=0.5).length; return {e,e2,cs:L.cs.length,kvN:Object.keys(s).length,sells,spent:c0-G.player.cash}; })()""")
        check(sh['e'] is None and sh['e2'] is None and sh['cs']>=20 and sh['kvN']>150 and sh['spent']>0, 'the online singles shop and the local store sell singles', sh)
        # ---------------- the market runs ----------------
        await pg.evaluate("(()=>{ for (let i=0;i<60;i++) advanceDay(); })()")
        m=await pg.evaluate("""(()=>{ const ls=G.lst.filter(l=>l.it==='b'); const sold=Object.keys(G.sales).filter(k=>k[0]==='B').length; return {n:ls.length, sold, copies:Object.keys(G.brc).length, ids:(G._npcBrIds||[]).length}; })()""")
        check(m['n']>150 and m['sold']>5, 'collectors list and buy: the marketplace has Broken Reach listings and sales', m)
        # ---------------- screens ----------------
        views=[]
        for tab,sub in (('br','shop'),('br','sets'),('br','play')):
            await pg.evaluate(f"(()=>{{ UI.tab='br'; UI.brs='{sub}'; render(true); }})()"); views.append((sub, await pg.evaluate("document.querySelector('#view')? document.querySelector('#view').innerText.length : document.body.innerText.length")))
        for st in ('retail','lgs','kv'):
            await pg.evaluate(f"(()=>{{ UI.tab='br'; UI.brs='shop'; UI.brstore='{st}'; render(true); }})()"); views.append((st, await pg.evaluate("document.body.innerText.length")))
        await pg.evaluate("(()=>{ UI.tab='coll'; UI.sub.coll='cards'; UI.cg='br'; render(true); })()"); cv=await pg.evaluate("document.body.innerText.length")
        await pg.evaluate("(()=>{ UI.sub.coll='sets'; render(true); })()"); sv=await pg.evaluate("document.body.innerText.length")
        await pg.evaluate("(()=>{ UI.tab='home'; render(true); })()"); hv=await pg.evaluate("document.body.innerText")
        await pg.evaluate("(()=>{ UI.tab='market'; UI.sub.market='browse'; UI.mf.type='br'; render(true); })()"); mv=await pg.evaluate("document.body.innerText")
        check(all(v>200 for _,v in views) and cv>200 and sv>100, 'the Broken Reach tab (shop, game store, online shop, set, play), collection and set checklist render', (views,cv,sv))
        check('Broken Reach' in hv, 'Home shows Broken Reach panels', hv[:200]); check('Broken Reach' in mv or 'Card, set' in mv, 'the marketplace has a Broken Reach filter')
        await pg.screenshot(path='/tmp/br_collect_market.png')
        for name,js in (('retail',"UI.tab='br'; UI.brs='shop'; UI.brstore='retail'"),('collection',"UI.tab='coll'; UI.sub.coll='cards'; UI.cg='br'"),('home',"UI.tab='home'")):
            await pg.evaluate(f"(()=>{{ {js}; render(true); window.scrollTo(0,0); }})()"); await pg.screenshot(path=f'/tmp/br_collect_{name}.png')
        sheets=await pg.evaluate("""(()=>{ let n=0; const top=myBr().filter(c=>!brD(c.k).sealed).slice(0,12); for (const c of top){ const r=brCopySheet(c.id); if (r&&r.h&&r.h.length>400) n++; } return {n, of:Math.min(12,myBr().filter(c=>!brD(c.k).sealed).length)}; })()""")
        check(sheets['n']==sheets['of'] and sheets['n']>0, 'copy pages open for owned cards', sheets)
        # opening overlay
        await pg.evaluate("(()=>{ brBuySealed(1,'P',2); const ids=myBr().filter(c=>brD(c.k).sealed&&!c.l).map(c=>c.id); const res=brOpenMany(ids); brtoStartX=0; brOpenStart(res); })()") if False else None
        await pg.evaluate("(()=>{ G.player.cash=1000; brBuySealed(1,'P',2); const ids=myBr().filter(c=>brD(c.k).sealed&&!c.l).map(c=>c.id); const res=brOpenMany(ids); broStart(res); })()")
        ov=await pg.evaluate("!!document.querySelector('#tco') && document.querySelector('#tco').innerText.length>20"); check(ov, 'the opening overlay shows the packs'); await pg.screenshot(path='/tmp/br_collect_opening.png')
        await pg.evaluate("ACT.broclose()")
        # ---------------- saves ----------------
        await pg.evaluate("saveGame(true)"); st=await pg.evaluate("(async()=>{ await saveGame(true); const copies=Object.keys(G.brc).length, v=G.brg.v; return {copies, day:G.day}; })()")
        await pg.reload(); await pg.wait_for_selector('#launch'); await pg.click('[data-lact=open]')
        await pg.wait_for_function("window.G && G.brg && document.getElementById('boot').style.display==='none'", timeout=120000)
        after=await pg.evaluate("({copies:Object.keys(G.brc).length, day:G.day, ok:Object.values(G.brc).every(c=>Array.isArray(c.c)&&c.c.length===4), news:G.news.filter(n=>n.k==='brg').length})")
        check(after['copies']==st['copies'] and after['day']==st['day'] and after['ok'], 'save and continue keep the cards, conditions and day', (st,after))
        await pg.evaluate("(()=>{ for (let i=0;i<10;i++) advanceDay(); })()")
        # ---------------- an older save gets the Broken Reach world ----------------
        up=await pg.evaluate("""(async()=>{ const keep=G.brc; delete G.brg; G.brc=undefined; delete G.bpop; await upgradeBr(null); return {has:!!G.brg, released:brReleasedSets(G.day).length, shop:G.brg.shop[1]&&G.brg.shop[1].pack>0, lst:G.lst.filter(l=>l.it==='b').length>20, copies:Object.keys(G.brc).length>500, news:G.news.filter(n=>n.k==='brg').length}; })()""")
        check(up['has'] and up['released']==1 and up['shop'] and up['lst'] and up['copies'], 'an older save opened after release gets the set, its shelves, its market and no duplicate world', up)
        check(not errs, 'no page errors', errs[:5])
        await b.close()
    print('RESULT','ALL PASS' if not FAIL else 'FAIL %d: %s'%(len(FAIL),FAIL)); sys.exit(1 if FAIL else 0)
asyncio.run(main())
