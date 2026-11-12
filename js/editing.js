/* Confirmação ao encerrar, e edição / retomada de treinos salvos no histórico. */
let workCtx = null, askEnd = null, histMsg = '';   /* workCtx = { d: data, who, day, resumed } enquanto edita um treino salvo */
const curDate = () => workCtx ? workCtx.d : todayStr();
const runElapsed = () => S.run ? (S.run.base || 0) + (Date.now() - S.run.at) / 1000 : 0;
const clearDrafts = () => { drafts = {}; Object.keys(touched).forEach(k => delete touched[k]); };

/* há algo para salvar? (cargas preenchidas ou algo salvo durante este treino) */
function hasWork() {
  if (Object.keys(touched).some(k => touched[k])) return true;
  return !!S.run && ['a', 'b'].some(pe => SS(pe).some(s => s.id.slice(0, 10) === todayStr() && (s.ts || 0) >= S.run.at));
}

/* Encerra de verdade (depois da confirmação). */
function doFinish(act, prev) {
  if (finishWorkout()) return;
  if (act === 'runend') { if (prev === 'endrun') S.run = null; else { runMsg = 'Nada preenchido ainda. Toque em Encerrar de novo para parar o cronômetro sem salvar.'; conf = 'endrun'; } }
  else notice = 'Preencha ao menos um exercício (carga, séries e reps) para salvar o treino.';
}

/* Abre um treino salvo para corrigir (resume = false) ou para continuar treinando (resume = true). */
function startEdit(sid, resume) {
  if (S.run || workCtx) { histMsg = 'Encerre ou cancele o treino em andamento antes de abrir outro.'; return; }
  const s = SS(who).find(x => x.id === sid), day = s && S.days.find(d => d.id === sid.split('|')[1]);
  if (!s || !day) { histMsg = 'Não encontrei o treino original (ele pode ter sido removido).'; return; }
  clearDrafts();
  day.ex.forEach(e => {
    const l = LG(e, who).find(x => x.d === s.d); if (!l) return;
    const k = e.id + (who === 'b' ? 'b' : '');
    drafts[k] = { kg: l.kg, s: l.s, r: l.r, x: (l.x || []).map(o => ({ kg: o.kg, r: o.r })) }; touched[k] = true;
  });
  workCtx = { d: s.d, who, day: day.id, resumed: !!resume }; S.active = day.id;
  S.run = resume ? { at: Date.now(), base: s.dur || 0 } : null;
  view = 'treino'; histMsg = ''; justSaved = '';
}
function cancelEdit() { if (workCtx && workCtx.resumed) S.run = null; workCtx = null; clearDrafts(); }

/* janela no meio da tela: "Encerrar o treino?" */
function renderAsk() {
  const el = document.getElementById('ask'); if (!el) return;
  if (!askEnd) { el.innerHTML = ''; return; }
  const run = !!S.run, ed = !!workCtx;
  const ttl = run ? 'Encerrar o treino?' : ed ? 'Salvar as alterações?' : 'Salvar o treino?';
  const txt = (run ? 'O cronômetro vai parar em <b>' + clock(runElapsed()) + '</b>. O treino ' : 'O treino ') + 'será salvo no histórico e no calendário, e as cargas voltam a zero.';
  el.innerHTML = `<div class="askw"><div class="askb" role="alertdialog" aria-modal="true" aria-labelledby="askt"><h3 id="askt">${ttl}</h3><p>${txt}</p><div class="askr"><button class="lnk" data-act="askno">${run ? 'Continuar treinando' : 'Voltar'}</button><button class="save off" data-act="askyes">${run ? 'Sim, encerrar' : 'Sim, salvar'}</button></div></div></div>`;
}
