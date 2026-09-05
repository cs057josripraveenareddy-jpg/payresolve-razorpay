import { useState, useMemo } from 'react';
import { usePayments, useRecoveryActions } from '@/hooks/usePayResolve';
import { detectOpportunities } from '@/lib/recovery-engine';
import { formatINR, timeAgo } from '@/lib/format';
import { getStatusBadgeClass, getScoreBadgeClass, getMethodLabel, getFailureLabel } from '@/lib/recovery-ui';
import PaymentDrawer from '@/components/recovery/PaymentDrawer';
import { cn } from '@/lib/utils';
import { Search, Radio, FlaskConical } from 'lucide-react';

export default function RevenueRecovery() {
  const { payments, loading, reload } = usePayments();
  const { actions, reload: reloadActions } = useRecoveryActions();
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all | eligible | blocked | recovered
  const [environment, setEnvironment] = useState('demo_simulation');

  const opportunities = useMemo(() => detectOpportunities(payments), [payments]);

  const filtered = useMemo(() => {
    let result = opportunities;
    if (filter === 'eligible') result = result.filter((o) => o.recoverable);
    if (filter === 'blocked') result = result.filter((o) => !o.safety.allowed);
    if (filter === 'recovered') result = result.filter((o) => o.payment.recovered);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((o) =>
        o.payment.payment_id.toLowerCase().includes(q) ||
        o.payment.order_id.toLowerCase().includes(q) ||
        o.payment.customer_name.toLowerCase().includes(q)
      );
    }
    return result;
  }, [opportunities, filter, search]);

  const counts = useMemo(() => ({
    all: opportunities.length,
    eligible: opportunities.filter((o) => o.recoverable).length,
    blocked: opportunities.filter((o) => !o.safety.allowed).length,
    recovered: opportunities.filter((o) => o.payment.recovered).length,
  }), [opportunities]);

  const selectedPayment = selected ? payments.find((p) => p.id === selected) : null;
  const selectedOpportunity = selectedPayment ? detectOpportunities([selectedPayment])[0] : null;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold mb-1">Revenue Recovery Center</h1>
          <p className="text-sm text-muted-foreground">AI-powered recovery opportunities · Synthetic Demo Data</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-1">
          <button
            onClick={() => setEnvironment('demo_simulation')}
            className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
              environment === 'demo_simulation' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground')}
          >
            <FlaskConical className="w-3.5 h-3.5" />
            Demo Simulation
          </button>
          <button
            onClick={() => setEnvironment('razorpay_test')}
            disabled
            className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-not-allowed opacity-50',
              'text-muted-foreground')}
            title="Razorpay Test Mode — credentials not configured"
          >
            <Radio className="w-3.5 h-3.5" />
            Razorpay Test
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search payment, order, customer..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-card text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
          {[
            { key: 'all', label: 'All' },
            { key: 'eligible', label: 'Eligible' },
            { key: 'blocked', label: 'Blocked' },
            { key: 'recovered', label: 'Recovered' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn('px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                filter === f.key ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground')}
            >
              {f.label} <span className="text-muted-foreground/60">{counts[f.key]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">Payment</th>
              <th className="text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">Amount</th>
              <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">Failure</th>
              <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">Method</th>
              <th className="text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">Score</th>
              <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">AI Action</th>
              <th className="text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">Safety</th>
              <th className="text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-12 text-muted-foreground text-sm">Loading payments...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-12 text-muted-foreground text-sm">No payments match this filter.</td></tr>
            ) : (
              filtered.map((o) => (
                <tr
                  key={o.payment.id}
                  onClick={() => setSelected(o.payment.id)}
                  className="border-b border-border last:border-0 hover:bg-muted/20 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-sm">{o.payment.payment_id}</div>
                    <div className="text-xs text-muted-foreground">{o.payment.customer_name} · {timeAgo(o.payment.created_at)}</div>
                  </td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums text-sm">{formatINR(o.payment.amount)}</td>
                  <td className="px-4 py-3">
                    <span className="text-sm">{getFailureLabel(o.payment.failure_category)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-muted-foreground">{getMethodLabel(o.payment.payment_method)}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn('inline-block px-2 py-0.5 rounded-md text-xs font-bold tabular-nums border', getScoreBadgeClass(o.score.score))}>
                      {o.score.score}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm capitalize">{o.action.action.replace(/_/g, ' ')}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn('inline-block px-2 py-0.5 rounded-md text-xs font-semibold border', getStatusBadgeClass(o.safety.status))}>
                      {o.safety.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn('inline-block px-2 py-0.5 rounded-md text-xs font-semibold border capitalize',
                      o.payment.recovered ? getStatusBadgeClass('recovered') : o.recoverable ? getStatusBadgeClass('identified') : getStatusBadgeClass('stopped'))}>
                      {o.payment.recovered ? 'recovered' : o.recoverable ? 'ready' : 'stopped'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedPayment && selectedOpportunity && (
        <PaymentDrawer
          payment={selectedPayment}
          opportunity={selectedOpportunity}
          onClose={() => { setSelected(null); reload(); reloadActions(); }}
          onRecovered={() => { reload(); reloadActions(); }}
          environment={environment}
        />
      )}
    </div>
  );
}