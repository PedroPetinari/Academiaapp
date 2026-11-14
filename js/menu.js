/* Menu ao segurar: pressionar e segurar um item (ou clicar com o botão direito) abre uma folha com as ações dele.
   As ações reais ficam escondidas dentro do próprio item ([data-lpa]); a folha só as aciona. */
let lpTimer = null, lpPos = null, lpSwallow = 0, lpSheet = null, lpHeld = false, lpGo = false;
const LPSKIP = 'input,textarea,select,a,.ped';

function lpActs(el) { return Array.from(el.querySelectorAll('[data-lpa]')).filter(a => a.closest('[data-lp]') === el); }
function lpClose() { if (lpSheet) { lpSheet.remove(); lpSheet = null; document.removeEventListener('keydown', lpKey, true); } }
function lpKey(e) { if (e.key === 'Escape') { e.stopPropagation(); lpClose(); } }
function lpOpen(el) {
  const acts = lpActs(el); if (!acts.length) return;
  lpClose(); try { if (navigator.vibrate) navigator.vibrate(15); } catch (e) {}
  const id = el.dataset.lpid, sh = document.createElement('div'); sh.className = 'lpsheet'; sh.setAttribute('role', 'dialog'); sh.setAttribute('aria-modal', 'true');
  sh.innerHTML = `<div class="lpbd" data-lpx></div><div class="lppn">${el.dataset.lpt ? `<p class="lpt">${esc(el.dataset.lpt)}</p>` : ''}${acts.map((a, i) => `<button class="lpb ${a.hasAttribute('data-lpd') ? 'dg' : ''}" data-lpi="${i}" data-lpn="${esc(a.dataset.lpl || 'Ação')}">${esc(a.dataset.lpl || 'Ação')}</button>`).join('')}<button class="lpb" data-lpx>Cancelar</button></div>`;
  sh.addEventListener('click', ev => {
    const b = ev.target.closest('button,[data-lpx]'); if (!b) return;
    if (b.dataset.lpx !== undefined) { lpClose(); return; }
    const i = +b.dataset.lpi, a0 = acts[i];
    if (a0.hasAttribute('data-lpd') && !b.classList.contains('sure')) { b.classList.add('sure'); b.textContent = 'Toque de novo para confirmar'; return; }
    lpClose();
    const twice = a0.hasAttribute('data-lpc'), find = () => { const h = document.querySelector('[data-lpid="' + id + '"]'); return h ? lpActs(h)[i] : null; };
    lpGo = true; try { const t1 = find(); if (t1) t1.click(); if (twice) { const t2 = find(); if (t2) t2.click(); } } finally { lpGo = false; }
  });
  document.body.appendChild(sh); lpSheet = sh; document.addEventListener('keydown', lpKey, true);
  const f = sh.querySelector('.lpb'); if (f) f.focus();
}
const lpStop = () => { clearTimeout(lpTimer); lpTimer = null; lpPos = null; };
document.addEventListener('pointerdown', ev => {
  if (ev.button > 0 || ev.target.closest(LPSKIP)) return;
  const el = ev.target.closest('[data-lp]'); if (!el || !lpActs(el).length) return;
  lpPos = [ev.clientX, ev.clientY]; clearTimeout(lpTimer);
  lpTimer = setTimeout(() => { lpTimer = null; lpHeld = true; lpOpen(el); }, 480);
});
document.addEventListener('pointermove', ev => { if (lpPos && Math.hypot(ev.clientX - lpPos[0], ev.clientY - lpPos[1]) > 10) lpStop(); });
['pointerup', 'pointercancel', 'dragstart'].forEach(n => document.addEventListener(n, () => { lpStop(); if (lpHeld) { lpHeld = false; lpSwallow = Date.now() + 350; } }));
window.addEventListener('scroll', lpStop, true);
document.addEventListener('contextmenu', ev => {
  const el = ev.target.closest && ev.target.closest('[data-lp]');
  if (el && lpActs(el).length && !ev.target.closest('input,textarea')) { ev.preventDefault(); lpStop(); lpSwallow = Date.now() + 400; lpOpen(el); }
});
/* o toque que "solta" o dedo depois de segurar não pode acionar o item por baixo */
document.addEventListener('click', ev => { if (!lpGo && (lpHeld || Date.now() < lpSwallow) && !ev.target.closest('.lpsheet')) { ev.stopPropagation(); ev.preventDefault(); } }, true);
