/* Backup, resumo, sugestão de carga, meta semanal e cronômetro de descanso. */
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
  return '🏋️ ' + x.day + ' · ' + fd(x.d) + ' (' + N(who) + ')\n' + x.items.map(i => '• ' + i.n + ': ' + fxs(i)).join('\n') + '\nVolume: ' + fmt(v) + ' kg' + (x.dur ? '\nTempo: ' + fmtDur(x.dur) : '');
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
  if (!T || !last) return '';
  /* usa a série mais pesada do último treino (em qualquer posição), não só a primeira */
  const tp = topOf(last), pv = L.length > 1 ? topOf(L[L.length - 2]) : null;
  if (!(tp.kg > 0)) return '';
  const inc = tp.kg < 20 ? 1 : 2.5, best = Math.max.apply(null, tp.rs);
  let txt, kg = null;
  if (tp.n >= T.sets && tp.rs.every(r => r >= T.hi)) { kg = tp.kg + inc; txt = 'Bateu o topo da faixa (' + T.hi + ' reps). Suba para <b>' + fmt(kg) + ' kg</b> e recomece perto de ' + T.lo + ' reps.'; }
  else if (best < T.lo && pv && Math.max.apply(null, pv.rs) < T.lo && pv.kg >= tp.kg) { kg = Math.max(0, tp.kg - inc); txt = 'Duas vezes abaixo de ' + T.lo + ' reps. Reduza para <b>' + fmt(kg) + ' kg</b> e reconstrua.'; }
  else if (best < T.lo) txt = 'Ficou abaixo de ' + T.lo + ' reps. Mantenha <b>' + fmt(tp.kg) + ' kg</b> e busque chegar a ' + T.lo + '.';
  else txt = 'Mantenha <b>' + fmt(tp.kg) + ' kg</b> e tente +1 rep por série (meta: ' + T.hi + ').';
  return '<div class="sugb"><span>📈 ' + txt + '</span>' + (kg !== null ? '<button class="lnk" data-act="usekg" data-p="' + p + '" data-kg="' + kg + '">Usar ' + fmt(kg) + ' kg</button>' : '') + '</div>';
}
function weekKey(d) { const x = new Date(d + 'T12:00:00'); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x.toLocaleDateString('sv'); }
function goalInfo(p) {
  const g0 = +S.cfg.goal || 4, cnt = {}, off = offDays(p);
  Object.keys(MK(p)).forEach(k => { const w = weekKey(k); cnt[w] = (cnt[w] || 0) + 1; });
  /* dias de doente/descanso diminuem a meta daquela semana; semana inteira de pausa não quebra nem conta na sequência */
  const need = w => g0 - (off[w] || 0);
  const cur = weekKey(todayStr()), gc = Math.max(1, need(cur));
  let streak = need(cur) >= 1 && (cnt[cur] || 0) >= need(cur) ? 1 : 0;
  const w = new Date(cur + 'T12:00:00');
  for (let i = 0; i < 520; i++) {
    w.setDate(w.getDate() - 7); const k = w.toLocaleDateString('sv'), nd = need(k);
    if (nd <= 0) continue;
    if ((cnt[k] || 0) >= nd) streak++; else break;
  }
  return { g: gc, n: cnt[cur] || 0, streak, off: off[cur] || 0 };
}
function goalHtml() {
  const g = goalInfo(who), dots = Array.from({ length: g.g }, (_, i) => '<i class="' + (i < g.n ? 'f' : '') + '"></i>').join('');
  return '<p class="goal"><b>Meta da semana</b> ' + dots + ' ' + g.n + '/' + g.g + (g.off ? ' (' + g.off + ' dia' + (g.off === 1 ? '' : 's') + ' de pausa)' : '') + ' · 🔥 ' + g.streak + ' semana' + (g.streak === 1 ? '' : 's') + ' seguida' + (g.streak === 1 ? '' : 's') + '</p>';
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

/* ---------- cronômetro do treino (você inicia e você encerra) ---------- */
let runTimer = null, runMsg = '';
function runDraw() {
  const el = document.getElementById('run'); if (!el) return;
  if (S.run) {
    el.hidden = false; el.className = 'run on';
    el.innerHTML = '<span class="rl">Treinando</span><b id="runt">' + clock(runElapsed()) + '</b><button class="save off" data-act="runend">■ Encerrar treino</button>' + (runMsg ? '<p class="notice" role="status">' + esc(runMsg) + '</p>' : '');
    runMsg = '';
    if (!runTimer) runTimer = setInterval(runTick, 1000);
  } else {
    clearInterval(runTimer); runTimer = null;
    if (view !== 'treino' || workCtx) { el.hidden = true; el.innerHTML = ''; return; }
    el.hidden = false; el.className = 'run';
    el.innerHTML = '<button class="save wide" data-act="runstart">▶ Iniciar treino</button>';
  }
}
function runTick() { const t = document.getElementById('runt'); if (S.run && t) t.textContent = clock(runElapsed()); }
