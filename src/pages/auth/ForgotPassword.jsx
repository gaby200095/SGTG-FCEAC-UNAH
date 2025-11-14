import React, { useState, useEffect } from 'react';
import { useAuth } from '../../state/AuthContext';

const ForgotPassword = () => {
  const { forgot, resetPassword } = useAuth();
  const [correo, setCorreo] = useState('');
  const [msg, setMsg] = useState(null);
  const [token, setToken] = useState('');
  const [pwd, setPwd] = useState('');
  const [pwd2, setPwd2] = useState('');
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);
  const [devLink, setDevLink] = useState('');
  const [expiresIn, setExpiresIn] = useState(15);
  const [showPwd, setShowPwd] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);

  const strong = (s='') => s.length >= 8 && /\d/.test(s) && /[^A-Za-z0-9\s]/.test(s);
  const emailOk = (e='') => /^[A-Z0-9._%+-]+@([A-Z0-9-]+\.)+[A-Z]{2,}$/i.test(String(e||'').trim());
  // Validación estricta de dominio (cliente)
  const TLD_WHITELIST = ['.com','.net','.org','.edu','.gov','.hn','.es','.me','.io','.dev','.co','.mx','.ar','.cl'];
  const SAFE_PROVIDERS = [
    'gmail.com','googlemail.com','outlook.com','hotmail.com','hotmail.es',
    'live.com','live.com.mx','yahoo.com','yahoo.es','icloud.com','me.com',
    'proton.me','protonmail.com','unah.edu.hn','unah.hn'
  ];
  const DISPOSABLE_HINTS = ['mailinator','tempmail','10minutemail','guerrillamail','yopmail','trashmail','sharklasers'];
  const emailOkStrict = (e='') => {
    if (!emailOk(e)) return false;
    const domain = String(e.split('@')[1] || '').toLowerCase().trim();
    if (!domain || domain.includes('..') || domain.startsWith('.') || domain.endsWith('.')) return false;
    if (!TLD_WHITELIST.some(t => domain.endsWith(t))) return false;
    if (DISPOSABLE_HINTS.some(k => domain.includes(k))) return false;
    // Acepta proveedores comunes o cualquier dominio con TLD permitido (el backend hará MX)
    return true;
  };

  useEffect(()=>{
    const els = document.querySelectorAll('.reveal');
    const obs = new IntersectionObserver(es=>{
      es.forEach(e=>{
        if(e.isIntersecting) e.target.classList.add('visible');
        else e.target.classList.remove('visible');
      });
    },{ threshold:0.2 });
    els.forEach(el=>obs.observe(el));
    return ()=>obs.disconnect();
  },[]);

  useEffect(()=>{
    const p = new URLSearchParams(window.location.search);
    const t = p.get('t');
    if (t) setToken(t);
  },[]);

  // Cooldown para evitar envíos múltiples
  const [cooldownSec, setCooldown] = useState(0);
  useEffect(() => {
    if (cooldownSec <= 0) return;
    const id = setInterval(() => setCooldown(v => (v > 0 ? v - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [cooldownSec]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr(null); setMsg(null);
    setDevLink('');
    if (token) {
      if (!strong(pwd)) { setErr('La contraseña debe tener mínimo 8 caracteres, al menos 1 número y 1 símbolo.'); return; }
      if (pwd !== pwd2) { setErr('Las contraseñas no coinciden.'); return; }
      setLoading(true);
      const res = await resetPassword({ token, password: pwd });
      setLoading(false);
      if (res?.ok) {
        setMsg('Contraseña actualizada. Serás redirigido al inicio de sesión…');
        setTimeout(()=> window.location.assign('/login'), 900);
      } else {
        setErr(res?.error || 'No fue posible restablecer la contraseña.');
      }
    } else {
      if (!correo) { setErr('Correo requerido'); return; }
      if (!emailOkStrict(correo)) { setErr('Dominio de correo no válido'); return; }
      setLoading(true);
      if (cooldownSec <= 0) setCooldown(30); // bloquear múltiples envíos por 30s
      const res = await forgot(correo);
      setLoading(false);
      if (res?.error) {
        setErr(res?.detail || res.error || 'No fue posible procesar la solicitud.');
      } else {
        setMsg(res?.message || 'Hemos enviado un enlace a tu correo.');
        if (res?.devLink) setDevLink(res.devLink);
        if (res?.expiresInMin) setExpiresIn(res.expiresInMin);
      }
    }
  };

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
        <section className="reveal" style={{ ...glassCard, margin:'0 auto', padding:'clamp(1rem,1.2vw + .6rem,2rem)' }}>
          <div className="w-full max-w-[1200px] mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
              {/* Columna principal: formulario */}
              <div>
                <h2 style={{ color:'#0f172a', fontWeight:900, marginBottom:10 }}>
                  {token ? 'Define tu nueva contraseña' : 'Restablecer contraseña'}
                </h2>

                {!token && (
                  <div style={{ background:'#ecfeff', color:'#0e7490', padding:10, borderRadius:8, marginBottom:12, fontSize:13 }}>
                    Ingresa tu correo personal. Te enviaremos un enlace válido por {expiresIn} minutos. Revisa tu bandeja y Spam.
                  </div>
                )}
                {token && (
                  <div style={{ background:'#f1f5f9', color:'#0f172a', padding:10, borderRadius:8, marginBottom:12, fontSize:13 }}>
                    Escribe una contraseña segura (8+ caracteres, 1 número y 1 símbolo).
                  </div>
                )}

                {err && (
                  <div style={{ background:'#fee2e2', color:'#991b1b', padding:10, borderRadius:8, marginBottom:10, fontSize:12 }}>
                    {err}
                  </div>
                )}
                {msg && (
                  <div style={{ background:'#dcfce7', color:'#166534', padding:10, borderRadius:8, marginBottom:10, fontSize:12 }}>
                    {msg}
                  </div>
                )}
                {msg && !devLink && !token && (
                  <div style={{ background:'#fff7ed', color:'#9a3412', padding:8, borderRadius:8, marginBottom:10, fontSize:12 }}>
                    Si no recibes el correo, verifica que este correo esté registrado.
                  </div>
                )}

                <form onSubmit={onSubmit} style={{ display:'grid', gap:10 }}>
                  {!token ? (
                    <>
                      <label style={{ fontWeight:700, color:'#0f172a' }}>Correo</label>
                      <input
                        type="email"
                        placeholder="correo@unah.hn"
                        value={correo}
                        onChange={e=>setCorreo(e.target.value)}
                        required
                        style={{ padding:'10px 12px', border:'1px solid #cbd5e1', borderRadius:8, background:'#fff' }}
                      />
                      <button
                        type="submit"
                        disabled={loading || !emailOkStrict(correo) || cooldownSec > 0}
                        className="btn btn-primary-unah"
                        style={{
                          background: (loading || !emailOkStrict(correo) || cooldownSec > 0) ? '#94a3b8' : '#facc15',
                          color: '#1e3a8a', fontWeight:800, borderRadius:8, padding:'10px 12px',
                          cursor: (loading || !emailOkStrict(correo) || cooldownSec > 0) ? 'not-allowed' : 'pointer', border:0
                        }}
                        title={cooldownSec > 0 ? `Podrás reenviar en ${cooldownSec}s` : undefined}
                      >
                        {loading ? 'Enviando…' : (cooldownSec > 0 ? `Reintentar en ${cooldownSec}s` : 'Enviar enlace')}
                      </button>
                    </>
                  ) : (
                    <>
                      <label style={{ fontWeight:700, color:'#0f172a' }}>Nueva contraseña</label>
                      <input
                        type={showPwd ? 'text' : 'password'}
                        placeholder="Nueva contraseña"
                        value={pwd}
                        onChange={e=>setPwd(e.target.value)}
                        required
                        style={{ padding:'10px 12px', border:'1px solid #cbd5e1', borderRadius:8, background:'#fff' }}
                      />
                      <label style={{ fontSize:12, display:'inline-flex', alignItems:'center', gap:6, userSelect:'none' }}>
                        <input type="checkbox" checked={showPwd} onChange={()=>setShowPwd(v=>!v)} style={{ cursor:'pointer' }} />
                        Mostrar contraseña
                      </label>

                      <label style={{ fontWeight:700, color:'#0f172a' }}>Confirmar contraseña</label>
                      <input
                        type={showPwd2 ? 'text' : 'password'}
                        placeholder="Confirmar contraseña"
                        value={pwd2}
                        onChange={e=>setPwd2(e.target.value)}
                        required
                        style={{ padding:'10px 12px', border:'1px solid #cbd5e1', borderRadius:8, background:'#fff' }}
                      />
                      <label style={{ fontSize:12, display:'inline-flex', alignItems:'center', gap:6, userSelect:'none' }}>
                        <input type="checkbox" checked={showPwd2} onChange={()=>setShowPwd2(v=>!v)} style={{ cursor:'pointer' }} />
                        Mostrar contraseña
                      </label>

                      <div style={{ fontSize:12, color: strong(pwd) ? '#166534' : '#991b1b' }}>
                        Fortaleza: {strong(pwd) ? 'Correcta' : 'Débil (usa 8+ caracteres, 1 número y 1 símbolo)'}
                      </div>

                      <button
                        type="submit"
                        disabled={loading || !strong(pwd) || pwd !== pwd2}
                        className="btn btn-primary-unah"
                        style={{
                          background: (loading || !strong(pwd) || pwd !== pwd2) ? '#94a3b8' : '#facc15',
                          color:'#1e3a8a', fontWeight:800, borderRadius:8, padding:'10px 12px',
                          cursor: (loading || !strong(pwd) || pwd !== pwd2) ? 'not-allowed' : 'pointer', border:0
                        }}
                      >
                        {loading ? 'Guardando…' : 'Guardar nueva contraseña'}
                      </button>
                    </>
                  )}
                </form>

                <div style={{ marginTop:12, fontSize:12, color:'#475569' }}>
                  <span
                    onClick={()=>window.location.assign('/login')}
                    style={{ color:'#1e3a8a', cursor:'pointer', textDecoration:'underline' }}
                  >
                    Volver a iniciar sesión
                  </span>
                </div>
              </div>

              {/* Aside reemplazado */}
              <aside className="reveal" style={{ ...glassCard, padding:'1rem' }}>
                <div style={{ borderBottom:'1px solid #b6c2d1', paddingBottom:8, marginBottom:12, fontWeight:800, color:'#0f172a' }}>
                  {token ? 'Recomendaciones de seguridad' : 'Privacidad y entrega'}
                </div>
                {!token ? (
                  <div style={{ color:'#334155', fontSize:'.98rem', lineHeight:1.55 }}>
                    <p style={{ margin:0 }}>
                      Si tu correo está registrado, enviaremos un enlace válido por {expiresIn} minuto(s).
                      No compartimos tus datos y no indicamos si una cuenta existe por motivos de seguridad.
                    </p>
                    <p style={{ margin:'10px 0 0' }}>
                      Si presentas inconvenientes, escribe a
                      {' '}<a href="mailto:cienciaseconomicas@unah.edu.hn" style={{ color:'#1e3a8a', fontWeight:700 }}>cienciaseconomicas@unah.edu.hn</a>.
                    </p>
                    {cooldownSec > 0 && (
                      <p style={{ margin:'10px 0 0', fontSize:12, color:'#1f2937' }}>
                        Puedes solicitar un nuevo enlace en {cooldownSec}s.
                      </p>
                    )}
                  </div>
                ) : (
                  <div style={{ color:'#334155', fontSize:'.98rem', lineHeight:1.55 }}>
                    <ul style={{ margin:0, paddingLeft:'1rem' }}>
                      <li>No reutilices contraseñas de otros servicios.</li>
                      <li>Usa una frase larga con números y símbolos.</li>
                      <li>Evita datos personales o patrones comunes.</li>
                      <li>Activa 2FA en tu perfil cuando inicies sesión.</li>
                    </ul>
                  </div>
                )}
              </aside>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ForgotPassword;
