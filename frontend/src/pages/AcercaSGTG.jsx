import React, { useEffect } from 'react';
import './AcercaSGTG.css';

const AcercaSGTG = () => {
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
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 0',
      overflow: 'hidden'
    }}
  >
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'linear-gradient(120deg, rgba(30,58,138,0.55) 0%, rgba(250,204,21,0.25) 100%)',
        zIndex: 1
      }}
    />
    <div style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: '1100px', padding: '0 1rem' }}>
      <div className="acerca-card reveal" style={{ position: 'relative', zIndex: 2 }}>
        <h1 className="acerca-title">Acerca del SGTG</h1>
        <p className="acerca-desc">
          El Sistema de Gestión de Trámites de Graduación (SGTG) es una plataforma académica-administrativa diseñada para optimizar, automatizar y centralizar los procesos relacionados con la graduación de estudiantes en la Facultad de Ciencias Económicas, Administrativas y Contables (FCEAC) de la UNAH.
        </p>
        <p className="acerca-desc">
          Este sistema busca facilitar la interacción entre estudiantes, coordinadores y personal administrativo, brindando un espacio digital en el que se puedan realizar solicitudes, dar seguimiento a documentos, verificar requisitos, recibir notificaciones y generar reportes en tiempo real.
        </p>
        <div className="acerca-list-section">
          <h2 className="acerca-subtitle">Con el SGTG se pretende:</h2>
          <ul className="acerca-list">
            <li>Reducir tiempos de gestión y trámites presenciales.</li>
            <li>Minimizar errores en el proceso administrativo.</li>
            <li>Garantizar mayor transparencia y accesibilidad en la información.</li>
            <li>Mejorar la experiencia del estudiante desde la solicitud hasta la culminación del proceso de titulación.</li>
          </ul>
        </div>
        <p className="acerca-final">
          En conjunto, el sistema contribuye a la modernización de la gestión universitaria, alineándose con los principios de eficiencia, innovación y calidad académica de la UNAH.
        </p>
      </div>

      {/* CTA final común */}
      <section className="reveal" style={{ textAlign: 'center', margin: '2rem 0' }}>
        <a href="/tramites" style={{ textDecoration: 'none' }}>
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
            Comenzar trámite
          </button>
        </a>
      </section>

      {/* Pie de página común */}
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
    </div>
  </div>
  );
};

export default AcercaSGTG;
