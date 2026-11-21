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
/* ===== Etapa 2: más temas y más variantes por tema ===== */
const shufT=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=R(0,i);[a[i],a[j]]=[a[j],a[i]]}return a};
(()=>{
const rd=(x,k=1)=>num(Math.round(x*10**k)/10**k);
const lcm=(a,b)=>a/gcd(a,b)*b;
const nz=(a,b)=>{let x;do{x=R(a,b)}while(!x);return x};
const fx=(t,d)=>`<span class="fr"><i>${t}</i><i>${d}</i></span>`;
const fac=r=>r<0?`(x + ${-r})`:`(x − ${r})`;
const divs=n=>{const r=[];for(let i=1;i<=n;i++)if(n%i==0)r.push(i);return r};
const primes=n=>{const r=[];for(let p=2;n>1;){if(n%p==0){r.push(p);n/=p}else p++}return r};
const fpr=n=>{const f={};primes(n).forEach(p=>f[p]=(f[p]||0)+1);return Object.keys(f).map(p=>f[p]>1?`${p}<sup>${f[p]}</sup>`:p).join(' · ')};
const nCk=(n,k)=>{let r=1;for(let i=1;i<=k;i++)r=r*(n-k+i)/i;return Math.round(r)};
const ex10=e=>`10<sup>${e<0?'−'+(-e):e}</sup>`;
const OLD={...GEN},X={};
const add=(k,a,b,c)=>{X[k]=[a,b,c]};
const nt=(k,n,y)=>TOPICS.push({k,n,y});

/* --- Variantes extra de temas que ya existían --- */
add('enteros',
[()=>{const a=R(-6,12),b=R(3,15);return[`La temperatura era de ${num(a)} °C y bajó ${b} °C. ¿Cuál es la temperatura final?`,`${num(a-b)} °C`]},
 ()=>{const s=new Set();while(s.size<4)s.add(R(-9,9));const v=[...s];return[`Ordená de menor a mayor: <b>${v.map(num).join('; ')}</b>`,[...v].sort((x,y)=>x-y).map(num).join(' &lt; ')]}],
[()=>{const x=R(2,9),y=nz(-9,9),z=nz(-9,9);return[`Calculá: <b>(${pn(x*y)} ÷ ${pn(y)}) − ${pn(z)}²</b>`,x-z*z]},
 ()=>{const a=R(-9,-2),b=R(2,9),c=R(2,6);return[`Calculá: <b>${pn(a)} · ${pn(b)} − ${pn(c)} · ${pn(a)}</b>`,a*b-c*a]}],
[()=>{const a=R(2,5),b=R(2,4);return[`Calculá: <b>(−${a})² − (−${b})³</b>`,a*a+b**3]},
 ()=>{const a=R(10,60),b=R(5,30),c=R(5,40);return[`Un buzo está a ${a} m bajo el nivel del mar. Sube ${b} m y luego baja ${c} m. ¿A qué altura respecto del nivel del mar queda? (Los metros bajo el nivel del mar son negativos).`,`${num(-a+b-c)} m`]}]);

add('fracciones',
[()=>{const g=R(2,6),a=R(1,7),b=R(a+1,a+6);return[`Simplificá hasta la fracción irreducible: <b>${fr(a*g,b*g)}</b>`,F(a,b)]}],
[()=>{const a=R(1,5),b=R(a+1,8),c=R(1,5),d=R(c+1,8);return[`Resolvé y simplificá: <b>${fr(a,b)} · ${fr(c,d)}</b>`,F(a*c,b*d)]},
 ()=>{const a=R(1,5),b=R(a+1,8),c=R(1,5),d=R(c+1,8);return[`Resolvé y simplificá: <b>${fr(a,b)} ÷ ${fr(c,d)}</b>`,F(a*d,b*c)]}],
[()=>{const p=PK([3,4,5]),q=PK([4,5,6,7]);return[`Juan gastó ${fr(1,p)} de sus ahorros en un libro y ${fr(1,q)} en ropa. ¿Qué fracción de sus ahorros le queda?`,F(p*q-p-q,p*q)]},
 ()=>{const a=R(1,4),b=R(a+1,6),c=R(1,4),d=R(c+1,6),e=R(1,4),f=R(e+1,6);return[`Resolvé y simplificá: <b>(${fr(a,b)} + ${fr(c,d)}) ÷ ${fr(e,f)}</b>`,F((a*d+c*b)*f,b*d*e)]}]);

add('ecuacion1',
[()=>{const x=R(2,12),k=R(2,6);return[`El ${['doble','triple','cuádruple','quíntuple','séxtuple'][k-2]} de un número es ${k*x}. ¿Cuál es el número?`,`${x}`]}],
[()=>{const w=R(3,9),dif=R(2,6);return[`El largo de un rectángulo mide ${dif} cm más que su ancho y su perímetro es ${2*(2*w+dif)} cm. Calculá el largo y el ancho.`,`Ancho = ${w} cm; largo = ${w+dif} cm`]}],
[()=>{const a=R(2,6),t=R(1,8),b=R(1,9);return[`Resolvé la ecuación: <b>${fx('x',a)} + ${b} = ${t+b}</b>`,`x = ${a*t}`]},
 ()=>{const a=R(10,25),d=R(2,9);return[`Ana tiene ${d} años más que su hermano y entre los dos suman ${2*a+d} años. ¿Qué edad tiene cada uno?`,`Hermano: ${a} años; Ana: ${a+d} años`]}]);

add('proporcionalidad',
[()=>{const k=PK([2,4,5]),u=R(5,15)*10,m=k+R(1,6);return[`Una receta para ${k} personas lleva ${k*u} g de harina. ¿Cuántos gramos hacen falta para ${m} personas?`,`${m*u} g`]}],
[()=>{const k=R(2,9),x=shufT([1,2,3,4,5,6,7,8,9,10]).slice(0,3);return[`Completá la tabla de proporcionalidad directa: ${x[0]} → ${k*x[0]}; ${x[1]} → ?; ${x[2]} → ?. ¿Cuál es la constante de proporcionalidad?`,`${x[1]} → ${k*x[1]}; ${x[2]} → ${k*x[2]}; constante = ${k}`]}],
[()=>{const v=PK([40,60,80,90,120]),t=PK([2,3,4,6]),D=v*t,c=[30,40,45,60,80,90,120,180].filter(x=>x!=v&&D%x==0),v2=PK(c);return[`Un auto a ${v} km/h tarda ${t} horas en hacer un viaje. ¿Cuánto tardaría a ${v2} km/h? (proporcionalidad inversa)`,`${num(D/v2)} horas`]}]);

add('porcentaje',
[()=>{let T,p,x;do{T=PK([20,40,50,80,100,200]);p=PK([10,20,25,50,75]);x=T*p/100}while(x%1);return[`¿Qué porcentaje de ${T} es ${x}?`,`${p}%`]}],
[()=>{const x=R(1,10)*100;return[`Un producto cuesta $${x} sin IVA. Si el IVA es del 21%, ¿cuánto se paga en total?`,`$${x*121/100}`]}],
[()=>{const p=PK([[10,20],[20,10],[20,30],[30,20],[10,30]]),m=R(1,10)*100,f=m*(100-p[0])*(100-p[1])/10000;return[`Un artículo de $${m} tiene un descuento del ${p[0]}% y, sobre ese precio, otro descuento del ${p[1]}%. ¿Cuál es el precio final y qué porcentaje total se descontó?`,`$${f}; descuento total ${100-(100-p[0])*(100-p[1])/100}%`]}]);

add('geometria',
[()=>{const l=R(2,12);return[`Un cuadrado tiene ${l} cm de lado. Calculá su perímetro y su área.`,`Perímetro = ${4*l} cm; Área = ${l*l} cm²`]}],
[()=>{const B=R(6,14),b=R(2,B-2),h=R(2,10);return[`Calculá el área de un trapecio de base mayor ${B} cm, base menor ${b} cm y altura ${h} cm.`,`${num((B+b)*h/2)} cm²`]}],
[()=>{const a=R(10,40),b=R(8,30);return[`Se quiere cercar un terreno rectangular de ${a} m por ${b} m con 3 hilos de alambre. ¿Cuántos metros de alambre se necesitan?`,`${6*(a+b)} m`]}]);

add('potencias',
[()=>{const a=R(2,9),b=R(2,4);return[`Calculá: <b>${pw(a,2)} + ${pw(b,3)}</b>`,a*a+b**3]}],
[()=>{const b=R(2,5),n=R(1,3);return[`Calculá (exponente negativo): <b>${b}<sup>−${n}</sup></b>`,F(1,b**n)]}],
[()=>{const b=R(3,9),a=R(1,b-1);return[`Calculá: <b>(${fr(a,b)})<sup>2</sup></b>`,F(a*a,b*b)]}]);

add('pitagoras',
[()=>{const[a,b,c]=PK(TRI),k=R(1,2);return R(0,1)?[`¿Un triángulo de lados ${a*k} cm, ${b*k} cm y ${c*k} cm es rectángulo? Justificá.`,`Sí: ${(a*k)**2} + ${(b*k)**2} = ${(c*k)**2}`]:[`¿Un triángulo de lados ${a*k} cm, ${b*k} cm y ${c*k+1} cm es rectángulo? Justificá.`,`No: ${(a*k)**2} + ${(b*k)**2} = ${(a*k)**2+(b*k)**2}, pero ${(c*k+1)**2} es distinto`]}],
[()=>{const[a,b,c]=PK(TRI),k=R(1,2);return[`Una escalera de ${c*k} m se apoya en una pared con el pie a ${a*k} m de ella. ¿A qué altura de la pared llega?`,`${b*k} m`]}],
[()=>{const l=R(2,9);return[`Calculá la diagonal de un cuadrado de ${l} cm de lado. Dejá la raíz expresada.`,`${l}√2 cm`]},
 ()=>{const[a,b,c]=PK(TRI),k=R(1,2);return[`Un triángulo isósceles tiene lados iguales de ${c*k} cm y base de ${2*a*k} cm. Calculá su altura y su área.`,`Altura = ${b*k} cm; Área = ${a*b*k*k} cm²`]}]);

add('funcion_lineal',
[()=>{const B=R(2,8)*10,p=R(2,9)*10,x=R(2,12);return[`Un taxi cobra $${B} de bajada de bandera más $${p} por km. Escribí la función que da el costo según los km y calculá el costo de un viaje de ${x} km.`,`C(x) = ${p}x + ${B}; C(${x}) = $${p*x+B}`]}],
[()=>{const m=nz(-5,5),b=nz(-8,8);return[`Dada la función <b>f(x) = ${lin(m,b)}</b>, indicá la pendiente, la ordenada al origen y la raíz (el valor de x donde f(x) = 0).`,`Pendiente = ${num(m)}; ordenada = ${num(b)}; raíz: x = ${F(-b,m)}`]}],
[()=>{const m=nz(-4,4),b=R(-5,5),x0=R(-3,3),y0=R(-6,6);return[`Hallá la ecuación de la recta paralela a <b>y = ${lin(m,b)}</b> que pasa por el punto (${num(x0)}; ${num(y0)}).`,`y = ${lin(m,y0-m*x0)}`]}]);

add('sistemas',[],
[()=>{const g=R(3,12),c=R(2,8);return[`En un corral hay gallinas y conejos: en total ${g+c} cabezas y ${2*g+4*c} patas. ¿Cuántos animales hay de cada tipo?`,`${g} gallinas y ${c} conejos`]}],
[()=>{const a=R(1,4),b=R(1,4),c=R(1,9),k=R(2,3),t=R(0,2);let a2=a*k,b2=b*k,c2=c*k,r;
  if(t==0)r=`Compatible indeterminado (infinitas soluciones): la segunda ecuación es la primera multiplicada por ${k}`;
  else if(t==1){c2=c*k+R(1,5);r='Incompatible (sin solución): los coeficientes son proporcionales pero los términos independientes no'}
  else{a2=a*k+1;r='Compatible determinado (una única solución): los coeficientes no son proporcionales'}
  return[`Sin resolver, clasificá el sistema (compatible determinado, indeterminado o incompatible) y justificá:<br>${eq2(a,b,c)}<br>${eq2(a2,b2,c2)}`,r]}]);

add('factoreo',[],
[()=>{const r1=nz(-8,8),r2=nz(-8,8);return[`Factoreá el trinomio: <b>${sum([[1,'x²'],[-(r1+r2),'x'],[r1*r2,'']])}</b>`,`${fac(r1)}${fac(r2)}`]}],
[()=>{const k=R(2,9);return[`Simplificá: <b>${fx(sum([[1,'x²'],[-k*k,'']]),'x − '+k)}</b>`,`x + ${k}`]}]);

add('estadistica',[],
[()=>{const f=[R(1,6),R(2,8),R(2,8),R(1,6)],v=[0,1,2,3],n=f.reduce((a,b)=>a+b,0),all=[];v.forEach((x,i)=>{for(let j=0;j<f[i];j++)all.push(x)});
  const mean=all.reduce((a,b)=>a+b,0)/n,med=n%2?all[(n-1)/2]:(all[n/2-1]+all[n/2])/2,mx=Math.max(...f),mo=v.filter((x,i)=>f[i]==mx);
  return[`En un curso se registró la cantidad de hermanos de cada alumno: 0 hermanos: ${f[0]} alumnos; 1: ${f[1]}; 2: ${f[2]}; 3: ${f[3]}. Calculá la media (a un decimal), la mediana y la moda.`,`Media = ${rd(mean)}; Mediana = ${num(med)}; Moda = ${mo.join(' y ')}`]}],
[()=>{let v,m,x;do{v=[R(1,15),R(1,15),R(1,15),R(1,15)];m=R(5,15);x=5*m-v.reduce((a,b)=>a+b,0)}while(x<1||x>30);return[`La media de 5 números es ${m}. Cuatro de ellos son ${v.join('; ')}. ¿Cuál es el quinto número?`,`${x}`]}]);

add('probabilidad',
[()=>{const e=PK([['par',3],['mayor que 4',2],['múltiplo de 3',2],['menor que 3',2],['impar',3]]);return[`Se tira un dado común. ¿Cuál es la probabilidad de obtener un número ${e[0]}?`,F(e[1],6)]}],
[()=>{const s=R(2,12),w=6-Math.abs(s-7);return[`Se tiran dos dados comunes. ¿Cuál es la probabilidad de que la suma sea ${s}?`,F(w,36)]}],
[()=>{const r=R(2,6),a=R(2,6),N=r+a;return[`Una bolsa tiene ${r} bolitas rojas y ${a} azules. Se sacan dos bolitas con reposición (se devuelve la primera antes de sacar la segunda). ¿Cuál es la probabilidad de que ambas sean rojas?`,F(r*r,N*N)]},
 ()=>[`Se tiran tres monedas. ¿Cuál es la probabilidad de obtener al menos una cara?`,F(7,8)]]);

add('cuadratica',[],
[()=>{const a=R(1,3),b=R(-6,6),c=R(-6,6),D=b*b-4*a*c;return[`Calculá el discriminante de <b>${sum([[a,'x²'],[b,'x'],[c,'']])} = 0</b> y decidí cuántas raíces reales tiene.`,`Δ = ${num(D)}; ${D>0?'dos raíces reales distintas':D==0?'una raíz real doble':'no tiene raíces reales'}`]}],
[()=>{const n=R(3,12);return[`El producto de dos números enteros consecutivos es ${n*(n+1)}. ¿Cuáles son? (planteá una ecuación cuadrática)`,`x² + x − ${n*(n+1)} = 0; los números son ${n} y ${n+1} (o ${num(-n-1)} y ${num(-n)})`]},
 ()=>{const w=R(3,9),d=R(2,6);return[`El largo de un rectángulo excede en ${d} cm a su ancho y su área es ${w*(w+d)} cm². Calculá sus dimensiones.`,`Ancho = ${w} cm; largo = ${w+d} cm`]}]);

add('trigonometria',
[()=>{const[a,b,c]=PK(TRI.slice(0,2)),k=R(1,3);return[`Un triángulo rectángulo tiene catetos de ${a*k} cm y ${b*k} cm. Para el ángulo α opuesto al cateto de ${a*k} cm, calculá sen α, cos α y tan α.`,`sen α = ${F(a,c)}; cos α = ${F(b,c)}; tan α = ${F(a,b)}`]}],
[()=>{const a=R(3,9),b=R(a+1,12),al=Math.atan(a/b)*180/Math.PI;return[`En un triángulo rectángulo los catetos miden ${a} cm y ${b} cm. Calculá, con calculadora, el ángulo agudo opuesto al cateto de ${a} cm (redondeá a un decimal).`,`α ≈ ${rd(al)}°`]}],
[()=>{const s=R(2,12),t=PK([[45,`${s} m`],[60,`${s}√3 m`],[30,`${fx(s+'√3',3)} m`]]);return[`A cierta hora, un poste proyecta una sombra de ${s} m y los rayos del sol forman un ángulo de ${t[0]}° con el suelo. ¿Cuál es la altura del poste?`,t[1]]}]);

add('exp_log',
[()=>{const b=PK([2,3,5]),k=R(2,4);return[`Resolvé: <b>log<sub>${b}</sub> x = ${k}</b>`,`x = ${b**k}`]}],
[()=>{const b=PK([2,3]),k=R(2,4),m=R(1,6);return[`Resolvé: <b>log<sub>${b}</sub> (x + ${m}) = ${k}</b>`,`x = ${num(b**k-m)}`]},
 ()=>{const n=PK([100,200,500,1000]),t=R(2,5);return[`Un cultivo tiene ${n} bacterias y su número se duplica cada hora. ¿Cuántas bacterias habrá luego de ${t} horas?`,`${n*2**t}`]}],
[()=>{const n=R(1,6)*100,t=R(3,6);return[`Un cultivo tiene ${n} bacterias y se duplica cada 20 minutos. ¿Cuántas habrá luego de ${t*20} minutos?`,`${n*2**t}`]}]);

add('derivadas',
[()=>{const b=nz(-6,6),x0=R(1,4);return[`Calculá la pendiente de la recta tangente a <b>f(x) = ${sum([[1,'x²'],[b,'x']])}</b> en x = ${x0}.`,`f ′(x) = ${sum([[2,'x'],[b,'']])}; pendiente = ${num(2*x0+b)}`]}],
[()=>{const a=R(1,4),b=nz(-5,5);return[`Derivá usando la regla del producto (o desarrollando): <b>f(x) = (x ${sg(a)})(x² ${sg(b)})</b>`,`f ′(x) = ${sum([[3,'x²'],[2*a,'x'],[b,'']])}`]}],
[()=>{const b=nz(-5,5),c=R(-5,5),x0=R(1,3),y0=x0*x0+b*x0+c,m=2*x0+b;return[`Hallá la ecuación de la recta tangente a <b>f(x) = ${sum([[1,'x²'],[b,'x'],[c,'']])}</b> en x = ${x0}.`,`f(${x0}) = ${num(y0)}; f ′(${x0}) = ${num(m)}; recta: y = ${lin(m,y0-m*x0)}`]},
 ()=>{const a=R(1,4),b=nz(-5,5),n=PK([2,3]);return[`Derivá aplicando la regla de la cadena: <b>f(x) = (${lin(a,b)})<sup>${n}</sup></b>`,`f ′(x) = ${n*a}(${lin(a,b)})${n==3?'<sup>2</sup>':''}`]}]);

/* --- Temas nuevos --- */
nt('divisibilidad','Múltiplos, divisores, MCD y mcm',[1,2]);
add('divisibilidad',
[()=>{const n=PK([12,18,20,24,30,36,40,45]);return[`Escribí todos los divisores de <b>${n}</b>.`,divs(n).join('; ')]},
 ()=>{const n=R(120,999),t=PK([3,4,5,9]);return[`¿Es ${n} divisible por ${t}? Justificá con el criterio de divisibilidad correspondiente.`,`${n%t==0?'Sí':'No'}: ${n} ÷ ${t} ${n%t==0?'= '+n/t:'deja resto '+n%t}`]}],
[()=>{const a=R(12,60);let b;do{b=R(12,60)}while(b==a);return[`Calculá el MCD y el mcm de <b>${a}</b> y <b>${b}</b>.`,`MCD = ${gcd(a,b)}; mcm = ${lcm(a,b)}`]},
 ()=>{let n;do{n=R(24,180)}while(primes(n).length<3);return[`Descomponé <b>${n}</b> en factores primos.`,`${n} = ${fpr(n)}`]}],
[()=>{let a,b;do{a=R(4,15);b=R(4,15)}while(a==b);return[`Dos luces intermitentes se encienden juntas ahora. Una se enciende cada ${a} segundos y la otra cada ${b} segundos. ¿Dentro de cuántos segundos vuelven a encenderse juntas?`,`${lcm(a,b)} segundos`]},
 ()=>{const g=R(2,8);let a,b;do{a=g*R(2,6);b=g*R(2,6)}while(a==b);const d=gcd(a,b);return[`Se quieren armar bolsas iguales con ${a} caramelos y ${b} chocolates, sin que sobre nada. ¿Cuál es la mayor cantidad de bolsas que se puede armar y qué lleva cada una?`,`${d} bolsas; cada una con ${a/d} caramelos y ${b/d} chocolates`]}]);

nt('decimales','Números decimales',[1,2]);
add('decimales',
[()=>{const A=R(11,99),B=R(11,99),s=PK([1,-1]),[P,Q]=s<0&&A<B?[B,A]:[A,B];return[`Calculá: <b>${num(P/10)} ${s<0?'−':'+'} ${num(Q/10)}</b>`,(s<0?P-Q:P+Q)/10]},
 ()=>{const d=PK([2,4,5,8,10,20,25]),n=R(1,d-1);return[`Expresá como número decimal: <b>${fr(n,d)}</b>`,n/d]}],
[()=>{const A=R(12,59),B=R(12,39);return[`Calculá: <b>${num(A/10)} · ${num(B/10)}</b>`,A*B/100]}],
[()=>{const K=R(11,59),p=R(10,40)*10;return[`Se compran ${num(K/10)} kg de manzanas a $${p} el kilo. ¿Cuánto se paga en total?`,`$${K*(p/10)}`]}]);

nt('angulos','Ángulos y triángulos',[1,2]);
add('angulos',
[()=>{const a=R(10,80);return[`Un ángulo mide ${a}°. Calculá la medida de su complemento y de su suplemento.`,`Complemento = ${90-a}°; suplemento = ${180-a}°`]}],
[()=>{let a,b;do{a=R(20,100);b=R(20,100)}while(a+b>=170||a+b<=30);const c=180-a-b,m=Math.max(a,b,c);return[`Dos ángulos de un triángulo miden ${a}° y ${b}°. Calculá el tercero y clasificá el triángulo según sus ángulos.`,`Tercer ángulo = ${c}°; ${m>90?'obtusángulo':m==90?'rectángulo':'acutángulo'}`]}],
[()=>{const a=R(40,140);return[`Dos rectas paralelas son cortadas por una transversal y uno de los ángulos formados mide ${a}°. ¿Cuánto miden el ángulo opuesto por el vértice, el correspondiente y el adyacente?`,`Opuesto = ${a}°; correspondiente = ${a}°; adyacente = ${180-a}°`]},
 ()=>{const a=R(10,75)*2;return[`En un triángulo isósceles el ángulo desigual mide ${a}°. ¿Cuánto miden los otros dos ángulos?`,`${(180-a)/2}° cada uno`]}]);

nt('radicacion','Raíces y radicación',[2,3]);
add('radicacion',
[()=>{const k=R(2,15),c=R(2,5);return R(0,1)?[`Calculá: <b>√${k*k}</b>`,k]:[`Calculá: <b>∛${c**3}</b>`,c]}],
[()=>{const p=R(2,9),q=R(2,9),r=R(1,6);return[`Calculá: <b>√${p*p} + √${q*q} − √${r*r}</b>`,p+q-r]}],
[()=>{const k=R(2,6),m=PK([2,3,5,6,7]);return[`Extraé factores del radicando: <b>√${k*k*m}</b>`,`${k}√${m}`]},
 ()=>{const[a,b,c]=PK(TRI);return[`Calculá: <b>√(${a*a} + ${b*b})</b>`,c]}]);

nt('notacion_cientifica','Notación científica',[3]);
add('notacion_cientifica',
[()=>{let M;do{M=R(11,99)}while(M%10==0);const e=R(3,7);return[`Expresá en notación científica: <b>${M}${'0'.repeat(e-1)}</b>`,`${num(M/10)} × ${ex10(e)}`]}],
[()=>{let M;do{M=R(11,99)}while(M%10==0);const z=R(2,5);return[`Expresá en notación científica: <b>0,${'0'.repeat(z)}${M}</b>`,`${num(M/10)} × ${ex10(-(z+1))}`]}],
[()=>{const a=R(2,9),b=R(2,9),m=R(2,6),n=R(2,6)*PK([1,-1]),p=a*b,mant=p>=10?p/10:p,e=m+n+(p>=10?1:0);return[`Resolvé y expresá el resultado en notación científica: <b>(${a} × ${ex10(m)}) · (${b} × ${ex10(n)})</b>`,`${num(mant)} × ${ex10(e)}`]}]);

nt('expresiones_alg','Expresiones algebraicas',[2,3]);
add('expresiones_alg',
[()=>{const a=R(2,5),b=nz(-5,5),c=nz(-9,9),x=R(-3,4),y=R(-3,4);return[`Calculá el valor numérico de <b>${sum([[a,'x'],[b,'y'],[c,'']])}</b> para x = ${num(x)} e y = ${num(y)}.`,a*x+b*y+c]}],
[()=>{const a=nz(-6,6),b=nz(-6,6),c=nz(-6,6),d=nz(-6,6);return[`Reducí términos semejantes: <b>${sum([[a,'x'],[b,'y'],[c,'x'],[d,'y']])}</b>`,sum([[a+c,'x'],[b+d,'y']])]}],
[()=>{const a=R(2,5),b=nz(-4,4),c=R(-6,6),d=R(2,4),e=nz(-4,4),f=R(1,6);return[`Aplicá la propiedad distributiva y reducí: <b>${a}(${lin(b,c)}) − ${d}(${lin(e,-f)})</b>`,sum([[a*b-d*e,'x'],[a*c+d*f,'']])]}]);

nt('polinomios','Polinomios',[3,4]);
add('polinomios',
[()=>{const a=nz(-4,4),b=R(-5,5),c=R(-6,6),k=R(-3,3);return[`Dado <b>P(x) = ${sum([[a,'x²'],[b,'x'],[c,'']])}</b>, indicá su grado y calculá P(${num(k)}).`,`Grado 2; P(${num(k)}) = ${num(a*k*k+b*k+c)}`]}],
[()=>{const a=R(1,4),b=nz(-5,5),c=R(1,4),d=nz(-5,5);return[`Multiplicá y reducí: <b>(${lin(a,b)})(${lin(c,d)})</b>`,sum([[a*c,'x²'],[a*d+b*c,'x'],[b*d,'']])]}],
[()=>{const p=nz(-6,6),q=nz(-6,6);return[`Efectuá la división (sin resto): <b>(${sum([[1,'x²'],[p+q,'x'],[p*q,'']])}) ÷ (x ${sg(p)})</b>`,`x ${sg(q)}`]}]);

nt('inecuaciones','Inecuaciones',[3,4]);
const OPS={'&gt;':'&lt;','&lt;':'&gt;','≥':'≤','≤':'≥'};
add('inecuaciones',
[()=>{const a=R(2,6),b=R(-8,8),x0=R(-6,6),op=PK(Object.keys(OPS));return[`Resolvé: <b>${lin(a,b)} ${op} ${num(a*x0+b)}</b>`,`x ${op} ${num(x0)}`]}],
[()=>{const a=-R(2,6),b=R(-8,8),x0=R(-6,6),op=PK(Object.keys(OPS));return[`Resolvé y explicá qué pasa con el sentido de la desigualdad: <b>${lin(a,b)} ${op} ${num(a*x0+b)}</b>`,`x ${OPS[op]} ${num(x0)} (al dividir por un número negativo se invierte la desigualdad)`]}],
[()=>{const a=R(2,5),b=R(-6,6),x1=R(-5,2),x2=x1+R(2,6);return[`Resolvé la inecuación doble: <b>${num(a*x1+b)} &lt; ${lin(a,b)} ≤ ${num(a*x2+b)}</b>`,`${num(x1)} &lt; x ≤ ${num(x2)}`]}]);

nt('semejanza','Semejanza y Thales',[3,4]);
add('semejanza',
[()=>{const[a,b,c]=PK(TRI),k=R(2,4);return[`Un triángulo tiene lados de ${a} cm, ${b} cm y ${c} cm. Otro triángulo semejante a él tiene su lado menor de ${a*k} cm. ¿Cuánto miden los otros dos lados?`,`${b*k} cm y ${c*k} cm (razón de semejanza ${k})`]}],
[()=>{const H=PK([15,18,20]),k=R(3,8),s=R(2,3);return[`Una persona de ${num(H/10)} m de altura proyecta una sombra de ${s} m. En el mismo momento, un árbol proyecta una sombra de ${s*k} m. ¿Cuál es la altura del árbol?`,`${num(H*k/10)} m`]}],
[()=>{const a=R(2,6),m=R(2,4),c=R(2,6);return[`Tres rectas paralelas determinan en una transversal segmentos de ${a} cm y ${a*m} cm, y en otra transversal un segmento de ${c} cm y otro de x cm (en el mismo orden). Calculá x aplicando el teorema de Thales.`,`${num(c*m)} cm`]}]);

nt('cuerpos','Volumen y área de cuerpos',[2,3]);
add('cuerpos',
[()=>{const a=R(2,9);return[`Calculá el volumen y el área total de un cubo de ${a} cm de arista.`,`Volumen = ${a**3} cm³; área total = ${6*a*a} cm²`]}],
[()=>{const l=R(3,9),a=R(2,7),h=R(2,8);return[`Calculá el volumen y el área total de un prisma de base rectangular de ${l} cm de largo, ${a} cm de ancho y ${h} cm de altura.`,`Volumen = ${l*a*h} cm³; área total = ${2*(l*a+l*h+a*h)} cm²`]}],
[()=>{const r=R(2,8),h=R(3,12);return[`Un cilindro tiene ${r} cm de radio y ${h} cm de altura. Calculá su volumen y su área lateral. Dejá el resultado expresado con π.`,`Volumen = ${r*r*h}π cm³; área lateral = ${2*r*h}π cm²`]},
 ()=>{const l=R(3,8),a=R(2,6),h=R(2,5);return[`Un acuario mide ${l} dm de largo, ${a} dm de ancho y ${h} dm de alto. ¿Cuántos litros de agua entran si se llena por completo? (1 dm³ = 1 litro)`,`${l*a*h} litros`]}]);

nt('funcion_cuadratica','Función cuadrática',[4,5]);
add('funcion_cuadratica',
[()=>{const r1=nz(-6,6),r2=nz(-6,6);return[`Dada <b>f(x) = ${sum([[1,'x²'],[-(r1+r2),'x'],[r1*r2,'']])}</b>, calculá sus raíces y su ordenada al origen.`,`Raíces: x = ${num(r1)} y x = ${num(r2)}; ordenada al origen = ${num(r1*r2)}`]}],
[()=>{const r1=nz(-6,6),r2=nz(-6,6),xv=(r1+r2)/2,yv=-((r1-r2)**2)/4;return[`Hallá el vértice y la ecuación del eje de simetría de <b>f(x) = ${sum([[1,'x²'],[-(r1+r2),'x'],[r1*r2,'']])}</b>.`,`Vértice = (${num(xv)}; ${num(yv)}); eje: x = ${num(xv)}`]}],
[()=>{const h=nz(-5,5),m=R(1,5);return[`Dada <b>f(x) = (x ${sg(-h)})² − ${m*m}</b>, indicá el vértice, las raíces y la ordenada al origen.`,`Vértice = (${num(h)}; −${m*m}); raíces: x = ${num(h-m)} y x = ${num(h+m)}; ordenada = ${num(h*h-m*m)}`]}]);

nt('teorema_seno_coseno','Teoremas del seno y del coseno',[4,5]);
add('teorema_seno_coseno',
[()=>{const k=R(2,9);return[`En un triángulo ABC, el ángulo A mide 30°, el ángulo B mide 90° y el lado a mide ${k} cm. Calculá el lado b con el teorema del seno.`,`b = ${2*k} cm`]}],
[()=>{const a=R(3,9),b=R(3,9),t=PK([60,120]),N=a*a+b*b+(t==60?-a*b:a*b);return[`Un triángulo tiene dos lados de ${a} cm y ${b} cm que forman un ángulo de ${t}°. Calculá el tercer lado con el teorema del coseno (cos 60° = ½; cos 120° = −½).`,`c² = ${N}; c ≈ ${rd(Math.sqrt(N),2)} cm`]}],
[()=>{const k=R(2,9),t=PK([[45,'√2'],[60,'√3']]);return[`En un triángulo ABC, el ángulo A mide 30°, el ángulo B mide ${t[0]}° y el lado a mide ${k} cm. Calculá el lado b con el teorema del seno.`,`b = ${k}${t[1]} cm`]}]);

nt('sucesiones','Sucesiones',[5]);
add('sucesiones',
[()=>{const a=R(1,9),d=nz(-4,6),n=R(8,20),s=[0,1,2,3].map(i=>a+i*d);return[`En la sucesión aritmética <b>${s.map(num).join('; ')}; …</b> calculá el término número ${n}.`,`a<sub>${n}</sub> = ${num(a+(n-1)*d)}`]}],
[()=>{const a=R(1,9),d=R(2,5),n=PK([8,10,12,14]);return[`Calculá la suma de los primeros ${n} términos de la sucesión aritmética que empieza en ${a} y tiene diferencia ${d}.`,`${n*(2*a+(n-1)*d)/2}`]}],
[()=>{const a=R(1,4),r=PK([2,3]),n=R(4,6),S=a*(r**n-1)/(r-1);return[`En la sucesión geométrica de primer término ${a} y razón ${r}, calculá el término número ${n} y la suma de los primeros ${n} términos.`,`a<sub>${n}</sub> = ${a*r**(n-1)}; S<sub>${n}</sub> = ${S}`]}]);

nt('geometria_analitica','Geometría analítica',[4,5]);
add('geometria_analitica',
[()=>{const[a,b,c]=PK(TRI.slice(0,2)),k=R(1,3),x=R(-4,4),y=R(-4,4);return[`Calculá la distancia entre los puntos A(${num(x)}; ${num(y)}) y B(${num(x+a*k)}; ${num(y+b*k)}).`,`${c*k} unidades`]}],
[()=>{const x1=R(-6,6),y1=R(-6,6),x2=R(-6,6),y2=R(-6,6);return[`Hallá las coordenadas del punto medio del segmento de extremos A(${num(x1)}; ${num(y1)}) y B(${num(x2)}; ${num(y2)}).`,`M(${num((x1+x2)/2)}; ${num((y1+y2)/2)})`]}],
[()=>{const h=nz(-5,5),k=nz(-5,5),r=R(2,7);return[`Escribí la ecuación de la circunferencia de centro (${num(h)}; ${num(k)}) y radio ${r}.`,`(x ${sg(-h)})² + (y ${sg(-k)})² = ${r*r}`]}]);

nt('combinatoria','Combinatoria',[5,6]);
add('combinatoria',
[()=>{const n=R(5,12);return[`Calculá: <b>${n}! ÷ ${n-2}!</b>`,n*(n-1)]}],
[()=>{const n=R(5,8),k=R(2,4);let p=1;for(let i=0;i<k;i++)p*=n-i;return[`Con las cifras ${Array.from({length:n},(_,i)=>i+1).join(', ')}, ¿cuántos números de ${k} cifras distintas se pueden formar?`,`${p}`]}],
[()=>{const n=R(6,10),k=R(2,4);return[`De un grupo de ${n} alumnos se elige una comisión de ${k} integrantes. ¿Cuántas comisiones distintas pueden formarse?`,`${nCk(n,k)}`]},
 ()=>{const n=R(5,12);return[`En una reunión hay ${n} personas y todas se saludan con un apretón de manos. ¿Cuántos apretones hay en total?`,`${nCk(n,2)}`]}]);

nt('limites','Límites',[6]);
const lim=(a,e)=>`lim<sub>x→${a}</sub> ${e}`;
add('limites',
[()=>{const a=R(-3,3),b=R(-5,5),c=R(-6,6);return[`Calculá: <b>${lim(num(a),'('+sum([[1,'x²'],[b,'x'],[c,'']])+')')}</b>`,a*a+b*a+c]}],
[()=>{const k=R(2,9);return[`Calculá (salvá la indeterminación): <b>${lim(k,fx(sum([[1,'x²'],[-k*k,'']]),'x − '+k))}</b>`,2*k]}],
[()=>{const a=R(1,5),b=R(1,5),c=R(-5,5),d=R(-5,5);return[`Calculá: <b>${lim('∞',fx(sum([[a,'x²'],[c,'x']]),sum([[b,'x²'],[d,'']])))}</b>`,F(a,b)]},
 ()=>{const p=nz(-6,6),q=nz(-6,6);return[`Calculá: <b>${lim(num(-p),fx(sum([[1,'x²'],[p+q,'x'],[p*q,'']]),'x '+sg(p)))}</b>`,num(q-p)]}]);

nt('integrales','Integrales',[6]);
add('integrales',
[()=>{const n=R(1,4),m=R(1,5);return[`Calculá: <b>∫ ${sum([[m*(n+1),xp(n)]])} dx</b>`,`${sum([[m,xp(n+1)]])} + C`]}],
[()=>{const n1=R(2,3),m1=R(1,4),m2=nz(-5,5),c=nz(-6,6);return[`Calculá: <b>∫ (${sum([[m1*(n1+1),xp(n1)],[m2*2,'x'],[c,'']])}) dx</b>`,`${sum([[m1,xp(n1+1)],[m2,'x²'],[c,'x']])} + C`]}],
[()=>{const a=R(1,4),d=nz(-5,5),p=R(0,2),q=p+R(1,3);return[`Calculá la integral definida: <b>∫<sub>${p}</sub><sup>${q}</sup> (${sum([[2*a,'x'],[d,'']])}) dx</b>`,a*(q*q-p*p)+d*(q-p)]}]);

/* --- Armado final --- */
Object.keys(X).forEach(k=>{const old=OLD[k];GEN[k]=d=>{const pool=(old?[()=>old(d)]:[]).concat(X[k][d]||[]);return PK(pool)()}});
[['estadistica',[1,2,3,4,5,6]],['probabilidad',[2,3,4,5,6]],['proporcionalidad',[1,2,3]],['funcion_lineal',[2,3,4]]].forEach(([k,y])=>{TOPICS.find(t=>t.k===k).y=y});
TOPICS.sort((a,b)=>Math.min(...a.y)-Math.min(...b.y));
})();

/* ===== Etapa 3: figuras, recordatorios y consignas con más contexto ===== */
const TIPS={
enteros:['Recordá la regla de los signos: + · + = +, − · − = +, + · − = −. Respetá la jerarquía de las operaciones.','En la recta numérica, los números aumentan hacia la derecha. La distancia entre dos números es el valor absoluto de su diferencia.'],
fracciones:['Recordá: para sumar o restar fracciones buscá un denominador común; para multiplicar, multiplicá numeradores y denominadores; para dividir, multiplicá por la fracción inversa.'],
ecuacion1:['Recordá: lo que está sumando pasa restando y lo que está multiplicando pasa dividiendo. Verificá tu resultado reemplazándolo en la ecuación.'],
proporcionalidad:['Recordá: en la proporcionalidad directa el cociente entre las magnitudes es constante; en la inversa lo que se mantiene constante es el producto.'],
porcentaje:['Recordá: el 20% de una cantidad es multiplicarla por 0,20. Un descuento se resta y un recargo se suma al precio original.'],
geometria:['Recordá: área del rectángulo = base · altura; del triángulo = base · altura ÷ 2; del trapecio = (B + b) · h ÷ 2; del círculo = π · r². El perímetro es la suma de todos los lados.'],
potencias:['Recordá: a<sup>−n</sup> = 1 ÷ a<sup>n</sup>; al multiplicar potencias de igual base se suman los exponentes y al dividirlas se restan.'],
pitagoras:['Recordá: en un triángulo rectángulo, hipotenusa² = cateto² + cateto². La hipotenusa es el lado opuesto al ángulo recto y siempre es el más largo.'],
funcion_lineal:['Recordá: f(x) = m·x + b, donde m es la pendiente y b la ordenada al origen. La raíz se obtiene resolviendo f(x) = 0.'],
sistemas:['Recordá: podés resolver por sustitución, igualación o reducción. Verificá la solución en las dos ecuaciones.'],
factoreo:['Recordá: buscá primero el factor común; después fijate si es una diferencia de cuadrados o un trinomio cuadrado.'],
estadistica:['Recordá: media = suma de los datos ÷ cantidad de datos; mediana = valor central con los datos ordenados; moda = dato que más se repite.'],
probabilidad:['Recordá: probabilidad = casos favorables ÷ casos posibles. Expresala como fracción simplificada.'],
cuadratica:['Recordá: x = (−b ± √(b² − 4ac)) ÷ 2a. El discriminante Δ = b² − 4ac indica cuántas raíces reales tiene la ecuación.'],
trigonometria:['Recordá: sen α = cateto opuesto ÷ hipotenusa; cos α = cateto adyacente ÷ hipotenusa; tan α = cateto opuesto ÷ cateto adyacente.'],
exp_log:['Recordá: log<sub>b</sub> x = y significa que b<sup>y</sup> = x.'],
derivadas:['Recordá: (x<sup>n</sup>)′ = n·x<sup>n−1</sup>; la derivada de una suma es la suma de las derivadas; la derivada en un punto es la pendiente de la recta tangente.'],
divisibilidad:['Recordá: el MCD es el mayor divisor común y el mcm es el menor múltiplo común. Un número es divisible por 3 si la suma de sus cifras lo es, y por 4 si sus dos últimas cifras forman un múltiplo de 4.'],
decimales:['Recordá: al sumar o restar decimales alineá las comas; al multiplicar, multiplicá como si fueran enteros y luego ubicá la coma según la cantidad de decimales de los factores.'],
angulos:['Recordá: los ángulos interiores de un triángulo suman 180°; dos ángulos complementarios suman 90° y dos suplementarios suman 180°. Los ángulos opuestos por el vértice son iguales.'],
radicacion:['Recordá: √(a·b) = √a · √b. Para extraer factores del radicando, descomponelo en factores primos.'],
notacion_cientifica:['Recordá: un número en notación científica se escribe a × 10<sup>n</sup> con 1 ≤ a &lt; 10. Si n es negativo, el número es menor que 1.'],
expresiones_alg:['Recordá: solo se pueden sumar o restar términos semejantes (los que tienen la misma parte literal). Cuidá los signos al aplicar la propiedad distributiva.'],
polinomios:['Recordá: el grado de un polinomio es el mayor exponente de x. Para multiplicar, aplicá la propiedad distributiva y luego reducí términos semejantes.'],
inecuaciones:['Recordá: al multiplicar o dividir ambos miembros por un número negativo, el sentido de la desigualdad se invierte.'],
semejanza:['Recordá: en figuras semejantes los lados correspondientes son proporcionales (tienen la misma razón). Thales: las paralelas determinan segmentos proporcionales en las transversales.'],
cuerpos:['Recordá: volumen del prisma = área de la base · altura; volumen del cilindro = π · r² · h. Además, 1 dm³ = 1 litro.'],
funcion_cuadratica:['Recordá: el vértice está en x = −b ÷ 2a y el eje de simetría es la recta vertical que pasa por él. Las raíces son los valores de x donde f(x) = 0.'],
teorema_seno_coseno:['Recordá: teorema del seno: a ÷ sen A = b ÷ sen B = c ÷ sen C; teorema del coseno: c² = a² + b² − 2·a·b·cos C.'],
sucesiones:['Recordá: en una sucesión aritmética a<sub>n</sub> = a<sub>1</sub> + (n − 1)·d; en una geométrica a<sub>n</sub> = a<sub>1</sub>·r<sup>n−1</sup>.'],
geometria_analitica:['Recordá: distancia = √((x<sub>2</sub> − x<sub>1</sub>)² + (y<sub>2</sub> − y<sub>1</sub>)²); punto medio = ((x<sub>1</sub> + x<sub>2</sub>) ÷ 2 ; (y<sub>1</sub> + y<sub>2</sub>) ÷ 2); circunferencia: (x − h)² + (y − k)² = r².'],
combinatoria:['Recordá: n! = n · (n − 1) · … · 1. En las permutaciones y variaciones el orden importa; en las combinaciones no.'],
limites:['Recordá: si al reemplazar queda una indeterminación 0 ÷ 0, factoreá y simplificá antes de reemplazar.'],
integrales:['Recordá: ∫ x<sup>n</sup> dx = x<sup>n+1</sup> ÷ (n + 1) + C. La integral definida se calcula con la regla de Barrow: F(b) − F(a).'],
intervalos:['Recordá: el paréntesis no incluye el extremo y el corchete sí. El símbolo ∈ relaciona un número con un conjunto y ⊂ relaciona dos conjuntos.']
};

/* --- Biblioteca de figuras (SVG en línea negra, listas para imprimir) --- */
const FIG=(()=>{
const f=n=>Math.round(n*10)/10,D2R=Math.PI/180,nm=v=>typeof v==='number'?num(v):v;
const tx=(x,y,t,a='middle',sz)=>`<text x="${f(x)}" y="${f(y)}" text-anchor="${a}"${sz?` font-size="${sz}"`:''} fill="currentColor" stroke="none">${t}</text>`;
const ln=(x1,y1,x2,y2,d,w)=>`<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}"${d?' stroke-dasharray="5 4"':''}${w?` stroke-width="${w}"`:''}/>`;
const pg=(...p)=>`<polygon points="${p.map(q=>f(q[0])+','+f(q[1])).join(' ')}"/>`;
const dot=(x,y,r=3)=>`<circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="currentColor" stroke="none"/>`;
const ra=(x,y,ux,uy,vx,vy,s=9)=>`<path d="M${f(x+ux*s)} ${f(y+uy*s)} L${f(x+(ux+vx)*s)} ${f(y+(uy+vy)*s)} L${f(x+vx*s)} ${f(y+vy*s)}" stroke-width="1.2"/>`;
const ang=(P,Q)=>Math.atan2(Q[1]-P[1],Q[0]-P[0])/D2R;
function arcB(P,Q1,Q2,r,label,lr){let a1=ang(P,Q1),a2=ang(P,Q2),d=((a2-a1)%360+360)%360;if(d>180){[a1,a2]=[a2,a1];d=360-d}a2=a1+d;
 const p=a=>[P[0]+r*Math.cos(a*D2R),P[1]+r*Math.sin(a*D2R)],[sx,sy]=p(a1),[ex,ey]=p(a2),am=(a1+a2)/2,L=lr||r+16;
 return `<path d="M${f(sx)} ${f(sy)} A${r} ${r} 0 0 1 ${f(ex)} ${f(ey)}" stroke-width="1.3"/>`+(label?tx(P[0]+L*Math.cos(am*D2R),P[1]+L*Math.sin(am*D2R)+4,label):'')}
const svg=(w,h,inner,note)=>{const H=note?h+14:h;return `<svg class="fig" viewBox="0 0 ${f(w)} ${f(H)}" width="${f(w)}" height="${f(H)}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" font-family="Nunito Sans,Arial,sans-serif" font-size="13" role="img" aria-hidden="true">${inner}${note?tx(w/2,H-3,'Figura no hecha a escala','middle',10):''}</svg>`};
const mid=(P,Q)=>[(P[0]+Q[0])/2,(P[1]+Q[1])/2];
const out=(m,C,t,d=16)=>{const vx=m[0]-C[0],vy=m[1]-C[1],l=Math.hypot(vx,vy)||1,ux=vx/l,uy=vy/l,A=Math.abs(ux)>.55?(ux>0?'start':'end'):'middle',dd=A=='middle'?d:Math.min(d,10);return tx(m[0]+ux*dd,m[1]+uy*dd+4,t,A)};
const tick=(P,Q)=>{const m=mid(P,Q),dx=Q[0]-P[0],dy=Q[1]-P[1],l=Math.hypot(dx,dy)||1,nx=-dy/l*4,ny=dx/l*4;return ln(m[0]-nx,m[1]-ny,m[0]+nx,m[1]+ny)};

function rect(l,a,o={}){const u=o.u||'cm',r=Math.min(2.2,Math.max(.6,l/a));let w,h;if(r>=1){w=170;h=170/r}else{h=120;w=120*r}w=f(w);h=f(h);const x=30,y=14;
 let s=`<rect x="${x}" y="${y}" width="${w}" height="${h}"/>`+tx(x+w/2,y+h+18,`${nm(l)} ${u}`);
 if(o.sq){[[x+w/2,y],[x+w/2,y+h]].forEach(p=>s+=ln(p[0],p[1]-3,p[0],p[1]+3));[[x,y+h/2],[x+w,y+h/2]].forEach(p=>s+=ln(p[0]-3,p[1],p[0]+3,p[1]))}
 else s+=tx(x+w+8,y+h/2+4,`${nm(a)} ${u}`,'start');
 if(o.diag)s+=ln(x,y+h,x+w,y,true)+tx(x+w/2-8,y+h/2-8,o.diag,'end');
 return svg(w+112,h+34,s)}
function tri(b,h){const w=170,hh=f(Math.min(120,Math.max(60,h/b*w))),x=26,y=14,cx=x+w*.38;
 return svg(w+100,hh+34,pg([x,y+hh],[x+w,y+hh],[cx,y])+ln(cx,y,cx,y+hh,1)+ra(cx,y+hh,1,0,0,-1)+tx(x+w/2,y+hh+18,`${nm(b)} cm`)+tx(cx+6,y+hh/2+4,`${nm(h)} cm`,'start'))}
function trap(B,b,h){const w=190,tw=f(Math.max(60,w*b/B)),hh=84,x=26,y=26,t0=x+(w-tw)/2;
 return svg(w+70,hh+y+26,pg([x,y+hh],[x+w,y+hh],[t0+tw,y],[t0,y])+ln(t0,y,t0,y+hh,1)+ra(t0,y+hh,1,0,0,-1)+tx(x+w/2,y+hh+18,`${nm(B)} cm`)+tx(t0+tw/2,y-6,`${nm(b)} cm`)+tx(t0+6,y+hh/2+4,`${nm(h)} cm`,'start'))}
function circ(r){const cx=100,cy=78,R=56;return svg(200,156,`<circle cx="${cx}" cy="${cy}" r="${R}"/>`+dot(cx,cy,2.5)+ln(cx,cy,cx+R,cy)+tx(cx+R/2,cy-8,`r = ${nm(r)} cm`))}
function casa(w,h,t){const W=150,sc=W/w,H=f(Math.min(90,Math.max(40,h*sc))),T=f(Math.min(60,Math.max(30,t*sc))),x=60,y=14+T;
 return svg(W+130,y+H+30,`<rect x="${x}" y="${y}" width="${W}" height="${H}"/>`+pg([x,y],[x+W,y],[x+W/2,y-T])+ln(x+W/2,y-T,x+W/2,y,1)+ra(x+W/2,y,1,0,0,-1,8)+tx(x+W/2+6,y-T/2+4,`${nm(t)} m`,'start')+tx(x+W/2,y+H+18,`${nm(w)} m`)+tx(x-8,y+H/2+4,`${nm(h)} m`,'end'))}
function rtShape(x,y0,w,h,lab,o={}){const P0=[x,y0],P1=[x+w,y0],P2=[x,y0-h];
 let s=pg(P0,P1,P2)+ra(x,y0,1,0,0,-1)+tx(x+w/2,y0+18,lab.b||'')+tx(x-8,y0-h/2+4,lab.l||'','end')+tx(x+w/2+10,y0-h/2-6,lab.h||'','start');
 if(o.ang=='br')s+=arcB(P1,P0,P2,26,o.al||'α',42);
 return s}
function rtri(wN,hN,lab,o={}){const mx=Math.max(wN,hN),w=f(Math.max(60,150*wN/mx)),h=f(Math.max(50,120*hN/mx)),x=62,y=16;
 return svg(x+w+74,h+y+30,rtShape(x,y+h,w,h,lab,o))}
function escalera(lad,dist,alt){const gy=140,wx=190,b=[80,gy],t=[wx,40];let s=ln(14,gy,226,gy)+ln(wx,gy,wx,14);
 for(let y=26;y<gy;y+=14)s+=ln(wx,y+8,wx+8,y,0,1);
 s+=ln(b[0],b[1],t[0],t[1],0,3)+ra(wx,gy,-1,0,0,-1)+tx(135-10,(gy+40)/2-10,lad,'end')+tx(135,gy+18,dist)+tx(wx+22,(40+gy)/2+4,alt,'start');
 return svg(wx+90,gy+28,s)}
function paralelas(a){const y1=44,y2=108,X1=[100,y1],d=[-.45,.89],t2=(y2-y1)/d[1],T0=[100-d[0]*45,y1-d[1]*45],T1=[100+d[0]*(t2+40),y1+d[1]*(t2+40)];
 let s=ln(10,y1,220,y1)+ln(10,y2,220,y2)+ln(T0[0],T0[1],T1[0],T1[1])+tx(230,y1+4,'r','start')+tx(230,y2+4,'s','start')+tx(T0[0]+8,T0[1]+4,'t','start');
 const Q=[X1[0]-d[0]*30,X1[1]-d[1]*30],Rr=[X1[0]+30,y1],Ll=[X1[0]-30,y1];
 s+=a<90?arcB(X1,Rr,Q,24,nm(a)+'°',42):arcB(X1,Ll,Q,24,nm(a)+'°',42);
 return svg(250,152,s,1)}
function triAng(la,lb,lc){const A=[24,128],B=[206,128],C=[110,22];return svg(230,140,pg(A,B,C)+arcB(A,B,C,22,la,52)+arcB(B,A,C,22,lb,52)+arcB(C,A,B,20,lc,46),1)}
function compl(a){const V=[60,110],E=[V[0]+120*Math.cos(a*D2R),V[1]-120*Math.sin(a*D2R)];return svg(225,126,ln(10,110,215,110)+ln(V[0],V[1],E[0],E[1])+dot(V[0],V[1],2.5)+arcB(V,[V[0]+40,V[1]],E,32,nm(a)+'°',50))}
function isos(a){const A=[30,122],B=[190,122],C=[110,18];return svg(220,140,pg(A,B,C)+arcB(C,A,B,26,nm(a)+'°',46)+tick(C,A)+tick(C,B)+tx(A[0]+30,A[1]-7,'?')+tx(B[0]-30,B[1]-7,'?'),1)}
function thales(sa,sb,sc,sx){const ys=[30,78,128],x1=y=>70+(y-10)*(30/135),x2=y=>170+(y-10)*(50/135);
 return svg(300,150,ys.map(y=>ln(30,y,270,y)).join('')+ln(x1(10),10,x1(145),145)+ln(x2(10),10,x2(145),145)+tx(x1(54)-8,58,sa,'end')+tx(x1(103)-8,107,sb,'end')+tx(x2(54)+8,58,sc,'start')+tx(x2(103)+8,107,sx,'start'),1)}
function semej(a,b,c,k,x,y){const sc=70/Math.max(a,b),w1=f(b*sc),h1=f(a*sc),w2=f(w1*1.8),h2=f(h1*1.8),y0=22+h2,x2=60+w1+95;
 return svg(x2+w2+60,y0+30,rtShape(60,y0,w1,h1,{b:`${b} cm`,l:`${a} cm`,h:`${c} cm`})+rtShape(x2,y0,w2,h2,{b:x,l:`${a*k} cm`,h:y}),1)}
function sombras(Hl,s1,s2){const gy=140;let s='<g transform="translate(26 0)">'+ln(10,gy,290,gy)+`<circle cx="40" cy="86" r="6"/>`+ln(40,92,40,116)+ln(28,102,52,102)+ln(40,116,34,gy)+ln(40,116,46,gy)
 +`<rect x="146" y="112" width="8" height="28"/><ellipse cx="150" cy="82" rx="30" ry="34"/>`+ln(40,gy,72,gy,0,5)+ln(150,gy,228,gy,0,5)
 +tx(26,118,Hl,'end')+tx(56,gy+18,s1)+tx(189,gy+18,s2)+tx(112,100,'?','end')+'</g>';return svg(326,gy+28,s,1)}
function cubo(a){const x=24,y=48,S=72,dx=30,dy=-30;let s=`<rect x="${x}" y="${y}" width="${S}" height="${S}"/>`+ln(x,y,x+dx,y+dy)+ln(x+S,y,x+S+dx,y+dy)+ln(x+S,y+S,x+S+dx,y+S+dy)+ln(x+dx,y+dy,x+S+dx,y+dy)+ln(x+S+dx,y+dy,x+S+dx,y+S+dy)
 +ln(x,y+S,x+dx,y+S+dy,1)+ln(x+dx,y+dy,x+dx,y+S+dy,1)+ln(x+dx,y+S+dy,x+S+dx,y+S+dy,1)+tx(x+S/2,y+S+18,`${nm(a)} cm`);return svg(160,y+S+28,s)}
function prisma(l,a,h,u){const x=50,y=40,fw=f(Math.min(120,Math.max(70,l*14))),fh=f(Math.min(90,Math.max(44,h*12))),dx=34,dy=-26,U=u||'cm';
 let s=`<rect x="${x}" y="${y}" width="${fw}" height="${fh}"/>`+ln(x,y,x+dx,y+dy)+ln(x+fw,y,x+fw+dx,y+dy)+ln(x+fw,y+fh,x+fw+dx,y+fh+dy)+ln(x+dx,y+dy,x+fw+dx,y+dy)+ln(x+fw+dx,y+dy,x+fw+dx,y+fh+dy)
 +ln(x,y+fh,x+dx,y+fh+dy,1)+ln(x+dx,y+dy,x+dx,y+fh+dy,1)+ln(x+dx,y+fh+dy,x+fw+dx,y+fh+dy,1)+tx(x+fw/2,y+fh+18,`${nm(l)} ${U}`)+tx(x-6,y+fh/2+4,`${nm(h)} ${U}`,'end')+tx(x+fw+dx/2+6,y+fh+dy/2+14,`${nm(a)} ${U}`,'start');
 return svg(x+fw+dx+70,y+fh+30,s)}
function cil(r,h){const cx=96,cy=40,rx=46,ry=14,H=82;return svg(240,cy+H+ry+26,`<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/>`+ln(cx-rx,cy,cx-rx,cy+H)+ln(cx+rx,cy,cx+rx,cy+H)
 +`<path d="M${cx-rx} ${cy+H} A${rx} ${ry} 0 0 0 ${cx+rx} ${cy+H}"/><path d="M${cx-rx} ${cy+H} A${rx} ${ry} 0 0 1 ${cx+rx} ${cy+H}" stroke-dasharray="5 4"/>`+dot(cx,cy,2.2)+ln(cx,cy,cx+rx,cy)+tx(cx+rx+8,cy+4,`r = ${nm(r)} cm`,'start')+tx(cx+rx+8,cy+H/2+4,`h = ${nm(h)} cm`,'start'))}
function sombraAng(g,s){const gy=130,px=40,top=[px,50],end=[200,gy];return svg(250,gy+30,ln(20,gy,240,gy)+ln(px,gy,px,50)+ra(px,gy,1,0,0,-1)+ln(top[0],top[1],end[0],end[1],1)+arcB(end,[end[0]-40,gy],top,28,nm(g)+'°',48)+tx(px-8,92,'h = ?','end')+tx(120,gy+18,`${nm(s)} m`),1)}
function tcos(a,b,t){const C=[96,122],s=Math.min(120/Math.max(a,b),120/(a*Math.sin(t*D2R)+.001)),Lb=f(b*s),La=f(a*s),A=[C[0]+Lb,C[1]],B=[C[0]+La*Math.cos(-t*D2R),C[1]+La*Math.sin(-t*D2R)];
 return svg(C[0]+Lb+70,150,pg(C,A,B)+arcB(C,A,B,24,t+'°',t>90?31:42)+out(mid(C,B),A,`${nm(a)} cm`,26)+out(mid(C,A),B,`${nm(b)} cm`,16)+out(mid(A,B),C,'c = ?',20),1)}
function tsin(A0,B0,la,lb){const C0=180-A0-B0,A=[24,128],c=190,B=[A[0]+c,128],b=c*Math.sin(B0*D2R)/Math.sin(C0*D2R),C=[A[0]+b*Math.cos(A0*D2R),128-b*Math.sin(A0*D2R)];
 let s=pg(A,B,C)+arcB(A,B,C,24,A0+'°',44)+out(mid(B,C),A,la,16)+out(mid(A,C),B,lb,16);
 s+=B0==90?ra(B[0],B[1],-1,0,0,-1):arcB(B,A,C,24,B0+'°',44);return svg(260,150,s,1)}
function plane(o){const x0=Math.min(o.x0,0),x1=Math.max(o.x1,0),y0=Math.min(o.y0,0),y1=Math.max(o.y1,0),sx=x1-x0,sy=y1-y0,cell=Math.min(20,Math.floor(300/sx),Math.floor(240/sy)),pad=24,W=sx*cell+2*pad,H=sy*cell+2*pad,P=(x,y)=>[pad+(x-x0)*cell,pad+(y1-y)*cell],O=P(0,0),st=cell<13?2:1;
 let s='';for(let i=x0;i<=x1;i++)s+=ln(P(i,0)[0],pad,P(i,0)[0],H-pad,0,.6).replace('/>',' stroke-opacity=".25"/>');for(let j=y0;j<=y1;j++)s+=ln(pad,P(0,j)[1],W-pad,P(0,j)[1],0,.6).replace('/>',' stroke-opacity=".25"/>');
 s+=ln(pad-8,O[1],W-pad+10,O[1])+ln(O[0],H-pad+8,O[0],pad-10)+pg([W-pad+10,O[1]],[W-pad+3,O[1]-3],[W-pad+3,O[1]+3])+pg([O[0],pad-10],[O[0]-3,pad-3],[O[0]+3,pad-3])+tx(W-pad+14,O[1]+16,'x','start')+tx(O[0]+9,pad-8,'y','start');
 for(let i=x0;i<=x1;i++)if(i&&i%st==0)s+=tx(P(i,0)[0],O[1]+13,nm(i),'middle',9);for(let j=y0;j<=y1;j++)if(j&&j%st==0)s+=tx(O[0]-5,P(0,j)[1]+3,nm(j),'end',9);s+=tx(O[0]-5,O[1]+12,'0','end',9);
 const body=o.draw?o.draw(P,cell):'';return svg(W,H,s+body)}
const plot=(P,fn,xa,xb,ya,yb)=>{let d='',pen=0;for(let i=0;i<=Math.round((xb-xa)*10);i++){const x=xa+i/10,y=fn(x);if(y>=ya-.2&&y<=yb+.2){const p=P(x,y);d+=(pen?'L':'M')+f(p[0])+' '+f(p[1])+' ';pen=1}else pen=0}return `<path d="${d}" stroke-width="2"/>`};
const pt=(P,x,y,l,dx=7,dy=-7)=>{const p=P(x,y);return dot(p[0],p[1],3.2)+(l?tx(p[0]+dx,p[1]+dy,l,'start'):'')};
function nline(o){const w=o.w||300,pad=20,min=o.min,max=o.max,rows=o.rows||0,RS=24,y=30+rows*RS,X=v=>pad+(Math.min(max,Math.max(min,v))-min)/(max-min)*(w-2*pad);
 let s=ln(6,y,w-6,y)+pg([w-4,y],[w-11,y-3.5],[w-11,y+3.5])+pg([4,y],[11,y-3.5],[11,y+3.5]);
 for(let v=min;v<=max;v++){if(o.labels=='all'){s+=ln(X(v),y-4,X(v),y+4)+tx(X(v),y+17,nm(v),'middle',10)}else if(o.labels=='zero'&&v==0)s+=ln(X(v),y-4,X(v),y+4)+tx(X(v),y+17,'0','middle',10)}
 (o.segs||[]).forEach(g=>{const yy=y-(g.row||0)*RS,xa=g.a===-Infinity?6:X(g.a),xb=g.b===Infinity?w-6:X(g.b);s+=ln(xa,yy,xb,yy,0,5);
  if(g.a!==-Infinity)s+=`<circle cx="${f(xa)}" cy="${yy}" r="4.2" fill="${g.ca?'currentColor':'#fff'}" stroke-width="1.5"/>`;if(g.b!==Infinity)s+=`<circle cx="${f(xb)}" cy="${yy}" r="4.2" fill="${g.cb?'currentColor':'#fff'}" stroke-width="1.5"/>`;
  if(g.l)s+=tx(w-6,yy-8,g.l,'end',11)});
 (o.pts||[]).forEach(p=>{s+=dot(X(p.x),y,3.6)+tx(X(p.x),y-10,p.l,'middle',13)});
 return svg(w,y+26,s)}
function bars(lab,vals,o={}){const n=lab.length,bw=26,gap=18,x0=44,H=150,top=22,yt=Math.ceil(Math.max(...vals)/2)*2||2,W=x0+n*(bw+gap)+8,Y=v=>top+H-v/yt*H;let s=o.title?tx(W/2,12,o.title,'middle',11):'';
 for(let v=0;v<=yt;v+=2)s+=ln(x0,Y(v),W-6,Y(v),0,.6).replace('/>',' stroke-opacity=".3"/>')+tx(x0-6,Y(v)+4,v,'end',10);
 s+=ln(x0,top,x0,top+H)+ln(x0,top+H,W-6,top+H);vals.forEach((v,i)=>{const x=x0+gap/2+i*(bw+gap);s+=`<rect x="${x}" y="${f(Y(v))}" width="${bw}" height="${f(top+H-Y(v))}" fill="currentColor" fill-opacity=".3"/>`+tx(x+bw/2,top+H+16,lab[i],'middle',11)});
 return svg(W,top+H+26,s)}
function die(n,x,y,s=34){const P={1:[[.5,.5]],2:[[.25,.25],[.75,.75]],3:[[.25,.25],[.5,.5],[.75,.75]],4:[[.25,.25],[.75,.25],[.25,.75],[.75,.75]],5:[[.25,.25],[.75,.25],[.5,.5],[.25,.75],[.75,.75]],6:[[.27,.22],[.73,.22],[.27,.5],[.73,.5],[.27,.78],[.73,.78]]};return `<rect x="${x}" y="${y}" width="${s}" height="${s}" rx="6"/>`+P[n].map(p=>dot(x+p[0]*s,y+p[1]*s,2.6)).join('')}
const dice=l=>svg(l.length*42+6,44,l.map((n,i)=>die(n,4+i*42,4)).join(''));
const shade=' fill="currentColor" fill-opacity=".35"';
function fracRect(n,d){const w=200,h=44,x=10,y=10,cw=w/d;let s='';for(let i=0;i<d;i++)s+=`<rect x="${f(x+i*cw)}" y="${y}" width="${f(cw)}" height="${h}"${i<n?shade:''}/>`;return svg(w+20,h+20,s)}
function fracPie(n,d){const cx=70,cy=64,r=52;let s='';for(let i=0;i<d;i++){const a1=-90+360*i/d,a2=-90+360*(i+1)/d,p=a=>[cx+r*Math.cos(a*D2R),cy+r*Math.sin(a*D2R)],[x1,y1]=p(a1),[x2,y2]=p(a2);s+=`<path d="M${cx} ${cy} L${f(x1)} ${f(y1)} A${r} ${r} 0 0 1 ${f(x2)} ${f(y2)} Z"${i<n?shade:''}/>`}return svg(140,128,s)}
function grid100(n){const c=14,x=8,y=8;let s='';for(let i=0;i<100;i++)s+=`<rect x="${x+(i%10)*c}" y="${y+Math.floor(i/10)*c}" width="${c}" height="${c}"${i<n?shade:''} stroke-width=".8"/>`;return svg(x*2+10*c,y*2+10*c,s)}
return {rect,tri,trap,circ,casa,rtri,escalera,paralelas,triAng,compl,isos,thales,semej,sombras,cubo,prisma,cil,sombraAng,tcos,tsin,plane,plot,pt,nline,bars,dice,fracRect,fracPie,grid100,dot,tx,ln,f};
})();

/* --- Ejercicios con figura, intervalos y problemas contextualizados --- */
(()=>{
const rd=(x,k=1)=>num(Math.round(x*10**k)/10**k);
const nz=(a,b)=>{let x;do{x=R(a,b)}while(!x);return x};
const $$=n=>'$'+String(n).replace(/\B(?=(\d{3})+(?!\d))/g,'.');
const nm=v=>typeof v==='number'?num(v):v;
const ext={},add=(k,a,b,c)=>{ext[k]=[a||[],b||[],c||[]]};
const T3=TRI.slice(0,3);
const blank=(c='')=>`<span class="blank ${c}"></span>`;
const sub=(l,t)=>`<div class="sub"><b>${l})</b> ${t}</div>`;

/* ----- Intervalos ----- */
const INF=Infinity,iv=(lo,hi,lc,hc)=>({lo,hi,lc,hc});
const nI=v=>v===INF?'+∞':v===-INF?'−∞':num(v);
const ivs=I=>`${I.lc?'[':'('}${nI(I.lo)}; ${nI(I.hi)}${I.hc?']':')'}`;
const has=(I,x)=>(x>I.lo||(x==I.lo&&I.lc))&&(x<I.hi||(x==I.hi&&I.hc));
const subset=(I,J)=>(I.lo>J.lo||(I.lo==J.lo&&(J.lc||!I.lc)))&&(I.hi<J.hi||(I.hi==J.hi&&(J.hc||!I.hc)));
const ineq=I=>I.lo===-INF?`x ${I.hc?'≤':'&lt;'} ${nI(I.hi)}`:I.hi===INF?`x ${I.lc?'≥':'&gt;'} ${nI(I.lo)}`:`${nI(I.lo)} ${I.lc?'≤':'&lt;'} x ${I.hc?'≤':'&lt;'} ${nI(I.hi)}`;
const colo=I=>I.lo===-INF?`los números reales ${I.hc?'menores o iguales que':'menores que'} ${nI(I.hi)}`:I.hi===INF?`los números reales ${I.lc?'mayores o iguales que':'mayores que'} ${nI(I.lo)}`:`los números reales ${I.lc?'mayores o iguales que':'mayores que'} ${nI(I.lo)} y ${I.hc?'menores o iguales que':'menores que'} ${nI(I.hi)}`;
const clasif=I=>I.lc&&I.hc?'cerrado':!I.lc&&!I.hc?'abierto':'semiabierto';
const seg=(I,row)=>({a:I.lo,b:I.hi,ca:I.lc,cb:I.hc,row});
const randFin=()=>{const lo=R(-6,3),hi=Math.min(6,lo+R(2,7));return iv(lo,hi,!!R(0,1),!!R(0,1))};
const randAny=()=>{const t=R(0,5);if(t==0)return iv(-INF,R(-3,5),0,!!R(0,1));if(t==1)return iv(R(-4,3),INF,!!R(0,1),0);return randFin()};
const narrow=J=>{const lo0=J.lo===-INF?-5:J.lo,hi0=J.hi===INF?8:J.hi,lo=R(lo0,hi0-1),hi=R(lo+1,hi0);return iv(lo,hi,!!R(0,1),!!R(0,1))};
const box='<span class="box"></span>';
TOPICS.push({k:'intervalos',n:'Intervalos y desigualdades',y:[3,4]});
add('intervalos',
[()=>{const I=randFin();return[`Dado el intervalo <b>${ivs(I)}</b>:${sub('a','Clasificar el intervalo (abierto, cerrado o semiabierto): '+blank())}${sub('b','Expresarlo coloquialmente: '+blank('wide'))}${sub('c','Expresarlo como inecuación: '+blank())}`,
  `a) ${clasif(I)}<br>b) ${colo(I)}<br>c) ${ineq(I)}`]}],
[()=>{const I=randAny();return[`Dada la inecuación <b>${ineq(I)}</b>:${sub('a','Escribirla como intervalo: '+blank())}${sub('b','Marcarla en la recta numérica (ubicá bien los extremos y marcá si están incluidos o no):')}`,
  `a) ${ivs(I)}<br>b) Ver la recta: círculo lleno si el extremo está incluido y vacío si no.`,
  FIG.nline({min:-6,max:6,labels:'zero'}),FIG.nline({min:-6,max:6,labels:'all',segs:[seg(I,0)]})]}],
[()=>{const items=[],ans=[];const els=[],ivl=[];
  for(let i=0;i<3;i++){const J=randAny();let x=PK([J.lo,J.hi,R(-5,6)]);if(!isFinite(x))x=R(-5,6);items.push([nm(x),ivs(J),has(J,x)?'∈':'∉']);}
  for(let i=0;i<3;i++){const J=randAny(),I=R(0,1)?narrow(J):randAny();items.push([ivs(I),ivs(J),subset(I,J)?'⊂':'⊄']);}
  const L='abcdef';const q=items.map((it,i)=>`<div class="sub"><b>${L[i]})</b> &nbsp;${it[0]} ${box} ${it[1]}</div>`).join('');
  return[`Colocar el signo que corresponde en cada caso (∈ , ∉ , ⊂ , ⊄):<div class="grid2">${q}</div>`,items.map((it,i)=>`${L[i]}) ${it[2]}`).join(' &nbsp; ')]},
 ()=>{const J=iv(R(-3,0),INF,!!R(0,1),0),I=narrow(iv(J.lo,5,J.lc,0));const ok=subset(I,J);
  return[`Mostrar, marcando en una misma recta, que <b>${ivs(I)} ⊂ ${ivs(J)}</b>. Usá dos colores o dos alturas distintas, y escribí si la afirmación es verdadera o falsa.`,
  `${ok?'Verdadero':'Falso'}: ${ivs(I)} ${ok?'⊂':'⊄'} ${ivs(J)}. En la recta, el primer intervalo ${ok?'queda totalmente incluido en el segundo.':'tiene puntos que no están en el segundo.'}`,
  FIG.nline({min:-6,max:8,labels:'zero',rows:1}),FIG.nline({min:-6,max:8,labels:'all',rows:1,segs:[{...seg(I,0),l:ivs(I)},{...seg(J,1),l:ivs(J)}]})]}]);

/* ----- Enteros, fracciones, porcentaje ----- */
add('enteros',
[()=>{let a,b;do{a=R(-8,8);b=R(-8,8)}while(Math.abs(a-b)<2);return[`Observá la recta numérica. a) ¿Qué número representa cada punto, A y B? b) ¿A qué distancia están uno del otro?`,`A = ${num(a)}; B = ${num(b)}; distancia = ${Math.abs(a-b)}`,FIG.nline({min:-9,max:9,labels:'all',pts:[{x:a,l:'A'},{x:b,l:'B'}]})]}]);
add('fracciones',
[()=>{const d=PK([4,6,8,10,12]),n=R(1,d-1);return[`¿Qué fracción de la figura está pintada? Escribila y, si se puede, simplificala.`,`${F(n,d)}${gcd(n,d)>1?' (= '+fr(n,d)+' sin simplificar)':''}`,R(0,1)?FIG.fracRect(n,d):FIG.fracPie(n,d)]}]);
const OBJ=[['un par de zapatillas'],['una campera de abrigo'],['una mochila'],['una bicicleta'],['un celular'],['una consola de videojuegos'],['un televisor'],['una notebook']];
add('porcentaje',
[()=>{const n=5*R(2,18);return[`¿Qué porcentaje de la cuadrícula está pintado? (La cuadrícula completa tiene 100 cuadraditos.)`,`${n}%`,FIG.grid100(n)]},
 ()=>{let N,p,x;do{N=PK([120,160,200,240,300,360,400,500]);p=PK([10,15,20,25,30,35,40,45,60,75]);x=N*p/100}while(x%1);return[`Un cine tiene capacidad para ${N} espectadores. Para la función de la tarde se vendió el ${p}% de las entradas. ¿Cuántas entradas se vendieron?`,`${x} entradas (${p}% de ${N})`]},
 ()=>{let N,p,x;do{N=PK([20,25,40,50,80,100,200]);p=PK([10,20,25,30,35,40,45,60,70,75]);x=N*p/100}while(x%1);const pr=PK(['Entre Ríos','Santa Fe','Córdoba','Corrientes','Misiones']);return[`En un torneo participaron ${N} deportistas. De ellos, ${x} representaban a la provincia de ${pr}. ¿Qué porcentaje de los deportistas no eran de ${pr}?`,`Eran de ${pr} el ${p}%, por lo tanto no eran de ${pr} el ${100-p}%`]}],
[()=>{const o=PK(OBJ)[0],P=5000*R(4,60),p=PK([10,15,20,25,30,40,50]);return[`${o[0].toUpperCase()+o.slice(1)} cuesta ${$$(P)}. Por liquidación de temporada tiene un descuento del ${p}%. ¿Cuál es el precio final?`,`Descuento: ${$$(P*p/100)}; precio final: ${$$(P-P*p/100)}`]},
 ()=>{const o=PK(OBJ)[0],P=1000*R(30,200),p=PK([5,10,15,20,25]);return[`${o[0].toUpperCase()+o.slice(1)} vale ${$$(P)}. Si se abona en efectivo, el local ofrece un ${p}% de descuento. ¿Cuánto dinero se ahorra en la compra y cuánto se paga finalmente?`,`Se ahorra ${$$(P*p/100)}; se paga ${$$(P-P*p/100)}`]},
 ()=>{let P,r,c,tot;do{P=10000*R(15,45);r=PK([10,15,20,25,30]);c=PK([3,6,12]);tot=P*(100+r)/100}while(tot%c);const o=PK(OBJ)[0];return[`${o[0].toUpperCase()+o.slice(1)} tiene un precio de contado de ${$$(P)}. Si se compra en ${c} cuotas con un recargo del ${r}%, ¿cuál será el precio total a pagar y cuál el valor de cada cuota?`,`Recargo: ${$$(P*r/100)}; total: ${$$(tot)}; cada cuota: ${$$(tot/c)}`]}],
[()=>{const P=5000*R(6,60),p=PK([10,15,20,25,30,40]),fin=P*(100-p)/100,o=PK(OBJ)[0];return[`Por un descuento del ${p}%, ${o} se pagó ${$$(fin)}. ¿Cuál era el precio original? (Pista: el precio con descuento es el ${100-p}% del precio original.)`,`Precio original = ${$$(fin)} ÷ ${num((100-p)/100)} = ${$$(P)}`]},
 ()=>{const P=10000*R(10,40),a=PK([10,20]),b=PK([10,20,30]),fin=P*(100-a)*(100-b)/10000;return[`Un artículo de ${$$(P)} tiene un descuento del ${a}% y, sobre el precio ya descontado, otro del ${b}%. ¿Cuál es el precio final y qué porcentaje total se descontó? (Los descuentos sucesivos no se suman.)`,`Precio final: ${$$(fin)}; descuento total: ${100-(100-a)*(100-b)/100}%`]}]);

/* ----- Geometría ----- */
add('geometria',
[()=>{const l=R(3,12),a=R(2,9);return[`Observá el rectángulo y calculá su perímetro y su área.`,`Perímetro = ${2*(l+a)} cm; Área = ${l*a} cm²`,FIG.rect(l,a)]},
 ()=>{const l=R(2,12);return[`Observá el cuadrado y calculá su perímetro y su área.`,`Perímetro = ${4*l} cm; Área = ${l*l} cm²`,FIG.rect(l,l,{sq:1})]}],
[()=>{const b=R(4,16),h=R(3,12);return[`Calculá el área del triángulo de la figura (la línea punteada es la altura).`,`${num(b*h/2)} cm²`,FIG.tri(b,h)]},
 ()=>{const B=R(8,16),b=R(3,B-3),h=R(3,10);return[`Calculá el área del trapecio de la figura (la línea punteada es la altura).`,`${num((B+b)*h/2)} cm²`,FIG.trap(B,b,h)]},
 ()=>{const r=R(2,9);return[`Calculá el área y el perímetro del círculo de la figura. Dejá el resultado expresado con π.`,`Área = ${r*r}π cm²; perímetro = ${2*r}π cm`,FIG.circ(r)]}],
[()=>{const w=PK([4,6,8,10]),h=R(3,6),t=R(2,4);return[`La figura representa el frente de una casa: un rectángulo con un triángulo como techo. Calculá su área total (sumá el área del rectángulo y la del triángulo).`,`Rectángulo: ${w*h} m²; triángulo: ${w*t/2} m²; total: ${w*h+w*t/2} m²`,FIG.casa(w,h,t)]}]);

add('pitagoras',
[()=>{const[a,b,c]=PK(TRI),k=R(1,2);return[`Observá el triángulo rectángulo. Calculá la longitud de la hipotenusa x.`,`x² = ${(a*k)**2} + ${(b*k)**2} = ${(c*k)**2}; x = ${c*k} cm`,FIG.rtri(b*k,a*k,{b:`${b*k} cm`,l:`${a*k} cm`,h:'x'})]}],
[()=>{const[a,b,c]=PK(TRI),k=R(1,2);return[`Observá el triángulo rectángulo. Calculá la longitud del cateto x.`,`x² = ${(c*k)**2} − ${(a*k)**2} = ${(b*k)**2}; x = ${b*k} cm`,FIG.rtri(b*k,a*k,{b:'x',l:`${a*k} cm`,h:`${c*k} cm`})]},
 ()=>{const[a,b,c]=PK(TRI),k=R(1,2);return[`Observá la figura: una escalera de ${c*k} m está apoyada en una pared, con el pie a ${a*k} m de ella. ¿A qué altura de la pared llega?`,`h² = ${(c*k)**2} − ${(a*k)**2} = ${(b*k)**2}; h = ${b*k} m`,FIG.escalera(`${c*k} m`,`${a*k} m`,'h = ?')]}],
[()=>{const[a,b,c]=PK(TRI),k=R(1,2);return[`Un rectángulo mide ${b*k} cm de largo y ${a*k} cm de ancho. Calculá la longitud de su diagonal d (la diagonal forma, con dos lados, un triángulo rectángulo).`,`d² = ${(a*k)**2} + ${(b*k)**2} = ${(c*k)**2}; d = ${c*k} cm`,FIG.rect(b*k,a*k,{diag:'d'})]}]);

/* ----- Ángulos, semejanza, cuerpos ----- */
add('angulos',
[()=>{const a=R(10,80);return[`Observá la figura: el ángulo marcado mide ${a}°. Calculá la medida de su complemento (lo que falta para llegar a 90°) y de su suplemento (lo que falta para llegar a 180°).`,`Complemento = ${90-a}°; suplemento = ${180-a}°`,FIG.compl(a)]}],
[()=>{let a,b;do{a=R(20,100);b=R(20,100)}while(a+b>=170||a+b<=30);const c=180-a-b,m=Math.max(a,b,c);return[`En el triángulo de la figura se conocen dos ángulos. Calculá el tercero (x) y clasificá el triángulo según sus ángulos (acutángulo, rectángulo u obtusángulo).`,`x = 180° − ${a}° − ${b}° = ${c}°; ${m>90?'obtusángulo':m==90?'rectángulo':'acutángulo'}`,FIG.triAng(a+'°',b+'°','x')]}],
[()=>{const a=R(40,140);return[`Las rectas r y s son paralelas y están cortadas por la transversal t. El ángulo marcado mide ${a}°. Hallá la medida del ángulo opuesto por el vértice, del correspondiente y del adyacente a él.`,`Opuesto = ${a}°; correspondiente = ${a}°; adyacente = ${180-a}°`,FIG.paralelas(a)]},
 ()=>{const a=R(10,75)*2;return[`En el triángulo isósceles de la figura, el ángulo desigual mide ${a}°. ¿Cuánto miden los otros dos ángulos? (Los ángulos de la base son iguales.)`,`(180° − ${a}°) ÷ 2 = ${(180-a)/2}° cada uno`,FIG.isos(a)]}]);

add('semejanza',
[()=>{const[a,b,c]=PK(T3),k=R(2,4);return[`Los dos triángulos de la figura son semejantes. Calculá las longitudes x e y del segundo triángulo.`,`Razón de semejanza = ${a*k} ÷ ${a} = ${k}; x = ${b*k} cm; y = ${c*k} cm`,FIG.semej(a,b,c,k,'x','y')]}],
[()=>{const H=PK([15,18,20]),k=R(3,8),s=R(2,3);return[`Observá la figura. En el mismo momento del día, una persona de ${num(H/10)} m de altura proyecta una sombra de ${s} m y un árbol proyecta una sombra de ${s*k} m. Calculá la altura del árbol aplicando semejanza de triángulos.`,`${num(H/10)} ÷ ${s} = h ÷ ${s*k}; h = ${num(H*k/10)} m`,FIG.sombras(num(H/10)+' m',s+' m',s*k+' m')]}],
[()=>{const a=R(2,6),m=R(2,4),c=R(2,6);return[`Las rectas horizontales de la figura son paralelas. Aplicando el teorema de Thales, calculá x.`,`${a} ÷ ${a*m} = ${c} ÷ x; x = ${c*m} cm`,FIG.thales(a+' cm',a*m+' cm',c+' cm','x')]}]);

add('cuerpos',
[()=>{const a=R(2,9);return[`Observá el cubo. Calculá su volumen y su área total (el cubo tiene 6 caras iguales).`,`Volumen = ${a**3} cm³; área total = ${6*a*a} cm²`,FIG.cubo(a)]}],
[()=>{const l=R(3,9),a=R(2,7),h=R(2,8);return[`Observá el prisma de base rectangular. Calculá su volumen y su área total.`,`Volumen = ${l*a*h} cm³; área total = ${2*(l*a+l*h+a*h)} cm²`,FIG.prisma(l,a,h)]}],
[()=>{const r=R(2,8),h=R(3,12);return[`Observá el cilindro. Calculá su volumen y su área lateral. Dejá el resultado expresado con π.`,`Volumen = ${r*r*h}π cm³; área lateral = ${2*r*h}π cm²`,FIG.cil(r,h)]},
 ()=>{const l=R(3,8),a=R(2,6),h=R(2,5);return[`Un acuario tiene las medidas de la figura. ¿Cuántos litros de agua entran si se llena por completo? (1 dm³ = 1 litro)`,`${l*a*h} litros`,FIG.prisma(l,a,h,'dm')]}]);

/* ----- Trigonometría ----- */
add('trigonometria',
[()=>{const[a,b,c]=PK(TRI.slice(0,2)),k=R(1,3);return[`Observá el triángulo rectángulo. Para el ángulo α, calculá sen α, cos α y tan α (dejalos como fracciones).`,`sen α = ${F(a,c)}; cos α = ${F(b,c)}; tan α = ${F(a,b)}`,FIG.rtri(b*k,a*k,{b:`${b*k} cm`,l:`${a*k} cm`,h:`${c*k} cm`},{ang:'br'})]}],
[()=>{const a=R(3,9),b=R(a+1,12),al=Math.atan(a/b)*180/Math.PI;return[`Observá el triángulo rectángulo. Calculá, con la calculadora, el ángulo α (redondeá a un decimal). Ayuda: conocés el cateto opuesto y el adyacente.`,`tan α = ${a} ÷ ${b}; α ≈ ${rd(al)}°`,FIG.rtri(b,a,{b:`${b} cm`,l:`${a} cm`,h:'?'},{ang:'br'})]}],
[()=>{const s=R(2,12),t=PK([[45,`${s} m`],[60,`${s}√3 m`],[30,`${fxx(s+'√3',3)} m`]]);return[`Observá la figura: un poste proyecta una sombra de ${s} m y los rayos del sol forman un ángulo de ${t[0]}° con el suelo. ¿Cuál es la altura h del poste? (tan 30° = √3 ÷ 3; tan 45° = 1; tan 60° = √3)`,`h = ${s} · tan ${t[0]}° = ${t[1]}`,FIG.sombraAng(t[0],s)]}]);
function fxx(t,d){return `<span class="fr"><i>${t}</i><i>${d}</i></span>`}
add('teorema_seno_coseno',
[()=>{const k=R(2,9);return[`Observá el triángulo: calculá el lado b con el teorema del seno.`,`b = ${2*k} cm`,FIG.tsin(30,90,`a = ${k} cm`,'b = ?')]}],
[()=>{const a=R(3,9),b=R(3,9),t=PK([60,120]),N=a*a+b*b+(t==60?-a*b:a*b);return[`Observá el triángulo. Calculá el lado c con el teorema del coseno (cos 60° = ½ ; cos 120° = −½).`,`c² = ${a}² + ${b}² ${t==60?'−':'+'} ${a*b} = ${N}; c ≈ ${rd(Math.sqrt(N),2)} cm`,FIG.tcos(a,b,t)]}],
[()=>{const k=R(2,9),t=PK([[45,'√2'],[60,'√3']]);return[`Observá el triángulo. Calculá el lado b con el teorema del seno (sen 30° = ½ ; sen 45° = √2 ÷ 2 ; sen 60° = √3 ÷ 2).`,`b = ${k}${t[1]} cm`,FIG.tsin(30,t[0],`a = ${k} cm`,'b = ?')]}]);

/* ----- Plano cartesiano y funciones ----- */
add('geometria_analitica',
[()=>{const k=R(1,3),x=R(-4,2),y=R(-4,2),Bx=x+3*k,By=y+4*k;return[`Observá los puntos A(${num(x)}; ${num(y)}) y B(${num(Bx)}; ${num(By)}) en el plano. Calculá la distancia entre ellos (fijate que forman un triángulo rectángulo con los ejes).`,`d = √((${pn(Bx)} − ${pn(x)})² + (${pn(By)} − ${pn(y)})²) = √(${(3*k)**2} + ${(4*k)**2}) = ${5*k} unidades`,
   FIG.plane({x0:Math.min(x,Bx)-1,x1:Math.max(x,Bx)+1,y0:Math.min(y,By)-1,y1:Math.max(y,By)+1,draw:(P)=>FIG.pt(P,x,y,'A')+FIG.pt(P,Bx,By,'B')+FIG.ln(...P(x,y),...P(Bx,By))})]}],
[()=>{const x1=R(-6,6),y1=R(-6,6),x2=R(-6,6),y2=R(-6,6);return[`Observá el segmento AB en el plano, con A(${num(x1)}; ${num(y1)}) y B(${num(x2)}; ${num(y2)}). Hallá las coordenadas de su punto medio M.`,`M(${num((x1+x2)/2)}; ${num((y1+y2)/2)})`,
   FIG.plane({x0:-7,x1:7,y0:-7,y1:7,draw:(P)=>FIG.pt(P,x1,y1,'A')+FIG.pt(P,x2,y2,'B')+FIG.ln(...P(x1,y1),...P(x2,y2))})]}],
[()=>{const h=nz(-4,4),k=nz(-4,4),r=R(2,4);return[`La figura muestra una circunferencia de radio ${r}. Leé en el plano las coordenadas del centro C y escribí la ecuación de la circunferencia.`,`Centro C(${num(h)}; ${num(k)}); (x ${sg(-h)})² + (y ${sg(-k)})² = ${r*r}`,
   FIG.plane({x0:-8,x1:8,y0:-8,y1:8,draw:(P,c)=>{const C=P(h,k);return `<circle cx="${FIG.f(C[0])}" cy="${FIG.f(C[1])}" r="${r*c}"/>`+FIG.pt(P,h,k,'C')+FIG.ln(...C,C[0]+r*c,C[1])}})]}]);

add('funcion_lineal',[],
[()=>{const m=nz(-3,3),b=R(-3,3);return[`Representá gráficamente la función <b>f(x) = ${lin(m,b)}</b> en el plano cartesiano. Ayuda: ubicá la ordenada al origen y, desde ahí, usá la pendiente para hallar otro punto.`,`Ordenada al origen: punto (0; ${num(b)}). Pendiente ${num(m)}: punto (1; ${num(m+b)}). Se unen los puntos con una recta.`,
  FIG.plane({x0:-6,x1:6,y0:-6,y1:6}),FIG.plane({x0:-6,x1:6,y0:-6,y1:6,draw:(P)=>FIG.plot(P,x=>m*x+b,-6,6,-6,6)+FIG.pt(P,0,b)+FIG.pt(P,1,m+b)})]}]);
add('funcion_cuadratica',[],[],
[()=>{let r1,r2;do{r1=nz(-4,4);r2=nz(-4,4)}while(r1==r2||Math.abs(r1-r2)>4);const xv=(r1+r2)/2,yv=-((r1-r2)**2)/4;return[`Representá gráficamente la función <b>f(x) = ${sum([[1,'x²'],[-(r1+r2),'x'],[r1*r2,'']])}</b> en el plano. Ayuda: hallá las raíces, el vértice y la ordenada al origen.`,
  `Raíces: x = ${num(r1)} y x = ${num(r2)}; vértice (${num(xv)}; ${num(yv)}); ordenada al origen: ${num(r1*r2)}.`,
  FIG.plane({x0:-6,x1:6,y0:-6,y1:6}),FIG.plane({x0:-6,x1:6,y0:-6,y1:6,draw:(P)=>FIG.plot(P,x=>(x-r1)*(x-r2),-6,6,-6,6)+FIG.pt(P,r1,0)+FIG.pt(P,r2,0)+FIG.pt(P,xv,yv)})]}]);

/* ----- Estadística y probabilidad ----- */
add('estadistica',[],
[()=>{const C=PK([['alumnos que usaron la biblioteca de la escuela','Lun Mar Mié Jue Vie'.split(' '),'durante una semana','día'],['entradas vendidas por un cine','Lun Mar Mié Jue Vie'.split(' '),'durante una semana','día'],['goles convertidos por un equipo','P1 P2 P3 P4 P5'.split(' '),'en 5 partidos','partido']]);
  const v=Array.from({length:5},()=>R(2,12)),tot=v.reduce((a,b)=>a+b,0),mx=Math.max(...v),dias=C[1].filter((x,i)=>v[i]==mx).join(' y ');
  return[`El gráfico muestra la cantidad de ${C[0]} ${C[2]}. Observalo y respondé: a) ¿En qué ${C[3]} fue mayor y cuánto fue? b) ¿Cuál es el total? c) Calculá la media (promedio).`,
  `a) ${dias}: ${mx}; b) total = ${tot}; c) media = ${tot} ÷ 5 = ${num(tot/5)}`,FIG.bars(C[1],v,{title:'Cantidad de '+C[0].split(' ')[0]})]}]);
add('probabilidad',
[()=>{const e=PK([['par',3],['mayor que 4',2],['múltiplo de 3',2],['menor que 3',2],['impar',3]]);return[`Se tira un dado común como los de la figura. ¿Cuál es la probabilidad de obtener un número ${e[0]}? (Contá los casos favorables y los casos posibles.)`,`${F(e[1],6)} (${e[1]} casos favorables de 6 posibles)`,FIG.dice([1,2,3,4,5,6])]}]);

const GEOM=['geometria','pitagoras','angulos','semejanza','cuerpos','trigonometria','teorema_seno_coseno','geometria_analitica'];
Object.keys(ext).forEach(k=>{const prev=GEN[k],pri=GEOM.includes(k);GEN[k]=d=>{const list=ext[k][d]||[];
  if(pri&&list.length&&(!prev||Math.random()>.15))return PK(list)();   // en geometría, casi siempre con dibujo
  const pool=(prev?[()=>prev(d)]:[]).concat(list);return PK(pool)()}});
TOPICS.sort((a,b)=>Math.min(...a.y)-Math.min(...b.y));
})();

const G={tips:true,title:'Evaluación de Matemática',escuela:'',curso:'',fecha:'',anio:3,dif:1,n:6,puntos:10,temas:[],b:false,all:false,sets:null,cur:'A'};

function one(k,d){const[q,a,f,fa]=GEN[k](d),T=TIPS[k];return{t:k,d,q,a:typeof a==='number'?num(a):a,f:f||'',fa:fa||'',tip:T?PK(T):''}}
const figW=s=>{const m=/width="(\d+(?:\.\d+)?)"/.exec(s||'');return m?+m[1]:0};
function build(){const out={},order=shufT(G.temas);['A','B'].forEach(s=>{if(s=='B'&&!G.b)return;const L=[];for(let i=0;i<G.n;i++){const k=order[i%order.length],d=G.dif==3?(i<G.n/3?0:i<2*G.n/3?1:2):G.dif;let e,t=0;do{e=one(k,d)}while(t++<10&&L.some(x=>x.q===e.q));L.push(e)}out[s]=L});G.sets=out;G.cur='A'}
function pts(P,n){const u=Math.round(P*2),b=Math.floor(u/n),r=u-b*n;return Array.from({length:n},(_,i)=>(b+(i<r?1:0))/2)}
const tn=k=>TOPICS.find(t=>t.k===k).n;

function readCfg(){
  G.title=$('#g-title').value.trim();G.escuela=$('#g-esc').value.trim();G.curso=$('#g-cur').value.trim();G.fecha=$('#g-fec').value;
  G.anio=+$('#g-anio').value;G.dif=+$('#g-dif').value;G.n=Math.min(20,Math.max(1,+$('#g-n').value||6));
  G.puntos=Math.min(100,Math.max(1,+$('#g-pts').value||10));G.b=$('#g-b').checked;G.tips=$('#g-tips').checked;G.all=$('#g-all').checked;
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
  <label>Temas <span class="noprint"><button type="button" class="btn soft" id="g-on" style="padding:3px 12px;font-size:.8rem;margin-left:8px">Marcar todos</button> <button type="button" class="btn soft" id="g-off" style="padding:3px 12px;font-size:.8rem">Ninguno</button></span></label><div class="gtopics">${tp.map(t=>`<label class="chipsel"><input type="checkbox" class="gt" value="${t.k}" ${G.temas.includes(t.k)?'checked':''}><span>${t.n}</span></label>`).join('')}</div>
  <label class="chk"><input type="checkbox" id="g-all" ${G.all?'checked':''}> Mostrar temas de todos los años</label>
  <label class="chk"><input type="checkbox" id="g-b" ${G.b?'checked':''}> Generar también un Tema B (distintos números)</label>
  <label class="chk"><input type="checkbox" id="g-tips" ${G.tips!==false?'checked':''}> Incluir recordatorios en las consignas (fórmulas y definiciones útiles)</label>
  <div class="acts" style="margin-top:18px"><button class="btn" id="g-go">${G.sets?'Generar de nuevo':'Generar examen'}</button></div></div></div>`;
  if(G.sets){
    const ex=G.sets[G.cur]||G.sets.A,P=pts(G.puntos,ex.length),T=Object.keys(G.sets).length>1?` · Tema ${G.cur}`:'';
    h+=`<div class="gbar noprint">${Object.keys(G.sets).length>1?Object.keys(G.sets).map(s=>`<button class="btn ${s==G.cur?'':'soft'}" data-s="${s}">Tema ${s}</button>`).join(''):''}
    <button class="btn soft" id="g-pe">🖨️ Imprimir examen</button><button class="btn soft" id="g-pk">🖨️ Imprimir clave</button><button class="btn" id="g-sv">Guardar en Evaluaciones</button></div>
    <div class="sheet sheet-exam"><div class="sh-head"><div><b>${esc(G.escuela)}</b><div>Matemática${G.curso?' · '+esc(G.curso):''}</div></div><div>${G.fecha?'Fecha: '+fmt(G.fecha):'Fecha: ____ / ____ / ____'}</div></div>
    <h2>${esc(G.title||'Evaluación')}${T}</h2><div class="sh-line">Nombre y apellido: ______________________________ &nbsp; Nota: ______</div>
    <p class="sh-info">Puntaje total: <b>${num(G.puntos)} puntos</b>. Justificá todos los procedimientos. Se valora la prolijidad y el uso correcto del lenguaje matemático.</p>
    ${(()=>{const vistos={};return ex.map((e,i)=>`<div class="ex"><div class="ex-h"><b>${i+1})</b> <span class="pt">(${num(P[i])} ${P[i]==1?'punto':'puntos'})</span> <button class="rr noprint" data-r="${i}" title="Cambiar este ejercicio">🔄</button></div><div class="ex-body${figW(e.f)>=300?' wide':''}"><div class="ex-q">${e.q}${G.tips!==false&&e.tip&&!vistos[e.t]&&(vistos[e.t]=1)?`<div class="ex-tip">💡 ${e.tip}</div>`:''}</div>${e.f?`<div class="ex-fig">${e.f}</div>`:''}</div><div class="ex-sp" style="height:${60+e.d*30}px"></div></div>`).join('')})()}</div>
    <div class="sheet sheet-key"><h2>Clave de corrección${T}</h2>${ex.map((e,i)=>`<div class="kr"><b>${i+1})</b> <span class="kt">${tn(e.t)} · ${num(P[i])} pts</span><div>${e.a}</div>${e.fa?`<div class="kfig">${e.fa}</div>`:''}</div>`).join('')}</div>`;
  }
  $('#main').innerHTML=h;
  $('#g-anio').onchange=$('#g-all').onchange=()=>{readCfg();renderGen()};
  $('#g-on').onclick=()=>{document.querySelectorAll('.gt').forEach(x=>x.checked=true);readCfg();renderGen()};
  $('#g-off').onclick=()=>{document.querySelectorAll('.gt').forEach(x=>x.checked=false);readCfg();renderGen()};
  $('#g-go').onclick=()=>{readCfg();if(!G.temas.length){alert('Elegí al menos un tema.');return}build();renderGen()};
  if(!G.sets)return;
  document.querySelectorAll('[data-s]').forEach(b=>b.onclick=()=>{G.cur=b.dataset.s;renderGen()});
  document.querySelectorAll('[data-r]').forEach(b=>b.onclick=()=>{const l=G.sets[G.cur],i=+b.dataset.r;l[i]=one(l[i].t,l[i].d);renderGen()});
  $('#g-pe').onclick=()=>{document.body.classList.remove('pk');window.print()};
  $('#g-pk').onclick=()=>{document.body.classList.add('pk');window.print();setTimeout(()=>document.body.classList.remove('pk'),500)};
  $('#g-sv').onclick=async()=>{readCfgSafe();
    if(!courseId){alert('Primero elegí o creá un curso para guardar el examen.');return}
    try{const{sets,cur,...cfgG}=G;
      await col('exams').add({title:G.title||'Examen',fecha:G.fecha,tipo:'Escrita',contenidos:G.temas.map(tn).join(', '),criterios:`${G.n} ejercicios, ${num(G.puntos)} puntos en total. Dificultad: ${DIF[G.dif]}.`,notas:'',files:[],created:Date.now(),updated:Date.now(),ejercicios:JSON.stringify({sets,G:cfgG})});
      alert('Guardado en Evaluaciones de este curso. Ahí vas a poder reabrirlo con “Abrir examen”.')}
    catch(e){alert('No se pudo guardar. Revisá tu conexión.')}};
}
function readCfgSafe(){try{const s=G.sets,c=G.cur;readCfg();G.sets=s;G.cur=c}catch(e){}}
function openSavedExam(d){try{const o=JSON.parse(d.ejercicios);Object.assign(G,o.G,{sets:o.sets,cur:'A'});tab='gen';render()}catch(e){alert('No se pudo abrir este examen.')}}
