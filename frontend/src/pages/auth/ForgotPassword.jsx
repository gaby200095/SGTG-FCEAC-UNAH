import React, { useState, useEffect } from 'react';
import { useAuth } from '../../state/AuthContext';

const ForgotPassword = () => {
  const { forgot } = useAuth();
  const [correo, setCorreo] = useState('');
  const [msg, setMsg] = useState(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    const res = await forgot(correo);
    setMsg(res?.message || 'Si el correo existe, enviaremos un enlace.');
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
      <h2>Restablecer contraseña</h2>
      <form onSubmit={onSubmit}>
        <input type="email" placeholder="correo@unah.hn" value={correo} onChange={e=>setCorreo(e.target.value)} required />
        <button type="submit">Enviar enlace</button>
      </form>
      {msg && <p>{msg}</p>}
    </div>
  );
};

export default ForgotPassword;
