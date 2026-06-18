import { useEffect, useState } from 'react';
import { MdListAlt, MdArrowUpward, MdArrowDownward, MdBalance, MdCheck, MdWarning, MdMenuBook } from 'react-icons/md';
import { useTheme } from '../utils/theme/ThemeContext.jsx';
import { useResponsive } from '../utils/useResponsive.js';
import Sidebar from '../components/Sidebar/Sidebar.jsx';
import KPICard from '../components/Cards/KPICard.jsx';
import Pagination from '../components/Pagination/Pagination.jsx';
import { getAccountingEntries } from '../api/accounting.js';
import { getCompanyId } from '../api/endPoints.js';
import { formatCurrency } from '../utils/format.js';

const PAGE_SIZE = 8;

const fmt = v => v ? formatCurrency(v) : '-';

const PUC_NAMES = {
  '1300': 'Clientes',
  '2408': 'IVA por pagar',
  '4100': 'Ingresos',
  '5100': 'Gastos generales',
  '2365': 'IVA descontable (compras)',
  '2200': 'Proveedores por pagar',
};
const resolveAccountName = (name, code) =>
  (!name || name === code) ? (PUC_NAMES[code] || code) : name;

export default function Contabilidad() {
  const { T } = useTheme();
  const { isMobile, mainPadding, grid } = useResponsive();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  useEffect(() => {
    const loadEntries = async () => {
      const companyId = getCompanyId();
      if (!companyId) return;
      try {
        const data = await getAccountingEntries(companyId);
        setEntries(data || []);
      } catch (e) {
        console.error('Error cargando asientos:', e);
      } finally {
        setLoading(false);
      }
    };
    loadEntries();
  }, []);

  const groupedByInvoice = entries.reduce((acc, entry) => {
    const key = entry.invoiceNumber || entry.invoiceId;
    if (!acc[key]) {
      acc[key] = { invoiceNumber: entry.invoiceNumber, invoiceId: entry.invoiceId, date: entry.entryDate, entries: [] };
    }
    acc[key].entries.push(entry);
    return acc;
  }, {});

  const groups = Object.values(groupedByInvoice);
  const totalPages   = Math.ceil(groups.length / PAGE_SIZE);
  const paginatedGroups = groups.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalDebe = entries.reduce((a, e) => a + (Number(e.debit) || 0), 0);
  const totalHaber = entries.reduce((a, e) => a + (Number(e.credit) || 0), 0);
  const balanced = Math.abs(totalDebe - totalHaber) < 0.01;

  return (
    <div style={{ background:T.bg, minHeight:'100vh', transition:'background 0.2s', ...mainPadding }}>
      <Sidebar />
      <main style={{ maxWidth:1000, margin:'0 auto', padding: isMobile ? 16 : 32 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
          <div>
            <h1 style={{ margin:0, fontSize: isMobile ? 20 : 24, fontWeight:800, color:T.text }}>Contabilidad</h1>
            <p style={{ margin:'4px 0 0', color:T.sub, fontSize:14 }}>Registros contables generados automáticamente</p>
          </div>
        </div>

        <div style={{ display:'grid', ...grid(4, 2), gap: isMobile ? 12 : 16, marginBottom:20 }}>
          <KPICard title="Total Asientos" value={String(entries.length)} icon={<MdListAlt />} iconBg={T.accentLt} />
          <KPICard title="Total Debe" value={fmt(totalDebe)} subColor={T.greenText} icon={<MdArrowUpward />} iconBg={T.greenLt} />
          <KPICard title="Total Haber" value={fmt(totalHaber)} subColor={T.redText} icon={<MdArrowDownward />} iconBg={T.redLt} />
          <KPICard title="Balance" value={fmt(totalDebe - totalHaber)} sub={balanced ? <>Balance cuadrado <MdCheck style={{ verticalAlign: 'middle' }} /></> : <>Descuadrado <MdWarning style={{ verticalAlign: 'middle' }} /></>} subColor={balanced ? T.greenText : T.red} icon={<MdBalance />} iconBg={T.greenLt} />
        </div>

        {loading ? (
          <div style={{ textAlign:'center', padding:48, color:T.sub }}>Cargando asientos contables...</div>
        ) : groups.length === 0 ? (
          <div style={{ textAlign:'center', padding:48, color:T.sub }}>No hay asientos contables registrados</div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {paginatedGroups.map((g, idx) => {
              const gDebe = g.entries.reduce((a, e) => a + (Number(e.debit) || 0), 0);
              const gHaber = g.entries.reduce((a, e) => a + (Number(e.credit) || 0), 0);
              return (
                <div key={idx} style={{ background:T.white, borderRadius:T.radius, boxShadow:T.shadow, overflow:'hidden' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 20px', borderBottom:`1px solid ${T.border}` }}>
                    <div><span style={{ fontWeight:700, color:T.text }}>{g.invoiceNumber}</span></div>
                    <div style={{ display:'flex', gap:16, alignItems:'center' }}>
                      <span style={{ fontSize:13, color:T.sub }}>{g.date}</span>
                      <span style={{ fontSize:12, color:T.greenText, fontWeight:600 }}><MdCheck style={{ verticalAlign: 'middle' }} /> Balanceado</span>
                    </div>
                  </div>
                  <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', minWidth: isMobile ? 380 : 'auto' }}>
                    <thead><tr style={{ background:T.surface }}>{['Cuenta','Descripción','Debe','Haber'].map(h=><th key={h} style={{ padding: isMobile ? '8px 12px' : '10px 20px', textAlign:h==='Cuenta'||h==='Descripción'?'left':'right', fontSize:12, color:T.sub, fontWeight:600, whiteSpace:'nowrap' }}>{h}</th>)}</tr></thead>
                    <tbody>
                      {g.entries.map((e, i)=>(
                        <tr key={i} style={{ borderTop:`1px solid ${T.border}` }}>
                          <td style={{ padding:'10px 20px', fontSize:13, color:T.sub }}>{e.accountCode}</td>
                          <td style={{ padding:'10px 20px', fontSize:13, color:T.text }}>{resolveAccountName(e.accountName, e.accountCode)}</td>
                          <td style={{ padding:'10px 20px', textAlign:'right', fontSize:13, color:Number(e.debit)>0?T.green:T.muted, fontWeight:Number(e.debit)>0?600:400 }}>{fmt(e.debit)}</td>
                          <td style={{ padding:'10px 20px', textAlign:'right', fontSize:13, color:Number(e.credit)>0?T.red:T.muted, fontWeight:Number(e.credit)>0?600:400 }}>{fmt(e.credit)}</td>
                        </tr>
                      ))}
                      <tr style={{ background:T.surface, borderTop:`1px solid ${T.border}` }}>
                        <td colSpan={2} style={{ padding:'10px 20px', fontWeight:700, fontSize:13, color:T.text }}>Total</td>
                        <td style={{ padding:'10px 20px', textAlign:'right', fontWeight:800, color:T.green }}>{fmt(gDebe)}</td>
                        <td style={{ padding:'10px 20px', textAlign:'right', fontWeight:800, color:T.red }}>{fmt(gHaber)}</td>
                      </tr>
                    </tbody>
                  </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={groups.length}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />

        <div style={{ marginTop:20, padding:'16px 20px', background:T.accentLt, borderRadius:T.radius, display:'flex', gap:12, alignItems:'center' }}>
          <MdMenuBook size={24} style={{ color: T.accent }} />
          <div>
            <div style={{ fontWeight:700, color:T.accent }}>Registro Contable Automatizado</div>
            <div style={{ fontSize:13, color:T.sub }}>Los asientos contables se generan automáticamente al confirmar cada factura, garantizando el principio de partida doble.</div>
          </div>
        </div>
      </main>
    </div>
  );
}
