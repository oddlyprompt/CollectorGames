// which game is this? PACK is defined by the build; the engine asks instead of assuming
function packHas(w){ return typeof PACK==='undefined' || !PACK.worlds || PACK.worlds[w]!==false; }
function packId(){ return typeof PACK==='undefined'? 'all' : PACK.id; }
// ===================== CORE =====================
var G = null; // the whole persisted game state
const DAY0 = Date.UTC(2020, 0, 1);
const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function dayToDate(t){ return new Date(DAY0 + t*86400000); }
function dateToDay(y,m,d){ return Math.round((Date.UTC(y,m-1,d)-DAY0)/86400000); }
let _yc=-1,_yv=0; function yearOf(t){ if (t===_yc) return _yv; _yc=t; _yv=dayToDate(t).getUTCFullYear(); return _yv; }
function mdOf(t){ const d=dayToDate(t); return [d.getUTCMonth()+1, d.getUTCDate()]; }
function dowOf(t){ return dayToDate(t).getUTCDay(); }
function fmtDate(t, withYear){ const d=dayToDate(t); return MON[d.getUTCMonth()]+' '+d.getUTCDate()+(withYear?', '+d.getUTCFullYear():''); }

// Serializable RNG (state lives in G.rs so reloads continue the same stream)
function worldRnd(){ const s=G.rs=(G.rs+0x6D2B79F5)|0; let t=Math.imul(s^s>>>15,1|s); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }
function mkRng(seed){ let s=seed|0; return function(){ s=(s+0x6D2B79F5)|0; let t=Math.imul(s^s>>>15,1|s); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function hashStr(str){ let h=2166136261; for(let i=0;i<str.length;i++){ h^=str.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; }
var R = worldRnd;
function withRng(rng, fn){ const old=R; R=rng; try { return fn(); } finally { R=old; } }
function ri(a,b){ return a+Math.floor(R()*(b-a+1)); }
function rf(a,b){ return a+R()*(b-a); }
function pick(a){ return a[Math.floor(R()*a.length)]; }
function chance(p){ return R()<p; }
function gauss(){ let u=0; while(u===0) u=R(); const v=R(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); }
function clamp(x,a,b){ return x<a?a:x>b?b:x; }
function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(R()*(i+1)); const t=a[i]; a[i]=a[j]; a[j]=t; } return a; }
function poisson(l){ if(l<=0) return 0; if(l>30) return Math.max(0,Math.round(l+gauss()*Math.sqrt(l))); const L=Math.exp(-l); let k=0,p=1; do{ k++; p*=R(); } while(p>L); return k-1; }
function wpick(items, wf){ let tot=0; for(const it of items) tot+=wf(it); let x=R()*tot; for(const it of items){ x-=wf(it); if(x<=0) return it; } return items[items.length-1]; }
function median(a){ if(!a.length) return 0; const s=a.slice().sort((x,y)=>x-y); const m=s.length>>1; return s.length%2?s[m]:(s[m-1]+s[m])/2; }
function gcd(a,b){ while(b){ const t=b; b=a%b; a=t; } return a; }

function money(x, cents){
  if (x==null || isNaN(x)) return '—';
  const neg = x<0; x=Math.abs(x);
  let s;
  if (cents || x<10) s = x.toFixed(2);
  else if (x<1000) s = Math.round(x).toString();
  else s = Math.round(x).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return (neg?'−$':'$')+s;
}
// round an estimate to a "human" price
function nicePrice(x){
  if (x<2) return Math.round(x*20)/20;
  if (x<20) return Math.round(x*2)/2;
  if (x<100) return Math.round(x);
  if (x<1000) return Math.round(x/5)*5;
  if (x<10000) return Math.round(x/25)*25;
  return Math.round(x/100)*100;
}
function esc(s){ return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

const FIRST = ['Malik','Tyler','Jonathan','Diego','Hiro','Marcus','Caleb','Luis','Andre','Owen','Mateo','Jalen','Brady','Colton','Rafael','Kenji','Darius','Elias','Tomas','Julian','Wyatt','Grant','Cody','Reid','Nolan','Emilio','Andres','Tavion','Brooks','Quinn','Isaiah','Xavier','Dominic','Carlos','Eduardo','Yuto','Ramon','Silas','Dante','Everett','Bennett','Harrison','Jorge','Kai','Leon','Micah','Nico','Oscar','Pablo','Rhett','Sergio','Theo','Victor','Wes','Zane','Aaron','Brandon','Cristian','Devin','Ezra','Felix','Gavin','Hector','Ivan','Jace','Kellan','Lucas','Manny','Nate','Orlando','Preston','Rowan','Santiago','Trent','Uriel','Vance','Warren','Yadiel','Zeke','Anders','Beau','Cruz','Desmond','Emmett','Fletcher','Gio','Holden','Ignacio','Jonah','Knox','Landon','Marco','Nash','Omar','Paxton','Rico','Sawyer','Tobias','Wilmer','Yoel','Adrian','Bryce','Chase','Deacon','Enzo','Ford','Graham','Hayes','Joaquin','Kaden','Lorenzo','Miles','Nestor','Reuben','Soren','Tate','Ulises','Wade'];
const LAST = ['Bannon','Gomez','Reyes','Hollis','Varga','Okafor','Castellano','Whitlock','Dunmore','Pryce','Salcedo','Lindqvist','Tanaka','Morrow','Achterberg','Quintero','Fairbanks','Delacroix','Ashby','Kowalczyk','Ferreira','Halvorsen','Mendez','Rourke','Sato','Kimura','Oduya','Pemberton','Vance','Cordero','Blackwood','Esposito','Nakamura','Thorne','Valdez','Wexler','Ybarra','Zielinski','Abernathy','Barrios','Calloway','Dvorak','Espinal','Fontaine','Gallardo','Harlow','Iglesias','Jansen','Kessler','Lozano','Maddox','Navarro','Ocampo','Paredes','Quill','Rasmussen','Serrano','Tillman','Urena','Villalobos','Winslow','Yates','Zamora','Aldana','Brandt','Cisneros','Draper','Figueroa','Grady','Hendricks','Irving','Jaramillo','Keane','Lachance','Marchetti','Nieves','Orozco','Pacheco','Radcliffe','Solano','Tremblay','Underhill','Vasquez','Waverly','Acevedo','Beckett','Crowder','Duval','Ellery','Forsythe','Gutierrez','Haddock','Imai','Jessup','Kincaid','Larkin','Montero','Olmstead','Prentiss','Rinaldi','Stroud','Talbot','Vickers','Whitfield','Aranda','Bellweather','Corbin','Dellinger','Esquivel','Fenwick','Galloway','Hargrove','Ivers','Jennings','Kerrigan','Lomax','Mercado','Norwood','Ostrander','Pelletier','Quiroga','Ridley','Thibodeaux','Ulloa','Varnell','Whitaker','Yarbrough','Arriaga','Bodine','Cavanaugh','Darrow','Everly','Farris','Goodwin','Hatcher','Ingram','Joyner','Kearns','Lister','Mayfield','Nunez','Ormsby','Pruitt','Rhodes','Sheffield','Toussaint','Vail','Wendt','Obregon','Castillo','Moreau','Sandoval','Petrakis','Brennan','Loughlin','Oyelaran','Szabo','Tavares','Voss','Kagawa','Albright','Dorsey','Estrada','Huxley','Ruelas','Strand','Maroney'];
const HANDLES_A = ['diamond','slab','rookie','wax','chrome','cardboard','gem','hobby','pack','sealed','prospect','vintage','pc','hitter','bullpen','dugout','mint','centering','refractor','ace','grand','clubhouse','bleacher','ink','foil','dealer','flip','binder','set','sweetspot'];
const HANDLES_B = ['hunter','king','vault','kid','shack','dad','collects','breaks','guy','cards','stash','depot','den','hoarder','junkie','lab','club','queen','flips','trader','haus','nerd','co','pulls','box','files'];
