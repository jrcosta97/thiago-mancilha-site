import type { ReactNode, CSSProperties, ImgHTMLAttributes } from 'react';
import { LazyMotion, MotionConfig, domAnimation, m, type Variants } from 'framer-motion';

/**
 * Linguagem de movimento do tema TM///: entradas rápidas, em diagonal, uma vez só.
 * Tudo anima apenas transform/opacity e respeita "reduzir movimento" do sistema.
 */

export const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Envolve a página: carrega só o pacote leve do Motion e liga o modo "reduzir movimento". */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation}>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}

type Direction = 'up' | 'diagonal' | 'left' | 'right';

const OFFSETS: Record<Direction, { x?: number; y?: number }> = {
  up: { y: 28 },
  diagonal: { x: -32, y: 18 },
  left: { x: -48 },
  right: { x: 48 },
};

interface RevealProps {
  children: ReactNode;
  direction?: Direction;
  delay?: number;
  duration?: number;
  className?: string;
  style?: CSSProperties;
  /** Fração do elemento que precisa estar visível para disparar (0–1). */
  amount?: number;
  /** Anima ao montar (topo da página) em vez de ao rolar até o elemento. */
  onMount?: boolean;
}

/** Entrada simples de um bloco ao aparecer na tela. */
export function Reveal({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.6,
  className,
  style,
  amount = 0.3,
  onMount = false,
}: RevealProps) {
  const from = { opacity: 0, ...OFFSETS[direction] };
  const to = { opacity: 1, x: 0, y: 0 };
  const transition = { duration, delay, ease: EASE_OUT };
  return onMount ? (
    <m.div className={className} style={style} initial={from} animate={to} transition={transition}>
      {children}
    </m.div>
  ) : (
    <m.div
      className={className}
      style={style}
      initial={from}
      whileInView={to}
      viewport={{ once: true, amount }}
      transition={transition}
    >
      {children}
    </m.div>
  );
}

const groupVariants = (stagger: number, delay: number): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren: delay } },
});

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -24, y: 16 },
  show: { opacity: 1, x: 0, y: 0, transition: { duration: 0.5, ease: EASE_OUT } },
};

interface StaggerProps {
  children: ReactNode;
  className?: string;
  stagger?: number;
  delay?: number;
  amount?: number;
  onMount?: boolean;
  as?: 'div' | 'ul' | 'nav';
  ariaLabel?: string;
}

/** Grupo cujos filhos <StaggerItem> entram em sequência. */
export function Stagger({ children, className, stagger = 0.08, delay = 0, amount = 0.2, onMount = false, as = 'div', ariaLabel }: StaggerProps) {
  const Comp = as === 'ul' ? m.ul : as === 'nav' ? m.nav : m.div;
  return (
    <Comp
      className={className}
      aria-label={ariaLabel}
      variants={groupVariants(stagger, delay)}
      initial="hidden"
      {...(onMount ? { animate: 'show' } : { whileInView: 'show', viewport: { once: true, amount } })}
    >
      {children}
    </Comp>
  );
}

export function StaggerItem({ children, className, as = 'div' }: { children: ReactNode; className?: string; as?: 'div' | 'li' }) {
  const Comp = as === 'li' ? m.li : m.div;
  return (
    <Comp className={className} variants={itemVariants}>
      {children}
    </Comp>
  );
}

/** Título que sobe palavra por palavra, cada uma saindo de trás de um recorte. */
export function WordsRise({
  text,
  className,
  delay = 0,
  stagger = 0.035,
}: {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
}) {
  const words = text.split(' ');
  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      {words.map((w, i) => (
        <span key={`${w}-${i}`} aria-hidden="true" className="inline-block overflow-hidden align-bottom pb-[0.08em] -mb-[0.08em]">
          <m.span
            className="inline-block"
            initial={{ y: '105%' }}
            animate={{ y: '0%' }}
            transition={{ duration: 0.55, delay: delay + i * stagger, ease: EASE_OUT }}
          >
            {w}
            {i < words.length - 1 ? ' ' : ''}
          </m.span>
        </span>
      ))}
    </span>
  );
}

/** "///" que aparece barra por barra. */
export function SlashesIn({ className = '', delay = 0, inView = false }: { className?: string; delay?: number; inView?: boolean }) {
  return (
    <span aria-hidden="true" className={`title-display text-brand-blue-text tracking-[-0.08em] inline-flex ${className}`}>
      {[0, 1, 2].map((i) => {
        const from = { opacity: 0, x: -10 };
        const to = { opacity: 1, x: 0 };
        const transition = { duration: 0.3, delay: delay + i * 0.09, ease: EASE_OUT };
        return inView ? (
          <m.span key={i} className="inline-block" initial={from} whileInView={to} viewport={{ once: true }} transition={transition}>/</m.span>
        ) : (
          <m.span key={i} className="inline-block" initial={from} animate={to} transition={transition}>/</m.span>
        );
      })}
    </span>
  );
}

/**
 * Faixa/bloco inclinado que entra deslizando.
 * A inclinação vai pelo Motion (skewX) para não ser apagada pelo transform da animação.
 */
export function SlabIn({
  className,
  skew,
  from = 'right',
  delay = 0,
  inView = false,
}: {
  className?: string;
  skew: number;
  from?: 'left' | 'right' | 'top';
  delay?: number;
  inView?: boolean;
}) {
  const start =
    from === 'top' ? { opacity: 0, y: -80, skewX: skew } : { opacity: 0, x: from === 'right' ? 160 : -160, skewX: skew };
  const end = { opacity: 1, x: 0, y: 0, skewX: skew };
  const transition = { duration: 0.75, delay, ease: EASE_OUT };
  return inView ? (
    <m.div aria-hidden="true" className={className} initial={start} whileInView={end} viewport={{ once: true }} transition={transition} />
  ) : (
    <m.div aria-hidden="true" className={className} initial={start} animate={end} transition={transition} />
  );
}

/** Cortina azul diagonal que sai de cima da foto, revelando a imagem. */
export function PhotoWipe({ delay = 0, inView = false }: { delay?: number; inView?: boolean }) {
  const start = { x: '0%', skewX: -14 };
  const end = { x: '135%', skewX: -14 };
  const transition = { duration: 0.85, delay, ease: [0.76, 0, 0.24, 1] as [number, number, number, number] };
  return inView ? (
    <m.div aria-hidden="true" className="absolute -inset-y-4 -left-[20%] w-[140%] bg-brand-blue z-10 pointer-events-none" initial={start} whileInView={end} viewport={{ once: true, amount: 0.3 }} transition={transition} />
  ) : (
    <m.div aria-hidden="true" className="absolute -inset-y-4 -left-[20%] w-[140%] bg-brand-blue z-10 pointer-events-none" initial={start} animate={end} transition={transition} />
  );
}

/** Imagem que assenta (leve zoom de saída) junto com a revelação. */
export function SettleImage(props: ImgHTMLAttributes<HTMLImageElement> & { delay?: number; inView?: boolean }) {
  const { delay = 0, inView = false, ...img } = props;
  const start = { scale: 1.12 };
  const end = { scale: 1 };
  const transition = { duration: 1.2, delay, ease: EASE_OUT };
  return inView ? (
    <m.img {...(img as object)} initial={start} whileInView={end} viewport={{ once: true }} transition={transition} />
  ) : (
    <m.img {...(img as object)} initial={start} animate={end} transition={transition} />
  );
}
