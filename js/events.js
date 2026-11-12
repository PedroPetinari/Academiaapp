/* Eventos: cliques, digitação, teclado e escolha de arquivos. */
document.addEventListener('click', ev => {
  const b = ev.target.closest('[data-act]'); if (!b) return;
  if (b.dataset.act.slice(0, 2) === 'rt') { rtAct(b.dataset.act, +b.dataset.v); return; }
  const act = b.dataset.act, prev = conf; conf = null;
  const day = S.days.find(d => d.id === S.active);
  const art = b.closest('[data-id]'), ex = day && art ? day.ex.find(e => e.id === art.dataset.id) : null;
  const t = curDate();
  if (act === 'tab') { if (workCtx) notice = 'Termine ou cancele a edição para trocar de treino.'; else S.active = b.dataset.id; }
  else if (act === 'newday') { showNew = true; }
  else if (act === 'nav') { view = b.dataset.v; openP = null; showNew = false; justSaved = ''; }
  else if (act === 'usekg') { const pe = b.dataset.p === 'b' ? 'b' : 'a', k = ex.id + (pe === 'b' ? 'b' : ''), dr = drafts[k]; if (dr) { dr.kg = b.dataset.kg; touched[k] = true; } }
  else if (act === 'editex') { editEx = ex.id; }
  else if (act === 'cancelex') { editEx = null; }
  else if (act === 'saveex') {
    const n = document.getElementById('en').value.trim(), es = document.getElementById('es'), r = document.getElementById('er').value.trim();
    if (n) ex.name = n;
    ex.t = es ? ((es.value.trim() && r) ? es.value.trim() + '×' + r : (r || es.value.trim())) : r;
    day.mt = Date.now(); editEx = null;
  }
  else if (act === 'addset') { const pe = b.dataset.p === 'b' ? 'b' : 'a', k = ex.id + (pe === 'b' ? 'b' : ''), dr = drafts[k]; if (dr) { (dr.x = dr.x || []).push({ kg: dr.kg, r: dr.r }); touched[k] = true; } }
  else if (act === 'delset') { const pe = b.dataset.p === 'b' ? 'b' : 'a', k = ex.id + (pe === 'b' ? 'b' : ''), dr = drafts[k]; if (dr && dr.x) { dr.x.splice(+b.dataset.i, 1); touched[k] = true; } }
  else if (act === 'eye') { const i = document.getElementById('ccode'), show = i.type === 'password'; i.type = show ? 'text' : 'password'; b.textContent = show ? '🙈' : '👁'; return; }
  else if (act === 'theme') { S.cfg.bgType = 'theme'; S.cfg.bgVal = b.dataset.k; S.cfg.accT = 1; S.cfg.acc = themeVars(b.dataset.k).acc; }
  else if (act === 'bgsolid') { S.cfg.bgType = 'solid'; S.cfg.bgVal = b.dataset.c; }
  else if (act === 'bgoff') { S.cfg.bgType = 'auto'; S.cfg.bgVal = ''; }
  else if (act === 'bgphoto') { document.getElementById('bgfile').click(); return; }
  else if (act === 'savetheme') { const n = (document.getElementById('tname').value || '').trim() || ('Tema ' + ((S.cfg.saved || []).length + 1)); (S.cfg.saved = S.cfg.saved || []).push({ n, bgType: S.cfg.bgType, bgVal: S.cfg.bgVal, acc: S.cfg.acc, accT: S.cfg.accT, embOff: S.cfg.embOff, embId: S.cfg.embId }); }
  else if (act === 'applytheme') { const th = (S.cfg.saved || [])[+b.dataset.i]; if (th) { S.cfg.bgType = th.bgType; S.cfg.bgVal = th.bgVal; S.cfg.acc = th.acc; if (th.accT) S.cfg.accT = 1; else delete S.cfg.accT; S.cfg.embOff = !!th.embOff; if (th.embId) S.cfg.embId = th.embId; else delete S.cfg.embId; } }
  else if (act === 'deltheme') { (S.cfg.saved || []).splice(+b.dataset.i, 1); }
  else if (act === 'embpick') { document.getElementById('embfile').click(); return; }
  else if (act === 'embdef') { const old = S.cfg.embId; delete S.cfg.embId; S.cfg.embOff = false; if (old && !embUsed(old)) tx('readwrite', s => s.delete(old), 'bg').catch(() => {}); }
  else if (act === 'embtog') { S.cfg.embOff = !S.cfg.embOff; }
  else if (act === 'sync') { SB.status = 'Sincronizando...'; syncNow(); }
  else if (act === 'export') { exportData(); }
  else if (act === 'import') { document.getElementById('bkp').click(); return; }
  else if (act === 'copy') { copySess(b.dataset.sid); }
  else if (act === 'who') { who = b.dataset.v; }
  else if (act === 'finish' || act === 'runend') { if (hasWork()) askEnd = act; else doFinish(act, prev); }
  else if (act === 'askno') { askEnd = null; }
  else if (act === 'askyes') { const a = askEnd || 'finish'; askEnd = null; doFinish(a, prev); }
  else if (act === 'hedit' || act === 'hresume') { startEdit(b.dataset.sid, act === 'hresume'); }
  else if (act === 'editcancel') { cancelEdit(); }
  else if (act === 'bmet') { bodyMetric = b.dataset.k; }
  else if (act === 'bsave') { bodyMsg = bodySave(who) ? 'Salvo em ' + fd(bodyDate) + '.' : 'Preencha o peso ou alguma medida.'; }
  else if (act === 'bdel') { const d = b.dataset.d; if (prev === 'g' + d) bodyDel(who, d); else conf = 'g' + d; }
  else if (act === 'cheerx') { cheer = null; }
  else if (act === 'cheerdemo') { cheerDemo(); }
  else if (act === 'rxas') { rxAs = b.dataset.v; }
  else if (act === 'rxe') { const mine = rxList(who, b.dataset.sid).find(r => r.by === rxBy()); rxSet(who, b.dataset.sid, rxBy(), { e: mine && mine.e === b.dataset.e ? '' : b.dataset.e }); }
  else if (act === 'rxsend') { const inp = b.closest('.rxc').querySelector('input'); rxSet(who, b.dataset.sid, rxBy(), { c: inp.value.trim() }); }
  else if (act === 'notif') { try { Notification.requestPermission().then(() => render()); } catch (e) {} return; }
  else if (act === 'runstart') { S.run = { at: Date.now() }; }
  else if (act === 'ptpick') { ptSlot = +b.dataset.i; document.getElementById('ptfile').click(); return; }
  else if (act === 'ptuse') { const t = (S.cfg.pt || [])[+b.dataset.i]; if (t && t.id) { S.cfg.bgType = 'photo'; S.cfg.bgVal = t.id; if (t.acc) { S.cfg.acc = t.acc; delete S.cfg.accT; } } }
  else if (act === 'dels') { const sid = b.dataset.sid; if (prev === 's' + sid) { const a = SS(who).filter(x => x.id !== sid); if (who === 'b') S.sessions2 = a; else S.sessions = a; S.tomb['s' + who + sid] = Date.now(); } else conf = 's' + sid; }
  else if (act === 'prevm' || act === 'nextm') { cm.setMonth(cm.getMonth() + (act === 'nextm' ? 1 : -1)); }
  else if (act === 'seld') { sel = b.dataset.d; }
  else if (act === 'mark') { if (MK(who)[sel]) markOff(who, sel); else markOn(who, sel); }
  else if (act === 'cfg') { S.cfg[b.dataset.k] = b.dataset.v; }
  else if (act === 'acc') { S.cfg.acc = b.dataset.c; delete S.cfg.accT; }
  else if (act === 'reset') { S.cfg = Object.assign({}, DEF, { code: S.cfg.code, saved: S.cfg.saved, pt: S.cfg.pt }); }
  else if (act === 'addph') { document.getElementById('file').click(); return; }
  else if (act === 'openp') { openP = b.dataset.id; }
  else if (act === 'closep') { openP = null; }
  else if (act === 'delp') { if (prev === 'p' + openP) { deletePhoto(openP); openP = null; } else conf = 'p' + openP; }
  else if (act === 'cancelday') { showNew = false; }
  else if (act === 'mkday') {
    const n = document.getElementById('ndn').value.trim(); if (!n) return;
    const d = mk(n, []); S.days.push(d); S.active = d.id; showNew = false;
  }
  else if (act === 'delday') { if (prev === day.id) { S.tomb['d' + day.id] = Date.now(); S.days = S.days.filter(d => d !== day); S.active = null; } else conf = day.id; }
  else if (act === 'delex') { if (prev === ex.id) { day.ex = day.ex.filter(e => e !== ex); day.mt = Date.now(); } else conf = ex.id; }
  else if (act === 'chk') { ex.on = b.checked ? t : ''; }
  else if (act === 'dellog') {
    const pe = b.dataset.p === 'b' ? 'b' : 'a', d0 = b.dataset.d, L = LG(ex, pe).filter(x => x.d !== d0);
    if (pe === 'b') ex.log2 = L; else ex.log = L;
    S.tomb['l' + pe + ex.id + '|' + d0] = Date.now();   /* lápide: a sincronização não pode trazer este registro de volta */
    delete drafts[ex.id + (pe === 'b' ? 'b' : '')]; upsertSession(day, d0, pe);
  }
  else if (act === 'save') {
    const pe = b.dataset.p === 'b' ? 'b' : 'a', dr = drafts[ex.id + (pe === 'b' ? 'b' : '')];
    if (!dr || !logIt(ex, pe, dr, t)) return;
    markOn(pe, t); upsertSession(day, t, pe); if (+S.cfg.rest) rtStart(+S.cfg.rest);
  }
  else if (act === 'addex') {
    const n = document.getElementById('nn').value.trim(); if (!n) return;
    day.ex.push({ id: uid(), name: n, t: document.getElementById('nt').value.trim() || (day.check ? '' : '3×10'), log: [], on: '' }); day.mt = Date.now();
  }
  persist(); render();
  if (act === 'newday') { const i = document.getElementById('ndn'); if (i) i.focus(); }
});

document.addEventListener('input', ev => {
  const f = ev.target.dataset.f; if (!f) return;
  const art = ev.target.closest('.ex'), k = art.dataset.id + (ev.target.dataset.p === 'b' ? 'b' : ''), d = drafts[k]; if (!d) return;
  if (f === 'xkg' || f === 'xr') { const o = (d.x || [])[+ev.target.dataset.i]; if (o) o[f === 'xkg' ? 'kg' : 'r'] = ev.target.value; } else d[f] = ev.target.value; touched[k] = true;
  ev.target.closest('.pp').querySelector('[data-vol]').textContent = vol(d) + ' kg';
});

document.addEventListener('keydown', ev => {
  if (ev.key === 'Escape' && askEnd) { askEnd = null; render(); return; }
  if (ev.key !== 'Enter') return;
  if (ev.target.classList && ev.target.classList.contains('rxin')) { ev.target.closest('.rxc').querySelector('[data-act="rxsend"]').click(); return; }
  const id = ev.target.id;
  if (id === 'ndn') document.querySelector('[data-act="mkday"]').click();
  if (id === 'ccode') { S.cfg.code = ev.target.value.trim(); saveLocal(); SB.status = 'Sincronizando...'; syncNow(); }
  if (id === 'en' || id === 'es' || id === 'er') document.querySelector('[data-act="saveex"]').click();
  if (id === 'nn' || id === 'nt') document.querySelector('[data-act="addex"]').click();
});

document.addEventListener('input', ev => {
  const i = ev.target.id;
  if (i === 'cname') { S.cfg.name = ev.target.value; applyCfg(); persist(); }
  if (i === 'ccol') { S.cfg.acc = ev.target.value; delete S.cfg.accT; applyCfg(); persist(); }
  if (i === 'cbg') { S.cfg.bgType = 'solid'; S.cfg.bgVal = ev.target.value; applyCfg(); saveLocal(); }
  if (i === 'ccode') { S.cfg.code = ev.target.value.trim(); saveLocal(); const m = document.getElementById('cmsg'); if (m) m.textContent = cloudMsg(); }
  if (i === 'bh') { bodySetH(who, ev.target.value); persist(); }
  if (i === 'cn1') { S.cfg.n1 = ev.target.value; persist(); }
  if (i === 'cn2') { S.cfg.n2 = ev.target.value; persist(); }
  if (i && i.slice(0, 3) === 'ptn') { const t = (S.cfg.pt || [])[+i.slice(3)]; if (t) { t.n = ev.target.value; saveLocal(); } }
});

document.addEventListener('change', async ev => {
  const i = ev.target.id;
  if (i === 'ccode') { S.cfg.code = ev.target.value.trim(); saveLocal(); SB.status = ''; syncNow(); softRender(); }
  if (i === 'bd') { bodyDate = ev.target.value || todayStr(); bodyMsg = ''; render(); }
  if (i === 'bex') { bodyEx = ev.target.value; render(); }
  if (i === 'bh') { render(); }
  if (i === 'bgfile') {
    const f = ev.target.files[0]; ev.target.value = ''; if (!f) return;
    try { const blob = await shrink(f, 1400), id = uid(); await tx('readwrite', s => s.put({ id, blob }), 'bg'); bgUrls[id] = URL.createObjectURL(blob); S.cfg.bgType = 'photo'; S.cfg.bgVal = id; saveLocal(); render(); } catch (e) {}
  }
  if (i === 'ptfile') {
    const f = ev.target.files[0]; ev.target.value = ''; if (!f || ptSlot < 0 || !S.cfg.pt[ptSlot]) return;
    try {
      const blob = await shrink(f, 1400), id = uid(), t = S.cfg.pt[ptSlot], old = t.id;
      await tx('readwrite', s => s.put({ id, blob }), 'bg'); bgUrls[id] = URL.createObjectURL(blob);
      t.id = id; t.acc = await accentOf(blob);
      S.cfg.bgType = 'photo'; S.cfg.bgVal = id; if (t.acc) S.cfg.acc = t.acc; delete S.cfg.accT;
      if (old && !bgUsed(old)) tx('readwrite', s => s.delete(old), 'bg').catch(() => {});
      saveLocal(); render();
    } catch (e) {}
  }
  if (i === 'embfile') {
    const f = ev.target.files[0]; ev.target.value = ''; if (!f) return;
    try {
      const blob = await shrink(f, 720, 0.9, 'image/png'), id = uid(), old = S.cfg.embId;
      await tx('readwrite', s => s.put({ id, blob }), 'bg'); bgUrls[id] = URL.createObjectURL(blob);
      S.cfg.embId = id; S.cfg.embOff = false;
      if (old && !embUsed(old)) tx('readwrite', s => s.delete(old), 'bg').catch(() => {});
      saveLocal(); render();
    } catch (e) {}
  }
  if (i === 'bkp') {
    const f = ev.target.files[0]; ev.target.value = ''; if (!f) return;
    try { const d = JSON.parse(await f.text()); if (!Array.isArray(d.days)) throw 0; applyMerged(mergeState(snap(), d)); persist(); dataMsg = 'Backup importado e combinado com os dados atuais.'; } catch (e) { dataMsg = 'Arquivo inválido.'; }
    render();
  }
  if (i === 'cap') { const p = photos && photos.find(x => x.id === openP); if (p) { p.cap = ev.target.value; p.capDirty = true; try { await tx('readwrite', s => s.put(p)); } catch (e) {} syncPhotos(true); } }
  if (i === 'file') {
    const fs = [...ev.target.files]; ev.target.value = '';
    for (const f of fs) {
      try { const blob = await shrink(f, 1100, 0.72); await tx('readwrite', s => s.put({ id: uid(), blob, d: todayStr(), at: Date.now(), cap: '' })); } catch (e) {}
    }
    await loadPhotos(); render(); syncPhotos(true);
  }
});

document.addEventListener('mousedown', ev => { if (ev.target.closest('button, summary')) ev.preventDefault(); });
document.getElementById('tabs').addEventListener('wheel', ev => { const t = ev.currentTarget; if (Math.abs(ev.deltaY) > Math.abs(ev.deltaX)) { t.scrollLeft += ev.deltaY; ev.preventDefault(); } }, { passive: false });
