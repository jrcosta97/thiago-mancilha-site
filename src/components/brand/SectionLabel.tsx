import type { ReactNode } from 'react';

export function Slashes({ className = '' }: { className?: string }) {
  return (
    <span aria-hidden="true" className={`title-display text-brand-blue-text tracking-[-0.08em] ${className}`}>///</span>
  );
}

export default function SectionLabel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <p className={`section-label ${className}`}>
      <Slashes className="text-base" />
      <span>{children}</span>
    </p>
  );
}
