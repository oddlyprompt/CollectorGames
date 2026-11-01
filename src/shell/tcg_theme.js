// ===================== Trading Card Collector: theme glue (tcg build only) =====================
// Gives each game tab a hero banner and its own accent, puts the three games on Home, and lets the long intro notes fold to two lines.
// Purely presentation: no game state is read except card counts for the Home tiles.
(function(){
  if (!packHas('tcg')) return;
  const GAMES={ shop:{g:'wk', c:'134,207,116', n:'Wildkin', img:'art/scene.verdant.01.jpg', line:'Creatures · First Bond · Duskfall', sum:()=>typeof myTcSummary==='function'?myTcSummary():null},
                xt:{g:'xt', c:'71,192,180', n:'Tidemark', img:'art/TMI-0040.webp', line:'Land and sea · ten years of history', sum:()=>typeof myXtSummary==='function'?myXtSummary():null},
                br:{g:'br', c:'208,143,82', n:'Broken Reach', img:'art/br-BR01-001.webp', line:'Space opera · A Ship of Our Own', sum:()=>typeof myBrSummary==='function'?myBrSummary():null} };
  const titleRe=/<div class="pagetitle"><h1>([^<]*)<\/h1><span class="muted small">([^<]*)<\/span><\/div>/;
  for (const k of Object.keys(GAMES)){ const v=VIEWS[k]; if (!v) continue; const H=GAMES[k];
    VIEWS[k]=function(){ const h=v.apply(this,arguments); return h.replace(titleRe,(m,t)=>`<div class="hero" style="background-image:url('${H.img}')"><div class="hero-in"><h1>${t}</h1><p>${H.line}</p></div></div>`); }; }
  const hv=VIEWS.home;
  VIEWS.home=function(){ const h=hv.apply(this,arguments);
    const tiles=Object.keys(GAMES).map(k=>{ const H=GAMES[k]; let s=null; try { s=H.sum(); } catch(e){} const n=s? (s.n||0)+(s.g||0) : 0, sl=s? (s.s||0) : 0;
      return `<button class="gtile" data-act="tab" data-a="${k}" style="background-image:url('${H.img}');--c:${H.c}"><span class="gt"><b>${H.n}</b><small>${n?n+' card'+(n===1?'':'s'):'Open a pack'}${sl?' · '+sl+' sealed':''}</small></span></button>`; }).join('');
    return h.replace('<div class="kpis">','<div class="games">'+tiles+'</div><div class="kpis">'); };
  const r0=render; render=function(){ const a=document.getElementById('app'); if (a) a.dataset.g=(GAMES[UI.tab]||{g:'home'}).g; return r0.apply(this,arguments); };
  document.addEventListener('click',e=>{ const t=e.target; if (!t||!t.closest) return; const n=t.closest('.note'); if (!n||t.closest('button,a,input,select')) return; if (n.querySelector(':scope > .x')) n.classList.toggle('open'); });
})();
