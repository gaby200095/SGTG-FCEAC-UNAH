// routes/expedientes.js
const express = require('express');
const pool = require('../config/database');
const router = express.Router();

// POST /api/expedientes
router.post('/', async (req, res) => {
  const { carrera, año_ingreso, numero_cuenta } = req.body;

  if (!carrera || !año_ingreso || !numero_cuenta) {
    return res.status(400).json({ error: 'Faltan datos: carrera, año_ingreso o numero_cuenta' });
  }

  let connection;
  try {
    connection = await pool.promise().getConnection();

    // 1. Buscar al estudiante por número de cuenta (que es id_estudiante)
    const [estudiantes] = await connection.query(
      'SELECT id_estudiante, nombre_estudiante, apellido_estudiante FROM estudiante WHERE id_estudiante = ?',
      [numero_cuenta]
    );

    if (estudiantes.length === 0) {
      return res.status(404).json({ error: 'Estudiante no encontrado. Verifica el número de cuenta.' });
    }

    const { id_estudiante, nombre_estudiante, apellido_estudiante } = estudiantes[0];

    // 2. Verificar si ya existe un expediente
    const [expedientesExistentes] = await connection.query(
      'SELECT id_expediente FROM expediente_digital WHERE id_estudiante = ?',
      [id_estudiante]
    );

    if (expedientesExistentes.length > 0) {
      return res.status(409).json({ error: 'El expediente ya ha sido creado para este estudiante.' });
    }

    // 3. Mapear carrera a id_carrera
    let id_carrera;
    switch (carrera.trim().toUpperCase()) {
      case 'LIA':
      case 'INFORMÁTICA ADMINISTRATIVA':
      case 'INFORMATICA ADMINISTRATIVA':
        id_carrera = 9;
        break;
      case 'LAA':
      case 'ADMINISTRACION ADUANERA':
      case 'ADMINISTARCION ADUANERA':
        id_carrera = 1;
        break;
      case 'LCI':
      case 'COMERCIO INTERNACIONAL':
      case 'COMERCIO INETRNACIONAL':
        id_carrera = 6;
        break;
      default:
        return res.status(400).json({ error: 'Carrera no válida. Usa: INF, ADU, ECO o el nombre completo.' });
    }

    // 4. INSERT SIN 'numero_cuenta' (no existe en la tabla)
    const [result] = await connection.query(
      `INSERT INTO expediente_digital 
       (id_estudiante, id_carrera, id_estado_expediente, fecha_creacion_expediente, carrera, año_ingreso) 
       VALUES (?, ?, 1, NOW(), ?, ?)`,
      [id_estudiante, id_carrera, carrera, año_ingreso]
    );

    // 5. Responder con éxito
    res.status(201).json({
      success: true,
      message: 'Expediente creado exitosamente',
      data: {
        id_expediente: result.insertId,
        estudiante: {
          id_estudiante,
          nombre_completo: `${nombre_estudiante} ${apellido_estudiante}`,
          numero_cuenta: id_estudiante // porque es lo mismo
        },
        carrera,
        año_ingreso
      }
    });

  } catch (error) {
    console.error('Error al crear expediente:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
    if (connection) connection.release();
  }
});

// GET /api/expedientes
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.promise().query(
      `SELECT 
          e.id_expediente,
          e.carrera,
          e.año_ingreso,
          e.id_estudiante AS numero_cuenta,
          CONCAT(est.nombre_estudiante, ' ', est.apellido_estudiante) AS nombre_completo
       FROM expediente_digital e
       JOIN estudiante est ON e.id_estudiante = est.id_estudiante
       ORDER BY e.fecha_creacion_expediente DESC`
    );
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener expedientes:', error);
    res.status(500).json({ error: 'Error interno' });
  }
});

module.exports = router;
