import React, { useEffect, useRef, useState } from 'react';
import './Navbar.css';
import { Link, useLocation, useHistory } from 'react-router-dom';
import { useAuth } from '../state/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const logged = !!user;
  const [profileOpen, setProfileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const profileRef = useRef(null);
  const location = useLocation();
  const history = useHistory();

  // Forzar logout si hay sesión previa y no estamos en panel privado
  useEffect(() => {
    const isPanel = /^\/panel\//.test(window.location.pathname);
    if (!isPanel && (localStorage.getItem('user') || localStorage.getItem('accessToken'))) {
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      sessionStorage.removeItem('pending2FA');
      sessionStorage.removeItem('lastLoginCreds');
      // Si hay sesión en memoria, recargar para limpiar contexto
      if (logged) window.location.reload();
    }
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handler = e => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    try { await logout(); } finally { history.replace('/login'); }
  };

  const isEstPanel = (location.pathname || '').startsWith('/panel/estudiante');
  const isSecPanel = (location.pathname || '').startsWith('/panel/secretaria');
  // NUEVO: Detectar panel de coordinador académico
  const isCoordPanel = (location.pathname || '').startsWith('/panel/coordinador');
  // NUEVO: Detectar panel administrativo
  const isAdmPanel = (location.pathname || '').startsWith('/panel/administrativo');
  const toggleSidebar = () => {
    try {
      if (isEstPanel) window.dispatchEvent(new CustomEvent('est:toggleSidebar'));
      if (isSecPanel) window.dispatchEvent(new CustomEvent('sec:toggleSidebar'));
      if (isCoordPanel) window.dispatchEvent(new CustomEvent('coord:toggleSidebar'));
      // Hamburguesa para panel administrativo
      if (isAdmPanel) window.dispatchEvent(new CustomEvent('adm:toggleSidebar'));
    } catch {}
  };

  // Nombre amigable igual que en el panel estudiante
  const friendlyName =
    [user?.nombre_usuario, user?.nombre, user?.apellido_usuario, user?.apellido]
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

  const correo = user?.correo_usuario || user?.correo || '';

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''} ${logged ? 'navbar-auth' : 'navbar-public'}`} aria-label="Barra de navegación">
      <div className="navbar-container" style={{ justifyContent: 'space-between' }}>
        {/* Izquierda: logo/título o controles del panel */}
        <div className="navbar-logo-group">
          {!logged && (
            <>
              <Link to="/" onClick={()=>setMenuOpen(false)}>
                <img src={process.env.PUBLIC_URL + '/LOGO FCEAC.png'} alt="Logo FCEAC" className="navbar-logo" />
              </Link>
              <span className="navbar-title">SGTG - FCEAC UNAH</span>
              <button
                type="button"
                className="navbar-burger"
                aria-label="Abrir menú"
                aria-controls="navbar-menu"
                aria-expanded={menuOpen}
                onClick={()=>setMenuOpen(v=>!v)}
              >
                ☰
              </button>
            </>
          )}
          {logged && isEstPanel && (
            <>
              <button
                type="button"
                onClick={toggleSidebar}
                aria-label="Alternar menú"
                title="Alternar menú"
                style={{
                  background:'rgba(255,255,255,.12)',
                  border:'1px solid rgba(255,255,255,.25)',
                  color:'#fff',
                  borderRadius:8,
                  padding:'6px 10px',
                  fontWeight:800,
                  cursor:'pointer'
                }}
              >
                ☰
              </button>
              <span className="navbar-title">Panel del Estudiante</span>
            </>
          )}
          {logged && isSecPanel && (
            <>
              <button
                type="button"
                onClick={toggleSidebar}
                aria-label="Alternar menú"
                title="Alternar menú"
                style={{
                  background:'rgba(255,255,255,.12)',
                  border:'1px solid rgba(255,255,255,.25)',
                  color:'#fff',
                  borderRadius:8,
                  padding:'6px 10px',
                  fontWeight:800,
                  cursor:'pointer'
                }}
              >
                ☰
              </button>
              <span className="navbar-title">Panel de Secretaría Académica</span>
            </>
          )}
          {/* NUEVO: Panel de Coordinador Académico */}
          {logged && isCoordPanel && (
            <>
              <button
                type="button"
                onClick={toggleSidebar}
                aria-label="Alternar menú"
                title="Alternar menú"
                style={{
                  background: 'rgba(255,255,255,0.12)',
                  border: '1px solid #fff',
                  color: '#fff',
                  borderRadius: 8,
                  padding: '6px 14px',
                  fontWeight: 900,
                  fontSize: 22,
                  cursor: 'pointer',
                  marginRight: 8
                }}
              >
                ☰
              </button>
              <span className="navbar-title" style={{ color: '#fff' }}>
                Panel de Coordinador Académico
              </span>
            </>
          )}
          {/* NUEVO: Panel Administrativo */}
          {logged && isAdmPanel && (
            <>
              <button
                type="button"
                onClick={toggleSidebar}
                aria-label="Alternar menú"
                title="Alternar menú"
                style={{
                  background: 'rgba(255,255,255,0.12)',
                  border: '1px solid #fff',
                  color: '#fff',
                  borderRadius: 8,
                  padding: '6px 14px',
                  fontWeight: 900,
                  fontSize: 22,
                  cursor: 'pointer',
                  marginRight: 8
                }}
              >
                ☰
              </button>
              <span className="navbar-title" style={{ color: '#fff', fontWeight: 900, fontSize: 20, textTransform: 'uppercase', letterSpacing: '.5px' }}>
                Panel Administrativo
              </span>
            </>
          )}
        </div>

        {/* Centro: enlaces públicos */}
        {!logged && (
          <>
            {menuOpen && <div className="navbar-menu-overlay" onClick={()=>setMenuOpen(false)} aria-hidden />}
            <div id="navbar-menu" className={`navbar-links ${menuOpen ? 'open' : ''}`} aria-hidden={false}>
              <Link to="/" className="navbar-link" onClick={()=>setMenuOpen(false)}>Inicio</Link>
              <Link to="/tramites" className="navbar-link" onClick={()=>setMenuOpen(false)}>Trámites</Link>
              <Link to="/contacto" className="navbar-link" onClick={()=>setMenuOpen(false)}>Contacto</Link>
              <Link to="/recursos" className="navbar-link" onClick={()=>setMenuOpen(false)}>Recursos</Link>
              <Link to="/login" onClick={()=>setMenuOpen(false)}>
                <button className="navbar-login">Iniciar Sesión</button>
              </Link>
            </div>
          </>
        )}

        {/* Derecha: perfil solo cuando está autenticado */}
        {logged && (
          <div ref={profileRef} className={`navbar-profile-wrapper ${profileOpen ? 'open' : ''}`}>
            <button
              type="button"
              className={`navbar-profile-trigger ${profileOpen ? 'open' : ''}`}
              onClick={()=>setProfileOpen(o=>!o)}
              aria-haspopup="true"
              aria-expanded={profileOpen}
              aria-label="Menú de perfil"
              title={correo}
              style={{ minWidth: 120 }}
            >
              <span className="navbar-profile-avatar">{(friendlyName || correo).charAt(0).toUpperCase()}</span>
              <span className="navbar-profile-texts">
                <span className="navbar-profile-name" title={friendlyName}>{friendlyName || correo}</span>
                <span className="navbar-profile-mail" title={correo}>{correo}</span>
              </span>
              <span className={`navbar-profile-caret ${profileOpen?'open':''}`}>▾</span>
            </button>
            {profileOpen && (
              <div className="navbar-profile-menu" role="menu" style={{ minWidth: 220 }}>
                <div className="profile-menu-group" style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb', background: '#f8fafc', borderRadius: '14px 14px 0 0' }}>
                  <div style={{ fontWeight: 700, color: '#1e40af', fontSize: 15 }}>{friendlyName || correo}</div>
                  <div style={{ color: '#64748b', fontSize: 13, marginTop: 2, wordBreak: 'break-all' }}>{correo}</div>
                </div>
                <div className="profile-menu-group" style={{ padding: '10px 16px' }}>
                  <button
                    type="button"
                    className="profile-menu-item danger"
                    style={{
                      background: '#fef2f2',
                      color: '#dc2626',
                      border: 'none',
                      borderRadius: 8,
                      padding: '10px 0',
                      width: '100%',
                      fontWeight: 700,
                      fontSize: 15,
                      cursor: 'pointer'
                    }}
                    onClick={logout}
                  >
                    <i className="fas fa-sign-out-alt" style={{ marginRight: 8 }}></i>
                    Cerrar sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;