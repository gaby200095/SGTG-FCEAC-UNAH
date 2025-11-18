const router = require('express').Router();
const {
  registerUser,
  loginUser,
  verify2FA,
  refreshAccessToken,
  logout
} = require('../controllers/index');

// Mapear endpoints a controladores actuales
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/2fa-verify', verify2FA);
router.post('/refresh', refreshAccessToken);
router.post('/logout', logout);

module.exports = router;
