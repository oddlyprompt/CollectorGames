// ===================== TCG: SAVES, THE DAILY TICK, NEW AND OLD WORLDS =====================
const _srep=saveReplacer; saveReplacer=function(k,v){ if (k==='tc' && this===G && v && typeof v==='object' && !Array.isArray(v)){ const o={}; for (const id in v){ const c=v[id]; const x=Object.assign({},c); x.c=String.fromCharCode(...c.c.map(n=>n+48)); if (c.o!==0) delete x.a; o[id]=x; } return o; } return _srep.call(this,k,v); };
// a save made before Version 1 (prototype cards) has no content version; it is never loaded into this world (see pack_apply.js)
function tcIsLegacy(g){ return !!(g && g.tcg && !(g.tcg.cv>=TC_CV)); }
function tcNormalize(){
  if (!G.tcg || tcIsLegacy(G)) return; for (const id in G.tc){ const c=G.tc[id]; if (typeof c.c==='string') c.c=[...c.c].map(ch=>ch.charCodeAt(0)-48); }
  G.nextTid=G.nextTid||1; G.tpop=G.tpop||{}; const T=G.tcg; for (const k of ['usage','t8','hy','ban','dom','shop','ann','rev','rel']) T[k]=T[k]||{}; T.pre=T.pre||[]; T.arch=T.arch||[]; T.ev=T.ev||[];
  G._npcTcIds=Object.keys(G.tc).map(Number).filter(id=>G.tc[id].o>0); delete G._tcPool; delete G._cmPool; delete G._cdPool; TC_CACHE.clear(); TCD.clear(); TCFV.clear(); TC_BYCID.clear(); T.mv=WK_CANON.set.mv;
  // saves from before the rules engine (or an older engine) get a fresh field; bans, prices and history stay
  if (T.rv!==WKR.RV || T.arch.some(a=>!a.cnt) || (T.mx && T.mx.bs!==tcBaseSig())){ T.mx=null; T.arch=[]; T.dom={}; if (tcReleasedSets(G.day).length) tcRebuildMeta(G.day); }
}
async function tcBuildWorld(prog){
  if (prog) await prog(0.1,'Printing First Bond'); tcInit(); makeTcgNPCs(); if (prog) await prog(0.35,'Running the first tournaments'); const live=G.live; G._tcCatch=true; tcCatchUp(tcSetDef(1).rel, G.day); G._tcCatch=false; G.live=live;
  if (prog) await prog(0.7,'Stocking the card shop'); tcSeedMarket(); for (let i=0;i<300;i++) npcListTc(); if (prog) await prog(1,'Done');
}
const _mig=migrate; migrate=function(){ _mig.apply(this,arguments); tcNormalize(); };
const _adv=advanceDay; advanceDay=function(){ _adv.apply(this,arguments); if (G.tcg){ try { tcDay(G.day); tcMarketDay(G.day); G.tcg.last=G.day; } catch(e){ console.error(e); } } };
const _ng=newGame; newGame=async function(seed, prog){ const g=await _ng(seed, prog); await tcBuildWorld(null); try { tcApplyScenario(G._scnId); } catch(e){ console.error(e); } return g; };
const _rc=resetCaches; resetCaches=function(){ _rc(); TC_CACHE.clear(); TCD.clear(); TCFV.clear(); TC_BYCID.clear(); };
async function upgradeTcg(prog){ if (G.tcg) return; await tcBuildWorld(prog? (f,m)=>prog(f,m) : null); tcNormalize(); }

function tcApplyScenario(id){
  if (id==='tcgbinder'){ const r=mkRng(hsh('binder'+G.seed)); for (const s of [1]) for (let i=0;i<18;i++) for (const k of tcRollPack(s,r)){ if (r()<0.8){ const c=tcMakeCopy(k,0,[G.day,'found',0,'your old binder'],'deck',r); c.h=[[G.day,'From your old binder',0,'']]; c.nw=1; c.sc=1; c.pv={d:G.day,v:Math.round(tcCopyValue(c)*100)/100,n:''}; } }
    for (let i=0;i<4;i++){ const c=tcMakeCopy(tcKey(1,0,'P'),0,[G.day,'found',0,'a birthday gift'],'shop'); c.nw=1; c.sc=1; c.pv={d:G.day,v:Math.round(tcCopyValue(c)*100)/100,n:''}; } }
  else if (id==='tcgbox'){ for (let i=0;i<2;i++){ const c=tcMakeCopy(tcKey(1,0,'B'),0,[G.day,'bought',150,'Wildkin Games shop'],'shop'); c.nw=1; c.sc=1; c.pv={d:G.day,v:Math.round(tcCopyValue(c)*100)/100,n:''}; } }
}
