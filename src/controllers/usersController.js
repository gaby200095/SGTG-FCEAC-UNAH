const db = require('../config/database');

const getById = async (req, res) => {
  const dbp = db.promise();
  const id = Number(req.params.id);
  const me = req.user;

  if (!Number.isInteger(id)) return res.status(400).json({ error: 'ID inválido' });

  // Sólo propio, o roles elevados
  const elevated = (me.roles || []).some(r => ['coordinador', 'administrativo', 'secretaria_general'].includes(r));
  if (me.id_usuario !== id && !elevated) {
    return res.status(403).json({ error: 'No autorizado' });
  }

  try {
    const [rows] = await dbp.execute(
      `SELECT id_usuario, nombre_usuario, apellido_usuario, correo_usuario, fecha_creacion, ultimo_acceso
       FROM usuario_sistema WHERE id_usuario=?`,
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'No encontrado' });

    const [rolesRows] = await dbp.execute(
      `SELECT r.nombre_rol FROM usuario_rol ur
       JOIN rol r ON r.id_rol = ur.id_rol
       WHERE ur.id_usuario=?`, [id]
    );

    return res.json({ ...rows[0], roles: rolesRows.map(r => r.nombre_rol) });
  } catch (e) {
    console.error(' Error getById:', e);
    return res.status(500).json({ error: 'Error al obtener usuario' });
  }
};

const listByRole = async (req, res) => {
  const dbp = db.promise();
  const rol = String(req.params.rol || '').toLowerCase();
  try {
    const [rows] = await dbp.execute(
      `SELECT u.id_usuario, u.nombre_usuario, u.apellido_usuario, u.correo_usuario, r.nombre_rol
       FROM usuario_sistema u
       JOIN usuario_rol ur ON ur.id_usuario = u.id_usuario
       JOIN rol r ON r.id_rol = ur.id_rol
       WHERE LOWER(r.nombre_rol) = ?`,
      [rol]
    );
    return res.json(rows);
  } catch (e) {
    console.error(' Error listByRole:', e);
    return res.status(500).json({ error: 'Error al listar usuarios por rol' });
  }
};

module.exports = { getById, listByRole };
