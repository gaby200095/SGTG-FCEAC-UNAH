import { ensureCompatAuth } from './firebaseConfig';

/**
 * Registra y envía correo de verificación.
 * Retorna: {status:'sent' | 'resent' | 'verified' | 'error', message?, errorCode?, idToken?}
 */
export async function registerAndSendVerification(email, password) {
  try {
    const auth = await ensureCompatAuth();

    // Ver si ya tiene métodos
    let methods = [];
    try {
      methods = await auth.fetchSignInMethodsForEmail(email);
    } catch {
      methods = [];
    }

    // Nuevo usuario
    if (!methods.length) {
      const cred = await auth.createUserWithEmailAndPassword(email, password);
      if (cred.user.emailVerified) {
        return { status: 'verified', idToken: await cred.user.getIdToken() };
      }
      await cred.user.sendEmailVerification();
      await auth.signOut();
      return { status: 'sent' };
    }

    // Ya existe → login para re‑enviar
    let cred = null;
    try {
      cred = await auth.signInWithEmailAndPassword(email, password);
    } catch (e) {
      if (e?.code === 'auth/invalid-credential' || e?.code === 'auth/wrong-password') {
        return {
          status: 'error',
          errorCode: 'PASSWORD_MISMATCH',
          message: 'El correo ya existe con otra contraseña. Usa la original o restablécela.'
        };
      }
      return {
        status: 'error',
        errorCode: e?.code || 'LOGIN_ERROR',
        message: e?.message || 'No se pudo iniciar sesión.'
      };
    }

    if (cred.user.emailVerified) {
      return { status: 'verified', idToken: await cred.user.getIdToken() };
    }
    await cred.user.sendEmailVerification();
    await auth.signOut();
    return { status: 'resent' };
  } catch (e) {
    return {
      status: 'error',
      errorCode: e?.code || 'GENERIC',
      message: e?.message || 'Error general al registrar.'
    };
  }
}

/**
 * Reintenta comprobar verificación:
 * 1. Inicia sesión (email/password)
 * 2. Si verificado: entrega idToken
 * 3. Si no: cierra sesión y avisa
 */
export async function pollEmailVerified(email, password) {
  try {
    const auth = await ensureCompatAuth();
    const cred = await auth.signInWithEmailAndPassword(email, password);
    await cred.user.reload();
    if (cred.user.emailVerified) {
      return { ok: true, verified: true, idToken: await cred.user.getIdToken() };
    }
    await auth.signOut();
    return { ok: true, verified: false };
  } catch (e) {
    return { ok: false, verified: false, error: e?.code || 'POLL_ERROR' };
  }
}
