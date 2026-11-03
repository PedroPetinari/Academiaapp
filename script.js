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
const DEF = { name: 'AppGym', acc: '#0B7A5F', mode: 'auto', font: 'cond', lay: 'cards', den: 'cozy', n1: 'Pedro', n2: 'Brenda', rest: '90', goal: '4', code: '', bgType: 'auto', bgVal: '' };
S.cfg = Object.assign({}, DEF, S.cfg || {});
if (!S.marks) { S.marks = {}; S.days.forEach(d => d.check || d.ex.forEach(e => e.log.forEach(x => { S.marks[x.d] = 1; }))); }
function backfill() {
  const m = {};
  S.days.forEach(d => { if (d.check) return; d.ex.forEach(e => e.log.forEach(x => { const k = x.d + '|' + d.id; (m[k] = m[k] || { id: k, d: x.d, day: d.name, items: [] }).items.push({ n: e.name, kg: x.kg, s: x.s, r: x.r, x: x.x || [] }); })); });
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
  const L = LG(e, p).filter(x => x.d !== t); const xs = (dr.x || []).map(o => ({ kg: num(o.kg) || 0, r: num(o.r) })).filter(o => o.r > 0); const en = { d: t, kg: isNaN(kg) ? 0 : kg, s, r, ts: Date.now() }; if (xs.length) en.x = xs; L.push(en); L.sort((a, c) => a.d < c.d ? -1 : 1);
  if (p === 'b') e.log2 = L; else e.log = L;
  return true;
}
function whoSeg() { return `<div class="sg who">${['a', 'b'].map(v => `<button class="${who === v ? 'on' : ''}" data-act="who" data-v="${v}">${esc(N(v))}</button>`).join('')}</div>`; }
const draft = (e, p) => {
  const k = e.id + (p === 'b' ? 'b' : '');
  if (!drafts[k]) { const l = LG(e, p).slice(-1)[0]; drafts[k] = l ? { kg: l.kg, s: l.s, r: l.r, x: (l.x || []).map(o => ({ kg: o.kg, r: o.r })) } : { kg: '', s: parseInt(e.t) || 3, r: firstRep(e.t), x: [] }; }
  return drafts[k];
};
const vol = d => fmt((num(d.kg) || 0) * (num(d.s) || 0) * (num(d.r) || 0) + (d.x || []).reduce((a, o) => a + (num(o.kg) || 0) * (num(o.r) || 0), 0));
const ev = x => x.kg * x.s * x.r + (x.x || []).reduce((a, o) => a + o.kg * o.r, 0);
const fxs = x => fmt(x.kg) + ' kg · ' + x.s + '×' + x.r + (x.x || []).map(o => ' + ' + fmt(o.kg) + '×' + o.r).join('');
const dayVol = (day, t, p) => day.ex.reduce((a, e) => a + LG(e, p || 'a').filter(x => x.d === t).reduce((b, x) => b + ev(x), 0), 0);

function editForm(e, chk) {
  const m = /^\s*(\d+)\s*[x×]\s*(.*)$/.exec(e.t || '');
  const s = chk ? '' : (m ? m[1] : ''), r = chk ? (e.t || '') : (m ? m[2] : (e.t || ''));
  return `<div class="ed"><label class="full1">Nome do exercício<input id="en" value="${esc(e.name)}" maxlength="60"></label>
    ${chk ? '' : `<label>Séries<input id="es" inputmode="numeric" value="${esc(s)}" maxlength="3"></label>`}
    <label class="${chk ? 'full1' : ''}">${chk ? 'Detalhe (tempo ou repetições)' : 'Repetições (ex.: 8-12)'}<input id="er" value="${esc(r)}" maxlength="24"></label>
    <div class="full1 btns"><button class="save" data-act="saveex">Salvar</button><button class="lnk" data-act="cancelex">Cancelar</button></div></div>`;
}
function row(e) {
  const t = todayStr(), ed = editEx === e.id;
  const tools = `<div class="acts2"><button class="lnk" data-act="editex">Editar</button><button class="lnk ${conf === e.id ? 'sure' : ''}" data-act="delex">${conf === e.id ? 'Confirmar remoção' : 'Remover'}</button></div>`;
  if (S.cur.check) {
    if (ed) return `<div class="ex" data-id="${e.id}">${editForm(e, true)}</div>`;
    return `<div class="ex" data-id="${e.id}"><div class="chk"><input type="checkbox" aria-label="${esc(e.name)}" data-act="chk" ${e.on === t ? 'checked' : ''}><span>${esc(e.name)}</span><span class="tg">${esc(e.t)}</span></div>${tools}</div>`;
  }
  const pp = p => {
    const L = LG(e, p), last = L[L.length - 1], pr = L.reduce((m, x) => Math.max(m, x.kg), 0);
    const dr = draft(e, p), has = L.some(x => x.d === t);
    const hist = L.slice(-6).reverse().map(x => `<li><span>${fd(x.d)} · ${fxs(x)} · ${fmt(ev(x))} kg de volume</span><button class="lnk" data-act="dellog" data-p="${p}" data-d="${x.d}" aria-label="Apagar registro">Apagar</button></li>`).join('');
    const xs = (dr.x || []).map((o, i) => `<div class="xs"><span>Série ${(+dr.s || 0) + i + 1}</span><label>Carga (kg)<input inputmode="decimal" data-f="xkg" data-i="${i}" data-p="${p}" value="${esc(o.kg)}"></label><label>Reps<input inputmode="numeric" data-f="xr" data-i="${i}" data-p="${p}" value="${esc(o.r)}"></label><button class="lnk" data-act="delset" data-p="${p}" data-i="${i}" aria-label="Remover série">✕</button></div>`).join('');
    return `<div class="pp"><div class="pn"><b>${esc(N(p))}</b><span>Volume <i data-vol>${vol(dr)} kg</i></span></div>
      <div class="ins">
        <label>Carga (kg)<input inputmode="decimal" data-f="kg" data-p="${p}" value="${esc(dr.kg)}"></label>
        <label>Séries<input inputmode="numeric" data-f="s" data-p="${p}" value="${esc(dr.s)}"></label>
        <label>Reps<input inputmode="numeric" data-f="r" data-p="${p}" value="${esc(dr.r)}"></label>
        <button class="save" data-act="save" data-p="${p}">${has ? 'Atualizar' : 'Salvar'}</button>
      </div>${xs}<button class="lnk addset" data-act="addset" data-p="${p}">+ série</button>
      <p class="meta">${last ? `Última: ${fxs(last)} · ${fd(last.d)}` : 'Sem registros ainda'}${pr ? ` · <span class="pr">Recorde: ${fmt(pr)} kg</span>` : ''}</p>${sugBox(e, p, L)}
      ${L.length ? `<details><summary>Histórico</summary><ul>${hist}</ul></details>` : ''}</div>`;
  };
  return `<article class="ex" data-id="${e.id}">
    ${ed ? editForm(e, false) : `<div class="top"><h3>${esc(e.name)}</h3><span class="tg">${esc(e.t)}</span></div>${pp('a')}${pp('b')}${tools}`}
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
  else if (act === 'theme') { S.cfg.bgType = 'theme'; S.cfg.bgVal = b.dataset.k; S.cfg.acc = THEMES[b.dataset.k].acc; }
  else if (act === 'bgsolid') { S.cfg.bgType = 'solid'; S.cfg.bgVal = b.dataset.c; }
  else if (act === 'bgoff') { S.cfg.bgType = 'auto'; S.cfg.bgVal = ''; }
  else if (act === 'bgphoto') { document.getElementById('bgfile').click(); return; }
  else if (act === 'savetheme') { const n = (document.getElementById('tname').value || '').trim() || ('Tema ' + ((S.cfg.saved || []).length + 1)); (S.cfg.saved = S.cfg.saved || []).push({ n, bgType: S.cfg.bgType, bgVal: S.cfg.bgVal, acc: S.cfg.acc }); }
  else if (act === 'applytheme') { const th = (S.cfg.saved || [])[+b.dataset.i]; if (th) { S.cfg.bgType = th.bgType; S.cfg.bgVal = th.bgVal; S.cfg.acc = th.acc; } }
  else if (act === 'deltheme') { (S.cfg.saved || []).splice(+b.dataset.i, 1); }
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
  else if (act === 'reset') { S.cfg = Object.assign({}, DEF, { code: S.cfg.code, saved: S.cfg.saved }); }
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
  if (f === 'xkg' || f === 'xr') { const o = (d.x || [])[+ev.target.dataset.i]; if (o) o[f === 'xkg' ? 'kg' : 'r'] = ev.target.value; } else d[f] = ev.target.value; touched[k] = true;
  ev.target.closest('.pp').querySelector('[data-vol]').textContent = vol(d) + ' kg';
});

document.addEventListener('keydown', ev => {
  if (ev.key !== 'Enter') return;
  const id = ev.target.id;
  if (id === 'ndn') document.querySelector('[data-act="mkday"]').click();
  if (id === 'ccode') { S.cfg.code = ev.target.value.trim(); saveLocal(); SB.status = 'Sincronizando...'; syncNow(); }
  if (id === 'en' || id === 'es' || id === 'er') document.querySelector('[data-act="saveex"]').click();
  if (id === 'nn' || id === 'nt') document.querySelector('[data-act="addex"]').click();
});

let view = 'treino', cm = new Date(), sel = todayStr(), openP = null, photos = [];
cm.setDate(1);
function did(d, t) { return !d.check && d.ex.some(e => e.log.some(x => x.d === t) || (e.log2 || []).some(x => x.d === t)); }

const THEMES = {
  crepusculo: { n: 'Crepúsculo', bg: '#0E1A1B', fx: 'linear-gradient(165deg,#0B1315 0%,#183235 52%,#5E7774 118%)', surface: '#16282B', ink: '#E8F0EE', mute: '#9DB2AE', line: '#2A4447', acc: '#D2545F' },
  belafera: { n: 'Bela e a Fera', bg: '#0C1130', fx: 'radial-gradient(120% 80% at 25% 0%,#34449C 0%,#161E58 48%,#090C24 100%)', surface: '#18205C', ink: '#FFF4D6', mute: '#B7BEE6', line: '#2C3984', acc: '#F2C14E' },
  palmeiras: { n: 'Palmeiras', bg: '#05301D', fx: 'linear-gradient(180deg,#0C6038 0%,#06321E 100%)', surface: '#0B4B2D', ink: '#FFFFFF', mute: '#B5D9C4', line: '#1B6B45', acc: '#FFFFFF' },
  morro: { n: 'Morro dos Ventos Uivantes', bg: '#1B1A22', fx: 'linear-gradient(170deg,#24232E 0%,#47475A 48%,#7B6D88 120%)', surface: '#262531', ink: '#ECE9F1', mute: '#A8A2B6', line: '#3C3B4B', acc: '#BC9FDB' },
  oceano: { n: 'Oceano', bg: '#0A2233', fx: 'linear-gradient(170deg,#0A2233 0%,#0F4C6B 60%,#2A9DB5 125%)', surface: '#0F3347', ink: '#E9F6FA', mute: '#9CC3D0', line: '#1D566F', acc: '#5ED0E6' },
  poente: { n: 'Pôr do sol', bg: '#2A1226', fx: 'linear-gradient(170deg,#2A1226 0%,#7A2E4D 50%,#F0884A 125%)', surface: '#3B1A35', ink: '#FFF1E6', mute: '#E0B9B5', line: '#5A2A4E', acc: '#FFB36B' },
  floresta: { n: 'Floresta', bg: '#0F2118', fx: 'linear-gradient(170deg,#0F2118 0%,#1E4A33 60%,#4B8B5E 125%)', surface: '#173626', ink: '#EAF4ED', mute: '#9DBBA8', line: '#27523A', acc: '#7BD39A' },
  noite: { n: 'Noite', bg: '#0B0D12', fx: 'linear-gradient(170deg,#0B0D12 0%,#151A26 100%)', surface: '#151A24', ink: '#EEF1F6', mute: '#9AA3B2', line: '#232B3A', acc: '#7AA2FF' }
};
/* ---------- ilustrações dos temas (arte original, sem logos nem personagens) ---------- */
const rnd = seed => { let a = seed; return () => (a = (a * 16807) % 2147483647) / 2147483647; };
const svgW = body => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 800" preserveAspectRatio="xMidYMax slice">' + body + '</svg>';
const lg = (id, stops) => '<linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1">' + stops.map(s => '<stop offset="' + s[0] + '" stop-color="' + s[1] + '"' + (s[2] !== undefined ? ' stop-opacity="' + s[2] + '"' : '') + '/>').join('') + '</linearGradient>';
const glow = (id, col, a) => '<radialGradient id="' + id + '"><stop offset="0" stop-color="' + col + '" stop-opacity="' + a + '"/><stop offset="1" stop-color="' + col + '" stop-opacity="0"/></radialGradient>';
const starsSvg = (n, seed, ymax, col) => { const r = rnd(seed); let o = ''; for (let i = 0; i < n; i++) o += '<circle cx="' + (r() * 400).toFixed(0) + '" cy="' + (r() * ymax).toFixed(0) + '" r="' + (0.4 + r() * 1.3).toFixed(1) + '" fill="' + col + '" opacity="' + (0.3 + r() * 0.7).toFixed(2) + '"/>'; return o; };
const pinesSvg = (y, h, step, seed, col, op) => { const r = rnd(seed); let d = 'M-20 800V' + y; for (let x = -20; x < 430; x += step) d += 'L' + x + ' ' + y + 'L' + (x + step / 2) + ' ' + (y - h * (0.6 + r() * 0.7)).toFixed(0) + ' '; return '<path d="' + d + 'L430 ' + y + 'V800Z" fill="' + col + '" opacity="' + (op || 1) + '"/>'; };
const waveSvg = (y, amp, len, ph, col, op) => { let d = 'M0 800V' + y; for (let x = 0; x <= 400; x += 10) d += 'L' + x + ' ' + (y + amp * Math.sin((x / len) * 6.283 + ph)).toFixed(1); return '<path d="' + d + 'V800Z" fill="' + col + '" opacity="' + (op || 1) + '"/>'; };
const mistSvg = y => '<rect y="' + y + '" width="400" height="90" fill="url(#mi)"/>';
const dotsSvg = (n, seed, y0, y1, col, rmax, op) => { const r = rnd(seed); let o = ''; for (let i = 0; i < n; i++) o += '<circle cx="' + (r() * 400).toFixed(0) + '" cy="' + (y0 + r() * (y1 - y0)).toFixed(0) + '" r="' + (0.6 + r() * rmax).toFixed(1) + '" fill="' + col + '" opacity="' + (op * (0.4 + r() * 0.6)).toFixed(2) + '"/>'; return o; };
const ART = {
  crepusculo: () => svgW('<defs>' + lg('s', [[0, '#0A1215'], [0.55, '#1B3436'], [1, '#6F8985']]) + lg('mi', [[0, '#cfe3df', 0], [0.5, '#cfe3df', 0.2], [1, '#cfe3df', 0]]) + glow('g', '#e9f3ee', 0.8) + '</defs><rect width="400" height="800" fill="url(#s)"/>' + starsSvg(40, 7, 300, '#dfeee9') + '<circle cx="290" cy="150" r="80" fill="url(#g)"/><circle cx="290" cy="150" r="26" fill="#eef6f2"/><ellipse cx="200" cy="560" rx="280" ry="40" fill="#a3303d" opacity=".14"/>' + pinesSvg(520, 150, 26, 3, '#17302F', 0.9) + mistSvg(500) + pinesSvg(610, 190, 34, 5, '#0F2222') + mistSvg(585) + pinesSvg(710, 230, 44, 9, '#081414')),
  belafera: () => svgW('<defs>' + lg('s', [[0, '#080B24'], [0.6, '#1B2670'], [1, '#3B4BB0']]) + glow('g', '#ffd98a', 0.5) + '</defs><rect width="400" height="800" fill="url(#s)"/>' + starsSvg(80, 11, 430, '#fff3cf')
    + '<path d="M-20 800V650Q100 570 200 610T420 600V800Z" fill="#0A0E33"/><g fill="#0B1040"><rect x="170" y="500" width="22" height="120"/><path d="M165 500L181 455L197 500Z"/><rect x="205" y="470" width="28" height="150"/><path d="M200 470L219 412L238 470Z"/><rect x="245" y="515" width="20" height="105"/><path d="M241 515L255 475L269 515Z"/><rect x="190" y="550" width="60" height="70"/></g><g fill="#ffd27a"><rect x="177" y="525" width="4" height="8"/><rect x="215" y="500" width="5" height="9"/><rect x="215" y="540" width="5" height="9"/><rect x="252" y="540" width="4" height="8"/><rect x="215" y="575" width="6" height="10"/></g>'
    + '<g transform="translate(200 705)"><circle cy="-40" r="130" fill="url(#g)"/><path d="M-70 60V-20Q-70 -112 0 -112Q70 -112 70 -20V60Z" fill="#9db8ff" fill-opacity=".12" stroke="#d6e4ff" stroke-opacity=".5" stroke-width="2"/><rect x="-84" y="60" width="168" height="14" rx="5" fill="#c9a24b"/><path d="M-3 55Q-6 10 0 -28" stroke="#2f7a42" stroke-width="3" fill="none"/><circle cy="-38" r="17" fill="#b3122f"/><path d="M-12 -40Q0 -64 12 -40Q0 -27 -12 -40Z" fill="#dc3552"/><circle cy="-38" r="7" fill="#8e0c24"/><ellipse cx="28" cy="32" rx="6" ry="3.5" fill="#b3122f" transform="rotate(25 28 32)"/><ellipse cx="-34" cy="46" rx="5" ry="3" fill="#b3122f" transform="rotate(-20 -34 46)"/><path d="M-52 -60Q-40 -96 -6 -104" stroke="#fff" stroke-opacity=".35" stroke-width="3" fill="none" stroke-linecap="round"/></g>'),
  palmeiras: () => { let st = ''; for (let i = 0; i < 12; i++) st += '<rect x="30" y="' + (140 + i * 46.7).toFixed(1) + '" width="340" height="46.7" fill="#fff" opacity="' + (i % 2 ? 0.05 : 0) + '"/>'; return svgW('<defs>' + lg('s', [[0, '#04281A'], [1, '#0F7A47']]) + '<radialGradient id="l" cx=".5" cy="0" r=".9"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs><rect width="400" height="800" fill="url(#s)"/>' + st + '<g fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="3"><rect x="30" y="140" width="340" height="560" rx="4"/><path d="M30 420H370"/><circle cx="200" cy="420" r="62"/><rect x="110" y="140" width="180" height="84"/><rect x="110" y="616" width="180" height="84"/><path d="M150 224Q200 268 250 224"/><path d="M150 616Q200 572 250 616"/></g><circle cx="200" cy="420" r="5" fill="#fff" fill-opacity=".4"/><rect width="400" height="320" fill="url(#l)"/><g fill="#fff" fill-opacity=".5"><circle cx="40" cy="40" r="5"/><circle cx="360" cy="40" r="5"/><circle cx="110" cy="22" r="3"/><circle cx="290" cy="22" r="3"/></g>'); },
  morro: () => svgW('<defs>' + lg('s', [[0, '#1A1923'], [0.5, '#3B3A4D'], [1, '#8A7B96']]) + '</defs><rect width="400" height="800" fill="url(#s)"/><g fill="#13121a" opacity=".55"><ellipse cx="90" cy="120" rx="160" ry="36"/><ellipse cx="330" cy="200" rx="140" ry="30"/><ellipse cx="160" cy="300" rx="190" ry="26"/></g><g stroke="#fff" stroke-opacity=".09" stroke-width="2" fill="none"><path d="M0 430Q100 405 200 435T400 415"/><path d="M0 470Q110 450 210 478T400 458"/></g>'
    + '<path d="M-20 800V560Q80 480 180 540T420 520V800Z" fill="#2B2A38"/><g fill="#0F0E15"><rect x="290" y="505" width="70" height="38"/><path d="M285 505L325 477L365 505Z"/><rect x="300" y="486" width="10" height="22"/></g><g fill="#ffd27a"><rect x="312" y="520" width="6" height="8"/><rect x="334" y="520" width="6" height="8" opacity=".7"/></g><path d="M-20 800V650Q120 570 240 630T420 610V800Z" fill="#1B1A25"/>' + dotsSvg(140, 4, 600, 790, '#9C7BC4', 1.2, 0.6)
    + '<path d="M70 640Q62 575 82 530Q70 505 48 495M82 530Q100 512 118 516M76 560Q56 552 40 560" stroke="#0B0A10" stroke-width="5" fill="none" stroke-linecap="round"/><g stroke="#0c0b12" fill="none" stroke-width="2" stroke-linecap="round"><path d="M250 170q8-8 16 0q8-8 16 0"/><path d="M296 140q6-6 12 0q6-6 12 0"/><path d="M210 210q5-5 10 0q5-5 10 0"/></g>'),
  oceano: () => svgW('<defs>' + lg('s', [[0, '#071A2B'], [0.45, '#0E4A6B'], [1, '#2FA6BD']]) + '</defs><rect width="400" height="800" fill="url(#s)"/><circle cx="300" cy="230" r="70" fill="#bff2ff" opacity=".16"/><circle cx="300" cy="230" r="26" fill="#e8fbff" opacity=".85"/>' + starsSvg(30, 5, 180, '#e8fbff') + waveSvg(520, 10, 200, 0, '#0A5C7E', 0.75) + waveSvg(580, 12, 150, 1.5, '#08486A', 0.85) + waveSvg(650, 14, 120, 3, '#063553', 0.92) + waveSvg(730, 12, 90, 4.5, '#04243C')),
  poente: () => svgW('<defs>' + lg('s', [[0, '#1D0F2E'], [0.45, '#8A2F55'], [0.78, '#F07A4A'], [1, '#FFC26B']]) + glow('g', '#ffe3a0', 0.7) + '</defs><rect width="400" height="800" fill="url(#s)"/><circle cx="200" cy="520" r="170" fill="url(#g)"/><circle cx="200" cy="520" r="88" fill="#ffe3a0"/>' + starsSvg(25, 9, 220, '#ffe9d6')
    + '<path d="M-20 800V610L70 540L150 610L240 520L330 600L420 550V800Z" fill="#4A1B44" opacity=".85"/><path d="M-20 800V680L90 610L190 680L290 600L420 670V800Z" fill="#2A0F31"/><path d="M-20 800V740L120 690L260 745L420 700V800Z" fill="#14071C"/><g stroke="#0F0516" stroke-width="3" fill="none" stroke-linecap="round"><path d="M60 800Q70 700 92 620"/><path d="M92 620Q62 600 30 614M92 620Q122 598 150 618M92 620Q86 590 72 572M92 620Q112 592 128 578M92 620Q62 626 42 648"/></g>'),
  floresta: () => svgW('<defs>' + lg('s', [[0, '#0A1A12'], [0.6, '#1E4A33'], [1, '#6FAE82']]) + '<linearGradient id="ray" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs><rect width="400" height="800" fill="url(#s)"/><g fill="url(#ray)"><path d="M120 0L190 0L120 600L40 600Z"/><path d="M230 0L290 0L260 620L180 620Z"/><path d="M330 0L380 0L400 560L330 560Z"/></g>' + pinesSvg(560, 120, 22, 2, '#1D4A33', 0.9) + pinesSvg(650, 150, 30, 4, '#14372A') + pinesSvg(740, 190, 40, 6, '#0B2419') + dotsSvg(40, 8, 520, 760, '#f3e58a', 1.6, 0.9)),
  noite: () => { const r = rnd(21); let sk = ''; for (let x = 0; x < 400; x += 20) { const h = 60 + r() * 150; sk += '<rect x="' + x + '" y="' + (800 - h).toFixed(0) + '" width="19" height="' + h.toFixed(0) + '" fill="#080A12"/>'; for (let k = 0; k < 5; k++) if (r() > 0.55) sk += '<rect x="' + (x + 3 + (k % 2) * 8) + '" y="' + (800 - h + 10 + k * 20).toFixed(0) + '" width="4" height="5" fill="#ffd27a" opacity=".8"/>'; } return svgW('<defs>' + lg('s', [[0, '#080A12'], [1, '#18203A']]) + '</defs><rect width="400" height="800" fill="url(#s)"/>' + starsSvg(110, 13, 520, '#fff') + '<path d="M300 100a36 36 0 1 0 24 64a30 30 0 1 1 -24 -64z" fill="#f4f1de"/>' + sk); }
};
const artCache = {};
const artLayer = k => 'linear-gradient(180deg,rgba(0,0,0,.28),rgba(0,0,0,0) 35%,rgba(0,0,0,.32)),url("data:image/svg+xml,' + (artCache[k] = artCache[k] || encodeURIComponent(ART[k]())) + '") center bottom/cover no-repeat';
const rgba = (h, a) => { const n = parseInt(h.slice(1), 16); return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; };
const BGS = ['#F1F3EF', '#F4EDE1', '#F8E8EE', '#E6EEF7', '#EEE9F7', '#1C1F22', '#0F1A2E', '#0E2A1E'];
const bgUrls = {}, bgLoading = {};
const lum = h => { const n = parseInt(h.slice(1), 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; };
function paletteFor(h) {
  return lum(h) < 0.45
    ? { '--bg': h, '--surface': 'color-mix(in srgb, ' + h + ' 88%, #fff)', '--ink': '#EAF0EC', '--mute': '#9AA6A0', '--line': 'color-mix(in srgb, ' + h + ' 78%, #fff)' }
    : { '--bg': h, '--surface': '#FFFFFF', '--ink': '#17201C', '--mute': '#5E6B64', '--line': 'color-mix(in srgb, ' + h + ' 86%, #000)' };
}
async function loadBg(id) {
  if (!id || bgLoading[id]) return; bgLoading[id] = 1;
  try { const rec = await tx('readonly', s => s.get(id), 'bg'); if (rec && rec.blob) { bgUrls[id] = URL.createObjectURL(rec.blob); applyCfg(); } } catch (e) {}
}
function applyBg() {
  const c = S.cfg, r = document.documentElement, el = document.getElementById('bgfx');
  ['--bg', '--surface', '--ink', '--mute', '--line'].forEach(k => r.style.removeProperty(k));
  let vars = null, layer = '';
  if (c.bgType === 'solid' && /^#[0-9a-f]{6}$/i.test(c.bgVal || '')) vars = paletteFor(c.bgVal);
  else if (c.bgType === 'theme' && THEMES[c.bgVal]) { const t = THEMES[c.bgVal]; vars = { '--bg': t.bg, '--surface': rgba(t.surface, 0.86), '--ink': t.ink, '--mute': t.mute, '--line': t.line }; layer = artLayer(c.bgVal) + ',' + t.fx; }
  else if (c.bgType === 'photo') {
    vars = { '--bg': '#101412', '--surface': 'rgba(24,30,27,.92)', '--ink': '#EEF3F0', '--mute': '#A9B6AF', '--line': 'rgba(255,255,255,.14)' };
    if (bgUrls[c.bgVal]) layer = 'linear-gradient(rgba(8,12,10,.5),rgba(8,12,10,.5)),url(' + bgUrls[c.bgVal] + ') center/cover no-repeat'; else loadBg(c.bgVal);
  }
  if (vars) Object.keys(vars).forEach(k => r.style.setProperty(k, vars[k]));
  el.style.background = layer;
  return vars;
}
async function shrink(f, max, q) {
  const bm = await createImageBitmap(f), k = Math.min(1, max / Math.max(bm.width, bm.height)), c = document.createElement('canvas');
  c.width = Math.round(bm.width * k); c.height = Math.round(bm.height * k);
  c.getContext('2d').drawImage(bm, 0, 0, c.width, c.height);
  return new Promise(r => c.toBlob(r, 'image/jpeg', q || 0.8));
}
function applyCfg() {
  const c = S.cfg, r = document.documentElement;
  const n = parseInt(c.acc.slice(1), 16), L = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  r.style.setProperty('--acc', c.acc);
  r.style.setProperty('--acc-ink', L > 0.6 ? '#0B1511' : '#FFFFFF');
  r.style.setProperty('--soft', 'color-mix(in srgb, ' + c.acc + ' 16%, var(--surface))');
  const bv = applyBg();
  if (bv) r.setAttribute('data-theme', lum(bv['--bg']) < 0.45 ? 'dark' : 'light'); else if (c.mode === 'auto') r.removeAttribute('data-theme'); else r.setAttribute('data-theme', c.mode);
  r.dataset.font = c.font; r.dataset.lay = 'cards'; r.dataset.den = 'cozy';
  document.getElementById('appn').textContent = c.name || 'AppGym';
  document.title = c.name || 'AppGym';
  document.getElementById('foot').textContent = sbOn() ? 'Sincronizado com a nuvem pelo código. Treinos e fotos são compartilhados.' : 'Os registros ficam salvos neste navegador. Para usar em dois aparelhos, ative a sincronização em Estilo.';
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
  const li = S.days.filter(d => !d.check).flatMap(d => d.ex.flatMap(e => LG(e, who).filter(x => x.d === sel).map(x => `<li><span>${esc(e.name)}</span><span>${fxs(x)}</span></li>`))).join('');
  const lo = Object.keys(others).flatMap(u => S.days.filter(d => !d.check).flatMap(d => d.ex.flatMap(e => ((others[u].logs || {})[e.id] || []).filter(x => x.d === sel).map(x => `<li><span>${esc(names[u] || 'Parceiro(a)')} · ${esc(e.name)}</span><span>${fxs(x)}</span></li>`)))).join('');
  return `<div class="dayhead"><h2>Calendário</h2></div>${whoSeg()}${goalHtml()}
  <p class="dv">${mc} treino${mc === 1 ? '' : 's'} neste mês · ${tot} no total${Object.keys(others).length ? ' · ponto dourado: o outro treinou' : ''}</p>
  <div class="cal"><div class="cn"><button class="lnk" data-act="prevm" aria-label="Mês anterior">‹</button><b>${cm.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</b><button class="lnk" data-act="nextm" aria-label="Próximo mês">›</button></div>
  <div class="cg">${'DSTQQSS'.split('').map(c => `<span>${c}</span>`).join('')}${cells}</div></div>
  <div class="sel"><b>${fd(sel)}</b><button class="save" data-act="mark">${MK(who)[sel] ? 'Desmarcar presença' : 'Marcar presença'}</button></div>
  <ul class="ll">${(li + lo) || '<li><span>Nenhum exercício registrado neste dia.</span></li>'}</ul>`;
}

const urls = {};
const url = p => p.url || urls[p.id] || (urls[p.id] = URL.createObjectURL(p.blob));
const idb = () => new Promise((res, rej) => { const r = indexedDB.open('appgym', 2); r.onupgradeneeded = () => { const db = r.result; if (!db.objectStoreNames.contains('p')) db.createObjectStore('p', { keyPath: 'id' }); if (!db.objectStoreNames.contains('bg')) db.createObjectStore('bg', { keyPath: 'id' }); }; r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
const tx = async (mode, fn, st) => { const db = await idb(); return new Promise((res, rej) => { const t = db.transaction(st || 'p', mode); const out = fn(t.objectStore(st || 'p')); t.oncomplete = () => res(out && out.result); t.onerror = () => rej(t.error); }); };
async function loadPhotos() { try { photos = ((await tx('readonly', s => s.getAll())) || []).sort((a, b) => b.at - a.at); } catch (e) { photos = null; } }
async function deletePhoto(id) {
  try { await tx('readwrite', s => s.delete(id)); } catch (e) {}
  if (sbOn()) { (S.cfg.photoDel = S.cfg.photoDel || []).push(id); saveLocal(); }
  await loadPhotos(); render(); syncPhotos(true);
}

function viewPhotos() {
  const head = `<div class="prof"><span class="rg big"><span class="in">${esc((S.cfg.name || 'AG').slice(0, 2))}</span></span><div class="stats"><div><b>${Object.keys(S.marks).length}</b>treinos</div><div><b>${photos ? photos.length : 0}</b>fotos</div></div></div><button class="save wide" data-act="addph">+ Adicionar fotos</button>`;
  if (!photos) return head + photoHint() + '<p class="empty">Fotos indisponíveis neste navegador.</p>';
  if (!photos.length) return head + photoHint() + '<p class="empty">Nenhuma foto ainda. Adicione as fotos do treino de vocês.</p>';
  return head + photoHint() + `<div class="grid">${photos.map(p => `<button data-act="openp" data-id="${p.id}" aria-label="Abrir foto"><img src="${url(p)}" alt="${esc(p.cap || 'Foto do treino')}"></button>`).join('')}</div>`;
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
  <div class="row col"><span>Cor de fundo</span><div class="sw">${BGS.map(x => `<button class="${c.bgType === 'solid' && (c.bgVal || '').toLowerCase() === x.toLowerCase() ? 'on' : ''}" data-act="bgsolid" data-c="${x}" aria-label="Fundo ${x}" style="background:${x}"></button>`).join('')}<input type="color" id="cbg" value="${/^#[0-9a-f]{6}$/i.test(c.bgVal || '') ? c.bgVal : '#F1F3EF'}" aria-label="Cor de fundo personalizada"></div></div>
  <div class="row col"><span>Temas de fundo</span><div class="tm">${Object.keys(THEMES).map(k => `<button class="th ${c.bgType === 'theme' && c.bgVal === k ? 'on' : ''}" data-act="theme" data-k="${k}" style="background:${THEMES[k].fx}">${esc(THEMES[k].n)}</button>`).join('')}</div></div>
  <div class="row col"><span>Foto de fundo (da sua galeria)</span><div class="btnrow"><button class="save" data-act="bgphoto">Escolher foto</button><button class="lnk" data-act="bgoff">Voltar ao fundo padrão</button></div></div>
  <div class="row col"><span>Meus temas salvos</span><div class="chips">${(c.saved || []).map((t, i) => `<span class="chip"><button data-act="applytheme" data-i="${i}">${esc(t.n)}</button><button data-act="deltheme" data-i="${i}" aria-label="Apagar tema">✕</button></span>`).join('') || '<span class="dv">Nenhum ainda.</span>'}</div><div class="btnrow"><input id="tname" placeholder="Nome do tema" maxlength="20"><button class="save" data-act="savetheme">Salvar tema atual</button></div></div>
  <div class="row"><span>Fonte</span>${seg('font', [['cond', 'Condensada'], ['mod', 'Moderna'], ['serif', 'Clássica']])}</div>
  <div class="row"><label style="flex:1">Nome da pessoa 1<input id="cn1" value="${esc(c.n1)}" maxlength="14"></label><label style="flex:1">Nome da pessoa 2<input id="cn2" value="${esc(c.n2)}" maxlength="14"></label></div>
  <div class="row"><span>Descanso automático</span>${seg('rest', [['0', 'Off'], ['60', '60s'], ['90', '90s'], ['120', '120s']])}</div>
  <div class="row"><span>Meta semanal</span>${seg('goal', [['3', '3×'], ['4', '4×'], ['5', '5×'], ['6', '6×']])}</div>
  <div class="row"><label style="flex:1">Código (sincronização)<span class="pw"><input id="ccode" type="password" value="${esc(c.code || '')}" placeholder="Digite o código" autocapitalize="off" autocomplete="new-password"><button class="eye" data-act="eye" aria-label="Mostrar ou ocultar o código">👁</button></span></label></div>
  <p class="dv" id="cmsg">${cloudMsg()}</p>
  <div class="row"><button class="save" data-act="sync">Sincronizar agora</button><button class="save" data-act="export">Exportar backup</button><button class="save" data-act="import">Importar backup</button></div>
  <p class="dv">${dataMsg}</p>
  <button class="lnk" data-act="reset">Restaurar padrão</button></div>`;
}

document.addEventListener('input', ev => {
  const i = ev.target.id;
  if (i === 'cname') { S.cfg.name = ev.target.value; applyCfg(); persist(); }
  if (i === 'ccol') { S.cfg.acc = ev.target.value; applyCfg(); persist(); }
  if (i === 'cbg') { S.cfg.bgType = 'solid'; S.cfg.bgVal = ev.target.value; applyCfg(); saveLocal(); }
  if (i === 'ccode') { S.cfg.code = ev.target.value.trim(); saveLocal(); const m = document.getElementById('cmsg'); if (m) m.textContent = cloudMsg(); }
  if (i === 'cn1') { S.cfg.n1 = ev.target.value; persist(); }
  if (i === 'cn2') { S.cfg.n2 = ev.target.value; persist(); }
});

document.addEventListener('change', async ev => {
  const i = ev.target.id;
  if (i === 'ccode') { S.cfg.code = ev.target.value.trim(); saveLocal(); SB.status = ''; syncNow(); softRender(); }
  if (i === 'bgfile') {
    const f = ev.target.files[0]; ev.target.value = ''; if (!f) return;
    try { const blob = await shrink(f, 1400), id = uid(); await tx('readwrite', s => s.put({ id, blob }), 'bg'); bgUrls[id] = URL.createObjectURL(blob); S.cfg.bgType = 'photo'; S.cfg.bgVal = id; saveLocal(); render(); } catch (e) {}
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

let justSaved = '', notice = '', who = 'a', copied = '', dataMsg = '', editEx = null;
const touched = {};
function upsertSession(day, t, p) {
  p = p || 'a';
  const id = t + '|' + day.id;
  const items = day.ex.map(e => { const x = LG(e, p).find(y => y.d === t); return x ? { n: e.name, kg: x.kg, s: x.s, r: x.r, x: x.x || [] } : null; }).filter(Boolean);
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
    const vol = x.items.reduce((a, i) => a + ev(i), 0);
    const prev = all.filter(y => y.day === x.day && y.d < x.d).pop();
    const pv = prev ? prev.items.reduce((a, i) => a + ev(i), 0) : 0;
    const dl = prev && pv > 0 ? ` · <span class="dl">${vol >= pv ? '+' : '−'}${fmt(Math.abs(vol - pv))} kg vs. anterior</span>` : '';
    const dt = new Date(x.d + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
    const c = conf === 's' + x.id;
    return `<article class="ss"><div class="sh"><b>${esc(x.day)}</b><span>${x.id === justSaved ? 'Salvo agora' : fd(x.d)}</span></div>
      <p class="meta">${dt} · ${fmt(vol)} kg de volume${dl}</p>
      <ul class="ll">${x.items.map(i => `<li><span>${esc(i.n)}</span><span>${fxs(i)}</span></li>`).join('')}</ul>
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
  const r = await fetch(CFG.supabaseUrl.replace(/\/$/, '') + '/rest/v1/rpc/' + fn, { method: 'POST', headers: Object.assign({ apikey: CFG.supabaseKey, 'Content-Type': 'application/json' }, CFG.supabaseKey.indexOf('eyJ') === 0 ? { Authorization: 'Bearer ' + CFG.supabaseKey } : {}), body: JSON.stringify(body) });
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
    await syncPhotos();
    SB.status = 'Sincronizado às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch (e) { SB.status = 'Não consegui falar com a nuvem (' + e.message + ').'; }
  SB.busy = false; const cmsg = document.getElementById('cmsg'); if (cmsg) cmsg.textContent = cloudMsg(); softRender();
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

/* ---------- backup, resumo, sugestão, meta ---------- */
function exportData() {
  const d = Object.assign({ v: 1, at: new Date().toISOString() }, snap());
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(d)], { type: 'application/json' }));
  a.download = 'appgym-backup-' + todayStr() + '.json'; a.click();
  dataMsg = 'Backup baixado. As fotos não entram no arquivo.';
}
function sumText(x) {
  const v = x.items.reduce((a, i) => a + ev(i), 0);
  return '🏋️ ' + x.day + ' · ' + fd(x.d) + ' (' + N(who) + ')\n' + x.items.map(i => '• ' + i.n + ': ' + fxs(i)).join('\n') + '\nVolume: ' + fmt(v) + ' kg';
}
function copySess(sid) {
  const x = SS(who).find(y => y.id === sid); if (!x) return;
  const done = () => { copied = sid; render(); setTimeout(() => { copied = ''; render(); }, 2000); };
  if (navigator.clipboard) navigator.clipboard.writeText(sumText(x)).then(done, () => {}); else done();
}
function parseT(t) {
  const m = /(\d+)\s*[x×]\s*(\d+)(?:\s*-\s*(\d+))?/.exec(t || '');
  if (!m || /\bs\b|min/.test(t)) return null;
  return { sets: +m[1], lo: +m[2], hi: +(m[3] || m[2]) };
}
function sugBox(e, p, L) {
  const T = parseT(e.t), last = L[L.length - 1];
  if (!T || !last || !(last.kg > 0)) return '';
  const inc = last.kg < 20 ? 1 : 2.5, prev = L[L.length - 2];
  const rows = [last.r].concat((last.x || []).map(o => o.r));
  let txt, kg = null;
  if (last.s >= T.sets && rows.every(r => r >= T.hi)) { kg = last.kg + inc; txt = 'Bateu o topo da faixa (' + T.hi + ' reps). Suba para <b>' + fmt(kg) + ' kg</b> e recomece perto de ' + T.lo + ' reps.'; }
  else if (last.r < T.lo && prev && prev.r < T.lo && prev.kg >= last.kg) { kg = Math.max(0, last.kg - inc); txt = 'Duas vezes abaixo de ' + T.lo + ' reps. Reduza para <b>' + fmt(kg) + ' kg</b> e reconstrua.'; }
  else if (last.r < T.lo) txt = 'Ficou abaixo de ' + T.lo + ' reps. Mantenha <b>' + fmt(last.kg) + ' kg</b> e busque chegar a ' + T.lo + '.';
  else txt = 'Mantenha <b>' + fmt(last.kg) + ' kg</b> e tente +1 rep por série (meta: ' + T.hi + ').';
  return '<div class="sugb"><span>📈 ' + txt + '</span>' + (kg !== null ? '<button class="lnk" data-act="usekg" data-p="' + p + '" data-kg="' + kg + '">Usar ' + fmt(kg) + ' kg</button>' : '') + '</div>';
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
let rtEnd = 0, rtTot = 0, rtTimer = null;
function rtShow() { const el = document.getElementById('rt'); el.hidden = view !== 'treino' && !rtEnd; if (!rtEnd) rtDraw(); }
function rtDraw() {
  const el = document.getElementById('rt'), r = +S.cfg.rest || 90;
  el.className = rtEnd ? 'rt run' : 'rt';
  el.innerHTML = rtEnd ? '<span>Descanso</span><b id="rtt"></b><button data-act="rtadd" data-v="15">+15s</button><button class="stop" data-act="rtstop">Parar</button>' : '<button data-act="rtgo" data-v="' + r + '" aria-label="Iniciar descanso">⏱ ' + r + 's</button>';
  rtTick();
}
function rtTick() {
  if (!rtEnd) return;
  const ms = rtEnd - Date.now(), left = Math.ceil(ms / 1000);
  if (left <= 0) { rtEnd = 0; clearInterval(rtTimer); beep(); rtShow(); return; }
  const t = document.getElementById('rtt'); if (t) t.textContent = String(Math.floor(left / 60)).padStart(2, '0') + ':' + String(left % 60).padStart(2, '0');
  document.getElementById('rt').style.setProperty('--p', Math.min(100, Math.max(0, (1 - ms / rtTot) * 100)) + '%');
}
function rtStart(sec) { rtTot = sec * 1000; rtEnd = Date.now() + rtTot; clearInterval(rtTimer); rtTimer = setInterval(rtTick, 250); rtDraw(); }
function rtAct(a, v) { if (a === 'rtgo') rtStart(v); else if (a === 'rtadd') { rtEnd += v * 1000; rtTot += v * 1000; rtTick(); } else { rtEnd = 0; clearInterval(rtTimer); rtShow(); } }
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