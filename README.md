# Zum Projetos

App de tarefas e projetos da Zum Recreação.

- **Endereço:** https://vasantosprojetos-dotcom.github.io/zum-projetos/
- **Dados:** Firebase (projeto `zum-projetos`), protegidos por login e pelas regras em `firestore.rules`.
- **Publicar uma nova versão** não apaga dados: o código fica aqui, os dados ficam no Firebase.

## Organização do código

| Arquivo | O que faz |
|---|---|
| `js/app.js` | Login, navegação entre telas |
| `js/dados.js` | Projetos e tarefas (todas as operações) |
| `js/backup.js` | Cópia automática semanal, download e restauração |
| `js/firebase.js` | Conexão com o Firebase |
| `js/telas/` | Uma tela por arquivo: Hoje, Projetos, Tarefas, Ajustes |
| `js/componentes/` | Peças reaproveitadas (linha de tarefa, janelas, avisos) |
| `css/estilo.css` | Todo o visual |
| `js/versao.js` | Número da versão (mude a cada publicação) |
