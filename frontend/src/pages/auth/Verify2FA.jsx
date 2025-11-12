import React, { useState, useEffect } from 'react';
import { useAuth } from '../../state/AuthContext';

const Verify2FA = () => {
  const { verify2FA, pending2FA, user } = useAuth();
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    const { ok, data } = await verify2FA({ code });
    setMsg(ok ? '2FA verificado, sesión iniciada.' : (data?.error || 'Error en verificación'));
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
      <h2>Verificación 2FA</h2>
      {!pending2FA && !user && <p>No hay 2FA pendiente. Inicia sesión primero.</p>}
      {user && <p>Ya estás autenticado.</p>}
      {pending2FA && !user && (
        <form onSubmit={onSubmit}>
          <input
            placeholder="Código 2FA"
            value={code}
            onChange={e=>setCode(e.target.value)}
            required
            autoFocus
          />
          <button type="submit">Verificar</button>
        </form>
      )}
      {msg && <p>{msg}</p>}
    </div>
  );
};

export default Verify2FA;
