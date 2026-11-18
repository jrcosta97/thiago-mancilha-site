interface LogoMarkProps {
  className?: string;
  title?: string;
}

/** Monograma TM com as três barras. Vetor puro: não depende de fonte carregada. */
export function LogoMark({ className = 'h-8 w-auto', title = 'Thiago Mancilha' }: LogoMarkProps) {
  return (
    <svg viewBox="0 0 140 48" className={className} role="img" aria-label={title}>
      <g transform="translate(8 0) skewX(-12)">
        <path fill="#F2F4F8" d="M0 4h37v9H23.5v31h-10V13H0z" />
        <path fill="#F2F4F8" d="M42 44V4h12l9 20 9-20h12v40H74V24l-7.5 15h-7L52 24v20z" />
      </g>
      <g fill="#1446FF">
        <path d="M90 44h7l14-40h-7z" />
        <path d="M103 44h7l14-40h-7z" />
        <path d="M116 44h7l14-40h-7z" />
      </g>
    </svg>
  );
}

interface LogoProps {
  className?: string;
  compact?: boolean;
}

/** Assinatura completa: monograma + nome + "personal trainer". */
export default function Logo({ className = '', compact = false }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <LogoMark className={compact ? 'h-7 w-auto' : 'h-8 sm:h-9 w-auto'} />
      <span className="flex flex-col leading-none">
        <span className="title-display text-[1.25rem] sm:text-[1.4rem] text-brand-ink">Thiago Mancilha</span>
        <span className="mt-1 text-[0.62rem] font-semibold tracking-[0.32em] uppercase text-brand-muted">Personal trainer</span>
      </span>
    </span>
  );
}
