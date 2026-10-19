#!/usr/bin/env python3
"""Creates REAL pre-Tidemark Wildkin saves with the old code (commit f856534, before Tidemark existed) for the golden save tests. Never overwrites.
The current build must open them (the Tidemark world is added on load) and behave exactly as recorded.
  python3 tools/golden/make_legacy_saves.py          (builds the old commit in a temporary git worktree and serves it on port 8771)"""
import asyncio, os, sys, subprocess, base64, time, shutil
from playwright.async_api import async_playwright
ROOT=os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))); SAVES=os.path.join(ROOT,'tests','golden','saves'); OLD='/tmp/golden_old_repo'; REV='f856534'
JS={
 'legacy-wk-day1':"(async()=>{ await newGame(20261019,null); migrate(); UI.scn=null; G.player.cash=5000; return packSave(); })()",
 'legacy-wk-released':"(async()=>{ await newGame(20261019,null); migrate(); UI.scn=null; G.player.cash=5000; for (let i=0;i<40;i++) advanceDay(); return packSave(); })()",
 'legacy-wk-busy':"(async()=>{ await newGame(20261019,null); migrate(); UI.scn=null; G.player.cash=5000; for (let i=0;i<8;i++) advanceDay(); tcBuySealed(1,'P',5); const ps=myTc().filter(c=>tcD(c.k).sealed&&tcD(c.k).v==='P'); let got=[]; for (const p of ps.slice(0,4)){ const r=tcOpenSealed(p.id); got=got.concat(r.packs[0].map(i=>G.tc[i])); } got.sort((a,b)=>tcCopyValue(b)-tcCopyValue(a)); tcSubmitGrade(got[0].id,'std'); playerList('t',got[1].id,'bin',tcCopyValue(got[1])*1.2,5,true); playerList('t',got[2].id,'auc',tcCopyValue(got[2])*0.9,5,true); tcPreorder(2,'P',3); for (let i=0;i<14;i++) advanceDay(); return packSave(); })()",
 'legacy-wk-year':"(async()=>{ await newGame(20261019,null); migrate(); UI.scn=null; G.player.cash=5000; for (let i=0;i<240;i++) advanceDay(); return packSave(); })()",
}
PACKSAVE="window.packSave=async function(){ const p=await packBytes(); let s=''; const a=p.bytes; for (let i=0;i<a.length;i+=8192) s+=String.fromCharCode.apply(null,a.subarray(i,i+8192)); return btoa(s); }"
async def main():
    os.makedirs(SAVES,exist_ok=True); todo=[n for n in JS if not os.path.exists(os.path.join(SAVES,n+'.save.gz'))]
    if not todo: print('all legacy saves exist'); return
    if not os.path.isdir(OLD): subprocess.run(['git','-C',ROOT,'worktree','add','-f',OLD,REV],check=True,capture_output=True)
    subprocess.run([sys.executable,'tools/build.py','tcg'],cwd=OLD,check=True,capture_output=True)
    srv=subprocess.Popen([sys.executable,'-m','http.server','8771'],cwd=os.path.join(OLD,'dist'),stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1.5)
    try:
        async with async_playwright() as p:
            b=await p.chromium.launch(); pg=await (await b.new_context()).new_page(); await pg.route('**/fonts.g*/**',lambda r:r.abort()); await pg.goto('http://localhost:8771/tcg/index.html'); await pg.wait_for_selector('#launch'); await pg.evaluate(PACKSAVE)
            for n in todo:
                b64=await pg.evaluate(JS[n]); open(os.path.join(SAVES,n+'.save.gz'),'wb').write(base64.b64decode(b64)); print('wrote',n,len(b64)*3//4//1024,'KB')
            await b.close()
    finally: srv.terminate(); subprocess.run(['git','-C',ROOT,'worktree','remove','--force',OLD],capture_output=True)
asyncio.run(main())
