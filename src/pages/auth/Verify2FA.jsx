import React, { useState, useEffect } from 'react';
import { useAuth } from '../../state/AuthContext';
import { useHistory } from 'react-router-dom';

const Verify2FA = () => {
  const { verify2FA, resend2FA, cancel2FA, pending2FA, user } = useAuth();
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState(null);
  const [msgType, setMsgType] = useState('info');
  const [resending, setResending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [redirecting, setRedirecting] = useState(false); // evita dobles redirecciones
  const [autoTried, setAutoTried] = useState(false);
  const [isNarrow, setIsNarrow] = useState(false);
  const [cooldownSec, setCooldown] = useState(0);
  const history = useHistory();

  const routeFromRoles = (roles = []) => {
    const r = (roles || []).map(x => String(x || '').toLowerCase());
    if (r.includes('secretaria_general')) return '/panel/secretaria';
    if (r.includes('administrativo')) return '/panel/administrativo';
    if (r.includes('coordinador')) return '/panel/coordinador';
    return '/panel/estudiante';
  };

  // Redirigir SOLO si ya hay usuario, no hay 2FA y NO estamos en proceso de redirección
  useEffect(() => {
    if (!redirecting && user && !pending2FA && Array.isArray(user.roles)) {
      history.replace(routeFromRoles(user.roles));
    }
  }, [pending2FA, user, history, redirecting]);

  // Auto-rescate una vez si no hay pending2FA
  useEffect(() => {
    (async () => {
      if (pending2FA || autoTried) return;
      setAutoTried(true);
      setMsg('Generando/reenviando código 2FA…');
      setMsgType('info');
      const r = await resend2FA();
      setMsg(r.message || (r.ok ? 'Código reenviado.' : 'No se pudo generar el código.'));
      setMsgType(r.ok ? 'ok' : 'error');
    })();
  }, [pending2FA, autoTried, resend2FA]);

  // Reveal suave (coherente con el sitio)
  useEffect(()=> {
    const els = document.querySelectorAll('.reveal');
    const obs = new IntersectionObserver(es=>{
      es.forEach(e=>{
        if(e.isIntersecting){
          e.target.classList.add('visible');
        } else {
          e.target.classList.remove('visible');
        }
      });
    },{ threshold:0.15, rootMargin:'0px 0px -5% 0px' });
    els.forEach(el=>obs.observe(el));
    return ()=>obs.disconnect();
  },[]);

  // Fondo responsive estilo Landing (desactiva fixed en móviles)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const onChange = (e) => setIsNarrow(e.matches);
    setIsNarrow(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Cooldown para bloquear reenvíos múltiples del código
  useEffect(() => {
    if (cooldownSec <= 0) return;
    const id = setInterval(() => setCooldown(v => (v > 0 ? v - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [cooldownSec]);

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

  // NUEVO: helpers de estilo (Banners)
  const Banner = ({ type='info', children }) => {
    const styles = {
      info:   { bg:'#ecfeff', color:'#0e7490' },
      error:  { bg:'#fee2e2', color:'#991b1b' },
      ok:     { bg:'#dcfce7', color:'#166534' }
    }[msgType] || { bg:'#eef2ff', color:'#1e3a8a' };
    return (
      <div style={{ background:styles.bg, color:styles.color, padding:10, borderRadius:8, marginBottom:10, fontSize:12 }}>
        {children}
      </div>
    );
  };

  const onChangeCode = (v) => {
    const only = v.replace(/\D+/g,'').slice(0,6);
    setCode(only);
    if (msg) setMsg(null);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (code.trim().length !== 6) return;
    setVerifying(true);
    const { ok, data } = await verify2FA({ code });
    setVerifying(false);
    if (ok && data?.user?.roles) {
      setMsg('2FA verificado. Redirigiendo…');
      setMsgType('ok');
      const dest = routeFromRoles(data.user.roles);
      // Redirigir sin recargar (evita disparar el logout-forzado del boot)
      try { sessionStorage.setItem('skipBootLogout', '1'); } catch {}
      setRedirecting(true);
      history.replace(dest);
    } else {
      setMsg(data?.error || 'Código 2FA incorrecto');
      setMsgType('error');
    }
  };

  const handleResend = async () => {
    if (resending || cooldownSec > 0) return; // Bloquear reenvíos múltiples
    setResending(true);
    const r = await resend2FA();
    setResending(false);
    setMsg(r.message || (r.ok ? 'Código reenviado.' : 'No se pudo reenviar el código.'));
    setMsgType(r.ok ? 'ok' : 'error');
    setCooldown(30); // 30s de espera
  };
  const handleBackToLogin = () => {
    cancel2FA();
    // Regresar con SPA (no refresca)
    history.replace('/login');
  };

  const isSetup = !!pending2FA?.setup;
  const secret = pending2FA?.setup?.secret;
  const otpauth = pending2FA?.setup?.otpauth;
  const viaEmail = !!pending2FA?.email;

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
          <div className="w-full max-w-[900px] mx-auto px-4">
            <div className="grid grid-cols-1 gap-5">
              <div>
                <h2 style={{ color:'#0f172a', fontWeight:900, marginBottom:10 }}>Verificación 2FA</h2>

                {/* Mensajería contextual */}
                {isSetup && (
                  <Banner type="info">
                    <div style={{ fontWeight:700, marginBottom:6 }}>Configura tu app de autenticación:</div>
                    <div>1) Abre Google Authenticator/Authy.</div>
                    <div>2) Agrega cuenta manualmente con la clave:</div>
                    <div style={{ margin:'6px 0', background:'#f1f5f9', color:'#0f172a', padding:8, borderRadius:6, fontFamily:'monospace', fontWeight:700 }}>
                      {secret}
                    </div>
                    <div>3) Ingresa el código de 6 dígitos para activar.</div>
                    {!!otpauth && <div style={{ marginTop:6, opacity:.8 }}>URL otpauth: {otpauth}</div>}
                  </Banner>
                )}

                {!isSetup && viaEmail && (
                  <Banner type="info">
                    Hemos enviado un código de 6 dígitos a tu correo. Ingrésalo a continuación. El código expira en 5 minutos.
                  </Banner>
                )}

                {msg && <Banner type={msgType}>{msg}</Banner>}

                {/* Formulario de verificación */}
                <form onSubmit={onSubmit} style={{ display:'flex', gap:10, marginBottom: 12 }}>
                  <input
                    placeholder="Código 2FA"
                    value={code}
                    onChange={e=>onChangeCode(e.target.value)}
                    inputMode="numeric"
                    pattern="\d{6}"
                    maxLength={6}
                    required
                    autoFocus
                    style={{
                      flex:1,
                      padding:'10px 12px',
                      border:'1px solid #cbd5e1',
                      borderRadius:8,
                      fontSize:18,
                      letterSpacing:6,
                      textAlign:'center',
                      fontWeight:700,
                      background:'#fff'
                    }}
                  />
                  <button
                    type="submit"
                    disabled={verifying || code.length !== 6}
                    style={{
                      background: verifying || code.length !== 6 ? '#94a3b8' : '#facc15',
                      color: verifying || code.length !== 6 ? '#0f172a' : '#1e3a8a',
                      fontWeight:800,
                      border:0,
                      borderRadius:8,
                      padding:'10px 14px',
                      cursor: verifying || code.length !== 6 ? 'not-allowed' : 'pointer',
                      minWidth:110
                    }}
                  >
                    {verifying ? 'Verificando…' : 'Verificar'}
                  </button>
                </form>

                {/* Acciones */}
                <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                  <button
                    type="button"
                    onClick={handleBackToLogin}
                    style={{ background:'#e2e8f0', border:0, padding:'8px 12px', borderRadius:8, cursor:'pointer' }}
                  >
                    Cambiar correo
                  </button>

                  {viaEmail && (
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resending || cooldownSec > 0}
                      style={{
                        background: (resending || cooldownSec > 0) ? '#fde68a' : '#facc15',
                        color:'#1e3a8a',
                        fontWeight:800,
                        border:0,
                        padding:'8px 12px',
                        borderRadius:8,
                        cursor: (resending || cooldownSec > 0) ? 'not-allowed' : 'pointer'
                      }}
                      title={cooldownSec > 0 ? `Espera ${cooldownSec}s para reenviar` : 'Reenviar código'}
                    >
                      {resending
                        ? 'Reenviando…'
                        : (cooldownSec > 0 ? `Reenviar código (${cooldownSec}s)` : 'Reenviar código')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Verify2FA;
