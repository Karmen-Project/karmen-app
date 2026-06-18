import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../utils/theme/ThemeContext.jsx';
import { useResponsive } from '../utils/useResponsive.js';
import Sidebar from '../components/Sidebar/Sidebar.jsx';
import Modal from '../components/Modal/Modal.jsx';
import { getProviders, createProvider, updateProvider, deleteProvider } from '../api/providers.js';
import { getCompanyId } from '../api/endPoints.js';
import {
  MdBusiness, MdLocalShipping, MdPeople, MdEmail, MdPhone,
  MdLocationOn, MdEdit, MdDelete, MdSave, MdAdd, MdErrorOutline,
} from 'react-icons/md';

const TIPOS = ['PROVEEDOR', 'CLIENTE'];

const emptyForm = { name: '', nit: '', email: '', phone: '', address: '', type: '' };

export default function Proveedores() {
  const { T } = useTheme();
  const { isMobile, mainPadding, grid } = useResponsive();

  const [providers, setProviders]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [tipoFilter, setTipoFilter] = useState('Todos');

  const [showForm, setShowForm]     = useState(false);
  const [editing, setEditing]       = useState(null);
  const [form, setForm]             = useState(emptyForm);
  const [formErr, setFormErr]       = useState(null);
  const [saving, setSaving]         = useState(false);

  const [deleting, setDeleting]     = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const companyId = getCompanyId();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getProviders(companyId);
      setProviders(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Error cargando proveedores:', e);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormErr(null);
    setShowForm(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({
      name:    p.name    || '',
      nit:     p.nit     || '',
      email:   p.email   || '',
      phone:   p.phone   || '',
      address: p.address || '',
      type:    p.type    || '',
    });
    setFormErr(null);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setFormErr('El nombre es obligatorio.'); return; }
    setSaving(true);
    setFormErr(null);
    try {
      const payload = { ...form, companyId: Number(companyId) };
      if (editing) {
        await updateProvider(editing.id, payload);
      } else {
        await createProvider(payload);
      }
      setShowForm(false);
      await load();
    } catch (e) {
      setFormErr(e.message || 'Error al guardar.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await deleteProvider(deleting.id);
      setDeleting(null);
      await load();
    } catch (e) {
      console.error('Error eliminando:', e);
    } finally {
      setDeleteLoading(false);
    }
  };

  const filtered = providers.filter(p => {
    const matchSearch = (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
                        (p.nit  || '').includes(search) ||
                        (p.email|| '').toLowerCase().includes(search.toLowerCase());
    const matchTipo   = tipoFilter === 'Todos' || p.type === tipoFilter;
    return matchSearch && matchTipo;
  });

  const totals = {
    total:      providers.length,
    proveedores: providers.filter(p => p.type === 'PROVEEDOR').length,
    clientes:    providers.filter(p => p.type === 'CLIENTE').length,
  };

  /* ── estilos compartidos ─────────────────────────────────────── */
  const inp = {
    padding: '9px 12px', border: `1px solid ${T.border}`,
    borderRadius: T.radiusSm, fontSize: 14,
    background: T.white, color: T.text,
    width: '100%', boxSizing: 'border-box',
  };

  const tipoBadge = (type) => ({
    PROVEEDOR: { bg: '#DBEAFE', color: '#1D4ED8', label: 'Proveedor' },
    CLIENTE:   { bg: '#DCFCE7', color: '#15803D', label: 'Cliente'   },
  }[type] || { bg: T.surface, color: T.sub, label: type || '—' });

  return (
    <div style={{ background: T.bg, minHeight: '100vh', transition: 'background 0.2s', ...mainPadding }}>
      <Sidebar />
      <main style={{ maxWidth: 1000, margin: '0 auto', padding: isMobile ? '16px 12px' : 32 }}>

        {/* ── Encabezado ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: isMobile ? 16 : 24 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: isMobile ? 20 : 24, fontWeight: 800, color: T.text }}>Proveedores</h1>
            <p style={{ margin: '4px 0 0', color: T.sub, fontSize: 14 }}>Gestiona tus proveedores y clientes</p>
          </div>
          <button
            onClick={openAdd}
            style={{
              padding: isMobile ? '8px 14px' : '10px 20px',
              border: 'none', borderRadius: T.radiusSm,
              background: T.accent, color: '#fff',
              fontWeight: 700, fontSize: 14, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
            }}
          >
            + {!isMobile && 'Nuevo'}
          </button>
        </div>

        {/* ── KPIs ── */}
        <div style={{ display: 'grid', ...grid(3, 3), gap: isMobile ? 10 : 16, marginBottom: isMobile ? 16 : 24 }}>
          {[
            { label: 'Total',       value: totals.total,       Icon: MdBusiness,      bg: T.accentLt, color: T.accent },
            { label: 'Proveedores', value: totals.proveedores, Icon: MdLocalShipping, bg: '#DBEAFE',  color: '#1D4ED8' },
            { label: 'Clientes',    value: totals.clientes,    Icon: MdPeople,        bg: '#DCFCE7',  color: '#15803D' },
          ].map(({ label, value, Icon, bg, color }) => (
            <div key={label} style={{ background: T.white, borderRadius: T.radius, padding: isMobile ? '12px' : '16px 20px', boxShadow: T.shadow, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: isMobile ? 36 : 40, height: isMobile ? 36 : 40, borderRadius: T.radiusSm, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color }}>
                <Icon size={isMobile ? 20 : 22} />
              </div>
              <div>
                <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: T.text }}>{value}</div>
                <div style={{ fontSize: 12, color: T.sub }}>{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Filtros ── */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, NIT o email..."
            style={{ ...inp, flex: '1 1 180px', minWidth: 0 }}
          />
          <select
            value={tipoFilter}
            onChange={e => setTipoFilter(e.target.value)}
            style={{ ...inp, flex: isMobile ? '1 1 100%' : '0 0 auto', width: 'auto', cursor: 'pointer' }}
          >
            <option value="Todos">Todos los tipos</option>
            <option value="PROVEEDOR">Proveedores</option>
            <option value="CLIENTE">Clientes</option>
          </select>
        </div>

        {/* ── Lista ── */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: T.sub }}>Cargando proveedores...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: T.sub }}>
            <MdBusiness size={52} style={{ marginBottom: 12, color: T.muted }} />
            <div>{search || tipoFilter !== 'Todos' ? 'No hay resultados para la búsqueda.' : 'Aún no hay proveedores. Crea el primero.'}</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(p => {
              const badge = tipoBadge(p.type);
              return (
                <div key={p.id} style={{ background: T.white, borderRadius: T.radius, padding: isMobile ? 12 : '14px 20px', boxShadow: T.shadow }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {/* Avatar */}
                    <div style={{
                      width: isMobile ? 38 : 44, height: isMobile ? 38 : 44,
                      borderRadius: '50%', flexShrink: 0,
                      background: `linear-gradient(135deg, ${T.accent}, ${T.purple})`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontWeight: 800, fontSize: isMobile ? 14 : 16,
                    }}>
                      {p.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 }}>
                        <span style={{ fontWeight: 700, fontSize: isMobile ? 14 : 15, color: T.text }}>{p.name}</span>
                        {p.type && (
                          <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: badge.bg, color: badge.color }}>
                            {badge.label}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: T.sub, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                        {p.nit   && <span>NIT: {p.nit}</span>}
                        {p.email && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><MdEmail size={13} /> {p.email}</span>}
                        {p.phone && !isMobile && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><MdPhone size={13} /> {p.phone}</span>}
                      </div>
                    </div>

                    {/* Acciones */}
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button
                        onClick={() => openEdit(p)}
                        style={{ padding: isMobile ? '5px 8px' : '6px 14px', border: `1px solid ${T.accent}`, borderRadius: T.radiusSm, cursor: 'pointer', fontSize: 13, background: 'transparent', color: T.accent, display: 'flex', alignItems: 'center', gap: 4 }}
                      ><MdEdit size={15} />{!isMobile && ' Editar'}</button>
                      <button
                        onClick={() => setDeleting(p)}
                        style={{ padding: isMobile ? '5px 8px' : '6px 14px', border: `1px solid ${T.red}`, borderRadius: T.radiusSm, cursor: 'pointer', fontSize: 13, background: 'transparent', color: T.red, display: 'flex', alignItems: 'center', gap: 4 }}
                      ><MdDelete size={15} />{!isMobile && ' Eliminar'}</button>
                    </div>
                  </div>

                  {/* Dirección (solo desktop) */}
                  {!isMobile && p.address && (
                    <div style={{ marginTop: 8, paddingLeft: 56, fontSize: 12, color: T.muted, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MdLocationOn size={14} /> {p.address}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ══ Modal: Crear / Editar ══════════════════════════════════ */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editing ? 'Editar Proveedor' : 'Nuevo Proveedor'}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Nombre (obligatorio) */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: T.text, display: 'block', marginBottom: 5 }}>
              Nombre <span style={{ color: T.red }}>*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Nombre del proveedor o cliente"
              style={{ ...inp, borderColor: formErr && !form.name.trim() ? T.red : T.border }}
              autoFocus
            />
          </div>

          {/* Tipo */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: T.sub, display: 'block', marginBottom: 5 }}>
              Tipo <span style={{ fontSize: 11, color: T.muted }}>(opcional)</span>
            </label>
            <select
              value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              style={{ ...inp, cursor: 'pointer' }}
            >
              <option value="">Sin clasificar</option>
              {TIPOS.map(t => <option key={t} value={t}>{t === 'PROVEEDOR' ? 'Proveedor' : 'Cliente'}</option>)}
            </select>
          </div>

          {/* NIT y Email en fila */}
          <div style={{ display: 'grid', ...grid(2, 1), gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: T.sub, display: 'block', marginBottom: 5 }}>NIT</label>
              <input type="text" value={form.nit} onChange={e => setForm(f => ({ ...f, nit: e.target.value }))} placeholder="123456789-0" style={inp} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: T.sub, display: 'block', marginBottom: 5 }}>Email</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="correo@empresa.com" style={inp} />
            </div>
          </div>

          {/* Teléfono y Dirección en fila */}
          <div style={{ display: 'grid', ...grid(2, 1), gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: T.sub, display: 'block', marginBottom: 5 }}>Teléfono</label>
              <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="300 000 0000" style={inp} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: T.sub, display: 'block', marginBottom: 5 }}>Dirección</label>
              <input type="text" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Calle 123 #45-67" style={inp} />
            </div>
          </div>

          {formErr && (
            <div style={{ padding: '8px 12px', background: T.redLt, color: T.red, borderRadius: T.radiusSm, fontSize: 13 }}>
              <MdErrorOutline style={{ verticalAlign: 'middle', marginRight: 6 }} /> {formErr}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
            <button
              onClick={() => setShowForm(false)}
              disabled={saving}
              style={{ padding: '9px 20px', border: `1px solid ${T.border}`, borderRadius: T.radiusSm, cursor: 'pointer', fontSize: 14, background: T.white, color: T.text }}
            >Cancelar</button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{ padding: '9px 20px', border: 'none', borderRadius: T.radiusSm, cursor: saving ? 'not-allowed' : 'pointer', fontSize: 14, background: T.accent, color: '#fff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              {saving ? 'Guardando...' : editing
                ? <><MdSave size={16} /> Guardar cambios</>
                : <><MdAdd size={16} /> Crear proveedor</>}
            </button>
          </div>
        </div>
      </Modal>

      {/* ══ Modal: Confirmar eliminación ══════════════════════════ */}
      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Eliminar Proveedor">
        {deleting && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ marginBottom: 10, color: T.red }}><MdDelete size={52} /></div>
              <p style={{ fontSize: 15, color: T.text, marginBottom: 6 }}>
                ¿Eliminar a <strong>{deleting.name}</strong>?
              </p>
              <p style={{ fontSize: 13, color: T.sub }}>Esta acción no se puede deshacer.</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
              <button
                onClick={() => setDeleting(null)}
                disabled={deleteLoading}
                style={{ padding: '9px 24px', border: `1px solid ${T.border}`, borderRadius: T.radiusSm, cursor: 'pointer', fontSize: 14, background: T.white, color: T.text }}
              >Cancelar</button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                style={{ padding: '9px 24px', border: 'none', borderRadius: T.radiusSm, cursor: 'pointer', fontSize: 14, background: T.red, color: '#fff', fontWeight: 700 }}
              >{deleteLoading ? 'Eliminando...' : 'Confirmar'}</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
