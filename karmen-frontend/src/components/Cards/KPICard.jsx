import { useTheme } from '../../utils/theme/ThemeContext.jsx';

export default function KPICard({ title, value, sub, subColor, icon, iconBg }) {
  const { T } = useTheme();
  return (
    <div style={{ background:T.white, border:`1px solid ${T.border}`, borderRadius:T.radius, padding:'20px', boxShadow:T.shadow, position:'relative' }}>
      {icon && (
        <div style={{ position:'absolute', top:16, right:16, width:40, height:40, borderRadius:T.radiusSm, background:iconBg||T.accentLt, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>
          {icon}
        </div>
      )}
      <div style={{ fontSize:13, color:T.sub, marginBottom:6 }}>{title}</div>
      <div style={{ fontSize:28, fontWeight:800, color:T.text, marginBottom:4 }}>{value}</div>
      {sub && <div style={{ fontSize:12, color:subColor||T.sub }}>{sub}</div>}
    </div>
  );
}
