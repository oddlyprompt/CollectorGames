#!/usr/bin/env python3
"""Bit-identical golden tests for the card games (Wildkin and Tidemark in the tcg build).

  python3 tools/golden/golden.py check   [names...]     compare the current build with tests/golden/baseline (default: everything)
  python3 tools/golden/golden.py capture [names...]     write baselines that do not exist yet (never overwrites)
  python3 tools/golden/golden.py capture NAME --rebaseline "reason"   overwrite one baseline on purpose; the reason is logged in tests/golden/REBASELINES.md
  python3 tools/golden/golden.py fixtures [names...]    create saved-game fixtures from the CURRENT build (never overwrites)
  python3 tools/golden/golden.py list

Needs the dist server (cd dist && python3 -m http.server 8770) and a built tcg (python3 tools/build.py tcg). Scenarios and what they freeze are described in
tests/golden/README.md. A failing check prints the first differences by path. Investigate them; do not re-baseline to make a test pass."""
import asyncio, sys, os, json, gzip, base64, time, datetime
from playwright.async_api import async_playwright
ROOT=os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))); G=os.path.join(ROOT,'tests','golden'); BASE=os.path.join(G,'baseline'); SAVES=os.path.join(G,'saves')
PORT=os.environ.get('GOLDEN_PORT','8770'); PROBE=os.path.join(ROOT,'tools','golden','probe.js')
SCENARIOS=['day0','release','year1','series','flows','shared']
def fixtures(): return sorted(f[:-len('.save.gz')] for f in os.listdir(SAVES) if f.endswith('.save.gz')) if os.path.isdir(SAVES) else []
def all_names(): return SCENARIOS+['save:'+f for f in fixtures()]+['open:'+f for f in fixtures() if f in OPEN_FIXTURES]
OPEN_FIXTURES=('legacy-wk-day1','legacy-wk-year','busy','ban')
def diff(a,b,path='',out=None,limit=25):
    out=[] if out is None else out
    if len(out)>=limit: return out
    if isinstance(a,dict) and isinstance(b,dict):
        for k in sorted(set(a)|set(b),key=str):
            if k not in a: out.append(f'{path}/{k}: missing in baseline, now {short(b[k])}')
            elif k not in b: out.append(f'{path}/{k}: baseline {short(a[k])}, missing now')
            else: diff(a[k],b[k],f'{path}/{k}',out,limit)
    elif isinstance(a,list) and isinstance(b,list):
        if len(a)!=len(b): out.append(f'{path}: length {len(a)} -> {len(b)}')
        for i,(x,y) in enumerate(zip(a,b)):
            if x!=y: diff(x,y,f'{path}[{i}]',out,limit)
            if len(out)>=limit: break
    elif a!=b: out.append(f'{path}: {short(a)} -> {short(b)}')
    return out
def short(x): s=json.dumps(x); return s if len(s)<90 else s[:87]+'...'
def path_of(name): return os.path.join(BASE,name.replace(':','_')+'.json.gz')
def load_base(name):
    with gzip.open(path_of(name),'rt') as f: return json.load(f)
def write_base(name,data):
    os.makedirs(BASE,exist_ok=True)
    with gzip.open(path_of(name),'wt',compresslevel=9) as f: json.dump(data,f,separators=(',',':'),allow_nan=False)
async def page_for(p):
    b=await p.chromium.launch(); ctx=await b.new_context(viewport={'width':430,'height':900}); await ctx.add_init_script("window.__xtEcon='v1'"); pg=await ctx.new_page(); errs=[]
    pg.on('pageerror',lambda e:errs.append('PAGE '+str(e)[:300])); pg.on('console',lambda m:errs.append('CON '+m.text[:300]) if m.type=='error' and 'fonts.g' not in m.text and 'ERR_' not in m.text else None)
    await pg.route('**/fonts.g*/**',lambda r:r.abort()); await pg.goto(f'http://localhost:{PORT}/tcg/index.html'); await pg.wait_for_selector('#launch',timeout=60000)
    await pg.add_script_tag(path=PROBE); return b,pg,errs
async def run(pg,name):
    if name.startswith('save:') or name.startswith('open:'):
        b64=base64.b64encode(open(os.path.join(SAVES,name[5:]+'.save.gz'),'rb').read()).decode()
        return await pg.evaluate('b=>GOLDEN.SC.'+('save' if name.startswith('save:') else 'open')+'(b)',b64)
    return await pg.evaluate(f'GOLDEN.SC.{name}()')
async def main():
    cmd=sys.argv[1] if len(sys.argv)>1 else 'check'; args=[a for a in sys.argv[2:] if not a.startswith('--')]
    reb=None
    if '--rebaseline' in sys.argv: reb=sys.argv[sys.argv.index('--rebaseline')+1]; args=[a for a in args if a!=reb]
    if cmd=='list': print('\n'.join(all_names())); return 0
    async with async_playwright() as p:
        if cmd=='fixtures':
            os.makedirs(SAVES,exist_ok=True); names=args or ['day1','released','busy','ban']; b,pg,errs=await page_for(p)
            for n in names:
                f=os.path.join(SAVES,n+'.save.gz')
                if os.path.exists(f): print('exists, kept:',n); continue
                t=time.time(); b64=await pg.evaluate(f'GOLDEN.FX.{n}()'); open(f,'wb').write(base64.b64decode(b64)); print('wrote',n,len(b64)*3//4//1024,'KB',round(time.time()-t,1),'s')
            await b.close(); return 0
        names=args or all_names(); fail=0
        for name in names:
            t=time.time(); b,pg,errs=await page_for(p)
            try:
                cur=json.loads(json.dumps(await run(pg,name)))
                if errs: print('FAIL',name,'page errors:',errs[:2]); fail+=1; await b.close(); continue
                if cmd=='capture':
                    exists=os.path.exists(path_of(name))
                    if exists and reb is None: print('kept (exists; use --rebaseline "reason" to replace on purpose):',name); await b.close(); continue
                    # the harness must itself be deterministic: the scenario is run again in a brand-new page and must match exactly
                    await b.close(); b,pg,errs=await page_for(p); again=json.loads(json.dumps(await run(pg,name)))
                    d=diff(cur,again)
                    if d: print('NOT DETERMINISTIC, nothing written:',name); [print('   ',x) for x in d]; fail+=1; await b.close(); continue
                    if exists:
                        old=load_base(name); ch=diff(old,cur)
                        with open(os.path.join(G,'REBASELINES.md'),'a') as f: f.write(f'\n## {datetime.date.today()} {name}\nReason: {reb}\nChanged ({len(ch)}+ differences), first ones:\n'+''.join(f'- {x}\n' for x in ch[:15]))
                    write_base(name,cur); print('captured',name,round(time.time()-t,1),'s')
                else:
                    base=load_base(name); d=diff(base,cur)
                    if d: print('FAIL',name,f'({len(d)}+ differences)'); [print('   ',x) for x in d]; fail+=1
                    else: print('PASS',name,round(time.time()-t,1),'s')
            except Exception as e:
                print('FAIL',name,'error:',str(e)[:300]); fail+=1
            await b.close()
        print('RESULT','FAIL '+str(fail) if fail else 'ALL PASS'); return 1 if fail else 0
sys.exit(asyncio.run(main()))
