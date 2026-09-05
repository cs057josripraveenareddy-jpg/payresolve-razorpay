import { getScoreGrade } from '@/lib/recovery-engine';
import { cn } from '@/lib/utils';

export default function ScoreBreakdown({ score }) {
  const { score: total, breakdown } = score;
  const grade = getScoreGrade(total);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative w-20 h-20 shrink-0">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="34" fill="none" stroke="hsl(222 30% 16%)" strokeWidth="6" />
            <circle
              cx="40" cy="40" r="34" fill="none"
              stroke={total >= 80 ? 'hsl(142 71% 45%)' : total >= 60 ? 'hsl(173 58% 45%)' : total >= 40 ? 'hsl(38 92% 50%)' : 'hsl(0 72% 51%)'}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${(total / 100) * 213.6} 213.6`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold font-heading tabular-nums">{total}</span>
            <span className="text-[9px] text-muted-foreground">/100</span>
          </div>
        </div>
        <div>
          <div className={cn('text-sm font-semibold', grade.color)}>{grade.label}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Grade {grade.grade}</div>
        </div>
      </div>

      <div className="space-y-2.5">
        {breakdown.map((b) => (
          <div key={b.factor}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">{b.factor}</span>
              <span className="font-medium tabular-nums">
                +{b.score.toString().padStart(2, '0')} <span className="text-muted-foreground">/ {b.weight}</span>
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${(b.score / b.weight) * 100}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground/70 mt-0.5">{b.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}