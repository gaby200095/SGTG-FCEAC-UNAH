const router = require('express').Router();
const ctrl = require('../controllers/authController');

router.post('/register', ctrl.register);
router.post('/login', ctrl.login);

module.exports = router;
router.post('/logout', ctrl.logout);
// Opcional: refresh token
router.post('/refresh', ctrl.refreshToken);

module.exports = router;
