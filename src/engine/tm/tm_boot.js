// ===================== TIDEMARK: SAVES, THE DAILY TICK, NEW AND OLD WORLDS =====================
const X_srep=saveReplacer; saveReplacer=function(k,v){ if (k==='xtc' && this===G && v && typeof v==='object' && !Array.isArray(v)){ const o={}; for (const id in v){ const c=v[id]; const x=Object.assign({},c); x.c=String.fromCharCode(...c.c.map(n=>n+48)); if (c.o!==0) delete x.a; o[id]=x; } return o; } return X_srep.call(this,k,v); };
// Tidemark has one content version so far; the launcher never sees a prototype save
function xtIsLegacy(g){ return false; }
function xtNormalize(){
  if (!G.xtg) return; for (const id in G.xtc){ const c=G.xtc[id]; if (typeof c.c==='string') c.c=[...c.c].map(ch=>ch.charCodeAt(0)-48); }
  G.nextXid=G.nextXid||1; G.xpop=G.xpop||{}; const T=G.xtg; for (const k of ['usage','t8','hy','ban','dom','shop','ann','rev','rel']) T[k]=T[k]||{}; T.pre=T.pre||[]; T.arch=T.arch||[]; T.ev=T.ev||[];
  G._npcXtIds=Object.keys(G.xtc).map(Number).filter(id=>G.xtc[id].o>0); delete G._xtPool; delete G._cmPool; delete G._cdPool; XT_CACHE.clear(); XTD.clear(); XTFV.clear(); XT_BYCID.clear();
  // a save made with another engine or other card rules gets a fresh field; bans, prices and history stay
  if (T.rv!==TMR.RV || T.arch.some(a=>!a.cnt)){ T.mx=null; T.arch=[]; T.dom={}; T.rv=TMR.RV; if (xtReleasedSets(G.day).includes(TM_TT)) xtRebuildMeta(G.day); }
}
async function xtBuildWorld(prog){
  if (prog) await prog(0.1,'Printing ten years of Tidemark'); xtInit(); makeXtNPCs();
  xtSetLife(G.day);   // Tenth Tide is announced (with its Legendaries shown) on the first day
  if (prog) await prog(0.5,'Filling the collectors\' binders'); xtSeedMarket(); if (prog) await prog(0.8,'Stocking the card shop'); for (let i=0;i<300;i++) xNpcListTc(); if (prog) await prog(1,'Done');
}
const X_mig=migrate; migrate=function(){ X_mig.apply(this,arguments); xtNormalize(); };
const X_adv=advanceDay; advanceDay=function(){ X_adv.apply(this,arguments); if (G.xtg){ try { xtDay(G.day); xtMarketDay(G.day); xtEconDay(G.day); G.xtg.last=G.day; } catch(e){ console.error(e); } } };
const X_ng=newGame; newGame=async function(seed, prog){ const g=await X_ng(seed, prog); await xtBuildWorld(null); try { xtApplyScenario(G._scnId); } catch(e){ console.error(e); } return g; };
const X_rc=resetCaches; resetCaches=function(){ X_rc(); XT_CACHE.clear(); XTD.clear(); XTFV.clear(); XT_BYCID.clear(); };
// an existing Wildkin save gets the Tidemark world when it is opened: the history, the market, and if Tenth Tide is already out, its release and the weeks since
async function upgradeXt(prog){
  if (G.xtg) return; await xtBuildWorld(prog? (f,m)=>prog(f,m) : null); xtNormalize(); const rel=xtSetDef(TM_TT).rel;
  if (G.day>=rel){ const T=G.xtg; for (const k of ['pv','pv2','pv3','rot']) T.ann[k+TM_TT]=1; T.rev[TM_TT]=xtSetCards(TM_TT).map(c=>c.no); xtCatchUp(rel, G.day); }
}

function xtApplyScenario(id){
  // Tenth Tide is not out yet when a game starts: both Tidemark scenarios are paid preorders that arrive on launch day
  if (id==='tmbinder') G.xtg.pre.push({set:TM_TT, f:'P', q:12, paid:1});
  else if (id==='tmbox') G.xtg.pre.push({set:TM_TT, f:'B', q:2, paid:1});
}

registerCardLine({id:'xt', name:'Tidemark', economy:XT_ECON, kind:'x', keyPrefix:'X', news:'xtg', openAct:'xtopy', has:()=>!!G.xtg, copies:()=>G.xtc, mine:()=>myXt(), value:o=>xtCopyValue(o), label:o=>xtCardLabel(o.k)+(o.g>0?' (GCS '+o.g+')':''), mini:o=>xMiniT(o), submit:id=>xtSubmitGrade(id,'std'), crack:id=>crackXt(id), upgrade:p=>upgradeXt(p), boot:{at:0.9, span:0.08, msg:'Opening the second card game'}});
