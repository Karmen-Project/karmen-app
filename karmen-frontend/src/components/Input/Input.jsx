import { T } from '../../utils/theme/index.js';
export default function Input({ label, value, onChange, type='text', placeholder, style={} }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6, ...style }}>
      {label && <label style={{ fontSize:13, fontWeight:500, color:T.text }}>{label}</label>}
      <input
        type={type} value={value} onChange={onChange} placeholder={placeholder}
        style={{ padding:'9px 12px', border:`1px solid ${T.border}`, borderRadius:T.radiusSm, fontSize:14, background:T.surface, outline:'none', color:T.text }}
      />
    </div>
  );
}
