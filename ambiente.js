/* Ambiente de la app: escena de aula (cursos) y de kiosco (biblioteca), la Profe Luján con sus 8 expresiones
   y los widgets: ejercicio del día en la pizarra, racha, mensaje de la Profe para el curso y página sugerida.
   Se coloca solo arriba de cada pestaña; no hace falta tocar el resto de la app. Para reaccionar desde otro archivo:
   AulaProfe.reaccionar('festejo' | 'risa' | 'bien' | 'ok' | 'sorpresa' | 'pensando' | 'error' | 'normal', 'texto opcional', milisegundos)
   También acepta una lista y elige una al azar: AulaProfe.reaccionar(['bien', 'ok'], '¡Listo!') */
(function(){
  'use strict';
  const IMG = {normal:'img/profe-normal.webp', festejo:'img/profe-festejo.webp', error:'img/profe-error.webp',
    sorpresa:'img/profe-sorpresa.webp',      // manos en las mejillas: llega una foto, se terminó el cupo del día
    pensando:'img/profe-pensando.webp',      // brazos cruzados y sonrisa: mientras piensa la respuesta
    risa:'img/profe-risa.webp',              // carcajada: acertaste el ejercicio del día
    bien:'img/profe-bien.webp',              // pulgar arriba (ojos cerrados): respondió bien
    ok:'img/profe-ok.webp'};                 // pulgar arriba (ojos abiertos): listo, guardado
  const MAXI = 3;                                                // fotos por consulta
  const azar = a => Array.isArray(a) ? a[Math.floor(Math.random() * a.length)] : a;
  const BIBLIO = ['lib','guides'];                               // pestañas que van en la biblioteca
  const KIOSCO = ['tutor'];                                      // y en el kiosco
  /* Escenas propias de cada pestaña (si una pestaña no figura acá, usa el aula de siempre).
     Medidas en píxeles de la imagen original (768 de ancho):
       H  = alto que se muestra (se recorta justo donde empieza el frente del mostrador, así la barra de botones sigue el mueble)
       pz = pizarrón o pantalla donde se escribe (x, y, ancho, alto, tamaño de letra en cqw, tono 'dark'/'light', fondo, max = largo máximo del ejercicio)
       av = dónde se para la Profe: cx = centro, by = dónde apoya (pie), h = alto, s = 'r' si se ancla a la derecha, i = 'a la izquierda' al entrar
       fr = desde qué alto el mostrador se dibuja POR DELANTE de ella (queda parada detrás): un número, o una línea quebrada [[x,y],…] que sigue el borde real del escritorio
       bub = globo de diálogo: s = 'l' izquierda / 'r' derecha, b = % desde abajo, w = % de ancho · bar = colores de la barra */
  const ESC = {
    planificaciones:{H:925, pz:{x:272, y:367, w:236, h:90, fs:2.6, tone:'dark', bg:'radial-gradient(ellipse at 40% 30%,#0a4a2d,#06361f)', max:62, noT:1}, av:{cx:410, by:842, h:337}, fr:819, bub:{s:'l', b:19, w:33}, bar:['#994e33', '#773c27'], bgc:'#d9a07a'},
    examenes:{H:975, pz:{x:345, y:488, w:290, h:112, fs:3.3, tone:'dark', bg:'rgba(6,58,40,.93)', noT:1}, av:{cx:200, by:882, h:320}, fr:[[0, 858], [112, 858], [112, 842], [284, 842], [284, 858], [768, 858]], bub:{s:'r', b:5, w:30}, bar:['#a2522c', '#7e4021'], bgc:'#e8b07a'},
    tareas:{H:870, pz:{x:196, y:402, w:407, h:250, fs:4, tone:'light', bg:'radial-gradient(ellipse at 50% 40%,#fbe9d3,#f5dcc2)', padB:13}, av:{cx:345, by:815, h:255}, fr:782, bub:{s:'l', b:8, w:33}, bar:['#783726', '#5d2a1d'], bgc:'#f0d9b5'},
    materiales:{H:880, pz:{x:183, y:428, w:415, h:236, fs:3.2, tone:'light', bg:'#ebeff2', list:1, padL:7.4, rows:3}, av:{cx:465, by:815, h:240}, fr:790, bub:{s:'r', b:7, w:28}, bar:['#7a3d29', '#5f2f1f'], bgc:'#f0d9b5'},
    consultas:{H:925, pz:{x:270, y:332, w:240, h:154, fs:3, tone:'dark', bg:'radial-gradient(ellipse at 40% 30%,#0a4a2d,#06361f)'}, av:{cx:410, by:842, h:337}, fr:819, bub:{s:'l', b:19, w:33}, bar:['#964a30', '#753925'], bgc:'#d9a07a'}
  };
  const ESCENAS = {plans:'planificaciones', exams:'examenes', gen:'examenes', tasks:'tareas', materials:'materiales', consultas:'consultas'};
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
  const modo = () => { const t = document.body.dataset.tab; return BIBLIO.includes(t) ? 'biblioteca' : KIOSCO.includes(t) ? 'kiosco' : ESCENAS[t] || 'aula'; };
  const tipo = () => { const m = modo(); return (m === 'biblioteca' || m === 'kiosco') ? 'sug' : m === 'materiales' ? 'mat' : 'ej'; };   // qué widget lleva la escena
  const st = {abierto:false, escena:'', root:null, mini:null, chat:null, ia:null, iaT:0, iaK:'', busy:false, imgs:[], t2:null, key:'', tab:'', ej:null, sug:null, timer:null, bt:null, poll:null};

  /* ---------- datos de la app (se leen de app.js al momento de usarlos) ---------- */
  function info(){
    let cid = '', aviso = '', prof = false;
    try{ cid = courseId || ''; prof = canEdit(); const c = prof ? courses.find(x => x.id === cid) : studentCourse; aviso = String((c && c.pizarra) || '').trim(); }catch(e){}
    return {cid, aviso, prof};
  }

  /* ---------- ejercicio del día (reusa el generador de exámenes) ---------- */
  function ejercicio(seed, max){
    const ok = typeof GEN !== 'undefined' ? TEMAS.filter(k => typeof GEN[k] === 'function') : [];
    const pick = seed != null ? semilla(seed ^ 0x9e3779b9) : Math.random, old = Math.random;
    if(seed != null) Math.random = semilla(seed);                    // misma cuenta para todos durante el día
    try{
      const start = Math.floor(pick() * ok.length);
      for(let i = 0; i < ok.length; i++){
        try{
          const r = GEN[ok[(start + i) % ok.length]](Math.floor(pick() * 2)), plano = String(r[0]).replace(/<[^>]+>/g, '');
          if(plano.length <= (max || 95) && !/observ|figura/i.test(plano)) return {q:String(r[0]), a:String(r[1])};
        }catch(e){}
      }
    } finally { Math.random = old; }
    return {q:'Calculá: <b>7 · 8 − 6</b>', a:'50'};
  }
  function ejHoy(i){
    const mx = (ESC[modo()] && ESC[modo()].pz.max) || 95, key = hoy() + '|' + i.cid + '|' + mx;
    if(!st.ej || st.ej.dia !== key) st.ej = {dia:key, ...ejercicio(hash(key), mx), shown:false, done:false, extra:false};      // uno por día y por curso (en un pizarrón chico, más corto)
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
  function cssEscenas(){
    const pc = v => (v * 100).toFixed(2) + '%', aw = h => h * 743 / 1034;     // ancho de la Profe según su alto
    return `
@keyframes esc-entra-d{from{transform:translateX(70%);opacity:0}to{transform:none;opacity:1}}
@keyframes esc-entra-i{from{transform:translateX(-70%);opacity:0}to{transform:none;opacity:1}}
.av-entra-d{animation:esc-entra-d .75s ease-out}.av-entra-i{animation:esc-entra-i .75s ease-out}
.mt-r{display:flex;gap:.55em;align-items:center;width:100%;text-align:left;padding:.28em .45em;border-bottom:1px solid rgba(18,38,61,.14)}
.mt-r span:last-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:700}
.mt-t{font-size:.8em;font-weight:800;color:#2a6fa8;letter-spacing:.03em;margin-bottom:.15em}` + Object.keys(ESC).map(k => {
      const c = ESC[k], p = c.pz, a = c.av, H = c.H, w = aw(a.h), clara = p.tone === 'light';
      const pos = a.s === 'r' ? `right:${pc(Math.max(0, (768 - (a.cx + w / 2)) / 768))}` : `left:${pc(Math.max(0, (a.cx - w / 2) / 768))}`;
      const izq = c.bub.s === 'l';
      return `
.esc-${k} .esc-vista,.esc-${k} .esc-fr{background-image:url(img/${k}.webp);aspect-ratio:768/${H};--h0:calc(100cqw*${H}/768)}
.esc-${k} .esc-vista{background-color:${c.bgc}}
.esc-${k} .esc-fr{display:block;clip-path:polygon(${(Array.isArray(c.fr) ? c.fr : [[0, c.fr], [768, c.fr]]).map(([x, y]) => pc(x / 768) + ' ' + pc(y / H)).join(',')},100% 100%,0 100%)}
.esc-${k} .esc-pz{left:${pc(p.x / 768)};top:${pc(p.y / H)};width:${pc(p.w / 768)};height:${pc(p.h / H)};font-size:${p.fs}cqw;background:${p.bg};border-radius:4px;${clara ? 'color:#2b2118;text-shadow:none;' : ''}${p.list ? `justify-content:flex-start;padding:0 0 0 ${p.padL || 0}cqw;` : ''}${p.padB ? `padding-bottom:${p.padB}cqw;` : ''}}
${clara ? `.esc-${k} .pz-t{color:#8a4b12}.esc-${k} .pz-q b{color:#1f5fa8}.esc-${k} .pz-a{color:#1c7a3e}\n` : ''}${p.noT ? `.esc-${k} .pz-t{display:none}\n` : ''}.esc-${k} .esc-av{${pos};bottom:${pc((H - a.by) / H)};height:${pc(a.h / H)}}
.esc-${k} .esc-bub{${izq ? 'left' : 'right'}:2%;bottom:${c.bub.b}%;max-width:${c.bub.w}%}
.esc-${k} .esc-bub::after{${izq ? 'right:-8px;bottom:14px;border-top:2px solid #3b2a1a;border-right:2px solid #3b2a1a' : 'left:-8px;bottom:14px;border-left:2px solid #3b2a1a;border-bottom:2px solid #3b2a1a'}}
.esc-${k} .esc-bar{background:linear-gradient(${c.bar[0]},${c.bar[1]})}.esc-${k} .esc-ask{background:${c.bar[1]}}`;
    }).join('');
  }

  function css(){
    if(document.getElementById('esc-css')) return;
    const s = document.createElement('style'); s.id = 'esc-css';
    s.textContent = `
.esc{width:min(100%,430px);margin:0 auto 18px;container-type:inline-size;border-radius:20px;overflow:hidden;border:3px solid #6b3a1a;background:#6b3a1a;box-shadow:0 10px 26px rgba(0,0,0,.28)}
.esc[hidden],.esc-mini[hidden]{display:none}
.esc-vista{position:relative;overflow:hidden;background-repeat:no-repeat;background-size:100% auto;background-position:top center;background-color:#c9a77a}
.esc-aula .esc-vista{background-image:url(img/aula.webp);aspect-ratio:752/830;--h0:calc(100cqw*830/752)}
.esc-kiosco .esc-vista{background-image:url(img/kiosco.webp);aspect-ratio:768/810;--h0:calc(100cqw*810/768)}
.esc-biblioteca .esc-vista,.esc-biblioteca .esc-fr{background-image:url(img/biblioteca.webp);aspect-ratio:768/925;--h0:calc(100cqw*925/768)}
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
.av-festejo,.av-risa,.av-bien,.av-ok{animation:esc-salto .8s ease}.av-error,.av-sorpresa{animation:esc-sacudir .5s ease}
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
.esc .esc-in,.esc .esc-in:focus{flex:1 1 180px;min-width:0;width:auto;padding:9px 10px;border-radius:10px;border:2px solid #4a2410;font:600 .9rem var(--fb);background:#fffdf5;color:#3b2a1a;caret-color:#3b2a1a;box-shadow:none}
.esc-mini{display:block;margin:0 auto 14px;padding:8px 16px;border-radius:99px;border:2px solid var(--bd);background:var(--sf);color:var(--tx);font:700 .85rem var(--fb);cursor:pointer}

.esc-ask{display:flex;gap:8px;padding:0 10px 10px;background:#8c4c22}
.esc-aula .esc-ask{background:#954218}.esc-biblioteca .esc-ask{background:#703717}
.esc-ask[hidden]{display:none}
/* colores fijos (también con el tema oscuro y al hacer foco): la regla general de la app para input:focus les ponía fondo oscuro */
.esc .esc-q,.esc .esc-q:focus{flex:1;min-width:0;width:auto;padding:11px 12px;border-radius:12px;border:2px solid #4a2410;font:600 .95rem var(--fb);background:#fffdf5;color:#3b2a1a;caret-color:#3b2a1a;box-shadow:none}
.esc .esc-q:focus,.esc .esc-in:focus{outline:3px solid #ffd27a;outline-offset:1px}
.esc .esc-q::placeholder,.esc .esc-in::placeholder{color:#8a7560;opacity:1}
.esc .esc-q:disabled{opacity:.85;color:#6b5844}
.esc-send{min-width:48px;border-radius:12px;border:2px solid #4a2410;background:#c7f2a7;color:#4a2410;font-size:1.1rem;cursor:pointer;box-shadow:0 2px 0 #4a2410}
.esc-send:disabled{opacity:.55;cursor:default}
.esc-board{position:absolute;z-index:3;left:6%;right:6%;top:15.5%;bottom:3.5%;background:url(img/pizarron.webp) center/100% 100% no-repeat;color:#f6f2e4;font-family:var(--fd);display:flex;flex-direction:column;padding:7cqw 8.5cqw 10.5cqw;text-shadow:0 0 1px rgba(255,255,255,.35);animation:esc-baja .75s cubic-bezier(.2,.8,.25,1) both;transform-origin:50% 0}
.esc-board[hidden]{display:none}
@keyframes esc-baja{from{transform:translateY(-105%);opacity:.15}to{transform:none;opacity:1}}
@keyframes esc-crece{from{height:var(--h0)}}
/* con el pizarrón abierto la escena se estira, se esconden los widgets y la Profe pasa a la esquina (con los brazos cruzados) */
.esc.esc-chatting .esc-vista{aspect-ratio:auto;height:clamp(130cqw,calc(100vh - 130px),179cqw);height:clamp(130cqw,calc(100svh - 130px),179cqw);animation:esc-crece .65s ease-out}
.esc.esc-chatting .esc-pz,.esc.esc-chatting .esc-fr,.esc.esc-chatting .esc-bub,.esc.esc-chatting .esc-bar,.esc.esc-chatting .esc-hide{display:none!important}
.esc.esc-chatting .esc-av{left:auto;right:-6cqw;bottom:-7cqw;height:38cqw;z-index:6}
.esc-reabrir{position:absolute;top:6px;left:6px;z-index:4;border:0;border-radius:99px;padding:7px 13px;background:rgba(0,0,0,.52);color:#fff;font:700 .8rem var(--fb);cursor:pointer}
.esc-reabrir[hidden]{display:none}
.esc-chat-h{flex:none;display:flex;flex-wrap:nowrap;justify-content:space-between;align-items:center;gap:2cqw;color:#ffe28a;font:700 3.5cqw var(--fd);padding-bottom:1.4cqw;border-bottom:1.5px dashed rgba(255,255,255,.35);white-space:nowrap}.esc-chat-h span{display:flex;gap:.5cqw;flex:none}
.esc-lnk{border:0;background:none;color:#cdeede;cursor:pointer;font:700 3cqw var(--fd);padding:1cqw 1.3cqw;border-radius:8px;text-shadow:inherit;white-space:nowrap}
.esc-lnk:hover{background:rgba(255,255,255,.12)}
.esc-msgs{flex:1;min-height:0;overflow-y:auto;padding:2cqw 1cqw 24cqw 0;display:flex;flex-direction:column;gap:3.2cqw;font-size:3.9cqw;line-height:1.42;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.4) transparent}
.esc-msgs[hidden]{display:none}
.esc-m{display:block}
.esc-mt{padding:0;max-width:100%;overflow-wrap:anywhere;white-space:pre-wrap}
.esc-mt::before{display:block;font-size:.78em;letter-spacing:.05em;margin-bottom:.15em;color:#ffe28a}
.esc-m.ia .esc-mt::before{content:'PROFE'}
.esc-m.me .esc-mt{color:#a9e8ff;text-align:right}.esc-m.me .esc-mt::before{content:'VOS';color:#a9e8ff}
.esc-board .esc-mav{display:none}
.esc-board .btn.soft{font-size:.78rem}
.esc-note{font-size:.8rem;color:rgba(246,242,228,.78);margin-top:6px;white-space:normal}
.esc-fig{background:#fff;border-radius:10px;padding:6px;margin:8px 0;border:1px solid var(--bd);white-space:normal;color:#222;text-shadow:none}
.esc-fig svg{display:block;width:100%;height:auto}
.esc-ask{flex-wrap:wrap}
.esc-att{min-width:48px;border-radius:12px;border:2px solid #4a2410;background:#fff4de;color:#4a2410;font-size:1.15rem;cursor:pointer;box-shadow:0 2px 0 #4a2410}
.esc-att:disabled{opacity:.55;cursor:default}
.esc-th{flex:1 1 100%;display:flex;gap:10px;flex-wrap:wrap;padding-top:2px}
.esc-th[hidden]{display:none}
.esc-t1{position:relative;width:58px;height:58px;border-radius:10px;border:2px solid #4a2410;background:#fffdf5}
.esc-t1 img{display:block;width:100%;height:100%;object-fit:cover;border-radius:8px}
.esc-t1 button{position:absolute;top:-9px;right:-9px;width:24px;height:24px;padding:0;border-radius:50%;border:2px solid #4a2410;background:#fff4de;color:#4a2410;font-size:11px;line-height:1;cursor:pointer}
.esc-ths{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}
.esc-ths{justify-content:flex-end}.esc-ths img{width:88px;height:88px;object-fit:cover;border-radius:8px;border:2px solid #f6f2e4}
.esc-warn{flex-basis:100%;font:600 .78rem/1.3 var(--fb);color:#fff4de;text-align:center}
.esc-info{font:700 .88rem var(--fb);color:#fff4de}
@media print{.esc,.esc-mini,.esc-chat{display:none!important}}` + cssEscenas();
    document.head.appendChild(s);
  }

  function build(){
    css();
    const root = document.createElement('section'); root.id = 'escena'; root.className = 'esc'; root.setAttribute('aria-label', 'La Profe Luján');
    root.innerHTML = `<div class="esc-vista"><div class="esc-pz"></div><img class="esc-av" src="${IMG.normal}" alt="La Profe Luján" width="320" height="445" draggable="false"><div class="esc-fr"></div>
      <div class="esc-bub" hidden><span class="esc-bt"></span><button type="button" class="esc-bx" aria-label="Cerrar el mensaje">✕</button></div>
      <button type="button" class="esc-hide" aria-label="Ocultar la escena" title="Ocultar">▾</button><button type="button" class="esc-reabrir" hidden>💬 Charla</button></div><div class="esc-bar"></div>
      <div class="esc-ask" hidden><div class="esc-th" hidden></div><button type="button" class="esc-att" aria-label="Adjuntar una foto" title="Adjuntar una foto de tu carpeta o ejercicio">📷</button><input class="esc-q" type="text" maxlength="700" placeholder="Preguntale a la Profe…" aria-label="Preguntale a la Profe" autocomplete="off"><button type="button" class="esc-send" aria-label="Enviar la pregunta">➤</button><input class="esc-file" type="file" accept="image/*" multiple hidden></div>`;
    const chat = document.createElement('section'); chat.id = 'escena-chat'; chat.className = 'esc-board'; chat.hidden = true; chat.setAttribute('aria-label', 'Pizarrón: charla con la Profe');
    chat.innerHTML = `<div class="esc-chat-h"><b>✏️ Charla con la Profe</b><span><button type="button" class="esc-lnk" data-c="nueva">🧹 Nueva</button><button type="button" class="esc-lnk" data-c="min" aria-label="Cerrar el pizarrón" title="Cerrar el pizarrón">✕ Cerrar</button></span></div><div class="esc-msgs" aria-live="polite"></div>`;
    root.querySelector('.esc-q').onkeydown = ev => { if(ev.key === 'Enter' && !ev.isComposing){ ev.preventDefault(); enviar(); } };
    root.querySelector('.esc-send').onclick = () => enviar();
    root.querySelector('.esc-att').onclick = () => { if(!st.busy) root.querySelector('.esc-file').click(); };
    root.querySelector('.esc-file').onchange = async ev => { const fl = [...ev.target.files]; ev.target.value = ''; await addFotos(fl); };
    root.querySelector('.esc-th').onclick = ev => { const b = ev.target.closest('[data-x]'); if(b && !st.busy){ st.imgs.splice(+b.dataset.x, 1); pintaFotos(); } };
    chat.onclick = ev => {
      const b = ev.target.closest('[data-c]'); if(!b) return;
      if(b.dataset.c === 'nueva'){ if(st.busy) return; if(window.ProfeIA) ProfeIA.reiniciar(); chat.querySelector('.esc-msgs').innerHTML = ''; cerrarPizarron(); }
      else cerrarPizarron();
    };
    root.querySelector('.esc-vista').appendChild(chat); st.chat = chat;
    root.querySelector('.esc-reabrir').onclick = () => abrirPizarron();
    const mini = document.createElement('button'); mini.type = 'button'; mini.id = 'escena-show'; mini.className = 'esc-mini'; mini.textContent = '🏫 Mostrar a la Profe'; mini.hidden = true;
    root.querySelector('.esc-hide').onclick = () => { lsSet('aula_escena', 'off'); aplicarVisible(); };
    mini.onclick = () => { lsSet('aula_escena', 'on'); aplicarVisible(); };
    root.querySelector('.esc-bx').onclick = () => { const i = info(); ssSet('aula_av_x', String(hash(i.aviso))); hideBubble(); };
    root.querySelector('.esc-bar').onclick = ev => { const b = ev.target.closest('[data-a]'); if(b && ACC[b.dataset.a]) ACC[b.dataset.a](b); };
    root.querySelector('.esc-bar').onkeydown = ev => { if(ev.key === 'Enter' && ev.target.classList.contains('esc-in')) ACC.gm(); };
    st.root = root; st.mini = mini;
    setTimeout(() => { Object.keys(IMG).forEach(k => { if(k !== 'normal'){ const im = new Image(); im.src = IMG[k]; } }); }, 1500);   // se precargan para que el cambio de cara sea instantáneo
  }
  const aplicarVisible = () => { const off = lsGet('aula_escena') === 'off'; st.root.hidden = off; st.mini.hidden = !off; sincChat(); };
  const q = s => st.root.querySelector(s);
  const qc = s => st.chat.querySelector(s);
  const hayCharla = () => qc('.esc-msgs').children.length > 0;
  const sincChat = () => { st.root.classList.toggle('esc-chatting', !!st.abierto); st.chat.hidden = !st.abierto; const r = q('.esc-reabrir'); if(r) r.hidden = !!st.abierto || !hayCharla(); };
  function abrirPizarron(){                                          // al empezar a hablar: se estira la escena, baja el pizarrón y la Profe pasa a la esquina
    if(st.abierto) return; st.abierto = true; hideBubble(); clearTimeout(st.timer); sincChat(); caminaA();
    setTimeout(() => { try{ st.root.scrollIntoView({block:'start', behavior:'smooth'}); }catch(e){} }, 80);
  }
  function cerrarPizarron(){                                         // vuelve la escena de siempre (la charla queda guardada: botón “💬 Charla”)
    if(!st.abierto) return; st.abierto = false; sincChat(); caminaA(); base();
  }
  function caminaA(){                                                // la Profe cambia de lugar caminando desde el costado
    const im = q('.esc-av'); if(!im) return; setAv(st.abierto ? 'pensando' : 'normal');
    im.classList.remove('av-entra-d', 'av-entra-i'); void im.offsetWidth; im.classList.add('av-entra-d');
  }

  /* ---------- avatar y globo de diálogo ---------- */
  function setAv(estado){
    const im = q('.esc-av'); if(!im) return;
    [...im.classList].forEach(c => { if(c.startsWith('av-')) im.classList.remove(c); }); void im.offsetWidth;
    estado = IMG[estado] ? estado : 'normal';
    im.src = IMG[estado]; if(estado !== 'normal') im.classList.add('av-' + estado);
  }
  function showBubble(texto, ms, pers){
    const b = q('.esc-bub'); q('.esc-bt').textContent = texto; b.classList.toggle('pers', !!pers); b.hidden = false;
    clearTimeout(st.bt); if(ms) st.bt = setTimeout(base, ms);
  }
  const hideBubble = () => { clearTimeout(st.bt); q('.esc-bub').hidden = true; };
  function base(){                                                  // lo que queda en pantalla cuando no hay una reacción: el mensaje de la Profe al curso
    const i = info();
    if(tipo() !== 'sug' && i.aviso && ssGet('aula_av_x') !== String(hash(i.aviso))) showBubble(i.aviso, 0, true); else hideBubble();
  }
  function reaccionar(estado, texto, ms){
    if(!st.root) return; ms = ms || 3200; estado = azar(estado);
    setAv(estado); if(texto) showBubble(texto, ms, false);
    clearTimeout(st.timer); st.timer = setTimeout(() => { setAv(st.abierto ? 'pensando' : 'normal'); base(); }, ms);
  }

  /* ---------- widgets ---------- */
  const ACC = {
    ver(){ st.ej.shown = true; pizAula(); barAula(); },
    si(){ st.ej.done = true; const n = sumarRacha(); pizAula(); barAula(); reaccionar(['festejo', 'risa', 'bien'], n > 1 ? '¡Muy bien! ' + n + ' días seguidos 🔥' : '¡Muy bien! Eso es practicar 💪'); },
    no(){ st.ej.done = true; pizAula(); barAula(); reaccionar('error', 'No pasa nada: mirá cómo se hace y probá con otro 💪', 4200); },
    otro(){ st.ej = {dia:st.ej.dia, ...ejercicio(null, (ESC[modo()] && ESC[modo()].pz.max) || 95), shown:false, done:false, extra:true}; pizAula(); barAula(); },
    msg(){ const i = info(); q('.esc-bar').innerHTML = `<input class="esc-in" maxlength="160" placeholder="Mensaje de la Profe para tu curso" aria-label="Mensaje para el curso" value="${E(i.aviso)}"><button type="button" class="esc-b ok" data-a="gm">Guardar</button><button type="button" class="esc-b" data-a="cm">Cancelar</button>`; q('.esc-in').focus(); },
    cm(){ barActual(); },
    todo(){ const m = document.getElementById('main'), t = [...m.children].find(x => x !== st.root && x !== st.chat && x !== st.mini); if(t) t.scrollIntoView({behavior:'smooth', block:'start'}); },
    async gm(){
      const i = info(), inp = q('.esc-in'); if(!inp || !i.cid) return; const txt = inp.value.trim().slice(0, 160);
      try{
        await fs.collection('courses').doc(i.cid).update({pizarra:txt});
        const c = courses.find(x => x.id === i.cid); if(c) c.pizarra = txt;
        ssSet('aula_av_x', ''); barActual(); base(); reaccionar('ok', txt ? '¡Mensaje publicado!' : 'Mensaje borrado', 1800);
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
      const r = await ProfeIA.activarAlumnos(true); barActual();
      reaccionar(r.ok ? ['risa', 'ok'] : 'error', r.ok ? '¡Listo! Tus alumnos ya pueden preguntarme 💛' : r.error, 3800);
    },
    async iaoff(){ const r = await ProfeIA.activarAlumnos(false); barActual(); reaccionar(r.ok ? 'ok' : 'error', r.ok ? 'Listo: los alumnos ya no pueden usar la IA.' : r.error, 3000); },
    abrir(){ const s = st.sug; if(!s || typeof lbViewer !== 'function') return; reaccionar(['bien', 'ok'], '¡Buena elección! 📖', 1800); lbViewer(s.id, s.p); },
    otra(){ st.sug = sugerir(true); pizKiosco(); }
  };
  function fitPz(){                                                  // si el texto no entra en el pizarrón, achica la letra hasta que entre
    const el = q('.esc-pz'), c = ESC[modo()]; if(!el) return;
    if(!c){ el.style.fontSize = ''; return; }
    let fs = c.pz.fs; el.style.fontSize = fs + 'cqw';
    if(!el.clientHeight) return;
    let n = 0; while(el.scrollHeight > el.clientHeight + 1 && fs > 2 && n++ < 40){ fs -= 0.12; el.style.fontSize = fs.toFixed(2) + 'cqw'; }
  }
  const mats = () => { try{ return ((typeof data !== 'undefined' && data.materials) || []).slice(0, (ESC.materiales.pz.rows) || 5); }catch(e){ return []; } };
  const icoMat = m => { try{ const f = (m.localFiles || [])[0]; if(f && typeof fileIco === 'function') return fileIco(f); }catch(e){} return '📄'; };
  function pizMat(){                                                 // la pantalla de la “Zona de descargas” muestra el material real del curso
    const l = mats();
    q('.esc-pz').innerHTML = l.length ? `<div class="mt-t">📥 LO ÚLTIMO DEL CURSO</div>` + l.map(m => `<div class="mt-r"><span>${icoMat(m)}</span><span>${E(m.title || 'Sin título')}</span></div>`).join('')
      : `<div class="pz-q" style="margin:auto">Todavía no hay material en este curso</div>`;
    fitPz();
  }
  const extras = i => (i.prof && i.cid ? `<button type="button" class="esc-b" data-a="msg">💬 Mensaje de la Profe</button>` : '') + (i.prof && window.ProfeIA ? `<button type="button" class="esc-b" data-a="iaal">🤖 IA para alumnos</button>` : '');
  function barMat(){
    q('.esc-bar').innerHTML = `<button type="button" class="esc-b ok" data-a="todo">⬇ Ver todo el material</button>` + extras(info());
  }
  const barActual = () => tipo() === 'mat' ? barMat() : barAula();
  function pizAula(){
    const e = st.ej;
    q('.esc-pz').innerHTML = `<div class="pz-t">${e.extra ? '➕ Otro ejercicio' : '✏️ Ejercicio del día'}</div><div class="pz-q">${e.q}</div>${e.shown ? `<div class="pz-a">→ ${e.a}</div>` : ''}`;
    fitPz();
  }
  function barAula(){
    const e = st.ej, i = info();
    let h = !e.shown ? `<button type="button" class="esc-b" data-a="ver">👀 Ver respuesta</button>`
      : !e.done ? `<button type="button" class="esc-b ok" data-a="si">🎉 Me salió</button><button type="button" class="esc-b" data-a="no">🤔 No me salió</button>`
      : `<button type="button" class="esc-b" data-a="otro">➕ Otro ejercicio</button>`;
    h += extras(i);
    q('.esc-bar').innerHTML = h + `<span class="esc-chip" title="Días seguidos practicando">🔥 ${racha()}</span>`;
  }
  function pizKiosco(){
    const s = st.sug, t = document.body.dataset.tab;
    q('.esc-pz').innerHTML = s
      ? `<div class="pz-t">📚 Para hoy</div><div class="pz-q">${E(s.title)}</div><div class="pz-a">pág. ${s.n}</div>`
      : `<div class="pz-t">📚 Biblioteca</div><div class="pz-q">${E(TIPS[t] || TIPS.lib)}</div>`;
    q('.esc-bar').innerHTML = `<button type="button" class="esc-b ok" data-a="abrir" ${s ? '' : 'disabled'}>📖 Abrir esa página</button><button type="button" class="esc-b" data-a="otra" ${s ? '' : 'disabled'}>🎲 Otra</button>`;
  }
  const TODAS = ['aula', 'kiosco', 'biblioteca', ...Object.keys(ESC)];
  function entra(m){                                                 // al cambiar de escena, la Profe entra caminando desde el costado más cercano
    const im = q('.esc-av'), c = ESC[m]; if(!im) return;
    const lado = c ? (c.av.cx > 384 ? 'd' : 'i') : (m === 'aula' ? 'd' : 'i');      // la que está a la derecha entra por la derecha, y así
    im.classList.remove('av-entra-d', 'av-entra-i'); void im.offsetWidth; im.classList.add('av-entra-' + lado);
  }
  function paint(){
    const m = modo(), i = info(), t = tipo();
    TODAS.forEach(c => st.root.classList.toggle('esc-' + c, c === m));
    if(st.escena !== m){ if(st.escena) entra(m); st.escena = m; }
    clearInterval(st.poll);
    if(t === 'ej'){ ejHoy(i); pizAula(); barAula(); }
    else if(t === 'mat'){ pizMat(); barMat(); }
    else {
      st.sug = st.sug || sugerir(false); pizKiosco();
      if(!st.sug){ let n = 0; st.poll = setInterval(() => { if(++n > 40 || tipo() !== 'sug'){ clearInterval(st.poll); return; } const s = sugerir(false); if(s){ clearInterval(st.poll); st.sug = s; pizKiosco(); } }, 1500); }
    }
    base(); askUI();
  }

  /* ---------- charla con la Profe (IA) ---------- */
  function mdHtml(t){                                              // negrita y listas simples; las fórmulas ($...$) quedan intactas para KaTeX
    return t.split(/(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/).map((seg, i) => i % 2 ? E(seg)
      : E(seg).replace(/\*\*(?=\S)([^*\n]*?\S)\*\*/g, '<b>$1</b>').replace(/(^|[\s(])\*(?=\S)([^*\n]*?\S)\*(?=[\s).,;:!?]|$)/g, '$1<i>$2</i>').replace(/^[ \t]*[-*] /gm, '• ')).join('');
  }
  const SIN_SVG = /```(?:svg|xml|html)?\s*<svg[\s\S]*?<\/svg>\s*```|<svg[\s\S]*?<\/svg>/gi;
  function tramo(txt, figs){                                         // texto con negrita/fórmulas y, donde está [[FIG:n]], el gráfico que dibujó la herramienta graficar
    let h = '';
    String(txt || '').replace(SIN_SVG, '').split(/\[\[FIG:(\d+)\]\]/).forEach((seg, i) => {
      if(i % 2){ const c = figs[+seg] && typeof tutorCleanSvg === 'function' ? tutorCleanSvg(figs[+seg]) : ''; if(c) h += `<div class="esc-fig">${c}</div>`; }
      else if(seg.trim()) h += mdHtml(seg.trim());
    });
    return h;
  }
  function renderIA(el, r){
    const figs = r.figs || [], sv = typeof tutorSplit === 'function' ? tutorSplit(String(r.text || '')) : {antes:String(r.text || ''), svg:'', despues:''};
    let h = tramo(sv.antes, figs);
    if(sv.svg){ const c = typeof tutorCleanSvg === 'function' ? tutorCleanSvg(sv.svg) : ''; if(c) h += `<div class="esc-fig">${c}</div>`; }   // figura geométrica que dibujó la Profe
    h += tramo(sv.despues, figs);
    if(r.calcs && r.calcs.length) h += `<details class="esc-note"><summary>🧮 ${r.calcs.length} cálculo(s) con la calculadora</summary>${r.calcs.map(c => E(c.e) + ' = <b>' + E(c.r) + '</b>').join('<br>')}</details>`;
    const refs = r.refs && r.refs.length && typeof tutorRefsHtml === 'function';
    if(refs || (r.fuentes && r.fuentes.length)) h += `<div class="esc-note">📚 <b>De dónde lo saqué</b>${refs ? ' (tocá una para abrirla; ➕ la agrega a tu guía):' : ':'} ${refs ? tutorRefsHtml(r.refs) : E(r.fuentes.join(' · '))}${r.vistas && r.vistas.length ? '<br>👁 <b>Vistas como imagen:</b> ' + E(r.vistas.join(' · ')) : ''}</div>`;
    el.innerHTML = h;
    if(typeof tutorBindRefs === 'function') tutorBindRefs(el);
    if(window.renderMathInElement) try { renderMathInElement(el, {delimiters:[{left:'$$', right:'$$', display:true}, {left:'$', right:'$', display:false}], throwOnError:false}); } catch(e){}
  }
  function pintaFotos(){
    const th = q('.esc-th'); th.hidden = !st.imgs.length;
    th.innerHTML = st.imgs.map((im, i) => `<span class="esc-t1"><img src="${im.url}" alt="Foto ${i + 1}"><button type="button" data-x="${i}" aria-label="Quitar la foto ${i + 1}">✕</button></span>`).join('');
  }
  async function addFotos(files){
    const list = files.filter(f => /^image\//.test(f.type)); if(!list.length || !window.ProfeIA) return;
    for(const f of list){
      if(st.imgs.length >= MAXI){ alert('Podés adjuntar hasta ' + MAXI + ' fotos por consulta.'); break; }
      try{ const [p] = await ProfeIA.prepararImagenes([f]); if(!p) throw new Error('No se pudo leer la foto.'); st.imgs.push(p); }
      catch(e){ alert(e.message || 'No se pudo leer la foto.'); }
    }
    pintaFotos();
  }
  const vista = x => {                                               // lo que se ve mientras la respuesta se va escribiendo (sin mostrar el código de las figuras)
    x = String(x || '').replace(/\[\[FIG:\d+\]\]/g, '📈');
    if(typeof tutorSplit !== 'function') return x;
    const sp = tutorSplit(x); if(sp.svg) return (sp.antes + '\n📐\n' + sp.despues).trim(); if(sp.dibujando) return (sp.antes + '\n📐 Dibujando la figura…').trim(); return x;
  };
  function addMsg(rol){
    const d = document.createElement('div'); d.className = 'esc-m ' + rol;
    d.innerHTML = (rol === 'ia' ? `<img class="esc-mav" src="${IMG.normal}" alt="" width="34" height="34">` : '') + '<div class="esc-mt"></div>';
    qc('.esc-msgs').appendChild(d); qc('.esc-msgs').hidden = false; sincChat();
    return d.querySelector('.esc-mt');
  }
  const bajar = () => { const m = qc('.esc-msgs'); m.scrollTop = m.scrollHeight; };
  async function enviar(){
    if(st.busy || !window.ProfeIA) return;
    const inp = q('.esc-q'), t = inp.value.trim(), imgs = st.imgs.slice(); if(!t && !imgs.length) return;
    abrirPizarron();
    inp.value = ''; st.imgs = []; pintaFotos(); st.busy = true; q('.esc-send').disabled = true; q('.esc-att').disabled = true;
    const me = addMsg('me'); me.textContent = t;
    if(imgs.length){ const w = document.createElement('div'); w.className = 'esc-ths'; imgs.forEach(im => { const i = document.createElement('img'); i.src = im.url; i.alt = 'Foto adjunta'; w.appendChild(i); }); me.appendChild(w); }
    const el = addMsg('ia'); el.textContent = imgs.length ? '⏳ Mirando tu foto…' : '⏳ Pensando…'; bajar();
    clearTimeout(st.timer); clearTimeout(st.t2);
    showBubble(imgs.length ? 'A ver esa foto… 👀' : 'Dejame pensarlo con vos… ✏️', 0, false);
    setAv(imgs.length ? 'sorpresa' : 'pensando');
    if(imgs.length) st.t2 = setTimeout(() => { if(st.busy) setAv('pensando'); }, 1600);
    let r, ya = false;
    try{
      r = await ProfeIA.preguntar(t, {
        imgs,
        onText: x => { ya = true; el.textContent = vista(x); bajar(); },
        onEstado: x => { if(!ya) el.textContent = x; }
      });
    }catch(e){ console.warn(e); r = {error:String(e.message || e)}; }
    clearTimeout(st.t2); st.busy = false; q('.esc-send').disabled = false; q('.esc-att').disabled = false;
    if(r.error){
      const msg = r.error === 'sin-clave' ? 'Todavía no está habilitada la ayuda con IA.' : 'No pude responder ahora: ' + r.error;
      el.textContent = '⚠️ ' + msg; reaccionar('error', 'Uy, no pude responder. Probá de nuevo en un momento 💛', 3500);
    } else {
      renderIA(el, r); reaccionar(r.limite ? 'sorpresa' : ['bien', 'ok'], '', 2400);
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
    const d = st.ia, inp = q('.esc-q'), btn = q('.esc-send'), att = q('.esc-att');
    if(d.ok){ ask.hidden = false; inp.disabled = false; btn.disabled = st.busy; att.disabled = st.busy; inp.placeholder = modo() === 'biblioteca' ? 'Preguntale a la Profe por tus libros…' : 'Preguntale a la Profe…'; }
    else if(d.nota){ ask.hidden = false; inp.disabled = true; btn.disabled = true; att.disabled = true; inp.placeholder = d.nota; }
    else ask.hidden = true;
  }

  /* ---------- se mantiene arriba de #main aunque cada pestaña se redibuje ---------- */
  function sync(){
    const main = document.getElementById('main'); if(!main || !st.root) return;
    if(main.firstElementChild !== st.root) main.prepend(st.root, st.mini);
    const i = info(), t = document.body.dataset.tab || '', key = [modo(), i.cid, i.aviso, i.prof, modo() === 'materiales' ? mats().map(m => m.id + (m.title || '')).join(',') : ''].join('|');
    aplicarVisible();
    if(key !== st.key){ st.key = key; paint(); }
    if(t !== st.tab){ st.tab = t; const k = 'aula_hi_' + t; if(SALUDO[t] && !ssGet(k) && !(tipo() !== 'sug' && i.aviso)){ ssSet(k, '1'); showBubble(SALUDO[t], 4500, false); } }
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
