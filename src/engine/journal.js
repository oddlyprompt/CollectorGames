// ===================== YOUR YEAR IN COLLECTING =====================
// Built from what already exists: provenance, sale history, what you looked at and passed on, grading returns, chases.
function netWorthNow(){ let v=0; for (const c of myCards()) v+=cardValue(c); if (G.cm) for (const c of myComics()) v+=cmCopyValue(c); for (const s of mySealed()) v+=sealedFair(G.products[s.p],s.f); for (const L of CARD_LINES) if (L.has()) for (const c of L.mine()) v+=L.value(c); return Math.round(v*100)/100; }   // everything owned except cash (Wildkin cards and sealed product included)
function snapNW(force){ const P_=G.player; const L=P_.nw=P_.nw||[]; if (!force && L.length && G.day-L[L.length-1][0]<7) return; L.push([G.day, Math.round(P_.cash*100)/100, netWorthNow(), Math.round(P_.bought), Math.round(P_.sold), Math.round(P_.fees), P_.packs||0, P_.paid||0]); if (L.length>420) L.shift(); }
function noteSeen(kind, id, price, where){ const P_=G.player; const S=P_.seen=P_.seen||{}; const k=kind+':'+id; if (S[k]) return; S[k]=[G.day, Math.round(price*100)/100, where]; const ks=Object.keys(S); if (ks.length>320){ ks.sort((a,b)=>S[a][0]-S[b][0]); for (let i=0;i<40;i++) delete S[ks[i]]; } }
function objValue(k, o){ return cardLineOfKind(k)? cardLineOfKind(k).value(o) : k==='m'? cmCopyValue(o) : cardValue(o); }
function objLabel(k, o){ return cardLineOfKind(k)? cardLineOfKind(k).label(o) : k==='m'? cmItemLabel(o) : cardName(o)+' '+D(o.k).prod.yr+' '+D(o.k).title+(o.g>0?' (GCS '+o.g+')':''); }
function jPeriod(y){ const t0=Math.max(G.player.start, dateToDay(y,1,1)); const t1=y>=yearOf(G.day)? G.day : dateToDay(y,12,31); return [t0,t1]; }
function jRef(k, o, extra){ return Object.assign({k, id:o.id, label:objLabel(k,o)}, extra||{}); }
function buildYear(y){
  const [t0,t1]=jPeriod(y); const P_=G.player; const snaps=(P_.nw||[]).filter(s=>s[0]<=t1); const inP=snaps.filter(s=>s[0]>=t0);
  const s0 = snaps.filter(s=>s[0]<=t0).pop() || inP[0] || snaps[0]; const s1 = inP[inP.length-1] || snaps[snaps.length-1];
  const kinds=[['c',Object.values(G.cards)], ['m', G.cm? Object.values(G.mc):[]], ...CARD_LINES.map(L=>[L.kind, L.has()? Object.values(L.copies()):[]])];
  const acq=[], sold=[], pulls=[]; let nCards=0, nComics=0;
  for (const [k,arr] of kinds) for (const o of arr){
    if (o.pv && !o.sc && o.pv.d>=t0 && o.pv.d<=t1){ if (k==='c'||isCardGameKind(k)) nCards++; else nComics++; const paid=(o.a&&o.a[2])||0; const soldH=(o.h||[]).filter(h=>typeof h[1]==='string' && h[1].startsWith('Sold') && h[0]>=o.pv.d).pop();
      if (o.o===0){ const now=objValue(k,o); acq.push({k, o, paid, now, gain:now-paid, sold:false}); } else if (soldH){ acq.push({k, o, paid, now:soldH[2], gain:soldH[2]-paid, sold:true}); }
      if ((k==='c'||isCardGameKind(k)) && o.a && o.a[1]==='pulled') pulls.push({k, o, now:objValue(k,o)}); }
    if (o.h) for (const h of o.h) if (h[0]>=t0 && h[0]<=t1 && typeof h[1]==='string' && h[1].startsWith('Sold') && h[2]>0 && o.o!==0){ sold.push({k, o, price:h[2], now:objValue(k,o), t:h[0]}); }
  }
  const pick1=(arr,f)=>arr.slice().sort((a,b)=>f(b)-f(a))[0];
  const bf=pick1(acq.filter(x=>x.gain>=3), x=>x.gain); const flip=pick1(acq.filter(x=>x.sold && x.gain>=3), x=>x.gain);
  const regret=pick1(sold.filter(x=>x.now>=x.price*1.35 && x.now-x.price>=8), x=>x.now-x.price);
  const seen=P_.seen||{}; const away=[]; for (const key in seen){ const [k,id]=[key[0], +key.slice(2)]; const o=objFor(k,id); if (!o || o.o===0 || o.pv) continue; const s=seen[key]; if (s[0]<t0||s[0]>t1||t1-s[0]<10) continue; const now=objValue(k,o); if (now>=s[1]*1.4 && now-s[1]>=8) away.push({k, o, ask:s[1], now, where:s[2], d:s[0]}); }
  away.sort((a,b)=>(b.now-b.ask)-(a.now-a.ask));
  const pull=pick1(pulls, x=>x.now);
  const gl=(P_.gl||[]).filter(x=>x.t>=t0 && x.t<=t1); const bestG=gl.slice().sort((a,b)=>(b.k==='m'?b.g/10:b.g)-(a.k==='m'?a.g/10:a.g))[0];
  const ev=(P_.evlog||[]).filter(e=>e.d>=t0 && e.d<=t1); const brks=(G.brk?G.brk.hist:[]).filter(h=>h.day>=t0 && h.day<=t1 && h.mine && h.res);
  const done=chases().filter(c=>c.done && c.done>=t0 && c.done<=t1);
  const out={ y, t0, t1, days:t1-t0+1, start:s0?Math.round(s0[1]+s0[2]):0, end:s1?Math.round(s1[1]+s1[2]):0, endCash:s1?Math.round(s1[1]):0, endColl:s1?Math.round(s1[2]):0, paid:s1&&s0? s1[7]-s0[7]:0, bought:s1&&s0? s1[3]-s0[3]:0, soldT:s1&&s0? s1[4]-s0[4]:0, fees:s1&&s0? s1[5]-s0[5]:0, packs:s1&&s0? s1[6]-s0[6]:0,
    pts:inP.map(s=>[s[0], Math.round(s[1]+s[2])]), nCards, nComics, best:bf&&jRef(bf.k,bf.o,{paid:bf.paid, now:bf.now, sold:bf.sold}), flip:flip&&jRef(flip.k,flip.o,{paid:flip.paid, now:flip.now}),
    regret:regret&&jRef(regret.k,regret.o,{price:regret.price, now:regret.now}), away:away.slice(0,3).map(x=>jRef(x.k,x.o,{ask:x.ask, now:x.now, where:x.where})), pull:pull&&jRef(pull.k,pull.o,{now:pull.now}),
    grade:bestG&&{k:bestG.k, id:bestG.id, g:bestG.g}, nGraded:gl.length, events:ev.length, evNames:[...new Set(ev.map(e=>e.n))].slice(0,3), breaks:brks.map(h=>({host:h.host, cards:h.res.mine.length, paid:h.res.paid, val:h.res.mineVal})), chasesDone:done.map(c=>chaseName(c)),
    chases:chases().filter(c=>c.k!=='grail').slice(0,6).map(c=>{ const p=chaseProgress(c); return {name:chaseName(c), have:p.have, total:p.total}; }), grails:chases().filter(c=>c.k==='grail').map(c=>({name:chaseName(c), months:Math.max(1,Math.round((t1-c.since)/30)), found:ownedKeys().has(c.ref)})) };
  const st=[]; const L=x=>x.label;
  if (out.best && out.best.paid+3<out.best.now) st.push(`Best find: ${L(out.best)}. You ${out.best.sold?'sold it for':'have it, worth'} ${money(out.best.now,true)}; it cost ${money(out.best.paid,true)}.`);
  if (out.regret) st.push(`The one you sold too soon: ${L(out.regret)}. You took ${money(out.regret.price,true)}; it's about ${money(out.regret.now,true)} now.`);
  if (out.away.length) st.push(`You passed on ${L(out.away[0])} at ${money(out.away[0].ask,true)}. It's about ${money(out.away[0].now,true)} now.`);
  if (out.pull && out.pull.now>=15) st.push(`Best pull: ${L(out.pull)}, about ${money(out.pull.now,true)}.`);
  if (!st.length) st.push(out.nCards+out.nComics? 'A quiet stretch of collecting. Nothing dramatic yet, and that is how most great collections begin.' : (out.endColl>=50? `A quiet year of buying. Your collection, worth about ${money(out.endColl)}, kept moving with the market all the same.` : 'You barely collected. The market kept moving without you.'));
  out.story=st; return out;
}
function yrs(){ return G.player.yr||(G.player.yr={}); }
function makeYearReview(y){ const r=buildYear(y); yrs()[y]=r; G.player.yrNew=y; return r; }
// what changes the numbers: weekly snapshots, chase completion, events attended, first look at things
advanceDay = (function(f){ return function(){ f.apply(this, arguments); try { const t=G.day; if (G.player && G.player.start){ { const GL=G.player.gl=G.player.gl||[]; for (const r of (G.player.rv||[])) if (!GL.some(x=>x.k===r.k&&x.id===r.id&&x.t===r.t)) GL.push({k:r.k,id:r.id,g:r.g,t:r.t}); if (GL.length>120) GL.splice(0,GL.length-120); }
  if (dowOf(t)===1 || !(G.player.nw&&G.player.nw.length)) snapNW(); if (dowOf(t)===1) for (const c of chases()){ if (!c.done && c.k!=='grail'){ const p=chaseProgress(c); if (p.total && p.have>=p.total){ c.done=t; toast('Chase complete: '+chaseName(c), true); } } }
  const md=mdOf(t); if (md[0]===1 && md[1]===1 && t-G.player.start>=45){ const y=yearOf(t)-1; if (!yrs()[y]) makeYearReview(y); } } } catch(e){ console.error(e); } }; })(advanceDay);
ACT.listing = (function(f){ return function(a){ try { const l=L(+a); if (l && l.sel!==0 && (l.it==='c'||l.it==='m'||isCardGameKind(l.it))) noteSeen(l.it, l.ref, l.ty==='auc'?l.cur:l.pr, 'the marketplace'); } catch(e){} return f(a); }; })(ACT.listing);
ACT.hitem = (function(f){ return function(a){ try { const [s,t,id]=hsplit(a); const e=entryById(s,t,id); if (e && t!=='s') noteSeen(t,id,e.p,whereName(s)); } catch(e){} return f(a); }; })(ACT.hitem);
ACT.cshopcopy = (function(f){ return function(a){ try { const [id,from]=a.split(':'); const cp=MC(+id); if (cp && cp.o===SHOP_ID){ const pr=from==='bin'?1:((G.cm.shop.back.find(x=>x[0]===+id)||[0,0])[1]); noteSeen('m',+id,pr,SHOP_NAME); } } catch(e){} return f(a); }; })(ACT.cshopcopy);
enterEvent = (function(f){ return function(evId, late){ const r=f(evId, late); if (r===null){ const ev=G.hunt.ev.find(x=>x.id===evId); const L_=G.player.evlog=G.player.evlog||[]; if (ev && !L_.some(e=>e.d===G.day && e.id===evId)){ L_.push({d:G.day, id:evId, n:ev.n}); if (L_.length>200) L_.shift(); } } return r; }; })(enterEvent);
// ---------- UI ----------
function jRow(x){ const o=objFor(x.k,x.id); const thumb=o? (x.k==='m'?miniComic(o):cardLineOfKind(x.k)?cardLineOfKind(x.k).mini(o):miniCard(o)) : '<div class="mini"></div>'; const act=copyAct(x.k); return `<button class="row" ${o?`data-act="${act}" data-a="${x.id}"`:'style="cursor:default"'}>${thumb}<div class="rt"><b>${esc(x.label)}</b>${x.paid!=null&&x.now!=null?`<span>Cost ${money(x.paid,true)}, ${x.sold?'sold for':'worth'} ${money(x.now,true)}</span>`:x.price!=null?`<span>You sold it for ${money(x.price,true)}; about ${money(x.now,true)} now</span>`:x.ask!=null?`<span>Seen ${x.where?'at '+esc(x.where)+' ':''}for ${money(x.ask,true)}; about ${money(x.now,true)} now</span>`:x.now!=null?`<span>About ${money(x.now,true)}</span>`:''}</div></button>`; }
function yearSheetHTML(r, live){
  const net=r.end-r.start-r.paid; const bits=[];
  return `<div class="stack"><div class="title-block"><div class="yr">${live?'So far this year':'The year in review'}</div><h1>${r.y}</h1><div class="sub">${fmtDate(r.t0,true)} to ${fmtDate(r.t1,true)}</div></div>
    <div class="panel yrstory">${r.story.map(s=>`<p>${esc(s)}</p>`).join('')}</div>
    <p class="small muted" style="margin:0 0 6px">Net worth is cash plus the estimated value of everything you own${r.endColl!=null?`: at the end, ${money(r.endCash)} cash and about ${money(r.endColl)} in cards and sealed product`:""}. Estimates, not what a quick sale would bring.</p><div class="kpis"><div class="kpi"><small>Net worth, start</small><b>${money(r.start)}</b></div><div class="kpi"><small>Net worth, end</small><b>${money(r.end)}</b></div><div class="kpi"><small>Beyond paydays</small><b class="${net>=0?'up':'down'}">${net>=0?'+':'−'}${money(Math.abs(net))}</b></div><div class="kpi"><small>Spent / sold</small><b style="font-size:15px">${money(r.bought)} / ${money(r.soldT)}</b></div></div>
    ${r.pts.length>=3?`<div class="panel"><h3>Cash plus collection</h3>${sparkSVG(r.pts,{h:100,axis:true})}</div>`:''}
    ${r.best||r.flip||r.regret?`<div class="panel"><h3>The big moments</h3><div class="rows">${r.best?`<div class="small muted" style="padding:6px 0 2px">Best find</div>${jRow(r.best)}`:''}${r.flip&&(!r.best||r.flip.id!==r.best.id)?`<div class="small muted" style="padding:6px 0 2px">Best flip</div>${jRow(r.flip)}`:''}${r.regret?`<div class="small muted" style="padding:6px 0 2px">Sold too soon</div>${jRow(r.regret)}`:''}${r.pull&&r.pull.now>=15?`<div class="small muted" style="padding:6px 0 2px">Best pull</div>${jRow(r.pull)}`:''}</div></div>`:''}
    ${r.away.length?`<div class="panel"><h3>The ones that got away</h3><p class="small muted" style="margin:0 0 6px">You looked, you passed. Here is what they're worth now.</p><div class="rows">${r.away.map(jRow).join('')}</div></div>`:''}
    <div class="panel"><h3>The year in numbers</h3><dl class="kv"><dt>Cards acquired</dt><dd>${r.nCards}</dd>${G.cm?`<dt>Comics acquired</dt><dd>${r.nComics}</dd>`:''}<dt>Packs opened</dt><dd>${r.packs}</dd><dt>Graded</dt><dd>${r.nGraded}${r.grade?`, best: ${rvGradeTxt(r.grade.k,r.grade.g)}`:''}</dd><dt>Events attended</dt><dd>${r.events}${r.evNames.length?' ('+esc(r.evNames.join(', '))+')':''}</dd>${r.breaks.length?`<dt>Group breaks</dt><dd>${r.breaks.length}: ${money(r.breaks.reduce((s,b)=>s+b.paid,0))} in, cards worth ${money(r.breaks.reduce((s,b)=>s+b.val,0),true)}</dd>`:''}<dt>Fees paid</dt><dd>${money(r.fees)}</dd></dl></div>
    ${r.chasesDone.length||r.chases.length||r.grails.length?`<div class="panel"><h3>Chases</h3>${r.chasesDone.length?`<p class="small up" style="margin:0 0 6px">Completed: ${esc(r.chasesDone.join(', '))}</p>`:''}${r.chases.map(c=>`<p class="small" style="margin:0 0 4px">${esc(c.name)}: ${c.have} of ${c.total}</p>`).join('')}${r.grails.map(g=>`<p class="small" style="margin:0 0 4px">★ ${esc(g.name)}: ${g.found?'found':'still hunting after '+g.months+' months'}</p>`).join('')}</div>`:''}</div>`;
}
function yearSheet(y){ const live = y==='now'; const r = live? buildYear(yearOf(G.day)) : yrs()[y]; if (!r) return {t:'Year', h:'<div class="empty">No review for that year.</div>'}; return { t:r.y+(live?' so far':' in review'), h:yearSheetHTML(r, live) }; }
ACT.year = a=>openSheet(()=>yearSheet(a==='now'?'now':+a));
function goneList(){ const seen=G.player.seen||{}; const out=[]; for (const key in seen){ const k=key[0], id=+key.slice(2); const o=objFor(k,id); if (!o || o.o===0 || o.pv) continue; const s=seen[key]; if (G.day-s[0]<10) continue; const now=objValue(k,o); if (now>=s[1]*1.4 && now-s[1]>=8) out.push(jRef(k,o,{ask:s[1], now, where:s[2]})); } return out.sort((a,b)=>(b.now-b.ask)-(a.now-a.ask)).slice(0,8); }
function journalView(){
  const ys=Object.keys(yrs()).sort((a,b)=>b-a); const g=goneList(); const cur=yearOf(G.day);
  return `${tip('journal', `Your journal keeps score without keeping you honest for free: what you found, what you passed on, what you sold too soon. Every January it writes up the year that just ended.`)}
  <div class="cols"><div class="stack"><div class="panel"><h3>${cur} so far</h3><p class="small muted" style="margin:0 0 8px">${esc(G.player.scnN||'Your collecting story')}. Started ${fmtDate(G.player.start,true)}.</p><button class="btn pri" data-act="year" data-a="now">Read the year so far</button></div>
    ${ys.length?`<div class="panel"><h3>Past years</h3><div class="rows">${ys.map(y=>`<button class="row" data-act="year" data-a="${y}"><div class="rt"><b>${y} in review</b><span>${money(yrs()[y].start)} to ${money(yrs()[y].end)}</span></div></button>`).join('')}</div></div>`:'<div class="panel"><div class="empty">The first review is written on January 1st.</div></div>'}</div>
  <div class="panel"><h3>The ones that got away</h3><p class="small muted" style="margin:0 0 6px">Things you looked at and passed on that have since gone up.</p><div class="rows">${g.map(jRow).join('')||'<div class="empty">Nothing yet. Give it time.</div>'}</div></div></div>`;
}
(function(){ const cv=VIEWS.coll; VIEWS.coll=()=>{ const jr=UI.sub.coll==='journal'; let h;
  if (jr){ const save=UI.sub.coll; UI.sub.coll='runs'; h=cv(); UI.sub.coll=save; h=h.replace(/<button class="on" data-act="sub" data-a="coll:runs">/, '<button class="" data-act="sub" data-a="coll:runs">'); } else h=cv();
  h=h.replace(/(<button class="(?:on)?" data-act="sub" data-a="coll:chases">Chases<\/button>)/, `$1<button class="${jr?'on':''}" data-act="sub" data-a="coll:journal">Journal</button>`);
  if (jr){ const i=h.indexOf('<div class="subtabs">'); const j=h.indexOf('</div>',i)+6; return h.slice(0,j)+journalView(); } return h; }; })();
// a new review opens after time passes
(function(){ const adv=ACT.adv; ACT.adv=async a=>{ await adv(a); try { const y=G.player.yrNew; if (y && !UI.busy){ G.player.yrNew=null; setTimeout(()=>openSheet(()=>yearSheet(y)), 200); } } catch(e){ console.error(e); } }; })();
// Home: a quiet link once there is something to read
(function(){ const hv=VIEWS.home; VIEWS.home=()=>{ const h=hv(); const ys=Object.keys(yrs()).sort((a,b)=>b-a); if (!ys.length || G.day-dateToDay(+ys[0]+1,1,1)>45) return h; const i=h.indexOf('<div class="kpis">'); const b=`<div class="note" style="display:flex;align-items:center;gap:10px;margin-bottom:12px"><b style="flex:1">Your ${ys[0]} in review is ready</b><button class="btn sm pri" data-act="year" data-a="${ys[0]}">Read it</button></div>`; return i<0? b+h : h.slice(0,i)+b+h.slice(i); }; })();
