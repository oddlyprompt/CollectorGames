// ===================== COMICS: THE INDUSTRY =====================
// One weekly tick (Wednesdays, new comic day) drives both generated history and live play.
function cmRnd(){ const s=G.cm.rs=(G.cm.rs+0x6D2B79F5)|0; let t=Math.imul(s^s>>>15,1|s); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }
function withCm(fn){ return withRng(cmRnd, fn); }
function S_(id){ return G.cm.ser[id]; } function CR_(id){ return G.cm.cr[id]; } function CH_(id){ return G.cm.ch[id]; }
function pubOf(s){ return s.pub>=0 ? G.cm.pubs[s.pub] : null; }
function pubName(s){ return s.pub>=0 ? G.cm.pubs[s.pub].n : 'Self-published'; }
function tierOf(s){ return s.pub>=0 ? G.cm.pubs[s.pub].tier : 5; }
function crName(c){ return c ? c.n : 'Unknown'; }
// typical monthly copies sold by an average mainstream title
const MKT_PTS=[[1938,300],[1945,420],[1952,330],[1956,240],[1965,220],[1972,160],[1980,110],[1986,95],[1990,120],[1992,220],[1993,240],[1995,110],[1997,55],[2000,42],[2008,40],[2012,34],[2019,32],[2022,40],[2030,38]];
function mkt(yr){ for (let i=1;i<MKT_PTS.length;i++){ const [a,va]=MKT_PTS[i-1],[b,vb]=MKT_PTS[i]; if (yr<=b){ const f=clamp((yr-a)/(b-a),0,1); return 1000*(va+(vb-va)*f); } } return 38000; }
function coverPrice(yr, tier, fmt){ // cents
  let c = yr<1962?10: yr<1969?12: yr<1972?15: yr<1976?25: yr<1980?40: yr<1983?60: yr<1987?75: yr<1990?100: yr<1994?150: yr<2000?225: yr<2008?299: yr<2020?399: yr<2024?399: 499;
  if (tier>=2 && yr>=1985) c += yr<2000?50:100;
  if (fmt==='gn') c = Math.round(c*(yr<1990?6:4.5)/100)*100-1;
  return c;
}
const CM_TIER_MIN=[12000,6000,2600,900,380,160];
function genreFactor(g, yr){ const w=ERAS[eraOf(yr)][2]; const mean=w.reduce((a,b)=>a+b,0)/w.length; return Math.sqrt(w[g]/mean) * G.cm.tr[g]; }

// ---------- init ----------
function cmInit(){
  if (typeof resetCaches==='function') resetCaches();
  const seed = hashStr('comics:'+(G.seed||1))|0;
  G.cm = { v:1, rs:seed, pubs: PUB_DEF.map((d,i)=>({id:i, n:d[0], sh:d[1], tier:d[2], f:d[3], x:d[4], gb:d[5], imp:d[6]})),
    cr:[], ch:[], ser:[], ad:[], act:[], tr:CG.map(()=>1), aw:[], tl:[], last:0, used:{}, pre:[], shop:null, hist:true };
  G.mc = G.mc || {}; G.nextMid = G.nextMid || 1; G.cpop = G.cpop || {};
}
function uniqName(fn){ const U=G.cm? G.cm.used : (G._used||(G._used={})); for (let i=0;i<30;i++){ const n=fn(); if (!U[n]){ U[n]=1; return n; } } return fn()+' '+ri(2,9); }
function personName(){ return uniqName(()=>pick(CFN)+' '+pick(CLN)); }
function heroName(){ return uniqName(()=>{ let n; do { n = R()<0.18 ? pick(HN) : pick(HP)+' '+pick(HN); } while(HBLOCK.has(n)); return R()<0.12 ? 'The '+n : n; }); }

// ---------- creators ----------
const ROLE_N={W:'Writer',A:'Artist',WA:'Writer and artist',C:'Cover artist',L:'Colourist',E:'Editor'};
function newCreator(role, t, g){
  const yr=yearOf(t);
  let tal = clamp(0.36+gauss()*0.17, 0.03, 0.97); if (R()<0.04) tal=rf(0.86,0.99);
  const c={ id:G.cm.cr.length, n:personName(), r:role, by:yr-ri(21,31), deb:0, tal:+tal.toFixed(3), fame:+rf(0.02,0.18).toFixed(3), crit:0.5, mom:0, g:[g, R()<0.5?g:ri(0,CG.length-1)], aw:[], ret:0, works:[], first:null, load:0 };
  G.cm.cr.push(c); return c;
}
function pickCreator(role, t, g, tier, avoid){
  const yr=yearOf(t); const pool=G.cm.cr; const newP = [0.12,0.16,0.25,0.35,0.45,0.9][tier] + (yr<1945?0.35:0);
  if (pool.length<30 || R()<newP) return newCreator(role, t, g);
  let best=null, bw=-1;
  for (let i=0;i<14;i++){
    const c=pool[Math.floor(R()*pool.length)];
    if (c.ret || c===avoid) continue;
    if (!(c.r===role || (c.r==='WA' && (role==='W'||role==='A')) || (role==='C' && (c.r==='A'||c.r==='WA')))) continue;
    if (c.load >= (c.r==='C'||c.r==='L'||c.r==='E'?6:c.r==='W'?3:2)) continue;
    const fit = (c.g[0]===g||c.g[1]===g) ? 1.6 : 0.6;
    const w = fit * (tier<=1 ? (0.25+c.fame*1.5) : (0.5+c.fame*0.6)) * (0.5+c.tal);
    if (w>bw){ bw=w; best=c; }
  }
  return best || newCreator(role, t, g);
}
function assignCreator(s, c, n, role){
  c.load++; if (!c.works.includes(s.id)) c.works.push(s.id);
  if (!c.first){ c.first=[s.id,n]; c.deb=s.st; if (n>0) s.keys.push([n,'cd',c.id]); }
}

// ---------- characters ----------
function makeChar(s, opts){
  opts=opts||{};
  const hero = s.g===GI.hero && !opts.plain;
  let n, civ='';
  if (opts.team){ n = 'The '+pick(TEAMA)+' '+pick(TEAMN); }
  else if (hero){ n=heroName(); civ=personName(); }
  else if (s.g===GI.kids){ n=uniqName(()=>pick(CFN)+' the '+pick(['Bunny','Badger','Robot','Mouse','Otter','Fox','Dragon','Owl','Moth','Hedgehog'])); }
  else { const pre = {crime:['Detective ','',''],western:['Sheriff ','','Marshal '],war:['Sergeant ','Captain ',''],mystery:['Inspector ','',''],horror:['','','Sister ']}[CG[s.g].k]; n=(pre?pick(pre):'')+personName(); }
  const c={ id:G.cm.ch.length, n, civ, pub:s.pub, g:s.g, s0:s.id, cr:[s.w, s.a], fa:null, cam:null, cs:+rf(0.2,0.6).toFixed(2), pop:+(opts.lead? rf(0.2,0.6) : rf(0.03,0.3)).toFixed(3), rec:0, spec:0, dead:0, ser:[], team:opts.team?1:0, mem:opts.mem||null, h:[], ad:[] };
  G.cm.ch.push(c); return c;
}
function charHeat(c){ return c.pop + c.rec + (typeof CM_STALE!=='undefined'&&CM_STALE?0:c.spec); }

// ---------- series ----------
function choosePub(yr){
  const alive=G.cm.pubs.filter(p=>p.f<=yr && (!p.x || p.x>yr));
  const tw=[6,3.4,2.4,1.6,0.8];
  const selfW = yr<1968?0.05: yr<1985?0.25: yr<2005?0.7: 1.1;
  const tot = alive.reduce((a,p)=>a+tw[p.tier],0)+selfW;
  let r=R()*tot; for (const p of alive){ r-=tw[p.tier]; if (r<=0) return p.id; } return -1;
}
function chooseGenre(yr, pub){
  const w=ERAS[eraOf(yr)][2].map((x,i)=>x*G.cm.tr[i]*(pub&&pub.gb[CG[i].k]?pub.gb[CG[i].k]:1)*(pub&&pub.tier<=1&&(i===GI.alt||i===GI.exp)?0:1));
  if (yr<1955 || yr>=1972) {} else { w[GI.horror]*=0.25; w[GI.crime]*=0.35; } // the Comics Standards Board years
  return wpick(w.map((x,i)=>i), i=>w[i]);
}
function makeTitle(g, lead){
  const k=CG[g].k, gw=GENRE_WORDS[k];
  if (k==='hero' && lead) return lead.n.replace(/^The /,'The ');
  const r=R();
  if (gw && r<0.45){ const w=pick(gw); return R()<0.35? w+' '+pick(['Stories','Tales','Comics','Quarterly']).replace(/^/,'') : (R()<0.4?'The '+w:w); }
  if (r<0.62) return 'The '+pick(TA)+' '+pick(TN);
  if (r<0.74) return pick(TN)+' of '+pick(TPLACE);
  if (r<0.84) return pick(TPLACE)+(R()<0.5?'':' '+pick(TN));
  if (r<0.93) return (lead && !lead.team ? lead.n.split(' ').slice(-1)[0] : pick(CLN))+(R()<0.5?'':' & '+pick(CLN));
  return pick(TA)+' '+pick(TN);
}
function makePremise(g, lead){
  const k=CG[g].k; const arr=PREMISE[k]||PREMISE.slice; let p=pick(arr);
  return p.replace('{job}',pick(JOBS)).replace('{power}',pick(POWERS)).replace('{hero}', lead?lead.n:'a new hero');
}
function createSeries(t, o){
  o=o||{}; const yr=yearOf(t);
  const pubId = o.pub!=null ? o.pub : choosePub(yr); const pub = pubId>=0?G.cm.pubs[pubId]:null; const tier = pub?pub.tier:5;
  const g = o.g!=null ? o.g : chooseGenre(yr, pub);
  let fmt;
  if (o.fmt) fmt=o.fmt;
  else if (yr<1978) fmt = R()<0.95?'on':'os';
  else { const r=R(); const lit = g===GI.literary||g===GI.exp||g===GI.historical;
    if (tier<=1) fmt = r<(lit?0.4:0.68)?'on': r<0.92?'ls': r<0.96?'os':'gn';
    else if (tier===2) fmt = r<0.42?'on': r<0.84?'ls': r<0.89?'os':'gn';
    else fmt = r<(lit?0.15:0.3)?'on': r<0.72?'ls': r<0.82?'os':'gn'; }
  const s={ id:G.cm.ser.length, t:'', pub:pubId, imp:'', g, fmt, vol:o.vol||1, prev:o.prev!=null?o.prev:-1, w:-1, a:-1, cv:-1, col:-1, ed:-1,
    st:t, en:0, n:0, plan: fmt==='ls'? pick([3,4,4,5,5,6,6,6,8,8,10,12]) : fmt==='on'?0:1, sch: yr<1960 && R()<0.4 ? 56 : 28, nx:t, cp:coverPrice(yr,tier,fmt),
    q:0, rd:0, ord:0, r0:0, crit:-1, fan:0, heat:0, spec:0, fro:0, leg:0, pr:[], pp:{}, dw:[], v:{}, keys:[], ch:[], sts:'ann', cx:0, notes:[], aw:[], ad:[], so:0, bo:0, pk:0, pky:0, rh:{}, prem:'', tr:[], low:0, pend:null };
  G.cm.ser.push(s);
  // creators
  const waChance = tier>=3||g===GI.alt||g===GI.exp||g===GI.literary ? 0.5 : tier===2?0.2:0.08;
  if (o.w!=null){ s.w=o.w; } else if (R()<waChance){ const c=pickCreator('WA',t,g,tier); s.w=c.id; s.a=c.id; }
  else s.w=pickCreator('W',t,g,tier).id;
  if (s.a<0) s.a = o.a!=null? o.a : pickCreator('A',t,g,tier,CR_(s.w)).id;
  s.cv = tier<=1 && yr>=1975 && R()<0.5 ? pickCreator('C',t,g,tier).id : s.a;
  if (yr>=1972 && tier<=3) s.col = pickCreator('L',t,g,tier).id;
  if (tier<=2) s.ed = pickCreator('E',t,g,tier).id;
  // quality: the creative team plus luck
  const W=CR_(s.w), A=CR_(s.a);
  s.q = clamp(0.45*W.tal + 0.35*A.tal + 0.2*R() + gauss()*0.05, 0.02, 0.99);
  if (R()<0.025) s.q = Math.max(s.q, rf(0.88,0.98));
  s.q=+s.q.toFixed(3);
  // characters
  if (o.lead!=null){ const c=CH_(o.lead); s.ch.push(c.id); if (!c.ser.length || c.ser.every(x=>S_(x).ch[0]!==c.id)) s.keys.push([1,'ss',c.id]); c.ser.push(s.id); }
  else if (g===GI.hero && tier<=1 && yr>1941 && R()<0.35){ // publisher puts an established character in a new book
    const cands=G.cm.ch.filter(c=>c.pub===pubId && !c.team && c.pop>0.6 && c.ser.every(x=>S_(x).sts!=='on'||S_(x).ch[0]!==c.id));
    if (cands.length){ const c=cands.sort((a,b)=>b.pop-a.pop)[Math.floor(R()*Math.min(4,cands.length))]; s.ch.push(c.id); s.keys.push([1,'ss',c.id]); c.ser.push(s.id); }
  }
  if (!s.ch.length && fmt!=='gn' || fmt==='gn' && !s.ch.length){
    if (g===GI.hero && R()<0.22){ const team=makeChar(s,{team:1}); const mem=[]; for (let i=0;i<ri(3,5);i++){ const m=makeChar(s,{lead:1}); m.fa=null; mem.push(m.id); } team.mem=mem; s.ch.push(team.id, ...mem.slice(0,3)); }
    else { const n=g===GI.anthology?0: R()<0.3?2:1; for (let i=0;i<n;i++){ const c=makeChar(s,{lead:1}); s.ch.push(c.id); } }
    s.ch.forEach(id=>{ const c=CH_(id); if (!c.ser.includes(s.id)) c.ser.push(s.id); });
  }
  const lead = s.ch.length? CH_(s.ch[0]) : null;
  s.t = o.t || makeTitle(g, lead);
  if (s.vol>1 && !o.t) s.t = S_(s.prev).t;
  s.prem = makePremise(g, lead && !lead.team ? lead : null);
  if (pub && pub.imp.length && R()<0.25) s.imp = pick(pub.imp);
  // hype for launch orders
  const fame = (W.fame + A.fame) + (lead ? lead.pop*0.4 : 0);
  s.hy = +(1 + 0.45*fame + (tier===0?0.25:0) + (s.vol>1?0.3:0)).toFixed(3);
  return s;
}
function launchIssue1Demand(s, t){
  const yr=yearOf(t), M=mkt(yr), tf=TIERF[tierOf(s)];
  const gf=genreFactor(s.g, yr);
  let d = M*tf*gf*s.hy*rf(0.55,1.3);
  if (s.fmt==='gn') d*=0.35; if (s.fmt==='os') d*=0.8;
  return d;
}
function seriesTarget(s, t){
  const yr=yearOf(t), M=mkt(yr), tf=TIERF[tierOf(s)];
  const W=CR_(s.w), A=CR_(s.a);
  return M*tf*genreFactor(s.g,yr)*(1+0.22*(W.fame+A.fame))*(0.12+1.5*s.q*s.q)*Math.exp(s.fan)*(1+0.2*s.leg);
}
function issueDayCalc(s, n){ let d=s.st; for (let i=0;i<n-1 && i<s.dw.length;i++) d+=s.dw[i]*7; return d; }
function note(s, t, txt){ s.notes.push([t, txt]); if (s.notes.length>14) s.notes.splice(1,1); }
function tl(t, txt, sid){ G.cm.tl.unshift([t,txt,sid]); if (G.cm.tl.length>500) G.cm.tl.length=500; }
function cmNews(h, b, ref){ if (!G.live || G.cm.hist) return; const n={t:G.day, h, b, p:null, k:'comic'}; if (ref){ if (ref.s!=null) n.cs=ref.s; if (ref.c!=null) n.cc=ref.c; if (ref.r!=null) n.cr=ref.r; } G.news.unshift(n); if (G.news.length>320) G.news.length=320; }
function sTitle(s){ return s.t+(s.vol>1?' (vol. '+s.vol+')':''); }
function isKey(s, n){ return n===1 || s.keys.some(k=>k[0]===n); }

function mkVariants(s, n, t){
  const yr=yearOf(t), tier=tierOf(s); const v=[];
  const big = n===1 || s.keys.some(k=>k[0]===n && (k[1]==='ann'||k[1]==='dth'||k[1]==='fa'&&CH_(k[2]).pop>0.8));
  if (yr>=1990 && yr<2000){ if (big && tier<=2 && R()<0.6) v.push('F'); if (yr>=1997 && n===1 && tier<=1 && R()<0.5) v.push('R10'); }
  else if (yr>=2000){
    if (tier<=1){ if (R()<(n===1?0.95:0.55)) v.push('B'); if (n===1||big){ v.push('R10'); if (R()<0.8) v.push('R25'); if (R()<0.5) v.push('R50'); if (R()<(yr>=2012?0.5:0.2)) v.push('R100'); if (yr>=2010 && R()<0.45) v.push('V25'); if (yr>=2008 && R()<0.3) v.push('S100'); if (yr>=2008 && R()<0.55) v.push('X'+ri(8,30)*100); } else if (R()<0.35) v.push('R25'); }
    else if (tier===2){ if (R()<(n===1?0.75:0.3)) v.push('B'); if (n===1){ if (R()<0.6) v.push('R10'); if (R()<0.3) v.push('R25'); if (yr>=2012 && R()<0.25) v.push('X'+ri(5,15)*100); } }
    else if (n===1){ if (R()<0.3) v.push('B'); if (yr>=2012 && R()<0.12) v.push('X'+ri(2,5)*100); }
    if (G.cm.conWeek && tier<=3 && R()<0.12) v.push('C'+ri(3,10)*100);
    if (big && (n===50||n===100||n===200) && R()<0.6) v.push('F');
  }
  return v.join(',');
}
function varRun(s, n, code){
  const pr=(s.pr[n-1]||0)*100; if (!code) return Math.round(pr*(1 - (s.v[n]&&s.v[n].split(',').includes('B')?0.25:0) - (s.v[n]&&s.v[n].split(',').includes('F')?0.4:0)));
  if (code==='B') return Math.round(pr*0.25); if (code==='F') return Math.round(pr*0.4);
  const k=code[0], x=+code.slice(1);
  if (k==='R'||k==='V'||k==='S') return Math.max(20, Math.round(pr/x));
  if (k==='X'||k==='C') return x;
  return pr;
}
let VAR_N = c=>{ if (!c) return 'Cover A'; if (c==='B') return 'Cover B'; if (c==='F') return 'Foil cover'; const k=c[0], x=c.slice(1);
  return k==='R'?'1:'+x+' ratio variant': k==='V'?'1:'+x+' virgin variant': k==='S'?'1:'+x+' sketch variant': k==='X'?'Retailer exclusive': k==='C'?'Convention exclusive':c; };

// ---------- release an issue ----------
function releaseIssue(s, t){
  const yr=yearOf(t), M=mkt(yr), tier=tierOf(s); const n=s.n+1; const live=!G.cm.hist;
  if (n===1){ s.sts='on'; const W=CR_(s.w), A=CR_(s.a); assignCreator(s,W,1,'W'); if (s.a!==s.w) assignCreator(s,A,1,'A'); if (s.cv>=0 && s.cv!==s.a) assignCreator(s,CR_(s.cv),1,'C'); if (s.col>=0) assignCreator(s,CR_(s.col),0,'L'); if (s.ed>=0) assignCreator(s,CR_(s.ed),0,'E');
    for (const id of s.ch){ const c=CH_(id); if (!c.fa){ c.fa=[s.id,1]; if (!s.keys.some(k=>k[0]===1&&k[2]===id&&k[1]==='fa')) s.keys.push([1,c.team?'team':'fa',id]); } if (c.team && c.mem) for (const m of c.mem){ const mc=CH_(m); if (!mc.fa) mc.fa=[s.id,1]; } }
  }
  // pending full appearance after a cameo
  if (s.pend && s.pend[1]===n){ const c=CH_(s.pend[0]); c.fa=[s.id,n]; s.keys.push([n,'fa',c.id]); s.pend=null; }
  // demand
  if (n===1){ s.rd = launchIssue1Demand(s,t); s.r0=s.rd; s.ord = s.rd*rf(0.8,1.25); }
  else {
    const q=s.q;
    s.fan *= 0.97;
    if (q>0.6 && s.crit>=0) s.fan += (q-0.6)*rf(0.05,0.36)*(tier>=2?1.55:0.7);
    else if (q<0.45) s.fan -= rf(0,0.02);
    if (R() < 0.014*q*(tier>=2?1.6:0.6) && q>0.6){ s.fan += rf(0.3,0.8); note(s,t,'Word of mouth took off around issue #'+n+'.'); cmNews(`READERS CAN'T STOP TALKING ABOUT ${s.t.toUpperCase()}`, `Shops report customers asking for back issues of the ${pubName(s)} series.`, {s:s.id}); }
    s.fan = +clamp(s.fan, -1.2, 3.4).toFixed(3);
    const T=seriesTarget(s,t);
    s.rd = (s.rd + (T - s.rd)*0.3) * (n<=4?0.93:0.992) * Math.exp(gauss()*0.04);
    s.rd = Math.min(s.rd, M*4);
    // retailers order off what the last issue did
    const prevPr = (s.pr[n-2]||0)*100; const soldOut = s.so===n-1;
    s.ord = 0.45*s.ord + 0.55*s.rdPrev*(1.0+(soldOut?0.15:0)) * rf(0.95,1.08);
  }
  let pr = s.ord*rf(1.02,1.12);
  if (yr>=1991 && yr<=1995 && (n===1 || isKey(s,n))) pr *= rf(1.8,3.2); // speculator-era overprinting
  if (s.cx===n) pr*=0.72;
  pr = Math.max(tier===5?120:250, pr);
  s.pr.push(Math.max(1,Math.round(pr/100)));
  s.dw.push(n===1?0:Math.max(1,Math.round((t - s.lastT)/7)));
  s.rd=Math.round(s.rd); s.ord=Math.round(s.ord); s.r0=Math.round(s.r0);
  s.lastT=t; s.n=n; s.rdPrev=s.rd;
  // variants
  const vv=mkVariants(s,n,t); if (vv) s.v[n]=vv;
  // sellouts and later printings
  const printed=s.pr[n-1]*100;
  if (s.rd > printed*1.03 && yr>=1980){
    s.so=n; const run2 = Math.max(150, Math.round((s.rd-printed)*rf(0.5,1.0)/100)*100);
    (s.pp[n]=s.pp[n]||[]).push([Math.round(run2/100), t+ri(14,35)]);
    if (n===1 || tier>=2) note(s,t,`#${n} sold out at the distributor and went back to press.`);
    if (tier>=2 || n===1) cmNews(`${s.t.toUpperCase()} #${n} SELLS OUT`, `${pubName(s)} has ordered a second printing. First printings are already hard to find at cover price.`, {s:s.id});
    if (s.rd > (printed+run2)*1.25 && R()<0.6) s.pp[n].push([Math.round(run2*rf(0.4,0.8)/100), t+ri(42,80)]);
  }
  // history of readership
  if (s.rd>s.pk){ s.pk=Math.round(s.rd); s.pky=yr; }
  // critical reception becomes known after the second issue
  if (n===2 || (n===1 && (s.fmt==='gn'||s.fmt==='os'))){
    s.crit = +clamp(s.q+gauss()*0.08,0,1).toFixed(2);
    if (s.crit>=0.84){ note(s,t,'Critics embraced it from the start.'); cmNews(`CRITICS RAVE ABOUT ${s.t.toUpperCase()}`, `${pick(OUTLETS)} calls the ${CG[s.g].n.toLowerCase()} book from ${pubName(s)} one of the best debuts of the year.`, {s:s.id}); }
  }
  // breakout detection
  if (!s.bo && n>=4 && s.rd >= s.r0*3 && s.rd > mkt(yr)*0.2){ s.bo=yr; note(s,t,`Became a surprise hit in ${yr}, selling ${Math.round(s.rd/s.r0)} times what #1 launched with.`); tl(t, `${sTitle(s)} breaks out`, s.id); cmNews(`${s.t.toUpperCase()} IS THE BREAKOUT HIT OF THE YEAR`, `Orders keep climbing issue after issue. Early printings of the first issue have become hard to find.`, {s:s.id}); }
  // story events that make an issue matter
  storyEvents(s, n, t);
  // creative team changes on ongoing books
  if (s.fmt==='on' && n>6 && R()<1/26) changeTeam(s, n, t);
  // anniversary
  if ([25,50,75,100,150,200,250,300].includes(n)) s.keys.push([n,'ann',0]);
  // characters ride the series
  for (const id of s.ch){ const c=CH_(id); c.pop = +(c.pop*0.9 + 0.1*(0.8*s.heat + 0.05)).toFixed(3); }
  // cancellation and endings
  const thr = Math.max(CM_TIER_MIN[tier]*M/38000, s.r0*(tier===0?0.4:0.33));
  const minRun=(tier===0?6:tier===1?5:3)+(Math.imul(s.id+7,2654435761)>>>0)%(tier<=1?9:5);
  if (s.fmt==='on' && !s.cx && n>=minRun){ if (s.rd<thr){ s.low++; if (s.low>=2){ s.cx=n+ri(1,3); note(s,t,`Cancelled; the final issue was #${n+2}.`); if (s.crit>=0.75) cmNews(`CRITICALLY ACCLAIMED ${s.t.toUpperCase()} CANCELLED`, `${pubName(s)} says #${n+2} will be the last issue. Fans have started a letter campaign.`, {s:s.id}); else if (tier<=2) cmNews(`${s.t.toUpperCase()} TO END WITH #${n+2}`, `Sales never found their footing.`, {s:s.id}); } } else s.low=0; }
  if (s.fmt==='on' && !s.cx && n>=8 && R()<endHazard(s,n,yr)){
    // the creative team wraps up, or the publisher resets the book. Either way there is a final arc, then maybe a new #1.
    s.pe=1; s.cx=n+ri(1,4); const rl=relaunchChance(s,yr); if (R()<rl) s.relaunch=1;
    note(s,t,s.relaunch?`Volume ${s.vol} was set to end with #${s.cx}, with a relaunch to follow.`:`The creative team planned to end the series with #${s.cx}.`);
    if (tier<=1 || s.bo || s.heat>1.2) cmNews(`${s.t.toUpperCase()} TO END WITH #${s.cx}`, s.relaunch?`${pubName(s)} says a new #1 is coming.`:`The creators say the story is finished.`, {s:s.id}); }
  const pub=pubOf(s); const folded = pub && pub.x && yr>=pub.x;
  if ((s.plan && n>=s.plan) || s.cx===n || folded){ endSeries(s, t, s.cx===n && !s.relaunch && !s.pe ? 'cx' : 'end'); }
  else { let gap=s.sch; if (tier>=2 && R()<0.12) gap += 28*ri(1,2); s.nx = t + gap; }
  heatOf(s, t);
}
function storyEvents(s, n, t){
  const hero=s.g===GI.hero, lead=s.ch.length?CH_(s.ch[0]):null;
  if (s.fmt!=='gn' && R() < (hero?0.07:0.03)+(n<=3?0.03:0)){
    const c=makeChar(s,{}); c.ser=[]; c.cr=[s.w,s.a];
    if (R()<0.28 && !s.pend && s.fmt!=='os'){ c.cam=[s.id,n]; s.keys.push([n,'cam',c.id]); s.pend=[c.id,n+1]; }
    else { c.fa=[s.id,n]; s.keys.push([n,'fa',c.id]); }
    s.sup=(s.sup||[]); s.sup.push(c.id); if (s.sup.length>12) s.sup.shift();
  }
  if (lead && !lead.team){
    if (!lead.dead && n>12 && (lead.dc||0)<2 && (!lead.rt || n-lead.rt>=60) && R()<0.006){ lead.dead=1; lead.dc=(lead.dc||0)+1; s.keys.push([n,'dth',lead.id]); lead.h.push([t,(lead.dc>1?'Died again in ':'Died in ')+s.t+' #'+n]); note(s,t, lead.dc>1? `${lead.n} died again in #${n}.` : `${lead.n} died in #${n}.`); cmNews(`${lead.n.toUpperCase()} DIES IN ${s.t.toUpperCase()} #${n}`, `Retailers report the issue selling through fast. Collectors are skeptical it will stick.`, {s:s.id,c:lead.id}); }
    else if (lead.dead && R()<0.015 && !s.keys.some(k=>k[1]==='dth' && k[2]===lead.id && n-k[0]<12)){ lead.dead=0; lead.rt=n; s.keys.push([n,'ret',lead.id]); lead.h.push([t,'Returned in '+s.t+' #'+n]); note(s,t,`${lead.n} came back in #${n}.`); }
    if (hero && R()<0.01) s.keys.push([n,'cos',lead.id]);
    if (R()<0.007 && n>3) s.keys.push([n,'ori',lead.id]);
  }
  if (n>1 && R()<0.022) s.keys.push([n,'arc',0]);
  const cvA=CR_(s.cv); if (R() < 0.003 + (cvA? cvA.fame*0.004 : 0)) s.keys.push([n,'ic',s.cv]);
  if (R()<0.0018) s.keys.push([n,'cont',0]);
  // fan favourites emerge among supporting characters
  if (s.sup && s.sup.length && R() < 0.02*(0.5+s.heat)){ const c=CH_(pick(s.sup)); c.pop = +(c.pop+rf(0.4,1.4)).toFixed(3); c.h.push([t,'Became a fan favourite in '+s.t]); }
}
function changeTeam(s, n, t){
  const tier=tierOf(s); const role = R()<0.55?'W':'A';
  const old = CR_(role==='W'?s.w:s.a); old.load=Math.max(0,old.load-1);
  const c = pickCreator(role, t, s.g, tier, old);
  if (role==='W') s.w=c.id; else s.a=c.id; if (s.cv===old.id) s.cv=c.id; s.fan=+(s.fan*0.85).toFixed(3);
  const W=CR_(s.w), A=CR_(s.a);
  const nq = clamp(0.45*W.tal+0.35*A.tal+0.2*R(),0.02,0.99);
  s.q = +(0.45*s.q + 0.55*nq).toFixed(3);
  assignCreator(s, c, n, role); s.keys.push([n,'ct',c.id]);
  if (c.fame>1.2) { s.hy=(s.hy||1)+0.3; cmNews(`${c.n.toUpperCase()} TAKES OVER ${s.t.toUpperCase()}`, `The ${ROLE_N[role].toLowerCase()} starts with #${n}. Orders are up.`, {s:s.id,r:c.id}); s.ord*=1.25; }
}
function endSeries(s, t, why){
  s.sts = why==='cx'?'cx':'end'; s.en=t; s.keys.push([s.n,'fin',0]);
  for (const id of new Set([s.w,s.a,s.cv])) if (id>=0){ const c=CR_(id); c.load=Math.max(0,c.load-1); }
  const i=G.cm.act.indexOf(s.id); if (i>=0) G.cm.act.splice(i,1);
  // collected editions
  const yr=yearOf(t);
  if (yr>=1987 && s.n>=3 && (s.crit>0.55 || s.pk>mkt(yr)*0.15)){ const vols=Math.max(1,Math.ceil(s.n/6)); for (let v=1; v<=Math.min(vols,12); v++){ s.tr.push(['T',v,t+ri(60,160),Math.max(3,Math.round(s.pk*rf(0.05,0.12)/100)), (v-1)*6+1, Math.min(s.n,v*6)]); } if (s.crit>0.8 && s.n>=10) s.tr.push(['H',1,t+ri(200,500),Math.max(2,Math.round(s.pk*0.015/100)),1,s.n]); }
  if (s.relaunch){ const wr=CR_(s.w); const keepW = wr && !wr.ret && R()<0.4; const delay = tierOf(s)<=1? ri(6,14)*7 : ri(20,70)*7;
    const ns=createSeries(t+delay, {pub:s.pub,g:s.g,vol:s.vol+1,prev:s.id,t:s.t,lead:s.ch[0],fmt:'on',w:keepW?s.w:undefined}); ns.hy+=0.4+Math.min(0.6,s.heat*0.2); ns.fan=+clamp(s.fan*0.4,0,1.2).toFixed(3); ns.an=t; cmNews(`${s.t.toUpperCase()} RELAUNCHES WITH A NEW #1`, `${pubName(s)} restarts the ${CG[s.g].n.toLowerCase()} series${keepW?' with the same writer':' with a new creative team'}. Volume ${ns.vol} begins ${fmtDate(ns.st,true)}.`, {s:ns.id}); G.cm.act.push(ns.id); note(s,t,'Relaunched with a new #1.'); }
}
function heatOf(s, t){
  const yr=yearOf(t); const rs = s.rd/(mkt(yr)*0.12);
  const P = Math.log2(1+rs);
  const alive = s.sts==='on'||s.sts==='ann';
  const base = alive ? 0.32*P + 0.42*Math.max(0,s.fan) : 0.12*P + 0.3*Math.max(0,s.fan);
  const c = s.crit>=0 ? Math.max(0,s.crit-0.66)*2.4 : 0;
  s.heat = +(base + c + 0.4*s.leg).toFixed(3);
  return s.heat;
}

// ---------- adaptations ----------
const AD_STAGES = { film:['rumour','option','writer attached','director attached','greenlit','casting','in production','trailer','released'], tv:['rumour','option','writer attached','in development','series ordered','casting','in production','trailer','released'] };
const AD_W = [0.7,2.0,2.4,3.0,4.5,5.5,6.0,6.0,0];
function adStage(a){ return AD_STAGES[a.k][a.sg]; }
function adPrint(a){ const s=S_(a.sid); return (a.k==='film'?'Film':'Series')+' adaptation of '+s.t; }
function adStartMaybe(t){
  const yr=yearOf(t); const rate = yr<1970?0.08: yr<1990?0.3: yr<2005?0.6: yr<2012?1: 1.6;
  const cand = G.cm.ser.filter(s=>s.n>0 && !s.ad.some(id=>!G.cm.ad[id].end) && !(s.adCool>t) && (s.heat+s.leg*0.6+ (s.ch.length?CH_(s.ch[0]).pop*0.6:0))>1.1);
  for (const s of cand){
    const lead=s.ch.length?CH_(s.ch[0]):null; const prom = Math.min(5, s.heat + s.leg*0.6 + (lead?lead.pop*0.6:0));
    if (R() < rate*0.0045*prom){
      const k = yr<1990 ? (R()<0.6?'film':'tv') : (R()<0.4?'film':'tv');
      const prevSt=new Set(s.ad.map(id=>G.cm.ad[id].st)); const sts=(k==='film'?STUDIOS_FILM:STUDIOS_TV).filter(x=>!prevSt.has(x));
      const a={ id:G.cm.ad.length, sid:s.id, cid: lead && !lead.team ? lead.id : (lead?lead.id:-1), k, st: pick(sts.length?sts:(k==='film'?STUDIOS_FILM:STUDIOS_TV)), sg:0, t0:t, t, real:1, aq:+clamp(0.47+gauss()*0.17+(s.q-0.5)*0.3,0,1).toFixed(2), tf:1, out:'', ssn:0, end:0, why:'' };
      if (R()<0.55){ a.sg=0; a.real = R()<0.55?1:0; } else a.sg=1;
      G.cm.ad.push(a); s.ad.push(a.id); if (a.cid>=0) CH_(a.cid).ad.push(a.id);
      if (a.sg===0){ cmNews(`STUDIO REPORTEDLY CIRCLING ${s.t.toUpperCase()}`, `An unconfirmed report says ${a.st} has held early talks about the ${pubName(s)} series. Nobody involved has commented.`, {s:s.id}); s.fro+=0.12; }
      else { note(s,t,`${a.st} optioned the ${a.k==='film'?'film':'television'} rights in ${yr}.`); cmNews(`${a.st.toUpperCase()} OPTIONS ${s.t.toUpperCase()}`, `The ${a.k==='film'?'film':'television'} rights have been optioned. Options are early and most never reach the screen.`, {s:s.id}); s.fro+=0.25; }
    }
  }
}
function adTick(t){
  for (const a of G.cm.ad){
    if (a.end) continue; const s=S_(a.sid); const age=(t-a.t)/30;
    const kill = (why, txt)=>{ a.end=t; a.why=why; s.adCool=t+365*ri(3,6); s.fro -= why==='false'?0.25:0.35; if (txt) note(s,t,txt); };
    if (a.sg===0){ // rumour resolves
      if (age>=1 && R()<0.25){ if (a.real){ a.sg=1; a.t=t; note(s,t,`${a.st} optioned the ${a.k==='film'?'film':'TV'} rights in ${yearOf(t)}.`); cmNews(`${s.t.toUpperCase()} OPTION CONFIRMED`, `${a.st} has formally optioned the ${a.k==='film'?'film':'television'} rights. The rumour was true, for now.`, {s:s.id}); s.fro+=0.2; }
        else { kill('false', null); cmNews(`${s.t.toUpperCase()} ADAPTATION REPORT PROVES UNFOUNDED`, `The creator says there were conversations, nothing more. Collectors who bought on the rumour are listing copies.`, {s:s.id}); } }
      continue;
    }
    if (a.sg>=1 && a.sg<=3){ // development hell
      const pUp = [0,0.1,0.09,0.08][a.sg]*(0.6+s.heat*0.25+ (a.cid>=0?CH_(a.cid).pop*0.1:0));
      const pDie = a.sg===1 ? (age>18? 0.12 : 0.012) : 0.02;
      if (R()<pUp){ a.sg++; a.t=t; const st=adStage(a);
        if (a.sg===4){ note(s,t,`${a.k==='film'?'The film was greenlit':'A series order came through'} in ${yearOf(t)}.`); tl(t,`${adPrint(a)} greenlit`,s.id); cmNews(`${s.t.toUpperCase()} ${a.k==='film'?'FILM GREENLIT':'GETS SERIES ORDER'}`, `${a.st} is moving ahead. A greenlight is the first stage where most projects actually get made.`, {s:s.id}); s.fro+=0.2; }
        else cmNews(`${s.t.toUpperCase()} ADAPTATION: ${st.toUpperCase()}`, `${a.st}'s ${a.k==='film'?'film':'series'} takes another step, though it remains in development.`, {s:s.id});
      }
      else if (R()<pDie){ const why = a.sg===1?'expired':'stalled'; kill(why, `The ${a.st} option ${why==='expired'?'expired':'stalled in development'} in ${yearOf(t)}.`); cmNews(a.sg===1?`${s.t.toUpperCase()} OPTION EXPIRES`:`${s.t.toUpperCase()} ADAPTATION STALLS`, a.sg===1?`${a.st} let the rights lapse. The project is back on the market.`:`The project has lost momentum at ${a.st}. Sources describe it as shelved.`, {s:s.id}); }
      else if (a.sg===3 && R()<0.015){ a.sg=2; a.t=t; s.fro-=0.15; cmNews(`${s.t.toUpperCase()} ADAPTATION LOSES ITS ${a.k==='film'?'DIRECTOR':'SHOWRUNNER'}`, `Creative differences, according to the studio.`, {s:s.id}); }
      continue;
    }
    const dur=[0,0,0,0,4,5,8,3,0][a.sg];
    if (a.sg>=4 && a.sg<=7){
      if (a.sg===6 && R()<0.004){ kill('cancelled', `The ${a.k==='film'?'film':'series'} was cancelled during production.`); cmNews(`${s.t.toUpperCase()} ADAPTATION CANCELLED MID-PRODUCTION`, `${a.st} has pulled the plug.`, {s:s.id}); continue; }
      if (age>=dur*rf(0.8,1.4)){
        a.sg++; a.t=t;
        if (a.sg===5) cmNews(`CASTING ANNOUNCED FOR ${s.t.toUpperCase()}`, `Fans are debating the choices.`+(a.cid>=0?` The role of ${CH_(a.cid).n} has been filled.`:''), {s:s.id,c:a.cid>=0?a.cid:null});
        if (a.sg===6) cmNews(`CAMERAS ROLL ON ${s.t.toUpperCase()}`, `Production has started at ${a.st}.`, {s:s.id});
        if (a.sg===7){ a.tf = +clamp(0.6+a.aq*0.9+gauss()*0.15,0.5,1.6).toFixed(2); s.fro += (a.tf-0.9)*0.4; cmNews(`${s.t.toUpperCase()} TRAILER ${a.tf>1.15?'SENDS COLLECTORS SEARCHING FOR FIRST APPEARANCES':a.tf<0.85?'LANDS WITH A THUD':'DRAWS A MIXED RESPONSE'}`, a.tf>1.15?'The trailer is everywhere. Early issues of the comic are being pulled from long boxes.':'Reaction online is lukewarm.', {s:s.id}); }
        if (a.sg===8) adRelease(a, s, t);
      }
      continue;
    }
    if (a.sg===8 && a.k==='film' && t-a.t>270){ a.end=t; a.why='released'; continue; }
    if (a.sg===8 && a.k==='tv' && a.ssn>0 && t-a.t>365){ // renewal decision
      a.t=t; if (a.out==='hit'||a.out==='solid'&&R()<0.65||a.out==='cult'&&R()<0.4){ a.ssn++; s.leg+=0.25; if (a.cid>=0) CH_(a.cid).rec+=0.6; cmNews(`${s.t.toUpperCase()} RENEWED FOR SEASON ${a.ssn}`, `${a.st} orders more.`, {s:s.id}); }
      else { a.end=t; a.why='ended'; note(s,t,`The ${a.st} show was cancelled after ${a.ssn} season${a.ssn>1?'s':''}.`); cmNews(`${s.t.toUpperCase()} CANCELLED AFTER ${a.ssn} SEASON${a.ssn>1?'S':''}`, `The show will not return.`, {s:s.id}); }
    }
  }
}
function adRelease(a, s, t){
  const score = a.aq*0.8 + s.q*0.2 + gauss()*0.08;
  a.out = score>0.7?'hit': score>0.57?'solid': score>0.46 && s.crit>0.72?'cult': score>0.39?'mixed':'flop';
  const lead = a.cid>=0?CH_(a.cid):null;
  const eff = {hit:[2.5,6,1.2,0.3], solid:[1.2,3.5,0.5,0.1], cult:[1.2,2.5,0.5,0.15], mixed:[0.3,0.8,0.1,-0.25], flop:[0,0.3,-0.1,-0.5]}[a.out];
  s.leg += eff[0]; s.fan += eff[2]; s.fro += eff[3]; if (lead){ lead.rec += eff[1]; lead.pop += eff[1]*0.3; }
  if (a.k==='tv') a.ssn=1;
  if (a.out==='flop'||a.out==='mixed') s.adCool=t+365*ri(5,9);
  const yr=yearOf(t);
  const words = {hit:'became a genuine hit', solid:'did solid business', cult:'found a devoted cult audience', mixed:'drew mixed reviews and middling numbers', flop:'flopped'}[a.out];
  note(s,t,`The ${a.k==='film'?'film':'TV series'} from ${a.st} premiered in ${yr} and ${words}.`); tl(t, `${adPrint(a)} ${words}`, s.id);
  cmNews(a.out==='hit'?`${s.t.toUpperCase()} ${a.k==='film'?'OPENS BIG':'IS A HIT'}`: a.out==='flop'?`${s.t.toUpperCase()} ADAPTATION FLOPS`:`${s.t.toUpperCase()} PREMIERES TO ${a.out==='cult'?'A SMALL BUT DEVOTED AUDIENCE':'A MIXED RESPONSE'}`,
    a.out==='hit'?'Audiences love it, and first appearances are moving.': a.out==='flop'?'Reviews are harsh and audiences stayed away. Speculators are heading for the exits.':'The comic\'s fans are divided.', {s:s.id, c:lead?lead.id:null});
  // adapted storyline: the issues the adaptation drew from
  if (s.n>=3 && a.out!=='flop'){ const n0 = 1+Math.floor(R()*Math.max(1,s.n-3)); s.keys.push([n0,'as',a.id]); }
}
function adW(a, t){ if (a.end) return 0; let w=AD_W[a.sg]; if (a.sg===7) w*=a.tf; if (a.sg===0) w*=0.7;
  if (a.sg===8) w = Math.max(0, 6 - (t - a.t)/45) * ({hit:1.1,solid:0.8,cult:0.7,mixed:0.35,flop:0}[a.out]||0.5);
  return w; }
function specOf(s){ let sp=0; for (const id of s.ad) sp=Math.max(sp, adW(G.cm.ad[id], G.cm.now)); return sp; }

// ---------- awards ----------
function awardsTick(t, stage){
  const yr=yearOf(t); if (yr<1962) return;
  const recent = G.cm.ser.filter(s=>s.n>0 && s.crit>=0 && (s.sts==='on' || s.en>t-365));
  const pickTop=(arr,f,k)=>arr.map(x=>[x,f(x)+gauss()*0.06]).sort((a,b)=>b[1]-a[1]).slice(0,k).map(x=>x[0]);
  if (stage==='nom'){
    const noms={};
    noms.bs = pickTop(recent.filter(s=>s.fmt==='on' && s.n>12), s=>s.crit+s.q*0.4, 5);
    noms.bn = pickTop(recent.filter(s=>s.st>t-420 && s.fmt!=='gn'), s=>s.crit+s.q*0.4, 5);
    noms.bl = pickTop(recent.filter(s=>s.fmt==='ls'), s=>s.crit+s.q*0.4, 5);
    noms.bg = pickTop(recent.filter(s=>s.fmt==='gn'), s=>s.crit+s.q*0.4, 5);
    noms.bi = pickTop(recent.filter(s=>s.n>1), s=>s.crit+s.q*0.4, 5);
    const crs=[...new Set(recent.map(s=>s.w))].map(CR_); noms.bw = pickTop(crs, c=>c.tal+c.crit*0.3, 5).map(c=>c.id);
    const ars=[...new Set(recent.map(s=>s.a))].map(CR_); noms.ba = pickTop(ars, c=>c.tal+c.crit*0.3, 5).map(c=>c.id);
    for (const k of ['bs','bn','bl','bg','bi']) noms[k]=noms[k].map(s=>s.id);
    G.cm.noms={yr, n:noms};
    for (const k of ['bs','bn','bl','bg','bi']) for (const id of noms[k]){ const s=S_(id); s.fan+=0.06; s.aw.push([yr,k,'N']); }
    for (const k of ['bw','ba']) for (const id of noms[k]) CR_(id).aw.push([yr,k,'N']);
    const top=noms.bn.slice(0,3).map(id=>S_(id).t).join(', ');
    if (top) cmNews(`${yr} ${AWARD_NAME.toUpperCase()} NOMINEES ANNOUNCED`, `Best New Series nominees include ${top}.`, null);
    return;
  }
  const nm=G.cm.noms; if (!nm || nm.yr!==yr) return;
  const res=[];
  for (const [k,nmx] of AWARD_CATS){
    const arr=nm.n[k]; if (!arr || !arr.length) continue;
    let win;
    if (k==='bw'||k==='ba'){ win = arr.map(id=>[id, CR_(id).tal+CR_(id).crit*0.3+gauss()*0.08]).sort((a,b)=>b[1]-a[1])[0][0]; const c=CR_(win); c.fame+=0.35; c.crit=Math.min(1,c.crit+0.05); c.aw = c.aw.filter(x=>!(x[0]===yr&&x[1]===k)); c.aw.push([yr,k,'W']); res.push(nmx+': '+c.n); G.cm.aw.push([yr,k,'c',win]); }
    else { win = arr.map(id=>[id, S_(id).crit+S_(id).q*0.4+gauss()*0.08]).sort((a,b)=>b[1]-a[1])[0][0]; const s=S_(win); s.fan+=0.35; s.leg+=0.5; s.aw = s.aw.filter(x=>!(x[0]===yr&&x[1]===k)); s.aw.push([yr,k,'W']); CR_(s.w).fame+=0.15; if (s.a!==s.w) CR_(s.a).fame+=0.12;
      if (k==='bi'){ const n0=Math.max(1, s.n-ri(0,Math.min(10,s.n-1))); s.keys.push([n0,'aw',0]); note(s,t,`#${n0} won ${nmx} at the ${yr} ${AWARD_NAME}.`); } else note(s,t,`Won ${nmx} at the ${yr} ${AWARD_NAME}.`);
      res.push(nmx+': '+s.t); G.cm.aw.push([yr,k,'s',win]); tl(t, `${s.t} wins ${nmx}`, s.id); }
  }
  cmNews(`${yr} ${AWARD_NAME.toUpperCase()}: THE WINNERS`, res.slice(0,4).join('. ')+'.', null);
}

// ---------- the weekly tick ----------
function launchRate(yr){ return (yr<1941?0.14: yr<1956?0.26: yr<1970?0.2: yr<1985?0.24: yr<1991?0.5: yr<1995?0.85: yr<2000?0.5: yr<2010?0.85: yr<2020?1.1: 1.25); }
const SERIAL_G=new Set(['hero','kids','adventure','western','war','comedy','romance','horror','fantasy','scifi','crime']);
const STORY_G=new Set(['literary','slice','exp','historical','alt','mystery','thriller','satire']);
// how likely an ongoing book is to end (on purpose or by reset) in any given issue. Hits run longer, but nothing runs forever.
function endHazard(s, n, yr){
  const tier=tierOf(s), k=CG[s.g].k; let mean;
  if (tier<=1) mean = yr<1960? 105 : yr<1990? 66 : yr<2000? 34 : 24;
  else mean = yr<1990? 48 : 22;
  if (tier===1) mean*=1.1; if (STORY_G.has(k)) mean*=0.6; else if (k==='manga') mean*=0.8; else if (SERIAL_G.has(k)) mean*=1.1;
  const prestige = clamp(s.heat,0,3)+(s.bo?0.8:0)+Math.min(0.6, s.leg*0.3); mean*=Math.exp(0.36*prestige);
  const ramp = 0.35+0.65*Math.min(1, n/24);
  // very long runs get harder to sustain: writers burn out, characters get reset, publishers want a fresh #1
  const age = 1 + Math.pow(Math.max(0,n-90)/110, 1.4);
  return ramp*age/mean;
}
function relaunchChance(s, yr){ const tier=tierOf(s); const hit = s.bo || s.heat>1.3;
  if (tier<=1) return yr<1990? 0.2 : yr<2000? 0.7 : 0.9;
  if (tier===2) return hit? 0.5 : 0.22; return hit? 0.3 : 0.1; }
function cmWeek(t){
  const yr=yearOf(t), md=mdOf(t); G.cm.now=t;
  G.cm.conWeek = CONS.some(c=>c[1]===md[0] && Math.abs(c[2]-md[1])<=3);
  // announcements two to three months out
  const nl = poisson(launchRate(yr));
  for (let i=0;i<nl;i++){ const s=createSeries(t+7*ri(6,11)); s.an=t; G.cm.act.push(s.id); if (!G.cm.hist && (tierOf(s)<=1 || s.hy>1.6)) cmNews(`ANNOUNCED: ${s.t.toUpperCase()}`, `${pubName(s)} solicits a new ${CG[s.g].n.toLowerCase()} ${s.fmt==='on'?'ongoing series':s.fmt==='ls'?s.plan+'-issue limited series':s.fmt==='gn'?'original graphic novel':'one-shot'} from ${CR_(s.w).n}${s.a!==s.w?' and '+CR_(s.a).n:''}.`, {s:s.id}); }
  // releases
  for (const id of G.cm.act.slice()){ const s=S_(id); if (s.nx<=t && (s.sts==='ann'||s.sts==='on')) releaseIssue(s,t); }
  // ended series cool off, froth decays, speculation follows the adaptations
  for (const s of G.cm.ser){ if (s.fro) { s.fro*=0.93; if (Math.abs(s.fro)<0.01) s.fro=0; } }
  if (md[1]<=7){ // monthly
    adStartMaybe(t); adTick(t);
    for (const s of G.cm.ser){ if (s.n===0) continue; s.hl = s.hl==null? s.heat : +(0.88*s.hl+0.12*s.heat).toFixed(3); const sp=specOf(s); s.spec=+sp.toFixed(2); if (s.sts!=='on'){ s.fan=+(s.fan*0.985).toFixed(3); s.rd=Math.round(s.rd*0.97); heatOf(s,t); } if (s.leg>0) s.leg=+(s.leg*0.9985).toFixed(3); }
    for (const c of G.cm.ch){ c.spec = 0; for (const id of c.ad) c.spec=Math.max(c.spec, adW(G.cm.ad[id], t));
      const active = c.ser.some(id=>S_(id).sts==='on'); if (!active){ c.pop = +(c.pop*0.985 + 0.015*(0.15*c.rec)).toFixed(3); } c.rec=+(c.rec*0.999).toFixed(3); c.spec=+c.spec.toFixed(2); }
    // genre fashions follow the hits
    const heatG=CG.map(()=>0), cnt=CG.map(()=>0);
    for (const id of G.cm.act){ const s=S_(id); heatG[s.g]+=s.heat; cnt[s.g]++; }
    const avg = heatG.reduce((a,b)=>a+b,0)/Math.max(1,cnt.reduce((a,b)=>a+b,0));
    for (let g=0; g<CG.length; g++){ const rel = cnt[g]? (heatG[g]/cnt[g])/Math.max(0.05,avg) : 1; G.cm.tr[g] = +clamp(G.cm.tr[g] + 0.02*(rel-1) + 0.02*(1-G.cm.tr[g]) + gauss()*0.01, 0.4, 2.6).toFixed(3); }
    spinoffs(t);
  }
  if (md[0]===1 && md[1]<=7){ cmYear(t); revivals(t); }
  if (md[0]===5 && md[1]<=7) awardsTick(t,'nom');
  if (md[0]===7 && md[1]>=20 && md[1]<=26) awardsTick(t,'win');
  if (md[0]===7 && md[1]>=20 && md[1]<=26 && !G.cm.hist) cmNews(`${CONS[0][0].toUpperCase()} OPENS THIS WEEKEND`, `Convention-exclusive covers are on the tables, and dealers brought their best keys.`, null);
}
// old series come back: a beloved indie gets its second book, a dormant property is bought and restarted
function revivals(t){
  const yr=yearOf(t); const next=new Set(G.cm.ser.filter(x=>x.prev>=0).map(x=>x.prev));
  for (const s of G.cm.ser){
    if (s.n<6 || (s.sts!=='end' && s.sts!=='cx') || next.has(s.id) || s.fmt==='gn' || s.fmt==='os') continue;
    const gap=yr-yearOf(s.en); if (gap<3 || gap>45) continue;
    const tier=tierOf(s); let p=0.006*(s.bo?3:1)*(s.crit>0.78?2:1)*(s.leg>0.5?2:1)*(tier>=2?1.4:1)*(s.pk>mkt(yearOf(s.st))*0.3?1.8:1); p=Math.min(0.06,p);
    if (R()>=p) continue;
    let pub=s.pub; const pb=pub>=0?G.cm.pubs[pub]:null; const acquired = pb && pb.x && pb.x<=yr; if (acquired) pub=choosePub(yr); if (pub===-1 && tier<5) pub=choosePub(yr);
    const wr=CR_(s.w), ar=CR_(s.a); const keepW=wr&&!wr.ret&&R()<0.6, keepA=ar&&!ar.ret&&R()<0.4;
    const ns=createSeries(t+ri(20,90)*7, {pub, g:s.g, vol:s.vol+1, prev:s.id, t:s.t, lead:s.ch[0], fmt:R()<0.35?'ls':'on', w:keepW?s.w:undefined, a:keepA?s.a:undefined}); ns.hy+=0.5+Math.min(0.8,(s.bo?0.4:0)+s.leg*0.2); ns.an=t; G.cm.act.push(ns.id);
    s.leg+=0.35; s.fro=(s.fro||0)+0.2; note(s,t,`Revived in ${yearOf(ns.st)}, ${gap} years after it ended.`);
    cmNews(`${s.t.toUpperCase()} RETURNS AFTER ${gap} YEARS`, `${acquired?'The rights were picked up by a new publisher. ':''}${pubName(ns)} will publish a new #1${keepW?' by the original writer':''}. Collectors are digging out the old issues.`, {s:s.id});
  }
}
function spinoffs(t){
  for (const c of G.cm.ch){
    if (c.team || c.pop<1.6 || c.dead) continue;
    if (c.ser.some(id=>S_(id).ch[0]===c.id && (S_(id).sts==='on'||S_(id).sts==='ann'))) continue;
    if (c.pub<0 || R()>0.04) continue;
    const src=S_(c.s0); if (!src) continue;
    const led = c.ser.map(S_).filter(x=>x.ch[0]===c.id).pop();
    let s;
    if (led){ if (t-led.en < 365*3 || R()>0.3) continue; s=createSeries(t+7*ri(8,12), {pub:c.pub, g:c.g, lead:c.id, t:led.t, vol:led.vol+1, prev:led.id, fmt:'on'}); note(led,t,'Relaunched with a new #1 in '+yearOf(t+70)+'.'); }
    else s=createSeries(t+7*ri(8,12), {pub:c.pub, g:c.g, lead:c.id, t: (c.g===GI.hero||R()<0.4)? c.n : makeTitle(c.g,c), fmt: R()<0.6?'on':'ls'});
    s.hy+=c.pop*0.3; G.cm.act.push(s.id);
    if (led) continue;
    c.h.push([t,'Got a solo series, '+s.t]);
    note(src, t, `${c.n}, who debuted in ${src.t}${c.fa?' #'+c.fa[1]:''}, got a solo series.`);
    cmNews(`${c.n.toUpperCase()} GETS A SOLO SERIES`, `The fan favourite first appeared in ${src.t}${c.fa?' #'+c.fa[1]:''}${c.cam?' (with a brief cameo in #'+c.cam[1]+')':''}. Back-issue hunters are already looking.`, {s:src.id, c:c.id});
  }
}
function cmYear(t){
  const yr=yearOf(t);
  for (const c of G.cm.cr){
    if (c.ret) continue;
    const age=yr-c.by; const car = c.deb? yr-yearOf(c.deb):0;
    if ((age>64 && R()<0.14) || (car>38 && R()<0.1) || (c.deb && car>3 && c.fame<0.1 && c.load===0 && R()<0.08)){ c.ret=yr; continue; }
    // fame follows the work
    let target=0; for (const id of c.works.slice(-8)){ const s=S_(id); target += (s.sts==='on'?1:0.5)*(0.3*s.heat + (s.bo?0.4:0)); }
    const old=c.fame; c.fame = +(c.fame*0.82 + 0.18*Math.min(4, target) + c.aw.filter(a=>a[0]===yr-1&&a[2]==='W').length*0.2).toFixed(3);
    c.mom = +(c.fame-old).toFixed(3);
    const cr = c.works.map(S_).filter(s=>s.crit>=0); if (cr.length) c.crit = +(cr.reduce((a,s)=>a+s.crit,0)/cr.length).toFixed(2);
  }
  for (const s of G.cm.ser){ if (s.sts!=='on') continue; if (s.bo) s.leg += 0.08; if (s.pk>mkt(yr)*0.8) s.leg+=0.05;
    const P=Math.log2(1+s.rd/(mkt(yr)*0.12)); if (s.ch.length){ const c=CH_(s.ch[0]); c.rec=+(c.rec+0.045*P*(tierOf(s)<=1?1:0.7)).toFixed(3); } }
}
// ---------- run the history ----------
async function cmGenerate(prog, endDay){
  cmInit(); prog = prog || (async()=>{});
  withCm(()=>{ for (let i=0;i<18;i++) newCreator(pick(['W','A','WA']), dateToDay(1938,1,1), pick([GI.hero,GI.crime,GI.adventure,GI.kids,GI.western,GI.war])); });
  let t = dateToDay(1938,4,6); while (dowOf(t)!==3) t++;
  const t0=t; let lastP=0;
  while (t<=endDay){
    withCm(()=>cmWeek(t));
    if (t-lastP>365*3){ lastP=t; await prog((t-t0)/(endDay-t0), 'Publishing '+yearOf(t)); }
    t+=7;
  }
  G.cm.last=t-7; G.cm.hist=false;
}
function cmCatchUp(){ // live: run any Wednesdays up to today
  if (!G.cm) return; let t=G.cm.last+7;
  while (t<=G.day){ withCm(()=>cmWeek(t)); G.cm.last=t; if (typeof cmMarketWeek==='function') cmMarketWeek(t); t+=7; }
}
