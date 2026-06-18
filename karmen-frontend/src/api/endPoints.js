const Settings = {
  main: import.meta.env.VITE_API_URL,
  login: "auth/login",
  register: "auth/register",
  invoices: "invoices",
  invoiceById: "invoices/{0}",
  invoiceUpload: "invoices/upload",
  invoiceConfirm: "invoices/{0}/confirm",
  invoiceHistory: "invoices/{0}/history",
  invoiceContabilizar: "invoices/{0}/contabilizar",
  invoiceImage: "invoices/{0}/image",
  providers: "providers",
  providerById: "providers/{0}",
  accounting: "accounting-entries",
  accounts: "accounts",
  accountById: "accounts/{0}",
  accountToggle: "accounts/{0}/toggle",
  accountsSuggest: "accounts/suggest",
  reports: "reports/monthly",
  reportsRange: "reports/range",
  reportsPDF: "reports/export",
  userProfile: "users/me",
  userChangePassword: "users/me/change-password",
  companies: "companies/{0}",
  companyLogo: "companies/{0}/logo",
  files: "files/{0}",
};

export function formatApiUrl(str, ...args) {
  return str.replace(/\{(\d+)\}/g, (_, i) => args[i] ?? '');
}

export function parseApiUrl(endpoint, ...args) {
  return Settings.main + formatApiUrl(endpoint, ...args);
}

export const getToken = () => {
  try {
    const raw = localStorage.getItem('Auth');
    if (!raw) return null;
    const { token, expiration } = JSON.parse(raw);
    if (Date.now() > expiration) { localStorage.removeItem('Auth'); return null; }
    return token;
  } catch { return null; }
};

export const getSession = () => {
  try {
    const raw = localStorage.getItem('Auth');
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (Date.now() > session.expiration) { localStorage.removeItem('Auth'); return null; }
    return session;
  } catch { return null; }
};

export const getCompanyId = () => {
  const session = getSession();
  return session?.companyId || null;
};

export const setAuth = (data, expirationMs = 86400000) => {
  localStorage.setItem('Auth', JSON.stringify({
    token: data.token,
    userId: data.userId,
    email: data.email,
    fullName: data.fullName,
    role: data.role,
    companyId: data.companyId,
    companyName: data.companyName,
    expiration: Date.now() + expirationMs
  }));
};

export const clearAuth = () => localStorage.removeItem('Auth');

export const updateSession = (partial) => {
  const session = getSession();
  if (!session) return;
  localStorage.setItem('Auth', JSON.stringify({ ...session, ...partial }));
};

export default Settings;
