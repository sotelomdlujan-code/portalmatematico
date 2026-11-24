/* entregas.js — Los alumnos entregan la tarea con fotos o archivos; la profesora las revisa.
   - Las entregas se guardan en courses/{curso}/entregas/{id} y sus partes en .../chunks (solo las lee la profesora).
   - Las fotos se achican solas antes de subirse (máx. 1600 px, JPEG): una foto del celular pasa de ~4 MB a ~300 KB.
   - Depende de materiales.js (visor y caché) y de las reglas nuevas de firestore.rules. */
(function(){
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const fmt = ts => { if(!ts) return ""; const d = new Date(ts); return d.toLocaleDateString("es-AR", {day:"2-digit", month:"2-digit"}) + " " + d.toLocaleTimeString("es-AR", {hour:"2-digit", minute:"2-digit"}); };
  const kb = n => n >= 1048576 ? (n / 1048576).toFixed(1).replace(".", ",") + " MB" : Math.max(1, Math.round(n / 1024)) + " KB";
  const ico = f => typeof fileIco === "function" ? fileIco(f) : "📄";

  const MAX_FILES = 6, MAX_MB = 8, MAX_SIDE = 1600;
  const BS = 3 * Math.floor(700000 / 4);                 // 524.997 bytes → cada parte en base64 mide 699.996 caracteres (< 700.000)
  const ACCEPT = "image/*,.pdf,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.odt,.txt";
  const MIMES = {pdf:"application/pdf", doc:"application/msword", docx:"application/vnd.openxmlformats-officedocument.wordprocessingml.document", xls:"application/vnd.ms-excel",
    xlsx:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", ppt:"application/vnd.ms-powerpoint", pptx:"application/vnd.openxmlformats-officedocument.presentationml.presentation",
    odt:"application/vnd.oasis.opendocument.text", txt:"text/plain", png:"image/png", jpg:"image/jpeg", jpeg:"image/jpeg", gif:"image/gif", webp:"image/webp"};
  const mimeOf = f => f.type || MIMES[(String(f.name || "").split(".").pop() || "").toLowerCase()] || "application/octet-stream";

  const ST = {};            // estado de cada tarea (archivos elegidos, nombre, comentario…): sobrevive a que la pantalla se redibuje
  const CTX = {};
  let cssDone = false;
  function css(){
    if(cssDone) return; cssDone = true;
    const st = document.createElement("style");
    st.textContent = `
.ent-box{margin-top:18px;padding:14px 16px;border:1.5px dashed var(--bd);border-radius:14px;background:var(--sf2)}
.ent-box h4{margin:0 0 6px;font:700 1rem var(--fb)}
.ent-btns{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0 4px}
.ent-btns .btn{display:inline-flex;align-items:center;gap:6px;cursor:pointer;min-height:44px}
.ent-in{position:absolute;width:1px;height:1px;opacity:0;overflow:hidden;pointer-events:none}
.ent-files{margin:8px 0}
.ent-f{display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid var(--bd)}
.ent-f img,.ent-f .ent-ic{width:48px;height:48px;flex:none;border-radius:8px;object-fit:cover;background:var(--sf);display:grid;place-items:center;font-size:1.5rem}
.ent-f span{flex:1;min-width:0;overflow-wrap:anywhere;font-size:.9rem}.ent-f small{color:var(--mu)}
.ent-ok{background:var(--materials-bg);color:var(--materials-ink);border-radius:10px;padding:8px 12px;margin:8px 0;font-weight:600;font-size:.92rem}
.ent-prog{height:10px;border:1px solid var(--bd);border-radius:10px;overflow:hidden;background:var(--sf);margin:8px 0 2px}.ent-prog i{display:block;height:100%;background:var(--ac);transition:width .2s}
.ent-card{border:1px solid var(--bd);border-radius:12px;padding:10px 14px;margin:8px 0;background:var(--sf)}
.ent-card .ent-h{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;align-items:baseline}
.ent-card .files{margin-top:10px}
@media (max-width:760px){.ent-btns .btn{flex:1 1 100%;justify-content:center}.ent-box{padding:12px}}
`;
    document.head.appendChild(st);
  }

  /* ---------- fotos: se achican antes de subir ---------- */
  async function shrink(file){
    if(!/^image\/(jpeg|png|webp)$/.test(file.type)) return file;
    if(file.type === "image/jpeg" && file.size < 250 * 1024) return file;
    try{
      const bmp = await createImageBitmap(file, {imageOrientation:"from-image"});
      const sc = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height)), w = Math.round(bmp.width * sc), h = Math.round(bmp.height * sc);
      const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
      const cx = cv.getContext("2d"); cx.fillStyle = "#fff"; cx.fillRect(0, 0, w, h); cx.drawImage(bmp, 0, 0, w, h); if(bmp.close) bmp.close();
      const blob = await new Promise(r => cv.toBlob(r, "image/jpeg", 0.82));
      if(!blob || blob.size >= file.size) return file;
      return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", {type:"image/jpeg"});
    }catch(e){ return file; }                  // formatos que el navegador no sabe leer (p. ej. HEIC): se sube tal cual
  }
  const b64 = async blob => { const u = new Uint8Array(await blob.arrayBuffer()); let s = ""; for(let i = 0; i < u.length; i += 32768) s += String.fromCharCode.apply(null, u.subarray(i, i + 32768)); return btoa(s); };

  const colOf = (db, courseId) => db.collection("courses").doc(courseId).collection("entregas");

  /* ---------- borrado (profesora) ---------- */
  async function deleteOne(db, courseId, eid){
    const ref = colOf(db, courseId).doc(eid), cs = await ref.collection("chunks").get();
    for(let a = 0; a < cs.docs.length; a += 400){ const b = db.batch(); cs.docs.slice(a, a + 400).forEach(d => b.delete(d.ref)); await b.commit(); }
    await ref.delete();
  }
  async function deleteForTask(db, courseId, taskId){
    const sn = await colOf(db, courseId).where("taskId", "==", taskId).get();
    for(const d of sn.docs) await deleteOne(db, courseId, d.id);
  }
  async function deleteAll(db, courseId){
    const sn = await colOf(db, courseId).get();
    for(const d of sn.docs) await deleteOne(db, courseId, d.id);
  }

  /* ---------- alumno ---------- */
  function repaint(tid){
    const host = document.querySelector('.ent-host[data-task="' + CSS.escape(tid) + '"]');
    if(host && CTX[tid]) mountStudent(host, CTX[tid]);
  }
  function mountStudent(host, ctx){
    css(); CTX[ctx.task.id] = ctx;
    const tid = ctx.task.id, s = ST[tid] || (ST[tid] = {files:[], name: (function(){ try{ return localStorage.getItem("aula_alumno_nombre") || ""; }catch(e){ return ""; } })(), comment:"", pin:"", busy:false, pct:0, msg:"", err:""});
    const key = "aula_entrega_" + ctx.courseId + "_" + tid;
    let done = null; try{ done = JSON.parse(localStorage.getItem(key) || "null"); }catch(e){}
    const needPin = !!ctx.coursePin && !ctx.pin;
    host.innerHTML = `<div class="ent-box">
      <h4>📤 Entregar mi tarea</h4>
      ${done ? `<div class="ent-ok">✅ Entregaste esta tarea el ${esc(fmt(done.at))} (${done.n} archivo${done.n === 1 ? "" : "s"}). Si querés, podés volver a entregarla.</div>` : `<p class="note" style="margin:0">Sacale una foto a tu trabajo o subí el archivo. Tu profesora lo va a ver en su panel.</p>`}
      <label>Tu nombre y apellido *</label><input class="ent-name" maxlength="60" value="${esc(s.name)}" placeholder="Ej: Lucas Gómez" ${s.busy ? "disabled" : ""}>
      ${needPin ? `<label>Clave del aula *</label><input class="ent-pin" type="password" value="${esc(s.pin)}" ${s.busy ? "disabled" : ""}>` : ""}
      <label>Comentario (opcional)</label><textarea class="ent-com" maxlength="500" style="min-height:60px" placeholder="Ej: El ejercicio 4 no me salió." ${s.busy ? "disabled" : ""}>${esc(s.comment)}</textarea>
      <div class="ent-btns">
        <label class="btn soft">📷 Sacar foto<input class="ent-in ent-cam" type="file" accept="image/*" capture="environment" ${s.busy ? "disabled" : ""}></label>
        <label class="btn soft">📎 Elegir fotos o archivos<input class="ent-in ent-pick" type="file" accept="${ACCEPT}" multiple ${s.busy ? "disabled" : ""}></label>
      </div>
      <div class="ent-files">${s.files.map((f, i) => `<div class="ent-f">${f.url ? `<img src="${f.url}" alt="">` : `<div class="ent-ic">${ico({name:f.file.name, type:mimeOf(f.file)})}</div>`}<span>${esc(f.file.name)} <small>(${kb(f.file.size)})</small></span>${s.busy ? "" : `<button type="button" class="btn del" data-rm="${i}">✕</button>`}</div>`).join("")}</div>
      <p class="note" style="margin:0">Hasta ${MAX_FILES} archivos de ${MAX_MB} MB. Las fotos se achican solas para subir más rápido.</p>
      <div class="err ent-err">${esc(s.err)}</div>
      ${s.busy ? `<div class="ent-prog"><i style="width:${Math.round(s.pct * 100)}%"></i></div><div class="note">${esc(s.msg)}</div>` : `<div class="acts" style="margin-top:10px"><button type="button" class="btn ent-send" ${s.files.length ? "" : "disabled"}>Enviar tarea${s.files.length ? " (" + s.files.length + ")" : ""}</button></div>`}
      ${!s.busy && s.msg ? `<div class="ent-ok">${esc(s.msg)}</div>` : ""}
    </div>`;
    host.querySelector(".ent-name").oninput = e => { s.name = e.target.value; };
    host.querySelector(".ent-com").oninput = e => { s.comment = e.target.value; };
    const pin = host.querySelector(".ent-pin"); if(pin) pin.oninput = e => { s.pin = e.target.value; };
    const add = async input => {
      s.err = ""; s.msg = "";
      for(const f of Array.from(input.files || [])){
        if(s.files.length >= MAX_FILES){ s.err = `Solo podés entregar hasta ${MAX_FILES} archivos.`; break; }
        const g = await shrink(f);
        if(g.size > MAX_MB * 1048576){ s.err = `"${f.name}" pesa más de ${MAX_MB} MB.`; continue; }
        s.files.push({file:g, url: /^image\//.test(g.type) ? URL.createObjectURL(g) : ""});
      }
      input.value = ""; repaint(tid);
    };
    host.querySelector(".ent-cam").onchange = e => add(e.target);
    host.querySelector(".ent-pick").onchange = e => add(e.target);
    host.querySelectorAll("[data-rm]").forEach(b => b.onclick = () => { const r = s.files.splice(+b.dataset.rm, 1)[0]; if(r && r.url) URL.revokeObjectURL(r.url); s.err = ""; repaint(tid); });
    const send = host.querySelector(".ent-send"); if(send) send.onclick = () => submit(ctx);
  }

  async function submit(ctx){
    const tid = ctx.task.id, s = ST[tid]; if(s.busy) return;
    s.name = (s.name || "").trim(); const pin = ctx.pin || (s.pin || "").trim();
    if(!s.name){ s.err = "Escribí tu nombre y apellido."; return repaint(tid); }
    if(ctx.coursePin && pin !== ctx.coursePin){ s.err = "La clave del aula es incorrecta. Pedísela a tu profesora."; return repaint(tid); }
    if(!s.files.length){ s.err = "Elegí al menos una foto o un archivo."; return repaint(tid); }
    s.busy = true; s.pct = 0; s.err = ""; s.msg = "Preparando…"; repaint(tid);
    try{
      try{ localStorage.setItem("aula_alumno_nombre", s.name); }catch(e){}
      const col = colOf(ctx.db, ctx.courseId), ref = col.doc(), files = s.files.map(x => ({name:x.file.name, type:mimeOf(x.file), size:x.file.size, total:Math.max(1, Math.ceil(x.file.size / BS))}));
      const totalChunks = files.reduce((a, f) => a + f.total, 0); let sent = 0;
      await ref.set({taskId:tid, taskTitle:ctx.task.title || "", author:s.name, comment:(s.comment || "").trim(), pin, files, ok:false, createdAt:Date.now()});
      for(let f = 0; f < files.length; f++){
        const blob = s.files[f].file;
        for(let i = 0; i < files[f].total; i += 3){
          const b = ctx.db.batch();
          for(let j = i; j < Math.min(files[f].total, i + 3); j++) b.set(ref.collection("chunks").doc(f + "_" + j), {f, i:j, d: await b64(blob.slice(j * BS, (j + 1) * BS))});
          await b.commit(); sent = Math.min(totalChunks, sent + Math.min(3, files[f].total - i));
          s.pct = sent / totalChunks; s.msg = `Subiendo ${files[f].name} (${f + 1} de ${files.length})…`; repaint(tid);
        }
      }
      await ref.update({ok:true});
      try{ localStorage.setItem("aula_entrega_" + ctx.courseId + "_" + tid, JSON.stringify({at:Date.now(), n:files.length})); }catch(e){}
      s.files.forEach(x => x.url && URL.revokeObjectURL(x.url)); s.files = []; s.comment = ""; s.busy = false; s.msg = "¡Listo! Tu tarea fue enviada a la profesora."; s.err = "";
    }catch(e){
      console.warn(e); s.busy = false; s.msg = "";
      s.err = "No se pudo enviar. Revisá tu conexión y probá de nuevo (tus archivos siguen acá)." + (/permission|permiso/i.test(String(e && e.message)) ? " Si sigue fallando, pedile a tu profesora que revise que esta tarea reciba entregas." : "");
    }
    repaint(tid);
  }

  /* ---------- profesora ---------- */
  function mountTeacher(host, ctx){
    css(); const tid = ctx.task.id;
    host.innerHTML = `<div class="ent-box"><h4>📥 Entregas de los alumnos</h4>${ctx.task.recibe ? "" : `<p class="note" style="margin:0 0 8px">Esta tarea no recibe entregas desde el aula. Para activarlo: Editar → tildar “Los alumnos pueden entregar…”.</p>`}<button type="button" class="btn soft ent-load">Ver entregas</button><div class="ent-list"></div></div>`;
    const list = host.querySelector(".ent-list"), btn = host.querySelector(".ent-load");
    const load = async () => {
      btn.disabled = true; btn.textContent = "Cargando…"; list.innerHTML = "";
      try{
        const sn = await colOf(ctx.db, ctx.courseId).where("taskId", "==", tid).get();
        const all = sn.docs.map(d => ({id:d.id, ...d.data()})).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        const ok = all.filter(e => e.ok), bad = all.filter(e => !e.ok);
        btn.textContent = `Actualizar (${ok.length})`;
        list.innerHTML = (ok.length ? "" : `<p class="note">Todavía no hay entregas de esta tarea.</p>`) + ok.map(e => `<div class="ent-card"><div class="ent-h"><b>🙋 ${esc(e.author)}</b><small>${esc(fmt(e.createdAt))}</small></div>
          ${e.comment ? `<p style="margin:6px 0 0;white-space:pre-wrap">${esc(e.comment)}</p>` : ""}
          <div class="files">${(e.files || []).map((f, i) => `<button type="button" class="gdl" data-ef="${esc(e.id)}:${i}">${ico(f)} ${esc(f.name)}</button>`).join("")}</div>
          <div class="acts"><button type="button" class="btn del" data-ed="${esc(e.id)}">Borrar entrega</button></div></div>`).join("")
          + (bad.length ? `<p class="note">⚠️ ${bad.length} entrega${bad.length === 1 ? "" : "s"} incompleta${bad.length === 1 ? "" : "s"} (se cortó la subida). <button type="button" class="btn del" data-eb="1">Borrar ${bad.length === 1 ? "esa" : "esas"}</button></p>` : "");
        list.querySelectorAll("[data-ef]").forEach(b => b.onclick = () => {
          const [eid, idx] = [b.dataset.ef.slice(0, b.dataset.ef.lastIndexOf(":")), +b.dataset.ef.slice(b.dataset.ef.lastIndexOf(":") + 1)], e = ok.find(x => x.id === eid), f = e.files[idx];
          AulaMateriales.openViewer(ctx.db, null, f.name, {
            key: "e:" + eid + ":" + idx, format: "b64",
            async getMeta(){ return {...f, createdAt: e.createdAt}; },
            async getChunks(){ const cs = await colOf(ctx.db, ctx.courseId).doc(eid).collection("chunks").where("f", "==", idx).get(); const a = []; cs.forEach(d => a.push(d.data())); return a; }
          });
        });
        list.querySelectorAll("[data-ed]").forEach(b => b.onclick = async () => { if(!confirm("¿Borrar esta entrega? No se puede deshacer.")) return; b.disabled = true; try{ await deleteOne(ctx.db, ctx.courseId, b.dataset.ed); }catch(e){ alert("No se pudo borrar."); } load(); });
        list.querySelectorAll("[data-eb]").forEach(b => b.onclick = async () => { b.disabled = true; try{ for(const e of bad) await deleteOne(ctx.db, ctx.courseId, e.id); }catch(x){ alert("No se pudo borrar."); } load(); });
      }catch(e){ console.warn(e); list.innerHTML = `<div class="err">No se pudieron cargar las entregas. ¿Publicaste las reglas nuevas de Firestore? (${esc(e.message)})</div>`; btn.textContent = "Reintentar"; }
      btn.disabled = false;
    };
    btn.onclick = load;
  }

  window.AulaEntregas = {
    mount(host, ctx){ if(ctx.canEdit) mountTeacher(host, ctx); else mountStudent(host, ctx); },
    deleteForTask, deleteAll
  };
})();
