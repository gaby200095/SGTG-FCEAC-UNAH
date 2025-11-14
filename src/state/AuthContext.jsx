import React, { createContext, useContext, useEffect, useState, useRef } from 'react';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

// Usa .env o fallback local
const API = (process.env.REACT_APP_API_URL || 'http://localhost:5001/api').replace(/\/+$/, '');
const FORCE_LOGOUT_ON_BOOT = (process.env.REACT_APP_FORCE_LOGOUT_ON_BOOT || '0') === '1';

export const AuthProvider = ({ children }) => {
  // Inicia siempre deslogueado (no rehidratar)
  const [user, setUser] = useState(null);
  const [accessToken, setAccess] = useState(null);
  const [pending2FA, setPending2FA] = useState(null);
  // NUEVO: recordar últimas credenciales para reenvío de OTP
  const [lastLoginCreds, setLastLoginCreds] = useState(null);
  const bootLogoutDone = useRef(false);

  // Forzar cierre de sesión al iniciar el frontend (omitido en panel o si hay sesión rehidratada)
  useEffect(() => {
    if (bootLogoutDone.current) return;
    const path = (()=>{ try { return window.location.pathname || ''; } catch { return ''; } })();
    const inPanel = path.startsWith('/panel');
    // Si está desactivado, si estamos en panel, o si ya hay sesión persistida → no forzar logout
    const hasPersistedSession = !!localStorage.getItem('user') && !!localStorage.getItem('accessToken');
    if (!FORCE_LOGOUT_ON_BOOT || inPanel || hasPersistedSession) {
      bootLogoutDone.current = true;
      return;
    }
    try {
      if (sessionStorage.getItem('skipBootLogout') === '1') {
        sessionStorage.removeItem('skipBootLogout');
        bootLogoutDone.current = true;
        return;
      }
    } catch {}
    (async () => {
      try {
        await fetch(`${API}/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });
      } catch {}
      try {
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        sessionStorage.removeItem('pending2FA');
        sessionStorage.removeItem('lastLoginCreds');
        sessionStorage.removeItem('skipBootLogout');
      } catch {}
      setUser(null);
      setAccess(null);
      setPending2FA(null);
      bootLogoutDone.current = true;
    })();
  }, []);

  // Rehidratación de sesión + pending2FA + lastLoginCreds
  useEffect(() => {
    (async () => {
      // 1) Rehidratar rápido desde localStorage para que PrivateRoute no redirija a /login tras un refresh
      try {
        const uRaw = localStorage.getItem('user');
        const tRaw = localStorage.getItem('accessToken');
        if (uRaw && tRaw && !user && !accessToken) {
          setUser(JSON.parse(uRaw));
          setAccess(tRaw);
        }
      } catch {}
      try {
        const r = await fetch(`${API}/auth/me`, { method: 'GET', credentials: 'include' });
        if (r.ok) {
          const data = await r.json();
          if (data?.user && data?.accessToken) {
            setUser(data.user);
            setAccess(data.accessToken);
          }
        }
      } catch {}
      try {
        const raw = sessionStorage.getItem('pending2FA');
        if (raw && !pending2FA) {
          const p = JSON.parse(raw);
          if (p?.tempToken) setPending2FA(p);
        }
      } catch {}
      // NUEVO: rehidratar credenciales para reenviar OTP tras recarga
      try {
        const credRaw = sessionStorage.getItem('lastLoginCreds');
        if (credRaw) setLastLoginCreds(JSON.parse(credRaw));
      } catch {}
    })();
  }, []); // no agregar pending2FA para evitar sobrescrituras

  // Persistencia mínima (por ahora solo en memoria; opcionalmente guarda para debugging)
  useEffect(() => {
    try {
      if (user) localStorage.setItem('user', JSON.stringify(user));
      else localStorage.removeItem('user');
      if (accessToken) localStorage.setItem('accessToken', accessToken);
      else localStorage.removeItem('accessToken');
    } catch {}
  }, [user, accessToken]);

  // NUEVO: coalescer refresh concurrente
  const refreshPromiseRef = useRef(null);

  // HTTP helper con intento de refresh vía cookie; si falla → logout
  const call = async (path, opts = {}) => {
    const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

    let res = await fetch(`${API}${path}`, { ...opts, headers, credentials: 'include' });
    if (res.status !== 401) return res;

    // 401: intentar refresh una única vez (coalescing)
    if (!refreshPromiseRef.current) {
      refreshPromiseRef.current = (async () => {
        const rr = await fetch(`${API}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });
        if (!rr.ok) throw new Error('refresh-failed');
        const data = await rr.json();
        if (!data?.accessToken) throw new Error('no-token');
        setAccess(data.accessToken);
        return data.accessToken;
      })().finally(() => {
        // liberar referencia al terminar
        setTimeout(() => { refreshPromiseRef.current = null; }, 0);
      });
    }

    try {
      const newToken = await refreshPromiseRef.current;
      const retry = await fetch(`${API}${path}`, {
        ...opts,
        headers: { ...headers, Authorization: `Bearer ${newToken}` },
        credentials: 'include'
      });
      if (retry.status === 401) {
        await logout();
      }
      return retry;
    } catch {
      await logout();
      return res; // devolver respuesta original 401
    }
  };

  const register = async (payload) => {
    const r = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'include'
    });
    return r.json();
  };

  const login = async ({ correo, password, enable2fa }) => {
    // Guardar credenciales también en sessionStorage para sobrevivir a recargas
    const creds = { correo, password, enable2fa: !!enable2fa };
    setLastLoginCreds(creds);
    try { sessionStorage.setItem('lastLoginCreds', JSON.stringify(creds)); } catch {}
    const url = `${API}/auth/login${enable2fa ? '?enable2fa=1' : ''}`;
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo, password }),
      credentials: 'include'
    });
    const data = await r.json();
    if (data?.requires2FA && data.tempToken) {
      const p = { tempToken: data.tempToken, roles: data.roles };
      setPending2FA(p);
      try { sessionStorage.setItem('pending2FA', JSON.stringify(p)); } catch {}
    } else if (data?.twoFactorSetup && data.tempToken) {
      const p = { tempToken: data.tempToken, roles: data.roles, setup: { secret: data.secret, otpauth: data.otpauth } };
      setPending2FA(p);
      try { sessionStorage.setItem('pending2FA', JSON.stringify(p)); } catch {}
    } else if (data?.requires2FAEmail && data.tempToken) {
      const p = { tempToken: data.tempToken, roles: data.roles, email: true };
      setPending2FA(p);
      try { sessionStorage.setItem('pending2FA', JSON.stringify(p)); } catch {}
    } else if (data?.accessToken && data?.user) {
      setUser(data.user);
      setAccess(data.accessToken);
      // Persistir inmediatamente para sobrevivir a un refresh/redirección
      try {
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('accessToken', data.accessToken);
      } catch {}
    }
    return data;
  };

  // NUEVO: reenviar OTP (vía login de nuevo con las últimas credenciales)
  const resend2FA = async () => {
    if (!lastLoginCreds?.correo || !lastLoginCreds?.password) {
      return { ok: false, message: 'No hay credenciales para reenviar el código.' };
    }
    try {
      const data = await login(lastLoginCreds);
      if (data?.requires2FAEmail || data?.requires2FA || data?.twoFactorSetup) {
        return { ok: true, message: 'Código reenviado (revisa tu correo o app).' };
      }
      return { ok: false, message: 'No fue posible reenviar el código.' };
    } catch {
      return { ok: false, message: 'Error reenviando código.' };
    }
  };

  // NUEVO: cancelar flujo 2FA y limpiar storage
  const cancel2FA = () => {
    setPending2FA(null);
    try { sessionStorage.removeItem('pending2FA'); } catch {}
    try { sessionStorage.removeItem('lastLoginCreds'); } catch {} // NUEVO
  };

  const verify2FA = async ({ code }) => {
    if (!pending2FA?.tempToken) return { ok: false, data: { error: 'No hay sesión 2FA pendiente' } };
    const r = await fetch(`${API}/auth/2fa-verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tempToken: pending2FA.tempToken, code }),
      credentials: 'include'
    });
    const data = await r.json();
    if (r.ok && data?.accessToken && data?.user) {
      setUser(data.user);
      setAccess(data.accessToken);
      setPending2FA(null);
      try {
        sessionStorage.removeItem('pending2FA');
        // Persistir de inmediato para que el panel cargue sesión al refrescar/redirigir
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('accessToken', data.accessToken);
      } catch {}
    }
    return { ok: r.ok, data };
  };

  const refresh = async () => {
    const r = await fetch(`${API}/auth/refresh`, { method: 'POST', credentials: 'include' });
    if (!r.ok) return;
    const data = await r.json();
    if (data?.accessToken) setAccess(data.accessToken);
  };

  const forgot = async (correo) => {
    try {
      const r = await fetch(`${API}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo }),
        credentials: 'include'
      });
      return await r.json();
    } catch {
      return { ok: false, error: 'Error de red al solicitar enlace' };
    }
  };

  // NUEVO: restablecer contraseña con token
  const resetPassword = async ({ token, password }) => {
    const r = await fetch(`${API}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
      credentials: 'include'
    });
    return r.json();
  };

  const logout = async () => {
    try {
      await fetch(`${API}/auth/logout`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include' });
    } catch {}
    try {
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      sessionStorage.removeItem('pending2FA');
      sessionStorage.removeItem('lastLoginCreds'); // NUEVO
    } catch {}
    setUser(null);
    setAccess(null);
    setPending2FA(null);
  };

  // Refresco periódico del access token si hay sesión activa
  useEffect(() => {
    const id = setInterval(() => {
      if (accessToken) refresh();
    }, 5 * 60 * 1000); // cada 5 min
    return () => clearInterval(id);
  }, [accessToken]);

  // Detector de inactividad (15 min). Resetea al mover/teclear/click/etc. y cierra sesión al expirar
  const idleTimer = useRef(null);
  const IDLE_MS = 15 * 60 * 1000;
  const resetIdle = () => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (!accessToken && !user) return; // no hay sesión
    idleTimer.current = setTimeout(() => {
      logout(); // cerrar sesión por inactividad
      // opcional: notificar al usuario
      // alert('Sesión cerrada por inactividad');
    }, IDLE_MS);
  };
  useEffect(() => {
    const evs = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart', 'visibilitychange'];
    const handler = () => resetIdle();
    evs.forEach(e => window.addEventListener(e, handler));
    resetIdle();
    return () => {
      evs.forEach(e => window.removeEventListener(e, handler));
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [accessToken, user]);

  const value = {
    user,
    accessToken,
    pending2FA,
    call,
    register,
    login,
    verify2FA,
    resend2FA,
    cancel2FA,
    forgot,
    resetPassword,
    logout
  };

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
};
