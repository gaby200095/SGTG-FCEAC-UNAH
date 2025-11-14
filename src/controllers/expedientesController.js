// src/controllers/expedientes.js
const db = require('../config/database');

/**
 * Crear un nuevo expediente en la tabla `expediente_digital`
 * Espera en req.body: { carrera, año_ingreso, numero_cuenta }
 */
const crearExpediente = (req, res) => {
  const { carrera, año_ingreso, numero_cuenta } = req.body;

  // Validación de campos obligatorios
  if (!carrera || !año_ingreso || !numero_cuenta) {
    return res.status(400).json({
      error: 'Faltan campos obligatorios: carrera, año_ingreso, numero_cuenta'
    });
  }

  // Convertir año_ingreso a número si viene como string
  const añoIngresoNum = parseInt(año_ingreso, 10);
  if (isNaN(añoIngresoNum) || añoIngresoNum < 1900 || añoIngresoNum > 2100) {
    return res.status(400).json({ error: 'Año de ingreso inválido' });
  }

  // Definir valores para la inserción
  const id_estudiante = numero_cuenta; // Usamos numero_cuenta como id_estudiante
  const id_estado_expediente = 1; // Suponemos que 1 = "activo" o "pendiente"
  const fecha_creacion_expediente = new Date().toISOString().slice(0, 19).replace('T', ' '); // Formato MySQL DATETIME

  const query = `
    INSERT INTO expediente_digital (
      id_estudiante,
      id_carrera,
      id_estado_expediente,
      fecha_creacion_expediente,
      carrera,
      año_ingreso,
      numero_cuenta
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  // Nota: id_carrera lo dejamos como NULL por ahora (ya que no lo envía el frontend)
  // Si más adelante usas id_carrera, deberás mapear el nombre a un ID
  const values = [
    id_estudiante,
    null, // id_carrera (opcional, puedes omitir si no lo usas)
    id_estado_expediente,
    fecha_creacion_expediente,
    carrera,
    año_ingreso,
    numero_cuenta
  ];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error('Error al crear expediente:', err);
      return res.status(500).json({ error: 'No se pudo crear el expediente en la base de datos' });
    }

    // Respuesta con el expediente creado
    const nuevoExpediente = {
      id_expediente: result.insertId,
      id_estudiante,
      carrera,
      año_ingreso: añoIngresoNum,
      numero_cuenta,
      id_estado_expediente,
      fecha_creacion_expediente
    };

    res.status(201).json(nuevoExpediente);
  });
};

/**
 * Obtener todos los expedientes (solo para pruebas o admins)
 */
const obtenerExpedientes = (req, res) => {
  const query = 'SELECT * FROM expediente_digital ORDER BY fecha_creacion_expediente DESC';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener expedientes:', err);
      return res.status(500).json({ error: 'Error en la base de datos' });
    }
    res.json(results);
  });
};

/**
 * Listar expedientes según el rol del usuario (simulado o real)
 * NOTA: Esta función actualmente usa datos simulados.
 * Si deseas usar datos reales, reemplaza la lógica.
 */
const listByRole = (req, res) => {
  const roles = req.user?.roles || [];
  const id_estudiante = req.user?.numero_cuenta; // Asumimos que el usuario tiene su número de cuenta

  // Datos simulados (reemplaza con consulta real si lo deseas)
  const data = [
    { id_expediente: 1, id_estudiante: "2020123456789", carrera: 'Informatica Administrativa', id_estado_expediente: 2, fecha_creacion_expediente: '2025-10-08 13:25:38' },
    { id_expediente: 2, id_estudiante: "2019100000001", carrera: 'Aduana', id_estado_expediente: 1, fecha_creacion_expediente: '2025-10-07 10:00:00' },
  ];

  if (roles.includes('secretaria_general') || roles.includes('administrativo')) {
    return res.json(data);
  }
  if (roles.includes('coordinador')) {
    // Filtrar por carrera del coordinador (simulado)
    return res.json(data.filter(d => d.carrera === 'Economía'));
  }
  // Estudiante: solo sus propios expedientes
  return res.json(data.filter(d => d.id_estudiante === id_estudiante));
};

module.exports = {
  crearExpediente,
  obtenerExpedientes,
  listByRole
};
