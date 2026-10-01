// ===================== COVERS: a cover system for every publisher =====================
// A cover is chosen by what happens in the issue first (a death, a return, a debut, an anniversary),
// then by a per-series shuffle of the genre's compositions, then varied by palette, framing and background.
const GPAL = {
  hero:[['#101a3a','#e63946','#f2c230'],['#0b3d2e','#f4a261','#e9f5db'],['#2b0f3a','#f72585','#4cc9f0'],['#1d1d1d','#ffba08','#e5e5e5'],['#0d1b2a','#e0e1dd','#e63946'],['#3a0ca3','#ffd60a','#f1faee']],
  scifi:[['#050a1f','#5bc0be','#e0fbfc'],['#1a0933','#ff9e00','#e9d8fd'],['#001219','#94d2bd','#ee9b00'],['#0b090a','#e5383b','#d3d3d3']],
  fantasy:[['#0d2226','#caa24a','#efe8d2'],['#2d1e2f','#8fbc8f','#f4ecd8'],['#14213d','#fca311','#e5e5e5'],['#3d0c11','#d4a373','#faedcd']],
  horror:[['#120a0c','#b3122e','#efe4c8'],['#0b1a0f','#8ac926','#e9edc9'],['#10002b','#ff6d00','#e0aaff'],['#1b1b1b','#e9d8a6','#9b2226']],
  crime:[['#0f1115','#e8b923','#f2ecdc'],['#1d2d44','#cf5c36','#f0ebd8'],['#111','#e63946','#f1faee'],['#2b2d42','#8d99ae','#edf2f4']],
  western:[['#582f0e','#e76f51','#ffe6a7'],['#6f1d1b','#bb9457','#ffe6a7'],['#283618','#dda15e','#fefae0']],
  romance:[['#ff8fab','#9d0208','#fff0f3'],['#7b2cbf','#ffafcc','#fefae0'],['#e56b6f','#355070','#fff1e6']],
  war:[['#4a5d23','#c2b280','#8b0000'],['#3e3e3e','#d4a373','#e8e8e8'],['#283618','#bc6c25','#fefae0']],
  kids:[['#ffd60a','#00b4d8','#ff006e'],['#90e0ef','#fb8500','#ffb703'],['#caffbf','#ff595e','#1982c4']],
  comedy:[['#ffbe0b','#3a86ff','#fb5607'],['#8ac926','#ff595e','#1982c4'],['#f4f1de','#e07a5f','#3d405b']],
  literary:[['#f5ebe0','#3d405b','#e07a5f'],['#edede9','#1d3557','#e63946'],['#e9edc9','#344e41','#bc6c25']],
  manga:[['#ffffff','#111111','#ef476f'],['#f8f9fa','#212529','#4361ee'],['#fff','#111','#ffbe0b']],
  alt:[['#f6f1e7','#1a1a1a','#d62828'],['#e9e3d5','#2b2b2b','#6a994e'],['#fcf6bd','#222','#ff006e']],
  exp:[['#ffffff','#000000','#e63946'],['#f1f1f1','#1a1a1a','#ffd400'],['#000','#fff','#00b4d8']]
};
const GFAM = {hero:'hero',scifi:'scifi',fantasy:'fantasy',horror:'horror',crime:'crime',mystery:'crime',thriller:'crime',western:'western',romance:'romance',comedy:'comedy',satire:'comedy',slice:'literary',literary:'literary',historical:'war',war:'war',adventure:'fantasy',ya:'hero',kids:'kids',anthology:'horror',exp:'exp',alt:'alt',manga:'manga'};
const GTPL = {
  hero:['hero','flight','punch','city','lineup','portrait','face','crowd','ruins','space','chase','speed'],
  scifi:['space','ship','hero','eye','portrait','ruins','city','flight'],
  fantasy:['dragon','castle','land','loom','portrait','hero','ruins','ship'],
  horror:['face','door','loom','land','eye','hands','portrait','ruins'],
  crime:['city','door','face','portrait','chase','eye','hands'],
  western:['duel','land','portrait','chase','ruins'],
  romance:['couple','portrait','city','land'],
  war:['planes','tank','portrait','ship','ruins'],
  kids:['mascot','mascot2','land','crowd','ship'],
  comedy:['mascot','mascot2','crowd','city','portrait'],
  literary:['type','portrait','door','land','city','window'],
  manga:['speed','portrait','hero','flight','crowd'],
  alt:['scrawl','portrait','type','crowd'],
  exp:['geo','type','eye','geo2']
};
function shuffleWith(arr, seed){ const a=arr.slice(), r=mkRng(seed); for (let i=a.length-1;i>0;i--){ const j=Math.floor(r()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
// ---------- characters look the same every time they show up ----------
const HAIR=['#1b1b1b','#3b2416','#6b3e1f','#c68642','#e8c07a','#b44527','#8c8c8c','#f2f2f2'];
function charLook(c, g){
  const h=hsh('look'+c.id); const r=mkRng(h); const hero = g===GI.hero || c.civ;
  const cols=['#d62828','#1d3557','#2a9d8f','#f4a261','#6a4c93','#e9c46a','#264653','#ff006e','#3a86ff','#8ac926','#111','#f1faee'];
  return { hero, c1:cols[h%cols.length], c2:cols[(h>>4)%cols.length]===cols[h%cols.length]?'#f2c230':cols[(h>>4)%cols.length], cape:hero && r()<0.55, mask:hero && r()<0.7, emb:Math.floor(r()*6), hair:HAIR[Math.floor(r()*HAIR.length)], skin:['#f1c7a3','#e0ac7e','#c68642','#8d5524','#5c3a21','#f6d7b0'][Math.floor(r()*6)], coat: !hero && r()<0.5, hat: !hero && r()<0.3, long: r()<0.4 };
}
function emblem(L, x, y, s){ const e=L.emb; const c=L.c2;
  return `<g transform="translate(${x} ${y}) scale(${s})">${e===0?`<circle r="8" fill="${c}"/>`:e===1?`<path d="M0 -9 L2.6 -3 L9 -3 L4 1.5 L6 8 L0 4 L-6 8 L-4 1.5 L-9 -3 L-2.6 -3 Z" fill="${c}"/>`:e===2?`<path d="M-3 -9 L5 -2 L0 -1 L4 9 L-5 0 L0 -1 Z" fill="${c}"/>`:e===3?`<path d="M0 -9 L8 0 L0 9 L-8 0 Z" fill="${c}"/>`:e===4?`<path d="M-10 -2 Q0 -10 10 -2 Q4 0 0 6 Q-4 0 -10 -2 Z" fill="${c}"/>`:`<path d="M-8 -8 H8 V2 Q8 8 0 10 Q-8 8 -8 2 Z" fill="${c}"/>`}</g>`; }
function heroFig(L, pose, x, y, s, flip){
  // a comic-art figure: bold outline, costume colours, optional cape and mask
  const K='#0b0b0b'; const c1=L.hero?L.c1:(L.coat?'#3b3b3b':L.c1), c2=L.hero?L.c2:'#2a2a2a';
  const P = {stand:[[-26,52],[26,52],[-14,120],[14,120],-8], fly:[[-60,-10],[40,34],[-10,110],[30,96],60], punch:[[-30,50],[62,8],[-24,118],[18,120],-4], fall:[[-40,80],[34,70],[-30,116],[22,120],24], burst:[[-58,-6],[58,-6],[-22,118],[22,118],0], crouch:[[-30,60],[30,64],[-30,96],[30,96],12]}[pose]||[[-26,52],[26,52],[-14,120],[14,120],0];
  const [lh, rh, lf, rf, tilt] = P;
  const limb=(ax,ay,bx,by,w,col)=>`<path d="M${ax} ${ay} L${bx} ${by}" stroke="${K}" stroke-width="${w+4}" stroke-linecap="round"/><path d="M${ax} ${ay} L${bx} ${by}" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>`;
  let o='';
  if (L.cape) o += `<path d="M-16 18 Q${-40-tilt} 90 ${-30-tilt} 128 L${30-tilt} 128 Q${40-tilt} 90 16 18 Z" fill="${c2}" stroke="${K}" stroke-width="2"/>`;
  o += limb(-10,68,lf[0],lf[1],13,c1)+limb(10,68,rf[0],rf[1],13,c1);
  o += `<ellipse cx="${lf[0]}" cy="${lf[1]+4}" rx="9" ry="5" fill="${L.hero?c2:K}"/><ellipse cx="${rf[0]}" cy="${rf[1]+4}" rx="9" ry="5" fill="${L.hero?c2:K}"/>`;
  o += `<path d="M-20 14 Q0 6 20 14 L16 72 Q0 78 -16 72 Z" fill="${c1}" stroke="${K}" stroke-width="2.5"/>${L.hero?emblem(L,0,34,1):''}${L.hero?`<path d="M-16 64 H16" stroke="${c2}" stroke-width="5"/>`:''}`;
  o += limb(-18,20,lh[0],lh[1],11,L.hero?c1:c1)+limb(18,20,rh[0],rh[1],11,c1);
  o += `<circle cx="${lh[0]}" cy="${lh[1]}" r="6" fill="${L.hero?c2:L.skin}" stroke="${K}" stroke-width="1.5"/><circle cx="${rh[0]}" cy="${rh[1]}" r="6" fill="${L.hero?c2:L.skin}" stroke="${K}" stroke-width="1.5"/>`;
  o += `<circle cx="0" cy="-4" r="15" fill="${L.skin}" stroke="${K}" stroke-width="2.5"/>`;
  if (L.mask) o += `<path d="M-15 -8 H15 V0 H-15 Z" fill="${c1}"/><path d="M-9 -5 h5 M4 -5 h5" stroke="#fff" stroke-width="2"/>`;
  else o += `<circle cx="-5" cy="-5" r="1.6" fill="${K}"/><circle cx="5" cy="-5" r="1.6" fill="${K}"/>`;
  o += `<path d="M-15 -8 Q-14 -24 0 -22 Q14 -24 15 -8 Q8 -16 0 -15 Q-8 -16 -15 -8 Z" fill="${L.mask&&L.hero?c1:L.hair}" stroke="${K}" stroke-width="1.5"/>`;
  if (L.hat) o += `<path d="M-20 -12 H20 L14 -16 V-26 H-14 V-16 Z" fill="#222"/>`;
  return `<g transform="translate(${x} ${y}) scale(${flip?-s:s} ${s}) rotate(${tilt/3})">${o}</g>`;
}
function bust(L, x, y, s){ const K='#0b0b0b'; return `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-60 90 Q-58 30 0 26 Q58 30 60 90 Z" fill="${L.hero?L.c1:(L.coat?'#3b3b3b':L.c1)}" stroke="${K}" stroke-width="3"/>${L.hero?emblem(L,0,58,2):''}<rect x="-10" y="10" width="20" height="20" fill="${L.skin}" stroke="${K}" stroke-width="2"/><ellipse cx="0" cy="-8" rx="28" ry="34" fill="${L.skin}" stroke="${K}" stroke-width="3"/><path d="M0 -30 Q30 -26 26 6 Q10 10 0 8 Z" fill="#000" opacity=".22"/>${L.mask?`<path d="M-28 -16 H28 V-2 H-28 Z" fill="${L.c1}" stroke="${K}" stroke-width="2"/><path d="M-16 -9 h9 M7 -9 h9" stroke="#fff" stroke-width="3"/>`:`<circle cx="-10" cy="-8" r="3" fill="${K}"/><circle cx="10" cy="-8" r="3" fill="${K}"/>`}<path d="M-8 14 q8 4 16 0" stroke="${K}" stroke-width="2.5" fill="none"/><path d="M-30 -14 Q-28 ${L.long?20:-44} 0 -44 Q28 ${L.long?-44:-44} 30 ${L.long?24:-14} Q14 -30 0 -30 Q-14 -30 -30 -14 Z" fill="${L.mask&&L.hero?L.c1:L.hair}" stroke="${K}" stroke-width="2"/></g>`; }
// ---------- compositions ----------
function scene(tpl, r, P, W, H, L, L2, flip){
  const [ink, acc, paper] = P; const K='#0b0b0b'; let o='';
  const burst=(cx,cy,col,op)=>Array.from({length:16},(_,i)=>`<path d="M${cx} ${cy} L${(cx+Math.cos(i/16*6.283)*420).toFixed(0)} ${(cy+Math.sin(i/16*6.283)*420).toFixed(0)} L${(cx+Math.cos((i+0.5)/16*6.283)*420).toFixed(0)} ${(cy+Math.sin((i+0.5)/16*6.283)*420).toFixed(0)} Z" fill="${col}" opacity="${op}"/>`).join('');
  const skyline=(y,col)=>{ let x=-5,p=''; while(x<W+10){ const w=14+r()*26, h=30+r()*90; p+=`<rect x="${x.toFixed(0)}" y="${(y-h).toFixed(0)}" width="${w.toFixed(0)}" height="${(h+400).toFixed(0)}" fill="${col}"/>`; x+=w+1; } return p; };
  switch(tpl){
    case 'hero': { const bgk=Math.floor(r()*4), pose=['stand','burst','crouch','punch','stand'][Math.floor(r()*5)];
      o=`<rect width="${W}" height="${H}" fill="${bgk===3?acc:ink}"/>`+(bgk===0?burst(W/2,H*0.4,acc,0.18): bgk===1?Array.from({length:40},()=>`<circle cx="${(r()*W).toFixed(0)}" cy="${(r()*H).toFixed(0)}" r="${(r()*1.4).toFixed(1)}" fill="#fff"/>`).join('')+`<circle cx="${W*0.75}" cy="${H*0.2}" r="30" fill="${paper}" opacity=".7"/>`: bgk===2?`<rect y="${H*0.62}" width="${W}" height="${H}" fill="${shade(acc,-0.3)}"/>`: burst(W*(0.2+r()*0.6),H*0.3,paper,0.2))+(bgk!==1?skyline(H,shade(ink,-0.3)):'')+heroFig(L,pose,W*(0.4+r()*0.2),H*(0.3+r()*0.08),1.3+r()*0.4,flip); break; }
    case 'flight': o=`<rect width="${W}" height="${H}" fill="${shade(ink,0.15)}"/>${Array.from({length:10},()=>`<path d="M${(r()*W).toFixed(0)} ${(r()*H).toFixed(0)} l-60 20" stroke="${paper}" stroke-width="2" opacity=".25"/>`).join('')}${skyline(H,shade(ink,-0.35))}${heroFig(L,'fly',W*0.5,H*0.36,1.3,flip)}`; break;
    case 'punch': o=`<rect width="${W}" height="${H}" fill="${acc}"/>${burst(W*0.66,H*0.36,paper,0.25)}${heroFig(L2||L,'fall',W*0.72,H*0.44,1.1,!flip)}${heroFig(L,'punch',W*0.36,H*0.4,1.35,flip)}<path d="M${W*0.58} ${H*0.3} l14 -10 l-2 12 l14 2 l-12 8 l8 12 l-14 -6 l-4 12 l-4 -14 Z" fill="${paper}" stroke="${K}" stroke-width="2"/>`; break;
    case 'lineup': o=`<rect width="${W}" height="${H}" fill="${ink}"/>${burst(W/2,H*0.2,acc,0.2)}${[0,1,2,3].map(i=>heroFig(i===1?L:charLook({id:(L.seed||1)*7+i},GI.hero),'stand',W*(0.18+i*0.22),H*(0.42+(i%2)*0.04),0.9,i%2)).join('')}`; break;
    case 'crowd': o=`<rect width="${W}" height="${H}" fill="${paper}"/>${Array.from({length:12},(_,i)=>`<circle cx="${(r()*W).toFixed(0)}" cy="${(H*0.55+r()*H*0.4).toFixed(0)}" r="${(16+r()*12).toFixed(0)}" fill="${[acc,ink,shade(acc,0.3)][i%3]}" stroke="${K}" stroke-width="2"/>`).join('')}${heroFig(L,'burst',W/2,H*0.3,1.2,flip)}`; break;
    case 'ruins': o=`<rect width="${W}" height="${H}" fill="${shade(acc,-0.4)}"/><circle cx="${W*0.7}" cy="${H*0.25}" r="40" fill="${paper}" opacity=".6"/>${Array.from({length:6},(_,i)=>`<path d="M${i*38} ${H} V${H*(0.55+r()*0.2)} l14 -12 l6 16 l10 -4 V${H}" fill="${shade(ink,0.1)}"/>`).join('')}${heroFig(L,'crouch',W*0.5,H*0.52,1.1,flip)}`; break;
    case 'space': o=`<rect width="${W}" height="${H}" fill="${ink}"/>${Array.from({length:50},()=>`<circle cx="${(r()*W).toFixed(0)}" cy="${(r()*H).toFixed(0)}" r="${(r()*1.3+0.2).toFixed(1)}" fill="#fff"/>`).join('')}<circle cx="${W*(0.25+r()*0.5)}" cy="${H*0.62}" r="${60+r()*30}" fill="${acc}"/><ellipse cx="${W*0.5}" cy="${H*0.62}" rx="120" ry="18" fill="none" stroke="${paper}" stroke-width="3" transform="rotate(${-20+r()*40} ${W/2} ${H*0.62})"/>${heroFig(L,'fly',W*0.5,H*0.26,0.9,flip)}`; break;
    case 'ship': o=`<rect width="${W}" height="${H}" fill="${shade(ink,0.1)}"/><rect y="${H*0.62}" width="${W}" height="${H}" fill="${shade(acc,-0.3)}"/>${Array.from({length:8},(_,i)=>`<path d="M0 ${H*0.64+i*14} q25 -6 50 0 t50 0 t50 0 t50 0" stroke="${paper}" fill="none" opacity=".25"/>`).join('')}<path d="M${W*0.2} ${H*0.6} H${W*0.8} L${W*0.7} ${H*0.7} H${W*0.3} Z" fill="${K}"/><path d="M${W*0.5} ${H*0.6} V${H*0.18} L${W*0.78} ${H*0.52} Z" fill="${paper}" stroke="${K}" stroke-width="2"/><path d="M${W*0.48} ${H*0.6} V${H*0.24} L${W*0.26} ${H*0.54} Z" fill="${shade(paper,-0.1)}" stroke="${K}" stroke-width="2"/>`; break;
    case 'dragon': o=`<rect width="${W}" height="${H}" fill="${ink}"/><circle cx="${W*0.7}" cy="${H*0.25}" r="36" fill="${acc}" opacity=".8"/><path d="M${W*0.1} ${H*0.3} Q${W*0.5} ${H*0.05} ${W*0.9} ${H*0.3} Q${W*0.6} ${H*0.24} ${W*0.5} ${H*0.38} Q${W*0.4} ${H*0.24} ${W*0.1} ${H*0.3} Z" fill="${K}"/><path d="M${W*0.5} ${H*0.36} q-10 30 10 60 q16 20 -6 44" stroke="${K}" stroke-width="12" fill="none" stroke-linecap="round"/><path d="M0 ${H*0.84} L${W*0.3} ${H*0.66} L${W*0.55} ${H*0.8} L${W*0.8} ${H*0.62} L${W} ${H*0.78} V${H} H0 Z" fill="${shade(ink,-0.3)}"/>${heroFig(L,'stand',W*0.3,H*0.62,0.6,flip)}`; break;
    case 'castle': o=`<rect width="${W}" height="${H}" fill="${shade(acc,-0.3)}"/><circle cx="${W*0.3}" cy="${H*0.22}" r="30" fill="${paper}" opacity=".8"/><path d="M${W*0.35} ${H*0.8} V${H*0.4} h14 v-10 h8 v10 h14 V${H*0.3} l16 -20 l16 20 V${H*0.8} Z" fill="${K}"/><rect x="${W*0.48}" y="${H*0.5}" width="8" height="12" fill="${acc}"/><path d="M0 ${H*0.8} Q${W/2} ${H*0.74} ${W} ${H*0.8} V${H} H0 Z" fill="${shade(ink,-0.2)}"/>${heroFig(L,'stand',W*0.72,H*0.66,0.7,true)}`; break;
    case 'duel': o=`<rect width="${W}" height="${H}" fill="${acc}"/><circle cx="${W/2}" cy="${H*0.5}" r="60" fill="${paper}" opacity=".6"/><rect y="${H*0.62}" width="${W}" height="${H}" fill="${shade(acc,-0.35)}"/>${heroFig(L,'stand',W*0.26,H*0.52,0.9,false)}${heroFig(L2||L,'stand',W*0.76,H*0.54,0.8,true)}`; break;
    case 'chase': o=`<rect width="${W}" height="${H}" fill="${ink}"/>${Array.from({length:14},()=>`<path d="M${(r()*W).toFixed(0)} ${(H*0.4+r()*H*0.5).toFixed(0)} l-70 0" stroke="${acc}" stroke-width="2" opacity=".4"/>`).join('')}<path d="M${W*0.2} ${H*0.66} h${W*0.5} l12 -20 h-30 l-10 -16 h-40 l-14 16 h-18 Z" fill="${acc}" stroke="${K}" stroke-width="2"/><circle cx="${W*0.3}" cy="${H*0.67}" r="10" fill="${K}"/><circle cx="${W*0.62}" cy="${H*0.67}" r="10" fill="${K}"/>${heroFig(L,'punch',W*0.76,H*0.3,0.8,true)}`; break;
    case 'couple': o=`<rect width="${W}" height="${H}" fill="${ink}"/><path d="M${W/2} ${H*0.8} C${W*0.05} ${H*0.5} ${W*0.2} ${H*0.18} ${W/2} ${H*0.36} C${W*0.8} ${H*0.18} ${W*0.95} ${H*0.5} ${W/2} ${H*0.8} Z" fill="${paper}" opacity=".35"/>${bust(L,W*0.36,H*0.46,0.95)}${bust(L2||L,W*0.66,H*0.5,0.9)}`; break;
    case 'planes': o=`<rect width="${W}" height="${H}" fill="${paper}"/><rect y="${H*0.7}" width="${W}" height="${H}" fill="${acc}"/>${[0,1,2].map(i=>`<g transform="translate(${W*(0.25+i*0.25)} ${H*(0.25+i*0.12)}) rotate(${-10+i*8}) scale(${1-i*0.2})"><path d="M-50 0 L50 -3 L56 0 L50 3 Z" fill="${ink}"/><path d="M-6 -2 L-24 -34 L-12 -34 L10 -2 Z M-6 2 L-24 34 L-12 34 L10 2 Z" fill="${ink}"/></g>`).join('')}${Array.from({length:6},()=>`<circle cx="${(r()*W).toFixed(0)}" cy="${(H*0.7+r()*20).toFixed(0)}" r="${(10+r()*14).toFixed(0)}" fill="#777" opacity=".6"/>`).join('')}`; break;
    case 'tank': o=`<rect width="${W}" height="${H}" fill="${shade(acc,0.3)}"/><rect y="${H*0.66}" width="${W}" height="${H}" fill="${ink}"/><g transform="translate(${W*0.5} ${H*0.62})"><rect x="-60" y="-18" width="120" height="30" rx="8" fill="${shade(ink,0.2)}" stroke="${K}" stroke-width="2"/><rect x="-30" y="-40" width="56" height="24" rx="4" fill="${shade(ink,0.25)}" stroke="${K}" stroke-width="2"/><path d="M20 -30 L90 -44" stroke="${K}" stroke-width="7"/>${[-44,-22,0,22,44].map(x=>`<circle cx="${x}" cy="10" r="8" fill="${K}"/>`).join('')}</g>${heroFig(L,'crouch',W*0.2,H*0.56,0.6,false)}`; break;
    case 'mascot': case 'mascot2': { const cx=W*(0.35+r()*0.3), cy=H*0.56; o=`<rect width="${W}" height="${H}" fill="${ink}"/>${Array.from({length:14},()=>`<circle cx="${(r()*W).toFixed(0)}" cy="${(r()*H).toFixed(0)}" r="${(4+r()*10).toFixed(0)}" fill="${paper}" opacity=".35"/>`).join('')}<ellipse cx="${cx}" cy="${cy}" rx="52" ry="58" fill="${acc}" stroke="${K}" stroke-width="3"/>${tpl==='mascot'?`<path d="M${cx-38} ${cy-44} l-8 -34 l26 20 Z M${cx+38} ${cy-44} l8 -34 l-26 20 Z" fill="${acc}" stroke="${K}" stroke-width="3"/>`:`<ellipse cx="${cx-30}" cy="${cy-58}" rx="12" ry="30" fill="${acc}" stroke="${K}" stroke-width="3"/><ellipse cx="${cx+30}" cy="${cy-58}" rx="12" ry="30" fill="${acc}" stroke="${K}" stroke-width="3"/>`}<circle cx="${cx-18}" cy="${cy-12}" r="11" fill="#fff" stroke="${K}" stroke-width="2"/><circle cx="${cx+18}" cy="${cy-12}" r="11" fill="#fff" stroke="${K}" stroke-width="2"/><circle cx="${cx-15}" cy="${cy-10}" r="5" fill="${K}"/><circle cx="${cx+21}" cy="${cy-10}" r="5" fill="${K}"/><path d="M${cx-20} ${cy+16} Q${cx} ${cy+36} ${cx+20} ${cy+16}" stroke="${K}" stroke-width="3" fill="#b3122e"/>`; break; }
    case 'speed': o=`<rect width="${W}" height="${H}" fill="#fff"/>${Array.from({length:44},(_,i)=>`<path d="M${W/2} ${H*0.5} L${(W/2+Math.cos(i/44*6.283)*300).toFixed(0)} ${(H*0.5+Math.sin(i/44*6.283)*300).toFixed(0)}" stroke="${acc}" stroke-width="${(0.6+r()*2).toFixed(1)}" opacity=".6"/>`).join('')}${bust(L,W/2,H*0.5,1.1)}`; break;
    case 'scrawl': o=`<rect width="${W}" height="${H}" fill="${ink}"/>${Array.from({length:40},()=>`<path d="M${(r()*W).toFixed(0)} ${(r()*H).toFixed(0)} q${(r()*40-20).toFixed(0)} ${(r()*40-20).toFixed(0)} ${(r()*60-30).toFixed(0)} ${(r()*60-30).toFixed(0)}" stroke="${acc}" stroke-width="2" fill="none"/>`).join('')}${bust(L,W*0.5,H*0.5,1)}`; break;
    case 'geo': case 'geo2': o=`<rect width="${W}" height="${H}" fill="${ink}"/>${Array.from({length:tpl==='geo'?7:14},()=>{ const x=r()*W,y=r()*H,s=16+r()*70; return r()<0.5?`<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="${s.toFixed(0)}" height="${s.toFixed(0)}" fill="${r()<0.5?acc:paper}" transform="rotate(${(r()*60).toFixed(0)} ${x.toFixed(0)} ${y.toFixed(0)})"/>`:`<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(s/2).toFixed(0)}" fill="none" stroke="${r()<0.5?acc:paper}" stroke-width="${(2+r()*6).toFixed(0)}"/>`; }).join('')}`; break;
    case 'window': o=`<rect width="${W}" height="${H}" fill="${paper}"/><rect x="${W*0.2}" y="${H*0.2}" width="${W*0.6}" height="${H*0.5}" fill="${acc}" stroke="${ink}" stroke-width="5"/><path d="M${W/2} ${H*0.2} V${H*0.7} M${W*0.2} ${H*0.45} H${W*0.8}" stroke="${ink}" stroke-width="5"/>${bust(L,W*0.6,H*0.84,0.7)}`; break;
    case 'portrait': o=`<rect width="${W}" height="${H}" fill="${acc}"/><circle cx="${W*(0.4+r()*0.2)}" cy="${H*0.42}" r="${W*0.36}" fill="${shade(acc,0.25)}"/>${bust(L,W*(0.42+r()*0.16),H*0.52,1.15)}`; break;
    default: o=blpArt(tpl, r, P, W, H, null); // face, door, loom, land, eye, city, hands, type
  }
  return o;
}
// ---------- the publisher's mark ----------
function pubMark(s, x, y, sc, col, bg){
  if (s.pub<0) return '';
  const pb=G.cm.pubs[s.pub]; if (pb.sh==='BLP') return BLP_MARK(x,y,sc*0.9,col);
  const h=hsh('mark'+pb.id)%5; const init=pb.sh.replace(/[^A-Z&]/g,'').slice(0,3);
  const shape = h===0?`<circle r="15" fill="${bg}" stroke="${col}" stroke-width="2"/>`: h===1?`<path d="M-14 -15 H14 V4 Q14 14 0 18 Q-14 14 -14 4 Z" fill="${bg}" stroke="${col}" stroke-width="2"/>`: h===2?`<path d="M0 -17 L16 -5 L10 15 H-10 L-16 -5 Z" fill="${bg}" stroke="${col}" stroke-width="2"/>`: h===3?`<rect x="-15" y="-15" width="30" height="30" rx="3" fill="${bg}" stroke="${col}" stroke-width="2"/>`:`<path d="M-16 -10 L-8 -16 L0 -10 L8 -16 L16 -10 V14 H-16 Z" fill="${bg}" stroke="${col}" stroke-width="2"/>`;
  return `<g transform="translate(${x} ${y}) scale(${sc})">${shape}<text y="${init.length>2?3.5:4.5}" text-anchor="middle" ${VF} font-weight="800" font-size="${init.length>2?10:13}" fill="${col}">${esc(init)}</text></g>`;
}
// ---------- cover words ----------
function blurbFor(ks, s, n, yr, r){
  const nm=id=>CH_(id).n.toUpperCase();
  for (const k of ks){ if (k[1]==='dth') return `THE DEATH OF ${nm(k[2])}!`; if (k[1]==='ret') return `${nm(k[2])} RETURNS!`; if (k[1]==='team') return `INTRODUCING ${nm(k[2])}!`; if (k[1]==='fa' && n>1) return yr<1990? `INTRODUCING ${nm(k[2])}!` : 'WHO IS '+nm(k[2])+'?'; if (k[1]==='ori') return `THE ORIGIN OF ${nm(k[2])}!`; if (k[1]==='cos') return `A NEW LOOK FOR ${nm(k[2])}!`; if (k[1]==='ann') return `GIANT ${n}TH ISSUE!`; if (k[1]==='fin') return s.sts==='cx'&&yr<2000? 'FINAL ISSUE!' : 'THE FINAL CHAPTER'; if (k[1]==='arc') return yr<1990? 'A NEW SAGA BEGINS!' : 'PART ONE'; }
  if (n===1) return yr<1990? 'FIRST ISSUE!' : '';
  const G_={hero:['THE BATTLE OF THE CENTURY!','TRAPPED!','BETRAYED!','THE VILLAIN WINS?','NOT A DREAM! NOT A HOAX!','ALL-OUT WAR!','THE END OF EVERYTHING?'],horror:['DARE YOU READ IT?','DON\'T TURN OUT THE LIGHTS!','IT CAME FROM BELOW!','NO ONE LEAVES!','THE STRANGEST TALE YET!'],crime:['CRIME DOES NOT PAY!','MURDER ON MAIN STREET!','THE BIG HEIST!','WHO KILLED HIM?'],romance:['WILL SHE SAY YES?','HEARTBREAK!','TORN BETWEEN TWO LOVES!'],war:['FIGHTING MAD!','NO RETREAT!','BEHIND ENEMY LINES!'],western:['SHOWDOWN AT SUNDOWN!','WANTED!','RIDE OR DIE!'],scifi:['FROM BEYOND THE STARS!','INVASION!','LOST IN SPACE!'],kids:['OH NO!','WHAT A MESS!','SURPRISE PARTY!'],comedy:['LAUGHS GALORE!','OOPS!','WHAT A MESS!']}[GFAM[CG[s.g].k]] || ['SUSPENSE!','ACTION!','MYSTERY!','CAN THEY ESCAPE?'];
  if (yr<1975 && r()<0.5) return pick(G_);
  return '';
}
function coverV2(key){
  const d=cmD(key), s=d.s; const W=200, H=300; const uid=hsh('c2'+key).toString(36);
  const n=d.n||1; const yr=yearOf(issueDay(s, n)); const age=yearOf(G.day)-yr; const fam=GFAM[CG[s.g].k]||'literary';
  const variant = d.v && d.v!=='B' ? d.v : ''; const virgin=/^V/.test(variant), sketch=/^S/.test(variant);
  // a new composition for every issue: story first, then a per-series shuffle, then variety
  const rs=hsh(s.id+'|'+n+'|'+(d.v||'')+'|'+(d.tr?d.kind+d.vol:'')); const r=mkRng(rs);
  const ks = d.tr? [] : issueKeys(s,n);
  const lead = s.ch.length? CH_(s.ch[0]) : null; const L = lead? charLook(lead, s.g) : charLook({id:s.id*13},s.g); L.seed=s.id;
  const other = ks.find(k=>['fa','cam','team','dth','ret'].includes(k[1]) && k[2]!==(lead&&lead.id)); const L2 = other && CH_(other[2]) ? charLook(CH_(other[2]), s.g) : charLook({id:s.id*31+n}, s.g);
  const pool = GTPL[fam]; const perm = shuffleWith(pool, hsh('perm'+s.id));
  let tpl = perm[((n-1) + Math.floor((n-1)/perm.length)*2 + (d.v?3:0)) % perm.length];
  if (ks.some(k=>k[1]==='dth')) tpl = fam==='hero'?'punch':'portrait';
  else if (ks.some(k=>k[1]==='ret')) tpl = fam==='hero'?'crowd':'portrait';
  else if (ks.some(k=>k[1]==='team')) tpl = fam==='hero'?'lineup':tpl;
  else if (n===1 && !d.v) tpl = fam==='hero'? 'hero' : ['portrait','hero','speed','mascot'].includes(perm[0])? perm[0] : tpl;
  const va_=pvar(d.v||''); const aid = va_.a>=0? va_.a : (s.cv>=0? s.cv : s.a); const ST=artStyle(aid);
  const evt = ks.some(k=>['dth','ret','team'].includes(k[1])) || (n===1&&!d.v);
  if (!evt && r()<0.65) tpl = ST.tpls[(n+(d.v?1:0))%3];
  const pals = GPAL[fam]; let P = pals[(hsh('pal'+s.id)+n*(1+(s.id%3))+(d.v?2:0)) % pals.length].slice();
  if (r()<0.3) P[1]=shade(P[1], r()<0.5?0.2:-0.2);
  if (r()<0.7) P=palShift(P, ST.pal);
  const flip = r()<0.5;
  let art = scene(tpl, r, sketch? ['#ffffff','#e5e5e5','#ffffff'] : P, W, H, L, L2, flip);
  if (ST.frame==='close') art=`<g transform="translate(-22 -34) scale(1.22)">${art}</g>`; else if (ST.frame==='wide') art=`<rect width="${W}" height="${H}" fill="${P[0]}"/><g transform="translate(16 26) scale(.84)">${art}</g>`;
  art += motifSVG(ST.motif, r, W, H, P[2]);
  if (ks.some(k=>k[1]==='dth')) art += `<rect width="${W}" height="${H}" fill="#000" opacity=".25"/>`;
  if (sketch) art = `<g filter="url(#sk${uid})">${art}</g>`;
  const title=s.t.toUpperCase(); const tier=tierOf(s); const pb=s.pub>=0?G.cm.pubs[s.pub]:null;
  const blurb = virgin? '' : blurbFor(ks, s, n, yr, r);
  const W_=CR_(s.w), A_=CR_(s.a); const credits=(W_===A_? W_.n : W_.n.split(' ').pop()+' / '+A_.n.split(' ').pop()).toUpperCase();
  const price = d.cp<1? Math.round(d.cp*100)+'¢' : '$'+d.cp.toFixed(2);
  const fitT=(len,max,base)=>Math.max(13, Math.min(base, Math.floor(max/Math.max(6,len)*1.85)));
  const fitA=(len,max,size)=> len*size*0.56>max ? `textLength="${max}" lengthAdjust="spacingAndGlyphs"` : '';
  let dress='';
  if (d.tr){ // collected editions: a book jacket built on the series' look
    const hc=d.kind==='H'; return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" class="cmsvg v2"><defs><clipPath id="cc${uid}"><rect width="${W}" height="${H}"/></clipPath></defs><g clip-path="url(#cc${uid})"><rect width="${W}" height="${H}" fill="${hc?'#141414':P[0]}"/><g transform="translate(24 70) scale(.76)" opacity="${hc?0.6:1}">${scene(perm[0], mkRng(rs), P, W, H, L, L2, false)}</g><rect width="12" height="${H}" fill="${hc?'#c9a227':shade(P[0],-0.3)}"/><text x="${W/2+6}" y="36" text-anchor="middle" ${VF} font-weight="800" font-size="${fitT(title.length,170,24)}" fill="${hc?'#c9a227':P[2]}">${esc(title)}</text><text x="${W/2+6}" y="56" text-anchor="middle" ${VF} font-size="12" letter-spacing="2" fill="${hc?'#e8d8a0':P[2]}">${hc?'DELUXE HARDCOVER':'VOLUME '+d.vol}</text><text x="${W/2+6}" y="${H-12}" text-anchor="middle" ${VF} font-size="10" fill="${hc?'#c9a227':P[2]}">${esc(credits)}</text></g></svg>`; }
  if (!virgin){
    const era = yr<1956?'gold': yr<1970?'silver': yr<1985?'bronze': yr<1993?'late': yr<2000?'spec': yr<2010?'modern':'now';
    const indieDress = tier>=2 && yr>=1978 && yr<2000;
    if (era==='gold'){ dress += `<rect width="${W}" height="64" fill="${P[1]}"/><rect x="5" y="5" width="38" height="50" fill="#fff" stroke="#111" stroke-width="1.5"/>${pubMark(s,24,20,0.55,'#111','#fff')}<text x="24" y="44" text-anchor="middle" ${VF} font-weight="800" font-size="11" fill="#c00">${price}</text><text x="24" y="53" text-anchor="middle" ${VF} font-size="8" fill="#111">No. ${n}</text><text x="${W/2+22}" y="44" text-anchor="middle" font-family="Georgia,serif" font-weight="900" font-size="${fitT(title.length,150,30)}" ${fitA(title.length,150,fitT(title.length,150,30))} fill="${P[2]}" stroke="#111" stroke-width="1.6" paint-order="stroke">${esc(title)}</text>`; }
    else if (era==='silver'||era==='bronze'){ dress += `<rect width="44" height="62" fill="#fff"/><rect x="3" y="3" width="38" height="56" fill="${P[1]}"/>${pubMark(s,22,18,0.5,'#fff',P[1])}<text x="22" y="42" text-anchor="middle" ${VF} font-weight="800" font-size="15" fill="#fff">${n}</text><text x="22" y="54" text-anchor="middle" ${VF} font-size="9" fill="#fff">${price}</text><text x="${W/2+22}" y="${era==='silver'?40:44}" text-anchor="middle" ${VF} font-weight="800" font-size="${fitT(title.length,150,32)}" ${fitA(title.length,148,fitT(title.length,150,32))} fill="${P[2]}" stroke="#111" stroke-width="1.4" paint-order="stroke" ${era==='silver'?'font-style="italic"':''}>${esc(title)}</text>`; if (era==='bronze' && tier<=1) dress += `<g transform="translate(${W-24} ${H-24})"><rect x="-14" y="-12" width="28" height="24" fill="#fff" stroke="#111"/><text y="-3" text-anchor="middle" ${VF} font-size="5" fill="#111">APPROVED</text><text y="4" text-anchor="middle" ${VF} font-size="5" fill="#111">BY THE CSB</text></g>`; }
    else if (indieDress){ dress += `<rect width="${W}" height="54" fill="#0a0a0a"/>${pubMark(s,20,27,0.8,'#e8e2cf','#0a0a0a')}<text x="38" y="20" ${VF} font-size="8" letter-spacing="1" fill="#e8e2cf">${esc((pb?pb.n:'').toUpperCase().slice(0,24))}</text><text x="38" y="30" ${VF} font-size="8" fill="#e8e2cf">No. ${n} · ${price}</text><text x="${W-8}" y="48" text-anchor="end" font-family="Georgia,serif" font-weight="700" font-size="${fitT(title.length,150,24)}" ${fitA(title.length,150,fitT(title.length,150,24))} fill="${P[1]}">${esc(title)}</text>`; }
    else if (era==='late'||era==='spec'){ dress += `<defs><linearGradient id="t9${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".5" stop-color="${P[1]}"/><stop offset="1" stop-color="${shade(P[1],-0.5)}"/></linearGradient></defs><text x="${W/2}" y="44" text-anchor="middle" ${VF} font-weight="800" font-size="${fitT(title.length,185,38)}" ${fitA(title.length,184,fitT(title.length,185,38))} fill="${era==='spec'?'url(#t9'+uid+')':P[2]}" stroke="#000" stroke-width="1.5" paint-order="stroke">${esc(title)}</text>${pubMark(s,20,H-22,0.6,'#fff','#111')}<text x="36" y="${H-14}" ${VF} font-weight="800" font-size="12" fill="#fff" stroke="#000" stroke-width="1.5" paint-order="stroke">#${n}</text>`; if (era==='spec' && n===1) dress += `<rect x="0" y="${H-56}" width="${W}" height="15" fill="#f2c230" transform="rotate(-5 ${W/2} ${H-48})"/><text x="${W/2}" y="${H-45}" text-anchor="middle" ${VF} font-weight="800" font-size="10" fill="#111" transform="rotate(-5 ${W/2} ${H-48})">COLLECTOR'S EDITION #1</text>`; }
    else { const lightBg = lum(P[0])>0.6 && !['hero','flight','space'].includes(tpl); const tc = lightBg? '#111' : '#fff';
      dress += `<text x="12" y="30" ${VF} font-weight="800" font-size="${fitT(title.length,176,26)}" ${fitA(title.length+2,176,fitT(title.length,176,26))} letter-spacing="1.5" fill="${tc}" stroke="${lightBg?'none':'#0006'}" stroke-width=".6" paint-order="stroke">${esc(title)}</text><text x="12" y="${H-12}" ${VF} font-size="8" letter-spacing="2" fill="${tc}" opacity=".9">${esc(credits)}</text>${pubMark(s,W-18,H-22,0.55,tc,'transparent')}<text x="${W-34}" y="${H-12}" text-anchor="end" ${VF} font-weight="700" font-size="11" fill="${tc}">${n}</text>`;
      if (!d.v && era==='now') dress += `<g transform="translate(${W-44} 42)"><rect width="32" height="20" fill="#fff"/>${Array.from({length:12},(_,i)=>`<rect x="${2+i*2.4}" y="3" width="${i%3?1:1.6}" height="13" fill="#111"/>`).join('')}</g>`; }
    if (blurb){ const bw=Math.min(W-30, blurb.length*6.2+18); const bf = blurb.length*6.2+18>W-30 ? `textLength="${W-44}" lengthAdjust="spacingAndGlyphs"` : ''; dress += yr<1975 ? `<g transform="translate(${W-bw/2-10} ${H*0.8}) rotate(-6)"><path d="M${-bw/2} -14 L${bw/2} -18 L${bw/2+6} 12 L${-bw/2-4} 16 Z" fill="${P[2]}" stroke="#111" stroke-width="2"/><text y="4" text-anchor="middle" ${VF} font-weight="800" font-size="11" fill="#b3122e" ${bf}>${esc(blurb)}</text></g>` : yr<2000 ? `<g transform="translate(14 ${H-62}) rotate(-3)"><rect width="${bw}" height="22" fill="${P[2]}" stroke="#111" stroke-width="2"/><text x="${bw/2}" y="15" text-anchor="middle" ${VF} font-weight="800" font-size="11" fill="#b3122e" ${bf}>${esc(blurb)}</text></g>` : `<text x="12" y="44" ${VF} font-size="9" letter-spacing="2" fill="#fff" opacity=".85">${esc(blurb)}</text>`; }
    if (d.p>1 && d.p<9) dress += `<text x="${W-8}" y="${H*0.62}" text-anchor="end" ${VF} font-weight="800" font-size="10" fill="#fff" stroke="#b3122e" stroke-width="3" paint-order="stroke">${['','','SECOND','THIRD','FOURTH','FIFTH'][d.p]||''} PRINTING</text>`;
    if (d.p===9) dress += `<rect width="${W}" height="14" fill="#111"/><text x="${W/2}" y="11" text-anchor="middle" ${VF} font-weight="700" font-size="9" letter-spacing="2" fill="#fff">FACSIMILE EDITION</text>`;
    if (/^X/.test(variant)) dress += `<rect x="0" y="${H-24}" width="${W}" height="24" fill="#111"/><text x="${W/2}" y="${H-8}" text-anchor="middle" ${VF} font-weight="700" font-size="11" fill="#f2c230" letter-spacing="1">RETAILER EXCLUSIVE</text>`;
    if (/^C/.test(variant)) dress += `<rect x="0" y="${H-24}" width="${W}" height="24" fill="#c8102e"/><text x="${W/2}" y="${H-8}" text-anchor="middle" ${VF} font-weight="700" font-size="10" fill="#fff" letter-spacing="1">CONVENTION EXCLUSIVE</text>`;
    if (/^R/.test(variant)) dress += `<text x="${W-8}" y="${H*0.68}" text-anchor="end" ${VF} font-size="7" letter-spacing="2" fill="#fff" stroke="#0008" stroke-width="1" paint-order="stroke">VARIANT EDITION</text>`;
  }
  if (!virgin && yr>=1980 && CR_(aid)) dress += `<path d="${sigPath(CR_(aid).n)}" transform="translate(${W-70} ${H-46}) scale(.24)" fill="none" stroke="${P[2]}" stroke-width="${5*ST.line}" opacity=".8" stroke-linecap="round"/>`;
  const tone = Math.min(0.28, Math.max(0, age-15)*0.007);
  const half = yr<2000 ? `<pattern id="ht${uid}" width="4" height="4" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r=".8" fill="#000"/></pattern><rect width="${W}" height="${H}" fill="url(#ht${uid})" opacity="${yr<1975?0.1:0.06}"/>` : '';
  const mis = yr<1995 ? `<rect width="${W}" height="3" fill="#00a0c6" opacity=".18" transform="translate(1.2 .6)"/>` : '';
  const foil = d.v==='F' ? `<rect width="${W}" height="${H}" fill="url(#fo${uid})"/>` : '';
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" class="cmsvg v2" data-era="${yr}"><defs><clipPath id="cc${uid}"><rect width="${W}" height="${H}"/></clipPath><filter id="sk${uid}"><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncR type="discrete" tableValues="0 1"/><feFuncG type="discrete" tableValues="0 1"/><feFuncB type="discrete" tableValues="0 1"/></feComponentTransfer></filter><linearGradient id="fo${uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".45" stop-color="#fff" stop-opacity=".45"/><stop offset=".55" stop-color="#b3e5fc" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
    <g clip-path="url(#cc${uid})">${art}${half}${dress}${mis}${foil}${tone?`<rect width="${W}" height="${H}" fill="#c9a45c" opacity="${tone.toFixed(3)}" style="mix-blend-mode:multiply"/>`:''}<rect width="${W}" height="${H}" fill="none" stroke="rgba(0,0,0,.35)"/></g></svg>`;
}
(function(){ comicCover=function(key){ let h=CVC.get('v3'+key); if (!h){ h=coverV2(key); if (CVC.size>1500) CVC.clear(); CVC.set('v3'+key,h); } return h; }; })();
