import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Loader2, Sparkles, ShieldCheck, ShieldX, AlertTriangle, Clock } from 'lucide-react';
import ScoreBreakdown from './ScoreBreakdown';
import RecoveryWorkflow from './RecoveryWorkflow';
import { useAuditLogs } from '@/hooks/usePayResolve';
import { formatINR, formatDateTime, timeAgo } from '@/lib/format';
import { getStatusBadgeClass, getMethodLabel, getFailureLabel } from '@/lib/recovery-ui';
import { cn } from '@/lib/utils';

function Section({ title, children, icon: Icon }) {
  return (
    <div className="border-b border-border pb-5 last:border-0">
      <div className="flex items-center gap-2 mb-3">
        {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function FactRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  );
}

export default function PaymentDrawer({ payment, opportunity, onClose, onRecovered, environment }) {
  const [aiState, setAiState] = useState({ status: 'idle', data: null });
  const [aiError, setAiError] = useState(null);
  const { logs, reload: reloadLogs } = useAuditLogs(payment?.payment_id);

  if (!payment || !opportunity) return null;

  const getAI = async () => {
    setAiState({ status: 'loading', data: null });
    setAiError(null);
    try {
      const res = await base44.functions.invoke('aiRecommendation', {
        payment,
        eligibility: opportunity.eligibility,
        score: opportunity.score.score,
        action: opportunity.action,
        safety: opportunity.safety,
      });
      setAiState({ status: 'done', data: res.data.recommendation });
    } catch (e) {
      setAiError(e.message || 'Failed to get AI recommendation');
      setAiState({ status: 'idle', data: null });
    }
  };

  const handleRecovered = () => {
    reloadLogs();
    onRecovered?.();
  };

  const ai = aiState.data;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-xl bg-card border-l border-border z-50 flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="font-heading font-bold text-lg">{payment.payment_id}</h2>
              <p className="text-xs text-muted-foreground">{payment.order_id} · {payment.customer_name}</p>
            </div>
            <span className={cn('px-2 py-0.5 rounded-md text-xs font-semibold border', getStatusBadgeClass(payment.recovery_status))}>
              {payment.recovery_status}
            </span>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-5 space-y-5">
          <Section title="Payment Facts" icon={Clock}>
            <div className="rounded-lg border border-border bg-muted/20 p-3">
              <FactRow label="Amount" value={formatINR(payment.amount)} />
              <FactRow label="Method" value={getMethodLabel(payment.payment_method)} />
              <FactRow label="Status" value={<span className="capitalize">{payment.status}</span>} />
              <FactRow label="Customer" value={payment.customer_name} />
              <FactRow label="Created" value={timeAgo(payment.created_at)} />
            </div>
          </Section>

          <Section title="Failure Analysis" icon={AlertTriangle}>
            <div className="rounded-lg border border-border bg-muted/20 p-3">
              <FactRow label="Category" value={getFailureLabel(payment.failure_category)} />
              <FactRow label="Reason" value={payment.failure_reason || '—'} />
              <FactRow label="Retry Count" value={`${payment.retry_count} / 3`} />
              <FactRow label="Previous Retry" value={<span className="capitalize">{payment.previous_retry_result}</span>} />
              <FactRow label="Refund Status" value={<span className="capitalize">{payment.refund_status}</span>} />
            </div>
          </Section>

          <Section title="Revenue at Risk" icon={AlertTriangle}>
            <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
              <p className="text-xs text-muted-foreground mb-1">Revenue at Risk</p>
              <p className="text-2xl font-bold font-heading text-warning">{formatINR(payment.amount)}</p>
              <p className="text-xs text-muted-foreground mt-2">
                {opportunity.recoverable
                  ? '✅ Potentially recoverable — eligible for automated recovery'
                  : '❌ Not automatically recoverable — see safety validation'}
              </p>
            </div>
          </Section>

          <Section title="Recovery Score" icon={Sparkles}>
            <ScoreBreakdown score={opportunity.score} />
          </Section>

          <Section title="AI Recommendation" icon={Sparkles}>
            {aiState.status === 'idle' && (
              <button
                onClick={getAI}
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm font-semibold text-primary hover:bg-primary/20 transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                Get AI Recommendation
              </button>
            )}
            {aiState.status === 'loading' && (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                AI is analyzing payment...
              </div>
            )}
            {aiError && (
              <p className="text-sm text-destructive">{aiError}</p>
            )}
            {ai && (
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 p-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Recommended Action</p>
                    <p className="text-sm font-semibold capitalize">{ai.recommended_action.replace(/_/g, ' ')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Confidence</p>
                    <p className="text-lg font-bold text-primary tabular-nums">{ai.confidence}%</p>
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Why this action?</p>
                    <p className="text-sm">{ai.reason}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Why not alternative?</p>
                    <p className="text-sm">{ai.why_not_alternative}</p>
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-muted/20 p-3">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Customer Message</p>
                  <p className="text-sm italic">{ai.customer_message}</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/20 p-3">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Merchant Guidance</p>
                  <p className="text-sm">{ai.merchant_guidance}</p>
                </div>
              </div>
            )}
          </Section>

          <Section title="Safety Validation" icon={opportunity.safety.allowed ? ShieldCheck : ShieldX}>
            <div className={cn(
              'rounded-lg border p-4',
              opportunity.safety.allowed ? 'border-success/30 bg-success/5' : 'border-destructive/30 bg-destructive/5'
            )}>
              <div className="flex items-center gap-2 mb-2">
                {opportunity.safety.allowed
                  ? <ShieldCheck className="w-5 h-5 text-success" />
                  : <ShieldX className="w-5 h-5 text-destructive" />}
                <span className={cn('font-semibold', opportunity.safety.allowed ? 'text-success' : 'text-destructive')}>
                  {opportunity.safety.allowed ? 'ALLOWED' : 'BLOCKED'}
                </span>
              </div>
              {opportunity.safety.allowed ? (
                <p className="text-sm text-muted-foreground">All financial safety rules passed. AI recommendation permitted.</p>
              ) : (
                <div className="space-y-1">
                  {opportunity.safety.blocks.map((b, i) => (
                    <p key={i} className="text-sm text-foreground/90">❌ {b}</p>
                  ))}
                  <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-destructive/20">
                    AI cannot override financial safety rules.
                  </p>
                </div>
              )}
            </div>
          </Section>

          <Section title="Recovery Action" icon={ShieldCheck}>
            <RecoveryWorkflow
              payment={payment}
              opportunity={opportunity}
              onComplete={handleRecovered}
              environment={environment}
            />
          </Section>

          <Section title="Audit Timeline" icon={Clock}>
            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No audit events yet. Execute recovery to generate audit trail.</p>
            ) : (
              <div className="space-y-2">
                {logs.map((log) => (
                  <div key={log.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                      <div className="w-px h-full bg-border" />
                    </div>
                    <div className="pb-3">
                      <p className="text-sm font-medium capitalize">{log.action.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-muted-foreground">{log.details}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-0.5">{formatDateTime(log.created_date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>
      </div>
    </>
  );
}