const db = require('../config/database');
const useragent = require('useragent');

/*
  Middleware de registro de actividad reutilizando la tabla 'login'.
  Inserta una fila por cada petición autenticada (si req.user.id_usuario existe).
*/
module.exports = async function activityLogger(req, _res, next) {
  try {
    // Opcional: ignorar rutas estáticas comunes
    if (/\.(css|js|png|jpg|jpeg|gif|svg|ico|map)$/i.test(req.path)) return next();

    const id_usuario = req.user?.id_usuario;
    if (!id_usuario) return next();

    const accion = `${req.method} ${req.originalUrl}`;
    const ip =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      '0.0.0.0';

    const uaBase = useragent.parse(req.headers['user-agent'] || '').toString();
    const ua = `${uaBase} | ACT:${accion}`.slice(0, 255);

    await db
      .promise()
      .execute(
        'INSERT INTO login (id_usuario, ip, user_agent, exitoso) VALUES (?,?,?,?)',
        [id_usuario, ip, ua, 1]
      );
  } catch {
    // Silencioso: no interrumpe la petición
  }
  next();
};

