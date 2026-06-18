import { useEffect, useState } from 'react';
import { MdHourglassEmpty, MdBarChart, MdTableChart, MdDownload } from 'react-icons/md';
import { useTheme } from '../utils/theme/ThemeContext.jsx';
import { useResponsive } from '../utils/useResponsive.js';
import Sidebar from '../components/Sidebar/Sidebar.jsx';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { getMonthlyReport, getRangeReport } from '../api/reports.js';
import { getCompanyId, getSession } from '../api/endPoints.js';
import { getCompany, getLogoUrl } from '../api/companies.js';
import { formatCurrency, formatNumber } from '../utils/format.js';

const fmt  = v => formatCurrency(v);
const fmtN = v => formatNumber(v);
const pct  = (a, b) => (b > 0 ? ((a / b) * 100).toFixed(1) : '0.0');

const today = () => new Date().toISOString().split('T')[0];
const firstOfYear = () => `${new Date().getFullYear()}-01-01`;

// ─── PDF del reporte por rango ────────────────────────────────────────────────
async function generateRangePDF(report, companyName, logoUrl) {
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W   = 210;
  const now = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });

  const fmtDate = d => d ? new Date(d + 'T00:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' }) : '';
  const periodLabel = `${fmtDate(report.dateFrom)} — ${fmtDate(report.dateTo)}`;

  const ingresos = Number(report.totalIncome  || 0);
  const egresos  = Number(report.totalExpense  || 0);
  const balance  = Number(report.netBalance    || 0);

  const INDIGO  = [79,  70,  229];
  const GRAY    = [107, 114, 128];
  const DARK    = [17,  24,  39];
  const GREEN   = [22,  163, 74];
  const RED     = [220, 38,  38];
  const PURPLE  = [124, 58,  237];
  const BGLIGHT = [238, 242, 247];

  // Encabezado — logo a la derecha, todo el texto a la izquierda
  const HEADER_H = 36;
  pdf.setFillColor(...INDIGO);
  pdf.rect(0, 0, W, HEADER_H, 'F');

  // Logo (se dibuja primero para que el texto quede encima si hay solapamiento accidental)
  if (logoUrl) {
    try {
      await new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          try {
            const maxH = 28, maxW = 32;
            const ratio = Math.min(maxW / img.width, maxH / img.height);
            const w = img.width * ratio;
            const h = img.height * ratio;
            pdf.addImage(img, 'PNG', W - 14 - w, (HEADER_H - h) / 2, w, h);
          } catch { /* logo opcional: continuar sin él */ }
          resolve();
        };
        img.onerror = resolve;
        img.src = logoUrl;
      });
    } catch { /* sin logo: continuar */ }
  }

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Karmen — Reporte por Período', 14, 11);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text(companyName, 14, 19);
  pdf.text(`Período: ${periodLabel}`, 14, 26);
  pdf.text(`Generado: ${now}`, 14, 32);

  let y = HEADER_H + 8;

  // KPIs
  const kpis = [
    ['Total Ingresos', fmt(ingresos), GREEN],
    ['Total Gastos',   fmt(egresos),  RED],
    ['Balance',        fmt(balance),  balance >= 0 ? PURPLE : RED],
    ['Total Facturas', String(report.invoiceCount || 0), GRAY],
  ];
  const colW = (W - 28) / 4;
  kpis.forEach(([label, value, color], i) => {
    const x = 14 + i * colW;
    pdf.setFillColor(...BGLIGHT);
    pdf.roundedRect(x, y, colW - 4, 18, 2, 2, 'F');
    pdf.setTextColor(...GRAY);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.text(label, x + 4, y + 6);
    pdf.setTextColor(...color);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text(value, x + 4, y + 13);
  });

  y += 26;

  // Tabla de movimientos
  pdf.setTextColor(...DARK);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text('Detalle de Movimientos', 14, y);
  y += 4;

  const movements = report.movements || [];
  if (movements.length === 0) {
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(10);
    pdf.setTextColor(...GRAY);
    pdf.text('No hay registros en este rango de fechas.', 14, y + 8);
  } else {
    autoTable(pdf, {
      startY: y,
      head: [['Fecha', 'Tipo', 'Categoría', 'Monto', 'Descripción']],
      body: movements.map(m => [
        m.date,
        m.type,
        m.category,
        fmt(m.amount),
        m.description,
      ]),
      headStyles:  { fillColor: INDIGO, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      bodyStyles:  { fontSize: 8, textColor: DARK },
      columnStyles: {
        0: { halign: 'center', cellWidth: 22 },
        1: { halign: 'center', cellWidth: 18 },
        2: { halign: 'center', cellWidth: 22 },
        3: { halign: 'right',  cellWidth: 28 },
        4: { halign: 'left' },
      },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      margin: { left: 14, right: 14 },
      didParseCell(data) {
        if (data.section === 'body' && data.column.index === 3) {
          const m = movements[data.row.index];
          if (m) data.cell.styles.textColor = m.type === 'INGRESO' ? GREEN : RED;
        }
      },
    });
  }

  // Pie de página
  const total = pdf.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    pdf.setPage(i);
    pdf.setFillColor(...BGLIGHT);
    pdf.rect(0, 287, W, 10, 'F');
    pdf.setFontSize(8);
    pdf.setTextColor(...GRAY);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Karmen — Gestión Contable Automatizada', 14, 293);
    pdf.text(`Pág. ${i} / ${total}`, W - 14, 293, { align: 'right' });
  }

  pdf.save(`reporte-${report.dateFrom}-${report.dateTo}.pdf`);
}

// ─── Excel del reporte por rango ──────────────────────────────────────────────
async function generateRangeExcel(report, companyName) {
  const XLSX = await import('xlsx');
  const fmtDate = d => d ? new Date(d + 'T00:00:00').toLocaleDateString('es-CO') : '';
  const movements = report.movements || [];
  const wb = XLSX.utils.book_new();

  const wsResumen = XLSX.utils.aoa_to_sheet([
    ['Karmen — Reporte por Período'],
    [`Empresa: ${companyName}`],
    [`Período: ${fmtDate(report.dateFrom)} — ${fmtDate(report.dateTo)}`],
    [`Generado: ${new Date().toLocaleDateString('es-CO')}`],
    [],
    ['RESUMEN'],
    ['Concepto', 'Valor'],
    ['Total Ingresos',  Number(report.totalIncome  || 0)],
    ['Total Gastos',    Number(report.totalExpense  || 0)],
    ['Balance',         Number(report.netBalance    || 0)],
    ['Total Facturas',  report.invoiceCount || 0],
  ]);
  wsResumen['!cols'] = [{ wch: 28 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');

  const wsMovimientos = XLSX.utils.aoa_to_sheet([
    ['Movimientos del Período'],
    [`${fmtDate(report.dateFrom)} — ${fmtDate(report.dateTo)}`],
    [],
    ['Fecha', 'Tipo', 'Categoría', 'Monto', 'Descripción'],
    ...movements.map(m => [m.date, m.type, m.category, Number(m.amount || 0), m.description]),
    [],
    ['TOTAL', '', '', movements.reduce((a, m) => a + Number(m.amount || 0), 0)],
  ]);
  wsMovimientos['!cols'] = [{ wch: 12 }, { wch: 10 }, { wch: 14 }, { wch: 16 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, wsMovimientos, 'Movimientos');

  XLSX.writeFile(wb, `reporte-${report.dateFrom}-${report.dateTo}.xlsx`);
}

// ─── Componente ───────────────────────────────────────────────────────────────
export default function Reportes() {
  const { T } = useTheme();
  const { isMobile, mainPadding, grid } = useResponsive();

  // Monthly report state
  const [report,       setReport]       = useState(null);
  const [loading,      setLoading]      = useState(true);

  // Range report state
  const [dateFrom,     setDateFrom]     = useState(firstOfYear);
  const [dateTo,       setDateTo]       = useState(today);
  const [dateError,    setDateError]    = useState(null);
  const [rangeReport,  setRangeReport]  = useState(null);
  const [rangeLoading, setRangeLoading] = useState(false);
  const [rangePDF,     setRangePDF]     = useState(false);
  const [rangeXls,     setRangeXls]     = useState(false);

  useEffect(() => {
    const load = async () => {
      const companyId = getCompanyId();
      if (!companyId) return;
      try   { setReport(await getMonthlyReport(companyId)); }
      catch (e) { console.error('Error cargando reportes:', e); }
      finally   { setLoading(false); }
    };
    load();
  }, []);

  const handleGenerate = async () => {
    if (!dateFrom || !dateTo) { setDateError('Debes seleccionar ambas fechas.'); return; }
    if (dateFrom > dateTo)    { setDateError('La fecha inicial no puede ser mayor que la fecha final.'); return; }
    setDateError(null);
    setRangeLoading(true);
    try {
      const companyId = getCompanyId();
      const data = await getRangeReport(companyId, dateFrom, dateTo);
      setRangeReport(data);
    } catch (e) {
      setDateError('Error al generar el reporte: ' + e.message);
    } finally {
      setRangeLoading(false);
    }
  };

  const companyName = () => getSession()?.companyName || 'Mi Empresa';

  const handleRangePDF = async () => {
    if (rangePDF || !rangeReport) return;
    setRangePDF(true);
    try {
      let logoUrl = null;
      const cId = getCompanyId();
      if (cId) {
        const co = await getCompany(cId).catch(() => null);
        if (co?.logoUrl) logoUrl = getLogoUrl(co.logoUrl);
      }
      await generateRangePDF(rangeReport, companyName(), logoUrl);
    }
    catch (e) { console.error(e); alert('No se pudo generar el PDF.'); }
    finally   { setRangePDF(false); }
  };

  const handleRangeXls = async () => {
    if (rangeXls || !rangeReport) return;
    setRangeXls(true);
    try { await generateRangeExcel(rangeReport, companyName()); }
    catch (e) { console.error(e); alert('No se pudo generar el Excel.'); }
    finally   { setRangeXls(false); }
  };



  const chartData    = report?.months || [];
  const ingresos     = Number(report?.totalIncome  || 0);
  const egresos      = Number(report?.totalExpense  || 0);
  const utilidad     = Number(report?.netBalance    || 0);
  const margen       = pct(utilidad, ingresos);
  const ivaCargo     = Number(report?.ivaCargo      || 0);
  const ivaFavor     = Number(report?.ivaFavor      || 0);
  const ivaPagar     = Number(report?.ivaPagar      || 0);
  const invoiceCount = report?.invoiceCount         || 0;

  const tiposData = [
    { name: 'Ingresos', value: chartData.reduce((a, m) => a + (Number(m.ingresos) > 0 ? 1 : 0), 0) },
    { name: 'Egresos',  value: chartData.reduce((a, m) => a + (Number(m.egresos)  > 0 ? 1 : 0), 0) },
  ];

  const monthLabel = report?.month
    ? new Date(report.month + '-01').toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
    : '';

  const tooltip = { background: T.white, border: `1px solid ${T.border}`, color: T.text };

  const inputStyle = {
    padding: '9px 14px', border: `1px solid ${T.border}`,
    borderRadius: T.radiusSm, fontSize: 14,
    background: T.white, color: T.text,
  };

  const rangeIngresos = Number(rangeReport?.totalIncome  || 0);
  const rangeEgresos  = Number(rangeReport?.totalExpense  || 0);
  const rangeBalance  = Number(rangeReport?.netBalance    || 0);
  const movements     = rangeReport?.movements || [];

  return (
    <div style={{ background: T.bg, minHeight: '100vh', transition: 'background 0.2s', ...mainPadding }}>
      <Sidebar />
      <main style={{ maxWidth: 1000, margin: '0 auto', padding: isMobile ? 16 : 32 }}>

        {/* Cabecera */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ margin: 0, fontSize: isMobile ? 20 : 24, fontWeight: 800, color: T.text }}>Reportes Financieros</h1>
          <p style={{ margin: '4px 0 0', color: T.sub }}>Análisis de tu situación financiera por período o histórico mensual</p>
        </div>

        {/* ── Selector de período ── */}
        <div style={{ background: T.white, borderRadius: T.radius, padding: '20px 24px', boxShadow: T.shadow, marginBottom: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: T.text }}>Generar Reporte por Período</h3>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: T.sub }}>Fecha inicial</label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: T.sub }}>Fecha final</label>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={inputStyle} />
            </div>
            <button
              onClick={handleGenerate}
              disabled={rangeLoading}
              style={{
                padding: '9px 22px', border: 'none', borderRadius: T.radiusSm,
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: T.accent, color: '#fff', fontWeight: 700, fontSize: 14,
                cursor: rangeLoading ? 'not-allowed' : 'pointer',
              }}
            >
              {rangeLoading ? <><MdHourglassEmpty /> Generando...</> : <><MdBarChart /> Generar Reporte</>}
            </button>
          </div>
          {dateError && (
            <div style={{ marginTop: 10, color: T.red, fontSize: 13 }}>{dateError}</div>
          )}
        </div>

        {/* ── Resultados del período ── */}
        {rangeReport && (
          <>
            {/* KPIs del período */}
            <div style={{ display: 'grid', ...grid(3, 1), gap: isMobile ? 12 : 16, marginBottom: 20 }}>
              {[
                ['Total Ingresos', fmt(rangeIngresos), T.greenText, T.greenLt],
                ['Total Gastos',   fmt(rangeEgresos),  T.redText,   T.redLt],
                ['Balance',        fmt(rangeBalance),  rangeBalance >= 0 ? T.purple : T.red, rangeBalance >= 0 ? T.purpleLt : T.redLt],
              ].map(([lbl, val, color, bg]) => (
                <div key={lbl} style={{ background: T.white, borderRadius: T.radius, padding: 20, boxShadow: T.shadow }}>
                  <div style={{ fontSize: 12, color: T.sub, marginBottom: 6 }}>{lbl}</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color }}>{val}</div>
                  <div style={{ height: 4, borderRadius: 2, background: bg, marginTop: 10 }} />
                </div>
              ))}
            </div>

            {/* Botones de exportar del período */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginBottom: 16 }}>
              <button
                onClick={handleRangeXls}
                disabled={rangeXls}
                style={{ padding: '8px 20px', display: 'inline-flex', alignItems: 'center', gap: 6, border: 'none', borderRadius: T.radiusSm, background: '#16A34A', color: '#fff', fontWeight: 700, fontSize: 13, cursor: rangeXls ? 'not-allowed' : 'pointer' }}
              >
                {rangeXls ? <><MdHourglassEmpty /> Generando...</> : <><MdTableChart /> Exportar Excel</>}
              </button>
              <button
                onClick={handleRangePDF}
                disabled={rangePDF}
                style={{ padding: '8px 20px', display: 'inline-flex', alignItems: 'center', gap: 6, border: 'none', borderRadius: T.radiusSm, background: T.btn, color: '#fff', fontWeight: 700, fontSize: 13, cursor: rangePDF ? 'not-allowed' : 'pointer' }}
              >
                {rangePDF ? <><MdHourglassEmpty /> Generando PDF...</> : <><MdDownload /> Exportar PDF</>}
              </button>
            </div>

            {/* Tabla de movimientos */}
            <div style={{ background: T.white, borderRadius: T.radius, boxShadow: T.shadow, marginBottom: 32, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.border}` }}>
                <span style={{ fontWeight: 700, fontSize: 15, color: T.text }}>Movimientos del período</span>
                <span style={{ marginLeft: 10, fontSize: 13, color: T.sub }}>{movements.length} registros</span>
              </div>
              {movements.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: T.sub, fontSize: 15 }}>
                  No hay registros en este rango de fechas
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: T.surface }}>
                        {['Fecha', 'Tipo', 'Categoría', 'Monto', 'Descripción'].map(h => (
                          <th key={h} style={{ padding: '10px 16px', textAlign: h === 'Monto' ? 'right' : 'left', fontWeight: 600, color: T.sub, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {movements.map((m, i) => (
                        <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                          <td style={{ padding: '10px 16px', color: T.sub, whiteSpace: 'nowrap' }}>{m.date}</td>
                          <td style={{ padding: '10px 16px' }}>
                            <span style={{ padding: '3px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: m.type === 'INGRESO' ? T.greenLt : T.redLt, color: m.type === 'INGRESO' ? T.greenText : T.redText }}>
                              {m.type === 'INGRESO' ? '↗ Ingreso' : '↘ Gasto'}
                            </span>
                          </td>
                          <td style={{ padding: '10px 16px', color: T.text }}>{m.category}</td>
                          <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 700, color: m.type === 'INGRESO' ? T.green : T.red }}>{fmt(m.amount)}</td>
                          <td style={{ padding: '10px 16px', color: T.sub, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.description}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: T.surface }}>
                        <td colSpan={3} style={{ padding: '10px 16px', fontWeight: 700, color: T.text }}>Totales</td>
                        <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 800, fontSize: 15, color: rangeBalance >= 0 ? T.green : T.red }}>{fmt(rangeBalance)}</td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Análisis mensual histórico ── */}
        <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700, color: T.text }}>Análisis Mensual Histórico</h2>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: T.sub }}>Cargando reportes...</div>
        ) : (
          <>
            {/* Resumen ejecutivo mensual */}
            <div style={{ background: T.white, borderRadius: T.radius, padding: '20px 24px', boxShadow: T.shadow, marginBottom: 24 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: T.text }}>Resumen Ejecutivo — {monthLabel}</h3>
              <div style={{ display: 'grid', ...grid(4, 2) }}>
                {[
                  ['Ingresos Totales', fmt(ingresos), T.greenText],
                  ['Egresos Totales',  fmt(egresos),  T.redText],
                  ['Utilidad Bruta',   fmt(utilidad), T.purple],
                  ['Margen',           `${margen}%`,  T.text],
                ].map(([lbl, val, color], i) => (
                  <div key={lbl} style={{ padding: '0 20px', borderRight: i < 3 ? `1px solid ${T.border}` : 'none' }}>
                    <div style={{ fontSize: 12, color: T.sub, marginBottom: 6 }}>{lbl}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Gráficas */}
            <div style={{ display: 'grid', ...grid(2, 1), gap: isMobile ? 14 : 20, marginBottom: 20 }}>
              <div style={{ background: T.white, borderRadius: T.radius, padding: isMobile ? 14 : 20, boxShadow: T.shadow }}>
                <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700, color: T.text }}>Ingresos vs Egresos (7 meses)</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="mes" tick={{ fontSize: 11, fill: T.sub }} />
                    <YAxis tick={{ fontSize: 11, fill: T.sub }} />
                    <Tooltip formatter={v => fmtN(v)} contentStyle={tooltip} />
                    <Bar dataKey="ingresos" fill={T.green} radius={[3,3,0,0]} name="Ingresos" />
                    <Bar dataKey="egresos"  fill={T.red}   radius={[3,3,0,0]} name="Egresos" />
                    <Legend />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.white, borderRadius: T.radius, padding: 20, boxShadow: T.shadow }}>
                <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: T.text }}>Tendencia de Ingresos</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="mes" tick={{ fontSize: 11, fill: T.sub }} />
                    <YAxis tick={{ fontSize: 11, fill: T.sub }} />
                    <Tooltip formatter={v => fmtN(v)} contentStyle={tooltip} />
                    <Line type="monotone" dataKey="ingresos" stroke={T.accent} strokeWidth={2} dot={{ fill: T.accent, r: 4 }} name="Ingresos" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pie & IVA */}
            <div style={{ display: 'grid', ...grid(2, 1), gap: isMobile ? 14 : 20, marginBottom: 20 }}>
              <div style={{ background: T.white, borderRadius: T.radius, padding: 20, boxShadow: T.shadow }}>
                <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: T.text }}>Facturas por Tipo</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={tiposData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      <Cell fill={T.green} /><Cell fill={T.red} />
                    </Pie>
                    <Tooltip contentStyle={tooltip} /><Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: T.white, borderRadius: T.radius, padding: 20, boxShadow: T.shadow }}>
                <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: T.text }}>Cálculo de IVA</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    ['IVA a Cargo (Ingresos)', fmt(ivaCargo), T.greenLt,  T.greenText],
                    ['IVA a Favor (Egresos)',  fmt(ivaFavor), T.greenLt,  T.greenText],
                    ['IVA por Pagar',          fmt(ivaPagar), T.purpleLt, T.purple],
                  ].map(([lbl, val, bg, col]) => (
                    <div key={lbl} style={{ padding: 16, background: bg, borderRadius: T.radiusSm }}>
                      <div style={{ fontSize: 12, color: T.sub, marginBottom: 4 }}>{lbl}</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: col }}>{val}</div>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: 12, color: T.sub, margin: '12px 0 0' }}>IVA a Cargo − IVA a Favor = IVA por Pagar</p>
              </div>
            </div>

            {/* KPIs inferiores */}
            <div style={{ display: 'grid', ...grid(4, 2), gap: isMobile ? 12 : 16 }}>
              {[
                ['Facturas del Mes',  String(invoiceCount),                                     T.accent],
                ['Ingreso Promedio',  invoiceCount > 0 ? fmt(ingresos / invoiceCount) : '$0',   T.purple],
                ['Utilidad Bruta',   fmt(utilidad),                                             utilidad >= 0 ? T.green : T.red],
                ['Margen',           `${margen}%`,                                              T.text],
              ].map(([lbl, val, color]) => (
                <div key={lbl} style={{ background: T.white, borderRadius: T.radius, padding: 16, boxShadow: T.shadow, textAlign: 'center' }}>
                  <div style={{ fontSize: 12, color: T.sub, marginBottom: 6 }}>{lbl}</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color }}>{val}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
