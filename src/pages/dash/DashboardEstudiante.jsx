// frontend/src/pages/dash/DashboardEstudiante.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../state/AuthContext';
import { useHistory } from 'react-router-dom';
import './DashboardEstudiante.css';
import DashboardExpediente, { REQUISITOS_BASE } from './DashboardExpediente';

function DashboardEstudiante() {
  const { user, call, logout } = useAuth();
  const history = useHistory();

  // Estado base
  const [cargando, setCargando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [nombreMostrar, setNombreMostrar] = useState('');
  const [expedientes, setExpedientes] = useState([]);
  const [seleccionExp, setSeleccionExp] = useState(null);

  // Sidebar y navegación
  // Siempre inicia en 'resumen' salvo que el hash indique otra sección
  const [active, setActive] = useState(() => {
    if (typeof window !== 'undefined') {
      const m = (window.location.hash || '').match(/panel=([a-z_]+)/i);
      return m && m[1] ? m[1] : 'resumen';
    }
    return 'resumen';
  });
  const [sbOpen, setSbOpen] = useState(false);
  const [sbCollapsed, setSbCollapsed] = useState(false);

  // Mis requisitos (compacto)
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [selected, setSelected] = useState({});
  const [allChecked, setAllChecked] = useState(false);

  // Documentos (demo local)
  const [docs, setDocs] = useState([
    { key:'id', name:'Identificación (DNI)', required:true, file:null, size:0, status:'pendiente' },
    { key:'carta', name:'Carta de compromiso', required:true, file:null, size:0, status:'pendiente' },
    { key:'cert', name:'Certificación de estudios', required:true, file:null, size:0, status:'pendiente' },
    { key:'pago', name:'Comprobante de pago', required:false, file:null, size:0, status:'pendiente' }
  ]);
  const onPickDoc = (idx, f) => {
    if (!f) return;
    setDocs(list => {
      const arr = [...list];
      arr[idx] = { ...arr[idx], file:f, size:f.size, status:'enviado' };
      return arr;
    });
  };
  const removeDoc = (idx) => {
    setDocs(list => {
      const arr = [...list];
      arr[idx] = { ...arr[idx], file:null, size:0, status:'pendiente' };
      return arr;
    });
  };

  // Observaciones (con autor/rol)
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [obs, setObs] = useState([
    { id:1, titulo:'Ajustar formato de carta', detalle:'La carta de compromiso tiene fecha incompleta.', fecha: new Date().toISOString(), leida:false, autor:{ nombre:'Lic. Pérez', rol:'Coordinación' } },
    { id:2, titulo:'Documento legible', detalle:'Sube identificación con mejor resolución.', fecha: new Date(Date.now()-86400000).toISOString(), leida:true, autor:{ nombre:'Msc. Gómez', rol:'Revisor de Carrera' } }
  ]);
  const toggleObsRead = (id) => setObs(arr => arr.map(o => o.id===id ? { ...o, leida:!o.leida } : o));

  // Citas y mensajes
  const [citas, setCitas] = useState([]);
  const [citaForm, setCitaForm] = useState({ fecha:'', hora:'', tema:'' });
  const addCita = (e) => {
    e?.preventDefault?.();
    if (!citaForm.fecha || !citaForm.hora || !citaForm.tema.trim()) return;
    setCitas(list => [...list, { ...citaForm, id: Date.now() }]);
    setCitaForm({ fecha:'', hora:'', tema:'' });
  };
  const [msgs, setMsgs] = useState([{ id:1, de:'coordinacion', txt:'Bienvenido al SGTG. ¿En qué podemos ayudarte?', ts: Date.now()-3600000 }]);
  const [msgInput, setMsgInput] = useState('');
  const sendMsg = () => {
    if (!msgInput.trim()) return;
    setMsgs(list => [...list, { id:Date.now(), de:'yo', txt:msgInput.trim(), ts: Date.now() }]);
    setMsgInput('');
  };

  // Configuración
  const [perfil, setPerfil] = useState({ nombre:'', telefono:'', notifEmail:true, notifApp:false });
  const [pwd, setPwd] = useState({ a:'', b:'' });
  const [avatarUrl, setAvatarUrl] = useState(null);
  const pwdStrong = (s='') => s.length>=8 && /\d/.test(s) && /[^A-Za-z0-9\s]/.test(s);
  const savePerfil = (e) => { e?.preventDefault?.(); alert('Preferencias guardadas (local)'); };
  const changePwd = (e) => { e?.preventDefault?.(); if (!pwdStrong(pwd.a) || pwd.a !== pwd.b) return; alert('Contraseña actualizada (mock local)'); setPwd({ a:'', b:'' }); };
  const onPickAvatar = (file) => { if (!file) return; const url = URL.createObjectURL(file); setAvatarUrl(prev => { if (prev) URL.revokeObjectURL(prev); return url; }); };

  // Friendly name (prioriza nombre/apellido; fallback: correo localStorage)
  const friendlyName = useMemo(() => {
    const safe = (v='') => String(v||'').trim();
    const ls = (()=>{ try { return JSON.parse(localStorage.getItem('user')||'{}'); } catch { return {}; } })();
    const n = safe(nombreMostrar) || safe(ls?.nombre) || safe(ls?.nombre_usuario);
    const a = safe(ls?.apellido) || safe(ls?.apellido_usuario);
    const fb = safe(ls?.correo?.split('@')[0]) || 'Estudiante';
    return (safe(`${n} ${a}`) || fb);
  }, [nombreMostrar]);

  // Soft refresh de datos (usuario + expediente) sin recargar
  const loadUserAndExpedientes = async (light = false) => {
    if (!user?.id_usuario) {
      setError('No hay sesión activa. Inicia sesión nuevamente.');
      return;
    }
    try {
      if (light) setRefreshing(true); else setCargando(true);
      setError(null);
      // Usuario
      const rUser = await call(`/table/usuario_sistema?limit=500`);
      if (rUser.status === 401 || rUser.status === 403) {
        setError('Sesión expirada. Por favor, inicia sesión nuevamente.');
        await logout();
        setTimeout(() => window.location.assign('/login'), 1200);
        return;
      }
      if (!rUser.ok) throw new Error('Error al obtener usuario');
      const rows = await rUser.json();
      const u = rows.find((x) => x.id_usuario === user.id_usuario);
      if (u) {
        const n = u.nombre_usuario || u.nombre || '';
        const a = u.apellido_usuario || u.apellido || '';
        setNombreMostrar(`${n} ${a}`.trim());
      } else {
        setNombreMostrar(user.correo?.split('@')[0] || 'Estudiante');
      }
      // Expedientes
      const rExp = await call(`/table/expediente_digital?limit=500`);
      if (rExp.status === 401 || rExp.status === 403) {
        setError('Sesión expirada. Por favor, inicia sesión nuevamente.');
        await logout();
        setTimeout(() => window.location.assign('/login'), 1200);
        return;
      }
      if (!rExp.ok) throw new Error('Error al obtener expediente');
      let rowsExp = await rExp.json();
      const propios = rowsExp.filter((ex) => ex.id_usuario === user.id_usuario);
      setExpedientes(propios);
      setSeleccionExp((prev) => prev || propios[0] || null);
    } catch (e) {
      console.error('Error al cargar expediente:', e);
      setError('No se pudo cargar la información del expediente. Verifica tu conexión o vuelve a intentarlo.');
    } finally {
      if (light) setRefreshing(false); else setCargando(false);
    }
  };
  useEffect(() => { loadUserAndExpedientes(false); }, [user, call]);

  // Al montar: si el hash no indica sección, forzar 'resumen' y cargar datos
  useEffect(() => {
    const m = (window.location.hash || '').match(/panel=([a-z_]+)/i);
    if (!m || !m[1]) setActive('resumen');
    loadUserAndExpedientes(false);
  }, []); // eslint-disable-line

  // Navegación por secciones: guarda hash, refresca datos (soft), cierra sidebar en móvil
  const goSection = async (key) => {
    setActive(key);
    try { window.location.hash = `#panel=${key}`; } catch {}
    await loadUserAndExpedientes(true);
    const isMobile = window.matchMedia('(max-width: 992px)').matches;
    if (isMobile) setSbOpen(false);
  };
  const handleIrAExpedientes = () => goSection('documentos');

  // Toggle sidebar desde navbar
  useEffect(() => {
    const onToggle = () => {
      const isMobile = window.matchMedia('(max-width: 992px)').matches;
      if (isMobile) setSbOpen(v => !v); else setSbCollapsed(v => !v);
    };
    window.addEventListener('est:toggleSidebar', onToggle);
    return () => window.removeEventListener('est:toggleSidebar', onToggle);
  }, []);

  // Reveal estable
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    els.forEach(el => el.classList.add('visible'));
  }, []);
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    els.forEach(el => el.classList.add('visible'));
    try { document.querySelector('.est-main')?.scrollTo({ top: 0, behavior: 'smooth' }); } catch {}
  }, [active]);

  // Datos base para KPIs y “Mis requisitos” (compacto)
  const baseRows = (Array.isArray(REQUISITOS_BASE) ? REQUISITOS_BASE : []).map((r, i) => ({
    id: r.id ?? (i + 1),
    titulo: r.nombre || `Requisito ${i+1}`,
    estado: 'pendiente',
    comentarios: 0,
    actualizado: null
  }));
  const norm = (s='') => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const rows = baseRows
    .filter(r => !estadoFilter || r.estado === estadoFilter)
    .filter(r => !searchTerm.trim() || norm(r.titulo).includes(norm(searchTerm)));
  const total = baseRows.length;
  const toggleAll = () => {
    const nv = !allChecked;
    setAllChecked(nv);
    setSelected(nv ? rows.reduce((acc, r) => (acc[r.id] = true, acc), {}) : {});
  };
  const toggleOne = (id) => {
    setSelected(prev => {
      const n = { ...prev };
      if (n[id]) delete n[id]; else n[id] = true;
      const all = rows.length > 0 && rows.every(r => n[r.id]);
      setAllChecked(all);
      return n;
    });
  };

  // Observaciones demo (con autor, rol y fecha)
  // const [onlyUnread, setOnlyUnread] = useState(false);
  // const [obs, setObs] = useState([
  //   { id:1, titulo:'Ajustar formato de carta', detalle:'La carta de compromiso tiene fecha incompleta.', fecha: new Date().toISOString(), leida:false, autor:{ nombre:'Lic. Pérez', rol:'Coordinación' } },
  //   { id:2, titulo:'Documento legible', detalle:'Subir identificación con mejor resolución.', fecha: new Date(Date.now()-86400000).toISOString(), leida:true, autor:{ nombre:'Msc. Gómez', rol:'Revisor de Carrera' } }
  // ]);
  // const toggleObsRead = (id) => setObs(arr => arr.map(o => o.id===id ? { ...o, leida:!o.leida } : o));

  // Citas y mensajes demo
  // const [citas, setCitas] = useState([]);
  // const [citaForm, setCitaForm] = useState({ fecha:'', hora:'', tema:'' });
  // const addCita = (e) => {
  //   e?.preventDefault?.();
  //   if (!citaForm.fecha || !citaForm.hora || !citaForm.tema.trim()) return;
  //   setCitas(list => [...list, { ...citaForm, id: Date.now() }]);
  //   setCitaForm({ fecha:'', hora:'', tema:'' });
  // };
  // const [msgs, setMsgs] = useState([{ id:1, de:'coordinacion', txt:'Bienvenido al SGTG. ¿En qué podemos ayudarte?', ts: Date.now()-3600000 }]);
  // const [msgInput, setMsgInput] = useState('');
  // const sendMsg = () => {
  //   if (!msgInput.trim()) return;
  //   setMsgs(list => [...list, { id:Date.now(), de:'yo', txt:msgInput.trim(), ts: Date.now() }]);
  //   setMsgInput('');
  // };

  // Secciones para el sidebar
  const sections = [
    { key:'resumen', label:'Resumen' },
    { key:'requisitos', label:'Mis requisitos' },
    { key:'documentos', label:'Documentos' },
    { key:'observaciones', label:'Observaciones' },
    { key:'citas', label:'Citas y mensajes' },
    { key:'config', label:'Configuración' },
    { key:'ayuda', label:'Ayuda' }
  ];

  return (
    <div className="est-shell">
      {/* Sidebar con scroll */}
      <aside className={`est-sidebar ${sbOpen ? 'open' : ''} ${sbCollapsed ? 'collapsed' : ''}`} style={{ maxHeight:'100vh', overflowY:'auto' }}>
        <div className="sb-header">
          <div className="sb-title">Mi Panel</div>
          <button className="sb-close" onClick={()=>setSbOpen(false)} aria-label="Cerrar menú">×</button>
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

      {/* Contenido */}
      <main className="est-main">
        <div className="est-main-top" style={{ alignItems:'center' }}>
          <div className="est-head">
            {active === 'resumen' && (
              <p className="est-subtitle">Bienvenido {friendlyName}</p>
            )}
          </div>
          {refreshing && <div className="hint">Refrescando…</div>}
        </div>

        {/* Mostrar el resumen SIEMPRE que active === 'resumen', aunque esté cargando */}
        {active === 'resumen' && (
          <>
            <section className="est-card reveal">
              <div className="est-card__header"><div className="est-card__title">Resumen general</div></div>
              <div className="est-card__body">
                <div className="est-widgets">
                  <div className="wg"><div className="wg-k">Pendientes</div><div className="wg-v">{REQUISITOS_BASE.length}</div></div>
                  <div className="wg"><div className="wg-k">En proceso</div><div className="wg-v">0</div></div>
                  <div className="wg"><div className="wg-k">Completados</div><div className="wg-v">0</div></div>
                  <div className="wg"><div className="wg-k">Rechazados</div><div className="wg-v">0</div></div>
                </div>
                <div className="est-note" style={{ marginTop:12 }}>
                  Usa el menú lateral para navegar. Puedes ocultarlo con el botón ☰ del encabezado.
                </div>
              </div>
            </section>

            <section className="est-card reveal">
              <div className="est-card__header"><div className="est-card__title">Accesos rápidos</div></div>
              <div className="est-card__body">
                <div className="est-quick">
                  <button className="lt-btn lt-primary" onClick={()=>goSection('requisitos')}>Mis requisitos</button>
                  <button className="lt-btn" onClick={()=>goSection('documentos')}>Subir documentos</button>
                  <button className="lt-btn" onClick={()=>goSection('observaciones')}>Ver observaciones</button>
                </div>
              </div>
            </section>

            <section className="est-card reveal">
              <div className="est-card__header"><div className="est-card__title">Actividad reciente</div></div>
              <div className="est-card__body">
                <ul className="timeline">
                  <li><span className="dot" /> Iniciaste sesión — 25/10/2025, 12:45:13 p. m.</li>
                  <li><span className="dot" /> Cargaste un documento (demo) — ayer</li>
                  <li><span className="dot" /> Revisión preliminar por coordinación — esta semana</li>
                </ul>
              </div>
            </section>
          </>
        )}

        {cargando && <div className="hint">Cargando tu expediente...</div>}
        {error && (
          <div className="error" style={{ margin: '2rem auto', maxWidth: 420, textAlign: 'center' }}>
            <div style={{ marginBottom: 10 }}>{error}</div>
            <button
              className="lt-btn lt-primary"
              style={{ marginTop: 8 }}
              onClick={() => { setError(null); loadUserAndExpedientes(false); }}
            >
              Reintentar
            </button>
          </div>
        )}
        {/* Permitir navegar por el panel aunque haya error, excepto si es de sesión */}
        {!cargando && !error && (
          <>
            {/* REQUISITOS: compacto + explicación */}
            {active === 'requisitos' && (
              <>
                <section className="est-card reveal">
                  <div className="est-card__header"><div className="est-card__title">Mis requisitos</div></div>
                  <div className="est-card__body">
                    <div className="est-note">
                      Consulta la lista de requisitos académicos. Los estados cambian conforme coordinación revisa y emite observaciones.
                    </div>
                  </div>
                </section>

                <div className="est-card list-toolbar reveal">
                  <div className="lt-left">
                    <input type="checkbox" checked={allChecked} onChange={toggleAll} aria-label="Seleccionar todos" />
                    <select className="lt-select" value={estadoFilter} onChange={(e)=>setEstadoFilter(e.target.value)}>
                      <option value="">Mostrar: Todos</option>
                      <option value="pendiente">Pendientes</option>
                      <option value="en_proceso">En proceso</option>
                      <option value="cumplido">Completados</option>
                      <option value="rechazado">Rechazados</option>
                    </select>
                    <button className="lt-btn" disabled>Filtrar</button>
                  </div>
                  <div className="lt-right">
                    <input className="lt-search" placeholder="Buscar requisito…" value={searchTerm} onChange={(e)=>setSearchTerm(e.target.value)} />
                    <button className="lt-btn lt-primary" onClick={handleIrAExpedientes}>Añadir nuevo</button>
                  </div>
                </div>

                <div className="est-card table-card reveal">
                  <div className="table-wrap">
                    <table className="est-list" style={{ fontSize:'12px' }}>
                      <thead>
                        <tr>
                          <th className="col-check"><input type="checkbox" checked={allChecked} onChange={toggleAll} aria-label="Seleccionar todos" /></th>
                          <th className="col-title" style={{ padding:'6px' }}>Requisito</th>
                          <th className="col-state" style={{ padding:'6px' }}>Estado</th>
                          <th className="col-comm" style={{ padding:'6px' }}>Obs.</th>
                          <th className="col-date" style={{ padding:'6px' }}>Actualizado</th>
                          <th className="col-actions" style={{ padding:'6px' }}>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.length === 0 && (<tr><td colSpan={6} className="empty">No hay elementos que coincidan.</td></tr>)}
                        {rows.map((r) => (
                          <tr key={r.id}>
                            <td className="col-check">
                              <input type="checkbox" checked={!!selected[r.id]} onChange={()=>toggleOne(r.id)} aria-label={`Seleccionar requisito ${r.titulo}`} />
                            </td>
                            <td className="col-title" style={{ padding:'6px' }}>
                              <span className="title" style={{ fontSize:'12px' }}>{r.titulo}</span>
                              <div className="row-actions" style={{ fontSize:'11px' }}>
                                <button className="link" disabled>Ver</button><span> | </span>
                                <button className="link" disabled>Subir archivo</button><span> | </span>
                                <button className="link" disabled>Historial</button>
                              </div>
                            </td>
                            <td className="col-state" style={{ padding:'6px' }}>
                              <span className={`badge ${r.estado === 'cumplido' ? 'is-completed' : r.estado === 'en_proceso' ? 'is-inprogress' : r.estado === 'rechazado' ? 'is-rejected' : 'is-pending'}`}>
                                {r.estado.replace('_',' ')}
                              </span>
                            </td>
                            <td className="col-comm" style={{ padding:'6px' }}>
                              <span className="bubble" title="Observaciones">{r.comentarios}</span>
                            </td>
                            <td className="col-date" style={{ padding:'6px' }}>
                              {r.actualizado ? new Date(r.actualizado).toLocaleString() : '—'}
                            </td>
                            <td className="col-actions" style={{ padding:'6px' }}>
                              <button className="btn-mini" disabled>Detalles</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr><td colSpan={6} className="meta" style={{ fontSize:'12px' }}>Mostrando {rows.length} de {total} requisito(s)</td></tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* DOCUMENTOS: guía + módulo embebido ordenado */}
            {active === 'documentos' && (
              <section className="est-card reveal visible" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, marginBottom: 24 }}>
                <div className="est-card__header">
                  <div className="est-card__title" style={{ fontWeight: 800, color: '#1e40af', fontSize: 20 }}>
                    Documentos del expediente
                  </div>
                </div>
                <div className="est-card__body" style={{ padding: '1.5rem 1rem 1.5rem 1rem' }}>
                  {/* Guía visual de pasos */}
                  <div style={{
                    background: '#fffbe6',
                    border: '1px solid #ffe58f',
                    borderRadius: 10,
                    padding: '1rem',
                    marginBottom: 18,
                    maxWidth: 700,
                    marginLeft: 'auto',
                    marginRight: 'auto'
                  }}>
                    <div style={{ fontWeight: 700, color: '#b45309', marginBottom: 8, fontSize: 16 }}>
                      ¿Cómo subir tus documentos?
                    </div>
                    <ol style={{ display: 'flex', flexWrap: 'wrap', gap: 18, listStyle: 'none', padding: 0, margin: 0, justifyContent: 'center' }}>
                      <li style={{ flex: '1 1 180px', minWidth: 140, textAlign: 'center' }}>
                        <div style={{ fontSize: 28, marginBottom: 4 }}>1️⃣</div>
                        <div style={{ fontWeight: 600 }}>Elige "Ver detalle"</div>
                        <div style={{ fontSize: 13, color: '#7c4700' }}>Haz clic en el botón junto al requisito.</div>
                      </li>
                      <li style={{ flex: '1 1 180px', minWidth: 140, textAlign: 'center' }}>
                        <div style={{ fontSize: 28, marginBottom: 4 }}>2️⃣</div>
                        <div style={{ fontWeight: 600 }}>Adjunta tu PDF</div>
                        <div style={{ fontSize: 13, color: '#7c4700' }}>Arrastra el archivo o usa "Subir desde PC".</div>
                      </li>
                      <li style={{ flex: '1 1 180px', minWidth: 140, textAlign: 'center' }}>
                        <div style={{ fontSize: 28, marginBottom: 4 }}>3️⃣</div>
                        <div style={{ fontWeight: 600 }}>Entrega y guarda</div>
                        <div style={{ fontSize: 13, color: '#7c4700' }}>Haz clic en "Entregar documento" y guarda si agregas comentarios.</div>
                      </li>
                      <li style={{ flex: '1 1 180px', minWidth: 140, textAlign: 'center' }}>
                        <div style={{ fontSize: 28, marginBottom: 4 }}>4️⃣</div>
                        <div style={{ fontWeight: 600 }}>Estado "En revisión"</div>
                        <div style={{ fontSize: 13, color: '#7c4700' }}>Coordinación validará cada archivo y te notificará.</div>
                      </li>
                    </ol>
                  </div>
                  {/* Mensaje de ayuda */}
                  <div style={{
                    background: '#e0f2fe',
                    border: '1px solid #bae6fd',
                    borderRadius: 8,
                    padding: '0.8rem 1rem',
                    marginBottom: 18,
                    color: '#0369a1',
                    fontSize: 15,
                    textAlign: 'center',
                    maxWidth: 700,
                    marginLeft: 'auto',
                    marginRight: 'auto'
                  }}>
                    Sube tus documentos en formato PDF (máx. 10MB cada uno). Si tienes dudas, revisa el <b>detalle</b> de cada requisito o consulta con coordinación.
                  </div>
                  {/* Módulo de requisitos embebido */}
                  <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 2px 12px #0001', padding: '1.2rem 0.5rem' }}>
                    <DashboardExpediente embedded={true} startCreated={true} showGuide={false} />
                  </div>
                </div>
              </section>
            )}

            {/* OBSERVACIONES: con autor y rol */}
            {active === 'observaciones' && (
              <section className="est-card reveal" style={{ background: '#f8fafc', border: '1px solid #e0e7ef', borderRadius: 14 }}>
                <div className="est-card__header" style={{ borderBottom: '1px solid #e0e7ef', paddingBottom: 10 }}>
                  <div className="est-card__title" style={{ fontWeight: 800, color: '#1e40af', fontSize: 18 }}>Observaciones de tu expediente</div>
                  <label className="chk-inline" style={{ marginLeft: 'auto', fontWeight: 600, color: '#334155' }}>
                    <input type="checkbox" checked={onlyUnread} onChange={e=>setOnlyUnread(e.target.checked)} style={{ marginRight: 6 }} />
                    Ver solo no leídas
                  </label>
                </div>
                <div className="est-card__body" style={{ padding: '1.3rem 0.8rem' }}>
                  <div style={{ marginBottom: 10, color: '#64748b', fontSize: 14 }}>
                    Aquí verás todas las observaciones realizadas por coordinación o revisores. Marca como leídas para dar seguimiento y aclarar dudas.
                  </div>
                  <div style={{ display: 'grid', gap: 16 }}>
                    {obs.filter(o => !onlyUnread || !o.leida).length === 0 && (
                      <div className="empty" style={{ textAlign: 'center', color: '#64748b', fontSize: 15 }}>
                        No hay observaciones para mostrar.
                      </div>
                    )}
                    {obs
                      .filter(o => !onlyUnread || !o.leida)
                      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
                      .map(o => (
                      <div
                        key={o.id}
                        className={`obs-item ${o.leida ? 'is-read' : 'is-unread'}`}
                        style={{
                          background: o.leida ? '#f1f5f9' : '#fffbe6',
                          border: `1px solid ${o.leida ? '#e2e8f0' : '#fde68a'}`,
                          borderRadius: 10,
                          padding: '1rem 1.2rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 6
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{
                            background: o.leida ? '#e0e7ef' : '#fde68a',
                            color: o.leida ? '#64748b' : '#b45309',
                            borderRadius: 8,
                            fontWeight: 700,
                            fontSize: 13,
                            padding: '2px 12px'
                          }}>
                            {o.leida ? 'Leída' : 'No leída'}
                          </span>
                          <span style={{ fontWeight: 700, color: '#1e293b', fontSize: 15 }}>{o.titulo}</span>
                          <span style={{ marginLeft: 'auto', color: '#64748b', fontSize: 13 }}>
                            {new Date(o.fecha).toLocaleString()}
                          </span>
                        </div>
                        <div style={{ color: '#334155', fontSize: 14, margin: '4px 0 2px 0' }}>
                          {o.detalle}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                          <span style={{ color: '#2563eb', fontWeight: 700 }}>
                            {o.autor?.nombre} ({o.autor?.rol})
                          </span>
                          <button
                            className="btn-mini"
                            style={{
                              marginLeft: 'auto',
                              background: o.leida ? '#e0e7ef' : '#fbbf24',
                              color: o.leida ? '#64748b' : '#b45309',
                              border: 'none',
                              borderRadius: 7,
                              padding: '4px 12px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                            onClick={() => toggleObsRead(o.id)}
                          >
                            {o.leida ? 'Marcar como no leída' : 'Marcar como leída'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* CITAS Y MENSAJES */}
            {active === 'citas' && (
              <div style={{ display: 'grid', gap: 24 }}>
                <section className="est-card reveal" style={{ background: '#f8fafc', border: '1px solid #e0e7ef', borderRadius: 14 }}>
                  <div className="est-card__header" style={{ borderBottom: '1px solid #e0e7ef', paddingBottom: 10 }}>
                    <div className="est-card__title" style={{ fontWeight: 800, color: '#1e40af', fontSize: 18 }}>Solicitar cita</div>
                  </div>
                  <div className="est-card__body" style={{ padding: '1.3rem 0.8rem' }}>
                    <div style={{ color: '#64748b', fontSize: 14, marginBottom: 10 }}>
                      Solicita una cita con coordinación para resolver dudas, entregar documentos físicos o recibir asesoría personalizada.
                    </div>
                    <form className="form-grid" onSubmit={addCita} style={{ display: 'grid', gap: 12, maxWidth: 420 }}>
                      <div>
                        <label style={{ fontWeight: 600, color: '#1e293b' }}>Fecha</label>
                        <input type="date" value={citaForm.fecha} onChange={e=>setCitaForm({...citaForm, fecha:e.target.value})} required className="input-compact" />
                      </div>
                      <div>
                        <label style={{ fontWeight: 600, color: '#1e293b' }}>Hora</label>
                        <input type="time" value={citaForm.hora} onChange={e=>setCitaForm({...citaForm, hora:e.target.value})} required className="input-compact" />
                      </div>
                      <div className="col-span-2">
                        <label style={{ fontWeight: 600, color: '#1e293b' }}>Tema</label>
                        <input type="text" placeholder="Motivo de la cita" value={citaForm.tema} onChange={e=>setCitaForm({...citaForm, tema:e.target.value})} required className="input-compact" />
                      </div>
                      <div className="col-span-2">
                        <button type="submit" className="lt-btn lt-primary" style={{ width: '100%', fontWeight: 700 }}>
                          Guardar solicitud
                        </button>
                      </div>
                    </form>
                    {!!citas.length && (
                      <div className="citas-list" style={{ marginTop: 18, display: 'grid', gap: 12 }}>
                        {citas.map(c => (
                          <div key={c.id} className="cita-item" style={{
                            background: '#f1f5f9',
                            border: '1px solid #e2e8f0',
                            borderRadius: 10,
                            padding: '10px 16px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2
                          }}>
                            <div style={{ fontWeight: 700, color: '#1e293b' }}>
                              {c.fecha} · {c.hora}
                            </div>
                            <div style={{ color: '#334155', fontSize: 14 }}>{c.tema}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </section>

                <section className="est-card reveal" style={{ background: '#f8fafc', border: '1px solid #e0e7ef', borderRadius: 14 }}>
                  <div className="est-card__header" style={{ borderBottom: '1px solid #e0e7ef', paddingBottom: 10 }}>
                    <div className="est-card__title" style={{ fontWeight: 800, color: '#1e40af', fontSize: 18 }}>Mensajes con coordinación</div>
                  </div>
                  <div className="est-card__body" style={{ padding: '1.3rem 0.8rem' }}>
                    <div style={{ color: '#64748b', fontSize: 14, marginBottom: 10 }}>
                      Comunícate directamente con coordinación para resolver dudas o dar seguimiento a tu expediente.
                    </div>
                    <div className="chat-box" style={{
                      background: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: 10,
                      padding: '1rem',
                      minHeight: 120,
                      maxHeight: 220,
                      overflowY: 'auto',
                      marginBottom: 12,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10
                    }}>
                      {msgs.map(m => (
                        <div key={m.id} style={{
                          display: 'flex',
                          justifyContent: m.de === 'yo' ? 'flex-end' : 'flex-start'
                        }}>
                          <div style={{
                            background: m.de === 'yo' ? '#2563eb' : '#e0e7ef',
                            color: m.de === 'yo' ? '#fff' : '#1e293b',
                            borderRadius: m.de === 'yo' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                            padding: '8px 14px',
                            maxWidth: 320,
                            fontSize: 14,
                            fontWeight: 500,
                            boxShadow: '0 2px 8px #0001'
                          }}>
                            {m.txt}
                            <div style={{
                              fontSize: 11,
                              color: m.de === 'yo' ? '#c7d7fa' : '#64748b',
                              marginTop: 2,
                              textAlign: m.de === 'yo' ? 'right' : 'left'
                            }}>
                              {new Date(m.ts).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <form
                      className="chat-input"
                      style={{ display: 'flex', gap: 8, marginTop: 0 }}
                      onSubmit={e => { e.preventDefault(); sendMsg(); }}
                    >
                      <input
                        value={msgInput}
                        onChange={e => setMsgInput(e.target.value)}
                        placeholder="Escribe un mensaje..."
                        style={{
                          flex: 1,
                          border: '1px solid #e2e8f0',
                          borderRadius: 8,
                          padding: '10px 12px',
                          fontSize: 14,
                          background: '#fff'
                        }}
                      />
                      <button
                        type="submit"
                        className="lt-btn lt-primary"
                        style={{ fontWeight: 700, borderRadius: 8, padding: '10px 18px' }}
                      >
                        Enviar
                      </button>
                    </form>
                  </div>
                </section>
              </div>
            )}

            {/* CONFIGURACIÓN */}
            {active === 'config' && (
              <div style={{ display: 'grid', gap: 28 }}>
                {/* Perfil y privacidad */}
                <section className="est-card reveal" style={{ background: '#f8fafc', border: '1px solid #e0e7ef', borderRadius: 14 }}>
                  <div className="est-card__header" style={{ borderBottom: '1px solid #e0e7ef', paddingBottom: 10 }}>
                    <div className="est-card__title" style={{ fontWeight: 800, color: '#1e40af', fontSize: 18 }}>Perfil y privacidad</div>
                  </div>
                  <div className="est-card__body" style={{ padding: '1.3rem 0.8rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
                      {/* Avatar editable (solo UI) */}
                      <div style={{ textAlign: 'center' }}>
                        <div style={{
                          width: 80, height: 80, borderRadius: '50%',
                          background: '#e0e7ef', color: '#1e40af', fontWeight: 900,
                          fontSize: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px'
                        }}>
                          {friendlyName.charAt(0).toUpperCase()}
                        </div>
                        <label style={{
                          display: 'inline-block', background: '#2563eb', color: '#fff', borderRadius: 8,
                          padding: '6px 16px', fontWeight: 700, fontSize: 14, cursor: 'pointer', marginTop: 4
                        }}>
                          Cambiar foto
                          <input type="file" accept="image/*" style={{ display: 'none' }} disabled />
                        </label>
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Próximamente</div>
                      </div>
                      {/* Datos y switches */}
                      <div style={{ flex: 1, minWidth: 220 }}>
                        <div style={{ marginBottom: 12 }}>
                          <label style={{ fontWeight: 700, color: '#1e293b', fontSize: 14 }}>Nombre completo</label>
                          <input
                            type="text"
                            value={perfil.nombre}
                            onChange={e => setPerfil({ ...perfil, nombre: e.target.value })}
                            placeholder={friendlyName || 'Nombre'}
                            className="input-compact"
                            style={{ marginTop: 4, width: '100%' }}
                            disabled
                          />
                        </div>
                        <div style={{ marginBottom: 12 }}>
                          <label style={{ fontWeight: 700, color: '#1e293b', fontSize: 14 }}>Correo</label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <input
                              type="email"
                              value={user?.correo || ''}
                              className="input-compact"
                              style={{ marginTop: 4, width: '100%' }}
                              disabled
                            />
                            <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, userSelect: 'none' }}>
                              <input type="checkbox" checked={perfil.mostrarCorreo ?? true} onChange={e => setPerfil({ ...perfil, mostrarCorreo: e.target.checked })} />
                              Mostrar
                            </label>
                          </div>
                        </div>
                        <div style={{ marginBottom: 12 }}>
                          <label style={{ fontWeight: 700, color: '#1e293b', fontSize: 14 }}>Teléfono</label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <input
                              type="tel"
                              value={perfil.telefono}
                              onChange={e => setPerfil({ ...perfil, telefono: e.target.value })}
                              placeholder="Ej. 9999-9999"
                              className="input-compact"
                              style={{ marginTop: 4, width: '100%' }}
                              disabled
                            />
                            <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, userSelect: 'none' }}>
                              <input type="checkbox" checked={perfil.mostrarTelefono ?? true} onChange={e => setPerfil({ ...perfil, mostrarTelefono: e.target.checked })} />
                              Mostrar
                            </label>
                          </div>
                        </div>
                        <div style={{ fontSize: 13, color: '#64748b', marginTop: 8 }}>
                          Puedes elegir si tu correo y teléfono son visibles para coordinación y revisores.
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {/* AYUDA */}
            {active === 'ayuda' && (
              <section className="est-card reveal" style={{ background: '#f8fafc', border: '1px solid #e0e7ef', borderRadius: 14 }}>
                <div className="est-card__header" style={{ borderBottom: '1px solid #e0e7ef', paddingBottom: 10 }}>
                  <div className="est-card__title" style={{ fontWeight: 800, color: '#1e40af', fontSize: 18 }}>Ayuda y guía del panel</div>
                </div>
                <div className="est-card__body" style={{ padding: '1.3rem 0.8rem' }}>
                  <div style={{ color: '#64748b', fontSize: 15, marginBottom: 16 }}>
                    Consulta aquí cómo usar el panel, subir documentos y dar seguimiento a tu proceso de graduación.
                  </div>
                  <div style={{ display: 'grid', gap: 18 }}>
                    <div style={{ background: '#e0f2fe', border: '1px solid #bae6fd', borderRadius: 10, padding: '1rem' }}>
                      <div style={{ fontWeight: 700, color: '#0369a1', marginBottom: 6 }}>¿Cómo usar el panel?</div>
                      <ol style={{ margin: 0, paddingLeft: '1.2em', color: '#334155', fontSize: 14 }}>
                        <li>Revisa el <b>Resumen</b> para ver tu estado general y accesos rápidos.</li>
                        <li>En <b>Mis requisitos</b> consulta la lista completa y su estado.</li>
                        <li>En <b>Documentos</b> sube tus archivos PDF (máx. 10MB) y consulta el estado de revisión.</li>
                        <li>En <b>Observaciones</b> verás comentarios y solicitudes de coordinación.</li>
                        <li>En <b>Citas y mensajes</b> puedes solicitar una cita y comunicarte con coordinación.</li>
                        <li>En <b>Configuración</b> podrás actualizar tu perfil y contraseña próximamente.</li>
                      </ol>
                    </div>
                    <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 10, padding: '1rem' }}>
                      <div style={{ fontWeight: 700, color: '#b45309', marginBottom: 6 }}>Preguntas frecuentes</div>
                      <details style={{ marginBottom: 6 }}>
                        <summary style={{ cursor: 'pointer', color: '#b45309', fontWeight: 700 }}>¿Qué formato de archivo se acepta?</summary>
                        <div style={{ color: '#7c4700', fontSize: 14, marginTop: 2 }}>Solo PDF, máximo 10MB por archivo.</div>
                      </details>
                      <details style={{ marginBottom: 6 }}>
                        <summary style={{ cursor: 'pointer', color: '#b45309', fontWeight: 700 }}>¿Cuánto tarda la revisión?</summary>
                        <div style={{ color: '#7c4700', fontSize: 14, marginTop: 2 }}>Depende del volumen, pero recibirás notificación cuando se valide o haya observaciones.</div>
                      </details>
                      <details>
                        <summary style={{ cursor: 'pointer', color: '#b45309', fontWeight: 700 }}>¿Cómo sé si terminé?</summary>
                        <div style={{ color: '#7c4700', fontSize: 14, marginTop: 2 }}>Cuando todos los requisitos estén “Completados” y no existan observaciones pendientes.</div>
                      </details>
                    </div>
                    <div style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 10, padding: '1rem', textAlign: 'center' }}>
                      <div style={{ fontWeight: 700, color: '#1e40af', marginBottom: 6 }}>¿Necesitas más ayuda?</div>
                      <div style={{ color: '#334155', fontSize: 14 }}>
                        Escribe a <a href="mailto:cienciaseconomicas@unah.edu.hn" style={{ color: '#2563eb', fontWeight: 700 }}>cienciaseconomicas@unah.edu.hn</a> o acude a la coordinación de tu carrera.
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default DashboardEstudiante;
