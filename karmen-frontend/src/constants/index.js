export const STATUS = { PENDIENTE:'pendiente', CONFIRMADA:'confirmada', CONTABILIZADA:'contabilizada' };
export const ROLES = { ADMIN:'ADMIN', CONTADOR:'CONTADOR' };
export const INVOICE_TYPES = { INGRESO:'INGRESO', EGRESO:'EGRESO' };

// Cuenta PUC principal por defecto según el tipo de factura.
// Refleja los defaults del backend (AccountingService): INGRESO→1300 (Clientes), EGRESO→5100 (Gastos generales).
export const PUC_DEFAULT_MAIN_ACCOUNT = { INGRESO: '1300', EGRESO: '5100' };
