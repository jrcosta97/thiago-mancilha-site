import type { ReactNode } from 'react';
import { m } from 'framer-motion';
import { SlashesIn, EASE_OUT } from '@/components/motion/primitives';

export function Slashes({ className = '' }: { className?: string }) {
  return (
    <span aria-hidden="true" className={`title-display text-brand-blue-text tracking-[-0.08em] ${className}`}>///</span>
  );
}

/** Rótulo de seção "/// TEXTO". As barras entram uma a uma quando o rótulo aparece na tela. */
export default function SectionLabel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <p className={`section-label ${className}`}>
      <SlashesIn className="text-base" inView />
      <m.span
        className="inline-block"
        initial={{ opacity: 0, x: -14 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.45, delay: 0.22, ease: EASE_OUT }}
      >
        {children}
      </m.span>
    </p>
  );
}
