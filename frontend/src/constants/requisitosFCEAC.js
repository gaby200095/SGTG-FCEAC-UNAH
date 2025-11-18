// frontend/src/constants/requisitosFCEAC.js

/**
 * Lista oficial de 19 requisitos de graduación de la FCEAC.
 * Fuente: https://cienciaseconomicas.unah.edu.hn/dmsdocument/15965-requisitos-de-graduacion
 */
export const REQUISITOS_FCEAC_19 = [
  { id: 1,  nombre: '2 fotografías ovaladas en blanco y negro (7 cm de alto x 5 cm de ancho)' },
  { id: 2,  nombre: 'Timbre de contratación' },
  { id: 3,  nombre: 'Constancia de verificación de nombre' },
  { id: 4,  nombre: 'Fotocopia de la nueva tarjeta de identidad (DNI)' },
  { id: 5,  nombre: 'Ficha de archivo de expediente' },
  { id: 6,  nombre: 'Certificación de notas original' },
  { id: 7,  nombre: 'Constancia de Egresado' },
  { id: 8,  nombre: 'Constancia del Himno Nacional' },
  { id: 9,  nombre: 'Constancia del Servicio Social o Constancias del Art. 140 VOAE' },
  { id: 10, nombre: 'Fotocopia del Título de Educación Media' },
  { id: 11, nombre: 'Constancia de la Práctica Profesional Supervisada' },
  { id: 12, nombre: 'Fotocopia del Carnet de Afiliación Provisional al Colegio Profesional' },
  { id: 13, nombre: 'Solvencia de Registro' },
  { id: 14, nombre: 'Constancia o Solvencia de Laboratorio (Informática Administrativa)' },
  { id: 15, nombre: 'Comprobante de Pago de Derechos de Graduación' },
  { id: 16, nombre: 'Carné vigente original o Comprobante de Pago de Reposición de Carné' },
  { id: 17, nombre: 'Solicitud de Extensión del Título' },
  { id: 18, nombre: 'Solicitud de Honores Académicos (si aplica) + Justificación y respaldos' },
  { id: 19, nombre: 'Constancia de Buena Conducta' },
];

/**
 * Mapa de requisitos por carrera (por si en el futuro varían).
 * Por ahora, todas usan la misma lista base.
 */
export const REQ_BY_CAREER = {
  INF: REQUISITOS_FCEAC_19, // Informática Administrativa
  ADU: REQUISITOS_FCEAC_19, // Aduanas
  COM: REQUISITOS_FCEAC_19, // Comercio Internacional
  ECO: REQUISITOS_FCEAC_19, // Economía
};

// Exportación adicional por compatibilidad (opcional)
export const BASE_FCEAC = REQUISITOS_FCEAC_19;
