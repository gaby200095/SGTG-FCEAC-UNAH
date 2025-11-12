const express = require('express');
const router = express.Router();
const { getTramites, createTramite, listTables, getTableColumns, getTableRows, insertRowInTable, ensureCoreTables, registerUser, loginUser, refreshAccessToken, forgotPassword, verify2FA, logout } = require('../controllers/index');
const db = require('../config/database'); // <- Importar la conexión a la BD

// NUEVO: sub-routers de autenticación, usuarios y expedientes
const usersRouter = require('./users');
const expedientesRouter = require('./expedientes');

// NUEVO: Auth básica (registro y login)
router.post('/auth/register', registerUser);
router.post('/auth/login', loginUser);
router.post('/auth/2fa-verify', verify2FA);
router.post('/auth/refresh', refreshAccessToken); // NUEVO
router.post('/auth/forgot-password', forgotPassword);
router.post('/auth/logout', logout);

// Rutas para los trámites
router.get('/tramites', getTramites);
router.post('/tramites', createTramite);

// Rutas genéricas para consultar tus tablas existentes
router.get('/db/tables', listTables);                // Lista de tablas
router.get('/table/:name/columns', getTableColumns); // Columnas de una tabla
router.get('/table/:name', getTableRows);            // Filas con paginación/orden
router.post('/table/:name', insertRowInTable);       // Insertar una fila

// Verificar/crear tablas base (opcional)
router.post('/db/ensure-core', ensureCoreTables);

// Endpoint de landing: devolver fallback sin tocar BD
router.get('/landing', (req, res) => {
  const fallback = {
    titulo: 'Bienvenido al Sistema de Gestión de Trámites de Graduación',
    descripcion: 'En nuestra página podrás gestionar todo tu proceso de graduación de manera rápida y sencilla, sin complicaciones.',
    beneficios: [
      'Inicia solicitudes y carga documentos desde un solo lugar.',
      'Consulta requisitos y estados de tus procesos en tiempo real.',
      'Recibe notificaciones y recordatorios oportunos.'
    ]
  };
  return res.json(fallback);
});

// NUEVO: montar módulos
router.use('/users', usersRouter);
router.use('/expedientes', expedientesRouter);

module.exports = router;