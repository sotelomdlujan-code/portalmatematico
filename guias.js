/* Guías: armá un PDF nuevo con las páginas que elijas de tus libros y compartilo con tus cursos.
   - Las páginas se eligen desde la Biblioteca (➕ A la guía) o escribiendo rangos acá mismo.
   - La guía se guarda en la nube (Firestore) y se comparte dentro del Material de un curso. */
const GUIDE = {items:[], title:'Guía de ejercicios', cover:true, busy:'', list:null, note:'', book:''};
const LB_PDFLIB = 'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js';
const gdKey = (b, p) => b + '|' + p;

function guideToast(msg){
  let t = document.getElementById('gd-toast');
  if(!t){ t = document.createElement('div'); t.id = 'gd-toast'; t.style.cssText = 'position:fixed;left:50%;bottom:22px;transform:translateX(-50%);background:#26324d;color:#fff;padding:10px 16px;border-radius:12px;z-index:99;font:600 .92rem Nunito Sans,sans-serif;display:flex;gap:12px;align-items:center;box-shadow:0 6px 20px rgba(0,0,0,.3)'; document.body.appendChild(t); }
  t.innerHTML = '<span></span><button class="btn soft" style="padding:4px 10px">Ver guía</button>';
  t.firstChild.textContent = msg; t.lastChild.onclick = () => { t.remove(); tab = 'guides'; render(); };
  clearTimeout(t._h); t._h = setTimeout(() => t.remove(), 4500);
}
function guideAddMany(keys){
  let n = 0;
  keys.forEach(k => { const [b, p] = k.split('|'); if(!GUIDE.items.some(x => x.b === b && x.p === +p)){ GUIDE.items.push({b, p:+p}); n++; } });
  guideToast(n ? '✓ ' + n + ' página(s) agregadas a la guía (' + GUIDE.items.length + ' en total)' : 'Esas páginas ya estaban en la guía');
}
function guideRanges(txt, max){
  const out = [];
  for(const part of txt.split(/[,;]+/)){
    const t = part.trim(); if(!t) continue;
    const m = /^(\d+)\s*(?:-|a|–)\s*(\d+)$/.exec(t) || /^(\d+)$/.exec(t);
    if(!m) return null;
    const a = +m[1], b = +(m[2] || m[1]);
    if(a < 1 || b < a || b > max) return null;
    for(let i = a; i <= b; i++) out.push(i);
  }
  return out;
}
const bookTitle = id => (LIB.books.find(b => b.id === id) || {}).title || '(documento borrado)';

async function guidePdfLib(){
  if(window.PDFLib) return window.PDFLib;
  try { await lbScript(LB_PDFLIB); } catch(e){ throw new Error('No se pudo cargar la herramienta para armar PDF. Revisá tu conexión a internet.'); }
  return window.PDFLib;
}
const wins = t => String(t).replace(/[^\x20-\x7E\xA0-\xFF]/g, '');
async function guideBuild(){
  const P = await guidePdfLib(), out = await P.PDFDocument.create(), src = {};
  const missing = [...new Set(GUIDE.items.map(i => i.b))].filter(b => !(LIB.books.find(x => x.id === b) || {}).hasPdf && true);
  for(const b of missing){ let f = null; try { f = await lbDB.get('files', b); } catch(e){} if(!f) throw new Error('Falta el PDF original de “' + bookTitle(b) + '”. En la Biblioteca tocá “☁️ Subir PDF”.'); }
  if(GUIDE.cover){
    const font = await out.embedFont(P.StandardFonts.HelveticaBold), pg = out.addPage([595, 842]);
    const words = wins(GUIDE.title || 'Guía').split(/\s+/), lines = []; let cur = '';
    words.forEach(w => { const t = cur ? cur + ' ' + w : w; if(font.widthOfTextAtSize(t, 30) > 470 && cur){ lines.push(cur); cur = w; } else cur = t; }); if(cur) lines.push(cur);
    let y = 470 + (lines.length - 1) * 20;
    lines.forEach(l => { pg.drawText(l, {x:(595 - font.widthOfTextAtSize(l, 30)) / 2, y, size:30, font}); y -= 40; });
    const f2 = await out.embedFont(P.StandardFonts.Helvetica), sub = 'Matematica';
    pg.drawText(sub, {x:(595 - f2.widthOfTextAtSize(sub, 16)) / 2, y:y - 14, size:16, font:f2});
  }
  for(const it of GUIDE.items){
    if(!src[it.b]){ const f = await lbGetPdf(it.b); if(!f) throw new Error('No se pudo obtener el PDF de “' + bookTitle(it.b) + '”.'); src[it.b] = await P.PDFDocument.load(await f.arrayBuffer(), {ignoreEncryption:true}); }
    const [pg] = await out.copyPages(src[it.b], [it.p - 1]); out.addPage(pg);
  }
  return new Blob([await out.save()], {type:'application/pdf'});
}

async function guideStore(blob, title, npages){
  if(blob.size > LB_MAXPDF) throw new Error('La guía pesa más de 20 MB. Elegí menos páginas.');
  const buf = new Uint8Array(await blob.arrayBuffer()), n = Math.ceil(buf.length / LB_BS), id = fs.collection('guides').doc().id, ref = fs.collection('guides').doc(id);
  for(let i = 0; i < n; i += 4){
    const b = fs.batch();
    for(let j = i; j < Math.min(n, i + 4); j++) b.set(ref.collection('pdf').doc(String(j).padStart(4, '0')), {i:j, b64:lbB64(buf.subarray(j * LB_BS, (j + 1) * LB_BS))});
    await b.commit();
  }
  await ref.set({title, npages, size:buf.length, chunks:n, created:Date.now()});
  return id;
}
async function downloadGuide(id, name){
  const cs = await fs.collection('guides').doc(id).collection('pdf').orderBy('i').get();
  if(!cs.size) throw new Error('vacía');
  lbSave(new Blob(cs.docs.map(d => lbUnb64(d.data().b64)), {type:'application/pdf'}), String(name || 'guia').replace(/[\\/:*?"<>|]+/g, ' ') + '.pdf');
}
async function guideLoadList(){
  try { const sn = await fs.collection('guides').orderBy('created', 'desc').get(); GUIDE.list = sn.docs.map(d => ({id:d.id, ...d.data()})); }
  catch(e){ console.error(e); GUIDE.list = []; GUIDE.note = 'No se pudieron cargar tus guías. Revisá que hayas publicado las reglas nuevas.'; }
  if(tab === 'guides') renderGuides();
}
async function guideDelete(id){
  const g = (GUIDE.list || []).find(x => x.id === id); if(!g) return;
  if(!confirm('¿Borrar la guía “' + g.title + '”? Si ya la compartiste con un curso, los alumnos dejarán de poder descargarla.')) return;
  try {
    const ref = fs.collection('guides').doc(id), cs = await ref.collection('pdf').get();
    for(let a = 0; a < cs.docs.length; a += 400){ const b = fs.batch(); cs.docs.slice(a, a + 400).forEach(d => b.delete(d.ref)); await b.commit(); }
    await ref.delete(); GUIDE.list = GUIDE.list.filter(x => x.id !== id); renderGuides();
  } catch(e){ console.error(e); alert('No se pudo borrar la guía.'); }
}
function guideShare(id){
  const g = (GUIDE.list || []).find(x => x.id === id); if(!g) return;
  if(!courses.length){ alert('Primero creá una escuela y un curso.'); return; }
  const opts = courses.map(c => `<option value="${c.id}" ${c.id === courseId ? 'selected' : ''}>${esc((c.escuela ? c.escuela + ' · ' : '') + c.name)}</option>`).join('');
  $('#frm').innerHTML = `<h3>Compartir “${esc(g.title)}”</h3><p class="note">Se agrega al <b>Material</b> del curso y los alumnos la descargan desde el link de su curso.</p>
    <label>Curso</label><select id="gs-c">${opts}</select>
    <div class="acts" style="margin-top:22px"><button class="btn" id="gs-ok">Compartir</button><button class="btn soft" id="gs-x">Cancelar</button></div>`;
  $('#gs-x').onclick = () => $('#dlg').close();
  $('#gs-ok').onclick = async () => {
    const cid = $('#gs-c').value, now = Date.now();
    try {
      await fs.collection('courses').doc(cid).collection('materials').add({title:g.title, descripcion:'', files:[], guideId:g.id, guideTitle:g.title, created:now, updated:now});
      $('#dlg').close(); GUIDE.note = '✓ “' + g.title + '” ya está en el Material de ' + ((courses.find(c => c.id === cid) || {}).name || 'el curso') + '.'; renderGuides();
    } catch(e){ console.error(e); alert('No se pudo compartir.'); }
  };
  $('#dlg').showModal();
}

function renderGuides(){
  const m = $('#main');
  if(!LIB.loaded){ m.innerHTML = `<div class="top"><h2>Guías</h2></div><div class="empty"><div class="big">Abriendo la biblioteca…</div></div>`; libEnsure(); return; }
  if(GUIDE.list === null){ GUIDE.list = []; guideLoadList(); }
  const items = GUIDE.items, bks = LIB.books;
  const rows = items.map((it, i) => `<div class="gd-item"><span class="gd-t"><b>${esc(bookTitle(it.b))}</b> <small>· página ${it.p}</small></span><button class="ib" data-up="${i}" title="Subir">▲</button><button class="ib" data-dn="${i}" title="Bajar">▼</button><button class="ib" data-rm="${i}" title="Quitar">✕</button></div>`).join('');
  m.innerHTML = `<div class="top"><h2>Guías</h2></div><p class="lead">Armá un PDF nuevo con las páginas que elijas de tus libros y compartilo con tus alumnos.</p>
  ${GUIDE.note ? `<div class="lb-note">${esc(GUIDE.note)}</div>` : ''}
  <div class="gd-box"><h3 style="margin:0 0 4px">1 · Elegí las páginas</h3>
    <p class="note" style="margin:0 0 10px">Buscá en la <b>Biblioteca</b> y tocá “➕ A la guía”, o escribí los números de página acá.</p>
    ${bks.length ? `<div class="row" style="grid-template-columns:1.4fr 1fr auto;align-items:end"><div><label>Libro</label><select id="gd-b">${bks.map(b => `<option value="${b.id}" ${b.id === GUIDE.book ? 'selected' : ''}>${esc(b.title)} (${b.npages || (b.pages || []).length} págs.)</option>`).join('')}</select></div><div><label>Páginas (ej.: 12-15, 20)</label><input id="gd-r" placeholder="12-15, 20"></div><button class="btn soft" id="gd-add">Agregar</button></div>` : '<p class="note">Primero cargá un PDF en la Biblioteca.</p>'}
  </div>
  <div class="gd-box"><h3 style="margin:0 0 8px">2 · Ordenalas y armá el PDF <small style="color:var(--mu);font-weight:400">(${items.length} página${items.length === 1 ? '' : 's'})</small></h3>
    ${rows || '<p class="note">Todavía no agregaste páginas.</p>'}
    <label>Título de la guía</label><input id="gd-t" value="${esc(GUIDE.title)}">
    <label class="chk"><input type="checkbox" id="gd-c" ${GUIDE.cover ? 'checked' : ''}> Agregar una carátula con el título</label>
    <div id="gd-prog" class="note"></div>
    <div class="acts"><button class="btn" id="gd-save" ${items.length ? '' : 'disabled'}>💾 Guardar en mis guías</button><button class="btn soft" id="gd-dl" ${items.length ? '' : 'disabled'}>⬇ Solo descargar</button>${items.length ? '<button class="btn del" id="gd-clr">Vaciar</button>' : ''}</div>
  </div>
  <h3 class="lb-h">Mis guías (${(GUIDE.list || []).length})</h3>
  ${(GUIDE.list || []).length ? GUIDE.list.map(g => `<div class="gd-item"><span class="gd-t"><b>${esc(g.title)}</b><br><small>${g.npages} páginas · ${new Date(g.created).toLocaleDateString('es-AR')}</small></span><button class="btn soft" data-sh="${g.id}">Compartir con un curso</button><button class="btn soft" data-dl="${g.id}">⬇</button><button class="ib" data-del="${g.id}" title="Borrar">🗑</button></div>`).join('') : '<p class="note">Todavía no guardaste guías.</p>'}`;
  const rd = () => { GUIDE.title = $('#gd-t').value; GUIDE.cover = $('#gd-c').checked; };
  const rerender = () => { rd(); renderGuides(); };
  if($('#gd-add')) $('#gd-add').onclick = () => {
    const id = $('#gd-b').value, bk = bks.find(b => b.id === id), max = bk.npages || (bk.pages || []).length, list = guideRanges($('#gd-r').value, max);
    GUIDE.book = id;
    if(!list || !list.length){ alert('Escribí las páginas así: 12-15, 20 (el libro tiene ' + max + ' páginas).'); return; }
    rd(); list.forEach(p => { if(!GUIDE.items.some(x => x.b === id && x.p === p)) GUIDE.items.push({b:id, p}); }); GUIDE.note = ''; renderGuides();
  };
  m.querySelectorAll('[data-up]').forEach(b => b.onclick = () => { const i = +b.dataset.up; if(i > 0){ [items[i - 1], items[i]] = [items[i], items[i - 1]]; rerender(); } });
  m.querySelectorAll('[data-dn]').forEach(b => b.onclick = () => { const i = +b.dataset.dn; if(i < items.length - 1){ [items[i + 1], items[i]] = [items[i], items[i + 1]]; rerender(); } });
  m.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => { items.splice(+b.dataset.rm, 1); rerender(); });
  if($('#gd-clr')) $('#gd-clr').onclick = () => { if(confirm('¿Vaciar la guía en armado?')){ GUIDE.items = []; GUIDE.note = ''; rerender(); } };
  const run = async (save) => {
    rd(); if(!items.length) return;
    const pr = $('#gd-prog'); pr.textContent = 'Armando el PDF…'; $('#gd-save').disabled = $('#gd-dl').disabled = true;
    try {
      const blob = await guideBuild(), title = (GUIDE.title || 'Guía').trim() || 'Guía';
      if(save){ pr.textContent = 'Guardando en la nube…'; await guideStore(blob, title, items.length); GUIDE.note = '✓ Guía guardada. Ahora podés compartirla con un curso desde “Mis guías”.'; GUIDE.list = null; GUIDE.items = []; renderGuides(); }
      else { lbSave(blob, title.replace(/[\\/:*?"<>|]+/g, ' ') + '.pdf'); pr.textContent = ''; $('#gd-save').disabled = $('#gd-dl').disabled = false; }
    } catch(e){ console.error(e); pr.textContent = '⚠ ' + (e.message || 'No se pudo armar la guía.'); $('#gd-save').disabled = $('#gd-dl').disabled = false; }
  };
  $('#gd-save').onclick = () => run(true); $('#gd-dl').onclick = () => run(false);
  m.querySelectorAll('[data-sh]').forEach(b => b.onclick = () => guideShare(b.dataset.sh));
  m.querySelectorAll('[data-del]').forEach(b => b.onclick = () => guideDelete(b.dataset.del));
  m.querySelectorAll('[data-dl]').forEach(b => b.onclick = async () => { const g = GUIDE.list.find(x => x.id === b.dataset.dl); b.disabled = true; try { await downloadGuide(g.id, g.title); } catch(e){ alert('No se pudo descargar la guía.'); } b.disabled = false; });
}
