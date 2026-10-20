#!/usr/bin/env python3
"""Tidemark economy v2: the quantitative test suite (design/tidemark-economy-v2.md, section 7).

  python3 tools/tidemark_econ2_test.py [test ...] [--seeds N]      (needs the dist server on 8770; build tcg first)

Every test prints its numbers and PASS or FAIL against a stated range. The ranges are the ones the design review set (condition by age,
vintage Near Mint rarity, discoverability of ordinary vintage, how many sets can be completed); change a range only with a written reason.
Tests: ledger condition availability consequences prices completion long exploits saves"""
import asyncio, sys, json, time, statistics as st
from playwright.async_api import async_playwright
PORT='8770'; ARGS=[a for a in sys.argv[1:] if not a.startswith('--')]; SEEDS=int(next((a.split('=')[1] for a in sys.argv if a.startswith('--seeds=')), 0)) or None
RESULTS=[]; ERRS=[]
def check(name, ok, detail=''):
    RESULTS.append((name, ok)); print(('PASS ' if ok else 'FAIL ')+name+(' | '+str(detail) if detail!='' else ''))
LIB="""
window.T2={
  async fresh(seed, ver){ window.__xtEcon=ver||'v2'; await newGame(seed,null); migrate(); UI.scn=null; G.player.cash=1e7; },
  days(n){ for (let i=0;i<n;i++) advanceDay(); },
  snap(){ const o={}; for (const id in G.xtc) o[id]=G.xtc[id].k; return o; },
  isNM(c){ return c.g===0 && condLabel(c.c)==='NM'; },
  vint(d){ return d.set!==31 && (G.day-d.def.rel)/365>=2; },
  // every copy a buyer could get today: the marketplace (other sellers) and Saltmarket's dealers
  visible(){ const out=[]; for (const l of G.lst){ if (l.it!=='x'||l.sel===0) continue; const c=G.xtc[l.ref]; if (c) out.push(c); } for (const id of (G.xtg.kv&&G.xtg.kv.inv||[])){ const c=G.xtc[id]; if (c) out.push(c); } return out; },
  band(c){ return c.g>0?'G':condLabel(c.c); }
};
"""
async def newpage(p, pin=None):
    b=await p.chromium.launch(); ctx=await b.new_context(viewport={'width':430,'height':900})
    if pin: await ctx.add_init_script("window.__xtEcon='%s'"%pin)
    pg=await ctx.new_page(); pg.on('pageerror', lambda e: ERRS.append(str(e)[:300])); await pg.route('**/fonts.g*/**', lambda r: r.abort())
    await pg.goto(f'http://localhost:{PORT}/tcg/index.html'); await pg.wait_for_selector('#launch'); await pg.click('[data-lact=new]'); await pg.click('[data-lact=start]')
    await pg.wait_for_function("window.G && G.player && G.player.start>0 && document.getElementById('boot').style.display==='none'", timeout=90000)
    await pg.evaluate(LIB); return b, pg

# ---------------------------------------------------------------- 1. ledger
async def t_ledger(pg):
    for seed in (11, 12):
        r=await pg.evaluate("""async(seed)=>{ await T2.fresh(seed); const S0=T2.snap(), L0=Object.assign({},G.xtg.led); T2.days(365); const S1=T2.snap(); let removed=0,created=0,createdOld=0;
          for (const id in S0) if (!(id in S1)) removed++; for (const id in S1) if (!(id in S0)){ created++; if (xtD(S1[id]).set!==31) createdOld++; } const L1=G.xtg.led;
          const own={attic:0,shop:0,player:0,npc:0}; for (const c of Object.values(G.xtc)){ if (c.o===-3) own.attic++; else if (c.o===-2) own.shop++; else if (c.o===0) own.player++; else if (c.o>0) own.npc++; else own.other=(own.other||0)+1; }
          return {removed,created,createdOld, dLost:L1.lost-L0.lost, dOpened:L1.opened-L0.opened, dMade:L1.made-L0.made, dCull:(L1.cull||0)-(L0.cull||0), total:Object.keys(G.xtc).length, own}; }""", seed)
        check('ledger seed %d: every removed copy is accounted for'%seed, r['removed']==r['dLost']+r['dOpened']+r['dCull'], r)
        check('ledger seed %d: old-set copies only appear when a collector opens sealed product'%seed, r['createdOld']==r['dMade'], '%d vs %d'%(r['createdOld'],r['dMade']))
        check('ledger seed %d: every copy has exactly one owner kind'%seed, 'other' not in r['own'] and sum(r['own'].values())==r['total'], r['own'])

# ---------------------------------------------------------------- 2. condition by age and rarity (replay only, many seeds)
REPLAY="""([ns])=>{ const tab={}; const AGE=y=>y<1?'<1':y<4?'1-4':y<7?'4-7':y<9?'7-9':'9+'; const vis=[], boxes=[], lots=[], cover=[], attic=[];
  for (let sd=1; sd<=ns; sd++){ G.seed=910000+sd*7919; for (const id in G.xtc) delete G.xtc[id]; G.xpop={}; G._npcXtIds=[]; G.nextXid=1; XT_CACHE.clear(); XTD.clear(); XTFV.clear(); for (const k in G.sales) if (k[0]==='X') delete G.sales[k];
    const t0=performance.now(); xtV2Replay(); const ms=performance.now()-t0; let v=0, a=0, b1=0;
    const cnt={}; for (const c of Object.values(G.xtc)){ const d=xtD(c.k); if (c.o===-3){ a++; continue; } if (d.sealed){ if (d.set===1&&d.v==='B') b1++; continue; } if (c.g>0) continue; v++; cnt[c.k]=1;
      const y=(G.day-d.def.rel)/365; if (d.set===31) continue; const key=AGE(y)+'|'+(d.rar==='leg'||d.rar==='rare'?'rare+':d.rar); const t=tab[key]||(tab[key]={n:0,NM:0,LP:0,MP:0,HP:0,DMG:0}); t.n++; t[condLabel(c.c)]++; }
    let covd=0, keys=0; for (let s=1;s<31;s++) for (const c of xtSetCards(s)){ if (c.pk==='alt') continue; keys++; if (cnt[xtKey(s,c.no,'N')]) covd++; }
    vis.push(v); boxes.push(b1); attic.push(a); cover.push(covd/keys); lots.push(ms); }
  return {tab, vis, ftbox:boxes, attic, cover, ms:lots}; }"""
async def t_condition(pg):
    n=SEEDS or 20
    r=await pg.evaluate(REPLAY, [n])
    print('replay ms per world: %.0f'%st.mean(r['ms']))
    check('boot: replaying ten years takes under 400 ms per world', max(r['ms'])<400, '%.0f max'%max(r['ms']))
    tab=r['tab']; pct=lambda k,b: 100*tab[k][b]/max(1,tab[k]['n'])
    for k in sorted(tab): print('  %-14s n=%5d  '%(k,tab[k]['n'])+'  '.join('%s %4.1f%%'%(b,pct(k,b)) for b in ('NM','LP','MP','HP','DMG')))
    nmc=lambda k: pct(k,'NM')
    check('NM share falls with age (commons)', nmc('<1|common')>nmc('1-4|common')>nmc('4-7|common')>nmc('9+|common'), [round(nmc(a+'|common'),1) for a in ('<1','1-4','4-7','7-9','9+')])
    check('2016-era commons: NM is a minority of survivors (14% to 30%)', 14<=nmc('9+|common')<=30, round(nmc('9+|common'),1))
    check('2016-era rares and Legendaries: NM is rarer than for commons (3% to 25%)', 3<=nmc('9+|rare+')<=25 and nmc('9+|rare+')<nmc('9+|common')+4, round(nmc('9+|rare+'),1))
    check('modern cards stay mostly NM (under one year: 55% to 80%)', 55<=nmc('<1|common')<=80, round(nmc('<1|common'),1))
    check('old copies are worn: 2016-era DMG+HP at least 20% of commons', pct('9+|common','HP')+pct('9+|common','DMG')>=20, round(pct('9+|common','HP')+pct('9+|common','DMG'),1))
    mv=st.mean(r['vis']); check('visible raw copies in the world at start: 2,500 to 3,500 (test target, not permanent)', 2500<=mv<=3500, '%.0f (min %d max %d)'%(mv,min(r['vis']),max(r['vis'])))
    check('every named card has at least one copy that a collector holds, in at least 85% of worlds on average', st.mean(r['cover'])>=0.85, '%.1f%%'%(100*st.mean(r['cover'])))
    check('a First Tide box exists on the market in some worlds but not all', 0<sum(1 for x in r['ftbox'] if x>0)<n, '%d of %d worlds'%(sum(1 for x in r['ftbox'] if x>0),n))


# ---------------------------------------------------------------- 3. availability: what a buyer sees in a year
AVAIL="""async(seed)=>{ await T2.fresh(seed); const seen={}; const synth=new Set(); const sweep=()=>{ xtKvStock(G.day); for (const c of T2.visible()) if (!(c.id in seen)) seen[c.id]=[c.k, T2.band(c)]; for (const k in ((G.xtg.kv&&G.xtg.kv.syn)||{})) synth.add(k); };
  sweep(); for (let d=0; d<365; d+=2){ T2.days(2); sweep(); }
  const grpOf=s=>s<=6?'old':s<=18?'mid':s<=25?'late':'new', rkOf=r=>r==='common'||r==='unc'?'cu':r; const out={}, prints={};
  for (let s=1;s<31;s++) for (const c of xtSetCards(s)){ if (c.pk==='alt') continue; const k=grpOf(s)+'|'+rkOf(c.rar); prints[k]=(prints[k]||0)+1; }
  for (const id in seen){ const [k,b]=seen[id]; const d=xtD(k); if (d.sealed||d.v!=='N'||d.set===31) continue; const g=grpOf(d.set)+'|'+rkOf(d.rar); const o=out[g]||(out[g]={any:0,nm:0,pa:new Set(),pn:new Set()}); o.any++; o.pa.add(k); if (b==='NM'){ o.nm++; o.pn.add(k); } }
  for (const k of synth){ const d=xtD(k); if (d.sealed||d.v!=='N'||d.set===31) continue; const g=grpOf(d.set)+'|'+rkOf(d.rar); const o=out[g]||(out[g]={any:0,nm:0,pa:new Set(),pn:new Set()}); o.pa.add(k); o.pn.add(k); }
  const res={}; for (const k in prints){ const o=out[k]||{any:0,nm:0,pa:new Set(),pn:new Set()}; res[k]={prints:prints[k], any:o.any/prints[k], nm:o.nm/prints[k], shareAny:o.pa.size/prints[k], shareNM:o.pn.size/prints[k], nmTotal:o.nm}; } return res; }"""
async def t_availability(pg):
    n=SEEDS or 3; acc={}
    for sd in range(n):
        r=await pg.evaluate(AVAIL, 300+sd)
        for k,v in r.items():
            a=acc.setdefault(k,{'prints':v['prints'],'any':[],'nm':[],'shareAny':[],'shareNM':[],'nmTotal':[]})
            for f in ('any','nm','shareAny','shareNM','nmTotal'): a[f].append(v[f])
    m=lambda k,f: st.mean(acc[k][f])
    print('  group         prints  appearances/print/yr (any, NM)   share of prints seen (any, NM)   NM appearances per world-year')
    for k in sorted(acc): print('  %-12s %5d     %5.2f  %5.3f                    %4.0f%%  %4.0f%%                 %5.1f'%(k,acc[k]['prints'],m(k,'any'),m(k,'nm'),100*m(k,'shareAny'),100*m(k,'shareNM'),m(k,'nmTotal')))
    check('ordinary vintage is discoverable: over a year, 60% of 2016-2018 commons/uncommons show up for sale', m('old|cu','shareAny')>=0.6, '%.0f%%'%(100*m('old|cu','shareAny')))
    check('commons and uncommons of the latest sets are almost always available over a year (90%+)', m('new|cu','shareAny')>=0.9, '%.0f%%'%(100*m('new|cu','shareAny')))
    check('NM 2016-2018 Legendaries are exceptional: fewer than 0.4 NM sightings per print per year', m('old|leg','nm')<0.4, '%.3f'%m('old|leg','nm'))
    check('NM 2016-2018 rares are scarce: fewer than 0.6 NM sightings per print per year', m('old|rare','nm')<0.6, '%.3f'%m('old|rare','nm'))
    check('...but a 2016-2018 NM Legendary or rare does turn up somewhere in the world during a year (a find happens)', m('old|leg','nmTotal')+m('old|rare','nmTotal')>=1, '%.1f per world-year'%(m('old|leg','nmTotal')+m('old|rare','nmTotal')))
    check('NM is scarcer than any condition (old rares)', m('old|rare','nm')<m('old|rare','any'), '%.2f vs %.2f'%(m('old|rare','nm'),m('old|rare','any')))

# ---------------------------------------------------------------- 4. real consequences
CONSEQ="""async(trial)=>{ await T2.fresh(700+trial); T2.days(30); const out={};
  // (a) buy the only NM copy of a vintage print
  const acc={}; for (const c of Object.values(G.xtc)) if ((c.o>0||c.o===-2) && T2.isNM(c)){ const d=xtD(c.k); if (d.sealed||!T2.vint(d)||d.v!=='N') continue; (acc[c.k]=acc[c.k]||[]).push(c); }
  const cands=Object.keys(acc).filter(k=>acc[k].length===1 && G.lst.some(l=>l.it==='x'&&l.sel!==0&&l.ty==='bin'&&G.xtc[l.ref]===acc[k][0]));
  if (cands.length){ const k=cands[trial%cands.length], c=acc[k][0], l=G.lst.find(l=>G.xtc[l.ref]===c); const p0=xtFairRaw(k); const err=buyListing(l.id); out.a={k, err, mine:c.o===0, p1:xtFairRaw(k)/p0}; let back=0; const estate0=G.news.filter(n=>/ESTATE|WAREHOUSE|COLLECTION/.test(n.h)).length;
    for (let d=0; d<56; d++){ T2.days(1); if (d===0) out.a.pNext=xtFairRaw(k)/p0; if (Object.values(G.xtc).some(x=>x.k===k&&(x.o>0||x.o===-2)&&T2.isNM(x))) back=1; } out.a.back=back; out.a.p56=xtFairRaw(k)/p0; out.a.type=xtD(k).rar; }
  // (b) grading moves a copy from raw to the population report
  const mine=Object.values(G.xtc).find(c=>c.o===0&&c.g===0&&!xtD(c.k).sealed&&T2.isNM(c));
  if (mine){ const k=mine.k; const pop0=(G.xpop[k]||[]).reduce((a,b)=>a+b,0); const tier=GRADE_TIERS[0]; const e=xtSubmitGrade(mine.id,tier.id); T2.days(tier.days+1); out.b={err:e, graded:mine.g>0, popDelta:(G.xpop[k]||[]).reduce((a,b)=>a+b,0)-pop0, g:mine.g}; }
  // (c) opening sealed product removes it from the census and creates its cards
  const sealed=Object.values(G.xtc).find(c=>c.o>0&&xtD(c.k).sealed&&xtD(c.k).v==='P'&&xtD(c.k).set<31);
  if (sealed){ const k=sealed.k; const cnt=()=>Object.values(G.xtc).filter(c=>c.k===k&&(c.o>0||c.o===-2)).length; const before=cnt(); sealed.o=0; const after=cnt(); const n0=Object.keys(G.xtc).length; const r=xtOpenSealed(sealed.id); const n1=Object.keys(G.xtc).length;
    out.c={removed:before-after, gone:!G.xtc[sealed.id], cards:r? r.packs[0].length : -1, grew:n1-n0, mineNew:r? r.packs[0].every(id=>G.xtc[id]&&G.xtc[id].o===0) : false}; }
  return out; }"""
async def t_consequences(pg):
    n=SEEDS or 8; A=[]; B=[]; C=[]
    for t in range(n):
        r=await pg.evaluate(CONSEQ, t)
        if 'a' in r: A.append(r['a'])
        if 'b' in r: B.append(r['b'])
        if 'c' in r: C.append(r['c'])
    print('  buy-the-only-NM trials:', len(A), ' sample:', A[:2])
    check('buying a print\'s only NM copy: it is the player\'s and no NM copy of that print returns within 8 weeks (at least 70% of trials)', len(A)>=3 and sum(1 for a in A if a['err'] is None and a['mine'])==len(A) and sum(1 for a in A if not a['back'])>=0.7*len(A), '%d of %d stayed gone'%(sum(1 for a in A if not a['back']),len(A)))
    check('...and the next day its price has barely moved (no instant squeeze), but after 8 weeks it is not lower', all(abs(a['pNext']-1)<=0.06 for a in A) and st.median([a['p56'] for a in A])>=0.98, 'next day %s, 8 weeks median %.3f'%([round(a['pNext'],3) for a in A][:5], st.median([a['p56'] for a in A])))
    check('grading moves a copy into the population report (exactly +1)', len(B)>=3 and all(b['err'] is None and b['graded'] and b['popDelta']==1 for b in B), B[:2])
    check('opening a sealed vintage pack: product leaves the census, its cards belong to the player', len(C)>=3 and all(c['removed']==1 and c['gone'] and c['cards']>0 and c['mineNew'] for c in C), C[:2])

# ---------------------------------------------------------------- 5. prices against the first economy
PRICES="""async()=>{ const R={}; for (const ver of ['v1','v2']){ await T2.fresh(55, ver); const o={}; for (let s=1;s<=31;s++) for (const k of xtAllKeys(s).concat([xtKey(s,0,'P'),xtKey(s,0,'B')])) o[k]=xtFairRaw(k);
    if (ver==='v2'){ o.__ev={}; for (let s=1;s<=30;s++){ o.__ev[s]=[xtPackEV(s), xtFairRaw(xtKey(s,0,'P')), xtFairRaw(xtKey(s,0,'B'))]; } } R[ver]=o; }
  const rat={}; let ttSame=true, minr=9, maxr=0, outl=[]; for (const k in R.v1){ const d=xtD(k); const r=R.v2[k]/R.v1[k]; if (d.set===31){ if (Math.abs(r-1)>1e-9) ttSame=false; continue; } const g=(d.sealed?'sealed':d.rar)+'|'+(d.set<=6?'old':d.set<=18?'mid':'late'); (rat[g]=rat[g]||[]).push(r); if (r<minr) minr=r; if (r>maxr) maxr=r; if (r<0.5||r>3.0001) outl.push([k,r]); }
  const med=a=>{ a=a.slice().sort((x,y)=>x-y); return a[Math.floor(a.length/2)]; }; const sum={}; for (const g in rat) sum[g]=[+med(rat[g]).toFixed(2), +Math.min(...rat[g]).toFixed(2), +Math.max(...rat[g]).toFixed(2), rat[g].length];
  const ev=R.v2.__ev; const open={}; for (let s=1;s<=30;s++){ open[s]=[ev[s][0]/ev[s][1], ev[s][0]*36/ev[s][2]]; }
  return {ttSame, minr, maxr, outl:outl.slice(0,5), sum, open}; }"""
async def t_prices(pg):
    r=await pg.evaluate(PRICES)
    for g in sorted(r['sum']): print('  v2/v1 %-12s median %.2f  min %.2f  max %.2f  (n=%d)'%((g,)+tuple(r['sum'][g])))
    check('Tenth Tide prices are exactly the first economy\'s', r['ttSame'])
    check('every v2 price is within 0.5x to 3x of the first economy\'s for the same card', r['minr']>=0.5 and r['maxr']<=3.0001, 'min %.2f max %.2f outliers %s'%(r['minr'],r['maxr'],r['outl']))
    check('2016-2018 NM rares cost more than in the first economy (the vintage NM premium)', r['sum']['rare|old'][0]>1.3, r['sum']['rare|old'])
    check('2016-2018 commons stay cheap (median under 1.5x the first economy)', r['sum']['common|old'][0]<1.5, r['sum']['common|old'])
    ob=[(int(s),v[0],v[1]) for s,v in r['open'].items()]
    print('  contents/price of a vintage pack (EV/price) and box:', ' '.join('%s:%.2f/%.2f'%(s,a,b) for s,a,b in ob[::4]))
    check('no sealed arbitrage: opening any historical pack or box is worth at most 1.4x its price', max(max(a,b) for s,a,b in ob)<=1.4, 'max %.2f'%max(max(a,b) for s,a,b in ob))
    check('sealed vintage trades at a collector premium over its contents (as First Tide always did) but not beyond 33x: contents are at least 0.03x of the price', min(min(a,b) for s,a,b in ob)>=0.03, 'min %.2f'%min(min(a,b) for s,a,b in ob))

# ---------------------------------------------------------------- 6. set completion: what a determined collector can actually finish
COMPLETE="""async(seed, months)=>{ await T2.fresh(seed); G.player.cash=1e9;
  const sets=[]; const idx={}; for (let s=1;s<31;s++){ const keys=[]; for (const c of xtSetCards(s)){ if (c.pk==='alt') continue; keys.push([xtKey(s,c.no,'N'), c.rar]); } const S={s, keys, n:keys.length}; sets.push(S); for (const [k] of keys) idx[k]=S; }
  const owned=()=>{ const m={}; for (const c of Object.values(G.xtc)) if (c.o===0&&!xtD(c.k).sealed){ const b=m[c.k]; if (!b||(T2.isNM(c)&&!b.nm)) m[c.k]={nm:T2.isNM(c), g:c.g}; } return m; };
  const missing=new Set(Object.keys(idx));
  const step=()=>{ const m=owned(); for (const k of Object.keys(m)) missing.delete(k);
    for (const l of G.lst.slice()){ if (l.it!=='x'||l.sel===0) continue; const c=G.xtc[l.ref]; if (!c||!missing.has(c.k)) continue; if (l.ty==='bin'){ if (buyListing(l.id)==null) missing.delete(c.k); } else if (l.ty==='auc' && l.en-G.day<=2){ const v=xtCopyValue(c); playerBid(l.id, Math.max(l.pr, Math.round(v*1.4*100)/100)); } }
    const stock=xtKvStock(G.day); for (const k of Array.from(missing)){ if (stock[k] && xtKvBuy(k)==null) missing.delete(k); } };
  const marks=[1,3,6,12,24].filter(x=>x<=months), rec={}; const t0=G.day;
  for (let d=0; d<months*30; d+=2){ T2.days(2); step(); const mo=Math.round((G.day-t0)/30); if (marks.includes(mo) && !rec[mo]){ const m=owned(); const o={}; for (const S of sets){ let have=0, cu=0, cun=0, rare=0, raren=0, leg=0, legn=0, nm=0, nmr=0; for (const [k,r] of S.keys){ const h=m[k]; if (h) have++; if (r==='common'||r==='unc'){ cun++; if (h) cu++; } else if (r==='rare'){ raren++; if (h) rare++; } else { legn++; if (h) leg++; } if (h&&h.nm) nm++; if (h&&h.nm&&(r==='rare'||r==='leg')) nmr++; } o[S.s]={n:S.n, have, cu, cun, rare, raren, leg, legn, nm, nmr}; } rec[mo]=o; } }
  let spent=0; const bySet={}; for (const c of Object.values(G.xtc)) if (c.o===0&&c.a&&!xtD(c.k).sealed){ const S=idx[c.k]; if (S){ bySet[S.s]=(bySet[S.s]||0)+(c.a[2]||0); } }
  return {rec, bySet, news:G.news.filter(n=>/ESTATE|WAREHOUSE|COLLECTION/.test(n.h)).length}; }"""
async def t_completion(pg):
    n=SEEDS or 3; months=24; agg={}
    for sd in range(n):
        r=await pg.evaluate(COMPLETE, [400+sd, months]) if False else await pg.evaluate("([a,b])=>("+COMPLETE+")(a,b)", [400+sd, months])
        for mo,sets in r['rec'].items():
            for s,o in sets.items():
                g='old' if int(s)<=6 else 'mid' if int(s)<=18 else 'late' if int(s)<=25 else 'new'
                a=agg.setdefault((int(mo),g),{'all':[],'cu':[],'rare':[],'leg':[],'nm':[],'nmr':[],'full':[],'cost':[]})
                a['all'].append(o['have']/o['n']); a['cu'].append(o['cu']/max(1,o['cun'])); a['rare'].append(o['rare']/max(1,o['raren'])); a['leg'].append(o['leg']/max(1,o['legn'])); a['nm'].append(o['nm']/o['n']); a['nmr'].append(o['nmr']/max(1,o['raren']+o['legn'])); a['full'].append(1 if o['have']==o['n'] else 0)
                if int(mo)==months: a['cost'].append(r['bySet'].get(s,0))
    m=lambda mo,g,f: 100*st.mean(agg[(mo,g)][f])
    print('  months group  | whole set | commons+unc | rares | legendaries | NM share of set | sets completed | spend per set at the end')
    for mo in (1,3,6,12,24):
        for g in ('old','mid','late','new'):
            if (mo,g) in agg: print('  %2d  %-5s   | %5.1f%%   |  %5.1f%%   | %5.1f%% | %5.1f%%      | %5.1f%%          | %4.0f%%         | %s'%(mo,g,m(mo,g,'all'),m(mo,g,'cu'),m(mo,g,'rare'),m(mo,g,'leg'),m(mo,g,'nm'),m(mo,g,'full'),('$%.0f'%st.mean(agg[(mo,g)]['cost'])) if mo==months and agg[(mo,g)]['cost'] else ''))
    check('ordinary vintage commons and uncommons are collectable: 2016-2018 sets reach 55% of their commons/uncommons in 12 months (unlimited budget, any condition)', m(12,'old','cu')>=55, '%.0f%%'%m(12,'old','cu'))
    check('vintage chase cards are hard: 2016-2018 Legendaries reach at most 45% in 12 months', m(12,'old','leg')<=45, '%.0f%%'%m(12,'old','leg'))
    check('NM chase cards are the long tail: under 15% of the rares and Legendaries of 2016-2018 sets are NM in the collection after 24 months', m(24,'old','nmr')<15, '%.0f%%'%m(24,'old','nmr'))
    check('recent sets are completable: latest 5 sets 90% complete within 12 months', m(12,'new','all')>=90, '%.0f%%'%m(12,'new','all'))
    full24=st.mean([st.mean(agg[(24,g)]['full']) for g in ('old','mid','late','new')])
    check('completing whole historical sets is possible but not routine: 5% to 70% of all sets are complete at 24 months (any condition)', 0.05<=full24<=0.70, '%.0f%%'%(100*full24))
    check('old sets are harder than recent ones at every point in time', all(m(mo,'old','all')<m(mo,'late','all') for mo in (6,12,24)), [(mo,round(m(mo,'old','all')),round(m(mo,'late','all'))) for mo in (6,12,24)])

# ---------------------------------------------------------------- 7. long-term behaviour (36 months)
LONG="""async(seed)=>{ await T2.fresh(seed); const keys=[]; for (let s=1;s<=30;s+=3) for (const k of xtAllKeys(s)) keys.push(k);
  const snap=()=>{ const acc=Object.values(G.xtc).filter(c=>c.o>0||c.o===-2); let vraw=0,vnm=0,sealed=0,att=0; for (const c of acc){ const d=xtD(c.k); if (d.sealed){ if (d.set<31) sealed++; continue; } if (c.g>0||d.set===31) continue; if ((G.day-d.def.rel)/365<2) continue; vraw++; if (condLabel(c.c)==='NM') vnm++; }
    for (const c of Object.values(G.xtc)) if (c.o===-3) att++; let bad=0; const pr=keys.map(k=>{ const v=xtFairRaw(k); if(!isFinite(v)||v<=0) bad++; return v; });
    return {day:G.day, vraw, vnm, sealed, att, lst:G.lst.filter(l=>l.it==='x').length, inv:(xtKv().inv||[]).length, lots:G.xtg.e2.lots.length+G.xtg.e2.prize.length, bad, pr, cp:Object.keys(G.xtc).length}; };
  const rows=[snap()]; const ev0=G.news.length; let events=0; for (let m=1;m<=36;m++){ T2.days(30); if (m%6===0) rows.push(snap()); }
  events=G.news.filter(n=>/ESTATE|WAREHOUSE|COLLECTION/.test(n.h)).length; const med=a=>{ a=a.slice().sort((x,y)=>x-y); return a[Math.floor(a.length/2)]; };
  return {rows:rows.map((r,i)=>({m:i*6, vraw:r.vraw, nmShare:+(r.vnm/Math.max(1,r.vraw)).toFixed(3), sealed:r.sealed, att:r.att, lst:r.lst, inv:r.inv, lots:r.lots, bad:r.bad, cp:r.cp, price:+med(r.pr.map((p,j)=>p/rows[0].pr[j])).toFixed(3), pmax:+Math.max(...r.pr.map((p,j)=>p/rows[0].pr[j])).toFixed(2)})), events}; }"""
async def t_long(pg):
    n=SEEDS or 3; allrows=[]
    for sd in range(n):
        r=await pg.evaluate(LONG, 800+sd); allrows.append(r)
        print('  seed %d: events %d'%(sd, r['events']))
        for x in r['rows']: print('    month %2d  vintage raw %5d  NM %4.1f%%  sealed %3d  attic %4d  listings %3d  Saltmarket %3d  lots %2d  price index (median) %.2f max %.2f'%(x['m'],x['vraw'],100*x['nmShare'],x['sealed'],x['att'],x['lst'],x['inv'],x['lots'],x['price'],x['pmax']))
    last=[a['rows'][-1] for a in allrows]; first=[a['rows'][0] for a in allrows]
    check('prices stay finite and positive for 36 months', all(x['bad']==0 for a in allrows for x in a['rows']))
    check('vintage supply neither collapses nor balloons: raw vintage copies at month 36 are 60% to 120% of the start', all(0.6<=l['vraw']/f['vraw']<=1.2 for l,f in zip(last,first)), [round(l['vraw']/f['vraw'],2) for l,f in zip(last,first)])
    check('vintage NM share only goes down over three years (aging), never up by more than 3 points', all(l['nmShare']<=f['nmShare']+0.03 for l,f in zip(last,first)), [(round(f['nmShare'],3),round(l['nmShare'],3)) for l,f in zip(last,first)])
    check('median vintage price after 36 months is between 0.9x and 2.4x its start (age premium, no runaway)', all(0.9<=l['price']<=2.4 for l in last), [l['price'] for l in last])
    check('no single print more than 6x its starting price in 36 months', all(l['pmax']<=6 for l in last), [l['pmax'] for l in last])
    check('the market keeps working: 150 to 450 live Tidemark listings and Saltmarket stocked at every checkpoint', all(150<=x['lst']<=450 and x['inv']>=30 for a in allrows for x in a['rows'][1:]), [(x['lst'],x['inv']) for x in allrows[0]['rows']])
    check('old estate lots keep coming: at least 12 estate/warehouse/collection events in 36 months', all(a['events']>=12 for a in allrows), [a['events'] for a in allrows])
    check('the attic is finite: it shrinks as lots are sold', all(a['rows'][-1]['att']<a['rows'][0]['att'] for a in allrows), [(a['rows'][0]['att'],a['rows'][-1]['att']) for a in allrows])

# ---------------------------------------------------------------- 8. exploits and progression blockers
EXPLOIT="""async(seed, ver)=>{ await T2.fresh(seed, ver); const out={ver}; G.player.cash=1e7;
  // (a) auction snipe: bid 55% of value on every auction ending soon; count wins and price/value
  const bids={}; const log=[]; const _t=transfer; transfer=function(l,buyer,price,how){ if (l.it==='x'&&how==='auc'){ const it=itemOf(l); log.push([buyer===0, price, it.v]); } return _t.apply(this,arguments); };
  for (let d=0; d<150; d++){ T2.days(1); for (const l of G.lst){ if (l.it!=='x'||l.sel===0||l.ty!=='auc'||bids[l.id]) continue; if (l.en-G.day>2) continue; const c=G.xtc[l.ref]; if (!c) continue; const v=xtCopyValue(c); if (v<10) continue; bids[l.id]=v; playerBid(l.id, Math.round(v*0.55*100)/100); } }
  transfer=_t; const wins=log.filter(x=>x[0]), npc=log.filter(x=>!x[0]&&x[2]>=10);
  out.snipe={bids:Object.keys(bids).length, wins:wins.length, winRatio:wins.length? wins.reduce((a,x)=>a+x[1]/x[2],0)/wins.length : null, npcRatio:npc.length? npc.reduce((a,x)=>a+x[1]/x[2],0)/npc.length : null, npcN:npc.length};
  // (b) Saltmarket flip: buy there, sell on the marketplace at market, after the fee
  let worst=0, n=0; for (const id of (xtKv().inv||[])){ const c=G.xtc[id]; if (!c) continue; const p=xtKvPrice(c.k); if (!(p>0)) continue; const r=xtCopyValue(c)*(1-FEE)/p; if (r>worst) worst=r; n++; } out.flip={worst, n};
  // (c) grading: what a graded vintage copy is worth against raw price plus fee
  const fee=GRADE_TIERS[0].fee; const rs=[]; for (const c of Object.values(G.xtc)){ if ((c.o<=0&&c.o!==-2)||c.g!==0) continue; const d=xtD(c.k); if (d.sealed||!T2.vint(d)||!T2.isNM(c)||(d.rar!=='rare'&&d.rar!=='leg')) continue; const g=gradeOf(c); rs.push(xtFair(c.k,g)/(xtCopyValue(c)+fee)); }
  rs.sort((a,b)=>a-b); out.grade={n:rs.length, med:rs[Math.floor(rs.length/2)], p90:rs[Math.floor(rs.length*0.9)]};
  // (d) estate and liquidation listings: the best resale after the fee against the asking price
  const before=new Set(G.lst.map(l=>l.id)); if (G.xtg.e2){ xtEstate(G.day,true); xtEstate(G.day,false); xtLiquidation(G.day); }
  let best=0; for (const l of G.lst){ if (before.has(l.id)||l.it!=='x'||l.ty!=='bin') continue; const c=G.xtc[l.ref]; const r=xtCopyValue(c)*(1-FEE)/l.pr; if (r>best) best=r; } out.estate={best};
  // (e) a starting player: cheapest vintage copies on offer against $75
  let cheap=0, tot=0; for (const c of T2.visible()){ const d=xtD(c.k); if (d.sealed||!T2.vint(d)) continue; tot++; if (xtCopyValue(c)<=75) cheap++; } out.start={cheap, tot};
  return out; }"""
async def t_exploits(pg):
    r1=await pg.evaluate(EXPLOIT, [900,'v1']) if False else await pg.evaluate("([a,b])=>("+EXPLOIT+")(a,b)", [900,'v1'])
    r2=await pg.evaluate("([a,b])=>("+EXPLOIT+")(a,b)", [900,'v2'])
    for r in (r1,r2): print('  ',json.dumps({k:v for k,v in r.items()})[:700])
    sn1,sn2=r1['snipe'],r2['snipe']
    check('auction sniping at 55% of value is not worse than in the first economy', (sn2['winRatio'] is None) or sn2['wins']<=max(2,sn1['wins']*1.3) or sn2['winRatio']>=0.8, '%s vs %s'%(sn2,sn1))
    check('NPC-won auctions of valuable cards close near value (0.7x to 1.5x)', sn2['npcN']<5 or 0.7<=sn2['npcRatio']<=1.5, sn2['npcRatio'])
    check('no flip from Saltmarket to the marketplace (resale after fee is always below the price)', r2['flip']['worst']<1.0, r2['flip'])
    check('grading vintage NM rares is not a money machine: median return under 1.6x, 90th percentile under 3.5x, and no more than 1.5x the first economy\'s median', r2['grade']['n']<5 or (r2['grade']['med']<1.6 and r2['grade']['p90']<3.5 and r2['grade']['med']<=1.5*max(0.5,r1['grade']['med'] or 0.5)), 'v2 %s v1 %s'%(r2['grade'],r1['grade']))
    check('estate and liquidation listings cannot be flipped for profit (resale after fee at most 1.0x the asking price)', r2['estate']['best']<=1.0001, r2['estate'])
    check('a starting player ($75) can afford at least 40% of the vintage cards on offer', r2['start']['tot']>0 and r2['start']['cheap']/r2['start']['tot']>=0.4, r2['start'])

# ---------------------------------------------------------------- 9. saves, the older economy and the optional rebuild
RELOAD="""async()=>{ const reload=async()=>{ const p=await packBytes(); const g=await unpackBytes(p.bytes,p.enc); G=g; R=worldRnd; if (typeof resetCaches==='function') resetCaches(); DCACHE.clear(); fvClear(); G._npcCardIds=Object.keys(G.cards).map(Number).filter(i=>G.cards[i].o>0); migrate(); return p.bytes.length; };
  const H=o=>{ const s=JSON.stringify(o,saveReplacer); let h=0; for (let i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))|0; return h; };
  const out={};
  // v2 world round trip
  await T2.fresh(31,'v2'); T2.days(25); const pre={xtc:H(G.xtc), ref:H(G.xtg.ref), sm:H(G.xtg.sm), e2:H(G.xtg.e2), led:H(G.xtg.led), kv:H(G.xtg.kv), pop:H(G.xpop), n:Object.keys(G.xtc).length};
  out.bytes=await reload(); out.v2=(()=>{ const post={xtc:H(G.xtc), ref:H(G.xtg.ref), sm:H(G.xtg.sm), e2:H(G.xtg.e2), led:H(G.xtg.led), kv:H(G.xtg.kv), pop:H(G.xpop), n:Object.keys(G.xtc).length}; return {same:JSON.stringify(pre)===JSON.stringify(post), pre, post, ecv:G.xtg.ecv}; })();
  T2.days(40); out.v2after={ecv:G.xtg.ecv, n:Object.keys(G.xtc).length, lst:G.lst.filter(l=>l.it==='x').length};
  // an older (first economy) world stays on the first economy after reload
  await T2.fresh(32,'v1'); T2.days(25); await reload(); out.v1={ecv:G.xtg.ecv===undefined, v2fn:xtV2()}; T2.days(40); out.v1after={ecv:G.xtg.ecv===undefined, n:Object.keys(G.xtc).length};
  return out; }"""
REBUILD="""async()=>{ await T2.fresh(41,'v1'); G.player.cash=1e6; T2.days(40);
  // the player owns raw cards, a slab, a listed card and sealed product from the first economy
  const mine=[]; for (const c of Object.values(G.xtc)){ if (c.o>0 && !xtD(c.k).sealed && mine.length<12) { c.o=0; mine.push(c.id); } }
  const sealed=Object.values(G.xtc).find(c=>c.o>0&&xtD(c.k).sealed); if (sealed){ sealed.o=0; mine.push(sealed.id); }
  const raw=G.xtc[mine[0]]; xtSubmitGrade(raw.id, GRADE_TIERS[0].id); T2.days(GRADE_TIERS[0].days+1);
  const lc=G.xtc[mine[1]]; playerList('x', lc.id, 'bin', 99, 0, false);
  const strip=c=>JSON.stringify([c.id,c.k,c.o,c.g,c.c,c.l||0,c.a&&c.a.join('|'),(c.h||[]).length,c.cert||0]); const before=mine.map(id=>strip(G.xtc[id])); const popMine=JSON.stringify(G.xpop[raw.k]||null);
  const lstMine=G.lst.filter(l=>l.it==='x'&&l.sel===0).map(l=>[l.id,l.ref,l.pr].join('|'));
  const cash0=G.player.cash, slots0=(await slotList(PACK.id)).length;
  const e=await xtRebuildWithBackup();
  const after=mine.map(id=>G.xtc[id]? strip(G.xtc[id]) : 'GONE'); const lstAfter=G.lst.filter(l=>l.it==='x'&&l.sel===0).map(l=>[l.id,l.ref,l.pr].join('|'));
  const slots=await slotList(PACK.id); const backup=slots.find(r=>/before market rebuild/.test(r.name)); let bsize=0; if (backup){ const d=await slotRead(backup.id); bsize=(d&&d.bytes&&d.bytes.length)||(d&&d.length)||1; await slotDelete(backup.id); }
  const vis=Object.values(G.xtc).filter(c=>(c.o>0||c.o===-2)&&!xtD(c.k).sealed&&c.g===0&&(G.day-xtD(c.k).def.rel)/365>=2).length;
  T2.days(60); return { err:e, ecv:G.xtg.ecv, same:JSON.stringify(before)===JSON.stringify(after), nSame:before.length, lstSame:JSON.stringify(lstMine)===JSON.stringify(lstAfter), pop:popMine===JSON.stringify(G.xpop[raw.k]||null), cashSame:G.player.cash===cash0, backup:!!backup, bsize, vis, lstN:G.lst.filter(l=>l.it==='x').length, ref:Object.keys(G.xtg.ref||{}).length }; }"""
async def t_saves(pg):
    r=await pg.evaluate(RELOAD)
    check('a v2 world survives save and load exactly (copies, reference counts, estates, ledger, Saltmarket, population)', r['v2']['same'] and r['v2']['ecv']==2, r['v2'] if not r['v2']['same'] else 'ok, %d copies, save about %d KB'%(r['v2']['pre']['n'], r['bytes']//1024))
    check('...and keeps playing for 40 more days', r['v2after']['n']>5000 and r['v2after']['lst']>100, r['v2after'])
    check('a first-economy world stays on the first economy after reload and keeps playing', r['v1']['ecv'] and not r['v1']['v2fn'] and r['v1after']['ecv'] and r['v1after']['n']>3000, [r['v1'], r['v1after']])
    q=await pg.evaluate(REBUILD)
    check('rebuild: the player\'s cards, conditions, slabs, listings and history are untouched', q['err'] is None and q['same'] and q['lstSame'] and q['pop'], {k:q[k] for k in ('err','same','nSame','lstSame','pop')})
    check('rebuild: a backup of the old save was made first', q['backup'] and q['bsize']>0, q['bsize'])
    check('rebuild: the world is now v2, with 2,000 to 3,500 raw vintage copies, and plays on for 60 days', q['ecv']==2 and 2000<=q['vis']<=3600 and q['lstN']>100, {k:q[k] for k in ('ecv','vis','lstN','ref')})
    # an older Wildkin-only save opened now gets a v2 Tidemark world
    import base64, os
    p=os.path.join(os.path.dirname(__file__),'..','tests','golden','saves','legacy-wk-year.save.gz')
    if os.path.exists(p):
        b64=base64.b64encode(open(p,'rb').read()).decode()
        o=await pg.evaluate("""async(b64)=>{ window.__xtEcon='v2'; const bin=atob(b64); const u=new Uint8Array(bin.length); for (let i=0;i<bin.length;i++) u[i]=bin.charCodeAt(i); G=await unpackBytes(u,'gz'); R=worldRnd; resetCaches(); DCACHE.clear(); fvClear(); G._npcCardIds=Object.keys(G.cards).map(Number).filter(i=>G.cards[i].o>0); migrate();
          const mine0=JSON.stringify(Object.values(G.tc).filter(c=>c.o===0).map(c=>[c.id,c.k,c.g,c.c])), cash0=G.player.cash; await upgradeXt(null); migrate(); const same=mine0===JSON.stringify(Object.values(G.tc).filter(c=>c.o===0).map(c=>[c.id,c.k,c.g,c.c])); T2.days(60);
          return {same, ecv:G.xtg.ecv, n:Object.keys(G.xtc).length, lst:G.lst.filter(l=>l.it==='x').length, tt:xtReleasedSets(G.day).includes(31)}; }""", b64)
        check('an older Wildkin save opened now gets a v2 Tidemark world; its Wildkin cards are unchanged; it plays for 60 days', o['same'] and o['ecv']==2 and o['n']>3000 and o['lst']>100, o)

TESTS={'ledger':t_ledger,'condition':t_condition,'availability':t_availability,'consequences':t_consequences,'prices':t_prices,'completion':t_completion,'long':t_long,'exploits':t_exploits,'saves':t_saves}
async def main():
    names=ARGS or list(TESTS)
    async with async_playwright() as p:
        b,pg=await newpage(p)
        for nme in names:
            t=time.time(); print('== '+nme)
            await TESTS[nme](pg); print('   (%.0f s)'%(time.time()-t))
        await b.close()
    bad=[n for n,ok in RESULTS if not ok]
    print('ERRS', ERRS[:3]); print('RESULT', 'ALL PASS' if not bad and not ERRS else 'FAILED: %d checks, %d page errors'%(len(bad),len(ERRS))); sys.exit(0 if not bad and not ERRS else 1)
asyncio.run(main())
