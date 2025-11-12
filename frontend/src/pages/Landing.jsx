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

  useEffect(() => {
    fetch('http://localhost:5001/api/landing', { cache: 'no-store' })
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

  return (
    <div
      className="home-bg"
      style={{
        minHeight: '100vh',
        position: 'relative',
        background: `url(${process.env.PUBLIC_URL + '/fondo1.png'}) center/cover no-repeat fixed`,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '2rem 0',
        overflowX: 'hidden' // antes: overflow: 'hidden'
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(120deg, rgba(30,58,138,0.55) 0%, rgba(250,204,21,0.25) 100%)',
          zIndex: 1
        }}
      />
      {/* Contenido principal (hero + secciones) */}
      <div style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: '1100px', padding: '0 1rem' }}>
        {/* HERO + BIENVENIDA UNIFICADOS */}
        <section
          className="reveal"
          style={{
            background: '#fff',
            borderRadius: '1rem',
            boxShadow: '0 2px 16px rgba(30,58,138,0.10)',
            padding: '2.5rem 2rem 2rem 2rem',
            textAlign: 'center',
            maxWidth: '900px',
            margin: '3rem auto 0 auto',
            border: '1px solid #facc15'
          }}
        >
          <h1 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#1e3a8a', marginBottom: '1.2rem', textShadow: '1px 1px 2px #facc1533' }}>
            {contenido.titulo}
          </h1>
          <p style={{ fontSize: '1.15rem', color: '#374151', marginBottom: '1rem' }}>
            {contenido.descripcion}
          </p>
          {error && (
            <p style={{ color: '#b45309', fontWeight: 600, marginBottom: '0.75rem' }}>
              {error}
            </p>
          )}
          <ul style={{ listStyle: 'disc inside', color: '#1e293b', lineHeight: 1.6, textAlign: 'left', maxWidth: '720px', margin: '0.5rem auto 0' }}>
            {contenido.beneficios.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        </section>

        {/* ACCESOS RÁPIDOS */}
        <section className="reveal" style={{ margin: '2rem auto 0', maxWidth: '1100px' }}>
          <h2 style={{ color: '#1e3a8a', fontWeight: 800, textAlign: 'center', marginBottom: '1rem' }}>
            Accesos rápidos
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: '1rem'
            }}
          >
            <Link to="/tramites" style={{ textDecoration: 'none' }}>
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #facc15',
                  borderRadius: '0.75rem',
                  boxShadow: '0 2px 12px rgba(30,58,138,0.08)',
                  padding: '1.25rem',
                  textAlign: 'center',
                  color: '#1e3a8a',
                  transition: 'transform .15s ease, box-shadow .15s ease'
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
                  color: '#1e3a8a',
                  transition: 'transform .15s ease, box-shadow .15s ease'
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
                  color: '#1e3a8a',
                  transition: 'transform .15s ease, box-shadow .15s ease'
                }}
              >
                <div style={{ fontSize: '2rem' }}>📨</div>
                <h3 style={{ fontWeight: 800, marginTop: '0.5rem' }}>Soporte FCEAC</h3>
                <p style={{ color: '#374151', marginTop: '0.25rem' }}>Comunícate con el equipo.</p>
              </div>
            </Link>
          </div>
        </section>

        {/* CÓMO USAR (YA EXISTE) */}
        <section
          className="reveal"
          style={{
            margin: '2rem auto 0',
            background: 'rgba(255,255,255,0.95)',
            border: '1px solid #facc15',
            borderRadius: '0.75rem',
            boxShadow: '0 2px 12px rgba(30,58,138,0.08)',
            padding: '1.25rem'
          }}
        >
          <h2 style={{ color: '#1e3a8a', fontWeight: 800, textAlign: 'center', marginBottom: '0.75rem' }}>
            ¿Cómo usar la plataforma?
          </h2>
          <ol style={{ listStyle: 'decimal inside', color: '#1e293b', fontSize: '1.05rem', lineHeight: 1.6 }}>
            <li>Ingresa con tu cuenta institucional UNAH.</li>
            <li>Selecciona el trámite que deseas realizar.</li>
            <li>Sube los documentos requeridos y verifica requisitos.</li>
            <li>Da seguimiento al estado y recibe notificaciones.</li>
          </ol>
          <p style={{ marginTop: '0.75rem', color: '#374151', fontStyle: 'italic' }}>
            Consejo: Revisa frecuentemente tu correo institucional y la plataforma para confirmar avances.
          </p>

          {/* NUEVO: PASOS CON ÍCONOS (COMPLEMENTO VISUAL) */}
          <div
            style={{
              marginTop: '0.75rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '0.75rem'
            }}
          >
            {[
              { icon: '🔑', t: 'Ingresa', d: 'Con tu cuenta UNAH.' },
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

        {/* AVISOS / BENEFICIOS RÁPIDOS */}
        <section className="reveal" style={{ margin: '2rem auto 0', maxWidth: '1100px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: '1rem'
            }}
          >
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

        {/* NUEVO: NOTICIAS Y AVISOS IMPORTANTES */}
        <section
          className="reveal"
          style={{
            margin: '2rem auto 0',
            background: '#ffffff',
            border: '1px solid #facc15',
            borderRadius: '0.75rem',
            boxShadow: '0 2px 12px rgba(30,58,138,0.08)',
            padding: '1rem',
            maxWidth: '1100px'
          }}
        >
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
              // Avisos existentes
              { fecha: '15 Mar 2025', t: 'Inscripción a acto de graduación', d: 'Inicio del periodo de inscripción.' },
              { fecha: '28 Mar 2025', t: 'Límite carga de documentos', d: 'Último día para adjuntar requisitos.' },
              { fecha: '05 Abr 2025', t: 'Revisión de expedientes', d: 'Publicación de observaciones.' },
              // Avisos de la imagen (formato tal cual)
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

            {/* Nota importante (de la imagen) */}
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

        {/* PREGUNTAS FRECUENTES */}
        <section
          className="reveal"
          style={{
            margin: '2rem auto',
            background: '#ffffff',
            border: '1px solid #facc15',
            borderRadius: '0.75rem',
            boxShadow: '0 2px 12px rgba(30,58,138,0.08)',
            padding: '1rem'
          }}
        >
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

        {/* CTA FINAL */}
        <section className="reveal" style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link to="/tramites" style={{ textDecoration: 'none' }}>
            <button
              style={{
                background: '#facc15',
                color: '#1e3a8a',
                fontWeight: 800,
                border: 0,
                borderRadius: '0.5rem',
                padding: '0.75rem 1.5rem',
                cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(30,58,138,0.15)'
              }}
            >
              Comenzar un trámite
            </button>
          </Link>
        </section>

        {/* NUEVO: PIE DE PÁGINA (ENLACES ÚTILES) */}
        <footer
          className="reveal"
          style={{
            background: '#1e3a8a',
            color: '#ffffff',
            borderTop: '4px solid #facc15',
            marginTop: '1rem',
            padding: '1rem 0.75rem'
          }}
        >
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
        {/* FIN NUEVAS SECCIONES */}
      </div>
    </div>
  );
}

export default Landing;
