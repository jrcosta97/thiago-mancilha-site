import { motion } from 'framer-motion';
import {
  GraduationCap, Medal, Sparkles, Award, Dumbbell,
  BookOpen, CheckCircle2, FileCheck, Activity, Heart, UsersRound, CalendarDays,
} from 'lucide-react';

const academicEducation = [
  {
    icon: GraduationCap,
    title: 'Bacharelado + Licenciatura',
    text: 'Educação Física pela UniNorte (formação dupla)',
  },
  {
    icon: Activity,
    title: 'Pós-graduação',
    text: 'Fisiologia do Exercício (prescrição baseada em evidência)',
  },
  {
    icon: Heart,
    title: 'Pós-graduação',
    text: 'Gerontologia e Psicomotricidade Motora (público maduro)',
  },
];

const certifications = [
  {
    icon: FileCheck,
    title: 'Análise de Movimentos na Musculação',
  },
  {
    icon: Award,
    title: 'Avaliação Física',
  },
  {
    icon: Dumbbell,
    title: 'Hipertrofia Muscular na Prática',
  },
  {
    icon: UsersRound,
    title: 'Competências Sócio-emocionais na Educação Esportiva',
  },
];

export default function About() {
  return (
    <section id="sobre" className="py-24 md:py-32 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/5 rounded-full blur-3xl pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-start">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8 }}
            className="relative order-2 lg:order-1"
          >
            <div className="absolute -top-4 -left-4 w-full h-full rounded-[2rem] border-2 border-accent/30" />
            <div className="relative rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl">
              <img
                src="/assets/sobre.webp"
                alt="Thiago Mancilha Reis - Personal Trainer CREF 008289-G/AM"
                className="w-full h-[560px] sm:h-[620px] object-cover rounded-[2rem]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-background/10 to-transparent" />
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.25 }}
              className="absolute -bottom-6 left-4 sm:left-8 right-4 sm:right-auto p-5 rounded-2xl sm:max-w-sm shadow-neon glass-effect bg-slate-900/60 backdrop-blur-md border border-slate-800 hover:border-lime-500/30 transition-all duration-300 ease-out"
              style={{
                WebkitBackdropFilter: 'blur(12px)',
                backgroundColor: 'rgba(15, 23, 42, 0.6)',
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-[11px] font-bold uppercase tracking-widest">
                  <Award className="w-3.5 h-3.5" strokeWidth={2.5} />
                  CREF 008289-G/AM
                </span>
              </div>
              <blockquote className="text-text-primary font-display font-bold text-lg sm:text-xl leading-snug">
                &ldquo;Seu objetivo é o ponto de partida. A sua evolução é o nosso processo.&rdquo;
              </blockquote>
              <p className="text-xs text-text-muted mt-3">
                — Thiago Mancilha Reis
              </p>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8 }}
            className="space-y-6 order-1 lg:order-2"
          >
            <span className="badge-chip w-fit">
              <Medal className="w-3.5 h-3.5" />
              SOBRE O PROFISSIONAL
            </span>

            <h2 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl text-text-primary leading-tight tracking-tight">
              <span className="text-white">Olá, eu sou</span>{' '}
              <span className="text-accent">Thiago Mancilha</span>{' '}
              <span className="text-text-primary">Reis</span>
            </h2>
            <p className="text-text-primary font-bold text-base sm:text-lg">
              Educação Física · Bacharel e Licenciado (UniNorte) · CREF 008289-G/AM
            </p>

            <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-accent/30 bg-accent/5 text-accent font-bold text-sm sm:text-base">
              <Sparkles className="w-4.5 h-4.5" strokeWidth={2.5} />
              O básico que funciona.
            </div>

            <p className="text-text-secondary text-base sm:text-lg leading-relaxed">
              Com mais de 3 anos de experiência, transformar um corpo vai muito além de prescrever exercícios.
              Meu propósito é ajudar cada aluno a <span className="font-semibold text-text-primary">acreditar no próprio potencial</span> e
              superar limitações com um acompanhamento próximo, humano e baseado em ciência.
            </p>
            <p className="text-text-secondary text-base leading-relaxed">
              Foco em <span className="font-semibold text-text-primary">saúde funcional, estética consciente, mobilidade e emagrecimento sem exageros</span> —
              atendendo especialmente quem é sedentário, está acima do peso ou busca autonomia e motivação na maturidade.
            </p>

            <div className="space-y-4 pt-3">
              <div>
                <h4 className="inline-flex items-center gap-2 font-display font-black text-text-primary text-base sm:text-lg mb-3.5">
                  <GraduationCap className="w-5 h-5 text-accent" strokeWidth={2.2} />
                  Formação Acadêmica
                </h4>
                <div className="grid sm:grid-cols-1 gap-3">
                  {academicEducation.map((h, i) => (
                    <motion.div
                      key={h.title}
                      initial={{ opacity: 0, y: 15 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.06 * i }}
                      className="p-4 sm:p-5 flex gap-4 rounded-2xl glass-effect bg-slate-900/60 backdrop-blur-md border border-slate-800 hover:border-lime-500/30 transition-all duration-300 ease-out group"
                      style={{
                        WebkitBackdropFilter: 'blur(12px)',
                      }}
                    >
                      <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center text-accent shrink-0 group-hover:scale-110 transition-transform">
                        <h.icon className="w-5 h-5" strokeWidth={2} />
                      </div>
                      <div>
                        <h5 className="font-display font-bold text-text-primary text-sm sm:text-base leading-snug">{h.title}</h5>
                        <p className="text-xs sm:text-sm text-text-secondary mt-1 leading-relaxed">{h.text}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="inline-flex items-center gap-2 font-display font-black text-text-primary text-base sm:text-lg mb-3.5 mt-5">
                  <BookOpen className="w-5 h-5 text-accent" strokeWidth={2.2} />
                  Certificações
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {certifications.map((c) => (
                    <div
                      key={c.title}
                      className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-white/5 border border-white/5"
                    >
                      <CheckCircle2 className="w-4.5 h-4.5 text-accent shrink-0 mt-0.5" strokeWidth={2.5} />
                      <span className="text-xs sm:text-sm text-text-secondary leading-relaxed font-medium">
                        {c.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-4">
              {[
                'Acompanhamento 1:1 próximo',
                'Atendemos público maduro / idosos',
                'Sem exageros, sem promessas',
                'Avaliação física detalhada',
              ].map((i) => (
                <div key={i} className="flex items-center gap-2 text-xs sm:text-sm text-text-secondary bg-white/5 border border-white/5 px-3 py-2 rounded-lg">
                  <CalendarDays className="w-4 h-4 text-accent shrink-0" strokeWidth={2} />
                  {i}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
