/* Telas: treino, calendário, histórico, fotos e estilo. */
function whoSeg() { return `<div class="sg who">${['a', 'b'].map(v => `<button class="${who === v ? 'on' : ''}" data-act="who" data-v="${v}">${esc(N(v))}</button>`).join('')}</div>`; }

function editForm(e, chk) {
  const m = /^\s*(\d+)\s*[x×]\s*(.*)$/.exec(e.t || '');
  const s = chk ? '' : (m ? m[1] : ''), r = chk ? (e.t || '') : (m ? m[2] : (e.t || ''));
  return `<div class="ed"><label class="full1">Nome do exercício<input id="en" value="${esc(e.name)}" maxlength="60"></label>
    ${chk ? '' : `<label>Séries<input id="es" inputmode="numeric" value="${esc(s)}" maxlength="3"></label>`}
    <label class="${chk ? 'full1' : ''}">${chk ? 'Detalhe (tempo ou repetições)' : 'Repetições (ex.: 8-12)'}<input id="er" value="${esc(r)}" maxlength="24"></label>
    <div class="full1 btns"><button class="save" data-act="saveex">Salvar</button><button class="lnk" data-act="cancelex">Cancelar</button></div></div>`;
}
function row(e) {
  const t = curDate(), ed = editEx === e.id;
  const tools = `<div class="acts2"><button class="lnk" data-act="editex">Editar</button><button class="lnk ${conf === e.id ? 'sure' : ''}" data-act="delex">${conf === e.id ? 'Confirmar remoção' : 'Remover'}</button></div>`;
  if (S.cur.check) {
    if (ed) return `<div class="ex" data-id="${e.id}">${editForm(e, true)}</div>`;
    return `<div class="ex" data-id="${e.id}"><div class="chk"><input type="checkbox" aria-label="${esc(e.name)}" data-act="chk" ${e.on === t ? 'checked' : ''}><span>${esc(e.name)}</span><span class="tg">${esc(e.t)}</span></div>${tools}</div>`;
  }
  const pp = p => {
    const L = LG(e, p), last = L[L.length - 1], pr = L.reduce((m, x) => Math.max(m, x.kg), 0);
    const dr = draft(e, p), has = L.some(x => x.d === t);
    const hist = L.slice(-6).reverse().map(x => `<li><span>${fd(x.d)} · ${fxs(x)} · ${fmt(ev(x))} kg de volume</span><button class="lnk" data-act="dellog" data-p="${p}" data-d="${x.d}" aria-label="Apagar registro">Apagar</button></li>`).join('');
    const xs = (dr.x || []).map((o, i) => `<div class="xs"><span>Série ${(+dr.s || 0) + i + 1}</span><label>Carga (kg)<input inputmode="decimal" data-f="xkg" data-i="${i}" data-p="${p}" value="${esc(o.kg)}"></label><label>Reps<input inputmode="numeric" data-f="xr" data-i="${i}" data-p="${p}" value="${esc(o.r)}"></label><button class="lnk" data-act="delset" data-p="${p}" data-i="${i}" aria-label="Remover série">✕</button></div>`).join('');
    return `<div class="pp"><div class="pn"><b>${esc(N(p))}</b><span>Volume <i data-vol>${vol(dr)} kg</i></span></div>
      <div class="ins">
        <label>Carga (kg)<input inputmode="decimal" data-f="kg" data-p="${p}" value="${esc(dr.kg)}"></label>
        <label>Séries<input inputmode="numeric" data-f="s" data-p="${p}" value="${esc(dr.s)}"></label>
        <label>Reps<input inputmode="numeric" data-f="r" data-p="${p}" value="${esc(dr.r)}"></label>
        <button class="save" data-act="save" data-p="${p}">${has ? 'Atualizar' : 'Salvar'}</button>
      </div>${xs}<button class="lnk addset" data-act="addset" data-p="${p}">+ série</button>
      <p class="meta">${last ? `Última: ${fxs(last)} · ${fd(last.d)}` : 'Sem registros ainda'}${pr ? ` · <span class="pr">Recorde: ${fmt(pr)} kg</span>` : ''}</p>${sugBox(e, p, L)}
      ${L.length ? `<details><summary>Histórico</summary><ul>${hist}</ul></details>` : ''}</div>`;
  };
  return `<article class="ex" data-id="${e.id}">
    ${ed ? editForm(e, false) : `<div class="top"><h3>${esc(e.name)}</h3><span class="tg">${esc(e.t)}</span></div>${pp('a')}${pp('b')}${tools}`}
  </article>`;
}

function render() {
  applyCfg(); renderBar(); renderOv(); renderCheer(); renderAsk(); rtShow(); runDraw();
  const tb = document.getElementById('tabs'), nd = document.getElementById('newday');
  tb.hidden = nd.hidden = view !== 'treino';
  if (view !== 'treino') { document.getElementById('main').innerHTML = view === 'cal' ? viewCal() : view === 'corpo' ? viewBody() : view === 'hist' ? viewHist() : view === 'fotos' ? viewPhotos() : viewStyle(); document.querySelectorAll('[data-bg]').forEach(b => { b.style.background = b.dataset.bg; }); document.querySelectorAll('[data-th]').forEach(b => { const k = b.dataset.th, dk = wantDark(); b.style.background = thumbBg(k); b.style.color = dk ? '#fff' : THEMES[k].l.ink; b.style.textShadow = dk ? '' : 'none'; }); document.querySelectorAll('[data-ph]').forEach(b => { const u = bgUrls[b.dataset.ph]; if (u) b.style.background = 'url(' + u + ') center top/cover'; else loadBg(b.dataset.ph); }); return; }
  const t = curDate();
  let day = S.days.find(d => d.id === S.active) || S.days[0];
  S.active = day ? day.id : null;
  S.cur = day || {};
  const tv = q => S.days.filter(d => !d.check).reduce((a, d) => a + dayVol(d, t, q), 0);
  document.getElementById('today').innerHTML = `Volume de hoje<br>${esc(N('a'))} <b>${fmt(tv('a'))}</b> kg<br>${esc(N('b'))} <b>${fmt(tv('b'))}</b> kg`;
  document.getElementById('tabs').innerHTML = S.days.map(d => `<button class="st ${day && d.id === day.id ? 'on' : ''} ${did(d, t) ? 'dn' : ''}" data-act="tab" data-id="${d.id}"><span class="rg"><span class="in">${esc(d.name.slice(0, 2))}</span></span><em>${esc(d.name)}</em></button>`).join('') + `<button class="st" data-act="newday"><span class="rg"><span class="in">+</span></span><em>Treino</em></button>`;
  { const tb2 = document.getElementById('tabs'), on = tb2.querySelector('.st.on'); if (on) tb2.scrollLeft = on.offsetLeft - tb2.clientWidth / 2 + on.offsetWidth / 2; }
  document.getElementById('newday').innerHTML = showNew ? `<div class="newday"><input id="ndn" placeholder="Nome do treino (ex.: Costas 2)" maxlength="40"><button class="save" data-act="mkday">Criar treino</button><button class="lnk" data-act="cancelday">Cancelar</button></div>` : '';
  const main = document.getElementById('main');
  if (!day) { main.innerHTML = '<p class="empty">Nenhum treino ainda. Toque em “+ Treino” para criar o primeiro.</p>'; return; }
  const nt = notice; notice = '';
  const dv = day.check ? '' : `<p class="dv">Volume de hoje neste treino: ${esc(N('a'))} ${fmt(dayVol(day, t, 'a'))} kg · ${esc(N('b'))} ${fmt(dayVol(day, t, 'b'))} kg</p>`;
  const eb = workCtx ? `<div class="editbar"><span>${workCtx.resumed ? '▶ Retomando' : '✏️ Editando'}: <b>${esc(day.name)}</b> · ${fd(workCtx.d)} · ${esc(N(workCtx.who))}</span><button class="lnk" data-act="editcancel">Cancelar</button></div>` : '';
  main.innerHTML = `${eb}<div class="dayhead"><h2>${esc(day.name)}</h2><button class="lnk ${conf === day.id ? 'sure' : ''}" data-act="delday">${conf === day.id ? 'Confirmar remoção do treino' : 'Remover treino'}</button></div>${dv}
  ${day.ex.length ? day.ex.map(row).join('') : '<p class="empty">Este treino está vazio. Adicione um exercício abaixo.</p>'}
  ${day.check ? '' : `${nt ? `<p class="notice" role="status">${nt}</p>` : ''}<button class="save wide fin" data-act="finish">${S.run ? 'Encerrar treino' : workCtx ? 'Salvar alterações' : 'Salvar treino'}</button>`}
  <div class="add-ex"><input id="nn" placeholder="${day.check ? 'Novo item' : 'Novo exercício'}" maxlength="60"><input id="nt" placeholder="${day.check ? 'Tempo ou reps' : 'Ex.: 3×10'}" maxlength="24"><button data-act="addex">Adicionar</button></div>`;
}

function renderBar() {
  document.getElementById('bar').innerHTML = [['treino', '🏋️', 'Treino'], ['hist', '📖', 'Histórico'], ['cal', '📅', 'Calendário'], ['corpo', '📏', 'Corpo'], ['fotos', '📷', 'Fotos'], ['estilo', '🎨', 'Estilo']]
    .map(([v, i, l]) => `<button class="${view === v ? 'on' : ''}" data-act="nav" data-v="${v}"><span>${i}</span>${l}</button>`).join('');
}

function viewCal() {
  const y = cm.getFullYear(), m = cm.getMonth(), first = new Date(y, m, 1).getDay(), n = new Date(y, m + 1, 0).getDate();
  const p = y + '-' + String(m + 1).padStart(2, '0') + '-', t = todayStr();
  let cells = '<i></i>'.repeat(first);
  for (let d = 1; d <= n; d++) {
    const k = p + String(d).padStart(2, '0');
    cells += `<button class="cd ${MK(who)[k] ? 'on' : ''} ${Object.values(others).some(o => (o.marks || {})[k]) ? 'pm' : ''} ${k === t ? 'td' : ''} ${k === sel ? 'sl' : ''}" data-act="seld" data-d="${k}" aria-label="Dia ${d}">${d}</button>`;
  }
  const mc = Object.keys(MK(who)).filter(k => k.startsWith(p)).length, tot = Object.keys(MK(who)).length;
  const li = S.days.filter(d => !d.check).flatMap(d => d.ex.flatMap(e => LG(e, who).filter(x => x.d === sel).map(x => `<li><span>${esc(e.name)}</span><span>${fxs(x)}</span></li>`))).join('');
  const lo = Object.keys(others).flatMap(u => S.days.filter(d => !d.check).flatMap(d => d.ex.flatMap(e => ((others[u].logs || {})[e.id] || []).filter(x => x.d === sel).map(x => `<li><span>${esc(names[u] || 'Parceiro(a)')} · ${esc(e.name)}</span><span>${fxs(x)}</span></li>`)))).join('');
  const dr = SS(who).filter(x => x.d === sel && x.dur).map(x => `<li><span>⏱ Tempo de treino · ${esc(x.day)}</span><span>${fmtDur(x.dur)}</span></li>`).join('');
  return `<div class="dayhead"><h2>Calendário</h2></div>${whoSeg()}${goalHtml()}
  <p class="dv">${mc} treino${mc === 1 ? '' : 's'} neste mês · ${tot} no total${Object.keys(others).length ? ' · ponto dourado: o outro treinou' : ''}</p>
  <div class="cal"><div class="cn"><button class="lnk" data-act="prevm" aria-label="Mês anterior">‹</button><b>${cm.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</b><button class="lnk" data-act="nextm" aria-label="Próximo mês">›</button></div>
  <div class="cg">${'DSTQQSS'.split('').map(c => `<span>${c}</span>`).join('')}${cells}</div></div>
  <div class="sel"><b>${fd(sel)}</b><button class="save ${MK(who)[sel] ? 'off' : ''}" data-act="mark">${MK(who)[sel] ? 'Desmarcar presença' : 'Marcar presença'}</button></div>
  <ul class="ll">${(dr + li + lo) || '<li><span>Nenhum exercício registrado neste dia.</span></li>'}</ul>`;
}

function viewPhotos() {
  const head = `<div class="prof"><span class="rg big"><span class="in">${esc((S.cfg.name || 'AG').slice(0, 2))}</span></span><div class="stats"><div><b>${Object.keys(S.marks).length}</b>treinos</div><div><b>${photos ? photos.length : 0}</b>fotos</div></div></div><button class="save wide" data-act="addph">+ Adicionar fotos</button>`;
  if (!photos) return head + photoHint() + '<p class="empty">Fotos indisponíveis neste navegador.</p>';
  if (!photos.length) return head + photoHint() + '<p class="empty">Nenhuma foto ainda. Adicione as fotos do treino de vocês.</p>';
  return head + photoHint() + `<div class="grid">${photos.map(p => `<button data-act="openp" data-id="${p.id}" aria-label="Abrir foto"><img src="${url(p)}" alt="${esc(p.cap || 'Foto do treino')}"></button>`).join('')}</div>`;
}

function renderOv() {
  const o = document.getElementById('ov'), p = openP && photos && photos.find(x => x.id === openP);
  if (!p) { o.innerHTML = ''; return; }
  const c = conf === 'p' + p.id;
  o.innerHTML = `<div class="vw"><div class="vt"><button class="lnk" data-act="closep">Fechar</button><span>${fd(p.d)}</span><button class="lnk ${c ? 'sure' : ''}" data-act="delp">${c ? 'Confirmar exclusão' : 'Excluir'}</button></div><img src="${url(p)}" alt=""><input id="cap" placeholder="Escreva uma legenda" maxlength="120" value="${esc(p.cap || '')}"></div>`;
}

const seg = (k, o) => `<div class="sg">${o.map(([v, l]) => `<button class="${S.cfg[k] === v ? 'on' : ''}" data-act="cfg" data-k="${k}" data-v="${v}">${l}</button>`).join('')}</div>`;
function viewStyle() {
  const c = S.cfg;
  return `<div class="dayhead"><h2>Estilo</h2></div><p class="dv">Deixe o app com a cara de vocês.</p>
  <div class="set"><label>Nome do app<input id="cname" value="${esc(c.name)}" maxlength="20"></label>
  <div class="row"><span>Cor de destaque</span><div class="sw">${['#0B7A5F', '#2F5BEA', '#D6336C', '#E8590C', '#7048E8', '#C92A2A'].map(x => `<button class="${c.acc.toLowerCase() === x.toLowerCase() ? 'on' : ''}" data-act="acc" data-c="${x}" aria-label="Cor ${x}" data-bg="${x}"></button>`).join('')}<input type="color" id="ccol" value="${c.acc}" aria-label="Cor personalizada"></div></div>
  <div class="row"><span>Aparência</span>${seg('mode', [['auto', 'Automático'], ['light', 'Claro'], ['dark', 'Escuro']])}</div>
  <div class="row col"><span>Cor de fundo</span><div class="sw">${BGS.map(x => `<button class="${c.bgType === 'solid' && (c.bgVal || '').toLowerCase() === x.toLowerCase() ? 'on' : ''}" data-act="bgsolid" data-c="${x}" aria-label="Fundo ${x}" style="background:${x}"></button>`).join('')}<input type="color" id="cbg" value="${/^#[0-9a-f]{6}$/i.test(c.bgVal || '') ? c.bgVal : '#F1F3EF'}" aria-label="Cor de fundo personalizada"></div></div>
  <div class="row col"><span>Temas de fundo</span><div class="tm">${Object.keys(THEMES).map(k => `<button class="th ${c.bgType === 'theme' && c.bgVal === k ? 'on' : ''}" data-act="theme" data-k="${k}" data-th="${k}">${esc(THEMES[k].n)}</button>`).join('')}</div></div>
  <div class="row col"><span>Temas com foto</span><p class="dv">Escolha uma foto da galeria para cada tema. Ela fica só neste aparelho.</p><div class="tp">${(c.pt || []).map((t, i) => `<div class="pc"><button class="pth ${c.bgType === 'photo' && t.id && c.bgVal === t.id ? 'on' : ''}" data-act="${t.id ? 'ptuse' : 'ptpick'}" data-i="${i}" ${t.id ? `data-ph="${t.id}"` : ''} aria-label="${esc(t.n)}">${t.id ? '' : '＋ Foto'}</button><input class="ptn" id="ptn${i}" value="${esc(t.n)}" maxlength="18" aria-label="Nome do tema"><button class="lnk" data-act="ptpick" data-i="${i}">${t.id ? 'Trocar foto' : 'Escolher foto'}</button></div>`).join('')}</div></div>
  <div class="row col"><span>Emblema do tema</span><div class="btnrow"><button class="save" data-act="embpick">Usar minha imagem</button>${c.embId ? '<button class="lnk" data-act="embdef">Voltar ao emblema do tema</button>' : ''}<button class="lnk" data-act="embtog">${c.embOff ? 'Mostrar emblema' : 'Ocultar emblema'}</button></div></div>
  <div class="row col"><span>Foto de fundo (da sua galeria)</span><div class="btnrow"><button class="save" data-act="bgphoto">Escolher foto</button><button class="lnk" data-act="bgoff">Voltar ao fundo padrão</button></div></div>
  <div class="row col"><span>Meus temas salvos</span><div class="chips">${(c.saved || []).map((t, i) => `<span class="chip"><button data-act="applytheme" data-i="${i}">${esc(t.n)}</button><button data-act="deltheme" data-i="${i}" aria-label="Apagar tema">✕</button></span>`).join('') || '<span class="dv">Nenhum ainda.</span>'}</div><div class="btnrow"><input id="tname" placeholder="Nome do tema" maxlength="20"><button class="save" data-act="savetheme">Salvar tema atual</button></div></div>
  <div class="row"><span>Fonte</span>${seg('font', [['cond', 'Condensada'], ['mod', 'Moderna'], ['serif', 'Clássica']])}</div>
  <div class="row"><label style="flex:1">Nome da pessoa 1<input id="cn1" value="${esc(c.n1)}" maxlength="14"></label><label style="flex:1">Nome da pessoa 2<input id="cn2" value="${esc(c.n2)}" maxlength="14"></label></div>
  <div class="row"><button class="save" data-act="notif">Ativar Notificações</button><span class="dv">${notifState()}</span></div>
  <div class="row"><span>Descanso automático</span>${seg('rest', [['0', 'Off'], ['60', '60s'], ['90', '90s'], ['120', '120s']])}</div>
  <div class="row"><span>Meta semanal</span>${seg('goal', [['3', '3×'], ['4', '4×'], ['5', '5×'], ['6', '6×']])}</div>
  <div class="row"><label style="flex:1">Código (sincronização)<span class="pw"><input id="ccode" type="password" value="${esc(c.code || '')}" placeholder="Digite o código" autocapitalize="off" autocomplete="new-password"><button class="eye" data-act="eye" aria-label="Mostrar ou ocultar o código">👁</button></span></label></div>
  <p class="dv" id="cmsg">${cloudMsg()}</p>
  <div class="row"><button class="save" data-act="sync">Sincronizar agora</button><button class="save" data-act="export">Exportar backup</button><button class="save" data-act="import">Importar backup</button></div>
  <p class="dv">${dataMsg}</p>
  <button class="lnk" data-act="reset">Restaurar padrão</button></div>`;
}

function viewHist() {
  const all = SS(who), ss = all.slice().reverse();
  const head = `<div class="dayhead"><h2>Histórico</h2></div>${whoSeg()}<p class="dv">${ss.length} treino${ss.length === 1 ? '' : 's'} salvo${ss.length === 1 ? '' : 's'}</p>${histMsg ? `<p class="notice" role="status">${esc(histMsg)}</p>` : ''}`;
  if (!ss.length) return head + '<p class="empty">Nada salvo ainda. Faça um treino e toque em “Salvar treino”.</p>';
  return head + ss.map(x => {
    const vol = x.items.reduce((a, i) => a + ev(i), 0);
    const prev = all.filter(y => y.day === x.day && y.d < x.d).pop();
    const pv = prev ? prev.items.reduce((a, i) => a + ev(i), 0) : 0;
    const dl = prev && pv > 0 ? ` · <span class="dl">${vol >= pv ? '+' : '−'}${fmt(Math.abs(vol - pv))} kg vs. anterior</span>` : '';
    const dt = new Date(x.d + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
    const c = conf === 's' + x.id;
    const rcs = x.items.map(i => { const r = recordOf(i, all.filter(y => y.day === x.day && y.d < x.d).map(y => y.items.find(z => z.n === i.n)).filter(Boolean)); return r && Object.assign({ n: i.n }, r); }).filter(Boolean);
    return `<article class="ss"><div class="sh"><b>${esc(x.day)}</b><span>${x.id === justSaved ? 'Salvo agora' : fd(x.d)}</span></div>
      <p class="meta">${dt} · ${fmt(vol)} kg de volume${x.dur ? ' · ⏱ ' + fmtDur(x.dur) : ''}${dl}</p>
      ${rcs.length ? `<p class="rcl">🏆 Recordes: ${rcs.map(r => esc(recLabel(r))).join(' · ')}</p>` : ''}
      <ul class="ll">${x.items.map(i => `<li><span>${esc(i.n)}</span><span>${fxs(i)}</span></li>`).join('')}</ul>
      ${rxHtml(x)}
      <div class="acts2"><button class="lnk" data-act="hedit" data-sid="${x.id}">✏️ Editar</button><button class="lnk" data-act="hresume" data-sid="${x.id}">▶ Retomar</button><button class="lnk" data-act="copy" data-sid="${x.id}">${copied === x.id ? 'Copiado!' : 'Copiar resumo'}</button><a class="lnk" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(sumText(x))}">WhatsApp</a><button class="lnk ${c ? 'sure' : ''}" data-act="dels" data-sid="${x.id}">${c ? 'Confirmar exclusão' : 'Excluir do histórico'}</button></div></article>`;
  }).join('');
}

function softRender() {
  const a = document.activeElement;
  if (a && a.tagName === 'INPUT' && a.closest('#main, #ov')) pend = true; else render();
}
document.addEventListener('focusout', () => { if (pend) { pend = false; setTimeout(render, 700); } });
