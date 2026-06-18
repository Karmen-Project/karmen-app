import { parseApiUrl, getToken } from './endPoints.js';
import Settings from './endPoints.js';
export const getAccountingEntries = (companyId) => {
  return fetch(`${parseApiUrl(Settings.accounting)}?companyId=${companyId}`, {
    headers: { Authorization: `Bearer ${getToken()}` }
  }).then(r => r.json());
};
