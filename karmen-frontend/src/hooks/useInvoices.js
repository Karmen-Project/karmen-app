import { useState, useCallback } from 'react';
import { getInvoices, uploadInvoice, confirmInvoice, updateInvoice, deleteInvoice, contabilizarInvoice } from '../api/invoices.js';
import { getCompanyId } from '../api/endPoints.js';

export function useInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async (params) => {
    const companyId = getCompanyId();
    if (!companyId) {
      setError('No se encontró la empresa del usuario');
      return;
    }
    setLoading(true);
    try {
      const data = await getInvoices(companyId, params);
      setInvoices(data.content || data);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  const upload = useCallback(async (type, file) => {
    const companyId = getCompanyId();
    if (!companyId) throw new Error('No se encontró la empresa');
    const data = await uploadInvoice(companyId, type, file);
    await fetchAll();
    return data;
  }, [fetchAll]);

  const confirm = useCallback(async (id, payload) => {
    const data = await confirmInvoice(id, payload);
    await fetchAll();
    return data;
  }, [fetchAll]);

  const update = useCallback(async (id, payload) => {
    const data = await updateInvoice(id, payload);
    await fetchAll();
    return data;
  }, [fetchAll]);

  const remove = useCallback(async (id) => {
    await deleteInvoice(id);
    await fetchAll();
  }, [fetchAll]);

  const contabilizar = useCallback(async (id) => {
    const data = await contabilizarInvoice(id);
    await fetchAll();
    return data;
  }, [fetchAll]);

  return { invoices, loading, error, fetchAll, upload, confirm, update, remove, contabilizar };
}
