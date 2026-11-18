import { WHATSAPP_NUMBER } from '@/lib/contact';
import { MessageCircle, CalendarDays, ArrowRight, MapPin, HeartPulse } from 'lucide-react';
import { Reveal, Stagger, StaggerItem, WordsRise, SlashesIn, SlabIn, PhotoWipe, SettleImage } from '@/components/motion/primitives';

interface HeroProps {
  onCTAClick: () => void;
}

const pillars = ['Ciência sem enrolação', 'Foco em público 50+', 'Resultados sustentáveis'];

export default function Hero({ onCTAClick }: HeroProps) {
  const whatsappMsg = encodeURIComponent(
    'Olá Thiago! Vim do seu site e quero começar minha transformação. Me chama aqui!'
  );
  const whatsappLink = `https://api.whatsapp.com/send?phone=${encodeURIComponent(WHATSAPP_NUMBER)}&text=${whatsappMsg}`;

  return (
    <section className="relative pt-28 pb-16 sm:pt-36 md:pb-24 overflow-hidden bg-brand-bg">
      {/* Elementos gráficos */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-grid opacity-60 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
        <Reveal onMount direction="left" delay={0.35} duration={0.9} className="absolute -left-6 top-40 hidden lg:block">
          <span className="title-display text-outline text-[16rem] leading-none select-none">TM</span>
        </Reveal>
        <SlabIn skew={-32} from="right" className="absolute -right-24 -top-10 w-[420px] h-[160px] bg-brand-blue hidden md:block" />
        <SlabIn skew={-22} from="left" delay={0.15} className="absolute -left-10 bottom-0 w-[90px] h-[260px] bg-brand-blue/80 hidden lg:block" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid lg:grid-cols-[1.08fr_0.92fr] gap-12 lg:gap-14 items-center">
          <div className="space-y-7">
            <p className="section-label">
              <SlashesIn className="text-base" delay={0.1} />
              <Reveal onMount direction="left" delay={0.3} duration={0.45} className="inline-block">O básico que funciona</Reveal>
            </p>

            <h1 className="title-display text-brand-ink text-[2.6rem] sm:text-6xl lg:text-[4.1rem] xl:text-[4.6rem]">
              <WordsRise text="Do seu corpo atual ao objetivo que você quer alcançar, existe um" delay={0.15} />{' '}
              <WordsRise text="método." delay={0.15 + 12 * 0.035} className="text-brand-blue-text" />
            </h1>

            <Reveal onMount delay={0.55}>
            <p className="text-brand-muted text-lg lg:text-xl leading-relaxed max-w-xl">
              Eu construo essa ponte através de <strong className="text-brand-ink font-semibold">estratégia</strong>,{' '}
              <strong className="text-brand-ink font-semibold">constância</strong> e{' '}
              <strong className="text-brand-ink font-semibold">propósito</strong>. Treino consciente para emagrecer
              com saúde, recuperar a mobilidade e viver melhor.
            </p>
            </Reveal>

            <Reveal onMount delay={0.68} direction="diagonal" className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4 pt-1">
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="btn-brand group">
                <MessageCircle className="w-5 h-5" strokeWidth={2.4} aria-hidden="true" />
                Falar com o Thiago no WhatsApp
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" strokeWidth={2.4} aria-hidden="true" />
              </a>
              <button onClick={onCTAClick} type="button" className="btn-outline-brand">
                <CalendarDays className="w-5 h-5 text-brand-blue-text" strokeWidth={2.2} aria-hidden="true" />
                Agendar Avaliação Gratuita
              </button>
            </Reveal>

            <Reveal onMount delay={0.8}>
            <ul className="space-y-2.5 pt-2 text-base text-brand-ink/90">
              <li className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-brand-blue-text shrink-0" strokeWidth={2} aria-hidden="true" />
                Atendimento 1:1 Presencial e On-line
              </li>
              <li className="flex items-center gap-3">
                <HeartPulse className="w-5 h-5 text-brand-blue-text shrink-0" strokeWidth={2} aria-hidden="true" />
                Especialista em Saúde do Idoso
              </li>
            </ul>
            </Reveal>

            {/* Pilares — em telas menores aparecem aqui; em telas largas ficam ao lado da foto */}
            <ul className="xl:hidden flex flex-wrap gap-x-5 gap-y-2 pt-4 border-t border-white/10">
              {pillars.map((p) => (
                <li key={p} className="text-[0.8rem] font-semibold tracking-[0.18em] uppercase text-brand-muted">{p}</li>
              ))}
            </ul>
          </div>

          <div className="relative lg:pl-4 xl:grid xl:grid-cols-[1fr_8.5rem] xl:gap-8 xl:items-start">
            <div className="relative">
              <div aria-hidden="true" className="absolute -right-3 -bottom-3 w-2/3 h-2/3 border-r-[3px] border-b-[3px] border-brand-blue" />
              <div aria-hidden="true" className="absolute right-6 -top-6 hidden sm:flex gap-1.5">
                {[0, 1, 2, 3].map((i) => (
                  <span key={i} className="block w-1.5 h-12 bg-brand-blue-text/80 skew-x-[-28deg]" />
                ))}
              </div>
              <div className="relative chamfer overflow-hidden bg-brand-surface">
                <PhotoWipe delay={0.25} />
                <SettleImage
                  delay={0.35}
                  src="/assets/hero.webp"
                  alt="Thiago Mancilha Reis, personal trainer"
                  className="photo-treated w-full h-[440px] sm:h-[520px] lg:h-[580px] object-cover object-[center_25%]"
                  fetchPriority="high"
                />
                <div aria-hidden="true" className="absolute inset-0 photo-tint" />
                <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-brand-bg/70 via-transparent to-transparent" />
              </div>
            </div>

            <div className="hidden xl:block pt-16">
              <p className="text-[0.75rem] font-semibold tracking-[0.3em] text-brand-ink mb-5">TM / 01</p>
              <Stagger as="ul" onMount delay={0.9} stagger={0.1} className="space-y-3">
                {pillars.map((p) => (
                  <StaggerItem as="li" key={p} className="text-[0.72rem] font-semibold tracking-[0.2em] uppercase text-brand-muted leading-snug">{p}</StaggerItem>
                ))}
              </Stagger>
              <span aria-hidden="true" className="block w-6 h-[2px] bg-brand-ink mt-5" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
