// Utilidades gerais: datas, textos, cores e listas fixas do app.

export const STATUS_PROJETO = [
  "Proposta enviada", "Em negociação", "Aprovado", "Em execução",
  "Prestação de contas", "Concluído", "Pausado", "Cancelado"
];
export const STATUS_ATIVOS = ["Proposta enviada", "Em negociação", "Aprovado", "Em execução", "Prestação de contas"];

export const CORES = [
  { nome: "Azul", hex: "#4F86E8" },
  { nome: "Verde", hex: "#3FAF7A" },
  { nome: "Laranja", hex: "#EE8E3C" },
  { nome: "Roxo", hex: "#9468D3" },
  { nome: "Rosa", hex: "#E0679A" },
  { nome: "Turquesa", hex: "#24A9A6" },
  { nome: "Mostarda", hex: "#D4A62A" },
  { nome: "Índigo", hex: "#5F6DCB" },
  { nome: "Coral", hex: "#E9775F" },
  { nome: "Oliva", hex: "#7F9C4B" }
];

export const PRIORIDADES = { alta: "Alta", normal: "Normal", baixa: "Baixa" };

// ---------- Datas (sempre "AAAA-MM-DD" no horário local) ----------
const pad = (n) => String(n).padStart(2, "0");
export const paraISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const deISO = (s) => { const [a, m, d] = s.split("-").map(Number); return new Date(a, m - 1, d); };
export const hoje = () => paraISO(new Date());
export const somarDias = (iso, n) => { const d = deISO(iso); d.setDate(d.getDate() + n); return paraISO(d); };
export const diasEntre = (de, ate) => Math.round((deISO(ate) - deISO(de)) / 86400000);

const DIAS = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
const DIAS_CURTOS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const MESES_CURTOS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

export function dataLonga(iso = hoje()) {
  const d = deISO(iso);
  const s = `${DIAS[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]}`;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function dataCurta(iso) {
  const d = deISO(iso);
  const ano = d.getFullYear() !== new Date().getFullYear() ? ` ${d.getFullYear()}` : "";
  return `${d.getDate()} ${MESES_CURTOS[d.getMonth()]}${ano}`;
}

// Rótulo amigável para prazos: "Hoje", "Amanhã", "Ontem", "qui 15 out", "há 3 dias"...
export function rotuloPrazo(iso) {
  const n = diasEntre(hoje(), iso);
  if (n === 0) return "Hoje";
  if (n === 1) return "Amanhã";
  if (n === -1) return "Ontem";
  if (n < -1) return `${dataCurta(iso)} · há ${-n} dias`;
  const d = deISO(iso);
  if (n < 7) return `${DIAS_CURTOS[d.getDay()]} ${dataCurta(iso)}`;
  return dataCurta(iso);
}

export function tituloDia(iso) {
  const n = diasEntre(hoje(), iso);
  if (n === 0) return "Hoje";
  if (n === 1) return "Amanhã";
  const d = deISO(iso);
  const s = `${DIAS[d.getDay()]}, ${d.getDate()} ${MESES_CURTOS[d.getMonth()]}`;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function proximaSegunda() {
  const d = new Date();
  const add = ((8 - d.getDay()) % 7) || 7;
  d.setDate(d.getDate() + add);
  return paraISO(d);
}

export function saudacao() {
  const h = new Date().getHours();
  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}

// ---------- Texto ----------
export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const normalizar = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Cor de fundo bem clarinha a partir da cor do projeto
export function corSuave(hex, alfa = 0.12) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alfa})`;
}

export const agora = () => new Date().toISOString();

// ---------- Período do evento ----------
// Aceita projetos antigos que só tinham "dataEvento".
export function periodo(p) {
  const ini = p.dataInicio || p.dataEvento || null;
  const fim = p.dataFim || ini;
  return ini ? { ini, fim: fim < ini ? ini : fim } : null;
}

// "14 dez", "14 a 18 dez", "28 nov a 3 dez"
export function rotuloPeriodo(p) {
  const per = periodo(p);
  if (!per) return "";
  const { ini, fim } = per;
  if (ini === fim) return dataCurta(ini);
  const a = deISO(ini), b = deISO(fim);
  if (a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()) return `${a.getDate()} a ${dataCurta(fim)}`;
  return `${dataCurta(ini)} a ${dataCurta(fim)}`;
}

// Situação do evento em relação a hoje
export function situacaoEvento(p) {
  const per = periodo(p);
  if (!per) return null;
  const h = hoje();
  const dias = diasEntre(per.ini, per.fim) + 1;
  if (h < per.ini) { const n = diasEntre(h, per.ini); return { tipo: "antes", texto: n === 1 ? "começa amanhã" : `começa em ${n} dias`, dias }; }
  if (h > per.fim) return { tipo: "depois", texto: "encerrado", dias };
  const d = diasEntre(per.ini, h) + 1;
  return { tipo: "durante", texto: dias > 1 ? `acontecendo · dia ${d} de ${dias}` : "acontecendo hoje", dias };
}
