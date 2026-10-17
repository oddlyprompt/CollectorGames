// ===================== APPLYING A GAME: TABS, FILTERS, SCREENS =====================
TABS.length=0; TABS.push(...PACK.tabs);
const _mfP=marketFiltered; marketFiltered=function(){ return _mfP().filter(l=> l.it==='t'? packHas('tcg') : l.it==='m'? packHas('comics') : PACK.worlds.sports!==false); };
const _mvP=VIEWS.market; VIEWS.market=()=>{ let h=_mvP(); if (!packHas('comics')) h=h.replace(/<button class="chip [^"]*" data-act="mft" data-a="cm">Comics<\/button>/,''); if (PACK.id==='tcg') h=h.replace(/<button class="chip[^"]*" data-act="mft" data-a="all">← All listings<\/button>/,''); return h; };
function packNews(n){ if (PACK.id==='sports') return n.k!=='comic' && n.k!=='tcg'; if (n.k==='hobby') return /YOUR STORY STARTS|A NEW COLLECTOR/.test(n.h||''); return PACK.id==='comics'? n.k==='comic' : n.k==='tcg'; }
const _brP=buildRecap; buildRecap=function(){ const r=_brP.apply(this,arguments); if (r&&r.other) r.other=r.other.filter(packNews); return r; };
const KEEP_KINDS={sports:['grade','market','cash','cards','hunt','breaks'], comics:['grade','market','comics','cash','hunt'], tcg:['grade','market','cash','tcg']};
const _unP=upNext; upNext=function(){ return _unP().filter(x=>!x.kind || KEEP_KINDS[PACK.id].includes(x.kind)); };
// collection tabs: only what this game collects
if (PACK.id!=='tcg'){ const _cvP=VIEWS.coll; const hide= PACK.id==='sports'? ['comics','runs'] : ['cards','sealed','sets'];
  VIEWS.coll=()=>{ let h=_cvP(); for (const k of hide) h=h.replace(new RegExp('<button class="[^"]*" data-act="sub" data-a="coll:'+k+'">[^<]*</button>'),''); return h; }; }
// the comics game opens on the comics home
if (PACK.id==='comics'){ UI.sub.comics='home'; }
// ---- the Wildkin game: its own home, shop and collection ----
if (PACK.id==='tcg'){
  UI.tcs='shop';
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
  VIEWS.home=()=>{ const t=collectionTotals(); const n=rvQueue().length;
    const note=n?`<div class="note" style="display:flex;align-items:center;gap:10px;margin-bottom:12px"><b style="flex:1">${n} grading return${n>1?'s':''} waiting to be opened</b><button class="btn sm pri" data-act="rvstart">Open ${n>1?'them':'it'}</button></div>`:'';
    const sm=myTcSummary(); const est=rng2(t.total);
    return `<div class="pagetitle"><h1>Home</h1><span class="muted small">${fmtDate(G.day,true)}</span></div>${note}<div class="kpis"><div class="kpi"><small>Cash</small><b>${money(G.player.cash)}</b></div><div class="kpi"><small>Collection estimate</small><b>${est}</b></div><div class="kpi"><small>Cards owned</small><b>${sm.n+sm.g}</b></div><div class="kpi"><small>Sealed product</small><b>${sm.s}</b></div></div>${(()=>{ const P=tcHomePanels(); return `<div class="cols"><div class="stack">${upNextPanel()}${P.meta}${P.results}</div><div class="stack">${P.next}${P.goals||''}${P.want||''}${P.ban}${P.hot}${P.news}</div></div>`; })()}`; };
  VIEWS.coll=()=>{ const s=UI.sub.coll||'cards'; const tabs=[['cards','Cards'],['sets','Sets'],['grading','Grading'],['journal','Journal']];
    const bar=`<div class="subtabs">${tabs.map(([k,n])=>`<button class="${s===k?'on':''}" data-act="sub" data-a="coll:${k}">${n}</button>`).join('')}</div>`; let body='';
    if (s==='cards') body=tcCollV(); else if (s==='sets') body=tcSetsV(); else if (s==='journal') body=journalView();
    else { const subs=G.player.tsubs||[]; body=`<div class="panel"><h3>At the grader</h3><div class="rows">${subs.map(x=>{ const cp=TC(x.cid); return cp?`<button class="row" data-act="tcopy" data-a="${cp.id}">${miniT(cp)}<div class="rt"><b>${esc(tcD(cp.k).title)}</b><span>Back ${fmtDate(x.t1)} · ${x.t1-G.day} day${x.t1-G.day===1?'':'s'}</span></div></button>`:''; }).join('')||'<div class="empty">Nothing at the grader. Open a card from Cards and choose a service.</div>'}</div></div>`; }
    return `<div class="pagetitle"><h1>Collection</h1><span class="muted small">${sm0()}</span></div>${bar}${body}`; };
  function sm0(){ const s=myTcSummary(); return s.n+s.g+' cards, '+s.s+' sealed'; }
}
