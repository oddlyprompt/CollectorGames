// ===================== GROUP BREAKS & REPACKS =====================
// A break opens real product and deals the cards out by team. Spots are priced by a host who knows some things and not others.
// Repacks are mystery boxes made from real cards. Some repackers are honest, some are not.
const BRK_HOSTS=['Wax Night Live','Rip Squad Breaks','The Box Seat','Hobby Hour Breaks','Case Break Central','Team Spot Tonight','Ripped Live','Slab & Wax'];
function brk(){
  if (!G.brk){ G.brk={v:1, list:[], hist:[], rep:null, nid:1, pend:[]}; const r=mkRng(hsh('brk'+G.seed)); G.brk.rep=[
    {id:0, n:'Lucky Dip Repacks', who:'Nina', eff:0.66, promise:'num', claim:'Every box has at least one numbered card. Fair value, no gimmicks.', col:'#2f6fb3', old:0, tiers:[{price:15,n:25,stock:6},{price:40,n:40,stock:5},{price:100,n:60,stock:3}]},
    {id:1, n:'Mega Hit Mystery Boxes', who:'Drew', eff:0.42, promise:'auto', claim:'GUARANTEED AUTOGRAPH IN EVERY BOX. Most boxes return 150% or more!', col:'#c0392b', old:0, tiers:[{price:15,n:25,stock:9},{price:40,n:40,stock:8},{price:100,n:60,stock:5}]},
    {id:2, n:"Old Timer's Shoebox", who:'Walt', eff:0.56, promise:'old', claim:'Every card from a set at least three years old. Some duds. Some gems.', col:'#8e6b3a', old:1, tiers:[{price:15,n:25,stock:5},{price:40,n:40,stock:4},{price:100,n:60,stock:2}]}];
    for (const rp of G.brk.rep){ rp.ver=Math.round((rp.eff*100+12+(r()-0.5)*12)/2)*2; rp.you={n:0, paid:0, got:0}; rp.sold=ri(40,200); }
    for (let i=0;i<3;i++) newBreak(G.day+ri(1,4)); }
  return G.brk;
}
function releasedForBreak(){ const yr=yearOf(G.day); return releasedProducts().filter(p=>{ const f=B(p).formats; return (f.hobby||f.blaster) && yr-p.yr<=2; }); }
function teamPlayers(prod){ const cl=prod.cl; const pids=new Set(); cl.base.forEach(e=>pids.add(e[0])); (cl.auto||[]).forEach(x=>pids.add(x)); (cl.ins||[]).forEach(a=>a.forEach(x=>pids.add(x)));
  const by=TEAMS_DEF.map(()=>[]); for (const pid of pids){ const p=P(pid); const tm=p.tm>=0?p.tm:p.org; if (by[tm]) by[tm].push(p); } for (const a of by) a.sort((x,y)=>playerBase(y)-playerBase(x)); return by; }
function teamWeights(prod){ const by=teamPlayers(prod); const w=by.map(a=>a.reduce((s,p)=>s+Math.pow(Math.max(0.05,playerBase(p)),1.2),0)); const m=w.reduce((a,b)=>a+b,0)/w.length||1; return w.map(x=>0.3*m+0.7*x); }
function newBreak(day){
  const H=brk(); const prods=releasedForBreak(); if (!prods.length) return null; const prod=pick(prods); const fmt=B(prod).formats.hobby?'hobby':'blaster';
  const f=B(prod).formats[fmt]; const boxes = fmt==='hobby'? ri(2,3) : ri(6,10); const cost=boxes*f.price; const total=Math.round(cost*rf(1.14,1.32));
  const n=TEAMS_DEF.length; const mode=R()<0.72?'pyt':'rt'; const wt=teamWeights(prod); const k=+rf(0.35,0.95).toFixed(2);
  const hw=wt.map(x=>Math.pow(x,k)); const hs=hw.reduce((a,b)=>a+b,0); const price = mode==='rt'? wt.map(()=>Math.max(2,Math.round(total/n))) : hw.map(x=>Math.max(2,Math.round(total*x/hs)));
  const b={ id:H.nid++, host:pick(BRK_HOSTS), p:prod.id, fmt, boxes, mode, day:day||G.day+ri(2,5), seed:Math.floor(R()*2e9), price, wt:wt.map(x=>+x.toFixed(2)), spots:Array(n).fill(-1), st:'open', k };
  const pre=Math.floor(n*rf(0,0.3)); const npcs0=npcPool({}); for (let i=0;i<pre;i++){ const j=Math.floor(R()*n); if (b.spots[j]===-1){ const nn=pick(npcs0); if (nn.cash>=price[j]*1.5){ nn.cash-=price[j]; b.spots[j]=nn.id; } } }
  H.list.push(b); return b;
}
function breakFilled(b){ return b.spots.filter(x=>x!==-1).length; }
function breakMine(b){ return b.spots.map((x,i)=>x===0?i:-1).filter(i=>i>=0); }
function joinBreak(bid, idx){ const b=brk().list.find(x=>x.id===bid); if (!b || b.st!=='open' || G.day>=b.day) return 'That break has closed.'; if (b.spots[idx]!==-1) return 'That spot is taken.';
  if (breakMine(b).length>=6) return 'Six spots is the limit per break.'; const pr=b.price[idx]; if (G.player.cash<pr) return 'You need '+money(pr)+'.'; G.player.cash-=pr; G.player.bought+=pr; b.spots[idx]=0; return null; }
function joinRandom(bid, q){ const b=brk().list.find(x=>x.id===bid); let err=null; for (let i=0;i<q;i++){ const open=b.spots.map((x,j)=>x===-1?j:-1).filter(j=>j>=0); if (!open.length){ err=err||'Sold out.'; break; } const e=joinBreak(bid, open[Math.floor(R()*open.length)]); if (e){ err=e; break; } } return err; }
function breakRun(b){
  const prod=G.products[b.p]; const n=TEAMS_DEF.length; const order = b.mode==='rt'? shuffleWith(Array.from({length:n},(_,i)=>i), b.seed) : Array.from({length:n},(_,i)=>i);
  const teamOf = order; // spot i holds team order[i]
  const spotOfTeam={}; teamOf.forEach((t,i)=>spotOfTeam[t]=i);
  let keys=[]; for (let i=0;i<b.boxes;i++) keys=keys.concat(genSealed(prod, b.fmt, b.seed+i*7919).flat());
  const cnt=Array(n).fill(0); const tmOf=keys.map(k=>{ const d=D(k); return cardTeam(d,P(d.pid)); }); tmOf.forEach(t=>{ const s=spotOfTeam[t]; if (s!=null) cnt[s]++; });
  const rng=mkRng(b.seed^0x9e3779b1); const res={ hits:[], mine:[], kept:0, cards:keys.length, teams:{}, boxes:b.boxes }; const created=[];
  keys.forEach((k,i)=>{ const s=spotOfTeam[tmOf[i]]; if (s==null) return; const own=b.spots[s]; if (own===-1){ res.kept++; return; }
    const paid= own===0? Math.round(b.price[s]/Math.max(1,cnt[s])*100)/100 : 0; const acq=[G.day,'break',paid, b.host];
    const c=makeCard(k, own, own===0?acq:null, rng); if (own===0){ c.h=[[G.day,'Group break: '+teamName(tmOf[i])+' spot in '+b.host+"'s break",paid,'']]; c.nw=1; res.mine.push(c.id); } else if (G._npcCardIds) G._npcCardIds.push(c.id);
    created.push([c.id, own, cardValue(c)]); });
  created.sort((a,b_)=>b_[2]-a[2]); res.hits=created.slice(0,8).map(x=>[x[0], x[1], Math.round(x[2]*100)/100]);
  res.mineVal=Math.round(res.mine.reduce((s,id)=>s+cardValue(C(id)),0)*100)/100; res.paid=breakMine(b).reduce((s,i)=>s+b.price[i],0); res.myTeams=breakMine(b).map(i=>teamOf[i]);
  b.res=res; b.st='done'; b.teamOf=teamOf; return res;
}
function breakDay(t){
  const H=brk(); const npcs=npcPool({});
  for (const b of H.list.slice()){
    if (b.st!=='open') continue;
    if (t>=b.day){ const filled=breakFilled(b); const n=b.spots.length;
      if (filled<Math.ceil(n*0.5)){ b.st='cancelled'; b.spots.forEach((o,i)=>{ if (o===0){ G.player.cash+=b.price[i]; G.player.bought-=b.price[i]; toast('Break cancelled, spot refunded: '+money(b.price[i],true)); } else if (o>0){ const nn=NPC(o); if (nn) nn.cash+=b.price[i]; } }); }
      else { breakRun(b); if (breakMine(b).length){ H.pend.push(b.id); toast('Your break ran: '+b.res.mine.length+' cards in your collection', true); } }
      H.hist.unshift({id:b.id, host:b.host, p:b.p, day:t, st:b.st, mine:breakMine(b).length, res:b.res, teamOf:b.teamOf, boxes:b.boxes, fmt:b.fmt, mode:b.mode}); if (H.hist.length>14) H.hist.length=14; continue; }
    const left=Math.max(0,b.day-t);
    for (let i=0;i<b.spots.length;i++){ if (b.spots[i]!==-1) continue; const total=b.price.reduce((s,x)=>s+x,0); const trueV=(b.wt[i]/b.wt.reduce((s,x)=>s+x,0))*total;
      const ratio = b.mode==='rt'? 1 : Math.max(0.3,trueV/b.price[i]); const p=clamp(0.3*Math.pow(ratio,1.2)*(1+(3-Math.min(3,left))*0.3),0.02,0.6);
      if (R()<p){ for (let tries=0;tries<10;tries++){ const nn=pick(npcs); if (nn.cash>=b.price[i]*1.5){ nn.cash-=b.price[i]; b.spots[i]=nn.id; break; } } } }
  }
  H.list=H.list.filter(b=>b.st==='open' || t-b.day<3);
  const open=H.list.filter(b=>b.st==='open').length; if (open<4 && (dowOf(t)===1||dowOf(t)===4||open<2)) newBreak(t+ri(2,5));
  if (dowOf(t)===1){ for (const rp of H.rep){ rp.tiers.forEach(x=>x.stock=Math.min(x.stock+ri(1,3), 9)); rp.sold+=ri(3,14); } }
}
// ---------- repacks ----------
function promiseOk(k, rp){ const d=D(k); return rp.promise==='num'? d.run>0 : rp.promise==='auto'? !!d.auto : rp.promise==='old'? yearOf(G.day)-d.prod.yr>=3 : true; }
function makeRepack(rp, tier){
  const price=tier.price, N=tier.n; const rng=mkRng(Math.floor(R()*2e9)); const acq=[G.day,'bought',Math.round(price/N*100)/100, rp.n]; const cards=[];
  const target=price*rp.eff*clamp(Math.exp(gauss()*0.55-0.15),0.12,5.5);
  const cands=[]; for (let i=0;i<70;i++){ const c=takeNpc('c'); if (c && !cands.includes(c) && (!rp.old || yearOf(G.day)-D(c.k).prod.yr>=3)) cands.push(c); }
  const val=c=>cardValue(c); const hits=[]; let remaining=target;
  // the promise is kept first: honest repackers with something decent, the others with the cheapest card that counts
  if (rp.promise!=='old'){ let m=cands.filter(c=>promiseOk(c.k,rp) && val(c)>=0.5).sort((a,b)=>val(a)-val(b)); const fit=m.filter(c=>val(c)<=Math.max(3,price*0.9)); if (fit.length) m=fit;
    if (m.length){ const c= rp.eff>=0.7? m[Math.floor(m.length/2)] : m[0]; hits.push(c); remaining-=val(c); } }
  for (let h=0; h<4 && remaining>1.5; h++){ const pool=cands.filter(c=>!hits.includes(c) && val(c)<=remaining*1.4+1 && val(c)>=1); if (!pool.length) break; const want=remaining*rf(0.35,1); pool.sort((a,b)=>Math.abs(val(a)-want)-Math.abs(val(b)-want)); const c=pool[0]; hits.push(c); remaining-=val(c); }
  const fresh=[]; if (rp.promise!=='old' && !hits.some(c=>promiseOk(c.k,rp))){ for (let i=0;i<60;i++){ const k=randCardKey({hit:1}); if (promiseOk(k,rp)){ fresh.push(k); break; } } }
  for (const c of hits){ c.o=0; c.a=acq; c.h=[[G.day,'Pulled from a '+rp.n+' repack',0,'']]; c.nw=1; cards.push(c); }
  for (const k of fresh){ const c=makeCard(k,0,acq,rng); c.h=[[G.day,'Pulled from a '+rp.n+' repack',0,'']]; c.nw=1; cards.push(c); }
  let guard=0; while (cards.length<N && guard++<N*12){ const k=randCardKey(rp.old?{old:1}:{}); const c=makeCard(k,0,acq,rng); if (cardValue(c)>0.6){ delete G.cards[c.id]; continue; } c.h=[[G.day,'Pulled from a '+rp.n+' repack',0,'']]; c.nw=1; cards.push(c); }
  while (cards.length<N){ const k=randCardKey({}); const c=makeCard(k,0,acq,rng); c.h=[[G.day,'Pulled from a '+rp.n+' repack',0,'']]; c.nw=1; cards.push(c); }
  cards.sort((a,b)=>val(a)-val(b)); return cards;
}
function buyRepack(rid, ti){
  const rp=brk().rep[rid]; const tier=rp.tiers[ti]; if (!tier || tier.stock<=0) return 'Out of stock this week.'; if (G.player.cash<tier.price) return 'You need '+money(tier.price)+'.';
  G.player.cash-=tier.price; G.player.bought+=tier.price; tier.stock--; const cards=makeRepack(rp,tier); const got=cards.reduce((s,c)=>s+cardValue(c),0);
  rp.you.n++; rp.you.paid+=tier.price; rp.you.got+=got; rp.sold++;
  const layers=[]; for (let i=0;i<cards.length;i+=10) layers.push(cards.slice(i,i+10).map(c=>c.id)); const prod=releasedProducts()[0];
  G.player.pending={ p:prod.id, f:'pack', packs:layers, pi:0, title:rp.n, sub:'Mystery repack, '+money(tier.price), rp:{id:rp.id, col:rp.col, n:rp.n} };
  G.player.opened.unshift({t:G.day, p:prod.id, f:'pack', cost:tier.price, cards:cards.map(c=>c.id)}); if (G.player.opened.length>40) G.player.opened.length=40; G.player.packs+=layers.length;
  return null;
}
function repackArt(rp){ const F='font-family="Barlow Condensed,Arial Narrow,sans-serif"'; const c=rp.col; return `<svg viewBox="0 0 200 280" xmlns="http://www.w3.org/2000/svg" class="packsvg"><path d="M30 20 H170 L180 50 V270 H20 V50 Z" fill="${c}"/><path d="M30 20 H170 L180 50 H20 Z" fill="${shade(c,-0.3)}"/>${Array.from({length:8},(_,i)=>`<path d="M${24+i*22} 20 v-10" stroke="${shade(c,-0.4)}" stroke-width="3"/>`).join('')}<rect x="34" y="84" width="132" height="132" rx="8" fill="#fff" opacity=".92"/><text x="100" y="178" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="96" fill="${c}">?</text><text x="100" y="242" text-anchor="middle" ${F} font-weight="800" font-size="17" fill="#fff" letter-spacing="1">${esc(rp.n.toUpperCase().slice(0,22))}</text><text x="100" y="262" text-anchor="middle" ${F} font-size="10" fill="#fff" opacity=".8" letter-spacing="3">MYSTERY REPACK</text></svg>`; }
// ---------- UI ----------
function bMoney(b){ return money(b.price.reduce((s,x)=>s+x,0)); }
function breakRow(b){ const prod=G.products[b.p]; const filled=breakFilled(b); const mine=breakMine(b).length; const lo=Math.min(...b.price), hi=Math.max(...b.price);
  return `<button class="row" data-act="brk" data-a="${b.id}"><div class="rt"><b>${esc(b.host)}</b><span>${esc(prodName(prod))}, ${b.boxes} ${FMT_NAME[b.fmt].toLowerCase()}${b.boxes>1?'es':''}, ${b.mode==='pyt'?'pick your team':'random team'}</span><span>${b.st==='open'?'Runs '+fmtDate(b.day)+' · '+filled+' of '+b.spots.length+' spots sold':b.st==='cancelled'?'Cancelled':'Finished'}${mine?' · you have '+mine:''}</span></div><div class="rv"><b>${b.mode==='pyt'?money(lo)+'–'+money(hi):money(hi)}</b><span>a spot</span></div></button>`; }
function repRow(rp){ return `<button class="row" data-act="rep" data-a="${rp.id}"><div class="rt"><b>${esc(rp.n)}</b><span>${rp.tiers.map(t=>money(t.price)).join(' · ')} boxes</span><span>${rp.you.n?'You bought '+rp.you.n+', got back '+Math.round(rp.you.got/Math.max(1,rp.you.paid)*100)+'% of what you paid':'Verified buyers report about '+rp.ver+'% back'}</span></div></button>`; }
function breaksView(){
  const H=brk(); const open=H.list.filter(b=>b.st==='open').sort((a,b)=>a.day-b.day); const hist=H.hist.slice(0,6);
  return `${tip('breaks', `<b>Group breaks:</b> a host opens real boxes and deals the cards out by team. You buy a team's spot (or a random one) and get every card of that team. Hosts price teams by what they know, which is not everything. <b>Repacks:</b> mystery boxes built from real cards. Read the claims, then the verified buyers.`)}
  <div class="cols"><div class="stack"><div class="panel"><h3>Live breaks</h3><div class="rows">${open.map(breakRow).join('')||'<div class="empty">No breaks scheduled. New ones are announced through the week.</div>'}</div></div>
    ${hist.length?`<div class="panel"><h3>Recent breaks</h3><div class="rows">${hist.map(h=>`<button class="row" data-act="brkres" data-a="${h.id}"><div class="rt"><b>${esc(h.host)}</b><span>${esc(prodName(G.products[h.p]))}, ${h.st==='cancelled'?'cancelled':fmtDate(h.day)}</span>${h.mine&&h.res?`<span>You: ${h.res.mine.length} cards, worth about ${money(h.res.mineVal,true)} for ${money(h.res.paid)}</span>`:''}</div></button>`).join('')}</div></div>`:''}</div>
    <div class="panel"><h3>Repack boxes</h3><div class="rows">${H.rep.map(repRow).join('')}</div></div></div>`;
}
function brkSheet(id){
  const b=brk().list.find(x=>x.id===id); if (!b){ const h=brk().hist.find(x=>x.id===id); return h? brkResult(id) : {t:'Break', h:'<div class="empty">That break has finished.</div>'}; }
  const prod=G.products[b.p]; const f=B(prod).formats[b.fmt]; const by=teamPlayers(prod); const mine=breakMine(b).length; const open=b.st==='open'&&G.day<b.day;
  const order=Array.from({length:b.spots.length},(_,i)=>i); if (b.mode==='pyt' && UI.bsort==='price') order.sort((x,y)=>b.price[y]-b.price[x]);
  const rows = b.mode==='pyt'? order.map(i=>{ const own=b.spots[i]; const nb=by[i].slice(0,2).map(p=>pname(p)+(p.tm===-1?' (prospect)':'')).join(', ');
    return `<div class="row" style="cursor:default"><div class="rt"><b>${esc(teamName(i))}</b><span>${nb?esc(nb):'No one notable in this set'}</span><span class="${own===0?'up':''}">${own===-1?'Open':own===0?'Yours':esc((NPC(own)||{h:'a collector'}).h)}</span></div>${own===-1&&open?`<button class="btn sm pri" data-act="brkbuy" data-a="${b.id}:${i}" data-confirm="Pay ${money(b.price[i])}" ${G.player.cash<b.price[i]?'disabled':''}>${money(b.price[i])}</button>`:`<div class="rv"><b>${money(b.price[i])}</b></div>`}</div>`; }).join('')
   : `<div class="small" style="margin:0 0 8px">${breakFilled(b)} of ${b.spots.length} slots sold. Teams are shuffled across the slots when the break runs. You get whatever team your slot lands on.</div><div class="formrow"><button class="btn pri" data-act="brkrand" data-a="${b.id}:1" data-confirm="Pay ${money(b.price[0])}" ${!open||G.player.cash<b.price[0]?'disabled':''}>1 slot, ${money(b.price[0])}</button><button class="btn" data-act="brkrand" data-a="${b.id}:3" data-confirm="Pay ${money(b.price[0]*3)}" ${!open||G.player.cash<b.price[0]*3?'disabled':''}>3 slots, ${money(b.price[0]*3)}</button></div>`;
  return { t:b.host, h:`<div class="stack"><div class="title-block"><div class="yr">${esc(b.host)} · runs ${fmtDate(b.day,true)}</div><h1>${esc(prodName(prod))}</h1><div class="sub">${b.boxes} ${FMT_NAME[b.fmt].toLowerCase()}${b.boxes>1?'es':''}, ${b.mode==='pyt'?'pick your team':'random team'}. ${f.g&&f.g.auto?'Each box guarantees '+f.g.auto+' autograph'+(f.g.auto>1?'s':'')+'. ':''}${f.g&&f.g.num?'Numbered cards guaranteed. ':''}</div></div>
    <dl class="kv"><dt>Spots sold</dt><dd>${breakFilled(b)} of ${b.spots.length}${breakFilled(b)<Math.ceil(b.spots.length*0.5)?' (needs '+Math.ceil(b.spots.length*0.5)+' to run)':''}</dd><dt>Total spot value</dt><dd>${bMoney(b)}</dd><dt>Box cost</dt><dd>${money(f.price*b.boxes)}</dd><dt>Your spots</dt><dd>${mine}</dd></dl>
    <p class="small muted" style="margin:0">If fewer than half of the spots sell, the break is cancelled and everyone is refunded. A host who prices well is rare; a team's worth depends on who is on it and who is in the set.</p>
    ${b.mode==='pyt'?`<div class="chips"><button class="chip ${UI.bsort!=='price'?'on':''}" data-act="bsort" data-a="team">By team</button><button class="chip ${UI.bsort==='price'?'on':''}" data-act="bsort" data-a="price">By price</button></div>`:''}
    <div class="panel"><div class="rows">${rows}</div></div></div>` };
}
function brkResult(id){
  const h=brk().hist.find(x=>x.id===id); if (!h || !h.res) return {t:'Break', h:'<div class="empty">Nothing to show.</div>'}; const r=h.res; const mine=(r.mine||[]).map(C).filter(Boolean).sort((a,b)=>cardValue(b)-cardValue(a));
  return { t:h.host, h:`<div class="stack"><div class="title-block"><div class="yr">${fmtDate(h.day,true)}</div><h1>${esc(prodName(G.products[h.p]))}</h1><div class="sub">${h.boxes} ${FMT_NAME[h.fmt].toLowerCase()}${h.boxes>1?'es':''}, ${r.cards} cards opened${r.kept?', '+r.kept+' from unsold spots kept by the host':''}.</div></div>
    ${h.mine?`<div class="kpis"><div class="kpi"><small>Your teams</small><b style="font-size:15px">${(r.myTeams||[]).map(t=>esc(teamName(t))).join(', ')}</b></div><div class="kpi"><small>Your cards</small><b>${r.mine.length}</b></div><div class="kpi"><small>Paid</small><b>${money(r.paid)}</b></div><div class="kpi"><small>Worth now</small><b class="${r.mineVal>=r.paid?'up':'down'}">${money(r.mineVal,true)}</b></div></div>`:''}
    <div class="panel"><h3>Biggest hits of the break</h3><div class="rows">${r.hits.map(([cid,own,v])=>{ const c=C(cid); if (!c) return ''; return `<button class="row" data-act="card" data-a="${cid}">${miniCard(c)}<div class="rt"><b>${esc(cardName(c))}</b><span>${esc(D(c.k).prod.yr+' '+B(D(c.k).prod).short+' '+D(c.k).title)}${serialTxt(c)?' '+serialTxt(c):''}</span><span class="${own===0?'up':''}">${own===0?'Yours':esc((NPC(own)||{h:'a collector'}).h)}</span></div><div class="rv"><b>${money(v,true)}</b></div></button>`; }).join('')}</div></div>
    ${mine.length?`<div class="panel"><h3>Your cards</h3><div class="grid">${mine.slice(0,18).map(c=>gcell(c)).join('')}</div>${mine.length>18?`<p class="small muted">And ${mine.length-18} more, in Collection marked New.</p>`:''}</div>`:''}</div>` };
}
function repSheet(id){
  const rp=brk().rep[id]; const y=rp.you;
  return { t:rp.n, h:`<div class="stack"><div class="title-block"><div class="yr">${esc(rp.who)}'s shop</div><h1>${esc(rp.n)}</h1><div class="sub">${esc(rp.claim)}</div></div>
    <dl class="kv"><dt>Verified buyers</dt><dd>about ${rp.ver}% of the price back, over ${rp.sold} boxes</dd><dt>Their promise</dt><dd>${{num:'A numbered card in every box',auto:'An autograph in every box',old:'Older sets only'}[rp.promise]}</dd>${y.n?`<dt>Your boxes</dt><dd>${y.n} bought, ${money(y.paid)} spent, cards worth about ${money(y.got,true)} (${Math.round(y.got/Math.max(1,y.paid)*100)}%)</dd>`:''}</dl>
    <p class="small muted" style="margin:0">The claim is what the seller says. The verified figure is what buyers who sent proof got back. A promise can be kept in a cheap way.</p>
    <div class="panel"><div class="rows">${rp.tiers.map((t,i)=>`<div class="row" style="cursor:default"><div class="rt"><b>${money(t.price)} box</b><span>${t.n} cards · ${t.stock} left this week</span></div><button class="btn sm pri" data-act="repbuy" data-a="${rp.id}:${i}" data-confirm="Pay ${money(t.price)}" ${t.stock<=0||G.player.cash<t.price?'disabled':''}>Buy</button></div>`).join('')}</div></div></div>` };
}
ACT.brk = a=>{ UI.bsort='team'; openSheet(()=>brkSheet(+a)); };
ACT.bsort = a=>{ UI.bsort=a; refreshSheet(); };
ACT.brkres = a=>openSheet(()=>brkResult(+a));
ACT.brkbuy = (a,el)=>{ if (!armed(el)) return; const [id,i]=a.split(':').map(Number); const e=joinBreak(id,i); if (e){ showToast(e); return; } showToast('You have the '+teamName(i)+' spot.', true); refreshSheet(); render(true); queueSave(); };
ACT.brkrand = (a,el)=>{ if (!armed(el)) return; const [id,q]=a.split(':').map(Number); const e=joinRandom(id,q); if (e) showToast(e); else showToast(q+' slot'+(q>1?'s':'')+' bought.', true); refreshSheet(); render(true); queueSave(); };
ACT.rep = a=>openSheet(()=>repSheet(+a));
ACT.repbuy = (a,el)=>{ if (!armed(el)) return; const [rid,ti]=a.split(':').map(Number); const e=buyRepack(rid,ti); if (e){ showToast(e); return; } closeSheet(true); render(true); startOpener(); queueSave(); };
// tabs: Breaks lives next to the card shop
(function(){
  const sv=VIEWS.shop; VIEWS.shop=()=>{ let h=sv(); const on=UI.sub.shop==='breaks'; const btn=/<button class="(?:on)?" data-act="tab" data-a="shop">Card shop<\/button>/;
    h=h.replace(btn, `<button class="${on?'':'on'}" data-act="goto" data-a="shop:main">Card shop</button><button class="${on?'on':''}" data-act="goto" data-a="shop:breaks">Breaks &amp; repacks</button>`);
    if (on){ const i=h.indexOf('<div class="subtabs">'); const j=h.indexOf('</div>',i)+6; return h.slice(0,j)+breaksView(); } return h; };
  const bv=VIEWS.ball; VIEWS.ball=()=>bv().replace(/<button class="(?:on)?" data-act="tab" data-a="shop">Card shop<\/button>/, `<button class="" data-act="goto" data-a="shop:main">Card shop</button><button class="" data-act="goto" data-a="shop:breaks">Breaks &amp; repacks</button>`);
})();
// the daily tick, the schedule, and results after time passes
advanceDay = (function(f){ return function(){ f.apply(this, arguments); try { breakDay(G.day); } catch(e){ console.error(e); } }; })(advanceDay);
(function(){ const adv=ACT.adv; ACT.adv=async a=>{ await adv(a); try { const H=G.brk; if (H && H.pend.length && !UI.busy){ const id=H.pend.shift(); openSheet(()=>brkResult(id)); } } catch(e){ console.error(e); } }; })();
upNext = (function(f){ return function(){ const out=f(); if (G.brk){ for (const b of G.brk.list) if (b.st==='open' && breakMine(b).length) out.push({d:b.day, txt:'Your break runs: '+b.host, act:'brk', a:b.id, kind:'breaks'}); else if (b.st==='open' && b.day-G.day<=2) out.push({d:b.day, txt:'Break: '+b.host+' ('+breakFilled(b)+'/'+b.spots.length+' sold)', act:'brk', a:b.id, kind:'breaks'}); out.sort((a,b)=>a.d-b.d); } return out; }; })(upNext);
UK.breaks=['Break','#e67e22'];
