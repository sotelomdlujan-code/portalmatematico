/* Tutor IA: responde únicamente sobre matemática y consulta los PDF cargados en la Biblioteca. */
const TUTOR = { history: [], key: localStorage.getItem('gemini_key') || '', busy: false };

// 1. Busca las páginas más relevantes en los libros ya cargados (LIB.pages)
function tutorContext(pregunta) {
  if (!LIB.loaded || !LIB.pages.length) return { texto: '', fuentes: [], libros: [] };
  const libros = [...new Set(LIB.pages.map(pg => pg.bt).filter(Boolean))];
  const palabras = (lbNrm(pregunta).match(/[a-z0-9]+/g) || [])
    .filter(w => w.length > 2 && !LB_STOP.has(w))
    .map(lbStem);
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
  return { texto, fuentes, libros };
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
    let buf = '', full = '';
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
          for (const p of (j.candidates?.[0]?.content?.parts || [])) if (p.text && !p.thought) { full += p.text; onText(full); }
        } catch (e) {}
      }
    }
    return full;
  } finally { clearTimeout(timer); }
}

async function tutorAsk(pregunta) {
  if (!TUTOR.key) {
    alert('Primero pegá tu API Key gratuita de Google AI Studio.');
    return;
  }
  if (!LIB.loaded) {                                           // esperar a que termine de abrirse la biblioteca
    await libEnsure();
    const t0 = Date.now();
    while (LIB.loading && Date.now() - t0 < 15000) await new Promise(r => setTimeout(r, 200));
  }

  TUTOR.history.push({ role: 'user', text: pregunta });
  TUTOR.busy = true;

  const ctx = tutorContext(pregunta);
  const listaLibros = ctx.libros.length
    ? `LIBROS DISPONIBLES EN LA BIBLIOTECA:\n- ${ctx.libros.join('\n- ')}\n\n`
    : '';

  const systemPrompt = `Eres un profesor y asistente especializado EXCLUSIVAMENTE en Matemática para nivel secundario.
REGLAS ESTRICTAS:
1. Si el usuario pregunta sobre cualquier tema ajeno a la matemática (historia, lengua, cocina, programación general, etc.), rechaza amablemente la consulta diciendo: "Solo estoy habilitado para ayudarte con temas de Matemática y el material cargado en la biblioteca."
2. Prioriza y utiliza los fragmentos de los libros cargados que se te entregan en el contexto. Cuando uses información de ellos, cita explícitamente el nombre del libro y el número de página.
3. Si la respuesta no está en los fragmentos entregados, aclara: "No encontré este tema específico en los libros cargados, pero desde la teoría matemática se resuelve así:" y luego explica el procedimiento.
4. Escribe todas las expresiones matemáticas y fórmulas usando LaTeX ($...$ para fórmulas en línea y $$...$$ para bloques centrados). Explica paso a paso con claridad pedagógica, pero sin rodeos.`;

  const promptFinal = ctx.texto
    ? `${listaLibros}FRAGMENTOS ENCONTRADOS EN LA BIBLIOTECA:\n${ctx.texto}\n\nPREGUNTA DEL USUARIO:\n${pregunta}`
    : `${listaLibros}AVISO: No se encontraron coincidencias directas en los PDF cargados.\n\nPREGUNTA DEL USUARIO:\n${pregunta}`;

  // Mensaje "en vivo" que se va completando mientras llega la respuesta
  const live = { role: 'ai', text: '', fuentes: ctx.fuentes, live: true };
  TUTOR.history.push(live);
  renderTutor();
  const onText = t => {
    live.text = t;
    const el = document.getElementById('tu-live');
    if (el) { el.textContent = t; const c = document.getElementById('tu-chat'); if (c) c.scrollTop = c.scrollHeight; }
  };

  const modelos = window.TUTOR_MODELS || TUTOR_MODELS_DEFAULT;   // se pueden cambiar en config.js
  let ultimoError = '';

  for (const modelo of modelos) {
    for (const conThinking of [true, false]) {
      const body = {
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: promptFinal }] }],
        generationConfig: Object.assign({ temperature: 0.2, maxOutputTokens: 4096 }, conThinking ? { thinkingConfig: { thinkingLevel: 'low' } } : {})
      };
      try {
        const txt = await tutorStream(modelo, body, onText);
        if (txt) { live.text = txt; break; }
        ultimoError = 'Respuesta vacía';
        break;
      } catch (e) {
        ultimoError = e.name === 'AbortError' ? 'El modelo tardó demasiado en responder' : (e.message || 'Error');
        if (live.text) break;                                   // ya llegó algo: se conserva
        // si el modelo no acepta la opción de "pensar poco", reintenta el mismo sin ella
        if (conThinking && e.status === 400 && /think/i.test(ultimoError)) continue;
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
}

// 3. Interfaz visual dentro de la app
function renderTutor() {
  if (!LIB.loaded && !LIB.loading) libEnsure();
  const m = $('#main');
  m.innerHTML = `
    <div class="top"><h2>Tutor IA de Matemática</h2></div>
    <p class="lead">Hacé consultas matemáticas o pedile que busque explicaciones y ejercicios dentro de tus PDF cargados.</p>
    ${canEdit() ? `
      <details class="gd-box" ${TUTOR.key ? '' : 'open'}>
        <summary><b>🔑 Configuración de API gratuita (Google AI Studio)</b></summary>
        <p class="note">Obtené tu clave gratis en <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">aistudio.google.com/apikey</a> (no requiere tarjeta).</p>
        <div class="row" style="grid-template-columns:1fr auto;margin-top:8px">
          <input id="tu-key" type="password" placeholder="Pegá tu API Key (AIzaSy...)" value="${esc(TUTOR.key)}">
          <button class="btn" id="tu-save">Guardar clave</button>
        </div>
      </details>` : ''}
    <div class="gd-box" id="tu-chat" style="min-height:260px;max-height:520px;overflow-y:auto;display:flex;flex-direction:column;gap:12px">
      ${TUTOR.history.length ? TUTOR.history.map(msg => `
        <div style="padding:12px 14px;border-radius:12px;background:${msg.role === 'user' ? 'var(--plans-bg)' : 'var(--sf2)'};border:1px solid var(--bd)">
          <b>${msg.role === 'user' ? 'Vos:' : '🤖 Tutor Matemático:'}</b>
          <div class="tu-msg" ${msg.live ? 'id="tu-live"' : ''} style="margin-top:4px;white-space:pre-wrap">${esc(msg.text || (msg.live ? '⏳ Pensando…' : ''))}</div>
          ${msg.fuentes?.length ? `<div class="note" style="margin-top:8px">📚 <b>Páginas consultadas:</b> ${esc(msg.fuentes.join(' · '))}</div>` : ''}
        </div>
      `).join('') : '<p class="note">Escribí una duda abajo. Por ejemplo: <i>"Explicame cómo resolver ecuaciones cuadráticas según mis libros"</i> o <i>"Armame 3 ejercicios similares a los de la página 14 de Pitágoras"</i>.</p>'}
    </div>
    <div class="row" style="grid-template-columns:1fr auto;align-items:end">
      <textarea id="tu-in" rows="2" placeholder="Escribí tu consulta matemática acá…"></textarea>
      <button class="btn" id="tu-send" ${TUTOR.busy ? 'disabled' : ''}>Enviar</button>
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

  if ($('#tu-save')) {
    $('#tu-save').onclick = () => {
      TUTOR.key = $('#tu-key').value.trim();
      localStorage.setItem('gemini_key', TUTOR.key);
      alert('Clave guardada en este navegador.');
      renderTutor();
    };
  }

  const send = () => {
    const val = $('#tu-in').value.trim();
    if (!val || TUTOR.busy) return;
    tutorAsk(val);
  };
  $('#tu-send').onclick = send;
  $('#tu-in').onkeydown = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };
}