// ===================== COMICS: COVER ART =====================
const CM_PAL = {
  hero:[['#c8102e','#1c3f94','#f2c230'],['#1b1b6f','#e63946','#f1faee'],['#0b6e4f','#f4d35e','#ee964b'],['#5b2a86','#f7b32b','#e4572e']],
  scifi:[['#0b132b','#3a506b','#5bc0be'],['#1a0933','#7b2cbf','#ff9e00'],['#022b3a','#1f7a8c','#e1e5f2']],
  fantasy:[['#2d1e2f','#c5a880','#6a994e'],['#14213d','#fca311','#e5e5e5'],['#3d2645','#832161','#f0eff4']],
  horror:[['#0d0d0d','#6a040f','#e9d8a6'],['#1b2021','#4f772d','#d4e09b'],['#10002b','#9d0208','#ffba08']],
  crime:[['#111111','#b08968','#e63946'],['#1d2d44','#f0ebd8','#cf5c36'],['#22223b','#c9ada7','#f2e9e4']],
  mystery:[['#1b263b','#e0e1dd','#778da9'],['#2b2d42','#edf2f4','#ef233c']],
  thriller:[['#0f0f0f','#ff5400','#e0e0e0'],['#14213d','#fca311','#ffffff']],
  western:[['#6f1d1b','#bb9457','#ffe6a7'],['#582f0e','#e76f51','#f4a261']],
  romance:[['#ff8fab','#fb6f92','#fff0f3'],['#9d4edd','#ffafcc','#fefae0']],
  comedy:[['#ffbe0b','#fb5607','#3a86ff'],['#8ac926','#ff595e','#1982c4']],
  satire:[['#f4f1de','#e07a5f','#3d405b'],['#fcbf49','#003049','#d62828']],
  slice:[['#ccd5ae','#e9edc9','#d4a373'],['#a8dadc','#457b9d','#f1faee']],
  literary:[['#f5ebe0','#d6ccc2','#6b705c'],['#edede9','#3d405b','#e07a5f']],
  historical:[['#6b4226','#d9ae61','#f3e9d2'],['#344e41','#a3b18a','#dad7cd']],
  war:[['#4a5d23','#c2b280','#8b0000'],['#3e3e3e','#a4ac86','#e8e8e8']],
  adventure:[['#2a9d8f','#e9c46a','#e76f51'],['#1d3557','#e9c46a','#a8dadc']],
  ya:[['#7209b7','#4cc9f0','#f72585'],['#06d6a0','#118ab2','#ffd166']],
  kids:[['#ffd60a','#00b4d8','#ff006e'],['#90e0ef','#ffb703','#fb8500']],
  anthology:[['#264653','#e9c46a','#f4a261'],['#3c1642','#1dd3b0','#affc41']],
  exp:[['#ffffff','#000000','#e63946'],['#f1f1f1','#1a1a1a','#ffd400']],
  alt:[['#f6f1e7','#1a1a1a','#d62828'],['#e9e3d5','#2b2b2b','#6a994e']],
  manga:[['#ffffff','#111111','#ef476f'],['#f8f9fa','#212529','#4361ee']]
};
const CVC = new Map();
function comicCover(key){
  let h=CVC.get(key); if (h) return h;
  h = comicCover0(key); if (CVC.size>1500) CVC.clear(); CVC.set(key,h); return h;
}
function cmArt(g, r, P, W, H, sk){
  const [a,b,c]=P; const F=sk?'none':''; const st = sk? `stroke="#222" stroke-width="2" fill="none"` : '';
  const fill = x=> sk? 'none' : x;
  const k=CG[g].k; let o='';
  const stars=n=>Array.from({length:n},()=>`<circle cx="${(r()*W).toFixed(0)}" cy="${(r()*H*0.6).toFixed(0)}" r="${(r()*1.4+0.3).toFixed(1)}" fill="${sk?'#222':'#fff'}" opacity=".8"/>`).join('');
  const skyline=(y,col)=>{ let x=0, p=`M0 ${H}`; while(x<W){ const w=10+r()*22, hh=20+r()*60; p+=` L${x.toFixed(0)} ${(y-hh).toFixed(0)} L${(x+w).toFixed(0)} ${(y-hh).toFixed(0)}`; x+=w; } p+=` L${W} ${H} Z`; return `<path d="${p}" ${sk?st:`fill="${col}"`}/>`; };
  const person=(x,y,s,col,cape)=>`<g transform="translate(${x} ${y}) scale(${s})" ${sk?st:`fill="${col}"`}>${cape?`<path d="M-18 -30 Q-40 20 -30 60 L30 60 Q40 20 18 -30 Z" ${sk?'':`fill="${shade(col,-0.3)}"`}/>`:''}<circle cx="0" cy="-48" r="13"/><path d="M-16 -32 L16 -32 L20 20 L10 20 L8 60 L-8 60 L-10 20 L-20 20 Z"/><path d="M-16 -30 L-34 -58 M16 -30 L34 -8" stroke="${sk?'#222':col}" stroke-width="9" stroke-linecap="round"/></g>`;
  switch(k){
    case 'hero': o = `<rect width="${W}" height="${H}" fill="${fill(a)}"/>${Array.from({length:14},(_,i)=>`<path d="M${W/2} ${H*0.42} L${(W/2+Math.cos(i/14*6.283)*400).toFixed(0)} ${(H*0.42+Math.sin(i/14*6.283)*400).toFixed(0)} L${(W/2+Math.cos((i+0.5)/14*6.283)*400).toFixed(0)} ${(H*0.42+Math.sin((i+0.5)/14*6.283)*400).toFixed(0)} Z" fill="${sk?'none':shade(a,0.15)}" ${sk?'stroke="#bbb"':''}/>`).join('')}${skyline(H,shade(b,-0.4))}${person(W/2+(r()-0.5)*30, H*0.5, 1.4+r()*0.3, b, true)}`; break;
    case 'scifi': o = `<rect width="${W}" height="${H}" fill="${fill(a)}"/>${sk?'':stars(40)}<circle cx="${(W*0.3+r()*W*0.4).toFixed(0)}" cy="${(H*0.35).toFixed(0)}" r="${(40+r()*30).toFixed(0)}" ${sk?st:`fill="${b}"`}/><ellipse cx="${W*0.5}" cy="${H*0.35}" rx="85" ry="14" fill="none" stroke="${sk?'#222':c}" stroke-width="3" transform="rotate(-15 ${W/2} ${H*0.35})"/><path d="M${W*0.2} ${H*0.8} L${W*0.55} ${H*0.66} L${W*0.62} ${H*0.72} L${W*0.3} ${H*0.84} Z" ${sk?st:`fill="${c}"`}/>`; break;
    case 'fantasy': o = `<rect width="${W}" height="${H}" fill="${fill(a)}"/><circle cx="${W*0.7}" cy="${H*0.3}" r="30" ${sk?st:`fill="${c}"`} opacity=".9"/><path d="M0 ${H*0.8} L${W*0.25} ${H*0.5} L${W*0.45} ${H*0.72} L${W*0.7} ${H*0.45} L${W} ${H*0.75} L${W} ${H} L0 ${H} Z" ${sk?st:`fill="${shade(b,-0.4)}"`}/><path d="M${W*0.55} ${H*0.62} l0 -40 l8 0 l0 -10 l6 0 l0 10 l8 0 l0 -18 l10 -12 l10 12 l0 58 Z" ${sk?st:`fill="${shade(a,-0.5)}"`}/><path d="M${W*0.15} ${H*0.3} q30 -30 60 -5 q-20 5 -30 20 q-10 -10 -30 -15 Z" ${sk?st:`fill="${b}"`}/>`; break;
    case 'horror': o = `<rect width="${W}" height="${H}" fill="${fill(a)}"/><circle cx="${W*0.62}" cy="${H*0.32}" r="${(38+r()*14).toFixed(0)}" ${sk?st:`fill="${c}"`}/><path d="M${W*0.2} ${H} L${W*0.22} ${H*0.55} L${W*0.1} ${H*0.4} M${W*0.22} ${H*0.6} L${W*0.34} ${H*0.42} M${W*0.21} ${H*0.7} L${W*0.05} ${H*0.6}" stroke="${sk?'#222':'#000'}" stroke-width="6" fill="none"/><path d="M${W*0.45} ${H} L${W*0.45} ${H*0.66} L${W*0.62} ${H*0.54} L${W*0.8} ${H*0.66} L${W*0.8} ${H} Z" ${sk?st:`fill="${shade(a,-0.5)}"`}/><rect x="${W*0.58}" y="${H*0.72}" width="12" height="16" fill="${sk?'none':b}" ${sk?'stroke="#222"':''}/><circle cx="${W*0.3}" cy="${H*0.85}" r="3" fill="${b}"/><circle cx="${W*0.35}" cy="${H*0.85}" r="3" fill="${b}"/>`; break;
    case 'crime': case 'mystery': case 'thriller': o = `<rect width="${W}" height="${H}" fill="${fill(a)}"/>${skyline(H*0.75, shade(a,-0.4))}${sk?'':Array.from({length:30},()=>{ const x=r()*W,y=r()*H; return `<path d="M${x.toFixed(0)} ${y.toFixed(0)} l-4 12" stroke="${c}" opacity=".35"/>`; }).join('')}<g ${sk?st:`fill="${sk?'none':'#050505'}"`}><path d="M${W*0.5-26} ${H*0.52} L${W*0.5+26} ${H*0.52} L${W*0.5+34} ${H} L${W*0.5-34} ${H} Z"/><circle cx="${W*0.5}" cy="${H*0.45}" r="16"/><path d="M${W*0.5-30} ${H*0.42} L${W*0.5+30} ${H*0.42} L${W*0.5+18} ${H*0.4} L${W*0.5+14} ${H*0.33} L${W*0.5-14} ${H*0.33} L${W*0.5-18} ${H*0.4} Z"/></g><rect x="${W*0.12}" y="${H*0.3}" width="22" height="30" fill="${sk?'none':b}" ${sk?'stroke="#222"':''}/>`; break;
    case 'western': o = `<defs><linearGradient id="sw${r().toString(36).slice(2,7)}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></linearGradient></defs><rect width="${W}" height="${H}" fill="${sk?'#fff':c}"/><circle cx="${W*0.5}" cy="${H*0.55}" r="46" ${sk?st:`fill="${b}"`}/><path d="M0 ${H*0.62} L${W*0.15} ${H*0.62} L${W*0.18} ${H*0.5} L${W*0.4} ${H*0.5} L${W*0.43} ${H*0.62} L${W} ${H*0.62} L${W} ${H} L0 ${H} Z" ${sk?st:`fill="${a}"`}/><path d="M${W*0.75} ${H*0.9} l0 -50 m0 20 l-12 0 l0 -14 m12 6 l10 0 l0 -12" stroke="${sk?'#222':shade(a,-0.3)}" stroke-width="7" fill="none" stroke-linecap="round"/>${person(W*0.35,H*0.7,0.9,sk?'#222':shade(a,-0.5),false)}`; break;
    case 'romance': o = `<rect width="${W}" height="${H}" fill="${fill(c)}"/><path d="M${W*0.5} ${H*0.78} C${W*0.05} ${H*0.5} ${W*0.2} ${H*0.2} ${W*0.5} ${H*0.38} C${W*0.8} ${H*0.2} ${W*0.95} ${H*0.5} ${W*0.5} ${H*0.78} Z" ${sk?st:`fill="${a}"`} opacity=".85"/><g ${sk?st:`fill="${shade(b,-0.4)}"`}><path d="M${W*0.2} ${H} L${W*0.2} ${H*0.6} Q${W*0.3} ${H*0.42} ${W*0.42} ${H*0.52} L${W*0.44} ${H*0.6} L${W*0.4} ${H*0.66} L${W*0.42} ${H} Z"/><path d="M${W*0.8} ${H} L${W*0.8} ${H*0.58} Q${W*0.7} ${H*0.4} ${W*0.58} ${H*0.52} L${W*0.56} ${H*0.6} L${W*0.6} ${H*0.66} L${W*0.58} ${H} Z"/></g>`; break;
    case 'comedy': case 'satire': case 'kids': { const cx=W*0.5, cy=H*0.6; o = `<rect width="${W}" height="${H}" fill="${fill(a)}"/>${Array.from({length:18},()=>`<circle cx="${(r()*W).toFixed(0)}" cy="${(r()*H).toFixed(0)}" r="${(4+r()*8).toFixed(0)}" fill="${sk?'none':c}" opacity=".35" ${sk?'stroke="#aaa"':''}/>`).join('')}<ellipse cx="${cx}" cy="${cy}" rx="52" ry="58" ${sk?st:`fill="${b}"`}/><circle cx="${cx-18}" cy="${cy-12}" r="11" fill="#fff" stroke="#222" stroke-width="2"/><circle cx="${cx+18}" cy="${cy-12}" r="11" fill="#fff" stroke="#222" stroke-width="2"/><circle cx="${cx-15}" cy="${cy-10}" r="5" fill="#222"/><circle cx="${cx+21}" cy="${cy-10}" r="5" fill="#222"/><path d="M${cx-22} ${cy+16} Q${cx} ${cy+38} ${cx+22} ${cy+16}" stroke="#222" stroke-width="3" fill="${sk?'none':'#7a1b1b'}"/>${k==='kids'?`<path d="M${cx-40} ${cy-50} l-10 -30 l24 18 Z M${cx+40} ${cy-50} l10 -30 l-24 18 Z" ${sk?st:`fill="${b}"`}/>`:''}`; break; }
    case 'war': case 'historical': o = `<rect width="${W}" height="${H}" fill="${fill(c)}"/><path d="M0 ${H*0.75} Q${W*0.5} ${H*0.65} ${W} ${H*0.78} L${W} ${H} L0 ${H} Z" ${sk?st:`fill="${a}"`}/><g ${sk?st:`fill="${shade(a,-0.4)}"`} transform="translate(${W*0.5} ${H*0.35}) rotate(${(r()*20-10).toFixed(0)})"><path d="M-60 0 L60 -4 L66 0 L60 4 Z"/><path d="M-6 -2 L-24 -40 L-12 -40 L10 -2 Z M-6 2 L-24 40 L-12 40 L10 2 Z"/><path d="M-56 -2 L-66 -16 L-60 -16 L-48 -2 Z"/></g>${Array.from({length:6},()=>`<circle cx="${(r()*W).toFixed(0)}" cy="${(H*0.7+r()*H*0.2).toFixed(0)}" r="${(8+r()*14).toFixed(0)}" fill="${sk?'none':'#777'}" opacity=".5"/>`).join('')}`; break;
    case 'adventure': o = `<rect width="${W}" height="${H}" fill="${fill(b)}"/><path d="M${W*0.2} ${H*0.8} L${W*0.5} ${H*0.3} L${W*0.8} ${H*0.8} Z" ${sk?st:`fill="${shade(a,-0.2)}"`}/>${[0.4,0.5,0.6,0.7].map(y=>`<path d="M${W*(0.5-(y-0.3)*0.6)} ${H*y} L${W*(0.5+(y-0.3)*0.6)} ${H*y}" stroke="${sk?'#222':shade(a,-0.5)}" stroke-width="2"/>`).join('')}<path d="M0 ${H} Q${W*0.1} ${H*0.6} ${W*0.2} ${H} M${W} ${H} Q${W*0.9} ${H*0.55} ${W*0.78} ${H}" ${sk?st:`fill="${a}"`}/>${person(W*0.5,H*0.86,0.6,sk?'#222':c,false)}`; break;
    case 'manga': o = `<rect width="${W}" height="${H}" fill="#fff"/>${Array.from({length:40},(_,i)=>`<path d="M${W/2} ${H*0.5} L${(W/2+Math.cos(i/40*6.283)*300).toFixed(0)} ${(H*0.5+Math.sin(i/40*6.283)*300).toFixed(0)}" stroke="${sk?'#ccc':b}" stroke-width="${(0.5+r()*2).toFixed(1)}" opacity=".7"/>`).join('')}<ellipse cx="${W*0.5}" cy="${H*0.55}" rx="46" ry="54" fill="#fff" stroke="#111" stroke-width="3"/><path d="M${W*0.5-50} ${H*0.5} Q${W*0.5} ${H*0.2} ${W*0.5+50} ${H*0.5} L${W*0.5+30} ${H*0.42} L${W*0.5+10} ${H*0.5} L${W*0.5-10} ${H*0.42} L${W*0.5-30} ${H*0.5} Z" fill="${sk?'none':c}" stroke="#111" stroke-width="2"/><ellipse cx="${W*0.5-18}" cy="${H*0.57}" rx="10" ry="14" fill="#111"/><ellipse cx="${W*0.5+18}" cy="${H*0.57}" rx="10" ry="14" fill="#111"/><circle cx="${W*0.5-15}" cy="${H*0.55}" r="3" fill="#fff"/><circle cx="${W*0.5+21}" cy="${H*0.55}" r="3" fill="#fff"/>`; break;
    case 'anthology': o = `<rect width="${W}" height="${H}" fill="${fill(a)}"/>${[[8,8],[W/2+4,8],[8,H/2+4],[W/2+4,H/2+4]].map(([x,y],i)=>`<rect x="${x}" y="${y}" width="${W/2-12}" height="${H/2-12}" fill="${sk?'none':[b,c,shade(b,0.3),shade(c,-0.3)][i]}" stroke="#111" stroke-width="2"/><circle cx="${x+W/4-6}" cy="${y+H/4-6}" r="${(10+r()*16).toFixed(0)}" fill="${sk?'none':'#111'}" opacity=".6" ${sk?'stroke="#222"':''}/>`).join('')}`; break;
    case 'exp': case 'alt': o = `<rect width="${W}" height="${H}" fill="${sk?'#fff':a}"/>${Array.from({length:k==='exp'?9:5},()=>{ const x=r()*W, y=r()*H, s=20+r()*70; return r()<0.5? `<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="${s.toFixed(0)}" height="${(s*(0.5+r())).toFixed(0)}" fill="${sk?'none':(r()<0.6?b:c)}" stroke="#111" stroke-width="${k==='alt'?3:1}" transform="rotate(${(r()*40-20).toFixed(0)} ${x.toFixed(0)} ${y.toFixed(0)})"/>` : `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(s/2).toFixed(0)}" fill="${sk?'none':(r()<0.6?c:b)}" stroke="#111" stroke-width="${k==='alt'?3:1}"/>`; }).join('')}${k==='alt'?Array.from({length:30},()=>`<path d="M${(r()*W).toFixed(0)} ${(r()*H).toFixed(0)} l${(r()*30-15).toFixed(0)} ${(r()*30-15).toFixed(0)}" stroke="#111" stroke-width="1.5"/>`).join(''):''}`; break;
    case 'ya': case 'slice': case 'literary': default: o = `<rect width="${W}" height="${H}" fill="${fill(c)}"/><rect x="${W*0.18}" y="${H*0.22}" width="${W*0.64}" height="${H*0.5}" fill="${sk?'none':b}" stroke="${sk?'#222':shade(b,-0.4)}" stroke-width="3"/><path d="M${W*0.5} ${H*0.22} L${W*0.5} ${H*0.72} M${W*0.18} ${H*0.47} L${W*0.82} ${H*0.47}" stroke="${sk?'#222':shade(b,-0.4)}" stroke-width="3"/><circle cx="${W*0.35}" cy="${H*0.36}" r="14" fill="${sk?'none':c}" opacity=".7"/>${k==='ya'?person(W*0.3,H*0.9,0.6,sk?'#222':a,false)+person(W*0.7,H*0.9,0.6,sk?'#222':shade(a,-0.3),false):person(W*0.66,H*0.95,0.7,sk?'#222':a,false)}`;
  }
  return o;
}
function comicCover0(key){
  const d=cmD(key), s=d.s; const W=200, H=300; const uid=hsh(key).toString(36);
  const yr=yearOf(issueDay(s, d.n||1)); const era=eraOf(yr);
  const pals=CM_PAL[CG[s.g].k]||CM_PAL.slice; const vr=d.v||'';
  const rs = hsh(s.id+'|'+(d.n||0)+'|'+(vr==='B'||/^[RSVXC]/.test(vr)?vr:''));
  const r=mkRng(rs); let P=pals[rs%pals.length];
  if (vr==='B') P=[P[1],P[2],P[0]]; else if (/^R/.test(vr)) P=[shade(P[0],-0.35),P[2],P[1]];
  const sk = /^S/.test(vr); const virgin = /^V/.test(vr);
  const F='font-family="Barlow Condensed,Arial Narrow,sans-serif"';
  const title=s.t.toUpperCase(); const tl=title.length;
  const fs = Math.max(15, Math.min(era<=2?40:34, Math.floor(360/Math.max(6,tl))));
  const paper = era<=1 ? '#efe4c8' : era<=2 ? '#f3ecd9' : '#ffffff';
  const logoCol = lum(P[0])>0.6 ? '#111' : P[2];
  let art = cmArt(s.g, r, P, W, H, sk);
  if (d.tr){
    const hc=d.kind==='H';
    return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" class="cmsvg"><rect width="${W}" height="${H}" fill="${hc?'#161616':P[0]}"/><g opacity="${hc?0.5:0.9}" transform="translate(20 70) scale(0.8)">${art}</g><rect x="0" y="0" width="12" height="${H}" fill="${hc?'#c9a227':shade(P[0],-0.35)}"/><text x="${W/2+6}" y="40" text-anchor="middle" ${F} font-weight="800" font-size="${Math.min(26,fs)}" fill="${hc?'#c9a227':'#fff'}">${esc(title)}</text><text x="${W/2+6}" y="60" text-anchor="middle" ${F} font-size="13" fill="${hc?'#e8d8a0':'#fff'}" letter-spacing="2">${hc?'DELUXE HARDCOVER':'VOLUME '+d.vol}</text><text x="${W/2+6}" y="${H-12}" text-anchor="middle" ${F} font-size="11" fill="${hc?'#c9a227':'#fff'}">${esc(pubName(s).toUpperCase())}</text></svg>`;
  }
  let dress='';
  if (!virgin){
    if (era<=1){ // golden/silver: banner title, corner box
      dress = `<rect x="0" y="0" width="${W}" height="62" fill="${P[1]}"/><rect x="6" y="6" width="36" height="46" fill="#fff" stroke="#111" stroke-width="1.5"/><text x="24" y="20" text-anchor="middle" ${F} font-weight="800" font-size="10" fill="#111">${esc((pubOf(s)||{sh:'IND'}).sh)}</text><text x="24" y="34" text-anchor="middle" ${F} font-weight="800" font-size="12" fill="#c00">${d.cp<1?Math.round(d.cp*100)+'¢':'$'+d.cp.toFixed(2)}</text><text x="24" y="47" text-anchor="middle" ${F} font-weight="700" font-size="10" fill="#111">NO. ${d.n}</text>
        <text x="${W/2+20}" y="${30+fs*0.35}" text-anchor="middle" ${F} font-weight="800" font-size="${fs}" fill="${P[2]}" stroke="#111" stroke-width="1.6" paint-order="stroke" textLength="${Math.min(150, tl*fs*0.5)}" lengthAdjust="spacingAndGlyphs">${esc(title)}</text>`;
    } else if (era<=3){ // bronze/80s: corner box + logo
      dress = `<rect x="0" y="0" width="44" height="60" fill="#fff"/><rect x="3" y="3" width="38" height="54" fill="${P[1]}"/><text x="22" y="20" text-anchor="middle" ${F} font-weight="800" font-size="11" fill="#fff">${esc((pubOf(s)||{sh:'IND'}).sh)}</text><text x="22" y="38" text-anchor="middle" ${F} font-weight="800" font-size="16" fill="#fff">${d.n}</text><text x="22" y="52" text-anchor="middle" ${F} font-size="9" fill="#fff">${d.cp<1?Math.round(d.cp*100)+'¢':'$'+d.cp.toFixed(2)}</text>
        <text x="${W/2+22}" y="${22+fs*0.55}" text-anchor="middle" ${F} font-weight="800" font-size="${fs}" fill="${logoCol}" stroke="#111" stroke-width="1.4" paint-order="stroke" textLength="${Math.min(148, tl*fs*0.5)}" lengthAdjust="spacingAndGlyphs">${esc(title)}</text>`;
    } else { // modern: clean logo, small trade dress
      dress = `<text x="${W/2}" y="${14+fs*0.8}" text-anchor="middle" ${F} font-weight="800" font-size="${fs+4}" fill="${logoCol}" stroke="${lum(logoCol)>0.5?'#111':'#fff'}" stroke-width="${era===4?2:0.8}" paint-order="stroke" textLength="${Math.min(184, tl*(fs+4)*0.52)}" lengthAdjust="spacingAndGlyphs">${esc(title)}</text>
        <text x="10" y="${H-10}" ${F} font-weight="700" font-size="11" fill="#fff" stroke="#111" stroke-width="2" paint-order="stroke">#${d.n}</text><text x="${W-8}" y="${H-10}" text-anchor="end" ${F} font-size="9" fill="#fff" stroke="#111" stroke-width="2" paint-order="stroke">${esc((pubOf(s)||{sh:'SELF'}).sh)}</text>`;
      if (!vr) dress += `<rect x="12" y="${H-58}" width="30" height="36" fill="#fff"/>${Array.from({length:12},(_,i)=>`<rect x="${14+i*2.2}" y="${H-54}" width="${i%3?1:1.6}" height="24" fill="#111"/>`).join('')}`;
    }
    if (era===4 && d.n===1) dress += `<rect x="0" y="${H-46}" width="${W}" height="16" fill="#f2c230" transform="rotate(-6 ${W/2} ${H-38})"/><text x="${W/2}" y="${H-34}" text-anchor="middle" ${F} font-weight="800" font-size="11" fill="#111" transform="rotate(-6 ${W/2} ${H-38})">COLLECTOR'S ITEM #1 ISSUE!</text>`;
  }
  let over='';
  if (vr==='F') over += `<defs><linearGradient id="fo${uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".0"/><stop offset=".45" stop-color="#fff" stop-opacity=".45"/><stop offset=".55" stop-color="#b3e5fc" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#fo${uid})"/>`;
  if (/^X/.test(vr)) over += `<rect x="0" y="${H-24}" width="${W}" height="24" fill="#111"/><text x="${W/2}" y="${H-8}" text-anchor="middle" ${F} font-weight="700" font-size="11" fill="#f2c230" letter-spacing="1">RETAILER EXCLUSIVE</text>`;
  if (/^C/.test(vr)) over += `<rect x="0" y="${H-24}" width="${W}" height="24" fill="#c8102e"/><text x="${W/2}" y="${H-8}" text-anchor="middle" ${F} font-weight="700" font-size="10" fill="#fff" letter-spacing="1">CONVENTION EXCLUSIVE</text>`;
  if (d.p>1 && d.p<9) over += `<rect x="${W-70}" y="${H*0.45}" width="80" height="16" fill="#fff" transform="rotate(-35 ${W-30} ${H*0.45})"/><text x="${W-30}" y="${H*0.45+12}" text-anchor="middle" ${F} font-weight="800" font-size="10" fill="#c00" transform="rotate(-35 ${W-30} ${H*0.45})">${['','','2ND','3RD','4TH','5TH'][d.p]||d.p+'TH'} PRINTING</text>`;
  if (d.p===9) over += `<rect x="0" y="0" width="${W}" height="14" fill="#111"/><text x="${W/2}" y="11" text-anchor="middle" ${F} font-weight="700" font-size="10" fill="#fff" letter-spacing="2">FACSIMILE EDITION</text>`;
  if (/^[RV]/.test(vr) && !virgin) over += `<text x="${W-8}" y="${era>=4?H-24:H-8}" text-anchor="end" ${F} font-size="8" fill="#fff" stroke="#111" stroke-width="1.5" paint-order="stroke">VARIANT</text>`;
  const pap = era<=2 && !sk ? `<rect width="${W}" height="${H}" fill="${paper}" opacity=".18"/>` : '';
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" class="cmsvg"><clipPath id="cc${uid}"><rect width="${W}" height="${H}"/></clipPath><g clip-path="url(#cc${uid})">${art}${pap}${dress}${over}</g><rect x=".5" y=".5" width="${W-1}" height="${H-1}" fill="none" stroke="rgba(0,0,0,.25)"/></svg>`;
}
function comicSlab(cp){
  const d=cmD(cp.k), s=d.s; const g=cp.g;
  const lab = cp.gr ? ['#6a3d9a','RESTORED'] : cp.sg && cp.sg.s==='a' ? ['#d4a017','SIGNATURE'] : cp.sg && cp.sg.s==='x' ? ['#6b7a88','QUALIFIED'] : ['#1f5fa8','UNIVERSAL'];
  const F='font-family="Barlow Condensed,Arial Narrow,sans-serif"';
  const cv=comicCover(cp.k); const inner = `<g transform="translate(25 98) scale(0.9)">${cv.slice(cv.indexOf('>')+1, cv.lastIndexOf('</svg>'))}</g>`;
  const ks = d.tr?[]:issueKeys(s,d.n).slice(0,1).map(k=>keyText(k,s));
  const pg = cp.c[6]>=92?'WHITE PAGES': cp.c[6]>=82?'OFF-WHITE TO WHITE PAGES': cp.c[6]>=70?'OFF-WHITE PAGES': cp.c[6]>=55?'CREAM TO OFF-WHITE PAGES':'TAN PAGES';
  return `<svg viewBox="0 0 230 386" xmlns="http://www.w3.org/2000/svg" class="cmsvg slab"><rect x="2" y="2" width="226" height="382" rx="10" fill="#e3e8ec" stroke="#b6c0c8" stroke-width="2"/>
    <rect x="9" y="9" width="212" height="80" rx="4" fill="#fff" stroke="${lab[0]}" stroke-width="2"/><rect x="9" y="9" width="212" height="16" rx="3" fill="${lab[0]}"/><text x="16" y="21" ${F} font-weight="800" font-size="11" fill="#fff" letter-spacing="1">GCS COMICS · ${lab[1]} GRADE</text>
    <text x="16" y="42" ${F} font-weight="800" font-size="13" fill="#111" ${d.title.length>20?'textLength="150" lengthAdjust="spacingAndGlyphs"':''}>${esc(d.title.toUpperCase().slice(0,34))}</text>
    <text x="16" y="55" ${F} font-size="10" fill="#333" textLength="150" lengthAdjust="spacingAndGlyphs">${esc((pubName(s)+' · '+d.yr+(d.label?' · '+d.label:'')).toUpperCase().slice(0,44))}</text>
    <text x="16" y="67" ${F} font-size="9" fill="#555" ${(ks[0]||'').length>30?'textLength="196" lengthAdjust="spacingAndGlyphs"':''}>${esc((ks[0]||'').toUpperCase().slice(0,52))}</text>
    <text x="16" y="80" ${F} font-size="8.5" fill="#777" textLength="196" lengthAdjust="spacingAndGlyphs">${cp.sg&&cp.sg.s==='a'?esc(('Signed by '+CR_(cp.sg.c).n).toUpperCase())+' · ':''}${cp.gr?esc(REST_N[cp.r].toUpperCase())+' · ':''}${pg} · ${cp.cert||''}</text>
    <text x="212" y="52" text-anchor="end" ${F} font-weight="800" font-size="30" fill="#111">${gTxt(g)}</text><text x="212" y="66" text-anchor="end" ${F} font-weight="700" font-size="10" fill="${lab[0]}">${CGN[g]}</text>
    <rect x="18" y="94" width="194" height="280" rx="4" fill="#c9d2d9"/>${inner}</svg>`;
}
function cmThumb(cp){ return cp && cp.g>0 ? comicSlab(cp) : comicCover(cp.k); }
function miniComic(cp){ return `<div class="mini cm ${cp.g>0?'slab':''}">${cmThumb(cp)}</div>`; }
function miniCKey(k){ return `<div class="mini cm">${comicCover(k)}</div>`; }
