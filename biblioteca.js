/* Biblioteca: cargá tus PDF y libros y buscá por tema (solo para la docente).
   - El texto de cada documento se guarda en Firestore (el PDF original queda en este navegador).
   - Si el PDF es una imagen (escaneado), se puede leer con OCR.
   - La búsqueda solo mira lo que cargaste: no inventa nada. */
const LIB = {books:[], pages:[], loaded:false, loading:false, err:'', res:null, busy:null, cancel:false, inc:null, pick:new Set(), q:{topic:'', text:'', mode:'all'}};
const LB_PDFJS = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/';
const LB_TESS = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';

/* ---------- almacenamiento local en el navegador (IndexedDB) ---------- */
const lbDB = (() => {
  let db;
  const open = () => db || (db = new Promise((ok, no) => {
    const r = indexedDB.open('aula_biblioteca', 1);
    r.onupgradeneeded = () => { r.result.createObjectStore('books', {keyPath:'id'}); r.result.createObjectStore('files'); };
    r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error);
  }));
  const run = async (store, mode, fn) => { const d = await open(); return new Promise((ok, no) => { const t = d.transaction(store, mode), rq = fn(t.objectStore(store)); t.oncomplete = () => ok(rq && rq.result); t.onerror = () => no(t.error); t.onabort = () => no(t.error); }); };
  return {
    get: (s, k) => run(s, 'readonly', o => o.get(k)),
    all: s => run(s, 'readonly', o => o.getAll()),
    put: (s, v, k) => run(s, 'readwrite', o => k === undefined ? o.put(v) : o.put(v, k)),
    del: (s, k) => run(s, 'readwrite', o => o.delete(k))
  };
})();

/* ---------- normalización y búsqueda ---------- */
const lbNrm = s => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const lbStem = w => {
  if(w.length > 4){ if(w.endsWith('ces')) return w.slice(0, -3) + 'z'; if(w.endsWith('es') && w.length > 5) return w.slice(0, -2); }
  if(w.length > 3 && w.endsWith('s')) return w.slice(0, -1);
  return w;
};
const lbStemText = s => (lbNrm(s).match(/[a-z0-9]+/g) || []).map(lbStem).join(' ');
const LB_STOP = new Set('de la el los las un una unos unas en y o u que del al por con para se su sus es son como mas pero sin sobre entre este esta esto ese esa eso lo le les'.split(' '));

/* Palabras clave de cada tema: "s" = frases que lo identifican; "w" = palabras comunes que solo suman si aparecen varias. */
const LB_KEYS = {
  enteros:{s:['numeros enteros','numero entero','regla de los signos','valor absoluto','recta numerica'],w:['entero','enteros','opuesto','signo']},
  fracciones:{s:['fraccion','fracciones','numeros racionales','fracciones equivalentes','denominador comun'],w:['numerador','denominador','racional']},
  ecuacion1:{s:['ecuacion de primer grado','ecuaciones de primer grado','ecuacion lineal','ecuaciones lineales','resolver ecuaciones','despejar la incognita'],w:['ecuacion','incognita','despejar','miembro']},
  proporcionalidad:{s:['proporcionalidad directa','proporcionalidad inversa','regla de tres','constante de proporcionalidad','magnitudes proporcionales'],w:['proporcional','proporcion','razon']},
  porcentaje:{s:['porcentaje','por ciento','tanto por ciento','descuento','recargo','aumento porcentual'],w:['interes','precio','iva']},
  geometria:{s:['perimetro','area del rectangulo','area del triangulo','area del trapecio','area del circulo','area de un','area de la figura'],w:['area','rectangulo','triangulo','trapecio','circulo','cuadrado','superficie']},
  potencias:{s:['potenciacion','propiedades de la potenciacion','base y exponente','potencia de potencia','exponente negativo'],w:['potencia','exponente','base']},
  pitagoras:{s:['teorema de pitagoras','pitagoras','hipotenusa'],w:['cateto','catetos','triangulo rectangulo']},
  funcion_lineal:{s:['funcion lineal','funciones lineales','funcion afin','pendiente de la recta','ordenada al origen'],w:['pendiente','recta','funcion','grafico']},
  sistemas:{s:['sistema de ecuaciones','sistemas de ecuaciones','metodo de sustitucion','metodo de igualacion','metodo de reduccion'],w:['sustitucion','igualacion','reduccion','sistema']},
  factoreo:{s:['factoreo','factorizacion','factor comun','diferencia de cuadrados','trinomio cuadrado perfecto','casos de factoreo'],w:['factor','factorizar','cuadrado perfecto']},
  estadistica:{s:['estadistica','media aritmetica','mediana','moda','tabla de frecuencias','frecuencia absoluta','grafico de barras'],w:['frecuencia','promedio','datos','grafico']},
  probabilidad:{s:['probabilidad','casos favorables','casos posibles','experimento aleatorio','regla de laplace'],w:['suceso','azar','evento','dado']},
  cuadratica:{s:['ecuacion cuadratica','ecuacion de segundo grado','ecuaciones de segundo grado','formula resolvente','discriminante'],w:['raiz','raices','cuadratica','segundo grado']},
  trigonometria:{s:['trigonometria','razones trigonometricas','seno','coseno','tangente'],w:['angulo','hipotenusa','cateto opuesto','cateto adyacente']},
  exp_log:{s:['logaritmo','logaritmos','funcion exponencial','funcion logaritmica','ecuacion exponencial'],w:['exponencial','logaritmica','base']},
  derivadas:{s:['derivada','derivadas','recta tangente','reglas de derivacion','derivar'],w:['derivacion','pendiente','funcion']},
  divisibilidad:{s:['divisibilidad','criterios de divisibilidad','maximo comun divisor','minimo comun multiplo','numeros primos','factores primos'],w:['multiplo','divisor','primo','mcm']},
  decimales:{s:['numeros decimales','expresion decimal','expresiones decimales','coma decimal','operaciones con decimales'],w:['decimal','decimales','coma']},
  angulos:{s:['angulos complementarios','angulos suplementarios','angulos opuestos por el vertice','suma de los angulos interiores','rectas paralelas'],w:['angulo','angulos','bisectriz','transversal','grados']},
  radicacion:{s:['radicacion','raiz cuadrada','raiz cubica','radicando','extraer factores'],w:['radical','raiz','indice']},
  notacion_cientifica:{s:['notacion cientifica','potencias de 10','potencias de diez'],w:['potencia de diez','mantisa']},
  expresiones_alg:{s:['expresiones algebraicas','expresion algebraica','terminos semejantes','propiedad distributiva','lenguaje algebraico','valor numerico'],w:['monomio','termino','variable']},
  polinomios:{s:['polinomio','polinomios','grado de un polinomio','division de polinomios','regla de ruffini','teorema del resto'],w:['monomio','grado','coeficiente']},
  inecuaciones:{s:['inecuacion','inecuaciones','desigualdad','desigualdades','solucion de una inecuacion'],w:['mayor que','menor que','intervalo']},
  semejanza:{s:['semejanza','triangulos semejantes','figuras semejantes','teorema de thales','razon de semejanza','thales'],w:['proporcional','escala','homotecia']},
  cuerpos:{s:['volumen','prisma','cilindro','piramide','area lateral','area total','cuerpos geometricos'],w:['cono','esfera','cubo','capacidad','litro']},
  funcion_cuadratica:{s:['funcion cuadratica','funciones cuadraticas','parabola','vertice de la parabola','eje de simetria'],w:['vertice','cuadratica','concavidad']},
  teorema_seno_coseno:{s:['teorema del seno','teorema del coseno','triangulos oblicuangulos','ley de los senos','ley de los cosenos'],w:['seno','coseno','oblicuangulo']},
  sucesiones:{s:['sucesion','sucesiones','progresion aritmetica','progresion geometrica','termino general','sucesion aritmetica'],w:['razon','diferencia','termino']},
  geometria_analitica:{s:['geometria analitica','distancia entre dos puntos','punto medio','ecuacion de la circunferencia','ecuacion de la recta'],w:['circunferencia','plano cartesiano','coordenadas']},
  combinatoria:{s:['combinatoria','permutaciones','combinaciones','variaciones','numero combinatorio'],w:['factorial','conteo','orden']},
  limites:{s:['limite','limites','limite de una funcion','continuidad','indeterminacion','asintota'],w:['tiende','infinito','funcion']},
  integrales:{s:['integral','integrales','integral definida','integral indefinida','regla de barrow','primitiva','area bajo la curva'],w:['primitiva','antiderivada','integrando']},
  intervalos:{s:['intervalo','intervalos','intervalo abierto','intervalo cerrado','numeros reales','semirrecta','recta real'],w:['abierto','cerrado','extremo','real']}
};

/* ---------- carga de bibliotecas externas (solo cuando hacen falta) ---------- */
function lbScript(src){ return new Promise((ok, no) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => no(new Error('No se pudo descargar ' + src)); document.head.appendChild(s); }); }
async function lbPdf(){
  if(window.pdfjsLib) return window.pdfjsLib;
  try { await lbScript(LB_PDFJS + 'pdf.min.js'); } catch(e){ throw new Error('No se pudo cargar el lector de PDF. Revisá tu conexión a internet.'); }
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = LB_PDFJS + 'pdf.worker.min.js';
  return window.pdfjsLib;
}
async function lbTess(){
  if(window.Tesseract) return window.Tesseract;
  try { await lbScript(LB_TESS); } catch(e){ throw new Error('No se pudo cargar el reconocimiento de texto (OCR). Revisá tu conexión a internet.'); }
  return window.Tesseract;
}

/* ---------- sincronización con Firestore ---------- */
function libReset(){ LIB.loaded = false; LIB.loading = false; LIB.err = ''; LIB.books = []; LIB.pages = []; LIB.res = null; LIB.inc = null; LIB.pick = new Set(); }
function lbIndex(){
  LIB.pages = [];
  LIB.books.forEach(b => (b.pages || []).forEach((t, i) => { if(t && t.replace(/\s/g, '').length >= 3) LIB.pages.push({b:b.id, bt:b.title, p:i + 1, t, s:' ' + lbStemText(t) + ' '}); }));
  if(!LIB.inc) LIB.inc = new Set(LIB.books.map(b => b.id));
  else LIB.books.forEach(b => { if(!LIB.seen || !LIB.seen.has(b.id)) LIB.inc.add(b.id); });
  LIB.seen = new Set(LIB.books.map(b => b.id));
}
async function lbSync(msg){
  const snap = await fs.collection('library').orderBy('created', 'desc').get();
  const remote = snap.docs.map(d => ({id:d.id, ...d.data()}));
  let local = []; try { local = await lbDB.all('books'); } catch(e){}
  const lm = {}; local.forEach(b => lm[b.id] = b);
  for(const b of local) if(!remote.some(r => r.id === b.id)){ try { await lbDB.del('books', b.id); await lbDB.del('files', b.id); } catch(e){} }
  const books = [];
  for(const r of remote){
    let b = lm[r.id];
    if(!b || b.updated !== r.updated){
      msg && msg('Descargando “' + r.title + '”…');
      const cs = await fs.collection('library').doc(r.id).collection('chunks').orderBy('i').get();
      const pages = []; cs.docs.forEach(c => pages.push(...(c.data().texts || [])));
      b = {id:r.id, updated:r.updated, pages};
      try { await lbDB.put('books', b); } catch(e){}
    }
    books.push({...b, title:r.title, created:r.created, npages:r.npages, ocr:!!r.ocr});
  }
  LIB.books = books; lbIndex();
}
async function libEnsure(){
  if(LIB.loaded || LIB.loading) return;
  LIB.loading = true; LIB.err = '';
  try { await lbSync(m => { const e = document.getElementById('lb-msg'); if(e) e.textContent = m; }); LIB.loaded = true; }
  catch(e){ console.error(e); LIB.err = 'No se pudo cargar la biblioteca. Revisá tu conexión y que hayas publicado las reglas nuevas de Firestore (están en el archivo firestore.rules).'; }
  LIB.loading = false;
  if(typeof tab !== 'undefined' && tab === 'lib') renderLib();
}

/* ---------- lectura de PDF ---------- */
async function lbPageText(page){
  const tc = await page.getTextContent();
  let out = '', lastY = null, lastEnd = 0, lastH = 0;
  for(const it of tc.items){
    if(typeof it.str !== 'string') continue;
    const x = it.transform[4], y = it.transform[5], h = Math.abs(it.transform[3]) || lastH || 8;
    if(lastY !== null && Math.abs(y - lastY) > (lastH || 8) * 0.6){ out += '\n'; lastEnd = 0; }
    else if(out && it.str && !/\s$/.test(out) && !/^\s/.test(it.str) && x - lastEnd > h * 0.25) out += ' ';
    out += it.str; lastY = y; lastEnd = x + (it.width || 0); lastH = h;
    if(it.hasEOL) out += '\n';
  }
  return out.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}
function lbProg(msg, pct){
  LIB.busy = {msg, pct};
  const e = document.getElementById('lb-prog'); if(!e) return;
  e.innerHTML = `<div class="lb-prog"><div class="lb-bar"><i style="width:${Math.round(Math.max(0, Math.min(1, pct || 0)) * 100)}%"></i></div><div class="lb-pm"><span>${esc(msg)}</span><button class="btn soft" id="lb-cancel">Cancelar</button></div></div>`;
  const c = document.getElementById('lb-cancel'); if(c) c.onclick = () => { LIB.cancel = true; c.disabled = true; c.textContent = 'Cancelando…'; };
}
function lbProgEnd(){ LIB.busy = null; const e = document.getElementById('lb-prog'); if(e) e.innerHTML = ''; }

async function lbAddFile(file){
  const title = file.name.replace(/\.pdf$/i, '').replace(/[_]+/g, ' ').trim() || 'Documento';
  lbProg('Abriendo “' + title + '”…', 0);
  const pdfjs = await lbPdf();
  const doc = await pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise;
  const n = doc.numPages, texts = new Array(n).fill('');
  for(let p = 1; p <= n; p++){
    if(LIB.cancel) throw new Error('cancel');
    lbProg('Leyendo “' + title + '” — página ' + p + ' de ' + n, p / n * 0.4);
    const pg = await doc.getPage(p); texts[p - 1] = await lbPageText(pg); if(pg.cleanup) pg.cleanup();
  }
  const need = texts.map((t, i) => t.replace(/\s/g, '').length < 20 ? i : -1).filter(i => i >= 0);
  let ocr = false;
  if(need.length >= Math.max(1, n * 0.5)){
    const mins = Math.max(1, Math.round(need.length * 4 / 60));
    if(!confirm('“' + title + '” no tiene texto que se pueda seleccionar en ' + need.length + ' de sus ' + n + ' páginas (parece escaneado o con letras dibujadas).\n\n¿Querés leerlo con reconocimiento de texto (OCR)? Tarda unos ' + mins + ' minuto(s) o más, necesita internet y no tenés que cerrar esta pestaña mientras tanto.')) throw new Error('skip');
    ocr = true;
    const T = await lbTess(); const w = await T.createWorker('spa');
    try {
      let k = 0;
      for(const i of need){
        if(LIB.cancel) throw new Error('cancel');
        lbProg('Reconociendo texto de “' + title + '” — página ' + (i + 1) + ' (' + (++k) + ' de ' + need.length + ')', 0.4 + k / need.length * 0.5);
        const pg = await doc.getPage(i + 1), vp = pg.getViewport({scale:2}), cv = document.createElement('canvas');
        cv.width = vp.width; cv.height = vp.height;
        await pg.render({canvasContext:cv.getContext('2d'), canvas:cv, viewport:vp}).promise;
        const r = await w.recognize(cv); texts[i] = ((r && r.data && r.data.text) || '').trim();
      }
    } finally { try { await w.terminate(); } catch(e){} }
  }
  const chars = texts.join('').length;
  if(chars < 30) throw new Error('empty');
  lbProg('Guardando “' + title + '”…', 0.95);
  const id = fs.collection('library').doc().id, now = Date.now(), CH = 20, ref = fs.collection('library').doc(id), parts = [];
  for(let i = 0; i < n; i += CH) parts.push({i:i / CH, texts:texts.slice(i, i + CH)});
  for(let a = 0; a < parts.length; a += 400){
    const b = fs.batch();
    parts.slice(a, a + 400).forEach(o => b.set(ref.collection('chunks').doc(String(o.i).padStart(4, '0')), o));
    await b.commit();
  }
  await ref.set({title, npages:n, chars, ocr, created:now, updated:now, chunks:parts.length});
  try { await lbDB.put('books', {id, updated:now, pages:texts}); await lbDB.put('files', file, id); } catch(e){ console.warn('No se pudo guardar el PDF en este navegador', e); }
  LIB.books.unshift({id, title, updated:now, created:now, npages:n, ocr, pages:texts});
  LIB.seen && LIB.seen.delete(id); lbIndex();
  return {title, n, chars, ocr};
}
async function lbAddFiles(files){
  const ok = [], bad = [];
  LIB.cancel = false;
  for(const f of files){
    try { ok.push(await lbAddFile(f)); }
    catch(e){
      if(e.message === 'cancel'){ bad.push('“' + f.name + '”: cancelado.'); break; }
      else if(e.message === 'skip') bad.push('“' + f.name + '”: no se cargó (no tiene texto y no elegiste leerlo con OCR).');
      else if(e.message === 'empty') bad.push('“' + f.name + '”: no se pudo leer texto.');
      else { console.error(e); bad.push('“' + f.name + '”: ' + (e.message || 'error al cargar') + '.'); }
    }
  }
  lbProgEnd(); LIB.res = null;
  let m = ''; if(ok.length) m += 'Se cargaron ' + ok.length + ' documento(s): ' + ok.map(o => o.title + ' (' + o.n + ' págs.' + (o.ocr ? ', leído con OCR' : '') + ')').join('; ') + '. ';
  if(bad.length) m += '\n' + bad.join('\n');
  LIB.note = m; renderLib();
}

/* ---------- búsqueda ---------- */
function lbBuild(){
  const q = LIB.q;
  if(q.text.trim()){
    const txt = q.text.trim(), quoted = [...txt.matchAll(/"([^"]+)"/g)].map(m => lbStemText(m[1])).filter(Boolean);
    const words = (lbNrm(txt.replace(/"[^"]*"/g, ' ')).match(/[a-z0-9]+/g) || []).filter(w => w.length > 2 && !LB_STOP.has(w)).map(lbStem);
    const strong = [...new Set([...quoted, ...words])];
    return strong.length ? {label:txt, strong, weak:[], mode:q.mode} : null;
  }
  if(q.topic && LB_KEYS[q.topic]){
    const t = LB_KEYS[q.topic];
    return {label:(TOPICS.find(x => x.k === q.topic) || {}).n || q.topic, strong:t.s.map(lbStemText), weak:t.w.map(lbStemText), mode:'topic'};
  }
  return null;
}
function lbCount(s, ph){ if(!ph) return 0; const nd = ' ' + ph + ' '; let n = 0, i = 0; while((i = s.indexOf(nd, i)) >= 0){ n++; i += ph.length + 1; } return n; }
function lbScore(pg, Q){
  let sc = 0, sHit = 0, wHit = 0;
  for(const ph of Q.strong){ const c = lbCount(pg.s, ph); if(c){ sHit++; sc += 3 * (1 + Math.log(c)) * (1 + 0.3 * (ph.split(' ').length - 1)); } }
  for(const ph of Q.weak){ const c = lbCount(pg.s, ph); if(c){ wHit++; sc += 1 + Math.log(c); } }
  const ok = Q.mode === 'all' ? sHit === Q.strong.length : Q.mode === 'any' ? sHit >= 1 : (sHit >= 1 || wHit >= 2);
  return ok ? sc : 0;
}
function lbRun(){
  const Q = lbBuild(); if(!Q) return null;
  const hits = [];
  for(const pg of LIB.pages){ if(!LIB.inc.has(pg.b)) continue; const sc = lbScore(pg, Q); if(sc > 0) hits.push({pg, sc}); }
  hits.sort((a, b) => b.sc - a.sc);
  const total = hits.length, top = hits.slice(0, 400);
  const by = new Map();
  top.forEach(h => { if(!by.has(h.pg.b)) by.set(h.pg.b, {id:h.pg.b, title:h.pg.bt, items:[], best:0}); const g = by.get(h.pg.b); g.items.push(h); g.best += h.sc; });
  const groups = [...by.values()].sort((a, b) => b.best - a.best);
  groups.forEach(g => g.items.sort((a, b) => a.pg.p - b.pg.p));
  const stems = new Set(); [...Q.strong, ...Q.weak].forEach(p => p.split(' ').forEach(w => w && !LB_STOP.has(w) && stems.add(w)));
  return {Q, total, shown:top.length, groups, stems, docs:LIB.books.filter(b => LIB.inc.has(b.id)).length};
}
function lbMark(slice, stems){
  let out = '', last = 0;
  for(const m of slice.matchAll(/[A-Za-zÀ-ÿ0-9]+/g)){
    out += esc(slice.slice(last, m.index));
    out += stems.has(lbStem(lbNrm(m[0]))) ? '<mark>' + esc(m[0]) + '</mark>' : esc(m[0]);
    last = m.index + m[0].length;
  }
  return out + esc(slice.slice(last));
}
function lbSnip(text, stems, max = 3){
  const flat = text.replace(/\s+/g, ' ');
  const hit = [...flat.matchAll(/[A-Za-zÀ-ÿ0-9]+/g)].filter(m => stems.has(lbStem(lbNrm(m[0]))));
  if(!hit.length) return esc(flat.slice(0, 240)) + '…';
  const wins = [];
  for(const m of hit){
    const a = Math.max(0, m.index - 110), b = Math.min(flat.length, m.index + m[0].length + 170), last = wins[wins.length - 1];
    if(last && a <= last.b){ last.b = Math.max(last.b, b); last.n++; } else wins.push({a, b, n:1});
  }
  const pick = wins.sort((x, y) => y.n - x.n).slice(0, max).sort((x, y) => x.a - y.a);
  return pick.map(w => (w.a > 0 ? '… ' : '') + lbMark(flat.slice(w.a, w.b), stems) + (w.b < flat.length ? ' …' : '')).join('<br>');
}

/* ---------- pantalla ---------- */
const lbHead = () => `<div class="top"><h2>Biblioteca</h2><div class="tools"><button class="btn" id="lb-add">Agregar PDF</button><input type="file" id="lb-file" accept="application/pdf,.pdf" multiple hidden></div></div><p class="lead">Cargá tus PDF y libros y buscá por tema. Te muestro solamente lo que vos cargaste.</p>`;
function renderLib(){
  const m = document.getElementById('main');
  if(!LIB.loaded){
    m.innerHTML = lbHead() + `<div id="lb-prog"></div><div class="empty">${typeof LAPI === 'undefined' ? '' : LAPI}<div class="big">${LIB.err ? 'No pude abrir la biblioteca' : 'Abriendo tu biblioteca…'}</div><div id="lb-msg">${esc(LIB.err)}</div>${LIB.err ? '<br><button class="btn" id="lb-retry">Reintentar</button>' : ''}</div>`;
    const r = document.getElementById('lb-retry'); if(r) r.onclick = () => { LIB.err = ''; renderLib(); };
    if(!LIB.err) libEnsure();
    return;
  }
  const topics = TOPICS.filter(t => LB_KEYS[t.k]);
  m.innerHTML = lbHead() + `<div id="lb-prog"></div>${LIB.note ? `<div class="lb-note">${esc(LIB.note).replace(/\n/g, '<br>')}</div>` : ''}
  <div class="gcfg lib-ui"><div class="lb-search">
    <div class="lb-row"><div class="lb-f"><label for="lb-topic">Tema</label><select id="lb-topic"><option value="">— Elegí un tema —</option>${topics.map(t => `<option value="${t.k}" ${LIB.q.topic === t.k ? 'selected' : ''}>${esc(t.n)}</option>`).join('')}</select></div>
    <div class="lb-f"><label for="lb-q">o escribí lo que buscás</label><input id="lb-q" value="${esc(LIB.q.text)}" placeholder='Ej.: teorema de Pitágoras (usá "comillas" para una frase exacta)' autocomplete="off"></div></div>
    <div class="lb-row lb-opts"><label class="chk"><input type="radio" name="lb-mode" value="all" ${LIB.q.mode === 'all' ? 'checked' : ''}> Que aparezcan todas las palabras</label><label class="chk"><input type="radio" name="lb-mode" value="any" ${LIB.q.mode === 'any' ? 'checked' : ''}> Alguna de las palabras</label></div>
    ${LIB.books.length > 1 ? `<div class="lb-books"><span>Buscar en:</span>${LIB.books.map(b => `<label class="chipsel"><input type="checkbox" class="lb-bk" value="${b.id}" ${LIB.inc.has(b.id) ? 'checked' : ''}><span>${esc(b.title)}</span></label>`).join('')}</div>` : ''}
    <div class="acts"><button class="btn" id="lb-go" ${LIB.books.length ? '' : 'disabled'}>🔍 Buscar</button></div>
  </div></div>
  <div id="lb-out" class="lib-ui"></div>
  <h3 class="lb-h lib-ui">Mis documentos (${LIB.books.length})</h3>
  <div class="lb-docs lib-ui">${LIB.books.length ? LIB.books.map(b => `<div class="lb-doc"><div><b>${esc(b.title)}</b><div class="lb-meta">${b.npages || (b.pages || []).length} páginas${b.ocr ? ' · leído con OCR' : ''} · cargado el ${new Date(b.created || Date.now()).toLocaleDateString('es-AR')}</div></div><div><button class="btn soft" data-open="${b.id}">Ver</button> <button class="ib" data-ren="${b.id}" title="Cambiar nombre">✏️</button> <button class="ib" data-del="${b.id}" title="Borrar">🗑</button></div></div>`).join('') : `<div class="empty">${typeof LAPI === 'undefined' ? '' : LAPI}<div class="big">Todavía no cargaste documentos</div>Tocá “Agregar PDF” para subir tus libros, guías y apuntes. Después vas a poder buscar por tema en todos a la vez.</div>`}</div>
  <div class="sheet sheet-lib" id="lb-print"></div>`;
  const file = document.getElementById('lb-file');
  document.getElementById('lb-add').onclick = () => { if(LIB.busy){ alert('Ya se está cargando un documento. Esperá a que termine o cancelalo.'); return; } file.click(); };
  file.onchange = () => { const fl = [...file.files]; file.value = ''; if(fl.length){ LIB.note = ''; lbAddFiles(fl); } };
  const go = () => {
    LIB.q.topic = document.getElementById('lb-topic').value; LIB.q.text = document.getElementById('lb-q').value;
    LIB.q.mode = (document.querySelector('input[name=lb-mode]:checked') || {}).value || 'all';
    if(!LIB.q.topic && !LIB.q.text.trim()){ alert('Elegí un tema o escribí lo que querés buscar.'); return; }
    LIB.res = lbRun(); LIB.pick = new Set(); lbShow();
  };
  document.getElementById('lb-go').onclick = go;
  document.getElementById('lb-q').onkeydown = e => { if(e.key === 'Enter') go(); };
  document.getElementById('lb-topic').onchange = () => { if(document.getElementById('lb-topic').value) document.getElementById('lb-q').value = ''; };
  document.querySelectorAll('.lb-bk').forEach(c => c.onchange = () => { c.checked ? LIB.inc.add(c.value) : LIB.inc.delete(c.value); });
  document.querySelectorAll('[data-open]').forEach(b => b.onclick = () => lbViewer(b.dataset.open, 1));
  document.querySelectorAll('[data-ren]').forEach(b => b.onclick = () => { const bk = LIB.books.find(x => x.id === b.dataset.ren); askName('Cambiar el nombre del documento', bk.title, v => fs.collection('library').doc(bk.id).update({title:v}).then(() => { bk.title = v; lbIndex(); LIB.res = null; renderLib(); })); });
  document.querySelectorAll('[data-del]').forEach(b => b.onclick = () => lbDelete(b.dataset.del));
  if(LIB.busy) lbProg(LIB.busy.msg, LIB.busy.pct);
  if(LIB.res) lbShow();
}
function lbShow(){
  const out = document.getElementById('lb-out'), R = LIB.res; if(!out) return;
  if(!R){ out.innerHTML = ''; return; }
  if(!R.total){ out.innerHTML = `<div class="empty">${typeof LAPI === 'undefined' ? '' : LAPI}<div class="big">No encontré nada sobre “${esc(R.Q.label)}”</div>En ${R.docs} documento(s) que cargaste no aparece ese tema. Probá con otras palabras, o revisá que el documento tenga texto legible.</div>`; return; }
  out.innerHTML = `<div class="lb-sum"><span class="lb-st"><b>${R.total}</b> página(s) sobre “${esc(R.Q.label)}” en <b>${R.groups.length}</b> de tus ${R.docs} documento(s).${R.total > R.shown ? ` Te muestro las ${R.shown} más relevantes.` : ''}</span>
    <span class="lb-print"><button class="btn soft" id="lb-prt">🖨️ Imprimir ${LIB.pick.size ? 'la selección (' + LIB.pick.size + ')' : 'todo lo encontrado'}</button> <button class="btn soft" id="lb-all">${LIB.pick.size ? 'Quitar selección' : 'Seleccionar todo'}</button></span></div>` +
    R.groups.map(g => `<section class="lb-g"><h3 class="lb-bt">📖 ${esc(g.title)} <small>${g.items.length} página(s)</small></h3>${g.items.map(h => { const key = g.id + '|' + h.pg.p; return `<article class="lb-res"><label class="lb-pg"><input type="checkbox" class="lb-pick" value="${key}" ${LIB.pick.has(key) ? 'checked' : ''}> <b>Página ${h.pg.p}</b></label><div class="lb-snip">${lbSnip(h.pg.t, R.stems)}</div><div class="lb-act"><button class="btn soft" data-v="${g.id}|${h.pg.p}">📄 Ver la página</button> <button class="btn soft" data-t="${key}">Ver texto completo</button></div><div class="lb-full" hidden></div></article>`; }).join('')}</section>`).join('');
  out.querySelectorAll('.lb-pick').forEach(c => c.onchange = () => { c.checked ? LIB.pick.add(c.value) : LIB.pick.delete(c.value); lbShow(); });
  document.getElementById('lb-all').onclick = () => { if(LIB.pick.size) LIB.pick = new Set(); else R.groups.forEach(g => g.items.forEach(h => LIB.pick.add(g.id + '|' + h.pg.p))); lbShow(); };
  document.getElementById('lb-prt').onclick = lbPrint;
  out.querySelectorAll('[data-v]').forEach(b => b.onclick = () => { const [id, p] = b.dataset.v.split('|'); lbViewer(id, +p); });
  out.querySelectorAll('[data-t]').forEach(b => b.onclick = () => {
    const box = b.closest('.lb-res').querySelector('.lb-full'), [id, p] = b.dataset.t.split('|'), pg = LIB.pages.find(x => x.b === id && x.p === +p);
    if(box.hidden){ box.innerHTML = '<pre>' + lbMark(pg.t, R.stems) + '</pre>'; box.hidden = false; b.textContent = 'Ocultar texto'; } else { box.hidden = true; b.textContent = 'Ver texto completo'; }
  });
}
function lbPrint(){
  const R = LIB.res; if(!R) return;
  const items = []; R.groups.forEach(g => g.items.forEach(h => { if(!LIB.pick.size || LIB.pick.has(g.id + '|' + h.pg.p)) items.push(h.pg); }));
  if(!items.length) return;
  document.getElementById('lb-print').innerHTML = `<h2 class="lb-ph">Apunte: ${esc(R.Q.label)}</h2><p class="lb-pn">Reunido de mis documentos · ${items.length} página(s)</p>` +
    items.map(pg => `<section class="lb-pp"><h4>${esc(pg.bt)} — página ${pg.p}</h4><pre>${esc(pg.t)}</pre></section>`).join('');
  window.print();
}
async function lbDelete(id){
  const b = LIB.books.find(x => x.id === id); if(!b) return;
  if(!confirm('¿Borrar “' + b.title + '” de tu biblioteca? Se elimina el texto guardado y también el PDF de este navegador. No se puede deshacer.')) return;
  try {
    const ref = fs.collection('library').doc(id), cs = await ref.collection('chunks').get();
    for(let a = 0; a < cs.docs.length; a += 400){ const bt = fs.batch(); cs.docs.slice(a, a + 400).forEach(d => bt.delete(d.ref)); await bt.commit(); }
    await ref.delete();
    try { await lbDB.del('books', id); await lbDB.del('files', id); } catch(e){}
    LIB.books = LIB.books.filter(x => x.id !== id); LIB.inc.delete(id); lbIndex(); LIB.res = null; LIB.pick = new Set(); LIB.note = ''; renderLib();
  } catch(e){ console.error(e); alert('No se pudo borrar el documento. Revisá tu conexión.'); }
}

/* ---------- visor de páginas ---------- */
const LBV = {id:'', p:1, doc:null, n:0};
async function lbViewer(id, p){
  const bk = LIB.books.find(x => x.id === id); if(!bk) return;
  let d = document.getElementById('lb-view');
  if(!d){
    d = document.createElement('dialog'); d.id = 'lb-view';
    d.innerHTML = '<div class="lbv-bar"><b id="lbv-t"></b><span><button class="btn soft" id="lbv-p" aria-label="Página anterior">◀</button> <button class="btn soft" id="lbv-n" aria-label="Página siguiente">▶</button> <button class="btn" id="lbv-x">Cerrar</button></span></div><div id="lbv-b"></div>';
    document.body.appendChild(d);
    document.getElementById('lbv-x').onclick = () => d.close();
    document.getElementById('lbv-p').onclick = () => lbPaint(LBV.p - 1);
    document.getElementById('lbv-n').onclick = () => lbPaint(LBV.p + 1);
  }
  if(LBV.id !== id){ LBV.id = id; LBV.doc = null; LBV.n = bk.npages || (bk.pages || []).length; }
  if(!LBV.doc){
    try { const f = await lbDB.get('files', id); if(f){ const pdfjs = await lbPdf(); LBV.doc = await pdfjs.getDocument({data:new Uint8Array(await f.arrayBuffer())}).promise; } } catch(e){ console.warn(e); }
  }
  d.showModal(); lbPaint(p);
}
async function lbPaint(p){
  const bk = LIB.books.find(x => x.id === LBV.id); if(!bk) return;
  p = Math.max(1, Math.min(LBV.n, p)); LBV.p = p;
  document.getElementById('lbv-t').textContent = bk.title + ' — página ' + p + ' de ' + LBV.n;
  const box = document.getElementById('lbv-b');
  if(LBV.doc){
    box.innerHTML = '<canvas id="lbv-c"></canvas>';
    const pg = await LBV.doc.getPage(p), vp = pg.getViewport({scale:1.5}), cv = document.getElementById('lbv-c');
    if(!cv || LBV.p !== p) return;
    cv.width = vp.width; cv.height = vp.height;
    await pg.render({canvasContext:cv.getContext('2d'), canvas:cv, viewport:vp}).promise;
  } else {
    box.innerHTML = '<p class="lb-nopdf">El PDF original no está guardado en este dispositivo (solo se conserva en el navegador donde lo cargaste). Te muestro el texto que quedó guardado.</p><pre>' + esc((bk.pages || [])[p - 1] || '(página sin texto)') + '</pre>';
  }
}
