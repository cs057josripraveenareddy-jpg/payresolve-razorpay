import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { ShieldCheck, ShieldX, Loader2, CheckCircle2, ArrowRight, Play } from 'lucide-react';
import { formatINR } from '@/lib/format';
import { cn } from '@/lib/utils';

const STEPS = [
  { key: 'safety', label: 'Safety Validation', desc: 'Checking financial safety rules' },
  { key: 'permitted', label: 'Action Permitted', desc: 'Recovery action approved by safety engine' },
  { key: 'executing', label: 'Executing Recovery', desc: 'Running Demo Simulation' },
  { key: 'simulated', label: 'Simulated Recovery', desc: 'Processing retry attempt' },
  { key: 'verifying', label: 'Verification', desc: 'Verifying recovery outcome' },
  { key: 'successful', label: 'Successful', desc: 'Revenue recovered' },
];

export default function RecoveryWorkflow({ payment, opportunity, onComplete, environment = 'demo_simulation' }) {
  const [phase, setPhase] = useState('idle'); // idle | running | done
  const [currentStep, setCurrentStep] = useState(-1);

  if (!opportunity.safety.allowed) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
        <div className="flex items-center gap-2 mb-2">
          <ShieldX className="w-5 h-5 text-destructive" />
          <span className="font-semibold text-destructive">BLOCKED</span>
        </div>
        <div className="space-y-1.5 mb-3">
          {opportunity.safety.blocks.map((b, i) => (
            <p key={i} className="text-sm text-foreground/90">❌ {b}</p>
          ))}
        </div>
        <div className="rounded-md bg-muted/50 p-3 border border-border">
          <p className="text-xs font-semibold text-muted-foreground mb-1">Recommended Alternative</p>
          <p className="text-sm text-foreground">{opportunity.safety.alternative}</p>
        </div>
      </div>
    );
  }

  const execute = async () => {
    setPhase('running');
    for (let i = 0; i < STEPS.length; i++) {
      setCurrentStep(i);
      if (i === 0) {
        await base44.entities.AuditLog.create({
          payment_id: payment.payment_id,
          action: 'safety_validation',
          details: 'Safety validation passed — action permitted',
          actor: 'safety_engine',
          category: 'safety',
        });
      }
      await new Promise((r) => setTimeout(r, 700));
      if (i === 2) {
        await base44.entities.AuditLog.create({
          payment_id: payment.payment_id,
          action: 'recovery_executed',
          details: `Recovery executed via ${environment === 'razorpay_test' ? 'Razorpay Test Mode' : 'Demo Simulation'}`,
          actor: 'recovery_engine',
          category: 'execution',
        });
      }
    }

    await base44.entities.Payment.update(payment.id, {
      recovered: true,
      recovery_status: 'successful',
      recovered_amount: payment.amount,
    });

    await base44.entities.RecoveryAction.create({
      payment_id: payment.payment_id,
      order_id: payment.order_id,
      action_type: opportunity.action.action,
      environment,
      ai_recommendation: opportunity.action.action,
      ai_confidence: 0,
      ai_reason: opportunity.action.reason,
      safety_status: 'allowed',
      safety_reasons: [],
      status: 'successful',
      revenue_recovered: payment.amount,
      executed_at: new Date().toISOString(),
      executed_by: 'demo_user',
    });

    await base44.entities.AuditLog.create({
      payment_id: payment.payment_id,
      action: 'recovery_successful',
      details: `Recovery successful — ${formatINR(payment.amount)} revenue recovered`,
      actor: 'recovery_engine',
      category: 'outcome',
    });

    setPhase('done');
    onComplete?.();
  };

  if (phase === 'done') {
    return (
      <div className="rounded-lg border border-success/30 bg-success/5 p-4 text-center">
        <CheckCircle2 className="w-8 h-8 text-success mx-auto mb-2" />
        <p className="font-semibold text-success text-lg">Recovery Successful</p>
        <p className="text-sm text-muted-foreground mt-1">{formatINR(payment.amount)} revenue recovered</p>
      </div>
    );
  }

  if (phase === 'running') {
    return (
      <div className="space-y-2.5">
        {STEPS.map((step, i) => (
          <div key={step.key} className="flex items-center gap-3">
            <div className={cn(
              'w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors',
              i < currentStep ? 'bg-success/20 text-success' : i === currentStep ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
            )}>
              {i < currentStep ? <CheckCircle2 className="w-4 h-4" /> : i === currentStep ? <Loader2 className="w-4 h-4 animate-spin" /> : <span className="text-xs">{i + 1}</span>}
            </div>
            <div className={cn('flex-1', i <= currentStep ? 'opacity-100' : 'opacity-40')}>
              <p className="text-sm font-medium">{step.label}</p>
              <p className="text-xs text-muted-foreground">{step.desc}</p>
            </div>
            {i < currentStep && <CheckCircle2 className="w-4 h-4 text-success" />}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/5 p-3">
        <ShieldCheck className="w-5 h-5 text-success shrink-0" />
        <div>
          <p className="text-sm font-semibold text-success">Safety Validation: ALLOWED</p>
          <p className="text-xs text-muted-foreground">All financial safety rules passed. Ready to execute.</p>
        </div>
      </div>
      <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
        <div>
          <p className="text-xs text-muted-foreground">Recovery Action</p>
          <p className="text-sm font-semibold">{opportunity.action.label}</p>
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground" />
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Revenue at Risk</p>
          <p className="text-sm font-semibold text-warning">{formatINR(payment.amount)}</p>
        </div>
      </div>
      <button
        onClick={execute}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        <Play className="w-4 h-4" />
        Execute Recovery — {environment === 'razorpay_test' ? 'Razorpay Test Mode' : 'Demo Simulation'}
      </button>
    </div>
  );
}