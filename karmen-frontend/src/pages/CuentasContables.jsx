import { useState, useEffect } from 'react';
import { MdLightbulbOutline, MdEdit, MdBlock, MdCheck, MdDelete, MdSave, MdAdd } from 'react-icons/md';
import { useTheme } from '../utils/theme/ThemeContext.jsx';
import { useResponsive } from '../utils/useResponsive.js';
import Sidebar from '../components/Sidebar/Sidebar.jsx';
import Modal from '../components/Modal/Modal.jsx';
import { useAccounts } from '../hooks/useAccounts.js';

const PURPOSES = [
  { key: 'COBRAR',     label: 'Cuentas por cobrar',      hint: 'Débito principal — Facturas de ingreso',   color: '#2563EB' },
  { key: 'IVA_VENTAS', label: 'IVA en ventas',            hint: 'IVA generado — Facturas de ingreso',       color: '#7C3AED' },
  { key: 'INGRESOS',   label: 'Ingresos operacionales',   hint: 'Contrapartida crédito — Facturas ingreso', color: '#16A34A' },
  { key: 'GASTOS',     label: 'Gastos operacionales',     hint: 'Débito principal — Facturas de egreso',    color: '#D97706' },
  { key: 'IVA_COMPRAS',label: 'IVA en compras',           hint: 'IVA deducible — Facturas de egreso',       color: '#B45309' },
  { key: 'PAGAR',      label: 'Cuentas por pagar',        hint: 'Contrapartida crédito — Facturas egreso',  color: '#DC2626' },
];

const PURPOSE_MAP = Object.fromEntries(PURPOSES.map(p => [p.key, p]));

const TYPES = [
  { key: 'ACTIVO',     label: 'Activos',     color: '#16A34A', bg: '#DCFCE7' },
  { key: 'PASIVO',     label: 'Pasivos',     color: '#DC2626', bg: '#FEE2E2' },
  { key: 'PATRIMONIO', label: 'Patrimonio',  color: '#7C3AED', bg: '#EDE9FE' },
  { key: 'INGRESO',    label: 'Ingresos',    color: '#2563EB', bg: '#DBEAFE' },
  { key: 'GASTO',      label: 'Gastos',      color: '#D97706', bg: '#FEF3C7' },
  { key: 'COSTO',      label: 'Costos',      color: '#B45309', bg: '#FEF9C3' },
];

const TYPE_OPTIONS = TYPES.map(t => t.key);

const codeLevel = code => {
  if (code.length === 1) return 0;
  if (code.length === 2) return 1;
  if (code.length <= 4)  return 2;
  return 3;
};

const INDENT = [0, 16, 32, 48];

const emptyForm = { code: '', name: '', type: 'ACTIVO', purpose: '' };

export default function CuentasContables() {
  const { T } = useTheme();
  const { isMobile, mainPadding, grid } = useResponsive();
  const { accounts, loading, error, fetchAll, create, update, toggle, remove } = useAccounts();

  const [search,       setSearch]       = useState('');
  const [collapsed,    setCollapsed]    = useState({});
  const [showAdd,      setShowAdd]      = useState(false);
  const [editAcc,      setEditAcc]      = useState(null);
  const [toggleTarget, setToggleTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteErr,    setDeleteErr]    = useState(null);
  const [deleteLoading,setDeleteLoading]= useState(false);
  const [form,         setForm]         = useState(emptyForm);
  const [formErr,      setFormErr]      = useState(null);
  const [formLoading,  setFormLoading]  = useState(false);
  const [toggleErr,    setToggleErr]    = useState(null);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const collapseType = key =>
    setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));

  const openAdd = () => { setForm(emptyForm); setFormErr(null); setShowAdd(true); };
  const openEdit = acc => {
    setEditAcc(acc);
    setForm({ code: acc.code, name: acc.name, type: acc.type, purpose: acc.purpose || '' });
    setFormErr(null);
  };

  const handleSave = async () => {
    if (!form.code.trim() || !form.name.trim()) {
      setFormErr('Código y nombre son obligatorios.');
      return;
    }
    setFormLoading(true);
    setFormErr(null);
    try {
      if (editAcc) {
        await update(editAcc.id, form);
        setEditAcc(null);
      } else {
        await create(form);
        setShowAdd(false);
      }
    } catch (e) { setFormErr(e.message); }
    finally { setFormLoading(false); }
  };

  const handleToggle = async () => {
    setToggleErr(null);
    try {
      await toggle(toggleTarget.id);
      setToggleTarget(null);
    } catch (e) { setToggleErr(e.message); }
  };

  const handleDelete = async () => {
    setDeleteErr(null);
    setDeleteLoading(true);
    try {
      await remove(deleteTarget.id);
      setDeleteTarget(null);
    } catch (e) { setDeleteErr(e.message); }
    finally { setDeleteLoading(false); }
  };

  const filtered = search
    ? accounts.filter(a =>
        a.code.includes(search) ||
        a.name.toLowerCase().includes(search.toLowerCase()))
    : accounts;

  const typeInfo = key => TYPES.find(t => t.key === key) || { color: T.text, bg: T.surface, label: key };

  const inputStyle = {
    padding: '9px 12px', border: `1px solid ${T.border}`,
    borderRadius: T.radiusSm, fontSize: 14,
    background: T.white, color: T.text, width: '100%', boxSizing: 'border-box',
  };

  return (
    <div style={{ background: T.bg, minHeight: '100vh', transition: 'background 0.2s', ...mainPadding }}>
      <Sidebar />
      <main style={{ maxWidth: 1000, margin: '0 auto', padding: isMobile ? 16 : 32 }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: T.text }}>Plan de Cuentas</h1>
            <p style={{ margin: '4px 0 0', color: T.sub, fontSize: 14 }}>
              Catálogo PUC simplificado — {accounts.length} cuentas registradas
            </p>
          </div>
          <button
            onClick={openAdd}
            style={{ padding: '9px 18px', border: 'none', borderRadius: T.radiusSm, background: T.accent, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
          >
            + Nueva Cuenta
          </button>
        </div>

        {/* Sugerencias rápidas */}
        <div style={{ display: 'grid', ...grid(2, 1), gap: 12, marginBottom: 20 }}>
          {[
            { invoiceType: 'INGRESO', label: 'Facturas de Ingreso', typeKey: 'INGRESO' },
            { invoiceType: 'EGRESO',  label: 'Facturas de Gasto',   typeKey: 'GASTO'   },
          ].map(({ label, typeKey }) => {
            const ti = typeInfo(typeKey);
            const suggestions = accounts.filter(a => a.type === typeKey && a.active && a.code.length === 4);
            return (
              <div key={typeKey} style={{ background: T.white, borderRadius: T.radius, padding: '14px 18px', boxShadow: T.shadow, borderLeft: `4px solid ${ti.color}` }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.sub, marginBottom: 6 }}><MdLightbulbOutline style={{ verticalAlign: 'middle', marginRight: 4 }} />Cuentas sugeridas — {label}</div>
                {suggestions.length === 0 ? (
                  <div style={{ fontSize: 13, color: T.sub }}>Sin cuentas activas de tipo {ti.label}</div>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {suggestions.slice(0, 4).map(a => (
                      <span key={a.id} style={{ padding: '3px 8px', borderRadius: 99, fontSize: 12, fontWeight: 600, background: ti.bg, color: ti.color }}>
                        {a.code} — {a.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Buscador */}
        <div style={{ marginBottom: 20 }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por código o nombre..."
            style={{ ...inputStyle, maxWidth: 360 }}
          />
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: T.sub }}>Cargando cuentas...</div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: 48, color: T.red }}>{error}</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {TYPES.map(({ key, label, color, bg }) => {
              const group = filtered.filter(a => a.type === key);
              if (group.length === 0) return null;
              const isCollapsed = collapsed[key];
              return (
                <div key={key} style={{ background: T.white, borderRadius: T.radius, boxShadow: T.shadow, overflow: 'hidden' }}>
                  {/* Encabezado de tipo */}
                  <button
                    onClick={() => collapseType(key)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 20px', border: 'none', background: bg,
                      cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    <span style={{ width: 28, height: 28, borderRadius: 6, background: color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                      {key.charAt(0)}
                    </span>
                    <span style={{ flex: 1, fontWeight: 700, fontSize: 14, color }}>{label}</span>
                    <span style={{ fontSize: 12, color, opacity: 0.7 }}>{group.length} cuentas</span>
                    <span style={{ fontSize: 12, color, transform: isCollapsed ? 'rotate(-90deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
                  </button>

                  {/* Filas de cuentas */}
                  {!isCollapsed && (
                    <div>
                      {/* Cabecera + filas con scroll horizontal en mobile */}
                      <div style={{ overflowX: 'auto' }}>
                        <div style={{ minWidth: isMobile ? 320 : 'auto' }}>
                          {/* Cabecera */}
                          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '70px 1fr 80px' : '90px 1fr 160px 100px 80px', gap: 8, padding: isMobile ? '8px 12px' : '8px 20px', borderBottom: `1px solid ${T.border}`, background: T.surface }}>
                            {(isMobile ? ['Código', 'Nombre', ''] : ['Código', 'Nombre', 'Rol contable', 'Estado', '']).map(h => (
                              <div key={h} style={{ fontSize: 11, fontWeight: 600, color: T.sub, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</div>
                            ))}
                          </div>
                          {/* Filas */}
                          {group.map(acc => {
                            const level = codeLevel(acc.code);
                            const paddingLeft = 20 + INDENT[level];
                            const purposeInfo = acc.purpose ? PURPOSE_MAP[acc.purpose] : null;
                            return (
                              <div key={acc.id} style={{
                                display: 'grid', gridTemplateColumns: isMobile ? '70px 1fr 80px' : '90px 1fr 160px 100px 80px',
                                gap: 8, padding: isMobile ? '10px 12px' : '10px 20px', paddingLeft,
                                borderBottom: `1px solid ${T.border}`,
                                background: acc.active ? 'transparent' : `${T.surface}99`,
                                opacity: acc.active ? 1 : 0.6,
                                alignItems: 'center',
                              }}>
                                <div>
                                  <span style={{ padding: '2px 7px', borderRadius: 99, fontSize: 12, fontWeight: 700, background: bg, color, fontFamily: 'monospace' }}>
                                    {acc.code}
                                  </span>
                                </div>
                                <div style={{ fontSize: 13.5, color: T.text, fontWeight: level <= 1 ? 600 : 400 }}>
                                  {level === 0 && <span style={{ marginRight: 6, color }}>■</span>}
                                  {level === 1 && <span style={{ marginRight: 6, color, opacity: 0.6 }}>▸</span>}
                                  {acc.name}
                                  {acc.custom && !isMobile && <span style={{ marginLeft: 6, fontSize: 10, padding: '1px 5px', borderRadius: 99, background: T.accentLt, color: T.accent, fontWeight: 600 }}>Personalizada</span>}
                                </div>
                                {!isMobile && (
                                  <div>
                                    {purposeInfo
                                      ? <span title={purposeInfo.hint} style={{ padding: '3px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: `${purposeInfo.color}18`, color: purposeInfo.color, cursor: 'help' }}>{purposeInfo.label}</span>
                                      : <span style={{ fontSize: 12, color: T.muted }}>—</span>
                                    }
                                  </div>
                                )}
                                {!isMobile && (
                                  <div>
                                    <span style={{ padding: '3px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: acc.active ? '#DCFCE7' : '#F3F4F6', color: acc.active ? '#16A34A' : T.sub }}>
                                      {acc.active ? 'Activa' : 'Inactiva'}
                                    </span>
                                  </div>
                                )}
                                <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                                  <button onClick={() => openEdit(acc)} title="Editar" style={{ padding: '4px 8px', border: `1px solid ${T.border}`, borderRadius: 6, cursor: 'pointer', fontSize: 12, background: T.white, color: T.accent }}><MdEdit style={{ verticalAlign: 'middle' }} /></button>
                                  <button onClick={() => { setToggleTarget(acc); setToggleErr(null); }} title={acc.active ? 'Desactivar' : 'Activar'} style={{ padding: '4px 8px', border: `1px solid ${acc.active ? T.red : T.green}`, borderRadius: 6, cursor: 'pointer', fontSize: 12, background: T.white, color: acc.active ? T.red : T.green }}>{acc.active ? <MdBlock style={{ verticalAlign: 'middle' }} /> : <MdCheck style={{ verticalAlign: 'middle' }} />}</button>
                                  {!isMobile && <button onClick={() => { setDeleteTarget(acc); setDeleteErr(null); }} title="Eliminar" style={{ padding: '4px 8px', border: `1px solid ${T.red}`, borderRadius: 6, cursor: 'pointer', fontSize: 12, background: T.white, color: T.red }}><MdDelete style={{ verticalAlign: 'middle' }} /></button>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modal Agregar / Editar */}
      <Modal
        open={showAdd || !!editAcc}
        onClose={() => { setShowAdd(false); setEditAcc(null); }}
        title={editAcc ? 'Editar Cuenta' : 'Nueva Cuenta'}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', ...grid(2, 1), gap: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: T.sub }}>Código</label>
              <input
                value={form.code}
                onChange={e => setForm(p => ({ ...p, code: e.target.value }))}
                placeholder="ej. 5120"
                disabled={editAcc && !editAcc.custom}
                style={{ ...inputStyle, fontFamily: 'monospace', background: editAcc && !editAcc.custom ? T.surface : T.white, color: editAcc && !editAcc.custom ? T.sub : T.text }}
              />
              {editAcc && !editAcc.custom && (
                <span style={{ fontSize: 11, color: T.sub }}>Solo editable en cuentas personalizadas</span>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: T.sub }}>Tipo</label>
              <select
                value={form.type}
                onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                style={inputStyle}
              >
                {TYPE_OPTIONS.map(t => (
                  <option key={t} value={t}>{TYPES.find(x => x.key === t)?.label || t}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: T.sub }}>Nombre de la cuenta</label>
            <input
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="ej. Gastos de representación"
              style={inputStyle}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: T.sub }}>Rol contable</label>
            <select
              value={form.purpose}
              onChange={e => setForm(p => ({ ...p, purpose: e.target.value }))}
              style={inputStyle}
            >
              <option value="">— Sin rol específico —</option>
              {PURPOSES.map(p => (
                <option key={p.key} value={p.key}>{p.label} · {p.hint}</option>
              ))}
            </select>
            <span style={{ fontSize: 11, color: T.sub }}>
              Asignar un rol permite que las contabilizaciones usen esta cuenta automáticamente.
            </span>
          </div>
          {formErr && <div style={{ color: T.red, fontSize: 13 }}>{formErr}</div>}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button
              onClick={() => { setShowAdd(false); setEditAcc(null); }}
              disabled={formLoading}
              style={{ padding: '9px 20px', border: `1px solid ${T.border}`, borderRadius: T.radiusSm, cursor: 'pointer', fontSize: 14, background: T.white, color: T.text }}
            >Cancelar</button>
            <button
              onClick={handleSave}
              disabled={formLoading}
              style={{ padding: '9px 20px', border: 'none', borderRadius: T.radiusSm, cursor: 'pointer', fontSize: 14, background: T.accent, color: '#fff', fontWeight: 700 }}
            >{formLoading ? 'Guardando...' : editAcc ? <><MdSave style={{ verticalAlign: 'middle' }} /> Guardar cambios</> : <><MdAdd style={{ verticalAlign: 'middle' }} /> Agregar cuenta</>}</button>
          </div>
        </div>
      </Modal>

      {/* Modal Eliminar */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Eliminar cuenta"
      >
        {deleteTarget && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ marginBottom: 10 }}><MdDelete size={40} /></div>
              <p style={{ fontSize: 15, color: T.text, marginBottom: 6 }}>
                ¿Eliminar la cuenta <strong>{deleteTarget.code} — {deleteTarget.name}</strong>?
              </p>
              <p style={{ fontSize: 13, color: T.sub }}>
                Esta acción es permanente. No se puede eliminar si tiene asientos contables asociados.
              </p>
            </div>
            {deleteErr && (
              <div style={{ color: T.red, fontSize: 13, textAlign: 'center', marginBottom: 12, padding: '8px 12px', background: '#FEE2E2', borderRadius: T.radiusSm }}>
                {deleteErr}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleteLoading}
                style={{ padding: '9px 24px', border: `1px solid ${T.border}`, borderRadius: T.radiusSm, cursor: 'pointer', fontSize: 14, background: T.white, color: T.text }}
              >Cancelar</button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                style={{ padding: '9px 24px', border: 'none', borderRadius: T.radiusSm, cursor: deleteLoading ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 700, background: T.red, color: '#fff' }}
              >{deleteLoading ? 'Eliminando...' : <><MdDelete style={{ verticalAlign: 'middle' }} /> Confirmar eliminación</>}</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Activar / Desactivar */}
      <Modal
        open={!!toggleTarget}
        onClose={() => setToggleTarget(null)}
        title={toggleTarget?.active ? 'Desactivar cuenta' : 'Activar cuenta'}
      >
        {toggleTarget && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ marginBottom: 10 }}>{toggleTarget.active ? <MdBlock size={40} /> : <MdCheck size={40} />}</div>
              <p style={{ fontSize: 15, color: T.text, marginBottom: 6 }}>
                {toggleTarget.active
                  ? <>¿Desactivar la cuenta <strong>{toggleTarget.code} — {toggleTarget.name}</strong>?</>
                  : <>¿Activar la cuenta <strong>{toggleTarget.code} — {toggleTarget.name}</strong>?</>}
              </p>
              {toggleTarget.active && (
                <p style={{ fontSize: 13, color: T.sub }}>
                  No se puede desactivar si tiene asientos contables asociados.
                </p>
              )}
            </div>
            {toggleErr && <div style={{ color: T.red, fontSize: 13, textAlign: 'center', marginBottom: 12 }}>{toggleErr}</div>}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
              <button
                onClick={() => setToggleTarget(null)}
                style={{ padding: '9px 24px', border: `1px solid ${T.border}`, borderRadius: T.radiusSm, cursor: 'pointer', fontSize: 14, background: T.white, color: T.text }}
              >Cancelar</button>
              <button
                onClick={handleToggle}
                style={{ padding: '9px 24px', border: 'none', borderRadius: T.radiusSm, cursor: 'pointer', fontSize: 14, fontWeight: 700, background: toggleTarget.active ? T.red : T.green, color: '#fff' }}
              >{toggleTarget.active ? 'Desactivar' : 'Activar'}</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
