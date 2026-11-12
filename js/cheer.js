/* Mensagem carinhosa ao encerrar o treino: analisa recordes, treino completo, volume e meta da semana. */

/* No texto: {a|b} escolhe a forma pelo tratamento (a = ele, b = ela); {nome} é trocado pelos dados do treino. */
const PET = {
  m: ['BOAAAAA', 'MONSTRO SAGRADO', 'CHEFÃO', 'FELA DA PULTA', 'GIGANTE', 'PALMEIRAS', 'CABULOSO' ],
  f: ['GOSTOSAA','CARALHOOO', 'EXPLODEEEE', 'SHEYPADAAAA', 'DELICINHA', 'GATA DO CARALHO', 'VSF VC É SINISTRA' , 'FELA DA PULTA' , 'LARGATIXA' ],
};

const CHEER = {
  record: {
    emoji: ['🏆', '🥇', '🚀', '👑'],
    title: ['Novo recorde!', 'Você se superou!', 'Marca nova no caderno!', 'Recorde quebrado!', 'Que evolução!'],
    open: ['Parabéns, {pet}!', 'Uau, {pet}!', 'Arrasou, {pet}!', 'Que orgulho de você, {pet}!', 'Brilhou hoje, {pet}!', 'Meu coração até acelerou, {pet}!', 'Isso foi lindo de ver, {pet}!', 'Olha só quem tá voando, {pet}!', 'Que treino, {pet}!', 'Eu sabia que vinha coisa boa, {pet}!'],
    body: ['Seu treino foi excelente e você quebrou seu recorde em {rec}.', 'Recorde novinho em {rec}. Isso é evolução de verdade!', 'Em {rec} você nunca tinha ido tão longe. Marca esse dia!', 'Você bateu a sua própria marca em {rec}. Ninguém te segura!', 'O seu recorde em {rec} acabou de cair. Que força!', 'Você superou a si {mesmo|mesma} em {rec}.', 'Treino excelente! E ainda deixou o recorde de {rec} para trás.', 'Mais forte do que nunca em {rec}. Que orgulho!', 'Cada treino conta, e hoje {rec} contou em dobro.'],
    close: ['Você merece uma preciosa.', 'Dá orgulho ver tanta dedicação.', 'Descansa bem, o corpo agradece.', 'Continue assim, papai ta cheio de orgulho de vc.', 'Isso é fruto de constância, e você tem de sobra.', 'Hoje você foi incrível.', 'Estou torcendo muito por você.', 'Bora para o próximo recorde?']
  },
  great: {
    emoji: ['💪', '🌟', '🔥', '✨'],
    title: ['Treino completo!', 'Missão cumprida!', 'Mandou muito bem!', 'Treino nota 10!', 'Que dedicação!'],
    open: ['Parabéns, {pet}!', 'Que treino bonito, {pet}!', 'Missão cumprida, {pet}!', 'Mandou muito bem, {pet}!', 'Orgulho define, {pet}!', 'Foi {inteiro|inteira} hoje, {pet}!', 'Show de bola, {pet}!', 'Aí sim, {pet}!'],
    body: ['Você fez todos os {tot} exercícios sem pular nenhum.', 'Treino completo de {dia}: {done} de {tot} exercícios feitos.', 'Nenhum exercício ficou para trás hoje. Que disciplina!', 'Você terminou o treino todo, do começo ao fim.', 'Foi um treino excelente, {pet}, e dá para ver o capricho.', 'Não deixou nada pela metade. Isso é compromisso.', 'Treino {caprichado|caprichada} do começo ao fim.'],
    close: ['Dá orgulho de você.', 'Agora descansa e se hidrata, você merece.', 'Constância é isso aí.', 'Seu corpo vai agradecer.', 'Que energia boa!', 'Amanhã a gente continua, mas hoje você venceu.', 'Dá muito orgulho de você.']
  },
  good: {
    emoji: ['👏', '😊', '🌈', '💛'],
    title: ['Bom treino!', 'Foi bem!', 'Mais um dia vencido!', 'Treino feito!'],
    open: ['Muito bem, {pet}!', 'Gostei, {pet}!', 'Boa, {pet}!', 'Mais um dia vencido, {pet}!', 'Tá no ritmo, {pet}!', 'Que bom te ver firme, {pet}!'],
    body: ['Você fez {done} de {tot} exercícios, e isso já é muito.', 'Foram {done} exercícios hoje. Cada série conta!', 'Treino bom, com {done} dos {tot} exercícios feitos.', 'Você veio e entregou. Isso é o que importa.', 'Quase tudo feito hoje. Amanhã fecha o que faltou.'],
    close: ['Constância vale mais que perfeição.', 'Você está no caminho certo.', 'Descansa que você mereceu.', 'Um treino de cada vez, e você chega longe.', 'Dá orgulho de você, de verdade.']
  },
  low: {
    emoji: ['🌱', '🤍', '☀️', '🫶'],
    title: ['Era melhor nem ter vindo cacete!', 'Preguiça do carai em', 'PELO AMOR DE DEUS', 'VAI SE EXPLODIR'],
    open: ['Ei, {pet}.', 'Tá tudo bem, {pet}.', 'Respira, {pet}.', 'Escuta aqui, {pet}.', 'Vem cá, {pet}.', 'Sabe de uma coisa, {pet}?'],
    body: ['Hoje não foi o treino mais forte, mas você apareceu, e isso é a parte mais difícil.', 'Hoje saíram {done} de {tot} exercícios. Alguns dias são assim, e tudo bem.', 'Treino curtinho hoje, e sem problema nenhum. O que vale é não desistir.', 'Nem todo dia é dia de bater recorde, e o descanso também faz parte.', 'Ficou faltando um pouco, mas amanhã você tem outra chance de arrasar.', 'O corpo às vezes pede calma. Você escutou e ainda treinou. Isso é inteligência.', 'Dia difícil não apaga o seu esforço. Você continua evoluindo.'],
    close: ['Eu acredito em você.', 'Amanhã você volta ainda mais forte.', 'Estou aqui torcendo por você.', 'Bora de novo quando der, sem cobrança.', 'Você é mais forte do que pensa.', 'Descansa, come bem e recomeça com tudo.', 'Orgulho de você só por ter vindo.']
  }
};

/* frases extras, anexadas quando fazem sentido */
const CHEER_X = {
  goal: ['A meta da semana foi batida ({n}/{g})! 🎯', 'Meta da semana completa: {n} de {g} treinos! 🎯', 'Você fechou a meta da semana ({n}/{g}). Que constância!'],
  streak: ['E já são {s} semanas seguidas batendo a meta! 🔥', '{s} semanas seguidas na meta. Isso é hábito!'],
  up: ['Você levantou {pct}% mais volume do que no último treino.', 'Volume {pct}% maior que da última vez. Evolução!'],
  time: ['{dur} de dedicação hoje.', 'Foram {dur} de treino. Valeu cada minuto.'],
  more: ['E ainda teve recorde também em {more}!']
};

const cheerLast = {};
function cheerPick(arr, key) {
  let i = Math.floor(Math.random() * arr.length);
  if (arr.length > 1 && cheerLast[key] === i) i = (i + 1 + Math.floor(Math.random() * (arr.length - 1))) % arr.length;
  cheerLast[key] = i; return arr[i];
}
const joinPt = a => a.length < 2 ? (a[0] || '') : a.slice(0, -1).join(', ') + ' e ' + a[a.length - 1];

/* {a|b} escolhe pelo tratamento; {nome} vem dos dados */
function cheerFill(t, g, v) {
  return t.replace(/\{([^{}|]+)\|([^{}|]+)\}/g, (m, a, b) => g === 'f' ? b : a).replace(/\{(\w+)\}/g, (m, k) => v[k] != null ? v[k] : '');
}

/* Analisa o que a pessoa fez hoje nos treinos salvos. Chamada depois de gravar os registros. */
function cheerStats(pe, days, t) {
  const st = { done: 0, tot: 0, vol: 0, prev: 0, rec: [], marks: 0, dia: [] };
  days.forEach(day => {
    st.dia.push(day.name);
    const pastD = (SS(pe).filter(x => x.day === day.name && x.d < t).slice(-1)[0] || { items: [] });
    st.prev += pastD.items.reduce((a, i) => a + ev(i), 0);
    day.ex.forEach(e => {
      st.tot++;
      const L = LG(e, pe), cur = L.find(x => x.d === t);
      if (!cur) return;
      st.done++; st.vol += ev(cur);
      const rc = recordOf(cur, L.filter(x => x.d < t));
      if (rc) { st.rec.push(Object.assign({ n: e.name }, rc)); st.marks += recMarks(rc); }
    });
  });
  return st;
}

/* Monta a mensagem (título, emoji, texto, nível) para uma pessoa. */
function cheerBuild(pe, st, dur, force) {
  const g = (S.cfg[pe === 'b' ? 'g2' : 'g1'] || (pe === 'b' ? 'f' : 'm')) === 'f' ? 'f' : 'm';
  const pct = st.tot ? st.done / st.tot : 0, ratio = st.prev > 0 ? st.vol / st.prev : 1;
  let lvl = st.rec.length ? 'record' : pct >= 0.85 ? 'great' : (pct >= 0.6 && ratio >= 0.7) ? 'good' : 'low';
  if (force) lvl = force;
  const P = CHEER[lvl], k = pe + lvl;
  const recs = st.rec.slice(0, 2).map(recLabel);
  const v = { pet: cheerPick(PET[g], k + 'p'), rec: joinPt(recs), more: st.rec.length > 2 ? (st.rec.length - 2) + ' outro' + (st.rec.length > 3 ? 's' : '') + ' exercício' + (st.rec.length > 3 ? 's' : '') : '', done: st.done, tot: st.tot, dia: joinPt(st.dia.map(x => x.toLowerCase())) };
  const parts = [cheerPick(P.open, k + 'o') + ' ' + cheerPick(P.body, k + 'b'), cheerPick(P.close, k + 'c')];
  const g2 = goalInfo(pe), extra = [];
  if (lvl !== 'low') {
    if (st.rec.length > 2) extra.push(cheerFill(CHEER_X.more[0], g, v));
    if (g2.n === g2.g) { extra.push(cheerFill(cheerPick(CHEER_X.goal, k + 'g'), g, { n: g2.n, g: g2.g })); if (g2.streak > 1) extra.push(cheerFill(cheerPick(CHEER_X.streak, k + 's'), g, { s: g2.streak })); }
    if (st.prev > 0 && ratio >= 1.05 && !st.rec.length) extra.push(cheerFill(cheerPick(CHEER_X.up, k + 'u'), g, { pct: Math.round((ratio - 1) * 100) }));
  }
  if (dur >= 60) extra.push(cheerFill(cheerPick(CHEER_X.time, k + 't'), g, { dur: fmtDur(dur) }));
  const text = cheerFill(parts[0], g, v) + ' ' + cheerFill(parts[1], g, v);
  return { p: pe, lvl, emoji: cheerPick(P.emoji, k + 'e'), title: cheerPick(P.title, k + 'ti'), text, extra, st: { done: st.done, tot: st.tot, rec: st.marks || st.rec.length } };
}

/* Tela de comemoração */
function renderCheer() {
  const el = document.getElementById('ch'); if (!el) return;
  if (!cheer) { el.innerHTML = ''; return; }
  if (cheer.on) return; cheer.on = 1;
  const cards = cheer.list.map(m => `<div class="chc ${m.lvl}"><div class="che" aria-hidden="true">${m.emoji}</div>${cheer.list.length > 1 ? `<p class="chn">${esc(N(m.p))}</p>` : ''}<h3>${esc(m.title)}</h3><p class="cht">${esc(m.text)}</p>${m.extra.map(x => `<p class="chx">${esc(x)}</p>`).join('')}<div class="chs"><span>${m.st.done}/${m.st.tot} exercícios</span>${m.st.rec ? `<span>🏆 ${m.st.rec} recorde${m.st.rec > 1 ? 's' : ''}</span>` : ''}</div></div>`).join('');
  const confetti = cheer.list.some(m => m.lvl !== 'low') ? Array.from({ length: 26 }, (_, i) => `<i style="left:${Math.round(Math.random() * 100)}%;animation-delay:${(Math.random() * 1.2).toFixed(2)}s;animation-duration:${(2.4 + Math.random() * 1.8).toFixed(2)}s;background:${['var(--acc)', '#F2C14E', '#F25A7D', '#5ED0E6', '#7BD39A'][i % 5]}"></i>`).join('') : '';
  el.innerHTML = `<div class="chw" role="dialog" aria-modal="true"><div class="chf" aria-hidden="true">${confetti}</div><div class="chb">${cards}<button class="save" data-act="cheerx">Continuar</button></div></div>`;
}

/* exemplo na tela Estilo: mostra os quatro níveis para a pessoa 1 e 2 */
function cheerDemo() {
  const mk = (pe, lvl) => cheerBuild(pe, { done: lvl === 'low' ? 2 : 5, tot: 5, vol: 1000, prev: 900, rec: lvl === 'record' ? [{ n: 'Supino reto', kg: '42,5 kg', se: '' }] : [], dia: ['Peito'] }, 3600, lvl);
  const lv = ['record', 'great', 'good', 'low'], n = (cheerDemo.n = ((cheerDemo.n || 0) + 1) % 4);
  cheer = { list: [mk('a', lv[n]), mk('b', lv[n])] };
}
