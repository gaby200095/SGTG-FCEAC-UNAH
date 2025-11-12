import React, { useState, useEffect } from "react";
import "./Login.css";
import { useHistory } from "react-router-dom";

// (ANTES de declarar el componente Login) Añadir utilidades:
const passwordRules = (pwd='') => {
  return {
    length: pwd.length >= 8,
    letter: /[A-Za-zÁÉÍÓÚÜáéíóúüñÑ]/.test(pwd),
    number: /\d/.test(pwd),
    symbol: /[^A-Za-z0-9\s]/.test(pwd)
  };
};
const passwordAllValid = (obj) => Object.values(obj).every(Boolean);

// NUEVO PasswordField con checkbox (elimina iconos)
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
        style={{
          width: '100%',
            padding: '0.7rem 0.85rem',
          fontSize: '.95rem',
          border: '1px solid #ccc',
          borderRadius: 8,
          outline: 'none',
          transition: 'border-color .18s, box-shadow .18s',
          boxSizing: 'border-box'
        }}
        onFocus={e => {
          e.target.style.borderColor = '#0077c8';
          e.target.style.boxShadow = '0 0 6px rgba(0,119,200,.35)';
        }}
        onBlur={e => {
          e.target.style.borderColor = '#ccc';
          e.target.style.boxShadow = 'none';
        }}
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

const Login = () => {
  const [isRegistro, setIsRegistro] = useState(false);
  const [successMsg, setSuccessMsg] = useState(""); // NUEVO: mensaje de éxito

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
      const base = API;
      // obtener relaciones usuario_rol
      const relRes = await fetch(`${base}/table/usuario_rol?limit=500`);
      if (!relRes.ok) return [];
      const rel = await relRes.json();
      const idsRol = rel.filter(r => r.id_usuario === userId).map(r => r.id_rol);
      if (!idsRol.length) return [];
      const rolRes = await fetch(`${base}/table/rol?limit=500`);
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
  const API_RAW = "http://localhost:5001/api";
  const API = API_RAW.trim().replace(/\/+$/, ""); // sin espacios ni barra final
  useEffect(() => {
    // NUEVO: cargar credenciales recordadas
    const rem = localStorage.getItem("sgtg_remember") === "1";
    setRemember(rem);
    if (rem) {
      const savedEmail = localStorage.getItem("sgtg_saved_email") || "";
      if (savedEmail) setCorreoLogin(savedEmail);
    } else {
      const last = localStorage.getItem("sgtg_last_email");
      if (last) setCorreoLogin(last);
    }
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
    window.location.assign(route);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorLogin("");

    // NUEVO: validar correo antes de enviar
    const emailErr = validateEmailDetailed(correoLogin.trim());
    if (emailErr) {
      setErrorCorreoLogin(emailErr);
      setErrorLogin('Corrige el correo antes de continuar');
      return;
    }

    try {
      // Guardar último correo siempre
      localStorage.setItem("sgtg_last_email", correoLogin);

      // NUEVO: persistir o limpiar según checkbox
      if (remember) {
        localStorage.setItem("sgtg_remember", "1");
        localStorage.setItem("sgtg_saved_email", correoLogin);
      } else {
        localStorage.removeItem("sgtg_remember");
        localStorage.removeItem("sgtg_saved_email");
      }

      const resp = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // importante para cookie refresh
        body: JSON.stringify({ correo: correoLogin.trim(), password: passwordLogin })
      });

      if (resp.ok) {
        const data = await resp.json();
        const auth = data?.user;
        if (auth?.id_usuario && data?.accessToken) {
          // Guardar access token y posponer redirección hasta asegurar roles
          localStorage.setItem("accessToken", data.accessToken);
          await redirectWithRoles(auth); // NUEVO
          return;
        }
        setErrorLogin("Respuesta inválida del servidor.");
        return;
      }
      let apiErr = "";
      try { apiErr = (await resp.json())?.error || ""; } catch {}
      setErrorLogin(apiErr || `Error al iniciar sesión (${resp.status})`);
    } catch (err) {
      console.error(err);
      setErrorLogin("No fue posible autenticar. Verifica tu conexión.");
    }
  };

  // NUEVO: registro en backend y validación de cuenta a 11 dígitos
  const handleRegistro = async (e) => {
    e.preventDefault();
    const nuevosErrores = {};

    if (!nombre1.trim()) nuevosErrores.nombre1 = "Primer nombre requerido";
    if (!nombre2.trim()) nuevosErrores.nombre2 = "Segundo nombre requerido";
    if (!apellido1.trim()) nuevosErrores.apellido1 = "Primer apellido requerido";
    if (!apellido2.trim()) nuevosErrores.apellido2 = "Segundo apellido requerido";

    // Reemplazar validación simple de longitud por las nuevas reglas:
    const ruleSet = passwordRules(passwordReg);
    setPwdChecks(ruleSet);
    setPwdTouched(true);
    if (!passwordAllValid(ruleSet)) {
      nuevosErrores.password = "La contraseña no cumple los requisitos.";
    }

    if (passwordReg !== confirmPassword) nuevosErrores.confirmPassword = "Las contraseñas no coinciden";

    // NUEVO: validación detallada de correo
    const emailErr = validateEmailDetailed(correoReg.trim());
    if (emailErr) {
      setErrorCorreoReg(emailErr);
      nuevosErrores.correo = emailErr;
    }

    setErroresReg(nuevosErrores);
    if (Object.keys(nuevosErrores).length > 0) return;

    const nombreCompuesto = [nombre1, nombre2].join(" ").trim();
    const apellidoCompuesto = [apellido1, apellido2].join(" ").trim();

    try {
      const resp = await fetch(`${API}/auth/register`, {
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
      const data = await resp.json();
      if (!resp.ok) {
        alert(data?.error || "No se pudo registrar");
        return;
      }

      // === NUEVO: Auto login + redirección a panel ===
      localStorage.setItem("sgtg_last_email", correoReg);
      setSuccessMsg("Usuario creado exitosamente");
      // Intentar login inmediato con las mismas credenciales
      const loginResp = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ correo: correoReg, password: passwordReg })
      });
      if (loginResp.ok) {
        const loginData = await loginResp.json();
        const auth = loginData?.user;
        if (auth?.id_usuario && loginData?.accessToken) {
          localStorage.setItem("accessToken", loginData.accessToken);
          // NUEVO: redirigir solo después de recuperar/normalizar roles
          await redirectWithRoles(auth);
          return;
        }
      }
      // Si no se pudo auto‑logear, volver a formulario de login con correo cargado
      alert("Usuario creado exitosamente. Por favor inicie sesión.");
      setIsRegistro(false);
      setCorreoLogin(correoReg);
      // Limpiar campos de registro
      setNombre1(""); setNombre2("");
      setApellido1(""); setApellido2("");
      setPasswordReg(""); setConfirmPassword("");
    } catch (err) {
      console.error(err);
      alert("Error de red al registrar");
    }
  };

  // FALTABAN: estados de error de correo
  const [errorCorreoLogin, setErrorCorreoLogin] = useState('');
  const [errorCorreoReg, setErrorCorreoReg] = useState('');

  // (Re)definir mapa de dominios y validador (se usan en handlers y submits)
  const strictDomains = {
    gmail: ['gmail.com'],
    hotmail: ['hotmail.com','hotmail.es'],
    outlook: ['outlook.com','outlook.es'],
    yahoo: ['yahoo.com','yahoo.es'],
    live: ['live.com','live.com.mx'],
    unah: ['unah.edu.hn','unah.hn']
  };
  // Lista aplanada de dominios aceptados
  const allowedFullDomains = Object.values(strictDomains).flat();
  // Sufijos corporativos/academia adicionales (si después agregas más, ponlos aquí)
  const allowedSuffixes = ['unah.edu.hn', 'unah.hn'];

  const validateEmailDetailed = (email) => {
    if (!email) return 'Correo requerido';
    const basic = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    if (!basic.test(email)) return 'Formato de correo inválido';

    const [local, domainFullRaw] = email.split('@');
    const domainFull = domainFullRaw.toLowerCase();

    if (local.length < 3) return 'La parte local debe tener al menos 3 caracteres';
    if (domainFull.includes('..')) return 'Dominio inválido';
    const parts = domainFull.split('.');
    if (parts.some(p => !p.trim())) return 'Dominio inválido';

    const provider = parts[0]; // primera parte (ej: gmail)
    const tld = parts[parts.length - 1];
    if (tld.length < 2) return 'TLD demasiado corto';
    if (tld.length > 24) return 'TLD inválido';

    // Validación estricta: dominio debe estar en lista permitida o coincidir sufijos aprobados
    const inAllowed = allowedFullDomains.includes(domainFull) ||
      allowedSuffixes.some(suf => domainFull.endsWith(suf));

    if (!inAllowed) {
      return 'Dominio no permitido. Usa un dominio válido (Proveedor reconocido).';
    }

    // Validación extra: si el provider está mapeado, exigir coincidencia exacta
    if (strictDomains[provider] && !strictDomains[provider].includes(domainFull)) {
      return `Dominio no válido para ${provider}. Válidos: ${strictDomains[provider].join(', ')}`;
    }

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
    if (errorCorreoReg) setErrorCorreoReg(validateEmailDetailed(value));
  };
  const onBlurCorreoReg = () => {
    setErrorCorreoReg(validateEmailDetailed(correoReg.trim()));
  };

  useEffect(()=>{
    const els = document.querySelectorAll('.reveal');
    const obs = new IntersectionObserver(es=>{
      es.forEach(e=>{
        if(e.isIntersecting) e.target.classList.add('visible');
        else e.target.classList.remove('visible');
      });
    },{ threshold:0.15 });
    els.forEach(el=>obs.observe(el));
    return ()=>obs.disconnect();
  },[]);

  // NUEVOS estados para fuerza de contraseña (solo registro)
  const [pwdChecks, setPwdChecks] = useState(passwordRules(''));
  const [pwdTouched, setPwdTouched] = useState(false);

  return (
    <div
      className="login-bg"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div className="login-card reveal">
        {successMsg && !isRegistro && (
          <div style={{ background:"#d1fae5", color:"#065f46", padding:"8px 12px", borderRadius:4, marginBottom:12 }}>
            {successMsg}
          </div>
        )}
        {isRegistro ? (
          <>
            <h2>Registro de Usuario</h2>
            <form className="login-form" onSubmit={handleRegistro}>
              {/* Nombres y apellidos */}
              <label>Primer Nombre:</label>
              <input type="text" placeholder="Primer nombre" value={nombre1} onChange={e=>setNombre1(e.target.value)} required />
              {erroresReg.nombre1 && <div className="error">{erroresReg.nombre1}</div>}

              <label>Segundo Nombre:</label>
              <input type="text" placeholder="Segundo nombre" value={nombre2} onChange={e=>setNombre2(e.target.value)} required />
              {erroresReg.nombre2 && <div className="error">{erroresReg.nombre2}</div>}

              <label>Primer Apellido:</label>
              <input type="text" placeholder="Primer apellido" value={apellido1} onChange={e=>setApellido1(e.target.value)} required />
              {erroresReg.apellido1 && <div className="error">{erroresReg.apellido1}</div>}

              <label>Segundo Apellido:</label>
              <input type="text" placeholder="Segundo apellido" value={apellido2} onChange={e=>setApellido2(e.target.value)} required />
              {erroresReg.apellido2 && <div className="error">{erroresReg.apellido2}</div>}

              <label>Correo:</label>
              <input
                type="email"
                placeholder="tucorreo@dominio.com"
                value={correoReg}
                onChange={e => onChangeCorreoReg(e.target.value)}
                onBlur={onBlurCorreoReg}
                required
              />
              {(errorCorreoReg || erroresReg.correo) && <div className="error">{errorCorreoReg || erroresReg.correo}</div>}

              {/* Password principal */}
              <PasswordField
                label="Contraseña:"
                value={passwordReg}
                onChange={(v) => {
                  setPasswordReg(v);
                  setPwdChecks(passwordRules(v));
                  if (!pwdTouched) setPwdTouched(true);
                }}
                error={erroresReg.password}
                name="password"
                autoComplete="new-password"
              />
              {/* Checklist ahora solo si no cumple TODO y ya escribió algo */}
              {pwdTouched && passwordReg.length > 0 && !passwordAllValid(pwdChecks) && (
                <div className="pwd-reqs">
                  {!pwdChecks.length && <div className="fail">• Mínimo 8 caracteres</div>}
                  {!pwdChecks.letter && <div className="fail">• Al menos una letra</div>}
                  {!pwdChecks.number && <div className="fail">• Al menos un número</div>}
                  {!pwdChecks.symbol && <div className="fail">• Al menos un símbolo</div>}
                </div>
              )}

              {/* Confirmación */}
              <PasswordField
                label="Confirmar Contraseña:"
                value={confirmPassword}
                onChange={setConfirmPassword}
                error={erroresReg.confirmPassword}
                name="password_confirm"
                autoComplete="new-password"
              />

              <button type="submit">Registrarse</button>
            </form>
            <p style={{ marginTop: 10 }}>
              ¿Ya tienes cuenta?{" "}
              <span onClick={() => setIsRegistro(false)} style={{ color: "#0077c8", cursor: "pointer" }}>
                Inicia sesión
              </span>
            </p>
          </>
        ) : (
          <>
            <h2>Iniciar Sesión</h2>
            <form className="login-form" onSubmit={handleLogin}>
              <label>Correo:</label>
              <input
                type="email"
                placeholder="tucorreo@dominio.com"
                value={correoLogin}
                onChange={e => onChangeCorreoLogin(e.target.value)}
                onBlur={onBlurCorreoLogin}
                required
                autoComplete="email"
              />
              {errorCorreoLogin && <div className="error">{errorCorreoLogin}</div>}

              <PasswordField
                label="Contraseña:"
                value={passwordLogin}
                onChange={setPasswordLogin}
                name="login_password"
                autoComplete="current-password"
                error={errorLogin && !errorCorreoLogin ? errorLogin : undefined}
              />

              <div style={{ display: "flex", alignItems: "center", gap: 6, margin: "6px 0 10px" }}>
                <input
                  id="remember"
                  type="checkbox"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                  style={{ transform: "scale(1.05)" }}
                />
                <label htmlFor="remember" style={{ cursor: "pointer" }}>
                  Recordar credenciales (no usar en equipos públicos)
                </label>
              </div>

              <button type="submit">Iniciar Sesión</button>
            </form>
            <p style={{ marginTop: 10 }}>
              ¿No tienes cuenta?{" "}
              <span onClick={() => setIsRegistro(true)} style={{ color: "#0077c8", cursor: "pointer" }}>
                Regístrate
              </span>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;
