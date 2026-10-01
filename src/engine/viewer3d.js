// ===================== 3D INSPECTION VIEWER (level 1) =====================
// The existing art becomes a texture on a real 3D object: thickness, bevelled edges, clear-coat, brushed metal, rainbow foil
// and a light that follows your finger. Loaded on first use; if 3D isn't available the flat viewer stays as it is.
const V3={ url:(typeof PACK!=='undefined'&&PACK.three)||'https://cdn.jsdelivr.net/npm/three@0.159.0/build/three.min.js', p:null, fail:false, st:null, tok:0 };
function v3Load(){
  if (window.THREE) return Promise.resolve(window.THREE); if (V3.p) return V3.p;
  V3.p=new Promise((res,rej)=>{ const s=document.createElement('script'); s.src=V3.url; let done=false; const to=setTimeout(()=>{ if (!done){ done=true; V3.p=null; rej(new Error('timeout')); } }, 9000);
    s.onload=()=>{ if (done) return; done=true; clearTimeout(to); window.THREE? res(window.THREE) : rej(new Error('no three')); }; s.onerror=()=>{ if (done) return; done=true; clearTimeout(to); V3.p=null; rej(new Error('load failed')); }; document.head.appendChild(s); });
  return V3.p;
}
function v3WebGL(){ try { const c=document.createElement('canvas'); return !!(c.getContext('webgl2')||c.getContext('webgl')); } catch(e){ return false; } }
function v3Raster(svg, W){
  return new Promise((res,rej)=>{ const m=/viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg); if (!m) return rej(new Error('no viewBox')); const vw=+m[1], vh=+m[2], H=Math.round(W*vh/vw);
    let s=svg; if (s.indexOf('xmlns=')<0) s=s.replace('<svg ','<svg xmlns="http://www.w3.org/2000/svg" '); s=s.replace('<svg ', `<svg width="${Math.round(vw*4)}" height="${Math.round(vh*4)}" `);
    const img=new Image(); img.onload=()=>{ try { const c=document.createElement('canvas'); c.width=W; c.height=H; const g=c.getContext('2d'); g.drawImage(img,0,0,W,H); const px=g.getImageData(Math.floor(W/2),Math.floor(H/2),1,1).data; const px2=g.getImageData(Math.floor(W/4),Math.floor(H/3),1,1).data; if (px[3]===0 && px2[3]===0) return rej(new Error('blank raster')); res(c); } catch(e){ rej(e); } }; img.onerror=()=>rej(new Error('svg raster failed'));
    img.src='data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(s))); });
}
function v3Art(kind, o){
  if (kind==='c') return o.g>0? slabSVG(o) : polishCard(withCond(cardFront(o.k,o.s),o), {flat:1});
  return o.g>0? comicSlab(o) : polishComic(withCmCond(comicCover(o.k),o), {flat:1});
}
function v3Back(kind, o){
  if (kind==='c' && o.g===0) return cardBack(o.k,o.s);
  if (kind==='c') return `<svg viewBox="0 0 270 430" xmlns="http://www.w3.org/2000/svg"><rect width="270" height="430" rx="12" fill="#cfd6dc"/><rect x="10" y="10" width="250" height="410" rx="8" fill="#e6ebef" stroke="#aeb7bf"/><text x="135" y="225" text-anchor="middle" font-family="Arial Narrow,Arial,sans-serif" font-weight="800" font-size="30" fill="#8a949d" letter-spacing="6">GCS</text></svg>`;
  const d=cmD(o.k), s=d.s; const age=yearOf(G.day)-d.yr; const paper= age>50?'#e3d3a8': age>25?'#ebdfbd':'#f4efe0';
  const pb=s.pub>=0? G.cm.pubs[s.pub]: {sh:'SELF'};
  if (o.g>0) return `<svg viewBox="0 0 230 386" xmlns="http://www.w3.org/2000/svg"><rect width="230" height="386" rx="10" fill="#cfd6dc"/><rect x="8" y="8" width="214" height="370" rx="6" fill="#e6ebef" stroke="#aeb7bf"/><text x="115" y="200" text-anchor="middle" font-family="Arial Narrow,Arial,sans-serif" font-weight="800" font-size="26" fill="#8a949d" letter-spacing="6">GCS</text></svg>`;
  const bars=Array.from({length:26},(_,i)=>`<rect x="${6+i*2.6}" y="6" width="${i%3?1.1:1.9}" height="34" fill="#111"/>`).join('');
  return `<svg viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="300" fill="${paper}"/><rect x="14" y="14" width="172" height="200" fill="none" stroke="#222" stroke-width="1.4"/><text x="100" y="98" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="34" fill="#222">${esc(pb.sh)}</text><text x="100" y="124" text-anchor="middle" font-family="Arial Narrow,Arial,sans-serif" font-size="11" letter-spacing="3" fill="#444">${esc((pb.n||'Independent').toUpperCase().slice(0,26))}</text><text x="100" y="170" text-anchor="middle" font-family="Arial Narrow,Arial,sans-serif" font-size="9" fill="#555">${esc(d.title.slice(0,34))}</text><text x="100" y="186" text-anchor="middle" font-family="Arial Narrow,Arial,sans-serif" font-size="8" fill="#777">Published ${monYr(d.day)}</text><g transform="translate(130 238)"><rect width="62" height="46" fill="#fff" stroke="#222"/><g transform="translate(2 4) scale(.9)">${bars}</g><text x="31" y="44" text-anchor="middle" font-size="6" font-family="Arial,sans-serif">${d.cp<1? Math.round(d.cp*100)+'¢' : '$'+d.cp.toFixed(2)}</text></g></svg>`;
}
function v3Brushed(T){ const c=document.createElement('canvas'); c.width=256; c.height=512; const g=c.getContext('2d'); const r=mkRng(77); for (let y=0;y<512;y++){ const v=Math.floor(120+r()*80); g.fillStyle=`rgb(${v},${v},${v})`; g.fillRect(0,y,256,1); } for (let i=0;i<1400;i++){ const v=Math.floor(r()*255); g.fillStyle=`rgba(${v},${v},${v},.22)`; g.fillRect(r()*256,r()*512,1+r()*50,1); } const t=new T.CanvasTexture(c); t.wrapS=t.wrapT=T.RepeatWrapping; return t; }
function v3Pages(T, vertical, tone){ const c=document.createElement('canvas'); c.width=vertical?256:16; c.height=vertical?16:256; const g=c.getContext('2d'); const r=mkRng(31); const n=256; const base=tone||[244,238,222];
  for (let i=0;i<n;i++){ const k=0.86+r()*0.14; g.fillStyle=`rgb(${Math.round(base[0]*k)},${Math.round(base[1]*k)},${Math.round(base[2]*k)})`; if (vertical) g.fillRect(i,0,1,16); else g.fillRect(0,i,16,1); if (i%2){ g.fillStyle='rgba(90,70,40,.18)'; if (vertical) g.fillRect(i,0,1,16); else g.fillRect(0,i,16,1); } }
  const t=new T.CanvasTexture(c); return t; }
function v3Env(T, renderer){
  const pm=new T.PMREMGenerator(renderer); const sc=new T.Scene(); sc.background=new T.Color(0x14171b);
  const box=(w,h,x,y,z,ry,rx,k,col)=>{ const m=new T.Mesh(new T.PlaneGeometry(w,h), new T.MeshBasicMaterial({color:new T.Color(col||0xffffff).multiplyScalar(k), side:T.DoubleSide})); m.position.set(x,y,z); m.rotation.y=ry||0; m.rotation.x=rx||0; sc.add(m); };
  box(7,2.4,0,4.2,0.5,0,Math.PI/2,7); box(1.6,6,-4.2,0.6,0.8,Math.PI/2,0,6,0xdfe9ff); box(1.6,6,4.2,0.4,0.6,Math.PI/2,0,5.5,0xffe8cf); box(6,1.4,0,-2.8,2.4,0,-Math.PI/3,2); box(5,2,0,1,-4,0,0,1.6,0xaab4c2);
  const tex=pm.fromScene(sc,0.03).texture; pm.dispose(); return tex;
}
function v3RoundShape(T,w,h,r){ const s=new T.Shape(); const x=-w/2, y=-h/2; s.moveTo(x+r,y); s.lineTo(x+w-r,y); s.quadraticCurveTo(x+w,y,x+w,y+r); s.lineTo(x+w,y+h-r); s.quadraticCurveTo(x+w,y+h,x+w-r,y+h); s.lineTo(x+r,y+h); s.quadraticCurveTo(x,y+h,x,y+h-r); s.lineTo(x,y+r); s.quadraticCurveTo(x,y,x+r,y); return s; }
function v3FaceGeo(T,w,h,r){ const g=new T.ShapeGeometry(v3RoundShape(T,w,h,r),10); const p=g.attributes.position, uv=g.attributes.uv; for (let i=0;i<p.count;i++) uv.setXY(i,(p.getX(i)+w/2)/w,(p.getY(i)+h/2)/h); return g; }
function v3Finish(kind, o, svg){
  if (o.g>0) return 'slab'; if (kind==='m'){ return polishYr(o)>=1985? 'glossy' : 'paper'; }
  const f=(/data-fin="([^"]*)"/.exec(svg)||[])[1]||'gloss'; return f;
}
function polishYr(o){ try { return cmD(o.k).yr; } catch(e){ return 2000; } }
function v3Mat(T, fin, tex, brushed, renderer){
  tex.colorSpace=T.SRGBColorSpace; tex.anisotropy=Math.min(8, renderer.capabilities.getMaxAnisotropy()); const base={map:tex, emissiveMap:tex, emissive:new T.Color(0xffffff), emissiveIntensity:0.22};
  switch(fin){
    case 'chrome': case 'plate': return new T.MeshPhysicalMaterial(Object.assign({},base,{metalness:0.45, roughness:0.42, roughnessMap:brushed, clearcoat:0.9, clearcoatRoughness:0.14, anisotropy:0.5, envMapIntensity:1.25, emissiveIntensity:0.18}));
    case 'refr': case 'foil': case 'super': return new T.MeshPhysicalMaterial(Object.assign({},base,{metalness:0.4, roughness:0.3, roughnessMap:brushed, clearcoat:1, clearcoatRoughness:0.08, iridescence:1, iridescenceIOR:1.9, iridescenceThicknessRange:[180,780], envMapIntensity:1.8, emissiveIntensity:0.14}));
    case 'matte': case 'stock': return new T.MeshPhysicalMaterial(Object.assign({},base,{metalness:0, roughness:0.88, sheen:0.4, sheenRoughness:0.6, sheenColor:new T.Color(0xf2e8d2), envMapIntensity:0.45, emissiveIntensity:0.12}));
    case 'paper': return new T.MeshStandardMaterial(Object.assign({},base,{roughness:0.92, metalness:0, envMapIntensity:0.35, emissiveIntensity:0.14}));
    case 'glossy': return new T.MeshPhysicalMaterial(Object.assign({},base,{roughness:0.55, clearcoat:0.55, clearcoatRoughness:0.25, envMapIntensity:0.9, emissiveIntensity:0.16}));
    case 'slab': return new T.MeshPhysicalMaterial(Object.assign({},base,{roughness:0.35, clearcoat:1, clearcoatRoughness:0.05, envMapIntensity:1.0, emissiveIntensity:0.2}));
    default: return new T.MeshPhysicalMaterial(Object.assign({},base,{roughness:0.62, clearcoat:0.3, clearcoatRoughness:0.32, envMapIntensity:0.55, emissiveIntensity:0.1}));
  }
}
function v3Build(T, stage, kind, o, frontCv, backCv){
  const canvas=document.createElement('canvas'); canvas.className='insp3d'; stage.appendChild(canvas);
  const renderer=new T.WebGLRenderer({canvas, antialias:true, alpha:true, powerPreference:'high-performance'}); renderer.setPixelRatio(Math.min(2, window.devicePixelRatio||1)); renderer.toneMapping=T.ACESFilmicToneMapping; renderer.toneMappingExposure=1.05; renderer.setClearColor(0x000000,0);
  const scene=new T.Scene(); const env=v3Env(T, renderer); const camera=new T.PerspectiveCamera(30,1,0.1,50);
  const brushed=v3Brushed(T); const fin=v3Finish(kind,o,(frontCv&&frontCv.svg)||'');
  const H=1.5, W=H*frontCv.width/frontCv.height; const isComic=(kind==='m'&&o.g===0), isSlab=o.g>0; const thick= isSlab?0.1 : isComic?0.05 : 0.022; const rad= isComic?0.0 : isSlab? W*0.05 : W*0.048;
  const front=new T.CanvasTexture(frontCv), back=new T.CanvasTexture(backCv); back.colorSpace=T.SRGBColorSpace;
  const fm=v3Mat(T,fin,front,brushed,renderer); fm.envMap=env; const bm=new T.MeshStandardMaterial({map:back, roughness:0.7, metalness:0, envMapIntensity:0.5}); bm.map.anisotropy=4; bm.envMap=env;
  const pivot=new T.Group(); scene.add(pivot); const root=new T.Group(); pivot.add(root);
  if (isComic){
    const age=yearOf(G.day)-cmD(o.k).yr; const tone= age>55?[228,210,165]: age>30?[236,224,188]:[246,241,226]; const cvw=o.c?o.c[6]:100; if (cvw<70){ tone[0]-=12; tone[1]-=20; tone[2]-=36; }
    const top=v3Pages(T,false,tone), side=v3Pages(T,true,tone); const spine=new T.MeshStandardMaterial({color:0x2a2622, roughness:0.85}); spine.color.setRGB(tone[0]/255*0.55,tone[1]/255*0.5,tone[2]/255*0.42);
    const mats=[new T.MeshStandardMaterial({map:side,roughness:0.95}), spine, new T.MeshStandardMaterial({map:top,roughness:0.95}), new T.MeshStandardMaterial({map:top,roughness:0.95}), new T.MeshStandardMaterial({color:0xeee6d2,roughness:0.9}), new T.MeshStandardMaterial({color:0xeee6d2,roughness:0.9})];
    const body=new T.Mesh(new T.BoxGeometry(W,H,thick-0.004), mats); root.add(body);
    const mk=(mat,zs)=>{ const g=new T.PlaneGeometry(W,H,28,40); const p=g.attributes.position; for (let i=0;i<p.count;i++){ const u=(p.getX(i)+W/2)/W, v=(p.getY(i)+H/2)/H; p.setZ(i, (0.010*Math.sin(Math.PI*u)*Math.sin(Math.PI*v) - 0.005*Math.exp(-u*22))*zs); } g.computeVertexNormals(); return new T.Mesh(g,mat); };
    const f=mk(fm,1); f.position.z=thick/2-0.002+0.001; const b=mk(bm,-1); b.rotation.y=Math.PI; b.position.z=-thick/2+0.002-0.001; root.add(f,b);
  } else {
    const bs=thick*0.14; const shape=v3RoundShape(T,W-bs*2,H-bs*2,Math.max(0.001,rad-bs)); const eg=new T.ExtrudeGeometry(shape,{depth:thick-bs*2,bevelEnabled:true,bevelThickness:bs,bevelSize:bs,bevelSegments:3,curveSegments:10}); eg.translate(0,0,-(thick-bs*2)/2);
    const edgeCol= isSlab? 0xdfe5ea : fin==='chrome'||fin==='refr'||fin==='foil'||fin==='super'? 0xcfd4da : 0xf0eee8;
    const em=new T.MeshPhysicalMaterial({color:edgeCol, roughness:isSlab?0.12:0.5, metalness:(fin==='chrome'||fin==='refr'||fin==='foil'||fin==='super')&&!isSlab?0.5:0, clearcoat:isSlab?1:0.3, envMapIntensity:1.1}); em.envMap=env;
    root.add(new T.Mesh(eg,em));
    const fg=v3FaceGeo(T,W-bs*0.6,H-bs*0.6,Math.max(0.001,rad-bs*0.3)); const fz=thick/2+0.0006; const f=new T.Mesh(fg,fm); f.position.z=fz; const b=new T.Mesh(fg,bm); b.rotation.y=Math.PI; b.position.z=-fz; root.add(f,b);
    if (isSlab){ const gl=new T.Mesh(v3FaceGeo(T,W*0.97,H*0.97,rad), new T.MeshPhysicalMaterial({color:0xffffff, transparent:true, opacity:0.06, roughness:0.03, clearcoat:1, clearcoatRoughness:0.02, envMapIntensity:1.6, depthWrite:false})); gl.material.envMap=env; gl.position.z=fz+0.003; root.add(gl); }
  }
  // a soft shadow behind the object, so it floats
  const sc=document.createElement('canvas'); sc.width=sc.height=128; const sg=sc.getContext('2d'); const gr=sg.createRadialGradient(64,64,4,64,64,62); gr.addColorStop(0,'rgba(0,0,0,.55)'); gr.addColorStop(1,'rgba(0,0,0,0)'); sg.fillStyle=gr; sg.fillRect(0,0,128,128);
  const sh=new T.Mesh(new T.PlaneGeometry(W*1.9,H*1.6), new T.MeshBasicMaterial({map:new T.CanvasTexture(sc), transparent:true, depthWrite:false})); sh.position.set(0.06,-0.08,-0.5); scene.add(sh);
  const key=new T.DirectionalLight(0xffffff,1.5); key.position.set(0.6,1.2,2.5); scene.add(key); scene.add(new T.AmbientLight(0xffffff,0.25));
  const st={ T, renderer, scene, camera, pivot, key, canvas, stage, W, H, tx:0, ty:0, rx:0, ry:0, flip:0, flipT:0, lx:0.6, ly:1.2, drag:false, raf:0, t0:performance.now(), geoms:[], alive:true, reduced:window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches };
  const fit=()=>{ const b=stage.getBoundingClientRect(); const w=Math.max(10,b.width), h=Math.max(10,b.height); renderer.setSize(w,h,false); canvas.style.width=w+'px'; canvas.style.height=h+'px'; camera.aspect=w/h; const tf=Math.tan(camera.fov*Math.PI/360); const dv=(H*1.2/2)/tf, dh=(W*1.3/2)/(tf*camera.aspect); camera.position.set(0,0,Math.max(dv,dh)); camera.updateProjectionMatrix(); };
  fit(); st.fit=fit; if (window.ResizeObserver){ st.ro=new ResizeObserver(fit); st.ro.observe(stage); }
  const map=(ev)=>{ const b=stage.getBoundingClientRect(); const x=Math.min(1,Math.max(0,(ev.clientX-b.left)/b.width)), y=Math.min(1,Math.max(0,(ev.clientY-b.top)/b.height)); st.tx=(y-0.5)*0.75; st.ty=(x-0.5)*1.0; st.lx=(x-0.5)*3.2; st.ly=(0.5-y)*3.2+0.6; };
  st.onMove=ev=>{ st.drag=true; st.idle=false; map(ev); }; st.onDown=ev=>{ st.drag=true; map(ev); }; st.onUp=()=>{ st.drag=false; setTimeout(()=>{ if (!st.drag){ st.tx=0; st.ty=0; st.lx=0.6; st.ly=1.2; } }, 500); };
  stage.addEventListener('pointermove',st.onMove); stage.addEventListener('pointerdown',st.onDown); stage.addEventListener('pointerup',st.onUp); stage.addEventListener('pointerleave',st.onUp); stage.addEventListener('pointercancel',st.onUp);
  const tick=(now)=>{ if (!st.alive) return; st.raf=requestAnimationFrame(tick); const t=(now-st.t0)/1000;
    let tx=st.tx, ty=st.ty; if (!st.drag && !st.reduced){ tx+=Math.sin(t*0.7)*0.05; ty+=Math.cos(t*0.5)*0.11; }
    st.rx+=(tx-st.rx)*0.14; st.ry+=(ty-st.ry)*0.14; st.flipT+=((st.flip?Math.PI:0)-st.flipT)*0.12;
    pivot.rotation.x=-st.rx; pivot.rotation.y=st.ry+st.flipT; key.position.x+=(st.lx-key.position.x)*0.14; key.position.y+=(st.ly-key.position.y)*0.14;
    renderer.render(scene,camera); };
  st.raf=requestAnimationFrame(tick); return st;
}
function v3Dispose(){
  const st=V3.st; if (!st) return; st.alive=false; cancelAnimationFrame(st.raf); V3.st=null;
  try { st.stage.removeEventListener('pointermove',st.onMove); st.stage.removeEventListener('pointerdown',st.onDown); st.stage.removeEventListener('pointerup',st.onUp); st.stage.removeEventListener('pointerleave',st.onUp); st.stage.removeEventListener('pointercancel',st.onUp); if (st.ro) st.ro.disconnect();
    st.scene.traverse(n=>{ if (n.geometry) n.geometry.dispose(); const ms=n.material? (Array.isArray(n.material)?n.material:[n.material]) : []; for (const m of ms){ for (const k in m){ if (m[k] && m[k].isTexture) m[k].dispose(); } m.dispose(); } });
    st.renderer.dispose(); if (st.renderer.forceContextLoss) st.renderer.forceContextLoss(); st.canvas.remove(); } catch(e){ console.error(e); }
}
async function v3Open(kind, id, tok){
  if (V3.fail || !v3WebGL()) return;
  const o=objFor(kind,id); if (!o) return; const el=$('#insp'); if (!el) return;
  try {
    const T=await v3Load(); if (tok!==V3.tok || !$('#insp')) return;
    const svg=v3Art(kind,o); const W=o.g>0? 900 : 1000; const [front, back]=await Promise.all([v3Raster(svg,W), v3Raster(v3Back(kind,o), 700)]); front.svg=svg;
    if (tok!==V3.tok || !$('#insp')) return;
    const stage=$('#inspstage'); stage.style.position='relative'; const st=v3Build(T, stage, kind, o, front, back); V3.st=st;
    const obj=$('#inspobj'); if (obj){ obj.style.transition='opacity .35s'; obj.style.opacity='0'; setTimeout(()=>{ if (obj) obj.style.visibility='hidden'; },380); }
    st.canvas.style.opacity='0'; st.canvas.style.transition='opacity .4s'; requestAnimationFrame(()=>{ st.canvas.style.opacity='1'; });
    const bar=el.querySelector('.insp-bar'); if (bar && !bar.querySelector('[data-act="inspflip"]')) bar.insertAdjacentHTML('beforeend','<button class="btn sm" data-act="inspflip">Flip</button>'); el.classList.add('is3d');
  } catch(e){ console.warn('3D viewer unavailable, using the flat view:', e && e.message); if (String(e&&e.message).match(/load failed|timeout|no three/)) V3.fail=true; const c=document.querySelector('.insp3d'); if (c) c.remove(); }
}
if (typeof requestIdleCallback==='function') setTimeout(()=>requestIdleCallback(()=>{ if (!V3.fail && v3WebGL()) v3Load().catch(()=>{}); }), 7000);
(function(){
  const io=inspectOpen; inspectOpen=function(kind,id){ V3.tok++; io(kind,id); v3Open(kind,id,V3.tok); };
  const ci=closeInspect; closeInspect=function(){ V3.tok++; v3Dispose(); ci(); };
  const fl=ACT.inspflip; ACT.inspflip=function(a,el,e){ if (V3.st){ V3.st.flip=V3.st.flip?0:1; return; } return fl(a,el,e); };
})();
