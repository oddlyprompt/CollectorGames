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
