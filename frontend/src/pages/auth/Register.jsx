import React, { useState, useEffect } from 'react';
import { useAuth } from '../../state/AuthContext';

// Añadir utilidades (si no se comparten desde otro sitio aquí rápido):
const passwordRules = (pwd='') => ({
  length: pwd.length >= 8,
  letter: /[A-Za-zÁÉÍÓÚÜáéíóúüñÑ]/.test(pwd),
  number: /\d/.test(pwd),
  symbol: /[^A-Za-z0-9\s]/.test(pwd)
});
const passwordAllValid = (o) => Object.values(o).every(Boolean);

const Register = () => {
  const { register, login } = useAuth(); // <-- agregar login del contexto
  const [form, setForm] = useState({ nombre: '', apellido: '', correo: '', password: '' });
  const [msg, setMsg] = useState(null);
  // NUEVOS estados
  const [pwdChecks, setPwdChecks] = useState(passwordRules(''));
  const [pwdTouched, setPwdTouched] = useState(false);
  const [errorPwd, setErrorPwd] = useState('');

  // Helper local para ruta por rol
  const routeFromRoles = (roles = []) => {
    const r = roles.map(x => String(x || '').toLowerCase());
    if (r.includes('secretaria_general')) return '/panel/secretaria';
    if (r.includes('administrativo')) return '/panel/administrativo';
    if (r.includes('coordinador')) return '/panel/coordinador';
    return '/panel/estudiante';
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const rules = passwordRules(form.password);
    setPwdChecks(rules);
    setPwdTouched(true);
    if (!passwordAllValid(rules)) {
      setErrorPwd('La contraseña no cumple los requisitos.');
      return;
    } else {
      setErrorPwd('');
    }

    try {
      const res = await register({ ...form, trySolicitud: 1 }); // fuerza el intento 2 pasos
      if (res?.ok || res?.id_usuario) {
        setMsg('Registro exitoso. Iniciando sesión...');
        // AUTO LOGIN
        try {
          const loginResp = await login({ correo: form.correo, password: form.password });
          if (loginResp?.user && loginResp?.accessToken) {
            const roles = (loginResp.user.roles || []).map(r => r.toLowerCase());
            const destino = routeFromRoles(roles);
            // pequeña pausa opcional para UX
            setTimeout(() => window.location.assign(destino), 350);
            return;
          }
          if (loginResp?.requires2FA) {
            setMsg('Cuenta creada. Necesitas verificar 2FA antes de continuar.');
            return;
          }
          setMsg('Cuenta creada. Inicia sesión manualmente.');
        } catch {
          setMsg('Cuenta creada. Inicia sesión manualmente.');
        }
      } else {
        const text = [res?.error, res?.detail, res?.hint].filter(Boolean).join(' | ');
        setMsg(text || 'Error en registro');
      }
    } catch (_e) {
      setMsg('Error de red en registro');
    }
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

  return (
    <div style={{ maxWidth: 420, margin: '0 auto' }} className="reveal">
      <h2>Registro</h2>
      <form onSubmit={onSubmit}>
        <input placeholder="Nombre" value={form.nombre} onChange={e=>setForm({...form, nombre:e.target.value})} required />
        <input placeholder="Apellido" value={form.apellido} onChange={e=>setForm({...form, apellido:e.target.value})} required />
        <input type="email" placeholder="correo@dominio.com" value={form.correo} onChange={e=>setForm({...form, correo:e.target.value})} required />
        <input
          type="password"
          placeholder="Contraseña"
          value={form.password}
          onChange={e=>{
            const val = e.target.value;
            setForm({...form, password: val});
            setPwdChecks(passwordRules(val));
            if(!pwdTouched) setPwdTouched(true);
          }}
          required
        />
        {pwdTouched && form.password.length > 0 && !passwordAllValid(pwdChecks) && (
          <div className="pwd-reqs" style={{ marginTop:4 }}>
            {!pwdChecks.length && <div className="fail">• Mínimo 8 caracteres</div>}
            {!pwdChecks.letter && <div className="fail">• Al menos una letra</div>}
            {!pwdChecks.number && <div className="fail">• Al menos un número</div>}
            {!pwdChecks.symbol && <div className="fail">• Al menos un símbolo</div>}
          </div>
        )}
        {errorPwd && <div className="error" style={{ marginTop:6 }}>{errorPwd}</div>}
        <button type="submit">Crear cuenta</button>
      </form>
      {msg && <p>{msg}</p>}
      {/* Nota: El flujo principal de registro con auto login + tokens está en Login.jsx.
      Este componente puede reutilizarse, pero no maneja tokens directamente. */}
    </div>
  );
};

export default Register;

