import { parseApiUrl } from './endPoints.js';
import Settings from './endPoints.js';
import { authHeaders, jsonHeaders, handleResponse } from './http.js';

export const getUserProfile = () =>
  fetch(parseApiUrl(Settings.userProfile), { headers: authHeaders() })
    .then(handleResponse);

export const updateUserProfile = (data) =>
  fetch(parseApiUrl(Settings.userProfile), {
    method: 'PATCH', headers: jsonHeaders(), body: JSON.stringify(data),
  }).then(handleResponse);

export const changePassword = (data) =>
  fetch(parseApiUrl(Settings.userChangePassword), {
    method: 'POST', headers: jsonHeaders(), body: JSON.stringify(data),
  }).then(handleResponse);
