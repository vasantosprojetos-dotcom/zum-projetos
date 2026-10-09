// Service worker: permite instalar o app no iPhone/computador e abrir sem internet.
// Estratégia "rede primeiro": sempre busca a versão mais nova; usa a cópia guardada só se estiver offline.
// Os DADOS não passam por aqui (ficam no Firebase), então atualizar o app nunca apaga nada.
const CACHE = "zum-projetos-v2";
const ARQUIVOS = [
  "./", "index.html", "manifest.json", "css/estilo.css",
  "js/app.js", "js/firebase.js", "js/firebase-config.js", "js/dados.js", "js/backup.js", "js/util.js", "js/versao.js",
  "js/componentes/ui.js", "js/componentes/tarefa.js",
  "js/telas/hoje.js", "js/telas/projetos.js", "js/telas/tarefas.js", "js/telas/ajustes.js",
  "icones/icone-192.png", "icones/icone-512.png", "icones/apple-touch-icon.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARQUIVOS)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((r) => {
        if (r.ok) { const copia = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copia)); }
        return r;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match("index.html")))
  );
});
