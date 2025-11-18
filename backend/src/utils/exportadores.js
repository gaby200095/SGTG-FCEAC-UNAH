const ExcelJS = require('exceljs')
const PDFDocument = require('pdfkit')

const GenerarExcelGraduaciones = async (_datos) => {
  const _libro = new ExcelJS.Workbook()
  const _hoja = _libro.addWorksheet('Graduaciones')
  _hoja.addRow(['Estudiantes', 'Nombre', 'Carrera', 'Indice Academico', 'Fecha de Graduacion', 'Tipo de Graduacion'])
  ;(_datos || []).forEach(_r => {
    const _indice = _r.indice_academico || 'No registrado'
    const _fecha = _r.fecha_graduacion ? new Date(_r.fecha_graduacion).toISOString().split('T')[0] : ''
    _hoja.addRow([_r.estudiantes || '', _r.nombre || '', _r.carrera || '', _indice, _fecha, _r.tipo_graduacion || ''])
  })
  const _buffer = await _libro.xlsx.writeBuffer()
  return Buffer.from(_buffer)
}

const GenerarPDFGraduaciones = async (_datos) => {
  const _partes = []
  const _doc = new PDFDocument({ margin: 30 })
  _doc.on('data', _chunk => _partes.push(_chunk))
  _doc.fontSize(16).text('Reporte de Graduaciones', { align: 'center' })
  _doc.moveDown()
  _doc.fontSize(12).text('Estudiantes | Nombre | Carrera | Indice Academico | Fecha de Graduacion | Tipo de Graduacion')
  _doc.moveDown(0.5)
  ;(_datos || []).forEach(_r => {
    const _indice = _r.indice_academico || 'No registrado'
    const _fecha = _r.fecha_graduacion ? new Date(_r.fecha_graduacion).toISOString().split('T')[0] : ''
    _doc.text(`${_r.estudiantes || ''} | ${_r.nombre || ''} | ${_r.carrera || ''} | ${_indice} | ${_fecha} | ${_r.tipo_graduacion || ''}`)
  })
  _doc.end()
  return new Promise(resolve => {
    _doc.on('end', () => resolve(Buffer.concat(_partes)))
  })
}

const GenerarExcelExpedientes = async (_datos) => {
  const _libro = new ExcelJS.Workbook()
  const _hoja = _libro.addWorksheet('Expedientes')
  _hoja.addRow(['Expediente', 'Estudiante', 'Nombre', 'Carrera', 'Estado'])
  ;(_datos || []).forEach(_r => {
    _hoja.addRow([_r.expediente || '', _r.estudiante || '', _r.nombre || '', _r.carrera || '', _r.estado || ''])
  })
  const _buffer = await _libro.xlsx.writeBuffer()
  return Buffer.from(_buffer)
}

const GenerarPDFExpedientes = async (_datos) => {
  const _partes = []
  const _doc = new PDFDocument({ margin: 30 })
  _doc.on('data', _chunk => _partes.push(_chunk))
  _doc.fontSize(16).text('Reporte de Expedientes', { align: 'center' })
  _doc.moveDown()
  _doc.fontSize(12).text('Expediente | Estudiante | Nombre | Carrera | Estado')
  _doc.moveDown(0.5)
  ;(_datos || []).forEach(_r => {
    _doc.text(`${_r.expediente || ''} | ${_r.estudiante || ''} | ${_r.nombre || ''} | ${_r.carrera || ''} | ${_r.estado || ''}`)
  })
  _doc.end()
  return new Promise(resolve => {
    _doc.on('end', () => resolve(Buffer.concat(_partes)))
  })
}

module.exports = {
  GenerarExcelGraduaciones,
  GenerarPDFGraduaciones,
  GenerarExcelExpedientes,
  GenerarPDFExpedientes
}