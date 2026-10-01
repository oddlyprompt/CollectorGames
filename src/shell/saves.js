// ===================== SAVE SLOTS =====================
// Several named games per title, stored in this browser's IndexedDB and compressed. Backups are .ccsave files you can move between devices.
const SLOT={ id:null, name:'' };
const SAVES={ db:null, last:0, err:'', busy:false, again:false };
const SAVE_MAGIC='CCS1';
function idbOpen(){
  return new Promise((res,rej)=>{ if (SAVES.db) return res(SAVES.db); if (typeof indexedDB==='undefined') return rej(new Error('no indexedDB'));
    let rq; try { rq=indexedDB.open('collector-saves',1); } catch(e){ return rej(e); }
    rq.onupgradeneeded=()=>{ const d=rq.result; if (!d.objectStoreNames.contains('slots')) d.createObjectStore('slots',{keyPath:'id'}); if (!d.objectStoreNames.contains('data')) d.createObjectStore('data',{keyPath:'id'}); };
    rq.onsuccess=()=>{ SAVES.db=rq.result; SAVES.db.onclose=()=>{ SAVES.db=null; }; res(SAVES.db); }; rq.onerror=()=>rej(rq.error||new Error('no storage')); rq.onblocked=()=>rej(new Error('Storage is busy in another tab.')); });
}
// one storage layer: IndexedDB when the browser allows it, otherwise memory (saves last until the page closes, so backups matter)
const MEM={ slots:new Map(), data:new Map() };
async function useMemory(){ if (SAVES.mem===undefined){ try { await idbOpen(); SAVES.mem=false; } catch(e){ SAVES.mem=true; SAVES.err='Saving is blocked in this browser, so this game will be lost when you close the page. Download a backup from Settings to keep it.'; } } return SAVES.mem; }
const store={
  async all(n){ if (await useMemory()) return [...MEM[n].values()]; return (await idbOpen(), new Promise((res,rej)=>{ const t=SAVES.db.transaction([n],'readonly'); const rq=t.objectStore(n).getAll(); rq.onsuccess=()=>res(rq.result); rq.onerror=()=>rej(rq.error); })); },
  async get(n,id){ if (await useMemory()) return MEM[n].get(id)||null; return new Promise((res,rej)=>{ const t=SAVES.db.transaction([n],'readonly'); const rq=t.objectStore(n).get(id); rq.onsuccess=()=>res(rq.result||null); rq.onerror=()=>rej(rq.error); }); },
  async batch(ops){ if (await useMemory()){ for (const o of ops){ if (o.put) MEM[o.s].set(o.put.id,o.put); else MEM[o.s].delete(o.del); } return; }
    return new Promise((res,rej)=>{ const t=SAVES.db.transaction([...new Set(ops.map(o=>o.s))],'readwrite'); for (const o of ops){ const st=t.objectStore(o.s); if (o.put) st.put(o.put); else st.delete(o.del); } t.oncomplete=()=>res(); t.onerror=()=>rej(t.error); t.onabort=()=>rej(t.error||new Error('Save was cancelled.')); }); }
};
async function slotList(game){ const all=await store.all('slots'); return (all||[]).filter(r=>!game||r.game===game).sort((a,b)=>b.updated-a.updated); }
async function slotGet(id){ return store.get('slots',id); }
function slotMetaNow(){ const P_=G.player; const nwL=(P_.nw&&P_.nw.length)? P_.nw[P_.nw.length-1] : null; return { day:G.day, cash:Math.round(P_.cash*100)/100, nw: nwL? Math.round(nwL[1]+nwL[2]) : Math.round(P_.cash), scn:P_.scnN||'', items:(typeof myCards==='function'?myCards().length:0)+(typeof myComics==='function'&&G.cm?myComics().length:0)+(typeof myTc==='function'&&G.tcg?myTc().length:0) }; }
async function slotCreate(name, scn){ const id='s'+Date.now().toString(36)+Math.floor(Math.random()*1e5).toString(36); const rec={ id, game:PACK.id, name:name||'My collection', created:Date.now(), updated:Date.now(), meta:{}, enc:'', v:1, scn:scn||'' }; await store.batch([{s:'slots',put:rec}]); return rec; }
async function slotRename(id,name){ const r=await slotGet(id); if (!r) return; r.name=name; await store.batch([{s:'slots',put:r}]); if (SLOT.id===id) SLOT.name=name; }
async function slotDelete(id){ await store.batch([{s:'slots',del:id},{s:'data',del:id}]); if (SLOT.id===id){ SLOT.id=null; } }
async function slotWrite(id, bytes, enc, meta){ const r=await slotGet(id); if (!r) throw new Error('That save slot was deleted.'); r.updated=Date.now(); r.meta=meta; r.enc=enc; r.size=bytes.byteLength; await store.batch([{s:'slots',put:r},{s:'data',put:{id, bytes:bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset+bytes.byteLength)}}]); }
async function slotRead(id){ const r=await slotGet(id); const d=await store.get('data',id); if (!r||!d) throw new Error('Could not find that save.'); return { rec:r, bytes:new Uint8Array(d.bytes), enc:r.enc }; }
// ---------- turning the world into bytes and back ----------
async function packBytes(){
  const json=JSON.stringify(G, saveReplacer);
  if (typeof CompressionStream!=='undefined'){ const cs=new Blob([json]).stream().pipeThrough(new CompressionStream('gzip')); return { bytes:new Uint8Array(await new Response(cs).arrayBuffer()), enc:'gz' }; }
  return { bytes:new TextEncoder().encode(json), enc:'raw' };
}
async function unpackBytes(bytes, enc){
  if (enc==='gz'){ const ds=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip')); return JSON.parse(await new Response(ds).text()); }
  return JSON.parse(new TextDecoder().decode(bytes));
}
// ---------- saving ----------
saveGame=async function(force){
  if (!SLOT.id || !G || !G.player || !G.player.start) return;
  if (SAVES.busy){ SAVES.again=true; return; } SAVES.busy=true;
  try { const p=await packBytes(); await slotWrite(SLOT.id,p.bytes,p.enc,slotMetaNow()); SAVES.last=Date.now(); if (!SAVES.mem) SAVES.err=''; G._saveOk=true; G._localOk=!SAVES.mem; }
  catch(e){ SAVES.err=String(e&&e.message||e); G._saveOk=false; console.warn('save failed',e); }
  SAVES.busy=false; if (SAVES.again){ SAVES.again=false; saveGame(); }
};
flushCloud=async function(){}; 
if (typeof document!=='undefined'){ document.addEventListener('visibilitychange',()=>{ if (document.visibilityState==='hidden') saveGame(true); }); window.addEventListener('pagehide',()=>saveGame(true)); }
try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch(e){}
function saveStatus(){
  if (SAVES.err) return `<span class="err">Couldn't save: ${esc(SAVES.err)}. Download a backup so you don't lose this game.</span>`;
  if (!SAVES.last) return `Playing <b>${esc(SLOT.name)}</b>. Saves automatically in this browser.`;
  return `Playing <b>${esc(SLOT.name)}</b>. Saved in this browser at ${new Date(SAVES.last).toLocaleTimeString([], {hour:'numeric', minute:'2-digit'})}. Download a backup to keep a copy or move to another device.`;
}
// ---------- backups ----------
async function slotExportBlob(id){
  const {rec,bytes,enc}=await slotRead(id); const head=new TextEncoder().encode(JSON.stringify({game:rec.game,name:rec.name,enc,meta:rec.meta,v:1,saved:Date.now()}));
  const out=new Uint8Array(4+4+head.length+bytes.length); out.set(new TextEncoder().encode(SAVE_MAGIC),0); new DataView(out.buffer).setUint32(4,head.length); out.set(head,8); out.set(bytes,8+head.length);
  return { blob:new Blob([out],{type:'application/octet-stream'}), name:(rec.name||'save').replace(/[^\w\- ]+/g,'').trim().replace(/\s+/g,'-').toLowerCase()+'-'+rec.game+'.ccsave' };
}
function downloadBlob(blob,name){ const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href),4000); }
async function slotImportFile(file){
  const buf=new Uint8Array(await file.arrayBuffer()); let name=(file.name||'Imported game').replace(/\.[^.]+$/,'').replace(/[-_]+/g,' ');
  if (new TextDecoder().decode(buf.slice(0,4))===SAVE_MAGIC){ const hl=new DataView(buf.buffer,buf.byteOffset).getUint32(4); const head=JSON.parse(new TextDecoder().decode(buf.slice(8,8+hl))); const payload=buf.slice(8+hl);
    if (head.game && head.game!==PACK.id) throw new Error('This is a '+head.game+' save. Open it in that game.'); const g=await unpackBytes(payload,head.enc); if (!g||!g.player) throw new Error('That file is damaged.');
    const rec=await slotCreate(head.name||name,''); await slotWrite(rec.id,payload,head.enc,head.meta||{}); return rec; }
  const txt=new TextDecoder().decode(buf); if (/^(gz|js):/.test(txt.trim())){ const g=await unpackState(txt.trim()); if (!g||!g.player) throw new Error('That file is damaged.'); const prev=G; G=g; const p=await packBytes(); const meta=slotMetaNow(); G=prev; const rec=await slotCreate(name,''); await slotWrite(rec.id,p.bytes,p.enc,meta); return rec; }
  throw new Error('That is not a save file for this game.');
}
