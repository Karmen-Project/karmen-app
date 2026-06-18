import { useTheme } from '../../utils/theme/ThemeContext.jsx';

export default function Pagination({ page, totalPages, totalItems, pageSize, onPageChange }) {
  const { T } = useTheme();

  if (totalPages <= 1) return null;

  const from = page * pageSize + 1;
  const to   = Math.min((page + 1) * pageSize, totalItems);

  const pages = buildPageList(page, totalPages);

  const btn = (label, target, disabled, active = false) => (
    <button
      key={label}
      onClick={() => !disabled && onPageChange(target)}
      disabled={disabled}
      style={{
        minWidth: 36, height: 36, padding: '0 10px',
        border: active ? 'none' : `1px solid ${T.border}`,
        borderRadius: T.radiusSm,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: 13, fontWeight: active ? 700 : 400,
        background: active ? T.accent : T.white,
        color: active ? '#fff' : disabled ? T.muted : T.text,
        transition: 'all 0.15s',
      }}
    >{label}</button>
  );

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 24 }}>
      <span style={{ fontSize: 13, color: T.sub }}>
        Mostrando {from}–{to} de {totalItems}
      </span>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        {btn('‹', page - 1, page === 0)}
        {pages.map((p, i) =>
          p === '…'
            ? <span key={`ellipsis-${i}`} style={{ fontSize: 13, color: T.muted, padding: '0 4px' }}>…</span>
            : btn(p + 1, p, false, p === page)
        )}
        {btn('›', page + 1, page === totalPages - 1)}
      </div>
    </div>
  );
}

function buildPageList(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i);
  if (current < 4) return [0, 1, 2, 3, 4, '…', total - 1];
  if (current > total - 5) return [0, '…', total - 5, total - 4, total - 3, total - 2, total - 1];
  return [0, '…', current - 1, current, current + 1, '…', total - 1];
}
