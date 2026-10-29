// ===================== BROKEN REACH: SAVES, THE DAILY TICK, NEW AND OLD WORLDS =====================
const B_srep=saveReplacer; saveReplacer=function(k,v){ if (k==='brc' && this===G && v && typeof v==='object' && !Array.isArray(v)){ const o={}; for (const id in v){ const c=v[id]; const x=Object.assign({},c); x.c=String.fromCharCode(...c.c.map(n=>n+48)); if (c.o!==0) delete x.a; o[id]=x; } return o; } return B_srep.call(this,k,v); };
function brNormalize(){
  if (!G.brg) return; for (const id in G.brc){ const c=G.brc[id]; if (typeof c.c==='string') c.c=[...c.c].map(ch=>ch.charCodeAt(0)-48); }
  G.nextBid=G.nextBid||1; G.bpop=G.bpop||{}; const T=G.brg; for (const k of ['usage','hy','shop','ann','rev','rel']) T[k]=T[k]||{}; T.pre=T.pre||[]; T.want=T.want||[]; T.goals=T.goals||{};
  G._npcBrIds=Object.keys(G.brc).map(Number).filter(id=>G.brc[id].o>0); delete G._brPool; BR_CACHE.clear(); BRD.clear(); BRFV.clear(); BR_BYCID.clear(); brUsage();
}
async function brBuildWorld(prog){
  if (prog) await prog(0.3,'Printing the first Broken Reach set'); brInit(); makeBrNPCs(); brSetLife(G.day);
  if (prog) await prog(1,'Done');
}
const B_mig=migrate; migrate=function(){ B_mig.apply(this,arguments); brNormalize(); };
const B_adv=advanceDay; advanceDay=function(){ B_adv.apply(this,arguments); if (G.brg){ try { brDay(G.day); brMarketDay(G.day); G.brg.last=G.day; } catch(e){ console.error(e); } } };
const B_ng=newGame; newGame=async function(seed, prog){ const g=await B_ng(seed, prog); await brBuildWorld(null); return g; };
const B_rc=resetCaches; resetCaches=function(){ B_rc(); BR_CACHE.clear(); BRD.clear(); BRFV.clear(); BR_BYCID.clear(); };
// an existing save gets the Broken Reach world when it is opened: and if the set is already out, its release and the weeks since
async function upgradeBr(prog){
  if (G.brg) return; await brBuildWorld(prog? (f,m)=>prog(f,m) : null); brNormalize(); const def=brSetDef(1);
  if (G.day>=def.rel){ const T=G.brg; for (const k of ['pv','pv2','pv3']) T.ann[k+1]=1; T.rev[1]=brSetCards(1).map(c=>c.no); brCatchUp(def.rel, G.day); const age=G.day-def.rel; brReleaseMarket(1, G.day, Math.min(1.5, 0.8+age/300)); }
}
registerCardLine({id:'br', name:'Broken Reach', economy:BR_ECON, kind:'b', keyPrefix:'B', news:'brg', openAct:'bropy', has:()=>!!G.brg, copies:()=>G.brc, mine:()=>myBr(), value:o=>brCopyValue(o), label:o=>brCardLabel(o.k)+(o.g>0?' (GCS '+o.g+')':''), mini:o=>bMiniT(o), submit:id=>brSubmitGrade(id,'std'), crack:id=>crackBr(id), upgrade:p=>upgradeBr(p), boot:{at:0.96, span:0.03, msg:'Opening the third card game'}});
