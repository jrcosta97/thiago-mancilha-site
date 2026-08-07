import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Instagram } from 'lucide-react';

interface WhatsAppFloatProps {
  onOpenModal?: () => void;
}

const INSTAGRAM_URL = 'https://www.instagram.com/thiagomancilha__?igsh=MWY2eXlleGE4enAwbg%3D%3D';
const WHATSAPP_NUMBER = '5548988720439';
const WHATSAPP_DEFAULT_MESSAGE = 'Olá! Vim pelo site e gostaria de mais informações sobre a Avaliação Gratuita.';

export default function WhatsAppFloat({ onOpenModal }: WhatsAppFloatProps) {
  const [igTooltip, setIgTooltip] = useState(false);
  const [waTooltip, setWaTooltip] = useState(false);

  const openWhatsApp = () => {
    if (onOpenModal) {
      onOpenModal();
      return;
    }
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_DEFAULT_MESSAGE)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className="fixed bottom-6 right-6 z-[60] flex flex-col items-center gap-3 pointer-events-none"
      aria-label="Contatos rápidos"
    >
      <Tooltip
        visible={igTooltip}
        label="Siga no Instagram"
      >
        <motion.a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 18, stiffness: 220, delay: 0.15 }}
          whileHover={{ scale: 1.12, y: -2 }}
          whileTap={{ scale: 0.92 }}
          onMouseEnter={() => setIgTooltip(true)}
          onMouseLeave={() => setIgTooltip(false)}
          onFocus={() => setIgTooltip(true)}
          onBlur={() => setIgTooltip(false)}
          className="pointer-events-auto w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center relative transition-all duration-300 group overflow-hidden shadow-lg border border-white/10 bg-background-card/90 backdrop-blur-sm hover:border-transparent"
          aria-label="Siga no Instagram"
        >
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[radial-gradient(circle_at_top_left,_#F58529_0%,_#DD2A7B_28%,_#8134AF_55%,_#515BD4_75%,_#515BD4_100%)]" />
          <svg
            className="absolute inset-0 w-full h-full opacity-0 group-hover:opacity-30 transition-opacity duration-500 pointer-events-none"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="ig-neon" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FEDA77" stopOpacity="0.7" />
                <stop offset="25%" stopColor="#F58529" stopOpacity="0.7" />
                <stop offset="50%" stopColor="#DD2A7B" stopOpacity="0.7" />
                <stop offset="75%" stopColor="#8134AF" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#515BD4" stopOpacity="0.7" />
              </linearGradient>
            </defs>
            <rect x="0" y="0" width="100" height="100" rx="50" fill="none" stroke="url(#ig-neon)" strokeWidth="1.5" />
          </svg>
          <Instagram
            className="w-6 h-6 sm:w-7 sm:h-7 relative text-text-secondary group-hover:text-white transition-colors duration-300 drop-shadow-sm"
            strokeWidth={1.8}
          />
        </motion.a>
      </Tooltip>

      <Tooltip
        visible={waTooltip}
        label="Fale no WhatsApp"
      >
        <motion.button
          type="button"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 18, stiffness: 220, delay: 0.05 }}
          whileHover={{ scale: 1.12, y: -2 }}
          whileTap={{ scale: 0.92 }}
          onClick={openWhatsApp}
          onMouseEnter={() => setWaTooltip(true)}
          onMouseLeave={() => setWaTooltip(false)}
          onFocus={() => setWaTooltip(true)}
          onBlur={() => setWaTooltip(false)}
          className="pointer-events-auto w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center relative transition-all duration-300 group shadow-xl border border-[#25D366]/20 bg-[#25D366] hover:bg-[#1ebe5b] hover:shadow-[0_0_32px_rgba(37,211,102,0.45)]"
          aria-label="Fale no WhatsApp"
        >
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-40 group-hover:opacity-60"
          />
          <div
            aria-hidden="true"
            className="absolute inset-[2px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 ring-2 ring-white/40"
          />
          <MessageCircle
            className="w-6 h-6 sm:w-7 sm:h-7 relative text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]"
            strokeWidth={2.4}
          />
        </motion.button>
      </Tooltip>
    </div>
  );
}

interface TooltipProps {
  visible: boolean;
  label: string;
  children: React.ReactNode;
}

function Tooltip({ visible, label, children }: TooltipProps) {
  return (
    <div className="relative flex items-center justify-end">
      {children}
      <motion.span
        initial={false}
        animate={{
          opacity: visible ? 1 : 0,
          x: visible ? 0 : 8,
          pointerEvents: visible ? 'auto' : 'none',
        }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="absolute right-[calc(100%+12px)] top-1/2 -translate-y-1/2 whitespace-nowrap hidden sm:flex items-center"
      >
        <span className="px-3 py-1.5 rounded-lg bg-background-card/95 border border-white/10 text-xs font-medium text-text-primary shadow-[0_6px_20px_rgba(0,0,0,0.5)] backdrop-blur-sm">
          {label}
        </span>
        <span className="absolute right-[-5px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rotate-45 bg-background-card/95 border-r border-b border-white/10" />
      </motion.span>
    </div>
  );
}
