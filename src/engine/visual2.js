// ===================== VISUALS: every card brand gets its own design system =====================
function dayStage(uid, c1, c2){ const r=mkRng(hsh('ds'+uid)); let o=`<rect width="250" height="350" fill="url(#sky${uid})"/>`;
  for (let i=0;i<4;i++){ const x=r()*250, y=20+r()*60; o+=`<ellipse cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" rx="${(24+r()*30).toFixed(0)}" ry="${(7+r()*6).toFixed(0)}" fill="#fff" opacity=".55"/>`; }
  o+=`<rect y="118" width="250" height="84" fill="${shade(c2,-0.35)}"/><rect y="118" width="250" height="6" fill="${c1}"/>`;
  for (let i=0;i<110;i++) o+=`<rect x="${(r()*250).toFixed(0)}" y="${(126+r()*72).toFixed(0)}" width="2" height="2" fill="${['#fff',c1,c2,'#f2c230','#d9d9d9'][i%5]}" opacity=".55"/>`;
  o+=`<rect y="200" width="250" height="150" fill="#3d8a45"/>${[0,1,2,3,4].map(i=>`<rect y="${200+i*30}" width="250" height="15" fill="#357c3d"/>`).join('')}<path d="M-20 350 Q125 250 270 350 Z" fill="#c29462"/><path d="M0 206 H250" stroke="#e9e2cf" stroke-width="2" opacity=".6"/>`;
  return o; }
function studioStage(uid, c1){ return `<rect width="250" height="350" fill="url(#stu${uid})"/><ellipse cx="125" cy="150" rx="120" ry="130" fill="#fff" opacity=".08"/><rect y="300" width="250" height="50" fill="#000" opacity=".15"/>`; }
function paintStage(uid, c1, c2){ const r=mkRng(hsh('ps'+uid)); let o=`<rect width="250" height="350" fill="url(#pnt${uid})"/>`; for (let i=0;i<14;i++){ const y=20+r()*180; o+=`<path d="M${(r()*60-20).toFixed(0)} ${y.toFixed(0)} q${(60+r()*80).toFixed(0)} ${(r()*14-7).toFixed(0)} ${(140+r()*120).toFixed(0)} ${(r()*10-5).toFixed(0)}" stroke="#fff" stroke-width="${(4+r()*8).toFixed(0)}" opacity=".08" fill="none" stroke-linecap="round"/>`; } o+=`<path d="M0 240 Q125 214 250 240 V350 H0 Z" fill="${shade('#4f8f4a',-0.1)}"/><path d="M0 240 Q125 214 250 240" stroke="#e6dcc0" stroke-width="3" fill="none" opacity=".5"/>`; return o; }
function cardDefs(uid, c1, c2, par, extra){
  const pc=par? par.col : '#c8d1da';
  return `<defs>${chromeGrad('ch'+uid, par&&par.fin!=='super'&&par.fin!=='stock'?pc:'#aab4be')}${chromeGrad('gold'+uid,'#d9b44a')}${chromeGrad('sil'+uid,'#b9c1c9')}${prismPattern('pr'+uid, par&&par.fin==='refr'?0.55:0.3)}${stockNoise(uid)}
    <linearGradient id="sky${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5e9ad6"/><stop offset="1" stop-color="#bcd8ef"/></linearGradient>
    <radialGradient id="stu${uid}" cx=".5" cy=".4" r=".8"><stop offset="0" stop-color="${shade(c1,0.35)}"/><stop offset="1" stop-color="${shade(c1,-0.55)}"/></radialGradient>
    <linearGradient id="pnt${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e8b872"/><stop offset=".6" stop-color="#f3dcb0"/><stop offset="1" stop-color="#cfe0c4"/></linearGradient>
    <radialGradient id="vg${uid}" cx=".5" cy=".42" r=".75"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></radialGradient>
    <linearGradient id="gl${uid}" x1="0" y1="0" x2="1" y2="1"><stop offset=".3" stop-color="#fff" stop-opacity="0"/><stop offset=".45" stop-color="#fff" stop-opacity=".18"/><stop offset=".52" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <linearGradient id="plt${uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8a9097"/><stop offset=".5" stop-color="#dfe3e7"/><stop offset="1" stop-color="#7b8189"/></linearGradient>
    <clipPath id="cc${uid}"><rect width="250" height="350" rx="12"/></clipPath>${extra||''}</defs>`;
}
function surface(uid, finish){ // physical card stock on top of everything
  let o=`<rect width="250" height="350" rx="12" fill="url(#nz${uid})" opacity="${finish==='matte'?0.14:0.07}"/>`;
  if (finish!=='matte') o+=`<rect width="250" height="350" rx="12" fill="url(#gl${uid})" opacity="${finish==='chrome'?1:0.6}"/>`;
  o+=`<rect x=".75" y=".75" width="248.5" height="348.5" rx="11.5" fill="none" stroke="#fff" stroke-opacity="${finish==='matte'?0.2:0.4}" stroke-width="1.5"/><rect x="2" y="2" width="246" height="346" rx="10.5" fill="none" stroke="#000" stroke-opacity=".25"/>`;
  return o;
}
function borderFill(par, uid, base){ if (!par) return base; if (par.fin==='foil') return `url(#sil${uid})`; if (par.fin==='super') return `url(#gold${uid})`; if (par.fin==='plate') return `url(#plt${uid})`; if (par.fin==='refr') return `url(#ch${uid})`; if (par.fin==='stock') return par.col; return par.col; }
function serialPlate(serial, run, x, y, style, uid){
  if (!run || !serial) return ''; const one=run===1; const txt= one? '1/1' : String(serial).padStart(String(run).length,'0')+'/'+run; const big=run<=25;
  if (style==='ink') return `<text x="${x}" y="${y}" text-anchor="end" font-family="Georgia,serif" font-weight="700" font-size="${big?15:12}" fill="#b0141c" opacity=".85" transform="rotate(-4 ${x} ${y})">${txt}</text>`;
  if (style==='gold') return `<g transform="translate(${x} ${y})"><text text-anchor="end" font-family="Georgia,serif" font-size="${big?14:11}" letter-spacing="1.5" fill="#f3dc8c" stroke="#6b5010" stroke-width=".4">${txt}</text></g>`;
  const w=big?58:48; return `<g transform="translate(${x-w} ${y-(big?16:13)})" class="vser"><rect width="${w}" height="${big?22:18}" rx="${style==='dia'?0:3}" fill="${big?'url(#gold'+uid+')':'url(#sil'+uid+')'}" stroke="#0009" stroke-width=".8" ${style==='dia'?`transform="skewX(-12)"`:''}/><text x="${w/2}" y="${big?16:13}" text-anchor="middle" ${VF} font-weight="800" font-size="${big?15:12}" fill="#fff" opacity=".6" transform="translate(.6 .6)">${txt}</text><text x="${w/2}" y="${big?16:13}" text-anchor="middle" ${VF} font-weight="800" font-size="${big?15:12}" fill="${big?'#3a2a05':'#10141a'}">${txt}</text></g>`;
}
function autoPanel(name, x, y, w, style, uid){ const bg= style==='lux'? '#f7f3e8' : '#fbfbf8'; return `<g transform="translate(${x} ${y})"><rect width="${w}" height="54" rx="${style==='lux'?2:6}" fill="${bg}" opacity=".94" stroke="${style==='lux'?'#c9a227':'#0003'}"/><path d="${sigPath(name)}" transform="translate(${(w-200)/2+6},30) scale(.86)" fill="none" stroke="${style==='her'?'#b0141c':'#1d3fa3'}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><text x="${w/2}" y="50" text-anchor="middle" ${VF} font-size="5.5" letter-spacing="1.5" fill="#667">${style==='her'?'REAL INK':'CERTIFIED AUTOGRAPH'}</text></g>`; }
function relicWindow(p, x, y, w, h, luxe, uid){ const pat=hsh(p.id)%2; return `<g transform="translate(${x} ${y})"><rect width="${w}" height="${h}" rx="${luxe?2:4}" fill="${luxe?'#0b0b0b':'#111'}" stroke="${luxe?'url(#gold'+uid+')':'#555'}" stroke-width="${luxe?2:1}"/><rect x="4" y="4" width="${w-8}" height="${h-8}" rx="2" fill="url(#${pat?'mesh':'pin'}${uid})"/>${luxe?`<path d="M4 ${h/2} q${(w-8)/4} -6 ${(w-8)/2} 0 t${(w-8)/2} 0" stroke="#f3dc8c" stroke-width="1.2" fill="none" stroke-dasharray="3 2"/>`:''}</g>`; }
function relicPatterns(uid, c1){ return `<pattern id="mesh${uid}" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="${c1}"/><circle cx="3" cy="3" r="1.3" fill="${shade(c1,-0.35)}"/></pattern><pattern id="pin${uid}" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="#f1efe8"/><rect width="1.4" height="8" fill="${c1}"/></pattern>`; }
function rcShield(x, y, fill, style){ if (style==='her') return `<g transform="translate(${x} ${y})"><circle r="13" fill="#f3e6c4" stroke="#b0141c" stroke-width="2"/><text y="4.5" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="11" fill="#b0141c">RC</text></g>`; if (style==='lux') return `<text x="${x}" y="${y}" text-anchor="end" font-family="Georgia,serif" font-size="9" letter-spacing="2" fill="#f3dc8c">ROOKIE</text>`; return `<g transform="translate(${x} ${y})"><path d="M0 0 H24 V17 L12 26 L0 17 Z" fill="${fill}" stroke="#000a"/><text x="12" y="13.5" text-anchor="middle" ${VF} font-weight="800" font-size="12" fill="#b0141c">RC</text></g>`; }
function insertTheme(focus){ return {legends:['#3b2a1a','#d7b56d','sepia'], rookies:['#0b2a4a','#ffd23f','burst'], power:['#1a0a2e','#ff5a36','bolt'], stars:['#0a0f1f','#f5f5f5','spot'], prospects:['#0c2a24','#7fe0b0','rise']}[focus] || ['#101418','#e0e0e0','spot']; }
// the one renderer for every brand except Velocity (which has its own)
function cardV2(key, serial){
  const d=D(key), p=P(d.pid), br=B(d.prod), yr=d.prod.yr; const tm=cardTeam(d,p); const T=TEAMS_DEF[tm]||TEAMS_DEF[0]; const c1=T[3], c2=T[4];
  const uid=(hsh(key+'#'+serial+'v3')%1e7).toString(36); const par=d.parObj; const run=d.run||0; const name=pname(p);
  const flip=hsh(p.id+'f'+d.sec+d.prod.id)%3===0; const pose=poseFor(d,p); const t=br.tmpl;
  const extra=relicPatterns(uid,c1); const defs=cardDefs(uid,c1,c2,par,extra);
  const fig=poseFig(p,pose,c1,c2,uid,flip);
  let o='', fin='gloss';
  if (d.ins || d.caseHit){ // inserts and case hits: themed by what the insert celebrates
    const th = d.caseHit? ['#07080c','#f4e3a1','jewel'] : insertTheme(br.ins[+d.sec.slice(1)] && br.ins[+d.sec.slice(1)].focus);
    const setN = d.caseHit? br.caseHit.n : br.ins[+d.sec.slice(1)].n; fin = d.caseHit?'chrome':'gloss';
    o += `<rect width="250" height="350" rx="12" fill="${th[0]}"/>`;
    if (th[2]==='burst') o += Array.from({length:18},(_,i)=>`<path d="M125 150 L${(125+Math.cos(i/18*6.283)*400).toFixed(0)} ${(150+Math.sin(i/18*6.283)*400).toFixed(0)} L${(125+Math.cos((i+0.5)/18*6.283)*400).toFixed(0)} ${(150+Math.sin((i+0.5)/18*6.283)*400).toFixed(0)} Z" fill="${th[1]}" opacity=".12"/>`).join('');
    if (th[2]==='bolt') o += `<path d="M150 0 L110 140 L150 140 L90 350" stroke="${th[1]}" stroke-width="10" fill="none" opacity=".5"/><path d="M60 0 L40 90 L70 90 L30 220" stroke="${th[1]}" stroke-width="4" fill="none" opacity=".35"/>`;
    if (th[2]==='spot') o += `<path d="M125 0 L20 350 L230 350 Z" fill="${th[1]}" opacity=".12"/><ellipse cx="125" cy="318" rx="90" ry="14" fill="${th[1]}" opacity=".18"/>`;
    if (th[2]==='rise') o += Array.from({length:6},(_,i)=>`<path d="M${20+i*40} 340 l20 -${60+i*40} l20 ${60+i*40}" fill="${th[1]}" opacity="${0.08+i*0.03}"/>`).join('');
    if (th[2]==='sepia') o += `<rect width="250" height="350" fill="#c9a36b" opacity=".35"/><circle cx="125" cy="150" r="110" fill="none" stroke="${th[1]}" stroke-width="2" opacity=".6"/><path d="M40 250 q-20 -80 20 -150 M210 250 q20 -80 -20 -150" stroke="${th[1]}" stroke-width="3" fill="none" stroke-dasharray="2 5" opacity=".7"/>`;
    if (th[2]==='jewel') o += Array.from({length:16},(_,i)=>{ const r=mkRng(i*37+hsh(key)); const x=r()*250, y=r()*300; return `<path d="M${x.toFixed(0)} ${y.toFixed(0)} l18 -22 l18 22 l-18 30 Z" fill="${['#3c7dd9','#9b59d0','#20b2aa','#e84393','#f4d35e'][i%5]}" opacity=".35"/>`; }).join('');
    o += `<g ${th[2]==='sepia'?'opacity=".92"':''}>${fig}</g>`;
    o += `<rect x="8" y="8" width="234" height="334" rx="8" fill="none" stroke="${d.caseHit?'url(#gold'+uid+')':th[1]}" stroke-width="${d.caseHit?4:2}"/>`;
    o += `<text x="125" y="36" text-anchor="middle" ${th[2]==='sepia'||d.caseHit?'font-family="Georgia,serif" letter-spacing="3"':VF+' font-style="italic" letter-spacing="1"'} font-weight="800" font-size="${Math.min(20, 300/setN.length)}" fill="${th[1]}">${esc(setN.toUpperCase())}</text>`;
    o += `<path d="M20 296 H230 L222 330 H28 Z" fill="#000" opacity=".55"/><text x="125" y="318" text-anchor="middle" ${VF} font-weight="800" font-size="20" fill="#fff" textLength="${Math.min(190,name.length*11)}" lengthAdjust="spacingAndGlyphs">${esc(name.toUpperCase())}</text><text x="125" y="342" text-anchor="middle" ${VF} font-size="7" letter-spacing="2" fill="${th[1]}">${esc(br.short.toUpperCase())} · ${esc(d.cardNo)}</text>`;
    if (d.rc) o += rcShield(206, 46, '#fff');
    o += serialPlate(serial, run, 232, 292, '', uid);
  }
  else if (t==='dia'){ // Diamond: white border, octagon-cut photo, angled team band, diamond marks
    const border=borderFill(par,uid,'#fbfbf7'); fin = par&&par.fin==='foil'?'chrome':'gloss';
    o += `<rect width="250" height="350" rx="12" fill="${border}"/>${par&&par.fin==='color'?`<rect width="250" height="350" rx="12" fill="#fff" opacity=".12"/>`:''}`;
    o += `<clipPath id="ph${uid}"><path d="M28 12 H222 L238 28 V322 L222 338 H28 L12 322 V28 Z"/></clipPath><g clip-path="url(#ph${uid})">${dayStage(uid,c1,c2)}${fig}<rect width="250" height="350" fill="url(#vg${uid})"/></g>`;
    o += `<path d="M28 12 H222 L238 28 V322 L222 338 H28 L12 322 V28 Z" fill="none" stroke="${par?shade(par.col,-0.2):c1}" stroke-width="2.5"/>`;
    o += `<path d="M12 262 L238 246 V322 L222 338 H28 L12 322 Z" fill="${c1}"/><path d="M12 262 L238 246 L238 252 L12 268 Z" fill="${par?border:c2}"/>`;
    o += `<text x="24" y="300" ${VF} font-weight="800" font-size="26" fill="${lum(c1)>0.6?'#111':'#fff'}" textLength="${Math.min(196,name.length*14)}" lengthAdjust="spacingAndGlyphs">${esc(name.toUpperCase())}</text><text x="25" y="320" ${VF} font-weight="600" font-size="11" letter-spacing="1.5" fill="${lum(c1)>0.6?'#222':'#fff'}" opacity=".9">${esc((T[0]+' '+T[1]).toUpperCase())}</text>`;
    o += `<g transform="translate(30 32)"><path d="M0 -14 L14 0 L0 14 L-14 0 Z" fill="${par?border:'#fff'}" stroke="#15181c" stroke-width="1.5"/><text y="5" text-anchor="middle" ${VF} font-weight="800" font-size="13" fill="#15181c">D</text></g>`;
    o += `<g transform="translate(220 300)"><path d="M0 -14 L14 0 L0 14 L-14 0 Z" fill="#fff" stroke="#15181c"/><text y="4.5" text-anchor="middle" ${VF} font-weight="800" font-size="11" fill="#15181c">${p.pos}</text></g>`;
    if (br.update) o += `<text x="226" y="36" text-anchor="end" ${VF} font-weight="800" font-size="11" letter-spacing="2" fill="#fff" stroke="#0008" stroke-width=".8" paint-order="stroke">UPDATE</text>`;
    if (d.rc) o += rcShield(206, br.update?44:24, '#fff');
    if (d.relic) o += relicWindow(p, 150, 180, 78, 56, false, uid);
    if (d.auto) o += autoPanel(name, 30, 184, 190, '', uid);
    o += serialPlate(serial, run, 232, 240, 'dia', uid);
  }
  else if (t==='nat'){ // National: loud budget borders, rounded photo, a ribbon and the vertical wordmark
    const border=borderFill(par,uid,c2); fin='gloss';
    o += `<rect width="250" height="350" rx="12" fill="${border}"/><rect x="14" y="14" width="222" height="322" rx="14" fill="#fff"/>`;
    o += `<clipPath id="ph${uid}"><rect x="18" y="18" width="214" height="314" rx="12"/></clipPath><g clip-path="url(#ph${uid})">${dayStage(uid,c1,c2)}${fig}</g>`;
    o += `<rect x="198" y="18" width="34" height="150" fill="${c1}" opacity=".92"/><text transform="translate(222 158) rotate(-90)" ${VF} font-weight="800" font-size="18" letter-spacing="3" fill="${lum(c1)>0.6?'#111':'#fff'}">NATIONAL</text>`;
    o += `<path d="M10 270 H180 L166 312 H10 Z" fill="${c1}"/><path d="M10 270 H180" stroke="#fff" stroke-width="2"/><text x="20" y="294" ${VF} font-weight="800" font-size="21" fill="#fff" textLength="${Math.min(150,name.length*11)}" lengthAdjust="spacingAndGlyphs">${esc(name)}</text><text x="20" y="306" ${VF} font-weight="600" font-size="9" fill="#fff" opacity=".85">${esc(T[1])} · ${p.pos}</text>`;
    if (par && par.fin==='plate') o += `<rect width="250" height="350" rx="12" fill="${par.col}" opacity=".35" style="mix-blend-mode:multiply"/><text x="125" y="340" text-anchor="middle" ${VF} font-size="8" letter-spacing="3" fill="#222">PRINTING PLATE · CYAN</text>`;
    if (d.rc) o += rcShield(26, 28, '#fff');
    if (d.relic) o += relicWindow(p, 146, 196, 78, 56, false, uid);
    if (d.auto) o += autoPanel(name, 30, 196, 190, '', uid);
    o += serialPlate(serial, run, 236, 332, '', uid);
  }
  else if (t==='her'){ // Heritage: cream stock, painted look, pennant name, serif script
    const stock = par&&par.fin==='stock' ? (par.run? '#b98c4a' : '#d9c9a3') : '#efe3c7'; fin='matte';
    o += `<rect width="250" height="350" rx="12" fill="${stock}"/>`;
    o += `<clipPath id="ph${uid}"><rect x="20" y="20" width="210" height="246" rx="18"/></clipPath><g clip-path="url(#ph${uid})">${paintStage(uid,c1,c2)}<g opacity=".95">${fig}</g><rect x="20" y="20" width="210" height="246" fill="#e8c890" opacity=".18" style="mix-blend-mode:multiply"/></g>`;
    o += `<rect x="20" y="20" width="210" height="246" rx="18" fill="none" stroke="${shade(stock,-0.45)}" stroke-width="2.5"/>`;
    o += `<path d="M22 276 H200 L186 296 L200 316 H22 Z" fill="${c1}"/><text x="32" y="301" font-family="Georgia,serif" font-weight="700" font-size="17" fill="#fff" textLength="${Math.min(150,name.length*9)}" lengthAdjust="spacingAndGlyphs">${esc(name)}</text>`;
    o += `<text x="228" y="336" text-anchor="end" font-family="Georgia,serif" font-style="italic" font-size="14" fill="${shade(c1,-0.2)}">${esc(T[1])}</text><circle cx="34" cy="332" r="9" fill="${c2}"/><text x="34" y="335.5" text-anchor="middle" ${VF} font-weight="800" font-size="8" fill="${lum(c2)>0.6?'#111':'#fff'}">${p.pos}</text>`;
    if (d.rc) o += rcShield(212, 42, '', 'her');
    if (d.relic) o += relicWindow(p, 150, 196, 70, 52, false, uid);
    if (d.auto) o += autoPanel(name, 34, 200, 182, 'her', uid);
    o += serialPlate(serial, run, 226, 316, 'ink', uid);
  }
  else if (t==='spr'){ // Summit: white peaks over a studio portrait, chrome finishes, 1st card flag
    const edge = par? borderFill(par,uid,'#f6f7f8') : '#f6f7f8'; fin = par? 'chrome' : 'gloss';
    o += `<rect width="250" height="350" rx="12" fill="${edge}"/>${par&&par.fin==='refr'?`<rect width="250" height="350" rx="12" fill="url(#pr${uid})" opacity=".55" style="mix-blend-mode:overlay"/>`:''}`;
    o += `<clipPath id="ph${uid}"><path d="M12 90 L60 40 L92 70 L140 22 L238 104 V338 H12 Z"/></clipPath><g clip-path="url(#ph${uid})">${studioStage(uid,c1)}${fig}${par&&par.fin==='refr'?`<rect width="250" height="350" fill="url(#pr${uid})" opacity=".12" style="mix-blend-mode:screen"/>`:''}</g>`;
    o += `<path d="M12 90 L60 40 L92 70 L140 22 L238 104" stroke="${par?shade(par.col,0.3):c1}" stroke-width="3" fill="none"/><path d="M12 12 H238 V104 L140 22 L92 70 L60 40 L12 90 Z" fill="${edge}" opacity=".9"/>`;
    o += `<text x="20" y="34" ${VF} font-weight="800" font-size="15" letter-spacing="4" fill="${c1}">SUMMIT</text><path d="M20 40 l8 -6 l6 4 l10 -9 l12 11" stroke="${c1}" stroke-width="1.5" fill="none"/>`;
    o += `<rect x="12" y="292" width="226" height="46" fill="#fff" opacity=".92"/><rect x="12" y="292" width="6" height="46" fill="${c1}"/><text x="26" y="316" ${VF} font-weight="800" font-size="20" fill="#14171b" textLength="${Math.min(180,name.length*10.5)}" lengthAdjust="spacingAndGlyphs">${esc(name.toUpperCase())}</text><text x="26" y="331" ${VF} font-weight="600" font-size="9" letter-spacing="1.5" fill="#555">${esc((p.tm===-1? teamName(p.org)+' ORG · PROSPECT' : T[0]+' '+T[1]).toUpperCase())} · ${p.pos}</text>`;
    if (d.first) o += `<g transform="translate(196 116)"><rect width="42" height="18" rx="2" fill="#14171b"/><text x="21" y="13" text-anchor="middle" ${VF} font-weight="800" font-size="11" fill="#f2c230">1ST</text></g>`;
    if (d.rc) o += rcShield(212, 140, '#fff');
    if (d.auto) o += autoPanel(name, 34, 222, 182, '', uid);
    o += serialPlate(serial, run, 234, 286, '', uid);
  }
  else { // Luxe: black stock, gold rules, an arched window, restraint
    const plat = par && par.fin==='super'; fin='gloss';
    o += `<rect width="250" height="350" rx="12" fill="${plat?'url(#plt'+uid+')':'#0d0d0f'}"/>${plat?'':'<rect width="250" height="350" rx="12" fill="url(#nz'+uid+')" opacity=".25"/>'}`;
    o += `<clipPath id="ph${uid}"><path d="M40 250 V110 A85 85 0 0 1 210 110 V250 Z"/></clipPath><g clip-path="url(#ph${uid})">${studioStage(uid,shade(c1,-0.3))}<g transform="translate(0 -18)">${fig}</g></g>`;
    const gold = plat? '#4a4f55' : (par&&par.fin==='color'? 'url(#gold'+uid+')' : '#c9a227');
    o += `<path d="M40 250 V110 A85 85 0 0 1 210 110 V250 Z" fill="none" stroke="${gold}" stroke-width="1.5"/><rect x="14" y="14" width="222" height="322" rx="6" fill="none" stroke="${gold}" stroke-width="1"/><rect x="19" y="19" width="212" height="312" rx="4" fill="none" stroke="${gold}" stroke-width=".5"/>`;
    o += `<text x="125" y="276" text-anchor="middle" font-family="Georgia,serif" font-size="15" letter-spacing="3" fill="${plat?'#1c1f23':'#f3dc8c'}" textLength="${Math.min(190,name.length*10)}" lengthAdjust="spacingAndGlyphs">${esc(name.toUpperCase())}</text><text x="125" y="292" text-anchor="middle" font-family="Georgia,serif" font-size="7.5" letter-spacing="3" fill="${plat?'#333':'#b9a468'}">${esc((T[0]+' '+T[1]).toUpperCase())}</text>`;
    o += `<text x="125" y="40" text-anchor="middle" font-family="Georgia,serif" font-size="10" letter-spacing="6" fill="${plat?'#222':'#c9a227'}">L U X E</text>`;
    if (d.rc) o += rcShield(226, 40, '', 'lux');
    if (d.relic) o += relicWindow(p, 70, 200, 110, 50, true, uid);
    if (d.auto) o += autoPanel(name, 45, 196, 160, 'lux', uid);
    o += `<g transform="translate(125 322)"><text text-anchor="middle" font-family="Georgia,serif" font-size="${run<=25?15:12}" letter-spacing="2" fill="${plat?'#111':'#f3dc8c'}" stroke="${plat?'none':'#6b5010'}" stroke-width=".4">${run&&serial? (run===1?'1 / 1':String(serial).padStart(String(run).length,'0')+' / '+run) : ''}</text></g>`;
  }
  if (d.variation) o += `<text x="236" y="${t==='her'?270:280}" text-anchor="end" ${VF} font-size="6" letter-spacing="1" fill="#fff" opacity=".7">${d.sec==='w'?'SSP':'SP'}</text>`;
  o += surface(uid, fin);
  return `<svg viewBox="0 0 250 350" xmlns="http://www.w3.org/2000/svg" class="cardsvg v2" data-fin="${par?par.fin:fin}" role="img" aria-label="${esc(name+' '+yr+' '+br.name+' '+d.title)}">${defs}<g clip-path="url(#cc${uid})">${o}</g></svg>`;
}
// route every brand through the new renderers
isV2Card = function(){ return true; };
(function(){ const prev=velFront; velFront=function(key, serial, opts){ const d=D(key); return B(d.prod).tmpl==='vel' ? prev(key,serial,opts) : cardV2(key,serial); }; })();
