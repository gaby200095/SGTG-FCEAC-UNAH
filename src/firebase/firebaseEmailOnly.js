/* CARGA COMPAT DESDE CDN PARA EVITAR ERROR DE OPTIONAL CHAINING EN BUILD ANTIGUO
   Requiere en .env (opcional, ya que dejamos defaults):
     REACT_APP_FB_API_KEY=...
     REACT_APP_FB_AUTH_DOMAIN=midominio.firebaseapp.com
     REACT_APP_FB_PROJECT_ID=...
     REACT_APP_FB_STORAGE_BUCKET=...
     REACT_APP_FB_MSG_SENDER_ID=...
     REACT_APP_FB_APP_ID=...
     (Opcional) REACT_APP_FB_DEBUG=1
*/
const API_KEY = process.env.REACT_APP_FB_API_KEY || 'AIzaSyBvW42pEqo8ku1VAv_kVsne8LjZ8NbH2D8';
const AUTH_DOMAIN = process.env.REACT_APP_FB_AUTH_DOMAIN || 'sgtg-fceac-unah.firebaseapp.com';
const PROJECT_ID = process.env.REACT_APP_FB_PROJECT_ID || 'sgtg-fceac-unah';
const STORAGE_BUCKET = process.env.REACT_APP_FB_STORAGE_BUCKET || 'sgtg-fceac-unah.firebasestorage.app';
const MSG_SENDER_ID = process.env.REACT_APP_FB_MSG_SENDER_ID || '62811680153';
const APP_ID = process.env.REACT_APP_FB_APP_ID || '1:62811680153:web:65cda7706b1d36ad4cf708';
const DEBUG = process.env.REACT_APP_FB_DEBUG === '1';

const firebaseConfig = {
  apiKey: API_KEY,
  authDomain: AUTH_DOMAIN,
  projectId: PROJECT_ID,
  storageBucket: STORAGE_BUCKET,
  messagingSenderId: MSG_SENDER_ID,
  appId: APP_ID
};

let loadingPromise = null;
let initialized = false;

/**
 * Inserta scripts compat (app + auth) si todavía no están cargados.
 * Devuelve window.firebase cuando listo.
 */
function loadFirebaseCompat() {
  if (window.firebase?.apps) return Promise.resolve(window.firebase);
  if (loadingPromise) return loadingPromise;

  loadingPromise = new Promise((resolve, reject) => {
    const add = (src) =>
      new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = src;
        s.async = true;
        s.onload = () => res();
        s.onerror = () => rej(new Error('No se pudo cargar: ' + src));
        document.head.appendChild(s);
      });

    (async () => {
      try {
        // Versión compat recomendada (puedes fijar una versión concreta si prefieres)
        await add('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
        await add('https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js');
        if (!window.firebase) throw new Error('Firebase no quedó disponible');
        resolve(window.firebase);
      } catch (e) {
        reject(e);
      }
    })();
  });

  return loadingPromise;
}

/**
 * Inicializa la app (solo una vez) usando compat.
 */
async function ensureSDK() {
  const fb = await loadFirebaseCompat();
  if (!initialized) {
    if (DEBUG) console.log('[FB][compat] init with', firebaseConfig);
    fb.initializeApp(firebaseConfig);
    // Opcional: idioma de correos (español)
    try { fb.auth().useDeviceLanguage(); } catch {}
    initialized = true;
  }
  return fb.auth();
}

/**
 * Crea o reutiliza usuario y envía (o reenvía) correo de verificación.
 * Retorna:
 *  - { status:'sent' }
 *  - { status:'resent' }
 *  - { status:'verified', idToken }
 *  - { status:'error', errorCode, message }
 */
export async function ensureEmailVerificationSimple(email, password) {
  try {
    if (!API_KEY || !AUTH_DOMAIN) {
      return { status:'error', errorCode:'NO_CONFIG', message:'Falta API Key o Auth Domain' };
    }

    const auth = await ensureSDK();
    const fb = window.firebase;

    // Métodos existentes
    let methods = [];
    try {
      methods = await auth.fetchSignInMethodsForEmail(email);
    } catch {
      methods = [];
    }

    // Usuario nuevo
    if (!methods.length) {
      const cred = await auth.createUserWithEmailAndPassword(email, password);
      if (cred.user.emailVerified) {
        const idToken = await cred.user.getIdToken();
        return { status:'verified', idToken };
      }
      await cred.user.sendEmailVerification();
      return { status:'sent' };
    }

    // Ya existe → intentar login con la contraseña ingresada
    let cred = null;
    try {
      cred = await auth.signInWithEmailAndPassword(email, password);
    } catch (e) {
      if (DEBUG) console.warn('[FB][compat] login mismatch', e.code);
    }

    if (cred && cred.user) {
      if (cred.user.emailVerified) {
        return { status:'verified', idToken: await cred.user.getIdToken() };
      }
      await cred.user.sendEmailVerification();
      return { status:'resent' };
    }

    return {
      status:'error',
      errorCode:'PASSWORD_MISMATCH',
      message:'Correo ya registrado con otra contraseña. Usa la original o restablécela.'
    };
  } catch (e) {
    if (DEBUG) console.error('[FB][compat][ensureError]', e);
    return {
      status:'error',
      errorCode: e?.code || 'GENERIC',
      message: e?.message || 'Error general'
    };
  }
}

/**
 * Revisa si el usuario actual ya verificó su correo (tras hacer clic en el enlace).
 * Retorna:
 *  - { ok:true, verified:false }
 *  - { ok:true, verified:true, idToken }
 *  - { ok:false, verified:false, reason }
 */
export async function pollEmailVerifiedSimple() {
  try {
    const auth = await ensureSDK();
    const user = auth.currentUser;
    if (!user) return { ok:false, verified:false, reason:'NO_USER' };
    await user.reload();
    if (user.emailVerified) {
      return { ok:true, verified:true, idToken: await user.getIdToken() };
    }
    return { ok:true, verified:false };
  } catch (e) {
    return { ok:false, verified:false, reason: e?.code || 'ERR' };
  }
}

/* (Opcional) helper para cerrar sesión en compat, si lo necesitas en algún flujo */
export async function signOutFirebaseSimple() {
  try {
    const auth = await ensureSDK();
    await auth.signOut();
  } catch {}
}
