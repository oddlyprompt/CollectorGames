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
  let raw=0, now=0, fees=0; const rows=list.map(r=>{ const o=objFor(r.k,r.id); if (!o) return ''; const v=rvValue(r.k,o); raw+=r.raw||0; now+=v; fees+=r.fee||0; return `<button class="row" data-act="${r.k==='m'?'ccopy':r.k==='t'?'tcopy':'card'}" data-a="${r.id}">${r.k==='m'?miniComic(o):r.k==='t'?miniT(o):miniCard(o)}<div class="rt"><b>${esc(rvTitle(r.k,o))}</b><span>${esc(popLine(r.k,o))}</span></div><div class="rv"><b>${rvGradeTxt(r.k,r.g)}</b><span class="${v>=(r.raw||0)?'up':'down'}">${money(r.raw||0,true)} → ${money(v,true)}</span></div></button>`; }).join('');
  const net=now-raw-fees;
  return { t:'Grading results', h:`<div class="stack"><div class="kpis"><div class="kpi"><small>Returned</small><b>${list.length}</b></div><div class="kpi"><small>Raw estimate</small><b>${money(raw,true)}</b></div><div class="kpi"><small>Slabs now</small><b>${money(now,true)}</b></div><div class="kpi"><small>After fees</small><b class="${net>=0?'up':'down'}">${net>=0?'+':'−'}${money(Math.abs(net),true)}</b></div></div><div class="panel"><div class="rows">${rows}</div></div></div>` };
}
ACT.rvopen = ()=>{ const st=UI.rvl; if (!st || st.stage!==0) return; st.stage=1; rvRender(); };
ACT.rvnext = ()=>{ const st=UI.rvl; if (!st) return; st.i++; st.stage=0; rvRender(); };
ACT.rvclose = ()=>rvClose();
ACT.rvsummary = ()=>{ const st=UI.rvl; if (!st) return; const q=rvQueue(); for (const r of q) if (!st.done.includes(r.k+':'+r.id)) st.done.push(r.k+':'+r.id); st.i=q.length; rvRender(); };
ACT.rvdetail = a=>{ const [k,id]=a.split(':'); const st=UI.rvl; rvClose(); if (k==='m') ACT.ccopy(id); else if (k==='t') ACT.tcopy(id); else ACT.card(id); };
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
ACT.crack = (a,el)=>{ if (!armed(el)) return; const [k,id,re]=a.split(':'); const e = k==='m'? crackComic(+id) : k==='t'? crackTc(+id) : crackCard(+id); if (e){ showToast(e); return; }
  if (re==='1'){ const e2 = k==='m'? cmSubmitGrade(+id,'std',false) : k==='t'? tcSubmitGrade(+id,'std') : submitGrading(+id,'std'); if (e2){ showToast(e2); } else showToast('Cracked out and resubmitted. Fingers crossed.', true); } else showToast('Out of the slab. It\'s a raw '+(k==='m'?'comic':'card')+' again.', true);
  closeSheet(); render(true); queueSave(); };
cardSheet = (function(f){ return function(id){ const r=f(id); const c=C(id); if (!r || !c || c.o!==0) return r; const p=crackPanel('c',c); if (p){ const i=r.h.lastIndexOf('<div class="panel"><h3>History'); r.h = i>=0? r.h.slice(0,i)+p+r.h.slice(i) : r.h+p; } if (c.pg && c.g===0){ r.h=r.h.replace('<dl class="kv">','<p class="small muted" style="margin:0">Cracked from a GCS '+c.pg+' slab.</p><dl class="kv">'); } return r; }; })(cardSheet);
cmCopySheet = (function(f){ return function(id){ const r=f(id); const c=MC(id); if (!r || !c || c.o!==0) return r; const p=crackPanel('m',c); if (p){ const i=r.h.lastIndexOf('<div class="panel"><h3>History'); r.h = i>=0? r.h.slice(0,i)+p+r.h.slice(i) : r.h+p; } return r; }; })(cmCopySheet);
pcData = (function(f){ return function(kind,o){ const r=f(kind,o); if (o.g>0){ const pl=popLine(kind,o); if (pl) r.meta.push(['Population', pl]); } return r; }; })(pcData);
// waiting returns are visible from Home and the Grading page
(function(){ const hv=VIEWS.home; VIEWS.home=()=>{ const h=hv(); const n=rvQueue().length; if (!n) return h; const i=h.indexOf('<div class="kpis">'); const b=`<div class="note" style="display:flex;align-items:center;gap:10px;margin-bottom:12px"><b style="flex:1">${n} grading return${n>1?'s':''} waiting to be opened</b><button class="btn sm pri" data-act="rvstart">Open ${n>1?'them':'it'}</button></div>`; return i<0? b+h : h.slice(0,i)+b+h.slice(i); }; })();
(function(){ const gv=VIEWS.grade; VIEWS.grade=()=>{ const h=gv(); const n=rvQueue().length; if (!n) return h; const i=h.indexOf('<div class="kpis">'); const b=`<div class="note" style="display:flex;align-items:center;gap:10px;margin-bottom:12px"><b style="flex:1">${n} return${n>1?'s':''} waiting to be opened</b><button class="btn sm pri" data-act="rvstart">Open ${n>1?'them':'it'}</button></div>`; return i<0? b+h : h.slice(0,i)+b+h.slice(i); }; })();
