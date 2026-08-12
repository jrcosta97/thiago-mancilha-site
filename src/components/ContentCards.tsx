import { motion } from 'framer-motion';
import {
  Brain, Sparkles, Pill, Users, BookOpen, Lightbulb, MessageCircle, ArrowRight,
} from 'lucide-react';

const WHATSAPP_NUMBER = '5548988720439';

const topics = [
  {
    tag: 'Público Maduro',
    title: 'Treino na Maturidade',
    subtitle: 'Autonomia, força e motivação depois dos 50.',
    icon: Users,
    accent: 'from-accent/20 via-accent/10 to-transparent',
    ring: 'border-accent/30',
    iconBg: 'bg-accent/15 text-accent border-accent/20',
    preview:
      'Como reconstruir massa muscular, recuperar mobilidade e vencer o sedentarismo com um protocolo simples, seguro e adaptado para articulações mais sensíveis.',
  },
  {
    tag: 'Análise Prática',
    title: 'Mounjaro, Ozempic e Emagrecimento',
    subtitle: 'O que a ciência diz e o que ninguém te conta.',
    icon: Pill,
    accent: 'from-accent-orange/20 via-accent-orange/10 to-transparent',
    ring: 'border-accent-orange/30',
    iconBg: 'bg-accent-orange/15 text-accent-orange border-accent-orange/20',
    preview:
      'Medicações podem ser ferramentas temporárias, mas sem treino de força e hábitos sustentáveis, o efeito sanfona é garantido. Entenda o papel real desse tratamento.',
  },
  {
    tag: 'Sem Frescura',
    title: 'Mitos da Musculação',
    subtitle: 'O básico que funciona vs. modismos da internet.',
    icon: Lightbulb,
    accent: 'from-blue-400/20 via-blue-400/10 to-transparent',
    ring: 'border-blue-400/30',
    iconBg: 'bg-blue-400/15 text-blue-400 border-blue-400/20',
    preview:
      'Jejum intermitente não derrete gordura sozinho, agachamento profundo não destrói joelhos, e 3 séries não são obrigatórias. Desconstruímos crenças populares com biomecânica e prática.',
  },
];

const buildWhatsAppLink = (subject: string) => {
  const msg = `Olá Thiago! Vi seu conteúdo sobre "${subject}" no site e quero entender como aplicar isso no meu treino. Pode me explicar melhor?`;
  return `https://api.whatsapp.com/send?phone=${encodeURIComponent(WHATSAPP_NUMBER)}&text=${encodeURIComponent(msg)}`;
};

export default function ContentCards() {
  return (
    <section id="conteudo" className="py-24 md:py-32 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-accent-orange/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-16 space-y-5"
        >
          <span className="badge-chip mx-auto">
            <BookOpen className="w-3.5 h-3.5" />
            CONTEÚDO & ANÁLISES
          </span>
          <h2 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl text-text-primary tracking-tight leading-tight">
            Ciência, biomecânica e <span className="text-gradient">sem frescura</span>
          </h2>
          <p className="text-text-secondary text-lg leading-relaxed">
            Explicações práticas baseadas em evidência e em 3+ anos atendendo todos os perfis.
            Meu compromisso é com o <span className="font-bold text-accent">&ldquo;básico que funciona&rdquo;</span> —
            não com promessas mirabolantes.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch mb-14">
          {topics.map((t, i) => (
            <motion.article
              key={t.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6, delay: i * 0.12 }}
              className={`relative card-dark !bg-gradient-to-br ${t.accent} group flex flex-col`}
            >
              <div className="absolute inset-0 rounded-3xl border border-white/5 pointer-events-none" />
              <div className="relative p-6 sm:p-7 flex flex-col flex-1">
                <div className={`${t.ring} inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-background-card/70 backdrop-blur mb-5 w-fit`}>
                  <Sparkles className="w-3 h-3 text-accent" strokeWidth={2.5} />
                  <span className="text-[11px] font-bold uppercase tracking-widest text-text-secondary">{t.tag}</span>
                </div>

                <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border flex items-center justify-center mb-5 shrink-0 ${t.iconBg}`}>
                  <t.icon className="w-7 h-7 sm:w-8 sm:h-8" strokeWidth={2} />
                </div>

                <h3 className="font-display font-black text-xl sm:text-2xl text-text-primary leading-tight mb-2">
                  {t.title}
                </h3>
                <p className="text-sm sm:text-base text-text-secondary leading-relaxed mb-3">
                  {t.subtitle}
                </p>
                <p className="text-sm text-text-secondary/90 leading-relaxed flex-1">
                  {t.preview}
                </p>

                <div className="mt-6 flex items-center justify-between gap-3 pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2 text-xs text-text-muted">
                    <Brain className="w-4 h-4 text-accent" strokeWidth={2} />
                    Análise prática · 3 min
                  </div>
                  <a
                    href={buildWhatsAppLink(t.title)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-accent hover:text-background text-text-primary hover:shadow-neon text-xs font-bold border border-white/10 hover:border-accent transition-all group"
                  >
                    Tirar dúvida
                    <MessageCircle className="w-3.5 h-3.5" strokeWidth={2.3} />
                  </a>
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative rounded-3xl border border-accent/30 bg-gradient-to-br from-accent/10 via-background-card to-background-card overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-80 h-80 bg-accent/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative p-6 sm:p-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="max-w-2xl flex-1 min-w-0">
              <p className="text-xs sm:text-sm uppercase tracking-widest font-black text-accent mb-2.5">
                Quer quebrar um mito específico?
              </p>
              <h3 className="font-display font-black text-2xl sm:text-3xl lg:text-4xl text-text-primary tracking-tight leading-tight">
                Mande sua dúvida — eu analiso e te respondo pessoalmente.
              </h3>
              <p className="text-sm sm:text-lg text-text-secondary mt-3 leading-relaxed">
                Pode ser sobre dor no joelho, emagrecimento lento, hipertrofia que estaca, medicações, treino para o pai/mãe, mobilidade… o que vier à cabeça.
              </p>
            </div>
            <a
              href={`https://api.whatsapp.com/send?phone=${encodeURIComponent(WHATSAPP_NUMBER)}&text=${encodeURIComponent(
                'Olá Thiago! Tenho uma dúvida sobre treino e queria te enviar para sua análise.\n\nMinha dúvida é: '
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2.5 px-7 sm:px-8 py-4 rounded-2xl font-extrabold text-base sm:text-lg bg-[#25D366] text-white hover:bg-[#1ebe5b] transition-all shadow-[0_10px_35px_rgba(37,211,102,0.55)] group"
            >
              <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
              Enviar minha dúvida agora
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" strokeWidth={2.8} />
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
