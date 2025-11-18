import React, { useState, useEffect } from "react";
import "./Login.css";
import { useHistory } from "react-router-dom";
import { useAuth } from '../state/AuthContext';

const PasswordField = ({
  label,
  value,
  onChange,
  placeholder = "********",
  required = true,
  error,
  name,
  autoComplete
}) => {
  const [visible, setVisible] = useState(false);
  return (
    <div style={{ marginBottom: 18 }}>
      {label && (
        <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
          {label}
        </label>
      )}
      <input
        name={name}
        type={visible ? "text" : "password"}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        className="input-field"
      />
      <div style={{ marginTop: 4 }}>
        <label
          style={{
            fontSize: '.75rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            cursor: 'pointer',
            userSelect: 'none',
            color: '#1e293b'
          }}
        >
          <input
            type="checkbox"
            checked={visible}
            onChange={() => setVisible(v => !v)}
            style={{ margin: 0, cursor: 'pointer' }}
            aria-label="Mostrar contraseña"
          />
          Mostrar contraseña
        </label>
      </div>
      {error && <div className="error" style={{ marginTop: 4 }}>{error}</div>}
    </div>
  );
};

const API_BASE = (process.env.REACT_APP_API_URL || "http://localhost:5001/api").replace(/\/+$/,''); // NUEVO

const Login = () => {
  const [isRegistro, setIsRegistro] = useState(false);
  const [successMsg, setSuccessMsg] = useState(""); // NUEVO: mensaje de sucesso
  // const [fbMsg, setFbMsg] = useState(''); // NUEVO: mensaje verificación Firebase
  // const [fbErrCode, setFbErrCode] = useState(null); // NUEVO

  // Login
  const [correoLogin, setCorreoLogin] = useState("");
  const [passwordLogin, setPasswordLogin] = useState("");
  // NUEVO: visibilidad contraseña login
  const [errorLogin, setErrorLogin] = useState("");

  // Registro (NUEVO: dos nombres y dos apellidos obligatorios)
  const [correoReg, setCorreoReg] = useState("");
  const [nombre1, setNombre1] = useState("");
  const [nombre2, setNombre2] = useState("");
  const [apellido1, setApellido1] = useState("");
  const [apellido2, setApellido2] = useState("");
  const [passwordReg, setPasswordReg] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  // NUEVO: visibilidad contraseñas registro
  const [erroresReg, setErroresReg] = useState({});

  const [remember, setRemember] = useState(false); // NUEVO: recordar credenciales

  // NUEVO: history para redirección y helper de ruta por rol
  const history = useHistory();
  const { login, user, pending2FA } = useAuth();  // ahora también observamos user y pending2FA
  // NUEVO: normalizador y obtención de roles desde tablas si faltan
  const normalizeRoles = (arr = []) => {
    return arr
      .map(r => String(r || "").toLowerCase().trim())
      .map(r => {
        if (r === "coordinacion") return "coordinador";
        if (r === "secretaria") return "secretaria_general";
        if (r === "admin" || r === "administrador") return "administrativo";
        return r;
      })
      .filter(Boolean);
  };

  const fetchUserRoles = async (userId) => {
    try {
      const base = API_BASE; // ← antes: API (no existe)
      // obtener relaciones usuario_rol
      const relRes = await fetch(`${base}/table/usuario_rol?limit=500`, { credentials: 'include' });
      if (!relRes.ok) return [];
      const rel = await relRes.json();
      const idsRol = rel.filter(r => r.id_usuario === userId).map(r => r.id_rol);
      if (!idsRol.length) return [];
      const rolRes = await fetch(`${base}/table/rol?limit=500`, { credentials: 'include' });
      if (!rolRes.ok) return [];
      const rolesAll = await rolRes.json();
      const names = rolesAll
        .filter(r => idsRol.includes(r.id_rol))
        .map(r => r.nombre_rol);
      return normalizeRoles(names);
    } catch {
      return [];
    }
  };

  // ACTUALIZADO: routing robusto
  const routeFromRoles = (roles = []) => {
    const r = normalizeRoles(roles);
    if (r.includes("secretaria_general")) return "/panel/secretaria";
    if (r.includes("administrativo")) return "/panel/administrativo";
    if (r.includes("coordinador")) return "/panel/coordinador";
    return "/panel/estudiante";
  };

  // NUEVO: prefijar correo desde localStorage y helpers de API
  useEffect(() => {
    // NUEVO: cargar credenciales recordadas
    const rem = localStorage.getItem("sgtg_remember") === "1";
    setRemember(rem);
    const saved = rem
      ? (localStorage.getItem("sgtg_saved_email") || "")
      : (localStorage.getItem("sgtg_last_email") || "");
    if (saved) setCorreoLogin(saved);
  }, []);

  const redirectWithRoles = async (userObj) => {
    let roles = normalizeRoles(userObj?.roles || []);
    if (!roles.length && userObj?.id_usuario) {
      roles = await fetchUserRoles(userObj.id_usuario);
    }
    if (!roles.length) roles = ["estudiante"];
    userObj.roles = roles;
    localStorage.setItem("user", JSON.stringify(userObj));
    const route = routeFromRoles(roles);
    // Navegación SPA al panel (el único refresh se hará tras verificar 2FA)
    history.replace(route);
  };

  // NUEVO: si el contexto Auth cambia a user (login exitoso), redirigir automáticamente
  useEffect(() => {
    if (user && !pending2FA) {
      // redirigir basado en roles (si user ya trae roles)
      redirectWithRoles(user).catch(() => {});
    }
  }, [user, pending2FA]); 

  // NUEVO: proveedores y TLD permitidos (usados por validateEmailDetailed)
  const strictDomains = {
    gmail: ['gmail.com'],
    hotmail: ['hotmail.com', 'hotmail.es'],
    outlook: ['outlook.com', 'outlook.es'],
    yahoo: ['yahoo.com', 'yahoo.es'],
    live: ['live.com', 'live.com.mx'],
    icloud: ['icloud.com', 'me.com'],
    proton: ['proton.me', 'protonmail.com'],
    unah: ['unah.edu.hn', 'unah.hn']
  };
  const allowedSuffixes = ['.com', '.net', '.org', '.edu', '.gov', '.hn', '.es', '.me', '.io', '.dev', '.co', '.mx', '.ar', '.cl'];
  const allowedFullDomains = Object.values(strictDomains).flat(); // NUEVO

  // NUEVO: validación correo antes de enviar
  const validateEmailDetailed = (email) => {
    if (!email) return 'Correo requerido';
    const basic = /^[A-Z0-9._%+-]+@([A-Z0-9-]+\.)+[A-Z]{2,}$/i;
    if (!basic.test(email)) return 'Formato de correo inválido';

    const [local, domainFullRaw] = email.split('@');
    const domainFull = (domainFullRaw || '').toLowerCase();
    // Relajar: permitir 1+ carácter en la parte local
    if ((local || '').length < 1) return 'La parte local está vacía';
    if (domainFull.includes('..')) return 'Dominio inválido';
    if (!allowedSuffixes.some(suf => domainFull.endsWith(suf))) return 'TLD poco común o inválido';

    // Si es proveedor conocido, exigir coincidencia exacta; si no, permitir (backend validará MX)
    const provider = (domainFull.split('.')[0] || '').toLowerCase();
    if (strictDomains[provider] && !strictDomains[provider].includes(domainFull)) {
      return `Dominio no válido para ${provider}. Válidos: ${strictDomains[provider].join(', ')}`;
    }
    return '';
  };

  // NUEVO: validación estricta SOLO para registro (correo personal real)
  const COMMON_EMAIL_TYPO = {
    'gmai.com': 'gmail.com',
    'gamil.com': 'gmail.com',
    'gnail.com': 'gmail.com',
    'hotmial.com': 'hotmail.com',
    'outlok.com': 'outlook.com',
    'yaho.com': 'yahoo.com',
    'icloud.co': 'icloud.com',
    'protin.me': 'proton.me',
    'proton.con': 'proton.me'
  };
  const DISALLOWED_LOCAL = [
    'patito','test','prueba','asdf','qwerty','zxc','demo','fake',
    'correo','email','usuario','user','admin','root','abc','xxxx'
  ];
  const validateEmailForRegistration = (email) => {
    const basicErr = validateEmailDetailed(email);
    if (basicErr) return basicErr;
    const [localRaw, domainFullRaw] = String(email).split('@');
    const local = (localRaw || '').toLowerCase().trim();
    const domainFull = (domainFullRaw || '').toLowerCase().trim();
    // Relajar: parte local de 1+ carácter
    if (local.length < 1) return 'La parte local está vacía';
    if (DISALLOWED_LOCAL.includes(local)) return 'Usa tu correo personal real (no alias genéricos como "patito" o "test").';
    // Typos comunes en dominios
    if (COMMON_EMAIL_TYPO[domainFull]) {
      return `Dominio mal escrito. ¿Quisiste decir "${local}@${COMMON_EMAIL_TYPO[domainFull]}"?`;
    }
    // Exigir proveedor reconocido o institucional UNAH
    const provider = (domainFull.split('.')[0] || '').toLowerCase();
    if (strictDomains[provider]) {
      if (!strictDomains[provider].includes(domainFull)) {
        return `Dominio no válido para ${provider}. Válidos: ${strictDomains[provider].join(', ')}`;
      }
      return '';
    }
    // Si no es proveedor reconocido, permitir solo institucional UNAH
    if (!allowedFullDomains.includes(domainFull)) {
      return 'Usa un correo personal de proveedor reconocido (Gmail, Outlook/Hotmail, Yahoo, iCloud, Proton) o tu correo institucional UNAH.';
    }
    return '';
  };

  // NUEVO: reglas de contraseña fuerte (8+ caracteres, 1 número y 1 símbolo)
  const strongPwdRules = (pwd = '') => ({
    length: pwd.length >= 8,
    number: /\d/.test(pwd),
    symbol: /[^A-Za-z0-9\s]/.test(pwd)
  });
  const strongPwdValid = (r) => r.length && r.number && r.symbol;

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorLogin('');

    // Validar correo antes de enviar
    const emailErr = validateEmailDetailed(correoLogin.trim());
    if (emailErr) {
      setErrorCorreoLogin(emailErr);
      setErrorLogin('Corrige el correo antes de continuar');
      return;
    }

    try {
      // Guardar último correo siempre
      localStorage.setItem("sgtg_last_email", correoLogin);

      // Persistir o limpiar según checkbox
      if (remember) {
        localStorage.setItem("sgtg_remember", "1");
        localStorage.setItem("sgtg_saved_email", correoLogin);
      } else {
        localStorage.removeItem("sgtg_remember");
        localStorage.removeItem("sgtg_saved_email");
      }

      const data = await login({ correo: correoLogin.trim(), password: passwordLogin });

      // Verificar si se requiere 2FA
      if (data?.requires2FA || data?.twoFactorSetup || data?.requires2FAEmail) {
        history.replace('/verify-2fa'); // Redirigir a Verify2FA.jsx
        return;
      }

      // Login directo → redirigir al panel correspondiente
      if (data?.user && data?.accessToken) {
        await redirectWithRoles(data.user);
        return;
      }

      // Si no hubo 2FA ni user, mostrar error de credenciales
      if (!data?.user) {
        setErrorLogin(data?.error || 'Correo o contraseña incorrectos');
        return;
      }
    } catch (err) {
      if (err?.name === 'AbortError') {
        setErrorLogin("Tiempo de espera excedido.");
      } else {
        console.error(err);
        setErrorLogin("No fue posible autenticar. Verifica tu conexión.");
      }
    }
  };

  // NUEVO: registro en backend y validación de cuenta a 11 dígitos
  const [regDetail, setRegDetail] = useState(null);
  // NUEVO: estados faltantes usados en UI de registro
  const [emailErrReg, setEmailErrReg] = useState('');
  const [emailHintReg, setEmailHintReg] = useState('');

  const handleRegistro = async (e) => {
    e.preventDefault();
    setRegDetail(null);

    // Correo personal estricto (proveedor real y sin typos)
    const emailErr = validateEmailForRegistration(correoReg.trim());
    if (emailErr) {
      setEmailErrReg(emailErr);
      setEmailHintReg('');
      return;
    } else {
      setEmailErrReg('');
      setEmailHintReg('Usa tu correo personal (Gmail, Outlook/Hotmail, Yahoo, iCloud, Proton) o tu correo institucional UNAH.');
    }

    const nuevosErrores = {};
    // Validación estricta de nombres y apellidos
    const n1Err = validateHumanName(nombre1);
    const n2Err = validateHumanName(nombre2);
    const a1Err = validateHumanName(apellido1);
    const a2Err = validateHumanName(apellido2);

    if (n1Err) nuevosErrores.nombre1 = n1Err;
    if (n2Err) nuevosErrores.nombre2 = n2Err;
    if (a1Err) nuevosErrores.apellido1 = a1Err;
    if (a2Err) nuevosErrores.apellido2 = a2Err;

    // Reglas estrictas: mínimo 8, 1 número y 1 símbolo
    const pr = strongPwdRules(passwordReg);
    if (!strongPwdValid(pr)) {
      nuevosErrores.password = "La contraseña debe tener mínimo 8 caracteres, al menos 1 número y 1 símbolo.";
    }
    if (passwordReg !== confirmPassword) nuevosErrores.confirmPassword = "Las contraseñas no coinciden";

    // Validación detallada de correo
    const checkEmailErr = validateEmailDetailed(correoReg.trim()); // <- RENOMBRADO
    if (checkEmailErr) {
      setErrorCorreoReg(checkEmailErr);
      nuevosErrores.correo = checkEmailErr;
    }

    setErroresReg(nuevosErrores);
    if (Object.keys(nuevosErrores).length > 0) return;

    // Construir payload y registrar DIRECTO en backend (sin Firebase)
    const nombreCompuesto = [nombre1, nombre2].join(" ").trim();
    const apellidoCompuesto = [apellido1, apellido2].join(" ").trim();
    try {
      const resp = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          nombre: nombreCompuesto,
          apellido: apellidoCompuesto,
          correo: correoReg,
          password: passwordReg
        })
      });
      const data = await resp.json().catch(() => null);
      if (!resp.ok) {
        alert(data?.error || `Fallo (${resp.status})`);
        return;
      }
      // NO auto-login: pedirle iniciar sesión (2FA se enviará solo al iniciar sesión)
      localStorage.setItem("sgtg_last_email", correoReg);
      setSuccessMsg("Usuario creado exitosamente. Inicia sesión para continuar.");
      // Ir al formulario principal (con refresco)
      setTimeout(() => { window.location.assign('/login'); }, 600);
      // limpiar campos (best-effort)
      setIsRegistro(false); setCorreoLogin(correoReg);
      setPasswordReg(''); setConfirmPassword('');
    } catch (err) {
      alert("Error de red al registrar");
    }
  };

  // FALTABAN: estados de error de correo
  const [errorCorreoLogin, setErrorCorreoLogin] = useState('');
  const [errorCorreoReg, setErrorCorreoReg] = useState('');

  // NUEVO: validación estricta de nombres/apellidos
  const NAME_ALLOWED = /^[A-Za-zÁÉÍÓÚÜáéíóúüÑñ' -]+$/;
  const HAS_VOWEL = /[AEIOUÁÉÍÓÚÜaeiouáéíóúü]/;
  const FOUR_CONSEC_CONS = /[B-DF-HJ-NP-TV-ZÑñ]{4,}/i;
  const TRIPLE_REPEAT = /(.)\1\1/;
  const GIBBERISH = /(asd|qwe|zxc|djads|lkj|poi|mnb|asdfg|qwert|zxcasd)/i; // NUEVO

  const normalizeHumanName = (s = '') =>
    s
      .trim()
      .replace(/\s+/g, ' ')
      .split(' ')
      .map(w => w ? (w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()) : w)
      .join(' ');

  const validateHumanName = (s = '') => {
    const v = s.trim();
    if (v.length < 2) return 'Debe tener al menos 2 caracteres.';
    if (!NAME_ALLOWED.test(v)) return 'Solo letras, espacios, apóstrofe o guion.';
    if (!HAS_VOWEL.test(v)) return 'Debe incluir al menos una vocal.';
    if (TRIPLE_REPEAT.test(v)) return 'No repitas 3 veces el mismo carácter.';
    if (FOUR_CONSEC_CONS.test(v)) return 'Demasiadas consonantes consecutivas (posible texto inválido).';
    if (GIBBERISH.test(v)) return 'Ingresa un nombre real (sin texto aleatorio).';
    // Cada palabra con 2+ letras
    const parts = v.split(' ').filter(Boolean);
    if (parts.some(p => p.length < 2)) return 'Cada palabra debe tener 2 o más letras.';
    return '';
  };

  // Handlers que faltaban (login)
  const onChangeCorreoLogin = (value) => {
    setCorreoLogin(value);
    if (errorCorreoLogin) setErrorCorreoLogin(validateEmailDetailed(value));
  };
  const onBlurCorreoLogin = () => {
    setErrorCorreoLogin(validateEmailDetailed(correoLogin.trim()));
  };

  // Handlers que faltaban (registro)
  const onChangeCorreoReg = (value) => {
    setCorreoReg(value);
    if (errorCorreoReg) setErrorCorreoReg(validateEmailForRegistration(value));
  };
  const onBlurCorreoReg = () => {
    // ELIMINADO: quickEmailHeuristic → validación nativa
    if (!correoReg) { setEmailErrReg('Correo personal requerido'); setEmailHintReg(''); return; }
    const err = validateEmailForRegistration(correoReg.trim());
    if (err) { setEmailErrReg(err); setEmailHintReg(''); }
    else { setEmailErrReg(''); setEmailHintReg('Usa tu correo personal (Gmail, Outlook/Hotmail, Yahoo, iCloud, Proton) o tu correo institucional UNAH.'); }
  };

  // Inicializar modo desde la URL (?mode=register|login)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const mode = (params.get('mode') || '').toLowerCase();
      if (mode === 'register') setIsRegistro(true);
      else if (mode === 'login') setIsRegistro(false);
    } catch {}
  }, []);

  // Efecto reveal: asegura que los bloques con .reveal se hagan visibles al entrar en viewport
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

  // Fondo responsive: desactiva fixed en móviles (coherente con Landing)
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

  // Pre-carga de ilustraciones para evitar parpadeo
  useEffect(() => {
    try {
      const a = new Image(); a.src = process.env.PUBLIC_URL + '/ilustracion-graduados.jpg';
      const b = new Image(); b.src = process.env.PUBLIC_URL + '/Formulario-login.png';
    } catch {}
  }, []);

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
              {/* Columna principal: Login/Registro */}
              <div>
                {successMsg && !isRegistro && (
                  <div style={{ background:"#d1fae5", color:"#065f46", padding:"8px 12px", borderRadius:8, marginBottom:12 }}>
                    {successMsg}
                  </div>
                )}
                {isRegistro ? (
                  <>
                    <h2 style={{ color:'#0f172a', fontWeight:900, marginBottom:12 }}>Registro de Usuario</h2>
                    <form className="login-form" onSubmit={handleRegistro}>
                      {/* Nombres y apellidos */}
                      <label>Primer Nombre:</label>
                      <input
                        type="text"
                        placeholder="Primer nombre"
                        value={nombre1}
                        onChange={e=>setNombre1(e.target.value)}
                        onBlur={()=>{
                          const v = normalizeHumanName(nombre1);
                          setNombre1(v);
                          setErroresReg(prev => ({ ...prev, nombre1: validateHumanName(v) }));
                        }}
                        required
                      />
                      {erroresReg.nombre1 && <div className="error">{erroresReg.nombre1}</div>}

                      <label>Segundo Nombre:</label>
                      <input
                        type="text"
                        placeholder="Segundo nombre"
                        value={nombre2}
                        onChange={e=>setNombre2(e.target.value)}
                        onBlur={()=>{
                          const v = normalizeHumanName(nombre2);
                          setNombre2(v);
                          setErroresReg(prev => ({ ...prev, nombre2: validateHumanName(v) }));
                        }}
                        required
                      />
                      {erroresReg.nombre2 && <div className="error">{erroresReg.nombre2}</div>}

                      <label>Primer Apellido:</label>
                      <input
                        type="text"
                        placeholder="Primer apellido"
                        value={apellido1}
                        onChange={e=>setApellido1(e.target.value)}
                        onBlur={()=>{
                          const v = normalizeHumanName(apellido1);
                          setApellido1(v);
                          setErroresReg(prev => ({ ...prev, apellido1: validateHumanName(v) }));
                        }}
                        required
                      />
                      {erroresReg.apellido1 && <div className="error">{erroresReg.apellido1}</div>}

                      <label>Segundo Apellido:</label>
                      <input
                        type="text"
                        placeholder="Segundo apellido"
                        value={apellido2}
                        onChange={e=>setApellido2(e.target.value)}
                        onBlur={()=>{
                          const v = normalizeHumanName(apellido2);
                          setApellido2(v);
                          setErroresReg(prev => ({ ...prev, apellido2: validateHumanName(v) }));
                        }}
                        required
                      />
                      {erroresReg.apellido2 && <div className="error">{erroresReg.apellido2}</div>}

                      <label>Correo personal:</label>
                      <input
                        type="email"
                        placeholder="tu_correo@gmail.com (o outlook, yahoo, icloud, proton)"
                        value={correoReg}
                        onChange={e => { onChangeCorreoReg(e.target.value); }}
                        onBlur={onBlurCorreoReg}
                        required
                        className="input-field"
                      />
                      {errorCorreoReg && <div className="error" style={{ marginTop: 4 }}>{errorCorreoReg}</div>}
                      {emailErrReg && <div className="error" style={{ marginTop: 4 }}>{emailErrReg}</div>}
                      {emailHintReg && <div className="hint" style={{ marginTop: 4 }}>{emailHintReg}</div>}

                      <label>Contraseña:</label>
                      <PasswordField
                        value={passwordReg}
                        onChange={setPasswordReg}
                        placeholder="Mínimo 8 caracteres"
                        error={erroresReg.password}
                        name="password"
                        autoComplete="new-password"
                      />

                      <label>Confirmar contraseña:</label>
                      <PasswordField
                        value={confirmPassword}
                        onChange={setConfirmPassword}
                        placeholder="Repite tu contraseña"
                        error={erroresReg.confirmPassword}
                        name="confirmPassword"
                        autoComplete="new-password"
                      />

                      <button type="submit" className="btn btn-primary-unah">
                        {isRegistro ? "Registrar" : "Iniciar sesión"}
                      </button>

                      <div style={{ marginTop: 12, fontSize: '.9rem', textAlign: 'center' }}>
                        {isRegistro ? (
                          <>¿Ya tienes cuenta? <a href="/login" style={{ color: '#0077c8' }}>Inicia sesión aquí</a>.</>
                        ) : (
                          <>¿No tienes cuenta? <span onClick={() => setIsRegistro(true)} style={{ color: '#0077c8', cursor: 'pointer' }}>Regístrate aquí</span>.</>
                        )}
                      </div>
                    </form>
                  </>
                ) : (
                  <>
                    <h2 style={{ color:'#0f172a', fontWeight:900, marginBottom:12 }}>Iniciar sesión</h2>
                    <form className="login-form" onSubmit={handleLogin}>
                      <label>Correo:</label>
                      <input
                        type="email"
                        placeholder="tu_correo@gmail.com (o outlook, yahoo, icloud, proton)"
                        value={correoLogin}
                        onChange={e => { onChangeCorreoLogin(e.target.value); }}
                        onBlur={onBlurCorreoLogin}
                        required
                        className="input-field"
                      />
                      {errorCorreoLogin && <div className="error" style={{ marginTop: 4 }}>{errorCorreoLogin}</div>}

                      <label>Contraseña:</label>
                      <PasswordField
                        value={passwordLogin}
                        onChange={setPasswordLogin}
                        placeholder="********"
                        error={errorLogin}
                        name="password"
                        autoComplete="current-password"
                      />

                      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <input
                            type="checkbox"
                            checked={remember}
                            onChange={() => setRemember(r => !r)}
                            style={{ margin: 0, cursor: 'pointer' }}
                          />
                          Recordar credenciales
                        </label>

                        <a href="/forgot-password" style={{ color: '#0077c8', fontSize: '.9rem' }}>
                          ¿Olvidaste tu contraseña?
                        </a>
                      </div>

                      <button type="submit" className="btn btn-primary-unah" style={{ marginTop: 12 }}>
                        Iniciar sesión
                      </button>
                    </form>
                    <div style={{ marginTop: 12, fontSize: '.9rem', textAlign: 'center' }}>
                      ¿No tienes cuenta? <a href="/login?mode=register" style={{ color: '#0077c8' }}>Regístrate aquí</a>.
                    </div>
                  </>
                )}
              </div>

              {/* Ilustración derecha: siempre presente, cambia según el modo */}
              <div className="reveal visible" style={{ padding: 0 }}>
                <div className={`login-illu ${isRegistro ? 'login-illu--center' : 'login-illu--bottom'}`}>
                  <img
                    src={isRegistro
                      ? (process.env.PUBLIC_URL + '/Formulario-login.jpeg')
                      : (process.env.PUBLIC_URL + '/ilustracion-graduados.jpg')}
                    alt={isRegistro ? 'Formulario de registro SGTG – FCEAC UNAH' : 'Ilustración de graduados FCEAC - UNAH'}
                    className="login-illu__img"
                    loading="eager"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Login;
