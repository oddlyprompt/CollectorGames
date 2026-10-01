// ===================== COMICS: COLLECTIBLES & MARKET =====================
const CGL = [100,99,98,96,94,92,90,85,80,75,70,65,60,55,50,45,40,35,30,25,20,18,15,10,5];
const CGN = {100:'Gem Mint',99:'Mint',98:'NM/M',96:'NM+',94:'NM',92:'NM-',90:'VF/NM',85:'VF+',80:'VF',75:'VF-',70:'FN/VF',65:'FN+',60:'FN',55:'FN-',50:'VG/FN',45:'VG+',40:'VG',35:'VG-',30:'GD/VG',25:'GD+',20:'GD',18:'GD-',15:'FR/GD',10:'FR',5:'PR'};
const CGT = [99.3,98.4,96.3,94.1,91.7,89.2,86.3,82.2,78.2,74.2,70.2,66.2,62.2,58.2,54.2,50.2,46.2,42.2,38.2,34.2,30.2,27.2,24.2,18.2,0];
function gTxt(g10){ return (g10/10).toFixed(1); }
const SHOP_ID=-5;
const REST_N=['','Colour touch','Piece replacement','Glue','Trimming','Tear seals'];

// ---------- designs ----------
const CD=new Map(), CDAY=new Map();
function seriesDays(s){ let c=CDAY.get(s.id); if (c && c.n===s.n) return c.d; const d=[]; let x=s.st; for (let i=0;i<s.n;i++){ x += (s.dw[i]||0)*7; d.push(x); } CDAY.set(s.id,{n:s.n,d}); return d; }
function issueDay(s, n){ const d=seriesDays(s); return d[n-1]!=null? d[n-1] : s.nx; }
function mk(sid,n,p,v){ return 'M|'+sid+'|'+n+'|'+(p||1)+'|'+(v||''); }
function cmD(key){
  let d=CD.get(key); if (d && d.w===G.cm && d.n0===(G.cm.ser[d.sid]||{}).n) return d;
  const [,sid_,n_,p_,v] = key.split('|'); const sid=+sid_, s=S_(sid); const p=+p_;
  d={ key, sid, n0:s.n, v, p, tr: /^[TH]/.test(n_), w:G.cm };
  if (d.tr){ const kind=n_[0], vol=+n_.slice(1); const e=s.tr.find(x=>x[0]===kind && x[1]===vol)||['T',vol,s.en||s.st,3,1,s.n]; d.kind=kind; d.vol=vol; d.day=e[2]; d.run=e[3]*100; d.from=e[4]; d.to=e[5]; d.n=0;
    d.title = sTitle(s)+(kind==='H'?' Deluxe Hardcover':' Vol. '+vol); d.label = kind==='H'?'Deluxe hardcover, issues #'+d.from+'–'+d.to : 'Collected edition, issues #'+d.from+'–'+d.to; d.cp = (kind==='H'?4999:1699)/100*(yearOf(d.day)<2000?0.6:1); }
  else {
    const n=+n_; d.n=n; const base=issueDay(s,n);
    if (p===9){ const f=(G.cm.fac||[]).find(x=>x[0]===sid && x[1]===n); d.day=f?f[2]:base; d.run=(f?f[3]:500)*100; }
    else if (p>1){ const pp=(s.pp[n]||[])[p-2]; d.day=pp?pp[1]:base+30; d.run=pp?pp[0]*100:500; }
    else { d.day=base; d.run=varRun(s,n,v); }
    d.cp = (p===9? coverPrice(yearOf(d.day),0,'on') : coverPrice(yearOf(base), tierOf(s), s.fmt))/100;
    d.title = sTitle(s)+(s.fmt==='gn'?'':' #'+n);
    d.label = [p===9?'Facsimile edition':p>1?(['','','Second','Third','Fourth','Fifth'][p]||p+'th')+' printing':'', VAR_N(v)].filter(Boolean).join(', ');
  }
  d.yr=yearOf(d.day); d.s=s;
  CD.set(key,d); return d;
}
function issueKeys(s, n){ return s.keys.filter(k=>k[0]===n); }
function keyText(k, s){
  const [n,ty,ref]=k; const c = ['fa','cam','ss','dth','ret','cos','ori','team'].includes(ty) ? CH_(ref) : null; const cr = (ty==='cd'||ty==='ct'||ty==='ic') ? CR_(ref) : null;
  switch(ty){
    case 'fa': return (c.cam?'First full appearance of ':'First appearance of ')+c.n;
    case 'cam': return 'First appearance (cameo) of '+c.n;
    case 'team': return 'First appearance of '+c.n;
    case 'ss': return 'First solo series for '+c.n;
    case 'dth': return 'Death of '+c.n; case 'ret': return 'Return of '+c.n; case 'cos': return 'New costume for '+c.n; case 'ori': return 'Origin of '+c.n;
    case 'cd': return 'First published work by '+cr.n+' ('+ROLE_N[cr.r].toLowerCase()+')';
    case 'ct': return 'First issue by new '+ROLE_N[cr.r].toLowerCase()+' '+cr.n;
    case 'ic': return 'Iconic cover'+(cr?' by '+cr.n:'');
    case 'arc': return 'Start of a major storyline'; case 'cont': return 'Controversial issue'; case 'ann': return 'Anniversary issue';
    case 'fin': return s.sts==='cx'?'Final issue (cancelled)':'Final issue'; case 'aw': return 'Award-winning issue';
    case 'as': return 'Storyline adapted for the screen';
  }
  return ty;
}

// ---------- demand and supply ----------
function survival(age){ return age<12 ? 0.97 : Math.exp(-0.06*(age-12)); }
let CM_STALE=0;
function wantOf(d){
  const s=d.s, n=d.n; const H = CM_STALE? (s.hl!=null?s.hl:s.heat) : s.heat + s.spec;
  let W = 0.004*H + 0.01;
  if (!d.tr){
    if (n===1) W += (0.4*H + 0.05) * (s.vol>1?0.45:1) * (s.fmt==='gn'?0.6:1);
    for (const k of s.keys){ if (k[0]!==n) continue; const ty=k[1];
      if (ty==='fa'){ const c=CH_(k[2]); W += (c.cam?(1-0.4*c.cs):1)*charHeat(c) + 0.04; }
      else if (ty==='cam'){ const c=CH_(k[2]); W += (0.2+0.6*c.cs)*charHeat(c) + 0.02; }
      else if (ty==='team'){ const c=CH_(k[2]); W += 0.8*charHeat(c) + (c.mem? 0.25*c.mem.reduce((a,id)=>a+charHeat(CH_(id)),0) : 0); }
      else if (ty==='ss') W += 0.3*charHeat(CH_(k[2]));
      else if (ty==='dth') W += 0.25*charHeat(CH_(k[2])); else if (ty==='ret') W += 0.12*charHeat(CH_(k[2]));
      else if (ty==='cos') W += 0.18*charHeat(CH_(k[2])); else if (ty==='ori') W += 0.15*charHeat(CH_(k[2]));
      else if (ty==='cd'){ const c=CR_(k[2]); W += 0.28*Math.max(0,c.fame-0.3); }
      else if (ty==='ct'){ const c=CR_(k[2]); W += 0.06*c.fame; }
      else if (ty==='arc') W += 0.06*H; else if (ty==='ic'){ const c=CR_(k[2]); W += 0.2*H + 0.15 + (c?0.1*c.fame:0); }
      else if (ty==='cont') W += 0.08*H+0.05; else if (ty==='ann') W += 0.04*H+0.03; else if (ty==='fin') W += 0.08*H + (s.sts==='cx'?0.05:0);
      else if (ty==='aw') W += 0.15*H+0.05;
      else if (ty==='as'){ const a=G.cm.ad[k[2]]; W += (a && ['hit','solid','cult'].includes(a.out)? 0.35 : 0.12)*H; }
    }
    const age=yearOf(G.day)-d.yr; if (age>=40) W += 0.03 + 0.002*(age-40);
    const v=d.v;
    if (v){ const pv_=pvar(v), k=pv_.k, x=pv_.x; const cvr=pv_.a>=0?CR_(pv_.a):CR_(s.cv); const cf = cvr? cvr.fame*0.09 : 0;
      if (v==='B') W = 0.25*W+0.02; else if (v==='F') W = 0.3*W;
      else if (k==='R') W = (0.28+0.04*Math.log2(x))*W + cf + 0.02; else if (k==='V') W = 1.25*((0.28+0.04*Math.log2(x))*W + cf + 0.02); else if (k==='S') W = 1.3*((0.28+0.04*Math.log2(x))*W + cf + 0.02);
      else if (k==='X'||k==='A'||k==='P') W = 0.3*W+0.03+cf; else if (k==='C'||k==='K') W = 0.35*W+0.03+cf; }
    if (!v){ const cv=s.cv>=0?CR_(s.cv):null; if (cv && cv.fame>0.8){ W += 0.03*cv.fame; if (cv.deb && d.day-cv.deb < 365*3) W += 0.12*cv.fame; } }
    if (d.p===9) W = 0.03*W+0.01; else if (d.p>1) W *= d.p===2?0.12:0.08;
  } else W = 0.02 + 0.05*H;
  return W;
}
function floorFor(age){ return age<25 ? 1.0 : 1 + 0.06*Math.pow(age-25, 1.35); }
function typicalGrade(age){ return age<20?92: age<35?85: age<50?65: age<70?50: 40; }
const MOD_M = {100:6,99:4.5,98:2.4,96:1.45,94:1.15,92:1,90:0.88,85:0.75,80:0.65,75:0.57,70:0.5,65:0.45,60:0.4,55:0.36,50:0.33,45:0.3,40:0.28,35:0.26,30:0.24,25:0.22,20:0.2,18:0.18,15:0.16,10:0.15,5:0.12};
function gradeMultC(g10, age, base){
  const tg=typicalGrade(age); let m;
  if (tg>=85) m = MOD_M[g10]/MOD_M[tg]; else m = Math.exp(0.3*(Math.min(g10,90)-tg)/10) * (g10>90? 1+0.8*(MOD_M[g10]/MOD_M[90]-1) : 1);
  const damp = clamp(base/8, 0.08, 1); // nobody pays a 9.8 premium for a book nobody wants
  return m>=1 ? 1+(m-1)*damp : m;
}
const CFV=new Map(); let CMK=4;
function cfvClear(key){ if (!key){ CFV.clear(); return; } for (const g of CGL) CFV.delete(key+'#'+g); CFV.delete(key+'#0'); }
function cmFair(key, g10){ const ck=key+'#'+(g10||0); let v=CFV.get(ck); if (v!==undefined) return v; v=cmFair0(key,g10||0); CFV.set(ck,v); return v; }
function cmFair0(key, g10){
  const d=cmD(key), s=d.s; const age=yearOf(G.day)-d.yr;
  let base;
  if (d.tr){ const oop = G.day > d.day+365*4 && !(s.heat>1.5); base = d.cp*(oop? (0.9 + 0.35*s.heat + (d.kind==='H'?0.8:0)) : 0.55) + (d.kind==='H'? 5*s.heat : 0); }
  else {
    const W=wantOf(d); const S=Math.max(40, d.run*survival(age));
    base = floorFor(age) + CMK*Math.pow(2500*Math.pow(W,1.7)/S, 0.95);
    const dOld = G.day - d.day; if (dOld < 120 && dOld>=-60) base = Math.max(base, d.cp*Math.max(0.45, 1 - Math.max(0,dOld)/120));
  }
  base *= Math.exp(CM_STALE?0:clamp(s.fro||0,-0.6,0.9)) * Math.exp(-(G.dp[key]||0));
  const g = g10 || typicalGrade(age);
  let v = base * gradeMultC(g, age, base);
  if (g10) v = v*1.08 + (d.tr?0:0);
  return v;
}
function cmFairStale(key,g){ CM_STALE=1; try { return cmFair0(key,g||0); } finally { CM_STALE=0; } }
function apparentGrade(cp){ return cmGradeOf(cp, true); }
function sigMult(cp, d, v){
  const sg=cp.sg; if (!sg) return 1; const c=CR_(sg.c);
  if (sg.s==='x') return 0.7; if (sg.s==='u') return 0.92;
  const W=wantOf(d); return 1 + Math.min(2.5, 0.22*c.fame*(1+Math.min(3,W)));
}
function cmCopyValue(cp){
  const d=cmD(cp.k);
  if (cp.g>0){ let v=cmFair(cp.k, cp.g); if (cp.gr) v*=0.35; return v*sigMult(cp,d); }
  const g=apparentGrade(cp); return cmFair(cp.k, g)/1.08*0.84*sigMult(cp,d)*(cp.gr?0.4:1);
}
function cmSales(key, g10){ return (G.sales[key]||[]).filter(s=>g10==null || (s[2]||0)===(g10||0)); }
function cmEst(key, g10, cp){
  let fv = cp ? cmCopyValue(cp) : cmFair(key, g10||0);
  const same = cmSales(key, cp? (cp.g>0?cp.g:0) : (g10||0)).filter(s=>s[0]>G.day-150);
  const n=same.length; const center = n ? 0.45*fv + 0.55*median(same.slice(0,6).map(s=>s[1])) : fv;
  const w = 0.12 + 0.42/Math.sqrt(n+1) + (fv>150?0.1:0);
  const lo=nicePrice(Math.max(0.25, center*(1-w*0.75))), hi=nicePrice(Math.max(0.5, center*(1+w)));
  return { lo, hi:Math.max(hi,lo), n, limited: n===0 && fv>60 };
}

// ---------- condition ----------
// attrs: 0 spine, 1 corners, 2 cover gloss, 3 creases, 4 bends, 5 staples, 6 pages, 7 tears, 8 writing, 9 printing
// A comic fresh off the printer is usually clean. Most flaws come from handling: a ding from the box, a scuffed corner from the rack.
// q is the chance a copy has nothing wrong at all. Most of the rest have one small flaw; a few are more seriously damaged.
const FRESH_Q={new:0.55, pre:0.75, pick:0.4};
function freshCond(r, q){
  const g=()=>{ let u=0; while(u===0) u=r(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*r()); };
  const c=[]; for (let i=0;i<10;i++) c.push(Math.round(clamp(100-Math.abs(g())*2.0-r()*1.4, 88, 100)));
  c[6]=Math.round(clamp(100-Math.abs(g())*1.1-r()*0.5, 90, 100)); c[8]=100; c[9]= r()<0.02? Math.round(92+r()*4) : 100;
  if (r()>=q){
    const k = r()<0.72?1: r()<0.85?2:3; const pool=[[0,3],[1,3],[2,2],[4,2],[5,0.5],[3,0.25]];
    for (let f=0;f<k;f++){ let tot=0; for (const p of pool) tot+=p[1]; let x=r()*tot, at=0; for (const p of pool){ x-=p[1]; if (x<=0){ at=p[0]; break; } }
      const sev=r(); const v = sev<0.72? 91.5+r()*4.4 : sev<0.93? 83+r()*8.5 : 68+r()*15; c[at]=Math.min(c[at], Math.round(v)); }
  }
  return c;
}
function genCond(age, src, rng, adj){
  if (FRESH_Q[src]!=null){ const r=rng||R; if (src==='pick'){ const a=freshCond(r,FRESH_Q.pick+(adj||0)), b=freshCond(r,FRESH_Q.pick+(adj||0)); return cmScore(b)>cmScore(a)? b : a; } return freshCond(r, FRESH_Q[src]+(adj||0)); }
  const r = rng||R; const g=()=>{ let u=0; while(u===0) u=r(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*r()); };
  let D = src==='new' ? 0 : age<30 ? 2+age*0.35 : 12.5+(age-30)*0.72;
  if (src==='bin') D += 7; if (src==='lot') D += 3;
  if (src!=='new' && r()<0.03) D*=0.3;
  const w=[1.2,1.0,0.9,0.8,0.9,0.5,0,0.4,0,0];
  const c=w.map((wi,i)=> Math.round(clamp(100 - D*wi*(0.5+r()) - Math.abs(g())*((src==='new'?3.4:2)+D*0.22), 5, 100)));
  c[6] = Math.round(clamp(100 - age*0.85*(0.7+r()*0.6) - Math.abs(g())*3, 15, 100));
  c[8] = r() < (src==='new'?0.004:0.05+age/300) ? Math.round(55+r()*30) : 100;
  c[9] = r() < 0.06 ? Math.round(80+r()*15) : 100;
  if (src!=='new' && r() < 0.08+age/160) c[3] = Math.min(c[3], Math.round(45+r()*25)); // a colour-breaking crease
  if (src!=='new' && r() < 0.03+age/200) c[7] = Math.min(c[7], Math.round(50+r()*40));
  if (src==='new' && r()<0.36){ const i=[0,1,4,2][Math.floor(r()*4)]; c[i]=Math.max(40, c[i]-Math.round(3+r()*15)); }
  return c;
}
function cmScore(c){
  const eff=[c[0],c[1],c[2],c[3],c[4],Math.max(c[5],60)+ (c[5]<60?-10:0),c[6]<40?c[6]+20:100,c[7],c[8],c[9]];
  const mn=Math.min(...eff), avg=eff.reduce((a,b)=>a+b,0)/eff.length;
  let s = 0.55*mn + 0.45*avg;
  if (c[3]<70) s=Math.min(s, 79); if (c[7]<70) s=Math.min(s,58); if (c[8]<90) s=Math.min(s, 88);
  return s;
}
function scoreToG(s){ for (let i=0;i<CGL.length;i++) if (s>=CGT[i]) return CGL[i]; return 5; }
function cmGradeOf(cp, apparent){ let c=cp.c; if (apparent && cp.r) c=c; return scoreToG(cmScore(c)); }
function cmMakeCopy(key, owner, acq, src, rng){
  const d=cmD(key); const age=Math.max(0, yearOf(G.day)-d.yr);
  const r=rng||R; const fresh=FRESH_Q[src]!=null; const cp={ id:G.nextMid++, k:key, o:owner, c:genCond(age, src||'npc', r, d.v==='F'?-0.12:/^[RV]/.test(d.v||'')?0.05:0), g:0 };
  if (age>35 && r()<0.035){ cp.r = 1+Math.floor(r()*5); cp.c[2]=Math.max(cp.c[2],88); cp.c[7]=Math.max(cp.c[7],90); cp.c[0]=Math.min(100,cp.c[0]+10); }
  if (!d.tr && !fresh && r()<(age<40?0.025:0.01)){ const s=d.s; const who=[s.w,s.a,s.cv].filter(x=>x>=0); cp.sg={ c:who[Math.floor(r()*who.length)], s: r()<0.25?'w':'u', real: r()<0.72?1:0 }; if (cp.sg.s==='w') cp.sg.real=1; }
  if (acq) cp.a=acq;
  G.mc[cp.id]=cp; return cp;
}
function MC(id){ return G.mc[id]; }
function myComics(){ const o=[]; for (const id in G.mc){ const c=G.mc[id]; if (c.o===0) o.push(c); } return o; }
function cmPopAdd(key, g){ cfvClear(key); const p=G.cpop[key]||(G.cpop[key]={}); p[g]=(p[g]||0)+1; }
function cmPop(key){ return G.cpop[key]||{}; }
function cmGradeCopy(cp){
  let g = cp.gt>0 ? scoreToG(cmScore(cp.c)+withRng(mkRng(cp.id*977+cp.gt*31),()=>gauss()*1.8)) : cmGradeOf(cp);
  cp.gt=(cp.gt||0)+1;
  if (cp.sg && cp.sg.s==='u'){ cp.sg.s = cp.sg.auth && cp.sg.real ? 'a' : 'x'; }
  if (cp.sg && cp.sg.s==='w') cp.sg.s='a';
  cp.g=g; cp.cert=ri(1000000000,4999999999); if (cp.r) cp.gr=1; cmPopAdd(cp.k, g); return g;
}

// ---------- labels ----------
function cmTitle(cp){ return cmD(cp.k).title; }
function cmSub(d){ return [pubName(d.s), d.yr, d.label].filter(Boolean).join(', '); }
function cmItemLabel(cp){ const d=cmD(cp.k); return d.title+(d.label?' ('+d.label+')':'')+(cp.g>0?' GCS '+gTxt(cp.g):''); }

// ---------- NPC comic collectors ----------
const CM_NT = {
  ckey:{n:'Key issue collector',w:10,cash:[300,6000]}, cfa:{n:'First appearance hunter',w:10,cash:[300,5000]}, cind:{n:'Indie speculator',w:10,cash:[200,3000]},
  cvar:{n:'Variant collector',w:7,cash:[200,3000]}, cgold:{n:'Golden-age collector',w:6,cash:[1500,30000]}, chor:{n:'Horror collector',w:6,cash:[150,2500]},
  ccre:{n:'Creator collector',w:7,cash:[150,2500]}, crun:{n:'Run collector',w:8,cash:[100,1500]}, cslab:{n:'Slab collector',w:7,cash:[500,12000]},
  craw:{n:'Raw-condition hunter',w:6,cash:[200,4000]}, ccov:{n:'Cover-art collector',w:5,cash:[200,3000]}, cadp:{n:'Adaptation speculator',w:9,cash:[300,5000]},
  cdlr:{n:'Comic dealer',w:6,cash:[3000,25000]}, crd:{n:'Reader',w:12,cash:[40,300]}, ccmp:{n:'Completionist',w:6,cash:[150,2000]}
};
function isComicNPC(n){ return !!CM_NT[n.ty]; }
function makeComicNPCs(){
  const used={}; for (const n of G.npcs) used[n.h]=1;
  for (const ty in CM_NT) for (let i=0;i<CM_NT[ty].w;i++){
    let h; do { h=pick(CM_HANDLE_A)+pick(HANDLES_B)+(R()<0.6?ri(1,99):''); } while(used[h]); used[h]=1;
    const c=CM_NT[ty].cash; const n={ id:G.npcs.length+1, h, ty, cash:Math.round(rf(c[0],c[1])), inc:Math.round(rf(c[0],c[1])*0.06), tm:0, pids:[], gr:+R().toFixed(2), kn:+rf(0.08,0.4).toFixed(2), setProd:-1, cd: R()<0.12?1:0 };
    if (ty==='cdlr'||ty==='cgold'||ty==='cslab') n.kn=+rf(0.05,0.15).toFixed(2); if (ty==='crd') n.kn=+rf(0.3,0.6).toFixed(2);
    G.npcs.push(n);
  }
  for (const n of G.npcs) if (!isComicNPC(n) && R()<0.14) n.cm=1;
  refreshComicTastes(true);
}
function refreshComicTastes(force){
  const hot = G.cm.ser.filter(s=>s.n>0 && s.heat>0.8); const stars=G.cm.cr.filter(c=>c.fame>0.8);
  for (const n of G.npcs){ if (!isComicNPC(n)) continue;
    if ((n.ty==='crun'||n.ty==='ccmp') && (!n.sids || force || R()<0.01)) n.sids = hot.length? [pick(hot).id, pick(G.cm.ser).id] : [];
    if (n.ty==='ccre' && (!n.crs || force || R()<0.01)) n.crs = stars.length? [pick(stars).id, pick(stars).id] : [];
  }
}
function npcPool(item){ const k = item && item.comic ? '_cmPool' : '_cdPool'; if (!G[k]){ G._cmPool=G.npcs.filter(n=>isComicNPC(n)||n.cm); G._cdPool=G.npcs.filter(n=>!isComicNPC(n)||n.cd); } return G[k]; }
function cmInterest(n, item){
  const cp=item.cm, d=cmD(cp.k), s=d.s, v=item.v; const age=yearOf(G.day)-d.yr; const keys=d.tr?[]:issueKeys(s,d.n);
  if (!isComicNPC(n)) return n.cm ? (keys.length||d.n===1 ? 0.8 : 0.45) : 0.04;
  let f;
  switch(n.ty){
    case 'ckey': f = keys.length||d.n===1 ? 1.25 : 0.25; break;
    case 'cfa': f = keys.some(k=>k[1]==='fa'||k[1]==='team') ? 1.3 : keys.some(k=>k[1]==='cam') ? 1.1 : 0.15; break;
    case 'cind': f = tierOf(s)>=2 && (d.n===1 || s.heat>1) ? 1.2 : 0.3; break;
    case 'cvar': f = d.v ? 1.3 : 0.3; break;
    case 'cgold': f = age>=60 ? 1.35 : age>=45 ? 0.9 : 0.1; break;
    case 'chor': f = s.g===GI.horror ? 1.3 : 0.2; break;
    case 'ccre': f = n.crs && (n.crs.includes(s.w)||n.crs.includes(s.a)||n.crs.includes(s.cv)) ? 1.5 : 0.15; break;
    case 'crun': f = n.sids && n.sids.includes(s.id) ? 1.4 : 0.1; break;
    case 'cslab': f = cp.g>0 ? (cp.g>=94?1.3:0.9) : 0.3; break;
    case 'craw': f = cp.g===0 && apparentGrade(cp)>=92 ? 1.15 : 0.45; break;
    case 'ccov': f = keys.some(k=>k[1]==='ic') || (d.v && /[VS]/.test(d.v[0])) ? 1.25 : 0.4; break;
    case 'cadp': f = s.spec>0.5 || keys.some(k=>k[1]==='as') ? 1.1 + Math.min(0.6, s.spec*0.1) : 0.2; break;
    case 'cdlr': f = 0.72; break;
    case 'crd': f = v<8 ? 1.0 : 0.2; break;
    case 'ccmp': f = n.sids && n.sids.includes(s.id) ? 1.3 : v<4 ? 0.55 : 0.2; break;
    default: f=0.5;
  }
  if (cp.g>0) f *= 0.85+0.35*n.gr; else f *= 1.08-0.2*n.gr;
  if (cp.gr) f *= 0.6;
  return f;
}
function npcListComic(){
  const ids=G._npcComicIds; if (!ids || !ids.length) return;
  let cp=null;
  for (let tries=0; tries<14 && !cp; tries++){
    const c=G.mc[ids[Math.floor(R()*ids.length)]];
    if (!c || c.o<=0 || c.l || c.g<0) continue;
    const v=cmCopyValue(c); if (v<1.5) continue;
    const n=NPC(c.o); if (!n) continue; const s=cmD(c.k).s;
    const keep = cmInterest(n,{cm:c,v})>1.1 ? 0.72 : 0.1;
    let sellBias=0;
    if (n.ty==='cadp'||n.ty==='cind'||n.ty==='flip') sellBias = s.fro>0.25?0.45 : s.fro<-0.12?0.55 : 0;
    if (n.ty==='cdlr') sellBias=0.35;
    if (R() < keep - sellBias) continue;
    cp=c;
  }
  if (!cp) return;
  const n=NPC(cp.o); const v=cmCopyValue(cp); const sv=v*Math.exp(gauss()*n.kn);
  const panic = cmD(cp.k).s.fro < -0.12 && (n.ty==='cadp'||n.ty==='cind');
  if (R()<(panic?0.5:0.25)) createListing('m', cp.id, n.id, 'auc', Math.max(0.99, nicePrice(sv*rf(panic?0.2:0.3, 0.8))), pick([3,5,5,7]), false);
  else { const mult = panic? rf(0.75,0.95) : ({cdlr:rf(1.1,1.45), crd:rf(0.7,1.4), cslab:rf(1.05,1.3)}[n.ty] || rf(0.95,1.35)); createListing('m', cp.id, n.id, 'bin', Math.max(0.99, nicePrice(sv*mult)), 0, R()<0.6); }
}
// copies surface from long boxes when collectors come looking
function surface(sid, n, count, owners){
  const s=S_(sid);
  for (let i=0;i<count;i++){
    const key=mk(sid,n,1,''); const pool=owners||npcPool({comic:1});
    const cands=[pick(pool),pick(pool),pick(pool)]; const cp=cmMakeCopy(key, 0, null, 'npc');
    const it={cm:cp, v:cmCopyValue(cp)}; const own=cands.sort((a,b)=>cmInterest(b,it)-cmInterest(a,it))[0]; cp.o=own.id; cp.a=[G.day,'found',0,''];
    G._npcComicIds.push(cp.id);
  }
}
function cmSeedMarket(){
  G._npcComicIds=[]; const pool=npcPool({comic:1});
  const give=(key, src)=>{ const cp=cmMakeCopy(key,0,null,src||'npc'); const it={cm:cp,v:cmCopyValue(cp)}; const c=[pick(pool),pick(pool),pick(pool),pick(pool)]; cp.o=c.sort((a,b)=>cmInterest(b,it)-cmInterest(a,it))[0].id; cp.a=[G.day,'held',0,'']; G._npcComicIds.push(cp.id); return cp; };
  const cand=new Map();
  for (const s of G.cm.ser){ if (!s.n) continue;
    cand.set(mk(s.id,1,1,''), 1);
    if (s.v[1]) for (const v of s.v[1].split(',')) cand.set(mk(s.id,1,1,v), 1);
    if (s.pp[1]) cand.set(mk(s.id,1,2,''),1);
    for (const k of s.keys) if (k[1]!=='ct' && k[1]!=='cd' || CR_(k[2]).fame>0.8) cand.set(mk(s.id,k[0],1,''),1);
  }
  for (let i=0;i<2200;i++){ const s=pick(G.cm.ser); if (s.n) cand.set(mk(s.id, 1+Math.floor(R()*s.n),1,''),1); }
  for (const key of cand.keys()){
    const d=cmD(key); const age=yearOf(G.day)-d.yr; const S=d.run*survival(age); const W=wantOf(d);
    let n = Math.round(Math.pow(S/40000,0.4)*(0.4+Math.min(3,W)) + R()*0.8);
    n = clamp(n, 0, 5); for (let i=0;i<n;i++) give(key);
  }
  // collected editions
  for (const s of G.cm.ser) for (const e of s.tr) if (e[2]<=G.day && R()<0.25) give(mk(s.id,e[0]+e[1],1,''),'npc');
  // what's already been slabbed
  for (const id of G._npcComicIds){ const cp=G.mc[id]; const v=cmCopyValue(cp); const p = v>80?0.55: v>25?0.3: v>8?0.08: 0.01; if (R()<p){ if (cp.sg && cp.sg.s==='u' && R()<0.5) cp.sg.auth=1; cmGradeCopy(cp); } }
}
function cmCull(){
  const ids=G._npcComicIds; if (ids.length<7600) return;
  const cand=ids.filter(id=>{ const c=G.mc[id]; return c && c.o>0 && !c.l && c.g===0; }).sort((a,b)=>cmCopyValue(G.mc[a])-cmCopyValue(G.mc[b])).slice(0, ids.length-6600);
  const del=new Set(cand); for (const id of cand) delete G.mc[id]; G._npcComicIds=ids.filter(id=>!del.has(id) && G.mc[id] && G.mc[id].o>0);
}

// ---------- the comic shop ----------
function shopStockFor(s, n, v){
  const tier=tierOf(s); let q = [ri(8,20),ri(4,10),ri(3,8),ri(1,4),ri(0,2),R()<0.5?ri(1,2):0][tier];
  if (n===1) q=Math.round(q*1.6); if (v==='B') q=Math.max(0,Math.round(q*0.3));
  else if (v && v[0]==='R'){ const x=+v.slice(1); q = R()<(x<=10?0.8:x<=25?0.55:x<=50?0.3:0.15) ? 1 : 0; }
  else if (v) q = 0;
  return q;
}
function cmShopWeek(t){
  const sh = G.cm.shop || (G.cm.shop={ newi:[], back:[], bin:[], gn:[], lots:[], dug:0 });
  // new this week
  const rel=[]; for (const id of G.cm.act.concat(G.cm.ser.filter(s=>s.en>=t-6).map(s=>s.id))){ const s=S_(id); if (!s.n) continue; const d=issueDay(s,s.n); if (d>t-7 && d<=t) rel.push(s); }
  sh.newi=[]; sh.wk=t;
  for (const s of [...new Set(rel)]){ const n=s.n; const codes=[''].concat(s.v[n]?s.v[n].split(','):[]);
    for (const v of codes){ const q=shopStockFor(s,n,v); if (!q && v) continue; const key=mk(s.id,n,1,v); const d=cmD(key);
      const price = !v||v==='B' ? d.cp : nicePrice(Math.max(d.cp*2, cmFair(key,0)*rf(1.1,1.35)));
      sh.newi.push([key, q, price]); } }
  // second printings arriving
  for (const s of G.cm.ser){ for (const n in s.pp){ s.pp[n].forEach((e,i)=>{ if (e[1]>t-7 && e[1]<=t) sh.newi.push([mk(s.id,+n,i+2,''), ri(1,4), cmD(mk(s.id,+n,i+2,'')).cp]); }); } }
  // graphic novels and trades
  sh.gn = [];
  const trs=[]; for (const s of G.cm.ser) for (const e of s.tr) if (e[2]<=t && e[2]>t-365*3) trs.push([s,e]);
  trs.sort((a,b)=>b[1][2]-a[1][2]); for (const [s,e] of trs.slice(0,14)){ const key=mk(s.id,e[0]+e[1],1,''); sh.gn.push([key, ri(1,4), cmD(key).cp]); }
  for (const s of G.cm.ser.filter(s=>s.fmt==='gn' && s.n && issueDay(s,1)>t-365*2).slice(-8)){ const key=mk(s.id,1,1,''); if (!sh.gn.some(x=>x[0]===key)) sh.gn.push([key, ri(1,3), cmD(key).cp]); }
  // back-issue wall: the shop's own priced copies
  sh.back = sh.back.filter(x=>{ const c=G.mc[x[0]]; return c && c.o===SHOP_ID; });
  while (sh.back.length<24){ const cp=shopBackCopy(); if (!cp) break; const v=cmCopyValue(cp); sh.back.push([cp.id, nicePrice(Math.max(2, v*Math.exp(gauss()*0.18)*rf(1.05,1.45)))]); }
  if (sh.back.length>=24 && R()<0.8){ for (let i=0;i<ri(2,5);i++){ const x=sh.back.splice(Math.floor(R()*sh.back.length),1)[0]; if (x && G.mc[x[0]] && G.mc[x[0]].o===SHOP_ID) delete G.mc[x[0]]; } }
  // the dollar bin
  for (const id of sh.bin){ const c=G.mc[id]; if (c && c.o===SHOP_ID) delete G.mc[id]; }
  sh.bin=[]; sh.dug=0;
  for (let i=0;i<60;i++){ const cp=binCopy(); if (cp) sh.bin.push(cp.id); }
  // collections for sale
  sh.lots = sh.lots.filter(l=>l.exp>t);
  if (R()<0.4) sh.lots.push(makeLot(t));
}
function shopBackCopy(){
  for (let tries=0; tries<20; tries++){
    const s=pick(G.cm.ser); if (!s.n) continue;
    const r=R(); let n;
    const ks=s.keys.filter(k=>['fa','cam','team','dth','ss','ic','fin','ann'].includes(k[1]));
    if (r<0.45 && ks.length) n=pick(ks)[0]; else if (r<0.65) n=1; else n=1+Math.floor(R()*s.n);
    const key=mk(s.id,n,1,''); const v=cmFair(key,0); if (v<2.5 || v>400) continue;
    return cmMakeCopy(key, SHOP_ID, null, 'npc');
  }
  return null;
}
function binCopy(){
  for (let tries=0; tries<12; tries++){
    const s=pick(G.cm.ser); if (!s.n) continue; const yr=yearOf(s.st); if (yr<1965 && R()<0.8) continue;
    let n = 1+Math.floor(R()*s.n);
    if (R()<0.12){ const ks=s.keys.filter(k=>k[1]==='cam'||k[1]==='cd'||k[1]==='fa'); if (ks.length) n=pick(ks)[0]; else if (tierOf(s)>=2) n=1; }
    let p=1; if (s.pp[n] && R()<0.3) p=2;
    const key=mk(s.id,n,p,''); const d=cmD(key);
    // the shop prices from its price guide, which lags the market and misses cameos and indie heat
    const shopView = floorFor(yearOf(G.day)-d.yr) + CMK*Math.pow(2500*Math.pow(Math.max(0, wantOf(d) - s.spec*0.4 - (issueKeys(s,n).some(k=>k[1]==='cam')?0.5:0) - (tierOf(s)>=2?0.35*s.heat:0)),1.7)/Math.max(40,d.run*survival(yearOf(G.day)-d.yr)), 0.95);
    if (shopView > 2.2) continue;
    return cmMakeCopy(key, SHOP_ID, null, 'bin');
  }
  return null;
}
const LOT_KINDS = [['estate','Estate collection','A family is clearing out a relative\'s long boxes.'],['store','Store buyout','A closing comic shop is selling its back stock by the box.'],['garage','Garage-sale find','Someone found boxes of comics in a garage and wants them gone.'],['bulk','Bulk boxes','Mixed long boxes from a dealer who needs the space.'],['con','Convention dealer lot','A dealer is selling off what didn\'t move at the last show.']];
function makeLot(t){
  const kind=pick(LOT_KINDS); const n = kind[0]==='bulk'? ri(120,300) : kind[0]==='garage' ? ri(20,90) : ri(40,200);
  const era0 = kind[0]==='estate' ? pick([1955,1965,1975,1985]) : kind[0]==='garage' ? pick([1970,1980,1990]) : 1980;
  const keys=[]; const seed=Math.floor(R()*2e9);
  const ser=G.cm.ser.filter(s=>s.n && yearOf(s.st)>=era0-10 && yearOf(s.st)<=(kind[0]==='estate'?era0+25:2026));
  for (let i=0;i<n;i++){ const s=pick(ser.length?ser:G.cm.ser); if (!s.n) continue; let no=1+Math.floor(R()*s.n); if (R()<0.04){ const ks=s.keys; if (ks.length) no=pick(ks)[0]; } keys.push(mk(s.id,no,1,'')); }
  // the seller knows what the obvious books are worth, roughly
  let est=0; const sc=keys.map(k=>[k, cmFair(k,0)*0.55]); sc.sort((a,b)=>b[1]-a[1]);
  for (const x of sc) est += Math.min(x[1], 30) * (x[1]>6?0.9:0.5);
  const price = nicePrice(Math.max(15, est*rf(0.45,0.75)));
  const hl = sc.slice(0,3).filter(x=>x[1]>3).map(x=>cmD(x[0]).title);
  return { id:G.nextLid++, kind:kind[0], kn:kind[1], desc:kind[2], n:keys.length, keys, seed, price, hl, exp:t+ri(7,14), era:era0 };
}
function buyLot(id){
  const sh=G.cm.shop; const L_=sh.lots.find(l=>l.id===id); if (!L_) return 'That collection has sold.';
  if (G.player.cash<L_.price) return 'You need '+money(L_.price)+'.';
  G.player.cash-=L_.price; G.player.bought+=L_.price;
  const rng=mkRng(L_.seed); const out=[];
  for (const k of L_.keys){ const cp=cmMakeCopy(k, 0, [G.day,'lot',Math.round(L_.price/L_.n*100)/100, L_.kn], 'lot', rng); cp.h=[[G.day,'Came in a '+L_.kn.toLowerCase(),0,'']]; cp.nw=1; out.push(cp.id); }
  sh.lots=sh.lots.filter(l=>l!==L_);
  G.player.lastLot = { t:G.day, kn:L_.kn, ids:out, price:L_.price };
  return null;
}
function buyNewIssue(key){
  const sh=G.cm.shop; const e=sh.newi.find(x=>x[0]===key); if (!e || e[1]<=0) return 'Sold out at the shop.';
  if (G.player.cash<e[2]) return 'You need '+money(e[2])+'.';
  G.player.cash-=e[2]; G.player.bought+=e[2]; e[1]--;
  const cp=cmMakeCopy(key, 0, [G.day,'bought',e[2],SHOP_NAME], 'pick'); cp.h=[[G.day,'Bought new at '+SHOP_NAME,e[2],'']]; cp.nw=1; return null;
}
function buyGN(key){
  const sh=G.cm.shop; const e=sh.gn.find(x=>x[0]===key); if (!e || e[1]<=0) return 'Out of stock.';
  if (G.player.cash<e[2]) return 'You need '+money(e[2])+'.';
  G.player.cash-=e[2]; G.player.bought+=e[2]; e[1]--;
  const cp=cmMakeCopy(key, 0, [G.day,'bought',e[2],SHOP_NAME], 'pick'); cp.h=[[G.day,'Bought at '+SHOP_NAME,e[2],'']]; cp.nw=1; return null;
}
function buyShopCopy(id, from){
  const sh=G.cm.shop; const cp=G.mc[id]; if (!cp || cp.o!==SHOP_ID) return 'Someone else bought it.';
  let price; if (from==='bin') price=1; else { const e=sh.back.find(x=>x[0]===id); if (!e) return 'Not for sale.'; price=e[1]; }
  if (G.player.cash<price) return 'You need '+money(price)+'.';
  G.player.cash-=price; G.player.bought+=price; cp.o=0; cp.a=[G.day,from==='bin'?'dug':'bought',price,SHOP_NAME]; cp.h=[[G.day, from==='bin'?'Pulled from the dollar bin':'Bought off the back-issue wall', price, SHOP_NAME]]; cp.nw=1;
  if (from==='bin') sh.bin=sh.bin.filter(x=>x!==id); else sh.back=sh.back.filter(x=>x[0]!==id);
  return null;
}
// preorders
function solicitations(){
  const t=G.day, out=[];
  for (const id of G.cm.act){ const s=S_(id); const n=s.n+1; const d = s.sts==='ann'? s.st : s.nx; if (d>t && d<=t+63 && s.sts!=='end') out.push({s, n, d}); }
  return out.sort((a,b)=>a.d-b.d);
}
function preorder(sid, n, v){
  const s=S_(sid); const d = s.sts==='ann'?s.st:s.nx; if (!(d>G.day+6)) return 'Final orders for this issue have closed.';
  const mine=G.cm.pre.filter(p=>p.sid===sid && p.n===n).reduce((a,p)=>a+1,0); if (mine>=3) return 'The shop limits preorders to three copies.';
  G.cm.pre.push({ sid, n, v:v||'', d, t:G.day }); return null;
}
function fulfilPreorders(t){
  const keep=[];
  for (const p of G.cm.pre){
    const s=S_(p.sid);
    if (s.n>=p.n){ const key=mk(p.sid,p.n,1,p.v); const d=cmD(key); const price=d.cp;
      if (G.player.cash>=price){ G.player.cash-=price; G.player.bought+=price; const cp=cmMakeCopy(key,0,[t,'preorder',price,SHOP_NAME],'pre'); cp.h=[[t,'Preordered at '+SHOP_NAME,price,'']]; cp.nw=1; toast('Preorder in: '+d.title+(p.v?' '+VAR_N(p.v):''), true); }
      else toast('Preorder for '+d.title+' released to the shelf: not enough cash on hand.');
    } else if (s.sts==='cx' || s.sts==='end'){ toast('Preorder cancelled: '+sTitle(s)+' #'+p.n+' won\'t be published.'); }
    else keep.push(p);
  }
  G.cm.pre=keep;
}
// ---------- weekly & daily market hooks ----------
function cmMarketWeek(t){
  if (!G._npcComicIds) G._npcComicIds=Object.keys(G.mc).map(Number).filter(id=>G.mc[id].o>0);
  // speculators and readers pick up the new books
  for (const id of G.cm.act.concat(G.cm.ser.filter(s=>s.en>=t-6).map(s=>s.id))){ const s=S_(id); if (!s.n) continue; const d=issueDay(s,s.n); if (!(d>t-7 && d<=t)) continue;
    const codes=[''].concat(s.v[s.n]?s.v[s.n].split(','):[]);
    for (const v of codes){ const key=mk(s.id,s.n,1,v); const W=wantOf(cmD(key)); const k=Math.min(8, poisson(0.3+1.6*W+(s.n===1&&!v?1.2:0)+(tierOf(s)<=1?0.4:0)));
      for (let i=0;i<k;i++){ const pool=npcPool({comic:1}); const own=pick(pool); const cp=cmMakeCopy(key, own.id, [t,'bought',cmD(key).cp,'retail'], 'new'); G._npcComicIds.push(cp.id); } } }
  // when a book heats up, copies come out of long boxes
  for (const s of G.cm.ser){ const h=s.heat+s.spec; const prev=s.hPrev||0; if (h-prev>0.8 && s.n){ const ks=[1].concat(s.keys.filter(k=>k[1]==='fa'||k[1]==='cam').map(k=>k[0])); for (const n of [...new Set(ks)].slice(0,4)) surface(s.id,n,Math.min(6,1+poisson(Math.sqrt((s.pr[n-1]||10)/80))), null); } s.hPrev=+h.toFixed(2); }
  cmShopWeek(t); fulfilPreorders(t);
  if (R()<0.25) refreshComicTastes(false);
  if (R()<0.3){ for (const id of G._npcComicIds.slice(-400)){ const cp=G.mc[id]; if (!cp||cp.g||cp.l) continue; const v=cmCopyValue(cp); if (v>40 && R()<0.12) cmGradeCopy(cp); } }
  cmCull();
}
function cmMarketDay(t){
  if (!G.cm || G.cm.hist) return;
  const sh=G.cm.shop;
  if (sh){ // the shop sells through its new books
    const age=t-(sh.wk||t);
    for (const e of sh.newi){ if (e[1]<=0) continue; const d=cmD(e[0]); const W=wantOf(d); const lam=(age<=1?1.2:0.35)*(0.15+W*1.5)*(e[2]>d.cp*1.5?0.4:1); const k=poisson(lam); if (k){ const before=e[1]; e[1]=Math.max(0,e[1]-k); if (before>0 && e[1]===0 && d.n===1 && age<=2 && W>0.6) cmNews(`${d.title.toUpperCase()} GONE FROM SHELVES`, `${SHOP_NAME} sold its last copy ${age===0?'on release day':'within days'}. Speculators are listing copies online.`, {s:d.sid}); } }
    if (R()<0.25 && sh.back.length){ const x=sh.back[Math.floor(R()*sh.back.length)]; const cp=G.mc[x[0]]; if (cp && cmCopyValue(cp) > x[1]*0.95){ const b=pick(npcPool({comic:1})); cp.o=b.id; G._npcComicIds.push(cp.id); sh.back=sh.back.filter(y=>y!==x); } }
  }
  const nL=G.lst.filter(l=>l.it==='m' && l.sel>0).length;
  const k=clamp(Math.round((320-nL)/5)+ri(3,8), 2, 40); for (let i=0;i<k;i++) npcListComic();
  cmGradingTick(t);
}
// ---------- player services ----------
const CGRADE_TIERS=[{id:'eco',n:'Economy',fee:25,days:21},{id:'std',n:'Standard',fee:45,days:10},{id:'exp',n:'Express',fee:110,days:4}];
const PRESS_FEE=22, PRESS_DAYS=10, AUTH_FEE=20;
function cmSubmitGrade(id, tier, auth){
  const T=CGRADE_TIERS.find(x=>x.id===tier); const cp=MC(id); const fee=T.fee+(auth?AUTH_FEE:0);
  if (!cp || cp.o!==0 || cp.g!==0 || cp.l) return 'That comic can\'t be submitted right now.';
  if (G.player.cash<fee) return 'You need '+money(fee)+'.';
  G.player.cash-=fee; G.player.fees+=fee; cp.g=-1; if (auth && cp.sg && cp.sg.s==='u') cp.sg.auth=1;
  G.player.csubs=G.player.csubs||[]; G.player.csubs.push({id:G.nextLid++, cid:id, kind:'grade', tier, t0:G.day, t1:G.day+T.days, fee, raw:Math.round(cmCopyValue(cp)*100)/100});
  (cp.h=cp.h||[]).push([G.day,'Sent to GCS Comics ('+T.n+(auth?', signature check':'')+')',fee,'']); return null;
}
function cmSubmitPress(id){
  const cp=MC(id); if (!cp || cp.o!==0 || cp.g!==0 || cp.l) return 'That comic can\'t be sent right now.';
  if (G.player.cash<PRESS_FEE) return 'You need '+money(PRESS_FEE)+'.';
  G.player.cash-=PRESS_FEE; G.player.fees+=PRESS_FEE; cp.g=-2;
  G.player.csubs=G.player.csubs||[]; G.player.csubs.push({id:G.nextLid++, cid:id, kind:'press', t0:G.day, t1:G.day+PRESS_DAYS});
  (cp.h=cp.h||[]).push([G.day,'Sent for pressing and cleaning',PRESS_FEE,'']); return null;
}
function cmGradingTick(t){
  const subs=G.player.csubs||[]; if (!subs.length) return;
  for (const s of subs.filter(x=>x.t1<=t)){
    const cp=MC(s.cid); if (!cp) continue;
    if (s.kind==='press'){
      cp.g=0; const before=cmGradeOf(cp); let helped=false;
      if (cp.c[4]<95){ cp.c[4]=Math.max(cp.c[4], ri(93,99)); helped=true; }
      if (cp.c[0]<95 && cp.c[0]>80){ cp.c[0]=Math.min(97, cp.c[0]+ri(1,5)); helped=true; }
      if (cp.c[2]<93 && cp.c[2]>72){ cp.c[2]=Math.min(96, cp.c[2]+ri(2,6)); helped=true; }
      cp.pr=1; const after=cmGradeOf(cp);
      (cp.h=cp.h||[]).push([t, after>before?'Pressed and cleaned; it lies flat now':'Pressed; the presser couldn\'t improve much',0,'']);
      toast('Back from pressing: '+cmD(cp.k).title+(after>before?'. It looks noticeably better.':helped?'. A little flatter.':'. The damage wasn\'t the kind pressing fixes.'), after>before);
    } else {
      const g=cmGradeCopy(cp); G.player.cskill=(G.player.cskill||0)+1;
      (G.player.rv=G.player.rv||[]).push({k:'m', id:cp.id, g, raw:s.raw||0, fee:s.fee||0, t});
      const lab = cp.gr?'Restored':cp.sg&&cp.sg.s==='a'?'Signature':cp.sg&&cp.sg.s==='x'?'Unverified signature':'Universal';
      (cp.h=cp.h||[]).push([t,'Graded GCS '+gTxt(g)+' '+CGN[g]+(lab!=='Universal'?' ('+lab.toLowerCase()+' label)':''),0,'']);
      G.player.creturned=G.player.creturned||[]; G.player.creturned.unshift({cid:cp.id, t, g}); if (G.player.creturned.length>60) G.player.creturned.length=60;
      toast('GCS Comics returned '+cmD(cp.k).title+': '+gTxt(g)+(cp.gr?', restored label':'')+(cp.sg&&cp.sg.s==='x'?'. The signature could not be authenticated.':cp.sg&&cp.sg.s==='a'?', signature authenticated':''), true);
    }
  }
  G.player.csubs=subs.filter(x=>x.t1>t);
}
