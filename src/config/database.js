const mysql = require('mysql2');
require('dotenv').config();

// Pool de conexiones (callbacks habilitados)
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'srv487.hstgr.io',
  user: process.env.DB_USER || 'u937135973_fceac',
  password: process.env.DB_PASSWORD || 'fceac_2025UNAH',
  database: process.env.DB_NAME || 'u937135973_fceac',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Verificación temprana del pool
pool.getConnection((err, conn) => {
  if (err) {
    console.error(' Error al conectar a la BD (pool):', err);
    return;
  }
  console.log(' Conexión al pool MySQL establecida correctamente');
  conn.release();
});

// Nota: para usar async/await en controladores, invocar: const dbp = require('./database').promise();
module.exports = pool;


