// Tela AJUSTES: conta, backup e restauração, lixeira.
import * as D from "../dados.js";
import * as B from "../backup.js";
import { sair } from "../firebase.js";
import { esc, dataCurta, diasEntre, hoje } from "../util.js";
import { ICONES, avisar, confirmar, abrirModal, fecharModal } from "../componentes/ui.js";
import { VERSAO } from "../versao.js";

let raiz, usuario = null;

export function definirUsuario(u) { usuario = u; }

export function montar(el) {
  raiz = el;
  const admin = D.souAdmin();
  el.innerHTML = `
    <header class="cabecalho"><h1>Ajustes</h1></header>

    ${admin ? `<section class="painel largo">
      <div class="painel-topo"><h3>${ICONES.pessoa}Equipe</h3>
        <button type="button" class="botao pequeno" data-aj="nova-pessoa">${ICONES.mais}Adicionar pessoa</button></div>
      <p class="texto-suave pequeno">Cada pessoa vê só as colônias marcadas aqui. Antes, crie o login dela no Firebase (Authentication → Users → Add user) com o mesmo e-mail.</p>
      <div id="equipe"></div>
    </section>

    <section class="painel largo">
      <div class="painel-topo"><h3>${ICONES.subir}Importar checklist</h3></div>
      <p class="texto-suave pequeno">Traz as tarefas de cada edição da planilha (arquivo .json preparado pelo Claude) para dentro de uma colônia.</p>
      <div class="linha-botoes"><label class="botao">${ICONES.subir}Escolher arquivo<input type="file" accept=".json,application/json" id="imp-arquivo" hidden></label></div>
      <div id="imp-previa"></div>
    </section>` : ""}

    ${admin ? `<section class="painel largo">
      <div class="painel-topo"><h3>${ICONES.nuvem}Backup</h3></div>
      <p class="texto-suave pequeno">Seus dados ficam guardados no Firebase e sincronizam sozinhos. Além disso, o app faz uma <b>cópia automática por semana</b> e guarda as 8 mais recentes. Você também pode baixar um arquivo para guardar no computador.</p>
      <p class="pequeno" id="bk-info">Carregando…</p>
      <div class="linha-botoes">
        <button type="button" class="botao" id="bk-agora">${ICONES.nuvem}Fazer cópia agora</button>
        <button type="button" class="botao" id="bk-baixar">${ICONES.baixar}Baixar backup (.json)</button>
        <label class="botao">${ICONES.subir}Restaurar de arquivo<input type="file" accept=".json,application/json" id="bk-arquivo" hidden></label>
      </div>
      <h4>Cópias automáticas</h4>
      <div id="bk-lista"><p class="texto-suave pequeno">Carregando…</p></div>
    </section>` : ""}

    <section class="painel largo">
      <div class="painel-topo"><h3>${ICONES.lixo}Lixeira</h3></div>
      <p class="texto-suave pequeno">${admin ? "Tarefas e projetos excluídos ficam aqui por 30 dias antes de sumirem de vez." : "Tarefas excluídas ficam aqui até a Vanessa esvaziar a lixeira. Você pode recuperar qualquer uma."}</p>
      <div id="lixeira"></div>
    </section>

    <section class="painel largo">
      <div class="painel-topo"><h3>${ICONES.pessoa}Conta</h3></div>
      <p class="pequeno">Conectado(a) como <b>${esc(usuario?.nome || "")}</b> · ${esc(usuario?.email || "")}</p>
      <div class="linha-botoes"><button type="button" class="botao" id="sair">${ICONES.sair}Sair deste aparelho</button></div>
      <p class="texto-suave pequeno rodape-versao">Zum Projetos · versão ${VERSAO}</p>
    </section>`;

  el.addEventListener("click", cliqueAjustes);
  el.querySelector("#sair").onclick = async () => {
    if (await confirmar({ titulo: "Sair?", texto: "Você vai precisar do e-mail e da senha para entrar de novo neste aparelho.", botao: "Sair" })) sair();
  };
  if (!admin) { atualizar(); return; }
  el.querySelector("#imp-arquivo").onchange = async (e) => {
    const arq = e.target.files[0];
    e.target.value = "";
    if (!arq) return;
    try {
      const obj = JSON.parse(await arq.text());
      if (obj.app !== "zum-checklists" || !Array.isArray(obj.edicoes)) throw new Error();
      importacao = obj;
      desenharImportacao();
    } catch { avisar("Esse arquivo não é um checklist preparado para o app."); }
  };
  el.querySelector("#bk-agora").onclick = async () => {
    try { await B.fazerCopia("manual"); avisar("Cópia feita"); carregarBackups(); }
    catch { avisar("Não consegui fazer a cópia. Confira a internet."); }
  };
  el.querySelector("#bk-baixar").onclick = () => { B.baixarArquivo(); avisar("Backup baixado"); };
  el.querySelector("#bk-arquivo").onchange = async (e) => {
    const arq = e.target.files[0];
    e.target.value = "";
    if (!arq) return;
    try {
      const obj = JSON.parse(await arq.text());
      if (!B.validar(obj)) throw new Error();
      await restaurarCom(obj, `o arquivo "${arq.name}"`);
    } catch { avisar("Esse arquivo não é um backup do Zum Projetos."); }
  };
  carregarBackups();
  atualizar();
}

async function restaurarCom(obj, origem) {
  const ok = await confirmar({
    titulo: "Restaurar backup?",
    texto: `Tudo o que está no app agora será substituído pelo conteúdo de ${origem} (${obj.projetos.length} projetos, ${obj.tarefas.length} tarefas). Antes disso, o app guarda uma cópia do estado atual, por segurança.`,
    botao: "Restaurar", perigo: true
  });
  if (!ok) return;
  try {
    await B.restaurar(obj);
    avisar("Backup restaurado");
    carregarBackups();
  } catch (e) { console.error(e); avisar("Não consegui restaurar. Nada foi perdido; tente de novo."); }
}

let copias = [];
async function carregarBackups() {
  try {
    const info = await B.infoBackup();
    copias = await B.listarCopias();
    const partes = [];
    partes.push(info.ultimaCopia ? `Última cópia: <b>${esc(dataCurta(info.ultimaCopia.slice(0, 10)))}</b>` : "Nenhuma cópia ainda");
    partes.push(info.ultimoDownload ? `último arquivo baixado: ${esc(dataCurta(info.ultimoDownload.slice(0, 10)))}` : "nenhum arquivo baixado ainda");
    raiz.querySelector("#bk-info").innerHTML = partes.join(" · ");
    raiz.querySelector("#bk-lista").innerHTML = copias.length ? `<ul class="lista-simples">${copias.map((c) => `
      <li><span class="data-tag">${esc(dataCurta(c.criadoEm.slice(0, 10)))}</span>
      <span class="flex1">${esc(c.tipo)} · ${c.resumo?.projetos ?? "?"} projetos, ${c.resumo?.tarefas ?? "?"} tarefas</span>
      <button type="button" class="link pequeno" data-aj="restaurar-copia" data-id="${c.id}">Restaurar</button></li>`).join("")}</ul>`
      : `<p class="texto-suave pequeno">A primeira cópia é feita automaticamente.</p>`;
  } catch (e) {
    console.error(e);
    raiz.querySelector("#bk-info").textContent = "Não consegui ler os backups agora.";
  }
}

async function cliqueAjustes(e) {
  const b = e.target.closest("[data-aj]");
  if (!b || !raiz.contains(b)) return;
  const acao = b.dataset.aj;
  if (acao === "nova-pessoa") editarPessoa(null);
  else if (acao === "editar-pessoa") editarPessoa(b.dataset.id);
  else if (acao === "importar") importar(+b.dataset.i);
  else if (acao === "restaurar-copia") {
    const c = copias.find((x) => x.id === b.dataset.id);
    if (c) restaurarCom(JSON.parse(c.dados), `a cópia de ${dataCurta(c.criadoEm.slice(0, 10))}`);
  } else if (acao === "recuperar") {
    D.restaurar(b.dataset.tipo, b.dataset.id);
    avisar("Recuperado");
  } else if (acao === "apagar") {
    if (!D.souAdmin()) return;
    const ok = await confirmar({ titulo: "Apagar de vez?", texto: "Isso não pode ser desfeito.", botao: "Apagar", perigo: true });
    if (ok) { D.excluirDefinitivo(b.dataset.tipo, b.dataset.id); avisar("Apagado"); }
  }
}

export function atualizar() {
  if (!raiz) return;
  desenharEquipe();
  if (importacao && !importando) desenharImportacao();
  const itens = D.lixeira();
  raiz.querySelector("#lixeira").innerHTML = itens.length ? `<ul class="lista-simples">${itens.map(({ tipo, item, quando }) => {
    const resta = Math.max(0, 30 - diasEntre(quando.slice(0, 10), hoje()));
    return `<li><span class="data-tag">${tipo === "projeto" ? "Projeto" : "Tarefa"}</span>
      <span class="flex1">${esc(tipo === "projeto" ? item.nome : item.titulo)}<small class="texto-suave">${D.souAdmin() ? ` · some em ${resta} dia${resta === 1 ? "" : "s"}` : ""}</small></span>
      <button type="button" class="link pequeno" data-aj="recuperar" data-tipo="${tipo}" data-id="${item.id}">Recuperar</button>
      ${D.souAdmin() ? `<button type="button" class="link pequeno perigo" data-aj="apagar" data-tipo="${tipo}" data-id="${item.id}">Apagar</button>` : ""}</li>`;
  }).join("")}</ul>` : `<p class="texto-suave pequeno">A lixeira está vazia.</p>`;
}

// ---------------- Equipe ----------------
function desenharEquipe() {
  const el = raiz.querySelector("#equipe");
  if (!el) return;
  const nomesColonias = (ids) => (ids || []).map((id) => D.projeto(id)?.nome).filter(Boolean);
  const ps = D.pessoas().filter((p) => p.papel !== "admin");
  el.innerHTML = ps.length ? `<ul class="lista-simples">${ps.map((p) => `
    <li><span class="flex1"><b>${esc(p.nome || p.id)}</b>${p.ativo === false ? ` <span class="pilula">sem acesso</span>` : ""}<br>
      <small class="texto-suave">${esc(p.id)} · ${esc(nomesColonias(p.colonias).join(", ") || "nenhuma colônia")}</small></span>
      <button type="button" class="link pequeno" data-aj="editar-pessoa" data-id="${esc(p.id)}">Editar</button></li>`).join("")}</ul>`
    : `<p class="texto-suave pequeno">Ninguém cadastrado ainda.</p>`;
}

function editarPessoa(email) {
  const p = email ? D.pessoas().find((x) => x.id === email) : { nome: "", colonias: [], ativo: true };
  const cols = D.colonias();
  abrirModal({
    titulo: email ? "Editar pessoa" : "Adicionar pessoa",
    corpo: `<form class="formulario" id="form-pessoa" autocomplete="off">
      <label>Nome<input class="campo" name="nome" value="${esc(p.nome || "")}" required ${email ? "" : "autofocus"}></label>
      <label>E-mail do login<input class="campo" name="email" type="email" value="${esc(email || "")}" ${email ? "readonly" : "required"}></label>
      <fieldset class="caixas"><legend>Colônias que vê</legend>
        ${cols.length ? cols.map((c) => `<label class="caixa"><input type="checkbox" name="col" value="${c.id}" ${(p.colonias || []).includes(c.id) ? "checked" : ""}> ${esc(c.nome)}${c.grupo ? ` <small class="texto-suave">· ${esc(c.grupo)}</small>` : ""}</label>`).join("")
          : `<p class="texto-suave pequeno">Nenhum projeto marcado como colônia ainda. Abra o projeto, toque em Editar e escolha o tipo Colônia.</p>`}
      </fieldset>
      <label class="interruptor"><input type="checkbox" name="ativo" ${p.ativo !== false ? "checked" : ""}><span></span>Acesso liberado</label>
    </form>`,
    rodape: `<span class="espaco"></span><button type="button" class="botao" data-cancelar>Cancelar</button>
      <button type="submit" form="form-pessoa" class="botao primario">Salvar</button>`,
    aoMontar(m) {
      m.querySelector("[data-cancelar]").onclick = fecharModal;
      const f = m.querySelector("form");
      f.onsubmit = async (e) => {
        e.preventDefault();
        const em = (email || f.email.value).trim().toLowerCase();
        if (!em || !f.nome.value.trim()) return;
        const colonias = [...f.querySelectorAll('input[name="col"]:checked')].map((x) => x.value);
        await D.salvarPessoa(em, { nome: f.nome.value.trim(), papel: "coord", colonias, ativo: f.ativo.checked }).catch(() => null);
        fecharModal();
        avisar("Equipe atualizada");
      };
    }
  });
}

// ---------------- Importar checklist ----------------
let importacao = null;
function desenharImportacao() {
  const el = raiz.querySelector("#imp-previa");
  if (!importacao) { el.innerHTML = ""; return; }
  // Guarda o que já foi escolhido, para não perder a escolha quando os dados atualizam
  const escolhidos = {};
  el.querySelectorAll("select[id^='imp-dest-']").forEach((s) => { if (s.value) escolhidos[s.id] = s.value; });
  // Nenhum destino vem marcado: você sempre escolhe. "Criar colônia nova" fica por último.
  const opcoes = D.todosProjetos().map((p) =>
    `<option value="${p.id}">${esc(p.nome)}${p.tipo === "colonia" ? " (colônia)" : ""}</option>`).join("");
  el.innerHTML = `<ul class="lista-simples">${importacao.edicoes.map((ed, i) => {
    const onde = D.ondeFoiImportada(ed.nome);
    return `<li class="imp-linha"><span class="flex1"><b>${esc(ed.nome)}</b><br><small class="texto-suave">${ed.tarefas.length} tarefas · ${esc(ed.periodo || "")}</small></span>
      ${onde.length ? `<span class="pilula" title="Para importar de novo, mande antes essas tarefas para a lixeira">Já importada em ${esc(onde.map((x) => x.projeto.nome).join(", "))}</span>` : `
      <select class="campo" id="imp-dest-${i}" aria-label="Destino de ${esc(ed.nome)}">
        <option value="" selected disabled>Escolha o destino…</option>${opcoes}
        <option disabled>──────────</option>
        <option value="__novo__">+ Criar colônia nova: ${esc(ed.nomeSugerido || ed.nome)}</option></select>
      <button type="button" class="botao pequeno primario" data-aj="importar" data-i="${i}">Importar</button>`}</li>`;
  }).join("")}</ul>
    <p class="texto-suave pequeno">Cada edição só entra uma vez: o app reconhece o que já foi importado, mesmo depois de fechar, e pula as tarefas que o destino já tem com o mesmo nome e fase. O responsável vem da planilha: “Vanessa” fica com você; a coordenação local vai para o coordenador cadastrado naquela colônia em Equipe (cadastre a equipe antes de importar).</p>`;
  for (const [id, v] of Object.entries(escolhidos)) {
    const s = el.querySelector(`#${id}`);
    if (s && [...s.options].some((o) => o.value === v)) s.value = v;
  }
}

let importando = false;
async function importar(i) {
  if (importando) return;
  const ed = importacao.edicoes[i];
  const destino = raiz.querySelector(`#imp-dest-${i}`)?.value || "";
  if (!destino) { avisar("Escolha para onde vão as tarefas antes de importar."); return; }
  const onde = D.ondeFoiImportada(ed.nome);
  if (onde.length) { avisar(`Essa edição já está em ${onde.map((x) => x.projeto.nome).join(", ")}.`); desenharImportacao(); return; }

  let texto;
  if (destino === "__novo__") {
    const nome = ed.nomeSugerido || ed.nome;
    const parecido = D.todosProjetos().find((p) => D.mesmoNome(p.nome, nome));
    if (parecido) {
      avisar(`Já existe um projeto chamado "${parecido.nome}". Escolha ele na lista em vez de criar outro.`);
      return;
    }
    texto = `Vai ser criado um projeto NOVO, "${nome}", com ${ed.tarefas.length} tarefas de "${ed.nome}". Se essa colônia já existe no app, cancele e escolha ela na lista.`;
  } else {
    const p = D.projeto(destino);
    const jaTem = D.tarefasDoProjeto(destino).length;
    const iguais = D.jaExistemNoDestino(ed, destino);
    const entram = ed.tarefas.length - iguais;
    texto = `${entram} tarefas de "${ed.nome}" vão para "${p.nome}"`
      + (jaTem ? `, que já tem ${jaTem}` : "")
      + (iguais ? `. ${iguais} já existem lá com o mesmo nome e fase e serão puladas` : "")
      + `. ${p.tipo === "colonia" ? "" : "O projeto passa a ser uma colônia."}`;
    if (!entram) { avisar(`"${p.nome}" já tem todas as tarefas dessa edição. Nada a importar.`); return; }
  }
  const ok = await confirmar({ titulo: "Importar tarefas?", texto, botao: "Importar" });
  if (!ok) return;
  importando = true;
  raiz.querySelectorAll('[data-aj="importar"]').forEach((b) => (b.disabled = true));
  try {
    const r = await D.importarEdicao(ed, destino, ed.nomeSugerido);
    avisar(`${r.tarefas} tarefas importadas${r.puladas ? ` · ${r.puladas} já existiam` : ""}${r.local ? ` · coordenação: ${r.local}` : ""}`);
  } catch (e) {
    console.error(e);
    avisar(e.message === "ja-importada" ? "Essa edição já foi importada." : "Não consegui importar. Nada foi perdido; tente de novo.");
  } finally {
    importando = false;
    desenharImportacao();
  }
}
