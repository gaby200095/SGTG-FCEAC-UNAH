const ExcelJS = require('exceljs')

const GenerarExcel = async (_datos) => {
  const _libro = new ExcelJS.Workbook()
  const _hoja = _libro.addWorksheet('Graduaciones')
  _hoja.addRow(['Estudiante', 'Nombre', 'Carrera', 'Índice Académico', 'Fecha de Graduación', 'Tipo de Graduación'])
  _datos.forEach(_r => {
    const _indice = _r.indice_academico || 'No registrado'
    const _fecha = _r.fecha_graduacion ? new Date(_r.fecha_graduacion).toISOString().split('T')[0] : ''
    _hoja.addRow([_r.estudiante || '', _r.nombre || '', _r.carrera || '', _indice, _fecha, _r.tipo_graduacion || ''])
  })
  const _buffer = await _libro.xlsx.writeBuffer()
  return Buffer.from(_buffer)
}

module.exports = { GenerarExcel }