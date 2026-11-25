/* Biblioteca: PDF y libros con búsqueda por tema. La docente carga y edita; las personas habilitadas solo buscan y descargan.
   - El texto y el PDF original se guardan en Firestore (PDF de hasta 20 MB).
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
function libReset(){ LIB.loaded = false; LIB.loading = false; LIB.err = ''; LIB.books = []; LIB.pages = []; LIB.res = null; LIB.inc = null; LIB.pick = new Set(); LIB.shown = 0; lbWarmTok++; try { if(typeof LBV !== 'undefined'){ if(LBV.doc && LBV.doc.destroy) LBV.doc.destroy(); LBV.doc = null; LBV.id = ''; LBV.tok++; LBV.loadingId = ''; } } catch(e){} }
function lbIndex(){
  LIB.pages = [];
  LIB.books.forEach(b => (b.pages || []).forEach((t, i) => { if(t && t.replace(/\s/g, '').length >= 3) LIB.pages.push({b:b.id, bt:b.title, p:i + 1, t, get s(){ return this._s || (this._s = ' ' + lbStemText(this.t) + ' '); }}); }));
  if(!LIB.inc) LIB.inc = new Set(LIB.books.map(b => b.id));
  else LIB.books.forEach(b => { if(!LIB.seen || !LIB.seen.has(b.id)) LIB.inc.add(b.id); });
  LIB.seen = new Set(LIB.books.map(b => b.id));
  lbWarm();
}
/* El texto de cada página se procesa de a tandas de ~12 ms mientras la pantalla está libre: abrir la biblioteca no se traba aunque tenga miles de páginas.
   Si se busca antes de que termine, cada página pendiente se procesa en el momento (el resultado es el mismo). */
let lbWarmTok = 0;
function lbWarm(){
  const tok = ++lbWarmTok, pages = LIB.pages; let i = 0;
  const step = () => { if(tok !== lbWarmTok) return; const t0 = performance.now(); while(i < pages.length && performance.now() - t0 < 12) pages[i++].s; if(i < pages.length) setTimeout(step, 0); };
  setTimeout(step, 0);
}
async function lbSync(msg){
  const snap = await fs.collection('library').orderBy('created', 'desc').get();
  const remote = snap.docs.map(d => ({id:d.id, ...d.data()}));
  let local = []; try { local = await lbDB.all('books'); } catch(e){}
  const lm = {}; local.forEach(b => lm[b.id] = b);
  for(const b of local) if(!remote.some(r => r.id === b.id)){ try { await lbDB.del('books', b.id); await lbDB.del('files', b.id); } catch(e){} }
  const books = new Array(remote.length), need = remote.filter(r => !lm[r.id] || lm[r.id].updated !== r.updated).length;
  let next = 0, got = 0;
  const worker = async () => {                                         // se bajan hasta 3 libros a la vez (en el celular, uno por uno tardaba mucho)
    while(next < remote.length){
      const k = next++, r = remote[k]; let b = lm[r.id];
      if(!b || b.updated !== r.updated){
        const cs = await fs.collection('library').doc(r.id).collection('chunks').orderBy('i').get();
        const pages = []; cs.docs.forEach(c => pages.push(...(c.data().texts || [])));
        b = {id:r.id, updated:r.updated, pages};
        try { await lbDB.put('books', b); } catch(e){}
        got++; msg && msg('Descargando libros nuevos… ' + got + ' de ' + need);
      }
      books[k] = {...b, title:r.title, editorial:r.editorial||'', created:r.created, npages:r.npages, ocr:!!r.ocr, hasPdf:!!r.hasPdf, size:r.size||0, pdfChunks:r.pdfChunks||0, store:r.store||''};
    }
  };
  await Promise.all([worker(), worker(), worker()]);
  if(typeof shLoad === 'function') await shLoad();                    // estantes de la estantería (library/_estantes)
  LIB.books = books; lbIndex();
}
async function libEnsure(){
  if(LIB.loaded || LIB.loading) return;
  LIB.loading = true; LIB.err = '';
  try { await lbSync(m => { const e = document.getElementById('lb-msg'); if(e) e.textContent = m; }); LIB.loaded = true; setTimeout(() => { lbPdf().catch(() => {}); }, 1500); }
  catch(e){ console.error(e); LIB.err = lbRO() ? 'No se pudo abrir la biblioteca. Confirmá que tu correo esté habilitado por la profesora y que hayas confirmado tu cuenta.' : 'No se pudo cargar la biblioteca. Revisá tu conexión y que hayas publicado las reglas nuevas de Firestore (están en el archivo firestore.rules).'; }
  LIB.loading = false;
  if(typeof tab !== 'undefined' && tab === 'lib') renderLib();
  else if(typeof tab !== 'undefined' && tab === 'guides' && typeof renderGuides === 'function') renderGuides();
}

/* ---------- PDF original en la nube (Firestore, en partes) ---------- */
const LB_MAXPDF = 20 * 1024 * 1024, LB_BS = 510000;
const lbRO = () => !canEdit();
function lbB64(u8){ let s = ''; for(let i = 0; i < u8.length; i += 32768) s += String.fromCharCode.apply(null, u8.subarray(i, i + 32768)); return btoa(s); }
function lbUnb64(b){ const s = atob(b), u = new Uint8Array(s.length); for(let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; }
/* Los libros pueden vivir en un repositorio PRIVADO de GitHub (store:'gh'), a través de un Worker gratuito de Cloudflare que solo deja pasar
   a la profesora y a los lectores habilitados (ver GUIA-BIBLIOTECA-PRIVADA.md). Si window.PDF_PROXY está vacío, todo sigue en Firestore como antes. */
const LB_MAXBOOK = (window.PDF_PROXY ? 50 : 20) * 1024 * 1024;
const lbProxy = () => String(window.PDF_PROXY || '').replace(/\/+$/, '');
async function lbTok(){ if(typeof auth === 'undefined' || !auth || !auth.currentUser) throw new Error('Sin sesión'); return auth.currentUser.getIdToken(); }
function lbXhr(method, url, tok, body, onUp){                       // XMLHttpRequest para poder mostrar el progreso de subida
  return new Promise((ok, no) => {
    const x = new XMLHttpRequest(); x.open(method, url); x.setRequestHeader('Authorization', 'Bearer ' + tok);
    if(body) x.setRequestHeader('Content-Type', 'application/json');
    if(onUp && x.upload) x.upload.onprogress = e => { if(e.lengthComputable) onUp(e.loaded / e.total); };
    x.onload = () => (x.status >= 200 && x.status < 300) ? ok(x.responseText) : no(new Error('HTTP ' + x.status + ' ' + x.responseText.slice(0, 200)));
    x.onerror = () => no(new Error('Sin conexión')); x.send(body || null);
  });
}
async function lbGhPut(id, blob, prog){
  const base = lbProxy(), tok = await lbTok();
  const sha = (JSON.parse(await lbXhr('GET', base + '/sha/' + id, tok)) || {}).sha;
  const u8 = new Uint8Array(await blob.arrayBuffer()), parts = [];
  for(let i = 0; i < u8.length; i += 98304) parts.push(lbB64(u8.subarray(i, i + 98304)));   // 98304 = múltiplo de 3: las partes se pueden unir
  const body = JSON.stringify(Object.assign({message:'Libro ' + id, content:parts.join('')}, sha ? {sha} : {}));
  await lbXhr('PUT', base + '/pdf/' + id, tok, body, p => prog && prog(Math.min(0.99, p)));
}
async function lbGhGet(id, bk, onProg){
  const r = await fetch(lbProxy() + '/pdf/' + id, {headers:{Authorization:'Bearer ' + await lbTok()}});
  if(!r.ok) throw new Error('HTTP ' + r.status);
  const total = +r.headers.get('Content-Length') || bk.size || 0;
  if(!r.body || !r.body.getReader) return new Blob([await r.arrayBuffer()], {type:'application/pdf'});
  const rd = r.body.getReader(), parts = []; let got = 0;
  for(;;){ const {done, value} = await rd.read(); if(done) break; parts.push(value); got += value.length; if(onProg && total) onProg(Math.min(1, got / total)); }
  return new Blob(parts, {type:'application/pdf'});
}
async function lbGhDel(id){ await lbXhr('DELETE', lbProxy() + '/pdf/' + id, await lbTok()); }
async function lbClearFsPdf(id){                                     // borra los trozos viejos que haya en Firestore
  const old = await fs.collection('library').doc(id).collection('pdf').get();
  for(let a = 0; a < old.docs.length; a += 400){ const b = fs.batch(); old.docs.slice(a, a + 400).forEach(d => b.delete(d.ref)); await b.commit(); }
}
async function lbStorePdf(id, blob, prog){
  const ref = fs.collection('library').doc(id);
  if(lbProxy()){
    await lbGhPut(id, blob, prog);                                   // primero se sube; solo si salió bien se libera lo de Firestore
    await ref.update({hasPdf:true, size:blob.size, pdfChunks:0, store:'gh'});
    try { await lbClearFsPdf(id); } catch(e){ console.warn(e); }
    const bk = LIB.books.find(x => x.id === id); if(bk){ bk.hasPdf = true; bk.size = blob.size; bk.pdfChunks = 0; bk.store = 'gh'; }
    try { await lbDB.put('files', blob, id); } catch(e){}
    prog && prog(1); return;
  }
  const buf = new Uint8Array(await blob.arrayBuffer()), n = Math.ceil(buf.length / LB_BS);
  await lbClearFsPdf(id);
  for(let i = 0; i < n; i += 4){
    const b = fs.batch();
    for(let j = i; j < Math.min(n, i + 4); j++) b.set(ref.collection('pdf').doc(String(j).padStart(4, '0')), {i:j, b64:lbB64(buf.subarray(j * LB_BS, (j + 1) * LB_BS))});
    await b.commit(); prog && prog(Math.min(1, (i + 4) / n));
  }
  await ref.update({hasPdf:true, size:buf.length, pdfChunks:n, store:''});
  const bk = LIB.books.find(x => x.id === id); if(bk){ bk.hasPdf = true; bk.size = buf.length; bk.store = ''; }
  try { await lbDB.put('files', blob, id); } catch(e){}
}
async function lbB64Part(t){                                          // decodificación nativa (mucho más rápida que letra por letra en el celular)
  try { const r = await fetch('data:application/octet-stream;base64,' + t); return await r.blob(); }
  catch(e){ return new Blob([lbUnb64(t)]); }
}
async function lbGetPdf(id, onProg){
  try { const f = await lbDB.get('files', id); if(f) return f; } catch(e){}
  const bk = LIB.books.find(x => x.id === id);
  if(!bk || !bk.hasPdf) return null;
  if(bk.store === 'gh'){ const g = await lbGhGet(id, bk, onProg); try { await lbDB.put('files', g, id); } catch(e){} return g; }
  const col = fs.collection('library').doc(id).collection('pdf'), total = bk.pdfChunks || 0;
  let parts = [];
  if(total){                                                           // se conoce la cantidad de partes: se piden de a 4 en paralelo, con progreso
    parts = new Array(total); let next = 0, got = 0;
    const worker = async () => { while(next < total){ const k = next++; const d = await col.doc(String(k).padStart(4, '0')).get(); parts[k] = await lbB64Part(d.data().b64); got++; onProg && onProg(got / total); } };
    await Promise.all([worker(), worker(), worker(), worker()]);
  } else {
    const cs = await col.orderBy('i').get(); for(const d of cs.docs) parts.push(await lbB64Part(d.data().b64));
  }
  const blob = new Blob(parts, {type:'application/pdf'});
  try { await lbDB.put('files', blob, id); } catch(e){}
  return blob;
}
function lbSave(blob, name){ const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }
async function lbDownload(id, btn){
  const bk = LIB.books.find(x => x.id === id); if(!bk) return;
  const t = btn && btn.textContent; if(btn){ btn.disabled = true; btn.textContent = 'Descargando…'; }
  try {
    const f = await lbGetPdf(id);
    if(!f) alert('Este documento no tiene el PDF original guardado en la nube.' + (lbRO() ? '' : ' Tocá “☁️ Subir PDF” para subirlo.'));
    else lbSave(f, bk.title.replace(/[\\/:*?"<>|]+/g, ' ') + '.pdf');
  } catch(e){ console.error(e); alert('No se pudo descargar. Revisá tu conexión.'); }
  if(btn){ btn.disabled = false; btn.textContent = t; }
}
async function lbUploadFile(id, f){
  const bk = LIB.books.find(x => x.id === id); if(!bk || !f) return false;
  if(f.size > LB_MAXBOOK){ alert('“' + f.name + '” pesa más de ' + Math.round(LB_MAXBOOK / 1048576) + ' MB y no entra en la nube gratis. Podés comprimirlo (por ejemplo con ilovepdf.com) y volver a intentar.'); return false; }
  try {
    const pdfjs = await lbPdf(), d = await pdfjs.getDocument({data:new Uint8Array(await f.arrayBuffer())}).promise, n = bk.npages || (bk.pages || []).length;
    if(n && d.numPages !== n && !confirm('Ese PDF tiene ' + d.numPages + ' páginas y “' + bk.title + '” tiene ' + n + '. Si no es el mismo archivo, la búsqueda mostraría páginas equivocadas. ¿Lo subís igual?')) return false;
  } catch(e){ alert('No se pudo leer ese archivo como PDF.'); return false; }
  try { lbProg('Subiendo “' + bk.title + '” a la nube…', 0); await lbStorePdf(id, f, p => lbProg('Subiendo “' + bk.title + '” a la nube…', p)); return true; }
  catch(e){ console.error(e); return false; }
}
async function lbUploadLocal(id){
  const bk = LIB.books.find(x => x.id === id); if(!bk) return;
  let f = null; try { f = await lbDB.get('files', id); } catch(e){}
  if(f){
    const ok = await lbUploadFile(id, f);
    LIB.note = ok ? '“' + bk.title + '” quedó guardado en la nube y ya se puede ver y descargar desde cualquier dispositivo.' : 'No se pudo subir el PDF. Revisá tu conexión.';
    lbProgEnd(); renderLib(); return;
  }
  // este navegador no tiene el original: se elige el archivo desde la computadora o el celular
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'application/pdf,.pdf';
  inp.onchange = async () => {
    const ok = inp.files[0] ? await lbUploadFile(id, inp.files[0]) : false;
    if(inp.files[0]) LIB.note = ok ? '“' + bk.title + '” quedó guardado en la nube y ya se puede ver y descargar desde cualquier dispositivo.' : 'No se subió el PDF.';
    lbProgEnd(); renderLib();
  };
  inp.click();
}
async function lbUploadAll(){
  const pend = LIB.books.filter(b => !b.hasPdf); let ok = 0; const miss = [];
  for(const b of pend){
    let f = null; try { f = await lbDB.get('files', b.id); } catch(e){}
    if(!f){ miss.push(b.title); continue; }
    if(await lbUploadFile(b.id, f)) ok++;
  }
  lbProgEnd();
  LIB.note = (ok ? 'Se subieron ' + ok + ' PDF a la nube. ' : '') + (miss.length ? 'Estos no están en este navegador (tocá “☁️ Guardar PDF” en cada uno y elegí el archivo): ' + miss.join('; ') + '.' : '');
  renderLib();
}

async function lbMoveAll(){                                          // pasa los PDF que están en Firestore al repositorio privado, de a uno
  const pend = LIB.books.filter(b => b.hasPdf && b.store !== 'gh'); let ok = 0; const bad = [];
  for(const b of pend){
    try {
      lbProg('Moviendo “' + b.title + '” (' + (ok + bad.length + 1) + ' de ' + pend.length + ')…', 0);
      const f = await lbGetPdf(b.id, p => lbProg('Leyendo “' + b.title + '”…', p * 0.3));
      if(!f) throw new Error('sin PDF');
      await lbStorePdf(b.id, f, p => lbProg('Moviendo “' + b.title + '” (' + (ok + bad.length + 1) + ' de ' + pend.length + ')…', 0.3 + p * 0.7)); ok++;
    } catch(e){ console.error(e); bad.push(b.title); }
  }
  lbProgEnd();
  LIB.note = (ok ? 'Se movieron ' + ok + ' PDF al repositorio privado y se liberó ese espacio en Firebase. ' : '') + (bad.length ? 'No se pudieron mover (siguen en Firebase, podés reintentar): ' + bad.join('; ') + '.' : '');
  renderLib();
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
  const editorial = (typeof shDetect === 'function') ? shDetect(title, texts) : '';
  await ref.set({title, npages:n, chars, ocr, created:now, updated:now, chunks:parts.length, editorial});
  try { await lbDB.put('books', {id, updated:now, pages:texts}); await lbDB.put('files', file, id); } catch(e){ console.warn('No se pudo guardar el PDF en este navegador', e); }
  LIB.books.unshift({id, title, editorial, updated:now, created:now, npages:n, ocr, pages:texts, hasPdf:false});
  let cloud = false;
  if(file.size <= LB_MAXBOOK){ try { await lbStorePdf(id, file, p => lbProg('Guardando el PDF de “' + title + '” en la nube…', 0.95 + p * 0.05)); cloud = true; } catch(e){ console.error(e); } }
  LIB.seen && LIB.seen.delete(id); lbIndex();
  return {title, n, chars, ocr, cloud, big:file.size > LB_MAXPDF};
}
const lbMB = f => (f.size / 1048576).toFixed(1).replace('.', ',') + ' MB';
/* ---------- dividir PDF grandes en partes de ~17 MB ---------- */
const LB_PARTSZ = 17 * 1048576;
const lbTick = () => new Promise(r => setTimeout(r, 0));
async function lbPdfLib(){
  if(window.PDFLib) return window.PDFLib;
  try { await lbScript('https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js'); } catch(e){ throw new Error('No se pudo cargar la herramienta para dividir PDF. Revisá tu conexión a internet.'); }
  return window.PDFLib;
}
async function lbSplitPdf(file){
  const base = file.name.replace(/\.pdf$/i, '');
  lbProg('Abriendo “' + base + '” para dividirlo…', 0); await lbTick();
  const P = await lbPdfLib();
  const src = await P.PDFDocument.load(await file.arrayBuffer(), {ignoreEncryption:true, updateMetadata:false});
  const N = src.getPageCount(), parts = [];
  let start = 0, ppp = Math.max(1, Math.floor(N * LB_PARTSZ / file.size * 0.8));
  while(start < N){
    if(LIB.cancel) throw new Error('cancel');
    const end = Math.min(N, start + ppp), cnt = end - start;
    lbProg('Dividiendo “' + base + '” — páginas ' + (start + 1) + ' a ' + end + ' de ' + N, start / N); await lbTick();
    const doc = await P.PDFDocument.create();
    (await doc.copyPages(src, Array.from({length:cnt}, (_, i) => start + i))).forEach(pg => doc.addPage(pg));
    const bytes = await doc.save({useObjectStreams:true});
    if(bytes.length > LB_MAXPDF && cnt > 1){          // se pasó de 20 MB: reintenta con menos páginas
      ppp = Math.max(1, Math.min(cnt - 1, Math.floor(cnt * LB_PARTSZ / bytes.length))); continue;
    }
    parts.push(new File([bytes], base + ' (págs. ' + (start + 1) + '-' + end + ').pdf', {type:'application/pdf'}));
    start = end; ppp = Math.max(1, Math.floor(cnt * LB_PARTSZ / bytes.length));
  }
  return parts;
}

function lbAskBig(files){
  const small = files.filter(f => f.size <= LB_MAXPDF), big = files.filter(f => f.size > LB_MAXPDF);
  return new Promise(res => {
    const li = arr => arr.map(f => `<div class="share-row"><span>${esc(f.name)}</span><b>${lbMB(f)}${f.size > LB_MAXPDF ? ' → ~' + Math.ceil(f.size / LB_PARTSZ) + ' partes' : ''}</b></div>`).join('');
    $('#frm').innerHTML = `<h3>Archivos de más de 20 MB</h3>
      <p class="note">El límite para guardar un PDF en la nube es de 20 MB, así que los grandes se <b>dividen solos</b> en partes por páginas. Cada parte queda como un libro más (por ejemplo “Libro (págs. 1-120)”), y la búsqueda, el visor y las guías funcionan igual.</p>
      <h4 style="margin:12px 0 2px">⚠️ Se van a dividir (${big.length})</h4>${li(big)}
      ${small.length ? `<h4 style="margin:12px 0 2px">✅ Se cargan tal cual (${small.length})</h4>${li(small)}` : ''}
      <p class="note">Dividir un PDF muy grande usa bastante memoria: conviene hacerlo desde una computadora y sin otras pestañas pesadas abiertas.</p>
      <div class="acts" style="margin-top:16px;flex-wrap:wrap"><button class="btn" data-c="split">Dividir y cargar</button>${small.length ? `<button class="btn soft" data-c="fit">Cargar solo los chicos (${small.length})</button>` : ''}<button class="btn soft" data-c="all">Sin dividir (los grandes solo texto)</button><button class="btn soft" data-c="no">Cancelar</button></div>`;
    const d = $('#dlg'); let out = 'no';
    d.addEventListener('close', () => res(out), {once:true});
    $('#frm').querySelectorAll('[data-c]').forEach(b => b.onclick = () => { out = b.dataset.c; d.close(); });
    d.showModal();
  });
}
async function lbAddFiles(files){
  const ok = [], bad = [];
  LIB.cancel = false;
  if(files.some(f => f.size > LB_MAXPDF)){
    const c = await lbAskBig(files);
    if(c === 'no') return;
    if(c === 'fit') files = files.filter(f => f.size <= LB_MAXPDF);
    if(c === 'split'){
      const out = [];
      for(const f of files){
        if(f.size <= LB_MAXPDF){ out.push(f); continue; }
        try { out.push(...await lbSplitPdf(f)); }
        catch(e){
          if(e.message === 'cancel'){ lbProgEnd(); LIB.note = 'Cancelado: no se cargó nada de “' + f.name + '”.'; renderLib(); return; }
          console.error(e); bad.push('“' + f.name + '”: no se pudo dividir (' + (e.message || 'error') + '). Probá comprimirlo en ilovepdf.com o cargarlo sin dividir.');
        }
      }
      files = out;
    }
  }
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
  let m = ''; if(ok.length) m += 'Se cargaron ' + ok.length + ' documento(s): ' + ok.map(o => o.title + ' (' + o.n + ' págs.' + (o.ocr ? ', leído con OCR' : '') + (o.cloud ? '' : o.big ? ', PDF de más de 20 MB: solo se guardó el texto' : ', PDF sin subir a la nube') + ')').join('; ') + '. ';
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
function lbDdLabel(){
  const n = LIB.books.length, k = LIB.books.filter(b => LIB.inc.has(b.id)).length;
  if(k === n) return 'Todos los libros (' + n + ')';
  if(k === 0) return 'Ningún libro seleccionado';
  if(k === 1) return LIB.books.find(b => LIB.inc.has(b.id)).title;
  return k + ' de ' + n + ' libros';
}
const lbHead = () => `<div class="top"><h2>Biblioteca</h2><div class="tools">${lbRO() ? '' : '<button class="btn" id="lb-add">Agregar PDF</button><input type="file" id="lb-file" accept="application/pdf,.pdf" multiple hidden>'}</div></div><p class="lead">${lbRO() ? 'Buscá por tema, descargá los PDF o armá tu propia guía con las páginas que elijas.' : 'Cargá tus PDF y libros y buscá por tema. Podés armar guías con las páginas que elijas.'}</p>`;
function renderLib(){
  const m = document.getElementById('main');
  if(!LIB.loaded){
    m.innerHTML = lbHead() + `<div id="lb-prog"></div><div class="empty"><div class="big">${LIB.err ? 'No pude abrir la biblioteca' : 'Abriendo la biblioteca…'}</div><div id="lb-msg">${esc(LIB.err)}</div>${LIB.err ? '<br><button class="btn" id="lb-retry">Reintentar</button>' : ''}</div>`;
    const r = document.getElementById('lb-retry'); if(r) r.onclick = () => { LIB.err = ''; renderLib(); };
    if(!LIB.err) libEnsure();
    return;
  }
  const RO = lbRO(), topics = TOPICS.filter(t => LB_KEYS[t.k]);
  m.innerHTML = lbHead() + `<div id="lb-prog"></div>${LIB.note ? `<div class="lb-note">${esc(LIB.note).replace(/\n/g, '<br>')}</div>` : ''}
  <div class="gd-box lb-sbox lib-ui"><div class="lb-row"><div class="lb-f"><label for="lb-topic">Tema</label><select id="lb-topic"><option value="">— Elegí un tema —</option>${topics.map(t => `<option value="${t.k}" ${LIB.q.topic === t.k ? 'selected' : ''}>${esc(t.n)}</option>`).join('')}</select></div>
    <div class="lb-f"><label for="lb-q">o escribí lo que buscás</label><input id="lb-q" value="${esc(LIB.q.text)}" placeholder='Ej.: teorema de Pitágoras' autocomplete="off"></div></div>
    ${LIB.books.length > 1 ? `<div class="lb-f lb-ddwrap"><label>Buscar en</label><details class="lb-dd" id="lb-dd"><summary id="lb-dd-s">${esc(lbDdLabel())}</summary>
      <div class="lb-dd-p"><input type="search" id="lb-dd-f" class="lb-dd-f" placeholder="Filtrar libros…" autocomplete="off">
        <div class="lb-dd-a"><button type="button" class="btn soft" id="lb-dd-all">Todos</button><button type="button" class="btn soft" id="lb-dd-none">Ninguno</button><button type="button" class="btn" id="lb-dd-ok">Listo</button></div>
        <div class="lb-dd-l" id="lb-dd-l">${LIB.books.map(b => `<label class="lb-dd-i" data-t="${esc(lbNrm(b.title))}"><input type="checkbox" class="lb-bk" value="${b.id}" ${LIB.inc.has(b.id) ? 'checked' : ''}><span>${esc(b.title)}</span></label>`).join('')}</div></div></details></div>` : ''}
    <details class="lb-more"><summary>Más opciones de búsqueda</summary>
      <div class="lb-row lb-opts"><label class="chk"><input type="radio" name="lb-mode" value="all" ${LIB.q.mode === 'all' ? 'checked' : ''}> Que aparezcan todas las palabras</label><label class="chk"><input type="radio" name="lb-mode" value="any" ${LIB.q.mode === 'any' ? 'checked' : ''}> Alguna de las palabras</label></div>
      <p class="note">Usá “comillas” para buscar una frase exacta.</p>
    </details>
    <div class="acts"><button class="btn" id="lb-go" ${LIB.books.length ? '' : 'disabled'}>🔍 Buscar</button></div>
  </div>
  <div id="lb-out" class="lib-ui"></div>
  ${typeof shelfHTML === 'function' ? shelfHTML() : ''}
  <details class="lb-docsbox lib-ui"><summary class="lb-h">Documentos (${LIB.books.length})</summary>
  ${!RO && LIB.books.some(b => !b.hasPdf) ? `<div class="lb-note lib-ui"><b>${LIB.books.filter(b => !b.hasPdf).length} documento(s) no tienen el PDF original en la nube</b>, por eso solo se ven desde el navegador donde los cargaste. Tocá “☁️ Subir PDF” en cada uno (si no está en este navegador te pide elegir el archivo), o <button class="btn soft" id="lb-upall">Subir todos los que pueda</button></div>` : ''}
  ${!RO && lbProxy() && LIB.books.some(b => b.hasPdf && b.store !== 'gh') ? `<div class="lb-note lib-ui"><b>${LIB.books.filter(b => b.hasPdf && b.store !== 'gh').length} PDF todavía ocupan lugar en Firebase.</b> <button class="btn soft" id="lb-moveall">Mover al repositorio privado</button></div>` : ''}
  <div class="lb-docs lib-ui">${LIB.books.length ? LIB.books.map(b => `<div class="lb-doc"><div class="lb-dt"><b>${esc(b.title)}</b><div class="lb-meta">${b.npages || (b.pages || []).length} páginas${b.ocr ? ' · OCR' : ''}${b.hasPdf ? '' : ' · PDF sin subir a la nube'}</div></div><div class="lb-da"><button class="btn soft" data-open="${b.id}">Ver</button> ${b.hasPdf ? `<button class="btn soft" data-dl="${b.id}">⬇ Descargar</button>` : (RO ? '' : `<button class="btn" data-up="${b.id}">☁️ Subir PDF</button>`)}${RO ? '' : ` <button class="ib" data-ren="${b.id}" title="Cambiar nombre">✏️</button> <button class="ib" data-del="${b.id}" title="Borrar">🗑</button>`}</div></div>`).join('') : `<div class="empty"><div class="big">${RO ? 'Todavía no hay documentos' : 'Todavía no cargaste documentos'}</div>${RO ? '' : 'Tocá “Agregar PDF” para subir tus libros, guías y apuntes.'}</div>`}</div></details>
  ${RO ? '' : '<details class="gd-box lib-ui" id="lb-sharebox"><summary><b>👥 Compartir la biblioteca (solo lectura)</b></summary><div id="lb-share"><p class="note">Cargando…</p></div></details>'}
  <div class="sheet sheet-lib" id="lb-print"></div>`;
  if(!RO){
    const file = document.getElementById('lb-file');
    document.getElementById('lb-add').onclick = () => { if(LIB.busy){ alert('Ya se está cargando un documento. Esperá a que termine o cancelalo.'); return; } file.click(); };
    file.onchange = () => { const fl = [...file.files]; file.value = ''; if(fl.length){ LIB.note = ''; lbAddFiles(fl); } };
    document.querySelectorAll('[data-ren]').forEach(b => b.onclick = () => { const bk = LIB.books.find(x => x.id === b.dataset.ren); askName('Cambiar el nombre del documento', bk.title, v => fs.collection('library').doc(bk.id).update({title:v}).then(() => { bk.title = v; lbIndex(); LIB.res = null; renderLib(); })); });
    document.querySelectorAll('[data-del]').forEach(b => b.onclick = () => lbDelete(b.dataset.del));
    document.querySelectorAll('[data-up]').forEach(b => b.onclick = () => lbUploadLocal(b.dataset.up));
    lbShareRender();
    const ua = document.getElementById('lb-upall'); if(ua) ua.onclick = lbUploadAll;
    const ma = document.getElementById('lb-moveall'); if(ma) ma.onclick = lbMoveAll;
  }
  const go = async () => {
    LIB.q.topic = document.getElementById('lb-topic').value; LIB.q.text = document.getElementById('lb-q').value;
    LIB.q.mode = (document.querySelector('input[name=lb-mode]:checked') || {}).value || 'all';
    if(!LIB.q.topic && !LIB.q.text.trim()){ alert('Elegí un tema o escribí lo que querés buscar.'); return; }
    const out = document.getElementById('lb-out'); if(out) out.innerHTML = '<p class="note">Buscando…</p>';
    await new Promise(r => setTimeout(r, 30));                          // deja que se dibuje “Buscando…” antes de la cuenta pesada
    LIB.res = lbRun(); LIB.pick = new Set(); LIB.shown = LB_PAGE; lbShow();
    if(window.AulaProfe){ const n = (LIB.res || []).length; AulaProfe.reaccionar(n ? 'festejo' : 'error', n ? '¡Encontré ' + n + ' página' + (n === 1 ? '' : 's') + '! 📖' : 'No encontré nada con esas palabras. Probá con otro término 🤔', 2800); }
  };
  document.getElementById('lb-go').onclick = go;
  document.getElementById('lb-q').onkeydown = e => { if(e.key === 'Enter') go(); };
  document.getElementById('lb-topic').onchange = () => { if(document.getElementById('lb-topic').value) document.getElementById('lb-q').value = ''; };
  const ddUp = () => { const s = document.getElementById('lb-dd-s'); if(s) s.textContent = lbDdLabel(); };
  document.querySelectorAll('.lb-bk').forEach(c => c.onchange = () => { c.checked ? LIB.inc.add(c.value) : LIB.inc.delete(c.value); ddUp(); });
  const ddAll = document.getElementById('lb-dd-all'), ddNone = document.getElementById('lb-dd-none'), ddF = document.getElementById('lb-dd-f');
  const ddSet = on => document.querySelectorAll('#lb-dd-l .lb-dd-i').forEach(l => { if(l.hidden) return; const c = l.querySelector('input'); c.checked = on; on ? LIB.inc.add(c.value) : LIB.inc.delete(c.value); });
  const ddOk = document.getElementById('lb-dd-ok'); if(ddOk) ddOk.onclick = () => { const d = document.getElementById('lb-dd'); if(d) d.open = false; };
  if(ddAll) ddAll.onclick = () => { ddSet(true); ddUp(); };
  if(ddNone) ddNone.onclick = () => { ddSet(false); ddUp(); };
  if(ddF) ddF.oninput = () => { const q = lbNrm(ddF.value.trim()); document.querySelectorAll('#lb-dd-l .lb-dd-i').forEach(l => l.hidden = q && !l.dataset.t.includes(q)); };
  const dd = document.getElementById('lb-dd');
  if(dd) document.addEventListener('click', function cl(e){ if(!document.body.contains(dd)){ document.removeEventListener('click', cl); return; } if(!dd.contains(e.target)) dd.open = false; });
  document.querySelectorAll('[data-open]').forEach(b => b.onclick = () => lbViewer(b.dataset.open, 1));
  document.querySelectorAll('[data-dl]').forEach(b => b.onclick = () => lbDownload(b.dataset.dl, b));
  if(typeof shelfBind === 'function') shelfBind();
  if(LIB.busy) lbProg(LIB.busy.msg, LIB.busy.pct);
  if(LIB.res) lbShow();
}

/* ---------- compartir la biblioteca (lista de correos habilitados) ---------- */
async function lbShareRender(){
  const box = document.getElementById('lb-share'); if(!box) return;
  let emails = [];
  try { const d = await fs.collection('config').doc('lectores').get(); emails = (d.exists && d.data().emails) || []; }
  catch(e){ box.innerHTML = '<p class="note">No se pudo cargar la lista. Revisá que hayas publicado las reglas nuevas.</p>'; return; }
  const save = async list => { await fs.collection('config').doc('lectores').set({emails:list}); lbShareRender(); };
  box.innerHTML = `<p class="note">Las personas de esta lista pueden <b>buscar, ver y descargar</b> los PDF. No pueden agregar, cambiar ni borrar nada. Tienen que entrar con “Ingresar → Es mi primera vez” usando ese correo (y confirmarlo).</p>
    ${emails.length ? emails.map((e, i) => `<div class="share-row"><span>${esc(e)}</span><button class="btn del" data-rm="${i}">Quitar</button></div>`).join('') : '<p class="note">Todavía no habilitaste a nadie.</p>'}
    <div class="row" style="margin-top:10px;grid-template-columns:1fr auto"><input id="sh-em" type="email" placeholder="correo@ejemplo.com"><button class="btn" id="sh-add">Habilitar</button></div>`;
  document.getElementById('sh-add').onclick = async () => {
    const v = document.getElementById('sh-em').value.trim().toLowerCase();
    if(!/^\S+@\S+\.\S+$/.test(v)){ alert('Escribí un correo válido.'); return; }
    if(emails.includes(v)) return;
    try { await save([...emails, v]); } catch(e){ alert('No se pudo guardar.'); }
  };
  box.querySelectorAll('[data-rm]').forEach(b => b.onclick = async () => { if(!confirm('¿Quitar el acceso a ' + emails[+b.dataset.rm] + '?')) return; try { await save(emails.filter((_, i) => i !== +b.dataset.rm)); } catch(e){ alert('No se pudo guardar.'); } });
}
/* ---------- resultados: de a LB_PAGE, se cargan más al bajar; tildar una página no redibuja nada ---------- */
const LB_PAGE = 30;
let lbIO = null;
function lbPickLabels(){
  const n = LIB.pick.size, g = document.getElementById('lb-gd'), p = document.getElementById('lb-prt'), a = document.getElementById('lb-all');
  if(g) g.textContent = '➕ A la guía ' + (n ? '(' + n + ')' : '(todo)');
  if(p) p.textContent = '🖨️ Imprimir ' + (n ? 'la selección (' + n + ')' : 'todo lo encontrado');
  if(a) a.textContent = n ? 'Quitar selección' : 'Seleccionar todo';
}
function lbCard(g, h, R){
  const key = g.id + '|' + h.pg.p;
  if(h.html === undefined) h.html = lbSnip(h.pg.t, R.stems);          // el fragmento se calcula una sola vez
  return `<article class="lb-res"><label class="lb-pg"><input type="checkbox" class="lb-pick" value="${key}" ${LIB.pick.has(key) ? 'checked' : ''}> <b>Página ${h.pg.p}</b></label><div class="lb-snip">${h.html}</div><div class="lb-act"><button class="btn" data-ga="${key}">➕ A la guía</button> <button class="btn soft" data-v="${key}">📄 Ver la página</button> <button class="btn soft" data-t="${key}">Ver texto</button></div><div class="lb-full" hidden></div></article>`;
}
function lbMore(upTo){
  const R = LIB.res, list = document.getElementById('lb-list'), more = document.getElementById('lb-more'); if(!R || !list) return;
  if(lbIO){ lbIO.disconnect(); lbIO = null; }
  const end = Math.min(R.flat.length, upTo); let cur = list.lastElementChild;
  for(; R.drawn < end; R.drawn++){
    const {g, h} = R.flat[R.drawn];
    if(!cur || cur.dataset.g !== g.id){ list.insertAdjacentHTML('beforeend', `<section class="lb-g" data-g="${g.id}"><h3 class="lb-bt">📖 ${esc(g.title)} <small>${g.items.length} página(s)</small></h3></section>`); cur = list.lastElementChild; }
    cur.insertAdjacentHTML('beforeend', lbCard(g, h, R));
  }
  LIB.shown = R.drawn;
  const left = R.flat.length - R.drawn;
  more.innerHTML = left > 0 ? `<button class="btn soft" id="lb-moreb">Mostrar ${Math.min(LB_PAGE, left)} más (quedan ${left})</button>` : '';
  const mb = document.getElementById('lb-moreb');
  if(mb && 'IntersectionObserver' in window){ lbIO = new IntersectionObserver(es => { if(es.some(e => e.isIntersecting)) lbMore(R.drawn + LB_PAGE); }, {rootMargin:'700px 0px'}); lbIO.observe(mb); }
}
function lbShow(){
  const out = document.getElementById('lb-out'), R = LIB.res;
  if(lbIO){ lbIO.disconnect(); lbIO = null; }
  if(!out) return;
  if(!R){ out.innerHTML = ''; return; }
  if(!R.total){ out.innerHTML = `<div class="empty"><div class="big">No encontré nada sobre “${esc(R.Q.label)}”</div>En ${R.docs} documento(s) que cargaste no aparece ese tema. Probá con otras palabras, o revisá que el documento tenga texto legible.</div>`; return; }
  if(!R.flat) R.flat = R.groups.flatMap(g => g.items.map(h => ({g, h})));
  R.drawn = 0;
  out.innerHTML = `<div class="lb-sum"><span class="lb-st"><b>${R.total}</b> página(s) sobre “${esc(R.Q.label)}” en <b>${R.groups.length}</b> de tus ${R.docs} documento(s).${R.total > R.shown ? ` Te muestro las ${R.shown} más relevantes.` : ''}</span>
    <span class="lb-print lb-bar2"><button class="btn" id="lb-gd"></button> <button class="btn soft" id="lb-prt"></button> <button class="btn soft" id="lb-all"></button></span></div><div id="lb-list"></div><div id="lb-more" class="lb-moreb"></div>`;
  lbPickLabels();
  lbMore(Math.max(LIB.shown || 0, LB_PAGE));
  const pageOf = key => { const [id, p] = key.split('|'); return LIB.pages.find(x => x.b === id && x.p === +p); };
  out.onchange = e => { const c = e.target; if(c.classList && c.classList.contains('lb-pick')){ c.checked ? LIB.pick.add(c.value) : LIB.pick.delete(c.value); lbPickLabels(); } };
  out.onclick = e => {
    const b = e.target.closest('button'); if(!b || !out.contains(b)) return;
    if(b.id === 'lb-moreb'){ lbMore(R.drawn + LB_PAGE); return; }
    if(b.id === 'lb-all'){ if(LIB.pick.size) LIB.pick = new Set(); else R.flat.forEach(({g, h}) => LIB.pick.add(g.id + '|' + h.pg.p)); out.querySelectorAll('.lb-pick').forEach(c => c.checked = LIB.pick.has(c.value)); lbPickLabels(); return; }
    if(b.id === 'lb-prt'){ lbPrint(); return; }
    if(b.id === 'lb-gd'){ const keys = []; R.flat.forEach(({g, h}) => { const k = g.id + '|' + h.pg.p; if(!LIB.pick.size || LIB.pick.has(k)) keys.push(k); }); guideAddMany(keys); return; }
    if(b.dataset.ga){ guideAddMany([b.dataset.ga]); b.textContent = '✓ Agregada'; b.disabled = true; return; }
    if(b.dataset.v){ const [id, p] = b.dataset.v.split('|'); lbViewer(id, +p); return; }
    if(b.dataset.t){
      const box = b.closest('.lb-res').querySelector('.lb-full'), pg = pageOf(b.dataset.t);
      if(box.hidden){ box.innerHTML = '<pre>' + lbMark(pg.t, R.stems) + '</pre>'; box.hidden = false; b.textContent = 'Ocultar texto'; } else { box.hidden = true; b.textContent = 'Ver texto'; }
    }
  };
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
  if(!confirm('¿Borrar “' + b.title + '” de tu biblioteca? Se elimina el texto y el PDF guardados, y las personas con acceso dejan de verlo. No se puede deshacer.')) return;
  try {
    if(b.store === 'gh'){ try { await lbGhDel(id); } catch(e){ console.warn(e); if(!confirm('No se pudo borrar el PDF del repositorio privado (' + e.message + '). ¿Borrar igual el resto?')) return; } }
    const ref = fs.collection('library').doc(id), cs = await ref.collection('chunks').get();
    for(let a = 0; a < cs.docs.length; a += 400){ const bt = fs.batch(); cs.docs.slice(a, a + 400).forEach(d => bt.delete(d.ref)); await bt.commit(); }
    const ps = await ref.collection('pdf').get();
    for(let a = 0; a < ps.docs.length; a += 400){ const bt = fs.batch(); ps.docs.slice(a, a + 400).forEach(d => bt.delete(d.ref)); await bt.commit(); }
    await ref.delete();
    try { await lbDB.del('books', id); await lbDB.del('files', id); } catch(e){}
    LIB.books = LIB.books.filter(x => x.id !== id); LIB.inc.delete(id); lbIndex(); LIB.res = null; LIB.pick = new Set(); LIB.note = ''; renderLib();
  } catch(e){ console.error(e); alert('No se pudo borrar el documento. Revisá tu conexión.'); }
}

/* ---------- visor de páginas ---------- */
const LBV = {id:'', p:1, doc:null, n:0, tok:0, loadingId:''};
async function lbViewer(id, p){
  const bk = LIB.books.find(x => x.id === id); if(!bk) return;
  let d = document.getElementById('lb-view');
  if(!d){
    d = document.createElement('dialog'); d.id = 'lb-view';
    d.innerHTML = '<div class="lbv-bar"><b id="lbv-t"></b><span><button class="btn soft" id="lbv-p" aria-label="Página anterior">◀</button> <button class="btn soft" id="lbv-n" aria-label="Página siguiente">▶</button> <button class="btn" id="lbv-g">➕ A la guía</button> <button class="btn" id="lbv-x">Cerrar</button></span></div><div id="lbv-s"></div><div id="lbv-b"></div>';
    document.body.appendChild(d);
    document.getElementById('lbv-x').onclick = () => d.close();
    document.getElementById('lbv-g').onclick = () => { guideAddMany([LBV.id + '|' + LBV.p]); const g = document.getElementById('lbv-g'); g.textContent = '✓ Agregada'; setTimeout(() => g.textContent = '➕ A la guía', 1200); };
    document.getElementById('lbv-p').onclick = () => lbPaint(LBV.p - 1);
    document.getElementById('lbv-n').onclick = () => lbPaint(LBV.p + 1);
  }
  if(LBV.id !== id){ if(LBV.doc && LBV.doc.destroy){ try { LBV.doc.destroy(); } catch(e){} } LBV.id = id; LBV.doc = null; LBV.tok++; LBV.loadingId = ''; LBV.n = bk.npages || (bk.pages || []).length; }
  d.showModal(); lbPaint(p);                                           // se abre YA, con el texto de la página, mientras baja el PDF original
  if(!LBV.doc && LBV.loadingId !== id){
    const tok = ++LBV.tok, st = document.getElementById('lbv-s'); LBV.loadingId = id;
    const bar = f => { if(tok === LBV.tok && st) st.innerHTML = '<small>Descargando el PDF original… ' + (f == null ? '' : Math.round(f * 100) + '%') + '</small><div class="lbv-bar2"><i style="width:' + Math.round((f || 0.05) * 100) + '%"></i></div>'; };
    bar(0.02);
    try {
      const f = await lbGetPdf(id, bar);
      if(f){
        if(tok === LBV.tok && st) st.innerHTML = '<small>Preparando la página…</small>';
        const pdfjs = await lbPdf(), doc = await pdfjs.getDocument({data:new Uint8Array(await f.arrayBuffer())}).promise;
        if(tok === LBV.tok) LBV.doc = doc; else { try { doc.destroy(); } catch(e){} }
      }
    } catch(e){ console.warn(e); }
    if(tok === LBV.tok){ LBV.loadingId = ''; if(st) st.innerHTML = ''; lbPaint(LBV.p); }
  }
}
async function lbPaint(p){
  const bk = LIB.books.find(x => x.id === LBV.id); if(!bk) return;
  p = Math.max(1, Math.min(LBV.n, p)); LBV.p = p;
  document.getElementById('lbv-t').textContent = bk.title + ' — página ' + p + ' de ' + LBV.n;
  const box = document.getElementById('lbv-b');
  const asText = note => { box.innerHTML = '<p class="lb-nopdf">' + note + '</p><pre>' + esc((bk.pages || [])[p - 1] || '(página sin texto)') + '</pre>'; };
  if(LBV.doc){
    try {
      box.innerHTML = '<canvas id="lbv-c"></canvas>';
      const pg = await LBV.doc.getPage(p), v1 = pg.getViewport({scale:1}), cv = document.getElementById('lbv-c');
      if(!cv || LBV.p !== p) return;
      const want = Math.min(1400, (box.clientWidth || 360) * Math.min(window.devicePixelRatio || 1, 2));      // tamaño justo para la pantalla (en el celular, menos píxeles = más rápido)
      const vp = pg.getViewport({scale:Math.max(0.5, Math.min(2.5, want / v1.width))});
      cv.width = vp.width; cv.height = vp.height;
      await pg.render({canvasContext:cv.getContext('2d'), canvas:cv, viewport:vp}).promise;
    } catch(e){ console.warn(e); if(LBV.p === p) asText('No se pudo dibujar la página. Te muestro el texto guardado.'); }
  } else if(LBV.loadingId === LBV.id){
    asText('Mientras se descarga el PDF original, te muestro el texto de la página.');
  } else {
    asText(bk.hasPdf ? 'No se pudo cargar el PDF original. Te muestro el texto guardado.' : 'Este documento no tiene el PDF original guardado en la nube. Te muestro el texto que quedó guardado.');
  }
}
