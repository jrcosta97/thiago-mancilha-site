import { motion } from 'framer-motion';
import { Users, Award, TrendingUp, Star } from 'lucide-react';

const metrics = [
  {
    icon: Users,
    value: '+500',
    label: 'Alunos Atendidos',
    desc: 'Por todo o Brasil',
  },
  {
    icon: Award,
    value: '+8',
    label: 'Anos de Experiência',
    desc: 'Formação acadêmica',
  },
  {
    icon: TrendingUp,
    value: '98%',
    label: 'Taxa de Satisfação',
    desc: 'Pesquisa interna',
  },
  {
    icon: Star,
    value: '5.0',
    label: 'Avaliação Geral',
    desc: '5/5 estrelas',
  },
];

export default function Metrics() {
  return (
    <section className="py-10 relative -mt-4 md:mt-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="card-dark !rounded-3xl !bg-gradient-to-br !from-background-card via-background-card to-background-card/60 p-6 md:p-8 border border-white/5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 divide-y-2 divide-white/5 lg:divide-y-0 lg:divide-x-2">
            {metrics.map((m, i) => (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="flex items-center justify-center gap-4 py-3 lg:py-0 lg:px-6 first:pt-0 last:pb-0 lg:first:pl-0 lg:last:pr-0"
              >
                <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center text-accent border border-accent/20 shrink-0">
                  <m.icon className="w-7 h-7" strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <p className="font-display font-black text-3xl md:text-4xl text-text-primary tracking-tight leading-none">
                    {m.value}
                  </p>
                  <p className="font-semibold text-text-primary text-sm md:text-base mt-1">
                    {m.label}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">{m.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
