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
  const last=box.lastElementChild; if (last && last.dataset.m===msg){ const n=(+last.dataset.n||1)+1; last.dataset.n=n; last.textContent=msg; const c=document.createElement('i'); c.textContent='×'+n; last.appendChild(c); clearTimeout(last._t); last._t=setTimeout(()=>last.remove(),3800); return; }   // the same message again: count it instead of stacking
  const t=document.createElement('div'); t.className='toast'+(good?' good':''); t.dataset.m=msg; t.textContent=msg; box.appendChild(t);
  while (box.children.length>3) box.firstChild.remove();
  t._t=setTimeout(()=>t.remove(), 3800);
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
