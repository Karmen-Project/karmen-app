import { parseApiUrl } from './endPoints.js';
import Settings from './endPoints.js';
import { authHeaders, jsonHeaders, handleResponse } from './http.js';

export const getCompany = (id) =>
  fetch(parseApiUrl(Settings.companies, id), { headers: authHeaders() })
    .then(handleResponse);

export const updateCompany = (id, data) =>
  fetch(parseApiUrl(Settings.companies, id), {
    method: 'PATCH', headers: jsonHeaders(), body: JSON.stringify(data),
  }).then(handleResponse);

export const uploadCompanyLogo = (id, file) => {
  const fd = new FormData();
  fd.append('file', file);
  return fetch(parseApiUrl(Settings.companyLogo, id), {
    method: 'POST', headers: authHeaders(), body: fd,
  }).then(handleResponse);
};

// Logos nuevos: URL completa de Supabase Storage.
// Logos legacy (solo filename): construye URL local al backend.
export const getLogoUrl = (logoUrl) => {
  if (!logoUrl) return null;
  if (logoUrl.startsWith('http://') || logoUrl.startsWith('https://')) return logoUrl;
  return parseApiUrl(Settings.files, logoUrl);
};
