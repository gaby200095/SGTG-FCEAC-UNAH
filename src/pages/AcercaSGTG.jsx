import React, { useEffect, useState } from 'react';
import './AcercaSGTG.css';
import { Link } from 'react-router-dom';

const AcercaSGTG = () => {
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

  // desactivar background-attachment fijo en móviles
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

  return (
    <div
      className="hero-wrap"
      style={{
        backgroundColor: '#0c1a2b',
        backgroundImage: [
          'radial-gradient(1100px 520px at -18% -12%, rgba(37,56,94,.25), transparent 60%)',
          'radial-gradient(980px 420px at 118% -10%, rgba(250,204,21,.10), transparent 45%)',
          'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'18\' height=\'18\'%3E%3Cg fill=\'%23334155\' fill-opacity=\'0.22\'%3E%3Ccircle cx=\'1\' cy=\'1\' r=\'1\'/%3E%3C/g%3E%3C/svg%3E")',
          'linear-gradient(180deg, #0c1a2b 0%, #0f172a 55%, #102038 100%)'
        ].join(','),
        backgroundAttachment: `${isNarrow ? 'scroll,scroll,scroll,scroll' : 'fixed,fixed,scroll,fixed'}`,
        backgroundRepeat: 'no-repeat,no-repeat,repeat,no-repeat',
        backgroundSize: 'cover,cover,auto,cover',
        minHeight: '100vh',
        padding: '2rem 0'
      }}
    >
      <div className="page-wrap" style={{ position: 'relative', zIndex: 2 }}>
        <section className="reveal" style={{ ...glassCard, margin: '0 auto', maxWidth: 1100, padding: 'clamp(1rem,1.2vw,2rem)' }}>
          <div className="w-full max-w-[1200px] mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              <div className="md:col-span-2">
                <h1 className="acerca-title">Acerca del SGTG</h1>
                <p className="acerca-desc">
                  El Sistema de Gestión de Trámites de Graduación (SGTG) es una plataforma académica‑administrativa diseñada para optimizar, automatizar y centralizar los procesos relacionados con la graduación de estudiantes en la Facultad de Ciencias Económicas, Administrativas y Contables (FCEAC) de la UNAH.
                </p>
                <p className="acerca-desc">
                  Esta plataforma facilita la interacción entre estudiantes, coordinadores y personal administrativo: iniciar solicitudes, adjuntar y verificar documentos, recibir notificaciones, y consultar el estado del proceso en tiempo real.
                </p>
                <div className="acerca-list-section">
                  <h2 className="acerca-subtitle">Objetivos principales</h2>
                  <ul className="acerca-list">
                    <li>Reducir tiempos de gestión y trámites presenciales.</li>
                    <li>Minimizar errores administrativos mediante validaciones.</li>
                    <li>Garantizar transparencia y trazabilidad en cada expediente.</li>
                    <li>Mejorar la experiencia del estudiante durante el proceso de titulación.</li>
                  </ul>
                </div>
                <p className="acerca-final">
                  En conjunto, el SGTG contribuye a la modernización de la gestión universitaria, alineándose con los principios de eficiencia, innovación y calidad académica de la UNAH.
                </p>
              </div>

              <aside style={{ ...glassCard, padding: 12 }}>
                <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Acciones rápidas</div>
                <div style={{ display: 'grid', gap: 8 }}>
                  <Link to="/tramites" className="btn btn-primary-unah" style={{ textAlign: 'center' }}>Iniciar trámite</Link>
                  <a href="https://cienciaseconomicas.unah.edu.hn/dmsdocument/15965-requisitos-de-graduacion" target="_blank" rel="noreferrer" className="btn btn-outline-unah" style={{ textAlign: 'center' }}>Guía de requisitos (PDF)</a>
                  <Link to="/contacto" className="btn" style={{ textAlign: 'center', background: '#eef2ff', color: '#0f172a', fontWeight:700 }}>Contacto y soporte</Link>
                </div>
              </aside>
            </div>
          </div>
        </section>

        {/* CTA final común y footer (se reutilizan estilos del proyecto) */}
        <section className="reveal" style={{ textAlign: 'center', marginTop: 20 }}>
          <div className="w-full max-w-[1200px] mx-auto px-4">
            <Link to="/tramites"><button className="btn btn-primary-unah">Comenzar trámite</button></Link>
          </div>
        </section>

        <footer className="reveal" role="contentinfo" style={{ background:'#1e3a8a', color:'#ffffff', borderTop:'4px solid #facc15', marginTop:'1rem', padding:'1rem 0.75rem' }}>
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

export default AcercaSGTG;
