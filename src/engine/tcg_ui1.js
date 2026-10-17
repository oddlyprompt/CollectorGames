// ===================== TCG: THE VIEWS =====================
UI.tcs=UI.tcs||'home'; UI.tcf=UI.tcf||'all'; UI.tcpg=0; UI.tcc=UI.tcc||'all';
const TC_STYC={aggro:'#c0392b',mid:'#2d7f9d',control:'#6b4bb8',combo:'#b87b1a',stall:'#3b8f5a'};
function tcDeckShare(cid){ let s=0; for (const a of G.tcg.arch) if (a.core.includes(cid)||a.tr.includes(cid)) s+=a.sh; return s; }
function tcCardTrend(cid){ let d=0; for (const a of G.tcg.arch){ if (!(a.core.includes(cid)||a.tr.includes(cid))) continue; const h=a.hist, w=Math.min(5,h.length); if (w>=2) d+=h[h.length-1]-h[h.length-w]; } return d>0.02?'rising': d<-0.02?'fading':'steady'; }
function tcPullOdds(key){ const d=tcD(key); if (d.sealed) return ''; const P=tcPools(d.set), c=d.card, O=TC_ODDS; let p=0; const rn=1-O.csr-O.sir-O.fa-O.ir-O.rare_holo;
  if (d.v==='N'){ if (c.rar==='common') p=(6-TC_REV)/P.c.length; else if (c.rar==='unc') p=2/P.u.length; else if (c.rar==='rare') p=rn/P.r.length; else if (c.rar==='ess') p=1/P.ess.length; }
  else if (d.v==='R') p=TC_REV*(c.rar==='common'? 0.62/P.c.length : c.rar==='unc'? 0.3/P.u.length : 0.08/P.r.length); else if (d.v==='H') p=O.rare_holo/P.r.length;
  else if (d.v==='I') p=O.ir/P.ir.length; else if (d.v==='F') p=O.fa/P.fa.length; else if (d.v==='X') p=O.sir/P.sir.length; else if (d.v==='C') p=O.csr/P.csr.length;
  return p>=0.99? 'in nearly every pack' : p>0? 'about 1 in '+Math.max(1,Math.round(1/p))+' packs' : ''; }
function tcTabsRow(){ const t=UI.tcs; const solo=typeof PACK!=='undefined'&&PACK.id==='tcg'; const b=(k,n)=>`<button class="chip ${t===k?'on':''}" data-act="tcs" data-a="${k}">${n}</button>`; return `<div class="chips" style="margin:6px 0 12px">${solo?'':b('home','Overview')}${b('shop','Shop')}${b('sets','Sets')}${b('meta','Metagame')}${solo?'':b('coll','Your cards')}</div>`; }
ACT.tcs=a=>{ UI.tcs=a; UI.tcpg=0; render(true); window.scrollTo(0,0); };
function tcView(){ const v={home:tcHome,shop:tcShopV,sets:tcSetsV,meta:tcMetaV,coll:tcCollV}[UI.tcs]||tcHome; return `<div class="tcg">${tip('wildkin1','Wildkin is a creature-collecting card game with nine affinities. First Bond is the first set: 180 cards, 140 in the base set and 40 premium chase cards. Tournaments decide what wins, and what wins decides what cards cost. Every card has real rules, and the game plays thousands of simulated matches to find out which decks win.')}${tcTabsRow()}${v()}</div>`; }
function myTcSummary(){ let n=0,g=0,s=0,val=0; for (const c of myTc()){ const d=tcD(c.k); if (d.sealed) s++; else if (c.g>0) g++; else n++; val+=tcCopyValue(c); } return {n,g,s,val}; }
function tcArchRow(a,i){ const h=a.hist, w=Math.min(5,h.length); const tr=w>=2? h[h.length-1]-h[h.length-w] : 0; const arrow=tr>0.012?'<span class="up">▲</span>': tr<-0.012?'<span class="down">▼</span>': w>=2?'<span class="muted">–</span>':'';
  return `<div class="row" style="cursor:default"><div class="rt"><b>${esc(a.name)}</b><span><i class="dot" style="background:${TCF.EL[a.el].c}"></i>${esc(a.el)} · ${TC_STYN[a.st]} ${arrow}</span><div class="bar" style="margin-top:4px;max-width:220px"><i style="width:${Math.min(100,a.sh*300)}%;background:${TC_STYC[a.st]}"></i></div></div><div class="rv"><b>${(a.sh*100).toFixed(0)}%</b><span>of decks</span></div></div>`; }
function tcEvRow(e){ const A=G.tcg.arch; const nm=id=>{ const a=A.find(x=>x.id===id); return a? a.name : id.replace('|',' '); }; const k={local:'Local',regional:'Regional',champ:'Championship'}[e.k];
  return `<div class="row" style="cursor:default"><div class="rt"><b>${k}: ${esc(nm(e.win))}</b><span>${fmtDate(e.d)} · ${e.n} players · won by ${esc(e.winner)}</span></div></div>`; }
// the home panels, separately, so the Wildkin-only build can lay them out in its own columns
function tcHomePanels(){
  const T=G.tcg, nx=tcNextSet(G.day), sm=myTcSummary(), P={};
  const banned=Object.keys(T.ban).filter(c=>T.ban[c].d>G.day).map(c=>({c:tcCardByCid(+c),d:T.ban[c].d})).filter(x=>x.c);
  P.next= nx? (()=>{ const def=tcSetDef(nx), days=def.rel-G.day, rev=tcRevealed(nx).length; return `<div class="panel"><h3>Next set: ${esc(def.name)}</h3><p class="small muted" style="margin:0 0 8px">Releases ${fmtDate(def.rel,true)}, in ${days} day${days===1?'':'s'}. ${rev? rev+' of '+tcSetCards(nx).length+' cards revealed so far.' : 'Nothing has been shown yet.'}${def.reprint?' A greatest-hits set: it reprints cards from earlier ones.':''}</p><div class="formrow"><button class="btn sm pri" data-act="tset" data-a="${nx}">See the previews</button><button class="btn sm" data-act="tcs" data-a="shop">Preorders</button></div></div>`; })() : tcSetProgressPanel();
  // the cards that define decks: Wildkin first; trainers every deck runs say little about the metagame
  const nDecks=T.arch.length||1; const inDecks=cid=>T.arch.filter(a=>a.cnt&&a.cnt[cid]).length;
  const hot=Object.keys(T.usage).map(cid=>({c:tcCardByCid(+cid),u:T.usage[cid]})).filter(x=>x.c&&x.c.kind==='creature'&&tcLegalState(x.c.cid)==='std').sort((a,b)=>b.u-a.u).slice(0,8);
  P.meta=`<div class="panel"><div class="phead"><h3>The metagame this week</h3><button class="linkbtn" data-act="tcs" data-a="meta">All</button></div><div class="rows">${T.arch.slice(0,6).map(tcArchRow).join('')||'<div class="empty">No tournaments yet. Decks form when '+esc(WK_CANON.set.name)+' is out.</div>'}</div></div>`;
  P.results=`<div class="panel"><h3>Latest results</h3><div class="rows">${T.ev.filter(e=>e.k!=='local').slice(0,3).concat(T.ev.filter(e=>e.k==='local').slice(0,1)).map(tcEvRow).join('')||'<div class="empty">Nothing yet.</div>'}</div></div>`;
  P.coll=`<div class="panel"><h3>Your Wildkin collection</h3><div class="kpis"><div class="kpi"><small>Cards</small><b>${sm.n}</b></div><div class="kpi"><small>Graded</small><b>${sm.g}</b></div><div class="kpi"><small>Sealed</small><b>${sm.s}</b></div><div class="kpi"><small>Worth about</small><b>${money(sm.val,true)}</b></div></div><div class="formrow"><button class="btn sm" data-act="tcs" data-a="coll">Open your cards</button></div></div>`;
  P.ban= banned.length?`<div class="panel"><h3>Ban coming</h3><div class="rows">${banned.map(x=>`<button class="row" data-act="tdesign" data-a="${esc(tcAllKeys(x.c.set).find(k=>tcD(k).no===x.c.no))}"><div class="rt"><b>${esc(x.c.name)}</b><span>Banned from Standard on ${fmtDate(x.d)}</span></div></button>`).join('')}</div></div>`:'';
  P.hot= hot.length? `<div class="panel"><h3>Most played Wildkin</h3><div class="rows">${hot.map(x=>{ const k=tcAllKeys(x.c.set).find(k=>tcD(k).no===x.c.no); return `<button class="row" data-act="tdesign" data-a="${esc(k)}">${miniTKey(k)}<div class="rt"><b>${esc(x.c.name)}</b><span>in ${inDecks(x.c.cid)} of ${nDecks} top decks · ${tcCardTrend(x.c.cid)}</span></div><div class="rv"><b>${money(tcFairRaw(k),true)}</b></div></button>`; }).join('')}</div></div>` : '';
  P.news=`<div class="panel"><h3>Wildkin news</h3>${G.news.filter(n=>n.k==='tcg').slice(0,5).map(n=>`<div class="newsrow"><b>${esc(n.h)}</b><p>${esc(n.b)}</p><div class="meta">${fmtDate(n.t)}</div></div>`).join('')||'<div class="empty">Quiet.</div>'}</div>`;
  return P;
}
function tcHome(){ const P=tcHomePanels(); return `<div class="cols"><div class="stack">${P.next}${P.meta}${P.results}</div><div class="stack">${P.coll}${P.ban}${P.hot}${P.news}</div></div>`; }
function tcSetProgressPanel(){ const own=new Set(myTc().filter(c=>!tcD(c.k).sealed).map(c=>tcD(c.k).no)); const cs=tcSetCards(1); const base=cs.filter(c=>c.no<=WK_CANON.set.base).length; const hb=[...own].filter(n=>n<=WK_CANON.set.base).length, hp=[...own].filter(n=>n>WK_CANON.set.base).length; const done=cs.filter(c=>tcArtState(c).state==='final').length;
  return `<div class="panel"><h3>${esc(WK_CANON.set.name)}</h3><p class="small muted" style="margin:0 0 8px">The first Wildkin set: ${cs.length} cards. No next set has been announced.</p><dl class="kv"><dt>Base set</dt><dd>You have ${hb} of ${base}</dd><dt>Premium</dt><dd>You have ${hp} of ${cs.length-base}</dd>${done+cs.filter(c=>tcArtState(c).state==='vector').length<cs.length?`<dt>Art</dt><dd>${done} of ${cs.length} cards finished; the rest show a labelled placeholder</dd>`:''}</dl><div class="formrow"><button class="btn sm pri" data-act="tset" data-a="1">See the set</button></div></div>`; }
function tcRetailV(){
  const T=G.tcg, sets=tcRetailSets(G.day).slice().reverse(), nx=tcNextSet(G.day); const own=myTc().filter(c=>tcD(c.k).sealed&&!c.l);
  const row=(n)=>{ const def=tcSetDef(n), s=T.shop[n]||{pack:0,box:0}; const pk=tcKey(n,0,'P'), bx=tcKey(n,0,'B');
    return `<div class="panel"><div style="display:flex;gap:12px;flex-wrap:wrap"><div style="display:flex;gap:6px;align-items:flex-end;flex:none"><div style="width:96px">${tcPackSVG(n,'P',Math.floor(G.day/7))}</div><div style="width:128px">${tcPackSVG(n,'B')}</div></div><div style="flex:1;min-width:220px"><h3 style="margin:0">${esc(def.name)}</h3><div class="small muted">Released ${fmtDate(def.rel,true)}${tcLegalSets(G.day).includes(n)?' · legal in Standard':' · rotated out'}</div><dl class="kv" style="margin-top:6px"><dt>Booster pack</dt><dd>${money(TC_MSRP.P,true)} · ${s.pack} in stock · market about ${money(tcFairRaw(pk),true)}</dd><dt>Booster box</dt><dd>${money(TC_MSRP.B)} · ${s.box} in stock · market about ${money(tcFairRaw(bx),true)}</dd></dl></div></div>
      <div class="formrow"><button class="btn sm" data-act="tcbuy" data-a="${n}|P|1" ${s.pack<1||G.player.cash<TC_MSRP.P?'disabled':''}>Buy a pack</button><button class="btn sm" data-act="tcbuy" data-a="${n}|P|5" ${s.pack<5||G.player.cash<TC_MSRP.P*5?'disabled':''}>Buy 5 packs</button><button class="btn sm pri" data-act="tcbuy" data-a="${n}|B|1" data-confirm="Pay ${money(TC_MSRP.B)}" ${s.box<1||G.player.cash<TC_MSRP.B?'disabled':''}>Buy a box</button></div>${s.box<1?'<div class="small muted" style="margin-top:6px">Boxes are sold out. Look for them on the marketplace, usually above retail.</div>':''}</div>`; };
  const pre= nx? (()=>{ const def=tcSetDef(nx); const q=f=>T.pre.filter(p=>p.set===nx&&p.f===f).reduce((s,p)=>s+p.q,0); return `<div class="panel"><h3>Preorder ${esc(def.name)}</h3><p class="small muted" style="margin:0 0 8px">Releases ${fmtDate(def.rel,true)}. Preorders are charged at retail price when it launches, and they are guaranteed, unlike the shelf. Limit 2 boxes and 12 packs.</p><div class="formrow"><button class="btn sm" data-act="tcpre" data-a="${nx}|P|1">+1 pack (${q('P')})</button><button class="btn sm" data-act="tcpre" data-a="${nx}|P|6">+6 packs</button><button class="btn sm pri" data-act="tcpre" data-a="${nx}|B|1">+1 box (${q('B')})</button></div></div>`; })() : '';
  return `<div class="cols"><div class="stack">${pre}${sets.map(row).join('')||'<div class="panel"><div class="empty">Nothing on the shelves.</div></div>'}</div>
  <div class="stack">${tcSealedPanel()}${tcRestockPanel()}</div></div>`;
}
function tcSetsV(){
  const rel=tcReleasedSets(G.day).slice().reverse(), nx=tcNextSet(G.day); const owned=new Set(myTc().map(c=>c.k)); const legal=tcLegalSets(G.day);
  const row=(n,up)=>{ const def=tcSetDef(n); const keys=up?[]:tcAllKeys(n); const have=keys.filter(k=>owned.has(k)).length;
    return `<button class="row" data-act="tset" data-a="${n}"><div class="mini" style="width:44px">${tcPackSVG(n,'P')}</div><div class="rt"><b>${esc(def.name)}</b><span>${up?'Releases '+fmtDate(def.rel,true):'Released '+fmtDate(def.rel,true)} · ${tcSetCards(n).length} cards${def.reprint?' · reprints':''}</span><span class="${up?'':legal.includes(n)?'up':'muted'}">${up?(tcRevealed(n).length+' revealed'):legal.includes(n)?'Legal in Standard':'Rotated out'}</span></div>${up?'':`<div class="rv"><b>${have}/${keys.length}</b><span>prints</span></div>`}</button>`; };
  return `<div class="panel"><div class="rows">${nx?row(nx,true):''}${rel.map(n=>row(n,false)).join('')}</div></div>`;
}
function tcMetaV(){
  const T=G.tcg; const legal=tcLegalSets(G.day); const bans=Object.keys(T.ban).map(c=>({c:tcCardByCid(+c),b:T.ban[c]})).filter(x=>x.c).sort((a,b)=>b.b.d-a.b.d);
  const used=Object.keys(T.usage).map(cid=>({c:tcCardByCid(+cid),u:T.usage[cid]})).filter(x=>x.c).sort((a,b)=>b.u-a.u).slice(0,12);
  const nx=tcNextSet(G.day); let rot=''; if (nx){ const def=tcSetDef(nx), after=tcReleasedSets(def.rel).slice(-3); const out=legal.filter(s=>!after.includes(s)); if (out.length) rot=`<p class="small" style="margin:6px 0 0">${esc(out.map(s=>tcSetDef(s).name).join(' and '))} rotates out on ${fmtDate(def.rel,true)}.</p>`; }
  return `<div class="cols"><div class="stack"><div class="panel"><h3>Standard decks</h3><p class="small muted" style="margin:0 0 8px">Share of decks in recent events. Strong decks rise, popular decks get answered.</p><div class="rows">${T.arch.map(tcArchRow).join('')}</div></div>
    <div class="panel"><h3>Recent events</h3><div class="rows">${T.ev.slice(0,10).map(tcEvRow).join('')}</div></div></div>
  <div class="stack"><div class="panel"><h3>What's legal</h3><p class="small" style="margin:0">Standard uses the newest three sets: ${legal.map(s=>`<b>${esc(tcSetDef(s).name)}</b>`).join(', ')}. Everything else is open format only, and plays far less.</p>${rot}</div>
    <div class="panel"><h3>Banned cards</h3><div class="rows">${bans.map(x=>`<button class="row" data-act="tdesign" data-a="${esc(tcAllKeys(x.c.set).find(k=>tcD(k).no===x.c.no))}"><div class="rt"><b>${esc(x.c.name)}</b><span>${x.b.d>G.day?'Banned on ':'Banned since '}${fmtDate(x.b.d,true)}, after ${esc(x.b.why)}</span></div></button>`).join('')||'<div class="empty">Nothing banned yet.</div>'}</div></div>
    <div class="panel"><h3>Most played cards</h3><div class="rows">${used.map(x=>{ const k=tcAllKeys(x.c.set).find(k=>tcD(k).no===x.c.no); return `<button class="row" data-act="tdesign" data-a="${esc(k)}">${miniTKey(k)}<div class="rt"><b>${esc(x.c.name)}</b><span>${Math.round(tcDeckShare(x.c.cid)*100)}% of decks · ${tcLegalState(x.c.cid)==='std'?'Standard':'open only'}</span></div><div class="rv"><b>${money(tcFairRaw(k),true)}</b></div></button>`; }).join('')}</div></div></div></div>`;
}
// your cards: identical copies stack into one tile; filter by what it is, search by name, sort, and page through
UI.tcq=UI.tcq||''; UI.tcr=UI.tcr||'all'; UI.tcso=UI.tcso||'val';
function tcCollGroups(){
  const f=UI.tcc, r=UI.tcr, q=UI.tcq.trim().toLowerCase(); const sealed=c=>tcD(c.k).sealed; let a=myTc();
  const cnt={all:a.length, raw:a.filter(c=>!sealed(c)&&!(c.g>0)).length, gr:a.filter(c=>c.g>0||c.g<0).length, sl:a.filter(sealed).length, ls:a.filter(c=>c.l).length};
  a=a.filter(c=> f==='raw'? !sealed(c)&&!(c.g>0) : f==='gr'? (c.g>0||c.g<0) : f==='sl'? sealed(c) : f==='ls'? c.l : true);
  const rk=d=>{ if (d.sealed) return 'sealed'; const c=d.card; return tcIsPrem(c)? 'prem' : c.kind==='essence'? 'ess' : c.kind!=='creature'? 'trainer' : c.rar; };
  if (r!=='all') a=a.filter(c=>rk(tcD(c.k))===r);
  if (q) a=a.filter(c=>{ const d=tcD(c.k); return (d.title+' '+(d.card?(d.card.el||'')+' '+String(d.no).padStart(3,'0'):'')).toLowerCase().includes(q); });
  const G2=new Map(); for (const c of a){ const k=c.k+'|'+(c.g>0?'g'+c.g:c.g<0?'atgcs':tcLabel(c.c))+'|'+(c.l?'l':'')+(c.nw?'n':''); let g=G2.get(k); if (!g){ g={cs:[],k:c.k,v:0}; G2.set(k,g); } g.cs.push(c); g.v=Math.max(g.v,tcCopyValue(c)); }
  const out=[...G2.values()]; const so=UI.tcso;
  out.sort(so==='num'? (x,y)=>tcD(x.k).no-tcD(y.k).no||y.v-x.v : so==='name'? (x,y)=>tcD(x.k).title.localeCompare(tcD(y.k).title)||y.v-x.v : so==='new'? (x,y)=>Math.max(...y.cs.map(c=>c.id))-Math.max(...x.cs.map(c=>c.id)) : so==='many'? (x,y)=>y.cs.length-x.cs.length||y.v-x.v : (x,y)=>y.v-x.v);
  return {out, cnt, total:a.length};
}
function tcCollV(){
  const f=UI.tcc, r=UI.tcr; const {out, cnt, total}=tcCollGroups();
  const per=window.innerWidth>=900? 48 : 24, pages=Math.max(1,Math.ceil(out.length/per)), pg=Math.min(UI.tcpg,pages-1);
  const ch=(k,n)=>`<button class="chip ${f===k?'on':''}" data-act="tcc" data-a="${k}">${n} (${cnt[k]})</button>`;
  const rc=(k,n)=>`<button class="chip ${r===k?'on':''}" data-act="tcr" data-a="${k}">${n}</button>`;
  const cell=g=>{ const c=g.cs[0], d=tcD(g.k), n=g.cs.length; const tags=[c.nw?'<i class="tag new">New</i>':'', c.l?'<i class="tag">Listed</i>':c.g<0?'<i class="tag">At GCS</i>':''].join('');
    return `<button class="gcell" data-act="tcopy" data-a="${c.id}">${n>1?`<span class="count">×${n}</span>`:''}${miniT(c)}<div class="cap"><b>${esc(d.title)}</b><span>${d.sealed?'Sealed':TC_VARN[d.v]+', '+(c.g>0?'GCS '+c.g:c.g<0?'at GCS':tcLabel(c.c))}${d.no?' · #'+String(d.no).padStart(3,'0'):''}</span><span>${money(g.v,true)}${n>1?' each':''}${tags}</span></div></button>`; };
  const nav=pages>1? `<div class="pager"><button class="btn sm" data-act="tcpage" data-a="0" ${pg===0?'disabled':''}>« First</button><button class="btn sm" data-act="tcpage" data-a="${pg-1}" ${pg===0?'disabled':''}>‹ Prev</button><span class="small">Page ${pg+1} of ${pages}</span><button class="btn sm" data-act="tcpage" data-a="${pg+1}" ${pg>=pages-1?'disabled':''}>Next ›</button><button class="btn sm" data-act="tcpage" data-a="${pages-1}" ${pg>=pages-1?'disabled':''}>Last »</button></div>` : '';
  return `<div class="chips">${ch('all','All')}${ch('raw','Raw')}${ch('gr','Graded')}${ch('sl','Sealed')}${ch('ls','Listed')}</div>
  <div class="chips">${rc('all','Any rarity')}${rc('prem','Premium')}${rc('rare','Rare')}${rc('unc','Uncommon')}${rc('common','Common')}${rc('trainer','Allies, gear, biomes, tactics')}${rc('ess','Essence')}${rc('sealed','Packs and boxes')}</div>
  <div class="tools" style="margin-bottom:10px"><input class="inp grow" type="search" placeholder="Search your cards: name, affinity or number" value="${esc(UI.tcq)}" data-inp="tcq" aria-label="Search your cards">
    <select class="inp" data-chg="tcso" aria-label="Sort">${[['val','Most valuable'],['num','Card number'],['name','Name'],['new','Newest'],['many','Most copies']].map(([k,n])=>`<option value="${k}" ${UI.tcso===k?'selected':''}>${n}</option>`).join('')}</select></div>
  <p class="small muted" style="margin:0 0 8px">${total} card${total===1?'':'s'} in ${out.length} stack${out.length===1?'':'s'}. Identical copies are stacked (×N); open one to see them all.</p>
  ${nav}<div class="grid">${out.slice(pg*per,pg*per+per).map(cell).join('')||'<div class="empty">Nothing matches. Clear the search or pick another filter.</div>'}</div>${nav?`<div style="margin-top:10px">${nav}</div>`:''}`;
}
ACT.tcc=a=>{ UI.tcc=a; UI.tcpg=0; render(true); }; ACT.tcr=a=>{ UI.tcr=a; UI.tcpg=0; render(true); }; ACT.tcso=v=>{ UI.tcso=v; UI.tcpg=0; render(true); };
ACT.tcpage=a=>{ UI.tcpg=Math.max(0,+a); render(true); window.scrollTo(0,0); };
let tcqT=null; ACT.tcq=v=>{ UI.tcq=v; UI.tcpg=0; clearTimeout(tcqT); tcqT=setTimeout(()=>{ const a=document.activeElement; const pos=a&&a.selectionStart; render(true); const i=$('[data-inp="tcq"]'); if (i){ i.focus(); try{ i.setSelectionRange(pos,pos); }catch(e){} } },250); };
ACT.tcbuy=(a,el)=>{ if (!armed(el)) return; const [n,f,q]=a.split('|'); const e=tcBuySealed(+n,f,+q); if (e){ showToast(e); return; } showToast('Bought. It is in Your sealed product.', true); render(true); queueSave(); };
ACT.tcpre=a=>{ const [n,f,q]=a.split('|'); const e=tcPreorder(+n,f,+q); if (e){ showToast(e); return; } showToast('Preordered. You pay retail when it launches.', true); render(true); queueSave(); };
// the Wildkin tab lives next to the card shop
(function(){
  const sv=VIEWS.shop; VIEWS.shop=()=>{ let h=sv(); const on=UI.sub.shop==='tcg'; const btn='<button class="'+(on?'on':'')+'" data-act="goto" data-a="shop:tcg">Wildkin TCG</button>';
    h=h.replace(/(<button class="(?:on)?" data-act="goto" data-a="shop:breaks">)/, btn+'$1'); if (on) h=h.replace('class="on" data-act="goto" data-a="shop:main"','class="" data-act="goto" data-a="shop:main"');
    if (!on) return h; const i=h.indexOf('<div class="subtabs">'); const j=h.indexOf('</div>',i)+6; return h.slice(0,j)+tcView(); };
  const bv=VIEWS.ball; VIEWS.ball=()=>bv().replace(/(<button class="" data-act="goto" data-a="shop:breaks">)/, '<button class="" data-act="goto" data-a="shop:tcg">Wildkin TCG</button>$1');
})();
