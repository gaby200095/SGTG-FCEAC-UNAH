import React, { useState, useEffect, useRef } from 'react';
import { Link, useHistory, useLocation } from 'react-router-dom';
import './Navbar.css';
import { useAuth } from '../state/AuthContext';

const Navbar = () => {
    const [open, setOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const menuRef = useRef(null);
    const profileRef = useRef(null);
    const history = useHistory();
    const location = useLocation(); // NUEVO para cerrar menú al cambiar ruta
    const { user, logout } = useAuth();

    // NUEVO: estado para nombre completo garantizado
    const [fullName, setFullName] = useState('');

    // NUEVO: obtener nombre completo si no viene en el objeto user
    useEffect(() => {
      let abort = false;
      (async () => {
        if (!user) {
          setFullName('');
          return;
        }
        // Si ya trae nombres en el objeto user, utilizarlos
        const localNombre = (user.nombre_usuario || user.nombre || '').trim();
        const localApellido = (user.apellido_usuario || user.apellido || '').trim();
        if (localNombre || localApellido) {
          const compuesto = `${localNombre} ${localApellido}`.trim();
          setFullName(compuesto.toUpperCase());
          return;
        }
        // Intentar cargar desde tabla usuario_sistema
        try {
          const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/table/usuario_sistema?limit=500`);
          if (!res.ok) return;
          const rows = await res.json();
          if (abort) return;
          const registro = rows.find(r => r.id_usuario === user.id_usuario);
          if (registro) {
            const n = (registro.nombre_usuario || registro.nombre || '').trim();
            const a = (registro.apellido_usuario || registro.apellido || '').trim();
            const comp = `${n} ${a}`.trim();
            setFullName(comp ? comp.toUpperCase() : (user.correo?.split('@')[0] || '').toUpperCase());
          } else {
            setFullName((user.correo?.split('@')[0] || '').toUpperCase());
          }
        } catch {
          setFullName((user.correo?.split('@')[0] || '').toUpperCase());
        }
      })();
      return () => { abort = true; };
    }, [user]);

    // Reemplaza displayName previo usando fullName
    const displayName = fullName; // ahora siempre mayúsculas si se logra construir
    const avatarTxt = (displayName || user?.correo || 'U').trim().charAt(0).toUpperCase();

    useEffect(() => {
        const mq = window.matchMedia('(max-width: 768px)');
        const onChange = (e) => setIsMobile(e.matches);
        setIsMobile(mq.matches);
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, []);

    useEffect(() => {
      const handler = e => {
        if (profileRef.current && !profileRef.current.contains(e.target)) {
          setProfileOpen(false);
        }
      };
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }, []);

    useEffect(()=>{ setOpen(false); setProfileOpen(false); }, [location.pathname]);

    // NUEVO: cerrar con Escape
    useEffect(()=>{
      const onKey = (e)=>{
        if(e.key === 'Escape'){
          setProfileOpen(false);
          setOpen(false);
        }
      };
      window.addEventListener('keydown', onKey);
      return ()=>window.removeEventListener('keydown', onKey);
    },[]);

    const handleLogout = async () => {
      try { await logout(); } finally {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        history.push('/login');
        setProfileOpen(false);
      }
    };

    const logged = !!user;
    const role = user?.roles?.[0];

    // NUEVO: menús condicionales
    const publicLinks = (
      <>
        <Link to="/" className="navbar-link" onClick={()=>setOpen(false)}>Inicio</Link>
        <Link to="/tramites" className="navbar-link" onClick={()=>setOpen(false)}>Trámites</Link>
        <Link to="/contacto" className="navbar-link" onClick={()=>setOpen(false)}>Contacto</Link>
        <Link to="/acerca" className="navbar-link" onClick={()=>setOpen(false)}>Acerca del SGTG</Link>
        <Link to="/login" onClick={()=>setOpen(false)}>
          <button className="navbar-login">Iniciar Sesión</button>
        </Link>
      </>
    );

    const panelPath =
      role === 'coordinador' ? '/panel/coordinador' :
      role === 'administrativo' ? '/panel/administrativo' :
      role === 'secretaria_general' ? '/panel/secretaria' :
      '/panel/estudiante';

    const privateLinks = (
      <>
        <Link to={panelPath} className="navbar-link" onClick={()=>setOpen(false)}>Panel</Link>
        <Link to="/tramites" className="navbar-link" onClick={()=>setOpen(false)}>Trámites</Link>
        <Link to="/expedientes" className="navbar-link" onClick={()=>setOpen(false)}>Expedientes</Link>
        {/* Se pueden añadir más enlaces internos aquí */}
      </>
    );

    // NUEVO: cálculo dinámico de maxHeight en móvil (incluye menú perfil)
    const mobileDynamicStyle = isMobile
      ? {
          maxHeight: open
            ? (profileOpen ? '100vh' : `${menuRef.current?.scrollHeight || 480}px`)
            : 0,
          padding: open ? '0.75rem 0.25rem 0.75rem 0' : 0,
          overflowY: open ? 'auto' : 'hidden'
        }
      : undefined;

    return (
        <nav className={`navbar ${logged ? 'navbar-auth' : 'navbar-public'}`}>
          <div className="navbar-container">
                <div className="navbar-logo-group">
                    <Link to={logged ? panelPath : '/'} onClick={() => setOpen(false)}>
                        <img src={process.env.PUBLIC_URL + '/LOGO FCEAC.png'} alt="Logo FCEAC" className="navbar-logo" />
                    </Link>
                    <span className="navbar-title">
                        SGTG - FCEAC UNAH
                    </span>
                    <button
                        type="button"
                        className="navbar-burger"
                        aria-label="Abrir menú"
                        aria-controls="navbar-menu"
                        aria-expanded={open}
                        onClick={() => setOpen(v => !v)}
                    >
                        ☰
                    </button>
                </div>
                <div
                    id="navbar-menu"
                    ref={menuRef}
                    className={`navbar-links ${open ? 'open' : ''} ${profileOpen ? 'profile-expanded' : ''}`}
                    aria-hidden={isMobile ? (!open) : false}
                    style={mobileDynamicStyle}
                >
                    {!logged && publicLinks}

                    {logged && (
                      <>
                        {privateLinks}
                        <div
                          ref={profileRef}
                          className={`navbar-profile-wrapper ${profileOpen ? 'open' : ''}`} // quitado 'reveal'
                        >
                          <button
                            type="button"
                            className={`navbar-profile-trigger ${profileOpen ? 'open' : ''}`}
                            onClick={()=>setProfileOpen(o=>!o)}
                            aria-haspopup="true"
                            aria-expanded={profileOpen}
                            aria-label="Menú de perfil"
                          >
                            <span className="navbar-profile-avatar">{avatarTxt}</span>
                            <span className="navbar-profile-texts">
                              <span className="navbar-profile-name" title={displayName}>{displayName}</span>
                              <span className="navbar-profile-mail" title={user.correo}>{user.correo}</span>
                            </span>
                            <span className={`navbar-profile-caret ${profileOpen?'open':''}`}>▾</span>
                          </button>
                          {profileOpen && (
                            <>
                              {/* Overlay móvil / pantallas pequeñas */}
                              <div
                                className="navbar-profile-overlay"
                                onClick={()=>setProfileOpen(false)}
                              />
                              <div className="navbar-profile-menu" role="menu"> {/* quitado 'reveal' */}
                                <div className="profile-menu-group">
                                  {/* Eliminados enlaces duplicados Panel / Trámites / Expedientes */}
                                  <button
                                    type="button"
                                    className="profile-menu-item danger"
                                    onClick={handleLogout}
                                  >
                                    Cerrar sesión
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </>
                    )}
                 </div>
            </div>
        </nav>
    );
};

export default Navbar;