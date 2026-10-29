// Estado do app e todas as operações com projetos, tarefas e equipe.
// As telas leem daqui e pedem mudanças por aqui; nunca falam direto com o Firebase.
import * as fb from "./firebase.js";
import { hoje, agora, diasEntre, CORES, periodo, rotuloPrazo, normalizar } from "./util.js";

const estado = { projetos: [], tarefas: [], pessoas: [], prontoP: false, prontoT: false };
const ouvintes = new Set();
let desligar = [];

// ---------------- Quem está usando ----------------
// perfil: { email, nome, admin: bool, colonias: [ids] }
let perfil = null;
export const eu = () => perfil;
export const souAdmin = () => !!perfil?.admin;

export const pronto = () => estado.prontoP && estado.prontoT;
export function aoMudar(cb) { ouvintes.add(cb); return () => ouvintes.delete(cb); }
function avisar() { ouvintes.forEach((cb) => cb()); }

let aoErro = () => {};
export function definirAvisoErro(cb) { aoErro = cb; }
function gravar(p) {
  return p.catch((e) => {
    console.error(e);
    aoErro(e.code === "permission-denied" ? "Você não tem permissão para essa mudança." : "Não consegui salvar. Confira a internet e tente de novo.");
    throw e;
  });
}

export function iniciar(p) {
  parar();
  perfil = p;
  desligar.push(fb.ouvir("pessoas", (l) => { estado.pessoas = l; avisar(); }, () => {}));
  if (p.admin) {
    desligar.push(fb.ouvir("projetos", (l) => { estado.projetos = l; estado.prontoP = true; avisar(); }, erroLeitura));
    desligar.push(fb.ouvir("tarefas", (l) => { estado.tarefas = l; estado.prontoT = true; avisar(); }, erroLeitura));
    return;
  }
  // Coordenador: um "ouvido" por colônia que acompanha
  const ids = p.colonias || [];
  const projs = new Map(), tars = new Map();
  let faltamP = new Set(ids), faltamT = new Set(ids);
  const juntar = () => {
    estado.projetos = [...projs.values()].filter(Boolean);
    estado.tarefas = [...tars.values()].flat();
    estado.prontoP = faltamP.size === 0;
    estado.prontoT = faltamT.size === 0;
    avisar();
  };
  if (!ids.length) { estado.prontoP = estado.prontoT = true; avisar(); return; }
  for (const id of ids) {
    desligar.push(fb.ouvirDoc("projetos", id, (doc) => { projs.set(id, doc); faltamP.delete(id); juntar(); },
      (e) => { faltamP.delete(id); juntar(); erroLeitura(e); }));
    desligar.push(fb.ouvirOnde("tarefas", "coloniaId", id, (l) => { tars.set(id, l); faltamT.delete(id); juntar(); },
      (e) => { faltamT.delete(id); juntar(); erroLeitura(e); }));
  }
}
export function parar() {
  desligar.forEach((f) => f && f());
  desligar = [];
  Object.assign(estado, { projetos: [], tarefas: [], pessoas: [], prontoP: false, prontoT: false });
}
function erroLeitura(e) {
  console.error(e);
  aoErro(e.code === "permission-denied"
    ? "Acesso negado pelo banco de dados. Confira se as regras de segurança novas foram publicadas."
    : "Não consegui carregar os dados. Confira a internet.");
}

// ---------------- Equipe ----------------
export const pessoas = () => [...estado.pessoas].sort((a, b) => (a.nome || "").localeCompare(b.nome || "", "pt-BR"));
export function nomeDe(email) {
  if (!email) return "";
  const p = estado.pessoas.find((x) => x.id === email);
  if (p?.nome) return p.nome;
  if (perfil && email === perfil.email) return perfil.nome;
  return email.split("@")[0];
}
export const primeiroNome = (email) => nomeDe(email).split(" ")[0];

// Quem pode ser responsável por tarefas de um projeto
export function equipeDoProjeto(pid) {
  const p = pid ? projeto(pid) : null;
  const ativos = estado.pessoas.filter((x) => x.ativo !== false);
  const admins = ativos.filter((x) => x.papel === "admin");
  if (!p || p.tipo !== "colonia") return admins;
  return [...admins, ...ativos.filter((x) => x.papel !== "admin" && (x.colonias || []).includes(pid))];
}

export function salvarPessoa(email, campos) {
  return gravar(fb.salvar("pessoas", email.trim().toLowerCase(), { ...campos, atualizadaEm: agora() }));
}

// ---------------- Leitura ----------------
const ordemNome = (a, b) => (a.ordem ?? 999) - (b.ordem ?? 999) || a.nome.localeCompare(b.nome, "pt-BR");

export const todosProjetos = () => estado.projetos.filter((p) => !p.excluidoEm).sort(ordemNome);
export const projetosAtivos = () => todosProjetos().filter((p) => !p.arquivado);
export const projetosArquivados = () => todosProjetos().filter((p) => p.arquivado);
export const colonias = () => todosProjetos().filter((p) => p.tipo === "colonia");
export const projeto = (id) => estado.projetos.find((p) => p.id === id) || null;
export const tarefa = (id) => estado.tarefas.find((t) => t.id === id) || null;

// Status das tarefas
export const STATUS_TAREFA = {
  aFazer: "A fazer", andamento: "Em andamento", aguardando: "Aguardando", concluida: "Concluída", naoSeAplica: "Não se aplica"
};
export const aberta = (t) => t.status !== "concluida" && t.status !== "naoSeAplica";
// "Na mão": a fazer ou em andamento (o que conta para atrasos e para o dia)
export const naMao = (t) => t.status === "aFazer" || t.status === "andamento" || !t.status;

// Tarefa "viva": não está na lixeira e o projeto dela (se houver) está ativo.
function viva(t) {
  if (t.excluidaEm) return false;
  if (!t.projetoId) return true;
  const p = projeto(t.projetoId);
  return !!p && !p.excluidoEm && !p.arquivado;
}
export const tarefasVivas = () => estado.tarefas.filter(viva);
export const tarefasDoProjeto = (pid) => estado.tarefas.filter((t) => t.projetoId === pid && !t.excluidaEm);

const PESO_PRIORIDADE = { alta: 0, normal: 1, baixa: 2 };
export function ordenarTarefas(lista) {
  return [...lista].sort((a, b) =>
    (a.prazo || "9999") .localeCompare(b.prazo || "9999") ||
    (PESO_PRIORIDADE[a.prioridade] ?? 1) - (PESO_PRIORIDADE[b.prioridade] ?? 1) ||
    (a.criadaEm || "").localeCompare(b.criadaEm || ""));
}

export function progresso(pid) {
  const ts = tarefasDoProjeto(pid).filter((t) => t.status !== "naoSeAplica");
  const feitas = ts.filter((t) => t.status === "concluida").length;
  return { feitas, total: ts.length, pct: ts.length ? Math.round((feitas / ts.length) * 100) : 0 };
}

// Próximo passo: o texto escrito à mão, ou a próxima tarefa aberta pelo prazo.
export function proximoPasso(p) {
  if (p.proximoPasso && p.proximoPasso.trim()) return { texto: p.proximoPasso.trim(), manual: true };
  const abertas = ordenarTarefas(tarefasDoProjeto(p.id).filter(naMao));
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

export const instantaneo = () => ({ projetos: estado.projetos, tarefas: estado.tarefas, pessoas: estado.pessoas });

// ---------------- Histórico e comentários ----------------
function registro(tarefaId, tipo, texto) {
  if (!perfil) return Promise.resolve();
  return fb.registrar(tarefaId, { tipo, texto, por: perfil.email, nome: perfil.nome, em: agora() })
    .catch((e) => console.warn("Histórico não gravado:", e));
}
export const comentar = (tarefaId, texto) => gravar(fb.registrar(tarefaId, { tipo: "comentario", texto: texto.trim(), por: perfil.email, nome: perfil.nome, em: agora() }));
export const ouvirRegistros = (tarefaId, cb) => fb.ouvirRegistros(tarefaId, cb, (e) => console.warn(e));

const rotuloData = (d) => (d ? rotuloPrazo(d) : "sem prazo");
function descreverMudancas(antes, campos) {
  const out = [];
  if ("titulo" in campos && campos.titulo !== antes.titulo) out.push(`renomeou para “${campos.titulo}”`);
  if ("prazo" in campos && (campos.prazo || null) !== (antes.prazo || null)) out.push(`mudou o prazo de ${rotuloData(antes.prazo)} para ${rotuloData(campos.prazo)}`);
  if ("responsavel" in campos && (campos.responsavel || "") !== (antes.responsavel || "")) out.push(campos.responsavel ? `passou a tarefa para ${nomeDe(campos.responsavel)}` : "tirou o responsável");
  if ("status" in campos && campos.status !== antes.status) {
    if (campos.status === "concluida") out.push("concluiu");
    else if (antes.status === "concluida") out.push("reabriu");
    else out.push(`mudou a situação para ${STATUS_TAREFA[campos.status] || campos.status}`);
  }
  if ("projetoId" in campos && (campos.projetoId || null) !== (antes.projetoId || null)) out.push("mudou o projeto");
  return out;
}

// ---------------- Tarefas ----------------
const coloniaDe = (pid) => { const p = pid ? projeto(pid) : null; return p && p.tipo === "colonia" ? p.id : null; };

export function criarTarefa(campos) {
  const id = fb.novoId("tarefas");
  const projetoId = campos.projetoId || null;
  const t = {
    titulo: campos.titulo.trim(),
    projetoId,
    coloniaId: coloniaDe(projetoId),
    fase: campos.fase || "",
    area: campos.area || "",
    prazo: campos.prazo || null,
    prioridade: campos.prioridade || "normal",
    status: campos.status || "aFazer",
    responsavel: campos.responsavel ?? (perfil?.email || ""),
    apoio: campos.apoio || "",
    notas: campos.notas || "",
    concluidaEm: null,
    excluidaEm: null,
    criadaPor: perfil?.email || "",
    criadaEm: agora(),
    atualizadaPor: perfil?.email || "",
    atualizadaEm: agora()
  };
  gravar(fb.salvar("tarefas", id, t)).then(() => registro(id, "criou", "criou a tarefa")).catch(() => {});
  return id;
}

export function atualizarTarefa(id, campos) {
  const antes = tarefa(id) || {};
  const dados = { ...campos, atualizadaPor: perfil?.email || "", atualizadaEm: agora() };
  if ("projetoId" in campos) dados.coloniaId = coloniaDe(campos.projetoId);
  const mudancas = descreverMudancas(antes, campos);
  return gravar(fb.salvar("tarefas", id, dados)).then(() => {
    if (mudancas.length) registro(id, "mudou", mudancas.join("; "));
  });
}
export const concluir = (id) => atualizarTarefa(id, { status: "concluida", concluidaEm: agora() });
export const reabrir = (id) => atualizarTarefa(id, { status: "aFazer", concluidaEm: null });
export const adiar = (id, prazo) => atualizarTarefa(id, { prazo });
export const excluirTarefa = (id) => atualizarTarefa(id, { excluidaEm: agora() }).then(() => registro(id, "excluiu", "enviou para a lixeira"));

// ---------------- Projetos ----------------
export function criarProjeto(campos) {
  const id = fb.novoId("projetos");
  const usadas = new Set(todosProjetos().map((p) => p.cor));
  const cor = campos.cor || (CORES.find((c) => !usadas.has(c.hex)) || CORES[0]).hex;
  const p = {
    nome: campos.nome.trim(),
    cor,
    tipo: campos.tipo || "avulso",
    grupo: campos.grupo || "",
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

// Muda o tipo do projeto (colônia ou avulso) e acerta as tarefas dele (só a administradora).
export async function definirTipoProjeto(id, tipo) {
  const p = projeto(id);
  if (!p || (p.tipo || "avulso") === tipo) return;
  const coloniaId = tipo === "colonia" ? id : null;
  const ops = [{ tipo: "merge", col: "projetos", id, dados: { tipo, atualizadoEm: agora() } }];
  estado.tarefas.filter((t) => t.projetoId === id).forEach((t) => ops.push({ tipo: "merge", col: "tarefas", id: t.id, dados: { coloniaId } }));
  return gravar(fb.emLote(ops));
}

// ---------------- Lixeira ----------------
export function restaurar(tipo, id) {
  if (tipo === "projeto") return atualizarProjeto(id, { excluidoEm: null });
  return atualizarTarefa(id, { excluidaEm: null }).then(() => registro(id, "restaurou", "tirou da lixeira"));
}

export async function excluirDefinitivo(tipo, id) {
  if (tipo === "tarefa") return gravar(fb.remover("tarefas", id));
  const ops = estado.tarefas.filter((t) => t.projetoId === id).map((t) => ({ tipo: "delete", col: "tarefas", id: t.id }));
  ops.push({ tipo: "delete", col: "projetos", id });
  return gravar(fb.emLote(ops));
}

// Apaga de vez o que está na lixeira há mais de 30 dias (só a administradora).
export async function limparLixeiraAntiga() {
  if (!souAdmin()) return;
  const limite = 30;
  for (const { tipo, item, quando } of lixeira()) {
    if (diasEntre(quando.slice(0, 10), hoje()) > limite) await excluirDefinitivo(tipo, item.id).catch(() => {});
  }
}

// ---------------- Mudança para a pasta comum (versão 2) ----------------
// Copia projetos e tarefas da pasta antiga (só da Vanessa) para a pasta comum da Zum.
// A pasta antiga NÃO é apagada: continua lá como cópia de segurança.
export async function migrarSePreciso(u) {
  const feito = await fb.lerUm("config", "migracao").catch(() => null);
  if (feito) return { jaFeito: true };
  const [projetos, tarefas] = await Promise.all([fb.lerAntigo("projetos"), fb.lerAntigo("tarefas")]);
  const ops = [];
  for (const { id, ...p } of projetos) ops.push({ tipo: "set", col: "projetos", id, dados: { tipo: "avulso", grupo: "", ...p } });
  for (const { id, ...t } of tarefas) {
    ops.push({ tipo: "set", col: "tarefas", id, dados: {
      coloniaId: null, area: "", responsavel: u.email, apoio: "", criadaPor: u.email, atualizadaPor: u.email, ...t
    } });
  }
  ops.push({ tipo: "merge", col: "pessoas", id: u.email, dados: { nome: "Vanessa", papel: "admin", colonias: [], ativo: true, criadaEm: agora() } });
  ops.push({ tipo: "set", col: "config", id: "geral", dados: { projetosIniciais: true, criadoEm: agora() } });
  await fb.emLote(ops);
  await fb.substituir("config", "migracao", { feitaEm: agora(), projetos: projetos.length, tarefas: tarefas.length });
  return { projetos: projetos.length, tarefas: tarefas.length };
}

// ---------------- Primeiro uso (app novo, sem dados antigos) ----------------
const FASES_COLONIA = ["Planejamento", "Divulgação", "Inscrições", "Equipe", "Materiais e compras", "Execução", "Pós-evento"];

const PROJETOS_INICIAIS = [
  { nome: "Colônia Loyola – Dez/2026", cor: "#4F86E8", status: "Aprovado", fases: FASES_COLONIA, tipo: "colonia" },
  { nome: "Colônia Santa Dorotéia", cor: "#3FAF7A", status: "Em execução", fases: FASES_COLONIA, tipo: "colonia" },
  { nome: "Brincar é Direito", cor: "#24A9A6", status: "Em execução",
    fases: ["Planejamento", "Atividades de sábado", "Prestação de contas"] }
];

export async function prepararPrimeiroUso() {
  if (!souAdmin()) return;
  const cfg = await fb.lerUm("config", "geral").catch(() => null);
  if (cfg?.projetosIniciais) return;
  const existentes = await fb.ler("projetos").catch(() => null);
  if (existentes === null) return; // sem conexão: tenta na próxima abertura
  if (existentes.length === 0) {
    PROJETOS_INICIAIS.forEach((p, i) => criarProjeto({ ...p, ordem: i }));
  }
  await fb.salvar("config", "geral", { projetosIniciais: true, criadoEm: agora() });
}

// ---------------- Importar checklist (planilha → app) ----------------
// edicao: { nome, inicio, fim, fases:[...], tarefas:[{ titulo, fase, area, papel, apoio, prazo, prazoModelo,
//           ancora, dias, status, notas }] }
// papel: "direcao" (Vanessa) | "local" (coordenação da colônia) | "" (sem responsável)
// Chave para comparar tarefas: título e fase, sem acento, maiúsculas ou espaços sobrando.
const chaveTarefa = (t) => `${normalizar(t.titulo).replace(/\s+/g, " ").trim()}|${normalizar(t.fase || "").trim()}`;
export const mesmoNome = (a, b) => normalizar(a).replace(/\s+/g, " ").trim() === normalizar(b).replace(/\s+/g, " ").trim();

// Onde uma edição da planilha já foi importada (só conta o que não está na lixeira).
// Devolve [{ projeto, tarefas }]
export function ondeFoiImportada(nomeEdicao) {
  const porProjeto = new Map();
  for (const t of estado.tarefas) {
    if (t.origem !== nomeEdicao || t.excluidaEm) continue;
    const p = projeto(t.projetoId);
    if (!p || p.excluidoEm) continue;
    porProjeto.set(p.id, (porProjeto.get(p.id) || 0) + 1);
  }
  return [...porProjeto].map(([id, n]) => ({ projeto: projeto(id), tarefas: n }));
}

// Quantas tarefas da edição o destino já tem (mesmo título e fase).
export function jaExistemNoDestino(edicao, destinoId) {
  const tem = new Set(tarefasDoProjeto(destinoId).map(chaveTarefa));
  return edicao.tarefas.filter((t) => tem.has(chaveTarefa(t))).length;
}

export async function importarEdicao(edicao, destinoId, novoNome) {
  if (!souAdmin()) throw new Error("so-admin");
  if (destinoId !== "__novo__" && !projeto(destinoId)) throw new Error("sem-destino");
  if (ondeFoiImportada(edicao.nome).some((x) => x.projeto.id === destinoId)) throw new Error("ja-importada");
  let pid = destinoId === "__novo__" ? null : destinoId;
  if (!pid) {
    pid = criarProjeto({ nome: novoNome || edicao.nome, tipo: "colonia", status: "Aprovado", fases: edicao.fases,
      dataInicio: edicao.inicio, dataFim: edicao.fim });
  } else {
    const p = projeto(pid);
    const fases = [...(p.fases || [])];
    for (const f of edicao.fases) if (!fases.includes(f)) fases.push(f);
    const campos = { fases };
    if (!p.dataInicio && edicao.inicio) { campos.dataInicio = edicao.inicio; campos.dataFim = edicao.fim || null; }
    await atualizarProjeto(pid, campos);
    await definirTipoProjeto(pid, "colonia");
  }
  const local = coordenadorLocal(pid);
  const quem = (papel) => (papel === "direcao" ? perfil.email : papel === "local" ? (local?.id || perfil.email) : "");
  // Nunca repete: pula o que o destino já tem com o mesmo título e fase.
  const tem = new Set(tarefasDoProjeto(pid).map(chaveTarefa));
  const ops = [];
  let puladas = 0;
  edicao.tarefas.forEach((t, i) => {
    const k = chaveTarefa(t);
    if (tem.has(k)) { puladas++; return; }
    tem.add(k);
    ops.push({ tipo: "set", col: "tarefas", id: fb.novoId("tarefas"), dados: {
      titulo: t.titulo, projetoId: pid, coloniaId: pid, fase: t.fase || "", area: t.area || "",
      prazo: t.prazo || null, prazoModelo: t.prazoModelo || null, ancora: t.ancora || "", dias: t.dias ?? null,
      prioridade: "normal", status: t.status || "aFazer", responsavel: quem(t.papel), papel: t.papel || "", apoio: t.apoio || "",
      notas: t.notas || "", concluidaEm: t.status === "concluida" ? agora() : null, excluidaEm: null,
      ordemModelo: i, origem: edicao.nome,
      criadaPor: perfil.email, criadaEm: agora(), atualizadaPor: perfil.email, atualizadaEm: agora()
    } });
  });
  const p = projeto(pid);
  ops.push({ tipo: "merge", col: "projetos", id: pid, dados: {
    importacoes: [...(p?.importacoes || []), { origem: edicao.nome, em: agora(), tarefas: ops.length }]
  } });
  await gravar(fb.emLote(ops));
  return { projetoId: pid, tarefas: ops.length - 1, puladas, local: local?.nome || null };
}

const coordenadorLocal = (pid) =>
  estado.pessoas.find((x) => x.ativo !== false && x.papel !== "admin" && (x.colonias || []).includes(pid)) || null;

// ---------------- Tarefas repetidas ----------------
// Tarefas com o mesmo título na mesma fase. Fica a que andou mais (concluída > em andamento >
// aguardando > a fazer); no empate, a mexida por último. As outras vão para a lixeira.
const PESO_STATUS = { concluida: 0, naoSeAplica: 1, andamento: 2, aguardando: 3, aFazer: 4 };
function melhorPrimeiro(a, b) {
  return (PESO_STATUS[a.status] ?? 4) - (PESO_STATUS[b.status] ?? 4)
    || (b.atualizadaEm || "").localeCompare(a.atualizadaEm || "")
    || (a.criadaEm || "").localeCompare(b.criadaEm || "");
}

export function repetidasDoProjeto(pid) {
  const grupos = new Map();
  for (const t of tarefasDoProjeto(pid)) {
    const k = chaveTarefa(t);
    if (!grupos.has(k)) grupos.set(k, []);
    grupos.get(k).push(t);
  }
  return [...grupos.values()].filter((g) => g.length > 1).map((g) => {
    const [fica, ...saem] = [...g].sort(melhorPrimeiro);
    return { fica, saem };
  });
}

export async function removerRepetidas(pid) {
  if (!souAdmin()) throw new Error("so-admin");
  const saem = repetidasDoProjeto(pid).flatMap((g) => g.saem);
  const quando = agora();
  await gravar(fb.emLote(saem.map((t) => ({ tipo: "merge", col: "tarefas", id: t.id,
    dados: { excluidaEm: quando, atualizadaPor: perfil.email, atualizadaEm: quando } }))));
  saem.forEach((t) => registro(t.id, "excluiu", "enviou para a lixeira (tarefa repetida)"));
  return saem.length;
}

// ---------------- Mover tarefas entre projetos ----------------
// Leva todas as tarefas (fora da lixeira) de um projeto para outro.
// pularRepetidas: o que o destino já tem com mesmo título e fase vai para a lixeira em vez de ser levado.
export function previaMover(origemId, destinoId) {
  const tem = new Set(tarefasDoProjeto(destinoId).map(chaveTarefa));
  const ts = tarefasDoProjeto(origemId);
  const repetidas = ts.filter((t) => tem.has(chaveTarefa(t))).length;
  return { total: ts.length, repetidas };
}

export async function moverTarefas(origemId, destinoId, { pularRepetidas = true, excluirOrigem = false } = {}) {
  if (!souAdmin()) throw new Error("so-admin");
  const de = projeto(origemId), para = projeto(destinoId);
  if (!de || !para || origemId === destinoId) throw new Error("destino");
  const coloniaId = coloniaDe(destinoId);
  const local = coordenadorLocal(destinoId);
  const tem = new Set(tarefasDoProjeto(destinoId).map(chaveTarefa));
  const quando = agora();
  const ops = [], movidas = [], repetidas = [];
  for (const t of tarefasDoProjeto(origemId)) {
    const k = chaveTarefa(t);
    if (pularRepetidas && tem.has(k)) {
      repetidas.push(t);
      ops.push({ tipo: "merge", col: "tarefas", id: t.id, dados: { excluidaEm: quando, atualizadaPor: perfil.email, atualizadaEm: quando } });
      continue;
    }
    tem.add(k);
    movidas.push(t);
    const dados = { projetoId: destinoId, coloniaId, atualizadaPor: perfil.email, atualizadaEm: quando };
    // Tarefas da coordenação local passam para o coordenador da colônia de destino
    if (t.papel === "local" && local) dados.responsavel = local.id;
    ops.push({ tipo: "merge", col: "tarefas", id: t.id, dados });
  }
  // As fases da origem que o destino não tem passam a existir nele
  const fases = [...(para.fases || [])];
  for (const t of movidas) if (t.fase && !fases.includes(t.fase)) fases.push(t.fase);
  const camposDestino = { fases, atualizadoEm: quando };
  if (!para.dataInicio && de.dataInicio) { camposDestino.dataInicio = de.dataInicio; camposDestino.dataFim = de.dataFim || null; }
  if (de.importacoes?.length) camposDestino.importacoes = [...(para.importacoes || []), ...de.importacoes];
  ops.push({ tipo: "merge", col: "projetos", id: destinoId, dados: camposDestino });
  if (excluirOrigem) ops.push({ tipo: "merge", col: "projetos", id: origemId, dados: { excluidoEm: quando, atualizadoEm: quando } });
  await gravar(fb.emLote(ops));
  movidas.forEach((t) => registro(t.id, "mudou", `moveu de “${de.nome}” para “${para.nome}”`));
  repetidas.forEach((t) => registro(t.id, "excluiu", `enviou para a lixeira (já existia em “${para.nome}”)`));
  return { movidas: movidas.length, repetidas: repetidas.length };
}
