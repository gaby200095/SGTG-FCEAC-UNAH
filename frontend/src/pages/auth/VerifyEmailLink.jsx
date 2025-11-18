import React, { useEffect, useState } from 'react';
import { applyVerificationCode, explainFirebaseRemedy } from '../../firebase/firebase';
import { Link } from 'react-router-dom';

const VerifyEmailLink = () => {
  const [state, setState] = useState({ loading:true, ok:false, message:'Verificando...', code:null, email:null });

  useEffect(()=>{
    const params = new URLSearchParams(window.location.search);
    const oob = params.get('oobCode');
    if(!oob){
      setState({ loading:false, ok:false, message:'Falta parámetro oobCode en la URL.', code:'NO_OOB_CODE', email:null });
      return;
    }
    (async ()=>{
      const r = await applyVerificationCode(oob);
      setState({
        loading:false,
        ok:r.ok,
        message:r.message,
        code:r.errorCode || null,
        email:r.email || null
      });
    })();
  },[]);

  return (
    <div style={{ maxWidth:480, margin:'40px auto', fontFamily:'system-ui, Arial, sans-serif' }}>
      <h2 style={{ marginBottom:12 }}>Verificación de correo</h2>
      {state.loading && <p>Procesando código...</p>}
      {!state.loading && (
        <div style={{
          background: state.ok ? '#dcfce7' : '#fef3c7',
          color: state.ok ? '#065f46' : '#92400e',
          border:'1px solid rgba(0,0,0,.06)',
          padding:'14px 16px',
          borderRadius:10,
          fontSize:14,
          lineHeight:1.4
        }}>
          <div style={{ fontWeight:600, marginBottom:6 }}>
            {state.ok ? 'Correo verificado correctamente.' : 'Resultado de la verificación'}
          </div>
          <div>{state.message}</div>
          {state.email && <div style={{ marginTop:6 }}>Email: <strong>{state.email}</strong></div>}
          {state.code && (
            <div style={{ marginTop:10, fontSize:12 }}>
              Código: <strong>{state.code}</strong><br/>
              Sugerencia: {explainFirebaseRemedy(state.code)}
            </div>
          )}
          <div style={{ marginTop:16 }}>
            <Link to="/login">
              <button style={{
                background:'#1e3a8a',
                color:'#fff',
                padding:'8px 14px',
                border:0,
                borderRadius:6,
                cursor:'pointer',
                fontWeight:600
              }}>
                Ir a iniciar sesión
              </button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerifyEmailLink;
