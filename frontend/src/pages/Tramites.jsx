import React, { useEffect, useState } from 'react';
import './Tramites.css';
import { useAuth } from '../state/AuthContext';
import { useHistory, Link } from 'react-router-dom';

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
      window.location.assign('/login'); // recarga
      return;
    }
    const role = user.roles?.[0];
    let panel = '/panel/estudiante';
    if (role === 'coordinador') panel = '/panel/coordinador';
    else if (role === 'administrativo') panel = '/panel/administrativo';
    else if (role === 'secretaria_general') panel = '/panel/secretaria';
    window.location.assign(panel); // recarga
  };

  // Fondo responsive: desactiva fixed en móviles
  const [isNarrow, setIsNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const onChange = (e) => setIsNarrow(e.matches);
    setIsNarrow(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Superficie “glass” (coincide con Landing)
  const glassCard = {
    background: 'rgba(230, 236, 245, 0.95)',
    backdropFilter: 'saturate(110%) blur(4px)',
    border: '1px solid #b6c2d1',
    boxShadow: '0 10px 24px rgba(2,6,23,0.10)',
    borderRadius: 12
  };

  return (
    <div
      className="hero-wrap"
      style={{
        minHeight: '100vh',
        backgroundColor: '#0c1a2b',
        backgroundImage: `
          radial-gradient(1100px 520px at -18% -12%, rgba(37,56,94,.25), transparent 60%),
          radial-gradient(980px 420px at 118% -10%, rgba(250,204,21,.10), transparent 45%),
          url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18'%3E%3Cg fill='%23334155' fill-opacity='0.22'%3E%3Ccircle cx='1' cy='1' r='1'/%3E%3C/g%3E%3C/svg%3E"),
          linear-gradient(180deg, #0c1a2b 0%, #0f172a 55%, #102038 100%)
        `,
        backgroundAttachment: `${isNarrow ? 'scroll,scroll,scroll,scroll' : 'fixed,fixed,scroll,fixed'}`,
        backgroundRepeat: 'no-repeat,no-repeat,repeat,no-repeat',
        backgroundSize: 'cover,cover,auto,cover',
        padding: '2rem 0',
      }}
    >
      <div className="page-wrap" style={{ position:'relative', zIndex:2, width:'100%' }}>
        <section className="reveal" style={{ ...glassCard, padding:'clamp(1rem, 1.2vw + .6rem, 2rem)', margin:'0 auto' }}>
          <div className="w-full max-w-[1200px] mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
              {/* Columna principal */}
              <div>
                <h1 className="tramites-title" style={{ color:'#0f172a' }}>Trámites</h1>
                <p className="tramites-desc" style={{ color:'#334155' }}>
                  Gestiona tu proceso de graduación de forma clara y segura.
                </p>
                <ul className="tramites-list">
                  <li>Solicitud de revisión de expediente</li>
                  <li>Inscripción a acto de graduación</li>
                  <li>Seguimiento de estado de trámite</li>
                </ul>
                <div style={{ marginTop:'1rem' }}>
                  <button
                    onClick={handleComenzar}
                    className="btn btn-primary-unah"
                    style={{ fontWeight:800 }}
                  >
                    Comenzar trámite
                  </button>
                  <div style={{ fontSize: 12, marginTop: 8, color: '#1f2937' }}>
                    {user ? 'Serás llevado a tu panel para continuar.' : 'Inicia sesión para empezar con tu trámite.'}
                  </div>
                </div>
              </div>
              {/* Aside de apoyo */}
              <aside className="reveal" style={{ ...glassCard, padding:'1rem' }}>
                <div style={{ borderBottom:'1px solid #b6c2d1', paddingBottom:8, marginBottom:12, fontWeight:800, color:'#0f172a' }}>
                  Recursos útiles
                </div>
                <div style={{ display:'grid', gap:10 }}>
                  <a
                    className="btn btn-primary-unah"
                    href="https://cienciaseconomicas.unah.edu.hn/dmsdocument/15965-requisitos-de-graduacion"
                    target="_blank"
                    rel="noreferrer"
                    style={{ textAlign:'center' }}
                  >
                    Ver requisitos (PDF)
                  </a>
                  <Link to="/acerca" style={{ textDecoration:'none', textAlign:'center', color:'#1e3a8a', fontWeight:700 }}>
                    Acerca del SGTG
                  </Link>
                  <Link to="/contacto" style={{ textDecoration:'none', textAlign:'center', color:'#1e3a8a', fontWeight:700 }}>
                    Soporte y contacto
                  </Link>
                </div>
              </aside>
            </div>
          </div>
        </section>

        
        {/* Pie de página común */}
        <footer
          className="reveal"
          style={{ background:'#1e3a8a', color:'#ffffff', borderTop:'4px solid #facc15', marginTop:'1rem', padding:'1rem 0.75rem' }}
        >
          <div className="w-full max-w-[1200px] mx-auto px-4 grid gap-3" style={{ gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', alignItems:'center' }}>
            <div className="font-extrabold tracking-wide">SGTG – FCEAC UNAH</div>
            <div className="text-center">
              <a href="https://www.unah.edu.hn" target="_blank" rel="noreferrer" style={{ color:'#facc15', textDecoration:'underline', marginRight:'0.5rem' }}>UNAH</a>
              <a href="https://campusvirtual.unah.edu.hn" target="_blank" rel="noreferrer" style={{ color:'#facc15', textDecoration:'underline', marginRight:'0.5rem' }}>Campus Virtual</a>
              <a href="https://cienciaseconomicas.unah.edu.hn/" target="_blank" rel="noreferrer" style={{ color:'#facc15', textDecoration:'underline' }}>FCEAC</a>
            </div>
            <div className="text-right text-[0.95rem]">© {new Date().getFullYear()} FCEAC – UNAH</div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Tramites;
