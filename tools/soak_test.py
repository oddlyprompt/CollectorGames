#!/usr/bin/env python3
"""Soak test of the collector world: python3 tools/soak_test.py [port]   (needs dist/ served)
A low-budget start, then about 18 months of days in a game that buys, opens, lists, auctions and grades in all three franchises, answers NPC offers,
saves and reloads, and exports a backup that is imported into a separate slot. Checks invariants and page errors throughout."""
import sys, asyncio
from playwright.async_api import async_playwright
PORT=sys.argv[1] if len(sys.argv)>1 else '8770'; URL=f'http://localhost:{PORT}/tcg/index.html'; FAIL=[]
def check(ok,msg,x=''):
    print(('PASS ' if ok else 'FAIL ')+msg, ('' if ok else x))
    if not ok: FAIL.append(msg)
STATE="""(()=>{ const bad=[]; const c=G.player.cash; if (!isFinite(c)) bad.push('cash '+c);
  for (const [n,T] of [['tc',G.tc],['xt',G.xtc],['br',G.brc]]) for (const id in T){ const cp=T[id]; if (!cp||!cp.k) bad.push(n+' copy '+id); }
  for (const l of G.lst){ if (!isFinite(l.pr)||l.pr<=0) bad.push('listing price '+l.id+' '+l.pr); }
  const stock=[G.tcg&&G.tcg.shop,G.xtg&&G.xtg.shop,G.brg&&G.brg.shop].filter(Boolean); for (const sh of stock) for (const k in sh){ const s=sh[k]; if (s.pack<0||s.box<0) bad.push('negative shelf stock'); }
  return {day:G.day, cash:Math.round(c*100)/100, tc:myTc().length, xt:myXt().length, br:myBr().length, lst:G.lst.length, rv:(G.player.rv||[]).length, subs:((G.player.tsubs||[]).length+(G.player.xsubs||[]).length+(G.player.bsubs||[]).length), bad}; })()"""
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); ctx=await b.new_context(viewport={'width':390,'height':844}, is_mobile=True, has_touch=True); pg=await ctx.new_page(); errs=[]
        pg.on('pageerror', lambda e: errs.append(str(e)[:300])); pg.on('console', lambda m: errs.append('CON '+m.text[:200]) if m.type=='error' and 'fonts.g' not in m.text and 'ERR_' not in m.text else None)
        await pg.route('**/fonts.g*/**', lambda r: r.abort())
        # --- low-budget start ---
        await pg.goto(URL); await pg.wait_for_selector('#launch'); await pg.click('[data-lact=new]'); await pg.click('label.lsc:has(input[value=pocket])'); await pg.click('[data-lact=start]')
        await pg.wait_for_function("window.G && G.player && G.player.start>0 && document.getElementById('boot').style.display==='none'", timeout=280000)
        s=await pg.evaluate("({cash:G.player.cash, pay:G.player.pay||G.player.allow||null})"); check(abs(s['cash']-20)<0.01, 'the low-budget start has $20', s)
        t=(await pg.evaluate("document.getElementById('view').innerText")).lower(); check('getting started' in t and 'preview' in t, 'the low-budget Home shows the first steps and previews, not empty-shelf invitations')
        r=await pg.evaluate("(()=>{ G.player.cash=20; const e=tcBuySealed(1,'P',1); return e; })()"); check(r is not None and ('need' in str(r).lower() or 'stock' in str(r).lower() or 'released' in str(r).lower() or 'shelf' in str(r).lower() or 'not' in str(r).lower()), 'buying from a shelf that does not exist yet is refused with a reason', r)
        for tab in ['home','shop','xt','br','market','coll']:
            await pg.evaluate(f"UI.tab='{tab}'; render(true)")
        st=await pg.evaluate(STATE); check(not st['bad'], 'invariants hold at the start', st['bad'])
        # --- soak: ~18 months with actions in all three franchises ---
        await pg.evaluate("G.player.cash=6000")
        days=0; snaps=[]; imported=False
        for step in range(36):
            await pg.evaluate("""(()=>{ const n=(G.day%7); G.player.cash=Math.max(G.player.cash,1500);
              try { const sets=tcReleasedSets(G.day), s=sets[sets.length-1]; if (s && tcStock(s,'P')>=2){ tcBuySealed(s,'P',2); const ids=myTc().filter(c=>tcD(c.k).sealed&&!c.l).map(c=>c.id); if (ids.length) tcOpenMany(ids); } } catch(e){ window.__soakErr=(window.__soakErr||'')+'tc '+e.message; }
              try { if (xtStock(31,'P')>=2 && xtReleasedSets(G.day).includes(31)){ xtBuySealed(31,'P',2); const ids=myXt().filter(c=>xtD(c.k).sealed&&!c.l).map(c=>c.id); if (ids.length) xtOpenMany(ids); } } catch(e){ window.__soakErr=(window.__soakErr||'')+'xt '+e.message; }
              try { if (brReleasedSets(G.day).length && brStock(1,'P')>=2){ brBuySealed(1,'P',2); const ids=myBr().filter(c=>brD(c.k).sealed&&!c.l).map(c=>c.id); if (ids.length) brOpenMany(ids); } } catch(e){ window.__soakErr=(window.__soakErr||'')+'br '+e.message; }
              // list a card as an auction and another with offers; submit one for grading
              try { const mine=[['t',myTc()],['x',myXt()],['b',myBr()]]; for (const [it,arr] of mine){ const c=arr.find(c=>!c.l&&c.g===0&&!({t:tcD,x:xtD,b:brD}[it])(c.k).sealed); if (c){ const v=Math.max(1,Math.round(({t:tcCopyValue,x:xtCopyValue,b:brCopyValue}[it])(c)*100)/100); playerList(it,c.id,(G.day%2? 'auc':'bin'),v,7,true); } } } catch(e){ window.__soakErr=(window.__soakErr||'')+'list '+e.message; }
              try { const c=myBr().find(c=>!c.l&&c.g===0&&!brD(c.k).sealed); if (c) brSubmitGrade(c.id,'std'); const c2=myXt().find(c=>!c.l&&c.g===0&&!xtD(c.k).sealed); if (c2) xtSubmitGrade(c2.id,'eco'); } catch(e){ window.__soakErr=(window.__soakErr||'')+'grade '+e.message; }
              // answer any offer on a listing of ours
              try { for (const l of G.lst.filter(l=>l.sel===0&&l.offers&&l.offers.length)){ const o=l.offers[0]; answerOffer(l.id,o.id, o.amt>=l.pr*0.7); } } catch(e){ window.__soakErr=(window.__soakErr||'')+'offer '+e.message; }
            })()""")
            await pg.evaluate("ACT.adv('14')"); await pg.wait_for_timeout(120)
            # grading returns are opened (the Home 'Open' action) so the queue does not grow forever
            await pg.evaluate("(()=>{ try { while ((G.player.rv||[]).length) { const r=G.player.rv.shift(); } } catch(e){} })()")
            if step%6==5:
                st=await pg.evaluate(STATE); snaps.append(st); check(not st['bad'], f"invariants hold on day {st['day']}", st['bad'][:3])
                await pg.evaluate("UI.tab='home'; render(true)"); h=(await pg.evaluate("document.getElementById('view').innerText")); check(len(h)>200, f"Home still renders on day {st['day']}")
            if step==17 and not imported:
                await pg.evaluate("closeSheet(true); saveGame(true)"); await pg.wait_for_timeout(1200)
                rr=await pg.evaluate("""(async()=>{ const id=SLOT.id; const ex=await slotExportBlob(id); const f=new File([ex.blob], ex.name); const before=(await slotList(PACK.id)).length; const rec=await slotImportFile(f); const after=(await slotList(PACK.id)).length; const row=await slotRead(rec.id); const g=await unpackBytes(row.bytes,row.enc); return {different:rec.id!==id, before, after, day:g.day, cards:Object.keys(g.tc).length+Object.keys(g.xtc).length+Object.keys(g.brc).length, nowDay:G.day, nowCards:Object.keys(G.tc).length+Object.keys(G.xtc).length+Object.keys(G.brc).length}; })()""")
                check(rr['different'] and rr['after']==rr['before']+1 and rr['day']==rr['nowDay'] and rr['cards']==rr['nowCards'], 'a backup exports and imports into a separate slot with the same day and cards', rr)
                imported=True
                await pg.reload(); await pg.wait_for_selector('#launch'); await pg.click('[data-lact=open] >> nth=0'); await pg.wait_for_function("window.G && G.player && document.getElementById('boot').style.display==='none'", timeout=120000)
                st2=await pg.evaluate(STATE); check(not st2['bad'] and st2['tc']+st2['xt']+st2['br']>0, 'the game reloads after the first year with its cards', st2)
        gr=await pg.evaluate("""(()=>{ const out={}; for (const [n,get,sub,D] of [['tc',myTc,tcSubmitGrade,tcD],['xt',myXt,xtSubmitGrade,xtD],['br',myBr,brSubmitGrade,brD]]){ const c=get().find(c=>!c.l&&c.g===0&&!D(c.k).sealed); if (!c){ out[n]='no card'; continue; } const cash0=G.player.cash; const e=sub(c.id,'exp'); out[n]={err:e, fee:Math.round((cash0-G.player.cash)*100)/100, id:c.id, g:c.g}; } return out; })()""")
        await pg.evaluate("G.player.rv=[]; ACT.adv('4')"); await pg.wait_for_timeout(300)
        back=await pg.evaluate("""(()=>{ const o={}; for (const n of ['tc','xt','br']){ const T={tc:G.tc,xt:G.xtc,br:G.brc}[n]; const x=(window.__gr||{})[n]; o[n]=null; } return (G.player.rv||[]).map(r=>({k:r.k,g:r.g})); })()""")
        for n in ['tc','xt','br']:
            if isinstance(gr[n],dict): check(gr[n]['err'] is None and abs(gr[n]['fee']-80)<0.01 and gr[n]['g']==-1, f'{n}: an Express grading submission takes the $80 fee and locks the card', gr[n])
        check(len(back)==sum(1 for n in gr if isinstance(gr[n],dict)) and all(1<=r['g']<=10 for r in back), 'every submitted card comes back after the turnaround with a grade from 1 to 10', back)
        err=await pg.evaluate("window.__soakErr||''"); check(not err, 'no exception inside any soak action', err)
        sold=await pg.evaluate("({sold:Math.round(G.player.sold*100)/100, fees:Math.round(G.player.fees*100)/100, offers:G.player.newOffers||0, aucSold:G.player.aucSold||0})")
        check(sold['sold']>0, 'listings sold over the run (auctions, buy-it-now and accepted offers settled for the seller)', sold)
        check(sold['offers']>0, 'NPC collectors made offers on the player\'s listings', sold)
        last=snaps[-1]; check(last['day']-snaps[0]['day']>=300, f"the soak ran {last['day']-snaps[0]['day']} days", snaps[:1]+snaps[-1:])
        check(last['tc']+last['xt']+last['br']>20, 'cards were collected in all that time', last)
        ser=[s['rv'] for s in snaps]; print('NOTE snapshots', [(s['day'],s['cash'],s['tc'],s['xt'],s['br'],s['lst']) for s in snaps])
        check(not errs, 'no page or console errors in the whole run', errs[:4])
        await b.close()
    print('RESULT', 'FAIL '+str(len(FAIL)) if FAIL else 'ALL PASS'); sys.exit(1 if FAIL else 0)
asyncio.run(main())
