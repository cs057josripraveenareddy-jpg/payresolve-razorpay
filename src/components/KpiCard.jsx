import { cn } from '@/lib/utils';

const accentClasses = {
  default: 'text-foreground',
  primary: 'text-primary',
  success: 'text-success',
  warning: 'text-warning',
  destructive: 'text-destructive',
  accent: 'text-accent',
};

const iconBgClasses = {
  default: 'bg-muted',
  primary: 'bg-primary/15',
  success: 'bg-success/15',
  warning: 'bg-warning/15',
  destructive: 'bg-destructive/15',
  accent: 'bg-accent/15',
};

export default function KpiCard({ label, value, sublabel, icon: Icon, accent = 'default' }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-border/80">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
        {Icon && (
          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', iconBgClasses[accent])}>
            <Icon className={cn('w-4 h-4', accentClasses[accent])} />
          </div>
        )}
      </div>
      <div className={cn('text-2xl font-bold font-heading tabular-nums', accentClasses[accent])}>{value}</div>
      {sublabel && <p className="text-xs text-muted-foreground mt-1">{sublabel}</p>}
    </div>
  );
}