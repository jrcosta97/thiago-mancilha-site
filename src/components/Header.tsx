import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Calendar, Dumbbell, Award } from 'lucide-react';

interface HeaderProps {
  onCTAClick: () => void;
}

export default function Header({ onCTAClick }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Sobre', href: '#sobre' },
    { label: 'Conteúdo', href: '#conteudo' },
    { label: 'Planos', href: '#servicos' },
    { label: 'Resultados', href: '#resultados' },
    { label: 'FAQ', href: '#faq' },
  ];

  const handleNavClick = (href: string) => {
    setMobileOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? 'glass-effect py-3' : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <a href="#top" className="flex items-center gap-3 group" onClick={(e) => { e.preventDefault(); handleNavClick('#top'); }}>
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-accent flex items-center justify-center group-hover:scale-110 transition-transform shadow-neon">
            <Dumbbell className="w-5 h-5 sm:w-6 sm:h-6 text-background" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-display font-extrabold text-text-primary text-base sm:text-lg tracking-tight">
              Thiago Mancilha Reis<span className="text-accent">.</span>
            </span>
            <span className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-text-secondary tracking-wider uppercase">
              <Award className="w-3 h-3 text-accent" strokeWidth={2.5} />
              CREF 008289-G/AM · O básico que funciona.
            </span>
          </div>
        </a>

        <nav className="hidden lg:flex items-center gap-7">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={(e) => { e.preventDefault(); handleNavClick(l.href); }}
              className="text-sm text-text-secondary hover:text-accent font-medium transition-colors relative group"
            >
              {l.label}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-accent group-hover:w-full transition-all duration-300 rounded-full" />
            </a>
          ))}
        </nav>

        <div className="hidden md:block">
          <button
            onClick={onCTAClick}
            className="btn-primary !py-2.5 !px-5 sm:!px-6 text-sm whitespace-nowrap"
          >
            <Calendar className="w-4 h-4" strokeWidth={2.5} />
            Agendar Avaliação Gratuita
          </button>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden w-10 h-10 rounded-lg bg-background-card/60 flex items-center justify-center text-text-primary border border-white/5"
          aria-label="Menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden overflow-hidden glass-effect border-t border-white/5"
          >
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((l) => (
                <button
                  key={l.href}
                  onClick={() => handleNavClick(l.href)}
                  className="w-full text-left px-4 py-3 rounded-lg text-text-secondary hover:text-accent hover:bg-white/5 font-medium transition-all"
                >
                  {l.label}
                </button>
              ))}
              <div className="pt-3 px-1">
                <button
                  onClick={() => { setMobileOpen(false); onCTAClick(); }}
                  className="btn-primary w-full !py-3 text-sm"
                >
                  <Calendar className="w-4 h-4" strokeWidth={2.5} />
                  Agendar Avaliação Gratuita
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
