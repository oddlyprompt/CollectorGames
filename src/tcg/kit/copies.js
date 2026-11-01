// ===================== CARD KIT: COPY HELPERS =====================
// Pure helpers every card game uses the same way (they hold no line state): how a copy's four condition scores are made and read, the grade
// formula, grade multipliers, wear drawn on a card face, price jitter, week arithmetic and inlining art for the 3D viewer.
// ---------- condition ----------
function condFresh(r, q){
  const g=()=>{ let u=0; while(u===0) u=r(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*r()); };
  const c=[Math.round(Math.max(80,100-Math.abs(g())*2.6-r()*1.5)), Math.round(Math.max(85,100-Math.abs(g())*1.8-r())), Math.round(Math.max(85,100-Math.abs(g())*1.8-r())), Math.round(Math.max(85,100-Math.abs(g())*1.8-r()))];
  if (r()>=q){ const k=r()<0.75?1:2; for (let i=0;i<k;i++){ const at=1+Math.floor(r()*3); const sev=r(); c[at]=Math.min(c[at], Math.round(sev<0.7? 84+r()*8 : sev<0.93? 70+r()*14 : 50+r()*20)); } }
  return c;
}
function condWorn(r, age, rough){ const c=condFresh(r,0.2); const w=Math.min(1,0.15+age*0.22)*(rough||1); for (let i=0;i<4;i++) if (r()<0.35+w*0.4) c[i]=Math.max(30, Math.round(c[i]-r()*(10+45*w))); return c; }
function condLabel(c){ const mn=Math.min(...c); return mn>=86?'NM': mn>=72?'LP': mn>=55?'MP': mn>=38?'HP':'DMG'; }
const COND_LABN={NM:'Near mint',LP:'Lightly played',MP:'Moderately played',HP:'Heavily played',DMG:'Damaged'};
// What to call a copy's condition. A card straight from a pack has never been played, so a factory flaw (off-centre, a print line, a rough edge) that scores as "lightly played" is described as pack fresh with that flaw, not as wear.
function condTitle(cp){ const lab=condLabel(cp.c), name=COND_LABN[lab]; if (lab==='NM' || !(cp.a && cp.a[1]==='pulled') || Math.min(...cp.c)<70) return name; const areas=['corners','edges','surface','centering']; let w=0; for (let i=1;i<4;i++) if (cp.c[i]<cp.c[w]) w=i; return 'Pack fresh, '+areas[w]+' flawed ('+name.toLowerCase()+' by grade)'; }
function condLines(cp){
  const c=cp.c, L=[]; const f=(v,a,b,cc,dd,ee)=> v>=96? a : v>=90? b : v>=80? cc : v>=65? dd : ee;
  L.push(['Centering', f(c[0],'Well centered.','Slightly off-center.','Noticeably off-center.','Badly off-center.','Cut very crooked.')]);
  L.push(['Corners', f(c[1],'Sharp corners.','A hint of whitening on a corner.','Whitening on several corners.','Rounded, whitened corners.','Corners are bent or torn.')]);
  L.push(['Edges', f(c[2],'Clean edges.','A few tiny edge specks.','Visible edge wear.','Heavy edge wear and chipping.','Edges are peeling or nicked through.')]);
  L.push(['Surface', f(c[3],'Clean surface, strong gloss.','A faint print line or light scuff.','Light scratches across the surface.','Scratched and creased in places.','Creased, scuffed or stained.')]);
  return L;
}

function gradeOf(cp){ const c=cp.c; const mn=Math.min(...c), av=c.reduce((a,b)=>a+b,0)/4; const s=0.5*mn+0.5*av+withRng(mkRng(cp.id*7919+(cp.gt||0)*104729+11),()=>gauss()*1.7); return s>=97.5?10: s>=94?9: s>=89?8: s>=83?7: s>=76?6: s>=68?5: s>=58?4: s>=46?3: s>=32?2:1; }

const GRADE_BASE=[0,0.35,0.4,0.45,0.55,0.65,0.78,0.9,1.0,1.55,3.4];   // the multiplier of a grade before a line's rarity scale (GCS 1 to 10)
function cardGradeMult(SCALE, rar, g){ const b=GRADE_BASE[g]; return b>1? 1+(b-1)*(SCALE[rar]||1) : b; }
const priceJitter=key=>0.9+0.2*((hsh('tj'+key)%1000)/1000);
function weekNo(t){ return Math.floor((t+3)/7); }
function cardNextDow(dw){ let t=G.day+1; while (dowOf(t)!==dw) t++; return t; }

function wearSVG(svg, cp){
  const c=cp.c; const r=mkRng(cp.id*131+7); let o='';
  const cw=100-c[1]; if (cw>6){ const s0=2.5+(cw-6)*0.28; [[0,0,1,1],[250,0,-1,1],[0,350,1,-1],[250,350,-1,-1]].forEach(([x,y,sx,sy],i)=>{ if (r()<0.35+cw/60){ const s=s0*(0.5+r()); o+=`<path d="M${x} ${y} L${x+sx*s} ${y} L${x} ${y+sy*s} Z" fill="#fff" opacity="${(0.55+0.4*r()).toFixed(2)}"/>`; } });
    if (cw>22) for (let i=0;i<4;i++){ const sx=r()<0.5?0:250, sy=r()<0.5?0:350; const k=sx?-1:1, m=sy?-1:1; o+=`<circle cx="${sx+k*2}" cy="${sy+m*2}" r="${3+r()*4}" fill="#e9e6df" opacity=".8"/>`; } }
  const ew=100-c[2]; if (ew>5){ const n=Math.min(40,Math.floor(ew*1.2)); for (let i=0;i<n;i++){ const side=Math.floor(r()*4); const p=6+r()*238, q=1+r()*2.5, L=2+r()*(3+ew*0.1); o+= side<2? `<rect x="${p.toFixed(1)}" y="${side?350-q-0.3:0.3}" width="${L.toFixed(1)}" height="${q.toFixed(1)}" fill="#fff" opacity="${(0.5+r()*0.4).toFixed(2)}"/>` : `<rect x="${side===2?0.3:250-q-0.3}" y="${(6+r()*338).toFixed(1)}" width="${q.toFixed(1)}" height="${L.toFixed(1)}" fill="#fff" opacity="${(0.5+r()*0.4).toFixed(2)}"/>`; } }
  const sw=100-c[3]; if (sw>5){ const n=Math.min(14,Math.floor(sw/2.2)); for (let i=0;i<n;i++){ const x=10+r()*220, y=40+r()*230, L=14+r()*(30+sw*1.2), a=(r()*70-35)*Math.PI/180; o+=`<path d="M${x.toFixed(1)} ${y.toFixed(1)} l${(Math.cos(a)*L).toFixed(1)} ${(Math.sin(a)*L).toFixed(1)}" stroke="#fff" stroke-width="${(0.4+r()*0.7).toFixed(2)}" opacity="${(0.25+r()*0.4).toFixed(2)}"/>`; }
    if (sw>32){ const y=60+r()*190; o+=`<path d="M0 ${y.toFixed(1)} Q125 ${(y+(r()*30-15)).toFixed(1)} 250 ${(y+(r()*24-12)).toFixed(1)}" stroke="#fff" stroke-width="1.6" opacity=".5"/><path d="M0 ${(y+1.6).toFixed(1)} Q125 ${(y+1.6+(r()*30-15)).toFixed(1)} 250 ${(y+1.6+(r()*24-12)).toFixed(1)}" stroke="#000" stroke-width=".8" opacity=".3"/>`; } }
  if (c[0]<90){ const sh=(90-c[0])*0.25; o+=`<rect x="${r()<0.5?0:250-sh}" y="0" width="${sh.toFixed(1)}" height="350" fill="#000" opacity=".12"/>`; }
  return o? svg.slice(0,svg.lastIndexOf('</svg>'))+`<g>${o}</g></svg>` : svg;
}

const INLINE_ART=new Map();
async function inlineArtSVG(svg){
  const urls=[...new Set((svg.match(/href="(art\/[^"]+)"/g)||[]).map(x=>x.slice(6,-1)))];
  for (const u of urls){ if (INLINE_ART.has(u)) continue; try { const b=await (await fetch(u)).blob(); INLINE_ART.set(u, await new Promise(res=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.readAsDataURL(b); })); } catch(e){ INLINE_ART.set(u,''); } }
  return svg.replace(/href="(art\/[^"]+)"/g,(m,u)=>'href="'+(INLINE_ART.get(u)||u)+'"');
}
const _v3rShared=v3Raster; v3Raster=async function(svg,W){ return _v3rShared(svg.indexOf('href="art/')>=0? await inlineArtSVG(svg) : svg, W); };
