// ===================== VISUALS: physical collectibles (proof of concept) =====================
// Velocity Chrome cards and Black Lantern Press comics get the new renderer. Everything else is unchanged.
const VF='font-family="Barlow Condensed,Arial Narrow,sans-serif"';
const r2=x=>Math.round(x*10)/10;
// ---------- pose engine: a jointed figure, so the same player can be photographed in many moments ----------
const POSES = {
  stance:  {lean:-6, arms:[40,160,70,170], legs:[-15,-5,18,5], bat:[200,82], helmet:1},
  swing:   {lean:8,  arms:[78,86,96,92], legs:[-32,-8,26,2], bat:[96,92], helmet:1, blur:1},
  follow:  {lean:-10,arms:[150,-140,-170,-122], legs:[-20,-8,32,-22], bat:[-62,86], helmet:1},
  run:     {lean:18, arms:[-38,58,48,150], legs:[-48,8,42,104], helmet:1, blur:1},
  field:   {lean:26, py:26, arms:[22,-6,-8,22], legs:[-42,10,42,-10], glove:'L'},
  throw:   {lean:-6, arms:[80,70,-122,-172], legs:[34,2,-26,-10], glove:'L', ball:'R'},
  pitch:   {lean:-4, arms:[40,150,-22,-152], legs:[100,6,2,0], glove:'L', ball:'R'},
  catch:   {lean:-4, py:-8, arms:[164,176,28,12], legs:[-10,0,16,24], glove:'L'},
  cheer:   {lean:0, arms:[-150,-168,150,168], legs:[-8,-3,8,3]},
  candid:  {lean:0, arms:[16,98,-16,-98], legs:[-6,-2,6,2], crop:'three'},
  portrait:{lean:0, arms:[-8,-4,8,4], legs:[-6,-2,6,2], crop:'close'},
  tip:     {lean:2, arms:[-8,-4,150,-128], legs:[-6,-2,6,2], crop:'three'}
};
const POSE_BAT=['stance','swing','follow','run','candid','portrait','cheer','tip','field','catch'], POSE_PIT=['pitch','throw','candid','portrait','cheer','tip','field'];
function pv(a,l){ const r=a*Math.PI/180; return [Math.sin(r)*l, Math.cos(r)*l]; }
function add2(p,q){ return [p[0]+q[0], p[1]+q[1]]; }
function poseFig(p, poseId, c1, c2, uid, flip){
  const P=POSES[poseId]||POSES.stance; const skin=SKIN[p.sk]; const jersey = lum(c1)>0.7 ? c2 : '#f2f2ee'; const pants='#e8e7e2';
  const pel=[125, 236+(P.py||0)]; const dir=pv(180+P.lean,1); const perp=[-dir[1], dir[0]];
  const sc=add2(pel, pv(180+P.lean, 84)); const head=add2(sc, pv(180+P.lean, 40));
  const sh=[[sc[0]-perp[0]*20, sc[1]-perp[1]*20],[sc[0]+perp[0]*20, sc[1]+perp[1]*20]];
  const hp=[[pel[0]-perp[0]*11, pel[1]-perp[1]*11],[pel[0]+perp[0]*11, pel[1]+perp[1]*11]];
  const A=P.arms, L=P.legs;
  const el=[add2(sh[0],pv(A[0],40)), add2(sh[1],pv(A[2],40))], hd=[add2(el[0],pv(A[1],37)), add2(el[1],pv(A[3],37))];
  const kn=[add2(hp[0],pv(L[0],50)), add2(hp[1],pv(L[2],50))], ft=[add2(kn[0],pv(L[1],52)), add2(kn[1],pv(L[3],52))];
  const seg=(a,b,c,w,col)=>`<path d="M${r2(a[0])} ${r2(a[1])} L${r2(b[0])} ${r2(b[1])} L${r2(c[0])} ${r2(c[1])}" stroke="${col}" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  const out=[];
  out.push(`<ellipse cx="125" cy="${r2(Math.max(ft[0][1],ft[1][1])+6)}" rx="62" ry="9" fill="#000" opacity=".28"/>`);
  // legs: pants, socks, cleats
  for (let i=0;i<2;i++){ out.push(seg(hp[i],kn[i],ft[i],18,pants)); const sk=add2(kn[i],[ (ft[i][0]-kn[i][0])*0.45, (ft[i][1]-kn[i][1])*0.45 ]); out.push(`<path d="M${r2(sk[0])} ${r2(sk[1])} L${r2(ft[i][0])} ${r2(ft[i][1])}" stroke="${c1}" stroke-width="15" stroke-linecap="round"/>`); out.push(`<ellipse cx="${r2(ft[i][0]+5)}" cy="${r2(ft[i][1]+3)}" rx="12" ry="6" fill="#16181b"/>`); }
  // torso with a little shading
  const tp=[sh[0], sh[1], [hp[1][0]+perp[0]*6, hp[1][1]+perp[1]*6], [hp[0][0]-perp[0]*6, hp[0][1]-perp[1]*6]];
  out.push(`<path d="M${tp.map(x=>r2(x[0])+' '+r2(x[1])).join(' L')} Z" fill="${jersey}" stroke="${shade(jersey,-0.35)}" stroke-width="1.5" stroke-linejoin="round"/>`);
  out.push(`<path d="M${r2(sc[0])} ${r2(sc[1])} L${r2(tp[2][0])} ${r2(tp[2][1])} L${r2(tp[1][0])} ${r2(tp[1][1])} Z" fill="#000" opacity=".08"/>`);
  out.push(`<path d="M${r2(sc[0])} ${r2(sc[1]+2)} L${r2(pel[0])} ${r2(pel[1]-6)}" stroke="${c1}" stroke-width="2" opacity=".6"/>`);
  out.push(`<path d="M${r2(tp[3][0])} ${r2(tp[3][1]-4)} L${r2(tp[2][0])} ${r2(tp[2][1]-4)}" stroke="${shade(c1,-0.2)}" stroke-width="6"/>`);
  const cx=(sc[0]+pel[0])/2, cy=(sc[1]+pel[1])/2-4;
  out.push(`<text x="${r2(cx+(flip?-10:10))}" y="${r2(cy)}" text-anchor="middle" ${VF} font-weight="800" font-size="22" fill="${c1}" ${flip?`transform="translate(${r2(2*(cx+(flip?-10:10)))},0) scale(-1,1)"`:''}>${p.num}</text>`);
  // arms: sleeves then forearms
  const arm=(i)=>{ const mid=add2(sh[i],[ (el[i][0]-sh[i][0])*0.55, (el[i][1]-sh[i][1])*0.55 ]); return `<path d="M${r2(sh[i][0])} ${r2(sh[i][1])} L${r2(mid[0])} ${r2(mid[1])}" stroke="${jersey}" stroke-width="15" stroke-linecap="round"/>`+seg(mid,el[i],hd[i],11,skin)+`<circle cx="${r2(hd[i][0])}" cy="${r2(hd[i][1])}" r="6.5" fill="${skin}"/>`; };
  const back = P.lean<0 ? 1 : 0;
  out.splice(1,0, arm(back));
  out.push(arm(1-back));
  // props
  if (P.bat){ const hm=[(hd[0][0]+hd[1][0])/2,(hd[0][1]+hd[1][1])/2]; const tip=add2(hm,pv(P.bat[0],P.bat[1])); const knob=add2(hm,pv(P.bat[0]+180,8));
    if (P.blur) out.push(`<path d="M${r2(hm[0])} ${r2(hm[1])} L${r2(tip[0])} ${r2(tip[1])}" stroke="#fff" stroke-width="16" opacity=".12" stroke-linecap="round"/>`);
    out.push(`<path d="M${r2(knob[0])} ${r2(knob[1])} L${r2(tip[0])} ${r2(tip[1])}" stroke="#b8894f" stroke-width="6" stroke-linecap="round"/><path d="M${r2(hm[0]+(tip[0]-hm[0])*0.55)} ${r2(hm[1]+(tip[1]-hm[1])*0.55)} L${r2(tip[0])} ${r2(tip[1])}" stroke="#9c6b35" stroke-width="10" stroke-linecap="round"/>`); }
  if (P.glove){ const g=hd[0]; out.push(`<ellipse cx="${r2(g[0])}" cy="${r2(g[1])}" rx="13" ry="11" fill="#7a4a22" stroke="#4b2a10" stroke-width="1.5"/><path d="M${r2(g[0]-7)} ${r2(g[1]-3)} q7 -6 14 0" stroke="#4b2a10" fill="none"/>`); }
  if (P.ball){ const b=hd[1]; out.push(`<circle cx="${r2(b[0])}" cy="${r2(b[1]-6)}" r="4.5" fill="#fafafa" stroke="#c33" stroke-width=".8"/>`); }
  if (P.blur) out.push(`<g opacity=".35" stroke="#fff" stroke-width="2">${[0,1,2].map(i=>`<path d="M${r2(sc[0]-60-i*10)} ${r2(sc[1]+20+i*18)} l-30 0"/>`).join('')}</g>`);
  // head: neck, face, ear, cap or helmet
  out.push(`<path d="M${r2(sc[0])} ${r2(sc[1])} L${r2(head[0])} ${r2(head[1]+12)}" stroke="${skin}" stroke-width="12"/>`);
  out.push(`<circle cx="${r2(head[0])}" cy="${r2(head[1])}" r="18" fill="${skin}"/><circle cx="${r2(head[0]-2)}" cy="${r2(head[1]+2)}" r="4" fill="${shade(skin,-0.15)}"/><circle cx="${r2(head[0]+9)}" cy="${r2(head[1]+1)}" r="1.8" fill="#222"/>`);
  if (P.helmet) out.push(`<path d="M${r2(head[0]-19)} ${r2(head[1]+2)} Q${r2(head[0]-19)} ${r2(head[1]-22)} ${r2(head[0])} ${r2(head[1]-22)} Q${r2(head[0]+19)} ${r2(head[1]-22)} ${r2(head[0]+19)} ${r2(head[1]-2)} L${r2(head[0]+27)} ${r2(head[1]-2)} L${r2(head[0]+27)} ${r2(head[1]+2)} Z" fill="${c1}" stroke="${shade(c1,-0.4)}" stroke-width="1"/><path d="M${r2(head[0]-19)} ${r2(head[1]+2)} q-2 10 8 12 l2 -12 Z" fill="${c1}"/><path d="M${r2(head[0]-8)} ${r2(head[1]-16)} q8 -4 16 0" stroke="#fff" stroke-width="3" opacity=".55" fill="none"/>`);
  else out.push(`<path d="M${r2(head[0]-18)} ${r2(head[1]-2)} Q${r2(head[0]-17)} ${r2(head[1]-22)} ${r2(head[0])} ${r2(head[1]-22)} Q${r2(head[0]+17)} ${r2(head[1]-22)} ${r2(head[0]+18)} ${r2(head[1]-4)} Z" fill="${c1}"/><path d="M${r2(head[0]+14)} ${r2(head[1]-5)} Q${r2(head[0]+30)} ${r2(head[1]-6)} ${r2(head[0]+34)} ${r2(head[1]-1)} L${r2(head[0]+14)} ${r2(head[1]-1)} Z" fill="${shade(c1,-0.3)}"/><circle cx="${r2(head[0])}" cy="${r2(head[1]-22)}" r="2" fill="${shade(c1,-0.3)}"/>`);
  let g=out.join('');
  const crop=P.crop||'full';
  const ctf = crop==='three'? 'translate(125 185) scale(1.5) translate(-125 -165)' : crop==='close'? `translate(125 170) scale(2.4) translate(${-r2(head[0])} ${-r2(head[1]+8)})` : '';
  return `<g transform="${flip?'translate(250,0) scale(-1,1) ':''}${ctf}">${g}</g>`;
}
function poseFor(d, p){
  const pit = isPitcher(p); const lib = pit? POSE_PIT : POSE_BAT;
  let h = hsh(d.prod.id+'|'+d.sec+'|'+d.no+'|'+p.id); // parallels share the photo; variations and other sets don't
  if (d.variation) h = hsh('var'+d.prod.id+d.no+d.sec);
  if (d.auto) return lib[(h>>3)%3===0?4:(h%lib.length)];
  return lib[h%lib.length];
}
// ---------- materials ----------
function stockNoise(uid, op){ let dots=''; const r=mkRng(hsh('noise'+uid)); for (let i=0;i<40;i++) dots+=`<rect x="${(r()*24).toFixed(1)}" y="${(r()*24).toFixed(1)}" width="1" height="1" fill="${r()<0.5?'#fff':'#000'}"/>`; return `<pattern id="nz${uid}" width="24" height="24" patternUnits="userSpaceOnUse">${dots}</pattern>`; }
function chromeGrad(id, tint){ const t=tint||'#9aa4ae'; return `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${shade(t,-0.55)}"/><stop offset=".22" stop-color="${shade(t,0.55)}"/><stop offset=".38" stop-color="${shade(t,-0.2)}"/><stop offset=".55" stop-color="${shade(t,0.75)}"/><stop offset=".72" stop-color="${shade(t,-0.35)}"/><stop offset="1" stop-color="${shade(t,0.35)}"/></linearGradient>`; }
function prismPattern(id, op){ const hues=['#ff4d6d','#ffb703','#8ac926','#1fb5ff','#8d5cf6','#ff4d6d']; return `<pattern id="${id}" width="30" height="30" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)">${hues.map((c,i)=>`<rect x="${i*5}" width="5" height="30" fill="${c}" opacity="${op}"/>`).join('')}</pattern>`; }
// ---------- Velocity Chrome ----------
function velStage(uid, c1, c2, kind){
  const r=mkRng(hsh('st'+uid));
  if (kind==='launch'){ let o=`<rect width="250" height="350" fill="url(#bg${uid})"/>`; o+=`<path d="M20 330 Q125 -40 250 150" stroke="#8fd3ff" stroke-width="2" fill="none" stroke-dasharray="6 5" opacity=".7"/>`; for (let a=10;a<=45;a+=5){ const x=40+a*4; o+=`<path d="M${x} 330 l0 -8" stroke="#8fd3ff" opacity=".5"/><text x="${x}" y="318" ${VF} font-size="8" fill="#8fd3ff" opacity=".6" text-anchor="middle">${a}°</text>`; } return o; }
  if (kind==='nextup'){ let o=`<rect width="250" height="350" fill="url(#bg${uid})"/>`; for (let i=0;i<7;i++) o+=`<rect x="${20+i*32}" y="${330-40-i*28}" width="22" height="${40+i*28}" fill="${c1}" opacity="${0.12+i*0.04}"/>`; return o; }
  if (kind==='vortex'){ let o=`<rect width="250" height="350" fill="#07080c"/>`; for (let i=14;i>0;i--) o+=`<ellipse cx="125" cy="170" rx="${i*16}" ry="${i*12}" fill="none" stroke="${['#3c7dd9','#9b59d0','#20b2aa','#e84393','#f4d35e'][i%5]}" stroke-width="5" opacity=".35" transform="rotate(${i*13} 125 170)"/>`; return o; }
  let o=`<rect width="250" height="350" fill="url(#bg${uid})"/>`;
  for (let i=0;i<9;i++){ const x=r()*250, y=20+r()*90, s=6+r()*18; o+=`<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${s.toFixed(0)}" fill="#fff" opacity="${(0.04+r()*0.08).toFixed(2)}"/>`; }
  o+=`<rect x="0" y="150" width="250" height="60" fill="${shade(c1,-0.6)}" opacity=".6"/>`;
  for (let i=0;i<70;i++) o+=`<rect x="${(r()*250).toFixed(0)}" y="${(152+r()*55).toFixed(0)}" width="2" height="2" fill="${r()<0.3?c2:'#fff'}" opacity="${(0.15+r()*0.2).toFixed(2)}"/>`;
  o+=`<path d="M0 262 Q125 236 250 262 L250 350 L0 350 Z" fill="#2f6b3a"/><path d="M0 262 Q125 236 250 262" stroke="#e9e2cf" stroke-width="3" fill="none" opacity=".6"/><path d="M40 350 Q125 286 210 350" fill="#b88a5a" opacity=".55"/>`;
  return o;
}
function velFront(key, serial, opts){
  opts=opts||{};
  const d=D(key), p=P(d.pid), br=B(d.prod), yr=d.prod.yr;
  const car=p.car[yr-1]; const tmOnCard=(car&&car.t>=0)?car.t:(p.tm>=0?p.tm:p.org); const T=TEAMS_DEF[tmOnCard]||TEAMS_DEF[0]; const c1=T[3], c2=T[4];
  const uid=(hsh(key+'#'+serial+'v2')%1e7).toString(36); const par=d.parObj; const run=d.run||0;
  const name=pname(p); const flip=hsh(p.id+'f'+d.sec)%3===0;
  const kind = d.caseHit?'vortex': d.ins? (br.ins[+d.sec.slice(1)].n==='Launch Angle'?'launch':'nextup') : 'base';
  const tintCol = par? par.col : '#c8d1da';
  const low = run && run<=25; const one = run===1; const red = run===5;
  const frameId = par && par.fin==='super' ? `url(#gold${uid})` : `url(#ch${uid})`;
  const pose = poseFor(d,p);
  const bgA = kind==='launch'?'#0b1636': kind==='nextup'? shade(c1,-0.55) : (red? '#12060a' : '#0a1224'), bgB = kind==='launch'?'#123a6b': kind==='nextup'? shade(c2,-0.35) : shade(c1,-0.45);
  const defs = `<defs>${chromeGrad('ch'+uid, par&&par.fin!=='super'?tintCol:'#aab4be')}${chromeGrad('gold'+uid,'#d9b44a')}${prismPattern('pr'+uid, par&&par.fin==='refr'?0.55:0.3)}${stockNoise(uid)}
    <linearGradient id="bg${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${bgA}"/><stop offset="1" stop-color="${bgB}"/></linearGradient>
    <radialGradient id="vg${uid}" cx=".5" cy=".42" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></radialGradient>
    <linearGradient id="gl${uid}" x1="0" y1="0" x2="1" y2="1"><stop offset=".3" stop-color="#fff" stop-opacity="0"/><stop offset=".45" stop-color="#fff" stop-opacity=".22"/><stop offset=".52" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <clipPath id="cc${uid}"><rect width="250" height="350" rx="12"/></clipPath><clipPath id="ph${uid}"><path d="M14 14 H236 V300 L200 336 H14 Z"/></clipPath></defs>`;
  let o='';
  // 1. the chrome slab of card stock
  o += `<rect width="250" height="350" rx="12" fill="${frameId}"/>`;
  if (par && par.fin==='refr') o += `<rect width="250" height="350" rx="12" fill="url(#pr${uid})" style="mix-blend-mode:overlay"/>`;
  if (one) o += Array.from({length:10},(_,i)=>`<circle cx="125" cy="175" r="${40+i*22}" fill="none" stroke="#fff3c4" stroke-width="3" opacity=".25"/>`).join('');
  // 2. the photo window, with Velocity's signature clipped corner
  o += `<g clip-path="url(#ph${uid})">${velStage(uid,c1,c2,kind)}${poseFig(p,pose,c1,c2,uid,flip)}<rect width="250" height="350" fill="url(#vg${uid})"/>${par&&par.fin==='refr'?`<rect width="250" height="350" fill="url(#pr${uid})" opacity="${low?0.16:0.1}" style="mix-blend-mode:screen"/><rect width="250" height="350" fill="${tintCol}" opacity="${run?0.12:0.05}" style="mix-blend-mode:overlay"/>`:''}${red?'<rect width="250" height="350" fill="#b3122e" opacity=".22" style="mix-blend-mode:multiply"/>':''}</g>`;
  o += `<path d="M14 14 H236 V300 L200 336 H14 Z" fill="none" stroke="${shade(tintCol,0.6)}" stroke-width="1.2" opacity=".9"/><path d="M15 15 H235" stroke="#fff" stroke-width="1" opacity=".5"/>`;
  // 3. speed chevrons down the left edge, the Velocity mark
  o += `<g opacity=".9">${[0,1,2].map(i=>`<path d="M14 ${60+i*16} L${34-i*4} ${70+i*16} L14 ${80+i*16} Z" fill="${frameId}" stroke="#0006" stroke-width=".6"/>`).join('')}</g>`;
  o += `<g transform="translate(232 36)"><text text-anchor="end" ${VF} font-style="italic" font-weight="800" font-size="17" letter-spacing="1" fill="#fff" stroke="#0008" stroke-width=".8" paint-order="stroke">VELOCITY</text><path d="M-86 5 L-40 5 M-80 9 L-46 9" stroke="${shade(tintCol,0.4)}" stroke-width="1.5"/></g>`;
  if (kind==='launch') o += `<text x="42" y="62" ${VF} font-weight="800" font-size="15" letter-spacing="2" fill="#8fd3ff">LAUNCH ANGLE</text>`;
  if (kind==='nextup') o += `<text transform="translate(30 250) rotate(-90)" ${VF} font-weight="800" font-size="30" letter-spacing="3" fill="#fff" opacity=".85">NEXT UP</text>`;
  if (kind==='vortex') o += `<text x="125" y="64" text-anchor="middle" font-family="Georgia,serif" font-size="13" letter-spacing="4" fill="#f4e3a1">VORTEX</text>`;
  // 4. the name bar: a slanted chrome plate
  const nb = `<g transform="translate(0 286)"><path d="M10 0 H176 L160 40 H10 Z" fill="${frameId}" stroke="#0007" stroke-width=".8"/><path d="M12 2 H173" stroke="#fff" stroke-width="1" opacity=".6"/>
    <text x="20" y="25" ${VF} font-style="italic" font-weight="800" font-size="22" fill="#0e1116" textLength="${Math.min(146,name.length*11.5)}" lengthAdjust="spacingAndGlyphs">${esc(name.toUpperCase())}</text>
    <text x="21" y="36" ${VF} font-weight="600" font-size="8.5" letter-spacing="1.5" fill="#1b2027">${esc((T[0]+' '+T[1]).toUpperCase())} · ${p.pos}</text></g>`;
  o += nb;
  // 5. position hex, card number, RC shield
  o += `<g transform="translate(26 26)"><path d="M0 -12 L10 -6 L10 6 L0 12 L-10 6 L-10 -6 Z" fill="${frameId}" stroke="#0008"/><text y="4" text-anchor="middle" ${VF} font-weight="800" font-size="10" fill="#0e1116">${p.pos}</text></g>`;
  o += `<text x="236" y="330" text-anchor="end" ${VF} font-size="8" fill="#fff" opacity=".75">${esc(d.cardNo)}</text>`;
  if (d.rc) o += `<g transform="translate(212 60)"><path d="M0 0 H22 V16 L11 24 L0 16 Z" fill="${frameId}" stroke="#000a"/><text x="11" y="13" text-anchor="middle" ${VF} font-weight="800" font-size="11" fill="#b0141c">RC</text><text x="11" y="31" text-anchor="middle" ${VF} font-size="5.5" letter-spacing="1" fill="#fff">ROOKIE</text></g>`;
  if (d.first) o += `<g transform="translate(40 18)"><rect width="36" height="14" rx="2" fill="#111"/><text x="18" y="10.5" text-anchor="middle" ${VF} font-weight="800" font-size="9" fill="#f2c230">1ST BOWMAN</text></g>`.replace('1ST BOWMAN','1ST CARD');
  // 6. the autograph, signed straight onto the chrome
  if (d.auto) o += `<g transform="translate(40 206)"><rect width="176" height="58" rx="6" fill="#fff" opacity=".9"/><path d="${sigPath(name)}" transform="translate(-4,32) scale(.86)" fill="none" stroke="#1d3fa3" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><text x="88" y="54" text-anchor="middle" ${VF} font-size="6" letter-spacing="1.5" fill="#556">CERTIFIED AUTOGRAPH ISSUE</text><ellipse cx="160" cy="12" rx="9" ry="6" fill="url(#pr${uid})" stroke="#999" stroke-width=".5"/></g>`;
  // 7. serial numbering, stamped in foil; the lower the run, the more it matters
  if (run && serial){ const sTxt = one? '1/1' : String(serial).padStart(String(run).length,'0')+'/'+run;
    if (one) o += `<g transform="translate(206 318)"><circle r="20" fill="url(#gold${uid})" stroke="#6b5010"/><text y="6" text-anchor="middle" ${VF} font-weight="800" font-size="17" fill="#3a2a05">1/1</text></g><text x="125" y="345" text-anchor="middle" ${VF} font-size="6.5" letter-spacing="3" fill="#6b5010">SUPERFRACTOR</text>`;
    else { const big = run<=25; const w=big?58:48; o += `<g transform="translate(${226-w} ${big?300:306})" class="vser"><rect width="${w}" height="${big?22:18}" rx="3" fill="${big?'url(#gold'+uid+')':'url(#ch'+uid+')'}" stroke="#0009" stroke-width=".8"/><text x="${w/2}" y="${big?16:13}" text-anchor="middle" ${VF} font-weight="800" font-size="${big?15:12}" fill="#fff" opacity=".6" transform="translate(.6 .6)">${sTxt}</text><text x="${w/2}" y="${big?16:13}" text-anchor="middle" ${VF} font-weight="800" font-size="${big?15:12}" fill="${big?'#3a2a05':'#10141a'}">${sTxt}</text></g>`; } }
  if (d.variation) o += `<text x="236" y="276" text-anchor="end" ${VF} font-size="6" letter-spacing="1" fill="#fff" opacity=".6">${d.sec==='w'?'SSP':'SP'}</text>`;
  // 8. physical surface: stock texture, gloss sweep, edge bevel
  o += `<rect width="250" height="350" rx="12" fill="url(#nz${uid})" opacity=".08"/><rect width="250" height="350" rx="12" fill="url(#gl${uid})"/>`;
  o += `<rect x=".75" y=".75" width="248.5" height="348.5" rx="11.5" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="1.5"/><rect x="2" y="2" width="246" height="346" rx="10.5" fill="none" stroke="#000" stroke-opacity=".35" stroke-width="1"/>`;
  return `<svg viewBox="0 0 250 350" xmlns="http://www.w3.org/2000/svg" class="cardsvg v2" data-fin="${par?par.fin:'chrome'}" role="img" aria-label="${esc(name+' '+yr+' '+br.name+' '+d.title)}">${defs}<g clip-path="url(#cc${uid})">${o}</g></svg>`;
}
const VCC=new Map();
function isV2Card(key){ const d=D(key); return B(d.prod).tmpl==='vel'; }
(function(){ const cf=cardFront; cardFront=function(key, serial, opts){ if (isV2Card(key)){ const ck=key+'#'+serial; let s=VCC.get(ck); if (!s){ s=velFront(key,serial,opts); VCC.set(ck,s); if (VCC.size>400) VCC.delete(VCC.keys().next().value); } return s; } return cf(key, serial, opts); }; })();
// condition shows up, subtly, when you look closely at a raw card
function cardCondOverlay(c){
  const cond=c.c; const out=[]; const r=mkRng(c.id*97);
  const cor=cond[1], edg=cond[2], sur=cond[3];
  if (cor<92){ const n=cor<75?4:cor<85?2:1; const pts=[[4,4],[246,4],[4,346],[246,346]]; for (let i=0;i<n;i++){ const [x,y]=pts[Math.floor(r()*4)]; out.push(`<circle cx="${x}" cy="${y}" r="${cor<75?7:4.5}" fill="#f4f1e8" opacity="${cor<75?0.8:0.55}"/>`); } }
  if (edg<90){ for (let i=0;i<(edg<75?14:6);i++){ const side=Math.floor(r()*4); const t=r(); const x= side===0?t*250: side===1?249: side===2?t*250:1; const y= side===0?1: side===1?t*350: side===2?349: t*350; out.push(`<rect x="${(x-1).toFixed(1)}" y="${(y-1).toFixed(1)}" width="${(1.5+r()*3).toFixed(1)}" height="1.6" fill="#f4f1e8" opacity=".75"/>`); } }
  if (sur<90){ for (let i=0;i<(sur<75?5:2);i++){ const x=30+r()*190, y=40+r()*270; out.push(`<path d="M${x.toFixed(0)} ${y.toFixed(0)} l${(20+r()*50).toFixed(0)} ${(r()*14-7).toFixed(0)}" stroke="#fff" stroke-width=".7" opacity=".35"/>`); } }
  return out.join('');
}
function withCond(svg, c){ if (!c || c.g!==0) return svg; const ov=cardCondOverlay(c); return ov? svg.slice(0, svg.lastIndexOf('</svg>'))+ov+'</svg>' : svg; }

// ---------- Black Lantern Press comics ----------
const BLP_MARK = (x,y,s,col)=>`<g transform="translate(${x} ${y}) scale(${s})"><rect x="-9" y="-13" width="18" height="26" rx="3" fill="${col}"/><path d="M-6 -9 H6 V8 H-6 Z" fill="#f7d774"/><path d="M-3 -17 H3 M0 -17 V-13" stroke="${col}" stroke-width="2.5"/><path d="M-4 12 H4" stroke="${col}" stroke-width="3"/></g>`;
function isBLP(key){ const d=cmD(key); return d.s.pub>=0 && G.cm.pubs[d.s.pub].sh==='BLP'; }
function blpArt(tpl, r, P, W, H, lead){
  const [ink, acc, paper] = P; let o='';
  if (tpl==='face'){ // huge face in profile with rim light
    o += `<rect width="${W}" height="${H}" fill="${ink}"/><circle cx="${W*0.72}" cy="${H*0.3}" r="70" fill="${acc}" opacity=".85"/>`;
    o += `<path d="M${W*0.95} ${H} L${W*0.95} ${H*0.62} Q${W*0.55} ${H*0.6} ${W*0.52} ${H*0.5} L${W*0.44} ${H*0.47} L${W*0.5} ${H*0.43} Q${W*0.46} ${H*0.38} ${W*0.5} ${H*0.33} Q${W*0.52} ${H*0.2} ${W*0.68} ${H*0.16} Q${W*0.9} ${H*0.13} ${W} ${H*0.25} L${W} ${H} Z" fill="#050505"/>`;
    o += `<path d="M${W*0.5} ${H*0.33} Q${W*0.52} ${H*0.2} ${W*0.68} ${H*0.16}" stroke="${paper}" stroke-width="2.5" fill="none" opacity=".9"/><path d="M${W*0.44} ${H*0.47} L${W*0.5} ${H*0.43}" stroke="${paper}" stroke-width="2" opacity=".8"/><circle cx="${W*0.56}" cy="${H*0.36}" r="3" fill="${acc}"/>`;
  } else if (tpl==='door'){ // figure in a lit doorway
    o += `<rect width="${W}" height="${H}" fill="${shade(ink,0.05)}"/><path d="M${W*0.38} ${H*0.22} H${W*0.66} V${H*0.78} H${W*0.38} Z" fill="${acc}"/><path d="M${W*0.38} ${H*0.78} L${W*0.66} ${H*0.78} L${W} ${H} L0 ${H} Z" fill="${acc}" opacity=".35"/>`;
    o += `<path d="M${W*0.52} ${H*0.4} a9 9 0 1 1 0.1 0 Z" fill="#050505"/><path d="M${W*0.45} ${H*0.78} L${W*0.47} ${H*0.46} Q${W*0.52} ${H*0.42} ${W*0.57} ${H*0.46} L${W*0.59} ${H*0.78} Z" fill="#050505"/><path d="M${W*0.52} ${H*0.78} L${W*0.3} ${H} L${W*0.74} ${H} Z" fill="#050505" opacity=".7"/>`;
  } else if (tpl==='loom'){ // something enormous above a small figure
    o += `<rect width="${W}" height="${H}" fill="${ink}"/><path d="M0 ${H*0.82} Q${W*0.5} ${H*0.76} ${W} ${H*0.84} V${H} H0 Z" fill="${shade(ink,-0.4)}"/>`;
    for (let i=0;i<7;i++){ const x=W*(0.1+i*0.13); o += `<path d="M${x} -10 Q${x+(r()-0.5)*80} ${H*0.3} ${x+(r()-0.5)*60} ${H*(0.45+r()*0.2)}" stroke="#050505" stroke-width="${10-i%3*2}" fill="none" stroke-linecap="round"/>`; }
    o += `<circle cx="${W*0.42}" cy="${H*0.22}" r="6" fill="${acc}"/><circle cx="${W*0.58}" cy="${H*0.22}" r="6" fill="${acc}"/><path d="M${W*0.5} ${H*0.84} l-5 -30 a5 5 0 1 1 10 0 Z" fill="${paper}"/><circle cx="${W*0.5}" cy="${H*0.66}" r="5" fill="${paper}"/><path d="M${W*0.45} ${H*0.76} l-8 6" stroke="#f7d774" stroke-width="3"/><circle cx="${W*0.43}" cy="${H*0.78}" r="4" fill="#f7d774"/>`;
  } else if (tpl==='land'){ // moon over a treeline, a lantern on the road
    o += `<rect width="${W}" height="${H}" fill="${ink}"/><circle cx="${W*0.66}" cy="${H*0.3}" r="44" fill="${paper}" opacity=".95"/><circle cx="${W*0.62}" cy="${H*0.28}" r="44" fill="${ink}" opacity=".15"/>`;
    let tr=''; for (let x=-10;x<W+20;x+=14){ const h=H*(0.5+r()*0.15); tr+=`L${x} ${h} L${x+7} ${h-30-r()*30} L${x+14} ${h} `; } o += `<path d="M-10 ${H} ${tr} L${W+20} ${H} Z" fill="#050505"/>`;
    o += `<path d="M${W*0.46} ${H} L${W*0.5} ${H*0.7} L${W*0.54} ${H*0.7} L${W*0.62} ${H} Z" fill="${shade(ink,0.2)}"/><circle cx="${W*0.52}" cy="${H*0.74}" r="3" fill="#f7d774"/><circle cx="${W*0.52}" cy="${H*0.74}" r="12" fill="#f7d774" opacity=".2"/>`;
  } else if (tpl==='eye'){ // one enormous eye
    o += `<rect width="${W}" height="${H}" fill="${ink}"/><path d="M${W*0.05} ${H*0.46} Q${W*0.5} ${H*0.2} ${W*0.95} ${H*0.46} Q${W*0.5} ${H*0.72} ${W*0.05} ${H*0.46} Z" fill="${paper}"/><circle cx="${W*(0.42+r()*0.16)}" cy="${H*0.46}" r="${W*0.16}" fill="${acc}"/><circle cx="${W*0.5}" cy="${H*0.46}" r="${W*0.07}" fill="#050505"/><circle cx="${W*0.46}" cy="${H*0.42}" r="4" fill="#fff" opacity=".8"/>`;
    for (let i=0;i<9;i++){ const x=W*(0.1+i*0.1); o += `<path d="M${x} ${H*0.33+Math.abs(4-i)*3} l${(i-4)*3} -${14+r()*10}" stroke="${paper}" stroke-width="2"/>`; }
    o += `<path d="M${W*0.5} ${H*0.6} q${(r()-0.5)*20} 60 ${(r()-0.5)*30} 120" stroke="${acc}" stroke-width="5" fill="none" opacity=".8"/>`;
  } else if (tpl==='city'){ // noir street in the rain
    o += `<rect width="${W}" height="${H}" fill="${ink}"/>`; let x=-5; while (x<W){ const w=18+r()*30, h=H*(0.3+r()*0.35); o+=`<rect x="${x}" y="${H-h-40}" width="${w}" height="${h}" fill="${shade(ink,0.12+r()*0.1)}"/>`; for (let wy=H-h-30; wy<H-50; wy+=12) for (let wx=x+4; wx<x+w-4; wx+=8) if (r()<0.25) o+=`<rect x="${wx}" y="${wy}" width="3" height="5" fill="${acc}" opacity=".8"/>`; x+=w+2; }
    o += `<rect y="${H-40}" width="${W}" height="40" fill="#050505"/><path d="M${W*0.3} ${H-40} L${W*0.1} ${H} M${W*0.7} ${H-40} L${W*0.9} ${H}" stroke="${acc}" opacity=".25"/>`;
    const fx=W*(0.35+r()*0.3); o += `<path d="M${fx-10} ${H-40} L${fx-8} ${H-86} Q${fx} ${H-94} ${fx+8} ${H-86} L${fx+10} ${H-40} Z" fill="#050505"/><path d="M${fx-16} ${H-100} H${fx+16} L${fx+10} ${H-106} H${fx-10} Z" fill="#050505"/><circle cx="${fx}" cy="${H-98}" r="7" fill="#050505"/>`;
    for (let i=0;i<60;i++){ const rx=r()*W, ry=r()*H; o+=`<path d="M${rx.toFixed(0)} ${ry.toFixed(0)} l-3 10" stroke="${paper}" opacity=".3"/>`; }
  } else if (tpl==='hands'){ // hands reaching up out of the dark
    o += `<rect width="${W}" height="${H}" fill="${ink}"/><rect y="${H*0.1}" width="${W}" height="${H*0.3}" fill="${acc}" opacity=".35"/>`;
    for (let i=0;i<5;i++){ const x=W*(0.12+i*0.19)+(r()-0.5)*14, top=H*(0.35+r()*0.2); o+=`<path d="M${x-8} ${H} L${x-7} ${top+30} L${x-12} ${top} M${x-7} ${top+30} L${x-3} ${top-6} M${x-3} ${top+30} L${x+2} ${top-8} M${x+1} ${top+30} L${x+7} ${top-2} M${x+5} ${top+34} L${x+14} ${top+18} M${x+8} ${top+30} L${x+8} ${H}" stroke="${paper}" stroke-width="5" stroke-linecap="round" fill="none" opacity=".9"/>`; }
  } else if (tpl==='portrait'){ // a character bust, lit from the side
    const cx=W*(0.4+r()*0.2); o += `<rect width="${W}" height="${H}" fill="${acc}"/><circle cx="${cx}" cy="${H*0.4}" r="${W*0.34}" fill="${shade(acc,0.25)}"/>`;
    o += `<path d="M${cx-58} ${H} Q${cx-60} ${H*0.66} ${cx} ${H*0.62} Q${cx+60} ${H*0.66} ${cx+58} ${H} Z" fill="${ink}"/><rect x="${cx-12}" y="${H*0.5}" width="24" height="${H*0.13}" fill="${paper}"/><ellipse cx="${cx}" cy="${H*0.42}" rx="32" ry="40" fill="${paper}"/><path d="M${cx} ${H*0.3} Q${cx+36} ${H*0.32} ${cx+32} ${H*0.52} Q${cx+10} ${H*0.56} ${cx} ${H*0.54} Z" fill="${ink}" opacity=".45"/>`;
    o += `<path d="M${cx-34} ${H*0.36} Q${cx} ${H*0.2} ${cx+34} ${H*0.36} Q${cx+20} ${H*0.3} ${cx} ${H*0.31} Q${cx-20} ${H*0.3} ${cx-34} ${H*0.36} Z" fill="#050505"/><circle cx="${cx-11}" cy="${H*0.43}" r="3" fill="#050505"/><circle cx="${cx+11}" cy="${H*0.43}" r="3" fill="#050505"/><path d="M${cx-8} ${H*0.5} q8 4 16 0" stroke="#050505" stroke-width="2" fill="none"/>`;
  } else { // typographic: title as the image
    const sym=Math.floor(r()*5), cx=W*0.5, cy=H*0.52;
    o += `<rect width="${W}" height="${H}" fill="${paper}"/><rect x="${W*0.14}" y="${H*0.3}" width="${W*0.72}" height="${H*0.44}" fill="${ink}"/>`;
    o += sym===0? `<circle cx="${cx}" cy="${cy}" r="${W*0.17}" fill="${acc}"/><path d="M${cx} ${H*0.4} V${H*0.64} M${W*0.38} ${cy} H${W*0.62}" stroke="${ink}" stroke-width="4"/>`
      : sym===1? `<circle cx="${cx}" cy="${cy}" r="${W*0.17}" fill="${acc}"/><circle cx="${cx+14}" cy="${cy-8}" r="${W*0.15}" fill="${ink}"/>`
      : sym===2? `<circle cx="${cx}" cy="${cy-24}" r="18" fill="none" stroke="${acc}" stroke-width="8"/><path d="M${cx} ${cy-6} V${cy+44} M${cx} ${cy+30} h14 M${cx} ${cy+40} h10" stroke="${acc}" stroke-width="8"/>`
      : sym===3? `<path d="M${cx} ${cy-40} C${cx+40} ${cy+10} ${cx+20} ${cy+40} ${cx} ${cy+40} C${cx-20} ${cy+40} ${cx-40} ${cy+10} ${cx} ${cy-40} Z" fill="${acc}"/>`
      : `<path d="M${cx-40} ${cy+10} Q${cx-10} ${cy-30} ${cx+40} ${cy-6} Q${cx} ${cy-4} ${cx-4} ${cy+30} Q${cx-10} ${cy+8} ${cx-40} ${cy+10} Z" fill="${acc}"/>`;
  }
  return o;
}
function blpCover(key){
  const d=cmD(key), s=d.s; const W=200, H=300; const uid=hsh('b'+key).toString(36);
  const yr=yearOf(issueDay(s, d.n||1)); const age=yearOf(G.day)-yr;
  const k=CG[s.g].k; const P = (k==='horror'? ['#120a0c','#b3122e','#efe4c8'] : k==='crime'||k==='thriller'||k==='mystery'? ['#0f1115','#e8b923','#f2ecdc'] : k==='fantasy'? ['#0d2226','#caa24a','#efe8d2'] : ['#1a1714','#c0492f','#efe6d4']).slice();
  const rs=hsh(s.id+'|'+(d.n||0)+'|'+(d.v||'')); const r=mkRng(rs);
  const TPL = {horror:['face','door','loom','land','eye','hands'], crime:['city','door','face','portrait'], thriller:['city','face','door','eye'], mystery:['city','door','eye','portrait'], fantasy:['land','loom','portrait','face']}[k] || ['portrait','land','door','face','type'];
  const tpls = yr>=2010 ? TPL.concat(['type']) : TPL; const tpl = tpls[((d.v && d.v!=='B') ? (rs>>3) : rs) % tpls.length];
  const ps = hsh('pal'+s.id)%3; if (ps===1) P[1]=shade(P[1],-0.3); if (ps===2) P[1]=shade(P[1],0.25);
  const lead=s.ch.length?CH_(s.ch[0]):null; const title=s.t.toUpperCase();
  const virgin=/^V/.test(d.v||''); const sketch=/^S/.test(d.v||'');
  let art = blpArt(tpl, r, sketch? ['#ffffff','#dddddd','#ffffff'] : P, W, H, lead);
  if (sketch) art = `<g filter="url(#sk${uid})">${art}</g>`;
  const W_=CR_(s.w), A_=CR_(s.a); const credits = (W_===A_? W_.n : W_.n.split(' ').pop()+' / '+A_.n.split(' ').pop()).toUpperCase();
  const ks = d.tr? [] : issueKeys(s, d.n); const fa = ks.find(x=>x[1]==='fa'||x[1]==='team');
  let dress='';
  if (!virgin){
    if (yr<1990){ // 80s indie: black band, lantern box, serif masthead, a blurb
      dress += `<rect width="${W}" height="58" fill="#0a0a0a"/>${BLP_MARK(20,29,1,'#e8e2cf')}<text x="36" y="18" ${VF} font-size="8" letter-spacing="1" fill="#e8e2cf">BLACK LANTERN</text><text x="36" y="27" ${VF} font-size="8" fill="#e8e2cf">No. ${d.n} · $${d.cp.toFixed(2)}</text>`;
      dress += `<text x="${W-8}" y="50" text-anchor="end" font-family="Georgia,serif" font-weight="700" font-size="${Math.min(26, 330/Math.max(8,title.length))}" fill="${P[1]}" textLength="${Math.min(150, title.length*12)}" lengthAdjust="spacingAndGlyphs">${esc(title)}</text>`;
      if (fa) dress += `<g transform="translate(14 ${H-58}) rotate(-4)"><rect width="104" height="30" fill="${P[2]}" stroke="#0a0a0a" stroke-width="2"/><text x="52" y="13" text-anchor="middle" ${VF} font-weight="800" font-size="9" fill="#0a0a0a">INTRODUCING</text><text x="52" y="25" text-anchor="middle" ${VF} font-weight="800" font-size="10" fill="${P[1]}" textLength="${Math.min(96,CH_(fa[2]).n.length*5.5)}" lengthAdjust="spacingAndGlyphs">${esc(CH_(fa[2]).n.toUpperCase())}!</text></g>`;
    } else if (yr<2000){ // 90s: big shiny logo, collector's banner
      dress += `<defs><linearGradient id="t9${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".5" stop-color="${P[1]}"/><stop offset="1" stop-color="${shade(P[1],-0.5)}"/></linearGradient></defs>
        <text x="${W/2}" y="46" text-anchor="middle" ${VF} font-weight="800" font-size="36" fill="url(#t9${uid})" stroke="#000" stroke-width="1.5" paint-order="stroke" textLength="${Math.min(186,title.length*17)}" lengthAdjust="spacingAndGlyphs">${esc(title)}</text>${BLP_MARK(20,H-24,0.9,'#e8e2cf')}<text x="34" y="${H-14}" ${VF} font-weight="800" font-size="13" fill="#fff" stroke="#000" stroke-width="1.5" paint-order="stroke">#${d.n}</text>`;
      if (d.n===1) dress += `<rect x="0" y="${H-54}" width="${W}" height="15" fill="#f2c230" transform="rotate(-5 ${W/2} ${H-46})"/><text x="${W/2}" y="${H-43}" text-anchor="middle" ${VF} font-weight="800" font-size="10" fill="#111" transform="rotate(-5 ${W/2} ${H-46})">PREMIERE ISSUE</text>`;
    } else { // modern: quiet trade dress, credits, lots of air
      dress += `<text x="12" y="28" ${VF} font-weight="800" font-size="${Math.min(24, 300/Math.max(8,title.length))}" letter-spacing="2" ${title.length>14?'textLength="176" lengthAdjust="spacingAndGlyphs"':''} fill="${tpl==='type'?P[0]:P[2]}">${esc(title)}</text><text x="12" y="${H-12}" ${VF} font-size="8" letter-spacing="2" fill="${tpl==='type'?P[0]:P[2]}" opacity=".85">${esc(credits)}</text>${BLP_MARK(W-16,H-20,0.7,tpl==='type'?P[0]:P[2])}<text x="${W-28}" y="${H-12}" text-anchor="end" ${VF} font-weight="700" font-size="11" fill="${tpl==='type'?P[0]:P[2]}">${d.n}</text>`;
      if (!d.v) dress += `<g transform="translate(${W-44} 40)"><rect width="32" height="20" fill="#fff"/>${Array.from({length:12},(_,i)=>`<rect x="${2+i*2.4}" y="3" width="${i%3?1:1.6}" height="13" fill="#111"/>`).join('')}</g>`;
    }
    if (d.p>1 && d.p<9) dress += `<text x="${W-8}" y="${H*0.6}" text-anchor="end" ${VF} font-weight="800" font-size="10" fill="#fff" stroke="#b3122e" stroke-width="3" paint-order="stroke">${['','','SECOND','THIRD','FOURTH'][d.p]||''} PRINTING</text>`;
    if (/^R/.test(d.v||'')) dress += `<text x="${W-8}" y="${H*0.66}" text-anchor="end" ${VF} font-size="7" letter-spacing="2" fill="#fff" opacity=".8">VARIANT EDITION</text>`;
  }
  // age: paper tone, halftone, misregistration
  const tone = Math.min(0.28, Math.max(0, age-15)*0.008);
  const half = yr<2000 ? `<pattern id="ht${uid}" width="4" height="4" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r=".8" fill="#000"/></pattern><rect width="${W}" height="${H}" fill="url(#ht${uid})" opacity=".07"/>` : '';
  const mis = yr<1995 ? `<g opacity=".18" transform="translate(1.2 .6)" style="mix-blend-mode:multiply"><rect width="${W}" height="3" fill="#00a0c6"/></g>` : '';
  const foil = d.v==='F' ? `<rect width="${W}" height="${H}" fill="url(#fo${uid})"/>` : '';
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" class="cmsvg v2" data-era="${yr}"><defs><clipPath id="cc${uid}"><rect width="${W}" height="${H}"/></clipPath><filter id="sk${uid}"><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncR type="discrete" tableValues="0 1"/><feFuncG type="discrete" tableValues="0 1"/><feFuncB type="discrete" tableValues="0 1"/></feComponentTransfer></filter><linearGradient id="fo${uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".45" stop-color="#fff" stop-opacity=".45"/><stop offset=".55" stop-color="#b3e5fc" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
    <g clip-path="url(#cc${uid})">${art}${half}${dress}${mis}${foil}${tone?`<rect width="${W}" height="${H}" fill="#c9a45c" opacity="${tone.toFixed(3)}" style="mix-blend-mode:multiply"/>`:''}<rect width="${W}" height="${H}" fill="none" stroke="rgba(0,0,0,.35)"/></g></svg>`;
}
(function(){ const cc=comicCover; comicCover=function(key){ if (G.cm && isBLP(key)){ let h=CVC.get('v2'+key); if (!h){ h=blpCover(key); CVC.set('v2'+key,h); } return h; } return cc(key); }; })();
function comicCondOverlay(cp){
  const c=cp.c, out=[], r=mkRng(cp.id*131);
  if (c[0]<94) for (let i=0;i<(c[0]<80?9:c[0]<88?5:2);i++){ const y=10+r()*280; out.push(`<path d="M0 ${y.toFixed(0)} l${(3+r()*6).toFixed(1)} ${(r()*2-1).toFixed(1)}" stroke="#fff" stroke-width="1.2" opacity=".8"/>`); }
  if (c[1]<90) for (const [x,y] of [[200,300],[200,0],[0,300]].slice(0, c[1]<75?3:1)) out.push(`<circle cx="${x}" cy="${y}" r="${c[1]<75?7:4}" fill="#efe6d0" opacity=".85"/>`);
  if (c[3]<70) out.push(`<path d="M${120+r()*60} 300 L200 ${230+r()*50}" stroke="#fff" stroke-width="1.4" opacity=".7"/>`);
  if (c[2]<80) out.push(`<rect width="200" height="300" fill="#fff" opacity="${((80-c[2])/220).toFixed(2)}"/>`);
  if (c[6]<70) out.push(`<rect width="200" height="300" fill="#b58b3c" opacity=".08" style="mix-blend-mode:multiply"/>`);
  return out.join('');
}
function withCmCond(svg, cp){ if (!cp || cp.g!==0) return svg; const ov=comicCondOverlay(cp); return ov? svg.slice(0, svg.lastIndexOf('</svg>'))+ov+'</svg>' : svg; }
