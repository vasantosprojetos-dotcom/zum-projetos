// Tela MODELOS (só a Vanessa): os checklists-base de cada tipo de colônia e a lista de feriados.
// Regra de ouro: quando uma edição ensinar algo, a mudança vem para cá, não só para a edição.
import * as D from "../dados.js";
import { esc, dataCurta, hoje } from "../util.js";
import { ANCORAS, calcularPrazo } from "../prazos.js";
import { ICONES, avisar, confirmar, abrirModal, fecharModal } from "../componentes/ui.js";

let raiz, aba = null;

export function montar(el) {
  raiz = el;
  if (!D.souAdmin()) { el.innerHTML = `<div class="vazio"><p>Só a direção vê os modelos.</p></div>`; return; }
  el.innerHTML = `
    <header class="cabecalho linha">
      <div><h1>Modelos</h1><p class="resumo">O checklist-base de cada tipo de colônia. O botão <b>Nova edição</b>, dentro de cada colônia, gera as tarefas a partir daqui.</p></div>
      <button type="button" class="botao" data-mod="novo-modelo">${ICONES.mais}Novo modelo</button>
    </header>
    <div class="segmentado abas" id="mod-abas"></div>
    <div id="mod-conteudo"></div>
    <section class="painel largo" id="mod-feriados"></section>`;
  el.addEventListener("click", clique);
  atualizar();
}

export function atualizar() {
  if (!raiz || !D.souAdmin()) return;
  const ms = D.modelos();
  if (!aba || !ms.some((m) => m.id === aba)) aba = ms[0]?.id || null;
  raiz.querySelector("#mod-abas").innerHTML = ms.map((m) =>
    `<button type="button" data-mod="aba" data-id="${m.id}" class="${m.id === aba ? "ativo" : ""}">${esc(m.nome)}</button>`).join("");
  const m = D.modelo(aba);
  raiz.querySelector("#mod-conteudo").innerHTML = m ? desenharModelo(m) : `<div class="vazio"><p>Nenhum modelo ainda.</p></div>`;
  desenharFeriados();
}

const rotuloAncora = (a, dias) => {
  const n = Number(dias) || 0;
  const qtd = Math.abs(n);
  if (!n) return a === "Término" ? "No último dia" : a === "Semana 2" ? "No início da semana 2" : a === "Sáb. antes" ? "No sábado antes" : "No primeiro dia";
  const ref = a === "Término" ? "do fim" : a === "Semana 2" ? "da semana 2" : a === "Sáb. antes" ? "do sábado antes" : "do início";
  return `${qtd} dia${qtd > 1 ? "s" : ""} ${n < 0 ? "antes" : "depois"} ${ref}`;
};
const rotuloPapel = (t) => {
  const quem = t.papel === "local" ? "Coordenação local" : "Vanessa";
  const apoio = t.apoio === "direcao" ? "Vanessa" : t.apoio === "local" ? "coordenação local" : t.apoio;
  return apoio ? `${quem} · apoio: ${apoio}` : quem;
};

function desenharModelo(m) {
  const fases = [...m.fases];
  for (const t of m.tarefas) if (t.fase && !fases.includes(t.fase)) fases.push(t.fase);
  const porPapel = { direcao: 0, local: 0 };
  m.tarefas.forEach((t) => { porPapel[t.papel === "local" ? "local" : "direcao"]++; });
  return `
    <section class="painel largo modelo-topo">
      <div class="painel-topo"><h3>${ICONES.tarefas}${esc(m.nome)}</h3>
        <span class="espaco"></span>
        <button type="button" class="botao pequeno" data-mod="editar-modelo">${ICONES.lapis}Nome e fases</button>
        <button type="button" class="botao pequeno" data-mod="duplicar-modelo">Duplicar</button>
        <button type="button" class="botao pequeno primario" data-mod="nova-tarefa-modelo">${ICONES.mais}Tarefa</button>
      </div>
      <p class="texto-suave pequeno">${esc(m.descricao || "")}${m.descricao ? " · " : ""}<b>${m.tarefas.length}</b> tarefas · ${porPapel.direcao} da direção · ${porPapel.local} da coordenação local</p>
      <p class="texto-suave pequeno">O prazo de cada tarefa é contado a partir das datas da edição. Se cair em fim de semana ou feriado, volta para o dia útil anterior.</p>
    </section>
    ${fases.map((f) => {
      const ts = m.tarefas.filter((t) => t.fase === f);
      return `<section class="fase">
        <div class="fase-topo"><h3>${esc(f)}</h3><span class="contagem">${ts.length}</span>
          <button type="button" class="link pequeno" data-mod="nova-tarefa-modelo" data-fase="${esc(f)}">${ICONES.mais}Tarefa</button></div>
        ${ts.length ? `<div class="lista">${ts.map((t) => `
          <button type="button" class="linha-modelo" data-mod="editar-tarefa-modelo" data-id="${esc(t.id)}">
            <span class="tarefa-titulo">${esc(t.titulo)}</span>
            <span class="tarefa-meta">
              <span>${ICONES.calendario}${esc(rotuloAncora(t.ancora, t.dias))}</span>
              <span class="${t.papel === "local" ? "meta-local" : ""}">${ICONES.pessoa}${esc(rotuloPapel(t))}</span>
              ${t.area ? `<span>${esc(t.area)}</span>` : ""}
              ${t.notas ? `<span class="meta-nota" title="${esc(t.notas)}">${ICONES.nota}</span>` : ""}
            </span>
          </button>`).join("")}</div>` : `<p class="fase-vazia">Nenhuma tarefa nesta fase.</p>`}
      </section>`;
    }).join("")}`;
}

function desenharFeriados() {
  const el = raiz.querySelector("#mod-feriados");
  const fs = D.feriados();
  const h = hoje();
  el.innerHTML = `
    <div class="painel-topo"><h3>${ICONES.calendario}Feriados e recessos</h3></div>
    <p class="texto-suave pequeno">Dias que não contam como prazo. Um prazo que cair num deles volta para o dia útil anterior.</p>
    <ul class="lista-simples">${fs.map((f, i) => `
      <li class="${f.data < h ? "passada" : ""}"><span class="data-tag">${esc(dataCurta(f.data))}${f.data.slice(0, 4) !== h.slice(0, 4) ? ` ${f.data.slice(0, 4)}` : ""}</span>
        <span class="flex1">${esc(f.nome)}</span>
        <button type="button" class="botao-icone mini" data-mod="tirar-feriado" data-i="${i}" aria-label="Remover">${ICONES.x}</button></li>`).join("")}</ul>
    <form class="form-linha" id="form-feriado">
      <input class="campo" type="date" name="data" required>
      <input class="campo" name="nome" placeholder="Ex.: Recesso escolar" required>
      <button class="botao pequeno" type="submit">Adicionar</button>
    </form>`;
  el.querySelector("#form-feriado").onsubmit = (e) => {
    e.preventDefault();
    const f = e.target;
    if (D.feriados().some((x) => x.data === f.data.value)) { avisar("Essa data já está na lista."); return; }
    D.salvarFeriados([...D.feriados(), { data: f.data.value, nome: f.nome.value.trim() }]).then(() => avisar("Feriado adicionado")).catch(() => {});
  };
}

async function clique(e) {
  const b = e.target.closest("[data-mod]");
  if (!b || !raiz.contains(b)) return;
  const acao = b.dataset.mod;
  const m = D.modelo(aba);
  if (acao === "aba") { aba = b.dataset.id; atualizar(); }
  else if (acao === "editar-tarefa-modelo") editarTarefaModelo(m, b.dataset.id);
  else if (acao === "nova-tarefa-modelo") editarTarefaModelo(m, null, b.dataset.fase || m.fases[0] || "");
  else if (acao === "editar-modelo") editarModelo(m);
  else if (acao === "novo-modelo") editarModelo(null);
  else if (acao === "duplicar-modelo") {
    const novo = { ...structuredClone(m), id: D.novoIdModelo(), nome: `${m.nome} (cópia)` };
    novo.tarefas = novo.tarefas.map((t) => ({ ...t, id: `${novo.id}-${D.novoIdModelo()}` }));
    await D.salvarModelo(novo).catch(() => null);
    aba = novo.id; atualizar(); avisar("Modelo duplicado. Ajuste o nome em “Nome e fases”.");
  } else if (acao === "tirar-feriado") {
    const f = D.feriados()[+b.dataset.i];
    if (f && await confirmar({ titulo: "Remover feriado?", texto: `${dataCurta(f.data)} · ${f.nome}`, botao: "Remover" }))
      D.salvarFeriados(D.feriados().filter((x) => x !== f)).catch(() => {});
  }
}

function editarModelo(m) {
  const novo = !m;
  const base = m || { id: D.novoIdModelo(), nome: "", descricao: "", fases: ["Planejamento", "Execução", "Fechamento"], tarefas: [] };
  abrirModal({
    titulo: novo ? "Novo modelo" : "Nome e fases",
    corpo: `<form class="formulario" id="form-modelo" autocomplete="off">
      <label>Nome<input class="campo" name="nome" value="${esc(base.nome)}" placeholder="Ex.: Modelo Escola" required></label>
      <label>Descrição <small class="texto-suave">opcional</small><input class="campo" name="descricao" value="${esc(base.descricao || "")}"></label>
      <label>Fases <small class="texto-suave">uma por linha, na ordem em que acontecem</small>
        <textarea class="campo" name="fases" rows="8">${esc(base.fases.join("\n"))}</textarea></label>
    </form>`,
    rodape: `${!novo && D.modelos().length > 1 ? `<button type="button" class="botao texto perigo" data-tirar>${ICONES.lixo}Excluir modelo</button>` : ""}
      <span class="espaco"></span><button type="button" class="botao" data-cancelar>Cancelar</button>
      <button type="submit" form="form-modelo" class="botao primario">Salvar</button>`,
    aoMontar(md) {
      md.querySelector("[data-cancelar]").onclick = fecharModal;
      const tirar = md.querySelector("[data-tirar]");
      if (tirar) tirar.onclick = async () => {
        fecharModal();
        if (await confirmar({ titulo: "Excluir modelo?", texto: `“${base.nome}” e as ${base.tarefas.length} tarefas dele saem da lista de modelos. As colônias já criadas não mudam.`, botao: "Excluir", perigo: true })) {
          await D.salvarModelos(D.modelos().filter((x) => x.id !== base.id)).catch(() => null);
          aba = null; atualizar();
        }
      };
      const f = md.querySelector("form");
      f.onsubmit = async (e) => {
        e.preventDefault();
        const fases = f.fases.value.split("\n").map((x) => x.trim()).filter(Boolean);
        // fase renomeada na mesma posição: as tarefas acompanham
        const mapa = new Map();
        base.fases.forEach((antiga, i) => { if (fases[i] && fases[i] !== antiga && !fases.includes(antiga)) mapa.set(antiga, fases[i]); });
        const tarefas = base.tarefas.map((t) => (mapa.has(t.fase) ? { ...t, fase: mapa.get(t.fase) } : t));
        await D.salvarModelo({ ...base, nome: f.nome.value.trim(), descricao: f.descricao.value.trim(), fases, tarefas }).catch(() => null);
        aba = base.id; fecharModal(); atualizar(); avisar("Modelo salvo");
      };
    }
  });
}

function editarTarefaModelo(m, id, faseNova = "") {
  const t = id ? m.tarefas.find((x) => x.id === id) : { titulo: "", fase: faseNova, area: "", papel: "direcao", apoio: "", ancora: "Início", dias: -30, notas: "" };
  if (!t) return;
  const exemplo = { inicio: "2027-07-12", fim: "2027-07-16", semana2: "2027-07-19" };
  const fer = new Set(D.feriados().map((f) => f.data));
  const apoioLivre = t.apoio && t.apoio !== "direcao" && t.apoio !== "local";
  abrirModal({
    titulo: id ? "Tarefa do modelo" : "Nova tarefa no modelo",
    corpo: `<form class="formulario" id="form-tm" autocomplete="off">
      <input class="campo campo-grande" name="titulo" value="${esc(t.titulo)}" placeholder="O que precisa ser feito?" required ${id ? "" : "autofocus"}>
      <div class="grade-2">
        <label>Fase<select class="campo" name="fase">${[...new Set([...m.fases, t.fase].filter(Boolean))].map((f) => `<option ${f === t.fase ? "selected" : ""}>${esc(f)}</option>`).join("")}</select></label>
        <label>Área<input class="campo" name="area" value="${esc(t.area || "")}" placeholder="Ex.: Escola, Camisas"></label>
        <label>Responsável<select class="campo" name="papel">${Object.entries(D.PAPEIS).map(([v, r]) => `<option value="${v}" ${t.papel === v ? "selected" : ""}>${r}</option>`).join("")}</select></label>
        <label>Quem apoia<select class="campo" name="apoio">
          <option value="">Ninguém</option>
          ${Object.entries(D.PAPEIS).map(([v, r]) => `<option value="${v}" ${t.apoio === v ? "selected" : ""}>${r}</option>`).join("")}
          <option value="__texto" ${apoioLivre ? "selected" : ""}>Outro (escrever)…</option></select></label>
        <label class="${apoioLivre ? "" : "escondido"}" id="tm-apoio-livre">Nome de quem apoia<input class="campo" name="apoioTexto" value="${esc(apoioLivre ? t.apoio : "")}" placeholder="Ex.: SMEL, escola"></label>
      </div>
      <fieldset class="caixas"><legend>Prazo</legend>
        <div class="linha-prazo">
          <input class="campo campo-dias" type="number" name="dias" value="${Number(t.dias) || 0}" step="1" aria-label="Dias">
          <span class="pequeno texto-suave">dias em relação a</span>
          <select class="campo" name="ancora">${ANCORAS.map((a) => `<option ${a === t.ancora ? "selected" : ""}>${a}</option>`).join("")}</select>
        </div>
        <small class="texto-suave" id="tm-exemplo"></small>
      </fieldset>
      <label>Observações<textarea class="campo" name="notas" rows="2">${esc(t.notas || "")}</textarea></label>
    </form>`,
    rodape: `${id ? `<button type="button" class="botao texto perigo" data-tirar>${ICONES.lixo}Tirar do modelo</button>` : ""}
      <span class="espaco"></span><button type="button" class="botao" data-cancelar>Cancelar</button>
      <button type="submit" form="form-tm" class="botao primario">Salvar</button>`,
    aoMontar(md) {
      const f = md.querySelector("form");
      const ex = md.querySelector("#tm-exemplo");
      const mostrarExemplo = () => {
        const p = calcularPrazo(f.ancora.value, f.dias.value, exemplo, fer);
        ex.textContent = `${rotuloAncora(f.ancora.value, f.dias.value)}. Exemplo: numa colônia de 12 a 16/07/2027, cairia em ${p ? dataCurta(p) : "—"}.`;
      };
      f.dias.oninput = mostrarExemplo; f.ancora.onchange = mostrarExemplo; mostrarExemplo();
      f.apoio.onchange = () => md.querySelector("#tm-apoio-livre").classList.toggle("escondido", f.apoio.value !== "__texto");
      md.querySelector("[data-cancelar]").onclick = fecharModal;
      const tirar = md.querySelector("[data-tirar]");
      if (tirar) tirar.onclick = async () => {
        await D.salvarModelo({ ...m, tarefas: m.tarefas.filter((x) => x.id !== id) }).catch(() => null);
        fecharModal(); atualizar(); avisar("Tarefa tirada do modelo");
      };
      f.onsubmit = async (e) => {
        e.preventDefault();
        const nova = {
          ...t, id: t.id || `${m.id}-${D.novoIdModelo()}`, titulo: f.titulo.value.trim(), fase: f.fase.value, area: f.area.value.trim(),
          papel: f.papel.value, apoio: f.apoio.value === "__texto" ? f.apoioTexto.value.trim() : f.apoio.value,
          ancora: f.ancora.value, dias: parseInt(f.dias.value, 10) || 0, notas: f.notas.value.trim()
        };
        if (!nova.titulo) return;
        let tarefas;
        if (id) tarefas = m.tarefas.map((x) => (x.id === id ? nova : x));
        else {
          // entra no fim da fase escolhida
          const ult = m.tarefas.map((x) => x.fase).lastIndexOf(nova.fase);
          tarefas = [...m.tarefas];
          tarefas.splice(ult === -1 ? tarefas.length : ult + 1, 0, nova);
        }
        await D.salvarModelo({ ...m, tarefas }).catch(() => null);
        fecharModal(); atualizar(); avisar(id ? "Tarefa do modelo salva" : "Tarefa adicionada ao modelo");
      };
    }
  });
}
