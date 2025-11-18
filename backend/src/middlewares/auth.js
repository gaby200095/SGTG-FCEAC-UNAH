const jwt = require('jsonwebtoken');

const ACCESS_SECRET = process.env.JWT_SECRET || 'dev_access_secret';
const MAX_IDLE_MS = Number(process.env.JWT_MAX_IDLE_MS || 15 * 60 * 1000); // 15 minutos

// Estados en memoria
const accessBlacklist = new Set();         // access tokens invalidados
const refreshBlacklist = new Set();        // refresh tokens invalidados (si deseas usar)
const lastSeenByToken = new Map();         // token -> ts última actividad
const lastActivityByUser = new Map();      // id_usuario -> ts última actividad

const verifyAccess = (token) => jwt.verify(token, ACCESS_SECRET);

const requireAuth = (req, res, next) => {
  try {
    const hdr = req.headers.authorization || '';
    const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Token requerido' });
    if (accessBlacklist.has(token)) return res.status(401).json({ error: 'Token inválido' });

    const payload = verifyAccess(token); // { id_usuario, correo, roles, iat, exp }
    const now = Date.now();

    // Expiración por inactividad (sliding window)
    const prev = lastSeenByToken.get(token) || 0;
    if (prev && now - prev > MAX_IDLE_MS) {
      accessBlacklist.add(token);
      lastSeenByToken.delete(token);
      return res.status(401).json({ error: 'Sesión expirada por inactividad' });
    }

    // Marcar actividad
    lastSeenByToken.set(token, now);
    if (payload?.id_usuario) lastActivityByUser.set(payload.id_usuario, now);

    req.user = payload;
    req.token = token;
    return next();
  } catch (e) {
    return res.status(401).json({ error: 'Token no válido', detail: e?.message });
  }
};

const blacklistAccess = (token) => token && accessBlacklist.add(token);
const blacklistRefresh = (token) => token && refreshBlacklist.add(token);
const isRefreshBlacklisted = (token) => refreshBlacklist.has(token);
const getLastActivityTs = (idUsuario) => lastActivityByUser.get(idUsuario) || 0;

module.exports = {
  requireAuth,
  blacklistAccess,
  blacklistRefresh,
  isRefreshBlacklisted,
  getLastActivityTs,
  MAX_IDLE_MS
};

