import { useTheme } from '../../utils/theme/ThemeContext.jsx';

export default function Badge({ status }) {
  const { T } = useTheme();
  const styles = {
    confirmada:   { bg: T.greenLt,  color: T.greenText },
    contabilizada:{ bg: T.greenLt,  color: T.greenText },
    pendiente:    { bg: T.orangeLt, color: T.orange    },
    error:        { bg: T.redLt,    color: T.redText   },
  };
  const s = styles[status?.toLowerCase()] || styles.pendiente;
  return (
    <span style={{ padding:'3px 10px', borderRadius:20, fontSize:12, fontWeight:600, background:s.bg, color:s.color }}>
      {status}
    </span>
  );
}
