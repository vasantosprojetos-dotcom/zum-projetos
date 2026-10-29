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

## Modelos e edições (versão 2.3)

- **Modelos** (menu da Vanessa): Modelo Escola e Modelo SMEL, vindos da planilha. Cada tarefa tem responsável por papel (direção ou coordenação local) e prazo = âncora + dias. Âncoras: Início, Término, Semana 2, Sáb. antes.
- **Feriados** (fim da tela Modelos): prazo que cai em fim de semana ou feriado volta para o dia útil anterior, igual à planilha.
- **Nova edição** (dentro de cada colônia): escolhe o modelo e as datas, encerra a edição atual (as tarefas ficam guardadas em "Edições") e gera as novas tarefas com responsáveis.
- **Painel da temporada** (tela Hoje da Vanessa): edições em andamento e carga por semana (20 ou mais tarefas = semana pesada).
- Modelos e feriados ficam em `config/modelos` e `config/feriados` no Firebase (regras já cobrem; só a Vanessa lê e escreve).
