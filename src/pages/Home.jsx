import React, { useEffect } from 'react';
import './Home.css';
import { Link } from 'react-router-dom';

const Home = () => {
  // NUEVO: revelar secciones al hacer scroll
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

  return (
    <div className="hero-wrap" style={{ backgroundImage:`url(${process.env.PUBLIC_URL + '/fondo1.png'})` }}>
      <div className="hero-overlay" />
      <div className="page-wrap" style={{ position:'relative', zIndex:2 }}>
        {/* HERO CARD */}
        <div className="reveal card-hero" style={{ padding:'2rem', textAlign:'center', maxWidth:900, margin:'3rem auto 0' }}>
          <h1 className="home-title">Bienvenido(a) al Sistema de Gestión de Trámites de Graduación</h1>
          <p className="home-desc">
            Gestiona tus trámites de graduación de la Facultad de Ciencias Económicas, Administrativas y Contables de forma rápida y segura.
          </p>
          <img src={process.env.PUBLIC_URL + '/LOGO FCEAC.png'} alt="Logo FCEAC" className="home-logo" />

          {/* Separador */}
          <div style={{ borderTop:'1px solid #facc15', marginTop:'1rem', paddingTop:'1rem' }}>
            <p style={{ color: '#374151', textAlign: 'center', marginBottom: '0.5rem' }}>
              Centraliza tus trámites de graduación de forma simple, transparente y segura.
            </p>
            <ul style={{ listStyle: 'disc inside', color: '#1e293b', lineHeight: 1.6, textAlign: 'left', maxWidth: 520, margin: '0.25rem auto 0' }}>
              <li>Inicia solicitudes y carga documentos desde un solo lugar.</li>
              <li>Consulta requisitos y estados de tus procesos en tiempo real.</li>
              <li>Recibe notificaciones y recordatorios oportunos.</li>
            </ul>
          </div>
        </div>

        {/* ACCESOS RÁPIDOS */}
        <section className="reveal section-gap" style={{ maxWidth:'1100px' }}>
          <h2 style={{ color:'#1e3a8a', fontWeight:800, textAlign:'center', marginBottom:'1rem' }}>
            Accesos rápidos
          </h2>
          <div className="grid-3">
            <Link to="/tramites" style={{ textDecoration: 'none' }}>
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #facc15',
                  borderRadius: '0.75rem',
                  boxShadow: '0 2px 12px rgba(30,58,138,0.08)',
                  padding: '1.25rem',
                  textAlign: 'center',
                  color: '#1e3a8a'
                }}
              >
                <div style={{ fontSize: '2rem' }}>📝</div>
                <h3 style={{ fontWeight: 800, marginTop: '0.5rem' }}>Iniciar trámite</h3>
                <p style={{ color: '#374151', marginTop: '0.25rem' }}>Solicitud, inscripción y seguimiento.</p>
              </div>
            </Link>
            <Link to="/acerca" style={{ textDecoration: 'none' }}>
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #facc15',
                  borderRadius: '0.75rem',
                  boxShadow: '0 2px 12px rgba(30,58,138,0.08)',
                  padding: '1.25rem',
                  textAlign: 'center',
                  color: '#1e3a8a'
                }}
              >
                <div style={{ fontSize: '2rem' }}>📘</div>
                <h3 style={{ fontWeight: 800, marginTop: '0.5rem' }}>Acerca del SGTG</h3>
                <p style={{ color: '#374151', marginTop: '0.25rem' }}>Objetivos, alcances y beneficios.</p>
              </div>
            </Link>
            <Link to="/contacto" style={{ textDecoration: 'none' }}>
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #facc15',
                  borderRadius: '0.75rem',
                  boxShadow: '0 2px 12px rgba(30,58,138,0.08)',
                  padding: '1.25rem',
                  textAlign: 'center',
                  color: '#1e3a8a'
                }}
              >
                <div style={{ fontSize: '2rem' }}>📨</div>
                <h3 style={{ fontWeight: 800, marginTop: '0.5rem' }}>Soporte FCEAC</h3>
                <p style={{ color: '#374151', marginTop: '0.25rem' }}>Comunícate con el equipo.</p>
              </div>
            </Link>
          </div>
        </section>

        {/* CÓMO USAR */}
        <section className="reveal card-hero" style={{ margin:'2rem auto 0', padding:'1.25rem' }}>
          <h2 style={{ color: '#1e3a8a', fontWeight: 800, textAlign: 'center', marginBottom: '0.75rem' }}>
            ¿Cómo usar la plataforma?
          </h2>
          <ol style={{ listStyle: 'decimal inside', color: '#1e293b', fontSize: '1.05rem', lineHeight: 1.6 }}>
            <li>Ingresa con tu correo institucional UNAH.</li>
            <li>Selecciona el trámite que deseas realizar.</li>
            <li>Sube los documentos requeridos y verifica requisitos.</li>
            <li>Da seguimiento al estado y recibe notificaciones.</li>
          </ol>
          <p style={{ marginTop: '0.75rem', color: '#374151', fontStyle: 'italic' }}>
            Consejo: Revisa frecuentemente tu correo institucional y la plataforma para confirmar avances.
          </p>

          <div
            style={{
              marginTop: '0.75rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '0.75rem'
            }}
          >
            {[
              { icon: '🔑', t: 'Ingresa', d: 'Con tu correo UNAH.' },
              { icon: '🧾', t: 'Elige trámite', d: 'Selecciona el proceso.' },
              { icon: '📤', t: 'Sube documentos', d: 'Adjunta requisitos.' },
              { icon: '📊', t: 'Da seguimiento', d: 'Revisa tu estado.' }
            ].map((item, idx) => (
              <div
                key={idx}
                style={{
                  background: '#ffffff',
                  border: '1px solid #facc15',
                  borderRadius: '0.5rem',
                  padding: '0.75rem',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '1.6rem' }}>{item.icon}</div>
                <div style={{ color: '#1e3a8a', fontWeight: 800, marginTop: '0.25rem' }}>{item.t}</div>
                <div style={{ color: '#374151' }}>{item.d}</div>
              </div>
            ))}
          </div>
        </section>

        {/* BENEFICIOS */}
        <section className="reveal section-gap" style={{ maxWidth:'1100px' }}>
          <div className="grid-3">
            {[
              { icon: '⚡', t: 'Rápido y centralizado', d: 'Todo el proceso en una sola plataforma.' },
              { icon: '🔔', t: 'Notificaciones', d: 'Enteráte de cambios y requisitos al instante.' },
              { icon: '🔒', t: 'Seguro', d: 'Tus datos se manejan con confidencialidad.' }
            ].map((item, idx) => (
              <div
                key={idx}
                style={{
                  background: '#ffffff',
                  border: '1px solid #facc15',
                  borderRadius: '0.75rem',
                  boxShadow: '0 2px 12px rgba(30,58,138,0.08)',
                  padding: '1rem',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '1.75rem' }}>{item.icon}</div>
                <h3 style={{ color: '#1e3a8a', fontWeight: 800, marginTop: '0.4rem' }}>{item.t}</h3>
                <p style={{ color: '#374151', marginTop: '0.25rem' }}>{item.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* AVISOS */}
        <section className="reveal card-hero" style={{ margin:'2rem auto 0', padding:'1rem', maxWidth:'1100px' }}>
          <h2 style={{ color: '#1e3a8a', fontWeight: 800, textAlign: 'center', marginBottom: '0.75rem' }}>
            Noticias y avisos importantes
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '1rem'
            }}
          >
            {[
              { fecha: '15 Mar 2025', t: 'Inscripción a acto de graduación', d: 'Inicio del periodo de inscripción.' },
              { fecha: '28 Mar 2025', t: 'Límite carga de documentos', d: 'Último día para adjuntar requisitos.' },
              { fecha: '05 Abr 2025', t: 'Revisión de expedientes', d: 'Publicación de observaciones.' },
              { fecha: '4 agosto', t: 'Recepción de expedientes', d: 'Inicio de recepción de expedientes (Ceremonia dic. 2025).' },
              { fecha: '8 sept.', t: 'Límite con honores', d: 'Límite para entregar expedientes que soliciten honores académicos.' },
              { fecha: '30 sept.', t: 'Límite sin honores', d: 'Límite para entregar expedientes sin distinción honorífica.' },
              { fecha: '13 dic.', t: 'Ceremonia de Graduación Pública', d: 'Ceremonia de Graduación Pública (Diciembre 2025).' }
            ].map((n, idx) => (
              <div
                key={idx}
                style={{
                  background: '#ffffff',
                  border: '1px solid #facc15',
                  borderRadius: '0.75rem',
                  boxShadow: '0 2px 12px rgba(30,58,138,0.08)',
                  padding: '1rem'
                }}
              >
                <div style={{ color: '#b45309', fontWeight: 700 }}>{n.fecha}</div>
                <h3 style={{ color: '#1e3a8a', fontWeight: 800, margin: '0.25rem 0' }}>{n.t}</h3>
                <p style={{ color: '#374151', marginBottom: '0.5rem' }}>{n.d}</p>
                <Link to="/tramites" style={{ color: '#1e3a8a', fontWeight: 700, textDecoration: 'underline' }}>
                  Ver detalles
                </Link>
              </div>
            ))}

            {/* Nota importante */}
            <div
              style={{
                gridColumn: '1 / -1',
                background: '#ffffff',
                border: '1px solid #facc15',
                borderRadius: '0.75rem',
                boxShadow: '0 2px 12px rgba(30,58,138,0.08)',
                padding: '1rem'
              }}
            >
              <h3 style={{ color: '#1e3a8a', fontWeight: 800, marginBottom: '0.35rem', textAlign: 'center' }}>
                Nota importante
              </h3>
              <p style={{ color: '#374151', lineHeight: 1.6, textAlign: 'center' }}>
                Tomar en cuenta que las fechas límite para entregar Expedientes de Graduación a la Oficina de Trámite de Título
                son distintas a las publicadas por Secretaría General y VOAE, ya que hay un proceso previo de verificación
                y digitalización de cada expediente.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="reveal card-hero" style={{ margin:'2rem auto 0', padding:'1rem' }}>
          <h2 style={{ color: '#1e3a8a', fontWeight: 800, textAlign: 'center', marginBottom: '0.75rem' }}>
            Preguntas frecuentes
          </h2>
          <details style={{ margin: '0.5rem 0' }}>
            <summary style={{ cursor: 'pointer', color: '#1e3a8a', fontWeight: 700 }}>¿Necesito cuenta institucional?</summary>
            <p style={{ color: '#374151', marginTop: '0.25rem' }}>Sí, utiliza tu correo y credenciales UNAH para ingresar.</p>
          </details>
          <details style={{ margin: '0.5rem 0' }}>
            <summary style={{ cursor: 'pointer', color: '#1e3a8a', fontWeight: 700 }}>¿Cómo doy seguimiento a mi trámite?</summary>
            <p style={{ color: '#374151', marginTop: '0.25rem' }}>Desde “Trámites” verás el estado y recibirás notificaciones.</p>
          </details>
          <details style={{ margin: '0.5rem 0' }}>
            <summary style={{ cursor: 'pointer', color: '#1e3a8a', fontWeight: 700 }}>¿Dónde consulto requisitos?</summary>
            <p style={{ color: '#374151', marginTop: '0.25rem' }}>Al iniciar un trámite, el sistema te muestra requisitos y formatos.</p>
          </details>
        </section>

        {/* CTA */}
        <section className="reveal" style={{ textAlign:'center', marginBottom:'2rem' }}>
          <Link to="/tramites" style={{ textDecoration:'none' }}>
            <button className="btn btn-primary-unah">
              Comenzar trámite
            </button>
          </Link>
        </section>

        {/* FOOTER */}
        <footer className="reveal footer-academic">
          <div
            style={{
              maxWidth: '1100px',
              margin: '0 auto',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '0.75rem',
              alignItems: 'center'
            }}
          >
            <div style={{ fontWeight: 800, letterSpacing: '0.5px' }}>SGTG – FCEAC UNAH</div>
            <div style={{ textAlign: 'center' }}>
              <a href="https://www.unah.edu.hn" target="_blank" rel="noreferrer" style={{ color: '#facc15', textDecoration: 'underline', marginRight: '0.5rem' }}>
                UNAH
              </a>
              <a href="https://campusvirtual.unah.edu.hn" target="_blank" rel="noreferrer" style={{ color: '#facc15', textDecoration: 'underline', marginRight: '0.5rem' }}>
                Campus Virtual
              </a>
              <a href="https://cienciaseconomicas.unah.edu.hn/" target="_blank" rel="noreferrer" style={{ color: '#facc15', textDecoration: 'underline' }}>
                FCEAC
              </a>
            </div>
            <div style={{ textAlign: 'right', fontSize: '0.95rem' }}>
              © {new Date().getFullYear()} FCEAC – UNAH
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Home;