# 📐 Aula de Matemática

Plataforma para una profesora de matemática de secundaria: planificaciones de clases, planificación de evaluaciones, y material y tareas para los alumnos.

- **Profesora** (con usuario y contraseña): organiza su trabajo en **escuelas** y **cursos**, y en cada curso ve y edita planificaciones, evaluaciones, material y tareas.
- **Alumnos** (sin cuenta, con el **link de su curso**): ven únicamente el *Material* y las *Tareas* de ese curso. No pueden ver otros cursos.
- Los archivos se comparten con **enlaces** (Google Drive, por ejemplo).

Todo es gratis: GitHub Pages aloja la página y Firebase guarda los datos.

---

## Paso 1 · Subir los archivos a GitHub

1. Entrá a [github.com](https://github.com) y creá una cuenta si no tenés.
2. Tocá **New repository** (el botón verde). Nombre sugerido: `aula-matematica`. Dejalo **Public**.
3. En el repositorio nuevo, elegí **uploading an existing file** y arrastrá todos los archivos de esta carpeta (`index.html`, `app.js`, `gen.js`, `config.js`, `firestore.rules`, `.nojekyll` y este README). Tocá **Commit changes**.
4. Andá a **Settings → Pages**. En *Branch* elegí `main` y la carpeta `/ (root)`. Guardá.
5. En un minuto tu página va a estar en: `https://TU-USUARIO.github.io/aula-matematica/`

> Si no ves el archivo `.nojekyll` (algunos sistemas lo ocultan), no pasa nada: la página funciona igual.

## Paso 2 · Crear la base de datos (Firebase)

1. Entrá a [console.firebase.google.com](https://console.firebase.google.com) con tu cuenta de Google y tocá **Agregar proyecto**. Ponele un nombre (por ejemplo, `aula-matematica`). Podés desactivar Google Analytics.
2. En el menú izquierdo: **Compilación → Authentication → Comenzar**. En *Método de acceso* activá **Correo electrónico/contraseña**.
3. En la pestaña **Users** tocá **Agregar usuario** y cargá tu correo y una contraseña. Con ese usuario vas a ingresar como profesora.
4. En **Compilación → Firestore Database → Crear base de datos**. Elegí modo **producción** y una región cercana (por ejemplo, `southamerica-east1`).
5. En Firestore, pestaña **Reglas**: borrá lo que hay, pegá el contenido de `firestore.rules`, **cambiá `TU_CORREO@gmail.com` por tu correo** (el mismo del paso 3) y tocá **Publicar**.
6. Volvé a la pantalla principal del proyecto (⚙️ **Configuración del proyecto**). Abajo, en *Tus apps*, tocá el ícono **`</>`** (Web), ponele un nombre y registrala. Te va a mostrar un bloque `firebaseConfig` con `apiKey`, `authDomain`, `projectId` y `appId`.
7. En GitHub, abrí `config.js`, tocá el lápiz ✏️ y pegá esos cuatro valores. Commit.

## Paso 3 · Usarla

1. Abrí tu página. Tocá **Ingreso docente** e ingresá con tu correo y contraseña.
2. Cargá planificaciones, evaluaciones, material y tareas.
3. Pasale el link de la página a tus alumnos. Ellos no necesitan cuenta.


## 🧮 Generador de exámenes

Al ingresar como docente aparece la pestaña **Generar examen**:

1. Elegí el **año** (1.º a 6.º), la **dificultad** (fácil, media, difícil o progresiva), la **cantidad de ejercicios** y el **puntaje total**.
2. Marcá los **temas**. Se muestran los que corresponden al año elegido; con “Mostrar temas de todos los años” ves todos.
3. Tocá **Generar examen**. Aparece la hoja del examen con los puntos repartidos entre los ejercicios, y debajo la **clave de corrección** con las respuestas.
4. Si un ejercicio no te gusta, tocá 🔄 para cambiarlo por otro del mismo tema.
5. Tildá “Generar también un Tema B” para tener una segunda versión con otros números (útil para evitar copias).
6. **Imprimir examen** o **Imprimir clave** abre la impresión del navegador; ahí podés elegir “Guardar como PDF”.
7. **Guardar en Evaluaciones** lo archiva. Después lo reabrís con el botón “Abrir examen”.

**Temas incluidos:** números enteros, fracciones, ecuaciones de primer grado, proporcionalidad, porcentaje, perímetro y área, potencias, Pitágoras, función lineal, sistemas 2×2, factoreo, estadística, probabilidad, ecuación cuadrática, trigonometría, exponenciales y logaritmos, y derivadas.

> Los ejercicios se arman con plantillas y números al azar, y las respuestas se calculan automáticamente. Conviene siempre darles una mirada antes de imprimir, y ajustar el año o los temas según lo que dieron en clase.

**Si ya habías subido la versión anterior:** reemplazá `index.html` y `app.js`, y agregá el archivo nuevo `gen.js`. `config.js` y las reglas de Firebase no cambian.

## 🧮 Generador de exámenes: temas por año

El generador cubre **35 temas** de 1.º a 6.º año (borrador basado en los NAP de Matemática; ajustalo según tu diseño curricular). Cada tema tiene varios tipos de ejercicio por nivel de dificultad, incluyendo problemas con enunciado y ejercicios de justificar. Las respuestas se calculan por código.

- **Marcar todos / Ninguno** selecciona los temas de un año de una vez.
- Si marcás más temas que ejercicios, el generador **sorteá qué temas entran**, y evita repetir enunciados dentro de un mismo examen.
- Si querés ver los temas de otros años, tildá “Mostrar temas de todos los años”.

## 📖 Biblioteca de PDF y libros

En el menú de la izquierda, **Biblioteca** guarda tus PDF y libros y busca por tema en todos a la vez. **Es solo para vos**: los alumnos no la ven.

1. **Agregar PDF:** elegí uno o varios archivos. La página lee el texto de cada página. Si el PDF es una imagen (escaneado o con letras dibujadas), te ofrece leerlo con **OCR**, que tarda varios minutos y necesita internet.
2. **Buscar:** elegí un tema de la lista (con sus sinónimos) o escribí lo que buscás. Se puede usar “comillas” para una frase exacta y elegir si deben aparecer todas las palabras o alguna. También podés elegir en qué documentos buscar.
3. **Resultados:** aparecen agrupados por libro y por página, con las palabras encontradas resaltadas. Cada resultado tiene **Ver la página** (muestra el PDF original) y **Ver texto completo**.
4. **Imprimir:** marcá las páginas que te sirven y tocá “Imprimir la selección” para armar un apunte.

Cómo se guarda: el **texto** queda en tu base de datos (Firestore) y se puede consultar desde cualquier dispositivo; el **PDF original** queda solo en el navegador donde lo cargaste (el plan gratis de Firebase no permite guardar archivos). Desde otro dispositivo vas a ver el texto, pero no la página dibujada.

**Reglas de Firebase:** esta versión agrega permisos para la biblioteca. Pegá de nuevo el contenido de `firestore.rules` en Firestore → **Reglas** → **Publicar**.

## 🖼️ Figuras, recordatorios y consignas

- **Figuras:** los ejercicios de geometría, Pitágoras, ángulos, semejanza, cuerpos, trigonometría, plano cartesiano, funciones, estadística, fracciones, porcentajes, enteros y probabilidad traen su dibujo (se imprimen en blanco y negro). La clave de corrección muestra la figura resuelta cuando corresponde (por ejemplo, el gráfico de una función o los intervalos marcados en la recta).
- **Recordatorios:** debajo de la consigna aparece una fórmula o definición útil (“Recordá: …”), una vez por tema en cada examen. Se pueden apagar con la casilla “Incluir recordatorios en las consignas”.
- **Intervalos y desigualdades:** tema nuevo con apartados a), b), c), líneas punteadas, rectas numéricas para marcar y casilleros con ∈, ∉, ⊂ y ⊄.
- **Problemas contextualizados de porcentaje:** descuentos, recargos en cuotas, entradas de cine, torneos y precio original.

## 🏫 Escuelas, cursos y link para alumnos

En el panel de la izquierda (al ingresar como docente) están los selectores **Escuela** y **Curso**:

1. **＋** crea una escuela (puede ser “Clases particulares”) o un curso dentro de la escuela elegida. **✏️** renombra y **🗑** borra.
2. Todo lo que cargues (planificaciones, evaluaciones, material, tareas) queda guardado **en el curso elegido**.
3. Tocá **🔗 Link para alumnos** para copiar el link de ese curso y pasárselo a los chicos (por WhatsApp, Classroom, etc.). Cada curso tiene su propio link.
4. El generador de exámenes completa solo la escuela y el curso; “Guardar en Evaluaciones” lo guarda en el curso elegido.

> Los links no se pueden adivinar, pero **cualquiera que tenga el link de un curso puede ver su material y tareas**. No pongas ahí datos privados de los alumnos. Si un link se difunde de más, creá un curso nuevo y borrá el anterior.

**Reglas de Firebase:** esta versión usa reglas nuevas (`firestore.rules`). Hay que pegarlas de nuevo en Firestore → pestaña **Reglas** → **Publicar**.

## Cómo compartir archivos (PDF, libros, guías)

1. Subí el archivo a **Google Drive**.
2. Clic derecho → **Compartir** → en *Acceso general* elegí **Cualquier persona con el enlace**.
3. Copiá el enlace y pegalo en el campo *Archivos y enlaces* al crear o editar un elemento. Uno por línea. Podés ponerle nombre así:

   `Guía de ejercicios | https://drive.google.com/...`

## Preguntas frecuentes

**¿Los alumnos pueden ver mis planificaciones?** No. Las reglas de Firestore solo permiten leerlas a tu correo.

**¿Alguien puede modificar el material?** No. Solo tu correo puede escribir.

**¿Cuánto cuesta?** El plan gratuito de Firebase (Spark) alcanza de sobra para una escuela.

**Me aparece “Falta conectar la base de datos”.** Revisá que pegaste bien los valores en `config.js`.

**Me aparece “No se pudo guardar”.** Revisá que en `firestore.rules` pusiste exactamente el mismo correo con el que ingresás.
