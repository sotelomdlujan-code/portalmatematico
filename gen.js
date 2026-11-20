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

const G={title:'Evaluación de Matemática',escuela:'',curso:'',fecha:'',anio:3,dif:1,n:6,puntos:10,temas:[],b:false,all:false,sets:null,cur:'A'};

function one(k,d){const[q,a]=GEN[k](d);return{t:k,d,q,a:typeof a==='number'?num(a):a}}
function build(){const out={},order=shufT(G.temas);['A','B'].forEach(s=>{if(s=='B'&&!G.b)return;const L=[];for(let i=0;i<G.n;i++){const k=order[i%order.length],d=G.dif==3?(i<G.n/3?0:i<2*G.n/3?1:2):G.dif;let e,t=0;do{e=one(k,d)}while(t++<10&&L.some(x=>x.q===e.q));L.push(e)}out[s]=L});G.sets=out;G.cur='A'}
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
  <label>Temas <span class="noprint"><button type="button" class="btn soft" id="g-on" style="padding:3px 12px;font-size:.8rem;margin-left:8px">Marcar todos</button> <button type="button" class="btn soft" id="g-off" style="padding:3px 12px;font-size:.8rem">Ninguno</button></span></label><div class="gtopics">${tp.map(t=>`<label class="chipsel"><input type="checkbox" class="gt" value="${t.k}" ${G.temas.includes(t.k)?'checked':''}><span>${t.n}</span></label>`).join('')}</div>
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
