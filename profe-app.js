/* Profe Luján · app instalable (profe.html).
   Es solo la Profe: charla, fotos de ejercicios, gráficos y figuras. Reusa el mismo motor del portal (tutor.js + profe.js).
   - Alumnos: entran sin cuenta; la Profe funciona cuando la profesora activó “IA para alumnos” en el portal.
   - Docentes: se ingresa con el correo (menú ⋮); la clave de la IA se recupera sola desde la cuenta de la profesora.
     En la app la Profe no consulta los libros de la biblioteca: eso sigue en el portal. */

/* ---- piezas globales que esperan tutor.js y profe.js (en el portal las define app.js) ---- */
const TEACHER = String(window.TEACHER_EMAIL || '').toLowerCase();
let user = null, auth = null, fs = null;
const canEdit = () => !!user && String(user.email || '').toLowerCase() === TEACHER;
const isReader = () => !!user && !canEdit();
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const $ = s => document.querySelector(s);
function lbScript(src){ return new Promise((ok, no) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => no(new Error('No se pudo descargar ' + src)); document.head.appendChild(s); }); }

(function(){
  'use strict';
  const IMG = {normal:'img/profe-normal.webp', festejo:'img/profe-festejo.webp', error:'img/profe-error.webp', sorpresa:'img/profe-sorpresa.webp',
    pensando:'img/profe-pensando.webp', risa:'img/profe-risa.webp', bien:'img/profe-bien.webp', ok:'img/profe-ok.webp'};
  const MAXI = 3;
  const azar = a => Array.isArray(a) ? a[Math.floor(Math.random() * a.length)] : a;
  const chat = $('#chat'), q = $('#q'), send = $('#send'), att = $('#att'), file = $('#file'), th = $('#th'), av = $('#av'), sub = $('#sub'), sheet = $('#sheet');
  const st = {imgs:[], busy:false, ia:null, t:0, t2:0, inst:null};

  /* ---------- la Profe cambia de cara ---------- */
  function setAv(e){
    [...av.classList].forEach(c => { if(c.startsWith('av-')) av.classList.remove(c); }); void av.offsetWidth;
    e = IMG[e] ? e : 'normal'; av.src = IMG[e]; if(e !== 'normal') av.classList.add('av-' + e);
  }
  function reaccionar(e, ms){ e = azar(e); setAv(e); clearTimeout(st.t); if(e !== 'normal') st.t = setTimeout(() => setAv('normal'), ms || 2400); }

  /* ---------- texto: negrita, fórmulas (KaTeX), figuras ---------- */
  const mathOpts = {delimiters:[{left:'$$', right:'$$', display:true}, {left:'$', right:'$', display:false}], throwOnError:false};
  const pend = [];
  function typeset(el){ if(window.renderMathInElement){ try { renderMathInElement(el, mathOpts); } catch(e){} } else pend.push(el); }
  window.addEventListener('load', () => pend.splice(0).forEach(typeset));
  function mdHtml(t){                                                     // las fórmulas ($...$) quedan intactas para KaTeX
    return t.split(/(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/).map((seg, i) => i % 2 ? esc(seg)
      : esc(seg).replace(/\*\*(?=\S)([^*\n]*?\S)\*\*/g, '<b>$1</b>').replace(/(^|[\s(])\*(?=\S)([^*\n]*?\S)\*(?=[\s).,;:!?]|$)/g, '$1<i>$2</i>').replace(/^[ \t]*[-*] /gm, '• ')).join('');
  }
  const SIN_SVG = /```(?:svg|xml|html)?\s*<svg[\s\S]*?<\/svg>\s*```|<svg[\s\S]*?<\/svg>/gi;
  function tramo(txt, figs){                                              // donde está [[FIG:n]] va el gráfico que dibujó la herramienta graficar
    let h = '';
    String(txt || '').replace(SIN_SVG, '').split(/\[\[FIG:(\d+)\]\]/).forEach((seg, i) => {
      if(i % 2){ const c = figs[+seg] ? tutorCleanSvg(figs[+seg]) : ''; if(c) h += `<div class="fig">${c}</div>`; }
      else if(seg.trim()) h += mdHtml(seg.trim());
    });
    return h;
  }
  function renderIA(el, r){
    const figs = r.figs || [], sv = tutorSplit(String(r.text || ''));
    let h = tramo(sv.antes, figs);
    if(sv.svg){ const c = tutorCleanSvg(sv.svg); if(c) h += `<div class="fig">${c}</div>`; }   // figura geométrica que dibujó la Profe
    h += tramo(sv.despues, figs);
    if(r.calcs && r.calcs.length) h += `<details class="note"><summary>🧮 ${r.calcs.length} cálculo(s) con la calculadora</summary>${r.calcs.map(c => esc(c.e) + ' = <b>' + esc(c.r) + '</b>').join('<br>')}</details>`;
    el.innerHTML = h; typeset(el);
  }
  const vista = x => {                                                    // mientras se escribe la respuesta no se muestra el código de las figuras
    x = String(x || '').replace(/\[\[FIG:\d+\]\]/g, '📈');
    const sp = tutorSplit(x); if(sp.svg) return (sp.antes + '\n📐\n' + sp.despues).trim(); if(sp.dibujando) return (sp.antes + '\n📐 Dibujando la figura…').trim(); return x;
  };

  /* ---------- mensajes ---------- */
  let raf = 0;
  const bajar = () => { if(raf) return; raf = requestAnimationFrame(() => { raf = 0; chat.scrollTop = chat.scrollHeight; }); };
  function addMsg(rol){
    const d = document.createElement('div'); d.className = 'msg ' + rol;
    d.innerHTML = (rol === 'ia' ? `<img class="mav" src="${IMG.normal}" alt="">` : '') + '<div class="bub"></div>';
    chat.appendChild(d); return d.querySelector('.bub');
  }
  function chips(lista){
    const d = document.createElement('div'); d.className = 'chips';
    lista.forEach(([txt, accion]) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.textContent = txt; b.onclick = () => { d.remove(); if(accion === 'foto') file.click(); else enviar(accion); }; d.appendChild(b); });
    chat.appendChild(d);
  }
  function bienvenida(){
    chat.innerHTML = '';
    const docente = ProfeIA.modo() === 'docente', b = addMsg('ia');
    b.innerHTML = docente
      ? mdHtml('¡Hola, profe! 😊 Preguntame lo que necesites para tus clases: ejercicios, explicaciones, gráficos e ideas. **En la app no tengo los libros de la biblioteca** (esos los consultás desde el portal).')
      : mdHtml('¡Hola! 😊 Soy la **Profe Luján**. Preguntame lo que no entiendas de Matemática, o sacale una foto 📷 a un ejercicio de tu carpeta y lo vemos juntos.');
    if(st.ia && st.ia.ok) chips(docente
      ? [['📷 Subir la foto de un ejercicio', 'foto'], ['Armame 3 ejercicios de ecuaciones', 'Armame 3 ejercicios de ecuaciones de primer grado, con la resolución.'], ['Graficá y = x² − 4x + 3', 'Graficá y = x² − 4x + 3']]
      : [['📷 Subir la foto de un ejercicio', 'foto'], ['Explicame fracciones', 'Explicame cómo sumar fracciones con distinto denominador.'], ['Graficá y = 2x − 1', 'Graficá y = 2x − 1']]);
    else if(st.ia) avisoNoDisp();
  }
  function avisoNoDisp(){
    const d = document.createElement('div'); d.className = 'aviso';
    d.textContent = st.ia.nota || 'La Profe todavía no está habilitada. Pedile a tu profesora que active la ayuda con IA para alumnos.';
    chat.appendChild(d);
  }

  /* ---------- fotos ---------- */
  function pintaFotos(){
    th.hidden = !st.imgs.length;
    th.innerHTML = st.imgs.map((im, i) => `<span class="t1"><img src="${im.url}" alt="Foto ${i + 1}"><button type="button" data-x="${i}" aria-label="Quitar la foto ${i + 1}">✕</button></span>`).join('');
  }
  async function addFotos(files){
    const list = files.filter(f => /^image\//.test(f.type)); if(!list.length) return;
    for(const f of list){
      if(st.imgs.length >= MAXI){ alert('Podés adjuntar hasta ' + MAXI + ' fotos por consulta.'); break; }
      try { const [p] = await ProfeIA.prepararImagenes([f]); if(!p) throw new Error('No se pudo leer la foto.'); st.imgs.push(p); }
      catch(e){ alert(e.message || 'No se pudo leer la foto.'); }
    }
    pintaFotos(); q.focus();
  }

  /* ---------- enviar ---------- */
  function bloquear(b){ st.busy = b; send.disabled = b; att.disabled = b; }
  async function enviar(texto){
    if(st.busy || !(st.ia && st.ia.ok)) return;
    const t = String(texto !== undefined ? texto : q.value).trim(), imgs = st.imgs.slice(); if(!t && !imgs.length) return;
    chat.querySelectorAll('.chips').forEach(c => c.remove());
    q.value = ''; q.style.height = ''; st.imgs = []; pintaFotos(); bloquear(true);
    const me = addMsg('me'); me.textContent = t;
    if(imgs.length){ const w = document.createElement('div'); w.className = 'ths'; imgs.forEach(im => { const i = document.createElement('img'); i.src = im.url; i.alt = 'Foto adjunta'; w.appendChild(i); }); me.appendChild(w); }
    const el = addMsg('ia'); el.textContent = imgs.length ? '⏳ Mirando tu foto…' : '⏳ Pensando…'; bajar();
    clearTimeout(st.t); clearTimeout(st.t2); setAv(imgs.length ? 'sorpresa' : 'pensando');
    if(imgs.length) st.t2 = setTimeout(() => { if(st.busy) setAv('pensando'); }, 1600);
    let r, ya = false;
    try { r = await ProfeIA.preguntar(t, {imgs, onText: x => { ya = true; el.textContent = vista(x); bajar(); }, onEstado: x => { if(!ya) el.textContent = x; }}); }
    catch(e){ console.warn(e); r = {error:String(e.message || e)}; }
    clearTimeout(st.t2); bloquear(false);
    if(r.error){
      const m = r.error === 'sin-clave' ? 'Todavía no está habilitada la ayuda con IA.' : (!navigator.onLine ? 'No hay conexión a internet.' : 'No pude responder ahora: ' + r.error);
      el.textContent = '⚠️ ' + m; reaccionar('error', 3200);
    } else { renderIA(el, r); reaccionar(r.limite ? 'sorpresa' : ['bien', 'ok'], 2600); }
    bajar(); if(!matchMedia('(pointer:coarse)').matches) q.focus();
  }

  /* ---------- quién usa la app ---------- */
  async function refrescar(){
    st.ia = await ProfeIA.disponible();
    sub.textContent = st.ia.modo === 'docente' ? 'Modo docente · ' + (user && user.email || '') : 'Tu profe de Matemática';
    q.disabled = !st.ia.ok; att.disabled = !st.ia.ok || st.busy; send.disabled = !st.ia.ok || st.busy;
    q.placeholder = st.ia.ok ? 'Preguntale a la Profe…' : 'La Profe todavía no está habilitada';
    bienvenida(); reaccionar(st.ia.ok ? 'festejo' : 'normal', 1800);
  }
  function iniciarFirebase(){
    if(typeof firebase === 'undefined' || !window.FIREBASE_CONFIG){
      st.ia = {ok:false, modo:'alumno', nota:'No se pudo conectar. Revisá tu conexión a internet y volvé a abrir la app.'}; q.disabled = att.disabled = send.disabled = true; bienvenida(); return;
    }
    firebase.initializeApp(window.FIREBASE_CONFIG); auth = firebase.auth(); fs = firebase.firestore();
    let primera = true;
    auth.onAuthStateChanged(async u => {
      if(u && !canEditMail(u) && !u.emailVerified){ await auth.signOut(); alert('Falta confirmar tu correo. Abrí el mail que te enviamos, tocá el enlace y volvé a ingresar.'); return; }
      const cambio = (user && user.uid) !== (u && u.uid);
      user = u; if(!primera && !cambio) return; primera = false;
      try { ProfeIA.reiniciar(); } catch(e){}
      await refrescar();
    });
  }
  const canEditMail = u => String(u.email || '').toLowerCase() === TEACHER;

  /* ---------- menú ---------- */
  const esIOS = /iphone|ipad|ipod/i.test(navigator.userAgent), standalone = () => matchMedia('(display-mode:standalone)').matches || navigator.standalone;
  async function menu(){
    let alu = false; if(canEdit()) { try { alu = await ProfeIA.estadoAlumnos(); } catch(e){} }
    sheet.querySelector('#sheet-c').innerHTML = `<h2>Menú</h2>
      ${st.inst ? '<button type="button" class="opt" data-m="inst">📲 Instalar la app</button>' : (esIOS && !standalone() ? '<p class="mu">📲 Para instalarla en iPhone: tocá <b>Compartir</b> y después <b>“Agregar a inicio”</b>.</p>' : '')}
      ${user ? `<p class="mu">👩‍🏫 ${esc(user.email)}</p>` : ''}
      ${canEdit() ? `<button type="button" class="opt" data-m="alu">🤖 IA para alumnos: <b>${alu ? 'activada ✅' : 'desactivada'}</b><br><small class="mu">Tocá para ${alu ? 'desactivarla' : 'activarla'}</small></button>` : ''}
      ${user ? '<button type="button" class="opt" data-m="out">Salir</button>' : '<button type="button" class="opt" data-m="login">🔐 Soy docente: ingresar</button>'}
      <button type="button" class="opt" data-m="x">Cerrar</button>`;
    sheet.showModal();
  }
  function loginForm(){
    sheet.querySelector('#sheet-c').innerHTML = `<h2>Ingreso docente</h2><p class="mu">Los alumnos no necesitan ingresar.</p>
      <input id="lg-m" type="email" placeholder="Correo" autocomplete="username" inputmode="email"><input id="lg-p" type="password" placeholder="Contraseña" autocomplete="current-password">
      <div class="msg-e" id="lg-e"></div><button type="button" class="opt pri" id="lg-go">Ingresar</button><button type="button" class="opt" data-m="x">Cancelar</button>`;
    const go = async () => {
      const m = $('#lg-m').value.trim(), p = $('#lg-p').value, e = $('#lg-e'); if(!m || !p){ e.textContent = 'Escribí tu correo y tu contraseña.'; return; }
      e.textContent = 'Ingresando…';
      try { await auth.signInWithEmailAndPassword(m, p); sheet.close(); }
      catch(err){ e.textContent = /network/i.test(err.code || err.message) ? 'Sin conexión. Revisá internet.' : (/too-many/i.test(err.code || '') ? 'Demasiados intentos. Esperá unos minutos.' : 'Correo o contraseña incorrectos.'); }
    };
    $('#lg-go').onclick = go; $('#lg-p').onkeydown = ev => { if(ev.key === 'Enter') go(); };
  }
  sheet.addEventListener('click', async ev => {
    if(ev.target === sheet){ sheet.close(); return; }
    const b = ev.target.closest('[data-m]'); if(!b) return; const a = b.dataset.m;
    if(a === 'x') sheet.close();
    else if(a === 'login'){ if(!auth){ alert('Todavía no hay conexión con el servidor. Probá en unos segundos.'); return; } loginForm(); }
    else if(a === 'out'){ sheet.close(); try { await auth.signOut(); } catch(e){} }
    else if(a === 'inst'){ sheet.close(); instalar(); }
    else if(a === 'alu'){
      b.disabled = true; const on = !/activada ✅/.test(b.textContent); const r = await ProfeIA.activarAlumnos(on);
      sheet.close(); if(r.ok) reaccionar(on ? ['risa', 'ok'] : 'ok', 3000); else { reaccionar('error', 3200); alert(r.error || 'No se pudo cambiar.'); }
    }
  });

  /* ---------- instalación como app ---------- */
  const bn = $('#inst');
  async function instalar(){ if(!st.inst) return; st.inst.prompt(); try { await st.inst.userChoice; } catch(e){} st.inst = null; bn.hidden = true; }
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); st.inst = e; if(!localStorage.getItem('profe_inst_x') && !standalone()) bn.hidden = false; });
  window.addEventListener('appinstalled', () => { st.inst = null; bn.hidden = true; reaccionar('festejo', 2600); });
  $('#inst-go').onclick = instalar; $('#inst-x').onclick = () => { bn.hidden = true; try { localStorage.setItem('profe_inst_x', '1'); } catch(e){} };

  /* ---------- eventos ---------- */
  send.onclick = () => enviar();
  att.onclick = () => { if(!st.busy) file.click(); };
  file.onchange = async ev => { const fl = [...ev.target.files]; ev.target.value = ''; await addFotos(fl); };
  th.onclick = ev => { const b = ev.target.closest('[data-x]'); if(b && !st.busy){ st.imgs.splice(+b.dataset.x, 1); pintaFotos(); } };
  q.addEventListener('input', () => { q.style.height = 'auto'; q.style.height = Math.min(q.scrollHeight, 130) + 'px'; });
  q.addEventListener('keydown', ev => { if(ev.key === 'Enter' && !ev.shiftKey && !matchMedia('(pointer:coarse)').matches){ ev.preventDefault(); enviar(); } });
  $('#menu').onclick = menu;
  $('#nueva').onclick = () => { if(st.busy) return; try { ProfeIA.reiniciar(); } catch(e){} st.imgs = []; pintaFotos(); bienvenida(); reaccionar('ok', 1600); };
  window.addEventListener('offline', () => { sub.textContent = '📴 Sin conexión'; });
  window.addEventListener('online', () => { sub.textContent = st.ia && st.ia.modo === 'docente' ? 'Modo docente · ' + (user && user.email || '') : 'Tu profe de Matemática'; });
  Object.keys(IMG).forEach(k => { if(k !== 'normal'){ const i = new Image(); i.src = IMG[k]; } });

  /* ---------- arranque ---------- */
  if('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register('sw.js', {scope:'./profe.html'}).catch(e => console.warn('sw', e));
  if(!window.ProfeIA){ chat.innerHTML = '<div class="aviso">No se pudo cargar la Profe. Cerrá y volvé a abrir la app.</div>'; return; }
  iniciarFirebase();
})();
