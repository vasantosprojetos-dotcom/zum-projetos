// Regra de prazo da planilha: prazo = âncora + dias (dias corridos).
// Se cair em fim de semana ou feriado, volta para o dia útil anterior.
// Âncoras: "Início", "Término", "Semana 2" (início da semana 2) e "Sáb. antes" (sábado anterior ao início;
// essa não volta para dia útil, porque a tarefa é no próprio sábado).
export const ANCORAS = ["Início", "Término", "Semana 2", "Sáb. antes"];

const d = (s) => new Date(`${s}T12:00:00`);
const iso = (x) => x.toISOString().slice(0, 10);
function mais(s, n) { const x = d(s); x.setDate(x.getDate() + n); return iso(x); }

export function diaUtilAnterior(s, feriados = new Set()) {
  let x = s;
  for (let i = 0; i < 30; i++) {
    const dia = d(x).getDay();
    if (dia !== 0 && dia !== 6 && !feriados.has(x)) return x;
    x = mais(x, -1);
  }
  return x;
}

// datas: { inicio, fim, semana2 }   feriados: Set de "aaaa-mm-dd"
export function calcularPrazo(ancora, dias, datas, feriados = new Set()) {
  const n = Number(dias) || 0;
  if (!datas?.inicio) return null;
  if (ancora === "Sáb. antes") {
    const dia = d(datas.inicio).getDay(); // 0 = domingo
    return mais(datas.inicio, -((dia + 1) % 7 || 7) + n);
  }
  const base = ancora === "Término" ? (datas.fim || datas.inicio)
    : ancora === "Semana 2" ? (datas.semana2 || datas.inicio)
    : datas.inicio;
  return diaUtilAnterior(mais(base, n), feriados);
}
