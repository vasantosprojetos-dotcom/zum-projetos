// Tela AJUSTES: conta, backup e restauração, lixeira.
import * as D from "../dados.js";
import * as B from "../backup.js";
import { sair } from "../firebase.js";
import { esc, dataCurta, diasEntre, hoje } from "../util.js";
import { ICONES, avisar, confirmar } from "../componentes/ui.js";
import { VERSAO } from "../versao.js";

let raiz, usuario = null;

export function definirUsuario(u) { usuario = u; }

export function montar(el) {
  raiz = el;
  el.innerHTML = `
    <header class="cabecalho"><h1>Ajustes</h1></header>

    <section class="painel largo">
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
    </section>

    <section class="painel largo">
      <div class="painel-topo"><h3>${ICONES.lixo}Lixeira</h3></div>
      <p class="texto-suave pequeno">Tarefas e projetos excluídos ficam aqui por 30 dias antes de sumirem de vez.</p>
      <div id="lixeira"></div>
    </section>

    <section class="painel largo">
      <div class="painel-topo"><h3>${ICONES.pessoa}Conta</h3></div>
      <p class="pequeno">Conectada como <b>${esc(usuario?.email || "")}</b></p>
      <div class="linha-botoes"><button type="button" class="botao" id="sair">${ICONES.sair}Sair deste aparelho</button></div>
      <p class="texto-suave pequeno rodape-versao">Zum Projetos · versão ${VERSAO}</p>
    </section>`;

  el.querySelector("#sair").onclick = async () => {
    if (await confirmar({ titulo: "Sair?", texto: "Você vai precisar do e-mail e da senha para entrar de novo neste aparelho.", botao: "Sair" })) sair();
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
  el.addEventListener("click", cliqueAjustes);
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
  if (acao === "restaurar-copia") {
    const c = copias.find((x) => x.id === b.dataset.id);
    if (c) restaurarCom(JSON.parse(c.dados), `a cópia de ${dataCurta(c.criadoEm.slice(0, 10))}`);
  } else if (acao === "recuperar") {
    D.restaurar(b.dataset.tipo, b.dataset.id);
    avisar("Recuperado");
  } else if (acao === "apagar") {
    const ok = await confirmar({ titulo: "Apagar de vez?", texto: "Isso não pode ser desfeito.", botao: "Apagar", perigo: true });
    if (ok) { D.excluirDefinitivo(b.dataset.tipo, b.dataset.id); avisar("Apagado"); }
  }
}

export function atualizar() {
  if (!raiz) return;
  const itens = D.lixeira();
  raiz.querySelector("#lixeira").innerHTML = itens.length ? `<ul class="lista-simples">${itens.map(({ tipo, item, quando }) => {
    const resta = Math.max(0, 30 - diasEntre(quando.slice(0, 10), hoje()));
    return `<li><span class="data-tag">${tipo === "projeto" ? "Projeto" : "Tarefa"}</span>
      <span class="flex1">${esc(tipo === "projeto" ? item.nome : item.titulo)}<small class="texto-suave"> · some em ${resta} dia${resta === 1 ? "" : "s"}</small></span>
      <button type="button" class="link pequeno" data-aj="recuperar" data-tipo="${tipo}" data-id="${item.id}">Recuperar</button>
      <button type="button" class="link pequeno perigo" data-aj="apagar" data-tipo="${tipo}" data-id="${item.id}">Apagar</button></li>`;
  }).join("")}</ul>` : `<p class="texto-suave pequeno">A lixeira está vazia.</p>`;
}
