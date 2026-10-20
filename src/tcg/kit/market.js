// ===================== CARD KIT: THE SHARED MARKET FUNCTIONS =====================
// What every card game does the same way once a line's own prices exist: make a copy, value it, estimate a sale, grade it, hand copies to collectors,
// list them on the marketplace and move them between owners. cardMarket(L) returns these functions for one line; a line keeps its own prices
// (fairRaw), collectors' taste (interest), pack and sealed rules, seed and release market in its own files. Moved verbatim from the Wildkin and
// Tidemark forks, which were identical apart from these names (design/shared-tcg-architecture.md, step 3).
//   L.kind/L.keyPrefix  item letter and print-key letter     L.flag/L.cpf  the item's marker field and its copy field ('tcg'/'tc', 'xtg'/'xt')
//   L.copies() nextId() pop() world()  the copy table, a new id, the grading population, the line's world state (null before it exists)
//   L.subs L.ids  G.player key of the grading queue, G key of the collectors' copies    L.D(key) L.fairRaw(key) L.interest(n,item) L.label(key)
//   optional: L.cullSkip(copy) true for copies the clean-up must keep (scarce history)   L.culled(copy) called for each copy it removes
//   optional: L.gradeScarce(key,g,pop,print) the premium for a scarce grade     L.keep(n,copy,value) the chance a collector keeps a copy instead of listing it
//   L.fvClear(key) L.scale (grade multiplier by rarity) L.raror (rarity order) L.econ (economy strategies) L.isNPC(n) L.npcFlag
function cardMarket(L){
  const M={};
  M.makeCopy=function(key, owner, acq, src, rng){
    const r=rng||R; const d=L.D(key); const cp={ id:L.nextId(), k:key, o:owner, g:0 };
    if (d.sealed) cp.c=[100,100,100,100]; else { const age=Math.max(0,(G.day-d.def.rel)/365); cp.c = L.econ.condition.sample(r, src, age); }
    if (acq) cp.a=acq; L.copies()[cp.id]=cp; return cp;
  };
  M.fair=function(key, g){ const raw=L.fairRaw(key); if (!(g>0)) return raw; const d=L.D(key); if (d.sealed) return raw; const pop=L.pop()[key]; const scarce= L.gradeScarce? L.gradeScarce(key,g,pop,d) : pop&&g===10&&pop[10]<4&&(L.raror[d.rar]>=2)? 1.12 : 1; return Math.max(raw*cardGradeMult(L.scale,d.rar,g)*scarce, g>=10?4: g>=9?2.2: g>=8?1.2:0.7); };
  M.copyValue=function(cp){ if (cp.g>0) return M.fair(cp.k, cp.g); const raw=L.fairRaw(cp.k); const d=L.D(cp.k); return d.sealed? raw : raw*L.econ.condition.price(cp.c, d.card, d); };
  M.sales=function(key,g){ return (G.sales[key]||[]).filter(s=>(s[2]||0)===(g||0)); };
  M.est=function(key, g, cp){
    const fv= cp? M.copyValue(cp) : M.fair(key,g||0); const same=M.sales(key, cp?(cp.g>0?cp.g:0):(g||0)).filter(s=>s[0]>G.day-120); const n=same.length;
    const center= n? 0.45*fv+0.55*median(same.slice(0,6).map(s=>s[1])) : fv; const w=0.1+0.42/Math.sqrt(n+1);
    const lo=nicePrice(Math.max(0.05,center*(1-w*0.75))), hi=nicePrice(Math.max(0.1,center*(1+w))); return {lo, hi:Math.max(hi,lo), n};
  };
  M.heat=function(cp){ const d=L.D(cp.k); if (d.sealed) return 0.9+0.8*Math.exp(-(G.day-d.def.rel)/45); const u=(L.world().usage[d.cid]||0)/4, hy=L.world().hy[d.cid]||0; return 0.4+1.2*u+hy+(L.raror[d.rar]>=3?0.5:0)+0.7*Math.exp(-(G.day-d.def.rel)/21); };
  // ---------- grading ----------
  M.gradeCopy=function(cp){ const g=gradeOf(cp); cp.gt=(cp.gt||0)+1; cp.g=g; cp.cert=10000000+Math.floor(R()*89999999); const pp=L.pop(); const p=pp[cp.k]||(pp[cp.k]=Array(11).fill(0)); p[g]++; L.fvClear(cp.k); return g; };
  M.submitGrade=function(id, tier){ const T=GRADE_TIERS.find(x=>x.id===tier); const cp=L.copies()[id]; if (!cp||cp.o!==0||cp.g!==0||cp.l||L.D(cp.k).sealed) return 'That card can\'t be submitted right now.'; if (G.player.cash<T.fee) return 'You need '+money(T.fee)+'.'; G.player.cash-=T.fee; G.player.fees+=T.fee; cp.g=-1; (G.player[L.subs]=G.player[L.subs]||[]).push({id:G.nextLid++,cid:id,tier,t0:G.day,t1:G.day+T.days,fee:T.fee,raw:Math.round(M.copyValue(cp)*100)/100}); (cp.h=cp.h||[]).push([G.day,'Sent to GCS ('+T.n+')',T.fee,'']); return null; };
  M.gradingTick=function(t){ const subs=G.player[L.subs]||[]; if (!subs.length) return; for (const s of subs.filter(x=>x.t1<=t)){ const cp=L.copies()[s.cid]; if (!cp) continue; const g=M.gradeCopy(cp); (G.player.rv=G.player.rv||[]).push({k:L.kind,id:cp.id,g,raw:s.raw||0,fee:s.fee||0,t}); (cp.h=cp.h||[]).push([t,'Graded GCS '+g+' '+GRADE_NAMES[g],0,'']); toast('Back from GCS: '+L.D(cp.k).title+' is a '+g, g>=9); } G.player[L.subs]=subs.filter(x=>x.t1>t); };
  // ---------- collectors ----------
  M.give=function(key, src){ const cp=M.makeCopy(key,0,null,src||'npc'); const it={[L.cpf]:cp,v:M.copyValue(cp)}; const pool=npcPool({[L.flag]:1}); const c=[pick(pool),pick(pool),pick(pool),pick(pool)]; cp.o=c.sort((a,b)=>L.interest(b,it)-L.interest(a,it))[0].id; cp.a=[G.day,'held',0,'']; (G[L.ids]=G[L.ids]||[]).push(cp.id); return cp; };
  M.npcList=function(){
    const ids=G[L.ids]; if (!ids||!ids.length) return; let cp=null; const T=L.copies();
    for (let tries=0; tries<14 && !cp; tries++){ const c=T[ids[Math.floor(R()*ids.length)]]; if (!c||c.o<=0||c.l||c.g<0) continue; const v=M.copyValue(c); if (v<0.25) continue; const n=NPC(c.o); if (!n) continue; const keep= L.keep? L.keep(n,c,v) : L.interest(n,{[L.cpf]:c,v})>1.1? 0.7 : 0.12; if (R()<keep) continue; cp=c; }
    if (!cp) return; const n=NPC(cp.o); const v=M.copyValue(cp); const sv=v*Math.exp(gauss()*n.kn);
    if (R()<0.25 && v>1.5) createListing(L.kind,cp.id,n.id,'auc',Math.max(0.5,nicePrice(sv*rf(0.3,0.8))),pick([3,5,5,7]),false);
    else { const mult=L.listMult(n); createListing(L.kind,cp.id,n.id,'bin',Math.max(0.25,nicePrice(sv*mult)),0,R()<0.6); }
  };
  M.marketDay=function(t){
    if (!L.world() || !G[L.ids]) return; const nL=G.lst.filter(l=>l.it===L.kind&&l.sel>0).length; const k=clamp(Math.round((300-nL)/5)+ri(3,8),2,40); for (let i=0;i<k;i++) M.npcList();
    M.gradingTick(t); if (t%10===0) M.cull();
    if (R()<0.3){ for (const id of G[L.ids].slice(-300)){ const cp=L.copies()[id]; if (!cp||cp.g||cp.l||L.D(cp.k).sealed) continue; if (M.copyValue(cp)>25 && R()<0.1) M.gradeCopy(cp); } }
  };
  M.cull=function(){ const ids=G[L.ids]; if (!ids||ids.length<9000) return; const keep=[]; let drop=ids.length-7800; const T=L.copies(); for (const id of ids){ const c=T[id]; if (!c||c.o<=0){ continue; } if (drop>0 && !c.l && !c.g && c.o>0 && !(L.cullSkip&&L.cullSkip(c)) && M.copyValue(c)<0.6 && R()<0.7){ delete T[id]; drop--; if (L.culled) L.culled(c); continue; } keep.push(id); } G[L.ids]=keep; };
  // ---------- hooking into the shared market ----------
  M.installHooks=function(){
    const _interest=interest; interest=function(n,item){ if (item[L.flag]) return L.interest(n,item); if (L.isNPC(n)) return 0.03; return _interest(n,item); };
    const _itemOf=itemOf; itemOf=function(l){ if (l.it===L.kind){ const cp=L.copies()[l.ref]; return { [L.flag]:true, [L.cpf]:cp, key:cp.k, v:M.copyValue(cp), heat:M.heat(cp) }; } return _itemOf(l); };
    const _createListing=createListing; createListing=function(it,ref,seller,ty,price,dur,off){ if (it!==L.kind) return _createListing.apply(this,arguments);
      const l={ id:G.nextLid++, it, ref, sel:seller, ty, pr:Math.round(price*100)/100, st:G.day, en: ty==='auc'? G.day+dur : G.day+45, off:!!off, bids:[], cur:0, hist:[], offers:[] }; if (ty==='auc') l.cur=l.pr; G.lst.push(l); L.copies()[ref].l=l.id; return l; };
    const _removeListing=removeListing; removeListing=function(l){ if (l.it!==L.kind) return _removeListing(l); const i=G.lst.indexOf(l); if (i>=0) G.lst.splice(i,1); const c=L.copies()[l.ref]; if (c) delete c.l; };
    const _itemLabel=itemLabel; itemLabel=function(l){ if (l.it!==L.kind) return _itemLabel(l); const c=L.copies()[l.ref]; return L.label(c.k)+(c.g>0?' GCS '+c.g:''); };
    const _recordSale=recordSale; recordSale=function(key,price,g,buyer,seller){ if (key[0]!==L.keyPrefix) return _recordSale(key,price,g,buyer,seller);
      const a=G.sales[key]||(G.sales[key]=[]); a.unshift([G.day,price,g]); if (a.length>24) a.length=24; G.dp[key]=(G.dp[key]||0)+0.035; L.fvClear(key); if (price>=8||buyer===0||seller===0){ G.feed.unshift([G.day,key,price,g,buyer,seller]); if (G.feed.length>200) G.feed.length=200; } };
    const _transfer=transfer; transfer=function(l,buyer,price,how){ if (l.it!==L.kind) return _transfer(l,buyer,price,how);
      const seller=l.sel, item=itemOf(l), gross=Math.round(price*100)/100; if (buyer===0){ G.player.cash-=gross; G.player.bought+=gross; } else NPC(buyer).cash-=gross; const net=Math.round(gross*(1-FEE)*100)/100;
      if (seller===0){ G.player.cash+=net; G.player.sold+=gross; G.player.fees+=gross-net; } else NPC(seller).cash+=net;
      const c=item[L.cpf]; recordSale(item.key,gross,c.g>0?c.g:0,buyer,seller); c.o=buyer;
      if (buyer===0){ c.a=[G.day,how==='auc'?'won':'bought',gross,ownerName(seller)]; (c.h=c.h||[]).push([G.day,how==='auc'?'Won at auction':'Bought',gross,ownerName(seller)]); c.nw=1; c.pv={d:G.day,v:Math.round(item.v*100)/100,n:''}; }
      if (seller===0) (c.h=c.h||[]).push([G.day,'Sold',gross,ownerName(buyer)]); if (buyer>0 && G[L.ids] && seller===0) G[L.ids].push(c.id);
      removeListing(l); if (seller===0||buyer===0) toast((seller===0?'Sold ':'Bought ')+itemLabel({it:L.kind,ref:c.id})+' for '+money(gross)+(seller===0?' (you receive '+money(net)+')':'')); };
    const _playerList=playerList; playerList=function(it,ref,ty,price,dur,off){ if (it!==L.kind) return _playerList(it,ref,ty,price,dur,off); if (!(price>0)) return 'Enter a price.'; const o=L.copies()[ref]; if (!o||o.o!==0||o.l) return 'Not available to list.'; if (o.g<0) return 'That card is at the grader.'; createListing(L.kind,ref,0,ty,price,dur,off); G.player.listed++; return null; };
  };
  return M;
}
