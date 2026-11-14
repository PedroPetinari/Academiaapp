/* Menu novo (Hoje, Treino, Agenda, Progresso, Ajustes) e a tela inicial "Hoje". */
let homeDay = '', lastAg = 'cal', lastPg = 'corpo';
const NAVG = { hoje: ['hoje'], treino: ['treino'], agenda: ['cal', 'hist'], progresso: ['corpo', 'fotos'], estilo: ['estilo'] };
const grpOf = v => Object.keys(NAVG).find(k => NAVG[k].includes(v)) || 'hoje';
const SVGA = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
const NAVI = [
  ['hoje', 'Hoje', `<svg viewBox="0 0 24 24" ${SVGA}><path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/></svg>`],
  ['treino', 'Treino', `<svg viewBox="0 0 24 24" ${SVGA}><path d="M6 7v10M18 7v10M3 10v4M21 10v4M6 12h12"/></svg>`],
  ['agenda', 'Agenda', `<svg viewBox="0 0 24 24" ${SVGA}><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>`],
  ['progresso', 'Progresso', `<svg viewBox="0 0 24 24" ${SVGA}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>`],
  ['estilo', 'Ajustes', `<svg viewBox="0 0 24 24" ${SVGA}><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/></svg>`]
];
function renderBar() {
  const g = grpOf(view);
  document.getElementById('bar').innerHTML = NAVI.map(([k, l, ic]) => `<button class="${g === k ? 'on' : ''}" data-act="nav" data-v="${k}" ${g === k ? 'aria-current="page"' : ''}>${ic}${l}</button>`).join('');
}
/* guias no topo de Agenda e de Progresso */
function subTabs(v) {
  const g = grpOf(v), o = g === 'agenda' ? [['cal', 'Calendário'], ['hist', 'Histórico']] : g === 'progresso' ? [['corpo', 'Corpo'], ['fotos', 'Fotos']] : null;
  return o ? `<div class="subtabs">${o.map(([k, l]) => `<button class="${v === k ? 'on' : ''}" data-act="nav" data-v="${k}">${l}</button>`).join('')}</div>` : '';
}

const greeting = () => { const h = new Date().getHours(); return h >= 5 && h < 12 ? 'Bom dia' : h >= 12 && h < 18 ? 'Boa tarde' : 'Boa noite'; };
const trainDays = () => S.days.filter(d => !d.check);
/* sugestão: o treino seguinte ao último que a pessoa salvou (ou o escolhido em "Trocar treino") */
function suggestDay(p) {
  const D = trainDays(); if (!D.length) return null;
  const ov = D.find(d => d.id === homeDay); if (ov) return ov;
  const last = SS(p).slice().sort((a, b) => (b.ts || 0) - (a.ts || 0))[0];
  const i = last ? D.findIndex(d => d.id === last.id.split('|')[1]) : -1;
  return D[(i + 1) % D.length];
}
function estMin(day) {
  const ds = ['a', 'b'].flatMap(p => SS(p).filter(s => s.day === day.name && s.dur > 0).map(s => s.dur));
  return ds.length ? Math.max(5, Math.round(ds.reduce((a, b) => a + b, 0) / ds.length / 300) * 5) : 0;
}
const ring = (n, g, col) => `<svg viewBox="0 0 84 84" aria-hidden="true"><circle cx="42" cy="42" r="35" fill="none" stroke="var(--line)" stroke-width="9"/><circle cx="42" cy="42" r="35" fill="none" stroke="${col}" stroke-width="9" stroke-linecap="round" stroke-dasharray="${(219.9 * Math.min(1, n / (g || 1))).toFixed(1)} 220" transform="rotate(-90 42 42)"/></svg>`;
function weekStrip() {
  const w = new Date(weekKey(todayStr()) + 'T12:00:00'), t = todayStr(), WD = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'];
  let o = '';
  for (let i = 0; i < 7; i++) {
    const k = w.toLocaleDateString('sv');
    o += `<button class="wd ${k === t ? 't' : ''}" data-act="gocal" data-d="${k}" aria-label="Ver ${fd(k)} no calendário"><small>${WD[i]}</small><div>${+k.slice(8)}${MK('a')[k] ? '<i class="l"></i>' : ''}${MK('b')[k] ? '<i class="b r"></i>' : ''}</div></button>`;
    w.setDate(w.getDate() + 1);
  }
  return o;
}
const goalTxt = g => g.n >= g.g ? 'Meta batida' : (g.g - g.n) + ' treino' + (g.g - g.n === 1 ? '' : 's') + ' para a meta';

function viewHome() {
  const p = who, t = todayStr(), day = suggestDay(p), done = !!MK(p)[t], gi = goalInfo(p), ga = goalInfo('a'), gb = goalInfo('b');
  const off = evOn(evFor(p), t).find(x => EVOFF.includes(x.k));
  const sub = !day ? 'Crie o primeiro treino na aba Treino.' : done ? 'Você já treinou hoje, parabéns.' : off ? (off.k === 'doente' ? 'Hoje é dia de se cuidar. O treino espera.' : 'Hoje é dia de descanso.') : 'Hoje é dia de ' + day.name.toLowerCase() + '. Vamos?';
  const nEx = day ? day.ex.length : 0, est = day ? estMin(day) : 0;
  const hero = day ? `<div class="hero"><small>${done ? 'Próximo treino' : 'Treino de hoje'}</small><h2>${esc(day.name)}</h2><p>${nEx} exercício${nEx === 1 ? '' : 's'}${est ? ' · cerca de ' + est + ' min' : ''}</p><button class="btn" data-act="hstart">${S.run ? 'Continuar treino' : 'Iniciar treino'}</button>${trainDays().length > 1 ? '<button class="lnk hsw" data-act="hnext">Trocar treino</button>' : ''}</div>` : '';
  const w0 = weekKey(t), w1 = new Date(w0 + 'T12:00:00'); w1.setDate(w1.getDate() + 6);
  const mc = Object.keys(MK(p)).filter(k => k.startsWith(t.slice(0, 7))).length, wr = weekRecords(p);
  const dateLong = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  return `<div class="home"><p class="hdate">${esc(dateLong)}</p><h1>${greeting()}, ${esc(N(p))}</h1><p class="hsub">${esc(sub)}</p>${whoSeg()}${hero}
  <section class="hc"><div class="row"><b>Meta da semana</b><span class="hmute">${fd(w0)} a ${fd(w1.toLocaleDateString('sv'))}</span></div>
  <div class="pair"><div class="pg"><div class="ring">${ring(ga.n, ga.g, 'var(--acc)')}<b>${ga.n}/${ga.g}</b></div><span>${esc(N('a'))}</span><small>${goalTxt(ga)}</small></div>
  <div class="pg"><div class="ring">${ring(gb.n, gb.g, 'var(--acc2)')}<b>${gb.n}/${gb.g}</b></div><span>${esc(N('b'))}</span><small>${goalTxt(gb)}</small></div></div>
  <div class="week">${weekStrip()}</div></section>
  <div class="tiles"><div class="tile"><b>${gi.streak}</b><span>semana${gi.streak === 1 ? '' : 's'} seguida${gi.streak === 1 ? '' : 's'}</span></div><div class="tile"><b>${mc}</b><span>treino${mc === 1 ? '' : 's'} no mês</span></div><div class="tile"><b>${wr}</b><span>recorde${wr === 1 ? '' : 's'} na semana</span></div></div></div>`;
}

/* Progresso: recordes recentes e volume por semana (aparece abaixo do Corpo) */
function progExtra() {
  const p = who, ss = SS(p);
  const rec = ss.slice().sort((a, b) => a.d < b.d ? 1 : -1).flatMap(s => sessRecs(p, s)).slice(0, 5);
  const wk = {}; ss.forEach(s => { const k = weekKey(s.d); wk[k] = (wk[k] || 0) + s.items.reduce((a, i) => a + ev(i), 0); });
  const w = new Date(weekKey(todayStr()) + 'T12:00:00'), arr = [];
  for (let i = 5; i >= 0; i--) { const d = new Date(w); d.setDate(d.getDate() - 7 * i); const k = d.toLocaleDateString('sv'); arr.push([k, wk[k] || 0]); }
  const mx = Math.max(1, ...arr.map(x => x[1]));
  return `<section class="bcard"><h3 class="sub">Recordes recentes</h3>${rec.length ? rec.map(r => `<div class="brow"><div><b>${esc(r.n)}</b><span>${[r.kg && 'carga ' + r.kg, r.se && 'melhor série ' + r.se].filter(Boolean).join(' · ')} · ${fd(r.d)}</span></div></div>`).join('') : '<p class="empty">Ainda sem recordes batidos.</p>'}</section>
  <section class="bcard"><h3 class="sub">Volume por semana (${esc(N(p))})</h3><div class="vbars">${arr.map(([k, v]) => `<div><i style="height:${Math.round(v / mx * 80) + 4}px"></i><small>${fd(k)}</small><b>${v ? fmt(Math.round(v)) : '-'}</b></div>`).join('')}</div></section>`;
}
