import { motion } from 'framer-motion';
import { ArrowRight, Check, Crown, Rocket, Zap, User, Globe, CalendarClock } from 'lucide-react';

interface PlansProps {
  onCTAClick: (plan?: string) => void;
}

const plans = [
  {
    name: 'Consultoria Online',
    tagline: 'Treino de qualquer lugar',
    price: '297',
    period: '/mês',
    image: '/assets/plano-online.jpg',
    icon: Globe,
    accent: 'bg-blue-500/10 text-blue-400 border-blue-400/20',
    features: [
      'Acesso ao aplicativo exclusivo',
      'Treinos individualizados mensais',
      'Suporte via WhatsApp (dias úteis)',
      'Check-in quinzenal por vídeo',
      'Planilha de treino adaptável',
      'Biblioteca de vídeos demonstrativos',
    ],
    cta: 'Solicitar este Plano',
    featured: false,
  },
  {
    name: 'Personal Presencial',
    tagline: 'Atendimento VIP 1:1',
    price: '697',
    period: '/mês',
    image: '/assets/plano-presencial.jpg',
    icon: User,
    accent: 'bg-accent/10 text-accent border-accent/30',
    features: [
      'Atendimento presencial individual',
      '3 a 5 sessões semanais (50min)',
      'Prescrição de treino completa',
      'Acompanhamento em tempo real',
      'Orientação nutricional básica',
      'Check-ins físicos e circunferências',
      'Vagas limitadas (apenas 12 alunos)',
    ],
    cta: 'Solicitar este Plano',
    featured: true,
  },
  {
    name: 'Plano Anual Transformação',
    tagline: 'Transformação completa',
    price: '3.997',
    period: '/ano',
    image: '/assets/plano-anual.jpg',
    icon: Crown,
    accent: 'bg-accent-orange/10 text-accent-orange border-accent-orange/30',
    features: [
      '12 meses de acompanhamento',
      'Mentoria online + presencial',
      'Planejamento nutricional detalhado',
      'Suporte diário prioritário',
      'Análise de composição corporal mensal',
      'Protocolo de recuperação e sono',
      'Workshops e grupo VIP exclusivo',
    ],
    cta: 'Solicitar este Plano',
    featured: false,
  },
];

export default function Plans({ onCTAClick }: PlansProps) {
  return (
    <section id="servicos" className="py-24 md:py-32 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-16 space-y-5"
        >
          <span className="badge-chip mx-auto">
            <Rocket className="w-3.5 h-3.5" />
            NOSSOS PLANOS E SERVIÇOS
          </span>
          <h2 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl text-text-primary tracking-tight leading-tight">
            Escolha o formato que <span className="text-gradient">melhor combina com você</span>
          </h2>
          <p className="text-text-secondary text-lg leading-relaxed">
            Independentemente do seu nível — iniciante, intermediário ou atleta — temos uma solução personalizada para alcançar seu objetivo com eficiência.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: i * 0.12 }}
              className={`relative card-dark overflow-hidden flex flex-col ${
                plan.featured ? 'ring-2 ring-accent shadow-neon scale-[1.02] md:scale-105 z-10' : ''
              }`}
            >
              {plan.featured && (
                <div className="absolute top-5 right-5 z-10">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent text-background text-xs font-bold uppercase tracking-wide shadow-neon">
                    <Zap className="w-3.5 h-3.5" fill="currentColor" strokeWidth={0} />
                    Mais Popular
                  </span>
                </div>
              )}

              <div className="relative h-52 overflow-hidden">
                <img
                  src={plan.image}
                  alt={plan.name}
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background-card via-background-card/40 to-transparent" />
                <div className={`absolute top-5 left-5 w-12 h-12 rounded-xl border ${plan.accent} flex items-center justify-center backdrop-blur`}>
                  <plan.icon className="w-6 h-6" strokeWidth={2} />
                </div>
              </div>

              <div className="p-7 flex flex-col flex-1">
                <div className="mb-5">
                  <p className="text-xs text-text-secondary uppercase tracking-wider font-medium">{plan.tagline}</p>
                  <h3 className="font-display font-bold text-2xl text-text-primary mt-1">{plan.name}</h3>
                </div>

                <div className="mb-6 flex items-end gap-1">
                  <span className="text-text-secondary text-base font-medium">R$</span>
                  <span className="font-display font-black text-5xl text-text-primary tracking-tight leading-none">
                    {plan.price}
                  </span>
                  <span className="text-text-muted text-base mb-1.5">{plan.period}</span>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-full ${plan.featured ? 'bg-accent/20 text-accent' : 'bg-accent/10 text-accent'} flex items-center justify-center shrink-0 mt-0.5`}>
                        <Check className="w-3 h-3" strokeWidth={3.5} />
                      </div>
                      <span className="text-sm text-text-secondary leading-relaxed">{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => onCTAClick(plan.name)}
                  className={`w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold transition-all group ${
                    plan.featured
                      ? 'bg-accent text-background hover:bg-accent-hover shadow-neon'
                      : 'bg-white/5 text-text-primary border border-white/10 hover:border-accent hover:text-accent hover:bg-accent/5'
                  }`}
                >
                  {plan.cta}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" strokeWidth={2.5} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-sm text-text-muted mt-10"
        >
          <CalendarClock className="w-4 h-4 inline mr-2 -mt-0.5 text-accent" strokeWidth={2} />
          Todos os planos incluem Avaliação Inicial Gratuita. Sem fidelidade. Cancele quando quiser.
        </motion.p>
      </div>
    </section>
  );
}
