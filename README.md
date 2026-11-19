# 📐 Aula de Matemática

Plataforma para una profesora de matemática de secundaria: planificaciones de clases, planificación de evaluaciones, y material y tareas para los alumnos.

- **Profesora** (con usuario y contraseña): ve y edita todo: planificaciones, evaluaciones, material y tareas.
- **Alumnos** (sin cuenta, solo con el link): ven únicamente *Material* y *Tareas*.
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
