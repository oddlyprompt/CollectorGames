// ===================== TIDEMARK: HOW CARDS LOOK =====================
// A card face is the game's own frame (tools/tidemark/v1/render.js, tidemark-production/FRAME_GUIDE.md) drawn on a canvas with the approved
// painting, kept as a picture inside the card's SVG so wear, foil, slabs and the 3D viewer work as they do for every other game. The picture
// is drawn the first time a card is shown (a few milliseconds) and swapped into every place that shows it.
const XTV=new Map(); let XTFU=0;
const XTF={EL:{}, back(){ return `<svg viewBox="0 0 250 350" xmlns="http://www.w3.org/2000/svg" class="tcgsvg cardsvg" role="img" aria-label="Tidemark card back"><rect width="250" height="350" rx="12" fill="#0b0b0c"/><rect x="9" y="9" width="232" height="332" rx="8" fill="#14344a"/><g fill="none" stroke="#7fb6cf" stroke-width="1.6" opacity=".55">${[0,1,2,3,4,5,6,7,8].map(i=>`<path d="M9 ${60+i*30} q 29 -16 58 0 t 58 0 t 58 0 t 58 0"/>`).join('')}</g><circle cx="125" cy="175" r="52" fill="#0d2535" stroke="#d9b45a" stroke-width="3"/><path d="M125 135 v80 M85 175 h80 M97 147 l56 56 M153 147 l-56 56" stroke="#d9b45a" stroke-width="3" stroke-linecap="round"/><circle cx="125" cy="175" r="9" fill="#d9b45a"/><text x="125" y="48" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="22" letter-spacing="5" fill="#e8d9a8">TIDEMARK</text></svg>`; }};
for (const k in TM_FAC) XTF.EL[TM_FAC[k].n]={c:TM_FAC[k].c,d:TM_FAC[k].d,l:TM_FAC[k].l};
function xtFin(d){ if (d.sealed) return 'gloss'; return d.v==='F'?'refr': d.v==='A'?'super':'gloss'; }
const TM_IMG=new Map(), TM_PEND=new Set(), TM_Q=[]; let tmBusy=false, tmFontsOk=false;
const tmImgKey=c=>c.set+'|'+c.no;
function tmCardSpec(c){ const s=xtSetDef(c.set); return {pid:c.set+'|'+c.no, collector:s.code+' '+String(c.cn).padStart(3,'0')+'/'+s.total, setName:s.name, mark:c.set===TM_TT?'X':s.code, n:c.name, type:XT_KINDN[c.kind], sub:c.sub, f:c.f, fac:c.el, al:c.al, r:c.r, cost:c.cost, req:c.req, pt:c.pow!=null? c.pow+'/'+c.tgh : '', kwline:c.kwl, rules:c.rules}; }
function tmLoad(u){ return new Promise(res=>{ const im=new Image(); im.onload=()=>res(im); im.onerror=()=>res(null); im.src=u; }); }
async function tmDraw(c){
  if (!tmFontsOk){ tmFontsOk=true; try { await Promise.race([document.fonts.load("700 24px Cinzel"), new Promise(r=>setTimeout(r,1500))]); } catch(e){} }
  const art=TM_ART[c.ill]; const img=art? await tmLoad(art.u) : null; const W=380, cv=document.createElement('canvas'); cv.width=W; cv.height=Math.round(W*88/63);
  TMRender.drawCard(cv.getContext('2d'), tmCardSpec(c), img, W); const url=cv.toDataURL('image/webp',0.86); const k=tmImgKey(c); TM_IMG.set(k,url);
  if (TM_IMG.size>700) TM_IMG.delete(TM_IMG.keys().next().value);
  document.querySelectorAll('image[data-tm="'+k+'"]').forEach(el=>el.setAttribute('href',url)); XTV.clear();
}
async function tmPump(){ tmBusy=true; while (TM_Q.length){ const c=TM_Q.shift(); try { await tmDraw(c); } catch(e){ console.error(e); } TM_PEND.delete(tmImgKey(c)); await new Promise(r=>setTimeout(r,0)); } tmBusy=false; }
function tmImgUrl(c){ const k=tmImgKey(c); const u=TM_IMG.get(k); if (u) return u; if (!TM_PEND.has(k)){ TM_PEND.add(k); TM_Q.push(c); if (!tmBusy) tmPump(); } return ''; }
function xtFoilOverlay(d){
  const v=d.v; if (v==='N') return ''; const id='tf'+(XTFU++); const g=`<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff3c8c"/><stop offset=".18" stop-color="#ffc83c"/><stop offset=".36" stop-color="#3cffa0"/><stop offset=".54" stop-color="#3caaff"/><stop offset=".72" stop-color="#aa5aff"/><stop offset=".9" stop-color="#ff3c8c"/><stop offset="1" stop-color="#ffc83c"/></linearGradient><pattern id="${id}p" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><path d="M0 4 H8" stroke="#fff" stroke-width=".7" opacity=".55"/></pattern>`;
  const k=v==='A'? .3 : .24; return `<defs>${g}</defs><rect width="250" height="350" rx="12" fill="url(#${id})" opacity="${k}" style="mix-blend-mode:color-dodge"/><rect width="250" height="350" rx="12" fill="url(#${id}p)" opacity=".12"/>`;
}
function xtFront(key){
  let s=XTV.get(key); if (s) return s; const d=xtD(key); if (d.sealed){ s=xtPackSVG(d.set,d.v); XTV.set(key,s); return s; }
  const c=d.card, url=tmImgUrl(c);
  s=`<svg viewBox="0 0 250 350" xmlns="http://www.w3.org/2000/svg" class="tcgsvg cardsvg v2" data-fin="${xtFin(d)}" role="img" aria-label="${esc(c.name+' '+XT_RARN[c.rar])}"><rect width="250" height="350" rx="12" fill="#17191d"/><image data-tm="${tmImgKey(c)}" href="${url}" x="0" y="0" width="250" height="350" preserveAspectRatio="none"/></svg>`;
  const f=xtFoilOverlay(d); if (f) s=s.slice(0,s.lastIndexOf('</svg>'))+f+'</svg>';
  if (url){ if (XTV.size>500) XTV.clear(); XTV.set(key,s); } return s;
}
const xtFace=cp=>{ const d=xtD(cp.k); if (d.sealed||cp.g>0) return xtFront(cp.k); const lab=condLabel(cp.c); return lab==='NM'&&Math.min(...cp.c)>=94? xtFront(cp.k) : wearSVG(xtFront(cp.k),cp); };

// ---------- packs and boxes ----------
// Tidemark has no packaging renders yet: the wrapper and the box are drawn here, dressed in the set's own paintings
function xtPackArt(f, set){ const L=xtSetCards(set).filter(c=>c.pk!=='alt').sort((a,b)=>XT_RAROR[b.rar]-XT_RAROR[a.rar]||b.fan-a.fan).map(c=>c.ill); for (const id of L) if (TM_ART[id]) return TM_ART[id]; return null; }
function xtPackSVG(set, f, v){ return xtPackDrawn(set,f); }
function xtPackDrawn(set, f){
  const def=xtSetDef(set); const hue=(hsh('pk'+set)%360); const c1=`hsl(${hue} 62% 46%)`, c2=`hsl(${(hue+40)%360} 70% 26%)`; const F='font-family="Barlow Condensed,Arial Narrow,Helvetica Neue,Arial,sans-serif"';
  const u='k'+set+f; const art=xtPackArt(f,set); const name=def.name.toUpperCase();
  const foil=`<linearGradient id="${u}f" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff7d6"/><stop offset=".25" stop-color="#e2b84a"/><stop offset=".5" stop-color="#fff2c2"/><stop offset=".75" stop-color="#c9952f"/><stop offset="1" stop-color="#ffeab0"/></linearGradient>`;
  const holo=`<linearGradient id="${u}h" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff7ad9" stop-opacity=".0"/><stop offset=".35" stop-color="#7af3ff" stop-opacity=".22"/><stop offset=".5" stop-color="#fff" stop-opacity=".42"/><stop offset=".65" stop-color="#ffe17a" stop-opacity=".22"/><stop offset="1" stop-color="#b47aff" stop-opacity="0"/></linearGradient>`;
  const img=(x,y,w,h)=> art? `<image href="${art.u}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice"/>` : `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c1}"/>`;
  const logo=(x,y,sz,w)=>`<text x="${x}" y="${y}" text-anchor="middle" ${F} font-weight="800" font-size="${sz}" letter-spacing="${(sz*0.18).toFixed(1)}" fill="url(#${u}f)" stroke="#2a1606" stroke-width="${(sz*0.07).toFixed(2)}" paint-order="stroke" textLength="${w}" lengthAdjust="spacingAndGlyphs">TIDEMARK</text>`;
  if (f==='P'){
    // a pillow pack: crimped seals top and bottom, slight bulge, painted front, foil wordmark, holo sheen
    const crimp=(y,h)=>{ let d=`M16 ${y}`; for (let x=16;x<184;x+=6) d+=` L${x+3} ${y+h} L${x+6} ${y}`; return `<path d="${d} V${y+h+2} H16 Z" fill="url(#${u}f)" opacity=".95"/><rect x="16" y="${y}" width="168" height="${h}" fill="url(#${u}f)" opacity=".55"/>`; };
    return `<svg viewBox="0 0 200 280" xmlns="http://www.w3.org/2000/svg" class="packsvg" role="img" aria-label="${esc(def.name)} booster pack"><defs>${foil}${holo}
      <clipPath id="${u}c"><path d="M18 24 Q100 18 182 24 L184 256 Q100 262 16 256 Z"/></clipPath>
      <linearGradient id="${u}s" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".45"/><stop offset=".12" stop-color="#000" stop-opacity=".0"/><stop offset=".5" stop-color="#fff" stop-opacity=".10"/><stop offset=".88" stop-color="#000" stop-opacity=".0"/><stop offset="1" stop-color="#000" stop-opacity=".5"/></linearGradient>
      <linearGradient id="${u}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c2}" stop-opacity=".0"/><stop offset=".55" stop-color="${c2}" stop-opacity=".1"/><stop offset="1" stop-color="${c2}" stop-opacity=".95"/></linearGradient></defs>
      <ellipse cx="100" cy="272" rx="80" ry="5" fill="#000" opacity=".18"/>
      <g clip-path="url(#${u}c)">${img(10,14,180,250)}<rect x="10" y="14" width="180" height="250" fill="url(#${u}b)"/><rect x="10" y="14" width="180" height="70" fill="${c2}" opacity=".55"/>
        <rect x="-60" y="14" width="120" height="250" fill="url(#${u}h)" transform="rotate(18 100 140)"/><rect x="10" y="14" width="180" height="250" fill="url(#${u}s)"/></g>
      ${crimp(6,18)}${crimp(256,18)}
      ${logo(100,62,30,150)}
      <rect x="40" y="196" width="120" height="26" rx="4" fill="#0b0f1a" opacity=".72" stroke="url(#${u}f)" stroke-width="1.2"/><text x="100" y="215" text-anchor="middle" ${F} font-weight="800" font-size="17" fill="#fff" letter-spacing="1.5" textLength="${Math.min(108,name.length*10)}" lengthAdjust="spacingAndGlyphs">${esc(name)}</text>
      <text x="100" y="240" text-anchor="middle" ${F} font-weight="700" font-size="9" fill="#fff" letter-spacing="2" textLength="120" lengthAdjust="spacingAndGlyphs">BOOSTER PACK · 12 CARDS</text>
      <g transform="translate(160 86)"><circle r="13" fill="#0b0f1a" opacity=".7" stroke="url(#${u}f)" stroke-width="1.2"/><text y="4" text-anchor="middle" ${F} font-weight="800" font-size="10" fill="#fff">${esc(def.code)}</text></g></svg>`;
  }
  // a booster box at three-quarter view: painted front, darker side, lid with the wordmark
  const W=150, H=118, D=44, X=18, Y=74;   // front face size, depth, front-left corner
  const side=`M${X+W} ${Y} L${X+W+D} ${Y-D*0.62} V${Y+H-D*0.62} L${X+W} ${Y+H} Z`, top=`M${X} ${Y} L${X+D} ${Y-D*0.62} H${X+W+D} L${X+W} ${Y} Z`;
  return `<svg viewBox="0 0 220 220" xmlns="http://www.w3.org/2000/svg" class="packsvg" role="img" aria-label="${esc(def.name)} booster box"><defs>${foil}${holo}
    <clipPath id="${u}c"><rect x="${X}" y="${Y}" width="${W}" height="${H}"/></clipPath>
    <linearGradient id="${u}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c2}" stop-opacity=".15"/><stop offset=".6" stop-color="${c2}" stop-opacity=".05"/><stop offset="1" stop-color="${c2}" stop-opacity=".9"/></linearGradient>
    <linearGradient id="${u}t" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs>
    <ellipse cx="${X+W/2+D/2}" cy="${Y+H+6}" rx="${W/2+D/2+6}" ry="7" fill="#000" opacity=".2"/>
    <path d="${top}" fill="url(#${u}t)"/><path d="${top}" fill="#fff" opacity=".12"/>
    <path d="${side}" fill="${c2}"/><path d="${side}" fill="#000" opacity=".25"/>
    <text transform="translate(${X+W+D*0.55} ${Y+H*0.5}) skewY(-31.8) rotate(-90)" text-anchor="middle" ${F} font-weight="800" font-size="11" letter-spacing="2" fill="url(#${u}f)" textLength="${H*0.8}" lengthAdjust="spacingAndGlyphs">${esc(name)}</text>
    <g clip-path="url(#${u}c)">${img(X,Y-20,W,H+40)}<rect x="${X}" y="${Y}" width="${W}" height="${H}" fill="url(#${u}b)"/><rect x="${X-40}" y="${Y}" width="70" height="${H}" fill="url(#${u}h)" transform="rotate(20 ${X+W/2} ${Y+H/2})"/></g>
    <rect x="${X}" y="${Y}" width="${W}" height="${H}" fill="none" stroke="url(#${u}f)" stroke-width="1.6"/>
    ${logo(X+W/2,Y+24,22,104)}
    <text x="${X+W/2}" y="${Y+H-22}" text-anchor="middle" ${F} font-weight="800" font-size="15" fill="#fff" letter-spacing="1.2" textLength="${Math.min(110,name.length*9)}" lengthAdjust="spacingAndGlyphs">${esc(name)}</text>
    <text x="${X+W/2}" y="${Y+H-8}" text-anchor="middle" ${F} font-weight="700" font-size="8" fill="#fff" letter-spacing="1.8" textLength="112" lengthAdjust="spacingAndGlyphs">BOOSTER BOX · 36 PACKS</text>
    <text transform="matrix(1 0 -0.62 0.38 ${X+W/2+D/2} ${Y-D*0.31+4})" text-anchor="middle" ${F} font-weight="800" font-size="13" letter-spacing="2.5" fill="#fff" opacity=".9" textLength="${W*0.72}" lengthAdjust="spacingAndGlyphs">36 PACKS · 432 CARDS</text></svg>`;
}
// ---------- graded slab ----------
function xtSlab(cp){
  const d=xtD(cp.k), g=cp.g; const inner=xtFront(cp.k); const body=inner.slice(inner.indexOf('>')+1, inner.lastIndexOf('</svg>')); const F='font-family="Barlow Condensed,Arial Narrow,sans-serif"'; const nm=d.card.name.toUpperCase();
  return `<svg viewBox="0 0 270 430" xmlns="http://www.w3.org/2000/svg" class="slabsvg" role="img" aria-label="${esc(d.title+' GCS '+g)}"><rect width="270" height="430" rx="12" fill="#d7dde3"/><rect x="8" y="8" width="254" height="414" rx="8" fill="#eef2f5" stroke="#aeb7bf"/><rect x="14" y="14" width="242" height="66" rx="3" fill="#fff" stroke="#c4ccd3"/><rect x="14" y="14" width="34" height="66" fill="#c0392b"/><text transform="translate(36 70) rotate(-90)" ${F} font-weight="800" font-size="19" fill="#fff" letter-spacing="3">GCS</text><text x="56" y="30" ${F} font-size="9.5" fill="#555">${esc((d.def.name+' '+d.def.code+' #'+String(d.no).padStart(3,'0')).toUpperCase())}</text><text x="56" y="49" ${F} font-weight="800" font-size="17" fill="#111" ${nm.length>14?'textLength="150" lengthAdjust="spacingAndGlyphs"':''}>${esc(nm)}</text><text x="56" y="63" ${F} font-size="9" fill="#555">${esc(XT_VARN[d.v].toUpperCase()+' · '+XT_RARN[d.card.rar].toUpperCase())}</text><text x="56" y="75" ${F} font-size="7.5" fill="#888">CERT ${cp.cert||''}</text><text x="236" y="52" text-anchor="end" ${F} font-weight="800" font-size="38" fill="#111">${g}</text><text x="236" y="70" text-anchor="end" ${F} font-weight="700" font-size="9" fill="#c0392b">${esc(GRADE_NAMES[g].toUpperCase())}</text><g transform="translate(22 92) scale(.904)">${body}</g></svg>`;
}
const xMiniT=cp=>`<div class="mini ${cp.g>0?'slab':''}">${cp.g>0?xtSlab(cp):xtFace(cp)}</div>`;
const xMiniTKey=k=>`<div class="mini">${xtFront(k)}</div>`;
function xtPopHTML(key){ const p=G.xpop[key]; if (!p) return '<div class="muted small">No copies graded yet.</div>'; let tot=0; p.forEach(n=>tot+=n); return `<table class="tbl"><tbody>${[10,9,8,7,6,5,4,3,2,1].filter(g=>p[g]).map(g=>`<tr><td>GCS ${g} ${GRADE_NAMES[g]}</td><td class="r">${p[g]}</td></tr>`).join('')}<tr><td><b>Total graded</b></td><td class="r"><b>${tot}</b></td></tr></tbody></table>`; }
// ---------- plugging into the shared viewers ----------
const X_objFor=objFor; objFor=function(kind,id){ return kind==='x'? XT(id) : X_objFor(kind,id); };
const X_faceSVG=faceSVG; faceSVG=function(kind,o,hi){ if (kind!=='x') return X_faceSVG(kind,o,hi); const s=o.g>0? xtSlab(o) : xtFace(o); return hi? (o.g>0? polishSlab(s) : polishCard(s)) : s; };
const X_finOf=finOf; finOf=function(kind,o){ if (kind!=='x') return X_finOf(kind,o); if (o.g>0) return 'slab'; const f=xtFin(xtD(o.k)); return f==='refr'||f==='super'?'refr':'gloss'; };
const X_pcData=pcData; pcData=function(kind,o){ if (kind!=='x'){ const r=X_pcData(kind,o); return r; }
  const d=xtD(o.k), g=o.g>0?o.g:0, r=xtEst(o.k,g,o), sales=xtSales(o.k,g);
  return { key:o.k, g, title:d.title, sub:d.sealed? d.def.name : d.def.name+' · '+String(d.card.cn).padStart(3,'0')+' · '+XT_VARN[d.v], cond: g? 'GCS '+g+' '+GRADE_NAMES[g] : d.sealed? 'Sealed' : COND_LABN[condLabel(o.c)], r, sales, other:(G.sales[o.k]||[]).filter(x=>(x[2]||0)!==g).slice(0,3), gl:x=>x>0?'GCS '+x:'Raw',
    meta:[['Set',d.def.name],['Rarity',d.sealed?'':XT_RARN[d.card.rar]],['Print',XT_VARN[d.v]],['Legal in Standard', d.sealed?'':({std:'Yes',rot:'No, Eternal only',ban:'No, banned'})[xtLegalState(d.cid)]]] }; };
const X_va=v3Art; v3Art=function(kind,o){ return kind==='x'? (o.g>0? xtSlab(o) : polishCard(xtFace(o),{flat:1})) : X_va(kind,o); };
const X_vb=v3Back; v3Back=function(kind,o){ if (kind!=='x') return X_vb(kind,o); return o.g>0? X_vb('c',o) : XTF.back(); };
const X_rvRaw=rvRaw; rvRaw=function(k,o){ return k==='x'? polishCard(xtFace(o)) : X_rvRaw(k,o); };
const X_rvSlab=rvSlab; rvSlab=function(k,o){ return k==='x'? polishSlab(xtSlab(o)) : X_rvSlab(k,o); };
const X_rvTitle=rvTitle; rvTitle=function(k,o){ return k==='x'? xtD(o.k).title : X_rvTitle(k,o); };
const X_rvValue=rvValue; rvValue=function(k,o){ return k==='x'? xtCopyValue(o) : X_rvValue(k,o); };
const X_popLine=popLine; popLine=function(k,o){ if (k!=='x') return X_popLine(k,o); const g=o.g; if (!(g>0)) return ''; const p=G.xpop[o.k]||[]; let tot=0, at=p[g]||0, hi=0; p.forEach((n,i)=>{ tot+=n; if (i>g) hi+=n; }); if (tot<=1) return 'The only copy GCS has graded so far'; if (!hi && at===1) return 'The highest grade of '+tot+' graded copies'; if (!hi) return 'Tied for the highest grade: '+at+' of '+tot+' graded copies'; return at+' at GCS '+g+', '+hi+' graded higher, '+tot+' graded in total'; };
const X_inspDetail=ACT.inspdetail; ACT.inspdetail=function(a,el,e){ const [k,id]=a.split(':'); if (k==='x'){ closeInspect(); return ACT.xtopy(id); } return X_inspDetail(a,el,e); };
const X_rc2=resetCaches; resetCaches=function(){ X_rc2(); XTV.clear(); };

