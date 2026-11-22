import { useEffect, useState } from 'react';
import { Smartphone } from 'lucide-react';

interface InstallEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}

let pending: InstallEvent | undefined;
window.addEventListener('beforeinstallprompt', (event) => {
  if (!/^\/(admin|login)\/?$/.test(location.pathname)) return;
  event.preventDefault();
  pending = event as InstallEvent;
});
window.addEventListener('appinstalled', () => { pending = undefined; });

export default function PainelAppAccess() {
  const [help, setHelp] = useState(false);
  const [offline, setOffline] = useState(!navigator.onLine);
  const [installed, setInstalled] = useState(() =>
    matchMedia('(display-mode: standalone)').matches ||
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone));

  useEffect(() => {
    const links = [
      ['manifest', '/painel.webmanifest'],
      ['apple-touch-icon', '/painel/icone-180.png'],
    ].map(([rel, href]) => {
      const link = document.createElement('link');
      link.rel = rel;
      link.href = href;
      document.head.appendChild(link);
      return link;
    });
    const appleTitle = document.createElement('meta');
    appleTitle.name = 'apple-mobile-web-app-title';
    appleTitle.content = 'Painel TM';
    document.head.appendChild(appleTitle);
    if (import.meta.env.PROD && 'serviceWorker' in navigator) {
      void navigator.serviceWorker.register('/painel-sw.js').catch(console.warn);
    }
    const connection = () => setOffline(!navigator.onLine);
    const onInstall = () => setInstalled(true);
    window.addEventListener('online', connection);
    window.addEventListener('offline', connection);
    window.addEventListener('appinstalled', onInstall);
    return () => {
      links.forEach(link => link.remove());
      appleTitle.remove();
      window.removeEventListener('online', connection);
      window.removeEventListener('offline', connection);
      window.removeEventListener('appinstalled', onInstall);
    };
  }, []);

  async function install() {
    const event = pending;
    if (!event) { setHelp(!help); return; }
    pending = undefined;
    try {
      await event.prompt();
      await event.userChoice;
    } catch { setHelp(true); }
  }

  return (
    <div className="min-w-0 text-sm">
      {!installed && <button type="button" onClick={install} aria-expanded={help}
        className="inline-flex min-h-11 items-center gap-2 font-semibold text-brand-ink underline underline-offset-4">
        <Smartphone size={16} aria-hidden="true" /> Instalar painel
      </button>}
      {help && !installed && <div className="max-w-sm space-y-2 rounded border border-white/20 p-3 text-slate-200">
        <p><strong>iPhone</strong> · Abra no Safari, toque em Compartilhar e em Adicionar à Tela de Início. Ative “Abrir como App” se aparecer.</p>
        <p><strong>Android</strong> · Abra no Chrome e escolha Instalar aplicativo ou Adicionar à tela inicial no menu ⋮.</p>
      </div>}
      {offline && <p role="status" className="py-2 text-amber-300">Sem conexão. Reconecte para atualizar a agenda e salvar cadastros.</p>}
    </div>
  );
}
