// Shared physical retailers (version 2). The franchise economies still own cards, prices and print runs.
// G.retail holds locations, finite stock, cash, buying history, price tags, the player's standing and last-visit snapshots.
// Copies in a store remain in their original copy table (owner -2, rs=location id), so vintage Tidemark is counted in
// its census and is never manufactured by a restock.
//
// What version 2 adds (design/studio-audit-2026-11.md):
//  - PRICE TAGS. A single is priced when the shop buys it in, by an owner with strengths and blind spots (profile.eye,
//    profile.bins). The tag stays until the owner's next review (profile.review), so prices go stale when the market moves.
//    Other customers buy bargains first, so a good tag does not wait for you.
//  - SHELVES THAT MEAN SOMETHING. The franchise price models read how sold-out a product is (world.shop[n].so/.sop);
//    that figure now comes from the real shelves every day. Launch demand can outrun the first orders.
//  - LIMITS. A product selling above its shelf price is limited per customer per week.
//  - STANDING. Visiting, buying and selling at an independent shop makes you a familiar face, a regular, a friend of
//    the shop: you learn how the owner prices, get better trade terms and a larger launch allocation.
// Everything random is drawn from the world seed and the day, or from a hash of the shop and the copy, never from Math.random.
const RETAIL=(function(){
  if (PACK.id!=='tcg') return null;
  const VERSION=2;
  // eye: [bias, spread] the owner applies to a card's value when pricing it. fresh = sets under two years old,
  // old = older sets, fancy = premium rarities, special printings and slabs. review = days between looks at a tag.
  const profiles=[
    {id:'tidepool',name:'The Tidepool',kind:'local',tag:'Community tables',owner:'Mara',area:'Riverside',
      text:'League regulars, sensible prices and cards people actually play. New releases share a shelf with last season’s favourites.',
      habit:'Mara follows the tournament tables and prices playable cards from current sets almost to the cent, every Thursday. Older sets and fancy printings she prices to move, and rarely looks at again.',
      singles:'play',traffic:0.85,coverage:24,markup:1.07,single:1.22,floor:0.5,buy:0.60,capital:8500,caseCap:65,day:4,ink:'#76b988',
      eye:{fresh:[1,0.07],old:[0.66,0.36],fancy:[0.80,0.28]},review:7,reviews:'fresh',hot:'regulars'},
    {id:'lantern',name:'The Lantern Room',kind:'local',tag:'The collector’s shelves',owner:'Ellis',area:'Old Town',
      text:'Older boxes behind the counter, binders worth taking your time over, and an owner who keeps stock long after the launch crowds leave.',
      habit:'Ellis knows the old sets cold. The case is re-priced about once a month, so a card that moved since then is still at last month’s price, for better or worse.',
      singles:'mixed',traffic:0.55,coverage:40,markup:1.12,single:1.25,floor:0.75,buy:0.56,capital:14500,caseCap:90,day:2,ink:'#d1ae69',
      eye:{fresh:[0.94,0.34],old:[1,0.07],fancy:[1.02,0.10]},review:35,reviews:'all',hot:'market'},
    {id:'cargo',name:'The Cargo Cage',kind:'local',tag:'Dollar-bin digging',owner:'Jules',area:'Station Arcade',
      text:'Rows of affordable singles, everyday sealed product and the occasional excellent card tucked into the case.',
      habit:'Jules prices the bins by rarity, not by card: commons a quarter, uncommons fifty cents, rares a dollar, anything shiny double. Only what Jules recognises goes in the case, and Jules misses more than half of what should.',
      singles:'budget',traffic:0.70,coverage:30,markup:1.03,single:1.12,floor:0.25,buy:0.42,capital:6500,caseCap:150,day:6,ink:'#b78dcb',
      eye:{fresh:[1,0.25],old:[1,0.25],fancy:[1,0.25]},review:28,reviews:'case',bins:[0.25,0.5,1,3,5],know:0.4,hot:'market'},
    {id:'corner',name:'Corner Pocket Games',kind:'local',tag:'Packs and play nights',owner:'Dev',area:'Maple Square',
      text:'A small sealed-product shop. Orders are cautious, old boxes linger, and there is no singles counter or cash buylist.',
      habit:'Dev orders small and never marks anything up or down. What is on the shelf stays at list price until it is gone, even after it has gone out of print.',
      singles:'none',traffic:0.38,coverage:32,markup:1.08,buy:0,capital:4500,caseCap:0,day:3,ink:'#719cc5',hot:'list'},
    {id:'glass',name:'The Glass Cabinet',kind:'local',tag:'Grails and graded cards',owner:'Ren',area:'North Quarter',
      text:'A quiet appointment-style counter for exceptional raw cards and graded copies. Select sealed releases, no bulk boxes.',
      habit:'Ren checks every tag against the market each week. There are no bargains here, but nobody in town pays more for a good card.',
      singles:'premium',traffic:0.25,coverage:42,markup:1.20,single:1.20,floor:5,buy:0.68,capital:30000,caseCap:35,day:5,ink:'#cf967e',
      eye:{fresh:[1,0.04],old:[1,0.04],fancy:[1,0.04]},review:7,reviews:'all',hot:'market'},
    ...[
      ['super-centre','SuperMart — Central','City Centre',1.75,1],['super-west','SuperMart — Westgate','Westgate',0.85,3],
      ['value-north','ValueWay — North','North Plaza',1.25,2],['value-east','ValueWay — East','East Crossing',0.60,5],
      ['mega-mall','MegaBox — Mall','Grand Mall',1.50,4],['mega-south','MegaBox — South','South Park',0.70,6],
      ['family-outlet','Family Market','Mill Road',0.45,0]
    ].map(([id,name,area,traffic,day])=>({id,name,area,traffic,day,kind:'big',tag:traffic>1.3?'Busy launch destination':'General retail',owner:'Card aisle',
      text:'Sealed products only, always at list price. Large launch orders give way to smaller allocations, and a branch that stops selling a game marks it down and drops it.',
      singles:'none',coverage:8,markup:1,buy:0,capital:45000,caseCap:0,ink:'#7f9baf',hot:'list'}))
  ];
  const adapters={
    wk:{id:'wk',kind:'t',name:'Wildkin',world:()=>G.tcg,table:()=>G.tc,sets:t=>tcReleasedSets(t),def:tcSetDef,key:tcKey,D:tcD,inPrint:tcInPrint,msrp:TC_MSRP,ev:n=>tcPackEV(n),raror:TC_RAROR,make:(...a)=>tcMakeCopy(...a),value:tcCopyValue,fair:tcFairRaw,mini:miniT,design:'tdesign',cg:'wk',pop:()=>G.tpop,clear:k=>tfvClear(k),npc:()=>G.npcs.filter(isTcgNPC),ids:'_npcTcIds'},
    xt:{id:'xt',kind:'x',name:'Tidemark',world:()=>G.xtg,table:()=>G.xtc,sets:t=>xtReleasedSets(t),def:xtSetDef,key:xtKey,D:xtD,inPrint:xtInPrint,msrp:XT_MSRP,ev:n=>xtPackEV(n),raror:XT_RAROR,make:(...a)=>xtMakeCopy(...a),value:xtCopyValue,fair:xtFairRaw,mini:xMiniT,design:'xtdesign',cg:'xt',pop:()=>G.xpop,clear:k=>xTfvClear(k),npc:()=>G.npcs.filter(isXtNPC),ids:'_npcXtIds'},
    br:{id:'br',kind:'b',name:'Broken Reach',world:()=>G.brg,table:()=>G.brc,sets:t=>brReleasedSets(t),def:brSetDef,key:brKey,D:brD,inPrint:brInPrint,msrp:BR_MSRP,ev:n=>brPackEV(n),raror:BR_RAROR,make:(...a)=>brMakeCopy(...a),value:brCopyValue,fair:brFairRaw,mini:bMiniT,design:'brdesign',cg:'br',pop:()=>G.bpop,clear:k=>brFvClear(k),npc:()=>G.npcs.filter(isBrNPC),ids:'_npcBrIds'}
  };
  const TIERS=[[0,'New face'],[8,'Familiar face'],[40,'Regular'],[110,'Friend of the shop']];
  const round=x=>Math.round(x*100)/100;
  const clampN=(x,a,b)=>Math.max(a,Math.min(b,x));
  const ready=()=>G&&G.tcg&&G.xtg&&G.brg;
  const profile=id=>profiles.find(p=>p.id===id);
  const getCopy=(g,id)=>adapters[g]&&adapters[g].table()[id];
  const random=(s,t)=>mkRng(hsh('retail:'+G.seed+':'+s+':'+t));
  const unit=s=>(hsh(s)%1000003)/1000003;                       // a fixed number in [0,1) for a string
  const loc=id=>ensure().locations[id];
  const sku=(s,g,n,f,t)=>s.stock[adapters[g].key(n,0,f)]||(s.stock[adapters[g].key(n,0,f)]={g,n,f,q:0,refs:[],ema:null,born:t,lastSale:t,received:0,sold:0,orders:0,clearance:false});

  // ---------- standing: how well an independent shop knows the player ----------
  function standing(s){ const rep=(s&&s.rep)||0; let tier=0; for (let i=0;i<TIERS.length;i++) if (rep>=TIERS[i][0]) tier=i; return {rep,tier,name:TIERS[tier][1],next:TIERS[tier+1]?TIERS[tier+1][0]:null,from:TIERS[tier][0]}; }
  // sealed product counts for little ('sealed': a point per $25, two a day): a shop gets to know the people who trade cards with it.
  // points: the first visit of a week 1; a point per $8 spent (5 a day at most); a point per $8 sold to the shop (3 a day); events give what they say
  function credit(s,kind,amount){
    const p=profile(s.id); if (!p||p.kind!=='local') return 0;
    const d=s.repDay&&s.repDay.d===G.day? s.repDay : (s.repDay={d:G.day,visit:0,spend:0,sell:0});
    let add=0;
    if (kind==='visit'){ if (s.repWeek!==weekNo(G.day)){ s.repWeek=weekNo(G.day); add=1; } }   // showing your face counts once a week
    else if (kind==='spend'){ add=Math.max(0,Math.min(5-d.spend,amount/8)); d.spend+=add; }
    else if (kind==='sealed'){ add=Math.max(0,Math.min(2-(d.sealed||0),amount/25)); d.sealed=(d.sealed||0)+add; }
    else if (kind==='sell'){ add=Math.max(0,Math.min(3-d.sell,amount/8)); d.sell+=add; }
    else if (kind==='event') add=amount;
    if (!add){ s.seen=G.day; return 0; }
    const before=standing(s).tier; s.rep=Math.min(180,round((s.rep||0)+add)); s.seen=G.day; const after=standing(s);
    if (after.tier>before){ (G.retail.log=G.retail.log||[]).unshift([G.day,'standing',s.id,after.tier]); if (G.retail.log.length>40) G.retail.log.length=40; showToast(p.owner+' at '+p.name+' knows you now: '+after.name.toLowerCase()+'.',true); }
    return add;
  }

  // ---------- what a product is worth to a location ----------
  const heatOf=(g,n)=>clampN(adapters[g].ev(n)/adapters[g].msrp.P,0.6,1.8);   // what a pack holds against what it costs
  function demand(p,g,n,t){
    const a=adapters[g],age=Math.max(0,t-a.def(n).rel);
    // A launch surge fades into a steady rate that follows the product itself: a set worth opening keeps selling.
    const affinity=0.85+(hsh(p.id+g)%36)/100;
    return p.traffic*affinity*(0.42*heatOf(g,n)+4.8*Math.exp(-age/28))*(p.kind==='big'?1:0.65);
  }
  // customers through the door in launch weeks, which first orders (made on the forecast above) can fall short of
  const launchRush=(g,n,t)=>1+1.6*Math.max(0,heatOf(g,n)-0.9)*Math.exp(-Math.max(0,t-adapters[g].def(n).rel)/9);
  function sealedPrice(id,x){
    const p=profile(id),a=adapters[x.g],key=a.key(x.n,0,x.f),base=a.msrp[x.f],fair=a.fair(key),inPrint=a.inPrint(x.n,G.day),age=G.day-a.def(x.n).rel;
    const wanted=fair>base*1.05;                                 // the market still pays list or better for it
    if (p.kind==='big'){
      // A chain never prices above list, and only marks down what has stopped selling everywhere.
      if (!wanted && (x.clearance||!inPrint)) return round(base*0.72);
      if (!wanted && age>60 && x.q>Math.max(6,(x.ema||0)*18)) return round(base*0.88);
      return round(base);
    }
    if (p.hot==='list' && !x.refs.length) return round(base*p.markup);            // list price until it is gone
    if (x.refs.length || !inPrint) return round(Math.max(base*0.8,fair*1.06));    // bought from a collection, or out of print: the going rate
    let price=base*p.markup;
    // An independent follows the market when a product runs hot. A community shop keeps list price for its regulars.
    if (fair>base*1.25 && !(p.hot==='regulars' && standing(G.retail.locations[id]).tier>=2)) price=Math.max(price,fair*0.94);
    return round(price);
  }
  // how many of a hot product one customer may buy in a week (null: no limit)
  function limitOf(id,x){
    const p=profile(id),a=adapters[x.g]; if (x.refs.length||!a.inPrint(x.n,G.day)) return null;
    const price=sealedPrice(id,x),fair=a.fair(a.key(x.n,0,x.f)); if (fair<=price*1.12) return null;
    const tier=p.kind==='local'? standing(G.retail.locations[id]).tier : 0;
    return x.f==='B'? 1+(tier>=2?1:0) : (p.kind==='big'?6:8)+tier*2;
  }
  function boughtThisWeek(s,key){ const l=s.lim&&s.lim[key]; return l&&l[0]===weekNo(G.day)? l[1] : 0; }
  function sync(){
    // Existing price models read these aggregates to anchor sealed value to real shelf supply.
    for (const a of Object.values(adapters)){
      const old=a.world().shop||{},out={};
      for (const s of Object.values(G.retail.locations)) for (const x of Object.values(s.stock)) if (x.g===a.id){
        const z=out[x.n]||(out[x.n]={pack:0,box:0,so:old[x.n]&&old[x.n].so!=null?old[x.n].so:1,sop:old[x.n]&&old[x.n].sop!=null?old[x.n].sop:1}); z[x.f==='P'?'pack':'box']+=x.q;
      }
      a.world().shop=out;
    }
  }
  // Once a day: how sold-out is each in-print product across the locations that carry it. The franchise price models
  // lift a product above list only while this is high (tcSealedFair and its siblings).
  function pulse(t){
    for (const a of Object.values(adapters)) for (const n of a.sets(t).filter(n=>a.inPrint(n,t))){
      const z=a.world().shop[n]; if (!z) continue;
      const frac={};
      for (const f of ['P','B']){
        let carry=0,out=0;
        for (const s of Object.values(G.retail.locations)){ const x=s.stock[a.key(n,0,f)]; if (!x||(x.clearance&&!x.q)) continue; carry++; if (!x.q) out++; }
        frac[f]=carry? out/carry : 1;
      }
      // Boxes are a handful per shop, so one buyer can empty them. While packs are easy to find, a box is not scarce.
      frac.B=Math.min(frac.B,frac.P+0.1);
      for (const f of ['P','B']){ const k=f==='P'?'sop':'so'; z[k]=round((z[k]==null?1:z[k])*0.8+frac[f]*0.2); a.clear(a.key(n,0,f)); }
    }
  }

  // ---------- singles: taste, appraisal and price tags ----------
  const tierOf=(a,d)=>Math.max(0,a.raror[d.rar]||0);
  const isFancy=(a,d,c)=>c.g>0||d.v!=='N'||tierOf(a,d)>=3;
  function accepts(p,g,c){
    const a=adapters[g],d=a.D(c.k),v=a.value(c);
    if (p.kind!=='local'||p.singles==='none'||d.sealed||c.g<0) return false;
    if (p.singles==='premium') return c.g>0? v>=15 : v>=20&&condLabel(c.c)==='NM';
    // the bins take almost anything raw, but not a mountain of worthless commons
    if (p.singles==='budget') return c.g===0&&v>=0.10&&v<=60&&(tierOf(a,d)>=1||d.v!=='N'||hsh('bulk'+c.id)%4===0);
    if (p.singles==='play') return c.g===0&&v>=1&&v<=80;
    return v>=1&&v<=400;
  }
  // the owner's opinion of one copy: fixed for that shop and copy, so asking twice changes nothing
  function zOf(p,g,c){ const u1=Math.max(1e-6,unit('z1:'+G.seed+p.id+g+c.id)),u2=unit('z2:'+G.seed+p.id+g+c.id); return Math.sqrt(-2*Math.log(u1))*Math.cos(6.283185307*u2); }
  function appraise(p,g,c){
    const a=adapters[g],d=a.D(c.k),v=a.value(c); if (!p.eye) return v;
    const e=isFancy(a,d,c)? p.eye.fancy : (G.day-d.def.rel)>730? p.eye.old : p.eye.fresh;
    return v*e[0]*Math.exp(e[1]*clampN(zOf(p,g,c),-2.2,2.2));
  }
  // does a bin shop's owner notice that this card is worth pulling out for the case
  const recognised=(p,g,c)=>!p.bins|| (adapters[g].value(c)>=6 && unit('rec:'+G.seed+p.id+g+c.id)<p.know);
  function binPrice(p,g,c){ const a=adapters[g],d=a.D(c.k); return p.bins[Math.min(p.bins.length-1,tierOf(a,d))]*(d.v!=='N'?2:1); }
  function tagFor(p,g,c){
    if (p.bins && !recognised(p,g,c)) return {p:binPrice(p,g,c),b:1};
    return {p:round(Math.max(p.floor||0.25,appraise(p,g,c)*(p.single||1.2))),b:0};
  }
  function refOf(s,g,id){ return s.singles.find(r=>r.g===g&&r.id===+id); }
  function stamp(s,ref,c,t,arrived){ const tg=tagFor(profile(s.id),ref.g,c); ref.p=tg.p; ref.b=tg.b; ref.d=t; if (arrived||ref.n==null) ref.n=t; return ref; }
  function singlePrice(id,g,c){
    const s=G.retail.locations[id],ref=s&&refOf(s,g,c.id); let price=ref&&ref.p!=null? ref.p : tagFor(profile(id),g,c).p;
    if (s && standing(s).tier>=3) price=Math.max(0.1,price*0.93);   // a friend of the shop
    return round(price);
  }
  // what the shop pays for a card: its own opinion of it, times its buy rate, better for people it knows
  function offer(id,g,c){
    const p=profile(id); if (!p||!adapters[g]||!c||!accepts(p,g,c)) return 0;
    const s=G.retail&&G.retail.locations[id],tier=s?standing(s).tier:0,bonus=tier>=3?1.10:tier>=2?1.05:1;
    const basis=p.bins&&!recognised(p,g,c)? binPrice(p,g,c)*0.7 : appraise(p,g,c);
    return Math.floor(basis*p.buy*bonus*100)/100;
  }
  function takeFromCollector(s,g,c,t){
    const a=adapters[g],p=profile(s.id),sealed=a.D(c.k).sealed;
    const cost=round(sealed? a.value(c)*(p.buy||0.55) : Math.max(0.02,offer(s.id,g,c)));
    if (cost>s.cash || c.o<=0 || c.l || c.g<0) return false;
    const seller=NPC(c.o); if (!seller) return false;
    s.cash=round(s.cash-cost); seller.cash=round(seller.cash+cost);
    c.o=-2; c.rs=s.id;
    // NPC grading samples this pool; a shop's raw cards must not be graded behind its back.
    if (G[a.ids]) G[a.ids]=G[a.ids].filter(id=>id!==c.id);
    if (sealed){ const d=a.D(c.k),x=sku(s,g,d.set,d.v,t); x.refs.push(c.id); x.q++; x.received++; }
    else s.singles.push(stamp(s,{g,id:c.id},c,t,true));
    return true;
  }
  // what share of a shop's intake comes from each value band [from, to, share]: every case has its bread and butter and a few better cards
  const INTAKE={budget:[[0.1,1,0.5],[1,5,0.32],[5,60,0.18]],play:[[1,5,0.5],[5,20,0.35],[20,80,0.15]],mixed:[[1,5,0.4],[5,25,0.35],[25,400,0.25]],premium:[[15,1e9,1]]};
  function acquire(s,t,initial){
    const p=profile(s.id); if (p.kind!=='local') return;
    const r=random(s.id+':buying',t),target=p.caseCap-s.singles.length;
    // Search a bounded sample of real, unlisted collector copies. No conjured grails or slabs.
    let need=Math.min(target,initial?p.caseCap:Math.max(2,Math.ceil(p.caseCap*0.14)));
    const perGame=Math.max(1,Math.ceil(need/3));
    const pools=Object.values(adapters).map(a=>[a,Object.values(a.table()).filter(c=>c.o>0&&!c.l&&c.g>=0)]);
    for (const [a,copies] of pools){
      if (!copies.length) continue;
      const quota=Math.max(0,Math.ceil(p.caseCap/3)-s.singles.filter(ref=>ref.g===a.id).length);
      let got=0; const want=Math.min(perGame,quota),bands=(INTAKE[p.singles]||[]).map(b=>({lo:b[0],hi:b[1],left:Math.ceil(want*b[2])}));
      for (let i=0;i<(p.singles==='none'?(initial?600:200):initial?3000:1200);i++){
        const c=copies[Math.floor(r()*copies.length)]; if (!c||c.o<=0||c.l) continue;
        const v=a.value(c),band=bands.find(b=>v>=b.lo&&v<b.hi&&b.left>0);
        if (need>0&&got<want&&band&&accepts(p,a.id,c)&&takeFromCollector(s,a.id,c,t)){ need--; got++; band.left--; }
        // Historical sealed is transferred from actual owners, never reprinted or regenerated.
        else if ((initial||r()<0.04)&&a.D(c.k).sealed&&!a.inPrint(a.D(c.k).set,t)&&Object.values(s.stock).reduce((n,x)=>n+x.refs.length,0)<12){
          takeFromCollector(s,a.id,c,t);
        }
        if (got>=Math.min(perGame,quota)&&!initial&&p.singles!=='none') break;
      }
    }
  }
  // the owner's routine look at the case: cards due a review get today's opinion
  function review(s,t){
    const p=profile(s.id); if (!p.review) return;
    for (const ref of s.singles){
      if (t-(ref.d||0)<p.review) continue;
      const c=getCopy(ref.g,ref.id); if (!c) continue; const a=adapters[ref.g],d=a.D(c.k);
      if (p.reviews==='fresh' && ((t-d.def.rel)>730||isFancy(a,d,c))) continue;   // only what the owner follows
      if (p.reviews==='case' && ref.b) continue;                                  // bins are never re-priced
      stamp(s,ref,c,t,false);
    }
  }

  // ---------- sealed ordering ----------
  function order(s,x,t,initial){
    const p=profile(s.id),a=adapters[x.g]; if (!a.inPrint(x.n,t)||a.def(x.n).rel>t) return;
    const age=t-a.def(x.n).rel,forecast=demand(p,x.g,x.n,t)*(x.f==='B'?0.055:1);
    const rate=x.ema==null?forecast:0.65*x.ema+0.35*forecast;
    if (p.kind==='big'&&age>100&&rate<(x.f==='B'?0.03:0.55)){ x.clearance=true; return; }
    if (x.clearance && !initial) return;
    const max=p.kind==='big'?(x.f==='B'?7:120):(x.f==='B'?2:24);
    const target=Math.min(max,Math.ceil(rate*p.coverage)+(p.kind==='local'?(x.f==='B'?1:3):0));
    const price=a.msrp[x.f]*(p.kind==='big'?0.67:0.76);
    const q=Math.min(Math.max(0,target-x.q),Math.floor(s.cash/price));
    if (!q) return; x.q+=q; x.received+=q; x.orders+=q; x.lastDelivery=t; s.cash=round(s.cash-q*price); s.spent=round(s.spent+q*price);
  }
  function migrateStock(sources,t){
    // Distribute existing shelf quantities once, not once per visit or load.
    for (const a of Object.values(adapters)){
      const source=sources[a.id];
      for (const [n,z] of Object.entries(source.shop||{})) for (const f of ['P','B']){
        let left=Math.max(0,Math.floor(z[f==='P'?'pack':'box']||0));
        const eligible=profiles.filter(p=>p.kind==='big');
        for (let i=0;left>0;i++,left--){ const s=G.retail.locations[eligible[i%eligible.length].id],x=sku(s,a.id,+n,f,t); x.q++; x.received++; }
      }
      // The old case contains descriptors rather than copies; materialize each once.
      const shops=profiles.filter(p=>p.kind==='local'&&p.singles!=='none');
      for (const d of source.cs||[]){
        const c=a.make(d.k,-2,null,'shop'); c.c=d.c.slice();
        const p=shops.find(p=>accepts(p,a.id,c))||profile('lantern'); c.rs=p.id;
        const s=G.retail.locations[p.id]; s.singles.push(stamp(s,{g:a.id,id:c.id},c,t,true));
      }
      if (source.lgs){
        const s=G.retail.locations[({wk:'tidepool',xt:'lantern',br:'cargo'})[a.id]];
        const n=a.sets(t).filter(n=>a.inPrint(n,t)).pop();
        if (n) for (const f of ['P','B']){ const x=sku(s,a.id,n,f,t),q=Math.max(0,source.lgs[f==='P'?'pack':'box']||0); x.q+=q; x.received+=q; }
        source.lgs.pack=source.lgs.box=0; source.lgs.cs=[];
      }
    }
  }
  // a version 1 world (pull request 39) gains tags, limits and standing; nothing the player owns is touched
  function upgrade(w){
    for (const p of profiles){ const s=w.locations[p.id]; if (!s) continue;
      s.rep=s.rep||0; s.lim=s.lim||{};
      s.singles=s.singles.filter(ref=>{ const c=getCopy(ref.g,ref.id); if (!c||c.o!==-2||c.rs!==p.id) return false; if (ref.p==null){ stamp(s,ref,c,G.day,false); ref.n=G.day-30; } return true; });
    }
    w.log=w.log||[]; w.v=VERSION; return w;
  }
  function ensure(){
    if (!ready()) return null;
    if (G.retail&&G.retail.v===VERSION) return G.retail;
    if (G.retail&&G.retail.v===1){ upgrade(G.retail); sync(); return G.retail; }
    const sources={}; for (const a of Object.values(adapters)) sources[a.id]={shop:a.world().shop,lgs:a.world().lgs,cs:(a.world().lgs&&a.world().lgs.cs||[]).slice()};
    G.retail={v:VERSION,last:G.day,locations:{},log:[]};
    for (const p of profiles) G.retail.locations[p.id]={id:p.id,cash:p.capital,stock:{},singles:[],spent:0,revenue:0,visit:null,rep:0,lim:{}};
    migrateStock(sources,G.day);
    for (const p of profiles){ const s=G.retail.locations[p.id]; for (const a of Object.values(adapters)) for (const n of a.sets(G.day).filter(n=>a.inPrint(n,G.day))) for (const f of ['P','B']) order(s,sku(s,a.id,n,f,G.day),G.day,true); acquire(s,G.day,true);
      const r=random(p.id+':season',G.day); s.singles=s.singles.filter(ref=>{ const c=getCopy(ref.g,ref.id),v=adapters[ref.g].value(c); ref.n=G.day-10; if (v>=2&&ref.p<=v*0.75&&r()<0.8){ giveNpc(ref.g,c,r); return false; } return true; }); }
    sync(); return G.retail;
  }
  // Drop references to copies that are gone (the Tidemark vintage rebuild replaces every copy the player does not own;
  // a damaged save could do the same). Sealed counts follow their references, so nothing is sold that does not exist.
  function repair(){
    const w=G.retail; if (!w) return 0; let n=0;
    for (const p of profiles){ const s=w.locations[p.id]; if (!s) continue;
      const before=s.singles.length; s.singles=s.singles.filter(ref=>{ const c=getCopy(ref.g,ref.id); return c&&c.o===-2&&c.rs===p.id; }); n+=before-s.singles.length;
      for (const [k,x] of Object.entries(s.stock)){ const live=x.refs.filter(id=>{ const c=getCopy(x.g,id); return c&&c.o===-2&&c.rs===p.id; }); const lost=x.refs.length-live.length; if (lost){ x.refs=live; x.q=Math.max(live.length,x.q-lost); n+=lost; } if (!x.q&&!adapters[x.g].inPrint(x.n,G.day)) delete s.stock[k]; }
    }
    if (n) sync(); return n;
  }
  function giveNpc(g,c,r,price=0){
    const a=adapters[g],pool=a.npc().filter(n=>n.cash>=price); if (!pool.length) return false;
    const n=pool[Math.floor(r()*pool.length)]; n.cash=round(n.cash-price); c.o=n.id; delete c.rs;
    const ids=G[a.ids]=G[a.ids]||[]; if (!ids.includes(c.id)) ids.splice(Math.floor(r()*(ids.length+1)),0,c.id); return true;
  }
  function day(t){
    const w=ensure(); if (!w||w.last>=t) return;
    // Called after all three franchise ticks; never advances the global simulation itself.
    for (let d=w.last+1;d<=t;d++){
      for (const p of profiles){ const s=w.locations[p.id],r=random(p.id,d);
        for (const a of Object.values(adapters)) for (const n of a.sets(d).filter(n=>a.inPrint(n,d))) for (const f of ['P','B']){
          const x=sku(s,a.id,n,f,d); if (d===a.def(n).rel||dowOf(d)===p.day) order(s,x,d,d===a.def(n).rel);
        }
        for (const [key,x] of Object.entries(s.stock)){
          const a=adapters[x.g],age=d-a.def(x.n).rel;
          // Customers today: a whole number drawn around the expected rate (0.4 a day is a sale two days in five, not never).
          const expect=Math.max(0,demand(p,x.g,x.n,d)*launchRush(x.g,x.n,d)*(x.f==='B'?0.055:1)*(0.5+r()));
          const wants=Math.floor(expect)+(r()<expect%1?1:0);
          // Independent shops still sell the odd old item; vintage is intentionally a long tail.
          const q=Math.min(x.q,wants+(p.kind==='local'&&r()<(x.f==='B'?0.025:0.12)?1:0));
          if (q){ x.q-=q; x.sold+=q; x.lastSale=d; s.cash=round(s.cash+q*sealedPrice(p.id,x)); s.revenue=round(s.revenue+q*sealedPrice(p.id,x));
            for (let i=0;i<q&&x.refs.length;i++){ const c=getCopy(x.g,x.refs.pop()); if (c) giveNpc(x.g,c,r); }
          }
          // One customer clearing a shelf is not a trend: the player counts for two sales a day at most.
          const observed=q+Math.min(2,x.playerSales||0)+Math.min(Math.max(0,wants-q),2)*0.20;
          x.playerSales=0;
          x.ema=x.ema==null?observed:x.ema*0.87+observed*0.13;
          if (p.kind==='big'&&age>70&&d-x.lastSale>21) x.clearance=true;
          if (!x.q&&!a.inPrint(x.n,d)) delete s.stock[key];
        }
        // Other customers: a card tagged under its value goes quickly, an overpriced one sits.
        const base=(p.singles==='premium'?0.006:0.02)*p.traffic;
        s.singles=s.singles.filter(ref=>{ const c=getCopy(ref.g,ref.id); if (!c||c.o!==-2||c.rs!==p.id) return false;
          if (d-(ref.n||0)<3) return true;   // just put out
          const v=adapters[ref.g].value(c),tag=ref.p||v; const pull=clampN(Math.pow(v/Math.max(0.05,tag),1.5),0.3,6);
          if (r()<base*pull){ if (!giveNpc(ref.g,c,r,tag)) return true; s.cash=round(s.cash+tag); s.revenue=round(s.revenue+tag); return false; }
          return true; });
        if (dowOf(d)===p.day){
          review(s,d); acquire(s,d,false);
          if (p.kind==='local' && s.rep>0 && d-(s.seen||0)>28) s.rep=Math.max(0,round(s.rep-2));   // out of sight, slowly out of mind
        }
      }
      w.last=d;
      pulse(d);
    }
    sync();
  }
  function sealedBuy(id,key,q){
    const w=ensure(),s=w&&w.locations[id],x=s&&s.stock[key]; q=Number(q);
    if (!Number.isSafeInteger(q)||q<1||q>100) return 'Choose a whole quantity from 1 to 100.';
    if (!x||x.q<q) return 'Not enough in stock at this location.';
    const a=adapters[x.g],price=sealedPrice(id,x),total=round(price*q);
    const lim=limitOf(id,x); if (lim!=null && boughtThisWeek(s,key)+q>lim) return 'Limit '+lim+' per customer this week while it is selling this fast'+(boughtThisWeek(s,key)?' (you have had '+boughtThisWeek(s,key)+')':'')+'.';
    if (G.player.cash<total) return 'You need '+money(total,true)+'.';
    G.player.cash=round(G.player.cash-total); G.player.bought=round(G.player.bought+total); s.cash=round(s.cash+total); s.revenue=round(s.revenue+total);
    for (let i=0;i<q;i++){
      let c=x.refs.length?getCopy(x.g,x.refs.pop()):null;
      if (!c) c=a.make(key,0,null,'shop'); c.o=0; delete c.rs; c.a=[G.day,'bought',price,profile(id).name]; c.nw=1;
      c.h=(c.h||[]).concat([[G.day,'Bought at '+profile(id).name,price,'']]); c.pv={d:G.day,v:round(a.value(c)),n:''};
    }
    if (lim!=null){ s.lim=s.lim||{}; s.lim[key]=[weekNo(G.day),boughtThisWeek(s,key)+q]; }
    x.q-=q; x.sold+=q; x.playerSales=(x.playerSales||0)+q; x.lastSale=G.day; UI.cg=a.cg; credit(s,'sealed',total); sync(); return null;
  }
  function singleBuy(id,g,cid){
    const w=ensure(),s=w&&w.locations[id],a=adapters[g],c=a&&a.table()[cid];
    if (!s||!c||c.o!==-2||c.rs!==id||!refOf(s,g,cid)) return 'That copy has already sold.';
    const p=singlePrice(id,g,c); if (G.player.cash<p) return 'You need '+money(p,true)+'.';
    const worth=round(a.value(c)),inBin=!!refOf(s,g,cid).b;
    G.player.cash=round(G.player.cash-p); G.player.bought=round(G.player.bought+p); s.cash=round(s.cash+p); s.revenue=round(s.revenue+p);
    c.o=0; delete c.rs; c.nw=1; c.a=[G.day,'bought',p,profile(id).name]; c.h=(c.h||[]).concat([[G.day,'Bought at '+profile(id).name,p,'']]); c.pv={d:G.day,v:worth,n:''};
    s.singles=s.singles.filter(x=>!(x.g===g&&x.id===+cid)); UI.cg=a.cg; credit(s,'spend',p);
    if (typeof CIRCUIT!=='undefined'&&CIRCUIT) CIRCUIT.noteFind(g,c,p,worth,profile(id).name,inBin);
    return null;
  }
  function sell(id,g,cid){
    const w=ensure(),s=w&&w.locations[id],a=adapters[g],c=a&&a.table()[cid],p=profile(id);
    if (!s||!c||c.o!==0||c.l||c.g<0) return 'That copy is not available to sell.';
    const price=offer(id,g,c); if (price<0.05) return 'This shop passes on that card.';
    if (s.singles.length>=p.caseCap) return 'The case is full. Try another shop.';
    if (price>s.cash) return 'The shop does not have enough buying cash today.';
    G.player.cash=round(G.player.cash+price); G.player.sold=round((G.player.sold||0)+price); s.cash=round(s.cash-price);
    a.world().bl=(a.world().bl||0)+1; c.o=-2; c.rs=id; c.h=(c.h||[]).concat([[G.day,'Sold to '+p.name,price,'']]);
    s.singles.push(stamp(s,{g,id:c.id},c,G.day,true)); credit(s,'sell',price); return null;
  }
  function where(g,key){
    const w=ensure(); if (!w) return [];
    const out=[];
    for (const p of profiles){ const s=w.locations[p.id],x=s.stock[key];
      if (x&&x.q>0) out.push({w:p.name,p:sealedPrice(p.id,x),act:'rsealed',a:p.id+'~'+key+'~1',note:'sealed · '+p.area});
      for (const ref of s.singles){ if (ref.g!==g) continue; const c=getCopy(g,ref.id); if (!c||c.k!==key||c.o!==-2||c.rs!==p.id) continue;
        out.push({w:p.name,p:singlePrice(p.id,g,c),act:'rsingle',a:p.id+'~'+g+'~'+c.id,note:c.g>0?'GCS '+c.g:COND_LABN[condLabel(c.c)]});
      }
    }
    return out;
  }
  function visit(id){ const s=loc(id); if (!s) return; const stock=Object.values(s.stock).filter(x=>x.q>0); s.visit={day:G.day,sealed:stock.reduce((n,x)=>n+x.q,0),singles:s.singles.length}; credit(s,'visit'); }
  function nextDelivery(id){ let d=G.day+1; while (dowOf(d)!==profile(id).day) d++; return d; }
  function summary(id){ const s=loc(id); return {sealed:Object.values(s.stock).reduce((v,x)=>v+x.q,0),singles:s.singles.length}; }
  // in-print product of one game across town: used by Home and the game tabs
  function shelf(g){
    const w=ensure(),a=adapters[g],out=[]; if (!w) return out;
    for (const p of profiles){ const s=w.locations[p.id]; for (const [k,x] of Object.entries(s.stock)) if (x.g===g&&x.q>0&&a.inPrint(x.n,G.day)&&!x.refs.length) out.push({id:p.id,name:p.name,kind:p.kind,k,f:x.f,n:x.n,q:x.q,price:sealedPrice(p.id,x)}); }
    return out.sort((x,y)=>x.price-y.price);
  }

  // ---------- what the player knows ----------
  // You know the going rate of a card you own a copy of (any printing of the same card). Everything else is a tap away.
  let knownAt=-1, knownSet=null;
  function knows(g,c){
    const stamp=G.day*1000+Object.keys(adapters[g].table()).length%1000;
    if (knownAt!==stamp||!knownSet){ knownSet=new Set(); for (const a of Object.values(adapters)) for (const x of Object.values(a.table())) if (x.o===0){ const d=a.D(x.k); if (!d.sealed) knownSet.add(a.id+':'+(d.cid||x.k)); } knownAt=stamp; }
    const d=adapters[g].D(c.k); return knownSet.has(g+':'+(d.cid||c.k));
  }
  const knownHTML=(g,c)=>knows(g,c)? `<span class="retail-known">You own this card · your estimate ${money(adapters[g].value(c),true)}</span>` : '';
  // ---------- screens ----------
  const button=(act,a,t,disabled)=>`<button class="btn sm" data-act="${act}" data-a="${esc(a)}" ${disabled?'disabled':''}>${t}</button>`;
  const DOW=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  function standingHTML(p,s){
    if (p.kind!=='local') return '';
    const st=standing(s),span=st.next!=null? st.next-st.from : 1,pct=st.next!=null? Math.round(100*(st.rep-st.from)/span) : 100;
    const perks=[st.tier>=1?'You know how '+esc(p.owner)+' prices':'', st.tier>=2?(p.buy?'+5% on cards you sell here, ':'')+'larger launch allocation'+(p.hot==='regulars'?', list price on hot releases':''):'', st.tier>=3?(p.caseCap?'7% off singles, +10% on cards you sell here, ':'')+'first word on collections':''].filter(Boolean);
    return `<div class="retail-standing"><div class="retail-standing-top"><b>${esc(st.name)}</b><span class="small muted">${st.next!=null?'next: '+esc(TIERS[st.tier+1][1].toLowerCase()):'as good as it gets'}</span></div><div class="retail-bar"><i style="width:${pct}%"></i></div>${perks.length?`<div class="small muted">${perks[perks.length-1]}</div>`:'<div class="small muted">Come by, buy and sell here, and '+esc(p.owner)+' will get to know you.</div>'}<div class="small muted">${Math.floor(st.rep)}${st.next!=null?' of '+st.next:''} · a visit a week counts, buying and selling here counts more</div></div>`;
  }
  function directory(g){
    ensure(); const f=UI.retailType||'all';
    const card=p=>{ const s=loc(p.id),v=s.visit,st=p.kind==='local'?standing(s):null;
      const onShelf=Object.entries(s.stock).filter(([k,x])=>x.q>0&&x.f==='P').slice(0,3).map(([k,x])=>esc(adapters[x.g].def(x.n).name)+' '+money(sealedPrice(p.id,x),true)).join(' · ');
      return `<article class="retail-card" style="--store-ink:${p.ink}"><div class="retail-card-top"><span>${p.kind==='big'?'BIG-BOX RETAIL':'INDEPENDENT CARD SHOP'}</span><span>${esc(p.area)}</span></div><h3>${esc(p.name)}</h3><b class="retail-tag">${esc(p.tag)}${st&&st.tier?' · '+esc(st.name):''}</b>${p.kind==='big'?'':'<p>'+esc(p.text)+'</p>'}<p class="small retail-shelf">${onShelf?'Packs: '+onShelf:'No packs on the shelf today'}</p><div class="retail-card-foot"><small>${v?'Last visit '+fmtDate(v.day)+': '+v.sealed+' sealed'+(p.singles==='none'?'':', '+v.singles+' singles'):'Not visited yet'}${p.kind==='local'?' · new stock '+DOW[p.day]+'s':''}</small>${button('rvisit',p.id,'Visit')}</div></article>`; };
    return `<div class="chips retail-filters">${[['all','All locations'],['local','Local card shops'],['big','Big-box retail']].map(([k,n])=>`<button class="chip ${f===k?'on':''}" data-act="rtype" data-a="${k}">${n}</button>`).join('')}</div><div class="retail-directory">${profiles.filter(p=>f==='all'||p.kind===f).map(card).join('')}</div><div class="panel retail-online"><h3>Online singles specialists</h3><p class="small muted">Looking for a particular print? Online catalogues share the same wallet and collection.</p><div class="formrow">${[['wk','Kinvault'],['xt','Saltmarket'],['br','Waypoint Singles']].map(([k,n])=>button('ronline',k,n)).join('')}</div></div>`;
  }
  function inventory(id,g){
    const p=profile(id),s=loc(id),search=(UI.retailQuery||'').trim().toLowerCase(),mode=UI.retailMode||'sealed',filter=UI.retailGame||g||'all';
    const match=(gg,d)=>(filter==='all'||filter===gg)&&(!search||[d.title,d.def.name,adapters[gg].name].join(' ').toLowerCase().includes(search));
    const sealed=Object.entries(s.stock).filter(([k,x])=>x.q>0&&match(x.g,adapters[x.g].D(k)));
    const singles=s.singles.map(ref=>({ref,c:getCopy(ref.g,ref.id)})).filter(({ref,c})=>c&&c.o===-2&&c.rs===id&&match(ref.g,adapters[ref.g].D(c.k)))
      .sort((a,b)=>(b.ref.n||0)-(a.ref.n||0)||singlePrice(id,b.ref.g,b.c)-singlePrice(id,a.ref.g,a.c));   // newest arrivals first, then dearest
    const mine=[]; if (mode==='sell') for (const [gg,a] of Object.entries(adapters)) for (const c of a.table()?Object.values(a.table()):[]) if (c.o===0&&!c.l&&c.g>=0&&match(gg,a.D(c.k))){ const price=offer(id,gg,c); if (price>=0.05) mine.push({gg,c,price}); }
    const rows=mode==='sealed'?sealed:mode==='singles'?singles:mine.sort((a,b)=>b.price-a.price);
    const pages=Math.max(1,Math.ceil(rows.length/18)),pg=Math.min(UI.retailPage||0,pages-1),visible=rows.slice(pg*18,pg*18+18);
    let body='';
    if (mode==='sealed') body=visible.map(([k,x])=>{ const a=adapters[x.g],d=a.D(k),price=sealedPrice(id,x),lim=limitOf(id,x),had=boughtThisWeek(s,k),left=lim==null?99:Math.max(0,lim-had);
      const desc=x.refs.length?'From a collection · finite old stock':x.clearance&&price<a.msrp[x.f]?'Clearance · no new order planned':a.inPrint(x.n,G.day)?(price>a.msrp[x.f]*p.markup*1.02?'Selling out around town · this shop charges the going rate (list price '+money(a.msrp[x.f],true)+')':'Current print run'):'Out of print · last stock';
      return `<div class="row retail-product">${a.mini({k,g:0,c:[100,100,100,100],id:0})}<div class="rt"><b>${esc(d.title)}</b><span>${a.name} · ${desc}</span><span>${x.q} in stock · <strong>${money(price,true)}</strong> each${lim!=null?' · <em class="retail-limit">limit '+lim+' a week'+(had?' ('+left+' left)':'')+'</em>':''}</span></div><div class="retail-actions">${button('rsealed',id+'~'+k+'~1','Buy one',G.player.cash<price||left<1)}${x.f==='P'?(x.q>=5&&left>=5?button('rsealed',id+'~'+k+'~5','Buy five',G.player.cash<price*5):''):''}</div></div>`; }).join('');
    else if (mode==='singles') body=visible.map(({ref,c})=>{ const a=adapters[ref.g],d=a.D(c.k),price=singlePrice(id,ref.g,c),fresh=ref.n!=null&&G.day-ref.n<7;
      return `<div class="row retail-product"><button class="mini" data-act="${a.design}" data-a="${esc(c.k)}">${a.mini(c)}</button><div class="rt"><b>${esc(d.title)}${fresh?' <em class="retail-new">new in</em>':''}</b><span>${a.name} · ${c.g>0?'GCS '+c.g:COND_LABN[condLabel(c.c)]} · ${esc(d.def.name)}</span><span><strong>${money(price,true)}</strong> · ${ref.b?'bargain bin':'glass case'}</span>${knownHTML(ref.g,c)}</div>${button('rsingle',id+'~'+ref.g+'~'+c.id,'Buy',G.player.cash<price)}</div>`; }).join('');
    else body=visible.map(({gg,c,price})=>{ const a=adapters[gg],d=a.D(c.k); return `<div class="row retail-product">${a.mini(c)}<div class="rt"><b>${esc(d.title)}</b><span>${a.name} · ${c.g>0?'GCS '+c.g:COND_LABN[condLabel(c.c)]}</span><span>Cash offer ${money(price,true)}</span></div><button class="btn sm" data-act="rsell" data-a="${id}~${gg}~${c.id}" data-confirm="Sell for ${money(price,true)}" ${price>s.cash||s.singles.length>=p.caseCap?'disabled':''}>Sell</button></div>`; }).join('');
    const hint=mode==='singles'? 'Prices here are '+esc(p.owner)+'’s, not the market’s. You know the going rate of cards you own; tap any other to look it up.' : '';
    return `<div class="panel retail-inventory"><div class="chips">${[['sealed','Packs & boxes'],...(p.singles==='none'?[]:[['singles','Singles & slabs'],['sell','Sell to this shop']])].map(([k,n])=>`<button class="chip ${mode===k?'on':''}" data-act="rmode" data-a="${k}">${n}</button>`).join('')}</div><div class="chips">${[['all','All games'],['wk','Wildkin'],['xt','Tidemark'],['br','Broken Reach']].map(([k,n])=>`<button class="chip ${filter===k?'on':''}" data-act="rgame" data-a="${k}">${n}</button>`).join('')}</div><input type="search" aria-label="Search store inventory" placeholder="Search cards, sets or games" value="${esc(UI.retailQuery||'')}" data-retail-search><div class="small muted retail-result-count">${rows.length} ${mode==='sell'?'of your cards this shop would buy':mode==='singles'?'cards':'products'}${hint?' · '+hint:''}</div><div class="rows">${body||'<div class="empty">'+(mode==='sell'?'You have nothing this shop buys. Each shop buys different cards: this one '+({play:'takes playable raw cards from $1 to $80',mixed:'takes most cards worth $1 or more',budget:'takes cheap raw cards for its bins',premium:'only takes near-mint cards worth $20 or more, and slabs'})[p.singles]+'.':'Nothing matches today. Try another game, clear the search, or visit another location.')+'</div>'}</div>${pages>1?`<div class="formrow">${button('rpage',String(Math.max(0,pg-1)),'Previous',pg===0)}<span class="small">Page ${pg+1} of ${pages}</span>${button('rpage',String(pg+1),'Next',pg===pages-1)}</div>`:''}</div>`;
  }
  function storeHead(id){
    const p=profile(id),s=loc(id),sum=summary(id),st=standing(s);
    return `<div class="retail-store-head" style="--store-ink:${p.ink}">${button('rback','','All locations')}<div class="retail-eyebrow">${esc(p.area)} · ${p.kind==='big'?'BIG-BOX RETAIL':esc(p.owner)+'’s counter'}</div><h2>${esc(p.name)}</h2><div class="retail-store-facts"><span>${sum.sealed} sealed</span><span>${p.singles==='none'?'No singles or buylist':sum.singles+' singles & slabs'}</span><span>${p.kind==='local'?'New stock ':'Restocks '}${DOW[p.day]}s</span></div>${standingHTML(p,s)}<details><summary>About this shop</summary><p>${esc(p.text)}</p>${p.kind==='local'?(st.tier>=1?`<p class="retail-habit"><b>What you have learned:</b> ${esc(p.habit)}</p>`:`<p class="small muted">Every owner prices in their own way. Become a familiar face and you will learn how ${esc(p.owner)} does it.</p>`)+'<p class="small muted">Familiar face: you learn how the owner prices, and owners pass on tips. Regular: better prices for cards you sell here and a larger share of a hot release. Friend of the shop: money off singles and better still when you sell.</p>':'<p class="small muted">Orders follow recent sales. A branch that stops selling a game marks it down and drops the line; busy branches keep it for the whole print run.</p>'}</details></div>`;
  }
  function view(g){
    if (!ready()) return '<div class="panel">Opening the stores…</div>'; ensure();
    const id=UI.retailLocation,p=id&&profile(id);
    const sub=typeof CIRCUIT!=='undefined'&&CIRCUIT? CIRCUIT.tabs() : '';
    const heading=`<div class="pagetitle"><h1>Stores</h1><span class="small muted">${fmtDate(G.day,true)}</span></div>`;
    if (UI.retailOnline){ const gg=UI.retailOnline; return heading+button('rback','','All locations')+({wk:tcKvV,xt:xtKvV,br:brKvV}[gg])(); }
    if (p) return heading+storeHead(id)+inventory(id,g);
    if (sub && UI.retailTab==='out') return heading+sub+CIRCUIT.view();
    return heading+sub+directory(g);
  }
  // On a game's own tab: where that game is on a shelf today, cheapest first, instead of the whole directory again.
  function gameStrip(g){
    if (!ready()) return ''; ensure(); const a=adapters[g],rows=shelf(g),seen=new Set(),pick=[];
    for (const r of rows){ if (seen.has(r.id)) continue; seen.add(r.id); pick.push(r); if (pick.length>=4) break; }
    const body=pick.length? pick.map(r=>`<div class="row"><div class="rt"><b>${esc(r.name)}</b><span>${esc(a.def(r.n).name)} ${r.f==='P'?'packs':'boxes'} · ${r.q} in stock</span></div><div class="rp"><strong>${money(r.price,true)}</strong></div>${button('rvisit',r.id,'Go')}</div>`).join('') : (()=>{ const old=[]; for (const q of profiles){ const st=G.retail.locations[q.id]; const n=Object.values(st.stock).filter(x=>x.g===g&&x.q>0).reduce((t,x)=>t+x.q,0); if (n) old.push(`<div class="row"><div class="rt"><b>${esc(q.name)}</b><span>${n} older sealed item${n>1?'s':''}, out of print</span></div>${button('rvisit',q.id,'Go')}</div>`); } return old.length? old.slice(0,4).join('') : '<div class="empty">Nothing of '+a.name+' is on a shelf today.</div>'; })();
    return `<div class="panel retail-strip"><h3>${a.name} around town</h3><div class="rows">${body}</div><div class="formrow">${button('rall','','All stores')}</div></div>`;
  }
  function done(error,ok){ if (error){ showToast(error); return; } if (UI.retailLocation) visit(UI.retailLocation); showToast(ok,true); refreshSheet(); render(true); queueSave(); }
  ACT.rvisit=id=>{ if (!profile(id)) return; UI.retailLocation=id; UI.retailOnline=null; UI.retailMode='sealed'; UI.retailPage=0; UI.retailQuery=''; UI.tab='stores'; visit(id); render(); queueSave(); window.scrollTo(0,0); };
  ACT.rback=()=>{ UI.retailLocation=null; UI.retailOnline=null; render(true); };
  ACT.rall=()=>{ UI.retailLocation=null; UI.retailOnline=null; UI.retailTab='shops'; UI.tab='stores'; render(); window.scrollTo(0,0); };
  ACT.rtype=k=>{ UI.retailType=k; render(true); };
  ACT.rmode=k=>{ if (!['sealed','singles','sell'].includes(k)) return; UI.retailMode=k; UI.retailPage=0; render(true); };
  ACT.rgame=k=>{ if (!['all','wk','xt','br'].includes(k)) return; UI.retailGame=k; UI.retailPage=0; render(true); };
  ACT.rpage=k=>{ UI.retailPage=Math.max(0,Number(k)||0); render(true); };
  ACT.ronline=g=>{ if (!adapters[g]) return; UI.tab='stores'; UI.retailOnline=g; UI.retailLocation=null; render(); };
  ACT.rsealed=a=>{ const [id,k,q]=a.split('~'); if (!profile(id)) return; done(sealedBuy(id,k,+q),'Bought at '+profile(id).name+'. Find it in Collection.'); };
  ACT.rsingle=a=>{ const [id,g,c]=a.split('~'); if (!profile(id)) return; done(singleBuy(id,g,+c),'Bought at '+profile(id).name+'. Find it in Collection.'); };
  ACT.rsell=(a,el)=>{ if (el&&!armed(el)) return; const [id,g,c]=a.split('~'); if (!profile(id)) return; done(sell(id,g,+c),'Sold to '+profile(id).name+'.'); };
  let searchTimer;
  document.addEventListener('input',e=>{ if (!e.target.matches('[data-retail-search]')) return; const value=e.target.value; clearTimeout(searchTimer); searchTimer=setTimeout(()=>{ UI.retailQuery=value; UI.retailPage=0; render(true); const field=document.querySelector('[data-retail-search]'); if (field){ field.focus(); } },180); });
  // Store views share the same world. A game's own tab shows where that game is on a shelf, then its sealed panel.
  VIEWS.stores=()=>view(); ICONS.stores=ICONS.shop;
  tcShopV=()=>gameStrip('wk')+tcSealedPanel(); xtShopV=()=>gameStrip('xt')+xtSealedPanel()+xtHistoryPanel(); brShopV=()=>gameStrip('br')+brSealedPanel();
  // Keep online specialists; replace only the now-retired per-franchise physical shops.
  for (const [g,name] of [['wk','tcWhere'],['xt','xtWhere'],['br','brWhere']]){
    const previous={wk:tcWhere,xt:xtWhere,br:brWhere}[g];
    const wrapped=k=>previous(k).filter(x=>!['lgssingle','xlgssingle','blgssingle'].includes(x.act)).concat(where(g,k)).sort((a,b)=>a.p-b.p);
    if (g==='wk') tcWhere=wrapped; else if (g==='xt') xtWhere=wrapped; else brWhere=wrapped;
  }
  const oldNew=newGame; newGame=async function(){ const r=await oldNew.apply(this,arguments); ensure(); return r; };
  const oldAdvance=advanceDay; advanceDay=function(){ ensure(); oldAdvance.apply(this,arguments); day(G.day); };
  const oldMigrate=migrate; migrate=function(){ oldMigrate.apply(this,arguments); if (ready()){ ensure(); repair(); } };
  if (typeof xtRebuildVintage==='function'){ const oldRebuild=xtRebuildVintage; xtRebuildVintage=function(){ const r=oldRebuild.apply(this,arguments); if (G.retail){ repair(); if (typeof CIRCUIT!=='undefined'&&CIRCUIT) CIRCUIT.repair(); } return r; }; }
  // Selling from a card page or "sell duplicates" goes to the shared shops: whichever pays most for that card today.
  function sellBest(g,cid){ const c=getCopy(g,cid); if (!c) return ['That copy is not available to sell.']; let best=null,bp=0;
    for (const p of profiles){ if (p.kind!=='local'||!p.caseCap) continue; const s=G.retail.locations[p.id],o=offer(p.id,g,c); if (o>bp&&o<=s.cash&&s.singles.length<p.caseCap){ bp=o; best=p; } }
    if (!best||bp<0.05) return ['No shop in town wants that card today.']; const e=sell(best.id,g,cid); return [e,best.name,bp]; }
  for (const [g,act,dupeAct,dupes] of [['wk','lgssell','tdupesell',()=>tcDupes()],['xt','xlgssell','xtdupesell',()=>xtDupes()],['br','blgssell','brdupesell',()=>brDupes()]]){
    ACT[act]=(a,el)=>{ if (el&&el.dataset&&el.dataset.confirm&&!armed(el)) return; const [e,name]=sellBest(g,+a); done(e,e?null:'Sold to '+name+'.'); };
    ACT[dupeAct]=(a,el)=>{ if (el&&!armed(el)) return; let n=0,cash=0; for (const x of dupes()){ const [e,,p]=sellBest(g,x.c.id); if (!e){ n++; cash+=p; } } closeSheet(); showToast(n? `Sold ${n} spare card${n>1?'s':''} to the shops that pay most for them, for ${money(cash,true)}.` : 'No shop wants those today.',!!n); render(true); queueSave(); };
  }
  // A save can gain a franchise later. Its new copy table must not inherit stale references.
  function addLine(g){
    const a=adapters[g]; if (!G.retail) return;
    for (const p of profiles){ const s=G.retail.locations[p.id];
      s.singles=s.singles.filter(r=>r.g!==g);
      for (const [k,x] of Object.entries(s.stock)) if (x.g===g) delete s.stock[k];
      for (const n of a.sets(G.day).filter(n=>a.inPrint(n,G.day))) for (const f of ['P','B']) order(s,sku(s,g,n,f,G.day),G.day,true);
      acquire(s,G.day,false);
    }
    sync();
  }
  const oldUpgradeBr=upgradeBr; upgradeBr=async function(){ const had=!!G.brg; await oldUpgradeBr.apply(this,arguments); if (!had&&G.retail) addLine('br'); };
  const oldUpgradeXt=upgradeXt; upgradeXt=async function(){ const had=!!G.xtg; await oldUpgradeXt.apply(this,arguments); if (!had&&G.retail) addLine('xt'); };
  // Legacy physical-shop ticks stop once migrated; prices still read the synchronized totals.
  for (const n of ['tcShopWeek','tcShopDay','tcLgsWeek','tcLgsDay','tcLgsCase','xtShopWeek','xtShopDay','xtLgsWeek','xtLgsDay','xtLgsCase','brShopWeek','brShopDay','brLgsWeek','brLgsDay','brLgsCase']){
    // These are function declarations in the concatenated script (also window properties).
    const old=window[n]; window[n]=function(){ if (G&&G.retail) return; return old.apply(this,arguments); };
  }
  // Existing callers (scenario tests, preorder tooling) buy from an actual stocked location.
  function legacyBuy(g,n,f,q,local){ ensure(); const key=adapters[g].key(n,0,f); let last='Not enough in stock.';
    for (const p of profiles.filter(p=>(local?p.kind==='local':p.kind==='big'))){ const x=loc(p.id).stock[key]; if (!x||x.q<q) continue; const e=sealedBuy(p.id,key,q); if (!e) return null; last=e; }
    return last; }
  tcBuySealed=(n,f,q)=>legacyBuy('wk',n,f,q,false); xtBuySealed=(n,f,q)=>legacyBuy('xt',n,f,q,false); brBuySealed=(n,f,q)=>legacyBuy('br',n,f,q,false);
  tcLgsBuySealed=(f,q)=>legacyBuy('wk',tcNewestSet(G.day),f,q,true); xtLgsBuySealed=(f,q)=>legacyBuy('xt',TM_TT,f,q,true); brLgsBuySealed=(f,q)=>legacyBuy('br',1,f,q,true);
  return {VERSION,TIERS,profiles,adapters,ensure,day,where,profile,summary,visit,nextDelivery,sealedPrice,singlePrice,sealedBuy,singleBuy,offer,sell,order,demand,accepts,view,
    standing,credit,repair,sellBest,limitOf,boughtThisWeek,appraise,recognised,tagFor,shelf,giveNpc,getCopy,random,unit,round,review,acquire,pulse,heatOf,knows,knownHTML};
})();
