// Tudo sobre a tarefa na tela: a linha da lista, o adiar, o editor e a criação rápida.
import * as D from "../dados.js";
import { esc, hoje, somarDias, rotuloPrazo, proximaSegunda, PRIORIDADES, dataCurta, AREAS } from "../util.js";
import { ICONES, avisar, abrirModal, fecharModal, abrirMenu } from "./ui.js";

// ---------- Linha da lista ----------
export function linhaTarefa(t, { mostrarProjeto = true, mostrarFase = false, mostrarResponsavel = true } = {}) {
  const p = t.projetoId ? D.projeto(t.projetoId) : null;
  const cor = p ? p.cor : "#A1A1A6";
  const feita = !D.aberta(t);
  const atrasada = !feita && t.prazo && t.prazo < hoje();
  const meta = [];
  if (mostrarProjeto && p) meta.push(`<span class="meta-projeto"><i style="background:${cor}"></i>${esc(p.nome)}</span>`);
  if (mostrarFase && t.fase) meta.push(`<span>${esc(t.fase)}</span>`);
  if (t.prazo && !feita) meta.push(`<span class="meta-prazo ${atrasada ? "atrasado" : ""}">${ICONES.calendario}${esc(rotuloPrazo(t.prazo))}</span>`);
  if (mostrarResponsavel && t.responsavel && t.responsavel !== D.eu()?.email) meta.push(`<span class="meta-pessoa">${ICONES.pessoa}${esc(D.primeiroNome(t.responsavel))}</span>`);
  if (t.status === "naoSeAplica") meta.push(`<span>Não se aplica</span>`);
  else if (feita && t.concluidaEm) meta.push(`<span>Concluída em ${esc(dataCurta(t.concluidaEm.slice(0, 10)))}</span>`);
  if (t.status === "aguardando") meta.push(`<span class="selo-aguardando">Aguardando</span>`);
  if (t.status === "andamento") meta.push(`<span class="selo-andamento">Em andamento</span>`);
  if (t.prioridade === "alta" && !feita) meta.push(`<span class="meta-alta">${ICONES.bandeira}Alta</span>`);
  if (t.notas) meta.push(`<span class="meta-nota" title="Tem anotações">${ICONES.nota}</span>`);

  return `
    <div class="tarefa ${feita ? "feita" : ""} ${atrasada ? "atrasada" : ""}" data-id="${t.id}" style="--cor:${cor}">
      <button type="button" class="check" data-acao="${feita ? "reabrir" : "concluir"}" aria-label="${feita ? "Reabrir" : "Concluir"} tarefa">${ICONES.check}</button>
      <button type="button" class="tarefa-corpo" data-acao="editar-tarefa">
        <span class="tarefa-titulo">${esc(t.titulo)}</span>
        ${meta.length ? `<span class="tarefa-meta">${meta.join("")}</span>` : ""}
      </button>
      ${feita ? "" : `<button type="button" class="botao-icone adiar" data-acao="adiar" aria-label="Adiar" title="Adiar">${ICONES.relogio}</button>`}
    </div>`;
}

export function listaTarefas(lista, opcoes) {
  return `<div class="lista">${lista.map((t) => linhaTarefa(t, opcoes)).join("")}</div>`;
}

// ---------- Ações vindas da lista ----------
export function tratarAcaoTarefa(acao, el) {
  const linha = el.closest(".tarefa");
  const id = linha?.dataset.id;
  if (!id) return false;
  if (acao === "concluir") {
    linha.classList.add("saindo");
    setTimeout(() => {
      D.concluir(id);
      avisar("Tarefa concluída", { rotulo: "Desfazer", fn: () => D.reabrir(id) });
    }, 320);
  } else if (acao === "reabrir") {
    D.reabrir(id);
  } else if (acao === "adiar") {
    menuAdiar(el, id);
  } else if (acao === "editar-tarefa") {
    editarTarefa(id);
  } else return false;
  return true;
}

export function menuAdiar(ancora, id) {
  const t = D.tarefa(id);
  const mudar = (prazo, msg) => { D.adiar(id, prazo); avisar(msg); };
  const itens = [];
  if (t.prazo && t.prazo < hoje()) itens.push({ rotulo: "Hoje", icone: ICONES.hoje, fn: () => mudar(hoje(), "Movida para hoje") });
  itens.push(
    { rotulo: "Amanhã", icone: ICONES.relogio, fn: () => mudar(somarDias(hoje(), 1), "Adiada para amanhã") },
    { rotulo: "Próxima segunda", icone: ICONES.calendario, extra: dataCurta(proximaSegunda()), fn: () => mudar(proximaSegunda(), "Adiada para segunda") },
    { rotulo: "Daqui a uma semana", icone: ICONES.calendario, extra: dataCurta(somarDias(hoje(), 7)), fn: () => mudar(somarDias(hoje(), 7), "Adiada uma semana") },
    { rotulo: "Escolher data…", icone: ICONES.calendario, fn: () => escolherData(t.prazo, (d) => mudar(d, `Prazo: ${rotuloPrazo(d)}`)) },
    { separador: true },
    { rotulo: "Sem prazo", icone: ICONES.x, fn: () => mudar(null, "Prazo removido") }
  );
  abrirMenu(ancora, itens);
}

function escolherData(atual, aoEscolher) {
  abrirModal({
    titulo: "Escolher data",
    largura: "estreita",
    corpo: `<input type="date" class="campo" id="data-escolhida" value="${atual || somarDias(hoje(), 1)}">`,
    rodape: `<button type="button" class="botao" data-fechar-x>Cancelar</button><button type="button" class="botao primario" data-ok>Salvar</button>`,
    aoMontar(m) {
      m.querySelector("[data-fechar-x]").onclick = fecharModal;
      m.querySelector("[data-ok]").onclick = () => {
        const v = m.querySelector("#data-escolhida").value;
        fecharModal();
        if (v) aoEscolher(v);
      };
    }
  });
}

// ---------- Editor ----------
function opcoesProjeto(sel) {
  const lista = D.souAdmin() ? D.projetosAtivos() : D.projetosAtivos().filter((p) => p.tipo === "colonia");
  return (D.souAdmin() ? `<option value="">Sem projeto</option>` : "") + lista.map((p) =>
    `<option value="${p.id}" ${p.id === sel ? "selected" : ""}>${esc(p.nome)}</option>`).join("");
}
function opcoesFase(pid, sel) {
  const p = pid ? D.projeto(pid) : null;
  const fases = p?.fases || [];
  const extra = sel && !fases.includes(sel) ? [sel] : [];
  return `<option value="">Sem fase</option>` + [...fases, ...extra].map((f) =>
    `<option ${f === sel ? "selected" : ""}>${esc(f)}</option>`).join("");
}

function opcoesResponsavel(pid, sel) {
  const equipe = D.equipeDoProjeto(pid);
  const extra = sel && !equipe.some((p) => p.id === sel) ? [{ id: sel, nome: D.nomeDe(sel) }] : [];
  return `<option value="">Ninguém ainda</option>` + [...equipe, ...extra].map((p) =>
    `<option value="${esc(p.id)}" ${p.id === sel ? "selected" : ""}>${esc(p.nome || p.id)}</option>`).join("");
}

// Coordenador sem projeto escolhido: cai na primeira colônia dele
export function projetoPadrao(pid) {
  if (pid || D.souAdmin()) return pid || null;
  return D.projetosAtivos().find((p) => p.tipo === "colonia")?.id || null;
}

export function editarTarefa(id, padrao = {}) {
  const base = { titulo: "", prioridade: "normal", status: "aFazer", responsavel: D.eu()?.email || "", ...padrao };
  base.projetoId = projetoPadrao(base.projetoId);
  const t = id ? D.tarefa(id) : base;
  if (!t) return;
  const status = [["aFazer", "A fazer"], ["andamento", "Em andamento"], ["aguardando", "Aguardando"], ["naoSeAplica", "Não se aplica"], ...(t.status === "concluida" ? [["concluida", "Concluída"]] : [])];
  abrirModal({
    titulo: id ? "Tarefa" : "Nova tarefa",
    corpo: `
      <form class="formulario" id="form-tarefa" autocomplete="off">
        <input class="campo campo-grande" name="titulo" placeholder="O que precisa ser feito?" value="${esc(t.titulo)}" required ${id ? "" : "autofocus"}>
        <div class="grade-2">
          <label>Projeto<select class="campo" name="projetoId">${opcoesProjeto(t.projetoId)}</select></label>
          <label>Fase<select class="campo" name="fase">${opcoesFase(t.projetoId, t.fase)}</select></label>
          <label>Responsável<select class="campo" name="responsavel">${opcoesResponsavel(t.projetoId, t.responsavel)}</select></label>
          <label>Quem apoia <small class="texto-suave">opcional</small><input class="campo" name="apoio" value="${esc(t.apoio || "")}" placeholder="Ex.: Vanessa, escola, SMEL"></label>
          <label>Prazo
            <div class="campo-com-botao">
              <input type="date" class="campo" name="prazo" value="${t.prazo || ""}">
            </div>
          </label>
          <label>Prioridade
            <div class="segmentado" data-campo="prioridade">
              ${Object.entries(PRIORIDADES).reverse().map(([v, r]) => `<button type="button" data-v="${v}" class="${t.prioridade === v ? "ativo" : ""}">${r}</button>`).join("")}
            </div>
          </label>
        </div>
        <label>Situação
          <div class="segmentado" data-campo="status">
            ${status.map(([v, r]) => `<button type="button" data-v="${v}" class="${t.status === v ? "ativo" : ""}">${r}</button>`).join("")}
          </div>
        </label>
        <label>Área <small class="texto-suave">para filtrar: Escola, Comunicação, Camisas…</small>
          <input class="campo" name="area" list="lista-areas" value="${esc(t.area || "")}">
          <datalist id="lista-areas">${AREAS.map((a) => `<option value="${esc(a)}">`).join("")}</datalist></label>
        <label>Observações<textarea class="campo" name="notas" rows="3" placeholder="Detalhes fixos, contatos, links…">${esc(t.notas || "")}</textarea></label>
      </form>
      ${id ? `<section class="registros">
        <h3>Comentários e histórico</h3>
        <form class="form-linha" id="form-comentario" autocomplete="off">
          <input class="campo" name="texto" placeholder="Escreva um comentário… (ex.: liguei pro fornecedor, volta amanhã)">
          <button class="botao pequeno" type="submit">Comentar</button>
        </form>
        <ul class="lista-registros" id="lista-registros"><li class="texto-suave pequeno">Carregando…</li></ul>
      </section>` : ""}`,
    rodape: `
      ${id && !t.excluidaEm ? `<button type="button" class="botao texto perigo" data-excluir>${ICONES.lixo}Excluir</button>` : ""}
      <span class="espaco"></span>
      <button type="button" class="botao" data-cancelar>Cancelar</button>
      <button type="submit" form="form-tarefa" class="botao primario">${id ? "Salvar" : "Criar tarefa"}</button>`,
    aoMontar(m) {
      const f = m.querySelector("form");
      const valores = { prioridade: t.prioridade || "normal", status: t.status || "aFazer" };
      m.querySelectorAll(".segmentado").forEach((s) => s.addEventListener("click", (e) => {
        const b = e.target.closest("button[data-v]");
        if (!b) return;
        s.querySelectorAll("button").forEach((x) => x.classList.toggle("ativo", x === b));
        valores[s.dataset.campo] = b.dataset.v;
      }));
      f.projetoId.onchange = () => {
        f.fase.innerHTML = opcoesFase(f.projetoId.value, "");
        f.responsavel.innerHTML = opcoesResponsavel(f.projetoId.value, f.responsavel.value);
      };
      if (id) ligarRegistros(m, id);
      m.querySelector("[data-cancelar]").onclick = fecharModal;
      const ex = m.querySelector("[data-excluir]");
      if (ex) ex.onclick = async () => {
        fecharModal();
        D.excluirTarefa(id);
        avisar("Tarefa enviada para a lixeira", { rotulo: "Desfazer", fn: () => D.restaurar("tarefa", id) });
      };
      f.onsubmit = (e) => {
        e.preventDefault();
        const titulo = f.titulo.value.trim();
        if (!titulo) return f.titulo.focus();
        const campos = {
          titulo, projetoId: f.projetoId.value || null, fase: f.fase.value, prazo: f.prazo.value || null,
          prioridade: valores.prioridade, status: valores.status, notas: f.notas.value.trim(),
          responsavel: f.responsavel.value, apoio: f.apoio.value.trim(), area: f.area.value.trim()
        };
        if (!D.souAdmin() && !campos.projetoId) { avisar("Escolha a colônia da tarefa."); return; }
        if (campos.status === "concluida" && t.status !== "concluida") campos.concluidaEm = new Date().toISOString();
        if (campos.status !== "concluida") campos.concluidaEm = null;
        if (id) {
          const antes = D.tarefa(id);
          // só grava o que mudou (assim o histórico fica limpo)
          for (const k of Object.keys(campos)) if ((campos[k] ?? "") === (antes[k] ?? "")) delete campos[k];
          if (Object.keys(campos).length) D.atualizarTarefa(id, campos);
        } else D.criarTarefa(campos);
        fecharModal();
        avisar(id ? "Tarefa salva" : "Tarefa criada");
      };
    }
  });
}

// ---------- Criação rápida ----------
// padrao: { projetoId, fase, prazo } — valores já escolhidos (ex.: dentro de um projeto)
export function barraRapida(padrao = {}) {
  return `
    <form class="rapida" autocomplete="off" data-projeto="${padrao.projetoId || ""}" data-fase="${esc(padrao.fase || "")}" data-prazo="${padrao.prazoHoje ? "hoje" : ""}">
      <span class="rapida-mais">${ICONES.mais}</span>
      <input name="titulo" placeholder="${esc(padrao.placeholder || "Nova tarefa… (Enter para adicionar)")}" aria-label="Nova tarefa">
      <div class="rapida-opcoes">
        ${padrao.projetoId ? "" : `<button type="button" class="chip" data-chip="projeto">Projeto</button>`}
        <button type="button" class="chip" data-chip="prazo">Prazo</button>
        <button type="button" class="chip" data-chip="prioridade">${ICONES.bandeira}<span>Alta</span></button>
        <button type="submit" class="botao primario pequeno">Adicionar</button>
      </div>
    </form>`;
}

export function ligarBarraRapida(raiz) {
  raiz.querySelectorAll("form.rapida").forEach((form) => {
    const fixo = { projetoId: form.dataset.projeto || null, fase: form.dataset.fase || "" };
    const prazoPadrao = () => (form.dataset.prazo === "hoje" ? hoje() : null);
    const sel = { projetoId: projetoPadrao(fixo.projetoId), prazo: prazoPadrao(), prioridade: "normal" };
    const chipP = form.querySelector('[data-chip="projeto"]');
    const chipD = form.querySelector('[data-chip="prazo"]');
    const chipA = form.querySelector('[data-chip="prioridade"]');

    const pintar = () => {
      if (chipP) {
        const p = sel.projetoId && D.projeto(sel.projetoId);
        chipP.innerHTML = p ? `<i style="background:${p.cor}"></i>${esc(p.nome)}` : "Projeto";
        chipP.classList.toggle("ativo", !!p);
      }
      chipD.textContent = sel.prazo ? rotuloPrazo(sel.prazo) : "Prazo";
      chipD.classList.toggle("ativo", !!sel.prazo);
      chipA.classList.toggle("ativo", sel.prioridade === "alta");
    };

    if (chipP) chipP.onclick = () => abrirMenu(chipP, [
      ...(D.souAdmin() ? [{ rotulo: "Sem projeto", fn: () => { sel.projetoId = null; pintar(); } }, { separador: true }] : []),
      ...D.projetosAtivos().filter((p) => D.souAdmin() || p.tipo === "colonia").map((p) => ({
        rotulo: p.nome, icone: `<i class="ponto" style="background:${p.cor}"></i>`,
        fn: () => { sel.projetoId = p.id; pintar(); form.titulo.focus(); }
      }))
    ]);
    chipD.onclick = () => abrirMenu(chipD, [
      { rotulo: "Hoje", fn: () => { sel.prazo = hoje(); pintar(); } },
      { rotulo: "Amanhã", fn: () => { sel.prazo = somarDias(hoje(), 1); pintar(); } },
      { rotulo: "Próxima segunda", extra: dataCurta(proximaSegunda()), fn: () => { sel.prazo = proximaSegunda(); pintar(); } },
      { rotulo: "Escolher data…", fn: () => escolherData(sel.prazo, (d) => { sel.prazo = d; pintar(); }) },
      { separador: true },
      { rotulo: "Sem prazo", fn: () => { sel.prazo = null; pintar(); } }
    ]);
    chipA.onclick = () => { sel.prioridade = sel.prioridade === "alta" ? "normal" : "alta"; pintar(); };

    form.titulo.addEventListener("focus", () => form.classList.add("focada"));
    form.titulo.addEventListener("blur", () => { if (!form.titulo.value) setTimeout(() => form.classList.remove("focada"), 150); });

    form.onsubmit = (e) => {
      e.preventDefault();
      const titulo = form.titulo.value.trim();
      if (!titulo) return form.titulo.focus();
      if (!D.souAdmin() && !sel.projetoId) { avisar("Escolha a colônia da tarefa."); return; }
      D.criarTarefa({ titulo, projetoId: sel.projetoId, fase: fixo.fase, prazo: sel.prazo, prioridade: sel.prioridade });
      form.titulo.value = "";
      sel.prioridade = "normal";
      sel.prazo = prazoPadrao();
      pintar();
      avisar("Tarefa criada");
    };
    pintar();
  });
}

// ---------- Comentários e histórico ----------
function quando(iso) {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0"), mm = String(d.getMinutes()).padStart(2, "0");
  return `${dataCurta(iso.slice(0, 10))} ${hh}:${mm}`;
}
function ligarRegistros(m, id) {
  const ul = m.querySelector("#lista-registros");
  const desligar = D.ouvirRegistros(id, (lista) => {
    if (!document.body.contains(ul)) { desligar && desligar(); return; }
    const ord = [...lista].sort((a, b) => (b.em || "").localeCompare(a.em || ""));
    ul.innerHTML = ord.length ? ord.map((r) => r.tipo === "comentario"
      ? `<li class="comentario"><b>${esc(r.nome || r.por)}</b><span>${esc(r.texto)}</span><small>${esc(quando(r.em))}</small></li>`
      : `<li class="evento"><span><b>${esc((r.nome || r.por || "").split(" ")[0])}</b> ${esc(r.texto)}</span><small>${esc(quando(r.em))}</small></li>`).join("")
      : `<li class="texto-suave pequeno">Nada registrado ainda.</li>`;
  });
  const f = m.querySelector("#form-comentario");
  f.onsubmit = (e) => {
    e.preventDefault();
    const texto = f.texto.value.trim();
    if (!texto) return;
    D.comentar(id, texto).then(() => { f.texto.value = ""; }).catch(() => {});
  };
  const fechar = m.closest(".modal-fundo");
  new MutationObserver((_, obs) => { if (!document.body.contains(fechar)) { desligar(); obs.disconnect(); } })
    .observe(document.body, { childList: true });
}
