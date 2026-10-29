'use strict';
// Imports Set 01 (handoff v0.1) into broken-reach-production/set01/cards.json.  node tools/brokenreach/import.js [--check]
const fs=require('fs'), path=require('path'), crypto=require('crypto');
const {AB}=require('./abilities.js');
const ROOT=path.join(__dirname,'..','..','broken-reach-production');
const src=fs.readFileSync(path.join(ROOT,'source','broken_reach_set01_data.json'));
const csv=fs.readFileSync(path.join(ROOT,'source','broken_reach_set01_chases.csv'),'utf8');
const d=JSON.parse(src);
const DIRS=['N','NE','E','SE','S','SW','W','NW'];
const TYPE_CODE={'Ship':'ship','Character':'char','Crew & Military':'crew','Drone & Creature':'drone','Tech Unit':'tech','Planet':'planet'};
const RAR={'Common':'C','Uncommon':'U','Rare':'R','Super Rare':'SR','Legendary':'L'};
const errs=[];
const cards=d.base_cards.map(r=>{
  const planet=r['Card Type']==='Planet';
  const text=r['Ability / Planet Effect']||'';
  let ops=[]; if (text){ ops=AB[text]; if(!ops) errs.push('unmapped ability: '+text); }
  let mask=0; const arrows=(r['Arrows (N clockwise)']||'').split(',').map(s=>s.trim()).filter(Boolean);
  for (const a of arrows){ const i=DIRS.indexOf(a); if(i<0) errs.push(r['Card ID']+' bad arrow '+a); else mask|=1<<i; }
  if (planet!==(r.Attack==null) || planet!==(arrows.length===0)) errs.push(r['Card ID']+' planet/stat mismatch');
  if (!planet && (!(r.Attack>=1&&r.Attack<=5)||!(r.Guard>=1&&r.Guard<=5)||!arrows.length)) errs.push(r['Card ID']+' bad stats');
  return {base_card_id:r['Card ID'],name:r.Name,type:TYPE_CODE[r['Card Type']],typeName:r['Card Type'],aff:r.Affiliation,rar:RAR[r.Rarity],
    mask,atk:r.Attack,grd:r.Guard,text,ops,role:r['Battlefield Role'],era:r['Story Era'],brief:r['SOL Illustration Brief'],
    status:{art:r['Art Status'],rules:r['Rules Status'],canon:r['Canon Status']}};
});
const byId=Object.fromEntries(cards.map(c=>[c.base_card_id,c]));
if (cards.length!==180 || Object.keys(byId).length!==180) errs.push('need 180 unique ids');
const cnt={}; cards.forEach(c=>cnt[c.rar]=(cnt[c.rar]||0)+1);
if (!(cnt.C===64&&cnt.U===48&&cnt.R===40&&cnt.SR===20&&cnt.L===8)) errs.push('rarity counts '+JSON.stringify(cnt));
const TREAT={'Illustration Rare':'IR','Signature Rare':'SR','Eclipse Rare':'EC'};
const alts=d.alternate_printings.map(a=>{ if(!byId[a.base_card_id]) errs.push('alt to unknown '+a.base_card_id);
  else if (byId[a.base_card_id].name!==a.base_name) errs.push('alt name mismatch '+a.variant_id);
  return {printing_id:a.variant_id,base_card_id:a.base_card_id,treatment:TREAT[a.treatment],gameplay:'same as base',art_direction:a.art_direction,art:'Not started'}; });
if (alts.length!==27 || alts.filter(a=>a.treatment==='IR').length!==16 || alts.filter(a=>a.treatment==='SR').length!==8 || alts.filter(a=>a.treatment==='EC').length!==3) errs.push('need 16 IR, 8 Signature, 3 Eclipse');
if (new Set(alts.map(a=>a.printing_id)).size!==27) errs.push('duplicate printing ids');
// the CSV and the JSON must agree
const rows=csv.trim().split('\n').slice(1).map(l=>l.split(',')); const csvIds=rows.map(r=>r[0]+'>'+r[1]).sort().join();
if (csvIds!==alts.map(a=>a.printing_id+'>'+a.base_card_id).sort().join()) errs.push('chases csv differs from json');
// printings: every base card is printed regular and foil; premium arts add to that
const printings=[]; for (const c of cards){ printings.push({printing_id:c.base_card_id+':N',base_card_id:c.base_card_id,v:'N'}); printings.push({printing_id:c.base_card_id+':F',base_card_id:c.base_card_id,v:'F'}); }
for (const a of alts) printings.push({printing_id:a.printing_id,base_card_id:a.base_card_id,v:a.treatment});
const out={franchise:'broken-reach',set:'BR01',name:d.set_name,status:'proposed (v0.1, provisional)',combat:d.combat_version,booster:d.booster,
  sourceSha256:crypto.createHash('sha256').update(src).digest('hex'),cards,alternates:alts,printings};
if (errs.length){ console.error('IMPORT FAILED\n'+errs.join('\n')); process.exit(1); }
const text=JSON.stringify(out,null,1)+'\n', file=path.join(ROOT,'set01','cards.json');
if (process.argv.includes('--check')){ if(!fs.existsSync(file)||fs.readFileSync(file,'utf8')!==text){ console.error('cards.json is stale'); process.exit(1);} console.log('OK: 180 cards, 27 alternate printings, '+printings.length+' printings'); }
else { fs.writeFileSync(file,text); console.log('wrote',file,cards.length,'cards',alts.length,'alternates',printings.length,'printings'); }
