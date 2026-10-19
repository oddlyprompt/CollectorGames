// Golden-test probe (runs inside the built tcg game, in the browser). It takes exact, deterministic snapshots of both card games: prices,
// pack rolls, world state, metagame, stores, screens, player flows, and saved games opened by the current code.
// The refactor must keep every snapshot bit-identical (tools/golden/golden.py). THE ONLY LINE-SPECIFIC CODE IS THE ADAPTER BELOW: when the refactor renames a
// function, update the adapter to call the new name; the snapshots it produces must not change.
window.GOLDEN=(function(){
  const SEED=20261019;
  const FNV=s=>{ let h=0x811c9dc5; for (let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,0x01000193)>>>0; } return h.toString(16).padStart(8,'0'); };
  const H=o=>FNV(JSON.stringify(o));
  // ---------------- adapter: the only place that knows function names ----------------
  const LINES={
    wk:{ id:'wk', sets:[1,2], key:(s,n,v)=>tcKey(s,n,v), keys:s=>tcAllKeys(s), cards:s=>tcSetCards(s), D:k=>tcD(k), fair:k=>tcFairRaw(k), fairG:(k,g)=>tcFair(k,g), ev:s=>tcPackEV(s), roll:(s,r)=>tcRollPack(s,r),
      released:()=>tcReleasedSets(G.day), copies:()=>G.tc, st:()=>G.tcg, mine:()=>myTc(), val:cp=>tcCopyValue(cp), est:(k,g,cp)=>tcEst(k,g,cp), buy:(s,f,q)=>tcBuySealed(s,f,q), open:id=>tcOpenSealed(id), openMany:ids=>tcOpenMany(ids),
      submit:id=>tcSubmitGrade(id,'std'), make:(k,src)=>tcMakeCopy(k,0,[G.day,'bought',1,'golden'],src||'shop'), list:(id,p,ty)=>playerList('t',id,ty,p,5,true), subs:()=>G.player.tsubs||[],
      lgs:()=>tcLgs(), lgsCase:()=>{ tcLgsCase(G.day,false); return tcLgs().cs; }, lgsPrice:x=>tcLgsPrice(x), lgsBuySealed:(f,q)=>tcLgsBuySealed(f,q), lgsBuySingle:id=>tcLgsBuySingle(id), lgsSell:id=>tcLgsSellTo(id), lgsOffer:cp=>tcLgsOffer(cp),
      kvStock:()=>tcKvStock(G.day), kvPrice:k=>tcKvPrice(k), kvBuy:k=>tcKvBuy(k), itemType:'t', npcPoolKey:'tcg',
      usage:()=>G.tcg.usage, label:cp=>tcLabel(cp.c), setDef:s=>tcSetDef(s), legal:()=>tcLegalSets(G.day),
      screens:{ set:s=>tcSetSheet(s).h, design:k=>tcDesignSheet(k).h, copy:id=>tcCopySheet(id).h, meta:()=>tcMetaV(), sets:()=>tcSetsV(), coll:()=>tcCollV(), retail:()=>{ UI.tstore='retail'; return tcShopV(); }, lgs:()=>{ UI.tstore='lgs'; return tcShopV(); }, kv:()=>{ UI.tstore='kv'; return tcShopV(); }, home:()=>{ const P=tcHomePanels(); return [P.next,P.meta,P.results,P.coll,P.goals,P.want,P.ban,P.hot,P.news].join(''); } },
      first:{ P:1, B:1 } },
    xt:{ id:'xt', sets:[1,2,5,10,15,20,25,28,30,31], key:(s,n,v)=>xtKey(s,n,v), keys:s=>xtAllKeys(s), cards:s=>xtSetCards(s), D:k=>xtD(k), fair:k=>xtFairRaw(k), fairG:(k,g)=>xtFair(k,g), ev:s=>xtPackEV(s), roll:(s,r)=>xtRollPack(s,r),
      released:()=>xtReleasedSets(G.day), copies:()=>G.xtc, st:()=>G.xtg, mine:()=>myXt(), val:cp=>xtCopyValue(cp), est:(k,g,cp)=>xtEst(k,g,cp), buy:(s,f,q)=>xtBuySealed(s,f,q), open:id=>xtOpenSealed(id), openMany:ids=>xtOpenMany(ids),
      submit:id=>xtSubmitGrade(id,'std'), make:(k,src)=>xtMakeCopy(k,0,[G.day,'bought',1,'golden'],src||'shop'), list:(id,p,ty)=>playerList('x',id,ty,p,5,true), subs:()=>G.player.xsubs||[],
      lgs:()=>xtLgs(), lgsCase:()=>{ xtLgsCase(G.day,false); return xtLgs().cs; }, lgsPrice:x=>xtLgsPrice(x), lgsBuySealed:(f,q)=>xtLgsBuySealed(f,q), lgsBuySingle:id=>xtLgsBuySingle(id), lgsSell:id=>xtLgsSellTo(id), lgsOffer:cp=>xtLgsOffer(cp),
      kvStock:()=>xtKvStock(G.day), kvPrice:k=>xtKvPrice(k), kvBuy:k=>xtKvBuy(k), itemType:'x', npcPoolKey:'xtg',
      usage:()=>G.xtg.usage, label:cp=>xtLabel(cp.c), setDef:s=>xtSetDef(s), legal:()=>xtLegalSets(G.day),
      screens:{ set:s=>xtSetSheet(s).h, design:k=>xtDesignSheet(k).h, copy:id=>xtCopySheet(id).h, meta:()=>xtMetaV(), sets:()=>xtSetsV(), coll:()=>xtCollV(), retail:()=>{ UI.xtstore='retail'; return xtShopV(); }, lgs:()=>{ UI.xtstore='lgs'; return xtShopV(); }, kv:()=>{ UI.xtstore='kv'; return xtShopV(); }, home:()=>{ const P=xtHomePanels(); return [P.next,P.meta,P.results,P.coll,P.goals,P.want,P.ban,P.hot,P.news].join(''); } },
      first:{ P:31, B:31 } }
  };
  const LIDS=['wk','xt'];
  const rs=()=>G.rs;
  const round=x=>x; // snapshots are exact: no rounding anywhere
  // ---------------- helpers ----------------
  async function fresh(seed){ await newGame(seed==null?SEED:seed, null); migrate(); UI.scn=null; G.player.cash=5000; }
  function days(n){ for (let i=0;i<n;i++) advanceDay(); }
  const norm=h=>String(h==null?'':h).replace(/data:[^"')\s]*/g,'data:').replace(/\btf\d+/g,'tfN').replace(/\bq\d+[PB]\d*\b/g,m=>m);
  // a stable hash of a list of rows, plus its length, so a failing snapshot says where it differs
  const hl=rows=>({n:rows.length, h:H(rows)});
  // ---------------- snapshots ----------------
  function prices(L){ const o={k:[],r:[],g9:[],g10:[]}; for (const s of L.sets){ for (const k of L.keys(s)){ o.k.push(k); o.r.push(L.fair(k)); o.g9.push(L.fairG(k,9)); o.g10.push(L.fairG(k,10)); } for (const f of ['P','B']){ const k=L.key(s,0,f); o.k.push(k); o.r.push(L.fair(k)); o.g9.push(L.fairG(k,9)); o.g10.push(L.fairG(k,10)); } }
    o.ev=L.sets.map(s=>L.ev(s)); o.hash=H(o); return o; }
  function packs(L,n){ const out={}; for (const s of (L.id==='wk'? [1,2] : [31,1,30])){ const r=mkRng(1000+s); const seq=[], cnt={}; let bulk=0; for (let i=0;i<n;i++){ const k=L.roll(s,r); seq.push(k.join(',')+'|'+(k.bulk||0)); bulk+=k.bulk||0; for (const x of k) cnt[x]=(cnt[x]||0)+1; }
      out[s]={h:FNV(seq.join(';')), bulk, distinct:Object.keys(cnt).length, top:Object.entries(cnt).sort((a,b)=>b[1]-a[1]||(a[0]<b[0]?-1:1)).slice(0,5), first:seq.slice(0,2)}; } return out; }
  function world(L){ const cps=Object.values(L.copies()); const by={}; for (const c of cps){ const d=L.D(c.k); const k=(d.sealed?'S':d.set)+':'+(c.o>0?'npc':c.o===0?'me':'?'); by[k]=(by[k]||0)+1; }
    return { n:cps.length, by, copies:H(cps.map(c=>[c.id,c.k,c.o,c.c.join?c.c.join(','):c.c,c.g,c.l||0,c.a||0,c.cert||0,c.pv||0,c.nw||0])), hist:H(cps.map(c=>c.h||0)), pop:H(G[L.id==='wk'?'tpop':'xpop']||{}) }; }
  function listings(L){ const rows=G.lst.filter(l=>l.it===L.itemType).map(l=>[l.id,l.ref,l.sel,l.ty,l.pr,l.en,l.off,l.cur,l.bids.length,l.offers.length]); return hl(rows); }
  function stores(L){ const T=L.st(); const lgs=T.lgs||null; let kv=null; try { const s=L.kvStock(); kv={n:Object.keys(s).length, h:H(s)}; } catch(e){ kv='ERR '+e; } let cs=null; try { const c=L.lgsCase(); cs={n:c.length, h:H(c.map(x=>[x.id,x.k,x.c,L.lgsPrice(x)]))}; } catch(e){ cs='ERR '+e; }
    return { shop:T.shop, lgs:lgs&&{pack:lgs.pack,box:lgs.box,caseWk:lgs.caseWk,nid:lgs.nid}, cs, kv, bl:T.bl||0, pre:T.pre, ann:T.ann, rel:T.rel }; }
  function meta(L){ const T=L.st(); const A=T.arch||[]; return { arch:hl(A.map(a=>[a.id,a.name,a.sh,a.wr,a.born==null?null:a.born,a.low,a.hist.join(' '),a.str,a.conv])), top:A.slice(0,5).map(a=>[a.id,a.sh]), n:A.length, mx:T.mx? H(T.mx.M) : null, mxTop:T.mx? H(T.mx.top.map(p=>p.sig||p.id||JSON.stringify(p).length)) : null,
    usage:H(T.usage), hy:H(T.hy), t8:H(T.t8), ban:T.ban, dom:T.dom, lastBan:T.lastBan, gone:T.gone||null, lead:T.lead||null, ev:hl((T.ev||[]).map(e=>[e.d,e.k,e.n,e.win,e.ru,e.winner,e.top.join('/'),e.fin?[e.fin.turns,e.fin.why]:0])), rv:T.rv, legal:L.legal(), usageN:Object.keys(T.usage).length }; }
  function core(){ const news=G.news.map(n=>[n.t,n.h,n.k,n.b.length]); return { day:G.day, rs:rs(), cash:G.player.cash, bought:G.player.bought, sold:G.player.sold, fees:G.player.fees, lst:G.lst.length, nextLid:G.nextLid, nextTid:G.nextTid, nextXid:G.nextXid, news:hl(news), newsHead:G.news.slice(0,6).map(n=>n.h), sales:H(G.sales), salesN:Object.keys(G.sales).length, feed:H(G.feed), dp:H(G.dp),
    npcs:H(G.npcs.map(n=>[n.id,n.h,n.ty,n.cash,n.tc||0,n.xt||0,n.setN||0])), npcN:G.npcs.length, nw:G.player.nw? H(G.player.nw) : null, rv:H(G.player.rv||[]), subs:H(G.player.tsubs||[]), xsubs:H(G.player.xsubs||[]), netWorth:netWorthNow() }; }
  function screens(){ const out={}; const put=(n,f)=>{ try { out[n]=FNV(norm(f())); } catch(e){ out[n]='ERR '+String(e).slice(0,80); } };
    for (const id of LIDS){ const L=LINES[id]; const nm=s=>id+':'+s;
      for (const s of (id==='wk'?[1,2]:[1,30,31])) put(nm('set'+s),()=>L.screens.set(s));
      for (const [n,f] of Object.entries(L.screens)) if (!['set','design','copy'].includes(n)) put(nm(n),f);
      const ks=L.keys(L.sets[L.sets.length-1]).slice(0,4).concat(L.keys(L.sets[0]).slice(0,3)); ks.forEach((k,i)=>put(nm('design'+i),()=>L.screens.design(k)));
      const mine=Object.values(L.copies()).filter(c=>c.o===0).slice(0,3); mine.forEach((c,i)=>put(nm('copy'+i),()=>L.screens.copy(c.id)));
      put(nm('sealed'),()=>L.screens.design(L.key(L.first.P,0,'P'))); }
    put('home',()=>VIEWS.home()); put('market',()=>VIEWS.market()); put('xt',()=>VIEWS.xt()); put('shop',()=>VIEWS.shop()); put('coll',()=>VIEWS.coll()); put('news',()=>G.news.slice(0,20).map(n=>n.h+n.b).join()); put('upnext',()=>JSON.stringify(upNext()));
    return out; }
  function snapshot(opt){ opt=opt||{}; const r0=rs(); const o={ core:core() }; for (const id of LIDS){ const L=LINES[id]; o[id]={ world:world(L), listings:listings(L), stores:stores(L), meta:meta(L) }; if (opt.prices!==false) o[id].prices=prices(L); if (opt.packs) o[id].packs=packs(L,opt.packs); }
    if (opt.screens!==false) o.screens=screens(); o.rsDrift=(rs()!==r0); return o; }
  // ---------------- scenarios ----------------
  const SC={};
  SC.day0=async()=>{ await fresh(); return snapshot({packs:2500}); };
  SC.release=async()=>{ await fresh(); days(26); return snapshot({packs:500}); };
  SC.year1=async()=>{ await fresh(); days(365); return snapshot({packs:300}); };
  // three years, a record every week: shares, field sizes, bans, news, RNG state
  SC.series=async()=>{ await fresh(); const rows=[]; const t0=performance.now(); for (let w=0; w<160; w++){ days(7); const row=[G.day,rs()]; for (const id of LIDS){ const T=LINES[id].st(); const A=T.arch||[]; row.push(A.length, A.slice(0,3).map(a=>[a.id,a.sh]), Object.keys(T.ban).length, (T.ev||[]).length); } row.push(G.news.length, G.lst.length); rows.push(row); }
    const o=snapshot({prices:true,screens:false}); o.weekly=hl(rows); o.weeklyRows=rows; return o; };
  // the player buys, opens, grades, lists, sells, in both games
  SC.flows=async()=>{ await fresh(); const out={}; for (const id of LIDS){ days(id==='wk'? 7 : 18); const L=LINES[id]; const f={}; const P=L.first.P;
      f.buy=L.buy(P,'P',3); f.buyBox=L.buy(L.first.B,'B',1); f.lgs=L.lgsBuySealed('P',2); const bx=L.make(L.key(P,0,'B'),'shop'); const keys=L.keys(P);
      const packs=L.mine().filter(c=>L.D(c.k).sealed&&L.D(c.k).v==='P'); const r=L.open(packs[0].id); f.open=r.packs.map(p=>p.map(i=>{ const c=L.copies()[i]; return [c.k,c.c.join(','),L.val(c)]; })); f.sv=r.sv; f.bulk=r.bulk||0;
      const rb=L.open(bx.id); f.box={packs:rb.packs.length, cards:rb.packs.flat().length, h:H(rb.packs.map(p=>p.map(i=>{ const c=L.copies()[i]; return [c.k,c.c.join(',')]; }))), sv:rb.sv};
      const best=r.packs[0].map(i=>L.copies()[i]).sort((a,b)=>L.val(b)-L.val(a)); f.grade=L.submit(best[0].id); const spare=best.slice(1,4); f.list=spare.map(c=>L.list(c.id,L.val(c)*1.1,'bin'));
      f.est=L.est(best[1].k,0,best[1]); const sellable=rb.packs.flat().map(i=>L.copies()[i]).find(c=>L.lgsOffer(c)>=0.5&&!c.l&&!c.g); f.lgsSell=sellable? L.lgsSell(sellable.id) : 'none'; const sk=Object.keys(L.kvStock()); f.kv=sk.length? L.kvBuy(sk[0]) : 'none';
      const d0=G.day; days(21); f.afterGrade={subs:L.subs().length, graded:L.mine().filter(c=>c.g>0).map(c=>[c.k,c.g,c.cert])}; days(40); f.sold=G.lst.filter(l=>l.it===L.itemType&&l.sel===0).length; f.mine=H(L.mine().map(c=>[c.id,c.k,c.g,c.l||0,c.c.join(',')])); f.nMine=L.mine().length; out[id]=f; }
    out.core=core(); return out; };
  // shared screens and rules that every game uses: grading returns, the reveal queue, crack-and-resubmit, the journal, net worth, recap, calendar
  const fakeEl={ classList:{contains:()=>true, add:()=>{}}, dataset:{}, textContent:'' };
  SC.shared=async()=>{ await fresh(); const out={}; for (const id of LIDS){ days(id==='wk'? 7 : 18); const L=LINES[id]; const P=L.first.P; L.buy(P,'P',4); const ps=L.mine().filter(c=>L.D(c.k).sealed&&L.D(c.k).v==='P'); let got=[]; for (const p of ps.slice(0,4)){ const r=L.open(p.id); got=got.concat(r.packs[0].map(i=>L.copies()[i])); }
      got.sort((a,b)=>L.val(b)-L.val(a)); for (const c of got.slice(0,4)) L.submit(c.id); L.list(got[5].id,L.val(got[5])*1.1,'bin'); out[id]={ nGot:got.length }; }
    const snap0=holdingSnap(); const log=[]; days(25); out.rv=G.player.rv.map(r=>[r.k,r.id,r.g,r.raw,r.fee,r.t]); out.rvQueue=rvQueue().map(r=>{ const o=objFor(r.k,r.id); return [r.k,r.id,o.g,rvValue(r.k,o),rvTitle(r.k,o),popLine(r.k,o)]; });
    out.netWorth=netWorthNow(); out.rows=null; const y=buildYear(yearOf(G.day)); const jr=x=>({k:x.k,id:x.o?x.o.id:null,paid:x.paid,now:x.now,gain:x.gain,sold:x.sold,price:x.price,t:x.t});
    out.journal={ keys:Object.keys(y), h:H(JSON.stringify(y,(k,v)=>(v&&typeof v==='object'&&v.k!==undefined&&v.o!==undefined)? jr(v) : v)) };
    const rec=buildRecap(G.day-60,snap0,log,false); out.recap={ keys:Object.keys(rec), other:rec.other.map(n=>n.h), mine:rec.mine.length, v0:rec.v0, v1:rec.v1, moves:H(rec.moves.map(m=>[m.id,m.label,m.d])) };
    out.upnext=H(upNext().map(x=>[x.d,x.txt,x.kind,x.act,x.a])); out.coll=collectionTotals();
    // crack a slab in each game: out of the slab, and out and resubmitted
    const crack=[]; for (const r of G.player.rv.slice()){ const o=objFor(r.k,r.id); if (!o||!(o.g>0)) continue; const re=crack.length%2? '1':'0'; const before=[o.g,o.cr||0]; ACT.crack(r.k+':'+r.id+':'+re, fakeEl); crack.push([r.k,r.id,re,before,[o.g,o.pg||0,o.cr||0,o.cert||0]]); }
    out.crack=crack; out.afterCrack={ rv:G.player.rv.length, subs:H([G.player.tsubs||[],G.player.xsubs||[]]), netWorth:netWorthNow() }; out.core=core(); return out; };
  // opening a saved game through the launcher's own path (shellOpen): older saves get missing worlds built there
  SC.open=async(b64)=>{ const bin=atob(b64); const u=new Uint8Array(bin.length); for (let i=0;i<bin.length;i++) u[i]=bin.charCodeAt(i); const g=await unpackBytes(u,'gz'); const rec=await slotCreate('golden-open',''); await slotWrite(rec.id,u,'gz',{day:g.day,cash:g.player.cash});
    await shellOpen(rec.id); const t0=Date.now(); while ((UI.booting || !G || !G.player) && Date.now()-t0<60000) await new Promise(r=>setTimeout(r,50)); const o={ booted:!UI.booting, lines:[!!G.tcg,!!G.xtg], snap:snapshot({packs:0,screens:false}) }; days(10); o.after10=snapshot({packs:0,screens:false,prices:false}); await slotDelete(rec.id); return o; };

  // ---------------- saved games ----------------
  async function loadBytes(b64){ const bin=atob(b64); const u=new Uint8Array(bin.length); for (let i=0;i<bin.length;i++) u[i]=bin.charCodeAt(i); G=await unpackBytes(u,'gz'); R=worldRnd; if (typeof resetCaches==='function') resetCaches(); DCACHE.clear(); fvClear();
    G._npcCardIds=Object.keys(G.cards).map(Number).filter(i=>G.cards[i].o>0); migrate(); if (typeof upgradeXt==='function' && !G.xtg){ await upgradeXt(null); migrate(); } }
  SC.save=async(b64)=>{ await loadBytes(b64); const o={}; o.loaded=snapshot({packs:0}); const mineV=LIDS.map(id=>{ const L=LINES[id]; return H(L.mine().map(c=>[c.id,c.k,c.g,c.l||0,c.c.join(','),L.val(c)])); }); o.loaded.ownedValues=mineV; o.owned=LIDS.map(id=>LINES[id].mine().length);
    days(30); o.after30=snapshot({packs:0,screens:false}); o.after30.ownedValues=LIDS.map(id=>{ const L=LINES[id]; return H(L.mine().map(c=>[c.id,c.k,c.g,c.l||0,c.c.join(','),L.val(c)])); }); return o; };
  // ---------------- fixtures: saves captured from the current code ----------------
  async function packSave(){ const p=await packBytes(); let s=''; const a=p.bytes; for (let i=0;i<a.length;i+=8192) s+=String.fromCharCode.apply(null,a.subarray(i,i+8192)); return btoa(s); }
  const FX={};
  FX.day1=async()=>{ await fresh(); return packSave(); };
  FX.released=async()=>{ await fresh(); days(40); return packSave(); };
  // a busy player: owns opened cards, slabs, listings and something at the grader in both games, plus an unfulfilled preorder
  FX.busy=async()=>{ await fresh(); G.xtg.pre.push({set:31,f:'B',q:1}); for (const id of LIDS){ days(id==='wk'? 7 : 18); const L=LINES[id]; const P=L.first.P; L.buy(P,'P',4); const ps=L.mine().filter(c=>L.D(c.k).sealed&&L.D(c.k).v==='P'); let got=[]; for (const p of ps.slice(0,3)){ const r=L.open(p.id); got=got.concat(r.packs[0].map(i=>L.copies()[i])); }
      got.sort((a,b)=>L.val(b)-L.val(a)); L.submit(got[0].id); L.list(got[1].id,L.val(got[1])*1.2,'bin'); L.list(got[2].id,L.val(got[2])*0.9,'auc'); } days(12); return packSave(); };
  FX.ban=async()=>{ await fresh(); let n=0; while (!Object.keys(G.xtg.ban).length && n<1400){ days(7); n+=7; } return packSave(); };
  return { SEED, FNV, H, LINES, SC, FX, fresh, days, snapshot };
})();
