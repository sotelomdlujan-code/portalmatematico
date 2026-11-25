/* Tutor IA: responde únicamente sobre matemática y consulta los PDF cargados en la Biblioteca. */
const TUTOR = { history: (() => { try { return JSON.parse(sessionStorage.getItem('tutor_hist') || '[]'); } catch (e) { return []; } })(), key: localStorage.getItem('gemini_key') || '', busy: false, imgs: [], vision: localStorage.getItem('tutor_vision') === '1', docs: {} };

// 1. Busca las páginas más relevantes en los libros ya cargados (LIB.pages)
const TUTOR_BUDGET = 30000, TUTOR_PAGE = 3500;                  // cuánto texto de un documento nombrado se le manda a la IA (caracteres)
const tutorSinTexto = t => !t || t.replace(/\s/g, '').length < 3;

// ¿La pregunta nombra un documento de la biblioteca? (ej.: "resolvé el examen libre 2do borges noviembre 2025")
// Se compara con el TÍTULO del documento, no con su contenido: un examen puede no repetir su propio título en las páginas.
function tutorBookByName(pregunta, max = 3) {
  const qn = lbNrm(pregunta).replace(/[^a-z0-9]+/g, ' ').trim(), qt = new Set(qn.split(' ').filter(Boolean));
  const generic = new Set(['pdf', 'libro', 'archivo', 'documento', 'pag', 'pags', 'pagina', 'paginas']);
  const found = [];
  for (const b of LIB.books) {
    const tn = lbNrm(b.title || '').replace(/[^a-z0-9]+/g, ' ').trim(); if (!tn) continue;
    const tt = [...new Set(tn.split(' ').filter(w => (w.length > 2 || /\d/.test(w)) && !LB_STOP.has(w) && !generic.has(w)))];
    if (!tt.length) continue;
    const hit = tt.filter(w => qt.has(w)).length, exact = tn.length > 5 && (' ' + qn + ' ').includes(' ' + tn + ' ');
    if (exact || (hit >= 2 && (hit / tt.length >= 0.5 || hit >= 3))) found.push({ b, hit: exact ? 99 : hit, ratio: hit / tt.length });
  }
  if (!found.length) return [];
  found.sort((x, y) => y.hit - x.hit || y.ratio - x.ratio);
  return found.filter(f => f.hit === found[0].hit).slice(0, max).map(f => f.b);     // si empatan (p. ej. un libro cortado en partes) se devuelven varios
}

// “página 11”, “páginas 11 y 12”, “págs. 11 a 13” → [11] / [11, 12] / [11, 12, 13]
function tutorPageRequest(q) {
  const m = lbNrm(q).match(/\b(?:paginas?|pags?|hojas?)\b\.?\s*(?:numero|nro|n)?\.?\s*(\d{1,4})(?:\s*(-|a|al|y|e|,)\s*(?:la\s+|las\s+)?(?:pagina\s+)?(\d{1,4}))?/);
  if (!m) return [];
  const a = +m[1], b = m[3] ? +m[3] : 0;
  if (!b || a === b) return [a];
  if (m[2] === 'y' || m[2] === 'e' || m[2] === ',') return [a, b];
  return b > a && b - a < 6 ? Array.from({ length: b - a + 1 }, (_, i) => a + i) : [a];
}
// Los PDF grandes se cortan solos en partes llamadas “Libro (págs. 24-45)”: dentro de cada parte la página 1 es la primera de ESA parte.
function tutorRange(b) {
  const n = b.npages || (b.pages || []).length, m = lbNrm(b.title || '').match(/pags?\.?\s*(\d+)\s*[-–]\s*(\d+)/);
  return m ? { a: +m[1], b: +m[2], n } : { a: 1, b: n, n };
}

function tutorContext(pregunta) {
  if (!LIB.loaded || !LIB.books.length) return { texto: '', fuentes: [], libros: [] };
  // Lista de TODOS los documentos, también los escaneados (sin texto): antes los que no tenían texto ni aparecían.
  const libros = LIB.books.map(b => (b.title || '') + ((b.pages || []).every(tutorSinTexto) ? ' (PDF escaneado: sin texto extraído)' : '')).filter(Boolean);
  const palabras = (lbNrm(pregunta).match(/[a-z0-9]+/g) || [])
    .filter(w => w.length > 2 && !LB_STOP.has(w))
    .map(lbStem);

  // A0) Pide una página puntual de un libro por nombre (“qué hay en la página 11 de Matemática activados 4”): se busca la parte que la contiene.
  const pedidas = tutorPageRequest(pregunta).slice(0, 4);
  if (pedidas.length) {
    const cand = tutorBookByName(pregunta, 12);
    if (cand.length) {
      const partes = [], fuentes = [], paginas = [], faltan = [], sinTexto = [];
      for (const N of pedidas) {
        let got = 0;
        for (const b of cand) {
          const r = tutorRange(b), loc = N - r.a + 1;
          if (got >= 3 || N < r.a || N > r.b || loc < 1 || loc > r.n) continue;
          const t = (b.pages || [])[loc - 1] || '';
          got++; paginas.push({ b: b.id, bt: b.title, p: loc, n: N }); fuentes.push(`${b.title} (pág. ${N})`);
          if (tutorSinTexto(t)) sinTexto.push(N);
          partes.push(`--- DOCUMENTO: "${b.title}" (página ${N} del libro; es la página ${loc} de este archivo) ---\n${tutorSinTexto(t) ? '(sin texto extraído: leé la imagen adjunta)' : t.slice(0, 6000)}`);
        }
        if (!got) faltan.push(N);
      }
      const cubre = [...new Set(cand.map(b => { const r = tutorRange(b); return `${b.title}: págs. ${r.a}-${r.b}`; }))].slice(0, 8).join('; ');
      const aviso = `AVISO: el usuario pidió la página ${pedidas.join(', ')} del libro que nombró. Esos libros están cargados en partes (cada archivo cubre un tramo de páginas) y abajo va el texto de la página pedida, ya ubicada en la parte correcta. ` +
        `El número es el de página del PDF original, que puede no coincidir con el número impreso en la hoja: si ves otro número impreso, aclaralo. ` +
        `Si hay más de un documento con ese nombre (ediciones distintas), contá qué hay en cada uno por separado, indicando el título completo.` +
        (faltan.length ? ` NO hay cargada ninguna parte que contenga la página ${faltan.join(', ')}: decíselo al usuario (las partes cargadas cubren: ${cubre}).` : '');
      return { texto: partes.join('\n\n'), fuentes, libros, paginas: paginas.slice(0, 4), aviso, maxImgs: 4, forzarVision: sinTexto.length > 0 };
    }
  }

  // A) La pregunta nombra un documento: se le mandan sus páginas (todas si son pocas) en vez de buscar palabras sueltas en todos los libros.
  const named = tutorBookByName(pregunta);
  if (named.length) {
    const per = Math.floor(TUTOR_BUDGET / named.length), partes = [], fuentes = [], paginas = [], sinTexto = [];
    for (const b of named) {
      const all = (b.pages || []).map((t, i) => ({ p: i + 1, t: t || '' })), conTexto = all.filter(x => !tutorSinTexto(x.t));
      if (!conTexto.length) { sinTexto.push(b.title); for (let i = 1; i <= Math.min(4, b.npages || all.length || 1); i++) paginas.push({ b: b.id, bt: b.title, p: i }); continue; }
      let elegidas = conTexto;
      if (conTexto.reduce((a, x) => a + Math.min(x.t.length, TUTOR_PAGE), 0) > per) {                 // documento largo: las primeras páginas + las que más coinciden con la pregunta
        const tit = new Set(lbNrm(b.title).match(/[a-z0-9]+/g) || []);
        const ws = [...new Set(palabras.filter(w => !tit.has(w)))], Q = { strong: ws, weak: [], mode: 'any' }, pick = new Map();
        conTexto.slice(0, 2).forEach(x => pick.set(x.p, x));
        if (ws.length) LIB.pages.filter(pg => pg.b === b.id).map(pg => ({ pg, sc: lbScore(pg, Q) })).filter(h => h.sc > 0).sort((x, y) => y.sc - x.sc).slice(0, 8).forEach(h => pick.set(h.pg.p, { p: h.pg.p, t: h.pg.t }));
        let tot = 0; elegidas = [...pick.values()].sort((x, y) => x.p - y.p).filter(x => (tot += Math.min(x.t.length, TUTOR_PAGE)) <= per || tot - Math.min(x.t.length, TUTOR_PAGE) === 0);
      }
      elegidas.forEach(x => partes.push(`--- DOCUMENTO: "${b.title}" (Página ${x.p}) ---\n${x.t.slice(0, TUTOR_PAGE)}`));
      elegidas.slice(0, 4).forEach(x => paginas.push({ b: b.id, bt: b.title, p: x.p }));
      fuentes.push(`${b.title} (pág. ${elegidas[0].p}${elegidas.length > 1 ? '-' + elegidas[elegidas.length - 1].p : ''})`);
    }
    const aviso = `AVISO: el usuario se refiere al documento "${named.map(b => b.title).join('" / "')}", que SÍ está cargado en la biblioteca.` +
      (sinTexto.length ? ` De "${sinTexto.join('", "')}" no hay texto extraído (es un PDF escaneado o de imágenes): leelo de las imágenes de las páginas que acompañan la consulta.` : '');
    return { texto: partes.join('\n\n'), fuentes: fuentes.concat(sinTexto.map(t => t + ' (imágenes)')), libros, paginas: paginas.slice(0, 4), aviso, maxImgs: 4, forzarVision: sinTexto.length > 0 };
  }

  // B) Búsqueda normal por palabras en el contenido de los libros.
  if (!palabras.length) return { texto: '', fuentes: [], libros };
  const Q = { strong: [...new Set(palabras)], weak: [], mode: 'any' };
  const hits = [];
  for (const pg of LIB.pages) {
    const sc = lbScore(pg, Q);
    if (sc > 0) hits.push({ pg, sc });
  }
  hits.sort((a, b) => b.sc - a.sc);
  const top = hits.slice(0, 4);

  const texto = top.map(h =>
    `--- LIBRO: "${h.pg.bt}" (Página ${h.pg.p}) ---\n${h.pg.t.slice(0, 2200)}`
  ).join('\n\n');

  const fuentes = top.map(h => `${h.pg.bt} (pág. ${h.pg.p})`);
  const paginas = top.map(h => ({ b: h.pg.b, bt: h.pg.bt, p: h.pg.p }));
  return { texto, fuentes, libros, paginas };
}

// Memoria de la conversación: a Gemini se le mandan los últimos intercambios para que entienda "¿y el ítem b?", "con otros números", etc.
const TUTOR_MEM = 4;                                            // cantidad de intercambios (pregunta + respuesta) que recuerda
function tutorClip(t) {
  t = String(t || '').replace(/\[\[FIG:\d+\]\]/g, '[se mostró un gráfico]')
    .replace(/```(?:svg|xml|html)?\s*<svg[\s\S]*?<\/svg>\s*```|<svg[\s\S]*?<\/svg>/gi, '[se mostró una figura]').trim();
  return (t.length > 3000 ? t.slice(0, 3000) + '…' : t) || '(sin texto)';
}
function tutorMemory() {
  const h = TUTOR.history.filter(m => !m.live), pairs = [];
  for (let i = 0; i < h.length - 1; i++) {
    if (h[i].role === 'user' && h[i + 1].role === 'ai' && !/^\s*⚠/.test(h[i + 1].text || '')) { pairs.push([h[i], h[i + 1]]); i++; }
  }
  const last = pairs.slice(-TUTOR_MEM); let withImg = -1;
  last.forEach((p, k) => { if (p[0].imgs && p[0].imgs.length) withImg = k; });     // solo se reenvían las imágenes de la última consulta que las tuvo
  return last.flatMap(([u, a], k) => {
    const parts = [];
    if (k === withImg) u.imgs.forEach(url => parts.push({ inline_data: { mime_type: 'image/jpeg', data: url.split(',')[1] } }));
    parts.push({ text: u.text || '(imagen adjunta)' });
    return [{ role: 'user', parts }, { role: 'model', parts: [{ text: tutorClip(a.text) }] }];
  });
}
function tutorSaveSession() {
  try {
    const h = TUTOR.history.filter(m => !m.live).slice(-20).map(m => ({ role: m.role, text: String(m.text || '').replace(/\[\[FIG:\d+\]\]/g, ''), fuentes: m.fuentes, vistas: m.vistas, calcs: m.calcs, draw: m.draw }));
    sessionStorage.setItem('tutor_hist', JSON.stringify(h));
  } catch (e) {}
}

// 2. Llama a Gemini con STREAMING: el texto aparece a medida que se genera
const TUTOR_MODELS_DEFAULT = ['gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-3.5-flash-lite'];

async function tutorStream(modelo, body, onText) {
  const ctrl = new AbortController();
  let timer = setTimeout(() => ctrl.abort(), 20000);          // si no responde en 20 s, pasa al siguiente modelo
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:streamGenerateContent?alt=sse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': TUTOR.key },
      body: JSON.stringify(body),
      signal: ctrl.signal
    });
    if (!res.ok) {
      let msg = ''; try { msg = (await res.json()).error?.message || ''; } catch (e) {}
      const err = new Error(msg || ('Error ' + res.status)); err.status = res.status; throw err;
    }
    const rd = res.body.getReader(), dec = new TextDecoder();
    let buf = '', full = ''; const parts = [], calls = [];
    while (true) {
      const { value, done } = await rd.read();
      if (done) break;
      clearTimeout(timer); timer = setTimeout(() => ctrl.abort(), 30000);
      buf += dec.decode(value, { stream: true });
      let i;
      while ((i = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
        if (!line.startsWith('data:')) continue;
        try {
          const j = JSON.parse(line.slice(5));
          for (const p of (j.candidates?.[0]?.content?.parts || [])) {
            if (p.thought) continue;
            if (p.functionCall) calls.push(p.functionCall);
            const last = parts[parts.length - 1];     // las partes se guardan tal cual llegan (con sus firmas), uniendo solo el texto suelto
            if (p.text !== undefined && Object.keys(p).length === 1 && last && last.text !== undefined && Object.keys(last).length === 1) last.text += p.text; else parts.push(p);
            if (p.text) { full += p.text; onText(full); }
          }
        } catch (e) {}
      }
    }
    return { text: full, parts, calls };
  } finally { clearTimeout(timer); }
}

// Una consulta completa: el modelo puede pedir herramientas (calculadora, graficador) y seguir con los resultados
async function tutorRun(modelo, base, live, cfg, onText, showStatus) {
  const contents = base.contents.slice(); let acc = '', usos = 0;
  for (let ronda = 0; ronda < 6; ronda++) {
    const body = {
      system_instruction: base.system_instruction, contents,
      generationConfig: Object.assign({ temperature: cfg.temp ?? 0.2, maxOutputTokens: base.maxOut }, cfg.think ? { thinkingConfig: { thinkingLevel: 'low' } } : {})
    };
    if (cfg.tools) body.tools = TUTOR_TOOLS;
    const pre = acc + (acc && !/\s$/.test(acc) ? '\n\n' : '');
    const r = await tutorStream(modelo, body, t => onText(pre + t));
    acc = pre + r.text;
    if (!r.calls.length) return acc;
    contents.push({ role: 'model', parts: r.parts });          // se devuelve la respuesta del modelo completa (incluye sus firmas)
    showStatus('🧮 Usando las herramientas…');
    const resp = [];
    for (const c of r.calls) {
      const out = ++usos > 12 ? { resp: { error: 'Demasiadas herramientas en una sola consulta' } } : await tutorTool(c.name, c.args || {}, live);
      if (out.fig !== undefined) acc += '\n\n[[FIG:' + out.fig + ']]\n\n';
      resp.push({ functionResponse: { name: c.name, response: out.resp } });
    }
    contents.push({ role: 'user', parts: resp });
    onText(acc);
  }
  return acc + '\n\n(Se alcanzó el máximo de pasos con herramientas.)';
}

async function tutorAsk(pregunta, imgs = [], opts = {}) {
  tutorSyncUser();
  await tutorLoadKey();                                        // clave guardada en tu cuenta (o la que compartió la profesora)
  if (!TUTOR.key) await tutorLoadKey(true);
  if (!TUTOR.key) {
    alert(canEdit() ? 'Primero pegá tu API Key gratuita de Google AI Studio (se guarda una sola vez).' : 'Tu profesora todavía no habilitó el tutor para la biblioteca compartida.');
    return;
  }
  if (!LIB.loaded) {                                           // esperar a que termine de abrirse la biblioteca
    await libEnsure();
    const t0 = Date.now();
    while (LIB.loading && Date.now() - t0 < 15000) await new Promise(r => setTimeout(r, 200));
  }

  const memoria = tutorMemory();                               // lo que se habló antes (se calcula ANTES de agregar esta pregunta)
  const prevQ = [...TUTOR.history].reverse().find(m => m.role === 'user' && m.text);
  const corta = pregunta.split(/\s+/).filter(Boolean).length <= 5;
  const consulta = (!opts.draw && corta && prevQ) ? pregunta + ' ' + prevQ.text : pregunta;   // un "¿y el ítem b?" busca con la pregunta anterior
  TUTOR.history.push({ role: 'user', text: pregunta, imgs: imgs.map(i => i.url), draw: !!opts.draw });
  TUTOR.busy = true;

  const ctx = opts.draw ? { texto: '', fuentes: [], libros: [] } : tutorContext(consulta);   // al dibujar no hace falta buscar en los libros
  const listaLibros = ctx.libros.length
    ? `LIBROS DISPONIBLES EN LA BIBLIOTECA:\n- ${ctx.libros.join('\n- ')}\n\n`
    : '';

  const systemPrompt = `Sos la Profe Luján, una profesora de Matemática de secundaria cálida, paciente y cariñosa: hablás en español rioplatense (voseo), reconocés el esfuerzo, normalizás el error y razonás en voz alta explicando el porqué de cada paso. Estás especializada EXCLUSIVAMENTE en Matemática para nivel secundario.
REGLAS ESTRICTAS:
1. Si el usuario pregunta sobre cualquier tema ajeno a la matemática (historia, lengua, cocina, programación general, etc.), rechaza amablemente la consulta diciendo: "Solo estoy habilitado para ayudarte con temas de Matemática y el material cargado en la biblioteca."
2. Prioriza y utiliza los fragmentos de los libros cargados que se te entregan en el contexto. Cuando uses información de ellos, cita explícitamente el nombre del libro y el número de página.
3. Si la respuesta no está en los fragmentos entregados, aclara: "No encontré este tema específico en los libros cargados, pero desde la teoría matemática se resuelve así:" y luego explica el procedimiento.
4. Escribe todas las expresiones matemáticas y fórmulas usando LaTeX ($...$ para fórmulas en línea y $$...$$ para bloques centrados). Explica paso a paso con claridad pedagógica, pero sin rodeos.
5. Si el usuario adjunta una imagen: si contiene un ejercicio, problema, gráfico, figura o resolución de matemática, primero transcribí brevemente lo que ves y después resolvelo o analizalo paso a paso (si es una resolución del alumno, señalá con claridad dónde hay errores). Si la imagen no tiene nada que ver con matemática, aplicá la regla 1. Si algo no se lee bien, decilo en vez de inventarlo.
6. FIGURAS: cuando haya que dibujar (o el usuario lo pida), hacé la figura como un único bloque \`\`\`svg con un <svg> completo y válido: viewBox="0 0 480 360", primero un <rect> blanco de fondo, estilo en blanco y negro apto para imprimir (trazo negro, grises claros como relleno, sin colores fuertes), todos los estilos como atributos (nada de <style>, clases ni imágenes externas), texto en <text> plano con font-size 15 o 16 (sin LaTeX; usá símbolos como ², √, ° y letras como x). Dibujá a escala aproximada coherente con los datos, marcá el ángulo recto con un cuadradito, rotulá los lados con sus medidas y las unidades, y la incógnita como x (o con "?"). La figura del enunciado NO muestra el resultado. Tené cuidado de que ningún texto se salga del cuadro ni se superponga.
7. PÁGINAS DE LOS LIBROS: si junto a la consulta llegan imágenes rotuladas como "Imagen de la página X del libro Y", son páginas reales de los libros cargados: leé de ahí las figuras, gráficos, tablas y fórmulas (el texto extraído puede estar incompleto), y citá libro y página. Si algo de la página no se ve bien, decilo en vez de inventarlo.
8. HERRAMIENTAS: tenés una calculadora (calcular) y un graficador (graficar). Usá calcular para TODA cuenta numérica (potencias, raíces, fracciones, porcentajes, trigonometría, logaritmos) y para verificar el resultado final reemplazándolo en el problema original: no hagas cuentas de memoria. Usá graficar cada vez que haya que graficar funciones (rectas, parábolas, sistemas, exponenciales), eligiendo xmin/xmax para que se vean raíces, vértice e intersecciones, y apoyate en los puntos notables que te devuelve. El gráfico se muestra solo: no escribas código ni llamadas a funciones en tu respuesta y no lo describas punto por punto. Si una herramienta devuelve un error, corregí la expresión y reintentá.
9. MEMORIA: esta es una conversación continua. Usá los mensajes anteriores para entender referencias como "y el ítem b", "explicámelo más fácil", "con otros números" o "ahora graficalo"; retomá lo ya dicho sin repetirlo entero. Si no queda claro a qué se refiere el usuario, preguntale.`;

  const pq = pregunta || 'Analizá la imagen adjunta.';
  const nImg = imgs.length ? `AVISO: el usuario adjuntó ${imgs.length} imagen(es).\n\n` : '';
  const promptFinal = nImg + (ctx.aviso ? ctx.aviso + '\n\n' : '') + (ctx.texto
    ? `${listaLibros}FRAGMENTOS ENCONTRADOS EN LA BIBLIOTECA:\n${ctx.texto}\n\nPREGUNTA DEL USUARIO:\n${pq}`
    : `${listaLibros}AVISO: No se encontraron coincidencias directas en los PDF cargados.\n\nPREGUNTA DEL USUARIO:\n${pq}`);

  const extra = opts.draw ? `

TAREA: esto es un problema para resolver con el Teorema de Pitágoras (si el usuario pidió que lo inventes, creá uno acorde al pedido y escribí el enunciado completo; si en realidad no se resuelve con Pitágoras, decilo y resolvelo con el método correcto). Respondé en este orden: 1) el enunciado (breve); 2) la FIGURA representativa del enunciado en un bloque \`\`\`svg, sin el resultado; 3) la resolución paso a paso con Pitágoras, verificando el resultado; 4) la respuesta final en una oración con unidades.` : '';
  // Mensaje "en vivo" que se va completando mientras llega la respuesta
  const live = { role: 'ai', text: '', fuentes: ctx.fuentes, live: true };
  TUTOR.history.push(live);
  renderTutor();
  const shown = t => {
    const sp = tutorSplit(t);
    const txt = (sp.svg || sp.dibujando) ? (sp.antes + (sp.despues ? '\n\n' + sp.despues : '') + '\n\n🎨 Dibujando la figura…').trim() : t;
    return txt.replace(/\[\[FIG:\d+\]\]/g, '📈 (gráfico)');
  };
  const paint = txt => { const el = document.getElementById('tu-live'); if (el) { el.textContent = txt; const c = document.getElementById('tu-chat'); if (c) c.scrollTop = c.scrollHeight; } };
  const onText = t => { live.text = t; paint(shown(t)); };
  const showStatus = st => paint((shown(live.text) + '\n\n' + st).trim());

  const pageParts = [];
  if ((TUTOR.vision || ctx.forzarVision) && !opts.draw && ctx.paginas && ctx.paginas.length) {
    const el = document.getElementById('tu-live'); if (el) el.textContent = '📖 Mirando las páginas de tus libros…';
    const vistas = await tutorPageImgs(ctx.paginas, ctx.maxImgs || 3);
    vistas.forEach(v => pageParts.push({ text: `[Imagen de la página ${v.n || v.p} del libro "${v.bt}"]` }, { inline_data: { mime_type: v.mime, data: v.b64 } }));
    live.vistas = vistas.map(v => `${v.bt} (pág. ${v.n || v.p})`);
    if (ctx.forzarVision && !vistas.length) pageParts.push({ text: 'AVISO: no se pudo obtener ninguna imagen del documento (puede que no tenga el PDF original guardado en la nube). Decile al usuario que no pudiste leerlo y que lo suba como foto o lo transcriba.' });
    if (el) el.textContent = '⏳ Pensando…';
  }
  const modelos = window.TUTOR_MODELS || TUTOR_MODELS_DEFAULT;   // se pueden cambiar en config.js
  let ultimoError = '';

  for (const modelo of modelos) {
    const cfg = { think: true, tools: true };
    for (let k = 0; k < 4; k++) {
      live.text = ''; live.figs = []; live.calcs = [];
      const base = {
        system_instruction: { parts: [{ text: systemPrompt }] }, maxOut: opts.draw ? 8192 : 4096,
        contents: [...memoria, { role: 'user', parts: [...pageParts, ...imgs.map(i => ({ inline_data: { mime_type: i.mime, data: i.b64 } })), { text: promptFinal + extra }] }]
      };
      try {
        const txt = await tutorRun(modelo, base, live, cfg, onText, showStatus);
        if (txt) { live.text = txt; break; }
        ultimoError = 'Respuesta vacía';
        break;
      } catch (e) {
        ultimoError = e.name === 'AbortError' ? 'El modelo tardó demasiado en responder' : (e.message || 'Error');
        if (e.status === 400) {                                   // opción que ese modelo no acepta: reintenta el mismo sin ella
          if (cfg.think && /think/i.test(ultimoError)) { cfg.think = false; continue; }
          if (cfg.tools) { cfg.tools = false; continue; }
        }
        if (live.text) break;                                     // ya llegó algo: se conserva
        if (e.status === 401 || e.status === 403) { modelos.length = 0; }   // clave inválida: no sigue probando
        break;
      }
    }
    if (live.text) break;
  }

  delete live.live;
  if (!live.text) live.text = '⚠️ Error al conectar con la IA: ' + ultimoError;
  else if (ultimoError && /demasiado|abort/i.test(ultimoError)) live.text += '\n\n(La respuesta se cortó antes de terminar.)';
  TUTOR.busy = false;
  renderTutor();
  tutorSaveSession();
  if(window.AulaProfe){ const falla = /^⚠️/.test(live.text); AulaProfe.reaccionar(falla ? 'error' : 'festejo', falla ? 'Uy, algo falló. Probá de nuevo en un momento.' : '', falla ? 3500 : 2200); }
}

// ===== Herramientas matemáticas para la IA: calculadora exacta y gráficos de funciones =====
const TUTOR_MATHJS = 'https://cdn.jsdelivr.net/npm/mathjs@13.2.0/lib/browser/math.js';
let TUTOR_M = null, TUTOR_FIGN = 0;
async function tutorMath() {
  if (TUTOR_M) return TUTOR_M;
  if (!window.math) await lbScript(TUTOR_MATHJS);
  const m = window.math, off = () => { throw new Error('función deshabilitada'); };
  const M = { parse: m.parse, evaluate: m.evaluate, fraction: m.fraction, format: m.format };   // se guardan ANTES de bloquear
  m.import({ import: off, createUnit: off, reviver: off, evaluate: off, parse: off, simplify: off, derivative: off, resolve: off }, { override: true });
  return (TUTOR_M = M);
}
const tutorExpr = s => String(s).replace(/[−–]/g, '-').replace(/[·×]/g, '*').replace(/÷/g, '/').replace(/²/g, '^2').replace(/³/g, '^3').replace(/π/g, 'pi').replace(/√\s*\(/g, 'sqrt(');
const tutorNum = v => { let s = String(+Number(v).toFixed(6)); if (s === '-0') s = '0'; return s.replace('.', ','); };
const tutorR6 = v => +Number(v).toFixed(6);

async function tutorCalc(expr) {
  const M = await tutorMath(); expr = tutorExpr(expr || '').trim();
  if (!expr || expr.length > 300) return { error: 'Expresión vacía o demasiado larga' };
  try {
    const r = M.evaluate(expr), out = { resultado: M.format(r, { precision: 12 }) };
    if (typeof r === 'number' && isFinite(r) && !Number.isInteger(r)) {
      const f = M.fraction(r), n = Number(f.n), d = Number(f.d), sg = Number(f.s) || 1;
      if (d <= 1000 && Math.abs(r - sg * n / d) < 1e-10) out.fraccion = (sg < 0 ? '-' : '') + n + '/' + d;
    }
    return out;
  } catch (e) { return { error: String(e.message || e).slice(0, 200) }; }
}

const tutorNice = (range, n) => { const raw = range / n, p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p; return (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * p; };

async function tutorGraph(a) {
  const M = await tutorMath(), esc2 = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const list = (Array.isArray(a.funciones) ? a.funciones : [a.funciones]).filter(Boolean).slice(0, 4);
  if (!list.length) return { error: 'Falta al menos una función' };
  const num = v => (v === undefined || v === null || v === '' || isNaN(+v)) ? null : +v;
  let x0 = num(a.xmin), x1 = num(a.xmax); if (x0 === null) x0 = -6; if (x1 === null) x1 = 6; if (x1 <= x0) { x0 = -6; x1 = 6; }

  const curves = [];
  for (const raw of list) {
    let s = tutorExpr(raw).trim(); const vm = /^x\s*=\s*(-?\d+(?:\.\d+)?)$/.exec(s);
    if (vm) { curves.push({ v: +vm[1], label: 'x = ' + tutorNum(vm[1]) }); continue; }
    s = s.replace(/^\s*[a-zA-Z]\w*\s*(\(\s*x\s*\))?\s*=\s*/, '');
    try { const code = M.parse(s).compile(); code.evaluate({ x: 1 }); curves.push({ code, label: 'y = ' + s.replace(/\^2/g, '²').replace(/\^3/g, '³').replace(/\*/g, '·') }); }
    catch (e) { return { error: 'No pude interpretar "' + raw + '": ' + String(e.message || e).slice(0, 120) }; }
  }
  const N = 600, xs = Array.from({ length: N + 1 }, (_, i) => x0 + (x1 - x0) * i / N);
  const f = (c, x) => { try { const y = c.code.evaluate({ x }); return typeof y === 'number' && isFinite(y) ? y : NaN; } catch (e) { return NaN; } };
  curves.forEach(c => { if (c.code) c.ys = xs.map(x => f(c, x)); });
  const pts = (Array.isArray(a.puntos) ? a.puntos : []).filter(p => p && isFinite(+p.x) && isFinite(+p.y)).slice(0, 8);

  let y0 = num(a.ymin), y1 = num(a.ymax); const yAuto = y0 === null && y1 === null;
  const allY = curves.flatMap(c => c.ys || []).filter(isFinite).concat(pts.map(p => +p.y)).sort((p, q) => p - q);
  let lo = allY.length ? allY[Math.floor(allY.length * 0.02)] : -5, hi = allY.length ? allY[Math.ceil(allY.length * 0.98) - 1] : 5;
  if (hi - lo < 1e-9) { lo -= 1; hi += 1; } const pad = (hi - lo) * 0.12; lo -= pad; hi += pad;
  if (y0 === null) y0 = lo; if (y1 === null) y1 = hi; if (y1 <= y0) { y0 = lo; y1 = hi; }

  // puntos notables (calculados numéricamente)
  const bis = (fn, a0, b0) => { let p = a0, q = b0, fp = fn(p); for (let i = 0; i < 60; i++) { const m = (p + q) / 2, fm = fn(m); if (fp * fm <= 0) q = m; else { p = m; fp = fm; } } return (p + q) / 2; };
  const found = [], info = { mostrado: true, rango_x: [tutorR6(x0), tutorR6(x1)], rango_y: [tutorR6(y0), tutorR6(y1)], funciones: [], intersecciones: [] };
  const push = (x, y, tipo) => { if (!found.some(q => Math.abs(q.x - x) < (x1 - x0) * 1e-4 && Math.abs(q.y - y) < (y1 - y0) * 1e-4)) found.push({ x, y, tipo }); };
  curves.forEach((c, k) => {
    if (!c.code) { info.funciones.push({ expresion: c.label, recta_vertical: true }); return; }
    const raices = [], ext = [], fn = x => f(c, x);
    for (let i = 0; i < N; i++) {
      const p = c.ys[i], q = c.ys[i + 1]; if (!isFinite(p) || !isFinite(q)) continue;
      if (p === 0 && !raices.some(r => Math.abs(r - xs[i]) < 1e-9)) raices.push(xs[i]);
      else if (p * q < 0) { const r = bis(fn, xs[i], xs[i + 1]); if (Math.abs(fn(r)) < 1e-6 * (1 + Math.abs(p) + Math.abs(q))) raices.push(r); }
    }
    if (isFinite(c.ys[N]) && c.ys[N] === 0) raices.push(xs[N]);
    for (let i = 1; i < N; i++) {
      const p = c.ys[i - 1], q = c.ys[i], r = c.ys[i + 1]; if (![p, q, r].every(isFinite)) continue;
      if ((q - p) * (r - q) < 0 && Math.abs(q - p) > 1e-12) {
        let A = xs[i - 1], B = xs[i + 1]; const mx = q > p;
        for (let t = 0; t < 60; t++) { const m1 = A + (B - A) / 3, m2 = B - (B - A) / 3; if ((fn(m1) < fn(m2)) === mx) A = m1; else B = m2; }
        const ex = (A + B) / 2; ext.push({ x: ex, y: fn(ex), tipo: mx ? 'máximo' : 'mínimo' });
      }
    }
    const fo = { expresion: c.label };
    if (raices.length) fo.raices = raices.slice(0, 6).map(tutorR6);
    if (ext.length) fo.extremos = ext.slice(0, 4).map(e => ({ x: tutorR6(e.x), y: tutorR6(e.y), tipo: e.tipo }));
    if (x0 <= 0 && 0 <= x1 && isFinite(fn(0))) { fo.ordenada_al_origen = tutorR6(fn(0)); push(0, fn(0), 'ord'); }
    info.funciones.push(fo);
    raices.slice(0, 6).forEach(r => push(r, 0, 'raíz')); ext.slice(0, 4).forEach(e => push(e.x, e.y, e.tipo));
  });
  for (let i = 0; i < curves.length; i++) for (let j = i + 1; j < curves.length; j++) {
    const A = curves[i], B = curves[j];
    if (A.code && B.code) {
      const g = x => f(A, x) - f(B, x);
      for (let k = 0; k < N; k++) { const p = A.ys[k] - B.ys[k], q = A.ys[k + 1] - B.ys[k + 1]; if (!isFinite(p) || !isFinite(q)) continue;
        if (p === 0 || p * q < 0) { const r = p === 0 ? xs[k] : bis(g, xs[k], xs[k + 1]); if (Math.abs(g(r)) < 1e-6) { const y = f(A, r); info.intersecciones.push({ entre: 'f' + (i + 1) + ' y f' + (j + 1), x: tutorR6(r), y: tutorR6(y) }); push(r, y, 'int'); } } }
    } else if (A.code !== B.code) {
      const V = A.code ? B : A, C = A.code ? A : B, y = f(C, V.v);
      if (isFinite(y) && V.v >= x0 && V.v <= x1) { info.intersecciones.push({ entre: 'f' + (i + 1) + ' y f' + (j + 1), x: tutorR6(V.v), y: tutorR6(y) }); push(V.v, y, 'int'); }
    }
  }
  info.intersecciones = info.intersecciones.slice(0, 8);
  if (yAuto && found.some(p => p.tipo === 'mínimo' || p.tipo === 'máximo')) {      // parábolas, cúbicas, senos: zoom a lo importante
    const ys = found.map(p => p.y).concat(0), lo2 = Math.min(...ys), hi2 = Math.max(...ys), sp = Math.max(hi2 - lo2, 2);
    y0 = lo2 - 0.6 * sp; y1 = hi2 + 0.6 * sp;
  }
  info.rango_y = [tutorR6(y0), tutorR6(y1)];

  // dibujo (blanco y negro, apto para imprimir)
  const W = 480, L = 46, R = 18, T = a.titulo ? 38 : 18, PW = W - L - R, PH = 270, H = T + PH + 34 + 19 * curves.length + 4, id = 'tc' + (++TUTOR_FIGN);
  const sx = x => L + (x - x0) / (x1 - x0) * PW, sy = y => T + (1 - (y - y0) / (y1 - y0)) * PH, cl = v => Math.max(-5000, Math.min(5000, v));
  const axX = x0 <= 0 && x1 >= 0 ? sx(0) : L, axY = y0 <= 0 && y1 >= 0 ? sy(0) : T + PH;
  const tx = (x, y, anc, size, txt, extra) => `<text x="${x}" y="${y}" text-anchor="${anc}" font-size="${size}" fill="#fff" stroke="#fff" stroke-width="3.5" stroke-linejoin="round">${txt}</text><text x="${x}" y="${y}" text-anchor="${anc}" font-size="${size}" fill="#000"${extra || ''}>${txt}</text>`;
  let g = `<rect width="${W}" height="${H}" fill="#fff"/><defs><clipPath id="${id}"><rect x="${L}" y="${T}" width="${PW}" height="${PH}"/></clipPath></defs>`;
  if (a.titulo) g += `<text x="${W / 2}" y="23" text-anchor="middle" font-size="15" font-weight="bold" fill="#000">${esc2(a.titulo)}</text>`;
  const stx = tutorNice(x1 - x0, 8), sty = tutorNice(y1 - y0, 7); let grid = '', labs = '';
  for (let k = Math.ceil(x0 / stx - 1e-9); k * stx <= x1 + 1e-9; k++) { const v = k * stx, X = sx(v); grid += `<line x1="${X.toFixed(1)}" y1="${T}" x2="${X.toFixed(1)}" y2="${T + PH}" stroke="#ddd" stroke-width="1"/>`; if (Math.abs(v) > 1e-9) labs += tx(X.toFixed(1), (axY + 14).toFixed(1), 'middle', 11, tutorNum(v)); }
  for (let k = Math.ceil(y0 / sty - 1e-9); k * sty <= y1 + 1e-9; k++) { const v = k * sty, Y = sy(v); grid += `<line x1="${L}" y1="${Y.toFixed(1)}" x2="${L + PW}" y2="${Y.toFixed(1)}" stroke="#ddd" stroke-width="1"/>`; if (Math.abs(v) > 1e-9) labs += tx((axX - 6).toFixed(1), (Y + 4).toFixed(1), 'end', 11, tutorNum(v)); }
  g += grid + `<rect x="${L}" y="${T}" width="${PW}" height="${PH}" fill="none" stroke="#999"/>`;
  g += `<line x1="${L}" y1="${axY.toFixed(1)}" x2="${L + PW}" y2="${axY.toFixed(1)}" stroke="#000" stroke-width="1.6"/><line x1="${axX.toFixed(1)}" y1="${T}" x2="${axX.toFixed(1)}" y2="${T + PH}" stroke="#000" stroke-width="1.6"/>`;
  g += labs + `<text x="${L + PW - 4}" y="${(axY - 6).toFixed(1)}" text-anchor="end" font-size="13" font-style="italic" fill="#000">x</text><text x="${(axX + 8).toFixed(1)}" y="${T + 12}" font-size="13" font-style="italic" fill="#000">y</text>`;
  if (x0 <= 0 && x1 >= 0 && y0 <= 0 && y1 >= 0) g += tx((axX - 6).toFixed(1), (axY + 14).toFixed(1), 'end', 11, '0');
  const ST = [['', 2.2], ['8 5', 2.2], ['2 4', 2.8], ['11 4 2 4', 2.2]];
  g += `<g clip-path="url(#${id})" fill="none" stroke="#000" stroke-linejoin="round">`;
  curves.forEach((c, k) => {
    const [da, w] = ST[k % 4], dash = da ? ` stroke-dasharray="${da}"` : '';
    if (!c.code) { g += `<line x1="${sx(c.v).toFixed(1)}" y1="${T}" x2="${sx(c.v).toFixed(1)}" y2="${T + PH}" stroke-width="${w}"${dash}/>`; return; }
    let d = '', pen = false, prev = NaN;
    for (let i = 0; i <= N; i++) { const y = c.ys[i]; if (!isFinite(y)) { pen = false; continue; }
      if (pen && Math.abs(y - prev) > (y1 - y0) * 3) pen = false;
      d += (pen ? 'L' : 'M') + sx(xs[i]).toFixed(1) + ' ' + cl(sy(y)).toFixed(1); pen = true; prev = y; }
    g += `<path d="${d}" stroke-width="${w}"${dash}/>`;
  });
  g += '</g>';
  const mark = (x, y, fill, lab) => { const X = sx(x), Y = sy(y); if (X < L - 1 || X > L + PW + 1 || Y < T - 1 || Y > T + PH + 1) return;
    g += `<circle cx="${X.toFixed(1)}" cy="${Y.toFixed(1)}" r="3.8" fill="${fill}" stroke="#000" stroke-width="1.4"/>`;
    if (lab) { const end = X > L + PW - 70; g += tx((X + (end ? -7 : 7)).toFixed(1), (Y - 7).toFixed(1), end ? 'end' : 'start', 11, esc2(lab)); } };
  const shown = found.filter(p => p.tipo !== 'ord' || found.length <= 8).slice(0, 10), labelled = shown.length <= 8;
  shown.forEach(p => mark(p.x, p.y, '#fff', labelled ? '(' + tutorNum(p.x) + '; ' + tutorNum(p.y) + ')' : ''));
  pts.forEach(p => mark(+p.x, +p.y, '#000', p.etiqueta ? String(p.etiqueta) : '(' + tutorNum(p.x) + '; ' + tutorNum(p.y) + ')'));
  curves.forEach((c, k) => { const [da, w] = ST[k % 4], Y = T + PH + 34 + 19 * k - 5;
    g += `<line x1="${L}" y1="${Y}" x2="${L + 40}" y2="${Y}" stroke="#000" stroke-width="${w}"${da ? ` stroke-dasharray="${da}"` : ''}/><text x="${L + 50}" y="${Y + 4}" font-size="13" fill="#000">f${k + 1}:  ${esc2(c.label)}</text>`; });
  return { svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="Arial, Helvetica, sans-serif">${g}</svg>`, info };
}

const TUTOR_TOOLS = [{ functionDeclarations: [
  { name: 'calcular', description: 'Calculadora exacta. Evalúa una expresión y devuelve el resultado (y la fracción si corresponde). Usala SIEMPRE para cuentas (potencias, raíces, fracciones, porcentajes, trigonometría, logaritmos) y para verificar resultados. Sintaxis: sqrt(x), x^2, abs(x), pi, e, sin(30 deg) o sin(pi/6), log(x) es el logaritmo natural, log10(x) el decimal, combinations(n,k), punto como separador decimal. Ej.: sqrt(13^2 - 5^2)',
    parameters: { type: 'object', properties: { expresion: { type: 'string', description: 'Expresión numérica a calcular' } }, required: ['expresion'] } },
  { name: 'graficar', description: 'Dibuja el gráfico de hasta 4 funciones (rectas, parábolas, exponenciales, etc.) en el plano cartesiano, lo muestra al usuario y devuelve los puntos notables calculados (raíces, vértice o extremos, ordenada al origen, intersecciones). Usala cada vez que haya que graficar funciones; no dibujes gráficos de funciones a mano en SVG. Elegí xmin/xmax (y ymin/ymax si hace falta) para que se vean bien las raíces, el vértice y las intersecciones, con un poco de margen.',
    parameters: { type: 'object', properties: {
      funciones: { type: 'array', items: { type: 'string' }, description: 'Expresiones en la variable x, por ejemplo ["x^2 - 4x + 3", "2x - 1"]. Una recta vertical se escribe "x = 3".' },
      xmin: { type: 'number' }, xmax: { type: 'number' }, ymin: { type: 'number' }, ymax: { type: 'number' },
      titulo: { type: 'string' },
      puntos: { type: 'array', items: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' }, etiqueta: { type: 'string' } }, required: ['x', 'y'] }, description: 'Puntos extra a marcar (opcional)' }
    }, required: ['funciones'] } }
] }];

async function tutorTool(name, args, live) {
  try {
    if (name === 'calcular') { const r = await tutorCalc(args.expresion); (live.calcs = live.calcs || []).push({ e: String(args.expresion || ''), r: r.resultado !== undefined ? r.resultado + (r.fraccion ? ' (= ' + r.fraccion + ')' : '') : '⚠ ' + r.error }); return { resp: r }; }
    if (name === 'graficar') { const g = await tutorGraph(args || {}); if (g.error) return { resp: { error: g.error } }; (live.figs = live.figs || []).push(g.svg); return { resp: g.info, fig: live.figs.length - 1 }; }
    return { resp: { error: 'Herramienta desconocida: ' + name } };
  } catch (e) { return { resp: { error: String(e.message || e).slice(0, 200) } }; }
}

// Visión: convierte las páginas más relevantes de los libros en imágenes para que la IA vea figuras, gráficos y fórmulas
async function tutorPageImgs(paginas, max = 3) {
  const out = [];
  let pdfjs; try { pdfjs = await lbPdf(); } catch (e) { return out; }
  for (const pg of paginas) {
    if (out.length >= max) break;                                       // con 3 páginas alcanza; si alguna no tiene PDF, sigue con la próxima
    try {
      let doc = TUTOR.docs[pg.b];
      if (!doc) {
        const blob = await lbGetPdf(pg.b); if (!blob) continue;            // sin PDF original guardado: solo texto
        const keys = Object.keys(TUTOR.docs);
        if (keys.length >= 4) { try { TUTOR.docs[keys[0]].destroy(); } catch (e) {} delete TUTOR.docs[keys[0]]; }   // no acumular memoria
        doc = TUTOR.docs[pg.b] = await pdfjs.getDocument({ data: new Uint8Array(await blob.arrayBuffer()) }).promise;
      }
      const page = await doc.getPage(pg.p), v1 = page.getViewport({ scale: 1 }), vp = page.getViewport({ scale: 1100 / v1.width });
      const cv = document.createElement('canvas'); cv.width = Math.round(vp.width); cv.height = Math.round(vp.height);
      const cx = cv.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, cv.width, cv.height);
      await page.render({ canvasContext: cx, canvas: cv, viewport: vp }).promise;
      out.push({ ...pg, mime: 'image/jpeg', b64: cv.toDataURL('image/jpeg', 0.8).split(',')[1] });
      if (page.cleanup) page.cleanup();
    } catch (e) { console.warn('No se pudo mostrar la página', pg, e); }
  }
  return out;
}

// Figuras: la IA escribe la figura como SVG; se limpia y se muestra (se puede bajar como PNG o SVG)
function tutorSplit(t) {
  const m = /```(?:svg|xml|html)?\s*(<svg[\s\S]*?<\/svg>)\s*```/i.exec(t) || /(<svg[\s\S]*?<\/svg>)/i.exec(t);
  if (m) return { antes: t.slice(0, m.index).trim(), svg: m[1], despues: t.slice(m.index + m[0].length).trim(), dibujando: false };
  const o = /```(?:svg|xml|html)?\s*<svg/i.exec(t) || /<svg/i.exec(t);
  if (o) return { antes: t.slice(0, o.index).trim(), svg: '', despues: '', dibujando: true };   // figura a medio escribir
  return { antes: t, svg: '', despues: '', dibujando: false };
}
function tutorCleanSvg(src) {
  const svg = new DOMParser().parseFromString(src, 'text/html').querySelector('svg');
  if (!svg) return '';
  svg.querySelectorAll('script,foreignObject,iframe,object,embed,style,image,animate,set').forEach(n => n.remove());
  svg.querySelectorAll('a').forEach(n => n.replaceWith(...n.childNodes));   // quita el enlace, conserva el dibujo
  [svg, ...svg.querySelectorAll('*')].forEach(n => [...n.attributes].forEach(a => {
    if (/^on/i.test(a.name) || /javascript:/i.test(a.value) || /^(xlink:)?href$/i.test(a.name)) n.removeAttribute(a.name);
  }));
  if (!svg.getAttribute('viewBox')) {
    const w = parseFloat(svg.getAttribute('width')) || 480, h = parseFloat(svg.getAttribute('height')) || 360;
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
  }
  svg.removeAttribute('width'); svg.removeAttribute('height');
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  if (!svg.getAttribute('font-family')) svg.setAttribute('font-family', 'Arial, Helvetica, sans-serif');
  svg.setAttribute('style', 'max-width:100%;height:auto;display:block;margin:auto');
  return svg.outerHTML;
}
function tutorSized(svgStr) {                                   // para exportar: con ancho y alto explícitos
  const m = /viewBox="([\d.\s-]+)"/.exec(svgStr), v = m ? m[1].trim().split(/\s+/).map(Number) : [0, 0, 480, 360];
  return { w: v[2], h: v[3], str: svgStr.replace('<svg', '<svg width="' + v[2] + '" height="' + v[3] + '"') };
}
function tutorSave(blob, name) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
function tutorDownloadFig(svgStr, kind) {
  const z = tutorSized(svgStr);
  if (kind === 'svg') { tutorSave(new Blob([z.str], { type: 'image/svg+xml' }), 'figura.svg'); return; }
  const im = new Image(), k = 1800 / z.w;
  im.onload = () => {
    const cv = document.createElement('canvas'); cv.width = 1800; cv.height = Math.round(z.h * k);
    const cx = cv.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, cv.width, cv.height); cx.drawImage(im, 0, 0, cv.width, cv.height);
    cv.toBlob(b => tutorSave(b, 'figura.png')); URL.revokeObjectURL(im.src);
  };
  im.onerror = () => alert('No se pudo armar el PNG. Probá con SVG.');
  im.src = URL.createObjectURL(new Blob([z.str], { type: 'image/svg+xml' }));
}
function tutorFigHtml(msg, k, i) {
  const svg = (msg.figs || [])[k]; if (!svg) return '';
  const clean = tutorCleanSvg(svg); if (!clean) return '';
  return `<div style="background:#fff;border:1px solid var(--bd);border-radius:12px;padding:8px;margin:10px 0 6px;max-width:560px">${clean}</div><div class="acts" style="margin-bottom:8px"><button class="btn soft" data-fig="png" data-i="${i}" data-k="${k}">⬇ PNG</button><button class="btn soft" data-fig="svg" data-i="${i}" data-k="${k}">⬇ SVG</button></div>`;
}
function tutorBodyHtml(msg, i) {
  if (/\[\[FIG:\d+\]\]/.test(msg.text)) {
    return msg.text.split(/\[\[FIG:(\d+)\]\]/).map((seg, n) => n % 2 ? tutorFigHtml(msg, +seg, i) : (seg.trim() ? tutorTextHtml({ text: seg.trim() }, i) : '')).join('');
  }
  return tutorTextHtml(msg, i);
}
function tutorTextHtml(msg, i) {
  const sp = tutorSplit(msg.text), pw = 'margin-top:4px;white-space:pre-wrap';
  if (!sp.svg && !sp.dibujando) return `<div class="tu-msg" style="${pw}">${esc(msg.text)}</div>`;
  const clean = sp.svg ? tutorCleanSvg(sp.svg) : '';
  const redo = `<button class="btn soft" data-redo="${i}">🔄 Rehacer</button>`;
  const fig = clean
    ? `<div style="background:#fff;border:1px solid var(--bd);border-radius:12px;padding:8px;margin:10px 0 6px;max-width:560px">${clean}</div><div class="acts" style="margin-bottom:8px"><button class="btn soft" data-fig="png" data-i="${i}">⬇ PNG</button><button class="btn soft" data-fig="svg" data-i="${i}">⬇ SVG</button>${redo}</div>`
    : `<p class="note">⚠️ No se pudo dibujar la figura (la IA la dejó incompleta).</p><div class="acts">${redo}</div>`;
  return `<div class="tu-msg" style="${pw}">${esc(sp.antes)}</div>${fig}<div class="tu-msg" style="${pw}">${esc(sp.despues)}</div>`;
}

// Imágenes: se achican (máx. 1600 px, JPEG) para que se envíen rápido
const TUTOR_MAXIMG = 3;
function tutorImgPrep(file) {
  return new Promise((ok, no) => {
    const url = URL.createObjectURL(file), im = new Image();
    im.onload = () => {
      const k = Math.min(1, 1600 / Math.max(im.naturalWidth, im.naturalHeight));
      const cv = document.createElement('canvas');
      cv.width = Math.round(im.naturalWidth * k); cv.height = Math.round(im.naturalHeight * k);
      const cx = cv.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, cv.width, cv.height); cx.drawImage(im, 0, 0, cv.width, cv.height);
      URL.revokeObjectURL(url);
      const data = cv.toDataURL('image/jpeg', 0.85);
      ok({ mime: 'image/jpeg', b64: data.split(',')[1], url: data });
    };
    im.onerror = () => { URL.revokeObjectURL(url); no(new Error('No se pudo leer la imagen (si es HEIC, sacale una captura o guardala como JPG).')); };
    im.src = url;
  });
}
async function tutorAddImgs(files) {
  const list = [...files].filter(f => f.type.startsWith('image/'));
  if (!list.length) return;
  for (const f of list) {
    if (TUTOR.imgs.length >= TUTOR_MAXIMG) { alert('Podés adjuntar hasta ' + TUTOR_MAXIMG + ' imágenes por consulta.'); break; }
    try { TUTOR.imgs.push(await tutorImgPrep(f)); } catch (e) { alert(e.message); }
  }
  tutorShowPrev();
}
function tutorShowPrev() {
  const e = document.getElementById('tu-prev'); if (!e) return;
  e.innerHTML = TUTOR.imgs.map((im, i) => `<span style="position:relative;display:inline-block"><img src="${im.url}" style="height:64px;border-radius:8px;border:1px solid var(--bd)"><button class="ib" data-rmimg="${i}" title="Quitar" style="position:absolute;top:-6px;right:-6px">✕</button></span>`).join('');
  e.querySelectorAll('[data-rmimg]').forEach(b => b.onclick = () => { TUTOR.imgs.splice(+b.dataset.rmimg, 1); tutorShowPrev(); });
}

// Clave de la IA: se guarda UNA vez en tu cuenta (Firestore, config/tutor: solo la profesora puede leerla)
// y se recupera sola al ingresar desde cualquier dispositivo.
const tutorKeyDoc = () => fs.collection('config').doc('tutor');
const tutorSharedDoc = () => fs.collection('config').doc('tutor_lectores');   // copia de la clave que pueden leer los lectores de la biblioteca
const tutorIsReader = () => !canEdit() && typeof isReader === 'function' && isReader();
function tutorSyncUser() {
  const uid = (typeof user !== 'undefined' && user) ? user.uid : '';
  if (TUTOR.keyUid && TUTOR.keyUid !== uid) {                   // cambió la persona que usa la página: no se arrastra ni la clave ni la charla
    TUTOR.key = ''; TUTOR.keyP = null; TUTOR.keyState = ''; TUTOR.keyNote = ''; TUTOR.share = false; TUTOR.history = []; TUTOR.imgs = [];
    try { sessionStorage.removeItem('tutor_hist'); } catch (e) {}
  }
  TUTOR.keyUid = uid;
}
function tutorLoadKey(force) {
  tutorSyncUser();
  if (typeof fs === 'undefined' || !fs) return Promise.resolve(false);
  const lector = tutorIsReader();
  if (!canEdit() && !lector) return Promise.resolve(false);
  if (TUTOR.keyP && !force) return TUTOR.keyP;
  TUTOR.keyState = 'cargando';
  return (TUTOR.keyP = (async () => {
    try {
      if (lector) {                                             // lector de la biblioteca: usa la clave que compartió la profesora (solo en memoria)
        const d = await tutorSharedDoc().get(), k = d.exists ? String(d.data().geminiKey || '') : '';
        TUTOR.key = k; TUTOR.keyState = k ? 'lector' : 'sinclave'; TUTOR.keyNote = '';
      } else {
        const d = await tutorKeyDoc().get(), dat = d.exists ? d.data() : {}, cloud = String(dat.geminiKey || '');
        if (cloud) { TUTOR.key = cloud; TUTOR.share = !!dat.compartida; TUTOR.keyState = 'nube'; localStorage.removeItem('gemini_key'); }
        else if (TUTOR.key) {                                   // clave que estaba solo en este navegador: se sube una vez
          await tutorKeyDoc().set({ geminiKey: TUTOR.key, compartida: false, updated: Date.now() });
          TUTOR.keyState = 'nube'; localStorage.removeItem('gemini_key');
          TUTOR.keyNote = '☁️ Tu clave se pasó a tu cuenta: ya no hace falta pegarla de nuevo en otros dispositivos.';
        } else TUTOR.keyState = '';
      }
    } catch (e) {
      console.warn('No se pudo leer o guardar la clave en la nube', e);
      if (lector) {
        TUTOR.key = ''; TUTOR.keyState = 'sinclave';
        TUTOR.keyNote = e.code === 'permission-denied' ? 'No tenés permiso para usar el tutor todavía. Avisale a tu profesora.' : 'No se pudo conectar. Revisá tu conexión e intentá de nuevo.';
      } else {
        TUTOR.keyState = TUTOR.key ? 'local' : '';
        TUTOR.keyNote = 'No se pudo consultar tu clave guardada en la nube (revisá tu conexión).';
      }
    }
    tutorRefreshKeyUi();
    return !!TUTOR.key;
  })());
}
function tutorReaderNote() {
  const st = TUTOR.keyState;
  if (st === 'cargando') return '⏳ Preparando el tutor…';
  if (st === 'lector') return '✅ El tutor está habilitado por tu profesora: podés preguntar sin cargar ninguna clave.';
  return '⚠️ ' + (TUTOR.keyNote || 'Tu profesora todavía no habilitó el tutor para la biblioteca compartida.');
}
function tutorKeyPanel() {
  const st = TUTOR.keyState;
  const estado = st === 'cargando' ? '⏳ buscando tu clave guardada…' : st === 'nube' ? '✅ guardada en tu cuenta (en todos tus dispositivos)' : st === 'local' ? '⚠️ guardada solo en este navegador' : TUTOR.key ? '' : 'sin clave';
  return `<summary><b>🔑 Clave de la IA (Google AI Studio)</b> <small style="color:var(--mu);font-weight:400">· ${estado}</small></summary>
    <p class="note">Obtené tu clave gratis en <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">aistudio.google.com/apikey</a> (no requiere tarjeta). Se guarda <b>una sola vez</b> en tu cuenta de docente (solo vos podés leerla) y se recupera sola cuando ingresás desde cualquier dispositivo.</p>
    <div class="row" style="grid-template-columns:1fr auto;margin-top:8px">
      <input id="tu-key" type="password" autocomplete="off" placeholder="${TUTOR.key ? 'Ya hay una clave guardada: pegá otra solo para reemplazarla' : 'Pegá tu API Key (AIzaSy...)'}">
      <button class="btn" id="tu-save">Guardar clave</button>
    </div>
    ${TUTOR.key && TUTOR.keyState === 'nube' ? `<label class="chk" style="margin-top:12px"><input type="checkbox" id="tu-share" ${TUTOR.share ? 'checked' : ''}> 👥 Que las personas habilitadas en la <b>Biblioteca compartida</b> puedan usar el tutor con esta clave (sin cargar ninguna)</label>
      <p class="note" style="margin:2px 0 0">Esas personas gastan tu cuota gratuita de Gemini y, si saben mirar las herramientas del navegador, podrían llegar a ver la clave. Conviene usar una clave gratuita y restringida a tu sitio web.</p>` : ''}
    ${TUTOR.key ? '<div class="acts" style="margin-top:8px"><button class="btn del" id="tu-del">Quitar la clave</button></div>' : ''}
    ${TUTOR.keyNote ? `<p class="note" style="margin-top:8px">${esc(TUTOR.keyNote)}</p>` : ''}`;
}
function tutorRefreshKeyUi() {
  const rn = document.getElementById('tu-rdnote'); if (rn) rn.textContent = tutorReaderNote();
  const box = document.getElementById('tu-keybox'); if (!box) return;
  box.innerHTML = tutorKeyPanel();
  if (!TUTOR.key) box.open = true; else if (TUTOR.keyState === 'nube' && !TUTOR.keyNote) box.open = false;
  tutorBindKey();
}
function tutorBindKey() {
  const sv = document.getElementById('tu-save'); if (!sv) return;
  sv.onclick = async () => {
    const k = document.getElementById('tu-key').value.trim();
    if (!k) { TUTOR.keyNote = 'Pegá la clave en el casillero y tocá Guardar.'; tutorRefreshKeyUi(); return; }
    if (!/^AIza[\w-]{20,}$/.test(k) && !confirm('Esa clave no tiene el formato habitual (empieza con “AIza”). ¿Guardarla igual?')) return;
    sv.disabled = true; TUTOR.key = k; TUTOR.keyNote = '';
    try {
      await tutorKeyDoc().set({ geminiKey: k, compartida: !!TUTOR.share, updated: Date.now() });
      if (TUTOR.share) await tutorSharedDoc().set({ geminiKey: k, updated: Date.now() });     // si la compartís, la copia se actualiza sola
      TUTOR.keyState = 'nube'; localStorage.removeItem('gemini_key'); TUTOR.keyNote = '✓ Guardada. Ya no tenés que volver a pegarla.';
    } catch (e) {
      console.error(e); TUTOR.keyState = 'local'; localStorage.setItem('gemini_key', k);
      TUTOR.keyNote = 'No se pudo guardar en tu cuenta (' + (e.code === 'permission-denied' ? 'revisá haber ingresado con el correo de la profesora y que las reglas de Firebase estén publicadas' : 'revisá tu conexión') + '). Quedó guardada solo en este navegador.';
    }
    tutorRefreshKeyUi();
  };
  const sh = document.getElementById('tu-share');
  if (sh) sh.onchange = async () => {
    const on = sh.checked;
    if (on && !confirm('Las personas que habilitaste en la Biblioteca compartida van a poder usar el tutor con tu clave de Gemini (gastan tu cuota gratuita). ¿Activarlo?')) { sh.checked = false; return; }
    sh.disabled = true;
    try {
      if (on) await tutorSharedDoc().set({ geminiKey: TUTOR.key, updated: Date.now() }); else await tutorSharedDoc().delete();
      await tutorKeyDoc().set({ geminiKey: TUTOR.key, compartida: on, updated: Date.now() });
      TUTOR.share = on;
      TUTOR.keyNote = on ? '✓ Listo: las personas de la biblioteca compartida ya pueden usar el tutor.' : 'Dejaste de compartir la clave: el tutor ya no funciona en la biblioteca compartida.';
    } catch (e) {
      console.error(e);
      TUTOR.keyNote = 'No se pudo cambiar (' + (e.code === 'permission-denied' ? 'publicá las reglas nuevas de Firebase: archivo firestore.rules' : 'revisá tu conexión') + ').';
    }
    tutorRefreshKeyUi();
  };
  const dl = document.getElementById('tu-del');
  if (dl) dl.onclick = async () => {
    if (!confirm('¿Quitar la clave de la IA? Vas a tener que pegarla de nuevo para usar el tutor' + (TUTOR.share ? ' y la biblioteca compartida dejará de poder usarlo' : '') + '.')) return;
    TUTOR.key = ''; TUTOR.keyState = ''; TUTOR.keyNote = ''; TUTOR.share = false; localStorage.removeItem('gemini_key');
    try { try { await tutorSharedDoc().delete(); } catch (e) {} await tutorKeyDoc().delete(); TUTOR.keyNote = 'Clave quitada de tu cuenta.'; }
    catch (e) { console.error(e); TUTOR.keyNote = 'Se quitó de este navegador, pero no se pudo borrar de la nube.'; }
    tutorRefreshKeyUi();
  };
}

// 3. Interfaz visual dentro de la app
function renderTutor() {
  tutorSyncUser();
  if (!LIB.loaded && !LIB.loading) libEnsure();
  const m = $('#main');
  m.innerHTML = `
    <div class="top"><h2>Tutor IA de Matemática</h2></div>
    <p class="lead">Hacé consultas matemáticas o pedile que busque explicaciones y ejercicios dentro de tus PDF cargados.</p>
    ${canEdit() ? `<details class="gd-box" id="tu-keybox" ${TUTOR.key && TUTOR.keyState !== 'local' ? '' : 'open'}>${tutorKeyPanel()}</details>` : `<p class="note" id="tu-rdnote">${esc(tutorReaderNote())}</p>`}
    <label class="chk"><input type="checkbox" id="tu-vis" ${TUTOR.vision ? 'checked' : ''}> 👁 Que mire las páginas de mis libros como imagen (ve figuras, gráficos y fórmulas; tarda un poco más)</label>
    ${TUTOR.history.length ? `<div class="note" style="margin:6px 0">🧠 Recuerda los últimos ${Math.min(tutorMemory().length / 2, TUTOR_MEM)} intercambio(s) de esta conversación. <button class="btn soft" id="tu-new" ${TUTOR.busy ? 'disabled' : ''}>🗑 Nueva conversación</button></div>` : ''}
    <div class="gd-box" id="tu-chat" style="min-height:260px;max-height:520px;overflow-y:auto;display:flex;flex-direction:column;gap:12px">
      ${TUTOR.history.length ? TUTOR.history.map((msg, idx) => `
        <div style="padding:12px 14px;border-radius:12px;background:${msg.role === 'user' ? 'var(--plans-bg)' : 'var(--sf2)'};border:1px solid var(--bd)">
          <b>${msg.role === 'user' ? 'Vos:' : '🤖 Tutor Matemático:'}</b>
          ${msg.imgs?.length ? '<div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap">' + msg.imgs.map(u => '<img src="' + u + '" style="max-height:140px;max-width:100%;border-radius:8px;border:1px solid var(--bd)">').join('') + '</div>' : ''}
          ${msg.live ? `<div class="tu-msg" id="tu-live" style="margin-top:4px;white-space:pre-wrap">${esc(msg.text || '⏳ Pensando…')}</div>` : tutorBodyHtml(msg, idx)}
          ${msg.calcs?.length ? '<details class="note" style="margin-top:8px"><summary>🧮 ' + msg.calcs.length + ' cálculo(s) hechos con la calculadora</summary>' + msg.calcs.map(c => esc(c.e) + ' = <b>' + esc(c.r) + '</b>').join('<br>') + '</details>' : ''}
          ${msg.fuentes?.length ? `<div class="note" style="margin-top:8px">📚 <b>Páginas consultadas:</b> ${esc(msg.fuentes.join(' · '))}${msg.vistas?.length ? '<br>👁 <b>Vistas como imagen:</b> ' + esc(msg.vistas.join(' · ')) : ''}</div>` : ''}
        </div>
      `).join('') : '<p class="note">Escribí una duda abajo. Por ejemplo: <i>"Explicame cómo resolver ecuaciones cuadráticas según mis libros"</i> o <i>"Armame 3 ejercicios similares a los de la página 14 de Pitágoras"</i>. Con <b>📐 Resolver y dibujar</b> pegás un problema (o pedís que invente uno) y te arma la figura.</p>'}
    </div>
    <div id="tu-prev" style="display:flex;gap:10px;flex-wrap:wrap;margin:4px 0"></div>
    <div class="row" style="grid-template-columns:auto 1fr auto auto;align-items:end">
      <button class="btn soft" id="tu-att" title="Adjuntar una imagen (también podés pegarla con Ctrl+V o arrastrarla)">📷</button>
      <input type="file" id="tu-file" accept="image/*" multiple hidden>
      <textarea id="tu-in" rows="2" placeholder="Escribí tu consulta o adjuntá una foto del ejercicio…"></textarea>
      <button class="btn" id="tu-send" ${TUTOR.busy ? 'disabled' : ''}>Enviar</button>
      <button class="btn soft" id="tu-draw" ${TUTOR.busy ? 'disabled' : ''} title="Resuelve el problema con Pitágoras y arma la figura">📐 Resolver y dibujar</button>
    </div>
  `;

  { const c = document.getElementById('tu-chat'); if (c) c.scrollTop = c.scrollHeight; }
  if (window.renderMathInElement && !TUTOR.busy) {
    renderMathInElement(document.getElementById('tu-chat'), {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false }
      ]
    });
  }

  tutorBindKey();
  const nw = $('#tu-new');
  if (nw) nw.onclick = () => { if (TUTOR.busy) return; TUTOR.history = []; TUTOR.imgs = []; tutorSaveSession(); renderTutor(); };
  tutorLoadKey();                                // trae la clave guardada en tu cuenta

  const send = draw => {
    const val = $('#tu-in').value.trim();
    if ((!val && !TUTOR.imgs.length) || TUTOR.busy) return;
    const imgs = TUTOR.imgs; TUTOR.imgs = [];
    tutorAsk(val, imgs, { draw: draw === true });
  };
  tutorShowPrev();
  $('#tu-vis').onchange = e => { TUTOR.vision = e.target.checked; localStorage.setItem('tutor_vision', TUTOR.vision ? '1' : '0'); };
  $('#tu-att').onclick = () => $('#tu-file').click();
  $('#tu-file').onchange = async e => { await tutorAddImgs(e.target.files); e.target.value = ''; };
  $('#tu-in').addEventListener('paste', e => {                 // pegar una captura con Ctrl+V
    const fs_ = [...(e.clipboardData?.files || [])].filter(f => f.type.startsWith('image/'));
    if (fs_.length) { e.preventDefault(); tutorAddImgs(fs_); }
  });
  const chat = document.getElementById('tu-chat');             // arrastrar una imagen al chat
  chat.ondragover = e => e.preventDefault();
  chat.ondrop = e => { e.preventDefault(); tutorAddImgs(e.dataTransfer.files); };
  chat.querySelectorAll('[data-fig]').forEach(b => b.onclick = () => {
    const m = TUTOR.history[+b.dataset.i]; if (!m) return;
    const raw = b.dataset.k !== undefined ? (m.figs || [])[+b.dataset.k] : tutorSplit(m.text).svg, svg = raw ? tutorCleanSvg(raw) : ''; if (svg) tutorDownloadFig(svg, b.dataset.fig);
  });
  chat.querySelectorAll('[data-redo]').forEach(b => b.onclick = () => {
    const i = +b.dataset.redo, u = TUTOR.history[i - 1];
    if (!u || u.role !== 'user' || TUTOR.busy) return;
    TUTOR.history.splice(i - 1, 2);                           // se descarta el intento anterior
    tutorAsk(u.text, (u.imgs || []).map(x => ({ mime: 'image/jpeg', b64: x.split(',')[1], url: x })), { draw: u.draw });
  });
  $('#tu-send').onclick = () => send(false);
  $('#tu-draw').onclick = () => send(true);
  $('#tu-in').onkeydown = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };
}