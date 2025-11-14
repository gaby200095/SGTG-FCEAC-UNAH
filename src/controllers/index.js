// Este archivo exporta funciones que manejan la lógica de negocio para las rutas definidas.
const db = require('../config/database');

let bcrypt;
try { bcrypt = require('bcrypt'); } catch { bcrypt = require('bcryptjs'); }
const jwt = require('jsonwebtoken');
let speakeasy;
try { speakeasy = require('speakeasy'); } catch { speakeasy = null; } // 2FA opcional

// NUEVO: nodemailer opcional para OTP por correo
// let nodemailer = null;
// try { nodemailer = require('nodemailer'); } catch { nodemailer = null; }
// ELIMINADO: cliente SMTP directo a MX
// let SMTPConnection = null;
// try { SMTPConnection = require('smtp-connection'); } catch { SMTPConnection = null; }

const { getLastActivityTs, MAX_IDLE_MS } = require('../middlewares/auth'); // NUEVO

// NUEVO: importar DNS para validar MX
const dns = require('dns').promises;
// NUEVO: importar helper de envío de OTP (Gmail / Nodemailer)
const { sendOtpEmail, sendResetEmail } = require('../utils/sendOtp');

const ACCESS_SECRET = process.env.JWT_SECRET || 'dev_access_secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret';
const ACCESS_TTL = process.env.JWT_ACCESS_TTL || '15m';
const REFRESH_TTL_SEC = 7 * 24 * 3600; // 7 días

// NUEVO: helpers de firma (faltaban)
const signAccess = (payload) => jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_TTL });
const signRefresh = (payload) => jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_TTL_SEC });

// NUEVO: flags de seguridad y 2FA
const REQUIRE_2FA = process.env.REQUIRE_2FA !== '0';
const USE_EMAIL_2FA = process.env.USE_EMAIL_2FA === '1';

// NUEVO: dominios permitidos (lista opcional; si está vacía se permite cualquier dominio con MX válido)
const ALLOWED_EMAIL_DOMAINS = String(process.env.ALLOWED_EMAIL_DOMAINS || '')
  .split(',').map(s => s.trim().toLowerCase()).filter(Boolean);

// NUEVO: helper para IP y User-Agent (usado en safeLogLogin y loginUser)
const getClientMeta = (req) => {
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.socket?.remoteAddress
    || '0.0.0.0';
  const ua = req.headers['user-agent'] || 'unknown';
  return { ip, ua };
};

// === NUEVO: Validación robusta de correo (formato + MX + anti-desechables) ===
const emailRegex = /^[A-Z0-9._%+-]+@([A-Z0-9-]+\.)+[A-Z]{2,}$/i;
const DISPOSABLE_HINTS = ['mailinator','tempmail','10minutemail','guerrillamail','yopmail','trashmail','sharklasers'];
const INVALID_LABEL = /(^-)|(-$)|(^\.)|(\.$)|\.\./;

// === NUEVO: control de MX por entorno y dominios seguros ===
const EMAIL_MX_REQUIRED = process.env.EMAIL_MX_REQUIRED === '1';
const EMAIL_MX_TIMEOUT_MS = Number(process.env.EMAIL_MX_TIMEOUT_MS || 1500);
const SAFE_PROVIDERS = [
  'gmail.com','googlemail.com','outlook.com','hotmail.com','hotmail.es',
  'live.com','live.com.mx','yahoo.com','yahoo.es','icloud.com','me.com',
  'proton.me','protonmail.com','unah.edu.hn','unah.hn'
];

const resolveMxWithTimeout = async (domain, ms = 1500) => {
  let timer;
  try {
    const p = dns.resolveMx(domain);
    const t = new Promise((_, rej) => { timer = setTimeout(() => rej(new Error('MX_TIMEOUT')), ms); });
    const mx = await Promise.race([p, t]);
    return Array.isArray(mx) ? mx : [];
  } finally {
    if (timer) clearTimeout(timer);
  }
};

const validateEmailServer = async (email) => {
  const s = String(email || '').trim();
  if (!emailRegex.test(s)) return { ok: false, msg: 'Formato de correo inválido' };
  const [local, domainRaw] = s.split('@');
  const domain = (domainRaw || '').toLowerCase();

  // Relajar: permitir parte local de 1+ carácter
  if (!local || local.length < 1) return { ok: false, msg: 'La parte local está vacía' };
  if (INVALID_LABEL.test(domain)) return { ok: false, msg: 'Dominio inválido' };
  if (DISPOSABLE_HINTS.some(k => domain.includes(k))) return { ok: false, msg: 'Dominio desechable no permitido' };

  // Si hay dominios permitidos configurados, restringir a ellos
  if (ALLOWED_EMAIL_DOMAINS.length && !ALLOWED_EMAIL_DOMAINS.some(d => domain.endsWith(d))) {
    return { ok: false, msg: `Dominio no permitido. Permitidos: ${ALLOWED_EMAIL_DOMAINS.join(', ')}` };
  }

  try {
    const mx = await resolveMxWithTimeout(domain, EMAIL_MX_TIMEOUT_MS);
    if (!mx.length) {
      // Si se exige MX estricto y no es proveedor seguro, rechazar
      if (EMAIL_MX_REQUIRED && !SAFE_PROVIDERS.includes(domain)) {
        return { ok: false, msg: 'El dominio no tiene registros MX' };
      }
      // Modo “suave”: permitir
      return { ok: true };
    }
    return { ok: true };
  } catch {
    // Si falla la consulta MX: permitir proveedores seguros o cuando NO es requerido estrictamente
    if (SAFE_PROVIDERS.includes(domain) || !EMAIL_MX_REQUIRED) return { ok: true };
    return { ok: false, msg: 'No se pudo validar el dominio (MX)' };
  }
};

// === NUEVO: Envío de OTP por correo (soporta SMTP autenticado o SMTP local) ===
// ELIMINADO: createTransport local. Delegamos al módulo utils/sendOtp
// const buildTransport = () => { /* ... */ };

// Reemplazo: función simple que delega al módulo utils/sendOtp
const sendEmailOtp = async (to, code) => {
  try {
    await sendOtpEmail(to, code);
    return true;
  } catch (e) {
    console.warn('No se pudo enviar OTP por correo:', e.message);
    // Último recurso en dev
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[2FA-EMAIL] OTP para ${to}: ${code}`);
      return true;
    }
    return false;
  }
};
// === FIN helpers de correo/MX ===

// === MAPAS GLOBALES (2FA y reset) ===
const pending2FA = global.__pending2FA || new Map();
global.__pending2FA = pending2FA;

const userSecretsMem = global.__userSecretsMem || new Map();
global.__userSecretsMem = userSecretsMem;

const pwdResetTokens = global.__pwdResetTokens || new Map();
global.__pwdResetTokens = pwdResetTokens;

// Helper: generar/obtener secreto TOTP; usa BD si existe columna, si no memoria
const ensureUser2FASecret = async (dbp, id_usuario) => {
  if (!speakeasy) return { secret: null, otpauth: null, storedInDB: false };
  let hasColumn = false;
  try {
    const [cols] = await dbp.execute(`
      SELECT COLUMN_NAME FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='usuario_sistema'
    `);
    hasColumn = cols.some(c => c.COLUMN_NAME === 'two_factor_secret');
  } catch {}
  if (!hasColumn) {
    let sec = userSecretsMem.get(id_usuario);
    if (!sec) {
      sec = speakeasy.generateSecret({ length: 20, name: 'SGTG-FCEAC-UNAH' });
      userSecretsMem.set(id_usuario, sec);
    }
    return { secret: sec.base32, otpauth: sec.otpauth_url, storedInDB: false };
  }
  const [r] = await dbp.execute('SELECT two_factor_secret FROM usuario_sistema WHERE id_usuario=?', [id_usuario]);
  if (r.length && r[0].two_factor_secret) return { secret: r[0].two_factor_secret, otpauth: null, storedInDB: true };
  const gen = speakeasy.generateSecret({ length: 20, name: 'SGTG-FCEAC-UNAH' });
  await dbp.execute('UPDATE usuario_sistema SET two_factor_secret=? WHERE id_usuario=?', [gen.base32, id_usuario]);
  return { secret: gen.base32, otpauth: gen.otpauth_url, storedInDB: true };
};

// NUEVO: insertar en tabla login solo si hay id_usuario válido (evita romper la FK NOT NULL)
const safeLogLogin = async (dbp, idUsuario, exitoso, req) => {
  try {
    if (!Number.isInteger(idUsuario) || idUsuario <= 0) return; // sin usuario → no registrar (FK impediría)
    const { ip, ua } = getClientMeta(req);
    await dbp.execute(
      'INSERT INTO login (id_usuario, ip, user_agent, exitoso) VALUES (?,?,?,?)',
      [idUsuario, ip, ua, exitoso ? 1 : 0]
    );
  } catch (e) {
    console.warn('No se pudo registrar intento de login:', e.message);
  }
};

// NUEVO: defaults por tipo para solicitud (mínimos viables)
const defaultForType = (col) => {
  const t = String(col.DATA_TYPE || '').toLowerCase();
  const type = String(col.COLUMN_TYPE || '').toLowerCase();
  if (col.COLUMN_DEFAULT !== null) return col.COLUMN_DEFAULT;
  if (col.IS_NULLABLE === 'YES') return null;
  if (t === 'enum') {
    // Tomar el primer valor del enum
    const m = type.match(/^enum\((.+)\)$/);
    if (m) {
      const first = m[1].split(',')[0].trim().replace(/^'/, '').replace(/'$/, '');
      return first || '';
    }
    return '';
  }
  if (['varchar','char','text','tinytext','mediumtext','longtext'].includes(t)) return '';
  if (['int','bigint','tinyint','smallint','mediumint','year'].includes(t)) return 0;
  if (['decimal','float','double'].includes(t)) return 0;
  if (['date'].includes(t)) return '2000-01-01';
  if (['time'].includes(t)) return '00:00:00';
  if (['datetime','timestamp'].includes(t)) return '2000-01-01 00:00:00';
  if (['json'].includes(t)) return '{}';
  return null;
};

// NUEVO: crea una fila en solicitud con valores mínimos deducidos, devuelve id_usuario asignado
const insertSolicitudMinimal = async (conn) => {
  // Leer columnas de la tabla 'solicitud'
  const [cols] = await conn.execute(`
    SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_KEY, EXTRA
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'solicitud'
    ORDER BY ORDINAL_POSITION
  `);
  if (!cols.length) throw new Error('Tabla solicitud no existe');

  // Detectar columna id_usuario en solicitud
  const colIdUsr = cols.find(c => c.COLUMN_NAME === 'id_usuario');
  const isAutoInc = !!(colIdUsr && String(colIdUsr.EXTRA || '').toLowerCase().includes('auto_increment'));

  // Si no existe columna id_usuario en solicitud, no podemos satisfacer la FK
  if (!colIdUsr) {
    const e = new Error('La tabla solicitud no tiene columna id_usuario');
    e.code = 'NO_ID_USUARIO_COL';
    throw e;
  }

  // Si no es AUTO_INCREMENT, generar uno de forma segura dentro de la transacción
  let nextIdUsuario = null;
  if (!isAutoInc) {
    const [rows] = await conn.query(`SELECT COALESCE(MAX(id_usuario),0) + 1 AS nextId FROM solicitud FOR UPDATE`);
    nextIdUsuario = rows?.[0]?.nextId || 1;
  }

  // Construir INSERT con valores mínimos (incluyendo id_usuario si no es autoincrement)
  const insertCols = [];
  const placeholders = [];
  const values = [];

  // Helper local para valor por defecto
  const defVal = (c) => {
    if (c.COLUMN_DEFAULT !== null) return c.COLUMN_DEFAULT;
    const t = String(c.DATA_TYPE || '').toLowerCase();
    const type = String(c.COLUMN_TYPE || '').toLowerCase();
    if (t === 'enum') {
      const m = type.match(/^enum\((.+)\)$/);
      if (m) {
        const first = m[1].split(',')[0].trim().replace(/^'/, '').replace(/'$/, '');
        return first || '';
      }
      return '';
    }
    if (['varchar','char','text','tinytext','mediumtext','longtext'].includes(t)) return '';
    if (['int','bigint','tinyint','smallint','mediumint','year'].includes(t)) return 0;
    if (['decimal','float','double'].includes(t)) return 0;
    if (t === 'date') return '2000-01-01';
    if (t === 'time') return '00:00:00';
    if (['datetime','timestamp'].includes(t)) return '2000-01-01 00:00:00';
    if (t === 'json') return '{}';
    return null;
  };

  // Recorrer columnas y decidir qué insertar
  for (const c of cols) {
    const name = c.COLUMN_NAME;

    // id_usuario:
    if (name === 'id_usuario') {
      if (isAutoInc) {
        // omitir: lo genera MySQL
        continue;
      } else {
        insertCols.push(name);
        placeholders.push('?');
        values.push(nextIdUsuario);
        continue;
      }
    }

    // PK propia (ej. id_solicitud auto_increment): omitir para que la genere MySQL
    if (String(c.COLUMN_KEY || '').toUpperCase() === 'PRI' &&
        String(c.EXTRA || '').toLowerCase().includes('auto_increment')) {
      continue;
    }

    // Calcular valor por defecto
    const v = defVal(c);
    // Si es nullable y el default heurístico dio null, no incluir la columna
    if (v === null && c.IS_NULLABLE === 'YES') continue;

    insertCols.push(name);
    placeholders.push('?');
    values.push(v);
  }

  // Ejecutar INSERT
  let insertSql;
  if (insertCols.length) {
    const colsIdents = insertCols.map(() => '??').join(', ');
    insertSql = `INSERT INTO solicitud (${colsIdents}) VALUES (${placeholders.join(', ')})`;
    const [ins] = await conn.query(insertSql, [...insertCols, ...values]);
    // Recuperar id_usuario resultante
    if (isAutoInc) {
      // Cuando id_usuario es autoincrement, coincide con insertId
      return ins.insertId;
    }
    return nextIdUsuario;
  } else {
    // Caso extremo: no hay columnas para insertar (muy raro)
    const [ins] = await conn.execute('INSERT INTO solicitud () VALUES ()');
    return isAutoInc ? ins.insertId : nextIdUsuario || 1;
  }
};

// Obtener trámites
const getTramites = (req, res) => {
    const sql = `
      SELECT id, usuario_id, tipo_tramite, estado, fecha_solicitud
      FROM tramites
      ORDER BY fecha_solicitud DESC
    `;
    db.query(sql, (err, rows) => {
        if (err) {
            console.error(' Error al obtener trámites:', err);
            return res.status(500).json({ error: 'Error al obtener trámites' });
        }
        return res.json(rows);
    });
};

// Crear trámite
const createTramite = (req, res) => {
    const { usuario_id, tipo_tramite } = req.body || {};
    if (!usuario_id || !tipo_tramite) {
        return res.status(400).json({ error: 'usuario_id y tipo_tramite son requeridos' });
    }

    const sql = `INSERT INTO tramites (usuario_id, tipo_tramite) VALUES (?, ?)`;
    db.query(sql, [usuario_id, tipo_tramite], (err, result) => {
        if (err) {
            console.error(' Error al crear trámite:', err);
            return res.status(500).json({ error: 'Error al crear trámite' });
        }
        return res.status(201).json({
            id: result.insertId,
            usuario_id,
            tipo_tramite,
            estado: 'pendiente',
            fecha_solicitud: new Date().toISOString()
        });
    });
};

// Opcionales: actualizar/eliminar (si decides exponer estas rutas)
const updateTramite = (req, res) => {
    // Lógica para actualizar un trámite existente
    res.send("Actualizando el trámite...");
};

const deleteTramite = (req, res) => {
    // Lógica para eliminar un trámite
    res.send("Eliminando el trámite...");
};

// Utilidad: obtener lista de tablas
const listTables = (req, res) => {
  db.query('SHOW TABLES', (err, rows) => {
    if (err) {
      console.error(' Error al listar tablas:', err);
      return res.status(500).json({ error: 'Error al listar tablas' });
    }
    const key = rows[0] ? Object.keys(rows[0])[0] : null;
    const tables = key ? rows.map(r => r[key]) : [];
    return res.json({ tables });
  });
};

// Utilidad interna: validar existencia de tabla (case-insensitive)
const ensureTableExists = (table, cb) => {
  const wanted = String(table).toLowerCase();
  const sql = `
    SELECT TABLE_NAME 
    FROM information_schema.TABLES 
    WHERE TABLE_SCHEMA = DATABASE()
  `;
  db.query(sql, (err, rows) => {
    if (err) return cb(err);
    const exists = Array.isArray(rows) && rows.some(r => String(r.TABLE_NAME).toLowerCase() === wanted);
    cb(null, exists);
  });
};

// Columnas de una tabla
const getTableColumns = (req, res) => {
  const table = req.params.name;
  ensureTableExists(table, (err, exists) => {
    if (err) {
      console.error(' Error validando tabla:', err);
      return res.status(500).json({ error: 'Error validando tabla' });
    }
    if (!exists) return res.status(404).json({ error: `Tabla no encontrada: ${table}` });

    db.query('SHOW COLUMNS FROM ??', [table], (err2, cols) => {
      if (err2) {
        console.error(' Error al obtener columnas:', err2);
        return res.status(500).json({ error: 'Error al obtener columnas' });
      }
      return res.json(cols);
    });
  });
};

// Filas de una tabla (SELECT * con paginación y orden seguro)
const getTableRows = (req, res) => {
  const table = req.params.name;
  let { limit = 50, offset = 0, orderBy, orderDir = 'asc' } = req.query;

  // Normalizar paginación
  limit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 500);
  offset = Math.max(parseInt(offset, 10) || 0, 0);
  orderDir = String(orderDir).toLowerCase() === 'desc' ? 'DESC' : 'ASC';

  ensureTableExists(table, (err, exists) => {
    if (err) {
      console.error(' Error validando tabla:', err);
      return res.status(500).json({ error: 'Error validando tabla' });
    }
    if (!exists) return res.status(404).json({ error: `Tabla no encontrada: ${table}` });

    // Si no hay orden, consulta directa
    if (!orderBy) {
      return db.query('SELECT * FROM ?? LIMIT ? OFFSET ?', [table, limit, offset], (e, rows) => {
        if (e) {
          console.error(' Error consultando filas:', e);
          return res.status(500).json({ error: 'Error al consultar filas' });
        }
        return res.json(rows);
      });
    }

    // Validar que orderBy sea una columna real
    db.query('SHOW COLUMNS FROM ??', [table], (eCols, cols) => {
      if (eCols) {
        console.error(' Error al obtener columnas para ordenar:', eCols);
        return res.status(500).json({ error: 'Error al validar columnas' });
      }
      const colNames = cols.map(c => c.Field);
      if (!colNames.includes(orderBy)) {
        // Si la columna no existe, ignorar orden para evitar errores
        return db.query('SELECT * FROM ?? LIMIT ? OFFSET ?', [table, limit, offset], (e2, rows) => {
          if (e2) {
            console.error(' Error consultando filas sin orden:', e2);
            return res.status(500).json({ error: 'Error al consultar filas' });
          }
          return res.json(rows);
        });
      }
      // Consulta con ORDER BY seguro (?? escapa identificadores)
      const sql = 'SELECT * FROM ?? ORDER BY ?? ' + orderDir + ' LIMIT ? OFFSET ?';
      db.query(sql, [table, orderBy, limit, offset], (e3, rows) => {
        if (e3) {
          console.error(' Error consultando filas ordenadas:', e3);
          return res.status(500).json({ error: 'Error al consultar filas' });
        }
        return res.json(rows);
      });
    });
  });
};

// Inserta una fila en una tabla existente (genérico, validando columnas)
const insertRowInTable = (req, res) => {
  const table = req.params.name;
  const body = req.body;

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({ error: 'El cuerpo debe ser un objeto JSON de clave/valor' });
  }

  ensureTableExists(table, (err, exists) => {
    if (err) {
      console.error(' Error validando tabla:', err);
      return res.status(500).json({ error: 'Error validando tabla' });
    }
    if (!exists) return res.status(404).json({ error: `Tabla no encontrada: ${table}` });

    db.query('SHOW COLUMNS FROM ??', [table], (eCols, cols) => {
      if (eCols) {
        console.error(' Error al obtener columnas:', eCols);
        return res.status(500).json({ error: 'Error al obtener columnas' });
      }
      const validCols = cols.map(c => c.Field);
      const keys = Object.keys(body).filter(k => validCols.includes(k));
      if (keys.length === 0) {
        return res.status(400).json({ error: 'Ninguna clave del JSON coincide con columnas de la tabla' });
      }
      const placeholdersCols = keys.map(() => '??').join(', ');
      const placeholdersVals = keys.map(() => '?').join(', ');
      const values = keys.map(k => body[k]);

      const sql = `INSERT INTO ?? (${placeholdersCols}) VALUES (${placeholdersVals})`;
      db.query(sql, [table, ...keys, ...values], (eIns, result) => {
        if (eIns) {
          console.error(' Error al insertar fila:', eIns);
          return res.status(500).json({ error: 'Error al insertar' });
        }
        return res.status(201).json({ id: result.insertId, affectedRows: result.affectedRows });
      });
    });
  });
};

// Crear/verificar tablas base (opcional)
const ensureCoreTables = (_req, res) => {
  const statements = [
    `CREATE TABLE IF NOT EXISTS usuarios (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(100) NOT NULL,
      correo VARCHAR(100) NOT NULL UNIQUE,
      contrasena VARCHAR(255) NOT NULL,
      fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS tramites (
      id INT AUTO_INCREMENT PRIMARY KEY,
      usuario_id INT NOT NULL,
      tipo_tramite VARCHAR(100) NOT NULL,
      estado ENUM('pendiente', 'aprobado', 'rechazado') DEFAULT 'pendiente',
      fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS documentos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tramite_id INT NOT NULL,
      nombre_documento VARCHAR(255) NOT NULL,
      ruta_documento VARCHAR(255) NOT NULL,
      fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tramite_id) REFERENCES tramites(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS landing_prueba (
      id INT AUTO_INCREMENT PRIMARY KEY,
      titulo VARCHAR(255) NOT NULL,
      descripcion TEXT NULL,
      fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  ];
  const execNext = (i = 0) => {
    if (i >= statements.length) return res.json({ ok: true, message: 'Tablas base verificadas/creadas.' });
    db.query(statements[i], (err) => {
      if (err) {
        console.error(' Error creando/verificando tablas:', err);
        return res.status(500).json({ error: 'Error creando/verificando tablas', detail: err.message });
      }
      execNext(i + 1);
    });
  };
  execNext();
};

// NUEVO: validadores básicos y mensajes
const NAME_ALLOWED = /^[A-Za-zÁÉÍÓÚÜáéíóúüÑñ' -]+$/;
const HAS_VOWEL = /[AEIOUÁÉÍÓÚÜaeiouáéíóúü]/;
const FOUR_CONSEC_CONS = /[B-DF-HJ-NP-TV-ZÑñ]{4,}/i;
const TRIPLE_REPEAT = /(.)\1\1/;
const isRealName = (s = '') => {
  const v = String(s || '').trim();
  if (v.length < 2) return 'Debe tener al menos 2 caracteres.';
  if (!NAME_ALLOWED.test(v)) return 'Solo letras, espacios, apóstrofe o guion.';
  if (!HAS_VOWEL.test(v)) return 'Debe incluir al menos una vocal.';
  if (TRIPLE_REPEAT.test(v)) return 'No repitas 3 veces el mismo carácter.';
  if (FOUR_CONSEC_CONS.test(v)) return 'Demasiadas consonantes consecutivas.';
  const parts = v.split(' ').filter(Boolean);
  if (parts.some(p => p.length < 2)) return 'Cada palabra debe tener 2 o más letras.';
  return '';
};
const emailBasic = (e='') => {
  const s = String(e || '').trim();
  const ok = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(s);
  if (!ok) return { ok: false, msg: 'Formato de correo inválido' };
  const [local, domainFullRaw] = s.split('@');
  const domain = (domainFullRaw || '').toLowerCase();
  if (ALLOWED_EMAIL_DOMAINS.length && !ALLOWED_EMAIL_DOMAINS.some(d => domain.endsWith(d))) {
    return { ok: false, msg: `Dominio no permitido. Permitidos: ${ALLOWED_EMAIL_DOMAINS.join(', ')}` };
  }
  return { ok: true };
};
const isStrongPassword = (pwd='') => (pwd.length >= 8 && /\d/.test(pwd) && /[^A-Za-z0-9\s]/.test(pwd));

// NUEVO: antibrute-force por IP+correo
const loginAttempts = global.__loginAttempts || new Map();
global.__loginAttempts = loginAttempts;
const MAX_FAILS = Number(process.env.LOGIN_MAX_FAILS || 5);
const BLOCK_MS = Number(process.env.LOGIN_BLOCK_MS || 10 * 60 * 1000);
const keyFor = (correo, ip) => `${String(correo||'').toLowerCase()}|${ip}`;
const isBlocked = (correo, ip) => {
  const k = keyFor(correo, ip);
  const rec = loginAttempts.get(k);
  if (!rec) return false;
  if (rec.blockedUntil && Date.now() < rec.blockedUntil) return true;
  if (rec.blockedUntil && Date.now() >= rec.blockedUntil) loginAttempts.delete(k);
  return false;
};
const registerFail = (correo, ip) => {
  const k = keyFor(correo, ip);
  const rec = loginAttempts.get(k) || { count: 0, blockedUntil: 0 };
  rec.count += 1;
  if (rec.count >= MAX_FAILS) {
    rec.blockedUntil = Date.now() + BLOCK_MS;
  }
  loginAttempts.set(k, rec);
};
const clearFails = (correo, ip) => loginAttempts.delete(keyFor(correo, ip));

// Registro de usuario (endurecido)
const registerUser = async (req, res) => {
  const pool = db.promise();
  try {
    const { correo, password, nombre = '', apellido = '' } = req.body || {};

    if (!correo || !password)
      return res.status(400).json({ error: 'Faltan campos', detail: 'correo y password son requeridos' });

    // CAMBIO: validar con MX
    const ev = await validateEmailServer(correo);
    if (!ev.ok) return res.status(400).json({ error: 'Correo inválido', detail: ev.msg });

    if (!isStrongPassword(password))
      return res.status(400).json({ error: 'Contraseña débil', detail: 'Mínimo 8 caracteres, al menos 1 número y 1 símbolo' });

    const nErr = isRealName(nombre);
    const aErr = isRealName(apellido);
    if (nErr || aErr)
      return res.status(400).json({ error: 'Nombre/apellido inválidos', detail: nErr || aErr });

    // Evitar duplicados por correo
    const [exists] = await pool.execute(
      'SELECT id_usuario, nombre_usuario, apellido_usuario FROM usuario_sistema WHERE correo_usuario=?',
      [correo]
    );
    if (exists.length) {
      const found = exists[0];
      const full = [found.nombre_usuario, found.apellido_usuario].filter(Boolean).join(' ').trim();
      return res.status(409).json({
        error: 'Correo ya registrado',
        detail: full ? `El correo ya pertenece a: ${full}` : 'El correo ya está en uso'
      });
    }

    const hash = await bcrypt.hash(password, 10);

    // Insert directo
    const [ins] = await pool.execute(
      'INSERT INTO usuario_sistema (nombre_usuario, apellido_usuario, `contraseña_usuario`, correo_usuario) VALUES (?,?,?,?)',
      [nombre.trim(), apellido.trim(), hash, correo.trim().toLowerCase()]
    );
    const idGenerado = ins.insertId;

    // Rol por defecto si existe
    try {
      const [r] = await pool.execute(
        'SELECT id_rol FROM rol WHERE LOWER(nombre_rol)=LOWER(?)',
        ['estudiante']
      );
      if (r.length) {
        await pool.execute('INSERT INTO usuario_rol (id_usuario, id_rol) VALUES (?,?)', [idGenerado, r[0].id_rol]);
      }
    } catch {}

    return res.status(201).json({ ok: true, id_usuario: idGenerado, correo: correo.trim().toLowerCase() });
  } catch (e) {
    console.error(' Error en registerUser:', e);
    return res.status(500).json({ error: 'Error al registrar usuario', detail: e.message });
  }
};

// Login (2FA obligatorio; TOTP u OTP por email)
const loginUser = async (req, res) => {
  try {
    const dbp = db.promise();
    const { correo, password } = req.body || {};
    if (!correo || !password)
      return res.status(400).json({ error: 'Faltan campos', detail: 'correo y password son requeridos' });

    const { ip } = getClientMeta(req);
    if (isBlocked(correo, ip)) {
      return res.status(429).json({ error: 'Demasiados intentos', detail: 'Intenta de nuevo más tarde' });
    }

    // CAMBIO: validar con MX
    const ev = await validateEmailServer(correo);
    if (!ev.ok) return res.status(400).json({ error: 'Correo inválido', detail: ev.msg });

    // ROBUSTO: SELECT condicional si no existe two_factor_secret
    let rows;
    try {
      [rows] = await dbp.execute(
        'SELECT id_usuario, `contraseña_usuario` AS pwd, two_factor_secret, nombre_usuario, apellido_usuario FROM usuario_sistema WHERE correo_usuario=?',
        [correo]
      );
    } catch {
      [rows] = await dbp.execute(
        'SELECT id_usuario, `contraseña_usuario` AS pwd, nombre_usuario, apellido_usuario FROM usuario_sistema WHERE correo_usuario=?',
        [correo]
      );
    }
    if (!rows.length) {
      await safeLogLogin(dbp, 0, false, req);
      registerFail(correo, ip);
      return res.status(401).json({ error: 'Credenciales inválidas', detail: 'Usuario no encontrado' });
    }

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.pwd);
    await safeLogLogin(dbp, user.id_usuario, !!ok, req);
    if (!ok) {
      registerFail(correo, ip);
      return res.status(401).json({ error: 'Credenciales inválidas', detail: 'Contraseña incorrecta' });
    }
    clearFails(correo, ip);

    try { await dbp.execute('UPDATE usuario_sistema SET ultimo_acceso=NOW() WHERE id_usuario=?', [user.id_usuario]); } catch {}

    const [rolesRows] = await dbp.execute(
      `SELECT r.nombre_rol
       FROM usuario_rol ur
       JOIN rol r ON r.id_rol = ur.id_rol
       WHERE ur.id_usuario=?`,
      [user.id_usuario]
    );
    const roles = rolesRows.map(r => String(r.nombre_rol).toLowerCase());

    // Enforce 2FA (TOTP si speakeasy; de lo contrario OTP por correo si USE_EMAIL_2FA=1)
    if (REQUIRE_2FA && !speakeasy && !USE_EMAIL_2FA) {
      return res.status(503).json({
        error: '2FA requerido',
        detail: 'La política exige 2FA y no hay TOTP ni OTP por correo habilitado.'
      });
    }

    // Flujo TOTP (si speakeasy disponible y no se fuerza OTP email)
    if (REQUIRE_2FA && speakeasy && !USE_EMAIL_2FA) {
      const hasColumn = true; // ensureUser2FASecret ya valida columna
      const info = await ensureUser2FASecret(dbp, user.id_usuario);
      const tempToken = require('crypto').randomBytes(24).toString('hex');
      pending2FA.set(tempToken, { id_usuario: user.id_usuario, secret: info.secret, roles, correo, type: 'totp' });
      if (pending2FA.size > 300) {
        for (const k of Array.from(pending2FA.keys()).slice(0, 50)) pending2FA.delete(k);
      }
      if (info.otpauth) {
        return res.json({
          ok: true,
          twoFactorSetup: true,
          tempToken,
          secret: info.secret,
          otpauth: info.otpauth,
          message: 'Configura tu app TOTP y verifica el primer código para activar 2FA.'
        });
      }
      return res.json({
        ok: true,
        requires2FA: true,
        tempToken,
        message: 'Se requiere código 2FA (TOTP)',
        roles
      });
    }

    // Flujo OTP por correo (fallback o forzado por USE_EMAIL_2FA)
    if (REQUIRE_2FA && (USE_EMAIL_2FA || !speakeasy)) {
      const code = String(Math.floor(100000 + Math.random() * 900000)); // 6 dígitos
      const sent = await sendEmailOtp(correo, code);
      const tempToken = require('crypto').randomBytes(24).toString('hex');
      const exp = Date.now() + 5 * 60 * 1000; // CAMBIO: 5 min
      pending2FA.set(tempToken, { id_usuario: user.id_usuario, roles, correo, type: 'email', code, exp });
      if (pending2FA.size > 300) {
        for (const k of Array.from(pending2FA.keys()).slice(0, 50)) pending2FA.delete(k);
      }
      return res.json({
        ok: true,
        requires2FAEmail: true,
        tempToken,
        message: sent ? 'Se envió un código a tu correo' : 'Código generado. Contacta al admin si no lo recibes.'
      });
    }

    // Si 2FA no es requerido
    const payload = { id_usuario: user.id_usuario, correo, roles, nombre: user.nombre_usuario || '', apellido: user.apellido_usuario || '' };
    const accessToken = signAccess(payload);
    const refreshToken = signRefresh({ id_usuario: user.id_usuario });
    const cookieOpts = { httpOnly: true, sameSite: 'strict', secure: process.env.COOKIE_SECURE === '1', maxAge: REFRESH_TTL_SEC * 1000, path: '/' };
    res.cookie('rt', refreshToken, cookieOpts);
    return res.json({ ok: true, user: payload, accessToken });
  } catch (e) {
    console.error(' Error en loginUser:', e);
    return res.status(500).json({ error: 'Error en login', detail: e.message });
  }
};

// === NUEVO: Rehidratar sesión (access o refresh) ===
const me = async (req, res) => {
  try {
    const dbp = db.promise();
    const auth = req.headers.authorization || '';
    const now = Date.now();

    // 1) Si hay access token válido, responder user directo
    if (auth.startsWith('Bearer ')) {
      try {
        const token = auth.slice(7);
        const decoded = jwt.verify(token, ACCESS_SECRET);
        const [rolesRows] = await dbp.execute(
          `SELECT r.nombre_rol
           FROM usuario_rol ur
           JOIN rol r ON r.id_rol = ur.id_rol
           WHERE ur.id_usuario=?`,
          [decoded.id_usuario]
        );
        const roles = rolesRows.map(r => String(r.nombre_rol).toLowerCase());
        const user = { id_usuario: decoded.id_usuario, correo: decoded.correo || '', roles };
        return res.json({ ok: true, user, accessToken: token, source: 'access' });
      } catch {}
    }

    // 2) Si no hay access válido, intentar refresh cookie (y verificar inactividad)
    const rt = req.cookies?.rt;
    if (!rt) return res.status(401).json({ error: 'No autenticado', detail: 'Falta token' });

    let decoded;
    try {
      decoded = jwt.verify(rt, REFRESH_SECRET);
    } catch {
      return res.status(401).json({ error: 'No autenticado', detail: 'Refresh inválido' });
    }

    const lastTs = getLastActivityTs(decoded.id_usuario);
    if (lastTs && now - lastTs > MAX_IDLE_MS) {
      try { res.clearCookie('rt', { httpOnly: true, sameSite: 'strict', secure: process.env.COOKIE_SECURE === '1', path: '/' }); } catch {}
      return res.status(401).json({ error: 'Sesión expirada por inactividad' });
    }

    const [rolesRows] = await dbp.execute(
      `SELECT r.nombre_rol
       FROM usuario_rol ur
       JOIN rol r ON r.id_rol = ur.id_rol
       WHERE ur.id_usuario=?`,
      [decoded.id_usuario]
    );
    const roles = rolesRows.map(r => String(r.nombre_rol).toLowerCase());
    const payload = { id_usuario: decoded.id_usuario, correo: decoded.correo || '', roles };
    const accessToken = signAccess(payload);
    return res.json({ ok: true, user: payload, accessToken, source: 'refresh' });
  } catch (e) {
    console.error(' Error en /auth/me:', e);
    return res.status(500).json({ error: 'Error rehidratando sesión' });
  }
};

// === REINCORPORADO: refreshAccessToken ===
const refreshAccessToken = async (req, res) => {
  try {
    const token = req.cookies?.rt || req.body?.refreshToken;
    if (!token) return res.status(401).json({ error: 'Refresh token requerido' });

    let decoded;
    try {
      decoded = jwt.verify(token, REFRESH_SECRET);
    } catch {
      return res.status(401).json({ error: 'Refresh token inválido' });
    }

    // NUEVO: denegar refresh si excede inactividad
    const lastTs = getLastActivityTs(decoded.id_usuario);
    const now = Date.now();
    if (lastTs && now - lastTs > MAX_IDLE_MS) {
      try { res.clearCookie('rt'); } catch {}
      return res.status(401).json({ error: 'Sesión expirada por inactividad' });
    }

    const dbp = db.promise();
    const [rolesRows] = await dbp.execute(
      `SELECT r.nombre_rol
       FROM usuario_rol ur
       JOIN rol r ON r.id_rol = ur.id_rol
       WHERE ur.id_usuario=?`,
      [decoded.id_usuario]
    );
    const roles = rolesRows.map(r => String(r.nombre_rol).toLowerCase());
    const payload = { id_usuario: decoded.id_usuario, correo: decoded.correo || '', roles };
    const accessToken = signAccess(payload);
    return res.json({ ok: true, accessToken });
  } catch (e) {
    console.error(' Error en refreshAccessToken:', e);
    return res.status(500).json({ error: 'Error al refrescar token' });
  }
};

// Reemplazar verify2FA: acepta TOTP o OTP por correo
const verify2FA = async (req, res) => {
  try {
    const { tempToken, code } = req.body || {};
    if (!tempToken || !code) return res.status(400).json({ error: 'tempToken y code requeridos' });
    const record = pending2FA.get(tempToken);
    if (!record) return res.status(401).json({ error: 'Sesión 2FA expirada o inválida' });

    const { id_usuario, secret, roles, correo, type, exp } = record;

    if (type === 'email') {
      if (exp && Date.now() > exp) {
        pending2FA.delete(tempToken);
        return res.status(401).json({ error: 'Código 2FA expirado' });
      }
      const ok = String(code).trim() === String(record.code);
      if (!ok) return res.status(401).json({ error: 'Código 2FA incorrecto' });
    } else {
      if (!speakeasy) return res.status(501).json({ error: '2FA TOTP no disponible en el servidor' });
      const verified = speakeasy.totp.verify({ secret, encoding: 'base32', token: String(code).replace(/\s+/g, '') });
      if (!verified) return res.status(401).json({ error: 'Código 2FA incorrecto' });
    }

    pending2FA.delete(tempToken);
    const payload = { id_usuario, correo, roles };
    const accessToken = signAccess(payload);
    const refreshToken = signRefresh({ id_usuario });
    const cookieOpts = { httpOnly: true, sameSite: 'strict', secure: process.env.COOKIE_SECURE === '1', maxAge: REFRESH_TTL_SEC * 1000, path: '/' };
    res.cookie('rt', refreshToken, cookieOpts);
    return res.json({ ok: true, user: payload, accessToken });
  } catch (e) {
    console.error(' Error en verify2FA:', e);
    return res.status(500).json({ error: 'Error verificando 2FA' });
  }
};

// Ajustar logout para limpiar cookie
const logout = async (_req, res) => {
  try {
    // NUEVO: limpiar con mismas opciones (path/flags)
    res.clearCookie('rt', {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.COOKIE_SECURE === '1',
      path: '/'
    });
  } catch {}
  return res.json({ ok: true });
};

// NUEVO: solicitud de restablecimiento por correo (enlace con token)
const forgotPassword = async (req, res) => {
  try {
    const { correo } = req.body || {};
    if (!correo) return res.status(400).json({ error: 'Correo requerido' });
    const pool = db.promise();
    const [rows] = await pool.execute(
      'SELECT id_usuario FROM usuario_sistema WHERE correo_usuario=?',
      [correo]
    );
    // Respuesta explícita solicitada: correo no registrado
    if (!rows.length) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[RESET] Correo no encontrado en BD: ${correo}`);
      }
      return res.status(404).json({
        error: 'Correo no registrado',
        detail: 'No encontramos una cuenta asociada a este correo.'
      });
    }
    const id_usuario = rows[0].id_usuario;
    const token = require('crypto').randomBytes(24).toString('hex');
    const exp = Date.now() + 15 * 60 * 1000; // 15 min
    pwdResetTokens.set(token, { id_usuario, exp });
    // Limpiar basura si creciera
    if (pwdResetTokens.size > 300) {
      for (const k of Array.from(pwdResetTokens.keys()).slice(0, 50)) pwdResetTokens.delete(k);
    }
    const origin = process.env.FRONTEND_ORIGIN || req.headers.origin || 'http://localhost:3000';
    const resetUrl = `${origin.replace(/\/+$/,'')}/forgot-password?t=${token}`;
    try {
      console.log('[RESET] Enviando enlace a:', correo, '→', resetUrl);
      await sendResetEmail(correo, resetUrl);
      console.log('[RESET] Enlace enviado OK a:', correo);
    } catch (e) {
      console.error('[RESET] Falló envío de correo:', e.message);
      if (process.env.NODE_ENV !== 'production') console.log('[RESET][DEV] URL:', resetUrl);
    }
    // En desarrollo, facilita pruebas devolviendo la URL (no en producción)
    if (process.env.NODE_ENV !== 'production') {
      return res.json({
        ok: true,
        message: 'Se envió un enlace de restablecimiento.',
        devLink: resetUrl,
        expiresInMin: 15
      });
    }
    return res.json({ ok: true, message: 'Se envió un enlace de restablecimiento.', expiresInMin: 15 });
  } catch (e) {
    console.error(' Error en forgotPassword:', e);
    return res.status(500).json({ error: 'Error en forgot-password' });
  }
};

// NUEVO: aplicar restablecimiento con token
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body || {};
    if (!token || !password) return res.status(400).json({ error: 'token y password requeridos' });
    // Validar token
    const rec = pwdResetTokens.get(token);
    if (!rec) return res.status(400).json({ error: 'Token inválido o expirado' });
    if (Date.now() > rec.exp) { pwdResetTokens.delete(token); return res.status(400).json({ error: 'Token expirado' }); }
    // Validar contraseña fuerte
    if (!isStrongPassword(password)) {
      return res.status(400).json({ error: 'Contraseña débil', detail: 'Mínimo 8 caracteres, al menos 1 número y 1 símbolo' });
    }
    // Actualizar hash
    const pool = db.promise();
    const hash = await bcrypt.hash(password, 10);
    await pool.execute(
      'UPDATE usuario_sistema SET `contraseña_usuario`=? WHERE id_usuario=?',
      [hash, rec.id_usuario]
    );
    pwdResetTokens.delete(token);
    // Opcional: invalidar refresh cookie (si la hubiera en el navegador actual)
    try { /* sin-op */ } catch {}
    return res.json({ ok: true, message: 'Contraseña actualizada. Ya puedes iniciar sesión.' });
  } catch (e) {
    console.error(' Error en resetPassword:', e);
    return res.status(500).json({ error: 'Error al restablecer contraseña' });
  }
};

// === FIN BLOQUE 2FA ===

// Asegúrate de que en module.exports esté esta versión de loginUser y NO otra duplicada
module.exports = {
  registerUser,
  loginUser,
  refreshAccessToken,
  forgotPassword,
  resetPassword,
  verify2FA,
  logout,
  me,
  getTramites,
  createTramite,
  updateTramite,
  deleteTramite,
  listTables,
  getTableColumns,
  getTableRows,
  insertRowInTable,
  ensureCoreTables
};