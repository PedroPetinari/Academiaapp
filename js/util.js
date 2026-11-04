/* Utilitários pequenos usados por todo o app. */
const KEY = 'meu-treino-v1';
const uid = () => Math.random().toString(36).slice(2, 8);
const todayStr = () => new Date().toLocaleDateString('sv');
const fd = d => d.slice(8, 10) + '/' + d.slice(5, 7);
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const num = v => parseFloat(String(v).replace(',', '.'));
const fmt = n => (Math.round(n * 10) / 10).toLocaleString('pt-BR');

const slug = s => s.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '');
