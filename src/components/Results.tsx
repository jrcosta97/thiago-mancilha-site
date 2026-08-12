import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Sparkles,
  Star,
  ArrowRight,
  CheckCircle2,
  Quote,
  MessageCircle,
  Award,
  CalendarCheck,
} from 'lucide-react';

type CaseKey = 'sergio' | 'gabriela';

interface IResultCase {
  key: CaseKey;
  tabLabel: string;
  image: string;
  resultTitle: string;
  profileLine: string;
  rating: number;
  testimony: string;
}

const cases: IResultCase[] = [
  {
    key: 'sergio',
    tabLabel: 'Sérgio, 58 anos',
    image: '/assets/cliente1.webp',
    resultTitle: '-19kg de forma sustentável em 10 meses',
    profileLine: 'Sérgio, 58 anos - Emagrecimento e Mobilidade',
    rating: 5,
    testimony:
      'Cheguei no Thiago com quase 100kg, dores no joelho e pressão alta controlada só com remédio. Em 10 meses recuperei a mobilidade que não tinha há anos, passei a dormir melhor e hoje jogo futebol com meu neto sem ficar ofegante. O melhor investimento que fiz na minha vida foi voltar a investir em mim.',
  },
  {
    key: 'gabriela',
    tabLabel: 'Gabriela, 33 anos',
    image: '/assets/cliente2.webp',
    resultTitle: '-14kg e fim do efeito sanfona em 8 meses',
    profileLine: 'Gabriela, 33 anos - Emagrecimento e Reeducação',
    rating: 5,
    testimony:
      'Passei por 5 nutricionistas e 3 academias antes de conhecer o trabalho do Thiago. Eu achava que para emagrecer teria que passar fome e odiar treinar. Hoje entendo meu corpo, treino com prazer e aprendi a manter o resultado sem dietas malucas.',
  },
];

const footerMetrics = [
  {
    icon: CalendarCheck,
    label: '100% Avaliação física gratuita',
  },
  {
    icon: Trophy,
    label: '20+ Casos de sucesso reais',
  },
  {
    icon: Award,
    label: '3+ Anos de atendimento prático',
  },
];

const WHATSAPP_NUMBER = '5548988720439';

const buildCTAWhatsAppLink = () => {
  const msg =
    'Olá Thiago! Vim do seu site e me identifiquei muito com os resultados dos seus alunos. Quero o meu resultado também! Pode me explicar como funciona a avaliação física gratuita? Obrigado!';
  return `https://api.whatsapp.com/send?phone=${encodeURIComponent(
    WHATSAPP_NUMBER
  )}&text=${encodeURIComponent(msg)}`;
};

export default function Results() {
  const [activeCase, setActiveCase] = useState<CaseKey>('sergio');
  const current = cases.find((c) => c.key === activeCase) ?? cases[0];
  const activeIdx = cases.findIndex((c) => c.key === activeCase);

  return (
    <section id="resultados" className="py-24 md:py-32 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-0 w-[500px] h-[500px] bg-accent-orange/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-20 right-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-12 space-y-5"
        >
          <span className="badge-chip mx-auto">
            <Trophy className="w-3.5 h-3.5" />
            PROVA SOCIAL · RESULTADOS REAIS
          </span>
          <h2 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl text-text-primary tracking-tight leading-tight">
            Pessoas reais. <span className="text-gradient">Vidas transformadas.</span>
          </h2>
          <p className="text-text-secondary text-lg leading-relaxed">
            Aqui não tem foto de banco de dados nem promessa milagrosa. Esses são alunos que
            confiaram no método e hoje colhem o resultado de uma saúde de verdade.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="w-full max-w-2xl mx-auto mb-10"
        >
          <div className="relative rounded-full p-1.5 bg-slate-800/40 border border-white/8 shadow-[0_10px_40px_rgba(0,0,0,0.25)]">
            <div
              className={`absolute top-1.5 bottom-1.5 w-[calc(50%-0.375rem)] rounded-full bg-gradient-to-r from-[#CCFF00] via-lime-300 to-emerald-400 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                activeCase === 'sergio' ? 'left-1.5' : 'left-[calc(50%+0.075rem)]'
              }`}
              style={{ boxShadow: '0 10px 30px rgba(204,255,0,0.55), 0 0 0 1px rgba(204,255,0,0.35) inset' }}
            />
            <div className="relative grid grid-cols-2 rounded-full">
              {cases.map((c) => {
                const isActive = activeCase === c.key;
                return (
                  <button
                    key={c.key}
                    onClick={() => setActiveCase(c.key)}
                    type="button"
                    aria-pressed={isActive}
                    className={`z-10 h-12 sm:h-13 rounded-full text-sm sm:text-base inline-flex items-center justify-center gap-2 transition-all duration-300 px-3 sm:px-5 ${
                      isActive
                        ? 'font-extrabold text-black tracking-tight'
                        : 'font-semibold text-white/60 hover:text-white/85'
                    }`}
                  >
                    <Sparkles
                      className={`w-4.5 h-4.5 sm:w-5 sm:h-5 shrink-0 ${
                        isActive ? 'text-black' : 'text-white/50'
                      }`}
                      strokeWidth={isActive ? 2.5 : 2.1}
                    />
                    <span className="truncate">{c.tabLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={current.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
            className="max-w-4xl mx-auto"
          >
            <div className="overflow-hidden rounded-2xl min-h-[520px] border border-white/6 bg-card shadow-card">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-0 items-stretch min-h-[520px]">
                <div className="order-1 md:order-1 relative">
                  <div className="relative w-full h-[480px] overflow-hidden rounded-t-2xl md:rounded-none md:rounded-l-2xl">
                    <img
                      src={current.image}
                      alt={`Resultado de ${current.tabLabel}`}
                      loading="lazy"
                      className="w-full h-[480px] object-cover object-top rounded-t-2xl md:rounded-none md:rounded-l-2xl"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-card/10 to-transparent pointer-events-none md:bg-gradient-to-r md:from-transparent md:via-transparent md:to-card rounded-t-2xl md:rounded-none md:rounded-l-2xl" />
                    <div className="absolute top-3 left-3">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/65 text-white backdrop-blur-md border border-white/10 text-xs sm:text-sm font-extrabold uppercase tracking-wide shadow-md">
                        <Trophy className="w-3.5 h-3.5 text-accent" strokeWidth={2.4} />
                        Resultado Real
                      </span>
                    </div>
                  </div>
                </div>

                <div className="order-2 md:order-2 p-5 sm:p-7 lg:p-9 flex flex-col gap-6 justify-center">
                  <div className="space-y-3">
                    <h3 className="font-display font-black text-text-primary text-2xl sm:text-3xl lg:text-4xl tracking-tight leading-tight">
                      {current.resultTitle}
                    </h3>
                    <p className="text-accent font-bold text-sm sm:text-base inline-flex items-center gap-2">
                      <Sparkles className="w-4 h-4" strokeWidth={2.2} />
                      {current.profileLine}
                    </p>
                  </div>

                  <div className="inline-flex items-center gap-2" aria-label={`Avaliação ${current.rating} de 5 estrelas`}>
                    <div className="inline-flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className="w-5 h-5 text-accent"
                          strokeWidth={0}
                          fill="currentColor"
                          aria-hidden="true"
                        />
                      ))}
                    </div>
                    <span className="text-sm font-bold text-text-secondary">
                      {current.rating}/5
                    </span>
                  </div>

                  <div className="relative rounded-3xl border border-white/8 bg-gradient-to-br from-white/[0.04] via-white/[0.02] to-transparent p-5 sm:p-6">
                    <div className="absolute -top-3.5 left-4 w-8 h-8 rounded-xl bg-accent flex items-center justify-center text-background shadow-neon">
                      <Quote className="w-4 h-4" strokeWidth={2.6} />
                    </div>
                    <p className="text-text-secondary text-sm sm:text-base leading-relaxed pt-1 italic">
                      &ldquo;{current.testimony}&rdquo;
                    </p>
                  </div>

                  <motion.a
                    whileHover={{ y: -1 }}
                    whileTap={{ y: 0 }}
                    href={buildCTAWhatsAppLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group/cta inline-flex shrink-0 items-center justify-center gap-2 w-full h-14 rounded-2xl px-5 text-sm sm:text-base font-extrabold bg-[#25D366] hover:bg-[#1ebe5b] text-white shadow-[0_10px_35px_rgba(37,211,102,0.45)] whitespace-nowrap outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px transition-all duration-200 [&_svg]:pointer-events-none [&_svg]:shrink-0"
                  >
                    <MessageCircle className="w-[20px] h-[20px]" strokeWidth={2.3} fill="currentColor" />
                    Quero o meu resultado
                    <ArrowRight className="w-4.5 h-4.5 group-hover/cta:translate-x-0.5 transition-transform" strokeWidth={2.5} />
                  </motion.a>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="mt-10 sm:mt-12 flex flex-wrap items-center justify-center gap-3 sm:gap-5">
          {footerMetrics.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.label}
                className="inline-flex items-center gap-2.5 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl border border-white/8 bg-card/80 backdrop-blur-sm"
              >
                <div className="w-9 h-9 rounded-xl bg-accent/15 flex items-center justify-center text-accent border border-accent/20 shrink-0">
                  <Icon className="w-4.5 h-4.5" strokeWidth={2.2} />
                </div>
                <span className="text-sm sm:text-base font-bold text-text-primary flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-accent" strokeWidth={2.5} />
                  {m.label}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex items-center justify-center gap-1.5">
          {cases.map((c, i) => (
            <button
              key={c.key}
              onClick={() => setActiveCase(c.key)}
              aria-label={`Selecionar caso ${c.tabLabel}`}
              className={`h-2.5 rounded-full transition-all ${
                i === activeIdx
                  ? 'w-10 bg-accent shadow-neon'
                  : 'w-2.5 bg-white/15 hover:bg-white/30'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
