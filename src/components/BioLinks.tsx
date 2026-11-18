import { WHATSAPP_NUMBER } from '@/lib/contact';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Globe, MapPin } from 'lucide-react';



const buildWhatsAppLink = (message: string) =>
  `https://api.whatsapp.com/send?phone=${encodeURIComponent(WHATSAPP_NUMBER)}&text=${encodeURIComponent(message)}`;

const presencialLink = buildWhatsAppLink(
  'Olá Thiago! Vim pelo Linktree e quero agendar uma Avaliação Física Presencial em estúdio. Pode me passar os horários e valores disponíveis?'
);
const onlineLink = buildWhatsAppLink(
  'Olá Thiago! Vim pelo Linktree e quero começar uma Consultoria On-line. Como funciona o atendimento a distância e quais planos estão disponíveis?'
);

export default function BioLinks() {
  return (
    <main className="min-h-screen bg-[#090e13] text-white">
      <div className="mx-auto min-h-screen w-full max-w-md bg-[#0c1117] sm:border-x sm:border-slate-800/70">
        <div className="relative h-72 overflow-hidden sm:h-80">
          <img src="/assets/hero.webp" alt="Thiago Mancilha Reis" className="h-full w-full object-cover object-[center_30%]" fetchPriority="high" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c1117] via-[#0c1117]/20 to-transparent" aria-hidden="true" />
        </div>

        <div className="relative -mt-14 px-5 pb-8 sm:px-7">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-lime-400">Personal trainer · presencial e online</p>
          <h1 className="mt-3 font-display text-4xl font-black leading-[1.05] tracking-tight sm:text-[2.65rem]">
            Seu próximo passo<br /><span className="text-lime-400">começa aqui.</span>
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-300">Treino personalizado para a sua rotina e os seus objetivos.</p>
          <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-300">
            <span className="h-1.5 w-1.5 rounded-full bg-lime-400" aria-hidden="true" />
            <span className="font-bold text-slate-100">Thiago Mancilha Reis</span>
            <span>· CREF 008289-G/AM</span>
          </p>

          <nav aria-label="Formas de atendimento" className="mt-6 grid gap-3">
            <a href={presencialLink} target="_blank" rel="noopener noreferrer" className="group flex min-h-[76px] items-center gap-3 rounded-2xl border border-lime-400 bg-lime-400 px-4 py-3 text-left text-slate-950 transition-colors hover:bg-lime-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c1117]">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-black/10"><MapPin className="h-5 w-5" aria-hidden="true" /></span>
              <span className="min-w-0 flex-1"><span className="block text-sm font-bold">Atendimento presencial</span><span className="mt-1 block text-xs text-slate-800">Agende sua avaliação</span></span>
              <ArrowUpRight className="h-5 w-5 shrink-0" aria-hidden="true" />
            </a>
            <a href={onlineLink} target="_blank" rel="noopener noreferrer" className="group flex min-h-[76px] items-center gap-3 rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-left transition-colors hover:border-lime-400/60 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c1117]">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-lime-400/10 text-lime-400"><Globe className="h-5 w-5" aria-hidden="true" /></span>
              <span className="min-w-0 flex-1"><span className="block text-sm font-bold">Consultoria online</span><span className="mt-1 block text-xs text-slate-400">Treine de onde estiver</span></span>
              <ArrowUpRight className="h-5 w-5 shrink-0 text-slate-400 group-hover:text-lime-400" aria-hidden="true" />
            </a>
            <Link to="/" className="group flex min-h-[76px] items-center gap-3 rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-left transition-colors hover:border-lime-400/60 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c1117]">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-lime-400/10 text-lime-400"><ArrowUpRight className="h-5 w-5" aria-hidden="true" /></span>
              <span className="min-w-0 flex-1"><span className="block text-sm font-bold">Conheça o site</span><span className="mt-1 block text-xs text-slate-400">Serviços, planos e dúvidas</span></span>
              <ArrowRight className="h-5 w-5 shrink-0 text-slate-400 group-hover:text-lime-400" aria-hidden="true" />
            </Link>
          </nav>
          <footer className="mt-7 border-t border-slate-800 pt-5 text-center text-[11px] font-medium tracking-wide text-slate-500">© {new Date().getFullYear()} Thiago Mancilha Reis · O básico que funciona</footer>
        </div>
      </div>
    </main>
  );
}
