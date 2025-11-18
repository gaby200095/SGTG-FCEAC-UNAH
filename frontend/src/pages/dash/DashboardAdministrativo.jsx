import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../state/AuthContext";
import "./DashboardSecretaria.css";
import "./DashboardAdministrativo.css";

/** Mapea nombre→clave y clave→requisitos esperados */
const CAREER_KEY = (name = "") => {
  const n = (name || "").toUpperCase();
  if (n.includes("INFORMÁTICA")) return "INF";
  if (n.includes("ADUAN")) return "ADU";
  if (n.includes("ECONOM")) return "ECO";
  return "OTR";
};

const MAX_REQ_BY_CAREER = {
  INF: 19, // Licenciatura en Informática Administrativa
  ADU: 18, // Licenciatura en Aduanas
  ECO: 18, // Licenciatura en Economía
  OTR: 18, // fallback
};

const pretty = (v) => (Number.isFinite(v) ? v : 0);

/** ---------- MOCK helpers (solo visual) ---------- **/
function mockCareerRows() {
  return [
    {
      carrera: "Licenciatura en Informática Administrativa",
      estudiantes: 13,
      breakdown: { Pendiente: 120, "En Proceso": 40, Cumplido: 60, Rechazado: 5 },
      ultima_actualizacion: "2025-10-15T12:12:00Z",
      activos: true,
    },
    {
      carrera: "Licenciatura en Aduanas",
      estudiantes: 8,
      breakdown: { Pendiente: 70, "En Proceso": 20, Cumplido: 45, Rechazado: 2 },
      ultima_actualizacion: "2025-10-15T12:05:00Z",
      activos: true,
    },
    {
      carrera: "Licenciatura en Economía",
      estudiantes: 15,
      breakdown: { Pendiente: 90, "En Proceso": 30, Cumplido: 38, Rechazado: 1 },
      ultima_actualizacion: "2025-10-14T17:40:00Z",
      activos: false,
    },
  ];
}

/** Detalle por estudiante (mock) */
function mockStudentsForCareer(careerKey) {
  const base = [
    { id_usuario: 101, nombre: "Ana", estadoExp: "activo" },
    { id_usuario: 102, nombre: "Luis", estadoExp: "activo" },
    { id_usuario: 103, nombre: "María", estadoExp: "inactivo" },
    { id_usuario: 104, nombre: "José", estadoExp: "activo" },
    { id_usuario: 105, nombre: "Karla", estadoExp: "activo" },
  ];
  // Ajuste simple por carrera para que varíe un poco
  const reqMax = MAX_REQ_BY_CAREER[careerKey] ?? 18;
  return base.map((u, idx) => {
    const pend = Math.max(0, (reqMax - 5) - (idx % 4));
    const proc = (idx % 3);
    const comp = Math.min(reqMax, 5 + idx);
    const rech = idx % 2 === 0 ? 0 : 1;
    const total = pend + proc + comp + rech;
    const pct = Math.round((comp / (reqMax)) * 100);
    return {
      ...u,
      requisitosEsperados: reqMax,
      pendiente: pend,
      enProceso: proc,
      cumplido: comp,
      rechazado: rech,
      total,
      porcentaje: pct,
      ultima: new Date(Date.now() - 1000 * 60 * (idx + 1)).toISOString(),
    };
  });
}
/** ---------------------------------------------- **/

const DashboardAdministrativo = () => {
  const { call, user } = useAuth();

  // Sidebar y navegación
  const [active, setActive] = useState('resumen');
  const [sbOpen, setSbOpen] = useState(false);
  const [sbCollapsed, setSbCollapsed] = useState(false);

  // Data global
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rows, setRows] = useState([]);

  // Modal detalle
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailCareer, setDetailCareer] = useState(null);
  const [detailRows, setDetailRows] = useState([]);

  // Toast de confirmación
  const [toast, setToast] = useState({ show: false, msg: '', type: 'success' });

  // Sidebar sections
  const sections = [
    { key: 'resumen', label: 'Resumen' },
    { key: 'expedientes', label: 'Expedientes' },
    { key: 'carreras', label: 'Carreras' },
    { key: 'actas', label: 'Actas de graduación' },
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
    try { window.location.hash = `#adm=${key}`; } catch {}
  };

  // Handler para la hamburguesa del navbar
  const handleHamburger = () => {
    const isMobile = window.matchMedia('(max-width: 992px)').matches;
    if (isMobile) setSbOpen(v => !v);
    else setSbCollapsed(v => !v);
  };

  // Responsive sidebar toggle
  useEffect(() => {
    const onToggle = () => {
      const isMobile = window.matchMedia('(max-width: 992px)').matches;
      if (isMobile) setSbOpen(v => !v); else setSbCollapsed(v => !v);
    };
    window.addEventListener('adm:toggleSidebar', onToggle);
    return () => window.removeEventListener('adm:toggleSidebar', onToggle);
  }, []);

  // Reveal animación
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    els.forEach(el => el.classList.add('visible'));
  }, []);
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    els.forEach(el => el.classList.add('visible'));
    try { document.querySelector('.adm-main')?.scrollTo({ top: 0, behavior: 'smooth' }); } catch {}
  }, [active]);

  /** Carga desde el backend (si existe) o simulado */
  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        // Intenta endpoint real; si no existe, usa mock
        const r = await call("/admin/avance-carreras");
        if (r.ok) {
          const data = await r.json();
          if (!cancel) setRows(Array.isArray(data) ? data : []);
        } else {
          if (!cancel) setRows(mockCareerRows());
        }
      } catch {
        if (!cancel) setError("No se pudo cargar el avance global.");
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [call]);

  /** Normaliza filas + aplica reglas de requisitos por carrera */
  const normalized = useMemo(() => {
    return (rows || []).map((r) => {
      const key = CAREER_KEY(r.carrera);
      const reqEsperados = MAX_REQ_BY_CAREER[key] ?? MAX_REQ_BY_CAREER.OTR;

      const requisitos =
        Number.isFinite(r.requisitos) && r.requisitos > 0 ? r.requisitos : reqEsperados;

      const estudiantes = pretty(r.estudiantes);
      const paresTeoricos = estudiantes * requisitos; // total de pares usuario×requisito

      const bd = r.breakdown || {};
      const completos = pretty(bd.Cumplido ?? bd.Completado);
      const pendientes = pretty(bd.Pendiente);
      const enProceso = pretty(bd["En Proceso"]);
      const rechazados = pretty(bd.Rechazado);

      const porcentaje =
        paresTeoricos > 0 ? Math.round((completos / paresTeoricos) * 100) : 0;

      return {
        carrera: r.carrera || "—",
        key,
        estudiantes,
        requisitos,
        pares: paresTeoricos,
        breakdown: {
          Pendiente: pendientes,
          "En Proceso": enProceso,
          Cumplido: completos,
          Rechazado: rechazados,
        },
        porcentaje,
        ultima_actualizacion: r.ultima_actualizacion || null,
        activos: !!r.activos,
      };
    });
  }, [rows]);

  // Filtros para la tabla (faltaba soloActivos y q)
  const [soloActivos, setSoloActivos] = useState(false);
  const [q, setQ] = useState('');

  /** Aplica filtros */
  const filtrados = useMemo(() => {
    let list = normalized;
    if (soloActivos) list = list.filter((x) => x.activos);
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      list = list.filter((x) => x.carrera.toLowerCase().includes(s));
    }
    return list;
  }, [normalized, soloActivos, q]);

  /** Helpers UI */
  const fmtDate = (iso) => {
    if (!iso) return "—";
    try {
      const d = new Date(iso);
      return d.toLocaleString();
    } catch {
      return iso;
    }
  };

  /** Exportaciones CSV */
  const exportConsolidadoCSV = () => {
    const cols = [
      "Carrera",
      "Estudiantes",
      "RequisitosPorCarrera",
      "ParesTeoricos",
      "Pendiente",
      "En Proceso",
      "Cumplido",
      "Rechazado",
      "%Avance",
      "UltimaActualizacion",
      "Activos",
    ];
    const lines = [cols.join(",")];
    filtrados.forEach((r) => {
      const row = [
        `"${r.carrera.replace(/"/g, '""')}"`,
        r.estudiantes,
        r.requisitos,
        r.pares,
        r.breakdown.Pendiente,
        r.breakdown["En Proceso"],
        r.breakdown.Cumplido,
        r.breakdown.Rechazado,
        r.porcentaje,
        `"${fmtDate(r.ultima_actualizacion)}"`,
        r.activos ? "SI" : "NO",
      ];
      lines.push(row.join(","));
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "avance_consolidado.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const exportDetalleCSV = () => {
    if (!detailOpen || !detailCareer || !detailRows.length) return;
    const cols = [
      "Carrera",
      "ID Usuario",
      "Nombre",
      "EstadoExpediente",
      "RequisitosEsperados",
      "Pendiente",
      "En Proceso",
      "Cumplido",
      "Rechazado",
      "%Avance",
      "UltimaActualizacion",
    ];
    const lines = [cols.join(",")];
    detailRows.forEach((r) => {
      const row = [
        `"${detailCareer.carrera.replace(/"/g, '""')}"`,
        r.id_usuario,
        `"${r.nombre.replace(/"/g, '""')}"`,
        r.estadoExp,
        r.requisitosEsperados,
        r.pendiente,
        r.enProceso,
        r.cumplido,
        r.rechazado,
        r.porcentaje,
        `"${fmtDate(r.ultima)}"`,
      ];
      lines.push(row.join(","));
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "detalle_por_carrera.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  /** Abrir/cerrar detalle */
  const openDetail = (careerRow) => {
    const mock = mockStudentsForCareer(careerRow.key);
    setDetailCareer(careerRow);
    setDetailRows(mock);
    setDetailOpen(true);
  };
  const closeDetail = () => {
    setDetailOpen(false);
    setDetailCareer(null);
    setDetailRows([]);
  };

  // Toast auto-close
  useEffect(() => {
    if (toast.show) {
      const t = setTimeout(() => setToast({ ...toast, show: false }), 2500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // Perfil/configuración
  const [perfil, setPerfil] = useState({
    nombre: '',
    correo: user?.correo || '',
    telefono: '',
    avatar: null,
    avatarUrl: '',
  });

  // Actualiza nombre en perfil cuando cambia el usuario
  useEffect(() => {
    setPerfil(p => ({
      ...p,
      nombre:
        user?.nombre_usuario ||
        user?.nombre ||
        p.nombre ||
        user?.correo?.split('@')[0] ||
        'Administrativo',
    }));
  }, [user]);

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

  return (
    <div className="sec-shell">
      {/* NAVBAR superior fijo con hamburguesa y nombre de panel */}
      {/* Elimina el navbar propio, ya que el Navbar global lo maneja */}

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
          <div className="sb-title">Administrativo</div>
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
      <main className="sec-main adm-main">
        <div className="sec-main-top">
          <div className="sec-head">
            {active === 'resumen' && (
              <p className="sec-subtitle">
                Bienvenido/a <strong>Personal Administrativo</strong>
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
                <div className="wg"><div className="wg-k">Carreras</div><div className="wg-v">{filtrados.length}</div><div className="wg-meta">En la facultad</div></div>
                <div className="wg"><div className="wg-k">Expedientes</div><div className="wg-v">{filtrados.reduce((a, c) => a + c.estudiantes, 0)}</div><div className="wg-meta">Totales</div></div>
                <div className="wg"><div className="wg-k">% Avance global</div><div className="wg-v">{filtrados.length ? Math.round(filtrados.reduce((a, c) => a + c.porcentaje, 0) / filtrados.length) : 0}%</div><div className="wg-meta">Promedio</div></div>
              </div>
              <div className="sec-note" style={{ marginTop: 12 }}>
                Usa el menú lateral para navegar entre expedientes, carreras, actas, citas y reportes.
              </div>
            </div>
          </section>
        )}

        {/* EXPEDIENTES */}
        {active === 'expedientes' && (
          <section className="sec-card reveal">
            <div className="sec-card__header">
              <div className="sec-card__title">Expedientes digitales</div>
            </div>
            <div className="sec-card__body">
              <div className="sec-note" style={{ marginBottom: 10 }}>
                Visualiza el avance y estado de los expedientes por carrera. Usa los filtros para buscar por carrera o estado.
              </div>
              <div className="list-toolbar" style={{ marginBottom: 10 }}>
                <div className="lt-left">
                  <input
                    className="lt-search"
                    placeholder="Buscar carrera…"
                    value={q}
                    onChange={e => setQ(e.target.value)}
                  />
                  <label className="chk" style={{ marginLeft: 12 }}>
                    <input
                      type="checkbox"
                      checked={soloActivos}
                      onChange={e => setSoloActivos(e.target.checked)}
                      style={{ marginRight: 6 }}
                    />
                    Solo carreras activas
                  </label>
                </div>
                <div className="lt-right">
                  <button className="lt-btn" onClick={() => { setQ(''); setSoloActivos(false); }}>Limpiar filtros</button>
                  <button className="lt-btn lt-primary" onClick={exportConsolidadoCSV}>Exportar CSV</button>
                </div>
              </div>
              {loading && <div className="hint">Cargando expedientes...</div>}
              {error && !loading && <div className="error">{error}</div>}
              {!loading && !error && (
                <div className="table-card">
                  <div className="table-wrap">
                    <table className="sec-list">
                      <thead>
                        <tr>
                          <th>Carrera</th>
                          <th>Estudiantes</th>
                          <th>Requisitos por carrera</th>
                          <th>Pares teóricos</th>
                          <th>% Avance</th>
                          <th>Pendientes</th>
                          <th>En Proceso</th>
                          <th>Completados</th>
                          <th>Rechazados</th>
                          <th>Última actualización</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtrados.length === 0 ? (
                          <tr>
                            <td colSpan={11} className="empty">No hay expedientes para mostrar.</td>
                          </tr>
                        ) : (
                          filtrados.map((r, i) => (
                            <tr key={i}>
                              <td>{r.carrera}</td>
                              <td>{r.estudiantes}</td>
                              <td>{r.requisitos}</td>
                              <td>{r.pares}</td>
                              <td>
                                <div className="meter">
                                  <div
                                    className="fill"
                                    style={{ width: `${Math.min(100, r.porcentaje)}%` }}
                                  />
                                </div>
                                <div className="small">{r.porcentaje}%</div>
                              </td>
                              <td>{r.breakdown.Pendiente}</td>
                              <td>{r.breakdown["En Proceso"]}</td>
                              <td>{r.breakdown.Cumplido}</td>
                              <td>{r.breakdown.Rechazado}</td>
                              <td>{fmtDate(r.ultima_actualizacion)}</td>
                              <td>
                                <button className="btn-hero" onClick={() => openDetail(r)}>
                                  Ver detalle
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* CARRERAS */}
        {active === 'carreras' && (
          <section className="sec-card reveal">
            <div className="sec-card__header"><div className="sec-card__title">Resumen por carreras</div></div>
            <div className="sec-card__body">
              <div className="sec-note" style={{ marginBottom: 10 }}>
                Consulta el avance y estado de los expedientes por cada carrera.
              </div>
              {/* Puedes reutilizar la tabla de expedientes aquí o mostrar un resumen visual */}
              {/* ... */}
            </div>
          </section>
        )}

        {/* ACTAS */}
        {active === 'actas' && (
          <section className="sec-card reveal">
            <div className="sec-card__header"><div className="sec-card__title">Gestión de actas de graduación</div></div>
            <div className="sec-card__body">
              <div className="sec-note" style={{ marginBottom: 10 }}>
                Controla el aforo y la logística de los eventos de graduación. Gestiona las actas y verifica la capacidad.
              </div>
              {/* Aquí iría la lógica para gestionar actas y aforo */}
              {/* ... */}
            </div>
          </section>
        )}

        {/* CITAS */}
        {active === 'citas' && (
          <section className="sec-card reveal">
            <div className="sec-card__header"><div className="sec-card__title">Citas y logística</div></div>
            <div className="sec-card__body">
              <div className="sec-note" style={{ marginBottom: 10 }}>
                Visualiza y coordina todas las citas para evitar sobrecarga en horarios.
              </div>
              {/* Aquí iría la tabla de citas */}
              {/* ... */}
            </div>
          </section>
        )}

        {/* REPORTES */}
        {active === 'reportes' && (
          <section className="sec-card reveal">
            <div className="sec-card__header"><div className="sec-card__title">Reportes globales</div></div>
            <div className="sec-card__body">
              <div className="sec-note" style={{ marginBottom: 10 }}>
                Descarga reportes consolidados de todas las carreras y expedientes.
              </div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <button className="lt-btn lt-primary" onClick={() => setToast({ show: true, msg: 'Reporte descargado (simulado)', type: 'success' })}>Exportar avance</button>
                <button className="lt-btn lt-primary" onClick={() => setToast({ show: true, msg: 'Reporte de citas descargado (simulado)', type: 'success' })}>Exportar citas</button>
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
                Personaliza tu perfil institucional. Esta información será visible para los estudiantes y coordinación.
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
                    background: '#e0e7ef', color: '#22c55e', fontWeight: 900,
                    fontSize: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px',
                    backgroundImage: perfil.avatarUrl ? `url(${perfil.avatarUrl})` : undefined,
                    backgroundSize: 'cover', backgroundPosition: 'center'
                  }}>
                    {!perfil.avatarUrl && (perfil.nombre?.charAt(0)?.toUpperCase() || 'A')}
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <label style={{
                      display: 'inline-block', background: '#22c55e', color: '#fff', borderRadius: 8,
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
                  <label style={{ fontWeight: 700, color: '#0b2a5b', fontSize: 14 }}>Nombre completo</label>
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
                  <label style={{ fontWeight: 700, color: '#0b2a5b', fontSize: 14 }}>Correo institucional</label>
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
                  <label style={{ fontWeight: 700, color: '#0b2a5b', fontSize: 14 }}>Teléfono</label>
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
                <div style={{ fontWeight: 700, color: '#22c55e', marginBottom: 8, fontSize: 16 }}>
                  Vista previa del perfil público
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                  <div style={{
                    width: 60, height: 60, borderRadius: '50%',
                    background: '#e0e7ef', color: '#22c55e', fontWeight: 900,
                    fontSize: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backgroundImage: perfil.avatarUrl ? `url(${perfil.avatarUrl})` : undefined,
                    backgroundSize: 'cover', backgroundPosition: 'center'
                  }}>
                    {!perfil.avatarUrl && (perfil.nombre?.charAt(0)?.toUpperCase() || 'A')}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#0b2a5b', fontSize: 15 }}>{perfil.nombre || 'Nombre Administrativo'}</div>
                    <div style={{ color: '#22c55e', fontSize: 13 }}>{perfil.correo || 'correo@unah.edu.hn'}</div>
                    <div style={{ color: '#64748b', fontSize: 13 }}>{perfil.telefono || 'Teléfono'}</div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>
                  Así verán los estudiantes y coordinación tu perfil cuando reciban mensajes o comunicados.
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
                Consulta aquí cómo usar el panel, gestionar expedientes, actas, citas y reportes.
              </div>
              <div style={{ background: '#e0f2fe', border: '1px solid #bae6fd', borderRadius: 10, padding: '1rem', marginBottom: 12 }}>
                <div style={{ fontWeight: 700, color: '#0369a1', marginBottom: 6 }}>¿Cómo usar el panel?</div>
                <ol style={{ margin: 0, paddingLeft: '1.2em', color: '#334155', fontSize: 14 }}>
                  <li>Revisa el <b>Resumen</b> para ver indicadores globales.</li>
                  <li>En <b>Expedientes</b> puedes ver todos los expedientes de la facultad.</li>
                  <li>En <b>Carreras</b> consulta el avance por carrera.</li>
                  <li>En <b>Actas</b> gestiona la logística y aforo de los eventos.</li>
                  <li>En <b>Citas</b> coordina la logística y evita sobrecarga.</li>
                  <li>En <b>Reportes</b> descarga reportes globales.</li>
                  <li>En <b>Configuración</b> puedes personalizar tu perfil institucional.</li>
                </ol>
              </div>
              <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 10, padding: '1rem' }}>
                <div style={{ fontWeight: 700, color: '#b45309', marginBottom: 6 }}>Preguntas frecuentes</div>
                <details style={{ marginBottom: 6 }}>
                  <summary style={{ cursor: 'pointer', color: '#b45309', fontWeight: 700 }}>¿Cómo exporto reportes?</summary>
                  <div style={{ color: '#7c4700', fontSize: 14, marginTop: 2 }}>Desde la sección Reportes puedes descargar información consolidada.</div>
                </details>
                <details>
                  <summary style={{ cursor: 'pointer', color: '#b45309', fontWeight: 700 }}>¿Cómo gestiono el aforo?</summary>
                  <div style={{ color: '#7c4700', fontSize: 14, marginTop: 2 }}>En Actas puedes controlar la capacidad y logística del evento.</div>
                </details>
              </div>
            </div>
          </section>
        )}

        {/* Modal detalle por carrera */}
        {detailOpen && detailCareer && (
          <div className="modal-backdrop" onClick={closeDetail}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal__header">
                <div>
                  <div className="modal__title">Detalle por carrera</div>
                  <div className="modal__subtitle">
                    {detailCareer.carrera} — {detailRows.length} estudiante(s)
                  </div>
                </div>
                <button className="btn-ghost" onClick={closeDetail}>Cerrar</button>
              </div>
              <div className="modal__actions">
                <button className="btn-primary" onClick={() => {/* export detalle */}}>Exportar Excel (Detalle)</button>
              </div>
              <div className="table-wrap modal__table">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Usuario</th>
                      <th>Nombre</th>
                      <th>Estado expediente</th>
                      <th>Req. esperados</th>
                      <th>Pendientes</th>
                      <th>En Proceso</th>
                      <th>Completados</th>
                      <th>Rechazados</th>
                      <th>% Avance</th>
                      <th>Última actualización</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailRows.map((s) => (
                      <tr key={s.id_usuario}>
                        <td>#{s.id_usuario}</td>
                        <td>{s.nombre}</td>
                        <td>{s.estadoExp}</td>
                        <td>{s.requisitosEsperados}</td>
                        <td>{s.pendiente}</td>
                        <td>{s.enProceso}</td>
                        <td>{s.cumplido}</td>
                        <td>{s.rechazado}</td>
                        <td>
                          <div className="meter meter--sm">
                            <div className="fill" style={{ width: `${Math.min(100, s.porcentaje)}%` }} />
                          </div>
                          <div className="small">{s.porcentaje}%</div>
                        </td>
                        <td>{(new Date(s.ultima)).toLocaleString()}</td>
                      </tr>
                    ))}
                    {detailRows.length === 0 && (
                      <tr>
                        <td colSpan={10} className="empty">
                          Sin estudiantes para mostrar.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default DashboardAdministrativo;
