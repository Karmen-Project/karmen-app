import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../utils/theme/ThemeContext.jsx';
import { useResponsive } from '../utils/useResponsive.js';
import Sidebar from '../components/Sidebar/Sidebar.jsx';
import { getSession, getCompanyId, updateSession } from '../api/endPoints.js';
import { updateUserProfile, changePassword } from '../api/users.js';
import { getCompany, updateCompany, uploadCompanyLogo, getLogoUrl } from '../api/companies.js';
import {
  MdSettings, MdPerson, MdBusiness, MdLock, MdPalette,
  MdLightMode, MdDarkMode, MdPhotoCamera, MdSave, MdInfo,
  MdWarning, MdCheckCircle, MdCheck, MdSmartToy, MdBarChart, MdDescription,
} from 'react-icons/md';

// ─── UI helpers ────────────────────────────────────────────────────────────────

function SettingCard({ title, description, children, T }) {
  return (
    <div style={{
      background: T.white, borderRadius: T.radius, padding: '20px 24px',
      boxShadow: T.shadow, border: `1px solid ${T.border}`, marginBottom: 16,
    }}>
      {(title || description) && (
        <div style={{ marginBottom: 16 }}>
          {title && <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{title}</div>}
          {description && <div style={{ fontSize: 13, color: T.sub, marginTop: 3 }}>{description}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

function SettingRow({ label, description, children, T }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 0', borderBottom: `1px solid ${T.border}`,
    }}>
      <div>
        <div style={{ fontSize: 13.5, fontWeight: 500, color: T.text }}>{label}</div>
        {description && <div style={{ fontSize: 12, color: T.sub, marginTop: 2 }}>{description}</div>}
      </div>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange, T }) {
  return (
    <button role="switch" aria-checked={checked} onClick={onChange}
      style={{
        width: 46, height: 26, borderRadius: 13, border: 'none', padding: 0,
        background: checked ? `linear-gradient(135deg, ${T.accent}, ${T.purple})` : T.border,
        cursor: 'pointer', position: 'relative', flexShrink: 0, transition: 'background 0.25s',
        boxShadow: checked ? `0 2px 8px ${T.accent}55` : 'none',
      }}
    >
      <span style={{
        position: 'absolute', top: 3, left: checked ? 23 : 3,
        width: 20, height: 20, borderRadius: '50%', background: 'white',
        boxShadow: '0 1px 4px rgba(0,0,0,0.25)', transition: 'left 0.25s cubic-bezier(.4,0,.2,1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: checked ? '#F59E0B' : '#64748B',
      }}>
        {checked ? <MdLightMode size={13} /> : <MdDarkMode size={13} />}
      </span>
    </button>
  );
}

function SectionLabel({ children, T }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
      textTransform: 'uppercase', color: T.accent,
      marginBottom: 12, marginTop: 28,
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      <span style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${T.accent}44, transparent)` }} />
      {children}
      <span style={{ flex: 3, height: 1, background: `linear-gradient(90deg, transparent, ${T.accent}11)` }} />
    </div>
  );
}

const TABS = [
  { id: 'perfil',     label: 'Perfil',     Icon: MdPerson   },
  { id: 'empresa',    label: 'Empresa',    Icon: MdBusiness },
  { id: 'seguridad',  label: 'Seguridad',  Icon: MdLock     },
  { id: 'apariencia', label: 'Apariencia', Icon: MdPalette  },
];

// ─── Main component ────────────────────────────────────────────────────────────

export default function Configuraciones() {
  const { T, dark, toggle } = useTheme();
  const { isMobile, mainPadding } = useResponsive();
  const [activeTab, setActiveTab] = useState('perfil');

  const inp = {
    padding: '9px 12px', border: `1px solid ${T.border}`,
    borderRadius: T.radiusSm, fontSize: 14,
    background: T.surface, color: T.text, width: '100%', boxSizing: 'border-box',
  };

  const btn = (variant = 'primary') => ({
    padding: '10px 20px', borderRadius: T.radiusSm,
    fontWeight: 700, fontSize: 14, cursor: 'pointer',
    background: variant === 'primary' ? T.btn : T.surface,
    color: variant === 'primary' ? 'white' : T.text,
    border: variant === 'secondary' ? `1px solid ${T.border}` : 'none',
    display: 'inline-flex', alignItems: 'center', gap: 6,
  });

  return (
    <div style={{ background: T.bg, minHeight: '100vh', transition: 'background 0.25s', ...mainPadding }}>
      <Sidebar />
      <main style={{ maxWidth: 800, margin: '0 auto', padding: isMobile ? 16 : 32 }}>

        {/* Header */}
        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: `linear-gradient(135deg, ${T.accent}, ${T.purple})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', boxShadow: `0 4px 12px ${T.accent}44`,
          }}><MdSettings size={22} /></div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: T.text }}>Configuraciones</h1>
            <p style={{ margin: 0, color: T.sub, fontSize: 13 }}>Gestiona tu perfil, empresa y preferencias</p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: `1px solid ${T.border}`, paddingBottom: 0 }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '10px 18px', border: 'none', background: 'none', cursor: 'pointer',
                fontSize: 14, fontWeight: activeTab === tab.id ? 700 : 500,
                color: activeTab === tab.id ? T.accent : T.sub,
                borderBottom: activeTab === tab.id ? `2px solid ${T.accent}` : '2px solid transparent',
                marginBottom: -1, transition: 'color 0.2s',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <tab.Icon size={16} />{tab.label}
            </button>
          ))}
        </div>

        {/* Tab panels */}
        {activeTab === 'perfil'     && <TabPerfil    T={T} inp={inp} btn={btn} />}
        {activeTab === 'empresa'    && <TabEmpresa   T={T} inp={inp} btn={btn} />}
        {activeTab === 'seguridad'  && <TabSeguridad T={T} inp={inp} btn={btn} />}
        {activeTab === 'apariencia' && <TabApariencia T={T} dark={dark} toggle={toggle} />}

        <div style={{ height: 32 }} />
      </main>
    </div>
  );
}

// ─── Tab: Perfil personal ─────────────────────────────────────────────────────

function TabPerfil({ T, inp, btn }) {
  const session = getSession();
  const [form, setForm] = useState({ fullName: session?.fullName || '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSave = async () => {
    setLoading(true); setError(''); setSuccess('');
    try {
      const updated = await updateUserProfile({ fullName: form.fullName });
      updateSession({ fullName: updated.fullName });
      setSuccess('Perfil actualizado correctamente');
    } catch (e) {
      setError(e.message || 'Error al actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Alert msg={success} type="success" T={T} />
      <Alert msg={error} type="error" T={T} />

      <SettingCard title="Información personal" T={T}>
        <Field label="Nombre completo" T={T}>
          <input value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} style={inp} />
        </Field>
        <Field label="Correo electrónico" T={T}>
          <input value={session?.email || ''} disabled style={{ ...inp, opacity: 0.6, cursor: 'not-allowed' }} />
        </Field>
        <Field label="Rol" T={T}>
          <input value={session?.role || ''} disabled style={{ ...inp, opacity: 0.6, cursor: 'not-allowed' }} />
        </Field>
        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={handleSave} disabled={loading} style={btn()}>
            {loading ? 'Guardando...' : <><MdSave size={15} /> Guardar cambios</>}
          </button>
        </div>
      </SettingCard>
    </div>
  );
}

// ─── Tab: Empresa ─────────────────────────────────────────────────────────────

function TabEmpresa({ T, inp, btn }) {
  const companyId = getCompanyId();
  const [, setCompany] = useState(null);
  const [form, setForm] = useState({ name: '', nit: '', address: '', phone: '', email: '' });
  const [logoPreview, setLogoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [logoLoading, setLogoLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const logoRef = useRef();

  useEffect(() => {
    if (!companyId) return;
    getCompany(companyId).then(c => {
      setCompany(c);
      setForm({ name: c.name || '', nit: c.nit || '', address: c.address || '', phone: c.phone || '', email: c.email || '' });
      if (c.logoUrl) setLogoPreview(getLogoUrl(c.logoUrl));
    }).catch(() => {});
  }, [companyId]);

  const handleSave = async () => {
    setLoading(true); setError(''); setSuccess('');
    try {
      const updated = await updateCompany(companyId, form);
      setCompany(updated);
      updateSession({ companyName: updated.name });
      setSuccess('Datos de empresa actualizados');
    } catch (e) {
      setError(e.message || 'Error al actualizar la empresa');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoChange = async (file) => {
    if (!file) return;
    setLogoPreview(URL.createObjectURL(file));
    setLogoLoading(true); setError('');
    try {
      const updated = await uploadCompanyLogo(companyId, file);
      setCompany(updated);
      if (updated.logoUrl) {
        updateSession({ logoUrl: updated.logoUrl });
        setLogoPreview(getLogoUrl(updated.logoUrl));
        window.dispatchEvent(new CustomEvent('karmen:logoUpdated', { detail: { logoUrl: updated.logoUrl } }));
      }
      setSuccess('Logo actualizado');
    } catch (e) {
      setError(e.message || 'Error al subir el logo');
    } finally {
      setLogoLoading(false);
    }
  };

  return (
    <div>
      <Alert msg={success} type="success" T={T} />
      <Alert msg={error} type="error" T={T} />

      <SettingCard title="Logo de la empresa" T={T}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div
            onClick={() => !logoLoading && logoRef.current?.click()}
            style={{
              width: 88, height: 88, borderRadius: T.radius,
              border: `2px dashed ${T.border}`, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', background: T.surface,
              flexShrink: 0,
            }}
          >
            {logoPreview
              ? <img src={logoPreview} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              : <MdBusiness size={34} color={T.sub} />
            }
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 4 }}>Logo de la empresa</div>
            <div style={{ fontSize: 12, color: T.sub, marginBottom: 10 }}>Se mostrará en los reportes PDF exportados. Formatos: JPG, PNG (max 10MB).</div>
            <button onClick={() => logoRef.current?.click()} disabled={logoLoading} style={{ ...btn('secondary'), display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <MdPhotoCamera size={15} />{logoLoading ? 'Subiendo...' : 'Cambiar logo'}
            </button>
            <input ref={logoRef} type="file" accept=".jpg,.jpeg,.png" style={{ display: 'none' }}
              onChange={e => handleLogoChange(e.target.files[0])} />
          </div>
        </div>
      </SettingCard>

      <SettingCard title="Datos de la empresa" T={T}>
        <Field label="Nombre de la empresa" T={T}>
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inp} />
        </Field>
        <Field label="NIT / Cédula" T={T}>
          <input value={form.nit} onChange={e => setForm({ ...form, nit: e.target.value })} style={inp} placeholder="900.000.000-0" />
        </Field>
        <Field label="Dirección" T={T}>
          <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} style={inp} />
        </Field>
        <Field label="Teléfono" T={T}>
          <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={inp} placeholder="+57 300 000 0000" />
        </Field>
        <Field label="Correo de contacto" T={T}>
          <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inp} type="email" />
        </Field>
        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={handleSave} disabled={loading} style={btn()}>
            {loading ? 'Guardando...' : <><MdSave size={15} /> Guardar cambios</>}
          </button>
        </div>
      </SettingCard>
    </div>
  );
}

// ─── Tab: Seguridad ───────────────────────────────────────────────────────────

function TabSeguridad({ T, inp, btn }) {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleChange = async () => {
    if (form.newPassword !== form.confirmPassword) {
      setError('Las contraseñas nuevas no coinciden');
      return;
    }
    if (form.newPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    setLoading(true); setError(''); setSuccess('');
    try {
      await changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      setSuccess('Contraseña cambiada exitosamente');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (e) {
      setError(e.message || 'Error al cambiar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Alert msg={success} type="success" T={T} />
      <Alert msg={error} type="error" T={T} />

      <SettingCard title="Cambiar contraseña" description="Se requiere la contraseña actual para confirmar el cambio" T={T}>
        <Field label="Contraseña actual" T={T}>
          <input type="password" value={form.currentPassword} onChange={e => setForm({ ...form, currentPassword: e.target.value })} style={inp} />
        </Field>
        <Field label="Nueva contraseña" T={T}>
          <input type="password" value={form.newPassword} onChange={e => setForm({ ...form, newPassword: e.target.value })} style={inp} placeholder="Mínimo 8 caracteres" />
        </Field>
        <Field label="Confirmar nueva contraseña" T={T}>
          <input type="password" value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} style={inp} />
        </Field>
        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={handleChange} disabled={loading || !form.currentPassword || !form.newPassword} style={btn()}>
            {loading ? 'Cambiando...' : <><MdLock size={15} /> Cambiar contraseña</>}
          </button>
        </div>
      </SettingCard>

      <SettingCard T={T}>
        <div style={{ padding: '8px 0', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <MdInfo size={24} color={T.sub} style={{ flexShrink: 0 }} />
          <div style={{ fontSize: 13, color: T.sub, lineHeight: 1.5 }}>
            Recibirás un email de confirmación al cambiar tu contraseña. Si no reconoces esta acción, contacta soporte inmediatamente.
          </div>
        </div>
      </SettingCard>
    </div>
  );
}

// ─── Tab: Apariencia ──────────────────────────────────────────────────────────

function TabApariencia({ T, dark, toggle }) {
  return (
    <div>
      <SettingCard title="Tema de la aplicación" description="Elige entre modo claro u oscuro" T={T}>
        <SettingRow label="Modo Oscuro" description={dark ? 'Activo — interfaz oscura' : 'Inactivo — interfaz clara'} T={T}>
          <Toggle checked={dark} onChange={toggle} T={T} />
        </SettingRow>
        <div style={{ paddingTop: 16, display: 'flex', gap: 12 }}>
          <ThemePreview mode="light" active={!dark} onSelect={() => dark && toggle()} T={T} />
          <ThemePreview mode="dark"  active={dark}  onSelect={() => !dark && toggle()} T={T} />
        </div>
      </SettingCard>

      <SettingCard title="Karmen" T={T}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '8px 0' }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: `linear-gradient(135deg, ${T.accent}, ${T.purple})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, color: 'white', boxShadow: `0 6px 16px ${T.accent}44`,
          }}>K</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: T.text }}>Karmen</div>
            <div style={{ fontSize: 12, color: T.sub, marginTop: 2 }}>Gestión Contable Automatizada</div>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>Versión 1.0.0</div>
          </div>
        </div>
        <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { Icon: MdSmartToy,    text: 'OCR Automático' },
            { Icon: MdLock,        text: 'Seguridad JWT'  },
            { Icon: MdBarChart,    text: 'Reportes'       },
            { Icon: MdDescription, text: 'Exportar PDF'   },
          ].map(({ Icon: TagIcon, text }) => (
            <span key={text} style={{ fontSize: 11, fontWeight: 600, background: T.accentLt, color: T.accent, padding: '4px 10px', borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <TagIcon size={13} />{text}
            </span>
          ))}
        </div>
      </SettingCard>
    </div>
  );
}

// ─── Shared micro-components ──────────────────────────────────────────────────

function Field({ label, children, T }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 5, color: T.text }}>{label}</label>
      {children}
    </div>
  );
}

function Alert({ msg, type, T }) {
  if (!msg) return null;
  const isError = type === 'error';
  return (
    <div style={{
      padding: '11px 16px', borderRadius: T.radiusSm, marginBottom: 16, fontSize: 14,
      background: isError ? T.redLt : T.greenLt,
      color: isError ? T.red : T.greenText,
    }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {isError ? <MdWarning size={16} /> : <MdCheckCircle size={16} />}{msg}
      </span>
    </div>
  );
}

function ThemePreview({ mode, active, onSelect, T }) {
  const isLight = mode === 'light';
  return (
    <div onClick={onSelect} style={{
      flex: 1, borderRadius: T.radiusSm, overflow: 'hidden',
      border: `2px solid ${active ? T.accent : T.border}`,
      cursor: active ? 'default' : 'pointer',
      boxShadow: active ? `0 0 0 3px ${T.accent}22` : 'none',
      transition: 'border-color 0.2s',
    }}>
      <div style={{ background: isLight ? '#EEF2F7' : '#0F172A', padding: '10px 12px' }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: isLight ? '#E5E7EB' : '#334155' }} />
          <div style={{ flex: 1, height: 8, borderRadius: 4, background: isLight ? '#E5E7EB' : '#334155' }} />
        </div>
        <div style={{ height: 28, borderRadius: 6, background: isLight ? '#fff' : '#1E293B', marginBottom: 4 }} />
        <div style={{ height: 8, borderRadius: 4, background: isLight ? '#E5E7EB' : '#334155', width: '60%' }} />
      </div>
      <div style={{
        background: isLight ? '#E2E8F0' : '#1E293B',
        padding: '4px 12px 8px', fontSize: 11, fontWeight: 600, textAlign: 'center',
        color: active ? (isLight ? '#4F46E5' : '#818CF8') : (isLight ? '#6B7280' : '#64748B'),
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
      }}>
        {active && <MdCheck size={12} />}{isLight ? 'Modo Claro' : 'Modo Oscuro'}
      </div>
    </div>
  );
}
