// Cargador COMPAT de Firebase para evitar optional chaining en node_modules.
// Carga firebase-app-compat y firebase-auth-compat desde CDN solo una vez.

const API_KEY = process.env.REACT_APP_FB_API_KEY || 'AIzaSyBvW42pEqo8ku1VAv_kVsne8LjZ8NbH2D8';
const AUTH_DOMAIN = process.env.REACT_APP_FB_AUTH_DOMAIN || 'sgtg-fceac-unah.firebaseapp.com';
const DEBUG = process.env.REACT_APP_FB_DEBUG === '1';

let loadPromise = null;
let initialized = false;

/**
 * Carga scripts compat si aún no están presentes.
 * Retorna window.firebase ya listo.
 */
function loadCompat() {
  if (window.firebase?.apps) return Promise.resolve(window.firebase);
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const add = (src) =>
      new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = src;
        s.async = true;
        s.onload = res;
        s.onerror = () => rej(new Error('No se pudo cargar: ' + src));
        document.head.appendChild(s);
      });

    (async () => {
      try {
        // Versión fija para estabilidad
        await add('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
        await add('https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js');
        if (!window.firebase) throw new Error('Firebase no disponible tras carga compat');
        resolve(window.firebase);
      } catch (e) {
        reject(e);
      }
    })();
  });

  return loadPromise;
}

/**
 * Asegura auth compat inicializado y lo retorna.
 */
export async function ensureCompatAuth() {
  const fb = await loadCompat();
  if (!initialized) {
    fb.initializeApp({
      apiKey: API_KEY,
      authDomain: AUTH_DOMAIN
    });
    initialized = true;
    if (DEBUG) console.log('[Firebase][compat] inicializado');
  }
  return fb.auth();
}
