// ===================== BROKEN REACH: THE VIEWS =====================
UI.brs=UI.brs||'shop'; UI.brc=UI.brc||'all'; UI.brpg=0; UI.brq=UI.brq||''; UI.brr=UI.brr||'all'; UI.brso=UI.brso||'val'; UI.brstore=UI.brstore||'retail'; UI.bkvf=UI.bkvf||'hits'; UI.bkvp=0;
function brPullOdds(key){ const d=brD(key); if (d.sealed) return ''; const P=brPools(d.set), c=d.card, O=BR_ODDS; let p=0; const sl=(arr)=>arr.length? 1/arr.length : 0;
  if (d.v==='A'){ const k=c.rar==='ir'?O.ir:c.rar==='sig'?O.sig:O.ecl; p=k*sl(P[c.rar]); }
  else if (d.v==='N'){ const k={common:'C',unc:'U',rare:'R',sr:'SR',leg:'L'}[c.rar]; if (k==='C') p=4*sl(P.C)+O.wild.C*sl(P.C); else if (k==='U') p=3*sl(P.U)+O.wild.U*sl(P.U); else p=(O.rare[k]||0)*sl(P[k])+O.wild[k]*sl(P[k]); }
  else if (d.v==='F'){ const k={common:'C',unc:'U',rare:'R',sr:'SR',leg:'L'}[c.rar]; p=(1-O.ir-O.sig-O.ecl)*O.foil[k]*sl(P[k]); }
  return p>=0.99? 'in nearly every pack' : p>0? 'about 1 in '+Math.max(1,Math.round(1/p))+' packs' : ''; }
function brTabsRow(){ const t=UI.brs; const b=(k,n)=>`<button class="chip ${t===k?'on':''}" data-act="brs" data-a="${k}">${n}</button>`; return `<div class="chips" style="margin:6px 0 12px">${b('shop','Shop')}${b('sets','Set')}${b('play','Play')}</div>`; }
ACT.brs=a=>{ UI.brs=a; UI.brpg=0; render(true); window.scrollTo(0,0); };
function brView(){ const v={shop:brShopV,sets:brSetsV,play:brPlayV}[UI.brs]||brShopV; return `<div class="tcg">${tip('brokenreach1','The Broken Reach is a space-opera card game: ships, crews, creatures and tech battle on a 4x4 grid, and every card has arrows pointing at its neighbours. It launches with one set, A Ship of Our Own: 180 base cards, foils and 27 premium alternate arts. The playable alpha is under Play; everything here is a proposal, not canon.')}${brTabsRow()}${v()}</div>`; }
function myBrSummary(){ let n=0,g=0,s=0,val=0; for (const c of myBr()){ const d=brD(c.k); if (d.sealed) s++; else if (c.g>0) g++; else n++; val+=brCopyValue(c); } return {n,g,s,val}; }
function brPlayV(){
  return `<div class="cols"><div class="stack"><div class="panel"><h3>Play The Broken Reach</h3><p class="small" style="margin:0 0 8px">The battler is a separate page for now: a 4x4 grid, arrows, combos that stop after one level, three AI levels and a deckbuilder. It uses a testing catalogue (every card unlocked, placeholder art), so playing it does not touch your collection.</p><div class="formrow"><a class="btn pri" href="broken-reach/" style="text-decoration:none">Open the Play Alpha</a></div><p class="small muted" style="margin:8px 0 0">Coming later: build decks from the cards you actually own, play local tournaments, and a career.</p></div></div><div class="stack">${brRestockPanel()}</div></div>`;
}
// the home panels, separately, so the card-game Home can lay them out in its own columns
function brHomePanels(){
  const T=G.brg, nx=brAnnouncedSet(G.day), sm=myBrSummary(), P={};
  const upcoming=brNextSet(G.day);
  P.next= nx? (()=>{ const def=brSetDef(nx), days=def.rel-G.day, rev=brRevealed(nx).length; return `<div class="panel"><h3>Next set: ${esc(def.name)}</h3><p class="small muted" style="margin:0 0 8px">Releases ${fmtDate(def.rel,true)}, in ${days} day${days===1?'':'s'}. ${rev? rev+' of '+brSetCards(nx).length+' cards revealed so far.' : 'Nothing has been shown yet.'}</p><div class="formrow"><button class="btn sm pri" data-act="brset" data-a="${nx}">See the previews</button><button class="btn sm" data-act="brs" data-a="shop">Preorders</button></div></div>`; })() : upcoming? `<div class="panel"><h3>Coming: The Broken Reach</h3><p class="small muted" style="margin:0">A new card game releases ${fmtDate(brSetDef(upcoming).rel,true)}. It will be announced about ${BR_ANN_DAYS} days before.</p></div>` : brSetProgressPanel();
  P.meta=''; P.results='';
  P.coll=`<div class="panel"><h3>Your Broken Reach collection</h3><div class="kpis"><div class="kpi"><small>Cards</small><b>${sm.n}</b></div><div class="kpi"><small>Graded</small><b>${sm.g}</b></div><div class="kpi"><small>Sealed</small><b>${sm.s}</b></div><div class="kpi"><small>Worth about</small><b>${money(sm.val,true)}</b></div></div><div class="formrow"><button class="btn sm" data-act="brs" data-a="sets">Open the set</button><a class="btn sm" href="broken-reach/" style="text-decoration:none">Play Alpha</a></div></div>`;
  P.ban=''; P.hot='';
  P.news=`<div class="panel"><h3>Broken Reach news</h3>${G.news.filter(n=>n.k==='brg').slice(0,5).map(n=>`<div class="newsrow"><b>${esc(n.h)}</b><p>${esc(n.b)}</p><div class="meta">${fmtDate(n.t)}</div></div>`).join('')||'<div class="empty">Quiet.</div>'}</div>`;
  return P;
}
function brSetProgressPanel(){ const own=new Set(myBr().filter(c=>!brD(c.k).sealed).map(c=>{ const d=brD(c.k); return d.set+'|'+d.no; })); const rel=brReleasedSets(G.day);
  const rows=rel.map(n=>{ const def=brSetDef(n), cs=brSetCards(n).filter(c=>!brAlt(c)); const have=cs.filter(c=>own.has(n+'|'+c.no)).length; return `<button class="row" data-act="brset" data-a="${n}"><div class="rt"><b>${esc(def.name)}</b><span>${have} of ${cs.length} base cards</span></div></button>`; }).join('');
  return `<div class="panel"><h3>Your Broken Reach set</h3><div class="rows">${rows}</div></div>`; }
function brRetailV(){
  const T=G.brg, sets=brRetailSets(G.day).slice().reverse(), nx=brAnnouncedSet(G.day);
  const row=(n)=>{ const def=brSetDef(n), s=T.shop[n]||{pack:0,box:0}; const pk=brKey(n,0,'P'), bx=brKey(n,0,'B');
    return `<div class="panel"><div style="display:flex;gap:12px;flex-wrap:wrap"><div style="display:flex;gap:6px;align-items:flex-end;flex:none"><div style="width:96px">${brPackSVG(n,'P')}</div><div style="width:128px">${brPackSVG(n,'B')}</div></div><div style="flex:1;min-width:220px"><h3 style="margin:0">${esc(def.name)}</h3><div class="small muted">Released ${fmtDate(def.rel,true)}</div><dl class="kv" style="margin-top:6px"><dt>Booster pack</dt><dd>${money(BR_MSRP.P,true)} · ${s.pack} in stock · market about ${money(brFairRaw(pk),true)}</dd><dt>Booster box</dt><dd>${money(BR_MSRP.B)} · ${s.box} in stock · market about ${money(brFairRaw(bx),true)}</dd></dl></div></div>
      <div class="formrow"><button class="btn sm" data-act="brbuy" data-a="${n}|P|1" ${s.pack<1||G.player.cash<BR_MSRP.P?'disabled':''}>Buy a pack</button><button class="btn sm" data-act="brbuy" data-a="${n}|P|5" ${s.pack<5||G.player.cash<BR_MSRP.P*5?'disabled':''}>Buy 5 packs</button><button class="btn sm pri" data-act="brbuy" data-a="${n}|B|1" data-confirm="Pay ${money(BR_MSRP.B)}" ${s.box<1||G.player.cash<BR_MSRP.B?'disabled':''}>Buy a box</button></div>${s.box<1?'<div class="small muted" style="margin-top:6px">Boxes are sold out. Look for them on the marketplace, usually above retail.</div>':''}</div>`; };
  const pre= nx? (()=>{ const def=brSetDef(nx); const q=f=>T.pre.filter(p=>p.set===nx&&p.f===f).reduce((s,p)=>s+p.q,0); return `<div class="panel"><h3>Preorder ${esc(def.name)}</h3><p class="small muted" style="margin:0 0 8px">Releases ${fmtDate(def.rel,true)}. Preorders are charged at retail price when it launches, and they are guaranteed, unlike the shelf. Limit 2 boxes and 12 packs.</p><div class="formrow"><button class="btn sm" data-act="brpre" data-a="${nx}|P|1">+1 pack (${q('P')})</button><button class="btn sm" data-act="brpre" data-a="${nx}|P|6">+6 packs</button><button class="btn sm pri" data-act="brpre" data-a="${nx}|B|1">+1 box (${q('B')})</button></div></div>`; })() : (!brReleasedSets(G.day).length? `<div class="panel"><h3>Nothing on the shelves yet</h3><p class="small muted" style="margin:0">The Broken Reach releases ${fmtDate(brSetDef(1).rel,true)}. Preorders open about ${BR_ANN_DAYS} days before.</p></div>` : '');
  return `<div class="cols"><div class="stack">${pre}${sets.map(row).join('')||(pre?'':'<div class="panel"><div class="empty">Nothing on the shelves.</div></div>')}</div><div class="stack">${brSealedPanel()}${brRestockPanel()}</div></div>`;
}
function brSetsV(){
  const rel=brReleasedSets(G.day).slice().reverse(), nx=brNextSet(G.day); const owned=new Set(myBr().map(c=>c.k));
  const row=(n,up)=>{ const def=brSetDef(n); const keys=up?[]:brAllKeys(n); const have=keys.filter(k=>owned.has(k)).length; const hidden=up&&!brAnnouncedSet(G.day);
    return `<button class="row" data-act="brset" data-a="${n}"><div class="mini" style="width:44px">${brPackSVG(n,'P')}</div><div class="rt"><b>${esc(def.name)}</b><span>${up?(hidden?'Releases '+fmtDate(def.rel,true):'Releases '+fmtDate(def.rel,true)):'Released '+fmtDate(def.rel,true)} · ${def.base} cards and ${def.total-def.base} premium alternate arts</span><span class="muted">${up?(brRevealed(n).length+' revealed'):'Collect regular, foil and premium art'}</span></div>${up?'':`<div class="rv"><b>${have}/${keys.length}</b><span>prints</span></div>`}</button>`; };
  return `<div class="panel"><div class="rows">${nx?row(nx,true):''}${rel.map(n=>row(n,false)).join('')}</div></div>`;
}
// your cards: identical copies stack into one tile; filter by what it is, search by name, sort, and page through
function brCollGroups(){
  const f=UI.brc, r=UI.brr, q=UI.brq.trim().toLowerCase(); const sealed=c=>brD(c.k).sealed; let a=myBr();
  const cnt={all:a.length, raw:a.filter(c=>!sealed(c)&&!(c.g>0)).length, gr:a.filter(c=>c.g>0||c.g<0).length, sl:a.filter(sealed).length, ls:a.filter(c=>c.l).length};
  a=a.filter(c=> f==='raw'? !sealed(c)&&!(c.g>0) : f==='gr'? (c.g>0||c.g<0) : f==='sl'? sealed(c) : f==='ls'? c.l : true);
  const rk=d=>{ if (d.sealed) return 'sealed'; const c=d.card; return d.v==='F'? 'foil' : brIsPrem(c)? 'prem' : c.rar; };
  if (r!=='all') a=a.filter(c=>rk(brD(c.k))===r);
  if (q) a=a.filter(c=>{ const d=brD(c.k); return (d.title+' '+d.def.name+' '+d.def.code+' '+(d.card?(d.card.aff||'')+' '+d.card.kind+' '+String(d.card.cn).padStart(3,'0'):'')).toLowerCase().includes(q); });
  const G2=new Map(); for (const c of a){ const k=c.k+'|'+(c.g>0?'g'+c.g:c.g<0?'atgcs':condLabel(c.c))+'|'+(c.l?'l':'')+(c.nw?'n':''); let g=G2.get(k); if (!g){ g={cs:[],k:c.k,v:0}; G2.set(k,g); } g.cs.push(c); g.v=Math.max(g.v,brCopyValue(c)); }
  const out=[...G2.values()]; const so=UI.brso;
  out.sort(so==='num'? (x,y)=>brD(x.k).set-brD(y.k).set||brD(x.k).no-brD(y.k).no||y.v-x.v : so==='name'? (x,y)=>brD(x.k).title.localeCompare(brD(y.k).title)||y.v-x.v : so==='new'? (x,y)=>Math.max(...y.cs.map(c=>c.id))-Math.max(...x.cs.map(c=>c.id)) : so==='many'? (x,y)=>y.cs.length-x.cs.length||y.v-x.v : (x,y)=>y.v-x.v);
  return {out, cnt, total:a.length};
}
function brCollV(){
  const f=UI.brc, r=UI.brr; const {out, cnt, total}=brCollGroups();
  const per=window.innerWidth>=900? 48 : 24, pages=Math.max(1,Math.ceil(out.length/per)), pg=Math.min(UI.brpg,pages-1);
  const ch=(k,n)=>`<button class="chip ${f===k?'on':''}" data-act="brc" data-a="${k}">${n} (${cnt[k]})</button>`;
  const rc=(k,n)=>`<button class="chip ${r===k?'on':''}" data-act="brr" data-a="${k}">${n}</button>`;
  const cell=g=>{ const c=g.cs[0], d=brD(g.k), n=g.cs.length; const tags=[c.nw?'<i class="tag new">New</i>':'', c.l?'<i class="tag">Listed</i>':c.g<0?'<i class="tag">At GCS</i>':''].join('');
    return `<button class="gcell" data-act="bropy" data-a="${c.id}">${n>1?`<span class="count">×${n}</span>`:''}${bMiniT(c)}<div class="cap"><b>${esc(d.title)}</b><span>${d.sealed?'Sealed':BR_VARN[d.v]+', '+(c.g>0?'GCS '+c.g:c.g<0?'at GCS':condLabel(c.c))}${d.no?' · '+d.def.code+' '+String(d.card.cn).padStart(3,'0'):''}</span><span>${money(g.v,true)}${n>1?' each':''}${tags}</span></div></button>`; };
  const nav=pages>1? `<div class="pager"><button class="btn sm" data-act="brpage" data-a="0" ${pg===0?'disabled':''}>« First</button><button class="btn sm" data-act="brpage" data-a="${pg-1}" ${pg===0?'disabled':''}>‹ Prev</button><span class="small">Page ${pg+1} of ${pages}</span><button class="btn sm" data-act="brpage" data-a="${pg+1}" ${pg>=pages-1?'disabled':''}>Next ›</button><button class="btn sm" data-act="brpage" data-a="${pages-1}" ${pg>=pages-1?'disabled':''}>Last »</button></div>` : '';
  return `<div class="chips">${ch('all','All')}${ch('raw','Raw')}${ch('gr','Graded')}${ch('sl','Sealed')}${ch('ls','Listed')}</div>
  <div class="chips">${rc('all','Any rarity')}${rc('prem','Premium art')}${rc('foil','Foil')}${rc('leg','Legendary')}${rc('sr','Super Rare')}${rc('rare','Rare')}${rc('unc','Uncommon')}${rc('common','Common')}${rc('sealed','Packs and boxes')}</div>
  <div class="tools" style="margin-bottom:10px"><input class="inp grow" type="search" placeholder="Search your cards: name, faction, type or number" value="${esc(UI.brq)}" data-inp="brq" aria-label="Search your cards">
    <select class="inp" data-chg="brso" aria-label="Sort">${[['val','Most valuable'],['num','Card number'],['name','Name'],['new','Newest'],['many','Most copies']].map(([k,n])=>`<option value="${k}" ${UI.brso===k?'selected':''}>${n}</option>`).join('')}</select></div>
  <p class="small muted" style="margin:0 0 8px">${total} card${total===1?'':'s'} in ${out.length} stack${out.length===1?'':'s'}. Identical copies are stacked (×N); open one to see them all.</p>
  ${nav}<div class="grid">${out.slice(pg*per,pg*per+per).map(cell).join('')||'<div class="empty">Nothing matches. Clear the search or pick another filter.</div>'}</div>${nav?`<div style="margin-top:10px">${nav}</div>`:''}`;
}
ACT.brc=a=>{ UI.brc=a; UI.brpg=0; render(true); }; ACT.brr=a=>{ UI.brr=a; UI.brpg=0; render(true); }; ACT.brso=v=>{ UI.brso=v; UI.brpg=0; render(true); };
ACT.brpage=a=>{ UI.brpg=Math.max(0,+a); render(true); window.scrollTo(0,0); };
let brqT=null; ACT.brq=v=>{ UI.brq=v; UI.brpg=0; clearTimeout(brqT); brqT=setTimeout(()=>{ const a=document.activeElement; const pos=a&&a.selectionStart; render(true); const i=$('[data-inp="brq"]'); if (i){ i.focus(); try{ i.setSelectionRange(pos,pos); }catch(e){} } },250); };
ACT.brbuy=(a,el)=>{ if (!armed(el)) return; const [n,f,q]=a.split('|'); const e=brBuySealed(+n,f,+q); if (e){ showToast(e); return; } showToast('Bought. It is in Your sealed product.', true); render(true); queueSave(); };
ACT.brpre=a=>{ const [n,f,q]=a.split('|'); const e=brPreorder(+n,f,+q); if (e){ showToast(e); return; } showToast('Preordered. You pay retail when it launches.', true); render(true); queueSave(); };
