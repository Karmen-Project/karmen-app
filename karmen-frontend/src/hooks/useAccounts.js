import { useState, useCallback } from 'react';
import { getAccounts, createAccount, updateAccount, toggleAccount, deleteAccount } from '../api/accounts.js';
import { getCompanyId } from '../api/endPoints.js';

export function useAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  const fetchAll = useCallback(async () => {
    const companyId = getCompanyId();
    if (!companyId) { setError('No se encontró la empresa'); return; }
    setLoading(true);
    try {
      setAccounts(await getAccounts(companyId));
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  const create = useCallback(async (payload) => {
    const data = await createAccount(getCompanyId(), payload);
    await fetchAll();
    return data;
  }, [fetchAll]);

  const update = useCallback(async (id, payload) => {
    const data = await updateAccount(id, payload);
    await fetchAll();
    return data;
  }, [fetchAll]);

  const toggle = useCallback(async (id) => {
    const data = await toggleAccount(id);
    await fetchAll();
    return data;
  }, [fetchAll]);

  const remove = useCallback(async (id) => {
    await deleteAccount(id);
    await fetchAll();
  }, [fetchAll]);

  return { accounts, loading, error, fetchAll, create, update, toggle, remove };
}
