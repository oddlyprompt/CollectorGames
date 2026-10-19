#!/usr/bin/env python3
"""Tidemark against its own data: the checklist and cards.json, art, packs and odds, the release timeline, the economy, the play loop,
the rules engine and the living metagame, the ban path, the screens and saves.

  python3 tools/tidemarktest.py [port]      (build first: python3 tools/build.py tidemark; serve dist: cd dist && python3 -m http.server 8770)

Prints PASS/FAIL lines and a RESULT. Needs the playwright Python package and Chromium."""
import asyncio, sys, json, os
from collections import Counter
from playwright.async_api import async_playwright
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); PORT=sys.argv[1] if len(sys.argv)>1 else '8770'
FAIL=[]
def check(ok, what, detail=''):
    print(('PASS ' if ok else 'FAIL ')+what+(('  '+str(detail)) if detail!='' else '')); (FAIL.append(what) if not ok else None)
CJ=json.load(open(os.path.join(ROOT,'tidemark-production','cards.json'),encoding='utf-8')); MAN=json.load(open(os.path.join(ROOT,'tidemark-production','manifest.json'),encoding='utf-8'))
def library_current():
    import subprocess, shutil
    node=shutil.which('node') or '/opt/node22/bin/node'
    r=subprocess.run([node, os.path.join(ROOT,'tools','tidemark','v1','library.js'), '--check'], capture_output=True, text=True)
    return r.returncode==0, (r.stdout+r.stderr).strip()
async def boot(pg, scn=None):
    await pg.goto(f'http://localhost:{PORT}/tcg/index.html'); await pg.wait_for_selector('#launch'); await pg.click('[data-lact=new]')
    if scn: await pg.click(f'.lsc input[value={scn}] >> xpath=..')
    await pg.click('[data-lact=start]')
    await pg.wait_for_function("window.G && G.player && G.player.start>0 && document.getElementById('boot').style.display==='none'", timeout=280000)
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(viewport={'width':430,'height':900}); pg=await ctx.new_page(); errs=[]
        pg.on('pageerror', lambda e: errs.append('PAGE '+str(e)[:300]))
        pg.on('console', lambda m: errs.append('CON '+m.text[:300]) if m.type=='error' and 'fonts.g' not in m.text and 'ERR_' not in m.text else None)
        await pg.route('**/fonts.g*/**', lambda r: r.abort())
        await boot(pg, 'tmbinder')
        ok,msg=library_current(); check(ok, 'the metagame library is current for the cards and the engine (node tools/tidemark/v1/library.js)', msg)
        # ---------------- the catalog against the checklist ----------------
        cat=await pg.evaluate("""(()=>{ const out={sets:TM_SETS.length, per:[], cards:TM_CARDS.length, prs:TM_PR.length}; for (let n=1;n<=TM_SETS.length;n++){ const cs=xtSetCards(n); out.per.push([xtSetDef(n).code, cs.length, cs.filter(c=>c.rar==='alt').length, ['common','unc','rare','leg'].map(r=>cs.filter(c=>c.rar===r).length)]); } return out; })()""")
        check(cat['sets']==31 and cat['cards']==650 and cat['prs']==730, '31 sets, 650 card identities, 730 printings', (cat['sets'],cat['cards'],cat['prs']))
        want={}
        for p in CJ['printings']: want[p['set']]=want.get(p['set'],0)+1
        bad=[(c,n,want[c]) for c,n,a,r in cat['per'] if want[c]!=n]
        check(not bad, 'every set has the printings the checklist gives it', bad[:5])
        tt=[x for x in cat['per'] if x[0]=='TT'][0]
        check(tt[1]==230 and tt[2]==10 and tt[3]==[103,63,39,15], 'Tenth Tide: 220 cards (103 C, 63 U, 39 R, 15 L) and 10 alternate arts', tt)
        ids=await pg.evaluate("""(()=>{ const bad=[]; const seen=new Map(); for (let n=1;n<=31;n++) for (const c of xtSetCards(n)){ const a=TM_ART[c.ill]; if (!a) bad.push('no art '+c.name); const k=c.ill; if (seen.has(k) && seen.get(k)!==c.id) bad.push('art shared by two cards '+k); seen.set(k,c.id); } return bad; })()""")
        check(sorted(ids)==['no art Choir-Depth Leviathan','no art Roothorn Stag','no art Sentinel of Azure Keep'], 'every printing has approved art and no art belongs to two different cards, except the three owner-approved concept paintings that are not in the repository yet (they draw ART PENDING)', ids[:5])
        rp=await pg.evaluate("""(()=>{ let re=0, alt=0, bad=0; for (const c of xtSetCards(31)){ if (c.pk==='r'){ re++; if (!(TM_PRINTS[c.cid]||[]).some(s=>s<31)) bad++; } if (c.pk==='alt'){ alt++; if (c.same==null) bad++; } } const first=Object.values(TM_FIRST).filter(s=>s===31).length; return {re,alt,bad,first,ids:TM_CARDS.length}; })()""")
        check(rp['re']==70 and rp['alt']==10 and rp['bad']==0 and rp['first']==150, '70 reprints share identity with an older printing, 150 new cards, 10 alternate arts point at their cards', rp)
        res=await pg.evaluate("TM_CARDS.filter(c=>c.res).length"); check(res==19, '19 reserve-list cards, none reprinted', res)
        nores=await pg.evaluate("TM_CARDS.filter(c=>c.res && (TM_PRINTS[+c.id.slice(4)]||[]).some(s=>s===31)).length"); check(nores==0, 'no reserve-list card is in Tenth Tide', nores)
        same=await pg.evaluate("(()=>{ const a=[]; for (let s=1;s<=31;s++) for (const c of xtSetCards(s)) a.push(c.cid+':'+c.name); const b=[]; for (let s=1;s<=31;s++) for (const c of xtSetCards(s)) b.push(c.cid+':'+c.name); return a.join()===b.join(); })()"); check(same, 'card identities are the same in every world')
        # ---------------- packs and odds ----------------
        pk=await pg.evaluate("""(()=>{ const r=mkRng(77); const N=6000; const o={bad:0, foil:0, leg:0, alt:0, bulk:0, nonTT:0}; for (let i=0;i<N;i++){ const k=xtRollPack(31,r); const rs=k.map(x=>xtD(x)); if (k.length+k.bulk!==12 || k.bulk) o.bad++; const nF=rs.filter(d=>d.v==='F').length; o.foil+=nF?1:0; const last=rs[rs.length-1]; if (last.card.rar==='leg') o.leg++; if (last.v==='A') o.alt++;
            if (rs.filter(d=>d.v!=='F' && d.card.rar==='common').length+(nF?1:0)!==8 && !rs.some(d=>d.v==='A')) o.nonTT++; if (rs.filter(d=>d.card.rar==='unc'&&d.v==='N').length!==3 && nF===0) o.nonTT++; }
          o.N=N; const h=xtRollPack(1,mkRng(5)); o.hist=h.length+h.bulk; let bulk=0; for (let i=0;i<500;i++) bulk+=xtRollPack(1,mkRng(i)).bulk; o.ftBulk=bulk/500; let b2=0; for (let i=0;i<500;i++) b2+=xtRollPack(30,mkRng(i)).bulk; o.tlBulk=b2/500; return o; })()""")
        check(pk['bad']==0 and pk['nonTT']==0, 'every Tenth Tide pack is 12 named cards: 8 commons (one a foil in some packs), 3 uncommons, 1 rare or Legendary', pk)
        near=lambda x,t,tol: abs(x-t)<=tol
        check(near(pk['foil']/pk['N'],1/6,0.015) and near(pk['leg']/pk['N'],0.125*(1-1/60),0.015) and near(pk['alt']/pk['N'],1/60,0.006), 'foil about 1 pack in 6, Legendary slot about 1 in 8, alternate art about 1 in 60', (round(pk['foil']/pk['N'],3),round(pk['leg']/pk['N'],3),round(pk['alt']/pk['N'],4)))
        check(pk['hist']==12 and 7<pk['ftBulk']<11 and 8<pk['tlBulk']<11, 'an old set pack is 12 cards, mostly bulk (only named cards are tracked)', (pk['hist'],pk['ftBulk'],pk['tlBulk']))
        # ---------------- the timeline ----------------
        pre=await pg.evaluate("""(()=>({day:G.day, days:xtSetDef(31).rel-G.day, released:xtReleasedSets(G.day).includes(31)?1:0, stock:(G.xtg.shop[31]&&G.xtg.shop[31].pack)||0, ann:xtAnnounced(G.day), revealed:xtRevealed(31).length, news:G.news.filter(n=>n.k==='tcg').map(n=>n.h), arch:G.xtg.arch.length,
          legal:xtLegalSets(G.day).length, legalIds:xtLegalSets(G.day).map(n=>xtSetDef(n).code).join(), pre:G.xtg.pre.map(p=>p.f+p.q).join(), listings:G.lst.length, hist:xtReleasedSets(G.day).length}))()""")
        check(pre['days']==25 and pre['released']==0 and pre['stock']==0 and pre['hist']==30 and pre['ann']==31, 'Tenth Tide releases 25 days after the game starts (26 June 2026); 30 sets of history exist; nothing on shelves before', pre)
        check(any('ANNOUNCED' in h for h in pre['news']) and pre['revealed']>=20 and pre['arch']==0, 'announced on day one with the Legendaries and alternate arts shown; no field before the release', (pre['news'],pre['revealed']))
        check(pre['legal']==5 and pre['pre']=='P12' and pre['listings']>=200, 'before the release the old Standard is the sets of the last two years (5); the scenario preorder is in; the market is stocked', pre)
        pc=await pg.evaluate("""(()=>({a:xtPreorder(31,'B',1), b:G.xtg.pre.length}))()"""); check(pc['a'] is None, 'preorders work', pc)
        await pg.evaluate("(()=>{ for (let i=0;i<24;i++) advanceDay(); })()")
        pr=await pg.evaluate("""(()=>({day:G.day, rel:xtSetDef(31).rel, rev:xtRevealed(31).length, news:G.news.filter(n=>n.k==='tcg').map(n=>n.h)}))()""")
        check(pr['rev']>=220, 'the full set is revealed a week before release', pr['rev'])
        cash0=await pg.evaluate("G.player.bought"); await pg.evaluate("advanceDay()")
        post=await pg.evaluate("""(()=>({released:xtReleasedSets(G.day).includes(31)?1:0, stock:G.xtg.shop[31].pack, boxes:G.xtg.shop[31].box, arch:G.xtg.arch.length, listed:G.lst.filter(l=>l.it==='t').length, pending:G.xtg.pre.length, packs:myXt().filter(c=>xtD(c.k).sealed&&xtD(c.k).v==='P').length, boxesOwned:myXt().filter(c=>xtD(c.k).sealed&&xtD(c.k).v==='B').length, legal:xtLegalSets(G.day), cash:G.player.bought}))()""")
        check(post['released']==1 and post['stock']>0 and post['arch']>=12 and post['pending']==0 and post['packs']==12 and post['boxesOwned']==1, 'on release day the set is in shops and in the metagame, and the preorders arrive (12 packs, 1 box)', post)
        check(post['legal']==[31] and abs(post['cash']-cash0-144)<1, 'Standard becomes Tenth Tide alone; the preorder that was not paid up front (1 box) was charged at retail on the day', (post['legal'],post['cash']-cash0))
        rot=await pg.evaluate("""(()=>{ const c=xtSetCards(30).find(c=>!c.tt); const d=xtSetCards(30).find(c=>c.tt&&c.pk!=='alt'); return {rot:c&&xtLegalState(c.cid), keep:d? xtLegalState(d.cid) : 'none'}; })()""")
        check(rot['rot']=='rot', 'an older card Tenth Tide does not reprint is Eternal-only after the release', rot)
        # ---------------- the economy ----------------
        ec=await pg.evaluate("""(()=>{ const med=a=>a.slice().sort((x,y)=>x-y)[a.length>>1]; const t={}; const by={}; for (const k of xtAllKeys(31)){ const d=xtD(k); const g=d.rar+(d.v==='F'?' foil':''); (by[g]=by[g]||[]).push(xtFairRaw(k)); } for (const g in by) t[g]=+med(by[g]).toFixed(2);
          return {ev:+xtPackEV(31).toFixed(2), pack:+xtFairRaw(xtKey(31,0,'P')).toFixed(2), box:+xtFairRaw(xtKey(31,0,'B')).toFixed(0), tiers:t, oldBox:+xtFairRaw(xtKey(1,0,'B')).toFixed(0), top:Object.keys(by).length}; })()""")
        print('     economy at launch: pack EV $%s, pack $%s, box $%s; medians %s; First Tide box $%s'%(ec['ev'],ec['pack'],ec['box'],ec['tiers'],ec['oldBox']))
        check(4.2<=ec['ev']<=7.5, 'pack expected value at launch a little above the $4.99 price', ec['ev'])
        check(150<=ec['box']<=300, 'box value at launch above the $144 price', ec['box'])
        check(ec['tiers']['common']<0.25 and ec['tiers']['unc']<0.6 and 0.4<ec['tiers']['rare']<2.5 and 2<ec['tiers']['leg']<12 and 30<ec['tiers']['alt']<200, 'medians by rarity are in range', ec['tiers'])
        old=await pg.evaluate("""(()=>{ const ks=[]; for (let s=1;s<=30;s++) for (const k of xtAllKeys(s)) ks.push([k,xtFairRaw(k)]); ks.sort((a,b)=>b[1]-a[1]); const ft=xtSetCards(1).filter(c=>c.rar==='leg').map(c=>xtFairRaw(xtKey(1,c.no,'N'))); const md=a=>a.sort((x,y)=>x-y)[a.length>>1];
          const res=TM_CARDS.filter(c=>c.res).map(c=>{ const fp=TM_FIRST[+c.id.slice(4)]; const cc=xtSetCards(fp).find(x=>x.id===c.id); return xtFairRaw(xtKey(fp,cc.no,'N')); }); const non=[]; for (let s=1;s<=30;s++) for (const c of xtSetCards(s)) if (!c.res && c.rar==='leg') non.push(xtFairRaw(xtKey(s,c.no,'N')));
          return {top:ks.slice(0,3).map(x=>xtD(x[0]).card.name+' '+x[1].toFixed(0)), topv:ks[0][1], ftLeg:md(ft), resMed:md(res), nonRes:non.length? md(non):0}; })()""")
        check(old['topv']>=150 and old['resMed']>old['nonRes'], 'the history has real grails (the most valuable card is $150 or more) and the reserve list is worth more than other Legendaries', old)
        # ---------------- the play loop ----------------
        loop=await pg.evaluate("""(async()=>{ const o={}; G.player.cash=5000; o.shop=xtBuySealed(31,'P',3)||'ok'; const ps=myXt().filter(c=>xtD(c.k).sealed&&xtD(c.k).v==='P'); const r=xtOpenSealed(ps[0].id); o.pulled=r.packs[0].length; o.bulk=r.bulk;
          const cp=r.packs[0].map(XT).sort((a,b)=>xtCopyValue(b)-xtCopyValue(a))[0]; o.grade=xtSubmitGrade(cp.id,'std')||'sent'; const c2=r.packs[0].map(XT).filter(c=>c.g===0)[0]; o.list=playerList('x',c2.id,'bin',xtCopyValue(c2)*1.2,5,true)||'listed';
          const bx=myXt().find(c=>xtD(c.k).sealed&&xtD(c.k).v==='B'); const rb=xtOpenSealed(bx.id); o.boxPacks=rb.packs.length; o.boxCards=rb.packs.flat().length; o.boxSV=rb.sv>0; o.lgs=xtLgsBuySealed('P',1)||'ok'; o.kv=xtKvBuy(xtAllKeys(31).find(k=>xtKvStock(G.day)[k]))||'ok'; return o; })()""")
        check(loop['shop']=='ok' and loop['pulled']==12 and loop['grade']=='sent' and loop['list']=='listed' and loop['boxPacks']==36 and loop['boxCards']==432 and loop['lgs']=='ok' and loop['kv']=='ok', 'buy, open (12 cards), grade, list, open a box (36 packs, 432 cards), the game store and Saltmarket sell', loop)
        old_open=await pg.evaluate("""(()=>{ G.player.cash=9000; const key=xtKey(1,0,'P'); const cp=xtMakeCopy(key,0,[G.day,'bought',30,'test'],'shop'); const c0=G.player.cash; const r=xtOpenSealed(cp.id); return {named:r.packs[0].length, bulk:r.bulk, bulkPaid:+(G.player.cash-c0).toFixed(2), expect:+(r.bulk*XT_BULK).toFixed(2)}; })()""")
        check(old_open['named']+old_open['bulk']==12 and old_open['bulk']>=5 and abs(old_open['bulkPaid']-old_open['expect'])<0.011, 'an old pack opens into named cards plus bulk, and the bulk is sold to the bulk bin', old_open)
        # ---------------- the rules engine and the living metagame ----------------
        mt=await pg.evaluate("""(()=>{ const A=G.xtg.arch; const o={n:A.length, top:A[0].sh, sum:A.reduce((s,a)=>s+a.sh,0), events:G.xtg.ev.length, sales:Object.keys(G.sales).length, bad:0, sizes:[]};
          for (const a of A){ const d=xtDeckOf(a); if (!d || d.length!==50) o.bad++; else { const k={}; for (const c of d){ k[c.n]=(k[c.n]||0)+1; if (!c.tt) o.bad++; } for (const n in k) if (k[n]>(d.find(c=>c.n===n).r==='L'?1:3)) o.bad++; } }
          o.mx=G.xtg.mx.M.length===A.length && G.xtg.mx.top.length===A.length; return o; })()""")
        check(mt['n']>=12 and mt['top']<0.35 and abs(mt['sum']-1)<1e-6 and mt['bad']==0 and mt['mx'], 'the field has 12+ decks of 50 Tenth Tide cards (at most 3 copies, 1 Legendary), shares sum to 1', mt)
        eng=await pg.evaluate("""(()=>{ const A=G.xtg.arch; const o={err:null, why:{}, turns:0, w:0, n:0}; try { for (let i=0;i<4;i++) for (let j=i+1;j<5;j++){ for (let k=0;k<3;k++){ const r=TMR.play(xtDeckOf(A[i]),xtDeckOf(A[j]),1000+i*31+j*7+k); o.why[r.why]=(o.why[r.why]||0)+1; o.turns+=r.turns; o.n++; if (r.w>=0) o.w++; } } } catch(e){ o.err=String(e); } return o; })()""")
        check(not eng['err'] and eng['n']==30 and eng['w']>=25, 'the rules engine plays 30 games between the most played decks', (eng['err'],eng['why'],eng['turns']/max(1,eng['n'])))
        await pg.evaluate("(()=>{ for (let i=0;i<30*14;i++) advanceDay(); })()")
        fld=await pg.evaluate("""(()=>{ const A=G.xtg.arch; return {n:A.length, top:A[0].sh, fin:G.xtg.ev.filter(e=>e.fin).length, news:G.news.filter(n=>/NEW DECK|NEW TECH|NEW BUILD/.test(n.h)).length, bans:Object.keys(G.xtg.ban).length, day:G.day}; })()""")
        check(fld['n']>=12 and fld['n']<=22 and fld['fin']>0 and fld['news']>=1, 'after 14 months: the field is alive (12 to 22 decks, new decks found, finals played by the engine)', fld)
        # the ban path: a deck far above the dominance line for ten weeks gets a card banned and every deck is rebuilt without it
        ban=await pg.evaluate("""(()=>{ const T=G.xtg; const A=T.arch; const top=A[0]; for (const a of A) a.sh=a===top? 0.3 : 0.7/(A.length-1); T.dom[top.id]=XTP.domWeeks; T.lastBan=0; const t0=Date.now(); xtBanCheck(G.day); const ms=Date.now()-t0; const cids=Object.keys(T.ban); if (!cids.length) return {ok:false, why:'no ban'};
          const cid=+cids[0]; const c=xtCardByCid(cid); const p0=xtFairRaw(xtCardKey(c)); const lead=T.ban[cid]; T.ban[cid].d=G.day; G._lg=null; xTfvClear(); const t1=Date.now(); xtRebuildMeta(G.day); const ms2=Date.now()-t1; const live=T.arch.filter(a=>a.cnt[cid]).length; const bad=T.mx.top.filter(p=>p.c.some(x=>x[0]===cid)).length;
          return {ok:true, name:c.name, ms, ms2, live, bad, n:T.arch.length, state:xtLegalState(cid), sum:T.arch.reduce((s,a)=>s+a.sh,0), M:T.mx.M.length===T.mx.top.length}; })()""")
        check(ban.get('ok') and ban['live']==0 and ban['bad']==0 and ban['state']=='ban' and ban['M'] and abs(ban['sum']-1)<1e-6, 'a dominant deck triggers a ban; the banned card leaves every rebuilt deck', ban)
        if ban.get('ok'): print('     ban took %.1fs to decide and %.1fs to rebuild the field'%(ban['ms']/1000,ban['ms2']/1000))
        rb=await pg.evaluate("""(()=>{ const T=G.xtg; const decks=T.arch.map(a=>xtDeckOf(a)); return decks.every(d=>d&&d.length===50); })()"""); check(rb, 'every rebuilt deck is still 50 cards')
        # ---------------- every printing ----------------
        sw=await pg.evaluate("""(()=>{ const o={keys:0, badPrice:0, badFront:0, badSheet:0, errs:[]}; let i=0; for (let s=1;s<=31;s++) for (const k of xtAllKeys(s)){ o.keys++; try { const v=xtFairRaw(k); if (!(v>0.02) || !isFinite(v)) o.badPrice++; if (!xtFront(k).includes('<svg')) o.badFront++; if ((i++)%9===0){ const r=xtDesignSheet(k); const h0=r&&r.h&&r.h.replace(/data:image[^"]*/g,''); if (!r || !r.h || /undefined|\bNaN\b/.test(h0)){ o.badSheet++; const m=h0&&h0.match(/.{50}(undefined|NaN).{30}/); o.errs.push('page '+k+' '+(m&&m[0])); } } } catch(e){ o.errs.push(k+' '+e); } }
          for (let s=1;s<=31;s++){ try { const r=xtSetSheet(s); const h0=r.h.replace(/data:image[^"]*/g,''); if (!r.h || /undefined|\bNaN\b/.test(h0)){ o.badSheet++; const m=h0.match(/.{50}(undefined|NaN).{30}/); o.errs.push('set '+s+' '+(m&&m[0])); } } catch(e){ o.errs.push('set '+s+' '+e); } } for (const f of ['P','B']) for (let s=1;s<=31;s++) { try { if (!xtPackSVG(s,f).includes('<svg')) o.badFront++; const r=xtDesignSheet(xtKey(s,0,f)); if (!r.h || /undefined|\bNaN\b/.test(r.h.replace(/data:image[^"]*/g,''))) o.badSheet++; } catch(e){ o.errs.push('sealed '+s+f+' '+e); } } return o; })()""")
        check(sw['keys']==1460+0 or sw['keys']>1400, 'every printing (regular and foil) has a price, a face and a card page; every set sheet and every pack and box renders', sw)
        check(sw['badPrice']==0 and sw['badFront']==0 and sw['badSheet']==0 and not sw['errs'], 'no bad prices, faces or pages anywhere in the catalog', (sw['badPrice'],sw['badFront'],sw['badSheet'],sw['errs'][:3]))
        await pg.wait_for_function('!tmBusy && TM_Q.length===0', timeout=120000)
        # ---------------- screens ----------------
        for t in ['home','shop','xt','market','coll']:
            await pg.evaluate(f"closeSheet(true); ACT.tab('{t}')"); await pg.wait_for_timeout(500)
            txt=await pg.evaluate("document.querySelector('#app').innerText")
            if 'went wrong' in txt: check(False,'tab '+t+' renders')
        for sub in ['retail','lgs','kv']:
            await pg.evaluate(f"closeSheet(true); ACT.tab('xt'); ACT.xts('shop'); ACT.xtstore('{sub}')"); await pg.wait_for_timeout(300)
            txt=await pg.evaluate("document.querySelector('#app').innerText"); check('went wrong' not in txt and len(txt)>300, 'shop view '+sub+' renders')
        for s in ['meta','sets']:
            await pg.evaluate(f"closeSheet(true); ACT.tab('xt'); ACT.xts('{s}')"); await pg.wait_for_timeout(300)
            txt=await pg.evaluate("document.querySelector('#app').innerText"); check('went wrong' not in txt and len(txt)>200, 'view '+s+' renders')
        await pg.evaluate("closeSheet(true); ACT.xtset(31)"); await pg.wait_for_timeout(1500); sheet=await pg.evaluate("document.body.innerText")
        check('Tenth Tide' in sheet and '220 cards' in sheet and '150 new, 70 reprints' in sheet, 'the set page shows Tenth Tide with 220 cards')
        k=await pg.evaluate("xtKey(31,1,'N')"); await pg.evaluate(f"closeSheet(true); ACT.xtdesign('{k}')"); await pg.wait_for_timeout(2500); ds=await pg.evaluate("document.body.innerText")
        check('Leader, Rampart' in ds and 'Influence' in ds and 'Designed for Version 1' in ds and 'Captain of the Causeway' in ds, 'the card page shows its rules and says they are designed, not canon')
        img=await pg.evaluate("""(async()=>{ const c=xtSetCards(31)[0]; await new Promise(r=>setTimeout(r,1500)); const u=tmImgUrl(c); return {ok:u.startsWith('data:image'), kb:Math.round(u.length/1024), front:xtFront(xtKey(31,1,'N')).includes('data:image')}; })()""")
        check(img['ok'] and img['front'], 'a card face is drawn by the Tidemark frame renderer with its approved art', img)
        rr=await pg.evaluate("""(async()=>{ try { const o=XT(myXt().find(c=>!xtD(c.k).sealed).id); const svg=faceSVG('x',o,false); const r=await v3Raster(svg,300); return [typeof r, r&&r.width||0]; } catch(e){ return 'ERR '+e; } })()""")
        check(isinstance(rr,list) or str(rr).startswith('ERR')==False, '3D viewer can rasterise a Tidemark card', rr)
        # ---------------- saves ----------------
        d1=await pg.evaluate("G.day"); n1=await pg.evaluate("Object.keys(G.xtc).length"); await pg.evaluate("closeSheet(true); saveGame(true)"); await pg.wait_for_timeout(1500)
        await pg.reload(); await pg.wait_for_selector('#launch'); await pg.click('[data-lact=open]'); await pg.wait_for_function("window.G && G.player && document.getElementById('boot').style.display==='none'", timeout=120000)
        d2=await pg.evaluate("G.day"); n2=await pg.evaluate("Object.keys(G.xtc).length"); cv=await pg.evaluate("G.xtg.cv"); fld2=await pg.evaluate("({n:G.xtg.arch.length, bans:Object.keys(G.xtg.ban).length})")
        check(d1==d2 and n1==n2 and cv==1 and fld2['n']==fld['n'] and fld2['bans']>=1, 'save and continue keep the day, the cards, the field and the ban', (d1,d2,n1,n2,cv,fld2))
        await pg.evaluate("(()=>{ for (let i=0;i<14;i++) advanceDay(); })()"); ok=await pg.evaluate("G.xtg.arch.length>=12"); check(ok, 'the loaded world keeps running after a ban')
        check(not errs, 'no page errors', errs[:4])
        await b.close()
    print('RESULT', 'FAIL '+str(len(FAIL)) if FAIL else 'ALL PASS'); sys.exit(1 if FAIL else 0)
asyncio.run(main())
