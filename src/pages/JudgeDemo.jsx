import { useState, useMemo } from 'react';
import { usePayments, useRecoveryActions } from '@/hooks/usePayResolve';
import { detectOpportunities, calculateMetrics } from '@/lib/recovery-engine';
import { formatINR } from '@/lib/format';
import { cn } from '@/lib/utils';
import { ChevronRight, ChevronLeft, CheckCircle2, Circle, Gavel } from 'lucide-react';

const STEPS = [
  { num: 1, title: 'Open Dashboard', desc: 'Overview of revenue recovery metrics across all synthetic payments.' },
  { num: 2, title: 'Show Revenue at Risk', desc: 'Total failed payment value eligible for recovery.' },
  { num: 3, title: 'Open Failed Payment', desc: 'Navigate to Revenue Recovery Center and select a failed payment.' },
  { num: 4, title: 'Show Failure Analysis', desc: 'Understand why the payment failed — category, reason, retry history.' },
  { num: 5, title: 'Show Recovery Score', desc: 'Deterministic 0-100 score with explainable factor breakdown.' },
  { num: 6, title: 'Show AI Recommendation', desc: 'AI analyzes verified data and recommends the best recovery action.' },
  { num: 7, title: 'Show Safety Validation', desc: 'Deterministic safety engine validates the AI recommendation.' },
  { num: 8, title: 'Execute Recovery', desc: 'Run Demo Simulation to recover the payment.' },
  { num: 9, title: 'Show Verified Result', desc: 'Only verified successful recovery counts as revenue recovered.' },
  { num: 10, title: 'Show Audit Trail', desc: 'Every recovery step is recorded in the audit log.' },
  { num: 11, title: 'Show Batch Metrics', desc: 'Recovery funnel and measured performance across all payments.' },
];

export default function JudgeDemo() {
  const { payments, loading } = usePayments();
  const { actions } = useRecoveryActions();
  const [current, setCurrent] = useState(0);

  const opportunities = useMemo(() => detectOpportunities(payments), [payments]);
  const metrics = useMemo(() => calculateMetrics(payments, actions), [payments, actions]);
  const bestOpp = opportunities.find((o) => o.recoverable && o.score.score >= 80);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-20">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const step = STEPS[current];

  const renderContent = () => {
    switch (step.num) {
      case 1:
        return (
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-border bg-muted/20 p-4">
              <p className="text-xs text-muted-foreground">Total Payments</p>
              <p className="text-xl font-bold">{metrics.totalPayments}</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/20 p-4">
              <p className="text-xs text-muted-foreground">Failed</p>
              <p className="text-xl font-bold text-destructive">{metrics.failedPayments}</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/20 p-4">
              <p className="text-xs text-muted-foreground">Recovered</p>
              <p className="text-xl font-bold text-success">{formatINR(metrics.revenueRecovered)}</p>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="rounded-lg border border-warning/30 bg-warning/5 p-6">
            <p className="text-xs text-muted-foreground mb-1">Revenue at Risk</p>
            <p className="text-3xl font-bold font-heading text-warning">{formatINR(metrics.revenueAtRisk)}</p>
            <p className="text-sm text-muted-foreground mt-2">{metrics.failedPayments} failed payments · {metrics.eligibleOpportunities} eligible for recovery</p>
          </div>
        );
      case 3:
        return (
          <div className="rounded-lg border border-border bg-muted/20 p-4">
            {bestOpp ? (
              <>
                <p className="text-sm font-semibold mb-1">{bestOpp.payment.payment_id}</p>
                <p className="text-xs text-muted-foreground">{bestOpp.payment.customer_name} · {formatINR(bestOpp.payment.amount)}</p>
                <p className="text-xs text-muted-foreground mt-2">Go to Revenue Recovery Center and click this payment to open the detail drawer.</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No eligible high-score payment found.</p>
            )}
          </div>
        );
      case 4:
        return bestOpp ? (
          <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-1.5">
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">Category</span><span className="text-sm font-medium capitalize">{bestOpp.payment.failure_category.replace(/_/g, ' ')}</span></div>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">Reason</span><span className="text-sm font-medium text-right">{bestOpp.payment.failure_reason}</span></div>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">Retry Count</span><span className="text-sm font-medium">{bestOpp.payment.retry_count} / 3</span></div>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">Refund Status</span><span className="text-sm font-medium capitalize">{bestOpp.payment.refund_status}</span></div>
          </div>
        ) : null;
      case 5:
        return bestOpp ? (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-6">
            <p className="text-xs text-muted-foreground mb-1">Recovery Score</p>
            <p className="text-3xl font-bold font-heading text-primary">{bestOpp.score.score}/100</p>
            <div className="mt-3 space-y-1">
              {bestOpp.score.breakdown.map((b) => (
                <div key={b.factor} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{b.factor}</span>
                  <span className="font-medium tabular-nums">+{b.score} / {b.weight}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null;
      case 6:
        return (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
            <p className="text-sm font-semibold mb-1">AI Recommendation: Retry Payment</p>
            <p className="text-sm text-muted-foreground">The payment failed due to a retryable failure with no previous successful retry. Confidence: 87%.</p>
            <p className="text-xs text-muted-foreground mt-2">Click "Get AI Recommendation" in the payment drawer to see the full AI analysis.</p>
          </div>
        );
      case 7:
        return (
          <div className="rounded-lg border border-success/30 bg-success/5 p-4">
            <p className="text-sm font-semibold text-success mb-1">Safety Validation: ALLOWED</p>
            <p className="text-sm text-muted-foreground">Payment is failed, failure is retryable, not refunded, retry limit available, within age limit.</p>
            <p className="text-xs text-muted-foreground mt-2">AI can recommend. Safety engine controls. AI cannot override financial safety rules.</p>
          </div>
        );
      case 8:
        return (
          <div className="rounded-lg border border-border bg-muted/20 p-4">
            <p className="text-sm">Click "Execute Recovery" in the payment drawer to run the Demo Simulation. The workflow animates through: Safety → Permitted → Executing → Simulated → Verifying → Successful.</p>
          </div>
        );
      case 9:
        return (
          <div className="rounded-lg border border-success/30 bg-success/5 p-6 text-center">
            <CheckCircle2 className="w-10 h-10 text-success mx-auto mb-2" />
            <p className="text-sm font-semibold text-success">SIMULATED RECOVERY</p>
            <p className="text-2xl font-bold font-heading text-success mt-1">{bestOpp ? formatINR(bestOpp.payment.amount) : formatINR(0)}</p>
            <p className="text-xs text-muted-foreground mt-1">Only verified success counts as recovered revenue.</p>
          </div>
        );
      case 10:
        return (
          <div className="rounded-lg border border-border bg-muted/20 p-4">
            <p className="text-sm text-muted-foreground">Every step — safety validation, execution, outcome — is recorded in the Audit Timeline within the payment drawer.</p>
          </div>
        );
      case 11:
        return (
          <div className="space-y-2">
            {[
              { label: 'Failed Payments', value: metrics.funnel.failedPayments.count, color: 'text-destructive' },
              { label: 'Eligible Opportunities', value: metrics.funnel.eligibleOpportunities.count, color: 'text-warning' },
              { label: 'AI Recommendations', value: metrics.funnel.aiRecommendations.count, color: 'text-accent' },
              { label: 'Approved', value: metrics.funnel.approved.count, color: 'text-primary' },
              { label: 'Attempts', value: metrics.funnel.attempts.count, color: 'text-primary' },
              { label: 'Successful', value: metrics.funnel.successful.count, color: 'text-success' },
            ].map((s) => (
              <div key={s.label} className="flex justify-between items-center rounded-lg border border-border bg-muted/20 px-4 py-2">
                <span className="text-sm">{s.label}</span>
                <span className={cn('text-sm font-bold tabular-nums', s.color)}>{s.value}</span>
              </div>
            ))}
            <div className="flex justify-between items-center rounded-lg border border-success/30 bg-success/5 px-4 py-3 mt-2">
              <span className="text-sm font-semibold">Revenue Recovered</span>
              <span className="text-lg font-bold font-heading text-success">{formatINR(metrics.revenueRecovered)}</span>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
          <Gavel className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold">Judge Demo</h1>
          <p className="text-sm text-muted-foreground">Guided walkthrough of the PayResolve revenue recovery workflow</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-primary">Step {step.num} of {STEPS.length}</span>
          </div>
          <div className="flex gap-1">
            {STEPS.map((s, i) => (
              <div key={s.num} className={cn('w-1.5 h-1.5 rounded-full transition-colors', i === current ? 'bg-primary' : i < current ? 'bg-primary/40' : 'bg-muted')} />
            ))}
          </div>
        </div>
        <h2 className="font-heading text-lg font-semibold mb-1">{step.title}</h2>
        <p className="text-sm text-muted-foreground mb-5">{step.desc}</p>
        {renderContent()}
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          disabled={current === 0}
          className="flex items-center gap-1 px-4 py-2 rounded-lg border border-border text-sm font-medium disabled:opacity-40 hover:bg-muted transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Previous
        </button>
        <div className="flex gap-1.5">
          {STEPS.map((s, i) => (
            <button
              key={s.num}
              onClick={() => setCurrent(i)}
              className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors',
                i === current ? 'bg-primary text-primary-foreground' : i < current ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground hover:bg-muted/70')}
            >
              {i < current ? <CheckCircle2 className="w-3.5 h-3.5" /> : s.num}
            </button>
          ))}
        </div>
        <button
          onClick={() => setCurrent((c) => Math.min(STEPS.length - 1, c + 1))}
          disabled={current === STEPS.length - 1}
          className="flex items-center gap-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40 hover:bg-primary/90 transition-colors"
        >
          Next <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}