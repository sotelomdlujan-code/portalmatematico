/* materiales.js — Carga directa de PDFs e imágenes en courses/{courseId}/materials */
(function(){
  const CHUNK_SIZE = 700000;

  const esc = t => String(t ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

  const MIMES = {pdf:"application/pdf", doc:"application/msword", docx:"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls:"application/vnd.ms-excel", xlsx:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", ppt:"application/vnd.ms-powerpoint",
    pptx:"application/vnd.openxmlformats-officedocument.presentationml.presentation", odt:"application/vnd.oasis.opendocument.text",
    ods:"application/vnd.oasis.opendocument.spreadsheet", odp:"application/vnd.oasis.opendocument.presentation", txt:"text/plain", csv:"text/csv",
    png:"image/png", jpg:"image/jpeg", jpeg:"image/jpeg", gif:"image/gif", webp:"image/webp"};
  const extOf = n => (String(n || "").split(".").pop() || "").toLowerCase();
  const mimeOf = f => f.type || MIMES[extOf(f.name)] || "application/octet-stream";
  const ACCEPT = ".pdf,application/pdf,image/*,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.odt,.ods,.odp,.txt,.csv";
  const MAX_MB = 15;

  function readAsDataURL(file){
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = () => rej(new Error("No se pudo leer " + file.name));
      r.readAsDataURL(file);
    });
  }

  async function saveLocalFile(db, uid, file){
    const dataUrl = await readAsDataURL(file);
    const total = Math.ceil(dataUrl.length / CHUNK_SIZE);
    const fileRef = db.collection("archivos_aula").doc();
    await fileRef.set({
      name: file.name,
      type: mimeOf(file),
      size: file.size,
      total: total,
      owner: uid,
      createdAt: Date.now()
    });
    for(let i = 0; i < total; i++){
      await fileRef.collection("chunks").doc(String(i)).set({
        i: i,
        d: dataUrl.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE)
      });
    }
    return {
      id: fileRef.id,
      name: file.name,
      type: mimeOf(file),
      size: file.size
    };
  }

  /* ---------- Caché en el dispositivo (IndexedDB): el archivo se baja una sola vez ---------- */
  const CACHE_MAX = 12, IDX_KEY = "aula_mat_idx";
  const idb = (() => {
    let p;
    const open = () => p || (p = new Promise((ok, no) => {
      const r = indexedDB.open("aula_materiales", 1);
      r.onupgradeneeded = () => r.result.createObjectStore("files");
      r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error);
    }));
    const run = async (mode, fn) => { const d = await open(); return new Promise((ok, no) => { const t = d.transaction("files", mode), rq = fn(t.objectStore("files")); t.oncomplete = () => ok(rq && rq.result); t.onerror = () => no(t.error); t.onabort = () => no(t.error); }); };
    return { get: k => run("readonly", o => o.get(k)), put: (k, v) => run("readwrite", o => o.put(v, k)), del: k => run("readwrite", o => o.delete(k)) };
  })();
  const idxLoad = () => { try { return JSON.parse(localStorage.getItem(IDX_KEY) || "{}"); } catch(e){ return {}; } };
  const idxSave = o => { try { localStorage.setItem(IDX_KEY, JSON.stringify(o)); } catch(e){} };
  async function cacheTouch(id){ const o = idxLoad(); o[id] = Date.now(); idxSave(o); }
  async function cachePut(id, value){
    await idb.put(id, value);
    const o = idxLoad(); o[id] = Date.now();
    const ids = Object.keys(o).sort((x, y) => o[y] - o[x]);        // se conservan los 12 más recientes
    for(const old of ids.slice(CACHE_MAX)){ delete o[old]; try { await idb.del(old); } catch(e){} }
    idxSave(o);
  }

  function dataUrlToBlob(dataUrl, forceType){
    const [head, b64] = dataUrl.split(",");
    const mime = forceType || (head.match(/:(.*?);/) || [])[1] || "application/pdf";
    const bin = atob(b64), arr = new Uint8Array(bin.length);
    for(let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: mime });
  }

  /* src = { key, getMeta(): meta|null, getChunks(): [{i,d}], format?: "b64" }
     Sirve tanto para los archivos del aula como para las entregas de los alumnos (que guardan cada parte en base64 puro). */
  async function getFileFrom(src, status){
    let cached = null; try { cached = await idb.get(src.key); } catch(e){}
    let meta;
    try {
      meta = await src.getMeta();                                   // los archivos del aula hacen 1 sola lectura para saber si sigue existiendo
      if(!meta){ const g = new Error("El archivo ya no existe."); g.gone = true; throw g; }
    } catch(e){
      if(e.gone){ try { await idb.del(src.key); } catch(x){} throw e; }
      if(cached && cached.blob) return { meta: cached.meta || {}, blob: cached.blob, cached: true };   // sin conexión: se usa la copia guardada
      throw e;
    }
    if(cached && cached.blob && cached.meta && cached.meta.createdAt === meta.createdAt){ cacheTouch(src.key); return { meta, blob: cached.blob, cached: true }; }
    status && status("Descargando el archivo…");
    const parts = new Array(meta.total); let got = 0;
    for(const x of await src.getChunks()){ if(parts[x.i] === undefined) got++; parts[x.i] = x.d; }
    if(got < meta.total) throw new Error("El archivo está incompleto. Pedile a quien lo subió que lo vuelva a subir.");
    let blob;
    if(src.format === "b64"){
      blob = new Blob(parts.map(p => { const bin = atob(p), u = new Uint8Array(bin.length); for(let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; }), { type: meta.type || "application/octet-stream" });
    } else blob = dataUrlToBlob(parts.join(""), meta.type);
    try { await cachePut(src.key, { blob, meta }); } catch(e){}
    return { meta, blob };
  }
  const getFile = (db, fileId, status) => getFileFrom({
    key: fileId,
    async getMeta(){ const sn = await db.collection("archivos_aula").doc(fileId).get(); return sn.exists ? sn.data() : null; },
    async getChunks(){ const cs = await db.collection("archivos_aula").doc(fileId).collection("chunks").get(); const a = []; cs.forEach(d => a.push(d.data())); return a; }
  }, status);

  async function deleteLocalFile(db, fileId){
    try{
      const chunksSnap = await db.collection("archivos_aula").doc(fileId).collection("chunks").get();
      const batch = db.batch();
      chunksSnap.forEach(d => batch.delete(d.ref));
      batch.delete(db.collection("archivos_aula").doc(fileId));
      await batch.commit();
    }catch(e){ console.warn("No se pudo limpiar archivo:", e); }
  }

  let cssDone = false;
  function injectCss(){
    if(cssDone) return; cssDone = true;
    const st = document.createElement("style");
    st.textContent = `
.mv-dlg{width:min(96vw,960px);height:90vh;max-height:90vh;padding:0;border:0;box-sizing:border-box;border-radius:18px;overflow:hidden}
.mv-dlg[open]{display:flex;flex-direction:column}
.mv-bar{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:10px 12px;border-bottom:1.5px solid var(--bd);flex-wrap:wrap;background:var(--sf)}
.mv-bar>b{flex:1 1 140px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mv-tools{display:flex;gap:6px;align-items:center}
.mv-tools .btn{padding:8px 12px;min-height:40px;display:inline-flex;align-items:center;justify-content:center;line-height:1.2;align-self:center;height:40px;box-sizing:border-box}
.mv-zt{display:inline-flex;gap:4px;align-items:center}.mv-zt[hidden]{display:none}
.mv-zoom{min-width:46px;text-align:center;font-weight:700;font-size:.82rem;color:var(--mu)}
.mv-body{flex:1;min-height:0;overflow:auto;background:var(--bd);-webkit-overflow-scrolling:touch}
.mv-msg{display:grid;place-items:center;min-height:100%;padding:24px;text-align:center}
.mv-pg{margin:8px auto;background:#fff;box-shadow:0 1px 6px rgba(0,0,0,.22);position:relative}
.mv-pg canvas{display:block;width:100%;height:100%}
.mv-pn{position:absolute;right:6px;bottom:4px;font-size:.7rem;background:rgba(0,0,0,.55);color:#fff;padding:1px 8px;border-radius:999px}
.mv-img{display:block;max-width:100%;margin:10px auto;border-radius:10px;background:#fff}
@media (max-width:760px){.mv-dlg{width:100vw;max-width:100vw;height:100dvh;max-height:100dvh;margin:0;border-radius:0}.mv-bar{padding:8px 10px}}
`;
    document.head.appendChild(st);
  }

  window.AulaMateriales = {
    /* Selector de archivos para cualquier formulario (Material, Planificaciones, Evaluaciones, Tareas).
       host: elemento donde se dibuja · ctx: { db, user } · items: archivos ya guardados del ítem que se edita.
       check() valida · commit() sube y devuelve la lista final · finish() borra los quitados (después de guardar) · rollback() deshace lo subido si falló el guardado. */
    picker(host, ctx, items){
      const { db, user } = ctx;
      const kept = Array.isArray(items) ? [...items] : [], removed = [], uploaded = [];
      host.innerHTML = `
        <label>Archivos <small style="font-weight:400;color:var(--mu)">(PDF, Word, Excel, PowerPoint o imágenes)</small></label>
        <input class="mp-in" type="file" accept="${ACCEPT}" multiple>
        <p class="note">Se guardan directamente en el aula, sin usar Google Drive. Máximo ${MAX_MB} MB por archivo.</p>
        <div class="mp-kept" style="margin-top:6px"></div>`;
      const input = host.querySelector(".mp-in"), box = host.querySelector(".mp-kept");
      const draw = () => {
        if(!kept.length){ box.innerHTML = ""; return; }
        box.innerHTML = `<b style="font-size:.85rem">Archivos cargados:</b>` + kept.map((f, i) => `
          <div class="share-row"><span>${typeof fileIco === "function" ? fileIco(f) : "📄"} ${esc(f.name)} <small>(${Math.max(1, Math.round((f.size || 0) / 1024))} KB)</small></span>
          <button type="button" class="btn del" data-rm="${i}" style="padding:4px 10px;font-size:.8rem">Quitar</button></div>`).join("");
        box.querySelectorAll("[data-rm]").forEach(bt => bt.onclick = () => { const r = kept.splice(+bt.dataset.rm, 1)[0]; if(r && r.id) removed.push(r.id); draw(); });
      };
      draw();
      return {
        check(){ for(const f of Array.from(input.files || [])) if(f.size > MAX_MB * 1024 * 1024) return `El archivo "${f.name}" supera los ${MAX_MB} MB.`; return ""; },
        async commit(onProgress){
          const files = Array.from(input.files || []);
          try {
            for(let i = 0; i < files.length; i++){ onProgress && onProgress(i + 1, files.length); uploaded.push(await saveLocalFile(db, user.uid, files[i])); }
          } catch(e){ await this.rollback(); throw e; }
          return [...kept, ...uploaded];
        },
        async finish(){ for(const id of removed) await deleteLocalFile(db, id); removed.length = 0; },
        async rollback(){ for(const f of uploaded.splice(0)) await deleteLocalFile(db, f.id); }
      };
    },

    openEditor(ctx, existingItem){
      const { db, user, colRef, dlg, frm } = ctx;
      const it = existingItem || {};
      frm.innerHTML = `
        <h3>${it.id ? "Editar" : "Nuevo"} · material</h3>
        <label>Título *</label>
        <input id="m-tit" required placeholder="Ej: Apunte de Ecuaciones + Guía práctica" value="${esc(it.title || "")}">
        <label>Descripción</label>
        <textarea id="m-desc" placeholder="Explicá qué contiene el archivo o qué páginas tienen que leer...">${esc(it.descripcion || "")}</textarea>
        <div id="m-pick"></div>
        <div class="err" id="m-err"></div>
        <div class="acts" style="margin-top:18px">
          <button type="button" class="btn" id="m-save">Guardar</button>
          <button type="button" class="btn soft" id="m-cancel">Cancelar</button>
        </div>
      `;
      const pk = this.picker(frm.querySelector("#m-pick"), { db, user }, it.localFiles);
      frm.querySelector("#m-cancel").onclick = () => dlg.close();
      frm.querySelector("#m-save").onclick = async () => {
        const title = frm.querySelector("#m-tit").value.trim(), err = frm.querySelector("#m-err"), btn = frm.querySelector("#m-save");
        if(!title){ err.textContent = "Escribí un título para guardar."; return; }
        const bad = pk.check(); if(bad){ err.textContent = bad; return; }
        btn.disabled = true; err.textContent = "";
        try{
          const localFiles = await pk.commit((i, n) => { btn.textContent = `Subiendo ${i} de ${n}…`; });
          btn.textContent = "Guardando…";
          const payload = { title, descripcion: frm.querySelector("#m-desc").value.trim(), localFiles, files: Array.isArray(it.files) ? it.files : [], updated: Date.now() };
          if(it.guideId){ payload.guideId = it.guideId; payload.guideTitle = it.guideTitle || ""; }
          try {
            if(it.id) await colRef.doc(it.id).set({ ...payload, created: it.created || Date.now() }); else await colRef.add({ ...payload, created: Date.now() });
          } catch(e){ await pk.rollback(); throw e; }
          await pk.finish();                       // los archivos quitados se borran recién cuando el guardado salió bien
          dlg.close();
        }catch(e){
          err.textContent = "Error al guardar: " + (e.message || e);
          btn.disabled = false; btn.textContent = "Guardar";
        }
      };
      dlg.showModal();
    },

    async openViewer(db, fileId, fileName, src){
      fileName = String(fileName || "archivo");
      injectCss();
      const overlay = document.createElement("dialog");
      overlay.className = "mv-dlg";
      overlay.innerHTML = `
        <div class="mv-bar">
          <b title="${esc(fileName)}">📄 ${esc(fileName)}</b>
          <div class="mv-tools">
            <span class="mv-zt" hidden>
              <button type="button" class="btn soft" id="mv-zo" aria-label="Alejar">－</button>
              <span class="mv-zoom" id="mv-zl">100%</span>
              <button type="button" class="btn soft" id="mv-zi" aria-label="Acercar">＋</button>
            </span>
            <a id="mv-dl" class="btn soft" download="${esc(fileName)}" style="text-decoration:none;display:none">⬇</a>
            <button type="button" class="btn del" id="mv-cl">Cerrar</button>
          </div>
        </div>
        <div class="mv-body" id="mv-body"><div class="mv-msg"><p id="mv-st">Abriendo…</p></div></div>
      `;
      document.body.appendChild(overlay);
      overlay.setAttribute("tabindex", "-1");
      overlay.showModal();
      overlay.focus({ preventScroll: true });          // que no quede marcado el primer botón

      const body = overlay.querySelector("#mv-body");
      let blobUrl = "", pdfDoc = null, io = null, onResize = null, closed = false;
      const cleanup = () => {
        if(closed) return; closed = true;
        if(io) io.disconnect();
        if(onResize) window.removeEventListener("resize", onResize);
        if(pdfDoc && pdfDoc.destroy) { try { pdfDoc.destroy(); } catch(e){} }
        if(blobUrl) URL.revokeObjectURL(blobUrl);
        overlay.remove();
      };
      overlay.querySelector("#mv-cl").onclick = () => { overlay.close(); };
      overlay.addEventListener("close", cleanup);

      try{
        const { meta, blob } = await (src ? getFileFrom(src, t => { const st = overlay.querySelector("#mv-st"); if(st) st.textContent = t; }) : getFile(db, fileId, t => { const st = overlay.querySelector("#mv-st"); if(st) st.textContent = t; }));
        if(closed) return;
        blobUrl = URL.createObjectURL(blob);
        const dl = overlay.querySelector("#mv-dl");
        dl.href = blobUrl; dl.style.display = "inline-flex";

        const type = String(meta.type || blob.type || "").toLowerCase();
        if(type.startsWith("image/")){
          body.innerHTML = `<img class="mv-img" alt="${esc(fileName)}" src="${blobUrl}">`;
          return;
        }
        if(type !== "application/pdf" && extOf(fileName) !== "pdf"){
          overlay.querySelector("#mv-dl").style.display = "none";
          body.innerHTML = `<div class="mv-msg"><div><p style="font-size:2.2rem;margin:0">📎</p><p><b>${esc(fileName)}</b></p><p class="note">Este tipo de archivo no se puede ver acá. Descargalo para abrirlo en tu dispositivo.</p><a class="btn" href="${blobUrl}" download="${esc(fileName)}" style="text-decoration:none">⬇ Descargar</a></div></div>`;
          return;
        }

        // PDF: se dibuja página por página (funciona en iPhone y Android, donde el visor integrado no sirve)
        let pdfjs;
        try { pdfjs = typeof lbPdf === "function" ? await lbPdf() : window.pdfjsLib; if(!pdfjs) throw new Error("sin visor"); }
        catch(e){ console.warn(e); body.innerHTML = `<iframe src="${blobUrl}" style="width:100%;height:100%;border:0;background:#fff"></iframe>`; return; }
        pdfDoc = await pdfjs.getDocument({ data: new Uint8Array(await blob.arrayBuffer()) }).promise;
        if(closed) return;

        const N = pdfDoc.numPages, ZOOMS = [1, 1.5, 2, 3];
        let zi = 0, ratio = 1.414;
        body.innerHTML = "";
        const first = await pdfDoc.getPage(1), v1 = first.getViewport({ scale: 1 }); ratio = v1.height / v1.width;
        const baseW = () => Math.max(200, Math.min(body.clientWidth - 16, 900));
        const curW = () => Math.round(baseW() * ZOOMS[zi]);
        const pages = [];
        for(let i = 0; i < N; i++){
          const el = document.createElement("div"); el.className = "mv-pg"; el.dataset.i = i;
          const st = { el, gen: 0, done: false, busy: false, ratio };
          pages.push(st); body.appendChild(el);
        }
        const size = st => { const W = curW(); st.el.style.width = W + "px"; st.el.style.height = Math.round(W * st.ratio) + "px"; };
        const release = st => { st.gen++; st.done = false; st.busy = false; st.el.replaceChildren(); };
        async function draw(i){
          const st = pages[i]; if(st.done || st.busy) return;
          st.busy = true; const my = ++st.gen;
          try{
            const pg = await pdfDoc.getPage(i + 1), vp0 = pg.getViewport({ scale: 1 }), W = curW();
            st.ratio = vp0.height / vp0.width; size(st);
            let sc = (W / vp0.width) * Math.min(window.devicePixelRatio || 1, 2);
            sc = Math.min(sc, Math.sqrt(12e6 / (vp0.width * vp0.height)));          // tope de memoria en celulares
            const vp = pg.getViewport({ scale: sc }), cv = document.createElement("canvas");
            cv.width = Math.floor(vp.width); cv.height = Math.floor(vp.height);
            await pg.render({ canvasContext: cv.getContext("2d"), canvas: cv, viewport: vp }).promise;
            if(closed || st.gen !== my) return;
            const tag = document.createElement("span"); tag.className = "mv-pn"; tag.textContent = (i + 1) + " / " + N;
            st.el.replaceChildren(cv, tag); st.done = true;
          } catch(e){ if(!closed && st.gen === my) console.warn("página " + (i + 1), e); }
          if(st.gen === my) st.busy = false;
        }
        io = new IntersectionObserver(es => es.forEach(e => { const i = +e.target.dataset.i; e.isIntersecting ? draw(i) : release(pages[i]); }), { root: body, rootMargin: "900px 0px" });
        const relayout = () => {
          const frac = body.scrollHeight ? (body.scrollTop + body.clientHeight / 2) / body.scrollHeight : 0;
          pages.forEach(st => { release(st); size(st); io.unobserve(st.el); });
          body.scrollTop = frac * body.scrollHeight - body.clientHeight / 2;
          pages.forEach(st => io.observe(st.el));
          overlay.querySelector("#mv-zl").textContent = Math.round(ZOOMS[zi] * 100) + "%";
        };
        pages.forEach(st => { size(st); });
        pages.forEach(st => io.observe(st.el));
        overlay.querySelector(".mv-zt").hidden = false;
        overlay.querySelector("#mv-zi").onclick = () => { if(zi < ZOOMS.length - 1){ zi++; relayout(); } };
        overlay.querySelector("#mv-zo").onclick = () => { if(zi > 0){ zi--; relayout(); } };
        let lastW = body.clientWidth, tmr;
        onResize = () => { clearTimeout(tmr); tmr = setTimeout(() => { if(Math.abs(body.clientWidth - lastW) > 4){ lastW = body.clientWidth; relayout(); } }, 250); };
        window.addEventListener("resize", onResize);
      }catch(e){
        console.warn(e);
        if(!closed) body.innerHTML = `<div class="mv-msg"><p class="err">No se pudo abrir el archivo: ${esc(e.message)}</p></div>`;
      }
    },

    deleteLocalFile
  };
})();