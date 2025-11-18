import React, { useEffect, useState } from 'react';
import './CentroRecursos.css';

const CentroRecursos = () => {
  // Reveal
  useEffect(() => {
    const sections = document.querySelectorAll('.reveal');
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((en) => en.isIntersecting ? en.target.classList.add('visible') : en.target.classList.remove('visible')),
      { threshold: 0.15, rootMargin: '0px 0px -5% 0px' }
    );
    sections.forEach((s) => obs.observe(s));
    return () => obs.disconnect();
  }, []);

  // Fondo responsive
  const [isNarrow, setIsNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const onChange = (e) => setIsNarrow(e.matches);
    setIsNarrow(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const glassCard = {
    background: 'rgba(230,236,245,0.95)',
    backdropFilter: 'saturate(110%) blur(4px)',
    border: '1px solid #b6c2d1',
    boxShadow: '0 10px 24px rgba(2,6,23,0.10)',
    borderRadius: 12
  };
  const bgAttachment = isNarrow ? 'scroll,scroll,scroll,scroll' : 'fixed,fixed,scroll,fixed';
  const bgImage = [
    'radial-gradient(1100px 520px at -18% -12%, rgba(37,56,94,.25), transparent 60%)',
    'radial-gradient(980px 420px at 118% -10%, rgba(250,204,21,.10), transparent 45%)',
    'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'18\' height=\'18\'%3E%3Cg fill=\'%23334155\' fill-opacity=\'0.22\'%3E%3Ccircle cx=\'1\' cy=\'1\' r=\'1\'/%3E%3C/g%3E%3C/svg%3E")',
    'linear-gradient(180deg, #0c1a2b 0%, #0f172a 55%, #102038 100%)'
  ].join(',');

  const groups = [
    {
      title: 'Manual del sistema',
      desc: 'Uso del SGTG para estudiantes y personal. Próximamente en PDF.',
      items: [
        { name: 'Manual de usuario (Estudiante)', href: '#', soon: true },
        { name: 'Manual de coordinadores', href: '#', soon: true },
      ]
    },
    {
      title: 'Formatos oficiales',
      desc: 'Plantillas y formatos institucionales.',
      items: [
        { name: 'Solicitud de revisión de expediente', href: '#', soon: true },
        { name: 'Formato de carta de compromiso', href: '#', soon: true },
      ]
    },
    {
      title: 'Guías en PDF',
      desc: 'Orientaciones para completar tu proceso de graduación.',
      items: [
        { name: 'Guía rápida de trámites', href: '#', soon: true },
        { name: 'Pasos para cargar documentos', href: '#', soon: true },
      ]
    },
    {
      title: 'Reglamentos',
      desc: 'Documentos normativos y políticas aplicables.',
      items: [
        { name: 'Reglamento académico', href: '#', soon: true },
        { name: 'Políticas de titulación', href: '#', soon: true },
      ]
    }
  ];

  const prevent = (e) => { e.preventDefault(); };

  return (
    <div
      className="hero-wrap"
      style={{
        minHeight: '100vh',
        backgroundColor: '#0c1a2b',
        backgroundImage: bgImage,
        backgroundAttachment: bgAttachment,
        backgroundRepeat: 'no-repeat,no-repeat,repeat,no-repeat',
        backgroundSize: 'cover,cover,auto,cover',
        padding: '2rem 0'
      }}
    >
      <div className="page-wrap" style={{ position:'relative', zIndex:2, width:'100%' }}>
        <section className="reveal visible" style={{ ...glassCard, margin:'0 auto', padding:'clamp(1rem,1.2vw + .6rem,2rem)' }}>
          <div className="w-full max-w-[1200px] mx-auto px-4">
            <header style={{ marginBottom: 14 }}>
              <h1 style={{ color:'#0f172a', fontWeight:900, margin:0 }}>Centro de recursos</h1>
              <p style={{ color:'#334155', margin:'6px 0 0' }}>
                Repositorio institucional de recursos: manuales del sistema, formatos oficiales, guías y reglamentos.
                Materiales centralizados para consulta y, próximamente, descarga.
              </p>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {groups.map((g, idx) => (
                <div key={idx} className="reveal cr-card" style={{ ...glassCard, padding:'1rem' }}>
                  <div style={{ fontWeight:900, color:'#0f172a' }}>{g.title}</div>
                  <div style={{ color:'#334155', fontSize:'.98rem', margin:'6px 0 10px' }}>{g.desc}</div>
                  <div className="cr-list">
                    {g.items.map((it, i) => (
                      <div key={i} className="cr-item">
                        <div className="cr-name">{it.name}</div>
                        <a
                          href={it.href}
                          onClick={prevent}
                          className="cr-btn"
                          aria-disabled="true"
                          title="Próximamente"
                        >
                          Descargar
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="cr-foot" style={{ marginTop:16, color:'#475569', fontSize:12 }}>
              ¿No encuentras un formato? Escríbenos a{' '}
              <a href="mailto:cienciaseeconomicas@unah.edu.hn" style={{ color:'#1e3a8a', fontWeight:800 }}>
                cienciaseeconomicas@unah.edu.hn
              </a>.
            </div>
          </div>
        </section>

        {/* Footer reutilizado */}
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

export default CentroRecursos;
