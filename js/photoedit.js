/* Editor de foto: cortar, girar, espelhar e ajustar brilho e contraste antes de guardar.
   editPhoto(arquivo, { n, tot, png }) devolve o arquivo editado, o original (se a pessoa pedir) ou null (cancelou). */
const ICO = {
  l: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></svg>',
  r: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 4v5h-5"/></svg>',
  f: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v18"/><path d="M8 7L3 18h5zM16 7l5 11h-5z"/></svg>'
};
const PE_RATIOS = [['free', 'Livre'], ['orig', 'Original'], ['1', '1:1'], ['0.8', '4:5'], ['1.7778', '16:9'], ['0.5625', '9:16']];

function editPhoto(file, info) {
  info = info || {};
  return new Promise(async done => {
    let bm;
    try { bm = await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch (e) { try { bm = await createImageBitmap(file); } catch (e2) { done(file); return; } }
    const K = Math.min(1, 2000 / Math.max(bm.width, bm.height));
    const st = { rot: 0, flip: false, br: 100, ct: 100, ratio: 'free', box: null, W: 0, H: 0, d: 1 };
    const work = document.createElement('canvas');
    const host = document.createElement('div'); host.className = 'ped'; host.setAttribute('role', 'dialog'); host.setAttribute('aria-modal', 'true'); host.setAttribute('aria-label', 'Editar foto');
    host.innerHTML = `<div class="pedh"><b>Editar foto</b><span>${info.tot > 1 ? 'Foto ' + info.n + ' de ' + info.tot : ''}</span></div>
      <div class="pedst"><div class="pedw"><canvas></canvas><div class="pedbox" data-h="move"><i data-h="nw"></i><i data-h="ne"></i><i data-h="sw"></i><i data-h="se"></i></div></div></div>
      <div class="pedt"><div class="pedr">${PE_RATIOS.map(([k, l]) => `<button data-r="${k}">${l}</button>`).join('')}</div>
      <div class="pedr"><button data-a="l" aria-label="Girar para a esquerda">${ICO.l}<span>Girar</span></button><button data-a="r" aria-label="Girar para a direita">${ICO.r}<span>Girar</span></button><button data-a="f" aria-label="Espelhar">${ICO.f}<span>Espelhar</span></button></div>
      <label class="pedl">Brilho<input type="range" min="60" max="140" value="100" data-s="br"></label><label class="pedl">Contraste<input type="range" min="60" max="140" value="100" data-s="ct"></label></div>
      <div class="pedb"><button class="lnk" data-a="no">Cancelar</button><button class="lnk" data-a="orig">Usar original</button><button class="save" data-a="ok">Salvar</button></div>`;
    document.body.appendChild(host); document.body.classList.add('noscroll');
    const cv = host.querySelector('canvas'), box = host.querySelector('.pedbox'), stage = host.querySelector('.pedst');
    const ratioVal = () => st.ratio === 'free' ? 0 : st.ratio === 'orig' ? st.W / st.H : +st.ratio;

    function build() {   /* redesenha a imagem de trabalho com giro e espelho */
      const q = st.rot % 2, bw = Math.round(bm.width * K), bh = Math.round(bm.height * K);
      st.W = q ? bh : bw; st.H = q ? bw : bh; work.width = st.W; work.height = st.H;
      const c = work.getContext('2d'); c.save(); c.translate(st.W / 2, st.H / 2); c.rotate(st.rot * Math.PI / 2); c.scale(st.flip ? -1 : 1, 1); c.drawImage(bm, -bw / 2, -bh / 2, bw, bh); c.restore();
    }
    function fullBox() {   /* maior caixa centralizada com a proporção escolhida */
      const r = ratioVal(); let w = st.W, h = st.H;
      if (r) { if (w / h > r) w = h * r; else h = w / r; }
      st.box = { x: (st.W - w) / 2, y: (st.H - h) / 2, w, h };
    }
    function layout() {
      const mw = stage.clientWidth - 40, mh = stage.clientHeight - 40;
      st.d = Math.min(mw / st.W, mh / st.H);
      cv.width = st.W; cv.height = st.H; cv.style.width = Math.round(st.W * st.d) + 'px'; cv.style.height = Math.round(st.H * st.d) + 'px';
      cv.getContext('2d').drawImage(work, 0, 0);
      cv.style.filter = `brightness(${st.br}%) contrast(${st.ct}%)`;
      place();
    }
    function place() {
      const b = st.box, d = st.d; box.style.left = b.x * d + 'px'; box.style.top = b.y * d + 'px'; box.style.width = b.w * d + 'px'; box.style.height = b.h * d + 'px';
    }
    function marks() {
      host.querySelectorAll('[data-r]').forEach(x => x.classList.toggle('on', x.dataset.r === st.ratio));
    }
    function reset(newBox) { build(); if (newBox) fullBox(); layout(); marks(); }
    reset(true);
    const onResize = () => layout(); window.addEventListener('resize', onResize);

    /* arrastar: mover a caixa ou puxar um canto */
    let drag = null;
    box.addEventListener('pointerdown', e => {
      const h = e.target.dataset.h || 'move'; box.setPointerCapture(e.pointerId);
      const b = st.box; drag = { h, x: e.clientX, y: e.clientY, b: Object.assign({}, b) }; e.preventDefault();
    });
    box.addEventListener('pointermove', e => {
      if (!drag) return;
      const d = st.d, dx = (e.clientX - drag.x) / d, dy = (e.clientY - drag.y) / d, o = drag.b, MIN = Math.min(40, st.W / 4, st.H / 4);
      if (drag.h === 'move') { st.box = { x: Math.max(0, Math.min(st.W - o.w, o.x + dx)), y: Math.max(0, Math.min(st.H - o.h, o.y + dy)), w: o.w, h: o.h }; place(); return; }
      const west = drag.h[1] === 'w', north = drag.h[0] === 'n';
      const fx = west ? o.x + o.w : o.x, fy = north ? o.y + o.h : o.y;   /* canto oposto fica parado */
      let px = (west ? o.x : o.x + o.w) + dx, py = (north ? o.y : o.y + o.h) + dy;
      px = Math.max(0, Math.min(st.W, px)); py = Math.max(0, Math.min(st.H, py));
      let w = Math.max(MIN, Math.abs(px - fx)), h = Math.max(MIN, Math.abs(py - fy)); const r = ratioVal();
      const maxW = west ? fx : st.W - fx, maxH = north ? fy : st.H - fy;
      if (r) { h = Math.max(w / r, MIN); w = h * r; if (w > maxW) { w = maxW; h = w / r; } if (h > maxH) { h = maxH; w = h * r; } }
      else { w = Math.min(w, maxW); h = Math.min(h, maxH); }
      st.box = { x: west ? fx - w : fx, y: north ? fy - h : fy, w, h }; place();
    });
    const end = () => { drag = null; };
    box.addEventListener('pointerup', end); box.addEventListener('pointercancel', end);

    function finish(v) { window.removeEventListener('resize', onResize); host.remove(); document.body.classList.remove('noscroll'); try { bm.close && bm.close(); } catch (e) {} done(v); }
    function save() {
      const b = st.box, out = document.createElement('canvas'); out.width = Math.max(1, Math.round(b.w)); out.height = Math.max(1, Math.round(b.h));
      const c = out.getContext('2d'); c.drawImage(work, b.x, b.y, b.w, b.h, 0, 0, out.width, out.height);
      if (st.br !== 100 || st.ct !== 100) {   /* brilho e contraste pixel a pixel (funciona em qualquer navegador) */
        const im = c.getImageData(0, 0, out.width, out.height), p = im.data, bf = st.br / 100, cf = st.ct / 100;
        for (let i = 0; i < p.length; i += 4) for (let j = 0; j < 3; j++) p[i + j] = Math.max(0, Math.min(255, ((p[i + j] * bf) - 128) * cf + 128));
        c.putImageData(im, 0, 0);
      }
      out.toBlob(bl => finish(bl || file), info.png ? 'image/png' : 'image/jpeg', 0.92);
    }
    host.addEventListener('click', e => {
      const t = e.target.closest('button'); if (!t) return;
      if (t.dataset.r) { st.ratio = t.dataset.r; fullBox(); place(); marks(); return; }
      const a = t.dataset.a;
      if (a === 'l' || a === 'r') { st.rot = (st.rot + (a === 'r' ? 1 : 3)) % 4; reset(true); }
      else if (a === 'f') { st.flip = !st.flip; reset(true); }
      else if (a === 'no') finish(null);
      else if (a === 'orig') finish(file);
      else if (a === 'ok') save();
    });
    host.addEventListener('input', e => { const s = e.target.dataset.s; if (!s) return; st[s] = +e.target.value; cv.style.filter = `brightness(${st.br}%) contrast(${st.ct}%)`; });
    host.addEventListener('keydown', e => { if (e.key === 'Escape') finish(null); });
    host.tabIndex = -1; host.focus();
  });
}
