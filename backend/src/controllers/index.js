// Este archivo exporta funciones que manejan la lógica de negocio para las rutas definidas.
const db = require('../config/database');

// NUEVO: dependencias para auth básica (fallback a bcryptjs)
let bcrypt;
try { bcrypt = require('bcrypt'); } catch { bcrypt = require('bcryptjs'); }
const jwt = require('jsonwebtoken');
let speakeasy;
try { speakeasy = require('speakeasy'); } catch { speakeasy = null; } // 2FA opcional

const ACCESS_SECRET = process.env.JWT_SECRET || 'dev_access_secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret';
const ACCESS_TTL = process.env.JWT_ACCESS_TTL || '15m';
const REFRESH_TTL_SEC = 7 * 24 * 3600; // 7 días

const signAccess = (payload) => jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_TTL });
const signRefresh = (payload) => jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_TTL_SEC });

// Helper: IP/UA (siempre no nulos)
const getClientMeta = (req) => {
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || '0.0.0.0';
  const ua = req.headers['user-agent'] || 'unknown';
  return { ip, ua };
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

// NUEVO: crea una fila en solicitud con valores mínimos deducidos, devuelve insertId
const insertSolicitudMinimal = async (conn) => {
  // Leer columnas de la tabla 'solicitud'
  const [cols] = await conn.execute(`
    SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_KEY, EXTRA
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'solicitud'
    ORDER BY ORDINAL_POSITION
  `);

  if (!cols.length) throw new Error('Tabla solicitud no existe');

  // Verificar PK auto_increment
  const pk = cols.find(c => c.COLUMN_KEY === 'PRI');
  const autoInc = pk && String(pk.EXTRA || '').toLowerCase().includes('auto_increment');
  if (!pk || pk.COLUMN_NAME !== 'id_usuario' || !autoInc) {
    const err = new Error('solicitud.id_usuario no es AUTO_INCREMENT');
    err.code = 'NO_AUTOINC';
    throw err;
  }

  // Construir INSERT con mínimas columnas requeridas (excluye PK)
  const insertCols = [];
  const placeholders = [];
  const values = [];
  cols.forEach(c => {
    if (c.COLUMN_NAME === 'id_usuario') return; // excluir PK
    const val = defaultForType(c);
    if (val === null && c.IS_NULLABLE === 'YES') return; // no incluir columna nullable si es null
    insertCols.push(c.COLUMN_NAME);
    placeholders.push('?');
    values.push(val);
  });

  const sql = insertCols.length
    ? `INSERT INTO solicitud (${insertCols.map(()=> '??').join(', ')}) VALUES (${placeholders.join(', ')})`
    : 'INSERT INTO solicitud () VALUES ()';

  if (insertCols.length) {
    const [ins] = await conn.query(sql, [...insertCols, ...values]);
    return ins.insertId;
  } else {
    const [ins] = await conn.execute(sql);
    return ins.insertId;
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

// Registro de usuario (2 pasos si la FK exige que solicitud.id_usuario exista primero)
const registerUser = async (req, res) => {
  const pool = db.promise();
  try {
    const { correo, password, nombre = '', apellido = '' } = req.body || {};
    if (!correo || !password) {
      return res.status(400).json({ error: 'correo y password son requeridos' });
    }

    // Evitar duplicados por correo
    const [exists] = await pool.execute('SELECT id_usuario FROM usuario_sistema WHERE correo_usuario=?', [correo]);
    if (exists.length) return res.status(409).json({ error: 'Correo ya registrado' });

    // Detectar trySolicitud desde query o body
    const trySolicitud = String((req.query.trySolicitud ?? req.body.trySolicitud) || '').trim() === '1';

    // Ver si existe la tabla solicitud
    const [trows] = await pool.execute("SHOW TABLES LIKE 'solicitud'");
    const solicitudExiste = trows.length > 0;

    const hash = await bcrypt.hash(password, 10);

    if (!trySolicitud) {
      // Camino normal: insertar directamente
      const [ins] = await pool.execute(
        'INSERT INTO usuario_sistema (nombre_usuario, apellido_usuario, `contraseña_usuario`, correo_usuario) VALUES (?,?,?,?)',
        [nombre, apellido, hash, correo]
      );
      const idGenerado = ins.insertId;

      // Rol por defecto si existe
      const [r] = await pool.execute('SELECT id_rol FROM rol WHERE LOWER(nombre_rol)=LOWER(?)', ['estudiante']);
      if (r.length) {
        await pool.execute('INSERT INTO usuario_rol (id_usuario, id_rol) VALUES (?,?)', [idGenerado, r[0].id_rol]);
      }

      return res.status(201).json({ ok: true, id_usuario: idGenerado, correo });
    }

    // Modo 2 pasos con transacción
    if (!solicitudExiste) {
      return res.status(409).json({
        error: 'No se puede registrar por restricción de llave foránea',
        detail: 'Se solicitó trySolicitud=1 pero la tabla solicitud no existe.',
        hint: 'Cree/valide la tabla solicitud o quite trySolicitud.'
      });
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // 1) Insert minimal en solicitud (obtiene id_usuario)
      const nuevoId = await insertSolicitudMinimal(conn);

      // 2) Insert usuario con ese id
      await conn.execute(
        'INSERT INTO usuario_sistema (id_usuario, nombre_usuario, apellido_usuario, `contraseña_usuario`, correo_usuario) VALUES (?,?,?,?,?)',
        [nuevoId, nombre, apellido, hash, correo]
      );

      // 3) Rol por defecto
      const [r] = await conn.execute('SELECT id_rol FROM rol WHERE LOWER(nombre_rol)=LOWER(?)', ['estudiante']);
      if (r.length) {
        await conn.execute('INSERT INTO usuario_rol (id_usuario, id_rol) VALUES (?,?)', [nuevoId, r[0].id_rol]);
      }

      await conn.commit();
      conn.release();
      return res.status(201).json({ ok: true, id_usuario: nuevoId, correo });
    } catch (e2) {
      try { await conn.rollback(); conn.release(); } catch {}
      // Mensaje claro si no se pudo deducir/inserir en solicitud (campos obligatorios, etc.)
      return res.status(409).json({
        error: 'No se puede registrar por restricción de llave foránea',
        detail: 'La FK exige que solicitud(id_usuario) exista y solicitud requiere campos no deducibles automáticamente.',
        hint: 'Inserte manualmente la fila en solicitud (con los campos obligatorios) y reintente sin trySolicitud, o pida ajustar la FK.'
      });
    }

  } catch (e) {
    if (e && e.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(409).json({
        error: 'No se puede registrar por restricción de llave foránea',
        detail: 'usuario_sistema.id_usuario referencia solicitud(id_usuario). Debe existir la fila relacionada.',
        hint: 'Reintente con ?trySolicitud=1 (si es posible) o cree primero la fila en solicitud.'
      });
    }
    console.error(' Error en registerUser:', e);
    return res.status(500).json({ error: 'Error al registrar usuario', detail: e.message });
  }
};

// Login (emite access + refresh token)
const loginUser = async (req, res) => {
  try {
    const dbp = db.promise();
    const { correo, password } = req.body || {};
    if (!correo || !password)
      return res.status(400).json({ error: 'correo y password son requeridos' });

    let rows;
    try {
      [rows] = await dbp.execute(
        'SELECT id_usuario, `contraseña_usuario` AS pwd, two_factor_secret FROM usuario_sistema WHERE correo_usuario=?',
        [correo]
      );
    } catch {
      [rows] = await dbp.execute(
        'SELECT id_usuario, `contraseña_usuario` AS pwd FROM usuario_sistema WHERE correo_usuario=?',
        [correo]
      );
    }
    if (!rows.length) return res.status(401).json({ error: 'Credenciales inválidas' });

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.pwd);
    await safeLogLogin(dbp, user.id_usuario, !!ok, req);
    if (!ok) return res.status(401).json({ error: 'Credenciales inválidas' });

    try { await dbp.execute('UPDATE usuario_sistema SET ultimo_acceso=NOW() WHERE id_usuario=?', [user.id_usuario]); } catch {}

    const [rolesRows] = await dbp.execute(
      `SELECT r.nombre_rol
       FROM usuario_rol ur
       JOIN rol r ON r.id_rol = ur.id_rol
       WHERE ur.id_usuario=?`,
      [user.id_usuario]
    );
    const roles = rolesRows.map(r => String(r.nombre_rol).toLowerCase());

    const enable2fa = String(req.query.enable2fa || '').trim() === '1';
    const hasSecretMemory = userSecretsMem.has(user.id_usuario);
    const hasSecretDB = !!user.two_factor_secret;
    const twoFactorAlready = (hasSecretMemory || hasSecretDB) && !!speakeasy;

    if (enable2fa && speakeasy) {
      const info = await ensureUser2FASecret(dbp, user.id_usuario);
      return res.json({
        ok: true,
        twoFactorSetup: true,
        secret: info.secret,
        otpauth: info.otpauth,
        message: 'Se generó un secreto 2FA. Configura tu app y vuelve a iniciar sesión.'
      });
    }

    if (twoFactorAlready && speakeasy) {
      const info = await ensureUser2FASecret(dbp, user.id_usuario);
      const tempToken = require('crypto').randomBytes(24).toString('hex');
      pending2FA.set(tempToken, { id_usuario: user.id_usuario, secret: info.secret, roles, correo });
      if (pending2FA.size > 300) {
        for (const k of Array.from(pending2FA.keys()).slice(0, 50)) pending2FA.delete(k);
      }
      return res.json({
        ok: true,
        requires2FA: true,
        tempToken,
        message: 'Se requiere código 2FA',
        roles
      });
    }

    const payload = { id_usuario: user.id_usuario, correo, roles };
    const accessToken = signAccess(payload);
    const refreshToken = signRefresh({ id_usuario: user.id_usuario });
    res.cookie('rt', refreshToken, {
      httpOnly: true, sameSite: 'lax', secure: false, maxAge: REFRESH_TTL_SEC * 1000
    });
    return res.json({ ok: true, user: payload, accessToken });

  } catch (e) {
    console.error(' Error en loginUser:', e);
    return res.status(500).json({ error: 'Error en login', detail: e.message });
  }
};

// === REINCORPORADO: refreshAccessToken (faltaba y causaba ReferenceError) ===
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

// Reemplazar verify2FA
const verify2FA = async (req, res) => {
  try {
    if (!speakeasy) return res.status(501).json({ error: '2FA no habilitado en servidor (speakeasy no instalado)' });
    const { tempToken, code } = req.body || {};
    if (!tempToken || !code) return res.status(400).json({ error: 'tempToken y code requeridos' });
    const record = pending2FA.get(tempToken);
    if (!record) return res.status(401).json({ error: 'Sesión 2FA expirada o inválida' });

    const { id_usuario, secret, roles, correo } = record;
    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: String(code).replace(/\s+/g, '')
    });
    if (!verified) return res.status(401).json({ error: 'Código 2FA incorrecto' });

    pending2FA.delete(tempToken);
    const payload = { id_usuario, correo, roles };
    const accessToken = signAccess(payload);
    const refreshToken = signRefresh({ id_usuario });

    res.cookie('rt', refreshToken, {
      httpOnly: true, sameSite: 'lax', secure: false, maxAge: REFRESH_TTL_SEC * 1000
    });
    return res.json({ ok: true, user: payload, accessToken });
  } catch (e) {
    console.error(' Error en verify2FA:', e);
    return res.status(500).json({ error: 'Error verificando 2FA' });
  }
};

// Ajustar logout para limpiar cookie
const logout = async (_req, res) => {
  try {
    res.clearCookie('rt');
  } catch {}
  return res.json({ ok: true });
};

// Stubs para evitar 404
const forgotPassword = async (req, res) => {
  try {
    const { correo } = req.body || {};
    console.log(`[RESET] Solicitud para: ${correo || '(sin correo)'}`);
    return res.json({ ok: true, message: 'Si el correo existe, se envió un enlace de restablecimiento.' });
  } catch (e) {
    return res.status(500).json({ error: 'Error en forgot-password' });
  }
};

// === BLOQUE 2FA (AGREGADO) ===
const pending2FA = global.__pending2FA || new Map();
global.__pending2FA = pending2FA;

const userSecretsMem = global.__userSecretsMem || new Map();
global.__userSecretsMem = userSecretsMem;

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

  const [r] = await dbp.execute(
    'SELECT two_factor_secret FROM usuario_sistema WHERE id_usuario=?',
    [id_usuario]
  );
  if (r.length && r[0].two_factor_secret) {
    return { secret: r[0].two_factor_secret, otpauth: null, storedInDB: true };
  }

  const gen = speakeasy.generateSecret({ length: 20, name: 'SGTG-FCEAC-UNAH' });
  await dbp.execute(
    'UPDATE usuario_sistema SET two_factor_secret=? WHERE id_usuario=?',
    [gen.base32, id_usuario]
  );
  return { secret: gen.base32, otpauth: gen.otpauth_url, storedInDB: true };
};
// === FIN BLOQUE 2FA ===

// Asegúrate de que en module.exports esté esta versión de loginUser y NO otra duplicada
module.exports = {
  registerUser,
  loginUser,
  refreshAccessToken,
  forgotPassword,
  verify2FA,
  logout,
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