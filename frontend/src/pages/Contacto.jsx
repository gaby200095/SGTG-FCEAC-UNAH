import React, { useEffect } from 'react';
import './Contacto.css';
import { Link } from 'react-router-dom';

const Contacto = () => {
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
        overflowX: 'hidden' // antes: overflow: 'hidden'
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
        <div className="contacto-card reveal" style={{ position: 'relative', textAlign: 'center' }}>
          {/* Bloque unificado */}
          <h2 style={{ color: '#1e3a8a', fontWeight: 800, marginBottom: '0.5rem' }}>
            Contacto y soporte
          </h2>
          <p style={{ color: '#374151', marginBottom: '0.5rem' }}>
            ¿Dudas o inconvenientes? Escríbenos a:
          </p>
          <a
            href="mailto:cienciaseconomicas@unah.edu.hn"
            style={{ color: '#f59e0b', fontWeight: 800, textDecoration: 'underline' }}
          >
            cienciaseconomicas@unah.edu.hn
          </a>
          <div style={{ color: '#1e293b', marginTop: '0.5rem' }}>
            Horario de atención: L–V, 8:00 a.m. – 4:00 p.m.
          </div>
          <div style={{ marginTop: '0.75rem' }}>
            <Link to="/contacto" style={{ textDecoration: 'none' }}>
              <button
                style={{
                  background: '#facc15',
                  color: '#1e3a8a',
                  fontWeight: 800,
                  border: 0,
                  borderRadius: '0.5rem',
                  padding: '0.6rem 1.2rem',
                  cursor: 'pointer',
                  boxShadow: '0 2px 10px rgba(30,58,138,0.15)'
                }}
              >
                Más opciones de contacto
              </button>
            </Link>
          </div>
        </div>

        {/* CTA final común */}
        <section className="reveal" style={{ textAlign: 'center', margin: '2rem 0' }}>
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
              Comenzar trámite
            </button>
          </Link>
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

export default Contacto;
