// Tela RELATÓRIO de uma colônia — parte de campo, preenchida pela coordenação durante e logo após a semana.
// Fica em projeto.relatorio (da edição atual). Ao criar uma Nova edição, ele é guardado junto com a edição anterior.
// Fluxo: Rascunho → Enviado para revisão (coordenação) → Aprovado (só a Vanessa).
import * as D from "../dados.js";
import { esc, dataCurta, diasEntre, somarDias, deISO, rotuloPeriodo, hoje } from "../util.js";
import { ICONES, avisar, confirmar } from "../componentes/ui.js";

let raiz, pid = null, timers = {}, pendentes = {};

const STATUS = { rascunho: "Rascunho", enviado: "Enviado para revisão", aprovado: "Aprovado" };
const TIPOS_OCORRENCIA = ["Acidente / machucado", "Saúde (febre, mal-estar…)", "Conflito entre crianças", "Atraso de responsável na saída", "Perda de objeto", "Outro"];
const DIAS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const FICHA = [
  ["inscritos", "Crianças inscritas"], ["vagas", "Vagas oferecidas"],
  ["alunos", "Alunos da escola"], ["naoAlunos", "Não alunos"],
  ["pacotes", "Pacotes (semana inteira)"], ["diarias", "Diárias avulsas"],
  ["turmas", "Turmas"], ["monitores", "Monitores"], ["mediaDia", "Média de crianças por dia"]
];

export function montar(el, { id }) {
  raiz = el; pid = id;
  const p = D.projeto(id);
  if (!p || p.excluidoEm) { el.innerHTML = `<div class="vazio"><p>Colônia não encontrada.</p><a class="botao" href="#/projetos">Ver projetos</a></div>`; return; }
  el.innerHTML = `
    <a class="voltar" href="#/projeto/${id}">${ICONES.voltar}${esc(p.nome)}</a>
    <header class="cabecalho linha" id="rel-topo"></header>
    <div class="rel-grade" id="rel-corpo"></div>`;
  el.addEventListener("input", aoDigitar);
  el.addEventListener("change", aoDigitar);
  el.addEventListener("click", clique);
  desenhar();
}

export function atualizar() {
  if (!raiz || !pid) return;
  // Não redesenha o formulário enquanto alguém digita: só o topo.
  const ativo = document.activeElement;
  if (ativo && raiz.contains(ativo) && /INPUT|TEXTAREA|SELECT/.test(ativo.tagName)) { desenharTopo(); return; }
  desenhar();
}

const rel = () => D.projeto(pid)?.relatorio || {};
const podeEditar = () => D.souAdmin() || rel().status !== "aprovado";

// Grava na hora tudo o que ainda estava esperando, antes de redesenhar (assim nada digitado se perde).
function gravarPendentes() {
  const todos = Object.values(pendentes);
  for (const k of Object.keys(timers)) clearTimeout(timers[k]);
  timers = {}; pendentes = {};
  if (!todos.length) return Promise.resolve();
  const campos = {};
  for (const c of todos) for (const [k, v] of Object.entries(c)) {
    campos[k] = v && typeof v === "object" && !Array.isArray(v) && campos[k] && typeof campos[k] === "object" && !Array.isArray(campos[k]) ? { ...campos[k], ...v } : v;
  }
  return D.salvarRelatorio(pid, campos).catch(() => {});
}
window.addEventListener("hashchange", () => { if (pid) gravarPendentes(); });
window.addEventListener("pagehide", () => { if (pid) gravarPendentes(); });

function desenhar() {
  gravarPendentes();
  desenharTopo();
  const p = D.projeto(pid);
  const r = rel();
  const travado = !podeEditar() ? "disabled" : "";
  const f = r.ficha || {};
  const ocupacao = f.inscritos && f.vagas ? Math.round((f.inscritos / f.vagas) * 100) : null;
  raiz.querySelector("#rel-corpo").innerHTML = `
    ${secao("ficha", "1. Ficha técnica", "Os números da edição. Entram na página de abertura e no gráfico histórico.", `
      <div class="rel-numeros">${FICHA.map(([k, r2]) => `
        <label>${r2}<input class="campo" type="number" min="0" inputmode="numeric" data-campo="ficha.${k}" value="${f[k] ?? ""}" ${travado}></label>`).join("")}
      </div>
      ${ocupacao !== null ? `<p class="pequeno texto-suave">Ocupação: <b>${ocupacao}%</b> (inscritos ÷ vagas)</p>` : ""}`)}

    ${secao("publico", "2. Público e turmas", "Faixas por idade e por que as turmas foram agrupadas assim.", `
      <label>Turmas e faixas etárias<textarea class="campo" rows="4" data-campo="publico.turmas" placeholder="Ex.: Turma 1 — 3 a 5 anos (14 crianças) · Turma 2 — 6 a 8 anos (18)…" ${travado}>${esc(r.publico?.turmas || "")}</textarea></label>
      <label>Decisões de agrupamento<textarea class="campo" rows="3" data-campo="publico.decisoes" placeholder="Ex.: irmãos juntos a pedido das famílias; turma de 9+ unida à de 7–8 na quinta por número baixo…" ${travado}>${esc(r.publico?.decisoes || "")}</textarea></label>`)}

    ${secao("equipe", "3. Equipe e integração", "Quem trabalhou na edição e o apoio do parceiro.", `
      <div class="rel-lista" id="rel-equipe">${(r.equipe || []).map((x, i) => `
        <div class="rel-linha">
          <input class="campo" placeholder="Nome" data-lista="equipe" data-i="${i}" data-k="nome" value="${esc(x.nome || "")}" ${travado}>
          <input class="campo" placeholder="Função (monitor, coordenação, lanche…)" data-lista="equipe" data-i="${i}" data-k="funcao" value="${esc(x.funcao || "")}" ${travado}>
          ${travado ? "" : `<button type="button" class="botao-icone mini" data-rel="tirar" data-lista="equipe" data-i="${i}" aria-label="Remover">${ICONES.x}</button>`}
        </div>`).join("") || `<p class="texto-suave pequeno">Ninguém listado ainda.</p>`}</div>
      ${travado ? "" : `<button type="button" class="link pequeno" data-rel="mais" data-lista="equipe">${ICONES.mais}Adicionar pessoa</button>`}
      <label>Apoio da escola / parceiro<textarea class="campo" rows="3" data-campo="equipeTexto.apoio" placeholder="Ex.: equipe de esportes liberou a quadra coberta; portaria ajudou na saída…" ${travado}>${esc(r.equipeTexto?.apoio || "")}</textarea></label>`)}

    ${secao("programacao", "4. Programação", "O que aconteceu em cada dia. Dá para preencher no fim de cada dia, pelo celular.", `
      ${diasDaEdicao(p).map((d) => `
        <div class="rel-dia">
          <h4>${esc(DIAS[deISO(d).getDay()])} · ${esc(dataCurta(d))}${d === hoje() ? ` <span class="pilula">hoje</span>` : ""}</h4>
          <textarea class="campo" rows="3" data-campo="programacao.${d}" placeholder="Atividades da manhã e da tarde, tema do dia, destaque…" ${travado}>${esc(r.programacao?.[d] || "")}</textarea>
        </div>`).join("") || `<p class="texto-suave pequeno">Defina as datas da colônia (em Editar) para aparecerem os dias aqui.</p>`}
      <label>Passeio<textarea class="campo" rows="2" data-campo="extras.passeio" placeholder="Local, dia, quantas crianças foram, como foi" ${travado}>${esc(r.extras?.passeio || "")}</textarea></label>
      <label>Atividades especiais<textarea class="campo" rows="2" data-campo="extras.especiais" placeholder="Ex.: festa à fantasia, gincana final, apresentação para as famílias" ${travado}>${esc(r.extras?.especiais || "")}</textarea></label>`)}

    ${secao("ocorrencias", "5. Ocorrências", "Registro fixo, mesmo quando não houver nenhuma. Protege a Zum e dá segurança à escola.", `
      <label class="interruptor"><input type="checkbox" data-campo="nenhumaOcorrencia" ${r.nenhumaOcorrencia ? "checked" : ""} ${travado}><span></span>Nenhuma ocorrência nesta edição</label>
      <div class="rel-lista">${(r.ocorrencias || []).map((o, i) => `
        <div class="rel-ocorrencia">
          <div class="rel-linha">
            <input class="campo campo-data" type="date" data-lista="ocorrencias" data-i="${i}" data-k="data" value="${esc(o.data || "")}" ${travado}>
            <select class="campo" data-lista="ocorrencias" data-i="${i}" data-k="tipo" ${travado}>${TIPOS_OCORRENCIA.map((t) => `<option ${t === o.tipo ? "selected" : ""}>${esc(t)}</option>`).join("")}</select>
            ${travado ? "" : `<button type="button" class="botao-icone mini" data-rel="tirar" data-lista="ocorrencias" data-i="${i}" aria-label="Remover">${ICONES.x}</button>`}
          </div>
          <textarea class="campo" rows="2" placeholder="O que aconteceu (sem nome completo da criança: use as iniciais)" data-lista="ocorrencias" data-i="${i}" data-k="descricao" ${travado}>${esc(o.descricao || "")}</textarea>
          <textarea class="campo" rows="2" placeholder="Providência tomada e se a família foi avisada" data-lista="ocorrencias" data-i="${i}" data-k="providencia" ${travado}>${esc(o.providencia || "")}</textarea>
        </div>`).join("")}</div>
      ${travado || r.nenhumaOcorrencia ? "" : `<button type="button" class="link pequeno" data-rel="mais" data-lista="ocorrencias">${ICONES.mais}Registrar ocorrência</button>`}`)}

    ${secao("fotos", "6. Fotos", "Só de crianças com autorização de imagem.", `
      <label>Link da pasta do Google Drive com as fotos da edição
        <input class="campo" type="url" data-campo="fotos.link" placeholder="https://drive.google.com/…" value="${esc(r.fotos?.link || "")}" ${travado}></label>
      ${r.fotos?.link ? `<a class="link pequeno" href="${esc(r.fotos.link)}" target="_blank" rel="noopener">Abrir a pasta ↗</a>` : ""}
      <label>Fotos escolhidas para o relatório <small class="texto-suave">nomes dos arquivos ou uma descrição</small>
        <textarea class="campo" rows="2" data-campo="fotos.escolhidas" ${travado}>${esc(r.fotos?.escolhidas || "")}</textarea></label>`)}

    ${secao("sumario", "7. Sumário e destaques", "A coordenação rascunha; a Vanessa fecha.", `
      <label>Resumo da edição<textarea class="campo" rows="4" data-campo="sumario.texto" placeholder="Como foi a semana em poucas linhas" ${travado}>${esc(r.sumario?.texto || "")}</textarea></label>
      ${[0, 1, 2].map((i) => `<label>Destaque ${i + 1}<input class="campo" data-campo="sumario.d${i}" value="${esc(r.sumario?.["d" + i] || "")}" ${travado}></label>`).join("")}`)}`;
}

function desenharTopo() {
  const p = D.projeto(pid);
  if (!p) return;
  const r = rel();
  const st = r.status || "rascunho";
  const prog = progresso(r, p);
  const botoes = [];
  if (st === "rascunho") botoes.push(`<button type="button" class="botao primario" data-rel="status" data-v="enviado">Enviar para revisão</button>`);
  if (st === "enviado" && D.souAdmin()) botoes.push(`<button type="button" class="botao" data-rel="status" data-v="rascunho">Devolver para ajustes</button>`, `<button type="button" class="botao primario" data-rel="status" data-v="aprovado">Aprovar</button>`);
  if (st === "aprovado" && D.souAdmin()) botoes.push(`<button type="button" class="botao" data-rel="status" data-v="rascunho">Reabrir</button>`);
  raiz.querySelector("#rel-topo").innerHTML = `
    <div>
      <p class="sobretitulo">Relatório · ${esc(D.nomeEdicaoAtual(p) || "edição atual")}${rotuloPeriodo(p) ? ` · ${esc(rotuloPeriodo(p))}` : ""}</p>
      <h1>${esc(p.nome)}</h1>
      <div class="linha-pilulas"><span class="pilula rel-st-${st}">${STATUS[st]}</span>
        <span class="pequeno texto-suave">${prog.feitas} de ${prog.total} seções preenchidas</span>
        <small class="texto-suave" id="rel-salvo">${r.atualizadoPor ? `última mudança: ${esc(D.primeiroNome(r.atualizadoPor))}` : ""}</small></div>
    </div>
    <div class="acoes">${botoes.join("")}</div>`;
}

function progresso(r, p) {
  const ok = {
    ficha: !!(r.ficha && r.ficha.inscritos),
    publico: !!(r.publico?.turmas),
    equipe: !!(r.equipe?.length),
    programacao: diasDaEdicao(p).some((d) => r.programacao?.[d]),
    ocorrencias: !!(r.nenhumaOcorrencia || r.ocorrencias?.length),
    fotos: !!(r.fotos?.link),
    sumario: !!(r.sumario?.texto)
  };
  return { feitas: Object.values(ok).filter(Boolean).length, total: 7, ok };
}

function secao(id, titulo, ajuda, corpo) {
  const ok = progresso(rel(), D.projeto(pid)).ok[id];
  return `<section class="painel largo rel-secao" id="sec-${id}">
    <div class="painel-topo"><h3>${ok ? `<span class="rel-ok">${ICONES.check}</span>` : ""}${esc(titulo)}</h3></div>
    <p class="texto-suave pequeno">${esc(ajuda)}</p>
    <div class="formulario">${corpo}</div></section>`;
}

function diasDaEdicao(p) {
  if (!p?.dataInicio) return [];
  const fim = p.dataFim || p.dataInicio;
  const n = Math.min(diasEntre(p.dataInicio, fim), 30);
  const out = [];
  for (let i = 0; i <= n; i++) {
    const d = somarDias(p.dataInicio, i);
    const s = deISO(d).getDay();
    if (s !== 0 && s !== 6) out.push(d);
  }
  return out;
}

// ---------- Gravação (salva sozinho, sem botão) ----------
function salvarCampos(campos) {
  D.salvarRelatorio(pid, campos).then(() => {
    const el = raiz.querySelector("#rel-salvo");
    if (el) el.textContent = "Salvo";
  }).catch(() => {});
}

function agendar(chave, campos, espera, depois) {
  pendentes[chave] = campos;
  clearTimeout(timers[chave]);
  const st = raiz.querySelector("#rel-salvo");
  if (st) st.textContent = "Editando…";
  timers[chave] = setTimeout(() => {
    const c = pendentes[chave];
    delete pendentes[chave]; delete timers[chave];
    if (c) salvarCampos(c);
    if (depois) setTimeout(depois, 50);
  }, espera);
}

function aoDigitar(e) {
  const el = e.target;
  if (!podeEditar()) return;
  if (el.dataset.campo) {
    const caminho = el.dataset.campo.split(".");
    const valor = el.type === "checkbox" ? el.checked : el.type === "number" ? (el.value === "" ? null : Number(el.value)) : el.value;
    const campos = caminho.length === 1 ? { [caminho[0]]: valor } : { [caminho[0]]: { [caminho.slice(1).join(".")]: valor } };
    const redesenhar = el.type === "checkbox" || (el.type === "number" && e.type === "change");
    agendar(el.dataset.campo, campos, el.type === "checkbox" ? 0 : 700, redesenhar ? desenhar : null);
  } else if (el.dataset.lista) {
    // lê a lista inteira AGORA, do jeito que está na tela
    agendar(`lista:${el.dataset.lista}`, { [el.dataset.lista]: lerLista(el.dataset.lista) }, 700);
  }
}

function lerLista(nome) {
  const atual = [...(rel()[nome] || [])].map((x) => ({ ...x }));
  raiz.querySelectorAll(`[data-lista="${nome}"][data-k]`).forEach((el) => {
    const i = +el.dataset.i;
    atual[i] = atual[i] || {};
    atual[i][el.dataset.k] = el.value;
  });
  return atual;
}

async function clique(e) {
  const b = e.target.closest("[data-rel]");
  if (!b || !raiz.contains(b)) return;
  const acao = b.dataset.rel;
  if (acao === "mais") {
    const nome = b.dataset.lista;
    delete pendentes[`lista:${nome}`]; clearTimeout(timers[`lista:${nome}`]);
    const novo = nome === "ocorrencias" ? { data: hoje(), tipo: TIPOS_OCORRENCIA[0], descricao: "", providencia: "" } : { nome: "", funcao: "" };
    await D.salvarRelatorio(pid, { [nome]: [...lerLista(nome), novo] }).catch(() => {});
    desenhar();
  } else if (acao === "tirar") {
    const nome = b.dataset.lista;
    delete pendentes[`lista:${nome}`]; clearTimeout(timers[`lista:${nome}`]);
    const lista = lerLista(nome).filter((_, i) => i !== +b.dataset.i);
    await D.salvarRelatorio(pid, { [nome]: lista }).catch(() => {});
    desenhar();
  } else if (acao === "status") {
    await gravarPendentes();
    const v = b.dataset.v;
    const prog = progresso(rel(), D.projeto(pid));
    if (v === "enviado" && prog.feitas < prog.total &&
      !(await confirmar({ titulo: "Enviar para revisão?", texto: `Ainda faltam ${prog.total - prog.feitas} seções. Pode enviar assim mesmo; a Vanessa revisa e devolve se precisar.`, botao: "Enviar" }))) return;
    await D.salvarRelatorio(pid, { status: v, [`${v}Em`]: new Date().toISOString() }).catch(() => {});
    avisar(v === "enviado" ? "Relatório enviado para a Vanessa revisar" : v === "aprovado" ? "Relatório aprovado" : "Relatório reaberto para ajustes");
    desenhar();
  }
}
