import { WHATSAPP_DISPLAY, WHATSAPP_NUMBER } from '@/lib/contact';
import {
  MessageCircle, MapPin, Heart, CalendarClock, Phone, ShieldCheck,
} from 'lucide-react';
import Logo from '@/components/brand/Logo';
import { Slashes } from '@/components/brand/SectionLabel';


const whatsappMsg = encodeURIComponent('Olá Thiago! Vim do rodapé do site e quero conhecer melhor seu trabalho.');
const whatsappLink = `https://api.whatsapp.com/send?phone=${encodeURIComponent(WHATSAPP_NUMBER)}&text=${whatsappMsg}`;

const footerLinks = [
  { label: 'Sobre o Thiago', href: '#sobre' },
  { label: 'Planos', href: '#servicos' },
  { label: 'Calculadora TDEE', href: '#tdee' },
  { label: 'FAQ', href: '#faq' },
];

const pillars = [
  { icon: Heart, label: 'Saúde Funcional' },
  { icon: CalendarClock, label: 'Consistência' },
  { icon: ShieldCheck, label: 'Segurança' },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="relative pt-16 md:pt-20 pb-10 bg-[#07090F] border-t border-white/10 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-10 mb-14">
          <div className="lg:col-span-5 space-y-5">
            <a href="#top" aria-label="Voltar ao início">
              <Logo />
            </a>
            <p className="text-brand-muted text-base leading-relaxed max-w-md">
              Personal Trainer dedicado a ajudar você a emagrecer, recuperar a mobilidade e viver melhor com
              saúde funcional. Especialista em público maduro e quem busca resultados <span className="text-brand-ink font-semibold">sem exageros</span>.
            </p>
            <ul className="flex flex-wrap gap-x-5 gap-y-2">
              {pillars.map(({ icon: Icon, label }) => (
                <li key={label} className="inline-flex items-center gap-2 text-sm font-semibold tracking-[0.12em] uppercase text-brand-ink/85">
                  <Icon className="w-4 h-4 text-brand-blue-text" strokeWidth={2.2} aria-hidden="true" />
                  {label}
                </li>
              ))}
            </ul>
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Falar no WhatsApp"
              className="inline-grid place-items-center w-11 h-11 bg-brand-blue text-white hover:bg-brand-blue-hover transition-colors"
            >
              <MessageCircle className="w-5 h-5" strokeWidth={2.3} />
            </a>
          </div>

          <nav className="lg:col-span-3 space-y-4" aria-label="Navegação do rodapé">
            <h4 className="title-display !not-italic text-lg tracking-[0.08em] text-brand-ink">Navegação</h4>
            <ul className="space-y-2.5">
              {footerLinks.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="text-base text-brand-muted hover:text-brand-ink transition-colors">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="lg:col-span-4 space-y-4">
            <h4 className="title-display !not-italic text-lg tracking-[0.08em] text-brand-ink">Contato Direto</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-brand-blue-text shrink-0 mt-1" strokeWidth={2} aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-brand-subtle uppercase tracking-[0.18em]">WhatsApp / Celular</p>
                  <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="block font-semibold text-brand-ink text-lg hover:text-brand-blue-text transition-colors">
                    {WHATSAPP_DISPLAY}
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-brand-blue-text shrink-0 mt-1" strokeWidth={2} aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-brand-subtle uppercase tracking-[0.18em]">Atendimento Presencial</p>
                  <p className="text-base text-brand-muted leading-snug">
                    Manaus - AM · Studio de musculação e também atendimento doméstico (a combinar)
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CalendarClock className="w-5 h-5 text-brand-blue-text shrink-0 mt-1" strokeWidth={2} aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-brand-subtle uppercase tracking-[0.18em]">Horário de Atendimento</p>
                  <p className="text-base text-brand-muted leading-snug">
                    Seg a Sex · 06:00 às 20:30 &nbsp;|&nbsp; Sáb · 07:00 às 12:00
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-white/10 flex flex-col lg:flex-row items-center justify-between gap-4">
          <p className="text-sm text-brand-subtle text-center lg:text-left inline-flex items-center gap-3">
            <Slashes className="text-sm" />
            <span>© {currentYear} Thiago Mancilha Reis · CREF 008289-G/AM. Todos os direitos reservados.</span>
          </p>
          <p className="text-xs text-brand-subtle leading-relaxed text-center lg:text-right max-w-md">
            Acompanhamento personalizado com profissional registrado. Resultados podem variar de acordo com
            organismo, adesão e hábitos alimentares de cada pessoa.
          </p>
        </div>
      </div>
    </footer>
  );
}
