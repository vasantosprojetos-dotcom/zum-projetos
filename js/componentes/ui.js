// Peças de interface reaproveitadas: avisos (toast), janelas (modal), confirmação e menus.
import { esc } from "../util.js";

// ---------- Toast ----------
let toastTimer;
export function avisar(msg, acao) {
  let el = document.getElementById("toast");
  if (!el) { el = document.createElement("div"); el.id = "toast"; document.body.appendChild(el); }
  el.innerHTML = `<span>${esc(msg)}</span>${acao ? `<button type="button">${esc(acao.rotulo)}</button>` : ""}`;
  if (acao) el.querySelector("button").onclick = () => { acao.fn(); el.classList.remove("visivel"); };
  el.classList.add("visivel");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("visivel"), acao ? 5000 : 3000);
}

// ---------- Modal ----------
export function abrirModal({ titulo, corpo, rodape = "", largura = "", aoMontar }) {
  fecharModal();
  const fundo = document.createElement("div");
  fundo.className = "modal-fundo";
  fundo.innerHTML = `
    <div class="modal ${largura}" role="dialog" aria-modal="true" aria-label="${esc(titulo)}">
      <header class="modal-topo">
        <h2>${esc(titulo)}</h2>
        <button type="button" class="botao-icone" data-fechar aria-label="Fechar">${ICONES.x}</button>
      </header>
      <div class="modal-corpo">${corpo}</div>
      ${rodape ? `<footer class="modal-rodape">${rodape}</footer>` : ""}
    </div>`;
  document.body.appendChild(fundo);
  document.body.classList.add("sem-rolagem");
  requestAnimationFrame(() => fundo.classList.add("aberto"));
  fundo.addEventListener("mousedown", (e) => { if (e.target === fundo) fecharModal(); });
  fundo.querySelector("[data-fechar]").onclick = fecharModal;
  const m = fundo.querySelector(".modal");
  aoMontar && aoMontar(m);
  const foco = m.querySelector("[autofocus]");
  if (foco && window.matchMedia("(pointer: fine)").matches) setTimeout(() => foco.focus(), 50);
  return m;
}

export function fecharModal() {
  document.querySelectorAll(".modal-fundo").forEach((f) => f.remove());
  document.body.classList.remove("sem-rolagem");
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") { fecharMenu(); fecharModal(); }
});

// ---------- Confirmação ----------
export function confirmar({ titulo, texto, botao = "Confirmar", perigo = false }) {
  return new Promise((ok) => {
    abrirModal({
      titulo,
      largura: "estreita",
      corpo: `<p class="texto-suave">${esc(texto)}</p>`,
      rodape: `<button type="button" class="botao" data-nao>Cancelar</button>
               <button type="button" class="botao ${perigo ? "perigo" : "primario"}" data-sim>${esc(botao)}</button>`,
      aoMontar(m) {
        m.querySelector("[data-nao]").onclick = () => { fecharModal(); ok(false); };
        m.querySelector("[data-sim]").onclick = () => { fecharModal(); ok(true); };
      }
    });
  });
}

// ---------- Menu suspenso ----------
export function abrirMenu(ancora, itens) {
  fecharMenu();
  const menu = document.createElement("div");
  menu.className = "menu";
  menu.innerHTML = itens.map((it, i) =>
    it.separador ? `<hr>` : `<button type="button" data-i="${i}" class="${it.perigo ? "perigo" : ""}">${it.icone || ""}<span>${esc(it.rotulo)}</span>${it.extra ? `<small>${esc(it.extra)}</small>` : ""}</button>`
  ).join("");
  document.body.appendChild(menu);
  const r = ancora.getBoundingClientRect();
  const mw = menu.offsetWidth, mh = menu.offsetHeight;
  let left = Math.min(r.right - mw, window.innerWidth - mw - 12);
  left = Math.max(12, left);
  let top = r.bottom + 6;
  if (top + mh > window.innerHeight - 12) top = Math.max(12, r.top - mh - 6);
  menu.style.left = `${left}px`;
  menu.style.top = `${top}px`;
  menu.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-i]");
    if (!b) return;
    fecharMenu();
    itens[+b.dataset.i].fn();
  });
  setTimeout(() => document.addEventListener("mousedown", foraDoMenu), 0);
}
function foraDoMenu(e) { if (!e.target.closest(".menu")) fecharMenu(); }
export function fecharMenu() {
  document.querySelectorAll(".menu").forEach((m) => m.remove());
  document.removeEventListener("mousedown", foraDoMenu);
}

// ---------- Ícones (traço fino, estilo SF Symbols) ----------
const svg = (d, extra = "") => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${d}</svg>`;
export const ICONES = {
  hoje: svg(`<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/><circle cx="12" cy="15" r="1.6" fill="currentColor" stroke="none"/>`),
  projetos: svg(`<rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2"/>`),
  tarefas: svg(`<path d="M9 6.5h11M9 12h11M9 17.5h11"/><path d="M3.5 6.5l1.3 1.3 2.2-2.6M3.5 12l1.3 1.3 2.2-2.6M3.5 17.5l1.3 1.3 2.2-2.6"/>`),
  ajustes: svg(`<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>`),
  mais: svg(`<path d="M12 5v14M5 12h14"/>`),
  x: svg(`<path d="M6 6l12 12M18 6L6 18"/>`),
  relogio: svg(`<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>`),
  calendario: svg(`<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/>`),
  bandeira: svg(`<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>`),
  voltar: svg(`<path d="M15 5l-7 7 7 7"/>`),
  lapis: svg(`<path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/>`),
  lixo: svg(`<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12.5a1.5 1.5 0 0 0 1.5 1.5h7a1.5 1.5 0 0 0 1.5-1.5L18 7M9 7V4.5h6V7"/>`),
  arquivo: svg(`<rect x="3.5" y="4" width="17" height="5" rx="1.5"/><path d="M5 9v9.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V9M10 13h4"/>`),
  pessoa: svg(`<circle cx="12" cy="8" r="3.5"/><path d="M5 20c.8-3.5 3.6-5.5 7-5.5s6.2 2 7 5.5"/>`),
  nota: svg(`<path d="M6 3.5h8l4 4V20a.5.5 0 0 1-.5.5h-11A.5.5 0 0 1 6 20z"/><path d="M14 3.5V8h4M9 12h6M9 16h6"/>`),
  seta: svg(`<path d="M9 5l7 7-7 7"/>`),
  pausa: svg(`<circle cx="12" cy="12" r="8.5"/><path d="M10 9v6M14 9v6"/>`),
  nuvem: svg(`<path d="M7 18.5a4.5 4.5 0 0 1-.5-9A6 6 0 0 1 18 8.5a4 4 0 0 1-.5 10z"/>`),
  baixar: svg(`<path d="M12 4v11M7 10.5l5 5 5-5M5 20h14"/>`),
  subir: svg(`<path d="M12 16V5M7 9.5l5-5 5 5M5 20h14"/>`),
  desfazer: svg(`<path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>`),
  sair: svg(`<path d="M15 4h3.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H15M10 16l4-4-4-4M14 12H4"/>`),
  check: svg(`<path d="M5 12.5l4.5 4.5L19 7.5"/>`, `stroke-width="2.4"`),
  lupa: svg(`<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>`),
  mais3: svg(`<circle cx="6" cy="12" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="18" cy="12" r="1.3" fill="currentColor"/>`)
};
