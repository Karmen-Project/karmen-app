import { useState, useCallback } from 'react';
import { makeLogin, makeRegister } from '../api/auth.js';
import { getToken, clearAuth } from '../api/endPoints.js';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isAuthenticated = () => !!getToken();

  const login = useCallback(async (email, password) => {
    setLoading(true); setError(null);
    try {
      const data = await makeLogin(email, password);
      setUser({ email });
      return data;
    } catch (e) { setError(e.message); throw e; }
    finally { setLoading(false); }
  }, []);

  const logout = useCallback(() => { clearAuth(); setUser(null); }, []);

  const register = useCallback(async (payload) => {
    setLoading(true); setError(null);
    try { return await makeRegister(payload); }
    catch (e) { setError(e.message); throw e; }
    finally { setLoading(false); }
  }, []);

  return { user, login, logout, register, isAuthenticated, loading, error };
}
