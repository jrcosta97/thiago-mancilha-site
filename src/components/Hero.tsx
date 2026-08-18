import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, CheckCircle2, MessageCircle, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BlurText } from '@/components/ui/BlurText';
import { BorderBeam } from '@/components/ui/BorderBeam';

const WHATSAPP_NUMBER = '5548988720439';

interface HeroProps {
  onCTAClick: () => void;
}

export default function Hero({ onCTAClick }: HeroProps) {
  const whatsappMsg = encodeURIComponent(
    'Olá Thiago! Vim do seu site e quero começar minha transformação. Me chama aqui!'
  );
  const whatsappLink = `https://api.whatsapp.com/send?phone=${encodeURIComponent(WHATSAPP_NUMBER)}&text=${whatsappMsg}`;

  return (
    <section className="relative pt-32 pb-20 md:pt-44 md:pb-28 overflow-hidden container-hero">
      <div className="absolute inset-0 opacity-60 pointer-events-none">
        <div className="absolute top-24 -left-32 w-[500px] h-[500px] bg-lime-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-20 right-0 w-[500px] h-[500px] bg-lime-400/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-10 right-20 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
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
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <BlurText
                text="O BÁSICO QUE FUNCIONA"
                delay={0.05}
                animateBy="words"
                stagger={0.08}
                className="text-[0.72rem] font-extrabold tracking-[0.14em] uppercase text-[#CCFF00]"
              />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="font-display font-black text-text-primary leading-[1.12] tracking-tight text-3xl sm:text-4xl lg:text-5xl xl:text-6xl"
            >
              Do seu corpo atual ao objetivo que você quer alcançar, existe um{' '}
              <span className="bg-gradient-to-r from-lime-400 to-emerald-400 bg-clip-text text-transparent">
                método.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="text-text-secondary text-base sm:text-lg lg:text-xl leading-relaxed max-w-2xl"
            >
              Eu construo essa ponte através de <strong className="text-foreground font-semibold">estratégia</strong>,{' '}
              <strong className="text-foreground font-semibold">constância</strong> e{' '}
              <strong className="text-foreground font-semibold">propósito</strong>. Treino consciente para emagrecer
              com saúde, recuperar a mobilidade e viver melhor.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="flex flex-col gap-4 pt-2 lg:flex-row lg:flex-wrap lg:items-stretch"
            >
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="group/button w-full inline-flex lg:w-auto shrink-0 items-center justify-center gap-2.5 !h-14 !rounded-xl !px-7 !text-base !font-bold !bg-lime-500 hover:!bg-lime-400 !text-black !shadow-[0_0_25px_rgba(132,204,22,0.3)] hover:!shadow-[0_0_40px_rgba(132,204,22,0.45)] !transition-all border border-transparent bg-clip-padding whitespace-nowrap outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0"
              >
                <MessageCircle className="w-5 h-5 shrink-0" strokeWidth={2.5} fill="currentColor" />
                Falar com o Thiago no WhatsApp
                <ArrowRight className="w-5 h-5 shrink-0 group-hover:translate-x-1 transition-transform" strokeWidth={2.5} />
              </a>
              <BorderBeam
                size={220}
                duration={5.5}
                delay={0.2}
                borderRadius={12}
                borderWidth={1.8}
                colorFrom="#bef264"
                colorTo="#a3e635"
                containerClassName="w-full lg:w-auto lg:shrink-0"
              >
                <Button
                  onClick={onCTAClick}
                  size="lg"
                  className="!h-14 !rounded-xl !px-7 !text-base !font-bold !border !border-slate-700 hover:!border-lime-400 !bg-slate-900/50 hover:!bg-slate-900/70 !text-slate-200 hover:!text-lime-400 !backdrop-blur-md !shadow-none !transition-all !duration-300 !ease-out !active:translate-y-px !focus-visible:outline-none !focus-visible:ring-2 !focus-visible:ring-lime-400 !focus-visible:ring-offset-2 !focus-visible:ring-offset-[#0B0F17] w-full lg:w-auto whitespace-nowrap"
                  variant="outline"
                >
                  <Calendar className="w-4 h-4 shrink-0" strokeWidth={2.5} />
                  Agendar Avaliação Gratuita
                </Button>
              </BorderBeam>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55 }}
              className="pt-1"
            >
              <p className="text-sm sm:text-base text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-2">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-lime-400" strokeWidth={2.5} />
                  Atendimento 1:1 Presencial e On-line
                </span>
                <span className="hidden sm:inline-block text-white/20">|</span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-lime-400" strokeWidth={2.5} />
                  Especialista em Saúde do Idoso
                </span>
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.65 }}
              className="flex flex-wrap gap-x-6 gap-y-3 pt-5 border-t border-white/5"
            >
              {[
                'Ciência sem enrolação',
                'Foco em público 50+',
                'Resultados sustentáveis',
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
            <div className="absolute -inset-1 bg-gradient-to-tr from-lime-500/40 via-lime-400/20 to-emerald-400/30 rounded-[2rem] blur-2xl opacity-70" />
            <div className="absolute -inset-[2px] bg-gradient-to-br from-lime-400/60 via-transparent to-emerald-400/40 rounded-[2rem] opacity-80 pointer-events-none" />
            <div className="relative rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl group">
              <img
                src="/assets/hero.webp"
                alt="Treino funcional e saudável"
                className="w-full h-[480px] lg:h-[560px] object-cover rounded-[2rem] group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/85 via-background/30 to-transparent rounded-[2rem]" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
