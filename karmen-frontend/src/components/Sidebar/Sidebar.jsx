import { useState, useEffect } from 'react';
import { NavLink, useMatch, useNavigate } from 'react-router-dom';
import { useTheme } from '../../utils/theme/ThemeContext.jsx';
import { useResponsive } from '../../utils/useResponsive.js';
import { clearAuth, getSession, getCompanyId, updateSession } from '../../api/endPoints.js';
import { getCompany, getLogoUrl } from '../../api/companies.js';
import {
  MdDashboard, MdReceipt, MdUploadFile, MdBusiness,
  MdCalculate, MdAccountTree, MdBarChart, MdSettings, MdLogout,
} from 'react-icons/md';

const NAV_MAIN = [
  { to: '/dashboard',    label: 'Dashboard',      short: 'Inicio',   Icon: MdDashboard   },
  { to: '/facturas',     label: 'Facturas',        short: 'Facturas', Icon: MdReceipt     },
  { to: '/cargar',       label: 'Cargar Factura',  short: 'Cargar',   Icon: MdUploadFile  },
  { to: '/proveedores',  label: 'Proveedores',     short: 'Proveed.', Icon: MdBusiness    },
  { to: '/contabilidad', label: 'Contabilidad',    short: 'Contab.',  Icon: MdCalculate   },
  { to: '/cuentas',      label: 'Plan de Cuentas', short: 'Cuentas',  Icon: MdAccountTree },
  { to: '/reportes',     label: 'Reportes',        short: 'Reportes', Icon: MdBarChart    },
];

const NAV_BOTTOM = [
  { to: '/configuraciones', label: 'Configuraciones', short: 'Config', Icon: MdSettings },
];

function NavItem({ to, label, Icon, T }) {
  const [hovered, setHovered] = useState(false);
  return (
    <NavLink
      to={to}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={({ isActive }) => ({
        display: 'flex', alignItems: 'center', gap: 10,
        margin: '2px 10px', padding: '9px 12px',
        borderRadius: 10, textDecoration: 'none',
        background: isActive
          ? `linear-gradient(135deg, ${T.accent}22, ${T.accent}11)`
          : hovered ? T.surface : 'transparent',
        color: isActive ? T.accent : hovered ? T.text : T.sub,
        fontWeight: isActive ? 600 : 400,
        fontSize: 13.5,
        transition: 'all 0.15s',
        boxShadow: isActive ? `inset 0 0 0 1px ${T.accent}33` : 'none',
      })}
    >
      {({ isActive }) => (
        <>
          <span style={{
            width: 28, height: 28, borderRadius: 7,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: isActive ? `${T.accent}22` : 'transparent',
            color: isActive ? T.accent : 'inherit',
            flexShrink: 0,
          }}>
            <Icon size={17} />
          </span>
          <span>{label}</span>
          {isActive && (
            <span style={{
              marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%',
              background: T.accent, flexShrink: 0,
            }} />
          )}
        </>
      )}
    </NavLink>
  );
}

/* ── Bottom nav item (mobile) ─────────────────────────────── */
function BottomNavItem({ to, short, Icon, T }) {
  const isActive = !!useMatch(to);
  return (
    <NavLink
      to={to}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 2, flex: 1, padding: '6px 2px', textDecoration: 'none',
        color: isActive ? T.accent : T.sub,
        fontSize: 9, fontWeight: isActive ? 700 : 400,
        transition: 'color 0.15s',
        minWidth: 0,
      }}
    >
      <span style={{
        width: 32, height: 32, borderRadius: 9,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: isActive ? `${T.accent}18` : 'transparent',
        transition: 'background 0.15s',
      }}>
        <Icon size={19} />
      </span>
      <span style={{ lineHeight: 1, textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
        {short}
      </span>
    </NavLink>
  );
}

export default function Sidebar() {
  const { T } = useTheme();
  const { isMobile } = useResponsive();
  const navigate = useNavigate();
  const session = getSession();
  const fullName    = session?.fullName    || 'Usuario';
  const email       = session?.email       || 'usuario@karmen.com';
  const companyName = session?.companyName || 'Mi Empresa';
  const initial     = fullName.charAt(0).toUpperCase();
  const sessionLogoUrl = session?.logoUrl ? getLogoUrl(session.logoUrl) : null;
  const [logoUrl, setLogoUrl] = useState(sessionLogoUrl);

  useEffect(() => {
    const companyId = getCompanyId();
    if (!companyId) return;
    getCompany(companyId)
      .then(c => {
        if (c?.logoUrl) {
          updateSession({ logoUrl: c.logoUrl });
          setLogoUrl(getLogoUrl(c.logoUrl));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const onLogoUpdated = (e) => {
      const url = e.detail?.logoUrl;
      setLogoUrl(url ? getLogoUrl(url) : null);
    };
    window.addEventListener('karmen:logoUpdated', onLogoUpdated);
    return () => window.removeEventListener('karmen:logoUpdated', onLogoUpdated);
  }, []);

  const logout = () => { clearAuth(); navigate('/auth'); };

  /* ── Mobile: bottom navigation bar ────────────────────── */
  if (isMobile) {
    const all = [...NAV_MAIN, ...NAV_BOTTOM];
    return (
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
        height: 60,
        background: T.white,
        borderTop: `1px solid ${T.border}`,
        display: 'flex', alignItems: 'stretch',
        boxShadow: '0 -4px 16px rgba(0,0,0,0.08)',
      }}>
        {all.map(item => (
          <BottomNavItem key={item.to} {...item} T={T} />
        ))}
      </nav>
    );
  }

  /* ── Desktop: left sidebar ─────────────────────────────── */
  return (
    <aside style={{
      position: 'fixed', left: 0, top: 0, width: 240, height: '100vh',
      background: T.white, borderRight: `1px solid ${T.border}`,
      display: 'flex', flexDirection: 'column', zIndex: 100,
      transition: 'background 0.25s, border-color 0.25s',
    }}>
      {/* Logo / Empresa */}
      <div style={{
        padding: '20px 16px 16px',
        borderBottom: `1px solid ${T.border}`,
        background: `linear-gradient(135deg, ${T.accent}18 0%, transparent 100%)`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: logoUrl ? T.surface : `linear-gradient(135deg, ${T.accent}, ${T.purple})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, color: 'white',
            boxShadow: `0 4px 12px ${T.accent}44`,
            overflow: 'hidden', flexShrink: 0,
            border: logoUrl ? `1px solid ${T.border}` : 'none',
          }}>
            {logoUrl
              ? <img src={logoUrl} alt={companyName} style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={() => setLogoUrl(null)} />
              : 'K'}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: T.text, lineHeight: 1.2 }}>{companyName}</div>
            <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.05em', color: T.accent, textTransform: 'uppercase' }}>
              Gestión Contable
            </div>
          </div>
        </div>
      </div>

      {/* Navegación */}
      <nav style={{ flex: 1, padding: '10px 0', overflowY: 'auto' }}>
        <div style={{ padding: '4px 16px 6px', fontSize: 10, fontWeight: 600, color: T.muted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Menú
        </div>
        {NAV_MAIN.map(item => <NavItem key={item.to} {...item} T={T} />)}
        <div style={{ margin: '12px 16px 6px', borderTop: `1px solid ${T.border}` }} />
        <div style={{ padding: '4px 16px 6px', fontSize: 10, fontWeight: 600, color: T.muted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Sistema
        </div>
        {NAV_BOTTOM.map(item => <NavItem key={item.to} {...item} T={T} />)}
      </nav>

      {/* Perfil */}
      <div style={{
        padding: '12px 16px',
        borderTop: `1px solid ${T.border}`,
        background: `linear-gradient(180deg, transparent, ${T.surface}88)`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'linear-gradient(135deg,#7C3AED,#4F46E5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: 13, fontWeight: 700, flexShrink: 0,
            boxShadow: '0 2px 8px rgba(124,58,237,0.35)',
          }}>{initial}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{fullName}</div>
            <div style={{ fontSize: 10.5, color: T.sub, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{email}</div>
          </div>
        </div>
        <button
          onClick={logout}
          style={{
            width: '100%', padding: '7px 10px',
            border: `1px solid ${T.border}`,
            borderRadius: 8, background: 'transparent', color: T.sub,
            fontSize: 12.5, cursor: 'pointer', fontWeight: 500,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            transition: 'background 0.15s, color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#FEE2E2'; e.currentTarget.style.color = '#B91C1C'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.sub; }}
        >
          ↩ Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
