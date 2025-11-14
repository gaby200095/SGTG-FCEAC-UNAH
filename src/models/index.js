// Este archivo define los modelos de datos que se utilizarán para interactuar con la base de datos MySQL.
// Exporta clases o funciones que representan las entidades del sistema.

const db = require('../config/database');

// Helper opcional con Promesa
const query = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });

// No hay sincronización de modelos (sin ORM)
const initModels = async () => true;

module.exports = { query, initModels };