// ===================== CARD KIT: STORE TRANSACTIONS =====================
// What buying from and selling to a line's local game store and online singles shop does, the same for every card game: pay, take stock, make the
// copy with its history. How a store stocks itself (allocation, the glass case, the catalogue) and how its pages look stay in the line's own file.
//   S.lgsName S.kvName  the two shops' names     S.world() the line's world state     S.copies() the copy table    S.newestSet(t)  S.key(set,0,f)
//   S.lgs() S.kv() S.kvStock(t)  the shops' state    S.listPrice {P,B} S.markup S.buy (share of market the buylist pays) S.kvMarkup S.kvMin
//   optional: S.kvPriceReal(k) the price of the real copy a shop would sell for k (null when it has none)   S.kvBuyReal(k) buys a real copy from a shop's inventory (returns undefined when the key is not stocked that way)
//   S.D S.fairRaw S.makeCopy S.copyValue S.econ  the line's own functions and economy
function cardStores(S){
  const M={};
  M.lgsPrice=function(x){ const v=S.fairRaw(x.k)*S.econ.condition.price(x.c,S.D(x.k).card)*S.markup; return Math.max(0.5, Math.ceil(v*4)/4-0.01); };
  M.lgsBuySingle=function(id){ const L=S.lgs(); const x=L.cs.find(y=>y.id===id); if (!x) return 'Someone else bought that one.'; const p=M.lgsPrice(x); if (G.player.cash<p) return 'You need '+money(p,true)+'.';
    G.player.cash-=p; G.player.bought+=p; const cp=S.makeCopy(x.k,0,[G.day,'bought',p,S.lgsName],'shop'); cp.c=x.c.slice(); cp.nw=1; cp.h=[[G.day,'Bought from the case at '+S.lgsName,p,'']]; cp.pv={d:G.day,v:Math.round(S.copyValue(cp)*100)/100,n:''};
    L.cs=L.cs.filter(y=>y.id!==id); return null; };
  M.lgsBuySealed=function(f, q){ const L=S.lgs(), n=S.newestSet(G.day); const have=f==='P'?L.pack:L.box, p=S.listPrice[f]; if (!n || have<q) return 'Not enough in stock.'; if (G.player.cash<p*q) return 'You need '+money(p*q,true)+'.';
    G.player.cash-=p*q; G.player.bought+=p*q; if (f==='P') L.pack-=q; else L.box-=q; const key=S.key(n,0,f);
    for (let i=0;i<q;i++){ const cp=S.makeCopy(key,0,[G.day,'bought',p,S.lgsName],'shop'); cp.nw=1; cp.pv={d:G.day,v:Math.round(S.fairRaw(key)*100)/100,n:''}; } return null; };
  // the buylist: the store pays a fixed share of market for raw cards, on the spot (the card leaves the game's market)
  M.lgsOffer=function(cp){ return Math.floor(S.copyValue(cp)*S.buy*100)/100; };
  M.lgsSellTo=function(id){ const cp=S.copies()[id]; if (!cp || cp.o!==0 || cp.l || cp.g!==0 || S.D(cp.k).sealed) return 'The store can\'t take that card.'; const p=M.lgsOffer(cp); if (p<0.25) return 'The store passes on that one.';
    G.player.cash+=p; G.player.sold=(G.player.sold||0)+p; S.world().bl=(S.world().bl||0)+1; delete S.copies()[id]; return null; };
  M.kvPrice=function(k){ if (S.kvPriceReal){ const q=S.kvPriceReal(k); if (q!=null) return q; } return Math.max(S.kvMin, Math.ceil(S.fairRaw(k)*S.kvMarkup*100)/100); };
  M.kvBuy=function(k){ if (S.kvBuyReal){ const e=S.kvBuyReal(k); if (e!==undefined) return e; } const s=S.kvStock(G.day); if (!s[k]) return 'Out of stock.'; const p=M.kvPrice(k); if (G.player.cash<p) return 'You need '+money(p,true)+'.';
    G.player.cash-=p; G.player.bought+=p; s[k]--; const cp=S.makeCopy(k,0,[G.day,'bought',p,S.kvName],'shop'); cp.c=cp.c.map(v=>Math.max(v,90)); cp.nw=1; cp.h=[[G.day,'Bought near mint from '+S.kvName,p,'']]; cp.pv={d:G.day,v:Math.round(S.copyValue(cp)*100)/100,n:''}; return null; };
  return M;
}
