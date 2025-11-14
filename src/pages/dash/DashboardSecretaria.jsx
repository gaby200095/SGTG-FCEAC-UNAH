import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../state/AuthContext';
import './DashboardSecretaria.css';

function DashboardSecretaria() {
  const { user, call } = useAuth();

  const [active, setActive] = useState('resumen');
  const [sbOpen, setSbOpen] = useState(false);
  const [sbCollapsed, setSbCollapsed] = useState(false);

  const [perfil, setPerfil] = useState({
    nombre: '',
    correo: user?.correo || '',
    telefono: '',
    avatar: null,
    avatarUrl: '',
  });

  const [nombre, setNombre] = useState('');

  const [filtroEstado, setFiltroEstado] = useState('');
  const [busqueda, setBusqueda] = useState('');

  const [_expedientes, _setExpedientes] = useState([]);
  const [_busqueda, _setBusqueda] = useState('');
  const [_cargando, _setCargando] = useState(false);
  const [_error, _setError] = useState('');

  const kpis = [
    { k: 'Expedientes', v: _expedientes.length, d: 'Total en sistema' },
  ];

  const sections = [
    { key: 'resumen', label: 'Resumen' },
    { key: 'expedientes', label: 'Consulta de Expedientes' },
    { key: 'exportar', label: 'Reportes' },
    { key: 'config', label: 'Configuración' },
    { key: 'ayuda', label: 'Ayuda' }
  ];

  const GoSeccion = (key) => {
    setActive(key);
    setSbOpen(false);
    setSbCollapsed(false);
    try { window.location.hash = `#sec=${key}`; } catch {}
  };

  useEffect(() => {
    const onToggle = () => {
      const isMobile = window.matchMedia('(max-width: 992px)').matches;
      if (isMobile) setSbOpen(v => !v); else setSbCollapsed(v => !v);
    };
    window.addEventListener('sec:toggleSidebar', onToggle);
    return () => window.removeEventListener('sec:toggleSidebar', onToggle);
  }, []);

  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    els.forEach(el => el.classList.add('visible'));
  }, []);
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    els.forEach(el => el.classList.add('visible'));
    try { document.querySelector('.sec-main')?.scrollTo({ top: 0, behavior: 'smooth' }); } catch {}
  }, [active]);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        if (user?.id_usuario) {
          const rUser = await call('/table/usuario_sistema?limit=500');
          if (rUser.ok) {
            const rows = await rUser.json();
            const u = rows.find(x => x.id_usuario === user.id_usuario);
            if (u) {
              const n = u.nombre_usuario || u.nombre || '';
              const a = u.apellido_usuario || u.apellido || '';
              if (!cancel) setNombre(`${n} ${a}`.trim() || (user.correo?.split('@')[0] || 'Secretaría General'));
            } else {
              if (!cancel) setNombre(user.correo?.split('@')[0] || 'Secretaría General');
            }
          }
        }
      } catch {
        if (!cancel) setNombre(user?.correo?.split('@')[0] || 'Secretaría General');
      }
    })();
    return () => { cancel = true; };
  }, [call, user]);

  const ExportarArchivo = async (_tipo, _formato = 'excel') => {
    const _base = 'http://localhost:5001';
    const _ext = _formato === 'pdf' ? 'pdf' : 'excel';
    const _url = `${_base}/api/reportes/${_tipo}/${_ext}`;
    const _enlace = document.createElement('a');
    _enlace.href = _url;
    _enlace.target = '_blank';
    _enlace.click();
  };

  const ObtenerBase = () => {
    const _base = import.meta?.env?.VITE_API_BASE || process.env.REACT_APP_API_BASE || 'http://localhost:5001';
    return _base.replace(/\/+$/, '');
  };

  const CargarExpedientes = async () => {
    try {
      _setCargando(true);
      _setError('');
      const _base = ObtenerBase();
      const _token = localStorage.getItem('token');
      const _headers = _token ? { Authorization: `Bearer ${_token}` } : {};
      const _res = await fetch(`${_base}/api/expedientes`, { headers: _headers, credentials: 'include' });
      if (!_res.ok) throw new Error('No se pudo cargar');
      const _json = await _res.json();
      _setExpedientes(Array.isArray(_json) ? _json : []);
    } catch {
      _setError('No se pudieron cargar los expedientes');
      _setExpedientes([]);
    } finally {
      _setCargando(false);
    }
  };

  const FiltrarExpedientes = (_lista) => {
    const _q = (_busqueda || '').toLowerCase().trim();
    if (!_q) return _lista;
    return _lista.filter(_x =>
      String(_x.id_expediente || '').includes(_q) ||
      String(_x.id_usuario || '').includes(_q) ||
      String(_x.nombre || '').toLowerCase().includes(_q) ||
      String(_x.carrera || '').toLowerCase().includes(_q) ||
      String(_x.estado || '').toLowerCase().includes(_q)
    );
  };

  useEffect(() => {
    if (active === 'expedientes') CargarExpedientes();
  }, [active]);

  const uniqueEstados = useMemo(() => {
    return Array.from(
      new Set(
        (_expedientes || []).map(e => String(e.estado || '').toLowerCase()).filter(Boolean)
      )
    );
  }, [_expedientes]);

  const filtrados = useMemo(() => {
    return (_expedientes || [])
      .filter(e => !filtroEstado || String(e.estado || '').toLowerCase() === filtroEstado)
      .filter(e => {
        if (!busqueda.trim()) return true;
        const q = busqueda.toLowerCase();
        return (
          String(e.nombre || '').toLowerCase().includes(q) ||
          String(e.carrera || e.nombre_carrera || '').toLowerCase().includes(q) ||
          String(e.id_usuario || '').toLowerCase().includes(q) ||
          String(e.id_expediente || '').toLowerCase().includes(q)
        );
      });
  }, [_expedientes, filtroEstado, busqueda]);

  const ColorEstado = (est) => {
    const map = { aprobado: '#16a34a', pendiente: '#92400e', rechazado: '#dc2626', en_proceso: '#1e3a8a' };
    return map[String(est || '').toLowerCase()] || '#334155';
  };

  const PuedeAutorizar = (row) => String(row.estado || '').toLowerCase() === 'aprobado';

  const ManejarPerfilSubmit = (e) => {
    e.preventDefault();
    setToast({ show: true, msg: 'Perfil actualizado correctamente.', type: 'success' });
  };

  const [toast, setToast] = useState({ show: false, msg: '', type: 'success' });

  useEffect(() => {
    if (toast.show) {
      const t = setTimeout(() => setToast({ ...toast, show: false }), 2500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const ManejarAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPerfil(p => {
      if (p.avatarUrl) URL.revokeObjectURL(p.avatarUrl);
      return { ...p, avatar: file, avatarUrl: url };
    });
  };

  const QuitarAvatar = () => {
    setPerfil(p => {
      if (p.avatarUrl) URL.revokeObjectURL(p.avatarUrl);
      return { ...p, avatar: null, avatarUrl: '' };
    });
  };

  useEffect(() => {
    setPerfil(p => ({ ...p, nombre: nombre || '' }));
  }, [nombre]);

  const ManejarPerfilChange = (e) => {
    const { name, value } = e.target;
    setPerfil(p => ({ ...p, [name]: value }));
  };

  return (
    <div className="sec-shell">
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

      <aside className={`sec-sidebar ${sbOpen ? 'open' : ''} ${sbCollapsed ? 'collapsed' : ''}`}>
        <div className="sb-header">
          <div className="sb-title">Secretaría</div>
          <button className="sb-close" onClick={() => setSbOpen(false)} aria-label="Cerrar menú">×</button>
        </div>
        <nav className="sb-nav">
          {sections.map(s => (
            <button
              key={s.key}
              className={`sb-item ${active === s.key ? 'active' : ''}`}
              onClick={() => GoSeccion(s.key)}
            >
              <span className="sb-dot" />
              <span className="sb-text">{s.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="sec-main">
        <div className="sec-main-top">
          <div className="sec-head">
            {active === 'resumen' && (
              <p className="sec-subtitle">
                Bienvenida/o <strong>Oscar Emanuel Martinez Medina</strong>
              </p>
            )}
          </div>
        </div>

        {active === 'resumen' && (
          <>
            <section className="sec-card reveal">
              <div className="sec-card__header"><div className="sec-card__title">Resumen general</div></div>
              <div className="sec-card__body">
                <div className="sec-widgets">
                  {kpis.map((k, i) => (
                    <div className="wg" key={i}>
                      <div className="wg-k">{k.k}</div>
                      <div className="wg-v">{k.v}</div>
                      <div className="wg-meta">{k.d}</div>
                    </div>
                  ))}
                </div>
                <div className="sec-note" style={{ marginTop: 12 }}>
                  Usa el menú lateral para navegar entre expedientes y reportes.
                </div>
              </div>
            </section>
          </>
        )}

        {active === 'expedientes' && (
          <section className="sec-card reveal">
            <div className="sec-card__header">
              <div className="sec-card__title">Expedientes</div>
            </div>
            <div className="sec-card__body">
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                <input
                  value={_busqueda}
                  onChange={e => _setBusqueda(e.target.value)}
                  placeholder="Buscar por expediente, usuario, nombre, carrera o estado"
                  className="lt-input"
                  style={{ minWidth: 280 }}
                />
                <button className="lt-btn" onClick={CargarExpedientes}>Actualizar</button>
              </div>

              {_cargando && <div className="sec-note">Cargando expedientes…</div>}
              {_error && <div className="sec-note" style={{ color: '#b91c1c' }}>{_error}</div>}

              {!_cargando && !_error && (
                <div className="tabla-responsiva" style={{ overflowX: 'auto' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>ID Expediente</th>
                        <th>ID Usuario</th>
                        <th>Nombre</th>
                        <th>Carrera</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {FiltrarExpedientes(_expedientes).map((_r, _i) => (
                        <tr key={_i}>
                          <td>{_r.id_expediente}</td>
                          <td>{_r.id_usuario}</td>
                          <td>{_r.nombre}</td>
                          <td>{_r.carrera}</td>
                          <td>{_r.estado}</td>
                        </tr>
                      ))}
                      {FiltrarExpedientes(_expedientes).length === 0 && (
                        <tr><td colSpan={5} style={{ textAlign: 'center', padding: '12px 0' }}>Sin resultados</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}

        {active === 'exportar' && (
          <section className="sec-card reveal">
            <div className="sec-card__header"><div className="sec-card__title">Exportar certificaciones y reportes</div></div>
            <div className="sec-card__body">
              <div className="sec-note" style={{ marginBottom: 10 }}>
                Descarga reportes globales de expedientes en formato Excel/CSV.
              </div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <button className="lt-btn lt-primary" onClick={() => ExportarArchivo('expedientes')}>Exportar expedientes</button>
                <button className="lt-btn lt-primary" onClick={() => ExportarArchivo('graduaciones')}>Exportar graduaciones (Excel)</button>
                <button className="lt-btn lt-primary" onClick={() => ExportarArchivo('graduaciones', 'pdf')}>Exportar graduaciones (PDF)</button>
              </div>
            </div>
          </section>
        )}

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
                onSubmit={ManejarPerfilSubmit}
              >
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    width: 90, height: 90, borderRadius: '50%',
                    background: '#e0e7ef', color: '#1e40af', fontWeight: 900,
                    fontSize: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px',
                    backgroundImage: perfil.avatarUrl ? `url(${perfil.avatarUrl})` : undefined,
                    backgroundSize: 'cover', backgroundPosition: 'center'
                  }}>
                    {!perfil.avatarUrl && (perfil.nombre?.charAt(0)?.toUpperCase() || 'S')}
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <label style={{
                      display: 'inline-block', background: '#2563eb', color: '#fff', borderRadius: 8,
                      padding: '6px 16px', fontWeight: 700, fontSize: 14, cursor: 'pointer', marginRight: 8
                    }}>
                      Cambiar foto
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={ManejarAvatarChange} />
                    </label>
                    {perfil.avatarUrl && (
                      <button
                        type="button"
                        style={{
                          background: '#e11d48', color: '#fff', border: 'none', borderRadius: 8,
                          padding: '6px 16px', fontWeight: 700, fontSize: 14, cursor: 'pointer'
                        }}
                        onClick={QuitarAvatar}
                      >
                        Quitar foto
                      </button>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                    Formato JPG o PNG. Tamaño máximo recomendado: 1MB.
                  </div>
                </div>
                <div>
                  <label style={{ fontWeight: 700, color: '#1e293b', fontSize: 14 }}>Nombre completo</label>
                  <input
                    type="text"
                    name="nombre"
                    value={perfil.nombre}
                    onChange={ManejarPerfilChange}
                    placeholder="Nombre completo"
                    className="input-compact"
                    style={{ marginTop: 4, width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ fontWeight: 700, color: '#1e293b', fontSize: 14 }}>Correo institucional</label>
                  <input
                    type="email"
                    name="correo"
                    value={perfil.correo}
                    onChange={ManejarPerfilChange}
                    placeholder="correo@unah.edu.hn"
                    className="input-compact"
                    style={{ marginTop: 4, width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ fontWeight: 700, color: '#1e293b', fontSize: 14 }}>Teléfono</label>
                  <input
                    type="tel"
                    name="telefono"
                    value={perfil.telefono}
                    onChange={ManejarPerfilChange}
                    placeholder="Ej. 9999-9999"
                    className="input-compact"
                    style={{ marginTop: 4, width: '100%' }}
                  />
                </div>
                <button type="submit" className="lt-btn lt-primary" style={{ width: '100%', fontWeight: 700 }}>
                  Guardar cambios
                </button>
              </form>
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
                    {!perfil.avatarUrl && (perfil.nombre?.charAt(0)?.toUpperCase() || 'S')}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#1e293b', fontSize: 15 }}>{perfil.nombre || 'Nombre Secretaría'}</div>
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

        {active === 'ayuda' && (
          <section className="sec-card reveal">
            <div className="sec-card__header"><div className="sec-card__title">Ayuda y guía del panel</div></div>
            <div className="sec-card__body">
              <div className="sec-note" style={{ marginBottom: 10 }}>
                Consulta aquí cómo usar el panel, validar expedientes y exportar reportes.
              </div>
              <div style={{ background: '#e0f2fe', border: '1px solid #bae6fd', borderRadius: 10, padding: '1rem', marginBottom: 12 }}>
                <div style={{ fontWeight: 700, color: '#0369a1', marginBottom: 6 }}>¿Cómo usar el panel?</div>
                <ol style={{ margin: 0, paddingLeft: '1.2em', color: '#334155', fontSize: 14 }}>
                  <li>En <b>Expedientes</b> puedes validar y autorizar actas.</li>
                  <li>En <b>Exportar</b> descarga reportes y certificaciones.</li>
                  <li>En <b>Configuración</b> puedes personalizar tu perfil institucional.</li>
                </ol>
              </div>
              <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 10, padding: '1rem' }}>
                <div style={{ fontWeight: 700, color: '#b45309', marginBottom: 6 }}>Preguntas frecuentes</div>
                <details style={{ marginBottom: 6 }}>
                  <summary style={{ cursor: 'pointer', color: '#b45309', fontWeight: 700 }}>¿Cómo autorizo un acta?</summary>
                  <div style={{ color: '#7c4700', fontSize: 14, marginTop: 2 }}>Solo cuando todos los requisitos estén completados y el expediente esté en estado "aprobado".</div>
                </details>
                <details style={{ marginBottom: 6 }}>
                  <summary style={{ cursor: 'pointer', color: '#b45309', fontWeight: 700 }}>¿Puedo exportar todos los expedientes?</summary>
                  <div style={{ color: '#7c4700', fontSize: 14, marginTop: 2 }}>Sí, desde la sección Exportar puedes descargar reportes globales.</div>
                </details>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default DashboardSecretaria;
