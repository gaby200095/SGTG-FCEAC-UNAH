const express = require('express')
const {
  ListarGraduaciones,
  ExportarGraduacionesExcel,
  ExportarGraduacionesPDF,
  ListarExpedientes,
  ExportarExpedientesExcel,
  ExportarExpedientesPDF
} = require('../controllers/reportesController')

const router = express.Router()

router.get('/graduaciones', ListarGraduaciones)
router.get('/graduaciones/excel', ExportarGraduacionesExcel)
router.get('/graduaciones/pdf', ExportarGraduacionesPDF)

router.get('/expedientes', ListarExpedientes)
router.get('/expedientes/excel', ExportarExpedientesExcel)
router.get('/expedientes/pdf', ExportarExpedientesPDF)

module.exports = router