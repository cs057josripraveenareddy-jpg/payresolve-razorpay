import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

export function usePayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await base44.entities.Payment.list('-created_date', 100);
      setPayments(data);
    } catch (e) {
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);
  return { payments, loading, reload };
}

export function useRecoveryActions() {
  const [actions, setActions] = useState([]);

  const reload = useCallback(async () => {
    try {
      const data = await base44.entities.RecoveryAction.list('-created_date', 200);
      setActions(data);
    } catch (e) {
      setActions([]);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);
  return { actions, reload };
}

export function useAuditLogs(paymentId) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!paymentId) { setLogs([]); return; }
    setLoading(true);
    try {
      const data = await base44.entities.AuditLog.filter({ payment_id: paymentId }, '-created_date', 50);
      setLogs(data);
    } catch (e) {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [paymentId]);

  useEffect(() => { reload(); }, [reload]);
  return { logs, loading, reload };
}