// Tela HOJE: o que fazer hoje, o que atrasou e o que vem nos próximos 7 dias.
import * as D from "../dados.js";
import { esc, hoje, somarDias, dataLonga, saudacao, tituloDia, STATUS_ATIVOS, situacaoEvento, rotuloPeriodo } from "../util.js";
import { listaTarefas, barraRapida, ligarBarraRapida } from "../componentes/tarefa.js";
import { ICONES } from "../componentes/ui.js";

let raiz;

export function montar(el) {
  raiz = el;
  el.innerHTML = `
    <header class="cabecalho">
      <p class="sobretitulo">${esc(dataLonga())}</p>
      <h1>${saudacao()}, Vanessa</h1>
      <p class="resumo" id="hoje-resumo"></p>
    </header>
    ${barraRapida({ prazoHoje: true, placeholder: "Nova tarefa para hoje… (Enter para adicionar)" })}
    <div class="hoje-grade">
      <div class="hoje-principal" id="hoje-tarefas"></div>
      <aside class="hoje-lateral" id="hoje-projetos"></aside>
    </div>`;
  ligarBarraRapida(el);
  atualizar();
}

export function atualizar() {
  if (!raiz) return;
  const h = hoje();
  const fim = somarDias(h, 7);
  const vivas = D.tarefasVivas().filter(D.aberta);
  const aFazer = vivas.filter((t) => t.status === "aFazer");
  const atrasadas = D.ordenarTarefas(aFazer.filter((t) => t.prazo && t.prazo < h));
  const deHoje = D.ordenarTarefas(aFazer.filter((t) => t.prazo === h));
  const semana = D.ordenarTarefas(aFazer.filter((t) => t.prazo && t.prazo > h && t.prazo <= fim));
  const aguardando = D.ordenarTarefas(vivas.filter((t) => t.status === "aguardando"));
  const datas = D.datasImportantes(h, fim);

  // Resumo de 10 segundos
  const partes = [];
  if (atrasadas.length) partes.push(`<b class="vermelho">${atrasadas.length} atrasada${atrasadas.length > 1 ? "s" : ""}</b>`);
  partes.push(`<b>${deHoje.length}</b> para hoje`);
  partes.push(`<b>${semana.length}</b> nos próximos 7 dias`);
  raiz.querySelector("#hoje-resumo").innerHTML = partes.join(" · ");

  let html = "";
  const andamento = D.eventosEmAndamento();
  if (andamento.length) {
    html += `<div class="em-andamento">${andamento.map((p) => `
      <a class="faixa-evento" href="#/projeto/${p.id}" style="--cor:${p.cor}">
        <i class="ponto"></i><b>${esc(p.nome)}</b><span>${esc(situacaoEvento(p).texto)} · ${esc(rotuloPeriodo(p))}</span>
      </a>`).join("")}</div>`;
  }
  if (atrasadas.length) {
    html += secao("Atrasadas", listaTarefas(atrasadas), "atrasadas", atrasadas.length);
  }
  html += secao("Hoje",
    deHoje.length ? listaTarefas(deHoje) + datasDoDia(datas, h)
      : datasDoDia(datas, h) + `<div class="vazio">${ICONES.check}<p>${atrasadas.length ? "Nada novo para hoje. Que tal resolver as atrasadas?" : "Tudo em dia por hoje."}</p></div>`,
    "", deHoje.length);

  // Próximos 7 dias, agrupados por dia
  let dias = "";
  for (let i = 1; i <= 7; i++) {
    const d = somarDias(h, i);
    const ts = semana.filter((t) => t.prazo === d);
    const ds = datas.filter((x) => x.data === d);
    if (!ts.length && !ds.length) continue;
    dias += `<div class="dia"><h3>${esc(tituloDia(d))}</h3>${datasDoDia(datas, d)}${ts.length ? listaTarefas(ts) : ""}</div>`;
  }
  html += secao("Próximos 7 dias", dias || `<p class="texto-suave pequeno">Nada marcado para os próximos dias.</p>`, "", semana.length);

  if (aguardando.length) {
    html += `<details class="secao recolhivel"><summary><h2>Aguardando resposta</h2><span class="contagem">${aguardando.length}</span>${ICONES.seta}</summary>
      ${listaTarefas(aguardando)}</details>`;
  }
  raiz.querySelector("#hoje-tarefas").innerHTML = html;
  raiz.querySelector("#hoje-projetos").innerHTML = resumoProjetos();
}

function secao(titulo, conteudo, classe = "", contagem) {
  return `<section class="secao ${classe}"><div class="secao-topo"><h2>${titulo}</h2>${contagem ? `<span class="contagem">${contagem}</span>` : ""}</div>${conteudo}</section>`;
}

function datasDoDia(datas, d) {
  return datas.filter((x) => x.data === d).map((x) => `
    <a class="data-importante ${x.evento ? "evento-marco" : ""}" href="#/projeto/${x.projeto.id}" style="--cor:${x.projeto.cor}">
      ${ICONES.calendario}<span><b>${esc(x.titulo)}</b><small>${esc(x.projeto.nome)}</small></span>
    </a>`).join("");
}

function resumoProjetos() {
  const ps = D.projetosAtivos().filter((p) => STATUS_ATIVOS.includes(p.status));
  if (!ps.length) return "";
  return `<section class="secao"><div class="secao-topo"><h2>Seus projetos</h2><a href="#/projetos" class="link">Ver todos</a></div>
    <div class="mini-projetos">${ps.map((p) => {
      const pr = D.progresso(p.id);
      const pp = D.proximoPasso(p);
      return `<a class="mini-projeto" href="#/projeto/${p.id}" style="--cor:${p.cor}">
        <div class="mini-topo"><i class="ponto"></i><b>${esc(p.nome)}</b><span>${pr.total ? pr.pct + "%" : ""}</span></div>
        <div class="barra"><div style="width:${pr.pct}%"></div></div>
        <small>${pp ? esc(pp.texto) : "Sem próximo passo definido"}</small>
      </a>`;
    }).join("")}</div></section>`;
}
