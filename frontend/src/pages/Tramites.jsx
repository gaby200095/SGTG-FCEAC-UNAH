import React, { useEffect } from 'react';
import './Tramites.css';
import { useAuth } from '../state/AuthContext';
import { useHistory } from 'react-router-dom'; // <-- ya no se usa Link aquí

const Tramites = () => {
  const { user } = useAuth();
  const history = useHistory();

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

  const handleComenzar = () => {
    if (!user) {
      history.push('/login');
      return;
    }
    const role = user.roles?.[0];
    let panel = '/panel/estudiante';
    if (role === 'coordinador') panel = '/panel/coordinador';
    else if (role === 'administrativo') panel = '/panel/administrativo';
    else if (role === 'secretaria_general') panel = '/panel/secretaria';
    history.push(panel);
  };

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
        <div className="tramites-card reveal">
          <h1 className="tramites-title">Trámites</h1>
          <p className="tramites-desc">Aquí podrás gestionar tus trámites de graduación.</p>
          <ul className="tramites-list">
            <li>Solicitud de revisión de expediente</li>
            <li>Inscripción a acto de graduación</li>
            <li>Seguimiento de estado de trámite</li>
          </ul>
        </div>

        {/* CTA final común */}
        <section className="reveal" style={{ textAlign: 'center', margin: '2rem 0' }}>
          <button
            onClick={handleComenzar}
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
          <div style={{ fontSize: 12, marginTop: 8, color: '#ffffffdd' }}>
            {user
              ? 'Serás llevado a tu panel para continuar.'
              : 'Inicia sesión para continuar con tus trámites.'}
          </div>
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

export default Tramites;
