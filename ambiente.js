/* Ambiente de la app: escena de aula (cursos) y de kiosco (biblioteca), la Profe Luján con sus 3 expresiones
   y los widgets: ejercicio del día en la pizarra, racha, mensaje de la Profe para el curso y página sugerida.
   Se coloca solo arriba de cada pestaña; no hace falta tocar el resto de la app. Para reaccionar desde otro archivo:
   AulaProfe.reaccionar('festejo' | 'error' | 'normal', 'texto opcional', milisegundos) */
(function(){
  'use strict';
  const IMG = {normal:'img/profe-normal.webp', festejo:'img/profe-festejo.webp', error:'img/profe-error.webp'};
  const BIBLIO = ['lib','guides'];                               // pestañas que van en la biblioteca
  const KIOSCO = ['tutor'];                                      // y en el kiosco; el resto, en el aula
  const SALUDO = {
    tasks:'¡Hola! Acá ves tus tareas y cuándo se entregan 🌟', materials:'Acá está el material para estudiar 📚', consultas:'¿Tenés una duda? Escribila y te respondo 💬',
    plans:'Organicemos las clases 📘', exams:'Preparemos las evaluaciones ✏️', gen:'Armá tu examen con ejercicios al azar 🧮',
    lib:'¿Qué tema buscamos hoy? También podés preguntarme por tus libros 📖', guides:'Armá tu guía con los ejercicios que elijas 📑', tutor:'Preguntame lo que no entiendas 🤖'
  };
  const TIPS = {lib:'Buscá por tema: “fracciones”, “ecuaciones”…', guides:'Armá una guía con los ejercicios que elijas', tutor:'Preguntame por un libro y su página'};
  const TEMAS = ['enteros','fracciones','ecuacion1','porcentaje','funcion_lineal','sistemas','factoreo','cuadratica','potencias','estadistica','probabilidad','divisibilidad','decimales','radicacion','notacion_cientifica','expresiones_alg','inecuaciones','sucesiones','combinatoria','comb_num','proporcionalidad','exp_log','polinomios'];

  const lsGet = k => { try{ return localStorage.getItem(k); }catch(e){ return null; } };
  const lsSet = (k, v) => { try{ localStorage.setItem(k, v); }catch(e){} };
  const ssGet = k => { try{ return sessionStorage.getItem(k); }catch(e){ return null; } };
  const ssSet = (k, v) => { try{ sessionStorage.setItem(k, v); }catch(e){} };
  const E = t => String(t ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const hoy = () => new Date().toLocaleDateString('en-CA');
  const ayer = () => new Date(Date.now() - 864e5).toLocaleDateString('en-CA');
  const hash = t => { let h = 2166136261; for(const c of String(t)){ h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const semilla = n => { let a = n >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const modo = () => { const t = document.body.dataset.tab; return BIBLIO.includes(t) ? 'biblioteca' : KIOSCO.includes(t) ? 'kiosco' : 'aula'; };
  const st = {root:null, mini:null, chat:null, ia:null, iaT:0, iaK:'', busy:false, key:'', tab:'', ej:null, sug:null, timer:null, bt:null, poll:null};

  /* ---------- datos de la app (se leen de app.js al momento de usarlos) ---------- */
  function info(){
    let cid = '', aviso = '', prof = false;
    try{ cid = courseId || ''; prof = canEdit(); const c = prof ? courses.find(x => x.id === cid) : studentCourse; aviso = String((c && c.pizarra) || '').trim(); }catch(e){}
    return {cid, aviso, prof};
  }

  /* ---------- ejercicio del día (reusa el generador de exámenes) ---------- */
  function ejercicio(seed){
    const ok = typeof GEN !== 'undefined' ? TEMAS.filter(k => typeof GEN[k] === 'function') : [];
    const pick = seed != null ? semilla(seed ^ 0x9e3779b9) : Math.random, old = Math.random;
    if(seed != null) Math.random = semilla(seed);                    // misma cuenta para todos durante el día
    try{
      const start = Math.floor(pick() * ok.length);
      for(let i = 0; i < ok.length; i++){
        try{
          const r = GEN[ok[(start + i) % ok.length]](Math.floor(pick() * 2)), plano = String(r[0]).replace(/<[^>]+>/g, '');
          if(plano.length <= 95 && !/observ|figura/i.test(plano)) return {q:String(r[0]), a:String(r[1])};
        }catch(e){}
      }
    } finally { Math.random = old; }
    return {q:'Calculá: <b>7 · 8 − 6</b>', a:'50'};
  }
  function ejHoy(i){
    const key = hoy() + '|' + i.cid;
    if(!st.ej || st.ej.dia !== key) st.ej = {dia:key, ...ejercicio(hash(key)), shown:false, done:false, extra:false};      // uno por día y por curso
    return st.ej;
  }

  /* ---------- racha de días practicando ---------- */
  function racha(){
    try{ const r = JSON.parse(lsGet('aula_racha') || '{}'); if(r.last && r.last !== hoy() && r.last !== ayer()) return 0; return r.n || 0; }catch(e){ return 0; }
  }
  function sumarRacha(){
    try{
      const r = JSON.parse(lsGet('aula_racha') || '{}'), h = hoy(); if(r.last === h) return r.n || 1;
      const n = (r.last === ayer() ? (r.n || 0) : 0) + 1; lsSet('aula_racha', JSON.stringify({n, last:h})); return n;
    }catch(e){ return 1; }
  }

  /* ---------- página sugerida (kiosco) ---------- */
  function sugerir(azar){
    if(typeof LIB === 'undefined' || !LIB.loaded || !LIB.books || !LIB.books.length) return null;
    const util = t => t && String(t).replace(/\s/g, '').length > 80;
    const libros = LIB.books.filter(b => (b.pages || []).some(util)); if(!libros.length) return null;
    const rnd = azar ? Math.random : semilla(hash(hoy()));
    const b = libros[Math.floor(rnd() * libros.length)], ps = []; b.pages.forEach((t, i) => { if(util(t)) ps.push(i + 1); });
    const p = ps[Math.floor(rnd() * ps.length)];
    let n = p; try{ if(typeof tutorRange === 'function') n = p + tutorRange(b).a - 1; }catch(e){}
    return {id:b.id, p, n, title:String(b.title || '').replace(/\s*\(\s*págs?\.?[^)]*\)\s*$/i, '')};
  }

  /* ---------- la escena ---------- */
  function css(){
    if(document.getElementById('esc-css')) return;
    const s = document.createElement('style'); s.id = 'esc-css';
    s.textContent = `
.esc{width:min(100%,430px);margin:0 auto 18px;container-type:inline-size;border-radius:20px;overflow:hidden;border:3px solid #6b3a1a;background:#6b3a1a;box-shadow:0 10px 26px rgba(0,0,0,.28)}
.esc[hidden],.esc-mini[hidden]{display:none}
.esc-vista{position:relative;overflow:hidden;background-repeat:no-repeat;background-size:100% auto;background-position:top center;background-color:#c9a77a}
.esc-aula .esc-vista{background-image:url(img/aula.webp);aspect-ratio:752/830}
.esc-kiosco .esc-vista{background-image:url(img/kiosco.webp);aspect-ratio:768/810}
.esc-biblioteca .esc-vista,.esc-biblioteca .esc-fr{background-image:url(img/biblioteca.webp);aspect-ratio:768/925}
.esc-fr{display:none;position:absolute;inset:0;z-index:2;pointer-events:none;background-repeat:no-repeat;background-size:100% auto;background-position:top center}
.esc-biblioteca .esc-fr{display:block;clip-path:inset(87% 0 0 0)}   /* el escritorio se dibuja por delante de la Profe: queda parada detrás del mostrador */
.esc-pz{position:absolute;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;overflow:hidden;color:#f6f2e4;font:600 13px/1.25 var(--fd);font-size:3.7cqw;text-shadow:0 1px 0 rgba(0,0,0,.3);padding:1.2cqw}
.esc-aula .esc-pz{left:19.9%;top:29.5%;width:64.5%;height:32.5%}
.esc-kiosco .esc-pz{left:33.5%;top:39.6%;width:49.5%;height:21%;font-size:3cqw}
.esc-biblioteca .esc-pz{left:35.9%;top:35.9%;width:29%;height:15.8%;font-size:2.9cqw;background:radial-gradient(ellipse at 40% 30%,#0a4a2d,#06361f);border-radius:3px}
.esc-biblioteca .pz-t{display:none}
.pz-t{font-size:.8em;color:#ffe28a;letter-spacing:.04em;margin-bottom:.3em}
.pz-q{font-size:1.1em}.pz-q b{color:#9be7ff}
.pz-a{margin-top:.35em;color:#ffe28a}
.esc-kiosco .pz-q,.esc-biblioteca .pz-q{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.esc-av{position:absolute;z-index:1;bottom:-1px;height:39%;width:auto;pointer-events:none;transform-origin:50% 100%;user-select:none}
.esc-aula .esc-av{right:3%}.esc-kiosco .esc-av{left:2%}
.esc-biblioteca .esc-av{left:37.8%;bottom:10.3%;height:36.5%}
.av-festejo{animation:esc-salto .8s ease}.av-error{animation:esc-sacudir .5s ease}
@keyframes esc-salto{0%,100%{transform:translateY(0)}30%{transform:translateY(-6%)}60%{transform:translateY(0)}80%{transform:translateY(-2%)}}
@keyframes esc-sacudir{0%,100%{transform:translateX(0)}25%{transform:translateX(-2.5%)}75%{transform:translateX(2.5%)}}
@media (prefers-reduced-motion:reduce){.esc-av{animation:none!important}}
.esc-bub{position:absolute;z-index:3;max-width:54%;background:#fffdf5;color:#3b2a1a;border:2px solid #3b2a1a;border-radius:14px;padding:6px 10px;font:700 12px/1.3 var(--fb);font-size:3.3cqw;box-shadow:0 3px 0 rgba(0,0,0,.25);overflow-wrap:anywhere}
.esc-bub[hidden]{display:none}
.esc-bub.pers{padding-right:26px}
.esc-aula .esc-bub{left:3%;bottom:6%}.esc-kiosco .esc-bub{left:37%;bottom:5%;max-width:46%}
.esc-biblioteca .esc-bub{left:2%;bottom:19%;max-width:33%}
.esc-bub::after{content:"";position:absolute;width:12px;height:12px;background:#fffdf5;transform:rotate(45deg)}
.esc-aula .esc-bub::after,.esc-biblioteca .esc-bub::after{right:-8px;bottom:14px;border-top:2px solid #3b2a1a;border-right:2px solid #3b2a1a}
.esc-kiosco .esc-bub::after{left:-8px;bottom:14px;border-left:2px solid #3b2a1a;border-bottom:2px solid #3b2a1a}
.esc-bx{position:absolute;top:1px;right:3px;border:0;background:none;color:#7a5a3a;font-size:14px;line-height:1;cursor:pointer;padding:4px}
.esc-bub:not(.pers) .esc-bx{display:none}
.esc-hide{position:absolute;top:6px;right:6px;z-index:4;width:30px;height:30px;border-radius:50%;border:0;background:rgba(0,0,0,.45);color:#fff;font-size:15px;cursor:pointer}
.esc-bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:center;padding:10px;background:linear-gradient(#ac5e2b,#8c4c22)}
.esc-aula .esc-bar{background:linear-gradient(#b24f1d,#954218)}
.esc-biblioteca .esc-bar{background:linear-gradient(#8d4a22,#703717)}
.esc-b{font:700 .88rem var(--fb);padding:9px 14px;min-height:40px;border-radius:12px;border:2px solid #4a2410;background:#fff4de;color:#4a2410;cursor:pointer;box-shadow:0 2px 0 #4a2410}
.esc-b.ok{background:#c7f2a7}.esc-b:disabled{opacity:.55;cursor:default}
.esc-chip{margin-left:auto;font:700 .85rem var(--fb);color:#fff4de;background:rgba(0,0,0,.28);padding:4px 10px;border-radius:99px}
.esc-in{flex:1 1 180px;min-width:0;padding:9px 10px;border-radius:10px;border:2px solid #4a2410;font:600 .9rem var(--fb);background:#fffdf5;color:#3b2a1a}
.esc-mini{display:block;margin:0 auto 14px;padding:8px 16px;border-radius:99px;border:2px solid var(--bd);background:var(--sf);color:var(--tx);font:700 .85rem var(--fb);cursor:pointer}

.esc-ask{display:flex;gap:8px;padding:0 10px 10px;background:#8c4c22}
.esc-aula .esc-ask{background:#954218}.esc-biblioteca .esc-ask{background:#703717}
.esc-ask[hidden]{display:none}
.esc-q{flex:1;min-width:0;padding:11px 12px;border-radius:12px;border:2px solid #4a2410;font:600 .95rem var(--fb);background:#fffdf5;color:#3b2a1a}
.esc-q:disabled{opacity:.8}
.esc-send{min-width:48px;border-radius:12px;border:2px solid #4a2410;background:#c7f2a7;color:#4a2410;font-size:1.1rem;cursor:pointer;box-shadow:0 2px 0 #4a2410}
.esc-send:disabled{opacity:.55;cursor:default}
.esc.esc-open{border-radius:20px 20px 0 0;border-bottom-width:0;margin-bottom:0}
.esc-chat{width:min(100%,430px);margin:0 auto 18px;border-radius:0 0 20px 20px;border:3px solid #6b3a1a;border-top:0;box-shadow:0 10px 26px rgba(0,0,0,.2);background:var(--sf);color:var(--tx);overflow:hidden}
.esc-chat[hidden]{display:none}
.esc-chat-h{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:8px 12px;font:700 .9rem var(--fb);border-bottom:1px solid var(--bd)}
.esc-lnk{border:0;background:none;color:var(--ac);cursor:pointer;font:700 .8rem var(--fb);padding:6px}
.esc-msgs{max-height:min(62vh,480px);overflow-y:auto;padding:10px 12px 14px;display:flex;flex-direction:column;gap:10px}
.esc-msgs[hidden]{display:none}
.esc-m{display:flex;gap:8px;align-items:flex-start}
.esc-m.me{justify-content:flex-end}
.esc-mt{padding:9px 12px;max-width:90%;overflow-wrap:anywhere;white-space:pre-wrap;line-height:1.45;font-size:.93rem}
.esc-m.me .esc-mt{background:var(--plans-bg);border-radius:14px 14px 4px 14px}
.esc-m.ia .esc-mt{background:var(--sf2);border:1px solid var(--bd);border-radius:14px 14px 14px 4px}
.esc-mav{width:34px;height:34px;border-radius:50%;object-fit:cover;object-position:50% 12%;background:#f3d9b8;border:2px solid #4a2410;flex:none}
.esc-note{font-size:.8rem;color:var(--mu);margin-top:6px;white-space:normal}
.esc-fig{background:#fff;border-radius:10px;padding:6px;margin:8px 0;border:1px solid var(--bd);white-space:normal}
.esc-warn{flex-basis:100%;font:600 .78rem/1.3 var(--fb);color:#fff4de;text-align:center}
.esc-info{font:700 .88rem var(--fb);color:#fff4de}
@media print{.esc,.esc-mini,.esc-chat{display:none!important}}`;
    document.head.appendChild(s);
  }

  function build(){
    css();
    const root = document.createElement('section'); root.id = 'escena'; root.className = 'esc'; root.setAttribute('aria-label', 'La Profe Luján');
    root.innerHTML = `<div class="esc-vista"><div class="esc-pz"></div><img class="esc-av" src="${IMG.normal}" alt="La Profe Luján" width="320" height="445" draggable="false"><div class="esc-fr"></div>
      <div class="esc-bub" hidden><span class="esc-bt"></span><button type="button" class="esc-bx" aria-label="Cerrar el mensaje">✕</button></div>
      <button type="button" class="esc-hide" aria-label="Ocultar la escena" title="Ocultar">▾</button></div><div class="esc-bar"></div>
      <div class="esc-ask" hidden><input class="esc-q" type="text" maxlength="700" placeholder="Preguntale a la Profe…" aria-label="Preguntale a la Profe" autocomplete="off"><button type="button" class="esc-send" aria-label="Enviar la pregunta">➤</button></div>`;
    const chat = document.createElement('section'); chat.id = 'escena-chat'; chat.className = 'esc-chat'; chat.hidden = true; chat.setAttribute('aria-label', 'Charla con la Profe');
    chat.innerHTML = `<div class="esc-chat-h"><b>💬 Charla con la Profe</b><span><button type="button" class="esc-lnk" data-c="nueva">🧹 Nueva charla</button><button type="button" class="esc-lnk" data-c="min" aria-label="Minimizar la charla">▾</button></span></div><div class="esc-msgs" aria-live="polite"></div>`;
    root.querySelector('.esc-q').onkeydown = ev => { if(ev.key === 'Enter' && !ev.isComposing){ ev.preventDefault(); enviar(); } };
    root.querySelector('.esc-send').onclick = () => enviar();
    chat.onclick = ev => {
      const b = ev.target.closest('[data-c]'); if(!b) return;
      if(b.dataset.c === 'nueva'){ if(st.busy) return; if(window.ProfeIA) ProfeIA.reiniciar(); chat.querySelector('.esc-msgs').innerHTML = ''; chat.hidden = true; sincChat(); }
      else { const ms = chat.querySelector('.esc-msgs'); ms.hidden = !ms.hidden; b.textContent = ms.hidden ? '▴' : '▾'; }
    };
    st.chat = chat;
    const mini = document.createElement('button'); mini.type = 'button'; mini.id = 'escena-show'; mini.className = 'esc-mini'; mini.textContent = '🏫 Mostrar a la Profe'; mini.hidden = true;
    root.querySelector('.esc-hide').onclick = () => { lsSet('aula_escena', 'off'); aplicarVisible(); };
    mini.onclick = () => { lsSet('aula_escena', 'on'); aplicarVisible(); };
    root.querySelector('.esc-bx').onclick = () => { const i = info(); ssSet('aula_av_x', String(hash(i.aviso))); hideBubble(); };
    root.querySelector('.esc-bar').onclick = ev => { const b = ev.target.closest('[data-a]'); if(b && ACC[b.dataset.a]) ACC[b.dataset.a](b); };
    root.querySelector('.esc-bar').onkeydown = ev => { if(ev.key === 'Enter' && ev.target.classList.contains('esc-in')) ACC.gm(); };
    st.root = root; st.mini = mini;
    setTimeout(() => { ['festejo', 'error'].forEach(k => { const im = new Image(); im.src = IMG[k]; }); }, 1500);   // se precargan para que el cambio de cara sea instantáneo
  }
  const aplicarVisible = () => { const off = lsGet('aula_escena') === 'off'; st.root.hidden = off; st.mini.hidden = !off; st.chat.hidden = off || !qc('.esc-msgs').children.length; sincChat(); };
  const q = s => st.root.querySelector(s);
  const qc = s => st.chat.querySelector(s);
  const sincChat = () => st.root.classList.toggle('esc-open', !st.chat.hidden && !st.root.hidden);

  /* ---------- avatar y globo de diálogo ---------- */
  function setAv(estado){
    const im = q('.esc-av'); if(!im) return;
    im.classList.remove('av-festejo', 'av-error'); void im.offsetWidth;
    im.src = IMG[estado] || IMG.normal; if(estado !== 'normal') im.classList.add('av-' + estado);
  }
  function showBubble(texto, ms, pers){
    const b = q('.esc-bub'); q('.esc-bt').textContent = texto; b.classList.toggle('pers', !!pers); b.hidden = false;
    clearTimeout(st.bt); if(ms) st.bt = setTimeout(base, ms);
  }
  const hideBubble = () => { clearTimeout(st.bt); q('.esc-bub').hidden = true; };
  function base(){                                                  // lo que queda en pantalla cuando no hay una reacción: el mensaje de la Profe al curso
    const i = info();
    if(modo() === 'aula' && i.aviso && ssGet('aula_av_x') !== String(hash(i.aviso))) showBubble(i.aviso, 0, true); else hideBubble();
  }
  function reaccionar(estado, texto, ms){
    if(!st.root) return; ms = ms || 3200;
    setAv(estado); if(texto) showBubble(texto, ms, false);
    clearTimeout(st.timer); st.timer = setTimeout(() => { setAv('normal'); base(); }, ms);
  }

  /* ---------- widgets ---------- */
  const ACC = {
    ver(){ st.ej.shown = true; pizAula(); barAula(); },
    si(){ st.ej.done = true; const n = sumarRacha(); pizAula(); barAula(); reaccionar('festejo', n > 1 ? '¡Muy bien! ' + n + ' días seguidos 🔥' : '¡Muy bien! Eso es practicar 💪'); },
    no(){ st.ej.done = true; pizAula(); barAula(); reaccionar('error', 'No pasa nada: mirá cómo se hace y probá con otro 💪', 4200); },
    otro(){ st.ej = {dia:st.ej.dia, ...ejercicio(null), shown:false, done:false, extra:true}; pizAula(); barAula(); },
    msg(){ const i = info(); q('.esc-bar').innerHTML = `<input class="esc-in" maxlength="160" placeholder="Mensaje de la Profe para tu curso" aria-label="Mensaje para el curso" value="${E(i.aviso)}"><button type="button" class="esc-b ok" data-a="gm">Guardar</button><button type="button" class="esc-b" data-a="cm">Cancelar</button>`; q('.esc-in').focus(); },
    cm(){ barAula(); },
    async gm(){
      const i = info(), inp = q('.esc-in'); if(!inp || !i.cid) return; const txt = inp.value.trim().slice(0, 160);
      try{
        await fs.collection('courses').doc(i.cid).update({pizarra:txt});
        const c = courses.find(x => x.id === i.cid); if(c) c.pizarra = txt;
        ssSet('aula_av_x', ''); barAula(); base(); reaccionar('festejo', txt ? '¡Mensaje publicado!' : 'Mensaje borrado', 1800);
      }catch(e){ console.warn(e); reaccionar('error', 'No se pudo guardar. Probá de nuevo.', 2500); }
    },
    async iaal(){
      const on = await ProfeIA.estadoAlumnos();
      q('.esc-bar').innerHTML = `<span class="esc-info">${on ? '✅ Los alumnos pueden hablar con la Profe' : '⛔ Los alumnos todavía no pueden hablar con la Profe'}</span>` +
        (on ? `<button type="button" class="esc-b" data-a="iaoff">Desactivar</button>` : `<button type="button" class="esc-b ok" data-a="iaon">Activar</button>`) +
        `<button type="button" class="esc-b" data-a="cm">Cerrar</button><div class="esc-warn">Al activarlo, la clave de tu IA queda legible para quien entre al aula. Usá una clave solo para esto y restringila a tu sitio en Google AI Studio. Al desactivar, la clave se borra de ahí.</div>`;
    },
    async iaon(){
      if(!confirm('Se va a compartir tu clave de IA con las personas que entren a tus cursos. ¿Querés activarlo?')) return;
      const r = await ProfeIA.activarAlumnos(true); barAula();
      reaccionar(r.ok ? 'festejo' : 'error', r.ok ? '¡Listo! Tus alumnos ya pueden preguntarme 💛' : r.error, 3800);
    },
    async iaoff(){ const r = await ProfeIA.activarAlumnos(false); barAula(); reaccionar(r.ok ? 'normal' : 'error', r.ok ? 'Listo: los alumnos ya no pueden usar la IA.' : r.error, 3000); },
    abrir(){ const s = st.sug; if(!s || typeof lbViewer !== 'function') return; reaccionar('festejo', '¡Buena elección! 📖', 1800); lbViewer(s.id, s.p); },
    otra(){ st.sug = sugerir(true); pizKiosco(); }
  };
  function pizAula(){
    const e = st.ej;
    q('.esc-pz').innerHTML = `<div class="pz-t">${e.extra ? '➕ Otro ejercicio' : '✏️ Ejercicio del día'}</div><div class="pz-q">${e.q}</div>${e.shown ? `<div class="pz-a">→ ${e.a}</div>` : ''}`;
  }
  function barAula(){
    const e = st.ej, i = info();
    let h = !e.shown ? `<button type="button" class="esc-b" data-a="ver">👀 Ver respuesta</button>`
      : !e.done ? `<button type="button" class="esc-b ok" data-a="si">🎉 Me salió</button><button type="button" class="esc-b" data-a="no">🤔 No me salió</button>`
      : `<button type="button" class="esc-b" data-a="otro">➕ Otro ejercicio</button>`;
    if(i.prof && i.cid) h += `<button type="button" class="esc-b" data-a="msg">💬 Mensaje de la Profe</button>`;
    if(i.prof && window.ProfeIA) h += `<button type="button" class="esc-b" data-a="iaal">🤖 IA para alumnos</button>`;
    q('.esc-bar').innerHTML = h + `<span class="esc-chip" title="Días seguidos practicando">🔥 ${racha()}</span>`;
  }
  function pizKiosco(){
    const s = st.sug, t = document.body.dataset.tab;
    q('.esc-pz').innerHTML = s
      ? `<div class="pz-t">📚 Para hoy</div><div class="pz-q">${E(s.title)}</div><div class="pz-a">pág. ${s.n}</div>`
      : `<div class="pz-t">📚 Biblioteca</div><div class="pz-q">${E(TIPS[t] || TIPS.lib)}</div>`;
    q('.esc-bar').innerHTML = `<button type="button" class="esc-b ok" data-a="abrir" ${s ? '' : 'disabled'}>📖 Abrir esa página</button><button type="button" class="esc-b" data-a="otra" ${s ? '' : 'disabled'}>🎲 Otra</button>`;
  }
  function paint(){
    const m = modo(), i = info();
    st.root.classList.toggle('esc-aula', m === 'aula'); st.root.classList.toggle('esc-kiosco', m === 'kiosco'); st.root.classList.toggle('esc-biblioteca', m === 'biblioteca');
    clearInterval(st.poll);
    if(m === 'aula'){ ejHoy(i); pizAula(); barAula(); }
    else {
      st.sug = st.sug || sugerir(false); pizKiosco();
      if(!st.sug){ let n = 0; st.poll = setInterval(() => { if(++n > 40 || modo() === 'aula'){ clearInterval(st.poll); return; } const s = sugerir(false); if(s){ clearInterval(st.poll); st.sug = s; pizKiosco(); } }, 1500); }
    }
    base(); askUI();
  }

  /* ---------- charla con la Profe (IA) ---------- */
  function mdHtml(t){                                              // negrita y listas simples; las fórmulas ($...$) quedan intactas para KaTeX
    return t.split(/(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/).map((seg, i) => i % 2 ? E(seg)
      : E(seg).replace(/\*\*(?=\S)([^*\n]*?\S)\*\*/g, '<b>$1</b>').replace(/(^|[\s(])\*(?=\S)([^*\n]*?\S)\*(?=[\s).,;:!?]|$)/g, '$1<i>$2</i>').replace(/^[ \t]*[-*] /gm, '• ')).join('');
  }
  function renderIA(el, r){
    const sinSvg = String(r.text || '').replace(/```(?:svg|xml|html)?\s*<svg[\s\S]*?<\/svg>\s*```|<svg[\s\S]*?<\/svg>/gi, '');
    let h = ''; const figs = r.figs || [];
    sinSvg.split(/\[\[FIG:(\d+)\]\]/).forEach((seg, i) => {
      if(i % 2){ const c = figs[+seg] && typeof tutorCleanSvg === 'function' ? tutorCleanSvg(figs[+seg]) : ''; if(c) h += `<div class="esc-fig">${c}</div>`; }
      else if(seg.trim()) h += mdHtml(seg.trim());
    });
    if(r.calcs && r.calcs.length) h += `<details class="esc-note"><summary>🧮 ${r.calcs.length} cálculo(s) con la calculadora</summary>${r.calcs.map(c => E(c.e) + ' = <b>' + E(c.r) + '</b>').join('<br>')}</details>`;
    if(r.fuentes && r.fuentes.length) h += `<div class="esc-note">📚 <b>Páginas consultadas:</b> ${E(r.fuentes.join(' · '))}${r.vistas && r.vistas.length ? '<br>👁 <b>Vistas como imagen:</b> ' + E(r.vistas.join(' · ')) : ''}</div>`;
    el.innerHTML = h;
    if(window.renderMathInElement) try { renderMathInElement(el, {delimiters:[{left:'$$', right:'$$', display:true}, {left:'$', right:'$', display:false}], throwOnError:false}); } catch(e){}
  }
  function addMsg(rol){
    const d = document.createElement('div'); d.className = 'esc-m ' + rol;
    d.innerHTML = (rol === 'ia' ? `<img class="esc-mav" src="${IMG.normal}" alt="" width="34" height="34">` : '') + '<div class="esc-mt"></div>';
    qc('.esc-msgs').appendChild(d); st.chat.hidden = false; qc('.esc-msgs').hidden = false; sincChat();
    return d.querySelector('.esc-mt');
  }
  const bajar = () => { const m = qc('.esc-msgs'); m.scrollTop = m.scrollHeight; };
  async function enviar(){
    if(st.busy || !window.ProfeIA) return;
    const inp = q('.esc-q'), t = inp.value.trim(); if(!t) return;
    inp.value = ''; st.busy = true; q('.esc-send').disabled = true;
    addMsg('me').textContent = t;
    const el = addMsg('ia'); el.textContent = '⏳ Pensando…'; bajar();
    try{ st.chat.scrollIntoView({block:'nearest', behavior:'smooth'}); }catch(e){}
    showBubble('Dejame pensarlo con vos… ✏️', 0, false);
    let r, ya = false;
    try{
      r = await ProfeIA.preguntar(t, {
        onText: x => { ya = true; el.textContent = x.replace(/\[\[FIG:\d+\]\]/g, '📈'); bajar(); },
        onEstado: x => { if(!ya) el.textContent = x; }
      });
    }catch(e){ console.warn(e); r = {error:String(e.message || e)}; }
    st.busy = false; q('.esc-send').disabled = false;
    if(r.error){
      const msg = r.error === 'sin-clave' ? 'Todavía no está habilitada la ayuda con IA.' : 'No pude responder ahora: ' + r.error;
      el.textContent = '⚠️ ' + msg; reaccionar('error', 'Uy, no pude responder. Probá de nuevo en un momento 💛', 3500);
    } else {
      renderIA(el, r); reaccionar(r.limite ? 'normal' : 'festejo', '', 1500);
    }
    base(); bajar(); inp.focus();
  }
  async function askUI(){                                          // muestra el campo para preguntarle a la Profe según quién sea y si está habilitado
    const ask = q('.esc-ask'); if(!ask) return;
    if(modo() === 'kiosco' || !window.ProfeIA){ ask.hidden = true; return; }       // en la pestaña Tutor IA ya hay un chat propio
    let uid = ''; try{ uid = (typeof user !== 'undefined' && user && user.uid) || ''; }catch(e){}
    const idk = ProfeIA.modo() + '|' + uid;                                          // si cambia quién usa la página (ingresó la profesora, otra cuenta…), se vuelve a consultar
    if(!st.ia || st.iaK !== idk || Date.now() - st.iaT > 300000){ ask.hidden = true; st.ia = {ok:false}; st.iaK = idk; try{ st.ia = await ProfeIA.disponible(); }catch(e){} st.iaT = Date.now(); if(st.iaK !== idk) return; }
    if(modo() === 'kiosco') return;
    const d = st.ia, inp = q('.esc-q'), btn = q('.esc-send');
    if(d.ok){ ask.hidden = false; inp.disabled = false; btn.disabled = st.busy; inp.placeholder = modo() === 'biblioteca' ? 'Preguntale a la Profe por tus libros…' : 'Preguntale a la Profe…'; }
    else if(d.nota){ ask.hidden = false; inp.disabled = true; btn.disabled = true; inp.placeholder = d.nota; }
    else ask.hidden = true;
  }

  /* ---------- se mantiene arriba de #main aunque cada pestaña se redibuje ---------- */
  function sync(){
    const main = document.getElementById('main'); if(!main || !st.root) return;
    if(main.firstElementChild !== st.root) main.prepend(st.root, st.chat, st.mini);
    const i = info(), t = document.body.dataset.tab || '', key = [modo(), i.cid, i.aviso, i.prof].join('|');
    aplicarVisible();
    if(key !== st.key){ st.key = key; paint(); }
    if(t !== st.tab){ st.tab = t; const k = 'aula_hi_' + t; if(SALUDO[t] && !ssGet(k) && !(modo() === 'aula' && i.aviso)){ ssSet(k, '1'); showBubble(SALUDO[t], 4500, false); } }
  }
  function init(){
    const main = document.getElementById('main'); if(!main) return;
    build(); sync();
    new MutationObserver(() => { if(main.firstElementChild !== st.root) sync(); }).observe(main, {childList:true});
    new MutationObserver(() => sync()).observe(document.body, {attributes:true, attributeFilter:['data-tab']});
  }
  window.AulaProfe = {reaccionar, decir:(t, ms) => { if(st.root) showBubble(t, ms || 3000, false); }, sync};
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
