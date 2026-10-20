// ===================== TCG: SAVES, THE DAILY TICK, NEW AND OLD WORLDS =====================
const _srep=saveReplacer; saveReplacer=function(k,v){ if (k==='tc' && this===G && v && typeof v==='object' && !Array.isArray(v)){ const o={}; for (const id in v){ const c=v[id]; const x=Object.assign({},c); x.c=String.fromCharCode(...c.c.map(n=>n+48)); if (c.o!==0) delete x.a; o[id]=x; } return o; } return _srep.call(this,k,v); };
// a save made before Version 1 (prototype cards) has no content version; it is never loaded into this world (see pack_apply.js)
function tcIsLegacy(g){ return !!(g && g.tcg && !(g.tcg.cv>=TC_CV)); }
function tcNormalize(){
  if (!G.tcg || tcIsLegacy(G)) return; for (const id in G.tc){ const c=G.tc[id]; if (typeof c.c==='string') c.c=[...c.c].map(ch=>ch.charCodeAt(0)-48); }
  G.nextTid=G.nextTid||1; G.tpop=G.tpop||{}; const T=G.tcg; for (const k of ['usage','t8','hy','ban','dom','shop','ann','rev','rel']) T[k]=T[k]||{}; T.pre=T.pre||[]; T.arch=T.arch||[]; T.ev=T.ev||[];
  G._npcTcIds=Object.keys(G.tc).map(Number).filter(id=>G.tc[id].o>0); delete G._tcPool; delete G._cmPool; delete G._cdPool; TC_CACHE.clear(); TCD.clear(); TCFV.clear(); TC_BYCID.clear(); T.mv=WK_CANON.set.mv;
  // saves from before the rules engine (or an older engine) get a fresh field; bans, prices and history stay
  if (T.rv!==WKR.RV || T.arch.some(a=>!a.cnt) || (T.mx && T.mx.bs!==tcBaseSig(T.mx.key.split('|')[0]||'1'))){ T.mx=null; T.arch=[]; T.dom={}; if (tcReleasedSets(G.day).length) tcRebuildMeta(G.day); }
  // a save already past the release of a set added after it was made (Duskfall): the set comes out on the day the save is opened
  for (const n of tcReleasedSets(G.day)) if (n>1 && T.rel[n]==null){ T.ann['pv'+n]=T.ann['pv2'+n]=T.ann['pv3'+n]=1; T.rev[n]=tcSetCards(n).map(c=>c.no); tcRelease(n, G.day); }
}
async function tcBuildWorld(prog){
  if (prog) await prog(0.1,'Printing First Bond'); tcInit(); makeTcgNPCs(); if (prog) await prog(0.35,'Running the first tournaments'); const live=G.live; G._tcCatch=true; tcCatchUp(tcSetDef(1).rel, G.day); G._tcCatch=false; G.live=live;
  tcSetLife(G.day);   // a set that is not out yet is announced (with every card shown) on the first day
  if (prog) await prog(0.7,'Stocking the card shop'); tcSeedMarket(); for (let i=0;i<300;i++) npcListTc(); if (prog) await prog(1,'Done');
}
const _mig=migrate; migrate=function(){ _mig.apply(this,arguments); tcNormalize(); };
const _adv=advanceDay; advanceDay=function(){ _adv.apply(this,arguments); if (G.tcg){ try { tcDay(G.day); tcMarketDay(G.day); G.tcg.last=G.day; } catch(e){ console.error(e); } } };
const _ng=newGame; newGame=async function(seed, prog){ const g=await _ng(seed, prog); await tcBuildWorld(null); try { tcApplyScenario(G._scnId); } catch(e){ console.error(e); } return g; };
const _rc=resetCaches; resetCaches=function(){ _rc(); TC_CACHE.clear(); TCD.clear(); TCFV.clear(); TC_BYCID.clear(); };
async function upgradeTcg(prog){ if (G.tcg) return; await tcBuildWorld(prog? (f,m)=>prog(f,m) : null); tcNormalize(); }

function tcApplyScenario(id){
  // First Bond is not out yet when a game starts: both Wildkin scenarios are paid preorders that arrive on launch day
  if (id==='tcgbinder') G.tcg.pre.push({set:1, f:'P', q:12, paid:1});
  else if (id==='tcgbox') G.tcg.pre.push({set:1, f:'B', q:2, paid:1});
}

registerCardLine({id:'wk', name:'Wildkin', economy:WK_ECON, kind:'t', keyPrefix:'T', news:'tcg', openAct:'tcopy', has:()=>!!G.tcg, copies:()=>G.tc, mine:()=>myTc(), value:o=>tcCopyValue(o), label:o=>tcCardLabel(o.k)+(o.g>0?' (GCS '+o.g+')':''), mini:o=>miniT(o), submit:id=>tcSubmitGrade(id,'std'), crack:id=>crackTc(id), upgrade:p=>upgradeTcg(p), boot:{at:0.5, span:0.45, msg:'Opening the card game shop'}});
