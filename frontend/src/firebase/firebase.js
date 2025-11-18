// Verificación de correo vía REST (sin SDK). Limpio y sin duplicados.

const API_KEY = process.env.REACT_APP_FB_API_KEY || '';
const DEBUG = process.env.REACT_APP_FB_DEBUG === '1';
const ALLOW_INSTITUTIONAL_FALLBACK = process.env.REACT_APP_FB_ALLOW_INSTIT_FALLBACK === '1';
const INSTITUTIONAL_DOMAINS = ['unah.edu.hn','unah.hn'];

export let lastFirebaseDiag = null;
export let firebaseConfigError = false;

const BASE = 'https://identitytoolkit.googleapis.com/v1';
const endpoints = {
  signIn:  `${BASE}/accounts:signInWithPassword?key=${API_KEY}`,
  signUp:  `${BASE}/accounts:signUp?key=${API_KEY}`,
  lookup:  `${BASE}/accounts:lookup?key=${API_KEY}`,
  sendOob: `${BASE}/accounts:sendOobCode?key=${API_KEY}`,
  applyOob: `${BASE}/accounts:update?key=${API_KEY}`,
  createAuthUri: `${BASE}/accounts:createAuthUri?key=${API_KEY}`, // NUEVO: para obtener signInMethods
  update: `${BASE}/accounts:update?key=${API_KEY}`,           // NUEVO para cambiar password
};

// (REINTRODUCIDO) Diagnóstico ligero de API Key para evitar ReferenceError
function quickApiKeyCheck() {
  try {
    if (!DEBUG || !API_KEY) return;
    // Petición mínima con credenciales falsas para validar estado de la API Key
    fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({
        email: '__probe__@fake.zz',
        password: '123456',
        returnSecureToken: true
      })
    }).then(r => {
      if (r.status === 400) return r.json().catch(()=> ({}));
    }).then(j => {
      const code = j?.error?.message || '';
      if (code.includes('API_KEY_NOT_VALID') || code.includes('KEY_INVALID')) {
        console.error('[Firebase][Diag] API Key inválida o restringida.');
      }
    }).catch(()=> {});
  } catch {}
}

// ---------- HTTP helper ----------
async function post(url, body) {
  try {
    const res = await fetch(url, {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json().catch(()=> ({}));
    if (DEBUG) {
      console.log('[FB][RAW]', { url, status: res.status, data });
      lastFirebaseDiag = { url, status: res.status, data };
    }
    return { ok: res.ok, status: res.status, data };
  } catch (e) {
    if (DEBUG) console.warn('[FB][NET]', e);
    return { ok:false, network:true, data:{ error:{ message:'NETWORK_ERROR' } } };
  }
}

// ---------- Errores ----------
function mapFbErr(code='') {
  if (!code) return 'Error con la verificación de correo.';
  if (code === 'NETWORK_ERROR') return 'No se pudo conectar a Firebase.';
  if (code.includes('INVALID_API_KEY')) return 'API Key inválida.';
  if (code.includes('API_KEY_NOT_VALID') || code.includes('KEY_INVALID')) return 'API Key inválida o restringida.';
  if (code.includes('PROJECT_NOT_FOUND')) return 'Proyecto Firebase no encontrado.';
  if (code.includes('OPERATION_NOT_ALLOWED')) return 'Email/Password deshabilitado.';
  if (code.includes('INVALID_EMAIL')) return 'Formato de correo inválido.';
  if (code.includes('EMAIL_NOT_FOUND')) return 'Correo nuevo: se envió verificación.';
  if (code.includes('EMAIL_EXISTS')) return 'Correo ya existente.';
  if (code.includes('INVALID_PASSWORD') || code.includes('INVALID_LOGIN_CREDENTIALS')) return 'Credenciales inválidas.';
  if (code.includes('TOO_MANY_ATTEMPTS')) return 'Demasiados intentos. Espera.';
  if (code.includes('USER_DISABLED')) return 'Cuenta deshabilitada.';
  if (code.includes('CONFIGURATION_NOT_FOUND')) return 'Authentication no configurado.';
  if (code.includes('EXPIRED_OOB_CODE')) return 'El enlace de verificación expiró.';
  if (code.includes('INVALID_OOB_CODE')) return 'Código de verificación inválido o usado.';
  return 'Error con la verificación de correo.';
}

export function explainFirebaseRemedy(code='') {
  const c = code.toUpperCase();
  if (c.includes('INVALID_API_KEY') || c.includes('API_KEY_NOT_VALID') || c.includes('KEY_INVALID'))
    return 'Revisa REACT_APP_FB_API_KEY y reinicia.';
  if (c.includes('PROJECT_NOT_FOUND'))
    return 'API Key no coincide con el proyecto.';
  if (c.includes('OPERATION_NOT_ALLOWED'))
    return 'Habilita Email/Password en Authentication.';
  if (c.includes('EMAIL_NOT_FOUND'))
    return 'Verifica el enlace enviado y repite el registro.';
  if (c.includes('EMAIL_EXISTS'))
    return 'Ya registrado. Verifica o usa la misma contraseña inicial.';
  if (c.includes('INVALID_PASSWORD') || c.includes('INVALID_LOGIN_CREDENTIALS'))
    return 'Contraseña distinta a la original. Restablece o elimina el usuario.';
  if (c.includes('TOO_MANY_ATTEMPTS'))
    return 'Espera algunos minutos y reintenta.';
  if (c.includes('NETWORK_ERROR'))
    return 'Revisa tu conexión / firewall.';
  if (c.includes('CONFIGURATION_NOT_FOUND'))
    return 'Habilita Identity Toolkit API y Email/Password.';
  if (c.includes('EXPIRED_OOB_CODE'))
    return 'El enlace caducó. Genera uno nuevo.';
  if (c.includes('INVALID_OOB_CODE'))
    return 'El enlace es inválido o usado. Solicita uno nuevo.';
  if (c === 'RESET_SENT')
    return 'Revisa el correo de restablecimiento, define nueva contraseña y luego inicia sesión / reintenta.';
  if (c === 'EMAIL_EXISTS_MISMATCH')
    return 'El correo existe con otra contraseña. Introduce la contraseña original para reenviar verificación.';
  if (c === 'ORIG_PASSWORD_VERIFICATION_SENT')
    return 'Revisa tu bandeja y carpeta de spam; se reenvió el enlace de verificación.';
  if (c === 'ORIG_PASSWORD_OK_VERIFIED')
    return 'El correo ya estaba verificado. Continúa con el registro / inicio de sesión.';
  if (c === 'ORIG_PASSWORD_INVALID')
    return 'La contraseña ingresada no coincide con la original. Intenta de nuevo.';
  if (c === 'ACCOUNT_EXISTS_WITH_DIFFERENT_CREDENTIAL')
    return 'El correo ya está asociado a otro método. Inicia sesión con un método listado y luego enlaza credenciales.';
  if (c === 'COOLDOWN')
    return 'Espera unos segundos antes de solicitar otro correo de verificación.';
  if (c === 'ALREADY_VERIFIED')
    return 'El correo ya está verificado. Procede a iniciar sesión.';
  return 'Revisa configuración de Authentication y dominios.';
}

// NUEVO: obtener métodos de inicio de sesión (REST)
export async function fetchSignInMethods(email) {
  if (!API_KEY || !email) return [];
  const r = await post(endpoints.createAuthUri, {
    identifier: email,
    continueUri: (typeof window !== 'undefined' ? window.location.origin : 'http://localhost')
  });
  if (r.ok && r.data?.allProviders) return r.data.allProviders;
  if (r.ok && r.data?.signInMethods) return r.data.signInMethods;
  return [];
}

// ---------- Contraseña derivada (no depende de la que escribe el usuario) ----------
function deriveFbPassword(emailRaw='') {
  const salt = (process.env.REACT_APP_FB_DERIVE_SALT || 'SGTG_FCEAC_SALT') + '|v1';
  const email = emailRaw.trim().toLowerCase();
  let base = btoa(unescape(encodeURIComponent(email + '|' + salt))).replace(/[^A-Za-z0-9]/g,'');
  if (base.length < 18) base = (base + 'Ab9XyZ').repeat(3);
  return base.slice(0,12) + 'Aa1!';
}

// ---------- Verificación principal ----------
export async function ensureFirebaseEmailVerified(email, userPassword) {
  if (!API_KEY) return { ok:false, message:'Falta REACT_APP_FB_API_KEY.', errorCode:'NO_API_KEY' };
  if (DEBUG) quickApiKeyCheck();

  const passwordUser = userPassword || '12345678a!'; // seguridad mínima
  // 1) Intentar login directo con la contraseña que el usuario ingresó
  let signIn = await post(endpoints.signIn, { email, password: passwordUser, returnSecureToken:true });
  let err = signIn.data?.error?.message || '';
  const domain = (email.split('@')[1] || '').toLowerCase();

  // Fallback institucional (igual que antes)
  if (
    !signIn.ok &&
    (err.includes('INVALID_API_KEY') || err.includes('API_KEY_NOT_VALID') ||
     err.includes('PROJECT_NOT_FOUND') || signIn.network) &&
    ALLOW_INSTITUTIONAL_FALLBACK &&
    INSTITUTIONAL_DOMAINS.some(d=>domain.endsWith(d))
  ) {
    return { ok:true, bypass:true, message:'Registro institucional permitido (fallback).' };
  }

  // 2) Si login con contraseña usuario funciona
  if (signIn.ok && signIn.data?.idToken) {
    const lookup = await post(endpoints.lookup, { idToken: signIn.data.idToken });
    const user = lookup.data?.users?.[0];
    if (user?.emailVerified) return { ok:true, idToken: signIn.data.idToken };
    await post(endpoints.sendOob, { requestType:'VERIFY_EMAIL', idToken: signIn.data.idToken });
    return { ok:false, message:'Correo no verificado. Se reenvió el enlace.', errorCode:'UNVERIFIED' };
  }

  // 3) Si devuelve EMAIL_NOT_FOUND → crear y enviar verificación
  if (err.includes('EMAIL_NOT_FOUND')) {
    const signUp = await post(endpoints.signUp, { email, password: passwordUser, returnSecureToken:true });
    if (signUp.ok && signUp.data?.idToken) {
      await post(endpoints.sendOob, { requestType:'VERIFY_EMAIL', idToken: signUp.data.idToken });
      return {
        ok:false,
        message:'Se envió un enlace de verificación. Revisa tu correo (y spam).',
        errorCode:'EMAIL_NOT_FOUND'
      };
    }
    const raw = signUp.data?.error?.message || '';
    if (raw === 'CONFIGURATION_NOT_FOUND') firebaseConfigError = true;
    return { ok:false, message: mapFbErr(raw)+(DEBUG&&raw?` [${raw}]`:''), errorCode: raw };
  }

  // 4) Si la contraseña no coincide, intentar flujo LEGADO con contraseña derivada y luego actualizar password
  if (err.includes('INVALID_LOGIN_CREDENTIALS') || err.includes('INVALID_PASSWORD')) {
    const legacyPass = deriveFbPassword(email);
    const legacySign = await post(endpoints.signIn, { email, password: legacyPass, returnSecureToken:true });
    const legacyErr = legacySign.data?.error?.message || '';
    if (legacySign.ok && legacySign.data?.idToken) {
      // Actualizar password a la que el usuario quiso usar ahora
      await post(endpoints.update, { idToken: legacySign.data.idToken, password: passwordUser, returnSecureToken:true })
        .catch(()=>{});
      // Lookup y verificación
      const lookup2 = await post(endpoints.lookup, { idToken: legacySign.data.idToken });
      const user2 = lookup2.data?.users?.[0];
      if (user2?.emailVerified) return { ok:true, idToken: legacySign.data.idToken };
      await post(endpoints.sendOob, { requestType:'VERIFY_EMAIL', idToken: legacySign.data.idToken });
      return { ok:false, message:'Se envió un enlace de verificación. Revisa tu correo.', errorCode:'UNVERIFIED' };
    }
    // No se pudo rescatar con la derivada → mensaje simple
    return {
      ok:false,
      message:'No se pudo verificar. Intenta “Reintentar verificación” o solicita eliminar el correo en Firebase para recrearlo.',
      errorCode: legacyErr || err
    };
  }

  if (err.includes('CONFIGURATION_NOT_FOUND')) firebaseConfigError = true;

  return {
    ok:false,
    message: mapFbErr(err)+(DEBUG&&err?` [${err}]`:''), 
    errorCode: err
  };
}

// ---------- Aplicar código de verificación (oobCode) ----------
export async function applyVerificationCode(oobCode) {
  if (!API_KEY) return { ok:false, errorCode:'NO_API_KEY', message:'Falta API Key' };
  if (!oobCode) return { ok:false, errorCode:'NO_OOB_CODE', message:'Código ausente' };
  const r = await post(endpoints.applyOob, { oobCode });
  if (r.ok && !r.data?.error) {
    return { ok:true, email:r.data?.email || null, message:'Correo verificado correctamente.' };
  }
  const code = r.data?.error?.message || '';
  if (code === 'CONFIGURATION_NOT_FOUND') firebaseConfigError = true;
  return { ok:false, errorCode:code, message: mapFbErr(code)+(DEBUG&&code?` [${code}]`:'' ) };
}

// ---------- Heurística email ----------
const COMMON_DOMAINS = [
  'gmail.com','hotmail.com','hotmail.es','outlook.com','outlook.es',
  'yahoo.com','yahoo.es','live.com','live.com.mx','unah.edu.hn','unah.hn'
];

export function quickEmailHeuristic(email='') {
  const out = { ok:false, error:'' };
  const e = email.trim().toLowerCase();
  if(!e){ out.error='Correo requerido'; return out; }
  const m = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.exec(e);
  if(!m){ out.error='Formato de correo inválido'; return out; }
  const [local, domain] = e.split('@');
  if(local.length < 3){ out.error='La parte antes de @ es demasiado corta'; return out; }
  if(!domain.includes('.')){ out.error='Dominio inválido'; return out; }
  if(domain.length > 60){ out.error='Dominio demasiado largo'; return out; }
  const known = COMMON_DOMAINS.includes(domain);
  const onlyLetters = /^[a-z]+$/i.test(local);
  const vowels = local.match(/[aeiouáéíóú]/gi) || [];
  if (onlyLetters && vowels.length === 0) { out.error='El nombre antes de @ parece inválido'; return out; }
  if(!known){
    out.ok = true;
    out.warning = 'Dominio poco común; revisa la escritura.';
    return out;
  }
  out.ok = true;
  return out;
}
// FIN

/**
 * Intenta autenticarse con la contraseña "original" provista por el usuario
 * para forzar reenvío de verificación sin restablecer.
 * Retorna:
 *  - { ok:true, code:'ORIG_PASSWORD_OK_VERIFIED', message }
 *  - { ok:false, errorCode:'ORIG_PASSWORD_VERIFICATION_SENT', message }
 *  - { ok:false, errorCode:'ORIG_PASSWORD_INVALID', message }
 */
export async function forceSendVerificationWithPassword(email, originalPassword) {
  if (!API_KEY) return { ok:false, errorCode:'NO_API_KEY', message:'Falta API Key.' };
  if (!email || !originalPassword) return { ok:false, errorCode:'MISSING_PARAMS', message:'Faltan datos.' };

  const signIn = await post(endpoints.signIn, {
    email,
    password: originalPassword,
    returnSecureToken: true
  });
  if (signIn.ok && signIn.data?.idToken) {
    // lookup
    const lookup = await post(endpoints.lookup, { idToken: signIn.data.idToken });
    const user = lookup.data?.users?.[0];
    if (user?.emailVerified) {
      return { ok:true, code:'ORIG_PASSWORD_OK_VERIFIED', message:'El correo ya está verificado.' };
    }
    await post(endpoints.sendOob, { requestType:'VERIFY_EMAIL', idToken: signIn.data.idToken });
    return {
      ok:false,
      errorCode:'ORIG_PASSWORD_VERIFICATION_SENT',
      message:'Se envió un enlace de verificación. Revisa tu bandeja.'
    };
  }
  const err = signIn.data?.error?.message || '';
  if (err.includes('INVALID_PASSWORD') || err.includes('INVALID_LOGIN_CREDENTIALS')) {
    return {
      ok:false,
      errorCode:'ORIG_PASSWORD_INVALID',
      message:'Contraseña original incorrecta.'
    };
  }
  return {
    ok:false,
    errorCode: err || 'UNKNOWN',
    message: mapFbErr(err || '') + (DEBUG && err ? ` [${err}]` : '')
  };
}

/**
 * Reenvía correo de verificación con control de cooldown (default 60s).
 * Retorna:
 *  - { ok:true, sent:true } (enviado)
 *  - { ok:true, alreadyVerified:true, errorCode:'ALREADY_VERIFIED' }
 *  - { ok:false, errorCode:'COOLDOWN', waitSeconds }
 *  - { ok:false, errorCode:'NO_API_KEY' | 'LOGIN_FAILED' | firebaseRaw }
 */
export async function resendVerificationWithCooldown(email, userPassword, minIntervalMs = 60000) {
  if (!API_KEY) return { ok:false, errorCode:'NO_API_KEY', message:'Falta API Key' };
  const key = `fb_verif_last:${email.toLowerCase()}`;
  const last = Number(localStorage.getItem(key) || 0);
  const now = Date.now();
  const diff = now - last;
  if (diff < minIntervalMs) {
    const waitSeconds = Math.ceil((minIntervalMs - diff)/1000);
    return {
      ok:false,
      errorCode:'COOLDOWN',
      waitSeconds,
      message:`Debes esperar ${waitSeconds}s para volver a solicitar el correo.`
    };
  }

  // Intentar login con contraseña del usuario primero
  let signIn = await post(endpoints.signIn, {
    email,
    password: userPassword || '---',
    returnSecureToken:true
  });

  // Si falla por credenciales, intentar con derivada (modo legado)
  if (!signIn.ok) {
    const code = signIn.data?.error?.message || '';
    if (code.includes('INVALID_LOGIN_CREDENTIALS') || code.includes('INVALID_PASSWORD')) {
      const legacy = deriveFbPassword(email);
      signIn = await post(endpoints.signIn, {
        email,
        password: legacy,
        returnSecureToken:true
      });
    }
  }

  if (!signIn.ok || !signIn.data?.idToken) {
    const raw = signIn.data?.error?.message || 'LOGIN_FAILED';
    return {
      ok:false,
      errorCode:raw,
      message: mapFbErr(raw) + (DEBUG && raw ? ` [${raw}]` : '')
    };
  }

  // Lookup
  const lookup = await post(endpoints.lookup, { idToken: signIn.data.idToken });
  const user = lookup.data?.users?.[0];
  if (user?.emailVerified) {
    return {
      ok:true,
      alreadyVerified:true,
      errorCode:'ALREADY_VERIFIED',
      message:'El correo ya está verificado.'
    };
  }

  // Reenviar
  const send = await post(endpoints.sendOob, { requestType:'VERIFY_EMAIL', idToken: signIn.data.idToken });
  if (!send.ok) {
    const raw = send.data?.error?.message || 'OOB_ERROR';
    return {
      ok:false,
      errorCode:raw,
      message: mapFbErr(raw) + (DEBUG && raw ? ` [${raw}]` : '')
    };
  }

  localStorage.setItem(key, String(now));
  return {
    ok:true,
    sent:true,
    message:'Se envió un enlace de verificación. Revisa tu bandeja y carpeta de spam.'
  };
}


