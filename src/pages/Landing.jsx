// frontend/src/pages/Landing.jsx
//SE CREO ESTE ARCHIVO LADING//node src/app.js

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom'; // nuevo: navegación interna

function Landing() {
  const [contenido, setContenido] = useState({
    titulo: 'Bienvenido(a) al Sistema de Gestión de Trámites de Graduación de la FCEAC de la UNAH',
    descripcion: 'En nuestra página podrás gestionar todo tu proceso de graduación de manera rápida y sencilla, sin complicaciones.',
    beneficios: [
      'Inicia solicitudes y carga documentos desde un solo lugar.',
      'Consulta requisitos y estados de tus procesos en tiempo real.',
      'Recibe notificaciones y recordatorios oportunos.',
      'Gestionar tu proceso de graduación de forma segura y eficiente.',
      'Acceder a toda la información importante de manera clara y rápida.',
    ]
  });
  const [error, setError] = useState(null);

  const API = (process.env.REACT_APP_API_URL || 'http://localhost:5001/api').replace(/\/+$/, '');

  useEffect(() => {
    fetch(`${API}/landing`, { cache: 'no-store' })
      .then(res => res.ok ? res.json() : Promise.reject(new Error('Respuesta no válida')))
      .then(data => {
        if (data && (data.titulo || data.descripcion || Array.isArray(data.beneficios))) {
          setContenido(prev => ({
            ...prev, // mantener el título local
            // titulo: prev.titulo,  // implícito por el spread
            descripcion: data.descripcion || prev.descripcion,
            beneficios: (Array.isArray(data.beneficios) && data.beneficios.length > 0) ? data.beneficios : prev.beneficios
          }));
        }
      })
      .catch(err => {
        console.error('Error al cargar landing:', err);
        setError('No se pudo cargar el contenido dinámico.');
      });
  }, []);

  // Animación tipo reveal
  useEffect(() => {
    const sections = document.querySelectorAll('.reveal');
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          } else {
            entry.target.classList.remove('visible');
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -5% 0px' }
    );
    sections.forEach((s) => obs.observe(s));
    return () => obs.disconnect();
  }, []);

  // NUEVO: datos de UI para evitar comentarios dentro de JSX
  const fechasProximas = [
    { f: '15 Mar', t: 'Inscripción a acto de graduación' },
    { f: '28 Mar', t: 'Límite para carga de documentos' },
    { f: '05 Abr', t: 'Publicación de observaciones' }
  ];
  const kpis = [
    { k:'Carreras', v:'3+', d:'FCEAC – Programas habilitados' },
    { k:'Trámites activos', v:'100+', d:'Gestión centralizada y segura' },
    { k:'Tiempo de respuesta', v:'48h', d:'Promedio de atención' },
    { k:'Disponibilidad', v:'24/7', d:'Plataforma en línea' },
  ];
  const pasos = [
    { n:1, t:'Ingreso', d:'Accede con tu cuenta (institucional o personal válida).' },
    { n:2, t:'Selección', d:'Elige el trámite que necesitas iniciar.' },
    { n:3, t:'Documentación', d:'Adjunta los requisitos solicitados.' },
    { n:4, t:'Seguimiento', d:'Monitorea avances y avisos en tu panel.' },
  ];
  const avisos = [
    { fecha: '15 Mar 2025', t: 'Inscripción a acto de graduación', d: 'Inicio del periodo de inscripción.' },
    { fecha: '28 Mar 2025', t: 'Límite carga de documentos', d: 'Último día para adjuntar requisitos.' },
    { fecha: '05 Abr 2025', t: 'Revisión de expedientes', d: 'Publicación de observaciones.' },
    { fecha: '4 agosto', t: 'Recepción de expedientes', d: 'Inicio de recepción (Ceremonia dic. 2025).' },
    { fecha: '8 sept.', t: 'Límite con honores', d: 'Entrega de expedientes para honores.' },
    { fecha: '30 sept.', t: 'Límite sin honores', d: 'Entrega de expedientes sin distinción.' },
  ];

  // Responsive: desactivar background-attachment: fixed en móviles para evitar jitter
  const [isNarrow, setIsNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const onChange = (e) => setIsNarrow(e.matches);
    setIsNarrow(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Estilo de tarjeta “soft surface” (menos claro, mejor contraste y legibilidad)
  const glassCard = {
    background: 'rgba(230, 236, 245, 0.95)', // azul-gris suave (menos blanco)
    backdropFilter: 'saturate(110%) blur(4px)',
    border: '1px solid #b6c2d1',
    boxShadow: '0 10px 24px rgba(2,6,23,0.10)',
  };

  return (
    <div
      className="hero-wrap"
      role="main"
      style={{
        // Fondo gris-azulado más marcado (resalta los componentes y reduce el blanco)
        backgroundColor: '#0c1a2b',
        backgroundImage: `
          radial-gradient(1100px 520px at -18% -12%, rgba(37,56,94,.25), transparent 60%),
          radial-gradient(980px 420px at 118% -10%, rgba(250,204,21,.10), transparent 45%),
          url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18'%3E%3Cg fill='%23334155' fill-opacity='0.22'%3E%3Ccircle cx='1' cy='1' r='1'/%3E%3C/g%3E%3C/svg%3E"),
          linear-gradient(180deg, #0c1a2b 0%, #0f172a 55%, #102038 100%)
        `,
        backgroundAttachment: `${isNarrow ? 'scroll,scroll,scroll,scroll' : 'fixed,fixed,scroll,fixed'}`,
        backgroundRepeat: 'no-repeat,no-repeat,repeat,no-repeat',
        backgroundSize: 'cover,cover,auto,cover'
      }}
    >
      <div className="page-wrap" style={{ position: 'relative', zIndex: 2 }}>
        {/* HERO */}
        <section
          id="hero"
          className="reveal"
          style={{
            padding: 'clamp(0.9rem, 1.2vw + .6rem, 2rem)',
            margin: 'clamp(.6rem, 2vw, 2rem) auto 0',
            ...glassCard
          }}
        >
          <div className="w-full max-w-[1200px] mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
              {/* Columna izquierda (texto + CTA) */}
              <div>
                <h1
                  style={{
                    color: '#0f172a', // título oscuro sobre card clara
                    fontWeight: 900,
                    lineHeight: 1.15,
                    marginBottom: '0.5rem',
                    fontSize: 'clamp(1.2rem, 1.7vw + 1rem, 2.05rem)',
                    wordWrap: 'break-word',
                    wordBreak: 'break-word',
                    hyphens: 'auto'
                  }}
                >
                  {contenido.titulo}
                </h1>
                <p
                  className="break-words"
                  style={{ color: '#334155', fontSize: 'clamp(.98rem, .55vw + .78rem, 1.08rem)', marginBottom: '0.75rem', maxWidth: '70ch' }}
                >
                  {contenido.descripcion}
                </p>
                {error && (
                  <div style={{ background:'#fff7ed', color:'#9a3412', padding:'8px 12px', borderRadius:8, fontWeight:600, margin:'0.5rem 0' }}>
                    {error}
                  </div>
                )}
                <div className="grid gap-2 mt-2 text-slate-800">
                  {contenido.beneficios.slice(0, 3).map((b, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="inline-block" style={{ width: 10, height: 10, borderRadius: 9999, background: '#facc15' }} />
                      <span className="break-words">{b}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 flex-wrap mt-4">
                  <Link to="/tramites" style={{ textDecoration: 'none' }}>
                    <button className="btn btn-primary-unah">Comenzar un trámite</button>
                  </Link>
                  <Link to="/acerca" style={{ textDecoration: 'none' }}>
                    <button className="btn btn-outline-unah">Acerca del SGTG</button>
                  </Link>
                </div>
              </div>

              {/* Aside fechas (100% ancho en móvil) */}
              <aside className="reveal w-full" style={{ ...glassCard, overflow: 'hidden' }}>
                <div className="border-b border-slate-200 font-extrabold text-slate-900 p-4">
                  Próximas fechas
                </div>
                <div className="p-4 grid gap-3">
                  {fechasProximas.map((n, idx) => (
                    <div
                      key={idx}
                      className="grid items-center gap-2"
                      style={{ gridTemplateColumns: 'minmax(74px, 92px) 1fr' }}
                    >
                      <div
                        className="text-center font-extrabold rounded"
                        style={{
                          background: '#fff7ed',
                          color: '#9a3412',
                          border: '1px solid #fde68a',
                          padding: '6px 8px',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {n.f}
                      </div>
                      <div className="font-semibold text-slate-800 break-words hyphens-auto">{n.t}</div>
                    </div>
                  ))}
                </div>
                <div className="px-4 pb-4">
                  <Link to="/tramites" style={{ textDecoration: 'none' }} className="block w-full">
                    <button className="btn btn-primary-unah w-full">Ir a Trámites</button>
                  </Link>
                </div>
              </aside>
            </div>
          </div>
        </section>

        {/* KPIs */}
        <section id="indicadores" className="reveal section-gap">
          <div className="w-full max-w-[1200px] mx-auto px-4">
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {kpis.map((x, i) => (
                <div key={i} className="text-center" style={{ ...glassCard, padding: 'clamp(.7rem, .8vw + .45rem, 1.05rem)' }}>
                  <div className="text-slate-100" style={{ fontSize: 'clamp(1.2rem, 1vw + .9rem, 1.5rem)', fontWeight: 900, color: '#0f172a' }}>
                    {x.v}
                  </div>
                  <div className="font-extrabold text-slate-900 mt-0.5">{x.k}</div>
                  <div className="text-slate-600 text-[13px] mt-0.5">{x.d}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Recurso académico */}
        <section id="recursos" className="reveal section-gap">
          <div className="w-full max-w-[1200px] mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-4" style={{ ...glassCard, padding: 'clamp(1rem, 1vw, 1.25rem)' }}>
              <div>
                <h2 className="font-extrabold text-slate-900 mb-1">Guía oficial de requisitos de graduación</h2>
                <p className="text-slate-600">Consulta el documento actualizado de la FCEAC (UNAH) y prepara tu expediente con anticipación.</p>
              </div>
              <div className="text-right">
                <a
                  className="btn btn-primary-unah"
                  href="https://cienciaseconomicas.unah.edu.hn/dmsdocument/15965-requisitos-de-graduacion"
                  target="_blank"
                  rel="noreferrer"
                >
                  Ver/Descargar PDF
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section id="proceso" className="reveal section-gap">
          <div className="w-full max-w-[1200px] mx-auto px-4">
            <h2 className="text-center font-extrabold mb-3" style={{ color: '#e2e8f0' }}>Tu proceso en 4 pasos</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {pasos.map((p) => (
                <div key={p.n} className="grid gap-2" style={{ ...glassCard, borderRadius: 12, padding: 'clamp(.85rem, .8vw + .45rem, 1rem)' }}>
                  <div className="flex items-center gap-2">
                    <span className="grid place-items-center rounded-full" style={{ background: '#facc15', color: '#0f172a', fontWeight: 900, width: 36, height: 36 }}>{p.n}</span>
                    <span className="font-extrabold text-slate-900">{p.t}</span>
                  </div>
                  <div className="text-slate-600 text-sm">{p.d}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Avisos */}
        <section id="avisos" className="reveal section-gap">
          <div className="w-full max-w-[1200px] mx-auto px-4">
            <h2 className="text-center font-extrabold mb-3" style={{ color: '#e2e8f0' }}>Noticias y avisos</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {avisos.map((n, idx) => (
                <div key={idx} className="break-words hyphens-auto" style={{ ...glassCard, borderRadius: 12, padding: '1rem' }}>
                  <div className="font-bold" style={{ color: '#9a3412' }}>{n.fecha}</div>
                  <div className="font-extrabold text-slate-900 my-1">{n.t}</div>
                  <div className="text-slate-600 mb-2">{n.d}</div>
                  <Link to="/tramites" style={{ color: '#0f172a', fontWeight: 700, textDecoration: 'underline' }}>Ver detalles</Link>
                </div>
              ))}
              <div className="break-words hyphens-auto" style={{ gridColumn: '1 / -1', ...glassCard, borderRadius: 12, padding: '1rem' }}>
                <strong style={{ color: '#0f172a' }}>Nota importante</strong>
                <p className="text-slate-600 mt-1.5">
                  Las fechas límite para entregar expedientes a la Oficina de Trámite de Título son previas a las publicadas por Secretaría General y VOAE, pues existe un proceso interno de verificación y digitalización.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="reveal section-gap">
          <div className="w-full max-w-[1200px] mx-auto px-4">
            <div style={{ ...glassCard, padding: '1rem' }}>
              <h2 className="text-center font-extrabold mb-3" style={{ color: '#0f172a' }}>Preguntas frecuentes</h2>
              <details className="mb-2">
                <summary className="cursor-pointer font-bold" style={{ color: '#0f172a' }}>¿Necesito cuenta institucional?</summary>
                <p className="text-slate-600 mt-1">Puedes ingresar con tu cuenta institucional UNAH o un correo personal válido.</p>
              </details>
              <details className="mb-2">
                <summary className="cursor-pointer font-bold" style={{ color: '#0f172a' }}>¿Cómo doy seguimiento a mi trámite?</summary>
                <p className="text-slate-600 mt-1">Desde “Trámites” y tu panel verás estados y recibirás notificaciones.</p>
              </details>
              <details className="mb-2">
                <summary className="cursor-pointer font-bold" style={{ color: '#0f172a' }}>¿Dónde consulto requisitos?</summary>
                <p className="text-slate-600 mt-1">En la guía oficial y al iniciar un trámite el sistema te mostrará los requisitos aplicables.</p>
              </details>
            </div>
          </div>
        </section>

        {/* Footer institucional (azul UNAH con borde superior dorado) */}
        <footer
          className="reveal"
          role="contentinfo"
          style={{ background: '#1e3a8a', color: '#ffffff', borderTop: '4px solid #facc15', marginTop: '1rem', padding: '1rem 0.75rem' }}
        >
          <div
            className="w-full max-w-[1200px] mx-auto px-4 grid gap-3"
            style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', alignItems: 'center' }}
          >
            <div className="font-extrabold tracking-wide">SGTG – FCEAC UNAH</div>
            <div className="text-center">
              <a href="https://www.unah.edu.hn" target="_blank" rel="noreferrer" style={{ color: '#facc15', textDecoration: 'underline', marginRight: '0.5rem' }}>UNAH</a>
              <a href="https://campusvirtual.unah.edu.hn" target="_blank" rel="noreferrer" style={{ color: '#facc15', textDecoration: 'underline', marginRight: '0.5rem' }}>Campus Virtual</a>
              <a href="https://cienciaseconomicas.unah.edu.hn/" target="_blank" rel="noreferrer" style={{ color: '#facc15', textDecoration: 'underline' }}>FCEAC</a>
            </div>
            <div className="text-right text-[0.95rem]">© {new Date().getFullYear()} FCEAC – UNAH</div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default Landing;
// No requiere cambios aquí para logout automático, el Navbar lo maneja.
