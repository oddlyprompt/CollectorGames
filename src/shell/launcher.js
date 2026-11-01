// ===================== LAUNCHER =====================
function ago(ts){ const m=Math.max(0,Math.round((Date.now()-ts)/60000)); if (m<1) return 'just now'; if (m<60) return m+' min ago'; const h=Math.round(m/60); if (h<24) return h+' hour'+(h>1?'s':'')+' ago'; const d=Math.round(h/24); return d+' day'+(d>1?'s':'')+' ago'; }
function launchEl(){ let el=document.getElementById('launch'); if (!el){ el=document.createElement('div'); el.id='launch'; el.className='launch'; el.setAttribute('role','dialog'); el.setAttribute('aria-label',PACK.title); document.body.appendChild(el); el.addEventListener('click',launchClick); el.addEventListener('change',launchChange); } document.body.classList.add('noscroll'); return el; }
function closeLauncher(){ const el=document.getElementById('launch'); if (el) el.remove(); document.body.classList.remove('noscroll'); }
function slotCard(r){ const m=r.meta||{}; const when=m.day!=null? fmtDate(m.day,true) : 'New'; return `<div class="lslot"><button class="lslot-main" data-lact="open" data-id="${r.id}"><b>${esc(r.name)}</b><span>${when}${m.nw!=null?' · worth about '+money(m.nw):''}</span><span class="dim">${esc(m.scn||'')}${m.scn?' · ':''}played ${ago(r.updated)}</span></button><div class="lslot-act"><button data-lact="export" data-id="${r.id}" aria-label="Download backup of ${esc(r.name)}">Backup</button><button data-lact="rename" data-id="${r.id}">Rename</button><button class="danger" data-lact="delete" data-id="${r.id}">Delete</button></div></div>`; }
async function showLauncher(msg){
  const el=launchEl(); let slots=[]; let err=''; try { slots=await slotList(PACK.id); } catch(e){ err=String(e&&e.message||e); }
  const last=slots[0];
  el.innerHTML=`<div class="lwrap"><div class="lhead"><div class="llogo" style="background:${PACK.accent}"></div><h1>${esc(PACK.title)}</h1><p>${esc(PACK.tagline)}</p></div>
    ${PACK.id==='tcg'?'<div class="lgames"><div class="lgame" style="background-image:url(art/scene.verdant.01.jpg);--c:134,207,116"><b>Wildkin</b><small>Creatures</small></div><div class="lgame" style="background-image:url(art/TMI-0040.webp);--c:71,192,180"><b>Tidemark</b><small>Land and sea</small></div><div class="lgame" style="background-image:url(art/br-BR01-001.webp);--c:208,143,82"><b>Broken Reach</b><small>Space opera</small></div></div>':''}
    ${err?`<div class="lmsg err">${esc(err)}</div>`:''}${msg?`<div class="lmsg">${esc(msg)}</div>`:''}
    ${''}
    ${last?`<button class="lbtn big" data-lact="open" data-id="${last.id}">Continue<small>${esc(last.name)} · ${last.meta&&last.meta.day!=null?fmtDate(last.meta.day,true):''}</small></button>`:''}
    <div class="lrow"><button class="lbtn ${last?'':'big'}" data-lact="new">${last?'New game':'Start a new game'}</button><label class="lbtn" style="cursor:pointer">Import a save<input type="file" id="limport" accept=".ccsave,.txt,.json" hidden></label></div>
    ${slots.length?`<h2 class="lh2">Your games</h2><div class="lslots">${slots.map(slotCard).join('')}</div>`:'<p class="lnote">No saved games yet. Each game you start gets its own slot, so you can run several at once.</p>'}
    ${PACK.id==='tcg'?'<a class="lsub" href="broken-reach/">Early prototype: <b>The Broken Reach battler</b> (separate from your collection)</a>':''}
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
