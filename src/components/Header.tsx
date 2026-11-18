import { useState, useEffect } from 'react';
import { Menu, X, CalendarDays } from 'lucide-react';
import Logo from '@/components/brand/Logo';

interface HeaderProps {
  onCTAClick: () => void;
}

export default function Header({ onCTAClick }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Sobre', href: '#sobre' },
    { label: 'Planos', href: '#servicos' },
    { label: 'FAQ', href: '#faq' },
  ];

  const handleNavClick = (href: string) => {
    setMobileOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 border-b ${
        scrolled || mobileOpen ? 'bg-brand-bg/[0.97] border-white/10' : 'bg-transparent border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[72px] sm:h-20 flex items-center justify-between gap-6">
        <a
          href="#top"
          aria-label="Thiago Mancilha — início"
          onClick={(e) => { e.preventDefault(); handleNavClick('#top'); }}
        >
          <Logo />
        </a>

        <nav className="hidden lg:flex items-center gap-10" aria-label="Seções do site">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={(e) => { e.preventDefault(); handleNavClick(l.href); }}
              className="text-[0.82rem] font-semibold tracking-[0.18em] uppercase text-brand-muted hover:text-brand-ink transition-colors"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:block">
          <button onClick={onCTAClick} type="button" className="btn-brand !min-h-[2.9rem] !px-6 !text-base">
            <CalendarDays className="w-[18px] h-[18px]" strokeWidth={2.2} aria-hidden="true" />
            Agendar Avaliação Gratuita
          </button>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden w-11 h-11 flex items-center justify-center text-brand-ink border border-white/15"
          aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 bg-brand-bg">
          <div className="px-4 py-4 space-y-1">
            {navLinks.map((l) => (
              <button
                key={l.href}
                onClick={() => handleNavClick(l.href)}
                className="w-full text-left px-2 py-3.5 border-b border-white/5 text-base font-semibold tracking-[0.14em] uppercase text-brand-muted hover:text-brand-ink"
              >
                {l.label}
              </button>
            ))}
            <div className="pt-4">
              <button
                onClick={() => { setMobileOpen(false); onCTAClick(); }}
                type="button"
                className="btn-brand w-full"
              >
                <CalendarDays className="w-5 h-5" strokeWidth={2.2} aria-hidden="true" />
                Agendar Avaliação Gratuita
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
