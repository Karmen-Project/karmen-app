import { useTheme } from '../../utils/theme/ThemeContext.jsx';

export default function Modal({ open, onClose, title, children, wide }) {
  const { T } = useTheme();
  if (!open) return null;
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center' }}
      onClick={onClose}>
      <div style={{ background:T.white, borderRadius:T.radius, padding:28, maxWidth: wide ? 900 : 600, width:'90%', maxHeight:'90vh', overflowY:'auto' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <h2 style={{ margin:0, fontSize:18, fontWeight:700, color:T.text }}>{title}</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', color:T.sub }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
