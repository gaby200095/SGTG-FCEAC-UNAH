try { require('dotenv').config(); } catch {}
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const routes = require('./routes/index');
const db = require('./config/database');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const { requireAuth } = require('./middlewares/auth');

const mysql = require('mysql2/promise');
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'sgtg_fceac',
  waitForConnections: true,
  connectionLimit: 10
});
const q = async (sql, params = []) => (await pool.query(sql, params))[0];

const app = express();
const PORT = process.env.PORT || 5001;

app.use(helmet());
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false
}));

const FRONT = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
app.use(cors({
  origin: [FRONT],
  credentials: true,
  exposedHeaders: ['Content-Disposition']
}));
app.options('*', cors({ origin:[FRONT], credentials:true }));

app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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

app.use((req, _res, next) => {
  console.log(`[API] ${req.method} ${req.originalUrl}`);
  next();
});

app.get('/api/health', (_req,res)=> {
  res.json({
    ok:true,
    ts: Date.now(),
    env: {
      node: process.version,
      db: process.env.DB_NAME || 'sgtg_fceac'
    }
  });
});

const { registerUser, loginUser, forgotPassword, resetPassword, verify2FA, logout, refreshAccessToken, me } = require('./controllers/index');
app.post('/api/auth/register', registerUser);
app.post('/api/auth/login', loginUser);
app.get('/api/auth/me', me);
app.post('/api/auth/forgot-password', forgotPassword);
app.post('/api/auth/reset-password', resetPassword);
app.post('/api/auth/2fa-verify', verify2FA);
app.post('/api/auth/logout', logout);
app.post('/api/auth/refresh', refreshAccessToken);

const reportesRoutes = require('./routes/reportes');
app.use('/api/reportes', reportesRoutes);

app.use('/api', routes);

app.get('/api/table/usuario_sistema', requireAuth, async (req, res) => {
  try {
    const limit = Number(req.query.limit || 500);
    const rows = await q(`SELECT * FROM usuario_sistema ORDER BY id_usuario LIMIT ?`, [limit]);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Error obteniendo usuarios' });
  }
});

app.get('/api/expedientes', requireAuth, async (_req, res) => {
  try {
    const rows = await q(`
      SELECT 
        ed.id_expediente,
        u.id_usuario,
        CONCAT(COALESCE(u.nombre_usuario,''), ' ', COALESCE(u.apellido_usuario,'')) AS nombre,
        c.nombre AS carrera,
        ed.estado
      FROM expediente_digital ed
      JOIN usuario_sistema u ON u.id_usuario = ed.id_usuario
      JOIN carrera c ON c.id_carrera = ed.id_carrera
      ORDER BY ed.id_expediente DESC
    `);
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Error obteniendo expedientes' });
  }
});

app.post('/api/expedientes/create-if-missing', requireAuth, async (req, res) => {
  try {
    const { id_usuario, clave_carrera } = req.body;
    if (!id_usuario || !clave_carrera) return res.status(400).json({ error: 'faltan datos' });

    const carrera = (await q(`SELECT * FROM carrera WHERE clave=?`, [clave_carrera]))[0];
    if (!carrera) return res.status(404).json({ error: 'carrera no encontrada' });

    const exist = (await q(
      `SELECT * FROM expediente_digital WHERE id_usuario=? AND id_carrera=?`,
      [id_usuario, carrera.id_carrera]
    ))[0];
    if (exist) return res.json(exist);

    await q(
      `INSERT INTO expediente_digital (id_usuario,id_carrera,estado) VALUES (?,?,?)`,
      [id_usuario, carrera.id_carrera, 'nuevo']
    );
    const creado = (await q(
      `SELECT * FROM expediente_digital WHERE id_usuario=? AND id_carrera=?`,
      [id_usuario, carrera.id_carrera]
    ))[0];
    res.json(creado);
  } catch {
    res.status(500).json({ error: 'Error creando expediente' });
  }
});

app.get('/api/table/requisito', requireAuth, async (req, res) => {
  try {
    const limit = Number(req.query.limit || 1000);
    const rows = await q(
      `SELECT r.*, c.nombre AS nombre_carrera, 'FCEAC' AS facultad
       FROM requisito r
       JOIN carrera c ON c.id_carrera = r.id_carrera
       ORDER BY c.clave, r.orden, r.id_requisito
       LIMIT ?`,
      [limit]
    );
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Error obteniendo requisitos' });
  }
});

app.get('/api/table/progreso_requisito', requireAuth, async (req, res) => {
  try {
    const limit = Number(req.query.limit || 2000);
    const rows = await q(
      `SELECT * FROM vw_progreso_ultimo ORDER BY fecha_actualizacion DESC LIMIT ?`,
      [limit]
    );
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Error obteniendo progreso' });
  }
});

app.post('/api/table/progreso_requisito', requireAuth, async (req, res) => {
  try {
    const { id_expediente, id_usuario, id_requisito, estado, observacion, actualizado_por } =
      req.body || {};
    if (!id_expediente || !id_usuario || !id_requisito || !estado) {
      return res.status(400).json({ error: 'faltan campos obligatorios' });
    }
    await q(
      `INSERT INTO progreso_requisito
       (id_expediente,id_usuario,id_requisito,estado,observacion,actualizado_por,fecha_actualizacion)
       VALUES (?,?,?,?,?,?,NOW())`,
      [id_expediente, id_usuario, id_requisito, estado, observacion || null, actualizado_por || null]
    );
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Error insertando progreso' });
  }
});

app.put('/api/table/progreso_requisito', requireAuth, async (req, res) => {
  try {
    const { id_expediente, id_usuario, id_requisito, estado, observacion, actualizado_por } =
      req.body || {};
    if (!id_expediente || !id_usuario || !id_requisito || !estado) {
      return res.status(400).json({ error: 'faltan campos obligatorios' });
    }
    await q(
      `INSERT INTO progreso_requisito
       (id_expediente,id_usuario,id_requisito,estado,observacion,actualizado_por,fecha_actualizacion)
       VALUES (?,?,?,?,?,?,NOW())`,
      [id_expediente, id_usuario, id_requisito, estado, observacion || null, actualizado_por || null]
    );
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Error guardando progreso' });
  }
});

app.get('/', (_req, res) => {
  res.send('Servidor activo y backend funcionando');
});

app.use('/api/*', (req, res) =>
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.originalUrl,
    hint: [
      'POST /api/auth/register',
      'POST /api/auth/login',
      'POST /api/auth/2fa-verify',
      'POST /api/auth/refresh',
      'POST /api/auth/forgot-password',
      'POST /api/auth/logout',
      'GET  /api/expedientes',
      'GET  /api/table/usuario_sistema',
      'GET  /api/table/requisito',
      'GET  /api/table/progreso_requisito'
    ]
  })
);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  db.query('SELECT NOW() AS ahora', (err, results) => {
    if (err) console.error(' Error al conectar a la base de datos:', err);
    else console.log(' Hora actual BD:', results[0].ahora);
  });
});
