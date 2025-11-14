// frontend/src/pages/dash/DashboardExpediente.jsx
import React, { useState, useMemo, useEffect } from 'react';
import './DashboardExpediente.css';

// Requisitos compartidos entre módulos (exportados)
export const REQUISITOS_BASE = [
  { id: 1, nombre: "3 fotografías tamaño pasaporte (fondo blanco)" },
  { id: 2, nombre: "Timbre de contratacion" },
  { id: 3, nombre: "Constancia de verificasion de nombre" },
  { id: 4, nombre: "Fotocopia de la nueva tarjeta de identidad (DNI)" },
  { id: 5, nombre: "Ficha de archivos de expediente" },
  { id: 6, nombre: "Certificado de notas original" },
  { id: 7, nombre: "Constancia de egresado" },
  { id: 8, nombre: "Constancia del Himno Nacional" },
  { id: 9, nombre: "Constancia de Servicio Social conforme al Art. 140 VOAE" },
  { id: 10, nombre: "Fotocopia del Título de Educación Media" },
  { id: 11, nombre: "Constancia de la Práctica Profesional Supervisada" },
  { id: 12, nombre: "Fotocopia del Carnet de Afiliación al Colegio Profesional" },
  { id: 13, nombre: "Solvencia de Registro" },
  { id: 14, nombre: "Comprobante de Pago de Derecho de Graduación" },
  { id: 15, nombre: "Carne vigente original o Comprobante de Pago de Reposición" },
  { id: 16, nombre: "Solicitud de Expedición del Título" },
  { id: 17, nombre: "Solicitud de Honores academico (si aplica). Justificasion y respaldo" },
  { id: 18, nombre: "Constancia de buena conducta" },
  { id: 19, nombre: "Constancia o Solvencia de Laboratorio de Informática (UNICAMENTE INFORMATICA ADMINISTRATIVA)" },
];

function DashboardExpediente({ embedded = false, startCreated = false, showGuide = false }) {
  const [expedienteCreado, setExpedienteCreado] = useState(!!startCreated);
  const [mostrarModalSubida, setMostrarModalSubida] = useState(false);
  const [requisitoActual, setRequisitoActual] = useState(null);
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);
  const [mensajeError, setMensajeError] = useState('');
  const [mensajeErrorDetalle, setMensajeErrorDetalle] = useState('');
  const [archivosSubidos, setArchivosSubidos] = useState({});
  const [mostrarModalConfirmacion, setMostrarModalConfirmacion] = useState(false);
  const [idEliminar, setIdEliminar] = useState(null);
  const [mostrarToast, setMostrarToast] = useState(false);
  const [mostrarModalDetalle, setMostrarModalDetalle] = useState(false);
  const [comentario, setComentario] = useState('');
  const [documentoEntregado, setDocumentoEntregado] = useState(false);
  const [mostrarModalCreacion, setMostrarModalCreacion] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [confirmEdit, setConfirmEdit] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [datosEstudiante, setDatosEstudiante] = useState({
    nombreCompleto: "",
    correoInstitucional: "",
    telefono: "",
    genero: "",
    departamento: "",
    municipio: "",
    numeroCuenta: "",
    carrera: "",        
    anioIngreso: ""     
  });

  const handleCrearExpediente = () => {
    if (!datosEstudiante.numeroCuenta || datosEstudiante.numeroCuenta.trim() === "") {
      alert('Por favor, ingresa tu número de cuenta antes de crear el expediente.');
      return;
    }
    setMostrarModalCreacion(true);
  };

  const handleGuardarCambios = async () => {
    const { nombreCompleto, correoInstitucional, telefono, genero, departamento, municipio, numeroCuenta } = datosEstudiante;

    if (!numeroCuenta || numeroCuenta.trim() === "") {
      alert('Por favor, ingresa tu número de cuenta.');
      return;
    }

    let nombreCompletoEsperado = null;
    try {
      const usuarioLogueado = JSON.parse(localStorage.getItem('user'));
      if (usuarioLogueado) {
        let nombre = usuarioLogueado.nombre_usuario || usuarioLogueado.nombre;
        let apellido = usuarioLogueado.apellido_usuario || usuarioLogueado.apellido;
        if (nombre && apellido) {
          nombreCompletoEsperado = `${nombre} ${apellido}`;
        }
      }
    } catch (e) {
      console.warn('No se pudo cargar el nombre del usuario.');
    }

    if (nombreCompletoEsperado) {
      if (nombreCompleto.trim().toLowerCase() !== nombreCompletoEsperado.trim().toLowerCase()) {
        alert(`Nombre no coincide. Debe ser exactamente:\n"${nombreCompletoEsperado}"`);
        return;
      }
    }

    try {
      let response = await fetch('/api/estudiante/perfil', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          id_estudiante: numeroCuenta.trim(),
          nombreCompleto,
          correoInstitucional,
          telefono,
          genero,
          departamento,
          municipio
        })
      });

      if (response.ok) {
        setMostrarToast(true);
        setTimeout(() => setMostrarToast(false), 3000);
        return;
      }

      if (response.status === 404) {
        response = await fetch('/api/estudiante/perfil', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          },
          body: JSON.stringify({
            id_estudiante: numeroCuenta.trim(),
            nombreCompleto,
            correoInstitucional,
            telefono,
            genero,
            departamento,
            municipio
          })
        });

        if (response.ok) {
          setMostrarToast(true);
          setTimeout(() => setMostrarToast(false), 3000);
          return;
        }
      }

      const errorText = await response.text();
      if (response.status === 401) {
        alert('Sesión expirada. Por favor, inicia sesión nuevamente.');
      } else if (response.status === 404) {
        alert('No se pudo crear tu perfil. Contacta al administrador.');
      } else {
        alert(`Error: ${errorText.substring(0, 150)}...`);
      }
    } catch (error) {
      console.error('Error de red:', error);
      alert('Error de red: ' + error.message);
    }
  };

  const manejarArchivo = (file) => {
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setMensajeError('Solo se permiten archivos PDF.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setMensajeError('El archivo excede el tamaño máximo permitido (10 MB).');
      return;
    }
    setMensajeError('');
    setArchivoSeleccionado(file);
  };

  const guardarArchivo = () => {
    if (archivoSeleccionado && requisitoActual) {
      setArchivosSubidos(prev => ({
        ...prev,
        [requisitoActual.id]: {
          archivo: archivoSeleccionado,
          estado: 'En revisión',
          comentario: ''
        }
      }));
      cerrarModalSubida();
    }
  };

  const cerrarModalSubida = () => {
    setMostrarModalSubida(false);
    setRequisitoActual(null);
    setArchivoSeleccionado(null);
    setMensajeError('');
  };

  const eliminarArchivo = (idRequisito) => {
    setIdEliminar(idRequisito);
    setMostrarModalConfirmacion(true);
  };

  const confirmarEliminacion = () => {
    setArchivosSubidos(prev => {
      const nuevo = { ...prev };
      delete nuevo[idEliminar];
      return nuevo;
    });
    setDocumentoEntregado(false);
    setMostrarModalConfirmacion(false);
    setIdEliminar(null);
  };

  const cancelarEliminacion = () => {
    setMostrarModalConfirmacion(false);
    setIdEliminar(null);
  };

  const abrirModalDetalle = (requisito) => {
    const doc = archivosSubidos[requisito.id];
    setRequisitoActual(requisito);
    setComentario(doc?.comentario || '');
    setDocumentoEntregado(!!doc);
    setMostrarModalDetalle(true);
    setMensajeErrorDetalle('');
  };

  const entregarDocumento = () => {
    if (!archivoSeleccionado) {
      setMensajeErrorDetalle('Primero debes seleccionar un archivo.');
      return;
    }
    if (archivoSeleccionado.type !== 'application/pdf') {
      setMensajeErrorDetalle('Solo se permiten archivos PDF.');
      return;
    }
    if (archivoSeleccionado.size > 10 * 1024 * 1024) {
      setMensajeErrorDetalle('El archivo excede el tamaño máximo permitido (10 MB).');
      return;
    }

    setArchivosSubidos(prev => ({
      ...prev,
      [requisitoActual.id]: {
        archivo: archivoSeleccionado,
        estado: 'En revisión',
        comentario: comentario
      }
    }));

    setMensajeErrorDetalle('Documento entregado correctamente');
    setDocumentoEntregado(true);
    setArchivoSeleccionado(null);

    setTimeout(() => {
      setMensajeErrorDetalle('');
    }, 3000);
  };

  const guardarCambiosComentario = () => {
    if (requisitoActual) {
      setArchivosSubidos(prev => ({
        ...prev,
        [requisitoActual.id]: {
          ...prev[requisitoActual.id],
          comentario: comentario
        }
      }));
      setMostrarToast(true);
      setTimeout(() => setMostrarToast(false), 3000);
    }
  };

  const requisitos = REQUISITOS_BASE;

  const getEstadoFormal = (doc) => {
    if (!doc) return 'No entregado';
    if (doc.estado === 'Completado') return 'Completado';
    return 'En revisión';
  };

  const progreso = useMemo(() => {
    const total = requisitos.length;
    const completados = requisitos.filter(req => {
      const doc = archivosSubidos[req.id];
      return doc && (doc.estado === 'En revisión' || doc.estado === 'Completado');
    }).length;
    const porcentaje = total > 0 ? Math.round((completados / total) * 100) : 0;
    return { completados, total, porcentaje };
  }, [archivosSubidos, requisitos]);

  // Bloquear scroll y navegación lateral cuando hay modal abierto
  useEffect(() => {
    if (mostrarModalDetalle || mostrarModalSubida || mostrarModalConfirmacion) {
      document.body.classList.add('modal-open');
      // Bloquea el sidebar manualmente si existe
      const sb = document.querySelector('.est-sidebar');
      if (sb) sb.style.pointerEvents = 'none';
    } else {
      document.body.classList.remove('modal-open');
      const sb = document.querySelector('.est-sidebar');
      if (sb) sb.style.pointerEvents = '';
    }
    return () => {
      document.body.classList.remove('modal-open');
      const sb = document.querySelector('.est-sidebar');
      if (sb) sb.style.pointerEvents = '';
    };
  }, [mostrarModalDetalle, mostrarModalSubida, mostrarModalConfirmacion]);

  // Nueva función: borrar entrega (archivo y comentario) con confirmación
  const borrarEntrega = (id) => {
    setConfirmDelete(id);
  };
  const confirmarBorrarEntrega = (id) => {
    setArchivosSubidos(prev => {
      const nuevo = { ...prev };
      delete nuevo[id];
      return nuevo;
    });
    setDocumentoEntregado(false);
    setMostrarModalDetalle(false);
    setConfirmDelete(false);
    setTimeout(() => setMostrarToast(true), 200);
    setTimeout(() => setMostrarToast(false), 2000);
  };

  // Nueva función: editar entrega (permite reemplazar archivo y comentario) con confirmación
  const iniciarEdicion = () => {
    setEditMode(true);
    setArchivoSeleccionado(null);
    setMensajeErrorDetalle('');
  };
  const guardarEdicion = () => {
    setConfirmEdit(true);
  };
  const confirmarGuardarEdicion = () => {
    if (!archivoSeleccionado && !comentario) {
      setMensajeErrorDetalle('Selecciona un archivo o edita el comentario.');
      setConfirmEdit(false);
      return;
    }
    setArchivosSubidos(prev => ({
      ...prev,
      [requisitoActual.id]: {
        archivo: archivoSeleccionado || prev[requisitoActual.id].archivo,
        estado: 'En revisión',
        comentario: comentario
      }
    }));
    setEditMode(false);
    setArchivoSeleccionado(null);
    setMensajeErrorDetalle('');
    setConfirmEdit(false);
    setMostrarToast(true);
    setTimeout(() => setMostrarToast(false), 2000);
  };

  return (
    <div className={`dashboard-container ${embedded ? 'embedded' : ''}`}>
      {/* Pantalla de requisitos (pre-creación) */}
      {!expedienteCreado && (
        <div className="requisitos-screen">
          <div className="form-container-center">
            <h3 className="section-title"><i className="fas fa-user-edit"></i> Ficha del Estudiante</h3>
            
            <div className="form-group">
              <label htmlFor="nombreCompleto">Nombre Completo:</label>
              <input
                type="text"
                id="nombreCompleto"
                value={datosEstudiante.nombreCompleto}
                onChange={(e) => setDatosEstudiante({...datosEstudiante, nombreCompleto: e.target.value})}
                className="input-compact"
              />
            </div>

            <div className="form-group">
              <label htmlFor="correoInstitucional">Correo Institucional:</label>
              <input
                type="email"
                id="correoInstitucional"
                value={datosEstudiante.correoInstitucional}
                onChange={(e) => setDatosEstudiante({...datosEstudiante, correoInstitucional: e.target.value})}
                className="input-compact"
              />
            </div>

            <div className="form-group">
              <label htmlFor="telefono">Teléfono:</label>
              <input
                type="text"
                id="telefono"
                value={datosEstudiante.telefono}
                onChange={(e) => setDatosEstudiante({...datosEstudiante, telefono: e.target.value})}
                className="input-compact"
              />
            </div>

            <div className="form-group">
              <label htmlFor="genero">Género:</label>
              <select
                id="genero"
                value={datosEstudiante.genero}
                onChange={(e) => setDatosEstudiante({...datosEstudiante, genero: e.target.value})}
                className="input-compact"
              >
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="departamento">Departamento:</label>
              <select
                id="departamento"
                value={datosEstudiante.departamento}
                onChange={(e) => setDatosEstudiante({...datosEstudiante, departamento: e.target.value})}
                className="input-compact"
              >
                <option value="">Selecciona un departamento</option>
                <option value="Atlántida">Atlántida</option>
                <option value="Choluteca">Choluteca</option>
                <option value="Colón">Colón</option>
                <option value="Comayagua">Comayagua</option>
                <option value="Copán">Copán</option>
                <option value="Cortés">Cortés</option>
                <option value="El Paraíso">El Paraíso</option>
                <option value="Francisco Morazán">Francisco Morazán</option>
                <option value="Gracias a Dios">Gracias a Dios</option>
                <option value="Intibucá">Intibucá</option>
                <option value="Islas de la Bahía">Islas de la Bahía</option>
                <option value="La Paz">La Paz</option>
                <option value="Lempira">Lempira</option>
                <option value="Ocotepeque">Ocotepeque</option>
                <option value="Olancho">Olancho</option>
                <option value="Santa Bárbara">Santa Bárbara</option>
                <option value="Valle">Valle</option>
                <option value="Yoro">Yoro</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="municipio">Municipio:</label>
              <select
                id="municipio"
                value={datosEstudiante.municipio}
                onChange={(e) => setDatosEstudiante({...datosEstudiante, municipio: e.target.value})}
                className="input-compact"
              >
                <option value="Distrito Central">Distrito Central</option>
                <option value="Tegucigalpa">Tegucigalpa</option>
                <option value="San Pedro Sula">San Pedro Sula</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="numeroCuenta">Número de Cuenta:</label>
              <input
                type="text"
                id="numeroCuenta"
                value={datosEstudiante.numeroCuenta}
                onChange={(e) => setDatosEstudiante({...datosEstudiante, numeroCuenta: e.target.value})}
                className="input-compact"
                
              />
            </div>

            <div className="form-actions">
              <button
                className="btn-guardar-perfil"
                onClick={handleGuardarCambios}
              >
                <i className="fas fa-save"></i> Guardar cambios
              </button>
            </div>

            <div className="crear-expediente-container">
              <button
                className="btn-crear-expediente-bajo"
                onClick={handleCrearExpediente}
                disabled={!datosEstudiante.numeroCuenta}
              >
                <i className="fas fa-plus-circle"></i> Crear Expediente
              </button>
            </div>

            <div className="info-message">
              <p><strong>Nota:</strong> Una vez guardes tu ficha podrás crear tu expediente, seguidamente subir los documentos requeridos.</p>
            </div>
          </div>

          {!embedded && (
            <div className="bottom-bar">
              <span className="unah-text">UNAH / FCEAC</span>
            </div>
          )}
        </div>
      )}

      {/* Pantalla de requisitos (post-creación) */}
      {expedienteCreado && (
        <div className="requisitos-screen" style={{ background: embedded ? 'transparent' : '#f3f6fa' }}>
          <div
            className="requisitos-content-full"
            style={{
              background: '#fff',
              borderRadius: 18,
              boxShadow: '0 6px 32px #0001',
              padding: embedded ? '18px 8px' : '36px 28px',
              marginTop: 0,
              marginBottom: 0,
              maxWidth: 900
            }}
          >
            {embedded && showGuide && (
              <div className="info-message" style={{ marginTop: 0, marginBottom: 18, fontWeight: 600, fontSize: 15 }}>
                <span style={{ color: '#1e40af', fontWeight: 800 }}>¿Cómo subir tus documentos?</span>
                <ol style={{ margin: '8px 0 0 1.2em', padding: 0, fontWeight: 400, color: '#334155', fontSize: 14 }}>
                  <li>Haz clic en <b>Ver detalle</b> junto al requisito.</li>
                  <li>Adjunta tu PDF (máx. 10MB).</li>
                  <li>Haz clic en <b>Entregar documento</b> y guarda si agregas comentarios.</li>
                  <li>El estado cambiará a <span style={{ color:'#1e40af', fontWeight:700 }}>En revisión</span>.</li>
                </ol>
              </div>
            )}

            <h3 className="section-title" style={{ color:'#1e40af', fontWeight:900, fontSize:22, marginBottom:10 }}>
              <i className="fas fa-file-alt" style={{ marginRight:8, color:'#2563eb' }}></i>
              Requisitos de Graduación
            </h3>

            {/* Barra de progreso visual */}
            <div style={{ marginBottom: 24, marginTop: 8 }}>
              <div style={{ display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
                <div style={{ fontWeight:700, color:'#1e40af', fontSize:18 }}>
                  {progreso.porcentaje}%
                </div>
                <div style={{ color:'#334155', fontSize:15 }}>
                  {progreso.completados} de {progreso.total} requisitos completados
                </div>
                <div style={{ flex:1, minWidth:120 }}>
                  <div style={{
                    background:'#e0e7ef',
                    borderRadius:8,
                    height:12,
                    width:'100%',
                    overflow:'hidden',
                    marginLeft:12,
                    marginRight:12
                  }}>
                    <div style={{
                      background: progreso.porcentaje === 100 ? '#22c55e' : '#2563eb',
                      width: `${progreso.porcentaje}%`,
                      height:'100%',
                      borderRadius:8,
                      transition:'width .4s'
                    }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Lista de requisitos en tarjetas visuales */}
            <div style={{
              display:'grid',
              gridTemplateColumns:'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '18px',
              marginTop: 8
            }}>
              {requisitos.map((requisito) => {
                const doc = archivosSubidos[requisito.id];
                const estadoFormal = getEstadoFormal(doc);
                const entregado = !!doc;
                const enRevision = entregado && doc.estado === 'En revisión';
                const completado = entregado && doc.estado === 'Completado';
                let badgeColor = '#fbbf24', badgeBg = '#fef3c7', icon = 'fa-circle-exclamation';
                if (enRevision) { badgeColor = '#2563eb'; badgeBg = '#dbeafe'; icon = 'fa-clock'; }
                if (completado) { badgeColor = '#22c55e'; badgeBg = '#dcfce7'; icon = 'fa-check-circle'; }

                return (
                  <div
                    key={requisito.id}
                    className="requisito-card"
                    style={{
                      background:'#f8fafc',
                      border:'1px solid #e2e8f0',
                      borderRadius:12,
                      boxShadow:'0 2px 8px #0001',
                      padding:'18px 16px',
                      display:'flex',
                      flexDirection:'column',
                      gap:10,
                      minHeight: 110,
                      justifyContent:'space-between'
                    }}
                  >
                    <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
                      <div style={{ fontSize:28, color:badgeColor, flexShrink:0 }}>
                        <i className={`fas ${icon}`}></i>
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:700, color:'#1e293b', fontSize:15, marginBottom:2 }}>
                          {requisito.nombre}
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <span
                            style={{
                              background: badgeBg,
                              color: badgeColor,
                              fontWeight:800,
                              fontSize:12,
                              borderRadius:12,
                              padding:'2px 12px',
                              textTransform:'uppercase',
                              letterSpacing:'.5px'
                            }}
                            title={completado ? 'Validado por coordinación' : enRevision ? 'En revisión por coordinación' : 'Aún no entregado'}
                          >
                            {estadoFormal}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display:'flex', justifyContent:'flex-end', marginTop:8 }}>
                      <button
                        className="btn-ver-detalle"
                        style={{
                          background:'#2563eb',
                          color:'#fff',
                          border:'none',
                          borderRadius:8,
                          padding:'7px 18px',
                          fontWeight:700,
                          fontSize:14,
                          cursor:'pointer',
                          boxShadow:'0 2px 8px #2563eb22',
                          transition:'background .18s'
                        }}
                        onClick={() => abrirModalDetalle(requisito)}
                      >
                        <i className="fas fa-eye" style={{ marginRight:6 }}></i>
                        Ver detalle
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mensaje informativo adicional */}
            <div className="info-message" style={{ marginTop: 24, background:'#e0f2fe', color:'#0369a1', fontWeight:600 }}>
              Si tienes dudas sobre algún requisito, consulta el detalle o comunícate con coordinación.
            </div>
          </div>
          {!embedded && (
            <div className="bottom-bar">
              <span className="unah-text">UNAH / FCEAC</span>
            </div>
          )}
        </div>
      )}

      {/* Modal para subir archivo */}
      {mostrarModalSubida && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h4 className="modal-title">Subir archivo - {requisitoActual?.nombre}</h4>
              <button className="close-modal" onClick={cerrarModalSubida}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-content">
              <div className="form-group">
                <label htmlFor="archivo">Seleccionar archivo:</label>
                <input
                  type="file"
                  id="archivo"
                  onChange={(e) => manejarArchivo(e.target.files[0])}
                  className="input-compact"
                />
                {mensajeError && <div className="error-message">{mensajeError}</div>}
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-cancelar" onClick={cerrarModalSubida}>
                <i className="fas fa-ban"></i> Cancelar
              </button>
              <button className="btn-guardar" onClick={guardarArchivo}>
                <i className="fas fa-upload"></i> Subir archivo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para detalles de requisito */}
      {mostrarModalDetalle && requisitoActual && (
        <div
          className="modal-overlay"
          style={{
            zIndex: 1201,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: 0
          }}
        >
          <div
            className="modal detalle-modal"
            style={{
              maxWidth: 520,
              width: '98%',
              borderRadius: 18,
              boxShadow: '0 12px 40px #0003',
              position: 'relative',
              paddingTop: 24,
              margin: 0,
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              minHeight: 'auto',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}
          >
            {/* Botón X mejorado */}
            <button
              className="close-modal btn-cerrar"
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                width: 38,
                height: 38,
                fontSize: 28,
                background: '#fff',
                color: '#1e293b',
                border: '2px solid #e0e7ef',
                borderRadius: '50%',
                boxShadow: '0 2px 8px #0002',
                zIndex: 2,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background .18s'
              }}
              aria-label="Cerrar ventana"
              onClick={() => { setMostrarModalDetalle(false); setEditMode(false); setArchivoSeleccionado(null); setMensajeErrorDetalle(''); }}
              tabIndex={0}
            >
              <span style={{ fontWeight: 900, fontSize: 28, lineHeight: 1 }}>×</span>
            </button>
            <div className="modal-header" style={{ borderBottom: '1px solid #e2e8f0', marginBottom: 10, position: 'relative', paddingTop: 0 }}>
              <h4 className="modal-title" style={{ color: '#1e40af', fontWeight: 800, fontSize: 18, textAlign: 'center', flex: 1 }}>
                Detalle del requisito<br />
                <span style={{ fontWeight: 600, color: '#2563eb', fontSize: 15 }}>{requisitoActual.nombre}</span>
              </h4>
            </div>
            <div className="modal-content" style={{ padding: '0.5rem 0.5rem 1.2rem 0.5rem', maxHeight: '70vh', overflowY: 'auto' }}>
              {/* Mensajes de confirmación SIEMPRE visibles arriba del formulario */}
              {confirmEdit && (
                <div className="error-message" style={{ background: '#fbbf24', color: '#1e293b', marginBottom: 12, position: 'relative', zIndex: 10 }}>
                  <span style={{ fontWeight: 700 }}>¿Guardar cambios?</span>
                  <span>¿Deseas guardar los cambios en tu entrega? Se reemplazará el archivo y/o comentario anterior.</span>
                  <div style={{ display: 'flex', gap: 10, marginTop: 8, width: '100%' }}>
                    <button
                      className="btn-cancelar"
                      style={{ flex: 1 }}
                      onClick={() => setConfirmEdit(false)}
                    >Cancelar</button>
                    <button
                      className="btn-guardar-cambios"
                      style={{ flex: 1, background: '#fbbf24', color: '#1e293b' }}
                      onClick={confirmarGuardarEdicion}
                    >Guardar</button>
                  </div>
                </div>
              )}
              {confirmDelete && (
                <div className="error-message" style={{ background: '#fee2e2', color: '#991b1b', marginBottom: 12, position: 'relative', zIndex: 10 }}>
                  <span style={{ fontWeight: 700 }}>¿Eliminar entrega?</span>
                  <span>¿Estás seguro de que deseas eliminar este archivo y comentario? Esta acción no se puede deshacer.</span>
                  <div style={{ display: 'flex', gap: 10, marginTop: 8, width: '100%' }}>
                    <button
                      className="btn-cancelar"
                      style={{ flex: 1 }}
                      onClick={() => setConfirmDelete(false)}
                    >Cancelar</button>
                    <button
                      className="btn-eliminar-archivo"
                      style={{ flex: 1, background: '#e11d48', color: '#fff' }}
                      onClick={() => confirmarBorrarEntrega(confirmDelete)}
                    >Eliminar</button>
                  </div>
                </div>
              )}
              {/* Estado visual */}
              <div style={{ marginBottom: 10 }}>
                <span style={{
                  background: !archivosSubidos[requisitoActual.id] ? '#fef3c7' : archivosSubidos[requisitoActual.id].estado === 'Completado' ? '#dcfce7' : '#dbeafe',
                  color: !archivosSubidos[requisitoActual.id] ? '#92400e' : archivosSubidos[requisitoActual.id].estado === 'Completado' ? '#166534' : '#2563eb',
                  fontWeight: 800,
                  fontSize: 13,
                  borderRadius: 12,
                  padding: '2px 14px',
                  textTransform: 'uppercase',
                  letterSpacing: '.5px'
                }}>
                  Estado: {getEstadoFormal(archivosSubidos[requisitoActual.id])}
                </span>
              </div>
              {/* Explicación de pasos */}
              <div style={{ background: '#f1f5f9', borderRadius: 8, padding: '10px 14px', marginBottom: 12, color: '#334155', fontSize: 14 }}>
                <ol style={{ margin: 0, paddingLeft: '1.2em' }}>
                  <li>Adjunta tu archivo PDF (máx. 10MB).</li>
                  <li>Agrega un comentario si es necesario (opcional).</li>
                  <li>Haz clic en <b>Entregar documento</b> para enviar.</li>
                  <li>El estado cambiará a <b>En revisión</b> hasta que coordinación lo valide.</li>
                </ol>
              </div>
              {/* Comentario y archivo */}
              <div className="detalle-info" style={{ marginBottom: 10 }}>
                <div className="detalle-item" style={{ marginBottom: 6 }}>
                  <strong>Comentario:</strong> {archivosSubidos[requisitoActual.id]?.comentario || <span style={{ color: '#64748b' }}>Sin comentarios</span>}
                </div>
                <div className="detalle-item" style={{ marginBottom: 6 }}>
                  <strong>Archivo:</strong>
                  {archivosSubidos[requisitoActual.id]?.archivo ? (
                    <a
                      href={URL.createObjectURL(archivosSubidos[requisitoActual.id].archivo)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link-archivo"
                      style={{ marginLeft: 8, color: '#2563eb', fontWeight: 700, textDecoration: 'underline' }}
                    >
                      Ver archivo
                    </a>
                  ) : (
                    <span style={{ color: '#64748b', marginLeft: 8 }}>No entregado</span>
                  )}
                </div>
              </div>
              {/* Área de subida y comentario solo si no está entregado o en modo edición */}
              {(!archivosSubidos[requisitoActual.id] || editMode) && !confirmEdit && !confirmDelete && (
                <div style={{ margin: '18px 0 0 0', background: '#fffbe6', border: '1px solid #fde68a', borderRadius: 8, padding: '14px 10px' }}>
                  <div style={{ marginBottom: 10 }}>
                    <label style={{ fontWeight: 700, color: '#b45309', fontSize: 14 }}>Selecciona tu archivo PDF:</label>
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={e => manejarArchivo(e.target.files[0])}
                      className="input-compact"
                      style={{ marginTop: 6, marginBottom: 8 }}
                    />
                    {mensajeErrorDetalle && <div className="error-message">{mensajeErrorDetalle}</div>}
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <label style={{ fontWeight: 700, color: '#b45309', fontSize: 14 }}>Comentario para coordinación (opcional):</label>
                    <textarea
                      className="input-textarea"
                      placeholder="Ejemplo: Documento escaneado en alta calidad."
                      value={comentario}
                      onChange={e => setComentario(e.target.value)}
                      style={{ marginTop: 6, minHeight: 60, width: '100%' }}
                    />
                  </div>
                  <button
                    className="btn-entregar-documento"
                    style={{
                      background: '#475569',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      padding: '10px 18px',
                      fontWeight: 700,
                      fontSize: 15,
                      cursor: 'pointer',
                      width: '100%',
                      marginTop: 8
                    }}
                    onClick={editMode ? guardarEdicion : entregarDocumento}
                  >
                    <i className="fas fa-paper-plane" style={{ marginRight: 8 }}></i>
                    {editMode ? 'Guardar cambios' : 'Entregar documento'}
                  </button>
                  {editMode && (
                    <button
                      className="btn-cancelar"
                      style={{
                        marginTop: 10,
                        width: '100%',
                        background: '#e0e7ef',
                        color: '#1e293b',
                        border: 'none',
                        borderRadius: 8,
                        padding: '10px 18px',
                        fontWeight: 700,
                        fontSize: 15,
                        cursor: 'pointer'
                      }}
                      onClick={() => { setEditMode(false); setArchivoSeleccionado(null); setMensajeErrorDetalle(''); }}
                    >
                      Cancelar edición
                    </button>
                  )}
                </div>
              )}
              {/* Si ya entregó, mostrar mensaje de espera y botones de editar/borrar */}
              {archivosSubidos[requisitoActual.id] && !editMode && !confirmEdit && !confirmDelete && (
                <div style={{ marginTop: 18, background: '#f1f5f9', border: '1px solid #e0e7ef', borderRadius: 8, padding: '12px 10px', color: '#334155', fontSize: 14 }}>
                  Documento enviado. Espera la validación de coordinación.<br />
                  <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                    <button
                      className="btn-guardar-cambios"
                      style={{
                        background: '#fbbf24',
                        color: '#1e293b',
                        border: 'none',
                        borderRadius: 8,
                        padding: '10px 0',
                        fontWeight: 700,
                        fontSize: 14,
                        cursor: 'pointer',
                        flex: 1,
                        minWidth: 0
                      }}
                      onClick={iniciarEdicion}
                    >
                      <i className="fas fa-edit" style={{ marginRight: 6 }}></i>
                      Editar entrega
                    </button>
                    <button
                      className="btn-eliminar-archivo"
                      style={{
                        background: '#e11d48',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        padding: '10px 0',
                        fontWeight: 700,
                        fontSize: 14,
                        cursor: 'pointer',
                        flex: 1,
                        minWidth: 0
                      }}
                      onClick={() => borrarEntrega(requisitoActual.id)}
                    >
                      <i className="fas fa-trash" style={{ marginRight: 6 }}></i>
                      Eliminar entrega
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal para confirmación de eliminación */}
      {mostrarModalConfirmacion && (
        <div className="modal-overlay">
          <div className="modal confirmacion-modal">
            <div className="modal-header">
              <h4 className="modal-title">Confirmar eliminación</h4>
              <button className="close-modal" onClick={cancelarEliminacion}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-content">
              <p>¿Estás seguro de que deseas eliminar este archivo?</p>
            </div>
            <div className="modal-actions">
              <button className="btn-cancelar" onClick={cancelarEliminacion}>
                <i className="fas fa-ban"></i> Cancelar
              </button>
              <button className="btn-confirmar" onClick={confirmarEliminacion}>
                <i className="fas fa-check"></i> Confirmar eliminación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast de éxito */}
      {mostrarToast && (
        <div className="toast-success">
          <i className="fas fa-check"></i> Cambios guardados con éxito.
        </div>
      )}

      {/* Modal de confirmación para eliminar */}
      {confirmDelete && (
        <div className="modal-overlay" style={{ zIndex: 1300 }}>
          <div className="modal confirmacion-modal" style={{ maxWidth: 380, margin: 'auto', textAlign: 'center' }}>
            <h4 style={{ margin: '0 0 16px', color: '#e11d48', fontWeight: 800 }}>¿Eliminar entrega?</h4>
            <p>¿Estás seguro de que deseas eliminar este archivo y comentario? Esta acción no se puede deshacer.</p>
            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <button
                className="btn-cancelar"
                style={{ flex: 1 }}
                onClick={() => setConfirmDelete(false)}
              >Cancelar</button>
              <button
                className="btn-eliminar-archivo"
                style={{ flex: 1, background: '#e11d48', color: '#fff' }}
                onClick={() => confirmarBorrarEntrega(confirmDelete)}
              >Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación para editar */}
      {confirmEdit && (
        <div className="modal-overlay" style={{ zIndex: 1300 }}>
          <div className="modal confirmacion-modal" style={{ maxWidth: 380, margin: 'auto', textAlign: 'center' }}>
            <h4 style={{ margin: '0 0 16px', color: '#fbbf24', fontWeight: 800 }}>¿Guardar cambios?</h4>
            <p>¿Deseas guardar los cambios en tu entrega? Se reemplazará el archivo y/o comentario anterior.</p>
            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <button
                className="btn-cancelar"
                style={{ flex: 1 }}
                onClick={() => setConfirmEdit(false)}
              >Cancelar</button>
              <button
                className="btn-guardar-cambios"
                style={{ flex: 1, background: '#fbbf24', color: '#1e293b' }}
                onClick={confirmarGuardarEdicion}
              >Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardExpediente;

// Ya soporta: <DashboardExpediente embedded={true} startCreated={true} showGuide={false} />
// No es necesario modificar nada aquí para el rediseño visual solicitado.

/* Agrega este CSS en tu archivo global o DashboardExpediente.css:
.modal-open .est-sidebar,
.modal-open .est-sidebar * {
  pointer-events: none !important;
  user-select: none !important;
  opacity: 0.5 !important;
}
.modal-open {
  overflow: hidden !important;
}
*/