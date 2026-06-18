import { parseApiUrl } from './endPoints.js';
import Settings from './endPoints.js';
import { authHeaders, jsonHeaders, handleResponse } from './http.js';

export const getAccounts = (companyId) =>
  fetch(`${parseApiUrl(Settings.accounts)}?companyId=${companyId}`, { headers: authHeaders() })
    .then(handleResponse);

export const createAccount = (companyId, data) =>
  fetch(`${parseApiUrl(Settings.accounts)}?companyId=${companyId}`, {
    method: 'POST', headers: jsonHeaders(), body: JSON.stringify(data),
  }).then(handleResponse);

export const updateAccount = (id, data) =>
  fetch(parseApiUrl(Settings.accountById, id), {
    method: 'PUT', headers: jsonHeaders(), body: JSON.stringify(data),
  }).then(handleResponse);

export const toggleAccount = (id) =>
  fetch(parseApiUrl(Settings.accountToggle, id), { method: 'PATCH', headers: authHeaders() })
    .then(handleResponse);

export const deleteAccount = (id) =>
  fetch(parseApiUrl(Settings.accountById, id), { method: 'DELETE', headers: authHeaders() })
    .then(handleResponse);

export const suggestAccounts = (companyId, invoiceType) =>
  fetch(`${parseApiUrl(Settings.accountsSuggest)}?companyId=${companyId}&invoiceType=${invoiceType}`, { headers: authHeaders() })
    .then(handleResponse);
