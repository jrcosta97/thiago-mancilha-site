import { WHATSAPP_NUMBER } from '@/lib/contact';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Globe, MapPin } from 'lucide-react';
import { Slashes } from '@/components/brand/SectionLabel';



const buildWhatsAppLink = (message: string) =>
  `https://api.whatsapp.com/send?phone=${encodeURIComponent(WHATSAPP_NUMBER)}&text=${encodeURIComponent(message)}`;

const presencialLink = buildWhatsAppLink(
  'Olá Thiago! Vim pelo Linktree e quero agendar uma Avaliação Física Presencial em estúdio. Pode me passar os horários e valores disponíveis?'
);
const onlineLink = buildWhatsAppLink(
  'Olá Thiago! Vim pelo Linktree e quero começar uma Consultoria On-line. Como funciona o atendimento a distância e quais planos estão disponíveis?'
);

const linkBase =
  'group flex min-h-[84px] items-stretch text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-text focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg';

function LinkInner({ icon, title, subtitle, trailing }: { icon: ReactNode; title: string; subtitle: string; trailing: ReactNode }) {
  return (
    <>
      <span className="grid w-16 shrink-0 place-items-center">{icon}</span>
      <span aria-hidden="true" className="my-4 w-px bg-current opacity-25" />
      <span className="min-w-0 flex-1 px-4 py-3.5 flex flex-col justify-center">
        <span className="title-display !not-italic !font-bold text-[1.45rem] leading-none">{title}</span>
        <span className="mt-1.5 block text-base opacity-80">{subtitle}</span>
      </span>
      <span className="grid w-12 shrink-0 place-items-center">{trailing}</span>
    </>
  );
}

export default function BioLinks() {
  return (
    <main className="min-h-screen bg-[#07090F] text-brand-ink font-barlow">
      <div className="relative mx-auto min-h-screen w-full max-w-md overflow-hidden bg-brand-bg sm:border-x sm:border-white/10">
        <div aria-hidden="true" className="pointer-events-none absolute -left-16 top-0 z-10 h-24 w-56 bg-brand-blue -skew-x-[40deg]" />
        <div aria-hidden="true" className="pointer-events-none absolute -left-6 top-24 z-10 h-[2px] w-40 bg-brand-blue-text/70 -rotate-[38deg] origin-left" />

        <div className="relative h-[360px] overflow-hidden sm:h-[400px]">
          <img src="/assets/hero.webp" alt="Thiago Mancilha Reis" className="photo-treated h-full w-full object-cover object-[center_25%]" fetchPriority="high" />
          <div aria-hidden="true" className="absolute inset-0 photo-tint" />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-brand-bg via-brand-bg/30 to-transparent" />
        </div>

        <div className="relative -mt-24 px-5 pb-8 sm:px-7">
          <span aria-hidden="true" className="title-display text-outline pointer-events-none absolute right-4 top-6 text-[7.5rem] leading-none select-none">01</span>

          <p className="relative text-[0.78rem] font-bold uppercase tracking-[0.16em] text-brand-ink/90">Personal trainer · presencial e online</p>
          <h1 className="relative mt-3 title-display text-[3.4rem] sm:text-[3.8rem]">
            Seu próximo passo<br /><span className="text-brand-blue-text">começa aqui.</span>
          </h1>
          <p className="mt-4 max-w-sm text-lg leading-relaxed text-brand-muted">Treino personalizado para a sua rotina e os seus objetivos.</p>
          <p className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-base text-brand-muted">
            <Slashes className="text-base" />
            <span className="title-display !not-italic !font-bold text-lg text-brand-ink">Thiago Mancilha Reis</span>
            <span>· CREF 008289-G/AM</span>
          </p>

          <nav aria-label="Formas de atendimento" className="mt-7 grid gap-3.5">
            <a href={presencialLink} target="_blank" rel="noopener noreferrer" className={`${linkBase} bg-brand-blue text-white hover:bg-brand-blue-hover`}>
              <LinkInner
                icon={<MapPin className="h-6 w-6" aria-hidden="true" />}
                title="Atendimento presencial"
                subtitle="Agende sua avaliação"
                trailing={<ArrowUpRight className="h-6 w-6" aria-hidden="true" />}
              />
            </a>
            <a href={onlineLink} target="_blank" rel="noopener noreferrer" className={`${linkBase} border border-white/30 text-brand-ink hover:border-brand-blue-text`}>
              <LinkInner
                icon={<Globe className="h-6 w-6 text-brand-muted" aria-hidden="true" />}
                title="Consultoria online"
                subtitle="Treine de onde estiver"
                trailing={<ArrowUpRight className="h-6 w-6 text-brand-muted group-hover:text-brand-blue-text" aria-hidden="true" />}
              />
            </a>
            <Link to="/" className={`${linkBase} border border-white/30 text-brand-ink hover:border-brand-blue-text`}>
              <LinkInner
                icon={<ArrowUpRight className="h-6 w-6 text-brand-muted" aria-hidden="true" />}
                title="Conheça o site"
                subtitle="Serviços, planos e dúvidas"
                trailing={<ArrowRight className="h-6 w-6 text-brand-muted group-hover:text-brand-blue-text" aria-hidden="true" />}
              />
            </Link>
          </nav>

          <footer className="mt-8 flex items-center gap-4 text-sm text-brand-subtle">
            <Slashes className="text-sm shrink-0" />
            <span className="h-px flex-1 bg-white/15" aria-hidden="true" />
          </footer>
          <p className="mt-4 text-center text-sm text-brand-subtle">© {new Date().getFullYear()} Thiago Mancilha Reis · O básico que funciona</p>
        </div>
      </div>
    </main>
  );
}
