import React, { useEffect, useState } from 'react';
import './Contacto.css';
import { Link } from 'react-router-dom';

const Contacto = () => {
  // Animación tipo reveal
  useEffect(() => {
    const sections = document.querySelectorAll('.reveal');
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('visible');
          else entry.target.classList.remove('visible');
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -5% 0px' }
    );
    sections.forEach((s) => obs.observe(s));
    return () => obs.disconnect();
  }, []);

  // Desactivar background-attachment: fixed en móviles
  const [isNarrow, setIsNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const onChange = (e) => setIsNarrow(e.matches);
    setIsNarrow(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Superficie “glass” como en Landing
  const glassCard = {
    background: 'rgba(230, 236, 245, 0.95)',
    backdropFilter: 'saturate(110%) blur(4px)',
    border: '1px solid #b6c2d1',
    boxShadow: '0 10px 24px rgba(2,6,23,0.10)',
    borderRadius: 12
  };

  // Ajuste sintaxis: attachment y backgroundImage en una sola cadena
  const bgAttachment = isNarrow ? 'scroll,scroll,scroll,scroll' : 'fixed,fixed,scroll,fixed';
  const bgImage = [
    'radial-gradient(1100px 520px at -18% -12%, rgba(37,56,94,.25), transparent 60%)',
    'radial-gradient(980px 420px at 118% -10%, rgba(250,204,21,.10), transparent 45%)',
    'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'18\' height=\'18\'%3E%3Cg fill=\'%23334155\' fill-opacity=\'0.22\'%3E%3Ccircle cx=\'1\' cy=\'1\' r=\'1\'/%3E%3C/g%3E%3C/svg%3E")',
    'linear-gradient(180deg, #0c1a2b 0%, #0f172a 55%, #102038 100%)'
  ].join(',');

  return (
    <div
      className="hero-wrap"
      style={{
        backgroundColor: '#0c1a2b',
        backgroundImage: bgImage,
        backgroundAttachment: bgAttachment,
        backgroundRepeat: 'no-repeat,no-repeat,repeat,no-repeat',
        backgroundSize: 'cover,cover,auto,cover',
        minHeight: '100vh'
      }}
    >
      <div className="page-wrap" style={{ position:'relative', zIndex:2 }}>
        {/* Card principal contacto */}
        <section
          className="reveal"
          style={{
            ...glassCard,
            padding: 'clamp(1rem, 1.2vw + .6rem, 2rem)',
            marginTop: 'clamp(.6rem, 2vw, 2rem)',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}
        >
          <div className="w-full max-w-[1200px] mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
              {/* Columna izquierda */}
              <div className="contacto-card" style={{ margin: 0 }}>
                <h2 className="contacto-title">Contacto y soporte</h2>
                <p className="contacto-desc">¿Dudas o inconvenientes? Escríbenos a:</p>
                <a href="mailto:cienciaseconomicas@unah.edu.hn" className="contacto-mail">
                  cienciaseconomicas@unah.edu.hn
                </a>
                <div className="contacto-info">Horario de atención: L–V, 8:00 a.m. – 4:00 p.m.</div>
                <div style={{ marginTop: '0.75rem' }}>
                  <Link to="/tramites" style={{ textDecoration:'none' }}>
                    <button className="btn btn-primary-unah">Comenzar un trámite</button>
                  </Link>
                </div>
              </div>

              {/* Columna derecha: recursos rápidos */}
              <aside className="reveal" style={{ ...glassCard, padding:'1rem', margin: 0 }}>
                <div style={{ borderBottom:'1px solid #b6c2d1', paddingBottom:8, marginBottom:12, fontWeight:800, color:'#0f172a' }}>
                  Recursos y enlaces
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
                </div>
              </aside>
            </div>
          </div>
        </section>

        {/* Footer institucional coherente con Landing */}
        <footer
          className="reveal"
          role="contentinfo"
          style={{ background:'#1e3a8a', color:'#ffffff', borderTop:'4px solid #facc15', marginTop:'1rem', padding:'1rem 0.75rem' }}
        >
          <div
            className="w-full max-w-[1200px] mx-auto px-4 grid gap-3"
            style={{ gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', alignItems:'center' }}
          >
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

export default Contacto;
