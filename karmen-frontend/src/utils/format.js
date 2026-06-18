const _fmt = new Intl.NumberFormat('es-CO', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** "1250000.99" → "1.250.000,99" */
export const formatNumber = (v) => _fmt.format(Number(v) || 0);

/** "1250000.99" → "$1.250.000,99" */
export const formatCurrency = (v) => `$${formatNumber(v)}`;
