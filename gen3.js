/* Generador de exámenes: pedido con palabras propias + ejercicios de los libros cargados.
   - Entiende frases como: "3.º año, 6 ejercicios: 2 de Pitágoras con ecuaciones y 4 de ángulos entre paralelas,
     dificultad media, 10 puntos, con tema B".
   - Si está activado, además busca en la Biblioteca ejercicios sobre esos temas para sumarlos al examen. */
(function(){
const GX={text:'',lib:true,msg:'',cands:null,busy:false,err:''};
const NUMW={un:1,uno:1,una:1,dos:2,tres:3,cuatro:4,cinco:5,seis:6,siete:7,ocho:8,nueve:9,diez:10};
const YEARW={primer:1,primero:1,segundo:2,tercer:3,tercero:3,cuarto:4,quinto:5,sexto:6};
const escRe=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const phraseRe=p=>new RegExp('(?:^|[^a-z0-9])'+p.split(' ').map(w=>escRe(w)+(/s$/.test(w)?'':'(?:e?s)?')).join('\\s+')+'(?![a-z0-9])');
const near=(a,b)=>new RegExp(`(?:${a})[^.;,]{0,45}\\b(?:con|combinad\\w*|mas)\\b[^.;,]{0,25}(?:${b})|(?:${b})[^.;,]{0,45}\\b(?:con|combinad\\w*|mas)\\b[^.;,]{0,25}(?:${a})`);
const CLAS=/(?:clasific\w*|tipos? de)[^.;,]{0,60}?(?:triangulo|cuadrilatero|figura|poligono)[^.;,]*|\b(?:equilatero|isosceles|escaleno|acutangulo|obtusangulo|paralelogramo|romboide|rombo|trapecio)s?\b/;
const EXTRA={
 enteros:/\b(?:numeros? )?enteros?\b|regla de los signos/,
 angulos_rel:/(?:angulos?\s+)?(?:complementari|suplementari|opuestos? por el vertice|adyacente)/,
 angulos_par:/(?:angulos?\s+)?(?:entre\s+)?(?:paralela|alterno|correspondiente|conjugado|transversal)/,
 potencias:/potenc|exponente/,
 radicacion:/\braiz\b|\braices\b|radical|radicacion/,
 geometria:/perimetro|\bareas?\b(?!\s+(?:lateral|total))/,
 fracciones:/fraccion|racionales/,
 clas_fig:CLAS
};
const LIBMAP={angulos_rel:['angulos'],angulos_par:['angulos'],comb_geo_ec:['geometria','ecuacion1'],pit_ec:['pitagoras','ecuacion1'],comb_num:['potencias','radicacion','enteros','expresiones_alg'],clas_fig:['clas_fig']};
const STOP=new Set('examen evaluacion prueba ejercicio ejercicios problema problemas actividad actividades consigna consignas quiero necesito armame arma armar hace hacer haceme dame dar tema temas sobre desde mis mi los las libro libros material cargado biblioteca anos ano curso puntos punto dificultad nivel con de del para que por una uno unos unas segun'.split(' '));

/* ---------- interpretación del pedido ---------- */
function gxParse(raw){
  const out={topics:[],b:false,libonly:false,wantsLib:false,free:[]};
  let s=String(raw||'');
  const mt=/t[ií]tulo\s*[:=]?\s*["“«]([^"”»]+)["”»]/i.exec(s);
  if(mt){out.title=mt[1].trim();s=s.replace(mt[0],' ')}
  let n=' '+lbNrm(s).replace(/[“”«»]/g,'"')+' ';
  const cut=(re,fn)=>{const m=re.exec(n);if(!m)return false;if(fn)fn(m);n=n.replace(m[0],' ');return true};
  cut(/\b(?:con\s+)?(?:tema\s*b|dos\s+temas|2\s+temas|dos\s+versiones|2\s+versiones|dos\s+modelos|2\s+modelos|version\s*b|modelo\s*b)\b/,()=>{out.b=true});
  if(/\bsol(?:o|amente)\s+(?:de|con|desde|del|en)?\s*(?:mis|mi|los|el|las|la)?\s*(?:libros?|material|pdfs?|biblioteca)/.test(n))out.libonly=true;
  if(/\b(?:libros?|material cargado|biblioteca|pdfs?)\b/.test(n))out.wantsLib=true;
  if(!cut(/(\d+(?:[.,]\d+)?)\s*(?:puntos|pts|puntaje)\b/,m=>{out.puntos=parseFloat(m[1].replace(',','.'))}))
    cut(/puntaje\s*(?:total\s*)?(?:de\s*)?(\d+(?:[.,]\d+)?)/,m=>{out.puntos=parseFloat(m[1].replace(',','.'))});
  cut(/(?:(\d)\s*\.?\s*(?:º|°|o|ro|er|do|to|mo|vo|no)?|\b(primer|primero|segundo|tercer|tercero|cuarto|quinto|sexto))\s*ano\b/,m=>{const y=m[1]?+m[1]:YEARW[m[2]];if(y>=1&&y<=6)out.anio=y});
  const D={facil:0,baja:0,sencillo:0,sencilla:0,basica:0,basico:0,media:1,medio:1,intermedia:1,moderada:1,dificil:2,alta:2,progresiva:3,progresivo:3,creciente:3,gradual:3};
  if(!cut(/(?:dificultad|nivel)\s*(?:de\s+)?(facil|baja|media|medio|intermedia|moderada|dificil|alta|progresiva|creciente|gradual)\b/,m=>{out.dif=D[m[1]]}))
    cut(/\b(facil(?:es)?|sencill[oa]s?|dificil(?:es)?|progresiv[oa]|creciente|gradual)\b/,m=>{const w=m[1];out.dif=/^dificil/.test(w)?2:/^(facil|sencill)/.test(w)?0:3});
  n=n.replace(/\b(un|uno|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)\b(?=\s*(?:ejercicios?|problemas?|actividades|consignas|de\b|sobre\b))/g,m=>NUMW[m]);
  cut(/(\d+)\s*(?:ejercicios?|problemas?|actividades)\s*(?:por|para cada|cada)\s*(?:tema|uno|contenido)/,m=>{out.per=+m[1]});
  cut(/(\d+)\s*(?:ejercicios|problemas|actividades|consignas)\b(?!\s*(?:de|sobre|con|del)\b)/,m=>{out.n=+m[1]});

  cut(/(\d+)\s*terminos?\b/,m=>{out.terminos=Math.min(7,Math.max(2,+m[1]))});
  /* temas */
  const found={},consider=(k,i)=>{if(i>=0&&(found[k]===undefined||i<found[k]))found[k]=i};
  const has=k=>TOPICS.some(t=>t.k===k);
  const combos=[];
  const mPit=near('pitagoras|hipotenusa|catetos?','ecuacion').exec(n);if(mPit)combos.push(['pit_ec',mPit.index,['pitagoras','ecuacion1']]);
  const mGeo=near('area|areas|perimetro','ecuacion').exec(n);if(mGeo)combos.push(['comb_geo_ec',mGeo.index,['geometria','ecuacion1']]);
  const grp=[/potenc/,/\braiz|\braices|radic/,/distributiv/,/\bentero/].filter(r=>r.test(n)).length,mCb=/combinad\w*/.exec(n);
  if(grp>=3||(mCb&&(grp>=1||!combos.length))){const idx=mCb?mCb.index:Math.min(...[/potenc/,/\braiz|\braices|radic/,/distributiv/,/\bentero/].map(r=>{const m=r.exec(n);return m?m.index:1e9}));combos.push(['comb_num',idx,['potencias','radicacion','enteros','expresiones_alg']])}
  combos.forEach(([k,i])=>consider(k,i));
  const n2=n.replace(/sistemas? de ecuaciones?/g,' ').replace(/ecuaciones? (?:cuadratic|de segundo|exponencial|logaritmic)\w*/g,' ');
  TOPICS.forEach(t=>{const k=t.k;if(['pit_ec','comb_geo_ec','comb_num'].includes(k))return;
    const L=(typeof LB_KEYS!=='undefined'&&LB_KEYS[k])||{s:[]};
    L.s.forEach(p=>{const m=phraseRe(p).exec(n);if(m)consider(k,m.index+(/^[^a-z0-9]/.test(m[0])?1:0))});
    if(EXTRA[k]){const m=EXTRA[k].exec(n);if(m)consider(k,m.index)}
    if(k==='ecuacion1'){const m=/ecuacion/.exec(n2);if(m)consider(k,m.index)}
  });
  const n3=n.replace(new RegExp(CLAS.source,'g'),' ');
  if(!found.angulos_rel&&!found.angulos_par&&!found.angulos&&has('angulos_rel')){const m=/\bangulos?\b/.exec(n3);if(m)consider('angulos_rel',m.index)}
  if(found.angulos_rel!==undefined||found.angulos_par!==undefined)delete found.angulos;
  combos.forEach(([k,i,drop])=>drop.forEach(d=>{if(d!==k)delete found[d]}));
  const order=Object.keys(found).filter(has).sort((a,b)=>found[a]-found[b]);
  order.forEach((k,j)=>{
    const idx=found[k],lb=j?found[order[j-1]]+1:0;let seg=n.slice(lb,idx);
    const m=/(\d+)(?!.*\d)/.exec(seg);let c=0;
    if(m){const after=seg.slice(m.index+m[0].length);if(!/[,;.]/.test(after)&&after.length<=45)c=+m[1]}
    out.topics.push({k,count:c,idx});
  });
  /* detalles de cada tema: problema, ecuación, propiedades */
  const T0=out.topics,PROB=/\bcomo\s+problemas?\b|en forma de problemas?|contextualizad|con enunciado|problemas?\s+(?:con\s+)?(?:enunciado|contexto)|situaciones?\s+(?:problematicas?|reales)/,
    EC=/(?:\bcon|en forma de|plantead\w+(?:\s+(?:como|en forma de|con))?|\bcomo|usando|mediante)\s+(?:(?:una|las|unas)\s+)?ecuacion/,PRP=/\bpropiedad(?:es)?\b|\bapliqu\w+/;
  T0.forEach((t,j)=>{if(t.k==='ecuacion1')return;const nx=T0[j+1],nb=T0.slice(j+1).find(x=>x.k!=='ecuacion1'),dl=/[,;.:]/.exec(n.slice(t.idx)),end=Math.min(nb?nb.idx:1e9,dl?t.idx+dl.index:1e9),cl=n.slice(t.idx,end);t.mods={};
    if(PROB.test(cl))t.mods.problema=true;if(EC.test(cl))t.mods.ecuacion=true;if(PRP.test(cl))t.mods.props=true;
    if(t.k==='comb_num'&&out.terminos)t.mods.terminos=out.terminos;
    if(t.mods.ecuacion&&nx&&nx.k==='ecuacion1'&&!nx.count&&nx.idx<end){nx.drop=true;
      if(t.k==='pitagoras')t.k='pit_ec';else if(t.k==='geometria')t.k='comb_geo_ec'}});
  out.topics=T0.filter(t=>!t.drop);
  // "5 ejercicios de A, B y C": el número del primer tema es el total
  if(out.n==null&&out.topics.length>1&&out.topics[0].count&&out.topics.slice(1).every(t=>!t.count)){
    const pre=n.slice(Math.max(0,out.topics[0].idx-30),out.topics[0].idx);
    if(/\d+\s*(?:ejercicios?|problemas?|actividades)\s*(?:de|sobre)?\s*(?:el|la|los|las)?\s*$/.test(pre)){out.n=out.topics[0].count;out.topics[0].count=0}
  }
  out.free=[...new Set((n.match(/[a-z0-9]+/g)||[]).filter(w=>w.length>3&&!STOP.has(w)&&!/^\d+$/.test(w)))];
  return out;
}

/* ---------- aplicar el pedido a la configuración del generador ---------- */
function gxApply(P){
  const T=P.topics;let counts=T.map(t=>t.count||0);
  if(P.per)counts=counts.map(c=>c||P.per);
  const S=counts.reduce((a,b)=>a+b,0),unk=counts.map((c,i)=>c?-1:i).filter(i=>i>=0);
  let total=P.n||(S>0?S+unk.length:Math.max(G.n,T.length));
  total=Math.min(20,Math.max(total,S+unk.length));
  let rem=total-S-unk.length;unk.forEach(i=>counts[i]=1);
  const pool=unk.length?unk:T.map((_,i)=>i);
  for(let i=0;rem>0;i++,rem--)counts[pool[i%pool.length]]++;
  const plan=[];T.forEach((t,i)=>{for(let j=0;j<counts[i];j++)plan.push(t.k)});
  G.plan=plan.slice(0,20);G.temas=[...new Set(G.plan)];G.n=G.plan.length;
  G.mods={};P.notes=[];
  const SUP={problema:['pitagoras','pit_ec','comb_geo_ec'],ecuacion:['angulos_rel','angulos_par'],terminos:['comb_num'],props:['comb_num']},LBL={problema:'como problema',ecuacion:'con ecuaciones',terminos:'términos',props:'con propiedades'};
  T.forEach(t=>{const m=t.mods||{},ok={};Object.keys(m).forEach(f=>{if(f==='ecuacion'&&(t.k==='pit_ec'||t.k==='comb_geo_ec'))return;
    if(SUP[f]&&SUP[f].includes(t.k))ok[f]=m[f];else P.notes.push(`“${LBL[f]}” en ${tn(t.k)}`)});
    if(Object.keys(ok).length)G.mods[t.k]=ok;t.okmods=ok});
  if(P.anio)G.anio=P.anio;if(P.dif!=null)G.dif=P.dif;if(P.puntos)G.puntos=Math.min(100,Math.max(1,P.puntos));if(P.b)G.b=true;if(P.title)G.title=P.title;
  if(G.temas.some(k=>!TOPICS.find(t=>t.k===k).y.includes(+G.anio)))G.all=true;
  return counts;
}

/* ---------- búsqueda de ejercicios en los libros cargados ---------- */
function gxItems(t){
  const lines=String(t).split('\n'),items=[];let cur=null;
  const st=/^\s*(?:\d{1,3}\s*[.)\-–:]|\(\d{1,3}\)|\d{1,3}\s+(?=[A-ZÁÉÍÓÚ¿]))\s*\S/;
  const push=()=>{if(cur){items.push(cur.trim());cur=null}};
  for(const raw of lines){const ln=raw.trim();if(st.test(ln)){push();cur=ln}else if(cur){if(!ln)push();else cur+='\n'+ln}}
  push();
  const verb=/(calcul|resolv|hall|determin|justific|complet|indic|escrib|clasific|marc|encontr|expres|simplific|factoriz|dibuj|traz|constru|verific|demostr|averigu|obten|represent|analiz|cuant|cual|\?)/i;
  let r=items.filter(x=>x.length>=25&&x.length<=700&&verb.test(x));
  if(!r.length)r=String(t).split(/\n\s*\n/).map(x=>x.trim()).filter(x=>x.length>=40&&x.length<=500&&verb.test(x)).slice(0,2);
  return r;
}
async function gxSearch(P){
  GX.busy=true;GX.err='';GX.cands=null;gxDraw();
  try{
    if(!LIB.loaded)await libEnsure();
    if(!LIB.loaded)throw new Error('lib');
    const qs=[];
    P.topics.forEach(t=>(LIBMAP[t.k]||[t.k]).forEach(lk=>{const w=LB_KEYS[lk];if(w)qs.push({label:tn(t.k),Q:{strong:w.s.map(lbStemText),weak:w.w.map(lbStemText),mode:'topic'}})}));
    if(!qs.length&&P.free.length){const st=[...new Set(P.free.map(lbStemText).filter(Boolean))];if(st.length)qs.push({label:'tu pedido',Q:{strong:st,weak:[],mode:'any'}})}
    const best=new Map();
    qs.forEach(q=>LIB.pages.forEach(pg=>{if(!LIB.inc.has(pg.b))return;const sc=lbScore(pg,q.Q);if(sc>0){const key=pg.b+'|'+pg.p,o=best.get(key);if(!o||sc>o.sc)best.set(key,{pg,sc,label:q.label});}}));
    const pages=[...best.values()].sort((a,b)=>b.sc-a.sc).slice(0,16),seen=new Set(),out=[];
    for(const h of pages)for(const it of gxItems(h.pg.t)){const key=lbNrm(it).replace(/\s+/g,' ').slice(0,80);if(seen.has(key))continue;seen.add(key);out.push({book:h.pg.b,title:h.pg.bt,p:h.pg.p,text:it,label:h.label,added:false});if(out.length>=40)break}
    GX.cands=out;
  }catch(e){console.error(e);GX.err='No se pudo buscar en la biblioteca. Revisá tu conexión.';GX.cands=[]}
  GX.busy=false;gxDraw();
}
function gxDraw(){
  const box=document.getElementById('gx-cands');if(!box)return;
  if(GX.busy){box.innerHTML='<p class="note">Buscando ejercicios en tus libros…</p>';return}
  if(GX.cands===null){box.innerHTML='';return}
  if(GX.err){box.innerHTML=`<p class="note">${esc(GX.err)}</p>`;return}
  if(!GX.cands.length){box.innerHTML='<p class="note">No encontré ejercicios de tus libros para este pedido. Revisá que los PDF tengan texto legible o probá con otras palabras.</p>';return}
  box.innerHTML=`<details open class="gd-box" style="margin:12px 0 0"><summary><b>📖 Ejercicios encontrados en tus libros (${GX.cands.length})</b></summary>
   <p class="note">Marcá los que quieras sumar al examen. Revisá que se hayan copiado bien: las figuras y algunas fórmulas de los PDF pueden salir incompletas. En la clave aparece de qué libro y página son.</p>
   ${GX.cands.map((c,i)=>`<div class="gx-row"><label class="gx-c"><input type="checkbox" class="gx-ck" value="${i}" ${c.added?'checked disabled':''}><span>${esc(c.text.length>420?c.text.slice(0,420)+'…':c.text).replace(/\n/g,'<br>')}</span></label><div class="gx-src">📖 ${esc(c.title)} · pág. ${c.p} · ${esc(c.label)} <button class="btn soft" data-gv="${c.book}|${c.p}">Ver página</button>${c.added?' · ✓ agregado':''}</div></div>`).join('')}
   <div class="acts"><button class="btn" id="gx-add">Agregar al examen lo que marqué</button></div></details>`;
  box.querySelectorAll('[data-gv]').forEach(b=>b.onclick=()=>{const[id,p]=b.dataset.gv.split('|');lbViewer(id,+p)});
  document.getElementById('gx-add').onclick=gxAdd;
}
function gxAdd(){
  const sel=[...document.querySelectorAll('.gx-ck:checked:not(:disabled)')].map(c=>GX.cands[+c.value]).filter(Boolean);
  if(!sel.length){alert('Marcá al menos un ejercicio.');return}
  const mk=c=>({t:'libro',d:1,q:esc(c.text.replace(/^\s*\d{1,3}\s*[.)\-–:]\s*/,'')).replace(/\n/g,'<br>'),a:`Ejercicio tomado de «${esc(c.title)}», página ${c.p}. Se corrige con el libro (no se calcula automáticamente).`,f:'',fa:'',tip:''});
  if(!G.sets){G.sets={A:[]};G.cur='A'}
  Object.keys(G.sets).forEach(s=>sel.forEach(c=>G.sets[s].push(mk(c))));
  sel.forEach(c=>{c.added=true});
  renderGen();
}

/* ---------- pantalla ---------- */
const EJ=['3.º año, 6 ejercicios: 2 de Pitágoras con ecuaciones, 2 de ángulos entre paralelas y 2 combinados con potencias y raíces. Dificultad media, 10 puntos, con tema B.',
 '2.º año, 8 ejercicios de área y perímetro con ecuaciones y clasificación de triángulos según sus lados y ángulos. Dificultad fácil.',
 'Ejercicios sobre ángulos complementarios, suplementarios y opuestos por el vértice, dificultad progresiva, 5 ejercicios, 20 puntos. Buscar también en mis libros.'];
function gxPanel(){
  return `<div class="gd-box" id="gx"><h3 style="margin:0 0 4px">✨ Pedile el examen con tus palabras</h3>
  <p class="note" style="margin:0 0 8px">Escribí qué querés y el generador elige los temas, la cantidad, la dificultad y el puntaje. También puede buscar ejercicios en tus libros cargados.</p>
  <textarea id="gx-t" rows="3" placeholder="Ej.: ${esc(EJ[0])}">${esc(GX.text)}</textarea>
  <div class="note" style="margin-top:6px">Ejemplos: ${EJ.map((e,i)=>`<a href="#" data-ex="${i}">#${i+1}</a>`).join(' · ')}</div>
  <label class="chk"><input type="checkbox" id="gx-lib" ${GX.lib?'checked':''}> Buscar también ejercicios en mis libros cargados</label>
  <div class="acts"><button class="btn" id="gx-go">✨ Armar examen</button></div>
  <div id="gx-msg" class="note">${GX.msg}</div><div id="gx-cands"></div>
  <details class="lb-more"><summary>Cómo escribir el pedido</summary><p class="note">Podés indicar: el <b>año</b> (“3.º año”), la <b>cantidad</b> (“6 ejercicios” o “2 de Pitágoras”), los <b>temas</b>, la <b>dificultad</b> (fácil, media, difícil, progresiva), el <b>puntaje</b> (“10 puntos”), “con tema B” para dos versiones, y un título entre comillas (título: “Prueba 1”). Para combinar temas usá “con”: “Pitágoras con ecuaciones”, “área y perímetro con ecuaciones”, “ejercicios combinados con potencias y raíces”. Para usar solo tus libros: “solo de mis libros”.</p></details></div>`;
}
function gxBind(){
  const t=document.getElementById('gx-t');t.oninput=()=>{GX.text=t.value};
  document.getElementById('gx-lib').onchange=e=>{GX.lib=e.target.checked};
  document.querySelectorAll('#gx [data-ex]').forEach(a=>a.onclick=e=>{e.preventDefault();GX.text=EJ[+a.dataset.ex];t.value=GX.text});
  document.getElementById('gx-go').onclick=gxRun;
  gxDraw();
}
function gxSummary(P,counts){
  const y=G.anio+'.º año',d=['fácil','media','difícil','progresiva'][G.dif];
  const md=t=>{const m=t.okmods||{},r=[];if(m.problema)r.push('como problema');if(m.ecuacion)r.push('con ecuaciones');if(m.terminos)r.push(m.terminos+' términos');if(m.props)r.push('aplicando propiedades');return r.length?` (${r.join(', ')})`:''};
  const tl=P.topics.map((t,i)=>`${esc(tn(t.k))}${md(t)}${counts?` ×${counts[i]}`:''}`).join('; ');
  return `<b>Entendí:</b> ${y} · dificultad ${d} · ${G.n} ejercicio(s) · ${num(G.puntos)} puntos${G.b?' · con Tema B':''}<br><b>Temas:</b> ${tl}<br>${P.notes&&P.notes.length?`<br>⚠️ No pude aplicar: ${P.notes.map(esc).join('; ')}. Esos temas salen con ejercicios comunes.`:''}<br>Si algo no es lo que querías, cambialo abajo o reescribí el pedido.`;
}
function gxRun(){
  GX.text=document.getElementById('gx-t').value;GX.lib=document.getElementById('gx-lib').checked;
  if(!GX.text.trim()){alert('Escribí qué examen querés. Por ejemplo: “6 ejercicios de Pitágoras con ecuaciones y ángulos entre paralelas, dificultad media”.');return}
  const P=gxParse(GX.text);GX.cands=null;GX.err='';
  const useLib=(GX.lib||P.wantsLib||P.libonly);
  if(P.libonly){
    G.plan=null;G.mods=null;G.sets=null;if(P.title)G.title=P.title;if(P.puntos)G.puntos=P.puntos;if(P.b)G.b=true;
    GX.msg='<b>Entendí:</b> armar el examen solo con ejercicios de tus libros. Marcá abajo los que quieras sumar.';
    renderGen();gxSearch(P);return;
  }
  if(!P.topics.length){
    GX.msg='No reconocí ningún tema en tu pedido. Probá nombrándolos, por ejemplo: <i>Pitágoras con ecuaciones, ángulos entre paralelas, fracciones, potencias, clasificación de triángulos…</i> (abajo, en “Más opciones” de la lista de temas, podés ver todos).'+(useLib&&P.free.length?'<br>Mientras tanto, busqué esas palabras en tus libros.':'');
    renderGen();if(useLib&&P.free.length)gxSearch(P);return;
  }
  const counts=gxApply(P);build();GX.msg=gxSummary(P,counts);
  renderGen();
  if(useLib)gxSearch(P);
}

/* ---------- se conecta a la pantalla del generador ---------- */
const _one=one;
one=function(k,d){GXM.cur=(G.mods&&G.mods[k])||null;try{return _one(k,d)}finally{GXM.cur=null}};
const _rg=renderGen;
renderGen=function(){
  _rg();
  const lead=document.querySelector('#main .lead');if(!lead)return;
  lead.insertAdjacentHTML('afterend',gxPanel());gxBind();
  document.querySelectorAll('[data-x]').forEach(b=>b.onclick=()=>{G.sets[G.cur].splice(+b.dataset.x,1);renderGen()});
  const go=document.getElementById('g-go');
  if(go)go.onclick=()=>{readCfg();if(!G.temas.length){alert('Elegí al menos un tema.');return}
    const u=[...new Set(G.plan||[])];
    if(!(G.plan&&G.plan.length&&u.length===G.temas.length&&u.every(k=>G.temas.includes(k))&&G.n===G.plan.length)){G.plan=null;G.mods=null}
    build();renderGen()};
};
window.gxParse=gxParse;window.gxApply=gxApply;
})();
