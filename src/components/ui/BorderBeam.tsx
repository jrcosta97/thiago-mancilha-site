import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface BorderBeamProps {
  children: ReactNode;
  className?: string;
  containerClassName?: string;
  size?: number;
  duration?: number;
  delay?: number;
  colorFrom?: string;
  colorTo?: string;
  borderWidth?: number;
  borderRadius?: number;
  pauseOnHover?: boolean;
}

export function BorderBeam({
  children,
  className,
  containerClassName,
  size = 220,
  duration = 6,
  delay = 0,
  colorFrom = '#a3e635',
  colorTo = '#84cc16',
  borderWidth = 1.8,
  borderRadius = 12,
  pauseOnHover = true,
}: BorderBeamProps) {
  return (
    <div
      className={cn(
        'relative inline-block isolate',
        containerClassName
      )}
      style={{
        borderRadius: `${borderRadius}px`,
      }}
    >
      <motion.div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-0 z-0 overflow-hidden',
          pauseOnHover && 'group-hover/beam:[animation-play-state:paused]',
          className
        )}
        style={{
          borderRadius: `${borderRadius}px`,
          mask: `linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)`,
          maskComposite: 'exclude',
          WebkitMaskComposite: 'xor',
          padding: `${borderWidth}px`,
        }}
      >
        <motion.div
          className="absolute left-1/2 top-1/2 origin-center will-change-transform"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            marginLeft: `-${size / 2}px`,
            marginTop: `-${size / 2}px`,
            background: `conic-gradient(from 0deg, transparent 0%, ${colorFrom} 25%, ${colorTo} 50%, transparent 75%, transparent 100%)`,
            filter: `blur(6px)`,
            opacity: 0.9,
          }}
          animate={{ rotate: 360 }}
          transition={{
            duration,
            ease: 'linear',
            repeat: Infinity,
            delay,
          }}
        />
        <motion.div
          className="absolute left-1/2 top-1/2 origin-center"
          style={{
            width: `${size * 0.55}px`,
            height: `${size * 0.55}px`,
            marginLeft: `-${(size * 0.55) / 2}px`,
            marginTop: `-${(size * 0.55) / 2}px`,
            background: `conic-gradient(from 180deg, transparent 0%, ${colorTo} 20%, ${colorFrom} 45%, transparent 70%, transparent 100%)`,
            filter: `blur(3px)`,
            opacity: 0.55,
          }}
          animate={{ rotate: -360 }}
          transition={{
            duration: duration * 1.4,
            ease: 'linear',
            repeat: Infinity,
            delay: delay + 0.25,
          }}
        />
      </motion.div>

      <div className="relative z-10">{children}</div>
    </div>
  );
}

export default BorderBeam;
