// The Broken Reach: Play Alpha (UI). Uses the headless resolver (BR_E) and AI (BR_AI) unchanged.  Everything here is separate from the
// CollectorGames saves: the only storage used is localStorage key 'br_alpha_v1' (custom decks and settings).
'use strict';
const E=window.BR_E, AI=window.BR_AI, DATA=window.BR_DATA;
E.loadCards(DATA.cards);
const UNITS=DATA.cards.filter(c=>c.type!=='planet'), UNIT_IDS=UNITS.map(c=>c.base_card_id);
const PLAYABLE_PLANETS=['BR01-173','BR01-179','BR01-177'];
const PLANET_COL={'BR01-173':['#b98a4a','#2c1c0e'],'BR01-179':['#7d8a99','#1a2028'],'BR01-177':['#9a5ec4','#1c1030']};
const RULESETS=[{id:'std',name:'Standard (rules v0.2)',desc:'Exactly the handoff rules. The second player has a measured advantage.',rules:{}},
  ...DATA.rulesets];
const LEVELS=[['easy','Easy','Sometimes plays a weak or random move.'],['standard','Standard','Looks one reply ahead against sampled hands.'],['hard','Hard','Wider search, more samples. Never sees your hand.']];
const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const clone=o=>JSON.parse(JSON.stringify(o));
const AFF={'Free Captains':['#9b6b22','#2b1d0a'],'Veyne Exchange':['#8a2a3a','#260c13'],'Concordance Remnant':['#3f6b8f','#0f1b27'],'Veyr Consortium':['#6d5a8f','#1a1426'],'Independent':['#4f7a62','#10201a'],'Quiet Assembly':['#3d8a96','#0d1f24']};
const RARC={C:'#8a929c',U:'#5fb36a',R:'#4f9fe0',SR:'#b070e0',L:'#e2a43a'}, RARN={C:'Common',U:'Uncommon',R:'Rare',SR:'Super Rare',L:'Legendary'};
const ICON={'Ship':'<path d="M50 8 L74 78 L50 64 L26 78 Z"/><path d="M50 24 V54"/>','Character':'<circle cx="50" cy="32" r="14"/><path d="M20 86 C20 58 80 58 80 86 Z"/>','Crew & Military':'<path d="M50 10 L82 22 V48 C82 68 66 80 50 90 C34 80 18 68 18 48 V22 Z"/>','Drone & Creature':'<path d="M50 12 L84 32 V68 L50 88 L16 68 V32 Z"/><circle cx="50" cy="50" r="10"/>','Tech Unit':'<circle cx="50" cy="50" r="16"/><path d="M50 10V28M50 72V90M10 50H28M72 50H90M22 22L35 35M65 65L78 78M78 22L65 35M35 65L22 78"/>','Planet':'<circle cx="50" cy="50" r="26"/><ellipse cx="50" cy="50" rx="44" ry="12" transform="rotate(-22 50 50)"/>'};
const TYPE_SHORT={'Ship':'Ship','Character':'Char','Crew & Military':'Crew','Drone & Creature':'Drone','Tech Unit':'Tech'};
const DIRN=['N','NE','E','SE','S','SW','W','NW'], POS=[[50,0],[100,0],[100,50],[100,100],[50,100],[0,100],[0,50],[0,0]];
const cellName=c=>'ABCD'[c&3]+((c>>2)+1);
// ---------- storage ----------
let ST={decks:[],sel:{deck:'dockside',planet:'BR01-173',level:'easy',rule:'komi2'},speed:'1',help:false,preview:true};
try { const j=JSON.parse(localStorage.getItem('br_alpha_v1')||'null'); if (j) ST=Object.assign(ST,j,{sel:Object.assign(ST.sel,j.sel||{})}); } catch(e){}
function save(){ try { localStorage.setItem('br_alpha_v1',JSON.stringify(ST)); } catch(e){} }
function allDecks(){ return DATA.presets.map(d=>({id:d.id,name:d.name,blurb:d.blurb,cards:d.cards,preset:true})).concat(ST.decks.map(d=>({id:d.id,name:d.name,blurb:'Your deck',cards:d.cards,preset:false}))); }
function deckById(id){ return allDecks().find(d=>d.id===id)||allDecks()[0]; }
function deckValid(cards){ if (cards.length!==20) return 'needs 20 cards (has '+cards.length+')'; const n={}; for (const c of cards){ n[c]=(n[c]||0)+1; if (n[c]>2) return 'max 2 copies of a card'; } return ''; }
function deckStats(cards){ const d=cards.map(E.def), n=Math.max(1,d.length); return {atk:d.reduce((a,c)=>a+c.atk,0)/n,grd:d.reduce((a,c)=>a+c.grd,0)/n,arr:d.reduce((a,c)=>a+E.pop(c.mask),0)/n}; }
// ---------- card drawing ----------
function arrowsHtml(mask,extra){ let h=''; for (let i=0;i<8;i++){ const on=(mask>>i&1)||(extra>>i&1); h+=`<i class="ar ${on?'on':''} ${(extra>>i&1)&&!(mask>>i&1)?'add':''}" style="left:${POS[i][0]}%;top:${POS[i][1]}%;--d:${i}"></i>`; } return h; }
function cardHtml(def,o={}){ // def: card definition; o: {owner, mask, extra, atk, grd, cls, attrs}
  const af=AFF[def.aff]||['#556','#222'], mask=o.mask!=null?o.mask:def.mask, ab=def.ops&&def.ops.length&&def.type!=='planet';
  const ea=o.atk!=null?o.atk:def.atk, eg=o.grd!=null?o.grd:def.grd;
  const cmp=(e,b)=>e>b?'up':e<b?'dn':'';
  return `<div class="bcard ${o.cls||''}" data-o="${o.owner==null?'n':o.owner}" style="--a1:${af[0]};--a2:${af[1]};--rc:${RARC[def.rar]}" ${o.attrs||''}>${arrowsHtml(mask,o.extra||0)}
    <div class="art"><svg viewBox="0 0 100 100">${ICON[def.typeName]||''}</svg></div><span class="ty">${TYPE_SHORT[def.typeName]||''}</span><span class="rar"></span>
    <div class="nm">${esc(def.name.split(' — ')[0])}</div><div class="st"><span class="a ${cmp(ea,def.atk)}"><small>A</small>${ea}</span>${ab?'<span class="ab">◆</span>':''}<span class="g ${cmp(eg,def.grd)}"><small>G</small>${eg}</span></div></div>`;
}
function unitHtml(S,u,cell,cls,attrs){ const d=E.def(u.cid); return cardHtml(d,{owner:u.owner,mask:u.mask,extra:u.tmp.extra,atk:E.attackOf(S,u,cell,0,{cid:u.cid}),grd:E.guardOf(S,u,cell,null),cls,attrs}); }
function arrowDiagram(mask){ const g=[[7,0,1],[6,-1,2],[5,4,3]]; return `<div style="display:grid;grid-template-columns:repeat(3,26px);gap:3px;justify-content:center;margin:6px 0">${g.flat().map(i=>i<0?'<div style="width:26px;height:26px;background:#222a32;border-radius:3px"></div>':`<div style="width:26px;height:26px;border-radius:3px;display:flex;align-items:center;justify-content:center;font-size:11px;background:${mask>>i&1?'var(--amber)':'#222a32'};color:${mask>>i&1?'#1a1205':'#566'}">${DIRN[i]}</div>`).join('')}</div>`; }
function detailHtml(id,opts={}){ if (!id) return '<div class="detail empty">Tap a card to see its arrows, stats and ability.</div>'; const d=E.def(id), p=d.type==='planet';
  return `<div class="detail"><h3>${esc(d.name)}</h3><div class="meta">${esc(d.typeName)} · ${esc(d.aff)} · <span style="color:${RARC[d.rar]}">${RARN[d.rar]}</span> · ${esc(d.id||d.base_card_id)}</div>
   <div class="big">${p?`<span class="orb" style="--c1:${(PLANET_COL[id]||['#888','#222'])[0]};--c2:${(PLANET_COL[id]||['#888','#222'])[1]};width:84px;height:84px"></span>`:cardHtml(d,{owner:opts.owner,cls:'insp'})}<div class="kv">${p?'':`<div>Attack <b>${d.atk}</b> · Guard <b>${d.grd}</b></div>${arrowDiagram(d.mask)}`}</div></div>
   ${d.text?`<div class="txt">${esc(d.text)}</div>`:'<div class="txt dim">No ability.</div>'}<div class="kv">${esc(d.role||'')} · ${esc(d.era||'')}</div><div class="legend">Placeholder illustration. Approved artwork is pending, stats and abilities are provisional.</div></div>`; }
function toast(m){ const t=document.createElement('div'); t.className='toast'; t.textContent=m; document.body.appendChild(t); setTimeout(()=>t.remove(),2200); }
function planetOrb(id,small){ const c=PLANET_COL[id]||['#888','#222']; return `<span class="orb" style="--c1:${c[0]};--c2:${c[1]}"></span>`; }

// ---------- screens ----------
const root=()=>$('#br'); let scr='menu', SETUP=null;
function show(name){ scr=name; if (name==='menu') menu(); else if (name==='setup') setup(); else if (name==='decks') decksScreen(); else if (name==='build') buildScreen(); else if (name==='match') matchScreen(); window.scrollTo(0,0); }
function menu(){ root().innerHTML=`<div class="scr"><div class="title"><h1>The <b>Broken</b> Reach</h1><div class="tag">A tactical card battler across the collapsed Lattice</div><div class="alpha">Play Alpha · Set 01 · rules v0.2</div></div>
  <div class="menu"><button class="btn pri" data-act="play">Play a match</button><button class="btn" data-act="decks">Decks and cards</button><button class="btn" data-act="help">How to play</button><a class="btn" href="../" style="text-align:center;text-decoration:none;color:inherit">Back to Trading Card Collector</a></div>
  <div class="note">Prototype build. All 172 unit cards and 8 planets are unlocked for testing, with placeholder illustrations. Nothing here touches your CollectorGames saves or collection; custom decks live in this browser only. Stats, abilities and the fairness rules are provisional.</div></div>`; }
function setup(){
  if (!SETUP) SETUP={}; const ds=allDecks(); if (!ds.some(d=>d.id===ST.sel.deck)) ST.sel.deck=ds[0].id;
  const dopts=ds.map(d=>{ const bad=deckValid(d.cards), s=deckStats(d.cards); return `<button class="opt ${d.id===ST.sel.deck?'on':''}" data-act="seldeck" data-id="${d.id}" ${bad?'disabled':''}><b>${esc(d.name)} <em>${d.preset?'PRESET':'CUSTOM'}</em></b><span>${esc(bad||d.blurb)}</span><span class="mute">Avg Attack ${s.atk.toFixed(1)} · Guard ${s.grd.toFixed(1)} · arrows ${s.arr.toFixed(1)}</span></button>`; }).join('');
  const popts=PLAYABLE_PLANETS.map(id=>{ const d=E.def(id); return `<button class="planet ${ST.sel.planet===id?'on':''}" data-act="selplanet" data-id="${id}">${planetOrb(id)}<div><b>${esc(d.name.split(' — ')[0])}</b><span>${esc(d.text)}</span></div></button>`; }).join('')+`<button class="planet ${ST.sel.planet==='none'?'on':''}" data-act="selplanet" data-id="none"><span class="orb" style="--c1:#444;--c2:#111"></span><div><b>Open space</b><span>No planet effect.</span></div></button>`;
  const seg=(items,cur,act)=>`<div class="seg">${items.map(([k,n])=>`<button class="${cur===k?'on':''}" data-act="${act}" data-id="${k}">${n}</button>`).join('')}</div>`;
  root().innerHTML=`<div class="scr"><div class="topbar"><button class="btn sm" data-act="menu">‹ Menu</button><div class="sp"></div></div><h2>Match setup</h2><hr class="rule">
   <div class="cols"><div><div class="panel"><h3>Your deck</h3>${dopts}<button class="btn sm" data-act="decks">Edit decks…</button></div></div>
   <div><div class="panel" style="margin-bottom:14px"><h3>Planet</h3><div class="planet-row">${popts}</div></div>
   <div class="panel"><h3>Opponent</h3>${seg(LEVELS.map(l=>[l[0],l[1]]),ST.sel.level,'sellevel')}<p class="small dim" style="margin:8px 0 14px">${LEVELS.find(l=>l[0]===ST.sel.level)[2]} The opponent uses one of the preset decks. No hidden stat bonuses.</p>
   <h3>Turn-order rule</h3>${seg(RULESETS.map(r=>[r.id,r.name.split(' (')[0]]),ST.sel.rule,'selrule')}<p class="small dim" style="margin:8px 0 0">${esc(RULESETS.find(r=>r.id===ST.sel.rule).desc)}</p></div></div></div>
   <div class="menu" style="margin-top:18px"><button class="btn pri" data-act="start">Start match</button></div></div>`; }
function decksScreen(){
  const ds=allDecks(); root().innerHTML=`<div class="scr"><div class="topbar"><button class="btn sm" data-act="menu">‹ Menu</button><div class="sp"></div><button class="btn sm pri" data-act="newdeck">+ New deck</button></div><h2>Decks</h2><hr class="rule">
   ${ds.map(d=>{ const s=deckStats(d.cards), bad=deckValid(d.cards); return `<div class="panel" style="margin-bottom:10px"><b style="font-size:18px">${esc(d.name)}</b> <em class="dim small">${d.preset?'preset':'custom'}</em><div class="small dim">${esc(bad||d.blurb)} · Attack ${s.atk.toFixed(1)}, Guard ${s.grd.toFixed(1)}, arrows ${s.arr.toFixed(1)}</div><div class="row" style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap"><button class="btn sm" data-act="${d.preset?'copydeck':'editdeck'}" data-id="${d.id}">${d.preset?'Copy to edit':'Edit'}</button>${d.preset?`<button class="btn sm" data-act="viewdeck" data-id="${d.id}">View</button>`:`<button class="btn sm dng" data-act="deldeck" data-id="${d.id}">Delete</button>`}<button class="btn sm pri" data-act="usedeck" data-id="${d.id}" ${bad?'disabled':''}>Play with it</button></div></div>`; }).join('')}
   <div class="note">The deckbuilder offers every card in the prototype catalogue. A deck is exactly 20 unit cards with at most 2 copies of each (a prototype rule; the handoff leaves copy limits open). Planets are chosen per match.</div></div>`; }
let DB=null;
function buildScreen(){
  const d=DB, n=d.cards.length, bad=deckValid(d.cards), cnt={}; d.cards.forEach(c=>cnt[c]=(cnt[c]||0)+1);
  const f=d.f, list=UNITS.filter(c=>(!f.q||c.name.toLowerCase().includes(f.q.toLowerCase())||(c.text||'').toLowerCase().includes(f.q.toLowerCase()))&&(!f.t||c.typeName===f.t)&&(!f.a||c.aff===f.a)&&(!f.r||c.rar===f.r)&&(!f.ar||E.pop(c.mask)===+f.ar)).sort((a,b)=>f.s==='atk'?b.atk-a.atk:f.s==='grd'?b.grd-a.grd:f.s==='arr'?E.pop(b.mask)-E.pop(a.mask):a.base_card_id.localeCompare(b.base_card_id));
  const row=(c,q,inDeck)=>`<div class="row-card">${cardHtml(c,{owner:'n'})}<div class="info" data-act="inspect" data-id="${c.base_card_id}"><b>${esc(c.name.split(' — ')[0])}</b><span>${TYPE_SHORT[c.typeName]} · ${esc(c.aff)} · A${c.atk} G${c.grd} · ${E.pop(c.mask)} arrows${c.ops.length?' · ◆':''}</span></div><span class="qty">${q||''}</span>${inDeck?`<button class="btn b" data-act="rm" data-id="${c.base_card_id}">−</button>`:''}<button class="btn b pri" data-act="add" data-id="${c.base_card_id}" ${n>=20||q>=2?'disabled':''}>+</button></div>`;
  const dl=Object.keys(cnt).map(E.def).sort((a,b)=>a.atk-b.atk||a.name.localeCompare(b.name));
  const st=deckStats(d.cards), types=['Ship','Character','Crew & Military','Drone & Creature','Tech Unit'];
  const opts=(arr,cur,all)=>`<option value="">${all}</option>`+arr.map(x=>`<option ${cur===x?'selected':''}>${esc(x)}</option>`).join('');
  root().innerHTML=`<div class="scr"><div class="topbar"><button class="btn sm" data-act="decks">‹ Decks</button><div class="sp"></div><span class="cnt ${n===20&&!bad?'full':'bad'}">${n}/20</span><button class="btn sm pri" data-act="savedeck" ${bad?'disabled':''}>Save</button></div>
  <div class="dbhead"><input type="text" id="dname" value="${esc(d.name)}" maxlength="30" aria-label="Deck name"><span class="small dim">${esc(bad)}</span></div>
  <div class="tabsw"><button class="btn ${d.tab==='cat'?'on':''}" data-act="dtab" data-id="cat">Catalogue</button><button class="btn ${d.tab==='dk'?'on':''}" data-act="dtab" data-id="dk">Deck (${n})</button></div>
  <div class="dbgrid tabs"><div class="cat ${d.tab==='cat'?'':'off'}"><div class="filters"><input id="fq" placeholder="Search name or ability" value="${esc(f.q)}"><select id="ft">${opts(types,f.t,'All types')}</select><select id="fa">${opts(Object.keys(AFF),f.a,'All factions')}</select><select id="fr"><option value="">All rarities</option>${['C','U','R','SR','L'].map(r=>`<option value="${r}" ${f.r===r?'selected':''}>${RARN[r]}</option>`).join('')}</select><select id="far"><option value="">Any arrows</option>${[2,3,4,5].map(r=>`<option ${f.ar==r?'selected':''}>${r}</option>`).join('')}</select><select id="fs">${[['id','Sort: number'],['atk','Attack'],['grd','Guard'],['arr','Arrows']].map(([k,t])=>`<option value="${k}" ${f.s===k?'selected':''}>${t}</option>`).join('')}</select></div>
  <div class="list">${list.map(c=>row(c,cnt[c.base_card_id]||0,false)).join('')||'<div class="note">No cards match.</div>'}</div></div>
  <div class="dk ${d.tab==='dk'?'':'off'}"><div class="dstats"><span>Attack <b>${st.atk.toFixed(2)}</b></span><span>Guard <b>${st.grd.toFixed(2)}</b></span><span>Arrows <b>${st.arr.toFixed(2)}</b></span>${types.map(t=>`<span>${TYPE_SHORT[t]} <b>${d.cards.filter(c=>E.def(c).typeName===t).length}</b></span>`).join('')}</div><div class="list">${dl.map(c=>row(c,cnt[c.base_card_id],true)).join('')||'<div class="note">Add cards from the catalogue.</div>'}</div></div></div></div>`;
  if (DB.focus){ const el=$('#'+DB.focus); if (el){ el.focus(); const v=el.value; el.value=''; el.value=v; } DB.focus=null; }
}
function inspectOverlay(id){ const o=document.createElement('div'); o.className='ov'; o.dataset.act='closeov'; o.innerHTML=`<div class="dlg" data-stop="1">${detailHtml(id)}<div class="row"><button class="btn pri" data-act="closeov">Close</button></div></div>`; document.body.appendChild(o); }
function helpOverlay(){ const o=document.createElement('div'); o.className='ov'; o.innerHTML=`<div class="dlg help" data-stop="1"><h2>How to play</h2><ul><li>Two players share a <b>4×4 board</b>. Each deck is 20 units; you start with 5 cards in hand and draw one at the start of each of your turns. Each player places 8 cards, so the board fills on the 16th placement.</li>
 <li>Every card has up to eight <b>arrows</b> (N, NE, E, SE, S, SW, W, NW). When you place a card, each arrow that points at an adjacent <b>enemy</b> card makes a challenge.</li>
 <li>A challenge wins if your <b>Attack</b> is higher than the <b>defender's Guard</b> (+1 if they have an arrow pointing back at you). Guard only matters when you are the one being challenged. Equal is a failed challenge, so a defender with Guard 4 (5 with a pointing-back arrow) is safe from Attack 4 and below. Nothing is destroyed: a captured card simply changes owner.</li>
 <li>A captured card <b>immediately attacks with its own arrows</b>, so one placement can cause a chain reaction. A card can change owner only once per placement.</li>
 <li>When the board is full, whoever controls more cards wins. 8–8 is a draw.</li>
 <li>A <b>planet</b> applies one effect to both players. Cards marked ◆ have an ability; tap any card to read it.</li>
 <li>Tap a card in your hand, then a glowing square. A preview shows what you would capture; tap the square again (or Confirm) to place it.</li></ul><div class="row"><button class="btn pri" data-act="closeov">Got it</button></div></div>`; document.body.appendChild(o); }

// ---------- match ----------
let M=null;
function newSeed(){ return (Math.random()*2147483647)|0; }
function startMatch(cfg){
  const rs=RULESETS.find(r=>r.id===cfg.rule)||RULESETS[0], foeDecks=DATA.presets.filter(d=>d.id!==cfg.deckId); const foe=foeDecks[Math.floor(Math.random()*foeDecks.length)]||DATA.presets[0];
  const seed=newSeed(); M={cfg,seed,rng:E.mulberry32(seed^0x5bd1e995),deckName:deckById(cfg.deckId).name,foeName:foe.name,level:cfg.level,rs,busy:false,sel:null,pend:null,hover:null,insp:null,speed:ST.speed,fx:{},hl:{},pops:{},chain:0,stat:{caps:0,best:0,gens:0},log:[],over:false,done:false,waiters:[],skip:false};
  M.first=cfg.first!=null?cfg.first:(Math.random()<0.5?0:1); M.planet=cfg.planet==='none'?null:cfg.planet;
  M.S=E.newMatch({deckA:deckById(cfg.deckId).cards,deckB:foe.cards,planet:M.planet,seed,first:M.first,rules:rs.rules}); M.disp=M.S; 
  show('match'); nextTurn();   // the engine deals the opening hands; the second player draws before their first turn
}
function matchScreen(){ root().innerHTML=`<div class="scr" style="padding-top:10px"><div class="topbar" id="mtop"></div><div class="match"><div class="main"><div id="mscore"></div><div id="mfoe"></div><div class="boardwrap" id="mboard"></div><div class="status" id="mstatus"></div><div class="hand" id="mhand"></div></div><div class="side"><div id="mdetail"></div><div class="logbox" id="mlog"></div></div></div></div>`; renderMatch(); }
function legalByCell(){ const by={}; for (const m of E.legalMoves(M.S)) if (!M.sel||m.cid===M.sel) (by[m.cell]=by[m.cell]||[]).push(m); return by; }   // only the selected card's moves
function myTurn(){ return !M.busy && !M.S.over && M.S.cur===0; }
function preview(mv){ const r=E.applyMove(M.S,mv), caps={}, tags={}; r.events.forEach(e=>{ if(e.t==='capture') caps[e.cell]=e.gen; if(e.t==='challenge'&&e.from===mv.cell) tags[e.to]={atk:e.atk,grd:e.grd,win:e.win}; }); return {caps,tags,n:Object.keys(caps).length,gens:r.stats.maxGen,score:E.final(r.state)}; }
const tagHtml=t=>`<span class="pvtag ${t.win?'w':'l'}">${t.atk} ${t.win?'&gt;':'≤'} ${t.grd}</span>`;
function renderMatch(){
  if (scr!=='match'||!M) return; const S=M.disp, real=M.S, you=0; const sc=E.score(S); const bonus=real.rules&&real.rules.komi?real.rules.komi:0; const by=myTurn()&&M.sel?legalByCell():{}; const pd=M.pend; const pv=pd&&ST.preview?preview(pd):null;
  const pl=real.planet?E.def(real.planet):null;
  $('#mtop').innerHTML=`<button class="btn sm" data-act="mmenu">‹ Menu</button><button class="btn sm" data-act="mrestart">Restart</button><div class="pchip">${pl?planetOrb(real.planet)+'<div><b>'+esc(pl.name.split(' — ')[0])+'</b><br><span class="dim">'+esc(pl.text)+'</span></div>':'<span class="dim">Open space · no planet effect</span>'}</div><div class="sp"></div><div class="seg" title="Animation speed">${[['1','1×'],['2','2×'],['0','Instant']].map(([k,n])=>`<button class="${ST.speed===k?'on':''}" data-act="speed" data-id="${k}">${n}</button>`).join('')}</div><button class="btn sm" data-act="help">?</button>`;
  $('#mscore').innerHTML=`<div class="score"><div class="side you"><span class="n">${sc[0]}</span><span class="lbl">You<br>${esc(M.deckName)}</span></div><span class="turn ${real.over?'':real.cur===0?'you':'foe'}">${real.over?'Final':real.cur===0?'Your turn':'Opponent'} · ${Math.min(16,real.turn+(real.over?0:1))}/16</span><div class="side foe"><span class="n">${sc[1]}</span><span class="lbl">${LEVELS.find(l=>l[0]===M.level)[1]} AI<br>${esc(M.foeName)}</span></div></div>`;
  $('#mscore').innerHTML+=bonus?`<div class="small dim" style="text-align:center;margin:-4px 0 6px">First-move bonus: +${bonus} to ${real.first===0?'you':'the opponent'} at the end</div>`:(real.rules&&real.rules.lastMinus?'<div class="small dim" style="text-align:center;margin:-4px 0 6px">Trial rule: the last placement has Attack −'+real.rules.lastMinus+'</div>':'');
  $('#mfoe').innerHTML=`<div class="foehand">Opponent hand ${Array.from({length:real.hands[1].length},()=>'<div class="bcard back"></div>').join('')} · deck ${real.decks[1].length}</div>`;
  let cells=''; for (let i=0;i<16;i++){ const u=S.cells[i], ok=!!by[i]&&!u, isP=pd&&pd.cell===i, wf=pv&&pv.caps&&pv.caps[i]!=null;
    let inner=''; if (u) inner=unitHtml(S,u,i,(M.fx.place===i?'placing ':'')+(M.fx.flip===i?'flipping ':'')+(M.hl.att===i?'attacker ':'')+(M.hl.tgt===i?'target ':'')+(M.hl.blocked===i?'blocked ':''));
    else if (isP||(pv&&pv.mv&&pv.mv.cell===i)){ const mv=isP?pd:pv.mv; inner=cardHtml(E.def(mv.cid),{owner:0,cls:'ghost',mask:E.rotMask(E.def(mv.cid).mask,mv.rot||0)}); }
    if (M.pops[i]) inner+=M.pops[i]; else if (pv&&pv.tags&&pv.tags[i]) inner+=tagHtml(pv.tags[i]);
    cells+=`<button class="cell ${ok?'ok':''} ${isP?'pend':''} ${wf?'willflip '+(pv.caps[i]>1?'g2':''):''}" data-act="cell" data-i="${i}" ${u&&!M.busy?'':(ok?'':'disabled')} aria-label="${cellName(i)}">${inner}</button>`; }
  $('#mboard').innerHTML=`<div class="board">${cells}</div>${M.chain>1?`<div class="chain">×${M.chain}<small>CAPTURES</small></div>`:''}`;
  // hand
  const hand=real.hands[0]; $('#mhand').innerHTML=hand.map((cid,i)=>cardHtml(E.def(cid),{owner:0,cls:(M.sel===cid&&myTurn()?'sel ':'')+(myTurn()?'':'dis'),attrs:`data-act="hand" data-cid="${cid}" data-i="${i}"`})).join('');
  // status
  let st=''; if (M.busy&&M.anim) st=`<div class="go"><span class="thinking">${M.foeTurn?'Opponent plays':'Resolving'}</span><button class="btn sm" data-act="skip">Skip ▸▸</button></div>`; else if (M.busy) st='<span class="thinking">Opponent is thinking</span>';
  else if (real.over) st='<div class="go"><button class="btn sm pri" data-act="rematch">Rematch</button><button class="btn sm" data-act="setup">Change deck or planet</button><button class="btn sm" data-act="menu">Menu</button></div>'; else if (real.cur===0){ if (pd){ const t=pv?(pv.n?`captures <b>${pv.n}</b>${pv.gens>1?' over '+pv.gens+' generations':''} · board <b>${pv.score[0]}–${pv.score[1]}</b>`:(Object.keys(pv.tags).length?'captures <b>nothing</b>: each challenge needs your Attack <b>higher than</b> their Guard (+1 if they point back)':'no enemy card in reach')):''; st=`<div class="go"><span>${esc(E.def(pd.cid).name.split(' — ')[0])} → <b>${cellName(pd.cell)}</b> ${t}</span><button class="btn sm pri" data-act="confirm">Confirm</button><button class="btn sm" data-act="cancel">Cancel</button></div>`; if (by[pd.cell]&&by[pd.cell].length>1) st+=optionButtons(by[pd.cell],pd); }
    else if (M.sel){ const cs=Object.keys(by); st=`<span id="hoverinfo">Choose a glowing square (${cs.length} open). Tap it to preview, tap again to confirm.</span>`; } else st='<div class="go"><span>Your turn: choose a card from your hand.</span><button class="btn sm" data-act="hint">Hint</button></div>'; }
  $('#mstatus').innerHTML=st;
  const di=M.insp||(M.sel||null); $('#mdetail').innerHTML=detailHtml(di,{owner:0})+(M.cfg.planet!=='none'&&real.planet&&!di?'':'');
  const lg=$('#mlog'); if (lg) { lg.innerHTML=M.log.slice(-40).map(x=>`<div>${x}</div>`).join(''); lg.scrollTop=lg.scrollHeight; }
}
function optionButtons(moves,cur){ const lab=mv=>{ const bits=[]; if (mv.rot) bits.push('rotate '+mv.rot+'° first'); if (mv.target!=null){ const d=E.def(mv.cid); const k=d.ops.find(o=>o.k==='place_add_diag'); bits.push(k?'add '+DIRN[mv.target]+' arrow':'target '+cellName(mv.target)); } return bits.join(', ')||'no option'; };
  return `<div class="go" style="margin-top:6px">${moves.map((mv,i)=>{ const p=preview(mv); const same=cur&&cur.rot===mv.rot&&cur.target===mv.target; return `<button class="btn sm ${same?'on':''}" data-act="variant" data-k="${i}">${lab(mv)} (${p.n})</button>`; }).join('')}</div>`; }
function say(t){ M.log.push(t); }
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function wait(ms){ if (ST.speed==='0'||M.skip) return Promise.resolve(); const k=ST.speed==='2'?0.5:1, f=M.chain>6?0.7:1; return new Promise(r=>{ const t=setTimeout(()=>{ M.waiters=M.waiters.filter(w=>w!==done); r(); },ms*k*f); const done=()=>{ clearTimeout(t); r(); }; M.waiters.push(done); }); }
function skipAnim(){ M.skip=true; const w=M.waiters; M.waiters=[]; w.forEach(f=>f()); }
async function playEvents(S0,res,foe){
  M.busy=true; M.anim=true; M.skip=false; M.foeTurn=foe; M.chain=0; const D=clone(S0); M.disp=D; M.hl={}; M.fx={}; M.pops={}; const fin=res.state; let n=0;
  const lbl=cell=>E.def(D.cells[cell].cid).name.split(' — ')[0];
  for (const ev of res.events){
    if (ev.t==='place'){ const u=clone(fin.cells[ev.cell]); u.owner=ev.player; u.mask=E.def(ev.cid).mask; u.tmp.extra=0; D.cells[ev.cell]=u; M.fx={place:ev.cell}; M.insp=ev.cid; say(`${ev.player===0?'You':'Opponent'} placed ${esc(E.def(ev.cid).name.split(' — ')[0])} on ${cellName(ev.cell)}.`); renderMatch(); await wait(300); M.fx={}; }
    else if (ev.t==='rotate'){ const u=D.cells[ev.cell]; u.mask=E.rotMask(u.mask,ev.deg); if (ev.why!=='planet'||true) u.tmp.extra=E.rotMask(u.tmp.extra,ev.deg); renderMatch(); await wait(200); }
    else if (ev.t==='extra'){ D.cells[ev.cell].tmp.extra|=1<<ev.dir; renderMatch(); await wait(160); }
    else if (ev.t==='challenge'){ M.hl={att:ev.from,tgt:ev.to,blocked:ev.win?null:ev.to}; M.pops={[ev.to]:`<span class="pop ${ev.win?'win':'fail'}">${ev.atk} ${ev.win?'&gt;':'≤'} ${ev.grd}</span>`}; renderMatch(); await wait(ev.win?340:150); }
    else if (ev.t==='capture'){ D.cells[ev.cell].owner=ev.to; D.cells[ev.cell].flipped=true; n++; M.chain=n; M.fx={flip:ev.cell}; M.hl={att:ev.by,tgt:ev.cell}; say(`&nbsp;&nbsp;↳ ${esc(lbl(ev.cell))} on ${cellName(ev.cell)} flips${ev.gen>1?' (generation '+ev.gen+')':''}.`); renderMatch(); await wait(400); M.fx={}; }
  }
  M.hl={}; M.pops={}; M.fx={}; M.disp=fin; M.anim=false;
  if (ST.speed!=='0'||true){ const big=res.stats.captures>=7||res.stats.maxGen>=5, mid=res.stats.captures>=4||res.stats.maxGen>=3; if (mid&&ST.speed!=='0'&&!M.skip) await banner(res.stats.captures,res.stats.maxGen,big); }
  if (foe) {} const mine=!foe; if (mine) { M.stat.caps+=res.stats.captures; } M.stat.best=Math.max(M.stat.best,mine?res.stats.captures:0); M.stat.gens=Math.max(M.stat.gens,mine?res.stats.maxGen:0);
  if (res.stats.captures) say(`<b>${res.stats.captures} captured${res.stats.maxGen>1?' over '+res.stats.maxGen+' generations':''}.</b>`);
  M.chain=0; renderMatch();
}
async function banner(n,g,big){ const b=document.createElement('div'); b.className='banner '+(big?'huge':''); b.innerHTML=(big?'Chain reaction':'Cascade')+` ×${n}<small>${g} generation${g>1?'s':''}</small>`; const w=$('#mboard'); w.appendChild(b); w.classList.add(big?'shake2':'shake'); if (big){ const v=document.createElement('div'); v.className='vig'; document.body.appendChild(v); setTimeout(()=>v.remove(),800); } await wait(big?1000:750); b.remove(); w.classList.remove('shake','shake2'); }
async function doMove(mv,foe){ const S0=M.S; const res=E.applyMove(S0,mv); M.S=res.state; M.sel=null; M.pend=null; M.hover=null; await playEvents(S0,res,foe); M.busy=false; }
async function nextTurn(){
  if (!M||M.done) return; renderMatch();
  if (M.S.over) return finish();
  if (M.S.cur===1){ M.busy=true; M.foeTurn=true; renderMatch(); const my=M; await sleep(ST.speed==='0'?60:480+Math.random()*400); if (M!==my) return;
    const mv=await new Promise(r=>setTimeout(()=>r(AI.chooseMove(clone(aiView(M.S)),M.level,M.rng,UNIT_IDS)),15)); if (M!==my) return; await doMove(mv,true); if (M!==my) return; return nextTurn(); }
  M.busy=false; renderMatch();
}
// the AI is handed a copy of the game; the opponent's (human's) hand is blanked to ids it cannot read: it only gets the hand SIZE
function aiView(S){ const v=clone(S); v.hands[0]=v.hands[0].map(()=>'?'); v.decks[0]=v.decks[0].map(()=>'?'); return v; }
function finish(){ M.done=true; const w=E.winner(M.S), sc=E.score(M.S), kb=M.S.rules&&M.S.rules.komi?M.S.rules.komi:0; const cls=w===0?'win':w===1?'lose':'draw';
  setTimeout(()=>{ if (!M||scr!=='match') return; const o=document.createElement('div'); o.className='ov'; o.id='result'; o.innerHTML=`<div class="dlg ${cls}" data-stop="1"><h2>${w===0?'Victory':w===1?'Defeat':'Draw'}</h2><div class="sc">${sc[0]} – ${sc[1]}</div>${kb?`<div class="small dim">with the +${kb} first-move bonus: ${sc[0]+(M.first===0?kb:0)} – ${sc[1]+(M.first===1?kb:0)}</div>`:''}
   <ul><li>Your deck: ${esc(M.deckName)} · Opponent: ${esc(M.foeName)} (${LEVELS.find(l=>l[0]===M.level)[1]})</li><li>You captured ${M.stat.caps} cards in total; your best placement captured ${M.stat.best}${M.stat.gens>1?', over '+M.stat.gens+' generations':''}.</li><li>${M.first===0?'You went first.':'The opponent went first.'} Rule: ${esc(M.rs.name)}.</li></ul>
   <div class="row"><button class="btn pri" data-act="rematch">Rematch</button><button class="btn" data-act="review">View board</button></div><div class="row"><button class="btn" data-act="setup">Change deck or planet</button><button class="btn" data-act="menu">Menu</button></div></div>`; document.body.appendChild(o); },ST.speed==='0'?100:700); }
function closeOv(){ $$('.ov').forEach(o=>o.remove()); }

// ---------- events ----------
document.addEventListener('click',e=>{
  const st=e.target.closest('[data-stop]'); const b=e.target.closest('[data-act]'); if (!b) return; const a=b.dataset.act, id=b.dataset.id;
  if (a==='closeov'){ if (b.classList.contains('ov')&&st) return; if (b.classList.contains('ov')&&e.target!==b) return; closeOv(); return; }
  if (a==='play'||a==='setup'){ closeOv(); M=null; show('setup'); } else if (a==='menu'){ closeOv(); M=null; show('menu'); } else if (a==='decks'){ closeOv(); show('decks'); }
  else if (a==='help') helpOverlay();
  else if (a==='seldeck'){ ST.sel.deck=id; save(); setup(); } else if (a==='selplanet'){ ST.sel.planet=id; save(); setup(); } else if (a==='sellevel'){ ST.sel.level=id; save(); setup(); } else if (a==='selrule'){ ST.sel.rule=id; save(); setup(); }
  else if (a==='start'){ startMatch({deckId:ST.sel.deck,planet:ST.sel.planet,level:ST.sel.level,rule:ST.sel.rule}); }
  else if (a==='rematch'){ closeOv(); const c=Object.assign({},M.cfg,{first:1-M.first}); startMatch(c); }
  else if (a==='review'){ closeOv(); }
  else if (a==='mmenu'){ if (confirm('Leave this match?')){ M=null; show('menu'); } } else if (a==='mrestart'){ if (confirm('Restart this match?')){ const c=Object.assign({},M.cfg,{first:M.first}); M.done=true; startMatch(c); } }
  else if (a==='speed'){ ST.speed=id; save(); renderMatch(); } else if (a==='skip') skipAnim();
  else if (a==='hand'){ const cid=b.dataset.cid; M.insp=cid; if (myTurn()){ M.sel=M.sel===cid?null:cid; M.pend=null; } renderMatch(); }
  else if (a==='hint'){ if (myTurn()){ const v=clone(M.S); v.hands[1]=v.hands[1].map(()=>'?'); v.decks[1]=v.decks[1].map(()=>'?'); v.decks[0]=v.decks[0].map(()=>'?'); const mv=AI.chooseMove(v,'standard',M.rng,UNIT_IDS); if (mv){ M.sel=mv.cid; M.pend=mv; M.insp=mv.cid; renderMatch(); toast('Hint: the Standard AI would play this. Confirm or choose differently.'); } } }
  else if (a==='cell'){ cellClick(+b.dataset.i); }
  else if (a==='confirm'){ if (M.pend&&myTurn()) { const mv=M.pend; doMove(mv,false).then(nextTurn); } } else if (a==='cancel'){ M.pend=null; renderMatch(); }
  else if (a==='variant'){ const ms=legalByCell()[M.pend.cell]; M.pend=ms[+b.dataset.k]; renderMatch(); }
  else if (a==='inspect'){ inspectOverlay(id); }
  // deck screens
  else if (a==='newdeck'){ DB={id:null,name:'My deck '+(ST.decks.length+1),cards:[],f:{q:'',t:'',a:'',r:'',ar:'',s:'id'},tab:'cat'}; show('build'); }
  else if (a==='copydeck'){ const d=deckById(id); DB={id:null,name:d.name+' copy',cards:d.cards.slice(),f:{q:'',t:'',a:'',r:'',ar:'',s:'id'},tab:'cat'}; show('build'); }
  else if (a==='editdeck'){ const d=ST.decks.find(x=>x.id===id); DB={id:d.id,name:d.name,cards:d.cards.slice(),f:{q:'',t:'',a:'',r:'',ar:'',s:'id'},tab:'cat'}; show('build'); }
  else if (a==='viewdeck'){ const d=deckById(id); DB={id:null,name:d.name+' copy',cards:d.cards.slice(),f:{q:'',t:'',a:'',r:'',ar:'',s:'id'},tab:'dk'}; show('build'); toast('Presets are read-only: this is an editable copy.'); }
  else if (a==='deldeck'){ if (confirm('Delete this deck?')){ ST.decks=ST.decks.filter(x=>x.id!==id); save(); decksScreen(); } }
  else if (a==='usedeck'){ ST.sel.deck=id; save(); show('setup'); }
  else if (a==='add'){ if (DB.cards.length<20&&DB.cards.filter(c=>c===id).length<2){ DB.cards.push(id); buildScreen(); } } else if (a==='rm'){ const i=DB.cards.indexOf(id); if (i>=0) DB.cards.splice(i,1); buildScreen(); }
  else if (a==='dtab'){ DB.tab=id; buildScreen(); }
  else if (a==='savedeck'){ DB.name=($('#dname').value||'My deck').trim().slice(0,30); if (DB.id){ const d=ST.decks.find(x=>x.id===DB.id); d.name=DB.name; d.cards=DB.cards.slice(); } else { DB.id='c'+Date.now().toString(36); ST.decks.push({id:DB.id,name:DB.name,cards:DB.cards.slice()}); } save(); toast('Deck saved.'); decksScreen(); }
});
function cellClick(i){
  if (!M||!myTurn()) { if (M&&M.disp.cells[i]) { M.insp=M.disp.cells[i].cid; renderMatch(); } return; }
  const u=M.S.cells[i]; if (u){ M.insp=u.cid; renderMatch(); return; }
  if (!M.sel){ toast('Choose a card from your hand first.'); return; }
  const ms=legalByCell()[i]; if (!ms) return;
  if (M.pend&&M.pend.cell===i&&ms.some(m=>m.rot===M.pend.rot&&m.target===M.pend.target)){ const mv=M.pend; doMove(mv,false).then(nextTurn); return; }
  M.pend=ms[0]; if (!ST.preview||ms.length>1) {} renderMatch();
}
function hoverPreview(i){   // desktop only: shows what a placement would capture without rebuilding the board
  $$('.cell.willflip').forEach(c=>c.classList.remove('willflip','g2')); $$('.pvtag').forEach(t=>t.remove()); const info=$('#hoverinfo'); if (!M||!M.sel||!myTurn()||M.pend||!ST.preview) return;
  if (i==null){ if (info) info.textContent='Choose a glowing square. Tap it to preview, tap again to confirm.'; return; }
  const ms=legalByCell()[i]; if (!ms) return; const pv=preview(ms[0]); for (const c in pv.caps){ const el=$(`.cell[data-i="${c}"]`); if (el) el.classList.add('willflip',pv.caps[c]>1?'g2':'x'); }
  for (const c in pv.tags){ const el=$(`.cell[data-i="${c}"]`); if (el) el.insertAdjacentHTML('beforeend',tagHtml(pv.tags[c])); }
  if (info) info.innerHTML=`${cellName(i)}: captures <b>${pv.n}</b>${pv.gens>1?' over '+pv.gens+' generations':''}${pv.n?'':' (Attack must beat Guard; ties and +1 for a pointing-back arrow go to the defender)'} · board would be <b>${pv.score[0]}–${pv.score[1]}</b>`; }
document.addEventListener('mouseover',e=>{ if (scr!=='match'||!M) return; const c=e.target.closest('.cell.ok'); const i=c?+c.dataset.i:null; if (i!==M.hover){ M.hover=i; hoverPreview(i); } });
document.addEventListener('input',e=>{ const t=e.target; if (scr!=='build') return; if (t.id==='fq'){ DB.f.q=t.value; DB.focus='fq'; buildScreen(); } });
document.addEventListener('change',e=>{ const t=e.target; if (scr!=='build') return; const m={ft:'t',fa:'a',fr:'r',far:'ar',fs:'s'}[t.id]; if (m){ DB.f[m]=t.value; buildScreen(); } else if (t.id==='dname') DB.name=t.value; });
document.addEventListener('keydown',e=>{ if (e.key==='Escape') closeOv(); });
window.BR_TEST={render:()=>renderMatch(),get M(){ return M; },show,startMatch,E,AI,ST,DATA};
show('menu');
