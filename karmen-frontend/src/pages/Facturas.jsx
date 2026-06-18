import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  MdVisibility, MdEdit, MdMenuBook, MdDelete, MdAdd, MdCheck, MdClose, MdDownload,
  MdReceiptLong, MdTrendingUp, MdTrendingDown, MdSave, MdListAlt, MdHistory,
  MdNotes, MdPerson, MdCalendarToday, MdLock, MdMoreVert,
} from 'react-icons/md';
import { useTheme } from '../utils/theme/ThemeContext.jsx';
import { useResponsive } from '../utils/useResponsive.js';
import Sidebar from '../components/Sidebar/Sidebar.jsx';
import KPICard from '../components/Cards/KPICard.jsx';
import Badge from '../components/Badge/Badge.jsx';
import Modal from '../components/Modal/Modal.jsx';
import Pagination from '../components/Pagination/Pagination.jsx';
import { useInvoices } from '../hooks/useInvoices.js';
import { getInvoiceHistory, getInvoiceImageUrl } from '../api/invoices.js';
import { formatCurrency } from '../utils/format.js';

const PAGE_SIZE = 10;

const EVENT_LABEL = {
  TODOS:           'Todos',
  CREACION:        'Creación',
  EDICION:         'Edición',
  CONTABILIZACION: 'Contabilización',
  ELIMINACION:     'Eliminación',
  EXPORTACION:     'Exportación',
};

const EVENT_CONFIG = {
  CREACION:        { icon: <MdAdd />,      bg: '#DCFCE7', color: '#16A34A' },
  EDICION:         { icon: <MdEdit />,     bg: '#EFF6FF', color: '#2563EB' },
  CONTABILIZACION: { icon: <MdCheck />,    bg: '#F3E8FF', color: '#7C3AED' },
  ELIMINACION:     { icon: <MdClose />,    bg: '#FEE2E2', color: '#DC2626' },
  EXPORTACION:     { icon: <MdDownload />, bg: '#FEF9C3', color: '#CA8A04' },
  DEFAULT:         { icon: '●', bg: '#F3F4F6', color: '#6B7280' },
};

function KebabMenu({ invoice, onView, onEdit, onAccountant, onDelete, T }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, right: 0 });
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  const toggle = (e) => {
    e.stopPropagation();
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
    }
    setOpen(o => !o);
  };

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (!menuRef.current?.contains(e.target) && !btnRef.current?.contains(e.target)) {
        setOpen(false);
      }
    };
    const onEsc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  const act = (fn) => { setOpen(false); fn(); };

  const item = (color, hoverBg) => ({
    base: {
      display: 'flex', alignItems: 'center', gap: 9,
      width: '100%', padding: '9px 14px', border: 'none',
      background: 'none', cursor: 'pointer', fontSize: 13,
      color, textAlign: 'left', transition: 'background 0.12s',
    },
    over:  { background: hoverBg },
    leave: { background: 'none' },
  });

  const normal   = item(T.text,    T.surface);
  const accent   = item(T.accent,  T.accentLt);
  const purple   = item('#7C3AED', '#F3E8FF');
  const danger   = item(T.red,     T.redLt);

  return (
    <div style={{ flexShrink: 0 }}>
      <button
        ref={btnRef}
        onClick={toggle}
        aria-label="Acciones de factura"
        style={{
          width: 32, height: 32,
          border: `1px solid ${open ? T.accent : T.border}`,
          borderRadius: T.radiusSm,
          background: open ? T.accentLt : 'transparent',
          cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          color: open ? T.accent : T.sub,
          transition: 'all 0.15s',
        }}
      >
        <MdMoreVert size={18} />
      </button>

      {open && createPortal(
        <div
          ref={menuRef}
          role="menu"
          style={{
            position: 'fixed', top: pos.top, right: pos.right,
            background: T.white, border: `1px solid ${T.border}`,
            borderRadius: T.radius, boxShadow: '0 8px 28px rgba(0,0,0,0.13)',
            zIndex: 9999, minWidth: 188, overflow: 'hidden', padding: '4px 0',
          }}
        >
          <button
            role="menuitem"
            style={normal.base}
            onMouseEnter={e => Object.assign(e.currentTarget.style, normal.over)}
            onMouseLeave={e => Object.assign(e.currentTarget.style, normal.leave)}
            onClick={() => act(onView)}
          >
            <MdVisibility size={16} /> Ver detalle
          </button>

          <button
            role="menuitem"
            style={accent.base}
            onMouseEnter={e => Object.assign(e.currentTarget.style, accent.over)}
            onMouseLeave={e => Object.assign(e.currentTarget.style, accent.leave)}
            onClick={() => act(onEdit)}
          >
            <MdEdit size={16} /> Editar
          </button>

          {invoice.status === 'PENDIENTE' && (
            <button
              role="menuitem"
              style={purple.base}
              onMouseEnter={e => Object.assign(e.currentTarget.style, purple.over)}
              onMouseLeave={e => Object.assign(e.currentTarget.style, purple.leave)}
              onClick={() => act(onAccountant)}
            >
              <MdMenuBook size={16} /> Contabilizar
            </button>
          )}

          <div style={{ height: 1, background: T.border, margin: '4px 0' }} />

          <button
            role="menuitem"
            style={danger.base}
            onMouseEnter={e => Object.assign(e.currentTarget.style, danger.over)}
            onMouseLeave={e => Object.assign(e.currentTarget.style, danger.leave)}
            onClick={() => act(onDelete)}
          >
            <MdDelete size={16} /> Eliminar
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}

function ImageViewer({ url, onClose }) {
  const { T } = useTheme();
  const [pos, setPos]       = useState({ x: 0, y: 0 });
  const [scale, setScale]   = useState(1);
  const [imgPan, setImgPan] = useState({ x: 0, y: 0 });
  const [grabbing, setGrabbing] = useState(false);
  const containerRef = useRef(null);
  const modalDrag = useRef({ active: false, sx: 0, sy: 0, px: 0, py: 0 });
  const imgDrag   = useRef({ active: false, sx: 0, sy: 0, ox: 0, oy: 0 });
  const didDrag   = useRef(false);
  const isPdf = /\.pdf(\?|$)/i.test(url);

  // Zoom con rueda (non-passive para poder llamar preventDefault)
  useEffect(() => {
    const el = containerRef.current;
    if (!el || isPdf) return;
    const handler = (e) => {
      e.preventDefault();
      setScale(s => Math.min(6, Math.max(0.2, s * (e.deltaY > 0 ? 0.9 : 1.1))));
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, [isPdf]);

  // Eventos globales de mouse para drag del modal e imagen
  useEffect(() => {
    const move = (e) => {
      if (modalDrag.current.active) {
        didDrag.current = true;
        setPos({ x: modalDrag.current.px + e.clientX - modalDrag.current.sx, y: modalDrag.current.py + e.clientY - modalDrag.current.sy });
      }
      if (imgDrag.current.active) {
        didDrag.current = true;
        setImgPan({ x: imgDrag.current.ox + e.clientX - imgDrag.current.sx, y: imgDrag.current.oy + e.clientY - imgDrag.current.sy });
      }
    };
    const up = () => {
      modalDrag.current.active = false;
      imgDrag.current.active   = false;
      setGrabbing(false);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
  }, []);

  const startModalDrag = (e) => {
    e.preventDefault();
    didDrag.current = false;
    modalDrag.current = { active: true, sx: e.clientX, sy: e.clientY, px: pos.x, py: pos.y };
    setGrabbing(true);
  };

  const startImgPan = (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    didDrag.current = false;
    imgDrag.current = { active: true, sx: e.clientX, sy: e.clientY, ox: imgPan.x, oy: imgPan.y };
    setGrabbing(true);
  };

  // Cerrar solo si fue un click limpio, no el fin de un drag
  const handleBackdrop = () => {
    if (!didDrag.current) onClose();
    didDrag.current = false;
  };

  const btnStyle = { width: 30, height: 30, border: `1px solid ${T.border}`, borderRadius: T.radiusSm, background: T.surface, cursor: 'pointer', fontSize: 17, color: T.text, display: 'flex', alignItems: 'center', justifyContent: 'center' };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={handleBackdrop}
    >
      <div
        style={{ position: 'fixed', left: `calc(50% + ${pos.x}px)`, top: `calc(50% + ${pos.y}px)`, transform: 'translate(-50%,-50%)', background: T.white, borderRadius: T.radius, boxShadow: '0 24px 64px rgba(0,0,0,0.5)', width: '88vw', maxWidth: 920, display: 'flex', flexDirection: 'column', maxHeight: '92vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Barra de título — handle de arrastre del modal */}
        <div
          onMouseDown={startModalDrag}
          style={{ padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: grabbing ? 'grabbing' : 'grab', borderBottom: `1px solid ${T.border}`, userSelect: 'none', flexShrink: 0, borderRadius: `${T.radius} ${T.radius} 0 0` }}
        >
          <span style={{ fontWeight: 700, fontSize: 15, color: T.text }}>Documento de Factura</span>
          {!isPdf && <span style={{ fontSize: 11, color: T.sub }}>Rueda: zoom · Arrastra: mover imagen</span>}
          <button
            onMouseDown={e => e.stopPropagation()}
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: T.sub, lineHeight: 1, padding: 0 }}
          >×</button>
        </div>

        {/* Contenido */}
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {isPdf ? (
            <iframe src={url} title="Factura PDF" style={{ width: '100%', height: '75vh', border: 'none', display: 'block' }} />
          ) : (
            <div
              ref={containerRef}
              onMouseDown={startImgPan}
              style={{ width: '100%', height: '75vh', overflow: 'hidden', cursor: grabbing ? 'grabbing' : 'grab', display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.surface, userSelect: 'none' }}
            >
              <img
                src={url}
                alt="Documento de factura"
                draggable={false}
                style={{ transform: `translate(${imgPan.x}px,${imgPan.y}px) scale(${scale})`, transformOrigin: 'center', maxWidth: '100%', maxHeight: '100%', transition: 'none', pointerEvents: 'none', display: 'block' }}
              />
            </div>
          )}
        </div>

        {/* Controles de zoom (solo imágenes) */}
        {!isPdf && (
          <div style={{ padding: '8px 16px', borderTop: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <button onClick={() => setScale(s => Math.min(6, s * 1.25))} style={btnStyle}>+</button>
            <button onClick={() => setScale(s => Math.max(0.2, s * 0.8))} style={btnStyle}>−</button>
            <span style={{ fontSize: 12, color: T.sub, minWidth: 40 }}>{Math.round(scale * 100)}%</span>
            <button
              onClick={() => { setScale(1); setImgPan({ x: 0, y: 0 }); }}
              style={{ padding: '4px 10px', border: `1px solid ${T.border}`, borderRadius: T.radiusSm, background: T.surface, cursor: 'pointer', fontSize: 12, color: T.text }}
            >Restablecer</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Facturas() {
  const { T } = useTheme();
  const { isMobile, mainPadding, grid } = useResponsive();
  const { invoices, loading, error, fetchAll, update, remove, contabilizar } = useInvoices();
  const [search, setSearch] = useState('');
  const [tipo, setTipo] = useState('Todos');
  const [estado, setEstado] = useState('Todos');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState(null);
  const [detailTab, setDetailTab] = useState('detalle');
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFilter, setHistoryFilter] = useState('TODOS');
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState(null);
  const [deletingInvoice, setDeletingInvoice] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [contabilizando, setContabilizando] = useState(null);
  const [contabilizarLoading, setContabilizarLoading] = useState(false);
  const [contabilizarError, setContabilizarError] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);

  const openDetail = (inv) => {
    setSelected(inv);
    setDetailTab('detalle');
    setHistory([]);
    setHistoryFilter('TODOS');
    setImageError(null);
    setImageUrl(null);
  };

  const handleViewImage = async (invoiceId) => {
    setImageLoading(true);
    setImageError(null);
    try {
      const data = await getInvoiceImageUrl(invoiceId);
      if (data?.url) {
        setImageUrl(data.url);
      } else {
        setImageError('Imagen no disponible para esta factura');
      }
    } catch {
      setImageError('No se pudo obtener la imagen');
    } finally {
      setImageLoading(false);
    }
  };

  const loadHistory = async (invoiceId) => {
    setHistoryLoading(true);
    try {
      const data = await getInvoiceHistory(invoiceId);
      setHistory(data);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const switchTab = (tab) => {
    setDetailTab(tab);
    if (tab === 'historial' && selected && history.length === 0 && !historyLoading) {
      loadHistory(selected.id);
    }
  };

  const openEdit = async (inv) => {
    try {
      const resp = await fetch(`/api/invoices/${inv.id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const freshInvoice = resp.ok ? await resp.json() : inv;
      setEditingInvoice(freshInvoice);
      setEditForm({
        invoiceNumber: freshInvoice.invoiceNumber || '',
        invoiceDate: freshInvoice.invoiceDate || '',
        subtotal: freshInvoice.subtotal ?? '',
        taxAmount: freshInvoice.taxAmount ?? '',
        total: freshInvoice.total ?? '',
        notes: freshInvoice.notes || '',
        taxId: freshInvoice.taxId || '',
        paymentMethod: freshInvoice.paymentMethod || '',
      });
    } catch {
      setEditingInvoice(inv);
      setEditForm({
        invoiceNumber: inv.invoiceNumber || '',
        invoiceDate: inv.invoiceDate || '',
        subtotal: inv.subtotal ?? '',
        taxAmount: inv.taxAmount ?? '',
        total: inv.total ?? '',
        notes: inv.notes || '',
        taxId: inv.taxId || '',
        paymentMethod: inv.paymentMethod || '',
      });
    }
    setEditError(null);
  };

  const handleEditSave = async () => {
    setEditLoading(true);
    setEditError(null);
    try {
      await update(editingInvoice.id, {
        invoiceNumber: editForm.invoiceNumber || null,
        invoiceDate: editForm.invoiceDate || null,
        subtotal: editForm.subtotal !== '' ? Number(editForm.subtotal) : null,
        taxAmount: editForm.taxAmount !== '' ? Number(editForm.taxAmount) : null,
        total: editForm.total !== '' ? Number(editForm.total) : null,
        notes: editForm.notes || null,
        rfc: editForm.taxId || null,
        paymentMethod: editForm.paymentMethod || null,
      });
      setEditingInvoice(null);
    } catch (e) {
      setEditError(e.message);
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await remove(deletingInvoice.id);
      setDeletingInvoice(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleContabilizar = async () => {
    setContabilizarLoading(true);
    setContabilizarError(null);
    try {
      await contabilizar(contabilizando.id);
      setContabilizando(null);
    } catch (e) {
      setContabilizarError(e.message);
    } finally {
      setContabilizarLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [fetchAll]);


  const filtered = invoices.filter(f =>
    (tipo === 'Todos' || (tipo === 'Ingresos' && f.type === 'INGRESO') || (tipo === 'Egresos' && f.type === 'EGRESO')) &&
    (estado === 'Todos' || f.status?.toUpperCase() === estado.toUpperCase() ||
      (estado === 'Procesadas' && (f.status === 'CONFIRMADA' || f.status === 'CONTABILIZADA'))) &&
    ((f.providerName || '').toLowerCase().includes(search.toLowerCase()) || (f.invoiceNumber || '').includes(search))
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const setFilter  = (setter) => (val) => { setter(val); setPage(0); };

  const totals = {
    count:    invoices.length,
    ingresos: invoices.filter(i => i.type === 'INGRESO').reduce((a, i) => a + (i.total || 0), 0),
    egresos:  invoices.filter(i => i.type === 'EGRESO').reduce((a, i) => a + (i.total || 0), 0),
  };

  return (
    <div style={{ background: T.bg, minHeight: '100vh', transition: 'background 0.2s', ...mainPadding }}>
      <Sidebar />
      <main style={{ maxWidth: 1000, margin: '0 auto', padding: isMobile ? '16px 12px' : 32 }}>

        {/* ── Encabezado ── */}
        <div style={{ marginBottom: isMobile ? 16 : 24 }}>
          <h1 style={{ margin: 0, fontSize: isMobile ? 20 : 24, fontWeight: 800, color: T.text }}>Facturas</h1>
          <p style={{ margin: '4px 0 0', color: T.sub, fontSize: 14 }}>Gestiona y consulta todas tus facturas</p>
        </div>

        {/* ── KPIs ── */}
        <div style={{ display: 'grid', ...grid(3, 1), gap: isMobile ? 10 : 16, marginBottom: isMobile ? 16 : 24 }}>
          <KPICard title="Total Facturas"  value={String(totals.count)}           icon={<MdReceiptLong />} iconBg={T.accentLt} />
          <KPICard title="Total Ingresos"  value={formatCurrency(totals.ingresos)} subColor={T.greenText} icon={<MdTrendingUp />} iconBg={T.greenLt} />
          <KPICard title="Total Egresos"   value={formatCurrency(totals.egresos)}  subColor={T.redText}   icon={<MdTrendingDown />} iconBg={T.redLt} />
        </div>

        {/* ── Filtros ── */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            placeholder="Buscar factura..."
            style={{ flex: '1 1 180px', minWidth: 0, padding: '9px 14px', border: `1px solid ${T.border}`, borderRadius: T.radiusSm, fontSize: 14, background: T.white, color: T.text }}
          />
          {[['tipo', tipo, setTipo, ['Todos', 'Ingresos', 'Egresos']], ['estado', estado, setEstado, ['Todos', 'Procesadas', 'Pendientes']]].map(([k, val, setter, opts]) => (
            <select key={k} value={val} onChange={e => setFilter(setter)(e.target.value)}
              style={{ flex: isMobile ? '1 1 calc(50% - 5px)' : '0 0 auto', padding: '9px 10px', border: `1px solid ${T.border}`, borderRadius: T.radiusSm, fontSize: 14, background: T.white, color: T.text, cursor: 'pointer' }}>
              {opts.map(o => <option key={o}>{o}</option>)}
            </select>
          ))}
        </div>

        {/* ── Lista de facturas ── */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: T.sub }}>Cargando facturas...</div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: 48, color: T.red }}>{error}</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: T.sub }}>No hay facturas que mostrar</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {paginated.map(f => (
              <div key={f.id} style={{ background: T.white, borderRadius: T.radius, padding: isMobile ? '12px' : '14px 20px', boxShadow: T.shadow }}>

                {/* Fila principal */}
                <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 14 }}>
                  {/* Icono */}
                  <div style={{ width: isMobile ? 36 : 44, height: isMobile ? 36 : 44, borderRadius: T.radiusSm, background: f.type === 'INGRESO' ? T.greenLt : T.redLt, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isMobile ? 16 : 20, flexShrink: 0 }}>
                    {f.type === 'INGRESO' ? '↗' : '↘'}
                  </div>

                  {/* Info principal */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: isMobile ? 13 : 15, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: isMobile ? 140 : 'none' }}>
                        {f.providerName || 'Sin proveedor'}
                      </span>
                      <Badge status={f.status} />
                    </div>
                    <div style={{ fontSize: 12, color: T.sub, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {f.invoiceNumber}{f.invoiceDate ? ` · ${f.invoiceDate}` : ''}
                    </div>
                  </div>

                  {/* Total (siempre visible) */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    {!isMobile && (
                      <>
                        <div style={{ fontSize: 11, color: T.sub }}>Subtotal: {formatCurrency(f.subtotal)}</div>
                        <div style={{ fontSize: 11, color: T.sub }}>IVA: {formatCurrency(f.taxAmount)}</div>
                      </>
                    )}
                    <div style={{ fontWeight: 800, fontSize: isMobile ? 14 : 16, color: f.type === 'INGRESO' ? T.green : T.red }}>
                      {formatCurrency(f.total)}
                    </div>
                  </div>

                  {/* Menú kebab de acciones */}
                  <KebabMenu
                    invoice={f}
                    T={T}
                    onView={() => openDetail(f)}
                    onEdit={() => openEdit(f)}
                    onAccountant={() => { setContabilizando(f); setContabilizarError(null); }}
                    onDelete={() => setDeletingInvoice(f)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={filtered.length}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      </main>

      {/* ══ Modal: Editar ══════════════════════════════════════════ */}
      <Modal open={!!editingInvoice} onClose={() => setEditingInvoice(null)} title="Editar Factura">
        {editingInvoice && (
          <div>
            <div style={{ display: 'grid', ...grid(2, 1), gap: 14, marginBottom: 14 }}>
              {[
                ['Número de Factura', 'invoiceNumber', 'text'],
                ['Fecha de Emisión', 'invoiceDate', 'date'],
                ['NIT / Tax ID', 'taxId', 'text'],
                ['Medio de Pago', 'paymentMethod', 'text'],
                ['Subtotal', 'subtotal', 'number'],
                ['IVA', 'taxAmount', 'number'],
                ['Total', 'total', 'number'],
              ].map(([label, field, type]) => (
                <div key={field} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: T.sub }}>{label}</label>
                  <input
                    type={type}
                    value={editForm[field]}
                    onChange={e => setEditForm(prev => ({ ...prev, [field]: e.target.value }))}
                    style={{ padding: '8px 12px', border: `1px solid ${T.border}`, borderRadius: T.radiusSm, fontSize: 14, background: T.white, color: T.text, width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
              ))}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: T.sub }}>Proveedor / Cliente</label>
                <input type="text" value={editingInvoice.providerName || ''} disabled
                  style={{ padding: '8px 12px', border: `1px solid ${T.border}`, borderRadius: T.radiusSm, fontSize: 14, background: T.surface, color: T.sub, cursor: 'not-allowed', width: '100%', boxSizing: 'border-box' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: T.sub }}>Notas</label>
              <textarea rows={3} value={editForm.notes}
                onChange={e => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                style={{ padding: '8px 12px', border: `1px solid ${T.border}`, borderRadius: T.radiusSm, fontSize: 14, background: T.white, color: T.text, resize: 'vertical', width: '100%', boxSizing: 'border-box' }}
              />
            </div>
            {editError && <div style={{ color: T.red, fontSize: 13, marginBottom: 12 }}>{editError}</div>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
              <button onClick={() => setEditingInvoice(null)} disabled={editLoading}
                style={{ padding: '9px 20px', border: `1px solid ${T.border}`, borderRadius: T.radiusSm, cursor: 'pointer', fontSize: 14, background: T.white, color: T.text }}>
                Cancelar
              </button>
              <button onClick={handleEditSave} disabled={editLoading}
                style={{ padding: '9px 20px', border: 'none', borderRadius: T.radiusSm, cursor: 'pointer', fontSize: 14, background: T.accent, color: '#fff', fontWeight: 700 }}>
                {editLoading ? 'Guardando...' : <><MdSave style={{ verticalAlign: 'middle' }} /> Guardar</>}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ══ Modal: Eliminar ════════════════════════════════════════ */}
      <Modal open={!!deletingInvoice} onClose={() => setDeletingInvoice(null)} title="Eliminar Factura">
        {deletingInvoice && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ marginBottom: 10 }}><MdDelete size={40} /></div>
              <p style={{ fontSize: 15, color: T.text, marginBottom: 6 }}>
                ¿Eliminar la factura <strong>{deletingInvoice.invoiceNumber}</strong>?
              </p>
              <p style={{ fontSize: 13, color: T.sub }}>Esta acción es irreversible.</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
              <button onClick={() => setDeletingInvoice(null)} disabled={deleteLoading}
                style={{ padding: '9px 24px', border: `1px solid ${T.border}`, borderRadius: T.radiusSm, cursor: 'pointer', fontSize: 14, background: T.white, color: T.text }}>
                Cancelar
              </button>
              <button onClick={handleDelete} disabled={deleteLoading}
                style={{ padding: '9px 24px', border: 'none', borderRadius: T.radiusSm, cursor: 'pointer', fontSize: 14, background: T.red, color: '#fff', fontWeight: 700 }}>
                {deleteLoading ? 'Eliminando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ══ Modal: Contabilizar ════════════════════════════════════ */}
      <Modal open={!!contabilizando} onClose={() => { setContabilizando(null); setContabilizarError(null); }} title="Contabilizar Factura">
        {contabilizando && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ marginBottom: 10 }}><MdMenuBook size={40} /></div>
              <p style={{ fontSize: 15, color: T.text, marginBottom: 8 }}>
                ¿Contabilizar <strong>{contabilizando.invoiceNumber}</strong>?
              </p>
              <div style={{ background: T.surface, borderRadius: T.radiusSm, padding: '12px 16px', marginBottom: 8, textAlign: 'left' }}>
                {[['Proveedor', contabilizando.providerName || 'N/A'], ['Tipo', contabilizando.type], ['Total', formatCurrency(contabilizando.total)]].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 4 }}>
                    <span style={{ color: T.sub }}>{k}</span>
                    <span style={{ fontWeight: 600, color: T.text }}>{v}</span>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 12, color: T.sub }}>Se generarán los asientos contables automáticamente.</p>
            </div>
            {contabilizarError && <div style={{ color: T.red, fontSize: 13, marginBottom: 12, textAlign: 'center' }}>{contabilizarError}</div>}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
              <button onClick={() => { setContabilizando(null); setContabilizarError(null); }} disabled={contabilizarLoading}
                style={{ padding: '9px 24px', border: `1px solid ${T.border}`, borderRadius: T.radiusSm, cursor: 'pointer', fontSize: 14, background: T.white, color: T.text }}>
                Cancelar
              </button>
              <button onClick={handleContabilizar} disabled={contabilizarLoading}
                style={{ padding: '9px 24px', border: 'none', borderRadius: T.radiusSm, cursor: 'pointer', fontSize: 14, background: '#7C3AED', color: '#fff', fontWeight: 700 }}>
                {contabilizarLoading ? 'Procesando...' : <><MdMenuBook style={{ verticalAlign: 'middle' }} /> Confirmar</>}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ══ Modal: Detalle ══════════════════════════════════════════ */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Detalle de Factura">
        {selected && (
          <div>
            {/* Cabecera */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: T.radiusSm, background: selected.type === 'INGRESO' ? T.greenLt : T.redLt, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                {selected.type === 'INGRESO' ? '↗' : '↘'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selected.invoiceNumber}</div>
                <Badge status={selected.status} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                <button
                  onClick={() => handleViewImage(selected.id)}
                  disabled={imageLoading}
                  title="Ver imagen original de la factura"
                  style={{ width: 36, height: 36, borderRadius: T.radiusSm, border: `1px solid ${T.border}`, background: T.surface, cursor: imageLoading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.sub, flexShrink: 0 }}
                >
                  <MdVisibility size={20} style={{ opacity: imageLoading ? 0.4 : 1 }} />
                </button>
                <div style={{ fontWeight: 800, fontSize: isMobile ? 18 : 22, color: selected.type === 'INGRESO' ? T.green : T.red }}>
                  {formatCurrency(selected.total)}
                </div>
              </div>
            </div>
            {imageError && (
              <div style={{ marginBottom: 12, padding: '8px 12px', background: T.redLt, color: T.red, borderRadius: T.radiusSm, fontSize: 13 }}>
                {imageError}
              </div>
            )}

            {/* Pestañas */}
            <div style={{ display: 'flex', borderBottom: `1px solid ${T.border}`, marginBottom: 16 }}>
              {[['detalle', <><MdListAlt style={{ verticalAlign: 'middle' }} /> Detalle</>], ['historial', <><MdHistory style={{ verticalAlign: 'middle' }} /> Historial</>]].map(([tab, label]) => (
                <button key={tab} onClick={() => switchTab(tab)}
                  style={{
                    padding: isMobile ? '8px 14px' : '9px 20px', border: 'none', background: 'none', cursor: 'pointer',
                    fontSize: isMobile ? 12 : 13, fontWeight: detailTab === tab ? 700 : 500,
                    color: detailTab === tab ? T.accent : T.sub,
                    borderBottom: detailTab === tab ? `2px solid ${T.accent}` : '2px solid transparent',
                    marginBottom: -1, transition: 'color 0.15s',
                  }}
                >{label}</button>
              ))}
            </div>

            {/* Panel Detalle */}
            {detailTab === 'detalle' && (
              <div>
                <div style={{ display: 'grid', ...grid(2, 1), gap: 12, marginBottom: 14 }}>
                  {[
                    ['Proveedor/Cliente', selected.providerName || 'N/A'],
                    ['Fecha Emisión', selected.invoiceDate || 'N/A'],
                    ['Tipo', selected.type],
                    ['Estado', selected.status],
                    ...(selected.taxId ? [['NIT / Tax ID', selected.taxId]] : []),
                    ...(selected.paymentMethod ? [['Medio de Pago', selected.paymentMethod]] : []),
                  ].map(([k, v]) => (
                    <div key={k}>
                      <div style={{ fontSize: 12, color: T.sub, marginBottom: 3 }}>{k}</div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: T.text }}>{v}</div>
                    </div>
                  ))}
                </div>
                <div style={{ background: T.surface, borderRadius: T.radiusSm, padding: 14 }}>
                  {[['Subtotal', formatCurrency(selected.subtotal)], ['IVA', formatCurrency(selected.taxAmount)]].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
                      <span style={{ color: T.sub }}>{k}</span>
                      <span style={{ color: T.text }}>{v}</span>
                    </div>
                  ))}
                  <hr style={{ border: `1px solid ${T.border}`, margin: '8px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 16, color: selected.type === 'INGRESO' ? T.green : T.red }}>
                    <span>Total</span><span>{formatCurrency(selected.total)}</span>
                  </div>
                </div>
                {selected.notes && (
                  <div style={{ marginTop: 12, padding: '10px 14px', background: T.accentLt, borderRadius: T.radiusSm, fontSize: 13, color: T.accent }}>
                    <MdNotes style={{ verticalAlign: 'middle', marginRight: 4 }} />{selected.notes}
                  </div>
                )}
              </div>
            )}

            {/* Panel Historial */}
            {detailTab === 'historial' && (
              <div>
                <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
                  {['TODOS', 'CREACION', 'EDICION', 'CONTABILIZACION', 'ELIMINACION'].map(f => (
                    <button key={f} onClick={() => setHistoryFilter(f)}
                      style={{
                        padding: '5px 12px', border: 'none', borderRadius: 99, cursor: 'pointer',
                        fontSize: 11, fontWeight: 600,
                        background: historyFilter === f ? T.accent : T.surface,
                        color: historyFilter === f ? '#fff' : T.sub,
                      }}
                    >{EVENT_LABEL[f] || f}</button>
                  ))}
                </div>

                {historyLoading ? (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: T.sub, fontSize: 14 }}>Cargando historial...</div>
                ) : history.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: T.muted, fontSize: 14 }}>
                    <div style={{ marginBottom: 8 }}><MdHistory size={32} /></div>
                    No hay eventos registrados aún
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {history
                      .filter(e => historyFilter === 'TODOS' || e.action === historyFilter)
                      .map((e, i, arr) => {
                        const cfg = EVENT_CONFIG[e.action] || EVENT_CONFIG.DEFAULT;
                        const dt  = new Date(e.createdAt);
                        const fecha = dt.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
                        const hora  = dt.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
                        return (
                          <div key={e.id} style={{ display: 'flex', gap: 12, position: 'relative' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                              <div style={{ width: 32, height: 32, borderRadius: '50%', background: cfg.bg, color: cfg.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, zIndex: 1 }}>
                                {cfg.icon}
                              </div>
                              {i < arr.length - 1 && <div style={{ width: 2, flex: 1, background: T.border, minHeight: 20, margin: '4px 0' }} />}
                            </div>
                            <div style={{ flex: 1, paddingBottom: i < arr.length - 1 ? 14 : 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: cfg.color, marginBottom: 2 }}>{EVENT_LABEL[e.action] || e.action}</div>
                              <div style={{ fontSize: 12, color: T.sub, marginBottom: 2 }}>
                                <MdPerson style={{ verticalAlign: 'middle', marginRight: 4 }} />{e.userName}{e.userEmail && <span style={{ color: T.muted }}> · {e.userEmail}</span>}
                              </div>
                              <div style={{ fontSize: 11, color: T.muted }}><MdCalendarToday style={{ verticalAlign: 'middle', marginRight: 4 }} />{fecha} · {hora}</div>
                              {e.details && Object.keys(e.details).length > 0 && (
                                <div style={{ marginTop: 6, padding: '6px 10px', background: T.surface, borderRadius: T.radiusSm, fontSize: 11, color: T.sub }}>
                                  {Object.entries(e.details).map(([k, v]) => (
                                    <span key={k} style={{ marginRight: 10 }}><strong>{k}:</strong> {String(v)}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    }
                    {history.filter(e => historyFilter === 'TODOS' || e.action === historyFilter).length === 0 && (
                      <div style={{ textAlign: 'center', padding: '20px 0', color: T.muted, fontSize: 13 }}>
                        No hay eventos de este tipo
                      </div>
                    )}
                  </div>
                )}
                <div style={{ marginTop: 14, padding: '10px 14px', background: T.surface, borderRadius: T.radiusSm, fontSize: 12, color: T.muted }}>
                  <MdLock style={{ verticalAlign: 'middle', marginRight: 6 }} />El historial es de solo lectura
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
      {/* ══ Visor de imagen/PDF (draggable + zoom) ═══════════════ */}
      {imageUrl && <ImageViewer url={imageUrl} onClose={() => setImageUrl(null)} />}
    </div>
  );
}
