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
