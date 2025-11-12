const router = require('express').Router();
const { requireAuth } = require('../middlewares/auth');
const { authorizeRoles } = require('../middlewares/roles');
const logActivity = require('../middlewares/activityLogger');
const ctrl = require('../controllers/expedientesController');

// Estudiante: sólo su expediente
// Coordinador: expedientes de su carrera (simulado)
// Administrativo/Secretaría: todos
router.get('/',
  requireAuth,
  logActivity,
  ctrl.listByRole);

module.exports = router;
