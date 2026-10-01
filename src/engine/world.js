// ===================== BASEBALL WORLD =====================
const TEAMS_DEF = [
 ['Port Calder','Anchors','PCA','#1d3b5c','#c9a227'],['Ironvale','Forgemen','IRV','#3a3a3a','#d0632a'],
 ['Bayshore','Gulls','BAY','#2a7fa8','#f2f2f2'],['Redmesa','Coyotes','RMC','#a8432a','#e3c08d'],
 ['New Harlan','Monarchs','NHM','#4b2a73','#d4af37'],['Silver Plains','Stallions','SPS','#6b7a86','#15253a'],
 ['Lakeview','Loons','LVL','#12594a','#e9e2cf'],['Granite City','Quarrymen','GCQ','#58595b','#b3242a'],
 ['Summerport','Sails','SMP','#f08a24','#0e3b63'],['Riverbend','Otters','RBO','#6b4226','#9fd3c7'],
 ['Maple Heights','Barons','MHB','#8e1b1b','#f5e6c8'],['Copperton','Smelters','CPS','#b5652b','#1f1f1f'],
 ['Eastgate','Sentinels','EGS','#0f2a4a','#9aa7b3'],['Pinecrest','Timberwolves','PCT','#1f4d2b','#c7c7c7'],
 ['Sunvale','Scorchers','SUN','#d1402b','#f4c430'],['Northshore','Huskies','NSH','#2b4c7e','#d9e2ec'],
 ['Hollow Creek','Hornets','HCH','#1c1c1c','#f2c230'],['Kingsbridge','Crowns','KBC','#5a1f5f','#e5c07b'],
 ['Westmoor','Wranglers','WMW','#7a4a1e','#2b6f77'],['Crescent Bay','Pelicans','CBP','#1f8a9e','#f28f6b'],
 ['Stonehaven','Knights','SHK','#2d2d3a','#a61c3c'],['Fairhaven','Falcons','FHF','#224e8f','#e24b2d'],
 ['Dustwater','Drifters','DWD','#a88b5c','#3b2f2f'],['Brightwater','Herons','BWH','#3f8fc4','#ffffff'],
 ['Blackrock','Bison','BRB','#3b2a1d','#c98b3a'],['Ashford','Aviators','ASA','#274060','#e0a526'],
 ['Glenmoor','Highlanders','GMH','#1c5236','#b02d2d'],['Tidewater','Tritons','TWT','#0b4f6c','#7fd1b9'],
 ['Emberton','Firebirds','EMF','#c0392b','#2c2c54'],['Starfall','Comets','SFC','#232a5c','#f5d76e']
];
const LEAGUES = ['Continental','Frontier'];
const HIT_POS = ['C','C','1B','2B','3B','SS','LF','CF','RF','DH','IF','OF'];
function isPitcher(p){ return p.pos==='SP'||p.pos==='RP'; }
function pname(p){ return p.fn+' '+p.ln; }
function teamName(t){ const T=TEAMS_DEF[t]; return T? T[0]+' '+T[1] : 'Free agent'; }
function teamAbbr(t){ return t>=0 ? TEAMS_DEF[t][2] : (t===-2?'RET':'FA'); }
function ageOf(p, t){ return yearOf(t==null?G.day:t) - p.by; }
function P(id){ return G.players[id]; }

// ---- player creation ----
function newPlayer(o){
  let fn, ln, key, guard=0;
  do { fn=pick(FIRST); ln=pick(LAST); key=fn+' '+ln; guard++; } while (G.names[key] && guard<500);
  G.names[key]=1;
  const id = G.players.length;
  const p = { id, fn, ln, pos:o.pos, by:o.by, tm:o.tm, org:o.org, ab:Math.round(o.ab), pot:Math.round(Math.max(o.ab,o.pot)),
    pw:+rf(0.1,1).toFixed(2), spd:+rf(0.05,1).toFixed(2), pop:+(o.pop!=null?o.pop:clamp((o.ab-50)/70+gauss()*0.1+0.08,0.02,0.9)).toFixed(3),
    hy:0, fm:0, inj:0, dy:o.dy||0, dd:0, ry:o.ry||0, aw:[], car:{}, cur:null, war:o.war||0, S:0, hx:[], sk:ri(0,4), num:ri(1,99), rp:0, ms:{}, lg:o.lg||0 };
  G.players.push(p);
  return p;
}
function emptyLine(p){ return isPitcher(p) ? [0,0,0,0,0,0,0,0] : [0,0,0,0,0,0,0,0]; }

function initLeague(){
  G.players=[]; G.names={}; G.stand=TEAMS_DEF.map(()=>[0,0]); G.champs={}; G.awards={}; G.rookieClass={}; G.news=[]; G.rot=TEAMS_DEF.map(()=>0);
  const yr=2020;
  TEAMS_DEF.forEach((T,ti)=>{
    const tstr = gauss()*3;
    const slots = HIT_POS.concat(['SP','SP','SP','SP','SP','RP','RP','RP','RP','RP']);
    slots.forEach((pos,si)=>{
      const age = clamp(Math.round(22+Math.abs(gauss())*6+rf(0,4)),21,39);
      const regular = (si<10 || (si>=12 && si<17));
      let ab = (regular?60:50) + gauss()*10 + tstr + (R()<0.035?rf(12,22):0);
      if (age<25) ab -= (25-age)*2;
      ab = clamp(ab, 34, 97);
      const pot = clamp(ab + Math.max(0,27-age)*rf(0.5,3.2) + Math.abs(gauss())*2, ab, 99);
      const yearsPro = clamp(Math.round(age - rf(21.5,24.5)), 0, 18);
      newPlayer({pos, by:yr-age, tm:ti, org:ti, ab, pot, dy: yr - yearsPro});
    });
    for (let k=0;k<6;k++) makeProspect(ti, yr);
  });
  // historical legends (retired before 2020)
  for (let i=0;i<44;i++){
    const pos = pick(['C','1B','2B','3B','SS','LF','CF','RF','SP','SP','RP']);
    const war = Math.round(20+Math.pow(R(),1.6)*95);
    const ry = ri(1986,2019), by = ry - ri(35,42);
    const p = newPlayer({pos, by, tm:-2, org:ri(0,29), ab:40, pot:40, dy:by+ri(21,24), ry, war, pop:clamp(0.15+war/140+gauss()*0.08,0.1,0.95), lg:1});
    p.car.tot = legendTotals(p, war);
    const mvps = war>85?ri(1,3):war>65?ri(0,1):0; for(let k=0;k<mvps;k++) p.aw.push([ri(p.dy+3,ry-3), isPitcher(p)?'ACE':'MVP']);
    const as = Math.round(war/9); for(let k=0;k<as;k++) p.aw.push([ri(p.dy+1,ry-1),'AS']);
    if (war>60) p.aw.push([ry+ri(5,9),'HOH']);
  }
}
function legendTotals(p, war){
  const yrs = p.ry - p.dy;
  if (isPitcher(p)){
    const W = Math.round(war*2.6 + yrs*4 + rf(0,20)), K = Math.round(W*11 + rf(0,500));
    return [yrs*30, yrs*25, Math.round(yrs*170*3), W, Math.round(W*0.75), K, Math.round(yrs*170*3.4/9*3*0.33), p.pos==='RP'?Math.round(war*6):0];
  }
  const H = Math.round(war*26 + yrs*55 + rf(0,200)), HR = Math.round(H*rf(0.08,0.2));
  return [yrs*140, Math.round(H/rf(0.27,0.31)), H, HR, Math.round(HR*2.3+H*0.18), Math.round(yrs*rf(3,25)), Math.round(yrs*60), Math.round(H*0.19)];
}
function makeProspect(org, yr){
  const age = ri(18,23);
  let pot = clamp(52 + gauss()*13 + (R()<0.07?rf(8,18):0), 38, 99);
  const ab = clamp(24 + (age-18)*4.5 + gauss()*5 + (pot-55)*0.15, 20, pot-4);
  return newPlayer({pos: R()<0.46 ? (R()<0.8?'SP':'RP') : pick(HIT_POS.slice(0,9)), by: yr-age, tm:-1, org, ab, pot, dy:0, pop:clamp(0.03+(pot-60)/120+gauss()*0.04,0.01,0.5)});
}
function roster(ti){ return G.players.filter(p=>p.tm===ti); }

// ---- stat helpers ----
function trueAvg(ab){ return 0.212 + (ab-40)*0.0017; }
function hrRate(p, ab){ return 0.008 + Math.pow(ab/100,2)*0.068*(0.35+p.pw); }
function trueERA(ab){ return 6.3 - ab*0.041; }
function kRate(ab){ return 0.62 + ab*0.0062; } // K per inning
function lineStr(p, s){
  if (!s) return '—';
  if (isPitcher(p)){ const ip=s[2]/3; const era = ip>0? (s[6]*9/ip).toFixed(2):'—'; return (p.pos==='RP'? s[0]+' G, '+s[7]+' SV, ' : s[3]+'-'+s[4]+', ')+era+' ERA, '+s[5]+' K'; }
  const avg = s[1]? (s[2]/s[1]).toFixed(3).replace(/^0/,'') : '.000';
  return avg+', '+s[3]+' HR, '+s[4]+' RBI';
}
function seasonValue(p, s){ // rough WAR-like measure
  if (!s) return 0;
  if (isPitcher(p)){ const ip=s[2]/3; if (ip<5) return 0; const era=s[6]*9/ip; return (4.4-era)*ip/42 + s[5]/260 + s[7]/30; }
  if (s[1]<20) return 0;
  const obp=(s[2]+s[6])/(s[1]+s[6]); const slg=(s[2]+s[7]+s[3]*2.4)/s[1];
  return ((obp+slg)-0.705)*s[0]/14 + s[5]/40 + (p.pos==='SS'||p.pos==='C'||p.pos==='CF'?s[0]/160:0);
}
function careerTotals(p){
  const t = isPitcher(p)?[0,0,0,0,0,0,0,0]:[0,0,0,0,0,0,0,0];
  for (const k in p.car){ const s=k==='tot'?p.car[k]:p.car[k].s; for(let i=0;i<8;i++) t[i]+=s[i]||0; }
  if (p.cur) for(let i=0;i<8;i++) t[i]+=p.cur[i];
  return t;
}

// ---- fast season (history) ----
function simSeasonFast(yr){
  const teamStr=[];
  TEAMS_DEF.forEach((T,ti)=>{
    const r=roster(ti);
    const hitters=r.filter(p=>!isPitcher(p)).sort((a,b)=>b.ab-a.ab);
    const sps=r.filter(p=>p.pos==='SP').sort((a,b)=>b.ab-a.ab);
    const rps=r.filter(p=>p.pos==='RP').sort((a,b)=>b.ab-a.ab);
    hitters.forEach((p,i)=>{ let share = i<9? rf(0.82,1): rf(0.2,0.5); if (R()<0.18) share*=rf(0.3,0.8); p.cur = fastHitLine(p, share, yr); });
    sps.forEach((p,i)=>{ let share = i<5? rf(0.85,1): 0.25; if (R()<0.2) share*=rf(0.3,0.8); p.cur=fastPitLine(p, share, true, false); });
    rps.forEach((p,i)=>{ let share=rf(0.6,1); if (R()<0.15) share*=0.5; p.cur=fastPitLine(p, share, false, i===0); });
    teamStr[ti] = hitters.slice(0,9).reduce((a,p)=>a+p.ab,0)/9*0.55 + sps.slice(0,5).reduce((a,p)=>a+p.ab,0)/5*0.45;
  });
  const avg = teamStr.reduce((a,b)=>a+b,0)/30;
  G.stand = teamStr.map(s=>{ const w=clamp(Math.round(81+(s-avg)*2.4+gauss()*5),52,112); return [w,162-w]; });
  for (const p of G.players) if (p.tm>=0 && p.cur){ const [w]=G.stand[p.tm]; if (p.pos==='SP'){ p.cur[3]=Math.round(p.cur[1]*clamp(0.3+(w-81)/300+(p.ab-55)*0.006,0.1,0.75)); p.cur[4]=Math.max(0,Math.round(p.cur[1]*0.62)-p.cur[3]); } }
  endSeason(yr);
}
function fastHitLine(p, share, yr){
  const ab0 = p.ab + gauss()*4;
  const G_ = Math.round(158*share), AB = Math.round(G_*3.85);
  const H = Math.max(0, Math.round(AB*trueAvg(ab0) + gauss()*Math.sqrt(AB*0.2)));
  const HR = Math.max(0, Math.round(AB*hrRate(p,ab0) + gauss()*Math.sqrt(AB*hrRate(p,ab0))));
  const D = Math.round(H*0.2), BB=Math.round(AB*(0.055+ab0*0.0006)), SB=Math.round(G_*p.spd*0.18*(ab0/80));
  return [G_, AB, H, Math.min(HR,H), Math.round(HR*1.7+H*0.28+gauss()*4), SB, BB, D];
}
function fastPitLine(p, share, starter, closer){
  const ab0=p.ab+gauss()*4;
  if (starter){ const GS=Math.round(32*share); const outs=Math.round(GS*(15+ab0*0.07)); const ER=Math.round(trueERA(ab0)*outs/27+gauss()*3); return [GS,GS,outs,0,0,Math.round(outs/3*kRate(ab0)),Math.max(0,ER),0]; }
  const Gm=Math.round(62*share), outs=Math.round(Gm*3.1), ER=Math.max(0,Math.round(trueERA(ab0)*0.9*outs/27+gauss()*2));
  return [Gm,0,outs,ri(1,6),ri(1,5),Math.round(outs/3*kRate(ab0)*1.12), ER, closer?Math.round(Gm*0.55*share):ri(0,3)];
}

// ---- end of season: awards, champion, archive lines ----
function playoffChampion(){
  const byL=[0,1].map(l=>TEAMS_DEF.map((t,i)=>i).filter(i=>i%2===l).sort((a,b)=>winPct(b)-winPct(a)).slice(0,4));
  const series=(a,b)=>{ const pa=0.5+(winPct(a)-winPct(b))*1.2; let wa=0,wb=0; while(wa<4&&wb<4){ if(R()<pa) wa++; else wb++; } return wa===4?a:b; };
  const lc = byL.map(s=>series(series(s[0],s[3]),series(s[1],s[2])));
  return [series(lc[0],lc[1]), lc];
}
function winPct(ti){ const s=G.stand[ti]; return (s[0]+s[1])? s[0]/(s[0]+s[1]) : 0.5; }
function awardCandidates(yr){
  return G.players.filter(p=>p.tm>=0 && p.cur).map(p=>({p, v:seasonValue(p,p.cur)})).sort((a,b)=>b.v-a.v);
}
function giveAward(p, yr, code){ p.aw.push([yr, code]); (G.awards[yr]=G.awards[yr]||[]).push([code, p.id, p.tm%2]); }
function endSeason(yr, live){
  // awards (per league)
  const c = awardCandidates(yr);
  for (let l=0;l<2;l++){
    const L = c.filter(x=>x.p.tm%2===l);
    const mvp = L[0]; if (mvp) { giveAward(mvp.p, yr, 'MVP'); mvp.p.pop=clamp(mvp.p.pop+0.14,0,1); if(live) bumpHype(mvp.p,0.28); }
    const ace = L.filter(x=>x.p.pos==='SP' && x.p!==mvp.p)[0] || L.filter(x=>x.p.pos==='SP')[0]; if (ace){ giveAward(ace.p, yr,'ACE'); ace.p.pop=clamp(ace.p.pop+0.1,0,1); if(live) bumpHype(ace.p,0.2); }
    const roy = L.filter(x=>x.p.dy===yr)[0]; if (roy){ giveAward(roy.p, yr,'ROY'); roy.p.pop=clamp(roy.p.pop+0.1,0,1); if(live) bumpHype(roy.p,0.3); }
    if (!live) L.slice(0,16).forEach(x=>{ if(!x.p.aw.some(a=>a[0]===yr&&a[1]==='AS')){ giveAward(x.p,yr,'AS'); x.p.pop=clamp(x.p.pop+0.03,0,1);} });
  }
  if (!live){ const [ch]=playoffChampion(); G.champs[yr]=ch; for(const p of roster(ch)){ p.aw.push([yr,'CH']); p.pop=clamp(p.pop+0.02,0,1);} }
  archiveSeason(yr);
}
function archiveSeason(yr){
  for (const p of G.players){ if (p.cur && (p.cur[0]>0)){ p.car[yr]={t:p.tm, s:p.cur}; p.war+=seasonValue(p,p.cur); } p.cur=null; }
}

// ---- offseason ----
function offseason(yr, live){
  const nextAge = p=> yr+1-p.by;
  for (const p of G.players){
    if (p.tm===-2) continue;
    const age=nextAge(p);
    if (age<=26){
      p.ab += (p.pot-p.ab)*rf(0.1,0.38) + gauss()*2.2;
      p.pot += gauss()*3;
      if (age>=21 && p.pot-p.ab>12 && R()<0.1){ p.pot -= rf(8,20); p._bust=1; }
      if (R()<0.05){ p.ab+=rf(4,9); p.pot+=rf(3,8); }
    } else if (age<=30) p.ab += gauss()*2.4;
    else if (age<=33) p.ab -= rf(0,2.8) - gauss()*1.4;
    else p.ab -= rf(1.5,4.5) + (age-34)*0.8 + gauss()*1.6;
    p.ab = clamp(Math.round(p.ab), 18, 99); p.pot=clamp(Math.round(Math.max(p.pot,p.ab)),p.ab,99);
    p.fm=0; p.inj=0; p.rp=0;
    // retirement
    if (p.tm>=0 || p.tm===-3){
      if (age>=41 || (age>=34 && (p.ab<54 || R()<(age-33)*0.1)) || (p.tm===-3 && R()<0.45)){
        p.tm=-2; p.ry=yr;
        if (live && (p.war>18 || p.pop>0.35)) addNews(`${pname(p).toUpperCase()} ANNOUNCES RETIREMENT`, `${pname(p)} walks away after ${yr-p.dy+1} seasons. Collectors are reassessing his place in history.`, p.id, 'retire');
        if (live) bumpHype(p, p.war>40?0.12:0.03);
      }
    } else if (p.tm===-1 && (age>=27 || (age>=24 && p.pot<52))){ p.tm=-2; p.ry=yr; p._faded=1; }
  }
  // free agency / trades: ~10% move
  const actives = G.players.filter(p=>p.tm>=0);
  for (const p of actives){ if (R()<0.1){ const old=p.tm; p.tm=ri(0,29); if(p.tm===old) p.tm=(old+ri(1,29))%30; p.org=p.tm; if(live && p.S>0.7) addNews(`${pname(p).toUpperCase()} SIGNS WITH ${TEAMS_DEF[p.tm][1].toUpperCase()}`, `The ${TEAMS_DEF[p.tm][0]} land a marquee name in free agency.`, p.id,'trade'); } }
  // ensure roster sizes (12 hitters, 10 pitchers) using free agents / fillers
  const fa = G.players.filter(p=>p.tm===-3);
  TEAMS_DEF.forEach((T,ti)=>{
    let r=roster(ti); let h=r.filter(p=>!isPitcher(p)), pp=r.filter(isPitcher);
    while (h.length>13){ const x=h.sort((a,b)=>a.ab-b.ab).shift(); x.tm=-3; }
    while (pp.length>11){ const x=pp.sort((a,b)=>a.ab-b.ab).shift(); x.tm=-3; }
    const need=(isP,n)=>{ for(let k=0;k<n;k++){ const i=fa.findIndex(p=>isPitcher(p)===isP && p.tm===-3); if(i>=0){ fa[i].tm=ti; fa[i].org=ti; fa.splice(i,1);} else { const age=ri(23,27); const ab=rf(44,55); const q=newPlayer({pos:isP?(R()<0.5?'SP':'RP'):pick(HIT_POS.slice(0,9)), by:yr+1-age, tm:-1, org:ti, ab, pot:ab+rf(0,7), dy:0}); q._filler=1; q.tm=ti; q.dy=yr+1; } } };
    need(false, 12-h.length); need(true, 10-pp.length);
    const sp=roster(ti).filter(p=>p.pos==='SP'); if (sp.length<5){ roster(ti).filter(p=>p.pos==='RP').sort((a,b)=>b.ab-a.ab).slice(0,5-sp.length).forEach(p=>p.pos='SP'); }
  });
}
function newYear(yr, live){
  // draft + rookie class
  TEAMS_DEF.forEach((T,ti)=>{ for(let k=0;k<3;k++) makeProspect(ti, yr); });
  const pros = G.players.filter(p=>p.tm===-1 && p.dy===0);
  const ready = pros.filter(p=> p.ab>=47 || (yr-p.by>=24 && p.ab>=43)).sort((a,b)=>(b.ab+b.pot*0.3)-(a.ab+a.pot*0.3)).slice(0,42);
  const fillers = G.players.filter(p=>p.dy===yr && p.tm>=0 && p._filler);
  const open=dateToDay(yr,4,1);
  ready.forEach((p,i)=>{ p.dy=yr; p.dd = R()<0.6 ? open : open+ri(20,170); if (i<3 && live) addNews(`${pname(p).toUpperCase()} HEADLINES ${yr} ROOKIE CLASS`, `Scouts rank the ${TEAMS_DEF[p.org][1]} ${p.pos} among the most promising young players in the game.`, p.id, 'prospect'); });
  G.rookieClass[yr] = ready.map(p=>p.id).concat(fillers.map(p=>p.id));
  if (live){ // Hall of Honor
    const cands = G.players.filter(p=>p.tm===-2 && p.ry && yr-p.ry===5 && p.war>52 && !p.aw.some(a=>a[1]==='HOH'));
    for (const p of cands){ p.aw.push([yr,'HOH']); p.pop=clamp(p.pop+0.1,0,1); bumpHype(p,0.3); addNews(`${pname(p).toUpperCase()} ELECTED TO THE HALL OF HONOR`, `A career worth remembering. Collectors of his era may take notice.`, p.id, 'award'); }
  }
}
function promote(p, t, silent){
  p.tm = p.org; if (!p.dy) p.dy=yearOf(t); p.dd=0;
  const r=roster(p.tm); const same=r.filter(x=>isPitcher(x)===isPitcher(p) && x!==p && x.dy!==yearOf(t));
  if (r.length>24 && same.length){ const cut=same.sort((a,b)=>a.ab-b.ab)[0]; cut.tm=-3; }
  if (!silent && (p.pot>=72 || p.S>0.5)) { addNews(`TOP PROSPECT ${pname(p).toUpperCase()} CALLED UP`, `The ${TEAMS_DEF[p.tm][1]} promote their ${p.pos}. First big-league at-bats could come this week.`, p.id, 'callup'); bumpHype(p, 0.06+Math.max(0,p.pot-75)/150); }
}

// ---- daily (live) simulation ----
function seasonDates(yr){ return { open:dateToDay(yr,4,1), asb:dateToDay(yr,7,14), deadline:dateToDay(yr,7,31), end:dateToDay(yr,9,27), champ:dateToDay(yr,10,26), awards:dateToDay(yr,11,10), off:dateToDay(yr,11,20), fa:dateToDay(yr,12,6), ny:dateToDay(yr,1,12) }; }
function inSeason(t){ const d=seasonDates(yearOf(t)); return t>=d.open && t<=d.end; }
function bumpHype(p, x){ p.hy = clamp(p.hy + x, -0.35, 0.6); }
function addNews(h, b, pid, k){ G.news.unshift({t:G.day, h, b, p:pid, k}); if (G.news.length>320) G.news.length=320; }

function simLeagueDay(t){
  const yr=yearOf(t), d=seasonDates(yr);
  if (t===d.ny) newYear(yr, true);
  if (t===d.open){ G.stand=TEAMS_DEF.map(()=>[0,0]); for(const p of G.players){ if(p.tm>=0) p.cur=emptyLine(p); } }
  // call-ups by scheduled debut date
  for (const p of G.players){ if (p.dd && p.dd===t && p.tm===-1){ promote(p,t,t===d.open); p.cur=emptyLine(p); } }
  if (t===d.open){ const top=(G.rookieClass[yr]||[]).map(P).filter(p=>p.tm>=0).sort((a,b)=>b.pot-a.pot).slice(0,2); top.forEach(p=>{ addNews(`${pname(p).toUpperCase()} MAKES OPENING DAY ROSTER`, `The ${TEAMS_DEF[p.tm][1]} will start the season with their top young ${p.pos} in the majors.`, p.id,'callup'); bumpHype(p,0.08); }); addNews(`OPENING DAY: THE ${yr} SEASON BEGINS`, `Thirty clubs, one hundred sixty-two games. Rookie cards are about to find out who they belong to.`, null,'league'); }
  // daily player state
  for (const p of G.players){
    if (p.tm===-2) { p.hy*=0.99; continue; }
    p.fm = p.fm*0.965 + gauss()*1.1;
    p.hy *= 0.986;
    if (p.inj>0){ p.inj--; if (p.inj===0 && p.tm>=0 && p.S>0.45) addNews(`${pname(p).toUpperCase()} ACTIVATED FROM INJURED LIST`, `He's back in the lineup plans for the ${TEAMS_DEF[p.tm][1]}.`, p.id,'inj'); }
  }
  if (t>=d.open && t<=d.end){
    if (t!==d.asb-1 && t!==d.asb && t!==d.asb+1 && dowOf(t)!==4) playGames(t);
    // injuries
    for (const p of G.players){ if (p.tm>=0 && p.inj===0 && R()<0.0011*(1+Math.max(0,ageOf(p,t)-32)*0.08)){
      p.inj = R()<0.6? ri(10,25) : ri(30,110);
      bumpHype(p, p.inj>40?-0.14:-0.06); p.fm-=2;
      if (p.S>0.45 || (p.dy===yr && p.pot>70)) addNews(`${pname(p).toUpperCase()} PLACED ON INJURED LIST`, p.inj>40?`Early word is it could be a long absence. Speculators may cool on him.`:`Expected to miss a few weeks.`, p.id,'inj');
    } }
    if (dowOf(t)===0) weeklyReview(t);
  }
  if (t===d.asb){ // all-stars
    const c=awardCandidates(yr);
    for(let l=0;l<2;l++) c.filter(x=>x.p.tm%2===l).slice(0,16).forEach(x=>{ giveAward(x.p,yr,'AS'); x.p.pop=clamp(x.p.pop+0.03,0,1); bumpHype(x.p, x.p.dy===yr?0.1:0.04); });
    const rk=c.filter(x=>x.p.dy===yr && x.p.aw.some(a=>a[0]===yr&&a[1]==='AS'));
    addNews(`ALL-STAR ROSTERS ANNOUNCED`, rk.length?`${rk.map(x=>pname(x.p)).join(', ')} ${rk.length>1?'are':'is'} among the rookie selections.`:`No rookies made the cut this year.`, rk[0]?rk[0].p.id:null,'award');
  }
  if (t===d.deadline){ // trade deadline moves
    const sellers=TEAMS_DEF.map((x,i)=>i).sort((a,b)=>winPct(a)-winPct(b)).slice(0,6), buyers=TEAMS_DEF.map((x,i)=>i).sort((a,b)=>winPct(b)-winPct(a)).slice(0,6);
    sellers.forEach((s,i)=>{ const vet=roster(s).filter(p=>ageOf(p,t)>=29 && p.inj===0).sort((a,b)=>b.ab-a.ab)[0]; if(vet){ vet.tm=buyers[i]; vet.org=buyers[i]; if (vet.S>0.35) addNews(`DEADLINE DEAL: ${pname(vet).toUpperCase()} TRADED TO ${TEAMS_DEF[buyers[i]][1].toUpperCase()}`, `A contender adds a proven ${vet.pos} for the stretch run.`, vet.id,'trade'); } });
  }
  if (t===d.end){ addNews('REGULAR SEASON COMPLETE', 'Eight clubs move on to the postseason.', null, 'league'); }
  if (t===d.champ){ const [ch,lc]=playoffChampion(); G.champs[yr]=ch; for(const p of roster(ch)){ p.aw.push([yr,'CH']); p.pop=clamp(p.pop+0.03,0,1); bumpHype(p,0.1); }
    const hero=roster(ch).sort((a,b)=>(b.S||0)-(a.S||0))[0];
    addNews(`${TEAMS_DEF[ch][0].toUpperCase()} ${TEAMS_DEF[ch][1].toUpperCase()} WIN THE CHAMPIONSHIP`, `They beat the ${TEAMS_DEF[lc[0]===ch?lc[1]:lc[0]][1]} in the final series. ${hero?pname(hero)+' was front and centre in the celebration.':''}`, hero?hero.id:null,'award'); if(hero) bumpHype(hero,0.15); }
  if (t===d.awards){ endSeason(yr, true); const aw=(G.awards[yr]||[]);
    for (const [code,pid] of aw){ if (code==='AS') continue; const p=P(pid); const nm={MVP:'MOST VALUABLE PLAYER',ACE:'THE ACE AWARD',ROY:'ROOKIE OF THE YEAR'}[code]; if(nm) addNews(`${pname(p).toUpperCase()} WINS ${nm}`, code==='ROY'?`Rookie card demand could follow.`:`A career-defining season for the ${teamAbbr(p.tm)} ${p.pos}.`, pid,'award'); } }
  if (t===d.off) offseason(yr, true);
}

function lineupOf(ti){
  const r=roster(ti).filter(p=>p.inj===0);
  const hit=r.filter(p=>!isPitcher(p)).sort((a,b)=>(b.ab+b.fm)-(a.ab+a.fm));
  const sp=r.filter(p=>p.pos==='SP').sort((a,b)=>b.ab-a.ab).slice(0,5);
  const rp=r.filter(p=>p.pos==='RP').sort((a,b)=>b.ab-a.ab);
  return {hit, sp, rp};
}
function playGames(t){
  const yr=yearOf(t); const order=shuffle(TEAMS_DEF.map((x,i)=>i));
  const L = order.map(ti=>lineupOf(ti));
  const lu={}; order.forEach((ti,i)=>lu[ti]=L[i]);
  for (let g=0; g<15; g++){
    const A=order[g*2], B=order[g*2+1];
    const sa = startPitcher(A, lu[A]), sb = startPitcher(B, lu[B]);
    const ra = batTeam(A, lu[A], sb, t), rb = batTeam(B, lu[B], sa, t);
    let runsA=ra.runs, runsB=rb.runs; if (runsA===runsB){ if (R()<0.5+( (sa?sa.ab:50)-(sb?sb.ab:50))*0.005) runsA++; else runsB++; }
    const aw = runsA>runsB;
    G.stand[A][aw?0:1]++; G.stand[B][aw?1:0]++;
    pitchSide(sa, lu[A], runsB, aw, runsA-runsB, t);
    pitchSide(sb, lu[B], runsA, !aw, runsB-runsA, t);
  }
}
function startPitcher(ti, lu){ if (!lu.sp.length) return lu.rp[0]||null; const p=lu.sp[G.rot[ti]%lu.sp.length]; G.rot[ti]++; return p; }
function batTeam(ti, lu, opp, t){
  const yr=yearOf(t); let H=0,HR=0,BB=0,D=0; const oppAb = opp? opp.ab+opp.fm : 50;
  const nine = lu.hit.slice(0,9); const bench=lu.hit.slice(9);
  const players = nine.concat(bench.filter(()=>R()<0.2));
  for (const p of players){
    if (!p.cur) p.cur=emptyLine(p);
    const starter = nine.includes(p);
    const abN = starter ? (R()<0.55?4:(R()<0.6?3:5)) : 1;
    const eff = p.ab + p.fm;
    const pH = clamp(trueAvg(eff) - (oppAb-55)*0.0011, 0.12, 0.42);
    const pHRgivenH = clamp(hrRate(p,eff)/trueAvg(eff), 0.02, 0.4);
    let h=0,hr=0,d=0;
    for (let k=0;k<abN;k++){ if (R()<pH){ h++; if (R()<pHRgivenH) hr++; else if (R()<0.22) d++; } }
    const bb = R()<(0.08+eff*0.0009)*(starter?1:0.3) ? 1 : 0;
    const sb = bb+h-hr>0 && R()<p.spd*0.06 ? 1 : 0;
    const rbi = hr + (h-hr>0 && R()<0.35 ? ri(1,2):0) + (hr && R()<0.5?ri(1,2):0);
    const c=p.cur; c[0]++; c[1]+=abN; c[2]+=h; c[3]+=hr; c[4]+=rbi; c[5]+=sb; c[6]+=bb; c[7]+=d;
    H+=h; HR+=hr; BB+=bb; D+=d;
    const perf = (h - abN*trueAvg(p.ab))*0.6 + hr*0.8 + bb*0.2;
    p.rp = p.rp*0.93 + perf*0.07;
    gameEvents(p, {h, hr, rbi, ab:abN}, t);
  }
  const runs = Math.max(0, Math.round(H*0.36 + HR*0.95 + BB*0.22 + D*0.22 + gauss()*1.1 - 0.4));
  return {runs};
}
function pitchSide(sp, lu, runsAllowed, won, margin, t){
  if (!sp) return;
  if (!sp.cur) sp.cur=emptyLine(sp);
  const eff=sp.ab+sp.fm;
  let outs = sp.pos==='SP' ? clamp(Math.round(14+(eff-50)*0.12+gauss()*3.2),4,27) : 3;
  if (runsAllowed>=7) outs=Math.min(outs, ri(6,14));
  const er = Math.min(runsAllowed, Math.round(runsAllowed*outs/27*1.15));
  const k = poisson(outs/3*kRate(eff));
  const c=sp.cur; c[0]++; c[1]+= sp.pos==='SP'?1:0; c[2]+=outs; c[5]+=k; c[6]+=er;
  if (won && outs>=15) c[3]++; else if (!won && er>=runsAllowed*0.5 && runsAllowed>0) c[4]++;
  const perf = (outs/27*trueERA(sp.ab) - er)*0.5 + (k - outs/3*kRate(sp.ab))*0.15;
  sp.rp = sp.rp*0.8 + perf*0.2;
  // relievers
  const rOuts = 27-outs; let left=rOuts; const pen=lu.rp.slice();
  if (won && margin<=3 && pen[0] && R()<0.85){ const cl=pen.shift(); if(!cl.cur) cl.cur=emptyLine(cl); cl.cur[0]++; cl.cur[2]+=3; cl.cur[7]++; cl.cur[5]+=poisson(1.1); left-=3; cl.rp=cl.rp*0.9+0.1*0.3; }
  while (left>0 && pen.length){ const r=pen.splice(ri(0,pen.length-1),1)[0]; if(!r.cur) r.cur=emptyLine(r); const o=Math.min(left, ri(2,6)); r.cur[0]++; r.cur[2]+=o; r.cur[5]+=poisson(o/3*kRate(r.ab)); const e=R()<0.25?ri(0,2):0; r.cur[6]+=Math.min(e,runsAllowed); left-=o; }
  gameEvents(sp, {outs, er, k}, t);
}
function gameEvents(p, g, t){
  const yr=yearOf(t); const nm=pname(p).toUpperCase(); const notable = p.S>0.55 || p.dy===yr || p.pot>=78;
  if (p.cur && p.cur[0]===1 && p.dy===yr){
    if (g.hr){ addNews(`${nm} HOMERS IN BIG-LEAGUE DEBUT`, `A memorable first game for the ${TEAMS_DEF[p.tm][1]} rookie. Collector interest is stirring.`, p.id,'perf'); bumpHype(p, 0.12+Math.max(0,p.pot-70)/200); }
    else if (g.k>=8){ addNews(`${nm} STRIKES OUT ${g.k} IN DEBUT`, `An electric first start.`, p.id,'perf'); bumpHype(p, 0.12); }
    else if (p.pot>=74) addNews(`${nm} MAKES HIS DEBUT`, `${g.h!=null? g.h+'-for-'+g.ab+' in his first game.' : Math.floor(g.outs/3)+' innings in his first start.'}`, p.id,'perf');
    return;
  }
  if (g.hr>=2 || (g.h>=4) || (g.rbi>=5)){ bumpHype(p, 0.035); if (notable && (g.hr>=2 && R()<0.6 || g.hr>=3)) addNews(`${nm} ${g.hr>=3?'HITS THREE HOME RUNS':g.hr===2?'HOMERS TWICE':'GOES '+g.h+'-FOR-'+g.ab}`, `${g.rbi} RBI in a ${TEAMS_DEF[p.tm][1]} game. ${p.dy===yr?'The rookie keeps turning heads.':''}`, p.id,'perf'); }
  if (g.outs===27 && g.er===0){ if (R()<0.12){ bumpHype(p,0.3); p.pop=clamp(p.pop+0.04,0,1); addNews(`NO-HITTER! ${nm} MAKES HISTORY`, `The ${TEAMS_DEF[p.tm][1]} ${p.pos} completes the rarest of feats. Expect collectors to hunt his cards.`, p.id,'perf'); } else { bumpHype(p,0.06); if(notable) addNews(`${nm} TOSSES A SHUTOUT`, `${g.k} strikeouts in a complete game.`, p.id,'perf'); } }
  else if (g.k>=12){ bumpHype(p,0.05); if(notable) addNews(`${nm} STRIKES OUT ${g.k}`, `A dominant outing.`, p.id,'perf'); }
  // milestones
  const ct = careerTotals(p);
  const checks = isPitcher(p)? [[3,[150,200,250,300],'WINS'],[5,[2000,2500,3000,3500],'STRIKEOUTS']] : [[3,[300,400,500,600],'HOME RUNS'],[2,[2000,2500,3000],'HITS']];
  for (const [idx, marks, label] of checks) for (const m of marks){ if (ct[idx]>=m && !p.ms[idx+':'+m]){ p.ms[idx+':'+m]=1; if (G.live){ const big = m>= (idx===3&&!isPitcher(p)?500: idx===2?3000: idx===3?300: 3000); bumpHype(p, big?0.32:0.14); p.pop=clamp(p.pop+(big?0.1:0.04),0,1); addNews(`${nm} REACHES ${m} CAREER ${label}`, big?`A historic milestone. A new wave of collectors is paying attention to his older cards.`:`Another marker on a strong career.`, p.id,'milestone'); } } }
}
function weeklyReview(t){
  const yr=yearOf(t);
  const act=G.players.filter(p=>p.tm>=0 && p.cur && p.cur[0]>3);
  for (const p of act){ bumpHype(p, clamp(p.rp*0.05,-0.03,0.05)); }
  for (let l=0;l<2;l++){ const best=act.filter(p=>p.tm%2===l).sort((a,b)=>b.rp-a.rp)[0]; if(best){ bumpHype(best,0.05); if(R()<0.6) addNews(`${pname(best).toUpperCase()} NAMED ${LEAGUES[l].toUpperCase()} PLAYER OF THE WEEK`, `${lineStr(best,best.cur)} on the season.`, best.id,'perf'); } }
  // slump story
  const slump=act.filter(p=>p.S>0.6 && p.rp< -0.25).sort((a,b)=>a.rp-b.rp)[0];
  if (slump && R()<0.5){ bumpHype(slump,-0.05); addNews(`${pname(slump).toUpperCase()} MIRED IN A SLUMP`, `Rough weeks for one of the hobby's favourite names.`, slump.id,'perf'); }
}
function prospectRank(){
  return G.players.filter(p=>p.tm===-1 || (p.dy===yearOf(G.day) && p.tm>=0 && (!p.cur || p.cur[1]<130 && p.cur[2]<150)))
    .map(p=>({p, v:p.pot*0.72+p.ab*0.35-(ageOf(p)-19)*0.8})).sort((a,b)=>b.v-a.v).slice(0,100).map(x=>x.p);
}
