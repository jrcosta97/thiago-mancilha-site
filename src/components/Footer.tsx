import { Instagram, Youtube, Mail, MapPin, Dumbbell } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const socials = [
    { name: 'Instagram', href: 'https://www.instagram.com/thiagomancilha__?igsh=MWY2eXlleGE4enAwbg==', icon: Instagram },
    { name: 'Youtube', href: 'https://youtube.com', icon: Youtube },
    { name: 'E-mail', href: 'mailto:thiagomancilha06@gmail.com', icon: Mail },
  ];

  const navs = [
    {
      title: 'Navegação',
      links: [
        { label: 'Sobre mim', href: '#sobre' },
        { label: 'Planos', href: '#servicos' },
        { label: 'Resultados', href: '#resultados' },
        { label: 'FAQ', href: '#faq' },
      ],
    },
    {
      title: 'Serviços',
      links: [
        { label: 'Consultoria Online', href: '#servicos' },
        { label: 'Personal Presencial', href: '#servicos' },
        { label: 'Plano Anual', href: '#servicos' },
        { label: 'Avaliação Gratuita', href: '#top' },
      ],
    },
  ];

  const handleNavClick = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <footer className="relative pt-20 pb-10 border-t border-white/5 bg-background-darker overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-accent/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-10 mb-14">
          <div className="lg:col-span-2 space-y-5">
            <a href="#top" className="flex items-center gap-3 group" onClick={(e) => handleNavClick(e, '#top')}>
              <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center group-hover:scale-105 transition-transform">
                <Dumbbell className="w-6 h-6 text-background" strokeWidth={2.5} />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-display font-extrabold text-text-primary text-xl tracking-tight">
                  Thiago Mancilha<span className="text-accent">.</span>
                </span>
                <span className="text-xs text-text-secondary tracking-wider uppercase">
                  Personal Trainer
                </span>
              </div>
            </a>
            <p className="text-text-secondary leading-relaxed max-w-sm text-sm">
              Transformando vidas através de um método científico, personalizado e humano.
              Sua saúde e performance, nossa prioridade.
            </p>
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <MapPin className="w-4 h-4 text-accent shrink-0" strokeWidth={2} />
              São Paulo, SP — Atendimento presencial e online para todo o Brasil.
            </div>
            <div className="flex items-center gap-3 pt-2">
              {socials.map((s) => (
                <a
                  key={s.name}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={s.name}
                  className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-text-secondary hover:text-accent hover:border-accent/50 hover:bg-accent/5 transition-all"
                >
                  <s.icon className="w-5 h-5" strokeWidth={2} />
                </a>
              ))}
            </div>
          </div>

          {navs.map((n) => (
            <div key={n.title}>
              <h4 className="font-display font-bold text-text-primary mb-4 uppercase tracking-wider text-sm">
                {n.title}
              </h4>
              <ul className="space-y-3">
                {n.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      onClick={(e) => handleNavClick(e, l.href)}
                      className="text-sm text-text-secondary hover:text-accent transition-colors"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h4 className="font-display font-bold text-text-primary mb-4 uppercase tracking-wider text-sm">
              Contato
            </h4>
            <ul className="space-y-3 text-sm text-text-secondary">
              <li>
                <p className="text-text-muted text-xs uppercase">WhatsApp</p>
                <p className="font-semibold text-text-primary">(92)8155-6223</p>
              </li>
              <li>
                <p className="text-text-muted text-xs uppercase">E-mail</p>
                <p className="font-semibold text-text-primary">contato@thiagopt.com.br</p>
              </li>
              <li>
                <p className="text-text-muted text-xs uppercase">CREF</p>
                <p className="font-semibold text-text-primary">087654-G/SP</p>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-text-muted text-center sm:text-left">
            © {currentYear} Thiago Mancilha Personal Trainer. Todos os direitos reservados.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-text-muted">
            <a href="#" className="hover:text-accent transition-colors">Política de Privacidade</a>
            <span className="opacity-40">•</span>
            <a href="#" className="hover:text-accent transition-colors">Termos de Uso</a>
            <span className="opacity-40">•</span>
            <span>Aviso Legal: Resultados podem variar conforme comprometimento individual.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
