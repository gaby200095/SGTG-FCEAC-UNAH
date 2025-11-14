const db = require('../config/database')
const {
  GenerarExcelGraduaciones,
  GenerarPDFGraduaciones,
  GenerarExcelExpedientes,
  GenerarPDFExpedientes
} = require('../utils/exportadores')

const EjecutarConsulta = async (_sql, _params = []) => {
  if (typeof db.query === 'function') {
    const [ _filas ] = await db.promise().query(_sql, _params)
    return _filas
  } else {
    const [ _filas ] = await db.query(_sql, _params)
    return _filas
  }
}

const ConsultaGraduacionesSQL = `
  SELECT 
    e.id_estudiante AS estudiantes,
    CONCAT(COALESCE(e.nombre_estudiante,''), ' ', COALESCE(e.apellido_estudiante,'')) AS nombre,
    e.carrera AS carrera,
    NULL AS indice_academico,
    ag.fecha AS fecha_graduacion,
    e.tipo_graduacion AS tipo_graduacion
  FROM estudiante e
  LEFT JOIN asignacion_acto aa ON aa.id_usuario = e.id_usuario
  LEFT JOIN acto_graduacion ag ON ag.id_acto = aa.id_acto
  ORDER BY ag.fecha DESC, e.id_estudiante
`

const ConsultaExpedientesSQL = `
  SELECT 
    ed.id_expediente AS expediente,
    u.id_usuario AS estudiante,
    CONCAT(COALESCE(u.nombre_usuario,''), ' ', COALESCE(u.apellido_usuario,'')) AS nombre,
    c.nombre AS carrera,
    ed.estado AS estado
  FROM expediente_digital ed
  JOIN usuario_sistema u ON u.id_usuario = ed.id_usuario
  JOIN carrera c ON c.id_carrera = ed.id_carrera
  ORDER BY ed.id_expediente DESC
`

const ListarGraduaciones = async (req, res) => {
  try {
    const _filas = await EjecutarConsulta(ConsultaGraduacionesSQL)
    const _data = _filas.map(_r => ({
      estudiantes: _r.estudiantes,
      nombre: _r.nombre,
      carrera: _r.carrera,
      indice_academico: _r.indice_academico || 'No registrado',
      fecha_graduacion: _r.fecha_graduacion,
      tipo_graduacion: _r.tipo_graduacion
    }))
    res.json(_data)
  } catch (_e) {
    res.status(500).json({ error: 'Error al listar graduaciones' })
  }
}

const ExportarGraduacionesExcel = async (req, res) => {
  try {
    const _filas = await EjecutarConsulta(ConsultaGraduacionesSQL)
    const _archivo = await GenerarExcelGraduaciones(_filas)
    res.setHeader('Content-Disposition', 'attachment; filename=graduaciones.xlsx')
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.send(_archivo)
  } catch (_e) {
    res.status(500).json({ error: 'Error al exportar Excel de graduaciones' })
  }
}

const ExportarGraduacionesPDF = async (req, res) => {
  try {
    const _filas = await EjecutarConsulta(ConsultaGraduacionesSQL)
    const _archivo = await GenerarPDFGraduaciones(_filas)
    res.setHeader('Content-Disposition', 'attachment; filename=graduaciones.pdf')
    res.setHeader('Content-Type', 'application/pdf')
    res.send(_archivo)
  } catch (_e) {
    res.status(500).json({ error: 'Error al exportar PDF de graduaciones' })
  }
}

const ListarExpedientes = async (req, res) => {
  try {
    const _filas = await EjecutarConsulta(ConsultaExpedientesSQL)
    res.json(_filas)
  } catch (_e) {
    res.status(500).json({ error: 'Error al listar expedientes' })
  }
}

const ExportarExpedientesExcel = async (req, res) => {
  try {
    const _filas = await EjecutarConsulta(ConsultaExpedientesSQL)
    const _archivo = await GenerarExcelExpedientes(_filas)
    res.setHeader('Content-Disposition', 'attachment; filename=expedientes.xlsx')
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.send(_archivo)
  } catch (_e) {
    res.status(500).json({ error: 'Error al exportar Excel de expedientes' })
  }
}

const ExportarExpedientesPDF = async (req, res) => {
  try {
    const _filas = await EjecutarConsulta(ConsultaExpedientesSQL)
    const _archivo = await GenerarPDFExpedientes(_filas)
    res.setHeader('Content-Disposition', 'attachment; filename=expedientes.pdf')
    res.setHeader('Content-Type', 'application/pdf')
    res.send(_archivo)
  } catch (_e) {
    res.status(500).json({ error: 'Error al exportar PDF de expedientes' })
  }
}

module.exports = {
  ListarGraduaciones,
  ExportarGraduacionesExcel,
  ExportarGraduacionesPDF,
  ListarExpedientes,
  ExportarExpedientesExcel,
  ExportarExpedientesPDF
}