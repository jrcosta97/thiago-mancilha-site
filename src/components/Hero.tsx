import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Play, CheckCircle2 } from 'lucide-react';

interface HeroProps {
  onCTAClick: () => void;
}

export default function Hero({ onCTAClick }: HeroProps) {
  return (
    <section id="top" className="relative pt-32 pb-20 md:pt-44 md:pb-28 overflow-hidden container-hero">
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-10 -left-20 w-72 h-72 bg-accent/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-0 w-96 h-96 bg-accent-orange/15 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="space-y-7"
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="badge-chip w-fit"
            >
              <Sparkles className="w-3.5 h-3.5" />
              MÉTODO EXCLUSIVO DE TRANSFORMAÇÃO
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="font-display font-black text-text-primary leading-[1.05] tracking-tight text-4xl sm:text-5xl lg:text-6xl xl:text-7xl"
            >
              Transforme seu corpo com um método de treino{' '}
              <span className="text-gradient">100% individualizado</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="text-text-secondary text-lg sm:text-xl leading-relaxed max-w-xl"
            >
              Resultados reais em até 12 semanas. Queime gordura, construa massa muscular e recupere sua autoestima com um acompanhamento VIP pensado para você.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="flex flex-col sm:flex-row gap-4 pt-2"
            >
              <button onClick={onCTAClick} className="btn-primary text-base group">
                Quero Minha Avaliação Gratuita
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" strokeWidth={2.5} />
              </button>
              <button
                onClick={() => document.querySelector('#servicos')?.scrollIntoView({ behavior: 'smooth' })}
                className="btn-secondary text-base"
              >
                <Play className="w-5 h-5 text-accent" fill="currentColor" strokeWidth={0} />
                Ver Planos
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex flex-wrap gap-x-6 gap-y-3 pt-4 border-t border-white/5"
            >
              {[
                'Sem academia obrigatória',
                'Acompanhamento diário',
                'Resultado em 12 semanas',
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-text-secondary">
                  <CheckCircle2 className="w-4 h-4 text-accent" strokeWidth={2.5} />
                  {item}
                </div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.9, ease: 'easeOut', delay: 0.2 }}
            className="relative"
          >
            <div className="absolute -inset-4 bg-gradient-to-tr from-accent/30 via-transparent to-accent-orange/20 rounded-[2rem] blur-2xl" />
            <div className="relative rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl group">
              <img
                src="/assets/hero.jpg"
                alt="Personal Trainer em ação"
                className="w-full h-[480px] lg:h-[560px] object-cover rounded-[2rem] group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent rounded-[2rem]" />
            </div>

            <motion.div
              animate={{ y: [-8, 8, -8] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -left-4 top-16 card-dark !bg-background-card/95 backdrop-blur p-4 shadow-neon hidden sm:block"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-accent/15 flex items-center justify-center text-accent">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 5v14M18 5v14M2 10v4M22 10v4M6 9h12M6 15h12" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-text-secondary uppercase tracking-wide">Foco em</p>
                  <p className="font-display font-bold text-text-primary text-lg leading-tight">Alta Performance</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [8, -8, 8] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              className="absolute -right-3 bottom-10 card-dark !bg-background-card/95 backdrop-blur p-4 shadow-card hidden md:block"
            >
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-accent-orange border-2 border-background-card flex items-center justify-center text-[11px] font-bold text-background">
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-xs text-text-secondary uppercase tracking-wide">+500 alunos</p>
                  <p className="font-display font-bold text-accent">Transformados</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
