// ===================== TIDEMARK: SAVES, THE DAILY TICK, NEW AND OLD WORLDS =====================
const _srep=saveReplacer; saveReplacer=function(k,v){ if (k==='tc' && this===G && v && typeof v==='object' && !Array.isArray(v)){ const o={}; for (const id in v){ const c=v[id]; const x=Object.assign({},c); x.c=String.fromCharCode(...c.c.map(n=>n+48)); if (c.o!==0) delete x.a; o[id]=x; } return o; } return _srep.call(this,k,v); };
// Tidemark has one content version so far; the launcher never sees a prototype save
function tcIsLegacy(g){ return false; }
function tcNormalize(){
  if (!G.tcg) return; for (const id in G.tc){ const c=G.tc[id]; if (typeof c.c==='string') c.c=[...c.c].map(ch=>ch.charCodeAt(0)-48); }
  G.nextTid=G.nextTid||1; G.tpop=G.tpop||{}; const T=G.tcg; for (const k of ['usage','t8','hy','ban','dom','shop','ann','rev','rel']) T[k]=T[k]||{}; T.pre=T.pre||[]; T.arch=T.arch||[]; T.ev=T.ev||[];
  G._npcTcIds=Object.keys(G.tc).map(Number).filter(id=>G.tc[id].o>0); delete G._tcPool; delete G._cmPool; delete G._cdPool; TC_CACHE.clear(); TCD.clear(); TCFV.clear(); TC_BYCID.clear();
  // a save made with another engine or other card rules gets a fresh field; bans, prices and history stay
  if (T.rv!==TMR.RV || T.arch.some(a=>!a.cnt)){ T.mx=null; T.arch=[]; T.dom={}; T.rv=TMR.RV; if (tcReleasedSets(G.day).includes(TM_TT)) tcRebuildMeta(G.day); }
}
async function tcBuildWorld(prog){
  if (prog) await prog(0.1,'Printing ten years of Tidemark'); tcInit(); makeTcgNPCs();
  tcSetLife(G.day);   // Tenth Tide is announced (with its Legendaries shown) on the first day
  if (prog) await prog(0.5,'Filling the collectors\' binders'); tcSeedMarket(); if (prog) await prog(0.8,'Stocking the card shop'); for (let i=0;i<300;i++) npcListTc(); if (prog) await prog(1,'Done');
}
const _mig=migrate; migrate=function(){ _mig.apply(this,arguments); tcNormalize(); };
const _adv=advanceDay; advanceDay=function(){ _adv.apply(this,arguments); if (G.tcg){ try { tcDay(G.day); tcMarketDay(G.day); G.tcg.last=G.day; } catch(e){ console.error(e); } } };
const _ng=newGame; newGame=async function(seed, prog){ const g=await _ng(seed, prog); await tcBuildWorld(null); try { tcApplyScenario(G._scnId); } catch(e){ console.error(e); } return g; };
const _rc=resetCaches; resetCaches=function(){ _rc(); TC_CACHE.clear(); TCD.clear(); TCFV.clear(); TC_BYCID.clear(); };
async function upgradeTcg(prog){ if (G.tcg) return; await tcBuildWorld(prog? (f,m)=>prog(f,m) : null); tcNormalize(); }

function tcApplyScenario(id){
  // Tenth Tide is not out yet when a game starts: both Tidemark scenarios are paid preorders that arrive on launch day
  if (id==='tmbinder') G.tcg.pre.push({set:TM_TT, f:'P', q:12, paid:1});
  else if (id==='tmbox') G.tcg.pre.push({set:TM_TT, f:'B', q:2, paid:1});
}
