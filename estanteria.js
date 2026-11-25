/* Estantería por editoriales (se muestra dentro de la Biblioteca).
   - Cada documento tiene un campo `editorial` en Firestore (library/{id}.editorial). Las reglas actuales ya lo permiten (la profesora escribe).
   - Al cargar un PDF se intenta detectar la editorial leyendo el título y las primeras páginas (portada, legales).
   - La profesora puede cambiarla tocando el libro → “Cambiar editorial”, o arrastrando el lomo a otro estante (en compu).
   - Las personas habilitadas (solo lectura) ven la estantería, pero no pueden mover libros. */

const SH_BASE = ['Springer', 'Pearson / Addison-Wesley', 'McGraw-Hill Education', 'Reverté / Limusa'];
const SH_SIN = 'Sin clasificar';

/* Colores de los lomos [fondo, texto], según la editorial (inspirados en la foto de referencia) */
const SH_PAL = {
  'Springer':                 [['#f2b134', '#2a1b00'], ['#e8e4d8', '#222'], ['#2f6fb5', '#fff'], ['#e07b2f', '#fff'], ['#1f3d63', '#fff'], ['#f6d86a', '#2a1b00'], ['#9ec3e6', '#12263d'], ['#c9ccd1', '#222']],
  'Pearson / Addison-Wesley': [['#b4262e', '#fff'], ['#1f4f8f', '#fff'], ['#2a7a8c', '#fff'], ['#e9e3d3', '#222'], ['#7a1f2b', '#fff'], ['#3b6fb0', '#fff'], ['#16355e', '#fff'], ['#d6a23a', '#2a1b00']],
  'McGraw-Hill Education':    [['#1f7a52', '#fff'], ['#17334a', '#fff'], ['#e07b2f', '#fff'], ['#2f9d8f', '#fff'], ['#e9e3d3', '#222'], ['#0f5a3e', '#fff'], ['#d8b24a', '#2a1b00'], ['#2a6fa8', '#fff']],
  'Reverté / Limusa':         [['#6b1a2a', '#f3e6cf'], ['#1b3a63', '#f3e6cf'], ['#8a2a36', '#f3e6cf'], ['#123055', '#f3e6cf'], ['#7c2231', '#f3e6cf'], ['#264b7a', '#f3e6cf']],
  _:                          [['#7a5a3a', '#fff'], ['#3d6b5c', '#fff'], ['#5a4a8a', '#fff'], ['#b9862f', '#2a1b00'], ['#2f4f6f', '#fff'], ['#a8453a', '#fff'], ['#d9d2c0', '#222']]
};

/* ---------- detección automática de la editorial ---------- */
const SH_DET = [
  [/springer/, 'Springer'],
  [/pearson|addison[\s-]*wesley|prentice[\s-]*hall/, 'Pearson / Addison-Wesley'],
  [/mc\s*-?\s*graw|mcgraw/, 'McGraw-Hill Education'],
  [/reverte|limusa/, 'Reverté / Limusa']
];
const SH_GEN = new Set(['education', 'editorial', 'editorial', 'ediciones', 'libros', 'books', 'press', 'publishing', 'universidad', 'sin', 'clasificar']);
const shEsc = t => t;                                             // las palabras ya son alfanuméricas: no hace falta escapar
function shDetect(title, pages){
  const nrm = typeof lbNrm === 'function' ? lbNrm : s => String(s).toLowerCase();
  const head = nrm(title || '') + ' ' + (pages || []).slice(0, 8).map(t => nrm(t || '')).join(' ');
  let best = '', bestN = 0;
  shNames().forEach(name => {
    const n = nrm(name), parts = (n.match(/[a-z0-9]+/g) || []).filter(w => w.length >= 5 && !SH_GEN.has(w)).map(shEsc);
    SH_DET.forEach(([re]) => { if(re.test(n)) parts.push(re.source); });          // sinónimos conocidos (Prentice Hall, “Mc Graw”, etc.)
    if(!parts.length) return;
    const m = head.match(new RegExp(parts.join('|'), 'g'));
    if(m && m.length > bestN){ best = name; bestN = m.length; }
  });
  return best;
}

/* ---------- datos ---------- */
const shHash = s => { let h = 2166136261; for(let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const SH = {list:null, edit:false};                                  // list: nombres de los estantes, en orden (se guarda en library/_estantes)
async function shLoad(){
  try { const d = await fs.collection('library').doc('_estantes').get(); SH.list = (d.exists && Array.isArray(d.data().shelves)) ? d.data().shelves : null; }
  catch(e){ console.warn('No se pudo leer la lista de estantes', e); SH.list = null; }
}
function shNames(){
  const base = (SH.list || SH_BASE).slice();
  [...new Set(LIB.books.map(b => (b.editorial || '').trim()).filter(e => e && !base.includes(e)))].sort((a, b) => a.localeCompare(b, 'es')).forEach(e => base.push(e));
  return base;
}
async function shSaveList(list){ await fs.collection('library').doc('_estantes').set({shelves:list, updated:Date.now()}); SH.list = list; }
async function shBatchEd(pairs){                                       // pairs: [[libro, editorial], ...]
  for(let a = 0; a < pairs.length; a += 400){ const bt = fs.batch(); pairs.slice(a, a + 400).forEach(([b, e]) => bt.update(fs.collection('library').doc(b.id), {editorial:e})); await bt.commit(); }
  pairs.forEach(([b, e]) => b.editorial = e);
}
function shSections(){
  const names = shNames(), map = new Map(names.map(n => [n, []])), sin = [];
  LIB.books.forEach(b => { const e = (b.editorial || '').trim(); if(e && map.has(e)) map.get(e).push(b); else sin.push(b); });
  const out = names.map(n => ({name:n, books:map.get(n)}));
  if(sin.length) out.push({name:SH_SIN, books:sin, sin:true});
  const tl = (a, b) => (a.title || '').localeCompare(b.title || '', 'es', {numeric:true});
  out.forEach(s => s.books.sort(tl));
  return out;
}

/* ---------- dibujo ---------- */
function shSpine(b, ed){
  const pal = SH_PAL[ed] || SH_PAL._, h0 = shHash(b.id + b.title), c = pal[h0 % pal.length];
  const w = Math.max(24, Math.min(46, Math.round(20 + (b.npages || (b.pages || []).length || 100) / 14)));
  const h = 118 + (h0 >> 3) % 40;
  const tip = b.title + ' · ' + (b.npages || (b.pages || []).length) + ' páginas';
  return `<button type="button" class="sh-bk" data-id="${b.id}" ${lbRO() ? '' : 'draggable="true"'} title="${esc(tip)}" aria-label="${esc(tip)}"><span class="sh-sp" style="width:${w}px;height:${h}px;background-color:${c[0]};color:${c[1]}"><b>${esc(b.title)}</b></span></button>`;
}
function shelfHTML(){
  if(!LIB.loaded) return '';
  const secs = shSections(), RO = lbRO(), ed = !RO && SH.edit, real = secs.filter(s => !s.sin).length;
  const sinN = LIB.books.filter(b => !(b.editorial || '').trim()).length;
  let k = -1;
  return `<details class="lb-docsbox lib-ui sh-box" id="sh-box" open><summary class="lb-h">🗄️ Estantería por editoriales (${LIB.books.length})</summary>
    <p class="note" style="margin:0 0 10px">${ed ? 'Modo edición: con los botones del cartel de cada estante podés <b>moverlo</b>, <b>cambiarle el nombre</b> o <b>quitarlo</b>. Los libros nunca se borran: si quitás un estante, sus libros pasan a “Sin clasificar”.' : (LIB.books.length ? 'Tocá un libro para verlo o descargarlo.' : (RO ? 'Todavía no hay libros.' : 'Cuando cargues PDF, aparecen acá, separados por editorial.'))}${RO || ed ? '' : ' Para cambiar un libro de estante: tocalo → “Cambiar editorial” (en la compu también podés arrastrarlo).'}</p>
    ${RO ? '' : `<div class="acts" style="margin:0 0 14px"><button type="button" class="btn ${ed ? '' : 'soft'}" id="sh-edit">${ed ? '✔ Listo' : '✏️ Editar estantes'}</button>${ed ? '<button type="button" class="btn" id="sh-add">➕ Nuevo estante</button>' : ''}</div>`}
    <div class="sh-grid">${secs.map(s => { if(!s.sin) k++; const i = k;
      return `<section class="sh-sec${s.sin ? ' sh-sinc' : ''}" data-ed="${esc(s.name)}"><div class="sh-plaque"><span>${s.sin ? esc(s.name) : 'Editorial: ' + esc(s.name)}</span><small>${s.books.length}</small>${ed && !s.sin ? `<span class="sh-ctl"><button type="button" data-sa="up" data-ed="${esc(s.name)}" title="Mover antes" ${i === 0 ? 'disabled' : ''}>◀</button><button type="button" data-sa="down" data-ed="${esc(s.name)}" title="Mover después" ${i === real - 1 ? 'disabled' : ''}>▶</button><button type="button" data-sa="ren" data-ed="${esc(s.name)}" title="Cambiar nombre">✏️</button><button type="button" data-sa="del" data-ed="${esc(s.name)}" title="Quitar estante">🗑</button></span>` : ''}${!ed && s.books.length ? `<button type="button" class="sh-find" data-ed="${esc(s.name)}" title="Buscar solo en los libros de esta estantería">🔍</button>` : ''}</div>
      <div class="sh-row">${s.books.map(b => shSpine(b, s.name)).join('')}${s.books.length ? '' : '<em class="sh-vac">Estante vacío</em>'}<i class="sh-fill"></i></div></section>`; }).join('')}</div>
    ${!RO && !real && !ed ? '<p class="note">No hay estantes. Tocá “Editar estantes” → “Nuevo estante” para crear el primero.</p>' : ''}
    ${!RO && sinN && real && LIB.books.length ? `<div class="acts" style="margin-top:12px"><button type="button" class="btn soft" id="sh-auto">🏷 Detectar la editorial de los ${sinN} libro(s) sin clasificar</button></div>` : ''}
  </details>`;
}

/* ---------- acciones ---------- */
async function shSetEditorial(id, ed){
  const b = LIB.books.find(x => x.id === id); if(!b) return;
  ed = (ed || '').trim(); if(ed === SH_SIN) ed = '';
  await fs.collection('library').doc(id).update({editorial:ed});
  b.editorial = ed;
}
function shRefresh(){ if(typeof tab !== 'undefined' && tab === 'lib') { const y = window.scrollY; renderLib(); window.scrollTo(0, y); } }
function shChoose(id){
  const b = LIB.books.find(x => x.id === id); if(!b) return;
  const cur = (b.editorial || '').trim(), names = shNames();
  $('#frm').innerHTML = `<h3>Cambiar de editorial</h3><p class="note" style="margin:0 0 10px"><b>${esc(b.title)}</b></p>
    <div class="sh-opts">${names.map(n => `<label class="chk"><input type="radio" name="sh-ed" value="${esc(n)}" ${n === cur ? 'checked' : ''}> ${esc(n)}</label>`).join('')}
    <label class="chk"><input type="radio" name="sh-ed" value="" ${!cur ? 'checked' : ''}> ${SH_SIN}</label>
    <label class="chk"><input type="radio" name="sh-ed" value="__otra"> Otra editorial…</label></div>
    <input id="sh-new" placeholder="Nombre de la editorial" autocomplete="off" hidden style="margin-top:8px">
    <div class="acts" style="margin-top:20px"><button class="btn" id="sh-ok">Guardar</button><button class="btn soft" id="sh-cx">Cancelar</button></div>`;
  const nw = $('#sh-new');
  document.querySelectorAll('input[name=sh-ed]').forEach(r => r.onchange = () => { const o = document.querySelector('input[name=sh-ed]:checked').value === '__otra'; nw.hidden = !o; if(o) nw.focus(); });
  $('#sh-cx').onclick = () => $('#dlg').close();
  $('#sh-ok').onclick = async () => {
    let v = document.querySelector('input[name=sh-ed]:checked').value;
    if(v === '__otra'){ v = nw.value.trim(); if(!v){ nw.focus(); return; } }
    try { if(v && !names.includes(v)){ if(!shValid(v)) return; await shSaveList([...names, v]); } await shSetEditorial(id, v); $('#dlg').close(); shRefresh(); } catch(e){ console.error(e); alert('No se pudo guardar. Revisá tu conexión.'); }
  };
  $('#dlg').showModal();
}
function shBook(id){
  const b = LIB.books.find(x => x.id === id); if(!b) return;
  const RO = lbRO(), n = b.npages || (b.pages || []).length;
  $('#frm').innerHTML = `<h3>${esc(b.title)}</h3><p class="note" style="margin:0 0 4px">${esc((b.editorial || '').trim() || SH_SIN)} · ${n} páginas${b.hasPdf ? '' : ' · PDF sin subir a la nube'}</p>
    <div class="acts" style="margin-top:18px"><button class="btn" id="sh-v">📄 Ver</button>${b.hasPdf ? '<button class="btn soft" id="sh-d">⬇ Descargar</button>' : ''}${RO ? '' : '<button class="btn soft" id="sh-e">🏷 Cambiar editorial</button>'}<button class="btn soft" id="sh-c">Cerrar</button></div>`;
  $('#sh-c').onclick = () => $('#dlg').close();
  $('#sh-v').onclick = () => { $('#dlg').close(); lbViewer(id, 1); };
  const d = $('#sh-d'); if(d) d.onclick = () => lbDownload(id, d);
  const e = $('#sh-e'); if(e) e.onclick = () => shChoose(id);
  $('#dlg').showModal();
}
function shFind(ed){
  const ids = shSections().find(s => s.name === ed);
  if(!ids || !ids.books.length) return;
  LIB.inc = new Set(ids.books.map(b => b.id)); LIB.res = null; LIB.note = 'Buscando solo en: ' + ed + ' (' + ids.books.length + ' libro' + (ids.books.length === 1 ? '' : 's') + '). Para volver a todos, abrí “Buscar en” y tocá “Todos”.';
  renderLib(); window.scrollTo({top:0, behavior:'smooth'});
  const q = document.getElementById('lb-q'); if(q) q.focus({preventScroll:true});
}
function shValid(v, except){
  v = (v || '').trim(); if(!v) return '';
  if(v.length > 60){ alert('El nombre es muy largo (máximo 60 letras).'); return ''; }
  if(lbNrm(v) === lbNrm(SH_SIN)){ alert('Ese nombre está reservado para los libros sin estante.'); return ''; }
  if(shNames().some(n => n !== except && lbNrm(n) === lbNrm(v))){ alert('Ya existe un estante con ese nombre.'); return ''; }
  return v;
}
function shAddShelf(){
  askName('Nuevo estante (nombre de la editorial)', '', async v => { v = shValid(v); if(!v) return; await shSaveList([...shNames(), v]); shRefresh(); });
}
function shRenameShelf(old){
  askName('Cambiar el nombre del estante', old, async v => {
    v = shValid(v, old); if(!v || v === old) return;
    const pairs = LIB.books.filter(b => (b.editorial || '').trim() === old).map(b => [b, v]);
    await shSaveList(shNames().map(n => n === old ? v : n));            // primero la lista, después los libros
    await shBatchEd(pairs); shRefresh();
  });
}
async function shDeleteShelf(name){
  const bks = LIB.books.filter(b => (b.editorial || '').trim() === name);
  if(!confirm('¿Quitar el estante “' + name + '”?' + (bks.length ? '\n\nLos ' + bks.length + ' libro(s) NO se borran: pasan a “' + SH_SIN + '”.' : ''))) return;
  try { await shBatchEd(bks.map(b => [b, ''])); await shSaveList(shNames().filter(n => n !== name)); shRefresh(); }
  catch(e){ console.error(e); alert('No se pudo quitar el estante. Revisá tu conexión.'); }
}
async function shMoveShelf(name, dir){
  const l = shNames(), i = l.indexOf(name), j = i + dir; if(i < 0 || j < 0 || j >= l.length) return;
  [l[i], l[j]] = [l[j], l[i]];
  try { await shSaveList(l); shRefresh(); } catch(e){ console.error(e); alert('No se pudo guardar el orden. Revisá tu conexión.'); }
}
async function shAuto(btn){
  const todo = LIB.books.filter(b => !(b.editorial || '').trim());
  if(!todo.length) return;
  btn.disabled = true; btn.textContent = 'Revisando…';
  const hits = todo.map(b => [b, shDetect(b.title, b.pages)]).filter(x => x[1]);
  try {
    await shBatchEd(hits.map(([b, e]) => [b, e]));
    LIB.note = hits.length ? 'Listo: ' + hits.length + ' libro(s) ya están en su estante. ' + (todo.length - hits.length ? 'Los otros ' + (todo.length - hits.length) + ' no mencionan una editorial conocida: movelos a mano.' : '') : 'No pude reconocer la editorial de ninguno (el texto de sus primeras páginas no la menciona). Movelos a mano: tocá el libro → “Cambiar editorial”.';
  } catch(e){ console.error(e); LIB.note = 'No se pudo guardar la clasificación. Revisá tu conexión.'; }
  shRefresh();
}
function shelfBind(){
  const box = document.getElementById('sh-box'); if(!box) return;
  let dragId = '';
  box.onclick = e => {
    const ed = e.target.closest('#sh-edit'); if(ed){ SH.edit = !SH.edit; shRefresh(); return; }
    if(e.target.closest('#sh-add')){ shAddShelf(); return; }
    const c = e.target.closest('[data-sa]'); if(c){ const n = c.dataset.ed, a = c.dataset.sa; if(a === 'ren') shRenameShelf(n); else if(a === 'del') shDeleteShelf(n); else shMoveShelf(n, a === 'up' ? -1 : 1); return; }
    const f = e.target.closest('.sh-find'); if(f){ shFind(f.dataset.ed); return; }
    const a = e.target.closest('#sh-auto'); if(a){ shAuto(a); return; }
    const k = e.target.closest('.sh-bk'); if(k) shBook(k.dataset.id);
  };
  if(lbRO()) return;
  box.ondragstart = e => { const k = e.target.closest && e.target.closest('.sh-bk'); if(!k) return; dragId = k.dataset.id; e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', dragId); } catch(_){} k.classList.add('sh-drag'); };
  box.ondragend = () => { dragId = ''; box.querySelectorAll('.sh-drag,.sh-over').forEach(x => x.classList.remove('sh-drag', 'sh-over')); };
  box.ondragover = e => { const s = e.target.closest('.sh-sec'); if(!s || !dragId) return; e.preventDefault(); box.querySelectorAll('.sh-over').forEach(x => { if(x !== s) x.classList.remove('sh-over'); }); s.classList.add('sh-over'); };
  box.ondrop = async e => {
    const s = e.target.closest('.sh-sec'); if(!s || !dragId) return; e.preventDefault();
    const id = dragId; dragId = '';
    const b = LIB.books.find(x => x.id === id); if(!b) return;
    const to = s.dataset.ed === SH_SIN ? '' : s.dataset.ed;
    if(((b.editorial || '').trim()) === to){ box.querySelectorAll('.sh-over').forEach(x => x.classList.remove('sh-over')); return; }
    try { await shSetEditorial(id, to); shRefresh(); } catch(err){ console.error(err); alert('No se pudo mover el libro. Revisá tu conexión.'); }
  };
}

/* ---------- estilos ---------- */
(function(){
  const css = `
.sh-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(440px,100%),1fr));gap:18px 16px}
.sh-sec{min-width:0;border-radius:6px;transition:box-shadow .15s}
.sh-sec.sh-over{box-shadow:0 0 0 3px var(--ac,#4263eb)}
.sh-plaque{display:flex;align-items:center;gap:8px;background:linear-gradient(#4a3426,#37261b);color:#f1e3c8;border:1px solid #8a6a45;border-bottom:0;border-radius:6px 6px 0 0;padding:8px 12px;font:600 .88rem/1.2 var(--fd,Georgia,serif);letter-spacing:.07em;text-transform:uppercase;box-shadow:inset 0 1px 0 rgba(255,255,255,.12)}
.sh-plaque span{flex:1;min-width:0;overflow-wrap:anywhere}
.sh-plaque small{font:700 .72rem var(--fb,sans-serif);letter-spacing:0;background:rgba(255,255,255,.14);padding:2px 8px;border-radius:999px}
.sh-find{border:1px solid #8a6a45;background:rgba(255,255,255,.1);color:#f1e3c8;border-radius:8px;padding:3px 8px;cursor:pointer;font-size:.9rem;line-height:1}
.sh-find:hover{background:rgba(255,255,255,.22)}
.sh-row{display:flex;flex-wrap:wrap;align-items:flex-end;padding:10px 12px 0;background:linear-gradient(#2a1c12,#3a281a);border:1px solid #5a3f27;border-top:0;border-radius:0 0 6px 6px;box-shadow:inset 0 8px 14px rgba(0,0,0,.35);min-height:180px;align-content:flex-start}
.sh-bk,.sh-fill{height:172px;border:0;border-bottom:12px solid #8a5a2b;box-sizing:border-box;margin:0}
.sh-bk{display:flex;align-items:flex-end;padding:0 1px;background:none;cursor:pointer;font:inherit;border-bottom-color:#8a5a2b}
.sh-fill{flex:1 1 0;min-width:0;padding:0;background:none;border-bottom-color:#8a5a2b;font-style:normal}
.sh-sp{display:flex;align-items:center;justify-content:center;box-sizing:border-box;border-radius:2px 2px 0 0;overflow:hidden;padding:6px 0;
  background-image:linear-gradient(90deg,rgba(255,255,255,.22),rgba(255,255,255,0) 22%,rgba(0,0,0,0) 70%,rgba(0,0,0,.28)),linear-gradient(transparent 9%,rgba(255,255,255,.55) 9% 11%,transparent 11% 89%,rgba(255,255,255,.55) 89% 91%,transparent 91%);
  box-shadow:1px 0 2px rgba(0,0,0,.4);transition:transform .12s,filter .12s}
.sh-sp b{writing-mode:vertical-rl;transform:rotate(180deg);font:700 .68rem/1.1 var(--fb,sans-serif);max-height:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;letter-spacing:.02em}
.sh-bk:hover .sh-sp,.sh-bk:focus-visible .sh-sp{transform:translateY(-10px);filter:brightness(1.12)}
.sh-bk:focus-visible{outline:2px solid #ffe066;outline-offset:1px}
.sh-bk.sh-drag{opacity:.4}
.sh-vac{height:172px;box-sizing:border-box;border-bottom:12px solid #8a5a2b;display:flex;align-items:center;color:#d9c7a6;opacity:.75;font:600 .9rem var(--fb,sans-serif);padding:0 6px 8px;flex:0 0 auto}
.sh-sinc .sh-plaque{background:linear-gradient(#55524d,#3f3d39)}
.sh-ctl{display:flex;gap:4px;flex:0 0 auto}.sh-ctl button{border:1px solid #8a6a45;background:rgba(255,255,255,.1);color:#f1e3c8;border-radius:8px;padding:4px 8px;cursor:pointer;font-size:.85rem;line-height:1;min-width:30px}.sh-ctl button:hover:not(:disabled){background:rgba(255,255,255,.24)}.sh-ctl button:disabled{opacity:.3;cursor:default}
.sh-opts{display:flex;flex-direction:column;gap:6px}
@media (max-width:520px){.sh-sp b{font-size:.62rem}}
@media print{.sh-box{display:none}}
`;
  const s = document.createElement('style'); s.id = 'sh-css'; s.textContent = css; document.head.appendChild(s);
})();
