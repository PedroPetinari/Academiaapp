const KEY = 'meu-treino-v1';
const uid = () => Math.random().toString(36).slice(2, 8);
const todayStr = () => new Date().toLocaleDateString('sv');
const fd = d => d.slice(8, 10) + '/' + d.slice(5, 7);
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const num = v => parseFloat(String(v).replace(',', '.'));
const fmt = n => (Math.round(n * 10) / 10).toLocaleString('pt-BR');

const slug = s => s.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '');
const mk = (name, items, check) => ({
  id: items.length ? 'd' + slug(name) : uid(), name, check: !!check, mt: items.length ? 0 : Date.now(),
  ex: items.map((s, i) => { const [n, t] = s.split('|'); return { id: 'e' + slug(name) + i, name: n, t, log: [], on: '' }; })
});

const seed = () => [
  mk('Peito', ['Supino inclinado com halteres|4×8','Supino reto|3×8','Crucifixo|3×12-15','Crossover na polia|3×12-15']),
  mk('Costas', ['Puxada alta pegada aberta|4×8-12','Remada curvada ou cavalinho|3×8-10','Remada baixa|3×10-12','Pullover na polia|3×12-15','Crucifixo inverso na polia cruzada (o X)|3×12-15','Puxada unilateral na máquina|3×10']),
  mk('Ombros', ['Desenvolvimento com halteres|3×8','Elevação lateral|4×12','Elevação lateral na polia|3×15','Elevação frontal|3×12','Crucifixo inverso na máquina|3×15','Encolhimento|3×12']),
  mk('Braços', ['Rosca direta|3×8-12','Rosca martelo|3×10-12','Tríceps corda|3×10-12','Tríceps testa|3×10-12','Rosca concentrada|3×12']),
  mk('Quadríceps', ['Agachamento livre|3×10','Agachamento na máquina|4×10','Leg press|3×12','Cadeira extensora|3×12','Afundo ou passada|3×10 por perna','Panturrilha em pé|4×15']),
  mk('Posterior e glúteo', ['Stiff|4×8-10','Elevação pélvica (hip thrust)|4×8-12','Mesa flexora|3×10-12','Stiff unilateral ou terra romeno|3×10','Cadeira abdutora|3×15','Coice na polia ou máquina|3×12 por perna','Panturrilha sentado|3×15']),
  mk('Livres', ['Prancha|3×30-60 s','Prancha lateral|3×30 s por lado','Elevação de pernas deitado|3×12-15','Abdominal remador|3×15-20','Abdominal bicicleta|3×20','Flexão tradicional|3×até 1-2 da falha','Flexão com pés elevados|3×10-15','Flexão diamante|3×8-12','Flexão pike|3×8-12','Barra fixa|3×máximo','Paralelas|3×8-12','Panturrilha no degrau|4×15-20']),
  mk('Aquecimento', ['Esteira, bike ou elíptico leve|5 min','Rotação de ombros e círculos de braço|10 por lado','Rotação de tronco e gato-camelo|10','Agachamento livre sem peso|10-15','Balanço de perna frente e lado|10 por perna','Série de aquecimento com 50% da carga|1 série'], true),
  mk('Pós-treino', ['Esteira (você 10-15 min; ela 20-30 min)|10-30 min','Panturrilha|3×15-20','Alongar peito: braço na parede|20-30 s','Alongar costas: abraçar o corpo e curvar|20-30 s','Alongar ombros: braço cruzado|20-30 s','Alongar bíceps e tríceps|20-30 s','Alongar quadríceps|20-30 s','Alongar posterior: sentado, tocar os pés|20-30 s','Alongar glúteo: figura 4|20-30 s','Alongar panturrilha na parede|20-30 s'], true)
];

let S = null;
try { S = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
if (!S || !Array.isArray(S.days)) S = { days: seed(), active: null };
const DEF = { name: 'AppGym', acc: '#0B7A5F', mode: 'auto', font: 'cond', lay: 'cards', den: 'cozy', n1: 'Pedro', n2: 'Brenda', rest: '90', goal: '4', code: '' };
S.cfg = Object.assign({}, DEF, S.cfg || {});
if (!S.marks) { S.marks = {}; S.days.forEach(d => d.check || d.ex.forEach(e => e.log.forEach(x => { S.marks[x.d] = 1; }))); }
function backfill() {
  const m = {};
  S.days.forEach(d => { if (d.check) return; d.ex.forEach(e => e.log.forEach(x => { const k = x.d + '|' + d.id; (m[k] = m[k] || { id: k, d: x.d, day: d.name, items: [] }).items.push({ n: e.name, kg: x.kg, s: x.s, r: x.r }); })); });
  return Object.values(m).sort((a, b) => a.d < b.d ? -1 : 1);
}
if (!S.sessions) S.sessions = backfill();
S.marks2 = S.marks2 || {}; S.sessions2 = S.sessions2 || []; S.tomb = S.tomb || {};
const saveLocal = () => { try { localStorage.setItem(KEY, JSON.stringify(S, (k, v) => k === 'cur' ? undefined : v)); } catch (e) {} };
const persist = () => { saveLocal(); schedSync(); };

let drafts = {}, conf = null, showNew = false;
const firstRep = t => { const m = /[x×]\s*(\d+)/i.exec(t); return m ? m[1] : '10'; };
function LG(e, p) { return p === 'b' ? (e.log2 || (e.log2 = [])) : e.log; }
function N(p) { return (p === 'b' ? S.cfg.n2 : S.cfg.n1) || (p === 'b' ? 'Pessoa 2' : 'Pessoa 1'); }
function MK(p) { if (p === 'b') { S.marks2 = S.marks2 || {}; return S.marks2; } return S.marks; }
function SS(p) { if (p === 'b') { S.sessions2 = S.sessions2 || []; return S.sessions2; } return S.sessions; }
function logIt(e, p, dr, t) {
  const kg = num(dr.kg), s = num(dr.s), r = num(dr.r);
  if (!(s > 0 && r > 0)) return false;
  const L = LG(e, p).filter(x => x.d !== t); L.push({ d: t, kg: isNaN(kg) ? 0 : kg, s, r, ts: Date.now() }); L.sort((a, c) => a.d < c.d ? -1 : 1);
  if (p === 'b') e.log2 = L; else e.log = L;
  return true;
}
function whoSeg() { return `<div class="sg who">${['a', 'b'].map(v => `<button class="${who === v ? 'on' : ''}" data-act="who" data-v="${v}">${esc(N(v))}</button>`).join('')}</div>`; }
const draft = (e, p) => {
  const k = e.id + (p === 'b' ? 'b' : '');
  if (!drafts[k]) { const l = LG(e, p).slice(-1)[0]; drafts[k] = l ? { kg: l.kg, s: l.s, r: l.r } : { kg: '', s: parseInt(e.t) || 3, r: firstRep(e.t) }; }
  return drafts[k];
};
const vol = d => { const v = (num(d.kg) || 0) * (num(d.s) || 0) * (num(d.r) || 0); return fmt(v); };
const dayVol = (day, t, p) => day.ex.reduce((a, e) => a + LG(e, p || 'a').filter(x => x.d === t).reduce((b, x) => b + x.kg * x.s * x.r, 0), 0);

function row(e) {
  const t = todayStr();
  if (S.cur.check) {
    return `<div class="ex" data-id="${e.id}"><div class="chk"><input type="checkbox" aria-label="${esc(e.name)}" data-act="chk" ${e.on === t ? 'checked' : ''}><span>${esc(e.name)}</span><span class="tg">${esc(e.t)}</span></div>
    <button class="lnk ${conf === e.id ? 'sure' : ''}" data-act="delex">${conf === e.id ? 'Confirmar remoção' : 'Remover'}</button></div>`;
  }
  const pp = p => {
    const L = LG(e, p), last = L[L.length - 1], pr = L.reduce((m, x) => Math.max(m, x.kg), 0);
    const dr = draft(e, p), has = L.some(x => x.d === t);
    const hist = L.slice(-6).reverse().map(x => `<li><span>${fd(x.d)} · ${fmt(x.kg)} kg · ${x.s}×${x.r} · ${fmt(x.kg * x.s * x.r)} kg de volume</span><button class="lnk" data-act="dellog" data-p="${p}" data-d="${x.d}" aria-label="Apagar registro">Apagar</button></li>`).join('');
    return `<div class="pp"><div class="pn"><b>${esc(N(p))}</b><span>Volume <i data-vol>${vol(dr)} kg</i></span></div>
      <div class="ins">
        <label>Carga (kg)<input inputmode="decimal" data-f="kg" data-p="${p}" value="${esc(dr.kg)}"></label>
        <label>Séries<input inputmode="numeric" data-f="s" data-p="${p}" value="${esc(dr.s)}"></label>
        <label>Reps<input inputmode="numeric" data-f="r" data-p="${p}" value="${esc(dr.r)}"></label>
        <button class="save" data-act="save" data-p="${p}">${has ? 'Atualizar' : 'Salvar'}</button>
      </div>
      <p class="meta">${last ? `Última: ${fmt(last.kg)} kg · ${last.s}×${last.r} · ${fd(last.d)}` : 'Sem registros ainda'}${pr ? ` · <span class="pr">Recorde: ${fmt(pr)} kg</span>` : ''}${sug(e, last)}</p>
      ${L.length ? `<details><summary>Histórico</summary><ul>${hist}</ul></details>` : ''}</div>`;
  };
  return `<article class="ex" data-id="${e.id}">
    <div class="top"><h3>${esc(e.name)}</h3><span class="tg">${esc(e.t)}</span></div>
    ${pp('a')}${pp('b')}
    <button class="lnk ${conf === e.id ? 'sure' : ''}" data-act="delex">${conf === e.id ? 'Confirmar remoção' : 'Remover'}</button>
  </article>`;
}

function render() {
  applyCfg(); renderBar(); renderOv(); rtShow();
  const tb = document.getElementById('tabs'), nd = document.getElementById('newday');
  tb.hidden = nd.hidden = view !== 'treino';
  if (view !== 'treino') { document.getElementById('main').innerHTML = view === 'cal' ? viewCal() : view === 'hist' ? viewHist() : view === 'fotos' ? viewPhotos() : viewStyle(); document.querySelectorAll('[data-bg]').forEach(b => { b.style.background = b.dataset.bg; }); return; }
  const t = todayStr();
  let day = S.days.find(d => d.id === S.active) || S.days[0];
  S.active = day ? day.id : null;
  S.cur = day || {};
  const tv = q => S.days.filter(d => !d.check).reduce((a, d) => a + dayVol(d, t, q), 0);
  document.getElementById('today').innerHTML = `Volume de hoje<br>${esc(N('a'))} <b>${fmt(tv('a'))}</b> kg<br>${esc(N('b'))} <b>${fmt(tv('b'))}</b> kg`;
  document.getElementById('tabs').innerHTML = S.days.map(d => `<button class="st ${day && d.id === day.id ? 'on' : ''} ${did(d, t) ? 'dn' : ''}" data-act="tab" data-id="${d.id}"><span class="rg"><span class="in">${esc(d.name.slice(0, 2))}</span></span><em>${esc(d.name)}</em></button>`).join('') + `<button class="st" data-act="newday"><span class="rg"><span class="in">+</span></span><em>Treino</em></button>`;
  { const tb2 = document.getElementById('tabs'), on = tb2.querySelector('.st.on'); if (on) tb2.scrollLeft = on.offsetLeft - tb2.clientWidth / 2 + on.offsetWidth / 2; }
  document.getElementById('newday').innerHTML = showNew ? `<div class="newday"><input id="ndn" placeholder="Nome do treino (ex.: Costas 2)" maxlength="40"><button class="save" data-act="mkday">Criar treino</button><button class="lnk" data-act="cancelday">Cancelar</button></div>` : '';
  const main = document.getElementById('main');
  if (!day) { main.innerHTML = '<p class="empty">Nenhum treino ainda. Toque em “+ Treino” para criar o primeiro.</p>'; return; }
  const nt = notice; notice = '';
  const dv = day.check ? '' : `<p class="dv">Volume de hoje neste treino: ${esc(N('a'))} ${fmt(dayVol(day, t, 'a'))} kg · ${esc(N('b'))} ${fmt(dayVol(day, t, 'b'))} kg</p>`;
  main.innerHTML = `<div class="dayhead"><h2>${esc(day.name)}</h2><button class="lnk ${conf === day.id ? 'sure' : ''}" data-act="delday">${conf === day.id ? 'Confirmar remoção do treino' : 'Remover treino'}</button></div>${dv}
  ${day.ex.length ? day.ex.map(row).join('') : '<p class="empty">Este treino está vazio. Adicione um exercício abaixo.</p>'}
  ${day.check ? '' : `${nt ? `<p class="notice" role="status">${nt}</p>` : ''}<button class="save wide fin" data-act="finish">Salvar treino</button>`}
  <div class="add-ex"><input id="nn" placeholder="${day.check ? 'Novo item' : 'Novo exercício'}" maxlength="60"><input id="nt" placeholder="${day.check ? 'Tempo ou reps' : 'Ex.: 3×10'}" maxlength="24"><button data-act="addex">Adicionar</button></div>`;
}

document.addEventListener('click', ev => {
  const b = ev.target.closest('[data-act]'); if (!b) return;
  if (b.dataset.act.slice(0, 2) === 'rt') { rtAct(b.dataset.act, +b.dataset.v); return; }
  const act = b.dataset.act, prev = conf; conf = null;
  const day = S.days.find(d => d.id === S.active);
  const art = b.closest('[data-id]'), ex = day && art ? day.ex.find(e => e.id === art.dataset.id) : null;
  const t = todayStr();
  if (act === 'tab') { S.active = b.dataset.id; }
  else if (act === 'newday') { showNew = true; }
  else if (act === 'nav') { view = b.dataset.v; openP = null; showNew = false; justSaved = ''; }
  else if (act === 'sync') { SB.status = 'Sincronizando...'; syncNow(); }
  else if (act === 'export') { exportData(); }
  else if (act === 'import') { document.getElementById('bkp').click(); return; }
  else if (act === 'copy') { copySess(b.dataset.sid); }
  else if (act === 'who') { who = b.dataset.v; }
  else if (act === 'finish') {
    const got = [];
    ['a', 'b'].forEach(pe => {
      day.ex.forEach(e => { const k = e.id + (pe === 'b' ? 'b' : ''); if (drafts[k] && touched[k]) logIt(e, pe, drafts[k], t); });
      upsertSession(day, t, pe);
      if (SS(pe).find(x => x.id === t + '|' + day.id)) { MK(pe)[t] = 1; got.push(pe); }
    });
    if (got.length) { justSaved = t + '|' + day.id; who = got[0]; view = 'hist'; Object.keys(touched).forEach(k => delete touched[k]); }
    else notice = 'Preencha ao menos um exercício (carga, séries e reps) para salvar o treino.';
  }
  else if (act === 'dels') { const sid = b.dataset.sid; if (prev === 's' + sid) { const a = SS(who).filter(x => x.id !== sid); if (who === 'b') S.sessions2 = a; else S.sessions = a; S.tomb['s' + who + sid] = Date.now(); } else conf = 's' + sid; }
  else if (act === 'prevm' || act === 'nextm') { cm.setMonth(cm.getMonth() + (act === 'nextm' ? 1 : -1)); }
  else if (act === 'seld') { sel = b.dataset.d; }
  else if (act === 'mark') { const M = MK(who); if (M[sel]) delete M[sel]; else M[sel] = 1; }
  else if (act === 'cfg') { S.cfg[b.dataset.k] = b.dataset.v; }
  else if (act === 'acc') { S.cfg.acc = b.dataset.c; }
  else if (act === 'reset') { S.cfg = Object.assign({}, DEF); }
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
  else if (act === 'dellog') { const pe = b.dataset.p === 'b' ? 'b' : 'a', L = LG(ex, pe).filter(x => x.d !== b.dataset.d); if (pe === 'b') ex.log2 = L; else ex.log = L; delete drafts[ex.id + (pe === 'b' ? 'b' : '')]; upsertSession(day, b.dataset.d, pe); }
  else if (act === 'save') {
    const pe = b.dataset.p === 'b' ? 'b' : 'a', dr = drafts[ex.id + (pe === 'b' ? 'b' : '')];
    if (!dr || !logIt(ex, pe, dr, t)) return;
    MK(pe)[t] = 1; upsertSession(day, t, pe); if (+S.cfg.rest) rtStart(+S.cfg.rest);
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
  d[f] = ev.target.value; touched[k] = true;
  ev.target.closest('.pp').querySelector('[data-vol]').textContent = vol(d) + ' kg';
});

document.addEventListener('keydown', ev => {
  if (ev.key !== 'Enter') return;
  const id = ev.target.id;
  if (id === 'ndn') document.querySelector('[data-act="mkday"]').click();
  if (id === 'nn' || id === 'nt') document.querySelector('[data-act="addex"]').click();
});

let view = 'treino', cm = new Date(), sel = todayStr(), openP = null, photos = [];
cm.setDate(1);
function did(d, t) { return !d.check && d.ex.some(e => e.log.some(x => x.d === t) || (e.log2 || []).some(x => x.d === t)); }

function applyCfg() {
  const c = S.cfg, r = document.documentElement;
  const n = parseInt(c.acc.slice(1), 16), L = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  r.style.setProperty('--acc', c.acc);
  r.style.setProperty('--acc-ink', L > 0.6 ? '#0B1511' : '#FFFFFF');
  r.style.setProperty('--soft', 'color-mix(in srgb, ' + c.acc + ' 16%, var(--surface))');
  if (c.mode === 'auto') r.removeAttribute('data-theme'); else r.setAttribute('data-theme', c.mode);
  r.dataset.font = c.font; r.dataset.lay = 'cards'; r.dataset.den = 'cozy';
  document.getElementById('appn').textContent = c.name || 'AppGym';
  document.title = c.name || 'AppGym';
  document.getElementById('foot').textContent = sbOn() ? 'Sincronizado com a nuvem pelo código do casal. As fotos ficam só neste aparelho.' : 'Os registros ficam salvos neste navegador. Para usar em dois aparelhos, ative a sincronização em Estilo.';
}

function renderBar() {
  document.getElementById('bar').innerHTML = [['treino', '🏋️', 'Treino'], ['hist', '📖', 'Histórico'], ['cal', '📅', 'Calendário'], ['fotos', '📷', 'Fotos'], ['estilo', '🎨', 'Estilo']]
    .map(([v, i, l]) => `<button class="${view === v ? 'on' : ''}" data-act="nav" data-v="${v}"><span>${i}</span>${l}</button>`).join('');
}

function viewCal() {
  const y = cm.getFullYear(), m = cm.getMonth(), first = new Date(y, m, 1).getDay(), n = new Date(y, m + 1, 0).getDate();
  const p = y + '-' + String(m + 1).padStart(2, '0') + '-', t = todayStr();
  let cells = '<i></i>'.repeat(first);
  for (let d = 1; d <= n; d++) {
    const k = p + String(d).padStart(2, '0');
    cells += `<button class="cd ${MK(who)[k] ? 'on' : ''} ${Object.values(others).some(o => (o.marks || {})[k]) ? 'pm' : ''} ${k === t ? 'td' : ''} ${k === sel ? 'sl' : ''}" data-act="seld" data-d="${k}" aria-label="Dia ${d}">${d}</button>`;
  }
  const mc = Object.keys(MK(who)).filter(k => k.startsWith(p)).length, tot = Object.keys(MK(who)).length;
  const li = S.days.filter(d => !d.check).flatMap(d => d.ex.flatMap(e => LG(e, who).filter(x => x.d === sel).map(x => `<li><span>${esc(e.name)}</span><span>${fmt(x.kg)} kg · ${x.s}×${x.r}</span></li>`))).join('');
  const lo = Object.keys(others).flatMap(u => S.days.filter(d => !d.check).flatMap(d => d.ex.flatMap(e => ((others[u].logs || {})[e.id] || []).filter(x => x.d === sel).map(x => `<li><span>${esc(names[u] || 'Parceiro(a)')} · ${esc(e.name)}</span><span>${fmt(x.kg)} kg · ${x.s}×${x.r}</span></li>`)))).join('');
  return `<div class="dayhead"><h2>Calendário</h2></div>${whoSeg()}${goalHtml()}
  <p class="dv">${mc} treino${mc === 1 ? '' : 's'} neste mês · ${tot} no total${Object.keys(others).length ? ' · ponto dourado: o outro treinou' : ''}</p>
  <div class="cal"><div class="cn"><button class="lnk" data-act="prevm" aria-label="Mês anterior">‹</button><b>${cm.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</b><button class="lnk" data-act="nextm" aria-label="Próximo mês">›</button></div>
  <div class="cg">${'DSTQQSS'.split('').map(c => `<span>${c}</span>`).join('')}${cells}</div></div>
  <div class="sel"><b>${fd(sel)}</b><button class="save" data-act="mark">${MK(who)[sel] ? 'Desmarcar presença' : 'Marcar presença'}</button></div>
  <ul class="ll">${(li + lo) || '<li><span>Nenhum exercício registrado neste dia.</span></li>'}</ul>`;
}

const urls = {};
const url = p => p.url || urls[p.id] || (urls[p.id] = URL.createObjectURL(p.blob));
const idb = () => new Promise((res, rej) => { const r = indexedDB.open('appgym', 1); r.onupgradeneeded = () => r.result.createObjectStore('p', { keyPath: 'id' }); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
const tx = async (mode, fn) => { const db = await idb(); return new Promise((res, rej) => { const t = db.transaction('p', mode); const out = fn(t.objectStore('p')); t.oncomplete = () => res(out && out.result); t.onerror = () => rej(t.error); }); };
async function loadPhotos() { try { const r = ((await tx('readonly', s => s.getAll())) || []).sort((a, b) => b.at - a.at); if (!DB) photos = r; } catch (e) { if (!DB) photos = null; } }
async function deletePhoto(id) { const p = photos && photos.find(x => x.id === id); try { if (p && p.shared) { await DB.doc('photos/' + id).delete(); if (ASSETS) await ASSETS.delete(id); } else await tx('readwrite', s => s.delete(id)); } catch (e) {} await loadPhotos(); render(); }

function viewPhotos() {
  const head = `<div class="prof"><span class="rg big"><span class="in">${esc((S.cfg.name || 'AG').slice(0, 2))}</span></span><div class="stats"><div><b>${Object.keys(S.marks).length}</b>treinos</div><div><b>${photos ? photos.length : 0}</b>fotos</div></div></div><button class="save wide" data-act="addph">+ Adicionar fotos</button>`;
  if (!photos) return head + '<p class="empty">Fotos indisponíveis neste navegador.</p>';
  if (!photos.length) return head + '<p class="empty">Nenhuma foto ainda. Adicione as fotos do treino de vocês.</p>';
  return head + `<div class="grid">${photos.map(p => `<button data-act="openp" data-id="${p.id}" aria-label="Abrir foto"><img src="${url(p)}" alt="${esc(p.cap || 'Foto do treino')}"></button>`).join('')}</div>`;
}

function renderOv() {
  const o = document.getElementById('ov'), p = openP && photos && photos.find(x => x.id === openP);
  if (!p) { o.innerHTML = ''; return; }
  const c = conf === 'p' + p.id;
  o.innerHTML = `<div class="vw"><div class="vt"><button class="lnk" data-act="closep">Fechar</button><span>${fd(p.d)}</span><button class="lnk ${c ? 'sure' : ''}" data-act="delp">${c ? 'Confirmar exclusão' : 'Excluir'}</button></div><img src="${url(p)}" alt=""><input id="cap" placeholder="Escreva uma legenda" maxlength="120" value="${esc(p.cap || '')}"></div>`;
}

const seg = (k, o) => `<div class="sg">${o.map(([v, l]) => `<button class="${S.cfg[k] === v ? 'on' : ''}" data-act="cfg" data-k="${k}" data-v="${v}">${l}</button>`).join('')}</div>`;
function viewStyle() {
  const c = S.cfg;
  return `<div class="dayhead"><h2>Estilo</h2></div><p class="dv">Deixe o app com a cara de vocês.</p>
  <div class="set"><label>Nome do app<input id="cname" value="${esc(c.name)}" maxlength="20"></label>
  <div class="row"><span>Cor de destaque</span><div class="sw">${['#0B7A5F', '#2F5BEA', '#D6336C', '#E8590C', '#7048E8', '#C92A2A'].map(x => `<button class="${c.acc.toLowerCase() === x.toLowerCase() ? 'on' : ''}" data-act="acc" data-c="${x}" aria-label="Cor ${x}" data-bg="${x}"></button>`).join('')}<input type="color" id="ccol" value="${c.acc}" aria-label="Cor personalizada"></div></div>
  <div class="row"><span>Tema</span>${seg('mode', [['auto', 'Automático'], ['light', 'Claro'], ['dark', 'Escuro']])}</div>
  <div class="row"><span>Fonte</span>${seg('font', [['cond', 'Condensada'], ['mod', 'Moderna'], ['serif', 'Clássica']])}</div>
  <div class="row"><label style="flex:1">Nome da pessoa 1<input id="cn1" value="${esc(c.n1)}" maxlength="14"></label><label style="flex:1">Nome da pessoa 2<input id="cn2" value="${esc(c.n2)}" maxlength="14"></label></div>
  <div class="row"><span>Descanso automático</span>${seg('rest', [['0', 'Off'], ['60', '60s'], ['90', '90s'], ['120', '120s']])}</div>
  <div class="row"><span>Meta semanal</span>${seg('goal', [['3', '3×'], ['4', '4×'], ['5', '5×'], ['6', '6×']])}</div>
  <div class="row"><label style="flex:1">Código(sincronização)<input id="ccode" value="${esc(c.code || '')}" placeholder="ex.: pedro-brenda-k39x2m" autocapitalize="off" autocomplete="off"></label></div>
  <p class="dv">${cloudMsg()}</p>
  <div class="row"><button class="save" data-act="sync">Sincronizar agora</button><button class="save" data-act="export">Exportar backup</button><button class="save" data-act="import">Importar backup</button></div>
  <p class="dv">${dataMsg}</p>
  <button class="lnk" data-act="reset">Restaurar padrão</button></div>`;
}

document.addEventListener('input', ev => {
  const i = ev.target.id;
  if (i === 'cname') { S.cfg.name = ev.target.value; applyCfg(); persist(); }
  if (i === 'ccol') { S.cfg.acc = ev.target.value; applyCfg(); persist(); }
  if (i === 'cn1') { S.cfg.n1 = ev.target.value; persist(); }
  if (i === 'cn2') { S.cfg.n2 = ev.target.value; persist(); }
});

document.addEventListener('change', async ev => {
  const i = ev.target.id;
  if (i === 'ccode') { S.cfg.code = ev.target.value.trim(); saveLocal(); SB.status = ''; syncNow(); softRender(); }
  if (i === 'bkp') {
    const f = ev.target.files[0]; ev.target.value = ''; if (!f) return;
    try { const d = JSON.parse(await f.text()); if (!Array.isArray(d.days)) throw 0; applyMerged(mergeState(snap(), d)); persist(); dataMsg = 'Backup importado e combinado com os dados atuais.'; } catch (e) { dataMsg = 'Arquivo inválido.'; }
    render();
  }
  if (i === 'cap') { const p = photos && photos.find(x => x.id === openP); if (p) { p.cap = ev.target.value; try { if (p.shared) await DB.doc('photos/' + p.id).update({ cap: p.cap }); else await tx('readwrite', s => s.put(p)); } catch (e) {} } }
  if (i === 'file') {
    const fs = [...ev.target.files]; ev.target.value = '';
    for (const f of fs) {
      try {
        const bm = await createImageBitmap(f), k = Math.min(1, 1280 / Math.max(bm.width, bm.height)), c = document.createElement('canvas');
        c.width = Math.round(bm.width * k); c.height = Math.round(bm.height * k);
        c.getContext('2d').drawImage(bm, 0, 0, c.width, c.height);
        const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.82));
        if (DB && ASSETS) { const r = await ASSETS.upload(blob); await DB.doc('photos/' + r.id).set({ url: r.url, d: todayStr(), at: Date.now(), cap: '', u: ME }); }
        else if (!DB) await tx('readwrite', s => s.put({ id: uid(), blob, d: todayStr(), at: Date.now(), cap: '' }));
      } catch (e) {}
    }
    await loadPhotos(); render();
  }
});

let justSaved = '', notice = '', who = 'a', copied = '', dataMsg = '';
const touched = {};
function upsertSession(day, t, p) {
  p = p || 'a';
  const id = t + '|' + day.id;
  const items = day.ex.map(e => { const x = LG(e, p).find(y => y.d === t); return x ? { n: e.name, kg: x.kg, s: x.s, r: x.r } : null; }).filter(Boolean);
  let a = SS(p).filter(x => x.id !== id);
  if (items.length) a.push({ id, d: t, day: day.name, items, ts: Date.now() }); else if (SS(p).some(x => x.id === id)) S.tomb['s' + p + id] = Date.now();
  a.sort((x, y) => x.d < y.d ? -1 : 1); a = a.slice(-100);
  if (p === 'b') S.sessions2 = a; else S.sessions = a;
}
function viewHist() {
  const all = SS(who), ss = all.slice().reverse();
  const head = `<div class="dayhead"><h2>Histórico</h2></div>${whoSeg()}<p class="dv">${ss.length} treino${ss.length === 1 ? '' : 's'} salvo${ss.length === 1 ? '' : 's'}</p>`;
  if (!ss.length) return head + '<p class="empty">Nada salvo ainda. Faça um treino e toque em “Salvar treino”.</p>';
  return head + ss.map(x => {
    const vol = x.items.reduce((a, i) => a + i.kg * i.s * i.r, 0);
    const prev = all.filter(y => y.day === x.day && y.d < x.d).pop();
    const pv = prev ? prev.items.reduce((a, i) => a + i.kg * i.s * i.r, 0) : 0;
    const dl = prev && pv > 0 ? ` · <span class="dl">${vol >= pv ? '+' : '−'}${fmt(Math.abs(vol - pv))} kg vs. anterior</span>` : '';
    const dt = new Date(x.d + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
    const c = conf === 's' + x.id;
    return `<article class="ss"><div class="sh"><b>${esc(x.day)}</b><span>${x.id === justSaved ? 'Salvo agora' : fd(x.d)}</span></div>
      <p class="meta">${dt} · ${fmt(vol)} kg de volume${dl}</p>
      <ul class="ll">${x.items.map(i => `<li><span>${esc(i.n)}</span><span>${fmt(i.kg)} kg · ${i.s}×${i.r}</span></li>`).join('')}</ul>
      <div class="acts2"><button class="lnk" data-act="copy" data-sid="${x.id}">${copied === x.id ? 'Copiado!' : 'Copiar resumo'}</button><a class="lnk" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(sumText(x))}">WhatsApp</a><button class="lnk ${c ? 'sure' : ''}" data-act="dels" data-sid="${x.id}">${c ? 'Confirmar exclusão' : 'Excluir do histórico'}</button></div></article>`;
  }).join('');
}
let DB = null, ASSETS = null, others = {}, names = {}, pend = false;
function softRender() {
  const a = document.activeElement;
  if (a && a.tagName === 'INPUT' && a.closest('#main, #ov')) pend = true; else render();
}
document.addEventListener('focusout', () => { if (pend) { pend = false; setTimeout(render, 700); } });

/* ---------- mesclagem (sincronização e backup) ---------- */
const tsOf = x => (x && x.ts) || 0;
function mergeLogs(a, b) {
  const m = {};
  (a || []).concat(b || []).forEach(x => { if (!m[x.d] || tsOf(x) > tsOf(m[x.d])) m[x.d] = x; });
  return Object.values(m).sort((p, q) => p.d < q.d ? -1 : 1);
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
      return Object.assign({}, e, { log: mergeLogs(e.log, o && o.log), log2: mergeLogs(e.log2, o && o.log2), on: ((o && o.on) || '') > (e.on || '') ? o.on : (e.on || '') });
    }) }));
  });
  return { days, marks: Object.assign({}, R.marks || {}, L.marks || {}), marks2: Object.assign({}, R.marks2 || {}, L.marks2 || {}),
    sessions: mergeSess(L.sessions, R.sessions, tomb, 'sa'), sessions2: mergeSess(L.sessions2, R.sessions2, tomb, 'sb'), tomb };
}
const snap = () => ({ days: S.days, marks: S.marks, marks2: S.marks2 || {}, sessions: S.sessions || [], sessions2: S.sessions2 || [], tomb: S.tomb || {} });
function applyMerged(m) { S.days = m.days; S.marks = m.marks; S.marks2 = m.marks2; S.sessions = m.sessions; S.sessions2 = m.sessions2; S.tomb = m.tomb; }
const stable = o => JSON.stringify(o, (k, v) => (v && typeof v === 'object' && !Array.isArray(v)) ? Object.keys(v).sort().reduce((a, x) => { a[x] = v[x]; return a; }, {}) : v);

/* ---------- nuvem (Supabase) ---------- */
const CFG = window.APPGYM_CONFIG || {};
const SB = { busy: false, status: '', timer: null };
const sbOn = () => !!(CFG.supabaseUrl && CFG.supabaseKey && (S.cfg.code || '').length >= 8);
async function rpc(fn, body) {
  const r = await fetch(CFG.supabaseUrl.replace(/\/$/, '') + '/rest/v1/rpc/' + fn, { method: 'POST', headers: { apikey: CFG.supabaseKey, Authorization: 'Bearer ' + CFG.supabaseKey, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  const t = await r.text(); return t ? JSON.parse(t) : null;
}
function schedSync() { if (!sbOn()) return; clearTimeout(SB.timer); SB.timer = setTimeout(syncNow, 1500); }
async function syncNow() {
  if (!sbOn() || SB.busy) return;
  SB.busy = true;
  try {
    const remote = (await rpc('get_casal', { p_code: S.cfg.code })) || {};
    const m = mergeState(snap(), remote);
    applyMerged(m); saveLocal();
    if (stable(m) !== stable(remote)) await rpc('save_casal', { p_code: S.cfg.code, p_data: m });
    SB.status = 'Sincronizado às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch (e) { SB.status = 'Não consegui falar com a nuvem (' + e.message + ').'; }
  SB.busy = false; softRender();
}
function cloudMsg() {
  if (!(CFG.supabaseUrl && CFG.supabaseKey)) return 'Sincronização desligada: preencha o config.js com os dados do Supabase. As fotos nunca sincronizam.';
  if ((S.cfg.code || '').length < 8) return 'Digite o mesmo código (mínimo 8 caracteres) nos dois aparelhos.';
  return SB.status || 'Aguardando a primeira sincronização...';
}

/* ---------- backup, resumo, sugestão, meta ---------- */
function exportData() {
  const d = Object.assign({ v: 1, at: new Date().toISOString() }, snap());
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(d)], { type: 'application/json' }));
  a.download = 'appgym-backup-' + todayStr() + '.json'; a.click();
  dataMsg = 'Backup baixado. As fotos não entram no arquivo.';
}
function sumText(x) {
  const v = x.items.reduce((a, i) => a + i.kg * i.s * i.r, 0);
  return '🏋️ ' + x.day + ' · ' + fd(x.d) + ' (' + N(who) + ')\n' + x.items.map(i => '• ' + i.n + ': ' + fmt(i.kg) + ' kg ' + i.s + '×' + i.r).join('\n') + '\nVolume: ' + fmt(v) + ' kg';
}
function copySess(sid) {
  const x = SS(who).find(y => y.id === sid); if (!x) return;
  const done = () => { copied = sid; render(); setTimeout(() => { copied = ''; render(); }, 2000); };
  if (navigator.clipboard) navigator.clipboard.writeText(sumText(x)).then(done, () => {}); else done();
}
function sug(e, last) {
  if (!last || !(last.kg > 0) || /\bs\b|min/.test(e.t)) return '';
  const m = /(\d+)\s*[x×]\s*(\d+)(?:-(\d+))?/.exec(e.t); if (!m) return '';
  if (last.s >= +m[1] && last.r >= +(m[3] || m[2])) return ' · <span class="up">Sugestão: subir para ' + fmt(last.kg + (last.kg < 20 ? 1 : 2.5)) + ' kg</span>';
  return '';
}
function weekKey(d) { const x = new Date(d + 'T12:00:00'); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x.toLocaleDateString('sv'); }
function goalInfo(p) {
  const g = +S.cfg.goal || 4, cnt = {};
  Object.keys(MK(p)).forEach(k => { const w = weekKey(k); cnt[w] = (cnt[w] || 0) + 1; });
  const cur = weekKey(todayStr()); let streak = (cnt[cur] || 0) >= g ? 1 : 0;
  const w = new Date(cur + 'T12:00:00');
  for (let i = 0; i < 520; i++) { w.setDate(w.getDate() - 7); if ((cnt[w.toLocaleDateString('sv')] || 0) >= g) streak++; else break; }
  return { g, n: cnt[cur] || 0, streak };
}
function goalHtml() {
  const g = goalInfo(who), dots = Array.from({ length: g.g }, (_, i) => '<i class="' + (i < g.n ? 'f' : '') + '"></i>').join('');
  return '<p class="goal"><b>Meta da semana</b> ' + dots + ' ' + g.n + '/' + g.g + ' · 🔥 ' + g.streak + ' semana' + (g.streak === 1 ? '' : 's') + ' seguida' + (g.streak === 1 ? '' : 's') + '</p>';
}

/* ---------- cronômetro de descanso ---------- */
let rtEnd = 0, rtTimer = null;
function rtShow() { const el = document.getElementById('rt'); el.hidden = view !== 'treino' && !rtEnd; if (!rtEnd) rtDraw(); }
function rtDraw() {
  const el = document.getElementById('rt'), r = +S.cfg.rest || 90;
  el.innerHTML = rtEnd ? '<span>Descanso <b id="rtt"></b></span><button data-act="rtadd" data-v="15">+15s</button><button data-act="rtstop">Parar</button>' : '<button data-act="rtgo" data-v="' + r + '">⏱ Descanso ' + r + 's</button>';
  rtTick();
}
function rtTick() {
  if (!rtEnd) return;
  const left = Math.ceil((rtEnd - Date.now()) / 1000);
  if (left <= 0) { rtEnd = 0; clearInterval(rtTimer); beep(); rtShow(); return; }
  const t = document.getElementById('rtt'); if (t) t.textContent = String(Math.floor(left / 60)).padStart(2, '0') + ':' + String(left % 60).padStart(2, '0');
}
function rtStart(sec) { rtEnd = Date.now() + sec * 1000; clearInterval(rtTimer); rtTimer = setInterval(rtTick, 500); rtDraw(); }
function rtAct(a, v) { if (a === 'rtgo') rtStart(v); else if (a === 'rtadd') { rtEnd += v * 1000; rtTick(); } else { rtEnd = 0; clearInterval(rtTimer); rtShow(); } }
function beep() {
  try { const c = new (window.AudioContext || window.webkitAudioContext)(), o = c.createOscillator(); o.connect(c.destination); o.frequency.value = 880; o.start(); setTimeout(() => { o.stop(); c.close(); }, 400); } catch (e) {}
  try { if (navigator.vibrate) navigator.vibrate([200, 100, 200]); } catch (e) {}
}

function startup() {
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}
  try { if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) navigator.serviceWorker.register('sw.js'); } catch (e) {}
  syncNow();
  setInterval(() => { if (!document.hidden) syncNow(); }, 20000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) syncNow(); });
}

loadPhotos().then(() => { if (view === 'fotos') render(); });
document.addEventListener('mousedown', ev => { if (ev.target.closest('button, summary')) ev.preventDefault(); });
document.getElementById('tabs').addEventListener('wheel', ev => { const t = ev.currentTarget; if (Math.abs(ev.deltaY) > Math.abs(ev.deltaX)) { t.scrollLeft += ev.deltaY; ev.preventDefault(); } }, { passive: false });
render();
startup();
