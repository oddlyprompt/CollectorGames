// Shared physical retailers. The franchise economies still own cards, prices and print runs.
// G.retail holds locations, finite stock, cash, buying history and last-visit snapshots.
// Copies in a store remain in their original copy table (owner -2, rs=location id), so
// vintage Tidemark is counted in its census and is never manufactured by a restock.
const RETAIL=(function(){
  if (PACK.id!=='tcg') return null;
  const profiles=[
    {id:'tidepool',name:'The Tidepool',kind:'local',tag:'Community tables',owner:'Mara',area:'Riverside',text:'League regulars, sensible prices and cards people actually play. New releases share a shelf with last season’s favourites.',singles:'play',traffic:0.85,coverage:24,markup:1.07,buy:0.60,capital:8500,caseCap:65,day:4,ink:'#76b988'},
    {id:'lantern',name:'The Lantern Room',kind:'local',tag:'The collector’s shelves',owner:'Ellis',area:'Old Town',text:'Older boxes behind the counter, binders worth taking your time over, and an owner who keeps stock long after the launch crowds leave.',singles:'mixed',traffic:0.55,coverage:40,markup:1.12,buy:0.56,capital:14500,caseCap:90,day:2,ink:'#d1ae69'},
    {id:'cargo',name:'The Cargo Cage',kind:'local',tag:'Dollar-bin digging',owner:'Jules',area:'Station Arcade',text:'Rows of affordable singles, everyday sealed product and the occasional excellent card tucked into the case.',singles:'budget',traffic:0.70,coverage:30,markup:1.03,buy:0.42,capital:6500,caseCap:150,day:6,ink:'#b78dcb'},
    {id:'corner',name:'Corner Pocket Games',kind:'local',tag:'Packs and play nights',owner:'Dev',area:'Maple Square',text:'A small sealed-product shop. Orders are cautious, old boxes linger, and there is no singles counter or cash buylist.',singles:'none',traffic:0.38,coverage:32,markup:1.08,buy:0,capital:4500,caseCap:0,day:3,ink:'#719cc5'},
    {id:'glass',name:'The Glass Cabinet',kind:'local',tag:'Grails and graded cards',owner:'Ren',area:'North Quarter',text:'A quiet appointment-style counter for exceptional raw cards and graded copies. Select sealed releases, no bulk boxes.',singles:'premium',traffic:0.25,coverage:42,markup:1.20,buy:0.68,capital:30000,caseCap:35,day:5,ink:'#cf967e'},
    ...[
      ['super-centre','SuperMart — Central','City Centre',1.75,1],['super-west','SuperMart — Westgate','Westgate',0.85,3],
      ['value-north','ValueWay — North','North Plaza',1.25,2],['value-east','ValueWay — East','East Crossing',0.60,5],
      ['mega-mall','MegaBox — Mall','Grand Mall',1.50,4],['mega-south','MegaBox — South','South Park',0.70,6],
      ['family-outlet','Family Market','Mill Road',0.45,0]
    ].map(([id,name,area,traffic,day])=>({id,name,area,traffic,day,kind:'big',tag:traffic>1.3?'Busy launch destination':'General retail',owner:'Card aisle',text:'Sealed products only. Large launch orders give way to smaller allocations, markdowns and clearance as sales slow.',singles:'none',coverage:8,markup:1,buy:0,capital:45000,caseCap:0,ink:'#7f9baf'}))
  ];
  const adapters={
    wk:{id:'wk',name:'Wildkin',world:()=>G.tcg,table:()=>G.tc,sets:t=>tcReleasedSets(t),def:tcSetDef,key:tcKey,D:tcD,inPrint:tcInPrint,msrp:TC_MSRP,make:(...a)=>tcMakeCopy(...a),value:tcCopyValue,fair:tcFairRaw,mini:miniT,design:'tdesign',cg:'wk',pop:()=>G.tpop,clear:k=>tfvClear(k),npc:()=>G.npcs.filter(isTcgNPC),ids:'_npcTcIds'},
    xt:{id:'xt',name:'Tidemark',world:()=>G.xtg,table:()=>G.xtc,sets:t=>xtReleasedSets(t),def:xtSetDef,key:xtKey,D:xtD,inPrint:xtInPrint,msrp:XT_MSRP,make:(...a)=>xtMakeCopy(...a),value:xtCopyValue,fair:xtFairRaw,mini:xMiniT,design:'xtdesign',cg:'xt',pop:()=>G.xpop,clear:k=>xTfvClear(k),npc:()=>G.npcs.filter(isXtNPC),ids:'_npcXtIds'},
    br:{id:'br',name:'Broken Reach',world:()=>G.brg,table:()=>G.brc,sets:t=>brReleasedSets(t),def:brSetDef,key:brKey,D:brD,inPrint:brInPrint,msrp:BR_MSRP,make:(...a)=>brMakeCopy(...a),value:brCopyValue,fair:brFairRaw,mini:bMiniT,design:'brdesign',cg:'br',pop:()=>G.bpop,clear:k=>brFvClear(k),npc:()=>G.npcs.filter(isBrNPC),ids:'_npcBrIds'}
  };
  const round=x=>Math.round(x*100)/100;
  const ready=()=>G&&G.tcg&&G.xtg&&G.brg;
  const profile=id=>profiles.find(p=>p.id===id);
  const franchise=k=>({T:'wk',X:'xt',B:'br'})[String(k)[0]];
  const getCopy=(g,id)=>adapters[g]&&adapters[g].table()[id];
  const random=(s,t)=>mkRng(hsh('retail:'+G.seed+':'+s+':'+t));
  const loc=id=>ensure().locations[id];
  const sku=(s,g,n,f,t)=>s.stock[adapters[g].key(n,0,f)]||(s.stock[adapters[g].key(n,0,f)]={g,n,f,q:0,refs:[],ema:null,born:t,lastSale:t,received:0,sold:0,orders:0,clearance:false});
  function demand(p,g,n,t){
    const a=adapters[g],age=Math.max(0,t-a.def(n).rel);
    // A launch surge fades; recent demand then drives each location's replenishment.
    const affinity=0.85+(hsh(p.id+g)%36)/100;
    return p.traffic*affinity*(0.16+4.8*Math.exp(-age/28))*(p.kind==='big'?1:0.65);
  }
  function sealedPrice(id,x){
    const p=profile(id),a=adapters[x.g],age=G.day-a.def(x.n).rel;
    const base=a.msrp[x.f];
    if(p.kind==='big'&&(x.clearance||!a.inPrint(x.n,G.day)))return round(base*0.72);
    if (x.refs.length || !a.inPrint(x.n,G.day)) return round(Math.max(base*0.8,a.fair(a.key(x.n,0,x.f))*(p.kind==='big'?1:1.06)));
    const cut=p.kind==='big'?(x.clearance?0.72:age>60&&x.q>Math.max(6,(x.ema||0)*18)?0.88:1):1;
    return round(base*p.markup*cut);
  }
  function sync(){
    // Existing price models read these aggregates to anchor sealed value to real shelf supply.
    for (const a of Object.values(adapters)){
      const old=a.world().shop||{},out={};
      for (const s of Object.values(G.retail.locations)) for (const x of Object.values(s.stock)) if (x.g===a.id){
        const z=out[x.n]||(out[x.n]={pack:0,box:0,so:old[x.n]?old[x.n].so:1,sop:old[x.n]?old[x.n].sop:1}); z[x.f==='P'?'pack':'box']+=x.q;
      }
      a.world().shop=out;
    }
  }
  function takeFromCollector(s,g,c,t){
    const a=adapters[g],p=profile(s.id),v=a.value(c),cost=round(v*(p.buy||0.55));
    if (cost>s.cash || c.o<=0 || c.l || c.g<0) return false;
    const seller=NPC(c.o); if (!seller) return false;
    s.cash=round(s.cash-cost); seller.cash=round(seller.cash+cost);
    c.o=-2; c.rs=s.id;
    // NPC grading samples this pool; a shop's raw cards must not be graded behind its back.
    if(G[a.ids])G[a.ids]=G[a.ids].filter(id=>id!==c.id);
    if (a.D(c.k).sealed){ const d=a.D(c.k),x=sku(s,g,d.set,d.v,t); x.refs.push(c.id); x.q++; x.received++; }
    else s.singles.push({g,id:c.id});
    return true;
  }
  function accepts(p,g,c){
    const a=adapters[g],d=a.D(c.k),v=a.value(c);
    if (p.kind!=='local'||p.singles==='none'||d.sealed||c.g<0) return false;
    if (p.singles==='premium') return c.g>0?v>=15:v>=20&&condLabel(c.c)==='NM';
    if (p.singles==='budget') return c.g===0&&v>=0.10&&v<=30;
    if (p.singles==='play') return c.g===0&&v>=0.25&&v<=60;
    return v>=0.25&&v<=300;
  }
  function acquire(s,t,initial){
    const p=profile(s.id); if (p.kind!=='local') return;
    const r=random(s.id+':buying',t),target=p.caseCap-s.singles.length;
    // Search a bounded sample of real, unlisted collector copies. No conjured grails or slabs.
    let need=Math.min(target,initial?p.caseCap:Math.max(2,Math.ceil(p.caseCap*0.09)));
    const perGame=Math.max(1,Math.ceil(need/3));
    const pools=Object.values(adapters).map(a=>[a,Object.values(a.table()).filter(c=>c.o>0&&!c.l&&c.g>=0)]);
    for (const [a,copies] of pools){
      if (!copies.length) continue;
      const quota=Math.max(0,Math.ceil(p.caseCap/3)-s.singles.filter(ref=>ref.g===a.id).length);
      let got=0;
      for (let i=0;i<(initial?1800:350);i++){
        const c=copies[Math.floor(r()*copies.length)]; if (!c||c.o<=0||c.l) continue;
        if (need>0&&got<Math.min(perGame,quota)&&accepts(p,a.id,c)&&takeFromCollector(s,a.id,c,t)){ need--; got++; }
        // Historical sealed is transferred from actual owners, never reprinted or regenerated.
        else if ((initial||r()<0.04)&&a.D(c.k).sealed&&!a.inPrint(a.D(c.k).set,t)&&Object.values(s.stock).reduce((n,x)=>n+x.refs.length,0)<12){
          takeFromCollector(s,a.id,c,t);
        }
        if (got>=Math.min(perGame,quota)&&!initial&&p.singles!=='none') break;
      }
    }
  }
  function order(s,x,t,initial){
    const p=profile(s.id),a=adapters[x.g]; if (!a.inPrint(x.n,t)||a.def(x.n).rel>t) return;
    const age=t-a.def(x.n).rel,forecast=demand(p,x.g,x.n,t)*(x.f==='B'?0.055:1);
    const rate=x.ema==null?forecast:0.65*x.ema+0.35*forecast;
    if (p.kind==='big'&&age>100&&rate<(x.f==='B'?0.07:0.65)){ x.clearance=true; return; }
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
        G.retail.locations[p.id].singles.push({g:a.id,id:c.id});
      }
      if (source.lgs){
        const s=G.retail.locations[({wk:'tidepool',xt:'lantern',br:'cargo'})[a.id]];
        const n=a.sets(t).filter(n=>a.inPrint(n,t)).pop();
        if (n) for (const f of ['P','B']){ const x=sku(s,a.id,n,f,t),q=Math.max(0,source.lgs[f==='P'?'pack':'box']||0); x.q+=q; x.received+=q; }
        source.lgs.pack=source.lgs.box=0; source.lgs.cs=[];
      }
    }
  }
  function ensure(){
    if (!ready()) return null;
    if (G.retail&&G.retail.v===1) return G.retail;
    const sources={}; for (const a of Object.values(adapters)) sources[a.id]={shop:a.world().shop,lgs:a.world().lgs,cs:(a.world().lgs&&a.world().lgs.cs||[]).slice()};
    G.retail={v:1,last:G.day,locations:{}};
    for (const p of profiles) G.retail.locations[p.id]={id:p.id,cash:p.capital,stock:{},singles:[],spent:0,revenue:0,visit:null};
    migrateStock(sources,G.day);
    for (const p of profiles){ const s=G.retail.locations[p.id]; for (const a of Object.values(adapters)) for (const n of a.sets(G.day).filter(n=>a.inPrint(n,G.day))) for (const f of ['P','B']) order(s,sku(s,a.id,n,f,G.day),G.day,true); acquire(s,G.day,true); }
    sync(); return G.retail;
  }
  function giveNpc(g,c,r,price=0){
    const a=adapters[g],pool=a.npc().filter(n=>n.cash>=price); if (!pool.length) return false;
    const n=pool[Math.floor(r()*pool.length)]; n.cash=round(n.cash-price); c.o=n.id; delete c.rs;
    const ids=G[a.ids]=G[a.ids]||[];if(!ids.includes(c.id))ids.push(c.id);return true;
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
          const wants=Math.max(0,Math.floor(demand(p,x.g,x.n,d)*(x.f==='B'?0.055:1)*(0.5+r())));
          // Low-volume shops still sell occasionally; vintage is intentionally a long tail.
          const q=Math.min(x.q,wants+(r()<(x.f==='B'?0.025:0.12)?1:0));
          if (q){ x.q-=q; x.sold+=q; x.lastSale=d; s.cash=round(s.cash+q*sealedPrice(p.id,x)); s.revenue=round(s.revenue+q*sealedPrice(p.id,x));
            for(let i=0;i<q&&x.refs.length;i++){ const c=getCopy(x.g,x.refs.pop()); if(c) giveNpc(x.g,c,r); }
          }
          const observed=q+(x.playerSales||0)+Math.min(Math.max(0,wants-q),2)*0.20;
          x.playerSales=0;
          x.ema=x.ema==null?observed:x.ema*0.87+observed*0.13;
          if(p.kind==='big'&&age>70&&d-x.lastSale>21) x.clearance=true;
          if(!x.q&&!a.inPrint(x.n,d)) delete s.stock[key];
        }
        s.singles=s.singles.filter(ref=>{ const c=getCopy(ref.g,ref.id); if(!c||c.o!==-2||c.rs!==p.id) return false; if(r()<(p.singles==='premium'?0.003:0.009)*p.traffic){ const price=singlePrice(p.id,ref.g,c); if(!giveNpc(ref.g,c,r,price))return true; s.cash=round(s.cash+price); s.revenue=round(s.revenue+price); return false; } return true; });
        if(dowOf(d)===p.day) acquire(s,d,false);
      }
      w.last=d;
    }
    sync();
  }
  function singlePrice(id,g,c){ const p=profile(id); return round(Math.max(p.singles==='budget'?0.15:0.35,adapters[g].value(c)*(p.singles==='premium'?1.20:p.singles==='budget'?1.12:1.25))); }
  function sealedBuy(id,key,q){
    const w=ensure(),s=w&&w.locations[id],x=s&&s.stock[key]; q=Number(q);
    if(!Number.isSafeInteger(q)||q<1||q>100) return 'Choose a whole quantity from 1 to 100.';
    if(!x||x.q<q) return 'Not enough in stock at this location.';
    const a=adapters[x.g],price=sealedPrice(id,x),total=round(price*q);
    if(G.player.cash<total) return 'You need '+money(total,true)+'.';
    G.player.cash=round(G.player.cash-total); G.player.bought=round(G.player.bought+total); s.cash=round(s.cash+total); s.revenue=round(s.revenue+total);
    for(let i=0;i<q;i++){
      let c=x.refs.length?getCopy(x.g,x.refs.pop()):null;
      if(!c)c=a.make(key,0,null,'shop'); c.o=0; delete c.rs; c.a=[G.day,'bought',price,profile(id).name]; c.nw=1;
      c.h=(c.h||[]).concat([[G.day,'Bought at '+profile(id).name,price,'']]); c.pv={d:G.day,v:round(a.value(c)),n:''};
    }
    x.q-=q; x.sold+=q; x.playerSales=(x.playerSales||0)+q; x.lastSale=G.day; UI.cg=a.cg; sync(); return null;
  }
  function singleBuy(id,g,cid){
    const w=ensure(),s=w&&w.locations[id],a=adapters[g],c=a&&a.table()[cid];
    if(!s||!c||c.o!==-2||c.rs!==id||!s.singles.some(x=>x.g===g&&x.id===+cid)) return 'That copy has already sold.';
    const p=singlePrice(id,g,c); if(G.player.cash<p)return 'You need '+money(p,true)+'.';
    G.player.cash=round(G.player.cash-p);G.player.bought=round(G.player.bought+p);s.cash=round(s.cash+p);s.revenue=round(s.revenue+p);
    c.o=0;delete c.rs;c.nw=1;c.a=[G.day,'bought',p,profile(id).name];c.h=(c.h||[]).concat([[G.day,'Bought at '+profile(id).name,p,'']]);c.pv={d:G.day,v:round(a.value(c)),n:''};
    s.singles=s.singles.filter(x=>!(x.g===g&&x.id===+cid));UI.cg=a.cg;return null;
  }
  function offer(id,g,c){ const p=profile(id); return p&&adapters[g]&&c&&accepts(p,g,c)?Math.floor(adapters[g].value(c)*p.buy*100)/100:0; }
  function sell(id,g,cid){
    const w=ensure(),s=w&&w.locations[id],a=adapters[g],c=a&&a.table()[cid],p=profile(id);
    if(!s||!c||c.o!==0||c.l||c.g<0) return 'That copy is not available to sell.';
    const price=offer(id,g,c); if(price<0.05)return 'This shop passes on that card.';
    if(s.singles.length>=p.caseCap)return 'The case is full. Try another shop.';
    if(price>s.cash)return 'The shop does not have enough buying cash today.';
    G.player.cash=round(G.player.cash+price);G.player.sold=round((G.player.sold||0)+price);s.cash=round(s.cash-price);
    a.world().bl=(a.world().bl||0)+1;c.o=-2;c.rs=id;c.h=(c.h||[]).concat([[G.day,'Sold to '+p.name,price,'']]);s.singles.push({g,id:c.id});return null;
  }
  function where(g,key){
    const w=ensure();if(!w)return [];
    const out=[];
    for(const p of profiles){ const s=w.locations[p.id],x=s.stock[key];
      if(x&&x.q>0)out.push({w:p.name,p:sealedPrice(p.id,x),act:'rsealed',a:p.id+'~'+key+'~1',note:'sealed · '+p.area});
      for(const ref of s.singles){if(ref.g!==g)continue;const c=getCopy(g,ref.id);if(!c||c.k!==key||c.o!==-2||c.rs!==p.id)continue;
        out.push({w:p.name,p:singlePrice(p.id,g,c),act:'rsingle',a:p.id+'~'+g+'~'+c.id,note:c.g>0?'GCS '+c.g:COND_LABN[condLabel(c.c)]});
      }
    }return out;
  }
  function visit(id){ const s=loc(id);if(!s)return;const stock=Object.values(s.stock).filter(x=>x.q>0);s.visit={day:G.day,sealed:stock.reduce((n,x)=>n+x.q,0),singles:s.singles.length}; }
  function nextDelivery(id){ let d=G.day+1;while(dowOf(d)!==profile(id).day)d++;return d; }
  function summary(id){const s=loc(id);return {sealed:Object.values(s.stock).reduce((v,x)=>v+x.q,0),singles:s.singles.length};}
  const button=(act,a,t,disabled)=>`<button class="btn sm" data-act="${act}" data-a="${esc(a)}" ${disabled?'disabled':''}>${t}</button>`;
  function directory(g){
    ensure(); const f=UI.retailType||'all';
    return `<div class="retail-intro"><div><div class="retail-eyebrow">YOUR LOCAL COLLECTING CIRCUIT</div><h2>Find your next favourite shop.</h2><p>Five independent shops. Seven big-box locations. One world of cards.</p></div>${button('rvisit','lantern','Visit The Lantern Room')}</div><div class="chips retail-filters">${[['all','All locations'],['local','Local card shops'],['big','Big-box retail']].map(([k,n])=>`<button class="chip ${f===k?'on':''}" data-act="rtype" data-a="${k}">${n}</button>`).join('')}</div><div class="retail-directory">${profiles.filter(p=>f==='all'||p.kind===f).map(p=>{const s=loc(p.id),v=s.visit;return `<article class="retail-card" style="--store-ink:${p.ink}"><div class="retail-card-top"><span>${p.kind==='big'?'BIG-BOX RETAIL':'INDEPENDENT CARD SHOP'}</span><span>${esc(p.area)}</span></div><h3>${esc(p.name)}</h3><b class="retail-tag">${esc(p.tag)}</b><p>${esc(p.text)}</p><div class="retail-card-foot"><small>${v?'Last visited '+fmtDate(v.day,true)+' · saw '+v.sealed+' sealed and '+v.singles+' singles':'Not visited yet · stock varies by location'}</small>${button('rvisit',p.id,'Visit shop')}</div></article>`;}).join('')}</div><div class="panel retail-online"><h3>Online singles specialists</h3><p class="small muted">Looking for a particular print? Online catalogues share the same wallet and collection.</p><div class="formrow">${[['wk','Kinvault'],['xt','Saltmarket'],['br','Waypoint Singles']].map(([k,n])=>button('ronline',k,n)).join('')}</div></div>`;
  }
  function inventory(id,g){
    const p=profile(id),s=loc(id),search=(UI.retailQuery||'').trim().toLowerCase(),mode=UI.retailMode||'sealed',filter=UI.retailGame||g||'all';
    const match=(gg,d)=>(filter==='all'||filter===gg)&&(!search||[d.title,d.def.name,adapters[gg].name].join(' ').toLowerCase().includes(search));
    const sealed=Object.entries(s.stock).filter(([k,x])=>x.q>0&&match(x.g,adapters[x.g].D(k)));
    const singles=s.singles.map(ref=>({ref,c:getCopy(ref.g,ref.id)})).filter(({ref,c})=>c&&c.o===-2&&c.rs===id&&match(ref.g,adapters[ref.g].D(c.k))).sort((a,b)=>p.singles==='budget'?singlePrice(id,a.ref.g,a.c)-singlePrice(id,b.ref.g,b.c):singlePrice(id,b.ref.g,b.c)-singlePrice(id,a.ref.g,a.c));
    const mine=[];if(mode==='sell')for(const [gg,a]of Object.entries(adapters))for(const c of a.table()?Object.values(a.table()):[])if(c.o===0&&!c.l&&c.g>=0&&match(gg,a.D(c.k))){const price=offer(id,gg,c);if(price>=0.05)mine.push({gg,c,price});}
    const rows=mode==='sealed'?sealed:mode==='singles'?singles:mine.sort((a,b)=>b.price-a.price);
    const pages=Math.max(1,Math.ceil(rows.length/18)),pg=Math.min(UI.retailPage||0,pages-1),visible=rows.slice(pg*18,pg*18+18);
    let body='';
    if(mode==='sealed')body=visible.map(([k,x])=>{const a=adapters[x.g],d=a.D(k),price=sealedPrice(id,x),desc=x.refs.length?'From a collection · finite old stock':x.clearance?'Clearance · no new order planned':a.inPrint(x.n,G.day)?'Current print run':'Out of print · last stock';return `<div class="row retail-product">${a.mini({k,g:0,c:[100,100,100,100],id:0})}<div class="rt"><b>${esc(d.title)}</b><span>${a.name} · ${desc}</span><span>${x.q} in stock · <strong>${money(price,true)}</strong> each</span></div><div class="retail-actions">${button('rsealed',id+'~'+k+'~1','Buy one',G.player.cash<price)}${x.f==='P'?button('rsealed',id+'~'+k+'~5','Buy five',x.q<5||G.player.cash<price*5):''}</div></div>`;}).join('');
    else if(mode==='singles')body=visible.map(({ref,c})=>{const a=adapters[ref.g],d=a.D(c.k),price=singlePrice(id,ref.g,c);return `<div class="row retail-product"><button class="mini" data-act="${a.design}" data-a="${esc(c.k)}">${a.mini(c)}</button><div class="rt"><b>${esc(d.title)}</b><span>${a.name} · ${c.g>0?'GCS '+c.g:COND_LABN[condLabel(c.c)]} · ${esc(d.def.name)}</span><span>${money(price,true)} · one copy</span></div>${button('rsingle',id+'~'+ref.g+'~'+c.id,'Buy',G.player.cash<price)}</div>`;}).join('');
    else body=visible.map(({gg,c,price})=>{const a=adapters[gg],d=a.D(c.k);return `<div class="row retail-product">${a.mini(c)}<div class="rt"><b>${esc(d.title)}</b><span>${a.name} · ${c.g>0?'GCS '+c.g:COND_LABN[condLabel(c.c)]}</span><span>Cash offer ${money(price,true)}</span></div><button class="btn sm" data-act="rsell" data-a="${id}~${gg}~${c.id}" data-confirm="Sell for ${money(price,true)}" ${price>s.cash||s.singles.length>=p.caseCap?'disabled':''}>Sell</button></div>`;}).join('');
    return `<div class="panel retail-inventory"><div class="chips">${[['sealed','Packs & boxes'],...(p.singles==='none'?[]:[['singles','Singles & slabs'],['sell','Sell to this shop']])].map(([k,n])=>`<button class="chip ${mode===k?'on':''}" data-act="rmode" data-a="${k}">${n}</button>`).join('')}</div><div class="chips">${[['all','All games'],['wk','Wildkin'],['xt','Tidemark'],['br','Broken Reach']].map(([k,n])=>`<button class="chip ${filter===k?'on':''}" data-act="rgame" data-a="${k}">${n}</button>`).join('')}</div><input type="search" aria-label="Search store inventory" placeholder="Search cards, sets or games" value="${esc(UI.retailQuery||'')}" data-retail-search><div class="small muted retail-result-count">${rows.length} ${mode==='sell'?'cards this shop would buy':'products'}${mode==='sell'?' · buying budget '+money(s.cash,true):''}</div><div class="rows">${body||'<div class="empty">'+(mode==='sell'?'Nothing here matches this shop’s buying preferences. Try a different specialist.':'Nothing matches today. Try another game, clear the search, or visit another location.')+'</div>'}</div>${pages>1?`<div class="formrow">${button('rpage',String(Math.max(0,pg-1)),'Previous',pg===0)}<span class="small">Page ${pg+1} of ${pages}</span>${button('rpage',String(pg+1),'Next',pg===pages-1)}</div>`:''}</div>`;
  }
  function view(g){
    if(!ready())return '<div class="panel">Opening the stores…</div>';ensure();
    const id=UI.retailLocation,p=id&&profile(id);
    const heading=`<div class="pagetitle"><h1>Stores</h1><span class="small muted">${fmtDate(G.day,true)}</span></div>`;
    if(UI.retailOnline){const gg=UI.retailOnline;return heading+button('rback','','All locations')+({wk:tcKvV,xt:xtKvV,br:brKvV}[gg])();}
    if(!p)return heading+directory(g);
    const s=loc(id),sum=summary(id);
    return heading+`<div class="retail-store-head" style="--store-ink:${p.ink}">${button('rback','','All locations')}<div class="retail-eyebrow">${esc(p.area)} · ${p.kind==='big'?'BIG-BOX RETAIL':esc(p.owner)+'’S COUNTER'}</div><h2>${esc(p.name)}</h2><b>${esc(p.tag)}</b><div class="retail-store-facts"><span>${sum.sealed} sealed items</span><span>${p.singles==='none'?'No singles or buylist':sum.singles+' singles & slabs'}</span><span>Next order review ${fmtDate(nextDelivery(id),true)}</span></div><details><summary>About this shop & orders</summary><p>${esc(p.text)}</p><p class="small muted">${p.kind==='big'?'Orders follow recent sales. Slow stock is marked down and eventually cleared.':'Small orders, patient shelves. Older stock stays until someone buys it; singles come from collectors.'}</p></details></div>`+inventory(id,g);
  }
  function done(error,ok){if(error){showToast(error);return;}if(UI.retailLocation)visit(UI.retailLocation);showToast(ok,true);refreshSheet();render(true);queueSave();}
  ACT.rvisit=id=>{if(!profile(id))return;UI.retailLocation=id;UI.retailOnline=null;UI.retailMode='sealed';UI.retailPage=0;UI.retailQuery='';UI.tab='stores';visit(id);render();queueSave();window.scrollTo(0,0);};
  ACT.rback=()=>{UI.retailLocation=null;UI.retailOnline=null;render(true);};
  ACT.rtype=k=>{UI.retailType=k;render(true);};
  ACT.rmode=k=>{if(!['sealed','singles','sell'].includes(k))return;UI.retailMode=k;UI.retailPage=0;render(true);};
  ACT.rgame=k=>{if(!['all','wk','xt','br'].includes(k))return;UI.retailGame=k;UI.retailPage=0;render(true);};
  ACT.rpage=k=>{UI.retailPage=Math.max(0,Number(k)||0);render(true);};
  ACT.ronline=g=>{if(!adapters[g])return;UI.tab='stores';UI.retailOnline=g;UI.retailLocation=null;render();};
  ACT.rsealed=a=>{const[id,k,q]=a.split('~');if(!profile(id))return;done(sealedBuy(id,k,+q),'Bought at '+profile(id).name+'. Find it in Collection.');};
  ACT.rsingle=a=>{const[id,g,c]=a.split('~');if(!profile(id))return;done(singleBuy(id,g,+c),'Bought at '+profile(id).name+'. Find it in Collection.');};
  ACT.rsell=(a,el)=>{if(el&&!armed(el))return;const[id,g,c]=a.split('~');if(!profile(id))return;done(sell(id,g,+c),'Sold to '+profile(id).name+'.');};
  let searchTimer;
  document.addEventListener('input',e=>{if(!e.target.matches('[data-retail-search]'))return;const value=e.target.value;clearTimeout(searchTimer);searchTimer=setTimeout(()=>{UI.retailQuery=value;UI.retailPage=0;render(true);const field=document.querySelector('[data-retail-search]');if(field){field.focus();}},180);});
  // Store views share the same world, even when reached through a franchise tab.
  VIEWS.stores=()=>view();ICONS.stores=ICONS.shop;
  tcShopV=()=>view('wk')+tcSealedPanel();xtShopV=()=>view('xt')+xtSealedPanel()+xtHistoryPanel();brShopV=()=>view('br')+brSealedPanel();
  // Keep online specialists; replace only the now-retired per-franchise physical shops.
  for(const [g,name]of [['wk','tcWhere'],['xt','xtWhere'],['br','brWhere']]){
    const previous={wk:tcWhere,xt:xtWhere,br:brWhere}[g];
    const wrapped=k=>previous(k).filter(x=>!['lgssingle','xlgssingle','blgssingle'].includes(x.act)).concat(where(g,k)).sort((a,b)=>a.p-b.p);
    if(g==='wk')tcWhere=wrapped;else if(g==='xt')xtWhere=wrapped;else brWhere=wrapped;
  }
  const oldNew=newGame;newGame=async function(){const r=await oldNew.apply(this,arguments);ensure();return r;};
  const oldAdvance=advanceDay;advanceDay=function(){ensure();oldAdvance.apply(this,arguments);day(G.day);};
  const oldMigrate=migrate;migrate=function(){oldMigrate.apply(this,arguments);if(ready())ensure();};
  // A save can gain a franchise later. Its new copy table must not inherit stale references.
  function addLine(g){
    const a=adapters[g];if(!G.retail)return;
    for(const p of profiles){const s=G.retail.locations[p.id];
      s.singles=s.singles.filter(r=>r.g!==g);
      for(const [k,x]of Object.entries(s.stock))if(x.g===g)delete s.stock[k];
      for(const n of a.sets(G.day).filter(n=>a.inPrint(n,G.day)))for(const f of ['P','B'])order(s,sku(s,g,n,f,G.day),G.day,true);
      acquire(s,G.day,false);
    }sync();
  }
  const oldUpgradeBr=upgradeBr;upgradeBr=async function(){const had=!!G.brg;await oldUpgradeBr.apply(this,arguments);if(!had&&G.retail)addLine('br');};
  const oldUpgradeXt=upgradeXt;upgradeXt=async function(){const had=!!G.xtg;await oldUpgradeXt.apply(this,arguments);if(!had&&G.retail)addLine('xt');};
  // Legacy physical-shop ticks stop once migrated; prices still read the synchronized totals.
  for(const n of ['tcShopWeek','tcShopDay','tcLgsWeek','tcLgsDay','tcLgsCase','xtShopWeek','xtShopDay','xtLgsWeek','xtLgsDay','xtLgsCase','brShopWeek','brShopDay','brLgsWeek','brLgsDay','brLgsCase']){
    // These are function declarations in the concatenated script (also window properties).
    const old=window[n];window[n]=function(){if(G&&G.retail)return;return old.apply(this,arguments);};
  }
  // Existing callers (scenario tests, preorder tooling) buy from an actual stocked location.
  function legacyBuy(g,n,f,q,local){ensure();const key=adapters[g].key(n,0,f);const p=profiles.find(p=>(local?p.kind==='local':p.kind==='big')&&loc(p.id).stock[key]&&loc(p.id).stock[key].q>=q);return p?sealedBuy(p.id,key,q):'Not enough in stock.';}
  tcBuySealed=(n,f,q)=>legacyBuy('wk',n,f,q,false);xtBuySealed=(n,f,q)=>legacyBuy('xt',n,f,q,false);brBuySealed=(n,f,q)=>legacyBuy('br',n,f,q,false);
  tcLgsBuySealed=(f,q)=>legacyBuy('wk',tcNewestSet(G.day),f,q,true);xtLgsBuySealed=(f,q)=>legacyBuy('xt',TM_TT,f,q,true);brLgsBuySealed=(f,q)=>legacyBuy('br',1,f,q,true);
  return {profiles,adapters,ensure,day,where,profile,summary,visit,nextDelivery,sealedPrice,singlePrice,sealedBuy,singleBuy,offer,sell,order,demand,accepts,view};
})();
