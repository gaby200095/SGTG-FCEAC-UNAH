// backend/src/app.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const routes = require('./routes/index');
const db = require('./config/database');

// NUEVO: seguridad y utilidades
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 5001;

// Seguridad básica
app.use(helmet());
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false
}));

// CORS (incluye credenciales para refresh token por cookie si se usa)
app.use(cors({
  origin: ['http://localhost:3000'],
  credentials: true
}));

app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// NUEVO: normalizador de URL para quitar espacios/%20 finales
app.use((req, _res, next) => {
  try {
    const cleaned = req.url.replace(/(%20|\s)+$/g, '');
    if (cleaned !== req.url) {
      console.warn(`[API] Normalizado path '${req.url}' -> '${cleaned}'`);
      req.url = cleaned;
    }
  } catch {}
  next();
});

// NUEVO: logger mínimo de peticiones
app.use((req, _res, next) => {
  console.log(`[API] ${req.method} ${req.originalUrl}`);
  next();
});

// Rutas de auth explícitas (antes del router y 404)
const { registerUser, loginUser, forgotPassword, verify2FA, logout, refreshAccessToken } = require('./controllers/index');
app.post('/api/auth/register', registerUser);
app.post('/api/auth/login', loginUser);
app.post('/api/auth/forgot-password', forgotPassword);
app.post('/api/auth/2fa-verify', verify2FA);
app.post('/api/auth/logout', logout);
app.post('/api/auth/refresh', refreshAccessToken); // NUEVO

// Router principal
app.use('/api', routes);

// Test de conexión a la base de datos al iniciar
db.query('SELECT NOW() AS ahora', (err, results) => {
  if (err) {
    console.error(' Error al conectar a la base de datos:', err);
  } else {
    console.log(' Conexión exitosa a la base de datos en Hostinger. Hora actual:', results[0].ahora);
  }
});

/* Prueba simultánea de una ruta que el frontend puede pedir datos al backend 
y que este consulte a la base de datos. */
// Ruta principal
app.get('/', (req, res) => {
    res.send('Servidor activo y backend funcionando');
});

// Ruta de prueba de la base de datos
app.get('/api/prueba-db', (req, res) => {
    db.query('SELECT NOW() AS ahora', (err, results) => {
        if (err) {
            console.error(' Error al consultar la BD:', err);
            return res.status(500).json({ error: 'Error al consultar la base de datos' });
        }
        res.json({ horaServidor: results[0].ahora });
    });
});

// NUEVO: 404 específico para rutas API desconocidas (con pistas)
app.use('/api/*', (req, res) => {
  return res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.originalUrl,
    hint: [
      'POST /api/auth/register',
      'POST /api/auth/login',
      'POST /api/auth/2fa-verify',
      'POST /api/auth/forgot-password',
      'POST /api/auth/logout',
      'GET  /api/users/:id',
      'GET  /api/users/role/:rol',
      'GET  /api/expedientes',
      'GET  /api/prueba-db'
    ]
  });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
