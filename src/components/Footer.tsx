import {
  Award, MessageCircle, MapPin, Instagram, Facebook,
  Dumbbell, Heart, CalendarClock, Phone, ShieldCheck,
} from 'lucide-react';

const WHATSAPP_NUMBER = '5548988720439';
const whatsappMsg = encodeURIComponent('Olá Thiago! Vim do rodapé do site e quero conhecer melhor seu trabalho.');
const whatsappLink = `https://api.whatsapp.com/send?phone=${encodeURIComponent(WHATSAPP_NUMBER)}&text=${whatsappMsg}`;

const footerLinks = [
  { label: 'Sobre o Thiago', href: '#sobre' },
  { label: 'Planos', href: '#servicos' },
  { label: 'Resultados', href: '#resultados' },
  { label: 'Conteúdo', href: '#conteudo' },
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
    <footer className="relative pt-20 pb-10 border-t border-white/5 bg-background-darker overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-60">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-accent/5 rounded-full blur-[140px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 mb-14">
          <div className="lg:col-span-5 space-y-5">
            <a href="#top" className="flex items-center gap-3 group">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-accent flex items-center justify-center group-hover:scale-110 transition-transform shadow-neon shrink-0">
                <Dumbbell className="w-5 h-5 sm:w-6 sm:h-6 text-background" strokeWidth={2.5} />
              </div>
              <div className="flex flex-col leading-tight min-w-0">
                <span className="font-display font-extrabold text-text-primary text-base sm:text-lg tracking-tight">
                  Thiago Mancilha Reis<span className="text-accent">.</span>
                </span>
                <span className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-text-secondary tracking-wider uppercase">
                  <Award className="w-3 h-3 text-accent shrink-0" strokeWidth={2.5} />
                  CREF 008289-G/AM
                </span>
              </div>
            </a>

            <p className="text-text-secondary text-sm sm:text-base leading-relaxed max-w-md">
              Personal Trainer dedicado a ajudar você a emagrecer, recuperar a mobilidade e viver melhor com
              saúde funcional. Especialista em público maduro e quem busca resultados <span className="text-accent font-semibold">sem exageros</span>.
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              {pillars.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/4 border border-white/8 text-text-secondary text-xs sm:text-sm"
                >
                  <Icon className="w-3.5 h-3.5 text-accent shrink-0" strokeWidth={2.3} />
                  {label}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 pt-3">
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="w-10 h-10 rounded-xl bg-[#25D366]/90 text-white flex items-center justify-center hover:scale-110 hover:bg-[#25D366] transition-all shadow-[0_6px_20px_rgba(37,211,102,0.35)]"
              >
                <MessageCircle className="w-5 h-5" strokeWidth={2.3} />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-slate-200 flex items-center justify-center hover:scale-110 hover:text-accent hover:border-accent/40 transition-all"
              >
                <Instagram className="w-4.5 h-4.5" strokeWidth={2} />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-slate-200 flex items-center justify-center hover:scale-110 hover:text-accent hover:border-accent/40 transition-all"
              >
                <Facebook className="w-4.5 h-4.5" strokeWidth={2} />
              </a>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-4">
            <h4 className="font-display font-black text-text-primary text-sm sm:text-base uppercase tracking-widest">
              Navegação
            </h4>
            <ul className="space-y-2">
              {footerLinks.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    className="text-sm text-text-secondary hover:text-accent transition-colors inline-flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-accent/0 group-hover:bg-accent transition-colors" />
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-4 space-y-5">
            <h4 className="font-display font-black text-text-primary text-sm sm:text-base uppercase tracking-widest">
              Contato Direto
            </h4>
            <div className="space-y-3.5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent border border-accent/20 shrink-0">
                  <Phone className="w-4.5 h-4.5" strokeWidth={2.2} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-text-muted uppercase tracking-widest">WhatsApp / Celular</p>
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block font-display font-bold text-text-primary text-base sm:text-lg truncate hover:text-accent transition-colors"
                  >
                    (48) 98872-0439
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent border border-accent/20 shrink-0">
                  <MapPin className="w-4.5 h-4.5" strokeWidth={2.2} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-text-muted uppercase tracking-widest">Atendimento Presencial</p>
                  <p className="text-sm sm:text-base text-text-secondary leading-snug">
                    Manaus - AM · Studio de musculação e também atendimento doméstico (a combinar)
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent border border-accent/20 shrink-0">
                  <CalendarClock className="w-4.5 h-4.5" strokeWidth={2.2} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-text-muted uppercase tracking-widest">Horário de Atendimento</p>
                  <p className="text-sm sm:text-base text-text-secondary leading-snug">
                    Seg a Sex · 06:00 às 20:30 &nbsp;|&nbsp; Sáb · 07:00 às 12:00
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs sm:text-sm text-text-muted leading-relaxed text-center sm:text-left">
            © {currentYear} Thiago Mancilha Reis · <span className="font-semibold">CREF 008289-G/AM</span>.
            Todos os direitos reservados.
          </p>
          <p className="text-[11px] sm:text-xs text-text-muted leading-relaxed text-center sm:text-right max-w-md">
            Acompanhamento personalizado com profissional registrado. Resultados podem variar de acordo com
            organismo, adesão e hábitos alimentares de cada pessoa.
          </p>
        </div>
      </div>
    </footer>
  );
}
