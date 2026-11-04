/* Temas de fundo, paletas claro/escuro e aplicação das configurações visuais. */
const HEX = /^#[0-9a-f]{6}$/i;
const rgba = (h, a) => { const n = parseInt(h.slice(1), 16); return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; };
const lum = h => { const n = parseInt(h.slice(1), 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; };
const mixHex = (a, b, t) => { const x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16); return '#' + [16, 8, 0].map(s => ('0' + Math.round(((x >> s) & 255) * (1 - t) + ((y >> s) & 255) * t).toString(16)).slice(-2)).join(''); };
/* ajusta uma cor sólida ao modo pedido (escuro/claro) mantendo o tom */
const tone = (h, dark) => dark ? (lum(h) < 0.45 ? h : mixHex(h, '#000000', 0.82)) : (lum(h) >= 0.45 ? h : mixHex(h, '#FFFFFF', 0.88));
const BGS = ['#F1F3EF', '#F4EDE1', '#F8E8EE', '#E6EEF7', '#EEE9F7', '#1C1F22', '#0F1A2E', '#0E2A1E'];
const bgUrls = {}, bgLoading = {};

/* Modo: "auto" segue o aparelho; "claro" e "escuro" valem para qualquer fundo. */
const sysDark = () => !!(window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
const wantDark = () => S.cfg.mode === 'dark' || (S.cfg.mode !== 'light' && sysDark());

/* d = paleta escura, l = paleta clara; fx/lfx = degradê de base de cada uma */
const THEMES = {
  belafera: { n: 'Bela e a Fera', fx: 'radial-gradient(120% 80% at 25% 0%,#34449C 0%,#161E58 48%,#090C24 100%)', lfx: 'radial-gradient(120% 80% at 25% 0%,#FFF4D6 0%,#DDE2F7 48%,#B9C3EE 100%)',
    d: { bg: '#0C1130', surface: '#18205C', ink: '#FFF4D6', mute: '#B7BEE6', line: '#2C3984', acc: '#F2C14E' },
    l: { bg: '#EEF0FB', surface: '#FFFFFF', ink: '#161B4D', mute: '#56609A', line: '#C4CAEA', acc: '#A3760F' } },
  oceano: { n: 'Oceano', fx: 'linear-gradient(170deg,#0A2233 0%,#0F4C6B 60%,#2A9DB5 125%)', lfx: 'linear-gradient(170deg,#EAF7FB 0%,#BFE3EE 60%,#8CCBDC 125%)',
    d: { bg: '#0A2233', surface: '#0F3347', ink: '#E9F6FA', mute: '#9CC3D0', line: '#1D566F', acc: '#5ED0E6' },
    l: { bg: '#E3F3F8', surface: '#FFFFFF', ink: '#0A2A3A', mute: '#4A7587', line: '#B6D8E3', acc: '#0F7F99' } },
  poente: { n: 'Pôr do sol', fx: 'linear-gradient(170deg,#2A1226 0%,#7A2E4D 50%,#F0884A 125%)', lfx: 'linear-gradient(170deg,#FFF3EA 0%,#F7CDBB 50%,#F2A58B 125%)',
    d: { bg: '#2A1226', surface: '#3B1A35', ink: '#FFF1E6', mute: '#E0B9B5', line: '#5A2A4E', acc: '#FFB36B' },
    l: { bg: '#FBEBE3', surface: '#FFFFFF', ink: '#3A1730', mute: '#8A5A62', line: '#EBCFC6', acc: '#C9532B' } },
  floresta: { n: 'Floresta', fx: 'linear-gradient(170deg,#0F2118 0%,#1E4A33 60%,#4B8B5E 125%)', lfx: 'linear-gradient(170deg,#F0F7F1 0%,#CBE3D1 60%,#9CC8AB 125%)',
    d: { bg: '#0F2118', surface: '#173626', ink: '#EAF4ED', mute: '#9DBBA8', line: '#27523A', acc: '#7BD39A' },
    l: { bg: '#E8F2EA', surface: '#FFFFFF', ink: '#10301F', mute: '#4E7A5E', line: '#BDD8C5', acc: '#2E8B57' } },
  noite: { n: 'Noite', fx: 'linear-gradient(170deg,#0B0D12 0%,#151A26 100%)', lfx: 'linear-gradient(170deg,#F1F4FA 0%,#D3DAEA 100%)',
    d: { bg: '#0B0D12', surface: '#151A24', ink: '#EEF1F6', mute: '#9AA3B2', line: '#232B3A', acc: '#7AA2FF' },
    l: { bg: '#EAEEF6', surface: '#FFFFFF', ink: '#10162B', mute: '#58627C', line: '#C8D0E2', acc: '#3F63D6' } }
};
const themeVars = k => THEMES[k][wantDark() ? 'd' : 'l'];

const artCache = {};
const artImg = k => 'url("data:image/svg+xml,' + (artCache[k] = artCache[k] || encodeURIComponent(ART[k]())) + '") center bottom/cover no-repeat';
const artLayer = (k, dark) => (dark
  ? 'linear-gradient(180deg,rgba(0,0,0,.28),rgba(0,0,0,0) 35%,rgba(0,0,0,.32))'
  : 'linear-gradient(180deg,rgba(255,255,255,.82),rgba(255,255,255,.66))') + ',' + artImg(k);

function paletteFor(h) {
  return lum(h) < 0.45
    ? { '--bg': h, '--surface': 'color-mix(in srgb, ' + h + ' 88%, #fff)', '--ink': '#EAF0EC', '--mute': '#9AA6A0', '--line': 'color-mix(in srgb, ' + h + ' 78%, #fff)' }
    : { '--bg': h, '--surface': '#FFFFFF', '--ink': '#17201C', '--mute': '#5E6B64', '--line': 'color-mix(in srgb, ' + h + ' 86%, #000)' };
}
async function loadBg(id) {
  if (!id || bgLoading[id]) return; bgLoading[id] = 1;
  try { const rec = await tx('readonly', s => s.get(id), 'bg'); if (rec && rec.blob) { bgUrls[id] = URL.createObjectURL(rec.blob); applyCfg(); if (view === 'estilo') softRender(); } } catch (e) {}
}

/* Aplica fundo + emblema e devolve { vars, dark, acc } para o applyCfg. */
function applyBg() {
  const c = S.cfg, r = document.documentElement, el = document.getElementById('bgfx'), em = document.getElementById('bgemb');
  ['--bg', '--surface', '--ink', '--mute', '--line'].forEach(k => r.style.removeProperty(k));
  const dk = wantDark();
  let vars = null, layer = '', dark = dk, acc = '';
  if (c.bgType === 'solid' && HEX.test(c.bgVal || '')) {
    const h = c.mode === 'auto' ? c.bgVal : tone(c.bgVal, dk);
    vars = paletteFor(h); dark = lum(h) < 0.45;
  } else if (c.bgType === 'theme' && THEMES[c.bgVal]) {
    const T = THEMES[c.bgVal], p = dk ? T.d : T.l;
    vars = { '--bg': p.bg, '--surface': rgba(p.surface, 0.88), '--ink': p.ink, '--mute': p.mute, '--line': p.line };
    layer = artLayer(c.bgVal, dk) + ',' + (dk ? T.fx : T.lfx);
    if (c.accT) acc = p.acc;
  } else if (c.bgType === 'photo') {
    dark = c.mode === 'auto' ? true : dk;
    vars = dark
      ? { '--bg': '#101412', '--surface': 'rgba(24,30,27,.92)', '--ink': '#EEF3F0', '--mute': '#A9B6AF', '--line': 'rgba(255,255,255,.14)' }
      : { '--bg': '#F4F6F3', '--surface': 'rgba(255,255,255,.92)', '--ink': '#17201C', '--mute': '#55625B', '--line': 'rgba(0,0,0,.14)' };
    const veil = dark ? 'linear-gradient(rgba(6,10,8,.64),rgba(6,10,8,.46))' : 'linear-gradient(rgba(255,255,255,.72),rgba(255,255,255,.56))';
    if (bgUrls[c.bgVal]) layer = veil + ',url(' + bgUrls[c.bgVal] + ') center top/cover no-repeat'; else loadBg(c.bgVal);
  }
  if (vars) Object.keys(vars).forEach(k => r.style.setProperty(k, vars[k]));
  el.style.background = layer;
  /* emblema: imagem própria (se houver) ou o escudo do tema */
  if (em) {
    let eb = '';
    if (!c.embOff) {
      if (c.embId) { if (bgUrls[c.embId]) eb = 'url(' + bgUrls[c.embId] + ')'; else loadBg(c.embId); }
      else if (c.bgType === 'theme' && THEMES[c.bgVal]) eb = 'url("' + embUrl(c.bgVal) + '")';
    }
    em.style.backgroundImage = eb;
    r.style.setProperty('--emb', eb || 'none'); if (eb) r.dataset.emb = '1'; else delete r.dataset.emb;
  }
  return { vars, dark, acc };
}

/* miniatura do botão de tema (Estilo): degradê + emblema */
function thumbBg(k) { return 'url("' + embUrl(k) + '") right 12px center/auto 80% no-repeat,' + (wantDark() ? THEMES[k].fx : THEMES[k].lfx); }

function applyCfg() {
  const c = S.cfg, r = document.documentElement;
  const bg = applyBg();
  let acc = bg.acc || c.acc;
  if (!bg.acc && bg.dark && String(acc).toLowerCase() === DEF.acc.toLowerCase()) acc = '#3CC5A0';
  const n = parseInt(acc.slice(1), 16), L = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  r.style.setProperty('--acc', acc);
  r.style.setProperty('--acc-ink', L > 0.6 ? '#0B1511' : '#FFFFFF');
  r.style.setProperty('--soft', 'color-mix(in srgb, ' + acc + ' 16%, var(--surface))');
  if (bg.vars) r.setAttribute('data-theme', bg.dark ? 'dark' : 'light'); else if (c.mode === 'auto') r.removeAttribute('data-theme'); else r.setAttribute('data-theme', c.mode);
  r.dataset.font = c.font || 'cond'; r.dataset.lay = 'cards'; r.dataset.den = 'cozy';
  document.getElementById('appn').textContent = c.name || 'AppGym';
  document.title = c.name || 'AppGym';
  document.getElementById('foot').textContent = sbOn() ? 'Sincronizado com a nuvem pelo código. Treinos e fotos são compartilhados.' : 'Os registros ficam salvos neste navegador. Para usar em dois aparelhos, ative a sincronização em Estilo.';
}

/* o emblema próprio (imagem) ainda é usado pelo tema atual ou por algum tema salvo? */
const embUsed = id => S.cfg.embId === id || (S.cfg.saved || []).some(t => t.embId === id);

/* uma foto de fundo ainda é usada pelo fundo atual, por um tema com foto ou por um tema salvo? */
const bgUsed = id => S.cfg.bgVal === id || (S.cfg.pt || []).some(t => t.id === id) || (S.cfg.saved || []).some(t => t.bgVal === id);
