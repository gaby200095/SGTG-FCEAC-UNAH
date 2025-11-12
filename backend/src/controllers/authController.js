const db = require('../config/database');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');

const validators = {
  register: [
    body('correo').isEmail().withMessage('Correo inválido'),
    body('password').isString().isLength({ min: 6 }).withMessage('Contraseña muy corta'),
    body('nombre').optional().isString(),
    body('apellido').optional().isString()
  ],
  login: [
    body('correo').isEmail(),
    body('password').isString().notEmpty()
  ]
};

const getRoles = async (dbp, id_usuario) => {
  const [rows] = await dbp.execute(
    `SELECT r.nombre_rol 
     FROM usuario_rol ur 
     JOIN rol r ON r.id_rol=ur.id_rol 
     WHERE ur.id_usuario=?`, [id_usuario]
  );
  return rows.map(r => String(r.nombre_rol).toLowerCase());
};

const register = [
  ...validators.register,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const dbp = db.promise();
    const { correo, password, nombre = '', apellido = '' } = req.body;
    try {
      const [exists] = await dbp.execute(
        'SELECT id_usuario FROM usuario_sistema WHERE correo_usuario=?',
        [correo]
      );
      if (exists.length) return res.status(409).json({ error: 'Correo ya registrado' });

      const hash = await bcrypt.hash(password, 10);
      const [ins] = await dbp.execute(
        `INSERT INTO usuario_sistema (nombre_usuario, apellido_usuario, contraseña_usuario, correo_usuario)
         VALUES (?,?,?,?)`,
        [nombre, apellido, hash, correo]
      );
      const id_usuario = ins.insertId;

      // Rol por defecto: estudiante (si existe)
      const [r] = await dbp.execute('SELECT id_rol FROM rol WHERE LOWER(nombre_rol)=LOWER(?)', ['estudiante']);
      if (r.length) {
        await dbp.execute('INSERT INTO usuario_rol (id_usuario, id_rol) VALUES (?,?)', [id_usuario, r[0].id_rol]);
      }

      return res.status(201).json({ ok: true, id_usuario, correo });
    } catch (e) {
      console.error(' Error en register:', e);
      return res.status(500).json({ error: 'Error al registrar' });
    }
  }
];

const login = [
  ...validators.login,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const dbp = db.promise();
    const { correo, password } = req.body;
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || null;
    const ua = req.headers['user-agent'] || '';

    try {
      const [rows] = await dbp.execute(
        'SELECT id_usuario, contraseña_usuario FROM usuario_sistema WHERE correo_usuario=?',
        [correo]
      );
      if (!rows.length) {
        await dbp.execute('INSERT INTO login (id_usuario, ip, user_agent, exitoso) VALUES (NULL,?,?,0)', [ip, ua]);
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }
      const user = rows[0];
      const ok = await bcrypt.compare(password, user.contraseña_usuario);

      await dbp.execute('INSERT INTO login (id_usuario, ip, user_agent, exitoso) VALUES (?,?,?,?)', [user.id_usuario, ip, ua, ok ? 1 : 0]);
      if (!ok) return res.status(401).json({ error: 'Credenciales inválidas' });

      // Actualizar último acceso
      await dbp.execute('UPDATE usuario_sistema SET ultimo_acceso=NOW() WHERE id_usuario=?', [user.id_usuario]);

      const roles = await getRoles(dbp, user.id_usuario);
      return res.json({ ok: true, user: { id_usuario: user.id_usuario, correo, roles } });
    } catch (e) {
      console.error(' Error en login:', e);
      return res.status(500).json({ error: 'Error en login' });
    }
  }
];

module.exports = { register, login };
