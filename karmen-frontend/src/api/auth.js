import { parseApiUrl, setAuth } from './endPoints.js';
import Settings from './endPoints.js';

export async function makeLogin(email, password) {
  const res = await fetch(parseApiUrl(Settings.login), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error('Credenciales inválidas');
  const data = await res.json();
  // Guardar sesión completa incluyendo companyId
  setAuth(data);
  return data;
}

export async function makeRegister(payload) {
  const res = await fetch(parseApiUrl(Settings.register), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.detail || 'Error al registrar'); }
  return res.json();
}
