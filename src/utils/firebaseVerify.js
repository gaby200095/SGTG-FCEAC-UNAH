const jwt = require('jsonwebtoken');
const https = require('https');
// NUEVO: intentar usar firebase-admin si está instalado/inicializado
let admin = null;
try { admin = require('firebase-admin'); } catch { admin = null; }

let cachedKeys = null;
let lastFetch = 0;
const ONE_HOUR = 3600 * 1000;

/**
 * Descarga y cachea las claves públicas de Firebase/Google para validar ID Tokens.
 */
function fetchGoogleKeys() {
  return new Promise((resolve, reject) => {
    if (cachedKeys && (Date.now() - lastFetch) < ONE_HOUR) {
      return resolve(cachedKeys);
    }
    https.get('https://www.googleapis.com/identitytoolkit/v3/relyingparty/publicKeys', res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          cachedKeys = JSON.parse(data);
          lastFetch = Date.now();
          resolve(cachedKeys);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

/**
 * Verifica un Firebase ID Token (JWT).
 * Lanza error si no es válido.
 */
async function verifyFirebaseIdToken(idToken) {
  if (!idToken) throw new Error('FALTANTE_ID_TOKEN');

  // NUEVO: preferir Admin SDK si está inicializado (más robusto, valida firma y expiración)
  if (admin && admin.apps && admin.apps.length) {
    // verifyIdToken lanza si está expirado/alterado; incluye email/email_verified si existen
    const payload = await admin.auth().verifyIdToken(idToken, true);
    return payload;
  }

  // Fallback JWKS (como antes)
  const keys = await fetchGoogleKeys();
  const decodedHeader = JSON.parse(Buffer.from(idToken.split('.')[0], 'base64').toString('utf8'));
  const kid = decodedHeader.kid;
  const pubKey = keys[kid];
  if (!pubKey) throw new Error('CLAVE_NO_ENCONTRADA');
  // Validar sin aud estricta (si deseas, agrega process.env.FIREBASE_PROJECT_ID y compara aud/iss)
  const payload = jwt.verify(idToken, pubKey, { algorithms: ['RS256'] });
  return payload;
}

module.exports = { verifyFirebaseIdToken };
