/* Estado global: treinos de exemplo, configurações, localStorage e variáveis de interface. */
const mk = (name, items, check) => ({
  id: items.length ? 'd' + slug(name) : uid(), name, check: !!check, mt: items.length ? 0 : Date.now(),
  ex: items.map((s, i) => { const [n, t] = s.split('|'); return { id: 'e' + slug(name) + i, name: n, t, log: [], on: '' }; })
});

const seed = () => [
  mk('Peito', ['Supino inclinado com halteres|4×8','Supino reto|3×8','Crucifixo|3×12-15','Crossover na polia|3×12-15']),
  mk('Costas', ['Puxada alta pegada aberta|4×8-12','Remada curvada ou cavalinho|3×8-10','Remada baixa|3×10-12','Pullover na polia|3×12-15','Crucifixo inverso na polia cruzada (o X)|3×12-15','Puxada unilateral na máquina|3×10']),
  mk('Ombros', ['Desenvolvimento com halteres|3×8','Elevação lateral|4×12','Elevação lateral na polia|3×15','Elevação frontal|3×12','Crucifixo inverso na máquina|3×15','Encolhimento|3×12']),
  mk('Braços', ['Rosca direta|3×8-12','Rosca martelo|3×10-12','Tríceps corda|3×10-12','Tríceps testa|3×10-12','Rosca concentrada|3×12']),
  mk('Quadríceps', ['Agachamento livre|3×10','Agachamento na máquina|4×10','Leg press|3×12','Cadeira extensora|3×12','Afundo ou passada|3×10 por perna','Panturrilha em pé|4×15']),
  mk('Posterior e glúteo', ['Stiff|4×8-10','Elevação pélvica (hip thrust)|4×8-12','Mesa flexora|3×10-12','Stiff unilateral ou terra romeno|3×10','Cadeira abdutora|3×15','Coice na polia ou máquina|3×12 por perna','Panturrilha sentado|3×15']),
  mk('Livres', ['Prancha|3×30-60 s','Prancha lateral|3×30 s por lado','Elevação de pernas deitado|3×12-15','Abdominal remador|3×15-20','Abdominal bicicleta|3×20','Flexão tradicional|3×até 1-2 da falha','Flexão com pés elevados|3×10-15','Flexão diamante|3×8-12','Flexão pike|3×8-12','Barra fixa|3×máximo','Paralelas|3×8-12','Panturrilha no degrau|4×15-20']),
  mk('Aquecimento', ['Esteira, bike ou elíptico leve|5 min','Rotação de ombros e círculos de braço|10 por lado','Rotação de tronco e gato-camelo|10','Agachamento livre sem peso|10-15','Balanço de perna frente e lado|10 por perna','Série de aquecimento com 50% da carga|1 série'], true),
  mk('Pós-treino', ['Esteira (você 10-15 min; ela 20-30 min)|10-30 min','Panturrilha|3×15-20','Alongar peito: braço na parede|20-30 s','Alongar costas: abraçar o corpo e curvar|20-30 s','Alongar ombros: braço cruzado|20-30 s','Alongar bíceps e tríceps|20-30 s','Alongar quadríceps|20-30 s','Alongar posterior: sentado, tocar os pés|20-30 s','Alongar glúteo: figura 4|20-30 s','Alongar panturrilha na parede|20-30 s'], true)
];

let S = null;
try { S = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
if (!S || !Array.isArray(S.days)) S = { days: seed(), active: null };
const DEF = { name: 'AppGym', acc: '#0B7A5F', mode: 'auto', font: 'cond', lay: 'cards', den: 'cozy', n1: 'Pedro', n2: 'Brenda', rest: '90', goal: '4', code: '', bgType: 'auto', bgVal: '' };
S.cfg = Object.assign({}, DEF, S.cfg || {});
/* temas antigos que foram trocados por temas com foto */
const OLD_THEMES = ['palmeiras', 'crepusculo', 'morro'];
if (S.cfg.bgType === 'theme' && OLD_THEMES.indexOf(S.cfg.bgVal) >= 0) { S.cfg.bgType = 'auto'; S.cfg.bgVal = ''; delete S.cfg.accT; }
if (Array.isArray(S.cfg.saved)) S.cfg.saved = S.cfg.saved.filter(t => !(t.bgType === 'theme' && OLD_THEMES.indexOf(t.bgVal) >= 0));
if (!Array.isArray(S.cfg.pt)) S.cfg.pt = [0, 1, 2].map(i => ({ n: 'Foto ' + (i + 1), id: '', acc: '' }));
if (!S.marks) { S.marks = {}; S.days.forEach(d => d.check || d.ex.forEach(e => e.log.forEach(x => { S.marks[x.d] = 1; }))); }
function backfill() {
  const m = {};
  S.days.forEach(d => { if (d.check) return; d.ex.forEach(e => e.log.forEach(x => { const k = x.d + '|' + d.id; (m[k] = m[k] || { id: k, d: x.d, day: d.name, items: [] }).items.push({ n: e.name, kg: x.kg, s: x.s, r: x.r, x: x.x || [] }); })); });
  return Object.values(m).sort((a, b) => a.d < b.d ? -1 : 1);
}
if (!S.sessions) S.sessions = backfill();
S.marks2 = S.marks2 || {}; S.sessions2 = S.sessions2 || []; S.tomb = S.tomb || {};
const saveLocal = () => { try { localStorage.setItem(KEY, JSON.stringify(S, (k, v) => k === 'cur' ? undefined : v)); } catch (e) {} };
const persist = () => { saveLocal(); schedSync(); };

let drafts = {}, conf = null, showNew = false, ptSlot = -1;

let view = 'treino', cm = new Date(), sel = todayStr(), openP = null, photos = [];
cm.setDate(1);

let justSaved = '', notice = '', who = 'a', copied = '', dataMsg = '', editEx = null;
const touched = {};

let DB = null, ASSETS = null, others = {}, names = {}, pend = false;
