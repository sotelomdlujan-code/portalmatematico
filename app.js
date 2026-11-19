const SECTIONS = {
  plans: {label:'Planificaciones', ico:'📘', teacher:true, lead:'Organizá cada clase y unidad: contenidos, objetivos, actividades y cómo se evalúa.', empty:'Todavía no hay planificaciones', fields:[
    ['title','Título de la clase o unidad','text'],['curso','Curso (por ejemplo, 3° B)','text'],['fecha','Fecha','date'],
    ['contenidos','Contenidos','area'],['objetivos','Objetivos de aprendizaje','area'],
    ['actividades','Actividades y secuencia','area'],['recursos','Recursos','area'],['evaluacion','Cómo se evalúa','area']]},
  exams: {label:'Evaluaciones', ico:'✏️', teacher:true, lead:'Prepará cada evaluación con sus contenidos, criterios y ponderación.', empty:'Todavía no hay evaluaciones', fields:[
    ['title','Nombre de la evaluación','text'],['curso','Curso','text'],['fecha','Fecha','date'],
    ['tipo','Tipo','select',['Escrita','Oral','Trabajo práctico','Recuperatorio']],
    ['contenidos','Contenidos a evaluar','area'],['criterios','Criterios de evaluación','area'],['notas','Notas y ponderación','area']]},
  gen: {label:'Generar examen', ico:'🧮', teacher:true, lead:'', fields:[]},
  materials: {label:'Material', ico:'📚', teacher:false, lead:'Apuntes, libros y recursos para estudiar.', empty:'Todavía no hay material', fields:[
    ['title','Título','text'],['curso','Curso','text'],['descripcion','Descripción','area']]},
  tasks: {label:'Tareas', ico:'🌟', teacher:false, lead:'Lo que tenés para resolver y la fecha de entrega.', empty:'Todavía no hay tareas', fields:[
    ['title','Título','text'],['curso','Curso','text'],['entrega','Fecha de entrega','date'],['consigna','Consigna','area']]}
};
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const safeUrl = u => /^https?:\/\//i.test(u) ? u : '';
const fmt = iso => { try { const d = new Date(iso+'T12:00:00'); const y = d.getFullYear()!==new Date().getFullYear(); return d.toLocaleDateString('es-AR',{day:'numeric',month:'long',...(y?{year:'numeric'}:{})}); } catch(e){ return iso; } };

const cfg = window.FIREBASE_CONFIG || {};
const configured = cfg.apiKey && !String(cfg.apiKey).startsWith('PEGAR');
let auth, fs, user = null, tab = 'materials', curso = '', unsubs = [];
let data = {plans:[],exams:[],materials:[],tasks:[]};
const canEdit = () => !!user;
const visible = () => Object.keys(SECTIONS).filter(k => canEdit() || !SECTIONS[k].teacher);

function parseLinks(text){
  return text.split('\n').map(l => l.trim()).filter(Boolean).map(l => {
    const i = l.indexOf('|');
    const name = i > -1 ? l.slice(0,i).trim() : '';
    const url = (i > -1 ? l.slice(i+1) : l).trim();
    return {name: name || url.replace(/^https?:\/\//i,'').slice(0,40), url};
  }).filter(f => safeUrl(f.url));
}

function renderNav(){
  $('#nav').innerHTML = visible().map(k => `<button class="k-${k} ${k===tab?'on':''}" data-t="${k}"><span class="dot">${SECTIONS[k].ico}</span>${SECTIONS[k].label}<span class="n">${(data[k]||[]).length||''}</span></button>`).join('');
  $('#nav').querySelectorAll('button').forEach(b => b.onclick = () => { tab = b.dataset.t; curso = ''; render(); });
  $('#auth').innerHTML = canEdit()
    ? `<p class="who">${esc(user.email)}</p><button class="btn soft" id="lo">Cerrar sesión</button>`
    : `<button class="btn soft" id="li">Ingreso docente</button>`;
  if(canEdit()) $('#lo').onclick = () => auth.signOut(); else $('#li').onclick = openLogin;
}

function render(){
  if(!visible().includes(tab)) tab = visible()[0];
  renderNav();
  $('#role').textContent = canEdit() ? 'Panel de la profesora' : 'Espacio de estudio';
  if(tab==='gen'){ renderGen(); return; }
  const S = SECTIONS[tab], all = data[tab];
  const cursos = [...new Set(all.map(d => d.curso).filter(Boolean))].sort();
  const list = all.filter(d => !curso || d.curso === curso);
  let h = `<div class="top"><h2>${S.label}</h2><div class="tools">`;
  if(cursos.length > 1) h += `<select class="cur" id="cf" aria-label="Filtrar por curso"><option value="">Todos los cursos</option>${cursos.map(c=>`<option ${c===curso?'selected':''}>${esc(c)}</option>`).join('')}</select>`;
  if(canEdit()) h += `<button class="btn" id="add">Agregar ${tab==='plans'?'planificación':tab==='exams'?'evaluación':tab==='tasks'?'tarea':'material'}</button>`;
  h += `</div></div><p class="lead">${S.lead}</p>`;
  if(!list.length) h += `<div class="empty"><div class="big">${S.empty}</div>${canEdit() ? 'Usá el botón de arriba para crear la primera.' : 'Cuando tu profesora publique algo, lo vas a ver acá.'}</div>`;
  list.forEach(d => {
    const dt = d.fecha || d.entrega;
    h += `<details class="item k-${tab}"><summary><span class="badge dot">${S.ico}</span><div><h3>${esc(d.title||'Sin título')}</h3><div class="sub">`;
    if(d.curso) h += `<span class="chip tagk k-${tab}">${esc(d.curso)}</span>`;
    if(dt) h += `<span class="chip">${tab==='tasks'?'Entrega: ':''}${fmt(dt)}</span>`;
    if(d.tipo) h += `<span class="chip">${esc(d.tipo)}</span>`;
    h += `</div></div><span class="chev">⌄</span></summary><div class="body">`;
    S.fields.forEach(([k,l,t]) => { if(t==='area' && d[k]) h += `<div class="f"><b>${l}</b><p>${esc(d[k])}</p></div>`; });
    const fl = (d.files||[]).filter(f => safeUrl(f.url));
    if(fl.length) h += `<div class="files">${fl.map(f=>`<a href="${esc(f.url)}" target="_blank" rel="noopener">📎 ${esc(f.name)}</a>`).join('')}</div>`;
    if(canEdit()) h += `<div class="acts">${d.ejercicios?`<button class="btn" data-g="${d.id}">Abrir examen</button>`:''}<button class="btn soft" data-e="${d.id}">Editar</button><button class="btn del" data-d="${d.id}">Borrar</button></div>`;
    h += `</div></details>`;
  });
  const open = [...document.querySelectorAll('details[open] h3')].map(x => x.textContent);
  $('#main').innerHTML = h;
  document.querySelectorAll('details').forEach(el => { if(open.includes(el.querySelector('h3').textContent)) el.open = true; });
  const cf = $('#cf'); if(cf) cf.onchange = () => { curso = cf.value; render(); };
  if(canEdit()){
    $('#add').onclick = () => openForm();
    document.querySelectorAll('[data-g]').forEach(b => b.onclick = () => openSavedExam(all.find(x => x.id===b.dataset.g)));
    document.querySelectorAll('[data-e]').forEach(b => b.onclick = () => openForm(all.find(x => x.id===b.dataset.e)));
    document.querySelectorAll('[data-d]').forEach(b => b.onclick = async () => {
      if(!confirm('¿Querés borrar este elemento? No se puede deshacer.')) return;
      try { await fs.collection(tab).doc(b.dataset.d).delete(); } catch(e){ alert('No se pudo borrar. Probá de nuevo.'); }
    });
  }
}

function openForm(d){
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
    if(!obj.title){ alert('Escribí un título para guardar.'); return; }
    try {
      const col = fs.collection(tab);
      if(d.id) await col.doc(d.id).set({...obj, created: d.created||Date.now()}); else await col.add({...obj, created: Date.now()});
      $('#dlg').close();
    } catch(err){ alert('No se pudo guardar. Revisá tu conexión y las reglas de Firestore.'); }
  };
  $('#dlg').showModal();
}

function openLogin(){
  $('#lfrm').innerHTML = `<h3 style="margin:0 0 6px;font:600 1.5rem var(--fd)">Ingreso docente</h3>
    <label>Correo</label><input id="em" type="email" autocomplete="username">
    <label>Contraseña</label><input id="pw" type="password" autocomplete="current-password">
    <div class="err" id="er"></div>
    <div class="acts"><button class="btn" id="go">Ingresar</button><button class="btn soft" id="lx">Cancelar</button></div>`;
  $('#lx').onclick = () => $('#ldlg').close();
  const go = async () => {
    try { await auth.signInWithEmailAndPassword($('#em').value.trim(), $('#pw').value); $('#ldlg').close(); }
    catch(e){ $('#er').textContent = 'Correo o contraseña incorrectos.'; }
  };
  $('#go').onclick = go;
  $('#pw').onkeydown = e => { if(e.key==='Enter') go(); };
  $('#ldlg').showModal();
}

function subscribe(){
  unsubs.forEach(u => u()); unsubs = [];
  data = {plans:[],exams:[],materials:[],tasks:[]};
  visible().filter(k => k!=='gen').forEach(k => {
    unsubs.push(fs.collection(k).orderBy('created','desc').onSnapshot(
      s => { data[k] = s.docs.map(x => ({id:x.id, ...x.data()})); render(); },
      err => { console.error(err); $('#role').textContent = 'No se pudieron cargar los datos'; }
    ));
  });
  render();
}

if(!configured){
  $('#auth').remove();
  $('#main').innerHTML = `<div class="empty setup"><div class="big">Falta conectar la base de datos</div>Abrí el archivo <code>config.js</code> y pegá los datos de tu proyecto de Firebase. Los pasos están en el <code>README.md</code>.</div>`;
} else {
  firebase.initializeApp(cfg);
  auth = firebase.auth(); fs = firebase.firestore();
  auth.onAuthStateChanged(u => { user = u; tab = u ? 'plans' : 'materials'; subscribe(); });
}
