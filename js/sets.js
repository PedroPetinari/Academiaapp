/* Tela de Treino com um exercício por vez: séries em linhas (carga, reps, confirmar).
   Por baixo, cada treino continua guardado como antes: carga/séries/reps da primeira série + séries extras (x). */
let exCur = '';
const okS = {};   /* séries confirmadas por exercício e pessoa */
const dkey = (e, p) => e.id + (p === 'b' ? 'b' : '');
const same = (a, b) => String(a.kg) === String(b.kg) && String(a.r) === String(b.r);

/* rascunho -> linhas (a primeira série repetida "s" vezes, depois as extras) */
function expand(dr) {
  const n = Math.max(1, parseInt(dr.s) || 1), rows = [];
  for (let i = 0; i < n; i++) rows.push({ kg: dr.kg, r: dr.r });
  return rows.concat((dr.x || []).map(o => ({ kg: o.kg, r: o.r })));
}
/* linhas -> rascunho (as linhas iguais à primeira, em sequência, viram "s") */
function compress(dr, rows) {
  if (!rows.length) rows = [{ kg: '', r: '' }];
  let s = 1; while (s < rows.length && same(rows[s], rows[0])) s++;
  dr.kg = rows[0].kg; dr.r = rows[0].r; dr.s = s; dr.x = rows.slice(s).map(o => ({ kg: o.kg, r: o.r }));
}
function okOf(e, p) {
  const k = dkey(e, p), n = expand(draft(e, p)).length;
  if (!okS[k]) { const done = LG(e, p).some(x => x.d === curDate()); okS[k] = Array(n).fill(done); }
  while (okS[k].length < n) okS[k].push(false);
  okS[k].length = n; return okS[k];
}
/* o que vale gravar ao encerrar: só as séries confirmadas (ou tudo, se nada foi confirmado) */
function savable(e, p) {
  const dr = drafts[dkey(e, p)], ok = okS[dkey(e, p)];
  if (!dr || !ok || !ok.some(Boolean)) return dr;
  const d2 = {}; compress(d2, expand(dr).filter((r, i) => ok[i])); return d2;
}
const exDone = (e, p) => LG(e, p).some(x => x.d === curDate());

function setRow(e, p, i, f, v) {
  const dr = draft(e, p), rows = expand(dr); if (!rows[i]) return;
  rows[i][f] = v; compress(dr, rows); touched[dkey(e, p)] = true;
}
/* grava (ou apaga) o registro de hoje com as séries confirmadas */
function persistLog(e, day, p, t) {
  const dr = draft(e, p), ok = okOf(e, p), sub = expand(dr).filter((r, i) => ok[i]);
  if (sub.length) {
    const d2 = {}; compress(d2, sub);
    if (logIt(e, p, d2, t)) { markOn(p, t); upsertSession(day, t, p); }
  } else {
    const L = LG(e, p).filter(x => x.d !== t);
    if (p === 'b') e.log2 = L; else e.log = L;
    S.tomb['l' + p + e.id + '|' + t] = Date.now(); upsertSession(day, t, p);
    if (!SS(p).some(s => s.d === t)) markOff(p, t);
  }
}
function rowCheck(e, day, p, i, t) {
  const dr = draft(e, p), rows = expand(dr), ok = okOf(e, p);
  if (!rows[i]) return;
  if (!ok[i]) {
    if (!(num(rows[i].r) > 0)) { notice = 'Informe as repetições para confirmar a série.'; return; }
    ok[i] = true;
    const nx = rows[i + 1];   /* a próxima série já vem com a mesma carga */
    if (nx && !ok[i + 1] && String(nx.kg) === '' && String(rows[i].kg) !== '') { nx.kg = rows[i].kg; compress(dr, rows); }
    if (+S.cfg.rest) rtStart(+S.cfg.rest);
  } else ok[i] = false;
  touched[dkey(e, p)] = true; persistLog(e, day, p, t);
}
function rowAdd(e, p) {
  const dr = draft(e, p), rows = expand(dr), ok = okOf(e, p), l = rows[rows.length - 1];
  rows.push({ kg: l.kg, r: l.r }); compress(dr, rows); ok.push(false); touched[dkey(e, p)] = true;
}
function rowDel(e, day, p, i, t) {
  const dr = draft(e, p), rows = expand(dr), ok = okOf(e, p);
  if (rows.length < 2 || !rows[i]) return;
  rows.splice(i, 1); ok.splice(i, 1); compress(dr, rows); touched[dkey(e, p)] = true; persistLog(e, day, p, t);
}
function useKg(e, p, kg) {
  const dr = draft(e, p), rows = expand(dr), ok = okOf(e, p);
  rows.forEach((r, i) => { if (!ok[i]) r.kg = kg; }); compress(dr, rows); touched[dkey(e, p)] = true;
}

const CHK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7"/></svg>';
const metaTxt = t => (t || '').replace(/\s*[x×]\s*/, ' × ').replace(/-/g, '–');

function setRows(e, p) {
  const dr = draft(e, p), rows = expand(dr), ok = okOf(e, p);
  return rows.map((r, i) => `<div class="sr ${ok[i] ? 'ok' : ''}" data-lp data-lpid="sr${dkey(e, p)}${i}"><span class="sn">${i + 1}</span>
    <label>Carga (kg)<input inputmode="decimal" data-f="rkg" data-i="${i}" data-p="${p}" value="${esc(r.kg)}" placeholder="0"></label>
    <label>Reps<input inputmode="numeric" data-f="rr" data-i="${i}" data-p="${p}" value="${esc(r.r)}"></label>
    <button class="ck ${ok[i] ? 'on' : ''}" data-act="rok" data-i="${i}" data-p="${p}" aria-pressed="${ok[i] ? 'true' : 'false'}" aria-label="${ok[i] ? 'Desfazer série ' : 'Confirmar série '}${i + 1}">${CHK}</button>
    <span class="lpa" hidden>${rows.length > 1 ? `<button data-lpa data-lpl="Remover série" data-lpd data-act="delrow" data-i="${i}" data-p="${p}"></button>` : ''}</span></div>`).join('');
}

function exCard(day) {
  const t = curDate(), p = who, n = day.ex.length;
  if (!day.ex.some(e => e.id === exCur)) exCur = (day.ex.find(e => !exDone(e, p)) || day.ex[0]).id;
  const i = day.ex.findIndex(e => e.id === exCur), e = day.ex[i];
  const chips = day.ex.map((x, j) => `<button class="${x.id === exCur ? 'on' : ''} ${exDone(x, p) ? 'dn' : ''}" data-act="exgo" data-i="${j}" aria-label="Exercício ${j + 1}: ${esc(x.name)}">${j + 1}</button>`).join('');
  const L = LG(e, p), last = L[L.length - 1], pr = L.reduce((m, x) => Math.max(m, kgMax(x)), 0), bs = L.reduce((m, x) => { const o = bestSet(x); return setScore(o) > setScore(m) ? o : m; }, { kg: 0, r: 0 });
  const dr = draft(e, p), prv = day.ex[i - 1], nxt = day.ex[i + 1];
  const hist = L.slice(-6).reverse().map(x => `<li data-lp data-lpid="hl${e.id}${p}${x.d}"><span>${fd(x.d)} · ${fxs(x)} · ${fmt(ev(x))} kg de volume</span><span class="lpa" hidden><button data-lpa data-lpl="Apagar registro" data-lpd data-act="dellog" data-p="${p}" data-d="${x.d}"></button></span></li>`).join('');
  const tools = `<span class="lpa" hidden><button data-lpa data-lpl="Editar exercício" data-act="editex"></button><button data-lpa data-lpl="Remover exercício" data-lpd data-lpc data-act="delex"></button></span>`;
  const head = editEx === e.id ? editForm(e, false) : `<div class="xh" data-lp data-lpid="xh${e.id}"><h3>${esc(e.name)}</h3><p class="xm">${e.t ? 'Meta ' + esc(metaTxt(e.t)) + ' · ' : ''}exercício ${i + 1} de ${n}</p>${tools}</div>`;
  return `<article class="ex xc" data-id="${e.id}"><div class="exn" role="group" aria-label="Exercícios do treino">${chips}</div>${head}${whoSeg()}
    <div class="sets">${setRows(e, p)}</div>
    <button class="lnk addset" data-act="addrow" data-p="${p}">+ adicionar série</button>
    <p class="vol">Volume <i data-xvol>${vol(dr)} kg</i></p>
    <div class="badges">${pr ? `<span class="bdg">Recorde de carga: ${fmt(pr)} kg</span>` : ''}${setScore(bs) > 0 ? `<span class="bdg">Melhor série: ${setTxt(bs)}</span>` : ''}</div>
    ${sugBox(e, p, L)}
    <div class="rt inl" id="rtin"></div>
    <div class="xnav"><button class="lnk" data-act="exprev" ${prv ? '' : 'disabled'}>${prv ? 'Anterior' : ''}</button><button class="${nxt ? 'save' : 'lnk'}" data-act="exnext" ${nxt ? '' : 'disabled'}>${nxt ? 'Próximo exercício' : ''}</button></div>
    ${last ? `<p class="meta">Última: ${fxs(last)} · ${fd(last.d)}</p>` : '<p class="meta">Sem registros ainda</p>'}
    ${L.length ? `<details><summary>Histórico</summary><ul>${hist}</ul></details>` : ''}</article>`;
}
