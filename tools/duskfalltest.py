#!/usr/bin/env python3
"""Wildkin set 2 (Duskfall) regression test. Needs the dist server running (see CLAUDE.md) and a fresh build of tcg.

  python3 tools/duskfalltest.py [port]

Checks Duskfall against wildkin-production/manifest-dsk.json (ids, names, counts, reprints sharing First Bond's identity,
premium prints pointing at their base cards, art), then plays a new game forward: hidden until it is announced 35 days
ahead, preorders, release day (shops, market, metagame with both sets), packs that hold only Duskfall cards, prices,
an older save opened after the release date, the set page and the card faces, save and reload. Exits 1 on any failure."""
import asyncio, sys, json, os
from collections import Counter
from playwright.async_api import async_playwright
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT=sys.argv[1] if len(sys.argv)>1 else '8770'
M=json.load(open(os.path.join(ROOT,'wildkin-production','manifest-dsk.json'),encoding='utf-8'))
FAIL=[]
def check(ok, what, detail=''):
    print(('PASS ' if ok else 'FAIL ')+what+(('  '+str(detail)) if detail!='' else '')); (FAIL.append(what) if not ok else None)
ADV="(n=>{ for (let i=0;i<n;i++) advanceDay(); closeSheet(true); if (UI.rvl) rvClose(); const t=document.getElementById('tco'); if (t) ACT.tcoclose(); return G.day; })"
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(viewport={'width':390,'height':844}); pg=await ctx.new_page(); errs=[]
        pg.on('pageerror', lambda e: errs.append('PAGE '+str(e)[:300]))
        pg.on('console', lambda m: errs.append('CON '+m.text[:300]) if m.type=='error' and 'fonts.g' not in m.text and 'ERR_' not in m.text else None)
        await pg.route('**/fonts.g*/**', lambda r: r.abort())
        await pg.goto(f'http://localhost:{PORT}/tcg/index.html'); await pg.wait_for_selector('#launch'); await pg.click('[data-lact=new]'); await pg.click('[data-lact=start]')
        await pg.wait_for_function("window.G && G.player && G.player.start>0 && document.getElementById('boot').style.display==='none'", timeout=280000)
        # ---------------- the catalog against the manifest
        cat=await pg.evaluate("tcSetCards(2).map(c=>({no:c.no,id:c.id,name:c.name,kind:c.kind,rar:c.rar,cid:c.cid,same:c.same??null,from:c.from??null,el:c.el??null,art:c.art}))")
        check(len(cat)==180, 'Duskfall has 180 cards', len(cat))
        mc={c['number']:c for c in M['cards']}
        check(not [c['no'] for c in cat if c['id']!=mc[c['no']]['id'] or c['name']!=mc[c['no']]['name']], 'every card id and name matches the Duskfall manifest')
        kinds=Counter(('premium' if c['same'] else c['kind']) for c in cat)
        check(dict(kinds)=={'creature':74,'ally':18,'gear':18,'biome':9,'tactic':12,'essence':9,'premium':40}, 'category counts 74/18/18/9/12/9 + 40 premium', dict(kinds))
        rar=Counter(c['rar'] for c in cat); check(rar['ir']==18 and rar['fa']==14 and rar['sir']==4 and rar['csr']==4 and rar['ess']==9, 'premium and essence rarities', dict(rar))
        rp=[c for c in M['cards'] if c.get('reprint_of')]; by={c['no']:c for c in cat}
        check(len(rp)==36 and all(by[c['number']]['cid']==1000+int(c['reprint_of'][-3:]) for c in rp), 'the 27 reprints and 9 Essence play as their First Bond card (same identity)', len(rp))
        new=[c for c in cat if not c['same'] and c['no'] not in {x['number'] for x in rp}]
        check(len(new)==104 and all(c['cid']==2000+c['no'] for c in new), 'the 104 cards with new rules have their own identity (2000 + number)', len(new))
        check(all(c['cid']==by[c['same']]['cid'] and by[c['same']]['no']<=140 for c in cat if c['same']), 'every premium print points at a Duskfall base card')
        check(by[56]['from']=='Runakoi' and by[2]['from']=='Velumi' and by[74]['from']=='Cumulfin', 'evolution: new prints keep their First Bond line; new species have their own', (by[56]['from'],by[2]['from'],by[74]['from']))
        art=await pg.evaluate("tcSetCards(2).map(c=>tcArtState(c).state)")
        check(Counter(art)=={'final':171,'vector':9}, 'every Duskfall card has approved art (Essence is drawn)', dict(Counter(art)))
        own=await pg.evaluate("(()=>{ const bad=[]; for (const c of tcSetCards(2)){ const a=tcArtOf(c); if (c.no<=34 && c.kind==='creature' && !(a.s||'').startsWith('cut.dsk-'+String(c.no).padStart(3,'0'))) bad.push(c.no); if (c.same!=null && !(a.i||'').startsWith('ill.dsk-'+String(c.no).padStart(3,'0'))) bad.push(c.no); } return bad; })()")
        check(not own, 'new creatures and premium prints show their own Duskfall art', own[:6])
        # ---------------- before the announcement
        pre=await pg.evaluate("(()=>{ ACT.tab('home'); return {rel:tcSetDef(2).rel-G.day, ann:tcAnnounced(G.day), news:G.news.some(n=>/DUSKFALL/.test(n.h)), home:document.querySelector('#app').innerText.includes('Duskfall')}; })()")
        check(pre['rel']>150 and pre['ann']==1 and not pre['news'] and not pre['home'], 'Duskfall is not shown before it is announced', pre)
        await pg.evaluate(ADV+"(tcSetDef(1).rel-G.day)")
        d=await pg.evaluate("tcSetDef(2).rel-35-G.day"); await pg.evaluate(ADV+"(%d)"%(d-1))
        a0=await pg.evaluate("tcAnnounced(G.day)"); await pg.evaluate(ADV+"(7)")
        ann=await pg.evaluate("(()=>{ G.player.cash=Math.max(G.player.cash,2000); return {ann:tcAnnounced(G.day), news:G.news.filter(n=>/DUSKFALL/.test(n.h)).map(n=>n.h), rev:tcRevealed(2).length, pre:tcPreorder(2,'B',1)||'ok', pre2:tcPreorder(2,'P',3)||'ok'}; })()")
        check(a0 is None and ann['ann']==2 and ann['news'] and ann['rev']>0 and ann['pre']=='ok' and ann['pre2']=='ok', 'Duskfall is announced 35 days ahead with a first look, and preorders open', (a0,ann))
        # ---------------- release day
        d=await pg.evaluate("tcSetDef(2).rel-G.day"); await pg.evaluate(ADV+"(%d)"%d)
        rel=await pg.evaluate("""(()=>{ const s=tcSetDef(2); const A=G.tcg.arch; const dsk=A.filter(a=>Object.keys(a.cnt).some(cid=>+cid>=2000)).length;
          return {day:G.day-s.rel, rel:tcReleasedSets(G.day), legal:tcLegalSets(G.day), stock:tcStock(2,'P'), key:G.tcg.mx&&G.tcg.mx.key, n:A.length, dsk, pending:G.tcg.pre.filter(p=>p.set===2).length,
            mine:myTc().filter(c=>tcD(c.k).set===2&&tcD(c.k).sealed).length, listed:G.lst.filter(l=>l.it==='t'&&G.tc[l.ref]&&tcD(G.tc[l.ref].k).set===2).length, news:G.news.slice(0,12).map(n=>n.h).filter(h=>/DUSKFALL/.test(h))}; })()""")
        check(rel['day']==0 and rel['rel']==[1,2] and rel['legal']==[1,2] and rel['stock']>0, 'Duskfall releases on its date and is in the shops; both sets are Standard', rel)
        check(rel['key']=='1,2|' and rel['n']>=8 and rel['dsk']>=3, 'the metagame now uses both sets, and Duskfall cards make the decks', (rel['key'],rel['n'],rel['dsk']))
        check(rel['pending']==0 and rel['mine']>=4 and rel['listed']>=15, 'preorders arrive on release day; Duskfall is on the market', rel)
        op=await pg.evaluate("""(()=>{ G.player.cash+=5000; const r=tcBuySealed(2,'P',1)||'ok'; const pk=myTc().find(c=>tcD(c.k).sealed&&tcD(c.k).set===2&&tcD(c.k).v==='P'); const o=tcOpenSealed(pk.id);
          const ks=o.packs.flat(); const ds=ks.map(k=>tcD(typeof k==='string'?k:(k.k||G.tc[k.id||k]&&G.tc[k.id||k].k))); return {r, n:ks.length, set2:ds.every(d=>d&&d.set===2), rar:ds.map(d=>d&&d.rar)}; })()""")
        check(op['r']=='ok' and op['n']==10 and op['set2'], 'a Duskfall pack holds 10 Duskfall cards', op)
        ec=await pg.evaluate("""(()=>{ TCFV.clear(); const ks=tcAllKeys(2).filter(k=>!tcD(k).sealed); const v=ks.map(k=>[k,tcFairRaw(k)]).sort((a,b)=>b[1]-a[1]);
          return {ev:+tcPackEV(2).toFixed(2), pack:+tcFairRaw(tcKey(2,0,'P')).toFixed(2), box:+tcFairRaw(tcKey(2,0,'B')).toFixed(2), fbbox:+tcFairRaw(tcKey(1,0,'B')).toFixed(2), top:v.slice(0,6).map(([k,x])=>tcCardLabel(k)+' $'+x.toFixed(0))}; })()""")
        print('     Duskfall at release: pack EV $%s, pack $%s, box $%s (First Bond box $%s)'%(ec['ev'],ec['pack'],ec['box'],ec['fbbox'])); print('     top:',ec['top'])
        check(3.5<=ec['ev']<=9 and 130<=ec['box']<=320, 'Duskfall pack value and box price near retail at release', ec)
        # ---------------- an older save opened after the release date: the set comes out that day
        old=await pg.evaluate("""(()=>{ const T=G.tcg; delete T.rel[2]; T.ann={}; T.rev={}; T.mx=Object.assign({},T.mx,{key:'1|'}); T.arch=T.arch.slice(); tcNormalize();
          return {rel:T.rel[2]===G.day, key:T.mx&&T.mx.key, rev:tcRevealed(2).length, n:T.arch.length}; })()""")
        check(old['rel'] and old['key']=='1,2|' and old['rev']==180 and old['n']>=8, 'a save made before Duskfall existed gets the release when it is opened', old)
        # ---------------- pages and faces
        await pg.evaluate("ACT.tab('home')"); home=await pg.evaluate("document.querySelector('#app').innerText")
        await pg.evaluate("ACT.tset('2')"); await pg.wait_for_timeout(400); sheet=await pg.evaluate("document.body.innerText")
        check('Duskfall' in sheet and '180 cards' in sheet, 'the set page shows Duskfall with 180 cards')
        await pg.evaluate("closeSheet(true)")
        f=await pg.evaluate("[tcFront(tcKey(2,3,'N')), tcFront(tcKey(2,173,'X')), tcFront(tcKey(2,111,'N')), tcFront(tcKey(2,86,'N')), tcFront(tcKey(2,35,'N'))].map(x=>x.replace(/<[^>]+>/g,' ').replace(/\\s+/g,' '))")
        check('Eclipse Flare' in f[0] and 'Starveil' in f[0] and 'Eclipse Flare' in f[1], 'card faces print Duskfall rules (base and SIR print the same)')
        check('no Retreat Cost' in f[2] and 'Directive Zero' in f[3], 'biome and ally faces')
        check('/140' in f[4] or '035' in f[4], 'card numbers read against Duskfall', '')
        tabs=await pg.evaluate("TABS.map(t=>t[0])"); broken=[]
        for t in tabs:
            await pg.evaluate(f"ACT.tab('{t}')"); await pg.wait_for_timeout(200)
            if 'went wrong' in await pg.evaluate("document.querySelector('#app').innerText"): broken.append(t)
        check(not broken, 'every tab renders with both sets out', broken)
        await pg.evaluate(ADV+"(28)")
        mt=await pg.evaluate("(()=>{ const A=G.tcg.arch; return {n:A.length, top:+A[0].sh.toFixed(3), ev:G.tcg.ev.length, dsk:A.filter(a=>Object.keys(a.cnt).some(cid=>+cid>=2000)).reduce((s,a)=>s+a.sh,0)}; })()")
        check(mt['n']>=8 and mt['top']<0.45 and mt['dsk']>0.2, 'a month later the two-set metagame is healthy and Duskfall is played', mt)
        # ---------------- the living field: new decks are found, dead decks leave, the matchup table stays whole
        lf=await pg.evaluate("""(()=>{ const T=G.tcg; const ok=()=>{ const n=T.mx.top.length; return T.arch.length===n && T.mx.M.length===n && T.mx.M.every(r=>r.length===n)
            && new Set(T.arch.map(a=>a.ix)).size===n && T.arch.every(a=>a.ix>=0&&a.ix<n) && T.mx.M.every((r,i)=>r.every((p,j)=>i===j||Math.abs(p+T.mx.M[j][i]-1)<0.002)); };
          const n0=T.arch.length; let a=null, k=0; const sv=TCM.brew, sm=TCM.maxField; TCM.brew=1; TCM.maxField=99; 
          while (!a && k++<25) a=tcBrewWeek(G.day); TCM.brew=sv; TCM.maxField=sm; const ok1=ok(); const n1=T.arch.length;
          const deck=a&&tcDeckOf(a); const news=G.news.slice(0,3).map(n=>n.h).filter(h=>/^NEW (DECK|TECH)/.test(h));
          const old=T.arch[T.arch.length-1]; old.low=TCM.dropWeeks; old.sh=0.001; old.born=G.day-100; const gone=tcPruneWeek(G.day); const ok2=ok();
          return {n0, n1, n2:T.arch.length, found:!!a, why:a&&a.why, name:a&&a.name, size:deck&&deck.length, news, ok1, ok2, gone:gone&&gone.name, mark:gone? !!T.gone[Object.keys(T.gone).pop()] : false}; })()""")
        check(lf['found'] and lf['size']==40 and lf['ok1'] and lf['news'], 'players find a new deck: tested by the engine, 40 cards, added to the field and the news', lf)
        check(lf['gone'] and lf['ok2'] and lf['n2']==lf['n1']-1, 'a deck nobody plays leaves the field and the matchup table stays whole', lf)
        await pg.evaluate("saveGame(true)"); await pg.wait_for_timeout(1200); n1=await pg.evaluate("myTc().filter(c=>tcD(c.k).set===2).length")
        await pg.reload(); await pg.wait_for_selector('#launch'); await pg.click('.lbtn.big[data-lact=open]'); await pg.wait_for_function("window.G && G.player && document.getElementById('boot').style.display==='none'", timeout=120000)
        n2=await pg.evaluate("myTc().filter(c=>tcD(c.k).set===2).length"); k2=await pg.evaluate("G.tcg.mx&&G.tcg.mx.key")
        check(n1==n2 and n1>0 and k2=='1,2|', 'save and continue keep the Duskfall cards and the two-set field', (n1,n2,k2))
        check(not errs, 'no page errors', errs[:4])
        await b.close()
    print('RESULT', 'FAIL '+str(len(FAIL)) if FAIL else 'ALL PASS'); sys.exit(1 if FAIL else 0)
asyncio.run(main())
