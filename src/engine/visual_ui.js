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
