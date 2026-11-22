// Apenas navegações do painel. A API, a autenticação e os dados dos alunos
// seguem diretamente para a rede, sem armazenamento pelo service worker.
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.mode !== 'navigate' || url.origin !== self.location.origin ||
      !['/admin', '/login'].includes(url.pathname)) return;

  event.respondWith(fetch(event.request).catch(() => new Response(
    '<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Painel TM · Sem conexão</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0a0d14;color:white;font:1rem/1.5 system-ui}main{max-width:26rem;padding:2rem}a{display:inline-block;background:#1446ff;color:white;padding:.8rem 1rem}</style><main><h1>Painel sem conexão</h1><p>Conecte o celular à internet para consultar a agenda ou cadastrar alunos.</p><a href="">Tentar novamente</a></main></html>',
    { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } }
  )));
});
