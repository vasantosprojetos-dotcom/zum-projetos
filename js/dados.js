// Estado do app e todas as operações com projetos e tarefas.
// As telas leem daqui e pedem mudanças por aqui; nunca falam direto com o Firebase.
import * as fb from "./firebase.js";
import { hoje, agora, diasEntre, CORES, periodo } from "./util.js";

const estado = { projetos: [], tarefas: [], prontoP: false, prontoT: false };
const ouvintes = new Set();
let desligar = [];

export const pronto = () => estado.prontoP && estado.prontoT;
export function aoMudar(cb) { ouvintes.add(cb); return () => ouvintes.delete(cb); }
function avisar() { ouvintes.forEach((cb) => cb()); }

let aoErro = () => {};
export function definirAvisoErro(cb) { aoErro = cb; }
function gravar(p) {
  return p.catch((e) => { console.error(e); aoErro("Não consegui salvar. Confira a internet e tente de novo."); throw e; });
}

export function iniciar() {
  parar();
  desligar.push(fb.ouvir("projetos", (lista) => { estado.projetos = lista; estado.prontoP = true; avisar(); }, erroLeitura));
  desligar.push(fb.ouvir("tarefas", (lista) => { estado.tarefas = lista; estado.prontoT = true; avisar(); }, erroLeitura));
}
export function parar() {
  desligar.forEach((f) => f && f());
  desligar = [];
  Object.assign(estado, { projetos: [], tarefas: [], prontoP: false, prontoT: false });
}
function erroLeitura(e) {
  console.error(e);
  aoErro(e.code === "permission-denied"
    ? "Acesso negado pelo banco de dados. As regras de segurança ainda não liberaram este usuário."
    : "Não consegui carregar os dados. Confira a internet.");
}

// ---------------- Leitura ----------------
const ordemNome = (a, b) => (a.ordem ?? 999) - (b.ordem ?? 999) || a.nome.localeCompare(b.nome, "pt-BR");

export const todosProjetos = () => estado.projetos.filter((p) => !p.excluidoEm).sort(ordemNome);
export const projetosAtivos = () => todosProjetos().filter((p) => !p.arquivado);
export const projetosArquivados = () => todosProjetos().filter((p) => p.arquivado);
export const projeto = (id) => estado.projetos.find((p) => p.id === id) || null;
export const tarefa = (id) => estado.tarefas.find((t) => t.id === id) || null;

// Tarefa "viva": não está na lixeira e o projeto dela (se houver) está ativo.
function viva(t) {
  if (t.excluidaEm) return false;
  if (!t.projetoId) return true;
  const p = projeto(t.projetoId);
  return !!p && !p.excluidoEm && !p.arquivado;
}
export const tarefasVivas = () => estado.tarefas.filter(viva);
export const tarefasDoProjeto = (pid) => estado.tarefas.filter((t) => t.projetoId === pid && !t.excluidaEm);
export const aberta = (t) => t.status !== "concluida";

const PESO_PRIORIDADE = { alta: 0, normal: 1, baixa: 2 };
export function ordenarTarefas(lista) {
  return [...lista].sort((a, b) =>
    (a.prazo || "9999") .localeCompare(b.prazo || "9999") ||
    (PESO_PRIORIDADE[a.prioridade] ?? 1) - (PESO_PRIORIDADE[b.prioridade] ?? 1) ||
    (a.criadaEm || "").localeCompare(b.criadaEm || ""));
}

export function progresso(pid) {
  const ts = tarefasDoProjeto(pid);
  const feitas = ts.filter((t) => t.status === "concluida").length;
  return { feitas, total: ts.length, pct: ts.length ? Math.round((feitas / ts.length) * 100) : 0 };
}

// Próximo passo: o texto escrito à mão, ou a próxima tarefa aberta pelo prazo.
export function proximoPasso(p) {
  if (p.proximoPasso && p.proximoPasso.trim()) return { texto: p.proximoPasso.trim(), manual: true };
  const abertas = ordenarTarefas(tarefasDoProjeto(p.id).filter((t) => t.status === "aFazer"));
  return abertas.length ? { texto: abertas[0].titulo, prazo: abertas[0].prazo, tarefaId: abertas[0].id } : null;
}

// Datas importantes de projetos ativos dentro de um intervalo
export function datasImportantes(de, ate) {
  const out = [];
  for (const p of projetosAtivos()) {
    const per = periodo(p);
    if (per) {
      const umDia = per.ini === per.fim;
      if (per.ini >= de && per.ini <= ate) out.push({ id: "ini", titulo: umDia ? "Dia do evento" : "Início do evento", data: per.ini, projeto: p, evento: true });
      if (!umDia && per.fim >= de && per.fim <= ate) out.push({ id: "fim", titulo: "Último dia do evento", data: per.fim, projeto: p, evento: true });
    }
    for (const d of p.datas || []) {
      if (d.data && d.data >= de && d.data <= ate) out.push({ ...d, projeto: p });
    }
  }
  return out.sort((a, b) => a.data.localeCompare(b.data));
}

export function lixeira() {
  const ps = estado.projetos.filter((p) => p.excluidoEm).map((p) => ({ tipo: "projeto", item: p, quando: p.excluidoEm }));
  const ts = estado.tarefas.filter((t) => t.excluidaEm).map((t) => ({ tipo: "tarefa", item: t, quando: t.excluidaEm }));
  return [...ps, ...ts].sort((a, b) => b.quando.localeCompare(a.quando));
}

// Projetos cujo evento está acontecendo hoje
export function eventosEmAndamento() {
  const h = hoje();
  return projetosAtivos().filter((p) => { const per = periodo(p); return per && per.ini <= h && h <= per.fim; });
}

export const instantaneo = () => ({ projetos: estado.projetos, tarefas: estado.tarefas });

// ---------------- Tarefas ----------------
export function criarTarefa(campos) {
  const id = fb.novoId("tarefas");
  const t = {
    titulo: campos.titulo.trim(),
    projetoId: campos.projetoId || null,
    fase: campos.fase || "",
    prazo: campos.prazo || null,
    prioridade: campos.prioridade || "normal",
    status: campos.status || "aFazer",
    notas: campos.notas || "",
    concluidaEm: null,
    excluidaEm: null,
    criadaEm: agora(),
    atualizadaEm: agora()
  };
  gravar(fb.salvar("tarefas", id, t));
  return id;
}

export const atualizarTarefa = (id, campos) => gravar(fb.salvar("tarefas", id, { ...campos, atualizadaEm: agora() }));
export const concluir = (id) => atualizarTarefa(id, { status: "concluida", concluidaEm: agora() });
export const reabrir = (id) => atualizarTarefa(id, { status: "aFazer", concluidaEm: null });
export const adiar = (id, prazo) => atualizarTarefa(id, { prazo });
export const excluirTarefa = (id) => atualizarTarefa(id, { excluidaEm: agora() });

// ---------------- Projetos ----------------
export function criarProjeto(campos) {
  const id = fb.novoId("projetos");
  const usadas = new Set(todosProjetos().map((p) => p.cor));
  const cor = campos.cor || (CORES.find((c) => !usadas.has(c.hex)) || CORES[0]).hex;
  const p = {
    nome: campos.nome.trim(),
    cor,
    status: campos.status || "Em negociação",
    dataInicio: campos.dataInicio || null,
    dataFim: campos.dataFim || null,
    fases: campos.fases || ["Planejamento", "Execução", "Pós-evento"],
    contatos: [],
    datas: [],
    anotacoes: campos.anotacoes || "",
    proximoPasso: "",
    arquivado: false,
    excluidoEm: null,
    ordem: campos.ordem ?? todosProjetos().length,
    criadoEm: agora(),
    atualizadoEm: agora()
  };
  gravar(fb.salvar("projetos", id, p));
  return id;
}

export const atualizarProjeto = (id, campos) => gravar(fb.salvar("projetos", id, { ...campos, atualizadoEm: agora() }));
export const arquivarProjeto = (id, sim = true) => atualizarProjeto(id, { arquivado: sim });
export const excluirProjeto = (id) => atualizarProjeto(id, { excluidoEm: agora() });

// ---------------- Lixeira ----------------
export function restaurar(tipo, id) {
  return tipo === "projeto" ? atualizarProjeto(id, { excluidoEm: null }) : atualizarTarefa(id, { excluidaEm: null });
}

export async function excluirDefinitivo(tipo, id) {
  if (tipo === "tarefa") return gravar(fb.remover("tarefas", id));
  const ops = estado.tarefas.filter((t) => t.projetoId === id).map((t) => ({ tipo: "delete", col: "tarefas", id: t.id }));
  ops.push({ tipo: "delete", col: "projetos", id });
  return gravar(fb.emLote(ops));
}

// Apaga de vez o que está na lixeira há mais de 30 dias.
export async function limparLixeiraAntiga() {
  const limite = 30;
  for (const { tipo, item, quando } of lixeira()) {
    if (diasEntre(quando.slice(0, 10), hoje()) > limite) await excluirDefinitivo(tipo, item.id).catch(() => {});
  }
}

// ---------------- Primeiro uso ----------------
const FASES_COLONIA = ["Planejamento", "Divulgação", "Inscrições", "Equipe", "Materiais e compras", "Execução", "Pós-evento"];

const PROJETOS_INICIAIS = [
  { nome: "Colônia Loyola – Dez/2026", cor: "#4F86E8", status: "Aprovado", fases: FASES_COLONIA,
    anotacoes: "Colônia acontece em julho e dezembro. Cada edição vira um projeto próprio." },
  { nome: "Festa Junina Loyola", cor: "#EE8E3C", status: "Aprovado",
    fases: ["Planejamento", "Divulgação", "Equipe", "Materiais e compras", "Execução", "Pós-evento"],
    anotacoes: "Acontece em junho." },
  { nome: "Colônia Santa Dorotéia", cor: "#3FAF7A", status: "Em execução", fases: FASES_COLONIA },
  { nome: "Colônia Santa Maria Minas", cor: "#9468D3", status: "Proposta enviada", fases: FASES_COLONIA,
    anotacoes: "Proposta enviada; possivelmente vai sair." },
  { nome: "Brincar é Direito", cor: "#24A9A6", status: "Em execução",
    fases: ["Planejamento", "Atividades de sábado", "Prestação de contas"],
    anotacoes: "Prefeitura de Contagem. Atividades aos sábados em parques públicos." },
  { nome: "ABESC – Colônia Itabira", cor: "#E0679A", status: "Aprovado",
    fases: ["Planejamento", "Divulgação", "Inscrições", "Equipe", "Materiais e compras", "Execução", "Prestação de contas"] },
  { nome: "ABESC – Lei de Incentivo", cor: "#D4A62A", status: "Em negociação",
    fases: ["Captação", "Apoio institucional", "Execução", "Prestação de contas"],
    anotacoes: "Em processo de captação, com apoio da Secretaria de Esporte e Lazer de Itabira." },
  { nome: "Casa Gunga", cor: "#7F9C4B", status: "Aprovado",
    fases: ["Estruturação", "Projetos"],
    anotacoes: "Associação recém-registrada. Espaço para os projetos futuros." }
];

export async function prepararPrimeiroUso() {
  const cfg = await fb.lerUm("config", "geral").catch(() => null);
  if (cfg?.projetosIniciais) return;
  const existentes = await fb.ler("projetos").catch(() => null);
  if (existentes === null) return; // sem conexão: tenta na próxima abertura
  if (existentes.length === 0) {
    PROJETOS_INICIAIS.forEach((p, i) => criarProjeto({ ...p, ordem: i }));
  }
  await fb.salvar("config", "geral", { projetosIniciais: true, criadoEm: agora() });
}
