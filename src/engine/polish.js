// ===================== POLISH: make close-up views look printed, not drawn =====================
// These effects are expensive, so they only run where you look closely: inspection, detail sheets, the grading reveal.
// Thumbnails, grids and sleeves keep the light versions.
let FXN=0; const HIC=new Map();
function fxId(){ return 'fx'+(FXN++).toString(36); }
function vbOf(svg){ const m=/viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg); return m? [+m[1], +m[2]] : [250,350]; }
function noiseFilter(id, freq, oct, seed, gray){ return `<filter id="${id}" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="${oct}" seed="${seed}"/><feColorMatrix type="saturate" values="0"/>${gray||''}</filter>`; }
function inject(svg, defs, layers){ const i=svg.lastIndexOf('</svg>'); return svg.slice(0,i)+`<defs>${defs}</defs>${layers}</svg>`; }
// ---- cards ----
function polishCard(svg, opt){
  const flat=!!(opt&&opt.flat); if (!svg || svg.indexOf('cardsvg')<0 || svg.indexOf('data-pol')>=0) return svg;
  const id=fxId(); const [W,H]=vbOf(svg); const fin=(/data-fin="([^"]*)"/.exec(svg)||[])[1]||'gloss';
  const metal=['chrome','refr','foil','super','plate'].includes(fin); const matte=fin==='matte'||fin==='stock'; const prism=fin==='refr'||fin==='super'||fin==='foil';
  const r=mkRng(hsh(svg.length+fin+id)); let flecks='';
  if (prism) for (let i=0;i<46;i++){ const x=r()*W, y=r()*H, s=0.4+r()*1.1; flecks+=`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${s.toFixed(2)}" fill="#fff" opacity="${(0.35+r()*0.5).toFixed(2)}"/>`; }
  const defs=noiseFilter(id+'n','0.85',2,7)+(metal? noiseFilter(id+'b','0.0025 0.6',3,3):'')+`<filter id="${id}s" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="2.2"/></filter>`+
    `<linearGradient id="${id}l" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".42"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".38"/></linearGradient>`+
    `<pattern id="${id}h" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(22)"><circle cx="1.5" cy="1.5" r=".7" fill="#000"/></pattern>`;
  const layers= flat? `<g data-pol="1" style="pointer-events:none">`+(matte? `<rect width="${W}" height="${H}" rx="12" fill="url(#${id}h)" opacity=".07"/>`:'')+`<rect width="${W}" height="${H}" rx="12" filter="url(#${id}n)" opacity="${matte?0.22:0.1}" style="mix-blend-mode:overlay"/></g>` : `<g data-pol="1" style="pointer-events:none">`+
    (matte? `<rect width="${W}" height="${H}" rx="12" fill="url(#${id}h)" opacity=".07"/>`:'')+
    `<rect width="${W}" height="${H}" rx="12" filter="url(#${id}n)" opacity="${matte?0.3:0.17}" style="mix-blend-mode:overlay"/>`+
    (metal? `<rect width="${W}" height="${H}" rx="12" filter="url(#${id}b)" opacity=".38" style="mix-blend-mode:soft-light"/>`:'')+
    (prism? `<g style="mix-blend-mode:screen">${flecks}</g>`:'')+
    `<rect width="${W}" height="${H}" rx="12" fill="url(#${id}l)" style="mix-blend-mode:soft-light"/>`+
    `<rect x="1.5" y="1.5" width="${W-3}" height="${H-3}" rx="10.5" fill="none" stroke="#000" stroke-opacity=".28" stroke-width="3" filter="url(#${id}s)"/>`+
    `<rect x=".6" y=".6" width="${W-1.2}" height="${H-1.2}" rx="11.4" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1"/></g>`;
  return inject(svg, defs, layers);
}
// ---- slabs (the plastic case) ----
function polishSlab(svg){
  if (!svg || svg.indexOf('data-pol')>=0) return svg; const id=fxId(); const [W,H]=vbOf(svg);
  const defs=noiseFilter(id+'n','1.2',1,5)+`<linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".3" stop-color="#fff" stop-opacity=".0"/><stop offset=".42" stop-color="#fff" stop-opacity=".30"/><stop offset=".5" stop-color="#fff" stop-opacity=".06"/><stop offset=".58" stop-color="#fff" stop-opacity=".18"/><stop offset=".7" stop-color="#fff" stop-opacity="0"/></linearGradient>`+
    `<linearGradient id="${id}e" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset=".08" stop-color="#fff" stop-opacity="0"/><stop offset=".92" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></linearGradient>`;
  const layers=`<g data-pol="1" style="pointer-events:none"><rect x="2" y="2" width="${W-4}" height="${H-4}" rx="10" filter="url(#${id}n)" opacity=".1" style="mix-blend-mode:multiply"/><rect x="2" y="2" width="${W-4}" height="${H-4}" rx="10" fill="url(#${id}g)"/><rect x="3" y="3" width="${W-6}" height="${H-6}" rx="9" fill="none" stroke="url(#${id}e)" stroke-width="2"/></g>`;
  return inject(svg, defs, layers);
}
// ---- comics: a printed page, not a vector drawing ----
function polishComic(svg, opt){
  const flat=!!(opt&&opt.flat); if (!svg || svg.indexOf('cmsvg')<0 || svg.indexOf('data-pol')>=0) return svg; const id=fxId(); const [W,H]=vbOf(svg); const yr=+((/data-era="(\d+)"/.exec(svg)||[])[1]||2000); const age=yearOf(G.day)-yr;
  const r=mkRng(hsh(id+svg.length)); let fox=''; if (age>30){ for (let i=0;i<Math.min(40,(age-30)*1.1);i++){ const edge=r()<0.7; const x=edge? (r()<0.5? r()*8 : W-r()*8) : r()*W, y=edge? r()*H : (r()<0.5? r()*8 : H-r()*8); fox+=`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(0.5+r()*1.6).toFixed(1)}" fill="#8a5a20" opacity="${(0.14+r()*0.22).toFixed(2)}"/>`; } }
  const gloss = yr>=1985; const rough = svg.replace('<g clip-path="', `<g filter="url(#${id}r)" clip-path="`);
  const defs=`<filter id="${id}r" x="-2%" y="-2%" width="104%" height="104%"><feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="4" result="t"/><feDisplacementMap in="SourceGraphic" in2="t" scale="1.5" xChannelSelector="R" yChannelSelector="G"/></filter>`+
    noiseFilter(id+'n','0.75',3,2)+noiseFilter(id+'f','0.03 0.9',2,9)+
    `<pattern id="${id}c" width="4.2" height="4.2" patternUnits="userSpaceOnUse" patternTransform="rotate(15)"><circle cx="2.1" cy="2.1" r=".95" fill="#00a6d6"/></pattern><pattern id="${id}m" width="4.2" height="4.2" patternUnits="userSpaceOnUse" patternTransform="rotate(75)"><circle cx="2.1" cy="2.1" r=".95" fill="#e6007e"/></pattern><pattern id="${id}y" width="4.2" height="4.2" patternUnits="userSpaceOnUse" patternTransform="rotate(0)"><circle cx="2.1" cy="2.1" r=".95" fill="#ffe600"/></pattern>`+
    `<linearGradient id="${id}sp" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".5"/><stop offset=".035" stop-color="#000" stop-opacity=".16"/><stop offset=".07" stop-color="#fff" stop-opacity=".12"/><stop offset=".13" stop-color="#000" stop-opacity="0"/></linearGradient>`+
    `<linearGradient id="${id}gl" x1="0" y1="0" x2="1" y2="1"><stop offset=".25" stop-color="#fff" stop-opacity="0"/><stop offset=".4" stop-color="#fff" stop-opacity=".26"/><stop offset=".47" stop-color="#fff" stop-opacity=".04"/><stop offset=".6" stop-color="#fff" stop-opacity=".14"/><stop offset=".72" stop-color="#fff" stop-opacity="0"/></linearGradient>`+
    `<radialGradient id="${id}v" cx=".5" cy=".5" r=".75"><stop offset=".7" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#3a2a10" stop-opacity="${(0.1+Math.min(0.25,Math.max(0,age-20)*0.004)).toFixed(2)}"/></radialGradient>`;
  const layers=`<g data-pol="1" style="pointer-events:none"><g style="mix-blend-mode:multiply" opacity="${yr<2000?0.1:0.06}"><rect width="${W}" height="${H}" fill="url(#${id}c)"/><rect width="${W}" height="${H}" fill="url(#${id}m)"/><rect width="${W}" height="${H}" fill="url(#${id}y)"/></g>`+
    `<rect width="${W}" height="${H}" filter="url(#${id}n)" opacity="${gloss?0.14:0.26}" style="mix-blend-mode:overlay"/><rect width="${W}" height="${H}" filter="url(#${id}f)" opacity=".1" style="mix-blend-mode:multiply"/>`+
    `<rect width="${W}" height="${H}" fill="url(#${id}v)"/>${fox}`+(flat?'':`<rect width="${W}" height="${H}" fill="url(#${id}sp)"/>`)+
    (gloss&&!flat? `<rect width="${W}" height="${H}" fill="url(#${id}gl)"/>` : '')+(flat?'':`<rect x=".5" y=".5" width="${W-1}" height="${H-1}" fill="none" stroke="#000" stroke-opacity=".3"/>`)+`</g>`;
  return inject(rough, defs, layers);
}
function comicCoverHi(key){ let h=HIC.get('m'+key); if (!h){ h=polishComic(comicCover(key)); if (HIC.size>40) HIC.clear(); HIC.set('m'+key,h); } return h; }
// ---- wire it into the close-up views ----
faceSVG = function(kind, o, hi){
  if (kind==='c'){ if (o.g>0){ const s=slabSVG(o); return hi? polishSlab(s) : s; } const f=withCond(cardFront(o.k,o.s), o); return hi? polishCard(f) : f; }
  if (o.g>0){ const s=comicSlab(o); return hi? polishSlab(s) : s; } const f=withCmCond(comicCover(o.k), o); return hi? polishComic(f) : f; };
(function(){
  const io=inspectOpen; inspectOpen=function(kind,id){ const fs=faceSVG; faceSVG=function(k,o){ return fs(k,o,true); }; try { io(kind,id); } finally { faceSVG=fs; } };
  const bc=bigCardHTML; bigCardHTML=function(c,key){ let h=bc(c,key); if (!c) return h; if (c.g>0){ const s=slabSVG(c); if (h.indexOf(s)>=0) return h.replace(s, polishSlab(s)); return h; } const f=withCond(cardFront(c.k,c.s), c); return h.indexOf(f)>=0? h.replace(f, polishCard(f)) : h; };
  const cs=cmCopySheet; cmCopySheet=function(id){ const r=cs(id); const cp=MC(id); if (!r||!cp) return r; if (cp.g>0){ const s=comicSlab(cp); if (r.h.indexOf(s)>=0) r.h=r.h.replace(s, polishSlab(s)); } else { const f=withCmCond(comicCover(cp.k), cp); if (r.h.indexOf(f)>=0) r.h=r.h.replace(f, polishComic(f)); } return r; };
  const ds=designSheet; designSheet=function(key){ const r=ds(key); if (r && key[0]==='M'){ const f=comicCover(key); if (r.h.indexOf(f)>=0) r.h=r.h.replace(f, comicCoverHi(key)); } return r; };
  const ss=seriesSheet; seriesSheet=function(sid){ const r=ss(sid); const s=r&&S_(sid); if (r && s && s.n){ const k=mk(sid,1,1,''); const f=comicCover(k); if (r.h.indexOf(f)>=0) r.h=r.h.replace(f, comicCoverHi(k)); } return r; };
})();
rvRaw = function(k,o){ return k==='m'? polishComic(withCmCond(comicCover(o.k),o)) : polishCard(withCond(cardFront(o.k,o.s),o)); };
rvSlab = function(k,o){ return polishSlab(k==='m'? comicSlab(o) : slabSVG(o)); };
