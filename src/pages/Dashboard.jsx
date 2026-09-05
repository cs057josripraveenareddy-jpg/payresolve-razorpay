import { useMemo } from 'react';
import { usePayments, useRecoveryActions } from '@/hooks/usePayResolve';
import { calculateMetrics, getFailureBreakdown } from '@/lib/recovery-engine';
import { formatINR } from '@/lib/format';
import KpiCard from '@/components/KpiCard';
import { TrendingDown, TrendingUp, IndianRupee, Target, AlertTriangle, RefreshCw, CheckCircle2, ShieldX } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const FUNNEL_STEPS = [
  { key: 'failedPayments', label: 'Failed Payments', color: 'bg-destructive' },
  { key: 'eligibleOpportunities', label: 'Eligible Opportunities', color: 'bg-warning' },
  { key: 'aiRecommendations', label: 'AI Recommendations', color: 'bg-accent' },
  { key: 'approved', label: 'Approved', color: 'bg-primary' },
  { key: 'attempts', label: 'Attempts', color: 'bg-primary/70' },
  { key: 'successful', label: 'Successful', color: 'bg-success' },
];

export default function Dashboard() {
  const { payments, loading } = usePayments();
  const { actions } = useRecoveryActions();

  const metrics = useMemo(() => calculateMetrics(payments, actions), [payments, actions]);
  const breakdown = useMemo(() => getFailureBreakdown(payments), [payments]);

  const maxFunnelCount = Math.max(...FUNNEL_STEPS.map((s) => metrics.funnel[s.key].count), 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-20">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold mb-1">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Revenue recovery overview · Synthetic Demo Data</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Revenue at Risk" value={formatINR(metrics.revenueAtRisk)} icon={TrendingDown} accent="destructive" sublabel={`${metrics.failedPayments} failed payments`} />
        <KpiCard label="Potentially Recoverable" value={formatINR(metrics.potentiallyRecoverable)} icon={Target} accent="warning" sublabel={`${metrics.eligibleOpportunities} eligible`} />
        <KpiCard label="Revenue Recovered" value={formatINR(metrics.revenueRecovered)} icon={IndianRupee} accent="success" sublabel={`${metrics.successfulRecoveries} recoveries`} />
        <KpiCard label="Recovery Rate" value={`${metrics.recoveryRate}%`} icon={TrendingUp} accent="primary" sublabel="successful / attempts" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Failed Payments" value={metrics.failedPayments} icon={AlertTriangle} accent="destructive" />
        <KpiCard label="Recovery Opportunities" value={metrics.eligibleOpportunities} icon={RefreshCw} accent="warning" />
        <KpiCard label="Successful Recoveries" value={metrics.successfulRecoveries} icon={CheckCircle2} accent="success" />
        <KpiCard label="Blocked Actions" value={metrics.blockedActions} icon={ShieldX} accent="destructive" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="font-heading font-semibold mb-1">Recovery Funnel</h2>
          <p className="text-xs text-muted-foreground mb-5">From failed payments to verified revenue recovered</p>
          <div className="space-y-3">
            {FUNNEL_STEPS.map((step) => {
              const data = metrics.funnel[step.key];
              const width = (data.count / maxFunnelCount) * 100;
              return (
                <div key={step.key}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">{step.label}</span>
                    <span className="text-sm tabular-nums">
                      <span className="font-semibold">{data.count}</span>
                      {data.amount > 0 && <span className="text-muted-foreground ml-2">{formatINR(data.amount)}</span>}
                    </span>
                  </div>
                  <div className="h-7 rounded-md bg-muted overflow-hidden">
                    <div className={`h-full ${step.color} rounded-md transition-all flex items-center px-2`} style={{ width: `${Math.max(width, 8)}%` }}>
                      <span className="text-[10px] font-semibold text-white">{data.count}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-5 pt-4 border-t border-border">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold">Revenue Recovered</span>
              <span className="text-lg font-bold font-heading text-success">{formatINR(metrics.revenueRecovered)}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Only verified successful recoveries count as recovered revenue.</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="font-heading font-semibold mb-1">Failure Breakdown</h2>
          <p className="text-xs text-muted-foreground mb-5">Failed payments by category</p>
          {breakdown.total === 0 ? (
            <p className="text-sm text-muted-foreground py-10 text-center">No failed payments</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={breakdown.byCategory} layout="vertical" margin={{ left: 20, right: 20 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="category" tick={{ fill: 'hsl(215 20% 55%)', fontSize: 11 }} axisLine={false} tickLine={false} width={100} />
                <Tooltip
                  cursor={{ fill: 'hsl(222 40% 14%)' }}
                  contentStyle={{ background: 'hsl(222 44% 9%)', border: '1px solid hsl(222 30% 16%)', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} name="Failed Payments">
                  {breakdown.byCategory.map((entry, i) => (
                    <Cell key={i} fill={entry.category === 'insufficient_funds' || entry.category === 'declined' || entry.category === 'expired_card' ? 'hsl(0 72% 51%)' : 'hsl(173 58% 45%)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}