// frontend/src/pages/dash/DashboardCoordinador.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../state/AuthContext";
import "./DashboardCoordinador.css";

/* Paleta para chips de estado en la tabla */
const estadoColors = {
  aprobado: "#065f46",
  cumplido: "#065f46",
  "en proceso": "#1e3a8a",
  en_proceso: "#1e3a8a",
  pendiente: "#3f3e3e",
  rechazado: "#991b1b",
};

/* Estados disponibles para editar un requisito */
const ESTADOS = ["Pendiente", "En Proceso", "Cumplido", "Rechazado"];

/* === Helpers =========================================================== */

/** Mapea el nombre textual de la carrera a la clave del mapa REQ_BY_CAREER. */
function careerKeyFromName(name = "") {
  const n = name.toUpperCase();
  if (n.includes("INFORMÁTICA")) return "INF";
  if (n.includes("ADUAN")) return "ADU";
  if (n.includes("ECONOM")) return "ECO"; // 👈 Economía
  return "INF";
}

/** Devuelve un nombre lindo para la UI, con “Licenciatura en …” cuando aplica. */
function formatCareerName(name = "") {
  const n = (name || "").toString().trim();
  const u = n.toUpperCase();
  if (u.includes("INFORMÁTICA")) return "Licenciatura en Informática Administrativa";
  if (u.includes("ADUAN")) return "Licenciatura en Aduanas";
  if (u.includes("ECONOM")) return "Licenciatura en Economía";
  if (!n) return "Carrera";
  // fallback
  return n.startsWith("Licenciatura") ? n : `Licenciatura en ${n}`;
}

/* ====================================================================== */

// Simulación de requisitos base por carrera (puedes reemplazar por tu fuente real)
const REQ_BY_CAREER = {
  INF: [
    { id: 1, nombre: "Certificado de estudios" },
    { id: 2, nombre: "Carta de compromiso" },
    { id: 3, nombre: "Comprobante de pago" }
  ],
  ADU: [
    { id: 1, nombre: "Certificado de estudios" },
    { id: 2, nombre: "Carta de compromiso" }
  ],
  ECO: [
    { id: 1, nombre: "Certificado de estudios" },
    { id: 2, nombre: "Carta de compromiso" },
    { id: 3, nombre: "Constancia de práctica profesional" }
  ]
};

function DashboardCoordinador() {
  const { user, call } = useAuth();

  // Sidebar y navegación
  const [active, setActive] = useState('resumen');
  const [sbOpen, setSbOpen] = useState(false);
  const [sbCollapsed, setSbCollapsed] = useState(false);

  // Datos base
  const [exp, setExp] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Encabezado
  const [nombreCoordinador, setNombreCoordinador] = useState("");
  const [carreraCoord, setCarreraCoord] = useState("");
  const [avisoCarrera, setAvisoCarrera] = useState("");

  // Filtros estudiantes
  const [filtroEstado, setFiltroEstado] = useState("");
  const [busqueda, setBusqueda] = useState("");

  // Gestión de requisitos/documentos
  const [gestionAbierta, setGestionAbierta] = useState(false);
  const [sel, setSel] = useState(null);
  const [loadingReq, setLoadingReq] = useState(false);
  const [reqs, setReqs] = useState([]);
  const [saving, setSaving] = useState({});

  // Citas
  const [citas, setCitas] = useState([
    { id: 1, estudiante: 'Ana López', fecha: '2025-11-01', hora: '09:30', tema: 'Entrega de documentos', estado: 'Pendiente' },
    { id: 2, estudiante: 'Luis Pérez', fecha: '2025-11-02', hora: '11:00', tema: 'Revisión de expediente', estado: 'Reprogramada' }
  ]);
  const [citaEdit, setCitaEdit] = useState(null);

  // Toast de confirmación
  const [toast, setToast] = useState({ show: false, msg: '', type: 'success' });

  // Sidebar sections
  const sections = [
    { key: 'resumen', label: 'Resumen' },
    { key: 'estudiantes', label: 'Estudiantes' },
    { key: 'validar', label: 'Validar documentos' },
    { key: 'asignar', label: 'Asignar acto' },
    { key: 'citas', label: 'Citas' },
    { key: 'reportes', label: 'Reportes' },
    { key: 'config', label: 'Configuración' },
    { key: 'ayuda', label: 'Ayuda' }
  ];

  // Sidebar navigation
  const goSection = (key) => {
    setActive(key);
    setSbOpen(false);
    setSbCollapsed(false);
    try { window.location.hash = `#coord=${key}`; } catch {}
  };

  // Responsive sidebar toggle
  useEffect(() => {
    const onToggle = () => {
      const isMobile = window.matchMedia('(max-width: 992px)').matches;
      if (isMobile) setSbOpen(v => !v); else setSbCollapsed(v => !v);
    };
    window.addEventListener('coord:toggleSidebar', onToggle);
    return () => window.removeEventListener('coord:toggleSidebar', onToggle);
  }, []);

  // Reveal animación
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    els.forEach(el => el.classList.add('visible'));
  }, []);
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    els.forEach(el => el.classList.add('visible'));
    try { document.querySelector('.coord-main')?.scrollTo({ top: 0, behavior: 'smooth' }); } catch {}
  }, [active]);

  // Carga inicial de expedientes y nombre
  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        // Nombre del coordinador y carrera
        if (user?.id_usuario) {
          const rUser = await call("/table/usuario_sistema?limit=500");
          if (rUser.ok) {
            const rows = await rUser.json();
            const reg = rows.find((u) => u.id_usuario === user.id_usuario);
            if (reg) {
              const nombre = reg.nombre_usuario || reg.nombre || "";
              const apellido = reg.apellido_usuario || reg.apellido || "";
              setNombreCoordinador(
                `${nombre} ${apellido}`.trim() || user.correo?.split("@")[0] || "Coordinador"
              );
              const posible =
                reg.carrera || reg.nombre_carrera || reg.carrera_coordinador || reg.coordinacion || "";
              if (posible) setCarreraCoord(String(posible).trim());
            } else {
              setNombreCoordinador(user.correo?.split("@")[0] || "Coordinador");
            }
          }
        }
        // Expedientes
        const rExp = await call("/expedientes");
        if (rExp.ok) {
          const data = await rExp.json();
          if (!carreraCoord) {
            const f = (data || []).find((e) => e.carrera || e.nombre_carrera);
            if (f?.carrera) setCarreraCoord(f.carrera);
            else if (f?.nombre_carrera) setCarreraCoord(f.nombre_carrera);
            else setAvisoCarrera("No se pudo determinar la carrera del coordinador. Mostrando todos los expedientes.");
          }
          setExp(Array.isArray(data) ? data : []);
        } else {
          setExp([]);
        }
      } catch {
        if (!cancel) setError("No se pudieron cargar los expedientes.");
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, [call, user, carreraCoord]);

  // Filtros y helpers
  const uniqueEstados = useMemo(() => {
    return Array.from(
      new Set(
        (exp || [])
          .filter((e) => {
            if (!carreraCoord) return true;
            const cExp = String(e.carrera || e.nombre_carrera || "").toLowerCase();
            return cExp === carreraCoord.toLowerCase();
          })
          .map((e) => String(e.estado || "").toLowerCase())
      )
    ).filter(Boolean);
  }, [exp, carreraCoord]);

  const filtrados = useMemo(() => {
    const carr = (carreraCoord || "").toLowerCase();
    return (exp || [])
      .filter((e) => {
        if (!carr) return true;
        const cExp = String(e.carrera || e.nombre_carrera || "").toLowerCase();
        return cExp === carr;
      })
      .filter(
        (e) =>
          !filtroEstado ||
          String(e.estado || "").toLowerCase() === String(filtroEstado).toLowerCase()
      )
      .filter((e) => {
        if (!busqueda.trim()) return true;
        const q = busqueda.toLowerCase();
        return (
          String(e.nombre || "").toLowerCase().includes(q) ||
          String(e.carrera || e.nombre_carrera || "").toLowerCase().includes(q) ||
          String(e.id_usuario || "").toLowerCase().includes(q)
        );
      });
  }, [exp, filtroEstado, busqueda, carreraCoord]);

  // Toast auto-close
  useEffect(() => {
    if (toast.show) {
      const t = setTimeout(() => setToast({ ...toast, show: false }), 2500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  /* -------- Carga inicial -------------------------------------------- */
  useEffect(() => {
    let cancel = false;
    (async () => {
      if (!user?.id_usuario) return;
      setLoading(true);
      setError(null);
      try {
        // 1) Datos del coordinador
        let rowsUsuarios = [];
        const rUser = await call("/table/usuario_sistema?limit=500");
        if (rUser.ok) rowsUsuarios = await rUser.json();
        const reg = rowsUsuarios.find((u) => u.id_usuario === user.id_usuario);

        if (reg) {
          const nombre = reg.nombre_usuario || reg.nombre || "";
          const apellido = reg.apellido_usuario || reg.apellido || "";
          setNombreCoordinador(
            `${nombre} ${apellido}`.trim() || user.correo?.split("@")[0] || "Coordinador"
          );
          // intenta leer su carrera; si no hay, más abajo intentamos deducirla de los expedientes
          const posible =
            reg.carrera || reg.nombre_carrera || reg.carrera_coordinador || reg.coordinacion || "";
          if (posible) setCarreraCoord(String(posible).trim());
        } else {
          setNombreCoordinador(user.correo?.split("@")[0] || "Coordinador");
        }

        // 2) Expedientes
        const rExp = await call("/expedientes");
        if (!rExp.ok) throw new Error(`HTTP ${rExp.status}`);
        const data = await rExp.json();

        // Si no tenemos carrera del coordinador, intenta deducirla del primer expediente
        if (!carreraCoord) {
          const f = (data || []).find((e) => e.carrera || e.nombre_carrera);
          if (f?.carrera) setCarreraCoord(f.carrera);
          else if (f?.nombre_carrera) setCarreraCoord(f.nombre_carrera);
          else
            setAvisoCarrera(
              "No se pudo determinar la carrera del coordinador. Mostrando todos los expedientes."
            );
        }

        if (!cancel) setExp(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancel) setError("No se pudieron cargar los expedientes.");
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [call, user, carreraCoord]);

  /* -------- Animación reveal (suave) --------------------------------- */
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.05 }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  // Perfil/Configuración (avatar)
  const [perfil, setPerfil] = useState({
    nombre: '',
    correo: user?.correo || '',
    telefono: '',
    avatar: null,
    avatarUrl: '',
  });

  // Actualiza nombre en perfil cuando cambia el nombre de usuario
  useEffect(() => {
    setPerfil(p => ({ ...p, nombre: nombreCoordinador || '' }));
  }, [nombreCoordinador]);

  // Handler para subir avatar
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPerfil(p => {
      if (p.avatarUrl) URL.revokeObjectURL(p.avatarUrl);
      return { ...p, avatar: file, avatarUrl: url };
    });
  };

  // Handler para limpiar avatar
  const handleRemoveAvatar = () => {
    setPerfil(p => {
      if (p.avatarUrl) URL.revokeObjectURL(p.avatarUrl);
      return { ...p, avatar: null, avatarUrl: '' };
    });
  };

  // Handler para campos de perfil
  const handlePerfilChange = (e) => {
    const { name, value } = e.target;
    setPerfil(p => ({ ...p, [name]: value }));
  };

  // Handler para guardar perfil
  const handlePerfilSubmit = (e) => {
    e.preventDefault();
    setToast({ show: true, msg: 'Perfil actualizado correctamente.', type: 'success' });
  };

  // --- Lógica para cargar requisitos/documentos al seleccionar estudiante ---
  // Corrige: define abrirGestion dentro del componente
  const abrirGestion = async (row) => {
    setGestionAbierta(true);
    setLoadingReq(true);
    try {
      // 1) Base por carrera (desde constantes)
      const key = careerKeyFromName(row.carrera || row.nombre_carrera || "");
      const base = REQ_BY_CAREER[key] || [];

      // 2) Progreso del usuario (si ya hay registros)
      let progRows = [];
      const rProg = await call("/table/progreso_requisito?limit=2000");
      if (rProg.ok) {
        const all = await rProg.json();
        progRows = all.filter(
          (p) => p.id_usuario === row.id_usuario || p.usuario_id === row.id_usuario
        );
      }

      // 3) Construye la lista editable
      const lista = base.map((req, idx) => {
        const id = req.id_requisito ?? req.id ?? idx + 1;
        const pr =
          progRows.find((p) => p.id_requisito === id || p.id_requisitos === id) || null;
        const estado = pr?.estado || pr?.estatus || "Pendiente";
        const observaciones = pr?.observacion || pr?.comentario || "";
        return {
          id,
          nombre: req.nombre_requisito || req.nombre || `Requisito ${id}`,
          estado,
          observaciones,
          dirty: false,
        };
      });

      setReqs(lista);
    } catch (e) {
      setReqs([]);
    } finally {
      setLoadingReq(false);
    }
  };

  // Cambiar un campo de un requisito (local)
  const setCampo = (id, field, value) => {
    setReqs((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value, dirty: true } : r)));
  };

  // Guardar un requisito
  const guardarUno = async (row, reqItem) => {
    try {
      setSaving((s) => ({ ...s, [reqItem.id]: true }));
      const payload = {
        id_usuario: row.id_usuario,
        id_requisito: reqItem.id,
        estado: reqItem.estado,
        observacion: reqItem.observaciones,
        actualizado_por: user.id_usuario,
        fecha_actualizacion: new Date().toISOString(),
      };

      // Preferimos POST (histórico). Si tu API soporta PUT para upsert, intenta luego.
      const resp = await call("/table/progreso_requisito", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const put = await call("/table/progreso_requisito", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!put.ok) throw new Error("No se pudo guardar");
      }

      setReqs((prev) => prev.map((r) => (r.id === reqItem.id ? { ...r, dirty: false } : r)));
    } catch (e) {
      alert("No se pudo guardar el requisito.");
    } finally {
      setSaving((s) => ({ ...s, [reqItem.id]: false }));
    }
  };

  // Llama a abrirGestion cuando se selecciona un estudiante para validar y la lista de requisitos está vacía
  useEffect(() => {
    if (active === 'validar' && sel) {
      abrirGestion(sel);
    }
    // eslint-disable-next-line
  }, [active, sel]);

  // Elimina la hamburguesa de la sidebar y del .sec-main-top, y colócala solo en el header principal del panel (navbar)
  // Para esto, agrega una prop para que el Navbar muestre la hamburguesa y permita abrir/cerrar el sidebar

  // Handler para la hamburguesa
  const handleHamburger = () => {
    const isMobile = window.matchMedia('(max-width: 992px)').matches;
    if (isMobile) setSbOpen(v => !v);
    else setSbCollapsed(v => !v);
  };

  // Nombre amigable para el saludo (igual que en Secretaría)
  const saludoNombre = nombreCoordinador?.trim()
    ? nombreCoordinador
    : (user?.correo?.split('@')[0] || 'Coordinador');

  return (
    <div className="sec-shell">
      {/* Toast de confirmación */}
      {toast.show && (
        <div
          style={{
            position: 'fixed',
            top: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            background: toast.type === 'success' ? '#22c55e' : '#fbbf24',
            color: '#fff',
            padding: '12px 28px',
            borderRadius: 10,
            fontWeight: 700,
            fontSize: 15,
            zIndex: 2002,
            boxShadow: '0 4px 18px #0002'
          }}
        >
          {toast.msg}
        </div>
      )}

      {/* Sidebar */}
      <aside className={`sec-sidebar ${sbOpen ? 'open' : ''} ${sbCollapsed ? 'collapsed' : ''}`}>
        <div className="sb-header">
          <div className="sb-title">Coordinador</div>
          <button className="sb-close" onClick={() => setSbOpen(false)} aria-label="Cerrar menú">×</button>
        </div>
        <nav className="sb-nav">
          {sections.map(s => (
            <button
              key={s.key}
              className={`sb-item ${active === s.key ? 'active' : ''}`}
              onClick={() => goSection(s.key)}
            >
              <span className="sb-dot" />
              <span className="sb-text">{s.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="sec-main coord-main">
        <div className="sec-main-top">
          <div className="sec-head">
            {/* SOLO mostrar saludo en el apartado de resumen */}
            {active === 'resumen' && (
              <p className="sec-subtitle">
                Bienvenido/a <strong>{saludoNombre}</strong>
              </p>
            )}
          </div>
        </div>
        {/* RESUMEN */}
        {active === 'resumen' && (
          <section className="sec-card reveal">
            <div className="sec-card__header"><div className="sec-card__title">Resumen general</div></div>
            <div className="sec-card__body">
              <div className="sec-widgets">
                <div className="wg"><div className="wg-k">Estudiantes</div><div className="wg-v">{filtrados.length}</div><div className="wg-meta">En tu carrera</div></div>
                <div className="wg"><div className="wg-k">Citas</div><div className="wg-v">{citas.length}</div><div className="wg-meta">Solicitudes activas</div></div>
                {/* ...otros KPIs relevantes... */}
              </div>
              <div className="sec-note" style={{ marginTop: 12 }}>
                Usa el menú lateral para navegar entre estudiantes, validar documentos, asignar actos, gestionar citas y reportes.
              </div>
            </div>
          </section>
        )}

        {/* ESTUDIANTES */}
        {active === 'estudiantes' && (
          <section className="sec-card reveal">
            <div className="sec-card__header"><div className="sec-card__title">Estudiantes de tu carrera</div></div>
            <div className="sec-card__body">
              <div className="sec-note" style={{ marginBottom: 10 }}>
                Consulta y filtra la lista de estudiantes de tu carrera. Haz clic en un estudiante para validar sus documentos.
              </div>
              <div className="list-toolbar" style={{ marginBottom: 10 }}>
                <div className="lt-left">
                  <select className="lt-select" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
                    <option value="">Todos los estados</option>
                    {uniqueEstados.map(est => <option key={est} value={est}>{est}</option>)}
                  </select>
                  <input className="lt-search" placeholder="Buscar…" value={busqueda} onChange={e => setBusqueda(e.target.value)} />
                </div>
                <div className="lt-right">
                  <button className="lt-btn" onClick={() => { setFiltroEstado(''); setBusqueda(''); }}>Limpiar filtros</button>
                </div>
              </div>
              {loading && <div className="hint">Cargando estudiantes...</div>}
              {error && !loading && <div className="error">{error}</div>}
              {!loading && !error && (
                <div className="table-card">
                  <div className="table-wrap">
                    <table className="sec-list">
                      <thead>
                        <tr>
                          <th>Expediente</th>
                          <th>Usuario</th>
                          <th>Nombre</th>
                          <th>Carrera</th>
                          <th>Estado</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtrados.length === 0 && (
                          <tr>
                            <td colSpan={6} className="empty">No hay estudiantes que coincidan con los filtros.</td>
                          </tr>
                        )}
                        {filtrados.map(row => (
                          <tr key={row.id_expediente}>
                            <td>#{row.id_expediente}</td>
                            <td>{row.id_usuario}</td>
                            <td>{row.nombre}</td>
                            <td>{row.carrera || row.nombre_carrera}</td>
                            <td>
                              <span className="badge" style={{ background: "#2563eb" }}>
                                {String(row.estado || '—').toLowerCase()}
                              </span>
                            </td>
                            <td>
                              <button
                                className="btn-hero"
                                onClick={() => { setSel(row); setActive('validar'); }}
                              >
                                Validar documentos
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* VALIDAR DOCUMENTOS */}
        {active === 'validar' && (
          <>
            {sel ? (
              // ...ya existente: formulario de validación...
              <section className="sec-card reveal">
                <div className="sec-card__header">
                  <div className="sec-card__title">Validar documentos — {sel.nombre}</div>
                  <button className="lt-btn" onClick={() => setActive('estudiantes')}>Volver</button>
                </div>
                <div className="sec-card__body">
                  <div className="sec-note" style={{ marginBottom: 10 }}>
                    Revisa los documentos cargados por el estudiante y marca cada requisito como Cumplido o Pendiente. Puedes agregar observaciones.
                  </div>
                  {/* Tabla de requisitos/documentos */}
                  {loadingReq && (
                    <div className="hint">Cargando requisitos del estudiante...</div>
                  )}
                  {!loadingReq && reqs.length === 0 && (
                    <div className="empty">No hay requisitos definidos para esta carrera o estudiante.</div>
                  )}
                  {!loadingReq && reqs.length > 0 && (
                    <div className="table-card">
                      <div className="table-wrap">
                        <table className="sec-list">
                          <thead>
                            <tr>
                              <th>Requisito</th>
                              <th>Estado</th>
                              <th>Observaciones</th>
                              <th>Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {reqs.map((req) => (
                              <tr key={req.id}>
                                <td>{req.nombre}</td>
                                <td>
                                  <select
                                    value={req.estado}
                                    onChange={e => setCampo(req.id, 'estado', e.target.value)}
                                    style={{ minWidth: 110 }}
                                  >
                                    {ESTADOS.map(est => (
                                      <option key={est} value={est}>{est}</option>
                                    ))}
                                  </select>
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    value={req.observaciones}
                                    onChange={e => setCampo(req.id, 'observaciones', e.target.value)}
                                    placeholder="Observaciones"
                                    style={{ width: 180 }}
                                  />
                                </td>
                                <td>
                                  <button
                                    className="lt-btn lt-primary"
                                    disabled={!req.dirty || saving[req.id]}
                                    onClick={() => guardarUno(sel, req)}
                                    style={{ minWidth: 90 }}
                                  >
                                    {saving[req.id] ? "Guardando..." : "Guardar"}
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  <div style={{ marginTop: 18 }}>
                    <button
                      className="lt-btn lt-primary"
                      onClick={() => setToast({ show: true, msg: 'Cambios guardados correctamente.', type: 'success' })}
                    >
                      Guardar validación
                    </button>
                  </div>
                </div>
              </section>
            ) : (
              // Si no hay estudiante seleccionado, muestra ayuda visual mejorada SIN herramientas rápidas
              <section className="sec-card reveal">
                <div className="sec-card__header">
                  <div className="sec-card__title">Validar documentos</div>
                </div>
                <div className="sec-card__body" style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
                  <div style={{ fontSize: 44, color: '#facc15', marginBottom: 12 }}>📄</div>
                  <div style={{ fontWeight: 700, color: '#1e293b', fontSize: 18, marginBottom: 8 }}>
                    Selecciona un estudiante para comenzar la validación de documentos.
                  </div>
                  <div style={{ color: '#64748b', fontSize: 15, marginBottom: 18 }}>
                    Ve a la sección <b>Estudiantes</b> y haz clic en <b>"Validar documentos"</b> junto al estudiante que deseas revisar.
                  </div>
                  <div style={{
                    background: '#f1f5f9',
                    border: '1px solid #e2e8f0',
                    borderRadius: 10,
                    padding: '1.2rem',
                    maxWidth: 480,
                    margin: '18px auto 0 auto',
                    color: '#334155',
                    fontSize: 15,
                    textAlign: 'left'
                  }}>
                    <ul style={{ paddingLeft: 22, margin: 0 }}>
                      <li>Podrás ver los requisitos y documentos cargados por el estudiante.</li>
                      <li>Marca cada requisito como <b>Cumplido</b>, <b>Pendiente</b>, <b>En Proceso</b> o <b>Rechazado</b>.</li>
                      <li>Agrega observaciones si es necesario para que el estudiante pueda corregir o completar su expediente.</li>
                      <li>Guarda los cambios para notificar al estudiante.</li>
                    </ul>
                  </div>
                  <div style={{ marginTop: 24, color: '#0369a1', fontWeight: 600, fontSize: 15 }}>
                    ¿Necesitas ayuda? Consulta la sección <b>Ayuda</b> del panel para ver una guía paso a paso.
                  </div>
                </div>
              </section>
            )}
          </>
        )}

        {/* ASIGNAR ACTO */}
        {active === 'asignar' && (
          <section className="sec-card reveal">
            <div className="sec-card__header"><div className="sec-card__title">Asignar estudiantes a acto de graduación</div></div>
            <div className="sec-card__body">
              <div className="sec-note" style={{ marginBottom: 10 }}>
                Selecciona los estudiantes que cumplen requisitos y asígnalos al acto de graduación correspondiente.
              </div>
              {/* Aquí iría la lógica para asignar estudiantes */}
              {/* ... */}
              <div style={{ marginTop: 18 }}>
                <button className="lt-btn lt_primary" onClick={() => setToast({ show: true, msg: 'Estudiantes asignados al acto.', type: 'success' })}>
                  Asignar al acto
                </button>
              </div>
            </div>
          </section>
        )}

        {/* CITAS */}
        {active === 'citas' && (
          <section className="sec-card reveal">
            <div className="sec-card__header"><div className="sec-card__title">Citas de estudiantes</div></div>
            <div className="sec-card__body">
              <div className="sec-note" style={{ marginBottom: 10 }}>
                Administra y organiza las citas solicitadas por los estudiantes de tu carrera.
              </div>
              <div className="table-card">
                <div className="table-wrap">
                  <table className="sec-list">
                    <thead>
                      <tr>
                        <th>Estudiante</th>
                        <th>Fecha</th>
                        <th>Hora</th>
                        <th>Tema</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {citas.length === 0 && (
                        <tr>
                          <td colSpan={6} className="empty">No hay citas.</td>
                        </tr>
                      )}
                      {citas.map(c => (
                        <tr key={c.id}>
                          <td>{c.estudiante}</td>
                          <td>{c.fecha}</td>
                          <td>{c.hora}</td>
                          <td>{c.tema}</td>
                          <td>{c.estado}</td>
                          <td>
                            <button className="lt-btn" onClick={() => setCitaEdit({ ...c })}>Reprogramar</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              {/* Modal de edición de cita */}
              {citaEdit && (
                <div className="modal-overlay">
                  <div className="modal" style={{ maxWidth: 400, margin: 'auto', background: '#fff', borderRadius: 12, padding: 24 }}>
                    <h4 style={{ marginBottom: 12 }}>Reprogramar cita</h4>
                    <div style={{ display: 'grid', gap: 10 }}>
                      <label>Fecha
                        <input type="date" value={citaEdit.fecha} onChange={e => setCitaEdit({ ...citaEdit, fecha: e.target.value })} className="input-compact" />
                      </label>
                      <label>Hora
                        <input type="time" value={citaEdit.hora} onChange={e => setCitaEdit({ ...citaEdit, hora: e.target.value })} className="input-compact" />
                      </label>
                      <label>Tema
                        <input type="text" value={citaEdit.tema} onChange={e => setCitaEdit({ ...citaEdit, tema: e.target.value })} className="input-compact" />
                      </label>
                      <label>Estado
                        <select value={citaEdit.estado} onChange={e => setCitaEdit({ ...citaEdit, estado: e.target.value })} className="input-compact">
                          <option>Pendiente</option>
                          <option>Reprogramada</option>
                          <option>Completada</option>
                        </select>
                      </label>
                      <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                        <button className="lt-btn" onClick={() => setCitaEdit(null)}>Cancelar</button>
                        <button className="lt-btn lt-primary" onClick={() => { setCitas(list => list.map(c => c.id === citaEdit.id ? citaEdit : c)); setCitaEdit(null); setToast({ show: true, msg: 'Cita reprogramada correctamente.', type: 'success' }); }}>Guardar</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* REPORTES */}
        {active === 'reportes' && (
          <section className="sec-card reveal">
            <div className="sec-card__header"><div className="sec-card__title">Reportes de avance</div></div>
            <div className="sec-card__body">
              <div className="sec-note" style={{ marginBottom: 10 }}>
                Descarga reportes del estado de los expedientes y requisitos de tus estudiantes.
              </div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <button className="lt-btn lt_primary" onClick={() => setToast({ show: true, msg: 'Reporte descargado (simulado)', type: 'success' })}>Exportar avance</button>
                <button className="lt-btn lt_primary" onClick={() => setToast({ show: true, msg: 'Reporte de citas descargado (simulado)', type: 'success' })}>Exportar citas</button>
              </div>
            </div>
          </section>
        )}

        {/* CONFIGURACIÓN */}
        {active === 'config' && (
          <section className="sec-card reveal">
            <div className="sec-card__header">
              <div className="sec-card__title">Configuración de perfil</div>
            </div>
            <div className="sec-card__body">
              <div className="sec-note" style={{ marginBottom: 14 }}>
                Personaliza tu perfil institucional. Esta información será visible para los estudiantes cuando reciban comunicados o interactúen contigo.
              </div>
              <form
                className="form-grid"
                style={{ display: 'grid', gap: 18, maxWidth: 520, margin: '0 auto' }}
                onSubmit={handlePerfilSubmit}
              >
                {/* Avatar */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    width: 90, height: 90, borderRadius: '50%',
                    background: '#e0e7ef', color: '#1e40af', fontWeight: 900,
                    fontSize: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px',
                    backgroundImage: perfil.avatarUrl ? `url(${perfil.avatarUrl})` : undefined,
                    backgroundSize: 'cover', backgroundPosition: 'center'
                  }}>
                    {!perfil.avatarUrl && (perfil.nombre?.charAt(0)?.toUpperCase() || 'C')}
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <label style={{
                      display: 'inline-block', background: '#2563eb', color: '#fff', borderRadius: 8,
                      padding: '6px 16px', fontWeight: 700, fontSize: 14, cursor: 'pointer', marginRight: 8
                    }}>
                      Cambiar foto
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
                    </label>
                    {perfil.avatarUrl && (
                      <button
                        type="button"
                        style={{
                          background: '#e11d48', color: '#fff', border: 'none', borderRadius: 8,
                          padding: '6px 16px', fontWeight: 700, fontSize: 14, cursor: 'pointer'
                        }}
                        onClick={handleRemoveAvatar}
                      >
                        Quitar foto
                      </button>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                    Formato JPG o PNG. Tamaño máximo recomendado: 1MB.
                  </div>
                </div>
                {/* Nombre */}
                <div>
                  <label style={{ fontWeight: 700, color: '#1e293b', fontSize: 14 }}>Nombre completo</label>
                  <input
                    type="text"
                    name="nombre"
                    value={perfil.nombre}
                    onChange={handlePerfilChange}
                    placeholder="Nombre completo"
                    className="input-compact"
                    style={{ marginTop: 4, width: '100%' }}
                  />
                </div>
                {/* Correo institucional */}
                <div>
                  <label style={{ fontWeight: 700, color: '#1e293b', fontSize: 14 }}>Correo institucional</label>
                  <input
                    type="email"
                    name="correo"
                    value={perfil.correo}
                    onChange={handlePerfilChange}
                    placeholder="correo@unah.edu.hn"
                    className="input-compact"
                    style={{ marginTop: 4, width: '100%' }}
                  />
                </div>
                {/* Teléfono */}
                <div>
                  <label style={{ fontWeight: 700, color: '#1e293b', fontSize: 14 }}>Teléfono</label>
                  <input
                    type="tel"
                    name="telefono"
                    value={perfil.telefono}
                    onChange={handlePerfilChange}
                    placeholder="Ej. 9999-9999"
                    className="input-compact"
                    style={{ marginTop: 4, width: '100%' }}
                  />
                </div>
                <button type="submit" className="lt-btn lt-primary" style={{ width: '100%', fontWeight: 700 }}>
                  Guardar cambios
                </button>
              </form>
              {/* Vista previa del perfil público */}
              <div style={{
                marginTop: 32, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12,
                padding: '1.2rem', maxWidth: 420, marginLeft: 'auto', marginRight: 'auto'
              }}>
                <div style={{ fontWeight: 700, color: '#1e40af', marginBottom: 8, fontSize: 16 }}>
                  Vista previa del perfil público
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                  <div style={{
                    width: 60, height: 60, borderRadius: '50%',
                    background: '#e0e7ef', color: '#1e40af', fontWeight: 900,
                    fontSize: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backgroundImage: perfil.avatarUrl ? `url(${perfil.avatarUrl})` : undefined,
                    backgroundSize: 'cover', backgroundPosition: 'center'
                  }}>
                    {!perfil.avatarUrl && (perfil.nombre?.charAt(0)?.toUpperCase() || 'C')}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#1e293b', fontSize: 15 }}>{perfil.nombre || 'Nombre Coordinador'}</div>
                    <div style={{ color: '#2563eb', fontSize: 13 }}>{perfil.correo || 'correo@unah.edu.hn'}</div>
                    <div style={{ color: '#64748b', fontSize: 13 }}>{perfil.telefono || 'Teléfono'}</div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>
                  Así verán los estudiantes tu perfil cuando reciban mensajes o comunicados.
                </div>
              </div>
            </div>
          </section>
        )}

        {/* AYUDA */}
        {active === 'ayuda' && (
          <section className="sec-card reveal">
            <div className="sec-card__header"><div className="sec-card__title">Ayuda y guía del panel</div></div>
            <div className="sec-card__body">
              <div className="sec-note" style={{ marginBottom: 10 }}>
                Consulta aquí cómo usar el panel, validar documentos, asignar actos y exportar reportes.
              </div>
              <div style={{ background: '#e0f2fe', border: '1px solid #bae6fd', borderRadius: 10, padding: '1rem', marginBottom: 12 }}>
                <div style={{ fontWeight: 700, color: '#0369a1', marginBottom: 6 }}>¿Cómo usar el panel?</div>
                <ol style={{ margin: 0, paddingLeft: '1.2em', color: '#334155', fontSize: 14 }}>
                  <li>Revisa el <b>Resumen</b> para ver indicadores globales.</li>
                  <li>En <b>Estudiantes</b> puedes filtrar y buscar estudiantes de tu carrera.</li>
                  <li>En <b>Validar documentos</b> revisa y marca los requisitos de cada estudiante.</li>
                  <li>En <b>Asignar acto</b> selecciona estudiantes elegibles para el acto de graduación.</li>
                  <li>En <b>Citas</b> administra y organiza los turnos de atención.</li>
                  <li>En <b>Reportes</b> descarga reportes de avance y citas.</li>
                  <li>En <b>Configuración</b> puedes personalizar tu perfil institucional.</li>
                </ol>
              </div>
              <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 10, padding: '1rem' }}>
                <div style={{ fontWeight: 700, color: '#b45309', marginBottom: 6 }}>Preguntas frecuentes</div>
                <details style={{ marginBottom: 6 }}>
                  <summary style={{ cursor: 'pointer', color: '#b45309', fontWeight: 700 }}>¿Cómo valido los documentos?</summary>
                  <div style={{ color: '#7c4700', fontSize: 14, marginTop: 2 }}>Desde la sección "Validar documentos" puedes marcar cada requisito como Cumplido o Pendiente y agregar observaciones.</div>
                </details>
                <details style={{ marginBottom: 6 }}>
                  <summary style={{ cursor: 'pointer', color: '#b45309', fontWeight: 700 }}>¿Cómo asigno estudiantes al acto?</summary>
                  <div style={{ color: '#7c4700', fontSize: 14, marginTop: 2 }}>En "Asignar acto" selecciona los estudiantes que cumplen requisitos y asígnalos al evento.</div>
                </details>
                <details>
                  <summary style={{ cursor: 'pointer', color: '#b45309', fontWeight: 700 }}>¿Puedo exportar reportes?</summary>
                  <div style={{ color: '#7c4700', fontSize: 14, marginTop: 2 }}>Sí, desde la sección Reportes puedes descargar información consolidada.</div>
                </details>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default DashboardCoordinador;
