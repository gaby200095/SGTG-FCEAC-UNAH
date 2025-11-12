import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../state/AuthContext';

const estadoColors = {
  aprobado: '#065f46',
  pendiente: '#92400e',
  rechazado: '#991b1b',
  en_proceso: '#1e3a8a'
};

const th = {
  textAlign: 'left',
  padding: '8px 10px',
  fontSize: 13,
  fontWeight: 600,
  borderBottom: '2px solid #cbd5e1',
  whiteSpace: 'nowrap'
};
const td = {
  padding: '6px 10px',
  fontSize: 13,
  verticalAlign: 'middle'
};

const DashboardAdministrativo = () => {
  const { user, call } = useAuth();
  const [exp, setExp] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [nombreAdmin, setNombreAdmin] = useState('');
  const [tieneDatosOriginales, setTieneDatosOriginales] = useState(false);

  useEffect(() => {
    let cancel = false;
    (async () => {
      if (!user?.id_usuario) return;
      setLoading(true);
      setError(null);
      try {
        // Nombre completo
        const rUser = await call('/table/usuario_sistema?limit=500');
        if (rUser.ok) {
          const rows = await rUser.json();
          const u = rows.find(r => r.id_usuario === user.id_usuario);
          if (u) {
            const n = u.nombre_usuario || u.nombre || '';
            const a = u.apellido_usuario || u.apellido || '';
            setNombreAdmin(`${n} ${a}`.trim() || (user.correo?.split('@')[0] || 'Administrativo'));
          } else {
            setNombreAdmin(user.correo?.split('@')[0] || 'Administrativo');
          }
        } else {
          setNombreAdmin(user.correo?.split('@')[0] || 'Administrativo');
        }

        // Expedientes (acceso total)
        const rExp = await call('/expedientes');
        if (!rExp.ok) throw new Error();
        const data = await rExp.json();
        if (!cancel) {
          const lista = Array.isArray(data) ? data : [];
          setExp(lista);
          setTieneDatosOriginales(lista.length > 0);
        }
      } catch {
        if (!cancel) setError('No se pudieron cargar los expedientes.');
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, [call, user]);

  const filtrados = useMemo(() => exp
    .filter(e => !filtroEstado || String(e.estado || '').toLowerCase() === filtroEstado)
    .filter(e => {
      if (!busqueda.trim()) return true;
      const q = busqueda.toLowerCase();
      return (
        String(e.nombre || '').toLowerCase().includes(q) ||
        String(e.carrera || '').toLowerCase().includes(q) ||
        String(e.id_usuario || '').toLowerCase().includes(q)
      );
    }), [exp, filtroEstado, busqueda]);

  const uniqueEstados = useMemo(
    () => Array.from(new Set(exp.map(e => String(e.estado || '').toLowerCase()))).filter(Boolean),
    [exp]
  );

  useEffect(()=>{
    const els = document.querySelectorAll('.reveal');
    const obs = new IntersectionObserver(entries=>{
      entries.forEach(en=>{
        if(en.isIntersecting){
          en.target.classList.add('visible');
          obs.unobserve(en.target);
        }
      });
    }, { threshold:0.05 });
    els.forEach(el=>obs.observe(el));
    return ()=>obs.disconnect();
  },[]);

  return (
    <div className="reveal">
      <h2>Panel Administrativo</h2>
      <p style={{ margin:'4px 0 6px', fontWeight:500 }}>
        Personal Administrativo: {nombreAdmin || user?.correo}
      </p>
      <div style={{
        background:'#f1f5f9', padding:'10px 12px', borderRadius:6,
        fontSize:13, marginBottom:16, lineHeight:1.45
      }}>
        Como personal administrativo, usted puede visualizar todos los expedientes.
      </div>
      <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:12 }}>
        <div>
          <label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Estado:</label>
          <select
            value={filtroEstado}
            onChange={e => setFiltroEstado(e.target.value)}
            style={{ padding: '4px 6px' }}
          >
            <option value="">(Todos)</option>
            {uniqueEstados.map(est => (
              <option key={est} value={est}>{est}</option>
            ))}
          </select>
        </div>
        <div style={{ flexGrow: 1, minWidth: 220 }}>
          <label style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>Buscar (nombre / carrera / id usuario):</label>
          <input
            type="text"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Ej: Economía"
            style={{ width: '100%', padding: '4px 6px' }}
          />
        </div>
        <div style={{ alignSelf: 'flex-end' }}>
          <button
            onClick={() => { setFiltroEstado(''); setBusqueda(''); }}
            style={{ padding: '6px 10px', cursor: 'pointer' }}
          >
            Limpiar filtros
          </button>
        </div>
      </div>
      {loading && <div>Cargando expedientes...</div>}
      {error && !loading && <div style={{ color:'#b91c1c' }}>{error}</div>}
      {!loading && !error && (
        <div>
          <div style={{ fontSize:12, margin:'0 0 8px' }}>
            Mostrando {filtrados.length} de {exp.length} expediente(s)
          </div>
          {filtrados.length === 0 ? (
            <div style={{
              padding: '12px 16px',
              background: '#f3f4f6',
              border: '1px solid #e5e7eb',
              borderRadius: 6
            }}>
              {tieneDatosOriginales
                ? 'No hay expedientes que coincidan con los filtros actuales.'
                : 'Aún no existen expedientes registrados en el sistema.'}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 700 }}>
                <thead>
                  <tr style={{ background: '#f1f5f9' }}>
                    <th style={th}>Expediente</th>
                    <th style={th}>Usuario</th>
                    <th style={th}>Nombre</th>
                    <th style={th}>Carrera</th>
                    <th style={th}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map(row => {
                    const est = String(row.estado || '').toLowerCase();
                    const color = estadoColors[est] || '#334155';
                    return (
                      <tr key={row.id_expediente} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={td}>{row.id_expediente}</td>
                        <td style={td}>{row.id_usuario}</td>
                        <td style={td}>{row.nombre}</td>
                        <td style={td}>{row.carrera}</td>
                        <td style={td}>
                          <span
                            style={{
                              background: color,
                              color: 'white',
                              padding: '2px 8px',
                              fontSize: 12,
                              borderRadius: 12,
                              textTransform: 'capitalize',
                              display: 'inline-block',
                              minWidth: 80,
                              textAlign: 'center'
                            }}
                          >
                            {est || '—'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DashboardAdministrativo;

