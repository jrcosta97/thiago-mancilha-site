import { WHATSAPP_NUMBER } from '@/lib/contact';
import { Reveal } from '@/components/motion/primitives';
import {
  MessageCircle, CalendarDays, Users, Globe2, Crown, ArrowRight,
} from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';



interface PlansCarouselProps {
  onCTAClick: () => void;
}

const plans = [
  {
    name: 'Plano Individual Presencial',
    tagline: 'A experiência mais personalizada',
    price: 1500,
    badge: 'Mais Procurado',
    highlight: true,
    icon: Crown,
    image: '/assets/plano-presencial.webp',
    features: [
      'Treino 100% individualizado e planejado de acordo com o objetivo do aluno',
      'Acompanhamento presencial durante toda a sessão',
      'Correção técnica e ajustes de execução em tempo real',
      'Maior controle de carga, intensidade, volume e progressão',
      'Adaptação imediata do treino conforme desempenho e limitações',
      'Estratégias específicas para hipertrofia, emagrecimento, condicionamento ou performance',
      'Acompanhamento mais próximo da evolução',
      'Ideal para quem busca atenção exclusiva, máxima personalização e evolução consistente',
    ],
    planTag: 'individual',
  },
  {
    name: 'Plano em Dupla',
    tagline: 'Treinar acompanhado sem abrir mão da personalização',
    price: 1000,
    suffix: '/pessoa',
    badge: 'Econômico',
    icon: Users,
    image: '/assets/plano-anual.webp',
    features: [
      'Treinamento para duas pessoas com acompanhamento presencial',
      'Possibilidade de adaptar exercícios e cargas individualmente para cada aluno',
      'Mais motivação e constância durante os treinos',
      'Torna o treinamento mais dinâmico e divertido',
      'Excelente opção para casal, amigos ou familiares',
      'Permite compartilhar a experiência sem transformar o treino em algo genérico',
      'Ótimo equilíbrio entre acompanhamento profissional, interação e investimento',
      'Ideal para quem gosta de treinar acompanhado e quer alguém para ajudar a manter a disciplina',
    ],
    planTag: 'dupla',
  },
  {
    name: 'Plano 3x por Semana',
    tagline: 'Para quem quer transformar o treino em rotina',
    price: 900,
    badge: 'Melhor Custo-Benefício',
    icon: CalendarDays,
    image: '/assets/extra.webp',
    features: [
      '3 sessões semanais com acompanhamento profissional',
      'Frequência ideal para criar consistência e estabelecer rotina',
      'Maior oportunidade de trabalhar diferentes grupos musculares e capacidades físicas',
      'Progressão planejada ao longo das semanas',
      'Mais estímulos para quem busca resultados estéticos e de performance',
      'Permite uma organização melhor da periodização',
      'Excelente equilíbrio entre frequência, acompanhamento e investimento',
      'Ideal para quem quer resultados sem precisar treinar todos os dias',
      'A opção com melhor relação entre investimento e acompanhamento',
    ],
    planTag: '3x',
  },
  {
    name: 'Consultoria Online',
    tagline: 'Seu treinamento planejado, onde quer que você esteja',
    price: 500,
    badge: 'Brasil Todo',
    icon: Globe2,
    image: '/assets/plano-online.webp',
    features: [
      'Avaliação inicial e definição clara dos objetivos',
      'Treinamento personalizado de acordo com o nível e objetivo do aluno',
      'Planejamento e periodização completos dos treinos',
      'Treinos organizados para academia, casa ou ambiente escolhido',
      'Vídeos e orientações para facilitar a execução dos exercícios',
      'Ajustes periódicos conforme evolução',
      'Acompanhamento da progressão de cargas e desempenho',
      'Maior flexibilidade para encaixar os treinos na rotina',
      'Ideal para quem já tem autonomia, mas quer um profissional planejando tudo',
      'Excelente para alunos que viajam ou possuem rotina variável',
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
    <div className="relative">
      <Carousel
        opts={{
          align: 'start',
          loop: false,
          skipSnaps: false,
          dragFree: true,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-3 lg:-ml-4">
          {plans.map((plan, i) => {
            const Icon = plan.icon;
            return (
              <CarouselItem
                key={plan.name}
                className="basis-[88%] sm:basis-1/2 lg:basis-1/3 xl:basis-1/4 pl-3 lg:pl-4 py-2"
              >
                <Reveal direction="diagonal" delay={i * 0.09} amount={0.15} className="h-full">
                <article
                  className={`relative h-full flex flex-col chamfer-sm bg-brand-surface border ${
                    plan.highlight ? 'border-brand-blue' : 'border-white/10'
                  }`}
                >
                  <div className="relative h-44 overflow-hidden">
                    <img
                      src={plan.image}
                      alt={`Plano ${plan.name}`}
                      className="photo-treated w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div aria-hidden="true" className="absolute inset-0 photo-tint" />
                    <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-brand-surface via-brand-surface/30 to-transparent" />
                    <span
                      className={`absolute top-4 right-0 pl-5 pr-4 py-1.5 text-[0.72rem] font-bold tracking-[0.16em] uppercase [clip-path:polygon(10px_0,100%_0,100%_100%,0_100%)] ${
                        plan.highlight ? 'bg-brand-blue text-white' : 'bg-brand-bg/90 text-brand-ink'
                      }`}
                    >
                      {plan.badge}
                    </span>
                    <span className={`absolute bottom-3 left-5 grid place-items-center w-10 h-10 border ${plan.highlight ? 'bg-brand-blue border-brand-blue text-white' : 'bg-brand-bg/80 border-white/20 text-brand-blue-text'}`}>
                      <Icon className="w-5 h-5" strokeWidth={2} aria-hidden="true" />
                    </span>
                  </div>

                  <div className="px-5 sm:px-6 pt-4 space-y-1.5">
                    <h3 className="title-display text-[1.75rem] text-brand-ink">{plan.name}</h3>
                    <p className="text-brand-muted text-base leading-snug">{plan.tagline}</p>
                  </div>

                  <div className="px-5 sm:px-6 pt-5 flex flex-col gap-4 flex-1">
                    <div className="pb-4 border-b border-white/10">
                      <div className="flex items-baseline gap-1.5">
                        <span className="title-display !not-italic text-[2.4rem] text-brand-ink whitespace-nowrap">
                          {formatCurrency(plan.price)}
                        </span>
                        {plan.suffix && (
                          <span className="text-brand-muted text-sm font-medium whitespace-nowrap">{plan.suffix}</span>
                        )}
                      </div>
                      <span className="text-xs font-semibold text-brand-subtle uppercase tracking-[0.2em]">por mês</span>
                    </div>

                    <ul className="space-y-2.5 flex-1">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-3 text-[0.95rem] text-brand-ink/85 leading-snug">
                          <span aria-hidden="true" className="mt-[0.45rem] w-2 h-2 shrink-0 bg-brand-blue-text skew-x-[-20deg]" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="px-5 sm:px-6 py-5 mt-5 flex flex-col gap-2.5 border-t border-white/10">
                    <a
                      href={buildWhatsAppLink(plan.name, plan.price)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-brand group w-full !text-[1.05rem] !px-4"
                    >
                      <MessageCircle className="w-5 h-5" strokeWidth={2.3} aria-hidden="true" />
                      Quero esse plano
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2.5} aria-hidden="true" />
                    </a>
                    <button onClick={onCTAClick} type="button" className="btn-outline-brand w-full !min-h-[2.9rem] !text-[0.95rem]">
                      <CalendarDays className="w-4 h-4 text-brand-blue-text" strokeWidth={2.2} aria-hidden="true" />
                      Preencher Ficha de Avaliação
                    </button>
                  </div>
                </article>
                </Reveal>
              </CarouselItem>
            );
          })}
        </CarouselContent>

        <div className="hidden md:flex justify-end gap-2 mt-6">
          <CarouselPrevious
            className="!static !translate-y-0 !w-12 !h-12 !rounded-none !bg-transparent !border-white/25 !text-brand-ink hover:!bg-brand-blue hover:!border-brand-blue"
            aria-label="Planos anteriores"
          />
          <CarouselNext
            className="!static !translate-y-0 !w-12 !h-12 !rounded-none !bg-transparent !border-white/25 !text-brand-ink hover:!bg-brand-blue hover:!border-brand-blue"
            aria-label="Próximos planos"
          />
        </div>
      </Carousel>
    </div>
  );
}
