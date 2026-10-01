// ===================== COMICS: SAVE FORMAT =====================
const SER_DEF={imp:'',vol:1,prev:-1,cv:-1,col:-1,ed:-1,en:0,plan:0,sch:28,crit:-1,fan:0,heat:0,spec:0,fro:0,leg:0,cx:0,so:0,bo:0,low:0,pend:null,hPrev:0};
const SER_OBJ={pp:1,v:1,rh:1}, SER_ARR={keys:1,ch:1,notes:1,aw:1,ad:1,tr:1,sup:1};
const SER_TRANSIENT={nx:1,ord:1,rdPrev:1,lastT:1,hy:1,low:1,pend:1,sup:1};
const CH_DEF={civ:'',cam:null,rec:0,spec:0,dead:0,team:0,mem:null}, CH_ARR={h:1,ad:1,ser:1};
const CR_DEF={ret:0,mom:0,load:0,first:null}, CR_ARR={aw:1,works:1};
function packObj(o, DEF, ARR, OBJ, skip){
  const out={};
  for (const k in o){ const v=o[k]; if (skip && skip[k]) continue;
    if (DEF[k]!==undefined && v===DEF[k]) continue;
    if (ARR[k] && Array.isArray(v) && !v.length) continue;
    if (OBJ && OBJ[k] && v && typeof v==='object' && !Object.keys(v).length) continue;
    out[k]=v; }
  return out;
}
function cmPack(cm){
  const out={};
  for (const k in cm){ if (k==='used') continue;
    if (k==='ser') out.ser = cm.ser.map(s=>{ const o=packObj(s, SER_DEF, SER_ARR, SER_OBJ, (s.sts==='end'||s.sts==='cx')?SER_TRANSIENT:null); o.dw = s.dw.map(x=>Math.min(35,Math.max(0,x)).toString(36)).join(''); o.pr = s.pr.map(x=>x.toString(36)).join(','); delete o.rh; if (s.keys.length) o.keys = s.keys.map(k=>k.join(':')).join(';'); return o; });
    else if (k==='ch') out.ch = cm.ch.map(c=>packObj(c, CH_DEF, CH_ARR));
    else if (k==='cr') out.cr = cm.cr.map(c=>packObj(c, CR_DEF, CR_ARR));
    else out[k]=cm[k]; }
  return out;
}
function saveReplacer(k, v){
  if (k && k[0]==='_') return undefined;
  if (typeof v==='number' && !Number.isInteger(v)) return Math.round(v*1000)/1000;
  if (k==='cm' && v && v.ser) return cmPack(v);
  if (k==='mc' && v && typeof v==='object' && !Array.isArray(v)){ const o={}; for (const id in v){ const c=v[id]; const x=Object.assign({}, c); x.c=String.fromCharCode(...c.c.map(n=>n+48)); if (c.o!==0) delete x.a; o[id]=x; } return o; }
  return v;
}
function cmNormalize(){
  const cm=G.cm;
  for (const s of cm.ser){
    for (const k in SER_DEF) if (s[k]===undefined) s[k]=SER_DEF[k];
    for (const k in SER_OBJ) if (!s[k]) s[k]={};
    for (const k in SER_ARR) if (!s[k]) s[k]=[];
    if (typeof s.dw==='string') s.dw = s.dw.split('').map(x=>parseInt(x,36));
    if (typeof s.pr==='string') s.pr = s.pr? s.pr.split(',').map(x=>parseInt(x,36)) : [];
    if (typeof s.keys==='string') s.keys = s.keys.split(';').map(x=>{ const a=x.split(':'); return [+a[0], a[1], +a[2]]; });
    if (s.nx==null) s.nx=0; if (s.ord==null) s.ord=s.rd; if (s.rdPrev==null) s.rdPrev=s.rd; if (s.lastT==null) s.lastT=s.st; if (s.hy==null) s.hy=1;
  }
  for (const c of cm.ch){ for (const k in CH_DEF) if (c[k]===undefined) c[k]=CH_DEF[k]; for (const k in CH_ARR) if (!c[k]) c[k]=[]; }
  for (const c of cm.cr){ for (const k in CR_DEF) if (c[k]===undefined) c[k]=CR_DEF[k]; for (const k in CR_ARR) if (!c[k]) c[k]=[]; }
  // tidy history written by older versions: repeated deaths, ambiguous show endings
  for (const s of cm.ser){ const seen={}; s.notes = s.notes.filter(x=>{ const m=/^(.+) died (again )?in #\d+\.$/.exec(x[1]); if (m){ seen[m[1]]=(seen[m[1]]||0)+1; if (seen[m[1]]===2) x[1]=x[1].replace(' died in',' died again in'); return seen[m[1]]<=2; } return true; }).map(x=>[x[0], x[1].replace(/^The series ended after (\d+) season/, 'The TV show was cancelled after $1 season')]); }
  cm.used={}; for (const c of cm.ch) cm.used[c.n]=1; for (const c of cm.cr) cm.used[c.n]=1;
  cm.pre=cm.pre||[];
  G.mc=G.mc||{}; G.cpop=G.cpop||{};
  for (const id in G.mc){ const c=G.mc[id]; if (typeof c.c==='string') c.c=[...c.c].map(ch=>ch.charCodeAt(0)-48); } G.nextMid=G.nextMid||1;
  G._npcComicIds=Object.keys(G.mc).map(Number).filter(id=>G.mc[id].o>0);
  delete G._cmPool; delete G._cdPool;
  CD.clear(); CDAY.clear(); CFV.clear(); CVC.clear();
}
// existing saves: build the comic world deterministically from the save's seed
async function upgradeComics(prog){
  const d0=G.day;
  await cmGenerate(prog, d0);
  G.day=d0;
  withCm(()=>{
    makeComicNPCs(); cmSeedMarket(); cmShopWeek(G.cm.last);
    for (let i=0;i<260;i++) npcListComic();
  });
  G.player.csubs=[]; G.player.creturned=[]; G.player.cskill=0;
  const n={t:G.day, h:`${SHOP_NAME.toUpperCase()} OPENS ITS DOORS`, b:`The comic shop is taking preorders, the back-issue wall is stocked, and the dollar bin has been refilled. New comics arrive every Wednesday.`, p:null, k:'comic'};
  G.news.unshift(n);
}
