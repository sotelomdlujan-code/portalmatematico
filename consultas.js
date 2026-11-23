/* consultas.js — Muro de consultas protegido por clave de curso y moderación docente */
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
      const { main, db, canReply, courseId, schoolName, courseName, courseData } = ctx;
      const courseRef = db.collection("courses").doc(courseId);
      const colRef = courseRef.collection("consultas");
      const savedName = localStorage.getItem("aula_alumno_nombre") || "";
      const savedKey = sessionStorage.getItem("aula_key_" + courseId) || "";

      const coursePin = (courseData && courseData.pin) ? String(courseData.pin).trim() : "";
      const modEnabled = Boolean(courseData && courseData.modConsultas);

      main.innerHTML = `
        <div class="top">
          <h2>Consultas — ${esc(courseName || "Curso")}</h2>
        </div>
        <p class="lead">Espacio de preguntas y respuestas de <b>${esc(schoolName || "")}</b>. ${modEnabled ? "Los mensajes se publican luego de ser revisados por la profesora." : "Los alumnos dejan sus dudas sobre los temas o tareas y la profesora responde aquí mismo."}</p>

        ${canReply ? `
          <div class="gd-box" style="border-top-color:var(--tasks-ink);display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap">
            <div>
              <b style="font-size:.95rem">🛡️ Seguridad del foro del curso</b>
              <div class="note" style="margin:2px 0 0">Clave actual del curso: <b>${coursePin ? esc(coursePin) : "Sin clave (abierto)"}</b> · Si activás moderación, nadie verá un mensaje hasta que lo apruebes.</div>
            </div>
            <label class="chk" style="margin:0">
              <input type="checkbox" id="q-mod-chk" ${modEnabled ? "checked" : ""}>
              <span>Aprobar mensajes antes de mostrarlos</span>
            </label>
          </div>
        ` : ""}

        <div class="gd-box" style="border-top-color:var(--ac)">
          <h3 style="margin:0 0 8px;font:700 1.15rem var(--fd);color:var(--ac)">✍️ Dejar una consulta a la profesora</h3>
          <div class="row">
            <div>
              <label style="margin-top:4px">Tu nombre y apellido *</label>
              <input id="q-author" maxlength="50" placeholder="Ej: Lucas Gómez" value="${esc(savedName)}">
            </div>
            <div>
              <label style="margin-top:4px">Tema o trabajo (opcional)</label>
              <input id="q-topic" maxlength="60" placeholder="Ej: Trabajo Práctico N° 2 / Fracciones">
            </div>
          </div>
          ${(!canReply && coursePin) ? `
            <label>Clave del aula (te la da la profe) *</label>
            <input id="q-pin" type="password" placeholder="Escribí la clave del curso" value="${esc(savedKey)}">
          ` : ""}
          <label>Tu consulta *</label>
          <textarea id="q-text" maxlength="800" placeholder="Escribí acá tu duda con el mayor detalle posible…"></textarea>
          <div class="err" id="q-err"></div>
          <div class="acts" style="margin-top:12px">
            <button type="button" class="btn" id="q-send">Enviar consulta</button>
          </div>
        </div>

        <div id="q-list"><div class="empty"><div class="big">Cargando consultas…</div></div></div>
      `;

      if(canReply){
        const modChk = main.querySelector("#q-mod-chk");
        modChk.onchange = async () => {
          modChk.disabled = true;
          try{
            await courseRef.update({ modConsultas: modChk.checked });
            if(courseData) courseData.modConsultas = modChk.checked;
          }catch(e){
            alert("No se pudo cambiar la configuración: " + e.message);
            modChk.checked = !modChk.checked;
          }
          modChk.disabled = false;
        };
      }

      const listBox = main.querySelector("#q-list");

      const loadList = async () => {
        try{
          const snap = await colRef.orderBy("createdAt", "desc").limit(100).get();
          const docs = [];
          snap.forEach(doc => {
            const d = doc.data();
            // Si hay moderación activa, los alumnos solo ven mensajes aprobados (o los propios recién enviados)
            if(canReply || !modEnabled || d.approved !== false){
              docs.push({ id: doc.id, ...d });
            }
          });

          if(!docs.length){
            listBox.innerHTML = `
              <div class="empty">
                <div class="big">Todavía no hay consultas publicadas</div>
                <p>Cuando un alumno escriba una duda arriba, aparecerá acá para poder responderle.</p>
              </div>`;
            return;
          }

          let html = "";
          docs.forEach(q => {
            const hasReply = Boolean(q.reply && q.reply.trim());
            const isHidden = modEnabled && q.approved === false;
            html += `
              <div class="item" style="border-left-color:${isHidden ? "var(--dg)" : (hasReply ? "var(--materials-ink)" : "var(--tasks-ink)")}">
                <div style="padding:16px 20px">
                  <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;flex-wrap:wrap">
                    <div>
                      <strong style="font:700 1.05rem var(--fd)">🙋 ${esc(q.author || "Alumno/a")}</strong>
                      ${q.topic ? `<span class="chip" style="margin-left:6px">${esc(q.topic)}</span>` : ""}
                    </div>
                    <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
                      ${isHidden ? `<span class="chip" style="background:#fff0f3;color:var(--dg);border-color:#ffc9d6">👁️ Oculta (pendiente de aprobar)</span>` : ""}
                      <span class="chip" style="${hasReply
                        ? "background:var(--materials-bg);color:var(--materials-ink);border-color:var(--materials-hl)"
                        : "background:var(--tasks-bg);color:var(--tasks-ink);border-color:var(--tasks-hl)"}">
                        ${hasReply ? "✓ Respondida" : "⏳ Sin responder"}
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
                      ${isHidden ? `<button type="button" class="btn" data-approve="${q.id}">✓ Aprobar y publicar</button>` : ""}
                      <button type="button" class="btn soft" data-reply="${q.id}">${hasReply ? "✏️ Editar respuesta" : "💬 Responder"}</button>
                      <button type="button" class="btn del" data-del="${q.id}">Borrar</button>
                    </div>
                    <div id="rbox-${q.id}" style="display:none;margin-top:12px;padding-top:12px;border-top:1px dashed var(--bd)">
                      <textarea id="rtxt-${q.id}" placeholder="Escribí tu respuesta para el alumno...">${esc(q.reply || "")}</textarea>
                      <div class="acts" style="margin-top:8px">
                        <button type="button" class="btn" data-rsave="${q.id}">Publicar respuesta</button>
                        <button type="button" class="btn soft" data-rcancel="${q.id}">Cancelar</button>
                      </div>
                    </div>
                  ` : ""}
                </div>
              </div>
            `;
          });

          listBox.innerHTML = html;

          if(canReply){
            listBox.querySelectorAll("[data-approve]").forEach(btn => {
              btn.onclick = async () => {
                btn.disabled = true;
                await colRef.doc(btn.dataset.approve).update({ approved: true });
                loadList();
              };
            });
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
                  approved: true,
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
        const pinInput = main.querySelector("#q-pin");
        const enteredPin = pinInput ? pinInput.value.trim() : "";
        const err = main.querySelector("#q-err");

        if(!author){ err.textContent = "Por favor, escribí tu nombre."; return; }
        if(!canReply && coursePin && enteredPin !== coursePin){
          err.textContent = "La clave del aula es incorrecta. Pedísela a tu profesora.";
          return;
        }
        if(!question){ err.textContent = "Escribí tu consulta antes de enviar."; return; }

        const btn = main.querySelector("#q-send");
        btn.disabled = true;
        btn.textContent = "Enviando…";
        err.textContent = "";

        try{
          localStorage.setItem("aula_alumno_nombre", author);
          if(enteredPin) sessionStorage.setItem("aula_key_" + courseId, enteredPin);

          await colRef.add({
            author,
            topic,
            question,
            pin: canReply ? coursePin : enteredPin,
            approved: canReply ? true : !modEnabled,
            reply: "",
            createdAt: Date.now()
          });

          main.querySelector("#q-text").value = "";
          main.querySelector("#q-topic").value = "";
          btn.disabled = false;
          btn.textContent = "Enviar consulta";

          if(!canReply && modEnabled){
            alert("¡Consulta enviada! La profesora la va a revisar y responder pronto.");
          }
          loadList();
        }catch(e){
          err.textContent = "No se pudo enviar (verificá la clave del aula): " + (e.message || e);
          btn.disabled = false;
          btn.textContent = "Enviar consulta";
        }
      };

      loadList();
    }
  };
})();