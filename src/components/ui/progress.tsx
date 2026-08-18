import * as React from 'react';
import { cn } from '@/lib/utils';

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
}

function Progress({ className, value, ...props }: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      data-slot="progress"
      className={cn(
        'bg-slate-800/60 relative h-2 w-full overflow-hidden rounded-full',
        className
      )}
      {...props}
    >
      <div
        data-slot="progress-indicator"
        className="h-full w-full flex-1 bg-gradient-to-r from-[#CCFF00] via-lime-400 to-emerald-400 shadow-[0_0_16px_rgba(204,255,0,0.45)] transition-all duration-500 ease-out"
        style={{ transform: `translateX(-${100 - clamped}%)` }}
      />
    </div>
  );
}

export { Progress };
