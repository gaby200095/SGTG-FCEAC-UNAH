const jwt = require('jsonwebtoken');

const ACCESS_SECRET = process.env.JWT_SECRET || 'dev_access_secret';
const MAX_IDLE_MS = Number(process.env.JWT_MAX_IDLE_MS || 15 * 60 * 1000); // 15 min

// Blacklists y última actividad (en memoria para demo)
const accessBlacklist = new Set();
const refreshBlacklist = new Set();
const lastSeen = new Map(); // token -> timestamp

const verifyToken = (token) => jwt.verify(token, ACCESS_SECRET);

const requireAuth = (req, res, next) => {
  try {
    const hdr = req.headers.authorization || '';
    const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Token requerido' });
    if (accessBlacklist.has(token)) return res.status(401).json({ error: 'Token inválido' });

    const payload = verifyToken(token);

    // Inactividad: expirar por inactividad con sliding window
    const now = Date.now();
    const seenAt = lastSeen.get(token) || now;
    if (now - seenAt > MAX_IDLE_MS) {
      accessBlacklist.add(token);
      lastSeen.delete(token);
      return res.status(401).json({ error: 'Sesión expirada por inactividad' });
    }
    lastSeen.set(token, now);

    req.user = payload; // { id_usuario, correo, roles:[], ... }
    req.token = token;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Token no válido', detail: e.message });
  }
};

const blacklistAccess = (token) => token && accessBlacklist.add(token);
const blacklistRefresh = (token) => token && refreshBlacklist.add(token);
const isRefreshBlacklisted = (token) => refreshBlacklist.has(token);

module.exports = {
  requireAuth,
  blacklistAccess,
  blacklistRefresh,
  isRefreshBlacklisted
};
