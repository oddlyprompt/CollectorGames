// ===================== TCG: HOW CARDS LOOK =====================
const TCV=new Map(); let TFU=0;
const TC_SUB={ally:'Ally  ·  Play one each turn', gear:'Gear  ·  Attach or use', biome:'Biome  ·  Stays in play', tactic:'Tactic  ·  Use once, then discard'};
function tcFin(d){ if (d.sealed) return 'gloss'; return d.v==='H'||d.v==='I'||d.v==='F'?'refr': d.v==='X'||d.v==='C'?'super':'gloss'; }
// the picture for a card: approved pieces from WK_ART, a labelled placeholder for anything not approved yet
function tcPic(c){
  const a=tcArtOf(c), A=id=>id? WK_ART[id]||null : null; const col=TCF.EL[c.el]||(c.kind!=='creature'? {c:TCF.KIND[c.kind]?TCF.KIND[c.kind].c:'#888',d:TCF.KIND[c.kind]?TCF.KIND[c.kind].d:'#333',l:TCF.KIND[c.kind]?TCF.KIND[c.kind].p:'#eee'} : null);
  if (a.l==='vector-essence') return null;
  if (a.l==='illustration' || a.l==='full-art'){ const ill=A(a.i)||(a.l==='illustration'? A(a.x) : null); return {ill:ill||null, ida:a.i, col, label:'ART PENDING'}; }
  if (a.l==='cutout-on-scene') return {bg:A(a.b), bgid:a.b, fg:A(a.s), fgid:a.s, col};
  if (a.l==='cutout-on-panel') return {fg:A(a.s), fgid:a.s, col, big:c.kind==='gear'};
  return {ill:null, ida:'', col};
}
function tcFoot(c){ const st=tcArtState(c).state; const rules=''; const art= st==='pending'?'art pending': st==='partial'?'art in progress': st==='interim'?'interim art':''; return [rules,art].filter(Boolean).join('  ·  ')||'Illus. Wildkin Games'; }
function tcFrameInput(d){
  const c=d.card;
  const o={ name:c.name, el:c.el||TC_EL[0], stage:c.stage, from:c.from, hp:c.hp, type:(c.el||'')+' Wildkin'+(c.el2?' / '+c.el2:''), size:c.to?'evolves into '+c.to: c.from? '' : (c.stage==='Basic'&&!c.to?'standalone':''),
    atk:c.atk, ab:c.ab, weak:c.weak, ret:c.ret, rar:c.rar, num:tcNumLabel(c), kind:c.kind, rules:c.rules, flavor:'', sub:TC_SUB[c.kind]||'', top:c.kind==='biome'&&c.el? c.el.toUpperCase()+' BIOME' : (TC_KINDN[c.kind]||'').toUpperCase(), pk:c.pk, kindLabel:TC_KINDN[c.kind], foot:tcFoot(c), ffx:.5 };
  return o;
}
function tcFoilOverlay(d){
  const v=d.v; if (v==='N') return ''; const id='tf'+(TFU++); const g=`<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff3c8c"/><stop offset=".18" stop-color="#ffc83c"/><stop offset=".36" stop-color="#3cffa0"/><stop offset=".54" stop-color="#3caaff"/><stop offset=".72" stop-color="#aa5aff"/><stop offset=".9" stop-color="#ff3c8c"/><stop offset="1" stop-color="#ffc83c"/></linearGradient><pattern id="${id}p" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><path d="M0 4 H8" stroke="#fff" stroke-width=".7" opacity=".55"/></pattern>`;
  const isT=d.card.kind!=='creature'; const win= isT? [14,45,222,166] : [14,43,222,152];
  if (v==='R') return `<defs>${g}</defs><path fill-rule="evenodd" d="M0 0H250V350H0Z M${win[0]} ${win[1]}H${win[0]+win[2]}V${win[1]+win[3]}H${win[0]}Z" fill="url(#${id})" opacity=".26" style="mix-blend-mode:color-dodge"/><path fill-rule="evenodd" d="M0 0H250V350H0Z M${win[0]} ${win[1]}H${win[0]+win[2]}V${win[1]+win[3]}H${win[0]}Z" fill="url(#${id}p)" opacity=".16"/>`;
  if (v==='H') return `<defs>${g}</defs><rect x="${win[0]}" y="${win[1]}" width="${win[2]}" height="${win[3]}" fill="url(#${id})" opacity=".34" style="mix-blend-mode:color-dodge"/><rect x="${win[0]}" y="${win[1]}" width="${win[2]}" height="${win[3]}" fill="url(#${id}p)" opacity=".2"/>`;
  const k=v==='X'||v==='C'? .3 : .2; return `<defs>${g}</defs><rect width="250" height="350" rx="12" fill="url(#${id})" opacity="${k}" style="mix-blend-mode:color-dodge"/><rect width="250" height="350" rx="12" fill="url(#${id}p)" opacity=".12"/>`;
}
function tcFront(key){
  let s=TCV.get(key); if (s) return s; const d=tcD(key); if (d.sealed){ s=tcPackSVG(d.set,d.v); TCV.set(key,s); return s; }
  const c=d.card, o=tcFrameInput(d); const art=tcPic(c);
  s = tcIsPrem(c)? TCF.full(o,art) : c.kind==='essence'? TCF.energy(o,art) : c.kind!=='creature'? TCF.trainer(o,art) : TCF.creature(o,art);
  s=s.replace('class="tcgsvg"','class="tcgsvg cardsvg v2" data-fin="'+tcFin(d)+'" role="img" aria-label="'+esc(c.name+' '+TC_RARN[c.rar])+'"'); const f=tcFoilOverlay(d); if (f) s=s.slice(0,s.lastIndexOf('</svg>'))+f+'</svg>';
  if (TCV.size>500) TCV.clear(); TCV.set(key,s); return s;
}
function tcWear(svg, cp){
  const c=cp.c; const r=mkRng(cp.id*131+7); let o='';
  const cw=100-c[1]; if (cw>6){ const s0=2.5+(cw-6)*0.28; [[0,0,1,1],[250,0,-1,1],[0,350,1,-1],[250,350,-1,-1]].forEach(([x,y,sx,sy],i)=>{ if (r()<0.35+cw/60){ const s=s0*(0.5+r()); o+=`<path d="M${x} ${y} L${x+sx*s} ${y} L${x} ${y+sy*s} Z" fill="#fff" opacity="${(0.55+0.4*r()).toFixed(2)}"/>`; } });
    if (cw>22) for (let i=0;i<4;i++){ const sx=r()<0.5?0:250, sy=r()<0.5?0:350; const k=sx?-1:1, m=sy?-1:1; o+=`<circle cx="${sx+k*2}" cy="${sy+m*2}" r="${3+r()*4}" fill="#e9e6df" opacity=".8"/>`; } }
  const ew=100-c[2]; if (ew>5){ const n=Math.min(40,Math.floor(ew*1.2)); for (let i=0;i<n;i++){ const side=Math.floor(r()*4); const p=6+r()*238, q=1+r()*2.5, L=2+r()*(3+ew*0.1); o+= side<2? `<rect x="${p.toFixed(1)}" y="${side?350-q-0.3:0.3}" width="${L.toFixed(1)}" height="${q.toFixed(1)}" fill="#fff" opacity="${(0.5+r()*0.4).toFixed(2)}"/>` : `<rect x="${side===2?0.3:250-q-0.3}" y="${(6+r()*338).toFixed(1)}" width="${q.toFixed(1)}" height="${L.toFixed(1)}" fill="#fff" opacity="${(0.5+r()*0.4).toFixed(2)}"/>`; } }
  const sw=100-c[3]; if (sw>5){ const n=Math.min(14,Math.floor(sw/2.2)); for (let i=0;i<n;i++){ const x=10+r()*220, y=40+r()*230, L=14+r()*(30+sw*1.2), a=(r()*70-35)*Math.PI/180; o+=`<path d="M${x.toFixed(1)} ${y.toFixed(1)} l${(Math.cos(a)*L).toFixed(1)} ${(Math.sin(a)*L).toFixed(1)}" stroke="#fff" stroke-width="${(0.4+r()*0.7).toFixed(2)}" opacity="${(0.25+r()*0.4).toFixed(2)}"/>`; }
    if (sw>32){ const y=60+r()*190; o+=`<path d="M0 ${y.toFixed(1)} Q125 ${(y+(r()*30-15)).toFixed(1)} 250 ${(y+(r()*24-12)).toFixed(1)}" stroke="#fff" stroke-width="1.6" opacity=".5"/><path d="M0 ${(y+1.6).toFixed(1)} Q125 ${(y+1.6+(r()*30-15)).toFixed(1)} 250 ${(y+1.6+(r()*24-12)).toFixed(1)}" stroke="#000" stroke-width=".8" opacity=".3"/>`; } }
  if (c[0]<90){ const sh=(90-c[0])*0.25; o+=`<rect x="${r()<0.5?0:250-sh}" y="0" width="${sh.toFixed(1)}" height="350" fill="#000" opacity=".12"/>`; }
  return o? svg.slice(0,svg.lastIndexOf('</svg>'))+`<g>${o}</g></svg>` : svg;
}
const tcFace=cp=>{ const d=tcD(cp.k); if (d.sealed||cp.g>0) return tcFront(cp.k); const lab=tcLabel(cp.c); return lab==='NM'&&Math.min(...cp.c)>=94? tcFront(cp.k) : tcWear(tcFront(cp.k),cp); };
// ---------- packs and boxes ----------
function tcPackSVG(set, f){
  const def=tcSetDef(set); const hue=(hsh('pk'+set)%360); const c1=`hsl(${hue} 62% 46%)`, c2=`hsl(${(hue+40)%360} 70% 30%)`, hi=`hsl(${hue} 80% 74%)`; const F='font-family="Barlow Condensed,Arial Narrow,sans-serif"'; const m=WK_ART['cut.001-cactuft.standing'];
  const mascot=(x,y,w,h)=>{ if (!m) return `<g transform="translate(${x+w/2} ${y+h/2}) scale(${(Math.min(w,h)/26).toFixed(2)})"><path d="${TCF.GLYPH.Verdant}" fill="#fff" fill-opacity=".85"/></g>`; const k=Math.min(w/m.w,h/m.h)*0.92; const fw=m.w*k, fh=m.h*k; return `<image href="${m.u}" x="${(x+(w-fw)/2).toFixed(1)}" y="${(y+h-fh).toFixed(1)}" width="${fw.toFixed(1)}" height="${fh.toFixed(1)}"/>`; };
  if (f==='P') return `<svg viewBox="0 0 200 280" xmlns="http://www.w3.org/2000/svg" class="packsvg"><defs><linearGradient id="pg${set}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${hi}"/><stop offset=".4" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient><radialGradient id="pr${set}" cx=".5" cy=".55" r=".6"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs><path d="M30 18 H170 L180 48 V270 H20 V48 Z" fill="url(#pg${set})"/><path d="M30 18 H170 L180 48 H20 Z" fill="#000" opacity=".25"/>${Array.from({length:9},(_,i)=>`<path d="M${26+i*18} 18 v-8" stroke="#000" stroke-opacity=".35" stroke-width="3"/>`).join('')}<text x="100" y="40" text-anchor="middle" ${F} font-weight="800" font-size="19" letter-spacing="5" fill="#fff">WILDKIN</text><circle cx="100" cy="142" r="62" fill="url(#pr${set})"/>${mascot(40,80,120,124)}<text x="100" y="228" text-anchor="middle" ${F} font-weight="800" font-size="22" fill="#fff">${esc(def.name.toUpperCase())}</text><text x="100" y="250" text-anchor="middle" ${F} font-size="10" letter-spacing="3" fill="#fff" opacity=".85">BOOSTER PACK · 10 CARDS</text><path d="M20 48 L180 48" stroke="#fff" stroke-opacity=".5"/></svg>`;
  return `<svg viewBox="0 0 220 220" xmlns="http://www.w3.org/2000/svg" class="packsvg"><defs><linearGradient id="bg${set}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${hi}"/><stop offset=".35" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><path d="M20 60 L40 28 H180 L200 60 Z" fill="#000" opacity=".3"/><rect x="14" y="56" width="192" height="130" rx="6" fill="url(#bg${set})"/><rect x="14" y="56" width="192" height="16" fill="#000" opacity=".22"/><text x="110" y="68" text-anchor="middle" ${F} font-weight="800" font-size="12" letter-spacing="5" fill="#fff">WILDKIN</text>${mascot(60,74,100,90)}<text x="110" y="178" text-anchor="middle" ${F} font-weight="800" font-size="16" fill="#fff">${esc(def.name.toUpperCase())}</text><text x="110" y="206" text-anchor="middle" ${F} font-size="9" letter-spacing="3" fill="#fff" opacity=".8">BOOSTER BOX · 36 PACKS</text></svg>`;
}
// ---------- graded slab ----------
function tcSlab(cp){
  const d=tcD(cp.k), g=cp.g; const inner=tcFront(cp.k); const body=inner.slice(inner.indexOf('>')+1, inner.lastIndexOf('</svg>')); const F='font-family="Barlow Condensed,Arial Narrow,sans-serif"'; const nm=d.card.name.toUpperCase();
  return `<svg viewBox="0 0 270 430" xmlns="http://www.w3.org/2000/svg" class="slabsvg" role="img" aria-label="${esc(d.title+' GCS '+g)}"><rect width="270" height="430" rx="12" fill="#d7dde3"/><rect x="8" y="8" width="254" height="414" rx="8" fill="#eef2f5" stroke="#aeb7bf"/><rect x="14" y="14" width="242" height="66" rx="3" fill="#fff" stroke="#c4ccd3"/><rect x="14" y="14" width="34" height="66" fill="#c0392b"/><text transform="translate(36 70) rotate(-90)" ${F} font-weight="800" font-size="19" fill="#fff" letter-spacing="3">GCS</text><text x="56" y="30" ${F} font-size="9.5" fill="#555">${esc((d.def.name+' '+d.def.code+' #'+String(d.no).padStart(3,'0')).toUpperCase())}</text><text x="56" y="49" ${F} font-weight="800" font-size="17" fill="#111" ${nm.length>14?'textLength="150" lengthAdjust="spacingAndGlyphs"':''}>${esc(nm)}</text><text x="56" y="63" ${F} font-size="9" fill="#555">${esc(TC_VARN[d.v].toUpperCase()+' · '+TC_RARN[d.card.rar].toUpperCase())}</text><text x="56" y="75" ${F} font-size="7.5" fill="#888">CERT ${cp.cert||''}</text><text x="236" y="52" text-anchor="end" ${F} font-weight="800" font-size="38" fill="#111">${g}</text><text x="236" y="70" text-anchor="end" ${F} font-weight="700" font-size="9" fill="#c0392b">${esc(GRADE_NAMES[g].toUpperCase())}</text><g transform="translate(22 92) scale(.904)">${body}</g></svg>`;
}
const miniT=cp=>`<div class="mini ${cp.g>0?'slab':''}">${cp.g>0?tcSlab(cp):tcFace(cp)}</div>`;
const miniTKey=k=>`<div class="mini">${tcFront(k)}</div>`;
function tcPopHTML(key){ const p=G.tpop[key]; if (!p) return '<div class="muted small">No copies graded yet.</div>'; let tot=0; p.forEach(n=>tot+=n); return `<table class="tbl"><tbody>${[10,9,8,7,6,5,4,3,2,1].filter(g=>p[g]).map(g=>`<tr><td>GCS ${g} ${GRADE_NAMES[g]}</td><td class="r">${p[g]}</td></tr>`).join('')}<tr><td><b>Total graded</b></td><td class="r"><b>${tot}</b></td></tr></tbody></table>`; }
// ---------- plugging into the shared viewers ----------
const _objFor=objFor; objFor=function(kind,id){ return kind==='t'? TC(id) : _objFor(kind,id); };
const _faceSVG=faceSVG; faceSVG=function(kind,o,hi){ if (kind!=='t') return _faceSVG(kind,o,hi); const s=o.g>0? tcSlab(o) : tcFace(o); return hi? (o.g>0? polishSlab(s) : polishCard(s)) : s; };
const _finOf=finOf; finOf=function(kind,o){ if (kind!=='t') return _finOf(kind,o); if (o.g>0) return 'slab'; const f=tcFin(tcD(o.k)); return f==='refr'||f==='super'?'refr':'gloss'; };
const _pcData=pcData; pcData=function(kind,o){ if (kind!=='t'){ const r=_pcData(kind,o); return r; }
  const d=tcD(o.k), g=o.g>0?o.g:0, r=tcEst(o.k,g,o), sales=tcSales(o.k,g);
  return { key:o.k, g, title:d.title, sub:d.sealed? d.def.name : d.def.name+' · '+String(d.no).padStart(3,'0')+' · '+TC_VARN[d.v], cond: g? 'GCS '+g+' '+GRADE_NAMES[g] : d.sealed? 'Sealed' : TC_LABN[tcLabel(o.c)], r, sales, other:(G.sales[o.k]||[]).filter(x=>(x[2]||0)!==g).slice(0,3), gl:x=>x>0?'GCS '+x:'Raw',
    meta:[['Set',d.def.name],['Rarity',d.sealed?'':TC_RARN[d.card.rar]],['Print',TC_VARN[d.v]],['Legal in Standard', d.sealed?'':({std:'Yes',rot:'No, rotated',ban:'No, banned'})[tcLegalState(d.cid)]]] }; };
const _va=v3Art; v3Art=function(kind,o){ return kind==='t'? (o.g>0? tcSlab(o) : polishCard(tcFace(o),{flat:1})) : _va(kind,o); };
const _vb=v3Back; v3Back=function(kind,o){ if (kind!=='t') return _vb(kind,o); return o.g>0? _vb('c',o) : TCF.back(); };
const _rvRaw=rvRaw; rvRaw=function(k,o){ return k==='t'? polishCard(tcFace(o)) : _rvRaw(k,o); };
const _rvSlab=rvSlab; rvSlab=function(k,o){ return k==='t'? polishSlab(tcSlab(o)) : _rvSlab(k,o); };
const _rvTitle=rvTitle; rvTitle=function(k,o){ return k==='t'? tcD(o.k).title : _rvTitle(k,o); };
const _rvValue=rvValue; rvValue=function(k,o){ return k==='t'? tcCopyValue(o) : _rvValue(k,o); };
const _popLine=popLine; popLine=function(k,o){ if (k!=='t') return _popLine(k,o); const g=o.g; if (!(g>0)) return ''; const p=G.tpop[o.k]||[]; let tot=0, at=p[g]||0, hi=0; p.forEach((n,i)=>{ tot+=n; if (i>g) hi+=n; }); if (tot<=1) return 'The only copy GCS has graded so far'; if (!hi && at===1) return 'The highest grade of '+tot+' graded copies'; if (!hi) return 'Tied for the highest grade: '+at+' of '+tot+' graded copies'; return at+' at GCS '+g+', '+hi+' graded higher, '+tot+' graded in total'; };
const _inspDetail=ACT.inspdetail; ACT.inspdetail=function(a,el,e){ const [k,id]=a.split(':'); if (k==='t'){ closeInspect(); return ACT.tcopy(id); } return _inspDetail(a,el,e); };
const _rc2=resetCaches; resetCaches=function(){ _rc2(); TCV.clear(); };

const TC_INL=new Map();
async function tcInlineArt(svg){
  const urls=[...new Set((svg.match(/href="(art\/[^"]+)"/g)||[]).map(x=>x.slice(6,-1)))];
  for (const u of urls){ if (TC_INL.has(u)) continue; try { const b=await (await fetch(u)).blob(); TC_INL.set(u, await new Promise(res=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.readAsDataURL(b); })); } catch(e){ TC_INL.set(u,''); } }
  return svg.replace(/href="(art\/[^"]+)"/g,(m,u)=>'href="'+(TC_INL.get(u)||u)+'"');
}
const _v3r=v3Raster; v3Raster=async function(svg,W){ return _v3r(svg.indexOf('href="art/')>=0? await tcInlineArt(svg) : svg, W); };
