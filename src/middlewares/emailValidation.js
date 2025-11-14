const dns = require('dns').promises;

const SIMPLE_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

module.exports = async function emailValidation(req, res, next) {
  const { correo } = req.body || {};
  if (!correo) return res.status(400).json({ error: 'correo requerido' });

  if (!SIMPLE_REGEX.test(correo)) {
    return res.status(400).json({ error: 'Formato de correo inválido' });
  }

  if (process.env.ENABLE_EMAIL_MX_CHECK === '1') {
    try {
      const domain = correo.split('@')[1];
      const mx = await dns.resolveMx(domain);
      if (!mx || !mx.length) {
        return res.status(400).json({ error: 'Dominio de correo sin registros MX válidos' });
      }
    } catch {
      return res.status(400).json({ error: 'No se pudo validar el dominio MX del correo' });
    }
  }

  next();
};
