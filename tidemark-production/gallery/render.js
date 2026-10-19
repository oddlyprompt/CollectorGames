// Tidemark card renderer: draws a whole card on a canvas from its data and its illustration, following the card frame guide
// (tidemark-production/FRAME_GUIDE.md: name bar with the Influence cost and Allegiance pips, a 4:3 landscape art window, type line
// with the faction icon, parchment rules box, one set/rarity emblem at the bottom centre, Power/Toughness for Units and Vessels,
// collector line "TT 042/220"). The frame never changes with rarity; only the emblem's finish does. Runs in any browser (and in
// the game later). drawCard(ctx, card, img, W): card is one printing from tidemark-production/cards.json; img an Image or null.
(function(root){
const FAC={CR:{c:'#2f5fae',d:'#1b3a72',l:'#8fb0e6',icon:'tower'},TW:{c:'#3d7a3a',d:'#234a22',l:'#9ccc8f',icon:'tree'},IR:{c:'#a2452c',d:'#62281a',l:'#e5a189',icon:'mountain'},
  TB:{c:'#1f8a8a',d:'#0f5050',l:'#86d3cf',icon:'waves'},FF:{c:'#c49a2e',d:'#7a5c14',l:'#f0d58a',icon:'wheel'},AC:{c:'#6a3f9c',d:'#3d2160',l:'#bf9be6',icon:'kraken'},
  HL:{c:'#8a5a34',d:'#53351c',l:'#d9b08a',icon:'scales'},NE:{c:'#85898e',d:'#4c4f53',l:'#cfd2d5',icon:'waystone'}};
const RAR={C:{a:'#3a3a3a',b:'#111',t:'#cfcfcf'},U:{a:'#f2f4f7',b:'#8d949c',t:'#30343a'},R:{a:'#ffe08a',b:'#b07a10',t:'#3a2800'},L:{prism:true,t:'#1e1630'}};
const SERIF="Georgia, 'Times New Roman', serif", TITLE="'Cinzel', Georgia, 'Times New Roman', serif";
function rr(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
function parchment(ctx,x,y,w,h,r){ const g=ctx.createLinearGradient(x,y,x,y+h); g.addColorStop(0,'#f7f1e3'); g.addColorStop(1,'#e9dfc7'); rr(ctx,x,y,w,h,r); ctx.fillStyle=g; ctx.fill(); ctx.lineWidth=Math.max(1,w/260); ctx.strokeStyle='rgba(60,45,20,0.55)'; ctx.stroke(); }
// ---- faction icons, drawn in a unit box of size s centred at (x, y)
function icon(ctx, kind, x, y, s, col){ ctx.save(); ctx.translate(x-s/2,y-s/2); ctx.scale(s/24,s/24); ctx.fillStyle=col; ctx.strokeStyle=col; ctx.lineWidth=1.6; ctx.lineCap='round'; ctx.lineJoin='round'; ctx.beginPath();
  if (kind==='tower'){ ctx.moveTo(5,22); ctx.lineTo(5,6); ctx.lineTo(7,6); ctx.lineTo(7,3); ctx.lineTo(9.5,3); ctx.lineTo(9.5,6); ctx.lineTo(11,6); ctx.lineTo(11,3); ctx.lineTo(13,3); ctx.lineTo(13,6); ctx.lineTo(14.5,6); ctx.lineTo(14.5,3); ctx.lineTo(17,3); ctx.lineTo(17,6); ctx.lineTo(19,6); ctx.lineTo(19,22); ctx.closePath(); ctx.fill();
    ctx.fillStyle='rgba(0,0,0,0.45)'; ctx.beginPath(); ctx.moveTo(10,22); ctx.lineTo(10,17); ctx.arc(12,17,2,Math.PI,0); ctx.lineTo(14,22); ctx.closePath(); ctx.fill(); ctx.fillRect(11,9,2,3); }
  else if (kind==='tree'){ ctx.arc(12,9,6.5,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(7,12,4.2,0,Math.PI*2); ctx.arc(17,12,4.2,0,Math.PI*2); ctx.fill(); ctx.fillRect(10.6,12,2.8,10); ctx.fillRect(7,21,10,1.6); }
  else if (kind==='mountain'){ ctx.moveTo(1,21); ctx.lineTo(8.5,7); ctx.lineTo(12,13); ctx.lineTo(15.5,4); ctx.lineTo(23,21); ctx.closePath(); ctx.fill(); ctx.fillStyle='rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.moveTo(15.5,4); ctx.lineTo(13.4,9.4); ctx.lineTo(15.5,8.4); ctx.lineTo(17.6,9.6); ctx.closePath(); ctx.fill(); }
  else if (kind==='waves'){ ctx.lineWidth=2.4; for (const yy of [7,12.5,18]){ ctx.moveTo(2,yy); ctx.bezierCurveTo(6,yy-4,9,yy+4,12,yy); ctx.bezierCurveTo(15,yy-4,18,yy+4,22,yy); } ctx.stroke(); }
  else if (kind==='kraken'){ ctx.ellipse(12,7.5,6,5.5,0,0,Math.PI*2); ctx.fill(); ctx.lineWidth=2.2; ctx.beginPath(); for (const [x0,dx] of [[7,-5],[9.5,-2.5],[12,0],[14.5,2.5],[17,5]]){ ctx.moveTo(x0,11); ctx.bezierCurveTo(x0+dx*0.4,16,x0+dx,15,x0+dx*0.8,21); } ctx.stroke(); ctx.fillStyle='rgba(0,0,0,0.5)'; ctx.beginPath(); ctx.arc(10,7,1,0,7); ctx.arc(14,7,1,0,7); ctx.fill(); }
  else if (kind==='wheel'){ ctx.lineWidth=2; ctx.arc(12,12,6.5,0,Math.PI*2); ctx.stroke(); ctx.beginPath(); ctx.arc(12,12,2,0,Math.PI*2); ctx.fill(); ctx.beginPath(); for (let i=0;i<8;i++){ const a=i*Math.PI/4; ctx.moveTo(12+Math.cos(a)*2,12+Math.sin(a)*2); ctx.lineTo(12+Math.cos(a)*10.5,12+Math.sin(a)*10.5); } ctx.stroke(); ctx.beginPath(); for (let i=0;i<8;i++){ const a=i*Math.PI/4; ctx.moveTo(12+Math.cos(a)*11.5,12+Math.sin(a)*11.5); ctx.arc(12+Math.cos(a)*10.5,12+Math.sin(a)*10.5,1.3,0,7); } ctx.fill(); }
  else if (kind==='scales'){ ctx.lineWidth=1.8; ctx.moveTo(12,3); ctx.lineTo(12,20); ctx.moveTo(4,6); ctx.lineTo(20,6); ctx.moveTo(4,6); ctx.lineTo(1.5,13); ctx.moveTo(4,6); ctx.lineTo(6.5,13); ctx.moveTo(20,6); ctx.lineTo(17.5,13); ctx.moveTo(20,6); ctx.lineTo(22.5,13); ctx.stroke(); ctx.beginPath(); ctx.moveTo(1,13); ctx.quadraticCurveTo(4,17,7,13); ctx.closePath(); ctx.moveTo(17,13); ctx.quadraticCurveTo(20,17,23,13); ctx.closePath(); ctx.fill(); ctx.fillRect(8,20,8,2); ctx.beginPath(); ctx.arc(12,3,1.6,0,7); ctx.fill(); }
  else if (kind==='waystone'){ ctx.moveTo(7,22); ctx.lineTo(8,6); ctx.quadraticCurveTo(12,0.5,16,6); ctx.lineTo(17,22); ctx.closePath(); ctx.fill(); ctx.fillRect(4,21,16,2); ctx.strokeStyle='rgba(0,0,0,0.45)'; ctx.lineWidth=1.2; ctx.beginPath(); ctx.moveTo(12,8); ctx.lineTo(12,15); ctx.moveTo(9.5,11); ctx.lineTo(14.5,11); ctx.stroke(); }
  ctx.restore(); }
// ---- Allegiance pips: Land a stone, Sea a wave, Dual half of each
function pip(ctx, kind, x, y, r){ ctx.save(); ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fillStyle= kind==='L'? '#8a7a62' : kind==='S'? '#2a6f9a' : '#6f6a6a'; ctx.fill();
  if (kind==='D'){ ctx.beginPath(); ctx.moveTo(x,y-r); ctx.arc(x,y,r,-Math.PI/2,Math.PI/2); ctx.closePath(); ctx.fillStyle='#2a6f9a'; ctx.fill(); ctx.beginPath(); ctx.moveTo(x,y-r); ctx.arc(x,y,r,-Math.PI/2,Math.PI/2,true); ctx.closePath(); ctx.fillStyle='#8a7a62'; ctx.fill(); }
  ctx.lineWidth=r*0.18; ctx.strokeStyle='rgba(20,15,10,0.8)'; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.stroke();
  ctx.strokeStyle='rgba(255,255,255,0.85)'; ctx.fillStyle='rgba(255,255,255,0.85)'; ctx.lineWidth=r*0.2; ctx.beginPath();
  if (kind==='L'){ ctx.moveTo(x-r*0.5,y+r*0.35); ctx.lineTo(x-r*0.3,y-r*0.3); ctx.lineTo(x+r*0.15,y-r*0.45); ctx.lineTo(x+r*0.5,y-r*0.05); ctx.lineTo(x+r*0.4,y+r*0.4); ctx.closePath(); ctx.fill(); }
  else if (kind==='S'){ ctx.moveTo(x-r*0.6,y+r*0.1); ctx.bezierCurveTo(x-r*0.3,y-r*0.45,x,y+r*0.45,x+r*0.6,y-r*0.15); ctx.stroke(); }
  else { ctx.moveTo(x-r*0.45,y); ctx.lineTo(x+r*0.45,y); ctx.stroke(); }
  ctx.restore(); }
// ---- the set and rarity emblem: a hexagon, finish by rarity, the set's mark inside (Tenth Tide: an X)
function emblem(ctx, x, y, r, rarity, mark){ ctx.save(); const R=RAR[rarity]||RAR.C; const hex=(rad)=>{ ctx.beginPath(); for (let i=0;i<6;i++){ const a=Math.PI/6+i*Math.PI/3; ctx[i?'lineTo':'moveTo'](x+Math.cos(a)*rad,y+Math.sin(a)*rad); } ctx.closePath(); };
  hex(r); let g; if (R.prism){ g=ctx.createLinearGradient(x-r,y-r,x+r,y+r); ['#ff9ad5','#ffd36e','#9cf7a8','#7ad8ff','#c3a2ff','#ff9ad5'].forEach((c,i)=>g.addColorStop(i/5,c)); } else { g=ctx.createLinearGradient(x,y-r,x,y+r); g.addColorStop(0,R.a); g.addColorStop(1,R.b); }
  ctx.fillStyle=g; ctx.fill(); ctx.lineWidth=r*0.14; ctx.strokeStyle='#0d0d0d'; ctx.stroke(); hex(r*0.78); ctx.lineWidth=r*0.06; ctx.strokeStyle=R.prism? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.35)'; ctx.stroke();
  ctx.fillStyle=R.t; ctx.font='bold '+Math.round(r*(mark.length>1?0.72:0.95))+'px '+TITLE; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(mark,x,y+r*0.06); ctx.restore(); }
function wrap(ctx, text, maxW){ const out=[]; for (const para of text.split('\n')){ const w=para.split(' '); let line=''; for (const word of w){ const t=line? line+' '+word : word; if (ctx.measureText(t).width>maxW && line){ out.push(line); line=word; } else line=t; } out.push(line); } return out; }
function drawCard(ctx, card, img, W){ const H=Math.round(W*88/63); const s=W/500; const F=FAC[card.f]||FAC.NE; ctx.save(); ctx.clearRect(0,0,W,H);
  // outer black edge and the faction frame
  rr(ctx,0,0,W,H,22*s); ctx.fillStyle='#0b0b0c'; ctx.fill();
  const fx=12*s, fy=12*s, fw=W-24*s, fh=H-58*s; const g=ctx.createLinearGradient(0,fy,0,fy+fh); g.addColorStop(0,F.l); g.addColorStop(0.18,F.c); g.addColorStop(0.82,F.c); g.addColorStop(1,F.d);
  rr(ctx,fx,fy,fw,fh,14*s); ctx.fillStyle=g; ctx.fill(); ctx.lineWidth=2*s; ctx.strokeStyle='rgba(255,255,255,0.35)'; ctx.stroke();
  // name bar with the cost
  const nx=fx+10*s, ny=fy+10*s, nw=fw-20*s, nh=44*s; parchment(ctx,nx,ny,nw,nh,10*s);
  const cr=17*s, ccx=nx+nw-cr-6*s, ccy=ny+nh/2; ctx.beginPath(); ctx.arc(ccx,ccy,cr,0,Math.PI*2); const cg=ctx.createRadialGradient(ccx-5*s,ccy-6*s,2*s,ccx,ccy,cr); cg.addColorStop(0,'#fffaf0'); cg.addColorStop(1,'#cbbd9c'); ctx.fillStyle=cg; ctx.fill(); ctx.lineWidth=2*s; ctx.strokeStyle='#2b2216'; ctx.stroke();
  ctx.fillStyle='#1d160c'; ctx.font='bold '+Math.round(23*s)+'px '+SERIF; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(String(card.cost),ccx,ccy+1*s);
  let px=ccx-cr-11*s; const pk= card.al==='L'? 'L' : card.al==='S'? 'S' : card.al==='D'? 'D' : null; if (pk) for (let i=0;i<card.req;i++){ pip(ctx,pk,px,ccy,9.5*s); px-=21*s; }
  const nameMax=px-nx-10*s+ (pk&&card.req? 9*s : 0); let fs=24; ctx.textAlign='left'; do { ctx.font='bold '+Math.round(fs*s)+'px '+SERIF; fs--; } while (ctx.measureText(card.n).width>nameMax && fs>12);
  ctx.fillStyle='#1d160c'; ctx.fillText(card.n, nx+12*s, ccy+1*s);
  // the art window (4:3)
  const ax=fx+16*s, ay=ny+nh+8*s, aw=fw-32*s, ah=Math.round(aw*3/4); ctx.save(); rr(ctx,ax,ay,aw,ah,4*s); ctx.clip();
  if (img && img.width){ const sw=img.width, sh=img.height, r=Math.max(aw/sw, ah/sh); ctx.drawImage(img, ax+(aw-sw*r)/2, ay+(ah-sh*r)/2, sw*r, sh*r); }
  else { ctx.fillStyle='#3b3f45'; ctx.fillRect(ax,ay,aw,ah); ctx.fillStyle='#c9ccd1'; ctx.font='bold '+Math.round(16*s)+'px '+SERIF; ctx.textAlign='center'; ctx.fillText('ART PENDING',ax+aw/2,ay+ah/2); }
  ctx.restore(); rr(ctx,ax,ay,aw,ah,4*s); ctx.lineWidth=3*s; ctx.strokeStyle='#1a1408'; ctx.stroke(); rr(ctx,ax-2*s,ay-2*s,aw+4*s,ah+4*s,6*s); ctx.lineWidth=1.5*s; ctx.strokeStyle='rgba(255,255,255,0.4)'; ctx.stroke();
  // type line with the faction icon
  const tx=nx, ty=ay+ah+8*s, tw=nw, th=34*s; parchment(ctx,tx,ty,tw,th,8*s);
  const typeLine=card.type+(card.sub? ' \u2014 '+card.sub : ''); fs=18; do { ctx.font='bold '+Math.round(fs*s)+'px '+SERIF; fs--; } while (ctx.measureText(typeLine).width>tw-60*s && fs>10);
  ctx.fillStyle='#1d160c'; ctx.textAlign='left'; ctx.fillText(typeLine, tx+12*s, ty+th/2+1*s);
  ctx.beginPath(); rr(ctx,tx+tw-36*s,ty+4*s,30*s,th-8*s,5*s); ctx.fillStyle=F.c; ctx.fill(); icon(ctx,F.icon,tx+tw-21*s,ty+th/2,21*s,'#fffaf0');
  // rules box: keyword line in bold, then the abilities; flavour in italics when a card has one
  const bx=nx+4*s, by=ty+th+8*s, bw=nw-8*s, bh=fy+fh-by-12*s; parchment(ctx,bx,by,bw,bh,8*s);
  const pad=14*s; const lines=[]; const kwl=card.kwline||''; const body=card.rules||'';
  let size=23; let L1=[], L2=[], L3=[]; const fit=()=>{ ctx.font='bold '+Math.round(size*s)+'px '+SERIF; L1=kwl? wrap(ctx,kwl,bw-2*pad) : []; ctx.font=Math.round(size*s)+'px '+SERIF; L2=body? wrap(ctx,body,bw-2*pad) : []; ctx.font='italic '+Math.round(size*s)+'px '+SERIF; L3=card.flavor? wrap(ctx,card.flavor,bw-2*pad) : []; return (L1.length+L2.length+L3.length)*size*1.25*s+(L3.length?6*s:0)+(L1.length&&L2.length?4*s:0); };
  while (fit()>bh-2*pad && size>10) size--;
  const lh=size*1.25*s; let yy=by+pad+lh*0.7; const total=fit(); if (total<bh-2*pad) yy+=Math.min(14*s,(bh-2*pad-total)*0.3);
  ctx.fillStyle='#1d160c'; ctx.textAlign='left'; ctx.textBaseline='alphabetic';
  ctx.font='bold '+Math.round(size*s)+'px '+SERIF; for (const l of L1){ ctx.fillText(l,bx+pad,yy); yy+=lh; } if (L1.length&&L2.length) yy+=4*s;
  ctx.font=Math.round(size*s)+'px '+SERIF; for (const l of L2){ ctx.fillText(l,bx+pad,yy); yy+=lh; }
  if (L3.length){ yy+=6*s; ctx.font='italic '+Math.round(size*s)+'px '+SERIF; ctx.fillStyle='#3d3222'; for (const l of L3){ ctx.fillText(l,bx+pad,yy); yy+=lh; } }
  // bottom: collector line, emblem, Power/Toughness
  const fyb=fy+fh; ctx.fillStyle='#e8e4da'; ctx.font=Math.round(12*s)+'px '+SERIF; ctx.textAlign='left'; ctx.textBaseline='middle';
  ctx.fillText(card.collector||'', fx+6*s, fyb+16*s); ctx.fillStyle='#a9a59c'; ctx.font=Math.round(10.5*s)+'px '+SERIF; ctx.fillText((card.setName||'').toUpperCase(), fx+6*s, fyb+32*s);
  emblem(ctx, W/2, fyb+4*s, 25*s, card.r, card.mark||'X');
  if (card.pt){ const bw2=78*s, bh2=40*s, bx2=fx+fw-bw2-4*s, by2=fyb-bh2/2+2*s; parchment(ctx,bx2,by2,bw2,bh2,10*s); ctx.lineWidth=2.5*s; ctx.strokeStyle='#1a1408'; rr(ctx,bx2,by2,bw2,bh2,10*s); ctx.stroke();
    ctx.fillStyle='#1d160c'; ctx.font='bold '+Math.round(24*s)+'px '+SERIF; ctx.textAlign='center'; ctx.fillText(card.pt, bx2+bw2/2, by2+bh2/2+1*s); }
  ctx.restore(); return H; }
const api={drawCard, icon, emblem, pip, FAC};
if (typeof module!=='undefined' && module.exports) module.exports=api; else root.TMRender=api;
})(typeof window!=='undefined'? window : this);
