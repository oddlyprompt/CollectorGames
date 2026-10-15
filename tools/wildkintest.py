#!/usr/bin/env python3
"""Wildkin Version 1 regression test. Needs the dist server running (see CLAUDE.md) and a fresh build of tcg.

  python3 tools/wildkintest.py [port]

Checks the First Bond catalog against wildkin-production/manifest.json, the art mapping (no card ever shows art that is not its own),
evolution links, stable IDs across worlds, the 6/2/1/1 pack structure and rare-slot odds, economy readings, the play loop
(buy, open, list, buy, grade, a month of metagame, save and reload), prototype-save protection and the 3D rasteriser.
Prints PASS/FAIL lines and exits 1 on any failure."""
import asyncio, sys, json, os, hashlib, base64
from playwright.async_api import async_playwright
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT=sys.argv[1] if len(sys.argv)>1 else '8770'
M=json.load(open(os.path.join(ROOT,'wildkin-production','manifest.json'),encoding='utf-8'))
FAIL=[]
def check(ok, what, detail=''):
    print(('PASS ' if ok else 'FAIL ')+what+(('  '+str(detail)) if detail!='' else '')); (FAIL.append(what) if not ok else None)
async def boot(pg, scn=None):
    await pg.goto(f'http://localhost:{PORT}/tcg/index.html'); await pg.wait_for_selector('#launch'); await pg.click('[data-lact=new]')
    if scn: await pg.click(f'.lsc input[value={scn}] >> xpath=..')
    await pg.click('[data-lact=start]')
    await pg.wait_for_function("window.G && G.player && G.player.start>0 && document.getElementById('boot').style.display==='none'", timeout=280000)
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(viewport={'width':390,'height':844}); pg=await ctx.new_page(); errs=[]
        pg.on('pageerror', lambda e: errs.append('PAGE '+str(e)[:300]))
        pg.on('console', lambda m: errs.append('CON '+m.text[:300]) if m.type=='error' and 'fonts.g' not in m.text and 'ERR_' not in m.text else None)
        await pg.route('**/fonts.g*/**', lambda r: r.abort())
        await boot(pg)
        # ---------------- catalog against the manifest
        cat=await pg.evaluate("tcSetCards(1).map(c=>({no:c.no,id:c.id,name:c.name,kind:c.kind,rar:c.rar,cid:c.cid,same:c.same??null,from:c.from??null,stage:c.stage??null,fam:c.fam??null,el:c.el??null}))")
        check(len(cat)==180, 'Set 001 has 180 cards', len(cat))
        mc={c['number']:c for c in M['cards']}
        bad=[c['no'] for c in cat if c['id']!=mc[c['no']]['id'] or c['name']!=mc[c['no']]['name']]
        check(not bad, 'every card id and name matches the manifest', bad[:5])
        from collections import Counter
        kinds=Counter(('premium' if c['same'] else c['kind']) for c in cat)
        check(dict(kinds)=={'creature':74,'ally':18,'gear':18,'biome':9,'tactic':12,'essence':9,'premium':40}, 'category counts 74/18/18/9/12/9 + 40 premium', dict(kinds))
        rar=Counter(c['rar'] for c in cat); check(rar['ir']==18 and rar['fa']==14 and rar['sir']==4 and rar['csr']==4 and rar['ess']==9, 'premium and essence rarities', dict(rar))
        base=[c for c in cat if not c['same']]; check(all(c['cid']==1000+c['no'] for c in base), 'stable ids: base card cid = 1000 + number')
        byno={c['no']:c for c in cat}
        prem_ok=all(c['cid']==byno[c['same']]['cid'] and c['name'].endswith(byno[c['same']]['name']) for c in cat if c['same'])
        check(prem_ok, 'every premium card points at its base card (same identity in play)')
        sir=[byno[n]['name'] for n in range(173,177)]; csr=[byno[n]['name'] for n in range(177,181)]
        check(sir==['Cactuft','Nimbusail','June Kestrel','Sel Veyra'] and csr==['Clasped Aegisopod','Clasped Pompyre','Clasped Ferradon','Clasped Veilmora'], 'SIR and Clasped subjects are the canon ones', sir+csr)
        # evolution
        evo_bad=[]
        for c in base:
            if c['kind']!='creature': continue
            if c['from']:
                pr=byno.get(c['no']-1)
                if not pr or pr['name']!=c['from'] or pr['fam']!=c['fam']: evo_bad.append(c['name'])
        lines={'Aurorotl':'Opalotl','Opalotl':'Prismotl','Fortisaur':'Maceback','Maceback':'Bashlet','Koirune':'Runakoi','Runakoi':'Koilet','Aegisopod':'Shelladin','Shelladin':'Rolyte','Canopang':'Pangrove','Pangrove':'Frondolin','Spiramel':'Candicoil','Astrynx':'Creskit','Pompyre':'Berribat','Nimbusail':'Cumulfin','Cumulfin':'Mistip'}
        for k,v in lines.items():
            if next(c for c in base if c['name']==k)['from']!=v: evo_bad.append(k)
        for k in ('Cactuft','Flapod'):
            c=next(c for c in base if c['name']==k)
            if c['from'] or c['stage']!='Basic': evo_bad.append(k)
        check(not evo_bad, 'evolution links coherent (canon lines exact, standalones standalone)', evo_bad)
        # every print renders, and shows only its own art
        r=await pg.evaluate("""(()=>{ const out={n:0,bad:[],foreign:[],pend:0,final:0};
          for (const k of tcAllKeys(1)){ out.n++; let s; try { s=tcFront(k); } catch(e){ out.bad.push(k+': '+e.message); continue; }
            if (!s.startsWith('<svg')||/undefined|NaN/.test(s)) out.bad.push(k);
            const c=tcD(k).card, a=c.art||{}; const own=new Set([a.s,a.b,a.i,a.x].filter(x=>x&&WK_ART[x]).map(x=>WK_ART[x].u));
            const hrefs=(s.match(/href="([^"#][^"]*)"/g)||[]).map(x=>x.slice(6,-1)); for (const h of hrefs) if (!own.has(h)) out.foreign.push(k+' '+h);
            const st=tcArtState(c).state; if (st==='final'||st==='interim') out.final++; else if (st!=='vector'){ out.pend++; if (!/ART PENDING|background pending/.test(s)) out.bad.push(k+' missing placeholder'); } }
          return out; })()""")
        check(not r['bad'], 'all %d prints render, placeholders where art is missing'%r['n'], r['bad'][:4])
        check(not r['foreign'], 'no card shows art that is not mapped to it', r['foreign'][:4])
        print('     art: %d prints with approved art, %d waiting for art'%(r['final'],r['pend']))
        pa=await pg.evaluate("tcSetCards(1).filter(c=>tcIsPrem(c)).map(c=>{ const b=tcSetCards(1)[c.same-1]; return [c.art.i, b.art.s||b.art.i]; })")
        check(all(a and a!=b for a,b in pa) and len({a for a,b in pa})==40, 'premium cards have their own illustration IDs, never the base art')
        legacy_art=await pg.evaluate("typeof TCG_ART")
        check(legacy_art=='undefined', 'prototype art bundle is gone from the build')
        # stable across worlds
        s1=await pg.evaluate("JSON.stringify(tcSetCards(1).map(c=>[c.id,c.name,c.cid,c.rar,c.hp||0]))")
        s2=await pg.evaluate("(()=>{ const seed=G.seed; G.seed=seed+12345; TC_CACHE.clear(); TC_BYCID.clear(); const a=JSON.stringify(tcSetCards(1).map(c=>[c.id,c.name,c.cid,c.rar,c.hp||0])); G.seed=seed; TC_CACHE.clear(); TC_BYCID.clear(); tcSetCards(1); return a; })()")
        check(s1==s2, 'card identities are the same in every world (from the manifest, not the seed)')
        # ---------------- packs
        pk=await pg.evaluate("""(()=>{ const r=mkRng(4242); const N=40000; const P=tcPools(1); const cnt={}; let bad=0;
          for (let i=0;i<N;i++){ const ks=tcRollPack(1,r); if (ks.length!==10) bad++; const ds=ks.map(tcD);
            const com=ds.slice(0,6), unc=ds.slice(6,8), rs=ds[8], es=ds[9];
            if (!com.every(d=>d.rar==='common'||d.v==='R')) bad++; if (!unc.every(d=>d.rar==='unc'&&d.v==='N')) bad++; if (es.rar!=='ess') bad++;
            if (!(rs.rar==='rare'||tcIsPrem(rs.card))) bad++; const k=tcIsPrem(rs.card)? rs.rar : rs.v==='H'?'holo':'rare'; cnt[k]=(cnt[k]||0)+1; cnt.rev=(cnt.rev||0)+(com.some(d=>d.v==='R')?1:0); }
          for (const k in cnt) cnt[k]/=N; return {bad,cnt,odds:TC_ODDS}; })()""")
        check(pk['bad']==0, 'every pack is 10 cards: 6 common slots, 2 uncommons, 1 rare or better, 1 Essence', pk['bad'])
        o=pk['odds']; c=pk['cnt']
        near=lambda a,b,tol: abs(a-b)<=tol
        check(near(c.get('ir',0),o['ir'],0.006) and near(c.get('fa',0),o['fa'],0.004) and near(c.get('sir',0),o['sir'],0.0025) and near(c.get('csr',0),o['csr'],0.0018) and near(c.get('holo',0),o['rare_holo'],0.01),
              'rare-slot odds match the manifest over 40,000 packs', {k:round(v,4) for k,v in c.items()})
        # ---------------- economy readings at the start
        ec=await pg.evaluate("""(()=>{ const ks=tcAllKeys(1).filter(k=>!tcD(k).sealed); const v=ks.map(k=>[k,tcFairRaw(k)]).sort((a,b)=>b[1]-a[1]);
          const by={}; for (const [k,x] of v){ const d=tcD(k); const g=d.rar+(d.v==='H'?' holo':d.v==='R'?' rev':''); (by[g]=by[g]||[]).push(x); }
          const med=a=>a.slice().sort((x,y)=>x-y)[Math.floor(a.length/2)]; const tiers={}; for (const g in by) tiers[g]=+med(by[g]).toFixed(2);
          return {ev:+tcPackEV(1).toFixed(2), pack:+tcFairRaw(tcKey(1,0,'P')).toFixed(2), box:+tcFairRaw(tcKey(1,0,'B')).toFixed(2), top:v.slice(0,8).map(([k,x])=>tcCardLabel(k)+' $'+x.toFixed(0)), tiers}; })()""")
        print('     economy at start: pack EV $%s, pack $%s, box $%s'%(ec['ev'],ec['pack'],ec['box'])); print('     medians:',ec['tiers']); print('     top:',ec['top'])
        check(3.0<=ec['ev']<=6.5, 'pack expected value near the $4.50 price', ec['ev'])
        check(100<=ec['box']<=260, 'box value near the $150 price', ec['box'])
        # ---------------- play loop
        loop=await pg.evaluate("""(()=>{ G.player.cash=5000; const out={};
          out.shop=tcBuySealed(1,'P',3)||'ok'; const pk=myTc().find(c=>tcD(c.k).sealed&&tcD(c.k).v==='P'); const o=tcOpenSealed(pk.id); out.pulled=o.packs.flat().length;
          const l=G.lst.filter(x=>x.it==='t'&&x.sel>0&&x.ty==='bin').sort((a,b)=>a.pr-b.pr)[5]; out.buy=l?(buyListing(l.id)||'ok'):'none';
          const c=myTc().filter(c=>!tcD(c.k).sealed&&c.g===0).sort((a,b)=>tcCopyValue(b)-tcCopyValue(a))[0]; out.grade=tcSubmitGrade(c.id,'exp')||'sent';
          const d=myTc().filter(c=>!tcD(c.k).sealed&&c.g===0&&!c.l)[0]; out.list=playerList('t',d.id,'bin',Math.max(1,tcCopyValue(d)*1.1),0,true)||'listed';
          out.box=tcBuySealed(1,'B',1)||'ok'; const bx=myTc().find(c=>tcD(c.k).sealed&&tcD(c.k).v==='B'); out.boxCards=tcOpenSealed(bx.id).packs.flat().length; return out; })()""")
        check(loop['shop']=='ok' and loop['pulled']==10 and loop['grade']=='sent' and loop['list']=='listed' and loop['boxCards']==360, 'buy, open, grade, list, open a box', loop)
        for i in range(5):
            await pg.evaluate("ACT.adv('7')"); await pg.wait_for_function("!UI.busy", timeout=120000); await pg.wait_for_timeout(200)
            await pg.evaluate("closeSheet(true); if (UI.rvl) rvClose(); const t=document.getElementById('tco'); if (t) ACT.tcoclose();")
        mt=await pg.evaluate("""(()=>{ const A=G.tcg.arch; return {n:A.length, top:A.length?+A[0].sh.toFixed(3):0, lines:A.filter(a=>(a.line||[]).length).length, events:G.tcg.ev.length, graded:(G.player.rv||[]).filter(x=>x.k==='t').length, sales:Object.keys(G.sales).filter(k=>k[0]==='T').length,
           ess:A.some(a=>a.core.concat(a.tr).some(cid=>{ const c=tcCardByCid(cid); return !c||c.kind==='essence'; })) }; })()""")
        check(mt['n']>=8 and mt['top']<0.45 and mt['events']>0 and mt['sales']>50, 'metagame runs: archetypes, events, market sales', mt)
        check(mt['lines']>0, 'evolution lines feed into decks (Stage 1 and 2 decks carry their earlier stages)', mt['lines'])
        check(not mt['ess'], 'no deck lists Essence or unknown cards')
        check(mt['graded']>=1, 'a graded card came back from GCS', mt['graded'])
        tabs=await pg.evaluate("TABS.map(t=>t[0])")
        for t in tabs:
            await pg.evaluate(f"ACT.tab('{t}')"); await pg.wait_for_timeout(250)
            txt=await pg.evaluate("document.querySelector('#app').innerText")
            if 'went wrong' in txt: check(False,'tab '+t+' renders')
        await pg.evaluate("ACT.tset('1')"); await pg.wait_for_timeout(400); sheet=await pg.evaluate("document.body.innerText")
        check('First Bond' in sheet and '180 cards' in sheet, 'set page shows First Bond with 180 cards')
        key=await pg.evaluate("tcKey(1,173,'X')"); await pg.evaluate(f"closeSheet(true); ACT.tdesign('{key}')"); await pg.wait_for_timeout(400)
        ds=await pg.evaluate("document.body.innerText"); check('Provisional' in ds and 'Art' in ds, 'card page states provisional rules and art status')
        await pg.evaluate("closeSheet(true)")
        # 3D viewer rasterises linked art (inlined first)
        rr=await pg.evaluate("v3Raster(tcFront(tcKey(1,1,'N')),300).then(c=>{ const g=c.getContext('2d'); const d=g.getImageData(150,120,1,1).data; return [c.width,c.height,d[3]]; }).catch(e=>'ERR '+e.message)")
        check(isinstance(rr,list) and rr[2]>0, '3D viewer can rasterise a card with linked art', rr)
        # save, reload, continue
        await pg.evaluate("saveGame(true)"); await pg.wait_for_timeout(1200); d1=await pg.evaluate("G.day"); n1=await pg.evaluate("myTc().length")
        await pg.reload(); await pg.wait_for_selector('#launch'); await pg.click('.lbtn.big[data-lact=open]'); await pg.wait_for_function("window.G && G.player && document.getElementById('boot').style.display==='none'", timeout=120000)
        d2=await pg.evaluate("G.day"); n2=await pg.evaluate("myTc().length"); cv=await pg.evaluate("G.tcg.cv")
        check(d1==d2 and n1==n2 and cv==2, 'save and continue keep the day, the cards and content version 2', (d1,d2,n1,n2,cv))
        # ---------------- prototype saves are protected
        fx=open(os.path.join(ROOT,'tests','fixtures','legacy-prototype-tcg.ccsave'),'rb').read()
        await pg.evaluate("ACT.slots()"); await pg.wait_for_selector('#launch')
        rec=await pg.evaluate("""(async(b64)=>{ const bin=atob(b64); const a=new Uint8Array(bin.length); for (let i=0;i<a.length;i++) a[i]=bin.charCodeAt(i); const rec=await slotImportFile(new File([a],'old.ccsave')); const x=await slotRead(rec.id); const h=await crypto.subtle.digest('SHA-256',x.bytes); return {id:rec.id, h:[...new Uint8Array(h)].map(v=>v.toString(16).padStart(2,'0')).join('')}; })""", base64.b64encode(fx).decode())
        await pg.evaluate("showLauncher()"); await pg.wait_for_timeout(400); lt=await pg.evaluate("document.getElementById('launch').innerText")
        check('Prototype save' in lt, 'launcher labels the imported prototype save')
        await pg.click(f'.lslot-main[data-id="{rec["id"]}"]'); await pg.wait_for_timeout(800); lt2=await pg.evaluate("document.getElementById('launch')? document.getElementById('launch').innerText : ''")
        check('prototype save' in lt2.lower() and 'Download a backup' in lt2, 'opening it shows the prototype notice instead of loading it', lt2[:80])
        h2=await pg.evaluate("(async(id)=>{ const x=await slotRead(id); const h=await crypto.subtle.digest('SHA-256',x.bytes); return [...new Uint8Array(h)].map(v=>v.toString(16).padStart(2,'0')).join(''); })", rec['id'])
        check(h2==rec['h'], 'the prototype save bytes are untouched')
        ex=await pg.evaluate("slotExportBlob(%r).then(x=>x.blob.size)"%rec['id']); check(ex>1000, 'the prototype save can still be backed up', ex)
        check(not errs, 'no page errors', errs[:4])
        await b.close()
    print('RESULT', 'FAIL '+str(len(FAIL)) if FAIL else 'ALL PASS'); sys.exit(1 if FAIL else 0)
asyncio.run(main())
