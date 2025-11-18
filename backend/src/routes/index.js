const express = require('express');
const router = express.Router();

const { requireAuth } = require('../middlewares/auth');
const {
  getTramites,
  createTramite,
  listTables,
  getTableColumns,
  getTableRows,
  insertRowInTable,
  ensureCoreTables
} = require('../controllers');

// Rutas de trámites
router.get('/tramites', requireAuth, getTramites);
router.post('/tramites', requireAuth, createTramite);

// Rutas genéricas para consultar tablas (protegidas)
router.get('/db/tables', requireAuth, listTables);
router.get('/table/:name/columns', requireAuth, getTableColumns);
router.get('/table/:name', requireAuth, getTableRows);
router.post('/table/:name', requireAuth, insertRowInTable);

// Verificar/crear tablas base (opcional)
router.post('/db/ensure-core', requireAuth, ensureCoreTables);

// Landing (fallback simple)
router.get('/landing', (_req, res) => {
  const fallback = {
    titulo: 'Bienvenido al Sistema de Gestión de Trámites de Graduación',
    descripcion: 'En nuestra página podrás gestionar todo tu proceso de graduación de manera rápida y sencilla, sin complicaciones.',
    beneficios: [
      'Inicia solicitudes y carga documentos desde un solo lugar.',
      'Consulta requisitos y estados de tus procesos en tiempo real.',
      'Recibe notificaciones y recordatorios oportunos.'
    ]
  };
  res.json(fallback);
});

// Nota: Si necesitas montar rutas de estudiante, impórtalas y úsalas aquí.
// Ejemplo (cuando exista el módulo):
// const estudianteRouter = require('./estudiante');
// router.use('/estudiante', estudianteRouter);

// Ruta específica para obtener usuarios
router.get('/table/usuario_sistema', requireAuth, async (req, res) => {
  try {
    const limit = Number(req.query.limit || 500);
    const rows = await db.promise().query(`
      SELECT id_usuario, nombre_usuario, apellido_usuario, correo_usuario, fecha_creacion
      FROM usuario_sistema
      ORDER BY id_usuario
      LIMIT ?
    `, [limit]);
    res.json(rows[0]);
  } catch (err) {
    console.error('Error al obtener usuarios:', err);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

module.exports = router;