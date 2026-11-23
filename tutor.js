/* Tutor IA: responde únicamente sobre matemática y consulta los PDF cargados en la Biblioteca. */
const TUTOR = { history: [], key: localStorage.getItem('gemini_key') || '', busy: false, imgs: [] };

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

async function tutorAsk(pregunta, imgs = [], opts = {}) {
  if (!TUTOR.key) {
    alert('Primero pegá tu API Key gratuita de Google AI Studio.');
    return;
  }
  if (!LIB.loaded) {                                           // esperar a que termine de abrirse la biblioteca
    await libEnsure();
    const t0 = Date.now();
    while (LIB.loading && Date.now() - t0 < 15000) await new Promise(r => setTimeout(r, 200));
  }

  TUTOR.history.push({ role: 'user', text: pregunta, imgs: imgs.map(i => i.url), draw: !!opts.draw });
  TUTOR.busy = true;

  const ctx = opts.draw ? { texto: '', fuentes: [], libros: [] } : tutorContext(pregunta);   // al dibujar no hace falta buscar en los libros
  const listaLibros = ctx.libros.length
    ? `LIBROS DISPONIBLES EN LA BIBLIOTECA:\n- ${ctx.libros.join('\n- ')}\n\n`
    : '';

  const systemPrompt = `Eres un profesor y asistente especializado EXCLUSIVAMENTE en Matemática para nivel secundario.
REGLAS ESTRICTAS:
1. Si el usuario pregunta sobre cualquier tema ajeno a la matemática (historia, lengua, cocina, programación general, etc.), rechaza amablemente la consulta diciendo: "Solo estoy habilitado para ayudarte con temas de Matemática y el material cargado en la biblioteca."
2. Prioriza y utiliza los fragmentos de los libros cargados que se te entregan en el contexto. Cuando uses información de ellos, cita explícitamente el nombre del libro y el número de página.
3. Si la respuesta no está en los fragmentos entregados, aclara: "No encontré este tema específico en los libros cargados, pero desde la teoría matemática se resuelve así:" y luego explica el procedimiento.
4. Escribe todas las expresiones matemáticas y fórmulas usando LaTeX ($...$ para fórmulas en línea y $$...$$ para bloques centrados). Explica paso a paso con claridad pedagógica, pero sin rodeos.
5. Si el usuario adjunta una imagen: si contiene un ejercicio, problema, gráfico, figura o resolución de matemática, primero transcribí brevemente lo que ves y después resolvelo o analizalo paso a paso (si es una resolución del alumno, señalá con claridad dónde hay errores). Si la imagen no tiene nada que ver con matemática, aplicá la regla 1. Si algo no se lee bien, decilo en vez de inventarlo.
6. FIGURAS: cuando haya que dibujar (o el usuario lo pida), hacé la figura como un único bloque \`\`\`svg con un <svg> completo y válido: viewBox="0 0 480 360", primero un <rect> blanco de fondo, estilo en blanco y negro apto para imprimir (trazo negro, grises claros como relleno, sin colores fuertes), todos los estilos como atributos (nada de <style>, clases ni imágenes externas), texto en <text> plano con font-size 15 o 16 (sin LaTeX; usá símbolos como ², √, ° y letras como x). Dibujá a escala aproximada coherente con los datos, marcá el ángulo recto con un cuadradito, rotulá los lados con sus medidas y las unidades, y la incógnita como x (o con "?"). La figura del enunciado NO muestra el resultado. Tené cuidado de que ningún texto se salga del cuadro ni se superponga.`;

  const pq = pregunta || 'Analizá la imagen adjunta.';
  const nImg = imgs.length ? `AVISO: el usuario adjuntó ${imgs.length} imagen(es).\n\n` : '';
  const promptFinal = nImg + (ctx.texto
    ? `${listaLibros}FRAGMENTOS ENCONTRADOS EN LA BIBLIOTECA:\n${ctx.texto}\n\nPREGUNTA DEL USUARIO:\n${pq}`
    : `${listaLibros}AVISO: No se encontraron coincidencias directas en los PDF cargados.\n\nPREGUNTA DEL USUARIO:\n${pq}`);

  const extra = opts.draw ? `

TAREA: esto es un problema para resolver con el Teorema de Pitágoras (si el usuario pidió que lo inventes, creá uno acorde al pedido y escribí el enunciado completo; si en realidad no se resuelve con Pitágoras, decilo y resolvelo con el método correcto). Respondé en este orden: 1) el enunciado (breve); 2) la FIGURA representativa del enunciado en un bloque \`\`\`svg, sin el resultado; 3) la resolución paso a paso con Pitágoras, verificando el resultado; 4) la respuesta final en una oración con unidades.` : '';
  // Mensaje "en vivo" que se va completando mientras llega la respuesta
  const live = { role: 'ai', text: '', fuentes: ctx.fuentes, live: true };
  TUTOR.history.push(live);
  renderTutor();
  const onText = t => {
    live.text = t;
    const el = document.getElementById('tu-live');
    if (el) { const sp = tutorSplit(t); el.textContent = (sp.svg || sp.dibujando) ? (sp.antes + (sp.despues ? '\n\n' + sp.despues : '') + '\n\n🎨 Dibujando la figura…').trim() : t; const c = document.getElementById('tu-chat'); if (c) c.scrollTop = c.scrollHeight; }
  };

  const modelos = window.TUTOR_MODELS || TUTOR_MODELS_DEFAULT;   // se pueden cambiar en config.js
  let ultimoError = '';

  for (const modelo of modelos) {
    for (const conThinking of [true, false]) {
      const body = {
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [...imgs.map(i => ({ inline_data: { mime_type: i.mime, data: i.b64 } })), { text: promptFinal + extra }] }],
        generationConfig: Object.assign({ temperature: 0.2, maxOutputTokens: opts.draw ? 8192 : 4096 }, conThinking ? { thinkingConfig: { thinkingLevel: 'low' } } : {})
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
  if (kind === 'svg') { tutorSave(new Blob([z.str], { type: 'image/svg+xml' }), 'figura-pitagoras.svg'); return; }
  const im = new Image(), k = 1800 / z.w;
  im.onload = () => {
    const cv = document.createElement('canvas'); cv.width = 1800; cv.height = Math.round(z.h * k);
    const cx = cv.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, cv.width, cv.height); cx.drawImage(im, 0, 0, cv.width, cv.height);
    cv.toBlob(b => tutorSave(b, 'figura-pitagoras.png')); URL.revokeObjectURL(im.src);
  };
  im.onerror = () => alert('No se pudo armar el PNG. Probá con SVG.');
  im.src = URL.createObjectURL(new Blob([z.str], { type: 'image/svg+xml' }));
}
function tutorBodyHtml(msg, i) {
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
      ${TUTOR.history.length ? TUTOR.history.map((msg, idx) => `
        <div style="padding:12px 14px;border-radius:12px;background:${msg.role === 'user' ? 'var(--plans-bg)' : 'var(--sf2)'};border:1px solid var(--bd)">
          <b>${msg.role === 'user' ? 'Vos:' : '🤖 Tutor Matemático:'}</b>
          ${msg.imgs?.length ? '<div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap">' + msg.imgs.map(u => '<img src="' + u + '" style="max-height:140px;max-width:100%;border-radius:8px;border:1px solid var(--bd)">').join('') + '</div>' : ''}
          ${msg.live ? `<div class="tu-msg" id="tu-live" style="margin-top:4px;white-space:pre-wrap">${esc(msg.text || '⏳ Pensando…')}</div>` : tutorBodyHtml(msg, idx)}
          ${msg.fuentes?.length ? `<div class="note" style="margin-top:8px">📚 <b>Páginas consultadas:</b> ${esc(msg.fuentes.join(' · '))}</div>` : ''}
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

  if ($('#tu-save')) {
    $('#tu-save').onclick = () => {
      TUTOR.key = $('#tu-key').value.trim();
      localStorage.setItem('gemini_key', TUTOR.key);
      alert('Clave guardada en este navegador.');
      renderTutor();
    };
  }

  const send = draw => {
    const val = $('#tu-in').value.trim();
    if ((!val && !TUTOR.imgs.length) || TUTOR.busy) return;
    const imgs = TUTOR.imgs; TUTOR.imgs = [];
    tutorAsk(val, imgs, { draw: draw === true });
  };
  tutorShowPrev();
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
    const svg = tutorCleanSvg(tutorSplit(m.text).svg); if (svg) tutorDownloadFig(svg, b.dataset.fig);
  });
  chat.querySelectorAll('[data-redo]').forEach(b => b.onclick = () => {
    const i = +b.dataset.redo, u = TUTOR.history[i - 1];
    if (!u || u.role !== 'user' || TUTOR.busy) return;
    tutorAsk(u.text, (u.imgs || []).map(x => ({ mime: 'image/jpeg', b64: x.split(',')[1], url: x })), { draw: u.draw });
  });
  $('#tu-send').onclick = () => send(false);
  $('#tu-draw').onclick = () => send(true);
  $('#tu-in').onkeydown = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };
}