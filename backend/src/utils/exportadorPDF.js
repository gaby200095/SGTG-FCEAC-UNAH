const PDFDocument = require('pdfkit')

const GenerarPDF = async (_datos) => {
  const _partes = []
  const _doc = new PDFDocument({ margin: 30 })
  _doc.on('data', _chunk => _partes.push(_chunk))
  _doc.fontSize(16).text('Reporte de Graduaciones', { align: 'center' })
  _doc.moveDown()
  const _cabecera = ['Estudiante', 'Nombre', 'Carrera', 'Índice', 'Fecha', 'Tipo']
  _doc.fontSize(12).text(_cabecera.join(' | '))
  _doc.moveDown(0.5)
  _datos.forEach(_r => {
    const _indice = _r.indice_academico || 'No registrado'
    const _fecha = _r.fecha_graduacion ? new Date(_r.fecha_graduacion).toISOString().split('T')[0] : ''
    _doc.text(`${_r.estudiante || ''} | ${_r.nombre || ''} | ${_r.carrera || ''} | ${_indice} | ${_fecha} | ${_r.tipo_graduacion || ''}`)
  })
  _doc.end()
  return new Promise(resolve => {
    _doc.on('end', () => resolve(Buffer.concat(_partes)))
  })
}

module.exports = { GenerarPDF }