// backend/src/routes/estudiante.js
const express = require('express');
const db = require('../config/database');
// const { requireAuth } = require('../middlewares/auth'); // ← JWT desactivado
const router = express.Router();

// router.put('/perfil', requireAuth, (req, res) => { // ← JWT desactivado
router.put('/perfil', (req, res) => {
  const { 
    nombreCompleto,
    correoInstitucional,
    telefono,
    genero,
    numero_cuenta  // este es el valor del número de cuenta (ej: "20231000391")
  } = req.body;

  // 👇 Muestra los datos que vienen del frontend o Postman
  console.log('📩 Datos recibidos del frontend:', req.body);

  if (!numero_cuenta) {
    return res.status(400).json({ error: 'Número de cuenta es obligatorio.' });
  }
  if (!nombreCompleto || !correoInstitucional) {
    return res.status(400).json({ error: 'Nombre completo y correo institucional son obligatorios.' });
  }

  const nombres = nombreCompleto.trim().split(/\s+/);
  const nombre_estudiante = nombres[0] || '';
  const apellido_estudiante = nombres.slice(1).join(' ') || '';

  let id_genero = null;
  if (genero) {
    const g = genero.trim().toUpperCase();
    if (g === 'FEMENINO' || g === 'F') id_genero = 1;
    else if (g === 'MASCULINO' || g === 'M') id_genero = 2;
  }

  const id_usuario = 56; // valor fijo para pruebas

  const selectQuery = 'SELECT id_estudiante FROM estudiante WHERE id_estudiante = ?';
  db.query(selectQuery, [numero_cuenta], (err, results) => {
    if (err) {
      console.error('❌ Error al buscar estudiante:', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }

    console.log('🔍 Resultado de la búsqueda:', results);

    if (results.length > 0) {
      // Actualizar por `id_estudiante`
      const updateQuery = `
        UPDATE estudiante 
        SET nombre_estudiante = ?, 
            apellido_estudiante = ?, 
            correo_estudiante = ?, 
            telefono_estudiante = ?, 
            id_genero = ?, 
            id_usuario = ?
        WHERE id_estudiante = ?`;

      db.query(updateQuery, [
        nombre_estudiante, 
        apellido_estudiante, 
        correoInstitucional,
        telefono || null, 
        id_genero, 
        id_usuario, 
        numero_cuenta
      ], (err) => {
        if (err) {
          console.error('❌ Error al actualizar:', err);
          return res.status(500).json({ error: 'Error al actualizar perfil' });
        }

        console.log('✅ Perfil actualizado correctamente para:', numero_cuenta);
        res.json({ success: true, message: 'Perfil actualizado correctamente' });
      });
    } else {
      // INSERT con `id_estudiante`
      const insertQuery = `
        INSERT INTO estudiante (
          id_estudiante,
          nombre_estudiante, 
          apellido_estudiante, 
          correo_estudiante,
          telefono_estudiante, 
          id_genero, 
          id_usuario, 
          fecha_creacion, 
          id_estado
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), 1)`;

      db.query(insertQuery, [
        numero_cuenta,
        nombre_estudiante, 
        apellido_estudiante, 
        correoInstitucional,
        telefono || null, 
        id_genero, 
        id_usuario
      ], (err) => {
        if (err) {
          console.error('❌ Error al crear estudiante:', err);
          return res.status(500).json({ error: 'Error al crear perfil' });
        }

        console.log('🆕 Estudiante creado correctamente con número de cuenta:', numero_cuenta);
        res.status(201).json({ success: true, message: 'Perfil creado correctamente' });
      });
    }
  });
});

module.exports = router;
