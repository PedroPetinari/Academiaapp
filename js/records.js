/* Recordes de cada exercício: maior peso e melhor série (maior carga × repetições numa série). */
const setsOf = x => [{ kg: +x.kg || 0, r: +x.r || 0 }].concat((x.x || []).map(o => ({ kg: +o.kg || 0, r: +o.r || 0 })));
const setScore = o => o.kg > 0 ? o.kg * o.r : o.r;
const kgMax = x => Math.max.apply(null, setsOf(x).map(o => o.kg));
const bestSet = x => setsOf(x).reduce((m, o) => setScore(o) > setScore(m) ? o : m, { kg: 0, r: 0 });
const setTxt = o => o.kg > 0 ? o.r + '×' + fmt(o.kg) + ' kg' : o.r + ' reps';

/* Compara um registro com os anteriores do mesmo exercício.
   Devolve { kg } se bateu o maior peso e/ou { se } se bateu a melhor série; null se não bateu nada ou se não há histórico. */
function recordOf(cur, olds) {
  if (!olds || !olds.length) return null;
  const pk = Math.max.apply(null, olds.map(kgMax)), ps = Math.max.apply(null, olds.map(x => setScore(bestSet(x))));
  const bs = bestSet(cur), out = {};
  if (pk > 0 && kgMax(cur) > pk) out.kg = fmt(kgMax(cur)) + ' kg';
  /* se a melhor série é a mesma do maior peso, não repete a informação */
  if (ps > 0 && setScore(bs) > ps && !(out.kg && bs.kg === kgMax(cur))) out.se = setTxt(bs);
  return out.kg || out.se ? out : null;
}
const recMarks = r => (r.kg ? 1 : 0) + (r.se ? 1 : 0);
const recLabel = r => r.n + ' (' + [r.kg && 'carga ' + r.kg, r.se && 'melhor série ' + r.se].filter(Boolean).join(' e ') + ')';
