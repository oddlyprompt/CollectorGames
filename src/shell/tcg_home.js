// ===================== Trading Card Collector: Home decisions, first steps, pinned focus (tcg build only) =====================
// Reorganises what Home shows, using the systems that already exist (offers, auctions, grading returns, wantlists, releases, set progress):
//   1. a skippable five-step start for a new player, computed from what they have done (nothing is forced),
//   2. "Needs you": offers to answer, auctions ending, grading returns, wanted cards that are for sale now, releases close by,
//   3. "Your focus": the collecting target they chose (a set) and any cards they pinned,
//   4. game tiles with accurate invitations (preview and preorder before a release, never "open a pack" with empty shelves).
// State lives in G.player.ui (saved with the game): {introDone, goal, focus:{g,set}, pins:[keys], seen:{}}.
(function(){
  if (!packHas('tcg')) return;
  const U=()=>{ const P=G.player; return P.ui||(P.ui={introDone:false, goal:null, focus:null, pins:[], seen:{}}); };
  // one adapter per franchise, so the Home code below is written once
  const FRS={
    tc:{id:'tc', tab:'shop', name:'Wildkin', c:'134,207,116', img:'art/scene.verdant.01.jpg', has:()=>!!G.tcg, rel:t=>tcReleasedSets(t), next:t=>tcNextSet(t), def:n=>tcSetDef(n), stock:(n)=>tcStock(n,'P'), want:()=>tcWant(), where:k=>tcWhere(k), D:k=>tcD(k), mine:()=>myTc(), own:()=>tcOwnState(), cards:n=>tcSetCards(n), sum:()=>myTcSummary(), design:'tdesign', cg:'wk', prefix:'T'},
    xt:{id:'xt', tab:'xt', name:'Tidemark', c:'71,192,180', img:'art/TMI-0040.webp', has:()=>!!G.xtg, rel:t=>xtReleasedSets(t), next:t=>xtNextSet(t), def:n=>xtSetDef(n), stock:(n)=>xtStock(n,'P'), want:()=>xtWant(), where:k=>xtWhere(k), D:k=>xtD(k), mine:()=>myXt(), own:()=>xtOwnState(), cards:n=>xtSetCards(n), sum:()=>myXtSummary(), design:'xtdesign', cg:'xt', prefix:'X'},
    br:{id:'br', tab:'br', name:'Broken Reach', c:'208,143,82', img:'art/br-BR01-001.webp', has:()=>!!G.brg, rel:t=>brReleasedSets(t), next:t=>brNextSet(t), def:n=>brSetDef(n), stock:(n)=>brStock(n,'P'), want:()=>brWant(), where:k=>brWhere(k), D:k=>brD(k), mine:()=>myBr(), own:()=>brOwnState(), cards:n=>brSetCards(n), sum:()=>myBrSummary(), design:'brdesign', cg:'br', prefix:'B'} };
  const LIST=['tc','xt','br'].map(k=>FRS[k]);   // filtered per call by frs(): the game does not exist yet when this file loads
  const frs=()=>LIST.filter(f=>{ try { return f.has(); } catch(e){ return false; } });
  const byPrefix=k=>LIST.find(f=>f.prefix===String(k)[0]);
  const safe=(fn,d)=>{ try { return fn(); } catch(e){ return d; } };
  const newest=f=>{ const r=f.rel(G.day); return r.length? r[r.length-1] : null; };
  const sd=day=>String(fmtDate(day,true)).replace(/,\s*\d{4}$/,'');   // 'Jun 8'
  function upcoming(){ let best=null; for (const f of frs()){ const n=f.next(G.day); if (n==null) continue; const d=f.def(n); if (!best||d.rel<best.d.rel) best={f,n,d}; } return best; }
  const relTxt=f=>{ const n=f.next(G.day); if (!n) return ''; const d=f.def(n); return d.name+' · '+fmtDate(d.rel,true); };
  function shelfNow(){ for (const f of frs()){ const n=newest(f); if (n!=null && safe(()=>f.stock(n),0)>0) return {f,n}; } return null; }
  function ownsAnything(){ return frs().some(f=>safe(()=>f.mine().length,0)>0); }
  // ---------- tiles ----------
  function tileHTML(){ return '<div class="games">'+frs().map(f=>{ const s=safe(()=>f.sum(),null), n=s? (s.n||0)+(s.g||0) : 0, sl=s? (s.s||0) : 0, out=f.rel(G.day).length>0, nx=f.next(G.day), shelf=out&&safe(()=>f.stock(newest(f)),0)>0;
      const line= n||sl? (n? n+' card'+(n===1?'':'s') : '')+(sl? (n?' · ':'')+sl+' sealed' : '') : shelf? 'Packs on the shelf' : nx? 'Preview · '+f.def(nx).name+' '+sd(f.def(nx).rel) : 'Singles in the Market';
      return `<button class="gtile" data-act="tab" data-a="${f.tab}" style="background-image:url('${f.img}');--c:${f.c}"><span class="gt"><b>${f.name}</b><small>${esc(line)}</small></span></button>`; }).join('')+'</div>'; }
  // ---------- first steps ----------
  const startDay=()=>G.player.start||0;
  function introSteps(){ const u=U(), sh=shelfNow(), own=ownsAnything();
    return [ {k:'time', done:G.day>startDay()+0 || u.seen.time, t:'Time moves when you say so', d:'Press Next day to advance one day, or Skip to jump to the next thing that matters. Your allowance of $50 arrives every Friday, so money comes in as days pass.', b:null},
             {k:'get', done:own, t:'Get something to hold', d: sh? 'The '+sh.f.name+' shelf has stock today. A pack is the classic start; singles in the Market are the careful one.' : (()=>{ const u2=upcoming(); return 'No new pack is on a shelf yet'+(u2? ': '+u2.d.name+' ('+u2.f.name+') arrives '+fmtDate(u2.d.rel,true)+'. You can preview it and preorder as soon as it is announced.' : '.')+' The Market already has cards and sealed product for sale, so you can buy something today.'; })(), b: sh? [['tab:'+sh.f.tab,'Shop '+sh.f.name],['tab:market','Browse the Market']] : [['tab:market','Browse the Market']] },
             {k:'look', done:u.seen.look, t:'Look at what you got', d:'Open Collection and tap a card or pack. The card page shows its price history, where to buy more, and a 3D inspector.', b:[['tab:coll','Open Collection']] },
             {k:'goal', done:!!u.goal, t:'Choose what you are collecting', d:'Pick one; you can change it any time.', b:null, goal:true},
             {k:'next', done:u.introDone, t:'Your next useful move', d:'', b:null, last:true} ]; }
  function introHTML(){ const u=U(); if (u.introDone) return ''; const st=introSteps(); const i=Math.max(0, st.findIndex(s=>!s.done)); const cur=st[i]||st[st.length-1];
    let body=`<p class="small" style="margin:0 0 8px">${esc(cur.d)}</p>`;
    if (cur.goal) body+=`<div class="chips">${[['set','Complete a set'],['grail','Chase one grail card'],['deck','Follow the metagame'],['free','Just open packs']].map(([k,n])=>`<button class="chip" data-act="introgoal" data-a="${k}">${n}</button>`).join('')}</div>`;
    else if (cur.last) body+=`<p class="small" style="margin:0 0 8px">${esc(nextMove())}</p><div class="formrow"><button class="btn sm pri" data-act="introdone">Got it</button></div>`;
    else if (cur.b) body+=`<div class="formrow">${cur.b.map(([a,n])=>{ const [kind,arg]=a.split(':'); return `<button class="btn sm pri" data-act="introgo" data-a="${a}">${n}</button>`; }).join('')}${cur.k==='time'?'':''}</div>`;
    if (cur.k==='time') body+=`<div class="formrow"><button class="btn sm" data-act="introack" data-a="time">Understood</button></div>`;
    return `<div class="panel intro hp"><div class="phead"><h3>Getting started · ${Math.min(i+1,st.length)} of ${st.length}</h3><button class="linkbtn" data-act="introdone">Skip</button></div><div class="steps">${st.map((s,j)=>`<i class="${s.done?'done':j===i?'cur':''}"></i>`).join('')}</div><b style="display:block;margin:8px 0 2px">${esc(cur.t)}</b>${body}</div>`; }
  function nextMove(){ const u=U(), g=u.goal; if (g==='set'&&u.focus) return 'Check Home each day: your set progress is under Your focus. Singles in the shops fill gaps quickly; packs are the lottery.'; if (g==='grail') return 'Open any card page and tap Add to wantlist. Home will show where that card is cheapest and tell you when someone lists it.'; if (g==='deck') return 'The metagame panels on Home show what is winning this week. Cards in winning decks tend to cost more.'; return 'Open what you bought, then check Home each day for offers, restocks and releases.'; }
  ACT.introack=a=>{ U().seen[a]=1; render(true); queueSave(); };
  ACT.introgo=a=>{ const [k,x]=a.split(':'); if (k==='tab'){ if (x==='coll') U().seen.look=1; ACT.tab? ACT.tab(x) : (UI.tab=x, render(true)); window.scrollTo(0,0); } queueSave(); };
  ACT.introdone=()=>{ U().introDone=true; render(true); queueSave(); showToast('You can reopen the basics from Settings any time.'); };
  ACT.introgoal=a=>{ const u=U(); u.goal=a; if (a==='set'){ const f=frs().find(f=>f.rel(G.day).length>0)||frs()[0]; if (f){ const n=newest(f)||f.next(G.day)||1; u.focus={g:f.id,set:n}; } } else u.focus=null; render(true); queueSave(); };
  ACT.focusgame=a=>{ const [g,n]=a.split(':'); U().focus={g,set:+n}; U().goal='set'; render(true); queueSave(); };
  ACT.focusgo=()=>{ const f=U().focus; if (!f) return; UI.cg=FRS[f.g].cg; UI.tab='coll'; UI.sub.coll='sets'; closeSheet(true); render(); window.scrollTo(0,0); };
  // opening a card page counts as having looked at something
  for (const a of ['tcopy','xtopy','bropy']) if (ACT[a]){ const o=ACT[a]; ACT[a]=function(){ try { if (G&&G.player) U().seen.look=1; } catch(e){} return o.apply(this,arguments); }; }
  ACT.pinkey=a=>{ const u=U(); const i=u.pins.indexOf(a); if (i>=0){ u.pins.splice(i,1); showToast('Unpinned from Home.'); } else { u.pins.unshift(a); if (u.pins.length>6) u.pins.length=6; showToast('Pinned to Home.', true); } refreshSheet(); render(true); queueSave(); };
  // ---------- needs you ----------
  function needsRows(){ const rows=[]; const row=(t,s,act,a,btn)=>rows.push(`<div class="row" style="cursor:default"><div class="rt"><b>${esc(t)}</b><span>${esc(s)}</span></div><button class="btn sm ${act==='listing'?'pri':''}" data-act="${act}" data-a="${esc(String(a))}">${btn}</button></div>`);
    for (const l of G.lst){ if (l.sel===0 && l.offers && l.offers.length){ const best=Math.max(...l.offers.map(o=>o.amt)); row(safe(()=>itemLabel(l),'Your listing'), l.offers.length+' offer'+(l.offers.length>1?'s':'')+', best '+money(best,true)+' (asking '+money(l.pr,true)+')', 'listing', l.id, 'Respond'); } }
    for (const l of G.lst){ if (l.ty==='auc' && l.en!=null && l.en-G.day<=2 && l.en>=G.day && (G.player.watch.includes(l.id) || l.bids.some(b=>b[0]===0))) row(safe(()=>itemLabel(l),'Auction'), 'Ends '+safe(()=>dayTxt(l.en),'soon')+' · now '+money(l.cur||l.pr,true)+(l.lead===0?' · you are leading':l.bids.some(b=>b[0]===0)?' · you were outbid':''), 'listing', l.id, 'Open'); }
    const rv=safe(()=>rvQueue().length,0); if (rv) row(rv+' grading return'+(rv>1?'s':'')+' ready', 'Your slabs are back. Open them to see the grades.', 'rvstart', '', 'Open');
    for (const f of frs()){ for (const k of safe(()=>f.want(),[]).slice(0,8)){ const b=safe(()=>f.where(k)[0],null); if (b && G.player.cash>=b.p) row(f.D(k).title+' is for sale', b.w+' · '+money(b.p,true)+' ('+b.note+') · on your wantlist', b.act, b.a, 'Buy'); } }
    for (const f of frs()){ const n=f.next(G.day); if (n!=null){ const d=f.def(n), days=d.rel-G.day; if (days<=35) row(d.name+' ('+f.name+')', (days<=0?'Out now':'Releases '+fmtDate(d.rel,true)+', in '+days+' day'+(days===1?'':'s'))+'. Preorders and previews are open.', 'tab', f.tab, 'Preview'); } }
    return rows.slice(0,7); }
  function needsHTML(){ const r=needsRows(); if (!r.length) return `<div class="panel hp" style="padding:10px 14px"><div class="small muted">Nothing needs you right now. Skip ahead to the next event, or browse for something to chase.</div></div>`; return `<div class="panel hp"><div class="phead"><h3>Needs you</h3><span class="small muted">${r.length} thing${r.length>1?'s':''}</span></div><div class="rows">${r.join('')}</div></div>`; }
  // ---------- focus and pins ----------
  function focusHTML(){ const u=U(); const bits=[];
    if (u.focus){ const f=FRS[u.focus.g]; if (f){ const set=u.focus.set, def=safe(()=>f.def(set),null); if (def){ const total=f.cards(set).length, own=f.own().nos; let got=0; for (const x of own) if (x.startsWith(set+'|')) got++; const pc=total? Math.round(100*got/total) : 0;
      bits.push(`<div class="row" style="cursor:default"><div class="rt"><b>${esc(f.name)}: ${esc(def.name)}</b><span>${got} of ${total} cards (${pc}%)</span><div class="bar" style="margin-top:6px"><i style="width:${pc}%;background:rgb(${f.c})"></i></div></div><button class="btn sm" data-act="focusgo">View missing</button></div>`); } } }
    for (const k of u.pins){ const f=byPrefix(k); if (!f) continue; const d=safe(()=>f.D(k),null); if (!d) continue; const wh=safe(()=>f.where(k)[0],null);
      bits.push(`<div class="row" style="cursor:default"><div class="rt"><b>${esc(d.title)}</b><span>${wh? 'Cheapest now: '+wh.w+', '+money(wh.p,true) : 'Nobody has one for sale right now'}</span></div><button class="btn sm" data-act="${f.design}" data-a="${esc(k)}">Open</button></div>`); }
    if (!bits.length) return U().introDone? `<div class="panel hp" style="padding:10px 14px"><div class="small muted">Pick something to chase: tap <b>Pin to Home</b> on any card page, or choose a set to complete.</div><div class="formrow" style="margin-top:6px">${frs().filter(f=>f.rel(G.day).length>0||f.next(G.day)).map(f=>{ const n=newest(f)||f.next(G.day); return `<button class="chip" data-act="focusgame" data-a="${f.id}:${n}">Complete ${esc(f.name)} ${esc(f.def(n).name)}</button>`; }).join('')}</div></div>` : '';
    return `<div class="panel hp"><h3>Your focus</h3><div class="rows">${bits.join('')}</div></div>`; }

  // ---------- Collection: never look empty because another game is selected ----------
  const cv=VIEWS.coll;
  VIEWS.coll=function(){ let h=cv.apply(this,arguments); const sub=(UI.sub&&UI.sub.coll)||'cards'; if (sub!=='cards' && sub!=='sets') return h;
    const cur=({wk:'tc',xt:'xt',br:'br'})[UI.cg]||'tc'; const cnt=f=>{ const s=safe(()=>f.sum(),null); return s? (s.n||0)+(s.g||0)+(s.s||0) : 0; }; const mine=frs().map(f=>({f,n:cnt(f)})); const here=mine.find(x=>x.f.id===cur), total=mine.reduce((a,x)=>a+x.n,0);
    if (!here || here.n>0) return h;
    const body= total>0? `<p class="small" style="margin:0 0 8px">You have no ${esc(here.f.name)} cards yet, but you do have cards in other games:</p><div class="chips">${mine.filter(x=>x.n>0).map(x=>`<button class="chip" data-act="cg" data-a="${x.f.cg}">${esc(x.f.name)}: ${x.n}</button>`).join('')}</div>`
      : `<p class="small" style="margin:0 0 8px">Your collection is empty. Open a pack, buy a single, or pick up a bargain in the Market, and it will appear here.</p><div class="formrow"><button class="btn sm pri" data-act="tab" data-a="market">Browse the Market</button><button class="btn sm" data-act="tab" data-a="${here.f.tab}">Visit ${esc(here.f.name)}</button></div>`;
    const panel=`<div class="panel hp"><h3>${total>0?'Looking at '+esc(here.f.name):'Nothing here yet'}</h3>${body}</div>`;
    return h.replace(/(<div class="pagetitle">[\s\S]*?<\/div>)/,'$1'+panel); };

  // ---------- Settings: accurate for this game, with the pack-hint switches and the basics ----------
  const st0=settingsSheet;
  settingsSheet=function(){ const r=st0.apply(this,arguments); if (!r||typeof r.h!=='string') return r; let h=r.h;
    const names=[['tc','Wildkin'],['xt','Tidemark'],['br','Broken Reach']]; const on=id=>{ const w=({tc:G.tcg,xt:G.xtg,br:G.brg})[id]; return !!w && !(w.opt&&w.opt.nohint); };
    const opening=`<div class="panel"><h3>Opening packs</h3><p class="small muted" style="margin:0 0 8px">Pack hints make packs with a standout card glow before you open them. They are off by default, so packs stay a surprise. Turn them on per game.</p><div class="rows">${names.filter(([id])=>({tc:G.tcg,xt:G.xtg,br:G.brg})[id]).map(([id,n])=>`<div class="row" style="cursor:default"><div class="rt"><b>${n}</b><span>Pack hints are ${on(id)?'on':'off'}</span></div><button class="btn sm ${on(id)?'':'pri'}" data-act="hintset" data-a="${id}">${on(id)?'Turn off':'Turn on'}</button></div>`).join('')}</div></div><div class="panel"><h3>Getting started</h3><p class="small muted" style="margin:0 0 8px">The first-steps panel on Home can be shown again at any time.</p><button class="btn sm" data-act="introagain">Show the first steps</button></div>`;
    h=h.replace(/<div class="panel"><h3>Start over<\/h3>[\s\S]*?<\/div>(?=<div class="panel"><h3>About)/, opening+'<div class="panel"><h3>Start over</h3><p class="small muted" style="margin:0 0 8px">Starts a new collector world on day one: the same games and releases, new random details. Your current save is replaced.</p><button class="btn sm" data-act="newgame" data-confirm="Tap again to erase and restart">New game</button></div>');
    h=h.replace(/<div class="panel"><h3>About<\/h3>[\s\S]*?<\/div>/, `<div class="panel"><h3>About</h3><p class="small muted" style="margin:0">${esc(PACK.about)} Everything in it is fictional: the cards, sets, shops and collectors. Prices come from what simulated collectors are willing to pay. This is an alpha, so numbers and rules may still change.</p></div>`);
    return {t:r.t, h}; };
  ACT.hintset=a=>{ const w=({tc:G.tcg,xt:G.xtg,br:G.brg})[a]; if (!w) return; const o=w.opt||(w.opt={}); o.nohint=!o.nohint; refreshSheet(); queueSave(); };
  ACT.introagain=()=>{ const u=U(); u.introDone=false; u.seen={}; u.goal=null; closeSheet(true); UI.tab='home'; render(); window.scrollTo(0,0); queueSave(); };
  // ---------- Home ----------
  const hv=VIEWS.home;
  VIEWS.home=function(){ let h=hv.apply(this,arguments);
    h=h.replace(/<div class="games">[\s\S]*?<\/div><div class="kpis">/,'<div class="kpis">');   // the plain tiles from tcg_theme.js are replaced by the ones below
    const top=introHTML()+needsHTML()+focusHTML()+tileHTML();
    return h.replace('<div class="kpis">',top+'<div class="kpis">'); };
})();
