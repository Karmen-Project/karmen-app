import { T } from '../../utils/theme/index.js';
export default function Button({ children, variant='primary', onClick, disabled, style={}, type='button' }) {
  const base = { padding:'9px 18px', borderRadius:T.radiusSm, fontWeight:600, fontSize:14, cursor:'pointer', border:'none', transition:'opacity 0.15s', ...style };
  const variants = {
    primary: { background:T.text, color:'white' },
    outline: { background:'white', border:`1px solid ${T.border}`, color:T.text },
    accent:  { background:T.accent, color:'white' },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      style={{ ...base, ...(variants[variant]||variants.primary), opacity: disabled ? 0.6 : 1 }}>
      {children}
    </button>
  );
}
