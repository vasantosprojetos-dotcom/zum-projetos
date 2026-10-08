// Backup: cópia automática semanal dentro do Firebase, download em JSON e restauração.
import * as fb from "./firebase.js";
import { instantaneo } from "./dados.js";
import { agora, hoje, diasEntre } from "./util.js";

const MANTER = 8;          // quantas cópias automáticas guardar
const INTERVALO_DIAS = 7;  // de quanto em quanto tempo fazer a cópia automática

function pacote() {
  const { projetos, tarefas } = instantaneo();
  return { app: "zum-projetos", versao: 1, exportadoEm: agora(), projetos, tarefas };
}

export async function fazerCopia(tipo = "manual") {
  const dados = JSON.stringify(pacote());
  if (dados.length > 900000) throw new Error("grande-demais");
  const id = fb.novoId("backups");
  const { projetos, tarefas } = instantaneo();
  await fb.substituir("backups", id, {
    criadoEm: agora(), tipo, dados,
    resumo: { projetos: projetos.length, tarefas: tarefas.length }
  });
  await fb.salvar("config", "backup", { ultimaCopia: agora() });
  await podar();
  return id;
}

async function podar() {
  const lista = await listarCopias();
  const sobras = lista.slice(MANTER);
  for (const c of sobras) await fb.remover("backups", c.id);
}

export async function listarCopias() {
  const lista = await fb.ler("backups");
  return lista.sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
}

// Chamada ao abrir o app: faz a cópia se a última tiver 7 dias ou mais.
export async function copiaAutomaticaSePreciso() {
  try {
    const cfg = await fb.lerUm("config", "backup");
    const ultima = cfg?.ultimaCopia?.slice(0, 10);
    if (!ultima || diasEntre(ultima, hoje()) >= INTERVALO_DIAS) await fazerCopia("automática");
  } catch (e) {
    console.warn("Cópia automática adiada:", e);
  }
}

export async function infoBackup() {
  return (await fb.lerUm("config", "backup").catch(() => null)) || {};
}

export function baixarArquivo() {
  const blob = new Blob([JSON.stringify(pacote(), null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `zum-projetos-backup-${hoje()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  fb.salvar("config", "backup", { ultimoDownload: agora() }).catch(() => {});
}

export function validar(obj) {
  return obj && obj.app === "zum-projetos" && Array.isArray(obj.projetos) && Array.isArray(obj.tarefas);
}

// Substitui tudo pelo conteúdo do backup. Antes, guarda uma cópia do estado atual.
export async function restaurar(obj) {
  if (!validar(obj)) throw new Error("arquivo-invalido");
  await fazerCopia("antes de restaurar");
  const atual = instantaneo();
  const ops = [];
  const limpar = (item) => { const { id, ...resto } = item; return resto; };
  const novosP = new Set(obj.projetos.map((p) => p.id));
  const novosT = new Set(obj.tarefas.map((t) => t.id));
  atual.projetos.filter((p) => !novosP.has(p.id)).forEach((p) => ops.push({ tipo: "delete", col: "projetos", id: p.id }));
  atual.tarefas.filter((t) => !novosT.has(t.id)).forEach((t) => ops.push({ tipo: "delete", col: "tarefas", id: t.id }));
  obj.projetos.forEach((p) => ops.push({ tipo: "set", col: "projetos", id: p.id, dados: limpar(p) }));
  obj.tarefas.forEach((t) => ops.push({ tipo: "set", col: "tarefas", id: t.id, dados: limpar(t) }));
  await fb.emLote(ops);
  return { projetos: obj.projetos.length, tarefas: obj.tarefas.length };
}
