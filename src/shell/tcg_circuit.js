// OUT AND ABOUT: the Hunt for the card games (Wildkin, Tidemark, Broken Reach). Loaded after tcg_retail.js.
// Everything found here is a real copy that a collector in the world owned the day before; nothing is conjured.
//   Yard sales   posted on Thursday for Saturday or Sunday. A box of cards priced by someone who does not know them.
//                You see what is on top (a few cards), make up your own mind, and can try one lower offer.
//   Collections  a private seller with a hundred cards or so and a rough idea of their worth. Open for six days,
//                then a local shop buys it and the cards turn up in that shop's case.
//   Card show    every fourth Saturday. Six dealers, each with their own stock, eye and patience.
//   Word         owners of shops where you are a familiar face pass on what they noticed in other people's cases.
// Going somewhere takes part of the day: two outings a day (a show takes both). Visiting shops is free.
// State lives in G.retail.hunt. Copies on offer are held as owner -2 with rs='lead:<id>' or 'show:<table>' and go back
// to collectors when the day is over. Random draws come from the world seed and the week or day (RETAIL.random).
const CIRCUIT=(function(){
  if (PACK.id!=='tcg' || !RETAIL) return null;
  const A=RETAIL.adapters, round=RETAIL.round, unit=RETAIL.unit;
  const OUTINGS=2, SHOW_FEE=5, SHOW_EVERY=4;
  const STREETS=['Alder Row','Kiln Lane','Harbour Steps','Marigold Close','Pinfold Street','Saltway','Orchard Rise','Canal Bank','Tanner’s Yard','Quarry Hill','Larkspur Avenue','Old Ferry Road','Weaver’s Court','Beacon Terrace','Millpond Walk','Station Approach'];
  const tier=(a,d)=>Math.max(0,a.raror[d.rar]||0);
  // kinds of yard-sale box: how many cards, what the seller guesses a card is worth, and what goes in
  const YARD=[
    {id:'kid',w:3,title:'A shoebox of cards',story:'A teenager has moved on to other things. Loose cards, some sleeved, most of them played with.',n:[30,60],per:[0.05,0.13],pick:(a,d,t)=>t-d.def.rel<900},
    {id:'player',w:2,title:'Deck boxes and a trade binder',story:'Someone who used to play every week is clearing a shelf: the uncommons and rares that saw tables.',n:[36,70],per:[0.16,0.36],pick:(a,d)=>tier(a,d)>=1},
    {id:'attic',w:2,title:'A box from the attic',story:'Untouched for years. Nobody in the house remembers what is in it.',n:[20,45],per:[0.2,0.55],pick:(a,d,t)=>t-d.def.rel>1460},
    {id:'binder',w:1,title:'A binder, pages in order',story:'One set, collected with care and then forgotten on a shelf.',n:[18,36],per:[0.25,0.6],oneSet:true,pick:(a,d)=>tier(a,d)>=1}
  ];
  // dealers at a card show. draw(a,d,c,v,t) chooses stock; mark and sig are the dealer's markup and how far off their eye can be;
  // floor is the lowest share of the tag they will take; flat is a single price for everything on the table
  const TABLES=[
    {id:'vintage',name:'Old Paper',who:'Tomas',blurb:'The early years, priced by someone who was there.',n:22,mark:1.15,sig:0.06,floor:0.90,draw:(a,d,c,v,t)=>c.g===0&&t-d.def.rel>1460&&v>=2},
    {id:'slabs',name:'Graded & Gone',who:'Priya',blurb:'Slabs only, every one with its certificate.',n:14,mark:1.12,sig:0.05,floor:0.92,draw:(a,d,c,v)=>c.g>0&&v>=8},
    {id:'shiny',name:'Shiny Side Up',who:'Cal',blurb:'Foils, alternate arts and special printings from every game.',n:22,mark:1.10,sig:0.20,floor:0.85,draw:(a,d,c,v)=>c.g===0&&(d.v!=='N'||tier(a,d)>=3)&&v>=1},
    {id:'bulk',name:'Three for a Dollar',who:'Nan',blurb:'Long boxes. Everything in them is the same price, whatever it is.',n:60,flat:0.35,draw:(a,d,c,v)=>c.g===0&&v>=0.05&&v<=25},
    {id:'player',name:'Top Table Singles',who:'Imre',blurb:'Cards people play from the current sets, a little under shop prices.',n:24,mark:1.04,sig:0.06,floor:0.93,draw:(a,d,c,v,t)=>c.g===0&&t-d.def.rel<730&&tier(a,d)>=1&&v>=0.75},
    {id:'visitor',name:'The Out-of-Towner',who:'a dealer nobody knows',blurb:'Prices from another city, or another year.',n:28,mark:1.0,sig:0.38,floor:0.80,draw:(a,d,c,v)=>c.g===0&&v>=1}
  ];
  const GOALS=[
    ['familiar','Become a familiar face at a shop',h=>locals().some(s=>RETAIL.standing(s).tier>=1)],
    ['regular','Become a regular somewhere',h=>locals().some(s=>RETAIL.standing(s).tier>=2)],
    ['friend','Become a friend of a shop',h=>locals().some(s=>RETAIL.standing(s).tier>=3)],
    ['rounds','Visit every shop and big-box branch',h=>Object.values(G.retail.locations).every(s=>s.visit)],
    ['yard','Buy a lot at a yard sale',h=>h.stats.yard>=1],
    ['coll','Buy a whole collection',h=>h.stats.coll>=1],
    ['show','Go to a card show',h=>h.stats.show>=1],
    ['bins','Pull a $5 card out of a dollar bin',h=>h.stats.bin>=1],
    ['find5','Five finds: a card bought for two thirds of its value or less',h=>h.stats.finds>=5],
    ['find25','A find worth $25 or more',h=>h.stats.best>=25]
  ];
  const locals=()=>RETAIL.profiles.filter(p=>p.kind==='local').map(p=>G.retail.locations[p.id]);
  function H(){
    const w=RETAIL.ensure(); if (!w) return null;
    if (!w.hunt){ w.hunt={v:1,week:-1,seq:1,leads:[],show:null,tips:[],log:[],goals:{},out:{d:-1,n:0},stats:{finds:0,best:0,yard:0,coll:0,show:0,bin:0,spent:0,worth:0}}; sweep(w.hunt); }
    return w.hunt;
  }
  // Repair: a copy held for a lead or a show table that no longer exists goes back to a collector (run when the hunt
  // state is created and whenever a save is loaded, so a damaged or hand-edited save cannot strand cards).
  function sweep(h){
    const live=new Set(h.leads.map(L=>'lead:'+L.id)); if (h.show) for (const T of h.show.tables) live.add('show:'+T.id);
    const r=RETAIL.random('hunt:sweep',G.day); let n=0;
    for (const a of Object.values(A)) for (const c of Object.values(a.table()||{})) if (c.o===-2 && typeof c.rs==='string' && (c.rs.startsWith('lead:')||c.rs.startsWith('show:')) && !live.has(c.rs)){ RETAIL.giveNpc(a.id,c,r); n++; }
    return n;
  }
  const outingsLeft=()=>{ const h=H(); return h.out.d===G.day? Math.max(0,OUTINGS-h.out.n) : OUTINGS; };
  function useOutings(n){ const h=H(); if (h.out.d!==G.day) h.out={d:G.day,n:0}; h.out.n+=n; }

  // ---------- real copies in and out of the world ----------
  // take up to n unlisted collector copies of one game that pass a test; they are held under a tag until bought or released
  // scan: look at every copy first (for picky sellers: a slab dealer, a collection with a few good cards); otherwise sample
  function draw(g,n,test,r,tag,scan){
    const a=A[g],t=G.day,got=[]; let pool=Object.values(a.table()); if (!pool.length) return got;
    if (scan) pool=pool.filter(c=>c.o>0&&!c.l&&c.g>=0&&!a.D(c.k).sealed&&test(a,a.D(c.k),c,a.value(c),t));
    if (!pool.length) return got;
    for (let i=0;i<n*60&&got.length<n;i++){
      const c=pool[Math.floor(r()*pool.length)]; if (!c||c.o<=0||c.l||c.g<0||c._d) continue;
      const d=a.D(c.k); if (d.sealed) continue;
      if (!test(a,d,c,a.value(c),t)) continue;
      c._d=1; got.push(c);
    }
    if (got.length){ const ids=new Set(got.map(c=>c.id)); if (G[a.ids]) G[a.ids]=G[a.ids].filter(id=>!ids.has(id)); for (const c of got){ delete c._d; c.o=-2; c.rs=tag; } }
    return got;
  }
  const held=(g,id,tag)=>{ const c=RETAIL.getCopy(g,id); return c&&c.o===-2&&c.rs===tag? c : null; };
  function release(refs,tag,r){ for (const ref of refs){ const c=held(ref.g,ref.id,tag); if (c) RETAIL.giveNpc(ref.g,c,r); } }
  function give(g,c,paid,from){ const a=A[g]; c.o=0; delete c.rs; c.nw=1; c.a=[G.day,'bought',paid,from]; c.h=(c.h||[]).concat([[G.day,'Bought at '+from,paid,'']]); c.pv={d:G.day,v:round(a.value(c)),n:''}; }

  // ---------- the week ----------
  const games=t=>Object.values(A).filter(a=>a.sets(t).length>0);
  const showDay=t=>{ let d=t; while (dowOf(d)!==6 || weekNo(d)%SHOW_EVERY!==0) d++; return d; };   // the next show Saturday on or after t
  function makeYard(h,r,day){
    const t=G.day, gs=games(t); if (!gs.length) return;
    const kinds=YARD.filter(y=>y.id!=='attic'||gs.some(a=>a.sets(t).some(n=>t-a.def(n).rel>1460)));
    let roll=r()*kinds.reduce((s,y)=>s+y.w,0), y=kinds[0]; for (const k of kinds){ roll-=k.w; if (roll<=0){ y=k; break; } }
    const cand=gs.filter(a=>y.id!=='attic'||a.sets(t).some(n=>t-a.def(n).rel>1460)); const a=cand[Math.floor(r()*cand.length)];
    const id=h.seq++, tag='lead:'+id, want=y.n[0]+Math.floor(r()*(y.n[1]-y.n[0]+1));
    let set=null; if (y.oneSet){ const ss=a.sets(t); set=ss[Math.floor(r()*ss.length)]; }
    const got=draw(a.id,want,(aa,d,c,v,tt)=>c.g===0&&(set==null||d.set===set)&&y.pick(aa,d,tt),r,tag);
    if (got.length<8){ release(got.map(c=>({g:a.id,id:c.id})),tag,r); return; }
    const ask=Math.max(3,Math.round(got.length*(y.per[0]+r()*(y.per[1]-y.per[0]))*(y.id!=='attic'&&a.id!=='wk'?1.9:1)));
    // what is on top of the box: a fixed handful, not the best cards
    const order=got.map(c=>c.id).sort((p,q)=>unit('top'+id+':'+p)-unit('top'+id+':'+q));
    h.leads.push({id,ty:'yard',kind:y.id,g:a.id,title:y.title,story:y.story,where:STREETS[Math.floor(r()*STREETS.length)],day,last:day,refs:got.map(c=>({g:a.id,id:c.id})),top:order,shown:6,ask,floor:round(0.6+0.3*r()),set});
  }
  function makeCollection(h,r){
    const t=G.day, gs=games(t); if (!gs.length) return; const a=gs[Math.floor(r()*gs.length)];
    const id=h.seq++, tag='lead:'+id, n=60+Math.floor(r()*80);
    const bands=[[0.05,1,0.45],[1,5,0.33],[5,25,0.17],[25,400,0.05]]; let got=[];
    for (const b of bands) got=got.concat(draw(a.id,Math.max(1,Math.round(n*b[2])),(aa,d,c,v)=>c.g===0&&v>=b[0]&&v<b[1],r,tag,true));
    if (got.length<25){ release(got.map(c=>({g:a.id,id:c.id})),tag,r); return; }
    const worth=got.reduce((s,c)=>s+a.value(c),0), ask=Math.max(10,Math.round(worth*(0.60+0.35*r())));   // the seller's rough idea: from a real bargain to nearly full value
    const names=['a retired league organiser','a couple moving abroad','someone who inherited a cupboard of cards','a collector switching games','a former shop employee'];
    h.leads.push({id,ty:'coll',g:a.id,title:'A collection for sale',story:'From '+names[Math.floor(r()*names.length)]+'. They have looked a few cards up and want it gone in one go.',where:STREETS[Math.floor(r()*STREETS.length)],day:t,last:t+5,refs:got.map(c=>({g:a.id,id:c.id})),ask,floor:round(0.85+0.1*r())});
  }
  function makeShow(h,r,day){
    const tables=[];
    for (const T of TABLES){
      const tag='show:'+T.id, refs=[]; const gs=games(day);
      for (const a of gs){ if (T.id==='vintage'&&!a.sets(day).some(n=>day-a.def(n).rel>1460)) continue;
        for (const c of draw(a.id,Math.ceil(T.n/gs.length),T.draw,r,tag,true)){
          const v=a.value(c), u1=Math.max(1e-6,unit('s1'+day+T.id+c.id)), z=Math.sqrt(-2*Math.log(u1))*Math.cos(6.2831853*unit('s2'+day+T.id+c.id));
          refs.push({g:a.id,id:c.id,p:T.flat? T.flat : round(Math.max(0.5,v*T.mark*Math.exp(T.sig*Math.max(-2.2,Math.min(2.2,z)))))});
        } }
      if (refs.length) tables.push({id:T.id,refs,firm:{}});
    }
    h.show={day,tables,in:false};
  }
  // an owner who knows you mentions a card sitting cheap in somebody else's case
  function makeTips(h,r){
    h.tips=[];
    for (const p of RETAIL.profiles.filter(p=>p.kind==='local')){ const s=G.retail.locations[p.id]; if (RETAIL.standing(s).tier<1) continue;
      const cands=[];
      for (const q of RETAIL.profiles.filter(q=>q.kind==='local'&&q.id!==p.id)) for (const ref of G.retail.locations[q.id].singles){ const c=RETAIL.getCopy(ref.g,ref.id); if (!c) continue; const v=A[ref.g].value(c); if (v>=3 && ref.p<=v*0.75) cands.push({q:q.id,g:ref.g,id:ref.id,k:c.k}); }
      if (!cands.length) continue; const x=cands[Math.floor(r()*cands.length)];
      h.tips.push({from:p.id,at:x.q,g:x.g,id:x.id,k:x.k,d:G.day});
    }
  }
  function expire(h,t){
    const r=RETAIL.random('hunt:expire',t);
    h.leads=h.leads.filter(L=>{ if (L.last>=t) return true; const tag='lead:'+L.id;
      if (L.ty==='coll'){ // a local shop buys what it wants of an unsold collection; the rest goes back to collectors
        const shops=RETAIL.profiles.filter(p=>p.kind==='local'&&p.singles!=='none'), p=shops[Math.floor(r()*shops.length)], s=G.retail.locations[p.id]; let took=0;
        for (const ref of L.refs){ const c=held(ref.g,ref.id,tag); if (!c) continue; if (s.singles.length<p.caseCap && RETAIL.accepts(p,ref.g,c)){ c.rs=p.id; const tg=RETAIL.tagFor(p,ref.g,c); s.singles.push({g:ref.g,id:c.id,p:tg.p,b:tg.b,d:t,n:t}); took++; } else RETAIL.giveNpc(ref.g,c,r); }
        if (took) (G.retail.log=G.retail.log||[]).unshift([t,'collection',p.id,took]);
      } else release(L.refs,tag,r);
      return false; });
    if (h.show && h.show.day<t){ for (const T of h.show.tables) release(T.refs,'show:'+T.id,r); h.show=null; }
    h.tips=h.tips.filter(x=>t-x.d<7);
  }
  function tick(t){
    const h=H(); if (!h) return;
    expire(h,t);
    if (dowOf(t)===4 && h.week!==weekNo(t)){
      h.week=weekNo(t); const r=RETAIL.random('hunt:week',weekNo(t));
      const n=2+(r()<0.4?1:0); for (let i=0;i<n;i++) makeYard(h,r,t+(r()<0.6?2:3));
      if (r()<0.38) makeCollection(h,r);
      makeTips(h,r);
    }
    if (!h.show && showDay(t)===t) makeShow(h,RETAIL.random('hunt:show',t),t);
    checkGoals();
  }

  // ---------- what the player does ----------
  const leadOf=id=>H().leads.find(L=>L.id===+id);
  const liveRefs=L=>L.refs.filter(ref=>held(ref.g,ref.id,'lead:'+L.id));
  const leadWorth=L=>liveRefs(L).reduce((s,ref)=>s+A[ref.g].value(RETAIL.getCopy(ref.g,ref.id)),0);
  const canGo=L=>L.ty==='yard'? G.day===L.day : G.day>=L.day&&G.day<=L.last;
  function go(id){
    const L=leadOf(id); if (!L) return 'That has gone.'; if (!canGo(L)) return L.ty==='yard'? 'That sale is on '+fmtDate(L.day)+'.' : 'That is no longer available.';
    if (L.went!==G.day){ if (outingsLeft()<1) return 'You have been out twice already today. Tomorrow.'; useOutings(1); L.went=G.day; }
    return null;
  }
  function dig(id){ const L=leadOf(id); if (!L||L.ty!=='yard'||L.went!==G.day) return 'Go there first.'; if (L.shown>=L.top.length) return 'You have seen all of it.'; if (outingsLeft()<1) return 'Looking through the whole box would take the rest of the day, and you have used it.'; useOutings(1); L.shown=Math.min(L.top.length,L.shown+10); return null; }
  function haggle(id){ const L=leadOf(id); if (!L||L.went!==G.day) return 'Go there first.'; if (L.tried) return 'They have named their price.'; L.tried=1; const cut=L.ty==='yard'?0.75:0.9; if (cut>=L.floor){ L.ask=Math.max(1,Math.round(L.ask*cut)); L.deal=1; return null; } return 'no'; }
  function buyLot(id){
    const L=leadOf(id); if (!L||L.went!==G.day) return 'Go there first.'; if (G.player.cash<L.ask) return 'You need '+money(L.ask,true)+'.';
    const h=H(), refs=liveRefs(L), worth=round(leadWorth(L)), from=L.ty==='yard'?'a yard sale on '+L.where:'a private collection';
    G.player.cash=round(G.player.cash-L.ask); G.player.bought=round(G.player.bought+L.ask);
    const each=round(L.ask/Math.max(1,refs.length)); for (const ref of refs) give(ref.g,RETAIL.getCopy(ref.g,ref.id),each,from);
    UI.cg=A[L.g].cg; h.leads=h.leads.filter(x=>x!==L); h.stats[L.ty==='yard'?'yard':'coll']++; h.stats.spent=round(h.stats.spent+L.ask); h.stats.worth=round(h.stats.worth+worth);
    h.log.unshift({d:G.day,ty:L.ty,t:L.title,n:refs.length,paid:L.ask,worth}); if (h.log.length>30) h.log.length=30;
    if (worth>=L.ask*1.5 && worth>=3){ h.stats.finds++; h.stats.best=Math.max(h.stats.best,worth); }
    checkGoals(); return {n:refs.length,worth};
  }
  // called for every single bought in a shop or at a show: was it a find
  function noteFind(g,c,paid,worth,where,bin){
    const h=H(); if (!h) return; if (bin && worth>=5) h.stats.bin++;
    if (worth>=3 && paid<=worth*0.667){ h.stats.finds++; h.stats.best=Math.max(h.stats.best,worth); h.log.unshift({d:G.day,ty:'find',t:A[g].D(c.k).title,k:c.k,g,paid,worth,where}); if (h.log.length>30) h.log.length=30; }
    checkGoals();
  }
  function enterShow(){ const h=H(), S=h.show; if (!S||S.day!==G.day) return 'There is no show today.'; if (S.in) return null; if (outingsLeft()<OUTINGS) return 'A show takes the whole day, and you have already been out.'; if (G.player.cash<SHOW_FEE) return 'Entry is '+money(SHOW_FEE,true)+'.';
    G.player.cash=round(G.player.cash-SHOW_FEE); useOutings(OUTINGS); S.in=true; h.stats.show++;
    // two shop owners have come along; a word at their table counts
    const r=RETAIL.random('hunt:showfolk',G.day), ls=locals().slice().sort(()=>r()-0.5).slice(0,2); S.folk=ls.map(s=>s.id); for (const s of ls) RETAIL.credit(s,'event',2);
    checkGoals(); return null; }
  const tableOf=id=>{ const S=H().show; return S&&S.tables.find(T=>T.id===id); };
  function showBuy(tid,g,cid,offer){
    const S=H().show, T=tableOf(tid), def=TABLES.find(x=>x.id===tid); if (!S||!S.in||S.day!==G.day||!T) return 'The show is over.';
    const ref=T.refs.find(x=>x.g===g&&x.id===+cid), c=ref&&held(g,ref.id,'show:'+tid); if (!c) return 'Somebody else got there first.';
    let price=ref.p;
    if (offer){ if (def.flat) return 'Everything on this table is one price.'; if (T.firm[ref.id]) return 'That price is firm.';
      const fl=def.floor-0.04+0.08*unit('fl'+S.day+tid+ref.id); if (0.9<fl){ T.firm[ref.id]=1; return 'no'; } price=round(ref.p*0.9); ref.p=price; T.firm[ref.id]=1; }
    if (G.player.cash<price) return 'You need '+money(price,true)+'.';
    const worth=round(A[g].value(c)); G.player.cash=round(G.player.cash-price); G.player.bought=round(G.player.bought+price);
    give(g,c,price,'the card show ('+def.name+')'); T.refs=T.refs.filter(x=>x!==ref); UI.cg=A[g].cg; noteFind(g,c,price,worth,'the card show',!!def.flat); return null;
  }
  function checkGoals(){ const h=H(); if (!h) return; for (const [id,title,test] of GOALS){ if (h.goals[id]) continue; let ok=false; try { ok=test(h); } catch(e){} if (ok){ h.goals[id]=G.day; if (G.live!==false) celebrate('Goal complete',title); } } }

  // ---------- screens ----------
  const btn=(act,a,t,dis,cls)=>`<button class="btn sm ${cls||''}" data-act="${act}" data-a="${esc(String(a))}" ${dis?'disabled':''}>${t}</button>`;
  const DAYN=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const when=d=>d===G.day?'today':d===G.day+1?'tomorrow':DAYN[dowOf(d)]+' '+fmtDate(d);
  function badge(){ const h=H(); if (!h) return 0; return h.leads.filter(canGo).length+(h.show&&h.show.day===G.day?1:0); }
  function tabs(){ const on=UI.retailTab==='out', n=badge(); return `<div class="chips retail-tabs"><button class="chip ${on?'':'on'}" data-act="rtab" data-a="shops">Shops</button><button class="chip ${on?'on':''}" data-act="rtab" data-a="out">Out &amp; about${n?' <b class="retail-count">'+n+'</b>':''}</button></div>`; }
  const cardRow=(g,c,right)=>{ const a=A[g],d=a.D(c.k); return `<div class="row retail-product"><button class="mini" data-act="${a.design}" data-a="${esc(c.k)}">${a.mini(c)}</button><div class="rt"><b>${esc(d.title)}</b><span>${a.name} · ${c.g>0?'GCS '+c.g:COND_LABN[condLabel(c.c)]} · ${esc(d.def.name)}</span>${RETAIL.knownHTML(g,c)}</div>${right||''}</div>`; };
  function leadCard(L){
    const live=liveRefs(L).length, open=canGo(L), a=A[L.g];
    const facts=L.ty==='yard'? `About ${Math.round(live/5)*5||live} cards, mostly ${a.name}${L.set!=null?' ('+esc(a.def(L.set).name)+')':''}` : `${live} ${a.name} cards`;
    const h=H(), showToday=h.show&&h.show.day===G.day&&!h.show.in;
    const why=!open? (L.ty==='yard'?'On '+when(L.day)+'.':'') : (L.went!==G.day&&outingsLeft()<1)? 'No outings left today.' : (L.went!==G.day&&showToday)? 'The card show is today and takes the whole day: going here means missing it.' : '';
    return `<article class="retail-card hunt-card ${open?'':'later'}"><div class="retail-card-top"><span>${L.ty==='yard'?'YARD SALE':'PRIVATE COLLECTION'}</span><span>${esc(L.where)}</span></div><h3>${esc(L.title)}</h3><p>${esc(L.story)}</p><div class="retail-card-foot"><small>${facts} · asking <b>${money(L.ask,true)}</b> · ${L.ty==='yard'?when(L.day):'until '+when(L.last)}</small>${btn('hgo',L.id,L.went===G.day?'Back to it':'Go',!open||(L.went!==G.day&&outingsLeft()<1))}</div>${why?'<div class="small hunt-why">'+why+'</div>':''}</article>`;
  }
  function leadView(L){
    const a=A[L.g], refs=liveRefs(L), n=refs.length;
    let cards;
    if (L.ty==='yard'){ const seen=L.top.slice(0,L.shown).map(id=>held(L.g,id,'lead:'+L.id)).filter(Boolean);
      cards=`<h3>What you can see</h3><p class="small muted">${seen.length} of about ${n} cards. You know the going rate of cards you own a copy of; tap any other to look it up. The seller has no idea what is here: the price is for the whole lot.</p><div class="rows">${seen.map(c=>cardRow(L.g,c)).join('')}</div>${L.shown<L.top.length?`<div class="formrow">${btn('hdig',L.id,'Go through more of the box (uses an outing)',outingsLeft()<1)}</div>`:''}`;
    } else { const top=refs.map(ref=>RETAIL.getCopy(ref.g,ref.id)).sort((p,q)=>a.value(q)-a.value(p)); const by={}; for (const c of top){ const r=a.D(c.k).rar; by[r]=(by[r]||0)+1; }
      cards=`<h3>The seller’s highlights</h3><p class="small muted">${n} cards in all: ${Object.entries(by).map(([k,v])=>v+' '+k).join(', ')}. These are the ones the seller pulled out to show you.</p><div class="rows">${top.slice(0,8).map(c=>cardRow(L.g,c)).join('')}</div>`; }
    const hag=L.tried? `<span class="small muted">${L.deal?'They took your offer.':'They would not go lower.'}</span>` : btn('hhag',L.id,L.ty==='yard'?'Offer '+money(Math.round(L.ask*0.75),true):'Offer '+money(Math.round(L.ask*0.9),true));
    return `<div class="retail-store-head">${btn('hback','','Out &amp; about')}<div class="retail-eyebrow">${L.ty==='yard'?'YARD SALE':'PRIVATE COLLECTION'} · ${esc(L.where)}</div><h2>${esc(L.title)}</h2><p>${esc(L.story)}</p><div class="retail-store-facts"><span>asking ${money(L.ask,true)} for everything</span><span>you have ${money(G.player.cash,true)}</span></div><div class="formrow">${btn('hbuy',L.id,'Buy the lot for '+money(L.ask,true),G.player.cash<L.ask,'pri')}${hag}</div></div><div class="panel retail-inventory">${cards}</div>`;
  }
  function showView(S){
    if (!S.in) return `<div class="retail-store-head"><div class="retail-eyebrow">CARD SHOW · TODAY ONLY</div><h2>The Grand Mall card show</h2><p>Six dealers under one roof for a day. Their stock, their prices, their patience. It takes the whole day.</p><div class="formrow">${btn('hshow','','Go in ('+money(SHOW_FEE,true)+')',outingsLeft()<OUTINGS||G.player.cash<SHOW_FEE,'pri')}</div>${outingsLeft()<OUTINGS?'<p class="small muted">You have already been out today, and a show takes the whole day.</p>':''}</div>`;
    const cur=tableOf(UI.huntTable)||S.tables[0], def=TABLES.find(x=>x.id===cur.id);
    const refs=cur.refs.map(ref=>({ref,c:held(ref.g,ref.id,'show:'+cur.id)})).filter(x=>x.c).sort((p,q)=>q.ref.p-p.ref.p);
    const pages=Math.max(1,Math.ceil(refs.length/20)), pg=Math.min(UI.huntPage||0,pages-1);
    const rows=refs.slice(pg*20,pg*20+20).map(({ref,c})=>cardRow(ref.g,c,`<div class="retail-actions"><strong>${money(ref.p,true)}</strong>${btn('hsb',cur.id+'~'+ref.g+'~'+ref.id,'Buy',G.player.cash<ref.p)}${def.flat||cur.firm[ref.id]?'':`<button class="btn sm" data-act="hso" data-a="${cur.id+'~'+ref.g+'~'+ref.id}" data-confirm="Buy if they say yes" ${G.player.cash<ref.p*0.9?'disabled':''}>Offer ${money(round(ref.p*0.9),true)}</button>`}</div>`)).join('');
    const folk=(S.folk||[]).map(id=>RETAIL.profile(id)).filter(Boolean);
    return `<div class="retail-store-head"><div class="retail-eyebrow">CARD SHOW · ${fmtDate(S.day)}</div><h2>The Grand Mall card show</h2>${folk.length?`<p class="small muted">${folk.map(p=>esc(p.owner)+' from '+esc(p.name)).join(' and ')} ${folk.length>1?'are':'is'} here too. You stopped to talk.</p>`:''}</div><div class="chips">${S.tables.map(T=>{ const d=TABLES.find(x=>x.id===T.id); return `<button class="chip ${T===cur?'on':''}" data-act="htable" data-a="${T.id}">${esc(d.name)}</button>`; }).join('')}</div><div class="panel retail-inventory"><h3>${esc(def.name)}</h3><p class="small muted">${esc(def.who[0].toUpperCase()+def.who.slice(1))}: ${esc(def.blurb)} ${def.flat?'':'One lower offer per card; a refusal makes that price firm.'}</p><div class="rows">${rows||'<div class="empty">This table is cleaned out.</div>'}</div>${pages>1?`<div class="formrow">${btn('hpage',Math.max(0,pg-1),'Previous',pg===0)}<span class="small">Page ${pg+1} of ${pages}</span>${btn('hpage',pg+1,'Next',pg===pages-1)}</div>`:''}</div>`;
  }
  function logHTML(h){
    const st=h.stats, done=GOALS.filter(([id])=>h.goals[id]).length;
    const goals=GOALS.map(([id,title])=>`<div class="hunt-goal ${h.goals[id]?'done':''}"><span>${h.goals[id]?'✓':'○'}</span>${esc(title)}</div>`).join('');
    const rows=h.log.slice(0,8).map(x=>`<div class="row" style="cursor:default"><div class="rt"><b>${esc(x.t)}</b><span>${fmtDate(x.d)} · ${x.ty==='find'?esc(x.where):x.n+' cards'} · paid ${money(x.paid,true)}, your estimate ${money(x.worth,true)}</span></div></div>`).join('');
    return `<div class="panel"><div class="phead"><h3>Your hunting log</h3><span class="small muted">${done} of ${GOALS.length} goals · ${st.finds} find${st.finds===1?'':'s'}${st.best?', best '+money(st.best,true):''}</span></div><div class="hunt-goals">${goals}</div>${rows?'<div class="rows" style="margin-top:10px">'+rows+'</div>':'<p class="small muted" style="margin-top:10px">Nothing yet. A find is a card bought for two thirds of its value or less, wherever you found it.</p>'}</div>`;
  }
  function view(){
    const h=H(); if (!h) return '';
    const L=UI.huntLead&&leadOf(UI.huntLead); if (L && L.went===G.day) return leadView(L);
    if (UI.huntShow && h.show && h.show.day===G.day) return btn('hback','','Out &amp; about')+showView(h.show);
    const yards=h.leads.filter(x=>x.ty==='yard').sort((p,q)=>p.day-q.day), colls=h.leads.filter(x=>x.ty==='coll'), sd=showDay(G.day);
    const tips=h.tips.map(x=>{ const c=RETAIL.getCopy(x.g,x.id), from=RETAIL.profile(x.from), at=RETAIL.profile(x.at); const still=c&&c.o===-2&&c.rs===x.at; return `<div class="row" style="cursor:default"><div class="rt"><b>${esc(from.owner)} at ${esc(from.name)}</b><span>“If you are after ${esc(A[x.g].D(x.k).title)}, ${still?'there is one going cheap at '+esc(at.name)+'.':'there was one going cheap at '+esc(at.name)+', but it has gone.'}”</span></div>${still?btn('rvisit',x.at,'Go'):''}</div>`; }).join('');
    return `<div class="hunt-today"><b>${outingsLeft()} of ${OUTINGS} outings left today.</b> <span class="small muted">A yard sale or a collection takes one; a card show takes the day. Shops are always on your way.</span></div>
      <div class="panel"><div class="phead"><h3>Card show</h3><span class="small muted">every fourth Saturday</span></div>${sd===G.day&&h.show? `<p>The show is on today at the Grand Mall.</p><div class="formrow">${btn('hshowgo','',h.show.in?'Back to the show':'Have a look','', 'pri')}</div>` : `<p class="small muted">Next show: ${when(sd)}. Six dealers, entry ${money(SHOW_FEE,true)}.</p>`}</div>
      <div class="phead" style="margin:16px 0 8px"><h3>Yard sales this weekend</h3><span class="small muted">posted on Thursdays</span></div>${yards.length? '<div class="retail-directory">'+yards.map(leadCard).join('')+'</div>' : '<div class="panel"><p class="small muted">Nothing posted. Sales for the weekend go up on Thursday.</p></div>'}
      ${colls.length? '<div class="phead" style="margin:16px 0 8px"><h3>Collections for sale</h3><span class="small muted">a shop will take them if you do not</span></div><div class="retail-directory">'+colls.map(leadCard).join('')+'</div>' : ''}
      <div class="panel"><div class="phead"><h3>Word around town</h3></div>${tips? '<div class="rows">'+tips+'</div>' : '<p class="small muted">Shop owners who know you pass on what they notice. Become a familiar face somewhere.</p>'}</div>
      ${logHTML(h)}`;
  }
  // rows for Home's "Needs you"
  function needs(){ const h=H(), out=[]; if (!h) return out;
    if (h.show && h.show.day===G.day && !h.show.in && outingsLeft()>=OUTINGS) out.push(['Card show today','Six dealers at the Grand Mall. It takes the whole day, so go before anything else.','hshowgo','','See']);
    for (const L of h.leads.filter(canGo)) if (L.went!==G.day && outingsLeft()>0) out.push([L.title+(L.ty==='yard'?' (yard sale today)':''),L.where+' · asking '+money(L.ask,true)+(L.ty==='coll'?' · until '+when(L.last):''),'hopen',L.id,'See']);
    return out.slice(0,4); }
  const done=(e,ok)=>{ if (e&&e!=='no'){ showToast(e); return false; } if (ok) showToast(ok,true); refreshSheet(); render(true); queueSave(); return true; };
  ACT.rtab=k=>{ UI.retailTab=k==='out'?'out':'shops'; UI.huntLead=null; UI.huntShow=false; UI.retailLocation=null; UI.retailOnline=null; render(true); };
  ACT.hopen=id=>{ UI.tab='stores'; UI.retailTab='out'; UI.retailLocation=null; UI.retailOnline=null; UI.huntLead=null; UI.huntShow=false; render(); window.scrollTo(0,0); };
  ACT.hgo=id=>{ const e=go(id); if (e){ showToast(e); return; } UI.huntLead=+id; UI.huntShow=false; render(true); queueSave(); window.scrollTo(0,0); };
  ACT.hback=()=>{ UI.huntLead=null; UI.huntShow=false; render(true); };
  ACT.hdig=id=>{ done(dig(id)); };
  ACT.hhag=id=>{ const e=haggle(id); if (e==='no') showToast('“No. The price is the price.”'); else if (!e) showToast('“Fine. Take it.”',true); done(e); };
  ACT.hbuy=id=>{ const r=buyLot(id); if (typeof r==='string'){ showToast(r); return; } UI.huntLead=null; done(null,r.n+' cards are yours. Your estimate of the lot: '+money(r.worth,true)+'. Find them in Collection.'); };
  ACT.hshowgo=()=>{ UI.tab='stores'; UI.retailTab='out'; UI.retailLocation=null; UI.retailOnline=null; UI.huntLead=null; UI.huntShow=true; render(); window.scrollTo(0,0); };
  ACT.hshow=()=>{ const e=enterShow(); if (e){ showToast(e); return; } UI.huntShow=true; done(null,'You are in.'); };
  ACT.htable=id=>{ UI.huntTable=id; UI.huntPage=0; render(true); };
  ACT.hpage=k=>{ UI.huntPage=Math.max(0,Number(k)||0); render(true); };
  ACT.hsb=a=>{ const [t,g,c]=a.split('~'); done(showBuy(t,g,+c,false),'Bought at the show. Find it in Collection.'); };
  ACT.hso=(a,el)=>{ if (el&&!armed(el)) return; const [t,g,c]=a.split('~'); const e=showBuy(t,g,+c,true); if (e==='no') showToast('“Can’t do it for that.” The price is firm now.'); done(e,e?null:'Offer taken. Find it in Collection.'); };
  // the day: after the stores have had theirs
  const prevAdvance=advanceDay; advanceDay=function(){ prevAdvance.apply(this,arguments); tick(G.day); };
  const prevMigrate=migrate; migrate=function(){ prevMigrate.apply(this,arguments); const h=G&&G.retail&&G.retail.hunt; if (h) sweep(h); };
  return {H,tick,sweep,tabs,view,needs,badge,noteFind,go,dig,haggle,buyLot,enterShow,showBuy,leadOf,liveRefs,leadWorth,canGo,outingsLeft,showDay,checkGoals,GOALS,TABLES,YARD,OUTINGS};
})();
