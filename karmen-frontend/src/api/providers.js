import { parseApiUrl } from './endPoints.js';
import Settings from './endPoints.js';
import { authHeaders, jsonHeaders, handleResponse } from './http.js';

export const getProviders = (companyId, type) => {
  const q = new URLSearchParams({ companyId, ...(type ? { type } : {}) }).toString();
  return fetch(`${parseApiUrl(Settings.providers)}?${q}`, { headers: authHeaders() })
    .then(handleResponse);
};

export const createProvider = (data) =>
  fetch(parseApiUrl(Settings.providers), {
    method: 'POST', headers: jsonHeaders(), body: JSON.stringify(data),
  }).then(handleResponse);

export const updateProvider = (id, data) =>
  fetch(parseApiUrl(Settings.providerById, id), {
    method: 'PUT', headers: jsonHeaders(), body: JSON.stringify(data),
  }).then(handleResponse);

export const deleteProvider = (id) =>
  fetch(parseApiUrl(Settings.providerById, id), { method: 'DELETE', headers: authHeaders() })
    .then(handleResponse);
