import { parseApiUrl } from './endPoints.js';
import Settings from './endPoints.js';
import { authHeaders, jsonHeaders, handleResponse } from './http.js';

export const getInvoices = (companyId, params = {}) => {
  const q = new URLSearchParams({ companyId, ...params }).toString();
  return fetch(`${parseApiUrl(Settings.invoices)}?${q}`, { headers: authHeaders() })
    .then(handleResponse);
};

export const getInvoiceById = (id) =>
  fetch(parseApiUrl(Settings.invoiceById, id), { headers: authHeaders() })
    .then(handleResponse);

export const uploadInvoice = (companyId, type, file) => {
  const fd = new FormData();
  fd.append('file', file);
  return fetch(
    `${parseApiUrl(Settings.invoiceUpload)}?companyId=${companyId}&type=${type}`,
    { method: 'POST', headers: authHeaders(), body: fd }
  ).then(handleResponse);
};

export const confirmInvoice = (id, data) =>
  fetch(parseApiUrl(Settings.invoiceConfirm, id), {
    method: 'PATCH', headers: jsonHeaders(), body: JSON.stringify(data),
  }).then(handleResponse);

export const updateInvoice = (id, data) =>
  fetch(parseApiUrl(Settings.invoiceById, id), {
    method: 'PUT', headers: jsonHeaders(), body: JSON.stringify(data),
  }).then(handleResponse);

export const deleteInvoice = (id) =>
  fetch(parseApiUrl(Settings.invoiceById, id), { method: 'DELETE', headers: authHeaders() })
    .then(handleResponse);

export const getInvoiceHistory = (id) =>
  fetch(parseApiUrl(Settings.invoiceHistory, id), { headers: authHeaders() })
    .then(handleResponse);

// Caso especial: nunca lanza; devuelve null si no hay imagen (204) o si falla.
export const getInvoiceImageUrl = async (id) => {
  const r = await fetch(parseApiUrl(Settings.invoiceImage, id), { headers: authHeaders() });
  if (r.status === 204) return null;
  return r.json().catch(() => null);
};

export const contabilizarInvoice = (id) =>
  fetch(parseApiUrl(Settings.invoiceContabilizar, id), { method: 'POST', headers: authHeaders() })
    .then(handleResponse);
