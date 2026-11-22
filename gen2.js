/* Temas nuevos del generador de exámenes:
   - Clasificación de figuras (triángulos y cuadriláteros)
   - Ángulos: complementarios, suplementarios, opuestos por el vértice
   - Ángulos entre paralelas
   - Temas combinados: perímetro y área con ecuaciones, Pitágoras con ecuaciones,
     ejercicios combinados (enteros, potencias, raíces y propiedad distributiva)
   Las respuestas se calculan por código; si un ejercicio no cumple las condiciones, se vuelve a sortear. */
(function(){
const need=c=>{if(!c)throw {gx:1}};
const mk=fn=>()=>{for(let i=0;i<80;i++){try{return fn()}catch(e){if(!(e&&e.gx))throw e}}throw new Error('No se pudo armar el ejercicio')};
const def=(k,pools)=>{GEN[k]=d=>PK(pools[Math.min(d,pools.length-1)])()};
const sg2=n=>n<0?`− ${-n}`:`+ ${n}`;
const sb=(l,t)=>`<div class="sub"><b>${l})</b> ${t}</div>`;
const cx=k=>k===1?'x':k===-1?'−x':num(k)+'x';
const deg=e=>/[+−]/.test(e)?`(${e})°`:`${e}°`;
const f1=n=>Math.round(n*10)/10;
const S=(w,h,inner)=>`<svg class="fig" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" font-family="Nunito Sans,Arial,sans-serif" font-size="13" role="img" aria-hidden="true">${inner}</svg>`;
const T=(x,y,t,a)=>`<text x="${f1(x)}" y="${f1(y)}" text-anchor="${a||'middle'}" fill="currentColor" stroke="none">${t}</text>`;
const L=(x1,y1,x2,y2,dash)=>`<line x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}"${dash?' stroke-dasharray="5 4"':''}/>`;
const LETTERS='abcdefgh';

/* ---------- figuras propias ---------- */
// Triángulo a partir de sus lados (a ≤ b ≤ c). Marca lados iguales y ángulo recto.
function triSides(a,b,c,lab){
  [a,b,c]=[a,b,c].sort((x,y)=>x-y);
  const x=(b*b+c*c-a*a)/(2*c),y=Math.sqrt(Math.max(0.01,b*b-x*x)),sc=Math.min(170/c,105/y),X0=30,Y0=125;
  const A=[X0,Y0],B=[X0+c*sc,Y0],C=[X0+x*sc,Y0-y*sc];
  const tk=(P,Q)=>{const m=[(P[0]+Q[0])/2,(P[1]+Q[1])/2],dx=Q[0]-P[0],dy=Q[1]-P[1],l=Math.hypot(dx,dy),nx=-dy/l*4,ny=dx/l*4;return L(m[0]-nx,m[1]-ny,m[0]+nx,m[1]+ny)};
  let s=`<polygon points="${A.map(f1)} ${B.map(f1)} ${C.map(f1)}"/>`;
  if(a===b||a===c) s+=tk(C,B);
  if(a===b||b===c) s+=tk(A,C);
  if(b===c||a===c) s+=tk(A,B);
  if(a*a+b*b===c*c){const ux=[(A[0]-C[0]),(A[1]-C[1])],vx=[(B[0]-C[0]),(B[1]-C[1])],lu=Math.hypot(...ux),lv=Math.hypot(...vx),u=[ux[0]/lu*10,ux[1]/lu*10],v=[vx[0]/lv*10,vx[1]/lv*10];s+=`<path d="M${f1(C[0]+u[0])} ${f1(C[1]+u[1])} L${f1(C[0]+u[0]+v[0])} ${f1(C[1]+u[1]+v[1])} L${f1(C[0]+v[0])} ${f1(C[1]+v[1])}" stroke-width="1.2"/>`}
  const nm=v=>lab?lab(v):`${v} cm`;
  s+=T((A[0]+B[0])/2,Y0+17,nm(c))+T((A[0]+C[0])/2-12,(A[1]+C[1])/2-3,nm(b),'end')+T((B[0]+C[0])/2+12,(B[1]+C[1])/2-3,nm(a),'start');
  return S(Math.round(X0+c*sc+60),Y0+26,s);
}
// Rectángulo con etiquetas de texto
function rectLab(top,side){return S(250,120,`<rect x="30" y="26" width="150" height="70"/>`+T(105,18,top)+T(188,66,side,'start'))}
// Triángulo isósceles con etiquetas de texto (lados iguales marcados)
function triLab(eqL,base){const A=[24,104],B=[196,104],C=[110,20];
  const tk=(P,Q)=>{const m=[(P[0]+Q[0])/2,(P[1]+Q[1])/2],dx=Q[0]-P[0],dy=Q[1]-P[1],l=Math.hypot(dx,dy),nx=-dy/l*4,ny=dx/l*4;return L(m[0]-nx,m[1]-ny,m[0]+nx,m[1]+ny)};
  return S(250,126,`<polygon points="${A} ${B} ${C}"/>`+tk(A,C)+tk(C,B)+T(52,50,eqL,'end')+T(168,50,eqL,'start')+T(110,121,base))}
// Dos rectas que se cortan: etiquetas en los cuatro ángulos (derecha, arriba, izquierda, abajo)
function crossFig(r,t,l,b){const O=[110,70],a=30*Math.PI/180,dx=Math.cos(a)*85,dy=Math.sin(a)*85;
  return S(230,140,L(O[0]-dx,O[1]+dy,O[0]+dx,O[1]-dy)+L(O[0]-dx,O[1]-dy,O[0]+dx,O[1]+dy)+T(O[0]+26,O[1]+4,r,'start')+T(O[0],O[1]-30,t)+T(O[0]-26,O[1]+4,l,'end')+T(O[0],O[1]+42,b))}
// Dos paralelas cortadas por una transversal. Etiquetas: {'P-UR':'..', ...}
const POS=['P-UR','P-UL','P-LL','P-LR','Q-UR','Q-UL','Q-LL','Q-LR'];
function parFig(lab){
  const y1=66,y2=126,P=[170,y1],dx=-.45,dy=.89,t=(y2-y1)/dy,Q=[P[0]+dx*t,y2];
    let s=L(14,y1,266,y1)+L(14,y2,266,y2)+L(P[0]-dx*36,P[1]-dy*36,Q[0]+dx*36,Q[1]+dy*36)+T(278,y1+4,'r','start')+T(278,y2+4,'s','start')+T(P[0]-dx*36+8,P[1]-dy*36+2,'t','start');
  const OFF={UR:[14,-8,'start'],UL:[-14,-8,'end'],LL:[-14,18,'end'],LR:[14,18,'start']};
  POS.forEach(p=>{if(!lab[p])return;const[v,q]=p.split('-'),V=v==='P'?P:Q,o=OFF[q];s+=T(V[0]+o[0],V[1]+o[1],String(lab[p]),o[2])});
  return S(300,170,s);
}

/* ---------- relaciones entre ángulos con paralelas ---------- */
const acuteP=p=>/UR|LL/.test(p.split('-')[1]);
function rel(p,q){
  const[v1,a1]=p.split('-'),[v2,a2]=q.split('-');
  const nb={UR:['UL','LR'],UL:['UR','LL'],LL:['UL','LR'],LR:['UR','LL']},op={UR:'LL',LL:'UR',UL:'LR',LR:'UL'};
  if(v1===v2){if(op[a1]===a2)return{n:'opuestos por el vértice',eq:1};if(nb[a1].includes(a2))return{n:'adyacentes (suplementarios)',eq:0};return null}
  if(a1===a2)return{n:'correspondientes',eq:1};
  const intr=(v,a)=>v==='P'?(a==='LL'||a==='LR'):(a==='UL'||a==='UR'),left=a=>a==='UL'||a==='LL',i1=intr(v1,a1),i2=intr(v2,a2);
  if(i1&&i2)return left(a1)!==left(a2)?{n:'alternos internos',eq:1}:{n:'conjugados internos',eq:0};
  if(!i1&&!i2)return left(a1)!==left(a2)?{n:'alternos externos',eq:1}:{n:'conjugados externos',eq:0};
  return null;
}
const PAIRS=[];POS.forEach(p=>POS.forEach(q=>{if(p<q){const r=rel(p,q);if(r)PAIRS.push([p,q,r])}}));
const valOf=(p,A)=>acuteP(p)?A:180-A;

/* ================= Clasificación de figuras ================= */
const clsLados=(a,b,c)=>a===b&&b===c?'equilátero':(a===b||b===c||a===c)?'isósceles':'escaleno';
const clsAng=(a,b,c)=>{const[x,y,z]=[a,b,c].sort((p,q)=>p-q),d=x*x+y*y-z*z;return d===0?'rectángulo':d>0?'acutángulo':'obtusángulo'};
const clsAngDeg=(A,B,C)=>Math.max(A,B,C)===90?'rectángulo':Math.max(A,B,C)<90?'acutángulo':'obtusángulo';
const TRIS=[[3,3,3],[4,4,4],[5,5,5],[6,6,6],[5,5,6],[6,6,5],[7,7,5],[4,4,3],[5,5,8],[6,6,10],[7,7,11],[5,6,7],[4,5,6],[6,7,9],[3,4,5],[6,8,10],[5,12,13],[8,15,17],[3,4,6],[4,5,8],[3,5,7],[2,3,4]];
const FALSE_TRUE=[
['Todo cuadrado es un rectángulo.',1],['Todo rombo es un cuadrado.',0],['Un trapecio tiene dos pares de lados paralelos.',0],['Los cuatro lados de un rombo son iguales.',1],
['Todo rectángulo es un paralelogramo.',1],['Un romboide tiene sus cuatro lados iguales.',0],['Las diagonales de un rectángulo son perpendiculares.',0],['Todo cuadrado es un rombo.',1],
['Un paralelogramo tiene dos pares de lados paralelos.',1],['Un trapecio rectángulo tiene dos ángulos rectos.',1],['Los ángulos opuestos de un paralelogramo son iguales.',1],['Un rectángulo tiene los cuatro lados iguales.',0],
['Un triángulo rectángulo puede tener un ángulo obtuso.',0],['Un triángulo puede tener dos ángulos rectos.',0],['Un triángulo escaleno tiene tres lados distintos.',1],
['Un triángulo acutángulo tiene los tres ángulos agudos.',1]];
const FIGDESC=[
['Tiene los cuatro lados iguales y los cuatro ángulos rectos.','cuadrado'],['Tiene los cuatro lados iguales y los ángulos no son rectos.','rombo'],
['Tiene los lados opuestos iguales y paralelos y los cuatro ángulos rectos, pero los lados contiguos son distintos.','rectángulo'],
['Tiene los lados opuestos paralelos e iguales, los ángulos no son rectos y los lados contiguos son distintos.','romboide'],
['Tiene un solo par de lados paralelos.','trapecio'],['Tiene un solo par de lados paralelos y dos ángulos rectos.','trapecio rectángulo'],
['Tiene un solo par de lados paralelos y los otros dos lados son iguales.','trapecio isósceles']];

def('clas_fig',[
 [mk(()=>{const t=PK(TRIS.slice(0,22)),s=shufT(t);return[`Observá el triángulo de la figura y clasificalo <b>según sus lados</b> y <b>según sus ángulos</b>. Las marcas iguales indican lados iguales.${sb('a','Según sus lados: '+'<span class="blank"></span>')}${sb('b','Según sus ángulos: '+'<span class="blank"></span>')}`,`a) ${clsLados(...t)}; b) ${clsAng(...t)}`,triSides(...s)]}),
  mk(()=>{const a=R(3,9),m=R(3,7),L1=[a,a,a],L2=[m,m,m+R(1,m-1)],L3=PK([[3,4,5],[4,5,6],[5,6,7],[3,5,7],[6,7,9],[4,6,8]]);const g=shufT([L1,L2,L3]);
   return[`Clasificá cada triángulo según la medida de sus lados (equilátero, isósceles o escaleno):${g.map((t,i)=>sb('abc'[i],`lados de ${shufT(t).join(' cm, ')} cm: <span class="blank"></span>`)).join('')}`,g.map((t,i)=>`${'abc'[i]}) ${clsLados(...t)}`).join('; ')]})],
 [mk(()=>{const A=R(30,80),B=R(30,80),C=180-A-B;need(C>10&&A!==B&&B!==C&&A!==C);const mx=Math.max(A,B,C);
   return[`Un triángulo tiene dos ángulos de <b>${A}°</b> y <b>${B}°</b>. a) Calculá la medida del tercer ángulo. b) Clasificá el triángulo según sus ángulos. c) Clasificalo según sus lados.`,`a) 180° − ${A}° − ${B}° = ${C}°; b) ${clsAngDeg(A,B,C)}; c) como los tres ángulos son distintos, es escaleno`]}),
  mk(()=>{const A=PK([30,40,50,35,25,20]),opt=R(0,2);let a,b,c;if(opt==0){a=A;b=A;c=180-2*A}else if(opt==1){a=60;b=60;c=60}else{a=45;b=45;c=90}
   return[`Un triángulo tiene dos ángulos de <b>${a}°</b> y <b>${b}°</b>. a) Calculá el tercer ángulo. b) Clasificá el triángulo según sus ángulos. c) Clasificalo según sus lados (recordá que a ángulos iguales se oponen lados iguales).`,`a) ${c}°; b) ${clsAngDeg(a,b,c)}; c) ${a===c?'equilátero':'isósceles'}`]}),
  mk(()=>{const g=shufT(FALSE_TRUE).slice(0,4);return[`Indicá si cada afirmación es verdadera (V) o falsa (F). <b>Justificá las falsas.</b>${g.map((x,i)=>sb('abcd'[i],`${x[0]} <span class="blank" style="min-width:60px"></span>`)).join('')}`,g.map((x,i)=>`${'abcd'[i]}) ${x[1]?'V':'F'}`).join('; ')+' (las falsas se justifican con un contraejemplo o con la definición de la figura).']})],
 [mk(()=>{const g=shufT([[3,4,8],[5,5,10],[4,6,9],[6,6,6],[2,3,7],[5,7,8],[4,4,7]]).slice(0,4);
   const row=t=>{const[a,b,c]=[...t].sort((x,y)=>x-y);return a+b>c?`Sí existe. Según sus lados es ${clsLados(a,b,c)} y según sus ángulos es ${clsAng(a,b,c)}.`:`No existe: ${a} + ${b} = ${a+b} no es mayor que ${c}.`};
   return[`Para cada terna de medidas (en cm), decidí si es posible construir un triángulo (la suma de los dos lados menores debe ser mayor que el lado mayor). Si existe, clasificalo según sus lados y según sus ángulos.${g.map((t,i)=>sb('abcd'[i],`${t.join(' cm, ')} cm`)).join('')}`,g.map((t,i)=>`${'abcd'[i]}) ${row(t)}`).join('<br>')]}),
  mk(()=>{const g=shufT(FIGDESC).slice(0,3);return[`Escribí el nombre de la figura que cumple cada descripción:${g.map((x,i)=>sb('abc'[i],`${x[0]} <span class="blank"></span>`)).join('')}`,g.map((x,i)=>`${'abc'[i]}) ${x[1]}`).join('; ')]})]
]);

/* ================= Ángulos: complementarios, suplementarios, opuestos ================= */
// Busca a y b (a de 1 a 6, |b| ≤ 40) tales que a·x + b = m
const fit=(m,x,excl)=>{const o=[];for(let a=1;a<=6;a++){const b=m-a*x;if(Math.abs(b)<=40&&a!==excl)o.push([a,b])}need(o.length);return PK(o)};
def('angulos_rel',[
 [mk(()=>{const g=[R(15,40),R(45,80),R(100,160)];const ro=a=>`complemento: ${a<90?(90-a)+'°':'no tiene (mide más de 90°)'}; suplemento: ${180-a}°; opuesto por el vértice: ${a}°`;
   return[`Completá para cada ángulo: su complemento, su suplemento y el ángulo opuesto por el vértice.${g.map((a,i)=>sb('abc'[i],`Ángulo de <b>${a}°</b> → complemento: <span class="blank" style="min-width:60px"></span> &nbsp; suplemento: <span class="blank" style="min-width:60px"></span> &nbsp; opuesto: <span class="blank" style="min-width:60px"></span>`)).join('')}`,g.map((a,i)=>`${'abc'[i]}) ${ro(a)}`).join('<br>')]}),
  mk(()=>{const a=R(15,80),b=R(20,160),c=R(30,150);return[`Resolvé: ${sb('a',`Dos ángulos son <b>complementarios</b> y uno mide ${a}°. ¿Cuánto mide el otro?`)}${sb('b',`Dos ángulos son <b>suplementarios</b> y uno mide ${b}°. ¿Cuánto mide el otro?`)}${sb('c',`Dos ángulos son <b>opuestos por el vértice</b> y uno mide ${c}°. ¿Cuánto mide el otro?`)}`,`a) ${90-a}°; b) ${180-b}°; c) ${c}°`]})],
 [mk(()=>{const kind=PK(['comp','sup','opu']),x=R(5,25),tot=kind==='comp'?90:180,m1=kind==='opu'?R(25,150):R(15,tot-15);
   const[a,b]=fit(m1,x),[c,d]=kind==='opu'?fit(m1,x,a):fit(tot-m1,x),m2=kind==='opu'?m1:tot-m1;need(a*x+b===m1&&c*x+d===m2);
   const e1=lin(a,b),e2=lin(c,d),nm=kind==='comp'?'complementarios':kind==='sup'?'suplementarios':'opuestos por el vértice';
   const sol=kind==='opu'?`${e1} = ${e2} → ${cx(a-c)} = ${num(d-b)} → x = ${x}`:`(${e1}) + (${e2}) = ${tot} → ${cx(a+c)} ${sg2(b+d)} = ${tot} → ${cx(a+c)} = ${tot-b-d} → x = ${x}`;
   return[`Dos ángulos <b>${nm}</b> miden <b>(${e1})°</b> y <b>(${e2})°</b>. Planteá una ecuación, hallá x y calculá la medida de cada ángulo.`,`${sol}. Los ángulos miden ${m1}° y ${m2}°.`,kind==='opu'?crossFig(deg(e1),'',deg(e2),''):'']}),
  mk(()=>{const x=R(5,25),m1=PK([40,50,60,70,110,120,130]),[a,b]=fit(m1,x),[c,d]=fit(180-m1,x);
   const e1=lin(a,b),e2=lin(c,d);return[`Dos rectas se cortan y forman los ángulos de la figura. Los ángulos <b>adyacentes</b> de la derecha y de arriba miden (${e1})° y (${e2})°. a) Planteá y resolvé la ecuación para hallar x. b) Calculá la medida de los cuatro ángulos.`,`(${e1}) + (${e2}) = 180 → ${cx(a+c)} ${sg2(b+d)} = 180 → x = ${x}. Ángulos: ${m1}° y ${180-m1}°; los opuestos por el vértice miden lo mismo: ${m1}°, ${180-m1}°, ${m1}°, ${180-m1}°.`,crossFig(deg(e1),deg(e2),'','')]})],
 [mk(()=>{const x=R(5,25),m=PK([35,40,50,55,65,70,110,125,140]),[a,b]=fit(m,x),[c,d]=fit(m,x,a);const eR=lin(a,b),eL=lin(c,d);
   return[`Las rectas de la figura se cortan. Los ángulos <b>opuestos por el vértice</b> de la derecha y de la izquierda miden (${eR})° y (${eL})°. a) Hallá x. b) Calculá la medida de los cuatro ángulos de la figura.`,`${eR} = ${eL} → ${cx(a-c)} = ${num(d-b)} → x = ${x}. Derecha e izquierda: ${m}°; arriba y abajo (adyacentes, suplementarios): ${180-m}° cada uno.`,crossFig(deg(eR),'',deg(eL),'')]}),
  mk(()=>{const k=PK([3,4,6,7]),A=90*(k-2)/(k-1);need(Number.isInteger(A));return[`El suplemento de un ángulo es <b>${k} veces</b> su complemento. ¿Cuánto mide el ángulo? (Llamá x al ángulo: su suplemento es 180° − x y su complemento es 90° − x).`,`180 − x = ${k}·(90 − x) → 180 − x = ${90*k} − ${k}x → ${k-1}x = ${90*k-180} → x = ${A}°`]}),
  mk(()=>{const k=PK([2,4,5,9]),A=90*k/(k+1);need(Number.isInteger(A));return[`Un ángulo mide <b>${k} veces</b> su complemento. ¿Cuánto mide el ángulo y cuánto mide su complemento? (Llamá x al ángulo: su complemento es 90° − x).`,`x = ${k}·(90 − x) → x = ${90*k} − ${k}x → ${k+1}x = ${90*k} → x = ${A}°; el complemento mide ${90-A}°`]})]
]);

/* ================= Ángulos entre paralelas ================= */
def('angulos_par',[
 [mk(()=>{const A=R(4,8)*10,given=PK(POS),others=shufT(PAIRS.filter(p=>p[0]===given||p[1]===given)).slice(0,3);need(others.length>=3);
   const tg=others.map(p=>p[0]===given?p[1]:p[0]),lab={};POS.forEach((p,i)=>lab[p]=LETTERS[i]);lab[given]=(acuteP(given)?A:180-A)+'°';
   const res=tg.map(p=>{const r=rel(given,p);return`${LETTERS[POS.indexOf(p)]} = ${acuteP(p)?A:180-A}° (${r.n})`});
   return[`En la figura, las rectas <b>r</b> y <b>s</b> son paralelas y t es una transversal. Un ángulo mide ${lab[given]}. Calculá la medida de los ángulos <b>${tg.map(p=>LETTERS[POS.indexOf(p)]).join(', ')}</b> y escribí qué relación hay entre cada uno y el ángulo dado.`,res.join('<br>'),parFig(lab)]})],
 [mk(()=>{const pair=PK(PAIRS.filter(p=>p[2].eq)),x=R(5,25),m=valOf(pair[0],R(4,8)*10),[a,b]=fit(m,x),[c,d]=fit(m,x,a);
   const e1=lin(a,b),e2=lin(c,d),lab={};lab[pair[0]]=deg(e1);lab[pair[1]]=deg(e2);
   return[`En la figura, r ∥ s. Los dos ángulos marcados son <b>${pair[2].n}</b>. a) ¿Cómo son entre sí (iguales o suplementarios)? b) Planteá una ecuación y hallá x. c) Calculá la medida de los dos ángulos.`,`a) Iguales (por ser ${pair[2].n}). b) ${e1} = ${e2} → ${cx(a-c)} = ${num(d-b)} → x = ${x}. c) Los dos miden ${m}°.`,parFig(lab)]}),
  mk(()=>{const pair=PK(PAIRS.filter(p=>!p[2].eq)),x=R(5,25),m1=valOf(pair[0],R(4,8)*10),m2=180-m1,[a,b]=fit(m1,x),[c,d]=fit(m2,x);
   const e1=lin(a,b),e2=lin(c,d),lab={};lab[pair[0]]=deg(e1);lab[pair[1]]=deg(e2);
   return[`En la figura, r ∥ s. Los dos ángulos marcados son <b>${pair[2].n}</b>, es decir, suman 180°. Planteá la ecuación, hallá x y calculá la medida de cada ángulo.`,`(${e1}) + (${e2}) = 180 → ${cx(a+c)} ${sg2(b+d)} = 180 → x = ${x}. Los ángulos miden ${m1}° y ${m2}°.`,parFig(lab)]})],
 [mk(()=>{const pair=PK(PAIRS.filter(p=>p[2].eq)),x=R(5,25),m=valOf(pair[0],R(4,8)*10),[a,b]=fit(m,x),[c,d]=fit(m,x,a);
   const free=POS.filter(p=>!pair.slice(0,2).includes(p)),z=PK(free),rz=rel(pair[0],z);need(rz);const mz=rz.eq?valOf(z,acuteP(pair[0])?m:180-m):0;
   const mA=acuteP(pair[0])?m:180-m,mzz=acuteP(z)?mA:180-mA;
   const e1=lin(a,b),e2=lin(c,d),lab={};lab[pair[0]]=deg(e1);lab[pair[1]]=deg(e2);lab[z]='z';
   return[`En la figura, r ∥ s. a) Hallá x sabiendo que los ángulos marcados con expresiones son <b>${pair[2].n}</b>. b) Calculá la medida del ángulo <b>z</b> y explicá qué propiedad usaste.`,`a) ${e1} = ${e2} → ${cx(a-c)} = ${num(d-b)} → x = ${x}; los ángulos miden ${m}°. b) z = ${mzz}°, porque z y el ángulo de (${e1})° son ${rz.n.replace(/ \(.*\)/,'')}${rz.eq?' (iguales)':' (suman 180°)'}.`,parFig(lab)]}),
  mk(()=>{const x=R(5,25),m1=R(4,8)*10,m2=180-m1,[a,b]=fit(m1,x),[c,d]=fit(m2,x);
   const e1=lin(a,b),e2=lin(c,d),r=rel('P-UR','Q-LL'),lab={'P-UR':deg(e1),'Q-LR':deg(e2),'Q-LL':'y'};
   return[`En la figura, r ∥ s. Los ángulos <b>(${e1})°</b> y <b>(${e2})°</b> son conjugados externos (suman 180°). a) Hallá x. b) Calculá la medida del ángulo <b>y</b> y decí qué relación tiene con el ángulo de (${e1})°.`,`a) (${e1}) + (${e2}) = 180 → ${cx(a+c)} ${sg2(b+d)} = 180 → x = ${x}; los ángulos miden ${m1}° y ${m2}°. b) y = ${m1}°, porque y y el ángulo de (${e1})° son ${r.n} (iguales).`,parFig(lab)]})]
]);

/* ================= Perímetro y área con ecuaciones ================= */
const COSA=['terreno','jardín','patio','cancha','huerta'];
def('comb_geo_ec',[
 [mk(()=>{const x=R(2,12),a=R(1,6),w=R(2,8),P=2*(x+a+w);return[`El largo de un rectángulo mide <b>(x + ${a}) cm</b> y su ancho mide <b>${w} cm</b>. Si su perímetro es de <b>${P} cm</b>, planteá una ecuación y hallá x. Después calculá el área del rectángulo.`,`2 · [(x + ${a}) + ${w}] = ${P} → x + ${a+w} = ${P/2} → x = ${x}. Largo = ${x+a} cm; área = ${x+a} · ${w} = ${(x+a)*w} cm²`,rectLab(`x + ${a}`,`${w} cm`)]}),
  mk(()=>{const x=R(1,9),k=R(2,4),b=R(1,6),l=k*x+b,P=4*l;return[`El lado de un cuadrado mide <b>(${k}x + ${b}) cm</b> y su perímetro es de <b>${P} cm</b>. Hallá x, la medida del lado y el área del cuadrado.`,`4 · (${k}x + ${b}) = ${P} → ${k}x + ${b} = ${l} → x = ${x}. Lado = ${l} cm; área = ${l*l} cm²`]})],
 [mk(()=>{const x=R(2,10),p=R(2,3),a=R(1,5),b=R(1,5),L1=p*x+a,W=x+b,P=2*(L1+W);return[`Un rectángulo tiene un largo de <b>(${p}x + ${a}) cm</b> y un ancho de <b>(x + ${b}) cm</b>. Su perímetro es de <b>${P} cm</b>. Planteá la ecuación, hallá x y calculá las medidas de los lados y el área.`,`2 · [(${p}x + ${a}) + (x + ${b})] = ${P} → ${p+1}x + ${a+b} = ${P/2} → x = ${x}. Largo = ${L1} cm; ancho = ${W} cm; área = ${L1*W} cm²`,rectLab(`${p}x + ${a}`,`x + ${b}`)]}),
  mk(()=>{const p=R(2,3),x=R(3,9),a=R(1,3),b=R(2,6),eq=p*x-a,base=x+b;need(2*eq>base&&eq>0&&eq!==base);const P=2*eq+base;return[`Un triángulo isósceles tiene dos lados iguales de <b>(${p}x − ${a}) cm</b> cada uno y la base mide <b>(x + ${b}) cm</b>. Su perímetro es de <b>${P} cm</b>. Hallá x y las medidas de los tres lados.`,`2 · (${p}x − ${a}) + (x + ${b}) = ${P} → ${2*p+1}x ${sg2(b-2*a)} = ${P} → x = ${x}. Lados iguales: ${eq} cm; base: ${base} cm`,triLab(`${p}x − ${a}`,`x + ${b}`)]}),
  mk(()=>{const w=R(4,12),L1=R(w+2,30),A=w*L1,c=PK(COSA);return[`Un ${c} rectangular tiene <b>${w} m</b> de ancho y una superficie de <b>${A} m²</b>. Planteá una ecuación para hallar el largo x, resolvela y calculá cuántos metros de alambre se necesitan para cercarlo (el perímetro).`,`${w} · x = ${A} → x = ${A} ÷ ${w} = ${L1} m. Perímetro = 2 · (${w} + ${L1}) = ${2*(w+L1)} m`]})],
 [mk(()=>{const k=R(1,6),x=R(3,12),P=2*(3*x+k),c=PK(COSA);return[`El largo de un ${c} rectangular excede en <b>${k} m</b> al doble de su ancho. Si para cercarlo se usaron <b>${P} m</b> de alambre, ¿cuáles son sus dimensiones? Calculá también su superficie. (Llamá x al ancho.)`,`Largo = 2x + ${k}. Perímetro: 2 · [x + (2x + ${k})] = ${P} → 6x + ${2*k} = ${P} → x = ${x}. Ancho = ${x} m; largo = ${2*x+k} m; superficie = ${x*(2*x+k)} m²`,rectLab(`2x + ${k}`,'x')]}),
  mk(()=>{let x,a,c;do{x=R(4,15);a=R(1,3);c=(x+4*a)/3}while(!Number.isInteger(c)||c<1);need(c!==a);return[`Un cuadrado de lado <b>(x + ${a}) cm</b> y un triángulo equilátero de lado <b>(x + ${c}) cm</b> tienen el mismo perímetro. Hallá x y calculá ese perímetro.`,`4 · (x + ${a}) = 3 · (x + ${c}) → 4x + ${4*a} = 3x + ${3*c} → x = ${3*c-4*a}. Perímetro = 4 · (${x} + ${a}) = ${4*(x+a)} cm`]})]
]);

/* ================= Pitágoras con ecuaciones ================= */
const PYT=[[3,4,5],[5,12,13],[8,15,17],[7,24,25],[6,8,10],[9,12,15],[12,16,20],[20,21,29]];
def('pit_ec',[
 [mk(()=>{const[a,b,c]=PK(PYT.slice(0,4));const k=R(1,2);return[`En el triángulo rectángulo de la figura, un cateto mide x, el otro mide ${a*k} cm y la hipotenusa mide ${c*k} cm. Planteá la ecuación del teorema de Pitágoras y resolvela para hallar x.`,`x² + ${a*k}² = ${c*k}² → x² = ${(c*k)**2} − ${(a*k)**2} = ${(b*k)**2} → x = ${b*k} cm`,FIG.rtri(b*k,a*k,{b:'x',l:`${a*k} cm`,h:`${c*k} cm`})]}),
  mk(()=>{const[a,b,c]=PK(PYT.slice(0,4)),k=R(1,5);return[`Los catetos de un triángulo rectángulo miden <b>${a}x</b> y <b>${b}x</b> (en cm) y la hipotenusa mide <b>${c*k} cm</b>. Planteá una ecuación y hallá x.`,`(${a}x)² + (${b}x)² = ${c*k}² → ${a*a+b*b}x² = ${(c*k)**2} → x² = ${k*k} → x = ${k}. Los catetos miden ${a*k} cm y ${b*k} cm`]})],
 [mk(()=>{const[a,b,c]=PK(PYT.slice(0,4)),k=R(1,4);return[`Una pantalla rectangular tiene lados de <b>${a}x</b> cm y <b>${b}x</b> cm, y su diagonal mide <b>${c*k} cm</b>. Hallá x, las dimensiones de la pantalla, su perímetro y su área.`,`(${a}x)² + (${b}x)² = ${c*k}² → ${a*a+b*b}x² = ${(c*k)**2} → x = ${k}. Dimensiones: ${a*k} cm × ${b*k} cm; perímetro = ${2*(a+b)*k} cm; área = ${a*b*k*k} cm²`]}),
  mk(()=>{const[a,b,c]=PK(PYT.slice(0,4)),k=R(1,3);return[`Los catetos de un triángulo rectángulo miden <b>${a}x</b> cm y <b>${b}x</b> cm, y su hipotenusa mide <b>${c*k} cm</b>. Hallá x y calculá el perímetro y el área del triángulo.`,`${a*a+b*b}x² = ${(c*k)**2} → x = ${k}. Catetos: ${a*k} y ${b*k} cm; perímetro = ${(a+b+c)*k} cm; área = ${a*b*k*k/2} cm²`]})],
 [mk(()=>{const[a,b,c]=PK(PYT);const d=b-a;need(d>0&&d<=17);return[`En un triángulo rectángulo, el cateto menor mide <b>x</b> cm, el cateto mayor mide <b>(x + ${d}) cm</b> y la hipotenusa mide <b>${c} cm</b>. Planteá la ecuación, resolvela y hallá la medida de los tres lados.`,`x² + (x + ${d})² = ${c}² → 2x² + ${2*d}x ${sg2(d*d-c*c)} = 0 → x² + ${d}x − ${a*b} = 0 → (x − ${a})(x + ${b}) = 0. x = ${a} (la otra solución, −${b}, no sirve porque una longitud no puede ser negativa). Lados: ${a} cm, ${b} cm y ${c} cm`,FIG.rtri(b,a,{b:`x + ${d}`,l:'x',h:`${c} cm`})]}),
  mk(()=>{const t=PK([[3,4,5,'x','x + 1','x + 2',1],[5,12,13,'x','x + 7','x + 8',7],[7,24,25,'x','x + 17','x + 18',17]]);return[`Las medidas de los lados de un triángulo rectángulo son <b>${t[3]}</b>, <b>${t[4]}</b> y <b>${t[5]}</b> (en cm), siendo ${t[5]} la hipotenusa. Hallá x y las medidas de los tres lados.`,`x² + (${t[4]})² = (${t[5]})² → x² − 2x − ${t[0]*(t[0]-2)} = 0 → (x − ${t[0]})(x + ${t[0]-2}) = 0 → x = ${t[0]} (la otra solución, −${t[0]-2}, es negativa y no sirve). Lados: ${t[0]} cm, ${t[1]} cm y ${t[2]} cm`]})]
]);

/* ================= Ejercicios combinados ================= */
const rsq=()=>R(2,12);
const nzr=(a,b)=>{let x;do{x=R(a,b)}while(!x);return x};
const TPL0=[
 ()=>{const a=nzr(-8,8),b=nzr(-9,9),c=nzr(-9,9),d=nzr(-9,9);return[`${num(a)} · (${num(b)} ${sg2(c)}) ${sg2(-d)}`,a*(b+c)-d]},
 ()=>{const a=nzr(-9,9),b=nzr(-9,9),c=nzr(-6,6),d=R(2,6);return[`(${num(a)} − ${pn(b)}) · ${pn(c)} + ${d}<sup>2</sup>`,(a-b)*c+d*d]},
 ()=>{const a=R(2,9),b=nzr(-9,9),c=nzr(-9,9);return[`${a}<sup>2</sup> − ${pn(b)} · ${pn(c)}`,a*a-b*c]},
 ()=>{const a=R(2,9),b=nzr(-6,6),c=nzr(-9,9),d=nzr(-9,9);return[`${num(-a)} + ${pn(b)} · (${num(c)} − ${pn(d)})`,-a+b*(c-d)]}];
const TPL1=[
 ()=>{const s=rsq(),a=R(2,6),b=nzr(-6,6),c=nzr(-6,6);return[`√${s*s} + (${num(-a)})<sup>2</sup> − ${pn(b)} · ${pn(c)}`,s+a*a-b*c]},
 ()=>{const a=nzr(-6,6),b=R(2,6),c=R(1,20),d=nzr(-9,9);return[`${pn(a)} · (${b}<sup>2</sup> − ${c}) ${sg2(d)}`,a*(b*b-c)+d]},
 ()=>{const a=R(2,4),s=rsq(),b=nzr(-6,6);return[`(${num(-a)})<sup>3</sup> + √${s*s} · ${pn(b)}`,-(a**3)+s*b]},
 ()=>{const a=nzr(-6,6),b=nzr(-9,9),c=nzr(-9,9),d=R(2,5);return[`${pn(a)} · (${num(b)} − ${pn(c)}) − (${num(-d)})<sup>2</sup>`,a*(b-c)-d*d]},
 ()=>{const s=R(5,12),t=R(2,s-1),a=R(2,6);return[`√${s*s} − √${t*t} · ${a}`,s-t*a]},
 ()=>{const a=nzr(-6,6),b=nzr(-9,9),c=R(1,9),d=nzr(-9,9);return[`${pn(a)} · (${num(b)} − ${c} ${sg2(d)})`,a*(b-c+d)]}];
const TPL2=[
 ()=>{const a=nzr(-6,6),b=nzr(-9,9),c=nzr(-9,9),d=R(2,6),e=PK([2,3,4,5,-2,-3]),s=rsq();const inner=a*(b-c)-d*d;need(inner%e===0);return[`[${pn(a)} · (${num(b)} − ${pn(c)}) − ${d}<sup>2</sup>] ÷ ${pn(e)} + √${s*s}`,inner/e+s]},
 ()=>{const a=nzr(-9,9),b=nzr(-9,9),c=nzr(-6,6),d=nzr(-9,9),s=rsq();need(a!==b);return[`(${num(a)} − ${pn(b)})<sup>2</sup> − ${pn(c)} · (${num(d)} − √${s*s})`,(a-b)**2-c*(d-s)]},
 ()=>{const a=R(2,6),b=nzr(-6,6),c=nzr(-9,9),d=nzr(-9,9);return[`−${a}<sup>2</sup> + (−${a})<sup>2</sup> + ${pn(b)} · (${num(c)} ${sg2(d)})`,b*(c+d)]},
 ()=>{const[a,b,c]=PK([[3,4,5],[5,12,13],[8,15,17]]),k=R(1,3),m=nzr(-6,6),d=nzr(-9,9),e=nzr(-9,9);return[`√(${(a*k)**2} + ${(b*k)**2}) − ${pn(m)} · (${num(d)} − ${pn(e)})`,c*k-m*(d-e)]},
 ()=>{const a=R(2,4),b=R(2,3),c=nzr(-5,5),s=rsq(),d=R(1,9);return[`${a}<sup>${b}</sup> · ${pn(c)} − √${s*s} + ${d*d} ÷ ${d}`,a**b*c-s+d]}];
const combo=tpls=>mk(()=>{const idx=shufT(tpls.map((_,i)=>i)).slice(0,3),g=idx.map(i=>tpls[i]());return[`Resolvé aplicando la jerarquía de las operaciones (paréntesis y corchetes primero, luego potencias y raíces, después multiplicaciones y divisiones y, por último, sumas y restas). Usá la propiedad distributiva donde convenga.${g.map((x,i)=>sb('abc'[i],`<b>${x[0]}</b>`)).join('')}`,g.map((x,i)=>`${'abc'[i]}) ${num(x[1])}`).join('; ')]});
def('comb_num',[[combo(TPL0)],[combo(TPL1)],[combo(TPL2)]]);

/* ---------- Registro de los temas ---------- */
[['clas_fig','Clasificación de figuras (triángulos y cuadriláteros)',[1,2,3]],
 ['angulos_rel','Ángulos: complementarios, suplementarios y opuestos por el vértice',[1,2,3]],
 ['angulos_par','Ángulos entre paralelas',[2,3]],
 ['comb_geo_ec','Perímetro y área con ecuaciones',[2,3]],
 ['pit_ec','Teorema de Pitágoras con ecuaciones',[3,4]],
 ['comb_num','Ejercicios combinados (enteros, potencias, raíces y distributiva)',[2,3]]
].forEach(([k,n,y])=>TOPICS.push({k,n,y}));
TOPICS.sort((a,b)=>Math.min(...a.y)-Math.min(...b.y));

Object.assign(TIPS,{
clas_fig:['Recordá: según sus lados, un triángulo es equilátero (3 lados iguales), isósceles (2 lados iguales) o escaleno (3 lados distintos). Según sus ángulos: acutángulo (3 agudos), rectángulo (uno de 90°) u obtusángulo (uno mayor que 90°).','Un cuadrado es a la vez rectángulo y rombo. Un paralelogramo tiene dos pares de lados paralelos; un trapecio, solo un par.'],
angulos_rel:['Recordá: complementarios suman 90°; suplementarios suman 180°; los ángulos opuestos por el vértice son iguales; los adyacentes suman 180°.'],
angulos_par:['Recordá: entre paralelas cortadas por una transversal, los correspondientes y los alternos (internos y externos) son iguales; los conjugados (internos y externos) son suplementarios.'],
comb_geo_ec:['Recordá: perímetro de un rectángulo = 2 · (largo + ancho); área = largo · ancho; perímetro del cuadrado = 4 · lado. Planteá una ecuación con el dato del perímetro o del área.'],
pit_ec:['Recordá: en un triángulo rectángulo, (cateto)² + (cateto)² = (hipotenusa)². Reemplazá las medidas por las expresiones con x y resolvé la ecuación.'],
comb_num:['Recordá el orden: paréntesis, potencias y raíces, multiplicaciones y divisiones, sumas y restas. Propiedad distributiva: a · (b + c) = a · b + a · c. Cuidado: −2² no es lo mismo que (−2)².']
});
if(typeof LB_KEYS!=='undefined')LB_KEYS.clas_fig={s:['clasificacion de triangulos','triangulo equilatero','triangulo isosceles','triangulo escaleno','triangulo acutangulo','cuadrilatero','paralelogramo','trapecio','rombo','romboide'],w:['lados','angulos','cuadrado','rectangulo']};
})();
