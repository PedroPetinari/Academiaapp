/* Agenda do calendário: anotações por dia e eventos (viagem, aniversário, consulta...). Sem emojis: cada tipo tem uma cor. */
const EVK = [['viagem', 'Viagem', '#4DA3FF'], ['aniv', 'Aniversário', '#FF8FB1'], ['consulta', 'Consulta', '#7BD39A'], ['especial', 'Data especial', '#F2C14E'], ['doente', 'Doente', '#FF6B6B'], ['descanso', 'Descanso', '#B08CFF'], ['outro', 'Outro', '#9AA6A0']];
const EVOFF = ['doente', 'descanso'];   /* dias de pausa: diminuem a meta da semana */
const evKind = k => EVK.find(x => x[0] === k) || EVK[EVK.length - 1];
let calTab = 'dia', noteM = '', noteD = '', ntBy = '', ntDraft = null, agMsg = '';
let evF = { d: '', e: '', t: '', k: 'viagem', w: 'ab' };
const NL = () => S.notes || (S.notes = []);
const EL = () => S.evs || (S.evs = []);
const p2 = n => String(n).padStart(2, '0');
const dayDiff = d => Math.round((new Date(d + 'T12:00:00') - new Date(todayStr() + 'T12:00:00')) / 864e5);
const evFor = p => EL().filter(x => x.w === 'ab' || x.w === p);
const evOn = (list, k) => list.filter(x => x.d <= k && k <= (x.e || x.d));

/* ---- anotações: uma por dia e por pessoa; texto vazio apaga ---- */
const noteOf = (d, by) => NL().find(x => x.id === d + '|' + by);
function noteSave(d, by, text) {
  const id = d + '|' + by, old = noteOf(d, by), t = (text || '').trim().slice(0, 2000), a = NL().filter(x => x.id !== id);
  if (t) a.push({ id, d, by, t, ts: Date.now() }); else if (old) S.tomb['n' + id] = Date.now();
  S.notes = a;
}

/* ---- eventos ---- */
function evAdd() {
  const f = evF; if (!f.d || !f.t.trim()) return 'Preencha a data e o título.';
  if (f.e && f.e < f.d) return 'A data final vem antes da inicial.';
  S.evs = EL().concat([{ id: uid(), d: f.d, e: f.e === f.d ? '' : f.e, t: f.t.trim().slice(0, 80), k: f.k, w: f.w, ts: Date.now() }]);
  evF.t = ''; evF.e = ''; return 'Evento adicionado.';
}
function evDel(id) { S.evs = EL().filter(x => x.id !== id); S.tomb['v' + id] = Date.now(); }
const evRange = x => fd(x.d) + (x.e ? ' a ' + fd(x.e) : '');
function evWhen(x) {
  const e = x.e || x.d;
  if (dayDiff(e) < 0) return 'já passou';
  if (dayDiff(x.d) <= 0) return x.e ? 'em andamento' : 'hoje';
  const n = dayDiff(x.d); return n === 1 ? 'amanhã' : 'em ' + n + ' dias';
}
const evWho = x => x.w === 'ab' ? 'os dois' : N(x.w);

/* dias de pausa (doente/descanso) por semana, para a meta */
function offDays(p) {
  const days = new Set();
  evFor(p).filter(x => EVOFF.includes(x.k)).forEach(x => { const d = new Date(x.d + 'T12:00:00'), end = x.e || x.d; for (let i = 0; i < 90; i++) { const k = d.toLocaleDateString('sv'); if (k > end) break; days.add(k); d.setDate(d.getDate() + 1); } });
  const w = {}; days.forEach(k => { const wk = weekKey(k); w[wk] = (w[wk] || 0) + 1; });
  return w;
}

/* ---- telas ---- */
function dayExtras() {
  const ev = evOn(evFor(who), sel).map(x => `<li><span><i class="kd" style="background:${evKind(x.k)[2]}"></i>${esc(evKind(x.k)[1])}: ${esc(x.t)}</span><span>${evRange(x)}</span></li>`).join('');
  const nt = NL().filter(x => x.d === sel).map(x => `<li class="nt"><span>Anotação · ${esc(N(x.by))}<br>${esc(x.t)}</span></li>`).join('');
  return ev + nt;
}

function notesHtml() {
  if (!noteD) noteD = sel;
  const m = noteM || noteD.slice(0, 7), y = +m.slice(0, 4), mo = +m.slice(5, 7), n = new Date(y, mo, 0).getDate(), by = ntBy || who, cur = noteOf(noteD, by);
  const WD = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
  const days = Array.from({ length: n }, (_, i) => { const k = m + '-' + p2(i + 1); return `<button class="${k === noteD ? 'on' : ''}" data-act="ntday" data-d="${k}"><small>${WD[new Date(y, mo - 1, i + 1).getDay()]}</small>${i + 1}${NL().some(x => x.d === k) ? '<u></u>' : ''}</button>`; }).join('');
  const lst = NL().filter(x => x.d.startsWith(m)).sort((a, b) => a.d === b.d ? (a.by < b.by ? -1 : 1) : (a.d < b.d ? 1 : -1))
    .map(x => `<div class="brow nt"><div><b>${fd(x.d)} · ${esc(N(x.by))}</b><span>${esc(x.t)}</span></div><div class="nacts"><button class="lnk" data-act="ntedit" data-d="${x.d}" data-by="${x.by}">Editar</button><button class="lnk ${conf === 'n' + x.id ? 'sure' : ''}" data-act="ntdel" data-d="${x.d}" data-by="${x.by}">${conf === 'n' + x.id ? 'Confirmar' : 'Apagar'}</button></div></div>`).join('');
  const title = new Date(y, mo - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }), long = new Date(noteD + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  return `<div class="mnav"><button class="lnk" data-act="ntm" data-s="-1" aria-label="Mês anterior">‹</button><b>${esc(title)}</b><button class="lnk" data-act="ntm" data-s="1" aria-label="Próximo mês">›</button></div>
  <div class="mdays">${days}</div>
  <label class="bl" style="margin-top:12px">Anotação de <b class="ink">${esc(long)}</b><textarea id="nt" class="mta" maxlength="2000" placeholder="Escreva aqui: como foi o treino, como você se sentiu, o que quer lembrar...">${esc(ntDraft !== null ? ntDraft : cur ? cur.t : '')}</textarea></label>
  <div class="rxbar"><span>Escrevendo como</span>${['a', 'b'].map(v => `<button class="${by === v ? 'on' : ''}" data-act="ntby" data-v="${v}">${esc(N(v))}</button>`).join('')}</div>
  <div class="btnrow"><button class="save" data-act="ntsave">Salvar anotação</button></div><p class="dv">${esc(agMsg)}</p>
  <h3 class="sub">Anotações de ${esc(title)}</h3>${lst || '<p class="empty">Nenhuma anotação neste mês.</p>'}`;
}

function eventsHtml() {
  if (!evF.d) evF.d = sel;
  const t = todayStr(), lst = EL().filter(x => (x.e || x.d) >= t).sort((a, b) => a.d < b.d ? -1 : 1)
    .map(x => `<div class="brow nt"><div><b><i class="kd" style="background:${evKind(x.k)[2]}"></i>${esc(x.t)}</b><span>${esc(evKind(x.k)[1])} · ${evRange(x)} · ${esc(evWho(x))} · ${evWhen(x)}</span></div><button class="lnk ${conf === 'v' + x.id ? 'sure' : ''}" data-act="evdel" data-id="${x.id}">${conf === 'v' + x.id ? 'Confirmar' : 'Apagar'}</button></div>`).join('');
  return `<p class="dv bcap">Novo evento</p>
  <div class="bgrid"><label>Data<input type="date" id="evd" value="${evF.d}"></label><label>Até (opcional)<input type="date" id="evd2" value="${evF.e}" min="${evF.d}"></label></div>
  <label class="bl">Título<input id="evt" value="${esc(evF.t)}" maxlength="80" placeholder="Ex.: Viagem para a praia"></label>
  <div class="chips2">${EVK.map(([k, n, c]) => `<button class="${evF.k === k ? 'on' : ''}" data-act="evk" data-k="${k}"><i class="kd" style="background:${c}"></i>${n}</button>`).join('')}</div>
  <div class="rxbar"><span>Vale para</span>${[['ab', 'Os dois'], ['a', N('a')], ['b', N('b')]].map(([v, n]) => `<button class="${evF.w === v ? 'on' : ''}" data-act="evw" data-v="${v}">${esc(n)}</button>`).join('')}</div>
  ${EVOFF.includes(evF.k) ? '<p class="dv">Doente e Descanso diminuem a meta da semana, para não quebrar a sequência.</p>' : ''}
  <div class="btnrow"><button class="save" data-act="evadd">Adicionar evento</button></div><p class="dv">${esc(agMsg)}</p>
  <h3 class="sub">Próximos eventos</h3>${lst || '<p class="empty">Nenhum evento marcado.</p>'}`;
}

/* guias embaixo do calendário; a primeira mostra o resumo do dia (o que já existia) */
function agendaHtml(dayHtml) {
  const tabs = [['dia', 'Resumo do dia'], ['notas', 'Anotações'], ['evs', 'Eventos']].map(([k, n]) => `<button class="${calTab === k ? 'on' : ''}" data-act="ctab" data-k="${k}">${n}</button>`).join('');
  return `<section class="bcard"><div class="chips2 mtabs">${tabs}</div>${calTab === 'notas' ? notesHtml() : calTab === 'evs' ? eventsHtml() : dayHtml}</section>`;
}
/* depois de desenhar: deixa o dia escolhido visível na fileira de dias */
function agendaAfter() {
  const el = document.querySelector('.mdays .on'), box = el && el.parentElement;
  if (box) box.scrollLeft = el.offsetLeft - box.clientWidth / 2 + el.offsetWidth / 2;
}

/* lembrete ao abrir o app: eventos que começam hoje ou amanhã (uma vez por dia) */
function agendaToast() {
  const t = todayStr(), d = new Date(); d.setDate(d.getDate() + 1); const tm = d.toLocaleDateString('sv');
  const ls = EL().filter(x => x.d === t || x.d === tm); if (!ls.length) return;
  const key = t + ':' + ls.map(x => x.id).sort().join(',');
  try { if (localStorage.getItem('appgym-evtoast') === key) return; localStorage.setItem('appgym-evtoast', key); } catch (e) {}
  toast(ls.map(x => (x.d === t ? 'Hoje' : 'Amanhã') + ': ' + x.t).join(' · '));
}
