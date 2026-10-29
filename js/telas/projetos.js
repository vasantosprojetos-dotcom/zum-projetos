// Tela PROJETOS: lista de cartões e a página de cada projeto.
import * as D from "../dados.js";
import { esc, normalizar, hoje, dataCurta, rotuloPrazo, corSuave, STATUS_PROJETO, CORES, periodo, rotuloPeriodo, situacaoEvento } from "../util.js";
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
      ${D.souAdmin() ? `<button type="button" class="botao primario" id="novo-projeto">${ICONES.mais}Novo projeto</button>` : ""}
    </header>
    <div class="segmentado abas" id="proj-abas">
      <button type="button" data-v="ativos">Ativos</button>
      <button type="button" data-v="arquivados">Arquivados</button>
    </div>
    <div id="proj-grade"></div>`;
  const novo = raiz.querySelector("#novo-projeto");
  if (novo) novo.onclick = () => editarProjeto(null);
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
  const grade = (ps) => `<div class="grade-projetos">${ps.map(cartao).join("")}</div>`;
  const cols = lista.filter((p) => p.tipo === "colonia");
  const outros = lista.filter((p) => p.tipo !== "colonia");
  const grupos = [...new Set(cols.map((p) => p.grupo || ""))].sort((a, b) => (a ? 1 : 0) - (b ? 1 : 0) || a.localeCompare(b, "pt-BR"));
  const blocoColonias = grupos.map((g) => {
    const ps = cols.filter((p) => (p.grupo || "") === g);
    return `<section class="grupo-projetos"><h2>${esc(g || "Colônias")}</h2>${grade(ps)}</section>`;
  }).join("");
  const blocoOutros = outros.length ? `<section class="grupo-projetos"><h2>${cols.length ? "Outros projetos" : "Projetos"}</h2>${grade(outros)}</section>` : "";
  raiz.querySelector("#proj-grade").innerHTML = lista.length
    ? blocoColonias + blocoOutros
    : `<div class="vazio">${ICONES.projetos}<p>${aba === "ativos" ? "Nenhum projeto ativo. Crie o primeiro!" : "Nenhum projeto arquivado."}</p></div>`;
}

function cartao(p) {
  const pr = D.progresso(p.id);
  const pp = D.proximoPasso(p);
  const atrasadas = D.tarefasDoProjeto(p.id).filter((t) => D.naMao(t) && t.prazo && t.prazo < hoje()).length;
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
      ${linhaEvento(p, "p")}
    </a>`;
}

function linhaEvento(p, tag) {
  const r = rotuloPeriodo(p);
  if (!r) return "";
  const sit = situacaoEvento(p);
  const selo = sit && sit.tipo !== "depois" ? ` <b class="selo-evento ${sit.tipo}">${esc(sit.texto)}</b>` : "";
  return `<${tag} class="pequeno texto-suave evento">${ICONES.calendario}Evento: ${esc(r)}${sit && sit.dias > 1 ? ` · ${sit.dias} dias` : ""}${selo}</${tag}>`;
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
        <section class="painel" id="det-edicoes-painel" hidden><div class="painel-topo"><h3>${ICONES.calendario}Edições</h3></div>
          <div id="det-edicoes"></div>
        </section>
        <section class="painel" id="det-equipe-painel" hidden><div class="painel-topo"><h3>${ICONES.pessoa}Equipe</h3></div>
          <div id="det-equipe"></div>
        </section>
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
  else if (acao === "nova-edicao") novaEdicao(p);
  else if (acao === "ver-edicao") verEdicao(p, b.dataset.nome);
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
          ${p.tipo === "colonia" ? `<span class="pilula">${esc(p.grupo ? `Colônia · ${p.grupo}` : "Colônia")}</span>` : ""}
          ${p.arquivado ? `<span class="pilula">Arquivado</span>` : ""}
          ${linhaEvento(p, "span")}
        </div>
      </div>
      <div class="acoes">
        ${D.souAdmin() && p.tipo === "colonia" ? `<button type="button" class="botao" data-det="nova-edicao">${ICONES.mais}Nova edição</button>` : ""}
        <button type="button" class="botao" data-det="editar">${ICONES.lapis}Editar</button>
        ${D.souAdmin() ? `<button type="button" class="botao-icone" data-det="mais" aria-label="Mais opções">${ICONES.mais3}</button>` : ""}
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

  // Edições da colônia
  const painelEd = raiz.querySelector("#det-edicoes-painel");
  const anteriores = D.edicoesAnteriores(p);
  const atual = D.nomeEdicaoAtual(p);
  if (p.tipo === "colonia" && (atual || anteriores.length)) {
    painelEd.hidden = false;
    raiz.querySelector("#det-edicoes").innerHTML = `<ul class="lista-simples">
      ${atual ? `<li><span class="flex1"><b>${esc(atual)}</b><br><small class="texto-suave">em andamento${rotuloPeriodo(p) ? ` · ${esc(rotuloPeriodo(p))}` : ""}</small></span><span class="pilula">atual</span></li>` : ""}
      ${anteriores.map((e) => `<li><button type="button" class="contato" data-det="ver-edicao" data-nome="${esc(e.nome)}">
        <b>${esc(e.nome)}</b><small>${e.inicio ? esc(dataCurta(e.inicio)) + (e.fim && e.fim !== e.inicio ? ` a ${esc(dataCurta(e.fim))}` : "") + " · " : ""}${e.feitas}/${e.total} concluídas · encerrada</small></button></li>`).join("")}
    </ul>`;
  } else painelEd.hidden = true;

  // Equipe da colônia
  const painelEq = raiz.querySelector("#det-equipe-painel");
  if (p.tipo === "colonia") {
    const eq = D.equipeDoProjeto(p.id);
    painelEq.hidden = false;
    raiz.querySelector("#det-equipe").innerHTML = `<ul class="lista-simples">${eq.map((x) => `<li><span class="flex1"><b>${esc(x.nome || x.id)}</b></span><small class="texto-suave">${x.papel === "admin" ? "direção" : "coordenação"}</small></li>`).join("")}</ul>`
      + (D.souAdmin() ? `<p class="texto-suave pequeno">Quem vê esta colônia é definido em Ajustes → Equipe.</p>` : "");
  } else painelEq.hidden = true;

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
    { rotulo: "Remover tarefas repetidas", icone: ICONES.duplicadas, fn: () => removerRepetidas(p) },
    { rotulo: "Mover tarefas para outro projeto", icone: ICONES.mover, fn: () => moverTarefas(p) },
    ...(D.unidadesDaRede(p.id).length ? [{ rotulo: "Organizar checklist da rede", icone: ICONES.projetos, fn: () => organizarRede(p) }] : []),
    { separador: true },
    { rotulo: "Excluir projeto", icone: ICONES.lixo, perigo: true, fn: () => excluir(p) }
  ]);
}

// ---------- Remover tarefas repetidas ----------
const PESO_ROTULO = { concluida: "concluída", andamento: "em andamento", aguardando: "aguardando", naoSeAplica: "não se aplica", aFazer: "a fazer" };
function removerRepetidas(p) {
  const grupos = D.repetidasDoProjeto(p.id);
  if (!grupos.length) { avisar("Nenhuma tarefa repetida neste projeto."); return; }
  const total = grupos.reduce((n, g) => n + g.saem.length, 0);
  abrirModal({
    titulo: "Remover tarefas repetidas",
    corpo: `<p class="texto-suave">Encontrei <b>${grupos.length}</b> tarefa${grupos.length > 1 ? "s" : ""} com cópia (mesmo nome na mesma fase). Fica uma de cada: a que andou mais ou foi mexida por último. As <b>${total}</b> cópias vão para a lixeira e podem ser recuperadas em Ajustes por 30 dias.</p>
      <ul class="lista-simples lista-rolavel">${grupos.map((g) => `
        <li><span class="flex1">${esc(g.fica.titulo)}<br><small class="texto-suave">${esc(g.fica.fase || "Sem fase")} · fica a ${esc(PESO_ROTULO[g.fica.status] || "a fazer")}</small></span>
        <span class="pilula">${g.saem.length + 1}×</span></li>`).join("")}</ul>`,
    rodape: `<span class="espaco"></span><button type="button" class="botao" data-cancelar>Cancelar</button>
      <button type="button" class="botao perigo" data-ok>Remover ${total} cópia${total > 1 ? "s" : ""}</button>`,
    aoMontar(m) {
      m.querySelector("[data-cancelar]").onclick = fecharModal;
      const ok = m.querySelector("[data-ok]");
      ok.onclick = async () => {
        ok.disabled = true;
        try {
          const n = await D.removerRepetidas(p.id);
          fecharModal();
          avisar(`${n} cópia${n > 1 ? "s" : ""} enviada${n > 1 ? "s" : ""} para a lixeira`);
        } catch { ok.disabled = false; }
      };
    }
  });
}

// ---------- Mover todas as tarefas ----------
function moverTarefas(p) {
  const total = D.tarefasDoProjeto(p.id).length;
  if (!total) { avisar("Este projeto não tem tarefas para mover."); return; }
  const outros = D.todosProjetos().filter((x) => x.id !== p.id);
  // Projetos com nome parecido aparecem primeiro (é o caso das colônias criadas em dobro)
  const base = (n) => normalizar(n.split(/[–—]| - /)[0]).replace(/\(.*?\)/g, "").replace(/\s+/g, " ").trim();
  const minha = base(p.nome);
  const parecidos = outros.filter((x) => { const b = base(x.nome); return b.length > 3 && minha.length > 3 && (b.includes(minha) || minha.includes(b)); });
  const resto = outros.filter((x) => !parecidos.includes(x));
  const opcao = (x) => `<option value="${x.id}">${esc(x.nome)}${x.tipo === "colonia" ? " (colônia)" : ""}${x.arquivado ? " · arquivado" : ""}</option>`;
  abrirModal({
    titulo: "Mover tarefas",
    corpo: `<form class="formulario" id="form-mover">
      <p class="texto-suave">Leva as <b>${total}</b> tarefas de “${esc(p.nome)}” para outro projeto, com comentários e histórico.</p>
      <label>Para qual projeto?<select class="campo" name="destino" required>
        <option value="" selected disabled>Escolha o projeto…</option>
        ${parecidos.length ? `<optgroup label="Com nome parecido">${parecidos.map(opcao).join("")}</optgroup><optgroup label="Outros">${resto.map(opcao).join("")}</optgroup>` : outros.map(opcao).join("")}
      </select></label>
      <p class="pequeno" id="mover-previa"></p>
      <label class="interruptor"><input type="checkbox" name="pular" checked><span></span>Não levar tarefas que o destino já tem (vão para a lixeira)</label>
      <label class="interruptor"><input type="checkbox" name="excluir"><span></span>Depois, enviar “${esc(p.nome)}” para a lixeira</label>
    </form>`,
    rodape: `<span class="espaco"></span><button type="button" class="botao" data-cancelar>Cancelar</button>
      <button type="submit" form="form-mover" class="botao primario">Mover tarefas</button>`,
    aoMontar(m) {
      m.querySelector("[data-cancelar]").onclick = fecharModal;
      const f = m.querySelector("form");
      const previa = m.querySelector("#mover-previa");
      const mostrar = () => {
        if (!f.destino.value) { previa.textContent = ""; return; }
        const r = D.previaMover(p.id, f.destino.value);
        const pular = f.pular.checked;
        const vao = pular ? r.total - r.repetidas : r.total;
        previa.innerHTML = `Vão <b>${vao}</b> tarefa${vao === 1 ? "" : "s"}`
          + (r.repetidas ? (pular ? ` · <b>${r.repetidas}</b> já existem lá e vão para a lixeira` : ` · <b class="vermelho">${r.repetidas}</b> ficarão repetidas no destino`) : "")
          + ".";
      };
      f.destino.onchange = mostrar;
      f.pular.onchange = mostrar;
      f.onsubmit = async (e) => {
        e.preventDefault();
        const destino = f.destino.value;
        if (!destino) return;
        const botao = m.querySelector('[form="form-mover"]');
        botao.disabled = true;
        try {
          const r = await D.moverTarefas(p.id, destino, { pularRepetidas: f.pular.checked, excluirOrigem: f.excluir.checked });
          const sair = f.excluir.checked;
          fecharModal();
          if (sair) location.hash = `#/projeto/${destino}`;
          avisar(`${r.movidas} tarefa${r.movidas === 1 ? "" : "s"} movida${r.movidas === 1 ? "" : "s"}${r.repetidas ? ` · ${r.repetidas} repetida${r.repetidas === 1 ? "" : "s"} na lixeira` : ""}`);
        } catch { botao.disabled = false; }
      };
    }
  });
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
        ${D.souAdmin() ? `<div class="grade-2">
          <label>Tipo<select class="campo" name="tipo">
            <option value="colonia" ${p.tipo === "colonia" ? "selected" : ""}>Colônia (a equipe pode ver)</option>
            <option value="avulso" ${p.tipo !== "colonia" ? "selected" : ""}>Projeto avulso (só você)</option>
          </select></label>
          <label>Grupo <small class="texto-suave">opcional</small><input class="campo" name="grupo" list="lista-grupos" value="${esc(p.grupo || "")}" placeholder="Ex.: Rede Santa Maria">
            <datalist id="lista-grupos">${[...new Set(D.todosProjetos().map((x) => x.grupo).filter(Boolean))].map((g) => `<option value="${esc(g)}">`).join("")}</datalist></label>
        </div>` : ""}
        <div class="grade-2">
          <label>Status<select class="campo" name="status">${STATUS_PROJETO.map((s) => `<option ${s === p.status ? "selected" : ""}>${s}</option>`).join("")}</select></label>
          <span></span>
          <label>Início do evento<input class="campo" type="date" name="dataInicio" value="${periodo(p)?.ini || ""}"></label>
          <label>Fim do evento<input class="campo" type="date" name="dataFim" value="${(p.dataFim && periodo(p)?.fim) || ""}"></label>
        </div>
        <small class="texto-suave dica-periodo">Colônias e eventos de vários dias: preencha início e fim. Se for um dia só, deixe o fim vazio.</small>
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
      // ao escolher o início, o fim não pode ficar antes dele
      f.dataInicio.onchange = () => {
        f.dataFim.min = f.dataInicio.value;
        if (f.dataFim.value && f.dataFim.value < f.dataInicio.value) f.dataFim.value = f.dataInicio.value;
      };
      if (f.dataInicio.value) f.dataFim.min = f.dataInicio.value;
      f.onsubmit = (e) => {
        e.preventDefault();
        const nome = f.nome.value.trim();
        if (!nome) return;
        const campos = {
          nome, cor, status: f.status.value,
          dataInicio: f.dataInicio.value || null,
          dataFim: f.dataInicio.value && f.dataFim.value && f.dataFim.value > f.dataInicio.value ? f.dataFim.value : null,
          dataEvento: null,
          fases: f.fases.value.split("\n").map((s) => s.trim()).filter(Boolean),
          proximoPasso: f.proximoPasso.value.trim()
        };
        const tipo = f.tipo ? f.tipo.value : null;
        if (f.grupo) campos.grupo = f.grupo.value.trim();
        fecharModal();
        if (id) {
          D.atualizarProjeto(id, campos);
          if (tipo) D.definirTipoProjeto(id, tipo);
          avisar("Projeto salvo");
        } else {
          const novo = D.criarProjeto({ ...campos, tipo: tipo || "avulso" });
          location.hash = `#/projeto/${novo}`; avisar("Projeto criado");
        }
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

// ---------- Organizar checklist da rede ----------
async function organizarRede(p) {
  let plano;
  try { plano = await D.planoOrganizarRede(p.id); }
  catch (e) {
    avisar(e.message === "sem-conexao" ? "Não consegui conferir o banco agora. Atualize a página e tente de novo."
      : "Para organizar, o projeto da rede precisa ter as datas do evento e as unidades no mesmo grupo.");
    return;
  }
  const nada = !plano.paraRede.length && !plano.lixeira.length && !plano.unidades.some((x) => x.datas.length);
  if (nada) { avisar("O checklist da rede já está organizado."); return; }
  abrirModal({
    titulo: "Organizar checklist da rede",
    corpo: `<p class="texto-suave">As tarefas da direção e as da rede ficam uma vez só em “${esc(p.nome)}”. Cada unidade fica com as da coordenação local, com os prazos da sua semana. Nada é apagado de vez: as cópias vão para a lixeira.</p>
      <ul class="lista-simples">
        <li><span class="flex1">Vão para <b>${esc(p.nome)}</b></span><span class="pilula">${plano.paraRede.length}</span></li>
        <li><span class="flex1">Cópias repetidas para a lixeira</span><span class="pilula">${plano.lixeira.length}</span></li>
        ${plano.unidades.map((x) => `<li><span class="flex1"><b>${esc(x.u.nome)}</b><br><small class="texto-suave">fica com ${x.ficam} tarefas · ${x.datas.length ? `${x.datas.length} prazos ajustados` : "prazos já certos"}</small></span></li>`).join("")}
      </ul>`,
    rodape: `<span class="espaco"></span><button type="button" class="botao" data-cancelar>Cancelar</button>
      <button type="button" class="botao primario" data-ok>Organizar</button>`,
    aoMontar(m) {
      m.querySelector("[data-cancelar]").onclick = fecharModal;
      const ok = m.querySelector("[data-ok]");
      ok.onclick = async () => {
        ok.disabled = true;
        try {
          const r = await D.organizarRede(plano);
          fecharModal();
          avisar(`Pronto: ${r.paraRede} na rede · ${r.lixeira} cópias na lixeira · ${r.datas} prazos ajustados`);
        } catch { ok.disabled = false; }
      };
    }
  });
}

// ---------- Nova edição ----------
const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const sugerirNome = (ini) => (ini ? `${MESES[+ini.slice(5, 7) - 1]}/${ini.slice(2, 4)}` : "");

function novaEdicao(p) {
  const ms = D.modelos();
  const atual = D.nomeEdicaoAtual(p);
  const tarefasAtuais = D.tarefasDoProjeto(p.id);
  const manuaisAbertas = tarefasAtuais.filter((t) => !t.origem && !t.modeloId && D.aberta(t));
  const modeloPadrao = p.edicaoAtual?.modelo || (/smel|itabira/i.test(p.nome) ? "smel" : "escola");
  abrirModal({
    titulo: `Nova edição · ${p.nome}`,
    corpo: `<form class="formulario" id="form-edicao" autocomplete="off">
      <div class="grade-2">
        <label>Modelo<select class="campo" name="modelo">${ms.map((m) => `<option value="${m.id}" ${m.id === modeloPadrao ? "selected" : ""}>${esc(m.nome)} (${m.tarefas.length} tarefas)</option>`).join("")}</select></label>
        <label>Nome da nova edição<input class="campo" name="nome" placeholder="Ex.: Jul/27" required></label>
        <label>Primeiro dia<input class="campo" type="date" name="inicio" required></label>
        <label>Último dia<input class="campo" type="date" name="fim"></label>
        <label>Início da semana 2 <small class="texto-suave">se houver</small><input class="campo" type="date" name="semana2"></label>
        <span></span>
      </div>
      ${tarefasAtuais.length ? `<fieldset class="caixas"><legend>Edição atual</legend>
        <label>Nome da edição que vai ser encerrada<input class="campo" name="anterior" value="${esc(atual)}" placeholder="Ex.: Dez/26" required></label>
        <small class="texto-suave">As ${tarefasAtuais.length} tarefas dela saem do dia a dia e ficam guardadas para consulta e para o relatório.</small>
        ${(p.dataFim || p.dataInicio) && (p.dataFim || p.dataInicio) >= hoje() ? `<p class="pequeno vermelho"><b>Atenção:</b> a edição atual ainda não aconteceu (${esc(rotuloPeriodo(p))}). Só crie a nova edição depois que ela terminar.</p>` : ""}
        ${manuaisAbertas.length ? `<label class="interruptor"><input type="checkbox" name="levar" checked><span></span>Levar para a nova edição as ${manuaisAbertas.length} tarefas abertas criadas à mão (fora do checklist)</label>` : ""}
      </fieldset>` : ""}
      <div class="previa-edicao" id="ed-previa"><p class="texto-suave pequeno">Escolha as datas para ver como fica.</p></div>
    </form>`,
    rodape: `<span class="espaco"></span><button type="button" class="botao" data-cancelar>Cancelar</button>
      <button type="submit" form="form-edicao" class="botao primario">Criar edição</button>`,
    aoMontar(m) {
      const f = m.querySelector("form");
      const previa = m.querySelector("#ed-previa");
      let nomeMexido = false;
      f.nome.oninput = () => { nomeMexido = true; };
      const datas = () => ({ inicio: f.inicio.value, fim: f.fim.value || f.inicio.value, semana2: f.semana2.value || null });
      const mostrar = () => {
        if (f.inicio.value && !nomeMexido) f.nome.value = sugerirNome(f.inicio.value);
        if (f.inicio.value) { f.fim.min = f.inicio.value; f.semana2.min = f.inicio.value; }
        if (!f.inicio.value) { previa.innerHTML = `<p class="texto-suave pequeno">Escolha as datas para ver como fica.</p>`; return; }
        const ts = D.previaEdicao(p.id, f.modelo.value, datas());
        const h = hoje();
        const atrasadas = ts.filter((t) => t.prazo && t.prazo < h).length;
        const prox = [...ts].filter((t) => t.prazo >= h).sort((a, b) => a.prazo.localeCompare(b.prazo)).slice(0, 4);
        const usaS2 = ts.some((t) => t.ancora === "Semana 2");
        previa.innerHTML = `<p class="pequeno">Vão ser criadas <b>${ts.length}</b> tarefas, com o responsável de cada uma já definido.</p>
          ${atrasadas ? `<p class="pequeno vermelho"><b>${atrasadas}</b> já nasceriam atrasadas (prazo antes de hoje). Se a colônia estiver perto, ajuste esses prazos depois de criar.</p>` : ""}
          ${usaS2 && !f.semana2.value ? `<p class="pequeno texto-suave">Este modelo tem tarefas da semana 2. Sem a data, elas contam a partir do primeiro dia.</p>` : ""}
          ${prox.length ? `<ul class="lista-simples">${prox.map((t) => `<li><span class="data-tag">${esc(dataCurta(t.prazo))}</span><span class="flex1">${esc(t.titulo)}</span></li>`).join("")}</ul>` : ""}`;
      };
      ["modelo", "inicio", "fim", "semana2"].forEach((n) => (f[n].onchange = mostrar));
      m.querySelector("[data-cancelar]").onclick = fecharModal;
      f.onsubmit = async (e) => {
        e.preventDefault();
        const botao = m.querySelector('[form="form-edicao"]');
        const nome = f.nome.value.trim();
        const anterior = f.anterior ? f.anterior.value.trim() : "";
        if (f.fim.value && f.fim.value < f.inicio.value) { avisar("O último dia não pode ser antes do primeiro."); return; }
        if (anterior && anterior === nome) { avisar("A nova edição precisa de um nome diferente da atual."); return; }
        botao.disabled = true;
        try {
          const r = await D.novaEdicao(p.id, { nome, modeloId: f.modelo.value, ...datas(), fim: f.fim.value || null,
            nomeAnterior: anterior, levarAbertas: f.levar ? f.levar.checked : false });
          fecharModal();
          avisar(`Edição ${nome} criada: ${r.criadas} tarefas${r.encerradas ? ` · ${anterior} encerrada` : ""}`);
        } catch (err) {
          botao.disabled = false;
          avisar(err.message === "nome-repetido" ? "Já existe uma edição com esse nome nesta colônia." : "Não consegui criar a edição. Nada foi mudado; tente de novo.");
        }
      };
    }
  });
}

function verEdicao(p, nome) {
  const e = (p.edicoes || []).find((x) => x.nome === nome);
  const ts = D.ordenarTarefas(D.tarefasDaEdicao(p.id, nome));
  const fases = [...new Set(ts.map((t) => t.fase || "Sem fase"))];
  abrirModal({
    titulo: `${p.nome} · ${nome}`,
    corpo: `<p class="texto-suave">Edição encerrada${e?.inicio ? ` · ${esc(dataCurta(e.inicio))}${e.fim && e.fim !== e.inicio ? ` a ${esc(dataCurta(e.fim))}` : ""}` : ""} · <b>${e?.feitas ?? 0} de ${e?.total ?? ts.length}</b> tarefas concluídas.</p>
      ${fases.map((f) => `<h4>${esc(f)}</h4><ul class="lista-simples">${ts.filter((t) => (t.fase || "Sem fase") === f).map((t) => `
        <li><span class="flex1">${esc(t.titulo)}</span><small class="texto-suave">${t.status === "concluida" ? "concluída" : t.status === "naoSeAplica" ? "não se aplicou" : "ficou aberta"}</small></li>`).join("")}</ul>`).join("")
        || `<p class="texto-suave pequeno">Nenhuma tarefa guardada desta edição.</p>`}`,
    rodape: `<span class="espaco"></span><button type="button" class="botao" data-cancelar>Fechar</button>`,
    aoMontar(m) { m.querySelector("[data-cancelar]").onclick = fecharModal; }
  });
}
