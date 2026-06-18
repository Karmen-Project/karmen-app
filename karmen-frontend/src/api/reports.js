import { parseApiUrl } from './endPoints.js';
import Settings from './endPoints.js';
import { authHeaders, handleResponse } from './http.js';

export const getMonthlyReport = (companyId) =>
  fetch(`${parseApiUrl(Settings.reports)}?companyId=${companyId}`, { headers: authHeaders() })
    .then(handleResponse);

export const getRangeReport = (companyId, dateFrom, dateTo) =>
  fetch(`${parseApiUrl(Settings.reportsRange)}?companyId=${companyId}&dateFrom=${dateFrom}&dateTo=${dateTo}`, { headers: authHeaders() })
    .then(handleResponse);

// Devuelve un Blob (PDF), no JSON.
export const exportReportPDF = (companyId) =>
  fetch(`${parseApiUrl(Settings.reportsPDF)}?companyId=${companyId}`, { headers: authHeaders() })
    .then(r => r.blob());
