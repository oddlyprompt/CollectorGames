const PACK={ id:'sports', title:'Sports Card Collector', tagline:'Rip packs, dig bins, grade, flip. A whole fictional baseball hobby.', accent:'#c0392b', about:'Every team, player, brand and grading company is fictional, and the league plays itself.',
  worlds:{sports:true, comics:false, tcg:false}, tabs:[['home','Home'],['shop','Cards'],['hunt','Hunt'],['market','Market'],['coll','Collection']], homeTab:'home', scenarios:['classic','pocket','storage','fan','windfall'], bootMsg:'Founding a league', slotName:'My collection', three:'vendor/three.min.js', sub:{coll:'cards'} };

// which game is this? PACK is defined by the build; the engine asks instead of assuming
function packHas(w){ return typeof PACK==='undefined' || !PACK.worlds || PACK.worlds[w]!==false; }
function packId(){ return typeof PACK==='undefined'? 'all' : PACK.id; }
// ===================== CORE =====================
var G = null; // the whole persisted game state
const DAY0 = Date.UTC(2020, 0, 1);
const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function dayToDate(t){ return new Date(DAY0 + t*86400000); }
function dateToDay(y,m,d){ return Math.round((Date.UTC(y,m-1,d)-DAY0)/86400000); }
let _yc=-1,_yv=0; function yearOf(t){ if (t===_yc) return _yv; _yc=t; _yv=dayToDate(t).getUTCFullYear(); return _yv; }
function mdOf(t){ const d=dayToDate(t); return [d.getUTCMonth()+1, d.getUTCDate()]; }
function dowOf(t){ return dayToDate(t).getUTCDay(); }
function fmtDate(t, withYear){ const d=dayToDate(t); return MON[d.getUTCMonth()]+' '+d.getUTCDate()+(withYear?', '+d.getUTCFullYear():''); }

// Serializable RNG (state lives in G.rs so reloads continue the same stream)
function worldRnd(){ const s=G.rs=(G.rs+0x6D2B79F5)|0; let t=Math.imul(s^s>>>15,1|s); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }
function mkRng(seed){ let s=seed|0; return function(){ s=(s+0x6D2B79F5)|0; let t=Math.imul(s^s>>>15,1|s); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function hashStr(str){ let h=2166136261; for(let i=0;i<str.length;i++){ h^=str.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; }
var R = worldRnd;
function withRng(rng, fn){ const old=R; R=rng; try { return fn(); } finally { R=old; } }
function ri(a,b){ return a+Math.floor(R()*(b-a+1)); }
function rf(a,b){ return a+R()*(b-a); }
function pick(a){ return a[Math.floor(R()*a.length)]; }
function chance(p){ return R()<p; }
function gauss(){ let u=0; while(u===0) u=R(); const v=R(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); }
function clamp(x,a,b){ return x<a?a:x>b?b:x; }
function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(R()*(i+1)); const t=a[i]; a[i]=a[j]; a[j]=t; } return a; }
function poisson(l){ if(l<=0) return 0; if(l>30) return Math.max(0,Math.round(l+gauss()*Math.sqrt(l))); const L=Math.exp(-l); let k=0,p=1; do{ k++; p*=R(); } while(p>L); return k-1; }
function wpick(items, wf){ let tot=0; for(const it of items) tot+=wf(it); let x=R()*tot; for(const it of items){ x-=wf(it); if(x<=0) return it; } return items[items.length-1]; }
function median(a){ if(!a.length) return 0; const s=a.slice().sort((x,y)=>x-y); const m=s.length>>1; return s.length%2?s[m]:(s[m-1]+s[m])/2; }
function gcd(a,b){ while(b){ const t=b; b=a%b; a=t; } return a; }

function money(x, cents){
  if (x==null || isNaN(x)) return '—';
  const neg = x<0; x=Math.abs(x);
  let s;
  if (cents || x<10) s = x.toFixed(2);
  else if (x<1000) s = Math.round(x).toString();
  else s = Math.round(x).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return (neg?'−$':'$')+s;
}
// round an estimate to a "human" price
function nicePrice(x){
  if (x<2) return Math.round(x*20)/20;
  if (x<20) return Math.round(x*2)/2;
  if (x<100) return Math.round(x);
  if (x<1000) return Math.round(x/5)*5;
  if (x<10000) return Math.round(x/25)*25;
  return Math.round(x/100)*100;
}
function esc(s){ return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

const FIRST = ['Malik','Tyler','Jonathan','Diego','Hiro','Marcus','Caleb','Luis','Andre','Owen','Mateo','Jalen','Brady','Colton','Rafael','Kenji','Darius','Elias','Tomas','Julian','Wyatt','Grant','Cody','Reid','Nolan','Emilio','Andres','Tavion','Brooks','Quinn','Isaiah','Xavier','Dominic','Carlos','Eduardo','Yuto','Ramon','Silas','Dante','Everett','Bennett','Harrison','Jorge','Kai','Leon','Micah','Nico','Oscar','Pablo','Rhett','Sergio','Theo','Victor','Wes','Zane','Aaron','Brandon','Cristian','Devin','Ezra','Felix','Gavin','Hector','Ivan','Jace','Kellan','Lucas','Manny','Nate','Orlando','Preston','Rowan','Santiago','Trent','Uriel','Vance','Warren','Yadiel','Zeke','Anders','Beau','Cruz','Desmond','Emmett','Fletcher','Gio','Holden','Ignacio','Jonah','Knox','Landon','Marco','Nash','Omar','Paxton','Rico','Sawyer','Tobias','Wilmer','Yoel','Adrian','Bryce','Chase','Deacon','Enzo','Ford','Graham','Hayes','Joaquin','Kaden','Lorenzo','Miles','Nestor','Reuben','Soren','Tate','Ulises','Wade'];
const LAST = ['Bannon','Gomez','Reyes','Hollis','Varga','Okafor','Castellano','Whitlock','Dunmore','Pryce','Salcedo','Lindqvist','Tanaka','Morrow','Achterberg','Quintero','Fairbanks','Delacroix','Ashby','Kowalczyk','Ferreira','Halvorsen','Mendez','Rourke','Sato','Kimura','Oduya','Pemberton','Vance','Cordero','Blackwood','Esposito','Nakamura','Thorne','Valdez','Wexler','Ybarra','Zielinski','Abernathy','Barrios','Calloway','Dvorak','Espinal','Fontaine','Gallardo','Harlow','Iglesias','Jansen','Kessler','Lozano','Maddox','Navarro','Ocampo','Paredes','Quill','Rasmussen','Serrano','Tillman','Urena','Villalobos','Winslow','Yates','Zamora','Aldana','Brandt','Cisneros','Draper','Figueroa','Grady','Hendricks','Irving','Jaramillo','Keane','Lachance','Marchetti','Nieves','Orozco','Pacheco','Radcliffe','Solano','Tremblay','Underhill','Vasquez','Waverly','Acevedo','Beckett','Crowder','Duval','Ellery','Forsythe','Gutierrez','Haddock','Imai','Jessup','Kincaid','Larkin','Montero','Olmstead','Prentiss','Rinaldi','Stroud','Talbot','Vickers','Whitfield','Aranda','Bellweather','Corbin','Dellinger','Esquivel','Fenwick','Galloway','Hargrove','Ivers','Jennings','Kerrigan','Lomax','Mercado','Norwood','Ostrander','Pelletier','Quiroga','Ridley','Thibodeaux','Ulloa','Varnell','Whitaker','Yarbrough','Arriaga','Bodine','Cavanaugh','Darrow','Everly','Farris','Goodwin','Hatcher','Ingram','Joyner','Kearns','Lister','Mayfield','Nunez','Ormsby','Pruitt','Rhodes','Sheffield','Toussaint','Vail','Wendt','Obregon','Castillo','Moreau','Sandoval','Petrakis','Brennan','Loughlin','Oyelaran','Szabo','Tavares','Voss','Kagawa','Albright','Dorsey','Estrada','Huxley','Ruelas','Strand','Maroney'];
const HANDLES_A = ['diamond','slab','rookie','wax','chrome','cardboard','gem','hobby','pack','sealed','prospect','vintage','pc','hitter','bullpen','dugout','mint','centering','refractor','ace','grand','clubhouse','bleacher','ink','foil','dealer','flip','binder','set','sweetspot'];
const HANDLES_B = ['hunter','king','vault','kid','shack','dad','collects','breaks','guy','cards','stash','depot','den','hoarder','junkie','lab','club','queen','flips','trader','haus','nerd','co','pulls','box','files'];

// ===================== CARD-GAME LINES: THE REGISTRY =====================
// A "line" is one trading card franchise in the card-game world (Wildkin, Tidemark, later Rift Parade). Shared code (the journal, the grading reveal,
// the news filters, the boot upgrade) asks this registry which line an item, key or news item belongs to instead of hard-coding letters.
// Lines register themselves at the end of their own boot file. In the sports and comics builds the registry stays empty.
//   kind       the item letter used by objFor, grading returns and the journal ('t' Wildkin, 'x' Tidemark; 'c' cards and 'm' comics are not lines)
//   keyPrefix  first character of a print key ('T|1|5|N')
//   news       the kind of this line's news items
//   openAct    the ACT that opens one of its copies
//   has()      does this save contain the line's world yet
//   copies()   all copy objects, mine() the player's, value(copy), label(copy), mini(copy), submit(id), crack(id)
//   upgrade(progress), boot {at, span, msg}   builds the world when an older save is opened
const CARD_LINES=[];
function registerCardLine(L){ CARD_LINES.push(L); return L; }
const cardLineOfKind=k=>CARD_LINES.find(l=>l.kind===k)||null;
const cardLineOfKey=key=>CARD_LINES.find(l=>l.keyPrefix===key[0])||null;
const isCardGameKind=k=>!!cardLineOfKind(k);
const isCardGameNews=k=>CARD_LINES.some(l=>l.news===k);
// the ACT that opens a copy of this kind: a line's own, comics, or a baseball card
function copyAct(k){ const L=cardLineOfKind(k); return L? L.openAct : k==='m'? 'ccopy' : 'card'; }

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

// the comics and Wildkin builds run no league: same empty containers the rest of the engine expects, nothing in them
function initNoLeague(){ G.players=[]; G.names={}; G.stand=TEAMS_DEF.map(()=>[0,0]); G.champs={}; G.awards={}; G.rookieClass={}; G.news=[]; G.rot=TEAMS_DEF.map(()=>0); }
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
  if (!packHas('sports')) return;
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

// ===================== COLLECTIBLE CATEGORIES =====================
// Category registry: each collectible industry plugs in its own subject database,
// product families, design templates and demand model. Phase 1 registers baseball only.
const CATEGORIES = {
  baseball: {
    label: 'Baseball cards',
    subjectName: p => pname(p),
    subjectDemand: p => playerScore(p),
    gradeScale: 10,
  }
};

// Product families (brand lines). Odds are "1 in N packs" at hobby; retail formats use retailMult.
const BRANDS = {
  DIA: { name:'Diamond Baseball', short:'Diamond', prestige:1.0, rel:[2,19], base:320, rc:40, tmpl:'dia', blurb:'The flagship. Big checklist, deep parallel rainbow, the rookie card most collectors think of first.',
    formats:{ pack:{price:6,cards:10,packs:1,retail:1}, blaster:{price:32,cards:10,packs:7,retail:1}, hobby:{price:140,cards:10,packs:24,g:{auto:1,num:1}} },
    par:[{id:'sil',n:'Silver',odds:8,fin:'foil',col:'#b9c1c9'},{id:'blu',n:'Blue',run:199,odds:45,fin:'color',col:'#2459b8'},{id:'pur',n:'Purple',run:99,odds:90,fin:'color',col:'#6a3fa0'},{id:'gld',n:'Gold',run:50,odds:180,fin:'color',col:'#c9a227'},{id:'org',n:'Orange',run:25,odds:360,fin:'color',col:'#e0761c'},{id:'red',n:'Red',run:10,odds:900,fin:'color',col:'#c0282d'},{id:'blk',n:'Black',run:5,odds:1800,fin:'color',col:'#151515'},{id:'sup',n:'Super',run:1,odds:9000,fin:'super',col:'#e8e2c0'}],
    ins:[{n:'Grand Slam Legends',size:15,odds:12,focus:'legends'},{n:'Future Stars',size:25,odds:6,focus:'rookies'},{n:'Power Surge',size:20,odds:10,focus:'power'}],
    auto:{n:'Diamond Autographs',odds:60,size:60,par:[{id:'ag',n:'Gold',run:50,share:0.14},{id:'ar',n:'Red',run:10,share:0.04},{id:'a1',n:'Super',run:1,share:0.006}]},
    relic:{n:'Game-Used Jersey',odds:48,size:40}, sp:{odds:64, ssp:600}, caseHit:{n:'Crown Jewels',size:15,odds:320} },
  NAT: { name:'National Series', short:'National', prestige:0.7, rel:[3,18], base:250, rc:25, tmpl:'nat', blurb:'Budget retail. Cheap rips, bright borders, long odds on anything big.',
    formats:{ pack:{price:4,cards:10,packs:1,retail:1}, blaster:{price:20,cards:10,packs:7,retail:1} },
    par:[{id:'sil',n:'Silver',odds:6,fin:'foil',col:'#b9c1c9'},{id:'grn',n:'Green',run:150,odds:70,fin:'color',col:'#23865a'},{id:'red',n:'Red',run:25,odds:450,fin:'color',col:'#c0282d'},{id:'plt',n:'Printing Plate',run:1,odds:7000,fin:'plate',col:'#1f6fb2'}],
    ins:[{n:'Hometown Heroes',size:20,odds:6,focus:'stars'},{n:'Rookie Rush',size:15,odds:8,focus:'rookies'}],
    auto:{n:'National Signatures',odds:420,size:30,par:[]}, relic:{n:'Stadium Swatches',odds:260,size:20}, sp:null, caseHit:null },
  HER: { name:'Heritage Club', short:'Heritage', prestige:0.9, rel:[4,8], base:300, rc:30, tmpl:'her', hiSP:50, blurb:'Retro card stock and a painted look. Collectors chase the short-printed high numbers to finish the set.',
    formats:{ pack:{price:5,cards:9,packs:1,retail:1}, blaster:{price:28,cards:9,packs:8,retail:1}, hobby:{price:100,cards:9,packs:24,g:{auto:1}} },
    par:[{id:'thr',n:'Throwback Stock',odds:14,fin:'stock',col:'#d9c9a3'},{id:'flp',n:'Flip Stock',run:76,odds:130,fin:'stock',col:'#b98c4a'}],
    ins:[{n:'Clubhouse Classics',size:15,odds:12,focus:'legends'},{n:'Box Score',size:20,odds:8,focus:'stars'}],
    auto:{n:'Real Ink',odds:96,size:50,par:[{id:'ar',n:'Red Ink',run:76,share:0.15}]}, relic:{n:'Clubhouse Relics',odds:48,size:30}, sp:null, caseHit:null },
  SPR: { name:'Summit Prospects', short:'Summit', prestige:1.15, rel:[5,13], base:250, pros:150, rc:20, tmpl:'spr', blurb:'Prospect-first. The earliest cards of tomorrow\'s names, and autographs of players who haven\'t debuted yet.',
    formats:{ pack:{price:7,cards:8,packs:1,retail:1}, hobby:{price:150,cards:8,packs:20,g:{auto:2}} },
    par:[{id:'rf',n:'Refractor',odds:4,fin:'refr',col:'#cfd8e3'},{id:'sky',n:'Sky Refractor',run:250,odds:32,fin:'refr',col:'#57a8e0'},{id:'grn',n:'Green Refractor',run:99,odds:80,fin:'refr',col:'#2f9a5d'},{id:'gld',n:'Gold Refractor',run:50,odds:160,fin:'refr',col:'#d4a72c'},{id:'org',n:'Orange Refractor',run:25,odds:320,fin:'refr',col:'#ea7a1c'},{id:'red',n:'Red Refractor',run:5,odds:1600,fin:'refr',col:'#cf2a2a'},{id:'sup',n:'Superfractor',run:1,odds:8000,fin:'super',col:'#e8e2c0'}],
    ins:[{n:'Summit Climbers',size:25,odds:6,focus:'prospects'},{n:'Pinnacle',size:15,odds:15,focus:'stars'}],
    auto:{n:'Prospect Autographs',odds:16,size:80,focus:'prospects',par:[{id:'arf',n:'Refractor',run:499,share:0.25},{id:'ag',n:'Gold Refractor',run:50,share:0.08},{id:'ao',n:'Orange Refractor',run:25,share:0.04},{id:'ar',n:'Red Refractor',run:5,share:0.01},{id:'a1',n:'Superfractor',run:1,share:0.003}]},
    relic:null, sp:null, caseHit:{n:'Peak Performers',size:12,odds:300} },
  VEL: { name:'Velocity Chrome', short:'Velocity', prestige:1.3, rel:[6,24], base:220, rc:35, tmpl:'vel', blurb:'Chrome stock and a refractor for every colour. Rookie autographs are the chase.',
    formats:{ pack:{price:7,cards:4,packs:1,retail:1}, blaster:{price:28,cards:4,packs:6,retail:1}, hobby:{price:190,cards:4,packs:24,g:{auto:2}} },
    par:[{id:'rf',n:'Refractor',odds:3,fin:'refr',col:'#cfd8e3'},{id:'sky',n:'Sky Refractor',run:250,odds:40,fin:'refr',col:'#57a8e0'},{id:'aqu',n:'Aqua Refractor',run:150,odds:65,fin:'refr',col:'#1fb5ad'},{id:'blu',n:'Blue Refractor',run:99,odds:100,fin:'refr',col:'#2459b8'},{id:'gld',n:'Gold Refractor',run:50,odds:200,fin:'refr',col:'#d4a72c'},{id:'org',n:'Orange Refractor',run:25,odds:400,fin:'refr',col:'#ea7a1c'},{id:'red',n:'Red Refractor',run:5,odds:2000,fin:'refr',col:'#cf2a2a'},{id:'sup',n:'Superfractor',run:1,odds:10000,fin:'super',col:'#e8e2c0'}],
    ins:[{n:'Launch Angle',size:20,odds:8,focus:'power'},{n:'Next Up',size:25,odds:6,focus:'rookies'}],
    auto:{n:'Chrome Rookie Autographs',odds:40,size:50,focus:'rookies',par:[{id:'arf',n:'Refractor',run:499,share:0.3},{id:'ag',n:'Gold Refractor',run:50,share:0.1},{id:'ao',n:'Orange Refractor',run:25,share:0.05},{id:'ar',n:'Red Refractor',run:5,share:0.012},{id:'a1',n:'Superfractor',run:1,share:0.003}]},
    relic:null, sp:{odds:120, ssp:900}, caseHit:{n:'Velocity Vortex',size:15,odds:288} },
  LUX: { name:'Summit Luxe', short:'Luxe', prestige:1.6, rel:[9,16], base:100, rc:30, tmpl:'lux', luxe:true, baseRun:199, autoRun:99, blurb:'One pack, six cards, all numbered. Three on-card autographs per box. Built for high-end collectors.',
    formats:{ hobby:{price:320,cards:6,packs:1,luxe:1} },
    par:[{id:'gld',n:'Gold',run:25,odds:6,fin:'color',col:'#c9a227'},{id:'sup',n:'Platinum',run:1,odds:200,fin:'super',col:'#e8e2c0'}],
    ins:[], auto:{n:'Luxe Signatures',odds:1,size:70,par:[{id:'ag',n:'Gold',run:25,share:0.18},{id:'ar',n:'Emerald',run:5,share:0.04},{id:'a1',n:'Platinum',run:1,share:0.008}]},
    relic:{n:'Luxe Patch',odds:1,size:30,run:99}, sp:null, caseHit:null },
  UPD: { name:'Diamond Update', short:'Update', prestige:0.95, rel:[10,21], base:200, rc:45, tmpl:'dia', update:true, blurb:'The flagship\'s second act: this season\'s call-ups, trades and All-Stars.',
    formats:{ pack:{price:6,cards:10,packs:1,retail:1}, blaster:{price:32,cards:10,packs:7,retail:1}, hobby:{price:125,cards:10,packs:24,g:{auto:1,num:1}} },
    par:[{id:'sil',n:'Silver',odds:8,fin:'foil',col:'#b9c1c9'},{id:'blu',n:'Blue',run:199,odds:45,fin:'color',col:'#2459b8'},{id:'gld',n:'Gold',run:50,odds:180,fin:'color',col:'#c9a227'},{id:'red',n:'Red',run:10,odds:900,fin:'color',col:'#c0282d'},{id:'blk',n:'Black',run:5,odds:1800,fin:'color',col:'#151515'},{id:'sup',n:'Super',run:1,odds:9000,fin:'super',col:'#e8e2c0'}],
    ins:[{n:'Rookie Debut',size:30,odds:5,focus:'rookies'},{n:'Midsummer Classic',size:20,odds:10,focus:'stars'}],
    auto:{n:'Update Autographs',odds:60,size:50,focus:'rookies',par:[{id:'ag',n:'Gold',run:50,share:0.14},{id:'a1',n:'Super',run:1,share:0.006}]},
    relic:{n:'Update Relics',odds:48,size:30}, sp:{odds:64, ssp:600}, caseHit:{n:'Crown Jewels',size:15,odds:320} }
};
const BRAND_ORDER = ['DIA','NAT','HER','SPR','VEL','LUX','UPD'];
const FMT_NAME = { pack:'Pack', blaster:'Blaster box', hobby:'Hobby box' };
const FMT_PL = { pack:'packs', blaster:'blaster boxes', hobby:'hobby boxes' };
const RETAIL_HIT_MULT = 2.4;

function B(prod){ return BRANDS[prod.b]; }
function prodName(prod){ return prod.yr+' '+B(prod).name; }

// ---- schedule & product creation ----
function scheduleYear(yr){
  for (const b of BRAND_ORDER){
    const br=BRANDS[b];
    const rel = dateToDay(yr, br.rel[0], br.rel[1]) + (yr===2026?0:ri(-6,6));
    const prod = { id:G.products.length, b, yr, rel, cat:'baseball', cl:null, stock:{}, oop:0, rs0:0 };
    G.products.push(prod);
  }
}
function prodById(id){ return G.products[id]; }
function releasedProducts(){ return G.products.filter(p=>p.cl); }

function genChecklist(prod){
  const br=B(prod), yr=prod.yr;
  const actives = G.players.filter(p=>p.tm>=0);
  const rcPool = (br.update ? G.players.filter(p=>p.dy===yr && (p.tm>=0 || p.dd)) : (G.rookieClass[yr]||[]).map(P)).sort((a,b)=>(b.pot+b.ab*0.3)-(a.pot+a.ab*0.3));
  const rcs = rcPool.slice(0, br.rc);
  const used = new Set(rcs.map(p=>p.id));
  let entries = rcs.map(p=>[p.id,1]);
  if (br.pros){
    const pros = G.players.filter(p=>p.tm===-1 && !used.has(p.id)).sort((a,b)=>(b.pot*0.8+b.ab*0.3)-(a.pot*0.8+a.ab*0.3)).slice(0, br.pros);
    pros.forEach(p=>{ used.add(p.id); entries.push([p.id,2]); });
  }
  const pool = actives.filter(p=>!used.has(p.id));
  const vetN = br.base - entries.length;
  const ws = pool.map(p=>{ const x=Math.max(0,p.ab-40)/50; return 0.25 + x*x*2 + p.pop; });
  let tot = ws.reduce((a,b)=>a+b,0);
  for (let i=0;i<vetN && tot>0;i++){ let x=R()*tot, j=0; for (; j<ws.length; j++){ x-=ws[j]; if (x<=0 && ws[j]>0) break; } if (j>=ws.length) j=ws.findIndex(v=>v>0); entries.push([pool[j].id,0]); tot-=ws[j]; ws[j]=0; }
  shuffle(entries);
  if (br.hiSP){ // high-number short prints: put some stars/rookies at the end
    const hi = entries.splice(entries.length-br.hiSP, br.hiSP); hi.forEach(e=>e[1]|=4); entries=entries.concat(hi);
  }
  const sc={}; const sOf=p=> sc[p.id]!=null? sc[p.id] : (sc[p.id]=playerScore(p)); const byS = (arr)=>arr.slice().sort((a,b)=>sOf(b)-sOf(a));
  const listFor = (focus, size)=>{
    let src;
    if (focus==='legends') src = byS(G.players.filter(p=>p.tm===-2 && p.war>35));
    else if (focus==='rookies') src = rcs.length? rcs.slice() : byS(actives).slice(0,size);
    else if (focus==='prospects') src = entries.filter(e=>e[1]&2).map(e=>P(e[0]));
    else if (focus==='power') src = actives.filter(p=>!isPitcher(p)).sort((a,b)=>(b.ab*(0.5+b.pw))-(a.ab*(0.5+a.pw)));
    else src = byS(actives);
    return src.slice(0, Math.round(size*1.4)).sort(()=>R()-0.5).slice(0,size).map(p=>p.id);
  };
  const cl = { base: entries, ins: br.ins.map(x=>listFor(x.focus, x.size)) };
  if (br.auto){ const size=br.auto.size; const f=br.auto.focus;
    let pool2;
    if (f==='prospects') pool2 = entries.filter(e=>e[1]&2).map(e=>e[0]).slice(0,Math.round(size*0.7)).concat(rcs.slice(0,Math.round(size*0.3)).map(p=>p.id));
    else if (f==='rookies') pool2 = rcs.map(p=>p.id).concat(byS(actives).filter(p=>ageOf(p)<=26).slice(0,size).map(p=>p.id));
    else pool2 = rcs.slice(0,Math.round(size*0.45)).map(p=>p.id).concat(actives.filter(p=>!used.has(p.id)).sort(()=>R()-0.5).slice(0,Math.round(size*0.35)).map(p=>p.id)).concat(byS(actives).slice(0,Math.round(size*0.4)).map(p=>p.id));
    cl.auto = Array.from(new Set(pool2)).slice(0,size);
    cl.autoRc = cl.auto.map(id=>rcs.some(p=>p.id===id)?1:(entries.some(e=>e[0]===id && e[1]&2)?2:0));
  }
  if (br.relic) cl.relic = byS(actives).slice(0, br.relic.size*2).sort(()=>R()-0.5).slice(0,br.relic.size).map(p=>p.id);
  if (br.sp) cl.sp = byS(actives).slice(0,30).map(p=>p.id).concat(rcs.slice(0,10).map(p=>p.id));
  if (br.caseHit) cl.caseHit = byS(actives).slice(0,10).map(p=>p.id).concat(byS(G.players.filter(p=>p.tm===-2)).slice(0,br.caseHit.size-10).map(p=>p.id));
  prod.cl = cl;
  prod.rs0 = rookieIndex(prod) || 0.3;
  const retailDays = 110;
  prod.stock = {}; for (const f in br.formats) prod.stock[f] = f==='hobby'? ri(30,60) : ri(80,160);
  prod.retailEnd = prod.rel + retailDays;
}
function rookieIndex(prod){
  if (!prod.cl) return 0;
  const rcs = prod.cl.base.filter(e=>e[1]&3).map(e=>playerScore(P(e[0]))).sort((a,b)=>b-a).slice(0,6);
  if (!rcs.length) return 0.3;
  return rcs.reduce((a,b)=>a+b,0)/rcs.length;
}

// ---- design keys ----
// key = prodId|sec|no|par   sec: b base, v SP variation, w SSP variation, i0.. inserts, a auto, r relic, c case hit
const DCACHE = new Map();
function dk(prod, sec, no, par){ return prod.id+'|'+sec+'|'+no+'|'+(par||''); }
function D(key){
  let d = DCACHE.get(key); if (d) return d;
  const [pi, sec, noS, par] = key.split('|'); const prod=G.products[+pi]; const br=B(prod); const no=+noS;
  let pid, flags=0, setName, run=0, parObj=null, typeLbl, cardNo;
  if (sec==='b'||sec==='v'||sec==='w'){ const e=prod.cl.base[no]; pid=e[0]; flags=e[1]; setName='Base'; cardNo=String(no+1); if(sec!=='b'){ typeLbl = sec==='v'?'SP Variation':'SSP Variation'; setName='Base'; } }
  else if (sec[0]==='i'){ const ii=+sec.slice(1); pid=prod.cl.ins[ii][no]; setName=br.ins[ii].n; cardNo=br.ins[ii].n.split(' ').map(w=>w[0]).join('')+'-'+(no+1); }
  else if (sec==='a'){ pid=prod.cl.auto[no]; flags=prod.cl.autoRc[no]; setName=br.auto.n; cardNo=(br.short[0]+'A')+'-'+(no+1); if (br.autoRun) run=br.autoRun; }
  else if (sec==='r'){ pid=prod.cl.relic[no]; setName=br.relic.n; cardNo='GU-'+(no+1); if (br.relic.run) run=br.relic.run; }
  else if (sec==='c'){ pid=prod.cl.caseHit[no]; setName=br.caseHit.n; cardNo='CJ-'+(no+1); }
  if (sec==='b' && br.baseRun) run=br.baseRun;
  if (par){ parObj = (sec==='a' ? br.auto.par : br.par).find(x=>x.id===par); if (parObj && parObj.run) run=parObj.run; }
  d = { key, prod, sec, no, par, parObj, pid, flags, setName, run, cardNo,
    rc: !!(flags&1), first: !!(flags&2), hisp: !!(flags&4), auto: sec==='a', relic: sec==='r', ins: sec[0]==='i', caseHit: sec==='c', variation: sec==='v'||sec==='w' };
  d.title = designTitle(d);
  DCACHE.set(key, d); return d;
}
function designTitle(d){
  const parts=[];
  if (d.sec==='b') parts.push(d.parObj? d.parObj.n : 'Base');
  else if (d.variation) parts.push(d.sec==='v'?'SP Image Variation':'SSP Image Variation');
  else { parts.push(d.setName); if (d.parObj) parts.push(d.parObj.n); }
  return parts.join(' ');
}
function tags(d){
  const t=[];
  if (d.rc) t.push('RC'); if (d.first) t.push('1st'); if (d.auto) t.push('Auto'); if (d.relic) t.push('Relic');
  if (d.run) t.push('/'+d.run); else if (d.parObj) t.push('Parallel');
  if (d.ins) t.push('Insert'); if (d.variation) t.push(d.sec==='v'?'SP':'SSP'); if (d.hisp) t.push('SP'); if (d.caseHit) t.push('Case hit');
  return t;
}

// ---- pack generation ----
function randBaseNo(prod, excludeHi){ const n=prod.cl.base.length; const br=B(prod); const lim = (br.hiSP && excludeHi)? n-br.hiSP : n; return Math.floor(R()*lim); }
function pickAutoPar(prod){ const ps=B(prod).auto.par; let x=R(); for (const p of ps.slice().sort((a,b)=>a.share-b.share)){ if (x<p.share) return p.id; x-=p.share; } return ''; }
function genPack(prod, fmt){
  const br=B(prod), f=br.formats[fmt]; const m = f.retail? RETAIL_HIT_MULT : 1;
  const keys=[];
  if (br.luxe){
    for (let i=0;i<3;i++) keys.push(dk(prod,'a',Math.floor(R()*prod.cl.auto.length), pickAutoPar(prod)));
    keys.push(dk(prod,'r',Math.floor(R()*prod.cl.relic.length),''));
    for (let i=0;i<2;i++){ let par=''; for (const p of br.par) if (R()<1/p.odds) par=p.id; keys.push(dk(prod,'b',randBaseNo(prod),par)); }
    return keys;
  }
  const hits=[];
  for (const p of br.par) if (R() < 1/p.odds) hits.push(dk(prod,'b',randBaseNo(prod,false),p.id));
  br.ins.forEach((ins,ii)=>{ if (R()<1/ins.odds) hits.push(dk(prod,'i'+ii,Math.floor(R()*prod.cl.ins[ii].length),'')); });
  if (br.auto && R()<1/(br.auto.odds*m)) hits.push(dk(prod,'a',Math.floor(R()*prod.cl.auto.length),pickAutoPar(prod)));
  if (br.relic && R()<1/(br.relic.odds*m)) hits.push(dk(prod,'r',Math.floor(R()*prod.cl.relic.length),''));
  if (br.sp){ if (R()<1/br.sp.odds) hits.push(dk(prod,'v',spNo(prod),'')); if (R()<1/br.sp.ssp) hits.push(dk(prod,'w',spNo(prod),'')); }
  if (br.caseHit && R()<1/(br.caseHit.odds*m)) hits.push(dk(prod,'c',Math.floor(R()*prod.cl.caseHit.length),''));
  if (br.hiSP && R()<1/3) hits.push(dk(prod,'b',prod.cl.base.length-1-Math.floor(R()*br.hiSP),''));
  const nBase = Math.max(0, f.cards - hits.length);
  for (let i=0;i<nBase;i++) keys.push(dk(prod,'b',randBaseNo(prod,true),''));
  // hits go to the back of the pack
  return keys.concat(hits.slice(0,f.cards));
}
function spNo(prod){ const id=pick(prod.cl.sp); const i=prod.cl.base.findIndex(e=>e[0]===id); return i>=0?i:randBaseNo(prod,true); }
function isHitKey(k){ const d=D(k); return d.sec!=='b' || !!d.par || d.hisp; }
function isNumberedHit(k){ return D(k).run>0 && !B(D(k).prod).luxe; }
function genSealed(prod, fmt, seed){
  return withRng(mkRng(seed), ()=>{
    const f=B(prod).formats[fmt]; const packs=[];
    for (let i=0;i<f.packs;i++) packs.push(genPack(prod, fmt));
    if (f.g){ // box guarantees, implemented separately from pack odds
      const need = (test, n, make)=>{ let have=packs.flat().filter(test).length; let guard=0; while (have<n && guard++<50){ const pk=packs[ri(0,packs.length-1)]; const bi=pk.findIndex(k=>!isHitKey(k)); if (bi<0) continue; pk.splice(bi,1); pk.push(make()); have++; } };
      if (f.g.auto) need(k=>D(k).auto, f.g.auto, ()=>dk(prod,'a',Math.floor(R()*prod.cl.auto.length),pickAutoPar(prod)));
      if (f.g.num) need(k=>isNumberedHit(k), f.g.num, ()=>{ const nums=B(prod).par.filter(p=>p.run); const p=wpick(nums, x=>1/x.odds); return dk(prod,'b',randBaseNo(prod,false),p.id); });
    }
    return packs;
  });
}

// ---- physical instances ----
function allocSerial(key, run){
  const c = G.ser[key]||0; if (c>=run) return 0;
  const h = hashStr(key); let a = (h % (run>2?run-1:1)) + 1; while (gcd(a,run)!==1) a++;
  G.ser[key]=c+1; return ((a*c + (h>>>8)) % run) + 1;
}
function genCondition(prod){
  const chrome = /vel|spr|lux/.test(B(prod).tmpl);
  const sd = [chrome?9.5:8, 6, 5.5, chrome?7:5.5, 4.5];
  const c = sd.map(s=>Math.round(clamp(100 - Math.abs(gauss())*s, 30, 100)));
  if (R()<0.07){ const i=ri(0,4); c[i]=Math.round(c[i]-rf(12,40)); }
  if (R()<0.03){ const i=ri(0,4); c[i]=Math.round(c[i]-rf(8,20)); }
  return c.map(x=>clamp(x,20,100));
}
function makeCard(key, owner, acq, rng){
  const d=D(key);
  let serial=0;
  if (d.run){ serial = allocSerial(key, d.run); if (!serial){ // print run exhausted: fall back to the base version
    key = dk(d.prod, d.sec==='a'?'a':'b', d.no, ''); return makeCard(key, owner, acq, rng); } }
  const c = rng? withRng(rng, ()=>genCondition(d.prod)) : genCondition(d.prod);
  const id = G.nextCid++;
  const card = { id, k:key, s:serial, c, g:0, o:owner, a:acq };
  G.cards[id]=card; return card;
}
function C(id){ return G.cards[id]; }

// ---- grading ----
const GRADE_NAMES = {10:'GEM MT',9:'MINT',8:'NM-MT',7:'NM',6:'EX-MT',5:'EX',4:'VG-EX',3:'VG',2:'GOOD',1:'POOR'};
function gradeFrom(card){
  const c=card.c; const mn=Math.min(...c); const avg=c.reduce((a,b)=>a+b,0)/5;
  const noise = withRng(mkRng(card.id*7919+13+(card.gt||0)*104729), ()=>gauss()*1.4);
  const s = mn*0.55 + avg*0.45 + noise;
  return s>=95.3?10: s>=91.6?9: s>=87?8: s>=81?7: s>=72?6: s>=64?5: s>=55?4: s>=45?3: s>=35?2:1;
}
function popAdd(key, g){ fvClear(key); const a = G.pop[key] || (G.pop[key]=[0,0,0,0,0,0,0,0,0,0,0]); a[g]++; }
function popOf(key){ return G.pop[key] || [0,0,0,0,0,0,0,0,0,0,0]; }

// ---- demand & value ----
function prospectBonus(p){
  const age=ageOf(p); if (p.tm===-2 || age>26 || p.pot<=p.ab) return 0;
  return clamp((p.pot-56)/40,0,1)*0.45*(age<=23?1:(27-age)/4)*(p._bust?0.5:1);
}
function playerScore(p){
  const leg = clamp(p.war/110, 0, 1);
  let S;
  if (p.tm===-2){ const pop = p._faded?0: p.pop;
    S = leg*0.72 + pop*0.16 + p.hy + (p.aw.some(a=>a[1]==='HOH')?0.1:0); if (!p.dy || p._faded) S = p.hy*0.5 + 0.02; }
  else {
    const an = clamp((p.ab-45)/50, 0, 1.05);
    S = 0.7*an + 0.25*p.pop + 0.3*leg + prospectBonus(p) + p.hy + clamp(p.fm/60,-0.05,0.05);
    if (p.inj>40) S -= 0.05;
  }
  return clamp(S, -0.1, 1.55);
}
function playerBase(p){ return 0.05*Math.exp(4.6*(p.S!=null?p.S:playerScore(p))) * Math.exp(-(G.sat[p.id]||0)); }
function rcMult(p){ return 2.1 + 2.9*clamp(prospectBonus(p)/0.45,0,1) + (p.tm===-2 && p.war>50 ? 1 : 0); }
const PAR_M = r=> r>=250?3.4: r>=199?4: r>=150?5: r>=99?6: r>=76?7: r>=50?10: r>=25?18: r>=10?35: r>=5?60: 220;
const APAR_M = r=> r>=499?1.3: r>=99?1.6: r>=76?1.8: r>=50?2.1: r>=25?3: r>=10?5: r>=5?7.5: 16;
function designMult(d){
  const br=B(d.prod), p=P(d.pid); let m = br.prestige;
  const yrsOld = yearOf(G.day)-d.prod.yr;
  if (d.sec==='b'){
    if (d.rc) m*=rcMult(p); else if (d.first) m*=2.2*(1+clamp(prospectBonus(p)/0.45,0,1)); else m*=Math.pow(0.85, Math.min(3,yrsOld));
    if (d.hisp) m*=4;
    if (br.luxe) m*=5;
    if (d.parObj) m *= d.parObj.run ? PAR_M(d.parObj.run) : (d.parObj.fin==='refr'?1.8: d.parObj.fin==='stock'?1.7:1.4);
  } else if (d.variation){ m *= (d.sec==='v'?9:32) * (d.rc?1.8:1); }
  else if (d.ins){ const ins=br.ins[+d.sec.slice(1)]; m *= clamp(1+ins.odds/5,1.8,5); }
  else if (d.auto){ m *= 22 * (d.flags&1? rcMult(p)*0.8 : d.flags&2? 2.2+clamp(prospectBonus(p)/0.45,0,1)*3 : 1) * (br.autoRun?1.15:1); if (d.parObj) m*=APAR_M(d.parObj.run); }
  else if (d.relic){ m *= 3.5*(br.relic.run?2.5:1); }
  else if (d.caseHit){ m *= 45; }
  return m;
}
function designFloor(d){
  let f = 0.05;
  if (d.run) f = 1.5 + 55/Math.pow(d.run,0.85);
  if (d.parObj && !d.run) f = 0.2;
  if (d.variation) f = d.sec==='v'?2:8;
  if (d.hisp) f = 0.5;
  if (d.ins) f = 0.25;
  if (d.auto) f = Math.max(f, 3.5 + (d.run? 40/Math.pow(d.run,0.7):0));
  if (d.relic) f = Math.max(f, 2);
  if (d.caseHit) f = 10;
  return f;
}
function gradeMult(g, pop){
  if (!g) return 1;
  if (g===10){ const p10=pop[10]||0; return 2.6 * (1 + 0.7/(1+p10/2)); }
  return {9:1.35, 8:0.85, 7:0.62, 6:0.5, 5:0.42, 4:0.36, 3:0.32, 2:0.28, 1:0.25}[g];
}
const SLAB_FLOOR = {10:12,9:7,8:5,7:4,6:3,5:3,4:3,3:3,2:3,1:3};
const FV = new Map();
function fvClear(key){ if (!key){ FV.clear(); return; } for (let g=0; g<=10; g++) FV.delete(key+'#'+g); }
function fairValue(key, g){
  const ck=key+'#'+(g||0); const hit=FV.get(ck); if (hit!==undefined) return hit;
  const v=fairValue0(key,g); FV.set(ck,v); return v;
}
function fairValue0(key, g){
  const d=D(key); const p=P(d.pid);
  let v = Math.max(designFloor(d), playerBase(p)*designMult(d));
  v *= Math.exp(-(G.dp[key]||0));
  if (g>0) v = Math.max(v*gradeMult(g, popOf(key)), SLAB_FLOOR[g]);
  return v;
}
function visibleCondFactor(card){ const mn=Math.min(...card.c); return mn<55?0.55: mn<68?0.75: mn<78?0.9:1; }
function cardValue(card){ let v=fairValue(card.k, card.g>0?card.g:0); if (card.sg && typeof cardSigMult==='function') v*=cardSigMult(card); return card.g>0? v : v*visibleCondFactor(card); }

// ---- sealed product value ----
function sealedFair(prod, fmt){
  const price = B(prod).formats[fmt].price;
  const t=G.day;
  const inRetail = t < prod.retailEnd && t>=prod.rel;
  const now = rookieIndex(prod), then = prod.rs0||0.3;
  const hype = Math.exp((now-then)*2.2);
  let f;
  if (inRetail) f = (prod.stock[fmt]<=0 ? 1.15 : 1.0) * clamp(Math.pow(hype,0.4),0.85,1.4);
  else { const yrs=(t-prod.retailEnd)/365; f = (1.12 + yrs*0.14) * clamp(hype,0.45,6); }
  const k='S|'+prod.id+'|'+fmt; f *= Math.exp(-(G.dp[k]||0));
  return price*f;
}
function sealedKey(prod, fmt){ return 'S|'+prod.id+'|'+fmt; }

// ---- estimate ranges shown to the player ----
function salesFor(key, g){ return (G.sales[key]||[]).filter(s=>(g==null) || (s[2]||0)===(g||0)); }
function estRange(key, g, rawCard){
  const isSealed = key[0]==='S';
  let fv = isSealed ? sealedFair(G.products[+key.split('|')[1]], key.split('|')[2]) : fairValue(key, g||0);
  if (rawCard && !(g>0)) fv *= visibleCondFactor(rawCard);
  const recent = salesFor(key, isSealed?null:(g||0)).filter(s=>s[0]>G.day-120);
  const n = recent.length;
  const center = n ? 0.45*fv + 0.55*median(recent.slice(0,6).map(s=>s[1])) : fv;
  const run = isSealed?0:D(key).run;
  let w = 0.1 + 0.42/Math.sqrt(n+1) + (run && run<=10?0.25:0) + (run===1?0.45:0);
  if (isSealed) w*=0.6;
  const lo = nicePrice(Math.max(0.05, center*(1-w*0.75))), hi = nicePrice(Math.max(0.1,center*(1+w)));
  return { lo, hi: Math.max(hi, lo), n, limited: n===0 && (run && run<=25 || fv>150) };
}
function fmtRange(r){ return r.lo===r.hi ? '~'+money(r.lo) : money(r.lo)+'–'+money(r.hi); }
// auto parallels borrow the colour language of the base rainbow
(function(){ const col={Gold:'#c9a227','Gold Refractor':'#d4a72c',Red:'#c0282d','Red Ink':'#b3261e','Red Refractor':'#cf2a2a',Super:'#e8e2c0',Superfractor:'#e8e2c0',Platinum:'#e8e2c0',Refractor:'#cfd8e3','Orange Refractor':'#ea7a1c',Emerald:'#1f8a5a'};
  for (const b in BRANDS){ const a=BRANDS[b].auto; if (!a) continue; for (const p of a.par){ if (!p.col) p.col=col[p.n]||'#999'; if (!p.fin) p.fin = p.run===1?'super': /Refractor|fractor/.test(p.n)?'refr':'color'; } } })();

// ===================== MARKET & COLLECTORS =====================
const NPC_TYPES = {
  set:{n:'Set collector',w:12,cash:[150,900]}, rookie:{n:'Rookie collector',w:18,cash:[200,2500]}, team:{n:'Team collector',w:14,cash:[150,1500]},
  prospect:{n:'Prospect speculator',w:14,cash:[300,4000]}, high:{n:'High-end collector',w:8,cash:[4000,40000]}, auto:{n:'Autograph collector',w:10,cash:[300,5000]},
  vintage:{n:'Older-issue collector',w:8,cash:[300,3000]}, pc:{n:'Player collector',w:14,cash:[200,6000]}, deal:{n:'Deal hunter',w:10,cash:[200,2000]},
  flip:{n:'Flipper',w:12,cash:[400,5000]}, casual:{n:'Casual collector',w:14,cash:[40,300]}, dealer:{n:'Dealer',w:6,cash:[3000,25000]}
};
const FEE = 0.10;
function NPC(id){ return G.npcs[id-1]; }
function ownerName(o){ if (o<=-1000 && typeof HS==='function'){ const s=HS(o); if (s) return s.n; } return o===0? 'You' : o===-5? SHOP_NAME : o===-900? 'Harrow & Finch Auctions' : (NPC(o)||{h:'collector'}).h; }
function makeNPCs(){
  const types=[]; for (const k in NPC_TYPES) for (let i=0;i<NPC_TYPES[k].w;i++) types.push(k);
  const used={};
  types.forEach((ty,i)=>{
    let h; do { h = pick(HANDLES_A)+pick(HANDLES_B)+(R()<0.6?ri(1,99):''); } while(used[h]); used[h]=1;
    const c=NPC_TYPES[ty].cash;
    const n={ id:i+1, h, ty, cash:Math.round(rf(c[0],c[1])), inc:Math.round(rf(c[0],c[1])*0.06), tm:ri(0,29), pids:[], gr:+R().toFixed(2), kn:+rf(0.08,0.4).toFixed(2), setProd:-1 };
    if (ty==='dealer'||ty==='high') n.kn=+rf(0.05,0.15).toFixed(2);
    if (ty==='casual') n.kn=+rf(0.25,0.55).toFixed(2);
    G.npcs.push(n);
  });
}
function refreshNPCTastes(){
  const stars = G.players.filter(p=>p.tm!==-1 && (p.S>0.45 || p.war>30));
  for (const n of G.npcs){
    if (n.ty==='pc' && !n.pids.length && stars.length) n.pids = [pick(stars).id, pick(stars).id];
    if (n.ty==='set' && (n.setProd<0 || R()<0.02)){ const rel=releasedProducts().filter(p=>B(p).name!=='Summit Luxe'); if (rel.length) n.setProd = pick(rel.slice(-14)).id; }
  }
}
function interest(n, item){
  if (item.comic) return cmInterest(n, item);
  if (isComicNPC(n)) return n.cd ? 0.6 : 0.04;
  if (item.sealed){ const f={dealer:1,casual:item.v<70?1.05:0.3,flip:0.9,high:0.95,set:1.05,prospect:0.9,rookie:0.85,deal:0.8}[n.ty]; return f||0.5; }
  const card=item.card, d=D(card.k), p=P(d.pid), v=item.v; const yrsOld=yearOf(G.day)-d.prod.yr;
  let f;
  switch(n.ty){
    case 'set': f = d.prod.id===n.setProd && d.sec==='b' && !d.par ? 1.3 : v<4?0.75:0.3; break;
    case 'rookie': f = d.rc||d.first ? 1.15 : 0.3; break;
    case 'team': f = p.tm===n.tm ? 1.3 : 0.2; break;
    case 'prospect': f = prospectBonus(p)>0.12 ? 1.05+Math.max(0,p.hy) : 0.2; break;
    case 'high': f = v>=80 ? 1.05 : 0.05; break;
    case 'auto': f = d.auto ? 1.2 : 0.2; break;
    case 'vintage': f = (yrsOld>=4 || p.tm===-2) ? 1.15 : 0.25; break;
    case 'pc': f = n.pids.includes(p.id) ? 1.6 : 0.1; break;
    case 'deal': f = 0.72; break;
    case 'flip': f = 0.84; break;
    case 'casual': f = v<25 ? 1.0 : 0.25; break;
    case 'dealer': f = 0.72; break;
    default: f=0.5;
  }
  if (card.g>0) f *= 0.85+0.35*n.gr; else f *= 1.08-0.2*n.gr;
  return f;
}
function itemOf(l){
  if (l.it==='m'){ const cp=G.mc[l.ref]; const d=cmD(cp.k); const s=d.s; const H=s.heat+s.spec; return { comic:true, cm:cp, key:cp.k, v:cmCopyValue(cp), heat:0.3+0.3*Math.min(4,H)+(!d.tr&&(d.n===1||issueKeys(s,d.n).length)?0.35:0)+(s.fro>0?s.fro:0) }; }
  if (l.it==='s'){ const s=G.sealed[l.ref]; const prod=G.products[s.p]; return { sealed:true, s, prod, key:sealedKey(prod,s.f), v:sealedFair(prod,s.f), heat:0.9+Math.max(0,rookieIndex(prod))*1.2 }; }
  const card=C(l.ref); const d=D(card.k);
  return { card, key:card.k, v:cardValue(card), heat:0.35+1.8*clamp(playerScore(P(d.pid)),0,1.3) };
}
function liquidity(item){ return item.heat*1.3/(1+Math.pow(item.v/30,0.7)) * (item.v<1?0.35:1); }
function bidInc(x){ return x<10?0.5: x<50?1: x<200?2.5: x<1000?10: 25; }

// ---- listings ----
function createListing(it, ref, seller, ty, price, dur, off){
  const l={ id:G.nextLid++, it, ref, sel:seller, ty, pr:Math.round(price*100)/100, st:G.day, en: ty==='auc'? G.day+dur : G.day+45, off:!!off, bids:[], cur:0, hist:[], offers:[] };
  if (ty==='auc') l.cur = l.pr;
  G.lst.push(l);
  if (it==='c') C(ref).l=l.id; else if (it==='m') G.mc[ref].l=l.id; else G.sealed[ref].l=l.id;
  return l;
}
function L(id){ return G.lst.find(l=>l.id===id); }
function removeListing(l){ const i=G.lst.indexOf(l); if (i>=0) G.lst.splice(i,1); if (l.it==='c'){ const c=C(l.ref); if(c) delete c.l; } else if (l.it==='m'){ const c=G.mc[l.ref]; if (c) delete c.l; } else { const s=G.sealed[l.ref]; if(s) delete s.l; } }
function transfer(l, buyer, price, how){
  const seller=l.sel; const item=itemOf(l);
  const gross=Math.round(price*100)/100;
  if (buyer===0){ G.player.cash-=gross; G.player.bought+=gross; } else NPC(buyer).cash-=gross;
  const net=Math.round(gross*(1-FEE)*100)/100;
  if (seller===0){ G.player.cash+=net; G.player.sold+=gross; G.player.fees+=gross-net; } else NPC(seller).cash+=net;
  const g = item.sealed?0: item.comic? (item.cm.g>0?item.cm.g:0) : (item.card.g>0?item.card.g:0);
  if (item.comic && buyer>0 && gross>=item.v*1.02){ const s=cmD(item.key).s; s.fro=Math.min(0.9,(s.fro||0)+0.012); }
  recordSale(item.key, gross, g, buyer, seller);
  if (l.it==='m'){ const c=item.cm; c.o=buyer; if (buyer===0){ c.a=[G.day,how==='auc'?'won':'bought',gross,ownerName(seller)]; (c.h=c.h||[]).push([G.day,how==='auc'?'Won at auction':'Bought',gross,ownerName(seller)]); } if (seller===0){ (c.h=c.h||[]).push([G.day,'Sold',gross,ownerName(buyer)]); (G.player.soldComics=G.player.soldComics||[]).push(c.id); if (G.player.soldComics.length>200) G.player.soldComics.shift(); } if (buyer>0 && G._npcComicIds && seller===0) G._npcComicIds.push(c.id); }
  else if (l.it==='c'){ const c=item.card; c.o=buyer; if (buyer===0){ c.a=[G.day,how==='auc'?'won':'bought',gross,ownerName(seller)]; (c.h=c.h||[]).push([G.day,how==='auc'?'Won at auction':'Bought',gross,ownerName(seller)]); } if (seller===0){ (c.h=c.h||[]).push([G.day,'Sold',gross,ownerName(buyer)]); G.player.soldCards.push(c.id); if (G.player.soldCards.length>200) G.player.soldCards.shift(); }
    if (buyer>0){ if (NPC(buyer).ty==='flip' && gross < item.v*0.88) c.fl=1; if (G._npcCardIds && seller===0) G._npcCardIds.push(c.id); } }
  else { const s=item.s; s.o=buyer; if (buyer===0) s.a=[G.day,'bought',gross,ownerName(seller)]; }
  removeListing(l);
  if (seller===0||buyer===0) toast((seller===0? 'Sold ':'Bought ')+itemLabel(l)+' for '+money(gross)+(seller===0?' (you receive '+money(net)+')':''));
}
function itemLabel(l){ if (l.it==='m') return cmItemLabel(G.mc[l.ref]); if (l.it==='s'){ const s=G.sealed[l.ref]; return prodName(G.products[s.p])+' '+FMT_NAME[s.f].toLowerCase(); } const c=C(l.ref), d=D(c.k); return pname(P(d.pid))+' '+d.prod.yr+' '+B(d.prod).short+' '+d.title; }
function recordSale(key, price, g, buyer, seller){
  const a = G.sales[key] || (G.sales[key]=[]);
  a.unshift([G.day, price, g]); if (a.length>24) a.length=24;
  G.dp[key]=(G.dp[key]||0)+0.035; if (key[0]==='M') cfvClear(key); else fvClear(key);
  if (key[0]!=='S' && key[0]!=='M'){ const pid=D(key).pid; G.sat[pid]=(G.sat[pid]||0)+ (price<3?0.002:0.006); }
  if (price>=25 || buyer===0 || seller===0){ G.feed.unshift([G.day,key,price,g,buyer,seller]); if (G.feed.length>200) G.feed.length=200; }
}

// ---- NPC side of the market ----
function npcValuation(n, item){ return item.v * interest(n,item) * Math.exp(gauss()*n.kn); }
function findBuyer(item, price, exclude){
  for (let tries=0; tries<10; tries++){
    const n=pick(npcPool(item)); if (n.id===exclude) continue;
    if (n.cash < price) continue;
    const val = npcValuation(n, item);
    const need = (n.ty==='deal'||n.ty==='flip'||n.ty==='dealer') ? price*1.12 : price;
    if (val >= need) return n;
  }
  return null;
}
function marketTick(){
  const t=G.day;
  const boughtKey={};
  // 1. auctions: new bidders, endings
  for (const l of G.lst.slice()){
    if (l.ty!=='auc') continue;
    const item=itemOf(l);
    const last = l.en-t;
    if (last>=0){
      const lam = liquidity(item)*1.25*(last===0?2.5:1);
      const k = poisson(lam);
      for (let i=0;i<k;i++){
        const n=pick(npcPool(item)); if (n.id===l.sel || l.bids.some(b=>b[0]===n.id)) continue;
        let mx = npcValuation(n,item)*Math.exp(gauss()*0.12);
        if (n.ty==='deal'||n.ty==='flip'||n.ty==='dealer') mx*=0.82;
        mx = Math.min(mx, n.cash);
        if (mx >= l.cur + (l.bids.length?bidInc(l.cur):0)) placeBid(l, n.id, Math.round(mx*100)/100);
      }
    }
    if (t>=l.en) endAuction(l);
  }
  // 2. Buy Now purchases
  const bins = G.lst.filter(l=>l.ty==='bin').sort((a,b)=>a.pr-b.pr);
  for (const l of bins){
    if (!G.lst.includes(l)) continue;
    const item=itemOf(l); if (item.v<=0) continue;
    const ratio = l.pr/item.v;
    const resp = clamp(Math.exp(-5*(ratio-0.92)), 0, 3);
    const lam = liquidity(item)*resp*0.6*Math.pow(0.45, boughtKey[item.key]||0);
    if (R() < 1-Math.exp(-lam)){
      const b = findBuyer(item, l.pr, l.sel);
      if (b){ transfer(l, b.id, l.pr, 'bin'); boughtKey[item.key]=(boughtKey[item.key]||0)+1; continue; }
    }
    // 3. offers on the player's listings
    if (l.sel===0 && l.off && l.offers.length<3 && R() < liquidity(item)*0.35){
      const n=pick(npcPool(item)); const val=npcValuation(n,item); const amt = nicePrice(Math.min(val*rf(0.78,0.95), l.pr*0.97));
      if (amt>=l.pr*0.55 && n.cash>=amt) { l.offers.push({id:G.nextLid++, who:n.id, amt, exp:t+2, val}); G.player.newOffers=(G.player.newOffers||0)+1; }
    }
    // stale NPC listings drop price or expire
    if (l.sel>0){ const age=t-l.st; if (age>0 && age%8===0) l.pr = Math.max(0.99, Math.round(l.pr*0.92*100)/100); if (t>=l.en) removeListing(l); }
  }
  for (const l of G.lst) if (l.offers.length) l.offers = l.offers.filter(o=>o.exp>=t);
  // 4. NPC listing creation
  const npcListings = G.lst.filter(l=>l.sel>0 && (l.it==='c'||l.it==='s')).length;
  const target = 520;
  const nNew = clamp(Math.round((target-npcListings)/4)+ri(6,14), 4, 60);
  const ncards = G._npcCardIds || (G._npcCardIds = Object.keys(G.cards).map(Number).filter(id=>G.cards[id].o>0));
  for (let i=0;i<nNew;i++) npcListOne();
  if (R()<0.05) npcLiquidation();
  // sealed listings
  if (R()<0.5) npcListSealed();
}
function placeBid(l, who, mx){
  const ex = l.bids.find(b=>b[0]===who);
  if (ex) ex[1]=Math.max(ex[1],mx); else l.bids.push([who,mx]);
  l.bids.sort((a,b)=>b[1]-a[1]);
  const top=l.bids[0], second=l.bids[1];
  const prevLeader = l.lead;
  const newCur = second ? Math.min(top[1], second[1]+bidInc(second[1])) : l.pr;
  if (newCur!==l.cur || prevLeader!==top[0]){ l.cur = Math.round(newCur*100)/100; l.lead=top[0]; l.hist.unshift([G.day, top[0], l.cur]); if (l.hist.length>40) l.hist.length=40; }
  if (prevLeader===0 && top[0]!==0 && l.sel!==0) G.player.outbid=(G.player.outbid||[]).concat([l.id]).slice(-20);
}
function endAuction(l){
  const item=itemOf(l);
  const mine = l.bids.some(b=>b[0]===0);
  const label = mine ? itemLabel(l) : '';
  while (l.bids.length){
    const top=l.bids[0];
    const price = l.bids[1] ? Math.min(top[1], l.bids[1][1]+bidInc(l.bids[1][1])) : l.pr;
    const cash = top[0]===0 ? G.player.cash : NPC(top[0]).cash;
    if (cash >= price){ transfer(l, top[0], price, 'auc'); if (mine && top[0]!==0) toast('Auction lost: '+label+' went to '+ownerName(top[0])+' for '+money(price,true)); return; }
    l.bids.shift();
  }
  if (l.sel===0) toast('Your auction for '+itemLabel(l)+' ended with no bids');
  removeListing(l);
}
function npcListOne(){
  const ids = G._npcCardIds; if (!ids.length) return;
  let card=null;
  for (let tries=0; tries<14 && !card; tries++){
    const c=G.cards[ids[Math.floor(R()*ids.length)]];
    if (!c || c.o<=0 || c.l || c.g<0) continue;
    const v=cardValue(c); if (v<1.5) continue;
    const n=NPC(c.o); const p=P(D(c.k).pid);
    // collectors hold favourites, speculators sell into hype or panic-sell into slumps
    const keep = interest(n,{card:c,v})>1.1 ? 0.75 : 0.1;
    let sellBias = 0;
    if (n.ty==='prospect'||n.ty==='flip') sellBias = p.hy>0.25?0.4 : p.hy<-0.12?0.45:0;
    if (c.fl) sellBias=0.9;
    if (R() < keep - sellBias) continue;
    card=c;
  }
  if (!card) return;
  const n=NPC(card.o); const item={card, v:cardValue(card)};
  const sv = item.v*Math.exp(gauss()*n.kn);
  const auc = R()<0.3;
  if (auc){ createListing('c', card.id, n.id, 'auc', Math.max(0.99, nicePrice(sv*rf(0.25,0.8))), pick([3,5,5,7]), false); }
  else {
    let mult = {dealer:rf(1.1,1.4), flip:rf(1.05,1.3), casual:rf(0.75,1.45), high:rf(1.05,1.35)}[n.ty] || rf(0.95,1.35);
    createListing('c', card.id, n.id, 'bin', Math.max(0.99, nicePrice(sv*mult)), 0, R()<0.6);
  }
  delete card.fl;
}
function npcLiquidation(){
  const n=pick(G.npcs.filter(x=>x.ty!=='dealer'));
  const cards=G._npcCardIds.map(id=>G.cards[id]).filter(c=>c && c.o===n.id && !c.l && c.g>=0);
  if (cards.length<6) return;
  const sel=cards.sort((a,b)=>cardValue(b)-cardValue(a)).slice(0,ri(6,16));
  for (const c of sel){ const v=cardValue(c); if (v<2) continue; if (R()<0.5) createListing('c',c.id,n.id,'auc',Math.max(0.99,nicePrice(v*rf(0.2,0.5))),pick([5,7]),false); else createListing('c',c.id,n.id,'bin',Math.max(0.99,nicePrice(v*rf(0.78,1.05))),0,true); }
  addNews(`COLLECTOR ${n.h.toUpperCase()} SELLING OFF A COLLECTION`, `${sel.length} cards hit the market at once, some at no-reserve auction.`, null, 'hobby');
}
function npcListSealed(){
  const pool=Object.values(G.sealed).filter(s=>s.o>0 && !s.l);
  if (!pool.length) return;
  const s=pick(pool); const prod=G.products[s.p]; const n=NPC(s.o); const v=sealedFair(prod,s.f)*Math.exp(gauss()*n.kn*0.5);
  if (R()<0.25) createListing('s',s.id,n.id,'auc',nicePrice(v*rf(0.5,0.85)),pick([3,5,7]),false);
  else createListing('s',s.id,n.id,'bin',nicePrice(v*rf(1.02,1.3)),0,R()<0.5);
}

// ---- world supply: packs the rest of the hobby opens ----
function worldOpen(prod, packs, fmtPref){
  const br=B(prod);
  const fmt = fmtPref && br.formats[fmtPref] ? fmtPref : (br.formats.hobby? 'hobby' : Object.keys(br.formats)[0]);
  const perSealed = br.formats[fmt].packs;
  let opened=0;
  while (opened<packs){
    const pk = genSealed(prod, fmt, Math.floor(R()*2e9));
    for (const pack of pk){ for (const key of pack){
      const d=D(key); let keep;
      if (d.sec!=='b' || d.par || d.hisp) keep = d.ins && !d.par ? R()<0.45 : true;
      else keep = (d.rc||d.first) ? R()<0.22 : R()<0.012;
      if (!keep) continue;
      const owners=[pick(G.npcs),pick(G.npcs),pick(G.npcs),pick(G.npcs)];
      const card=makeCard(key, 0, null);
      const it={card, v:cardValue(card)};
      const own = owners.sort((a,b)=>interest(b,it)-interest(a,it))[0];
      card.o=own.id; card.a=[G.day,'pulled',0,''];
      if (G._npcCardIds) G._npcCardIds.push(card.id);
    } }
    opened+=perSealed;
  }
}
function gradeNPCHoldings(){
  for (const id in G.cards){ const c=G.cards[id]; if (c.o<=0 || c.g) continue; const v=cardValue(c);
    const pG = v>60?0.5: v>20?0.25: v>8?0.08:0.01;
    if (R()<pG){ c.g=gradeFrom(c); popAdd(c.k,c.g); c.cert=ri(10000000,99999999); } }
}
function cullNPCCards(){
  const ids=G._npcCardIds; if (ids.length<9000) return;
  const cand=ids.filter(id=>{ const c=G.cards[id]; return c && c.o>0 && !c.l && c.g===0; }).sort((a,b)=>cardValue(G.cards[a])-cardValue(G.cards[b])).slice(0,ids.length-8000);
  const del=new Set(cand); for (const id of cand) delete G.cards[id];
  G._npcCardIds = ids.filter(id=>!del.has(id) && G.cards[id] && G.cards[id].o>0);
}

// ---- retail ----
function inRetail(prod){ return prod.cl && G.day>=prod.rel && G.day<prod.retailEnd; }
function retailTick(){
  for (const prod of G.products){
    if (!prod.cl) continue;
    if (G.day===prod.retailEnd && !prod.oopNews){ prod.oopNews=1; if (G.live) addNews(`${prodName(prod).toUpperCase()} LEAVES RETAIL SHELVES`, `Remaining sealed product now trades on the secondary market only.`, null,'hobby'); }
    if (!inRetail(prod)) continue;
    const age=G.day-prod.rel; const hype=clamp(Math.exp((rookieIndex(prod)-(prod.rs0||0.3))*2),0.6,2.5);
    const early = age<10 ? 3 : 1;
    for (const f in prod.stock){
      const drain = poisson((f==='hobby'?0.5:f==='pack'?2.6:1.5)*hype*early);
      const before=prod.stock[f];
      prod.stock[f]=Math.max(0, before-drain);
      if (before>0 && prod.stock[f]===0 && G.live) addNews(`${prodName(prod).toUpperCase()} ${FMT_PL[f].toUpperCase()} SELL OUT`, `Retail inventory is gone for now. Restocks aren't guaranteed.`, null,'hobby');
      if ((dowOf(G.day)===2||dowOf(G.day)===5) && prod.stock[f]<12 && R()<0.55 && age<95){ prod.stock[f]+= f==='hobby'? ri(6,16): ri(25,60); if (G.live && prod.stock[f]>0 && before===0) addNews(`${prodName(prod).toUpperCase()} RESTOCKED`, `A fresh shipment of ${FMT_PL[f]} landed at the card shop.`, null,'hobby'); }
      // some of what sells at retail becomes NPC sealed inventory to flip later
      if (drain>0 && R()<0.12){ const n=pick(G.npcs.filter(x=>x.ty==='dealer'||x.ty==='flip')); makeSealed(prod.id, f, n.id, [G.day,'bought',B(prod).formats[f].price,'retail']); }
    }
    worldOpen(prod, Math.round(10*hype*early), null);
  }
}
function makeSealed(pid, f, owner, acq){ const id=G.nextSid++; G.sealed[id]={id, p:pid, f, o:owner, seed:Math.floor(R()*2e9), a:acq}; return G.sealed[id]; }

// ---- daily advance ----
function releaseTick(){
  for (const prod of G.products){
    if (!prod.cl && prod.rel===G.day){ genChecklist(prod); DCACHE.clear();
      if (G.live) addNews(`${prodName(prod).toUpperCase()} RELEASES TODAY`, B(prod).blurb, null,'release'); }
    if (G.live && !prod.cl && prod.rel===G.day+7) addNews(`${prodName(prod).toUpperCase()} ARRIVES NEXT WEEK`, `Collectors are lining up for ${B(prod).short}. Rookie checklist speculation has begun.`, null,'release');
  }
}
function advanceDay(){
  G.day++;
  const t=G.day;
  { const md=mdOf(t); if (packHas('sports') && md[0]===12 && md[1]===1 && !G.products.some(p=>p.yr===yearOf(t)+1)) scheduleYear(yearOf(t)+1); }
  simLeagueDay(t);
  releaseTick();
  for (const p of G.players){ p.S = playerScore(p); }
  fvClear();
  retailTick();
  if (dowOf(t)===1) { for (const n of G.npcs) n.cash += n.inc; refreshNPCTastes(); }
  if (G.cm && dowOf(t)===3) cmCatchUp();
  if (G.cm) cfvClear();
  marketTick();
  if (G.cm) cmMarketDay(t);
  if (G.hunt) huntDay(t);
  fvClear();
  for (const k in G.dp){ G.dp[k]*=0.955; if (G.dp[k]<0.004) delete G.dp[k]; }
  for (const k in G.sat){ G.sat[k]*=0.95; if (G.sat[k]<0.002) delete G.sat[k]; }
  if (t%3===0) for (const p of G.players){ if (p.tm===-1 && p.pot<60) continue; p.hx.push([t, Math.round(playerBase(p)*100)/100]); if (p.hx.length>140) p.hx.shift(); }
  if (G.live){
    if (dowOf(t)===5){ const pay=G.player.pay!=null?G.player.pay:50; if (pay>0){ G.player.cash += pay; G.player.paid=(G.player.paid||0)+pay; toast('Payday: '+money(pay)+' hobby money added'); } }
    gradingTick();
  }
  if (t%10===0) cullNPCCards();
}

// ---- grading service ----
const GRADE_TIERS = [ {id:'eco',n:'Economy',fee:18,days:14}, {id:'std',n:'Standard',fee:35,days:7}, {id:'exp',n:'Express',fee:80,days:3} ];
function submitGrading(cid, tier){
  const T=GRADE_TIERS.find(x=>x.id===tier); const c=C(cid);
  if (G.player.cash<T.fee) return 'Not enough cash for the '+T.n+' fee.';
  if (c.o!==0 || c.g!==0 || c.l) return 'That card can\'t be submitted right now.';
  G.player.cash-=T.fee; G.player.fees+=T.fee; c.g=-1;
  G.player.subs.push({id:G.nextLid++, cid, tier, t0:G.day, t1:G.day+T.days, fee:T.fee, raw:Math.round(cardValue(c)*100)/100});
  (c.h=c.h||[]).push([G.day,'Sent to GCS ('+T.n+')',T.fee,'']);
  return null;
}
function gradingTick(){
  const back = G.player.subs.filter(s=>s.t1<=G.day);
  for (const s of back){
    const c=C(s.cid); const g=gradeFrom(c); c.g=g; c.cert=ri(10000000,99999999); popAdd(c.k,g);
    c.gt=(c.gt||0)+1; G.player.skill++; if (!G.player.firstGraded) G.player.firstGraded=c.id;
    (G.player.rv=G.player.rv||[]).push({k:'c', id:c.id, g, raw:s.raw||0, fee:s.fee||0, t:G.day});
    (c.h=c.h||[]).push([G.day,'Graded GCS '+g+' '+GRADE_NAMES[g],0,'']);
    G.player.returned.unshift({cid:c.id, t:G.day, g}); if (G.player.returned.length>60) G.player.returned.length=60;
    toast('GCS returned '+pname(P(D(c.k).pid))+': '+g+' '+GRADE_NAMES[g], true);
  }
  G.player.subs = G.player.subs.filter(s=>s.t1>G.day);
}

// ---- player actions ----
function buyRetail(pid, f){
  const prod=G.products[pid]; const price=B(prod).formats[f].price;
  if (!inRetail(prod)) return 'This product is no longer at retail.';
  if (prod.stock[f]<=0) return 'Sold out at retail. Check the marketplace.';
  if (G.player.cash<price) return 'You need '+money(price)+' for this.';
  G.player.cash-=price; G.player.bought+=price; prod.stock[f]--;
  makeSealed(pid, f, 0, [G.day,'bought',price,'Card shop']);
  return null;
}
function openSealed(sid){
  const s=G.sealed[sid]; if (!s || s.o!==0 || s.l) return 'Can\'t open that.';
  const prod=G.products[s.p]; const packs=genSealed(prod, s.f, s.seed);
  const rng=mkRng(s.seed^0x5bd1e995);
  const cost=(s.a&&s.a[2])||0; const nCards=packs.flat().length;
  const src = prodName(prod)+' '+FMT_NAME[s.f].toLowerCase();
  const out = packs.map((pk,pi)=>pk.map(k=>{ const c=makeCard(k,0,[G.day,'pulled',Math.round(cost/nCards*100)/100, src+(packs.length>1?' · pack '+(pi+1):'')], rng); c.h=[[G.day,'Pulled from '+src,0,'']]; c.nw=1; return c.id; }));
  G.player.packs += packs.length;
  G.player.opened.unshift({t:G.day, p:s.p, f:s.f, cost, cards:out.flat()}); if (G.player.opened.length>40) G.player.opened.length=40;
  delete G.sealed[sid];
  G.player.pending = { p:s.p, f:s.f, packs:out, pi:0 };
  return null;
}
function buyListing(lid){
  const l=L(lid); if (!l || l.ty!=='bin') return 'That listing is gone.';
  if (l.sel===0) return 'That\'s your own listing.';
  if (G.player.cash<l.pr) return 'You need '+money(l.pr)+'.';
  transfer(l, 0, l.pr, 'bin'); return null;
}
function playerBid(lid, amt){
  const l=L(lid); if (!l || l.ty!=='auc') return 'That auction is over.';
  if (l.sel===0) return 'You can\'t bid on your own auction.';
  const min = l.bids.length ? l.cur+bidInc(l.cur) : l.pr;
  if (amt < min) return 'Your max bid must be at least '+money(min,true)+'.';
  if (G.player.cash < amt) return 'Your max bid can\'t exceed your cash.';
  placeBid(l, 0, amt);
  if (!G.player.watch.includes(lid)) G.player.watch.push(lid);
  return l.lead===0 ? null : 'Outbid instantly — another collector\'s max is higher. Current bid '+money(l.cur,true)+'.';
}
function playerOffer(lid, amt){
  const l=L(lid); if (!l || l.ty!=='bin' || l.sel===0) return {err:'Offers aren\'t possible here.'};
  if (G.player.cash<amt) return {err:'You don\'t have '+money(amt)+'.'};
  if (l.tried && l.tried>=2) return {err:'The seller has stopped responding to offers on this listing.'};
  l.tried=(l.tried||0)+1;
  const n=NPC(l.sel); const item=itemOf(l);
  const floor = Math.min(l.pr, item.v*Math.exp(gauss()*n.kn*0.5)) * ({dealer:0.9,flip:0.92,casual:0.8,high:0.9}[n.ty]||0.86);
  if (amt>=floor){ transfer(l,0,amt,'offer'); return {ok:'Offer accepted.'}; }
  if (amt>=floor*0.85){ const counter=nicePrice((floor+l.pr)/2); l.counter=counter; return {counter}; }
  return {no:'Declined. The seller isn\'t close to that number.'};
}
function playerList(it, ref, ty, price, dur, off){
  if (!(price>0)) return 'Enter a price.';
  const obj = it==='c'? C(ref) : it==='m'? G.mc[ref] : G.sealed[ref];
  if (!obj || obj.o!==0 || obj.l) return 'Not available to list.';
  if (it==='c' && obj.g<0) return 'That card is at the grader.';
  if (it==='m' && obj.g<0) return 'That comic is away being graded or pressed.';
  createListing(it, ref, 0, ty, price, dur, off); G.player.listed++;
  return null;
}
function answerOffer(lid, oid, accept, counter){
  const l=L(lid); if (!l) return 'Listing gone.'; const o=l.offers.find(x=>x.id===oid); if (!o) return 'Offer expired.';
  if (accept){ if (NPC(o.who).cash<o.amt) { l.offers=l.offers.filter(x=>x!==o); return 'The buyer backed out.'; } transfer(l,o.who,o.amt,'offer'); return null; }
  if (counter){ l.offers=l.offers.filter(x=>x!==o); if (counter<=o.val*0.98 && NPC(o.who).cash>=counter){ transfer(l,o.who,counter,'offer'); return null; } return 'Counter declined by '+NPC(o.who).h+'.'; }
  l.offers=l.offers.filter(x=>x!==o); return null;
}
function cancelListing(lid){ const l=L(lid); if (!l || l.sel!==0) return 'Listing not found.'; if (l.ty==='auc' && l.bids.length) return 'Auctions with bids can\'t be cancelled.'; removeListing(l); return null; }
function acceptCounter(lid){ const l=L(lid); if (!l || !l.counter) return 'The counteroffer has expired.'; if (G.player.cash<l.counter) return 'You need '+money(l.counter)+'.'; const amt=l.counter; delete l.counter; transfer(l,0,amt,'offer'); return null; }
function bulkSell(ids){ let n=0; for (const id of ids){ const c=C(id); if (!c||c.o!==0||c.l||c.g) continue; c.o=-9; delete G.cards[id]; n++; } const cash=Math.round(n*0.04*100)/100; G.player.cash+=cash; G.player.sold+=cash; return [n,cash]; }

// ---- new game ----
async function newGame(seed, prog){
  if (typeof resetCaches==='function') resetCaches();
  prog = prog || (async()=>{});
  G = { v:1, seed, rs:seed|0, day:dateToDay(2020,1,12), products:[], cards:{}, sealed:{}, npcs:[], lst:[], sales:{}, feed:[], dp:{}, sat:{}, ser:{}, pop:{},
    nextCid:1, nextSid:1, nextLid:1, live:false,
    player:{ cash:75, bought:0, sold:0, fees:0, packs:0, listed:0, skill:0, subs:[], returned:[], watch:[], follow:[], show:{}, opened:[], soldCards:[], notes:{}, tips:{}, pending:null, paid:0, start:0, fav:[] } };
  R = worldRnd; DCACHE.clear(); fvClear();
  if (packHas('sports')) initLeague(); else initNoLeague();           // comics and Wildkin builds have no baseball league
  if (packHas('sports')) for (let yr=2020; yr<=2025; yr++){
    await prog(0.05+(yr-2020)*0.09, 'Playing the '+yr+' season');
    G.day = dateToDay(yr,1,12);
    if (yr===2020) G.rookieClass[2020] = G.players.filter(p=>p.dy===2020 && p.tm>=0).map(p=>p.id); else newYear(yr,false);
    for (const id of G.rookieClass[yr]) { const p=P(id); if (p.tm===-1){ p.tm=p.org; } p.dy=yr; p.dd=0; }
    for (const p of G.players) p.S=playerScore(p);
    scheduleYear(yr);
    for (const prod of G.products.filter(p=>p.yr===yr)){ G.day=prod.rel; genChecklist(prod); }
    simSeasonFast(yr);
    offseason(yr,false);
  }
  for (const p of G.players){ p.S=playerScore(p); careerTotals(p); markMilestones(p); }
  G.day=dateToDay(2026,1,2); if (packHas('sports')) scheduleYear(2026);
  await prog(0.6,'Printing six years of cards'); makeNPCs(); refreshNPCTastes();
  G._npcCardIds=[];
  for (const prod of G.products.filter(p=>p.cl)) worldOpen(prod, B(prod).luxe? 40 : 190, null);
  await prog(0.64,'Sending slabs to GCS'); gradeNPCHoldings();
  if (packHas('comics')){ const d0=G.day; await cmGenerate(async(f,m)=>prog(0.65+f*0.06, m), dateToDay(2026,2,26)); G.day=d0; withCm(()=>{ makeComicNPCs(); G.day=dateToDay(2026,2,26); cmSeedMarket(); cmShopWeek(G.cm.last); G.day=d0; }); }
  for (const prod of G.products.filter(p=>p.cl)) for (const f in B(prod).formats){ const n=f==='hobby'?ri(2,5):ri(1,3); for (let i=0;i<n;i++) makeSealed(prod.id,f,pick(G.npcs.filter(x=>x.ty==='dealer'||x.ty==='high'||x.ty==='flip'||x.ty==='set')).id,[G.day,'bought',0,'']); }
  // run the world forward: league from Jan, market from March
  const start = dateToDay(2026,6,1);
  while (G.day < start-1){
    const marketOn = G.day >= dateToDay(2026,3,1);
    if (marketOn) advanceDay(); else { G.day++; simLeagueDay(G.day); releaseTick(); for (const p of G.players) p.S=playerScore(p); fvClear(); retailTick(); }
    if (G.day===dateToDay(2026,4,1)) G.live=true;
    if (G.day%6===0) await prog(0.7+0.3*(G.day-dateToDay(2026,1,2))/(start-dateToDay(2026,1,2)), G.day<dateToDay(2026,3,1)?'Spring training':'Opening the marketplace');
  }
  G.live=true;
  G.news = G.news.filter(n=>n.t>=dateToDay(2026,3,1));
  G.day = start-1; advanceDay();
  huntInit();
  G.player.cash=75; G.player.start=G.day; G.player.paid=0;
  return G;
}
function markMilestones(p){ const ct=careerTotals(p); const checks=isPitcher(p)?[[3,[150,200,250,300]],[5,[2000,2500,3000,3500]]]:[[3,[300,400,500,600]],[2,[2000,2500,3000]]]; for (const [i,ms] of checks) for (const m of ms) if (ct[i]>=m) p.ms[i+':'+m]=1; }

// ---- save / load ----
const SAVE_KEY='ccs_save_v1';
async function packState(){
  const json = JSON.stringify(G, saveReplacer);
  if (typeof CompressionStream!=='undefined'){
    const cs = new Blob([json]).stream().pipeThrough(new CompressionStream('gzip'));
    const buf = new Uint8Array(await new Response(cs).arrayBuffer());
    let bin=''; for (let i=0;i<buf.length;i+=0x8000) bin+=String.fromCharCode.apply(null, buf.subarray(i,i+0x8000));
    return 'gz:'+btoa(bin);
  }
  return 'js:'+json;
}
async function unpackState(s){
  if (s.startsWith('gz:')){
    const bin=atob(s.slice(3)); const buf=new Uint8Array(bin.length); for (let i=0;i<bin.length;i++) buf[i]=bin.charCodeAt(i);
    const ds = new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip'));
    return JSON.parse(await new Response(ds).text());
  }
  return JSON.parse(s.slice(3));
}
// Saves go to two places: this browser (fast) and the player's private
// slot in the artifact's database (survives leaving the page, other devices).
const CLOUD={ db:null, uid:null, slot:null, lastTs:0, lastOk:0, err:'' };
CLOUD.ready = (async()=>{
  try {
    if (typeof window==='undefined' || !window.claude || !window.claude.use) return false;
    const timeout = new Promise(r=>setTimeout(()=>r(null), 8000));
    const [db,user] = await Promise.all([Promise.race([window.claude.use('db'),timeout]), Promise.race([window.claude.use('user'),timeout])]);
    if (!db || !user) return false;
    const uid = await user.id(); if (!uid) return false;
    CLOUD.db=db; CLOUD.uid=uid; return true;
  } catch(e){ CLOUD.err=String(e&&e.message||e); return false; }
})();
const CHUNK=230000;
async function cloudSave(s, ts){
  if (!(await CLOUD.ready)) return false;
  const u='data/users/'+CLOUD.uid; const n=Math.ceil(s.length/CHUNK); const slot = CLOUD.slot==='A'?'B':'A';
  for (let i=0;i<n;i++) await CLOUD.db.doc(u+'/'+slot+i).set({ d:s.slice(i*CHUNK,(i+1)*CHUNK) });
  await CLOUD.db.doc(u+'/meta').set({ slot, n, ts, day:G.day, len:s.length, v:1 });
  CLOUD.slot=slot; CLOUD.lastOk=Date.now(); CLOUD.err=''; return true;
}
async function cloudLoad(){
  if (!(await CLOUD.ready)) return null;
  const u='data/users/'+CLOUD.uid;
  const m=await CLOUD.db.doc(u+'/meta').get(); if (!m.exists) return null;
  const meta=m.data(); CLOUD.slot=meta.slot;
  const parts=await Promise.all(Array.from({length:meta.n},(_,i)=>CLOUD.db.doc(u+'/'+meta.slot+i).get()));
  if (parts.some(p=>!p.exists)) return null;
  const s=parts.map(p=>p.data().d).join(''); if (s.length!==meta.len) return null;
  return { s, ts:meta.ts||0 };
}
let saving=false, saveAgain=false, lastCloud=0, cloudTimer=null, pendingStr=null;
async function saveGame(force){
  if (saving){ saveAgain=true; return; } saving=true;
  try {
    const ts=Date.now(); const s=await packState(); G._saveTs=ts;
    try { localStorage.setItem(SAVE_KEY, s); localStorage.setItem(SAVE_KEY+'_ts', String(ts)); G._localOk=true; } catch(e){ G._localOk=false; }
    pendingStr=[s,ts];
    const wait = force? 0 : Math.max(0, 4000-(Date.now()-lastCloud));
    clearTimeout(cloudTimer); cloudTimer=setTimeout(flushCloud, wait);
    G._saveOk = G._localOk || !!CLOUD.db;
  } catch(e){ G._saveOk=false; console.warn('save failed', e); }
  saving=false; if (saveAgain){ saveAgain=false; saveGame(); }
}
let flushing=false;
async function flushCloud(){
  if (!pendingStr || flushing) return; flushing=true;
  const [s,ts]=pendingStr; pendingStr=null; lastCloud=Date.now();
  try { await cloudSave(s,ts); } catch(e){ CLOUD.err=String(e&&e.code||e&&e.message||e); console.warn('cloud save failed', e); }
  flushing=false; if (pendingStr) flushCloud();
}
if (typeof document!=='undefined') document.addEventListener('visibilitychange', ()=>{ if (document.visibilityState==='hidden' && G && G.player && G.player.start) { clearTimeout(cloudTimer); flushCloud(); } });
async function loadGame(){
  let local=null, lts=0;
  try { local=localStorage.getItem(SAVE_KEY); lts=+(localStorage.getItem(SAVE_KEY+'_ts')||0); } catch(e){}
  let cloud=null; try { cloud=await cloudLoad(); } catch(e){ console.warn('cloud load failed', e); }
  const pickCloud = cloud && (!local || cloud.ts>=lts);
  const cands = pickCloud? [cloud.s, local] : [local, cloud&&cloud.s];
  for (const s of cands){ if (!s) continue;
    try { G = await unpackState(s); R=worldRnd; if (typeof resetCaches==='function') resetCaches(); DCACHE.clear(); fvClear(); G._npcCardIds=Object.keys(G.cards).map(Number).filter(id=>G.cards[id].o>0); if (G.cm) cmNormalize(); huntNormalize(); return true; }
    catch(e){ console.warn('load failed', e); } }
  return false;
}
async function importSave(s){ const g=await unpackState(s.trim()); if (!g || !g.player || !g.cards) throw new Error('Not a save file'); G=g; R=worldRnd; if (typeof resetCaches==='function') resetCaches(); DCACHE.clear(); fvClear(); G._npcCardIds=Object.keys(G.cards).map(Number).filter(id=>G.cards[id].o>0); if (G.cm) cmNormalize(); await saveGame(true); }
var toast = function(){};

// ===================== CARD ART =====================
const SKIN = ['#f1c9a5','#d9a47c','#b57a52','#8a5536','#5e3a24'];
const SVGC = new Map();
function hsh(s){ return hashStr(String(s)); }
function shade(hex, amt){ let c=parseInt(hex.slice(1),16); let r=(c>>16)&255, g=(c>>8)&255, b=c&255; if (amt<0){ r=r*(1+amt); g=g*(1+amt); b=b*(1+amt);} else { r=r+(255-r)*amt; g=g+(255-g)*amt; b=b+(255-b)*amt; } return '#'+[r,g,b].map(x=>Math.round(clamp(x,0,255)).toString(16).padStart(2,'0')).join(''); }
function lum(hex){ const c=parseInt(hex.slice(1),16); return (0.299*((c>>16)&255)+0.587*((c>>8)&255)+0.114*(c&255))/255; }

// stylized player figure; pose from position and variation
function figure(p, pose, c1, c2, uid){
  const skin=SKIN[p.sk]; const flip = (hsh(p.id)%3===0);
  const tf = flip? 'translate(250,0) scale(-1,1)' : '';
  const jersey = lum(c1)>0.7 ? c2 : '#f4f4f2';
  const trim = c1, pants = '#e9e9e6';
  let arms, extra='';
  if (pose==='pitch'){
    arms = `<path d="M118 150 L80 118 L62 86" stroke="${jersey}" stroke-width="15" fill="none" stroke-linecap="round"/><circle cx="60" cy="82" r="8" fill="${skin}"/><circle cx="54" cy="76" r="5" fill="#fff" stroke="#c33" stroke-width="1"/>
      <path d="M140 152 L170 170 L182 196" stroke="${jersey}" stroke-width="15" fill="none" stroke-linecap="round"/><ellipse cx="186" cy="202" rx="11" ry="13" fill="#6b3f1f"/>`;
  } else if (pose==='cheer'){
    arms = `<path d="M116 150 L96 112 L90 74" stroke="${jersey}" stroke-width="15" fill="none" stroke-linecap="round"/><circle cx="90" cy="70" r="8" fill="${skin}"/>
      <path d="M142 150 L162 112 L168 74" stroke="${jersey}" stroke-width="15" fill="none" stroke-linecap="round"/><circle cx="168" cy="70" r="8" fill="${skin}"/>`;
  } else if (pose==='field'){
    arms = `<path d="M116 156 L92 186 L84 212" stroke="${jersey}" stroke-width="15" fill="none" stroke-linecap="round"/><ellipse cx="82" cy="218" rx="13" ry="12" fill="#7a4a22"/>
      <path d="M142 156 L164 188 L170 210" stroke="${jersey}" stroke-width="15" fill="none" stroke-linecap="round"/><circle cx="171" cy="214" r="8" fill="${skin}"/>`;
  } else { // bat
    arms = `<path d="M118 152 L138 176 L156 150" stroke="${jersey}" stroke-width="15" fill="none" stroke-linecap="round"/>
      <path d="M140 150 L150 170 L158 150" stroke="${jersey}" stroke-width="14" fill="none" stroke-linecap="round"/><circle cx="158" cy="147" r="8" fill="${skin}"/>
      <path d="M160 146 L196 60" stroke="#c89b62" stroke-width="7" stroke-linecap="round"/><path d="M190 76 L198 56" stroke="#a87b45" stroke-width="10" stroke-linecap="round"/>`;
  }
  const crouch = pose==='field';
  const legs = crouch ? `<path d="M116 226 L96 262 L100 300" stroke="${pants}" stroke-width="18" fill="none" stroke-linecap="round"/><path d="M142 226 L166 262 L160 300" stroke="${pants}" stroke-width="18" fill="none" stroke-linecap="round"/>`
    : `<path d="M118 228 L108 280 L104 330" stroke="${pants}" stroke-width="18" fill="none" stroke-linecap="round"/><path d="M140 228 L152 280 L160 330" stroke="${pants}" stroke-width="18" fill="none" stroke-linecap="round"/>
       <path d="M104 318 L104 332" stroke="${trim}" stroke-width="18"/><path d="M160 318 L160 332" stroke="${trim}" stroke-width="18"/>`;
  return `<g transform="${tf}">
    ${legs}
    <path d="M106 142 Q129 128 152 142 L156 230 Q129 238 102 230 Z" fill="${jersey}" stroke="${trim}" stroke-width="3"/>
    <text x="129" y="196" text-anchor="middle" ${flip?'transform="translate(258,0) scale(-1,1)"':''} font-family="Barlow Condensed, Arial Narrow, sans-serif" font-weight="700" font-size="30" fill="${trim}">${p.num}</text>
    <rect x="102" y="222" width="54" height="8" fill="${trim}"/>
    ${arms}
    <rect x="122" y="118" width="14" height="14" fill="${skin}"/>
    <circle cx="129" cy="106" r="19" fill="${skin}"/>
    <path d="M109 104 Q110 82 129 82 Q149 82 150 104 Z" fill="${c1}"/>
    <path d="M146 100 Q162 100 168 106 L148 107 Z" fill="${shade(c1,-0.25)}"/>
    <circle cx="129" cy="82" r="2.5" fill="${shade(c1,-0.3)}"/>
  </g>`;
}
function sigPath(name){
  const r=mkRng(hsh(name)); let x=40, y=0, d=`M${x} ${y}`;
  const n = 6+Math.floor(r()*4);
  for (let i=0;i<n;i++){ const dx=12+r()*12; const up=-10-r()*16, dn=6+r()*10; d+=` C${(x+dx*0.3).toFixed(1)} ${up.toFixed(1)} ${(x+dx*0.7).toFixed(1)} ${dn.toFixed(1)} ${(x+dx).toFixed(1)} ${(r()*6-3).toFixed(1)}`; x+=dx; if (r()<0.25){ d+=` c-4 -14 -10 -10 -6 2`; } }
  d+=` M${50} ${10+r()*4} Q${x*0.6} ${16+r()*6} ${x+8} ${4}`;
  return d;
}
function parFill(par, uid){
  if (!par) return null;
  if (par.fin==='foil') return `url(#fo${uid})`;
  if (par.fin==='super') return `url(#su${uid})`;
  if (par.fin==='plate') return `url(#pl${uid})`;
  return par.col;
}
function defs(uid, par, c1){
  const pc = par? par.col : '#ccc';
  return `<defs>
    <linearGradient id="fo${uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8d969f"/><stop offset=".3" stop-color="#eef2f5"/><stop offset=".5" stop-color="#9aa3ab"/><stop offset=".75" stop-color="#f7f9fb"/><stop offset="1" stop-color="#7d868f"/></linearGradient>
    <linearGradient id="su${uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8a6a1f"/><stop offset=".25" stop-color="#f4e3a1"/><stop offset=".45" stop-color="#b8902f"/><stop offset=".7" stop-color="#fff2c4"/><stop offset="1" stop-color="#8a6a1f"/></linearGradient>
    <linearGradient id="pl${uid}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b8bec4"/><stop offset=".5" stop-color="#e6eaee"/><stop offset="1" stop-color="#a7aeb5"/></linearGradient>
    <linearGradient id="rf${uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff6b6b" stop-opacity=".35"/><stop offset=".2" stop-color="#ffd93d" stop-opacity=".3"/><stop offset=".4" stop-color="#6bff95" stop-opacity=".28"/><stop offset=".6" stop-color="#4dc4ff" stop-opacity=".3"/><stop offset=".8" stop-color="#b86bff" stop-opacity=".3"/><stop offset="1" stop-color="#ff6bd5" stop-opacity=".3"/></linearGradient>
    <linearGradient id="tint${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${pc}" stop-opacity=".55"/><stop offset="1" stop-color="${pc}" stop-opacity=".15"/></linearGradient>
    <pattern id="mesh${uid}" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="${c1}"/><circle cx="3" cy="3" r="1.3" fill="${shade(c1,-0.35)}"/></pattern>
    <pattern id="pin${uid}" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="#f1efe8"/><rect width="1.4" height="8" fill="${c1}"/></pattern>
    <clipPath id="cp${uid}"><rect x="0" y="0" width="250" height="350" rx="10"/></clipPath>
  </defs>`;
}
function cardFront(key, serial, opts){
  opts=opts||{};
  const ck = key+'#'+serial+(opts.small?'s':'');
  if (SVGC.has(ck)) return SVGC.get(ck);
  const d=D(key), p=P(d.pid), br=B(d.prod), yr=d.prod.yr;
  const car = p.car[yr-1]; const tmOnCard = (car && car.t>=0) ? car.t : (p.tm>=0?p.tm:p.org);
  const T=TEAMS_DEF[tmOnCard] || TEAMS_DEF[0]; const c1=T[3], c2=T[4];
  const uid = (hsh(ck)%1e7).toString(36);
  const par = d.parObj;
  const pose = d.sec==='v'||d.sec==='w' ? 'cheer' : isPitcher(p) ? 'pitch' : (hsh(p.id+yr)%4===0 ? 'field' : 'bat');
  const name = pname(p);
  const posTxt = p.pos;
  const cond = d.caseHit ? 'case' : d.ins ? 'ins' : br.tmpl;
  let body='';
  const pf = parFill(par, uid);
  const figSvg = figure(p, pose, c1, c2, uid);
  const rc = d.rc ? `<g transform="translate(206,18)"><path d="M0 0 H30 V22 L15 32 L0 22 Z" fill="#fff" stroke="#1b1b1b" stroke-width="2"/><text x="15" y="18" text-anchor="middle" font-family="Barlow Condensed,Arial Narrow,sans-serif" font-weight="800" font-size="15" fill="#c0282d">RC</text></g>` : '';
  const first = d.first ? `<g transform="translate(14,16)"><path d="M0 0 H46 L38 13 L46 26 H0 Z" fill="#111"/><text x="20" y="18" text-anchor="middle" font-family="Barlow Condensed,Arial Narrow,sans-serif" font-weight="800" font-size="15" fill="#f2c230">1ST</text></g>` : '';
  const serialTxt = serial && d.run ? `<text x="236" y="${cond==='lux'?330:250}" text-anchor="end" font-family="Barlow Condensed,Arial Narrow,sans-serif" font-weight="700" font-size="${d.run===1?15:13}" fill="${par&&par.fin==='super'?'#8a6a1f':'#fff'}" stroke="${par&&par.fin==='super'?'none':'rgba(0,0,0,.55)'}" stroke-width=".6" paint-order="stroke">${String(serial).padStart(String(d.run).length,'0')}/${d.run}</text>` : '';
  const autoBox = d.auto ? `<g transform="translate(30,${cond==='lux'?214:222})"><rect width="190" height="48" rx="6" fill="#fbfbf8" stroke="${pf||'#ccc'}" stroke-width="${pf?3:1.5}"/><path d="${sigPath(name)}" transform="translate(-6,26) scale(${Math.min(1.2,170/ (200))})" fill="none" stroke="#1d3fa3" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></g>` : '';
  const relic = d.relic ? `<g transform="translate(150,196)"><rect width="78" height="56" rx="4" fill="#111" /><rect x="4" y="4" width="70" height="48" rx="3" fill="url(#${hsh(p.id)%2?'mesh':'pin'}${uid})"/></g>` : '';
  const refr = par && (par.fin==='refr'||par.fin==='super') ? `<rect x="0" y="0" width="250" height="350" fill="url(#rf${uid})" style="mix-blend-mode:screen"/>` : '';
  const tint = par && par.fin==='refr' && par.run ? `<rect x="0" y="0" width="250" height="350" fill="url(#tint${uid})" style="mix-blend-mode:multiply"/>` : '';
  const F = 'font-family="Barlow Condensed,Arial Narrow,sans-serif"';
  if (cond==='dia'){
    const border = pf || '#fdfdfb';
    body = `<rect width="250" height="350" fill="${border}"/>
      <rect x="11" y="11" width="228" height="328" rx="4" fill="${c1}"/>
      <g opacity=".22"><path d="M11 60 L239 10 L239 40 L11 90 Z" fill="#fff"/><path d="M11 150 L239 100 L239 118 L11 168 Z" fill="#fff"/></g>
      <g clip-path="url(#cp${uid})"><svg x="11" y="11" width="228" height="328" viewBox="0 0 250 350">${figSvg}</svg></g>
      <path d="M11 268 L239 256 L239 339 L11 339 Z" fill="${c2}"/><path d="M11 268 L239 256 L239 262 L11 274 Z" fill="${border}"/>
      <text x="22" y="304" ${F} font-weight="800" font-size="27" fill="${lum(c2)>0.6?'#15181c':'#fff'}" textLength="${Math.min(206,name.length*14.5)}" lengthAdjust="spacingAndGlyphs">${esc(name.toUpperCase())}</text>
      <text x="22" y="326" ${F} font-weight="600" font-size="14" fill="${lum(c2)>0.6?'#15181c':'#fff'}" opacity=".85">${esc(T[0].toUpperCase()+' '+T[1].toUpperCase())}</text>
      <g transform="translate(20,20)"><path d="M14 0 L28 14 L14 28 L0 14 Z" fill="${border==='#fdfdfb'?'#fff':border}" stroke="#15181c" stroke-width="1.5"/><text x="14" y="19" text-anchor="middle" ${F} font-weight="800" font-size="13" fill="#15181c">D</text></g>
      <circle cx="222" cy="312" r="15" fill="${border==='#fdfdfb'?'#fff':border}" stroke="#15181c" stroke-width="1.2"/><text x="222" y="317" text-anchor="middle" ${F} font-weight="800" font-size="13" fill="#15181c">${posTxt}</text>`;
  } else if (cond==='nat'){
    const border = pf || '#ffffff';
    body = `<rect width="250" height="350" fill="${border}"/>
      <rect x="15" y="15" width="220" height="320" fill="${shade(c1,0.55)}"/>
      <rect x="15" y="15" width="220" height="320" fill="none" stroke="${c1}" stroke-width="5"/>
      <svg x="15" y="15" width="220" height="300" viewBox="0 0 250 340">${figSvg}</svg>
      <rect x="15" y="278" width="150" height="44" fill="${c1}"/><text x="24" y="301" ${F} font-weight="700" font-size="19" fill="#fff" textLength="${Math.min(134,name.length*10)}" lengthAdjust="spacingAndGlyphs">${esc(name)}</text>
      <text x="24" y="316" ${F} font-weight="500" font-size="12" fill="#fff" opacity=".85">${esc(T[1])} · ${posTxt}</text>
      <rect x="208" y="15" width="27" height="130" fill="${c2}"/><text transform="translate(227,138) rotate(-90)" ${F} font-weight="800" font-size="16" fill="${lum(c2)>0.6?'#111':'#fff'}" letter-spacing="2">NATIONAL</text>`;
  } else if (cond==='her'){
    const stock = par && par.fin==='stock' ? (par.run? '#b98c4a' : '#d9c9a3') : '#efe6cf';
    body = `<rect width="250" height="350" fill="${stock}"/>
      <rect x="18" y="18" width="214" height="252" rx="16" fill="${shade(c2,0.35)}" stroke="${shade(stock,-0.35)}" stroke-width="2"/>
      <svg x="18" y="14" width="214" height="256" viewBox="0 0 250 300"><g opacity=".92">${figSvg}</g></svg>
      <rect x="18" y="18" width="214" height="252" rx="16" fill="none" stroke="#fff" stroke-width="5" opacity=".6"/>
      <text x="30" y="46" font-family="Georgia,serif" font-style="italic" font-weight="700" font-size="24" fill="${c1}">${esc(T[1])}</text>
      <text x="125" y="300" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="19" fill="#2b2016" letter-spacing="1">${esc(name.toUpperCase())}</text>
      <line x1="40" y1="310" x2="210" y2="310" stroke="${c1}" stroke-width="2"/>
      <text x="125" y="328" text-anchor="middle" font-family="Georgia,serif" font-size="12" fill="#4a3b2a">${esc(T[0])} · ${p.pos}</text>
      <circle cx="210" cy="244" r="17" fill="${c1}" stroke="#fff" stroke-width="2"/><text x="210" y="249" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="12" fill="#fff">${posTxt}</text>`;
  } else if (cond==='vel'){
    const edge = pf || `url(#fo${uid})`;
    body = `<rect width="250" height="350" fill="${edge}"/>
      <rect x="8" y="8" width="234" height="334" rx="6" fill="#16191d"/>
      <g opacity=".55">${[0,1,2,3,4,5].map(i=>`<path d="M${-40+i*60} 350 L${120+i*60} 0 L${132+i*60} 0 L${-28+i*60} 350Z" fill="${i%2?c1:shade(c1,0.3)}" opacity="${0.25+0.1*(i%3)}"/>`).join('')}</g>
      <svg x="8" y="8" width="234" height="334" viewBox="0 0 250 350">${figSvg}</svg>
      <rect x="8" y="8" width="40" height="334" fill="${edge}" opacity=".92"/>
      <text transform="translate(36,330) rotate(-90)" ${F} font-weight="800" font-size="24" fill="#16191d" textLength="${Math.min(300,name.length*13)}" lengthAdjust="spacingAndGlyphs">${esc(name.toUpperCase())}</text>
      <text x="236" y="332" text-anchor="end" ${F} font-weight="700" font-size="13" fill="#fff" opacity=".85">${esc(T[1].toUpperCase())}</text>
      <text x="236" y="30" text-anchor="end" ${F} font-style="italic" font-weight="800" font-size="16" fill="#fff" opacity=".9">VELOCITY</text>`;
  } else if (cond==='spr'){
    const edge = pf || '#f6f7f8';
    body = `<rect width="250" height="350" fill="${edge}"/>
      <rect x="10" y="10" width="230" height="330" rx="4" fill="#fdfdfd"/>
      <path d="M10 120 L70 40 L105 80 L150 20 L240 110 L240 10 L10 10 Z" fill="${c1}"/>
      <path d="M150 20 L168 40 L156 38 L150 48 L140 36 Z" fill="#fff" opacity=".8"/>
      <rect x="10" y="10" width="230" height="330" fill="url(#tint${uid})" opacity="${par&&par.run?0.8:0}"/>
      <svg x="10" y="10" width="230" height="300" viewBox="0 0 250 330">${figSvg}</svg>
      <rect x="10" y="286" width="230" height="54" fill="${edge==='#f6f7f8'?c2:edge}"/>
      <text x="125" y="312" text-anchor="middle" ${F} font-weight="800" font-size="22" fill="${lum(edge==='#f6f7f8'?c2:(par?par.col:'#888'))>0.6?'#111':'#fff'}" textLength="${Math.min(210,name.length*12)}" lengthAdjust="spacingAndGlyphs">${esc(name.toUpperCase())}</text>
      <text x="125" y="330" text-anchor="middle" ${F} font-weight="600" font-size="12" fill="${lum(edge==='#f6f7f8'?c2:(par?par.col:'#888'))>0.6?'#111':'#fff'}" opacity=".85">${esc(TEAMS_DEF[p.org]?TEAMS_DEF[p.org][1].toUpperCase():'')} ORGANIZATION</text>`;
  } else if (cond==='lux'){
    const gold = pf && par.fin!=='super' ? pf : `url(#su${uid})`;
    body = `<rect width="250" height="350" fill="#0d0d0f"/>
      <rect x="10" y="10" width="230" height="330" rx="3" fill="none" stroke="${gold}" stroke-width="3"/>
      <rect x="18" y="18" width="214" height="200" fill="${shade(c1,-0.45)}"/>
      <svg x="18" y="10" width="214" height="208" viewBox="0 0 250 250"><g>${figSvg}</g></svg>
      <rect x="18" y="18" width="214" height="200" fill="none" stroke="${gold}" stroke-width="1.5"/>
      <text x="125" y="${d.auto?290:258}" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="20" fill="${gold}" letter-spacing="1.5">${esc(name.toUpperCase())}</text>
      <text x="125" y="${d.auto?308:278}" text-anchor="middle" font-family="Georgia,serif" font-size="11" fill="#bfae7a" letter-spacing="2">${esc(T[0].toUpperCase())}</text>
      <text x="22" y="334" font-family="Georgia,serif" font-size="10" fill="#bfae7a" letter-spacing="3">SUMMIT LUXE</text>`;
  } else if (cond==='ins'){
    const ins = br.ins[+d.sec.slice(1)];
    const bg = shade(c1,-0.2);
    body = `<rect width="250" height="350" fill="#111"/>
      <g opacity=".9">${Array.from({length:14},(_,i)=>`<path d="M125 200 L${125+300*Math.cos(i/14*Math.PI*2)} ${200+300*Math.sin(i/14*Math.PI*2)} L${125+300*Math.cos((i+0.5)/14*Math.PI*2)} ${200+300*Math.sin((i+0.5)/14*Math.PI*2)} Z" fill="${i%2?bg:shade(c2,-0.1)}"/>`).join('')}</g>
      <svg x="0" y="20" width="250" height="330" viewBox="0 0 250 350">${figSvg}</svg>
      <rect x="0" y="0" width="250" height="56" fill="#111" opacity=".85"/>
      <text x="125" y="38" text-anchor="middle" ${F} font-weight="800" font-style="italic" font-size="26" fill="#f4d35e" textLength="${Math.min(226,ins.n.length*14)}" lengthAdjust="spacingAndGlyphs">${esc(ins.n.toUpperCase())}</text>
      <rect x="0" y="302" width="250" height="48" fill="#111" opacity=".85"/>
      <text x="125" y="332" text-anchor="middle" ${F} font-weight="700" font-size="20" fill="#fff">${esc(name)}</text>
      <rect x="4" y="4" width="242" height="342" rx="8" fill="none" stroke="${pf||'#f4d35e'}" stroke-width="3"/>`;
  } else if (cond==='case'){
    body = `<rect width="250" height="350" fill="#10131a"/>
      ${Array.from({length:22},(_,i)=>{ const r=mkRng(i*31+hsh(key)); const x=r()*250,y=r()*350; return `<path d="M${x} ${y} l${30+r()*50} ${-20-r()*40} l${20+r()*30} ${40+r()*60} Z" fill="${['#3c7dd9','#9b59d0','#20b2aa','#e84393','#f4d35e'][i%5]}" opacity="${0.25+r()*0.35}"/>`; }).join('')}
      <svg x="0" y="10" width="250" height="330" viewBox="0 0 250 350">${figSvg}</svg>
      <path d="M0 290 L250 270 L250 350 L0 350Z" fill="#0a0c10" opacity=".9"/>
      <text x="125" y="318" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="19" fill="#f4e3a1" letter-spacing="1">${esc(name.toUpperCase())}</text>
      <text x="125" y="336" text-anchor="middle" font-family="Georgia,serif" font-size="10" fill="#bfc6d6" letter-spacing="3">${esc(br.caseHit.n.toUpperCase())}</text>
      <rect x="5" y="5" width="240" height="340" rx="8" fill="none" stroke="url(#su${uid})" stroke-width="4"/>`;
  }
  const svg = `<svg viewBox="0 0 250 350" xmlns="http://www.w3.org/2000/svg" class="cardsvg" role="img" aria-label="${esc(name+' '+yr+' '+br.name+' '+d.title)}">${defs(uid, par, c1)}<g clip-path="url(#cp${uid})">${body}${tint}${refr}${relic}${autoBox}${rc}${first}${serialTxt}</g></svg>`;
  SVGC.set(ck, svg); if (SVGC.size>600) SVGC.delete(SVGC.keys().next().value);
  return svg;
}
function cardBack(key, serial){
  const d=D(key), p=P(d.pid), br=B(d.prod), yr=d.prod.yr;
  const car = p.car[yr-1]; const T=TEAMS_DEF[(car&&car.t>=0)?car.t:(p.tm>=0?p.tm:p.org)]||TEAMS_DEF[0];
  const hit=isPitcher(p);
  const hdr = hit? ['YR','TM','W','L','ERA','K'] : ['YR','TM','AVG','HR','RBI','SB'];
  const rows=[]; for (let y=yr-4;y<yr;y++){ const c=p.car[y]; if(!c) continue; const s=c.s; rows.push(hit? [y, teamAbbr(c.t), s[3], s[4], s[2]? (s[6]*27/s[2]).toFixed(2):'—', s[5]] : [y, teamAbbr(c.t), s[1]?(s[2]/s[1]).toFixed(3).replace(/^0/,''):'—', s[3], s[4], s[5]]); }
  const F='font-family="Barlow Condensed,Arial Narrow,sans-serif"';
  const stock = br.tmpl==='her'? '#e3d6b4' : br.tmpl==='vel'||br.tmpl==='lux' ? '#2a2e33' : '#d9dcd6';
  const ink = br.tmpl==='vel'||br.tmpl==='lux' ? '#e8e8e8' : '#1c1f22';
  const bio = d.first ? `Signed with the ${TEAMS_DEF[p.org][1]} organization. ${p.pos}, age ${yr-p.by}.` : !rows.length ? (d.rc? `Rookie ${p.pos} for the ${T[1]}. Debut season ${p.dy}.` : `${p.pos}. Retired ${p.ry||''}. One of the enduring names of his era.`) : `${p.pos} · Age ${yr-p.by} · Pro since ${p.dy||'—'}`;
  return `<svg viewBox="0 0 250 350" xmlns="http://www.w3.org/2000/svg" class="cardsvg">
    <rect width="250" height="350" rx="10" fill="${stock}"/>
    <rect x="12" y="12" width="226" height="54" rx="4" fill="${T[3]}"/>
    <text x="22" y="36" ${F} font-weight="800" font-size="20" fill="#fff">${esc(pname(p).toUpperCase())}</text>
    <text x="22" y="56" ${F} font-size="13" fill="#fff" opacity=".85">${esc(T[0]+' '+T[1])}</text>
    <circle cx="214" cy="39" r="17" fill="#fff"/><text x="214" y="45" text-anchor="middle" ${F} font-weight="800" font-size="15" fill="${T[3]}">${esc(d.cardNo)}</text>
    <text x="16" y="88" ${F} font-size="12.5" fill="${ink}">${esc(bio)}</text>
    <g ${F} font-size="13" fill="${ink}">
      ${hdr.map((h,i)=>`<text x="${18+i*38}" y="118" font-weight="700">${h}</text>`).join('')}
      <line x1="16" y1="124" x2="234" y2="124" stroke="${ink}" stroke-width=".8" opacity=".5"/>
      ${rows.map((r,ri)=>r.map((v,i)=>`<text x="${18+i*38}" y="${144+ri*20}">${v}</text>`).join('')).join('')}
      ${rows.length?'':`<text x="18" y="148" opacity=".7">${d.first?'Minor league statistics not shown.':'No major league statistics.'}</text>`}
    </g>
    <text x="16" y="300" ${F} font-size="11" fill="${ink}" opacity=".75">${esc(d.setName)}${d.parObj?' · '+esc(d.parObj.n):''}${d.run?' · Numbered to '+d.run:''}</text>
    <text x="16" y="330" ${F} font-size="10" fill="${ink}" opacity=".6">© ${yr} ${esc(br.name)} Card Co. A fictional product.</text>
  </svg>`;
}
function slabSVG(card){
  const d=D(card.k), p=P(d.pid);
  const g=card.g; const title=(d.prod.yr+' '+B(d.prod).name).toUpperCase();
  const F='font-family="Barlow Condensed,Arial Narrow,sans-serif"';
  const cf = cardFront(card.k, card.s); const inner = `<g transform="translate(22 92) scale(0.904)">${cf.slice(cf.indexOf('>')+1, cf.lastIndexOf('</svg>'))}</g>`;
  return `<svg viewBox="0 0 270 430" xmlns="http://www.w3.org/2000/svg" class="cardsvg slab">
    <rect x="2" y="2" width="266" height="426" rx="12" fill="#dfe5ea" stroke="#b6c0c8" stroke-width="2"/>
    <rect x="10" y="10" width="250" height="72" rx="5" fill="#fff" stroke="#9aa6b0"/>
    <rect x="10" y="10" width="44" height="72" rx="5" fill="#b3261e"/><text x="32" y="52" text-anchor="middle" ${F} font-weight="800" font-size="17" fill="#fff" transform="rotate(-90 32 46)">GCS</text>
    <text x="62" y="30" ${F} font-size="11.5" fill="#222">${esc(title)} #${esc(d.cardNo)}</text>
    <text x="62" y="49" ${F} font-weight="800" font-size="16" fill="#111">${esc(pname(p).toUpperCase())}</text>
    <text x="62" y="66" ${F} font-size="11.5" fill="#333">${esc(d.title.toUpperCase())}${card.s&&d.run?' '+card.s+'/'+d.run:''}${d.auto?' AUTO':''}</text>
    <text x="62" y="78" ${F} font-size="9" fill="#666">CERT ${card.cert||''}</text>
    <text x="248" y="50" text-anchor="end" ${F} font-weight="800" font-size="34" fill="#111">${g}</text>
    <text x="248" y="70" text-anchor="end" ${F} font-weight="700" font-size="11" fill="#b3261e">${GRADE_NAMES[g]}</text>
    <rect x="18" y="88" width="234" height="324" rx="6" fill="#c9d2d9"/>
    ${inner}
  </svg>`;
}
function packArt(prod, fmt){
  const br=B(prod); const T = { dia:['#12324f','#c9a227'], nat:['#1f6fb2','#f2c230'], her:['#7a2d22','#efe6cf'], spr:['#1b4d3e','#e7f0ec'], vel:['#16191d','#9fb3c8'], lux:['#0d0d0f','#c9a227'] }[br.tmpl] || ['#333','#ccc'];
  const [a,b]=T; const F='font-family="Barlow Condensed,Arial Narrow,sans-serif"';
  if (fmt!=='pack'){
    return `<svg viewBox="0 0 300 220" xmlns="http://www.w3.org/2000/svg" class="boxsvg">
      <path d="M20 60 L150 20 L280 60 L150 100 Z" fill="${shade(a,0.25)}"/>
      <path d="M20 60 L150 100 L150 205 L20 165 Z" fill="${a}"/>
      <path d="M280 60 L150 100 L150 205 L280 165 Z" fill="${shade(a,-0.3)}"/>
      <text x="85" y="128" text-anchor="middle" ${F} font-weight="800" font-size="20" fill="${b}" transform="skewY(17) translate(0,-26)">${esc(br.short.toUpperCase())}</text>
      <text x="85" y="150" text-anchor="middle" ${F} font-weight="600" font-size="13" fill="#fff" transform="skewY(17) translate(0,-26)">${prod.yr} BASEBALL</text>
      <text x="215" y="126" text-anchor="middle" ${F} font-weight="700" font-size="13" fill="#fff" opacity=".8" transform="skewY(-17) translate(0,70)">${esc(FMT_NAME[fmt].toUpperCase())}</text>
    </svg>`;
  }
  return `<svg viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg" class="packsvg">
    <defs><linearGradient id="pk${prod.id}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${shade(a,-0.2)}"/><stop offset=".35" stop-color="${shade(a,0.18)}"/><stop offset=".55" stop-color="${a}"/><stop offset="1" stop-color="${shade(a,-0.3)}"/></linearGradient></defs>
    <g class="pk-top"><path d="M10 6 ${Array.from({length:18},(_,i)=>`L${10+(i+0.5)*10} ${i%2?6:0} L${10+(i+1)*10} 6`).join(' ')} L190 28 L10 28 Z" fill="${shade(a,-0.15)}"/>
    <rect x="10" y="20" width="180" height="10" fill="${b}" opacity=".85"/></g>
    <g class="pk-body"><rect x="10" y="30" width="180" height="250" fill="url(#pk${prod.id})"/>
    <path d="M10 280 ${Array.from({length:18},(_,i)=>`L${10+(i+0.5)*10} ${i%2?280:286} L${10+(i+1)*10} 280`).join(' ')}" fill="${shade(a,-0.15)}"/>
    <text x="100" y="120" text-anchor="middle" ${F} font-weight="800" font-size="34" fill="${b}">${esc(br.short.toUpperCase())}</text>
    <text x="100" y="146" text-anchor="middle" ${F} font-weight="600" font-size="16" fill="#fff" letter-spacing="3">${prod.yr} BASEBALL</text>
    <rect x="40" y="170" width="120" height="1.5" fill="${b}"/>
    <text x="100" y="196" text-anchor="middle" ${F} font-size="13" fill="#fff" opacity=".8">${br.formats[fmt]? br.formats[fmt].cards : ''} CARDS</text>
    <path d="M26 30 L60 30 L20 280 L10 280 L10 30 Z" fill="#fff" opacity=".08"/></g>
  </svg>`;
}
function thumbHTML(card, cls){
  const inner = card.g>0 ? slabSVG(card) : cardFront(card.k, card.s);
  return `<div class="thumb ${cls||''} ${card.g>0?'is-slab':''}">${inner}</div>`;
}

// ===================== COMICS: STATIC DATA =====================
const CG = [ // genres
  {k:'hero',n:'Superhero'},{k:'scifi',n:'Science fiction'},{k:'fantasy',n:'Fantasy'},{k:'horror',n:'Horror'},{k:'crime',n:'Crime'},
  {k:'mystery',n:'Mystery'},{k:'thriller',n:'Thriller'},{k:'western',n:'Western'},{k:'romance',n:'Romance'},{k:'comedy',n:'Comedy'},
  {k:'satire',n:'Satire'},{k:'slice',n:'Slice of life'},{k:'literary',n:'Literary'},{k:'historical',n:'Historical'},{k:'war',n:'War'},
  {k:'adventure',n:'Adventure'},{k:'ya',n:'Young adult'},{k:'kids',n:"Children's"},{k:'anthology',n:'Anthology'},{k:'exp',n:'Experimental'},
  {k:'alt',n:'Underground'},{k:'manga',n:'Manga-influenced'}
];
const GI = {}; CG.forEach((g,i)=>GI[g.k]=i);
// era: [startYear, name, genre weights in CG order]
const ERAS = [
  [1938,'Golden Age',      [10,3,1,4,6,2,1,5,6,5,2,1,0.2,1.5,4,5,1,6,3,0.1,0,0]],
  [1956,'Silver Age',      [12,5,1.5,1.5,1.5,1.5,1,4,5,4,3,1,0.3,1,4,3,2,5,2,0.3,1,0]],
  [1970,'Bronze Age',      [12,4,4,5,2,1.5,1.5,2,2,3,3,1,1,1,2.5,3,1.5,3,3,1,3,0.2]],
  [1985,'Creator boom',    [12,4,4,3,4,2,2,1,0.5,2,2,2,3,1.5,1,2,1,1.5,2,3,4,1.5]],
  [1993,'Speculator era',  [16,3,4,4,2,1,2,0.5,0.3,1.5,1,1.5,1.5,0.8,0.5,2,1,1,1,1.5,3,2]],
  [2000,'Modern era',      [11,4,4,5,5,2.5,3,1,1,2,1.5,2.5,3,1.5,1,2,2.5,2,1,1.5,2.5,3]],
  [2010,'Creator-owned wave',[9,6,5,5,4,2.5,3,1.5,1.5,2,1.5,3,3,1.5,0.8,2.5,3.5,3,1.5,1.5,2,3]],
  [2020,'Current era',     [8,5,6,7,3.5,3,3,1.5,2.5,2,1.5,3,3,1.5,0.6,2.5,4,4,1.5,1.5,2,4]]
];
function eraOf(yr){ let e=0; for (let i=0;i<ERAS.length;i++) if (yr>=ERAS[i][0]) e=i; return e; }
const TIER_N = ['Major publisher','Mid-size publisher','Established indie','Small press','Boutique press','Self-published'];
const TIERF = [1, 0.42, 0.2, 0.07, 0.035, 0.012];
// [name, short, tier, founded, folds, genre boosts {genreKey:mult}, imprints]
const PUB_DEF = [
  ['Vanguard Comics','VGD',0,1938,0,{hero:2.4,war:1.3,western:1.1},['Vanguard Midnight','Vanguard Junior']],
  ['Crown & Comet','C&C',0,1939,0,{hero:2.2,scifi:1.4,romance:1.3,kids:1.2},['Nocturne','Comet Kids']],
  ['Halcyon Periodicals','HAL',1,1946,1956,{horror:3,crime:3,war:1.5,romance:1.4},[]],
  ['Brightwater Comics','BRW',1,1949,0,{kids:3.5,comedy:3,romance:1.5,ya:1.5},[]],
  ['Gutter Press Collective','GPC',3,1968,0,{alt:5,satire:3,exp:3,literary:1.5},[]],
  ['Rat Alley Comix','RAC',3,1969,1986,{alt:6,satire:3,exp:2},[]],
  ['Northlight Publishing','NLP',1,1972,0,{scifi:2.5,fantasy:2.5,adventure:1.5},[]],
  ['Black Lantern Press','BLP',2,1981,0,{horror:2.2,crime:1.8,fantasy:1.4,literary:1.4},[]],
  ['Kestrel House','KSH',2,1984,0,{fantasy:2,adventure:1.8,scifi:1.5,manga:1.5},[]],
  ['Redshift Press','RSP',1,1986,0,{scifi:2.2,thriller:1.6,crime:1.4,hero:1.2},[]],
  ['Tin Roof Press','TRP',3,1987,0,{slice:3,literary:2.5,comedy:1.5,alt:1.5},[]],
  ['Undertow Comics','UND',2,1988,0,{crime:2.2,thriller:2,horror:1.6},[]],
  ['Bramble Books','BRB',3,1990,2011,{kids:2,fantasy:2,ya:2},[]],
  ['Monolith Comics','MON',0,1992,0,{hero:1.6,scifi:1.6,fantasy:1.4,horror:1.3,crime:1.2},['Monolith Edge']],
  ['Sable Crow Comics','SCC',1,1993,1998,{hero:2.5,fantasy:2,horror:1.8},[]],
  ['Fathom & Finch','F&F',2,1995,0,{literary:2.5,historical:2,mystery:1.8,romance:1.5},[]],
  ['Low Tide Comics','LTC',3,1999,0,{horror:2.2,alt:2,exp:1.8},[]],
  ['Quiet Hours Press','QHP',3,2003,0,{literary:2.5,slice:2.2,romance:1.8},[]],
  ['Paper Moth Books','PMB',1,2004,0,{ya:3,kids:2,literary:1.8,fantasy:1.6,manga:1.5},[]],
  ['Signal Fire Comics','SFC',2,2007,0,{scifi:2,thriller:1.8,crime:1.6,horror:1.5},[]],
  ['Copperline Comics','CPL',3,2009,0,{western:3,historical:2,crime:1.6},[]],
  ['Blue Heron Editions','BHE',4,2011,0,{literary:3,exp:2.5,slice:2},[]],
  ['Lodestar Comics','LDS',2,2012,0,{fantasy:2.2,scifi:2,ya:1.6,manga:1.6},[]],
  ['Dogear Editions','DGE',3,2014,0,{comedy:2.5,satire:2,slice:2,kids:1.5},[]],
  ['Static Cling Press','SCP',4,2016,0,{alt:3,exp:3,horror:1.6},[]],
  ['Wildfell Press','WFP',3,2017,0,{horror:2.5,fantasy:2,romance:1.6},[]],
  ['Ampersand & Ink','A&I',4,2019,0,{romance:2.5,slice:2,ya:2},[]],
  ['Moonrise Comics','MRC',3,2021,0,{manga:2.5,fantasy:2,ya:2},[]],
  ['Grayhaven Micro','GHM',4,2022,0,{horror:2.4,mystery:2,exp:1.6},[]],
  ['Riverbend Zine Co.','RZC',4,2024,0,{alt:3,slice:2.5,comedy:1.8},[]]
];
const STUDIOS_FILM = ['Silverframe Pictures','Northbeam Studios','Paperkite Films','Harborlight Entertainment','Redwood Circle Films','Meridian Road Pictures','Old Lantern Films'];
const STUDIOS_TV = ['Lanternfish Television','Tidewater+','Loop Streaming','Cinderbox','Broadcast Seven','Halfmoon Network'];
const OUTLETS = ['Panel & Page','The Gutter Report','Inkwire','Longbox Weekly','Splash Page Review'];
const AWARD_NAME = 'Quill & Panel Awards';
const AWARD_CATS = [['bs','Best Continuing Series'],['bn','Best New Series'],['bl','Best Limited Series'],['bw','Best Writer'],['ba','Best Artist'],['bg','Best Graphic Novel'],['bi','Best Single Issue']];
const CONS = [['Harbor City Comic Expo',7,23],['Paper Trails Small Press Fest',9,17],['Northfall Comic Con',10,8]];
const SHOP_NAME = 'Second Panel Comics';

// names (creators and non-costumed characters)
const CFN = ['Mara','Tomas','Ines','Theo','June','Arlo','Priya','Dev','Noor','Felix','Ada','Rafe','Sunny','Iris','Otto','Lena','Cass','Wendell','Hana','Bram','Odette','Kai','Rosa','Emil','Vera','Silas','Nadia','Jonah','Mireille','Ezra','Lucia','Gus','Tamsin','Idris','Beatrix','Lou','Yuki','Marcus','Pilar','Anselm','Greta','Colm','Zadie','Ray','Wren','Hollis','Delphine','Abe','Signe','Tobias','Leilani','Moss','Freya','Nico','Ottilie','Sol','Rhea','Bastian','Clementine','Dario','Esme','Fitz','Gwen','Hugo','Imogen','Jem','Kit','Lotte','Milo','Nell','Orla','Pax','Quentin','Ruth','Sami','Tove','Una','Vik','Winnie','Xavi','Yara','Zeke','Anouk','Baz','Celeste','Dolores','Eamon','Fern'];
const CLN = ['Ellison','Vale','Okonkwo','Marchetti','Brandt','Castellanos','Holm','Achebe','Sorensen','Varga','Lindqvist','Oyelaran','Delacroix','Ferreira','Nakamura','Quill','Harrow','Szabo','Ibarra','Fenwick','Abernathy','Mbeki','Rourke','Strand','Takahashi','Voss','Kowalczyk','Adeyemi','Moreau','Grieve','Paquette','Hollister','Ruiz','Sato','Blackwood','Kincaid','Nwosu','Petrov','Lachance','Whitcombe','Esposito','Dunleavy','Farrow','Galloway','Haddad','Iversen','Jovanovic','Kaur','Lemaire','Mendoza','Norrell','Ostrowski','Pike','Quesnel','Roscoe','Salinger','Tran','Umberto','Vasquez','Winslow','Yilmaz','Zeller','Aldana','Bergeron','Crane','Dorsey','Emberly','Fontaine','Gallant','Hawthorne','Ilunga','Jansen','Kessler','Lowell','Marlow','Nygaard','Orsini','Pemberton','Quarry','Rasmussen','Sinclair','Thibault','Underhill','Valdez','Wexford','Yeats'];
// costumed names
const HP = ['Captain','Doctor','Kid','Lady','Mister','Miss','Night','Star','Iron','Silver','Red','Blue','Black','White','Storm','Shadow','Solar','Quantum','Atomic','Crimson','Golden','Steel','Thunder','Moon','Sky','Void','Phantom','Ultra','Wild','Ember','Glass','Hollow','Rust','Tidal','Winter','Signal','Neon','Paper','Brass','Cobalt'];
const HN = ['Wren','Comet','Sentinel','Spectre','Blaze','Bolt','Mantle','Warden','Lancer','Ranger','Siren','Viper','Lynx','Kestrel','Tempest','Vanguard','Cipher','Orbit','Nova','Jaguar','Heron','Hammer','Magpie','Fathom','Pilgrim','Beacon','Harrier','Gargoyle','Jackal','Marauder','Paragon','Monarch','Specter','Rook','Swift','Talon','Vesper','Zephyr','Anvil','Juggernaut','Nightjar','Skylark','Thorn','Cinder','Mirage'];
const HBLOCK = new Set(['Moon Knight','Night Hawk','Red Arrow','Captain Comet','Black Knight','Iron Fist','Night Owl','Red Hawk','Black Hawk','Doctor Fate','Black Canary','Iron Man','Night Wing','Star Fire','Black Bolt','Kid Flash','Blue Beetle','Captain Atom','Black Panther','Night Crawler','Black Widow','Night Shade','Moon Stone','Captain Marvel','Silver Surfer','Doctor Doom','Captain Cold','Black Lightning','Kid Eternity','Star Lord','Iron Lad','Red Tornado','Doctor Light','Mister Miracle','Captain Boomerang','Shadow Cat','Storm Shadow','Lady Death','Doctor Mid-Nite','Ultra Boy','Star Sapphire','White Tiger','Blue Marvel','Miss Martian','Solar Man','Moon Girl','Thunder Bolt','Void Knight','Golden Age','Steel Mantle']);
const TEAMN = ['League','Legion','Squad','Society','Brigade','Assembly','Order','Circle','Guard','Syndicate','Company','Corps'];
const TEAMA = ['Midnight','Emerald','Iron','Last','Outer','Silver','Signal','Vanguard','Northern','Hidden','Tomorrow','Paragon','Harbor','Lantern'];

// title word banks
const TA = ['Hollow','Silent','Last','Crimson','Broken','Quiet','Burning','Glass','Pale','Wild','Drowned','Lonely','Endless','Golden','Black','Little','Second','Midnight','Winter','Forgotten','Bright','Salt','Paper','Ghost','Velvet','Distant','Sunken','Shattered','Northern','Savage','Gentle','Strange','Final','Hidden','Violet','Lucky','Wicked','Tender','Rusted','Sleeping','Holy','Crooked','Borrowed','Starving','Sweet','Bitter','Lost','Blue','Ninth','Empty'];
const TN = ['Crown','Orchard','Harbor','Signal','Garden','Kingdom','Engine','Lantern','Ferry','Choir','Frontier','Circus','Mile','Tide','Witness','Parish','Archive','Machine','House','River','Hour','Season','Country','Empire','Road','Frequency','Hunger','Oath','Sparrow','Wolf','Moth','Saint','Stranger','Orbit','Horizon','Harvest','Island','Chapel','Diner','Motel','Lighthouse','Mountain','Well','Carnival','Radio','Kitchen','Library','Station','Vineyard','Quarry'];
const TPLACE = ['Ashfall','Greyhaven','Coldwater','Marrow Creek','Bellwether','Low Hollow','Kessler Point','Vesper Bay','Station Nine','Saltmarsh','Tannery Row','Dunmore','Half Moon Bay','Brackwater','Juniper Falls','Hesper','Cinder Flats','Oldcastle','Northgate','Sorrow Ridge','Pale River','Candle Street','Wolf County','Fennick Island'];
const GENRE_WORDS = {
  scifi:['Starfall','Void','Colony','Outpost','Drift','Parallax','Hyperion','Singularity','Ark','Relay','Nebula','Exodus','Cosmonaut','Satellite','Tessellate','Zero Point','Afterlight','Deep Field','Red Planet','Lightyear'],
  fantasy:['Thornwood','Dragonmere','Spellbound','Wyrm','Rune','Hearthstone','Witchlight','Moonblade','Fae','Grimoire','Starthorn','Kingsbane','Oakheart','Emberfall','Mistral','Hexen','Wandering Keep','Silverfen','Barrow','Wyldwood'],
  horror:['Rot','Hollowing','Dread','Carrion','The Unquiet','Nightsoil','Pallor','Wormwood','Bone Garden','Harrowed','Gloam','The Visitor','Cellar','Rust Belt Gothic','Teeth','Lamb','Hush','Pale Thing','Dollhouse','Ossuary'],
  crime:['Blues','Dead Drop','Hard Luck','Night Shift','Cold Case','Payday','Getaway','Snitch','Heist','Pawn','Long Con','Bad Blood','Vice','The Fixer','Kickback','Wire','Knuckles','Bagman','Dirty Money','Gun Moll'],
  mystery:['Clue','Riddle','The Locked Room','Whodunit','Inquest','Case File','Alibi','The Detective','Red Herring','Cipher Club','The Vanishing','Missing','Casebook','The Inspector','Keyhole'],
  thriller:['Burn Notice','Blackout','Countdown','Extraction','Safehouse','Cold Open','Deadline','Kill Switch','Tripwire','Zero Hour','Cold Protocol','Handler','Asset'],
  western:['Dust','Six-Gun','Rawhide','Sundown','Maverick','Tumbleweed','Gold Rush','Outlaw','Saddle','Frontier Law','Buckshot','Wanted','High Noon','Iron Horse','Coyote'],
  romance:['Sweetheart','True Love','Heartstrings','First Kiss','Secret Hearts','Love Letters','Forever Yours','Moonlight Kiss','Girl Next Door','Summer Fling','Wedding Bells','Lovelorn'],
  comedy:['Pals','Hijinks','Goofballs','Oddballs','Nutty','Slapstick','Wisecracks','Mischief','Knuckleheads','Boneheads','Rascals'],
  satire:['Cracked Mirror','Buffoon','Snark','Folly','The Absurd','Lampoon','Spoof','Jester','Punchline','Grotesque'],
  slice:['Days','Roommates','Weekend','Lunch Break','Small Town','Neighbours','The Commute','Porch Light','Rent','Night Market','Laundromat','Part-Time'],
  literary:['Elegy','Anatomy of','Portrait','Testament','Almanac','Ledger','Correspondence','Requiem','Inheritance','Aftermath','Tributary','Palimpsest'],
  historical:['Dynasty','Revolution','Empire','Crusade','Pioneers','Chronicle','Armada','Siege','Rebellion','Legion','Plague Year'],
  war:['Combat','Battlefront','Foxhole','Airborne','Frontline','Warbirds','Dogfight','Trench','Sergeant','Company','Blitz','Commando','Sub Hunter'],
  adventure:['Expedition','Treasure','Jungle','Voyage','Explorer','Castaway','Pirates','Lost World','Safari','Quest','Atlas','Compass'],
  ya:['Senior Year','Homeroom','Spellschool','Summer Camp','The New Kid','Detention','Prom','Varsity','Graduation','Locker 13'],
  kids:['Bunny Town','Pip & Button','Captain Carrot','Tiny Robots','Pupcakes','Moon Mice','Wobble','Treehouse','Picnic Planet','Doodlebug','Jellybean','Snowpup'],
  anthology:['Tales','Stories','Showcase','Theatre','Weird Tales of','Chillers','Parade','Omnibus of Oddities','Mystery Hour'],
  exp:['Glyph','Static','Signal/Noise','Recursion','Fragments','Collage','Negative Space','Folds','Loop','Aperture'],
  alt:['Comix','Raw Nerve','Weirdo','Zap Street','Underground','Sludge','Head Trip','Freak Show','Mutant Suburb','Grease'],
  manga:['Blade Dancer','Spirit Circuit','Neo Tokyo Nights','Shonen Star','Kitsune Road','Mecha Heart','Sakura Street','Ghost Idol','Oni Rising','Ramen Knights']
};
const PREMISE = {
  hero:['A {job} discovers {power} and takes up the mantle of {hero}.','{hero} returns after a decade away to find the city has moved on.','A team of reluctant heroes fights a threat none of them can face alone.','The sidekick of a fallen legend steps out of the shadows.'],
  scifi:['The crew of a salvage ship finds something alive in a dead colony.','A generation ship is two centuries late and the passengers are waking up.','An engineer on a failing orbital station uncovers who is sabotaging it.','First contact goes wrong in the most bureaucratic way possible.'],
  fantasy:['A beastkeeper sworn to a dying queen must hide the last dragon egg.','Three siblings inherit a map to a kingdom that no longer exists.','A witch who cannot lie is hired to guard the court of liars.','The gods have gone quiet, and a village priest goes looking for them.'],
  horror:['Something has been living under the orchard for longer than the town has existed.','A night-shift nurse keeps seeing the same patient die.','A family moves into a house that remembers everyone who lived there.','In a flooded mill town, the children stopped aging.'],
  crime:['A getaway driver tries to quit after one last job goes sideways.','A disgraced detective works cold cases nobody wants solved.','Two brothers run a pawn shop that fences more than jewellery.','A small-town sheriff finds a suitcase of money and a body.'],
  mystery:['A retired magician solves murders at a seaside hotel.','A librarian notices the same book returned by a dead man.','An amateur sleuth club of pensioners takes on a missing-person case.'],
  thriller:['A spy wakes up with a new face and someone else\'s mission.','A journalist has 72 hours to prove a conspiracy before she vanishes.','An extraction specialist must rescue the man who ruined her life.'],
  western:['A widow hunts the gang that burned her homestead.','A travelling doctor keeps a frontier town alive, and its secrets buried.','The last stagecoach line in the territory runs through outlaw country.'],
  romance:['Two rival florists fall for each other over one very long summer.','A nurse and a pilot write letters across a war.','A matchmaker who has never been in love meets her match.'],
  comedy:['Three roommates try to run a haunted bed-and-breakfast.','A hapless inventor\'s gadgets cause chaos in a sleepy suburb.','A kid and his dog get into trouble every single week.'],
  satire:['A superhero union goes on strike.','Corporate middle managers compete to become emperor of a collapsing company.','An advertising agency accidentally starts a religion.'],
  slice:['Life in a 24-hour diner, one regular at a time.','Two sisters run their late father\'s bookshop.','A year in the life of a small-town radio host.'],
  literary:['A daughter reconstructs her mother\'s life from a box of letters.','A graphic memoir of growing up above a laundromat.','An old sailor recounts the voyage that ended his career.'],
  historical:['The rise and fall of a merchant dynasty in a port city.','A codebreaker\'s war, told from the operator\'s chair.','A revolution seen through the eyes of a printer\'s apprentice.'],
  war:['A bomber crew flies its last twenty missions.','A platoon holds a bridge for six impossible days.','A medic crosses the front lines to bring back a friend.'],
  adventure:['An archaeologist and her rival race to a lost city.','A sea captain chases a legendary whale of pure gold.','Explorers map a hollow world beneath the ice.'],
  ya:['A shy student joins the school\'s secret monster-hunting club.','Four friends spend the summer before college solving a disappearance.','A girl discovers her school is a training ground for witches.'],
  kids:['A bunny postmaster delivers letters to every creature in the forest.','Tiny robots help a little girl fix the town\'s broken clock.','Two mice build a rocket out of teacups.'],
  anthology:['Short tales of the strange and uncanny from rotating creators.','A showcase of new voices, a different story every issue.'],
  exp:['A wordless comic told entirely through the rooms of one apartment.','A story that folds in on itself, one panel at a time.'],
  alt:['Scenes from a scuzzy city seen through a cartoonist\'s crooked eye.','Autobiographical strips about bad jobs and worse apartments.'],
  manga:['A sword prodigy enters a tournament to free her village.','A delivery boy discovers his scooter is a spirit in disguise.','Idols by day, demon hunters by night.']
};
const JOBS=['night-shift paramedic','high-school chemistry teacher','bike courier','disgraced cop','museum curator','struggling musician','subway engineer','marine biologist','sanitation worker','junior reporter'];
const POWERS=['impossible speed','the ability to bend light','a stolen alien gauntlet','control over storms','a sentient shadow','an ancient armour','the voices of the dead','perfect memory','gravity itself'];
const CM_HANDLE_A = ['longbox','panel','gutter','ink','keyissue','firstapp','slabbed','cover','variant','backissue','silverage','bronze','indie','spec','pulp','dimebin','mylar','boards','newsstand','splash','fourcolor','wednesday'];
const KEY_N = { fa:'First appearance', cam:'First cameo', ss:'First solo series', dth:'Death of', ret:'Return of', cos:'New costume for', ori:'Origin of', team:'First appearance of the team', arc:'Start of a major storyline', ic:'Iconic cover', cont:'Controversial issue', ann:'Anniversary issue', cd:'Creator debut', ct:'New creative team', fin:'Final issue', aw:'Award-winning issue', as:'Adapted storyline', one:'First issue' };

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

// ===================== COMICS: COVER ART =====================
const CM_PAL = {
  hero:[['#c8102e','#1c3f94','#f2c230'],['#1b1b6f','#e63946','#f1faee'],['#0b6e4f','#f4d35e','#ee964b'],['#5b2a86','#f7b32b','#e4572e']],
  scifi:[['#0b132b','#3a506b','#5bc0be'],['#1a0933','#7b2cbf','#ff9e00'],['#022b3a','#1f7a8c','#e1e5f2']],
  fantasy:[['#2d1e2f','#c5a880','#6a994e'],['#14213d','#fca311','#e5e5e5'],['#3d2645','#832161','#f0eff4']],
  horror:[['#0d0d0d','#6a040f','#e9d8a6'],['#1b2021','#4f772d','#d4e09b'],['#10002b','#9d0208','#ffba08']],
  crime:[['#111111','#b08968','#e63946'],['#1d2d44','#f0ebd8','#cf5c36'],['#22223b','#c9ada7','#f2e9e4']],
  mystery:[['#1b263b','#e0e1dd','#778da9'],['#2b2d42','#edf2f4','#ef233c']],
  thriller:[['#0f0f0f','#ff5400','#e0e0e0'],['#14213d','#fca311','#ffffff']],
  western:[['#6f1d1b','#bb9457','#ffe6a7'],['#582f0e','#e76f51','#f4a261']],
  romance:[['#ff8fab','#fb6f92','#fff0f3'],['#9d4edd','#ffafcc','#fefae0']],
  comedy:[['#ffbe0b','#fb5607','#3a86ff'],['#8ac926','#ff595e','#1982c4']],
  satire:[['#f4f1de','#e07a5f','#3d405b'],['#fcbf49','#003049','#d62828']],
  slice:[['#ccd5ae','#e9edc9','#d4a373'],['#a8dadc','#457b9d','#f1faee']],
  literary:[['#f5ebe0','#d6ccc2','#6b705c'],['#edede9','#3d405b','#e07a5f']],
  historical:[['#6b4226','#d9ae61','#f3e9d2'],['#344e41','#a3b18a','#dad7cd']],
  war:[['#4a5d23','#c2b280','#8b0000'],['#3e3e3e','#a4ac86','#e8e8e8']],
  adventure:[['#2a9d8f','#e9c46a','#e76f51'],['#1d3557','#e9c46a','#a8dadc']],
  ya:[['#7209b7','#4cc9f0','#f72585'],['#06d6a0','#118ab2','#ffd166']],
  kids:[['#ffd60a','#00b4d8','#ff006e'],['#90e0ef','#ffb703','#fb8500']],
  anthology:[['#264653','#e9c46a','#f4a261'],['#3c1642','#1dd3b0','#affc41']],
  exp:[['#ffffff','#000000','#e63946'],['#f1f1f1','#1a1a1a','#ffd400']],
  alt:[['#f6f1e7','#1a1a1a','#d62828'],['#e9e3d5','#2b2b2b','#6a994e']],
  manga:[['#ffffff','#111111','#ef476f'],['#f8f9fa','#212529','#4361ee']]
};
const CVC = new Map();
function comicCover(key){
  let h=CVC.get(key); if (h) return h;
  h = comicCover0(key); if (CVC.size>1500) CVC.clear(); CVC.set(key,h); return h;
}
function cmArt(g, r, P, W, H, sk){
  const [a,b,c]=P; const F=sk?'none':''; const st = sk? `stroke="#222" stroke-width="2" fill="none"` : '';
  const fill = x=> sk? 'none' : x;
  const k=CG[g].k; let o='';
  const stars=n=>Array.from({length:n},()=>`<circle cx="${(r()*W).toFixed(0)}" cy="${(r()*H*0.6).toFixed(0)}" r="${(r()*1.4+0.3).toFixed(1)}" fill="${sk?'#222':'#fff'}" opacity=".8"/>`).join('');
  const skyline=(y,col)=>{ let x=0, p=`M0 ${H}`; while(x<W){ const w=10+r()*22, hh=20+r()*60; p+=` L${x.toFixed(0)} ${(y-hh).toFixed(0)} L${(x+w).toFixed(0)} ${(y-hh).toFixed(0)}`; x+=w; } p+=` L${W} ${H} Z`; return `<path d="${p}" ${sk?st:`fill="${col}"`}/>`; };
  const person=(x,y,s,col,cape)=>`<g transform="translate(${x} ${y}) scale(${s})" ${sk?st:`fill="${col}"`}>${cape?`<path d="M-18 -30 Q-40 20 -30 60 L30 60 Q40 20 18 -30 Z" ${sk?'':`fill="${shade(col,-0.3)}"`}/>`:''}<circle cx="0" cy="-48" r="13"/><path d="M-16 -32 L16 -32 L20 20 L10 20 L8 60 L-8 60 L-10 20 L-20 20 Z"/><path d="M-16 -30 L-34 -58 M16 -30 L34 -8" stroke="${sk?'#222':col}" stroke-width="9" stroke-linecap="round"/></g>`;
  switch(k){
    case 'hero': o = `<rect width="${W}" height="${H}" fill="${fill(a)}"/>${Array.from({length:14},(_,i)=>`<path d="M${W/2} ${H*0.42} L${(W/2+Math.cos(i/14*6.283)*400).toFixed(0)} ${(H*0.42+Math.sin(i/14*6.283)*400).toFixed(0)} L${(W/2+Math.cos((i+0.5)/14*6.283)*400).toFixed(0)} ${(H*0.42+Math.sin((i+0.5)/14*6.283)*400).toFixed(0)} Z" fill="${sk?'none':shade(a,0.15)}" ${sk?'stroke="#bbb"':''}/>`).join('')}${skyline(H,shade(b,-0.4))}${person(W/2+(r()-0.5)*30, H*0.5, 1.4+r()*0.3, b, true)}`; break;
    case 'scifi': o = `<rect width="${W}" height="${H}" fill="${fill(a)}"/>${sk?'':stars(40)}<circle cx="${(W*0.3+r()*W*0.4).toFixed(0)}" cy="${(H*0.35).toFixed(0)}" r="${(40+r()*30).toFixed(0)}" ${sk?st:`fill="${b}"`}/><ellipse cx="${W*0.5}" cy="${H*0.35}" rx="85" ry="14" fill="none" stroke="${sk?'#222':c}" stroke-width="3" transform="rotate(-15 ${W/2} ${H*0.35})"/><path d="M${W*0.2} ${H*0.8} L${W*0.55} ${H*0.66} L${W*0.62} ${H*0.72} L${W*0.3} ${H*0.84} Z" ${sk?st:`fill="${c}"`}/>`; break;
    case 'fantasy': o = `<rect width="${W}" height="${H}" fill="${fill(a)}"/><circle cx="${W*0.7}" cy="${H*0.3}" r="30" ${sk?st:`fill="${c}"`} opacity=".9"/><path d="M0 ${H*0.8} L${W*0.25} ${H*0.5} L${W*0.45} ${H*0.72} L${W*0.7} ${H*0.45} L${W} ${H*0.75} L${W} ${H} L0 ${H} Z" ${sk?st:`fill="${shade(b,-0.4)}"`}/><path d="M${W*0.55} ${H*0.62} l0 -40 l8 0 l0 -10 l6 0 l0 10 l8 0 l0 -18 l10 -12 l10 12 l0 58 Z" ${sk?st:`fill="${shade(a,-0.5)}"`}/><path d="M${W*0.15} ${H*0.3} q30 -30 60 -5 q-20 5 -30 20 q-10 -10 -30 -15 Z" ${sk?st:`fill="${b}"`}/>`; break;
    case 'horror': o = `<rect width="${W}" height="${H}" fill="${fill(a)}"/><circle cx="${W*0.62}" cy="${H*0.32}" r="${(38+r()*14).toFixed(0)}" ${sk?st:`fill="${c}"`}/><path d="M${W*0.2} ${H} L${W*0.22} ${H*0.55} L${W*0.1} ${H*0.4} M${W*0.22} ${H*0.6} L${W*0.34} ${H*0.42} M${W*0.21} ${H*0.7} L${W*0.05} ${H*0.6}" stroke="${sk?'#222':'#000'}" stroke-width="6" fill="none"/><path d="M${W*0.45} ${H} L${W*0.45} ${H*0.66} L${W*0.62} ${H*0.54} L${W*0.8} ${H*0.66} L${W*0.8} ${H} Z" ${sk?st:`fill="${shade(a,-0.5)}"`}/><rect x="${W*0.58}" y="${H*0.72}" width="12" height="16" fill="${sk?'none':b}" ${sk?'stroke="#222"':''}/><circle cx="${W*0.3}" cy="${H*0.85}" r="3" fill="${b}"/><circle cx="${W*0.35}" cy="${H*0.85}" r="3" fill="${b}"/>`; break;
    case 'crime': case 'mystery': case 'thriller': o = `<rect width="${W}" height="${H}" fill="${fill(a)}"/>${skyline(H*0.75, shade(a,-0.4))}${sk?'':Array.from({length:30},()=>{ const x=r()*W,y=r()*H; return `<path d="M${x.toFixed(0)} ${y.toFixed(0)} l-4 12" stroke="${c}" opacity=".35"/>`; }).join('')}<g ${sk?st:`fill="${sk?'none':'#050505'}"`}><path d="M${W*0.5-26} ${H*0.52} L${W*0.5+26} ${H*0.52} L${W*0.5+34} ${H} L${W*0.5-34} ${H} Z"/><circle cx="${W*0.5}" cy="${H*0.45}" r="16"/><path d="M${W*0.5-30} ${H*0.42} L${W*0.5+30} ${H*0.42} L${W*0.5+18} ${H*0.4} L${W*0.5+14} ${H*0.33} L${W*0.5-14} ${H*0.33} L${W*0.5-18} ${H*0.4} Z"/></g><rect x="${W*0.12}" y="${H*0.3}" width="22" height="30" fill="${sk?'none':b}" ${sk?'stroke="#222"':''}/>`; break;
    case 'western': o = `<defs><linearGradient id="sw${r().toString(36).slice(2,7)}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></linearGradient></defs><rect width="${W}" height="${H}" fill="${sk?'#fff':c}"/><circle cx="${W*0.5}" cy="${H*0.55}" r="46" ${sk?st:`fill="${b}"`}/><path d="M0 ${H*0.62} L${W*0.15} ${H*0.62} L${W*0.18} ${H*0.5} L${W*0.4} ${H*0.5} L${W*0.43} ${H*0.62} L${W} ${H*0.62} L${W} ${H} L0 ${H} Z" ${sk?st:`fill="${a}"`}/><path d="M${W*0.75} ${H*0.9} l0 -50 m0 20 l-12 0 l0 -14 m12 6 l10 0 l0 -12" stroke="${sk?'#222':shade(a,-0.3)}" stroke-width="7" fill="none" stroke-linecap="round"/>${person(W*0.35,H*0.7,0.9,sk?'#222':shade(a,-0.5),false)}`; break;
    case 'romance': o = `<rect width="${W}" height="${H}" fill="${fill(c)}"/><path d="M${W*0.5} ${H*0.78} C${W*0.05} ${H*0.5} ${W*0.2} ${H*0.2} ${W*0.5} ${H*0.38} C${W*0.8} ${H*0.2} ${W*0.95} ${H*0.5} ${W*0.5} ${H*0.78} Z" ${sk?st:`fill="${a}"`} opacity=".85"/><g ${sk?st:`fill="${shade(b,-0.4)}"`}><path d="M${W*0.2} ${H} L${W*0.2} ${H*0.6} Q${W*0.3} ${H*0.42} ${W*0.42} ${H*0.52} L${W*0.44} ${H*0.6} L${W*0.4} ${H*0.66} L${W*0.42} ${H} Z"/><path d="M${W*0.8} ${H} L${W*0.8} ${H*0.58} Q${W*0.7} ${H*0.4} ${W*0.58} ${H*0.52} L${W*0.56} ${H*0.6} L${W*0.6} ${H*0.66} L${W*0.58} ${H} Z"/></g>`; break;
    case 'comedy': case 'satire': case 'kids': { const cx=W*0.5, cy=H*0.6; o = `<rect width="${W}" height="${H}" fill="${fill(a)}"/>${Array.from({length:18},()=>`<circle cx="${(r()*W).toFixed(0)}" cy="${(r()*H).toFixed(0)}" r="${(4+r()*8).toFixed(0)}" fill="${sk?'none':c}" opacity=".35" ${sk?'stroke="#aaa"':''}/>`).join('')}<ellipse cx="${cx}" cy="${cy}" rx="52" ry="58" ${sk?st:`fill="${b}"`}/><circle cx="${cx-18}" cy="${cy-12}" r="11" fill="#fff" stroke="#222" stroke-width="2"/><circle cx="${cx+18}" cy="${cy-12}" r="11" fill="#fff" stroke="#222" stroke-width="2"/><circle cx="${cx-15}" cy="${cy-10}" r="5" fill="#222"/><circle cx="${cx+21}" cy="${cy-10}" r="5" fill="#222"/><path d="M${cx-22} ${cy+16} Q${cx} ${cy+38} ${cx+22} ${cy+16}" stroke="#222" stroke-width="3" fill="${sk?'none':'#7a1b1b'}"/>${k==='kids'?`<path d="M${cx-40} ${cy-50} l-10 -30 l24 18 Z M${cx+40} ${cy-50} l10 -30 l-24 18 Z" ${sk?st:`fill="${b}"`}/>`:''}`; break; }
    case 'war': case 'historical': o = `<rect width="${W}" height="${H}" fill="${fill(c)}"/><path d="M0 ${H*0.75} Q${W*0.5} ${H*0.65} ${W} ${H*0.78} L${W} ${H} L0 ${H} Z" ${sk?st:`fill="${a}"`}/><g ${sk?st:`fill="${shade(a,-0.4)}"`} transform="translate(${W*0.5} ${H*0.35}) rotate(${(r()*20-10).toFixed(0)})"><path d="M-60 0 L60 -4 L66 0 L60 4 Z"/><path d="M-6 -2 L-24 -40 L-12 -40 L10 -2 Z M-6 2 L-24 40 L-12 40 L10 2 Z"/><path d="M-56 -2 L-66 -16 L-60 -16 L-48 -2 Z"/></g>${Array.from({length:6},()=>`<circle cx="${(r()*W).toFixed(0)}" cy="${(H*0.7+r()*H*0.2).toFixed(0)}" r="${(8+r()*14).toFixed(0)}" fill="${sk?'none':'#777'}" opacity=".5"/>`).join('')}`; break;
    case 'adventure': o = `<rect width="${W}" height="${H}" fill="${fill(b)}"/><path d="M${W*0.2} ${H*0.8} L${W*0.5} ${H*0.3} L${W*0.8} ${H*0.8} Z" ${sk?st:`fill="${shade(a,-0.2)}"`}/>${[0.4,0.5,0.6,0.7].map(y=>`<path d="M${W*(0.5-(y-0.3)*0.6)} ${H*y} L${W*(0.5+(y-0.3)*0.6)} ${H*y}" stroke="${sk?'#222':shade(a,-0.5)}" stroke-width="2"/>`).join('')}<path d="M0 ${H} Q${W*0.1} ${H*0.6} ${W*0.2} ${H} M${W} ${H} Q${W*0.9} ${H*0.55} ${W*0.78} ${H}" ${sk?st:`fill="${a}"`}/>${person(W*0.5,H*0.86,0.6,sk?'#222':c,false)}`; break;
    case 'manga': o = `<rect width="${W}" height="${H}" fill="#fff"/>${Array.from({length:40},(_,i)=>`<path d="M${W/2} ${H*0.5} L${(W/2+Math.cos(i/40*6.283)*300).toFixed(0)} ${(H*0.5+Math.sin(i/40*6.283)*300).toFixed(0)}" stroke="${sk?'#ccc':b}" stroke-width="${(0.5+r()*2).toFixed(1)}" opacity=".7"/>`).join('')}<ellipse cx="${W*0.5}" cy="${H*0.55}" rx="46" ry="54" fill="#fff" stroke="#111" stroke-width="3"/><path d="M${W*0.5-50} ${H*0.5} Q${W*0.5} ${H*0.2} ${W*0.5+50} ${H*0.5} L${W*0.5+30} ${H*0.42} L${W*0.5+10} ${H*0.5} L${W*0.5-10} ${H*0.42} L${W*0.5-30} ${H*0.5} Z" fill="${sk?'none':c}" stroke="#111" stroke-width="2"/><ellipse cx="${W*0.5-18}" cy="${H*0.57}" rx="10" ry="14" fill="#111"/><ellipse cx="${W*0.5+18}" cy="${H*0.57}" rx="10" ry="14" fill="#111"/><circle cx="${W*0.5-15}" cy="${H*0.55}" r="3" fill="#fff"/><circle cx="${W*0.5+21}" cy="${H*0.55}" r="3" fill="#fff"/>`; break;
    case 'anthology': o = `<rect width="${W}" height="${H}" fill="${fill(a)}"/>${[[8,8],[W/2+4,8],[8,H/2+4],[W/2+4,H/2+4]].map(([x,y],i)=>`<rect x="${x}" y="${y}" width="${W/2-12}" height="${H/2-12}" fill="${sk?'none':[b,c,shade(b,0.3),shade(c,-0.3)][i]}" stroke="#111" stroke-width="2"/><circle cx="${x+W/4-6}" cy="${y+H/4-6}" r="${(10+r()*16).toFixed(0)}" fill="${sk?'none':'#111'}" opacity=".6" ${sk?'stroke="#222"':''}/>`).join('')}`; break;
    case 'exp': case 'alt': o = `<rect width="${W}" height="${H}" fill="${sk?'#fff':a}"/>${Array.from({length:k==='exp'?9:5},()=>{ const x=r()*W, y=r()*H, s=20+r()*70; return r()<0.5? `<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="${s.toFixed(0)}" height="${(s*(0.5+r())).toFixed(0)}" fill="${sk?'none':(r()<0.6?b:c)}" stroke="#111" stroke-width="${k==='alt'?3:1}" transform="rotate(${(r()*40-20).toFixed(0)} ${x.toFixed(0)} ${y.toFixed(0)})"/>` : `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(s/2).toFixed(0)}" fill="${sk?'none':(r()<0.6?c:b)}" stroke="#111" stroke-width="${k==='alt'?3:1}"/>`; }).join('')}${k==='alt'?Array.from({length:30},()=>`<path d="M${(r()*W).toFixed(0)} ${(r()*H).toFixed(0)} l${(r()*30-15).toFixed(0)} ${(r()*30-15).toFixed(0)}" stroke="#111" stroke-width="1.5"/>`).join(''):''}`; break;
    case 'ya': case 'slice': case 'literary': default: o = `<rect width="${W}" height="${H}" fill="${fill(c)}"/><rect x="${W*0.18}" y="${H*0.22}" width="${W*0.64}" height="${H*0.5}" fill="${sk?'none':b}" stroke="${sk?'#222':shade(b,-0.4)}" stroke-width="3"/><path d="M${W*0.5} ${H*0.22} L${W*0.5} ${H*0.72} M${W*0.18} ${H*0.47} L${W*0.82} ${H*0.47}" stroke="${sk?'#222':shade(b,-0.4)}" stroke-width="3"/><circle cx="${W*0.35}" cy="${H*0.36}" r="14" fill="${sk?'none':c}" opacity=".7"/>${k==='ya'?person(W*0.3,H*0.9,0.6,sk?'#222':a,false)+person(W*0.7,H*0.9,0.6,sk?'#222':shade(a,-0.3),false):person(W*0.66,H*0.95,0.7,sk?'#222':a,false)}`;
  }
  return o;
}
function comicCover0(key){
  const d=cmD(key), s=d.s; const W=200, H=300; const uid=hsh(key).toString(36);
  const yr=yearOf(issueDay(s, d.n||1)); const era=eraOf(yr);
  const pals=CM_PAL[CG[s.g].k]||CM_PAL.slice; const vr=d.v||'';
  const rs = hsh(s.id+'|'+(d.n||0)+'|'+(vr==='B'||/^[RSVXC]/.test(vr)?vr:''));
  const r=mkRng(rs); let P=pals[rs%pals.length];
  if (vr==='B') P=[P[1],P[2],P[0]]; else if (/^R/.test(vr)) P=[shade(P[0],-0.35),P[2],P[1]];
  const sk = /^S/.test(vr); const virgin = /^V/.test(vr);
  const F='font-family="Barlow Condensed,Arial Narrow,sans-serif"';
  const title=s.t.toUpperCase(); const tl=title.length;
  const fs = Math.max(15, Math.min(era<=2?40:34, Math.floor(360/Math.max(6,tl))));
  const paper = era<=1 ? '#efe4c8' : era<=2 ? '#f3ecd9' : '#ffffff';
  const logoCol = lum(P[0])>0.6 ? '#111' : P[2];
  let art = cmArt(s.g, r, P, W, H, sk);
  if (d.tr){
    const hc=d.kind==='H';
    return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" class="cmsvg"><rect width="${W}" height="${H}" fill="${hc?'#161616':P[0]}"/><g opacity="${hc?0.5:0.9}" transform="translate(20 70) scale(0.8)">${art}</g><rect x="0" y="0" width="12" height="${H}" fill="${hc?'#c9a227':shade(P[0],-0.35)}"/><text x="${W/2+6}" y="40" text-anchor="middle" ${F} font-weight="800" font-size="${Math.min(26,fs)}" fill="${hc?'#c9a227':'#fff'}">${esc(title)}</text><text x="${W/2+6}" y="60" text-anchor="middle" ${F} font-size="13" fill="${hc?'#e8d8a0':'#fff'}" letter-spacing="2">${hc?'DELUXE HARDCOVER':'VOLUME '+d.vol}</text><text x="${W/2+6}" y="${H-12}" text-anchor="middle" ${F} font-size="11" fill="${hc?'#c9a227':'#fff'}">${esc(pubName(s).toUpperCase())}</text></svg>`;
  }
  let dress='';
  if (!virgin){
    if (era<=1){ // golden/silver: banner title, corner box
      dress = `<rect x="0" y="0" width="${W}" height="62" fill="${P[1]}"/><rect x="6" y="6" width="36" height="46" fill="#fff" stroke="#111" stroke-width="1.5"/><text x="24" y="20" text-anchor="middle" ${F} font-weight="800" font-size="10" fill="#111">${esc((pubOf(s)||{sh:'IND'}).sh)}</text><text x="24" y="34" text-anchor="middle" ${F} font-weight="800" font-size="12" fill="#c00">${d.cp<1?Math.round(d.cp*100)+'¢':'$'+d.cp.toFixed(2)}</text><text x="24" y="47" text-anchor="middle" ${F} font-weight="700" font-size="10" fill="#111">NO. ${d.n}</text>
        <text x="${W/2+20}" y="${30+fs*0.35}" text-anchor="middle" ${F} font-weight="800" font-size="${fs}" fill="${P[2]}" stroke="#111" stroke-width="1.6" paint-order="stroke" textLength="${Math.min(150, tl*fs*0.5)}" lengthAdjust="spacingAndGlyphs">${esc(title)}</text>`;
    } else if (era<=3){ // bronze/80s: corner box + logo
      dress = `<rect x="0" y="0" width="44" height="60" fill="#fff"/><rect x="3" y="3" width="38" height="54" fill="${P[1]}"/><text x="22" y="20" text-anchor="middle" ${F} font-weight="800" font-size="11" fill="#fff">${esc((pubOf(s)||{sh:'IND'}).sh)}</text><text x="22" y="38" text-anchor="middle" ${F} font-weight="800" font-size="16" fill="#fff">${d.n}</text><text x="22" y="52" text-anchor="middle" ${F} font-size="9" fill="#fff">${d.cp<1?Math.round(d.cp*100)+'¢':'$'+d.cp.toFixed(2)}</text>
        <text x="${W/2+22}" y="${22+fs*0.55}" text-anchor="middle" ${F} font-weight="800" font-size="${fs}" fill="${logoCol}" stroke="#111" stroke-width="1.4" paint-order="stroke" textLength="${Math.min(148, tl*fs*0.5)}" lengthAdjust="spacingAndGlyphs">${esc(title)}</text>`;
    } else { // modern: clean logo, small trade dress
      dress = `<text x="${W/2}" y="${14+fs*0.8}" text-anchor="middle" ${F} font-weight="800" font-size="${fs+4}" fill="${logoCol}" stroke="${lum(logoCol)>0.5?'#111':'#fff'}" stroke-width="${era===4?2:0.8}" paint-order="stroke" textLength="${Math.min(184, tl*(fs+4)*0.52)}" lengthAdjust="spacingAndGlyphs">${esc(title)}</text>
        <text x="10" y="${H-10}" ${F} font-weight="700" font-size="11" fill="#fff" stroke="#111" stroke-width="2" paint-order="stroke">#${d.n}</text><text x="${W-8}" y="${H-10}" text-anchor="end" ${F} font-size="9" fill="#fff" stroke="#111" stroke-width="2" paint-order="stroke">${esc((pubOf(s)||{sh:'SELF'}).sh)}</text>`;
      if (!vr) dress += `<rect x="12" y="${H-58}" width="30" height="36" fill="#fff"/>${Array.from({length:12},(_,i)=>`<rect x="${14+i*2.2}" y="${H-54}" width="${i%3?1:1.6}" height="24" fill="#111"/>`).join('')}`;
    }
    if (era===4 && d.n===1) dress += `<rect x="0" y="${H-46}" width="${W}" height="16" fill="#f2c230" transform="rotate(-6 ${W/2} ${H-38})"/><text x="${W/2}" y="${H-34}" text-anchor="middle" ${F} font-weight="800" font-size="11" fill="#111" transform="rotate(-6 ${W/2} ${H-38})">COLLECTOR'S ITEM #1 ISSUE!</text>`;
  }
  let over='';
  if (vr==='F') over += `<defs><linearGradient id="fo${uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".0"/><stop offset=".45" stop-color="#fff" stop-opacity=".45"/><stop offset=".55" stop-color="#b3e5fc" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#fo${uid})"/>`;
  if (/^X/.test(vr)) over += `<rect x="0" y="${H-24}" width="${W}" height="24" fill="#111"/><text x="${W/2}" y="${H-8}" text-anchor="middle" ${F} font-weight="700" font-size="11" fill="#f2c230" letter-spacing="1">RETAILER EXCLUSIVE</text>`;
  if (/^C/.test(vr)) over += `<rect x="0" y="${H-24}" width="${W}" height="24" fill="#c8102e"/><text x="${W/2}" y="${H-8}" text-anchor="middle" ${F} font-weight="700" font-size="10" fill="#fff" letter-spacing="1">CONVENTION EXCLUSIVE</text>`;
  if (d.p>1 && d.p<9) over += `<rect x="${W-70}" y="${H*0.45}" width="80" height="16" fill="#fff" transform="rotate(-35 ${W-30} ${H*0.45})"/><text x="${W-30}" y="${H*0.45+12}" text-anchor="middle" ${F} font-weight="800" font-size="10" fill="#c00" transform="rotate(-35 ${W-30} ${H*0.45})">${['','','2ND','3RD','4TH','5TH'][d.p]||d.p+'TH'} PRINTING</text>`;
  if (d.p===9) over += `<rect x="0" y="0" width="${W}" height="14" fill="#111"/><text x="${W/2}" y="11" text-anchor="middle" ${F} font-weight="700" font-size="10" fill="#fff" letter-spacing="2">FACSIMILE EDITION</text>`;
  if (/^[RV]/.test(vr) && !virgin) over += `<text x="${W-8}" y="${era>=4?H-24:H-8}" text-anchor="end" ${F} font-size="8" fill="#fff" stroke="#111" stroke-width="1.5" paint-order="stroke">VARIANT</text>`;
  const pap = era<=2 && !sk ? `<rect width="${W}" height="${H}" fill="${paper}" opacity=".18"/>` : '';
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" class="cmsvg"><clipPath id="cc${uid}"><rect width="${W}" height="${H}"/></clipPath><g clip-path="url(#cc${uid})">${art}${pap}${dress}${over}</g><rect x=".5" y=".5" width="${W-1}" height="${H-1}" fill="none" stroke="rgba(0,0,0,.25)"/></svg>`;
}
function comicSlab(cp){
  const d=cmD(cp.k), s=d.s; const g=cp.g;
  const lab = cp.gr ? ['#6a3d9a','RESTORED'] : cp.sg && cp.sg.s==='a' ? ['#d4a017','SIGNATURE'] : cp.sg && cp.sg.s==='x' ? ['#6b7a88','QUALIFIED'] : ['#1f5fa8','UNIVERSAL'];
  const F='font-family="Barlow Condensed,Arial Narrow,sans-serif"';
  const cv=comicCover(cp.k); const inner = `<g transform="translate(25 98) scale(0.9)">${cv.slice(cv.indexOf('>')+1, cv.lastIndexOf('</svg>'))}</g>`;
  const ks = d.tr?[]:issueKeys(s,d.n).slice(0,1).map(k=>keyText(k,s));
  const pg = cp.c[6]>=92?'WHITE PAGES': cp.c[6]>=82?'OFF-WHITE TO WHITE PAGES': cp.c[6]>=70?'OFF-WHITE PAGES': cp.c[6]>=55?'CREAM TO OFF-WHITE PAGES':'TAN PAGES';
  return `<svg viewBox="0 0 230 386" xmlns="http://www.w3.org/2000/svg" class="cmsvg slab"><rect x="2" y="2" width="226" height="382" rx="10" fill="#e3e8ec" stroke="#b6c0c8" stroke-width="2"/>
    <rect x="9" y="9" width="212" height="80" rx="4" fill="#fff" stroke="${lab[0]}" stroke-width="2"/><rect x="9" y="9" width="212" height="16" rx="3" fill="${lab[0]}"/><text x="16" y="21" ${F} font-weight="800" font-size="11" fill="#fff" letter-spacing="1">GCS COMICS · ${lab[1]} GRADE</text>
    <text x="16" y="42" ${F} font-weight="800" font-size="13" fill="#111" ${d.title.length>20?'textLength="150" lengthAdjust="spacingAndGlyphs"':''}>${esc(d.title.toUpperCase().slice(0,34))}</text>
    <text x="16" y="55" ${F} font-size="10" fill="#333" textLength="150" lengthAdjust="spacingAndGlyphs">${esc((pubName(s)+' · '+d.yr+(d.label?' · '+d.label:'')).toUpperCase().slice(0,44))}</text>
    <text x="16" y="67" ${F} font-size="9" fill="#555" ${(ks[0]||'').length>30?'textLength="196" lengthAdjust="spacingAndGlyphs"':''}>${esc((ks[0]||'').toUpperCase().slice(0,52))}</text>
    <text x="16" y="80" ${F} font-size="8.5" fill="#777" textLength="196" lengthAdjust="spacingAndGlyphs">${cp.sg&&cp.sg.s==='a'?esc(('Signed by '+CR_(cp.sg.c).n).toUpperCase())+' · ':''}${cp.gr?esc(REST_N[cp.r].toUpperCase())+' · ':''}${pg} · ${cp.cert||''}</text>
    <text x="212" y="52" text-anchor="end" ${F} font-weight="800" font-size="30" fill="#111">${gTxt(g)}</text><text x="212" y="66" text-anchor="end" ${F} font-weight="700" font-size="10" fill="${lab[0]}">${CGN[g]}</text>
    <rect x="18" y="94" width="194" height="280" rx="4" fill="#c9d2d9"/>${inner}</svg>`;
}
function cmThumb(cp){ return cp && cp.g>0 ? comicSlab(cp) : comicCover(cp.k); }
function miniComic(cp){ return `<div class="mini cm ${cp.g>0?'slab':''}">${cmThumb(cp)}</div>`; }
function miniCKey(k){ return `<div class="mini cm">${comicCover(k)}</div>`; }

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

// ===================== THE HUNT: ENGINE =====================
// Every seller owns real objects from the world (G.cards, G.mc, G.sealed) under owner id -(1000+sellerId).
// Prices come from each seller's own knowledge, not from the game's fair value.
const HSID = id=>-(1000+id);
const HS = o=>G.hunt && o<=-1000 ? G.hunt.sel[-o-1000] : null;
const HCARD=()=>packHas('sports'), HCOMIC=()=>packHas('comics');
const CARD_CATS=['mod','pros','vcard','slab','auto','team','wax'], COMIC_CATS=['comic','ocomic','key','cslab','cvar','indie','tpb'];
const CAT_TO_COMIC={mod:'comic',pros:'key',vcard:'ocomic',slab:'cslab',auto:'cvar',team:'comic',wax:'comic'}, CAT_TO_CARD={comic:'mod',ocomic:'vcard',key:'pros',cslab:'slab',cvar:'auto',indie:'mod',tpb:'mod'};
function shopFits(prof){ const ks=Object.keys(prof||{}); if (ks.includes('mixed')) return true; return ks.some(k=> CARD_CATS.includes(k)? HCARD() : COMIC_CATS.includes(k)? HCOMIC() : true); }
const HUNT_KINDS = {
  pro:    {n:'Professional dealer', mg:[1.15,1.35], minF:[1.02,1.1], pat:0.6, bb:[0.62,0.75], cash:[3000,15000]},
  spec:   {n:'Specialist', mg:[1.12,1.3], minF:[1.0,1.08], pat:0.55, bb:[0.6,0.72], cash:[2000,9000]},
  gen:    {n:'Generalist', mg:[1.1,1.35], minF:[0.92,1.05], pat:0.5, bb:[0.55,0.7], cash:[1500,6000]},
  old:    {n:'Old-school dealer', mg:[1.15,1.4], minF:[0.95,1.05], pat:0.35, bb:[0.5,0.65], cash:[2000,8000]},
  casual: {n:'Casual seller', mg:[0.9,1.3], minF:[0.7,0.9], pat:0.45, bb:[0.4,0.55], cash:[200,1200]},
  liq:    {n:'Liquidator', mg:[0.8,1.1], minF:[0.6,0.8], pat:0.7, bb:[0.35,0.5], cash:[500,3000]},
  estate: {n:'Estate seller', mg:[0.9,1.2], minF:[0.6,0.85], pat:0.5, bb:[0,0], cash:[0,0]},
  pawn:   {n:'Pawn shop', mg:[1.3,1.7], minF:[0.9,1.05], pat:0.3, bb:[0.3,0.45], cash:[2000,8000]},
  priv:   {n:'Private collector', mg:[1.0,1.25], minF:[0.8,0.95], pat:0.5, bb:[0,0], cash:[0,0]},
  kid:    {n:'Private seller', mg:[0.8,1.4], minF:[0.55,0.8], pat:0.4, bb:[0,0], cash:[0,0]}
};
// knowledge: card (modern cards and prospects), vcard (older card products), comic (modern comics), ocomic (pre-1980 comics), sealed
const SHOP_DEFS = [
  ['Diamond Den Cards','Rico Bannon','pro',{card:0.95,vcard:0.85,comic:0.2,ocomic:0.15,sealed:0.9},{mod:3,pros:3,slab:2,auto:1.5,wax:2,box1:1},'A baseball-first shop. Rico knows this year\'s rookies to the dollar.'],
  ['Northside Hobby Emporium','Janet Okafor','pro',{card:0.8,vcard:0.75,comic:0.75,ocomic:0.6,sealed:0.85},{mod:2,slab:1.5,wax:2,comic:2,key:1,tpb:1},'Big, bright and efficiently priced. Rarely a bargain, rarely a rip-off.'],
  ['Old Mill Vintage','Walter Pryce','old',{card:0.35,vcard:0.9,comic:0.35,ocomic:0.95,sealed:0.5},{vcard:3,ocomic:3,slab:1,mixed:1},'Walter has handled old paper for forty years. New stuff, he admits, moves too fast for him.'],
  ['Kettle & Crate Antiques','Maud Salcedo','gen',{card:0.2,vcard:0.3,comic:0.2,ocomic:0.4,sealed:0.25},{ocomic:1,vcard:1,mixed:2,box1:1},'Mostly furniture and glassware. There\'s a shelf of paper collectibles in the back.'],
  ['Paperback Exchange','Colin Whitlock','gen',{card:0.1,vcard:0.1,comic:0.35,ocomic:0.45,sealed:0.1},{comic:2,ocomic:1,tpb:3,box1:2},'A used bookstore with a comics corner and a very full dollar crate.'],
  ['Quick Cash Pawn','Dale Hollis','pawn',{card:0.3,vcard:0.3,comic:0.25,ocomic:0.3,sealed:0.4},{slab:3,auto:1,wax:1,mixed:1},'Prices slabs by the big number on the label. Negotiable, to a point.'],
  ['Second Chance Consignment','Priya Varga','casual',{card:0.45,vcard:0.4,comic:0.45,ocomic:0.4,sealed:0.5},{mixed:3,mod:1,comic:1,box1:1},'Everything here is a consignor\'s item, priced by the consignor.']
];
const DEALER_NAMES = ['Mike\'s Cards','Heartland Sportscards','Top Loader Traders','Dugout Collectibles','Rookie Row','Slab City','Wax Pack Warehouse','Bullpen Breaks','Box Seat Cards','Old Timer\'s Table','Hall Pass Cards','Pennant Race Collectibles','Grand Slam Graded','Bench Clearing Cards','The Card Cave','Signed & Sealed','Double Play Dealers','Chalk Line Cards','Home Plate Hobby','Minor League Mike',
  'Longbox Larry','Panel Pushers','Silver Spine Comics','Four Color Finds','Key Issue Kings','Back Issue Barn','Mylar Mike','Gutter Space Comics','Splash Page Books','The Variant Vault','Pulp & Paper','Bronze Age Bruce','Indie Alley','Newsstand Nostalgia','Slabbed & Graded Comics','Cover Price Comics',
  'Pickers Paradise','Attic Finds','Odds & Ends Trading','Grab Bag Collectibles'];
const DEALER_PROFILES = [
  ['pro',{mod:3,pros:2,slab:1,wax:1,box1:1}],['spec',{pros:4,mod:1,box1:1}],['pro',{slab:4,auto:1}],['spec',{vcard:3,slab:1,box1:1}],['gen',{mod:2,box1:2,mixed:1}],['spec',{wax:4}],['spec',{auto:3,slab:1}],['gen',{team:3,mod:1,box1:1}],['casual',{mixed:2,mod:2,box5:1}],['old',{vcard:3,mixed:1}],
  ['pro',{mod:2,slab:2,box5:1}],['gen',{mod:2,pros:1,box1:1}],['pro',{slab:3,pros:1}],['casual',{mod:2,box1:2}],['gen',{mixed:2,box1:1,wax:1}],['spec',{auto:2,slab:2}],['gen',{mod:2,team:2,box5:1}],['casual',{box1:3,mod:1}],['pro',{mod:2,wax:2}],['spec',{pros:3,box5:1}],
  ['spec',{comic:2,key:2,box1:1}],['pro',{key:3,cslab:2}],['old',{ocomic:4,box1:1}],['gen',{comic:2,ocomic:1,box1:2}],['pro',{key:3,comic:1}],['gen',{comic:3,box1:2}],['casual',{comic:2,box1:2,cvar:1}],['spec',{indie:3,comic:1,box1:1}],['gen',{comic:2,tpb:1,box1:1}],['spec',{cvar:4}],['old',{ocomic:3,key:1}],['spec',{ocomic:2,comic:1,box1:1}],['spec',{indie:4,box1:1}],['old',{ocomic:2,box1:2}],['pro',{cslab:4}],['gen',{comic:3,box1:1}],
  ['casual',{mixed:3,box1:2}],['casual',{mixed:3,box1:1}],['gen',{mixed:2,mod:1,comic:1}],['casual',{mixed:2,box5:1,box1:1}]
];
const DEALER_KNOW = { card:[0.5,0.95], vcard:[0.4,0.9], comic:[0.4,0.95], ocomic:[0.3,0.9], sealed:[0.5,0.9] };
const GARAGE_STREETS = ['Birch Street','Maple Crescent','Juniper Lane','Oak Hollow Drive','Cedar Court','Willow Row','Lakeview Road','Harrow Avenue','Pine Ridge Way','Elm Terrace','Chestnut Close','Mill Road'];
const GARAGE_BLURB = ['boxes of old toys and "some comics"','moving sale, everything must go','kids\' stuff from the attic, including trading cards','household goods, records, a box of comics','downsizing: books, games, sports memorabilia','"collectibles" in the listing, no photos'];
const FLEA_JUNK = ['VHS tapes','board games missing pieces','die-cast cars','a stack of hobby price-guide magazines','souvenir mugs','vinyl records','action figures, loose','a box of cables','old baseball caps','paperback westerns','commemorative plates','mass-produced figurines'];
const AUCTION_HOUSE = 'Harrow & Finch Auctions';
const PV_STORIES = {
  team:['A lifelong {team} fan is selling the collection he built over the years.','{team} team collection: rookies, stars, autographs and a couple of sealed boxes.'],
  child:['A parent is selling the cards their kid collected a few years back. "He\'s moved on to other things."','Cards from someone\'s school years, kept in shoeboxes and binders.'],
  horror:['A horror reader is clearing shelves: a long run of one series plus a lot of other horror books.'],
  indie:['An indie comics reader is downsizing. Lots of small-press series, a few signed at conventions.'],
  oldread:['Reader copies from the 60s through the 80s, inherited from an uncle who read everything.'],
  dealer:['A dealer is selling part of his inventory wholesale to raise cash.'],
  inherit:['A family is selling an inherited collection. They know it has "some old stuff" and not much more.']
};

function huntInit(){
  if (!packHas('hunt')) return;
  G.hunt = { v:1, sel:[], ev:[], pv:[], auc:[], want:[], nid:1, sess:null, tbl:null, found:[], last:G.day };
  SHOP_DEFS.forEach((d,i)=>{ if ((i===0 && !HCARD()) || (i===4 && !HCOMIC())) return; const s=newSeller(d[2], {n:d[0], who:d[1], know:d[3], prof:d[4], blurb:d[5], shop:1}); stockSeller(s, ri(35,55)); });
  DEALER_PROFILES.forEach((p,i)=>{ if ((i<20 && !HCARD()) || (i>=20 && i<36 && !HCOMIC())) return; const know={}; for (const k in DEALER_KNOW){ const r=DEALER_KNOW[k]; know[k]=+rf(r[0],r[1]).toFixed(2); } const comicy=i>=20&&i<36, cardy=i<20;
    if (cardy){ know.comic*=0.4; know.ocomic*=0.4; } if (comicy){ know.card*=0.35; know.vcard*=0.35; }
    if (p[0]==='casual'){ for (const k in know) know[k]=+(know[k]*0.6).toFixed(2); }
    const s=newSeller(p[0], {n:DEALER_NAMES[i], who:personName(), know, prof:p[1], dealer:cardy?'card':comicy?'comic':'mixed'}); stockSeller(s, ri(28,48)); });
  // flea regulars
  for (let i=0;i<3;i++){ const s=newSeller('casual',{n:['Hank\'s Table','The Bin Lady','Two Brothers Trading'][i], who:personName(), know:{card:rf(0.2,0.5),vcard:rf(0.2,0.5),comic:rf(0.2,0.5),ocomic:rf(0.2,0.5),sealed:0.4}, prof:{mixed:3,box1:1,comic:1,mod:1}, flea:1}); stockSeller(s, ri(25,40)); }
  scheduleEvents(G.day, G.day+70);
  makePrivate();
}
function newSeller(kind, o){
  const K=HUNT_KINDS[kind];
  const s={ id:G.hunt.sel.length, n:o.n, who:o.who||'', kind, know:o.know, prof:o.prof||{mixed:1}, mg:+rf(K.mg[0],K.mg[1]).toFixed(2), minF:+rf(K.minF[0],K.minF[1]).toFixed(2), pat:K.pat, bb:+rf(K.bb[0],K.bb[1]).toFixed(2), cash:Math.round(rf(K.cash[0],K.cash[1])), inv:[], rel:0, mood:0, sp:0 };
  for (const k of ['blurb','shop','dealer','flea','temp','ev','story','exp','urg']) if (o[k]!=null) s[k]=o[k];
  s.urg = o.urg!=null? o.urg : +rf(0,0.5).toFixed(2);
  G.hunt.sel.push(s); return s;
}
// ---- getting real objects into a seller's hands ----
function fmtOf(prod, pref){ const f=Object.keys(B(prod).formats); return f.includes(pref)?pref:f[0]; }
function objOf(e){ return e.t==='c'? G.cards[e.id] : e.t==='m'? G.mc[e.id] : G.sealed[e.id]; }
function objKey(e){ const o=objOf(e); if (!o) return ''; return e.t==='s'? sealedKey(G.products[o.p],o.f) : o.k; }
function takeNpc(t, fn){
  const ids = t==='c'? G._npcCardIds : G._npcComicIds; if (!ids || !ids.length) return null;
  for (let i=0;i<25;i++){ const id=ids[Math.floor(R()*ids.length)]; const o = t==='c'?G.cards[id]:G.mc[id]; if (!o || o.o<=0 || o.l || o.g<0) continue; if (fn && !fn(o)) continue; return o; }
  return null;
}
function randCardKey(opts){
  opts=opts||{}; let prods=releasedProducts(); if (opts.old) prods=prods.filter(p=>yearOf(G.day)-p.yr>=3); if (opts.recent) prods=prods.filter(p=>yearOf(G.day)-p.yr<=1); if (!prods.length) prods=releasedProducts();
  const prod=pick(prods); const fmts=Object.keys(B(prod).formats);
  const packs=genSealed(prod, fmts.includes('pack')?'pack':fmts[0], Math.floor(R()*2e9)); const keys=packs.flat();
  if (opts.hit){ const hits=keys.filter(k=>{ const d=D(k); return d.auto||d.run||d.rc||d.par; }); if (hits.length) return pick(hits); }
  return pick(keys);
}
function randComicKey(opts){
  opts=opts||{};
  for (let i=0;i<20;i++){ const s=pick(G.cm.ser); if (!s.n) continue; const yr=yearOf(s.st);
    if (opts.old && yr>=1980) continue; if (opts.modern && yr<1990) continue; if (opts.indie && tierOf(s)<2) continue; if (opts.horror && s.g!==GI.horror) continue;
    let n=1+Math.floor(R()*s.n); if (opts.key){ const ks=s.keys.filter(k=>['fa','cam','team','dth','ss','ic','fin'].includes(k[1])); if (ks.length) n=pick(ks)[0]; else n=1; }
    let v=''; if (opts.var && s.v[n]){ const vs=s.v[n].split(',').filter(x=>x!=='B'); if (vs.length) v=pick(vs); }
    return mk(s.id,n,1,v); }
  return mk(G.cm.ser.find(s=>s.n).id,1,1,'');
}
function acquireFor(s, cat){
  if (!HCOMIC() && COMIC_CATS.includes(cat)) cat=CAT_TO_CARD[cat]; else if (!HCARD() && CARD_CATS.includes(cat)) cat=CAT_TO_COMIC[cat];
  const own=HSID(s.id); let o=null, t='c';
  const fromNpc = !s.temp && R()<0.55;
  switch(cat){
    case 'mod': o = fromNpc? takeNpc('c', c=>!D(c.k).prod || yearOf(G.day)-D(c.k).prod.yr<=2) : makeCard(randCardKey({recent:1,hit:R()<0.3}),own,null); break;
    case 'pros': o = takeNpc('c', c=>{ const p=P(D(c.k).pid); return p.tm===-1 || D(c.k).first || D(c.k).rc; }) || makeCard(randCardKey({hit:1}),own,null); break;
    case 'vcard': o = fromNpc? takeNpc('c', c=>yearOf(G.day)-D(c.k).prod.yr>=3) : makeCard(randCardKey({old:1,hit:R()<0.3}),own,null); break;
    case 'slab': o = takeNpc('c', c=>c.g>0); break;
    case 'auto': o = takeNpc('c', c=>D(c.k).auto) || makeCard(randCardKey({hit:1}),own,null); break;
    case 'team': { const tm=s.tm!=null?s.tm:(s.tm=ri(0,TEAMS_DEF.length-1)); o = takeNpc('c', c=>P(D(c.k).pid).tm===tm) || makeCard(randCardKey({}),own,null); break; }
    case 'wax': { const prods=releasedProducts().filter(p=>!inRetail(p)||R()<0.3); const pool=Object.values(G.sealed).filter(x=>x.o>0 && !x.l); if (pool.length && R()<0.6) o=pick(pool); else { const prod=pick(prods.length?prods:releasedProducts()); const f=pick(Object.keys(B(prod).formats)); o=makeSealed(prod.id,f,own,null); } t='s'; break; }
    case 'comic': t='m'; o = fromNpc? takeNpc('m', c=>cmD(c.k).yr>=1985) : cmMakeCopy(randComicKey({modern:1}),own,null,'npc'); break;
    case 'ocomic': t='m'; o = fromNpc? takeNpc('m', c=>cmD(c.k).yr<1980) : cmMakeCopy(randComicKey({old:1}),own,null,'npc'); break;
    case 'key': t='m'; o = takeNpc('m', c=>{ const d=cmD(c.k); return !d.tr && (d.n===1 || issueKeys(d.s,d.n).length>0); }) || cmMakeCopy(randComicKey({key:1}),own,null,'npc'); break;
    case 'cslab': t='m'; o = takeNpc('m', c=>c.g>0); break;
    case 'cvar': t='m'; o = takeNpc('m', c=>!!cmD(c.k).v) || cmMakeCopy(randComicKey({modern:1,var:1}),own,null,'npc'); break;
    case 'indie': t='m'; o = takeNpc('m', c=>tierOf(cmD(c.k).s)>=2) || cmMakeCopy(randComicKey({indie:1}),own,null,'npc'); break;
    case 'tpb': { t='m'; const trs=[]; for (let i=0;i<30 && !trs.length;i++){ const x=pick(G.cm.ser); if (x.tr.length) trs.push([x,pick(x.tr)]); } if (trs.length){ const [x,e]=trs[0]; if (e[2]<=G.day) o=cmMakeCopy(mk(x.id,e[0]+e[1],1,''),own,null,'npc'); } break; }
    default: if (HCARD() && (!HCOMIC() || R()<0.5)){ o=makeCard(randCardKey({old:R()<0.5}),own,null); } else { t='m'; o=cmMakeCopy(randComicKey({}),own,null,'lot'); }
  }
  if (!o) return null;
  o.o=own; return {t, id:o.id};
}
function stockSeller(s, n){
  const prof=Object.entries(s.prof).filter(([k])=>!k.startsWith('box'));
  for (let i=0;i<n;i++){ const cat = prof.length? wpick(prof, x=>x[1])[0] : 'mixed'; const e=acquireFor(s,cat); if (e) addEntry(s,e); }
}
function addEntry(s, e, price){
  const o=objOf(e); if (!o) return;
  e.d=G.day;
  // misidentification: rare for pros, less rare for casual sellers
  const pm = {pro:0.004,spec:0.006,gen:0.02,old:0.015,casual:0.05,liq:0.04,estate:0.07,pawn:0.03,priv:0.03,kid:0.08}[s.kind]||0.02;
  if (!price && R()<pm){ const ck=misKey(e); if (ck) e.ck=ck; }
  e.p = price || priceFor(s,e);
  s.inv.push(e);
}
function misKey(e){
  const o=objOf(e);
  if (e.t==='c'){ const d=D(o.k); if (d.parObj && !d.auto) return dk(d.prod, d.sec==='a'?'a':'b', d.no, ''); return null; }
  if (e.t==='m'){ const d=cmD(o.k); if (d.tr) return null; const s=d.s;
    if (d.v && d.v!=='B' && R()<0.7) return mk(s.id,d.n,d.p,'');       // variant sold as a regular cover
    if (d.p===1 && s.pp[d.n] && R()<0.5) return mk(s.id,d.n,2,'');       // first print sold as a reprint
    if ((d.p>1) && R()<0.8) return mk(s.id,d.n,1,d.v||'');               // reprint sold as a first print
    return null; }
  return null;
}
// ---- what a seller thinks something is worth ----
function domainOf(e){ const o=objOf(e); if (e.t==='c'){ const d=D(o.k); return yearOf(G.day)-d.prod.yr>=3?'vcard':'card'; } if (e.t==='m') return cmD(o.k).yr<1980?'ocomic':'comic'; return 'sealed'; }
function trueValue(e){ const o=objOf(e); if (!o) return 0; if (e.t==='c') return cardValue(o); if (e.t==='m') return cmCopyValue(o); return sealedFair(G.products[o.p],o.f); }
function valueAs(e, key, stale){ // value of this object if it were `key`, with the same condition
  const o=objOf(e);
  if (e.t==='c'){ const g=o.g>0?o.g:0; let v=fairValue(key,g); if (!(g>0)) v*=visibleCondFactor(o); if (o.sg) v*=cardSigMult(o); if (stale){ const p=P(D(key).pid); v*=staleFactor(p, stale); } return v; }
  if (e.t==='m'){ const g=o.g>0?o.g:apparentGrade(o); let v = stale? cmFairStale(key,g) : cmFair(key,g); if (!(o.g>0)) v=v/1.08*0.84; if (o.gr) v*=0.35; return v*sigMult(o,cmD(key)); }
  return sealedFair(G.products[o.p],o.f);
}
function staleFactor(p, lag){ const h=p.hx; if (!h || h.length<2) return 1; const t=G.day-lag; let v=h[0][1]; for (const x of h){ if (x[0]<=t) v=x[1]; else break; } const now=playerBase(p); return clamp(v/Math.max(0.0001,now), 0.15, 6); }
function genericValue(e){
  const o=objOf(e);
  if (e.t==='c'){ const d=D(o.k); if (o.g>0) return 12+o.g*3; return d.auto?8: d.run?4: d.parObj?1.2: d.rc?0.75: 0.25; }
  if (e.t==='m'){ const d=cmD(o.k); if (o.g>0) return 30; if (d.tr) return 6; const age=yearOf(G.day)-d.yr; return (age>=45?6: age>=25?1.5:1) * (d.n===1?2:1); }
  const prod=G.products[o.p]; return B(prod).formats[o.f].price*1.1;
}
function sellerEst(s, e){
  const o=objOf(e); if (!o) return 0; const dom=domainOf(e); const k=clamp(s.know[dom]||0.3,0,1);
  const key = e.ck || objKey(e);
  const cur = e.t==='s' ? trueValue(e) : valueAs(e, key, 0);
  const lagDays = Math.round((1-k)*420);
  const stale = e.t==='s' ? B(G.products[o.p]).formats[o.f].price*1.05 : valueAs(e, key, lagDays||1);
  const gen = genericValue(e);
  const L=x=>Math.log(Math.max(0.05,x));
  const base = k>=0.5 ? Math.exp(L(stale)+(L(cur)-L(stale))*(k-0.5)*2) : Math.exp(L(gen)+(L(stale)-L(gen))*k*2);
  const r=mkRng(hashStr(s.id+':'+e.t+':'+e.id)); const u=(r()+r()+r()-1.5)*2;
  return base*Math.exp(u*(0.05+(1-k)*0.32));
}
function priceFor(s, e){ return Math.max(0.5, nicePrice(sellerEst(s,e)*s.mg)); }
function sellerMin(s, e){ // the lowest they'll take today
  const est=sellerEst(s,e); let m=Math.max(0.5, est*s.minF);
  const age=G.day-(e.d||G.day); if (age>60) m*=0.9; if (age>150) m*=0.88;
  const ss=G.hunt.sess; const here = ss && (s.ev===ss.ev || (G.hunt.ev.find(x=>x.id===ss.ev)||{tb:[]}).tb.includes(s.id)); if (here && ss.clock>300) m*=0.93; if (here && ss.clock>390) m*=0.93;
  m *= 1 - Math.min(0.08, s.rel*0.015) - s.urg*0.08;
  return Math.min(m, e.p);
}
// ---- the structures other systems understand ----
function huntItem(e){ const o=objOf(e); if (!o) return {v:0}; if (e.t==='c') return {card:o, key:o.k, v:cardValue(o), heat:1}; if (e.t==='m') return {comic:true, cm:o, key:o.k, v:cmCopyValue(o), heat:1}; const prod=G.products[o.p]; return {sealed:true, s:o, prod, key:sealedKey(prod,o.f), v:sealedFair(prod,o.f), heat:1}; }
function huntLabel(e, claimed){ const o=objOf(e); if (!o) return '?';
  if (e.t==='c'){ const d=D(claimed&&e.ck?e.ck:o.k); return pname(P(d.pid))+' '+d.prod.yr+' '+B(d.prod).short+' '+d.title+(o.g>0?' (GCS '+o.g+')':''); }
  if (e.t==='m'){ const d=cmD(claimed&&e.ck?e.ck:o.k); return d.title+(d.label&&d.label!=='Cover A'?' ('+d.label+')':'')+(o.g>0?' (GCS '+gTxt(o.g)+')':''); }
  return prodName(G.products[o.p])+' '+FMT_NAME[o.f].toLowerCase(); }
function removeEntry(s, e){ const i=s.inv.indexOf(e); if (i>=0) s.inv.splice(i,1); if (G.hunt.cart) G.hunt.cart=G.hunt.cart.filter(x=>x!==e.id+':'+e.t); }
function entryById(s, t, id){ return s.inv.find(e=>e.t===t && e.id===id); }
function whereName(s){ if (s.shop) return s.n; const ev=s.ev!=null? G.hunt.ev.find(x=>x.id===s.ev) : null; return ev? s.n+' at '+ev.n : s.n; }
function giveTo(e, owner, price, how, where){
  const o=objOf(e); o.o=owner; const hist = how==='found'? 'Found at '+where : how==='lot'? 'Came in a collection bought from '+where : how==='signed'? 'Bought at '+where : 'Bought at '+where;
  if (owner===0){ if (e.t==='s') o.a=[G.day,'bought',price,where]; else { o.a=[G.day, how==='found'?'found':how==='lot'?'lot':'bought', price, where]; (o.h=o.h||[]).push([G.day, hist+(e.bx?' ('+money(e.bx)+' box)':''), price, '']); o.nw=1; } }
  else if (owner>0){ if (e.t==='c' && G._npcCardIds) G._npcCardIds.push(o.id); if (e.t==='m' && G._npcComicIds) G._npcComicIds.push(o.id); }
}
function playerBuy(s, entries, total, how){
  if (G.player.cash < total) return 'You need '+money(total,true)+'.';
  G.player.cash -= total; G.player.bought += total; s.cash += total; s.sp += total;
  const where = whereName(s); const sum=entries.reduce((a,e)=>a+e.p,0)||1;
  for (const e of entries){ const share=Math.round(total*e.p/sum*100)/100; giveTo(e, 0, share, how || (e.bx||s.kind==='estate'||s.kind==='kid'||s.flea?'found':'bought'), where); removeEntry(s,e);
    G.hunt.found.unshift([G.day, e.t, e.id, share, where, trueValue(e)]); }
  if (G.hunt.found.length>80) G.hunt.found.length=80;
  s.rel = Math.min(8, s.rel + Math.min(1.5, total/150) + 0.2);
  return null;
}
// ---- negotiation ----
function negotiate(s, entries, offer, trade){
  const ask = entries.reduce((a,e)=>a+e.p,0);
  const n = entries.length; const bundle = n>1 ? 1 - Math.min(0.12, 0.03*(n-1))*(0.5+s.urg) : 1;
  let min = entries.reduce((a,e)=>a+sellerMin(s,e),0) * bundle;
  const desired = Math.max(min, ask*(n>1?0.93:0.96)*(1-s.urg*0.05));
  const credit = trade ? tradeCredit(s, trade) : 0;
  const total = offer + credit;
  if (s.mood>=3) return {no:`${s.who||s.n} isn't taking any more offers from you today.`};
  const key=entries.map(e=>e.t+e.id).join(',');
  if (total >= desired || total >= ask) return {ok:1, price:offer, credit};
  if (total >= min){ if (R()<0.35+s.urg*0.4 || (G.hunt.lastCounter&&G.hunt.lastCounter.k===key && total>=G.hunt.lastCounter.p*0.97)) return {ok:1, price:offer, credit};
    const c=nicePrice(Math.max(total,(total+desired)/2)); G.hunt.lastCounter={k:key,p:c,s:s.id}; return {counter:c, credit, msg: n>1?`I can do ${money(c,true)} for the lot.`:`Meet me at ${money(c,true)}?`}; }
  if (total < min*0.6){ s.mood++; s.rel=Math.max(0,s.rel-0.3); return {no: s.mood>=3? 'That\'s insulting. We\'re done for today.' : pick(['Not even close.','I paid more than that for it.','Come on, be serious.'])}; }
  const c=nicePrice(Math.max(min*1.02,(total+ask)/2)); G.hunt.lastCounter={k:key,p:c,s:s.id};
  return {counter:c, credit, msg:`Best I can do is ${money(c,true)}.`};
}
function bestPrice(s, entries){ const ask=entries.reduce((a,e)=>a+e.p,0); const n=entries.length; const bundle=n>1?1-Math.min(0.12,0.03*(n-1))*(0.5+s.urg):1; const min=entries.reduce((a,e)=>a+sellerMin(s,e),0)*bundle; return nicePrice(Math.min(ask, min + (ask-min)*rf(0.35,0.6))); }
// ---- selling and trading to sellers ----
function playerObjs(){ const out=[]; for (const c of myCards()) if (!c.l && c.g>=0) out.push({t:'c',id:c.id}); for (const c of myComics()) if (!c.l && c.g>=0) out.push({t:'m',id:c.id}); for (const x of mySealed()) if (!x.l) out.push({t:'s',id:x.id}); return out; }
function dealerQuote(s, e){ const want = s.prof[{c:'mod',m:'comic',s:'wax'}[e.t]] || s.prof.mixed || 0.5; const k=clamp(s.know[domainOf(e)]||0.3,0,1); const est=sellerEst(s,e); const liq = est>300?0.85: est<3?0.4:1; return Math.max(0, Math.round(est*s.bb*liq*(want>=2?1.08:1)*(k<0.35?0.8:1)*100)/100); }
function tradeCredit(s, items){ return Math.round(items.reduce((a,e)=>a+dealerQuote(s,e)*1.18,0)*100)/100; }
function sellToSeller(s, items){
  const total=items.reduce((a,e)=>a+dealerQuote(s,e),0); if (total>s.cash) return 'They don\'t have that much cash on hand.';
  for (const e of items){ const o=objOf(e); const q=dealerQuote(s,e); if (!o || o.o!==0) continue; o.o=HSID(s.id); if (e.t!=='s') (o.h=o.h||[]).push([G.day,'Sold to '+whereName(s),q,'']); const ne={t:e.t,id:e.id}; addEntry(s, ne); }
  s.cash-=total; G.player.cash+=total; G.player.sold+=total; s.rel=Math.min(8,s.rel+0.3); return null;
}
function applyTrade(s, items){ for (const e of items){ const o=objOf(e); if (!o || o.o!==0) continue; o.o=HSID(s.id); if (e.t!=='s') (o.h=o.h||[]).push([G.day,'Traded to '+whereName(s),0,'']); addEntry(s,{t:e.t,id:e.id}); } }
// ---- NPC competition ----
function npcBrowse(s, visits){
  for (let v=0; v<visits; v++){
    if (!s.inv.length) return; const e=s.inv[Math.floor(R()*s.inv.length)]; if (!objOf(e)){ removeEntry(s,e); continue; } if (e.hold && e.hold>=G.day) continue;
    const it=huntItem(e); if (!it.v) continue; const n=pick(npcPool(e.t==='m'?{comic:1}:{})); if (n.cash<e.p) continue;
    const val=npcValuation(n, it); const need = (n.ty==='dealer'||n.ty==='flip'||n.ty==='cdlr'||n.ty==='deal')? e.p*1.25 : e.p*1.05;
    if (val>=need){ n.cash-=e.p; s.cash+=e.p; giveTo(e, n.id, e.p, 'bought', whereName(s)); removeEntry(s,e); }
  }
}
// ---- events ----
const EV_T = {
  garage:{n:'Garage sale', cost:0, days:1}, estate:{n:'Estate sale', cost:0, days:2}, flea:{n:'Riverside Flea Market', cost:2, days:1},
  lshow:{n:'Russell County Card Show', cost:5, days:1, tables:[7,10], kind:'card'}, rshow:{n:'Capital Sports Collectibles Show', cost:65, days:2, tables:[14,18], kind:'card'},
  nshow:{n:'National Collectors Convention', cost:340, days:3, tables:[22,28], kind:'both'}, meet:{n:'Collector meetup at the Legion Hall', cost:0, days:1, tables:[4,6], kind:'both'},
  scon:{n:'Paper Trails Small Press Fest', cost:8, days:1, tables:[6,8], kind:'comic'}, rcon:{n:'Northfall Comic Con', cost:55, days:2, tables:[12,16], kind:'comic'},
  bcon:{n:'Harbor City Comic Expo', cost:260, days:3, tables:[18,24], kind:'comic'}, ccon:{n:'Capital Comics Expo', cost:60, days:2, tables:[12,16], kind:'comic'},
  whse:{n:'Dealer warehouse sale', cost:15, days:1, tables:[1,1], kind:'both'}
};
function scheduleEvents(from, to){
  const H=G.hunt; const has=(ty,d)=>H.ev.some(e=>e.ty===ty && e.d===d);
  for (let t=Math.max(from, H.sched||from); t<=to; t++){
    const dw=dowOf(t), [m,dd]=mdOf(t); const add=(ty,o)=>{ if (has(ty,t)) return; const T=EV_T[ty]; if ((T.kind==='card' && !HCARD()) || (T.kind==='comic' && !HCOMIC())) return; H.ev.push(Object.assign({ id:H.nid++, ty, n:T.n, d:t, days:T.days, cost:T.cost, st:0, ann:t-42 }, o||{})); };
    if (dw===6){ const n=ri(1,3); for (let i=0;i<n;i++) add('garage',{n:'Garage sale on '+pick(GARAGE_STREETS), blurb:pick(GARAGE_BLURB), ann:t-ri(1,4), seed:ri(1,1e9), gi:i}); }
    if (dw===0) add('flea',{ann:t-60});
    if (dw===5 && R()<0.45) add('estate',{n:'Estate sale on '+pick(GARAGE_STREETS), ann:t-ri(5,9), seed:ri(1,1e9), blurb:pick(['the listing mentions "old comic books"','"sports memorabilia and trading cards" in the listing','a long-time collector\'s home, contents to go','furniture, tools, and "boxes from the basement"'])});
    if (dw===6 && dd<=7) add('lshow',{ann:t-35});
    if (dw===6 && dd>=15 && dd<=21 && [3,6,9,12].includes(m)) add('rshow',{ann:t-49});
    if (dw===5 && m===8 && dd>=7 && dd<=13) add('nshow',{ann:t-90});
    if (dw===4 && dd>=15 && dd<=21) add('meet',{ann:t-21});
    if (m===9 && dd===17) add('scon',{ann:t-60}); if (m===10 && dd===8) add('rcon',{ann:t-60}); if (m===7 && dd===23) add('bcon',{ann:t-75}); if (m===4 && dw===6 && dd<=7) add('ccon',{ann:t-60});
    if (dw===3 && R()<0.04) add('whse',{ann:t-ri(2,6), seed:ri(1,1e9)});
  }
  H.sched=to+1;
}
function evLive(ev){ return G.day>=ev.d && G.day<ev.d+ev.days; }
function evSellers(ev){ return G.hunt.sel.filter(s=>s.ev===ev.id || (ev.tb && ev.tb.includes(s.id))); }
function startEvent(ev){
  if (ev.st) return; ev.st=1; const T=EV_T[ev.ty]; const H=G.hunt;
  if (ev.ty==='garage'||ev.ty==='estate'){ const r=mkRng(ev.seed); withRng(r, ()=>makeHouseSale(ev)); return; }
  if (ev.ty==='whse'){ const d=pick(H.sel.filter(s=>s.dealer)); ev.tb=[d.id]; ev.n=d.n+' warehouse sale'; d.urg=Math.min(0.9,d.urg+0.3); stockSeller(d, ri(20,40)); addBox(d, ev, 1, 50); return; }
  const pool = H.sel.filter(s=>s.dealer && !s.temp && (T.kind==='both' || s.dealer===T.kind || s.dealer==='mixed'));
  const n=T.tables? ri(T.tables[0],T.tables[1]) : 0; const chosen=[]; const cand=pool.slice(); while (chosen.length<n && cand.length){ chosen.push(cand.splice(Math.floor(R()*cand.length),1)[0]); }
  if (ev.ty==='flea') chosen.push(...H.sel.filter(s=>s.flea));
  ev.tb=chosen.map(s=>s.id);
  for (const s of chosen){ if (s.inv.length<30) stockSeller(s, ri(6,14)); if (s.prof.box1) addBox(s, ev, 1, 40); if (s.prof.box5) addBox(s, ev, 5, 25); }
  // one-off sellers at flea markets and meetups
  if (ev.ty==='flea'||ev.ty==='meet'){ for (let i=0;i<(ev.ty==='flea'?ri(3,6):ri(1,3)); i++){ const s=newSeller(R()<0.7?'kid':'casual',{n:(ev.ty==='flea'?'Table ':'Swap table ')+(i+1), who:personName(), know:{card:rf(0,0.4),vcard:rf(0,0.4),comic:rf(0,0.4),ocomic:rf(0,0.4),sealed:0.3}, prof:{mixed:2,mod:1,comic:1}, temp:1, ev:ev.id}); s.junk=[pick(FLEA_JUNK),pick(FLEA_JUNK)]; stockSeller(s, ri(4,16)); if (R()<0.5) addBox(s,ev,1,ri(15,40)); } }
  // indie creators and signers
  if (HCOMIC() && (T.kind==='comic' || ev.ty==='nshow')){ ev.sign=[]; const cr=G.cm.cr.filter(c=>c.deb && !c.ret && (c.r==='W'||c.r==='A'||c.r==='WA'||c.r==='C'));
    const stars=cr.filter(c=>c.fame>1).sort(()=>R()-0.5).slice(0, ev.ty==='scon'?1:ri(2,4)); const indie=cr.filter(c=>c.fame<0.5 && c.works.some(id=>tierOf(S_(id))>=3 && S_(id).n)).sort(()=>R()-0.5).slice(0, ev.ty==='scon'?ri(4,7):ri(1,3));
    for (const c of stars) ev.sign.push({k:'cr', id:c.id, fee: Math.round(10+c.fame*15)});
    for (const c of indie){ ev.sign.push({k:'cr', id:c.id, fee:0, indie:1}); const s=newSeller('casual',{n:c.n+' (creator table)', who:c.n, know:{card:0,vcard:0,comic:1,ocomic:0.5,sealed:0}, prof:{}, temp:1, ev:ev.id}); s.cr=c.id; s.mg=1; s.minF=1;
      for (const sid of c.works.slice(-3)){ const x=S_(sid); if (!x.n || tierOf(x)<3) continue; for (let n=Math.max(1,x.n-3); n<=x.n; n++){ const cp=cmMakeCopy(mk(x.id,n,1,''), HSID(s.id), null, 'pre'); addEntry(s,{t:'m',id:cp.id}, cmD(cp.k).cp); } } }
  }
  if (HCARD() && (T.kind==='card' || ev.ty==='nshow')){ ev.sign=ev.sign||[]; const pl=G.players.filter(p=>p.tm!==-1 && (p.S>0.5 || p.tm===-2 && p.S>0.3)).sort(()=>R()-0.5).slice(0, ev.ty==='lshow'?1:ri(2,3)); const pr=G.players.filter(p=>p.tm===-1 && p.pot>=60).sort(()=>R()-0.5).slice(0, 1);
    for (const p of pl) ev.sign.push({k:'pl', id:p.id, fee:Math.round(15+p.S*60)}); for (const p of pr) ev.sign.push({k:'pl', id:p.id, fee:10}); }
}
function addBox(s, ev, price, n){
  const own=HSID(s.id); const est=x=>sellerEst(s,x);
  for (let i=0;i<n;i++){
    let e=null; for (let k=0;k<4 && !e;k++){ const card = !HCOMIC()? true : !HCARD()? false : s.dealer==='comic'? false : s.dealer==='card'? true : R()<0.5;
      const o = card? makeCard(randCardKey({old:R()<0.4, hit:R()<0.08}), own, null) : cmMakeCopy(randComicKey({}), own, null, 'bin');
      const x={t:card?'c':'m', id:o.id}; if (est(x) < price*1.2) e=x; else { if (card) delete G.cards[o.id]; else delete G.mc[o.id]; } }
    if (e){ e.bx=price; e.ev=ev.id; addEntry(s,e,price); }
  }
}
function makeHouseSale(ev){
  const estate=ev.ty==='estate'; const s=newSeller(estate?'estate':'kid',{n:ev.n, who:personName(), know:{card:rf(0,0.25),vcard:rf(0,0.25),comic:rf(0,0.2),ocomic:rf(0,0.3),sealed:0.3}, prof:{}, temp:1, ev:ev.id, urg:rf(0.3,0.8)});
  ev.tb=[s.id]; s.junk=[pick(FLEA_JUNK),pick(FLEA_JUNK),pick(FLEA_JUNK)];
  const r=R(); const own=HSID(s.id);
  if (!estate && r<0.45) return; // nothing collectible at all
  const era = estate? pick([1950,1960,1970,1980,1990]) : pick([1985,1990,1995,2005,2015]);
  const nComics = !HCOMIC()? 0 : estate? ri(0,1)? ri(10,60):0 : R()<0.5? ri(3,25):0; const nCards = !HCARD()? 0 : R()<(estate?0.5:0.6)? ri(5,estate?60:40):0;
  for (let i=0;i<nComics;i++){ let key; for (let k=0;k<10;k++){ key=randComicKey({}); const y=cmD(key).yr; if (Math.abs(y-era)<14) break; } const cp=cmMakeCopy(key, own, null, 'lot'); addEntry(s,{t:'m',id:cp.id}); }
  // a kid's shoebox is the leftovers of real packs
  if (nCards){ const prods=releasedProducts(); const prod=pick(prods); const packs=genSealed(prod, Object.keys(B(prod).formats).includes('pack')?'pack':Object.keys(B(prod).formats)[0], Math.floor(R()*2e9)); const keys=packs.flat();
    for (let i=0;i<Math.min(nCards,keys.length);i++){ const c=makeCard(keys[i], own, null); c.c=c.c.map(v=>Math.max(20, v-ri(4,22))); addEntry(s,{t:'c',id:c.id}); } }
  if (HCARD() && R()<(estate?0.2:0.06)){ const prod=pick(releasedProducts()); const x=makeSealed(prod.id, fmtOf(prod,'pack'), own, null); addEntry(s,{t:'s',id:x.id}); }
  // flat pricing: most house sales price by the box
  if (R()<0.6){ const flat = pick([0.25,0.5,1,1,2]); for (const e of s.inv){ if (e.t!=='s') { e.p=flat; e.bx=flat; } } }
}
function endEvent(ev){
  ev.st=2; const H=G.hunt;
  for (const s of evSellers(ev)){
    if (s.temp){ // leftovers: most go back to the house or the bin; the good stuff finds a buyer eventually
      for (const e of s.inv.slice()){ const v=trueValue(e); if (v>8 && R()<0.6){ const n=pick(npcPool(e.t==='m'?{comic:1}:{})); giveTo(e,n.id,e.p,'bought',whereName(s)); } else delObj(e); }
      s.inv=[]; s.gone=1;
    } else { for (const e of s.inv.slice()) if (e.ev===ev.id){ delObj(e); removeEntry(s,e); } s.mood=0; }
  }
}
function delObj(e){ const o=objOf(e); if (!o || o.o>=0) return; if (e.t==='c') delete G.cards[e.id]; else if (e.t==='m') delete G.mc[e.id]; else delete G.sealed[e.id]; }
// ---- attending ----
function evCost(ev){ return ev.cost + (ev.days>1 && ev.cost>40 ? 0 : 0); }
function enterEvent(evId, late){
  const ev=G.hunt.ev.find(x=>x.id===evId); if (!ev || !evLive(ev)) return 'That event isn\'t on today.';
  if (!ev.paid){ if (G.player.cash<ev.cost) return 'Getting there costs '+money(ev.cost)+'.'; G.player.cash-=ev.cost; G.player.fees+=ev.cost; ev.paid=1; }
  startEvent(ev);
  const ss = G.hunt.sess;
  if (ss && ss.ev===evId && ss.day===G.day) return null;
  G.hunt.sess={ev:evId, day:G.day, clock: late?240:0, seen:[], dug:{}};
  if (late) evClock(240, true);
  return null;
}
function evClock(min, silent){
  const ss=G.hunt.sess; if (!ss) return; const ev=G.hunt.ev.find(x=>x.id===ss.ev);
  if (!silent) ss.clock=Math.min(480, ss.clock+min);
  const busy = {nshow:3, bcon:3, rshow:2, rcon:2, ccon:2}[ev.ty]||1;
  for (const s of evSellers(ev)) npcBrowse(s, poisson(min/60*1.6*busy*(ss.clock<120?1.6:1)));
  if (G.hunt.tbl && G.hunt.tbl.ev===ev.id) tableSales(min);
}
function leaveEvent(){ const ss=G.hunt.sess; if (!ss) return; const ev=G.hunt.ev.find(x=>x.id===ss.ev); if (ss.clock<480) evClock(480-ss.clock); G.hunt.sess=null; }
// ---- player's own table ----
function rentTable(evId, items, pct){
  const ev=G.hunt.ev.find(x=>x.id===evId); const fee = ev.ty==='nshow'||ev.ty==='bcon'?250: ev.ty==='rshow'||ev.ty==='rcon'||ev.ty==='ccon'?90: 30;
  if (G.player.cash<fee) return 'A table costs '+money(fee)+'.';
  G.player.cash-=fee; G.player.fees+=fee;
  G.hunt.tbl={ ev:evId, fee, items: items.map(e=>{ const it=huntItem(e); return {t:e.t, id:e.id, p:nicePrice(Math.max(1,it.v*pct))}; }), sold:[] };
  return null;
}
function tableSales(min){
  const T=G.hunt.tbl; if (!T) return;
  for (const x of T.items.slice()){ const o=objOf(x); if (!o || o.o!==0){ T.items=T.items.filter(y=>y!==x); continue; }
    const it=huntItem(x); const lam = min/60*0.35*(it.v>=x.p?1.4:it.v>=x.p*0.85?0.5:0.1);
    if (R() < 1-Math.exp(-lam)){ const n=pick(npcPool(x.t==='m'?{comic:1}:{})); let pr=x.p; const val=npcValuation(n,it); if (val<pr*0.92) continue; if (val<pr) pr=nicePrice(Math.max(val, pr*0.9));
      if (n.cash<pr) continue; n.cash-=pr; G.player.cash+=pr; G.player.sold+=pr; giveTo(x,n.id,pr,'bought','your table'); if (x.t!=='s') (o.h=o.h||[]).push([G.day,'Sold at your table',pr,n.h]);
      T.sold.push([x.t,x.id,pr,n.h]); T.items=T.items.filter(y=>y!==x); toast('Sold at your table: '+huntLabel(x)+' for '+money(pr,true), true); }
  }
}
// ---- signings ----
function cardSigMult(c){ const sg=c.sg; if (!sg) return 1; const p=P(sg.pid); const d=D(c.k); return 1 + Math.min(2.2, 0.8*Math.max(0,p.S||0)*(d.rc||d.first?1.6:1)); }
function signItem(evId, si, t, id){
  const ev=G.hunt.ev.find(x=>x.id===evId); const sg=ev.sign[si]; if (!sg) return 'They\'ve packed up.';
  if (G.player.cash<sg.fee) return 'The signing fee is '+money(sg.fee)+'.';
  if (t==='m'){ const cp=G.mc[id]; if (!cp || cp.o!==0 || cp.l || cp.g!==0 || cp.sg) return 'That comic can\'t be signed.'; cp.sg={c:sg.id, s:'w', real:1, ev:ev.n, d:G.day}; (cp.h=cp.h||[]).push([G.day,'Signed in person by '+CR_(sg.id).n+' at '+ev.n,sg.fee,'']); }
  else { const c=G.cards[id]; if (!c || c.o!==0 || c.l || c.g!==0 || c.sg || D(c.k).auto) return 'That card can\'t be signed.'; c.sg={pid:sg.id, s:'w', ev:ev.n, d:G.day}; (c.h=c.h||[]).push([G.day,'Signed in person by '+pname(P(sg.id))+' at '+ev.n,sg.fee,'']); }
  G.player.cash-=sg.fee; G.player.fees+=sg.fee; if (G.hunt.sess) evClock(20); return null;
}
// ---- private collections ----
function makePrivate(fromDealer){
  const H=G.hunt; const type = fromDealer? 'dealer' : pick((HCARD()&&HCOMIC())? ['team','child','horror','indie','oldread','dealer','inherit','team','child','indie'] : HCARD()? ['team','child','dealer','inherit','team','child'] : ['horror','indie','oldread','dealer','inherit','indie']);
  const kind = type==='dealer'?'liq': type==='child'||type==='inherit'?'kid':'priv';
  const know = type==='dealer'? {card:0.8,vcard:0.7,comic:0.75,ocomic:0.7,sealed:0.8} : type==='child'||type==='inherit'? {card:0.1,vcard:0.1,comic:0.1,ocomic:0.15,sealed:0.3} : {card:0.55,vcard:0.5,comic:0.6,ocomic:0.5,sealed:0.6};
  const tm=ri(0,TEAMS_DEF.length-1);
  const s=newSeller(kind,{n:'', who:personName(), know, prof:{}, temp:1, urg:rf(0.1,0.8)}); const own=HSID(s.id);
  s.n = {team:teamName(tm)+' collection', child:'Childhood card collection', horror:'Horror comics collection', indie:'Indie comics collection', oldread:'Old reader copies', dealer:'Dealer inventory lot', inherit:'Inherited collection'}[type];
  s.story = pick(PV_STORIES[type]).replace('{team}', teamName(tm));
  const add=(t,o)=>{ if (o){ o.o=own; s.inv.push({t, id:o.id, d:G.day}); } };
  if (type==='team'){ for (let i=0;i<ri(60,180);i++){ const o=takeNpc('c', c=>P(D(c.k).pid).tm===tm) || makeCard(randCardKey({}),own,null); add('c',o); } for (let i=0;i<ri(0,2);i++){ const prod=pick(releasedProducts()); add('s', makeSealed(prod.id,pick(Object.keys(B(prod).formats)),own,null)); } }
  else if (type==='child'){ const prods=releasedProducts().filter(p=>yearOf(G.day)-p.yr>=2); for (let b=0;b<ri(4,14);b++){ const prod=pick(prods.length?prods:releasedProducts()); const packs=genSealed(prod,Object.keys(B(prod).formats)[0],Math.floor(R()*2e9)); for (const k of packs.flat()){ const c=makeCard(k,own,null); c.c=c.c.map(v=>Math.max(20,v-ri(0,18))); add('c',c); } } }
  else if (type==='horror'){ const runs=G.cm.ser.filter(x=>x.g===GI.horror && x.n>=10); const run=runs.length?pick(runs):pick(G.cm.ser.filter(x=>x.n>=10)); for (let n=1;n<=Math.min(run.n,80);n++) if (R()<0.85) add('m', cmMakeCopy(mk(run.id,n,1,''),own,null,'lot')); for (let i=0;i<ri(30,90);i++) add('m', cmMakeCopy(randComicKey({horror:1}),own,null,'lot')); s.run=run.id; }
  else if (type==='indie'){ const runs=G.cm.ser.filter(x=>tierOf(x)>=2 && x.n>=4 && yearOf(x.st)>=2005).sort(()=>R()-0.5).slice(0,ri(4,9)); for (const x of runs) for (let n=1;n<=Math.min(x.n,30);n++) if (R()<0.7){ const cp=cmMakeCopy(mk(x.id,n,1,R()<0.08&&x.v[n]?x.v[n].split(',')[0]:''),own,null,'npc'); if (n===1 && R()<0.15) cp.sg={c:x.w, s:'u', real:R()<0.8?1:0}; add('m',cp); } }
  else if (type==='oldread'){ for (let i=0;i<ri(80,300);i++){ const cp=cmMakeCopy(randComicKey({old:1}),own,null,'lot'); cp.c=cp.c.map(v=>Math.max(5,v-ri(0,12))); add('m',cp); } }
  else if (type==='dealer'){ for (let i=0;i<ri(40,120);i++){ const cat=pick(['mod','slab','key','comic','pros','ocomic']); const e=acquireFor(s,cat); if (e) s.inv.push({t:e.t,id:e.id,d:G.day}); } }
  else { for (let i=0;i<ri(40,160);i++){ if (HCOMIC() && (!HCARD() || R()<0.5)){ const cp=cmMakeCopy(randComicKey({old:R()<0.6}),own,null,'lot'); add('m',cp); } else add('c', makeCard(randCardKey({old:1}),own,null)); } if (HCARD() && R()<0.3){ const prod=pick(releasedProducts()); add('s', makeSealed(prod.id,fmtOf(prod,'hobby'),own,null)); } }
  // what the seller believes it's worth: the highlights they know about, plus a bulk rate
  const ests=s.inv.map(e=>[e, sellerEst(s,e)]).sort((a,b)=>b[1]-a[1]);
  let perceived = 0; ests.forEach(([e,v],i)=>{ perceived += i<15 ? v*0.85 : Math.min(v,8)*0.55; });
  const ask = nicePrice(Math.max(40, perceived*rf(0.95,1.25)));
  const pv={ id:H.nid++, sid:s.id, type, ask, desired:nicePrice(ask*rf(0.85,0.95)), min:nicePrice(ask*rf(type==='dealer'?0.8:0.68, 0.86)), mode: type==='dealer'||type==='indie'||R()<0.25?'cherry':'all',
    samp: kind==='kid'?ri(25,60):ri(12,35), rev:[], hl: ests.slice(0,4).filter(x=>x[1]>4).map(x=>x[0].t+':'+x[0].id), exp:G.day+ri(6,14), made:G.day, mood:0, from:fromDealer||null };
  if (pv.mode==='cherry') for (const [e,v] of ests) e.p = Math.max(0.5, nicePrice(v*s.mg));
  H.pv.push(pv); return pv;
}
function pvSeller(pv){ return G.hunt.sel[pv.sid]; }
function pvReveal(pv, n){ const s=pvSeller(pv); const hidden=s.inv.map((e,i)=>i).filter(i=>!pv.rev.includes(i)); for (let k=0;k<n && pv.rev.length<pv.samp && hidden.length;k++){ pv.rev.push(hidden.splice(Math.floor(R()*hidden.length),1)[0]); } }
function pvOffer(pv, amt){
  if (pv.mood>=3) return {no:'The seller has stopped taking your calls.'};
  if (amt>=pv.desired) return {ok:1,price:amt};
  if (amt>=pv.min){ if (R()<0.4) return {ok:1,price:amt}; const c=nicePrice((amt+pv.desired)/2); pv.counter=c; return {counter:c, msg:`The seller comes back at ${money(c)}.`}; }
  if (amt<pv.min*0.65){ pv.mood++; return {no:'The seller thinks that\'s a lowball. "I\'ll wait for someone serious."'}; }
  const c=nicePrice(Math.max(pv.min*1.03,(amt+pv.ask)/2)); pv.counter=c; return {counter:c, msg:`"I could maybe do ${money(c)}."`};
}
function pvBuyAll(pv, price){
  const s=pvSeller(pv); if (G.player.cash<price) return 'You need '+money(price)+'.';
  G.player.cash-=price; G.player.bought+=price; const n=s.inv.length; const where=s.n+' ('+s.who+')';
  const ids=[]; for (const e of s.inv.slice()){ giveTo(e,0,Math.round(price/n*100)/100,'lot',where); ids.push(e.t+':'+e.id); G.hunt.found.unshift([G.day,e.t,e.id,price/n,where,trueValue(e)]); }
  G.hunt.found.length=Math.min(G.hunt.found.length,80);
  s.inv=[]; s.gone=1; G.hunt.pv=G.hunt.pv.filter(x=>x!==pv); G.player.lastLot={t:G.day, kn:s.n, ids, price};
  return null;
}
function expirePrivate(pv){ const s=pvSeller(pv); for (const e of s.inv.slice()){ const v=trueValue(e); if (v>5){ const n=pick(npcPool(e.t==='m'?{comic:1}:{})); giveTo(e,n.id,0,'bought',s.n); } else delObj(e); } s.inv=[]; s.gone=1; G.hunt.pv=G.hunt.pv.filter(x=>x!==pv); }
// ---- major auctions ----
function makeAuction(t){
  const H=G.hunt; const lots=[];
  const cards=!HCARD()? [] : Object.values(G.cards).filter(c=>c.o>0 && !c.l && c.g>=0).map(c=>['c',c,cardValue(c)]).filter(x=>x[2]>120).sort((a,b)=>b[2]-a[2]).slice(0,40);
  const comics=!HCOMIC()? [] : Object.values(G.mc).filter(c=>c.o>0 && !c.l && c.g>=0).map(c=>['m',c,cmCopyValue(c)]).filter(x=>x[2]>120).sort((a,b)=>b[2]-a[2]).slice(0,40);
  const pool=cards.concat(comics).sort(()=>R()-0.5).slice(0,ri(12,20));
  // a few grails come out of long-held collections
  if (HCOMIC()) for (let i=0;i<2;i++){ const s=pick(G.cm.ser.filter(x=>x.n && x.heat+x.spec>2)); if (!s) break; const cp=cmMakeCopy(mk(s.id,1,1,''), 0, null, 'npc'); cp.c=cp.c.map(v=>Math.min(100,v+ri(8,20))); cmGradeCopy(cp); const n=pick(npcPool({comic:1})); cp.o=n.id; pool.push(['m',cp,cmCopyValue(cp)]); }
  for (const [ty,o,v] of pool){ lots.push({ n:lots.length+1, t:ty, id:o.id, from:o.o, est:[nicePrice(v*0.75), nicePrice(v*1.3)], res:nicePrice(v*0.6), mx:0, res2:null }); o.o=-900; }
  const a={ id:H.nid++, n:AUCTION_HOUSE+' '+['Spring','Summer','Fall','Winter'][Math.floor((mdOf(t)[0]-1)/3)]+' Signature Auction', ann:t-35, d:t, lots, done:0 };
  H.auc.push(a); return a;
}
function closeAuction(a){
  a.done=1; const bidders=G.npcs.filter(n=>['high','dealer','cgold','cslab','ckey','cdlr','pc','auto','vintage','cfa','cadp'].includes(n.ty) || n.cash>4000);
  for (const L_ of a.lots){ const e={t:L_.t,id:L_.id}; const o=objOf(e); if (!o) continue; const it=huntItem(e);
    const vals=bidders.map(n=>[n, Math.min(n.cash, npcValuation(n,it)*rf(0.9,1.15))]).sort((x,y)=>y[1]-x[1]);
    const top=vals[0], second=vals[1]; const pl=L_.mx||0;
    let win=null, price=0;
    if (pl>0 && pl>=top[1] && pl>=L_.res){ win=0; price=Math.max(L_.res, Math.min(pl, top[1]+bidInc(top[1]))); }
    else if (top[1]>=L_.res){ win=top[0]; price=Math.max(L_.res, Math.min(top[1], Math.max(second[1], pl)+bidInc(Math.max(second[1],pl)))); }
    price=Math.round(price*100)/100; const prem=Math.round(price*0.15*100)/100;
    const from=NPC(L_.from);
    if (win===null){ o.o=L_.from; L_.res2={unsold:1}; continue; }
    if (win===0){ if (G.player.cash<price+prem){ o.o=L_.from; L_.res2={unsold:1, pnc:1}; toast('You couldn\'t cover lot '+L_.n+'. It went unsold.'); continue; } G.player.cash-=price+prem; G.player.bought+=price+prem; o.o=0; o.a=[G.day,'won',price+prem,AUCTION_HOUSE]; if (L_.t!=='s') (o.h=o.h||[]).push([G.day,'Won at '+a.n,price+prem,'']); o.nw=1; toast('You won lot '+L_.n+' at '+AUCTION_HOUSE+': '+money(price+prem,true)+' with premium', true); }
    else { win.cash-=price+prem; o.o=win.id; giveTo(e, win.id, price, 'bought', AUCTION_HOUSE); }
    if (from) from.cash+=price*0.9;
    L_.res2={p:price, w: win===0?'You':win.h};
    recordSale(it.key, price+prem, (L_.t==='c'?(o.g>0?o.g:0):(o.g>0?o.g:0)), win===0?0:win.id, L_.from);
  }
  addNews(`${AUCTION_HOUSE.toUpperCase()} SALE REALIZES ${money(a.lots.reduce((s,l)=>s+(l.res2&&l.res2.p||0),0)).toUpperCase()}`, `Top lot: ${(()=>{ const b=a.lots.filter(l=>l.res2&&l.res2.p).sort((x,y)=>y.res2.p-x.res2.p)[0]; return b? huntLabel({t:b.t,id:b.id})+' at '+money(b.res2.p) : 'nothing sold'; })()}.`, null, 'hobby');
}
// ---- want list ----
function wantHas(w){ return G.hunt.want.some(x=>x.t===w.t && x.id===w.id); }
function wantToggle(w){ const i=G.hunt.want.findIndex(x=>x.t===w.t && x.id===w.id); if (i>=0) G.hunt.want.splice(i,1); else G.hunt.want.push(w); }
function wantMatch(e){
  const o=objOf(e); if (!o || e.t==='s') return false; const W=G.hunt.want; if (!W.length) return false;
  if (e.t==='c'){ const d=D(o.k); return W.some(w=>(w.t==='p'&&w.id===d.pid)||(w.t==='k'&&w.id===o.k)||(w.t==='pr'&&w.id===d.prod.id)); }
  const d=cmD(o.k); const s=d.s; return W.some(w=>(w.t==='s'&&w.id===s.id)||(w.t==='i'&&(w.id===o.k||w.id===mk(s.id,d.n,1,'')))||(w.t==='cr'&&(s.w===w.id||s.a===w.id||s.cv===w.id)));
}
// ---- the daily tick ----
function huntDay(t){
  if (!G.hunt) return;
  const H=G.hunt; if (!H) return;
  if (H.sess && H.sess.day!==t) leaveEvent();
  // shops: customers browse, dealers restock and reprice
  for (const s of H.sel){ if (s.gone) continue;
    if (s.shop) npcBrowse(s, poisson(s.kind==='pro'?5:2.5));
    else if (s.flea || (s.dealer && R()<0.3)) npcBrowse(s, poisson(0.6));
    if (dowOf(t)===1 && !s.temp){ const target = s.shop? 50 : s.flea? 32 : 40; if (s.inv.length<target) stockSeller(s, Math.min(8, target-s.inv.length)); for (const e of s.inv){ if (e.bx) continue; if (t-e.d>28 && R()<0.25) e.p=Math.max(0.5,nicePrice(e.p*0.9)); else if (R()<0.15) e.p=priceFor(s,e); }
      // stale stock goes to a dealer who will auction it online
      for (const e of s.inv.slice()){ if (!e.bx && t-e.d>120 && R()<0.3){ const n=pick(G.npcs.filter(x=>x.ty==='dealer'||x.ty==='cdlr')); giveTo(e,n.id,e.p*0.7,'bought',s.n); removeEntry(s,e); } }
      s.mood=0; if (s.cash<500) s.cash+=ri(300,900); }
  }
  // events
  for (const ev of H.ev){ if (!ev.st && ev.d===t) startEvent(ev); if (ev.st===1 && t>=ev.d+ev.days) endEvent(ev); }
  H.ev = H.ev.filter(ev=>ev.d+ev.days>t-21);
  H.sel.forEach(s=>{ if (s.gone && s.inv.length===0){ s.inv=[]; } });
  if (dowOf(t)===1) scheduleEvents(t, t+70);
  // private collections
  for (const pv of H.pv.slice()) if (t>pv.exp) expirePrivate(pv);
  if (H.pv.length<3 && R()<0.14) makePrivate();
  const friend = H.sel.find(s=>s.shop && s.rel>=5 && R()<0.01); if (friend && H.pv.length<4){ const pv=makePrivate(friend.id); pv.samp+=20; toast(`${friend.who} from ${friend.n} called: they're sitting on a dealer lot and wanted you to have first look.`, true); }
  // major auctions, quarterly
  if (!H.auc.some(a=>!a.done) && [2,5,8,11].includes(mdOf(t)[0]) && mdOf(t)[1]===1) makeAuction(t+35);
  for (const a of H.auc) if (!a.done && t>=a.d) closeAuction(a);
  H.auc=H.auc.filter(a=>!a.done || a.d>t-60);
  if (H.tbl){ const ev=H.ev.find(x=>x.id===H.tbl.ev); if (!ev || t>=ev.d+ev.days){ H.tbl=null; } else if (evLive(ev) && (!H.sess || H.sess.ev!==ev.id)) tableSales(240); }
  // prune the dead temporary sellers occasionally, keeping ids stable
  if (t%30===0) for (const s of H.sel) if (s.gone && s.inv.length===0){ s.junk=null; s.story=null; }
}
function huntNormalize(){ const H=G.hunt; if (!H) return; H.want=H.want||[]; H.found=H.found||[]; H.pv=H.pv||[]; H.auc=H.auc||[]; if (H.sess && H.sess.day!==G.day) H.sess=null; }

// ===================== VISUALS: physical collectibles (proof of concept) =====================
// Velocity Chrome cards and Black Lantern Press comics get the new renderer. Everything else is unchanged.
const VF='font-family="Barlow Condensed,Arial Narrow,sans-serif"';
const r2=x=>Math.round(x*10)/10;
// ---------- pose engine: a jointed figure, so the same player can be photographed in many moments ----------
const POSES = {
  stance:  {lean:-6, arms:[40,160,70,170], legs:[-15,-5,18,5], bat:[200,82], helmet:1},
  swing:   {lean:8,  arms:[78,86,96,92], legs:[-32,-8,26,2], bat:[96,92], helmet:1, blur:1},
  follow:  {lean:-10,arms:[150,-140,-170,-122], legs:[-20,-8,32,-22], bat:[-62,86], helmet:1},
  run:     {lean:18, arms:[-38,58,48,150], legs:[-48,8,42,104], helmet:1, blur:1},
  field:   {lean:26, py:26, arms:[22,-6,-8,22], legs:[-42,10,42,-10], glove:'L'},
  throw:   {lean:-6, arms:[80,70,-122,-172], legs:[34,2,-26,-10], glove:'L', ball:'R'},
  pitch:   {lean:-4, arms:[40,150,-22,-152], legs:[100,6,2,0], glove:'L', ball:'R'},
  catch:   {lean:-4, py:-8, arms:[164,176,28,12], legs:[-10,0,16,24], glove:'L'},
  cheer:   {lean:0, arms:[-150,-168,150,168], legs:[-8,-3,8,3]},
  candid:  {lean:0, arms:[16,98,-16,-98], legs:[-6,-2,6,2], crop:'three'},
  portrait:{lean:0, arms:[-8,-4,8,4], legs:[-6,-2,6,2], crop:'close'},
  tip:     {lean:2, arms:[-8,-4,150,-128], legs:[-6,-2,6,2], crop:'three'}
};
const POSE_BAT=['stance','swing','follow','run','candid','portrait','cheer','tip','field','catch'], POSE_PIT=['pitch','throw','candid','portrait','cheer','tip','field'];
function pv(a,l){ const r=a*Math.PI/180; return [Math.sin(r)*l, Math.cos(r)*l]; }
function add2(p,q){ return [p[0]+q[0], p[1]+q[1]]; }
function poseFig(p, poseId, c1, c2, uid, flip){
  const P=POSES[poseId]||POSES.stance; const skin=SKIN[p.sk]; const jersey = lum(c1)>0.7 ? c2 : '#f2f2ee'; const pants='#e8e7e2';
  const pel=[125, 236+(P.py||0)]; const dir=pv(180+P.lean,1); const perp=[-dir[1], dir[0]];
  const sc=add2(pel, pv(180+P.lean, 84)); const head=add2(sc, pv(180+P.lean, 40));
  const sh=[[sc[0]-perp[0]*20, sc[1]-perp[1]*20],[sc[0]+perp[0]*20, sc[1]+perp[1]*20]];
  const hp=[[pel[0]-perp[0]*11, pel[1]-perp[1]*11],[pel[0]+perp[0]*11, pel[1]+perp[1]*11]];
  const A=P.arms, L=P.legs;
  const el=[add2(sh[0],pv(A[0],40)), add2(sh[1],pv(A[2],40))], hd=[add2(el[0],pv(A[1],37)), add2(el[1],pv(A[3],37))];
  const kn=[add2(hp[0],pv(L[0],50)), add2(hp[1],pv(L[2],50))], ft=[add2(kn[0],pv(L[1],52)), add2(kn[1],pv(L[3],52))];
  const seg=(a,b,c,w,col)=>`<path d="M${r2(a[0])} ${r2(a[1])} L${r2(b[0])} ${r2(b[1])} L${r2(c[0])} ${r2(c[1])}" stroke="${col}" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  const out=[];
  out.push(`<ellipse cx="125" cy="${r2(Math.max(ft[0][1],ft[1][1])+6)}" rx="62" ry="9" fill="#000" opacity=".28"/>`);
  // legs: pants, socks, cleats
  for (let i=0;i<2;i++){ out.push(seg(hp[i],kn[i],ft[i],18,pants)); const sk=add2(kn[i],[ (ft[i][0]-kn[i][0])*0.45, (ft[i][1]-kn[i][1])*0.45 ]); out.push(`<path d="M${r2(sk[0])} ${r2(sk[1])} L${r2(ft[i][0])} ${r2(ft[i][1])}" stroke="${c1}" stroke-width="15" stroke-linecap="round"/>`); out.push(`<ellipse cx="${r2(ft[i][0]+5)}" cy="${r2(ft[i][1]+3)}" rx="12" ry="6" fill="#16181b"/>`); }
  // torso with a little shading
  const tp=[sh[0], sh[1], [hp[1][0]+perp[0]*6, hp[1][1]+perp[1]*6], [hp[0][0]-perp[0]*6, hp[0][1]-perp[1]*6]];
  out.push(`<path d="M${tp.map(x=>r2(x[0])+' '+r2(x[1])).join(' L')} Z" fill="${jersey}" stroke="${shade(jersey,-0.35)}" stroke-width="1.5" stroke-linejoin="round"/>`);
  out.push(`<path d="M${r2(sc[0])} ${r2(sc[1])} L${r2(tp[2][0])} ${r2(tp[2][1])} L${r2(tp[1][0])} ${r2(tp[1][1])} Z" fill="#000" opacity=".08"/>`);
  out.push(`<path d="M${r2(sc[0])} ${r2(sc[1]+2)} L${r2(pel[0])} ${r2(pel[1]-6)}" stroke="${c1}" stroke-width="2" opacity=".6"/>`);
  out.push(`<path d="M${r2(tp[3][0])} ${r2(tp[3][1]-4)} L${r2(tp[2][0])} ${r2(tp[2][1]-4)}" stroke="${shade(c1,-0.2)}" stroke-width="6"/>`);
  const cx=(sc[0]+pel[0])/2, cy=(sc[1]+pel[1])/2-4;
  out.push(`<text x="${r2(cx+(flip?-10:10))}" y="${r2(cy)}" text-anchor="middle" ${VF} font-weight="800" font-size="22" fill="${c1}" ${flip?`transform="translate(${r2(2*(cx+(flip?-10:10)))},0) scale(-1,1)"`:''}>${p.num}</text>`);
  // arms: sleeves then forearms
  const arm=(i)=>{ const mid=add2(sh[i],[ (el[i][0]-sh[i][0])*0.55, (el[i][1]-sh[i][1])*0.55 ]); return `<path d="M${r2(sh[i][0])} ${r2(sh[i][1])} L${r2(mid[0])} ${r2(mid[1])}" stroke="${jersey}" stroke-width="15" stroke-linecap="round"/>`+seg(mid,el[i],hd[i],11,skin)+`<circle cx="${r2(hd[i][0])}" cy="${r2(hd[i][1])}" r="6.5" fill="${skin}"/>`; };
  const back = P.lean<0 ? 1 : 0;
  out.splice(1,0, arm(back));
  out.push(arm(1-back));
  // props
  if (P.bat){ const hm=[(hd[0][0]+hd[1][0])/2,(hd[0][1]+hd[1][1])/2]; const tip=add2(hm,pv(P.bat[0],P.bat[1])); const knob=add2(hm,pv(P.bat[0]+180,8));
    if (P.blur) out.push(`<path d="M${r2(hm[0])} ${r2(hm[1])} L${r2(tip[0])} ${r2(tip[1])}" stroke="#fff" stroke-width="16" opacity=".12" stroke-linecap="round"/>`);
    out.push(`<path d="M${r2(knob[0])} ${r2(knob[1])} L${r2(tip[0])} ${r2(tip[1])}" stroke="#b8894f" stroke-width="6" stroke-linecap="round"/><path d="M${r2(hm[0]+(tip[0]-hm[0])*0.55)} ${r2(hm[1]+(tip[1]-hm[1])*0.55)} L${r2(tip[0])} ${r2(tip[1])}" stroke="#9c6b35" stroke-width="10" stroke-linecap="round"/>`); }
  if (P.glove){ const g=hd[0]; out.push(`<ellipse cx="${r2(g[0])}" cy="${r2(g[1])}" rx="13" ry="11" fill="#7a4a22" stroke="#4b2a10" stroke-width="1.5"/><path d="M${r2(g[0]-7)} ${r2(g[1]-3)} q7 -6 14 0" stroke="#4b2a10" fill="none"/>`); }
  if (P.ball){ const b=hd[1]; out.push(`<circle cx="${r2(b[0])}" cy="${r2(b[1]-6)}" r="4.5" fill="#fafafa" stroke="#c33" stroke-width=".8"/>`); }
  if (P.blur) out.push(`<g opacity=".35" stroke="#fff" stroke-width="2">${[0,1,2].map(i=>`<path d="M${r2(sc[0]-60-i*10)} ${r2(sc[1]+20+i*18)} l-30 0"/>`).join('')}</g>`);
  // head: neck, face, ear, cap or helmet
  out.push(`<path d="M${r2(sc[0])} ${r2(sc[1])} L${r2(head[0])} ${r2(head[1]+12)}" stroke="${skin}" stroke-width="12"/>`);
  out.push(`<circle cx="${r2(head[0])}" cy="${r2(head[1])}" r="18" fill="${skin}"/><circle cx="${r2(head[0]-2)}" cy="${r2(head[1]+2)}" r="4" fill="${shade(skin,-0.15)}"/><circle cx="${r2(head[0]+9)}" cy="${r2(head[1]+1)}" r="1.8" fill="#222"/>`);
  if (P.helmet) out.push(`<path d="M${r2(head[0]-19)} ${r2(head[1]+2)} Q${r2(head[0]-19)} ${r2(head[1]-22)} ${r2(head[0])} ${r2(head[1]-22)} Q${r2(head[0]+19)} ${r2(head[1]-22)} ${r2(head[0]+19)} ${r2(head[1]-2)} L${r2(head[0]+27)} ${r2(head[1]-2)} L${r2(head[0]+27)} ${r2(head[1]+2)} Z" fill="${c1}" stroke="${shade(c1,-0.4)}" stroke-width="1"/><path d="M${r2(head[0]-19)} ${r2(head[1]+2)} q-2 10 8 12 l2 -12 Z" fill="${c1}"/><path d="M${r2(head[0]-8)} ${r2(head[1]-16)} q8 -4 16 0" stroke="#fff" stroke-width="3" opacity=".55" fill="none"/>`);
  else out.push(`<path d="M${r2(head[0]-18)} ${r2(head[1]-2)} Q${r2(head[0]-17)} ${r2(head[1]-22)} ${r2(head[0])} ${r2(head[1]-22)} Q${r2(head[0]+17)} ${r2(head[1]-22)} ${r2(head[0]+18)} ${r2(head[1]-4)} Z" fill="${c1}"/><path d="M${r2(head[0]+14)} ${r2(head[1]-5)} Q${r2(head[0]+30)} ${r2(head[1]-6)} ${r2(head[0]+34)} ${r2(head[1]-1)} L${r2(head[0]+14)} ${r2(head[1]-1)} Z" fill="${shade(c1,-0.3)}"/><circle cx="${r2(head[0])}" cy="${r2(head[1]-22)}" r="2" fill="${shade(c1,-0.3)}"/>`);
  let g=out.join('');
  const crop=P.crop||'full';
  const ctf = crop==='three'? 'translate(125 185) scale(1.5) translate(-125 -165)' : crop==='close'? `translate(125 170) scale(2.4) translate(${-r2(head[0])} ${-r2(head[1]+8)})` : '';
  return `<g transform="${flip?'translate(250,0) scale(-1,1) ':''}${ctf}">${g}</g>`;
}
function poseFor(d, p){
  const pit = isPitcher(p); const lib = pit? POSE_PIT : POSE_BAT;
  let h = hsh(d.prod.id+'|'+d.sec+'|'+d.no+'|'+p.id); // parallels share the photo; variations and other sets don't
  if (d.variation) h = hsh('var'+d.prod.id+d.no+d.sec);
  if (d.auto) return lib[(h>>3)%3===0?4:(h%lib.length)];
  return lib[h%lib.length];
}
// ---------- materials ----------
function stockNoise(uid, op){ let dots=''; const r=mkRng(hsh('noise'+uid)); for (let i=0;i<40;i++) dots+=`<rect x="${(r()*24).toFixed(1)}" y="${(r()*24).toFixed(1)}" width="1" height="1" fill="${r()<0.5?'#fff':'#000'}"/>`; return `<pattern id="nz${uid}" width="24" height="24" patternUnits="userSpaceOnUse">${dots}</pattern>`; }
function chromeGrad(id, tint){ const t=tint||'#9aa4ae'; return `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${shade(t,-0.55)}"/><stop offset=".22" stop-color="${shade(t,0.55)}"/><stop offset=".38" stop-color="${shade(t,-0.2)}"/><stop offset=".55" stop-color="${shade(t,0.75)}"/><stop offset=".72" stop-color="${shade(t,-0.35)}"/><stop offset="1" stop-color="${shade(t,0.35)}"/></linearGradient>`; }
function prismPattern(id, op){ const hues=['#ff4d6d','#ffb703','#8ac926','#1fb5ff','#8d5cf6','#ff4d6d']; return `<pattern id="${id}" width="30" height="30" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)">${hues.map((c,i)=>`<rect x="${i*5}" width="5" height="30" fill="${c}" opacity="${op}"/>`).join('')}</pattern>`; }
// ---------- Velocity Chrome ----------
function velStage(uid, c1, c2, kind){
  const r=mkRng(hsh('st'+uid));
  if (kind==='launch'){ let o=`<rect width="250" height="350" fill="url(#bg${uid})"/>`; o+=`<path d="M20 330 Q125 -40 250 150" stroke="#8fd3ff" stroke-width="2" fill="none" stroke-dasharray="6 5" opacity=".7"/>`; for (let a=10;a<=45;a+=5){ const x=40+a*4; o+=`<path d="M${x} 330 l0 -8" stroke="#8fd3ff" opacity=".5"/><text x="${x}" y="318" ${VF} font-size="8" fill="#8fd3ff" opacity=".6" text-anchor="middle">${a}°</text>`; } return o; }
  if (kind==='nextup'){ let o=`<rect width="250" height="350" fill="url(#bg${uid})"/>`; for (let i=0;i<7;i++) o+=`<rect x="${20+i*32}" y="${330-40-i*28}" width="22" height="${40+i*28}" fill="${c1}" opacity="${0.12+i*0.04}"/>`; return o; }
  if (kind==='vortex'){ let o=`<rect width="250" height="350" fill="#07080c"/>`; for (let i=14;i>0;i--) o+=`<ellipse cx="125" cy="170" rx="${i*16}" ry="${i*12}" fill="none" stroke="${['#3c7dd9','#9b59d0','#20b2aa','#e84393','#f4d35e'][i%5]}" stroke-width="5" opacity=".35" transform="rotate(${i*13} 125 170)"/>`; return o; }
  let o=`<rect width="250" height="350" fill="url(#bg${uid})"/>`;
  for (let i=0;i<9;i++){ const x=r()*250, y=20+r()*90, s=6+r()*18; o+=`<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${s.toFixed(0)}" fill="#fff" opacity="${(0.04+r()*0.08).toFixed(2)}"/>`; }
  o+=`<rect x="0" y="150" width="250" height="60" fill="${shade(c1,-0.6)}" opacity=".6"/>`;
  for (let i=0;i<70;i++) o+=`<rect x="${(r()*250).toFixed(0)}" y="${(152+r()*55).toFixed(0)}" width="2" height="2" fill="${r()<0.3?c2:'#fff'}" opacity="${(0.15+r()*0.2).toFixed(2)}"/>`;
  o+=`<path d="M0 262 Q125 236 250 262 L250 350 L0 350 Z" fill="#2f6b3a"/><path d="M0 262 Q125 236 250 262" stroke="#e9e2cf" stroke-width="3" fill="none" opacity=".6"/><path d="M40 350 Q125 286 210 350" fill="#b88a5a" opacity=".55"/>`;
  return o;
}
function velFront(key, serial, opts){
  opts=opts||{};
  const d=D(key), p=P(d.pid), br=B(d.prod), yr=d.prod.yr;
  const car=p.car[yr-1]; const tmOnCard=(car&&car.t>=0)?car.t:(p.tm>=0?p.tm:p.org); const T=TEAMS_DEF[tmOnCard]||TEAMS_DEF[0]; const c1=T[3], c2=T[4];
  const uid=(hsh(key+'#'+serial+'v2')%1e7).toString(36); const par=d.parObj; const run=d.run||0;
  const name=pname(p); const flip=hsh(p.id+'f'+d.sec)%3===0;
  const kind = d.caseHit?'vortex': d.ins? (br.ins[+d.sec.slice(1)].n==='Launch Angle'?'launch':'nextup') : 'base';
  const tintCol = par? par.col : '#c8d1da';
  const low = run && run<=25; const one = run===1; const red = run===5;
  const frameId = par && par.fin==='super' ? `url(#gold${uid})` : `url(#ch${uid})`;
  const pose = poseFor(d,p);
  const bgA = kind==='launch'?'#0b1636': kind==='nextup'? shade(c1,-0.55) : (red? '#12060a' : '#0a1224'), bgB = kind==='launch'?'#123a6b': kind==='nextup'? shade(c2,-0.35) : shade(c1,-0.45);
  const defs = `<defs>${chromeGrad('ch'+uid, par&&par.fin!=='super'?tintCol:'#aab4be')}${chromeGrad('gold'+uid,'#d9b44a')}${prismPattern('pr'+uid, par&&par.fin==='refr'?0.55:0.3)}${stockNoise(uid)}
    <linearGradient id="bg${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${bgA}"/><stop offset="1" stop-color="${bgB}"/></linearGradient>
    <radialGradient id="vg${uid}" cx=".5" cy=".42" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></radialGradient>
    <linearGradient id="gl${uid}" x1="0" y1="0" x2="1" y2="1"><stop offset=".3" stop-color="#fff" stop-opacity="0"/><stop offset=".45" stop-color="#fff" stop-opacity=".22"/><stop offset=".52" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <clipPath id="cc${uid}"><rect width="250" height="350" rx="12"/></clipPath><clipPath id="ph${uid}"><path d="M14 14 H236 V300 L200 336 H14 Z"/></clipPath></defs>`;
  let o='';
  // 1. the chrome slab of card stock
  o += `<rect width="250" height="350" rx="12" fill="${frameId}"/>`;
  if (par && par.fin==='refr') o += `<rect width="250" height="350" rx="12" fill="url(#pr${uid})" style="mix-blend-mode:overlay"/>`;
  if (one) o += Array.from({length:10},(_,i)=>`<circle cx="125" cy="175" r="${40+i*22}" fill="none" stroke="#fff3c4" stroke-width="3" opacity=".25"/>`).join('');
  // 2. the photo window, with Velocity's signature clipped corner
  o += `<g clip-path="url(#ph${uid})">${velStage(uid,c1,c2,kind)}${poseFig(p,pose,c1,c2,uid,flip)}<rect width="250" height="350" fill="url(#vg${uid})"/>${par&&par.fin==='refr'?`<rect width="250" height="350" fill="url(#pr${uid})" opacity="${low?0.16:0.1}" style="mix-blend-mode:screen"/><rect width="250" height="350" fill="${tintCol}" opacity="${run?0.12:0.05}" style="mix-blend-mode:overlay"/>`:''}${red?'<rect width="250" height="350" fill="#b3122e" opacity=".22" style="mix-blend-mode:multiply"/>':''}</g>`;
  o += `<path d="M14 14 H236 V300 L200 336 H14 Z" fill="none" stroke="${shade(tintCol,0.6)}" stroke-width="1.2" opacity=".9"/><path d="M15 15 H235" stroke="#fff" stroke-width="1" opacity=".5"/>`;
  // 3. speed chevrons down the left edge, the Velocity mark
  o += `<g opacity=".9">${[0,1,2].map(i=>`<path d="M14 ${60+i*16} L${34-i*4} ${70+i*16} L14 ${80+i*16} Z" fill="${frameId}" stroke="#0006" stroke-width=".6"/>`).join('')}</g>`;
  o += `<g transform="translate(232 36)"><text text-anchor="end" ${VF} font-style="italic" font-weight="800" font-size="17" letter-spacing="1" fill="#fff" stroke="#0008" stroke-width=".8" paint-order="stroke">VELOCITY</text><path d="M-86 5 L-40 5 M-80 9 L-46 9" stroke="${shade(tintCol,0.4)}" stroke-width="1.5"/></g>`;
  if (kind==='launch') o += `<text x="42" y="62" ${VF} font-weight="800" font-size="15" letter-spacing="2" fill="#8fd3ff">LAUNCH ANGLE</text>`;
  if (kind==='nextup') o += `<text transform="translate(30 250) rotate(-90)" ${VF} font-weight="800" font-size="30" letter-spacing="3" fill="#fff" opacity=".85">NEXT UP</text>`;
  if (kind==='vortex') o += `<text x="125" y="64" text-anchor="middle" font-family="Georgia,serif" font-size="13" letter-spacing="4" fill="#f4e3a1">VORTEX</text>`;
  // 4. the name bar: a slanted chrome plate
  const nb = `<g transform="translate(0 286)"><path d="M10 0 H176 L160 40 H10 Z" fill="${frameId}" stroke="#0007" stroke-width=".8"/><path d="M12 2 H173" stroke="#fff" stroke-width="1" opacity=".6"/>
    <text x="20" y="25" ${VF} font-style="italic" font-weight="800" font-size="22" fill="#0e1116" textLength="${Math.min(146,name.length*11.5)}" lengthAdjust="spacingAndGlyphs">${esc(name.toUpperCase())}</text>
    <text x="21" y="36" ${VF} font-weight="600" font-size="8.5" letter-spacing="1.5" fill="#1b2027">${esc((T[0]+' '+T[1]).toUpperCase())} · ${p.pos}</text></g>`;
  o += nb;
  // 5. position hex, card number, RC shield
  o += `<g transform="translate(26 26)"><path d="M0 -12 L10 -6 L10 6 L0 12 L-10 6 L-10 -6 Z" fill="${frameId}" stroke="#0008"/><text y="4" text-anchor="middle" ${VF} font-weight="800" font-size="10" fill="#0e1116">${p.pos}</text></g>`;
  o += `<text x="236" y="330" text-anchor="end" ${VF} font-size="8" fill="#fff" opacity=".75">${esc(d.cardNo)}</text>`;
  if (d.rc) o += `<g transform="translate(212 60)"><path d="M0 0 H22 V16 L11 24 L0 16 Z" fill="${frameId}" stroke="#000a"/><text x="11" y="13" text-anchor="middle" ${VF} font-weight="800" font-size="11" fill="#b0141c">RC</text><text x="11" y="31" text-anchor="middle" ${VF} font-size="5.5" letter-spacing="1" fill="#fff">ROOKIE</text></g>`;
  if (d.first) o += `<g transform="translate(40 18)"><rect width="36" height="14" rx="2" fill="#111"/><text x="18" y="10.5" text-anchor="middle" ${VF} font-weight="800" font-size="9" fill="#f2c230">1ST BOWMAN</text></g>`.replace('1ST BOWMAN','1ST CARD');
  // 6. the autograph, signed straight onto the chrome
  if (d.auto) o += `<g transform="translate(40 206)"><rect width="176" height="58" rx="6" fill="#fff" opacity=".9"/><path d="${sigPath(name)}" transform="translate(-4,32) scale(.86)" fill="none" stroke="#1d3fa3" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><text x="88" y="54" text-anchor="middle" ${VF} font-size="6" letter-spacing="1.5" fill="#556">CERTIFIED AUTOGRAPH ISSUE</text><ellipse cx="160" cy="12" rx="9" ry="6" fill="url(#pr${uid})" stroke="#999" stroke-width=".5"/></g>`;
  // 7. serial numbering, stamped in foil; the lower the run, the more it matters
  if (run && serial){ const sTxt = one? '1/1' : String(serial).padStart(String(run).length,'0')+'/'+run;
    if (one) o += `<g transform="translate(206 318)"><circle r="20" fill="url(#gold${uid})" stroke="#6b5010"/><text y="6" text-anchor="middle" ${VF} font-weight="800" font-size="17" fill="#3a2a05">1/1</text></g><text x="125" y="345" text-anchor="middle" ${VF} font-size="6.5" letter-spacing="3" fill="#6b5010">SUPERFRACTOR</text>`;
    else { const big = run<=25; const w=big?58:48; o += `<g transform="translate(${226-w} ${big?300:306})" class="vser"><rect width="${w}" height="${big?22:18}" rx="3" fill="${big?'url(#gold'+uid+')':'url(#ch'+uid+')'}" stroke="#0009" stroke-width=".8"/><text x="${w/2}" y="${big?16:13}" text-anchor="middle" ${VF} font-weight="800" font-size="${big?15:12}" fill="#fff" opacity=".6" transform="translate(.6 .6)">${sTxt}</text><text x="${w/2}" y="${big?16:13}" text-anchor="middle" ${VF} font-weight="800" font-size="${big?15:12}" fill="${big?'#3a2a05':'#10141a'}">${sTxt}</text></g>`; } }
  if (d.variation) o += `<text x="236" y="276" text-anchor="end" ${VF} font-size="6" letter-spacing="1" fill="#fff" opacity=".6">${d.sec==='w'?'SSP':'SP'}</text>`;
  // 8. physical surface: stock texture, gloss sweep, edge bevel
  o += `<rect width="250" height="350" rx="12" fill="url(#nz${uid})" opacity=".08"/><rect width="250" height="350" rx="12" fill="url(#gl${uid})"/>`;
  o += `<rect x=".75" y=".75" width="248.5" height="348.5" rx="11.5" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="1.5"/><rect x="2" y="2" width="246" height="346" rx="10.5" fill="none" stroke="#000" stroke-opacity=".35" stroke-width="1"/>`;
  return `<svg viewBox="0 0 250 350" xmlns="http://www.w3.org/2000/svg" class="cardsvg v2" data-fin="${par?par.fin:'chrome'}" role="img" aria-label="${esc(name+' '+yr+' '+br.name+' '+d.title)}">${defs}<g clip-path="url(#cc${uid})">${o}</g></svg>`;
}
const VCC=new Map();
function isV2Card(key){ const d=D(key); return B(d.prod).tmpl==='vel'; }
(function(){ const cf=cardFront; cardFront=function(key, serial, opts){ if (isV2Card(key)){ const ck=key+'#'+serial; let s=VCC.get(ck); if (!s){ s=velFront(key,serial,opts); VCC.set(ck,s); if (VCC.size>400) VCC.delete(VCC.keys().next().value); } return s; } return cf(key, serial, opts); }; })();
// condition shows up, subtly, when you look closely at a raw card
function cardCondOverlay(c){
  const cond=c.c; const out=[]; const r=mkRng(c.id*97);
  const cor=cond[1], edg=cond[2], sur=cond[3];
  if (cor<92){ const n=cor<75?4:cor<85?2:1; const pts=[[4,4],[246,4],[4,346],[246,346]]; for (let i=0;i<n;i++){ const [x,y]=pts[Math.floor(r()*4)]; out.push(`<circle cx="${x}" cy="${y}" r="${cor<75?7:4.5}" fill="#f4f1e8" opacity="${cor<75?0.8:0.55}"/>`); } }
  if (edg<90){ for (let i=0;i<(edg<75?14:6);i++){ const side=Math.floor(r()*4); const t=r(); const x= side===0?t*250: side===1?249: side===2?t*250:1; const y= side===0?1: side===1?t*350: side===2?349: t*350; out.push(`<rect x="${(x-1).toFixed(1)}" y="${(y-1).toFixed(1)}" width="${(1.5+r()*3).toFixed(1)}" height="1.6" fill="#f4f1e8" opacity=".75"/>`); } }
  if (sur<90){ for (let i=0;i<(sur<75?5:2);i++){ const x=30+r()*190, y=40+r()*270; out.push(`<path d="M${x.toFixed(0)} ${y.toFixed(0)} l${(20+r()*50).toFixed(0)} ${(r()*14-7).toFixed(0)}" stroke="#fff" stroke-width=".7" opacity=".35"/>`); } }
  return out.join('');
}
function withCond(svg, c){ if (!c || c.g!==0) return svg; const ov=cardCondOverlay(c); return ov? svg.slice(0, svg.lastIndexOf('</svg>'))+ov+'</svg>' : svg; }

// ---------- Black Lantern Press comics ----------
const BLP_MARK = (x,y,s,col)=>`<g transform="translate(${x} ${y}) scale(${s})"><rect x="-9" y="-13" width="18" height="26" rx="3" fill="${col}"/><path d="M-6 -9 H6 V8 H-6 Z" fill="#f7d774"/><path d="M-3 -17 H3 M0 -17 V-13" stroke="${col}" stroke-width="2.5"/><path d="M-4 12 H4" stroke="${col}" stroke-width="3"/></g>`;
function isBLP(key){ const d=cmD(key); return d.s.pub>=0 && G.cm.pubs[d.s.pub].sh==='BLP'; }
function blpArt(tpl, r, P, W, H, lead){
  const [ink, acc, paper] = P; let o='';
  if (tpl==='face'){ // huge face in profile with rim light
    o += `<rect width="${W}" height="${H}" fill="${ink}"/><circle cx="${W*0.72}" cy="${H*0.3}" r="70" fill="${acc}" opacity=".85"/>`;
    o += `<path d="M${W*0.95} ${H} L${W*0.95} ${H*0.62} Q${W*0.55} ${H*0.6} ${W*0.52} ${H*0.5} L${W*0.44} ${H*0.47} L${W*0.5} ${H*0.43} Q${W*0.46} ${H*0.38} ${W*0.5} ${H*0.33} Q${W*0.52} ${H*0.2} ${W*0.68} ${H*0.16} Q${W*0.9} ${H*0.13} ${W} ${H*0.25} L${W} ${H} Z" fill="#050505"/>`;
    o += `<path d="M${W*0.5} ${H*0.33} Q${W*0.52} ${H*0.2} ${W*0.68} ${H*0.16}" stroke="${paper}" stroke-width="2.5" fill="none" opacity=".9"/><path d="M${W*0.44} ${H*0.47} L${W*0.5} ${H*0.43}" stroke="${paper}" stroke-width="2" opacity=".8"/><circle cx="${W*0.56}" cy="${H*0.36}" r="3" fill="${acc}"/>`;
  } else if (tpl==='door'){ // figure in a lit doorway
    o += `<rect width="${W}" height="${H}" fill="${shade(ink,0.05)}"/><path d="M${W*0.38} ${H*0.22} H${W*0.66} V${H*0.78} H${W*0.38} Z" fill="${acc}"/><path d="M${W*0.38} ${H*0.78} L${W*0.66} ${H*0.78} L${W} ${H} L0 ${H} Z" fill="${acc}" opacity=".35"/>`;
    o += `<path d="M${W*0.52} ${H*0.4} a9 9 0 1 1 0.1 0 Z" fill="#050505"/><path d="M${W*0.45} ${H*0.78} L${W*0.47} ${H*0.46} Q${W*0.52} ${H*0.42} ${W*0.57} ${H*0.46} L${W*0.59} ${H*0.78} Z" fill="#050505"/><path d="M${W*0.52} ${H*0.78} L${W*0.3} ${H} L${W*0.74} ${H} Z" fill="#050505" opacity=".7"/>`;
  } else if (tpl==='loom'){ // something enormous above a small figure
    o += `<rect width="${W}" height="${H}" fill="${ink}"/><path d="M0 ${H*0.82} Q${W*0.5} ${H*0.76} ${W} ${H*0.84} V${H} H0 Z" fill="${shade(ink,-0.4)}"/>`;
    for (let i=0;i<7;i++){ const x=W*(0.1+i*0.13); o += `<path d="M${x} -10 Q${x+(r()-0.5)*80} ${H*0.3} ${x+(r()-0.5)*60} ${H*(0.45+r()*0.2)}" stroke="#050505" stroke-width="${10-i%3*2}" fill="none" stroke-linecap="round"/>`; }
    o += `<circle cx="${W*0.42}" cy="${H*0.22}" r="6" fill="${acc}"/><circle cx="${W*0.58}" cy="${H*0.22}" r="6" fill="${acc}"/><path d="M${W*0.5} ${H*0.84} l-5 -30 a5 5 0 1 1 10 0 Z" fill="${paper}"/><circle cx="${W*0.5}" cy="${H*0.66}" r="5" fill="${paper}"/><path d="M${W*0.45} ${H*0.76} l-8 6" stroke="#f7d774" stroke-width="3"/><circle cx="${W*0.43}" cy="${H*0.78}" r="4" fill="#f7d774"/>`;
  } else if (tpl==='land'){ // moon over a treeline, a lantern on the road
    o += `<rect width="${W}" height="${H}" fill="${ink}"/><circle cx="${W*0.66}" cy="${H*0.3}" r="44" fill="${paper}" opacity=".95"/><circle cx="${W*0.62}" cy="${H*0.28}" r="44" fill="${ink}" opacity=".15"/>`;
    let tr=''; for (let x=-10;x<W+20;x+=14){ const h=H*(0.5+r()*0.15); tr+=`L${x} ${h} L${x+7} ${h-30-r()*30} L${x+14} ${h} `; } o += `<path d="M-10 ${H} ${tr} L${W+20} ${H} Z" fill="#050505"/>`;
    o += `<path d="M${W*0.46} ${H} L${W*0.5} ${H*0.7} L${W*0.54} ${H*0.7} L${W*0.62} ${H} Z" fill="${shade(ink,0.2)}"/><circle cx="${W*0.52}" cy="${H*0.74}" r="3" fill="#f7d774"/><circle cx="${W*0.52}" cy="${H*0.74}" r="12" fill="#f7d774" opacity=".2"/>`;
  } else if (tpl==='eye'){ // one enormous eye
    o += `<rect width="${W}" height="${H}" fill="${ink}"/><path d="M${W*0.05} ${H*0.46} Q${W*0.5} ${H*0.2} ${W*0.95} ${H*0.46} Q${W*0.5} ${H*0.72} ${W*0.05} ${H*0.46} Z" fill="${paper}"/><circle cx="${W*(0.42+r()*0.16)}" cy="${H*0.46}" r="${W*0.16}" fill="${acc}"/><circle cx="${W*0.5}" cy="${H*0.46}" r="${W*0.07}" fill="#050505"/><circle cx="${W*0.46}" cy="${H*0.42}" r="4" fill="#fff" opacity=".8"/>`;
    for (let i=0;i<9;i++){ const x=W*(0.1+i*0.1); o += `<path d="M${x} ${H*0.33+Math.abs(4-i)*3} l${(i-4)*3} -${14+r()*10}" stroke="${paper}" stroke-width="2"/>`; }
    o += `<path d="M${W*0.5} ${H*0.6} q${(r()-0.5)*20} 60 ${(r()-0.5)*30} 120" stroke="${acc}" stroke-width="5" fill="none" opacity=".8"/>`;
  } else if (tpl==='city'){ // noir street in the rain
    o += `<rect width="${W}" height="${H}" fill="${ink}"/>`; let x=-5; while (x<W){ const w=18+r()*30, h=H*(0.3+r()*0.35); o+=`<rect x="${x}" y="${H-h-40}" width="${w}" height="${h}" fill="${shade(ink,0.12+r()*0.1)}"/>`; for (let wy=H-h-30; wy<H-50; wy+=12) for (let wx=x+4; wx<x+w-4; wx+=8) if (r()<0.25) o+=`<rect x="${wx}" y="${wy}" width="3" height="5" fill="${acc}" opacity=".8"/>`; x+=w+2; }
    o += `<rect y="${H-40}" width="${W}" height="40" fill="#050505"/><path d="M${W*0.3} ${H-40} L${W*0.1} ${H} M${W*0.7} ${H-40} L${W*0.9} ${H}" stroke="${acc}" opacity=".25"/>`;
    const fx=W*(0.35+r()*0.3); o += `<path d="M${fx-10} ${H-40} L${fx-8} ${H-86} Q${fx} ${H-94} ${fx+8} ${H-86} L${fx+10} ${H-40} Z" fill="#050505"/><path d="M${fx-16} ${H-100} H${fx+16} L${fx+10} ${H-106} H${fx-10} Z" fill="#050505"/><circle cx="${fx}" cy="${H-98}" r="7" fill="#050505"/>`;
    for (let i=0;i<60;i++){ const rx=r()*W, ry=r()*H; o+=`<path d="M${rx.toFixed(0)} ${ry.toFixed(0)} l-3 10" stroke="${paper}" opacity=".3"/>`; }
  } else if (tpl==='hands'){ // hands reaching up out of the dark
    o += `<rect width="${W}" height="${H}" fill="${ink}"/><rect y="${H*0.1}" width="${W}" height="${H*0.3}" fill="${acc}" opacity=".35"/>`;
    for (let i=0;i<5;i++){ const x=W*(0.12+i*0.19)+(r()-0.5)*14, top=H*(0.35+r()*0.2); o+=`<path d="M${x-8} ${H} L${x-7} ${top+30} L${x-12} ${top} M${x-7} ${top+30} L${x-3} ${top-6} M${x-3} ${top+30} L${x+2} ${top-8} M${x+1} ${top+30} L${x+7} ${top-2} M${x+5} ${top+34} L${x+14} ${top+18} M${x+8} ${top+30} L${x+8} ${H}" stroke="${paper}" stroke-width="5" stroke-linecap="round" fill="none" opacity=".9"/>`; }
  } else if (tpl==='portrait'){ // a character bust, lit from the side
    const cx=W*(0.4+r()*0.2); o += `<rect width="${W}" height="${H}" fill="${acc}"/><circle cx="${cx}" cy="${H*0.4}" r="${W*0.34}" fill="${shade(acc,0.25)}"/>`;
    o += `<path d="M${cx-58} ${H} Q${cx-60} ${H*0.66} ${cx} ${H*0.62} Q${cx+60} ${H*0.66} ${cx+58} ${H} Z" fill="${ink}"/><rect x="${cx-12}" y="${H*0.5}" width="24" height="${H*0.13}" fill="${paper}"/><ellipse cx="${cx}" cy="${H*0.42}" rx="32" ry="40" fill="${paper}"/><path d="M${cx} ${H*0.3} Q${cx+36} ${H*0.32} ${cx+32} ${H*0.52} Q${cx+10} ${H*0.56} ${cx} ${H*0.54} Z" fill="${ink}" opacity=".45"/>`;
    o += `<path d="M${cx-34} ${H*0.36} Q${cx} ${H*0.2} ${cx+34} ${H*0.36} Q${cx+20} ${H*0.3} ${cx} ${H*0.31} Q${cx-20} ${H*0.3} ${cx-34} ${H*0.36} Z" fill="#050505"/><circle cx="${cx-11}" cy="${H*0.43}" r="3" fill="#050505"/><circle cx="${cx+11}" cy="${H*0.43}" r="3" fill="#050505"/><path d="M${cx-8} ${H*0.5} q8 4 16 0" stroke="#050505" stroke-width="2" fill="none"/>`;
  } else { // typographic: title as the image
    const sym=Math.floor(r()*5), cx=W*0.5, cy=H*0.52;
    o += `<rect width="${W}" height="${H}" fill="${paper}"/><rect x="${W*0.14}" y="${H*0.3}" width="${W*0.72}" height="${H*0.44}" fill="${ink}"/>`;
    o += sym===0? `<circle cx="${cx}" cy="${cy}" r="${W*0.17}" fill="${acc}"/><path d="M${cx} ${H*0.4} V${H*0.64} M${W*0.38} ${cy} H${W*0.62}" stroke="${ink}" stroke-width="4"/>`
      : sym===1? `<circle cx="${cx}" cy="${cy}" r="${W*0.17}" fill="${acc}"/><circle cx="${cx+14}" cy="${cy-8}" r="${W*0.15}" fill="${ink}"/>`
      : sym===2? `<circle cx="${cx}" cy="${cy-24}" r="18" fill="none" stroke="${acc}" stroke-width="8"/><path d="M${cx} ${cy-6} V${cy+44} M${cx} ${cy+30} h14 M${cx} ${cy+40} h10" stroke="${acc}" stroke-width="8"/>`
      : sym===3? `<path d="M${cx} ${cy-40} C${cx+40} ${cy+10} ${cx+20} ${cy+40} ${cx} ${cy+40} C${cx-20} ${cy+40} ${cx-40} ${cy+10} ${cx} ${cy-40} Z" fill="${acc}"/>`
      : `<path d="M${cx-40} ${cy+10} Q${cx-10} ${cy-30} ${cx+40} ${cy-6} Q${cx} ${cy-4} ${cx-4} ${cy+30} Q${cx-10} ${cy+8} ${cx-40} ${cy+10} Z" fill="${acc}"/>`;
  }
  return o;
}
function blpCover(key){
  const d=cmD(key), s=d.s; const W=200, H=300; const uid=hsh('b'+key).toString(36);
  const yr=yearOf(issueDay(s, d.n||1)); const age=yearOf(G.day)-yr;
  const k=CG[s.g].k; const P = (k==='horror'? ['#120a0c','#b3122e','#efe4c8'] : k==='crime'||k==='thriller'||k==='mystery'? ['#0f1115','#e8b923','#f2ecdc'] : k==='fantasy'? ['#0d2226','#caa24a','#efe8d2'] : ['#1a1714','#c0492f','#efe6d4']).slice();
  const rs=hsh(s.id+'|'+(d.n||0)+'|'+(d.v||'')); const r=mkRng(rs);
  const TPL = {horror:['face','door','loom','land','eye','hands'], crime:['city','door','face','portrait'], thriller:['city','face','door','eye'], mystery:['city','door','eye','portrait'], fantasy:['land','loom','portrait','face']}[k] || ['portrait','land','door','face','type'];
  const tpls = yr>=2010 ? TPL.concat(['type']) : TPL; const tpl = tpls[((d.v && d.v!=='B') ? (rs>>3) : rs) % tpls.length];
  const ps = hsh('pal'+s.id)%3; if (ps===1) P[1]=shade(P[1],-0.3); if (ps===2) P[1]=shade(P[1],0.25);
  const lead=s.ch.length?CH_(s.ch[0]):null; const title=s.t.toUpperCase();
  const virgin=/^V/.test(d.v||''); const sketch=/^S/.test(d.v||'');
  let art = blpArt(tpl, r, sketch? ['#ffffff','#dddddd','#ffffff'] : P, W, H, lead);
  if (sketch) art = `<g filter="url(#sk${uid})">${art}</g>`;
  const W_=CR_(s.w), A_=CR_(s.a); const credits = (W_===A_? W_.n : W_.n.split(' ').pop()+' / '+A_.n.split(' ').pop()).toUpperCase();
  const ks = d.tr? [] : issueKeys(s, d.n); const fa = ks.find(x=>x[1]==='fa'||x[1]==='team');
  let dress='';
  if (!virgin){
    if (yr<1990){ // 80s indie: black band, lantern box, serif masthead, a blurb
      dress += `<rect width="${W}" height="58" fill="#0a0a0a"/>${BLP_MARK(20,29,1,'#e8e2cf')}<text x="36" y="18" ${VF} font-size="8" letter-spacing="1" fill="#e8e2cf">BLACK LANTERN</text><text x="36" y="27" ${VF} font-size="8" fill="#e8e2cf">No. ${d.n} · $${d.cp.toFixed(2)}</text>`;
      dress += `<text x="${W-8}" y="50" text-anchor="end" font-family="Georgia,serif" font-weight="700" font-size="${Math.min(26, 330/Math.max(8,title.length))}" fill="${P[1]}" textLength="${Math.min(150, title.length*12)}" lengthAdjust="spacingAndGlyphs">${esc(title)}</text>`;
      if (fa) dress += `<g transform="translate(14 ${H-58}) rotate(-4)"><rect width="104" height="30" fill="${P[2]}" stroke="#0a0a0a" stroke-width="2"/><text x="52" y="13" text-anchor="middle" ${VF} font-weight="800" font-size="9" fill="#0a0a0a">INTRODUCING</text><text x="52" y="25" text-anchor="middle" ${VF} font-weight="800" font-size="10" fill="${P[1]}" textLength="${Math.min(96,CH_(fa[2]).n.length*5.5)}" lengthAdjust="spacingAndGlyphs">${esc(CH_(fa[2]).n.toUpperCase())}!</text></g>`;
    } else if (yr<2000){ // 90s: big shiny logo, collector's banner
      dress += `<defs><linearGradient id="t9${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".5" stop-color="${P[1]}"/><stop offset="1" stop-color="${shade(P[1],-0.5)}"/></linearGradient></defs>
        <text x="${W/2}" y="46" text-anchor="middle" ${VF} font-weight="800" font-size="36" fill="url(#t9${uid})" stroke="#000" stroke-width="1.5" paint-order="stroke" textLength="${Math.min(186,title.length*17)}" lengthAdjust="spacingAndGlyphs">${esc(title)}</text>${BLP_MARK(20,H-24,0.9,'#e8e2cf')}<text x="34" y="${H-14}" ${VF} font-weight="800" font-size="13" fill="#fff" stroke="#000" stroke-width="1.5" paint-order="stroke">#${d.n}</text>`;
      if (d.n===1) dress += `<rect x="0" y="${H-54}" width="${W}" height="15" fill="#f2c230" transform="rotate(-5 ${W/2} ${H-46})"/><text x="${W/2}" y="${H-43}" text-anchor="middle" ${VF} font-weight="800" font-size="10" fill="#111" transform="rotate(-5 ${W/2} ${H-46})">PREMIERE ISSUE</text>`;
    } else { // modern: quiet trade dress, credits, lots of air
      dress += `<text x="12" y="28" ${VF} font-weight="800" font-size="${Math.min(24, 300/Math.max(8,title.length))}" letter-spacing="2" ${title.length>14?'textLength="176" lengthAdjust="spacingAndGlyphs"':''} fill="${tpl==='type'?P[0]:P[2]}">${esc(title)}</text><text x="12" y="${H-12}" ${VF} font-size="8" letter-spacing="2" fill="${tpl==='type'?P[0]:P[2]}" opacity=".85">${esc(credits)}</text>${BLP_MARK(W-16,H-20,0.7,tpl==='type'?P[0]:P[2])}<text x="${W-28}" y="${H-12}" text-anchor="end" ${VF} font-weight="700" font-size="11" fill="${tpl==='type'?P[0]:P[2]}">${d.n}</text>`;
      if (!d.v) dress += `<g transform="translate(${W-44} 40)"><rect width="32" height="20" fill="#fff"/>${Array.from({length:12},(_,i)=>`<rect x="${2+i*2.4}" y="3" width="${i%3?1:1.6}" height="13" fill="#111"/>`).join('')}</g>`;
    }
    if (d.p>1 && d.p<9) dress += `<text x="${W-8}" y="${H*0.6}" text-anchor="end" ${VF} font-weight="800" font-size="10" fill="#fff" stroke="#b3122e" stroke-width="3" paint-order="stroke">${['','','SECOND','THIRD','FOURTH'][d.p]||''} PRINTING</text>`;
    if (/^R/.test(d.v||'')) dress += `<text x="${W-8}" y="${H*0.66}" text-anchor="end" ${VF} font-size="7" letter-spacing="2" fill="#fff" opacity=".8">VARIANT EDITION</text>`;
  }
  // age: paper tone, halftone, misregistration
  const tone = Math.min(0.28, Math.max(0, age-15)*0.008);
  const half = yr<2000 ? `<pattern id="ht${uid}" width="4" height="4" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r=".8" fill="#000"/></pattern><rect width="${W}" height="${H}" fill="url(#ht${uid})" opacity=".07"/>` : '';
  const mis = yr<1995 ? `<g opacity=".18" transform="translate(1.2 .6)" style="mix-blend-mode:multiply"><rect width="${W}" height="3" fill="#00a0c6"/></g>` : '';
  const foil = d.v==='F' ? `<rect width="${W}" height="${H}" fill="url(#fo${uid})"/>` : '';
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" class="cmsvg v2" data-era="${yr}"><defs><clipPath id="cc${uid}"><rect width="${W}" height="${H}"/></clipPath><filter id="sk${uid}"><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncR type="discrete" tableValues="0 1"/><feFuncG type="discrete" tableValues="0 1"/><feFuncB type="discrete" tableValues="0 1"/></feComponentTransfer></filter><linearGradient id="fo${uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".45" stop-color="#fff" stop-opacity=".45"/><stop offset=".55" stop-color="#b3e5fc" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
    <g clip-path="url(#cc${uid})">${art}${half}${dress}${mis}${foil}${tone?`<rect width="${W}" height="${H}" fill="#c9a45c" opacity="${tone.toFixed(3)}" style="mix-blend-mode:multiply"/>`:''}<rect width="${W}" height="${H}" fill="none" stroke="rgba(0,0,0,.35)"/></g></svg>`;
}
(function(){ const cc=comicCover; comicCover=function(key){ if (G.cm && isBLP(key)){ let h=CVC.get('v2'+key); if (!h){ h=blpCover(key); CVC.set('v2'+key,h); } return h; } return cc(key); }; })();
function comicCondOverlay(cp){
  const c=cp.c, out=[], r=mkRng(cp.id*131);
  if (c[0]<94) for (let i=0;i<(c[0]<80?9:c[0]<88?5:2);i++){ const y=10+r()*280; out.push(`<path d="M0 ${y.toFixed(0)} l${(3+r()*6).toFixed(1)} ${(r()*2-1).toFixed(1)}" stroke="#fff" stroke-width="1.2" opacity=".8"/>`); }
  if (c[1]<90) for (const [x,y] of [[200,300],[200,0],[0,300]].slice(0, c[1]<75?3:1)) out.push(`<circle cx="${x}" cy="${y}" r="${c[1]<75?7:4}" fill="#efe6d0" opacity=".85"/>`);
  if (c[3]<70) out.push(`<path d="M${120+r()*60} 300 L200 ${230+r()*50}" stroke="#fff" stroke-width="1.4" opacity=".7"/>`);
  if (c[2]<80) out.push(`<rect width="200" height="300" fill="#fff" opacity="${((80-c[2])/220).toFixed(2)}"/>`);
  if (c[6]<70) out.push(`<rect width="200" height="300" fill="#b58b3c" opacity=".08" style="mix-blend-mode:multiply"/>`);
  return out.join('');
}
function withCmCond(svg, cp){ if (!cp || cp.g!==0) return svg; const ov=comicCondOverlay(cp); return ov? svg.slice(0, svg.lastIndexOf('</svg>'))+ov+'</svg>' : svg; }

// ===================== VISUALS: every card brand gets its own design system =====================
function dayStage(uid, c1, c2){ const r=mkRng(hsh('ds'+uid)); let o=`<rect width="250" height="350" fill="url(#sky${uid})"/>`;
  for (let i=0;i<4;i++){ const x=r()*250, y=20+r()*60; o+=`<ellipse cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" rx="${(24+r()*30).toFixed(0)}" ry="${(7+r()*6).toFixed(0)}" fill="#fff" opacity=".55"/>`; }
  o+=`<rect y="118" width="250" height="84" fill="${shade(c2,-0.35)}"/><rect y="118" width="250" height="6" fill="${c1}"/>`;
  for (let i=0;i<110;i++) o+=`<rect x="${(r()*250).toFixed(0)}" y="${(126+r()*72).toFixed(0)}" width="2" height="2" fill="${['#fff',c1,c2,'#f2c230','#d9d9d9'][i%5]}" opacity=".55"/>`;
  o+=`<rect y="200" width="250" height="150" fill="#3d8a45"/>${[0,1,2,3,4].map(i=>`<rect y="${200+i*30}" width="250" height="15" fill="#357c3d"/>`).join('')}<path d="M-20 350 Q125 250 270 350 Z" fill="#c29462"/><path d="M0 206 H250" stroke="#e9e2cf" stroke-width="2" opacity=".6"/>`;
  return o; }
function studioStage(uid, c1){ return `<rect width="250" height="350" fill="url(#stu${uid})"/><ellipse cx="125" cy="150" rx="120" ry="130" fill="#fff" opacity=".08"/><rect y="300" width="250" height="50" fill="#000" opacity=".15"/>`; }
function paintStage(uid, c1, c2){ const r=mkRng(hsh('ps'+uid)); let o=`<rect width="250" height="350" fill="url(#pnt${uid})"/>`; for (let i=0;i<14;i++){ const y=20+r()*180; o+=`<path d="M${(r()*60-20).toFixed(0)} ${y.toFixed(0)} q${(60+r()*80).toFixed(0)} ${(r()*14-7).toFixed(0)} ${(140+r()*120).toFixed(0)} ${(r()*10-5).toFixed(0)}" stroke="#fff" stroke-width="${(4+r()*8).toFixed(0)}" opacity=".08" fill="none" stroke-linecap="round"/>`; } o+=`<path d="M0 240 Q125 214 250 240 V350 H0 Z" fill="${shade('#4f8f4a',-0.1)}"/><path d="M0 240 Q125 214 250 240" stroke="#e6dcc0" stroke-width="3" fill="none" opacity=".5"/>`; return o; }
function cardDefs(uid, c1, c2, par, extra){
  const pc=par? par.col : '#c8d1da';
  return `<defs>${chromeGrad('ch'+uid, par&&par.fin!=='super'&&par.fin!=='stock'?pc:'#aab4be')}${chromeGrad('gold'+uid,'#d9b44a')}${chromeGrad('sil'+uid,'#b9c1c9')}${prismPattern('pr'+uid, par&&par.fin==='refr'?0.55:0.3)}${stockNoise(uid)}
    <linearGradient id="sky${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5e9ad6"/><stop offset="1" stop-color="#bcd8ef"/></linearGradient>
    <radialGradient id="stu${uid}" cx=".5" cy=".4" r=".8"><stop offset="0" stop-color="${shade(c1,0.35)}"/><stop offset="1" stop-color="${shade(c1,-0.55)}"/></radialGradient>
    <linearGradient id="pnt${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e8b872"/><stop offset=".6" stop-color="#f3dcb0"/><stop offset="1" stop-color="#cfe0c4"/></linearGradient>
    <radialGradient id="vg${uid}" cx=".5" cy=".42" r=".75"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></radialGradient>
    <linearGradient id="gl${uid}" x1="0" y1="0" x2="1" y2="1"><stop offset=".3" stop-color="#fff" stop-opacity="0"/><stop offset=".45" stop-color="#fff" stop-opacity=".18"/><stop offset=".52" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <linearGradient id="plt${uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8a9097"/><stop offset=".5" stop-color="#dfe3e7"/><stop offset="1" stop-color="#7b8189"/></linearGradient>
    <clipPath id="cc${uid}"><rect width="250" height="350" rx="12"/></clipPath>${extra||''}</defs>`;
}
function surface(uid, finish){ // physical card stock on top of everything
  let o=`<rect width="250" height="350" rx="12" fill="url(#nz${uid})" opacity="${finish==='matte'?0.14:0.07}"/>`;
  if (finish!=='matte') o+=`<rect width="250" height="350" rx="12" fill="url(#gl${uid})" opacity="${finish==='chrome'?1:0.6}"/>`;
  o+=`<rect x=".75" y=".75" width="248.5" height="348.5" rx="11.5" fill="none" stroke="#fff" stroke-opacity="${finish==='matte'?0.2:0.4}" stroke-width="1.5"/><rect x="2" y="2" width="246" height="346" rx="10.5" fill="none" stroke="#000" stroke-opacity=".25"/>`;
  return o;
}
function borderFill(par, uid, base){ if (!par) return base; if (par.fin==='foil') return `url(#sil${uid})`; if (par.fin==='super') return `url(#gold${uid})`; if (par.fin==='plate') return `url(#plt${uid})`; if (par.fin==='refr') return `url(#ch${uid})`; if (par.fin==='stock') return par.col; return par.col; }
function serialPlate(serial, run, x, y, style, uid){
  if (!run || !serial) return ''; const one=run===1; const txt= one? '1/1' : String(serial).padStart(String(run).length,'0')+'/'+run; const big=run<=25;
  if (style==='ink') return `<text x="${x}" y="${y}" text-anchor="end" font-family="Georgia,serif" font-weight="700" font-size="${big?15:12}" fill="#b0141c" opacity=".85" transform="rotate(-4 ${x} ${y})">${txt}</text>`;
  if (style==='gold') return `<g transform="translate(${x} ${y})"><text text-anchor="end" font-family="Georgia,serif" font-size="${big?14:11}" letter-spacing="1.5" fill="#f3dc8c" stroke="#6b5010" stroke-width=".4">${txt}</text></g>`;
  const w=big?58:48; return `<g transform="translate(${x-w} ${y-(big?16:13)})" class="vser"><rect width="${w}" height="${big?22:18}" rx="${style==='dia'?0:3}" fill="${big?'url(#gold'+uid+')':'url(#sil'+uid+')'}" stroke="#0009" stroke-width=".8" ${style==='dia'?`transform="skewX(-12)"`:''}/><text x="${w/2}" y="${big?16:13}" text-anchor="middle" ${VF} font-weight="800" font-size="${big?15:12}" fill="#fff" opacity=".6" transform="translate(.6 .6)">${txt}</text><text x="${w/2}" y="${big?16:13}" text-anchor="middle" ${VF} font-weight="800" font-size="${big?15:12}" fill="${big?'#3a2a05':'#10141a'}">${txt}</text></g>`;
}
function autoPanel(name, x, y, w, style, uid){ const bg= style==='lux'? '#f7f3e8' : '#fbfbf8'; return `<g transform="translate(${x} ${y})"><rect width="${w}" height="54" rx="${style==='lux'?2:6}" fill="${bg}" opacity=".94" stroke="${style==='lux'?'#c9a227':'#0003'}"/><path d="${sigPath(name)}" transform="translate(${(w-200)/2+6},30) scale(.86)" fill="none" stroke="${style==='her'?'#b0141c':'#1d3fa3'}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><text x="${w/2}" y="50" text-anchor="middle" ${VF} font-size="5.5" letter-spacing="1.5" fill="#667">${style==='her'?'REAL INK':'CERTIFIED AUTOGRAPH'}</text></g>`; }
function relicWindow(p, x, y, w, h, luxe, uid){ const pat=hsh(p.id)%2; return `<g transform="translate(${x} ${y})"><rect width="${w}" height="${h}" rx="${luxe?2:4}" fill="${luxe?'#0b0b0b':'#111'}" stroke="${luxe?'url(#gold'+uid+')':'#555'}" stroke-width="${luxe?2:1}"/><rect x="4" y="4" width="${w-8}" height="${h-8}" rx="2" fill="url(#${pat?'mesh':'pin'}${uid})"/>${luxe?`<path d="M4 ${h/2} q${(w-8)/4} -6 ${(w-8)/2} 0 t${(w-8)/2} 0" stroke="#f3dc8c" stroke-width="1.2" fill="none" stroke-dasharray="3 2"/>`:''}</g>`; }
function relicPatterns(uid, c1){ return `<pattern id="mesh${uid}" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="${c1}"/><circle cx="3" cy="3" r="1.3" fill="${shade(c1,-0.35)}"/></pattern><pattern id="pin${uid}" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="#f1efe8"/><rect width="1.4" height="8" fill="${c1}"/></pattern>`; }
function rcShield(x, y, fill, style){ if (style==='her') return `<g transform="translate(${x} ${y})"><circle r="13" fill="#f3e6c4" stroke="#b0141c" stroke-width="2"/><text y="4.5" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="11" fill="#b0141c">RC</text></g>`; if (style==='lux') return `<text x="${x}" y="${y}" text-anchor="end" font-family="Georgia,serif" font-size="9" letter-spacing="2" fill="#f3dc8c">ROOKIE</text>`; return `<g transform="translate(${x} ${y})"><path d="M0 0 H24 V17 L12 26 L0 17 Z" fill="${fill}" stroke="#000a"/><text x="12" y="13.5" text-anchor="middle" ${VF} font-weight="800" font-size="12" fill="#b0141c">RC</text></g>`; }
function insertTheme(focus){ return {legends:['#3b2a1a','#d7b56d','sepia'], rookies:['#0b2a4a','#ffd23f','burst'], power:['#1a0a2e','#ff5a36','bolt'], stars:['#0a0f1f','#f5f5f5','spot'], prospects:['#0c2a24','#7fe0b0','rise']}[focus] || ['#101418','#e0e0e0','spot']; }
// the one renderer for every brand except Velocity (which has its own)
function cardV2(key, serial){
  const d=D(key), p=P(d.pid), br=B(d.prod), yr=d.prod.yr; const tm=cardTeam(d,p); const T=TEAMS_DEF[tm]||TEAMS_DEF[0]; const c1=T[3], c2=T[4];
  const uid=(hsh(key+'#'+serial+'v3')%1e7).toString(36); const par=d.parObj; const run=d.run||0; const name=pname(p);
  const flip=hsh(p.id+'f'+d.sec+d.prod.id)%3===0; const pose=poseFor(d,p); const t=br.tmpl;
  const extra=relicPatterns(uid,c1); const defs=cardDefs(uid,c1,c2,par,extra);
  const fig=poseFig(p,pose,c1,c2,uid,flip);
  let o='', fin='gloss';
  if (d.ins || d.caseHit){ // inserts and case hits: themed by what the insert celebrates
    const th = d.caseHit? ['#07080c','#f4e3a1','jewel'] : insertTheme(br.ins[+d.sec.slice(1)] && br.ins[+d.sec.slice(1)].focus);
    const setN = d.caseHit? br.caseHit.n : br.ins[+d.sec.slice(1)].n; fin = d.caseHit?'chrome':'gloss';
    o += `<rect width="250" height="350" rx="12" fill="${th[0]}"/>`;
    if (th[2]==='burst') o += Array.from({length:18},(_,i)=>`<path d="M125 150 L${(125+Math.cos(i/18*6.283)*400).toFixed(0)} ${(150+Math.sin(i/18*6.283)*400).toFixed(0)} L${(125+Math.cos((i+0.5)/18*6.283)*400).toFixed(0)} ${(150+Math.sin((i+0.5)/18*6.283)*400).toFixed(0)} Z" fill="${th[1]}" opacity=".12"/>`).join('');
    if (th[2]==='bolt') o += `<path d="M150 0 L110 140 L150 140 L90 350" stroke="${th[1]}" stroke-width="10" fill="none" opacity=".5"/><path d="M60 0 L40 90 L70 90 L30 220" stroke="${th[1]}" stroke-width="4" fill="none" opacity=".35"/>`;
    if (th[2]==='spot') o += `<path d="M125 0 L20 350 L230 350 Z" fill="${th[1]}" opacity=".12"/><ellipse cx="125" cy="318" rx="90" ry="14" fill="${th[1]}" opacity=".18"/>`;
    if (th[2]==='rise') o += Array.from({length:6},(_,i)=>`<path d="M${20+i*40} 340 l20 -${60+i*40} l20 ${60+i*40}" fill="${th[1]}" opacity="${0.08+i*0.03}"/>`).join('');
    if (th[2]==='sepia') o += `<rect width="250" height="350" fill="#c9a36b" opacity=".35"/><circle cx="125" cy="150" r="110" fill="none" stroke="${th[1]}" stroke-width="2" opacity=".6"/><path d="M40 250 q-20 -80 20 -150 M210 250 q20 -80 -20 -150" stroke="${th[1]}" stroke-width="3" fill="none" stroke-dasharray="2 5" opacity=".7"/>`;
    if (th[2]==='jewel') o += Array.from({length:16},(_,i)=>{ const r=mkRng(i*37+hsh(key)); const x=r()*250, y=r()*300; return `<path d="M${x.toFixed(0)} ${y.toFixed(0)} l18 -22 l18 22 l-18 30 Z" fill="${['#3c7dd9','#9b59d0','#20b2aa','#e84393','#f4d35e'][i%5]}" opacity=".35"/>`; }).join('');
    o += `<g ${th[2]==='sepia'?'opacity=".92"':''}>${fig}</g>`;
    o += `<rect x="8" y="8" width="234" height="334" rx="8" fill="none" stroke="${d.caseHit?'url(#gold'+uid+')':th[1]}" stroke-width="${d.caseHit?4:2}"/>`;
    o += `<text x="125" y="36" text-anchor="middle" ${th[2]==='sepia'||d.caseHit?'font-family="Georgia,serif" letter-spacing="3"':VF+' font-style="italic" letter-spacing="1"'} font-weight="800" font-size="${Math.min(20, 300/setN.length)}" fill="${th[1]}">${esc(setN.toUpperCase())}</text>`;
    o += `<path d="M20 296 H230 L222 330 H28 Z" fill="#000" opacity=".55"/><text x="125" y="318" text-anchor="middle" ${VF} font-weight="800" font-size="20" fill="#fff" textLength="${Math.min(190,name.length*11)}" lengthAdjust="spacingAndGlyphs">${esc(name.toUpperCase())}</text><text x="125" y="342" text-anchor="middle" ${VF} font-size="7" letter-spacing="2" fill="${th[1]}">${esc(br.short.toUpperCase())} · ${esc(d.cardNo)}</text>`;
    if (d.rc) o += rcShield(206, 46, '#fff');
    o += serialPlate(serial, run, 232, 292, '', uid);
  }
  else if (t==='dia'){ // Diamond: white border, octagon-cut photo, angled team band, diamond marks
    const border=borderFill(par,uid,'#fbfbf7'); fin = par&&par.fin==='foil'?'chrome':'gloss';
    o += `<rect width="250" height="350" rx="12" fill="${border}"/>${par&&par.fin==='color'?`<rect width="250" height="350" rx="12" fill="#fff" opacity=".12"/>`:''}`;
    o += `<clipPath id="ph${uid}"><path d="M28 12 H222 L238 28 V322 L222 338 H28 L12 322 V28 Z"/></clipPath><g clip-path="url(#ph${uid})">${dayStage(uid,c1,c2)}${fig}<rect width="250" height="350" fill="url(#vg${uid})"/></g>`;
    o += `<path d="M28 12 H222 L238 28 V322 L222 338 H28 L12 322 V28 Z" fill="none" stroke="${par?shade(par.col,-0.2):c1}" stroke-width="2.5"/>`;
    o += `<path d="M12 262 L238 246 V322 L222 338 H28 L12 322 Z" fill="${c1}"/><path d="M12 262 L238 246 L238 252 L12 268 Z" fill="${par?border:c2}"/>`;
    o += `<text x="24" y="300" ${VF} font-weight="800" font-size="26" fill="${lum(c1)>0.6?'#111':'#fff'}" textLength="${Math.min(196,name.length*14)}" lengthAdjust="spacingAndGlyphs">${esc(name.toUpperCase())}</text><text x="25" y="320" ${VF} font-weight="600" font-size="11" letter-spacing="1.5" fill="${lum(c1)>0.6?'#222':'#fff'}" opacity=".9">${esc((T[0]+' '+T[1]).toUpperCase())}</text>`;
    o += `<g transform="translate(30 32)"><path d="M0 -14 L14 0 L0 14 L-14 0 Z" fill="${par?border:'#fff'}" stroke="#15181c" stroke-width="1.5"/><text y="5" text-anchor="middle" ${VF} font-weight="800" font-size="13" fill="#15181c">D</text></g>`;
    o += `<g transform="translate(220 300)"><path d="M0 -14 L14 0 L0 14 L-14 0 Z" fill="#fff" stroke="#15181c"/><text y="4.5" text-anchor="middle" ${VF} font-weight="800" font-size="11" fill="#15181c">${p.pos}</text></g>`;
    if (br.update) o += `<text x="226" y="36" text-anchor="end" ${VF} font-weight="800" font-size="11" letter-spacing="2" fill="#fff" stroke="#0008" stroke-width=".8" paint-order="stroke">UPDATE</text>`;
    if (d.rc) o += rcShield(206, br.update?44:24, '#fff');
    if (d.relic) o += relicWindow(p, 150, 180, 78, 56, false, uid);
    if (d.auto) o += autoPanel(name, 30, 184, 190, '', uid);
    o += serialPlate(serial, run, 232, 240, 'dia', uid);
  }
  else if (t==='nat'){ // National: loud budget borders, rounded photo, a ribbon and the vertical wordmark
    const border=borderFill(par,uid,c2); fin='gloss';
    o += `<rect width="250" height="350" rx="12" fill="${border}"/><rect x="14" y="14" width="222" height="322" rx="14" fill="#fff"/>`;
    o += `<clipPath id="ph${uid}"><rect x="18" y="18" width="214" height="314" rx="12"/></clipPath><g clip-path="url(#ph${uid})">${dayStage(uid,c1,c2)}${fig}</g>`;
    o += `<rect x="198" y="18" width="34" height="150" fill="${c1}" opacity=".92"/><text transform="translate(222 158) rotate(-90)" ${VF} font-weight="800" font-size="18" letter-spacing="3" fill="${lum(c1)>0.6?'#111':'#fff'}">NATIONAL</text>`;
    o += `<path d="M10 270 H180 L166 312 H10 Z" fill="${c1}"/><path d="M10 270 H180" stroke="#fff" stroke-width="2"/><text x="20" y="294" ${VF} font-weight="800" font-size="21" fill="#fff" textLength="${Math.min(150,name.length*11)}" lengthAdjust="spacingAndGlyphs">${esc(name)}</text><text x="20" y="306" ${VF} font-weight="600" font-size="9" fill="#fff" opacity=".85">${esc(T[1])} · ${p.pos}</text>`;
    if (par && par.fin==='plate') o += `<rect width="250" height="350" rx="12" fill="${par.col}" opacity=".35" style="mix-blend-mode:multiply"/><text x="125" y="340" text-anchor="middle" ${VF} font-size="8" letter-spacing="3" fill="#222">PRINTING PLATE · CYAN</text>`;
    if (d.rc) o += rcShield(26, 28, '#fff');
    if (d.relic) o += relicWindow(p, 146, 196, 78, 56, false, uid);
    if (d.auto) o += autoPanel(name, 30, 196, 190, '', uid);
    o += serialPlate(serial, run, 236, 332, '', uid);
  }
  else if (t==='her'){ // Heritage: cream stock, painted look, pennant name, serif script
    const stock = par&&par.fin==='stock' ? (par.run? '#b98c4a' : '#d9c9a3') : '#efe3c7'; fin='matte';
    o += `<rect width="250" height="350" rx="12" fill="${stock}"/>`;
    o += `<clipPath id="ph${uid}"><rect x="20" y="20" width="210" height="246" rx="18"/></clipPath><g clip-path="url(#ph${uid})">${paintStage(uid,c1,c2)}<g opacity=".95">${fig}</g><rect x="20" y="20" width="210" height="246" fill="#e8c890" opacity=".18" style="mix-blend-mode:multiply"/></g>`;
    o += `<rect x="20" y="20" width="210" height="246" rx="18" fill="none" stroke="${shade(stock,-0.45)}" stroke-width="2.5"/>`;
    o += `<path d="M22 276 H200 L186 296 L200 316 H22 Z" fill="${c1}"/><text x="32" y="301" font-family="Georgia,serif" font-weight="700" font-size="17" fill="#fff" textLength="${Math.min(150,name.length*9)}" lengthAdjust="spacingAndGlyphs">${esc(name)}</text>`;
    o += `<text x="228" y="336" text-anchor="end" font-family="Georgia,serif" font-style="italic" font-size="14" fill="${shade(c1,-0.2)}">${esc(T[1])}</text><circle cx="34" cy="332" r="9" fill="${c2}"/><text x="34" y="335.5" text-anchor="middle" ${VF} font-weight="800" font-size="8" fill="${lum(c2)>0.6?'#111':'#fff'}">${p.pos}</text>`;
    if (d.rc) o += rcShield(212, 42, '', 'her');
    if (d.relic) o += relicWindow(p, 150, 196, 70, 52, false, uid);
    if (d.auto) o += autoPanel(name, 34, 200, 182, 'her', uid);
    o += serialPlate(serial, run, 226, 316, 'ink', uid);
  }
  else if (t==='spr'){ // Summit: white peaks over a studio portrait, chrome finishes, 1st card flag
    const edge = par? borderFill(par,uid,'#f6f7f8') : '#f6f7f8'; fin = par? 'chrome' : 'gloss';
    o += `<rect width="250" height="350" rx="12" fill="${edge}"/>${par&&par.fin==='refr'?`<rect width="250" height="350" rx="12" fill="url(#pr${uid})" opacity=".55" style="mix-blend-mode:overlay"/>`:''}`;
    o += `<clipPath id="ph${uid}"><path d="M12 90 L60 40 L92 70 L140 22 L238 104 V338 H12 Z"/></clipPath><g clip-path="url(#ph${uid})">${studioStage(uid,c1)}${fig}${par&&par.fin==='refr'?`<rect width="250" height="350" fill="url(#pr${uid})" opacity=".12" style="mix-blend-mode:screen"/>`:''}</g>`;
    o += `<path d="M12 90 L60 40 L92 70 L140 22 L238 104" stroke="${par?shade(par.col,0.3):c1}" stroke-width="3" fill="none"/><path d="M12 12 H238 V104 L140 22 L92 70 L60 40 L12 90 Z" fill="${edge}" opacity=".9"/>`;
    o += `<text x="20" y="34" ${VF} font-weight="800" font-size="15" letter-spacing="4" fill="${c1}">SUMMIT</text><path d="M20 40 l8 -6 l6 4 l10 -9 l12 11" stroke="${c1}" stroke-width="1.5" fill="none"/>`;
    o += `<rect x="12" y="292" width="226" height="46" fill="#fff" opacity=".92"/><rect x="12" y="292" width="6" height="46" fill="${c1}"/><text x="26" y="316" ${VF} font-weight="800" font-size="20" fill="#14171b" textLength="${Math.min(180,name.length*10.5)}" lengthAdjust="spacingAndGlyphs">${esc(name.toUpperCase())}</text><text x="26" y="331" ${VF} font-weight="600" font-size="9" letter-spacing="1.5" fill="#555">${esc((p.tm===-1? teamName(p.org)+' ORG · PROSPECT' : T[0]+' '+T[1]).toUpperCase())} · ${p.pos}</text>`;
    if (d.first) o += `<g transform="translate(196 116)"><rect width="42" height="18" rx="2" fill="#14171b"/><text x="21" y="13" text-anchor="middle" ${VF} font-weight="800" font-size="11" fill="#f2c230">1ST</text></g>`;
    if (d.rc) o += rcShield(212, 140, '#fff');
    if (d.auto) o += autoPanel(name, 34, 222, 182, '', uid);
    o += serialPlate(serial, run, 234, 286, '', uid);
  }
  else { // Luxe: black stock, gold rules, an arched window, restraint
    const plat = par && par.fin==='super'; fin='gloss';
    o += `<rect width="250" height="350" rx="12" fill="${plat?'url(#plt'+uid+')':'#0d0d0f'}"/>${plat?'':'<rect width="250" height="350" rx="12" fill="url(#nz'+uid+')" opacity=".25"/>'}`;
    o += `<clipPath id="ph${uid}"><path d="M40 250 V110 A85 85 0 0 1 210 110 V250 Z"/></clipPath><g clip-path="url(#ph${uid})">${studioStage(uid,shade(c1,-0.3))}<g transform="translate(0 -18)">${fig}</g></g>`;
    const gold = plat? '#4a4f55' : (par&&par.fin==='color'? 'url(#gold'+uid+')' : '#c9a227');
    o += `<path d="M40 250 V110 A85 85 0 0 1 210 110 V250 Z" fill="none" stroke="${gold}" stroke-width="1.5"/><rect x="14" y="14" width="222" height="322" rx="6" fill="none" stroke="${gold}" stroke-width="1"/><rect x="19" y="19" width="212" height="312" rx="4" fill="none" stroke="${gold}" stroke-width=".5"/>`;
    o += `<text x="125" y="276" text-anchor="middle" font-family="Georgia,serif" font-size="15" letter-spacing="3" fill="${plat?'#1c1f23':'#f3dc8c'}" textLength="${Math.min(190,name.length*10)}" lengthAdjust="spacingAndGlyphs">${esc(name.toUpperCase())}</text><text x="125" y="292" text-anchor="middle" font-family="Georgia,serif" font-size="7.5" letter-spacing="3" fill="${plat?'#333':'#b9a468'}">${esc((T[0]+' '+T[1]).toUpperCase())}</text>`;
    o += `<text x="125" y="40" text-anchor="middle" font-family="Georgia,serif" font-size="10" letter-spacing="6" fill="${plat?'#222':'#c9a227'}">L U X E</text>`;
    if (d.rc) o += rcShield(226, 40, '', 'lux');
    if (d.relic) o += relicWindow(p, 70, 200, 110, 50, true, uid);
    if (d.auto) o += autoPanel(name, 45, 196, 160, 'lux', uid);
    o += `<g transform="translate(125 322)"><text text-anchor="middle" font-family="Georgia,serif" font-size="${run<=25?15:12}" letter-spacing="2" fill="${plat?'#111':'#f3dc8c'}" stroke="${plat?'none':'#6b5010'}" stroke-width=".4">${run&&serial? (run===1?'1 / 1':String(serial).padStart(String(run).length,'0')+' / '+run) : ''}</text></g>`;
  }
  if (d.variation) o += `<text x="236" y="${t==='her'?270:280}" text-anchor="end" ${VF} font-size="6" letter-spacing="1" fill="#fff" opacity=".7">${d.sec==='w'?'SSP':'SP'}</text>`;
  o += surface(uid, fin);
  return `<svg viewBox="0 0 250 350" xmlns="http://www.w3.org/2000/svg" class="cardsvg v2" data-fin="${par?par.fin:fin}" role="img" aria-label="${esc(name+' '+yr+' '+br.name+' '+d.title)}">${defs}<g clip-path="url(#cc${uid})">${o}</g></svg>`;
}
// route every brand through the new renderers
isV2Card = function(){ return true; };
(function(){ const prev=velFront; velFront=function(key, serial, opts){ const d=D(key); return B(d.prod).tmpl==='vel' ? prev(key,serial,opts) : cardV2(key,serial); }; })();

// ===================== COVERS: a cover system for every publisher =====================
// A cover is chosen by what happens in the issue first (a death, a return, a debut, an anniversary),
// then by a per-series shuffle of the genre's compositions, then varied by palette, framing and background.
const GPAL = {
  hero:[['#101a3a','#e63946','#f2c230'],['#0b3d2e','#f4a261','#e9f5db'],['#2b0f3a','#f72585','#4cc9f0'],['#1d1d1d','#ffba08','#e5e5e5'],['#0d1b2a','#e0e1dd','#e63946'],['#3a0ca3','#ffd60a','#f1faee']],
  scifi:[['#050a1f','#5bc0be','#e0fbfc'],['#1a0933','#ff9e00','#e9d8fd'],['#001219','#94d2bd','#ee9b00'],['#0b090a','#e5383b','#d3d3d3']],
  fantasy:[['#0d2226','#caa24a','#efe8d2'],['#2d1e2f','#8fbc8f','#f4ecd8'],['#14213d','#fca311','#e5e5e5'],['#3d0c11','#d4a373','#faedcd']],
  horror:[['#120a0c','#b3122e','#efe4c8'],['#0b1a0f','#8ac926','#e9edc9'],['#10002b','#ff6d00','#e0aaff'],['#1b1b1b','#e9d8a6','#9b2226']],
  crime:[['#0f1115','#e8b923','#f2ecdc'],['#1d2d44','#cf5c36','#f0ebd8'],['#111','#e63946','#f1faee'],['#2b2d42','#8d99ae','#edf2f4']],
  western:[['#582f0e','#e76f51','#ffe6a7'],['#6f1d1b','#bb9457','#ffe6a7'],['#283618','#dda15e','#fefae0']],
  romance:[['#ff8fab','#9d0208','#fff0f3'],['#7b2cbf','#ffafcc','#fefae0'],['#e56b6f','#355070','#fff1e6']],
  war:[['#4a5d23','#c2b280','#8b0000'],['#3e3e3e','#d4a373','#e8e8e8'],['#283618','#bc6c25','#fefae0']],
  kids:[['#ffd60a','#00b4d8','#ff006e'],['#90e0ef','#fb8500','#ffb703'],['#caffbf','#ff595e','#1982c4']],
  comedy:[['#ffbe0b','#3a86ff','#fb5607'],['#8ac926','#ff595e','#1982c4'],['#f4f1de','#e07a5f','#3d405b']],
  literary:[['#f5ebe0','#3d405b','#e07a5f'],['#edede9','#1d3557','#e63946'],['#e9edc9','#344e41','#bc6c25']],
  manga:[['#ffffff','#111111','#ef476f'],['#f8f9fa','#212529','#4361ee'],['#fff','#111','#ffbe0b']],
  alt:[['#f6f1e7','#1a1a1a','#d62828'],['#e9e3d5','#2b2b2b','#6a994e'],['#fcf6bd','#222','#ff006e']],
  exp:[['#ffffff','#000000','#e63946'],['#f1f1f1','#1a1a1a','#ffd400'],['#000','#fff','#00b4d8']]
};
const GFAM = {hero:'hero',scifi:'scifi',fantasy:'fantasy',horror:'horror',crime:'crime',mystery:'crime',thriller:'crime',western:'western',romance:'romance',comedy:'comedy',satire:'comedy',slice:'literary',literary:'literary',historical:'war',war:'war',adventure:'fantasy',ya:'hero',kids:'kids',anthology:'horror',exp:'exp',alt:'alt',manga:'manga'};
const GTPL = {
  hero:['hero','flight','punch','city','lineup','portrait','face','crowd','ruins','space','chase','speed'],
  scifi:['space','ship','hero','eye','portrait','ruins','city','flight'],
  fantasy:['dragon','castle','land','loom','portrait','hero','ruins','ship'],
  horror:['face','door','loom','land','eye','hands','portrait','ruins'],
  crime:['city','door','face','portrait','chase','eye','hands'],
  western:['duel','land','portrait','chase','ruins'],
  romance:['couple','portrait','city','land'],
  war:['planes','tank','portrait','ship','ruins'],
  kids:['mascot','mascot2','land','crowd','ship'],
  comedy:['mascot','mascot2','crowd','city','portrait'],
  literary:['type','portrait','door','land','city','window'],
  manga:['speed','portrait','hero','flight','crowd'],
  alt:['scrawl','portrait','type','crowd'],
  exp:['geo','type','eye','geo2']
};
function shuffleWith(arr, seed){ const a=arr.slice(), r=mkRng(seed); for (let i=a.length-1;i>0;i--){ const j=Math.floor(r()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
// ---------- characters look the same every time they show up ----------
const HAIR=['#1b1b1b','#3b2416','#6b3e1f','#c68642','#e8c07a','#b44527','#8c8c8c','#f2f2f2'];
function charLook(c, g){
  const h=hsh('look'+c.id); const r=mkRng(h); const hero = g===GI.hero || c.civ;
  const cols=['#d62828','#1d3557','#2a9d8f','#f4a261','#6a4c93','#e9c46a','#264653','#ff006e','#3a86ff','#8ac926','#111','#f1faee'];
  return { hero, c1:cols[h%cols.length], c2:cols[(h>>4)%cols.length]===cols[h%cols.length]?'#f2c230':cols[(h>>4)%cols.length], cape:hero && r()<0.55, mask:hero && r()<0.7, emb:Math.floor(r()*6), hair:HAIR[Math.floor(r()*HAIR.length)], skin:['#f1c7a3','#e0ac7e','#c68642','#8d5524','#5c3a21','#f6d7b0'][Math.floor(r()*6)], coat: !hero && r()<0.5, hat: !hero && r()<0.3, long: r()<0.4 };
}
function emblem(L, x, y, s){ const e=L.emb; const c=L.c2;
  return `<g transform="translate(${x} ${y}) scale(${s})">${e===0?`<circle r="8" fill="${c}"/>`:e===1?`<path d="M0 -9 L2.6 -3 L9 -3 L4 1.5 L6 8 L0 4 L-6 8 L-4 1.5 L-9 -3 L-2.6 -3 Z" fill="${c}"/>`:e===2?`<path d="M-3 -9 L5 -2 L0 -1 L4 9 L-5 0 L0 -1 Z" fill="${c}"/>`:e===3?`<path d="M0 -9 L8 0 L0 9 L-8 0 Z" fill="${c}"/>`:e===4?`<path d="M-10 -2 Q0 -10 10 -2 Q4 0 0 6 Q-4 0 -10 -2 Z" fill="${c}"/>`:`<path d="M-8 -8 H8 V2 Q8 8 0 10 Q-8 8 -8 2 Z" fill="${c}"/>`}</g>`; }
function heroFig(L, pose, x, y, s, flip){
  // a comic-art figure: bold outline, costume colours, optional cape and mask
  const K='#0b0b0b'; const c1=L.hero?L.c1:(L.coat?'#3b3b3b':L.c1), c2=L.hero?L.c2:'#2a2a2a';
  const P = {stand:[[-26,52],[26,52],[-14,120],[14,120],-8], fly:[[-60,-10],[40,34],[-10,110],[30,96],60], punch:[[-30,50],[62,8],[-24,118],[18,120],-4], fall:[[-40,80],[34,70],[-30,116],[22,120],24], burst:[[-58,-6],[58,-6],[-22,118],[22,118],0], crouch:[[-30,60],[30,64],[-30,96],[30,96],12]}[pose]||[[-26,52],[26,52],[-14,120],[14,120],0];
  const [lh, rh, lf, rf, tilt] = P;
  const limb=(ax,ay,bx,by,w,col)=>`<path d="M${ax} ${ay} L${bx} ${by}" stroke="${K}" stroke-width="${w+4}" stroke-linecap="round"/><path d="M${ax} ${ay} L${bx} ${by}" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>`;
  let o='';
  if (L.cape) o += `<path d="M-16 18 Q${-40-tilt} 90 ${-30-tilt} 128 L${30-tilt} 128 Q${40-tilt} 90 16 18 Z" fill="${c2}" stroke="${K}" stroke-width="2"/>`;
  o += limb(-10,68,lf[0],lf[1],13,c1)+limb(10,68,rf[0],rf[1],13,c1);
  o += `<ellipse cx="${lf[0]}" cy="${lf[1]+4}" rx="9" ry="5" fill="${L.hero?c2:K}"/><ellipse cx="${rf[0]}" cy="${rf[1]+4}" rx="9" ry="5" fill="${L.hero?c2:K}"/>`;
  o += `<path d="M-20 14 Q0 6 20 14 L16 72 Q0 78 -16 72 Z" fill="${c1}" stroke="${K}" stroke-width="2.5"/>${L.hero?emblem(L,0,34,1):''}${L.hero?`<path d="M-16 64 H16" stroke="${c2}" stroke-width="5"/>`:''}`;
  o += limb(-18,20,lh[0],lh[1],11,L.hero?c1:c1)+limb(18,20,rh[0],rh[1],11,c1);
  o += `<circle cx="${lh[0]}" cy="${lh[1]}" r="6" fill="${L.hero?c2:L.skin}" stroke="${K}" stroke-width="1.5"/><circle cx="${rh[0]}" cy="${rh[1]}" r="6" fill="${L.hero?c2:L.skin}" stroke="${K}" stroke-width="1.5"/>`;
  o += `<circle cx="0" cy="-4" r="15" fill="${L.skin}" stroke="${K}" stroke-width="2.5"/>`;
  if (L.mask) o += `<path d="M-15 -8 H15 V0 H-15 Z" fill="${c1}"/><path d="M-9 -5 h5 M4 -5 h5" stroke="#fff" stroke-width="2"/>`;
  else o += `<circle cx="-5" cy="-5" r="1.6" fill="${K}"/><circle cx="5" cy="-5" r="1.6" fill="${K}"/>`;
  o += `<path d="M-15 -8 Q-14 -24 0 -22 Q14 -24 15 -8 Q8 -16 0 -15 Q-8 -16 -15 -8 Z" fill="${L.mask&&L.hero?c1:L.hair}" stroke="${K}" stroke-width="1.5"/>`;
  if (L.hat) o += `<path d="M-20 -12 H20 L14 -16 V-26 H-14 V-16 Z" fill="#222"/>`;
  return `<g transform="translate(${x} ${y}) scale(${flip?-s:s} ${s}) rotate(${tilt/3})">${o}</g>`;
}
function bust(L, x, y, s){ const K='#0b0b0b'; return `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-60 90 Q-58 30 0 26 Q58 30 60 90 Z" fill="${L.hero?L.c1:(L.coat?'#3b3b3b':L.c1)}" stroke="${K}" stroke-width="3"/>${L.hero?emblem(L,0,58,2):''}<rect x="-10" y="10" width="20" height="20" fill="${L.skin}" stroke="${K}" stroke-width="2"/><ellipse cx="0" cy="-8" rx="28" ry="34" fill="${L.skin}" stroke="${K}" stroke-width="3"/><path d="M0 -30 Q30 -26 26 6 Q10 10 0 8 Z" fill="#000" opacity=".22"/>${L.mask?`<path d="M-28 -16 H28 V-2 H-28 Z" fill="${L.c1}" stroke="${K}" stroke-width="2"/><path d="M-16 -9 h9 M7 -9 h9" stroke="#fff" stroke-width="3"/>`:`<circle cx="-10" cy="-8" r="3" fill="${K}"/><circle cx="10" cy="-8" r="3" fill="${K}"/>`}<path d="M-8 14 q8 4 16 0" stroke="${K}" stroke-width="2.5" fill="none"/><path d="M-30 -14 Q-28 ${L.long?20:-44} 0 -44 Q28 ${L.long?-44:-44} 30 ${L.long?24:-14} Q14 -30 0 -30 Q-14 -30 -30 -14 Z" fill="${L.mask&&L.hero?L.c1:L.hair}" stroke="${K}" stroke-width="2"/></g>`; }
// ---------- compositions ----------
function scene(tpl, r, P, W, H, L, L2, flip){
  const [ink, acc, paper] = P; const K='#0b0b0b'; let o='';
  const burst=(cx,cy,col,op)=>Array.from({length:16},(_,i)=>`<path d="M${cx} ${cy} L${(cx+Math.cos(i/16*6.283)*420).toFixed(0)} ${(cy+Math.sin(i/16*6.283)*420).toFixed(0)} L${(cx+Math.cos((i+0.5)/16*6.283)*420).toFixed(0)} ${(cy+Math.sin((i+0.5)/16*6.283)*420).toFixed(0)} Z" fill="${col}" opacity="${op}"/>`).join('');
  const skyline=(y,col)=>{ let x=-5,p=''; while(x<W+10){ const w=14+r()*26, h=30+r()*90; p+=`<rect x="${x.toFixed(0)}" y="${(y-h).toFixed(0)}" width="${w.toFixed(0)}" height="${(h+400).toFixed(0)}" fill="${col}"/>`; x+=w+1; } return p; };
  switch(tpl){
    case 'hero': { const bgk=Math.floor(r()*4), pose=['stand','burst','crouch','punch','stand'][Math.floor(r()*5)];
      o=`<rect width="${W}" height="${H}" fill="${bgk===3?acc:ink}"/>`+(bgk===0?burst(W/2,H*0.4,acc,0.18): bgk===1?Array.from({length:40},()=>`<circle cx="${(r()*W).toFixed(0)}" cy="${(r()*H).toFixed(0)}" r="${(r()*1.4).toFixed(1)}" fill="#fff"/>`).join('')+`<circle cx="${W*0.75}" cy="${H*0.2}" r="30" fill="${paper}" opacity=".7"/>`: bgk===2?`<rect y="${H*0.62}" width="${W}" height="${H}" fill="${shade(acc,-0.3)}"/>`: burst(W*(0.2+r()*0.6),H*0.3,paper,0.2))+(bgk!==1?skyline(H,shade(ink,-0.3)):'')+heroFig(L,pose,W*(0.4+r()*0.2),H*(0.3+r()*0.08),1.3+r()*0.4,flip); break; }
    case 'flight': o=`<rect width="${W}" height="${H}" fill="${shade(ink,0.15)}"/>${Array.from({length:10},()=>`<path d="M${(r()*W).toFixed(0)} ${(r()*H).toFixed(0)} l-60 20" stroke="${paper}" stroke-width="2" opacity=".25"/>`).join('')}${skyline(H,shade(ink,-0.35))}${heroFig(L,'fly',W*0.5,H*0.36,1.3,flip)}`; break;
    case 'punch': o=`<rect width="${W}" height="${H}" fill="${acc}"/>${burst(W*0.66,H*0.36,paper,0.25)}${heroFig(L2||L,'fall',W*0.72,H*0.44,1.1,!flip)}${heroFig(L,'punch',W*0.36,H*0.4,1.35,flip)}<path d="M${W*0.58} ${H*0.3} l14 -10 l-2 12 l14 2 l-12 8 l8 12 l-14 -6 l-4 12 l-4 -14 Z" fill="${paper}" stroke="${K}" stroke-width="2"/>`; break;
    case 'lineup': o=`<rect width="${W}" height="${H}" fill="${ink}"/>${burst(W/2,H*0.2,acc,0.2)}${[0,1,2,3].map(i=>heroFig(i===1?L:charLook({id:(L.seed||1)*7+i},GI.hero),'stand',W*(0.18+i*0.22),H*(0.42+(i%2)*0.04),0.9,i%2)).join('')}`; break;
    case 'crowd': o=`<rect width="${W}" height="${H}" fill="${paper}"/>${Array.from({length:12},(_,i)=>`<circle cx="${(r()*W).toFixed(0)}" cy="${(H*0.55+r()*H*0.4).toFixed(0)}" r="${(16+r()*12).toFixed(0)}" fill="${[acc,ink,shade(acc,0.3)][i%3]}" stroke="${K}" stroke-width="2"/>`).join('')}${heroFig(L,'burst',W/2,H*0.3,1.2,flip)}`; break;
    case 'ruins': o=`<rect width="${W}" height="${H}" fill="${shade(acc,-0.4)}"/><circle cx="${W*0.7}" cy="${H*0.25}" r="40" fill="${paper}" opacity=".6"/>${Array.from({length:6},(_,i)=>`<path d="M${i*38} ${H} V${H*(0.55+r()*0.2)} l14 -12 l6 16 l10 -4 V${H}" fill="${shade(ink,0.1)}"/>`).join('')}${heroFig(L,'crouch',W*0.5,H*0.52,1.1,flip)}`; break;
    case 'space': o=`<rect width="${W}" height="${H}" fill="${ink}"/>${Array.from({length:50},()=>`<circle cx="${(r()*W).toFixed(0)}" cy="${(r()*H).toFixed(0)}" r="${(r()*1.3+0.2).toFixed(1)}" fill="#fff"/>`).join('')}<circle cx="${W*(0.25+r()*0.5)}" cy="${H*0.62}" r="${60+r()*30}" fill="${acc}"/><ellipse cx="${W*0.5}" cy="${H*0.62}" rx="120" ry="18" fill="none" stroke="${paper}" stroke-width="3" transform="rotate(${-20+r()*40} ${W/2} ${H*0.62})"/>${heroFig(L,'fly',W*0.5,H*0.26,0.9,flip)}`; break;
    case 'ship': o=`<rect width="${W}" height="${H}" fill="${shade(ink,0.1)}"/><rect y="${H*0.62}" width="${W}" height="${H}" fill="${shade(acc,-0.3)}"/>${Array.from({length:8},(_,i)=>`<path d="M0 ${H*0.64+i*14} q25 -6 50 0 t50 0 t50 0 t50 0" stroke="${paper}" fill="none" opacity=".25"/>`).join('')}<path d="M${W*0.2} ${H*0.6} H${W*0.8} L${W*0.7} ${H*0.7} H${W*0.3} Z" fill="${K}"/><path d="M${W*0.5} ${H*0.6} V${H*0.18} L${W*0.78} ${H*0.52} Z" fill="${paper}" stroke="${K}" stroke-width="2"/><path d="M${W*0.48} ${H*0.6} V${H*0.24} L${W*0.26} ${H*0.54} Z" fill="${shade(paper,-0.1)}" stroke="${K}" stroke-width="2"/>`; break;
    case 'dragon': o=`<rect width="${W}" height="${H}" fill="${ink}"/><circle cx="${W*0.7}" cy="${H*0.25}" r="36" fill="${acc}" opacity=".8"/><path d="M${W*0.1} ${H*0.3} Q${W*0.5} ${H*0.05} ${W*0.9} ${H*0.3} Q${W*0.6} ${H*0.24} ${W*0.5} ${H*0.38} Q${W*0.4} ${H*0.24} ${W*0.1} ${H*0.3} Z" fill="${K}"/><path d="M${W*0.5} ${H*0.36} q-10 30 10 60 q16 20 -6 44" stroke="${K}" stroke-width="12" fill="none" stroke-linecap="round"/><path d="M0 ${H*0.84} L${W*0.3} ${H*0.66} L${W*0.55} ${H*0.8} L${W*0.8} ${H*0.62} L${W} ${H*0.78} V${H} H0 Z" fill="${shade(ink,-0.3)}"/>${heroFig(L,'stand',W*0.3,H*0.62,0.6,flip)}`; break;
    case 'castle': o=`<rect width="${W}" height="${H}" fill="${shade(acc,-0.3)}"/><circle cx="${W*0.3}" cy="${H*0.22}" r="30" fill="${paper}" opacity=".8"/><path d="M${W*0.35} ${H*0.8} V${H*0.4} h14 v-10 h8 v10 h14 V${H*0.3} l16 -20 l16 20 V${H*0.8} Z" fill="${K}"/><rect x="${W*0.48}" y="${H*0.5}" width="8" height="12" fill="${acc}"/><path d="M0 ${H*0.8} Q${W/2} ${H*0.74} ${W} ${H*0.8} V${H} H0 Z" fill="${shade(ink,-0.2)}"/>${heroFig(L,'stand',W*0.72,H*0.66,0.7,true)}`; break;
    case 'duel': o=`<rect width="${W}" height="${H}" fill="${acc}"/><circle cx="${W/2}" cy="${H*0.5}" r="60" fill="${paper}" opacity=".6"/><rect y="${H*0.62}" width="${W}" height="${H}" fill="${shade(acc,-0.35)}"/>${heroFig(L,'stand',W*0.26,H*0.52,0.9,false)}${heroFig(L2||L,'stand',W*0.76,H*0.54,0.8,true)}`; break;
    case 'chase': o=`<rect width="${W}" height="${H}" fill="${ink}"/>${Array.from({length:14},()=>`<path d="M${(r()*W).toFixed(0)} ${(H*0.4+r()*H*0.5).toFixed(0)} l-70 0" stroke="${acc}" stroke-width="2" opacity=".4"/>`).join('')}<path d="M${W*0.2} ${H*0.66} h${W*0.5} l12 -20 h-30 l-10 -16 h-40 l-14 16 h-18 Z" fill="${acc}" stroke="${K}" stroke-width="2"/><circle cx="${W*0.3}" cy="${H*0.67}" r="10" fill="${K}"/><circle cx="${W*0.62}" cy="${H*0.67}" r="10" fill="${K}"/>${heroFig(L,'punch',W*0.76,H*0.3,0.8,true)}`; break;
    case 'couple': o=`<rect width="${W}" height="${H}" fill="${ink}"/><path d="M${W/2} ${H*0.8} C${W*0.05} ${H*0.5} ${W*0.2} ${H*0.18} ${W/2} ${H*0.36} C${W*0.8} ${H*0.18} ${W*0.95} ${H*0.5} ${W/2} ${H*0.8} Z" fill="${paper}" opacity=".35"/>${bust(L,W*0.36,H*0.46,0.95)}${bust(L2||L,W*0.66,H*0.5,0.9)}`; break;
    case 'planes': o=`<rect width="${W}" height="${H}" fill="${paper}"/><rect y="${H*0.7}" width="${W}" height="${H}" fill="${acc}"/>${[0,1,2].map(i=>`<g transform="translate(${W*(0.25+i*0.25)} ${H*(0.25+i*0.12)}) rotate(${-10+i*8}) scale(${1-i*0.2})"><path d="M-50 0 L50 -3 L56 0 L50 3 Z" fill="${ink}"/><path d="M-6 -2 L-24 -34 L-12 -34 L10 -2 Z M-6 2 L-24 34 L-12 34 L10 2 Z" fill="${ink}"/></g>`).join('')}${Array.from({length:6},()=>`<circle cx="${(r()*W).toFixed(0)}" cy="${(H*0.7+r()*20).toFixed(0)}" r="${(10+r()*14).toFixed(0)}" fill="#777" opacity=".6"/>`).join('')}`; break;
    case 'tank': o=`<rect width="${W}" height="${H}" fill="${shade(acc,0.3)}"/><rect y="${H*0.66}" width="${W}" height="${H}" fill="${ink}"/><g transform="translate(${W*0.5} ${H*0.62})"><rect x="-60" y="-18" width="120" height="30" rx="8" fill="${shade(ink,0.2)}" stroke="${K}" stroke-width="2"/><rect x="-30" y="-40" width="56" height="24" rx="4" fill="${shade(ink,0.25)}" stroke="${K}" stroke-width="2"/><path d="M20 -30 L90 -44" stroke="${K}" stroke-width="7"/>${[-44,-22,0,22,44].map(x=>`<circle cx="${x}" cy="10" r="8" fill="${K}"/>`).join('')}</g>${heroFig(L,'crouch',W*0.2,H*0.56,0.6,false)}`; break;
    case 'mascot': case 'mascot2': { const cx=W*(0.35+r()*0.3), cy=H*0.56; o=`<rect width="${W}" height="${H}" fill="${ink}"/>${Array.from({length:14},()=>`<circle cx="${(r()*W).toFixed(0)}" cy="${(r()*H).toFixed(0)}" r="${(4+r()*10).toFixed(0)}" fill="${paper}" opacity=".35"/>`).join('')}<ellipse cx="${cx}" cy="${cy}" rx="52" ry="58" fill="${acc}" stroke="${K}" stroke-width="3"/>${tpl==='mascot'?`<path d="M${cx-38} ${cy-44} l-8 -34 l26 20 Z M${cx+38} ${cy-44} l8 -34 l-26 20 Z" fill="${acc}" stroke="${K}" stroke-width="3"/>`:`<ellipse cx="${cx-30}" cy="${cy-58}" rx="12" ry="30" fill="${acc}" stroke="${K}" stroke-width="3"/><ellipse cx="${cx+30}" cy="${cy-58}" rx="12" ry="30" fill="${acc}" stroke="${K}" stroke-width="3"/>`}<circle cx="${cx-18}" cy="${cy-12}" r="11" fill="#fff" stroke="${K}" stroke-width="2"/><circle cx="${cx+18}" cy="${cy-12}" r="11" fill="#fff" stroke="${K}" stroke-width="2"/><circle cx="${cx-15}" cy="${cy-10}" r="5" fill="${K}"/><circle cx="${cx+21}" cy="${cy-10}" r="5" fill="${K}"/><path d="M${cx-20} ${cy+16} Q${cx} ${cy+36} ${cx+20} ${cy+16}" stroke="${K}" stroke-width="3" fill="#b3122e"/>`; break; }
    case 'speed': o=`<rect width="${W}" height="${H}" fill="#fff"/>${Array.from({length:44},(_,i)=>`<path d="M${W/2} ${H*0.5} L${(W/2+Math.cos(i/44*6.283)*300).toFixed(0)} ${(H*0.5+Math.sin(i/44*6.283)*300).toFixed(0)}" stroke="${acc}" stroke-width="${(0.6+r()*2).toFixed(1)}" opacity=".6"/>`).join('')}${bust(L,W/2,H*0.5,1.1)}`; break;
    case 'scrawl': o=`<rect width="${W}" height="${H}" fill="${ink}"/>${Array.from({length:40},()=>`<path d="M${(r()*W).toFixed(0)} ${(r()*H).toFixed(0)} q${(r()*40-20).toFixed(0)} ${(r()*40-20).toFixed(0)} ${(r()*60-30).toFixed(0)} ${(r()*60-30).toFixed(0)}" stroke="${acc}" stroke-width="2" fill="none"/>`).join('')}${bust(L,W*0.5,H*0.5,1)}`; break;
    case 'geo': case 'geo2': o=`<rect width="${W}" height="${H}" fill="${ink}"/>${Array.from({length:tpl==='geo'?7:14},()=>{ const x=r()*W,y=r()*H,s=16+r()*70; return r()<0.5?`<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="${s.toFixed(0)}" height="${s.toFixed(0)}" fill="${r()<0.5?acc:paper}" transform="rotate(${(r()*60).toFixed(0)} ${x.toFixed(0)} ${y.toFixed(0)})"/>`:`<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(s/2).toFixed(0)}" fill="none" stroke="${r()<0.5?acc:paper}" stroke-width="${(2+r()*6).toFixed(0)}"/>`; }).join('')}`; break;
    case 'window': o=`<rect width="${W}" height="${H}" fill="${paper}"/><rect x="${W*0.2}" y="${H*0.2}" width="${W*0.6}" height="${H*0.5}" fill="${acc}" stroke="${ink}" stroke-width="5"/><path d="M${W/2} ${H*0.2} V${H*0.7} M${W*0.2} ${H*0.45} H${W*0.8}" stroke="${ink}" stroke-width="5"/>${bust(L,W*0.6,H*0.84,0.7)}`; break;
    case 'portrait': o=`<rect width="${W}" height="${H}" fill="${acc}"/><circle cx="${W*(0.4+r()*0.2)}" cy="${H*0.42}" r="${W*0.36}" fill="${shade(acc,0.25)}"/>${bust(L,W*(0.42+r()*0.16),H*0.52,1.15)}`; break;
    default: o=blpArt(tpl, r, P, W, H, null); // face, door, loom, land, eye, city, hands, type
  }
  return o;
}
// ---------- the publisher's mark ----------
function pubMark(s, x, y, sc, col, bg){
  if (s.pub<0) return '';
  const pb=G.cm.pubs[s.pub]; if (pb.sh==='BLP') return BLP_MARK(x,y,sc*0.9,col);
  const h=hsh('mark'+pb.id)%5; const init=pb.sh.replace(/[^A-Z&]/g,'').slice(0,3);
  const shape = h===0?`<circle r="15" fill="${bg}" stroke="${col}" stroke-width="2"/>`: h===1?`<path d="M-14 -15 H14 V4 Q14 14 0 18 Q-14 14 -14 4 Z" fill="${bg}" stroke="${col}" stroke-width="2"/>`: h===2?`<path d="M0 -17 L16 -5 L10 15 H-10 L-16 -5 Z" fill="${bg}" stroke="${col}" stroke-width="2"/>`: h===3?`<rect x="-15" y="-15" width="30" height="30" rx="3" fill="${bg}" stroke="${col}" stroke-width="2"/>`:`<path d="M-16 -10 L-8 -16 L0 -10 L8 -16 L16 -10 V14 H-16 Z" fill="${bg}" stroke="${col}" stroke-width="2"/>`;
  return `<g transform="translate(${x} ${y}) scale(${sc})">${shape}<text y="${init.length>2?3.5:4.5}" text-anchor="middle" ${VF} font-weight="800" font-size="${init.length>2?10:13}" fill="${col}">${esc(init)}</text></g>`;
}
// ---------- cover words ----------
function blurbFor(ks, s, n, yr, r){
  const nm=id=>CH_(id).n.toUpperCase();
  for (const k of ks){ if (k[1]==='dth') return `THE DEATH OF ${nm(k[2])}!`; if (k[1]==='ret') return `${nm(k[2])} RETURNS!`; if (k[1]==='team') return `INTRODUCING ${nm(k[2])}!`; if (k[1]==='fa' && n>1) return yr<1990? `INTRODUCING ${nm(k[2])}!` : 'WHO IS '+nm(k[2])+'?'; if (k[1]==='ori') return `THE ORIGIN OF ${nm(k[2])}!`; if (k[1]==='cos') return `A NEW LOOK FOR ${nm(k[2])}!`; if (k[1]==='ann') return `GIANT ${n}TH ISSUE!`; if (k[1]==='fin') return s.sts==='cx'&&yr<2000? 'FINAL ISSUE!' : 'THE FINAL CHAPTER'; if (k[1]==='arc') return yr<1990? 'A NEW SAGA BEGINS!' : 'PART ONE'; }
  if (n===1) return yr<1990? 'FIRST ISSUE!' : '';
  const G_={hero:['THE BATTLE OF THE CENTURY!','TRAPPED!','BETRAYED!','THE VILLAIN WINS?','NOT A DREAM! NOT A HOAX!','ALL-OUT WAR!','THE END OF EVERYTHING?'],horror:['DARE YOU READ IT?','DON\'T TURN OUT THE LIGHTS!','IT CAME FROM BELOW!','NO ONE LEAVES!','THE STRANGEST TALE YET!'],crime:['CRIME DOES NOT PAY!','MURDER ON MAIN STREET!','THE BIG HEIST!','WHO KILLED HIM?'],romance:['WILL SHE SAY YES?','HEARTBREAK!','TORN BETWEEN TWO LOVES!'],war:['FIGHTING MAD!','NO RETREAT!','BEHIND ENEMY LINES!'],western:['SHOWDOWN AT SUNDOWN!','WANTED!','RIDE OR DIE!'],scifi:['FROM BEYOND THE STARS!','INVASION!','LOST IN SPACE!'],kids:['OH NO!','WHAT A MESS!','SURPRISE PARTY!'],comedy:['LAUGHS GALORE!','OOPS!','WHAT A MESS!']}[GFAM[CG[s.g].k]] || ['SUSPENSE!','ACTION!','MYSTERY!','CAN THEY ESCAPE?'];
  if (yr<1975 && r()<0.5) return pick(G_);
  return '';
}
function coverV2(key){
  const d=cmD(key), s=d.s; const W=200, H=300; const uid=hsh('c2'+key).toString(36);
  const n=d.n||1; const yr=yearOf(issueDay(s, n)); const age=yearOf(G.day)-yr; const fam=GFAM[CG[s.g].k]||'literary';
  const variant = d.v && d.v!=='B' ? d.v : ''; const virgin=/^V/.test(variant), sketch=/^S/.test(variant);
  // a new composition for every issue: story first, then a per-series shuffle, then variety
  const rs=hsh(s.id+'|'+n+'|'+(d.v||'')+'|'+(d.tr?d.kind+d.vol:'')); const r=mkRng(rs);
  const ks = d.tr? [] : issueKeys(s,n);
  const lead = s.ch.length? CH_(s.ch[0]) : null; const L = lead? charLook(lead, s.g) : charLook({id:s.id*13},s.g); L.seed=s.id;
  const other = ks.find(k=>['fa','cam','team','dth','ret'].includes(k[1]) && k[2]!==(lead&&lead.id)); const L2 = other && CH_(other[2]) ? charLook(CH_(other[2]), s.g) : charLook({id:s.id*31+n}, s.g);
  const pool = GTPL[fam]; const perm = shuffleWith(pool, hsh('perm'+s.id));
  let tpl = perm[((n-1) + Math.floor((n-1)/perm.length)*2 + (d.v?3:0)) % perm.length];
  if (ks.some(k=>k[1]==='dth')) tpl = fam==='hero'?'punch':'portrait';
  else if (ks.some(k=>k[1]==='ret')) tpl = fam==='hero'?'crowd':'portrait';
  else if (ks.some(k=>k[1]==='team')) tpl = fam==='hero'?'lineup':tpl;
  else if (n===1 && !d.v) tpl = fam==='hero'? 'hero' : ['portrait','hero','speed','mascot'].includes(perm[0])? perm[0] : tpl;
  const va_=pvar(d.v||''); const aid = va_.a>=0? va_.a : (s.cv>=0? s.cv : s.a); const ST=artStyle(aid);
  const evt = ks.some(k=>['dth','ret','team'].includes(k[1])) || (n===1&&!d.v);
  if (!evt && r()<0.65) tpl = ST.tpls[(n+(d.v?1:0))%3];
  const pals = GPAL[fam]; let P = pals[(hsh('pal'+s.id)+n*(1+(s.id%3))+(d.v?2:0)) % pals.length].slice();
  if (r()<0.3) P[1]=shade(P[1], r()<0.5?0.2:-0.2);
  if (r()<0.7) P=palShift(P, ST.pal);
  const flip = r()<0.5;
  let art = scene(tpl, r, sketch? ['#ffffff','#e5e5e5','#ffffff'] : P, W, H, L, L2, flip);
  if (ST.frame==='close') art=`<g transform="translate(-22 -34) scale(1.22)">${art}</g>`; else if (ST.frame==='wide') art=`<rect width="${W}" height="${H}" fill="${P[0]}"/><g transform="translate(16 26) scale(.84)">${art}</g>`;
  art += motifSVG(ST.motif, r, W, H, P[2]);
  if (ks.some(k=>k[1]==='dth')) art += `<rect width="${W}" height="${H}" fill="#000" opacity=".25"/>`;
  if (sketch) art = `<g filter="url(#sk${uid})">${art}</g>`;
  const title=s.t.toUpperCase(); const tier=tierOf(s); const pb=s.pub>=0?G.cm.pubs[s.pub]:null;
  const blurb = virgin? '' : blurbFor(ks, s, n, yr, r);
  const W_=CR_(s.w), A_=CR_(s.a); const credits=(W_===A_? W_.n : W_.n.split(' ').pop()+' / '+A_.n.split(' ').pop()).toUpperCase();
  const price = d.cp<1? Math.round(d.cp*100)+'¢' : '$'+d.cp.toFixed(2);
  const fitT=(len,max,base)=>Math.max(13, Math.min(base, Math.floor(max/Math.max(6,len)*1.85)));
  const fitA=(len,max,size)=> len*size*0.56>max ? `textLength="${max}" lengthAdjust="spacingAndGlyphs"` : '';
  let dress='';
  if (d.tr){ // collected editions: a book jacket built on the series' look
    const hc=d.kind==='H'; return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" class="cmsvg v2"><defs><clipPath id="cc${uid}"><rect width="${W}" height="${H}"/></clipPath></defs><g clip-path="url(#cc${uid})"><rect width="${W}" height="${H}" fill="${hc?'#141414':P[0]}"/><g transform="translate(24 70) scale(.76)" opacity="${hc?0.6:1}">${scene(perm[0], mkRng(rs), P, W, H, L, L2, false)}</g><rect width="12" height="${H}" fill="${hc?'#c9a227':shade(P[0],-0.3)}"/><text x="${W/2+6}" y="36" text-anchor="middle" ${VF} font-weight="800" font-size="${fitT(title.length,170,24)}" fill="${hc?'#c9a227':P[2]}">${esc(title)}</text><text x="${W/2+6}" y="56" text-anchor="middle" ${VF} font-size="12" letter-spacing="2" fill="${hc?'#e8d8a0':P[2]}">${hc?'DELUXE HARDCOVER':'VOLUME '+d.vol}</text><text x="${W/2+6}" y="${H-12}" text-anchor="middle" ${VF} font-size="10" fill="${hc?'#c9a227':P[2]}">${esc(credits)}</text></g></svg>`; }
  if (!virgin){
    const era = yr<1956?'gold': yr<1970?'silver': yr<1985?'bronze': yr<1993?'late': yr<2000?'spec': yr<2010?'modern':'now';
    const indieDress = tier>=2 && yr>=1978 && yr<2000;
    if (era==='gold'){ dress += `<rect width="${W}" height="64" fill="${P[1]}"/><rect x="5" y="5" width="38" height="50" fill="#fff" stroke="#111" stroke-width="1.5"/>${pubMark(s,24,20,0.55,'#111','#fff')}<text x="24" y="44" text-anchor="middle" ${VF} font-weight="800" font-size="11" fill="#c00">${price}</text><text x="24" y="53" text-anchor="middle" ${VF} font-size="8" fill="#111">No. ${n}</text><text x="${W/2+22}" y="44" text-anchor="middle" font-family="Georgia,serif" font-weight="900" font-size="${fitT(title.length,150,30)}" ${fitA(title.length,150,fitT(title.length,150,30))} fill="${P[2]}" stroke="#111" stroke-width="1.6" paint-order="stroke">${esc(title)}</text>`; }
    else if (era==='silver'||era==='bronze'){ dress += `<rect width="44" height="62" fill="#fff"/><rect x="3" y="3" width="38" height="56" fill="${P[1]}"/>${pubMark(s,22,18,0.5,'#fff',P[1])}<text x="22" y="42" text-anchor="middle" ${VF} font-weight="800" font-size="15" fill="#fff">${n}</text><text x="22" y="54" text-anchor="middle" ${VF} font-size="9" fill="#fff">${price}</text><text x="${W/2+22}" y="${era==='silver'?40:44}" text-anchor="middle" ${VF} font-weight="800" font-size="${fitT(title.length,150,32)}" ${fitA(title.length,148,fitT(title.length,150,32))} fill="${P[2]}" stroke="#111" stroke-width="1.4" paint-order="stroke" ${era==='silver'?'font-style="italic"':''}>${esc(title)}</text>`; if (era==='bronze' && tier<=1) dress += `<g transform="translate(${W-24} ${H-24})"><rect x="-14" y="-12" width="28" height="24" fill="#fff" stroke="#111"/><text y="-3" text-anchor="middle" ${VF} font-size="5" fill="#111">APPROVED</text><text y="4" text-anchor="middle" ${VF} font-size="5" fill="#111">BY THE CSB</text></g>`; }
    else if (indieDress){ dress += `<rect width="${W}" height="54" fill="#0a0a0a"/>${pubMark(s,20,27,0.8,'#e8e2cf','#0a0a0a')}<text x="38" y="20" ${VF} font-size="8" letter-spacing="1" fill="#e8e2cf">${esc((pb?pb.n:'').toUpperCase().slice(0,24))}</text><text x="38" y="30" ${VF} font-size="8" fill="#e8e2cf">No. ${n} · ${price}</text><text x="${W-8}" y="48" text-anchor="end" font-family="Georgia,serif" font-weight="700" font-size="${fitT(title.length,150,24)}" ${fitA(title.length,150,fitT(title.length,150,24))} fill="${P[1]}">${esc(title)}</text>`; }
    else if (era==='late'||era==='spec'){ dress += `<defs><linearGradient id="t9${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".5" stop-color="${P[1]}"/><stop offset="1" stop-color="${shade(P[1],-0.5)}"/></linearGradient></defs><text x="${W/2}" y="44" text-anchor="middle" ${VF} font-weight="800" font-size="${fitT(title.length,185,38)}" ${fitA(title.length,184,fitT(title.length,185,38))} fill="${era==='spec'?'url(#t9'+uid+')':P[2]}" stroke="#000" stroke-width="1.5" paint-order="stroke">${esc(title)}</text>${pubMark(s,20,H-22,0.6,'#fff','#111')}<text x="36" y="${H-14}" ${VF} font-weight="800" font-size="12" fill="#fff" stroke="#000" stroke-width="1.5" paint-order="stroke">#${n}</text>`; if (era==='spec' && n===1) dress += `<rect x="0" y="${H-56}" width="${W}" height="15" fill="#f2c230" transform="rotate(-5 ${W/2} ${H-48})"/><text x="${W/2}" y="${H-45}" text-anchor="middle" ${VF} font-weight="800" font-size="10" fill="#111" transform="rotate(-5 ${W/2} ${H-48})">COLLECTOR'S EDITION #1</text>`; }
    else { const lightBg = lum(P[0])>0.6 && !['hero','flight','space'].includes(tpl); const tc = lightBg? '#111' : '#fff';
      dress += `<text x="12" y="30" ${VF} font-weight="800" font-size="${fitT(title.length,176,26)}" ${fitA(title.length+2,176,fitT(title.length,176,26))} letter-spacing="1.5" fill="${tc}" stroke="${lightBg?'none':'#0006'}" stroke-width=".6" paint-order="stroke">${esc(title)}</text><text x="12" y="${H-12}" ${VF} font-size="8" letter-spacing="2" fill="${tc}" opacity=".9">${esc(credits)}</text>${pubMark(s,W-18,H-22,0.55,tc,'transparent')}<text x="${W-34}" y="${H-12}" text-anchor="end" ${VF} font-weight="700" font-size="11" fill="${tc}">${n}</text>`;
      if (!d.v && era==='now') dress += `<g transform="translate(${W-44} 42)"><rect width="32" height="20" fill="#fff"/>${Array.from({length:12},(_,i)=>`<rect x="${2+i*2.4}" y="3" width="${i%3?1:1.6}" height="13" fill="#111"/>`).join('')}</g>`; }
    if (blurb){ const bw=Math.min(W-30, blurb.length*6.2+18); const bf = blurb.length*6.2+18>W-30 ? `textLength="${W-44}" lengthAdjust="spacingAndGlyphs"` : ''; dress += yr<1975 ? `<g transform="translate(${W-bw/2-10} ${H*0.8}) rotate(-6)"><path d="M${-bw/2} -14 L${bw/2} -18 L${bw/2+6} 12 L${-bw/2-4} 16 Z" fill="${P[2]}" stroke="#111" stroke-width="2"/><text y="4" text-anchor="middle" ${VF} font-weight="800" font-size="11" fill="#b3122e" ${bf}>${esc(blurb)}</text></g>` : yr<2000 ? `<g transform="translate(14 ${H-62}) rotate(-3)"><rect width="${bw}" height="22" fill="${P[2]}" stroke="#111" stroke-width="2"/><text x="${bw/2}" y="15" text-anchor="middle" ${VF} font-weight="800" font-size="11" fill="#b3122e" ${bf}>${esc(blurb)}</text></g>` : `<text x="12" y="44" ${VF} font-size="9" letter-spacing="2" fill="#fff" opacity=".85">${esc(blurb)}</text>`; }
    if (d.p>1 && d.p<9) dress += `<text x="${W-8}" y="${H*0.62}" text-anchor="end" ${VF} font-weight="800" font-size="10" fill="#fff" stroke="#b3122e" stroke-width="3" paint-order="stroke">${['','','SECOND','THIRD','FOURTH','FIFTH'][d.p]||''} PRINTING</text>`;
    if (d.p===9) dress += `<rect width="${W}" height="14" fill="#111"/><text x="${W/2}" y="11" text-anchor="middle" ${VF} font-weight="700" font-size="9" letter-spacing="2" fill="#fff">FACSIMILE EDITION</text>`;
    if (/^X/.test(variant)) dress += `<rect x="0" y="${H-24}" width="${W}" height="24" fill="#111"/><text x="${W/2}" y="${H-8}" text-anchor="middle" ${VF} font-weight="700" font-size="11" fill="#f2c230" letter-spacing="1">RETAILER EXCLUSIVE</text>`;
    if (/^C/.test(variant)) dress += `<rect x="0" y="${H-24}" width="${W}" height="24" fill="#c8102e"/><text x="${W/2}" y="${H-8}" text-anchor="middle" ${VF} font-weight="700" font-size="10" fill="#fff" letter-spacing="1">CONVENTION EXCLUSIVE</text>`;
    if (/^R/.test(variant)) dress += `<text x="${W-8}" y="${H*0.68}" text-anchor="end" ${VF} font-size="7" letter-spacing="2" fill="#fff" stroke="#0008" stroke-width="1" paint-order="stroke">VARIANT EDITION</text>`;
  }
  if (!virgin && yr>=1980 && CR_(aid)) dress += `<path d="${sigPath(CR_(aid).n)}" transform="translate(${W-70} ${H-46}) scale(.24)" fill="none" stroke="${P[2]}" stroke-width="${5*ST.line}" opacity=".8" stroke-linecap="round"/>`;
  const tone = Math.min(0.28, Math.max(0, age-15)*0.007);
  const half = yr<2000 ? `<pattern id="ht${uid}" width="4" height="4" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r=".8" fill="#000"/></pattern><rect width="${W}" height="${H}" fill="url(#ht${uid})" opacity="${yr<1975?0.1:0.06}"/>` : '';
  const mis = yr<1995 ? `<rect width="${W}" height="3" fill="#00a0c6" opacity=".18" transform="translate(1.2 .6)"/>` : '';
  const foil = d.v==='F' ? `<rect width="${W}" height="${H}" fill="url(#fo${uid})"/>` : '';
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" class="cmsvg v2" data-era="${yr}"><defs><clipPath id="cc${uid}"><rect width="${W}" height="${H}"/></clipPath><filter id="sk${uid}"><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncR type="discrete" tableValues="0 1"/><feFuncG type="discrete" tableValues="0 1"/><feFuncB type="discrete" tableValues="0 1"/></feComponentTransfer></filter><linearGradient id="fo${uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".45" stop-color="#fff" stop-opacity=".45"/><stop offset=".55" stop-color="#b3e5fc" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
    <g clip-path="url(#cc${uid})">${art}${half}${dress}${mis}${foil}${tone?`<rect width="${W}" height="${H}" fill="#c9a45c" opacity="${tone.toFixed(3)}" style="mix-blend-mode:multiply"/>`:''}<rect width="${W}" height="${H}" fill="none" stroke="rgba(0,0,0,.35)"/></g></svg>`;
}
(function(){ comicCover=function(key){ let h=CVC.get('v3'+key); if (!h){ h=coverV2(key); if (CVC.size>1500) CVC.clear(); CVC.set('v3'+key,h); } return h; }; })();

// ===================== UI FRAMEWORK =====================
const UI = { tab:'home', sub:{ market:'browse', coll:'cards', ball:'news', grade:'submit' },
  mf:{ q:'', type:'all', fmt:'all', sort:'end', page:0 }, cf:{ q:'', f:'all', sort:'new', prod:'', page:0 },
  sheets:[], busy:false, booting:true, log:null, sound:true, pq:'' };
const ACT = {};
const VIEWS = {};
const $ = (s,r)=>(r||document).querySelector(s);
const ICONS = {
  home:'<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  shop:'<path d="M4 8h16l-1.5 12h-13z"/><path d="M8 8V6a4 4 0 0 1 8 0v2"/>',
  market:'<path d="M3 17l5-5 4 4 8-9"/><path d="M15 7h5v5"/>',
  coll:'<rect x="4" y="3" width="11" height="15" rx="1.5"/><path d="M18 6.5v13a1.5 1.5 0 0 1-1.5 1.5H8"/>',
  ball:'<circle cx="12" cy="12" r="9"/><path d="M6.3 5.3c2.2 2 2.2 11.4 0 13.4M17.7 5.3c-2.2 2-2.2 11.4 0 13.4"/>',
  grade:'<rect x="5" y="2.5" width="14" height="19" rx="2"/><path d="M8 7h8M8 10h5"/><rect x="8" y="13" width="8" height="5.5" rx="1"/>',
  gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  x:'<path d="M6 6l12 12M18 6L6 18"/>', back:'<path d="M15 5l-7 7 7 7"/>'
};
function icon(n, sz){ return `<svg viewBox="0 0 24 24" width="${sz||22}" height="${sz||22}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n]}</svg>`; }
const TABS = [['home','Home'],['shop','Shop'],['market','Market'],['coll','Collection'],['ball','Baseball'],['grade','Grading']];

function shell(){
  document.getElementById('app').innerHTML = `
  <header class="hdr"><div class="hdr-in">
    <div class="brand"><i></i><span>Card Collector</span></div>
    <nav class="hdr-nav" id="hnav"></nav>
    <div class="cash" id="hcash"></div>
    <div class="adv"><button class="btn pri" data-act="adv" data-a="1" title="Advance one day">Next day</button><button class="btn" data-act="adv" data-a="7" title="Advance a week">+7</button></div>
    <button class="iconbtn" data-act="settings" aria-label="Settings">${icon('gear',20)}</button>
  </div></header>
  <main id="view"></main>
  <nav class="nav"><div class="nav-in" id="bnav"></div></nav>
  <div class="toasts" id="toasts"></div>
  <div id="sheetroot"></div>`;
}
function badgeFor(t){
  if (t==='market'){ const n=myListings().reduce((a,l)=>a+l.offers.length,0) + outbidLive().length; return n; }
  if (t==='grade') return G.player.returned.filter(r=>!r.seen).length;
  if (t==='coll') return G.player.pending ? 1 : 0;
  return 0;
}
function updateHeader(){
  const d=dayToDate(G.day); const dn=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getUTCDay()];
  $('#hcash').innerHTML = `<b>${money(G.player.cash,true)}</b><small>${dn} ${fmtDate(G.day,true)}</small>`;
  const on=k=>UI.tab===k||(k==='shop'&&UI.tab==='ball')||(k==='coll'&&UI.tab==='grade'); const nav = TABS.map(([k,n])=>{ const b=badgeFor(k); return `<button class="${on(k)?'on':''}" data-act="tab" data-a="${k}">${icon(k)}<span>${n}</span>${b?`<span class="dot">${b>9?'9+':b}</span>`:''}</button>`; }).join('');
  $('#bnav').innerHTML = nav;
  $('#hnav').innerHTML = TABS.map(([k,n])=>{ const b=badgeFor(k); return `<button class="${on(k)?'on':''}" data-act="tab" data-a="${k}">${n}${b?`<span class="dot">${b>9?'9+':b}</span>`:''}</button>`; }).join('');
}
function render(keepScroll){
  const y = window.scrollY;
  $('#view').innerHTML = VIEWS[UI.tab]();
  updateHeader();
  if (keepScroll) window.scrollTo(0,y);
}
function refresh(){ render(true); refreshSheet(); }

// ---- sheets ----
function openSheet(fn, replace){ if (replace) UI.sheets.pop(); UI.sheets.push({fn}); renderSheet(); }
function closeSheet(all){ if (all) UI.sheets=[]; else UI.sheets.pop(); renderSheet(); }
function renderSheet(keep){
  const root=$('#sheetroot');
  if (!UI.sheets.length){ root.innerHTML=''; document.body.style.overflow=''; return; }
  const top=UI.sheets[UI.sheets.length-1];
  const old = root.querySelector('.sh-body'); const sy = keep&&old? old.scrollTop : 0;
  let res; try { res = top.fn(); } catch(e){ console.error(e); res = {t:'Unavailable', h:'<div class="empty">Something went wrong showing this.</div>'}; }
  if (!res) res = {t:'Gone', h:'<div class="empty">This item is no longer available.</div>'};
  root.innerHTML = `<div class="scrim" data-act="scrim"><div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(res.t)}">
    <div class="sh-top">${UI.sheets.length>1?`<button class="iconbtn" data-act="sheetback" aria-label="Back">${icon('back',20)}</button>`:''}<h2>${esc(res.t)}</h2><button class="iconbtn" data-act="sheetclose" aria-label="Close">${icon('x',20)}</button></div>
    <div class="sh-body">${res.h}</div></div></div>`;
  document.body.style.overflow='hidden';
  if (keep) root.querySelector('.sh-body').scrollTop = sy;
  if (res.after) res.after(root);
}
function refreshSheet(){ if (UI.sheets.length) renderSheet(true); }
ACT.sheetclose = ()=>closeSheet(true);
ACT.sheetback = ()=>closeSheet();
ACT.scrim = (a,el,e)=>{ if (e.target===el) closeSheet(true); };

// ---- toasts ----
function showToast(msg, good){
  if (UI.booting) return;
  if (UI.log){ UI.log.push([G.day,msg,good]); return; }
  const box=$('#toasts'); if (!box) return;
  const t=document.createElement('div'); t.className='toast'+(good?' good':''); t.textContent=msg; box.appendChild(t);
  while (box.children.length>3) box.firstChild.remove();
  setTimeout(()=>t.remove(), 3800);
}
toast = showToast;

// ---- events ----
document.addEventListener('click', e=>{
  const el=e.target.closest('[data-act]'); if (!el) return;
  const f=ACT[el.dataset.act]; if (!f) return;
  e.preventDefault(); f(el.dataset.a, el, e);
});
document.addEventListener('input', e=>{ const el=e.target.closest('[data-inp]'); if (el && ACT[el.dataset.inp]) ACT[el.dataset.inp](el.value, el, e); });
document.addEventListener('change', e=>{ const el=e.target.closest('[data-chg]'); if (el && ACT[el.dataset.chg]) ACT[el.dataset.chg](el.type==='checkbox'?el.checked:el.value, el, e); });
document.addEventListener('keydown', e=>{
  if (UI.open){ openerKey(e); return; }
  if (e.key==='Escape' && UI.sheets.length){ closeSheet(); }
});
ACT.tab = a=>{ UI.tab=a; closeSheet(true); render(); window.scrollTo(0,0); };
ACT.sub = (a)=>{ const [t,s]=a.split(':'); UI.sub[t]=s; render(); };
// two-tap confirm for spending money
function armed(el){ if (el.classList.contains('armed')) return true; el.classList.add('armed'); el.dataset.txt=el.textContent; el.textContent=el.dataset.confirm||'Tap again to confirm'; setTimeout(()=>{ if(el.isConnected){ el.classList.remove('armed'); el.textContent=el.dataset.txt; } },3500); return false; }

// ---- saving ----
let saveTimer=null;
function queueSave(){ clearTimeout(saveTimer); saveTimer=setTimeout(()=>saveGame(), 600); }
function afterAction(){ updateHeader(); queueSave(); }

// ---- time ----
ACT.adv = async (a)=>{
  if (UI.busy) return; UI.busy=true;
  const n=+a||1; UI.log=[];
  const ob0 = new Set(outbidLive().map(l=>l.id)); const off0 = myListings().reduce((s,l)=>s+l.offers.length,0);
  document.querySelectorAll('[data-act="adv"]').forEach(b=>b.disabled=true);
  try {
    for (let i=0;i<n;i++){ advanceDay(); if (n>1){ updateHeader(); await new Promise(r=>setTimeout(r,0)); } }
  } catch(e){ console.error(e); }
  const log=UI.log; UI.log=null; UI.busy=false;
  document.querySelectorAll('[data-act="adv"]').forEach(b=>b.disabled=false);
  const ob = outbidLive().filter(l=>!ob0.has(l.id)); const off = myListings().reduce((s,l)=>s+l.offers.length,0)-off0;
  if (ob.length) log.push([G.day, 'Outbid on '+ob.length+(ob.length>1?' auctions':' auction')+': '+ob.map(itemLabel).slice(0,2).join('; ')]);
  if (off>0) log.push([G.day, off+(off>1?' new offers':' new offer')+' on your listings']);
  refresh();
  if (log.length>3 || (n>1 && log.length)) openSheet(()=>({ t: n>1? 'Your week':'Today', h: `<div class="panel"><div class="rows">${log.map(x=>`<div class="newsrow"><div class="meta">${fmtDate(x[0])}</div><div>${esc(x[1])}</div></div>`).join('')}</div></div>` }));
  else log.forEach(x=>showToast(x[1], x[2]));
  queueSave();
};

// ---- shared data helpers ----
function myListings(){ return G.lst.filter(l=>l.sel===0); }
function outbidLive(){ return G.lst.filter(l=>l.ty==='auc' && l.bids.some(b=>b[0]===0) && l.lead!==0); }
function myCards(){ const out=[]; for (const id in G.cards){ const c=G.cards[id]; if (c.o===0) out.push(c); } return out; }
function mySealed(){ return Object.values(G.sealed).filter(s=>s.o===0); }
function daysLeft(l){ const n=l.en-G.day; return n<=1? 'Ends tonight' : n+' days left'; }
function skillLevel(){ const s=G.player.skill; return s>=25?3: s>=10?2: s>=3?1:0; }
const SKILL_NAMES=['Novice eye','Developing eye','Experienced eye','Sharp eye'];
function cardLine(d){ return d.prod.yr+' '+B(d.prod).name+' #'+d.cardNo; }
function cardName(c){ return pname(P(D(c.k).pid)); }
function serialTxt(c){ const d=D(c.k); return d.run && c.s ? c.s+'/'+d.run : ''; }
function gradeTxt(c){ return c.g>0 ? 'GCS '+c.g : c.g<0 ? 'At GCS' : 'Raw'; }
function tagsHTML(d, c){
  const t=[];
  if (d.rc) t.push('<span class="tag rc">RC</span>'); if (d.first) t.push('<span class="tag rc">1st</span>');
  if (d.auto) t.push('<span class="tag auto">Auto</span>'); if (d.relic) t.push('<span class="tag auto">Relic</span>');
  if (d.run) t.push(`<span class="tag num">${c&&c.s? c.s+'/'+d.run : '/'+d.run}</span>`); else if (d.parObj) t.push('<span class="tag">Parallel</span>');
  if (d.ins) t.push('<span class="tag">Insert</span>'); if (d.variation) t.push(`<span class="tag">${d.sec==='v'?'SP':'SSP'}</span>`); if (d.hisp) t.push('<span class="tag">High-number SP</span>'); if (d.caseHit) t.push('<span class="tag num">Case hit</span>');
  if (c && c.sg) t.push('<span class="tag auto">Signed in person</span>');
  if (c && c.g>0) t.push(`<span class="tag gr">GCS ${c.g}</span>`);
  return t.join('');
}
function rangeTxt(key, g, card){
  const r = estRange(key, g, card);
  if (r.limited) return `<span class="muted small">Limited sales data. Likely</span> ${fmtRange(r)}`;
  return fmtRange(r);
}
function miniCard(c){ return `<div class="mini ${c.g>0?'slab':''}">${c.g>0?slabSVG(c):cardFront(c.k,c.s)}</div>`; }
function miniKey(k){ return `<div class="mini">${cardFront(k,0)}</div>`; }
function miniSealed(s){ const prod=G.products[s.p]; return `<div class="mini">${packArt(prod, s.f)}</div>`; }
function saleRows(arr, showG){
  if (!arr.length) return '<div class="empty">No recorded sales.</div>';
  return `<table class="tbl"><tbody>${arr.map(s=>`<tr><td>${fmtDate(s[0])}</td><td class="r"><b>${money(s[1],true)}</b></td>${showG!==false?`<td class="r muted">${s[2]>0?'GCS '+s[2]:'Raw'}</td>`:''}</tr>`).join('')}</tbody></table>`;
}
function sparkSVG(pts, opts){
  opts=opts||{}; if (pts.length<2) return '';
  const W=320,H=opts.h||90, pad=opts.axis?28:4;
  const xs=pts.map(p=>p[0]), ys=pts.map(p=>p[1]);
  let x0=Math.min(...xs), x1=Math.max(...xs); if (x1===x0) x1=x0+1;
  let y0=Math.min(...ys), y1=Math.max(...ys); if (y1-y0<1e-6){ y0*=0.9; y1*=1.1; if(y1===y0){y1=y0+1;} }
  const X=x=>pad+(x-x0)/(x1-x0)*(W-pad-6), Y=y=>H-14-(y-y0)/(y1-y0)*(H-24);
  const d=pts.map((p,i)=>(i?'L':'M')+X(p[0]).toFixed(1)+' '+Y(p[1]).toFixed(1)).join(' ');
  const up = ys[ys.length-1]>=ys[0];
  const col = opts.col || (up?'var(--up)':'var(--down)');
  const dots = opts.dots? pts.map(p=>`<circle cx="${X(p[0]).toFixed(1)}" cy="${Y(p[1]).toFixed(1)}" r="2.6" fill="${col}"/>`).join('') : '';
  const ax = opts.axis? `<text x="2" y="${Y(y1)+4}" font-size="10" fill="var(--muted)">${money(y1)}</text><text x="2" y="${Y(y0)+4}" font-size="10" fill="var(--muted)">${money(y0)}</text><text x="${pad}" y="${H-1}" font-size="10" fill="var(--muted)">${fmtDate(x0)}</text><text x="${W-6}" y="${H-1}" font-size="10" fill="var(--muted)" text-anchor="end">${fmtDate(x1)}</text>` : '';
  return `<svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><line x1="${pad}" x2="${W-6}" y1="${H-14}" y2="${H-14}" stroke="var(--line)"/><path d="${d}" fill="none" stroke="${col}" stroke-width="2" stroke-linejoin="round"/>${dots}${ax}</svg>`;
}
function tip(key, html){
  if (G.player.tips[key]) return '';
  return `<div class="note"><button class="iconbtn x" data-act="tipx" data-a="${key}" aria-label="Dismiss">${icon('x',16)}</button>${html}</div>`;
}
ACT.tipx = a=>{ G.player.tips[a]=1; refresh(); queueSave(); };
function interestLabel(p){ const S=p.S; return S>0.95?'Hobby superstar': S>0.75?'Very high': S>0.55?'High': S>0.35?'Moderate': S>0.15?'Low':'Minimal'; }
function trendOf(p){ const h=p.hx; if (h.length<4) return ['Steady','']; const a=h[h.length-1][1], b=h[Math.max(0,h.length-11)][1]; const r=a/Math.max(b,0.0001); return r>1.18?['Rising','up']: r<0.85?['Cooling','down']:['Steady','']; }
function statusOf(p){ if (p.tm===-2) return 'Retired'+(p.ry?' ('+p.ry+')':''); if (p.tm===-1) return 'Prospect, '+teamName(p.org)+' system'; if (p.tm===-3) return 'Free agent'; return teamName(p.tm)+(p.inj>0?', injured list':''); }
function pLink(p){ return `<button class="linkbtn" data-act="player" data-a="${p.id}">${esc(pname(p))}</button>`; }
function pager(total, per, cur, act){ const n=Math.ceil(total/per); if (n<=1) return ''; return `<div class="pager"><button class="btn sm" data-act="${act}" data-a="${cur-1}" ${cur<=0?'disabled':''}>Previous</button><span class="muted small">Page ${cur+1} of ${n}</span><button class="btn sm" data-act="${act}" data-a="${cur+1}" ${cur>=n-1?'disabled':''}>Next</button></div>`; }

// ---- inspection (qualitative, skill-dependent) ----
const INS = {
  0:[[96,'Centering looks very close to 50/50.'],[91,'Centering is a touch off, roughly 55/45.'],[84,'Centering leans noticeably, around 60/40 %s.'],[74,'Clearly off-centre; the %s border is thin.'],[0,'Badly miscut; the %s border nearly disappears.']],
  1:[[96,'All four corners look sharp.'],[91,'One corner looks very slightly soft under close inspection.'],[84,'Light whitening on the %s corner.'],[74,'Soft corners with visible whitening.'],[0,'A dinged, rounded %s corner.']],
  2:[[96,'Edges are clean.'],[91,'A speck of whitening along the %s edge.'],[84,'Slight whitening along the %s edge.'],[74,'Chipping along the %s edge.'],[0,'Heavy edge wear all around.']],
  3:[[96,'Surface is clean, no marks visible.'],[91,'A faint surface mark catches the light when tilted.'],[84,'Light scratches visible when tilted.'],[74,'Scuffing across the surface.'],[0,'A crease runs through the card.']],
  4:[[96,'Print quality is crisp.'],[91,'A faint print line runs across the image.'],[84,'A few print dots in the background.'],[74,'Colour registration is slightly off.'],[0,'An obvious printing defect.']]
};
const SIDES=[['left to right','right to left','top to bottom'],['top-left','top-right','bottom-left','bottom-right'],['rear-left','top','bottom','rear-right'],['',''],['','']];
function rgauss(rng){ let u=0; while(u===0) u=rng(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*rng()); }
function inspect(card, photos){
  const lvl=skillLevel();
  const noise=(photos?5.5:3)*[1,0.72,0.5,0.34][lvl];
  const rng=mkRng(card.id*131+lvl*7+(photos?999:0));
  const obs=card.c.map(v=>clamp(v+rgauss(rng)*noise,20,100));
  const lines=[];
  for (let i=0;i<5;i++){
    if (photos && (i===3||i===4) && rng()<0.45){ lines.push(i===3?'Surface is hard to judge from the photos.':'Print detail is hard to judge from the photos.'); continue; }
    const band=INS[i].find(b=>obs[i]>=b[0]); const side=SIDES[i][Math.floor(rng()*SIDES[i].length)];
    lines.push(band[1].replace('%s', side));
  }
  let hunch='';
  if (lvl>=1){
    const mn=Math.min(...obs), avg=obs.reduce((a,b)=>a+b,0)/5; const s=mn*0.55+avg*0.45;
    const g=s>=95.3?10: s>=91.6?9: s>=87?8: s>=81?7: s>=72?6: s>=64?5: s>=55?4: 3;
    const spread = (photos?1:0) + (lvl===1?1:0);
    const lo=Math.max(1,g-spread), hi=Math.min(10,g+(lvl<3?1:0));
    hunch = lo===hi ? `Your read: this looks like a GCS ${lo}.` : `Your read: probably somewhere between GCS ${lo} and ${hi}.`;
  }
  return { lines, hunch };
}
function inspectHTML(card, photos){
  const r=inspect(card, photos);
  return `<ul class="inspect">${r.lines.map(l=>`<li>${esc(l)}</li>`).join('')}</ul>${r.hunch?`<div class="small"><b>${esc(r.hunch)}</b></div>`:`<div class="small muted">Grade a few cards and you'll start to get a feel for how GCS sees condition.</div>`}<div class="small muted">${SKILL_NAMES[skillLevel()]}${photos?', judging from seller photos':''}.</div>`;
}

// ---- audio ----
let AC=null;
function chime(big){
  if (!UI.sound) return;
  try {
    AC = AC || new (window.AudioContext||window.webkitAudioContext)();
    const t=AC.currentTime; const notes = big? [659.25, 987.77, 1318.5] : [783.99, 1174.66];
    notes.forEach((f,i)=>{ const o=AC.createOscillator(), g=AC.createGain(); o.type='sine'; o.frequency.value=f; g.gain.setValueAtTime(0.0001,t+i*0.09); g.gain.exponentialRampToValueAtTime(0.12,t+i*0.09+0.02); g.gain.exponentialRampToValueAtTime(0.0001,t+i*0.09+1.1); o.connect(g).connect(AC.destination); o.start(t+i*0.09); o.stop(t+i*0.09+1.2); });
  } catch(e){}
}
function tearSound(){
  if (!UI.sound) return;
  try { AC = AC || new (window.AudioContext||window.webkitAudioContext)(); const n=AC.sampleRate*0.25, b=AC.createBuffer(1,n,AC.sampleRate), d=b.getChannelData(0); for (let i=0;i<n;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/n,2)*(0.6+0.4*Math.sin(i/40)); const s=AC.createBufferSource(); s.buffer=b; const f=AC.createBiquadFilter(); f.type='highpass'; f.frequency.value=1800; const g=AC.createGain(); g.gain.value=0.18; s.connect(f).connect(g).connect(AC.destination); s.start(); } catch(e){}
}

// ===================== HOME =====================
function collectionTotals(){
  const t={ raw:[0,0], gr:[0,0], sealed:[0,0], listed:[0,0], nRaw:0, nGr:0, nSealed:0, nListed:0 };
  for (const c of myCards()){
    const r=estRange(c.k, c.g>0?c.g:0, c); const bucket = c.l? 'listed' : c.g>0? 'gr' : 'raw';
    t[bucket][0]+=r.lo; t[bucket][1]+=r.hi; t['n'+(bucket==='gr'?'Gr':bucket==='raw'?'Raw':'Listed')]++;
  }
  for (const s of mySealed()){ const r=estRange(sealedKey(G.products[s.p],s.f)); const b=s.l?'listed':'sealed'; t[b][0]+=r.lo; t[b][1]+=r.hi; if (s.l) t.nListed++; else t.nSealed++; }
  t.total=[t.raw[0]+t.gr[0]+t.sealed[0]+t.listed[0], t.raw[1]+t.gr[1]+t.sealed[1]+t.listed[1]];
  return t;
}
function rng2(a){ return a[1]<0.5? '$0' : money(nicePrice(a[0]))+'–'+money(nicePrice(a[1])); }
function feedLabel(key){ if (key[0]==='S'){ const [,pid,f]=key.split('|'); return [prodName(G.products[+pid]), FMT_NAME[f]]; } const d=D(key); return [pname(P(d.pid)), d.prod.yr+' '+B(d.prod).short+' '+d.title]; }
VIEWS.home = ()=>{
  const T=collectionTotals();
  const pend=G.player.pending;
  const up=G.products.filter(p=>!p.cl && p.rel>G.day).sort((a,b)=>a.rel-b.rel)[0];
  const alerts=[];
  const offers=myListings().filter(l=>l.offers.length);
  offers.forEach(l=>alerts.push(`<button class="row" data-act="listing" data-a="${l.id}"><div class="rt"><b>${l.offers.length} offer${l.offers.length>1?'s':''} on ${esc(itemLabel(l))}</b><span>Best: ${money(Math.max(...l.offers.map(o=>o.amt)),true)} against your ${money(l.pr,true)}</span></div></button>`));
  outbidLive().forEach(l=>alerts.push(`<button class="row" data-act="listing" data-a="${l.id}"><div class="rt"><b>Outbid: ${esc(itemLabel(l))}</b><span>Now ${money(l.cur,true)}, ${daysLeft(l).toLowerCase()}</span></div></button>`));
  const newG=G.player.returned.filter(r=>!r.seen);
  newG.forEach(r=>{ const c=C(r.cid); if (c) alerts.push(`<button class="row" data-act="card" data-a="${c.id}">${miniCard(c)}<div class="rt"><b>Back from GCS: ${esc(cardName(c))}</b><span>GCS ${r.g} ${GRADE_NAMES[r.g]}</span></div></button>`); });
  const feed=G.feed.filter(f=>f[0]>=G.day-4).slice().sort((a,b)=>b[2]-a[2]).slice(0,6);
  const watch=G.player.watch.map(L).filter(Boolean).slice(0,5);
  const news=G.news.slice(0,7);
  return `<div class="stack">
  ${tip('home', `<b>Welcome to the hobby.</b> ${(G.player.pay||0)>0? 'Hobby money arrives every Friday ('+money(G.player.pay)+').' : 'There is no allowance, so what you spend has to come from what you sell.'} Rip packs under <b>Cards</b>, dig the bins and card shows in the <b>Hunt</b>, find singles in the <b>Market</b>, and press <b>Next day</b> to move time forward: auctions end, grading comes back, games get played and prices react.`)}
  <div class="kpis">
    <div class="kpi"><small>Cash</small><b>${money(G.player.cash,true)}</b></div>
    <div class="kpi"><small>Collection estimate</small><b>${rng2(T.total)}</b></div>
    <div class="kpi"><small>Cards owned</small><b>${T.nRaw+T.nGr+ (myCards().filter(c=>c.l).length)}</b></div>
    <div class="kpi"><small>Listed for sale</small><b>${myListings().length}</b></div>
  </div>
  ${pend?`<div class="panel"><div class="phead"><h3>Unfinished rip</h3></div><p class="small muted" style="margin:0 0 8px">${esc(prodName(G.products[pend.p]))} ${FMT_NAME[pend.f].toLowerCase()}, pack ${pend.pi+1} of ${pend.packs.length}. The cards are already yours; you just haven't looked yet.</p><button class="btn pri" data-act="resume">Keep opening</button></div>`:''}
  <div class="cols">
    <div class="stack">
      ${alerts.length?`<div class="panel"><div class="phead"><h3>Needs your attention</h3></div><div class="rows">${alerts.join('')}</div></div>`:''}
      <div class="panel"><div class="phead"><h3>Hobby and baseball news</h3><button class="linkbtn" data-act="goto" data-a="ball:news">All news</button></div>
        ${news.map(newsRow).join('')||'<div class="empty">Quiet day.</div>'}</div>
    </div>
    <div class="stack">
      ${up?`<div class="panel"><div class="phead"><h3>Next release</h3><button class="linkbtn" data-act="goto" data-a="shop">Schedule</button></div><button class="prod row" data-act="product" data-a="${up.id}"><div class="art">${packArt(up,'pack')}</div><div class="rt"><b>${esc(prodName(up))}</b><span>${fmtDate(up.rel)}, in ${up.rel-G.day} day${up.rel-G.day>1?'s':''}</span><span>${esc(B(up).blurb)}</span></div></button></div>`:''}
      <div class="panel"><div class="phead"><h3>Big sales this week</h3><button class="linkbtn" data-act="goto" data-a="market:sales">More</button></div>
        <div class="rows">${feed.map(f=>{ const [a,b]=feedLabel(f[1]); return `<button class="row" data-act="${f[1][0]==='S'?'product':'design'}" data-a="${f[1][0]==='S'?f[1].split('|')[1]:f[1]}">${f[1][0]==='S'?'':miniKey(f[1])}<div class="rt"><b>${esc(a)}</b><span>${esc(b)}${f[3]>0?', GCS '+(f[1][0]==='M'?gTxt(f[3]):f[3]):''}</span></div><div class="rv"><b>${money(f[2],true)}</b><span>${fmtDate(f[0])}</span></div></button>`; }).join('')||'<div class="empty">No notable sales yet.</div>'}</div></div>
      ${watch.length?`<div class="panel"><div class="phead"><h3>Watching</h3><button class="linkbtn" data-act="goto" data-a="market:watch">All</button></div><div class="rows">${watch.map(listingRow).join('')}</div></div>`:''}
      ${G.player.subs.length?`<div class="panel"><div class="phead"><h3>At GCS</h3><button class="linkbtn" data-act="goto" data-a="grade">Grading</button></div><div class="rows">${G.player.subs.map(s=>{ const c=C(s.cid); return `<button class="row" data-act="card" data-a="${c.id}">${miniCard(c)}<div class="rt"><b>${esc(cardName(c))}</b><span>Due back ${fmtDate(s.t1)}</span></div></button>`; }).join('')}</div></div>`:''}
    </div>
  </div></div>`;
};
function newsRow(n){
  const p = n.p!=null ? P(n.p) : null;
  return `<div class="newsrow"><b>${esc(n.h)}</b><p>${esc(n.b)}</p><div class="meta">${fmtDate(n.t)}${p?` <span aria-hidden="true">|</span> ${pLink(p)}`:''}</div></div>`;
}
ACT.goto = a=>{ const [t,s]=a.split(':'); UI.tab=t; if (s) UI.sub[t]=s; closeSheet(true); render(); window.scrollTo(0,0); };

// ===================== SHOP =====================
function formatLine(prod, f){ const F=B(prod).formats[f]; return F.packs>1 ? `${F.packs} packs of ${F.cards}` : `${F.cards} cards`; }
VIEWS.shop = ()=>{
  const inStore=G.products.filter(inRetail).sort((a,b)=>b.rel-a.rel);
  const soon=G.products.filter(p=>!p.cl && p.rel>G.day).sort((a,b)=>a.rel-b.rel);
  const oop=G.products.filter(p=>p.cl && G.day>=p.retailEnd).sort((a,b)=>b.rel-a.rel);
  const mine=mySealed().filter(s=>!s.l);
  return `<div class="stack">
  ${tip('shop', `Retail product costs what it costs. Expected card value is usually <b>below</b> the price of the pack, so ripping is a gamble. Sealed product is also inventory: it can sell out, leave shelves, and gain or lose value on the secondary market.`)}
  ${mine.length?`<div class="panel"><div class="phead"><h3>Ready to open</h3><button class="linkbtn" data-act="goto" data-a="coll:sealed">Sealed inventory</button></div><div class="rows">${mine.slice(0,6).map(s=>{ const prod=G.products[s.p]; return `<div class="row" data-act="sealed" data-a="${s.id}">${miniSealed(s)}<div class="rt"><b>${esc(prodName(prod))}</b><span>${FMT_NAME[s.f]}</span></div><button class="btn pri sm" data-act="opensealed" data-a="${s.id}">Open</button></div>`; }).join('')}</div></div>`:''}
  <div class="panel"><div class="phead"><h3>On the shelf</h3></div>
  ${inStore.map(prod=>{ const br=B(prod); return `<div style="padding:10px 0;border-top:1px solid var(--line2)">
    <button class="prod row" style="border:0;padding:0" data-act="product" data-a="${prod.id}"><div class="art">${packArt(prod,'pack')}</div><div class="rt"><b style="font-family:var(--hd);font-size:20px">${esc(prodName(prod))}</b><span>Released ${fmtDate(prod.rel)}, on shelves until ${fmtDate(prod.retailEnd)}</span><span>${esc(br.blurb)}</span></div></button>
    <div class="fmts">${Object.keys(br.formats).map(f=>{ const F=br.formats[f]; const st=prod.stock[f]; return `<div class="fmt"><div class="ft"><b>${FMT_NAME[f]} <span class="num">${money(F.price)}</span></b><span>${formatLine(prod,f)}${F.g?', guaranteed '+guarText(F.g):''}. ${st<=0?'<span class="down">Sold out</span>': st<12?`<span class="down">Only ${st} left</span>`:`${st} in stock`}</span></div><button class="btn ${st>0?'pri':''} sm" data-act="buyretail" data-a="${prod.id}:${f}" data-confirm="Pay ${money(F.price)}" ${st<=0||G.player.cash<F.price?'disabled':''}>Buy</button></div>`; }).join('')}</div>
  </div>`; }).join('') || '<div class="empty">Nothing on shelves right now.</div>'}
  </div>
  <div class="cols">
    <div class="panel"><div class="phead"><h3>Release calendar</h3></div><div class="rows">${soon.map(prod=>`<button class="row" data-act="product" data-a="${prod.id}"><div class="rt"><b>${esc(prodName(prod))}</b><span>${esc(B(prod).blurb)}</span></div><div class="rv"><b>${fmtDate(prod.rel)}</b><span>${prod.rel-G.day} days</span></div></button>`).join('')||'<div class="empty">Next year\'s schedule is announced December 1.</div>'}</div></div>
    <div class="panel"><div class="phead"><h3>Off the shelves</h3></div><p class="small muted" style="margin:0 0 6px">No longer at retail. Sealed copies only trade on the marketplace now.</p><div class="rows">${oop.slice(0,14).map(prod=>{ const n=G.lst.filter(l=>l.it==='s'&&G.sealed[l.ref].p===prod.id).length; return `<button class="row" data-act="product" data-a="${prod.id}"><div class="rt"><b>${esc(prodName(prod))}</b><span>${n? n+' sealed listing'+(n>1?'s':'')+' on the market':'No sealed listings right now'}</span></div></button>`; }).join('')}</div></div>
  </div></div>`;
};
function guarText(g){ const a=[]; if (g.auto) a.push(g.auto+' autograph'+(g.auto>1?'s':'')); if (g.num) a.push(g.num+' numbered parallel'); return a.join(' and '); }
ACT.buyretail = (a,el)=>{
  if (!armed(el)) return;
  const [pid,f]=a.split(':'); const err=buyRetail(+pid,f);
  if (err) showToast(err); else { showToast('Added to your sealed inventory: '+prodName(G.products[+pid])+' '+FMT_NAME[f].toLowerCase(), true); }
  refresh(); afterAction();
};
function oddsRows(prod, fmt){
  const br=B(prod), F=br.formats[fmt]; const m=F.retail?RETAIL_HIT_MULT:1; const rows=[];
  const o=n=>'1:'+Math.round(n).toLocaleString('en-US');
  if (br.luxe){ rows.push(['Every pack','3 on-card autographs, 1 patch relic /99, 2 base cards /199']); br.par.forEach(p=>rows.push([p.n+' parallel /'+p.run, o(p.odds)+' base cards'])); br.auto.par.forEach(p=>rows.push(['Autograph '+p.n+' /'+p.run, 'about '+(p.share*100).toFixed(1)+'% of autos'])); return rows; }
  br.par.forEach(p=>rows.push([p.n+(p.run?' /'+p.run:'')+' parallel', o(p.odds)]));
  br.ins.forEach(i=>rows.push([i.n+' insert', o(i.odds)]));
  if (br.sp){ rows.push(['SP image variation', o(br.sp.odds)]); rows.push(['SSP image variation', o(br.sp.ssp)]); }
  if (br.hiSP) rows.push(['High-number short print', '1:3']);
  if (br.auto) rows.push([br.auto.n, o(br.auto.odds*m)]);
  if (br.auto) br.auto.par.forEach(p=>rows.push(['  '+p.n+' auto /'+p.run, 'about '+(p.share*100).toFixed(1)+'% of autos']));
  if (br.relic) rows.push([br.relic.n, o(br.relic.odds*m)]);
  if (br.caseHit) rows.push([br.caseHit.n+' (case hit)', o(br.caseHit.odds*m)]);
  return rows;
}
function productSheet(pid){
  const prod=G.products[pid]; const br=B(prod);
  const fmts=Object.keys(br.formats);
  const retail=inRetail(prod);
  let checklist='<div class="empty">Checklist revealed on release day.</div>';
  if (prod.cl){
    const rcs=prod.cl.base.map((e,i)=>[e,i]).filter(x=>x[0][1]&3).slice(0,60);
    checklist = `<p class="small" style="margin:0 0 6px">${prod.cl.base.length} base cards, ${prod.cl.base.filter(e=>e[1]&1).length} rookies${br.pros?', '+prod.cl.base.filter(e=>e[1]&2).length+' first-card prospects':''}. ${br.ins.length?'Inserts: '+br.ins.map(i=>i.n+' ('+i.size+')').join(', ')+'. ':''}${br.auto?br.auto.n+': '+prod.cl.auto.length+' signers. ':''}${br.relic?br.relic.n+': '+prod.cl.relic.length+' players. ':''}${br.caseHit?br.caseHit.n+': '+prod.cl.caseHit.length+' cards.':''}</p>
    <div class="small"><b>Rookies and first cards</b></div><div class="small" style="columns:2;column-gap:14px">${rcs.map(([e,i])=>`<div>#${i+1} <button class="linkbtn" data-act="player" data-a="${e[0]}">${esc(pname(P(e[0])))}</button> ${e[1]&1?'RC':'1st'}</div>`).join('')}</div>`;
  }
  const sk=fmts.map(f=>{ const k=sealedKey(prod,f); const s=(G.sales[k]||[]).slice(0,5); const n=G.lst.filter(l=>l.it==='s'&&G.sealed[l.ref].p===prod.id&&G.sealed[l.ref].f===f).length;
    return prod.cl && (s.length||n||!retail)? `<div style="margin-top:8px"><b>${FMT_NAME[f]}</b> <span class="muted small">market estimate ${fmtRange(estRange(k))}${n?', '+n+' listed':''}</span>${s.length?saleRows(s,false):''}</div>` : ''; }).join('');
  return { t: prodName(prod), h: `<div class="stack">
    <div class="prod"><div class="art" style="width:90px">${packArt(prod,'pack')}</div><div><div class="small muted">${prod.cl?'Released '+fmtDate(prod.rel,true):'Releases '+fmtDate(prod.rel,true)}</div><p style="margin:4px 0">${esc(br.blurb)}</p>${prod.cl?`<div class="small muted">${retail?'At retail until '+fmtDate(prod.retailEnd):'No longer at retail'}</div>`:''}</div></div>
    ${fmts.map(f=>{ const F=br.formats[f]; const st=prod.stock[f]; return `<div class="fmt"><div class="ft"><b>${FMT_NAME[f]} ${money(F.price)}</b><span>${formatLine(prod,f)}${F.g?', guaranteed '+guarText(F.g):''}${retail? (st<=0?'. Sold out':'. '+st+' in stock'):''}</span></div>${retail?`<button class="btn pri sm" data-act="buyretail" data-a="${prod.id}:${f}" data-confirm="Pay ${money(F.price)}" ${st<=0||G.player.cash<F.price?'disabled':''}>Buy</button>`:`<button class="btn sm" data-act="findsealed" data-a="${prod.id}">Market</button>`}</div>`; }).join('')}
    <div class="panel"><h3>Odds</h3><p class="small muted" style="margin:0 0 6px">Published per pack. ${br.formats.hobby&&!br.luxe?'Hobby box guarantees are added on top of normal pack odds. ':''}${Object.values(br.formats).some(f=>f.retail)&&br.auto?'Autographs, relics and case hits are rarer in retail formats (shown: '+(br.formats.hobby?'hobby':'retail')+').':''}</p>
      <table class="tbl"><tbody>${oddsRows(prod, br.formats.hobby?'hobby':fmts[0]).map(r=>`<tr><td>${esc(r[0])}</td><td class="r">${esc(r[1])}</td></tr>`).join('')}</tbody></table></div>
    <div class="panel"><h3>Checklist</h3>${checklist}</div>
    ${sk?`<div class="panel"><h3>Sealed market</h3>${sk}</div>`:''}
  </div>` };
}
ACT.product = a=>openSheet(()=>productSheet(+a));
ACT.findsealed = a=>{ const prod=G.products[+a]; UI.mf={ q:prod.yr+' '+B(prod).short, type:'sealed', fmt:'all', sort:'low', page:0 }; ACT.goto('market:browse'); };

// ===================== MARKET =====================
const LSCACHE=new Map();
function lsText(l){
  let s=LSCACHE.get(l.id); if (s) return s;
  if (l.it==='s'){ const sd=G.sealed[l.ref]; const prod=G.products[sd.p]; s=(prodName(prod)+' '+B(prod).short+' '+FMT_NAME[sd.f]+' sealed').toLowerCase(); }
  else { const c=C(l.ref), d=D(c.k), p=P(d.pid); s=(pname(p)+' '+d.prod.yr+' '+B(d.prod).name+' '+d.title+' '+d.setName+' '+teamName(p.tm>=0?p.tm:p.org)+' '+teamAbbr(p.tm)+' '+p.pos+(d.rc?' rc rookie':'')+(d.auto?' auto autograph':'')+(c.g>0?' gcs '+c.g:'')).toLowerCase(); }
  LSCACHE.set(l.id,s); return s;
}
function listingRow(l){
  const it=l.it==='s'; let th, a, b;
  if (it){ const s=G.sealed[l.ref]; const prod=G.products[s.p]; th=miniSealed(s); a=prodName(prod); b=FMT_NAME[s.f]+', sealed'; }
  else { const c=C(l.ref), d=D(c.k); th=miniCard(c); a=cardName(c); b=[d.prod.yr+' '+B(d.prod).short+' '+d.title, serialTxt(c), c.g>0?'GCS '+c.g:'', d.rc?'RC':''].filter(Boolean).join(', '); }
  const mine=l.sel===0; const lead=l.lead===0 && l.bids.length;
  const right = l.ty==='auc'
    ? `<b>${money(l.cur,true)}</b><span>${l.bids.length} bid${l.bids.length===1?'':'s'}, ${daysLeft(l).replace('Ends ','').replace(' left','')}</span>`
    : `<b>${money(l.pr,true)}</b><span>${mine?(l.offers.length?l.offers.length+' offer'+(l.offers.length>1?'s':''):'Your listing'):'Buy now'+(l.off?' or offer':'')}</span>`;
  return `<button class="row" data-act="listing" data-a="${l.id}">${th}<div class="rt"><b>${esc(a)}</b><span>${esc(b)}</span>${lead?'<span class="up">You\'re the high bidder</span>':(l.ty==='auc'&&l.bids.some(x=>x[0]===0)?'<span class="down">Outbid</span>':'')}</div><div class="rv">${right}</div></button>`;
}
function marketFiltered(){
  const f=UI.mf; const q=f.q.trim().toLowerCase(); const words=q?q.split(/\s+/):[];
  let a=G.lst.filter(l=>l.sel!==0 || f.type==='mine');
  a=a.filter(l=>{
    if (f.fmt!=='all' && l.ty!==f.fmt) return false;
    if (f.type==='sealed'){ if (l.it!=='s') return false; }
    else if (f.type!=='all'){ if (l.it!=='c') return false; const c=C(l.ref), d=D(c.k);
      if (f.type==='raw' && c.g>0) return false; if (f.type==='graded' && !(c.g>0)) return false; if (f.type==='rc' && !(d.rc||d.first)) return false;
      if (f.type==='auto' && !d.auto) return false; if (f.type==='num' && !d.run) return false; if (f.type==='cheap' && l.pr>5 && l.cur>5) return false; }
    if (words.length){ const s=lsText(l); for (const w of words) if (!s.includes(w)) return false; }
    return true;
  });
  const price=l=>l.ty==='auc'?l.cur:l.pr;
  if (f.sort==='end') a.sort((x,y)=>(x.ty==='auc'?x.en:1e9)-(y.ty==='auc'?y.en:1e9) || y.st-x.st);
  else if (f.sort==='new') a.sort((x,y)=>y.st-x.st||y.id-x.id);
  else if (f.sort==='low') a.sort((x,y)=>price(x)-price(y));
  else if (f.sort==='high') a.sort((x,y)=>price(y)-price(x));
  else if (f.sort==='bids') a.sort((x,y)=>y.bids.length-x.bids.length);
  return a;
}
VIEWS.market = ()=>{
  const s=UI.sub.market;
  const tabs=[['browse','Browse'],['watch','Watching'],['sell','Selling'],['sales','Recent sales']];
  let body='';
  if (s==='browse'){
    const f=UI.mf; const all=marketFiltered(); const per=30; const page=Math.min(f.page, Math.max(0,Math.ceil(all.length/per)-1));
    const chip=(k,n)=>`<button class="chip ${f.type===k?'on':''}" data-act="mft" data-a="${k}">${n}</button>`;
    body=`${tip('market', `Every listing here belongs to another collector with their own taste and budget, and some of them misjudge value. Prices are theirs, not the game's. Check recent sales and comparable parallels before you pay up. Sales carry a 10% marketplace fee for the seller.`)}
    <div class="tools"><input class="inp grow" type="search" placeholder="Player, team, product, parallel..." value="${esc(f.q)}" data-inp="mfq" aria-label="Search listings">
      <select class="inp" data-chg="mfsort" aria-label="Sort">${[['end','Ending soon'],['new','Newly listed'],['low','Price: low to high'],['high','Price: high to low'],['bids','Most bids']].map(([k,n])=>`<option value="${k}" ${f.sort===k?'selected':''}>${n}</option>`).join('')}</select>
      <div class="seg">${[['all','All'],['bin','Buy now'],['auc','Auctions']].map(([k,n])=>`<button class="${f.fmt===k?'on':''}" data-act="mff" data-a="${k}">${n}</button>`).join('')}</div></div>
    <div class="chips" style="margin-bottom:10px">${chip('all','Everything')}${chip('raw','Raw')}${chip('graded','Graded')}${chip('rc','Rookies')}${chip('auto','Autographs')}${chip('num','Numbered')}${chip('sealed','Sealed')}${chip('cheap','Under $5')}</div>
    <div class="panel"><div class="small muted" style="margin-bottom:4px">${all.length} listing${all.length===1?'':'s'}</div><div class="rows" id="mrows">${all.slice(page*per,page*per+per).map(listingRow).join('')||'<div class="empty">Nothing matches. Try fewer words.</div>'}</div>${pager(all.length,per,page,'mpage')}</div>`;
  } else if (s==='watch'){
    const w=G.player.watch.map(L).filter(Boolean); G.player.watch=w.map(l=>l.id);
    const bidding=G.lst.filter(l=>l.ty==='auc'&&l.bids.some(b=>b[0]===0)&&!G.player.watch.includes(l.id));
    body=`<div class="panel"><div class="rows">${w.concat(bidding).map(listingRow).join('')||'<div class="empty">Tap Watch on any listing to follow it here. Auctions you bid on appear automatically.</div>'}</div></div>`;
  } else if (s==='sell'){
    const mine=myListings();
    body=`${tip('sell', `List cards from your <b>Collection</b>. Buy-now listings sell when a collector values the card above your price; auctions let buyers compete; offers let you negotiate. Nothing sells instantly: hot, cheap cards move in days, rare expensive ones can sit for weeks.`)}
    <div class="kpis"><div class="kpi"><small>Active listings</small><b>${mine.length}</b></div><div class="kpi"><small>Lifetime sales</small><b>${money(G.player.sold)}</b></div><div class="kpi"><small>Fees paid</small><b>${money(G.player.fees)}</b></div><div class="kpi"><small>Lifetime purchases</small><b>${money(G.player.bought)}</b></div></div>
    <div class="panel" style="margin-top:14px"><div class="rows">${mine.map(listingRow).join('')||'<div class="empty">You have nothing listed.</div>'}</div></div>
    ${G.player.soldCards.length?`<div class="panel" style="margin-top:14px"><h3>Recently sold</h3><div class="rows">${G.player.soldCards.slice(-12).reverse().map(id=>{ const c=C(id); if(!c) return ''; const h=(c.h||[]).filter(x=>x[1]==='Sold').pop(); return `<button class="row" data-act="design" data-a="${c.k}">${miniCard(c)}<div class="rt"><b>${esc(cardName(c))}</b><span>${h?'to '+esc(h[3])+', '+fmtDate(h[0]):''}</span></div><div class="rv"><b>${h?money(h[2],true):''}</b></div></button>`; }).join('')}</div></div>`:''}`;
  } else {
    const feed=G.feed.slice(0,60);
    body=`<div class="panel"><p class="small muted" style="margin:0 0 6px">Notable completed sales across the hobby, newest first.</p><div class="rows">${feed.map(f=>{ const [a,b]=feedLabel(f[1]); const who = f[4]===0?'You bought':f[5]===0?'You sold':''; return `<button class="row" data-act="${f[1][0]==='S'?'product':'design'}" data-a="${f[1][0]==='S'?f[1].split('|')[1]:f[1]}">${f[1][0]==='S'?'':miniKey(f[1])}<div class="rt"><b>${esc(a)}</b><span>${esc(b)}${f[3]>0?', GCS '+(f[1][0]==='M'?gTxt(f[3]):f[3]):''}${who?', '+who.toLowerCase():''}</span></div><div class="rv"><b>${money(f[2],true)}</b><span>${fmtDate(f[0])}</span></div></button>`; }).join('')}</div></div>`;
  }
  return `<div class="pagetitle"><h1>Marketplace</h1><span class="muted small">${G.lst.length} live listings</span></div>
  <div class="subtabs">${tabs.map(([k,n])=>`<button class="${s===k?'on':''}" data-act="sub" data-a="market:${k}">${n}</button>`).join('')}</div>${body}`;
};
let mfqT=null;
ACT.mfq = v=>{ UI.mf.q=v; UI.mf.page=0; clearTimeout(mfqT); mfqT=setTimeout(()=>{ const el=$('#mrows'); if (!el) return; const all=marketFiltered(); el.innerHTML=all.slice(0,30).map(listingRow).join('')||'<div class="empty">Nothing matches. Try fewer words.</div>'; const pnl=el.parentNode; const pg=pnl.querySelector('.pager'); if (pg) pg.remove(); pnl.insertAdjacentHTML('beforeend', pager(all.length,30,0,'mpage')); pnl.querySelector('.small').textContent=all.length+' listing'+(all.length===1?'':'s'); }, 180); };
ACT.mfsort = v=>{ UI.mf.sort=v; UI.mf.page=0; render(true); };
ACT.mff = a=>{ UI.mf.fmt=a; UI.mf.page=0; render(true); };
ACT.mft = a=>{ UI.mf.type=a; UI.mf.page=0; if (a==='sealed'&&UI.mf.sort==='end') UI.mf.sort='low'; render(true); };
ACT.mpage = a=>{ UI.mf.page=+a; render(); window.scrollTo(0,0); };

// ---- comparables & sales for a design ----
function siblings(d){
  const br=B(d.prod); let list=[];
  if (d.sec==='b') list=[''].concat(br.par.map(p=>p.id));
  else if (d.sec==='a') list=[''].concat(br.auto.par.map(p=>p.id));
  else return [];
  return list.map(par=>dk(d.prod,d.sec,d.no,par));
}
function compsHTML(d){
  const sib=siblings(d); if (sib.length<2) return '';
  const rows=sib.map(k=>{ const e=D(k); const s=(G.sales[k]||[]); const last=s[0]; const n=G.lst.filter(l=>l.it==='c'&&C(l.ref).k===k).length;
    return `<tr class="${k===d.key?'hl':''}" data-act="design" data-a="${k}" style="cursor:pointer"><td>${esc(e.parObj?e.parObj.n:'Base')}${e.run?' /'+e.run:''}</td><td class="r">${last?money(last[1],true)+'<span class="muted small"> '+(last[2]>0?'GCS '+last[2]:'raw')+', '+fmtDate(last[0])+'</span>':'<span class="muted">No sales</span>'}</td><td class="r muted">${s.length} sold${n?', '+n+' listed':''}</td></tr>`; }).join('');
  return `<div class="panel"><h3>Same card, other versions</h3><p class="small muted" style="margin:0 0 6px">Last sale of each parallel. Useful when a version has never sold.</p><div class="tblwrap"><table class="tbl"><tbody>${rows}</tbody></table></div></div>`;
}
function salesPanel(key, g, title){
  const s=salesFor(key, g).slice(0,12); const all=(G.sales[key]||[]);
  const chartPts=salesFor(key,g).slice(0,18).reverse().map(x=>[x[0],x[1]]);
  return `<div class="panel"><h3>${title||'Recent sales'}</h3>${chartPts.length>=3?sparkSVG(chartPts,{axis:true,dots:true,h:110}):''}${s.length?saleRows(s):`<div class="empty">No sales at this grade.${all.length?' Other grades: '+all.slice(0,4).map(x=>money(x[1],true)+' ('+(x[2]>0?'GCS '+x[2]:'raw')+')').join(', '):''}</div>`}</div>`;
}
function popHTML(key){ const p=popOf(key); const tot=p.reduce((a,b)=>a+b,0); if (!tot) return '<span class="muted small">No copies graded yet.</span>'; return `<table class="tbl"><tbody>${[10,9,8,7,6,5].filter(g=>p[g]).map(g=>`<tr><td>GCS ${g} ${GRADE_NAMES[g]}</td><td class="r">${p[g]}</td></tr>`).join('')}${p.slice(1,5).some(x=>x)?`<tr><td>GCS 1 to 4</td><td class="r">${p[1]+p[2]+p[3]+p[4]}</td></tr>`:''}<tr><td><b>Total graded</b></td><td class="r"><b>${tot}</b></td></tr></tbody></table>`; }
function bigCardHTML(c, key){
  const k=c?c.k:key; const s=c?c.s:0;
  const face = c && c.g>0 ? slabSVG(c) : cardFront(k,s);
  return `<div class="bigcard"><div class="face ${c&&c.g>0?'slab':''}" id="bigface" data-front="1">${face}</div><div class="under"><button class="btn sm" data-act="flipbig" data-a="${esc(k)}|${s}|${c?c.id:''}">Flip</button></div></div>`;
}
ACT.flipbig = (a)=>{ const [p0,p1,p2,p3,s,cid]=a.split('|'); const k=[p0,p1,p2,p3].join('|'); const el=$('#bigface'); if (!el) return; const c=cid?C(+cid):null;
  if (el.dataset.front==='1'){ el.innerHTML=cardBack(k,+s); el.dataset.front='0'; el.classList.remove('slab'); } else { el.innerHTML = c&&c.g>0? slabSVG(c) : cardFront(k,+s); el.dataset.front='1'; if (c&&c.g>0) el.classList.add('slab'); } };

function listingSheet(lid){
  const l=L(lid); if (!l) return null;
  const mine=l.sel===0; const watch=G.player.watch.includes(l.id);
  let head, cond='', extra='', title;
  if (l.it==='s'){
    const s=G.sealed[l.ref]; const prod=G.products[s.p]; const k=sealedKey(prod,s.f); title=prodName(prod);
    head=`<div class="bigcard"><div class="face">${packArt(prod,s.f)}</div></div>`;
    cond=`<div class="title-block"><div class="yr">Sealed ${FMT_NAME[s.f].toLowerCase()}, ${formatLine(prod,s.f)}</div><h1>${esc(prodName(prod))}</h1></div>
      <dl class="kv"><dt>Seller</dt><dd>${esc(ownerName(l.sel))}</dd><dt>Market estimate</dt><dd class="est">${fmtRange(estRange(k))}</dd><dt>At retail</dt><dd>${inRetail(prod)?'Yes, '+money(B(prod).formats[s.f].price)+(prod.stock[s.f]<=0?' (sold out)':''):'No longer'}</dd></dl>
      <button class="linkbtn" data-act="product" data-a="${prod.id}">Product details and odds</button>`;
    extra=salesPanel(k,null,'Recent sealed sales');
  } else if (l.it==='m'||isCardGameKind(l.it)){ title=''; head=''; }
  else {
    const c=C(l.ref), d=D(c.k), p=P(d.pid); title=pname(p);
    head=bigCardHTML(c);
    cond=`<div class="title-block"><div class="yr">${esc(cardLine(d))}</div><h1>${esc(pname(p))}</h1><div class="sub">${esc(d.title)}</div>${tagsHTML(d,c)}</div>
      <dl class="kv"><dt>Seller</dt><dd>${esc(ownerName(l.sel))}</dd><dt>Player</dt><dd>${pLink(p)}, ${esc(p.pos)}, ${esc(statusOf(p))}</dd><dt>Estimated market</dt><dd class="est">${rangeTxt(c.k, c.g>0?c.g:0, c)}</dd>${c.g>0?`<dt>Grade</dt><dd>GCS ${c.g} ${GRADE_NAMES[c.g]}, cert ${c.cert}</dd>`:''}</dl>
      ${c.g>0?`<div style="margin-top:8px"><b class="small">Population</b>${popHTML(c.k)}</div>`:`<div style="margin-top:8px"><b class="small">Condition from the listing photos</b>${inspectHTML(c,!mine)}</div>`}`;
    extra=salesPanel(c.k, c.g>0?c.g:0)+compsHTML(d);
  }
  let act='';
  if (mine){
    act = l.ty==='auc'
      ? `<div class="panel"><h3>Your auction</h3><dl class="kv"><dt>Current bid</dt><dd class="est">${money(l.cur,true)}</dd><dt>Bids</dt><dd>${l.bids.length}</dd><dt>Ends</dt><dd>${fmtDate(l.en)} (${daysLeft(l).toLowerCase()})</dd></dl>${l.bids.length?'':`<div class="formrow"><button class="btn sm" data-act="endlisting" data-a="${l.id}">End listing</button></div>`}</div>`
      : `<div class="panel"><h3>Your listing</h3><dl class="kv"><dt>Price</dt><dd class="est">${money(l.pr,true)}</dd><dt>Listed</dt><dd>${fmtDate(l.st)}, ${G.day-l.st} days ago</dd><dt>Offers</dt><dd>${l.off?'Accepting offers':'Not accepting offers'}</dd></dl>
        <div class="formrow"><input class="inp money-in" type="number" min="0.5" step="0.5" id="reprice" value="${l.pr}" aria-label="New price"><button class="btn sm" data-act="reprice" data-a="${l.id}">Change price</button><button class="btn sm" data-act="endlisting" data-a="${l.id}">End listing</button></div>
        ${l.offers.length?`<h3 style="margin-top:12px">Offers</h3><div class="rows">${l.offers.map(o=>`<div class="row" style="cursor:default"><div class="rt"><b>${money(o.amt,true)} from ${esc(ownerName(o.who))}</b><span>Expires ${fmtDate(o.exp)}. You'd receive ${money(o.amt*(1-FEE),true)}.</span></div><button class="btn pri sm" data-act="offeracc" data-a="${l.id}:${o.id}">Accept</button><button class="btn sm" data-act="offercounter" data-a="${l.id}:${o.id}">Counter</button><button class="btn sm" data-act="offerdec" data-a="${l.id}:${o.id}">Decline</button></div>`).join('')}</div>`:''}</div>`;
  } else if (l.ty==='bin'){
    act = `<div class="panel"><h3>Buy now</h3><div class="est">${money(l.pr,true)}</div>
      <div class="formrow"><button class="btn pri" data-act="buy" data-a="${l.id}" data-confirm="Pay ${money(l.pr,true)}" ${G.player.cash<l.pr?'disabled':''}>Buy now</button><button class="btn" data-act="watch" data-a="${l.id}">${watch?'Watching':'Watch'}</button></div>
      ${l.off?`<div class="formrow"><input class="inp money-in" type="number" min="0.5" step="0.5" id="offeramt" placeholder="Your offer" aria-label="Offer amount"><button class="btn" data-act="offer" data-a="${l.id}">Make offer</button></div>`:'<div class="small muted" style="margin-top:6px">This seller isn\'t taking offers.</div>'}
      ${l.counter?`<div class="formrow"><span class="small">The seller countered at <b>${money(l.counter,true)}</b>.</span><button class="btn sm pri" data-act="acccounter" data-a="${l.id}" data-confirm="Pay ${money(l.counter,true)}">Accept counter</button></div>`:''}
      <div id="offermsg"></div></div>`;
  } else {
    const myb=l.bids.find(b=>b[0]===0); const min = l.bids.length? l.cur+bidInc(l.cur) : l.pr;
    act = `<div class="panel"><h3>Auction</h3><dl class="kv"><dt>${l.bids.length?'Current bid':'Starting bid'}</dt><dd class="est">${money(l.cur,true)}</dd><dt>Bids</dt><dd>${l.bids.length}</dd><dt>Ends</dt><dd>${fmtDate(l.en)} (${daysLeft(l).toLowerCase()})</dd>${myb?`<dt>Your max</dt><dd>${money(myb[1],true)} ${l.lead===0?'<span class="up">(winning)</span>':'<span class="down">(outbid)</span>'}</dd>`:''}</dl>
      <div class="formrow"><input class="inp money-in" type="number" min="${min}" step="0.5" id="bidamt" placeholder="${money(min,true)}+" aria-label="Maximum bid"><button class="btn pri" data-act="bid" data-a="${l.id}">Place max bid</button><button class="btn" data-act="watch" data-a="${l.id}">${watch?'Watching':'Watch'}</button></div>
      <div class="small muted" style="margin-top:6px">Enter the most you'd pay. You'll be bid up automatically, only as far as needed. Keep enough cash to cover it when the auction closes.</div><div id="bidmsg"></div>
      ${l.hist.length?`<h3 style="margin-top:12px">Bid history</h3><table class="tbl"><tbody>${l.hist.slice(0,12).map(h=>`<tr><td>${fmtDate(h[0])}</td><td>${esc(ownerName(h[1]))}</td><td class="r">${money(h[2],true)}</td></tr>`).join('')}</tbody></table>`:''}</div>`;
  }
  return { t:title, h:`<div class="stack"><div class="detail">${head}<div class="stack">${cond}${act}</div></div>${extra}</div>` };
}
ACT.listing = a=>openSheet(()=>listingSheet(+a));
ACT.watch = a=>{ const id=+a; const w=G.player.watch; const i=w.indexOf(id); if (i>=0) w.splice(i,1); else w.push(id); refresh(); queueSave(); };
ACT.buy = (a,el)=>{ if (!armed(el)) return; const l=G.lst.find(x=>x.id===+a); const lab=l? itemLabel(l) : '', kind=l&&l.it, ref=l&&l.ref, price=l&&l.pr; const err=buyListing(+a); if (err){ showToast(err); refresh(); afterAction(); return; }
  // the listing is gone because we bought it: say so, with a way to the item, instead of the generic 'Gone' sheet
  if (UI.sheets.length){ const act=copyAct(kind); UI.sheets[UI.sheets.length-1]={fn:()=>({t:'Bought', h:`<div class="stack"><div class="panel"><h3>It's yours</h3><p class="small" style="margin:0 0 8px">${esc(lab)}${price?' for '+money(price,true):''}.</p><div class="formrow">${kind==="s"?"":`<button class="btn pri" data-act="${act}" data-a="${ref}">See it</button>`}<button class="btn" data-act="sheetclose">Done</button></div></div></div>`})}; }
  showToast('Bought.', true); refresh(); afterAction(); };
ACT.acccounter = (a,el)=>{ if (!armed(el)) return; const l=L(+a); if (!l||!l.counter) return; if (G.player.cash<l.counter){ showToast('Not enough cash.'); return; } transfer(l,0,l.counter,'offer'); refresh(); afterAction(); };
ACT.offer = a=>{ const v=parseFloat($('#offeramt').value); if (!(v>0)){ $('#offermsg').innerHTML='<div class="err">Enter an amount.</div>'; return; } const r=playerOffer(+a, Math.round(v*100)/100);
  if (r.ok){ refresh(); afterAction(); return; }
  if (r.counter){ refreshSheet(); return; }
  $('#offermsg').innerHTML=`<div class="err" style="margin-top:6px">${esc(r.err||r.no)}</div>`; };
ACT.bid = a=>{ const v=parseFloat($('#bidamt').value); const err=playerBid(+a, Math.round(v*100)/100); refresh(); const m=$('#bidmsg'); if (m) m.innerHTML = err? `<div class="err" style="margin-top:6px">${esc(err)}</div>` : '<div class="ok" style="margin-top:6px">You\'re the high bidder.</div>'; afterAction(); };
ACT.reprice = a=>{ const l=L(+a); const v=parseFloat($('#reprice').value); if (!l || !(v>0)) return; l.pr=Math.round(v*100)/100; l.st=G.day; showToast('Price updated to '+money(l.pr,true)); refresh(); afterAction(); };
ACT.endlisting = a=>{ const l=L(+a); if (!l) return; if (l.ty==='auc'&&l.bids.length){ showToast('Auctions with bids have to run their course.'); return; } removeListing(l); showToast('Listing ended.'); closeSheet(); refresh(); afterAction(); };
ACT.offeracc = a=>{ const [lid,oid]=a.split(':').map(Number); const e=answerOffer(lid,oid,true); if (e) showToast(e); closeSheet(); refresh(); afterAction(); };
ACT.offerdec = a=>{ const [lid,oid]=a.split(':').map(Number); answerOffer(lid,oid,false); refresh(); afterAction(); };
ACT.offercounter = a=>{ const [lid,oid]=a.split(':').map(Number); const l=L(lid); const o=l&&l.offers.find(x=>x.id===oid); if (!o) return;
  const v=parseFloat(prompt('Counter at what price? They offered '+money(o.amt,true)+'.', nicePrice((o.amt+l.pr)/2)));
  if (!(v>0)) return; const e=answerOffer(lid,oid,false,Math.round(v*100)/100); showToast(e||'Counter accepted. Sold.'); refresh(); afterAction(); };

function designSheet(key){
  const d=D(key), p=P(d.pid);
  const lst=G.lst.filter(l=>l.it==='c'&&C(l.ref).k===key);
  const own=myCards().filter(c=>c.k===key);
  return { t:pname(p), h:`<div class="stack"><div class="detail">${bigCardHTML(null,key)}<div class="stack">
    <div class="title-block"><div class="yr">${esc(cardLine(d))}</div><h1>${esc(pname(p))}</h1><div class="sub">${esc(d.title)}</div>${tagsHTML(d)}</div>
    <dl class="kv"><dt>Player</dt><dd>${pLink(p)}, ${esc(statusOf(p))}</dd><dt>Raw estimate</dt><dd class="est">${rangeTxt(key,0)}</dd>${d.run?`<dt>Print run</dt><dd>/${d.run}${G.ser[key]?', '+G.ser[key]+' known to be pulled':''}</dd>`:''}<dt>You own</dt><dd>${own.length?own.length+' cop'+(own.length>1?'ies':'y'):'None'}</dd></dl>
    <div><b class="small">GCS population</b>${popHTML(key)}</div>
  </div></div>
  <div class="panel"><h3>For sale now</h3><div class="rows">${lst.map(listingRow).join('')||'<div class="empty">No copies listed right now.</div>'}</div>${own.length?`<div class="formrow">${own.slice(0,4).map(c=>`<button class="btn sm" data-act="card" data-a="${c.id}">Your copy ${c.s?'#'+c.s:''} ${c.g>0?'(GCS '+c.g+')':''}</button>`).join('')}</div>`:''}</div>
  ${salesPanel(key,null,'Sales history, all grades')}${compsHTML(d)}</div>` };
}
ACT.design = a=>openSheet(()=>designSheet(a));

// ===================== COLLECTION =====================
function isMajor(c){ const d=D(c.k); return d.auto || d.caseHit || d.sec==='w' || (d.run && d.run<=50) || cardValue(c)>=25; }
function shortLine(c){ const d=D(c.k); return d.prod.yr+' '+B(d.prod).short+' '+d.title+(serialTxt(c)?' '+serialTxt(c):''); }
function gcell(c, extra){
  const d=D(c.k); const flag = c.nw? '<span class="flag">New</span>' : '';
  const st = c.l? '<span class="flag ls">Listed</span>' : c.g<0? '<span class="flag ls">At GCS</span>' : '';
  return `<button class="gcell" data-act="card" data-a="${c.id}">${flag}${st}${thumbHTML(c)}<div class="cap"><b>${esc(cardName(c))}</b><span>${esc(shortLine(c))}</span>${extra!==false?`<span>${fmtRange(estRange(c.k,c.g>0?c.g:0,c))}</span>`:''}</div></button>`;
}
function bulkEligible(){ const show=Object.values(G.player.show); return myCards().filter(c=>{ if (c.l||c.g||G.player.fav.includes(c.id)||show.includes(c.id)) return false; const d=D(c.k); return d.sec==='b' && !d.par && !d.rc && !d.first && !d.hisp && cardValue(c)<0.45; }); }
function collFiltered(){
  const f=UI.cf; const words=f.q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  let a=myCards().filter(c=>{
    const d=D(c.k);
    if (f.f==='new' && !c.nw) return false;
    if (f.f==='hits' && !isHitKey(c.k)) return false;
    if (f.f==='rc' && !(d.rc||d.first)) return false;
    if (f.f==='graded' && !(c.g>0)) return false;
    if (f.f==='raw' && c.g!==0) return false;
    if (f.f==='fav' && !G.player.fav.includes(c.id)) return false;
    if (f.f==='listed' && !c.l) return false;
    if (words.length){ const p=P(d.pid); const s=(pname(p)+' '+d.prod.yr+' '+B(d.prod).name+' '+d.title+' '+teamName(p.tm>=0?p.tm:p.org)+(d.rc?' rc rookie':'')+(d.auto?' auto':'')).toLowerCase(); for (const w of words) if (!s.includes(w)) return false; }
    return true;
  });
  if (f.sort==='val') a.sort((x,y)=>cardValue(y)-cardValue(x));
  else if (f.sort==='name') a.sort((x,y)=>cardName(x).localeCompare(cardName(y)));
  else if (f.sort==='year') a.sort((x,y)=>D(y.k).prod.yr-D(x.k).prod.yr || D(x.k).no-D(y.k).no);
  else a.sort((x,y)=>y.id-x.id);
  return a;
}
function ownedBaseSets(){ const m={}; for (const c of myCards()){ const [pi,sec,no]=c.k.split('|'); if (sec==='b'||sec==='v'||sec==='w'){ (m[pi]||(m[pi]=new Set())).add(+no); } } return m; }
VIEWS.coll = ()=>{
  const s=UI.sub.coll; const tabs=[['cards','Cards'],['sealed','Sealed'],['sets','Sets'],['show','Showcase'],['stats','Stats']];
  let body='';
  if (s==='cards'){
    const f=UI.cf; const all=collFiltered(); const per=48; const page=Math.min(f.page, Math.max(0,Math.ceil(all.length/per)-1));
    const chip=(k,n)=>`<button class="chip ${f.f===k?'on':''}" data-act="cff" data-a="${k}">${n}</button>`;
    const nNew=myCards().filter(c=>c.nw).length; const bulk=bulkEligible();
    body=`${tip('coll', `Everything you own lives here. Tap a card to inspect it, see what it's worth, list it for sale, send it to GCS or pin it to your showcase. Value ranges are estimates from recent sales, not promises.`)}
    <div class="tools"><input class="inp grow" type="search" placeholder="Search your cards" value="${esc(f.q)}" data-inp="cfq" aria-label="Search collection">
      <select class="inp" data-chg="cfsort" aria-label="Sort">${[['new','Newest'],['val','Value'],['name','Player'],['year','Year']].map(([k,n])=>`<option value="${k}" ${f.sort===k?'selected':''}>${n}</option>`).join('')}</select></div>
    <div class="chips" style="margin-bottom:12px">${chip('all','All')}${chip('new','New'+(nNew?' ('+nNew+')':''))}${chip('hits','Hits')}${chip('rc','Rookies')}${chip('graded','Graded')}${chip('raw','Raw')}${chip('fav','Favourites')}${chip('listed','Listed')}</div>
    <div class="small muted" style="margin-bottom:8px">${all.length} card${all.length===1?'':'s'}${nNew?` <button class="linkbtn" data-act="seenall">Mark all as seen</button>`:''}</div>
    <div class="grid">${all.slice(page*per,page*per+per).map(c=>gcell(c)).join('')}</div>
    ${all.length?'':`<div class="empty">${myCards().length?'Nothing matches.':'No cards yet. Buy a pack under Cards.'}</div>`}
    ${pager(all.length,per,page,'cpage')}
    ${bulk.length>=10?`<div class="panel" style="margin-top:16px"><div class="phead"><h3>Bulk commons</h3></div><p class="small muted" style="margin:0 0 8px">${bulk.length} raw base cards worth well under a dollar each. A dealer will take them as bulk at 4 cents a card. Rookies, parallels, favourites and showcase cards are never included.</p><button class="btn sm" data-act="bulk" data-confirm="Sell ${bulk.length} for ${money(bulk.length*0.04,true)}">Sell bulk for ${money(bulk.length*0.04,true)}</button></div>`:''}`;
  } else if (s==='sealed'){
    const mine=mySealed();
    body=`${tip('sealed', `Sealed product is a decision: open it now, or hold it. Boxes that leave retail shelves can climb in value if the rookie class gets hot, or sag if it doesn't.`)}
    <div class="panel"><div class="rows">${mine.map(sd=>{ const prod=G.products[sd.p]; return `<div class="row" data-act="sealed" data-a="${sd.id}">${miniSealed(sd)}<div class="rt"><b>${esc(prodName(prod))}</b><span>${FMT_NAME[sd.f]}, ${formatLine(prod,sd.f)}</span><span>Est. ${fmtRange(estRange(sealedKey(prod,sd.f)))}${sd.l?', listed':''}</span></div>${sd.l?'':`<button class="btn pri sm" data-act="opensealed" data-a="${sd.id}">Open</button>`}</div>`; }).join('')||'<div class="empty">No sealed product. The Shop and the Market both sell it.</div>'}</div></div>`;
  } else if (s==='sets'){
    const own=ownedBaseSets(); const rel=G.products.filter(p=>p.cl).sort((a,b)=>b.rel-a.rel);
    body=`${tip('sets', `Set collectors chase every base card in a product. Tap a set to see its checklist; tap a missing number to find it on the market.`)}
    <div class="panel"><div class="rows">${rel.map(prod=>{ const n=own[prod.id]?own[prod.id].size:0, t=prod.cl.base.length; return `<button class="row" data-act="setsheet" data-a="${prod.id}"><div class="rt"><b>${esc(prodName(prod))}</b><span>${n} of ${t} base cards</span><div class="bar" style="margin-top:4px;max-width:260px"><i style="width:${(n/t*100).toFixed(1)}%"></i></div></div><div class="rv"><b>${Math.floor(n/t*100)}%</b></div></button>`; }).join('')}</div></div>`;
  } else if (s==='show'){
    const sh=G.player.show;
    body=`${tip('show', `Your showcase has six slots for the cards you're proudest of. Pin a card from its detail sheet.`)}<div class="slotgrid">${[0,1,2,3,4,5].map(i=>{ const c=sh[i]!=null?C(sh[i]):null; if (sh[i]!=null && (!c||c.o!==0)) delete sh[i];
      return `<div class="slot"><h3>Slot ${i+1}</h3>${c&&c.o===0?`<button class="gcell" style="width:100%" data-act="card" data-a="${c.id}">${thumbHTML(c)}<div class="cap"><b>${esc(cardName(c))}</b><span>${esc(shortLine(c))}</span></div></button>`:'<div class="ph">Empty. Pin a card from its detail sheet.</div>'}</div>`; }).join('')}</div>`;
  } else {
    const P_=G.player; const opened=P_.opened.flatMap(o=>o.cards).map(C).filter(Boolean).sort((a,b)=>cardValue(b)-cardValue(a)).slice(0,6);
    const gr=[0,0,0,0,0,0,0,0,0,0,0]; P_.returned.forEach(r=>gr[r.g]++);
    const T=collectionTotals();
    body=`<div class="kpis"><div class="kpi"><small>Packs opened</small><b>${P_.packs}</b></div><div class="kpi"><small>Cards owned</small><b>${myCards().length}</b></div><div class="kpi"><small>Collection estimate</small><b>${rng2(T.total)}</b></div><div class="kpi"><small>Cash</small><b>${money(P_.cash,true)}</b></div>
      <div class="kpi"><small>Hobby money received</small><b>${money(75+P_.paid)}</b></div><div class="kpi"><small>Spent on cards</small><b>${money(P_.bought)}</b></div><div class="kpi"><small>Sales</small><b>${money(P_.sold)}</b></div><div class="kpi"><small>Fees paid</small><b>${money(P_.fees)}</b></div></div>
      <div class="panel" style="margin-top:14px"><h3>Best pulls still in the world</h3><div class="grid" style="margin-top:8px">${opened.map(c=>gcell(c)).join('')||'<div class="empty">Open a pack.</div>'}</div></div>
      <div class="panel" style="margin-top:14px"><h3>Your GCS record</h3>${P_.returned.length?`<table class="tbl"><tbody>${[10,9,8,7,6,5,4,3,2,1].filter(g=>gr[g]).map(g=>`<tr><td>GCS ${g} ${GRADE_NAMES[g]}</td><td class="r">${gr[g]}</td></tr>`).join('')}</tbody></table>`:'<div class="empty">Nothing graded yet.</div>'}<div class="small muted" style="margin-top:6px">${SKILL_NAMES[skillLevel()]}, ${P_.skill} card${P_.skill===1?'':'s'} graded.</div></div>`;
  }
  return `<div class="pagetitle"><h1>Collection</h1><span class="muted small">${myCards().length} cards, ${mySealed().length} sealed</span></div>
  <div class="subtabs">${tabs.map(([k,n])=>`<button class="${s===k?'on':''}" data-act="sub" data-a="coll:${k}">${n}</button>`).join('')}</div>${body}`;
};
let cfqT=null;
ACT.cfq = v=>{ UI.cf.q=v; UI.cf.page=0; clearTimeout(cfqT); cfqT=setTimeout(()=>{ const a=document.activeElement; const pos=a&&a.selectionStart; render(true); const i=$('[data-inp="cfq"]'); if (i){ i.focus(); try{ i.setSelectionRange(pos,pos); }catch(e){} } }, 220); };
ACT.cfsort = v=>{ UI.cf.sort=v; UI.cf.page=0; render(true); };
ACT.cff = a=>{ UI.cf.f=a; UI.cf.page=0; render(true); };
ACT.cpage = a=>{ UI.cf.page=+a; render(); window.scrollTo(0,0); };
ACT.seenall = ()=>{ myCards().forEach(c=>delete c.nw); render(true); queueSave(); };
ACT.bulk = (a,el)=>{ if (!armed(el)) return; const [n,cash]=bulkSell(bulkEligible().map(c=>c.id)); showToast('Sold '+n+' commons as bulk for '+money(cash,true), true); render(true); afterAction(); };

function setSheet(pid){
  const prod=G.products[pid]; const own=ownedBaseSets()[pid]||new Set(); const cl=prod.cl;
  const mineByNo={}; for (const c of myCards()){ const [pi,sec,no]=c.k.split('|'); if (+pi===pid && (sec==='b'||sec==='v'||sec==='w') && !mineByNo[no]) mineByNo[no]=c.id; }
  const insProg = B(prod).ins.map((ins,ii)=>{ const have=new Set(myCards().filter(c=>c.k.startsWith(pid+'|i'+ii+'|')).map(c=>c.k.split('|')[2])); return `<tr><td>${esc(ins.n)}</td><td class="r">${have.size} of ${cl.ins[ii].length}</td></tr>`; }).join('');
  return { t: prodName(prod)+' set', h:`<div class="stack"><div class="kpis"><div class="kpi"><small>Base set</small><b>${own.size} / ${cl.base.length}</b></div><div class="kpi"><small>Missing</small><b>${cl.base.length-own.size}</b></div></div>
    <p class="small muted" style="margin:0">Dark squares are cards you own. A red underline marks rookies and first cards. Tap a missing number to see that card and any copies for sale.</p>
    <div class="checkgrid">${cl.base.map((e,i)=>`<button class="${own.has(i)?'have':''} ${e[1]&3?'rc':''}" title="#${i+1} ${esc(pname(P(e[0])))}" data-act="${own.has(i)?'card':'design'}" data-a="${own.has(i)?mineByNo[i]:dk(prod,'b',i,'')}">${i+1}</button>`).join('')}</div>
    ${insProg?`<div class="panel"><h3>Insert sets</h3><table class="tbl"><tbody>${insProg}</tbody></table></div>`:''}</div>` };
}
ACT.setsheet = a=>openSheet(()=>setSheet(+a));

// ---- card detail ----
function listForm(it, ref, key, g, card){
  const r=estRange(key, g, card); const mid=nicePrice((r.lo+r.hi)/2); const f=UI.lf||(UI.lf={ty:'bin'});
  return `<div class="panel"><h3>Sell it</h3>
    <div class="seg" style="margin-top:6px"><button class="${f.ty==='bin'?'on':''}" data-act="lfty" data-a="bin">Buy now</button><button class="${f.ty==='auc'?'on':''}" data-act="lfty" data-a="auc">Auction</button></div>
    <div class="formrow"><label class="small muted" for="lprice">${f.ty==='bin'?'Price':'Starting bid'}</label><input class="inp money-in" type="number" id="lprice" min="0.5" step="0.5" value="${f.ty==='bin'?mid:nicePrice(Math.max(0.99,mid*0.5))}" data-inp="lfp">
      ${f.ty==='auc'?`<select class="inp" id="ldur" aria-label="Duration"><option value="3">3 days</option><option value="5" selected>5 days</option><option value="7">7 days</option></select>`:`<label class="small"><input type="checkbox" id="loff" checked> Accept offers</label>`}</div>
    <div class="small muted" id="lnet" style="margin-top:6px">${payoutTxt(f.ty==='bin'?mid:nicePrice(Math.max(0.99,mid*0.5)))}</div>
    <div class="formrow"><button class="btn pri" data-act="listit" data-a="${it}:${ref}">List it</button></div><div id="lmsg"></div></div>`;
}
function payoutTxt(v){ return v>0? `If it sells at ${money(v,true)}, you receive ${money(v*(1-FEE),true)} after the 10% marketplace fee.` : ''; }
ACT.lfty = a=>{ UI.lf={ty:a}; refreshSheet(); };
ACT.lfp = v=>{ const el=$('#lnet'); if (el) el.textContent=payoutTxt(parseFloat(v)); };
ACT.listit = a=>{
  const [it,ref]=a.split(':'); const ty=(UI.lf||{ty:'bin'}).ty; const price=Math.round(parseFloat($('#lprice').value)*100)/100;
  const dur = ty==='auc'? +$('#ldur').value : 0; const off = ty==='bin'? $('#loff').checked : false;
  const err=playerList(it, +ref, ty, price, dur, off);
  if (err){ $('#lmsg').innerHTML=`<div class="err" style="margin-top:6px">${esc(err)}</div>`; return; }
  showToast((ty==='auc'?'Auction started at ':'Listed for ')+money(price,true), true); refresh(); afterAction();
};
function historyHTML(c){
  const h=(c.h||[]).slice().reverse(); if (!h.length) return '';
  return `<div class="panel"><h3>This card's history</h3><table class="tbl"><tbody>${h.map(x=>`<tr><td>${fmtDate(x[0],true)}</td><td>${esc(x[1])}${x[3]?' <span class="muted">'+(x[1]==='Sold'?'to ':'from ')+esc(x[3])+'</span>':''}</td><td class="r">${x[2]?money(x[2],true):''}</td></tr>`).join('')}</tbody></table></div>`;
}
function cardSheet(cid){
  const c=C(cid); if (!c) return null; delete c.nw;
  const d=D(c.k), p=P(d.pid); const mine=c.o===0;
  const acq = c.a ? (c.a[1]==='pulled'? 'Pulled from a pack, '+fmtDate(c.a[0],true) : ({won:'Won at auction',found:'Found',lot:'Came in a collection',break:'Won in a group break',inherited:'Inherited'}[c.a[1]]||'Bought')+' for '+money(c.a[2],true)+(c.a[3]?' from '+c.a[3]:'')+', '+fmtDate(c.a[0],true)) : '';
  const fav=G.player.fav.includes(c.id); const slot=Object.keys(G.player.show).find(k=>G.player.show[k]===c.id);
  let act='';
  if (mine){
    if (c.l) act=`<div class="panel"><h3>Listed for sale</h3><button class="btn" data-act="listing" data-a="${c.l}">View your listing</button></div>`;
    else if (c.g<0){ const s=G.player.subs.find(x=>x.cid===c.id); act=`<div class="panel"><h3>At GCS</h3><p class="small" style="margin:0">Due back ${s?fmtDate(s.t1,true):'soon'}.</p></div>`; }
    else act=listForm('c', c.id, c.k, c.g>0?c.g:0, c) + (c.g===0?`<div class="panel"><h3>Grading</h3><p class="small muted" style="margin:0 0 8px">A GCS slab locks in a condition grade. High grades on the right card multiply value; low grades can sell for less than raw.</p><button class="btn" data-act="gradesheet" data-a="${c.id}">Send to GCS</button></div>`:'');
  }
  const note = mine? `<div class="panel"><h3>Your notes</h3><textarea class="inp" style="width:100%;min-height:60px" data-inp="note" data-cid="${c.id}" placeholder="Where you got it, what you paid, why it matters">${esc(G.player.notes[c.id]||'')}</textarea></div>` : '';
  return { t:pname(p), h:`<div class="stack"><div class="detail">${bigCardHTML(c)}<div class="stack">
    <div class="title-block"><div class="yr">${esc(cardLine(d))}</div><h1>${esc(pname(p))}</h1><div class="sub">${esc(d.title)}</div>${tagsHTML(d,c)}</div>
    <dl class="kv"><dt>Player</dt><dd>${pLink(p)}, ${esc(p.pos)}, ${esc(statusOf(p))}</dd><dt>Estimated value</dt><dd class="est">${rangeTxt(c.k,c.g>0?c.g:0,c)}</dd>${c.g>0?`<dt>Grade</dt><dd>GCS ${c.g} ${GRADE_NAMES[c.g]}, cert ${c.cert}</dd>`:''}${acq?`<dt>Acquired</dt><dd>${esc(acq)}</dd>`:''}${!mine?`<dt>Owner</dt><dd>${esc(ownerName(c.o))}</dd>`:''}</dl>
    ${mine?`<div class="formrow"><button class="btn sm" data-act="fav" data-a="${c.id}">${fav?'Unfavourite':'Favourite'}</button><button class="btn sm" data-act="pin" data-a="${c.id}">${slot!=null?'Remove from showcase':'Pin to showcase'}</button><button class="btn sm" data-act="design" data-a="${esc(c.k)}">All copies</button></div>`:''}
    ${c.g>0?`<div><b class="small">GCS population</b>${popHTML(c.k)}</div>`:c.g===0?`<div><b class="small">${mine?'Condition in hand':'Condition'}</b>${inspectHTML(c,!mine)}</div>`:''}
  </div></div>${act}${salesPanel(c.k, c.g>0?c.g:0)}${compsHTML(d)}${historyHTML(c)}${note}</div>` };
}
ACT.card = a=>{ UI.lf={ty:'bin'}; if (UI.open) closeOpener(); openSheet(()=>cardSheet(+a)); };
ACT.fav = a=>{ const id=+a, f=G.player.fav, i=f.indexOf(id); if (i>=0) f.splice(i,1); else f.push(id); refresh(); queueSave(); };
ACT.pin = a=>{ const id=+a, sh=G.player.show; const k=Object.keys(sh).find(k=>sh[k]===id); if (k!=null) delete sh[k]; else { const free=[0,1,2,3,4,5].find(i=>sh[i]==null || !C(sh[i]) || C(sh[i]).o!==0); if (free==null){ showToast('Your showcase is full. Remove a card first.'); return; } sh[free]=id; showToast('Pinned to showcase slot '+(free+1)); } refresh(); queueSave(); };
let noteT=null; ACT.note = (v,el)=>{ G.player.notes[el.dataset.cid]=v; if (!v) delete G.player.notes[el.dataset.cid]; clearTimeout(noteT); noteT=setTimeout(queueSave,500); };

// ---- sealed detail ----
function sealedSheet(sid){
  const s=G.sealed[sid]; if (!s || s.o!==0) return null; const prod=G.products[s.p]; const k=sealedKey(prod,s.f);
  return { t:prodName(prod), h:`<div class="stack"><div class="detail"><div class="bigcard"><div class="face">${packArt(prod,s.f)}</div></div><div class="stack">
    <div class="title-block"><div class="yr">Sealed ${FMT_NAME[s.f].toLowerCase()}, ${formatLine(prod,s.f)}</div><h1>${esc(prodName(prod))}</h1></div>
    <dl class="kv"><dt>Estimated value</dt><dd class="est">${fmtRange(estRange(k))}</dd>${s.a?`<dt>Acquired</dt><dd>${s.a[2]?'Paid '+money(s.a[2],true)+(s.a[3]?' at '+esc(s.a[3]==='Card shop'?'the card shop':s.a[3]):''):''} ${fmtDate(s.a[0],true)}</dd>`:''}<dt>At retail</dt><dd>${inRetail(prod)?'Yes, '+money(B(prod).formats[s.f].price):'No longer'}</dd></dl>
    ${s.l?`<button class="btn" data-act="listing" data-a="${s.l}">View your listing</button>`:`<div class="formrow"><button class="btn pri" data-act="opensealed" data-a="${s.id}" data-confirm="Rip it">Open it</button><button class="linkbtn" data-act="product" data-a="${prod.id}">Odds and checklist</button></div>`}
  </div></div>${s.l?'':listForm('s', s.id, k, null, null)}${salesPanel(k,null,'Recent sealed sales')}</div>` };
}
ACT.sealed = a=>{ UI.lf={ty:'bin'}; openSheet(()=>sealedSheet(+a)); };
ACT.opensealed = (a,el,e)=>{ if (e) e.stopPropagation(); const err=openSealed(+a); if (err){ showToast(err); return; } closeSheet(true); refresh(); saveGame(); startOpener(); };
ACT.resume = ()=>{ closeSheet(true); startOpener(); };

// ===================== GRADING =====================
function gradeSheet(cid){
  const c=C(cid); if (!c || c.o!==0 || c.g!==0 || c.l) return null; const d=D(c.k), p=P(d.pid);
  const vals=[10,9,8,7].map(g=>`<tr><td>GCS ${g} ${GRADE_NAMES[g]}</td><td class="r">${fmtRange(estRange(c.k,g))}</td></tr>`).join('');
  return { t:'Send to GCS', h:`<div class="stack"><div class="detail">${bigCardHTML(c)}<div class="stack">
    <div class="title-block"><div class="yr">${esc(cardLine(d))}</div><h1>${esc(pname(p))}</h1><div class="sub">${esc(d.title)}</div></div>
    <dl class="kv"><dt>Raw today</dt><dd class="est">${rangeTxt(c.k,0,c)}</dd></dl>
    <div><b class="small">Your inspection</b>${inspectHTML(c,false)}</div></div></div>
    <div class="panel"><h3>What slabs of this card sell for</h3><table class="tbl"><tbody>${vals}</tbody></table><p class="small muted" style="margin:6px 0 0">GCS grades what it sees, not what you hope. Fees are paid up front and aren't refunded.</p></div>
    <div class="panel"><h3>Choose a service level</h3><div class="rows">${GRADE_TIERS.map(T=>`<div class="row" style="cursor:default"><div class="rt"><b>${T.n}, ${money(T.fee)}</b><span>Back in ${T.days} days, around ${fmtDate(G.day+T.days)}</span></div><button class="btn ${T.id==='std'?'pri':''} sm" data-act="submitgrade" data-a="${c.id}:${T.id}" data-confirm="Pay ${money(T.fee)}" ${G.player.cash<T.fee?'disabled':''}>Submit</button></div>`).join('')}</div></div></div>` };
}
ACT.gradesheet = a=>openSheet(()=>gradeSheet(+a));
ACT.submitgrade = (a,el)=>{ if (!armed(el)) return; const [cid,t]=a.split(':'); const err=submitGrading(+cid,t); if (err){ showToast(err); return; } showToast('Shipped to GCS. It will be back around '+fmtDate(G.player.subs[G.player.subs.length-1].t1)+'.', true); closeSheet(); refresh(); afterAction(); };
VIEWS.grade = ()=>{
  const P_=G.player; const back=P_.returned.slice(0,12);
  const el=myCards().filter(c=>c.g===0 && !c.l).sort((a,b)=>cardValue(b)-cardValue(a)).slice(0,40);
  const html=`<div class="pagetitle"><h1>Grading</h1><span class="muted small">${SKILL_NAMES[skillLevel()]}</span></div>
  ${tip('grade', `GCS (Grading Certification Services) seals cards in a slab with a 1 to 10 grade. Condition is hidden: you inspect a card and form a read, and your read gets sharper the more cards you send in. A 10 on a popular rookie can be worth many times the raw card; a 7 usually isn't.`)}
  <div class="kpis"><div class="kpi"><small>Economy</small><b>${money(18)}, 14 days</b></div><div class="kpi"><small>Standard</small><b>${money(35)}, 7 days</b></div><div class="kpi"><small>Express</small><b>${money(80)}, 3 days</b></div><div class="kpi"><small>Cards graded</small><b>${P_.skill}</b></div></div>
  <div class="cols" style="margin-top:14px"><div class="stack">
    <div class="panel"><div class="phead"><h3>Your best raw cards</h3></div><div class="rows">${el.map(c=>`<div class="row" data-act="gradesheet" data-a="${c.id}">${miniCard(c)}<div class="rt"><b>${esc(cardName(c))}</b><span>${esc(shortLine(c))}</span><span>Raw ${fmtRange(estRange(c.k,0,c))}</span></div><button class="btn sm" data-act="gradesheet" data-a="${c.id}">Inspect</button></div>`).join('')||'<div class="empty">No raw cards to submit.</div>'}</div></div>
  </div><div class="stack">
    <div class="panel"><div class="phead"><h3>At GCS now</h3></div><div class="rows">${P_.subs.map(s=>{ const c=C(s.cid); const T=GRADE_TIERS.find(x=>x.id===s.tier); return `<div class="row" data-act="card" data-a="${c.id}">${miniCard(c)}<div class="rt"><b>${esc(cardName(c))}</b><span>${T.n}, due ${fmtDate(s.t1)}</span></div></div>`; }).join('')||'<div class="empty">Nothing submitted.</div>'}</div></div>
    <div class="panel"><div class="phead"><h3>Recently returned</h3></div><div class="rows">${back.map(r=>{ const c=C(r.cid); if (!c) return ''; return `<div class="row" data-act="card" data-a="${c.id}">${miniCard(c)}<div class="rt"><b>${esc(cardName(c))}</b><span>${fmtDate(r.t)}${r.seen?'':', new'}</span></div><div class="rv"><b>GCS ${r.g}</b><span>${GRADE_NAMES[r.g]}</span></div></div>`; }).join('')||'<div class="empty">Nothing back yet.</div>'}</div></div>
  </div></div>`;
  P_.returned.forEach(r=>r.seen=1);
  return html;
};

// ===================== BASEBALL =====================
function leaders(){
  const act=G.players.filter(p=>p.tm>=0 && p.cur);
  const hit=act.filter(p=>!isPitcher(p)), pit=act.filter(isPitcher);
  const maxAB=Math.max(1,...hit.map(p=>p.cur[1])), maxO=Math.max(1,...pit.filter(p=>p.pos==='SP').map(p=>p.cur[2]));
  const q=hit.filter(p=>p.cur[1]>=maxAB*0.55), qp=pit.filter(p=>p.cur[2]>=maxO*0.5);
  const top=(arr,f,n,asc)=>arr.map(p=>[p,f(p)]).sort((a,b)=>asc?a[1]-b[1]:b[1]-a[1]).slice(0,n||5);
  return [
    ['Batting average', top(q,p=>p.cur[2]/Math.max(1,p.cur[1])), v=>v.toFixed(3).replace(/^0/,'')],
    ['Home runs', top(hit,p=>p.cur[3]), v=>v], ['Runs batted in', top(hit,p=>p.cur[4]), v=>v], ['Stolen bases', top(hit,p=>p.cur[5]), v=>v],
    ['ERA', top(qp,p=>p.cur[6]*27/Math.max(1,p.cur[2]),5,true), v=>v.toFixed(2)], ['Wins', top(pit,p=>p.cur[3]), v=>v], ['Strikeouts', top(pit,p=>p.cur[5]), v=>v], ['Saves', top(pit,p=>p.cur[7]), v=>v]
  ];
}
function standingsHTML(){
  return LEAGUES.map((lg,li)=>{ const ts=TEAMS_DEF.map((T,i)=>i).filter(i=>i%2===li).sort((a,b)=>winPct(b)-winPct(a)); const lead=G.stand[ts[0]];
    return `<div class="panel"><h3>${lg} League</h3><div class="tblwrap"><table class="tbl"><thead><tr><th>Team</th><th class="r">W</th><th class="r">L</th><th class="r">Pct</th><th class="r">GB</th></tr></thead><tbody>${ts.map(i=>{ const s=G.stand[i]; const gb=((lead[0]-s[0])+(s[1]-lead[1]))/2; return `<tr><td>${esc(teamName(i))}</td><td class="r">${s[0]}</td><td class="r">${s[1]}</td><td class="r">${winPct(i).toFixed(3).replace(/^0/,'')}</td><td class="r">${gb?gb.toFixed(1):'–'}</td></tr>`; }).join('')}</tbody></table></div></div>`; }).join('');
}
function playerRow(p, right){ return `<button class="row" data-act="player" data-a="${p.id}"><div class="rt"><b>${esc(pname(p))}</b><span>${esc(p.pos)}, ${esc(p.tm>=0?teamName(p.tm):statusOf(p))}, age ${ageOf(p)}</span></div><div class="rv">${right||''}</div></button>`; }
function scoutGrade(p){ return Math.round(clamp(p.pot + (hashStr('sc'+p.id)%9-4),20,80)/5)*5; }
VIEWS.ball = ()=>{
  const s=UI.sub.ball; const tabs=[['news','News'],['stand','Standings'],['lead','Leaders'],['pros','Prospects'],['players','Players']];
  const yr=yearOf(G.day); const d=seasonDates(yr); const phase = G.day<d.open?'Spring training': G.day<=d.end?'Regular season': G.day<=d.champ?'Postseason':'Offseason';
  let body='';
  if (s==='news'){
    const fol=new Set(G.player.follow); const only=UI.newsF==='f';
    const ns=G.news.filter(n=>n.k!=='comic' && !isCardGameNews(n.k) && (!only || (n.p!=null && fol.has(n.p)))).slice(0,60);
    body=`<div class="chips" style="margin-bottom:10px"><button class="chip ${only?'':'on'}" data-act="newsf" data-a="a">Everything</button><button class="chip ${only?'on':''}" data-act="newsf" data-a="f">Players you follow</button></div><div class="panel">${ns.map(newsRow).join('')||'<div class="empty">'+(only?'Follow players from their pages to filter news here.':'No news.')+'</div>'}</div>`;
  } else if (s==='stand'){
    const ch=G.champs[yr-1]; body=`${ch!=null?`<p class="small muted" style="margin:0 0 10px">${yr-1} champions: ${esc(teamName(ch))}.</p>`:''}<div class="cols">${standingsHTML()}</div>`;
  } else if (s==='lead'){
    body=`<div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px">${leaders().map(([n,arr,fmt])=>`<div class="panel"><h3>${n}</h3><div class="rows">${arr.map(([p,v])=>playerRow(p,`<b>${fmt(v)}</b>`)).join('')}</div></div>`).join('')}</div>`;
  } else if (s==='pros'){
    const pr=prospectRank().slice(0,50);
    body=`${tip('pros', `Prospect cards are pure speculation: their value rides on hype and scouting reports before a single big-league at-bat. Scouting grades are estimates, and some prospects bust.`)}<div class="panel"><div class="rows">${pr.map((p,i)=>`<button class="row" data-act="player" data-a="${p.id}"><div class="rv" style="text-align:left;min-width:30px"><b>${i+1}</b></div><div class="rt"><b>${esc(pname(p))}</b><span>${esc(p.pos)}, age ${ageOf(p)}, ${esc(p.tm>=0?teamName(p.tm)+' (called up)':TEAMS_DEF[p.org][0]+' system')}</span></div><div class="rv"><b>${scoutGrade(p)}</b><span>scout grade</span></div></button>`).join('')}</div></div>`;
  } else {
    const q=UI.pq.trim().toLowerCase(); const words=q.split(/\s+/).filter(Boolean);
    const res = words.length? G.players.filter(p=>{ const s=(pname(p)+' '+teamName(p.tm>=0?p.tm:p.org)+' '+p.pos).toLowerCase(); return words.every(w=>s.includes(w)); }).sort((a,b)=>b.S-a.S).slice(0,40) : [];
    const fol=G.player.follow.map(P);
    const hot=G.players.filter(p=>p.tm!==-1).sort((a,b)=>b.hy-a.hy).slice(0,8);
    body=`<div class="tools"><input class="inp grow" type="search" placeholder="Search players or teams" value="${esc(UI.pq)}" data-inp="pq" aria-label="Search players"></div>
    ${words.length?`<div class="panel"><div class="rows">${res.map(p=>playerRow(p,`<span>${esc(interestLabel(p))}</span>`)).join('')||'<div class="empty">No players found.</div>'}</div></div>`:''}
    <div class="cols" style="margin-top:12px"><div class="panel"><h3>Following</h3><div class="rows">${fol.map(p=>playerRow(p,`<span class="${trendOf(p)[1]}">${trendOf(p)[0]}</span>`)).join('')||'<div class="empty">Follow players from their pages.</div>'}</div></div>
    <div class="panel"><h3>Names the hobby is talking about</h3><div class="rows">${hot.map(p=>playerRow(p,`<span class="${trendOf(p)[1]}">${trendOf(p)[0]}</span>`)).join('')}</div></div></div>`;
  }
  return `<div class="pagetitle"><h1>Baseball</h1><span class="muted small">${yr} ${phase}</span></div><div class="subtabs">${tabs.map(([k,n])=>`<button class="${s===k?'on':''}" data-act="sub" data-a="ball:${k}">${n}</button>`).join('')}</div>${body}`;
};
ACT.newsf = a=>{ UI.newsF=a; render(true); };
let pqT=null; ACT.pq = v=>{ UI.pq=v; clearTimeout(pqT); pqT=setTimeout(()=>{ const a=document.activeElement; const pos=a&&a.selectionStart; render(true); const i=$('[data-inp="pq"]'); if (i){ i.focus(); try{ i.setSelectionRange(pos,pos); }catch(e){} } }, 220); };

const AWN={MVP:'Most Valuable Player',ACE:'Top Pitcher award',ROY:'Rookie of the Year',AS:'All-Star',CH:'Champion',HOH:'Hall of Honor'};
function playerSheet(pid){
  const p=P(pid); if (!p) return null; const pit=isPitcher(p); const fol=G.player.follow.includes(p.id);
  const [tr,tc]=trendOf(p);
  const yrs=Object.keys(p.car).filter(k=>k!=='tot').map(Number).sort((a,b)=>b-a);
  const hdr = pit? ['Year','Team','G','W-L','ERA','K','SV'] : ['Year','Team','G','AVG','HR','RBI','SB'];
  const line=(y,t,s)=> pit? [y,teamAbbr(t),s[0],s[3]+'-'+s[4],s[2]?(s[6]*27/s[2]).toFixed(2):'–',s[5],s[7]] : [y,teamAbbr(t),s[0],s[1]?(s[2]/s[1]).toFixed(3).replace(/^0/,''):'–',s[3],s[4],s[5]];
  const rows=[]; if (p.cur && p.cur[0]>0) rows.push(line(yearOf(G.day),p.tm,p.cur)); yrs.forEach(y=>rows.push(line(y,p.car[y].t,p.car[y].s)));
  const aw={}; p.aw.forEach(([y,c])=>{ (aw[c]=aw[c]||[]).push(y); });
  const mine=myCards().filter(c=>D(c.k).pid===p.id);
  const lst=G.lst.filter(l=>l.it==='c' && D(C(l.ref).k).pid===p.id).sort((a,b)=>(b.ty==='auc'?b.cur:b.pr)-(a.ty==='auc'?a.cur:a.pr)).slice(0,12);
  const sales=[]; for (const k in G.sales){ if (k[0]==='S'||k[0]==='M'||k[0]==='T') continue; if (D(k).pid!==p.id) continue; for (const s of G.sales[k].slice(0,3)) sales.push([s,k]); }
  sales.sort((a,b)=>b[0][0]-a[0][0]);
  const news=G.news.filter(n=>n.p===p.id).slice(0,6);
  const hx=p.hx.slice(-60);
  return { t:pname(p), h:`<div class="stack">
    <div class="title-block"><div class="yr">${esc(p.pos)}, age ${ageOf(p)}${p.num?', #'+p.num:''}</div><h1>${esc(pname(p))}</h1><div class="sub">${esc(statusOf(p))}</div>${p.dy&&p.tm!==-1?`<span class="tag">Debut ${p.dy}</span>`:''}${p.tm===-1?`<span class="tag">Scout grade ${scoutGrade(p)}</span>`:''}${p.inj>0?'<span class="tag">Injured</span>':''}</div>
    <div class="formrow"><button class="btn sm ${fol?'':'pri'}" data-act="follow" data-a="${p.id}">${fol?'Following':'Follow'}</button><button class="btn sm" data-act="findplayer" data-a="${p.id}">Find cards on the market</button></div>
    <div class="kpis"><div class="kpi"><small>Hobby interest</small><b>${esc(interestLabel(p))}</b></div><div class="kpi"><small>Card demand</small><b class="${tc}">${tr}</b></div><div class="kpi"><small>This season</small><b style="font-size:16px">${p.cur&&p.cur[0]?esc(lineStr(p,p.cur)):'–'}</b></div><div class="kpi"><small>Your cards</small><b>${mine.length}</b></div></div>
    ${hx.length>=3?`<div class="panel"><h3>Card market index</h3><p class="small muted" style="margin:0 0 4px">How the hobby has valued this player's cards lately.</p>${sparkSVG(hx,{h:90})}</div>`:''}
    ${Object.keys(aw).length?`<div class="panel"><h3>Honours</h3><dl class="kv">${Object.keys(aw).map(c=>`<dt>${AWN[c]||c}</dt><dd>${aw[c].sort().join(', ')}</dd>`).join('')}</dl></div>`:''}
    ${rows.length?`<div class="panel"><h3>Career</h3><div class="tblwrap"><table class="tbl"><thead><tr>${hdr.map((h,i)=>`<th class="${i>1?'r':''}">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map((v,i)=>`<td class="${i>1?'r':''}">${v}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>`:''}
    ${news.length?`<div class="panel"><h3>In the news</h3>${news.map(newsRow).join('')}</div>`:''}
    ${mine.length?`<div class="panel"><h3>In your collection</h3><div class="grid" style="margin-top:6px">${mine.slice(0,12).map(c=>gcell(c)).join('')}</div></div>`:''}
    <div class="panel"><h3>For sale now</h3><div class="rows">${lst.map(listingRow).join('')||'<div class="empty">No cards of this player listed.</div>'}</div></div>
    <div class="panel"><h3>Recent card sales</h3><div class="rows">${sales.slice(0,10).map(([s,k])=>{ const d=D(k); return `<button class="row" data-act="design" data-a="${esc(k)}">${miniKey(k)}<div class="rt"><b>${esc(d.prod.yr+' '+B(d.prod).short+' '+d.title)}</b><span>${s[2]>0?'GCS '+s[2]:'Raw'}${d.rc?', RC':''}</span></div><div class="rv"><b>${money(s[1],true)}</b><span>${fmtDate(s[0])}</span></div></button>`; }).join('')||'<div class="empty">No recorded sales.</div>'}</div></div>
  </div>` };
}
ACT.player = a=>{ if (UI.open) closeOpener(); openSheet(()=>playerSheet(+a)); };
ACT.follow = a=>{ const id=+a, f=G.player.follow, i=f.indexOf(id); if (i>=0) f.splice(i,1); else f.push(id); refresh(); queueSave(); };
ACT.findplayer = a=>{ const p=P(+a); UI.mf={ q:pname(p).toLowerCase(), type:'all', fmt:'all', sort:'low', page:0 }; ACT.goto('market:browse'); };

// ===================== SETTINGS =====================
function saveStatus(){
  if (CLOUD.db && CLOUD.lastOk) return `Saved to your Claude account at ${new Date(CLOUD.lastOk).toLocaleTimeString([], {hour:'numeric', minute:'2-digit'})}. You can close this page and pick up later, on any device where you're signed in.`;
  if (CLOUD.db && CLOUD.err) return `<span class="err">Couldn't reach your account storage (${esc(CLOUD.err)}). Progress is saved in this browser for now and will sync on the next save.</span>`;
  if (CLOUD.db) return 'Connected to your Claude account storage. Your next save goes there.';
  return G._localOk===false? '<span class="err">Saving isn\'t available in this view. Download a backup before you leave.</span>' : 'Saved in this browser only. Account storage isn\'t available in this view, so download a backup now and then.';
}
function settingsSheet(){
  const th=document.documentElement.dataset.theme||'auto';
  return { t:'Settings', h:`<div class="stack">
    <div class="panel"><h3>Saving</h3><p class="small" style="margin:0 0 8px">${saveStatus()}</p><div class="formrow"><button class="btn sm" data-act="savenow">Save now</button><button class="btn sm" data-act="exportsave">Download a backup</button><label class="btn sm" style="cursor:pointer">Restore a backup<input type="file" accept=".txt,text/plain" data-chg="importsave" style="display:none"></label></div><div id="savemsg"></div></div>
    <div class="panel"><h3>Sound</h3><div class="seg"><button class="${UI.sound?'on':''}" data-act="sound" data-a="1">On</button><button class="${UI.sound?'':'on'}" data-act="sound" data-a="0">Off</button></div></div>
    <div class="panel"><h3>Appearance</h3><div class="seg">${[['auto','Match device'],['light','Light'],['dark','Dark']].map(([k,n])=>`<button class="${th===k?'on':''}" data-act="theme" data-a="${k}">${n}</button>`).join('')}</div></div>
    <div class="panel"><h3>Start over</h3><p class="small muted" style="margin:0 0 8px">Generates a brand-new baseball universe: new players, new histories, new cards. Your current save is replaced.</p><button class="btn sm" data-act="newgame" data-confirm="Tap again to erase and restart">New game</button></div>
    <div class="panel"><h3>About</h3><p class="small muted" style="margin:0">Card Collector Simulator, phase one: baseball. Every team, player, brand and grading company is fictional. The league plays itself; card prices come from what simulated collectors are willing to pay.</p></div></div>` };
}
ACT.exportsave = async ()=>{
  const m=$('#savemsg'); const s=await packState(); const name='card-collector-'+dayToDate(G.day).toISOString().slice(0,10)+'.txt';
  try {
    const dl = window.claude && window.claude.use ? await window.claude.use('downloads') : null;
    if (dl){ await dl.save({ filename:name, data:s }); if (m) m.innerHTML='<div class="ok" style="margin-top:6px">Backup ready.</div>'; return; }
  } catch(e){ if (e && e.code==='declined'){ return; } }
  const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([s],{type:'text/plain'})); a.download=name; document.body.appendChild(a); a.click(); a.remove();
};
ACT.importsave = async (v,el)=>{
  const f=el.files&&el.files[0]; if (!f) return; const m=$('#savemsg');
  try { await importSave(await f.text()); migrate(); closeSheet(true); UI.tab='home'; render(); showToast('Backup restored: '+fmtDate(G.day,true), true); }
  catch(e){ if (m) m.innerHTML='<div class="err" style="margin-top:6px">That file isn\'t a Card Collector save.</div>'; }
};
ACT.settings = ()=>openSheet(settingsSheet);
ACT.savenow = async ()=>{ await saveGame(true); await new Promise(r=>setTimeout(r,50)); await flushCloud(); showToast(CLOUD.lastOk?'Saved to your account.':G._localOk?'Saved in this browser.':'Save failed.', !!(CLOUD.lastOk||G._localOk)); refreshSheet(); };
ACT.sound = a=>{ UI.sound=a==='1'; G.player.sound=UI.sound; refreshSheet(); queueSave(); };
ACT.theme = a=>{ if (a==='auto') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme=a; G.player.theme=a; refreshSheet(); queueSave(); };
ACT.newgame = async (a,el)=>{ if (!armed(el)) return; closeSheet(true); try { localStorage.removeItem(SAVE_KEY); } catch(e){} await startNew(); };

// ===================== COMICS: UI =====================
ICONS.comics = '<path d="M4 4h11a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-4 3v-3H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><path d="M19 8h1a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-1v2l-3-2"/>';
UI.sub.comics='home'; UI.sub.grade = UI.sub.grade==='submit'?'cards':UI.sub.grade; UI.csq=''; UI.csf={g:-1, st:'on', sort:'heat'}; UI.crq='';
function monYr(t){ const d=dayToDate(t); return MON[d.getUTCMonth()]+' '+d.getUTCFullYear(); }
function sLink(s, txt){ return `<button class="linkbtn" data-act="cseries" data-a="${s.id}">${esc(txt||sTitle(s))}</button>`; }
function crLink(c){ return c? `<button class="linkbtn" data-act="ccreator" data-a="${c.id}">${esc(c.n)}</button>` : ''; }
function chLink(c){ return `<button class="linkbtn" data-act="cchar" data-a="${c.id}">${esc(c.n)}</button>`; }
function iLink(key, txt){ return `<button class="linkbtn" data-act="design" data-a="${esc(key)}">${esc(txt||cmD(key).title)}</button>`; }
function cmTags(d, cp){
  const t=[]; const s=d.s;
  if (!d.tr){ const ks=issueKeys(s,d.n);
    if (d.n===1 && s.fmt!=='gn') t.push('<span class="tag rc">#1</span>');
    if (ks.some(k=>k[1]==='fa'||k[1]==='team')) t.push('<span class="tag rc">1st app</span>'); else if (ks.some(k=>k[1]==='cam')) t.push('<span class="tag rc">Cameo</span>');
    if (ks.some(k=>!['fa','team','cam','ct','arc','ann'].includes(k[1]) && !(k[1]==='cd'&&CR_(k[2]).fame<0.8))) t.push('<span class="tag num">Key</span>');
    if (d.v) t.push(`<span class="tag">${esc(VAR_N(d.v).replace(' variant',''))}</span>`); if (d.p>1) t.push(`<span class="tag">${d.p===9?'Facsimile':(['','','2nd','3rd','4th','5th'][d.p]||d.p+'th')+' print'}</span>`); }
  else t.push(`<span class="tag">${d.kind==='H'?'Hardcover':'Trade'}</span>`);
  if (cp){ if (cp.g>0) t.push(`<span class="tag gr">GCS ${gTxt(cp.g)}</span>`); if (cp.sg) t.push(`<span class="tag auto">${cp.sg.s==='a'?'Signed, authenticated':cp.sg.s==='w'?'Signed, witnessed':cp.sg.s==='x'?'Signature not authenticated':'Signed'}</span>`); if (cp.gr) t.push('<span class="tag" style="background:#6a3d9a;color:#fff">Restored</span>'); if (cp.pr) t.push('<span class="tag">Pressed</span>'); }
  return t.join('');
}
function cmRange(key, g10, cp){ const r=cmEst(key,g10,cp); return (r.limited?'<span class="muted small">Few sales. Likely</span> ':'')+fmtRange(r); }
function signals(s){
  const out=[]; const n=s.n; const pr=s.pr;
  if (s.sts==='ann') out.push(['Solicited for '+fmtDate(s.st,true),'']);
  if (s.sts==='on' && s.cx) out.push(['Cancelled; ends with #'+s.cx,'down']);
  else if (s.sts==='cx') out.push(['Cancelled '+yearOf(s.en),'down']);
  else if (s.sts==='end') out.push([(s.fmt==='ls'?'Completed limited series, ':'Ended, ')+yearOf(s.en),'']);
  if (n && s.so && s.so>=n-2 && s.sts==='on') out.push(['Sold out at distributor','up']);
  if (s.sts==='on' && n && (s.pp[n]||s.pp[n-1])) out.push(['Second printing ordered','up']);
  if (s.sts==='on' && n>=4){ const a=pr[n-1], b=pr[n-4]; if (a>b*1.15) out.push([n<=8?'Strong retailer demand':'Gaining readers','up']); else if (a<b*0.85) out.push(['Orders declining','down']); if (s.low>=1 && !s.cx) out.push(['Cancellation warning','down']); }
  if (s.bo) out.push(['Breakout hit ('+s.bo+')','up']);
  if (s.crit>=0.82) out.push(['Critical acclaim','up']); else if (s.crit>=0 && s.crit<0.35) out.push(['Poor reviews','down']);
  if (s.fan>1 && s.rd<mkt(yearOf(G.day))*0.1) out.push(['Cult following','up']);
  if (s.aw.some(a=>a[2]==='W')) out.push(['Award winner','up']); else if (s.aw.some(a=>a[2]==='N' && a[0]>=yearOf(G.day)-1)) out.push(['Award nominee','']);
  for (const id of s.ad){ const a=G.cm.ad[id]; if (!a.end) out.push([(a.k==='film'?'Film':'TV')+': '+(a.sg===0?'rumoured':adStage(a))+(a.sg===8&&a.out?' ('+a.out+')':''),'up']); }
  return out;
}
function sigHTML(s){ const g=signals(s); return g.length? `<div class="chips" style="margin:4px 0 0">${g.map(x=>`<span class="tag ${x[1]==='up'?'up':x[1]==='down'?'down':''}" style="${x[1]==='up'?'background:#e3f2e8;color:#1b6b3a':x[1]==='down'?'background:#f7e1df;color:#9b2c24':''}">${esc(x[0])}</span>`).join('')}</div>` : ''; }
function seriesRow(s, right){ const k=mk(s.id,1,1,''); return `<button class="row" data-act="cseries" data-a="${s.id}">${s.n?miniCKey(k):'<div class="mini cm"></div>'}<div class="rt"><b>${esc(sTitle(s))}</b><span>${esc(pubName(s))}, ${esc(CG[s.g].n)}, ${yearOf(s.st)}${s.n?', '+s.n+' issue'+(s.n>1?'s':''):''}</span>${signals(s).slice(0,2).map(x=>`<span class="${x[1]}">${esc(x[0])}</span>`).join('')}</div>${right?`<div class="rv">${right}</div>`:''}</button>`; }
function issueRow(key, right, sub){ const d=cmD(key); return `<button class="row" data-act="design" data-a="${esc(key)}">${miniCKey(key)}<div class="rt"><b>${esc(d.title)}</b><span>${esc(sub||cmSub(d))}</span><span>${cmTags(d)}</span></div>${right?`<div class="rv">${right}</div>`:''}</button>`; }
function cmCell(cp, extra){ const d=cmD(cp.k); return `<button class="gcell" data-act="ccopy" data-a="${cp.id}">${cp.nw?'<span class="flag">New</span>':''}${cp.l?'<span class="flag ls">Listed</span>':''}<div class="thumb cmthumb ${cp.g>0?'is-slab':''}">${cmThumb(cp)}</div><div class="cap"><b>${esc(d.title)}</b><span>${esc(extra||(cp.g>0?'GCS '+gTxt(cp.g):cp.g===-1?'At GCS':cp.g===-2?'Pressing':(d.label&&d.label!=='Cover A'?d.label:d.yr+'')))}</span></div></button>`; }
function cmFollowed(){ return G.player.cfol||(G.player.cfol=[]); }

// ---------- inspection ----------
const CINS = [
  [[94,'Spine is tight with no stress marks.'],[90,'A couple of tiny non-colour-breaking spine ticks.'],[82,'Several spine ticks, one breaking colour.'],[72,'Spine roll and multiple colour-breaking ticks.'],[0,'Heavy spine wear; a split is starting at a staple.']],
  [[94,'Corners are sharp and square.'],[90,'Slight blunting on the %s corner.'],[80,'Worn %s corner with a small crease.'],[68,'Rounded corners; the %s one is creased through the colour.'],[0,'Corners are chipped and missing small pieces.']],
  [[94,'Cover gloss is bright and clean.'],[90,'Minor cover rub along the spine.'],[80,'Noticeable rub and light soiling.'],[68,'The cover is dull and soiled.'],[0,'Heavy soiling and colour fading.']],
  [[94,'No creases.'],[88,'A faint non-colour-breaking bend near the %s corner.'],[70,'A small colour-breaking crease on the %s corner.'],[55,'A crease runs across the front cover.'],[0,'Multiple hard creases.']],
  [[94,'Lies flat, no waviness.'],[88,'A light non-colour-breaking bend that would likely press out.'],[78,'Some waviness and a couple of soft bends.'],[0,'Rolled and warped; it has been read hard.']],
  [[93,'Staples clean and firmly attached.'],[85,'Staples show slight discoloration.'],[70,'Staple rust is staining the centrefold.'],[0,'One staple has popped loose.']],
  [[90,'Pages remain white.'],[82,'Off-white to white pages.'],[70,'Cream to off-white pages.'],[55,'Tan pages.'],[0,'Brittle, browning pages that flake at the edges.']],
  [[97,''],[85,'A small edge tear, under a quarter inch.'],[70,'A tear runs into the cover.'],[0,'A piece is missing from the cover.']],
  [[99,''],[80,'A store date stamp on the cover.'],[0,'Someone wrote a name on the cover in ballpoint.']],
  [[99,''],[90,'A minor printing defect: the cover is slightly miswrapped.'],[0,'An obvious printing defect: ink smudge across the art.']]
];
const CSIDE=['lower-right','upper-right','lower-left','upper-left'];
function cmSkill(){ const s=G.player.cskill||0; return s>=25?3: s>=10?2: s>=3?1:0; }
function cmInspect(cp, photos){
  const lvl=cmSkill(); const noise=(photos?3.6:1.8)*[1,0.72,0.5,0.34][lvl];
  const rng=mkRng(cp.id*173+lvl*11+(photos?777:0));
  const obs=cp.c.map(v=>clamp(v+rgauss(rng)*noise,5,100)); const lines=[];
  for (let i=0;i<10;i++){
    if (photos && (i===5||i===6) && rng()<0.5){ lines.push(i===5?'Staples are hard to judge from the photos.':'Page colour is hard to judge from the photos.'); continue; }
    const band=CINS[i].find(b=>obs[i]>=b[0]); if (!band || !band[1]) continue;
    lines.push(band[1].replace('%s', CSIDE[Math.floor(rng()*4)]));
  }
  if (cp.r && rng() < (photos?0.08:0.15+0.17*lvl)) lines.push('Something looks off: the colour along the spine may have been touched up.');
  if (cp.sg){ const c=CR_(cp.sg.c); lines.push(cp.sg.s==='w'?`Signed by ${c.n}, with a witness sticker from a convention.`: cp.sg.s==='a'?`Signed by ${c.n}; GCS authenticated the signature.`: cp.sg.s==='x'?`A signature attributed to ${c.n} that GCS could not authenticate.`:`Signed on the cover, supposedly by ${c.n}. No witness or certificate.`); }
  let hunch='';
  if (lvl>=1 && cp.g===0){ const g=scoreToG(cmScore(obs)); const i=CGL.indexOf(g); const lo=CGL[Math.min(CGL.length-1,i+(photos?2:1)-(lvl>=3?1:0))], hi=CGL[Math.max(0,i-(lvl<3?1:0))]; hunch = lo===hi?`Your read: this looks like a ${gTxt(lo)}.`:`Your read: probably somewhere between ${gTxt(lo)} and ${gTxt(hi)}.`; }
  return {lines, hunch};
}
function cmInspectHTML(cp, photos){ const r=cmInspect(cp,photos); return `<ul class="inspect">${r.lines.map(l=>`<li>${esc(l)}</li>`).join('')}</ul>${r.hunch?`<div class="small"><b>${esc(r.hunch)}</b></div>`:`<div class="small muted">Send a few comics to GCS and you'll start to read condition the way they do.</div>`}`; }

// ---------- history narrative ----------
function whyItMatters(d){
  const s=d.s, n=d.n; const out=[]; const tier=tierOf(s); const yr=yearOf(issueDay(s,1));
  const low = s.r0 < mkt(yr)*TIERF[Math.min(tier,5)]*0.6 || tier>=3;
  const gn=CG[s.g].n.toLowerCase(); out.push(`${low&&tier>=2?'Originally a low-selling ':(/^[aeiou]/.test(gn)?'An ':'A ')}${gn} ${s.fmt==='on'?'series':s.fmt==='ls'?'limited series':s.fmt==='gn'?'graphic novel':'one-shot'} from ${pubName(s)}${tier>=2?' ('+TIER_N[tier].toLowerCase()+')':''}, launched in ${yr}.`);
  if (!d.tr && n && s.pr[n-1]){ if (d.yr>=1975) out.push(`Issue #${n} had roughly ${(Math.round(s.pr[n-1])*100).toLocaleString()} first-print copies${d.v&&d.run?'; this variant about '+d.run.toLocaleString()+' copies':''}.`); else out.push(`Printed in the newsstand era; most copies were read, traded and thrown away.`); }
  for (const x of s.notes.slice().sort((a,b)=>a[0]-b[0])) out.push(x[1]);
  if (!d.tr) for (const k of issueKeys(s,n)){
    if (k[1]==='cd'){ const c=CR_(k[2]); if (c.fame>1.2) out.push(`${c.n} made their debut here and later became one of the industry's ${c.fame>2.2?'most important':'most followed'} ${ROLE_N[c.r].toLowerCase()}s.`); }
    if ((k[1]==='fa'||k[1]==='cam') ){ const c=CH_(k[2]); const nser=c.ser.filter(id=>id!==s.id).length; if (c.rec>2 || nser) out.push(`${c.n} went on to ${nser?'appear in '+nser+' other series':'grow in popularity'}${c.ad.length?' and reach the screen':''}.`); }
  }
  return out;
}
function debateNote(s, n){
  const out=[];
  for (const k of issueKeys(s,n)){ const c = (k[1]==='fa'||k[1]==='cam') ? CH_(k[2]) : null; if (!c || !c.cam || !c.fa) continue;
    const cs=c.cs; const cam=c.cam, fa=c.fa;
    out.push(`${c.n} is glimpsed in ${S_(cam[0]).t} #${cam[1]} and fully introduced in ${S_(fa[0]).t} #${fa[1]}. ${cs>0.55?'Most collectors now treat the cameo as the true first appearance.':cs<0.3?'Most collectors give the full appearance the premium.':'Collectors are split on which issue deserves the premium.'}`); }
  return out;
}

// ---------- issue (design) sheet ----------
function siblingKeys(d){
  if (d.tr) return [d.key]; const s=d.s, n=d.n; const out=[mk(s.id,n,1,'')];
  if (s.v[n]) for (const v of s.v[n].split(',')) out.push(mk(s.id,n,1,v));
  (s.pp[n]||[]).forEach((e,i)=>out.push(mk(s.id,n,i+2,'')));
  if ((G.cm.fac||[]).some(x=>x[0]===s.id&&x[1]===n)) out.push(mk(s.id,n,9,''));
  return out;
}
function cmCompsHTML(d){
  const sib=siblingKeys(d); if (sib.length<2) return '';
  return `<div class="panel"><h3>Other covers and printings</h3><p class="small muted" style="margin:0 0 6px">Each version has its own supply, its own buyers and its own sales history.</p><div class="tblwrap"><table class="tbl"><tbody>${sib.map(k=>{ const e=cmD(k); const s=(G.sales[k]||[]); const last=s[0]; const nl=G.lst.filter(l=>l.it==='m'&&G.mc[l.ref]&&G.mc[l.ref].k===k).length;
    return `<tr class="${k===d.key?'hl':''}" data-act="design" data-a="${esc(k)}" style="cursor:pointer"><td>${esc(e.label||'Cover A')}<div class="muted small">${d.yr>=1975?'~'+e.run.toLocaleString()+' printed':''}</div></td><td class="r">${last?money(last[1],true)+'<span class="muted small"> '+(last[2]>0?gTxt(last[2]):'raw')+', '+fmtDate(last[0])+'</span>':'<span class="muted">No sales</span>'}</td><td class="r muted">${s.length} sold${nl?', '+nl+' listed':''}</td></tr>`; }).join('')}</tbody></table></div></div>`;
}
function cmSalesPanel(key, g10, title){
  const all=(G.sales[key]||[]); const s = g10==null? all : all.filter(x=>(x[2]||0)===(g10||0));
  const pts=s.slice(0,18).reverse().map(x=>[x[0],x[1]]);
  const near = g10>0 ? all.filter(x=>x[2]>0 && Math.abs(CGL.indexOf(x[2])-CGL.indexOf(g10))<=2 && x[2]!==g10).slice(0,5) : [];
  return `<div class="panel"><h3>${title||'Recent sales'}</h3>${pts.length>=3?sparkSVG(pts,{axis:true,dots:true,h:110}):''}${s.length?`<table class="tbl"><tbody>${s.slice(0,12).map(x=>`<tr><td>${fmtDate(x[0],true)}</td><td class="r"><b>${money(x[1],true)}</b></td><td class="r muted">${x[2]>0?'GCS '+gTxt(x[2]):'Raw'}</td></tr>`).join('')}</tbody></table>`:`<div class="empty">No sales ${g10!=null?'at this grade':'recorded'}.${all.length&&g10!=null?' Other grades: '+all.slice(0,4).map(x=>money(x[1],true)+' ('+(x[2]>0?gTxt(x[2]):'raw')+')').join(', '):''}</div>`}
  ${near.length?`<div class="small muted" style="margin-top:6px">Nearby grades: ${near.map(x=>money(x[1],true)+' ('+gTxt(x[2])+', '+fmtDate(x[0])+')').join(', ')}</div>`:''}</div>`;
}
function cmPopHTML(key){ const p=cmPop(key); const gs=Object.keys(p).map(Number).sort((a,b)=>b-a); const tot=gs.reduce((a,g)=>a+p[g],0); if (!tot) return '<span class="muted small">No copies graded yet.</span>'; return `<table class="tbl"><tbody>${gs.slice(0,9).map(g=>`<tr><td>${gTxt(g)} ${CGN[g]}</td><td class="r">${p[g]}</td></tr>`).join('')}${gs.length>9?`<tr><td>Lower grades</td><td class="r">${gs.slice(9).reduce((a,g)=>a+p[g],0)}</td></tr>`:''}<tr><td><b>Total graded</b></td><td class="r"><b>${tot}</b></td></tr></tbody></table>`; }
function gradeTableKeys(d){ const age=yearOf(G.day)-d.yr; return typicalGrade(age)>=85 ? [98,96,94,92,90,80,60] : [90,80,60,40,20]; }
function cmIssueSheet(key){
  const d=cmD(key), s=d.s; const own=myComics().filter(c=>c.k===key); const lst=G.lst.filter(l=>l.it==='m'&&G.mc[l.ref]&&G.mc[l.ref].k===key);
  const W=CR_(s.w), A=CR_(s.a), CV=s.cv>=0&&s.cv!==s.a?CR_(s.cv):null;
  const ks=d.tr?[]:issueKeys(s,d.n); const age=yearOf(G.day)-d.yr;
  const run = d.yr>=1975 ? `About ${d.run.toLocaleString()} copies${d.p>1&&d.p<9?' in this printing':''}` : `Newsstand-era circulation; survival in high grade is low`;
  const tg=typicalGrade(age);
  return { t:d.title, h:`<div class="stack"><div class="detail"><div class="bigcard cm"><div class="face">${comicCover(key)}</div></div><div class="stack">
    <div class="title-block"><div class="yr">${esc(pubName(s))}${s.imp?' / '+esc(s.imp):''}, ${monYr(d.day)}</div><h1>${esc(d.title)}</h1><div class="sub">${esc(d.label||'Cover A')}</div>${cmTags(d)}</div>
    <dl class="kv"><dt>Series</dt><dd>${sLink(s)}</dd>${d.tr?`<dt>Collects</dt><dd>Issues #${d.from}–${d.to}</dd>`:`<dt>Creators</dt><dd>${crLink(W)}${A!==W?', '+crLink(A):' (writer and artist)'}${CV?', cover by '+crLink(CV):''}</dd>`}
      <dt>Cover price</dt><dd>${money(d.cp,true)}</dd><dt>Print run</dt><dd>${esc(run)}</dd>
      <dt>Raw value</dt><dd class="est">${cmRange(key,0)}</dd><dt>You own</dt><dd>${own.length?own.length+' cop'+(own.length>1?'ies':'y'):'None'}</dd></dl>
    ${ks.length?`<div><b class="small">Why collectors care</b><ul class="inspect">${ks.map(k=>`<li>${esc(keyText(k,s))}${k[1]==='fa'||k[1]==='cam'||k[1]==='team'?' '+chLink(CH_(k[2])).replace('linkbtn','linkbtn small'):''}</li>`).join('')}</ul>${debateNote(s,d.n).map(x=>`<div class="note small" style="margin-top:6px">${esc(x)}</div>`).join('')}</div>`:''}
  </div></div>
  <div class="panel"><h3>Value by grade</h3><p class="small muted" style="margin:0 0 6px">Ranges, not promises. ${tg>=85?'For modern books, collectors pay up for 9.8s.':'For a book this old, a mid-grade copy is what most people hunt; high grades are rare.'}</p><table class="tbl"><tbody>${gradeTableKeys(d).map(g=>`<tr><td>GCS ${gTxt(g)} ${CGN[g]}</td><td class="r">${cmRange(key,g)}</td></tr>`).join('')}</tbody></table>
    <div style="margin-top:10px"><b class="small">GCS population</b>${cmPopHTML(key)}</div></div>
  <div class="panel"><h3>For sale now</h3><div class="rows">${lst.map(listingRow).join('')||'<div class="empty">No copies listed right now.</div>'}</div>${own.length?`<div class="formrow">${own.slice(0,4).map(c=>`<button class="btn sm" data-act="ccopy" data-a="${c.id}">Your copy ${c.g>0?'(GCS '+gTxt(c.g)+')':''}</button>`).join('')}</div>`:''}</div>
  ${cmSalesPanel(key,null,'Sales history, all grades')}${cmCompsHTML(d)}
  <div class="panel"><h3>The story so far</h3>${whyItMatters(d).map(x=>`<p class="small" style="margin:0 0 6px">${esc(x)}</p>`).join('')}</div></div>` };
}

// ---------- copy sheet ----------
function cmListForm(cp){
  const r=cmEst(cp.k, cp.g>0?cp.g:0, cp); const mid=nicePrice((r.lo+r.hi)/2); const f=UI.lf||(UI.lf={ty:'bin'});
  return `<div class="panel"><h3>Sell it</h3>
    <div class="seg" style="margin-top:6px"><button class="${f.ty==='bin'?'on':''}" data-act="lfty" data-a="bin">Buy now</button><button class="${f.ty==='auc'?'on':''}" data-act="lfty" data-a="auc">Auction</button></div>
    <div class="formrow"><label class="small muted" for="lprice">${f.ty==='bin'?'Price':'Starting bid'}</label><input class="inp money-in" type="number" id="lprice" min="0.5" step="0.5" value="${f.ty==='bin'?mid:nicePrice(Math.max(0.99,mid*0.5))}" data-inp="lfp">
      ${f.ty==='auc'?`<select class="inp" id="ldur" aria-label="Duration"><option value="3">3 days</option><option value="5" selected>5 days</option><option value="7">7 days</option></select>`:`<label class="small"><input type="checkbox" id="loff" checked> Accept offers</label>`}</div>
    <div class="small muted" id="lnet" style="margin-top:6px">${payoutTxt(f.ty==='bin'?mid:nicePrice(Math.max(0.99,mid*0.5)))}</div>
    <div class="formrow"><button class="btn pri" data-act="listit" data-a="m:${cp.id}">List it</button></div><div id="lmsg"></div></div>`;
}
function cmCopySheet(id){
  const cp=MC(id); if (!cp) return null; delete cp.nw; const d=cmD(cp.k), s=d.s; const mine=cp.o===0;
  const acq = cp.a ? ({bought:'Bought',won:'Won at auction',dug:'Dug out of the dollar bin',lot:'Came in a collection',preorder:'Preordered',found:'Found',inherited:'Inherited'}[cp.a[1]]||'Acquired')+(cp.a[2]?' for '+money(cp.a[2],true):'')+(cp.a[3]?' from '+cp.a[3]:'')+', '+fmtDate(cp.a[0],true) : '';
  const slot=Object.keys(G.player.show).find(k=>G.player.show[k]==='m'+cp.id);
  let act='';
  if (mine){
    if (cp.l) act=`<div class="panel"><h3>Listed for sale</h3><button class="btn" data-act="listing" data-a="${cp.l}">View your listing</button></div>`;
    else if (cp.g<0){ const sb=(G.player.csubs||[]).find(x=>x.cid===cp.id); act=`<div class="panel"><h3>${cp.g===-2?'At the presser':'At GCS Comics'}</h3><p class="small" style="margin:0">Due back ${sb?fmtDate(sb.t1,true):'soon'}.</p></div>`; }
    else act=cmListForm(cp) + (cp.g===0?`<div class="panel"><h3>Pressing and grading</h3><p class="small muted" style="margin:0 0 8px">Pressing flattens bends and waviness and a cleaning can lift light soil. It can't fix colour-breaking creases, tears or missing paper. GCS Comics seals the book with a grade and catches restoration.</p><div class="formrow"><button class="btn" data-act="cgradesheet" data-a="${cp.id}">Inspect for grading</button></div></div>`:'');
  }
  const note = mine? `<div class="panel"><h3>Your notes</h3><textarea class="inp" style="width:100%;min-height:60px" data-inp="note" data-cid="m${cp.id}" placeholder="Where you found it, what you paid, why it matters">${esc(G.player.notes['m'+cp.id]||'')}</textarea></div>` : '';
  return { t:d.title, h:`<div class="stack"><div class="detail"><div class="bigcard cm"><div class="face ${cp.g>0?'slab':''}">${cmThumb(cp)}</div></div><div class="stack">
    <div class="title-block"><div class="yr">${esc(pubName(s))}, ${monYr(d.day)}</div><h1>${esc(d.title)}</h1><div class="sub">${esc(d.label||'Cover A')}</div>${cmTags(d,cp)}</div>
    <dl class="kv"><dt>Issue</dt><dd>${iLink(cp.k,'All copies and sales')}</dd><dt>Series</dt><dd>${sLink(s)}</dd><dt>Estimated value</dt><dd class="est">${cmRange(cp.k,cp.g>0?cp.g:0,cp)}</dd>${cp.g>0?`<dt>Grade</dt><dd>GCS ${gTxt(cp.g)} ${CGN[cp.g]}${cp.gr?', restored ('+REST_N[cp.r].toLowerCase()+')':''}, cert ${cp.cert}</dd>`:''}${acq?`<dt>Acquired</dt><dd>${esc(acq)}</dd>`:''}${!mine?`<dt>Owner</dt><dd>${esc(ownerName(cp.o))}</dd>`:''}</dl>
    ${mine?`<div class="formrow"><button class="btn sm" data-act="cpin" data-a="${cp.id}">${slot!=null?'Remove from showcase':'Pin to showcase'}</button><button class="btn sm" data-act="cseries" data-a="${s.id}">Series</button></div>`:''}
    ${cp.g>0?`<div><b class="small">GCS population</b>${cmPopHTML(cp.k)}</div>`:cp.g===0?`<div><b class="small">${mine?'Condition in hand':'Condition'}</b>${cmInspectHTML(cp,!mine)}</div>`:''}
  </div></div>${act}${cmSalesPanel(cp.k, cp.g>0?cp.g:0, cp.g>0?'Sales at GCS '+gTxt(cp.g):'Raw sales')}${cmCompsHTML(d)}${historyHTML(cp)}${note}</div>` };
}
function cmGradeSheet(id){
  const cp=MC(id); if (!cp || cp.o!==0 || cp.g!==0 || cp.l) return null; const d=cmD(cp.k);
  const sg=cp.sg && cp.sg.s==='u';
  return { t:'Pressing and grading', h:`<div class="stack"><div class="detail"><div class="bigcard cm"><div class="face">${comicCover(cp.k)}</div></div><div class="stack">
    <div class="title-block"><div class="yr">${esc(cmSub(d))}</div><h1>${esc(d.title)}</h1></div>
    <dl class="kv"><dt>Raw today</dt><dd class="est">${cmRange(cp.k,0,cp)}</dd></dl>
    <div><b class="small">Your inspection</b>${cmInspectHTML(cp,false)}</div></div></div>
    <div class="panel"><h3>What slabs of this issue sell for</h3><table class="tbl"><tbody>${gradeTableKeys(d).map(g=>`<tr><td>GCS ${gTxt(g)} ${CGN[g]}</td><td class="r">${cmRange(cp.k,g)}</td></tr>`).join('')}</tbody></table><p class="small muted" style="margin:6px 0 0">Fees are paid up front. A slab on a book nobody wants is still a book nobody wants.</p></div>
    <div class="panel"><h3>Pressing and cleaning</h3><p class="small muted" style="margin:0 0 8px">${money(PRESS_FEE)}, back in ${PRESS_DAYS} days. Worth it when the problems are bends and waviness, not when they're creases or tears.</p><button class="btn" data-act="cpress" data-a="${cp.id}" data-confirm="Pay ${money(PRESS_FEE)}" ${G.player.cash<PRESS_FEE?'disabled':''}>Send for pressing</button></div>
    <div class="panel"><h3>GCS Comics grading</h3>${sg?`<label class="small" style="display:block;margin-bottom:8px"><input type="checkbox" id="cauth" checked> Authenticate the signature (+${money(AUTH_FEE)}). If it can't be verified, the slab will say so.</label>`:''}<div class="rows">${CGRADE_TIERS.map(T=>`<div class="row" style="cursor:default"><div class="rt"><b>${T.n}, ${money(T.fee)}</b><span>Back in ${T.days} days, around ${fmtDate(G.day+T.days)}</span></div><button class="btn ${T.id==='std'?'pri':''} sm" data-act="csubmit" data-a="${cp.id}:${T.id}" data-confirm="Pay ${money(T.fee)}${sg?'+':''}" ${G.player.cash<T.fee?'disabled':''}>Submit</button></div>`).join('')}</div></div></div>` };
}
ACT.ccopy = a=>{ UI.lf={ty:'bin'}; openSheet(()=>cmCopySheet(+a)); };
ACT.cgradesheet = a=>openSheet(()=>cmGradeSheet(+a));
ACT.cpress = (a,el)=>{ if (!armed(el)) return; const e=cmSubmitPress(+a); if (e){ showToast(e); return; } showToast('Sent for pressing. Back around '+fmtDate(G.day+PRESS_DAYS)+'.', true); closeSheet(); refresh(); afterAction(); };
ACT.csubmit = (a,el)=>{ if (!armed(el)) return; const [id,t]=a.split(':'); const au=$('#cauth'); const e=cmSubmitGrade(+id,t,au&&au.checked); if (e){ showToast(e); return; } showToast('Shipped to GCS Comics.', true); closeSheet(); refresh(); afterAction(); };
ACT.cpin = a=>{ const id='m'+a, sh=G.player.show; const k=Object.keys(sh).find(k=>sh[k]===id); if (k!=null) delete sh[k]; else { const free=[0,1,2,3,4,5].find(i=>!showItem(sh[i])); if (free==null){ showToast('Your showcase is full. Remove something first.'); return; } sh[free]=id; showToast('Pinned to showcase slot '+(free+1)); } refresh(); queueSave(); };
function showItem(v){ if (v==null) return null; if (typeof v==='string' && v[0]==='m'){ const c=MC(+v.slice(1)); return c&&c.o===0?{cm:c}:null; } const c=C(v); return c&&c.o===0?{card:c}:null; }

// ---------- series sheet ----------
function seriesChain(s){ let root=s; while (root.prev>=0 && G.cm.ser[root.prev]) root=G.cm.ser[root.prev]; const out=[root]; let cur=root; for (let i=0;i<30;i++){ const nx=G.cm.ser.find(x=>x.prev===cur.id); if (!nx) break; out.push(nx); cur=nx; } return out; }
function chainPanel(s){ const ch=seriesChain(s); if (ch.length<2) return ''; const total=ch.reduce((a,x)=>a+x.n,0);
  return `<div class="panel"><h3>Volumes</h3><p class="small muted" style="margin:0 0 6px">${esc(ch[0].t)} has been restarted ${ch.length-1} time${ch.length>2?'s':''}: ${total} issues across ${ch.length} volumes.</p><div class="rows">${ch.map(x=>`<button class="row ${x.id===s.id?'sel':''}" data-act="cseries" data-a="${x.id}"><div class="rt"><b>Volume ${x.vol}${x.id===s.id?' (this book)':''}</b><span>${yearOf(x.st)}${x.en?'–'+yearOf(x.en):'–now'} · ${x.n} issue${x.n===1?'':'s'} · ${x.sts==='on'?'publishing':x.sts==='ann'?'announced':x.sts==='cx'?'cancelled':'ended'}</span></div></button>`).join('')}</div></div>`; }
function seriesSheet(sid){
  const s=S_(sid); if (!s) return null; const W=CR_(s.w), A=CR_(s.a); const fol=cmFollowed().includes(s.id);
  const mine=myComics().filter(c=>{ const d=cmD(c.k); return d.sid===s.id && !d.tr; }); const ownN=new Set(mine.map(c=>cmD(c.k).n));
  const ads=s.ad.map(id=>G.cm.ad[id]);
  const prPts=s.pr.map((x,i)=>[i+1,x*100]).filter((_,i,arr)=>arr.length<60 || i%Math.ceil(arr.length/60)===0 || i===arr.length-1);
  const per=50; const pg=UI.spg||0; const nums=Array.from({length:s.n},(_,i)=>i+1).reverse(); const pageN=nums.slice(pg*per,pg*per+per);
  const lead = s.ch.map(CH_);
  const prev = s.prev>=0? S_(s.prev):null; const next=G.cm.ser.find(x=>x.prev===s.id);
  return { t:sTitle(s), h:`<div class="stack"><div class="detail">${s.n?`<div class="bigcard cm"><div class="face">${comicCover(mk(s.id,1,1,''))}</div></div>`:''}<div class="stack">
    <div class="title-block"><div class="yr">${esc(pubName(s))}${s.imp?' / '+esc(s.imp):''}</div><h1>${esc(sTitle(s))}</h1><div class="sub">${esc(CG[s.g].n)} ${s.fmt==='on'?'ongoing series':s.fmt==='ls'?(s.plan+'-issue limited series'):s.fmt==='gn'?'original graphic novel':'one-shot'}, ${yearOf(s.st)}${s.en?'–'+yearOf(s.en):'–present'}</div>${sigHTML(s)}</div>
    <p class="small" style="margin:0">${esc(s.prem)}</p>
    <dl class="kv"><dt>Created by</dt><dd>${crLink(W)}${A!==W?' and '+crLink(A):''}</dd>${lead.length?`<dt>Starring</dt><dd>${lead.map(chLink).join(', ')}</dd>`:''}<dt>Issues</dt><dd>${s.n}${s.sts==='on'&&s.nx>G.day?', next '+fmtDate(s.nx,true):''}</dd>${s.crit>=0?`<dt>Reviews</dt><dd>${s.crit>=0.82?'Acclaimed':s.crit>=0.66?'Strong':s.crit>=0.5?'Mixed to positive':s.crit>=0.35?'Mixed':'Poor'}</dd>`:''}${prev?`<dt>Previous volume</dt><dd>${sLink(prev)}</dd>`:''}${next?`<dt>Relaunched as</dt><dd>${sLink(next)}</dd>`:''}<dt>Your run</dt><dd>${ownN.size} of ${s.n} issues${s.n?' ('+Math.floor(ownN.size/s.n*100)+'%)':''}</dd></dl>
    <div class="formrow"><button class="btn sm" data-act="cfollow" data-a="${s.id}">${fol?'Following':'Follow series'}</button><button class="btn sm" data-act="cfind" data-a="${s.id}">Find on market</button></div>
  </div></div>
  ${s.n>=3?`<div class="panel"><h3>Print runs by issue</h3><p class="small muted" style="margin:0 0 4px">Estimated first-print orders. Orders chase demand a month or two late: when readers outrun orders, issues sell out.</p>${sparkSVG(prPts,{h:100,col:'var(--accent)'})}</div>`:''}
  ${ads.length?`<div class="panel"><h3>Screen adaptations</h3><div class="rows">${ads.map(a=>`<div class="row" style="cursor:default"><div class="rt"><b>${a.k==='film'?'Film':'TV series'}, ${esc(a.st)}</b><span>${a.end?(a.why==='released'||a.why==='ended'?'Released '+(a.out?'('+a.out+')':''):a.why==='false'?'Rumour proved false':a.why==='expired'?'Option expired':a.why==='cancelled'?'Cancelled':'Stalled in development')+', '+yearOf(a.end):(a.sg===0?'Rumoured':adStage(a))+(a.ssn?', '+a.ssn+' season'+(a.ssn>1?'s':''):'')}</span></div><div class="rv"><span>${monYr(a.t0)}</span></div></div>`).join('')}</div></div>`:''}
  ${s.notes.length?`<div class="panel"><h3>History</h3>${s.notes.slice().sort((a,b)=>a[0]-b[0]).map(x=>`<p class="small" style="margin:0 0 6px"><span class="muted">${monYr(x[0])}.</span> ${esc(x[1])}</p>`).join('')}</div>`:''}
  ${chainPanel(s)}
  <div class="panel"><h3>Issues</h3><div class="rows">${pageN.map(n=>{ const k=mk(s.id,n,1,''); const ks=issueKeys(s,n).map(x=>keyText(x,s)); return `<button class="row" data-act="design" data-a="${k}">${miniCKey(k)}<div class="rt"><b>#${n}${ownN.has(n)?' <span class="up small">owned</span>':''}</b><span>${monYr(issueDay(s,n))}${yearOf(issueDay(s,n))>=1975?', ~'+(s.pr[n-1]*100).toLocaleString()+' printed':''}${s.pp[n]?', went back to press':''}</span>${ks.length?`<span>${esc(ks.slice(0,2).join('; '))}</span>`:''}</div></button>`; }).join('')||'<div class="empty">Not out yet.</div>'}</div>${pager(s.n,per,pg,'spage')}</div>
  ${s.tr.length?`<div class="panel"><h3>Collected editions</h3><div class="rows">${s.tr.filter(e=>e[2]<=G.day).map(e=>issueRow(mk(s.id,e[0]+e[1],1,''))).join('')||'<div class="empty">Announced, not yet out.</div>'}</div></div>`:''}
  </div>` };
}
ACT.cseries = a=>{ UI.spg=0; openSheet(()=>seriesSheet(+a)); };
ACT.spage = a=>{ UI.spg=+a; refreshSheet(); };
ACT.cfollow = a=>{ const f=cmFollowed(), id=+a, i=f.indexOf(id); if (i>=0) f.splice(i,1); else f.push(id); refresh(); queueSave(); };
ACT.cfind = a=>{ const s=S_(+a); UI.mf={ q:s.t.toLowerCase(), type:'cm', fmt:'all', sort:'low', page:0 }; ACT.goto('market:browse'); };

// ---------- creators & characters ----------
function careerStage(c){ const yr=yearOf(G.day); if (c.ret) return 'Retired ('+c.ret+')'; const car=c.deb?yr-yearOf(c.deb):0; if (c.fame>2.4) return 'Industry legend'; if (c.fame>1.4) return 'Star'; if (car<=3) return 'Newcomer'; if (c.mom>0.15) return 'Rising'; return car>20?'Veteran':'Working professional'; }
function creatorSheet(id){
  const c=CR_(id); if (!c) return null; const fol=(G.player.crfol||[]).includes(c.id);
  const works=c.works.map(S_).sort((a,b)=>b.st-a.st);
  const aw=c.aw.filter(a=>a[2]==='W'), nm=c.aw.filter(a=>a[2]==='N');
  const f=c.first;
  return { t:c.n, h:`<div class="stack"><div class="title-block"><div class="yr">${esc(ROLE_N[c.r])}</div><h1>${esc(c.n)}</h1><div class="sub">${esc(careerStage(c))}</div></div>
    <dl class="kv"><dt>Active</dt><dd>${c.deb?yearOf(c.deb):'Not yet published'}${c.ret?'–'+c.ret:'–present'}</dd><dt>Genres</dt><dd>${[...new Set(c.g)].map(g=>CG[g].n).join(', ')}</dd>
      <dt>Following</dt><dd>${c.fame>2.4?'Huge':c.fame>1.4?'Large':c.fame>0.7?'Solid':c.fame>0.3?'Modest':'Small'}${c.mom>0.12?', growing':c.mom<-0.12?', fading':''}</dd><dt>Critics</dt><dd>${c.crit>=0.8?'Highly regarded':c.crit>=0.62?'Respected':c.crit>=0.45?'Mixed':'Unconvinced'}</dd>
      <dt>Awards</dt><dd>${aw.length?aw.length+' win'+(aw.length>1?'s':''):'No wins'}${nm.length?', '+nm.length+' nomination'+(nm.length>1?'s':''):''}</dd>${f?`<dt>First published work</dt><dd>${iLink(mk(f[0],Math.max(1,f[1]),1,''))}</dd>`:''}</dl>
    <div class="formrow"><button class="btn sm" data-act="crfollow" data-a="${c.id}">${fol?'Following':'Follow creator'}</button></div>
    ${aw.length?`<div class="panel"><h3>${AWARD_NAME}</h3>${aw.map(a=>`<p class="small" style="margin:0 0 4px">${a[0]}: ${esc((AWARD_CATS.find(x=>x[0]===a[1])||['',''])[1])}</p>`).join('')}</div>`:''}
    <div class="panel"><h3>Bibliography</h3><div class="rows">${works.map(s=>seriesRow(s, `<span>${s.w===c.id&&s.a===c.id?'W/A':s.w===c.id?'Writer':s.a===c.id?'Artist':'Credits'}</span>`)).join('')||'<div class="empty">Nothing yet.</div>'}</div></div></div>` };
}
ACT.ccreator = a=>openSheet(()=>creatorSheet(+a));
ACT.crfollow = a=>{ const f=G.player.crfol||(G.player.crfol=[]), id=+a, i=f.indexOf(id); if (i>=0) f.splice(i,1); else f.push(id); refresh(); queueSave(); };
function charSheet(id){
  const c=CH_(id); if (!c) return null; const keys=[]; for (const sid of new Set([c.s0,...c.ser])){ const s=S_(sid); if (!s) continue; for (const k of s.keys) if (k[2]===c.id && ['fa','cam','ss','dth','ret','cos','ori','team'].includes(k[1])) keys.push([s,k]); }
  keys.sort((a,b)=>issueDay(a[0],a[1][0])-issueDay(b[0],b[1][0]));
  const own=new Set(myComics().map(x=>x.k));
  const pop = charHeat(c); const ads=c.ad.map(i=>G.cm.ad[i]);
  return { t:c.n, h:`<div class="stack"><div class="title-block"><div class="yr">${esc(CG[c.g].n)}${c.team?' team':' character'}</div><h1>${esc(c.n)}</h1>${c.civ?`<div class="sub">${esc(c.civ)}</div>`:''}</div>
    <dl class="kv"><dt>Created by</dt><dd>${[...new Set(c.cr)].filter(x=>x>=0).map(x=>crLink(CR_(x))).join(', ')}</dd>${c.fa?`<dt>First appearance</dt><dd>${iLink(mk(c.fa[0],c.fa[1],1,''))}</dd>`:''}${c.cam?`<dt>First cameo</dt><dd>${iLink(mk(c.cam[0],c.cam[1],1,''))}</dd>`:''}
      <dt>Fan interest</dt><dd>${pop>8?'Cultural icon':pop>4?'Very high':pop>2?'High':pop>0.8?'Moderate':pop>0.3?'Low':'Obscure'}</dd>${c.dead?'<dt>Status</dt><dd>Currently dead</dd>':''}${c.mem?`<dt>Members</dt><dd>${c.mem.map(m=>chLink(CH_(m))).join(', ')}</dd>`:''}</dl>
    ${c.cam&&c.fa?`<div class="note small">${esc(debateNote(S_(c.fa[0]),c.fa[1])[0]||'')}</div>`:''}
    <div class="panel"><h3>Key appearances</h3><div class="rows">${keys.map(([s,k])=>{ const key=mk(s.id,k[0],1,''); return issueRow(key, own.has(key)?'<span class="up">Owned</span>':'', keyText(k,s)); }).join('')||'<div class="empty">None recorded.</div>'}</div></div>
    ${c.ser.length?`<div class="panel"><h3>Series</h3><div class="rows">${c.ser.map(S_).map(s=>seriesRow(s)).join('')}</div></div>`:''}
    ${ads.length?`<div class="panel"><h3>On screen</h3>${ads.map(a=>`<p class="small" style="margin:0 0 4px">${a.k==='film'?'Film':'TV'} from ${esc(a.st)}: ${a.end?(a.out||a.why):(a.sg===0?'rumoured':adStage(a))}</p>`).join('')}</div>`:''}
    ${c.h.length?`<div class="panel"><h3>Moments</h3>${c.h.map(x=>`<p class="small" style="margin:0 0 4px"><span class="muted">${monYr(x[0])}.</span> ${esc(x[1])}</p>`).join('')}</div>`:''}</div>` };
}
ACT.cchar = a=>openSheet(()=>charSheet(+a));

// ---------- the comics tab ----------
function newThisWeek(){ const sh=G.cm.shop; return sh? sh.newi : []; }
function hotIssues(){
  const m=new Map(); for (const f of G.feed){ if (f[1][0]!=='M' || f[0]<G.day-21) continue; const e=m.get(f[1])||[0,0,[]]; e[0]++; e[1]+=f[2]; e[2].push(f[2]); m.set(f[1],e); }
  for (const k in G.sales){ if (k[0]!=='M') continue; const r=G.sales[k].filter(x=>x[0]>=G.day-14); if (r.length<2) continue; const e=m.get(k)||[0,0,[]]; e[0]+=r.length; e[1]+=r.reduce((a,x)=>a+x[1],0); e[2]=e[2].concat(r.map(x=>x[1])); m.set(k,e); }
  return [...m.entries()].map(([k,e])=>[k,e[0]*Math.sqrt(e[1]/e[0]),median(e[2])]).sort((a,b)=>b[1]-a[1]).slice(0,8);
}
function toFollow(){ return G.cm.act.map(S_).filter(s=>s.n>=1 && s.sts==='on').map(s=>[s, signals(s).filter(x=>x[1]==='up').length + (tierOf(s)>=2?0.5:0)]).filter(x=>x[1]>=1).sort((a,b)=>b[1]-a[1]).slice(0,6).map(x=>x[0]); }
function cmNewsRow(n){ const s=n.cs!=null?S_(n.cs):null; const c=n.cc!=null?CH_(n.cc):null; return `<div class="newsrow"><b>${esc(n.h)}</b><p>${esc(n.b)}</p><div class="meta">${fmtDate(n.t)}${s?` <span aria-hidden="true">|</span> ${sLink(s)}`:''}${c?` <span aria-hidden="true">|</span> ${chLink(c)}`:''}</div></div>`; }
function newRow(e){ const [key,q,price]=e; const d=cmD(key); const s=d.s; return `<div class="row" data-act="design" data-a="${esc(key)}">${miniCKey(key)}<div class="rt"><b>${esc(d.title)}</b><span>${esc([d.label!=='Cover A'?d.label:'', pubName(s), CG[s.g].n].filter(Boolean).join(', '))}</span><span>${cmTags(d)}${d.n===1?'<span class="tag">New series</span>':''}</span><span class="${q<=0?'down':q<=2?'down':''}">${q<=0?'Sold out':q<=2?'Only '+q+' left':q+' on the rack'}</span></div><button class="btn ${q>0?'pri':''} sm" data-act="cbuynew" data-a="${esc(key)}" data-confirm="Pay ${money(price,true)}" ${q<=0||G.player.cash<price?'disabled':''}>${money(price,true)}</button></div>`; }
function cmHome(){
  const nw=newThisWeek().filter(e=>!cmD(e[0]).v||cmD(e[0]).v==='B').slice(0,6); const up=solicitations().slice(0,5);
  const news=G.news.filter(n=>n.k==='comic').slice(0,5); const hot=hotIssues(); const tf=toFollow(); const fol=cmFollowed().map(S_).filter(Boolean);
  const mine=myComics(); let lo=0,hi=0; for (const c of mine){ const r=cmEst(c.k,c.g>0?c.g:0,c); lo+=r.lo; hi+=r.hi; }
  const csubs=G.player.csubs||[]; const sales=G.feed.filter(f=>f[1][0]==='M').slice(0,6);
  return `${tip('comics', `<b>${SHOP_NAME}</b> gets new comics every Wednesday. Most books stay cheap forever. Some don't. Watch the signals: sellouts, second printings, reviews, award nominations and adaptation news. None of them guarantee anything.`)}
  <div class="kpis"><div class="kpi"><small>Comics owned</small><b>${mine.length}</b></div><div class="kpi"><small>Comic collection estimate</small><b>${rng2([lo,hi])}</b></div><div class="kpi"><small>Preorders</small><b>${G.cm.pre.length}</b></div><div class="kpi"><small>At GCS or pressing</small><b>${csubs.length}</b></div></div>
  <div class="cols" style="margin-top:14px"><div class="stack">
    <div class="panel"><div class="phead"><h3>New this week</h3><button class="linkbtn" data-act="sub" data-a="comics:week">All ${newThisWeek().length}</button></div><div class="rows">${nw.map(newRow).join('')||'<div class="empty">New comics arrive Wednesday.</div>'}</div></div>
    <div class="panel"><div class="phead"><h3>Comic news</h3><button class="linkbtn" data-act="sub" data-a="comics:news">All news</button></div>${news.map(cmNewsRow).join('')||'<div class="empty">Quiet week.</div>'}</div>
    <div class="panel"><div class="phead"><h3>Upcoming releases</h3><button class="linkbtn" data-act="sub" data-a="comics:week">Preorder</button></div><div class="rows">${up.map(x=>`<button class="row" data-act="cseries" data-a="${x.s.id}"><div class="rt"><b>${esc(sTitle(x.s))} #${x.n}</b><span>${esc(pubName(x.s))}, ${esc(CG[x.s.g].n)}${x.n===1?', new series':''}</span></div><div class="rv"><b>${fmtDate(x.d)}</b></div></button>`).join('')}</div></div>
  </div><div class="stack">
    <div class="panel"><div class="phead"><h3>Hot issues</h3></div><div class="rows">${hot.map(([k,,m])=>issueRow(k,`<b>${money(m,true)}</b><span>median sale</span>`)).join('')||'<div class="empty">No heat yet.</div>'}</div></div>
    <div class="panel"><div class="phead"><h3>${fol.length?'Series you follow':'Series worth watching'}</h3><button class="linkbtn" data-act="sub" data-a="comics:series">Browse</button></div><div class="rows">${(fol.length?fol:tf).slice(0,6).map(s=>seriesRow(s)).join('')||'<div class="empty">Nothing stands out yet.</div>'}</div></div>
    <div class="panel"><div class="phead"><h3>Recent comic sales</h3><button class="linkbtn" data-act="goto" data-a="market:sales">More</button></div><div class="rows">${sales.map(f=>issueRow(f[1],`<b>${money(f[2],true)}</b><span>${f[3]>0?'GCS '+gTxt(f[3]):'raw'}</span>`)).join('')||'<div class="empty">No notable sales yet.</div>'}</div></div>
    ${csubs.length?`<div class="panel"><div class="phead"><h3>Grading and pressing</h3><button class="linkbtn" data-act="goto" data-a="grade:comics">Grading</button></div><div class="rows">${csubs.map(x=>{ const cp=MC(x.cid); return cp?`<button class="row" data-act="ccopy" data-a="${cp.id}">${miniComic(cp)}<div class="rt"><b>${esc(cmD(cp.k).title)}</b><span>${x.kind==='press'?'Pressing':'GCS'}, due ${fmtDate(x.t1)}</span></div></button>`:''; }).join('')}</div></div>`:''}
  </div></div>`;
}
function cmWeekView(){
  const nw=newThisWeek(); const sol=solicitations(); const pre=G.cm.pre;
  return `${tip('week', `New comics land every Wednesday at cover price. You flip through the stack for the cleanest copy. Hot books and variants sell out fast. Preorders reserve a copy at cover price, paid when it arrives, and close a week before release.`)}
  <div class="panel"><div class="phead"><h3>On the new-release rack</h3><span class="muted small">Week of ${fmtDate(G.cm.shop?G.cm.shop.wk:G.day,true)}</span></div><div class="rows">${nw.map(newRow).join('')||'<div class="empty">Nothing yet this week.</div>'}</div></div>
  ${pre.length?`<div class="panel" style="margin-top:14px"><h3>Your preorders</h3><div class="rows">${pre.map((p,i)=>{ const s=S_(p.sid); return `<div class="row" style="cursor:default"><div class="rt"><b>${esc(sTitle(s))} #${p.n}${p.v?' '+esc(VAR_N(p.v)):''}</b><span>Arrives ${fmtDate(p.d)}, ${money(coverPrice(yearOf(p.d),tierOf(s),s.fmt)/100,true)}</span></div><button class="btn sm" data-act="cunpre" data-a="${i}">Cancel</button></div>`; }).join('')}</div></div>`:''}
  <div class="panel" style="margin-top:14px"><div class="phead"><h3>Solicited: the next nine weeks</h3></div><div class="rows">${sol.map(x=>{ const s=x.s; const W=CR_(s.w), A=CR_(s.a); const open=x.d>G.day+6; return `<div class="row" data-act="cseries" data-a="${s.id}"><div class="rt"><b>${esc(sTitle(s))} #${x.n}${x.n===1?' <span class="tag rc">New #1</span>':''}</b><span>${esc(pubName(s))}, ${esc(CG[s.g].n)}, ${fmtDate(x.d)}</span><span>${esc(W.n)}${A!==W?' and '+esc(A.n):''}${x.n===1?': '+esc(s.prem):''}</span></div><button class="btn sm" data-act="cpre" data-a="${s.id}:${x.n}" ${open?'':'disabled'}>${open?'Preorder':'Orders closed'}</button></div>`; }).join('')||'<div class="empty">No solicitations.</div>'}</div></div>`;
}
function cmShopView(){
  const sh=G.cm.shop||{back:[],bin:[],gn:[],lots:[],dug:0};
  const back=sh.back.filter(x=>G.mc[x[0]]); const keys=back.filter(x=>{ const d=cmD(G.mc[x[0]].k); return !d.tr && (d.n===1 || issueKeys(d.s,d.n).length); });
  const vars=newThisWeek().filter(e=>{ const d=cmD(e[0]); return d.v && d.v!=='B'; });
  const shown=sh.bin.slice(0, sh.dug*10).map(MC).filter(c=>c && c.o===SHOP_ID);
  return `${tip('cshop', `The back-issue wall is priced by the shop, which knows its keys. The dollar bin is priced from an old guide and a quick glance: mostly filler, now and then something the shop missed. Look closely before you get excited.`)}
  <div class="panel"><div class="phead"><h3>The dollar bin</h3><span class="muted small">${sh.bin.length} comics, refilled Wednesdays</span></div>
    <p class="small muted" style="margin:0 0 8px">Every comic in here is $1. Flip through a stack at a time.</p>
    ${shown.length?`<div class="grid">${shown.map(c=>`<button class="gcell" data-act="cshopcopy" data-a="${c.id}:bin"><div class="thumb cmthumb">${comicCover(c.k)}</div><div class="cap"><b>${esc(cmD(c.k).title)}</b><span>${cmD(c.k).yr}</span></div></button>`).join('')}</div>`:''}
    <div class="formrow">${sh.dug*10<sh.bin.length?`<button class="btn pri" data-act="cdig">${sh.dug?'Flip through the next stack':'Start digging'}</button>`:'<span class="small muted">You\'ve been through the whole bin this week.</span>'}</div></div>
  <div class="panel" style="margin-top:14px"><div class="phead"><h3>Back-issue wall</h3><span class="muted small">Priced by the shop</span></div><div class="grid">${back.map(x=>{ const c=MC(x[0]); return `<button class="gcell" data-act="cshopcopy" data-a="${c.id}:back"><div class="thumb cmthumb">${comicCover(c.k)}</div><div class="cap"><b>${esc(cmD(c.k).title)}</b><span>${money(x[1],true)}</span></div></button>`; }).join('')||'<div class="empty">The wall is bare.</div>'}</div></div>
  ${keys.length?`<div class="panel" style="margin-top:14px"><h3>Key issues on the wall</h3><div class="rows">${keys.map(x=>{ const c=MC(x[0]); const d=cmD(c.k); return `<button class="row" data-act="cshopcopy" data-a="${c.id}:back">${miniCKey(c.k)}<div class="rt"><b>${esc(d.title)}</b><span>${esc(issueKeys(d.s,d.n).map(k=>keyText(k,d.s)).slice(0,1).join('')||'First issue')}</span></div><div class="rv"><b>${money(x[1],true)}</b></div></button>`; }).join('')}</div></div>`:''}
  ${vars.length?`<div class="panel" style="margin-top:14px"><h3>Variant covers this week</h3><div class="rows">${vars.map(newRow).join('')}</div></div>`:''}
  <div class="panel" style="margin-top:14px"><h3>Collections for sale</h3><p class="small muted" style="margin:0 0 6px">Sold as-is. The seller lists the obvious books; the rest you find out when you open the boxes.</p><div class="rows">${sh.lots.map(L_=>`<button class="row" data-act="clot" data-a="${L_.id}"><div class="rt"><b>${esc(L_.kn)}: ${L_.n} comics</b><span>${esc(L_.desc)}</span>${L_.hl.length?`<span>Seller mentions ${esc(L_.hl.join(', '))}</span>`:''}</div><div class="rv"><b>${money(L_.price)}</b><span>until ${fmtDate(L_.exp)}</span></div></button>`).join('')||'<div class="empty">No collections this week. They come and go.</div>'}</div></div>
  <div class="panel" style="margin-top:14px"><h3>Graphic novels and collected editions</h3><div class="rows">${sh.gn.map(e=>{ const [key,q,price]=e; const d=cmD(key); return `<div class="row" data-act="design" data-a="${esc(key)}">${miniCKey(key)}<div class="rt"><b>${esc(d.title)}</b><span>${esc(d.label||pubName(d.s))}</span><span class="${q<=0?'down':''}">${q<=0?'Out of stock':q+' on the shelf'}</span></div><button class="btn sm" data-act="cbuygn" data-a="${esc(key)}" data-confirm="Pay ${money(price,true)}" ${q<=0||G.player.cash<price?'disabled':''}>${money(price,true)}</button></div>`; }).join('')||'<div class="empty">Shelf restocks Wednesday.</div>'}</div></div>`;
}
function shopCopySheet(id, from){
  const cp=MC(id); if (!cp || cp.o!==SHOP_ID) return {t:'Sold', h:'<div class="empty">Someone else bought it.</div>'}; const d=cmD(cp.k);
  const price = from==='bin'?1:(G.cm.shop.back.find(x=>x[0]===id)||[0,0])[1];
  return { t:d.title, h:`<div class="stack"><div class="detail"><div class="bigcard cm"><div class="face">${comicCover(cp.k)}</div></div><div class="stack">
    <div class="title-block"><div class="yr">${esc(cmSub(d))}</div><h1>${esc(d.title)}</h1>${cmTags(d,cp)}</div>
    <dl class="kv"><dt>Series</dt><dd>${sLink(d.s)}</dd><dt>Shop price</dt><dd class="est">${money(price,true)}</dd></dl>
    <div><b class="small">Condition in hand</b>${cmInspectHTML(cp,false)}</div>
    <div class="formrow"><button class="btn pri" data-act="cbuyshop" data-a="${id}:${from}" data-confirm="Pay ${money(price,true)}" ${G.player.cash<price?'disabled':''}>Buy for ${money(price,true)}</button><button class="btn" data-act="design" data-a="${esc(cp.k)}">Look it up</button></div></div></div></div>` };
}
function lotSheet(id){
  const L_=(G.cm.shop.lots||[]).find(l=>l.id===id); if (!L_) return null;
  return { t:L_.kn, h:`<div class="stack"><div class="title-block"><div class="yr">${L_.n} comics</div><h1>${esc(L_.kn)}</h1><div class="sub">${esc(L_.desc)}</div></div>
    <dl class="kv"><dt>Asking</dt><dd class="est">${money(L_.price)}</dd><dt>Per book</dt><dd>${money(L_.price/L_.n,true)}</dd><dt>Mostly from</dt><dd>${L_.kind==='estate'?'the '+L_.era+'s onward':L_.kind==='garage'?'the '+L_.era+'s':'all eras'}</dd><dt>Available until</dt><dd>${fmtDate(L_.exp,true)}</dd></dl>
    ${L_.hl.length?`<div class="panel"><h3>What the seller mentions</h3>${L_.hl.map(x=>`<p class="small" style="margin:0 0 4px">${esc(x)}</p>`).join('')}<p class="small muted" style="margin:6px 0 0">Condition unknown until the boxes are open.</p></div>`:'<p class="small muted">The seller didn\'t list any highlights.</p>'}
    <div class="formrow"><button class="btn pri" data-act="cbuylot" data-a="${L_.id}" data-confirm="Pay ${money(L_.price)}" ${G.player.cash<L_.price?'disabled':''}>Buy the collection</button></div></div>` };
}
ACT.cbuynew = (a,el,e)=>{ if (e) e.stopPropagation(); if (!armed(el)) return; const err=buyNewIssue(a); if (err){ showToast(err); return; } showToast('Bought '+cmD(a).title, true); refresh(); afterAction(); };
ACT.cbuygn = (a,el,e)=>{ if (e) e.stopPropagation(); if (!armed(el)) return; const err=buyGN(a); if (err){ showToast(err); return; } showToast('Bought '+cmD(a).title, true); refresh(); afterAction(); };
ACT.cshopcopy = a=>{ const [id,f]=a.split(':'); openSheet(()=>shopCopySheet(+id,f)); };
ACT.cbuyshop = (a,el)=>{ if (!armed(el)) return; const [id,f]=a.split(':'); const err=buyShopCopy(+id,f); if (err){ showToast(err); return; } showToast('It\'s yours. Find it in Collection, Comics.', true); closeSheet(); refresh(); afterAction(); };
ACT.cdig = ()=>{ const sh=G.cm.shop; sh.dug=Math.min(Math.ceil(sh.bin.length/10), sh.dug+1); render(true); queueSave(); };
ACT.clot = a=>openSheet(()=>lotSheet(+a));
ACT.cbuylot = (a,el)=>{ if (!armed(el)) return; const err=buyLot(+a); if (err){ showToast(err); return; } const L_=G.player.lastLot; showToast('Bought '+L_.ids.length+' comics. They\'re in Collection, Comics, marked New.', true); closeSheet(); UI.ccf.f='new'; ACT.goto('coll:comics'); afterAction(); };
ACT.cpre = (a,el,e)=>{ if (e) e.stopPropagation(); const [sid,n]=a.split(':').map(Number); const err=preorder(sid,n,''); showToast(err||'Preordered. Pay cover price when it arrives.', !err); refresh(); queueSave(); };
ACT.cunpre = a=>{ G.cm.pre.splice(+a,1); refresh(); queueSave(); };
function cmSeriesView(){
  const f=UI.csf; const q=UI.csq.trim().toLowerCase(); const words=q?q.split(/\s+/):[];
  let arr=G.cm.ser.filter(s=>s.n>0 || s.sts==='ann');
  if (f.g>=0) arr=arr.filter(s=>s.g===f.g);
  if (f.st==='on') arr=arr.filter(s=>s.sts==='on'||s.sts==='ann'); else if (f.st==='end') arr=arr.filter(s=>s.sts==='end'||s.sts==='cx'); else if (f.st==='new') arr=arr.filter(s=>s.st>G.day-365 && (s.n>0||s.sts==='ann')); else if (f.st==='fol') arr=arr.filter(s=>cmFollowed().includes(s.id)); else if (f.st==='indie') arr=arr.filter(s=>tierOf(s)>=2);
  if (words.length) arr=arr.filter(s=>{ const t=(s.t+' '+pubName(s)+' '+CG[s.g].n+' '+CR_(s.w).n+' '+CR_(s.a).n+' '+yearOf(s.st)+' '+s.ch.map(id=>CH_(id).n).join(' ')).toLowerCase(); return words.every(w=>t.includes(w)); });
  const sorters={ heat:(a,b)=>(b.heat+b.spec)-(a.heat+a.spec), new:(a,b)=>b.st-a.st, old:(a,b)=>a.st-b.st, long:(a,b)=>b.n-a.n };
  arr.sort(sorters[f.sort]||sorters.heat);
  const per=30, pg=Math.min(UI.cspg||0, Math.max(0,Math.ceil(arr.length/per)-1));
  const chip=(k,n)=>`<button class="chip ${f.st===k?'on':''}" data-act="csst" data-a="${k}">${n}</button>`;
  return `<div class="tools"><input class="inp grow" type="search" placeholder="Title, publisher, creator, character, year" value="${esc(UI.csq)}" data-inp="csq" aria-label="Search series">
    <select class="inp" data-chg="csg" aria-label="Genre"><option value="-1">All genres</option>${CG.map((g,i)=>`<option value="${i}" ${f.g===i?'selected':''}>${esc(g.n)}</option>`).join('')}</select>
    <select class="inp" data-chg="cssort" aria-label="Sort">${[['heat','Most talked about'],['new','Newest'],['old','Oldest'],['long','Longest running']].map(([k,n])=>`<option value="${k}" ${f.sort===k?'selected':''}>${n}</option>`).join('')}</select></div>
    <div class="chips" style="margin-bottom:10px">${chip('on','Publishing now')}${chip('new','New in the last year')}${chip('all','Everything ever')}${chip('end','Ended')}${chip('indie','Indie and small press')}${chip('fol','Following')}</div>
    <div class="panel"><div class="small muted" style="margin-bottom:4px">${arr.length} series</div><div class="rows">${arr.slice(pg*per,pg*per+per).map(s=>seriesRow(s)).join('')||'<div class="empty">Nothing matches.</div>'}</div>${pager(arr.length,per,pg,'cspage')}</div>`;
}
let csqT=null; ACT.csq = v=>{ UI.csq=v; UI.cspg=0; clearTimeout(csqT); csqT=setTimeout(()=>{ const a=document.activeElement; const pos=a&&a.selectionStart; render(true); const i=$('[data-inp="csq"]'); if (i){ i.focus(); try{ i.setSelectionRange(pos,pos); }catch(e){} } }, 250); };
ACT.csg = v=>{ UI.csf.g=+v; UI.cspg=0; render(true); }; ACT.cssort = v=>{ UI.csf.sort=v; UI.cspg=0; render(true); }; ACT.csst = a=>{ UI.csf.st=a; UI.cspg=0; render(true); }; ACT.cspage = a=>{ UI.cspg=+a; render(); window.scrollTo(0,0); };
function cmCreatorsView(){
  const q=UI.crq.trim().toLowerCase(); const act=G.cm.cr.filter(c=>c.deb && (c.r==='W'||c.r==='A'||c.r==='WA'||c.r==='C'));
  const res = q? act.filter(c=>c.n.toLowerCase().includes(q)).slice(0,40) : [];
  const stars=act.filter(c=>!c.ret).sort((a,b)=>b.fame-a.fame).slice(0,12);
  const rising=act.filter(c=>!c.ret && c.deb>G.day-365*6).sort((a,b)=>b.mom-a.mom || b.fame-a.fame).slice(0,10);
  const fol=(G.player.crfol||[]).map(CR_);
  const row=c=>`<button class="row" data-act="ccreator" data-a="${c.id}"><div class="rt"><b>${esc(c.n)}</b><span>${esc(ROLE_N[c.r])}, ${esc(careerStage(c))}</span><span>${c.works.slice(-2).map(id=>esc(S_(id).t)).join(', ')}</span></div></button>`;
  return `<div class="tools"><input class="inp grow" type="search" placeholder="Search writers and artists" value="${esc(UI.crq)}" data-inp="crq" aria-label="Search creators"></div>
  ${q?`<div class="panel"><div class="rows">${res.map(row).join('')||'<div class="empty">No one by that name.</div>'}</div></div>`:''}
  <div class="cols" style="margin-top:12px"><div class="stack">${fol.length?`<div class="panel"><h3>Following</h3><div class="rows">${fol.map(row).join('')}</div></div>`:''}<div class="panel"><h3>Biggest names working today</h3><div class="rows">${stars.map(row).join('')}</div></div></div>
  <div class="panel"><h3>Newer creators with momentum</h3><div class="rows">${rising.map(row).join('')||'<div class="empty">None yet.</div>'}</div></div></div>`;
}
let crqT=null; ACT.crq = v=>{ UI.crq=v; clearTimeout(crqT); crqT=setTimeout(()=>{ const a=document.activeElement; const pos=a&&a.selectionStart; render(true); const i=$('[data-inp="crq"]'); if (i){ i.focus(); try{ i.setSelectionRange(pos,pos); }catch(e){} } }, 250); };
function cmScreenView(){
  const live=G.cm.ad.filter(a=>!a.end && a.sg<8).sort((a,b)=>b.sg-a.sg||b.t-a.t); const air=G.cm.ad.filter(a=>!a.end && a.sg===8).sort((a,b)=>b.t-a.t); const past=G.cm.ad.filter(a=>a.end && a.end>G.day-365*4).sort((a,b)=>b.end-a.end).slice(0,20);
  const row=a=>{ const s=S_(a.sid); return `<button class="row" data-act="cseries" data-a="${s.id}">${miniCKey(mk(s.id,1,1,''))}<div class="rt"><b>${esc(s.t)}</b><span>${a.k==='film'?'Film':'TV series'}, ${esc(a.st)}</span><span class="${a.end?(a.out==='hit'||a.out==='solid'||a.out==='cult'?'up':'down'):''}">${a.end?({released:'Released: '+a.out, ended:'Ended after '+a.ssn+' season'+(a.ssn>1?'s':''), false:'Rumour proved false', expired:'Option expired', stalled:'Stalled in development', cancelled:'Cancelled'}[a.why]||a.why):(a.sg===0?'Unconfirmed rumour':a.sg===8?(a.k==='film'?'In release ('+a.out+')':'Airing, '+a.ssn+' season'+(a.ssn>1?'s':'')+' ('+a.out+')'):adStage(a)[0].toUpperCase()+adStage(a).slice(1))}</span></div><div class="rv"><span>since ${monYr(a.t)}</span></div></button>`; };
  return `${tip('screen', `Adaptations move in stages: rumour, option, writers, a director or network, a greenlight, casting, production, a trailer, release. An option is a studio paying to wait; most never go further. A greenlight is the first stage where things usually get made. The release decides everything.`)}
  <div class="cols"><div class="panel"><h3>In the pipeline</h3><div class="rows">${live.map(row).join('')||'<div class="empty">Nothing in development.</div>'}</div></div>
  <div class="stack">${air.length?`<div class="panel"><h3>On screen now</h3><div class="rows">${air.map(row).join('')}</div></div>`:''}<div class="panel"><h3>How recent projects turned out</h3><div class="rows">${past.map(row).join('')||'<div class="empty">Nothing recent.</div>'}</div></div></div></div>`;
}
function cmNewsView(){ const only=UI.cnf==='f'; const fol=new Set(cmFollowed()); const ns=G.news.filter(n=>n.k==='comic' && (!only || fol.has(n.cs))).slice(0,80);
  return `<div class="chips" style="margin-bottom:10px"><button class="chip ${only?'':'on'}" data-act="cnf" data-a="a">Everything</button><button class="chip ${only?'on':''}" data-act="cnf" data-a="f">Series you follow</button></div><div class="panel">${ns.map(cmNewsRow).join('')||'<div class="empty">'+(only?'Follow series to filter news here.':'No comic news yet.')+'</div>'}</div>`; }
ACT.cnf = a=>{ UI.cnf=a; render(true); };
VIEWS.comics = ()=>{
  if (!G.cm) return '<div class="empty">The comic shop is still being built.</div>';
  const s=UI.sub.comics; const tabs=[['home','Home'],['week','New this week'],['shop','Comic shop'],['series','Series'],['creators','Creators'],['screen','Screen'],['news','News']];
  const body = s==='week'?cmWeekView(): s==='shop'?cmShopView(): s==='series'?cmSeriesView(): s==='creators'?cmCreatorsView(): s==='screen'?cmScreenView(): s==='news'?cmNewsView(): cmHome();
  return `<div class="pagetitle"><h1>Comics</h1><span class="muted small">${SHOP_NAME}</span></div><div class="subtabs">${tabs.map(([k,n])=>`<button class="${s===k?'on':''}" data-act="sub" data-a="comics:${k}">${n}</button>`).join('')}</div>${body}`;
};

// ---------- collection: comics & runs ----------
UI.ccf={q:'', f:'all', sort:'new', page:0};
function cmCollFiltered(){
  const f=UI.ccf; const q=f.q.trim().toLowerCase(); const words=q?q.split(/\s+/):[];
  let a=myComics().filter(c=>{ const d=cmD(c.k), s=d.s;
    if (f.f==='new' && !c.nw) return false; if (f.f==='graded' && !(c.g>0)) return false; if (f.f==='raw' && c.g!==0) return false; if (f.f==='listed' && !c.l) return false;
    if (f.f==='keys' && (d.tr || !(d.n===1 || issueKeys(s,d.n).length))) return false; if (f.f==='signed' && !c.sg) return false; if (f.f==='var' && !d.v) return false;
    if (words.length){ const t=(d.title+' '+pubName(s)+' '+CG[s.g].n+' '+d.yr+' '+(d.label||'')).toLowerCase(); if (!words.every(w=>t.includes(w))) return false; }
    return true; });
  const val=c=>cmCopyValue(c);
  if (f.sort==='val') a.sort((x,y)=>val(y)-val(x)); else if (f.sort==='title') a.sort((x,y)=>cmD(x.k).title.localeCompare(cmD(y.k).title)); else if (f.sort==='year') a.sort((x,y)=>cmD(x.k).day-cmD(y.k).day); else a.sort((x,y)=>y.id-x.id);
  return a;
}
function cmCollComics(){
  const f=UI.ccf; const all=cmCollFiltered(); const per=48; const page=Math.min(f.page, Math.max(0,Math.ceil(all.length/per)-1));
  const chip=(k,n)=>`<button class="chip ${f.f===k?'on':''}" data-act="ccff" data-a="${k}">${n}</button>`; const nNew=myComics().filter(c=>c.nw).length;
  return `<div class="tools"><input class="inp grow" type="search" placeholder="Search your comics" value="${esc(f.q)}" data-inp="ccfq" aria-label="Search comics">
    <select class="inp" data-chg="ccfsort" aria-label="Sort">${[['new','Newest'],['val','Value'],['title','Title'],['year','Year']].map(([k,n])=>`<option value="${k}" ${f.sort===k?'selected':''}>${n}</option>`).join('')}</select></div>
    <div class="chips" style="margin-bottom:12px">${chip('all','All')}${chip('new','New'+(nNew?' ('+nNew+')':''))}${chip('keys','Keys and #1s')}${chip('graded','Graded')}${chip('raw','Raw')}${chip('signed','Signed')}${chip('var','Variants')}${chip('listed','Listed')}</div>
    <div class="small muted" style="margin-bottom:8px">${all.length} comic${all.length===1?'':'s'}${nNew?` <button class="linkbtn" data-act="cseenall">Mark all as seen</button>`:''}</div>
    <div class="grid">${all.slice(page*per,page*per+per).map(c=>cmCell(c)).join('')}</div>
    ${all.length?'':`<div class="empty">${myComics().length?'Nothing matches.':'No comics yet. Try the Comics tab: new releases, the back-issue wall, or the dollar bin.'}</div>`}${pager(all.length,per,page,'ccpage')}`;
}
let ccfT=null; ACT.ccfq = v=>{ UI.ccf.q=v; UI.ccf.page=0; clearTimeout(ccfT); ccfT=setTimeout(()=>{ const a=document.activeElement; const pos=a&&a.selectionStart; render(true); const i=$('[data-inp="ccfq"]'); if (i){ i.focus(); try{ i.setSelectionRange(pos,pos); }catch(e){} } }, 220); };
ACT.ccfsort = v=>{ UI.ccf.sort=v; UI.ccf.page=0; render(true); }; ACT.ccff = a=>{ UI.ccf.f=a; UI.ccf.page=0; render(true); }; ACT.ccpage = a=>{ UI.ccf.page=+a; render(); window.scrollTo(0,0); };
ACT.cseenall = ()=>{ myComics().forEach(c=>delete c.nw); render(true); queueSave(); };
function creatorIssues(c){ const out=[]; for (const sid of c.works){ const s=S_(sid); if (!s.n) continue; let on = (s.w===c.id||s.a===c.id)&&false; const cts=s.keys.filter(k=>k[1]==='ct'||k[1]==='cd'); let from = (issueDay(s,1)>=c.deb && (cts.every(k=>k[2]!==c.id)))?1:0; const mine=cts.filter(k=>k[2]===c.id).map(k=>k[0]); if (mine.length) from=Math.min(...mine.filter(n=>n>0)); if (!from){ from=1; } const role=c.r==='W'?'W':'A'; const later=s.keys.filter(k=>k[1]==='ct' && k[0]>from && k[2]!==c.id && CR_(k[2]).r===c.r).map(k=>k[0]); const to = later.length? Math.min(...later)-1 : s.n; for (let n=from;n<=to;n++) out.push([sid,n]); } return out; }
function cmCollRuns(){
  const own=new Map(); for (const c of myComics()){ const d=cmD(c.k); if (d.tr) continue; if (!own.has(d.sid)) own.set(d.sid,new Set()); own.get(d.sid).add(d.n); }
  const runs=[...own.entries()].filter(([sid,set])=>set.size>=2 || cmFollowed().includes(sid)).map(([sid,set])=>[S_(sid),set]);
  for (const sid of cmFollowed()) if (!own.has(sid)) runs.push([S_(sid),new Set()]);
  runs.sort((a,b)=>b[1].size/Math.max(1,b[0].n)-a[1].size/Math.max(1,a[0].n));
  const crs=(G.player.crfol||[]).map(CR_);
  const allOwn=new Set(myComics().map(c=>{ const d=cmD(c.k); return d.sid+'|'+d.n; }));
  return `${tip('runs', `Runs are complete series, creator bibliographies and character appearances. Any printing or cover of an issue counts toward a run. Follow a series or creator and it shows up here even before you own anything.`)}
  <div class="panel"><h3>Series runs</h3><div class="rows">${runs.map(([s,set])=>`<button class="row" data-act="cseries" data-a="${s.id}"><div class="rt"><b>${esc(sTitle(s))} #1–${s.n}</b><span>${set.size} of ${s.n} issues${s.sts==='on'?', still publishing':''}</span><div class="bar" style="margin-top:4px;max-width:260px"><i style="width:${(set.size/Math.max(1,s.n)*100).toFixed(1)}%"></i></div></div><div class="rv"><b>${Math.floor(set.size/Math.max(1,s.n)*100)}%</b></div></button>`).join('')||'<div class="empty">Own two issues of a series, or follow one, to track a run.</div>'}</div></div>
  ${crs.length?`<div class="panel" style="margin-top:14px"><h3>Creator bibliographies</h3><div class="rows">${crs.map(c=>{ const iss=creatorIssues(c); const have=iss.filter(([sid,n])=>allOwn.has(sid+'|'+n)).length; return `<button class="row" data-act="ccreator" data-a="${c.id}"><div class="rt"><b>${esc(c.n)} bibliography</b><span>${have} of ${iss.length} issues</span><div class="bar" style="margin-top:4px;max-width:260px"><i style="width:${(have/Math.max(1,iss.length)*100).toFixed(1)}%"></i></div></div></button>`; }).join('')}</div></div>`:''}`;
}

// ---------- grading tab: comics ----------
function cmGradeView(){
  const P_=G.player; const subs=P_.csubs||[]; const back=(P_.creturned||[]).slice(0,12);
  const el=myComics().filter(c=>c.g===0 && !c.l).sort((a,b)=>cmCopyValue(b)-cmCopyValue(a)).slice(0,40);
  const html=`${tip('cgrade', `GCS Comics grades on a 0.5 to 10 scale. Blue labels are unrestored, yellow labels carry an authenticated signature, purple labels mean restoration was found. Pressing first can help with bends, never with creases or tears.`)}
  <div class="kpis">${CGRADE_TIERS.map(T=>`<div class="kpi"><small>${T.n}</small><b>${money(T.fee)}, ${T.days} days</b></div>`).join('')}<div class="kpi"><small>Pressing</small><b>${money(PRESS_FEE)}, ${PRESS_DAYS} days</b></div></div>
  <div class="cols" style="margin-top:14px"><div class="stack"><div class="panel"><h3>Your best raw comics</h3><div class="rows">${el.map(c=>{ const d=cmD(c.k); return `<div class="row" data-act="cgradesheet" data-a="${c.id}">${miniComic(c)}<div class="rt"><b>${esc(d.title)}</b><span>${esc(d.label||'')}</span><span>Raw ${fmtRange(cmEst(c.k,0,c))}</span></div><button class="btn sm" data-act="cgradesheet" data-a="${c.id}">Inspect</button></div>`; }).join('')||'<div class="empty">No raw comics yet.</div>'}</div></div></div>
  <div class="stack"><div class="panel"><h3>Away now</h3><div class="rows">${subs.map(x=>{ const c=MC(x.cid); return c?`<div class="row" data-act="ccopy" data-a="${c.id}">${miniComic(c)}<div class="rt"><b>${esc(cmD(c.k).title)}</b><span>${x.kind==='press'?'Pressing':'GCS '+(CGRADE_TIERS.find(t=>t.id===x.tier)||{n:''}).n}, due ${fmtDate(x.t1)}</span></div></div>`:''; }).join('')||'<div class="empty">Nothing submitted.</div>'}</div></div>
  <div class="panel"><h3>Recently returned</h3><div class="rows">${back.map(r=>{ const c=MC(r.cid); if (!c) return ''; return `<div class="row" data-act="ccopy" data-a="${c.id}">${miniComic(c)}<div class="rt"><b>${esc(cmD(c.k).title)}</b><span>${fmtDate(r.t)}${r.seen?'':', new'}</span></div><div class="rv"><b>${gTxt(r.g)}</b><span>${CGN[r.g]}</span></div></div>`; }).join('')||'<div class="empty">Nothing back yet.</div>'}</div></div></div></div>`;
  (P_.creturned||[]).forEach(r=>r.seen=1);
  return html;
}

// ---------- integration with existing views ----------
TABS.length=0; TABS.push(['home','Home'],['shop','Cards'],['comics','Comics'],['market','Market'],['coll','Collection'],['grade','Grading']);
ICONS.shop = '<rect x="6" y="3" width="12" height="17" rx="1.5"/><path d="M9 7h6M9 17h3"/><circle cx="12" cy="12" r="2.4"/>';
(function(){
  const shopInner=VIEWS.shop, ballInner=VIEWS.ball, gradeInner=VIEWS.grade, homeInner=VIEWS.home;
  const cardTabs=(cur)=>`<div class="subtabs"><button class="${cur==='shop'?'on':''}" data-act="tab" data-a="shop">Card shop</button>${[['news','Baseball news'],['stand','Standings'],['lead','Leaders'],['pros','Prospects'],['players','Players']].map(([k,n])=>`<button class="${cur===k?'on':''}" data-act="goto" data-a="ball:${k}">${n}</button>`).join('')}</div>`;
  VIEWS.shop = ()=>`<div class="pagetitle"><h1>Cards</h1><span class="muted small">The card shop</span></div>${cardTabs('shop')}${shopInner()}`;
  VIEWS.ball = ()=>{ const h=ballInner(); const i=h.indexOf('<div class="subtabs">'); const j=h.indexOf('</div>', i); return h.slice(0,i)+cardTabs(UI.sub.ball)+h.slice(j+6); };
  VIEWS.grade = ()=>{ const s=UI.sub.grade==='comics'?'comics':'cards'; const seg=`<div class="subtabs"><button class="${s==='cards'?'on':''}" data-act="sub" data-a="grade:cards">Cards</button><button class="${s==='comics'?'on':''}" data-act="sub" data-a="grade:comics">Comics</button></div>`;
    if (s==='comics') return `<div class="pagetitle"><h1>Grading</h1><span class="muted small">GCS Comics</span></div>${seg}${cmGradeView()}`;
    const h=gradeInner(); const i=h.indexOf('</div>')+6; return h.slice(0,i)+seg+h.slice(i); };
  VIEWS.home = ()=>{ const h=homeInner(); const i=h.indexOf('<div class="cols">'); return i<0? h : h.slice(0,i)+cmHomeStrip()+h.slice(i); };
  const collInner=VIEWS.coll;
  VIEWS.coll = ()=>{ const s=UI.sub.coll;
    let h; if (s==='comics'||s==='runs'||s==='binder'){ const save=UI.sub.coll; UI.sub.coll='sealed'; h=collInner(); UI.sub.coll=save; const a=h.indexOf('<div class="subtabs">'); h = h.slice(0,a)+'<div class="subtabs">__TABS__</div>'+(s==='comics'?cmCollComics():s==='binder'?binderView():cmCollRuns()); }
    else { h=collInner(); const a=h.indexOf('<div class="subtabs">'); const b=h.indexOf('</div>',a)+6; h=h.slice(0,a)+'<div class="subtabs">__TABS__</div>'+h.slice(b); }
    const tabs=[['cards','Cards'],['binder','Binder'],['comics','Comics'],['sealed','Sealed'],['sets','Sets'],['runs','Runs'],['show','Showcase'],['stats','Stats']];
    return h.replace('__TABS__', tabs.map(([k,n])=>`<button class="${s===k?'on':''}" data-act="sub" data-a="coll:${k}">${n}</button>`).join('')).replace(/<span class="muted small">(\d+) cards, (\d+) sealed<\/span>/, (m,a,b)=>`<span class="muted small">${a} cards, ${myComics().length} comics, ${b} sealed</span>`);
  };
})();
function cmHomeStrip(){
  if (!G.cm || !G.cm.shop) return '';
  const nw=newThisWeek().filter(e=>!cmD(e[0]).v).slice(0,8); const back=(G.player.creturned||[]).filter(r=>!r.seen);
  const alerts=back.map(r=>{ const c=MC(r.cid); return c?`<button class="row" data-act="ccopy" data-a="${c.id}">${miniComic(c)}<div class="rt"><b>Back from GCS Comics: ${esc(cmD(c.k).title)}</b><span>${gTxt(r.g)} ${CGN[r.g]}</span></div></button>`:''; }).join('');
  return `<div class="panel" style="margin-bottom:14px"><div class="phead"><h3>At ${SHOP_NAME} this week</h3><button class="linkbtn" data-act="goto" data-a="comics:week">Comics</button></div>
    ${alerts?`<div class="rows" style="margin-bottom:8px">${alerts}</div>`:''}
    <div class="cmstrip">${nw.map(e=>`<button class="gcell" data-act="design" data-a="${esc(e[0])}"><div class="thumb cmthumb">${comicCover(e[0])}</div><div class="cap"><b>${esc(cmD(e[0]).title)}</b><span>${e[1]>0?money(e[2],true):'Sold out'}</span></div></button>`).join('')||'<span class="small muted">New comics arrive Wednesday.</span>'}</div></div>`;
}
// showcase slots accept comics
(function(){ const collInner2=VIEWS.coll; VIEWS.coll=()=>{ let h=collInner2(); if (UI.sub.coll!=='show') return h;
  const sh=G.player.show; const a=h.indexOf('<div class="slotgrid">'); if (a<0) return h; const b=h.lastIndexOf('</div>');
  const grid=`<div class="slotgrid">${[0,1,2,3,4,5].map(i=>{ const it=showItem(sh[i]); if (sh[i]!=null && !it) delete sh[i];
    if (it && it.cm){ const c=it.cm; return `<div class="slot"><h3>Slot ${i+1}</h3><button class="gcell" style="width:100%" data-act="ccopy" data-a="${c.id}"><div class="thumb cmthumb ${c.g>0?'is-slab':''}">${cmThumb(c)}</div><div class="cap"><b>${esc(cmD(c.k).title)}</b><span>${esc(c.g>0?'GCS '+gTxt(c.g):cmD(c.k).label||'')}</span></div></button></div>`; }
    if (it && it.card){ const c=it.card; return `<div class="slot"><h3>Slot ${i+1}</h3><button class="gcell" style="width:100%" data-act="card" data-a="${c.id}">${thumbHTML(c)}<div class="cap"><b>${esc(cardName(c))}</b><span>${esc(shortLine(c))}</span></div></button></div>`; }
    return `<div class="slot"><h3>Slot ${i+1}</h3><div class="ph">Empty. Pin a card or comic from its detail sheet.</div></div>`; }).join('')}</div>`;
  return h.slice(0,a)+grid; }; })();

// market: comic listings
const _lsText=lsText; lsText = function(l){ if (l.it!=='m') return _lsText(l); let s=LSCACHE.get(l.id); if (s) return s; const cp=G.mc[l.ref], d=cmD(cp.k), x=d.s;
  const chars=d.tr?[]:issueKeys(x,d.n).filter(k=>['fa','cam','team','ss','dth'].includes(k[1])).map(k=>CH_(k[2]).n);
  s=(d.title+' '+pubName(x)+' '+CG[x.g].n+' '+d.yr+' '+(d.label||'cover a')+' '+CR_(x.w).n+' '+CR_(x.a).n+' '+chars.join(' ')+' comic'+(d.n===1?' #1 first issue':'')+(chars.length?' key 1st first appearance':'')+(cp.g>0?' gcs '+gTxt(cp.g)+' graded slab':' raw')+(cp.sg?' signed signature':'')+(cp.gr?' restored':'')+(d.p>1?' printing reprint':'')).toLowerCase();
  LSCACHE.set(l.id,s); return s; };
const _listingRow=listingRow; listingRow = function(l){ if (l.it!=='m') return _listingRow(l); const cp=G.mc[l.ref]; const d=cmD(cp.k);
  const b=[d.label&&d.label!=='Cover A'?d.label:'', d.yr, (pubOf(d.s)||{sh:'Self-pub'}).sh, cp.g>0?'GCS '+gTxt(cp.g):'raw', cp.sg?'signed':''].filter(Boolean).join(', ');
  const mine=l.sel===0; const lead=l.lead===0 && l.bids.length;
  const right = l.ty==='auc' ? `<b>${money(l.cur,true)}</b><span>${l.bids.length} bid${l.bids.length===1?'':'s'}, ${daysLeft(l).replace('Ends ','').replace(' left','')}</span>` : `<b>${money(l.pr,true)}</b><span>${mine?(l.offers.length?l.offers.length+' offer'+(l.offers.length>1?'s':''):'Your listing'):'Buy now'+(l.off?' or offer':'')}</span>`;
  return `<button class="row" data-act="listing" data-a="${l.id}">${miniComic(cp)}<div class="rt"><b>${esc(d.title)}</b><span>${esc(b)}</span>${lead?'<span class="up">You\'re the high bidder</span>':(l.ty==='auc'&&l.bids.some(x=>x[0]===0)?'<span class="down">Outbid</span>':'')}</div><div class="rv">${right}</div></button>`; };
function cmTypeOk(l, ty){ if (l.it!=='m') return false; if (ty==='cm') return true; const cp=G.mc[l.ref], d=cmD(cp.k), s=d.s; const ks=d.tr?[]:issueKeys(s,d.n);
  switch(ty){ case 'cmkey': return d.n===1 || ks.length>0; case 'cmfa': return ks.some(k=>k[1]==='fa'||k[1]==='cam'||k[1]==='team'); case 'cmgr': return cp.g>0; case 'cmraw': return cp.g===0; case 'cmsig': return !!cp.sg; case 'cmvar': return !!d.v; case 'cmind': return tierOf(s)>=2; case 'cmold': return d.yr<1975; case 'cmrest': return !!cp.gr||!!cp.r&&cp.g>0; case 'cmcheap': return (l.ty==='auc'?l.cur:l.pr)<=5; }
  return true; }
const _marketFiltered=marketFiltered; marketFiltered = function(){ const f=UI.mf; if (!f.type.startsWith('cm')){ const t=f.type; if (t==='all') return _marketFiltered(); return _marketFiltered().filter(l=>l.it!=='m'); }
  const save=f.type; f.type='all'; let a=_marketFiltered(); f.type=save; a=a.filter(l=>cmTypeOk(l,save)); if (UI.mfg>=0) a=a.filter(l=>cmD(G.mc[l.ref].k).s.g===UI.mfg); return a; };
UI.mfg=-1;
const _marketView=VIEWS.market; VIEWS.market = ()=>{ let h=_marketView(); if (UI.sub.market!=='browse') return h;
  const f=UI.mf; const chip=(k,n)=>`<button class="chip ${f.type===k?'on':''}" data-act="mft" data-a="${k}">${n}</button>`;
  const a=h.indexOf('<div class="chips"'); const b=h.indexOf('</div>',a)+6; if (a<0) return h;
  const row = f.type.startsWith('cm') ? `<div class="chips" style="margin-bottom:10px">${chip('all','← All listings')}${chip('cm','All comics')}${chip('cmkey','Keys and #1s')}${chip('cmfa','First appearances')}${chip('cmgr','Graded')}${chip('cmraw','Raw')}${chip('cmsig','Signed')}${chip('cmvar','Variants')}${chip('cmind','Indie')}${chip('cmold','Pre-1975')}${chip('cmrest','Restored')}${chip('cmcheap','Under $5')}<select class="inp" style="padding:3px 8px;font-size:13px" data-chg="mfg" aria-label="Genre"><option value="-1">Any genre</option>${CG.map((g,i)=>`<option value="${i}" ${UI.mfg===i?'selected':''}>${esc(g.n)}</option>`).join('')}</select></div>`
    : h.slice(a,b).replace('</div>', `${chip('cm','Comics')}</div>`);
  h = h.slice(0,a)+row+h.slice(b);
  if (f.type.startsWith('cm')) h=h.replace('placeholder="Player, team, product, parallel..."','placeholder="Title, publisher, creator, character, year..."');
  return h; };
ACT.mfg = v=>{ UI.mfg=+v; UI.mf.page=0; render(true); };
const _listingSheet=listingSheet; listingSheet = function(lid){ const l=L(lid); if (!l || l.it!=='m') return _listingSheet(lid);
  const r=_listingSheet(lid);
  const cp=G.mc[l.ref], d=cmD(cp.k), s=d.s; const mine=l.sel===0;
  const head=`<div class="bigcard cm"><div class="face ${cp.g>0?'slab':''}">${cmThumb(cp)}</div></div>`;
  const cond=`<div class="title-block"><div class="yr">${esc(pubName(s))}, ${monYr(d.day)}</div><h1>${esc(d.title)}</h1><div class="sub">${esc(d.label||'Cover A')}</div>${cmTags(d,cp)}</div>
    <dl class="kv"><dt>Seller</dt><dd>${esc(ownerName(l.sel))}</dd><dt>Issue</dt><dd>${iLink(cp.k,'Details, value by grade, history')}</dd><dt>Series</dt><dd>${sLink(s)}</dd><dt>Estimated market</dt><dd class="est">${cmRange(cp.k,cp.g>0?cp.g:0,cp)}</dd>${cp.g>0?`<dt>Grade</dt><dd>GCS ${gTxt(cp.g)} ${CGN[cp.g]}${cp.gr?', restored':''}</dd>`:''}</dl>
    ${cp.g>0?`<div style="margin-top:8px"><b class="small">Population</b>${cmPopHTML(cp.k)}</div>`:`<div style="margin-top:8px"><b class="small">Condition from the listing photos</b>${cmInspectHTML(cp,!mine)}</div>`}`;
  return { t:d.title, h:`<div class="stack"><div class="detail">${head}<div class="stack">${cond}${extractAct(r.h)}</div></div>${cmSalesPanel(cp.k,cp.g>0?cp.g:0, cp.g>0?'Sales at GCS '+gTxt(cp.g):'Raw sales')}${cmCompsHTML(d)}</div>` };
};
function extractAct(h){ const m=h.match(/<div class="panel"><h3>(Your auction|Your listing|Buy now|Auction)<\/h3>/); if (!m) return ''; let i=m.index, depth=0, j=i; const re=/<div\b|<\/div>/g; re.lastIndex=i; let x; while((x=re.exec(h))){ if (x[0]==='</div>'){ depth--; if (depth===0){ j=x.index+6; break; } } else depth++; } return h.slice(i,j); }
const _designSheet=designSheet; designSheet = function(key){ return key[0]==='M' ? cmIssueSheet(key) : _designSheet(key); };
const _feedLabel=feedLabel; feedLabel = function(key){ if (key[0]!=='M') return _feedLabel(key); const d=cmD(key); return [d.title, d.label||'Cover A']; };
const _miniKey=miniKey; miniKey = function(k){ return k[0]==='M' ? miniCKey(k) : _miniKey(k); };
const _collectionTotals=collectionTotals; collectionTotals = function(){ const t=_collectionTotals(); if (!G.cm) return t; for (const c of myComics()){ const r=cmEst(c.k,c.g>0?c.g:0,c); t.total[0]+=r.lo; t.total[1]+=r.hi; if (c.l){ t.listed[0]+=r.lo; t.listed[1]+=r.hi; } } return t; };
const _badgeFor=badgeFor; badgeFor = function(t){ if (t==='grade') return _badgeFor(t) + ((G.player.creturned||[]).filter(r=>!r.seen).length); if (t==='comics') return 0; return _badgeFor(t); };

// ===================== THE HUNT: UI =====================
ICONS.hunt = '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/><path d="M8 10.5a2.5 2.5 0 0 1 2.5-2.5"/>';
UI.sub.hunt='near'; UI.hpg=0; UI.hsort='d'; UI.hf='all'; UI.htrade=[]; UI.hsel=[]; UI.hmsg=null;
TABS.length=0; TABS.push(['home','Home'],['shop','Cards'],['comics','Comics'],['hunt','Hunt'],['market','Market'],['coll','Collection']);
function clockTxt(m){ const h=9+Math.floor(m/60), mm=m%60; return ((h-1)%12+1)+':'+String(mm).padStart(2,'0')+(h<12?' AM':' PM'); }
function evDates(ev){ return ev.days>1? fmtDate(ev.d)+'–'+fmtDate(ev.d+ev.days-1) : fmtDate(ev.d); }
function sess(){ const ss=G.hunt&&G.hunt.sess; return ss && ss.day===G.day ? ss : null; }
function sessEv(){ const ss=sess(); return ss? G.hunt.ev.find(x=>x.id===ss.ev) : null; }
function profTxt(s){ const N={mod:'modern cards',pros:'prospects',vcard:'older card sets',slab:'graded cards',auto:'autographs',team:'team lots',wax:'sealed wax',comic:'back issues',ocomic:'older comics',key:'key issues',cslab:'slabbed comics',cvar:'variant covers',indie:'indie comics',tpb:'trades and graphic novels',mixed:'a bit of everything'}; return Object.keys(s.prof).filter(k=>N[k]).sort((a,b)=>s.prof[b]-s.prof[a]).slice(0,3).map(k=>N[k]).join(', ')||'their own work'; }
function relTxt(s){ return s.rel>=5?'Greets you by name and asks what you\'re looking for.': s.rel>=2?'Seems to recognize you.':''; }
function hThumb(e){ const o=objOf(e); if (!o) return '<div class="mini"></div>'; if (e.t==='c') return miniCard(o); if (e.t==='m') return `<div class="mini cm">${e.ck && o.g===0? comicCover(e.ck) : cmThumb(o)}</div>`; return miniSealed(o); }
function hRow(s, e, extra){ const star=wantMatch(e)?'<span class="up small">★ want list</span>':''; return `<button class="row" data-act="hitem" data-a="${s.id}:${e.t}:${e.id}">${hThumb(e)}<div class="rt"><b>${esc(huntLabel(e,true))}</b><span>${e.t==='c'?'Card':e.t==='m'?'Comic':'Sealed'}${e.hold&&e.hold>=G.day?', on hold for you':''}</span>${star}${extra||''}</div><div class="rv"><b>${money(e.p,true)}</b></div></button>`; }
function sessBanner(){ const ss=sess(); if (!ss) return ''; const ev=sessEv(); return `<div class="note" style="margin-bottom:12px;display:flex;gap:8px;align-items:center;flex-wrap:wrap"><b style="flex:1">At ${esc(ev.n)} · ${clockTxt(ss.clock)}${ss.clock>=480?' (closing)':''}</b>${UI.sub.hunt!=='floor'?'<button class="btn sm pri" data-act="sub" data-a="hunt:floor">Back to the floor</button>':''}<button class="btn sm" data-act="hleave">Leave</button></div>`; }
// ---------- views ----------
function evRow(ev, go){ const live=evLive(ev); const T=EV_T[ev.ty];
  return `<div class="row" style="cursor:default"><div class="rt"><b>${esc(ev.n)}</b><span>${evDates(ev)}${ev.cost?', costs '+money(ev.cost)+(ev.cost>40?' (travel'+(ev.days>1?' and hotel':'')+')':''):', free'}${ev.paid?', paid':''}</span><span>${esc(ev.blurb|| (T.tables?`About ${T.tables[1]} tables`+(T.kind==='comic'?', creators signing':T.kind==='card'?', an athlete signing':''):'') )}</span></div>${live&&go?`<div style="display:flex;flex-direction:column;gap:4px"><button class="btn pri sm" data-act="hgo" data-a="${ev.id}:0" ${!ev.paid&&G.player.cash<ev.cost?'disabled':''}>Go now</button>${ev.ty!=='garage'?`<button class="btn sm" data-act="hgo" data-a="${ev.id}:1">Go this afternoon</button>`:''}</div>`:''}</div>`; }
function huntNear(){
  const H=G.hunt; const today=H.ev.filter(ev=>evLive(ev)); const week=H.ev.filter(ev=>ev.d>G.day && ev.d<=G.day+7 && ev.ann<=G.day);
  const shops=H.sel.filter(s=>s.shop); const pv=H.pv; const au=H.auc.find(a=>!a.done && a.ann<=G.day);
  return `${tip('hunt', `<b>The Hunt</b> is the physical side of the hobby: shops, shows, flea markets, garage sales and private collections. Every item is a real object with a real history, and every price is the seller's own opinion. Nothing here tells you what's underpriced. That's your job.`)}
  <div class="cols"><div class="stack">
    <div class="panel"><h3>Today, ${fmtDate(G.day)}</h3><div class="rows">${today.map(ev=>evRow(ev,1)).join('')||'<div class="empty">Nothing on today. Shops are open.</div>'}</div></div>
    <div class="panel"><div class="phead"><h3>This week</h3><button class="linkbtn" data-act="sub" data-a="hunt:events">Calendar</button></div><div class="rows">${week.map(ev=>evRow(ev,0)).join('')||'<div class="empty">Nothing announced yet.</div>'}</div></div>
  </div><div class="stack">
    <div class="panel"><div class="phead"><h3>Local shops</h3><button class="linkbtn" data-act="sub" data-a="hunt:shops">All</button></div><div class="rows">${shops.map(s=>`<button class="row" data-act="hseller" data-a="${s.id}"><div class="rt"><b>${esc(s.n)}</b><span>${esc(profTxt(s))}</span></div><div class="rv"><span>${s.inv.length} items</span></div></button>`).join('')}<button class="row" data-act="goto" data-a="comics:shop"><div class="rt"><b>${SHOP_NAME}</b><span>New comics, back issues, the dollar bin</span></div></button></div></div>
    ${pv.length?`<div class="panel"><div class="phead"><h3>Private collections</h3><button class="linkbtn" data-act="sub" data-a="hunt:private">All</button></div><div class="rows">${pv.map(pvRow).join('')}</div></div>`:''}
    ${au?`<div class="panel"><div class="phead"><h3>${esc(AUCTION_HOUSE)}</h3><button class="linkbtn" data-act="sub" data-a="hunt:auction">Catalogue</button></div><p class="small" style="margin:0">${au.lots.length} lots close ${fmtDate(au.d,true)}.</p></div>`:''}
  </div></div>`;
}
function huntEvents(){
  const H=G.hunt; const up=H.ev.filter(ev=>ev.ann<=G.day && ev.d+ev.days>G.day).sort((a,b)=>a.d-b.d);
  const byDay=new Map(); for (const ev of up){ const k=ev.d; if (!byDay.has(k)) byDay.set(k,[]); byDay.get(k).push(ev); }
  return `${tip('hevents', `Card shows and conventions are announced weeks ahead. Garage and estate sales pop up a few days before. Regional and national shows cost travel money. Morning gets you first pick; late in the day dealers bend on price, if the good stuff is still there.`)}
  <div class="panel">${[...byDay.entries()].map(([d,evs])=>`<h3 style="margin:10px 0 4px">${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dowOf(d)]} ${fmtDate(d,true)}${d===G.day?' · today':''}</h3><div class="rows">${evs.map(ev=>evRow(ev,1)).join('')}</div>`).join('')||'<div class="empty">Nothing announced.</div>'}</div>`;
}
function huntShops(){ const shops=G.hunt.sel.filter(s=>s.shop);
  return `<div class="panel"><div class="rows">${shops.map(s=>`<button class="row" data-act="hseller" data-a="${s.id}"><div class="rt"><b>${esc(s.n)}</b><span>${esc(s.who)}, ${esc(HUNT_KINDS[s.kind].n.toLowerCase())}. ${esc(profTxt(s))}.</span><span>${esc(s.blurb||'')}</span></div><div class="rv"><span>${s.inv.length} items</span></div></button>`).join('')}<button class="row" data-act="goto" data-a="comics:shop"><div class="rt"><b>${SHOP_NAME}</b><span>Your comic shop: new comics Wednesdays, back-issue wall, dollar bin, collections.</span></div></button></div></div>`; }
function pvRow(pv){ const s=pvSeller(pv); return `<button class="row" data-act="hpv" data-a="${pv.id}"><div class="rt"><b>${esc(s.n)}</b><span>${s.inv.length} items, asking ${money(pv.ask)}${pv.mode==='cherry'?', will sell pieces':', all or nothing'}</span><span>Until ${fmtDate(pv.exp)}</span></div></button>`; }
function huntPrivate(){ const pv=G.hunt.pv; return `${tip('hpv', `Private sellers price from what they know, which is sometimes a lot and sometimes nothing. You can look through a sample before you buy, but not everything. Big lots are a bet on the parts you didn't see.`)}<div class="panel"><div class="rows">${pv.map(pvRow).join('')||'<div class="empty">No collections on offer right now. New ones turn up every week or two.</div>'}</div></div>`; }
function huntAuction(){
  const H=G.hunt; const cur=H.auc.filter(a=>!a.done && a.ann<=G.day); const past=H.auc.filter(a=>a.done);
  return `${tip('hauc', `${AUCTION_HOUSE} runs a big sale every quarter. Serious collectors bid; some lots will be out of reach. Set a maximum bid before the close; a 15% buyer's premium is added to the hammer price.`)}
  ${cur.map(a=>`<div class="panel"><div class="phead"><h3>${esc(a.n)}</h3><span class="muted small">Closes ${fmtDate(a.d,true)}</span></div><div class="rows">${a.lots.map(L_=>{ const e={t:L_.t,id:L_.id}; return objOf(e)?`<button class="row" data-act="hlot" data-a="${a.id}:${L_.n}">${hThumb(e)}<div class="rt"><b>Lot ${L_.n}: ${esc(huntLabel(e))}</b><span>Estimate ${money(L_.est[0])}–${money(L_.est[1])}</span>${L_.mx?`<span class="up">Your max: ${money(L_.mx)}</span>`:''}</div></button>`:''; }).join('')}</div></div>`).join('')||'<div class="panel"><div class="empty">The next catalogue is announced about five weeks before the sale.</div></div>'}
  ${past.map(a=>`<div class="panel"><h3>${esc(a.n)}: results</h3><div class="rows">${a.lots.map(L_=>{ const e={t:L_.t,id:L_.id}; return objOf(e)?`<div class="row" style="cursor:default">${hThumb(e)}<div class="rt"><b>Lot ${L_.n}: ${esc(huntLabel(e))}</b><span>${L_.res2&&L_.res2.p?'Sold for '+money(L_.res2.p)+' to '+esc(L_.res2.w):'Unsold'}</span></div></div>`:''; }).join('')}</div></div>`).join('')}`;
}
function wantLabel(w){ if (w.t==='p') return ['Player', pname(P(w.id))]; if (w.t==='k') return ['Card', cardLine(D(w.id))+' '+pname(P(D(w.id).pid))]; if (w.t==='pr') return ['Set', prodName(G.products[w.id])]; if (w.t==='s') return ['Series', sTitle(S_(w.id))]; if (w.t==='i') return ['Issue', cmD(w.id).title+(cmD(w.id).label&&cmD(w.id).label!=='Cover A'?' ('+cmD(w.id).label+')':'')]; if (w.t==='cr') return ['Creator', CR_(w.id).n]; return ['',''] }
function wantAct(w){ return w.t==='p'?`player" data-a="${w.id}`: w.t==='k'||w.t==='i'?`design" data-a="${esc(w.id)}`: w.t==='s'?`cseries" data-a="${w.id}`: w.t==='cr'?`ccreator" data-a="${w.id}`:`product" data-a="${w.id}`; }
function huntWant(){
  const W=G.hunt.want; const F=G.hunt.found.slice(0,25);
  return `${tip('hwant', `Add players, cards, sets, series, issues and creators from their pages. When you browse a table or a shop, anything matching gets a ★. The list won't tell you where to look.`)}
  <div class="cols"><div class="panel"><h3>Want list</h3><div class="rows">${W.map((w,i)=>{ const [a,b]=wantLabel(w); return `<div class="row"><button class="linkbtn" style="flex:1;text-align:left" data-act="${wantAct(w)}"><b>${esc(b)}</b><span class="muted small" style="display:block">${a}</span></button><button class="btn sm" data-act="hwantdel" data-a="${i}">Remove</button></div>`; }).join('')||'<div class="empty">Nothing yet. Look for "Add to want list" on player, card, set, series, issue and creator pages.</div>'}</div></div>
  <div class="panel"><h3>Your finds</h3><p class="small muted" style="margin:0 0 6px">What you've bought out in the world, and where.</p><div class="rows">${F.map(f=>{ const e={t:f[1],id:f[2]}; const o=objOf(e); if (!o || o.o!==0) return ''; return `<button class="row" data-act="${f[1]==='c'?'card':f[1]==='m'?'ccopy':'sealed'}" data-a="${f[2]}">${hThumb(e)}<div class="rt"><b>${esc(huntLabel(e))}</b><span>${esc(f[4])}, ${fmtDate(f[0])}</span></div><div class="rv"><b>${money(f[3],true)}</b><span>paid</span></div></button>`; }).join('')||'<div class="empty">Nothing yet.</div>'}</div></div></div>`;
}
function huntFloor(){
  const ss=sess(); const ev=sessEv(); if (!ss||!ev) return '<div class="empty">You\'re not at an event right now.</div>';
  const sellers=evSellers(ev); const T=EV_T[ev.ty];
  if (ev.ty==='garage'||ev.ty==='estate'){ const s=sellers[0]; const loose=s.inv.filter(e=>!e.bx), box=s.inv.filter(e=>e.bx);
    return `<div class="panel"><h3>${esc(ev.n)}</h3><p class="small" style="margin:0 0 8px">${esc(ev.blurb||'')}. Run by ${esc(s.who)}. Also on the tables: ${esc((s.junk||[]).join(', '))}.</p>${s.inv.length?'':'<div class="empty">Nothing collectible here. You look around, thank them, and go.</div>'}
      ${box.length?`<p class="small muted" style="margin:0 0 6px">Everything's in boxes at ${money(box[0].bx,true)} apiece.</p><button class="btn pri" data-act="hbox" data-a="${s.id}:${box[0].bx}">Go through the boxes (${box.length})</button>`:''}
      <div class="rows">${loose.map(e=>hRow(s,e)).join('')}</div></div>`; }
  const sig=ev.sign||[]; const T2=G.hunt.tbl && G.hunt.tbl.ev===ev.id ? G.hunt.tbl : null; const canRent = T.tables && !T2;
  return `<div class="panel"><div class="phead"><h3>${esc(ev.n)}</h3><span class="muted small">Day ${G.day-ev.d+1} of ${ev.days}</span></div><p class="small muted" style="margin:0 0 6px">Visiting a table takes about 20 minutes. Doors close at 5.</p>
    <div class="rows">${sellers.map(s=>`<button class="row" data-act="hseller" data-a="${s.id}"><div class="rt"><b>${esc(s.n)}${ss.seen.includes(s.id)?' <span class="muted small">visited</span>':''}</b><span>${esc(s.cr!=null?'Creator table: '+s.inv.length+' comics':profTxt(s))}</span>${relTxt(s)?`<span>${esc(relTxt(s))}</span>`:''}</div><div class="rv"><span>${s.inv.filter(e=>!e.bx).length} items${s.inv.some(e=>e.bx)?' + boxes':''}</span></div></button>`).join('')}</div></div>
    ${sig.length?`<div class="panel"><h3>Signing today</h3><div class="rows">${sig.map((g,i)=>`<div class="row" style="cursor:default"><div class="rt"><b>${g.k==='cr'?crLink(CR_(g.id)):pLink(P(g.id))}</b><span>${g.k==='cr'?esc(ROLE_N[CR_(g.id).r])+(g.indie?', at their own table':''):esc(statusOf(P(g.id)))}. ${g.fee?money(g.fee)+' a signature':'Free with purchase, or just ask'}.</span></div><button class="btn sm" data-act="hsign" data-a="${i}">Get something signed</button></div>`).join('')}</div></div>`:''}
    ${T2?`<div class="panel"><h3>Your table</h3><p class="small" style="margin:0 0 6px">${T2.items.length} items still out. Sold so far: ${T2.sold.length} for ${money(T2.sold.reduce((a,x)=>a+x[2],0),true)}.</p><div class="rows">${T2.sold.map(x=>`<div class="row" style="cursor:default"><div class="rt"><b>${esc(huntLabel({t:x[0],id:x[1]}))}</b><span>to ${esc(x[3])}</span></div><div class="rv"><b>${money(x[2],true)}</b></div></div>`).join('')}</div></div>`:''}
    ${canRent?`<div class="panel"><h3>Sell from your own table</h3><p class="small muted" style="margin:0 0 8px">Rent a table for the rest of the show, bring up to 25 items, and let the crowd come to you. No marketplace fee; walk-up buyers haggle.</p><button class="btn" data-act="hrent">Rent a table</button></div>`:''}`;
}
VIEWS.hunt = ()=>{
  if (!G.hunt) return '<div class="empty">Loading.</div>';
  let s=UI.sub.hunt; if (s==='floor' && !sess()) s=UI.sub.hunt='near';
  const tabs=[['near','Nearby'],['events','Events'],['shops','Shops'],['private','Private sales'],['auction','Auctions'],['want','Want list']]; if (sess()) tabs.unshift(['floor','The floor']);
  const body = s==='floor'?huntFloor(): s==='events'?huntEvents(): s==='shops'?huntShops(): s==='private'?huntPrivate(): s==='auction'?huntAuction(): s==='want'?huntWant(): huntNear();
  return `<div class="pagetitle"><h1>The Hunt</h1><span class="muted small">${sess()?clockTxt(sess().clock):fmtDate(G.day,true)}</span></div><div class="subtabs">${tabs.map(([k,n])=>`<button class="${s===k?'on':''}" data-act="sub" data-a="hunt:${k}">${n}</button>`).join('')}</div>${sessBanner()}${body}`;
};
// ---------- seller, item, box ----------
function sellerSheet(sid){
  const s=G.hunt.sel[sid]; if (!s) return null; const ss=sess();
  const main=s.inv.filter(e=>!e.bx); const boxes={}; for (const e of s.inv) if (e.bx) boxes[e.bx]=(boxes[e.bx]||0)+1;
  let arr=main.filter(e=>UI.hf==='all'||e.t===UI.hf);
  if (UI.hsort==='hi') arr.sort((a,b)=>b.p-a.p); else if (UI.hsort==='lo') arr.sort((a,b)=>a.p-b.p);
  const per=15, pg=Math.min(UI.hpg, Math.max(0,Math.ceil(arr.length/per)-1));
  const cart=(G.hunt.cart||[]).filter(x=>{ const [id,t]=x.split(':'); return entryById(s,t,+id); });
  const chip=(k,n)=>`<button class="chip ${UI.hf===k?'on':''}" data-act="hf" data-a="${k}">${n}</button>`;
  return { t:s.n, h:`<div class="stack"><div class="title-block"><div class="yr">${esc(s.who)}${s.who?', ':''}${esc(HUNT_KINDS[s.kind].n.toLowerCase())}</div><h1>${esc(s.n)}</h1><div class="sub">${esc(s.blurb||('Deals in '+profTxt(s)))}</div></div>
    ${relTxt(s)?`<p class="small" style="margin:0">${esc(relTxt(s))}</p>`:''}${s.junk&&s.junk.length?`<p class="small muted" style="margin:0">Also on the table: ${esc(s.junk.join(', '))}.</p>`:''}
    ${Object.keys(boxes).length?`<div class="panel"><h3>Boxes</h3><div class="rows">${Object.entries(boxes).map(([p,n])=>`<button class="row" data-act="hbox" data-a="${s.id}:${p}"><div class="rt"><b>${money(+p,true)} box</b><span>${n} items, flip through ten at a time</span></div></button>`).join('')}</div></div>`:''}
    <div class="panel"><div class="phead"><h3>${s.shop?'In the cases':'On the table'}</h3><span class="muted small">${arr.length} items</span></div>
      <div class="chips" style="margin-bottom:8px">${chip('all','All')}${chip('c','Cards')}${chip('m','Comics')}${chip('s','Sealed')}<select class="inp" style="padding:3px 8px;font-size:13px" data-chg="hsort"><option value="d" ${UI.hsort==='d'?'selected':''}>As displayed</option><option value="hi" ${UI.hsort==='hi'?'selected':''}>Price, high</option><option value="lo" ${UI.hsort==='lo'?'selected':''}>Price, low</option></select></div>
      <div class="rows">${arr.slice(pg*per,pg*per+per).map(e=>hRow(s,e)).join('')||'<div class="empty">Nothing here.</div>'}</div>${pager(arr.length,per,pg,'hpage')}</div>
    <div class="formrow">${cart.length?`<button class="btn pri" data-act="hbundle" data-a="${s.id}">Make an offer on ${cart.length} item${cart.length>1?'s':''}</button>`:''}${s.bb>0 && !s.temp?`<button class="btn" data-act="hsell" data-a="${s.id}">Sell or trade to them</button>`:''}</div></div>` };
}
function discrepancy(e){
  if (!e.ck) return ''; const o=objOf(e);
  if (e.t==='m'){ const d=cmD(o.k); return `<li>${d.p>1? `The indicia inside reads "${esc(d.label.split(',')[0])}".` : d.v? `The cover doesn't match the regular edition: this is the ${esc(VAR_N(d.v))}.` : `The indicia shows no later-printing line; this looks like a first printing.`} ${iLink(o.k,'Look up this version')}</li>`; }
  if (e.t==='c'){ const d=D(o.k); return `<li>Tilted under the light, it has a ${esc(d.parObj.n)} finish${d.run?`, and the back is stamped ${o.s}/${d.run}`:''}. <button class="linkbtn" data-act="design" data-a="${esc(o.k)}">Look up this version</button></li>`; }
  return '';
}
function itemSheet(sid, t, id){
  const s=G.hunt.sel[sid]; const e=s&&entryById(s,t,id); if (!e) return {t:'Gone', h:'<div class="empty">Someone else bought it.</div>'};
  const o=objOf(e); const inCart=(G.hunt.cart||[]).includes(id+':'+t); const m=UI.hmsg&&UI.hmsg.k===sid+':'+t+':'+id?UI.hmsg:null;
  let art, look, research;
  if (t==='c'){ const d=D(e.ck||o.k); art=bigCardHTML(e.ck&&o.g===0?null:o, e.ck||o.k); look = o.g>0? `<div class="small">Graded GCS ${o.g}. ${popHTML(o.k)}</div>` : inspectHTML(o,false).replace('<ul class="inspect">','<ul class="inspect">'+discrepancy(e)); research=`${pLink(P(d.pid))} · <button class="linkbtn" data-act="design" data-a="${esc(e.ck||o.k)}">Sales and comps</button>`; }
  else if (t==='m'){ const k=e.ck||o.k; art=`<div class="bigcard cm"><div class="face ${o.g>0?'slab':''}">${e.ck&&o.g===0?comicCover(k):cmThumb(o)}</div></div>`; look = o.g>0? `<div class="small">GCS ${gTxt(o.g)} ${CGN[o.g]}${o.gr?', restored':''}.</div>` : cmInspectHTML(o,false).replace('<ul class="inspect">','<ul class="inspect">'+discrepancy(e)); research=`${sLink(cmD(k).s)} · ${iLink(k,'Issue history and sales')}`; }
  else { const prod=G.products[o.p]; art=`<div class="bigcard"><div class="face">${packArt(prod,o.f)}</div></div>`; look=`<p class="small" style="margin:0">Factory sealed. ${formatLine(prod,o.f)}.</p>`; research=`<button class="linkbtn" data-act="product" data-a="${prod.id}">Product details</button>`; }
  const hold = s.shop && s.rel>=2 && !(e.hold>=G.day);
  return { t:huntLabel(e,true), h:`<div class="stack"><div class="detail">${art}<div class="stack">
    <div class="title-block"><div class="yr">${esc(s.n)}</div><h1>${esc(huntLabel(e,true))}</h1>${wantMatch(e)?'<div class="sub up">On your want list</div>':''}</div>
    <dl class="kv"><dt>Asking</dt><dd class="est">${money(e.p,true)}</dd>${e.bx?`<dt>From</dt><dd>The ${money(e.bx,true)} box</dd>`:''}<dt>Research</dt><dd>${research}</dd></dl>
    <div><b class="small">Your look at it</b>${look}</div></div></div>
    <div class="panel"><h3>Deal</h3>
      <div class="formrow"><button class="btn pri" data-act="hbuy" data-a="${sid}:${t}:${id}" data-confirm="Pay ${money(e.p,true)}" ${G.player.cash<e.p?'disabled':''}>Buy for ${money(e.p,true)}</button>${e.bx?'':`<button class="btn" data-act="hcart" data-a="${sid}:${t}:${id}">${inCart?'Remove from offer':'Add to a bundle offer'}</button>`}</div>
      ${e.bx?'':`<div class="formrow"><input class="inp money-in" type="number" min="0.5" step="0.5" id="hoffer" placeholder="Your offer"><button class="btn" data-act="hoffer" data-a="${sid}:${t}:${id}">Make offer</button><button class="btn" data-act="hbest" data-a="${sid}:${t}:${id}">Best price?</button></div>`}
      ${hold?`<div class="formrow"><button class="btn sm" data-act="hhold" data-a="${sid}:${t}:${id}">Ask them to hold it until tomorrow</button></div>`:''}
      ${m?`<div class="${m.ok?'ok':'err'}" style="margin-top:8px">${esc(m.txt)}${m.counter?` <button class="btn sm pri" data-act="haccept" data-a="${sid}:${t}:${id}:${m.counter}" data-confirm="Pay ${money(m.counter,true)}">Accept ${money(m.counter,true)}</button>`:''}</div>`:''}
    </div></div>` };
}
function boxSheet(sid, price){
  const s=G.hunt.sel[sid]; if (!s) return null; const key=sid+':'+price; const ss=sess(); const dug=G.hunt.dug=G.hunt.dug||{}; if (dug.day!==G.day){ G.hunt.dug={day:G.day}; }
  const n=G.hunt.dug[key]||0; const items=s.inv.filter(e=>e.bx===+price); const shown=items.slice(0,n*10);
  return { t:money(+price,true)+' box', h:`<div class="stack"><p class="small muted" style="margin:0">${items.length} items at ${money(+price,true)} each. Tap anything to look closer.</p>
    <div class="grid">${shown.map(e=>{ const o=objOf(e); return `<button class="gcell" data-act="hitem" data-a="${s.id}:${e.t}:${e.id}">${e.t==='c'?thumbHTML(o):`<div class="thumb cmthumb">${comicCover(o.k)}</div>`}<div class="cap"><b>${esc(e.t==='c'?cardName(o):cmD(o.k).title)}</b><span>${esc(e.t==='c'?D(o.k).prod.yr+' '+B(D(o.k).prod).short:String(cmD(o.k).yr))}</span></div></button>`; }).join('')}</div>
    ${n*10<items.length?`<button class="btn pri" data-act="hdig" data-a="${key}">${n?'Next stack':'Start flipping'}</button>`:'<p class="small muted">That\'s the whole box.</p>'}</div>` };
}
function bundleSheet(sid){
  const s=G.hunt.sel[sid]; const cart=(G.hunt.cart||[]).map(x=>{ const [id,t]=x.split(':'); return entryById(s,t,+id); }).filter(Boolean);
  const tr=UI.htrade.map(x=>{ const [t,id]=x.split(':'); return {t,id:+id}; }).filter(e=>{ const o=objOf(e); return o&&o.o===0; });
  const ask=cart.reduce((a,e)=>a+e.p,0); const credit=tr.length?tradeCredit(s,tr):0; const m=UI.hmsg&&UI.hmsg.k==='b'+sid?UI.hmsg:null;
  const mine=playerObjs().slice(0,300).map(e=>[e,trueValue(e)]).sort((a,b)=>b[1]-a[1]).slice(0,30);
  return { t:'Offer to '+s.n, h:`<div class="stack"><div class="panel"><h3>You want</h3><div class="rows">${cart.map(e=>hRow(s,e)).join('')||'<div class="empty">Add items from their table first.</div>'}</div><p class="small" style="margin:6px 0 0">Asking total ${money(ask,true)}.</p></div>
    ${s.bb>0?`<div class="panel"><h3>Add a trade</h3><p class="small muted" style="margin:0 0 6px">Dealers give more in trade credit than they'd pay in cash.${tr.length?` They'd credit you <b>${money(credit,true)}</b> for what you've picked.`:''}</p><div class="rows">${mine.map(([e])=>{ const k=e.t+':'+e.id; const on=UI.htrade.includes(k); return `<button class="row" data-act="htrade" data-a="${k}">${hThumb(e)}<div class="rt"><b>${esc(huntLabel(e))}</b><span>${on?'In the trade':'Tap to add'}</span></div>${on?'<div class="rv"><b class="up">✓</b></div>':''}</button>`; }).join('')}</div></div>`:''}
    <div class="panel"><h3>Your offer</h3><div class="formrow"><input class="inp money-in" type="number" min="0" step="1" id="hboffer" placeholder="Cash" value=""><button class="btn pri" data-act="hbofferGo" data-a="${sid}" ${cart.length?'':'disabled'}>Propose deal</button><button class="btn" data-act="hbbest" data-a="${sid}" ${cart.length?'':'disabled'}>Best price for all?</button></div>
    ${m?`<div class="${m.ok?'ok':'err'}" style="margin-top:8px">${esc(m.txt)}${m.counter!=null?` <button class="btn sm pri" data-act="hbaccept" data-a="${sid}:${m.counter}" data-confirm="Pay ${money(m.counter,true)}">Accept</button>`:''}</div>`:''}</div></div>` };
}
function sellSheet(sid){
  const s=G.hunt.sel[sid]; const mine=playerObjs().map(e=>[e,dealerQuote(s,e)]).filter(x=>x[1]>=0.5).sort((a,b)=>b[1]-a[1]).slice(0,60);
  const sel=UI.hsel.filter(k=>mine.some(([e])=>e.t+':'+e.id===k)); const tot=mine.filter(([e])=>sel.includes(e.t+':'+e.id)).reduce((a,x)=>a+x[1],0);
  return { t:'Sell to '+s.n, h:`<div class="stack"><p class="small muted" style="margin:0">${esc(s.who||s.n)} makes cash offers on the spot. Fast and certain, but dealers need margin: expect well under what patient marketplace selling can get. They have ${money(s.cash)} on hand.</p>
    <div class="panel"><div class="rows">${mine.map(([e,q])=>{ const k=e.t+':'+e.id; const on=sel.includes(k); return `<button class="row" data-act="hselpick" data-a="${k}">${hThumb(e)}<div class="rt"><b>${esc(huntLabel(e))}</b><span>${on?'Selected':'Tap to select'}</span></div><div class="rv"><b>${money(q,true)}</b><span>their offer</span></div></button>`; }).join('')||'<div class="empty">Nothing they want.</div>'}</div></div>
    <button class="btn pri" data-act="hsellgo" data-a="${sid}" data-confirm="Sell for ${money(tot,true)}" ${sel.length?'':'disabled'}>Sell ${sel.length} for ${money(tot,true)}</button></div>` };
}
// ---------- private collections ----------
function pvComposition(s){ const c=s.inv.filter(e=>e.t==='c').length, m=s.inv.filter(e=>e.t==='m').length, x=s.inv.filter(e=>e.t==='s').length; const yrs=s.inv.filter(e=>e.t==='m').map(e=>cmD(objOf(e).k).yr).sort((a,b)=>a-b); const cy=s.inv.filter(e=>e.t==='c').map(e=>D(objOf(e).k).prod.yr).sort((a,b)=>a-b);
  const parts=[]; if (c) parts.push(`about ${Math.round(c/10)*10||c} cards${cy.length?', mostly '+cy[Math.floor(cy.length*0.2)]+'–'+cy[Math.floor(cy.length*0.8)]:''}`); if (m) parts.push(`about ${Math.round(m/10)*10||m} comics${yrs.length?', mostly '+Math.floor(yrs[Math.floor(yrs.length*0.2)]/10)*10+'s to '+Math.floor(yrs[Math.floor(yrs.length*0.8)]/10)*10+'s':''}`); if (x) parts.push(x+' sealed item'+(x>1?'s':'')); return parts.join('; '); }
function pvSheet(id){
  const pv=G.hunt.pv.find(x=>x.id===id); if (!pv) return {t:'Sold', h:'<div class="empty">That collection is gone.</div>'}; const s=pvSeller(pv);
  const rev=pv.rev.map(i=>s.inv[i]).filter(Boolean); const hl=pv.hl.map(x=>{ const [t,id]=x.split(':'); return s.inv.find(e=>e.t===t&&e.id===+id); }).filter(Boolean);
  const m=UI.hmsg&&UI.hmsg.k==='pv'+id?UI.hmsg:null; const left=pv.samp-pv.rev.length;
  return { t:s.n, h:`<div class="stack"><div class="title-block"><div class="yr">Private sale · ${esc(s.who)}</div><h1>${esc(s.n)}</h1><div class="sub">${esc(s.story)}</div></div>
    <dl class="kv"><dt>Size</dt><dd>${s.inv.length} items: ${esc(pvComposition(s))}</dd><dt>Asking</dt><dd class="est">${money(pv.ask)}</dd><dt>Deal</dt><dd>${pv.mode==='cherry'?'Will sell the whole lot or individual pieces':'Whole collection only'}</dd><dt>Offer good until</dt><dd>${fmtDate(pv.exp,true)}</dd></dl>
    ${hl.length?`<div class="panel"><h3>What the seller mentions</h3><div class="rows">${hl.map(e=>`<button class="row" data-act="hpvitem" data-a="${id}:${e.t}:${e.id}">${hThumb(e)}<div class="rt"><b>${esc(huntLabel(e,true))}</b><span>"This one's supposed to be good."</span></div></button>`).join('')}</div></div>`:''}
    <div class="panel"><div class="phead"><h3>What you've looked through</h3><span class="muted small">${rev.length} of ${s.inv.length}</span></div>
      <div class="rows">${rev.map(e=>`<button class="row" data-act="hpvitem" data-a="${id}:${e.t}:${e.id}">${hThumb(e)}<div class="rt"><b>${esc(huntLabel(e,true))}</b><span>${esc(quickCond(e))}</span></div>${pv.mode==='cherry'&&e.p?`<div class="rv"><b>${money(e.p,true)}</b></div>`:''}</button>`).join('')||'<div class="empty">You haven\'t opened any boxes yet.</div>'}</div>
      ${left>0?`<button class="btn" style="margin-top:8px" data-act="hpvlook" data-a="${id}">Look through a few more (${left} left before the seller gets impatient)</button>`:'<p class="small muted" style="margin:8px 0 0">The seller wants a decision.</p>'}</div>
    <div class="panel"><h3>Make a deal</h3><div class="formrow"><input class="inp money-in" type="number" min="1" step="5" id="hpvoffer" placeholder="Offer for everything"><button class="btn" data-act="hpvoffer" data-a="${id}">Offer</button><button class="btn pri" data-act="hpvbuy" data-a="${id}:${pv.ask}" data-confirm="Pay ${money(pv.ask)}" ${G.player.cash<pv.ask?'disabled':''}>Pay the asking price</button></div>
      ${m?`<div class="${m.ok?'ok':'err'}" style="margin-top:8px">${esc(m.txt)}${m.counter?` <button class="btn sm pri" data-act="hpvbuy" data-a="${id}:${m.counter}" data-confirm="Pay ${money(m.counter)}">Accept ${money(m.counter)}</button>`:''}</div>`:''}</div></div>` };
}
function quickCond(e){ const o=objOf(e); if (e.t==='s') return 'Sealed'; if (o.g>0) return 'Graded '+(e.t==='m'?gTxt(o.g):o.g); if (e.t==='m'){ const g=cmGradeOf(o); const lo=CGL[Math.min(CGL.length-1,CGL.indexOf(g)+2)], hi=CGL[Math.max(0,CGL.indexOf(g)-1)]; return 'Looks like '+gTxt(lo)+' to '+gTxt(hi)+(o.c[6]<55?', tanned pages':'')+(o.c[3]<70?', a crease':''); } const mn=Math.min(...o.c); return mn>=90?'Looks sharp':mn>=78?'Light wear':mn>=65?'Visible wear':'Well-loved'; }
function pvItemSheet(pid, t, id){ const pv=G.hunt.pv.find(x=>x.id===pid); if (!pv) return null; const s=pvSeller(pv); const e=s.inv.find(x=>x.t===t&&x.id===id); if (!e) return null; const r=itemSheet(s.id,t,id);
  if (pv.mode!=='cherry') r.h=r.h.replace(/<div class="panel"><h3>Deal<\/h3>[\s\S]*$/, '<p class="small muted">The seller only sells the collection as a whole.</p></div>'); return r; }
// ---------- auction lot, signing, table rental ----------
function lotSheet2(aid, n){ const a=G.hunt.auc.find(x=>x.id===aid); const L_=a&&a.lots.find(x=>x.n===n); if (!L_) return null; const e={t:L_.t,id:L_.id}; const o=objOf(e);
  const art = e.t==='c'? bigCardHTML(o) : `<div class="bigcard cm"><div class="face ${o.g>0?'slab':''}">${cmThumb(o)}</div></div>`;
  const research = e.t==='c'? `${pLink(P(D(o.k).pid))} · <button class="linkbtn" data-act="design" data-a="${esc(o.k)}">Sales and comps</button>` : `${sLink(cmD(o.k).s)} · ${iLink(o.k,'Issue history and sales')}`;
  return { t:'Lot '+n, h:`<div class="stack"><div class="detail">${art}<div class="stack"><div class="title-block"><div class="yr">${esc(a.n)}</div><h1>${esc(huntLabel(e))}</h1></div>
    <dl class="kv"><dt>Estimate</dt><dd class="est">${money(L_.est[0])}–${money(L_.est[1])}</dd><dt>Closes</dt><dd>${fmtDate(a.d,true)}</dd><dt>Research</dt><dd>${research}</dd>${L_.mx?`<dt>Your maximum</dt><dd>${money(L_.mx)}</dd>`:''}</dl>
    <div><b class="small">Catalogue description</b>${e.t==='c'?(o.g>0?`<p class="small">GCS ${o.g}.</p>`:inspectHTML(o,true)):(o.g>0?`<p class="small">GCS ${gTxt(o.g)} ${CGN[o.g]}.</p>`:cmInspectHTML(o,true))}</div></div></div>
    <div class="panel"><h3>Absentee bid</h3><p class="small muted" style="margin:0 0 6px">The house bids for you up to your maximum. Winning adds a 15% premium. Keep the cash on hand for the close.</p><div class="formrow"><input class="inp money-in" type="number" min="1" step="5" id="hlotmax" value="${L_.mx||''}" placeholder="Max bid"><button class="btn pri" data-act="hlotbid" data-a="${aid}:${n}">Set maximum</button>${L_.mx?`<button class="btn" data-act="hlotclr" data-a="${aid}:${n}">Withdraw</button>`:''}</div></div></div>` }; }
function signSheet(si){ const ev=sessEv(); const g=ev&&ev.sign[si]; if (!g) return null;
  let items=[]; if (g.k==='cr'){ items=myComics().filter(c=>c.g===0 && !c.l && !c.sg && (()=>{ const s=cmD(c.k).s; return s.w===g.id||s.a===g.id||s.cv===g.id; })()).map(c=>({t:'m',id:c.id})); }
  else items=myCards().filter(c=>c.g===0 && !c.l && !c.sg && !D(c.k).auto && D(c.k).pid===g.id).map(c=>({t:'c',id:c.id}));
  const who = g.k==='cr'? CR_(g.id).n : pname(P(g.id));
  return { t:'Signing: '+who, h:`<div class="stack"><p class="small muted" style="margin:0">${esc(who)} will sign ${g.k==='cr'?'comics they worked on':'their own cards'}. The signature is witnessed at the event. ${g.fee?money(g.fee)+' each.':'No charge.'}</p>
    <div class="panel"><div class="rows">${items.map(e=>`<div class="row" style="cursor:default">${hThumb(e)}<div class="rt"><b>${esc(huntLabel(e))}</b></div><button class="btn sm pri" data-act="hsigngo" data-a="${si}:${e.t}:${e.id}" ${g.fee?`data-confirm="Pay ${money(g.fee)}"`:''}>Sign it</button></div>`).join('')||`<div class="empty">You don't own anything ${esc(who)} can sign.${g.indie?' Their table has copies for sale.':''}</div>`}</div></div></div>` }; }
function rentSheet(){ const ev=sessEv(); if (!ev) return null; const mine=playerObjs().map(e=>[e,trueValue(e)]).sort((a,b)=>b[1]-a[1]).slice(0,80); const sel=UI.hsel;
  const fee = ev.ty==='nshow'||ev.ty==='bcon'?250: ev.ty==='rshow'||ev.ty==='rcon'||ev.ty==='ccon'?90: 30;
  return { t:'Rent a table', h:`<div class="stack"><p class="small muted" style="margin:0">A table costs ${money(fee)}. Pick up to 25 items. Prices start from recent market estimates; choose how aggressive to be.</p>
    <div class="panel"><div class="rows">${mine.map(([e])=>{ const k=e.t+':'+e.id; const on=sel.includes(k); return `<button class="row" data-act="hselpick" data-a="${k}">${hThumb(e)}<div class="rt"><b>${esc(huntLabel(e))}</b><span>${on?'Bringing it':'Tap to bring'}</span></div>${on?'<div class="rv"><b class="up">✓</b></div>':''}</button>`; }).join('')}</div></div>
    <div class="formrow"><select class="inp" id="hpct"><option value="0.9">Priced to move (90%)</option><option value="1" selected>Market (100%)</option><option value="1.15">Firm (115%)</option><option value="1.35">Testing the room (135%)</option></select><button class="btn pri" data-act="hrentgo" data-confirm="Pay ${money(fee)}" ${sel.length&&sel.length<=25?'':'disabled'}>Rent and set up (${sel.length})</button></div></div>` }; }
// ---------- actions ----------
const hsplit=a=>{ const [sid,t,id,x]=a.split(':'); return [G.hunt.sel[+sid], t, +id, x]; };
ACT.hgo = (a,el)=>{ const [id,late]=a.split(':').map(Number); const ev=G.hunt.ev.find(x=>x.id===id); if (ev && !ev.paid && ev.cost>0 && !armed(el)) return; const err=enterEvent(id, !!late); if (err){ showToast(err); return; } UI.sub.hunt='floor'; UI.tab='hunt'; closeSheet(true); render(); window.scrollTo(0,0); afterAction(); };
ACT.hleave = ()=>{ leaveEvent(); UI.sub.hunt='near'; closeSheet(true); render(); afterAction(); };
ACT.hseller = a=>{ const s=G.hunt.sel[+a]; const ss=sess(); if (ss && !ss.seen.includes(s.id) && evSellers(sessEv()).includes(s)){ if (ss.clock>=480){ showToast('The show is closing up.'); return; } ss.seen.push(s.id); evClock(s.cr!=null?10:20); updateHeader(); } UI.hpg=0; UI.hf='all'; UI.hsort='d'; openSheet(()=>sellerSheet(+a)); };
ACT.hitem = a=>{ UI.hmsg=null; const [s,t,id]=hsplit(a); openSheet(()=>itemSheet(s.id,t,id)); };
ACT.hbox = a=>{ const [sid,p]=a.split(':'); openSheet(()=>boxSheet(+sid,+p)); };
ACT.hdig = a=>{ const ss=sess(); if (ss){ if (ss.clock>=480){ showToast('The show is closing up.'); return; } evClock(8); } G.hunt.dug[a]=(G.hunt.dug[a]||0)+1; refreshSheet(); updateHeader(); };
ACT.hpage = a=>{ UI.hpg=+a; refreshSheet(); }; ACT.hf = a=>{ UI.hf=a; UI.hpg=0; refreshSheet(); }; ACT.hsort = v=>{ UI.hsort=v; refreshSheet(); };
ACT.hbuy = (a,el)=>{ if (!armed(el)) return; const [s,t,id]=hsplit(a); const e=entryById(s,t,id); if (!e){ showToast('Gone.'); return; } const err=playerBuy(s,[e],e.p); if (err){ showToast(err); return; } showToast('Bought. It\'s in your collection.', true); closeSheet(); refresh(); afterAction(); };
ACT.hoffer = a=>{ const [s,t,id]=hsplit(a); const e=entryById(s,t,id); const v=Math.round(parseFloat($('#hoffer').value)*100)/100; if (!e||!(v>0)) return; if (G.player.cash<v){ showToast('You don\'t have that much.'); return; }
  const r=negotiate(s,[e],v); if (r.ok){ playerBuy(s,[e],v); showToast('Deal at '+money(v,true)+'.', true); closeSheet(); refresh(); afterAction(); return; }
  UI.hmsg={k:a, ok:0, txt:r.no||r.msg, counter:r.counter}; refreshSheet(); queueSave(); };
ACT.hbest = a=>{ const [s,t,id]=hsplit(a); const e=entryById(s,t,id); const k=a+':best'; if (G.hunt.asked===k+G.day){ UI.hmsg={k:a, txt:'"I already told you my best."'}; refreshSheet(); return; } G.hunt.asked=k+G.day; const b=bestPrice(s,[e]); G.hunt.lastCounter={k:e.t+e.id,p:b,s:s.id}; UI.hmsg={k:a, ok:1, txt:b<e.p?`"For you, ${money(b,true)}."`:'"The price is the price."', counter:b<e.p?b:null}; refreshSheet(); };
ACT.haccept = (a,el)=>{ if (!armed(el)) return; const [sid,t,id,c]=a.split(':'); const s=G.hunt.sel[+sid]; const e=entryById(s,t,+id); if (!e) return; const err=playerBuy(s,[e],+c); if (err){ showToast(err); return; } showToast('Deal at '+money(+c,true)+'.', true); closeSheet(); refresh(); afterAction(); };
ACT.hcart = a=>{ const [s,t,id]=hsplit(a); const k=id+':'+t; const c=G.hunt.cart=G.hunt.cart||[]; const i=c.indexOf(k); if (i>=0) c.splice(i,1); else c.push(k); refreshSheet(); };
ACT.hhold = a=>{ const [s,t,id]=hsplit(a); const e=entryById(s,t,id); e.hold=G.day+1; showToast(s.who+' puts it behind the counter for you until tomorrow.', true); refreshSheet(); queueSave(); };
ACT.hbundle = a=>{ UI.hmsg=null; UI.htrade=[]; openSheet(()=>bundleSheet(+a)); };
ACT.htrade = a=>{ const i=UI.htrade.indexOf(a); if (i>=0) UI.htrade.splice(i,1); else UI.htrade.push(a); refreshSheet(); };
function bundleParts(sid){ const s=G.hunt.sel[sid]; const cart=(G.hunt.cart||[]).map(x=>{ const [id,t]=x.split(':'); return entryById(s,t,+id); }).filter(Boolean); const tr=UI.htrade.map(x=>{ const [t,id]=x.split(':'); return {t,id:+id}; }).filter(e=>{ const o=objOf(e); return o&&o.o===0; }); return [s,cart,tr]; }
function doBundle(s,cart,tr,cash){ if (G.player.cash<cash){ showToast('You don\'t have that much.'); return false; } if (tr.length) applyTrade(s,tr); playerBuy(s,cart,cash); G.hunt.cart=[]; UI.htrade=[]; showToast('Deal done.', true); closeSheet(); refresh(); afterAction(); return true; }
ACT.hbofferGo = a=>{ const [s,cart,tr]=bundleParts(+a); const v=Math.max(0,Math.round((parseFloat($('#hboffer').value)||0)*100)/100); const r=negotiate(s,cart,v,tr.length?tr:null); if (r.ok){ doBundle(s,cart,tr,v); return; } UI.hmsg={k:'b'+a, txt:r.no||r.msg, counter:r.counter!=null? Math.max(0,Math.round((r.counter-(r.credit||0))*100)/100) : null}; refreshSheet(); queueSave(); };
ACT.hbbest = a=>{ const [s,cart,tr]=bundleParts(+a); const b=bestPrice(s,cart); const cr=tr.length?tradeCredit(s,tr):0; UI.hmsg={k:'b'+a, ok:1, txt:`"All of it for ${money(b,true)}${cr?', less '+money(cr,true)+' for your trade':''}."`, counter:Math.max(0,Math.round((b-cr)*100)/100)}; refreshSheet(); };
ACT.hbaccept = (a,el)=>{ if (!armed(el)) return; const [sid,c]=a.split(':'); const [s,cart,tr]=bundleParts(+sid); doBundle(s,cart,tr,+c); };
ACT.hsell = a=>{ UI.hsel=[]; openSheet(()=>sellSheet(+a)); };
ACT.hselpick = a=>{ const i=UI.hsel.indexOf(a); if (i>=0) UI.hsel.splice(i,1); else UI.hsel.push(a); refreshSheet(); };
ACT.hsellgo = (a,el)=>{ if (!armed(el)) return; const s=G.hunt.sel[+a]; const items=UI.hsel.map(x=>{ const [t,id]=x.split(':'); return {t,id:+id}; }); const err=sellToSeller(s,items); if (err){ showToast(err); return; } UI.hsel=[]; showToast('Sold. Cash in hand.', true); closeSheet(); refresh(); afterAction(); };
ACT.hpv = a=>{ UI.hmsg=null; openSheet(()=>pvSheet(+a)); };
ACT.hpvlook = a=>{ const pv=G.hunt.pv.find(x=>x.id===+a); pvReveal(pv,5); refreshSheet(); queueSave(); };
ACT.hpvitem = a=>{ const [pid,t,id]=a.split(':'); UI.hmsg=null; openSheet(()=>pvItemSheet(+pid,t,+id)); };
ACT.hpvoffer = a=>{ const pv=G.hunt.pv.find(x=>x.id===+a); const v=Math.round(parseFloat($('#hpvoffer').value)); if (!pv||!(v>0)) return; if (G.player.cash<v){ showToast('You don\'t have that much.'); return; } const r=pvOffer(pv,v); if (r.ok){ ACT.hpvbuy(pv.id+':'+v, null, null, true); return; } UI.hmsg={k:'pv'+a, txt:r.no||r.msg, counter:r.counter}; refreshSheet(); queueSave(); };
ACT.hpvbuy = (a,el,e,skip)=>{ if (!skip && !armed(el)) return; const [id,p]=a.split(':').map(Number); const pv=G.hunt.pv.find(x=>x.id===id); if (!pv) return; const n=pvSeller(pv).inv.length; const err=pvBuyAll(pv,p); if (err){ showToast(err); return; } showToast('Bought the collection: '+n+' items. They\'re in your collection, marked New.', true); closeSheet(true); UI.cf.f='new'; UI.ccf.f='new'; refresh(); afterAction(); };
ACT.hlot = a=>{ const [aid,n]=a.split(':').map(Number); openSheet(()=>lotSheet2(aid,n)); };
ACT.hlotbid = a=>{ const [aid,n]=a.split(':').map(Number); const L_=G.hunt.auc.find(x=>x.id===aid).lots.find(x=>x.n===n); const v=Math.round(parseFloat($('#hlotmax').value)); if (!(v>0)) return; L_.mx=v; showToast('Absentee bid set at '+money(v)+'.', true); refreshSheet(); render(true); queueSave(); };
ACT.hlotclr = a=>{ const [aid,n]=a.split(':').map(Number); G.hunt.auc.find(x=>x.id===aid).lots.find(x=>x.n===n).mx=0; refreshSheet(); render(true); queueSave(); };
ACT.hsign = a=>openSheet(()=>signSheet(+a));
ACT.hsigngo = (a,el)=>{ const [si,t,id]=a.split(':'); const ev=sessEv(); if (ev.sign[+si].fee && !armed(el)) return; const err=signItem(ev.id,+si,t,+id); if (err){ showToast(err); return; } showToast('Signed, with a witness sticker.', true); refreshSheet(); updateHeader(); afterAction(); };
ACT.hrent = ()=>{ UI.hsel=[]; openSheet(rentSheet); };
ACT.hrentgo = (a,el)=>{ if (!armed(el)) return; const ev=sessEv(); const items=UI.hsel.map(x=>{ const [t,id]=x.split(':'); return {t,id:+id}; }); const err=rentTable(ev.id, items, parseFloat($('#hpct').value)); if (err){ showToast(err); return; } UI.hsel=[]; showToast('Table set up. Buyers will come to you while you walk the show.', true); closeSheet(true); render(); afterAction(); };
ACT.hwantdel = a=>{ G.hunt.want.splice(+a,1); render(true); queueSave(); };
ACT.hwant = a=>{ const [t,...r]=a.split('~'); const id = (t==='k'||t==='i')? r.join('~') : +r[0]; wantToggle({t,id}); showToast(wantHas({t,id})?'Added to your want list.':'Removed from your want list.', wantHas({t,id})); refreshSheet(); queueSave(); };
// ---------- want-list buttons on existing pages ----------
function wantBtn(t,id){ const on=G.hunt&&wantHas({t,id}); return `<div class="formrow" style="margin:0"><button class="btn sm" data-act="hwant" data-a="${t}~${esc(String(id))}">${on?'★ On your want list':'Add to want list'}</button></div>`; }
function injectWant(fn, mk_){ return function(){ const r=fn.apply(null, arguments); if (!r || !G.hunt) return r; const w=mk_.apply(null, arguments); if (!w) return r; const i=r.h.indexOf('<div class="stack">'); if (i<0) return r; const j=i+'<div class="stack">'.length; r.h=r.h.slice(0,j)+wantBtn(w[0],w[1])+r.h.slice(j); return r; }; }
playerSheet = injectWant(playerSheet, pid=>['p',pid]);
designSheet = injectWant(designSheet, key=>[key[0]==='M'?'i':'k', key]);
seriesSheet = injectWant(seriesSheet, sid=>['s',sid]);
creatorSheet = injectWant(creatorSheet, id=>['cr',id]);
productSheet = injectWant(productSheet, pid=>['pr',pid]);
// ---------- nav & collection glue ----------
(function(){
  const collV=VIEWS.coll; VIEWS.coll=()=>{ const h=collV(); const i=h.indexOf('<div class="subtabs">'); if (i<0) return h; const j=h.indexOf('</div>',i); return h.slice(0,j)+'<button data-act="tab" data-a="grade">Grading</button>'+h.slice(j); };
  const gradeV=VIEWS.grade; VIEWS.grade=()=>{ const h=gradeV(); const i=h.indexOf('<div class="subtabs">'); if (i<0) return h; const j=i+'<div class="subtabs">'.length; return h.slice(0,j)+'<button data-act="tab" data-a="coll">← Collection</button>'+h.slice(j); };
  const bf=badgeFor; badgeFor=function(t){ if (t==='coll') return bf('coll')+bf('grade'); if (t==='hunt') return G.hunt? G.hunt.ev.filter(ev=>evLive(ev) && !['garage','flea'].includes(ev.ty) && !ev.paid).length : 0; return bf(t); };
  const homeV=VIEWS.home; VIEWS.home=()=>{ const h=homeV(); if (!G.hunt) return h; const today=G.hunt.ev.filter(ev=>evLive(ev)); const i=h.indexOf('<div class="cols">'); if (i<0) return h;
    const strip=`<div class="panel" style="margin-bottom:14px"><div class="phead"><h3>Out and about</h3><button class="linkbtn" data-act="goto" data-a="hunt:near">The Hunt</button></div><div class="rows">${today.length? today.map(ev=>evRow(ev,1)).join('') : '<div class="small muted">No shows or sales today. The local shops are open.</div>'}${G.hunt.pv.slice(0,2).map(pvRow).join('')}</div></div>`;
    return h.slice(0,i)+strip+h.slice(i); };
})();

function tcase(h){ return String(h).toLowerCase().replace(/(^|[\s(\-"'#])([a-z])/g,(m,a,b)=>a+b.toUpperCase()).replace(/\b(A|An|The|Of|In|On|At|To|For|And|Or|As|By|With|From)\b(?!$)/g,(m,w,i)=>i===0?w:w.toLowerCase()); }
// ===================== FLOW: keeping track of a moving hobby =====================
const DOW=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
function dayTxt(d){ const n=d-G.day; return n===0?'Today': n===1?'Tomorrow': DOW[dowOf(d)]+' '+fmtDate(d); }
function nextDow(w, from){ let d=(from==null?G.day:from)+1; while (dowOf(d)!==w) d++; return d; }
// ---------- everything with a date on it, in one list ----------
function upNext(){
  const out=[]; const add=(d,txt,act,a,kind)=>{ if (d>=G.day) out.push({d,txt,act,a,kind}); };
  for (const s of G.player.subs||[]){ const c=C(s.cid); if (c) add(s.t1,'Back from GCS: '+cardName(c),'card',c.id,'grade'); }
  for (const s of G.player.csubs||[]){ const c=MC(s.cid); if (c) add(s.t1,(s.kind==='press'?'Back from pressing: ':'Back from GCS: ')+cmD(c.k).title,'ccopy',c.id,'grade'); }
  for (const l of myListings()) if (l.ty==='auc') add(l.en,'Your auction ends: '+itemLabel(l),'listing',l.id,'market');
  for (const l of G.lst) if (l.ty==='auc' && l.sel!==0 && l.bids.some(b=>b[0]===0)) add(l.en,(l.lead===0?'Winning':'Outbid')+': '+itemLabel(l),'listing',l.id,'market');
  if (G.cm){ add(nextDow(3, G.day-1)===G.day?G.day:nextDow(3),'New comics at '+SHOP_NAME,'goto','comics:week','comics');
    const pre=new Map(); for (const p of G.cm.pre){ const s=S_(p.sid); const k=p.d; pre.set(k,(pre.get(k)||[]).concat(sTitle(s)+' #'+p.n)); }
    for (const [d,l] of pre) add(d,'Preorder arrives: '+l.slice(0,2).join(', ')+(l.length>2?' +'+(l.length-2):''),'goto','comics:week','comics'); }
  { const pay=G.player.pay!=null?G.player.pay:50; if (pay>0) add(dowOf(G.day)===5?G.day:nextDow(5),'Payday: +'+money(pay),null,null,'cash'); }   // the scenario's real allowance (none for Deep pockets)
  const rel=G.products.filter(p=>!p.cl && p.rel>=G.day).sort((a,b)=>a.rel-b.rel)[0]; if (rel) add(rel.rel,'Release: '+prodName(rel),'product',rel.id,'cards');
  if (G.hunt){ for (const ev of G.hunt.ev.filter(ev=>ev.ann<=G.day && ev.d+ev.days>G.day && ev.ty!=='flea' && ev.ty!=='garage').sort((a,b)=>a.d-b.d).slice(0,4)) add(Math.max(ev.d,G.day), ev.n+(ev.cost>40?' ('+money(ev.cost)+' to attend)':''),'goto','hunt:events','hunt');
    const gs=G.hunt.ev.filter(ev=>ev.ty==='garage' && ev.ann<=G.day && ev.d>=G.day); if (gs.length) add(gs[0].d, gs.length>1? gs.length+' garage sales':gs[0].n,'goto','hunt:events','hunt');
    for (const a of G.hunt.auc.filter(a=>!a.done && a.ann<=G.day)) add(a.d, a.n+' closes'+(a.lots.some(l=>l.mx)?' (you have bids)':''),'goto','hunt:auction','hunt');
    for (const pv of G.hunt.pv) add(pv.exp,'Last day to buy: '+pvSeller(pv).n,'hpv',pv.id,'hunt'); }
  return out.sort((a,b)=>a.d-b.d || (a.kind==='grade'?-1:1));
}
function upRow(x, skip){ const btn = x.d>G.day && skip ? `<button class="btn sm ${skip==='pri'?'pri':''}" data-act="skipto" data-a="${x.d}">Skip ${x.d-G.day}d</button>` : ''; return `<div class="row upn"><div class="upd">${esc(dayTxt(x.d))}</div>${x.act?`<button class="linkbtn rt" style="text-align:left" data-act="${x.act}" data-a="${esc(String(x.a))}"><b>${esc(x.txt)}</b></button>`:`<div class="rt"><b>${esc(x.txt)}</b></div>`}${btn}</div>`; }
function upNextPanel(){ const u=upNext().slice(0,7); return `<div class="panel"><div class="phead"><h3>Up next</h3><button class="linkbtn" data-act="skipsheet">Skip ahead</button></div><div class="rows">${u.map(x=>upRow(x,1)).join('')||'<div class="empty">Nothing scheduled.</div>'}</div></div>`; }
function skipSheet(){
  const u=upNext(); const seen=new Set(); const opts=u.filter(x=>x.d>G.day && !seen.has(x.d+'|'+x.kind) && seen.add(x.d+'|'+x.kind)).slice(0,10);
  return { t:'Skip ahead', h:`<div class="stack"><p class="small muted" style="margin:0">Jump straight to the next thing you care about. The skip stops early if you're outbid or get an offer.</p>
    <div class="panel"><div class="rows">${opts.map(x=>`<button class="row" data-act="skipto" data-a="${x.d}"><div class="upd">${esc(dayTxt(x.d))}</div><div class="rt"><b>${esc(x.txt)}</b><span>${x.d-G.day} day${x.d-G.day>1?'s':''} from now</span></div></button>`).join('')}</div></div>
    <div class="formrow"><button class="btn" data-act="skipto" data-a="${G.day+7}">One week</button><button class="btn" data-act="skipto" data-a="${G.day+14}">Two weeks</button><button class="btn" data-act="skipto" data-a="${G.day+30}">A month</button></div></div>` };
}
ACT.skipsheet = ()=>openSheet(skipSheet);
ACT.skipto = a=>{ closeSheet(true); const n=(+a)-G.day; if (n>0) ACT.adv(String(n)); };

// ---------- what changed while time passed ----------
function holdingSnap(){ const m=new Map(); for (const c of myCards()) m.set('c'+c.id,[cardValue(c), c.k, cardName(c)+' '+shortLine(c)]); if (G.cm) for (const c of myComics()) m.set('m'+c.id,[cmCopyValue(c), c.k, cmItemLabel(c)]); for (const s of mySealed()){ const prod=G.products[s.p]; m.set('s'+s.id,[sealedFair(prod,s.f), sealedKey(prod,s.f), prodName(prod)+' '+FMT_NAME[s.f].toLowerCase()]); } return m; }
function ownedPlayers(){ const m=new Map(); for (const c of myCards()){ const pid=D(c.k).pid; m.set(pid,(m.get(pid)||0)+1); } return m; }
function ownedSeries(){ const m=new Map(); if (G.cm) for (const c of myComics()){ const sid=cmD(c.k).sid; m.set(sid,(m.get(sid)||0)+1); } return m; }
function newsWhy(n){ return n? `<span class="why">${esc(tcase(n.h))}</span>` : ''; }
function reasonFor(key){ // the most recent headline that plausibly moved this
  const t0=G.day-35;
  if (key[0]==='M'){ const sid=cmD(key).sid; const s=S_(sid); const chars=new Set(issueKeys(s,cmD(key).n).map(k=>k[2])); return G.news.find(n=>n.t>=t0 && n.k==='comic' && (n.cs===sid || (n.cc!=null && chars.has(n.cc)))); }
  if (key[0]==='S') return null; const pid=D(key).pid; return G.news.find(n=>n.t>=t0 && n.p===pid);
}
function recapHTML(r){
  const moves=r.moves.slice(0,6), mine=r.mine.slice(0,5), other=r.other.slice(0,4);
  return `<div class="stack">
    ${r.stop?`<div class="note small">${esc(r.stop)}</div>`:''}
    ${r.log.length?`<div class="panel"><h3>What happened</h3><div class="rows">${r.log.map(x=>`<div class="newsrow"><div class="meta">${fmtDate(x[0])}</div><div>${esc(x[1])}</div></div>`).join('')}</div></div>`:''}
    ${moves.length?`<div class="panel"><h3>Your collection moved</h3><p class="small muted" style="margin:0 0 6px">Estimated value, ${fmtDate(r.t0)} to ${fmtDate(r.t1)}. Collection ${money(r.v0)} → ${money(r.v1)}.</p><div class="rows">${moves.map(m=>`<button class="row" data-act="${m.id[0]==='c'?'card':m.id[0]==='m'?'ccopy':'sealed'}" data-a="${m.id.slice(1)}"><div class="rt"><b>${esc(m.label)}</b>${m.why?newsWhy(m.why):'<span>No headline; sales and supply moved it.</span>'}</div><div class="rv"><b class="${m.d>0?'up':'down'}">${m.d>0?'▲':'▼'} ${Math.abs(Math.round(m.pct))}%</b><span>${money(m.v1,true)}</span></div></button>`).join('')}</div></div>`:''}
    ${mine.length?`<div class="panel"><h3>News about things you own</h3>${mine.map(anyNewsRow).join('')}</div>`:''}
    ${other.length?`<div class="panel"><h3>Other headlines</h3>${other.map(anyNewsRow).join('')}</div>`:''}
    ${marketPulse(true)}
    <div class="panel"><h3>Coming up</h3><div class="rows">${upNext().slice(0,4).map(x=>upRow(x,0)).join('')}</div></div></div>`;
}
function buildRecap(t0, snap0, log, stop){
  const snap1=holdingSnap(); const moves=[]; let v0=0, v1=0;
  for (const [id,[v,k,label]] of snap1){ v1+=v; const o=snap0.get(id); if (!o) continue; v0+=o[0]; const d=v-o[0]; const pct=o[0]>0? d/o[0]*100 : 0; if (Math.abs(d)>=Math.max(1, o[0]*0.08)) moves.push({id, label, d, pct, v1:v, why:reasonFor(k)}); }
  moves.sort((a,b)=>Math.abs(b.d)-Math.abs(a.d));
  const op=ownedPlayers(), os=ownedSeries(); const recent=G.news.filter(n=>n.t>t0);
  const isMine=n=> (n.p!=null && op.has(n.p)) || (n.cs!=null && os.has(n.cs));
  const r={ t0, t1:G.day, v0, v1, moves, log, stop, mine:recent.filter(isMine), other:recent.filter(n=>!isMine(n) && (n.k==='comic'||isCardGameNews(n.k)||n.p!=null||n.k==='hobby')) };
  G.player.lastRecap={ t0, t1:G.day, n:moves.length+r.mine.length };
  return r;
}
function anyNewsRow(n){ return n.k==='comic'&&G.cm? cmNewsRow(n) : newsRow(n); }
// ---------- market pulse: what's moving and why ----------
function playerMove(p, days){ const h=p.hx; if (!h || h.length<3) return 0; const t=G.day-days; let old=null; for (const x of h){ if (x[0]<=t) old=x[1]; } if (old==null) old=h[0][1]; const now=playerBase(p); return old>0? (now-old)/old : 0; }
function seriesMove(s){ const h=s.vw; if (!h || h.length<2) return 0; const old=h[0], now=h[h.length-1]; return old>0? (now-old)/old : 0; }
function trackSeries(t){ // weekly: remember what a #1 was worth, for the series people are watching
  if (!G.cm) return;
  const fol=new Set((G.player.cfol)||[]), own=ownedSeries();
  for (const s of G.cm.ser){ if (!s.n) continue; const h=s.heat+s.spec; if (h<0.5 && !fol.has(s.id) && !own.has(s.id) && !s.vw) continue;
    const v=Math.round(cmFair(mk(s.id,1,1,''),0)*100)/100; (s.vw=s.vw||[]).push(v); if (s.vw.length>5) s.vw.shift(); if (h<0.3 && !fol.has(s.id) && !own.has(s.id) && s.vw.every(x=>x<3)) delete s.vw; }
}
function marketPulse(compact){
  const ps=G.players.filter(p=>p.hx && p.hx.length>5 && playerBase(p)>0.35).map(p=>[p, playerMove(p,21)]).filter(x=>Math.abs(x[1])>=0.12);
  const up=ps.filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1]).slice(0,compact?3:5), dn=ps.filter(x=>x[1]<0).sort((a,b)=>a[1]-b[1]).slice(0,compact?2:4);
  const ss=G.cm? G.cm.ser.filter(s=>s.vw && s.vw.length>=3).map(s=>[s, seriesMove(s)]).filter(x=>Math.abs(x[1])>=0.15 && x[0].vw[x[0].vw.length-1]>=3) : [];
  const sup=ss.filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1]).slice(0,compact?3:5), sdn=ss.filter(x=>x[1]<0).sort((a,b)=>a[1]-b[1]).slice(0,compact?2:4);
  const why=(pid)=>G.news.find(n=>n.p===pid && n.t>=G.day-30); const swhy=(sid)=>G.news.find(n=>n.cs===sid && n.t>=G.day-45);
  const prow=([p,m])=>{ const w=why(p.id); return `<button class="row" data-act="player" data-a="${p.id}"><div class="rt"><b>${esc(pname(p))}</b>${w?newsWhy(w):`<span>${esc(pulseGuess(p,m))}</span>`}</div><div class="rv"><b class="${m>0?'up':'down'}">${m>0?'▲':'▼'} ${Math.round(Math.abs(m)*100)}%</b><span>card index</span></div></button>`; };
  const srow=([s,m])=>{ const w=swhy(s.id); return `<button class="row" data-act="cseries" data-a="${s.id}"><div class="rt"><b>${esc(sTitle(s))}</b>${w?newsWhy(w):`<span>${esc(m>0?'Buyers are chasing it; no single headline':'Interest is fading')}</span>`}</div><div class="rv"><b class="${m>0?'up':'down'}">${m>0?'▲':'▼'} ${Math.round(Math.abs(m)*100)}%</b><span>#1 value</span></div></button>`; };
  if (!up.length && !dn.length && !sup.length && !sdn.length) return compact? '' : '<div class="panel"><h3>Market pulse</h3><div class="empty">Nothing is moving much right now.</div></div>';
  return `<div class="panel"><div class="phead"><h3>Market pulse</h3><span class="muted small">last 3 to 4 weeks</span></div><p class="small muted" style="margin:0 0 6px">What's moving, and the most likely reason. Prices follow news, performance, sales and supply.</p>
    ${up.length||dn.length?`<div class="small muted" style="margin:4px 0">Baseball cards</div><div class="rows">${up.concat(dn).map(prow).join('')}</div>`:''}
    ${sup.length||sdn.length?`<div class="small muted" style="margin:8px 0 4px">Comics</div><div class="rows">${sup.concat(sdn).map(srow).join('')}</div>`:''}</div>`;
}
function pulseGuess(p, m){ if (p.tm===-1) return m>0?'No single headline: prospect buzz and buying':'No single headline: prospect buzz fading'; if (p.tm===-2) return m>0?'No single headline: collectors revisiting a retired name':'No single headline: interest drifting'; return m>0?'No single headline: recent play and buying pressure':'No single headline: recent play and selling'; }
// ---------- time: skip with early stop, then recap ----------
ACT.adv = async (a)=>{
  if (UI.busy) return; UI.busy=true;
  const n=+a||1; UI.log=[]; const t0=G.day; const snap0=holdingSnap();
  const ob0 = new Set(outbidLive().map(l=>l.id)); const off0 = myListings().reduce((s,l)=>s+l.offers.length,0);
  document.querySelectorAll('[data-act="adv"],[data-act="skipsheet"]').forEach(b=>b.disabled=true);
  let stop='';
  try {
    for (let i=0;i<n;i++){ advanceDay(); if (dowOf(G.day)===3) trackSeries(G.day);
      if (n>1){ updateHeader(); await new Promise(r=>setTimeout(r,0));
        if (i<n-1){ const ob=outbidLive().filter(l=>!ob0.has(l.id)); const off=myListings().reduce((s,l)=>s+l.offers.length,0)-off0; if (ob.length||off>0){ stop='Stopped early on '+fmtDate(G.day)+': '+(ob.length?'you were outbid.':'you have a new offer.'); break; } } } }
  } catch(e){ console.error(e); }
  const log=UI.log; UI.log=null; UI.busy=false;
  document.querySelectorAll('[data-act="adv"],[data-act="skipsheet"]').forEach(b=>b.disabled=false);
  const ob = outbidLive().filter(l=>!ob0.has(l.id)); const off = myListings().reduce((s,l)=>s+l.offers.length,0)-off0;
  if (ob.length) log.push([G.day, 'Outbid on '+ob.length+(ob.length>1?' auctions':' auction')+': '+ob.map(itemLabel).slice(0,2).join('; ')]);
  if (off>0) log.push([G.day, off+(off>1?' new offers':' new offer')+' on your listings']);
  const r=buildRecap(t0, snap0, log, stop); UI.recap=r;
  refresh();
  const days=G.day-t0;
  if (days>1 || log.length>2 || r.moves.length>=2 || r.mine.length || (r.world&&r.world.length)) openSheet(()=>({ t: days>1? 'While you were away' : 'Today, '+fmtDate(G.day), h: recapHTML(r) }));
  else log.forEach(x=>showToast(x[1], x[2]));
  queueSave();
};
ACT.recap = ()=>{ if (UI.recap) openSheet(()=>({ t:'Last update', h:recapHTML(UI.recap) })); };
// ---------- news knows what you own ----------
const _newsRow=newsRow; newsRow = function(n){ if (n.k==='comic' && G.cm) return cmNewsRow(n); let h=_newsRow(n); if (n.p!=null){ const c=ownedPlayers().get(n.p); if (c) h=h.replace('<div class="meta">',`<div class="meta"><span class="tag own">You own ${c}</span> `); } return h; };
const _cmNewsRow=cmNewsRow; cmNewsRow = function(n){ let h=_cmNewsRow(n); if (n.cs!=null){ const c=ownedSeries().get(n.cs); if (c) h=h.replace('<div class="meta">',`<div class="meta"><span class="tag own">You own ${c}</span> `); } return h; };
// ---------- a reason line on player and series pages ----------
playerSheet = (function(f){ return function(pid){ const r=f(pid); if (!r) return r; const p=P(pid); const m=playerMove(p,21); if (Math.abs(m)<0.1) return r; const w=G.news.find(n=>n.p===pid && n.t>=G.day-30);
  const line=`<div class="note small"><b class="${m>0?'up':'down'}">${m>0?'▲':'▼'} ${Math.round(Math.abs(m)*100)}% in three weeks.</b> ${w?'Probably: '+esc(tcase(w.h))+'.':esc(pulseGuess(p,m))+'.'}</div>`;
  const i=r.h.indexOf('<div class="kpis">'); if (i>=0) r.h=r.h.slice(0,i)+line+r.h.slice(i); return r; }; })(playerSheet);
seriesSheet = (function(f){ return function(sid){ const r=f(sid); if (!r) return r; const s=S_(sid); const m=seriesMove(s); if (!s.vw || s.vw.length<3 || Math.abs(m)<0.12) return r; const w=G.news.find(n=>n.cs===sid && n.t>=G.day-45);
  const line=`<div class="note small"><b class="${m>0?'up':'down'}">#1 ${m>0?'up':'down'} ${Math.round(Math.abs(m)*100)}% in the last few weeks.</b> ${w?'Probably: '+esc(tcase(w.h))+'.':''}</div>`;
  const i=r.h.indexOf('<p class="small" style="margin:0">'); if (i>=0) r.h=r.h.slice(0,i)+line+r.h.slice(i); return r; }; })(seriesSheet);
// ---------- home: up next, pulse, recap link ----------
(function(){ const homeV=VIEWS.home; VIEWS.home=()=>{ let h=homeV(); const a=h.indexOf('<div class="panel" style="margin-bottom:14px">'), b=h.indexOf('<div class="cols">'); const i = a>=0 && a<b ? a : b; if (i<0) return h;
  const rc = UI.recap && UI.recap.t1===G.day ? `<button class="btn sm" data-act="recap">What changed since ${fmtDate(UI.recap.t0)}</button>` : '';
  const top=`<div class="cols" style="margin-bottom:14px"><div class="stack">${upNextPanel()}${rc?`<div>${rc}</div>`:''}</div><div class="stack">${marketPulse(true)}</div></div>`;
  return h.slice(0,i)+top+h.slice(i); }; })();
// the header: "+7" becomes "Skip", which knows what's coming
(function(){ const uh=updateHeader; updateHeader=function(){ uh(); const b=document.querySelector('.adv [data-a="7"]'); if (b){ b.dataset.act='skipsheet'; b.textContent='Skip'; b.title='Skip ahead to the next thing'; } }; })();

function seedTracking(){ if (!G.cm) return; if (!G.cm.ser.some(s=>s.vw)) trackSeries(G.day); }

// ===================== VISUALS: inspection, price check, presentation =====================
function cardTeam(d,p){ const car=p.car[d.prod.yr-1]; return (car&&car.t>=0)?car.t:(p.tm>=0?p.tm:p.org); }
function objFor(kind, id){ return kind==='c'? C(id) : kind==='m'? MC(id) : null; }
function faceSVG(kind, o){ if (kind==='c') return o.g>0? slabSVG(o) : withCond(cardFront(o.k,o.s), o); return o.g>0? comicSlab(o) : withCmCond(comicCover(o.k), o); }
function finOf(kind, o){ if (o.g>0) return 'slab'; if (kind==='m'){ const d=cmD(o.k); return d.v==='F'?'foil':'paper'; } const d=D(o.k); const br=B(d.prod); if (d.parObj) return d.parObj.fin; return br.tmpl==='vel'||br.tmpl==='spr'?'chrome':'gloss'; }
function miniSpark(key, g, w, h){ const s=(G.sales[key]||[]).filter(x=>(x[2]||0)===(g||0)).slice(0,10).reverse(); if (s.length<3) return ''; w=w||46; h=h||14; const v=s.map(x=>x[1]); const mn=Math.min(...v), mx=Math.max(...v); const pts=v.map((y,i)=>`${(i/(v.length-1)*w).toFixed(1)},${(h-2-(mx>mn?(y-mn)/(mx-mn):0.5)*(h-4)).toFixed(1)}`).join(' '); const up=v[v.length-1]>=v[0]; const vol = mx>mn*1.8; return `<svg class="spark" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-label="${up?'Rising':'Falling'}${vol?', volatile':''}"><polyline points="${pts}" fill="none" stroke="${vol?'#d9a21b':up?'#2f9e5b':'#c0392b'}" stroke-width="1.4" stroke-linejoin="round"/></svg>`; }
function pcData(kind, o){
  if (kind==='c'){ const d=D(o.k), p=P(d.pid); const g=o.g>0?o.g:0; const r=estRange(o.k,g,o); const sales=(G.sales[o.k]||[]).filter(x=>(x[2]||0)===g);
    return { key:o.k, g, title:pname(p), sub:d.prod.yr+' '+B(d.prod).name+' '+d.title+(o.s&&d.run?' · '+o.s+'/'+d.run:''), cond: g? 'GCS '+g+' '+GRADE_NAMES[g] : 'Raw', r, sales, other:(G.sales[o.k]||[]).filter(x=>(x[2]||0)!==g).slice(0,3), gl:x=>x>0?'GCS '+x:'raw',
      meta:[['Set',d.prod.yr+' '+B(d.prod).name],['Card',d.title+' #'+d.cardNo],['Team',teamName(cardTeam(d,p))],['Rarity', [d.rc?'Rookie':'', d.auto?'Autograph':'', d.parObj?d.parObj.n:'', d.run?'Numbered /'+d.run:'', d.variation?(d.sec==='w'?'Super short print':'Short print'):''].filter(Boolean).join(', ')||'Base'],['Serial', d.run&&o.s? o.s+' of '+d.run : '']] };
  }
  const d=cmD(o.k), s=d.s; const g=o.g>0?o.g:0; const r=cmEst(o.k,g,o); const sales=(G.sales[o.k]||[]).filter(x=>(x[2]||0)===g);
  return { key:o.k, g, title:d.title, sub:[pubName(s), d.yr, d.label].filter(Boolean).join(' · '), cond: g? 'GCS '+gTxt(g)+' '+CGN[g]+(o.gr?', restored':'') : 'Raw', r, sales, other:(G.sales[o.k]||[]).filter(x=>(x[2]||0)!==g).slice(0,3), gl:x=>x>0?'GCS '+gTxt(x):'raw',
    meta:[['Publisher',pubName(s)],['Published',monYr(d.day)],['Edition',d.label||'Cover A'],['Key', d.tr?'':issueKeys(s,d.n).map(k=>keyText(k,s)).slice(0,2).join('; ')],['Signed', o.sg? (o.sg.s==='a'?'Authenticated':o.sg.s==='w'?'Witnessed':'Unverified')+', '+CR_(o.sg.c).n : '']] };
}
function pcHTML(pc){
  const pts=pc.sales.slice(0,16).reverse().map(x=>[x[0],x[1]]);
  return `<div class="pc"><div class="pc-est"><small>Estimated value, ${esc(pc.cond.toLowerCase())}</small><b>${fmtRange(pc.r)}</b>${pc.r.limited?'<span class="muted small">Few sales to go on.</span>':''}</div>
    ${pts.length>=3?`<div class="pc-chart">${sparkSVG(pts,{h:70,dots:true})}</div>`:''}
    <div class="pc-sales">${pc.sales.slice(0,4).map(x=>`<div><span>${fmtDate(x[0])}</span><b>${money(x[1],true)}</b></div>`).join('')||'<div class="muted small">No sales at this grade yet.</div>'}${pc.other.length?`<div class="muted small" style="margin-top:4px">Other grades: ${pc.other.map(x=>money(x[1],true)+' ('+pc.gl(x[2]||0)+')').join(', ')}</div>`:''}</div></div>`;
}
// ---------- price check: one tap, no navigation ----------
function pcSheet(kind, id){
  const o=objFor(kind,id); if (!o) return null; const pc=pcData(kind,o);
  return { t:'Price check', h:`<div class="pcsheet"><button class="pc-thumb" data-act="insp" data-a="${kind}:${id}">${faceSVG(kind,o)}</button><div><div class="title-block"><h1 style="font-size:20px">${esc(pc.title)}</h1><div class="sub">${esc(pc.sub)}</div></div>${pcHTML(pc)}
    <div class="formrow"><button class="btn sm pri" data-act="insp" data-a="${kind}:${id}">Inspect</button><button class="btn sm" data-act="design" data-a="${esc(pc.key)}">Full history</button></div></div></div>` };
}
ACT.pc = (a,el,e)=>{ if (e){ e.stopPropagation(); e.preventDefault(); } const [k,id]=a.split(':'); openSheet(()=>pcSheet(k,+id)); };
function pcChip(kind, id){ return `<span class="pcchip" role="button" tabindex="0" data-act="pc" data-a="${kind}:${id}" aria-label="Price check">$?</span>`; }
// ---------- inspection mode ----------
function inspectOpen(kind, id){
  const o=objFor(kind,id); if (!o) return; closeInspect(); const pc=pcData(kind,o); const fin=finOf(kind,o);
  const el=document.createElement('div'); el.id='insp'; el.className='insp';
  el.innerHTML = `<div class="insp-bar"><button class="btn sm" data-act="inspclose" aria-label="Close">✕</button>${kind==='c'&&o.g===0?`<button class="btn sm" data-act="inspflip">Flip</button>`:''}</div>
    <div class="insp-stage" id="inspstage"><div class="insp-obj ${kind==='m'?'comic':'card'} ${o.g>0?'slab':''}" id="inspobj" data-fin="${fin}"><div class="insp-face" id="inspface">${faceSVG(kind,o)}</div><div class="insp-holo"></div><div class="insp-glare"></div></div></div>
    <div class="insp-info"><div class="insp-h"><b>${esc(pc.title)}</b><span>${esc(pc.sub)}</span></div>
      <dl class="kv">${pc.meta.filter(m=>m[1]).map(m=>`<dt>${m[0]}</dt><dd>${esc(m[1])}</dd>`).join('')}<dt>Condition</dt><dd>${esc(pc.cond)}</dd></dl>
      ${pcHTML(pc)}<div class="formrow"><button class="btn sm" data-act="inspdetail" data-a="${kind}:${id}">Details</button></div></div>`;
  document.body.appendChild(el); document.body.classList.add('noscroll');
  el._front=1; el._kind=kind; el._id=id;
  const stage=el.querySelector('#inspstage'), obj=el.querySelector('#inspobj');
  const move=(ev)=>{ const b=stage.getBoundingClientRect(); const x=clamp((ev.clientX-b.left)/b.width,0,1), y=clamp((ev.clientY-b.top)/b.height,0,1);
    obj.style.transform=`rotateY(${((x-0.5)*24).toFixed(1)}deg) rotateX(${((0.5-y)*18).toFixed(1)}deg) translateZ(20px)`; obj.style.setProperty('--mx',(x*100).toFixed(0)+'%'); obj.style.setProperty('--my',(y*100).toFixed(0)+'%'); obj.style.setProperty('--ang',((x-0.5)*120).toFixed(0)+'deg'); obj.classList.add('lit'); };
  stage.addEventListener('pointermove', move); stage.addEventListener('pointerdown', e=>{ obj.style.transition='transform .08s'; move(e); });
  const rest=()=>{ obj.style.transition='transform .5s cubic-bezier(.2,.8,.2,1)'; obj.style.transform=''; obj.classList.remove('lit'); };
  stage.addEventListener('pointerleave', rest); stage.addEventListener('pointerup', ()=>{ setTimeout(rest, 600); });
  requestAnimationFrame(()=>el.classList.add('in'));
}
function closeInspect(){ const el=$('#insp'); if (el){ el.remove(); document.body.classList.remove('noscroll'); } }
ACT.insp = (a,el,e)=>{ if (e) e.stopPropagation(); const [k,id]=a.split(':'); inspectOpen(k,+id); };
ACT.inspclose = ()=>closeInspect();
ACT.inspflip = ()=>{ const el=$('#insp'); if (!el) return; const o=objFor(el._kind, el._id); const f=$('#inspface'); el._front=!el._front; f.innerHTML = el._front? faceSVG('c',o) : cardBack(o.k,o.s); const ob=$('#inspobj'); ob.classList.add('flipping'); setTimeout(()=>ob.classList.remove('flipping'),350); };
ACT.inspdetail = a=>{ const [k,id]=a.split(':'); closeInspect(); if (k==='c') ACT.card(id); else ACT.ccopy(id); };
document.addEventListener('keydown', e=>{ if (e.key==='Escape' && $('#insp')) closeInspect(); });
// sheets: tap the big collectible to inspect it; raw condition shows on the object
(function(){
  const bc=bigCardHTML; bigCardHTML=function(c, key){ let h=bc(c,key); if (!c) return h; if (c.g===0){ const f=cardFront(c.k,c.s); h=h.replace(f, withCond(f,c)); } return h.replace('<div class="face ','<div data-act="insp" data-a="c:'+c.id+'" title="Tap to inspect" class="face tapins ').replace('<div class="under">','<div class="under"><button class="btn sm" data-act="insp" data-a="c:'+c.id+'">Inspect</button>'); };
  const cs=cmCopySheet; cmCopySheet=function(id){ const r=cs(id); if (!r) return r; const cp=MC(id); if (cp && cp.g===0){ const f=comicCover(cp.k); r.h=r.h.replace(f, withCmCond(f,cp)); } r.h=r.h.replace('<div class="bigcard cm"><div class="face','<div class="bigcard cm"><div data-act="insp" data-a="m:'+id+'" title="Tap to inspect" class="face tapins'); r.h=r.h.replace('</div></div><div class="stack">','</div><div class="under"><button class="btn sm" data-act="insp" data-a="m:'+id+'">Inspect</button></div></div><div class="stack">'); return r; };
})();
// ---------- market rows: sparkline and price check ----------
(function(){ const lr=listingRow; listingRow=function(l){ let h=lr(l); if (l.it!=='c' && l.it!=='m') return h; const o=l.it==='c'?C(l.ref):MC(l.ref); if (!o) return h; const sp=miniSpark(o.k, o.g>0?o.g:0); const i=h.lastIndexOf('</div></button>'); return i<0? h : h.slice(0,i)+(sp?`<span class="spk">${sp}</span>`:'')+pcChip(l.it,o.id)+h.slice(i); }; })();
// hunt rows and dollar boxes get the same one-tap check
(function(){ const hr=hRow; hRow=function(s,e,extra){ let h=hr(s,e,extra); if (e.t==='s') return h; const i=h.lastIndexOf('</div></button>'); return i<0? h : h.slice(0,i)+pcChip(e.t,e.id)+h.slice(i); };
  const bs=boxSheet; boxSheet=function(sid,price){ const r=bs(sid,price); if (!r) return r; r.h=r.h.replace(/<button class="gcell" data-act="hitem" data-a="(\d+):([cm]):(\d+)">/g, (m,s_,t,id)=>m+pcChip(t,id)); return r; }; })();
// ---------- up next: small category chips ----------
const UK={grade:['GCS','#2f6fb3'],market:['Auction','#8e44ad'],comics:['Comics','#c0392b'],cash:['Payday','#2f9e5b'],cards:['Release','#d35400'],hunt:['Event','#16a085']};
(function(){ const ur=upRow; upRow=function(x, skip){ let h=ur(x,skip); const k=UK[x.kind]; if (!k) return h; const lbl = x.kind==='hunt' && /Auction/i.test(x.txt)? ['Auction','#8e44ad'] : x.kind==='hunt' && /collection|Last day/i.test(x.txt)? ['Private','#7f8c8d'] : x.kind==='hunt' && /Show|Con|Expo|Fest|meetup/i.test(x.txt)? ['Show','#16a085'] : k; return h.replace('<b>',`<span class="uchip" style="--uc:${lbl[1]}">${lbl[0]}</span><b>`); }; })();
// ---------- home: the collection, front and centre ----------
function homeFeatured(){
  const cards=myCards(), comics=G.cm?myComics():[]; if (!cards.length && !comics.length) return '';
  const all=cards.map(c=>['c',c,cardValue(c)]).concat(comics.map(c=>['m',c,cmCopyValue(c)]));
  const newest=all.slice().sort((a,b)=>((b[1].a&&b[1].a[0])||0)-((a[1].a&&a[1].a[0])||0) || b[1].id-a[1].id)[0];
  const best=all.slice().sort((a,b)=>b[2]-a[2])[0];
  const mv=UI.recap&&UI.recap.moves.find(m=>m.d>0); const gain = mv? all.find(x=>x[0]+x[1].id===mv.id) : null;
  const rare=cards.filter(c=>D(c.k).run).sort((a,b)=>D(a.k).run-D(b.k).run)[0];
  const tiles=[]; const seen=new Set(); const tile=(lbl,x,sub)=>{ if (!x) return; const k=x[0]+x[1].id; if (seen.has(k)) return; seen.add(k); tiles.push(`<button class="feat" data-act="insp" data-a="${x[0]}:${x[1].id}"><div class="feat-art ${x[0]==='m'?'cm':''}">${faceSVG(x[0],x[1])}</div><small>${lbl}</small><b>${esc(x[0]==='c'?cardName(x[1]):cmD(x[1].k).title)}</b><span>${sub}</span></button>`); };
  tile('Newest', newest, newest? fmtRange(newest[0]==='c'?estRange(newest[1].k,newest[1].g>0?newest[1].g:0,newest[1]):cmEst(newest[1].k,newest[1].g>0?newest[1].g:0,newest[1])) : '');
  tile('Most valuable', best, best? fmtRange(best[0]==='c'?estRange(best[1].k,best[1].g>0?best[1].g:0,best[1]):cmEst(best[1].k,best[1].g>0?best[1].g:0,best[1])) : '');
  if (gain) tile('Biggest gain', gain, '▲ '+Math.round(mv.pct)+'%');
  if (rare) tile('Rarest', ['c',rare,0], 'Numbered '+rare.s+'/'+D(rare.k).run);
  return tiles.length? `<div class="featrow">${tiles.join('')}</div>` : '';
}
(function(){ const hv=VIEWS.home; VIEWS.home=()=>{ const h=hv(); const i=h.indexOf('<div class="cols" style="margin-bottom:14px">'); const f=homeFeatured(); return i<0||!f? h : h.slice(0,i)+f+h.slice(i); }; })();
// ---------- binder view ----------
UI.bpg=0;
function binderView(){
  const cards=myCards().slice().sort((a,b)=>{ const x=D(a.k), y=D(b.k); return y.prod.yr-x.prod.yr || x.prod.id-y.prod.id || x.sec.localeCompare(y.sec) || x.no-y.no; });
  const pages=Math.max(1,Math.ceil(cards.length/9)); const pg=Math.min(UI.bpg,pages-1); const slice=cards.slice(pg*9,pg*9+9);
  const slots=Array.from({length:9},(_,i)=>{ const c=slice[i]; return c? `<button class="sleeve" data-act="card" data-a="${c.id}">${c.g>0?slabSVG(c):cardFront(c.k,c.s)}</button>` : '<div class="sleeve empty"></div>'; }).join('');
  return `${tip('binder', 'Your cards, nine to a page, in the order a collector would file them: newest sets first, then by card number. Tap one to take it out of the sleeve.')}
    <div class="binder"><div class="binder-page">${slots}</div><div class="binder-nav"><button class="btn sm" data-act="bpage" data-a="${pg-1}" ${pg<=0?'disabled':''}>‹ Previous</button><span class="muted small">Page ${pg+1} of ${pages}</span><button class="btn sm" data-act="bpage" data-a="${pg+1}" ${pg>=pages-1?'disabled':''}>Next ›</button></div></div>`;
}
ACT.bpage = a=>{ UI.bpg=Math.max(0,+a); render(true); };
// ---------- the pack reveal: rare pulls take a breath ----------
function markRare(){ const top=document.querySelector('.oc.flip:not(.rare)'); if (!top) return; const cid=+top.dataset.cid; const c=C(cid); if (!c) return; const d=D(c.k); if ((d.run && d.run<=50) || d.auto || d.caseHit || (typeof isMajor==='function' && isMajor(c))) top.classList.add('rare'); }
document.addEventListener('click', ()=>setTimeout(markRare, 30), true);

// ===================== ATTACHMENT: research, follows, chases, grails =====================
// Everything here reads the existing simulation. Nothing spawns collectibles for the player's benefit.

// ---------- variant codes: B B2 B3 | R10 V25 S100 | F | X1500~rt | K600 | A400 | P1500, any with @artist ----------
function pvar(code){ if (!code) return {k:'',x:0,a:-1,rt:-1}; const m=/^([A-Z])(\d*)(?:@(\d+))?(?:~(\d+))?$/.exec(code); if (!m) return {k:code[0],x:+code.slice(1)||0,a:-1,rt:-1}; return {k:m[1], x:+m[2]||0, a:m[3]!=null?+m[3]:-1, rt:m[4]!=null?+m[4]:-1}; }
const RETAILERS=[['Black Cat Comics','Portland'],['Gutter & Grid','Harbor City'],['Panel Vault','Northfall'],['Lucky Seven Comics','Coldwater'],['Cosmic Attic','Juniper Falls'],['Moonlight Longbox','Vesper Bay'],['Rocket Pop Comics','Bellwether'],['Northern Lights Comics','Greyhaven'],['Stray Dog Comics','Ashfall'],['Two Moons Books & Comics','Kessler Point']];
function retailers(){ if (!G.cm.rtl){ const r=mkRng(hsh('rtl'+G.seed)); G.cm.rtl=RETAILERS.map((x,i)=>({id:i, n:x[0], city:x[1], fol:Math.round(400+r()*4000), rep:+(0.3+r()*0.7).toFixed(2)})); } return G.cm.rtl; }
function varName(code){ const v=pvar(code); if (!v.k) return 'Cover A';
  const who = v.a>=0 && CR_(v.a) ? ' by '+CR_(v.a).n : '';
  if (v.k==='B') return 'Cover '+String.fromCharCode(66+(v.x?v.x-1:0))+who;
  if (v.k==='R') return '1:'+v.x+' incentive'+who; if (v.k==='V') return '1:'+v.x+' virgin'+who; if (v.k==='S') return '1:'+v.x+' sketch'+who; if (v.k==='F') return 'Foil cover'+who;
  if (v.k==='X') return (v.rt>=0? retailers()[v.rt].n : 'Retailer')+' exclusive'+who; if (v.k==='C'||v.k==='K') return 'Convention exclusive'+who;
  if (v.k==='A') return 'Artist exclusive'+who; if (v.k==='P') return 'Publisher exclusive'+who; return code; }
VAR_N = varName;
varRun = function(s, n, code){
  const pr=(s.pr[n-1]||0)*100; const all=(s.v[n]||'').split(',').filter(Boolean).map(pvar);
  if (!code){ const open=all.filter(v=>v.k==='B').length, foil=all.some(v=>v.k==='F'); return Math.round(pr*(1-Math.min(0.45,open*0.15)-(foil?0.4:0))); }
  const v=pvar(code); if (v.k==='B') return Math.round(pr*0.15); if (v.k==='F') return Math.round(pr*0.4);
  if (v.k==='R'||v.k==='V'||v.k==='S') return Math.max(20, Math.round(pr/Math.max(1,v.x)));
  return v.x || 500; };
function variantArtist(r, tier){ const pool=G.cm.cr.filter(c=>!c.ret && c.deb && (c.r==='A'||c.r==='C'||c.r==='WA')); let best=null, bw=-1; for (let i=0;i<24 && pool.length;i++){ const c=pool[Math.floor(r()*pool.length)]; if (c.ex && c.ex.until>yearOf(G.cm.now||G.day) && c.ex.pub!==-9) {} const w=Math.pow(c.fame+0.25,1.5)*(0.5+r()); if (w>bw){ bw=w; best=c; } } return best? best.id : -1; }
// the variant program is decided from a fixed seed, so what's solicited is exactly what ships
function variantProgram(s, n, t){
  const r=mkRng(hsh('vp'+s.id+':'+n)); const yr=yearOf(t), tier=tierOf(s); const v=[];
  const big = n===1 || s.keys.some(k=>k[0]===n && ['ann','dth','ret','team'].includes(k[1]));
  if (yr<1990) return '';
  if (yr<2000){ if (big && tier<=2 && r()<0.6) v.push('F'); if (yr>=1997 && n===1 && tier<=1 && r()<0.5) v.push('R10@'+variantArtist(r,tier)); return v.join(','); }
  const E = Math.max(0.3, (s.hy||1)*0.6 + (s.heat||0)*0.5);
  let budget = [1.6,1.1,0.75,0.35,0.18,0.12][tier] * (n===1?3.2: big?2:1) * (0.6+E*0.45) * (yr>=2012?1.25:1);
  const k = Math.min(24, Math.floor(budget + r()*1.2));
  const A=()=> '@'+variantArtist(r,tier);
  const opts = [['B',5],['R',tier<=2?4:0.8],['V',tier<=1?1.5:0.4],['S',tier<=1&&n===1?1:0.1],['F',big?1:0.2],['X',E>1.1||tier<=2?2.2:0.5],['A',0.8],['P',tier<=1?0.8:0.1],['K',G.cm.conWeek?2:0.3]];
  let nb=0, ratios=[10,25,50,100,200].filter(x=>x<=(tier===0?200:tier===1?100:50));
  const wp=()=>{ let tot=0; for (const o of opts) tot+=o[1]; let x=r()*tot; for (const o of opts){ x-=o[1]; if (x<=0) return o[0]; } return 'B'; };
  for (let i=0;i<k;i++){ const ty=wp();
    if (ty==='B'){ if (nb<3){ v.push('B'+(nb?nb+1:'')+A()); nb++; } }
    else if (ty==='R' && ratios.length){ const x=ratios.shift(); v.push('R'+x+A()); if (r()<0.35 && x>=25) v.push('V'+x+A()); }
    else if (ty==='V' && !v.some(c=>c[0]==='V')) v.push('V'+[25,50][Math.floor(r()*2)]+A());
    else if (ty==='S' && !v.some(c=>c[0]==='S')) v.push('S'+[50,100,200][Math.floor(r()*3)]+A());
    else if (ty==='F' && !v.includes('F')) v.push('F');
    else if (ty==='X'){ const rt=Math.floor(r()*RETAILERS.length); v.push('X'+(Math.round((300+r()*2700)/100)*100)+A()+'~'+rt); }
    else if (ty==='A') v.push('A'+(Math.round((200+r()*700)/50)*50)+A());
    else if (ty==='P') v.push('P'+(Math.round((1000+r()*2500)/500)*500)+A());
    else if (ty==='K') v.push('K'+(Math.round((300+r()*900)/100)*100)+A());
  }
  return [...new Set(v)].join(',');
}
function variantPlan(s, n, t){ const c=(G.cm.vpc=G.cm.vpc||{}); const k=s.id+':'+n; if (c[k]==null) c[k]=variantProgram(s,n,t); return c[k]; }
mkVariants = function(s, n, t){ const c=G.cm.vpc; const k=s.id+':'+n; const v = c && c[k]!=null ? c[k] : variantProgram(s,n,t); if (c) delete c[k]; return v; };
function excPrice(code, cp){ const v=pvar(code); return ({X:24.99,A:29.99,P:19.99,K:24.99}[v.k]) || cp; }
function isExclusive(code){ const k=pvar(code).k; return k==='X'||k==='A'||k==='P'||k==='K'; }
// demand for an exclusive, and when (if ever) it sells out
function excDemand(s, code){ const v=pvar(code); const a=v.a>=0?CR_(v.a):null; const rt=v.rt>=0?retailers()[v.rt]:null; return (80 + 900*(s.hy||1) + 600*(s.heat||0) + (a?700*a.fame:0) + (rt?rt.fol*0.15:0)) * (0.7+mkRng(hsh('xd'+s.id+code))()*0.6); }
function excState(s, n, code, announced){ const key=mk(s.id,n,1,code); const st=(G.cm.xs=G.cm.xs||{}); let x=st[key]; if (!x){ const run=pvar(code).x||500; const D=excDemand(s,code); x=st[key]={ann:announced, run, sold: D>run ? announced + Math.max(0.15, 10*run/D) : 0}; } return x; }
// ---------- creator careers ----------
function followersOf(c){ return Math.round(30*Math.exp(1.7*Math.max(0,c.fame))*(1+(c.vh||0)*0.15)); }
function creatorCareerTick(t){ // monthly, live
  const yr=yearOf(t);
  // variant heat: what collectors are paying for this artist's variants lately
  const vh={}; for (const k in G.sales){ if (k[0]!=='M' || k.indexOf('@')<0) continue; const m=/@(\d+)/.exec(k); if (!m) continue; const rec=G.sales[k].filter(x=>x[0]>t-60); if (!rec.length) continue; const d=cmD(k); vh[m[1]]=(vh[m[1]]||0)+rec.reduce((a,x)=>a+Math.max(0,x[1]/Math.max(1,d.cp)-2),0); }
  for (const c of G.cm.cr){ if (!c.deb) continue; const old=c.vh||0; c.vh=+(0.7*old + 0.3*Math.min(20,(vh[c.id]||0)/5)).toFixed(2); if (c.vh>1.5){ c.fame=+(c.fame+0.02*c.vh).toFixed(3); if (old<=1.5) cmNews(`${c.n.toUpperCase()} VARIANTS ARE THE HOTTEST COVERS IN THE HOBBY`, `Retailer exclusives with ${c.n} art are selling out and flipping for multiples of cover.`, {r:c.id}); } }
  if (mdOf(t)[0]===1){ // yearly: history, contracts, comebacks
    for (const c of G.cm.cr){ if (!c.deb) continue; (c.fh=c.fh||[]).push([yr, +c.fame.toFixed(2)]); if (c.fh.length>30) c.fh.shift();
      if (!c.ret && c.fame>1.6 && !(c.ex && c.ex.until>=yr) && R()<0.2){ const majors=G.cm.pubs.filter(p=>p.tier===0 && (!p.x||p.x>yr)); const pb=pick(majors); c.ex={pub:pb.id, until:yr+ri(2,4)}; cmNews(`${c.n.toUpperCase()} SIGNS EXCLUSIVE DEAL WITH ${pb.n.toUpperCase()}`, `The ${ROLE_N[c.r].toLowerCase()} will work only for ${pb.n} through ${c.ex.until}.`, {r:c.id}); }
      if (c.ret && c.fame>1 && R()<0.03){ c.ret=0; c.fame+=0.2; cmNews(`${c.n.toUpperCase()} COMES OUT OF RETIREMENT`, `A new project is rumoured. Collectors are revisiting the back catalogue.`, {r:c.id}); } }
  }
}
// ---------- follows: one system for everything ----------
function fwList(){ return G.player.fw2 || (G.player.fw2=[]); }
function following(t, id){ if (t==='p') return G.player.follow.includes(id); if (t==='s') return (G.player.cfol||[]).includes(id); if (t==='cr') return (G.player.crfol||[]).includes(id); return fwList().some(x=>x.t===t && x.id===id); }
function toggleFollow(t, id){ const was=following(t,id); const arr = t==='p'? G.player.follow : t==='s'? (G.player.cfol=G.player.cfol||[]) : t==='cr'? (G.player.crfol=G.player.crfol||[]) : null;
  if (arr){ const i=arr.indexOf(id); if (i>=0) arr.splice(i,1); else arr.push(id); } else { const L=fwList(); const i=L.findIndex(x=>x.t===t&&x.id===id); if (i>=0) L.splice(i,1); else L.push({t,id}); }
  const fs=G.player.fsince=G.player.fsince||{}; if (!was) fs[t+':'+id]=G.day; else delete fs[t+':'+id]; return !was; }
function allFollows(){ return G.player.follow.map(id=>({t:'p',id})).concat((G.player.cfol||[]).map(id=>({t:'s',id})), (G.player.crfol||[]).map(id=>({t:'cr',id})), fwList()); }
function fwLabel(f){ switch(f.t){ case 'p': return pname(P(f.id)); case 's': return sTitle(S_(f.id)); case 'cr': return CR_(f.id).n; case 'i': return cmD(f.id).title+(cmD(f.id).v?' ('+varName(cmD(f.id).v)+')':''); case 'pub': return G.cm.pubs[f.id].n; case 'set': return prodName(G.products[f.id]); case 'k': { const d=D(f.id); return pname(P(d.pid))+' '+d.prod.yr+' '+B(d.prod).short+' '+d.title; } } return ''; }
ACT.fw = a=>{ const [t,...r]=a.split('~'); const id=(t==='i'||t==='k')? r.join('~') : +r[0]; const on=toggleFollow(t,id); showToast(on?'Following. Developments will show up in your daily snapshot.':'Unfollowed.', on); refreshSheet(); render(true); queueSave(); };
function fwBtn(t,id){ const on=following(t,id); return `<button class="btn sm ${on?'':'pri'}" data-act="fw" data-a="${t}~${esc(String(id))}">${on?'Following':'Follow'}</button>`; }
// ---------- chases ----------
function chases(){ return G.player.chases || (G.player.chases=[]); }
const CH_KIND={rc:'Rookie cards', pc:'Player collection', run:'Series run', vars:'Every cover', art:'Cover collection', set:'Set', grail:'Grail'};
function chaseItems(ch){ // the known universe of things this chase covers, as design keys
  const out=[];
  if (ch.k==='rc'||ch.k==='pc'){ for (const prod of releasedProducts()){ const br=B(prod); const cl=prod.cl; if (!cl) continue;
      cl.base.forEach((e,i)=>{ if (e[0]!==ch.ref) return; if (ch.k==='rc' && !(e[1]&3)) return; out.push(dk(prod,'b',i,'')); for (const pa of br.par) out.push(dk(prod,'b',i,pa.id)); });
      if (cl.auto) cl.auto.forEach((pid,i)=>{ if (pid!==ch.ref) return; if (ch.k==='rc' && !(cl.autoRc[i]&3)) return; out.push(dk(prod,'a',i,'')); for (const pa of (br.auto.par||[])) out.push(dk(prod,'a',i,pa.id)); });
      if (ch.k==='pc'){ (cl.ins||[]).forEach((arr,ii)=>arr.forEach((pid,i)=>{ if (pid===ch.ref) out.push(dk(prod,'i'+ii,i,'')); })); if (cl.relic) cl.relic.forEach((pid,i)=>{ if (pid===ch.ref) out.push(dk(prod,'r',i,'')); }); } } }
  else if (ch.k==='run'){ const s=S_(ch.ref); for (let n=1;n<=s.n;n++) out.push(mk(s.id,n,1,'')); }
  else if (ch.k==='vars'){ const [sid,n]=ch.ref.split(':').map(Number); const s=S_(sid); out.push(mk(sid,n,1,'')); for (const c of (s.v[n]||'').split(',').filter(Boolean)) out.push(mk(sid,n,1,c)); (s.pp[n]||[]).forEach((e,i)=>out.push(mk(sid,n,i+2,''))); }
  else if (ch.k==='art'){ for (const s of G.cm.ser){ if (!s.n) continue; if (s.cv===ch.ref) for (let n=1;n<=Math.min(s.n,60);n++) out.push(mk(s.id,n,1,'')); for (const n in s.v){ for (const c of s.v[n].split(',')) if (c.indexOf('@'+ch.ref)>=0 && pvar(c).a===ch.ref) out.push(mk(s.id,+n,1,c)); } } }
  else if (ch.k==='set'){ const prod=G.products[ch.ref]; prod.cl.base.forEach((e,i)=>out.push(dk(prod,'b',i,''))); }
  else if (ch.k==='grail') out.push(ch.ref);
  return out;
}
function ownedKeys(){ const s=new Set(); for (const c of myCards()) s.add(c.k); if (G.cm) for (const c of myComics()){ s.add(c.k); const d=cmD(c.k); if (!d.tr && d.p===1 && !d.v) s.add(mk(d.sid,d.n,1,'')); } return s; }
function chaseProgress(ch, owned){ const items=chaseItems(ch); owned=owned||ownedKeys(); let have=0; if (ch.k==='run'){ const nums=new Set(myComics().map(c=>cmD(c.k)).filter(d=>d.sid===ch.ref && !d.tr).map(d=>d.n)); have=nums.size; } else have=items.filter(k=>owned.has(k)).length; return {items, have, total:items.length}; }
function chaseName(ch){ switch(ch.k){ case 'rc': return pname(P(ch.ref))+' rookie cards'; case 'pc': return pname(P(ch.ref))+' collection'; case 'run': return sTitle(S_(ch.ref))+' run'; case 'vars': { const [sid,n]=ch.ref.split(':'); return S_(+sid).t+' #'+n+' covers'; } case 'art': return CR_(ch.ref).n+' covers'; case 'set': return prodName(G.products[ch.ref])+' base set'; case 'grail': return keyLabel(ch.ref); } return ''; }
function keyLabel(k){ if (k[0]==='M'){ const d=cmD(k); return d.title+(d.label&&d.label!=='Cover A'?' ('+d.label+')':''); } const d=D(k); return pname(P(d.pid))+' '+d.prod.yr+' '+B(d.prod).short+' '+d.title; }
function startChase(k, ref){ const C_=chases(); if (C_.some(c=>c.k===k && String(c.ref)===String(ref))) return 'You already chase that.'; C_.push({id:(G.player.chid=(G.player.chid||0)+1), k, ref, since:G.day, pin: C_.filter(c=>c.pin).length<6}); return null; }
// where a missing item might be: the market is public; dealers you'd have to call; owners you can approach
function whereIs(key){
  const lst=G.lst.filter(l=>(l.it==='c'?C(l.ref):l.it==='m'?MC(l.ref):null)?.k===key && l.sel!==0);
  const auc=G.hunt? G.hunt.auc.filter(a=>!a.done && a.ann<=G.day).flatMap(a=>a.lots.filter(L_=>{ const o=L_.t==='c'?C(L_.id):MC(L_.id); return o && o.k===key; }).map(L_=>({a,L_}))) : [];
  const shops=G.hunt? G.hunt.sel.filter(s=>s.shop && s.inv.some(e=>{ const o=objOf(e); return o && o.k===key; })) : [];
  const owners=[]; const pool = key[0]==='M'? Object.values(G.mc) : Object.values(G.cards); for (const o of pool){ if (o.k===key && o.o>0 && !o.l) owners.push(o); if (owners.length>6) break; }
  return {lst, auc, shops, owners};
}
// contact an owner: collectors sell things they love only for a real premium
function ownerAsk(o){ const n=NPC(o.o); const it = o.k[0]==='M'? {comic:true, cm:o, key:o.k, v:cmCopyValue(o), heat:1} : {card:o, key:o.k, v:cardValue(o), heat:1}; const love=interest(n,it); return nicePrice(Math.max(it.v*1.15, npcValuation(n,it)*(1.25+love*0.5))); }
function buyFromOwner(kind, id){ const o=kind==='c'?C(id):MC(id); if (!o||o.o<=0) return 'They no longer have it.'; const ask=ownerAsk(o); if (G.player.cash<ask) return 'You need '+money(ask)+'.'; const n=NPC(o.o); G.player.cash-=ask; G.player.bought+=ask; n.cash+=ask; o.o=0; o.a=[G.day,'bought',ask,n.h]; (o.h=o.h||[]).push([G.day,'Bought directly from '+n.h+' after you reached out',ask,'']); o.nw=1; return null; }
// wanted posts: an owner may answer by listing it for you
function wantedTick(){ for (const w of (G.player.wanted||[])){ if (R()>0.08) continue; const pool = w.k[0]==='M'? Object.values(G.mc) : Object.values(G.cards); const o=pool.find(x=>x.k===w.k && x.o>0 && !x.l && x.g>=0); if (!o) continue; const n=NPC(o.o); const it = w.k[0]==='M'? {comic:true, cm:o, key:o.k, v:cmCopyValue(o), heat:1} : {card:o, key:o.k, v:cardValue(o), heat:1}; if (npcValuation(n,it)*1.1 > w.max) continue; createListing(w.k[0]==='M'?'m':'c', o.id, n.id, 'bin', nicePrice(w.max*rf(0.9,1)), 0, true); (G.player.wantHits=G.player.wantHits||[]).push([G.day,w.k,n.h]); w.hit=G.day; } }
// ---------- research: signals, never answers ----------
function scoutGrades(p){ const pit=isPitcher(p); const tools = pit? [['Fastball',0.5,0.5],['Breaking ball',0.4,0.6],['Control',0.6,0.4],['Stamina',0.5,0.5]] : [['Hit',0.6,0.3],['Power',0.2,1],['Speed',0.1,0],['Field',0.5,0.2],['Arm',0.4,0.3]];
  const out=[]; for (const [nm,wa,wx] of tools){ const base = nm==='Power'? 20+p.pw*55 : nm==='Speed'? 20+p.spd*60 : 20+((p.pot-40)/50)*50; const pres = 20+((p.ab-35)/60)*55;
    const g=[0,1].map(sc=>{ const r=mkRng(hsh('sg'+p.id+nm+sc)); const bias=(sc?4:-3)+(r()-0.5)*14; const fut=clamp(Math.round((base*0.75+pres*0.25+bias)/5)*5,20,80); return [clamp(Math.round((pres*0.8+bias*0.5)/5)*5,20,75), fut]; });
    out.push([nm,g[0],g[1]]); }
  return out; }
function scoutNotes(p){ const r=mkRng(hsh('sn'+p.id+yearOf(G.day))); const g=scoutGrades(p); const hi=g.slice().sort((a,b)=>b[1][1]-a[1][1])[0], lo=g.slice().sort((a,b)=>a[2][1]-b[2][1])[0];
  return [`Scout A: "${hi[0]==='Power'?'Real power projection. Balls jump off the bat.':hi[0]==='Speed'?'Game-changing speed.':hi[0]==='Hit'?'Advanced approach for his age.':'Loud tool: '+hi[0].toLowerCase()+'.'}"`, `Scout B: "${lo[0]==='Hit'?'The hit tool worries me. Swing-and-miss against good breaking stuff.':lo[0]==='Control'?'Walks too many. Needs to find the zone.':'Not sold on the '+lo[0].toLowerCase()+'. '+(r()<0.5?'Could limit the ceiling.':'Might be fixable.')}"`]; }
function depthChart(p){ const tm = p.tm>=0? p.tm : p.org; return G.players.filter(q=>q.tm===tm && q.pos===p.pos && q.id!==p.id).sort((a,b)=>(b.cur&&b.cur[0]||0)-(a.cur&&a.cur[0]||0)).slice(0,2); }
function levelOf(p){ return p.tm>=0? 'Majors' : p.ab>=58? 'AAA' : p.ab>=48? 'AA' : p.ab>=40? 'High-A' : 'Low-A'; }
function draftOf(p){ const r=mkRng(hsh('dr'+p.id)); const rd=clamp(Math.round(1+(78-p.pot)/5+(r()-0.5)*6),1,20); return rd<=1? 'First round, pick '+(1+Math.floor(r()*30)) : 'Round '+rd; }
function hobbyBuzz(pid){ let a=0,b=0; for (const k in G.sales){ if (k[0]==='S'||k[0]==='M'||k[0]==='T') continue; if (D(k).pid!==pid) continue; for (const x of G.sales[k]){ if (x[0]>G.day-30) a++; else if (x[0]>G.day-60) b++; } } return [a,b]; }
function rankHist(pid){ return (G.prk&&G.prk[pid])||[]; }
function researchPlayerHTML(p){
  const rank=prospectRank().indexOf(p); const rh=rankHist(p.id); const g=scoutGrades(p); const dc=depthChart(p); const [a,b]=hobbyBuzz(p.id); const lst=G.lst.filter(l=>l.it==='c' && D(C(l.ref).k).pid===p.id).length;
  const trend = p.fm>0.15?'Hot lately':p.fm<-0.15?'Cold lately':'Steady';
  return `<div class="panel"><h3>Scouting file</h3><p class="small muted" style="margin:0 0 8px">Evidence, not answers. Scouts disagree, and reports can be wrong.</p>
    <dl class="kv"><dt>Age</dt><dd>${ageOf(p)}</dd><dt>Level</dt><dd>${levelOf(p)}${p.tm===-1?', '+esc(teamName(p.org))+' system':''}</dd><dt>Signed</dt><dd>${draftOf(p)}</dd>${rank>=0?`<dt>Prospect rank</dt><dd>#${rank+1}${rh.length>1?` (was #${rh[0]} ${Math.round((G.day-(G.prkT||G.day))/7)+rh.length} weeks ago)`:''}</dd>`:''}<dt>Recent form</dt><dd>${trend}${p.inj?', injured':''}</dd></dl>
    <div class="tblwrap"><table class="tbl"><thead><tr><th>Tool</th><th class="r">Scout A now/future</th><th class="r">Scout B now/future</th></tr></thead><tbody>${g.map(x=>`<tr><td>${x[0]}</td><td class="r">${x[1][0]} / ${x[1][1]}</td><td class="r">${x[2][0]} / ${x[2][1]}</td></tr>`).join('')}</tbody></table></div>
    ${scoutNotes(p).map(t=>`<p class="small" style="margin:6px 0 0">${esc(t)}</p>`).join('')}
    <dl class="kv" style="margin-top:8px"><dt>In his way</dt><dd>${dc.length? dc.map(q=>esc(pname(q))+' ('+ageOf(q)+')').join(', ') : 'Nobody obvious at his position'}</dd><dt>Hobby activity</dt><dd>${a} card sales in 30 days${b?`, ${a>b*1.2?'up':a<b*0.8?'down':'flat'} from ${b}`:''}</dd><dt>Cards listed</dt><dd>${lst}</dd></dl>
    <div class="formrow">${chaseBtns([['rc',p.id,'Chase his rookie cards'],['pc',p.id,'Start a player collection']])}</div></div>`;
}
function chaseBtns(list){ return list.map(([k,ref,lbl])=>{ const on=chases().some(c=>c.k===k&&String(c.ref)===String(ref)); return `<button class="btn sm" data-act="chstart" data-a="${k}|${esc(String(ref))}" ${on?'disabled':''}>${on?'Chasing':lbl}</button>`; }).join(''); }
// comics: what a collector can learn before release
function creatorLine(c, role){ if (!c) return ''; const best=c.works.map(S_).filter(s=>s.n && s.st<G.day).sort((a,b)=>(b.bo?1e6:0)+b.pk-((a.bo?1e6:0)+a.pk))[0]; const cult=c.works.map(S_).find(s=>s.fan>1 && s.pk<mkt(yearOf(s.st))*0.12);
  const mom = c.mom>0.1?'rising': c.mom<-0.1?'cooling':'steady'; const aw=c.aw.filter(a=>a[2]==='W').length;
  return `<div class="row" data-act="ccreator" data-a="${c.id}"><div class="rt"><b>${esc(c.n)}</b><span>${role}: ${c.works.length<=1?'debut work':followersOf(c).toLocaleString()+' collectors follow them, '+mom}${aw?', '+aw+' award'+(aw>1?'s':''):''}</span>${best&&best.id!==undefined?`<span>${cult?'Earlier series '+esc(cult.t)+' built a cult following':'Known for '+esc(best.t)+(best.bo?' (a breakout)':'')}</span>`:''}</div></div>`; }
function buzzOf(s){ const r=mkRng(hsh('bz'+s.id)); return clamp(0.35*(s.hy||1) + 0.9*(s.q-0.5) + (r()-0.5)*0.9 + (G.cm.tr[s.g]-1)*0.6, -1, 2); }
function researchComicHTML(s, n, d){
  const W_=CR_(s.w), A_=CR_(s.a), CV=s.cv>=0&&s.cv!==s.a?CR_(s.cv):null; const tier=tierOf(s); const bz=buzzOf(s); const tr=G.cm.tr[s.g];
  const prog=(n===s.n+1? variantPlan(s,n,d) : (s.v[n]||'')).split(',').filter(Boolean);
  const ordersTxt = n===1? (bz>0.8?'Well above expectations': bz>0.35?'Above expectations': bz>-0.1?'In line with expectations':'Soft') : (()=>{ const a=s.pr[s.n-1], b=s.pr[Math.max(0,s.n-4)]; return a>b*1.12?'Climbing issue to issue': a<b*0.88?'Slipping':'Stable'; })();
  const chatter = n===1? (bz>0.9?'Loud. Retailers are talking about it.': bz>0.4?'Positive early word.': bz>0?'Some interest.':'Quiet.') : (s.so>=s.n-2?'The last issues sold out.': s.crit>=0.8?'Critics are behind it.':'The usual.');
  const runTxt = ['Very large','Large','Moderate','Small','Very small','Tiny'][tier];
  const ex = prog.filter(isExclusive);
  return `<div class="panel"><h3>Research</h3><p class="small muted" style="margin:0 0 8px">Signals, not a forecast. Hyped books flop and ignored books explode.</p>
    <div class="rows">${creatorLine(W_,'Writer')}${A_!==W_?creatorLine(A_,'Artist'):''}${CV?creatorLine(CV,'Cover'):''}</div>
    <dl class="kv"><dt>Publisher</dt><dd>${esc(pubName(s))} (${esc(TIER_N[tier].toLowerCase())})</dd><dt>Genre</dt><dd>${esc(CG[s.g].n)}${tr>1.15?', a hot genre right now':tr<0.85?', a cooling genre':''}</dd><dt>Retailer orders</dt><dd>${ordersTxt}</dd><dt>Advance chatter</dt><dd>${chatter}</dd><dt>Print run</dt><dd>${runTxt} expected</dd><dt>Covers</dt><dd>${1+prog.length}${ex.length?`, including ${ex.length} exclusive${ex.length>1?'s':''}`:''}</dd>${s.ad.some(id=>!G.cm.ad[id].end)?'<dt>Screen</dt><dd>Adaptation in development</dd>':''}</dl>
    ${prog.length?`<div class="rows" style="margin-top:6px">${prog.map(c=>excRow(s,n,c,d)).join('')}</div>`:''}</div>`;
}
function excRow(s, n, code, d){ const v=pvar(code); const exc=isExclusive(code); const key=mk(s.id,n,1,code);
  if (!exc) return `<div class="row" style="cursor:default"><div class="rt"><b>${esc(varName(code))}</b><span>${v.k==='R'||v.k==='V'||v.k==='S'?'Incentive: shops get one per '+v.x+' ordered':'Open order'}</span></div></div>`;
  const st=excState(s,n,code, d-ri(20,40)); const sold = st.sold && G.day>=st.sold; const price=excPrice(code, coverPrice(yearOf(d),tierOf(s),s.fmt)/100);
  const mine=(G.cm.pre||[]).filter(p=>p.sid===s.id&&p.n===n&&p.v===code).length;
  return `<div class="row" style="cursor:default"><div class="rt"><b>${esc(varName(code))}</b><span>Print run ${st.run.toLocaleString()} · ${money(price,true)}${v.k==='K'?' · at the next convention':''}</span><span class="${sold?'down':''}">${sold? 'Sold out'+(st.sold-st.ann<2?' in '+Math.max(1,Math.round((st.sold-st.ann)*24))+' hours':''):'Available to preorder'}${mine?' · you have '+mine:''}</span></div>${!sold && d>G.day+2?`<div style="display:flex;gap:4px"><button class="btn sm" data-act="xpre" data-a="${s.id}:${n}:${code}:1">+1</button><button class="btn sm" data-act="xpre" data-a="${s.id}:${n}:${code}:5">+5</button></div>`:''}</div>`; }
ACT.xpre = a=>{ const [sid,n,code,q]=a.split(':'); const s=S_(+sid); const d = s.sts==='ann'? s.st : s.nx; const st=excState(s,+n,code,d-30); if (st.sold && G.day>=st.sold){ showToast('Sold out.'); return; } const have=G.cm.pre.filter(p=>p.sid===+sid&&p.n===+n&&p.v===code).length; const k=Math.min(+q, 10-have); if (k<=0){ showToast('The retailer caps orders at ten.'); return; } for (let i=0;i<k;i++) G.cm.pre.push({sid:+sid, n:+n, v:code, d, t:G.day, x:1}); showToast(k+' preordered at '+money(excPrice(code,1),true)+' each. You pay when it ships.', true); refreshSheet(); queueSave(); };
function cresearchSheet(sid, n){ const s=S_(sid); const d = s.sts==='ann'? s.st : s.nx; return { t:sTitle(s)+' #'+n, h:`<div class="stack"><div class="title-block"><div class="yr">${esc(pubName(s))} · ships ${fmtDate(d,true)}</div><h1>${esc(sTitle(s))} #${n}</h1><div class="sub">${esc(s.prem.charAt(0).toUpperCase()+s.prem.slice(1))}</div></div>
  <div class="formrow">${fwBtn('s',s.id)}<button class="btn sm" data-act="cpre" data-a="${s.id}:${n}" ${d>G.day+6?'':'disabled'}>Preorder Cover A</button><button class="btn sm" data-act="pull" data-a="${s.id}">${(G.player.pull||[]).includes(s.id)?'On your pull list':'Add to pull list'}</button></div>
  ${researchComicHTML(s,n,d)}</div>` }; }
ACT.cresearch = a=>{ const [sid,n]=a.split(':').map(Number); openSheet(()=>cresearchSheet(sid,n)); };
ACT.pull = a=>{ const L=G.player.pull=G.player.pull||[]; const id=+a; const i=L.indexOf(id); if (i>=0) L.splice(i,1); else L.push(id); showToast(i>=0?'Removed from your pull list.':'On your pull list: each new issue is preordered for you.', i<0); refreshSheet(); render(true); queueSave(); };
// preorders now carry their own price (exclusives cost more than cover)
fulfilPreorders = function(t){
  const keep=[]; const got={};
  for (const p of G.cm.pre){ const s=S_(p.sid);
    if (s.n>=p.n){ const key=mk(p.sid,p.n,1,p.v||''); const d=cmD(key); const price = p.x? excPrice(p.v, d.cp) : d.cp;
      if (G.player.cash>=price){ G.player.cash-=price; G.player.bought+=price; const cp=cmMakeCopy(key,0,[t,'preorder',price,p.x?varName(p.v):SHOP_NAME],'pre'); cp.h=[[t,'Preordered'+(p.x?' ('+varName(p.v)+')':' at '+SHOP_NAME),price,'']]; cp.nw=1; got[key]=(got[key]||0)+1; }
      else toast('Preorder for '+d.title+' released: not enough cash on hand.');
    } else if (s.sts==='cx' || s.sts==='end') toast('Preorder cancelled: '+sTitle(s)+' #'+p.n+' won\'t be published.');
    else keep.push(p); }
  for (const k in got) toast('Preorder in: '+cmD(k).title+(cmD(k).v?' '+varName(cmD(k).v):'')+(got[k]>1?' ×'+got[k]:''), true);
  G.cm.pre=keep;
};
// ---------- provenance: every object remembers the moment you got it ----------
function stampProvenance(){
  const t=G.day;
  let PR=null; for (const c of myCards()){ if (c.pv) continue; const d=D(c.k), p=P(d.pid); PR=PR||prospectRank(); const rk=PR.indexOf(p);
    c.pv={d:t, v:Math.round((estRange(c.k,c.g>0?c.g:0,c).lo+estRange(c.k,c.g>0?c.g:0,c).hi)/2*100)/100, n: rk>=0? `${pname(p)} was #${rk+1} on the prospect list.` : p.cur&&p.cur[0]? `${pname(p)} was hitting ${lineStr(p,p.cur)} that season.`.replace('hitting ','') : ''}; }
  if (!G.cm) return; const sameDay={};
  for (const c of myComics()){ if (c.pv) continue; const d=cmD(c.k), s=d.s; const v=pvar(d.v||''); const art = v.a>=0? CR_(v.a) : CR_(s.cv>=0?s.cv:s.a);
    sameDay[c.k+':'+t]=(sameDay[c.k+':'+t]||0)+1;
    const r=cmEst(c.k,c.g>0?c.g:0,c);
    c.pv={d:t, v:Math.round((r.lo+r.hi)/2*100)/100, n:`${art?'Cover by '+art.n+', followed by about '+followersOf(art).toLocaleString()+' collectors at the time. ':''}${s.bo?'':s.n<=d.n+2&&s.sts==='on'?'The series was '+s.n+' issue'+(s.n>1?'s':'')+' old. ':''}`}; }
  for (const c of myComics()){ const q=sameDay[c.k+':'+t]; if (q>1 && c.pv.d===t && !c.pv.q) c.pv.q=q; }
}
function storyPanel(o, kind){
  const pv=o.pv; if (!pv) return ''; const est = kind==='c'? estRange(o.k,o.g>0?o.g:0,o) : cmEst(o.k,o.g>0?o.g:0,o); const now=(est.lo+est.hi)/2; const paid=o.a&&o.a[2];
  const ms=[]; if (kind==='m'){ const s=cmD(o.k).s; for (const x of s.notes) if (x[0]>pv.d) ms.push([x[0],x[1]]); }
  else { const pid=D(o.k).pid; for (const n of G.news) if (n.p===pid && n.t>pv.d) ms.push([n.t, tcase(n.h)]); }
  const pct = pv.v>0? Math.round((now-pv.v)/pv.v*100) : 0;
  return `<div class="panel"><h3>Its story</h3><dl class="kv"><dt>Acquired</dt><dd>${fmtDate(pv.d,true)}${paid?', '+money(paid,true):''}${pv.q?' (one of '+pv.q+' copies you bought that day)':''}</dd><dt>Worth then</dt><dd>about ${money(pv.v,true)}</dd><dt>Worth now</dt><dd>about ${money(now,true)} <span class="${pct>=0?'up':'down'}">${pct>=0?'+':''}${pct}%</span></dd></dl>${pv.n?`<p class="small" style="margin:6px 0 0">${esc(pv.n)}</p>`:''}${ms.length?`<p class="small muted" style="margin:8px 0 2px">Since then</p>${ms.slice(-5).map(m=>`<p class="small" style="margin:0 0 4px"><span class="muted">${monYr(m[0])}.</span> ${esc(m[1])}</p>`).join('')}`:''}</div>`;
}
// ---------- the daily hook ----------
(function(){ const ad=advanceDay; advanceDay=function(){ ad.apply(this, arguments); try { attachDay(G.day); } catch(e){ console.error(e); } }; })();
function attachDay(t){
  if (!G.player || !G.player.start) return;
  stampProvenance();
  if (G.player.wanted && G.player.wanted.length) wantedTick();
  if (dowOf(t)===1){ const pr=prospectRank(); G.prk=G.prk||{}; pr.forEach((p,i)=>{ const h=G.prk[p.id]=G.prk[p.id]||[]; h.push(i+1); if (h.length>12) h.shift(); }); for (const id in G.prk) if (!pr.some(p=>p.id===+id)){ G.prk[id].push(101); if (G.prk[id].length>12) G.prk[id].shift(); if (G.prk[id].every(x=>x>100)) delete G.prk[id]; } }
  if (G.cm && !G.cm.hist){
    if (mdOf(t)[1]===1) creatorCareerTick(t);
    if (dowOf(t)===3) for (const sid of (G.player.pull||[])){ const s=S_(sid); if (!s || s.sts==='end'||s.sts==='cx') continue; const n=s.n+1; const d=s.sts==='ann'?s.st:s.nx; if (d>t+6 && !G.cm.pre.some(p=>p.sid===sid&&p.n===n&&!p.v)) G.cm.pre.push({sid, n, v:'', d, t}); }
    // exclusives selling out make news
    for (const x of solicitations()){ const prog=variantPlan(x.s, x.n, x.d).split(',').filter(isExclusive); for (const c of prog){ const st=excState(x.s,x.n,c,x.d-30); if (st.sold && t>=st.sold && !st.nw){ st.nw=1; const v_=pvar(c); const a_=v_.a>=0?CR_(v_.a):null; if (st.sold-st.ann<2 && (st.run>=1200 || (a_&&a_.fame>1.6) || x.n===1) && G.cm.xnd!==t && (G.cm.xnd=t)) cmNews(`${x.s.t.toUpperCase()} #${x.n} ${varName(c).toUpperCase()} SELLS OUT`, `Gone in about ${Math.max(1,Math.round((st.sold-st.ann)*24))} hours. Flippers are already listing preorders.`, {s:x.s.id}); } } }
  }
}
// ---------- the snapshot's first section: your world ----------
function followSnap(){ const pr=prospectRank(); const snap={pr:{}, pl:{}, cr:{}, se:{}, key:{}, lst:new Set(G.lst.map(l=>l.id)), ch:{}};
  for (const f of allFollows()){ if (f.t==='p'){ const p=P(f.id); snap.pl[f.id]={cur:p.cur?p.cur.slice():null, rk:pr.indexOf(p), b:playerBase(p)}; } else if (f.t==='cr'){ snap.cr[f.id]=CR_(f.id).fame; } else if (f.t==='s'){ const s=S_(f.id); snap.se[f.id]={n:s.n, spec:s.spec}; } else if (f.t==='i'||f.t==='k'){ snap.key[f.id] = f.t==='i'? cmFair(f.id,0) : fairValue(f.id,0); } }
  return snap; }
function yourWorld(t0, snap){
  if (!snap) return []; const out=[]; const pr=prospectRank(); const recent=G.news.filter(n=>n.t>t0);
  for (const f of allFollows()){
    if (f.t==='p'){ const p=P(f.id), o=snap.pl[f.id]; if (!o) continue; const L=[]; if (p.cur && o.cur){ const diff=p.cur.map((x,i)=>x-(o.cur[i]||0)); if (diff[0]>0) L.push(lineStr(p,diff)+' over the stretch'); } const rk=pr.indexOf(p); if (rk>=0 && o.rk>=0 && rk!==o.rk) L.push(`prospect rank #${o.rk+1} → #${rk+1}`); if (rk>=0 && o.rk<0) L.push('entered the top 100 at #'+(rk+1)); const b=playerBase(p); if (o.b>0 && Math.abs(b-o.b)/o.b>0.08) L.push(`card index ${b>o.b?'+':''}${Math.round((b-o.b)/o.b*100)}%`); const sale=G.feed.filter(x=>x[0]>t0 && x[1][0]!=='M' && x[1][0]!=='S' && x[1][0]!=='T' && D(x[1]).pid===p.id).sort((a,b)=>b[2]-a[2])[0]; if (sale) L.push(`sold: ${D(sale[1]).prod.yr} ${B(D(sale[1]).prod).short} ${D(sale[1]).title} for ${money(sale[2],true)}`); for (const n of recent.filter(n=>n.p===p.id).slice(0,1)) L.push(tcase(n.h)); if (L.length) out.push({act:'player',a:p.id,h:pname(p),L}); }
    if (f.t==='cr' && G.cm){ const c=CR_(f.id); const L=[]; const o=snap.cr[f.id]; if (o!=null && Math.abs(c.fame-o)>0.03) L.push(`about ${followersOf(c).toLocaleString()} collectors follow them now (${c.fame>o?'up':'down'})`); const newW=G.cm.ser.filter(s=>s.sts==='ann' && s.an>t0 && (s.w===c.id||s.a===c.id||s.cv===c.id)); for (const s of newW.slice(0,2)) L.push(`announced: ${s.t} (${pubName(s)})`); const vs=solicitations().filter(x=>variantPlan(x.s,x.n,x.d).split(',').some(v=>pvar(v).a===c.id)).slice(0,2); for (const x of vs) L.push(`variant cover coming for ${x.s.t} #${x.n}`); for (const n of recent.filter(n=>n.cr===c.id).slice(0,1)) L.push(tcase(n.h)); if (L.length) out.push({act:'ccreator',a:c.id,h:c.n,L}); }
    if (f.t==='s' && G.cm){ const s=S_(f.id), o=snap.se[f.id]; const L=[]; if (o && s.n>o.n) L.push(`#${s.n} is out${s.so===s.n?', and it sold out':''}`); for (const n of recent.filter(n=>n.cs===s.id).slice(0,2)) L.push(tcase(n.h)); if (L.length) out.push({act:'cseries',a:s.id,h:sTitle(s),L}); }
    if ((f.t==='i'||f.t==='k') && snap.key[f.id]!=null){ const now = f.t==='i'? cmFair(f.id,0) : fairValue(f.id,0); const o=snap.key[f.id]; if (o>0 && Math.abs(now-o)/o>0.08) out.push({act:'design',a:f.id,h:fwLabel(f),L:[`estimated value ${now>o?'up':'down'} ${Math.round(Math.abs(now-o)/o*100)}%`]}); }
  }
  // chases: new sightings, and grails above all
  const owned=ownedKeys();
  for (const ch of chases()){ const {items}=chaseProgress(ch, owned); const miss=new Set(items.filter(k=>!owned.has(k)));
    const fresh=G.lst.filter(l=>!snap.lst.has(l.id) && l.sel!==0 && (l.it==='c'||l.it==='m') && miss.has((l.it==='c'?C(l.ref):MC(l.ref)).k));
    if (fresh.length){ const g=ch.k==='grail'; out.unshift({grail:g, act:'listing', a:fresh[0].id, h: g? 'GRAIL SIGHTING' : chaseName(ch), L:[ g? `${keyLabel(ch.ref)}: you have tracked it for ${Math.max(1,Math.round((G.day-ch.since)/30))} month${Math.round((G.day-ch.since)/30)===1?'':'s'}. It just appeared on the market${fresh[0].ty==='auc'?', auction ends '+fmtDate(fresh[0].en):''}.` : `${fresh.length} missing piece${fresh.length>1?'s':''} just appeared on the market: ${keyLabel((fresh[0].it==='c'?C(fresh[0].ref):MC(fresh[0].ref)).k)}` ]}); }
    if (ch.k==='grail' && G.hunt){ const hit=G.hunt.auc.filter(a=>!a.done && a.ann>t0 && a.ann<=G.day).find(a=>a.lots.some(L_=>{ const o=L_.t==='c'?C(L_.id):MC(L_.id); return o && o.k===ch.ref; })); if (hit) out.unshift({grail:1, act:'goto', a:'hunt:auction', h:'GRAIL SIGHTING', L:[`${keyLabel(ch.ref)} is in the ${hit.n}, closing ${fmtDate(hit.d)}.`]}); } }
  for (const w of (G.player.wantHits||[]).filter(x=>x[0]>t0)) out.push({act:'goto', a:'market:browse', h:'Your wanted post', L:[`${w[2]} listed ${keyLabel(w[1])} for you.`]});
  // pull list announcements
  for (const sid of (G.player.pull||[])){ const x=solicitations().find(y=>y.s.id===sid); if (x){ const prog=variantPlan(x.s,x.n,x.d).split(',').filter(Boolean); if (prog.length && x.d-G.day<=63 && x.d-t0>63) out.push({act:'cresearch', a:sid+':'+x.n, h:sTitle(x.s)+' (pull list)', L:[`#${x.n} solicited with ${prog.length+1} covers${prog.some(isExclusive)?', including exclusives':''}`]}); } }
  return out.slice(0,14);
}
function worldHTML(r){ const W=r.world||[]; const sug=suggestions().slice(0,3);
  if (!W.length && !sug.length) return '';
  return `<div class="panel yw"><h3>Your world</h3>${W.map(x=>`<button class="row ${x.grail?'grail':''}" data-act="${x.act}" data-a="${esc(String(x.a))}"><div class="rt"><b>${esc(x.h)}</b>${x.L.map(l=>`<span class="ywl">${esc(l)}</span>`).join('')}</div></button>`).join('')||'<div class="small muted">Nothing new on the things you follow.</div>'}
    ${sug.length?`<p class="small muted" style="margin:10px 0 4px">Noticed in your collection</p>${sug.map(sugRow).join('')}`:''}</div>`; }
// ---------- collection intelligence ----------
function suggestions(){
  const out=[]; const C_=chases(); const has=(k,ref)=>C_.some(c=>c.k===k&&String(c.ref)===String(ref)); const dis=G.player.sugOff||{};
  const byP={}; for (const c of myCards()){ const pid=D(c.k).pid; byP[pid]=(byP[pid]||0)+1; }
  for (const pid in byP) if (byP[pid]>=5 && !has('pc',+pid) && !has('rc',+pid) && !dis['pc'+pid]) out.push({k:'pc', ref:+pid, txt:`You've acquired ${byP[pid]} ${pname(P(+pid))} cards. Start a ${pname(P(+pid))} collection?`});
  if (G.cm){ const byS={}, byA={}; for (const c of myComics()){ const d=cmD(c.k); if (d.tr) continue; (byS[d.sid]=byS[d.sid]||new Set()).add(d.n); const a=pvar(d.v||'').a>=0? pvar(d.v).a : d.s.cv; if (a>=0) byA[a]=(byA[a]||0)+1; }
    for (const sid in byS){ const s=S_(+sid); const set=byS[sid]; if (set.size>=3 && set.has(s.n) && set.has(s.n-1) && s.sts==='on' && !(G.player.pull||[]).includes(+sid) && !dis['pull'+sid]) out.push({k:'pull', ref:+sid, txt:`You've bought ${set.size} issues of ${s.t}, including the latest. Add it to your pull list?`}); else if (set.size>=5 && !has('run',+sid) && !dis['run'+sid]) out.push({k:'run', ref:+sid, txt:`You own ${set.size} of ${s.n} issues of ${s.t}. Track the run?`}); }
    for (const a in byA) if (byA[a]>=5 && !has('art',+a) && !dis['art'+a]) out.push({k:'art', ref:+a, txt:`You own ${byA[a]} covers by ${CR_(+a).n}. Start a cover collection?`}); }
  return out;
}
function sugRow(x){ return `<div class="row" style="cursor:default"><div class="rt"><span style="white-space:normal;color:var(--ink)">${esc(x.txt)}</span></div><div style="display:flex;gap:4px"><button class="btn sm pri" data-act="sugyes" data-a="${x.k}|${x.ref}">Yes</button><button class="btn sm" data-act="sugno" data-a="${x.k}|${x.ref}">No</button></div></div>`; }
ACT.sugyes = a=>{ const [k,ref]=a.split('|'); if (k==='pull') ACT.pull(ref); else { const e=startChase(k,+ref); showToast(e||'Now chasing: '+chaseName({k,ref:+ref}), !e); } refreshSheet(); render(true); queueSave(); };
ACT.sugno = a=>{ const [k,ref]=a.split('|'); (G.player.sugOff=G.player.sugOff||{})[k+ref]=1; refreshSheet(); render(true); queueSave(); };
ACT.chstart = a=>{ const [k,...r]=a.split('|'); const ref = k==='grail'||k==='vars'? r.join('|') : +r[0]; const e=startChase(k,ref); showToast(e||'Now chasing: '+chaseName({k,ref})+'. Find it under Collection, Chases.', !e); refreshSheet(); render(true); queueSave(); };

// convention exclusives are sold at the convention itself
startEvent = (function(f){ return function(ev){ const was=ev.st; f(ev); if (was || !G.cm || EV_T[ev.ty].kind!=='comic') return; const s=newSeller('pro',{n:'Convention exclusives booth', who:'Show staff', know:{card:0,vcard:0,comic:1,ocomic:1,sealed:0}, prof:{}, temp:1, ev:ev.id}); s.mg=1; s.minF=1;
  for (const x of G.cm.ser){ if (!x.n) continue; for (const n in x.v){ if (issueDay(x,+n) < ev.d-90) continue; for (const code of x.v[n].split(',')){ if (pvar(code).k!=='K') continue; const k=Math.min(8, Math.ceil((pvar(code).x||400)/80)); for (let i=0;i<k;i++){ const cp=cmMakeCopy(mk(x.id,+n,1,code), HSID(s.id), null, 'pre'); addEntry(s,{t:'m',id:cp.id}, excPrice(code,1)); } } } }
  if (!s.inv.length) s.gone=1; else (ev.tb=ev.tb||[]).push(s.id); }; })(startEvent);

function resetCaches(){ try { DCACHE.clear(); fvClear(); } catch(e){}
  for (const c of [typeof SVGC!=='undefined'&&SVGC, typeof VCC!=='undefined'&&VCC, typeof CD!=='undefined'&&CD, typeof CDAY!=='undefined'&&CDAY, typeof CFV!=='undefined'&&CFV, typeof CVC!=='undefined'&&CVC, typeof LSCACHE!=='undefined'&&LSCACHE]) if (c && c.clear) c.clear();
  if (typeof UI!=='undefined'){ UI.recap=null; UI.fsnap=null; } }

// ===================== ATTACHMENT: UI =====================
function chaseRow(ch, owned){ const pg=chaseProgress(ch, owned); const pct=pg.total?Math.round(pg.have/pg.total*100):0;
  return `<button class="row" data-act="chase" data-a="${ch.id}"><div class="rt"><b>${ch.k==='grail'?'★ ':''}${esc(chaseName(ch))}</b><span>${CH_KIND[ch.k]} · ${ch.k==='grail'? (pg.have?'Found':'Tracking for '+Math.max(1,Math.round((G.day-ch.since)/30))+' mo') : pg.have+' of '+pg.total+' known'}</span>${ch.k!=='grail'?`<div class="bar" style="margin-top:4px;max-width:240px"><i style="width:${pct}%"></i></div>`:''}</div>${ch.k!=='grail'?`<div class="rv"><b>${pct}%</b></div>`:''}</button>`; }
function chasesView(){
  const owned=ownedKeys(); const C_=chases(); const gr=C_.filter(c=>c.k==='grail'), rest=C_.filter(c=>c.k!=='grail'); const sug=suggestions(); const F=allFollows(); const W=G.player.wanted||[];
  return `${tip('chases', `Chases are collections you decide to pursue: a player's rookie cards, a series run, every cover of an issue, an artist's covers, or a single grail. Nothing appears because you want it. You hunt the real market, dealers, auctions and the people who own them.`)}
  <div class="cols"><div class="stack">
    ${gr.length?`<div class="panel"><h3>Grails</h3><div class="rows">${gr.map(c=>chaseRow(c,owned)).join('')}</div></div>`:''}
    <div class="panel"><h3>Chases</h3><div class="rows">${rest.map(c=>chaseRow(c,owned)).join('')||'<div class="empty">Start one from a player, series, issue, creator or set page.</div>'}</div></div>
    ${sug.length?`<div class="panel"><h3>Noticed in your collection</h3><div class="rows">${sug.slice(0,5).map(sugRow).join('')}</div></div>`:''}
  </div><div class="stack">
    <div class="panel"><h3>Following</h3><div class="rows">${F.map(f=>`<button class="row" data-act="${{p:'player',s:'cseries',cr:'ccreator',i:'design',k:'design',set:'product',pub:'sub'}[f.t]}" data-a="${esc(String(f.t==='pub'?'comics:series':f.id))}"><div class="rt"><b>${esc(fwLabel(f))}</b><span>${{p:'Player',s:'Series',cr:'Creator',i:'Comic issue',k:'Card',set:'Set',pub:'Publisher'}[f.t]}${G.player.fsince&&G.player.fsince[f.t+':'+f.id]?' · since '+fmtDate(G.player.fsince[f.t+':'+f.id]):''}</span></div></button>`).join('')||'<div class="empty">Follow players, series, creators, issues, cards and sets. What happens to them leads your daily snapshot.</div>'}</div></div>
    ${(G.player.pull||[]).length?`<div class="panel"><h3>Pull list</h3><div class="rows">${G.player.pull.map(S_).map(s=>seriesRow(s)).join('')}</div></div>`:''}
    ${W.length?`<div class="panel"><h3>Wanted posts</h3><div class="rows">${W.map((w,i)=>`<div class="row" style="cursor:default"><div class="rt"><b>${esc(keyLabel(w.k))}</b><span>Up to ${money(w.max)}${w.hit?' · answered '+fmtDate(w.hit):''}</span></div><button class="btn sm" data-act="wantdel" data-a="${i}">Remove</button></div>`).join('')}</div></div>`:''}
  </div></div>`;
}
function chaseSheet(id){
  const ch=chases().find(c=>c.id===id); if (!ch) return null; const owned=ownedKeys(); const pg=chaseProgress(ch,owned);
  const per=24, page=UI.chpg||0; const items=pg.items; const miss=items.filter(k=>!owned.has(k));
  const shown=(UI.chf==='miss'?miss:items).slice(page*per,page*per+per);
  const art=k=> k[0]==='M'? `<div class="thumb cmthumb">${comicCover(k)}</div>` : `<div class="thumb">${cardFront(k, D(k).run?1:0)}</div>`;
  return { t:chaseName(ch), h:`<div class="stack"><div class="title-block"><div class="yr">${CH_KIND[ch.k]} · since ${fmtDate(ch.since,true)}</div><h1>${esc(chaseName(ch))}</h1><div class="sub">${pg.have} of ${pg.total} known ${ch.k==='run'?'issues':'pieces'}</div></div>
    <div class="formrow"><button class="btn sm" data-act="chpin" data-a="${ch.id}">${ch.pin?'Pinned to snapshot':'Pin to snapshot'}</button><button class="btn sm" data-act="chdel" data-a="${ch.id}">Stop chasing</button></div>
    <div class="chips"><button class="chip ${UI.chf!=='miss'?'on':''}" data-act="chf" data-a="all">Everything</button><button class="chip ${UI.chf==='miss'?'on':''}" data-act="chf" data-a="miss">Missing (${miss.length})</button></div>
    <div class="grid">${shown.map(k=>{ const have=owned.has(k)|| (ch.k==='run' && myComics().some(c=>{ const d=cmD(c.k); return d.sid===cmD(k).sid && d.n===cmD(k).n; })); return `<button class="gcell ${have?'':'missing'}" data-act="chitem" data-a="${esc(k)}">${art(k)}<div class="cap"><b>${esc(keyLabel(k)).slice(0,60)}</b><span>${have?'✓ Owned':'Missing'}</span></div></button>`; }).join('')}</div>${pager((UI.chf==='miss'?miss:items).length,per,page,'chpage')}</div>` };
}
function chaseItemSheet(key){
  const w=whereIs(key); const owned=ownedKeys().has(key); const val = key[0]==='M'? cmFair(key,0) : fairValue(key,0);
  const art = key[0]==='M'? `<div class="bigcard cm"><div class="face">${comicCover(key)}</div></div>` : `<div class="bigcard"><div class="face">${cardFront(key, D(key).run?1:0)}</div></div>`;
  const W=(G.player.wanted||[]).find(x=>x.k===key);
  return { t:keyLabel(key), h:`<div class="stack"><div class="detail">${art}<div class="stack"><div class="title-block"><h1 style="font-size:20px">${esc(keyLabel(key))}</h1><div class="sub">${owned?'In your collection':'Missing'}</div></div>
    <dl class="kv"><dt>Typical value</dt><dd class="est">about ${money(val,true)}</dd><dt>On the market</dt><dd>${w.lst.length? w.lst.length+' listed' : 'None listed right now'}</dd><dt>At auction</dt><dd>${w.auc.length? w.auc.map(x=>esc(x.a.n)+', lot '+x.L_.n).join('; ') : 'Not in any catalogue'}</dd><dt>Local dealers</dt><dd>${w.shops.length? w.shops.map(s=>esc(s.n)).join(', ') : 'None of the shops you know have one'}</dd><dt>Known owners</dt><dd>${w.owners.length? w.owners.length+(w.owners.length>6?'+':'')+' collector'+(w.owners.length>1?'s':'') : 'No one you can find'}</dd></dl>
    <div class="formrow"><button class="btn sm" data-act="design" data-a="${esc(key)}">Sales history</button>${w.lst.length?`<button class="btn sm pri" data-act="listing" data-a="${w.lst[0].id}">See the listing</button>`:''}<button class="btn sm" data-act="chstart" data-a="grail|${esc(key)}">Track as a grail</button></div></div></div>
    ${w.owners.length?`<div class="panel"><h3>Ask an owner</h3><p class="small muted" style="margin:0 0 6px">Collectors will sell something they didn't list, for a premium. The more they like it, the more they want.</p><div class="rows">${w.owners.slice(0,5).map(o=>{ const k=o.k[0]==='M'?'m':'c'; const ask=ownerAsk(o); return `<div class="row" style="cursor:default"><div class="rt"><b>${esc(NPC(o.o).h)}</b><span>${o.g>0?'Graded '+(k==='m'?gTxt(o.g):o.g):'Raw'} · would take ${money(ask)}</span></div><button class="btn sm" data-act="ownbuy" data-a="${k}:${o.id}" data-confirm="Pay ${money(ask)}" ${G.player.cash<ask?'disabled':''}>Buy</button></div>`; }).join('')}</div></div>`:''}
    <div class="panel"><h3>Post a wanted ad</h3><p class="small muted" style="margin:0 0 6px">If someone holding one is willing, they'll list it for you near your price. It can take a long time, or never happen.</p><div class="formrow"><input class="inp money-in" type="number" min="1" step="1" id="wantmax" placeholder="Your max" value="${W?W.max:Math.ceil(val*1.1)}"><button class="btn sm" data-act="wantpost" data-a="${esc(key)}">${W?'Update':'Post'}</button></div></div></div>` };
}
ACT.chase = a=>{ UI.chpg=0; UI.chf='all'; openSheet(()=>chaseSheet(+a)); };
ACT.chitem = a=>openSheet(()=>chaseItemSheet(a));
ACT.chpage = a=>{ UI.chpg=+a; refreshSheet(); }; ACT.chf = a=>{ UI.chf=a; UI.chpg=0; refreshSheet(); };
ACT.chpin = a=>{ const ch=chases().find(c=>c.id===+a); if (!ch.pin && chases().filter(c=>c.pin).length>=6){ showToast('Six pinned chases at most. Unpin one first.'); return; } ch.pin=!ch.pin; refreshSheet(); queueSave(); };
ACT.chdel = a=>{ G.player.chases=chases().filter(c=>c.id!==+a); closeSheet(); render(true); queueSave(); };
ACT.ownbuy = (a,el)=>{ if (!armed(el)) return; const [k,id]=a.split(':'); const e=buyFromOwner(k,+id); if (e){ showToast(e); return; } showToast('They sold it to you. It\'s in your collection.', true); refreshSheet(); render(true); afterAction(); };
ACT.wantpost = a=>{ const v=Math.round(parseFloat($('#wantmax').value)); if (!(v>0)) return; const W=G.player.wanted=G.player.wanted||[]; const x=W.find(w=>w.k===a); if (x) x.max=v; else W.push({k:a, max:v, t:G.day}); showToast('Wanted ad posted at up to '+money(v)+'.', true); refreshSheet(); queueSave(); };
ACT.wantdel = a=>{ G.player.wanted.splice(+a,1); render(true); queueSave(); };
// the Chases tab in Collection
(function(){ const cv=VIEWS.coll; VIEWS.coll=()=>{ if (UI.sub.coll!=='chases'){ const h=cv(); return h.replace('<button class="" data-act="sub" data-a="coll:runs">Runs</button>','<button class="" data-act="sub" data-a="coll:runs">Runs</button><button class="" data-act="sub" data-a="coll:chases">Chases</button>'); }
  const save=UI.sub.coll; UI.sub.coll='runs'; let h=cv(); UI.sub.coll=save; const a=h.indexOf('<div class="subtabs">'); const b=h.indexOf('</div>',a)+6; let tabs=h.slice(a,b).replace('class="on" data-act="sub" data-a="coll:runs"','class="" data-act="sub" data-a="coll:runs"'); tabs=tabs.replace('<button class="" data-act="sub" data-a="coll:runs">Runs</button>','<button class="" data-act="sub" data-a="coll:runs">Runs</button><button class="on" data-act="sub" data-a="coll:chases">Chases</button>'); return h.slice(0,a)+tabs+chasesView(); }; })();
// ---------- buttons and research on existing pages ----------
function injectTop(fn, mkBtns){ return function(){ const r=fn.apply(null, arguments); if (!r) return r; const b=mkBtns.apply(null, arguments); if (!b) return r; const i=r.h.indexOf('<div class="stack">'); if (i<0) return r; const j=i+19; r.h=r.h.slice(0,j)+`<div class="formrow" style="margin:0">${b}</div>`+r.h.slice(j); return r; }; }
playerSheet = (function(f){ return function(pid){ const r=f(pid); if (!r) return r; const p=P(pid); const young = p.tm===-1 || (ageOf(p)<=26); const panel = young? researchPlayerHTML(p) : `<div class="panel"><h3>Collect him</h3><div class="formrow">${chaseBtns([['rc',p.id,'Chase his rookie cards'],['pc',p.id,'Start a player collection']])}</div></div>`; const i=r.h.indexOf('<div class="panel">'); r.h = i<0? r.h+panel : r.h.slice(0,i)+panel+r.h.slice(i); return r; }; })(playerSheet);
designSheet = injectTop(designSheet, key=> key[0]==='M'? fwBtn('i',key)+chaseBtns([['vars',cmD(key).sid+':'+cmD(key).n,'Chase every cover'],['grail',key,'Track as a grail']]) : fwBtn('k',key)+chaseBtns([['grail',key,'Track as a grail']]));
seriesSheet = injectTop(seriesSheet, sid=> chaseBtns([['run',sid,'Chase the run']])+(S_(sid).sts==='on'||S_(sid).sts==='ann'?`<button class="btn sm" data-act="pull" data-a="${sid}">${(G.player.pull||[]).includes(sid)?'On your pull list':'Add to pull list'}</button>`:'')+(S_(sid).sts==='on'||S_(sid).sts==='ann'?`<button class="btn sm" data-act="cresearch" data-a="${sid}:${S_(sid).n+1}">Research next issue</button>`:''));
creatorSheet = (function(f){ return function(id){ const r=f(id); if (!r) return r; const c=CR_(id); const hist=(c.fh||[]).concat([[yearOf(G.day), +c.fame.toFixed(2)]]); const pts=hist.map(x=>[x[0], followersOf({fame:x[1], vh:0})]);
  const vars=[]; for (const s of G.cm.ser){ for (const n in s.v) for (const code of s.v[n].split(',')) if (pvar(code).a===c.id) vars.push(mk(s.id,+n,1,code)); } vars.sort((a,b)=>cmD(a).day-cmD(b).day);
  const panel=`<div class="panel"><h3>Career</h3><dl class="kv"><dt>Following</dt><dd>about ${followersOf(c).toLocaleString()} collectors</dd>${c.ex&&c.ex.until>=yearOf(G.day)?`<dt>Exclusive</dt><dd>${esc(G.cm.pubs[c.ex.pub].n)} through ${c.ex.until}</dd>`:''}${c.vh>1?`<dt>Variants</dt><dd>In demand: selling well above cover</dd>`:''}<dt>Variant covers</dt><dd>${vars.length}</dd></dl>${pts.length>=3?sparkSVG(pts,{h:80,axis:true}):''}${['A','C','WA'].includes(c.r)?`<div class="formrow">${chaseBtns([['art',c.id,'Chase their covers']])}</div>`:''}
    ${vars.length?`<p class="small muted" style="margin:8px 0 4px">Earliest variant covers</p><div class="rows">${vars.slice(0,4).map(k=>issueRow(k)).join('')}</div>`:''}</div>`;
  const i=r.h.indexOf('<div class="panel">'); r.h = i<0? r.h+panel : r.h.slice(0,i)+panel+r.h.slice(i); return r; }; })(creatorSheet);
productSheet = injectTop(productSheet, pid=> fwBtn('set',pid)+chaseBtns([['set',pid,'Chase the base set']]));
// story panels on the things you own
cardSheet = (function(f){ return function(id){ const r=f(id); const c=C(id); if (!r || !c || c.o!==0) return r; const sp=storyPanel(c,'c'); const i=r.h.lastIndexOf('<div class="panel"><h3>History'); r.h = i>=0? r.h.slice(0,i)+sp+r.h.slice(i) : r.h.replace(/<\/div>$/, sp+'</div>'); return r; }; })(cardSheet);
cmCopySheet = (function(f){ return function(id){ const r=f(id); const c=MC(id); if (!r || !c || c.o!==0) return r; const sp=storyPanel(c,'m'); const i=r.h.indexOf('<div class="panel"><h3>History'); r.h = i>=0? r.h.slice(0,i)+sp+r.h.slice(i) : r.h.replace(/<\/div>$/, sp+'</div>'); return r; }; })(cmCopySheet);
// solicitations get a research button
(function(){ const wv=cmWeekView; cmWeekView=function(){ return wv().replace(/<button class="btn sm" data-act="cpre" data-a="(\d+):(\d+)"/g, (m,sid,n)=>`<button class="btn sm" data-act="cresearch" data-a="${sid}:${n}">Research</button>`+m); }; })();
// the recap leads with your world
(function(){ const adv=ACT.adv; ACT.adv=async a=>{ UI.fsnap=followSnap(); return adv(a); };
  const br=buildRecap; buildRecap=function(t0, snap0, log, stop){ const r=br(t0,snap0,log,stop); r.world=yourWorld(t0, UI.fsnap); return r; };
  const rh=recapHTML; recapHTML=function(r){ const h=rh(r); const w=worldHTML(r); return w? h.replace('<div class="stack">','<div class="stack">'+w) : h; }; })();
// chase items get a star at shops and tables too
(function(){ const wm=wantMatch; wantMatch=function(e){ if (wm(e)) return true; const o=objOf(e); if (!o || e.t==='s') return false; const k=o.k; for (const ch of chases()){ if (ch.k==='grail' && ch.ref===k) return true; if ((ch.k==='rc'||ch.k==='pc') && e.t==='c' && D(k).pid===ch.ref) return true; if (ch.k==='run' && e.t==='m' && cmD(k).sid===ch.ref) return true; if (ch.k==='art' && e.t==='m' && (cmD(k).s.cv===ch.ref || pvar(cmD(k).v||'').a===ch.ref)) return true; } return false; }; })();
// ---------- cover artists you can recognise ----------
function artStyle(cid){ const h=hsh('sty'+cid); const r=mkRng(h);
  return { tpls: shuffleWith(['portrait','hero','face','eye','type','geo','land','city','speed','window','crowd','space','loom','door'], h).slice(0,3), pal:['warm','cool','mono','neon','pastel','natural'][h%6], line: r()<0.4?1.8:1, frame:['close','wide','normal','normal'][Math.floor(r()*4)], motif:['moons','birds','stars','halftone','frame','splatter','none','none'][Math.floor(r()*8)], title:['top','bottom','vertical','top'][Math.floor(r()*4)] }; }
function palShift(P, pal){ const [a,b,c]=P; switch(pal){ case 'warm': return [shade(a,-0.1),'#e76f51',c]; case 'cool': return ['#0b2239','#4cc9f0',c]; case 'mono': return ['#111',shade(b,-0.2),'#eee']; case 'neon': return ['#0d0221','#ff2a6d','#05d9e8']; case 'pastel': return ['#f7d6e0','#7fc8a9','#3d405b']; default: return P; } }
function motifSVG(m, r, W, H, col){ switch(m){ case 'moons': return `<circle cx="${W*0.82}" cy="${H*0.16}" r="14" fill="${col}" opacity=".8"/><circle cx="${W*0.86}" cy="${H*0.14}" r="12" fill="#000" opacity=".35"/>`; case 'birds': return Array.from({length:5},(_,i)=>`<path d="M${W*(0.55+i*0.07)} ${H*(0.18+(i%2)*0.04)} q6 -6 12 0 q6 -6 12 0" stroke="${col}" stroke-width="2" fill="none"/>`).join(''); case 'stars': return Array.from({length:7},()=>`<path d="M${(r()*W).toFixed(0)} ${(r()*H*0.5).toFixed(0)} l2 5 l5 0 l-4 3 l2 5 l-5 -3 l-5 3 l2 -5 l-4 -3 l5 0 Z" fill="${col}" opacity=".7"/>`).join(''); case 'halftone': return `<pattern id="mh${Math.floor(r()*1e6)}" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1.4" fill="${col}"/></pattern>`.replace(/^(.*)$/, (m0)=>{ const id=/id="(mh\d+)"/.exec(m0)[1]; return m0+`<rect width="${W}" height="${H*0.35}" y="${H*0.65}" fill="url(#${id})" opacity=".35"/>`; }); case 'frame': return `<rect x="8" y="8" width="${W-16}" height="${H-16}" fill="none" stroke="${col}" stroke-width="3"/><rect x="13" y="13" width="${W-26}" height="${H-26}" fill="none" stroke="${col}" stroke-width="1"/>`; case 'splatter': return Array.from({length:12},()=>`<circle cx="${(r()*W).toFixed(0)}" cy="${(r()*H).toFixed(0)}" r="${(1+r()*6).toFixed(1)}" fill="${col}" opacity=".6"/>`).join(''); } return ''; }

// ===================== GRADING DRAMA =====================
// Slabs come back as an event: sealed case, a beat of suspense, the grade, where it sits in the population,
// and what it did to the value. Nothing here changes how grades are decided; it only shows them properly.
function rvGradeTxt(k, g){ return k==='m'? gTxt(g) : String(g); }
function rvName(k, g){ return k==='m'? CGN[g] : GRADE_NAMES[g]; }
function rvTier(k, g){ const v = k==='m'? g/10 : g; return v>=(k==='m'?9.8:10)? 'gem' : v>=(k==='m'?9.0:9)? 'great' : v>=(k==='m'?7.0:7)? 'ok' : 'low'; }
function popLine(k, o){
  const g=o.g; if (!(g>0)) return '';
  let tot=0, at=0, higher=0;
  if (k==='m'){ const p=cmPop(o.k); for (const x in p){ tot+=p[x]; if (+x===g) at+=p[x]; else if (+x>g) higher+=p[x]; } }
  else { const p=popOf(o.k); p.forEach((n,i)=>{ tot+=n; if (i===g) at+=n; else if (i>g) higher+=n; }); }
  const gl=rvGradeTxt(k,g);
  if (tot<=1) return 'The only copy GCS has graded so far';
  if (higher===0 && at===1) return `The highest grade of ${tot} graded copies`;
  if (higher===0) return `Tied for the highest grade: ${at} of ${tot} graded copies`;
  return `${at} at GCS ${gl}, ${higher} graded higher, ${tot} graded in total`;
}
function rvQueue(){ const P_=G.player; P_.rv=(P_.rv||[]).filter(x=>objFor(x.k,x.id) && objFor(x.k,x.id).g>0); return P_.rv; }
function rvValue(k, o){ return k==='m'? cmCopyValue(o) : cardValue(o); }
function rvRaw(k, o){ return k==='m'? comicCover(o.k) : cardFront(o.k,o.s); }
function rvSlab(k, o){ return k==='m'? comicSlab(o) : slabSVG(o); }
function rvTitle(k, o){ return k==='m'? cmD(o.k).title : cardName(o); }
function startReveal(){
  if (UI.rvl || UI.open) return; const q=rvQueue(); if (!q.length) return;
  UI.rvl={ i:0, stage:0, done:[], timer:null };
  let el=$('#rvl'); if (!el){ el=document.createElement('div'); el.id='rvl'; el.className='rvl'; el.setAttribute('role','dialog'); el.setAttribute('aria-label','Grading returns'); document.body.appendChild(el); }
  document.body.classList.add('noscroll'); rvRender();
}
function rvClose(){ const st=UI.rvl; if (st && st.timer) clearTimeout(st.timer); UI.rvl=null; const el=$('#rvl'); if (el) el.remove(); document.body.classList.remove('noscroll'); refresh(); queueSave(); }
// a short celebration for the rare big moments (a big pull, a Gem Mint 10): confetti and a banner, gone in under 3 seconds,
// never blocking a tap. Reduced-motion users get the banner only.
function celebrate(title, sub){
  const old=document.getElementById('cele'); if (old) old.remove(); const el=document.createElement('div'); el.id='cele'; el.className='cele'; el.setAttribute('aria-live','polite');
  const calm=window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches; const cols=['#ffd166','#ef476f','#06d6a0','#4cc9f0','#f8f9fa','#c77dff'];
  let bits=''; if (!calm) for (let i=0;i<70;i++){ const x=Math.random()*100, d=Math.random()*0.6, t=1.6+Math.random()*1.1, r=Math.round(Math.random()*720-360), w=5+Math.random()*6;
    bits+=`<i style="left:${x.toFixed(1)}%;background:${cols[i%cols.length]};width:${w.toFixed(1)}px;height:${(w*0.45).toFixed(1)}px;animation-delay:${d.toFixed(2)}s;animation-duration:${t.toFixed(2)}s;--r:${r}deg"></i>`; }
  el.innerHTML=`${bits}<div class="cele-burst"></div><div class="cele-ban"><b>${esc(title)}</b>${sub?`<span>${esc(sub)}</span>`:''}</div>`;
  document.body.appendChild(el); try { if (navigator.vibrate) navigator.vibrate([25,40,70]); } catch(e){}
  setTimeout(()=>{ el.classList.add('out'); setTimeout(()=>el.remove(), 450); }, 2600); }
function rvRender(){
  const st=UI.rvl; if (!st) return; const q=rvQueue(); if (!q.length || st.i>=q.length){ rvFinish(); return; }
  const r=q[st.i]; const o=objFor(r.k,r.id); const el=$('#rvl'); if (!el) return;
  const tier=rvTier(r.k,r.g); const label=r.k==='m'?'GCS Comics':'GCS';
  const top=`<div class="rv-top"><span>${label} returns</span><span>${st.i+1} of ${q.length}</span>${q.length>1?`<button class="btn sm" data-act="rvsummary">Skip to summary</button>`:''}<button class="btn sm" data-act="rvclose" aria-label="Close">✕</button></div>`;
  if (st.stage===0){
    el.innerHTML = `${top}<div class="rv-stage" data-act="rvopen"><div class="rv-case sealed ${r.k==='m'?'cm':''}">${rvRaw(r.k,o)}<div class="rv-veil"><b>${label}</b><span>Grade sealed</span></div></div></div><div class="rv-cap"><b>${esc(rvTitle(r.k,o))}</b><span>Back from grading. Tap to open the case.</span></div><div class="rv-act"><button class="btn pri" data-act="rvopen">Open it</button></div>`;
  } else if (st.stage===1){
    el.innerHTML = `${top}<div class="rv-stage"><div class="rv-case rolling ${r.k==='m'?'cm':''}">${rvRaw(r.k,o)}<div class="rv-veil"><b id="rvnum" class="num">–</b><span>Grading…</span></div></div></div><div class="rv-cap"><b>${esc(rvTitle(r.k,o))}</b><span>&nbsp;</span></div><div class="rv-act"></div>`;
    const scale = r.k==='m'? CGL.slice().reverse().map(x=>gTxt(x)) : ['1','2','3','4','5','6','7','8','9','10']; const fin=rvGradeTxt(r.k,r.g); let n=0; const seq=[]; const fi=scale.indexOf(fin);
    for (let i=0;i<9;i++) seq.push(scale[Math.min(scale.length-1, Math.floor(Math.random()*scale.length))]); seq.push(scale[Math.min(scale.length-1,Math.max(0,fi+1))], scale[Math.max(0,fi-1)], fin);
    const step=()=>{ if (!UI.rvl || UI.rvl!==st) return; const e=$('#rvnum'); if (!e) return; e.textContent=seq[n]; n++; if (n<seq.length){ st.timer=setTimeout(step, 90+n*22+(n>=seq.length-2?260:0)); } else { st.timer=setTimeout(()=>{ if (UI.rvl===st){ st.stage=2; rvRender(); } }, 520); } };
    step();
  } else {
    const v1=rvValue(r.k,o); const d=v1-(r.raw||0); const net=d-(r.fee||0); const pl=popLine(r.k,o);
    const notes=[]; if (r.k==='m'){ if (o.gr) notes.push(['bad','GCS found restoration ('+REST_N[o.r].toLowerCase()+'). Restored books sell for far less.']); if (o.sg && o.sg.s==='a') notes.push(['good','The signature was authenticated.']); else if (o.sg && o.sg.s==='x') notes.push(['bad','The signature could not be authenticated.']); }
    const line = tier==='gem'? 'Gem Mint. Flawless, as far as GCS can tell.' : tier==='great'? 'A strong grade.' : tier==='ok'? 'A solid, honest copy.' : 'A low grade. Sometimes a slab is worth it anyway; sometimes it is a lesson.';
    el.innerHTML = `${top}<div class="rv-stage"><div class="rv-slab ${tier} ${r.k==='m'?'cm':''}">${rvSlab(r.k,o)}${tier==='gem'?'<i class="rv-shine"></i>':''}</div></div>
      <div class="rv-info ${tier}"><div class="rv-grade"><b>${rvGradeTxt(r.k,r.g)}</b><span>${esc(rvName(r.k,r.g))}</span></div><p class="rv-line">${esc(line)}</p>${pl?`<p class="rv-pop">${esc(pl)}</p>`:''}${notes.map(n=>`<p class="rv-note ${n[0]}">${esc(n[1])}</p>`).join('')}
      <dl class="kv"><dt>Raw estimate</dt><dd>${money(r.raw||0,true)}</dd><dt>As a slab</dt><dd>${money(v1,true)}</dd><dt>Change</dt><dd class="${d>=0?'up':'down'}">${d>=0?'+':'−'}${money(Math.abs(d),true)}</dd><dt>After the fee</dt><dd class="${net>=0?'up':'down'}">${net>=0?'+':'−'}${money(Math.abs(net),true)}</dd></dl></div>
      <div class="rv-act"><button class="btn" data-act="rvdetail" data-a="${r.k}:${r.id}">Details</button><button class="btn pri" data-act="rvnext">${st.i<q.length-1?'Next ('+(st.i+2)+' of '+q.length+')':'Finish'}</button></div>`;
    if (!st.done.includes(r.k+':'+r.id)){ st.done.push(r.k+':'+r.id); if (r.g>=(r.k==='m'?98:10)) setTimeout(()=>celebrate(rvGradeTxt(r.k,r.g)==='10'?'Gem Mint 10!':'Gem Mint '+rvGradeTxt(r.k,r.g)+'!', rvTitle(r.k,o)), 350); }
  }
}
function rvFinish(){
  const st=UI.rvl; const done=st?st.done.slice():[]; const all=rvQueue().filter(x=>done.includes(x.k+':'+x.id) || true);
  const seen=all.filter(x=>done.includes(x.k+':'+x.id)); G.player.rv=rvQueue().filter(x=>!done.includes(x.k+':'+x.id));
  rvClose(); if (seen.length>1) openSheet(()=>rvSummary(seen)); else if (seen.length===1 && seen[0].g>=(seen[0].k==='m'?98:10)) showToast('A '+rvGradeTxt(seen[0].k,seen[0].g)+'. Something to brag about.', true);
}
function rvSummary(list){
  let raw=0, now=0, fees=0; const rows=list.map(r=>{ const o=objFor(r.k,r.id); if (!o) return ''; const v=rvValue(r.k,o); raw+=r.raw||0; now+=v; fees+=r.fee||0; return `<button class="row" data-act="${copyAct(r.k)}" data-a="${r.id}">${r.k==='m'?miniComic(o):(cardLineOfKind(r.k)? cardLineOfKind(r.k).mini(o) : miniCard(o))}<div class="rt"><b>${esc(rvTitle(r.k,o))}</b><span>${esc(popLine(r.k,o))}</span></div><div class="rv"><b>${rvGradeTxt(r.k,r.g)}</b><span class="${v>=(r.raw||0)?'up':'down'}">${money(r.raw||0,true)} → ${money(v,true)}</span></div></button>`; }).join('');
  const net=now-raw-fees;
  return { t:'Grading results', h:`<div class="stack"><div class="kpis"><div class="kpi"><small>Returned</small><b>${list.length}</b></div><div class="kpi"><small>Raw estimate</small><b>${money(raw,true)}</b></div><div class="kpi"><small>Slabs now</small><b>${money(now,true)}</b></div><div class="kpi"><small>After fees</small><b class="${net>=0?'up':'down'}">${net>=0?'+':'−'}${money(Math.abs(net),true)}</b></div></div><div class="panel"><div class="rows">${rows}</div></div></div>` };
}
ACT.rvopen = ()=>{ const st=UI.rvl; if (!st || st.stage!==0) return; st.stage=1; rvRender(); };
ACT.rvnext = ()=>{ const st=UI.rvl; if (!st) return; st.i++; st.stage=0; rvRender(); };
ACT.rvclose = ()=>rvClose();
ACT.rvsummary = ()=>{ const st=UI.rvl; if (!st) return; const q=rvQueue(); for (const r of q) if (!st.done.includes(r.k+':'+r.id)) st.done.push(r.k+':'+r.id); st.i=q.length; rvRender(); };
ACT.rvdetail = a=>{ const [k,id]=a.split(':'); const st=UI.rvl; rvClose(); ACT[copyAct(k)](id); };
ACT.rvstart = ()=>startReveal();
// after time passes, open the reveal on top of the recap
(function(){ const adv=ACT.adv; ACT.adv=async a=>{ await adv(a); try { if (!UI.busy && rvQueue().length && !UI.rvl && !UI.open) setTimeout(startReveal, 350); } catch(e){ console.error(e); } }; })();
// ---------- crack it out and try again ----------
function crackCard(id){ const c=C(id); if (!c || c.o!==0 || c.l || !(c.g>0)) return 'That slab can\'t be opened.'; const g=c.g; c.pg=g; c.g=0; delete c.cert; c.cr=(c.cr||0)+1; (c.h=c.h||[]).push([G.day,'Cracked out of a GCS '+g+' slab',0,'']); G.player.rv=(G.player.rv||[]).filter(x=>!(x.k==='c'&&x.id===id)); fvClear(c.k); return null; }
function crackComic(id){ const c=MC(id); if (!c || c.o!==0 || c.l || !(c.g>0)) return 'That slab can\'t be opened.'; const g=c.g; c.pg=g; c.g=0; delete c.cert; c.cr=(c.cr||0)+1; (c.h=c.h||[]).push([G.day,'Cracked out of a GCS '+gTxt(g)+' slab',0,'']); G.player.rv=(G.player.rv||[]).filter(x=>!(x.k==='m'&&x.id===id)); cfvClear(c.k); return null; }
function crackTc(id){ const c=TC(id); if (!c || c.o!==0 || c.l || !(c.g>0)) return 'That slab can\'t be opened.'; const g=c.g; c.pg=g; c.g=0; delete c.cert; c.cr=(c.cr||0)+1; (c.h=c.h||[]).push([G.day,'Cracked out of a GCS '+g+' slab',0,'']); G.player.rv=(G.player.rv||[]).filter(x=>!(x.k==='t'&&x.id===id)); tfvClear(c.k); return null; }
function crackPanel(k, o){
  if (!o || o.o!==0 || o.l || !(o.g>0)) return '';
  const T=(k==='m'?CGRADE_TIERS:GRADE_TIERS).find(t=>t.id==='std'); const cracks=o.cr||0;
  return `<div class="panel"><h3>Crack it out?</h3><p class="small muted" style="margin:0 0 8px">Another grader on another day can see the same book differently: it might come back higher, the same, or lower, by a grade or so. The old grade stays in the population report either way${o.gr?', and restoration, once found, stays on the record':''}. ${cracks?`You've done this ${cracks} time${cracks>1?'s':''} before. `:''}A regrade costs ${money(T.fee)} and takes ${T.days} days.</p><div class="formrow"><button class="btn sm" data-act="crack" data-a="${k}:${o.id}:0" data-confirm="Crack it out">Crack it out</button><button class="btn sm pri" data-act="crack" data-a="${k}:${o.id}:1" data-confirm="Crack and resubmit, ${money(T.fee)}" ${G.player.cash<T.fee?'disabled':''}>Crack and resubmit</button></div></div>`;
}
ACT.crack = (a,el)=>{ if (!armed(el)) return; const [k,id,re]=a.split(':'); const e = k==='m'? crackComic(+id) : cardLineOfKind(k)? cardLineOfKind(k).crack(+id) : crackCard(+id); if (e){ showToast(e); return; }
  if (re==='1'){ const e2 = k==='m'? cmSubmitGrade(+id,'std',false) : cardLineOfKind(k)? cardLineOfKind(k).submit(+id) : submitGrading(+id,'std'); if (e2){ showToast(e2); } else showToast('Cracked out and resubmitted. Fingers crossed.', true); } else showToast('Out of the slab. It\'s a raw '+(k==='m'?'comic':'card')+' again.', true);
  closeSheet(); render(true); queueSave(); };
cardSheet = (function(f){ return function(id){ const r=f(id); const c=C(id); if (!r || !c || c.o!==0) return r; const p=crackPanel('c',c); if (p){ const i=r.h.lastIndexOf('<div class="panel"><h3>History'); r.h = i>=0? r.h.slice(0,i)+p+r.h.slice(i) : r.h+p; } if (c.pg && c.g===0){ r.h=r.h.replace('<dl class="kv">','<p class="small muted" style="margin:0">Cracked from a GCS '+c.pg+' slab.</p><dl class="kv">'); } return r; }; })(cardSheet);
cmCopySheet = (function(f){ return function(id){ const r=f(id); const c=MC(id); if (!r || !c || c.o!==0) return r; const p=crackPanel('m',c); if (p){ const i=r.h.lastIndexOf('<div class="panel"><h3>History'); r.h = i>=0? r.h.slice(0,i)+p+r.h.slice(i) : r.h+p; } return r; }; })(cmCopySheet);
pcData = (function(f){ return function(kind,o){ const r=f(kind,o); if (o.g>0){ const pl=popLine(kind,o); if (pl) r.meta.push(['Population', pl]); } return r; }; })(pcData);
// waiting returns are visible from Home and the Grading page
(function(){ const hv=VIEWS.home; VIEWS.home=()=>{ const h=hv(); const n=rvQueue().length; if (!n) return h; const i=h.indexOf('<div class="kpis">'); const b=`<div class="note" style="display:flex;align-items:center;gap:10px;margin-bottom:12px"><b style="flex:1">${n} grading return${n>1?'s':''} waiting to be opened</b><button class="btn sm pri" data-act="rvstart">Open ${n>1?'them':'it'}</button></div>`; return i<0? b+h : h.slice(0,i)+b+h.slice(i); }; })();
(function(){ const gv=VIEWS.grade; VIEWS.grade=()=>{ const h=gv(); const n=rvQueue().length; if (!n) return h; const i=h.indexOf('<div class="kpis">'); const b=`<div class="note" style="display:flex;align-items:center;gap:10px;margin-bottom:12px"><b style="flex:1">${n} return${n>1?'s':''} waiting to be opened</b><button class="btn sm pri" data-act="rvstart">Open ${n>1?'them':'it'}</button></div>`; return i<0? b+h : h.slice(0,i)+b+h.slice(i); }; })();

// ===================== GROUP BREAKS & REPACKS =====================
// A break opens real product and deals the cards out by team. Spots are priced by a host who knows some things and not others.
// Repacks are mystery boxes made from real cards. Some repackers are honest, some are not.
const BRK_HOSTS=['Wax Night Live','Rip Squad Breaks','The Box Seat','Hobby Hour Breaks','Case Break Central','Team Spot Tonight','Ripped Live','Slab & Wax'];
function brk(){
  if (!G.brk){ G.brk={v:1, list:[], hist:[], rep:null, nid:1, pend:[]}; const r=mkRng(hsh('brk'+G.seed)); G.brk.rep=[
    {id:0, n:'Lucky Dip Repacks', who:'Nina', eff:0.66, promise:'num', claim:'Every box has at least one numbered card. Fair value, no gimmicks.', col:'#2f6fb3', old:0, tiers:[{price:15,n:25,stock:6},{price:40,n:40,stock:5},{price:100,n:60,stock:3}]},
    {id:1, n:'Mega Hit Mystery Boxes', who:'Drew', eff:0.42, promise:'auto', claim:'GUARANTEED AUTOGRAPH IN EVERY BOX. Most boxes return 150% or more!', col:'#c0392b', old:0, tiers:[{price:15,n:25,stock:9},{price:40,n:40,stock:8},{price:100,n:60,stock:5}]},
    {id:2, n:"Old Timer's Shoebox", who:'Walt', eff:0.56, promise:'old', claim:'Every card from a set at least three years old. Some duds. Some gems.', col:'#8e6b3a', old:1, tiers:[{price:15,n:25,stock:5},{price:40,n:40,stock:4},{price:100,n:60,stock:2}]}];
    for (const rp of G.brk.rep){ rp.ver=Math.round((rp.eff*100+12+(r()-0.5)*12)/2)*2; rp.you={n:0, paid:0, got:0}; rp.sold=ri(40,200); }
    for (let i=0;i<3;i++) newBreak(G.day+ri(1,4)); }
  return G.brk;
}
function releasedForBreak(){ const yr=yearOf(G.day); return releasedProducts().filter(p=>{ const f=B(p).formats; return (f.hobby||f.blaster) && yr-p.yr<=2; }); }
function teamPlayers(prod){ const cl=prod.cl; const pids=new Set(); cl.base.forEach(e=>pids.add(e[0])); (cl.auto||[]).forEach(x=>pids.add(x)); (cl.ins||[]).forEach(a=>a.forEach(x=>pids.add(x)));
  const by=TEAMS_DEF.map(()=>[]); for (const pid of pids){ const p=P(pid); const tm=p.tm>=0?p.tm:p.org; if (by[tm]) by[tm].push(p); } for (const a of by) a.sort((x,y)=>playerBase(y)-playerBase(x)); return by; }
function teamWeights(prod){ const by=teamPlayers(prod); const w=by.map(a=>a.reduce((s,p)=>s+Math.pow(Math.max(0.05,playerBase(p)),1.2),0)); const m=w.reduce((a,b)=>a+b,0)/w.length||1; return w.map(x=>0.3*m+0.7*x); }
function newBreak(day){
  const H=brk(); const prods=releasedForBreak(); if (!prods.length) return null; const prod=pick(prods); const fmt=B(prod).formats.hobby?'hobby':'blaster';
  const f=B(prod).formats[fmt]; const boxes = fmt==='hobby'? ri(2,3) : ri(6,10); const cost=boxes*f.price; const total=Math.round(cost*rf(1.14,1.32));
  const n=TEAMS_DEF.length; const mode=R()<0.72?'pyt':'rt'; const wt=teamWeights(prod); const k=+rf(0.35,0.95).toFixed(2);
  const hw=wt.map(x=>Math.pow(x,k)); const hs=hw.reduce((a,b)=>a+b,0); const price = mode==='rt'? wt.map(()=>Math.max(2,Math.round(total/n))) : hw.map(x=>Math.max(2,Math.round(total*x/hs)));
  const b={ id:H.nid++, host:pick(BRK_HOSTS), p:prod.id, fmt, boxes, mode, day:day||G.day+ri(2,5), seed:Math.floor(R()*2e9), price, wt:wt.map(x=>+x.toFixed(2)), spots:Array(n).fill(-1), st:'open', k };
  const pre=Math.floor(n*rf(0,0.3)); const npcs0=npcPool({}); for (let i=0;i<pre;i++){ const j=Math.floor(R()*n); if (b.spots[j]===-1){ const nn=pick(npcs0); if (nn.cash>=price[j]*1.5){ nn.cash-=price[j]; b.spots[j]=nn.id; } } }
  H.list.push(b); return b;
}
function breakFilled(b){ return b.spots.filter(x=>x!==-1).length; }
function breakMine(b){ return b.spots.map((x,i)=>x===0?i:-1).filter(i=>i>=0); }
function joinBreak(bid, idx){ const b=brk().list.find(x=>x.id===bid); if (!b || b.st!=='open' || G.day>=b.day) return 'That break has closed.'; if (b.spots[idx]!==-1) return 'That spot is taken.';
  if (breakMine(b).length>=6) return 'Six spots is the limit per break.'; const pr=b.price[idx]; if (G.player.cash<pr) return 'You need '+money(pr)+'.'; G.player.cash-=pr; G.player.bought+=pr; b.spots[idx]=0; return null; }
function joinRandom(bid, q){ const b=brk().list.find(x=>x.id===bid); let err=null; for (let i=0;i<q;i++){ const open=b.spots.map((x,j)=>x===-1?j:-1).filter(j=>j>=0); if (!open.length){ err=err||'Sold out.'; break; } const e=joinBreak(bid, open[Math.floor(R()*open.length)]); if (e){ err=e; break; } } return err; }
function breakRun(b){
  const prod=G.products[b.p]; const n=TEAMS_DEF.length; const order = b.mode==='rt'? shuffleWith(Array.from({length:n},(_,i)=>i), b.seed) : Array.from({length:n},(_,i)=>i);
  const teamOf = order; // spot i holds team order[i]
  const spotOfTeam={}; teamOf.forEach((t,i)=>spotOfTeam[t]=i);
  let keys=[]; for (let i=0;i<b.boxes;i++) keys=keys.concat(genSealed(prod, b.fmt, b.seed+i*7919).flat());
  const cnt=Array(n).fill(0); const tmOf=keys.map(k=>{ const d=D(k); return cardTeam(d,P(d.pid)); }); tmOf.forEach(t=>{ const s=spotOfTeam[t]; if (s!=null) cnt[s]++; });
  const rng=mkRng(b.seed^0x9e3779b1); const res={ hits:[], mine:[], kept:0, cards:keys.length, teams:{}, boxes:b.boxes }; const created=[];
  keys.forEach((k,i)=>{ const s=spotOfTeam[tmOf[i]]; if (s==null) return; const own=b.spots[s]; if (own===-1){ res.kept++; return; }
    const paid= own===0? Math.round(b.price[s]/Math.max(1,cnt[s])*100)/100 : 0; const acq=[G.day,'break',paid, b.host];
    const c=makeCard(k, own, own===0?acq:null, rng); if (own===0){ c.h=[[G.day,'Group break: '+teamName(tmOf[i])+' spot in '+b.host+"'s break",paid,'']]; c.nw=1; res.mine.push(c.id); } else if (G._npcCardIds) G._npcCardIds.push(c.id);
    created.push([c.id, own, cardValue(c)]); });
  created.sort((a,b_)=>b_[2]-a[2]); res.hits=created.slice(0,8).map(x=>[x[0], x[1], Math.round(x[2]*100)/100]);
  res.mineVal=Math.round(res.mine.reduce((s,id)=>s+cardValue(C(id)),0)*100)/100; res.paid=breakMine(b).reduce((s,i)=>s+b.price[i],0); res.myTeams=breakMine(b).map(i=>teamOf[i]);
  b.res=res; b.st='done'; b.teamOf=teamOf; return res;
}
function breakDay(t){
  const H=brk(); const npcs=npcPool({});
  for (const b of H.list.slice()){
    if (b.st!=='open') continue;
    if (t>=b.day){ const filled=breakFilled(b); const n=b.spots.length;
      if (filled<Math.ceil(n*0.5)){ b.st='cancelled'; b.spots.forEach((o,i)=>{ if (o===0){ G.player.cash+=b.price[i]; G.player.bought-=b.price[i]; toast('Break cancelled, spot refunded: '+money(b.price[i],true)); } else if (o>0){ const nn=NPC(o); if (nn) nn.cash+=b.price[i]; } }); }
      else { breakRun(b); if (breakMine(b).length){ H.pend.push(b.id); toast('Your break ran: '+b.res.mine.length+' cards in your collection', true); } }
      H.hist.unshift({id:b.id, host:b.host, p:b.p, day:t, st:b.st, mine:breakMine(b).length, res:b.res, teamOf:b.teamOf, boxes:b.boxes, fmt:b.fmt, mode:b.mode}); if (H.hist.length>14) H.hist.length=14; continue; }
    const left=Math.max(0,b.day-t);
    for (let i=0;i<b.spots.length;i++){ if (b.spots[i]!==-1) continue; const total=b.price.reduce((s,x)=>s+x,0); const trueV=(b.wt[i]/b.wt.reduce((s,x)=>s+x,0))*total;
      const ratio = b.mode==='rt'? 1 : Math.max(0.3,trueV/b.price[i]); const p=clamp(0.3*Math.pow(ratio,1.2)*(1+(3-Math.min(3,left))*0.3),0.02,0.6);
      if (R()<p){ for (let tries=0;tries<10;tries++){ const nn=pick(npcs); if (nn.cash>=b.price[i]*1.5){ nn.cash-=b.price[i]; b.spots[i]=nn.id; break; } } } }
  }
  H.list=H.list.filter(b=>b.st==='open' || t-b.day<3);
  const open=H.list.filter(b=>b.st==='open').length; if (open<4 && (dowOf(t)===1||dowOf(t)===4||open<2)) newBreak(t+ri(2,5));
  if (dowOf(t)===1){ for (const rp of H.rep){ rp.tiers.forEach(x=>x.stock=Math.min(x.stock+ri(1,3), 9)); rp.sold+=ri(3,14); } }
}
// ---------- repacks ----------
function promiseOk(k, rp){ const d=D(k); return rp.promise==='num'? d.run>0 : rp.promise==='auto'? !!d.auto : rp.promise==='old'? yearOf(G.day)-d.prod.yr>=3 : true; }
function makeRepack(rp, tier){
  const price=tier.price, N=tier.n; const rng=mkRng(Math.floor(R()*2e9)); const acq=[G.day,'bought',Math.round(price/N*100)/100, rp.n]; const cards=[];
  const target=price*rp.eff*clamp(Math.exp(gauss()*0.55-0.15),0.12,5.5);
  const cands=[]; for (let i=0;i<70;i++){ const c=takeNpc('c'); if (c && !cands.includes(c) && (!rp.old || yearOf(G.day)-D(c.k).prod.yr>=3)) cands.push(c); }
  const val=c=>cardValue(c); const hits=[]; let remaining=target;
  // the promise is kept first: honest repackers with something decent, the others with the cheapest card that counts
  if (rp.promise!=='old'){ let m=cands.filter(c=>promiseOk(c.k,rp) && val(c)>=0.5).sort((a,b)=>val(a)-val(b)); const fit=m.filter(c=>val(c)<=Math.max(3,price*0.9)); if (fit.length) m=fit;
    if (m.length){ const c= rp.eff>=0.7? m[Math.floor(m.length/2)] : m[0]; hits.push(c); remaining-=val(c); } }
  for (let h=0; h<4 && remaining>1.5; h++){ const pool=cands.filter(c=>!hits.includes(c) && val(c)<=remaining*1.4+1 && val(c)>=1); if (!pool.length) break; const want=remaining*rf(0.35,1); pool.sort((a,b)=>Math.abs(val(a)-want)-Math.abs(val(b)-want)); const c=pool[0]; hits.push(c); remaining-=val(c); }
  const fresh=[]; if (rp.promise!=='old' && !hits.some(c=>promiseOk(c.k,rp))){ for (let i=0;i<60;i++){ const k=randCardKey({hit:1}); if (promiseOk(k,rp)){ fresh.push(k); break; } } }
  for (const c of hits){ c.o=0; c.a=acq; c.h=[[G.day,'Pulled from a '+rp.n+' repack',0,'']]; c.nw=1; cards.push(c); }
  for (const k of fresh){ const c=makeCard(k,0,acq,rng); c.h=[[G.day,'Pulled from a '+rp.n+' repack',0,'']]; c.nw=1; cards.push(c); }
  let guard=0; while (cards.length<N && guard++<N*12){ const k=randCardKey(rp.old?{old:1}:{}); const c=makeCard(k,0,acq,rng); if (cardValue(c)>0.6){ delete G.cards[c.id]; continue; } c.h=[[G.day,'Pulled from a '+rp.n+' repack',0,'']]; c.nw=1; cards.push(c); }
  while (cards.length<N){ const k=randCardKey({}); const c=makeCard(k,0,acq,rng); c.h=[[G.day,'Pulled from a '+rp.n+' repack',0,'']]; c.nw=1; cards.push(c); }
  cards.sort((a,b)=>val(a)-val(b)); return cards;
}
function buyRepack(rid, ti){
  const rp=brk().rep[rid]; const tier=rp.tiers[ti]; if (!tier || tier.stock<=0) return 'Out of stock this week.'; if (G.player.cash<tier.price) return 'You need '+money(tier.price)+'.';
  G.player.cash-=tier.price; G.player.bought+=tier.price; tier.stock--; const cards=makeRepack(rp,tier); const got=cards.reduce((s,c)=>s+cardValue(c),0);
  rp.you.n++; rp.you.paid+=tier.price; rp.you.got+=got; rp.sold++;
  const layers=[]; for (let i=0;i<cards.length;i+=10) layers.push(cards.slice(i,i+10).map(c=>c.id)); const prod=releasedProducts()[0];
  G.player.pending={ p:prod.id, f:'pack', packs:layers, pi:0, title:rp.n, sub:'Mystery repack, '+money(tier.price), rp:{id:rp.id, col:rp.col, n:rp.n} };
  G.player.opened.unshift({t:G.day, p:prod.id, f:'pack', cost:tier.price, cards:cards.map(c=>c.id)}); if (G.player.opened.length>40) G.player.opened.length=40; G.player.packs+=layers.length;
  return null;
}
function repackArt(rp){ const F='font-family="Barlow Condensed,Arial Narrow,sans-serif"'; const c=rp.col; return `<svg viewBox="0 0 200 280" xmlns="http://www.w3.org/2000/svg" class="packsvg"><path d="M30 20 H170 L180 50 V270 H20 V50 Z" fill="${c}"/><path d="M30 20 H170 L180 50 H20 Z" fill="${shade(c,-0.3)}"/>${Array.from({length:8},(_,i)=>`<path d="M${24+i*22} 20 v-10" stroke="${shade(c,-0.4)}" stroke-width="3"/>`).join('')}<rect x="34" y="84" width="132" height="132" rx="8" fill="#fff" opacity=".92"/><text x="100" y="178" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="96" fill="${c}">?</text><text x="100" y="242" text-anchor="middle" ${F} font-weight="800" font-size="17" fill="#fff" letter-spacing="1">${esc(rp.n.toUpperCase().slice(0,22))}</text><text x="100" y="262" text-anchor="middle" ${F} font-size="10" fill="#fff" opacity=".8" letter-spacing="3">MYSTERY REPACK</text></svg>`; }
// ---------- UI ----------
function bMoney(b){ return money(b.price.reduce((s,x)=>s+x,0)); }
function breakRow(b){ const prod=G.products[b.p]; const filled=breakFilled(b); const mine=breakMine(b).length; const lo=Math.min(...b.price), hi=Math.max(...b.price);
  return `<button class="row" data-act="brk" data-a="${b.id}"><div class="rt"><b>${esc(b.host)}</b><span>${esc(prodName(prod))}, ${b.boxes} ${FMT_NAME[b.fmt].toLowerCase()}${b.boxes>1?'es':''}, ${b.mode==='pyt'?'pick your team':'random team'}</span><span>${b.st==='open'?'Runs '+fmtDate(b.day)+' · '+filled+' of '+b.spots.length+' spots sold':b.st==='cancelled'?'Cancelled':'Finished'}${mine?' · you have '+mine:''}</span></div><div class="rv"><b>${b.mode==='pyt'?money(lo)+'–'+money(hi):money(hi)}</b><span>a spot</span></div></button>`; }
function repRow(rp){ return `<button class="row" data-act="rep" data-a="${rp.id}"><div class="rt"><b>${esc(rp.n)}</b><span>${rp.tiers.map(t=>money(t.price)).join(' · ')} boxes</span><span>${rp.you.n?'You bought '+rp.you.n+', got back '+Math.round(rp.you.got/Math.max(1,rp.you.paid)*100)+'% of what you paid':'Verified buyers report about '+rp.ver+'% back'}</span></div></button>`; }
function breaksView(){
  const H=brk(); const open=H.list.filter(b=>b.st==='open').sort((a,b)=>a.day-b.day); const hist=H.hist.slice(0,6);
  return `${tip('breaks', `<b>Group breaks:</b> a host opens real boxes and deals the cards out by team. You buy a team's spot (or a random one) and get every card of that team. Hosts price teams by what they know, which is not everything. <b>Repacks:</b> mystery boxes built from real cards. Read the claims, then the verified buyers.`)}
  <div class="cols"><div class="stack"><div class="panel"><h3>Live breaks</h3><div class="rows">${open.map(breakRow).join('')||'<div class="empty">No breaks scheduled. New ones are announced through the week.</div>'}</div></div>
    ${hist.length?`<div class="panel"><h3>Recent breaks</h3><div class="rows">${hist.map(h=>`<button class="row" data-act="brkres" data-a="${h.id}"><div class="rt"><b>${esc(h.host)}</b><span>${esc(prodName(G.products[h.p]))}, ${h.st==='cancelled'?'cancelled':fmtDate(h.day)}</span>${h.mine&&h.res?`<span>You: ${h.res.mine.length} cards, worth about ${money(h.res.mineVal,true)} for ${money(h.res.paid)}</span>`:''}</div></button>`).join('')}</div></div>`:''}</div>
    <div class="panel"><h3>Repack boxes</h3><div class="rows">${H.rep.map(repRow).join('')}</div></div></div>`;
}
function brkSheet(id){
  const b=brk().list.find(x=>x.id===id); if (!b){ const h=brk().hist.find(x=>x.id===id); return h? brkResult(id) : {t:'Break', h:'<div class="empty">That break has finished.</div>'}; }
  const prod=G.products[b.p]; const f=B(prod).formats[b.fmt]; const by=teamPlayers(prod); const mine=breakMine(b).length; const open=b.st==='open'&&G.day<b.day;
  const order=Array.from({length:b.spots.length},(_,i)=>i); if (b.mode==='pyt' && UI.bsort==='price') order.sort((x,y)=>b.price[y]-b.price[x]);
  const rows = b.mode==='pyt'? order.map(i=>{ const own=b.spots[i]; const nb=by[i].slice(0,2).map(p=>pname(p)+(p.tm===-1?' (prospect)':'')).join(', ');
    return `<div class="row" style="cursor:default"><div class="rt"><b>${esc(teamName(i))}</b><span>${nb?esc(nb):'No one notable in this set'}</span><span class="${own===0?'up':''}">${own===-1?'Open':own===0?'Yours':esc((NPC(own)||{h:'a collector'}).h)}</span></div>${own===-1&&open?`<button class="btn sm pri" data-act="brkbuy" data-a="${b.id}:${i}" data-confirm="Pay ${money(b.price[i])}" ${G.player.cash<b.price[i]?'disabled':''}>${money(b.price[i])}</button>`:`<div class="rv"><b>${money(b.price[i])}</b></div>`}</div>`; }).join('')
   : `<div class="small" style="margin:0 0 8px">${breakFilled(b)} of ${b.spots.length} slots sold. Teams are shuffled across the slots when the break runs. You get whatever team your slot lands on.</div><div class="formrow"><button class="btn pri" data-act="brkrand" data-a="${b.id}:1" data-confirm="Pay ${money(b.price[0])}" ${!open||G.player.cash<b.price[0]?'disabled':''}>1 slot, ${money(b.price[0])}</button><button class="btn" data-act="brkrand" data-a="${b.id}:3" data-confirm="Pay ${money(b.price[0]*3)}" ${!open||G.player.cash<b.price[0]*3?'disabled':''}>3 slots, ${money(b.price[0]*3)}</button></div>`;
  return { t:b.host, h:`<div class="stack"><div class="title-block"><div class="yr">${esc(b.host)} · runs ${fmtDate(b.day,true)}</div><h1>${esc(prodName(prod))}</h1><div class="sub">${b.boxes} ${FMT_NAME[b.fmt].toLowerCase()}${b.boxes>1?'es':''}, ${b.mode==='pyt'?'pick your team':'random team'}. ${f.g&&f.g.auto?'Each box guarantees '+f.g.auto+' autograph'+(f.g.auto>1?'s':'')+'. ':''}${f.g&&f.g.num?'Numbered cards guaranteed. ':''}</div></div>
    <dl class="kv"><dt>Spots sold</dt><dd>${breakFilled(b)} of ${b.spots.length}${breakFilled(b)<Math.ceil(b.spots.length*0.5)?' (needs '+Math.ceil(b.spots.length*0.5)+' to run)':''}</dd><dt>Total spot value</dt><dd>${bMoney(b)}</dd><dt>Box cost</dt><dd>${money(f.price*b.boxes)}</dd><dt>Your spots</dt><dd>${mine}</dd></dl>
    <p class="small muted" style="margin:0">If fewer than half of the spots sell, the break is cancelled and everyone is refunded. A host who prices well is rare; a team's worth depends on who is on it and who is in the set.</p>
    ${b.mode==='pyt'?`<div class="chips"><button class="chip ${UI.bsort!=='price'?'on':''}" data-act="bsort" data-a="team">By team</button><button class="chip ${UI.bsort==='price'?'on':''}" data-act="bsort" data-a="price">By price</button></div>`:''}
    <div class="panel"><div class="rows">${rows}</div></div></div>` };
}
function brkResult(id){
  const h=brk().hist.find(x=>x.id===id); if (!h || !h.res) return {t:'Break', h:'<div class="empty">Nothing to show.</div>'}; const r=h.res; const mine=(r.mine||[]).map(C).filter(Boolean).sort((a,b)=>cardValue(b)-cardValue(a));
  return { t:h.host, h:`<div class="stack"><div class="title-block"><div class="yr">${fmtDate(h.day,true)}</div><h1>${esc(prodName(G.products[h.p]))}</h1><div class="sub">${h.boxes} ${FMT_NAME[h.fmt].toLowerCase()}${h.boxes>1?'es':''}, ${r.cards} cards opened${r.kept?', '+r.kept+' from unsold spots kept by the host':''}.</div></div>
    ${h.mine?`<div class="kpis"><div class="kpi"><small>Your teams</small><b style="font-size:15px">${(r.myTeams||[]).map(t=>esc(teamName(t))).join(', ')}</b></div><div class="kpi"><small>Your cards</small><b>${r.mine.length}</b></div><div class="kpi"><small>Paid</small><b>${money(r.paid)}</b></div><div class="kpi"><small>Worth now</small><b class="${r.mineVal>=r.paid?'up':'down'}">${money(r.mineVal,true)}</b></div></div>`:''}
    <div class="panel"><h3>Biggest hits of the break</h3><div class="rows">${r.hits.map(([cid,own,v])=>{ const c=C(cid); if (!c) return ''; return `<button class="row" data-act="card" data-a="${cid}">${miniCard(c)}<div class="rt"><b>${esc(cardName(c))}</b><span>${esc(D(c.k).prod.yr+' '+B(D(c.k).prod).short+' '+D(c.k).title)}${serialTxt(c)?' '+serialTxt(c):''}</span><span class="${own===0?'up':''}">${own===0?'Yours':esc((NPC(own)||{h:'a collector'}).h)}</span></div><div class="rv"><b>${money(v,true)}</b></div></button>`; }).join('')}</div></div>
    ${mine.length?`<div class="panel"><h3>Your cards</h3><div class="grid">${mine.slice(0,18).map(c=>gcell(c)).join('')}</div>${mine.length>18?`<p class="small muted">And ${mine.length-18} more, in Collection marked New.</p>`:''}</div>`:''}</div>` };
}
function repSheet(id){
  const rp=brk().rep[id]; const y=rp.you;
  return { t:rp.n, h:`<div class="stack"><div class="title-block"><div class="yr">${esc(rp.who)}'s shop</div><h1>${esc(rp.n)}</h1><div class="sub">${esc(rp.claim)}</div></div>
    <dl class="kv"><dt>Verified buyers</dt><dd>about ${rp.ver}% of the price back, over ${rp.sold} boxes</dd><dt>Their promise</dt><dd>${{num:'A numbered card in every box',auto:'An autograph in every box',old:'Older sets only'}[rp.promise]}</dd>${y.n?`<dt>Your boxes</dt><dd>${y.n} bought, ${money(y.paid)} spent, cards worth about ${money(y.got,true)} (${Math.round(y.got/Math.max(1,y.paid)*100)}%)</dd>`:''}</dl>
    <p class="small muted" style="margin:0">The claim is what the seller says. The verified figure is what buyers who sent proof got back. A promise can be kept in a cheap way.</p>
    <div class="panel"><div class="rows">${rp.tiers.map((t,i)=>`<div class="row" style="cursor:default"><div class="rt"><b>${money(t.price)} box</b><span>${t.n} cards · ${t.stock} left this week</span></div><button class="btn sm pri" data-act="repbuy" data-a="${rp.id}:${i}" data-confirm="Pay ${money(t.price)}" ${t.stock<=0||G.player.cash<t.price?'disabled':''}>Buy</button></div>`).join('')}</div></div></div>` };
}
ACT.brk = a=>{ UI.bsort='team'; openSheet(()=>brkSheet(+a)); };
ACT.bsort = a=>{ UI.bsort=a; refreshSheet(); };
ACT.brkres = a=>openSheet(()=>brkResult(+a));
ACT.brkbuy = (a,el)=>{ if (!armed(el)) return; const [id,i]=a.split(':').map(Number); const e=joinBreak(id,i); if (e){ showToast(e); return; } showToast('You have the '+teamName(i)+' spot.', true); refreshSheet(); render(true); queueSave(); };
ACT.brkrand = (a,el)=>{ if (!armed(el)) return; const [id,q]=a.split(':').map(Number); const e=joinRandom(id,q); if (e) showToast(e); else showToast(q+' slot'+(q>1?'s':'')+' bought.', true); refreshSheet(); render(true); queueSave(); };
ACT.rep = a=>openSheet(()=>repSheet(+a));
ACT.repbuy = (a,el)=>{ if (!armed(el)) return; const [rid,ti]=a.split(':').map(Number); const e=buyRepack(rid,ti); if (e){ showToast(e); return; } closeSheet(true); render(true); startOpener(); queueSave(); };
// tabs: Breaks lives next to the card shop
(function(){
  const sv=VIEWS.shop; VIEWS.shop=()=>{ let h=sv(); const on=UI.sub.shop==='breaks'; const btn=/<button class="(?:on)?" data-act="tab" data-a="shop">Card shop<\/button>/;
    h=h.replace(btn, `<button class="${on?'':'on'}" data-act="goto" data-a="shop:main">Card shop</button><button class="${on?'on':''}" data-act="goto" data-a="shop:breaks">Breaks &amp; repacks</button>`);
    if (on){ const i=h.indexOf('<div class="subtabs">'); const j=h.indexOf('</div>',i)+6; return h.slice(0,j)+breaksView(); } return h; };
  const bv=VIEWS.ball; VIEWS.ball=()=>bv().replace(/<button class="(?:on)?" data-act="tab" data-a="shop">Card shop<\/button>/, `<button class="" data-act="goto" data-a="shop:main">Card shop</button><button class="" data-act="goto" data-a="shop:breaks">Breaks &amp; repacks</button>`);
})();
// the daily tick, the schedule, and results after time passes
advanceDay = (function(f){ return function(){ f.apply(this, arguments); try { breakDay(G.day); } catch(e){ console.error(e); } }; })(advanceDay);
(function(){ const adv=ACT.adv; ACT.adv=async a=>{ await adv(a); try { const H=G.brk; if (H && H.pend.length && !UI.busy){ const id=H.pend.shift(); openSheet(()=>brkResult(id)); } } catch(e){ console.error(e); } }; })();
upNext = (function(f){ return function(){ const out=f(); if (G.brk){ for (const b of G.brk.list) if (b.st==='open' && breakMine(b).length) out.push({d:b.day, txt:'Your break runs: '+b.host, act:'brk', a:b.id, kind:'breaks'}); else if (b.st==='open' && b.day-G.day<=2) out.push({d:b.day, txt:'Break: '+b.host+' ('+breakFilled(b)+'/'+b.spots.length+' sold)', act:'brk', a:b.id, kind:'breaks'}); out.sort((a,b)=>a.d-b.d); } return out; }; })(upNext);
UK.breaks=['Break','#e67e22'];

// ===================== STARTING SCENARIOS =====================
// Each one changes the opening hand and the weekly allowance, not the world. Same simulation, different first decisions.
const SCENARIOS = [
  {id:'classic', n:'A fresh start', d:'$75 and $50 every Friday. Rip a pack, dig a dollar bin, see what grabs you.', cash:75, pay:50},
  {id:'pocket', n:'Pocket change', d:'$20 and $15 a week. Every dollar is a decision. A hard, honest start.', cash:20, pay:15},
  {id:'inherit', n:"Uncle Ray's comics", d:'You inherited a few hundred old comics and $150. Most are ordinary. You will not know which until you look.', cash:150, pay:40},
  {id:'storage', n:'The storage unit', d:'A semi-retired dealer\'s leftover stock, $1,200, and no allowance. Sell to eat.', cash:1200, pay:0},
  {id:'fan', n:'Diehard fan', d:'A shoebox of one team\'s cards from childhood, $200, and $40 a week. You already know who your guys are.', cash:200, pay:40},
  {id:'reader', n:'Pull-list reader', d:'You have read one series since issue #1, and you have every issue. $200 and $40 a week.', cash:200, pay:40},
  {id:'tcgbinder', n:'First Bond preorder', d:'Twelve First Bond packs, already paid for, arriving on launch day next week. $100 and $40 a week.', cash:100, pay:40},
  {id:'tcgbox', n:'A First Bond box', d:'Two First Bond boxes, already paid for, arriving on launch day next week, and $50. Open them, or hold them and see what happens. $40 a week.', cash:50, pay:40},
  {id:'tmbinder', n:'Tenth Tide preorder', d:'Twelve Tenth Tide packs, already paid for, arriving on release day in a few weeks. $100 and $40 a week.', cash:100, pay:40},
  {id:'tmbox', n:'A Tenth Tide box', d:'Two Tenth Tide boxes, already paid for, arriving on release day in a few weeks, and $50. Open them, or hold them and see what happens. $40 a week.', cash:50, pay:40},
  {id:'windfall', n:'Deep pockets', d:'$10,000 and no allowance. Nothing forces you. See how the market treats a whale.', cash:10000, pay:0}
];
function pickScenario(){
  return new Promise(res=>{
    let el=$('#scn'); if (el) el.remove(); el=document.createElement('div'); el.id='scn'; el.className='scn'; el.setAttribute('role','dialog'); el.setAttribute('aria-label','Choose how you start');
    el.innerHTML=`<div class="scn-in"><h1>How does your story begin?</h1><p>Every start plays the same world. What changes is what you have on day one.</p><div class="scn-list">${SCENARIOS.map(s=>`<button class="scn-card" data-act="scnpick" data-a="${s.id}"><b>${esc(s.n)}</b><span>${esc(s.d)}</span><em>${money(s.cash)} to start${s.pay? ', '+money(s.pay)+' a week' : ', no allowance'}</em></button>`).join('')}</div></div>`;
    document.body.appendChild(el); UI._scnRes=res;
  });
}
ACT.scnpick = a=>{ const el=$('#scn'); if (el) el.remove(); const r=UI._scnRes; UI._scnRes=null; if (r) r(a); };
newGame = (function(f){ return async function(seed, prog){ const g=await f(seed, prog); try { applyScenario(UI.scn||'classic'); } catch(e){ console.error(e); } UI.scn=null; return g; }; })(newGame);
function scnCard(key, how, from, note){ const d=D(key); const c=makeCard(key,0,[G.day,how,0,from]); c.h=[[G.day,note||'Came with the start',0,'']]; c.c=c.c.map(v=>Math.max(15,v-ri(0,14))); c.nw=1; c.sc=1; return c; }
function scnComic(key, how, from, note, src){ const c=cmMakeCopy(key,0,[G.day,how,0,from],src||'lot'); c.h=[[G.day,note,0,'']]; c.nw=1; c.sc=1; return c; }
function applyScenario(id){
  G._scnId=id; const sc=SCENARIOS.find(x=>x.id===id)||SCENARIOS[0]; const P_=G.player; P_.cash=sc.cash; P_.pay=sc.pay; P_.scn=sc.id; P_.scnN=sc.n;
  if (sc.id==='inherit'){ for (let i=0;i<ri(220,300);i++){ const key=randComicKey(R()<0.7?{old:1}:{}); const c=scnComic(key,'inherited','Uncle Ray','Inherited from Uncle Ray'); c.c=c.c.map(v=>Math.max(5,v-ri(0,10))); } }
  else if (sc.id==='storage'){ if (packHas('sports')) for (let i=0;i<ri(50,70);i++) scnCard(randCardKey({old:R()<0.5,hit:R()<0.1}),'found','the storage unit','Came out of the storage unit'); if (packHas('comics')) for (let i=0;i<ri(180,230);i++) scnComic(randComicKey(R()<0.5?{}:{old:1}),'found','the storage unit','Came out of the storage unit'); if (packHas('sports')) for (let i=0;i<4;i++){ const prod=pick(releasedProducts()); makeSealed(prod.id, fmtOf(prod,R()<0.5?'blaster':'hobby'), 0, [G.day,'found',0,'the storage unit']); } }
  else if (sc.id==='fan'){
    const tm=ri(0,TEAMS_DEF.length-1); const pids=new Set(G.players.filter(p=>p.tm===tm||(p.tm===-1&&p.org===tm)).map(p=>p.id)); const prods=releasedProducts().slice(-5); const keys=[];
    for (const prod of prods){ prod.cl.base.forEach((e,i)=>{ if (pids.has(e[0])) keys.push(dk(prod,'b',i,'')); }); }
    shuffleWith(keys, hsh('fan'+G.seed)).slice(0,45).forEach(k=>scnCard(k,'found','your childhood','Your team, from a shoebox'));
    P_.scnN='Diehard fan of the '+teamName(tm); const top=G.players.filter(p=>pids.has(p.id)).sort((a,b)=>playerBase(b)-playerBase(a)).slice(0,2);
    for (const p of top){ if (!P_.follow.includes(p.id)) P_.follow.push(p.id); } if (top[0]) startChase('pc', top[0].id);
  }
  else if (sc.id==='reader'){
    let pool=G.cm.ser.filter(s=>s.sts==='on' && s.n>=25 && s.n<=110 && tierOf(s)>=1); if (!pool.length) pool=G.cm.ser.filter(s=>s.sts==='on' && s.n>=12); const s=pool[Math.floor(R()*pool.length)];
    for (let n=1;n<=s.n;n++){ if (R()<0.92){ const d=cmD(mk(s.id,n,1,'')); const c=cmMakeCopy(mk(s.id,n,1,''),0,[issueDay(s,n),'bought',d.cp,'Your pull list'],'npc'); c.c=c.c.map(v=>Math.min(100,v+ri(2,10))); c.h=[[issueDay(s,n),'Bought new off the rack',d.cp,'']]; c.nw=1; c.sc=1; } }
    P_.pull=[s.id]; toggleFollow('s',s.id); startChase('run',s.id); P_.scnN='Pull-list reader of '+sTitle(s);
  }
  G.player.nw=[]; if (typeof snapNW==='function') snapNW(true);
  addNews((sc.id==='classic'?'A NEW COLLECTOR ARRIVES':'YOUR STORY STARTS: '+P_.scnN.toUpperCase()), sc.d, null, 'hobby');
}

// ===================== YOUR YEAR IN COLLECTING =====================
// Built from what already exists: provenance, sale history, what you looked at and passed on, grading returns, chases.
function netWorthNow(){ let v=0; for (const c of myCards()) v+=cardValue(c); if (G.cm) for (const c of myComics()) v+=cmCopyValue(c); for (const s of mySealed()) v+=sealedFair(G.products[s.p],s.f); for (const L of CARD_LINES) if (L.has()) for (const c of L.mine()) v+=L.value(c); return Math.round(v*100)/100; }   // everything owned except cash (Wildkin cards and sealed product included)
function snapNW(force){ const P_=G.player; const L=P_.nw=P_.nw||[]; if (!force && L.length && G.day-L[L.length-1][0]<7) return; L.push([G.day, Math.round(P_.cash*100)/100, netWorthNow(), Math.round(P_.bought), Math.round(P_.sold), Math.round(P_.fees), P_.packs||0, P_.paid||0]); if (L.length>420) L.shift(); }
function noteSeen(kind, id, price, where){ const P_=G.player; const S=P_.seen=P_.seen||{}; const k=kind+':'+id; if (S[k]) return; S[k]=[G.day, Math.round(price*100)/100, where]; const ks=Object.keys(S); if (ks.length>320){ ks.sort((a,b)=>S[a][0]-S[b][0]); for (let i=0;i<40;i++) delete S[ks[i]]; } }
function objValue(k, o){ return cardLineOfKind(k)? cardLineOfKind(k).value(o) : k==='m'? cmCopyValue(o) : cardValue(o); }
function objLabel(k, o){ return cardLineOfKind(k)? cardLineOfKind(k).label(o) : k==='m'? cmItemLabel(o) : cardName(o)+' '+D(o.k).prod.yr+' '+D(o.k).title+(o.g>0?' (GCS '+o.g+')':''); }
function jPeriod(y){ const t0=Math.max(G.player.start, dateToDay(y,1,1)); const t1=y>=yearOf(G.day)? G.day : dateToDay(y,12,31); return [t0,t1]; }
function jRef(k, o, extra){ return Object.assign({k, id:o.id, label:objLabel(k,o)}, extra||{}); }
function buildYear(y){
  const [t0,t1]=jPeriod(y); const P_=G.player; const snaps=(P_.nw||[]).filter(s=>s[0]<=t1); const inP=snaps.filter(s=>s[0]>=t0);
  const s0 = snaps.filter(s=>s[0]<=t0).pop() || inP[0] || snaps[0]; const s1 = inP[inP.length-1] || snaps[snaps.length-1];
  const kinds=[['c',Object.values(G.cards)], ['m', G.cm? Object.values(G.mc):[]], ...CARD_LINES.map(L=>[L.kind, L.has()? Object.values(L.copies()):[]])];
  const acq=[], sold=[], pulls=[]; let nCards=0, nComics=0;
  for (const [k,arr] of kinds) for (const o of arr){
    if (o.pv && !o.sc && o.pv.d>=t0 && o.pv.d<=t1){ if (k==='c'||isCardGameKind(k)) nCards++; else nComics++; const paid=(o.a&&o.a[2])||0; const soldH=(o.h||[]).filter(h=>typeof h[1]==='string' && h[1].startsWith('Sold') && h[0]>=o.pv.d).pop();
      if (o.o===0){ const now=objValue(k,o); acq.push({k, o, paid, now, gain:now-paid, sold:false}); } else if (soldH){ acq.push({k, o, paid, now:soldH[2], gain:soldH[2]-paid, sold:true}); }
      if ((k==='c'||isCardGameKind(k)) && o.a && o.a[1]==='pulled') pulls.push({k, o, now:objValue(k,o)}); }
    if (o.h) for (const h of o.h) if (h[0]>=t0 && h[0]<=t1 && typeof h[1]==='string' && h[1].startsWith('Sold') && h[2]>0 && o.o!==0){ sold.push({k, o, price:h[2], now:objValue(k,o), t:h[0]}); }
  }
  const pick1=(arr,f)=>arr.slice().sort((a,b)=>f(b)-f(a))[0];
  const bf=pick1(acq.filter(x=>x.gain>=3), x=>x.gain); const flip=pick1(acq.filter(x=>x.sold && x.gain>=3), x=>x.gain);
  const regret=pick1(sold.filter(x=>x.now>=x.price*1.35 && x.now-x.price>=8), x=>x.now-x.price);
  const seen=P_.seen||{}; const away=[]; for (const key in seen){ const [k,id]=[key[0], +key.slice(2)]; const o=objFor(k,id); if (!o || o.o===0 || o.pv) continue; const s=seen[key]; if (s[0]<t0||s[0]>t1||t1-s[0]<10) continue; const now=objValue(k,o); if (now>=s[1]*1.4 && now-s[1]>=8) away.push({k, o, ask:s[1], now, where:s[2], d:s[0]}); }
  away.sort((a,b)=>(b.now-b.ask)-(a.now-a.ask));
  const pull=pick1(pulls, x=>x.now);
  const gl=(P_.gl||[]).filter(x=>x.t>=t0 && x.t<=t1); const bestG=gl.slice().sort((a,b)=>(b.k==='m'?b.g/10:b.g)-(a.k==='m'?a.g/10:a.g))[0];
  const ev=(P_.evlog||[]).filter(e=>e.d>=t0 && e.d<=t1); const brks=(G.brk?G.brk.hist:[]).filter(h=>h.day>=t0 && h.day<=t1 && h.mine && h.res);
  const done=chases().filter(c=>c.done && c.done>=t0 && c.done<=t1);
  const out={ y, t0, t1, days:t1-t0+1, start:s0?Math.round(s0[1]+s0[2]):0, end:s1?Math.round(s1[1]+s1[2]):0, endCash:s1?Math.round(s1[1]):0, endColl:s1?Math.round(s1[2]):0, paid:s1&&s0? s1[7]-s0[7]:0, bought:s1&&s0? s1[3]-s0[3]:0, soldT:s1&&s0? s1[4]-s0[4]:0, fees:s1&&s0? s1[5]-s0[5]:0, packs:s1&&s0? s1[6]-s0[6]:0,
    pts:inP.map(s=>[s[0], Math.round(s[1]+s[2])]), nCards, nComics, best:bf&&jRef(bf.k,bf.o,{paid:bf.paid, now:bf.now, sold:bf.sold}), flip:flip&&jRef(flip.k,flip.o,{paid:flip.paid, now:flip.now}),
    regret:regret&&jRef(regret.k,regret.o,{price:regret.price, now:regret.now}), away:away.slice(0,3).map(x=>jRef(x.k,x.o,{ask:x.ask, now:x.now, where:x.where})), pull:pull&&jRef(pull.k,pull.o,{now:pull.now}),
    grade:bestG&&{k:bestG.k, id:bestG.id, g:bestG.g}, nGraded:gl.length, events:ev.length, evNames:[...new Set(ev.map(e=>e.n))].slice(0,3), breaks:brks.map(h=>({host:h.host, cards:h.res.mine.length, paid:h.res.paid, val:h.res.mineVal})), chasesDone:done.map(c=>chaseName(c)),
    chases:chases().filter(c=>c.k!=='grail').slice(0,6).map(c=>{ const p=chaseProgress(c); return {name:chaseName(c), have:p.have, total:p.total}; }), grails:chases().filter(c=>c.k==='grail').map(c=>({name:chaseName(c), months:Math.max(1,Math.round((t1-c.since)/30)), found:ownedKeys().has(c.ref)})) };
  const st=[]; const L=x=>x.label;
  if (out.best && out.best.paid+3<out.best.now) st.push(`Best find: ${L(out.best)}. You ${out.best.sold?'sold it for':'have it, worth'} ${money(out.best.now,true)}; it cost ${money(out.best.paid,true)}.`);
  if (out.regret) st.push(`The one you sold too soon: ${L(out.regret)}. You took ${money(out.regret.price,true)}; it's about ${money(out.regret.now,true)} now.`);
  if (out.away.length) st.push(`You passed on ${L(out.away[0])} at ${money(out.away[0].ask,true)}. It's about ${money(out.away[0].now,true)} now.`);
  if (out.pull && out.pull.now>=15) st.push(`Best pull: ${L(out.pull)}, about ${money(out.pull.now,true)}.`);
  if (!st.length) st.push(out.nCards+out.nComics? 'A quiet stretch of collecting. Nothing dramatic yet, and that is how most great collections begin.' : (out.endColl>=50? `A quiet year of buying. Your collection, worth about ${money(out.endColl)}, kept moving with the market all the same.` : 'You barely collected. The market kept moving without you.'));
  out.story=st; return out;
}
function yrs(){ return G.player.yr||(G.player.yr={}); }
function makeYearReview(y){ const r=buildYear(y); yrs()[y]=r; G.player.yrNew=y; return r; }
// what changes the numbers: weekly snapshots, chase completion, events attended, first look at things
advanceDay = (function(f){ return function(){ f.apply(this, arguments); try { const t=G.day; if (G.player && G.player.start){ { const GL=G.player.gl=G.player.gl||[]; for (const r of (G.player.rv||[])) if (!GL.some(x=>x.k===r.k&&x.id===r.id&&x.t===r.t)) GL.push({k:r.k,id:r.id,g:r.g,t:r.t}); if (GL.length>120) GL.splice(0,GL.length-120); }
  if (dowOf(t)===1 || !(G.player.nw&&G.player.nw.length)) snapNW(); if (dowOf(t)===1) for (const c of chases()){ if (!c.done && c.k!=='grail'){ const p=chaseProgress(c); if (p.total && p.have>=p.total){ c.done=t; toast('Chase complete: '+chaseName(c), true); } } }
  const md=mdOf(t); if (md[0]===1 && md[1]===1 && t-G.player.start>=45){ const y=yearOf(t)-1; if (!yrs()[y]) makeYearReview(y); } } } catch(e){ console.error(e); } }; })(advanceDay);
ACT.listing = (function(f){ return function(a){ try { const l=L(+a); if (l && l.sel!==0 && (l.it==='c'||l.it==='m'||isCardGameKind(l.it))) noteSeen(l.it, l.ref, l.ty==='auc'?l.cur:l.pr, 'the marketplace'); } catch(e){} return f(a); }; })(ACT.listing);
ACT.hitem = (function(f){ return function(a){ try { const [s,t,id]=hsplit(a); const e=entryById(s,t,id); if (e && t!=='s') noteSeen(t,id,e.p,whereName(s)); } catch(e){} return f(a); }; })(ACT.hitem);
ACT.cshopcopy = (function(f){ return function(a){ try { const [id,from]=a.split(':'); const cp=MC(+id); if (cp && cp.o===SHOP_ID){ const pr=from==='bin'?1:((G.cm.shop.back.find(x=>x[0]===+id)||[0,0])[1]); noteSeen('m',+id,pr,SHOP_NAME); } } catch(e){} return f(a); }; })(ACT.cshopcopy);
enterEvent = (function(f){ return function(evId, late){ const r=f(evId, late); if (r===null){ const ev=G.hunt.ev.find(x=>x.id===evId); const L_=G.player.evlog=G.player.evlog||[]; if (ev && !L_.some(e=>e.d===G.day && e.id===evId)){ L_.push({d:G.day, id:evId, n:ev.n}); if (L_.length>200) L_.shift(); } } return r; }; })(enterEvent);
// ---------- UI ----------
function jRow(x){ const o=objFor(x.k,x.id); const thumb=o? (x.k==='m'?miniComic(o):cardLineOfKind(x.k)?cardLineOfKind(x.k).mini(o):miniCard(o)) : '<div class="mini"></div>'; const act=copyAct(x.k); return `<button class="row" ${o?`data-act="${act}" data-a="${x.id}"`:'style="cursor:default"'}>${thumb}<div class="rt"><b>${esc(x.label)}</b>${x.paid!=null&&x.now!=null?`<span>Cost ${money(x.paid,true)}, ${x.sold?'sold for':'worth'} ${money(x.now,true)}</span>`:x.price!=null?`<span>You sold it for ${money(x.price,true)}; about ${money(x.now,true)} now</span>`:x.ask!=null?`<span>Seen ${x.where?'at '+esc(x.where)+' ':''}for ${money(x.ask,true)}; about ${money(x.now,true)} now</span>`:x.now!=null?`<span>About ${money(x.now,true)}</span>`:''}</div></button>`; }
function yearSheetHTML(r, live){
  const net=r.end-r.start-r.paid; const bits=[];
  return `<div class="stack"><div class="title-block"><div class="yr">${live?'So far this year':'The year in review'}</div><h1>${r.y}</h1><div class="sub">${fmtDate(r.t0,true)} to ${fmtDate(r.t1,true)}</div></div>
    <div class="panel yrstory">${r.story.map(s=>`<p>${esc(s)}</p>`).join('')}</div>
    <p class="small muted" style="margin:0 0 6px">Net worth is cash plus the estimated value of everything you own${r.endColl!=null?`: at the end, ${money(r.endCash)} cash and about ${money(r.endColl)} in cards and sealed product`:""}. Estimates, not what a quick sale would bring.</p><div class="kpis"><div class="kpi"><small>Net worth, start</small><b>${money(r.start)}</b></div><div class="kpi"><small>Net worth, end</small><b>${money(r.end)}</b></div><div class="kpi"><small>Beyond paydays</small><b class="${net>=0?'up':'down'}">${net>=0?'+':'−'}${money(Math.abs(net))}</b></div><div class="kpi"><small>Spent / sold</small><b style="font-size:15px">${money(r.bought)} / ${money(r.soldT)}</b></div></div>
    ${r.pts.length>=3?`<div class="panel"><h3>Cash plus collection</h3>${sparkSVG(r.pts,{h:100,axis:true})}</div>`:''}
    ${r.best||r.flip||r.regret?`<div class="panel"><h3>The big moments</h3><div class="rows">${r.best?`<div class="small muted" style="padding:6px 0 2px">Best find</div>${jRow(r.best)}`:''}${r.flip&&(!r.best||r.flip.id!==r.best.id)?`<div class="small muted" style="padding:6px 0 2px">Best flip</div>${jRow(r.flip)}`:''}${r.regret?`<div class="small muted" style="padding:6px 0 2px">Sold too soon</div>${jRow(r.regret)}`:''}${r.pull&&r.pull.now>=15?`<div class="small muted" style="padding:6px 0 2px">Best pull</div>${jRow(r.pull)}`:''}</div></div>`:''}
    ${r.away.length?`<div class="panel"><h3>The ones that got away</h3><p class="small muted" style="margin:0 0 6px">You looked, you passed. Here is what they're worth now.</p><div class="rows">${r.away.map(jRow).join('')}</div></div>`:''}
    <div class="panel"><h3>The year in numbers</h3><dl class="kv"><dt>Cards acquired</dt><dd>${r.nCards}</dd>${G.cm?`<dt>Comics acquired</dt><dd>${r.nComics}</dd>`:''}<dt>Packs opened</dt><dd>${r.packs}</dd><dt>Graded</dt><dd>${r.nGraded}${r.grade?`, best: ${rvGradeTxt(r.grade.k,r.grade.g)}`:''}</dd><dt>Events attended</dt><dd>${r.events}${r.evNames.length?' ('+esc(r.evNames.join(', '))+')':''}</dd>${r.breaks.length?`<dt>Group breaks</dt><dd>${r.breaks.length}: ${money(r.breaks.reduce((s,b)=>s+b.paid,0))} in, cards worth ${money(r.breaks.reduce((s,b)=>s+b.val,0),true)}</dd>`:''}<dt>Fees paid</dt><dd>${money(r.fees)}</dd></dl></div>
    ${r.chasesDone.length||r.chases.length||r.grails.length?`<div class="panel"><h3>Chases</h3>${r.chasesDone.length?`<p class="small up" style="margin:0 0 6px">Completed: ${esc(r.chasesDone.join(', '))}</p>`:''}${r.chases.map(c=>`<p class="small" style="margin:0 0 4px">${esc(c.name)}: ${c.have} of ${c.total}</p>`).join('')}${r.grails.map(g=>`<p class="small" style="margin:0 0 4px">★ ${esc(g.name)}: ${g.found?'found':'still hunting after '+g.months+' months'}</p>`).join('')}</div>`:''}</div>`;
}
function yearSheet(y){ const live = y==='now'; const r = live? buildYear(yearOf(G.day)) : yrs()[y]; if (!r) return {t:'Year', h:'<div class="empty">No review for that year.</div>'}; return { t:r.y+(live?' so far':' in review'), h:yearSheetHTML(r, live) }; }
ACT.year = a=>openSheet(()=>yearSheet(a==='now'?'now':+a));
function goneList(){ const seen=G.player.seen||{}; const out=[]; for (const key in seen){ const k=key[0], id=+key.slice(2); const o=objFor(k,id); if (!o || o.o===0 || o.pv) continue; const s=seen[key]; if (G.day-s[0]<10) continue; const now=objValue(k,o); if (now>=s[1]*1.4 && now-s[1]>=8) out.push(jRef(k,o,{ask:s[1], now, where:s[2]})); } return out.sort((a,b)=>(b.now-b.ask)-(a.now-a.ask)).slice(0,8); }
function journalView(){
  const ys=Object.keys(yrs()).sort((a,b)=>b-a); const g=goneList(); const cur=yearOf(G.day);
  return `${tip('journal', `Your journal keeps score without keeping you honest for free: what you found, what you passed on, what you sold too soon. Every January it writes up the year that just ended.`)}
  <div class="cols"><div class="stack"><div class="panel"><h3>${cur} so far</h3><p class="small muted" style="margin:0 0 8px">${esc(G.player.scnN||'Your collecting story')}. Started ${fmtDate(G.player.start,true)}.</p><button class="btn pri" data-act="year" data-a="now">Read the year so far</button></div>
    ${ys.length?`<div class="panel"><h3>Past years</h3><div class="rows">${ys.map(y=>`<button class="row" data-act="year" data-a="${y}"><div class="rt"><b>${y} in review</b><span>${money(yrs()[y].start)} to ${money(yrs()[y].end)}</span></div></button>`).join('')}</div></div>`:'<div class="panel"><div class="empty">The first review is written on January 1st.</div></div>'}</div>
  <div class="panel"><h3>The ones that got away</h3><p class="small muted" style="margin:0 0 6px">Things you looked at and passed on that have since gone up.</p><div class="rows">${g.map(jRow).join('')||'<div class="empty">Nothing yet. Give it time.</div>'}</div></div></div>`;
}
(function(){ const cv=VIEWS.coll; VIEWS.coll=()=>{ const jr=UI.sub.coll==='journal'; let h;
  if (jr){ const save=UI.sub.coll; UI.sub.coll='runs'; h=cv(); UI.sub.coll=save; h=h.replace(/<button class="on" data-act="sub" data-a="coll:runs">/, '<button class="" data-act="sub" data-a="coll:runs">'); } else h=cv();
  h=h.replace(/(<button class="(?:on)?" data-act="sub" data-a="coll:chases">Chases<\/button>)/, `$1<button class="${jr?'on':''}" data-act="sub" data-a="coll:journal">Journal</button>`);
  if (jr){ const i=h.indexOf('<div class="subtabs">'); const j=h.indexOf('</div>',i)+6; return h.slice(0,j)+journalView(); } return h; }; })();
// a new review opens after time passes
(function(){ const adv=ACT.adv; ACT.adv=async a=>{ await adv(a); try { const y=G.player.yrNew; if (y && !UI.busy){ G.player.yrNew=null; setTimeout(()=>openSheet(()=>yearSheet(y)), 200); } } catch(e){ console.error(e); } }; })();
// Home: a quiet link once there is something to read
(function(){ const hv=VIEWS.home; VIEWS.home=()=>{ const h=hv(); const ys=Object.keys(yrs()).sort((a,b)=>b-a); if (!ys.length || G.day-dateToDay(+ys[0]+1,1,1)>45) return h; const i=h.indexOf('<div class="kpis">'); const b=`<div class="note" style="display:flex;align-items:center;gap:10px;margin-bottom:12px"><b style="flex:1">Your ${ys[0]} in review is ready</b><button class="btn sm pri" data-act="year" data-a="${ys[0]}">Read it</button></div>`; return i<0? b+h : h.slice(0,i)+b+h.slice(i); }; })();

// ===================== POLISH: make close-up views look printed, not drawn =====================
// These effects are expensive, so they only run where you look closely: inspection, detail sheets, the grading reveal.
// Thumbnails, grids and sleeves keep the light versions.
let FXN=0; const HIC=new Map();
function fxId(){ return 'fx'+(FXN++).toString(36); }
function vbOf(svg){ const m=/viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg); return m? [+m[1], +m[2]] : [250,350]; }
function noiseFilter(id, freq, oct, seed, gray){ return `<filter id="${id}" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="${oct}" seed="${seed}"/><feColorMatrix type="saturate" values="0"/>${gray||''}</filter>`; }
function inject(svg, defs, layers){ const i=svg.lastIndexOf('</svg>'); return svg.slice(0,i)+`<defs>${defs}</defs>${layers}</svg>`; }
// ---- cards ----
function polishCard(svg, opt){
  const flat=!!(opt&&opt.flat); if (!svg || svg.indexOf('cardsvg')<0 || svg.indexOf('data-pol')>=0) return svg;
  const id=fxId(); const [W,H]=vbOf(svg); const fin=(/data-fin="([^"]*)"/.exec(svg)||[])[1]||'gloss';
  const metal=['chrome','refr','foil','super','plate'].includes(fin); const matte=fin==='matte'||fin==='stock'; const prism=fin==='refr'||fin==='super'||fin==='foil';
  const r=mkRng(hsh(svg.length+fin+id)); let flecks='';
  if (prism) for (let i=0;i<46;i++){ const x=r()*W, y=r()*H, s=0.4+r()*1.1; flecks+=`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${s.toFixed(2)}" fill="#fff" opacity="${(0.35+r()*0.5).toFixed(2)}"/>`; }
  const defs=noiseFilter(id+'n','0.85',2,7)+(metal? noiseFilter(id+'b','0.0025 0.6',3,3):'')+`<filter id="${id}s" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="2.2"/></filter>`+
    `<linearGradient id="${id}l" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".42"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".38"/></linearGradient>`+
    `<pattern id="${id}h" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(22)"><circle cx="1.5" cy="1.5" r=".7" fill="#000"/></pattern>`;
  const layers= flat? `<g data-pol="1" style="pointer-events:none">`+(matte? `<rect width="${W}" height="${H}" rx="12" fill="url(#${id}h)" opacity=".07"/>`:'')+`<rect width="${W}" height="${H}" rx="12" filter="url(#${id}n)" opacity="${matte?0.22:0.1}" style="mix-blend-mode:overlay"/></g>` : `<g data-pol="1" style="pointer-events:none">`+
    (matte? `<rect width="${W}" height="${H}" rx="12" fill="url(#${id}h)" opacity=".07"/>`:'')+
    `<rect width="${W}" height="${H}" rx="12" filter="url(#${id}n)" opacity="${matte?0.3:0.17}" style="mix-blend-mode:overlay"/>`+
    (metal? `<rect width="${W}" height="${H}" rx="12" filter="url(#${id}b)" opacity=".38" style="mix-blend-mode:soft-light"/>`:'')+
    (prism? `<g style="mix-blend-mode:screen">${flecks}</g>`:'')+
    `<rect width="${W}" height="${H}" rx="12" fill="url(#${id}l)" style="mix-blend-mode:soft-light"/>`+
    `<rect x="1.5" y="1.5" width="${W-3}" height="${H-3}" rx="10.5" fill="none" stroke="#000" stroke-opacity=".28" stroke-width="3" filter="url(#${id}s)"/>`+
    `<rect x=".6" y=".6" width="${W-1.2}" height="${H-1.2}" rx="11.4" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1"/></g>`;
  return inject(svg, defs, layers);
}
// ---- slabs (the plastic case) ----
function polishSlab(svg){
  if (!svg || svg.indexOf('data-pol')>=0) return svg; const id=fxId(); const [W,H]=vbOf(svg);
  const defs=noiseFilter(id+'n','1.2',1,5)+`<linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".3" stop-color="#fff" stop-opacity=".0"/><stop offset=".42" stop-color="#fff" stop-opacity=".30"/><stop offset=".5" stop-color="#fff" stop-opacity=".06"/><stop offset=".58" stop-color="#fff" stop-opacity=".18"/><stop offset=".7" stop-color="#fff" stop-opacity="0"/></linearGradient>`+
    `<linearGradient id="${id}e" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset=".08" stop-color="#fff" stop-opacity="0"/><stop offset=".92" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></linearGradient>`;
  const layers=`<g data-pol="1" style="pointer-events:none"><rect x="2" y="2" width="${W-4}" height="${H-4}" rx="10" filter="url(#${id}n)" opacity=".1" style="mix-blend-mode:multiply"/><rect x="2" y="2" width="${W-4}" height="${H-4}" rx="10" fill="url(#${id}g)"/><rect x="3" y="3" width="${W-6}" height="${H-6}" rx="9" fill="none" stroke="url(#${id}e)" stroke-width="2"/></g>`;
  return inject(svg, defs, layers);
}
// ---- comics: a printed page, not a vector drawing ----
function polishComic(svg, opt){
  const flat=!!(opt&&opt.flat); if (!svg || svg.indexOf('cmsvg')<0 || svg.indexOf('data-pol')>=0) return svg; const id=fxId(); const [W,H]=vbOf(svg); const yr=+((/data-era="(\d+)"/.exec(svg)||[])[1]||2000); const age=yearOf(G.day)-yr;
  const r=mkRng(hsh(id+svg.length)); let fox=''; if (age>30){ for (let i=0;i<Math.min(40,(age-30)*1.1);i++){ const edge=r()<0.7; const x=edge? (r()<0.5? r()*8 : W-r()*8) : r()*W, y=edge? r()*H : (r()<0.5? r()*8 : H-r()*8); fox+=`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(0.5+r()*1.6).toFixed(1)}" fill="#8a5a20" opacity="${(0.14+r()*0.22).toFixed(2)}"/>`; } }
  const gloss = yr>=1985; const rough = svg.replace('<g clip-path="', `<g filter="url(#${id}r)" clip-path="`);
  const defs=`<filter id="${id}r" x="-2%" y="-2%" width="104%" height="104%"><feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="4" result="t"/><feDisplacementMap in="SourceGraphic" in2="t" scale="1.5" xChannelSelector="R" yChannelSelector="G"/></filter>`+
    noiseFilter(id+'n','0.75',3,2)+noiseFilter(id+'f','0.03 0.9',2,9)+
    `<pattern id="${id}c" width="4.2" height="4.2" patternUnits="userSpaceOnUse" patternTransform="rotate(15)"><circle cx="2.1" cy="2.1" r=".95" fill="#00a6d6"/></pattern><pattern id="${id}m" width="4.2" height="4.2" patternUnits="userSpaceOnUse" patternTransform="rotate(75)"><circle cx="2.1" cy="2.1" r=".95" fill="#e6007e"/></pattern><pattern id="${id}y" width="4.2" height="4.2" patternUnits="userSpaceOnUse" patternTransform="rotate(0)"><circle cx="2.1" cy="2.1" r=".95" fill="#ffe600"/></pattern>`+
    `<linearGradient id="${id}sp" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".5"/><stop offset=".035" stop-color="#000" stop-opacity=".16"/><stop offset=".07" stop-color="#fff" stop-opacity=".12"/><stop offset=".13" stop-color="#000" stop-opacity="0"/></linearGradient>`+
    `<linearGradient id="${id}gl" x1="0" y1="0" x2="1" y2="1"><stop offset=".25" stop-color="#fff" stop-opacity="0"/><stop offset=".4" stop-color="#fff" stop-opacity=".26"/><stop offset=".47" stop-color="#fff" stop-opacity=".04"/><stop offset=".6" stop-color="#fff" stop-opacity=".14"/><stop offset=".72" stop-color="#fff" stop-opacity="0"/></linearGradient>`+
    `<radialGradient id="${id}v" cx=".5" cy=".5" r=".75"><stop offset=".7" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#3a2a10" stop-opacity="${(0.1+Math.min(0.25,Math.max(0,age-20)*0.004)).toFixed(2)}"/></radialGradient>`;
  const layers=`<g data-pol="1" style="pointer-events:none"><g style="mix-blend-mode:multiply" opacity="${yr<2000?0.1:0.06}"><rect width="${W}" height="${H}" fill="url(#${id}c)"/><rect width="${W}" height="${H}" fill="url(#${id}m)"/><rect width="${W}" height="${H}" fill="url(#${id}y)"/></g>`+
    `<rect width="${W}" height="${H}" filter="url(#${id}n)" opacity="${gloss?0.14:0.26}" style="mix-blend-mode:overlay"/><rect width="${W}" height="${H}" filter="url(#${id}f)" opacity=".1" style="mix-blend-mode:multiply"/>`+
    `<rect width="${W}" height="${H}" fill="url(#${id}v)"/>${fox}`+(flat?'':`<rect width="${W}" height="${H}" fill="url(#${id}sp)"/>`)+
    (gloss&&!flat? `<rect width="${W}" height="${H}" fill="url(#${id}gl)"/>` : '')+(flat?'':`<rect x=".5" y=".5" width="${W-1}" height="${H-1}" fill="none" stroke="#000" stroke-opacity=".3"/>`)+`</g>`;
  return inject(rough, defs, layers);
}
function comicCoverHi(key){ let h=HIC.get('m'+key); if (!h){ h=polishComic(comicCover(key)); if (HIC.size>40) HIC.clear(); HIC.set('m'+key,h); } return h; }
// ---- wire it into the close-up views ----
faceSVG = function(kind, o, hi){
  if (kind==='c'){ if (o.g>0){ const s=slabSVG(o); return hi? polishSlab(s) : s; } const f=withCond(cardFront(o.k,o.s), o); return hi? polishCard(f) : f; }
  if (o.g>0){ const s=comicSlab(o); return hi? polishSlab(s) : s; } const f=withCmCond(comicCover(o.k), o); return hi? polishComic(f) : f; };
(function(){
  const io=inspectOpen; inspectOpen=function(kind,id){ const fs=faceSVG; faceSVG=function(k,o){ return fs(k,o,true); }; try { io(kind,id); } finally { faceSVG=fs; } };
  const bc=bigCardHTML; bigCardHTML=function(c,key){ let h=bc(c,key); if (!c) return h; if (c.g>0){ const s=slabSVG(c); if (h.indexOf(s)>=0) return h.replace(s, polishSlab(s)); return h; } const f=withCond(cardFront(c.k,c.s), c); return h.indexOf(f)>=0? h.replace(f, polishCard(f)) : h; };
  const cs=cmCopySheet; cmCopySheet=function(id){ const r=cs(id); const cp=MC(id); if (!r||!cp) return r; if (cp.g>0){ const s=comicSlab(cp); if (r.h.indexOf(s)>=0) r.h=r.h.replace(s, polishSlab(s)); } else { const f=withCmCond(comicCover(cp.k), cp); if (r.h.indexOf(f)>=0) r.h=r.h.replace(f, polishComic(f)); } return r; };
  const ds=designSheet; designSheet=function(key){ const r=ds(key); if (r && key[0]==='M'){ const f=comicCover(key); if (r.h.indexOf(f)>=0) r.h=r.h.replace(f, comicCoverHi(key)); } return r; };
  const ss=seriesSheet; seriesSheet=function(sid){ const r=ss(sid); const s=r&&S_(sid); if (r && s && s.n){ const k=mk(sid,1,1,''); const f=comicCover(k); if (r.h.indexOf(f)>=0) r.h=r.h.replace(f, comicCoverHi(k)); } return r; };
})();
rvRaw = function(k,o){ return k==='m'? polishComic(withCmCond(comicCover(o.k),o)) : polishCard(withCond(cardFront(o.k,o.s),o)); };
rvSlab = function(k,o){ return polishSlab(k==='m'? comicSlab(o) : slabSVG(o)); };

// ===================== 3D INSPECTION VIEWER (level 1) =====================
// The existing art becomes a texture on a real 3D object: thickness, bevelled edges, clear-coat, brushed metal, rainbow foil
// and a light that follows your finger. Loaded on first use; if 3D isn't available the flat viewer stays as it is.
const V3={ url:(typeof PACK!=='undefined'&&PACK.three)||'https://cdn.jsdelivr.net/npm/three@0.159.0/build/three.min.js', p:null, fail:false, st:null, tok:0 };
function v3Load(){
  if (window.THREE) return Promise.resolve(window.THREE); if (V3.p) return V3.p;
  V3.p=new Promise((res,rej)=>{ const s=document.createElement('script'); s.src=V3.url; let done=false; const to=setTimeout(()=>{ if (!done){ done=true; V3.p=null; rej(new Error('timeout')); } }, 9000);
    s.onload=()=>{ if (done) return; done=true; clearTimeout(to); window.THREE? res(window.THREE) : rej(new Error('no three')); }; s.onerror=()=>{ if (done) return; done=true; clearTimeout(to); V3.p=null; rej(new Error('load failed')); }; document.head.appendChild(s); });
  return V3.p;
}
function v3WebGL(){ try { const c=document.createElement('canvas'); return !!(c.getContext('webgl2')||c.getContext('webgl')); } catch(e){ return false; } }
function v3Raster(svg, W){
  return new Promise((res,rej)=>{ const m=/viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg); if (!m) return rej(new Error('no viewBox')); const vw=+m[1], vh=+m[2], H=Math.round(W*vh/vw);
    let s=svg; if (s.indexOf('xmlns=')<0) s=s.replace('<svg ','<svg xmlns="http://www.w3.org/2000/svg" '); s=s.replace('<svg ', `<svg width="${Math.round(vw*4)}" height="${Math.round(vh*4)}" `);
    const img=new Image(); img.onload=()=>{ try { const c=document.createElement('canvas'); c.width=W; c.height=H; const g=c.getContext('2d'); g.drawImage(img,0,0,W,H); const px=g.getImageData(Math.floor(W/2),Math.floor(H/2),1,1).data; const px2=g.getImageData(Math.floor(W/4),Math.floor(H/3),1,1).data; if (px[3]===0 && px2[3]===0) return rej(new Error('blank raster')); res(c); } catch(e){ rej(e); } }; img.onerror=()=>rej(new Error('svg raster failed'));
    img.src='data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(s))); });
}
function v3Art(kind, o){
  if (kind==='c') return o.g>0? slabSVG(o) : polishCard(withCond(cardFront(o.k,o.s),o), {flat:1});
  return o.g>0? comicSlab(o) : polishComic(withCmCond(comicCover(o.k),o), {flat:1});
}
function v3Back(kind, o){
  if (kind==='c' && o.g===0) return cardBack(o.k,o.s);
  if (kind==='c') return `<svg viewBox="0 0 270 430" xmlns="http://www.w3.org/2000/svg"><rect width="270" height="430" rx="12" fill="#cfd6dc"/><rect x="10" y="10" width="250" height="410" rx="8" fill="#e6ebef" stroke="#aeb7bf"/><text x="135" y="225" text-anchor="middle" font-family="Arial Narrow,Arial,sans-serif" font-weight="800" font-size="30" fill="#8a949d" letter-spacing="6">GCS</text></svg>`;
  const d=cmD(o.k), s=d.s; const age=yearOf(G.day)-d.yr; const paper= age>50?'#e3d3a8': age>25?'#ebdfbd':'#f4efe0';
  const pb=s.pub>=0? G.cm.pubs[s.pub]: {sh:'SELF'};
  if (o.g>0) return `<svg viewBox="0 0 230 386" xmlns="http://www.w3.org/2000/svg"><rect width="230" height="386" rx="10" fill="#cfd6dc"/><rect x="8" y="8" width="214" height="370" rx="6" fill="#e6ebef" stroke="#aeb7bf"/><text x="115" y="200" text-anchor="middle" font-family="Arial Narrow,Arial,sans-serif" font-weight="800" font-size="26" fill="#8a949d" letter-spacing="6">GCS</text></svg>`;
  const bars=Array.from({length:26},(_,i)=>`<rect x="${6+i*2.6}" y="6" width="${i%3?1.1:1.9}" height="34" fill="#111"/>`).join('');
  return `<svg viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="300" fill="${paper}"/><rect x="14" y="14" width="172" height="200" fill="none" stroke="#222" stroke-width="1.4"/><text x="100" y="98" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="34" fill="#222">${esc(pb.sh)}</text><text x="100" y="124" text-anchor="middle" font-family="Arial Narrow,Arial,sans-serif" font-size="11" letter-spacing="3" fill="#444">${esc((pb.n||'Independent').toUpperCase().slice(0,26))}</text><text x="100" y="170" text-anchor="middle" font-family="Arial Narrow,Arial,sans-serif" font-size="9" fill="#555">${esc(d.title.slice(0,34))}</text><text x="100" y="186" text-anchor="middle" font-family="Arial Narrow,Arial,sans-serif" font-size="8" fill="#777">Published ${monYr(d.day)}</text><g transform="translate(130 238)"><rect width="62" height="46" fill="#fff" stroke="#222"/><g transform="translate(2 4) scale(.9)">${bars}</g><text x="31" y="44" text-anchor="middle" font-size="6" font-family="Arial,sans-serif">${d.cp<1? Math.round(d.cp*100)+'¢' : '$'+d.cp.toFixed(2)}</text></g></svg>`;
}
function v3Brushed(T){ const c=document.createElement('canvas'); c.width=256; c.height=512; const g=c.getContext('2d'); const r=mkRng(77); for (let y=0;y<512;y++){ const v=Math.floor(120+r()*80); g.fillStyle=`rgb(${v},${v},${v})`; g.fillRect(0,y,256,1); } for (let i=0;i<1400;i++){ const v=Math.floor(r()*255); g.fillStyle=`rgba(${v},${v},${v},.22)`; g.fillRect(r()*256,r()*512,1+r()*50,1); } const t=new T.CanvasTexture(c); t.wrapS=t.wrapT=T.RepeatWrapping; return t; }
function v3Pages(T, vertical, tone){ const c=document.createElement('canvas'); c.width=vertical?256:16; c.height=vertical?16:256; const g=c.getContext('2d'); const r=mkRng(31); const n=256; const base=tone||[244,238,222];
  for (let i=0;i<n;i++){ const k=0.86+r()*0.14; g.fillStyle=`rgb(${Math.round(base[0]*k)},${Math.round(base[1]*k)},${Math.round(base[2]*k)})`; if (vertical) g.fillRect(i,0,1,16); else g.fillRect(0,i,16,1); if (i%2){ g.fillStyle='rgba(90,70,40,.18)'; if (vertical) g.fillRect(i,0,1,16); else g.fillRect(0,i,16,1); } }
  const t=new T.CanvasTexture(c); return t; }
function v3Env(T, renderer){
  const pm=new T.PMREMGenerator(renderer); const sc=new T.Scene(); sc.background=new T.Color(0x14171b);
  const box=(w,h,x,y,z,ry,rx,k,col)=>{ const m=new T.Mesh(new T.PlaneGeometry(w,h), new T.MeshBasicMaterial({color:new T.Color(col||0xffffff).multiplyScalar(k), side:T.DoubleSide})); m.position.set(x,y,z); m.rotation.y=ry||0; m.rotation.x=rx||0; sc.add(m); };
  box(7,2.4,0,4.2,0.5,0,Math.PI/2,7); box(1.6,6,-4.2,0.6,0.8,Math.PI/2,0,6,0xdfe9ff); box(1.6,6,4.2,0.4,0.6,Math.PI/2,0,5.5,0xffe8cf); box(6,1.4,0,-2.8,2.4,0,-Math.PI/3,2); box(5,2,0,1,-4,0,0,1.6,0xaab4c2);
  const tex=pm.fromScene(sc,0.03).texture; pm.dispose(); return tex;
}
function v3RoundShape(T,w,h,r){ const s=new T.Shape(); const x=-w/2, y=-h/2; s.moveTo(x+r,y); s.lineTo(x+w-r,y); s.quadraticCurveTo(x+w,y,x+w,y+r); s.lineTo(x+w,y+h-r); s.quadraticCurveTo(x+w,y+h,x+w-r,y+h); s.lineTo(x+r,y+h); s.quadraticCurveTo(x,y+h,x,y+h-r); s.lineTo(x,y+r); s.quadraticCurveTo(x,y,x+r,y); return s; }
function v3FaceGeo(T,w,h,r){ const g=new T.ShapeGeometry(v3RoundShape(T,w,h,r),10); const p=g.attributes.position, uv=g.attributes.uv; for (let i=0;i<p.count;i++) uv.setXY(i,(p.getX(i)+w/2)/w,(p.getY(i)+h/2)/h); return g; }
function v3Finish(kind, o, svg){
  if (o.g>0) return 'slab'; if (kind==='m'){ return polishYr(o)>=1985? 'glossy' : 'paper'; }
  const f=(/data-fin="([^"]*)"/.exec(svg)||[])[1]||'gloss'; return f;
}
function polishYr(o){ try { return cmD(o.k).yr; } catch(e){ return 2000; } }
function v3Mat(T, fin, tex, brushed, renderer){
  tex.colorSpace=T.SRGBColorSpace; tex.anisotropy=Math.min(8, renderer.capabilities.getMaxAnisotropy()); const base={map:tex, emissiveMap:tex, emissive:new T.Color(0xffffff), emissiveIntensity:0.22};
  switch(fin){
    case 'chrome': case 'plate': return new T.MeshPhysicalMaterial(Object.assign({},base,{metalness:0.45, roughness:0.42, roughnessMap:brushed, clearcoat:0.9, clearcoatRoughness:0.14, anisotropy:0.5, envMapIntensity:1.25, emissiveIntensity:0.18}));
    case 'refr': case 'foil': case 'super': return new T.MeshPhysicalMaterial(Object.assign({},base,{metalness:0.4, roughness:0.3, roughnessMap:brushed, clearcoat:1, clearcoatRoughness:0.08, iridescence:1, iridescenceIOR:1.9, iridescenceThicknessRange:[180,780], envMapIntensity:1.8, emissiveIntensity:0.14}));
    case 'matte': case 'stock': return new T.MeshPhysicalMaterial(Object.assign({},base,{metalness:0, roughness:0.88, sheen:0.4, sheenRoughness:0.6, sheenColor:new T.Color(0xf2e8d2), envMapIntensity:0.45, emissiveIntensity:0.12}));
    case 'paper': return new T.MeshStandardMaterial(Object.assign({},base,{roughness:0.92, metalness:0, envMapIntensity:0.35, emissiveIntensity:0.14}));
    case 'glossy': return new T.MeshPhysicalMaterial(Object.assign({},base,{roughness:0.55, clearcoat:0.55, clearcoatRoughness:0.25, envMapIntensity:0.9, emissiveIntensity:0.16}));
    case 'slab': return new T.MeshPhysicalMaterial(Object.assign({},base,{roughness:0.35, clearcoat:1, clearcoatRoughness:0.05, envMapIntensity:1.0, emissiveIntensity:0.2}));
    default: return new T.MeshPhysicalMaterial(Object.assign({},base,{roughness:0.62, clearcoat:0.3, clearcoatRoughness:0.32, envMapIntensity:0.55, emissiveIntensity:0.1}));
  }
}
function v3Build(T, stage, kind, o, frontCv, backCv){
  const canvas=document.createElement('canvas'); canvas.className='insp3d'; stage.appendChild(canvas);
  const renderer=new T.WebGLRenderer({canvas, antialias:true, alpha:true, powerPreference:'high-performance'}); renderer.setPixelRatio(Math.min(2, window.devicePixelRatio||1)); renderer.toneMapping=T.ACESFilmicToneMapping; renderer.toneMappingExposure=1.05; renderer.setClearColor(0x000000,0);
  const scene=new T.Scene(); const env=v3Env(T, renderer); const camera=new T.PerspectiveCamera(30,1,0.1,50);
  const brushed=v3Brushed(T); const fin=v3Finish(kind,o,(frontCv&&frontCv.svg)||'');
  const H=1.5, W=H*frontCv.width/frontCv.height; const isComic=(kind==='m'&&o.g===0), isSlab=o.g>0; const thick= isSlab?0.1 : isComic?0.05 : 0.022; const rad= isComic?0.0 : isSlab? W*0.05 : W*0.048;
  const front=new T.CanvasTexture(frontCv), back=new T.CanvasTexture(backCv); back.colorSpace=T.SRGBColorSpace;
  const fm=v3Mat(T,fin,front,brushed,renderer); fm.envMap=env; const bm=new T.MeshStandardMaterial({map:back, roughness:0.7, metalness:0, envMapIntensity:0.5}); bm.map.anisotropy=4; bm.envMap=env;
  const pivot=new T.Group(); scene.add(pivot); const root=new T.Group(); pivot.add(root);
  if (isComic){
    const age=yearOf(G.day)-cmD(o.k).yr; const tone= age>55?[228,210,165]: age>30?[236,224,188]:[246,241,226]; const cvw=o.c?o.c[6]:100; if (cvw<70){ tone[0]-=12; tone[1]-=20; tone[2]-=36; }
    const top=v3Pages(T,false,tone), side=v3Pages(T,true,tone); const spine=new T.MeshStandardMaterial({color:0x2a2622, roughness:0.85}); spine.color.setRGB(tone[0]/255*0.55,tone[1]/255*0.5,tone[2]/255*0.42);
    const mats=[new T.MeshStandardMaterial({map:side,roughness:0.95}), spine, new T.MeshStandardMaterial({map:top,roughness:0.95}), new T.MeshStandardMaterial({map:top,roughness:0.95}), new T.MeshStandardMaterial({color:0xeee6d2,roughness:0.9}), new T.MeshStandardMaterial({color:0xeee6d2,roughness:0.9})];
    const body=new T.Mesh(new T.BoxGeometry(W,H,thick-0.004), mats); root.add(body);
    const mk=(mat,zs)=>{ const g=new T.PlaneGeometry(W,H,28,40); const p=g.attributes.position; for (let i=0;i<p.count;i++){ const u=(p.getX(i)+W/2)/W, v=(p.getY(i)+H/2)/H; p.setZ(i, (0.010*Math.sin(Math.PI*u)*Math.sin(Math.PI*v) - 0.005*Math.exp(-u*22))*zs); } g.computeVertexNormals(); return new T.Mesh(g,mat); };
    const f=mk(fm,1); f.position.z=thick/2-0.002+0.001; const b=mk(bm,-1); b.rotation.y=Math.PI; b.position.z=-thick/2+0.002-0.001; root.add(f,b);
  } else {
    const bs=thick*0.14; const shape=v3RoundShape(T,W-bs*2,H-bs*2,Math.max(0.001,rad-bs)); const eg=new T.ExtrudeGeometry(shape,{depth:thick-bs*2,bevelEnabled:true,bevelThickness:bs,bevelSize:bs,bevelSegments:3,curveSegments:10}); eg.translate(0,0,-(thick-bs*2)/2);
    const edgeCol= isSlab? 0xdfe5ea : fin==='chrome'||fin==='refr'||fin==='foil'||fin==='super'? 0xcfd4da : 0xf0eee8;
    const em=new T.MeshPhysicalMaterial({color:edgeCol, roughness:isSlab?0.12:0.5, metalness:(fin==='chrome'||fin==='refr'||fin==='foil'||fin==='super')&&!isSlab?0.5:0, clearcoat:isSlab?1:0.3, envMapIntensity:1.1}); em.envMap=env;
    root.add(new T.Mesh(eg,em));
    const fg=v3FaceGeo(T,W-bs*0.6,H-bs*0.6,Math.max(0.001,rad-bs*0.3)); const fz=thick/2+0.0006; const f=new T.Mesh(fg,fm); f.position.z=fz; const b=new T.Mesh(fg,bm); b.rotation.y=Math.PI; b.position.z=-fz; root.add(f,b);
    if (isSlab){ const gl=new T.Mesh(v3FaceGeo(T,W*0.97,H*0.97,rad), new T.MeshPhysicalMaterial({color:0xffffff, transparent:true, opacity:0.06, roughness:0.03, clearcoat:1, clearcoatRoughness:0.02, envMapIntensity:1.6, depthWrite:false})); gl.material.envMap=env; gl.position.z=fz+0.003; root.add(gl); }
  }
  // a soft shadow behind the object, so it floats
  const sc=document.createElement('canvas'); sc.width=sc.height=128; const sg=sc.getContext('2d'); const gr=sg.createRadialGradient(64,64,4,64,64,62); gr.addColorStop(0,'rgba(0,0,0,.55)'); gr.addColorStop(1,'rgba(0,0,0,0)'); sg.fillStyle=gr; sg.fillRect(0,0,128,128);
  const sh=new T.Mesh(new T.PlaneGeometry(W*1.9,H*1.6), new T.MeshBasicMaterial({map:new T.CanvasTexture(sc), transparent:true, depthWrite:false})); sh.position.set(0.06,-0.08,-0.5); scene.add(sh);
  const key=new T.DirectionalLight(0xffffff,1.5); key.position.set(0.6,1.2,2.5); scene.add(key); scene.add(new T.AmbientLight(0xffffff,0.25));
  const st={ T, renderer, scene, camera, pivot, key, canvas, stage, W, H, tx:0, ty:0, rx:0, ry:0, flip:0, flipT:0, lx:0.6, ly:1.2, drag:false, raf:0, t0:performance.now(), geoms:[], alive:true, reduced:window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches };
  const fit=()=>{ const b=stage.getBoundingClientRect(); const w=Math.max(10,b.width), h=Math.max(10,b.height); renderer.setSize(w,h,false); canvas.style.width=w+'px'; canvas.style.height=h+'px'; camera.aspect=w/h; const tf=Math.tan(camera.fov*Math.PI/360); const dv=(H*1.2/2)/tf, dh=(W*1.3/2)/(tf*camera.aspect); camera.position.set(0,0,Math.max(dv,dh)); camera.updateProjectionMatrix(); };
  fit(); st.fit=fit; if (window.ResizeObserver){ st.ro=new ResizeObserver(fit); st.ro.observe(stage); }
  const map=(ev)=>{ const b=stage.getBoundingClientRect(); const x=Math.min(1,Math.max(0,(ev.clientX-b.left)/b.width)), y=Math.min(1,Math.max(0,(ev.clientY-b.top)/b.height)); st.tx=(y-0.5)*0.75; st.ty=(x-0.5)*1.0; st.lx=(x-0.5)*3.2; st.ly=(0.5-y)*3.2+0.6; };
  st.onMove=ev=>{ st.drag=true; st.idle=false; map(ev); }; st.onDown=ev=>{ st.drag=true; map(ev); }; st.onUp=()=>{ st.drag=false; setTimeout(()=>{ if (!st.drag){ st.tx=0; st.ty=0; st.lx=0.6; st.ly=1.2; } }, 500); };
  stage.addEventListener('pointermove',st.onMove); stage.addEventListener('pointerdown',st.onDown); stage.addEventListener('pointerup',st.onUp); stage.addEventListener('pointerleave',st.onUp); stage.addEventListener('pointercancel',st.onUp);
  const tick=(now)=>{ if (!st.alive) return; st.raf=requestAnimationFrame(tick); const t=(now-st.t0)/1000;
    let tx=st.tx, ty=st.ty; if (!st.drag && !st.reduced){ tx+=Math.sin(t*0.7)*0.05; ty+=Math.cos(t*0.5)*0.11; }
    st.rx+=(tx-st.rx)*0.14; st.ry+=(ty-st.ry)*0.14; st.flipT+=((st.flip?Math.PI:0)-st.flipT)*0.12;
    pivot.rotation.x=-st.rx; pivot.rotation.y=st.ry+st.flipT; key.position.x+=(st.lx-key.position.x)*0.14; key.position.y+=(st.ly-key.position.y)*0.14;
    renderer.render(scene,camera); };
  st.raf=requestAnimationFrame(tick); return st;
}
function v3Dispose(){
  const st=V3.st; if (!st) return; st.alive=false; cancelAnimationFrame(st.raf); V3.st=null;
  try { st.stage.removeEventListener('pointermove',st.onMove); st.stage.removeEventListener('pointerdown',st.onDown); st.stage.removeEventListener('pointerup',st.onUp); st.stage.removeEventListener('pointerleave',st.onUp); st.stage.removeEventListener('pointercancel',st.onUp); if (st.ro) st.ro.disconnect();
    st.scene.traverse(n=>{ if (n.geometry) n.geometry.dispose(); const ms=n.material? (Array.isArray(n.material)?n.material:[n.material]) : []; for (const m of ms){ for (const k in m){ if (m[k] && m[k].isTexture) m[k].dispose(); } m.dispose(); } });
    st.renderer.dispose(); if (st.renderer.forceContextLoss) st.renderer.forceContextLoss(); st.canvas.remove(); } catch(e){ console.error(e); }
}
async function v3Open(kind, id, tok){
  if (V3.fail || !v3WebGL()) return;
  const o=objFor(kind,id); if (!o) return; const el=$('#insp'); if (!el) return;
  try {
    const T=await v3Load(); if (tok!==V3.tok || !$('#insp')) return;
    const svg=v3Art(kind,o); const W=o.g>0? 900 : 1000; const [front, back]=await Promise.all([v3Raster(svg,W), v3Raster(v3Back(kind,o), 700)]); front.svg=svg;
    if (tok!==V3.tok || !$('#insp')) return;
    const stage=$('#inspstage'); stage.style.position='relative'; const st=v3Build(T, stage, kind, o, front, back); V3.st=st;
    const obj=$('#inspobj'); if (obj){ obj.style.transition='opacity .35s'; obj.style.opacity='0'; setTimeout(()=>{ if (obj) obj.style.visibility='hidden'; },380); }
    st.canvas.style.opacity='0'; st.canvas.style.transition='opacity .4s'; requestAnimationFrame(()=>{ st.canvas.style.opacity='1'; });
    const bar=el.querySelector('.insp-bar'); if (bar && !bar.querySelector('[data-act="inspflip"]')) bar.insertAdjacentHTML('beforeend','<button class="btn sm" data-act="inspflip">Flip</button>'); el.classList.add('is3d');
  } catch(e){ console.warn('3D viewer unavailable, using the flat view:', e && e.message); if (String(e&&e.message).match(/load failed|timeout|no three/)) V3.fail=true; const c=document.querySelector('.insp3d'); if (c) c.remove(); }
}
if (typeof requestIdleCallback==='function') setTimeout(()=>requestIdleCallback(()=>{ if (!V3.fail && v3WebGL()) v3Load().catch(()=>{}); }), 7000);
(function(){
  const io=inspectOpen; inspectOpen=function(kind,id){ V3.tok++; io(kind,id); v3Open(kind,id,V3.tok); };
  const ci=closeInspect; closeInspect=function(){ V3.tok++; v3Dispose(); ci(); };
  const fl=ACT.inspflip; ACT.inspflip=function(a,el,e){ if (V3.st){ V3.st.flip=V3.st.flip?0:1; return; } return fl(a,el,e); };
})();

// ===================== PACK OPENING =====================
// UI.open = { phase:'box'|'pack'|'cards'|'sum', idx, flipped, back, cards:[cid] }
const PACK_COL = { dia:['#12324f','#c9a227'], nat:['#1f6fb2','#f2c230'], her:['#7a2d22','#efe6cf'], spr:['#1b4d3e','#e7f0ec'], vel:['#16191d','#9fb3c8'], lux:['#0d0d0f','#c9a227'] };
function opEl(){ let el=$('#opener'); if (!el){ el=document.createElement('div'); el.id='opener'; el.className='opener'; el.setAttribute('role','dialog'); el.setAttribute('aria-label','Opening packs'); document.body.appendChild(el); } return el; }
function startOpener(){
  const pd=G.player.pending; if (!pd) return;
  const br=B(G.products[pd.p]);
  UI.open = { phase: (pd.pi===0 && pd.f!=='pack') ? 'box' : 'pack', idx:0, flipped:false, back:false };
  const el=opEl(); el.style.display='flex';
  el.innerHTML = `<div class="op-top"><div class="t" id="optitle"></div><button class="btn sm" data-act="oprest" id="oprestbtn">Open the rest</button><button class="iconbtn" data-act="opclose" aria-label="Close">${icon('x',20)}</button></div>
    <div class="op-stage" id="opstage"></div><div class="op-cap" id="opcap"></div><div class="op-act" id="opact"></div>`;
  const st=$('#opstage'); let sx=0, sy=0, down=false;
  st.addEventListener('pointerdown', e=>{ down=true; sx=e.clientX; sy=e.clientY; });
  st.addEventListener('pointerup', e=>{ if (!down) return; down=false; const dx=e.clientX-sx, dy=e.clientY-sy; opTap(Math.abs(dx)>40||Math.abs(dy)>60 ? (dx<0?-1:1) : 0); });
  st.addEventListener('pointercancel', ()=>{ down=false; });
  document.body.style.overflow='hidden';
  opRender();
}
function closeOpener(){ const el=$('#opener'); if (el){ el.style.display='none'; el.innerHTML=''; } const o=UI.open; UI.open=null; document.body.style.overflow=UI.sheets.length?'hidden':'';
  if (o && o.phase==='sum' && G.player.pending && G.player.pending.pi>=G.player.pending.packs.length) G.player.pending=null;
  refresh(); queueSave(); }
ACT.opclose = ()=>closeOpener();
function curPack(){ const pd=G.player.pending; return pd.packs[pd.pi]; }
function opTitle(){
  const pd=G.player.pending; const prod=G.products[pd.p];
  const t=$('#optitle'); if (t) t.innerHTML = `${esc(pd.title||prodName(prod))}<small>${pd.sub||FMT_NAME[pd.f]}${pd.packs.length>1?`, ${pd.rp?'layer':'pack'} ${Math.min(pd.pi+1,pd.packs.length)} of ${pd.packs.length}`:''}</small>`;
  const rb=$('#oprestbtn'); if (rb) rb.style.display = pd.packs.length>1 && pd.pi<pd.packs.length-1 ? '' : 'none';
}
function faceDown(prod){
  const [a,b]=PACK_COL[B(prod).tmpl]||['#333','#ccc'];
  return `<div class="oc-face oc-back" style="background:repeating-linear-gradient(45deg, ${a} 0 10px, ${shade(a,0.08)} 10px 20px)"><span style="color:${b}">${esc(B(prod).short.toUpperCase())}</span></div>`;
}
function opRender(){
  const o=UI.open; if (!o) return; const pd=G.player.pending; const prod=G.products[pd.p];
  opTitle();
  const st=$('#opstage'), cap=$('#opcap'), act=$('#opact');
  if (o.phase==='box'){
    st.innerHTML = `<div class="sealed box" id="opsealed">${packArt(prod,pd.f)}</div><div class="op-hint">Tap to open the box</div>`;
    cap.innerHTML = `<b>${esc(FMT_NAME[pd.f])}</b><span>${pd.packs.length} pack${pd.packs.length>1?'s':''} inside</span>`; act.innerHTML='';
  } else if (o.phase==='pack'){
    st.innerHTML = `<div class="sealed" id="opsealed">${pd.rp? repackArt(pd.rp) : packArt(prod,'pack')}</div><div class="op-hint">${pd.rp?'Tap or swipe to dig in':'Tap or swipe to tear it open'}</div>`;
    cap.innerHTML = `<b>${pd.packs.length>1?(pd.rp?'Layer ':'Pack ')+(pd.pi+1):'Your pack'}</b><span>${curPack().length} cards</span>`; act.innerHTML='';
  } else if (o.phase==='cards'){
    const pk=curPack(); const left=pk.slice(o.idx);
    st.innerHTML = `<div class="pile">${left.slice(0,3).map((cid,i)=>{ const c=C(cid); const top=i===0;
      return `<div class="oc ${top&&o.flipped?'flip':''} ${o.enter?'enter':''}" style="--i:${i};z-index:${10-i}" data-cid="${cid}"><div class="oc-in">${faceDown(prod)}<div class="oc-face oc-front">${top&&o.back?cardBack(c.k,c.s):cardFront(c.k,c.s)}</div></div></div>`; }).reverse().join('')}</div><div class="counter">${o.idx+1} / ${pk.length}</div>`;
    o.enter=false;
    opCaption();
  } else {
    opSummary();
  }
}
function opCaption(){
  const o=UI.open; const cap=$('#opcap'), act=$('#opact'); const pk=curPack();
  if (!o.flipped){ cap.innerHTML=`<b>&nbsp;</b><span>Tap to flip</span>`; act.innerHTML=''; return; }
  const c=C(pk[o.idx]); const d=D(c.k); const hit=isHitKey(c.k);
  const tg=[d.rc?'Rookie card':'', d.first?'First card':'', d.auto?'Autograph':'', d.relic?'Relic':''].filter(Boolean).join(', ');
  cap.innerHTML = `<b>${esc(cardName(c))}</b><span>${hit?`<span class="ser">${esc(d.title)}${serialTxt(c)?' '+serialTxt(c):''}</span>`:esc(d.setName+' #'+d.cardNo)}${tg?', '+tg:''}</span>`;
  act.innerHTML = `<button class="btn sm" data-act="opback">${o.back?'See front':'See back'}</button><button class="btn sm pri" data-act="opnext">${o.idx<pk.length-1?'Next card':'Finish pack'}</button>`;
}
ACT.opback = ()=>{ const o=UI.open; o.back=!o.back; const top=$('#opstage .oc:last-child .oc-front'); const c=C(curPack()[o.idx]); if (top) top.innerHTML = o.back? cardBack(c.k,c.s) : cardFront(c.k,c.s); opCaption(); };
ACT.opnext = ()=>opTap(-1);
function opTap(dir){
  const o=UI.open; if (!o || o.lock) return; const pd=G.player.pending;
  if (o.phase==='box'){ o.lock=true; const s=$('#opsealed'); s.classList.add('boxopen'); tearSound(); setTimeout(()=>{ o.lock=false; o.phase='pack'; opRender(); }, 480); return; }
  if (o.phase==='pack'){ o.lock=true; const s=$('#opsealed'); s.classList.add('torn'); tearSound(); setTimeout(()=>{ o.lock=false; o.phase='cards'; o.idx=0; o.flipped=false; o.back=false; o.enter=true; opRender(); }, 700); return; }
  if (o.phase==='cards'){
    const pk=curPack(); const top=$('#opstage .oc:last-child');
    if (!o.flipped){ o.flipped=true; top.classList.add('flip'); const c=C(pk[o.idx]);
      if (isHitKey(c.k)){ top.classList.add('hit'); const big=isMajor(c); if (big) top.querySelector('.oc-front').style.boxShadow='0 0 0 2px rgba(242,210,122,.8), 0 0 40px rgba(242,210,122,.35)'; setTimeout(()=>chime(big), 380); }
      opCaption(); return; }
    o.lock=true; top.classList.add('gone'); if (dir>0) top.style.transform='translate(130%,10%) rotate(14deg)';
    setTimeout(()=>{ o.lock=false; o.idx++; o.flipped=false; o.back=false; if (o.idx>=pk.length){ o.phase='sum'; o.sumPacks=[pd.pi]; pd.pi++; queueSave(); } opRender(); }, 300);
  }
}
function opSummary(){
  const o=UI.open; const pd=G.player.pending; const prod=G.products[pd.p];
  const ids=o.sumPacks.flatMap(i=>pd.packs[i]); const cards=ids.map(C).filter(Boolean);
  let lo=0, hi=0; cards.forEach(c=>{ const r=estRange(c.k,0,c); lo+=r.lo; hi+=r.hi; });
  const hits=cards.filter(c=>isHitKey(c.k)).sort((a,b)=>cardValue(b)-cardValue(a));
  const base=cards.filter(c=>!isHitKey(c.k));
  const many=cards.length>40;
  const show = many? hits.concat(base.filter(c=>{ const d=D(c.k); return d.rc||d.first; })) : hits.concat(base);
  const cost=(G.player.opened[0]&&G.player.opened[0].cost)||0; const perPack=cost/pd.packs.length;
  $('#opstage').innerHTML = `<div class="op-sum"><h2>${o.sumPacks.length>1?o.sumPacks.length+' packs':pd.packs.length>1?'Pack '+(o.sumPacks[0]+1):'Your pulls'}</h2>
    <p style="text-align:center;margin:0 0 12px;color:#aebccb">${cards.length} cards, ${hits.length} hit${hits.length===1?'':'s'}. Rough value ${money(nicePrice(lo))}–${money(nicePrice(hi))}${perPack?` against about ${money(perPack*o.sumPacks.length)} spent`:''}.</p>
    <div class="grid">${show.map(c=>`<button class="gcell" data-act="card" data-a="${c.id}">${thumbHTML(c)}<div class="cap"><b>${esc(cardName(c))}</b><span>${esc(isHitKey(c.k)?D(c.k).title+(serialTxt(c)?' '+serialTxt(c):''):'Base'+(D(c.k).rc?' RC':''))}</span></div></button>`).join('')}</div>
    ${many&&base.length>show.length-hits.length?`<p style="text-align:center;color:#8fa0af;font-size:13px">Plus ${base.length-(show.length-hits.length)} more base cards, now in your collection.</p>`:''}</div>`;
  $('#opcap').innerHTML='';
  const more=pd.pi<pd.packs.length;
  $('#opact').innerHTML = more? `<button class="btn" data-act="opclose">Later</button><button class="btn pri" data-act="opnextpack">Next pack (${pd.packs.length-pd.pi} left)</button>` : `<button class="btn pri" data-act="opclose">Done</button>`;
  opTitle();
}
ACT.opnextpack = ()=>{ const o=UI.open; o.phase='pack'; o.idx=0; opRender(); };
ACT.oprest = ()=>{ const o=UI.open, pd=G.player.pending; if (!o||!pd) return; const from = o.phase==='cards'||o.phase==='sum'&&false ? pd.pi : pd.pi; const list=[]; for (let i=from;i<pd.packs.length;i++) list.push(i);
  if (!list.length) return; o.phase='sum'; o.sumPacks=list; pd.pi=pd.packs.length; opRender(); queueSave(); };
function openerKey(e){ if (e.key==='Escape'){ closeOpener(); return; } if ((e.key===' '||e.key==='Enter'||e.key==='ArrowRight') && UI.open.phase!=='sum'){ e.preventDefault(); opTap(0); } }

// ===================== BOOT =====================
function bootScreen(){ let b=$('#boot'); if (!b){ b=document.createElement('div'); b.id='boot'; b.className='boot'; document.body.appendChild(b); }
  b.style.display='flex'; b.innerHTML=`<div class="brand"><i></i><span>${typeof PACK!=='undefined'?PACK.title:'Card Collector'}</span></div><div class="pb"><i id="bootbar"></i></div><p id="bootmsg">Loading</p>`; return b; }
async function bootProg(f, msg){ const bar=$('#bootbar'), m=$('#bootmsg'); if (bar) bar.style.width=(f*100).toFixed(0)+'%'; if (m && msg) m.textContent=msg; await new Promise(r=>setTimeout(r,0)); }
function migrate(){ const P_=G.player; P_.inbox=P_.inbox||[]; P_.fav=P_.fav||[]; P_.follow=P_.follow||[]; P_.show=P_.show||{}; P_.notes=P_.notes||{}; P_.tips=P_.tips||{}; P_.csubs=P_.csubs||[]; P_.creturned=P_.creturned||[]; P_.cskill=P_.cskill||0; P_.cfol=P_.cfol||[]; P_.crfol=P_.crfol||[];
  UI.sound = P_.sound!==false; if (P_.theme && P_.theme!=='auto') document.documentElement.dataset.theme=P_.theme; }
async function startNew(){
  UI.booting=true; const b=bootScreen(); UI.sheets=[]; renderSheet();
  await bootProg(0.02,'Founding a league');
  try { await newGame((Date.now() ^ Math.floor(Math.random()*1e9))|0, bootProg); }
  catch(e){ console.error(e); b.innerHTML=`<div style="max-width:320px;margin:30vh auto 0;text-align:center;color:#e9ecef;font-family:system-ui"><p>Something went wrong building the new world.</p><p style="opacity:.7;font-size:13px">${esc(String(e&&e.message||e))}</p><button class="btn pri" onclick="location.reload()">Reload</button></div>`; UI.booting=false; return; }
  migrate(); UI.booting=false; UI.tab='home'; b.style.display='none'; render(); saveGame();
}
async function boot(){
  shell(); const b=bootScreen();
  await bootProg(0.02,'Looking for your saved collection');
  const ok = await loadGame();
  if (!ok){ await startNew(); return; }
  migrate();
  if (!G.cm){ await bootProg(0.05,'Opening the comic shop'); await upgradeComics(async(f,m)=>bootProg(0.05+f*0.9,'Comics history: '+m.toLowerCase())); await bootProg(0.97,'Stocking the shelves'); migrate(); saveGame(true); }
  for (const L of CARD_LINES) if (!L.has()){ await bootProg(L.boot.at,L.boot.msg); await L.upgrade(async(f,m)=>bootProg(L.boot.at+f*L.boot.span,m)); migrate(); saveGame(true); }
  if (!G.hunt){ await bootProg(0.98,'Mapping the local hobby scene'); huntInit(); saveGame(true); }
  seedTracking();
  UI.booting=false; b.style.display='none'; render();
}
// the shell (launcher and save slots) starts the game now

// ===================== SAVE SLOTS =====================
// Several named games per title, stored in this browser's IndexedDB and compressed. Backups are .ccsave files you can move between devices.
const SLOT={ id:null, name:'' };
const SAVES={ db:null, last:0, err:'', busy:false, again:false };
const SAVE_MAGIC='CCS1';
function idbOpen(){
  return new Promise((res,rej)=>{ if (SAVES.db) return res(SAVES.db); if (typeof indexedDB==='undefined') return rej(new Error('no indexedDB'));
    let rq; try { rq=indexedDB.open('collector-saves',1); } catch(e){ return rej(e); }
    rq.onupgradeneeded=()=>{ const d=rq.result; if (!d.objectStoreNames.contains('slots')) d.createObjectStore('slots',{keyPath:'id'}); if (!d.objectStoreNames.contains('data')) d.createObjectStore('data',{keyPath:'id'}); };
    rq.onsuccess=()=>{ SAVES.db=rq.result; SAVES.db.onclose=()=>{ SAVES.db=null; }; res(SAVES.db); }; rq.onerror=()=>rej(rq.error||new Error('no storage')); rq.onblocked=()=>rej(new Error('Storage is busy in another tab.')); });
}
// one storage layer: IndexedDB when the browser allows it, otherwise memory (saves last until the page closes, so backups matter)
const MEM={ slots:new Map(), data:new Map() };
async function useMemory(){ if (SAVES.mem===undefined){ try { await idbOpen(); SAVES.mem=false; } catch(e){ SAVES.mem=true; SAVES.err='Saving is blocked in this browser, so this game will be lost when you close the page. Download a backup from Settings to keep it.'; } } return SAVES.mem; }
const store={
  async all(n){ if (await useMemory()) return [...MEM[n].values()]; return (await idbOpen(), new Promise((res,rej)=>{ const t=SAVES.db.transaction([n],'readonly'); const rq=t.objectStore(n).getAll(); rq.onsuccess=()=>res(rq.result); rq.onerror=()=>rej(rq.error); })); },
  async get(n,id){ if (await useMemory()) return MEM[n].get(id)||null; return new Promise((res,rej)=>{ const t=SAVES.db.transaction([n],'readonly'); const rq=t.objectStore(n).get(id); rq.onsuccess=()=>res(rq.result||null); rq.onerror=()=>rej(rq.error); }); },
  async batch(ops){ if (await useMemory()){ for (const o of ops){ if (o.put) MEM[o.s].set(o.put.id,o.put); else MEM[o.s].delete(o.del); } return; }
    return new Promise((res,rej)=>{ const t=SAVES.db.transaction([...new Set(ops.map(o=>o.s))],'readwrite'); for (const o of ops){ const st=t.objectStore(o.s); if (o.put) st.put(o.put); else st.delete(o.del); } t.oncomplete=()=>res(); t.onerror=()=>rej(t.error); t.onabort=()=>rej(t.error||new Error('Save was cancelled.')); }); }
};
async function slotList(game){ const all=await store.all('slots'); return (all||[]).filter(r=>!game||r.game===game).sort((a,b)=>b.updated-a.updated); }
async function slotGet(id){ return store.get('slots',id); }
function slotMetaNow(){ const P_=G.player; const nwL=(P_.nw&&P_.nw.length)? P_.nw[P_.nw.length-1] : null; return { day:G.day, cash:Math.round(P_.cash*100)/100, nw: Math.round(P_.cash+(typeof netWorthNow==='function'? netWorthNow() : 0)), scn:P_.scnN||'', items:(typeof myCards==='function'?myCards().length:0)+(typeof myComics==='function'&&G.cm?myComics().length:0)+(typeof myTc==='function'&&G.tcg?myTc().length:0) }; }
async function slotCreate(name, scn){ const id='s'+Date.now().toString(36)+Math.floor(Math.random()*1e5).toString(36); const rec={ id, game:PACK.id, name:name||'My collection', created:Date.now(), updated:Date.now(), meta:{}, enc:'', v:1, scn:scn||'' }; await store.batch([{s:'slots',put:rec}]); return rec; }
async function slotRename(id,name){ const r=await slotGet(id); if (!r) return; r.name=name; await store.batch([{s:'slots',put:r}]); if (SLOT.id===id) SLOT.name=name; }
async function slotDelete(id){ await store.batch([{s:'slots',del:id},{s:'data',del:id}]); if (SLOT.id===id){ SLOT.id=null; } }
async function slotWrite(id, bytes, enc, meta){ const r=await slotGet(id); if (!r) throw new Error('That save slot was deleted.'); r.updated=Date.now(); r.meta=meta; r.enc=enc; r.size=bytes.byteLength; await store.batch([{s:'slots',put:r},{s:'data',put:{id, bytes:bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset+bytes.byteLength)}}]); }
async function slotRead(id){ const r=await slotGet(id); const d=await store.get('data',id); if (!r||!d) throw new Error('Could not find that save.'); return { rec:r, bytes:new Uint8Array(d.bytes), enc:r.enc }; }
// ---------- turning the world into bytes and back ----------
async function packBytes(){
  const json=JSON.stringify(G, saveReplacer);
  if (typeof CompressionStream!=='undefined'){ const cs=new Blob([json]).stream().pipeThrough(new CompressionStream('gzip')); return { bytes:new Uint8Array(await new Response(cs).arrayBuffer()), enc:'gz' }; }
  return { bytes:new TextEncoder().encode(json), enc:'raw' };
}
async function unpackBytes(bytes, enc){
  if (enc==='gz'){ const ds=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip')); return JSON.parse(await new Response(ds).text()); }
  return JSON.parse(new TextDecoder().decode(bytes));
}
// ---------- saving ----------
saveGame=async function(force){
  if (!SLOT.id || !G || !G.player || !G.player.start) return;
  if (SAVES.busy){ SAVES.again=true; return; } SAVES.busy=true;
  try { const p=await packBytes(); await slotWrite(SLOT.id,p.bytes,p.enc,slotMetaNow()); SAVES.last=Date.now(); if (!SAVES.mem) SAVES.err=''; G._saveOk=true; G._localOk=!SAVES.mem; }
  catch(e){ SAVES.err=String(e&&e.message||e); G._saveOk=false; console.warn('save failed',e); }
  SAVES.busy=false; if (SAVES.again){ SAVES.again=false; saveGame(); }
};
flushCloud=async function(){}; 
if (typeof document!=='undefined'){ document.addEventListener('visibilitychange',()=>{ if (document.visibilityState==='hidden') saveGame(true); }); window.addEventListener('pagehide',()=>saveGame(true)); }
try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch(e){}
function saveStatus(){
  if (SAVES.err) return `<span class="err">Couldn't save: ${esc(SAVES.err)}. Download a backup so you don't lose this game.</span>`;
  if (!SAVES.last) return `Playing <b>${esc(SLOT.name)}</b>. Saves automatically in this browser.`;
  return `Playing <b>${esc(SLOT.name)}</b>. Saved in this browser at ${new Date(SAVES.last).toLocaleTimeString([], {hour:'numeric', minute:'2-digit'})}. Download a backup to keep a copy or move to another device.`;
}
// ---------- backups ----------
async function slotExportBlob(id){
  const {rec,bytes,enc}=await slotRead(id); const head=new TextEncoder().encode(JSON.stringify({game:rec.game,name:rec.name,enc,meta:rec.meta,v:1,saved:Date.now()}));
  const out=new Uint8Array(4+4+head.length+bytes.length); out.set(new TextEncoder().encode(SAVE_MAGIC),0); new DataView(out.buffer).setUint32(4,head.length); out.set(head,8); out.set(bytes,8+head.length);
  return { blob:new Blob([out],{type:'application/octet-stream'}), name:(rec.name||'save').replace(/[^\w\- ]+/g,'').trim().replace(/\s+/g,'-').toLowerCase()+'-'+rec.game+'.ccsave' };
}
function downloadBlob(blob,name){ const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href),4000); }
async function slotImportFile(file){
  const buf=new Uint8Array(await file.arrayBuffer()); let name=(file.name||'Imported game').replace(/\.[^.]+$/,'').replace(/[-_]+/g,' ');
  if (new TextDecoder().decode(buf.slice(0,4))===SAVE_MAGIC){ const hl=new DataView(buf.buffer,buf.byteOffset).getUint32(4); const head=JSON.parse(new TextDecoder().decode(buf.slice(8,8+hl))); const payload=buf.slice(8+hl);
    if (head.game && head.game!==PACK.id) throw new Error('This is a '+head.game+' save. Open it in that game.'); const g=await unpackBytes(payload,head.enc); if (!g||!g.player) throw new Error('That file is damaged.');
    const rec=await slotCreate(head.name||name,''); await slotWrite(rec.id,payload,head.enc,head.meta||{}); return rec; }
  const txt=new TextDecoder().decode(buf); if (/^(gz|js):/.test(txt.trim())){ const g=await unpackState(txt.trim()); if (!g||!g.player) throw new Error('That file is damaged.'); const prev=G; G=g; const p=await packBytes(); const meta=slotMetaNow(); G=prev; const rec=await slotCreate(name,''); await slotWrite(rec.id,p.bytes,p.enc,meta); return rec; }
  throw new Error('That is not a save file for this game.');
}

// ===================== LAUNCHER =====================
function ago(ts){ const m=Math.max(0,Math.round((Date.now()-ts)/60000)); if (m<1) return 'just now'; if (m<60) return m+' min ago'; const h=Math.round(m/60); if (h<24) return h+' hour'+(h>1?'s':'')+' ago'; const d=Math.round(h/24); return d+' day'+(d>1?'s':'')+' ago'; }
function launchEl(){ let el=document.getElementById('launch'); if (!el){ el=document.createElement('div'); el.id='launch'; el.className='launch'; el.setAttribute('role','dialog'); el.setAttribute('aria-label',PACK.title); document.body.appendChild(el); el.addEventListener('click',launchClick); el.addEventListener('change',launchChange); } document.body.classList.add('noscroll'); return el; }
function closeLauncher(){ const el=document.getElementById('launch'); if (el) el.remove(); document.body.classList.remove('noscroll'); }
function slotCard(r){ const m=r.meta||{}; const when=m.day!=null? fmtDate(m.day,true) : 'New'; return `<div class="lslot"><button class="lslot-main" data-lact="open" data-id="${r.id}"><b>${esc(r.name)}</b><span>${when}${m.nw!=null?' · worth about '+money(m.nw):''}</span><span class="dim">${esc(m.scn||'')}${m.scn?' · ':''}played ${ago(r.updated)}</span></button><div class="lslot-act"><button data-lact="export" data-id="${r.id}" aria-label="Download backup of ${esc(r.name)}">Backup</button><button data-lact="rename" data-id="${r.id}">Rename</button><button class="danger" data-lact="delete" data-id="${r.id}">Delete</button></div></div>`; }
async function showLauncher(msg){
  const el=launchEl(); let slots=[]; let err=''; try { slots=await slotList(PACK.id); } catch(e){ err=String(e&&e.message||e); }
  const last=slots[0];
  el.innerHTML=`<div class="lwrap"><div class="lhead"><div class="llogo" style="background:${PACK.accent}"></div><h1>${esc(PACK.title)}</h1><p>${esc(PACK.tagline)}</p></div>
    ${err?`<div class="lmsg err">${esc(err)}</div>`:''}${msg?`<div class="lmsg">${esc(msg)}</div>`:''}
    ${last?`<button class="lbtn big" data-lact="open" data-id="${last.id}">Continue<small>${esc(last.name)} · ${last.meta&&last.meta.day!=null?fmtDate(last.meta.day,true):''}</small></button>`:''}
    <div class="lrow"><button class="lbtn ${last?'':'big'}" data-lact="new">${last?'New game':'Start a new game'}</button><label class="lbtn" style="cursor:pointer">Import a save<input type="file" id="limport" accept=".ccsave,.txt,.json" hidden></label></div>
    ${slots.length?`<h2 class="lh2">Your games</h2><div class="lslots">${slots.map(slotCard).join('')}</div>`:'<p class="lnote">No saved games yet. Each game you start gets its own slot, so you can run several at once.</p>'}
    <p class="lfoot">Games are saved in this browser, automatically. Use Backup to keep a copy or move to another device.</p></div>`;
}
function showNewGame(){
  const el=launchEl(); const list=SCENARIOS.filter(s=>!PACK.scenarios||PACK.scenarios.includes(s.id)); UI._lsc=list[0].id;
  el.innerHTML=`<div class="lwrap"><div class="lhead small"><h1>New game</h1><p>Every start plays the same world. What changes is what you have on day one.</p></div>
    <label class="lfield">Name this game<input id="lname" type="text" maxlength="40" value="${esc(PACK.slotName||'My collection')} ${Math.floor(Math.random()*90+10)}" autocomplete="off"></label>
    <div class="lscn">${list.map((s,i)=>`<label class="lsc ${i===0?'on':''}"><input type="radio" name="lsc" value="${s.id}" ${i===0?'checked':''} hidden><b>${esc(s.n)}</b><span>${esc(s.d)}</span><em>${money(s.cash)} to start${s.pay?', '+money(s.pay)+' a week':', no allowance'}</em></label>`).join('')}</div>
    <div class="lrow"><button class="lbtn big" data-lact="start">Start</button><button class="lbtn" data-lact="back">Back</button></div></div>`;
}
function launchChange(e){ const t=e.target; if (t.name==='lsc'){ UI._lsc=t.value; document.querySelectorAll('.lsc').forEach(l=>l.classList.toggle('on',l.querySelector('input').value===t.value)); } else if (t.id==='limport'){ const f=t.files&&t.files[0]; if (f) importFromLauncher(f); } }
async function importFromLauncher(f){ try { const rec=await slotImportFile(f); await showLauncher('Imported "'+rec.name+'".'); } catch(err){ await showLauncher(String(err&&err.message||err)); } }
async function launchClick(e){
  const b=e.target.closest('[data-lact]'); if (!b) return; const a=b.dataset.lact, id=b.dataset.id;
  if (a==='new') return showNewGame(); if (a==='back') return showLauncher();
  if (a==='start'){ const name=(document.getElementById('lname').value||'My collection').trim(); return shellStart(name, UI._lsc); }
  if (a==='open') return shellOpen(id);
  if (a==='export'){ try { const x=await slotExportBlob(id); downloadBlob(x.blob,x.name); } catch(err){ showLauncher(String(err&&err.message||err)); } return; }
  if (a==='rename'){ const r=await slotGet(id); const n=prompt('Rename this game',r.name); if (n&&n.trim()){ await slotRename(id,n.trim().slice(0,40)); showLauncher(); } return; }
  if (a==='delete'){ if (b.dataset.sure){ await slotDelete(id); showLauncher('Deleted.'); } else { b.dataset.sure='1'; b.textContent='Tap again to delete for good'; setTimeout(()=>{ if (b.isConnected){ delete b.dataset.sure; b.textContent='Delete'; } },3500); } return; }
}
// ---------- starting and opening games ----------
function resetUIForGame(){
  UI.sheets=[]; UI.recap=null; UI.fsnap=null; UI.rvl=null; UI.tco=null; UI.open=null; for (const id of ['rvl','tco','insp','scn']){ const x=document.getElementById(id); if (x) x.remove(); } document.body.classList.remove('noscroll');
  try { renderSheet(); } catch(e){} UI.tab=PACK.homeTab||'home'; if (PACK.mf && UI.mf) UI.mf.type=PACK.mf; if (PACK.sub) for (const k in PACK.sub) UI.sub[k]=PACK.sub[k];
}
function bootFail(b,msg){ b.innerHTML=`<div style="max-width:320px;margin:30vh auto 0;text-align:center;color:#e9ecef;font-family:system-ui"><p>Something went wrong.</p><p style="opacity:.7;font-size:13px">${esc(msg)}</p><button class="btn pri" onclick="location.reload()">Reload</button></div>`; }
async function shellStart(name, scn){
  closeLauncher(); UI.booting=true; const b=bootScreen(); resetUIForGame(); UI.scn=scn; await bootProg(0.02, PACK.bootMsg||'Building the world');
  let rec=null; try { rec=await slotCreate(name, scn); } catch(e){ bootFail(b,String(e&&e.message||e)); return; }
  try { await newGame((Date.now() ^ Math.floor(Math.random()*1e9))|0, bootProg); } catch(e){ console.error(e); bootFail(b,String(e&&e.message||e)); try { await slotDelete(rec.id); } catch(x){} return; }
  SLOT.id=rec.id; SLOT.name=rec.name; migrate(); UI.booting=false; UI.tab=PACK.homeTab||'home'; b.style.display='none'; render(); await saveGame(true);
}
async function shellOpen(id){
  closeLauncher(); UI.booting=true; const b=bootScreen(); resetUIForGame(); await bootProg(0.05,'Loading your game');
  try {
    const x=await slotRead(id); await bootProg(0.2,'Unpacking'); G=await unpackBytes(x.bytes,x.enc); R=worldRnd; if (typeof resetCaches==='function') resetCaches(); DCACHE.clear(); fvClear(); G._npcCardIds=Object.keys(G.cards).map(Number).filter(i=>G.cards[i].o>0);
    if (G.cm) cmNormalize(); huntNormalize(); migrate();
    if (packHas('comics') && !G.cm){ await bootProg(0.3,'Opening the comic shop'); await upgradeComics(async(f,m)=>bootProg(0.3+f*0.6,'Comics history: '+m.toLowerCase())); migrate(); }
    if (packHas('tcg')) for (const L of CARD_LINES) if (!L.has()){ await bootProg(L.boot.at,L.boot.msg); await L.upgrade(async(f,m)=>bootProg(L.boot.at+f*L.boot.span,m)); migrate(); }   // a save from before a line existed gets that line's world
    if (!G.hunt){ await bootProg(0.98,'Mapping the local hobby scene'); huntInit(); }
    seedTracking(); SLOT.id=id; SLOT.name=x.rec.name; UI.booting=false; UI.tab=PACK.homeTab||'home'; b.style.display='none'; render(); saveGame(true);
  } catch(e){ console.error(e); bootFail(b,String(e&&e.message||e)); }
}
async function shellBoot(){ shell(); const b=bootScreen(); await bootProg(0.3,'Starting'); b.style.display='none'; await showLauncher(); }
// ---------- in-game: settings and switching games ----------
settingsSheet=function(){
  const th=document.documentElement.dataset.theme||'auto';
  return { t:'Settings', h:`<div class="stack">
    <div class="panel"><h3>Your game</h3><p class="small" id="savemsg" style="margin:0 0 8px">${saveStatus()}</p><div class="formrow"><button class="btn sm" data-act="savenow">Save now</button><button class="btn sm" data-act="exportsave">Download a backup</button><button class="btn sm pri" data-act="slots">Switch game</button></div></div>
    <div class="panel"><h3>Sound</h3><div class="seg"><button class="${UI.sound?'on':''}" data-act="sound" data-a="1">On</button><button class="${UI.sound?'':'on'}" data-act="sound" data-a="0">Off</button></div></div>
    <div class="panel"><h3>Appearance</h3><div class="seg">${[['auto','Match device'],['light','Light'],['dark','Dark']].map(([k,n])=>`<button class="${th===k?'on':''}" data-act="theme" data-a="${k}">${n}</button>`).join('')}</div></div>
    <div class="panel"><h3>About</h3><p class="small muted" style="margin:0">${esc(PACK.title)}. ${esc(PACK.about||'')} Everything in this world is fictional, and prices come from what simulated collectors are willing to pay.</p></div></div>` };
};
ACT.savenow=async()=>{ await saveGame(true); showToast(SAVES.err? 'Save failed.' : 'Saved.', !SAVES.err); refreshSheet(); };
ACT.exportsave=async()=>{ await saveGame(true); try { const x=await slotExportBlob(SLOT.id); downloadBlob(x.blob,x.name); const m=$('#savemsg'); if (m) m.innerHTML='<div class="ok">Backup downloaded.</div>'; } catch(e){ showToast(String(e&&e.message||e)); } };
ACT.slots=async()=>{ await saveGame(true); closeSheet(true); await showLauncher(); };
ACT.newgame=ACT.slots; ACT.importsave=async()=>{};

// ===================== APPLYING A GAME: TABS, FILTERS, SCREENS =====================
TABS.length=0; TABS.push(...PACK.tabs);
const _mfP=marketFiltered; marketFiltered=function(){ return _mfP().filter(l=> cardLineOfKind(l.it)? packHas('tcg') : l.it==='m'? packHas('comics') : PACK.worlds.sports!==false); };
const _mvP=VIEWS.market; VIEWS.market=()=>{ let h=_mvP(); if (PACK.id==='tcg' && UI.sub.market==='browse' && !/^(tc|xt)/.test(String(UI.mf.type))){ const q=_mvP(); const i=q.indexOf('<div class="chips"'); if (i>=0){ const j=q.indexOf('</div>',i)+6; const chip=(k,n)=>`<button class="chip ${UI.mf.type===k?'on':''}" data-act="mft" data-a="${k}">${n}</button>`; h=q.slice(0,i)+`<div class="chips" style="margin-bottom:10px">${chip('all','Everything')}${chip('tc','Wildkin')}${chip('xt','Tidemark')}</div>`+q.slice(j); h=h.replace('placeholder="Player, team, product, parallel..."','placeholder="Card, set, faction, rarity..."'); return h; } } if (!packHas('comics')) h=h.replace(/<button class="chip [^"]*" data-act="mft" data-a="cm">Comics<\/button>/,'');  return h; };
function packNews(n){ if (PACK.id==='sports') return n.k!=='comic' && n.k!=='tcg'; if (n.k==='hobby') return /YOUR STORY STARTS|A NEW COLLECTOR/.test(n.h||''); return PACK.id==='comics'? n.k==='comic' : isCardGameNews(n.k); }
const _brP=buildRecap; buildRecap=function(){ const r=_brP.apply(this,arguments); if (r&&r.other) r.other=r.other.filter(packNews); return r; };
const KEEP_KINDS={sports:['grade','market','cash','cards','hunt','breaks'], comics:['grade','market','comics','cash','hunt'], tcg:['grade','market','cash',...CARD_LINES.map(L=>L.news)]};
const _unP=upNext; upNext=function(){ return _unP().filter(x=>!x.kind || KEEP_KINDS[PACK.id].includes(x.kind)); };
// collection tabs: only what this game collects
if (PACK.id!=='tcg'){ const _cvP=VIEWS.coll; const hide= PACK.id==='sports'? ['comics','runs'] : ['cards','sealed','sets'];
  VIEWS.coll=()=>{ let h=_cvP(); for (const k of hide) h=h.replace(new RegExp('<button class="[^"]*" data-act="sub" data-a="coll:'+k+'">[^<]*</button>'),''); return h; }; }
// the comics game opens on the comics home
if (PACK.id==='comics'){ UI.sub.comics='home'; }
// ---- the card games (Wildkin, and Tidemark when it is in the build): own tabs, one shared home, collection and market ----
if (PACK.id==='tcg'){
  UI.tcs='shop'; UI.xts='shop'; UI.cg=UI.cg||'wk';
  // Prototype saves (made before the Version 1 cards) are kept exactly as they are and are never loaded into the Version 1 world:
  // their cards were prototype creatures that no longer exist. The launcher labels them and offers a backup or a new game.
  const _smn=slotMetaNow; slotMetaNow=function(){ const m=_smn(); if (G&&G.tcg) m.cv=G.tcg.cv||0; return m; };
  const tcLegacyMeta=m=>m&&m.day!=null&&!(m.cv>=TC_CV);
  const _scd=slotCard; slotCard=function(r){ const h=_scd(r); return tcLegacyMeta(r.meta)? h.replace('<span class="dim">','<span class="lleg">Prototype save, from before the First Bond cards. Kept as it is.</span><span class="dim">') : h; };
  const _sop=shellOpen; shellOpen=async function(id){ try { const x=await slotRead(id); const g=await unpackBytes(x.bytes,x.enc); if (tcIsLegacy(g)) return tcShowLegacy(x.rec); } catch(e){ console.warn(e); } return _sop(id); };
  window.tcShowLegacy=function(rec){ const el=launchEl(); el.innerHTML=`<div class="lwrap"><div class="lhead small"><h1>A prototype save</h1><p>${esc(rec.name)}</p></div>
    <div class="lmsg">This game was saved with the prototype Wildkin cards, before the Version 1 set (First Bond). Those prototype creatures were replaced, so this save cannot be played in this version. Nothing in it has been changed or deleted.</div>
    <p class="lnote">Download a backup to keep it. You can start a new First Bond game alongside it.</p>
    <div class="lrow"><button class="lbtn big" data-lact="export" data-id="${rec.id}">Download a backup</button></div><div class="lrow"><button class="lbtn" data-lact="new">Start a new game</button><button class="lbtn" data-lact="back">Back</button></div></div>`; };
  const _tcsP=ACT.tcs; ACT.tcs=a=>{ if (a==='coll'){ UI.tab='coll'; UI.sub.coll='cards'; render(true); return; } if (a==='home'){ UI.tab='home'; render(true); return; } if (UI.tab!=='shop') UI.tab='shop'; _tcsP(a); };
  VIEWS.shop=()=>`<div class="pagetitle"><h1>Wildkin</h1><span class="muted small">The card game</span></div>${tcView()}`;
  // ---- the second card game, Tidemark, lives in the same world: its own tab, and shared Home, Collection, Market, grading and wallet ----
  const HAS_XT=typeof xtView==='function';
  VIEWS.xt=()=>`<div class="pagetitle"><h1>Tidemark</h1><span class="muted small">The second card game</span></div>${xtView()}`;
  ICONS.xt='<path d="M3 8c3-3 6 3 9 0s6 3 9 0"/><path d="M3 14c3-3 6 3 9 0s6 3 9 0"/><path d="M3 20c3-3 6 3 9 0s6 3 9 0"/>';
  VIEWS.home=()=>{ const t=collectionTotals(); const n=rvQueue().length;
    const note=n?`<div class="note" style="display:flex;align-items:center;gap:10px;margin-bottom:12px"><b style="flex:1">${n} grading return${n>1?'s':''} waiting to be opened</b><button class="btn sm pri" data-act="rvstart">Open ${n>1?'them':'it'}</button></div>`:'';
    const sm=myTcSummary(), sx=HAS_XT? myXtSummary() : {n:0,g:0,s:0}; const est=rng2(t.total);
    const P=tcHomePanels(), Q=HAS_XT? xtHomePanels() : null; const W=x=>String(x||'').replace('<h3>The metagame this week</h3>','<h3>Wildkin: the metagame this week</h3>').replace('<h3>Latest results</h3>','<h3>Wildkin: latest results</h3>').replace('<h3>Collection goals</h3>','<h3>Wildkin: collection goals</h3>').replace('<h3>Your wantlist</h3>','<h3>Wildkin: your wantlist</h3>').replace('<h3>Ban coming</h3>','<h3>Wildkin: ban coming</h3>').replace('<h3>Next set: ','<h3>Wildkin next set: ');
    const T=x=>String(x||'').replace('<h3>The metagame this week</h3>','<h3>Tidemark: the metagame this week</h3>').replace('<h3>Latest results</h3>','<h3>Tidemark: latest results</h3>').replace('<h3>Collection goals</h3>','<h3>Tidemark: collection goals</h3>').replace('<h3>Your wantlist</h3>','<h3>Tidemark: your wantlist</h3>').replace('<h3>Ban coming</h3>','<h3>Tidemark: ban coming</h3>').replace('<h3>Next set: ','<h3>Tidemark next set: ');
    return `<div class="pagetitle"><h1>Home</h1><span class="muted small">${fmtDate(G.day,true)}</span></div>${note}<div class="kpis"><div class="kpi"><small>Cash</small><b>${money(G.player.cash)}</b></div><div class="kpi"><small>Collection estimate</small><b>${est}</b></div><div class="kpi"><small>Cards owned</small><b>${sm.n+sm.g+sx.n+sx.g}</b></div><div class="kpi"><small>Sealed product</small><b>${sm.s+sx.s}</b></div></div><div class="cols"><div class="stack">${upNextPanel()}${W(P.meta)}${Q?T(Q.meta):''}${W(P.results)}${Q?T(Q.results):''}</div><div class="stack">${W(P.next)}${Q?T(Q.next):''}${W(P.goals)}${Q?T(Q.goals):''}${W(P.want)}${Q?T(Q.want):''}${W(P.ban)}${Q?T(Q.ban):''}${P.hot||''}${Q?Q.hot||'':''}${P.news}${Q?Q.news:''}</div></div>`; };
  ACT.cg=a=>{ UI.cg=a; render(true); };
  VIEWS.coll=()=>{ const s=UI.sub.coll||'cards'; const tabs=[['cards','Cards'],['sets','Sets'],['grading','Grading'],['journal','Journal']]; const g=HAS_XT&&UI.cg==='xt'?'xt':'wk';
    const bar=`<div class="subtabs">${tabs.map(([k,n])=>`<button class="${s===k?'on':''}" data-act="sub" data-a="coll:${k}">${n}</button>`).join('')}</div>`; let body='';
    const games=HAS_XT&&(s==='cards'||s==='sets')? `<div class="chips" style="margin:0 0 10px"><button class="chip ${g==='wk'?'on':''}" data-act="cg" data-a="wk">Wildkin</button><button class="chip ${g==='xt'?'on':''}" data-act="cg" data-a="xt">Tidemark</button></div>` : '';
    if (s==='cards') body=g==='xt'? xtCollV() : tcCollV(); else if (s==='sets') body=g==='xt'? xtSetsV() : tcSetsV(); else if (s==='journal') body=journalView();
    else { const rows=[]; for (const x of (G.player.tsubs||[])){ const cp=TC(x.cid); if (cp) rows.push([x.t1,`<button class="row" data-act="tcopy" data-a="${cp.id}">${miniT(cp)}<div class="rt"><b>${esc(tcD(cp.k).title)}</b><span>Back ${fmtDate(x.t1)} · ${x.t1-G.day} day${x.t1-G.day===1?'':'s'}</span></div></button>`]); }
      if (HAS_XT) for (const x of (G.player.xsubs||[])){ const cp=XT(x.cid); if (cp) rows.push([x.t1,`<button class="row" data-act="xtopy" data-a="${cp.id}">${xMiniT(cp)}<div class="rt"><b>${esc(xtD(cp.k).title)}</b><span>Back ${fmtDate(x.t1)} · ${x.t1-G.day} day${x.t1-G.day===1?'':'s'}</span></div></button>`]); }
      body=`<div class="panel"><h3>At the grader</h3><div class="rows">${rows.sort((a,b)=>a[0]-b[0]).map(r=>r[1]).join('')||'<div class="empty">Nothing at the grader. Open a card from Cards and choose a service.</div>'}</div></div>`; }
    return `<div class="pagetitle"><h1>Collection</h1><span class="muted small">${sm0()}</span></div>${bar}${games}${body}`; };
  function sm0(){ const s=myTcSummary(), x=HAS_XT? myXtSummary() : {n:0,g:0,s:0}; return s.n+s.g+x.n+x.g+' cards, '+(s.s+x.s)+' sealed'; }
}

shellBoot();
