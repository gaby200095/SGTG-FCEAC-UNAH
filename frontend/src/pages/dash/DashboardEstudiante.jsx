import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../state/AuthContext';

const EXPEDIENTE_TABLE = 'expediente_digital';

const thCell = {
  textAlign:'left', padding:'8px 10px', fontSize:13,
  fontWeight:600, borderBottom:'2px solid #cbd5e1'
};
const tdCell = {
  padding:'6px 10px', fontSize:13, verticalAlign:'middle'
};

const DashboardEstudiante = () => {
  const { user, call } = useAuth();

  const [cargando,setCargando] = useState(true);
  const [error,setError] = useState(null);
  const [nombreMostrar,setNombreMostrar] = useState('');
  const [expedientes,setExpedientes] = useState([]);
  const [requisitos,setRequisitos] = useState([]);
  const [progresos,setProgresos] = useState([]);
  const [seleccionExp,setSeleccionExp] = useState(null);

  const isRequisitoCumplido = (p) => {
    if(!p) return false;
    const positivos = ['completo','completado','aprobado','true','1',1];
    const estado = String(
      p.estado ?? p.estatus ?? p.completado ?? p.finalizado ?? ''
    ).toLowerCase();
    return positivos.includes(estado) || positivos.includes(p.completado);
  };

  const progresoCalculado = useMemo(()=>{
    if(!requisitos.length) return { total:0, completos:0, porcentaje:0 };
    const completos = requisitos.reduce((acc,req)=>{
      const pr = progresos.find(p=>p.id_requisitos===req.id_requisito || p.id_requisito===req.id_requisito);
      return acc + (isRequisitoCumplido(pr)?1:0);
    },0);
    const porcentaje = Math.round((completos/requisitos.length)*100);
    return { total:requisitos.length, completos, porcentaje };
  },[requisitos,progresos]);

  useEffect(()=>{
    if(!user?.id_usuario) return;
    let cancel=false;
    (async ()=>{
      setCargando(true); setError(null);
      try {
        const rUser = await call(`/table/usuario_sistema?limit=500`);
        if (rUser.ok){
          const rows = await rUser.json();
            const u = rows.find(x=>x.id_usuario===user.id_usuario);
          if (u){
            const n = u.nombre_usuario || u.nombre || '';
            const a = u.apellido_usuario || u.apellido || '';
            setNombreMostrar(`${n} ${a}`.trim());
          } else {
            setNombreMostrar(user.correo?.split('@')[0] || 'Estudiante');
          }
        }

        const rExp = await call(`/table/${EXPEDIENTE_TABLE}?limit=500`);
        let rowsExp = [];
        if (rExp.ok) rowsExp = await rExp.json();
        const propios = rowsExp.filter(ex=>ex.id_usuario===user.id_usuario);
        setExpedientes(propios);
        setSeleccionExp(prev=>prev || propios[0] || null);

        const rReq = await call(`/table/requisito?limit=500`);
        if (rReq.ok) setRequisitos(await rReq.json());

        const rProg = await call(`/table/progreso_requisito?limit=1000`);
        if (rProg.ok){
          const progRows = await rProg.json();
          const propiosProg = progRows.filter(pr=>pr.id_usuario===user.id_usuario || pr.usuario_id===user.id_usuario);
          setProgresos(propiosProg);
        }
      } catch {
        if(!cancel) setError('No se pudo cargar la información del expediente.');
      } finally {
        if(!cancel) setCargando(false);
      }
    })();
    return ()=>{cancel=true;};
  },[user,call]);

  const listaRequisitos = useMemo(()=> requisitos.map(req=>{
    const prog = progresos.find(p=>p.id_requisito===req.id_requisito || p.id_requisitos===req.id_requisito);
    const cumplido = isRequisitoCumplido(prog);
    return {
      id:req.id_requisito,
      nombre:req.nombre_requisito || req.nombre || `Requisito ${req.id_requisito}`,
      estado:cumplido?'Completado':'Pendiente',
      detalle:prog?.observacion || prog?.comentario || ''
    };
  }),[requisitos,progresos]);

  // Reemplazar efecto de animación anterior
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    const obs = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          en.target.classList.add('visible');
          obs.unobserve(en.target); // no se quita visible nunca
        }
      });
    }, { threshold: 0.05 });
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <div className="reveal">
      <h2 style={{ marginBottom:4 }}>Panel Estudiante</h2>
      <p style={{ color:'#475569', marginBottom:16 }}>Bienvenido {nombreMostrar || 'Estudiante'}</p>
      {cargando && <div>Cargando tu expediente...</div>}
      {error && !cargando && <div style={{ color:'#b91c1c' }}>{error}</div>}
      {!cargando && !error && (
        <>
          {expedientes.length===0 ? (
            <div style={{ background:'#f1f5f9', padding:16, borderRadius:6 }}>
              Aún no tienes un expediente registrado.
            </div>
          ) : (
            <div style={{ marginBottom:24 }}>
              <h3 style={{ margin:'12px 0 8px' }}>Tu Expediente</h3>
              {expedientes.length>1 && (
                <div style={{ marginBottom:10 }}>
                  <label style={{ fontSize:12, display:'block', marginBottom:4 }}>Seleccionar expediente:</label>
                  <select
                    value={seleccionExp?.id_expediente || ''}
                    onChange={e=>{
                      const expSel = expedientes.find(ex=>ex.id_expediente===Number(e.target.value));
                      setSeleccionExp(expSel);
                    }}
                    style={{ padding:'4px 6px' }}
                  >
                    {expedientes.map(ex=>(
                      <option key={ex.id_expediente} value={ex.id_expediente}>
                        #{ex.id_expediente} {ex.carrera || ex.nombre_carrera || ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {seleccionExp && (
                <div style={{
                  border:'1px solid #e2e8f0',
                  borderRadius:8,
                  padding:16,
                  background:'#fff',
                  boxShadow:'0 1px 2px rgba(0,0,0,0.04)'
                }}>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:24 }}>
                    <div><div style={{ fontSize:12, color:'#64748b' }}>ID Expediente</div><div style={{ fontWeight:600 }}>{seleccionExp.id_expediente}</div></div>
                    <div><div style={{ fontSize:12, color:'#64748b' }}>Carrera</div><div style={{ fontWeight:600 }}>{seleccionExp.carrera || seleccionExp.nombre_carrera || '—'}</div></div>
                    <div><div style={{ fontSize:12, color:'#64748b' }}>Estado</div><div style={{ fontWeight:600, textTransform:'capitalize' }}>{seleccionExp.estado || seleccionExp.estado_expediente || '—'}</div></div>
                  </div>
                  <div style={{ marginTop:16 }}>
                    <div style={{ fontSize:12, color:'#475569', marginBottom:4 }}>
                      Avance de requisitos: {progresoCalculado.completos}/{progresoCalculado.total} ({progresoCalculado.porcentaje}%)
                    </div>
                    <div style={{ height:12, background:'#e2e8f0', borderRadius:6, overflow:'hidden' }}>
                      <div style={{
                        width:`${progresoCalculado.porcentaje}%`,
                        height:'100%',
                        background:progresoCalculado.porcentaje===100?'#059669':'#2563eb',
                        transition:'width .4s'
                      }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {expedientes.length>0 && (
            <div>
              <h3 style={{ margin:'0 0 10px' }}>Requisitos</h3>
              {listaRequisitos.length===0 ? (
                <div style={{
                  background:'#f8fafc',
                  padding:12,
                  borderRadius:6,
                  border:'1px solid #e2e8f0'
                }}>No hay requisitos configurados en el sistema.</div>
              ) : (
                <div style={{ border:'1px solid #e2e8f0', borderRadius:8, overflow:'hidden' }}>
                  <table style={{ borderCollapse:'collapse', width:'100%' }}>
                    <thead>
                      <tr style={{ background:'#f1f5f9' }}>
                        <th style={thCell}>Requisito</th>
                        <th style={thCell}>Estado</th>
                        <th style={thCell}>Detalle</th>
                      </tr>
                    </thead>
                    <tbody>
                      {listaRequisitos.map(r=>(
                        <tr key={r.id} style={{ borderBottom:'1px solid #e2e8f0' }}>
                          <td style={tdCell}>{r.nombre}</td>
                          <td style={tdCell}>
                            <span style={{
                              display:'inline-block', padding:'2px 8px',
                              borderRadius:12, fontSize:12,
                              background:r.estado==='Completado' ? '#059669' : '#475569',
                              color:'#fff', minWidth:90, textAlign:'center'
                            }}>{r.estado}</span>
                          </td>
                          <td style={tdCell}>{r.detalle || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DashboardEstudiante;

