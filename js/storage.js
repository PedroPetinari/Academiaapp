/* Armazenamento local de imagens (IndexedDB) e redução de fotos. */
async function shrink(f, max, q, type) {
  const bm = await createImageBitmap(f), k = Math.min(1, max / Math.max(bm.width, bm.height)), c = document.createElement('canvas');
  c.width = Math.round(bm.width * k); c.height = Math.round(bm.height * k);
  c.getContext('2d').drawImage(bm, 0, 0, c.width, c.height);
  return new Promise(r => c.toBlob(r, type || 'image/jpeg', q || 0.8));
}

const urls = {};
const url = p => p.url || urls[p.id] || (urls[p.id] = URL.createObjectURL(p.blob));
const idb = () => new Promise((res, rej) => { const r = indexedDB.open('appgym', 2); r.onupgradeneeded = () => { const db = r.result; if (!db.objectStoreNames.contains('p')) db.createObjectStore('p', { keyPath: 'id' }); if (!db.objectStoreNames.contains('bg')) db.createObjectStore('bg', { keyPath: 'id' }); }; r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
const tx = async (mode, fn, st) => { const db = await idb(); return new Promise((res, rej) => { const t = db.transaction(st || 'p', mode); const out = fn(t.objectStore(st || 'p')); t.oncomplete = () => res(out && out.result); t.onerror = () => rej(t.error); }); };
async function loadPhotos() { try { photos = ((await tx('readonly', s => s.getAll())) || []).sort((a, b) => b.at - a.at); } catch (e) { photos = null; } }
async function deletePhoto(id) {
  try { await tx('readwrite', s => s.delete(id)); } catch (e) {}
  if (sbOn()) { (S.cfg.photoDel = S.cfg.photoDel || []).push(id); saveLocal(); }
  await loadPhotos(); render(); syncPhotos(true);
}

/* cor de destaque tirada da própria foto: média das cores mais vivas, clareada para contrastar com o fundo escuro */
const hsl2hex = (h, s, l) => { const k = n => (n + h * 12) % 12, a = s * Math.min(l, 1 - l), f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))); return '#' + [f(0), f(8), f(4)].map(x => ('0' + Math.round(x * 255).toString(16)).slice(-2)).join(''); };
async function accentOf(blob) {
  try {
    const bm = await createImageBitmap(blob), c = document.createElement('canvas'); c.width = c.height = 24;
    const g = c.getContext('2d'); g.drawImage(bm, 0, 0, 24, 24);
    const d = g.getImageData(0, 0, 24, 24).data; let R = 0, G = 0, B = 0, W = 0;
    for (let i = 0; i < d.length; i += 4) { const hi = Math.max(d[i], d[i + 1], d[i + 2]), lo = Math.min(d[i], d[i + 1], d[i + 2]), w = 0.15 + (hi - lo) / 255; R += d[i] * w; G += d[i + 1] * w; B += d[i + 2] * w; W += w; }
    const r = R / W / 255, gg = G / W / 255, b = B / W / 255, hi = Math.max(r, gg, b), lo = Math.min(r, gg, b);
    let h = 0, s = 0; const l0 = (hi + lo) / 2;
    if (hi !== lo) { const dd = hi - lo; s = l0 > 0.5 ? dd / (2 - hi - lo) : dd / (hi + lo); h = (hi === r ? (gg - b) / dd + (gg < b ? 6 : 0) : hi === gg ? (b - r) / dd + 2 : (r - gg) / dd + 4) / 6; }
    return hsl2hex(h, Math.min(0.75, Math.max(0.5, s)), 0.62);
  } catch (e) { return ''; }
}
