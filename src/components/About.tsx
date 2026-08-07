import { motion } from 'framer-motion';
import { GraduationCap, Medal, Target, UsersRound, CheckCircle2 } from 'lucide-react';

const highlights = [
  {
    icon: GraduationCap,
    title: 'Formação Acadêmica',
    text: 'Bacharelado em Educação Física + Pós-graduação em Fisiologia do Exercício',
  },
  {
    icon: Medal,
    title: 'Certificações',
    text: 'CREF ativo, especialista em Hipertrofia e Emagrecimento pela USP',
  },
  {
    icon: Target,
    title: 'Metodologia',
    text: 'Método 3P: Personalizado, Progressivo e Projetado para seu corpo',
  },
  {
    icon: UsersRound,
    title: 'Atendimento Humanizado',
    text: 'Acompanhamento próximo, suporte diário e ajustes semanais no treino',
  },
];

export default function About() {
  return (
    <section id="sobre" className="py-24 md:py-32 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/5 rounded-full blur-3xl pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">
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
                src="/assets/sobre.jpg"
                alt="Thiago Mancilha - Personal Trainer"
                className="w-full h-[520px] object-cover rounded-[2rem]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="absolute -bottom-6 -right-4 sm:-right-8 card-dark !bg-background p-5 shadow-neon max-w-xs"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="flex">
                  {[1,2,3,4,5].map((s) => (
                    <svg key={s} className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  ))}
                </div>
                <span className="text-xs text-text-secondary">Média de avaliações</span>
              </div>
              <p className="font-display font-bold text-text-primary text-3xl leading-none">
                98% <span className="text-accent text-base">de satisfação</span>
              </p>
              <p className="text-xs text-text-muted mt-1">Acompanhamento próximo em cada etapa</p>
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
              Olá, eu sou <span className="text-gradient">Thiago Macilha</span><br/>
              seu Personal Trainer.
            </h2>

            <p className="text-text-secondary text-lg leading-relaxed">
              Há mais de 8 anos ajudo pessoas comuns a transformarem seus corpos sem recorrer a medidas extremas. Meu método foi desenvolvido e validado na prática com mais de 500 alunos.
            </p>
            <p className="text-text-secondary text-base leading-relaxed">
              Acredito que saúde e performance caminham juntas: treinos inteligentes, periodização estratégica e apoio no que realmente importa. Não vendemos promessas, entregamos resultados mensuráveis.
            </p>

            <div className="grid sm:grid-cols-2 gap-4 pt-4">
              {highlights.map((h, i) => (
                <motion.div
                  key={h.title}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 * i }}
                  className="card-dark !bg-background-card/60 p-5 flex gap-4 hover:border-accent/30 transition-all group"
                >
                  <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center text-accent shrink-0 group-hover:scale-110 transition-transform">
                    <h.icon className="w-5 h-5" strokeWidth={2} />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-text-primary text-base">{h.title}</h4>
                    <p className="text-sm text-text-secondary mt-1 leading-relaxed">{h.text}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="flex flex-wrap gap-4 pt-4">
              {['Análise de biotipo', 'Reeducação alimentar', 'Suporte diário via app', 'Check-ins semanais'].map((i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-text-secondary">
                  <CheckCircle2 className="w-4 h-4 text-accent shrink-0" strokeWidth={2.5} />
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
