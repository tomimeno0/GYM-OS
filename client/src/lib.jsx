import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
export async function api(path, body, method) {
  let response;
  try {
    response = await fetch(`/api/v1${path}`, {
      credentials: 'include',
      method: method || (body === undefined ? 'GET' : 'POST'),
      headers: { 'Content-Type': 'application/json', 'X-GymOS-Client': 'web' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  } catch {
    throw new Error('No pudimos conectarnos al servidor. Revisá tu conexión e intentá nuevamente.');
  }
  let data;
  try {
    data = response.status === 204 ? null : await response.json();
  } catch {
    throw new Error('El servidor no está disponible. Intentá nuevamente en unos momentos.');
  }
  if (!response.ok) {
    const error = new Error(data?.error?.message || 'No se pudo completar la solicitud.');
    error.details = data?.error?.details;
    error.status = response.status;
    if (response.status === 401 && !path.startsWith('/auth/') && path !== '/me')
      window.dispatchEvent(new Event('session-expired'));
    throw error;
  }
  return data;
}
export function useResource(path) {
  const [data, setData] = useState(null),
    [error, setError] = useState(null),
    [loading, setLoading] = useState(true),
    [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((n) => n + 1), []);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    api(path)
      .then((v) => {
        if (active) setData(v);
      })
      .catch((e) => {
        if (active) setError(e);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [path, version]);
  return { data, error, loading, reload, setData };
}
export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(null);
  const refresh = useCallback(async () => {
    setError(null);
    try {
      setUser((await api('/me')).user);
    } catch (e) {
      setUser(null);
      if (e.status !== 401) setError(e);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    refresh();
    const expire = () => setUser(null);
    window.addEventListener('session-expired', expire);
    return () => window.removeEventListener('session-expired', expire);
  }, [refresh]);
  return (
    <AuthContext.Provider value={{ user, setUser, loading, error, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}
export function useAction() {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(null),
    [success, setSuccess] = useState('');
  const lock = useRef(false);
  async function run(fn, message = '') {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError(null);
    setSuccess('');
    try {
      const value = await fn();
      setSuccess(message);
      return value;
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
      lock.current = false;
    }
  }
  return { busy, error, success, run, setError };
}
export const number = (v) =>
  new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 }).format(v ?? 0);
export const date = (v, zone) =>
  v
    ? new Intl.DateTimeFormat('es-AR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        ...(zone ? { timeZone: zone } : {}),
      }).format(new Date(v.length === 10 ? v + 'T12:00:00' : v))
    : '—';
export const today = (zone) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: zone || 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
export const localDateTime = (v) => {
  const d = v ? new Date(v) : new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
export const pick = (obj, keys) => Object.fromEntries(keys.map((k) => [k, obj[k]]));
export const unitLabel = (unit) =>
  ({ kg: 'kg', km: 'km', porcentaje: '%', veces_por_semana: 'días/sem.' })[unit] || unit;
export const titleCase = (s) =>
  s
    ? { miercoles: 'Miércoles', sabado: 'Sábado', colacion: 'Colación' }[s] ||
      s.charAt(0).toUpperCase() + s.slice(1).replaceAll('_', ' ')
    : '';
