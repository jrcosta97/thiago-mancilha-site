import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Target, Globe, Award,
  Instagram, Youtube, Linkedin,
  ChevronRight, ArrowLeft,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const WHATSAPP_NUMBER = '5548988720439';

const buildWhatsAppLink = (message: string) =>
  `https://api.whatsapp.com/send?phone=${encodeURIComponent(WHATSAPP_NUMBER)}&text=${encodeURIComponent(message)}`;

const links = [
  {
    id: 'presencial',
    title: 'Atendimento Presencial',
    subtitle: 'Agendar avaliação física em estúdio',
    icon: Target,
    href: buildWhatsAppLink(
      'Olá Thiago! Vim pelo Linktree e quero agendar uma Avaliação Física Presencial em estúdio. Pode me passar os horários e valores disponíveis?'
    ),
    external: true,
  },
  {
    id: 'online',
    title: 'Consultoria On-line',
    subtitle: 'Treino personalizado para todo o Brasil e exterior',
    icon: Globe,
    href: buildWhatsAppLink(
      'Olá Thiago! Vim pelo Linktree e quero começar uma Consultoria On-line. Como funciona o atendimento a distância e quais planos estão disponíveis?'
    ),
    external: true,
  },
  {
    id: 'resultados',
    title: 'Casos de Sucesso',
    subtitle: 'Veja a transformação de alunos reais na Landing',
    icon: Award,
    href: '/#resultados',
    external: false,
  },
  {
    id: 'home',
    title: 'Voltar para o Site',
    subtitle: 'Página principal com todos os serviços, planos e FAQ',
    icon: ArrowLeft,
    href: '/',
    external: false,
  },
] as const;

const socials = [
  {
    id: 'instagram',
    label: 'Instagram',
    icon: Instagram,
    href: 'https://instagram.com/',
  },
  {
    id: 'youtube',
    label: 'YouTube',
    icon: Youtube,
    href: 'https://youtube.com/',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    icon: Linkedin,
    href: 'https://linkedin.com/',
  },
] as const;

export default function BioLinks() {
  const currentYear = new Date().getFullYear();

  return (
    <section className="max-w-md w-full mx-auto min-h-screen flex flex-col justify-center py-10 px-4 bg-background relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[520px] h-[520px] bg-lime-400/10 rounded-full blur-[120px] rounded-full" />
        <div className="absolute top-1/2 right-0 w-[420px] h-[420px] bg-emerald-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative w-full">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="flex flex-col items-center text-center mb-10 sm:mb-12"
        >
          <div className="relative mb-5 mx-auto">
            <div className="absolute -inset-[3px] rounded-full bg-gradient-to-br from-lime-400 via-emerald-400 to-lime-300 blur-[6px] opacity-80 pointer-events-none" />
            <Avatar className="relative w-28 h-28 mx-auto border-2 border-lime-400 bg-card shadow-[0_0_40px_rgba(132,204,22,0.25)]">
              <AvatarImage
                src="/assets/hero.webp"
                alt="Thiago Mancilha Reis"
                loading="eager"
                decoding="async"
              />
              <AvatarFallback className="bg-slate-800 text-lime-300 font-display text-3xl font-black">
                TMR
              </AvatarFallback>
            </Avatar>
            <Badge className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-6 px-2.5 text-[10px] font-black uppercase tracking-widest border border-lime-400/50 bg-lime-400/15 text-lime-300 shadow-[0_0_20px_rgba(132,204,22,0.35)]">
              CREF 008289
            </Badge>
          </div>

          <h1 className="font-display font-bold text-xl sm:text-2xl text-foreground tracking-tight mb-1.5">
            Thiago Mancilha Reis
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            Personal Trainer • <span className="text-lime-300/90 font-semibold">CREF 008289-G/AM</span>
          </p>
        </motion.div>

        <motion.ul
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.18, ease: 'easeOut' }}
          className="space-y-3.5 sm:space-y-4 mb-10 sm:mb-12 w-full"
        >
          {links.map((link, i) => {
            const Icon = link.icon;
            return (
              <motion.li
                key={link.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.55,
                  delay: 0.28 + i * 0.1,
                  ease: 'easeOut',
                }}
                className="w-full"
              >
                {link.external ? (
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group w-full"
                  >
                    <Card
                      className="hover:border-lime-400 hover:bg-slate-800/80 transition-all cursor-pointer w-full bg-slate-900 border border-slate-800/80 rounded-2xl flex flex-row items-center justify-start text-left p-4 gap-4 overflow-hidden"
                    >
                      <div className="p-3 bg-lime-500/10 rounded-xl text-lime-400 flex-shrink-0">
                        <Icon className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2} />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-center gap-1 text-left">
                        <h2 className="font-bold text-base text-white leading-tight group-hover:text-lime-300 transition-colors">
                          {link.title}
                        </h2>
                        <p className="text-xs text-slate-400 leading-snug line-clamp-2">
                          {link.subtitle}
                        </p>
                      </div>
                      <ChevronRight className="w-4.5 h-4.5 text-slate-500 group-hover:text-lime-400 group-hover:translate-x-0.5 transition-all shrink-0" strokeWidth={2.4} />
                    </Card>
                  </a>
                ) : (
                  <Link to={link.href} className="block group w-full">
                    <Card
                      className="hover:border-lime-400 hover:bg-slate-800/80 transition-all cursor-pointer w-full bg-slate-900 border border-slate-800/80 rounded-2xl flex flex-row items-center justify-start text-left p-4 gap-4 overflow-hidden"
                    >
                      <div className="p-3 bg-lime-500/10 rounded-xl text-lime-400 flex-shrink-0">
                        <Icon className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2} />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-center gap-1 text-left">
                        <h2 className="font-bold text-base text-white leading-tight group-hover:text-lime-300 transition-colors">
                          {link.title}
                        </h2>
                        <p className="text-xs text-slate-400 leading-snug line-clamp-2">
                          {link.subtitle}
                        </p>
                      </div>
                      <ChevronRight className="w-4.5 h-4.5 text-slate-500 group-hover:text-lime-400 group-hover:translate-x-0.5 transition-all shrink-0" strokeWidth={2.4} />
                    </Card>
                  </Link>
                )}
              </motion.li>
            );
          })}
        </motion.ul>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.65, ease: 'easeOut' }}
          className="flex flex-col items-center gap-5 w-full"
        >
          <div className="flex items-center justify-center gap-3.5 sm:gap-4">
            {socials.map((s) => {
              const Icon = s.icon;
              return (
                <a
                  key={s.id}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="group/btn inline-flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-slate-900/80 border border-white/10 text-muted-foreground hover:text-lime-300 hover:border-lime-400/60 hover:bg-lime-400/10 hover:scale-110 transition-all duration-300 shadow-[0_6px_20px_rgba(0,0,0,0.25)] focus-visible:ring-3 focus-visible:ring-lime-400/40 focus-visible:outline-none"
                >
                  <Icon className="w-5 h-5 sm:w-5.5 sm:h-5.5" strokeWidth={2} />
                </a>
              );
            })}
          </div>

          <p className="text-[11px] sm:text-xs text-muted-foreground/70 tracking-wide font-medium text-center">
            © {currentYear} Thiago Mancilha Reis · CREF 008289-G/AM
          </p>
        </motion.div>
      </div>
    </section>
  );
}
