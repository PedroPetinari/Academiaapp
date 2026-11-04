/* Mesclagem de dados, nuvem (Supabase) e fotos na nuvem. */
/* ---------- mesclagem (sincronização e backup) ---------- */
const tsOf = x => (x && x.ts) || 0;
/* registros de uma série: junta os dois lados, mas respeita o que foi apagado (lápide 'l' + p + exercício + '|' + data) */
function mergeLogs(a, b, tomb, pre) {
  const m = {};
  (a || []).concat(b || []).forEach(x => {
    if (tomb && tomb[pre + x.d] && tsOf(x) <= tomb[pre + x.d]) return;
    if (!m[x.d] || tsOf(x) > tsOf(m[x.d])) m[x.d] = x;
  });
  return Object.values(m).sort((p, q) => p.d < q.d ? -1 : 1);
}
/* presenças do calendário: vale a mais recente, e o que foi desmarcado depois fica desmarcado */
function mergeMarks(a, b, tomb, pre) {
  const m = {};
  [a, b].forEach(o => Object.keys(o || {}).forEach(k => { m[k] = Math.max(m[k] || 0, +o[k] || 1); }));
  Object.keys(m).forEach(k => { if (tomb[pre + k] && m[k] <= tomb[pre + k]) delete m[k]; });
  return m;
}
function mergeSess(a, b, tomb, pre) {
  const m = {};
  (a || []).concat(b || []).forEach(x => {
    if (tomb[pre + x.id] && tsOf(x) <= tomb[pre + x.id]) return;
    if (!m[x.id] || tsOf(x) > tsOf(m[x.id])) m[x.id] = x;
  });
  return Object.values(m).sort((p, q) => p.d < q.d ? -1 : 1).slice(-100);
}
function mergeState(L, R) {
  const tomb = Object.assign({}, L.tomb || {}), rt = R.tomb || {};
  Object.keys(rt).forEach(k => { tomb[k] = Math.max(tomb[k] || 0, rt[k]); });
  const ids = [], by = {};
  (L.days || []).concat(R.days || []).forEach(d => { if (!by[d.id]) { by[d.id] = []; ids.push(d.id); } by[d.id].push(d); });
  const days = [];
  ids.forEach(id => {
    const A = by[id][0], B = by[id][1];
    const base = B && (B.mt || 0) > (A.mt || 0) ? B : A, oth = B ? (base === A ? B : A) : null;
    if (tomb['d' + id] && (base.mt || 0) <= tomb['d' + id]) return;
    days.push(Object.assign({}, base, { ex: (base.ex || []).map(e => {
      const o = oth && (oth.ex || []).find(z => z.id === e.id);
      return Object.assign({}, e, { log: mergeLogs(e.log, o && o.log, tomb, 'la' + e.id + '|'), log2: mergeLogs(e.log2, o && o.log2, tomb, 'lb' + e.id + '|'), on: ((o && o.on) || '') > (e.on || '') ? o.on : (e.on || '') });
    }) }));
  });
  return { days, marks: mergeMarks(L.marks, R.marks, tomb, 'ma'), marks2: mergeMarks(L.marks2, R.marks2, tomb, 'mb'),
    sessions: mergeSess(L.sessions, R.sessions, tomb, 'sa'), sessions2: mergeSess(L.sessions2, R.sessions2, tomb, 'sb'), tomb };
}
const snap = () => ({ days: S.days, marks: S.marks, marks2: S.marks2 || {}, sessions: S.sessions || [], sessions2: S.sessions2 || [], tomb: S.tomb || {} });
function applyMerged(m) { S.days = m.days; S.marks = m.marks; S.marks2 = m.marks2; S.sessions = m.sessions; S.sessions2 = m.sessions2; S.tomb = m.tomb; }
const stable = o => JSON.stringify(o, (k, v) => (v && typeof v === 'object' && !Array.isArray(v)) ? Object.keys(v).sort().reduce((a, x) => { a[x] = v[x]; return a; }, {}) : v);

/* ---------- nuvem (Supabase) ---------- */
const CFG = window.APPGYM_CONFIG || {};
const SB = { busy: false, again: false, status: '', timer: null };
const sbOn = () => !!(CFG.supabaseUrl && CFG.supabaseKey && (S.cfg.code || '').length >= 8);
async function rpc(fn, body) {
  const r = await fetch(CFG.supabaseUrl.replace(/\/$/, '') + '/rest/v1/rpc/' + fn, { method: 'POST', headers: Object.assign({ apikey: CFG.supabaseKey, 'Content-Type': 'application/json' }, CFG.supabaseKey.indexOf('eyJ') === 0 ? { Authorization: 'Bearer ' + CFG.supabaseKey } : {}), body: JSON.stringify(body) });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  const t = await r.text(); return t ? JSON.parse(t) : null;
}
function schedSync() { if (!sbOn()) return; clearTimeout(SB.timer); SB.timer = setTimeout(syncNow, 1500); }
async function syncNow() {
  if (!sbOn()) return;
  if (SB.busy) { SB.again = true; return; }   /* mudança durante uma sincronização: roda de novo em seguida */
  SB.busy = true;
  try {
    const remote = (await rpc('get_casal', { p_code: S.cfg.code })) || {};
    const m = mergeState(snap(), remote);
    applyMerged(m); saveLocal();
    if (stable(m) !== stable(remote)) await rpc('save_casal', { p_code: S.cfg.code, p_data: m });
    await syncPhotos();
    SB.status = 'Sincronizado às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch (e) { SB.status = 'Não consegui falar com a nuvem (' + e.message + ').'; }
  SB.busy = false; if (SB.again) { SB.again = false; schedSync(); } const cmsg = document.getElementById('cmsg'); if (cmsg) cmsg.textContent = cloudMsg(); softRender();
}
function cloudMsg() {
  if (!(CFG.supabaseUrl && CFG.supabaseKey)) return 'Sincronização desligada: preencha o config.js com os dados do Supabase.';
  if ((S.cfg.code || '').length < 8) return 'Digite o mesmo código (mínimo 8 caracteres) nos dois aparelhos.';
  return SB.status || 'Aguardando a primeira sincronização...';
}

/* ---------- fotos na nuvem ---------- */
const PH = { busy: false, status: '', last: 0 };
const photoHint = () => '<p class="dv">' + (sbOn() ? 'Fotos compartilhadas com a nuvem' + (PH.status ? ' · ' + PH.status : '') : 'Fotos só neste aparelho. Ative a sincronização em Estilo.') + '</p>';
const blobToData = b => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(b); });
async function syncPhotos(force) {
  if (!sbOn() || PH.busy || (!force && Date.now() - PH.last < 25000)) return;
  PH.busy = true;
  try {
    const code = S.cfg.code;
    for (const id of (S.cfg.photoDel || []).slice()) { await rpc('apaga_foto', { p_code: code, p_id: id }); S.cfg.photoDel = (S.cfg.photoDel || []).filter(x => x !== id); saveLocal(); }
    const remote = (await rpc('lista_fotos', { p_code: code })) || [], rm = {};
    remote.forEach(r => { rm[r.id] = r; });
    const local = (await tx('readonly', s => s.getAll())) || [], have = {};
    let changed = false;
    for (const p of local) {
      have[p.id] = 1; const r = rm[p.id];
      if (!r) {
        if (p.synced) { await tx('readwrite', s => s.delete(p.id)); changed = true; continue; }
        await rpc('salva_foto', { p_code: code, p_id: p.id, p_d: p.d || '', p_cap: p.cap || '', p_at: p.at || Date.now(), p_data: await blobToData(p.blob) });
        p.synced = true; p.capDirty = false; await tx('readwrite', s => s.put(p));
      } else if (p.capDirty) {
        await rpc('legenda_foto', { p_code: code, p_id: p.id, p_cap: p.cap || '' }); p.capDirty = false; await tx('readwrite', s => s.put(p));
      } else if ((r.cap || '') !== (p.cap || '')) { p.cap = r.cap || ''; await tx('readwrite', s => s.put(p)); changed = true; }
    }
    for (const r of remote) {
      if (have[r.id]) continue;
      const d = await rpc('pega_foto', { p_code: code, p_id: r.id });
      if (d) { const blob = await (await fetch(d)).blob(); await tx('readwrite', s => s.put({ id: r.id, blob, d: r.d || '', cap: r.cap || '', at: r.at || Date.now(), synced: true })); changed = true; }
    }
    PH.status = remote.length + ' foto' + (remote.length === 1 ? '' : 's'); PH.last = Date.now();
    if (changed) { await loadPhotos(); softRender(); }
  } catch (e) { PH.status = /404/.test(e.message) ? 'rode o SQL novo no Supabase' : 'não consegui sincronizar agora'; }
  PH.busy = false;
  if (view === 'fotos') softRender();
}
