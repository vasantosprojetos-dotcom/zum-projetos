// Tela HOJE: o que fazer hoje, o que atrasou e o que vem nos próximos 7 dias.
import * as D from "../dados.js";
import { esc, hoje, somarDias, dataLonga, saudacao, tituloDia, STATUS_ATIVOS, situacaoEvento, rotuloPeriodo, dataCurta } from "../util.js";
import { listaTarefas, barraRapida, ligarBarraRapida } from "../componentes/tarefa.js";
import { ICONES } from "../componentes/ui.js";

let raiz;

export function montar(el) {
  raiz = el;
  el.innerHTML = `
    <header class="cabecalho">
      <p class="sobretitulo">${esc(dataLonga())}</p>
      <h1>${saudacao()}, ${esc((D.eu()?.nome || "").split(" ")[0])}</h1>
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
  const eu = D.eu()?.email;
  const todasVivas = D.tarefasVivas().filter(D.aberta);
  const vivas = todasVivas.filter((t) => !t.responsavel || t.responsavel === eu);
  const daEquipe = D.ordenarTarefas(todasVivas.filter((t) => t.responsavel && t.responsavel !== eu && D.naMao(t) && t.prazo && t.prazo <= fim));
  const aFazer = vivas.filter(D.naMao);
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
  if (daEquipe.length) {
    const atrasEq = daEquipe.filter((t) => t.prazo < h).length;
    html += `<details class="secao recolhivel"><summary><h2>Com a equipe</h2><span class="contagem">${daEquipe.length}</span>${atrasEq ? `<span class="pilula vermelha">${atrasEq} atrasada${atrasEq > 1 ? "s" : ""}</span>` : ""}${ICONES.seta}</summary>
      <p class="texto-suave pequeno">Tarefas de outras pessoas que vencem até ${esc(tituloDia(fim).toLowerCase())}.</p>
      ${listaTarefas(daEquipe, { mostrarResponsavel: true })}</details>`;
  }
  if (D.souAdmin()) html = painelTemporada() + html;
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

// ---------- Painel da temporada (só a Vanessa) ----------
let painelAberto = true;
try { painelAberto = localStorage.getItem("zum-painel") !== "fechado"; } catch {}
document.addEventListener("toggle", (e) => {
  if (e.target.id === "painel-temporada") try { localStorage.setItem("zum-painel", e.target.open ? "aberto" : "fechado"); } catch {}
}, true);

function painelTemporada() {
  const eds = D.edicoesEmAndamento();
  if (!eds.length) return "";
  const h = hoje();
  const semanas = D.cargaPorSemana(10);
  const max = Math.max(D.LIMITE_SEMANA_PESADA, ...semanas.map((s) => s.total));
  const pesadas = semanas.filter((s) => s.total >= D.LIMITE_SEMANA_PESADA).length;
  const linhas = eds.map((e) => {
    const faltam = e.inicio > h ? `${e.faltam} dia${e.faltam === 1 ? "" : "s"}` : e.fim >= h ? "acontecendo" : "encerrada";
    return `<a class="painel-linha" href="#/projeto/${e.p.id}" style="--cor:${e.p.cor}">
      <span class="pl-nome"><i class="ponto"></i><b>${esc(e.p.nome)}</b><small>${esc(e.edicao || "")}${e.edicao ? " · " : ""}${esc(dataCurta(e.inicio))}${e.fim !== e.inicio ? ` a ${esc(dataCurta(e.fim))}` : ""}</small></span>
      <span class="pl-num"><b>${esc(faltam)}</b><small>para começar</small></span>
      <span class="pl-barra"><div class="barra"><div style="width:${e.pct}%"></div></div><small>${e.feitas}/${e.total} · ${e.pct}%</small></span>
      <span class="pl-num ${e.atrasadas ? "vermelho" : ""}"><b>${e.atrasadas}</b><small>atrasadas</small></span>
      <span class="pl-num"><b>${e.semana}</b><small>esta semana</small></span>
    </a>`;
  }).join("");
  const nomes = Object.fromEntries(D.colonias().map((c) => [c.id, c.nome]));
  const barras = semanas.map((s, i) => {
    const pesada = s.total >= D.LIMITE_SEMANA_PESADA;
    const det = Object.entries(s.porColonia).sort((a, b) => b[1] - a[1]).map(([id, n]) => `${nomes[id] || "?"}: ${n}`).join("\n");
    const exec = s.emExecucao.map((c) => c.nome).join(", ");
    return `<div class="carga-semana ${pesada ? "pesada" : ""}" title="${esc(det || "Nenhuma tarefa")}">
      <span class="carga-rotulo">${i === 0 ? "Esta semana" : esc(dataCurta(s.de))}</span>
      <span class="carga-trilho"><span style="width:${Math.round((s.total / max) * 100)}%"></span></span>
      <b>${s.total}</b>
      <small class="carga-exec">${exec ? `${ICONES.calendario}${esc(exec)}` : ""}</small>
    </div>`;
  }).join("");
  return `<details class="secao recolhivel painel-temporada" id="painel-temporada" ${painelAberto ? "open" : ""}>
    <summary><h2>Painel da temporada</h2><span class="contagem">${eds.length}</span>${pesadas ? `<span class="pilula vermelha">${pesadas} semana${pesadas > 1 ? "s" : ""} pesada${pesadas > 1 ? "s" : ""}</span>` : ""}${ICONES.seta}</summary>
    <div class="painel-linhas">${linhas}</div>
    <h3 class="carga-titulo">Carga por semana <small class="texto-suave">tarefas abertas que vencem em cada semana, somando as colônias · vermelho = ${D.LIMITE_SEMANA_PESADA} ou mais (redistribuir ou antecipar)</small></h3>
    <div class="carga">${barras}</div>
  </details>`;
}
