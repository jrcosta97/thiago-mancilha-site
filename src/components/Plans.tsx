import { Suspense, lazy } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

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
            className="relative w-full h-full flex flex-col !rounded-3xl !bg-card overflow-hidden border border-white/6 animate-pulse"
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
              <div className="h-12 w-full rounded-2xl bg-white/[0.05]" />
              <div className="h-11 w-full rounded-2xl bg-white/[0.03]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Plans({ onCTAClick }: PlansProps) {
  return (
    <section id="servicos" className="py-24 md:py-32 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-accent/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-16 space-y-5"
        >
          <span className="badge-chip mx-auto">
            <Sparkles className="w-3.5 h-3.5" />
            PLANOS & INVESTIMENTO
          </span>
          <h2 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl text-text-primary tracking-tight leading-tight">
            O investimento <span className="text-gradient">certo</span> para a sua saúde
          </h2>
          <p className="text-text-secondary text-lg leading-relaxed">
            Valores pensados para ser um compromisso com resultados sustentáveis. Nada de assinaturas abusivas,
            contratos longos ou pegadinhas — só acompanhamento humano, próximo e de verdade.
          </p>
        </motion.div>

        <Suspense fallback={<PlansSkeleton />}>
          <PlansCarousel onCTAClick={onCTAClick} />
        </Suspense>
      </div>
    </section>
  );
}
