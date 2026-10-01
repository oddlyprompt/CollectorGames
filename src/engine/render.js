// ===================== CARD ART =====================
const SKIN = ['#f1c9a5','#d9a47c','#b57a52','#8a5536','#5e3a24'];
const SVGC = new Map();
function hsh(s){ return hashStr(String(s)); }
function shade(hex, amt){ let c=parseInt(hex.slice(1),16); let r=(c>>16)&255, g=(c>>8)&255, b=c&255; if (amt<0){ r=r*(1+amt); g=g*(1+amt); b=b*(1+amt);} else { r=r+(255-r)*amt; g=g+(255-g)*amt; b=b+(255-b)*amt; } return '#'+[r,g,b].map(x=>Math.round(clamp(x,0,255)).toString(16).padStart(2,'0')).join(''); }
function lum(hex){ const c=parseInt(hex.slice(1),16); return (0.299*((c>>16)&255)+0.587*((c>>8)&255)+0.114*(c&255))/255; }

// stylized player figure; pose from position and variation
function figure(p, pose, c1, c2, uid){
  const skin=SKIN[p.sk]; const flip = (hsh(p.id)%3===0);
  const tf = flip? 'translate(250,0) scale(-1,1)' : '';
  const jersey = lum(c1)>0.7 ? c2 : '#f4f4f2';
  const trim = c1, pants = '#e9e9e6';
  let arms, extra='';
  if (pose==='pitch'){
    arms = `<path d="M118 150 L80 118 L62 86" stroke="${jersey}" stroke-width="15" fill="none" stroke-linecap="round"/><circle cx="60" cy="82" r="8" fill="${skin}"/><circle cx="54" cy="76" r="5" fill="#fff" stroke="#c33" stroke-width="1"/>
      <path d="M140 152 L170 170 L182 196" stroke="${jersey}" stroke-width="15" fill="none" stroke-linecap="round"/><ellipse cx="186" cy="202" rx="11" ry="13" fill="#6b3f1f"/>`;
  } else if (pose==='cheer'){
    arms = `<path d="M116 150 L96 112 L90 74" stroke="${jersey}" stroke-width="15" fill="none" stroke-linecap="round"/><circle cx="90" cy="70" r="8" fill="${skin}"/>
      <path d="M142 150 L162 112 L168 74" stroke="${jersey}" stroke-width="15" fill="none" stroke-linecap="round"/><circle cx="168" cy="70" r="8" fill="${skin}"/>`;
  } else if (pose==='field'){
    arms = `<path d="M116 156 L92 186 L84 212" stroke="${jersey}" stroke-width="15" fill="none" stroke-linecap="round"/><ellipse cx="82" cy="218" rx="13" ry="12" fill="#7a4a22"/>
      <path d="M142 156 L164 188 L170 210" stroke="${jersey}" stroke-width="15" fill="none" stroke-linecap="round"/><circle cx="171" cy="214" r="8" fill="${skin}"/>`;
  } else { // bat
    arms = `<path d="M118 152 L138 176 L156 150" stroke="${jersey}" stroke-width="15" fill="none" stroke-linecap="round"/>
      <path d="M140 150 L150 170 L158 150" stroke="${jersey}" stroke-width="14" fill="none" stroke-linecap="round"/><circle cx="158" cy="147" r="8" fill="${skin}"/>
      <path d="M160 146 L196 60" stroke="#c89b62" stroke-width="7" stroke-linecap="round"/><path d="M190 76 L198 56" stroke="#a87b45" stroke-width="10" stroke-linecap="round"/>`;
  }
  const crouch = pose==='field';
  const legs = crouch ? `<path d="M116 226 L96 262 L100 300" stroke="${pants}" stroke-width="18" fill="none" stroke-linecap="round"/><path d="M142 226 L166 262 L160 300" stroke="${pants}" stroke-width="18" fill="none" stroke-linecap="round"/>`
    : `<path d="M118 228 L108 280 L104 330" stroke="${pants}" stroke-width="18" fill="none" stroke-linecap="round"/><path d="M140 228 L152 280 L160 330" stroke="${pants}" stroke-width="18" fill="none" stroke-linecap="round"/>
       <path d="M104 318 L104 332" stroke="${trim}" stroke-width="18"/><path d="M160 318 L160 332" stroke="${trim}" stroke-width="18"/>`;
  return `<g transform="${tf}">
    ${legs}
    <path d="M106 142 Q129 128 152 142 L156 230 Q129 238 102 230 Z" fill="${jersey}" stroke="${trim}" stroke-width="3"/>
    <text x="129" y="196" text-anchor="middle" ${flip?'transform="translate(258,0) scale(-1,1)"':''} font-family="Barlow Condensed, Arial Narrow, sans-serif" font-weight="700" font-size="30" fill="${trim}">${p.num}</text>
    <rect x="102" y="222" width="54" height="8" fill="${trim}"/>
    ${arms}
    <rect x="122" y="118" width="14" height="14" fill="${skin}"/>
    <circle cx="129" cy="106" r="19" fill="${skin}"/>
    <path d="M109 104 Q110 82 129 82 Q149 82 150 104 Z" fill="${c1}"/>
    <path d="M146 100 Q162 100 168 106 L148 107 Z" fill="${shade(c1,-0.25)}"/>
    <circle cx="129" cy="82" r="2.5" fill="${shade(c1,-0.3)}"/>
  </g>`;
}
function sigPath(name){
  const r=mkRng(hsh(name)); let x=40, y=0, d=`M${x} ${y}`;
  const n = 6+Math.floor(r()*4);
  for (let i=0;i<n;i++){ const dx=12+r()*12; const up=-10-r()*16, dn=6+r()*10; d+=` C${(x+dx*0.3).toFixed(1)} ${up.toFixed(1)} ${(x+dx*0.7).toFixed(1)} ${dn.toFixed(1)} ${(x+dx).toFixed(1)} ${(r()*6-3).toFixed(1)}`; x+=dx; if (r()<0.25){ d+=` c-4 -14 -10 -10 -6 2`; } }
  d+=` M${50} ${10+r()*4} Q${x*0.6} ${16+r()*6} ${x+8} ${4}`;
  return d;
}
function parFill(par, uid){
  if (!par) return null;
  if (par.fin==='foil') return `url(#fo${uid})`;
  if (par.fin==='super') return `url(#su${uid})`;
  if (par.fin==='plate') return `url(#pl${uid})`;
  return par.col;
}
function defs(uid, par, c1){
  const pc = par? par.col : '#ccc';
  return `<defs>
    <linearGradient id="fo${uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8d969f"/><stop offset=".3" stop-color="#eef2f5"/><stop offset=".5" stop-color="#9aa3ab"/><stop offset=".75" stop-color="#f7f9fb"/><stop offset="1" stop-color="#7d868f"/></linearGradient>
    <linearGradient id="su${uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8a6a1f"/><stop offset=".25" stop-color="#f4e3a1"/><stop offset=".45" stop-color="#b8902f"/><stop offset=".7" stop-color="#fff2c4"/><stop offset="1" stop-color="#8a6a1f"/></linearGradient>
    <linearGradient id="pl${uid}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b8bec4"/><stop offset=".5" stop-color="#e6eaee"/><stop offset="1" stop-color="#a7aeb5"/></linearGradient>
    <linearGradient id="rf${uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff6b6b" stop-opacity=".35"/><stop offset=".2" stop-color="#ffd93d" stop-opacity=".3"/><stop offset=".4" stop-color="#6bff95" stop-opacity=".28"/><stop offset=".6" stop-color="#4dc4ff" stop-opacity=".3"/><stop offset=".8" stop-color="#b86bff" stop-opacity=".3"/><stop offset="1" stop-color="#ff6bd5" stop-opacity=".3"/></linearGradient>
    <linearGradient id="tint${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${pc}" stop-opacity=".55"/><stop offset="1" stop-color="${pc}" stop-opacity=".15"/></linearGradient>
    <pattern id="mesh${uid}" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="${c1}"/><circle cx="3" cy="3" r="1.3" fill="${shade(c1,-0.35)}"/></pattern>
    <pattern id="pin${uid}" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="#f1efe8"/><rect width="1.4" height="8" fill="${c1}"/></pattern>
    <clipPath id="cp${uid}"><rect x="0" y="0" width="250" height="350" rx="10"/></clipPath>
  </defs>`;
}
function cardFront(key, serial, opts){
  opts=opts||{};
  const ck = key+'#'+serial+(opts.small?'s':'');
  if (SVGC.has(ck)) return SVGC.get(ck);
  const d=D(key), p=P(d.pid), br=B(d.prod), yr=d.prod.yr;
  const car = p.car[yr-1]; const tmOnCard = (car && car.t>=0) ? car.t : (p.tm>=0?p.tm:p.org);
  const T=TEAMS_DEF[tmOnCard] || TEAMS_DEF[0]; const c1=T[3], c2=T[4];
  const uid = (hsh(ck)%1e7).toString(36);
  const par = d.parObj;
  const pose = d.sec==='v'||d.sec==='w' ? 'cheer' : isPitcher(p) ? 'pitch' : (hsh(p.id+yr)%4===0 ? 'field' : 'bat');
  const name = pname(p);
  const posTxt = p.pos;
  const cond = d.caseHit ? 'case' : d.ins ? 'ins' : br.tmpl;
  let body='';
  const pf = parFill(par, uid);
  const figSvg = figure(p, pose, c1, c2, uid);
  const rc = d.rc ? `<g transform="translate(206,18)"><path d="M0 0 H30 V22 L15 32 L0 22 Z" fill="#fff" stroke="#1b1b1b" stroke-width="2"/><text x="15" y="18" text-anchor="middle" font-family="Barlow Condensed,Arial Narrow,sans-serif" font-weight="800" font-size="15" fill="#c0282d">RC</text></g>` : '';
  const first = d.first ? `<g transform="translate(14,16)"><path d="M0 0 H46 L38 13 L46 26 H0 Z" fill="#111"/><text x="20" y="18" text-anchor="middle" font-family="Barlow Condensed,Arial Narrow,sans-serif" font-weight="800" font-size="15" fill="#f2c230">1ST</text></g>` : '';
  const serialTxt = serial && d.run ? `<text x="236" y="${cond==='lux'?330:250}" text-anchor="end" font-family="Barlow Condensed,Arial Narrow,sans-serif" font-weight="700" font-size="${d.run===1?15:13}" fill="${par&&par.fin==='super'?'#8a6a1f':'#fff'}" stroke="${par&&par.fin==='super'?'none':'rgba(0,0,0,.55)'}" stroke-width=".6" paint-order="stroke">${String(serial).padStart(String(d.run).length,'0')}/${d.run}</text>` : '';
  const autoBox = d.auto ? `<g transform="translate(30,${cond==='lux'?214:222})"><rect width="190" height="48" rx="6" fill="#fbfbf8" stroke="${pf||'#ccc'}" stroke-width="${pf?3:1.5}"/><path d="${sigPath(name)}" transform="translate(-6,26) scale(${Math.min(1.2,170/ (200))})" fill="none" stroke="#1d3fa3" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></g>` : '';
  const relic = d.relic ? `<g transform="translate(150,196)"><rect width="78" height="56" rx="4" fill="#111" /><rect x="4" y="4" width="70" height="48" rx="3" fill="url(#${hsh(p.id)%2?'mesh':'pin'}${uid})"/></g>` : '';
  const refr = par && (par.fin==='refr'||par.fin==='super') ? `<rect x="0" y="0" width="250" height="350" fill="url(#rf${uid})" style="mix-blend-mode:screen"/>` : '';
  const tint = par && par.fin==='refr' && par.run ? `<rect x="0" y="0" width="250" height="350" fill="url(#tint${uid})" style="mix-blend-mode:multiply"/>` : '';
  const F = 'font-family="Barlow Condensed,Arial Narrow,sans-serif"';
  if (cond==='dia'){
    const border = pf || '#fdfdfb';
    body = `<rect width="250" height="350" fill="${border}"/>
      <rect x="11" y="11" width="228" height="328" rx="4" fill="${c1}"/>
      <g opacity=".22"><path d="M11 60 L239 10 L239 40 L11 90 Z" fill="#fff"/><path d="M11 150 L239 100 L239 118 L11 168 Z" fill="#fff"/></g>
      <g clip-path="url(#cp${uid})"><svg x="11" y="11" width="228" height="328" viewBox="0 0 250 350">${figSvg}</svg></g>
      <path d="M11 268 L239 256 L239 339 L11 339 Z" fill="${c2}"/><path d="M11 268 L239 256 L239 262 L11 274 Z" fill="${border}"/>
      <text x="22" y="304" ${F} font-weight="800" font-size="27" fill="${lum(c2)>0.6?'#15181c':'#fff'}" textLength="${Math.min(206,name.length*14.5)}" lengthAdjust="spacingAndGlyphs">${esc(name.toUpperCase())}</text>
      <text x="22" y="326" ${F} font-weight="600" font-size="14" fill="${lum(c2)>0.6?'#15181c':'#fff'}" opacity=".85">${esc(T[0].toUpperCase()+' '+T[1].toUpperCase())}</text>
      <g transform="translate(20,20)"><path d="M14 0 L28 14 L14 28 L0 14 Z" fill="${border==='#fdfdfb'?'#fff':border}" stroke="#15181c" stroke-width="1.5"/><text x="14" y="19" text-anchor="middle" ${F} font-weight="800" font-size="13" fill="#15181c">D</text></g>
      <circle cx="222" cy="312" r="15" fill="${border==='#fdfdfb'?'#fff':border}" stroke="#15181c" stroke-width="1.2"/><text x="222" y="317" text-anchor="middle" ${F} font-weight="800" font-size="13" fill="#15181c">${posTxt}</text>`;
  } else if (cond==='nat'){
    const border = pf || '#ffffff';
    body = `<rect width="250" height="350" fill="${border}"/>
      <rect x="15" y="15" width="220" height="320" fill="${shade(c1,0.55)}"/>
      <rect x="15" y="15" width="220" height="320" fill="none" stroke="${c1}" stroke-width="5"/>
      <svg x="15" y="15" width="220" height="300" viewBox="0 0 250 340">${figSvg}</svg>
      <rect x="15" y="278" width="150" height="44" fill="${c1}"/><text x="24" y="301" ${F} font-weight="700" font-size="19" fill="#fff" textLength="${Math.min(134,name.length*10)}" lengthAdjust="spacingAndGlyphs">${esc(name)}</text>
      <text x="24" y="316" ${F} font-weight="500" font-size="12" fill="#fff" opacity=".85">${esc(T[1])} · ${posTxt}</text>
      <rect x="208" y="15" width="27" height="130" fill="${c2}"/><text transform="translate(227,138) rotate(-90)" ${F} font-weight="800" font-size="16" fill="${lum(c2)>0.6?'#111':'#fff'}" letter-spacing="2">NATIONAL</text>`;
  } else if (cond==='her'){
    const stock = par && par.fin==='stock' ? (par.run? '#b98c4a' : '#d9c9a3') : '#efe6cf';
    body = `<rect width="250" height="350" fill="${stock}"/>
      <rect x="18" y="18" width="214" height="252" rx="16" fill="${shade(c2,0.35)}" stroke="${shade(stock,-0.35)}" stroke-width="2"/>
      <svg x="18" y="14" width="214" height="256" viewBox="0 0 250 300"><g opacity=".92">${figSvg}</g></svg>
      <rect x="18" y="18" width="214" height="252" rx="16" fill="none" stroke="#fff" stroke-width="5" opacity=".6"/>
      <text x="30" y="46" font-family="Georgia,serif" font-style="italic" font-weight="700" font-size="24" fill="${c1}">${esc(T[1])}</text>
      <text x="125" y="300" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="19" fill="#2b2016" letter-spacing="1">${esc(name.toUpperCase())}</text>
      <line x1="40" y1="310" x2="210" y2="310" stroke="${c1}" stroke-width="2"/>
      <text x="125" y="328" text-anchor="middle" font-family="Georgia,serif" font-size="12" fill="#4a3b2a">${esc(T[0])} · ${p.pos}</text>
      <circle cx="210" cy="244" r="17" fill="${c1}" stroke="#fff" stroke-width="2"/><text x="210" y="249" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="12" fill="#fff">${posTxt}</text>`;
  } else if (cond==='vel'){
    const edge = pf || `url(#fo${uid})`;
    body = `<rect width="250" height="350" fill="${edge}"/>
      <rect x="8" y="8" width="234" height="334" rx="6" fill="#16191d"/>
      <g opacity=".55">${[0,1,2,3,4,5].map(i=>`<path d="M${-40+i*60} 350 L${120+i*60} 0 L${132+i*60} 0 L${-28+i*60} 350Z" fill="${i%2?c1:shade(c1,0.3)}" opacity="${0.25+0.1*(i%3)}"/>`).join('')}</g>
      <svg x="8" y="8" width="234" height="334" viewBox="0 0 250 350">${figSvg}</svg>
      <rect x="8" y="8" width="40" height="334" fill="${edge}" opacity=".92"/>
      <text transform="translate(36,330) rotate(-90)" ${F} font-weight="800" font-size="24" fill="#16191d" textLength="${Math.min(300,name.length*13)}" lengthAdjust="spacingAndGlyphs">${esc(name.toUpperCase())}</text>
      <text x="236" y="332" text-anchor="end" ${F} font-weight="700" font-size="13" fill="#fff" opacity=".85">${esc(T[1].toUpperCase())}</text>
      <text x="236" y="30" text-anchor="end" ${F} font-style="italic" font-weight="800" font-size="16" fill="#fff" opacity=".9">VELOCITY</text>`;
  } else if (cond==='spr'){
    const edge = pf || '#f6f7f8';
    body = `<rect width="250" height="350" fill="${edge}"/>
      <rect x="10" y="10" width="230" height="330" rx="4" fill="#fdfdfd"/>
      <path d="M10 120 L70 40 L105 80 L150 20 L240 110 L240 10 L10 10 Z" fill="${c1}"/>
      <path d="M150 20 L168 40 L156 38 L150 48 L140 36 Z" fill="#fff" opacity=".8"/>
      <rect x="10" y="10" width="230" height="330" fill="url(#tint${uid})" opacity="${par&&par.run?0.8:0}"/>
      <svg x="10" y="10" width="230" height="300" viewBox="0 0 250 330">${figSvg}</svg>
      <rect x="10" y="286" width="230" height="54" fill="${edge==='#f6f7f8'?c2:edge}"/>
      <text x="125" y="312" text-anchor="middle" ${F} font-weight="800" font-size="22" fill="${lum(edge==='#f6f7f8'?c2:(par?par.col:'#888'))>0.6?'#111':'#fff'}" textLength="${Math.min(210,name.length*12)}" lengthAdjust="spacingAndGlyphs">${esc(name.toUpperCase())}</text>
      <text x="125" y="330" text-anchor="middle" ${F} font-weight="600" font-size="12" fill="${lum(edge==='#f6f7f8'?c2:(par?par.col:'#888'))>0.6?'#111':'#fff'}" opacity=".85">${esc(TEAMS_DEF[p.org]?TEAMS_DEF[p.org][1].toUpperCase():'')} ORGANIZATION</text>`;
  } else if (cond==='lux'){
    const gold = pf && par.fin!=='super' ? pf : `url(#su${uid})`;
    body = `<rect width="250" height="350" fill="#0d0d0f"/>
      <rect x="10" y="10" width="230" height="330" rx="3" fill="none" stroke="${gold}" stroke-width="3"/>
      <rect x="18" y="18" width="214" height="200" fill="${shade(c1,-0.45)}"/>
      <svg x="18" y="10" width="214" height="208" viewBox="0 0 250 250"><g>${figSvg}</g></svg>
      <rect x="18" y="18" width="214" height="200" fill="none" stroke="${gold}" stroke-width="1.5"/>
      <text x="125" y="${d.auto?290:258}" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="20" fill="${gold}" letter-spacing="1.5">${esc(name.toUpperCase())}</text>
      <text x="125" y="${d.auto?308:278}" text-anchor="middle" font-family="Georgia,serif" font-size="11" fill="#bfae7a" letter-spacing="2">${esc(T[0].toUpperCase())}</text>
      <text x="22" y="334" font-family="Georgia,serif" font-size="10" fill="#bfae7a" letter-spacing="3">SUMMIT LUXE</text>`;
  } else if (cond==='ins'){
    const ins = br.ins[+d.sec.slice(1)];
    const bg = shade(c1,-0.2);
    body = `<rect width="250" height="350" fill="#111"/>
      <g opacity=".9">${Array.from({length:14},(_,i)=>`<path d="M125 200 L${125+300*Math.cos(i/14*Math.PI*2)} ${200+300*Math.sin(i/14*Math.PI*2)} L${125+300*Math.cos((i+0.5)/14*Math.PI*2)} ${200+300*Math.sin((i+0.5)/14*Math.PI*2)} Z" fill="${i%2?bg:shade(c2,-0.1)}"/>`).join('')}</g>
      <svg x="0" y="20" width="250" height="330" viewBox="0 0 250 350">${figSvg}</svg>
      <rect x="0" y="0" width="250" height="56" fill="#111" opacity=".85"/>
      <text x="125" y="38" text-anchor="middle" ${F} font-weight="800" font-style="italic" font-size="26" fill="#f4d35e" textLength="${Math.min(226,ins.n.length*14)}" lengthAdjust="spacingAndGlyphs">${esc(ins.n.toUpperCase())}</text>
      <rect x="0" y="302" width="250" height="48" fill="#111" opacity=".85"/>
      <text x="125" y="332" text-anchor="middle" ${F} font-weight="700" font-size="20" fill="#fff">${esc(name)}</text>
      <rect x="4" y="4" width="242" height="342" rx="8" fill="none" stroke="${pf||'#f4d35e'}" stroke-width="3"/>`;
  } else if (cond==='case'){
    body = `<rect width="250" height="350" fill="#10131a"/>
      ${Array.from({length:22},(_,i)=>{ const r=mkRng(i*31+hsh(key)); const x=r()*250,y=r()*350; return `<path d="M${x} ${y} l${30+r()*50} ${-20-r()*40} l${20+r()*30} ${40+r()*60} Z" fill="${['#3c7dd9','#9b59d0','#20b2aa','#e84393','#f4d35e'][i%5]}" opacity="${0.25+r()*0.35}"/>`; }).join('')}
      <svg x="0" y="10" width="250" height="330" viewBox="0 0 250 350">${figSvg}</svg>
      <path d="M0 290 L250 270 L250 350 L0 350Z" fill="#0a0c10" opacity=".9"/>
      <text x="125" y="318" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="19" fill="#f4e3a1" letter-spacing="1">${esc(name.toUpperCase())}</text>
      <text x="125" y="336" text-anchor="middle" font-family="Georgia,serif" font-size="10" fill="#bfc6d6" letter-spacing="3">${esc(br.caseHit.n.toUpperCase())}</text>
      <rect x="5" y="5" width="240" height="340" rx="8" fill="none" stroke="url(#su${uid})" stroke-width="4"/>`;
  }
  const svg = `<svg viewBox="0 0 250 350" xmlns="http://www.w3.org/2000/svg" class="cardsvg" role="img" aria-label="${esc(name+' '+yr+' '+br.name+' '+d.title)}">${defs(uid, par, c1)}<g clip-path="url(#cp${uid})">${body}${tint}${refr}${relic}${autoBox}${rc}${first}${serialTxt}</g></svg>`;
  SVGC.set(ck, svg); if (SVGC.size>600) SVGC.delete(SVGC.keys().next().value);
  return svg;
}
function cardBack(key, serial){
  const d=D(key), p=P(d.pid), br=B(d.prod), yr=d.prod.yr;
  const car = p.car[yr-1]; const T=TEAMS_DEF[(car&&car.t>=0)?car.t:(p.tm>=0?p.tm:p.org)]||TEAMS_DEF[0];
  const hit=isPitcher(p);
  const hdr = hit? ['YR','TM','W','L','ERA','K'] : ['YR','TM','AVG','HR','RBI','SB'];
  const rows=[]; for (let y=yr-4;y<yr;y++){ const c=p.car[y]; if(!c) continue; const s=c.s; rows.push(hit? [y, teamAbbr(c.t), s[3], s[4], s[2]? (s[6]*27/s[2]).toFixed(2):'—', s[5]] : [y, teamAbbr(c.t), s[1]?(s[2]/s[1]).toFixed(3).replace(/^0/,''):'—', s[3], s[4], s[5]]); }
  const F='font-family="Barlow Condensed,Arial Narrow,sans-serif"';
  const stock = br.tmpl==='her'? '#e3d6b4' : br.tmpl==='vel'||br.tmpl==='lux' ? '#2a2e33' : '#d9dcd6';
  const ink = br.tmpl==='vel'||br.tmpl==='lux' ? '#e8e8e8' : '#1c1f22';
  const bio = d.first ? `Signed with the ${TEAMS_DEF[p.org][1]} organization. ${p.pos}, age ${yr-p.by}.` : !rows.length ? (d.rc? `Rookie ${p.pos} for the ${T[1]}. Debut season ${p.dy}.` : `${p.pos}. Retired ${p.ry||''}. One of the enduring names of his era.`) : `${p.pos} · Age ${yr-p.by} · Pro since ${p.dy||'—'}`;
  return `<svg viewBox="0 0 250 350" xmlns="http://www.w3.org/2000/svg" class="cardsvg">
    <rect width="250" height="350" rx="10" fill="${stock}"/>
    <rect x="12" y="12" width="226" height="54" rx="4" fill="${T[3]}"/>
    <text x="22" y="36" ${F} font-weight="800" font-size="20" fill="#fff">${esc(pname(p).toUpperCase())}</text>
    <text x="22" y="56" ${F} font-size="13" fill="#fff" opacity=".85">${esc(T[0]+' '+T[1])}</text>
    <circle cx="214" cy="39" r="17" fill="#fff"/><text x="214" y="45" text-anchor="middle" ${F} font-weight="800" font-size="15" fill="${T[3]}">${esc(d.cardNo)}</text>
    <text x="16" y="88" ${F} font-size="12.5" fill="${ink}">${esc(bio)}</text>
    <g ${F} font-size="13" fill="${ink}">
      ${hdr.map((h,i)=>`<text x="${18+i*38}" y="118" font-weight="700">${h}</text>`).join('')}
      <line x1="16" y1="124" x2="234" y2="124" stroke="${ink}" stroke-width=".8" opacity=".5"/>
      ${rows.map((r,ri)=>r.map((v,i)=>`<text x="${18+i*38}" y="${144+ri*20}">${v}</text>`).join('')).join('')}
      ${rows.length?'':`<text x="18" y="148" opacity=".7">${d.first?'Minor league statistics not shown.':'No major league statistics.'}</text>`}
    </g>
    <text x="16" y="300" ${F} font-size="11" fill="${ink}" opacity=".75">${esc(d.setName)}${d.parObj?' · '+esc(d.parObj.n):''}${d.run?' · Numbered to '+d.run:''}</text>
    <text x="16" y="330" ${F} font-size="10" fill="${ink}" opacity=".6">© ${yr} ${esc(br.name)} Card Co. A fictional product.</text>
  </svg>`;
}
function slabSVG(card){
  const d=D(card.k), p=P(d.pid);
  const g=card.g; const title=(d.prod.yr+' '+B(d.prod).name).toUpperCase();
  const F='font-family="Barlow Condensed,Arial Narrow,sans-serif"';
  const cf = cardFront(card.k, card.s); const inner = `<g transform="translate(22 92) scale(0.904)">${cf.slice(cf.indexOf('>')+1, cf.lastIndexOf('</svg>'))}</g>`;
  return `<svg viewBox="0 0 270 430" xmlns="http://www.w3.org/2000/svg" class="cardsvg slab">
    <rect x="2" y="2" width="266" height="426" rx="12" fill="#dfe5ea" stroke="#b6c0c8" stroke-width="2"/>
    <rect x="10" y="10" width="250" height="72" rx="5" fill="#fff" stroke="#9aa6b0"/>
    <rect x="10" y="10" width="44" height="72" rx="5" fill="#b3261e"/><text x="32" y="52" text-anchor="middle" ${F} font-weight="800" font-size="17" fill="#fff" transform="rotate(-90 32 46)">GCS</text>
    <text x="62" y="30" ${F} font-size="11.5" fill="#222">${esc(title)} #${esc(d.cardNo)}</text>
    <text x="62" y="49" ${F} font-weight="800" font-size="16" fill="#111">${esc(pname(p).toUpperCase())}</text>
    <text x="62" y="66" ${F} font-size="11.5" fill="#333">${esc(d.title.toUpperCase())}${card.s&&d.run?' '+card.s+'/'+d.run:''}${d.auto?' AUTO':''}</text>
    <text x="62" y="78" ${F} font-size="9" fill="#666">CERT ${card.cert||''}</text>
    <text x="248" y="50" text-anchor="end" ${F} font-weight="800" font-size="34" fill="#111">${g}</text>
    <text x="248" y="70" text-anchor="end" ${F} font-weight="700" font-size="11" fill="#b3261e">${GRADE_NAMES[g]}</text>
    <rect x="18" y="88" width="234" height="324" rx="6" fill="#c9d2d9"/>
    ${inner}
  </svg>`;
}
function packArt(prod, fmt){
  const br=B(prod); const T = { dia:['#12324f','#c9a227'], nat:['#1f6fb2','#f2c230'], her:['#7a2d22','#efe6cf'], spr:['#1b4d3e','#e7f0ec'], vel:['#16191d','#9fb3c8'], lux:['#0d0d0f','#c9a227'] }[br.tmpl] || ['#333','#ccc'];
  const [a,b]=T; const F='font-family="Barlow Condensed,Arial Narrow,sans-serif"';
  if (fmt!=='pack'){
    return `<svg viewBox="0 0 300 220" xmlns="http://www.w3.org/2000/svg" class="boxsvg">
      <path d="M20 60 L150 20 L280 60 L150 100 Z" fill="${shade(a,0.25)}"/>
      <path d="M20 60 L150 100 L150 205 L20 165 Z" fill="${a}"/>
      <path d="M280 60 L150 100 L150 205 L280 165 Z" fill="${shade(a,-0.3)}"/>
      <text x="85" y="128" text-anchor="middle" ${F} font-weight="800" font-size="20" fill="${b}" transform="skewY(17) translate(0,-26)">${esc(br.short.toUpperCase())}</text>
      <text x="85" y="150" text-anchor="middle" ${F} font-weight="600" font-size="13" fill="#fff" transform="skewY(17) translate(0,-26)">${prod.yr} BASEBALL</text>
      <text x="215" y="126" text-anchor="middle" ${F} font-weight="700" font-size="13" fill="#fff" opacity=".8" transform="skewY(-17) translate(0,70)">${esc(FMT_NAME[fmt].toUpperCase())}</text>
    </svg>`;
  }
  return `<svg viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg" class="packsvg">
    <defs><linearGradient id="pk${prod.id}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${shade(a,-0.2)}"/><stop offset=".35" stop-color="${shade(a,0.18)}"/><stop offset=".55" stop-color="${a}"/><stop offset="1" stop-color="${shade(a,-0.3)}"/></linearGradient></defs>
    <g class="pk-top"><path d="M10 6 ${Array.from({length:18},(_,i)=>`L${10+(i+0.5)*10} ${i%2?6:0} L${10+(i+1)*10} 6`).join(' ')} L190 28 L10 28 Z" fill="${shade(a,-0.15)}"/>
    <rect x="10" y="20" width="180" height="10" fill="${b}" opacity=".85"/></g>
    <g class="pk-body"><rect x="10" y="30" width="180" height="250" fill="url(#pk${prod.id})"/>
    <path d="M10 280 ${Array.from({length:18},(_,i)=>`L${10+(i+0.5)*10} ${i%2?280:286} L${10+(i+1)*10} 280`).join(' ')}" fill="${shade(a,-0.15)}"/>
    <text x="100" y="120" text-anchor="middle" ${F} font-weight="800" font-size="34" fill="${b}">${esc(br.short.toUpperCase())}</text>
    <text x="100" y="146" text-anchor="middle" ${F} font-weight="600" font-size="16" fill="#fff" letter-spacing="3">${prod.yr} BASEBALL</text>
    <rect x="40" y="170" width="120" height="1.5" fill="${b}"/>
    <text x="100" y="196" text-anchor="middle" ${F} font-size="13" fill="#fff" opacity=".8">${br.formats[fmt]? br.formats[fmt].cards : ''} CARDS</text>
    <path d="M26 30 L60 30 L20 280 L10 280 L10 30 Z" fill="#fff" opacity=".08"/></g>
  </svg>`;
}
function thumbHTML(card, cls){
  const inner = card.g>0 ? slabSVG(card) : cardFront(card.k, card.s);
  return `<div class="thumb ${cls||''} ${card.g>0?'is-slab':''}">${inner}</div>`;
}
