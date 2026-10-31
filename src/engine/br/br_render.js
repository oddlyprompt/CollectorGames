// ===================== BROKEN REACH: HOW CARDS LOOK =====================
// A card face is drawn in code as an SVG on the shared 250x350 card: gunmetal frame, a placeholder painting (a gradient in the faction's colour and the type's glyph, labelled
// ART PENDING: no artwork is approved yet), the eight arrows lit on the card's edge, the stats and the ability. When approved art exists (BR_ART) it replaces the placeholder.
const BRV=new Map(); let BRFU=0;
const BRF={back(){ if (BR_PKG.back) return `<svg viewBox="0 0 250 350" xmlns="http://www.w3.org/2000/svg" class="tcgsvg cardsvg" role="img" aria-label="Broken Reach card back"><image href="${BR_PKG.back.u}" x="0" y="0" width="250" height="350" preserveAspectRatio="none"/></svg>`; return `<svg viewBox="0 0 250 350" xmlns="http://www.w3.org/2000/svg" class="tcgsvg cardsvg" role="img" aria-label="Broken Reach card back"><rect width="250" height="350" rx="12" fill="#0b0b0c"/><rect x="9" y="9" width="232" height="332" rx="8" fill="#161a20"/><g stroke="#2f3843" stroke-width="1.5">${[0,1,2,3,4,5,6,7].map(i=>`<path d="M9 ${50+i*38} H241"/>`).join('')}</g><circle cx="125" cy="175" r="60" fill="#241014" stroke="#e2a43a" stroke-width="3"/><g fill="#e2a43a">${[0,1,2,3,4,5,6,7].map(i=>`<path d="M125 105 l9 18 h-18 z" transform="rotate(${i*45} 125 175)"/>`).join('')}</g><circle cx="125" cy="175" r="14" fill="#9c2638" stroke="#e2a43a" stroke-width="2"/><text x="125" y="48" text-anchor="middle" font-family="Barlow Condensed,Arial Narrow,sans-serif" font-weight="800" font-size="22" letter-spacing="4" fill="#e2a43a">THE BROKEN REACH</text></svg>`; }};
function brFin(d){ if (d.sealed) return 'gloss'; return d.v==='F'?'refr': d.v==='A'?'super':'gloss'; }
const BR_RC={common:'#8a929c',unc:'#5fb36a',rare:'#4f9fe0',sr:'#b070e0',leg:'#e2a43a',ir:'#4fc3d8',sig:'#e2a43a',ecl:'#b070e0'};
function brWrap(t, n){ const out=[]; let line=''; for (const w of String(t||'').split(/\s+/)){ if ((line+' '+w).trim().length>n){ if (line) out.push(line); line=w; } else line=(line+' '+w).trim(); } if (line) out.push(line); return out; }
// The look follows the owner's approved card back and packaging (2026-10-31): deep navy field, copper bands, cream stencil lettering, a thin crimson line, a few stars.
const BR_INK={bg1:'#122030',bg2:'#0a1119',cu:'#c8864a',cul:'#e3aa72',cud:'#8a5630',cream:'#f0e4c8',dim:'#9aa7b4',red:'#b3283c'};
function brArrowsSVG(mask){   // the eight arrows are triangles seated in the card frame's notched inner edge, like Tetra Master: lit = a bright triangle, unlit = a dark recessed one
  const P=[[125,11,0],[238,12,45],[238,175,90],[238,338,135],[125,339,180],[12,338,225],[12,175,270],[12,12,315]]; let o='';
  for (let i=0;i<8;i++){ const [x,y,r]=P[i], t=`transform="translate(${x} ${y}) rotate(${r})"`;
    o+= mask>>i&1? `<path d="M0 -8.5 L8.5 6 L-8.5 6 Z" ${t} fill="#fff7dc" stroke="#1a0e06" stroke-width="1.7" stroke-linejoin="round"/>` : `<path d="M0 -7 L7 5 L-7 5 Z" ${t} fill="#120a05" fill-opacity=".75" stroke="#000" stroke-opacity=".5" stroke-width=".8" stroke-linejoin="round"/>`; }
  return o;
}
const BR_STARS=(()=>{ const a=[]; for (let i=0;i<14;i++){ const h=hsh('brstar'+i)>>>0; a.push([12+(h%226),12+((h>>>8)%326),0.5+((h>>>16)%10)/14]); } return a; })();
const BR_INNER='M30 18 L105 18 L111 23 L139 23 L145 18 L220 18 L232 30 L232 157 L227 163 L227 187 L232 193 L232 320 L220 332 L145 332 L139 327 L111 327 L105 332 L30 332 L18 320 L18 193 L23 187 L23 163 L18 157 L18 30 Z';

// Each rarity has its own frame metal, edge effect and picture effect; a foil (any rarity, variant F) swaps the metal for a rainbow and adds a light streak.
const brStar4=(x,y,r,col,op)=>`<path d="M${x} ${y-r} L${x+r*.28} ${y-r*.28} L${x+r} ${y} L${x+r*.28} ${y+r*.28} L${x} ${y+r} L${x-r*.28} ${y+r*.28} L${x-r} ${y} L${x-r*.28} ${y-r*.28} Z" fill="${col}" opacity="${op}"/>`;
const brStar5=(x,y,r,col)=>{ let pts=[]; for (let i=0;i<10;i++){ const a=-Math.PI/2+i*Math.PI/5, q=i%2?r*.42:r; pts.push((x+q*Math.cos(a)).toFixed(1)+' '+(y+q*Math.sin(a)).toFixed(1)); } return `<path d="M${pts.join(' L')} Z" fill="${col}"/>`; };
function brTreat(c, d, u){
  const K=BR_INK, rar=c.rar, foil=d.v==='F';
  const st=a=>a.map(([o,col])=>`<stop offset="${o}" stop-color="${col}"/>`).join('');
  const T={ band:[[0,'#d9964f'],[.5,'#c8864a'],[1,'#8a5630']], bar:[[0,K.cul],[.55,K.cu],[1,K.cud]], rc:K.cu, edge:'', pic:'', defs:'', pipc:'#0d1620', gdir:'x1="0" y1="0" x2="0" y2="1"' };
  const rim=(col,w,op)=>`<path d="${BR_INNER}" fill="none" stroke="${col}" stroke-width="${w}" stroke-opacity="${op}" stroke-linejoin="round"/>`;
  const sp=(pts,r,col,op)=>pts.map(([x,y])=>brStar4(x,y,r,col,op)).join('');
  if (rar==='unc'){ T.band=[[0,'#e2e8ed'],[.45,'#9aa6b0'],[1,'#58626c']]; T.bar=[[0,'#e8edf1'],[.6,'#a9b4bd'],[1,'#7d8993']]; T.rc='#aab6c0'; T.edge=rim('#ffffff',.9,.5); }
  else if (rar==='rare'){ T.band=[[0,'#ffe0a0'],[.45,'#dba24a'],[1,'#8a5a22']]; T.bar=[[0,'#ffe6b0'],[.5,'#e0a850'],[1,'#a06a28']]; T.rc='#f2c46a'; T.edge=rim('#ffe9b0',1.5,.8); }
  else if (rar==='sr'){ T.band=[[0,'#d4b0f6'],[.5,'#8a5cc8'],[1,'#3a2260']]; T.bar=[[0,'#dcc0fa'],[.5,'#9a6cd8'],[1,'#5a3a90']]; T.rc='#b88af0'; T.edge=rim('#d6b4ff',1.8,.75)+sp([[40,9],[210,9],[8,100],[242,250],[60,341],[190,341],[8,260],[242,90]],3.2,'#fff',.95); }
  else if (rar==='leg'){ T.band=[[0,'#ffe58a'],[.35,'#e8b030'],[.7,'#a87414'],[1,'#f6d570']]; T.bar=[[0,'#fff0b0'],[.5,'#f0c040'],[1,'#b8841c']]; T.rc='#f6cf56'; T.edge=rim('#ffd86a',3.2,.5)+rim('#fff2b8',1.2,.95)+sp([[62,10],[188,10],[62,340],[188,340],[9,100],[241,250]],5.2,'#fffbe0',1); }
  else if (rar==='ir'){ T.band=[[0,'#f6efdc'],[.5,'#cdbf94'],[1,'#8a7c56']]; T.bar=[[0,'#f6efdc'],[.55,'#cdbf94'],[1,'#9a8c64']]; T.rc='#efe3bd'; T.edge=rim('#ffffff',1,.7);
    T.pic=`<rect x="21" y="44" width="208" height="174" rx="3" fill="none" stroke="#f6efdc" stroke-width="1" opacity=".9"/><path d="M21 52 L21 44 L29 44 M221 44 L229 44 L229 52 M229 210 L229 218 L221 218 M29 218 L21 218 L21 210" fill="none" stroke="#fff" stroke-width="1.6"/>`; }
  else if (rar==='sig'){ T.band=[[0,'#f8cdb0'],[.5,'#d98a62'],[1,'#8e4a2c']]; T.bar=[[0,'#fbd6bc'],[.5,'#e09a72'],[1,'#a65a38']]; T.rc='#f1b08a'; T.edge=rim('#ffe0cc',1.3,.8);
    T.pic=`<g clip-path="url(#${u}c)"><path d="M150 206 C158 186 168 186 166 200 C164 210 176 196 184 192 C190 189 192 196 188 202 C196 196 206 190 218 186" fill="none" stroke="#fff4e6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity=".95"/><path d="M146 211 L222 207" fill="none" stroke="#fff4e6" stroke-width="1" stroke-linecap="round" opacity=".7"/></g>`; }
  else if (rar==='ecl'){ T.band=[[0,'#f05a70'],[.45,'#a42040'],[1,'#380a14']]; T.bar=[[0,'#f26a80'],[.5,'#b02848'],[1,'#5a1424']]; T.rc='#ff5a70'; T.pipc='#05080c';
    T.defs=`<radialGradient id="${u}e" cx=".5" cy="0" r=".95"><stop offset="0" stop-color="#ff6a80" stop-opacity=".6"/><stop offset="1" stop-color="#ff6a80" stop-opacity="0"/></radialGradient><radialGradient id="${u}v" cx=".5" cy=".5" r=".75"><stop offset=".55" stop-color="#2a0610" stop-opacity="0"/><stop offset="1" stop-color="#2a0610" stop-opacity=".62"/></radialGradient>`;
    T.edge=`<g clip-path="url(#${u}k)"><rect x="0" y="0" width="250" height="140" fill="url(#${u}e)"/></g>`+rim('#ff5a70',3.4,.45)+rim('#ffb0bc',1.2,.9);
    T.pic=`<rect x="24" y="47" width="202" height="168" fill="url(#${u}v)" clip-path="url(#${u}c)"/><circle cx="125" cy="12" r="9" fill="none" stroke="#ff8a9c" stroke-width="1.2" opacity=".8"/>`; }
  if (foil){ T.band=[[0,'#ff9ad0'],[.25,'#ffd27a'],[.5,'#8affd8'],[.75,'#7ab4ff'],[1,'#c79aff']]; T.bar=[[0,'#ffb6dc'],[.3,'#ffe2a0'],[.6,'#a8ffe4'],[1,'#b6caff']]; T.gdir='x1="0" y1="0" x2="1" y2="1"';
    T.pic+=`<g clip-path="url(#${u}c)" style="mix-blend-mode:screen"><path d="M24 215 L98 47 L132 47 L58 215 Z" fill="#fff" opacity=".2"/><path d="M112 215 L172 47 L186 47 L126 215 Z" fill="#fff" opacity=".1"/></g>`+sp([[60,9],[190,339]],4,'#fff',.95); }
  T.stopsBand=st(T.band); T.stopsBar=st(T.bar);
  T.pip=(x,y)=> rar==='leg'? brStar5(x,y,7,'#1a0e06')+brStar5(x,y,5,'#fff2b8') : rar==='sr'? brStar4(x,y,7,'#1a0e06',1)+brStar4(x,y,5,'#fff',1) : rar==='rare'? `<path d="M${x} ${y-6.5} L${x+6.5} ${y} L${x} ${y+6.5} L${x-6.5} ${y} Z" fill="#0d1620" stroke="${T.rc}" stroke-width="1.3"/><circle cx="${x}" cy="${y}" r="1.8" fill="${T.rc}"/>` : rar==='ecl'? `<circle cx="${x}" cy="${y}" r="5.6" fill="#05080c" stroke="#ff5a70" stroke-width="1.5"/><circle cx="${x+1.6}" cy="${y-.6}" r="3.3" fill="#2a0610"/>` : `<circle cx="${x}" cy="${y}" r="5" fill="${T.pipc}" stroke="${T.rc}" stroke-width="1.3"/><circle cx="${x}" cy="${y}" r="${rar==='unc'?1.2:2}" fill="${T.rc}"/>`;
  return T;
}
function brCardSVG(c, d){
  // A real card is a stack of panels: a name bar, the picture, a type bar, a boxed text area, ATK/GRD plates and a footer strip.
  // Base card: a SQUARE picture in a framed window. Premium art: the portrait picture fills the frame and the panels sit over it.
  // Missing art draws a quiet gradient and the type's glyph, labelled ART PENDING.
  const af=BR_AFF[c.aff]||{c:'#556',d:'#222',l:'#aab'}, K=BR_INK, F='font-family="Barlow Condensed,Arial Narrow,Helvetica Neue,Arial,sans-serif"', u='bc'+(BRFU++);
  const planet=c.planet, alt=c.pk==='alt'; const art=BR_ART[c.id]; const name=c.name.split(' — ')[0], sub=c.name.includes(' — ')? c.name.split(' — ')[1] : '';
  const T=brTreat(c,d,u), rc=T.rc, rar0=c.rar;
  const W={x:24,y:47,w:202,h:168}; const cx=W.x+W.w/2, cy=W.y+W.h/2;
  const artBox=art? `<image href="${art.u}" x="${W.x}" y="${W.y}" width="${W.w}" height="${W.h}" preserveAspectRatio="xMidYMin slice" clip-path="url(#${u}c)"/>` :
    `<g clip-path="url(#${u}c)"><rect x="${W.x}" y="${W.y}" width="${W.w}" height="${W.h}" fill="url(#${u}g)"/>${planet?`<circle cx="${cx}" cy="${cy}" r="52" fill="url(#${u}o)"/><ellipse cx="${cx}" cy="${cy}" rx="92" ry="21" transform="rotate(-22 ${cx} ${cy})" fill="none" stroke="${K.cul}" stroke-opacity=".55" stroke-width="2.5"/>`:`<g transform="translate(${cx-50} ${cy-60})" fill="none" stroke="${K.cream}" stroke-opacity=".3" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round">${BR_ICON[c.type]||''}</g>`}<text x="${cx}" y="${W.y+W.h-10}" text-anchor="middle" ${F} font-weight="600" font-size="9" letter-spacing="3" fill="${K.cream}" fill-opacity=".4">ART PENDING</text></g>`;
  const stars=BR_STARS.map(([x,y,r])=>`<circle cx="${x}" cy="${y}" r="${r.toFixed(2)}" fill="${K.cream}" opacity=".28"/>`).join('');
  // panels
  const barY=25, barH=20, typeY=218, typeH=13, boxY=234, boxH=46, footY=304;
  const nameLong=name.length*10.4>150;
  const nameBar=`<rect x="26" y="${barY}" width="198" height="${barH}" rx="4" fill="url(#${u}m)" stroke="#2a1608" stroke-width="1"/><rect x="27" y="${barY+1}" width="196" height="${barH-2}" rx="3" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width=".6"/><text x="34" y="${barY+15}" ${F} font-weight="700" font-size="14.5" letter-spacing="1" fill="${rar0==='ecl'?'#fde8ec':'#0d1620'}" ${nameLong?'textLength="150" lengthAdjust="spacingAndGlyphs"':''}>${esc(name.toUpperCase())}</text>${T.pip(211,barY+10)}`;
  const typeStr=(BR_TYPEN[c.type]||c.type).toUpperCase()+' · '+c.aff.toUpperCase();
  const typeBar=`<rect x="24" y="${typeY}" width="202" height="${typeH}" rx="3" fill="#0a1119" fill-opacity="${alt?.88:1}" stroke="${K.cu}" stroke-width="1"/><text x="31" y="${typeY+9.5}" ${F} font-weight="600" font-size="9.5" letter-spacing="1.8" fill="${K.cul}" ${typeStr.length>22?'textLength="168" lengthAdjust="spacingAndGlyphs"':''}>${esc(typeStr)}</text>`;
  const room=sub?2:3; let fs=11, lines=brWrap(c.text||'', 28); if (lines.length>room){ fs=9.4; lines=brWrap(c.text||'', 36); } lines=lines.slice(0,room+1); const t0=boxY+(sub?26:18)+(lines.length<room?4:0);
  const box=`<rect x="24" y="${boxY}" width="202" height="${boxH}" rx="3" fill="${alt?'#0a1119':'#16222f'}" fill-opacity="${alt?.86:1}" stroke="${K.cu}" stroke-width="1"/>${sub?`<text x="125" y="${boxY+13}" text-anchor="middle" ${F} font-weight="700" font-size="10.5" letter-spacing="1.2" fill="${K.cul}">${esc(sub.toUpperCase())}</text>`:''}${lines.map((l,i)=>`<text x="125" y="${t0+i*(fs<10?10.5:11.5)}" text-anchor="middle" ${F} font-weight="500" font-size="${fs}" fill="${K.cream}">${esc(l)}</text>`).join('')}`;
  const plate=(x,lab,val,col)=>`<g transform="translate(${x} 283)"><path d="M0 4 L4 0 L40 0 L44 4 L44 30 L40 34 L4 34 L0 30 Z" fill="#0a1119" stroke="${col}" stroke-width="1.5"/><text x="22" y="10" text-anchor="middle" ${F} font-weight="700" font-size="7" letter-spacing="1.6" fill="${col}">${lab}</text><text x="22" y="29" text-anchor="middle" ${F} font-weight="700" font-size="21" fill="${K.cream}">${val}</text></g>`;
  const stats= planet? '' : plate(24,'ATK',c.atk,K.cul)+plate(182,'GRD',c.grd,K.cream);
  const sdef=brSetDef(c.set);
  const foot=`<text x="124" y="${footY+17}" text-anchor="end" ${F} font-weight="600" font-size="7.5" letter-spacing="1" fill="${K.dim}">${esc(brNumLabel(c))}</text><text x="132" y="${footY+17}" ${F} font-weight="700" font-size="7" letter-spacing="1" fill="${rc}">${esc((alt? BR_RARN[c.rar].replace(/ rare$/i,'') : BR_RARN[c.rar]).toUpperCase())}</text>`;
  const frameLine=`<rect x="${W.x}" y="${W.y}" width="${W.w}" height="${W.h}" rx="2" fill="none" stroke="${alt||c.rar!=='common'?rc:K.cul}" stroke-width="${alt?2:1.6}"/>`;
  const pts=null;
  return `<svg viewBox="0 0 250 350" xmlns="http://www.w3.org/2000/svg" class="tcgsvg cardsvg v2" data-fin="${brFin(d)}" role="img" aria-label="${esc(c.name+' '+BR_RARN[c.rar])}"><defs><clipPath id="${u}k"><path d="${BR_INNER}"/></clipPath><clipPath id="${u}c"><rect x="${W.x}" y="${W.y}" width="${W.w}" height="${W.h}" rx="${alt?6:2}"/></clipPath><linearGradient id="${u}f" ${T.gdir}>${T.stopsBand}</linearGradient><linearGradient id="${u}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${K.bg1}"/><stop offset="1" stop-color="${K.bg2}"/></linearGradient><linearGradient id="${u}m" ${T.gdir}>${T.stopsBar}</linearGradient>${T.defs}<linearGradient id="${u}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${af.c}" stop-opacity=".75"/><stop offset="1" stop-color="${K.bg2}"/></linearGradient><radialGradient id="${u}o" cx=".35" cy=".3"><stop offset="0" stop-color="${af.l}"/><stop offset="1" stop-color="${af.d}"/></radialGradient></defs>
    <rect width="250" height="350" rx="13" fill="#05080c"/><rect x="2" y="2" width="246" height="346" rx="11" fill="url(#${u}f)" stroke="#1a0e06" stroke-width="1.2"/><rect x="3.5" y="3.5" width="243" height="343" rx="10" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width=".8"/><path d="${BR_INNER}" fill="url(#${u}b)" stroke="#1a0e06" stroke-width="1.6" stroke-linejoin="round"/><path d="${BR_INNER}" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width=".8" transform="translate(0 -.9)"/>
    ${T.edge}${alt?'':`${stars}<g clip-path="url(#${u}k)" fill="none"><circle cx="-10" cy="372" r="118" stroke="${K.cud}" stroke-width="34" stroke-opacity=".4" stroke-dasharray="520 40 130"/><circle cx="262" cy="-20" r="96" stroke="${K.cud}" stroke-width="28" stroke-opacity=".4" stroke-dasharray="380 30 140"/><path d="M-10 300 Q130 270 262 150" stroke="${K.red}" stroke-opacity=".6" stroke-width="1"/></g>`}
    ${artBox}${frameLine}${T.pic}${nameBar}${typeBar}${box}${stats}${foot}
    <g>${planet?'':brArrowsSVG(c.mask,alt,pts)}</g></svg>`;
}
function brFoilOverlay(d){
  const v=d.v; if (v==='N') return ''; const id='bf'+(BRFU++); const rar=d.card&&d.card.rar;
  // a soft diagonal sheen, not a rainbow wash: foil and premium art catch the light, the painting stays readable
  const g=`<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff7ab8" stop-opacity="0"/><stop offset=".3" stop-color="#ffd27a" stop-opacity=".9"/><stop offset=".5" stop-color="#7affd8" stop-opacity=".9"/><stop offset=".7" stop-color="#7ab4ff" stop-opacity=".9"/><stop offset="1" stop-color="#b47aff" stop-opacity="0"/></linearGradient>`;
  const k=v==='A'? (rar==='ecl'? .12 : rar==='sig'? .1 : .08) : .08; return `<defs>${g}</defs><rect width="250" height="350" rx="12" fill="url(#${id})" opacity="${k}" style="mix-blend-mode:color-dodge"/>`;
}
function brFront(key){
  let s=BRV.get(key); if (s) return s; const d=brD(key); if (d.sealed){ s=brPackSVG(d.set,d.v); BRV.set(key,s); return s; }
  s=brCardSVG(d.card,d); const f=brFoilOverlay(d); if (f) s=s.slice(0,s.lastIndexOf('</svg>'))+f+'</svg>'; if (BRV.size>500) BRV.clear(); BRV.set(key,s); return s;
}
const brFace=cp=>{ const d=brD(cp.k); if (d.sealed||cp.g>0) return brFront(cp.k); const lab=condLabel(cp.c); return lab==='NM'&&Math.min(...cp.c)>=94? brFront(cp.k) : wearSVG(brFront(cp.k),cp); };
// ---------- packs and boxes ----------
function brPackSVG(set, f){
  const im=f==='P'? BR_PKG.pack : BR_PKG.box; if (im) return f==='P'? `<svg viewBox="0 0 200 360" xmlns="http://www.w3.org/2000/svg" class="packsvg" role="img" aria-label="Broken Reach booster pack"><image href="${im.u}" x="0" y="0" width="200" height="360" preserveAspectRatio="xMidYMid meet"/></svg>` : `<svg viewBox="0 0 300 185" xmlns="http://www.w3.org/2000/svg" class="packsvg" role="img" aria-label="Broken Reach booster box"><image href="${im.u}" x="0" y="0" width="300" height="185" preserveAspectRatio="xMidYMid meet"/></svg>`;
  const def=brSetDef(set); const F='font-family="Barlow Condensed,Arial Narrow,Helvetica Neue,Arial,sans-serif"'; const u='bk'+set+f;
  const foil=`<linearGradient id="${u}f" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff0c0"/><stop offset=".25" stop-color="#e2a43a"/><stop offset=".5" stop-color="#ffe5a0"/><stop offset=".75" stop-color="#b9791a"/><stop offset="1" stop-color="#ffe9b0"/></linearGradient>`;
  const orb=`<radialGradient id="${u}o" cx=".35" cy=".3"><stop offset="0" stop-color="#e0b070"/><stop offset=".6" stop-color="#7a4a2a"/><stop offset="1" stop-color="#2a1410"/></radialGradient>`;
  const logo=(x,y,sz,w)=>`<text x="${x}" y="${y}" text-anchor="middle" ${F} font-weight="800" font-size="${sz}" letter-spacing="${(sz*0.14).toFixed(1)}" fill="url(#${u}f)" stroke="#1a0d05" stroke-width="${(sz*0.06).toFixed(2)}" paint-order="stroke" textLength="${w}" lengthAdjust="spacingAndGlyphs">THE BROKEN REACH</text>`;
  const arrows=(cx,cy,r,col)=>[0,1,2,3,4,5,6,7].map(i=>`<path d="M0 ${-r-9} l6 12 h-12 z" transform="translate(${cx} ${cy}) rotate(${i*45})" fill="${col}"/>`).join('');
  if (f==='P'){
    const crimp=(y,h)=>{ let d=`M16 ${y}`; for (let x=16;x<184;x+=6) d+=` L${x+3} ${y+h} L${x+6} ${y}`; return `<path d="${d} V${y+h+2} H16 Z" fill="url(#${u}f)" opacity=".95"/>`; };
    return `<svg viewBox="0 0 200 280" xmlns="http://www.w3.org/2000/svg" class="packsvg" role="img" aria-label="${esc(def.name)} booster pack"><defs>${foil}${orb}<clipPath id="${u}c"><path d="M18 24 Q100 18 182 24 L184 256 Q100 262 16 256 Z"/></clipPath><linearGradient id="${u}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a313a"/><stop offset=".6" stop-color="#171b21"/><stop offset="1" stop-color="#5a1220"/></linearGradient><linearGradient id="${u}s" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".45"/><stop offset=".15" stop-color="#000" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".1"/><stop offset=".85" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".5"/></linearGradient></defs>
      <ellipse cx="100" cy="272" rx="80" ry="5" fill="#000" opacity=".18"/><g clip-path="url(#${u}c)"><rect x="10" y="14" width="180" height="250" fill="url(#${u}b)"/><circle cx="100" cy="128" r="46" fill="url(#${u}o)"/><ellipse cx="100" cy="128" rx="82" ry="18" transform="rotate(-22 100 128)" fill="none" stroke="#e2a43a" stroke-opacity=".7" stroke-width="2.5"/>${arrows(100,128,62,'#e2a43a')}<rect x="10" y="14" width="180" height="250" fill="url(#${u}s)"/></g>
      ${crimp(6,18)}${crimp(256,18)}${logo(100,56,24,156)}
      <rect x="34" y="204" width="132" height="24" rx="3" fill="#0b0f14" opacity=".78" stroke="url(#${u}f)" stroke-width="1.2"/><text x="100" y="221" text-anchor="middle" ${F} font-weight="800" font-size="14.5" fill="#fff" letter-spacing="1.2" textLength="${Math.min(118,def.name.length*8.4)}" lengthAdjust="spacingAndGlyphs">${esc(def.name.toUpperCase())}</text>
      <text x="100" y="244" text-anchor="middle" ${F} font-weight="700" font-size="9" fill="#fff" letter-spacing="2" textLength="120" lengthAdjust="spacingAndGlyphs">BOOSTER PACK · 10 CARDS</text></svg>`;
  }
  const W=150, H=118, D=44, X=18, Y=74; const side=`M${X+W} ${Y} L${X+W+D} ${Y-D*0.62} V${Y+H-D*0.62} L${X+W} ${Y+H} Z`, top=`M${X} ${Y} L${X+D} ${Y-D*0.62} H${X+W+D} L${X+W} ${Y} Z`;
  return `<svg viewBox="0 0 220 220" xmlns="http://www.w3.org/2000/svg" class="packsvg" role="img" aria-label="${esc(def.name)} booster box"><defs>${foil}${orb}<clipPath id="${u}c"><rect x="${X}" y="${Y}" width="${W}" height="${H}"/></clipPath><linearGradient id="${u}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a313a"/><stop offset=".65" stop-color="#171b21"/><stop offset="1" stop-color="#5a1220"/></linearGradient></defs>
    <ellipse cx="${X+W/2+D/2}" cy="${Y+H+6}" rx="${W/2+D/2+6}" ry="7" fill="#000" opacity=".2"/><path d="${top}" fill="#3a1520"/><path d="${top}" fill="#fff" opacity=".1"/><path d="${side}" fill="#2a0f18"/><path d="${side}" fill="#000" opacity=".25"/>
    <g clip-path="url(#${u}c)"><rect x="${X}" y="${Y}" width="${W}" height="${H}" fill="url(#${u}b)"/><circle cx="${X+W/2}" cy="${Y+H*0.55}" r="30" fill="url(#${u}o)"/><ellipse cx="${X+W/2}" cy="${Y+H*0.55}" rx="56" ry="12" transform="rotate(-22 ${X+W/2} ${Y+H*0.55})" fill="none" stroke="#e2a43a" stroke-opacity=".7" stroke-width="2"/></g>
    <rect x="${X}" y="${Y}" width="${W}" height="${H}" fill="none" stroke="url(#${u}f)" stroke-width="1.6"/>${logo(X+W/2,Y+22,18,112)}
    <text x="${X+W/2}" y="${Y+H-18}" text-anchor="middle" ${F} font-weight="800" font-size="13" fill="#fff" letter-spacing="1" textLength="${Math.min(110,def.name.length*8)}" lengthAdjust="spacingAndGlyphs">${esc(def.name.toUpperCase())}</text>
    <text x="${X+W/2}" y="${Y+H-6}" text-anchor="middle" ${F} font-weight="700" font-size="8" fill="#fff" letter-spacing="1.8" textLength="112" lengthAdjust="spacingAndGlyphs">BOOSTER BOX · 24 PACKS</text>
    <text transform="matrix(1 0 -0.62 0.38 ${X+W/2+D/2} ${Y-D*0.31+4})" text-anchor="middle" ${F} font-weight="800" font-size="13" letter-spacing="2.5" fill="#fff" opacity=".9" textLength="${W*0.72}" lengthAdjust="spacingAndGlyphs">24 PACKS · 240 CARDS</text></svg>`;
}
// ---------- graded slab ----------
function brSlab(cp){
  const d=brD(cp.k), g=cp.g; const inner=brFront(cp.k); const body=inner.slice(inner.indexOf('>')+1, inner.lastIndexOf('</svg>')); const F='font-family="Barlow Condensed,Arial Narrow,sans-serif"'; const nm=d.card.name.split(' — ')[0].toUpperCase();
  return `<svg viewBox="0 0 270 430" xmlns="http://www.w3.org/2000/svg" class="slabsvg" role="img" aria-label="${esc(d.title+' GCS '+g)}"><rect width="270" height="430" rx="12" fill="#d7dde3"/><rect x="8" y="8" width="254" height="414" rx="8" fill="#eef2f5" stroke="#aeb7bf"/><rect x="14" y="14" width="242" height="66" rx="3" fill="#fff" stroke="#c4ccd3"/><rect x="14" y="14" width="34" height="66" fill="#c0392b"/><text transform="translate(36 70) rotate(-90)" ${F} font-weight="800" font-size="19" fill="#fff" letter-spacing="3">GCS</text><text x="56" y="30" ${F} font-size="9.5" fill="#555">${esc((d.def.name+' '+d.def.code+' #'+String(d.card.cn).padStart(3,'0')).toUpperCase())}</text><text x="56" y="49" ${F} font-weight="800" font-size="17" fill="#111" ${nm.length>14?'textLength="150" lengthAdjust="spacingAndGlyphs"':''}>${esc(nm)}</text><text x="56" y="63" ${F} font-size="9" fill="#555">${esc(BR_VARN[d.v].toUpperCase()+' · '+BR_RARN[d.card.rar].toUpperCase())}</text><text x="56" y="75" ${F} font-size="7.5" fill="#888">CERT ${cp.cert||''}</text><text x="236" y="52" text-anchor="end" ${F} font-weight="800" font-size="38" fill="#111">${g}</text><text x="236" y="70" text-anchor="end" ${F} font-weight="700" font-size="9" fill="#c0392b">${esc(GRADE_NAMES[g].toUpperCase())}</text><g transform="translate(22 92) scale(.904)">${body}</g></svg>`;
}
const bMiniT=cp=>`<div class="mini ${cp.g>0?'slab':''}">${cp.g>0?brSlab(cp):brFace(cp)}</div>`;
const bMiniTKey=k=>`<div class="mini">${brFront(k)}</div>`;
function brPopHTML(key){ const p=G.bpop[key]; if (!p) return '<div class="muted small">No copies graded yet.</div>'; let tot=0; p.forEach(n=>tot+=n); return `<table class="tbl"><tbody>${[10,9,8,7,6,5,4,3,2,1].filter(g=>p[g]).map(g=>`<tr><td>GCS ${g} ${GRADE_NAMES[g]}</td><td class="r">${p[g]}</td></tr>`).join('')}<tr><td><b>Total graded</b></td><td class="r"><b>${tot}</b></td></tr></tbody></table>`; }
// ---------- plugging into the shared viewers ----------
const B_objFor=objFor; objFor=function(kind,id){ return kind==='b'? BRC(id) : B_objFor(kind,id); };
const B_faceSVG=faceSVG; faceSVG=function(kind,o,hi){ if (kind!=='b') return B_faceSVG(kind,o,hi); const s=o.g>0? brSlab(o) : brFace(o); return hi? (o.g>0? polishSlab(s) : polishCard(s)) : s; };
const B_finOf=finOf; finOf=function(kind,o){ if (kind!=='b') return B_finOf(kind,o); if (o.g>0) return 'slab'; const f=brFin(brD(o.k)); return f==='refr'||f==='super'?'refr':'gloss'; };
const B_pcData=pcData; pcData=function(kind,o){ if (kind!=='b') return B_pcData(kind,o);
  const d=brD(o.k), g=o.g>0?o.g:0, r=brEst(o.k,g,o), sales=brSales(o.k,g);
  return { key:o.k, g, title:d.title, sub:d.sealed? d.def.name : d.def.name+' · '+String(d.card.cn).padStart(3,'0')+' · '+BR_VARN[d.v], cond: g? 'GCS '+g+' '+GRADE_NAMES[g] : d.sealed? 'Sealed' : COND_LABN[condLabel(o.c)], r, sales, other:(G.sales[o.k]||[]).filter(x=>(x[2]||0)!==g).slice(0,3), gl:x=>x>0?'GCS '+x:'Raw',
    meta:[['Set',d.def.name],['Rarity',d.sealed?'':BR_RARN[d.card.rar]],['Print',BR_VARN[d.v]]] }; };
const B_va=v3Art; v3Art=function(kind,o){ return kind==='b'? (o.g>0? brSlab(o) : polishCard(brFace(o),{flat:1})) : B_va(kind,o); };
const B_vb=v3Back; v3Back=function(kind,o){ if (kind!=='b') return B_vb(kind,o); return o.g>0? B_vb('c',o) : BRF.back(); };
const B_rvRaw=rvRaw; rvRaw=function(k,o){ return k==='b'? polishCard(brFace(o)) : B_rvRaw(k,o); };
const B_rvSlab=rvSlab; rvSlab=function(k,o){ return k==='b'? polishSlab(brSlab(o)) : B_rvSlab(k,o); };
const B_rvTitle=rvTitle; rvTitle=function(k,o){ return k==='b'? brD(o.k).title : B_rvTitle(k,o); };
const B_rvValue=rvValue; rvValue=function(k,o){ return k==='b'? brCopyValue(o) : B_rvValue(k,o); };
const B_popLine=popLine; popLine=function(k,o){ if (k!=='b') return B_popLine(k,o); const g=o.g; if (!(g>0)) return ''; const p=G.bpop[o.k]||[]; let tot=0, at=p[g]||0, hi=0; p.forEach((n,i)=>{ tot+=n; if (i>g) hi+=n; }); if (tot<=1) return 'The only copy GCS has graded so far'; if (!hi && at===1) return 'The highest grade of '+tot+' graded copies'; if (!hi) return 'Tied for the highest grade: '+at+' of '+tot+' graded copies'; return at+' at GCS '+g+', '+hi+' graded higher, '+tot+' graded in total'; };
const B_inspDetail=ACT.inspdetail; ACT.inspdetail=function(a,el,e){ const [k,id]=a.split(':'); if (k==='b'){ closeInspect(); return ACT.bropy(id); } return B_inspDetail(a,el,e); };
const B_rc2=resetCaches; resetCaches=function(){ B_rc2(); BRV.clear(); };
