const router = require('express').Router();
const { requireAuth } = require('../middlewares/auth');
const { authorizeRoles } = require('../middlewares/roles');
const logActivity = require('../middlewares/activityLogger');
const ctrl = require('../controllers/usersController');

// Perfil del usuario (solo propio o roles elevados)
router.get('/:id', requireAuth, logActivity, ctrl.getById);

// Listar por rol (sólo administrativo o secretaría)
router.get('/role/:rol', requireAuth, authorizeRoles(['administrativo', 'secretaria_general']), logActivity, ctrl.listByRole);

module.exports = router;
