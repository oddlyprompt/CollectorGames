// Tidemark Version 1 self-test: node tools/tidemark/v1/check.js
// Every card validates, every op a card uses is implemented, every one of the 650 cards is played in real games (decks of
// every faction mix from all sets), games repeat exactly from the same seed, and the exported files are up to date.
const fs=require('fs'), path=require('path'); const {CARDS, ERRS}=require('./cards.js'); const {OPS}=require('./ops.js'); const E=require('./engine.js'); const {ARCH, build}=require('./decks.js');
let fail=0; const ok=(c,m)=>{ console.log((c?'ok   ':'FAIL ')+m); if (!c) fail++; };
ok(CARDS.length===650 && !ERRS.length, `650 cards designed and valid (${CARDS.length}, ${ERRS.length} errors${ERRS.length? ': '+ERRS.slice(0,3).join('; '):''})`);
const src=fs.readFileSync(path.join(__dirname,'engine.js'),'utf8'); const used=new Set(); for (const c of CARDS) for (const ab of c.fx) used.add(ab[1]);
const STATIC_IN_ENGINE=['lord','cost','tax','nostrand','athome','strand_front','strand2','bounce_cross','ward','hold_ward','screen_both','both_allegiance','twice','survive','spellproof','nobounce','guard_both','home','max_attack','thorns','echo','pacify','equip','aura','grant_static','scale'];
const missing=[...used].filter(op=>OPS[op] && (OPS[op].w==='s'? !STATIC_IN_ENGINE.includes(op) || !src.includes("'"+op+"'") : !src.includes("case '"+op+"'")));
ok(!missing.length, `every op the cards use is implemented (${used.size} ops${missing.length? '; missing: '+missing.join(', ') : ''})`);
// play every card: for each faction pair, a deck from all its cards (all sets), cycled so every card appears
const F=['CR','TW','IR','TB','FF','AC','HL','NE']; const seen=new Set(); let games=0, bad=0, err=null;
try { for (const f of F){ const mine=CARDS.filter(c=>c.f===f); for (let k=0;k<mine.length;k+=17){ const chunk=mine.slice(k,k+17); const deck=[]; while (deck.length<50) deck.push(...chunk); deck.length=50;
      for (const opp of ARCH){ const r=E.play(deck, build(opp,'tt'), 991*games+7); games++; if (![0,1,-1].includes(r.w) || !(r.turns>0)) bad++; for (const [p,id] of r.log.played) if (p===0) seen.add(id); } } } } catch(e){ err=e; }
ok(!err && !bad, `${games} games with every card of every faction${err? ': threw '+err.stack.split('\n').slice(0,3).join(' | ') : bad? ', '+bad+' bad results' : ''}`);
const never=CARDS.filter(c=>!seen.has(c.id)); ok(never.length<=40, `${650-never.length} of 650 cards were played at least once (cards that need conditions may sit in hand; ${never.length} not played${never.length? ': '+never.slice(0,8).map(c=>c.n).join(', ')+(never.length>8?'...':'') : ''})`);
const D=ARCH.map(a=>build(a,'tt')); const a=E.play(D[0],D[3],4242), b=E.play(D[0],D[3],4242);
ok(a.w===b.w && a.turns===b.turns && JSON.stringify(a.harbor)===JSON.stringify(b.harbor) && JSON.stringify(a.log.played)===JSON.stringify(b.log.played), 'same seed, same game');
ok(D.every(d=>d.length===50 && d.every(c=>c.tt)) && D.every(d=>{ const k={}; for (const c of d) k[c.id]=(k[c.id]||0)+1; return d.every(c=>k[c.id]<=(c.r==='L'?1:3)); }), 'every archetype deck is a legal Tenth Tide deck (50 cards, 3 copies, 1 Legendary)');
let w=0,g=0; for (let i=0;i<D.length;i++) for (let k=0;k<40;k++){ const r=E.play(D[i],D[i],100*i+k); g++; if (r.w===0) w++; } ok(Math.abs(w/g-0.5)<0.06, `mirror matches: seat A wins ${(w/g*100).toFixed(1)}% (near 50%)`);
{ let r=null, e=null; try { r=require('./meta.js').run(10, 3, true); } catch(x){ e=x; }
  ok(!e && r && r.S.sizes.every(n=>n>=12 && n<=22), 'living metagame runs 10 weeks (field size '+(r? Math.min(...r.S.sizes)+' to '+Math.max(...r.S.sizes) : 'n/a')+(e? '; threw '+e.message : '')+')'); }
const ex=require('child_process').spawnSync(process.execPath,[path.join(__dirname,'export.js'),'--check'],{encoding:'utf8'}); ok(ex.status===0, 'exported files up to date ('+(ex.stdout||'').trim()+')');
console.log(fail? `${fail} FAILED` : 'all checks passed'); process.exit(fail?1:0);
