// Datos de conexión del proyecto de Firebase (portalmatematico).
window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyAQ4jjVW6BJEbb5C8UlT377X0oeJbFgevM",
  authDomain: "portalmatematico-b7b51.firebaseapp.com",
  projectId: "portalmatematico-b7b51",
  appId: "1:516023568213:web:5a9f2d07d6ebc84f0ed1dc"
};

// Correo de la profesora (el mismo que figura en firestore.rules).
window.TEACHER_EMAIL = "sotelo.m.d.lujan@gmail.com";

// Dirección del Worker de Cloudflare que guarda los PDF de la biblioteca en un repositorio PRIVADO de GitHub
// (ver GUIA-BIBLIOTECA-PRIVADA.md). Si queda vacío ("") los PDF se guardan en Firebase como hasta ahora.
window.PDF_PROXY = "https://biblioteca.huskystree.workers.dev";