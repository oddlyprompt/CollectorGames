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
