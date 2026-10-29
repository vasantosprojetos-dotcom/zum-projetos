// Ponto de partida: login, navegação entre telas e ligação com os dados.
import * as fb from "./firebase.js";
import * as D from "./dados.js";
import { copiaAutomaticaSePreciso } from "./backup.js";
import { VERSAO } from "./versao.js";
import { ICONES, avisar, fecharMenu, fecharModal } from "./componentes/ui.js";
import { tratarAcaoTarefa, editarTarefa } from "./componentes/tarefa.js";
import { esc, hoje } from "./util.js";
import * as Hoje from "./telas/hoje.js";
import * as Projetos from "./telas/projetos.js";
import * as Tarefas from "./telas/tarefas.js";
import * as Ajustes from "./telas/ajustes.js";

const app = document.getElementById("app");
const TELAS = { hoje: Hoje, projetos: Projetos, projeto: Projetos, tarefas: Tarefas, ajustes: Ajustes };
let telaAtual = null;
let shellMontado = false;

D.definirAvisoErro((msg) => avisar(msg));

// ---------------- Login ----------------
function telaLogin(msgErro = "") {
  shellMontado = false;
  app.innerHTML = `
    <main class="login">
      <form class="login-caixa" id="form-login">
        <img src="icones/icone-192.png" alt="" class="login-logo" width="64" height="64">
        <h1>Zum Projetos</h1>
        <p class="texto-suave">Entre para ver seus projetos e tarefas.</p>
        <input class="campo" type="email" name="email" placeholder="E-mail" autocomplete="username" required>
        <input class="campo" type="password" name="senha" placeholder="Senha" autocomplete="current-password" required>
        <p class="erro" id="login-erro">${esc(msgErro)}</p>
        <button class="botao primario largo" type="submit">Entrar</button>
        <button class="link pequeno" type="button" id="esqueci">Esqueci minha senha</button>
      </form>
    </main>`;
  const f = document.getElementById("form-login");
  const erro = document.getElementById("login-erro");
  f.onsubmit = async (e) => {
    e.preventDefault();
    erro.textContent = "";
    const b = f.querySelector("button[type=submit]");
    b.disabled = true; b.textContent = "Entrando…";
    try { await fb.entrar(f.email.value.trim(), f.senha.value); }
    catch (err) {
      erro.textContent = err.code === "auth/too-many-requests"
        ? "Muitas tentativas. Espere alguns minutos e tente de novo."
        : "E-mail ou senha não conferem.";
      b.disabled = false; b.textContent = "Entrar";
    }
  };
  document.getElementById("esqueci").onclick = async () => {
    const email = f.email.value.trim();
    if (!email) { erro.textContent = "Digite seu e-mail acima e toque de novo em “Esqueci minha senha”."; return; }
    try { await fb.redefinirSenha(email); erro.textContent = ""; avisar("Enviamos um link para o seu e-mail."); }
    catch { erro.textContent = "Não consegui enviar o e-mail. Confira o endereço."; }
  };
}

// ---------------- Estrutura (menu + conteúdo) ----------------
const NAV = [
  { rota: "hoje", rotulo: "Hoje", icone: ICONES.hoje },
  { rota: "projetos", rotulo: "Projetos", icone: ICONES.projetos },
  { rota: "tarefas", rotulo: "Tarefas", icone: ICONES.tarefas },
  { rota: "ajustes", rotulo: "Ajustes", icone: ICONES.ajustes }
];

function montarShell() {
  app.innerHTML = `
    <div class="shell">
      <nav class="lateral" aria-label="Menu">
        <div class="marca"><img src="icones/icone-192.png" alt="" width="28" height="28"><span>Zum Projetos</span></div>
        ${NAV.map((n) => `<a href="#/${n.rota}" data-rota="${n.rota}">${n.icone}<span>${n.rotulo}</span><b class="badge" data-badge="${n.rota}" hidden></b></a>`).join("")}
        <button type="button" class="botao primario nova-tarefa-lateral" data-acao="nova-tarefa">${ICONES.mais}Nova tarefa</button>
      </nav>
      <main class="conteudo" id="conteudo"><div class="carregando"><span></span></div></main>
      <nav class="abas-inferiores" aria-label="Menu">
        ${NAV.map((n) => `<a href="#/${n.rota}" data-rota="${n.rota}">${n.icone}<span>${n.rotulo}</span><b class="badge" data-badge="${n.rota}" hidden></b></a>`).join("")}
      </nav>
      <button type="button" class="flutuante" data-acao="nova-tarefa" aria-label="Nova tarefa">${ICONES.mais}</button>
    </div>`;
  shellMontado = true;
}

function rotaAtual() {
  const [, nome = "hoje", id] = (location.hash || "#/hoje").split("/");
  return { nome: TELAS[nome] ? nome : "hoje", id };
}

function navegar() {
  if (!shellMontado) return;
  fecharMenu(); fecharModal();
  const { nome, id } = rotaAtual();
  const ativo = nome === "projeto" ? "projetos" : nome;
  document.querySelectorAll("[data-rota]").forEach((a) => a.classList.toggle("ativo", a.dataset.rota === ativo));
  const el = document.getElementById("conteudo");
  if (!D.pronto()) { el.innerHTML = `<div class="carregando"><span></span></div>`; telaAtual = null; return; }
  telaAtual = TELAS[nome];
  el.scrollTop = 0;
  window.scrollTo(0, 0);
  el.innerHTML = `<div class="pagina" id="pagina"></div>`;
  telaAtual.montar(document.getElementById("pagina"), { id });
  atualizarBadges();
}

function atualizarBadges() {
  const h = hoje();
  const eu = D.eu()?.email;
  const atrasadas = D.tarefasVivas().filter((t) => D.naMao(t) && t.prazo && t.prazo < h && (!t.responsavel || t.responsavel === eu)).length;
  document.querySelectorAll('[data-badge="hoje"]').forEach((b) => { b.textContent = atrasadas || ""; b.hidden = !atrasadas; });
}

window.addEventListener("hashchange", navegar);

// Cliques em ações (delegação: funciona para qualquer lista em qualquer tela)
document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-acao]");
  if (!el) return;
  const acao = el.dataset.acao;
  if (acao === "nova-tarefa") {
    const { nome, id } = rotaAtual();
    editarTarefa(null, nome === "projeto" && id ? { projetoId: id } : nome === "hoje" ? { prazo: hoje() } : {});
    return;
  }
  if (tratarAcaoTarefa(acao, el)) e.preventDefault();
});

// Atalho: tecla "n" abre nova tarefa (no computador)
document.addEventListener("keydown", (e) => {
  if (e.key === "n" && !e.metaKey && !e.ctrlKey && !e.altKey && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName) && !document.querySelector(".modal-fundo")) {
    e.preventDefault();
    editarTarefa(null);
  }
});

// ---------------- Dados em tempo real ----------------
let jaNavegou = false;
D.aoMudar(() => {
  if (!D.pronto()) return;
  if (!jaNavegou || !telaAtual) { jaNavegou = true; navegar(); return; }
  telaAtual.atualizar();
  atualizarBadges();
});

// ---------------- Sessão ----------------
function telaAviso(titulo, texto) {
  shellMontado = false;
  app.innerHTML = `
    <main class="login">
      <div class="login-caixa">
        <img src="icones/icone-192.png" alt="" class="login-logo" width="64" height="64">
        <h1>${esc(titulo)}</h1>
        <p class="texto-suave">${texto}</p>
        <button class="botao largo" type="button" id="aviso-sair">Sair</button>
      </div>
    </main>`;
  document.getElementById("aviso-sair").onclick = () => fb.sair();
}

let desligarPerfil = null;
function comecar(perfil) {
  Ajustes.definirUsuario(perfil);
  if (!shellMontado) montarShell();
  jaNavegou = false;
  navegar();
  D.iniciar(perfil);
}

fb.aoMudarUsuario(async (u) => {
  if (desligarPerfil) { desligarPerfil(); desligarPerfil = null; }
  if (!u) { D.parar(); jaNavegou = false; telaLogin(); return; }
  app.innerHTML = `<div class="carregando"><span></span></div>`;
  shellMontado = false;

  if (u.uid === fb.UID_ADMIN) {
    try {
      const r = await D.migrarSePreciso(u);
      if (!r.jaFeito) avisar(`Dados movidos para a pasta da equipe: ${r.projetos} projetos, ${r.tarefas} tarefas.`);
    } catch (e) {
      console.error(e);
      telaAviso("Falta um passo", "Não consegui preparar os dados para a equipe. Confira se as novas regras de segurança foram publicadas no Firebase e entre de novo.");
      return;
    }
    const minha = await fb.lerUm("pessoas", u.email).catch(() => null);
    comecar({ email: u.email, nome: minha?.nome || "Vanessa", admin: true, colonias: [] });
    await D.prepararPrimeiroUso().catch((e) => console.warn(e));
    setTimeout(() => {
      if (!D.pronto()) return;
      copiaAutomaticaSePreciso();
      D.limparLixeiraAntiga();
    }, 4000);
    return;
  }

  // Coordenadores: o cadastro em "pessoas" diz quais colônias cada um vê.
  let chave = null;
  desligarPerfil = fb.ouvirDoc("pessoas", u.email, (p) => {
    if (!p || p.ativo === false) {
      chave = null; D.parar();
      telaAviso("Acesso ainda não liberado", `Sua conta (${esc(u.email)}) existe, mas ainda não foi ligada a nenhuma colônia. Fale com a Vanessa.`);
      return;
    }
    const perfil = { email: u.email, nome: p.nome || u.email.split("@")[0], admin: false, colonias: p.colonias || [] };
    const nova = JSON.stringify(perfil);
    if (nova === chave) return;
    chave = nova;
    comecar(perfil);
  }, (e) => {
    console.error(e);
    telaAviso("Acesso ainda não liberado", `Sua conta (${esc(u.email)}) ainda não foi cadastrada na equipe. Fale com a Vanessa.`);
  });
});

// ---------------- App instalável (PWA) ----------------
if ("serviceWorker" in navigator && location.protocol === "https:") {
  navigator.serviceWorker.register(`sw.js?v=${VERSAO}`).then((reg) => {
    reg.addEventListener("updatefound", () => {
      const novo = reg.installing;
      novo?.addEventListener("statechange", () => {
        if (novo.state === "installed" && navigator.serviceWorker.controller) {
          avisar("Nova versão disponível", { rotulo: "Atualizar", fn: () => location.reload() });
        }
      });
    });
  }).catch(() => {});
}
