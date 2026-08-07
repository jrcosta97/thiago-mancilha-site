import { motion } from 'framer-motion';
import { Star, Quote, TrendingUp } from 'lucide-react';

const testimonials = [
  {
    name: 'Mariana Costa',
    role: '32 anos | Emagrecimento',
    image: '/assets/resultado-1.jpg',
    quote:
      'Perdi 18kg em 7 meses sem passar fome. Thiago não só me entregou um treino perfeito, como mudou minha relação com a comida e comigo mesma.',
    rating: 5,
    beforeAfter: '-18kg em 7 meses',
  },
  {
    name: 'Rodrigo Almeida',
    role: '28 anos | Ganho de Massa',
    image: '/assets/resultado-2.jpg',
    quote:
      'Ganhei 10kg de massa magra em 10 meses. A periodização e o acompanhamento mensal fazem toda a diferença. Melhor investimento que fiz esse ano.',
    rating: 5,
    beforeAfter: '+10kg de massa magra',
  },
  {
    name: 'Fernanda Tavares',
    role: '35 anos | Definição e Saúde',
    image: '/assets/resultado-3.jpg',
    quote:
      'Saí do sedentarismo para uma rotina consistente. Minha hipertensão melhorou, minha energia quadruplicou e finalmente me sinto forte e confiante.',
    rating: 5,
    beforeAfter: 'Sedentária → Atleta',
  },
];

export default function Results() {
  return (
    <section id="resultados" className="py-24 md:py-32 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent-orange/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-16 space-y-5"
        >
          <span className="badge-chip mx-auto">
            <TrendingUp className="w-3.5 h-3.5" />
            RESULTADOS REAIS
          </span>
          <h2 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl text-text-primary tracking-tight leading-tight">
            Histórias de pessoas que <span className="text-gradient">mudaram de vida</span>
          </h2>
          <p className="text-text-secondary text-lg leading-relaxed">
            Não são fotos de estoque. São alunos reais, treinos reais, resultados reais. Conheça algumas trajetórias incríveis.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {testimonials.map((t, i) => (
            <motion.article
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6, delay: i * 0.12 }}
              className="card-dark overflow-hidden group hover:border-accent/30 transition-all duration-500"
            >
              <div className="relative h-72 overflow-hidden">
                <img
                  src={t.image}
                  alt={`Resultado ${t.name}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background-card via-background-card/20 to-transparent" />

                <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background/70 backdrop-blur border border-white/10">
                  <TrendingUp className="w-3.5 h-3.5 text-accent" strokeWidth={2.5} />
                  <span className="text-xs font-bold text-text-primary">{t.beforeAfter}</span>
                </div>

                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex -space-x-1 mb-2">
                    {Array.from({ length: t.rating }).map((_, s) => (
                      <Star key={s} className="w-4 h-4 text-accent" fill="currentColor" stroke="currentColor" strokeWidth={1.5} />
                    ))}
                  </div>
                  <h4 className="font-display font-bold text-text-primary text-lg leading-tight">{t.name}</h4>
                  <p className="text-text-secondary text-sm">{t.role}</p>
                </div>
              </div>

              <div className="p-6 relative">
                <Quote className="absolute -top-4 right-6 w-8 h-8 text-accent/20" strokeWidth={1} />
                <p className="text-text-secondary text-sm leading-relaxed italic relative z-10">
                  "{t.quote}"
                </p>
                <div className="mt-5 pt-5 border-t border-white/5 flex items-center justify-between">
                  <span className="text-xs text-text-muted uppercase tracking-wide font-medium">
                    Caso real verificado
                  </span>
                  <span className="text-xs font-bold text-accent">+500 transformações</span>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
