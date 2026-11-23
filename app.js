const SECTIONS = {
  plans: {label:'Planificaciones', ico:'📘', teacher:true, lead:'Organizá cada clase y unidad: contenidos, objetivos, actividades y cómo se evalúa.', empty:'Todavía no hay planificaciones', fields:[
    ['title','Título de la clase o unidad','text'],['fecha','Fecha','date'],
    ['contenidos','Contenidos','area'],['objetivos','Objetivos de aprendizaje','area'],
    ['actividades','Actividades y secuencia','area'],['recursos','Recursos','area'],['evaluacion','Cómo se evalúa','area']]},
  exams: {label:'Evaluaciones', ico:'✏️', teacher:true, lead:'Prepará cada evaluación con sus contenidos, criterios y ponderación.', empty:'Todavía no hay evaluaciones', fields:[
    ['title','Nombre de la evaluación','text'],['fecha','Fecha','date'],
    ['tipo','Tipo','select',['Escrita','Oral','Trabajo práctico','Recuperatorio']],
    ['contenidos','Contenidos a evaluar','area'],['criterios','Criterios de evaluación','area'],['notas','Notas y ponderación','area']]},
  gen: {label:'Generar examen', ico:'🧮', teacher:true, lead:'', fields:[]},
  lib: {label:'Biblioteca', ico:'📖', teacher:true, reader:true, lead:'', fields:[]},
  guides: {label:'Guías', ico:'📑', teacher:true, lead:'', fields:[]},
  tutor: {label:'Tutor IA', ico:'🤖', teacher:true, reader:true, lead:'Consultá dudas de matemática basadas en tus libros cargados.', fields:[]},
  materials: {label:'Material', ico:'📚', teacher:false, lead:'Apuntes, libros y recursos para estudiar.', empty:'Todavía no hay material', fields:[
    ['title','Título','text'],['descripcion','Descripción','area']]},
  tasks: {label:'Tareas', ico:'🌟', teacher:false, lead:'Lo que tenés para resolver y la fecha de entrega.', empty:'Todavía no hay tareas', fields:[
    ['title','Título','text'],['entrega','Fecha de entrega','date'],['consigna','Consigna','area']]},
  consultas: {label:'Consultas', ico:'💬', teacher:false, lead:'Dejale tus dudas al profe sobre los temas o tareas del curso.', empty:'Todavía no hay consultas', fields:[]}
};
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const safeUrl = u => /^https?:\/\//i.test(u) ? u : '';
const fmt = iso => { try { const d = new Date(iso+'T12:00:00'); const y = d.getFullYear()!==new Date().getFullYear(); return d.toLocaleDateString('es-AR',{day:'numeric',month:'long',...(y?{year:'numeric'}:{})}); } catch(e){ return iso; } };

const cfg = window.FIREBASE_CONFIG || {};
const configured = cfg.apiKey && !String(cfg.apiKey).startsWith('PEGAR');
let auth, fs, user = null, tab = 'materials', unsubs = [], metaUnsubs = [];
let spaces = [], courses = [], spaceId = '', courseId = '', subbed = null, studentCourse = null, badLink = false, loaded = {sp:false, cu:false};
const col = name => fs.collection('courses').doc(courseId).collection(name);
let data = {plans:[],exams:[],materials:[],tasks:[]};
const TEACHER = String(window.TEACHER_EMAIL || '').toLowerCase();
const canEdit = () => !!user && String(user.email || '').toLowerCase() === TEACHER;
const isReader = () => !!user && !canEdit();
const visible = () => Object.keys(SECTIONS).filter(k => canEdit() || (isReader() ? SECTIONS[k].reader : !SECTIONS[k].teacher));
const GROUPS = {plans:'Mi planificación', lib:'Recursos', materials:'Para los alumnos'};

function parseLinks(text){
  return text.split('\n').map(l => l.trim()).filter(Boolean).map(l => {
    const i = l.indexOf('|');
    const name = i > -1 ? l.slice(0,i).trim() : '';
    const url = (i > -1 ? l.slice(i+1) : l).trim();
    return {name: name || url.replace(/^https?:\/\//i,'').slice(0,40), url};
  }).filter(f => safeUrl(f.url));
}

function renderNav(){
  const showGroups = canEdit();
  $('#nav').innerHTML = visible().map(k => (showGroups && GROUPS[k] ? `<div class="grp">${GROUPS[k]}</div>` : '') + `<button class="k-${k} ${k===tab?'on':''}" data-t="${k}"><span class="dot">${SECTIONS[k].ico}</span>${SECTIONS[k].label}</button>`).join('');
  $('#nav').querySelectorAll('button').forEach(b => b.onclick = () => { tab = b.dataset.t; render(); });
  $('#auth').innerHTML = user
    ? `<p class="who">${esc(user.email)}</p><button class="btn soft" id="lo">Cerrar sesión</button>`
    : `<button class="btn soft" id="li">Ingresar</button>`;
  if(user) $('#lo').onclick = () => auth.signOut(); else $('#li').onclick = openLogin;
}

function render(){
  if(!visible().includes(tab)) tab = visible()[0];
  document.body.dataset.tab = tab;
  renderNav();
  $('#role').textContent = canEdit() ? 'Panel de la profesora' : isReader() ? 'Biblioteca compartida (solo lectura)' : (studentCourse ? `${studentCourse.escuela || ''} · ${studentCourse.name}` : 'Espacio de estudio');
  if(tab==='gen'){ renderGen(); return; }
  if(tab==='guides'){ if(typeof renderGuides==='function') renderGuides(); return; }
  if(tab==='tutor'){ if(typeof renderTutor==='function') renderTutor(); else $('#main').innerHTML = '<div class="empty"><div class="big">Falta un archivo</div>Para usar el Tutor IA subí el archivo <b>tutor.js</b> y recargá con Ctrl + F5.</div>'; return; }
  if(tab==='lib'){ if(typeof renderLib==='function') renderLib(); else $('#main').innerHTML = '<div class="empty"><div class="big">Falta un archivo</div>Para usar la Biblioteca subí a GitHub el archivo <b>biblioteca.js</b> y el <b>index.html</b> nuevo, y recargá con Ctrl + F5.</div>'; return; }
  if(!courseId){
    if(canEdit()){
      const sinEsc = !spaces.length;
      $('#main').innerHTML = `<div class="empty">${typeof LAPI==='undefined'?'':LAPI}<div class="big">${sinEsc ? 'Empecemos creando tu primera escuela' : 'Ahora creá un curso'}</div>${sinEsc ? 'Puede ser una escuela, un colegio o “Clases particulares”.' : 'Cada curso tiene su propio material, tareas y link para los alumnos.'}<br><br><button class="btn" id="ob">${sinEsc ? 'Crear escuela' : 'Crear curso'}</button></div>`;
      $('#ob').onclick = () => sinEsc ? addSpace() : addCourse();
    } else {
      $('#main').innerHTML = `<div class="empty">${typeof LAPI==='undefined'?'':LAPI}<div class="big">${badLink ? 'Este link no es válido' : 'Entrá con el link de tu curso'}</div>${badLink ? 'Pedile a tu profesora que te lo mande de nuevo.' : 'Tu profesora te pasa un link para ver el material y las tareas de tu curso.'}</div>`;
    }
    return;
  }
  if(tab==='consultas'){
    if(window.AulaConsultas){
      const cObj = canEdit() ? courses.find(x => x.id===courseId) : studentCourse;
      AulaConsultas.render({
        main: $('#main'),
        db: fs,
        canReply: canEdit(),
        courseId,
        courseData: cObj,
        schoolName: canEdit() ? spaceName() : (studentCourse?.escuela || ''),
        courseName: canEdit() ? courseName() : (studentCourse?.name || '')
      });
    } else {
      $('#main').innerHTML = '<div class="empty"><div class="big">Falta un archivo</div>Subí <b>consultas.js</b> a GitHub y recargá con Ctrl + F5.</div>';
    }
    return;
  }
  const S = SECTIONS[tab], all = data[tab], list = all;
  let h = `<div class="top"><h2>${S.label}</h2><div class="tools">`;
  if(canEdit()) h += `<button class="btn" id="add">Agregar ${tab==='plans'?'planificación':tab==='exams'?'evaluación':tab==='tasks'?'tarea':'material'}</button>`;
  h += `</div></div><p class="lead">${S.lead}</p>`;
  if(!list.length) h += `<div class="empty">${typeof LAPI==='undefined'?'':LAPI}<div class="big">${S.empty}</div>${canEdit() ? 'Usá el botón de arriba para crear la primera.' : 'Cuando tu profesora publique algo, lo vas a ver acá.'}</div>`;
  list.forEach(d => {
    const dt = d.fecha || d.entrega;
    h += `<details class="item k-${tab}"><summary><span class="badge dot">${S.ico}</span><div><h3>${esc(d.title||'Sin título')}</h3><div class="sub">`;
    if(dt) h += `<span class="chip">${tab==='tasks'?'Entrega: ':''}${fmt(dt)}</span>`;
    if(d.tipo) h += `<span class="chip">${esc(d.tipo)}</span>`;
    h += `</div></div><span class="chev">⌄</span></summary><div class="body">`;
    S.fields.forEach(([k,l,t]) => { if(t==='area' && d[k]) h += `<div class="f"><b>${l}</b><p>${esc(d[k])}</p></div>`; });
    const fl = (d.files||[]).filter(f => safeUrl(f.url));
    const lf = Array.isArray(d.localFiles) ? d.localFiles : [];
    if(fl.length || lf.length || d.guideId) {
      h += `<div class="files">`;
      if(d.guideId) h += `<button class="gdl" data-gd="${d.guideId}" data-gn="${esc(d.guideTitle||d.title||'guia')}">📄 Descargar guía (PDF)</button>`;
      lf.forEach(f => { h += `<button type="button" class="gdl" data-lf="${esc(f.id)}" data-lfn="${esc(f.name)}">📄 ${esc(f.name)}</button>`; });
      fl.forEach(f => { h += `<a href="${esc(f.url)}" target="_blank" rel="noopener">📎 ${esc(f.name)}</a>`; });
      h += `</div>`;
    }
    if(canEdit()) h += `<div class="acts">${d.ejercicios?`<button class="btn" data-g="${d.id}">Abrir examen</button>`:''}<button class="btn soft" data-e="${d.id}">Editar</button><button class="btn del" data-d="${d.id}">Borrar</button></div>`;
    h += `</div></details>`;
  });
  const open = [...document.querySelectorAll('details[open] h3')].map(x => x.textContent);
  $('#main').innerHTML = h;
  document.querySelectorAll('details').forEach(el => { if(open.includes(el.querySelector('h3').textContent)) el.open = true; });
  document.querySelectorAll('[data-gd]').forEach(b => b.onclick = async () => { b.disabled = true; const t = b.textContent; b.textContent = 'Descargando…'; try { await downloadGuide(b.dataset.gd, b.dataset.gn); } catch(e){ console.error(e); alert('No se pudo descargar la guía. Probá de nuevo.'); } b.disabled = false; b.textContent = t; });
  document.querySelectorAll('[data-lf]').forEach(b => b.onclick = () => { if(window.AulaMateriales) AulaMateriales.openViewer(fs, b.dataset.lf, b.dataset.lfn); });
  if(canEdit()){
    $('#add').onclick = () => openForm();
    document.querySelectorAll('[data-g]').forEach(b => b.onclick = () => openSavedExam(all.find(x => x.id===b.dataset.g)));
    document.querySelectorAll('[data-e]').forEach(b => b.onclick = () => openForm(all.find(x => x.id===b.dataset.e)));
    document.querySelectorAll('[data-d]').forEach(b => b.onclick = async () => {
      if(!confirm('¿Querés borrar este elemento? No se puede deshacer.')) return;
      try {
        const item = all.find(x => x.id===b.dataset.d);
        if(item && Array.isArray(item.localFiles) && window.AulaMateriales){
          for(const f of item.localFiles) await AulaMateriales.deleteLocalFile(fs, f.id);
        }
        await col(tab).doc(b.dataset.d).delete();
      } catch(e){ alert('No se pudo borrar. Probá de nuevo.'); }
    });
  }
}

function openForm(d){
  if(tab==='materials' && window.AulaMateriales){
    AulaMateriales.openEditor({ db: fs, user, colRef: col('materials'), dlg: $('#dlg'), frm: $('#frm'), esc }, d);
    return;
  }
  const S = SECTIONS[tab]; d = d || {};
  const fld = ([k,l,t,opts]) => {
    let i;
    if(t==='area') i = `<textarea name="${k}">${esc(d[k])}</textarea>`;
    else if(t==='select') i = `<select name="${k}">${opts.map(o=>`<option ${o===d[k]?'selected':''}>${o}</option>`).join('')}</select>`;
    else i = `<input name="${k}" type="${t}" value="${esc(d[k])}">`;
    return `<div><label>${l}</label>${i}</div>`;
  };
  const short = S.fields.filter(f => f[2]!=='area' && f[0]!=='title');
  const areas = S.fields.filter(f => f[2]==='area');
  const links = (d.files||[]).map(f => `${f.name} | ${f.url}`).join('\n');
  let h = `<h3>${d.id?'Editar':'Nueva'} · ${S.label.toLowerCase()}</h3>`;
  h += fld(S.fields[0]) + `<div class="row">${short.map(fld).join('')}</div>` + areas.map(fld).join('');
  h += `<label>Archivos y enlaces</label><textarea name="__links" placeholder="Guía de ejercicios | https://drive.google.com/…">${esc(links)}</textarea>`;
  h += `<div class="note">Subí el archivo a Google Drive (compartido con “cualquiera con el enlace”) y pegá el enlace acá, uno por línea. Podés ponerle nombre así: <i>Nombre | enlace</i>.</div>`;
  h += `<div class="acts" style="margin-top:22px"><button class="btn" id="sv">Guardar</button><button class="btn soft" id="cx">Cancelar</button></div>`;
  $('#frm').innerHTML = h;
  $('#cx').onclick = () => $('#dlg').close();
  $('#sv').onclick = async () => {
    const obj = {updated: Date.now()};
    $('#frm').querySelectorAll('[name]').forEach(el => { if(el.name!=='__links') obj[el.name] = el.value.trim(); });
    obj.files = parseLinks($('#frm').querySelector('[name="__links"]').value);
    if(d.ejercicios) obj.ejercicios = d.ejercicios;
    if(d.guideId){ obj.guideId = d.guideId; obj.guideTitle = d.guideTitle || ''; }
    if(!obj.title){ alert('Escribí un título para guardar.'); return; }
    try {
      const c = col(tab);
      if(d.id) await c.doc(d.id).set({...obj, created: d.created||Date.now()}); else await c.add({...obj, created: Date.now()});
      $('#dlg').close();
    } catch(err){ alert('No se pudo guardar. Revisá tu conexión y las reglas de Firestore.'); }
  };
  $('#dlg').showModal();
}

function openLogin(){
  let reg = false;
  const draw = () => {
    $('#lfrm').innerHTML = `<h3>${reg ? 'Crear cuenta' : 'Ingresar'}</h3><p class="note" style="margin:0 0 6px">${reg ? 'Para ver la biblioteca compartida. Usá el correo que te habilitó la profesora.' : 'Profesora o persona con acceso a la biblioteca.'}</p>
    <label>Correo</label><input id="em" type="email" autocomplete="username">
    <label>Contraseña</label><input id="pw" type="password" autocomplete="${reg ? 'new-password' : 'current-password'}">
    <div class="err" id="er"></div>
    <div class="acts"><button class="btn" id="go">${reg ? 'Crear cuenta' : 'Ingresar'}</button><button class="btn soft" id="lx">Cancelar</button></div>
    <p class="note"><a href="#" id="sw">${reg ? 'Ya tengo cuenta' : 'Es mi primera vez (crear cuenta)'}</a></p>`;
    $('#lx').onclick = () => $('#ldlg').close();
    $('#sw').onclick = e => { e.preventDefault(); reg = !reg; draw(); };
    const go = async () => {
      const em = $('#em').value.trim(), pw = $('#pw').value;
      try {
        if(reg){
          const c = await auth.createUserWithEmailAndPassword(em, pw);
          try { await c.user.sendEmailVerification(); } catch(e){}
          await auth.signOut();
          $('#lfrm').innerHTML = '<h3>¡Cuenta creada!</h3><p>Te mandamos un correo para confirmar tu dirección. Abrilo, tocá el enlace y después volvé acá a ingresar.</p><div class="acts"><button class="btn" id="lx2">Entendido</button></div>';
          $('#lx2').onclick = () => $('#ldlg').close();
        } else { await auth.signInWithEmailAndPassword(em, pw); $('#ldlg').close(); }
      } catch(e){ console.error(e); $('#er').textContent = 'No se pudo ' + (reg ? 'crear la cuenta' : 'ingresar') + ' (' + (e.code || e.message) + ').'; }
    };
    $('#go').onclick = go;
    $('#pw').onkeydown = e => { if(e.key==='Enter') go(); };
  };
  draw(); $('#ldlg').showModal();
}

function subscribe(){
  unsubs.forEach(u => u()); unsubs = [];
  data = {plans:[],exams:[],materials:[],tasks:[]};
  if(courseId){
    visible().filter(k => !['gen','lib','guides','tutor','consultas'].includes(k)).forEach(k => {
      unsubs.push(col(k).orderBy('created','desc').onSnapshot(
        s => { data[k] = s.docs.map(x => ({id:x.id, ...x.data()})); render(); },
        err => { console.error(err); $('#role').textContent = 'No se pudieron cargar los datos'; }
      ));
    });
  }
  render();
}

/* ---------- Escuelas y cursos (solo docente) ---------- */
const spaceName = () => (spaces.find(x => x.id===spaceId)||{}).name || '';
const courseName = () => (courses.find(x => x.id===courseId)||{}).name || '';
function saveSel(){ try{ localStorage.setItem('aula_sel', JSON.stringify({spaceId, courseId})); }catch(e){} }

function syncSel(){
  if(!canEdit() || !loaded.sp || !loaded.cu) return;
  if(!spaces.find(x => x.id===spaceId)) spaceId = (spaces[0]||{}).id || '';
  const cs = courses.filter(c => c.spaceId===spaceId);
  if(!cs.find(c => c.id===courseId)) courseId = (cs[0]||{}).id || '';
  renderPicker();
  if(courseId !== subbed){
    subbed = courseId; saveSel();
    if(typeof G !== 'undefined'){ G.escuela = spaceName(); G.curso = courseName(); G.sets = null; }
    subscribe();
  } else render();
}

function askName(title, val, cb){
  $('#frm').innerHTML = `<h3>${title}</h3><label>Nombre</label><input id="nm" value="${esc(val)}" autocomplete="off">
    <div class="acts" style="margin-top:22px"><button class="btn" id="nok">Guardar</button><button class="btn soft" id="ncx">Cancelar</button></div>`;
  const ok = async () => { const v = $('#nm').value.trim(); if(!v) return;
    try { await cb(v); $('#dlg').close(); } catch(e){ console.error(e); alert('No se pudo guardar. Revisá tu conexión y las reglas de Firestore.'); } };
  $('#ncx').onclick = () => $('#dlg').close();
  $('#nok').onclick = ok;
  $('#nm').onkeydown = e => { if(e.key==='Enter') ok(); };
  $('#dlg').showModal(); $('#nm').focus();
}
function addSpace(){ askName('Nueva escuela', '', async v => { const r = await fs.collection('spaces').add({name:v, created:Date.now()}); spaceId = r.id; courseId = ''; }); }
function renameSpace(){ if(!spaceId) return; askName('Renombrar escuela', spaceName(), async v => {
  const b = fs.batch(); b.update(fs.collection('spaces').doc(spaceId), {name:v});
  courses.filter(c => c.spaceId===spaceId).forEach(c => b.update(fs.collection('courses').doc(c.id), {escuela:v}));
  await b.commit(); }); }
async function delSpace(){
  if(!spaceId) return;
  if(courses.some(c => c.spaceId===spaceId)){ alert('Primero borrá los cursos de esta escuela.'); return; }
  if(!confirm(`¿Borrar la escuela “${spaceName()}”?`)) return;
  try { await fs.collection('spaces').doc(spaceId).delete(); spaceId = ''; } catch(e){ alert('No se pudo borrar.'); }
}

function askCourse(title, val, pinVal, cb){
  $('#frm').innerHTML = `<h3>${title}</h3>
    <label>Nombre del curso *</label>
    <input id="nm" value="${esc(val)}" placeholder="Ej: 3° Año B" autocomplete="off">
    <label>Clave del aula (opcional, para que solo entren tus alumnos)</label>
    <input id="cpin" value="${esc(pinVal || '')}" placeholder="Ej: mate3b o 4512" autocomplete="off">
    <p class="note">Si ponés una clave, los alumnos tendrán que escribirla para entrar al curso y dejar consultas.</p>
    <div class="acts" style="margin-top:22px"><button class="btn" id="nok">Guardar</button><button class="btn soft" id="ncx">Cancelar</button></div>`;
  const ok = async () => {
    const v = $('#nm').value.trim();
    const p = $('#cpin').value.trim();
    if(!v) return;
    try { await cb(v, p); $('#dlg').close(); } catch(e){ console.error(e); alert('No se pudo guardar.'); }
  };
  $('#ncx').onclick = () => $('#dlg').close();
  $('#nok').onclick = ok;
  $('#nm').onkeydown = e => { if(e.key==='Enter') ok(); };
  $('#cpin').onkeydown = e => { if(e.key==='Enter') ok(); };
  $('#dlg').showModal(); $('#nm').focus();
}
function addCourse(){
  if(!spaceId){ alert('Primero creá una escuela.'); return; }
  askCourse(`Nuevo curso en ${esc(spaceName())}`, '', '', async (v, pin) => {
    const r = await fs.collection('courses').add({name:v, pin, modConsultas:true, spaceId, escuela:spaceName(), created:Date.now()});
    courseId = r.id;
  });
}
function renameCourse(){
  if(!courseId) return;
  const cur = courses.find(x => x.id===courseId) || {};
  askCourse('Editar curso y clave', cur.name || '', cur.pin || '', (v, pin) =>
    fs.collection('courses').doc(courseId).update({name:v, pin})
  );
}
async function delCourse(){
  if(!courseId) return;
  if(!confirm(`¿Borrar el curso “${courseName()}” con todo su material, tareas, planificaciones y evaluaciones? No se puede deshacer.`)) return;
  try {
    const ref = fs.collection('courses').doc(courseId);
    for(const k of ['plans','exams','materials','tasks','consultas']){
      const sn = await ref.collection(k).get(); const b = fs.batch(); sn.docs.forEach(d => b.delete(d.ref)); if(sn.size) await b.commit();
    }
    await ref.delete(); courseId = '';
  } catch(e){ console.error(e); alert('No se pudo borrar el curso.'); }
}
function copyLink(){
  if(!courseId) return;
  const cur = courses.find(x => x.id===courseId) || {};
  const url = location.origin + location.pathname + '?c=' + courseId;
  const msg = cur.pin ? `Link y clave para los alumnos de ${cur.name}:\n\nEnlace: ${url}\nClave del aula: ${cur.pin}` : `Link copiado. Pasáselo a los alumnos de este curso:\n\n${url}`;
  (navigator.clipboard ? navigator.clipboard.writeText(cur.pin ? `${url} (Clave: ${cur.pin})` : url) : Promise.reject()).then(() => alert(msg)).catch(() => prompt('Copiá estos datos y pasáselos a los alumnos:', cur.pin ? `${url} | Clave: ${cur.pin}` : url));
}

function renderPicker(){
  const el = $('#picker');
  if(!canEdit()){ el.innerHTML = ''; return; }
  const cs = courses.filter(c => c.spaceId===spaceId);
  const opts = (arr, cur, none) => arr.length ? arr.map(x => `<option value="${x.id}" ${x.id===cur?'selected':''}>${esc(x.name)}</option>`).join('') : `<option value="">${none}</option>`;
  el.innerHTML = `<label>Escuela</label>
    <div class="pk"><select id="sp" aria-label="Escuela">${opts(spaces, spaceId, '— ninguna —')}</select><button class="ib" id="sp-a" title="Nueva escuela">＋</button><button class="ib" id="sp-e" title="Renombrar">✏️</button><button class="ib" id="sp-d" title="Borrar">🗑</button></div>
    <label>Curso</label>
    <div class="pk"><select id="cu" aria-label="Curso">${opts(cs, courseId, '— ninguno —')}</select><button class="ib" id="cu-a" title="Nuevo curso">＋</button><button class="ib" id="cu-e" title="Editar curso y clave">✏️</button><button class="ib" id="cu-d" title="Borrar">🗑</button></div>
    <button class="btn soft lnk" id="lnk" ${courseId?'':'disabled'}>🔗 Link para alumnos</button>`;
  $('#sp').onchange = e => { spaceId = e.target.value; courseId = ''; syncSel(); };
  $('#cu').onchange = e => { courseId = e.target.value; syncSel(); };
  $('#sp-a').onclick = addSpace; $('#sp-e').onclick = renameSpace; $('#sp-d').onclick = delSpace;
  $('#cu-a').onclick = addCourse; $('#cu-e').onclick = renameCourse; $('#cu-d').onclick = delCourse;
  $('#lnk').onclick = copyLink;
}

/* ---------- Arranque ---------- */
const qc = new URLSearchParams(location.search).get('c') || '';
if(!configured){
  $('#auth').remove();
  $('#main').innerHTML = `<div class="empty setup"><div class="big">Falta conectar la base de datos</div>Abrí el archivo <code>config.js</code> y pegá los datos de tu proyecto de Firebase. Los pasos están en el <code>README.md</code>.</div>`;
} else {
  firebase.initializeApp(cfg);
  auth = firebase.auth(); fs = firebase.firestore();
  auth.onAuthStateChanged(u => {
    user = u; tab = !u ? 'materials' : (String(u.email||'').toLowerCase() === TEACHER ? 'plans' : 'lib'); if(typeof libReset==='function') libReset();
    metaUnsubs.forEach(f => f()); metaUnsubs = [];
    unsubs.forEach(f => f()); unsubs = [];
    subbed = null; studentCourse = null; badLink = false; courseId = ''; spaces = []; courses = []; loaded = {sp:false, cu:false};
    data = {plans:[],exams:[],materials:[],tasks:[]};
    if(u && !canEdit()){
      if(!u.emailVerified){ $('#main').innerHTML = '<div class="empty"><div class="big">Falta confirmar tu correo</div>Abrí el correo que te enviamos, tocá el enlace de confirmación y volvé a ingresar.<br><br><button class="btn" id="vo">Cerrar sesión</button></div>'; renderNav(); $('#vo').onclick = () => auth.signOut(); return; }
      renderPicker(); u.getIdToken(true).catch(() => {}).then(() => render());
    } else if(u){
      try { const sel = JSON.parse(localStorage.getItem('aula_sel') || '{}'); spaceId = sel.spaceId || ''; courseId = sel.courseId || ''; } catch(e){}
      const onErr = err => { console.error(err); $('#role').textContent = 'No se pudieron cargar los datos'; };
      metaUnsubs.push(fs.collection('spaces').orderBy('name').onSnapshot(sn => { spaces = sn.docs.map(x => ({id:x.id, ...x.data()})); loaded.sp = true; syncSel(); }, onErr));
      metaUnsubs.push(fs.collection('courses').orderBy('name').onSnapshot(sn => { courses = sn.docs.map(x => ({id:x.id, ...x.data()})); loaded.cu = true; syncSel(); }, onErr));
      renderPicker(); render();
    } else if(qc){
      renderPicker(); render();
      fs.collection('courses').doc(qc).get().then(d => {
        if(!d.exists){ badLink = true; render(); return; }
        const cData = {id:d.id, ...d.data()};
        const reqPin = (cData.pin || '').trim();
        const saved = sessionStorage.getItem('aula_key_' + d.id) || '';
        if(reqPin && saved !== reqPin){
          $('#main').innerHTML = `
            <div class="empty" style="max-width:440px;margin:20px auto;text-align:left">
              <div class="big" style="text-align:center">🔒 Curso protegido</div>
              <p style="text-align:center">Ingresá la clave de <b>${esc(cData.name)}</b> que te dio tu profesora.</p>
              <label>Clave del aula</label>
              <input id="gate-pin" type="password" placeholder="Escribí la clave acá" autocomplete="off">
              <div class="err" id="gate-err"></div>
              <div class="acts" style="justify-content:center">
                <button class="btn" id="gate-ok">Entrar al curso</button>
              </div>
            </div>`;
          const check = () => {
            const val = $('#gate-pin').value.trim();
            if(val === reqPin){
              sessionStorage.setItem('aula_key_' + d.id, val);
              studentCourse = cData; courseId = d.id; subbed = d.id; subscribe();
            } else {
              $('#gate-err').textContent = 'Clave incorrecta. Revisá mayúsculas y números.';
            }
          };
          $('#gate-ok').onclick = check;
          $('#gate-pin').onkeydown = e => { if(e.key==='Enter') check(); };
          return;
        }
        studentCourse = cData; courseId = d.id; subbed = d.id; subscribe();
      }).catch(() => { badLink = true; render(); });
    } else { renderPicker(); subscribe(); }
  });
}