/* Emblemas dos temas: escudos originais desenhados por código (viewBox 200×240). */
const SHIELD = 'M22 20H178V118C178 176 142 210 100 230C58 210 22 176 22 118Z';
const GOLD = [[0, '#FFF0B0'], [0.5, '#E9B949'], [1, '#9A6A1A']];
const spark = (cx, cy, r, fill, op) => '<path d="M' + cx + ' ' + (cy - r) + 'Q' + cx + ' ' + cy + ' ' + (cx + r) + ' ' + cy + 'Q' + cx + ' ' + cy + ' ' + cx + ' ' + (cy + r) + 'Q' + cx + ' ' + cy + ' ' + (cx - r) + ' ' + cy + 'Q' + cx + ' ' + cy + ' ' + cx + ' ' + (cy - r) + 'Z" fill="' + fill + '" opacity="' + (op || 1) + '"/>';
const crescent = (id, cx, cy, r, dx, dy, r2, fill) => '<mask id="' + id + '"><rect width="200" height="240" fill="#fff"/><circle cx="' + (cx + dx) + '" cy="' + (cy + dy) + '" r="' + r2 + '" fill="#000"/></mask><circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + fill + '" mask="url(#' + id + ')"/>';
const pine = (x, y, h, c) => '<path d="M' + x + ' ' + (y - h) + 'L' + (x + h * 0.27) + ' ' + (y - h * 0.52) + 'H' + (x + h * 0.16) + 'L' + (x + h * 0.34) + ' ' + (y - h * 0.2) + 'H' + (x + h * 0.06) + 'V' + y + 'H' + (x - h * 0.06) + 'V' + (y - h * 0.2) + 'H' + (x - h * 0.34) + 'L' + (x - h * 0.16) + ' ' + (y - h * 0.52) + 'H' + (x - h * 0.27) + 'Z" fill="' + c + '"/>';
const wave = (y, amp, len, ph, col, op) => { let d = 'M0 240V' + y; for (let x = 0; x <= 200; x += 5) d += 'L' + x + ' ' + (y + amp * Math.sin((x / len) * 6.283 + ph)).toFixed(1); return '<path d="' + d + 'V240Z" fill="' + col + '" opacity="' + (op || 1) + '"/>'; };
const dotsE = (n, seed, y0, y1, col, rmax, op) => { const r = rnd(seed); let o = ''; for (let i = 0; i < n; i++) o += '<circle cx="' + (20 + r() * 160).toFixed(0) + '" cy="' + (y0 + r() * (y1 - y0)).toFixed(0) + '" r="' + (0.6 + r() * rmax).toFixed(1) + '" fill="' + col + '" opacity="' + (op * (0.4 + r() * 0.6)).toFixed(2) + '"/>'; return o; };
const tinyStars = (pts, col) => pts.map(p => '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + p[2] + '" fill="' + col + '"/>').join('');

/* escudo base: aro metálico + corpo em degradê + filete interno; o desenho (motif) fica recortado dentro */
const crest = (id, body, rim, trim, motif) => {
  const T = ' transform="translate(100 125) scale(.905) translate(-100 -125)"';
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 240"><defs>' + lg(id + 'b', body) + lg(id + 'r', rim) + '<clipPath id="' + id + 'k"><path d="' + SHIELD + '"' + T + '/></clipPath></defs>'
    + '<path d="' + SHIELD + '" fill="url(#' + id + 'r)"/>'
    + '<path d="' + SHIELD + '" fill="url(#' + id + 'b)"' + T + '/>'
    + '<g clip-path="url(#' + id + 'k)">' + motif + '<path d="M30 30H170V98Q100 124 30 98Z" fill="#fff" opacity=".06"/></g>'
    + '<path d="' + SHIELD + '" fill="none" stroke="' + trim + '" stroke-opacity=".65" stroke-width="1.6" transform="translate(100 125) scale(.855) translate(-100 -125)"/>'
    + '<path d="' + SHIELD + '" fill="none" stroke="#000" stroke-opacity=".28" stroke-width="1.2"/></svg>';
};

const EMB = {
  /* rosa sobre fundo azul-noite com brilhos dourados */
  belafera: () => {
    let r = '';
    for (let k = 0; k < 6; k++) r += '<ellipse cx="100" cy="91" rx="14" ry="21" fill="#C21E48" transform="rotate(' + (60 * k) + ' 100 108)"/>';
    for (let k = 0; k < 5; k++) r += '<ellipse cx="100" cy="97" rx="10" ry="15" fill="#E0365F" transform="rotate(' + (72 * k + 20) + ' 100 108)"/>';
    return crest('b', [[0, '#3F51B5'], [1, '#121A52']], GOLD, '#FFE9A8',
      spark(50, 66, 6, '#FFE9A8') + spark(152, 58, 8, '#FFE9A8') + spark(148, 150, 5, '#FFE9A8', 0.8) + spark(54, 138, 6, '#FFE9A8', 0.8)
      + '<path d="M100 146C97 168 104 182 100 206" fill="none" stroke="#3F9B5A" stroke-width="4" stroke-linecap="round"/><ellipse cx="86" cy="172" rx="13" ry="5.5" fill="#4FB46C" transform="rotate(-32 86 172)"/><ellipse cx="115" cy="186" rx="13" ry="5.5" fill="#3F9B5A" transform="rotate(30 115 186)"/>'
      + r + '<circle cx="100" cy="108" r="9" fill="#F25A7D"/><path d="M92 108a8 8 0 0 1 16 0a5 5 0 0 1-10 0a2.5 2.5 0 0 1 5 0" fill="none" stroke="#9E0F2D" stroke-width="2" stroke-linecap="round"/>');
  },
  /* rosa dos ventos sobre ondas em camadas */
  oceano: () => {
    let st = '';
    for (let i = 0; i < 16; i++) { const a = (-90 + i * 22.5) * Math.PI / 180, rr = i % 4 === 0 ? 40 : (i % 2 === 0 ? 25 : 9); st += (i ? 'L' : 'M') + (100 + rr * Math.cos(a)).toFixed(1) + ' ' + (86 + rr * Math.sin(a)).toFixed(1); }
    return crest('o', [[0, '#1F86AB'], [1, '#07263D']], [[0, '#E8FBFF'], [0.5, '#6CCBE0'], [1, '#2B7E94']], '#BDF1FF',
      '<circle cx="100" cy="86" r="50" fill="none" stroke="#BDF1FF" stroke-opacity=".35" stroke-width="1.5"/><path d="' + st + 'Z" fill="#F4FDFF"/><circle cx="100" cy="86" r="6.5" fill="#1F86AB"/><circle cx="100" cy="86" r="3" fill="#F4FDFF"/>'
      + wave(150, 6, 70, 0, '#0F6B8E', 0.9) + wave(168, 6, 56, 1.6, '#0B5272', 0.95) + wave(186, 5, 48, 3.1, '#073A57') + wave(204, 5, 42, 4.4, '#052A42')
      + tinyStars([[62, 140, 1.6], [138, 134, 1.4], [150, 160, 1.2]], '#BDF1FF'));
  },
  /* sol se pondo no mar, com reflexo e uma palmeira */
  poente: () => crest('s', [[0, '#5B2A63'], [0.55, '#C4476B'], [1, '#F59A5B']], [[0, '#FFE9C6'], [0.5, '#F2A25C'], [1, '#A8552A']], '#FFE3B8',
    '<defs>' + glow('gl', '#FFE3A0', 0.7) + '</defs><circle cx="100" cy="142" r="86" fill="url(#gl)"/><circle cx="100" cy="142" r="38" fill="#FFE3A0"/><rect x="0" y="142" width="200" height="100" fill="#4B2050" opacity=".92"/>'
    + [[152, 70, 0.55], [160, 58, 0.45], [169, 46, 0.35], [179, 34, 0.28]].map(l => '<rect x="' + (100 - l[1]) + '" y="' + l[0] + '" width="' + (l[1] * 2) + '" height="3" rx="1.5" fill="#FFE3A0" opacity="' + l[2] + '"/>').join('')
    + '<g fill="none" stroke="#240B2A" stroke-linecap="round"><path d="M52 206Q58 166 70 128" stroke-width="4.5"/><g stroke-width="3.2"><path d="M70 128Q48 114 32 128"/><path d="M70 128Q54 102 36 98"/><path d="M70 128Q70 100 62 84"/><path d="M70 128Q88 104 100 92"/><path d="M70 128Q96 116 108 126"/></g></g>'
    + '<g fill="none" stroke="#240B2A" stroke-width="1.8" stroke-linecap="round"><path d="M128 70q5-6 10 0q5-6 10 0"/><path d="M148 88q4-5 8 0q4-5 8 0"/></g>'),
  /* montanhas nevadas, lua e pinheiros com vaga-lumes */
  floresta: () => crest('f', [[0, '#47995F'], [1, '#0B2A1A']], [[0, '#EFFBDD'], [0.5, '#8CCB8A'], [1, '#3E7A4B']], '#D5F0C4',
    '<defs>' + glow('gl', '#FFF6C9', 0.55) + '</defs><circle cx="100" cy="66" r="44" fill="url(#gl)"/><circle cx="100" cy="66" r="13" fill="#FFF6C9"/>'
    + '<path d="M22 152L66 98L98 134L134 86L178 152V240H22Z" fill="#2A6B45" opacity=".9"/><path d="M134 86L120 104L130 100L140 108L146 98Z" fill="#E9F7EC" opacity=".85"/><path d="M66 98L56 110L64 106L72 112Z" fill="#E9F7EC" opacity=".8"/>'
    + pine(46, 214, 70, '#14452D') + pine(154, 214, 76, '#14452D') + pine(78, 218, 92, '#0F3524') + pine(124, 218, 86, '#0F3524') + pine(100, 226, 110, '#092417')
    + '<path d="M20 210Q100 198 180 210V240H20Z" fill="#061A10"/>' + dotsE(18, 9, 130, 210, '#F3E58A', 1.5, 0.9)),
  /* lua e cidade acesa de madrugada */
  noite: () => {
    const r = rnd(5); let sk = '';
    for (let x = 20; x < 190; x += 14) {
      const h = 26 + r() * 62; sk += '<rect x="' + x + '" y="' + (214 - h).toFixed(0) + '" width="13" height="' + (h + 30).toFixed(0) + '" fill="#070A14"/>';
      for (let k = 0; k < 4; k++) if (r() > 0.5) sk += '<rect x="' + (x + 3 + (k % 2) * 5) + '" y="' + (214 - h + 8 + k * 14).toFixed(0) + '" width="3" height="4" fill="#FFD27A" opacity=".85"/>';
    }
    return crest('n', [[0, '#25325A'], [1, '#080B16']], [[0, '#EEF3FF'], [0.5, '#8FA8E8'], [1, '#44558F']], '#C9D7FF',
      '<defs>' + glow('gl', '#F4F1DE', 0.4) + '</defs><circle cx="96" cy="86" r="56" fill="url(#gl)"/>' + crescent('mn', 96, 86, 30, 14, -9, 26, '#F4F1DE')
      + spark(144, 58, 7, '#fff') + spark(58, 60, 5, '#fff', 0.9) + spark(150, 112, 4, '#fff', 0.8) + spark(52, 110, 4, '#fff', 0.7) + sk);
  }
};
const embCache = {};
const embUrl = k => embCache[k] || (embCache[k] = 'data:image/svg+xml,' + encodeURIComponent(EMB[k]()));
