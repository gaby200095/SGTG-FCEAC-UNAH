import React, { useState, useEffect } from 'react';
import { useAuth } from '../../state/AuthContext';

// Utilidades de password
const passwordRules = (pwd='') => ({
  length: pwd.length >= 8,
  letter: /[A-Za-zÁÉÍÓÚÜáéíóúüñÑ]/.test(pwd),
  number: /\d/.test(pwd),
  symbol: /[^A-Za-z0-9\s]/.test(pwd)
});
const passwordAllValid = (o) => Object.values(o).every(Boolean);

// Validación estricta de nombres/apellidos
const NAME_ALLOWED = /^[A-Za-zÁÉÍÓÚÜáéíóúüÑñ' -]+$/;
const HAS_VOWEL = /[AEIOUÁÉÍÓÚÜaeiouáéíóúü]/;
const FOUR_CONSEC_CONS = /[B-DF-HJ-NP-TV-ZÑñ]{4,}/i;
const TRIPLE_REPEAT = /(.)\1\1/;

const normalizeHumanName = (s = '') =>
  s.trim().replace(/\s+/g, ' ').split(' ')
    .map(w => w ? (w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()) : w)
    .join(' ');

const validateHumanName = (s = '') => {
  const v = s.trim();
  if (v.length < 2) return 'Debe tener al menos 2 caracteres.';
  if (!NAME_ALLOWED.test(v)) return 'Solo letras, espacios, apóstrofe o guion.';
  if (!HAS_VOWEL.test(v)) return 'Debe incluir al menos una vocal.';
  if (TRIPLE_REPEAT.test(v)) return 'No repitas 3 veces el mismo carácter.';
  if (FOUR_CONSEC_CONS.test(v)) return 'Demasiadas consonantes consecutivas (posible texto inválido).';
  const parts = v.split(' ').filter(Boolean);
  if (parts.some(p => p.length < 2)) return 'Cada palabra debe tener 2 o más letras.';
  return '';
};

const Register = () => {
  const { register, login } = useAuth();

  const [form, setForm] = useState({ nombre: '', apellido: '', correo: '', password: '' });
  const [msg, setMsg] = useState(null);

  // Validaciones UI
  const [pwdChecks, setPwdChecks] = useState(passwordRules(''));
  const [pwdTouched, setPwdTouched] = useState(false);
  const [errorPwd, setErrorPwd] = useState('');
  const [emailErr, setEmailErr] = useState('');
  const [emailHint, setEmailHint] = useState('');
  const [errorNombre, setErrorNombre] = useState('');
  const [errorApellido, setErrorApellido] = useState('');

  const routeFromRoles = (roles = []) => {
    const r = roles.map(x => String(x || '').toLowerCase());
    if (r.includes('secretaria_general')) return '/panel/secretaria';
    if (r.includes('administrativo')) return '/panel/administrativo';
    if (r.includes('coordinador')) return '/panel/coordinador';
    return '/panel/estudiante';
  };

  const onBlurCorreo = () => {
    if(!form.correo){
      setEmailErr('Correo requerido'); setEmailHint(''); return;
    }
    const basic = /^[A-Z0-9._%+-]+@([A-Z0-9-]+\.)+[A-Z]{2,}$/i;
    if (!basic.test(form.correo)) { setEmailErr('Formato de correo inválido'); setEmailHint(''); return; }
    const domain = String(form.correo.split('@')[1] || '').toLowerCase();
    const tlds = ['.com','.net','.org','.edu','.gov','.hn','.es','.me','.io','.dev','.co','.mx','.ar','.cl'];
    if (!tlds.some(suf => domain.endsWith(suf))) { setEmailErr('TLD poco común o inválido'); setEmailHint(''); return; }
    setEmailErr(''); setEmailHint('Correo parece válido. Se validará dominio en el servidor.');
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);

    // Validación estricta de nombre y apellido
    const nErr = validateHumanName(form.nombre);
    const aErr = validateHumanName(form.apellido);
    setErrorNombre(nErr);
    setErrorApellido(aErr);
    if (nErr || aErr) return;

    const basic = /^[A-Z0-9._%+-]+@([A-Z0-9-]+\.)+[A-Z]{2,}$/i;
    if (!basic.test(form.correo)) { setEmailErr('Formato de correo inválido'); setEmailHint(''); return; }
    const domain = String(form.correo.split('@')[1] || '').toLowerCase();
    const tlds = ['.com','.net','.org','.edu','.gov','.hn','.es','.me','.io','.dev','.co','.mx','.ar','.cl'];
    if (!tlds.some(suf => domain.endsWith(suf))) { setEmailErr('TLD poco común o inválido'); setEmailHint(''); return; }
    setEmailErr(''); setEmailHint('Correo parece válido. Se validará dominio en el servidor.');

    const rules = passwordRules(form.password);
    setPwdChecks(rules);
    setPwdTouched(true);
    if (!passwordAllValid(rules)) {
      setErrorPwd('La contraseña no cumple los requisitos.');
      return;
    } else {
      setErrorPwd('');
    }

    // Registro directo contra backend
    try {
      const res = await register({ ...form });
      if (res?.ok || res?.id_usuario) {
        setMsg('Registro exitoso. Iniciando sesión...');
        const loginResp = await login({ correo: form.correo, password: form.password });
        if (loginResp?.user && loginResp?.accessToken) {
          const roles = (loginResp.user.roles || []).map(r => r.toLowerCase());
          const destino = routeFromRoles(roles);
          setTimeout(()=> window.location.assign(destino), 300);
          return;
        }
        setMsg('Cuenta creada. Inicia sesión manualmente.');
      } else {
        setMsg(res?.error || 'Error en registro');
      }
    } catch {
      setMsg('Error de red en registro');
    }
  };

  useEffect(()=>{
    const els = document.querySelectorAll('.reveal');
    const obs = new IntersectionObserver(es=>{
      es.forEach(e=>{
        if(e.isIntersecting){
          e.target.classList.add('visible');
          obs.unobserve(e.target);
        }
      });
    },{ threshold:0.2 });
    els.forEach(el=>obs.observe(el));
    return ()=>obs.disconnect();
  },[]);

  return (
    <div style={{ maxWidth: 420, margin: '0 auto' }} className="reveal">
      <h2>Registro</h2>
      <form onSubmit={onSubmit}>
        <input
          placeholder="Nombre"
          value={form.nombre}
          onChange={e=>{ setForm({...form, nombre:e.target.value}); if(errorNombre) setErrorNombre(validateHumanName(e.target.value)); }}
          onBlur={e=>{ const v = normalizeHumanName(e.target.value); setForm({...form, nombre:v}); setErrorNombre(validateHumanName(v)); }}
          required
        />
        {errorNombre && <div className="error" style={{ fontSize:12 }}>{errorNombre}</div>}
        <input
          placeholder="Apellido"
          value={form.apellido}
          onChange={e=>{ setForm({...form, apellido:e.target.value}); if(errorApellido) setErrorApellido(validateHumanName(e.target.value)); }}
          onBlur={e=>{ const v = normalizeHumanName(e.target.value); setForm({...form, apellido:v}); setErrorApellido(validateHumanName(v)); }}
          required
        />
        {errorApellido && <div className="error" style={{ fontSize:12 }}>{errorApellido}</div>}
        <input
          type="email"
            placeholder="correo@dominio.com"
          value={form.correo}
          onChange={e=> setForm({...form, correo:e.target.value})}
          onBlur={onBlurCorreo}
          required
        />
        {emailErr && <div className="error" style={{ fontSize:12 }}>{emailErr}</div>}
        {!emailErr && emailHint && <div style={{ fontSize:11, color:'#0369a1', marginTop:4 }}>{emailHint}</div>}
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
    </div>
  );
};

export default Register;


















