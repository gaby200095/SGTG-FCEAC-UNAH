import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

const API = 'http://localhost:5001/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
  });
  const [accessToken, setAccess] = useState(localStorage.getItem('accessToken'));
  const [refreshToken, setRefresh] = useState(localStorage.getItem('refreshToken'));
  const [pending2FA, setPending2FA] = useState(null); // { tempToken, roles }

  useEffect(() => {
    if (user) localStorage.setItem('user', JSON.stringify(user)); else localStorage.removeItem('user');
    if (accessToken) localStorage.setItem('accessToken', accessToken); else localStorage.removeItem('accessToken');
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken); else localStorage.removeItem('refreshToken');
  }, [user, accessToken, refreshToken]);

  const call = async (path, opts = {}) => {
    const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    const res = await fetch(`${API}${path}`, { ...opts, headers, credentials: 'include' });
    if (res.status === 401 && refreshToken) {
      // intentar refresh
      const rr = await fetch(`${API}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
        credentials: 'include'
      });
      if (rr.ok) {
        const data = await rr.json();
        setAccess(data.accessToken);
        const retry = await fetch(`${API}${path}`, { ...opts, headers: { ...headers, Authorization: `Bearer ${data.accessToken}` }, credentials: 'include' });
        return retry;
      }
    }
    return res;
  };

  const register = async (payload) => {
    const r = await fetch(`${API}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    return r.json();
  };

  const login = async ({ correo, password, enable2fa }) => {
    const url = `${API}/auth/login${enable2fa ? '?enable2fa=1' : ''}`;
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo, password })
    });
    const data = await r.json();
    if (data?.requires2FA && data.tempToken) {
      setPending2FA({ tempToken: data.tempToken, roles: data.roles });
    } else if (data?.twoFactorSetup) {
      // devuelve secret/otpauth cuando se habilita
    } else if (data?.accessToken && data?.user) {
      setUser(data.user);
      setAccess(data.accessToken);
    }
    return data;
  };

  const verify2FA = async ({ code }) => {
    if (!pending2FA?.tempToken) return { ok: false, error: 'No hay sesión 2FA pendiente' };
    const r = await fetch(`${API}/auth/2fa-verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tempToken: pending2FA.tempToken, code })
    });
    const data = await r.json();
    if (r.ok && data.accessToken && data.user) {
      setUser(data.user);
      setAccess(data.accessToken);
      setPending2FA(null);
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
    const r = await fetch(`${API}/auth/forgot-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ correo }) });
    return r.json();
  };

  const logout = async () => {
    try {
      await fetch(`${API}/auth/logout`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken }), credentials: 'include' });
    } finally {
      setUser(null); setAccess(null); setRefresh(null);
    }
  };

  // (Opcional) refresco periódico
  useEffect(() => {
    const id = setInterval(() => {
      if (accessToken) refresh();
    }, 5 * 60 * 1000); // cada 5 min
    return () => clearInterval(id);
  }, [accessToken]);

  const value = {
    user, accessToken, refreshToken,
    pending2FA,
    call,
    register, login, verify2FA, forgot, logout
  };
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
};
