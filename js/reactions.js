/* Reações (emoji e comentário) nos treinos do histórico, e avisos quando o outro reage. */
/* reações: emojis que a pessoa escolhe para reagir (é o único lugar do app que usa emoji) */
const RXE = ['\u{1F4AA}', '\u{1F525}', '\u{1F44F}', '\u2764\uFE0F', '\u{1F62E}', '\u{1F602}', '\u{1F64C}'];
/* reações feitas por palavra numa versão de teste voltam a ser emoji */
const RXBACK = { 'Forte': RXE[0], 'Mandou bem': RXE[1], 'Parabéns': RXE[2], 'Evolução': RXE[3], 'Uau': RXE[4] };
const rxName = e => RXBACK[e] || e;
let rxAs = '', toastT = null;
const rxBy = () => rxAs || (who === 'a' ? 'b' : 'a');   /* por padrão, quem reage é a outra pessoa */
const RXL = () => S.rx || (S.rx = []);
const rxList = (p, sid) => RXL().filter(x => x.k === p + sid).sort((a, b) => a.ts - b.ts);

/* cada pessoa tem uma reação por treino: um emoji e/ou um comentário. Vazio = apaga (com lápide). */
function rxSet(p, sid, by, patch) {
  const k = p + sid, id = k + '>' + by, old = RXL().find(x => x.id === id);
  const n = Object.assign({ id, k, by, e: '', c: '' }, old || {}, patch, { ts: Date.now() });
  const a = RXL().filter(x => x.id !== id);
  if (n.e || n.c) a.push(n); else if (old) S.tomb['x' + id] = Date.now();
  S.rx = a;
}

function rxHtml(x, p) {
  p = p || who;
  const by = rxBy(), mine = rxList(p, x.id).find(r => r.by === by) || { e: '', c: '' }, me = rxName(mine.e);
  const list = rxList(p, x.id).map(r => {
    const mineR = r.by === by, acts = mineR ? `<span class="lpa" hidden>${r.e ? `<button data-lpa data-lpl="Apagar reação" data-lpd data-act="rxdele" data-p="${p}" data-sid="${x.id}" data-by="${r.by}"></button>` : ''}${r.c ? `<button data-lpa data-lpl="Apagar comentário" data-lpd data-act="rxdelc" data-p="${p}" data-sid="${x.id}" data-by="${r.by}"></button>` : ''}</span>` : '';
    return `<p class="rxi" ${mineR ? `data-lp data-lpid="rx${p}${x.id}${r.by}" data-lpt="${esc(N(r.by))}"` : ''}><b>${esc(N(r.by))}</b>${r.e ? ' <span class="rxe">' + esc(rxName(r.e)) + '</span>' : ''}${r.c ? ' ' + esc(r.c) : ''}${acts}</p>`;
  }).join('');
  return `<div class="rx">${list}${rxList(p, x.id).some(r => r.by === by) ? '<p class="lph">Segure o seu comentário ou reação para apagar.</p>' : ''}<div class="rxbar"><span>Reagir como</span>${['a', 'b'].map(v => `<button class="${by === v ? 'on' : ''}" data-act="rxas" data-v="${v}">${esc(N(v))}</button>`).join('')}</div>
    <div class="rxbar">${RXE.map(e => `<button class="rxb ${me === e ? 'on' : ''}" data-act="rxe" data-p="${p}" data-sid="${x.id}" data-e="${e}" aria-label="Reagir com ${e}">${e}</button>`).join('')}</div>
    <div class="rxc"><input class="rxin" data-sid="${x.id}" placeholder="Escreva um comentário" maxlength="140" value="${esc(mine.c)}" aria-label="Comentário"><button class="save" data-act="rxsend" data-p="${p}" data-sid="${x.id}">Enviar</button></div></div>`;
}

/* aviso na tela (e notificação do aparelho, se permitida) */
function toast(msg) {
  const el = document.getElementById('toast'); if (!el) return;
  el.textContent = msg; el.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { el.hidden = true; }, 7000);
}
function rxAlert(x) {
  const p = x.k[0], ph = p === 'F', s = ph ? null : SS(p).find(y => y.id === x.k.slice(1));
  const title = ph ? N(x.by) + ' reagiu a uma foto' : N(x.by) + ' reagiu ao treino' + (p !== x.by ? ' de ' + N(p) : '');
  const body = (ph ? 'Foto' : s ? s.day : 'Treino') + (x.e ? ' · ' + rxName(x.e) : '') + (x.c ? ': ' + x.c : '');
  toast(title + ' · ' + body);
  try {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && document.hidden) {
      const opt = { body, icon: 'icon-192.png', badge: 'icon-192.png', tag: 'rx' + x.id };
      navigator.serviceWorker.getRegistration().then(r => { if (r && r.showNotification) r.showNotification(title, opt); else new Notification(title, opt); }).catch(() => {});
    }
  } catch (e) {}
}
/* chamada depois de mesclar com a nuvem: avisa das reações novas que vieram do outro aparelho */
let rxSeen = 0;
try { rxSeen = +localStorage.getItem('appgym-rxseen') || 0; if (!rxSeen) { rxSeen = Date.now(); localStorage.setItem('appgym-rxseen', String(rxSeen)); } } catch (e) {}
function rxNotify(before) {
  const fresh = RXL().filter(x => (before.get(x.id) || 0) < x.ts && x.ts > rxSeen);
  if (!fresh.length) return;
  rxSeen = Math.max.apply(null, fresh.map(x => x.ts));
  try { localStorage.setItem('appgym-rxseen', String(rxSeen)); } catch (e) {}
  fresh.slice(-3).forEach(rxAlert);
}
const notifState = () => typeof Notification === 'undefined' ? 'Este navegador não permite avisos.' : Notification.permission === 'granted' ? 'Avisos ligados.' : Notification.permission === 'denied' ? 'Avisos bloqueados nas configurações do aparelho.' : 'Avisos desligados.';
