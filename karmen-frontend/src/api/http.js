import { getToken } from './endPoints.js';

/** Cabeceras de autenticación (Bearer token). */
export const authHeaders = () => ({ Authorization: `Bearer ${getToken()}` });

/** Cabeceras de auth + JSON, para peticiones con cuerpo JSON. */
export const jsonHeaders = () => ({ ...authHeaders(), 'Content-Type': 'application/json' });

/**
 * Procesa una respuesta fetch de forma uniforme:
 *  - 204 → null
 *  - !ok → lanza Error con el mensaje del servidor (detail/message/error)
 *  - ok  → devuelve el JSON parseado
 */
export async function handleResponse(r) {
  if (r.status === 204) return null;
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    throw new Error(data.detail || data.message || data.error || `Error ${r.status}`);
  }
  return data;
}
