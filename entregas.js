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
.ent-h2{display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;align-items:center}
.ent-ros{margin:0 0 16px}
.ent-sum{margin:2px 0 10px}.ent-big{font:800 1.15rem var(--fb)}
.ent-chips{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}
.ent-st{display:inline-block;padding:2px 10px;border-radius:99px;font-size:.78rem;font-weight:700;border:1px solid var(--bd);background:var(--sf);color:var(--mu)}
.ent-st.st-vista{background:#fff4d6;color:#7a5600;border-color:#f0d58a}
.ent-st.st-corregida{background:var(--materials-bg);color:var(--materials-ink);border-color:transparent}
.ent-nm{padding:3px 10px;border-radius:99px;background:var(--sf);border:1px solid var(--bd);font-size:.85rem}
.ent-miss{border:1px solid var(--bd);border-radius:12px;padding:10px 14px;margin:10px 0;background:var(--sf)}
.ent-miss textarea{width:100%}
.ent-e{border-top:1px solid var(--bd);margin-top:8px;padding-top:4px}
.ent-un{margin:8px 0;padding:8px 10px;border-radius:10px;background:#fff4d6;color:#7a5600;font-size:.88rem}
.ent-un select{max-width:100%}
.ent-gr{margin-top:12px;padding-top:10px;border-top:2px solid var(--bd)}
.ent-gr-row{display:flex;gap:12px;flex-wrap:wrap}.ent-gr-row>div{flex:1 1 140px}
.ent-gr textarea{width:100%;min-height:70px}
.ent-nota{margin-top:12px}
.ent-res{margin:10px 0 0;padding:12px 14px;border-radius:12px;background:var(--sf);border:1px solid var(--bd)}
.ent-res .ent-nt{font:800 2rem var(--fb);line-height:1.1}
.ent-res p{margin:6px 0 0;white-space:pre-wrap}
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
  async function delDocs(docs){ for(let a = 0; a < docs.length; a += 400){ const b = docs[0].ref.firestore.batch(); docs.slice(a, a + 400).forEach(d => b.delete(d.ref)); await b.commit(); } }
  async function deleteForTask(db, courseId, taskId){
    const sn = await colOf(db, courseId).where("taskId", "==", taskId).get();
    for(const d of sn.docs) await deleteOne(db, courseId, d.id);
    const ns = await db.collection("courses").doc(courseId).collection("notas").where("taskId", "==", taskId).get();
    if(ns.size) await delDocs(ns.docs);
  }
  async function deleteAll(db, courseId){
    const sn = await colOf(db, courseId).get();
    for(const d of sn.docs) await deleteOne(db, courseId, d.id);
    const ns = await db.collection("courses").doc(courseId).collection("notas").get();
    if(ns.size) await delDocs(ns.docs);
    try{ await db.collection("courses").doc(courseId).collection("privado").doc("alumnos").delete(); }catch(e){}
    delete ROSTER[courseId];
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
    </div>
    <div class="ent-box ent-nota">
      <h4>📊 Ver mi nota</h4>
      <p class="note" style="margin:0">Escribí tu nombre y apellido igual que cuando entregaste.</p>
      <input class="ent-nn" maxlength="60" value="${esc(s.nname !== undefined ? s.nname : s.name)}" placeholder="Ej: Lucas Gómez">
      <div class="acts" style="margin-top:8px"><button type="button" class="btn soft ent-vn" ${s.nbusy ? "disabled" : ""}>${s.nbusy ? "Buscando…" : "Ver mi nota"}</button></div>
      ${s.nres ? resultHtml(s.nres) : ""}
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
    const nn = host.querySelector(".ent-nn"); nn.oninput = e => { s.nname = e.target.value; };
    host.querySelector(".ent-vn").onclick = async () => {
      s.nname = nn.value; const nm = (s.nname || "").trim();
      if(!nm){ s.nres = {err:"Escribí tu nombre y apellido."}; return repaint(tid); }
      s.nbusy = true; repaint(tid);
      try{
        const d = await notaRef(ctx.db, ctx.courseId, tid, nkey(nm)).get();
        s.nres = d.exists ? d.data() : {none:true};
      }catch(e){ console.warn(e); s.nres = {err:"No se pudo consultar. Revisá tu conexión y probá de nuevo."}; }
      s.nbusy = false; repaint(tid);
    };
  }
  function resultHtml(r){
    if(r.err) return `<div class="err">${esc(r.err)}</div>`;
    if(r.none) return `<div class="ent-res">Todavía no hay nada para ese nombre. Puede ser que tu profesora aún no haya visto tu entrega, o que el nombre no sea igual al que usaste al entregar.</div>`;
    if(r.estado === "corregida") return `<div class="ent-res"><small>Tu nota</small><div class="ent-nt">${esc(r.nota || "—")}</div>${r.devolucion ? `<p><b>Devolución de tu profesora:</b>\n${esc(r.devolucion)}</p>` : ""}</div>`;
    return `<div class="ent-res">👀 Tu profesora ya vio tu entrega. Todavía no está corregida.</div>`;
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

  /* ---------- lista de alumnos, notas y quién entregó ---------- */
  // Los nombres se comparan sin tildes, sin mayúsculas y sin importar el orden ("Gómez Lucas" = "lucas gomez").
  const norm = s => String(s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9 ]+/g, " ");
  const toks = s => norm(s).split(/\s+/).filter(Boolean);
  const nkey = s => toks(s).sort().join("-").slice(0, 90) || "x";
  const cref = (db, cid) => db.collection("courses").doc(cid);
  const notaRef = (db, cid, tid, key) => cref(db, cid).collection("notas").doc(tid + "__" + key);
  const rosterRef = (db, cid) => cref(db, cid).collection("privado").doc("alumnos");
  const ESTADOS = {sin:"Sin ver", vista:"Vista", corregida:"Corregida"};
  const ROSTER = {}, RELOAD = {}, OPENED = {};
  const fdate = iso => { try{ return new Date(iso + "T12:00:00").toLocaleDateString("es-AR", {day:"numeric", month:"numeric"}); }catch(e){ return iso; } };

  async function getRoster(db, cid){
    if(ROSTER[cid]) return ROSTER[cid];
    const s = await rosterRef(db, cid).get(), d = s.exists ? s.data() : {};
    return ROSTER[cid] = {lista: Array.isArray(d.lista) ? d.lista : [], alias: (d.alias && typeof d.alias === "object") ? d.alias : {}};
  }
  function parseRoster(text){
    const seen = new Set(), out = [];
    String(text || "").split(/\r?\n/).forEach(l => {
      const n = l.replace(/^\s*\d+\s*[.)\-–:]\s+/, "").replace(/\s+/g, " ").trim().slice(0, 80);
      if(!n) return; const k = nkey(n); if(seen.has(k)) return; seen.add(k); out.push(n);
    });
    return out.slice(0, 200);
  }
  // Devuelve la clave del alumno de la lista al que corresponde un nombre escrito en una entrega (o null).
  function matchRoster(author, R, rkeys){
    const k = nkey(author);
    if(R.alias[k] && rkeys.includes(R.alias[k])) return R.alias[k];
    if(rkeys.includes(k)) return k;
    const t = toks(author); if(!t.length) return null;
    const c = R.lista.filter(n => { const rt = toks(n); return t.every(x => rt.includes(x)) || rt.every(x => t.includes(x)); });   // "Lucas" ↔ "Lucas Gómez", si es único
    return c.length === 1 ? nkey(c[0]) : null;
  }
  const copyText = async (txt, ta) => {
    try{ await navigator.clipboard.writeText(txt); return true; }catch(e){}
    try{ ta.focus(); ta.select(); return document.execCommand("copy"); }catch(e){ return false; }
  };

  /* ---------- profesora: lista de alumnos del curso ---------- */
  function mountRoster(host, ctx){
    css();
    host.innerHTML = `<div class="ent-box ent-ros"><p class="note" style="margin:0">Cargando lista de alumnos…</p></div>`;
    const paint = R => {
      host.innerHTML = `<div class="ent-box ent-ros"><div class="ent-h2"><b>👥 Lista de alumnos del curso</b><button type="button" class="btn soft ent-re">${R.lista.length ? "Editar lista" : "Cargar lista"}</button></div>
        <p class="note" style="margin:6px 0 0">${R.lista.length ? `${R.lista.length} alumnos cargados. En cada tarea vas a ver cuántos entregaron y quiénes faltan.` : "Cargala una sola vez (un nombre por línea) y cada tarea te va a mostrar quién entregó y quién no."}</p><div class="ent-ed"></div></div>`;
      host.querySelector(".ent-re").onclick = () => {
        const ed = host.querySelector(".ent-ed");
        ed.innerHTML = `<label>Un alumno por línea (podés pegar la lista desde Excel o Classroom)</label><textarea class="ent-lt" style="min-height:170px" placeholder="Ana Pérez&#10;Lucas Gómez&#10;…">${esc(R.lista.join("\n"))}</textarea>
          <div class="acts" style="margin-top:8px"><button type="button" class="btn ent-rs">Guardar lista</button><button type="button" class="btn soft ent-rc">Cancelar</button></div><div class="err ent-rerr"></div>`;
        ed.querySelector(".ent-rc").onclick = () => paint(R);
        ed.querySelector(".ent-rs").onclick = async () => {
          const lista = parseRoster(ed.querySelector(".ent-lt").value), keys = new Set(lista.map(nkey)), alias = {};
          Object.keys(R.alias).forEach(a => { if(keys.has(R.alias[a])) alias[a] = R.alias[a]; });
          try{
            await rosterRef(ctx.db, ctx.courseId).set({lista, alias, updated:Date.now()});
            R.lista = lista; R.alias = alias; Object.values(RELOAD).forEach(f => f()); paint(R);
          }catch(e){ console.warn(e); ed.querySelector(".ent-rerr").textContent = "No se pudo guardar. ¿Publicaste las reglas nuevas de Firestore?"; }
        };
      };
    };
    getRoster(ctx.db, ctx.courseId).then(paint).catch(e => { console.warn(e); host.innerHTML = `<div class="ent-box"><div class="err">No se pudo leer la lista de alumnos. ¿Publicaste las reglas nuevas de Firestore? (${esc(e.message)})</div></div>`; });
  }

  /* ---------- profesora: entregas, notas y faltantes de una tarea ---------- */
  function mountTeacher(host, ctx){
    css(); const tid = ctx.task.id, det = host.closest("details");
    host.innerHTML = `<div class="ent-box"><h4>📥 Entregas de los alumnos</h4>${ctx.task.recibe ? "" : `<p class="note" style="margin:0 0 8px">Esta tarea no recibe entregas desde el aula. Para activarlo: Editar → tildar “Los alumnos pueden entregar…”.</p>`}<div class="ent-sum"></div><button type="button" class="btn soft ent-load">Ver entregas</button><div class="ent-list"></div></div>`;
    const list = host.querySelector(".ent-list"), btn = host.querySelector(".ent-load"), sum = host.querySelector(".ent-sum");
    let started = false, groups = [], R = {lista:[], alias:{}};

    const sumHtml = () => {
      const n = s => groups.filter(g => g.estado === s).length;
      const matched = groups.filter(g => g.rk).length;
      return (R.lista.length ? `<div class="ent-big">Entregaron ${matched} de ${R.lista.length}</div>` : `<div class="ent-big">${groups.length} entrega${groups.length === 1 ? "" : "s"}</div>`)
        + `<div class="ent-chips"><span class="ent-st st-sin">${n("sin")} sin ver</span><span class="ent-st st-vista">${n("vista")} vistas</span><span class="ent-st st-corregida">${n("corregida")} corregidas</span></div>`;
    };
    const persist = async (g, v) => {
      const b = ctx.db.batch(), now = Date.now();
      g.keys.forEach(k => b.set(notaRef(ctx.db, ctx.courseId, tid, k), {taskId:tid, author:g.name, estado:v.estado, nota:v.nota, devolucion:v.devolucion, updated:now}));
      await b.commit(); g.grade = {...v, updated:now}; g.estado = v.estado; sum.innerHTML = sumHtml();
    };
    const paintBadge = (card, g) => { const s = card.querySelector(".ent-h .ent-st"); s.className = "ent-st st-" + g.estado; s.textContent = ESTADOS[g.estado]; card.querySelector(".gr-es").value = g.estado; };

    const load = async () => {
      started = true; OPENED[tid] = true; btn.disabled = true; btn.textContent = "Cargando…"; list.innerHTML = "";
      try{
        const [Rr, sn, ns] = await Promise.all([getRoster(ctx.db, ctx.courseId), colOf(ctx.db, ctx.courseId).where("taskId", "==", tid).get(), cref(ctx.db, ctx.courseId).collection("notas").where("taskId", "==", tid).get()]);
        R = Rr;
        const all = sn.docs.map(d => ({id:d.id, ...d.data()})).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        const ok = all.filter(e => e.ok), bad = all.filter(e => !e.ok);
        const grades = {}; ns.forEach(d => { grades[d.id.slice(tid.length + 2)] = d.data(); });
        const rkeys = R.lista.map(nkey), by = {}; groups = [];
        ok.forEach(e => {
          const ak = nkey(e.author), rk = R.lista.length ? matchRoster(e.author, R, rkeys) : null, canon = rk || "~" + ak;
          let g = by[canon]; if(!g){ g = by[canon] = {rk, name: rk ? R.lista[rkeys.indexOf(rk)] : e.author, keys:[], entregas:[]}; groups.push(g); }
          if(!g.keys.includes(ak)) g.keys.push(ak); g.entregas.push(e);
        });
        groups.forEach(g => {
          let best = null; g.keys.forEach(k => { const x = grades[k]; if(x && (!best || (x.updated || 0) > (best.updated || 0))) best = x; });
          g.grade = best || {estado:"sin", nota:"", devolucion:""}; g.estado = ESTADOS[g.grade.estado] ? g.grade.estado : "sin";
        });
        const ORD = {sin:0, vista:1, corregida:2};
        groups.sort((a, b) => ORD[a.estado] - ORD[b.estado] || (b.entregas[0].createdAt || 0) - (a.entregas[0].createdAt || 0));
        const missing = R.lista.filter((n, i) => !by[rkeys[i]]);
        const free = R.lista.map((n, i) => ({n, k:rkeys[i]})).filter(x => !by[x.k]);       // alumnos de la lista sin ninguna entrega (para asignar nombres mal escritos)
        btn.textContent = `Actualizar (${ok.length})`; sum.innerHTML = sumHtml();

        const url = location.origin + location.pathname + "?c=" + ctx.courseId, d = ctx.task.entrega, hoy = new Date().toLocaleDateString("en-CA");
        const msg = `Hola 👋 Todavía no recibí la tarea “${ctx.task.title || ""}”${d ? (d < hoy ? ` (era para el ${fdate(d)})` : ` (se entrega el ${fdate(d)})`) : ""}.\n\nFaltan entregar:\n${missing.map(n => "• " + n).join("\n")}\n\nLa pueden entregar desde el aula (foto o archivo): ${url}\n¡Gracias!`;

        const card = (g, i) => `<div class="ent-card" data-gi="${i}"><div class="ent-h"><b>🙋 ${esc(g.name)}</b><span><span class="ent-st st-${g.estado}">${ESTADOS[g.estado]}</span> <small>${esc(fmt(g.entregas[0].createdAt))}${g.entregas.length > 1 ? ` · ${g.entregas.length} entregas` : ""}</small></span></div>
          ${R.lista.length && !g.rk ? `<div class="ent-un">⚠️ Este nombre no está en tu lista. ${free.length ? `<select class="as-sel">${free.map((x, j) => `<option value="${j}">${esc(x.n)}</option>`).join("")}</select> <button type="button" class="btn soft as-bt">Es este alumno</button>` : ""}</div>` : ""}
          ${g.entregas.map(e => `<div class="ent-e">${g.entregas.length > 1 ? `<small>${esc(fmt(e.createdAt))}</small>` : ""}${e.comment ? `<p style="margin:6px 0 0;white-space:pre-wrap">${esc(e.comment)}</p>` : ""}
            <div class="files">${(e.files || []).map((f, k) => `<button type="button" class="gdl" data-ef="${esc(e.id)}:${k}">${ico(f)} ${esc(f.name)}</button>`).join("")}</div>
            <div class="acts"><button type="button" class="btn del" data-ed="${esc(e.id)}">Borrar entrega</button></div></div>`).join("")}
          <div class="ent-gr"><div class="ent-gr-row"><div><label>Estado</label><select class="gr-es">${Object.keys(ESTADOS).map(k => `<option value="${k}" ${k === g.estado ? "selected" : ""}>${ESTADOS[k]}</option>`).join("")}</select></div><div><label>Nota</label><input class="gr-no" maxlength="20" placeholder="Ej: 8" value="${esc(g.grade.nota || "")}"></div></div>
            <label>Devolución para el alumno</label><textarea class="gr-de" maxlength="1000" placeholder="Ej: Muy bien. Revisá el ejercicio 4: el signo cambia al pasar restando.">${esc(g.grade.devolucion || "")}</textarea>
            <div class="acts"><button type="button" class="btn gr-sv">Guardar nota</button><span class="note gr-ms"></span></div></div></div>`;

        list.innerHTML = (missing.length ? `<div class="ent-miss"><b>Faltan entregar (${missing.length}):</b><div class="ent-chips">${missing.map(n => `<span class="ent-nm">${esc(n)}</span>`).join("")}</div>
            <label>Mensaje para copiar y mandar</label><textarea class="ent-msg" style="min-height:150px">${esc(msg)}</textarea><div class="acts"><button type="button" class="btn soft ent-cp">📋 Copiar mensaje</button><span class="note ent-cpm"></span></div></div>` : (R.lista.length ? `<div class="ent-ok">🎉 Entregaron todos los de la lista.</div>` : `<p class="note">Cargá la lista de alumnos (arriba de las tareas) para ver también quiénes faltan.</p>`))
          + (ok.length ? "" : `<p class="note">Todavía no hay entregas de esta tarea.</p>`) + groups.map(card).join("")
          + (bad.length ? `<p class="note">⚠️ ${bad.length} entrega${bad.length === 1 ? "" : "s"} incompleta${bad.length === 1 ? "" : "s"} (se cortó la subida). <button type="button" class="btn del" data-eb="1">Borrar ${bad.length === 1 ? "esa" : "esas"}</button></p>` : "");

        const cp = list.querySelector(".ent-cp");
        if(cp) cp.onclick = async () => { const ta = list.querySelector(".ent-msg"), m = list.querySelector(".ent-cpm"); m.textContent = (await copyText(ta.value, ta)) ? "¡Copiado!" : "Seleccioná el texto y copialo."; };

        list.querySelectorAll(".ent-card").forEach(c => {
          const g = groups[+c.dataset.gi], es = c.querySelector(".gr-es"), no = c.querySelector(".gr-no"), de = c.querySelector(".gr-de"), ms = c.querySelector(".gr-ms"), sv = c.querySelector(".gr-sv");
          let touched = false; es.onchange = () => { touched = true; };
          const auto = () => { if(!touched && es.value !== "corregida"){ es.value = "corregida"; } };         // si escribís nota o devolución, pasa a “Corregida” (podés cambiarlo)
          no.oninput = auto; de.oninput = auto;
          sv.onclick = async () => {
            sv.disabled = true; ms.textContent = "Guardando…";
            try{ await persist(g, {estado: es.value, nota: no.value.trim(), devolucion: de.value.trim()}); paintBadge(c, g); ms.textContent = "✅ Guardado"; }
            catch(e){ console.warn(e); ms.textContent = "No se pudo guardar. ¿Publicaste las reglas nuevas de Firestore?"; }
            sv.disabled = false;
          };
          const ab = c.querySelector(".as-bt");
          if(ab) ab.onclick = async () => {
            const x = free[+c.querySelector(".as-sel").value]; if(!x) return; ab.disabled = true;
            try{ g.keys.forEach(k => { R.alias[k] = x.k; }); await rosterRef(ctx.db, ctx.courseId).set({lista:R.lista, alias:R.alias, updated:Date.now()}); load(); }
            catch(e){ console.warn(e); alert("No se pudo guardar."); ab.disabled = false; }
          };
          c.querySelectorAll("[data-ef]").forEach(b => b.onclick = () => {
            const [eid, idx] = [b.dataset.ef.slice(0, b.dataset.ef.lastIndexOf(":")), +b.dataset.ef.slice(b.dataset.ef.lastIndexOf(":") + 1)], e = ok.find(z => z.id === eid), f = e.files[idx];
            if(g.estado === "sin") persist(g, {estado:"vista", nota:g.grade.nota || "", devolucion:g.grade.devolucion || ""}).then(() => paintBadge(c, g)).catch(() => {});   // al abrir una entrega pasa a “Vista”
            AulaMateriales.openViewer(ctx.db, null, f.name, {
              key: "e:" + eid + ":" + idx, format: "b64",
              async getMeta(){ return {...f, createdAt: e.createdAt}; },
              async getChunks(){ const cs = await colOf(ctx.db, ctx.courseId).doc(eid).collection("chunks").where("f", "==", idx).get(); const a = []; cs.forEach(q => a.push(q.data())); return a; }
            });
          });
        });
        list.querySelectorAll("[data-ed]").forEach(b => b.onclick = async () => { if(!confirm("¿Borrar esta entrega? No se puede deshacer.")) return; b.disabled = true; try{ await deleteOne(ctx.db, ctx.courseId, b.dataset.ed); }catch(e){ alert("No se pudo borrar."); } load(); });
        list.querySelectorAll("[data-eb]").forEach(b => b.onclick = async () => { b.disabled = true; try{ for(const e of bad) await deleteOne(ctx.db, ctx.courseId, e.id); }catch(x){ alert("No se pudo borrar."); } load(); });
      }catch(e){ console.warn(e); list.innerHTML = `<div class="err">No se pudieron cargar las entregas. ¿Publicaste las reglas nuevas de Firestore? (${esc(e.message)})</div>`; btn.textContent = "Reintentar"; started = false; }
      btn.disabled = false;
    };
    btn.onclick = () => { delete ROSTER[ctx.courseId]; load(); };
    RELOAD[tid] = () => { if(host.isConnected && started) load(); };
    if(ctx.task.recibe){
      if(det) det.addEventListener("toggle", () => { if(det.open && !started) load(); });
      if(OPENED[tid] || (det && det.open)) load();                        // al abrir la tarea, o si ya estaba abierta, se cargan solas
    }
  }

  window.AulaEntregas = {
    mount(host, ctx){ if(ctx.canEdit) mountTeacher(host, ctx); else mountStudent(host, ctx); },
    mountRoster,
    deleteForTask, deleteAll
  };
})();
