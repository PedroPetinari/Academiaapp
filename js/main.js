/* Inicialização do app. */
function startup() {
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}
  try { if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) navigator.serviceWorker.register('sw.js'); } catch (e) {}
  syncNow();
  setInterval(() => { if (!document.hidden) syncNow(); }, 20000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) syncNow(); });
}

loadPhotos().then(() => { if (view === 'fotos') render(); });

/* no modo Automático, acompanha o aparelho quando ele troca entre claro e escuro */
try {
  const mq = matchMedia('(prefers-color-scheme: dark)'), onMq = () => { if (S.cfg.mode === 'auto') render(); };
  if (mq.addEventListener) mq.addEventListener('change', onMq); else if (mq.addListener) mq.addListener(onMq);
} catch (e) {}

render();
startup();
