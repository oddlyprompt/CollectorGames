// ===================== TCG: THE METAGAME =====================
// Nobody plays matches here. The game simulates what players bring, what wins, and what that does to what cards are worth.
function tcInit(){ G.tc=G.tc||{}; G.tpop=G.tpop||{}; G.nextTid=G.nextTid||1; G.tcg={v:1, cv:TC_CV, mv:WK_CANON.set.mv, usage:{}, t8:{}, hy:{}, ban:{}, arch:[], ev:[], dom:{}, shop:{}, pre:[], ann:{}, rev:{}, rel:{}, last:G.day, lastBan:0}; }
const STYLE_ADV={ aggro:{control:.5,combo:.3,stall:.1,mid:-.25,aggro:0}, control:{combo:.5,mid:.25,aggro:-.5,stall:-.2,control:0}, combo:{stall:.4,aggro:-.3,control:-.5,mid:.1,combo:0}, stall:{aggro:-.1,combo:-.4,mid:.35,control:.2,stall:0}, mid:{aggro:.25,control:-.25,combo:-.1,stall:-.35,mid:0} };
function tcNews(h, b, ref){ if (!G.live || !G.tcg) return; const n={t:G.day,h,b,p:null,k:'tcg'}; if (ref){ if (ref.set!=null) n.ts=ref.set; if (ref.cid!=null) n.tcid=ref.cid; } G.news.unshift(n); if (G.news.length>320) G.news.length=320; }
function tcCardByCid(cid){ tcSetCards(Math.floor(cid/1000)); return TC_BYCID.get(+cid)||null; }
// the earlier stages a deck needs to reach this card (evolution lines matter: a Stage 2 deck plays its Basic and Stage 1)
function tcLineOf(c){ const out=[]; let cur=c; const all=tcSetCards(c.set); for (let i=0;i<3&&cur&&cur.from;i++){ cur=all.find(x=>x.name===cur.from&&!tcAlt(x)&&x.kind==='creature'); if (cur) out.push(cur); } return out; }
function tcLegalSets(t){ return tcReleasedSets(t).slice(-3); }
function tcBanned(cid,t){ const b=G.tcg&&G.tcg.ban[cid]; return !!(b && b.d<=(t==null?G.day:t)); }
// 'std' playable in Standard now, 'rot' only in the open format, 'ban' banned
function tcLegalState(cid, t){
  t=t==null?G.day:t; if (tcBanned(cid,t)) return 'ban';
  const legal=tcLegalSets(t); const key='L'+t; const c=G.tcg._lg||(G.tcg._lg={}); if (c.day!==t){ c.day=t; c.m=new Map(); }
  let r=c.m.get(cid); if (r) return r;
  const sets=[]; for (const s of tcReleasedSets(t)){ if (tcSetCards(s).some(x=>x.cid===cid&&!tcAlt(x))) sets.push(s); }
  r= sets.some(s=>legal.includes(s))? 'std':'rot'; c.m.set(cid,r); return r;
}
function tcLegalIdentities(t){ const out=new Map(); for (const s of tcLegalSets(t)) for (const c of tcSetCards(s)){ if (tcAlt(c)||c.kind==='essence') continue; if (tcBanned(c.cid,t)) continue; if (!out.has(c.cid)) out.set(c.cid,c); } return [...out.values()]; }
const TCP={sens:2.6, eta:1.1, noise:0.01, hate:0.6, dom:0.24, domWeeks:10};
function tcMatch(a, b){ const sa=(STYLE_ADV[a.st]||{})[b.st]||0; const d=(TC_EL.indexOf(b.el)-TC_EL.indexOf(a.el)+9)%9; const ta=(d===1||d===4)?0.07:(d===8||d===5)?-0.07:0; return 1/(1+Math.exp(-(TCP.sens*(a.str-b.str)+sa+ta))); }
function tcRebuildMeta(t){
  const cards=tcLegalIdentities(t); if (!cards.length) return; const creatures=cards.filter(c=>c.kind==='creature'), trainers=cards.filter(c=>c.kind!=='creature'&&c.kind!=='essence'); const old={}; for (const a of G.tcg.arch) old[a.id]=a; const list=[];
  for (const el of TC_EL) for (const st of TC_STYLES){
    const cand=creatures.filter(c=>c.el===el).map(c=>[c, c.pw+(c.st===st?0.12:0)+(st==='aggro'&&c.stage==='Stage 2'?0.04:0)]).sort((a,b)=>b[1]-a[1]); if (cand.length<4) continue;
    const core=cand.slice(0,6), tr=trainers.map(c=>[c, c.pw+(c.st===st?0.1:0)]).sort((a,b)=>b[1]-a[1]).slice(0,6); const m=a=>a.reduce((s,x)=>s+x[1],0)/Math.max(1,a.length);
    const line=[]; let broken=0; for (const [c] of core) for (const p of tcLineOf(c)){ if (tcBanned(p.cid,t)) broken++; if (!core.some(x=>x[0].cid===p.cid) && !line.includes(p.cid)) line.push(p.cid); }
    const str=0.55*m(core.slice(0,4))+0.2*m(core.slice(4))+0.25*m(tr)+0.06*(core.filter(x=>x[0].st===st).length/6)-0.05*broken-0.004*line.length;
    list.push({id:el+'|'+st, el, st, name:core[0][0].name+' '+TC_STYN[st], str:+str.toFixed(4), core:core.map(x=>x[0].cid), tr:tr.map(x=>x[0].cid), line, lead:core[0][0].cid}); }
  list.sort((a,b)=>b.str-a.str); const top=list.slice(0,15); const tot=top.reduce((s,a)=>s+Math.exp(7*a.str),0);
  for (const a of top){ const o=old[a.id]; a.sh= o? o.sh : Math.exp(7*a.str)/tot*0.55; a.hist=o?o.hist:[]; a.wr=o?o.wr:0.5; a.conv=o?o.conv:1; }
  const S=top.reduce((s,a)=>s+a.sh,0); top.forEach(a=>a.sh/=S); G.tcg.arch=top; tcUsage();
}
function tcUsage(){
  const U={}; for (const a of G.tcg.arch){ a.core.forEach((cid,i)=>{ U[cid]=(U[cid]||0)+a.sh*(i<3?4:i<5?3:2); }); (a.line||[]).forEach(cid=>{ U[cid]=(U[cid]||0)+a.sh*2.5; }); a.tr.forEach((cid,i)=>{ U[cid]=(U[cid]||0)+a.sh*(i<2?4:3); }); }
  const old=G.tcg.usage; for (const cid in U) old[cid]=0.6*(old[cid]||0)+0.4*Math.min(4,U[cid]); for (const cid in old){ if (U[cid]==null){ old[cid]*=0.7; if (old[cid]<0.02) delete old[cid]; } }
}
function tcMetaWeek(t){
  const A=G.tcg.arch; if (!A.length) return;
  for (const a of A){ let w=0; for (const b of A) w+=b.sh*tcMatch(a,b); a.wr=w-TCP.hate*(a.sh-1/A.length); }
  const avg=A.reduce((s,a)=>s+a.sh*a.wr,0); const tg=A.map(a=>a.sh*Math.exp(TCP.eta*(a.wr-avg))); const T=tg.reduce((x,y)=>x+y,0);
  A.forEach((a,i)=>{ a.sh=Math.max(0.004, 0.8*a.sh+0.2*tg[i]/T+(R()-0.5)*TCP.noise); }); const S=A.reduce((s,a)=>s+a.sh,0);
  A.forEach(a=>{ a.sh/=S; a.hist.push(+a.sh.toFixed(3)); if (a.hist.length>20) a.hist.shift(); }); tcUsage();
  for (const k in G.tcg.hy){ G.tcg.hy[k]*=0.86; if (G.tcg.hy[k]<0.02) delete G.tcg.hy[k]; } for (const k in G.tcg.t8){ G.tcg.t8[k]*=0.95; if (G.tcg.t8[k]<0.05) delete G.tcg.t8[k]; }
}
function tcRunEvent(t, kind, N){
  const A=G.tcg.arch; if (!A.length) return; const decks=[]; const cum=[]; let s=0; for (const a of A){ s+=a.sh; cum.push(s); }
  for (let i=0;i<N;i++){ const x=R()*s; let k=0; while (k<cum.length-1 && cum[k]<x) k++; decks.push({a:A[k], sc:A[k].wr+gauss()*0.18}); }
  const top=decks.sort((x,y)=>y.sc-x.sc).slice(0,8); const win=top.map(d=>({a:d.a, sc:d.sc+gauss()*0.06})).sort((x,y)=>y.sc-x.sc)[0].a;
  const cnt={}; for (const d of top) cnt[d.a.id]=(cnt[d.a.id]||0)+1; const fld={}; for (const d of decks) fld[d.a.id]=(fld[d.a.id]||0)+1;
  const exp=kind==='local'?0.03:0.1; for (const a of A){ const f=Math.max(0.004,a.sh); const conv=((cnt[a.id]||0)/8)/f; a.conv=conv; a.sh*=Math.max(0.9,Math.min(1.12,Math.pow(Math.max(0.2,conv),exp))); } win.sh+=kind==='champ'?0.02:kind==='regional'?0.008:0.002;
  const S=A.reduce((q,a)=>q+a.sh,0); A.forEach(a=>a.sh/=S);
  const hot=kind==='champ'?0.5:kind==='regional'?0.22:0.05; for (const cid of win.core.concat(win.tr.slice(0,3))) G.tcg.hy[cid]=(G.tcg.hy[cid]||0)+hot; for (const d of top) for (const cid of d.a.core.concat(d.a.tr)) G.tcg.t8[cid]=(G.tcg.t8[cid]||0)+1/8;
  const npcs=G.npcs.filter(n=>n.ty==='tpl'); const who=npcs.length? pick(npcs).h : 'a local player';
  const ev={d:t, k:kind, n:N, top:top.map(d=>d.a.id), win:win.id, winner:who, cnt}; G.tcg.ev.unshift(ev); if (G.tcg.ev.length>40) G.tcg.ev.length=40;
  if (kind!=='local'){ const lead=Object.keys(cnt).sort((a,b)=>cnt[b]-cnt[a])[0]; const nm=id=>A.find(a=>a.id===id).name; tcNews(`${win.name.toUpperCase()} WINS THE ${kind==='champ'?'WILDKIN CHAMPIONSHIP':'REGIONAL'}`, `${who} piloted ${win.name} to the title among ${N} players. ${nm(lead)} put ${cnt[lead]} of the top 8 into the bracket.`, {cid:win.lead}); }
  return ev;
}
function tcEventsDay(t){ if (dowOf(t)!==6 || !G.tcg.arch.length) return; const [m,d]=mdOf(t); if ((m===6||m===12) && d>=8 && d<=14) tcRunEvent(t,'champ',640); else if (d<=7) tcRunEvent(t,'regional',140); else tcRunEvent(t,'local',24); }
function tcBanCheck(t){
  const A=G.tcg.arch; if (!A.length) return; const D=G.tcg.dom; for (const a of A) D[a.id]= a.sh>TCP.dom? (D[a.id]||0)+1 : 0; const top=A.slice().sort((a,b)=>b.sh-a.sh)[0];
  if (top && D[top.id]>=TCP.domWeeks && t-(G.tcg.lastBan||0)>120){ const c=top.core.map(tcCardByCid).filter(c=>c && !G.tcg.ban[c.cid]).sort((a,b)=>b.pw-a.pw)[0];
    if (c){ G.tcg.ban[c.cid]={d:t+14, ann:t, why:top.name}; G.tcg.lastBan=t; D[top.id]=0; tcNews(`BAN ANNOUNCED: ${c.name.toUpperCase()}`, `The rules committee will remove ${c.name} from Standard on ${fmtDate(t+14)}, after ${top.name} held more than a quarter of the field for nine straight weeks. Copies are already moving.`, {cid:c.cid}); G.tcg.hy[c.cid]=(G.tcg.hy[c.cid]||0)+0.6; } }
}
// previews: a new set is shown in stages, long before you can buy it. What gets revealed is a signal, not a verdict.
function tcRevealed(n){ return (G.tcg&&G.tcg.rev[n])||[]; }
function tcSetLife(t){
  const nx=tcNextSet(t); if (!nx) return; const def=tcSetDef(nx), days=def.rel-t; const T=G.tcg; const cards=tcSetCards(nx);
  const show=(k)=>{ const r=T.rev[nx]||(T.rev[nx]=[]); for (const x of k) if (!r.includes(x)) r.push(x); };
  if (days<=35 && !T.ann['pv'+nx]){ T.ann['pv'+nx]=1; show(cards.filter(c=>tcIsPrem(c)&&(c.rar==='sir'||c.rar==='fa')).map(c=>c.no).concat(cards.filter(c=>c.rar==='rare'&&c.kind==='creature').sort((a,b)=>b.pw-a.pw).slice(0,2).map(c=>c.no)));
    tcNews(`${def.name.toUpperCase()}: ${def.reprint?'A GREATEST-HITS SET IS ANNOUNCED':'THE NEXT SET IS ANNOUNCED'}`, `${def.name} arrives ${fmtDate(def.rel)} with ${cards.length} cards${def.reprint?', reprinting fan favourites from earlier sets':''}. The first cards have been shown. Preorders are open.`, {set:nx}); }
  if (days<=21 && !T.ann['pv2'+nx]){ T.ann['pv2'+nx]=1; show(cards.filter(c=>c.kind!=='creature'||c.rar==='rare').map(c=>c.no)); tcNews(`${def.name.toUpperCase()}: MORE CARDS REVEALED`, `The rest of the rares and the trainers are out. Players are already testing lists.`, {set:nx}); }
  if (days<=7 && !T.ann['pv3'+nx]){ T.ann['pv3'+nx]=1; show(cards.map(c=>c.no)); }
  if (days<=42 && !T.ann['rot'+nx]){ T.ann['rot'+nx]=1; const after=tcReleasedSets(def.rel).slice(-3), now=tcLegalSets(t); const out=now.filter(s=>!after.includes(s)); if (out.length) tcNews('ROTATION: '+out.map(s=>tcSetDef(s).name.toUpperCase()).join(', ')+' LEAVES STANDARD', `When ${def.name} releases on ${fmtDate(def.rel)}, ${out.map(s=>tcSetDef(s).name).join(' and ')} cards stop being legal in Standard. Anything not reprinted becomes open-format only.`, {set:nx}); }
}
function tcRelease(n, t){
  const def=tcSetDef(n); G.tcg.rel[n]=t; tcRebuildMeta(t); tcShopWeek(t, n);
  tcNews(`${def.name.toUpperCase()} IS OUT TODAY`, `Stores report long lines for ${def.name}. Boxes are expected to sell out within days.`, {set:n});
  if (typeof tcReleaseMarket==='function') tcReleaseMarket(n,t);
  if (typeof tcFulfilPreorders==='function') tcFulfilPreorders(n,t);
}
function tcShopWeek(t, only){
  for (const n of tcRetailSets(t)){ if (only!=null && n!==only) continue; const s=G.tcg.shop[n]||(G.tcg.shop[n]={pack:0,box:0}); const age=t-tcSetDef(n).rel; const rel=tcReleasedSets(t); const cur=age<100||n===rel[rel.length-1];   // the newest set keeps being reprinted
    s.pack=Math.min(300, s.pack+(cur? ri(70,150) : ri(15,45))); s.box=Math.min(20, s.box+(cur? ri(4,9) : ri(1,3))); }
}
function tcRetailSets(t){ const rel=tcReleasedSets(t); return rel.filter((n,i)=>t-tcSetDef(n).rel<=365 || i===rel.length-1); }   // the newest set stays in print until another one exists
function tcShopDay(t){
  for (const n of tcRetailSets(t)){ const s=G.tcg.shop[n]; if (!s) continue; const age=t-tcSetDef(n).rel; const hot=age<=14?3.2: age<=45?1.2:0.35; const v=tcPackRetailPressure(n);
    s.pack=Math.max(0, s.pack-poisson(hot*14*v)); const sb=poisson(hot*1.2*v); s.box=Math.max(0, s.box-sb); }
}
function tcPackRetailPressure(n){ return 0.7+0.9*Math.max(0, Math.min(1.6, tcSetPrestige(n)-0.7)); }
function tcApplyBans(t){ for (const cid in G.tcg.ban){ if (G.tcg.ban[cid].d===t){ tcRebuildMeta(t); const c=tcCardByCid(+cid); if (c) tcNews(c.name.toUpperCase()+' IS NOW BANNED', `${c.name} is no longer legal in Standard. ${G.tcg.ban[cid].why} players are retooling.`, {cid:+cid}); } } }
function tcDay(t){
  const T=G.tcg; if (!T) return; const nx=tcNextSet(t-1); if (nx && tcSetDef(nx).rel===t) tcRelease(nx,t);
  if (!T.arch.length && tcReleasedSets(t).length) tcRebuildMeta(t);
  tcApplyBans(t);
  if (dowOf(t)===1){ tcSetLife(t); if (T.arch.length){ tcMetaWeek(t); tcBanCheck(t); } tcShopWeek(t); }
  tcEventsDay(t); tcShopDay(t);
}
// existing saves and new worlds: play the metagame forward from the first release so it has a history
function tcCatchUp(t0, t1){ const live=G.live; G.live=false; G._tcCatch=true; for (let t=t0; t<=t1; t++){ tcDay(t); G.tcg.last=t; } G._tcCatch=false; G.live=live; }
