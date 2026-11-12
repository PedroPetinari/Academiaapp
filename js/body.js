/* Corpo: peso, medidas, altura, IMC e gráficos (corpo e desempenho nos treinos). */
const BM = [['w', 'Peso', 'kg'], ['ci', 'Cintura', 'cm'], ['qu', 'Quadril', 'cm'], ['pe', 'Peito', 'cm'], ['br', 'Braço', 'cm'], ['co', 'Coxa', 'cm'], ['pa', 'Panturrilha', 'cm'], ['gd', 'Gordura', '%']];
const BPERF = [['vol', 'Volume dos treinos', 'kg'], ['car', 'Carga por exercício', 'kg']];
let bodyMetric = 'w', bodyEx = '', bodyDate = '', bodyMsg = '';

const BL = p => { if (p === 'b') { S.body2 = S.body2 || []; return S.body2; } S.body = S.body || []; return S.body; };
const heightOf = p => { const h = (S.height || {})[p]; return h && +h.v > 0 ? +h.v : 0; };
const bval = (x, k) => k === 'w' ? x.w : (x.m || {})[k];

function bodySave(p) {
  const d = (document.getElementById('bd') || {}).value || todayStr();
  const w = num((document.getElementById('bw') || {}).value), m = {};
  BM.slice(1).forEach(([k]) => { const v = num((document.getElementById('bm-' + k) || {}).value); if (v > 0) m[k] = v; });
  if (!(w > 0) && !Object.keys(m).length) return false;
  const old = BL(p).find(x => x.d === d), en = { d, ts: Date.now(), m: Object.assign({}, old ? old.m : {}, m) };
  const keepW = old && old.w > 0 ? old.w : 0;
  if (w > 0) en.w = w; else if (keepW) en.w = keepW;
  const a = BL(p).filter(x => x.d !== d); a.push(en); a.sort((x, y) => x.d < y.d ? -1 : 1);
  if (p === 'b') S.body2 = a; else S.body = a;
  bodyDate = d; return true;
}
function bodyDel(p, d) {
  const a = BL(p).filter(x => x.d !== d);
  if (p === 'b') S.body2 = a; else S.body = a;
  S.tomb['g' + p + d] = Date.now();
}
function bodySetH(p, v) { let h = num(v); if (h > 0 && h < 3) h *= 100; /* 1,75 vira 175 cm */ S.height = S.height || {}; S.height[p] = { v: h > 0 ? Math.round(h * 10) / 10 : 0, ts: Date.now() }; }

/* pontos do gráfico escolhido */
function bodyPoints(p, k) {
  if (k === 'vol' || k === 'car') {
    const by = {};
    S.days.forEach(day => { if (day.check) return; day.ex.forEach(e => { if (k === 'car' && e.id !== bodyEx) return; LG(e, p).forEach(x => { by[x.d] = (by[x.d] || 0) + (k === 'vol' ? ev(x) : Math.max(x.kg, ...(x.x || []).map(o => o.kg))); }); }); });
    return Object.keys(by).sort().map(d => ({ d, v: by[d] })).filter(q => q.v > 0);
  }
  return BL(p).map(x => ({ d: x.d, v: bval(x, k) })).filter(q => q.v > 0);
}

/* gráfico de linha em SVG (cores vêm do tema) */
function lineChart(pts, unit) {
  if (pts.length < 2) return `<p class="empty">${pts.length ? 'Falta mais um registro para formar o gráfico.' : 'Nenhum registro ainda.'}</p>`;
  const W = 340, H = 190, L = 38, R = 12, T = 14, B = 26, t0 = new Date(pts[0].d + 'T12:00:00').getTime(), t1 = new Date(pts[pts.length - 1].d + 'T12:00:00').getTime();
  let lo = Math.min.apply(null, pts.map(q => q.v)), hi = Math.max.apply(null, pts.map(q => q.v));
  const pad = (hi - lo) * 0.15 || Math.max(1, hi * 0.05); lo = Math.max(0, lo - pad); hi += pad;
  const X = d => L + (t1 === t0 ? 0.5 : (new Date(d + 'T12:00:00').getTime() - t0) / (t1 - t0)) * (W - L - R), Y = v => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  const f = v => fmt(Math.round(v * 10) / 10), sh = d => d.slice(8) + '/' + d.slice(5, 7);
  const line = pts.map((q, i) => (i ? 'L' : 'M') + X(q.d).toFixed(1) + ' ' + Y(q.v).toFixed(1)).join('');
  const grid = [0, 1, 2].map(i => { const v = lo + (hi - lo) * (i / 2), y = Y(v).toFixed(1); return `<line x1="${L}" x2="${W - R}" y1="${y}" y2="${y}" stroke="var(--line)" stroke-width="1"/><text x="${L - 6}" y="${(+y + 4).toFixed(1)}" text-anchor="end" font-size="10" fill="var(--mute)">${f(v)}</text>`; }).join('');
  const dots = pts.map((q, i) => `<circle cx="${X(q.d).toFixed(1)}" cy="${Y(q.v).toFixed(1)}" r="${pts.length > 40 ? 2 : 3.5}" fill="var(--acc)" stroke="var(--surface)" stroke-width="1.5"/>`).join('');
  const last = pts[pts.length - 1], lx = X(last.d), anch = lx > W - 50 ? 'end' : 'middle';
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfico de ${esc(unit)}">${grid}<path d="${line}L${X(last.d).toFixed(1)} ${H - B}L${X(pts[0].d).toFixed(1)} ${H - B}Z" fill="var(--acc)" opacity=".12"/><path d="${line}" fill="none" stroke="var(--acc)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>${dots}<text x="${lx.toFixed(1)}" y="${(Y(last.v) - 9).toFixed(1)}" text-anchor="${anch}" font-size="11" font-weight="700" fill="var(--ink)">${f(last.v)} ${esc(unit)}</text><text x="${L}" y="${H - 8}" font-size="10" fill="var(--mute)">${sh(pts[0].d)}</text><text x="${W - R}" y="${H - 8}" text-anchor="end" font-size="10" fill="var(--mute)">${sh(last.d)}</text></svg>`;
}

function imcInfo(w, h) {
  if (!(w > 0 && h > 0)) return null;
  const v = w / Math.pow(h / 100, 2);
  return { v, lbl: v < 18.5 ? 'abaixo do peso' : v < 25 ? 'peso normal' : v < 30 ? 'sobrepeso' : 'obesidade' };
}

function viewBody() {
  const p = who, L = BL(p), last = L.filter(x => x.w > 0).slice(-1)[0], first = L.find(x => x.w > 0), h = heightOf(p), im = imcInfo(last && last.w, h);
  const d = bodyDate || todayStr(), cur = L.find(x => x.d === d) || { m: {} };
  const isPerf = bodyMetric === 'vol' || bodyMetric === 'car';
  /* exercícios com registro, para o gráfico de carga */
  const exs = []; S.days.forEach(day => { if (day.check) return; day.ex.forEach(e => { if (LG(e, p).length) exs.push([e.id, e.name + ' · ' + day.name]); }); });
  if (bodyMetric === 'car' && !exs.some(x => x[0] === bodyEx)) bodyEx = exs.length ? exs[0][0] : '';
  const met = BM.concat(BPERF).find(x => x[0] === bodyMetric) || BM[0], pts = bodyPoints(p, bodyMetric);
  let stat = '';
  if (pts.length >= 2) {
    const a = pts[0].v, z = pts[pts.length - 1].v, df = z - a, best = pts.reduce((m, q) => q.v > m.v ? q : m, pts[0]);
    stat = `<p class="dv">De ${fd(pts[0].d)} até ${fd(pts[pts.length - 1].d)}: <b>${df > 0 ? '+' : ''}${fmt(Math.round(df * 10) / 10)} ${met[2]}</b>${a > 0 ? ' (' + (df >= 0 ? '+' : '') + Math.round(df / a * 100) + '%)' : ''}${isPerf ? ' · melhor: <b>' + fmt(Math.round(best.v)) + ' ' + met[2] + '</b> em ' + fd(best.d) : ''}</p>`;
  }
  const chips = (arr) => arr.map(([k, n]) => `<button class="${bodyMetric === k ? 'on' : ''}" data-act="bmet" data-k="${k}">${n}</button>`).join('');
  const hist = L.slice().reverse().slice(0, 30).map(x => `<div class="brow"><div><b>${fd(x.d)}</b><span>${[x.w > 0 ? fmt(x.w) + ' kg' : ''].concat(BM.slice(1).filter(([k]) => x.m && x.m[k] > 0).map(([k, n, u]) => n + ' ' + fmt(x.m[k]) + (u === '%' ? '%' : ' cm'))).filter(Boolean).join(' · ')}</span></div><button class="lnk ${conf === 'g' + x.d ? 'sure' : ''}" data-act="bdel" data-d="${x.d}">${conf === 'g' + x.d ? 'Confirmar' : 'Apagar'}</button></div>`).join('');
  return `<div class="dayhead"><h2>Corpo</h2></div>${whoSeg()}
  <section class="bcard"><div class="bsum"><div><small>Peso atual</small><b>${last ? fmt(last.w) + ' kg' : '—'}</b>${first && last && first !== last ? `<em>${last.w - first.w > 0 ? '+' : ''}${fmt(Math.round((last.w - first.w) * 10) / 10)} kg desde ${fd(first.d)}</em>` : ''}</div><div><small>Altura</small><b><input id="bh" class="bh" inputmode="decimal" value="${h ? fmt(h) : ''}" placeholder="cm" aria-label="Altura em centímetros"> cm</b></div><div><small>IMC</small><b>${im ? fmt(Math.round(im.v * 10) / 10) : '—'}</b>${im ? `<em>${im.lbl}</em>` : '<em>informe a altura</em>'}</div></div></section>
  <section class="bcard"><h3>Registrar peso e medidas</h3><label class="bl">Data<input type="date" id="bd" value="${d}" max="${todayStr()}"></label>
  <div class="bgrid"><label>Peso (kg)<input id="bw" inputmode="decimal" value="${cur.w > 0 ? fmt(cur.w) : ''}" placeholder="0"></label>${BM.slice(1).map(([k, n, u]) => `<label>${n} (${u})<input id="bm-${k}" inputmode="decimal" value="${cur.m && cur.m[k] > 0 ? fmt(cur.m[k]) : ''}" placeholder="0"></label>`).join('')}</div>
  <div class="btnrow"><button class="save" data-act="bsave">Salvar</button></div><p class="dv">${esc(bodyMsg)}</p></section>
  <section class="bcard"><h3>Gráfico</h3><p class="dv bcap">Corpo</p><div class="chips2">${chips(BM)}</div><p class="dv bcap">Desempenho nos treinos</p><div class="chips2">${chips(BPERF)}</div>
  ${bodyMetric === 'car' ? `<label class="bl">Exercício<select id="bex">${exs.map(([id, n]) => `<option value="${id}" ${id === bodyEx ? 'selected' : ''}>${esc(n)}</option>`).join('') || '<option>Nenhum exercício com registro</option>'}</select></label>` : ''}
  <h4>${met[1]}${met[0] === 'car' && exs.length ? '' : ''}</h4>${lineChart(pts, met[2])}${stat}</section>
  <section class="bcard"><h3>Registros</h3>${hist || '<p class="empty">Nenhum registro ainda.</p>'}</section>`;
}
