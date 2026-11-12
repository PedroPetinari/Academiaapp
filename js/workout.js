/* Regras de treino: registros por exercício, volume, sessões do histórico e presenças. */
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

const draft = (e, p) => {
  const k = e.id + (p === 'b' ? 'b' : '');
  if (!drafts[k]) {
    /* a carga só vem preenchida enquanto há treino em andamento e já houve registro hoje; fora disso começa zerada */
    const l = LG(e, p).slice(-1)[0], keep = !!(l && S.run && l.d === curDate());
    drafts[k] = l ? { kg: keep ? l.kg : '', s: l.s, r: l.r, x: (l.x || []).map(o => ({ kg: keep ? o.kg : '', r: o.r })) } : { kg: '', s: parseInt(e.t) || 3, r: firstRep(e.t), x: [] };
  }
  return drafts[k];
};
const vol = d => fmt((num(d.kg) || 0) * (num(d.s) || 0) * (num(d.r) || 0) + (d.x || []).reduce((a, o) => a + (num(o.kg) || 0) * (num(o.r) || 0), 0));
const ev = x => x.kg * x.s * x.r + (x.x || []).reduce((a, o) => a + o.kg * o.r, 0);
const fxs = x => fmt(x.kg) + ' kg · ' + x.s + '×' + x.r + (x.x || []).map(o => ' + ' + fmt(o.kg) + '×' + o.r).join('');
const dayVol = (day, t, p) => day.ex.reduce((a, e) => a + LG(e, p || 'a').filter(x => x.d === t).reduce((b, x) => b + ev(x), 0), 0);

function did(d, t) { return !d.check && d.ex.some(e => e.log.some(x => x.d === t) || (e.log2 || []).some(x => x.d === t)); }

function upsertSession(day, t, p) {
  p = p || 'a';
  const id = t + '|' + day.id;
  const items = day.ex.map(e => { const x = LG(e, p).find(y => y.d === t); return x ? { n: e.name, kg: x.kg, s: x.s, r: x.r, x: x.x || [] } : null; }).filter(Boolean);
  const old = SS(p).find(x => x.id === id);
  let a = SS(p).filter(x => x.id !== id);
  if (items.length) a.push(Object.assign({ id, d: t, day: day.name, items, ts: Date.now() }, old && old.dur ? { dur: old.dur } : {})); else if (old) S.tomb['s' + p + id] = Date.now();
  a.sort((x, y) => x.d < y.d ? -1 : 1); a = a.slice(-100);
  if (p === 'b') S.sessions2 = a; else S.sessions = a;
}

/* presenças do calendário: guardam a hora; ao desmarcar fica uma lápide para a nuvem não trazer o dia de volta */
function markOn(p, d) { MK(p)[d] = Date.now(); }
function markOff(p, d) { delete MK(p)[d]; S.tomb['m' + p + d] = Date.now(); }

/* tempo: relógio hh:mm:ss e duração curta (a duração é guardada em segundos) */
const clock = s => { s = Math.max(0, Math.floor(s)); return String(Math.floor(s / 3600)).padStart(2, '0') + ':' + String(Math.floor((s % 3600) / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
const fmtDur = s => { const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60); return h ? h + 'h' + String(m).padStart(2, '0') + 'min' : m ? m + ' min' : s + ' s'; };

/* Encerra o treino: grava o que foi preenchido, guarda o tempo, marca o calendário e zera as cargas.
   Devolve false se não havia nada para salvar (nesse caso nada muda). */
function finishWorkout() {
  const t = curDate(), dur = S.run ? Math.round((Date.now() - S.run.at) / 1000) : 0, got = [], wc = workCtx;
  let first = '';
  const msgs = [];
  ['a', 'b'].forEach(pe => {
    if (wc && pe !== wc.who) return;   /* editando um treino salvo: só a pessoa dele */
    let any = false; const saved = [];
    S.days.forEach(day => {
      if (day.check) return;
      let wrote = false;
      day.ex.forEach(e => { const k = e.id + (pe === 'b' ? 'b' : ''); if (drafts[k] && touched[k] && logIt(e, pe, drafts[k], t)) wrote = true; });
      /* conta o que foi salvo agora ou durante este treino (uma sessão antiga do mesmo dia não vale) */
      const before = SS(pe).find(x => x.id === t + '|' + day.id), fresh = !wc && !!before && (!S.run || (before.ts || 0) >= S.run.at);
      if (!wrote && !fresh) return;
      upsertSession(day, t, pe);
      const s = SS(pe).find(x => x.id === t + '|' + day.id);
      if (s) { if (dur) s.dur = (s.dur || 0) + dur; any = true; saved.push(day); if (!first) first = s.id; }
    });
    if (any) { markOn(pe, t); got.push(pe); try { msgs.push(cheerBuild(pe, cheerStats(pe, saved, t), dur)); } catch (e) {} }
  });
  if (!got.length) return false;
  S.run = null; clearDrafts(); workCtx = null;   /* cargas voltam a zero */
  cheer = msgs.length && !(wc && !wc.resumed) ? { list: msgs } : null;
  justSaved = first; who = got[0]; view = 'hist';
  return true;
}
