import { useEffect, useState } from 'react';
import { MdTrendingUp, MdTrendingDown, MdReceiptLong, MdAttachMoney } from 'react-icons/md';
import { useTheme } from '../utils/theme/ThemeContext.jsx';
import { useResponsive } from '../utils/useResponsive.js';
import Sidebar from '../components/Sidebar/Sidebar.jsx';
import KPICard from '../components/Cards/KPICard.jsx';
import Badge from '../components/Badge/Badge.jsx';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getMonthlyReport } from '../api/reports.js';
import { getInvoices } from '../api/invoices.js';
import { getCompanyId } from '../api/endPoints.js';
import { formatCurrency } from '../utils/format.js';

export default function Dashboard() {
  const { T } = useTheme();
  const { isMobile, mainPadding, grid } = useResponsive();
  const [report, setReport] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const companyId = getCompanyId();
      if (!companyId) return;
      try {
        const [reportData, invoicesData] = await Promise.all([
          getMonthlyReport(companyId),
          getInvoices(companyId, { size: 5 })
        ]);
        setReport(reportData);
        setRecent(invoicesData.content || invoicesData || []);
      } catch (e) {
        console.error('Error cargando dashboard:', e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const kpis = report ? {
    ingresos: report.totalIncome || 0,
    egresos: report.totalExpense || 0,
    utilidad: report.netBalance || 0,
    facturas: report.invoiceCount || 0,
    margen: report.totalIncome > 0 ? ((report.netBalance / report.totalIncome) * 100).toFixed(1) : 0
  } : { ingresos: 0, egresos: 0, utilidad: 0, facturas: 0, margen: 0 };

  const chartData = report?.months || [];

  return (
    <div style={{ background: T.bg, minHeight: '100vh', transition: 'background 0.2s', ...mainPadding }}>
      <Sidebar />
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? 16 : 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: isMobile ? 20 : 24, fontWeight: 800, color: T.text }}>Dashboard</h1>
            <p style={{ margin: '4px 0 0', color: T.sub, fontSize: 14 }}>Resumen de tu actividad financiera</p>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: T.sub }}>Cargando datos...</div>
        ) : (
          <>
            {/* KPIs — 4 cols desktop, 2 cols mobile */}
            <div style={{ display: 'grid', ...grid(4, 2), gap: isMobile ? 12 : 16, marginBottom: 20 }}>
              <KPICard title="Ingresos del Mes" value={formatCurrency(kpis.ingresos)} sub="Este mes" subColor={T.greenText} icon={<MdTrendingUp />} iconBg={T.greenLt} />
              <KPICard title="Egresos del Mes" value={formatCurrency(kpis.egresos)} sub="Este mes" subColor={T.redText} icon={<MdTrendingDown />} iconBg={T.redLt} />
              <KPICard title="Total Facturas" value={String(kpis.facturas)} sub="Registradas" icon={<MdReceiptLong />} iconBg={T.accentLt} />
              <KPICard title="Utilidad Bruta" value={formatCurrency(kpis.utilidad)} sub={`Margen: ${kpis.margen}%`} subColor={T.purple} icon={<MdAttachMoney />} iconBg={T.purpleLt} />
            </div>

            {/* Gráficos — 2 cols desktop, 1 col mobile */}
            <div style={{ display: 'grid', ...grid(2, 1), gap: 16, marginBottom: 20 }}>
              <div style={{ background: T.white, borderRadius: T.radius, padding: isMobile ? 14 : 20, boxShadow: T.shadow }}>
                <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: T.text }}>Ingresos vs Egresos</h3>
                <ResponsiveContainer width="100%" height={isMobile ? 180 : 220}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="mes" tick={{ fontSize: 11, fill: T.sub }} />
                    <YAxis tick={{ fontSize: 11, fill: T.sub }} width={isMobile ? 40 : 60} />
                    <Tooltip formatter={v => formatCurrency(v)} contentStyle={{ background: T.white, border: `1px solid ${T.border}`, color: T.text }} />
                    <Bar dataKey="ingresos" fill={T.green} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="egresos" fill={T.red} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.white, borderRadius: T.radius, padding: isMobile ? 14 : 20, boxShadow: T.shadow }}>
                <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: T.text }}>Tendencia de Ingresos</h3>
                <ResponsiveContainer width="100%" height={isMobile ? 180 : 220}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="mes" tick={{ fontSize: 11, fill: T.sub }} />
                    <YAxis tick={{ fontSize: 11, fill: T.sub }} width={isMobile ? 40 : 60} />
                    <Tooltip formatter={v => formatCurrency(v)} contentStyle={{ background: T.white, border: `1px solid ${T.border}`, color: T.text }} />
                    <Line type="monotone" dataKey="ingresos" stroke={T.accent} strokeWidth={2} dot={{ fill: T.accent }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Facturas recientes */}
            <div style={{ background: T.white, borderRadius: T.radius, padding: isMobile ? 14 : 20, boxShadow: T.shadow }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: T.text }}>Facturas Recientes</h3>
                <a href="/facturas" style={{ fontSize: 13, color: T.accent, textDecoration: 'none', fontWeight: 600 }}>Ver todas →</a>
              </div>
              {recent.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 24, color: T.sub }}>No hay facturas registradas</div>
              ) : (
                recent.map(r => (
                  <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 14, padding: '12px 0', borderBottom: `1px solid ${T.border}` }}>
                    <div style={{ width: 34, height: 34, borderRadius: T.radiusSm, background: r.type === 'INGRESO' ? T.greenLt : T.redLt, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>
                      {r.type === 'INGRESO' ? '↗' : '↘'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: isMobile ? 13 : 14, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.providerName || r.companyName || 'Sin proveedor'}
                      </div>
                      <div style={{ fontSize: 12, color: T.sub }}>{r.invoiceNumber}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: isMobile ? 13 : 14, color: r.type === 'INGRESO' ? T.green : T.red }}>
                        {formatCurrency(r.total)}
                      </div>
                      {!isMobile && <div style={{ fontSize: 12, color: T.sub }}>{r.invoiceDate || 'Sin fecha'}</div>}
                    </div>
                    {!isMobile && <Badge status={r.status} />}
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
