// Tela TAREFAS: lista única com filtros simples.
import * as D from "../dados.js";
import { esc, hoje, somarDias, normalizar } from "../util.js";
import { listaTarefas, barraRapida, ligarBarraRapida } from "../componentes/tarefa.js";
import { ICONES } from "../componentes/ui.js";

let raiz;
const filtros = { projeto: "", prazo: "", prioridade: "", status: "abertas", busca: "" };

export function montar(el) {
  raiz = el;
  el.innerHTML = `
    <header class="cabecalho"><h1>Tarefas</h1><p class="resumo" id="tar-resumo"></p></header>
    ${barraRapida()}
    <div class="filtros">
      <div class="busca">${ICONES.lupa || ""}<input type="search" class="campo" id="f-busca" placeholder="Buscar tarefa…" value="${esc(filtros.busca)}"></div>
      <select class="campo" id="f-projeto"></select>
      <select class="campo" id="f-prazo">
        <option value="">Qualquer prazo</option>
        <option value="atrasadas">Atrasadas</option>
        <option value="hoje">Hoje</option>
        <option value="semana">Próximos 7 dias</option>
        <option value="sem">Sem prazo</option>
      </select>
      <select class="campo" id="f-prioridade">
        <option value="">Qualquer prioridade</option>
        <option value="alta">Alta</option><option value="normal">Normal</option><option value="baixa">Baixa</option>
      </select>
      <select class="campo" id="f-status">
        <option value="abertas">Abertas</option>
        <option value="aFazer">A fazer</option>
        <option value="aguardando">Aguardando</option>
        <option value="concluida">Concluídas</option>
        <option value="todas">Todas</option>
      </select>
    </div>
    <div id="tar-lista"></div>`;
  ligarBarraRapida(el);
  for (const k of ["prazo", "prioridade", "status"]) {
    const s = el.querySelector(`#f-${k}`);
    s.value = filtros[k];
    s.onchange = () => { filtros[k] = s.value; atualizar(); };
  }
  el.querySelector("#f-projeto").onchange = (e) => { filtros.projeto = e.target.value; atualizar(); };
  el.querySelector("#f-busca").oninput = (e) => { filtros.busca = e.target.value; atualizar(); };
  atualizar();
}

export function atualizar() {
  if (!raiz) return;
  const sel = raiz.querySelector("#f-projeto");
  sel.innerHTML = `<option value="">Todos os projetos</option><option value="nenhum">Sem projeto</option>` +
    D.projetosAtivos().map((p) => `<option value="${p.id}">${esc(p.nome)}</option>`).join("");
  sel.value = filtros.projeto;
  if (sel.value !== filtros.projeto) { filtros.projeto = ""; sel.value = ""; }

  const h = hoje();
  const termo = normalizar(filtros.busca.trim());
  let lista = D.tarefasVivas().filter((t) => {
    if (filtros.status === "abertas" && t.status === "concluida") return false;
    if (!["abertas", "todas"].includes(filtros.status) && t.status !== filtros.status) return false;
    if (filtros.projeto === "nenhum" && t.projetoId) return false;
    if (filtros.projeto && filtros.projeto !== "nenhum" && t.projetoId !== filtros.projeto) return false;
    if (filtros.prioridade && (t.prioridade || "normal") !== filtros.prioridade) return false;
    if (filtros.prazo === "atrasadas" && !(t.prazo && t.prazo < h && t.status !== "concluida")) return false;
    if (filtros.prazo === "hoje" && t.prazo !== h) return false;
    if (filtros.prazo === "semana" && !(t.prazo && t.prazo >= h && t.prazo <= somarDias(h, 7))) return false;
    if (filtros.prazo === "sem" && t.prazo) return false;
    if (termo && !normalizar(`${t.titulo} ${t.notas || ""}`).includes(termo)) return false;
    return true;
  });

  if (filtros.status === "concluida") {
    lista.sort((a, b) => (b.concluidaEm || "").localeCompare(a.concluidaEm || ""));
    lista = lista.slice(0, 200);
  } else {
    lista = D.ordenarTarefas(lista);
  }

  raiz.querySelector("#tar-resumo").textContent = `${lista.length} tarefa${lista.length === 1 ? "" : "s"}`;
  raiz.querySelector("#tar-lista").innerHTML = lista.length
    ? listaTarefas(lista, { mostrarProjeto: true, mostrarFase: true })
    : `<div class="vazio">${ICONES.tarefas}<p>Nenhuma tarefa com esses filtros.</p></div>`;
}
