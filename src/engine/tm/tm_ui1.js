// ===================== XTG: THE VIEWS =====================
UI.xts=UI.xts||'home'; UI.xtf=UI.xtf||'all'; UI.xtpg=0; UI.xtc=UI.xtc||'all';
const XT_STYC={aggro:'#c0392b',mid:'#2d7f9d',control:'#6b4bb8',combo:'#b87b1a',stall:'#3b8f5a'};
function xtDeckShare(cid){ let s=0; for (const a of G.xtg.arch) if (a.core.includes(cid)||a.tr.includes(cid)) s+=a.sh; return s; }
function xtCardTrend(cid){ let d=0; for (const a of G.xtg.arch){ if (!(a.core.includes(cid)||a.tr.includes(cid))) continue; const h=a.hist, w=Math.min(5,h.length); if (w>=2) d+=h[h.length-1]-h[h.length-w]; } return d>0.02?'rising': d<-0.02?'fading':'steady'; }
function xtPullOdds(key){ const d=xtD(key); if (d.sealed) return ''; const P=xtPools(d.set), c=d.card, O=TM_ODDS; let p=0;
  const sl=(arr,q)=>arr.length? q/arr.length : 0;   // chance that a given slot lands on this one card
  if (d.v==='A') p=O.alt/Math.max(1,P.alt.length);
  else if (d.v==='N'){ if (c.rar==='common') p=(8-O.foil)*sl(P.c,P.q.C); else if (c.rar==='unc') p=3*sl(P.u,P.q.U); else if (c.rar==='rare') p=(1-O.alt)*(1-O.legR)*sl(P.r,P.q.R); else if (c.rar==='leg') p=(1-O.alt)*O.legR*sl(P.l,P.q.L); }
  else if (d.v==='F'){ const F=O.fr; const m={common:F.C*sl(P.c,P.q.C), unc:F.U*sl(P.u,P.q.U), rare:F.R*sl(P.r,P.q.R), leg:F.L*sl(P.l,P.q.L)}; p=O.foil*(m[c.rar]||0); }
  return p>=0.99? 'in nearly every pack' : p>0? 'about 1 in '+Math.max(1,Math.round(1/p))+' packs' : ''; }
function xtTabsRow(){ const t=UI.xts; const solo=true; /* in the one card-game world Tidemark has its own tab; Home and Your cards are shared screens */ const b=(k,n)=>`<button class="chip ${t===k?'on':''}" data-act="xts" data-a="${k}">${n}</button>`; return `<div class="chips" style="margin:6px 0 12px">${solo?'':b('home','Overview')}${b('shop','Shop')}${b('sets','Sets')}${b('meta','Metagame')}${solo?'':b('coll','Your cards')}</div>`; }
ACT.xts=a=>{ UI.xts=a; UI.xtpg=0; render(true); window.scrollTo(0,0); };
function xtView(){ const v={home:xtHome,shop:xtShopV,sets:xtSetsV,meta:xtMetaV,coll:xtCollV}[UI.xts]||xtHome; return `<div class="tcg">${tip('tidemark1','Tidemark is a land-and-sea card game with seven factions. It has been out for ten years: thirty sets of history to collect, and Tenth Tide, the anniversary set, about to release. Tournaments decide what wins, and what wins decides what cards cost. Every card has real rules, and the game plays simulated matches to find out which decks win.')}${xtTabsRow()}${v()}</div>`; }
function myXtSummary(){ let n=0,g=0,s=0,val=0; for (const c of myXt()){ const d=xtD(c.k); if (d.sealed) s++; else if (c.g>0) g++; else n++; val+=xtCopyValue(c); } return {n,g,s,val}; }
function xtArchRow(a,i){ const h=a.hist, w=Math.min(5,h.length); const tr=w>=2? h[h.length-1]-h[h.length-w] : 0; const arrow=tr>0.012?'<span class="up">▲</span>': tr<-0.012?'<span class="down">▼</span>': w>=2?'<span class="muted">–</span>':'';
  return `<div class="row" style="cursor:default"><div class="rt"><b>${esc(a.name)}</b>${a.born!=null && G.day-a.born<42?' <span class="tag" style="font-size:10px">New</span>':''}<span><i class="dot" style="background:${XTF.EL[a.el].c}"></i>${esc(a.el)} · ${XT_STYN[a.st]} ${arrow}</span><div class="bar" style="margin-top:4px;max-width:220px"><i style="width:${Math.min(100,a.sh*300)}%;background:${XT_STYC[a.st]}"></i></div></div><div class="rv"><b>${(a.sh*100).toFixed(0)}%</b><span>of decks</span></div></div>`; }
function xtEvRow(e){ const A=G.xtg.arch; const nm=id=>{ const a=A.find(x=>x.id===id); return a? a.name : id.replace('|',' '); }; const k={local:'Local',regional:'Regional',champ:'Championship'}[e.k];
  return `<div class="row" style="cursor:default"><div class="rt"><b>${k}: ${esc(nm(e.win))}</b><span>${fmtDate(e.d)} · ${e.n} players · won by ${esc(e.winner)}</span></div></div>`; }
// the home panels, separately, so the card-game Home can lay them out in its own columns
function xtHomePanels(){
  const T=G.xtg, nx=xtAnnounced(G.day), sm=myXtSummary(), P={};
  const banned=Object.keys(T.ban).filter(c=>T.ban[c].d>G.day).map(c=>({c:xtCardByCid(+c),d:T.ban[c].d})).filter(x=>x.c);
  P.next= nx? (()=>{ const def=xtSetDef(nx), days=def.rel-G.day, rev=xtRevealed(nx).length; return `<div class="panel"><h3>Next set: ${esc(def.name)}</h3><p class="small muted" style="margin:0 0 8px">Releases ${fmtDate(def.rel,true)}, in ${days} day${days===1?'':'s'}. ${rev? rev+' of '+xtSetCards(nx).length+' cards revealed so far.' : 'Nothing has been shown yet.'}${def.reprint?' A greatest-hits set: it reprints cards from earlier ones.':''}</p><div class="formrow"><button class="btn sm pri" data-act="xtset" data-a="${nx}">See the previews</button><button class="btn sm" data-act="xts" data-a="shop">Preorders</button></div></div>`; })() : xtSetProgressPanel();
  // the cards that define decks
  const nDecks=T.arch.length||1; const inDecks=cid=>T.arch.filter(a=>a.cnt&&a.cnt[cid]).length;
  const hot=Object.keys(T.usage).map(cid=>({c:xtCardByCid(+cid),u:T.usage[cid]})).filter(x=>x.c&&xtLegalState(x.c.cid)==='std').sort((a,b)=>b.u-a.u).slice(0,8);
  P.meta=`<div class="panel"><div class="phead"><h3>The metagame this week</h3><button class="linkbtn" data-act="xts" data-a="meta">All</button></div><div class="rows">${T.arch.slice(0,6).map(xtArchRow).join('')||'<div class="empty">No tournaments yet. Decks form when '+esc(xtSetDef(TM_TT).name)+' is out.</div>'}</div></div>`;
  P.results=`<div class="panel"><h3>Latest results</h3><div class="rows">${T.ev.filter(e=>e.k!=='local').slice(0,3).concat(T.ev.filter(e=>e.k==='local').slice(0,1)).map(xtEvRow).join('')||'<div class="empty">Nothing yet.</div>'}</div></div>`;
  P.coll=`<div class="panel"><h3>Your Tidemark collection</h3><div class="kpis"><div class="kpi"><small>Cards</small><b>${sm.n}</b></div><div class="kpi"><small>Graded</small><b>${sm.g}</b></div><div class="kpi"><small>Sealed</small><b>${sm.s}</b></div><div class="kpi"><small>Worth about</small><b>${money(sm.val,true)}</b></div></div><div class="formrow"><button class="btn sm" data-act="xts" data-a="coll">Open your cards</button></div></div>`;
  P.ban= banned.length?`<div class="panel"><h3>Ban coming</h3><div class="rows">${banned.map(x=>`<button class="row" data-act="xtdesign" data-a="${esc(xtCardKey(x.c))}"><div class="rt"><b>${esc(x.c.name)}</b><span>Banned from Standard on ${fmtDate(x.d)}</span></div></button>`).join('')}</div></div>`:'';
  P.hot= hot.length && T.arch.length? `<div class="panel"><h3>Most played cards</h3><div class="rows">${hot.map(x=>{ const k=xtCardKey(x.c); return `<button class="row" data-act="xtdesign" data-a="${esc(k)}">${xMiniTKey(k)}<div class="rt"><b>${esc(x.c.name)}</b><span>in ${inDecks(x.c.cid)} of ${nDecks} top decks · ${xtCardTrend(x.c.cid)}</span></div><div class="rv"><b>${money(xtFairRaw(k),true)}</b></div></button>`; }).join('')}</div></div>` : '';
  P.news=`<div class="panel"><h3>Tidemark news</h3>${G.news.filter(n=>n.k==='xtg').slice(0,5).map(n=>`<div class="newsrow"><b>${esc(n.h)}</b><p>${esc(n.b)}</p><div class="meta">${fmtDate(n.t)}</div></div>`).join('')||'<div class="empty">Quiet.</div>'}</div>`;
  return P;
}
function xtHome(){ const P=xtHomePanels(); return `<div class="cols"><div class="stack">${P.next}${P.meta}${P.results}</div><div class="stack">${P.coll}${P.ban}${P.hot}${P.news}</div></div>`; }
function xtSetProgressPanel(){ const own=new Set(myXt().filter(c=>!xtD(c.k).sealed).map(c=>{ const d=xtD(c.k); return d.set+'|'+d.no; })); const rel=xtReleasedSets(G.day);
  const rows=rel.slice(-6).reverse().map(n=>{ const def=xtSetDef(n), cs=xtSetCards(n).filter(c=>!xtAlt(c)); const have=cs.filter(c=>own.has(n+'|'+c.no)).length; return `<button class="row" data-act="xtset" data-a="${n}"><div class="rt"><b>${esc(def.name)}</b><span>${have} of ${cs.length} named cards</span></div></button>`; }).join('');
  const all=rel.reduce((s,n)=>s+xtSetCards(n).filter(c=>!xtAlt(c)).length,0), got=rel.reduce((s,n)=>s+xtSetCards(n).filter(c=>!xtAlt(c)&&own.has(n+'|'+c.no)).length,0);
  return `<div class="panel"><h3>Your collection by set</h3><p class="small muted" style="margin:0 0 8px">${got} of ${all} named cards across ${rel.length} sets. The newest six:</p><div class="rows">${rows}</div><div class="formrow"><button class="btn sm pri" data-act="xts" data-a="sets">All sets</button></div></div>`; }
function xtRetailV(){
  const T=G.xtg, sets=xtRetailSets(G.day).slice().reverse(), nx=xtAnnounced(G.day); const own=myXt().filter(c=>xtD(c.k).sealed&&!c.l);
  const row=(n)=>{ const def=xtSetDef(n), s=T.shop[n]||{pack:0,box:0}; const pk=xtKey(n,0,'P'), bx=xtKey(n,0,'B');
    return `<div class="panel"><div style="display:flex;gap:12px;flex-wrap:wrap"><div style="display:flex;gap:6px;align-items:flex-end;flex:none"><div style="width:96px">${xtPackSVG(n,'P',Math.floor(G.day/7))}</div><div style="width:128px">${xtPackSVG(n,'B')}</div></div><div style="flex:1;min-width:220px"><h3 style="margin:0">${esc(def.name)}</h3><div class="small muted">Released ${fmtDate(def.rel,true)}${xtLegalSets(G.day).includes(n)?' · legal in Standard':' · rotated out'}</div><dl class="kv" style="margin-top:6px"><dt>Booster pack</dt><dd>${money(XT_MSRP.P,true)} · ${s.pack} in stock · market about ${money(xtFairRaw(pk),true)}</dd><dt>Booster box</dt><dd>${money(XT_MSRP.B)} · ${s.box} in stock · market about ${money(xtFairRaw(bx),true)}</dd></dl></div></div>
      <div class="formrow"><button class="btn sm" data-act="xtbuy" data-a="${n}|P|1" ${s.pack<1||G.player.cash<XT_MSRP.P?'disabled':''}>Buy a pack</button><button class="btn sm" data-act="xtbuy" data-a="${n}|P|5" ${s.pack<5||G.player.cash<XT_MSRP.P*5?'disabled':''}>Buy 5 packs</button><button class="btn sm pri" data-act="xtbuy" data-a="${n}|B|1" data-confirm="Pay ${money(XT_MSRP.B)}" ${s.box<1||G.player.cash<XT_MSRP.B?'disabled':''}>Buy a box</button></div>${s.box<1?'<div class="small muted" style="margin-top:6px">Boxes are sold out. Look for them on the marketplace, usually above retail.</div>':''}</div>`; };
  const pre= nx? (()=>{ const def=xtSetDef(nx); const q=f=>T.pre.filter(p=>p.set===nx&&p.f===f).reduce((s,p)=>s+p.q,0); return `<div class="panel"><h3>Preorder ${esc(def.name)}</h3><p class="small muted" style="margin:0 0 8px">Releases ${fmtDate(def.rel,true)}. Preorders are charged at retail price when it launches, and they are guaranteed, unlike the shelf. Limit 2 boxes and 12 packs.</p><div class="formrow"><button class="btn sm" data-act="xtpre" data-a="${nx}|P|1">+1 pack (${q('P')})</button><button class="btn sm" data-act="xtpre" data-a="${nx}|P|6">+6 packs</button><button class="btn sm pri" data-act="xtpre" data-a="${nx}|B|1">+1 box (${q('B')})</button></div></div>`; })() : '';
  return `<div class="cols"><div class="stack">${pre}${sets.map(row).join('')||'<div class="panel"><div class="empty">Nothing on the shelves.</div></div>'}</div>
  <div class="stack">${xtSealedPanel()}${xtRestockPanel()}</div></div>`;
}
function xtSetsV(){
  const rel=xtReleasedSets(G.day).slice().reverse(), nx=xtAnnounced(G.day); const owned=new Set(myXt().map(c=>c.k)); const legal=xtLegalSets(G.day);
  const row=(n,up)=>{ const def=xtSetDef(n); const keys=up?[]:xtAllKeys(n); const have=keys.filter(k=>owned.has(k)).length;
    return `<button class="row" data-act="xtset" data-a="${n}"><div class="mini" style="width:44px">${xtPackSVG(n,'P')}</div><div class="rt"><b>${esc(def.name)}</b><span>${up?'Releases '+fmtDate(def.rel,true):'Released '+fmtDate(def.rel,true)} · ${n===TM_TT?xtSetCards(n).length+' cards and alternate art':xtSetCards(n).length+' named cards of '+def.total}</span><span class="${up?'':legal.includes(n)?'up':'muted'}">${up?(xtRevealed(n).length+' revealed'):legal.includes(n)?'Legal in Standard':'Rotated out'}</span></div>${up?'':`<div class="rv"><b>${have}/${keys.length}</b><span>prints</span></div>`}</button>`; };
  return `<div class="panel"><div class="rows">${nx?row(nx,true):''}${rel.map(n=>row(n,false)).join('')}</div></div>`;
}
function xtMetaV(){
  const T=G.xtg; const legal=xtLegalSets(G.day); const bans=Object.keys(T.ban).map(c=>({c:xtCardByCid(+c),b:T.ban[c]})).filter(x=>x.c).sort((a,b)=>b.b.d-a.b.d);
  const used=Object.keys(T.usage).map(cid=>({c:xtCardByCid(+cid),u:T.usage[cid]})).filter(x=>x.c).sort((a,b)=>b.u-a.u).slice(0,12);
  const nx=xtAnnounced(G.day); let rot=''; if (nx===TM_TT){ const def=xtSetDef(nx); rot=`<p class="small" style="margin:6px 0 0">The last two years of sets rotate out on ${fmtDate(def.rel,true)}, when ${esc(def.name)} releases. Its 70 reprints stay legal.</p>`; }
  return `<div class="cols"><div class="stack"><div class="panel"><h3>Standard decks</h3><p class="small muted" style="margin:0 0 8px">Share of decks in recent events. Strong decks rise, popular decks get answered.</p><div class="rows">${T.arch.map(xtArchRow).join('')}</div></div>
    <div class="panel"><h3>Recent events</h3><div class="rows">${T.ev.slice(0,10).map(xtEvRow).join('')}</div></div></div>
  <div class="stack"><div class="panel"><h3>What's legal</h3><p class="small" style="margin:0">Standard is ${legal.length===1?'the 220 cards of':'the sets of the last two years:'} ${legal.length>6?'':legal.map(s=>`<b>${esc(xtSetDef(s).name)}</b>`).join(', ')}${legal.length>6?legal.length+' sets':''}. Every other card is Eternal-only and plays far less. Only Tenth Tide is simulated by the rules engine.</p>${rot}</div>
    <div class="panel"><h3>Banned cards</h3><div class="rows">${bans.map(x=>`<button class="row" data-act="xtdesign" data-a="${esc(xtCardKey(x.c))}"><div class="rt"><b>${esc(x.c.name)}</b><span>${x.b.d>G.day?'Banned on ':'Banned since '}${fmtDate(x.b.d,true)}, after ${esc(x.b.why)}</span></div></button>`).join('')||'<div class="empty">Nothing banned yet.</div>'}</div></div>
    <div class="panel"><h3>Most played cards</h3><div class="rows">${used.map(x=>{ const k=xtCardKey(x.c); return `<button class="row" data-act="xtdesign" data-a="${esc(k)}">${xMiniTKey(k)}<div class="rt"><b>${esc(x.c.name)}</b><span>${Math.round(xtDeckShare(x.c.cid)*100)}% of decks · ${xtLegalState(x.c.cid)==='std'?'Standard':'open only'}</span></div><div class="rv"><b>${money(xtFairRaw(k),true)}</b></div></button>`; }).join('')}</div></div></div></div>`;
}
// your cards: identical copies stack into one tile; filter by what it is, search by name, sort, and page through
UI.xtq=UI.xtq||''; UI.xtr=UI.xtr||'all'; UI.xtso=UI.xtso||'val';
function xtCollGroups(){
  const f=UI.xtc, r=UI.xtr, q=UI.xtq.trim().toLowerCase(); const sealed=c=>xtD(c.k).sealed; let a=myXt();
  const cnt={all:a.length, raw:a.filter(c=>!sealed(c)&&!(c.g>0)).length, gr:a.filter(c=>c.g>0||c.g<0).length, sl:a.filter(sealed).length, ls:a.filter(c=>c.l).length};
  a=a.filter(c=> f==='raw'? !sealed(c)&&!(c.g>0) : f==='gr'? (c.g>0||c.g<0) : f==='sl'? sealed(c) : f==='ls'? c.l : true);
  const rk=d=>{ if (d.sealed) return 'sealed'; const c=d.card; return d.v==='F'? 'foil' : xtIsPrem(c)? 'prem' : c.rar; };
  if (r!=='all') a=a.filter(c=>rk(xtD(c.k))===r);
  if (q) a=a.filter(c=>{ const d=xtD(c.k); return (d.title+' '+d.def.name+' '+d.def.code+' '+(d.card?(d.card.el||'')+' '+d.card.kind+' '+String(d.card.cn).padStart(3,'0'):'')).toLowerCase().includes(q); });
  const G2=new Map(); for (const c of a){ const k=c.k+'|'+(c.g>0?'g'+c.g:c.g<0?'atgcs':condLabel(c.c))+'|'+(c.l?'l':'')+(c.nw?'n':''); let g=G2.get(k); if (!g){ g={cs:[],k:c.k,v:0}; G2.set(k,g); } g.cs.push(c); g.v=Math.max(g.v,xtCopyValue(c)); }
  const out=[...G2.values()]; const so=UI.xtso;
  out.sort(so==='num'? (x,y)=>xtD(x.k).set-xtD(y.k).set||xtD(x.k).no-xtD(y.k).no||y.v-x.v : so==='name'? (x,y)=>xtD(x.k).title.localeCompare(xtD(y.k).title)||y.v-x.v : so==='new'? (x,y)=>Math.max(...y.cs.map(c=>c.id))-Math.max(...x.cs.map(c=>c.id)) : so==='many'? (x,y)=>y.cs.length-x.cs.length||y.v-x.v : (x,y)=>y.v-x.v);
  return {out, cnt, total:a.length};
}
function xtCollV(){
  const f=UI.xtc, r=UI.xtr; const {out, cnt, total}=xtCollGroups();
  const per=window.innerWidth>=900? 48 : 24, pages=Math.max(1,Math.ceil(out.length/per)), pg=Math.min(UI.xtpg,pages-1);
  const ch=(k,n)=>`<button class="chip ${f===k?'on':''}" data-act="xtc" data-a="${k}">${n} (${cnt[k]})</button>`;
  const rc=(k,n)=>`<button class="chip ${r===k?'on':''}" data-act="xtr" data-a="${k}">${n}</button>`;
  const cell=g=>{ const c=g.cs[0], d=xtD(g.k), n=g.cs.length; const tags=[c.nw?'<i class="tag new">New</i>':'', c.l?'<i class="tag">Listed</i>':c.g<0?'<i class="tag">At GCS</i>':''].join('');
    return `<button class="gcell" data-act="xtopy" data-a="${c.id}">${n>1?`<span class="count">×${n}</span>`:''}${xMiniT(c)}<div class="cap"><b>${esc(d.title)}</b><span>${d.sealed?'Sealed':XT_VARN[d.v]+', '+(c.g>0?'GCS '+c.g:c.g<0?'at GCS':condLabel(c.c))}${d.no?' · '+d.def.code+' '+String(d.card.cn).padStart(3,'0'):''}</span><span>${money(g.v,true)}${n>1?' each':''}${tags}</span></div></button>`; };
  const nav=pages>1? `<div class="pager"><button class="btn sm" data-act="xtpage" data-a="0" ${pg===0?'disabled':''}>« First</button><button class="btn sm" data-act="xtpage" data-a="${pg-1}" ${pg===0?'disabled':''}>‹ Prev</button><span class="small">Page ${pg+1} of ${pages}</span><button class="btn sm" data-act="xtpage" data-a="${pg+1}" ${pg>=pages-1?'disabled':''}>Next ›</button><button class="btn sm" data-act="xtpage" data-a="${pages-1}" ${pg>=pages-1?'disabled':''}>Last »</button></div>` : '';
  return `<div class="chips">${ch('all','All')}${ch('raw','Raw')}${ch('gr','Graded')}${ch('sl','Sealed')}${ch('ls','Listed')}</div>
  <div class="chips">${rc('all','Any rarity')}${rc('prem','Alternate art')}${rc('foil','Foil')}${rc('leg','Legendary')}${rc('rare','Rare')}${rc('unc','Uncommon')}${rc('common','Common')}${rc('sealed','Packs and boxes')}</div>
  <div class="tools" style="margin-bottom:10px"><input class="inp grow" type="search" placeholder="Search your cards: name, faction, set or number" value="${esc(UI.xtq)}" data-inp="xtq" aria-label="Search your cards">
    <select class="inp" data-chg="xtso" aria-label="Sort">${[['val','Most valuable'],['num','Card number'],['name','Name'],['new','Newest'],['many','Most copies']].map(([k,n])=>`<option value="${k}" ${UI.xtso===k?'selected':''}>${n}</option>`).join('')}</select></div>
  <p class="small muted" style="margin:0 0 8px">${total} card${total===1?'':'s'} in ${out.length} stack${out.length===1?'':'s'}. Identical copies are stacked (×N); open one to see them all.</p>
  ${nav}<div class="grid">${out.slice(pg*per,pg*per+per).map(cell).join('')||'<div class="empty">Nothing matches. Clear the search or pick another filter.</div>'}</div>${nav?`<div style="margin-top:10px">${nav}</div>`:''}`;
}
ACT.xtc=a=>{ UI.xtc=a; UI.xtpg=0; render(true); }; ACT.xtr=a=>{ UI.xtr=a; UI.xtpg=0; render(true); }; ACT.xtso=v=>{ UI.xtso=v; UI.xtpg=0; render(true); };
ACT.xtpage=a=>{ UI.xtpg=Math.max(0,+a); render(true); window.scrollTo(0,0); };
let xtqT=null; ACT.xtq=v=>{ UI.xtq=v; UI.xtpg=0; clearTimeout(xtqT); xtqT=setTimeout(()=>{ const a=document.activeElement; const pos=a&&a.selectionStart; render(true); const i=$('[data-inp="xtq"]'); if (i){ i.focus(); try{ i.setSelectionRange(pos,pos); }catch(e){} } },250); };
ACT.xtbuy=(a,el)=>{ if (!armed(el)) return; const [n,f,q]=a.split('|'); const e=xtBuySealed(+n,f,+q); if (e){ showToast(e); return; } showToast('Bought. It is in Your sealed product.', true); render(true); queueSave(); };
ACT.xtpre=a=>{ const [n,f,q]=a.split('|'); const e=xtPreorder(+n,f,+q); if (e){ showToast(e); return; } showToast('Preordered. You pay retail when it launches.', true); render(true); queueSave(); };
