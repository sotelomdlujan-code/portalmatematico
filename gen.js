/* Generador de exámenes: crea ejercicios con números al azar y calcula su clave de corrección. */
const R=(a,b)=>Math.floor(Math.random()*(b-a+1))+a, PK=a=>a[R(0,a.length-1)];
const gcd=(a,b)=>b?gcd(b,a%b):Math.abs(a);
const num=n=>String(n).replace('-','−').replace('.',',');
const pn=n=>n<0?`(${num(n)})`:`${n}`;
const fr=(n,d)=>d===1?num(n):`${n<0?'−':''}<span class="fr"><i>${Math.abs(n)}</i><i>${d}</i></span>`;
const F=(n,d)=>{if(d<0){n=-n;d=-d}const g=gcd(n,d)||1;return fr(n/g,d/g)};
const sum=ts=>{let s='';ts.forEach(([c,t])=>{if(!c)return;const a=Math.abs(c),b=(a==1&&t)?'':a;s+=s?` ${c<0?'−':'+'} ${b}${t}`:`${c<0?'−':''}${b}${t}`});return s||'0'};
const lin=(a,b)=>sum([[a,'x'],[b,'']]);
const eq2=(a,b,c)=>sum([[a,'x'],[b,'y']])+` = ${num(c)}`;
const xp=k=>k==0?'':k==1?'x':`x<sup>${k}</sup>`;
const pw=(b,e)=>`${b}<sup>${e}</sup>`;
const sg=n=>n<0?`− ${-n}`:`+ ${n}`;
const TRI=[[3,4,5],[5,12,13],[8,15,17],[7,24,25]];

const GEN={
enteros:d=>{const a=R(-9,9)||3,b=R(-9,9)||-4,c=R(-9,9)||5,e=R(2,6);
 if(d==0)return[`Calculá: <b>${pn(a)} + ${pn(b)} − ${pn(c)}</b>`,a+b-c];
 if(d==1)return[`Calculá: <b>${pn(a)} · (${pn(b)} − ${pn(c)}) + ${e}</b>`,a*(b-c)+e];
 return[`Calculá: <b>(${pn(a)} − ${pn(b)}) · ${pn(c)} − ${pn(e)}²</b>`,(a-b)*c-e*e]},
fracciones:d=>{let m=R(3,9),n=R(2,9);while(n==m)n=R(2,9);const a=R(1,m-1),b=R(1,n-1),k=R(2,8),c=R(1,k-1);
 if(d==0){const b0=R(1,m-1);return[`Resolvé y simplificá: <b>${fr(a,m)} + ${fr(b0,m)}</b>`,F(a+b0,m)]}
 if(d==1)return[`Resolvé y simplificá: <b>${fr(a,m)} + ${fr(b,n)}</b>`,F(a*n+b*m,m*n)];
 return[`Resolvé y simplificá: <b>${fr(a,m)} − ${fr(b,n)} + ${fr(c,k)}</b>`,F(a*n*k-b*m*k+c*m*n,m*n*k)]},
ecuacion1:d=>{const x=R(-9,9);let a=R(2,9),b=R(-9,9),c=R(1,8);if(c==a)c++;
 if(d==0)return[`Resolvé la ecuación: <b>${lin(a,b)} = ${num(a*x+b)}</b>`,`x = ${num(x)}`];
 if(d==1)return[`Resolvé la ecuación: <b>${lin(a,b)} = ${lin(c,a*x+b-c*x)}</b>`,`x = ${num(x)}`];
 const p=R(2,5),q=R(1,6),r=R(1,9);let e=R(-4,4);if(e==p)e++;const f=p*(x+q)-r-e*x;
 return[`Resolvé la ecuación: <b>${p}(x ${sg(q)}) − ${r} = ${lin(e,f)}</b>`,`x = ${num(x)}`]},
proporcionalidad:d=>{
 if(d==0){const k=R(2,6),u=R(3,12)*10,m=k+R(2,6);return[`Si ${k} cuadernos cuestan $${k*u}, ¿cuánto cuestan ${m} cuadernos?`,`$${m*u}`]}
 if(d==1){const w=PK([2,3,4,6]),t=PK([6,8,12]),T=w*t,ds=[];for(let i=2;i<=24;i++)if(T%i==0&&i!=w)ds.push(i);const w2=PK(ds);
  return[`${w} obreros terminan una obra en ${t} días. Trabajando al mismo ritmo, ¿cuántos días tardarán ${w2} obreros? (proporcionalidad inversa)`,`${T/w2} días`]}
 const v=R(4,9)*10,h=R(2,4),h2=h+R(1,3)+0.5;return[`Un auto recorre ${v*h} km en ${h} horas. Si mantiene la misma velocidad, ¿cuántos kilómetros recorre en ${num(h2)} horas?`,`${num(v*h2)} km`]},
porcentaje:d=>{
 if(d==0){const p=PK([10,20,25,50]),n=R(2,20)*20;return[`Calculá el <b>${p}%</b> de <b>${n}</b>.`,n*p/100]}
 if(d==1){const p=PK([10,20,25,30]),n=R(2,20)*100;return[`Un artículo cuesta $${n}. Con un descuento del ${p}%, ¿cuánto se paga?`,`$${n*(100-p)/100}`]}
 const p=PK([10,20,25,50]),o=R(2,20)*100;return[`Después de un aumento del ${p}%, un producto cuesta $${o*(100+p)/100}. ¿Cuál era su precio original?`,`$${o}`]},
geometria:d=>{
 if(d==0){const a=R(3,12),b=R(2,9);return[`Un rectángulo mide ${a} cm de largo y ${b} cm de ancho. Calculá su perímetro y su área.`,`Perímetro = ${2*(a+b)} cm; Área = ${a*b} cm²`]}
 if(d==1){const b=R(3,10)*2,h=R(3,10);return[`Calculá el área de un triángulo de ${b} cm de base y ${h} cm de altura.`,`${b*h/2} cm²`]}
 const r=R(2,9);return[`Calculá el área del círculo y la longitud de la circunferencia de radio ${r} cm. Dejá el resultado expresado con π.`,`Área = ${r*r}π cm²; Longitud = ${2*r}π cm`]},
pitagoras:d=>{const[a,b,c]=PK(TRI),k=R(1,3);
 if(d==0)return[`Un triángulo rectángulo tiene catetos de ${a*k} cm y ${b*k} cm. Calculá la hipotenusa.`,`${c*k} cm`];
 if(d==1)return[`En un triángulo rectángulo la hipotenusa mide ${c*k} cm y un cateto ${a*k} cm. Calculá el otro cateto.`,`${b*k} cm`];
 return[`Un rectángulo mide ${a*k} cm por ${b*k} cm. Calculá la longitud de su diagonal y su perímetro.`,`Diagonal = ${c*k} cm; Perímetro = ${2*(a+b)*k} cm`]},
funcion_lineal:d=>{
 if(d==0){const m=R(2,5)*PK([1,-1]),b=R(-6,6),x1=R(-3,4),x2=R(-3,4),x3=R(-2,3);
  return[`Dada la función <b>f(x) = ${lin(m,b)}</b>, calculá: a) f(${x1}) &nbsp; b) f(${x2}) &nbsp; c) el valor de x para el cual f(x) = ${num(m*x3+b)}.`,`a) ${num(m*x1+b)}; b) ${num(m*x2+b)}; c) x = ${x3}`]}
 if(d==1){const m=R(1,4)*PK([1,-1]),b=R(-5,5),x1=R(-3,0),x2=R(1,4);
  return[`Hallá la ecuación de la recta que pasa por los puntos (${x1}; ${num(m*x1+b)}) y (${x2}; ${num(m*x2+b)}).`,`y = ${lin(m,b)}`]}
 const x0=R(-4,4),y0=R(-6,6),m1=R(1,4),m2=-R(1,4);
 return[`Hallá analíticamente el punto de intersección de las rectas <b>y = ${lin(m1,y0-m1*x0)}</b> e <b>y = ${lin(m2,y0-m2*x0)}</b>.`,`(${x0}; ${y0})`]},
sistemas:d=>{let x=R(-5,5),y=R(-5,5),a,b,c,e,f,g;
 if(d==0){x=R(1,6);y=R(1,6);return[`Resolvé el sistema:<br>${eq2(1,1,x+y)}<br>${eq2(1,-1,x-y)}`,`x = ${x}; y = ${y}`]}
 const lim=d==1?3:5;do{a=R(1,lim);b=R(1,lim);c=R(-lim,lim)||1;e=R(-lim,lim)||2}while(a*e-b*c==0||(d==2&&(Math.abs(b)==0)));
 return[`Resolvé el sistema de ecuaciones:<br>${eq2(a,b,a*x+b*y)}<br>${eq2(c,e,c*x+e*y)}`,`x = ${num(x)}; y = ${num(y)}`]},
factoreo:d=>{
 if(d==0){const g=R(2,5),a=R(1,4),b=R(1,5);return[`Factoreá sacando factor común: <b>${sum([[g*a,'x²'],[g*b,'x']])}</b>`,`${sum([[g,'x']])}(${lin(a,b)})`]}
 if(d==1){const m=R(1,4),k=R(2,9);return[`Factoreá usando diferencia de cuadrados: <b>${sum([[m*m,'x²'],[-k*k,'']])}</b>`,`(${sum([[m,'x']])} − ${k})(${sum([[m,'x']])} + ${k})`]}
 const k=R(2,7),s=PK([1,-1]);return[`Factoreá el trinomio cuadrado perfecto: <b>${sum([[1,'x²'],[2*k*s,'x'],[k*k,'']])}</b>`,`(x ${s<0?'−':'+'} ${k})²`]},
cuadratica:d=>{
 if(d==0){const k=R(2,9);return[`Resolvé la ecuación: <b>x² − ${k*k} = 0</b>`,`x = ${k} o x = −${k}`]}
 const r1=R(-6,6)||2,r2=R(-6,6)||-3,a=d==1?1:PK([2,3]);
 return[`Resolvé la ecuación${d==2?' usando la fórmula resolvente':''}: <b>${sum([[a,'x²'],[-a*(r1+r2),'x'],[a*r1*r2,'']])} = 0</b>`,r1==r2?`x = ${num(r1)} (raíz doble)`:`x₁ = ${num(r1)}; x₂ = ${num(r2)}`]},
trigonometria:d=>{const m=R(2,9);
 if(d==0)return[`En un triángulo rectángulo la hipotenusa mide ${2*m} cm y un ángulo agudo mide 30°. ¿Cuánto mide el cateto opuesto a ese ángulo?`,`${m} cm`];
 if(d==1)return[`En un triángulo rectángulo la hipotenusa mide ${2*m} cm y un ángulo agudo mide 60°. Calculá la medida de los dos catetos (dejá la raíz expresada).`,`Cateto adyacente = ${m} cm; cateto opuesto = ${m}√3 cm`];
 const s=PK([0,1]);return[`En un triángulo rectángulo, el cateto opuesto a un ángulo α mide ${s?m+'√3':m} cm y el adyacente ${s?m:m+'√3'} cm. Hallá α usando los valores notables de las razones trigonométricas.`,s?'α = 60°':'α = 30°']},
potencias:d=>{const b=R(2,4);
 if(d==0){const x=R(2,4),y=R(2,4);return[`Aplicá propiedades y calculá: <b>${pw(b,x)} · ${pw(b,y)}</b>`,`${pw(b,x+y)} = ${b**(x+y)}`]}
 if(d==1){const x=R(2,4),y=R(2,3),z=R(1,x+y-1);return[`Aplicá propiedades y calculá: <b>(${pw(b,x)} · ${pw(b,y)}) ÷ ${pw(b,z)}</b>`,`${pw(b,x+y-z)} = ${b**(x+y-z)}`]}
 const x=R(2,3),y=R(2,3),z=R(1,x*y-1);return[`Aplicá propiedades y calculá: <b>(${pw(b,x)})<sup>${y}</sup> ÷ ${pw(b,z)}</b>`,`${pw(b,x*y-z)} = ${b**(x*y-z)}`]},
exp_log:d=>{const b=PK([2,3,5]),k=R(2,4);
 if(d==0)return[`Calculá: <b>log<sub>${b}</sub> ${b**k}</b>`,k];
 if(d==1)return[`Resolvé la ecuación exponencial: <b>${pw(b,'x')} = ${b**k}</b>`,`x = ${k}`];
 if(R(0,1)){const m=R(1,k-1);return[`Resolvé la ecuación exponencial: <b>${pw(b,'x + '+m)} = ${b**k}</b>`,`x = ${k-m}`]}
 const p=R(3,5),q=R(1,3),r=R(1,3);return[`Calculá aplicando propiedades: <b>log<sub>2</sub> ${2**p} + log<sub>2</sub> ${2**q} − log<sub>2</sub> ${2**r}</b>`,p+q-r]},
estadistica:d=>{const n=[5,8,10][d],v=[];for(let i=0;i<n-1;i++)v.push(R(1,d==2?20:10));v.push(PK(v));
 const s=[...v].sort((a,b)=>a-b),mean=v.reduce((a,b)=>a+b,0)/n,med=n%2?s[(n-1)/2]:(s[n/2-1]+s[n/2])/2;
 const fq={};v.forEach(x=>fq[x]=(fq[x]||0)+1);const mx=Math.max(...Object.values(fq)),mo=Object.keys(fq).filter(k=>fq[k]==mx);
 let a=`Media = ${num(Math.round(mean*10)/10)}; Mediana = ${num(med)}; Moda = ${mx==1?'no hay moda':mo.join(' y ')}`;if(d==2)a+=`; Rango = ${s[n-1]-s[0]}`;
 return[`Dados los datos: <b>${v.join('; ')}</b>, calculá ${d==2?'la media, la mediana, la moda y el rango':'la media, la mediana y la moda'} (redondeá la media a un decimal).`,a]},
probabilidad:d=>{const r=R(2,6),a=R(2,6),v=R(1,5),N=r+a+v,t=`Una bolsa tiene ${r} bolitas rojas, ${a} azules y ${v} verdes. `;
 if(d==0)return[t+'Si se saca una al azar, ¿cuál es la probabilidad de que sea roja?',F(r,N)];
 if(d==1)return[t+'Si se saca una al azar, ¿cuál es la probabilidad de que sea azul o verde?',F(a+v,N)];
 return[t+'Se sacan dos bolitas sin reposición. ¿Cuál es la probabilidad de que ambas sean rojas?',F(r*(r-1),N*(N-1))]},
derivadas:d=>{const n=R(2,4),a=R(1,5)*PK([1,-1]),b=R(-6,6),c=R(-5,5),f=sum([[a,xp(n)],[b,'x'],[c,'']]),df=sum([[a*n,xp(n-1)],[b,'']]);
 if(d==0)return[`Derivá la función: <b>f(x) = ${f}</b>`,`f ′(x) = ${df}`];
 if(d==1){const x0=R(1,3);return[`Dada <b>f(x) = ${f}</b>, calculá f ′(x) y el valor de f ′(${x0}).`,`f ′(x) = ${df}; f ′(${x0}) = ${a*n*x0**(n-1)+b}`]}
 const k=R(1,3);return[`Dada <b>f(x) = ${sum([[1,'x<sup>3</sup>'],[-3*k,'x²']])}</b>, hallá los puntos críticos y clasificalos (máximo o mínimo local).`,`f ′(x) = ${sum([[3,'x²'],[-6*k,'x']])}; x = 0 (máximo local) y x = ${2*k} (mínimo local)`]}
};
const TOPICS=[
{k:'enteros',n:'Números enteros',y:[1,2]},{k:'fracciones',n:'Fracciones',y:[1,2]},
{k:'ecuacion1',n:'Ecuaciones de primer grado',y:[1,2,3]},{k:'proporcionalidad',n:'Proporcionalidad',y:[1,2]},
{k:'porcentaje',n:'Porcentaje',y:[1,2,3]},{k:'geometria',n:'Perímetro y área',y:[1,2,3]},
{k:'potencias',n:'Potencias',y:[2,3]},{k:'pitagoras',n:'Teorema de Pitágoras',y:[2,3,4]},
{k:'funcion_lineal',n:'Función lineal',y:[3,4]},{k:'sistemas',n:'Sistemas de ecuaciones 2×2',y:[3,4]},
{k:'factoreo',n:'Factoreo',y:[3,4]},{k:'estadistica',n:'Estadística',y:[3,4,5,6]},
{k:'probabilidad',n:'Probabilidad',y:[3,4,5,6]},{k:'cuadratica',n:'Ecuación cuadrática',y:[4,5]},
{k:'trigonometria',n:'Trigonometría',y:[4,5]},{k:'exp_log',n:'Exponenciales y logaritmos',y:[5,6]},
{k:'derivadas',n:'Derivadas',y:[6]}];
const DIF=['Fácil','Media','Difícil','Progresiva'];
const G={title:'Evaluación de Matemática',escuela:'',curso:'',fecha:'',anio:3,dif:1,n:6,puntos:10,temas:[],b:false,all:false,sets:null,cur:'A'};

function one(k,d){const[q,a]=GEN[k](d);return{t:k,d,q,a:typeof a==='number'?num(a):a}}
function build(){const out={};['A','B'].forEach(s=>{if(s=='B'&&!G.b)return;out[s]=Array.from({length:G.n},(_,i)=>one(G.temas[i%G.temas.length],G.dif==3?(i<G.n/3?0:i<2*G.n/3?1:2):G.dif))});G.sets=out;G.cur='A'}
function pts(P,n){const u=Math.round(P*2),b=Math.floor(u/n),r=u-b*n;return Array.from({length:n},(_,i)=>(b+(i<r?1:0))/2)}
const tn=k=>TOPICS.find(t=>t.k===k).n;

function readCfg(){
  G.title=$('#g-title').value.trim();G.escuela=$('#g-esc').value.trim();G.curso=$('#g-cur').value.trim();G.fecha=$('#g-fec').value;
  G.anio=+$('#g-anio').value;G.dif=+$('#g-dif').value;G.n=Math.min(20,Math.max(1,+$('#g-n').value||6));
  G.puntos=Math.min(100,Math.max(1,+$('#g-pts').value||10));G.b=$('#g-b').checked;G.all=$('#g-all').checked;
  G.temas=[...document.querySelectorAll('.gt:checked')].map(x=>x.value);
}

function renderGen(){
  const tp=TOPICS.filter(t=>G.all||t.y.includes(+G.anio));
  G.temas=G.temas.filter(k=>tp.some(t=>t.k===k));
  let h=`<div class="top"><h2>Generar examen</h2></div><p class="lead">Elegí el año, los temas, la dificultad y el puntaje. La plataforma arma los ejercicios con números distintos cada vez, y calcula la clave de corrección.</p>`;
  h+=`<div class="item gcfg"><div class="gp"><label>Título del examen</label><input id="g-title" value="${esc(G.title)}">
  <div class="row3"><div><label>Escuela (opcional)</label><input id="g-esc" value="${esc(G.escuela)}"></div><div><label>Curso</label><input id="g-cur" placeholder="3° B" value="${esc(G.curso)}"></div><div><label>Fecha</label><input id="g-fec" type="date" value="${esc(G.fecha)}"></div></div>
  <div class="row3"><div><label>Año</label><select id="g-anio">${[1,2,3,4,5,6].map(a=>`<option value="${a}" ${a==G.anio?'selected':''}>${a}.º año</option>`).join('')}</select></div>
  <div><label>Dificultad</label><select id="g-dif">${DIF.map((x,i)=>`<option value="${i}" ${i==G.dif?'selected':''}>${x}</option>`).join('')}</select></div>
  <div><label>Cantidad de ejercicios</label><input id="g-n" type="number" min="1" max="20" value="${G.n}"></div></div>
  <div class="row3"><div><label>Puntaje total</label><input id="g-pts" type="number" min="1" max="100" step="0.5" value="${G.puntos}"></div></div>
  <label>Temas</label><div class="gtopics">${tp.map(t=>`<label class="chipsel"><input type="checkbox" class="gt" value="${t.k}" ${G.temas.includes(t.k)?'checked':''}><span>${t.n}</span></label>`).join('')}</div>
  <label class="chk"><input type="checkbox" id="g-all" ${G.all?'checked':''}> Mostrar temas de todos los años</label>
  <label class="chk"><input type="checkbox" id="g-b" ${G.b?'checked':''}> Generar también un Tema B (distintos números)</label>
  <div class="acts" style="margin-top:18px"><button class="btn" id="g-go">${G.sets?'Generar de nuevo':'Generar examen'}</button></div></div></div>`;
  if(G.sets){
    const ex=G.sets[G.cur]||G.sets.A,P=pts(G.puntos,ex.length),T=Object.keys(G.sets).length>1?` · Tema ${G.cur}`:'';
    h+=`<div class="gbar noprint">${Object.keys(G.sets).length>1?Object.keys(G.sets).map(s=>`<button class="btn ${s==G.cur?'':'soft'}" data-s="${s}">Tema ${s}</button>`).join(''):''}
    <button class="btn soft" id="g-pe">🖨️ Imprimir examen</button><button class="btn soft" id="g-pk">🖨️ Imprimir clave</button><button class="btn" id="g-sv">Guardar en Evaluaciones</button></div>
    <div class="sheet sheet-exam"><div class="sh-head"><div><b>${esc(G.escuela)}</b><div>Matemática${G.curso?' · '+esc(G.curso):''}</div></div><div>${G.fecha?'Fecha: '+fmt(G.fecha):'Fecha: ____ / ____ / ____'}</div></div>
    <h2>${esc(G.title||'Evaluación')}${T}</h2><div class="sh-line">Nombre y apellido: ______________________________ &nbsp; Nota: ______</div>
    <p class="sh-info">Puntaje total: <b>${num(G.puntos)} puntos</b>. Justificá todos los procedimientos. Se valora la prolijidad y el uso correcto del lenguaje matemático.</p>
    ${ex.map((e,i)=>`<div class="ex"><div class="ex-h"><b>${i+1})</b> <span class="pt">(${num(P[i])} ${P[i]==1?'punto':'puntos'})</span> <button class="rr noprint" data-r="${i}" title="Cambiar este ejercicio">🔄</button></div><div class="ex-q">${e.q}</div><div class="ex-sp" style="height:${60+e.d*30}px"></div></div>`).join('')}</div>
    <div class="sheet sheet-key"><h2>Clave de corrección${T}</h2>${ex.map((e,i)=>`<div class="kr"><b>${i+1})</b> <span class="kt">${tn(e.t)} · ${num(P[i])} pts</span><div>${e.a}</div></div>`).join('')}</div>`;
  }
  $('#main').innerHTML=h;
  $('#g-anio').onchange=$('#g-all').onchange=()=>{readCfg();renderGen()};
  $('#g-go').onclick=()=>{readCfg();if(!G.temas.length){alert('Elegí al menos un tema.');return}build();renderGen()};
  if(!G.sets)return;
  document.querySelectorAll('[data-s]').forEach(b=>b.onclick=()=>{G.cur=b.dataset.s;renderGen()});
  document.querySelectorAll('[data-r]').forEach(b=>b.onclick=()=>{const l=G.sets[G.cur],i=+b.dataset.r;l[i]=one(l[i].t,l[i].d);renderGen()});
  $('#g-pe').onclick=()=>{document.body.classList.remove('pk');window.print()};
  $('#g-pk').onclick=()=>{document.body.classList.add('pk');window.print();setTimeout(()=>document.body.classList.remove('pk'),500)};
  $('#g-sv').onclick=async()=>{readCfgSafe();
    try{const{sets,cur,...cfgG}=G;
      await fs.collection('exams').add({title:G.title||'Examen',curso:G.curso,fecha:G.fecha,tipo:'Escrita',contenidos:G.temas.map(tn).join(', '),criterios:`${G.n} ejercicios, ${num(G.puntos)} puntos en total. Dificultad: ${DIF[G.dif]}.`,notas:'',files:[],created:Date.now(),updated:Date.now(),ejercicios:JSON.stringify({sets,G:cfgG})});
      alert('Guardado en Evaluaciones. Ahí vas a poder reabrirlo con “Abrir examen”.')}
    catch(e){alert('No se pudo guardar. Revisá tu conexión.')}};
}
function readCfgSafe(){try{const s=G.sets,c=G.cur;readCfg();G.sets=s;G.cur=c}catch(e){}}
function openSavedExam(d){try{const o=JSON.parse(d.ejercicios);Object.assign(G,o.G,{sets:o.sets,cur:'A'});tab='gen';render()}catch(e){alert('No se pudo abrir este examen.')}}
