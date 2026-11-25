/* La Profe Luján con IA: conversa de manera cálida y razonando en voz alta.
   Reusa el motor del Tutor (Gemini, calculadora, graficador, figuras SVG, libros y lectura de páginas) pero con su propia charla y personalidad.
   - Docentes (profesora y colegas habilitados): respuestas completas, con los libros de la biblioteca.
   - Alumnos: acompañamiento con pistas y explicaciones; sin acceso a los libros. Solo funciona si la profesora lo activa. */
(function(){
  'use strict';
  const GUIA_ALUMNO = true;            // true: con los alumnos primero guía con pistas y recién después muestra la resolución completa
  const MAX_ALUMNO_DIA = 30;           // preguntas por día y por dispositivo (alumnos)
  const MAX_CHARS = 700;               // largo máximo de cada pregunta
  const MAX_IMGS = 3;                  // máximo de imágenes por consulta
  const CACHE_MS = 10 * 60 * 1000;

  const PERSONA = `Sos la Profe Luján, una profesora de Matemática de secundaria muy querida: cálida, paciente, cariñosa y entusiasta. Hablás en español rioplatense (voseo: "fijate", "probá", "te explico").
CÓMO RESPONDÉS:
- Con calidez genuina: saludás breve, reconocés el esfuerzo ("¡qué buena pregunta!", "vas muy bien"), normalizás el error ("equivocarse es parte de aprender") y nunca retás ni hacés sentir mal a nadie. Podés usar uno o dos emojis suaves (😊 💪 ✏️ 🌟), sin exagerar.
- Razonando en voz alta: explicá el PORQUÉ de cada paso y no solo qué hacer; conectalo con lo que ya sabe; usá ejemplos cotidianos cuando ayuden.
- Respuestas ordenadas y no demasiado largas: pasos cortos y numerados. Las fórmulas van en LaTeX ($...$ en línea, $$...$$ en bloque). Podés resaltar con **negrita**; no uses títulos con #.
- Cerrá con una invitación cálida: una pregunta corta para ver si quedó claro u ofrecer seguir ("¿Lo probamos con otros números?").
LÍMITES: solo Matemática y ayuda para estudiarla (organizarse, repasar, preparar un examen). Si preguntan otra cosa, con cariño decí que acá ayudás con matemática y ofrecé volver a eso. No pidas ni guardes datos personales. Si alguien cuenta que está mal, triste o con un problema serio, respondé con ternura, sugerile hablar con una persona adulta de confianza o con su profesora, y después ofrecé seguir con la matemática si quiere.
IMÁGENES ADJUNTAS: si te mandan una foto (de una carpeta, un ejercicio o un gráfico):
1. Primero transcribí brevemente qué ves en la imagen para confirmar que se lee bien. Si la foto está borrosa, cortada o no se entiende un número, pedí con cariño que la saquen más cerca o con mejor luz en vez de adivinar.
2. Si es una resolución hecha por un alumno, valorá lo que hizo bien antes de marcar dónde se equivocó y explicá por qué.
3. Si la imagen no tiene nada que ver con matemática, aplicá los límites con amabilidad.
HERRAMIENTAS Y GRÁFICOS:
- Tenés una calculadora (calcular): usala para TODA cuenta numérica (potencias, raíces, fracciones, porcentajes, trigonometría, logaritmos) y para verificar resultados; no hagas cuentas de memoria.
- Para dibujar el gráfico de FUNCIONES en ejes cartesianos (rectas, parábolas, sistemas, exponenciales, etc.) usá SIEMPRE la herramienta graficar, eligiendo xmin/xmax para que se vean raíces, vértice e intersecciones. El gráfico se muestra solo: no escribas código ni lo describas punto por punto.
- Para FIGURAS GEOMÉTRICAS (triángulos, Pitágoras, cuadriláteros, cuerpos, ángulos), cuando ayude a entender o lo pidan, incluí un único bloque \`\`\`svg con un <svg> válido: viewBox="0 0 480 360", un <rect> blanco de fondo, trazo negro y grises claros aptos para imprimir, estilos como atributos (sin <style> ni clases), texto plano en <text> con font-size 15 o 16 (sin LaTeX; usá ², √, °, x). Rotulá los datos conocidos y la incógnita como x o "?", sin mostrar el resultado en la figura si es un enunciado a resolver.
MEMORIA: es una conversación continua: usá los mensajes anteriores para entender "y el ítem b", "explicámelo más fácil", "con otros números" o "ahora graficalo".`;

  const ALUMNO = GUIA_ALUMNO ? `
QUIÉN TE ESCRIBE: un alumno o alumna. Acompañás para que APRENDA, no para hacerle la tarea. Cuando pida resolver un ejercicio (escrito o en foto): (1) si subió su intento en la foto, revisalo con ternura marcando aciertos y el paso donde corregir; (2) si solo mandó el enunciado sin intentar nada, preguntale por dónde empezaría y dale una pista o el primer paso explicando el porqué; (3) si ya lo intentó, está trabado o pide ver cómo se hace, mostrale la resolución completa razonada paso a paso (podés usar un ejemplo parecido con otros números y dejarle el suyo). Nunca des solo el resultado final sin explicación.`
    : `
QUIÉN TE ESCRIBE: un alumno o alumna. Explicá con paciencia y mostrá la resolución completa razonada, paso a paso, con el porqué de cada paso.`;

  const DOCENTE = `
QUIÉN TE ESCRIBE: un docente. Dale respuestas completas, claras y precisas, y ayudalo con ejercicios, explicaciones e ideas para la clase.
LIBROS: priorizá los fragmentos de los libros de la biblioteca que se te entregan; cuando los uses, citá el nombre del libro y el número de página. Si la respuesta no está en los fragmentos, aclaralo ("No encontré este tema específico en los libros cargados, pero desde la teoría...") y explicá igual. Si llegan imágenes rotuladas como "Imagen de la página X del libro Y", son páginas reales: leé de ahí figuras, tablas y fórmulas (el texto extraído puede estar incompleto) y si algo no se ve bien, decilo en vez de inventarlo.`;

  const cache = {t: 0, alumno: ''};
  const H = {};                                         // historial por modo (también en sessionStorage)
  const modo = () => { try { return (canEdit() || (typeof isReader === 'function' && isReader())) ? 'docente' : 'alumno'; } catch (e) { return 'alumno'; } };
  const hoyKey = () => 'profe_n_' + new Date().toLocaleDateString('en-CA');
  function hist(m){
    if(!H[m]){ try { H[m] = JSON.parse(sessionStorage.getItem('profe_h_' + m) || '[]'); } catch(e){ H[m] = []; } }
    return H[m];
  }
  function guardar(m){
    try {
      // No guardamos el base64 pesado de las fotos en sessionStorage para no llenar la cuota del navegador
      const limpio = hist(m).slice(-16).map(x => ({ role: x.role, text: x.text, hasImg: !!x.hasImg }));
      sessionStorage.setItem('profe_h_' + m, JSON.stringify(limpio));
    } catch(e){}
  }
  function memoria(m){
    const h = hist(m), pares = [];
    for(let i = 0; i < h.length - 1; i++) if(h[i].role === 'user' && h[i + 1].role === 'ai'){ pares.push([h[i], h[i + 1]]); i++; }
    const ult = pares.slice(-4);
    let conImg = -1;
    ult.forEach((p, idx) => { if(p[0].imgs && p[0].imgs.length) conImg = idx; }); // reenvía solo la última foto adjunta en memoria
    return ult.flatMap(([u, a], idx) => {
      const parts = [];
      if(idx === conImg) u.imgs.forEach(im => parts.push({ inline_data: { mime_type: im.mime || 'image/jpeg', data: im.b64 } }));
      parts.push({ text: u.text || '(imagen adjunta)' });
      return [{ role: 'user', parts }, { role: 'model', parts: [{ text: tutorClip(a.text) }] }];
    });
  }

  /* ---------- claves ---------- */
  async function claveDocente(){
    await tutorLoadKey(); if(!TUTOR.key) await tutorLoadKey(true);
    return TUTOR.key || '';
  }
  async function claveAlumno(){
    if(Date.now() - cache.t < CACHE_MS) return cache.alumno;
    let k = '';
    try { const d = await fs.collection('config').doc('tutor_alumnos').get(), x = d.exists ? d.data() : {}; k = (x.activo && x.geminiKey) ? String(x.geminiKey) : ''; } catch(e){ k = ''; }
    cache.alumno = k; cache.t = Date.now(); return k;
  }
  async function disponible(){
    const m = modo();
    try {
      if(m === 'docente'){ const k = await claveDocente(); return {ok:!!k, modo:m, nota:k ? '' : (canEdit() ? 'Cargá tu clave en Tutor IA para que la Profe te responda.' : 'Tu profesora todavía no habilitó la ayuda con IA.')}; }
      return {ok:!!(await claveAlumno()), modo:m, nota:''};
    } catch(e){ return {ok:false, modo:m, nota:''}; }
  }
  async function estadoAlumnos(){
    try { const d = await fs.collection('config').doc('tutor_alumnos').get(); return !!(d.exists && d.data().activo && d.data().geminiKey); } catch(e){ return false; }
  }
  async function activarAlumnos(on){
    try {
      if(on){
        await tutorLoadKey(); if(!TUTOR.key) return {ok:false, error:'Primero cargá tu clave en la pestaña Tutor IA.'};
        await fs.collection('config').doc('tutor_alumnos').set({activo:true, geminiKey:TUTOR.key, updated:Date.now()});
      } else await fs.collection('config').doc('tutor_alumnos').set({activo:false, geminiKey:'', updated:Date.now()});
      cache.t = 0; return {ok:true};
    } catch(e){ console.warn(e); return {ok:false, error:'No se pudo guardar. ¿Publicaste las reglas nuevas de Firestore?'}; }
  }

  /* ---------- preparación de imágenes (reusa tutorImgPrep si está disponible) ---------- */
  async function prepararImagenes(files){
    const arr = Array.from(files || []).slice(0, MAX_IMGS);
    const out = [];
    for(const f of arr){
      if(f && typeof f === 'object' && f.b64 && f.mime){
        out.push({ mime: f.mime, b64: f.b64, url: f.url || ('data:' + f.mime + ';base64,' + f.b64) });
      } else if(f instanceof Blob && typeof tutorImgPrep === 'function'){
        out.push(await tutorImgPrep(f));
      }
    }
    return out;
  }

  /* ---------- modelos (misma lógica de reintentos que el Tutor) ---------- */
  async function correr(base, live, onText, onEstado){
    const modelos = (window.TUTOR_MODELS || TUTOR_MODELS_DEFAULT).slice(); let ultimo = '';
    for(const modelo of modelos){
      const cfg = {think:true, tools:true, temp:0.45};
      for(let k = 0; k < 4; k++){
        live.text = ''; live.figs = []; live.calcs = [];
        try {
          const txt = await tutorRun(modelo, base, live, cfg, t => { live.text = t; onText && onText(t); }, s => onEstado && onEstado(s));
          if(txt) return {text:txt};
          ultimo = 'Respuesta vacía'; break;
        } catch(e){
          ultimo = e.name === 'AbortError' ? 'La IA tardó demasiado en responder' : (e.message || 'Error');
          if(e.status === 400){
            if(cfg.think && /think/i.test(ultimo)){ cfg.think = false; continue; }
            if(cfg.tools){ cfg.tools = false; continue; }
          }
          if(live.text) return {text:live.text + '\n\n(La respuesta se cortó antes de terminar.)'};
          if(e.status === 401 || e.status === 403) return {error:'La clave de la IA no es válida o no tiene permiso.'};
          break;
        }
      }
    }
    return {error:ultimo || 'Error'};
  }

  /* ---------- una pregunta (admite texto y/o op.imgs) ---------- */
  async function preguntar(texto, op){
    op = op || {};
    const m = modo();
    texto = String(texto || '').trim().slice(0, MAX_CHARS);
    const imgs = await prepararImagenes(op.imgs);

    if(!texto && !imgs.length) return {error:'vacío'};

    if(m === 'alumno'){
      const k = hoyKey(), n = +(localStorage.getItem(k) || 0);
      if(n >= MAX_ALUMNO_DIA) return {limite:true, text:'Hoy charlamos un montón 😊 ¡Seguimos mañana! Mientras tanto, repasá lo que hicimos.'};
    }

    const key = m === 'docente' ? await claveDocente() : await claveAlumno();
    if(!key) return {error:'sin-clave'};

    const consultaTexto = texto || 'Analizá la imagen adjunta y ayudame con lo que aparece ahí.';
    let ctx = {texto:'', fuentes:[], libros:[], paginas:[]}; const pageParts = [], vistas = [];

    if(m === 'docente'){
      if(typeof LIB !== 'undefined' && !LIB.loaded && typeof libEnsure === 'function'){
        op.onEstado && op.onEstado('📚 Abriendo la biblioteca…');
        try { await libEnsure(); const t0 = Date.now(); while(LIB.loading && Date.now() - t0 < 15000) await new Promise(r => setTimeout(r, 200)); } catch(e){}
      }
      const prev = [...hist(m)].reverse().find(x => x.role === 'user'), corta = consultaTexto.split(/\s+/).filter(Boolean).length <= 5;
      try { ctx = tutorContext((corta && prev) ? consultaTexto + ' ' + prev.text : consultaTexto); } catch(e){}
      if((TUTOR.vision || ctx.forzarVision) && ctx.paginas && ctx.paginas.length){
        op.onEstado && op.onEstado('📖 Mirando las páginas de tus libros…');
        const vs = await tutorPageImgs(ctx.paginas, ctx.maxImgs || 3);
        vs.forEach(v => { pageParts.push({text:`[Imagen de la página ${v.n || v.p} del libro "${v.bt}"]`}, {inline_data:{mime_type:v.mime, data:v.b64}}); vistas.push(`${v.bt} (pág. ${v.n || v.p})`); });
        if(ctx.forzarVision && !vs.length) pageParts.push({text:'AVISO: no se pudo obtener ninguna imagen del documento (puede que no tenga el PDF original guardado en la nube). Decile que no pudiste leerlo y que lo suba como foto o lo transcriba.'});
      }
    }

    const avisoImg = imgs.length ? `AVISO: el usuario adjuntó ${imgs.length} imagen(es) suya(s).\n\n` : '';
    const lista = ctx.libros && ctx.libros.length ? `LIBROS DISPONIBLES EN LA BIBLIOTECA:\n- ${ctx.libros.join('\n- ')}\n\n` : ''; const prompt = m === 'docente' ? avisoImg + (ctx.aviso ? ctx.aviso + '\n\n' : '') + (ctx.texto ? `${lista}FRAGMENTOS ENCONTRADOS EN LA BIBLIOTECA:\n${ctx.texto}\n\nPREGUNTA:\n${consultaTexto}` : `${lista}AVISO: No se encontraron coincidencias directas en los PDF cargados.\n\nPREGUNTA:\n${consultaTexto}`)
      : avisoImg + consultaTexto;

    const userParts = [
      ...pageParts,
      ...imgs.map(im => ({ inline_data: { mime_type: im.mime, data: im.b64 } })),
      { text: prompt }
    ];

    const base = {
      system_instruction: {parts:[{text:PERSONA + (m === 'docente' ? DOCENTE : ALUMNO)}]}, maxOut:4096,
      contents: [...memoria(m), {role:'user', parts:userParts}]
    };
    const live = {text:'', figs:[], calcs:[]}, prevKey = TUTOR.key;
    TUTOR.key = key;
    let r; try { r = await correr(base, live, op.onText, op.onEstado); } finally { TUTOR.key = prevKey; }
    if(r.error) return r;

    // Descontar consulta diaria recién cuando respondió con éxito
    if(m === 'alumno'){
      try { const k = hoyKey(); localStorage.setItem(k, String(+(localStorage.getItem(k) || 0) + 1)); } catch(e){}
    }

    hist(m).push({role:'user', text:consultaTexto, imgs, hasImg:imgs.length > 0}, {role:'ai', text:r.text});
    guardar(m);
    return {
      text: r.text,
      figs: live.figs || [],     // gráficos cartesianos generados por la herramienta graficar
      calcs: live.calcs || [],
      fuentes: m === 'docente' ? ctx.fuentes : [],
      refs: m === 'docente' ? (ctx.refs || []) : [],
      vistas
    };
  }

  function reiniciar(){ const m = modo(); H[m] = []; try { sessionStorage.removeItem('profe_h_' + m); } catch(e){} }

  window.ProfeIA = {disponible, preguntar, prepararImagenes, reiniciar, estadoAlumnos, activarAlumnos, modo};
})();
