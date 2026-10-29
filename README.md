# Zum Projetos

App de tarefas e projetos da Zum Recreação.

- **Endereço:** https://vasantosprojetos-dotcom.github.io/zum-projetos/
- **Dados:** Firebase (projeto `zum-projetos`), protegidos por login e pelas regras em `firestore.rules`.
- **Publicar uma nova versão** não apaga dados: o código fica aqui, os dados ficam no Firebase.

## Equipe (versão 2)

- A Vanessa (administradora) vê tudo. Cada coordenador vê só as colônias marcadas para ele em **Ajustes → Equipe**.
- Projetos têm um **tipo**: *Colônia* (a equipe pode ver) ou *Projeto avulso* (só a Vanessa).
- Para dar acesso a alguém: 1) criar o login no Firebase (Authentication → Users → Add user); 2) cadastrar a pessoa em Ajustes → Equipe com o mesmo e-mail e as colônias.
- Tarefas têm responsável, quem apoia, área, comentários e histórico automático.
- Coordenadores mandam tarefas para a lixeira; só a Vanessa apaga de vez.
- Os dados ficam na pasta comum do banco. A pasta antiga (`usuarios/…`) não foi apagada e serve de cópia de segurança.

## Organização do código

| Arquivo | O que faz |
|---|---|
| `js/app.js` | Login, navegação entre telas |
| `js/dados.js` | Projetos, tarefas, equipe, migração e importação de checklist |
| `js/backup.js` | Cópia automática semanal, download e restauração |
| `js/firebase.js` | Conexão com o Firebase |
| `js/telas/` | Uma tela por arquivo: Hoje, Projetos, Tarefas, Ajustes |
| `js/componentes/` | Peças reaproveitadas (linha de tarefa, janelas, avisos) |
| `css/estilo.css` | Todo o visual |
| `js/versao.js` | Número da versão (mude a cada publicação) |
