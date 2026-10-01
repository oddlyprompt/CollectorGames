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
  if (!G.tcg){ await bootProg(0.5,'Opening the card game shop'); await upgradeTcg(async(f,m)=>bootProg(0.5+f*0.45,m)); migrate(); saveGame(true); }
  if (!G.hunt){ await bootProg(0.98,'Mapping the local hobby scene'); huntInit(); saveGame(true); }
  seedTracking();
  UI.booting=false; b.style.display='none'; render();
}
// the shell (launcher and save slots) starts the game now
