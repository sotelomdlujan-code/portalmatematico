/* Tutor IA: responde únicamente sobre matemática y consulta los PDF cargados en la Biblioteca. */
const TUTOR = { history: [], key: localStorage.getItem('gemini_key') || '', busy: false };

// 1. Busca las páginas más relevantes en los libros ya cargados (LIB.pages)
function tutorContext(pregunta) {
  if (!LIB.loaded || !LIB.pages.length) return { texto: '', fuentes: [] };
  const palabras = (lbNrm(pregunta).match(/[a-z0-9]+/g) || [])
    .filter(w => w.length > 2 && !LB_STOP.has(w))
    .map(lbStem);
  if (!palabras.length) return { texto: '', fuentes: [] };

  const Q = { strong: [...new Set(palabras)], weak: [], mode: 'any' };
  const hits = [];
  for (const pg of LIB.pages) {
    const sc = lbScore(pg, Q);
    if (sc > 0) hits.push({ pg, sc });
  }
  hits.sort((a, b) => b.sc - a.sc);
  const top = hits.slice(0, 5); // Toma las 5 páginas más relevantes

  const texto = top.map(h =>
    `--- LIBRO: "${h.pg.bt}" (Página ${h.pg.p}) ---\n${h.pg.t.slice(0, 3500)}`
  ).join('\n\n');

  const fuentes = top.map(h => `${h.pg.bt} (pág. ${h.pg.p})`);
  return { texto, fuentes };
}

// 2. Llama a la API gratuita de Gemini
async function tutorAsk(pregunta) {
  if (!TUTOR.key) {
    alert('Primero pegá tu API Key gratuita de Google AI Studio.');
    return;
  }
  if (!LIB.loaded) await libEnsure();

  TUTOR.history.push({ role: 'user', text: pregunta });
  TUTOR.busy = true;
  renderTutor();

  const ctx = tutorContext(pregunta);
  const systemPrompt = `Eres un profesor y asistente especializado EXCLUSIVAMENTE en Matemática para nivel secundario.
REGLAS ESTRICTAS:
1. Si el usuario pregunta sobre cualquier tema ajeno a la matemática (historia, lengua, cocina, programación general, etc.), rechaza amablemente la consulta diciendo: "Solo estoy habilitado para ayudarte con temas de Matemática y el material cargado en la biblioteca."
2. Prioriza y utiliza los fragmentos de los libros cargados que se te entregan en el contexto. Cuando uses información de ellos, cita explícitamente el nombre del libro y el número de página.
3. Si la respuesta no está en los fragmentos entregados, aclara: "No encontré este tema específico en los libros cargados, pero desde la teoría matemática se resuelve así:" y luego explica el procedimiento.
4. Escribe todas las expresiones matemáticas y fórmulas usando LaTeX ($...$ para fórmulas en línea y $$...$$ para bloques centrados). Explica paso a paso con claridad pedagógica.`;

  const promptFinal = ctx.texto
    ? `FRAGMENTOS ENCONTRADOS EN LA BIBLIOTECA:\n${ctx.texto}\n\nPREGUNTA DEL USUARIO:\n${pregunta}`
    : `AVISO: No se encontraron coincidencias directas en los PDF cargados.\n\nPREGUNTA DEL USUARIO:\n${pregunta}`;

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${encodeURIComponent(TUTOR.key)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: promptFinal }] }],
        generationConfig: { temperature: 0.2 }
      })
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Error en la API');

    const respuesta = json.candidates?.[0]?.content?.parts?.[0]?.text || 'No pude generar una respuesta.';
    TUTOR.history.push({ role: 'ai', text: respuesta, fuentes: ctx.fuentes });
  } catch (e) {
    console.error(e);
    TUTOR.history.push({ role: 'ai', text: '⚠️ Error al conectar con la IA: ' + e.message, fuentes: [] });
  }

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
          <div class="tu-msg" style="margin-top:4px;white-space:pre-wrap">${esc(msg.text)}</div>
          ${msg.fuentes?.length ? `<div class="note" style="margin-top:8px">📚 <b>Páginas consultadas:</b> ${esc(msg.fuentes.join(' · '))}</div>` : ''}
        </div>
      `).join('') : '<p class="note">Escribí una duda abajo. Por ejemplo: <i>"Explicame cómo resolver ecuaciones cuadráticas según mis libros"</i> o <i>"Armame 3 ejercicios similares a los de la página 14 de Pitágoras"</i>.</p>'}
      ${TUTOR.busy ? '<p class="note">⏳ Analizando tus libros y resolviendo…</p>' : ''}
    </div>
    <div class="row" style="grid-template-columns:1fr auto;align-items:end">
      <textarea id="tu-in" rows="2" placeholder="Escribí tu consulta matemática acá…"></textarea>
      <button class="btn" id="tu-send" ${TUTOR.busy ? 'disabled' : ''}>Enviar</button>
    </div>
  `;

  // Renderizar fórmulas LaTeX con KaTeX
  if (window.renderMathInElement) {
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
}/* Tutor IA: responde únicamente sobre matemática y consulta los PDF cargados en la Biblioteca. */
const TUTOR = { history: [], key: localStorage.getItem('gemini_key') || '', busy: false };

// 1. Busca las páginas más relevantes en los libros ya cargados (LIB.pages)
function tutorContext(pregunta) {
  if (!LIB.loaded || !LIB.pages.length) return { texto: '', fuentes: [] };
  const palabras = (lbNrm(pregunta).match(/[a-z0-9]+/g) || [])
    .filter(w => w.length > 2 && !LB_STOP.has(w))
    .map(lbStem);
  if (!palabras.length) return { texto: '', fuentes: [] };

  const Q = { strong: [...new Set(palabras)], weak: [], mode: 'any' };
  const hits = [];
  for (const pg of LIB.pages) {
    const sc = lbScore(pg, Q);
    if (sc > 0) hits.push({ pg, sc });
  }
  hits.sort((a, b) => b.sc - a.sc);
  const top = hits.slice(0, 5); // Toma las 5 páginas más relevantes

  const texto = top.map(h =>
    `--- LIBRO: "${h.pg.bt}" (Página ${h.pg.p}) ---\n${h.pg.t.slice(0, 3500)}`
  ).join('\n\n');

  const fuentes = top.map(h => `${h.pg.bt} (pág. ${h.pg.p})`);
  return { texto, fuentes };
}

// 2. Llama a la API gratuita de Gemini
async function tutorAsk(pregunta) {
  if (!TUTOR.key) {
    alert('Primero pegá tu API Key gratuita de Google AI Studio.');
    return;
  }
  if (!LIB.loaded) await libEnsure();

  TUTOR.history.push({ role: 'user', text: pregunta });
  TUTOR.busy = true;
  renderTutor();

  const ctx = tutorContext(pregunta);
  const systemPrompt = `Eres un profesor y asistente especializado EXCLUSIVAMENTE en Matemática para nivel secundario.
REGLAS ESTRICTAS:
1. Si el usuario pregunta sobre cualquier tema ajeno a la matemática (historia, lengua, cocina, programación general, etc.), rechaza amablemente la consulta diciendo: "Solo estoy habilitado para ayudarte con temas de Matemática y el material cargado en la biblioteca."
2. Prioriza y utiliza los fragmentos de los libros cargados que se te entregan en el contexto. Cuando uses información de ellos, cita explícitamente el nombre del libro y el número de página.
3. Si la respuesta no está en los fragmentos entregados, aclara: "No encontré este tema específico en los libros cargados, pero desde la teoría matemática se resuelve así:" y luego explica el procedimiento.
4. Escribe todas las expresiones matemáticas y fórmulas usando LaTeX ($...$ para fórmulas en línea y $$...$$ para bloques centrados). Explica paso a paso con claridad pedagógica.`;

  const promptFinal = ctx.texto
    ? `FRAGMENTOS ENCONTRADOS EN LA BIBLIOTECA:\n${ctx.texto}\n\nPREGUNTA DEL USUARIO:\n${pregunta}`
    : `AVISO: No se encontraron coincidencias directas en los PDF cargados.\n\nPREGUNTA DEL USUARIO:\n${pregunta}`;

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${encodeURIComponent(TUTOR.key)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: promptFinal }] }],
        generationConfig: { temperature: 0.2 }
      })
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || 'Error en la API');

    const respuesta = json.candidates?.[0]?.content?.parts?.[0]?.text || 'No pude generar una respuesta.';
    TUTOR.history.push({ role: 'ai', text: respuesta, fuentes: ctx.fuentes });
  } catch (e) {
    console.error(e);
    TUTOR.history.push({ role: 'ai', text: '⚠️ Error al conectar con la IA: ' + e.message, fuentes: [] });
  }

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
          <div class="tu-msg" style="margin-top:4px;white-space:pre-wrap">${esc(msg.text)}</div>
          ${msg.fuentes?.length ? `<div class="note" style="margin-top:8px">📚 <b>Páginas consultadas:</b> ${esc(msg.fuentes.join(' · '))}</div>` : ''}
        </div>
      `).join('') : '<p class="note">Escribí una duda abajo. Por ejemplo: <i>"Explicame cómo resolver ecuaciones cuadráticas según mis libros"</i> o <i>"Armame 3 ejercicios similares a los de la página 14 de Pitágoras"</i>.</p>'}
      ${TUTOR.busy ? '<p class="note">⏳ Analizando tus libros y resolviendo…</p>' : ''}
    </div>
    <div class="row" style="grid-template-columns:1fr auto;align-items:end">
      <textarea id="tu-in" rows="2" placeholder="Escribí tu consulta matemática acá…"></textarea>
      <button class="btn" id="tu-send" ${TUTOR.busy ? 'disabled' : ''}>Enviar</button>
    </div>
  `;

  // Renderizar fórmulas LaTeX con KaTeX
  if (window.renderMathInElement) {
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