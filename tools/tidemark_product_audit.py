"""Tidemark product integrity audit (read-only): opens 600 simulated boxes of every set (300 of Tenth Tide) under both sealed-price formulas and writes the
results to /tmp/claude-0/audit.json (change OUT below). Needs the dist server on 8770 and a built tcg. It changes no game data.
  python3 tools/tidemark_product_audit.py"""
import asyncio, json
OUT='/tmp/claude-0/audit.json'
from playwright.async_api import async_playwright
JS="""async()=>{ const out={};
  for (const ver of ['v1','v2']){ window.__xtEcon=ver; await newGame(5,null); migrate(); for (let i=0;i<30;i++) advanceDay(); const rows=[];
   for (let s=1;s<=31;s++){ const N=xtSetCards(s).filter(c=>c.pk!=='alt').length; const nB=s===1?600:s===31?300:600; const vals=[]; const pk={0:0,1:0,2:0,'3-5':0,'6+':0}; let tracked=0, dupShare=0, distinct=0, maxCopy=0, boxes=0, nonNM=0; const boxHasLeg=[], cardBoxes={};
    const r=mkRng(1000+s); const P=xtPools(s);
    for (let b=0;b<nB;b++){ const cnt={}; let v=0, tr=0; for (let p=0;p<36;p++){ const keys=xtRollPack(s,r); const n=keys.length; if (n===0) pk[0]++; else if (n===1) pk[1]++; else if (n===2) pk[2]++; else if (n<=5) pk['3-5']++; else pk['6+']++; tr+=n; v+=keys.bulk*XT_BULK; for (const k of keys){ cnt[k]=(cnt[k]||0)+1; v+=xtFairRaw(k); } }
      vals.push(v); tracked+=tr; const ks=Object.keys(cnt); distinct+=ks.length; let mc=0; for (const k of ks) if (cnt[k]>mc) mc=cnt[k]; maxCopy+=mc; dupShare+= tr? 1-ks.length/tr : 0; }
    vals.sort((a,b)=>a-b); const q=f=>vals[Math.floor(f*(vals.length-1))]; const mean=vals.reduce((a,b)=>a+b,0)/vals.length;
    const kP=xtKey(s,0,'P'), kB=xtKey(s,0,'B'); const ev=xtPackEV(s);
    rows.push({s, code:xtSetDef(s).code, N, advertised:xtSetDef(s).size, packs:{z:+(pk[0]/(nB*36)*100).toFixed(1), one:+(pk[1]/(nB*36)*100).toFixed(1), two:+(pk[2]/(nB*36)*100).toFixed(1), mid:+(pk['3-5']/(nB*36)*100).toFixed(1), big:+(pk['6+']/(nB*36)*100).toFixed(1)}, trackedPerBox:+(tracked/nB).toFixed(0), distinctPerBox:+(distinct/nB).toFixed(1), dupShare:+(dupShare/nB*100).toFixed(0), copiesOfTopCard:+(maxCopy/nB).toFixed(1), mean:+mean.toFixed(0), p1:+q(0.01).toFixed(1), p10:+q(0.1).toFixed(1), p50:+q(0.5).toFixed(1), p90:+q(0.9).toFixed(0), p99:+q(0.99).toFixed(0), under10:+(vals.filter(x=>x<10).length/vals.length*100).toFixed(1), packEV:+ev.toFixed(2), packPrice:+xtFairRaw(kP).toFixed(2), boxPrice:Math.round(xtFairRaw(kB)), poolC:P.c.length, poolU:P.u.length, poolR:P.r.length, poolL:P.l.length}); }
   out[ver]=rows; }
  return out; }"""
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(); pg=await (await b.new_context()).new_page(); await pg.route('**/fonts.g*/**', lambda r: r.abort())
        await pg.goto('http://localhost:8770/tcg/index.html'); await pg.wait_for_selector('#launch'); await pg.click('[data-lact=new]'); await pg.click('[data-lact=start]')
        await pg.wait_for_function("window.G && G.player && G.player.start>0 && document.getElementById('boot').style.display==='none'", timeout=90000)
        r=await pg.evaluate(JS); json.dump(r,open(OUT,'w')); await b.close()
asyncio.run(main())
