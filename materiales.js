/* materiales.js — Carga directa de PDFs e imágenes por Escuela/Curso sin enlaces externos */
(function(){
  const CHUNK_SIZE = 700000; // ~700 KB por bloque en Firestore (evita límite de 1 MB por doc)

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
      type: file.type || "application/pdf",
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
      type: file.type || "application/pdf",
      size: file.size
    };
  }

  async function loadLocalFile(db, fileId){
    const metaSnap = await db.collection("archivos_aula").doc(fileId).get();
    if(!metaSnap.exists) throw new Error("El archivo ya no existe.");
    const meta = metaSnap.data();
    const chunksSnap = await db.collection("archivos_aula").doc(fileId).collection("chunks").get();
    const parts = new Array(meta.total);
    chunksSnap.forEach(doc => {
      const data = doc.data();
      parts[data.i] = data.d;
    });
    return { meta, dataUrl: parts.join("") };
  }

  async function deleteLocalFile(db, fileId){
    try{
      const chunksSnap = await db.collection("archivos_aula").doc(fileId).collection("chunks").get();
      const batch = db.batch();
      chunksSnap.forEach(d => batch.delete(d.ref));
      batch.delete(db.collection("archivos_aula").doc(fileId));
      await batch.commit();
    }catch(e){ console.warn("No se pudo limpiar archivo:", e); }
  }

  function dataUrlToBlobUrl(dataUrl){
    const [head, b64] = dataUrl.split(",");
    const mime = (head.match(/:(.*?);/) || [])[1] || "application/pdf";
    const bin = atob(b64);
    const arr = new Uint8Array(bin.length);
    for(let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return URL.createObjectURL(new Blob([arr], { type: mime }));
  }

  window.AulaMateriales = {
    openEditor(ctx, existingItem){
      const { db, user, scope, dlg, frm, esc, onSaved } = ctx;
      const it = existingItem || {};
      const keptFiles = Array.isArray(it.localFiles) ? [...it.localFiles] : [];

      frm.innerHTML = `
        <h3>${it.id ? "Editar material" : "Nuevo material para el curso"}</h3>
        <label>Título del material *</label>
        <input id="m-tit" required placeholder="Ej: Apunte de Ecuaciones + Guía práctica" value="${esc(it.title || "")}">
        <div class="row">
          <div>
            <label>Tema / Unidad</label>
            <input id="m-top" placeholder="Ej: Números Racionales" value="${esc(it.topic || "")}">
          </div>
          <div>
            <label>Fecha</label>
            <input id="m-dt" type="date" value="${esc(it.date || new Date().toISOString().slice(0,10))}">
          </div>
        </div>
        <label>Descripción o indicaciones para los alumnos</label>
        <textarea id="m-desc" placeholder="Explicá qué contiene el archivo o qué páginas tienen que leer...">${esc(it.description || "")}</textarea>

        <label>Adjuntar archivos PDF o imágenes desde tu dispositivo</label>
        <input id="m-files" type="file" accept=".pdf,application/pdf,image/*" multiple>
        <p class="note">Se guardan directamente en el aula (sin usar Google Drive). Máximo recomendado: 12 MB por archivo.</p>

        <div id="m-kept" style="margin-top:10px"></div>
        <div class="err" id="m-err"></div>
        <div class="acts">
          <button type="button" class="btn" id="m-save">Guardar material</button>
          <button type="button" class="btn soft" id="m-cancel">Cancelar</button>
        </div>
      `;

      const keptBox = frm.querySelector("#m-kept");
      const renderKept = () => {
        if(!keptFiles.length){ keptBox.innerHTML = ""; return; }
        keptBox.innerHTML = `<b style="font-size:.85rem">Archivos ya cargados:</b>` + keptFiles.map((f, idx) => `
          <div class="share-row">
            <span>📄 ${esc(f.name)} <small>(${Math.round((f.size||0)/1024)} KB)</small></span>
            <button type="button" class="btn del" data-rm="${idx}" style="padding:4px 10px;font-size:.8rem">Quitar</button>
          </div>
        `).join("");
        keptBox.querySelectorAll("[data-rm]").forEach(b => {
          b.onclick = () => { keptFiles.splice(+b.dataset.rm, 1); renderKept(); };
        });
      };
      renderKept();

      frm.querySelector("#m-cancel").onclick = () => dlg.close();
      frm.querySelector("#m-save").onclick = async () => {
        const title = frm.querySelector("#m-tit").value.trim();
        const err = frm.querySelector("#m-err");
        if(!title){ err.textContent = "Escribí un título para el material."; return; }

        const inputFiles = Array.from(frm.querySelector("#m-files").files || []);
        for(const f of inputFiles){
          if(f.size > 15 * 1024 * 1024){
            err.textContent = `El archivo "${f.name}" supera los 15 MB.`;
            return;
          }
        }

        const btn = frm.querySelector("#m-save");
        btn.disabled = true;
        err.textContent = "";

        try{
          const uploaded = [];
          for(let i = 0; i < inputFiles.length; i++){
            btn.textContent = `Subiendo ${i + 1} de ${inputFiles.length}…`;
            const meta = await saveLocalFile(db, user.uid, inputFiles[i]);
            uploaded.push(meta);
          }

          btn.textContent = "Guardando…";
          const payload = {
            kind: "materials",
            title,
            topic: frm.querySelector("#m-top").value.trim(),
            date: frm.querySelector("#m-dt").value,
            description: frm.querySelector("#m-desc").value.trim(),
            localFiles: [...keptFiles, ...uploaded],
            updatedAt: Date.now()
          };

          const col = db.collection("schools").doc(scope.schoolId)
                        .collection("courses").doc(scope.courseId)
                        .collection("items");

          if(it.id){
            await col.doc(it.id).update(payload);
          }else{
            payload.createdAt = Date.now();
            await col.add(payload);
          }
          dlg.close();
          if(onSaved) onSaved();
        }catch(e){
          err.textContent = "Error al guardar: " + (e.message || e);
          btn.disabled = false;
          btn.textContent = "Guardar material";
        }
      };

      dlg.showModal();
    },

    async openViewer(db, fileId, fileName){
      const overlay = document.createElement("dialog");
      overlay.style.cssText = "width:min(96vw,960px);height:90vh;padding:14px;border-radius:18px";
      overlay.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding-bottom:10px;border-bottom:1.5px solid var(--bd)">
          <b style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">📄 ${fileName}</b>
          <div style="display:flex;gap:8px">
            <a id="mv-dl" class="btn soft" download="${fileName}" style="text-decoration:none;display:none">⬇ Descargar</a>
            <button type="button" class="btn del" id="mv-cl">Cerrar</button>
          </div>
        </div>
        <div id="mv-body" style="height:calc(100% - 54px);display:grid;place-items:center;padding-top:10px">
          <p>Cargando archivo…</p>
        </div>
      `;
      document.body.appendChild(overlay);
      overlay.showModal();

      let blobUrl = "";
      const close = () => {
        if(blobUrl) URL.revokeObjectURL(blobUrl);
        overlay.close();
        overlay.remove();
      };
      overlay.querySelector("#mv-cl").onclick = close;
      overlay.addEventListener("close", () => { if(blobUrl) URL.revokeObjectURL(blobUrl); overlay.remove(); });

      try{
        const { meta, dataUrl } = await loadLocalFile(db, fileId);
        blobUrl = dataUrlToBlobUrl(dataUrl);
        const dl = overlay.querySelector("#mv-dl");
        dl.href = blobUrl;
        dl.style.display = "inline-flex";

        const body = overlay.querySelector("#mv-body");
        if((meta.type || "").startsWith("image/")){
          body.innerHTML = `<img src="${blobUrl}" style="max-width:100%;max-height:100%;object-fit:contain;border-radius:10px">`;
        }else{
          body.innerHTML = `<iframe src="${blobUrl}" style="width:100%;height:100%;border:0;border-radius:10px;background:#fff"></iframe>`;
        }
      }catch(e){
        overlay.querySelector("#mv-body").innerHTML = `<p class="err">No se pudo abrir el archivo: ${e.message}</p>`;
      }
    },

    deleteLocalFile
  };
})();