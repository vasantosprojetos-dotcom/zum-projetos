// Tela PROJETOS: lista de cartões e a página de cada projeto.
import * as D from "../dados.js";
import { esc, hoje, dataCurta, rotuloPrazo, corSuave, STATUS_PROJETO, CORES } from "../util.js";
import { listaTarefas, barraRapida, ligarBarraRapida, editarTarefa } from "../componentes/tarefa.js";
import { ICONES, abrirModal, fecharModal, abrirMenu, avisar, confirmar } from "../componentes/ui.js";

let raiz, params = {}, aba = "ativos", verConcluidas = false;

export function montar(el, p = {}) {
  raiz = el;
  params = p;
  if (p.id) montarDetalhe(); else montarLista();
}

export function atualizar() {
  if (!raiz) return;
  if (params.id) atualizarDetalhe(); else atualizarLista();
}

// ================= LISTA =================
function montarLista() {
  raiz.innerHTML = `
    <header class="cabecalho linha">
      <div><h1>Projetos</h1><p class="resumo" id="proj-resumo"></p></div>
      <button type="button" class="botao primario" id="novo-projeto">${ICONES.mais}Novo projeto</button>
    </header>
    <div class="segmentado abas" id="proj-abas">
      <button type="button" data-v="ativos">Ativos</button>
      <button type="button" data-v="arquivados">Arquivados</button>
    </div>
    <div id="proj-grade"></div>`;
  raiz.querySelector("#novo-projeto").onclick = () => editarProjeto(null);
  raiz.querySelector("#proj-abas").onclick = (e) => {
    const b = e.target.closest("button[data-v]");
    if (b) { aba = b.dataset.v; atualizarLista(); }
  };
  atualizarLista();
}

function atualizarLista() {
  const lista = aba === "ativos" ? D.projetosAtivos() : D.projetosArquivados();
  raiz.querySelectorAll("#proj-abas button").forEach((b) => b.classList.toggle("ativo", b.dataset.v === aba));
  const ativos = D.projetosAtivos();
  raiz.querySelector("#proj-resumo").textContent = `${ativos.length} projeto${ativos.length === 1 ? "" : "s"} ativo${ativos.length === 1 ? "" : "s"}`;
  raiz.querySelector("#proj-grade").innerHTML = lista.length
    ? `<div class="grade-projetos">${lista.map(cartao).join("")}</div>`
    : `<div class="vazio">${ICONES.projetos}<p>${aba === "ativos" ? "Nenhum projeto ativo. Crie o primeiro!" : "Nenhum projeto arquivado."}</p></div>`;
}

function cartao(p) {
  const pr = D.progresso(p.id);
  const pp = D.proximoPasso(p);
  const atrasadas = D.tarefasDoProjeto(p.id).filter((t) => t.status === "aFazer" && t.prazo && t.prazo < hoje()).length;
  return `
    <a class="cartao-projeto" href="#/projeto/${p.id}" style="--cor:${p.cor};--cor-suave:${corSuave(p.cor)}">
      <div class="cartao-topo">
        <span class="pilula">${esc(p.status)}</span>
        ${atrasadas ? `<span class="pilula vermelha">${atrasadas} atrasada${atrasadas > 1 ? "s" : ""}</span>` : ""}
      </div>
      <h3>${esc(p.nome)}</h3>
      <div class="barra"><div style="width:${pr.pct}%"></div></div>
      <p class="pequeno texto-suave">${pr.total ? `${pr.feitas} de ${pr.total} tarefas · ${pr.pct}%` : "Nenhuma tarefa ainda"}</p>
      <div class="proximo">
        <small>Próximo passo</small>
        <span>${pp ? esc(pp.texto) : "—"}${pp?.prazo ? ` <em class="${pp.prazo < hoje() ? "vermelho" : ""}">${esc(rotuloPrazo(pp.prazo))}</em>` : ""}</span>
      </div>
      ${p.dataEvento ? `<p class="pequeno texto-suave evento">${ICONES.calendario}Evento: ${esc(dataCurta(p.dataEvento))}</p>` : ""}
    </a>`;
}

// ================= DETALHE =================
function montarDetalhe() {
  const p = D.projeto(params.id);
  if (!p || p.excluidoEm) {
    raiz.innerHTML = `<div class="vazio"><p>Projeto não encontrado.</p><a class="botao" href="#/projetos">Ver projetos</a></div>`;
    return;
  }
  raiz.innerHTML = `
    <a class="voltar" href="#/projetos">${ICONES.voltar}Projetos</a>
    <header class="cabecalho-projeto" id="det-topo"></header>
    <div class="det-grade">
      <div class="det-principal">
        ${barraRapida({ projetoId: p.id, placeholder: `Nova tarefa em ${p.nome}…` })}
        <div class="det-barra-ferramentas">
          <h2>Tarefas por fase</h2>
          <label class="interruptor"><input type="checkbox" id="ver-concluidas" ${verConcluidas ? "checked" : ""}><span></span>Mostrar concluídas</label>
        </div>
        <div id="det-fases"></div>
      </div>
      <aside class="det-lateral">
        <section class="painel"><div class="painel-topo"><h3>${ICONES.calendario}Datas importantes</h3></div>
          <div id="det-datas"></div>
          <form class="form-linha" id="form-data">
            <input class="campo" name="titulo" placeholder="Ex.: Início das inscrições" required>
            <input class="campo" type="date" name="data" required>
            <button class="botao pequeno" type="submit">Adicionar</button>
          </form>
        </section>
        <section class="painel"><div class="painel-topo"><h3>${ICONES.pessoa}Contatos</h3>
          <button type="button" class="botao-icone" id="novo-contato" aria-label="Adicionar contato">${ICONES.mais}</button></div>
          <div id="det-contatos"></div>
        </section>
        <section class="painel"><div class="painel-topo"><h3>${ICONES.nota}Anotações</h3><small id="nota-status"></small></div>
          <textarea class="campo nota" id="det-notas" rows="7" placeholder="Combinados, ideias, observações…">${esc(p.anotacoes || "")}</textarea>
        </section>
      </aside>
    </div>`;
  ligarBarraRapida(raiz);

  raiz.querySelector("#ver-concluidas").onchange = (e) => { verConcluidas = e.target.checked; atualizarDetalhe(); };

  raiz.querySelector("#form-data").onsubmit = (e) => {
    e.preventDefault();
    const f = e.target;
    const atual = D.projeto(params.id);
    const datas = [...(atual.datas || []), { id: Math.random().toString(36).slice(2, 10), titulo: f.titulo.value.trim(), data: f.data.value }];
    D.atualizarProjeto(params.id, { datas });
    f.reset();
  };
  raiz.querySelector("#novo-contato").onclick = () => editarContato(null);

  let timer;
  const notas = raiz.querySelector("#det-notas");
  const st = raiz.querySelector("#nota-status");
  notas.oninput = () => {
    st.textContent = "Editando…";
    clearTimeout(timer);
    timer = setTimeout(() => { D.atualizarProjeto(params.id, { anotacoes: notas.value }); st.textContent = "Salvo"; }, 700);
  };

  raiz.addEventListener("click", cliqueDetalhe);
  atualizarDetalhe();
}

function cliqueDetalhe(e) {
  const b = e.target.closest("[data-det]");
  if (!b || !raiz.contains(b)) return;
  const p = D.projeto(params.id);
  const acao = b.dataset.det;
  if (acao === "editar") editarProjeto(p.id);
  else if (acao === "mais") menuProjeto(b, p);
  else if (acao === "nova-na-fase") editarTarefa(null, { projetoId: p.id, fase: b.dataset.fase });
  else if (acao === "tirar-data") D.atualizarProjeto(p.id, { datas: (p.datas || []).filter((d) => d.id !== b.dataset.id) });
  else if (acao === "editar-contato") editarContato(+b.dataset.i);
  else if (acao === "status") menuStatus(b, p);
}

function atualizarDetalhe() {
  const p = D.projeto(params.id);
  if (!p || p.excluidoEm) { location.hash = "#/projetos"; return; }
  const pr = D.progresso(p.id);
  const pp = D.proximoPasso(p);
  const topo = raiz.querySelector("#det-topo");
  if (!topo) return;
  topo.style.setProperty("--cor", p.cor);
  topo.style.setProperty("--cor-suave", corSuave(p.cor));
  topo.innerHTML = `
    <div class="linha-topo">
      <div>
        <h1><i class="ponto grande"></i>${esc(p.nome)}</h1>
        <div class="linha-pilulas">
          <button type="button" class="pilula botao-pilula" data-det="status">${esc(p.status)}${ICONES.seta}</button>
          ${p.arquivado ? `<span class="pilula">Arquivado</span>` : ""}
          ${p.dataEvento ? `<span class="texto-suave pequeno evento">${ICONES.calendario}Evento: ${esc(dataCurta(p.dataEvento))}</span>` : ""}
        </div>
      </div>
      <div class="acoes">
        <button type="button" class="botao" data-det="editar">${ICONES.lapis}Editar</button>
        <button type="button" class="botao-icone" data-det="mais" aria-label="Mais opções">${ICONES.mais3}</button>
      </div>
    </div>
    <div class="progresso-grande">
      <div class="barra grossa"><div style="width:${pr.pct}%"></div></div>
      <span>${pr.total ? `${pr.feitas} de ${pr.total} tarefas concluídas · <b>${pr.pct}%</b>` : "Nenhuma tarefa ainda"}</span>
    </div>
    <div class="proximo destaque">
      <small>Próximo passo${pp?.manual ? "" : pp ? " · automático" : ""}</small>
      <span>${pp ? esc(pp.texto) : "Adicione tarefas ou defina o próximo passo em Editar."}${pp?.prazo ? ` <em class="${pp.prazo < hoje() ? "vermelho" : ""}">${esc(rotuloPrazo(pp.prazo))}</em>` : ""}</span>
    </div>`;

  // Tarefas agrupadas por fase
  const todas = D.ordenarTarefas(D.tarefasDoProjeto(p.id));
  const fases = [...(p.fases || [])];
  const semFase = todas.filter((t) => !t.fase || !fases.includes(t.fase));
  const grupos = fases.map((f) => ({ fase: f, ts: todas.filter((t) => t.fase === f) }));
  if (semFase.length) grupos.push({ fase: "", ts: semFase });
  raiz.querySelector("#det-fases").innerHTML = grupos.map(({ fase, ts }) => {
    const feitas = ts.filter((t) => t.status === "concluida").length;
    const mostrar = ts.filter((t) => verConcluidas || t.status !== "concluida");
    const completa = ts.length && feitas === ts.length;
    return `<section class="fase ${completa ? "completa" : ""}">
      <div class="fase-topo">
        <h3>${fase ? esc(fase) : "Sem fase"}</h3>
        <span class="contagem">${ts.length ? `${feitas}/${ts.length}` : ""}</span>
        <button type="button" class="link pequeno" data-det="nova-na-fase" data-fase="${esc(fase)}">${ICONES.mais}Tarefa</button>
      </div>
      ${mostrar.length ? listaTarefas(mostrar, { mostrarProjeto: false }) : `<p class="fase-vazia">${completa ? "Fase concluída ✓" : "Nenhuma tarefa nesta fase."}</p>`}
    </section>`;
  }).join("") || `<div class="vazio"><p>Crie fases em Editar ou adicione tarefas acima.</p></div>`;

  // Datas importantes
  const datas = [...(p.datas || [])].sort((a, b) => a.data.localeCompare(b.data));
  raiz.querySelector("#det-datas").innerHTML = datas.length ? `<ul class="lista-simples">${datas.map((d) => `
    <li class="${d.data < hoje() ? "passada" : ""}"><span class="data-tag">${esc(dataCurta(d.data))}</span><span class="flex1">${esc(d.titulo)}</span>
    <button type="button" class="botao-icone mini" data-det="tirar-data" data-id="${d.id}" aria-label="Remover data">${ICONES.x}</button></li>`).join("")}</ul>`
    : `<p class="texto-suave pequeno">Nenhuma data cadastrada.</p>`;

  // Contatos
  const cs = p.contatos || [];
  raiz.querySelector("#det-contatos").innerHTML = cs.length ? `<ul class="lista-simples contatos">${cs.map((c, i) => `
    <li><button type="button" class="contato" data-det="editar-contato" data-i="${i}">
      <b>${esc(c.nome)}</b>${c.papel ? `<small>${esc(c.papel)}</small>` : ""}
    </button>
    <span class="contato-links">
      ${c.telefone ? `<a href="tel:${esc(c.telefone.replace(/[^\d+]/g, ""))}">${esc(c.telefone)}</a>` : ""}
      ${c.email ? `<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>` : ""}
    </span></li>`).join("")}</ul>`
    : `<p class="texto-suave pequeno">Nenhum contato. Toque em + para adicionar.</p>`;

  // Anotações: só atualiza se você não estiver digitando
  const notas = raiz.querySelector("#det-notas");
  if (notas && document.activeElement !== notas && notas.value !== (p.anotacoes || "")) notas.value = p.anotacoes || "";
}

function menuStatus(ancora, p) {
  abrirMenu(ancora, STATUS_PROJETO.map((s) => ({
    rotulo: s, icone: s === p.status ? ICONES.check : `<span class="icone-vazio"></span>`,
    fn: () => { D.atualizarProjeto(p.id, { status: s }); avisar(`Status: ${s}`); }
  })));
}

function menuProjeto(ancora, p) {
  abrirMenu(ancora, [
    { rotulo: "Editar projeto", icone: ICONES.lapis, fn: () => editarProjeto(p.id) },
    { rotulo: p.arquivado ? "Desarquivar" : "Arquivar", icone: ICONES.arquivo, fn: () => {
      D.arquivarProjeto(p.id, !p.arquivado);
      avisar(p.arquivado ? "Projeto de volta aos ativos" : "Projeto arquivado", { rotulo: "Desfazer", fn: () => D.arquivarProjeto(p.id, p.arquivado) });
    } },
    { separador: true },
    { rotulo: "Excluir projeto", icone: ICONES.lixo, perigo: true, fn: () => excluir(p) }
  ]);
}

async function excluir(p) {
  const ok = await confirmar({
    titulo: "Excluir projeto?",
    texto: `"${p.nome}" e as tarefas dele vão para a lixeira. Você pode recuperar em Ajustes por 30 dias.`,
    botao: "Excluir", perigo: true
  });
  if (!ok) return;
  D.excluirProjeto(p.id);
  location.hash = "#/projetos";
  avisar("Projeto enviado para a lixeira", { rotulo: "Desfazer", fn: () => D.restaurar("projeto", p.id) });
}

// ================= EDITORES =================
export function editarProjeto(id) {
  const p = id ? D.projeto(id) : { nome: "", cor: null, status: "Em negociação", fases: ["Planejamento", "Execução", "Pós-evento"], proximoPasso: "" };
  const usadas = new Set(D.todosProjetos().map((x) => x.cor));
  const corInicial = p.cor || (CORES.find((c) => !usadas.has(c.hex)) || CORES[0]).hex;
  abrirModal({
    titulo: id ? "Editar projeto" : "Novo projeto",
    corpo: `
      <form class="formulario" id="form-projeto" autocomplete="off">
        <label>Nome<input class="campo campo-grande" name="nome" value="${esc(p.nome)}" placeholder="Ex.: Colônia Loyola – Jul/2027" required ${id ? "" : "autofocus"}></label>
        <label>Cor
          <div class="cores">${CORES.map((c) => `<button type="button" class="cor ${c.hex === corInicial ? "ativo" : ""}" data-cor="${c.hex}" style="--c:${c.hex}" aria-label="${c.nome}" title="${c.nome}"></button>`).join("")}</div>
        </label>
        <div class="grade-2">
          <label>Status<select class="campo" name="status">${STATUS_PROJETO.map((s) => `<option ${s === p.status ? "selected" : ""}>${s}</option>`).join("")}</select></label>
          <label>Data do evento<input class="campo" type="date" name="dataEvento" value="${p.dataEvento || ""}"></label>
        </div>
        <label>Fases <small class="texto-suave">uma por linha, na ordem em que acontecem</small>
          <textarea class="campo" name="fases" rows="5">${esc((p.fases || []).join("\n"))}</textarea></label>
        <label>Próximo passo <small class="texto-suave">deixe em branco para o app mostrar a próxima tarefa</small>
          <input class="campo" name="proximoPasso" value="${esc(p.proximoPasso || "")}" placeholder="Ex.: Aguardar retorno da coordenação"></label>
      </form>`,
    rodape: `<span class="espaco"></span><button type="button" class="botao" data-cancelar>Cancelar</button>
             <button type="submit" form="form-projeto" class="botao primario">${id ? "Salvar" : "Criar projeto"}</button>`,
    aoMontar(m) {
      let cor = corInicial;
      m.querySelector(".cores").onclick = (e) => {
        const b = e.target.closest("[data-cor]");
        if (!b) return;
        cor = b.dataset.cor;
        m.querySelectorAll(".cor").forEach((x) => x.classList.toggle("ativo", x === b));
      };
      m.querySelector("[data-cancelar]").onclick = fecharModal;
      const f = m.querySelector("form");
      f.onsubmit = (e) => {
        e.preventDefault();
        const nome = f.nome.value.trim();
        if (!nome) return;
        const campos = {
          nome, cor, status: f.status.value, dataEvento: f.dataEvento.value || null,
          fases: f.fases.value.split("\n").map((s) => s.trim()).filter(Boolean),
          proximoPasso: f.proximoPasso.value.trim()
        };
        fecharModal();
        if (id) { D.atualizarProjeto(id, campos); avisar("Projeto salvo"); }
        else { const novo = D.criarProjeto(campos); location.hash = `#/projeto/${novo}`; avisar("Projeto criado"); }
      };
    }
  });
}

function editarContato(i) {
  const p = D.projeto(params.id);
  const c = i === null ? {} : p.contatos[i];
  abrirModal({
    titulo: i === null ? "Novo contato" : "Contato",
    largura: "estreita",
    corpo: `<form class="formulario" id="form-contato" autocomplete="off">
      <label>Nome<input class="campo" name="nome" value="${esc(c.nome || "")}" required autofocus></label>
      <label>Função / instituição<input class="campo" name="papel" value="${esc(c.papel || "")}" placeholder="Ex.: Coordenação pedagógica"></label>
      <label>Telefone<input class="campo" name="telefone" type="tel" value="${esc(c.telefone || "")}"></label>
      <label>E-mail<input class="campo" name="email" type="email" value="${esc(c.email || "")}"></label>
    </form>`,
    rodape: `${i !== null ? `<button type="button" class="botao texto perigo" data-tirar>${ICONES.lixo}Remover</button>` : ""}<span class="espaco"></span>
      <button type="button" class="botao" data-cancelar>Cancelar</button><button type="submit" form="form-contato" class="botao primario">Salvar</button>`,
    aoMontar(m) {
      m.querySelector("[data-cancelar]").onclick = fecharModal;
      const tirar = m.querySelector("[data-tirar]");
      if (tirar) tirar.onclick = () => {
        D.atualizarProjeto(p.id, { contatos: p.contatos.filter((_, j) => j !== i) });
        fecharModal();
      };
      const f = m.querySelector("form");
      f.onsubmit = (e) => {
        e.preventDefault();
        const novo = { nome: f.nome.value.trim(), papel: f.papel.value.trim(), telefone: f.telefone.value.trim(), email: f.email.value.trim() };
        const contatos = [...(p.contatos || [])];
        if (i === null) contatos.push(novo); else contatos[i] = novo;
        D.atualizarProjeto(p.id, { contatos });
        fecharModal();
      };
    }
  });
}
