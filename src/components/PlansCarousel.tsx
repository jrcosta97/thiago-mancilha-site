import { motion } from 'framer-motion';
import {
  Check, MessageCircle, CalendarDays, Zap, Users, Globe2, Crown, ArrowRight,
} from 'lucide-react';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

const WHATSAPP_NUMBER = '5548988720439';

interface PlansCarouselProps {
  onCTAClick: () => void;
}

const plans = [
  {
    name: 'Presencial Individual',
    tagline: 'Acompanhamento 100% dedicado',
    price: 1500,
    badge: 'Mais Procurado',
    badgeColor: '!bg-accent !text-background',
    highlight: true,
    icon: Crown,
    image: '/assets/plano-presencial.jpg',
    features: [
      'Treino individual em estúdio equipado',
      'Prescrição adaptada à sua rotina',
      'Avaliação física detalhada na admissão',
      'Suporte WhatsApp diário (seg-sex)',
      'Check-in quinzenal com reajuste',
      'Registro evolutivo fotográfico',
    ],
    planTag: 'individual',
  },
  {
    name: 'Presencial em Dupla',
    tagline: 'Motivação compartilhada, economia real',
    price: 1000,
    suffix: '/pessoa',
    badge: 'Econômico',
    badgeColor: '!bg-blue-500/15 !text-blue-400 !border !border-blue-400/30',
    icon: Users,
    image: '/assets/plano-anual.jpg',
    features: [
      'Dupla de alunos (mesmo nível)',
      'Treino sincronizado + exercícios extras',
      'Avaliação física individualizada',
      'Suporte WhatsApp conjunto',
      'Check-in mensal por pessoa',
      'Metas compartilhadas ou separadas',
    ],
    planTag: 'dupla',
  },
  {
    name: 'Presencial 3x/Semana',
    tagline: 'Frequência ideal para resultados',
    price: 900,
    badge: 'Melhor Custo-Benefício',
    badgeColor: '!bg-accent-orange/15 !text-accent-orange !border !border-accent-orange/30',
    icon: CalendarDays,
    image: '/assets/extra.jpg',
    features: [
      '3 encontros presenciais semanais',
      'Roteiro para dias extra prescrito',
      'Avaliação física na admissão',
      'Suporte WhatsApp útil',
      'Reavaliação física a cada 2 meses',
      'Acompanhamento humanizado',
    ],
    planTag: '3x',
  },
  {
    name: 'Consultoria Online',
    tagline: 'Para todo o Brasil e exterior',
    price: 500,
    badge: 'Brasil Todo',
    badgeColor: '!bg-emerald-500/15 !text-emerald-400 !border !border-emerald-400/30',
    icon: Globe2,
    image: '/assets/plano-online.jpg',
    features: [
      'Planilha completa com vídeos demonstrativos',
      'Reajuste do treino mensal',
      'Feedback de execução por vídeo',
      'Check-ins quinzenais',
      'Supporte WhatsApp seg-sex',
      'Manual de hábitos e dicas alimentares',
    ],
    planTag: 'online',
  },
];

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const buildWhatsAppLink = (planName: string, price: number) => {
  const msg = `Olá Thiago! Vim do seu site e tenho interesse no plano ${planName} (${formatCurrency(price)}). Pode me explicar como funciona e se tem vaga disponível? Obrigado!`;
  return `https://api.whatsapp.com/send?phone=${encodeURIComponent(WHATSAPP_NUMBER)}&text=${encodeURIComponent(msg)}`;
};

export default function PlansCarousel({ onCTAClick }: PlansCarouselProps) {
  return (
    <div className="relative max-w-7xl mx-auto px-8 sm:px-12 lg:px-16">
      <Carousel
        opts={{
          align: 'start',
          loop: false,
          skipSnaps: false,
          dragFree: true,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2 sm:-ml-3 lg:-ml-4">
          {plans.map((plan, i) => {
            const Icon = plan.icon;
            return (
              <CarouselItem
                key={plan.name}
                className="basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4 p-2 sm:p-3 lg:p-4"
              >
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.55, delay: i * 0.09 }}
                  className="h-full flex min-w-0"
                >
                  <Card
                    className={`relative w-full h-full flex flex-col justify-between !rounded-3xl !bg-card overflow-hidden transition-all duration-300 ${
                      plan.highlight
                        ? '!border-accent/60 ring-2 ring-accent/40 shadow-[0_0_40px_rgba(204,255,0,0.18)] md:scale-[1.02] md:-translate-y-2'
                        : '!border-white/6 hover:!border-white/15 hover:!shadow-card'
                    }`}
                  >
                    <CardHeader className="!p-0 relative overflow-hidden">
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={plan.image}
                          alt={`Plano ${plan.name}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
                        <div className="absolute top-3 right-3 flex gap-2">
                          <Badge className={`h-6 px-3 text-[11px] font-bold uppercase tracking-wide shadow-md ${plan.badgeColor}`}>
                            {plan.highlight && <Zap className="w-3 h-3 mr-0.5" fill="currentColor" strokeWidth={0} />}
                            {plan.badge}
                          </Badge>
                        </div>
                        <div className="absolute bottom-3 left-4 flex items-center gap-2">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${plan.highlight ? 'bg-accent/20 text-accent border-accent/30' : 'bg-white/5 text-accent border-white/10'}`}>
                            <Icon className="w-4.5 h-4.5" strokeWidth={2.2} />
                          </div>
                        </div>
                      </div>

                      <div className="px-5 sm:px-6 pt-5 pb-3 space-y-1.5">
                        <CardTitle className="font-display font-black text-text-primary text-xl sm:text-2xl leading-tight">
                          {plan.name}
                        </CardTitle>
                        <CardDescription className="text-text-secondary text-sm sm:text-base leading-relaxed">
                          {plan.tagline}
                        </CardDescription>
                      </div>
                    </CardHeader>

                    <CardContent className="px-5 sm:px-6 pt-3 flex flex-col !gap-4 flex-1">
                      <div className="flex items-baseline gap-1">
                        <span className="font-display font-extrabold text-text-primary text-2xl lg:text-3xl tracking-tight whitespace-nowrap">
                          {formatCurrency(plan.price)}
                        </span>
                        {plan.suffix && (
                          <span className="text-text-muted text-xs sm:text-sm font-medium whitespace-nowrap">
                            {plan.suffix}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-text-muted uppercase tracking-widest">por mês</span>

                      <ul className="space-y-2.5 pt-2 flex-1">
                        {plan.features.map((f) => (
                          <li key={f} className="flex items-start gap-2.5 text-sm text-text-secondary leading-snug">
                            <div className="w-5 h-5 rounded-md bg-accent/15 flex items-center justify-center shrink-0 mt-0.5">
                              <Check className="w-3.5 h-3.5 text-accent" strokeWidth={3} />
                            </div>
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>

                    <CardFooter className="!mt-auto !px-0 !pb-0 !pt-0 flex-col !gap-0 !border-t-0 !bg-transparent">
                      <div className="px-5 sm:px-6 py-5 w-full flex flex-col gap-2.5 border-t border-white/5 mt-auto">
                        <a
                          href={buildWhatsAppLink(plan.name, plan.price)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group/button inline-flex shrink-0 items-center justify-center gap-2 w-full h-12 rounded-2xl px-4 text-sm font-extrabold bg-[#25D366] hover:bg-[#1ebe5b] text-white shadow-[0_6px_25px_rgba(37,211,102,0.45)] whitespace-nowrap outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px transition-all duration-200 [&_svg]:pointer-events-none [&_svg]:shrink-0"
                        >
                          <MessageCircle className="w-[18px] h-[18px]" strokeWidth={2.3} fill="currentColor" />
                          Quero esse plano
                          <ArrowRight className="w-4 h-4 group-hover/button:translate-x-0.5 transition-transform" strokeWidth={2.5} />
                        </a>
                        <button
                          onClick={onCTAClick}
                          type="button"
                          className="w-full h-11 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 bg-white/4 border border-white/8 text-slate-200 hover:bg-white/8 hover:border-accent/40 hover:text-accent transition-all duration-200 backdrop-blur"
                        >
                          <CalendarDays className="w-4 h-4" strokeWidth={2.2} />
                          Preencher Ficha de Avaliação
                        </button>
                      </div>
                    </CardFooter>
                  </Card>
                </motion.div>
              </CarouselItem>
            );
          })}
        </CarouselContent>

        <CarouselPrevious
          className="hidden md:inline-flex -left-2 lg:-left-6 xl:-left-10 !w-11 !h-11 !bg-card/95 !border-white/15 !text-text-primary hover:!bg-accent hover:!text-background hover:!border-accent/60 backdrop-blur-md shadow-lg"
          aria-label="Planos anteriores"
        />
        <CarouselNext
          className="hidden md:inline-flex -right-2 lg:-right-6 xl:-right-10 !w-11 !h-11 !bg-card/95 !border-white/15 !text-text-primary hover:!bg-accent hover:!text-background hover:!border-accent/60 backdrop-blur-md shadow-lg"
          aria-label="Próximos planos"
        />
      </Carousel>
    </div>
  );
}
