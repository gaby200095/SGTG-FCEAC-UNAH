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

const DashboardCoordinador = () => {
  const { user, call } = useAuth();

  const [exp, setExp] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [busqueda, setBusqueda] = useState('');

  const [nombreCoordinador, setNombreCoordinador] = useState('');
  const [carreraCoord, setCarreraCoord] = useState('');
  const [avisoCarrera, setAvisoCarrera] = useState('');

  useEffect(() => {
    let cancel = false;
    (async () => {
      if (!user?.id_usuario) return;
      setLoading(true);
      setError(null);
      try {
        let rowsUsuarios = [];
        const rUser = await call('/table/usuario_sistema?limit=500');
        if (rUser.ok) rowsUsuarios = await rUser.json();
        const reg = rowsUsuarios.find(u => u.id_usuario === user.id_usuario);
        if (reg) {
          const nombre = reg.nombre_usuario || reg.nombre || '';
          const apellido = reg.apellido_usuario || reg.apellido || '';
          setNombreCoordinador(`${nombre} ${apellido}`.trim() || (user.correo?.split('@')[0] || 'Coordinador'));
          const posibleCarrera =
            reg.carrera || reg.nombre_carrera || reg.carrera_coordinador || reg.coordinacion || '';
            if (posibleCarrera) setCarreraCoord(String(posibleCarrera).trim());
        } else {
          setNombreCoordinador(user.correo?.split('@')[0] || 'Coordinador');
        }

        const rExp = await call('/expedientes');
        if (!rExp.ok) throw new Error(`HTTP ${rExp.status}`);
        const data = await rExp.json();

        if (!carreraCoord) {
          const firstWithCarrera = (data || []).find(e => e.carrera || e.nombre_carrera);
          if (firstWithCarrera?.carrera) setCarreraCoord(firstWithCarrera.carrera);
          else if (firstWithCarrera?.nombre_carrera) setCarreraCoord(firstWithCarrera.nombre_carrera);
          else setAvisoCarrera('No se pudo determinar la carrera del coordinador. Mostrando todos los expedientes.');
        }

        if (!cancel) setExp(Array.isArray(data) ? data : []);
      } catch {
        if (!cancel) setError('No se pudieron cargar los expedientes.');
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, [call, user, carreraCoord]);

  const filtrados = useMemo(() => {
    const carr = (carreraCoord || '').toLowerCase();
    return exp
      .filter(e => {
        if (!carr) return true;
        const cExp = String(e.carrera || e.nombre_carrera || '').toLowerCase();
        return cExp === carr;
      })
      .filter(e => !filtroEstado || String(e.estado || '').toLowerCase() === filtroEstado)
      .filter(e => {
        if (!busqueda.trim()) return true;
        const q = busqueda.toLowerCase();
        return (
          String(e.nombre || '').toLowerCase().includes(q) ||
          String(e.carrera || '').toLowerCase().includes(q) ||
          String(e.id_usuario || '').toLowerCase().includes(q)
        );
      });
  }, [exp, filtroEstado, busqueda, carreraCoord]);

  const uniqueEstados = useMemo(
    () => Array.from(new Set(
      exp
        .filter(e => {
          if (!carreraCoord) return true;
          const cExp = String(e.carrera || e.nombre_carrera || '').toLowerCase();
          return cExp === carreraCoord.toLowerCase();
        })
        .map(e => String(e.estado || '').toLowerCase())
    )).filter(Boolean),
    [exp, carreraCoord]
  );

  // Reemplazar animación (eliminar el anterior useEffect reveal si existía)
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    const obs = new IntersectionObserver(entries=>{
      entries.forEach(e=>{
        if(e.isIntersecting){
          e.target.classList.add('visible');
          obs.unobserve(e.target);
        }
      });
    }, { threshold:0.05 });
    els.forEach(el=>obs.observe(el));
    return ()=>obs.disconnect();
  }, []);

  return (
    <div className="reveal">
      <h2>Panel Coordinador</h2>
      <p style={{ margin:'4px 0 4px', fontWeight:500 }}>
        Coordinador: {nombreCoordinador || user?.correo}
      </p>
      {carreraCoord && (
        <p style={{ margin:'0 0 12px', color:'#475569' }}>
          Carrera asignada: <strong>{carreraCoord}</strong>
        </p>
      )}
      {!carreraCoord && avisoCarrera && (
        <p style={{ margin:'0 0 12px', color:'#92400e', fontSize:13 }}>{avisoCarrera}</p>
      )}
      <div style={{
        background:'#f1f5f9', padding:'10px 12px', borderRadius:6,
        fontSize:13, marginBottom:16, lineHeight:1.4
      }}>
        Como coordinador de carrera, usted puede revisar y validar los expedientes.
      </div>
      <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:12 }}>
        <div>
          <label style={{ fontSize:12, display:'block', marginBottom:4 }}>Estado:</label>
          <select
            value={filtroEstado}
            onChange={e=>setFiltroEstado(e.target.value)}
            style={{ padding:'4px 6px' }}
          >
            <option value="">(Todos)</option>
            {uniqueEstados.map(est => <option key={est} value={est}>{est}</option>)}
          </select>
        </div>
        <div style={{ flexGrow:1, minWidth:220 }}>
          <label style={{ fontSize:12, display:'block', marginBottom:4 }}>Buscar (nombre / carrera / id usuario):</label>
          <input
            type="text"
            value={busqueda}
            onChange={e=>setBusqueda(e.target.value)}
            placeholder="Ej: Economía"
            style={{ width:'100%', padding:'4px 6px' }}
          />
        </div>
        <div style={{ alignSelf:'flex-end' }}>
          <button
            onClick={()=>{ setFiltroEstado(''); setBusqueda(''); }}
            style={{ padding:'6px 10px', cursor:'pointer' }}
          >Limpiar filtros</button>
        </div>
      </div>
      {loading && <div>Cargando expedientes...</div>}
      {error && !loading && <div style={{ color:'#b91c1c' }}>{error}</div>}
      {!loading && !error && (
        <div>
          <div style={{ fontSize:12, margin:'0 0 8px' }}>
            Mostrando {filtrados.length} de {
              carreraCoord
                ? exp.filter(e => String(e.carrera || e.nombre_carrera || '').toLowerCase() === carreraCoord.toLowerCase()).length
                : exp.length
            } expediente(s)
          </div>
          {filtrados.length === 0 ? (
            <div style={{
              padding:'12px 16px',
              background:'#f3f4f6',
              border:'1px solid #e5e7eb',
              borderRadius:6
            }}>No hay expedientes que coincidan con los filtros.</div>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table style={{ borderCollapse:'collapse', width:'100%', minWidth:700 }}>
                <thead>
                  <tr style={{ background:'#f1f5f9' }}>
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
                      <tr key={row.id_expediente} style={{ borderBottom:'1px solid #e2e8f0' }}>
                        <td style={td}>{row.id_expediente}</td>
                        <td style={td}>{row.id_usuario}</td>
                        <td style={td}>{row.nombre}</td>
                        <td style={td}>{row.carrera || row.nombre_carrera || '—'}</td>
                        <td style={td}>
                          <span style={{
                            background:color,
                            color:'#fff',
                            padding:'2px 8px',
                            fontSize:12,
                            borderRadius:12,
                            textTransform:'capitalize',
                            display:'inline-block',
                            minWidth:80,
                            textAlign:'center'
                          }}>{est || '—'}</span>
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

export default DashboardCoordinador;

