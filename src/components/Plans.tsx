import { Suspense, lazy } from 'react';
import SectionLabel from '@/components/brand/SectionLabel';
import { Reveal, SlabIn } from '@/components/motion/primitives';

const PlansCarousel = lazy(() => import('@/components/PlansCarousel'));

interface PlansProps {
  onCTAClick: () => void;
}

function PlansSkeleton() {
  return (
    <div
      className="relative max-w-7xl mx-auto px-8 sm:px-12 lg:px-16"
      aria-hidden="true"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="relative w-full h-full flex flex-col bg-brand-surface overflow-hidden border border-white/10 animate-pulse"
          >
            <div className="relative h-48 overflow-hidden bg-white/[0.04]">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent animate-[shimmer_1.6s_infinite]" />
            </div>
            <div className="px-5 sm:px-6 pt-5 pb-3 space-y-2.5">
              <div className="h-5 w-2/3 rounded-md bg-white/[0.05]" />
              <div className="h-3.5 w-full rounded-md bg-white/[0.04]" />
            </div>
            <div className="px-5 sm:px-6 pt-3 space-y-3">
              <div className="h-7 w-1/2 rounded-md bg-white/[0.05]" />
              <div className="space-y-2 pt-2">
                {[0, 1, 2, 3, 4].map((k) => (
                  <div key={k} className="h-3.5 w-[95%] rounded-md bg-white/[0.04]" />
                ))}
              </div>
            </div>
            <div className="mt-auto px-5 sm:px-6 py-5 w-full space-y-2.5 border-t border-white/5">
              <div className="h-12 w-full bg-white/[0.05]" />
              <div className="h-11 w-full bg-white/[0.03]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Plans({ onCTAClick }: PlansProps) {
  return (
    <section id="servicos" className="relative py-20 md:py-28 bg-brand-surface/40 border-t border-white/10 overflow-hidden scroll-mt-20">
      <SlabIn inView skew={-32} from="left" className="pointer-events-none absolute -left-20 top-0 w-[260px] h-[120px] bg-brand-blue/90 hidden md:block" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-3xl mb-12 md:mb-14 space-y-5">
          <SectionLabel>Planos &amp; Investimento</SectionLabel>
          <Reveal direction="diagonal">
          <h2 className="title-display text-5xl sm:text-6xl text-brand-ink">
            O investimento <span className="text-brand-blue-text">certo</span> para a sua saúde
          </h2>
          </Reveal>
          <Reveal delay={0.12}>
          <p className="text-brand-muted text-lg leading-relaxed">
            Valores pensados para ser um compromisso com resultados sustentáveis. Nada de assinaturas abusivas,
            contratos longos ou pegadinhas — só acompanhamento humano, próximo e de verdade.
          </p>
          </Reveal>
        </div>

        <Suspense fallback={<PlansSkeleton />}>
          <PlansCarousel onCTAClick={onCTAClick} />
        </Suspense>
      </div>
    </section>
  );
}
