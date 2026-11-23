/* consultas.js — Muro de consultas y respuestas en courses/{courseId}/consultas */
(function(){
  function esc(s){
    return String(s ?? "").replace(/[&<>"']/g, c => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
    }[c]));
  }

  function fmtDate(ts){
    if(!ts) return "";
    const d = new Date(ts);
    return d.toLocaleDateString("es-AR", { day:"2-digit", month:"2-digit" }) + " " +
           d.toLocaleTimeString("es-AR", { hour:"2-digit", minute:"2-digit" });
  }

  window.AulaConsultas = {
    async render(ctx){
      const { main, db, canReply, courseId, schoolName, courseName } = ctx;
      const colRef = db.collection("courses").doc(courseId).collection("consultas");
      const savedName = localStorage.getItem("aula_alumno_nombre") || "";

      main.innerHTML = `
        <div class="top">
          <h2>Consultas — ${esc(courseName || "Curso")}</h2>
        </div>
        <p class="lead">Espacio de preguntas y respuestas de <b>${esc(schoolName || "")}</b>. Los alumnos dejan sus dudas sobre los temas o tareas y la profesora responde aquí mismo.</p>

        <div class="gd-box" style="border-top-color:var(--ac)">
          <h3 style="margin:0 0 8px;font:700 1.15rem var(--fd);color:var(--ac)">✍️ Dejar una consulta a la profesora</h3>
          <div class="row">
            <div>
              <label style="margin-top:4px">Tu nombre y apellido *</label>
              <input id="q-author" placeholder="Ej: Lucas Gómez" value="${esc(savedName)}">
            </div>
            <div>
              <label style="margin-top:4px">Tema o trabajo (opcional)</label>
              <input id="q-topic" placeholder="Ej: Trabajo Práctico N° 2 / Fracciones">
            </div>
          </div>
          <label>Tu consulta *</label>
          <textarea id="q-text" placeholder="Escribí acá tu duda con el mayor detalle posible…"></textarea>
          <div class="err" id="q-err"></div>
          <div class="acts" style="margin-top:12px">
            <button type="button" class="btn" id="q-send">Enviar consulta</button>
          </div>
        </div>

        <div id="q-list"><div class="empty"><div class="big">Cargando consultas…</div></div></div>
      `;

      const listBox = main.querySelector("#q-list");

      const loadList = async () => {
        try{
          const snap = await colRef.orderBy("createdAt", "desc").limit(100).get();
          if(snap.empty){
            listBox.innerHTML = `
              <div class="empty">
                <div class="big">Todavía no hay consultas en este curso</div>
                <p>Cuando un alumno escriba una duda arriba, aparecerá acá para poder responderle.</p>
              </div>`;
            return;
          }

          let html = "";
          snap.forEach(doc => {
            const q = doc.data();
            const hasReply = Boolean(q.reply && q.reply.trim());
            html += `
              <div class="item" style="border-left-color:${hasReply ? "var(--materials-ink)" : "var(--tasks-ink)"}">
                <div style="padding:16px 20px">
                  <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;flex-wrap:wrap">
                    <div>
                      <strong style="font:700 1.05rem var(--fd)">🙋 ${esc(q.author || "Alumno/a")}</strong>
                      ${q.topic ? `<span class="chip" style="margin-left:6px">${esc(q.topic)}</span>` : ""}
                    </div>
                    <div style="display:flex;gap:6px;align-items:center">
                      <span class="chip" style="${hasReply
                        ? "background:var(--materials-bg);color:var(--materials-ink);border-color:var(--materials-hl)"
                        : "background:var(--tasks-bg);color:var(--tasks-ink);border-color:var(--tasks-hl)"}">
                        ${hasReply ? "✓ Respondida" : "⏳ Pendiente"}
                      </span>
                      <small style="color:var(--mu)">${fmtDate(q.createdAt)}</small>
                    </div>
                  </div>

                  <p style="margin:10px 0 0;white-space:pre-wrap">${esc(q.question)}</p>

                  ${hasReply ? `
                    <div style="margin-top:14px;padding:12px 16px;border-radius:14px;background:var(--materials-bg);border:1.5px solid var(--materials-hl)">
                      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
                        <b style="color:var(--materials-ink);font-size:.9rem">👩‍🏫 Respuesta de la profesora</b>
                        <small style="color:var(--materials-ink);opacity:.8">${fmtDate(q.repliedAt)}</small>
                      </div>
                      <p style="margin:6px 0 0;white-space:pre-wrap;color:var(--tx)">${esc(q.reply)}</p>
                    </div>
                  ` : ""}

                  ${canReply ? `
                    <div class="acts" style="margin-top:12px">
                      <button type="button" class="btn soft" data-reply="${doc.id}">${hasReply ? "✏️ Editar respuesta" : "💬 Responder"}</button>
                      <button type="button" class="btn del" data-del="${doc.id}">Borrar</button>
                    </div>
                    <div id="rbox-${doc.id}" style="display:none;margin-top:12px;padding-top:12px;border-top:1px dashed var(--bd)">
                      <textarea id="rtxt-${doc.id}" placeholder="Escribí tu respuesta para el alumno...">${esc(q.reply || "")}</textarea>
                      <div class="acts" style="margin-top:8px">
                        <button type="button" class="btn" data-rsave="${doc.id}">Publicar respuesta</button>
                        <button type="button" class="btn soft" data-rcancel="${doc.id}">Cancelar</button>
                      </div>
                    </div>
                  ` : ""}
                </div>
              </div>
            `;
          });

          listBox.innerHTML = html;

          if(canReply){
            listBox.querySelectorAll("[data-reply]").forEach(btn => {
              btn.onclick = () => {
                const box = listBox.querySelector("#rbox-" + btn.dataset.reply);
                box.style.display = box.style.display === "none" ? "block" : "none";
              };
            });
            listBox.querySelectorAll("[data-rcancel]").forEach(btn => {
              btn.onclick = () => {
                listBox.querySelector("#rbox-" + btn.dataset.rcancel).style.display = "none";
              };
            });
            listBox.querySelectorAll("[data-rsave]").forEach(btn => {
              btn.onclick = async () => {
                const id = btn.dataset.rsave;
                const reply = listBox.querySelector("#rtxt-" + id).value.trim();
                btn.disabled = true;
                btn.textContent = "Guardando…";
                await colRef.doc(id).update({
                  reply,
                  repliedAt: reply ? Date.now() : null
                });
                loadList();
              };
            });
            listBox.querySelectorAll("[data-del]").forEach(btn => {
              btn.onclick = async () => {
                if(!confirm("¿Borrar esta consulta?")) return;
                await colRef.doc(btn.dataset.del).delete();
                loadList();
              };
            });
          }
        }catch(e){
          listBox.innerHTML = `<div class="err">No se pudieron cargar las consultas: ${esc(e.message)}</div>`;
        }
      };

      main.querySelector("#q-send").onclick = async () => {
        const author = main.querySelector("#q-author").value.trim();
        const topic = main.querySelector("#q-topic").value.trim();
        const question = main.querySelector("#q-text").value.trim();
        const err = main.querySelector("#q-err");

        if(!author){ err.textContent = "Por favor, escribí tu nombre."; return; }
        if(!question){ err.textContent = "Escribí tu consulta antes de enviar."; return; }

        const btn = main.querySelector("#q-send");
        btn.disabled = true;
        btn.textContent = "Enviando…";
        err.textContent = "";

        try{
          localStorage.setItem("aula_alumno_nombre", author);
          await colRef.add({
            author,
            topic,
            question,
            reply: "",
            createdAt: Date.now()
          });
          main.querySelector("#q-text").value = "";
          main.querySelector("#q-topic").value = "";
          btn.disabled = false;
          btn.textContent = "Enviar consulta";
          loadList();
        }catch(e){
          err.textContent = "No se pudo enviar la consulta: " + (e.message || e);
          btn.disabled = false;
          btn.textContent = "Enviar consulta";
        }
      };

      loadList();
    }
  };
})();