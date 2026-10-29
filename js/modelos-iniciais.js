// Modelos e feriados iniciais, tirados da planilha Checklists_Colonias_Zum.xlsx (28/10/2026).
// Só são usados na primeira vez; depois, tudo é editado na tela Modelos e fica no Firebase.
export const MODELOS_INICIAIS = [
 {
  "id": "escola",
  "nome": "Modelo Escola",
  "descricao": "Colônia em escola parceira",
  "fases": [
   "0. Estrutura",
   "1. Acordo com a escola",
   "2. Comunicação e inscrições",
   "3. Pedagógico e equipe",
   "4. Logística e compras",
   "5. Semana da colônia",
   "6. Fechamento"
  ],
  "tarefas": [
   {
    "titulo": "Conferir aba Estrutural: o que está pronto e o que precisa atualizar para esta temporada",
    "fase": "0. Estrutura",
    "area": "Estrutura",
    "papel": "direcao",
    "apoio": "",
    "ancora": "Início",
    "dias": -100,
    "notas": "",
    "id": "escola-001"
   },
   {
    "titulo": "Confirmar datas da colônia no calendário da escola",
    "fase": "1. Acordo com a escola",
    "area": "Escola",
    "papel": "direcao",
    "apoio": "",
    "ancora": "Início",
    "dias": -90,
    "notas": "",
    "id": "escola-002"
   },
   {
    "titulo": "Revisar precificação (custos, margem, descontos de irmãos e funcionários)",
    "fase": "1. Acordo com a escola",
    "area": "Financeiro",
    "papel": "direcao",
    "apoio": "",
    "ancora": "Início",
    "dias": -85,
    "notas": "",
    "id": "escola-003"
   },
   {
    "titulo": "Definir número de vagas, faixas etárias e mínimo de inscritos para viabilidade",
    "fase": "1. Acordo com a escola",
    "area": "Operação",
    "papel": "direcao",
    "apoio": "",
    "ancora": "Início",
    "dias": -85,
    "notas": "",
    "id": "escola-004"
   },
   {
    "titulo": "Definir passeio/atividade especial e checar disponibilidade do local",
    "fase": "1. Acordo com a escola",
    "area": "Passeio",
    "papel": "direcao",
    "apoio": "",
    "ancora": "Início",
    "dias": -80,
    "notas": "",
    "id": "escola-005"
   },
   {
    "titulo": "Definir período de inscrições (abertura e encerramento)",
    "fase": "1. Acordo com a escola",
    "area": "Inscrições",
    "papel": "direcao",
    "apoio": "",
    "ancora": "Início",
    "dias": -80,
    "notas": "",
    "id": "escola-006"
   },
   {
    "titulo": "Preencher o modelo de proposta e enviar para aprovação da escola",
    "fase": "1. Acordo com a escola",
    "area": "Escola",
    "papel": "direcao",
    "apoio": "",
    "ancora": "Início",
    "dias": -75,
    "notas": "",
    "id": "escola-007"
   },
   {
    "titulo": "Cobrar aprovação da proposta (dar à escola uma data-limite para decidir)",
    "fase": "1. Acordo com a escola",
    "area": "Escola",
    "papel": "direcao",
    "apoio": "",
    "ancora": "Início",
    "dias": -65,
    "notas": "",
    "id": "escola-008"
   },
   {
    "titulo": "Assinar contrato/termo de parceria com a escola",
    "fase": "1. Acordo com a escola",
    "area": "Escola",
    "papel": "direcao",
    "apoio": "",
    "ancora": "Início",
    "dias": -60,
    "notas": "",
    "id": "escola-009"
   },
   {
    "titulo": "Enviar proposta formal de patrocínio (cotas e contrapartidas)",
    "fase": "1. Acordo com a escola",
    "area": "Patrocínio",
    "papel": "direcao",
    "apoio": "",
    "ancora": "Início",
    "dias": -70,
    "notas": "",
    "id": "escola-010"
   },
   {
    "titulo": "Fechar patrocínio (o logo precisa estar definido antes da camisa e das artes)",
    "fase": "1. Acordo com a escola",
    "area": "Patrocínio",
    "papel": "direcao",
    "apoio": "",
    "ancora": "Início",
    "dias": -55,
    "notas": "",
    "id": "escola-011"
   },
   {
    "titulo": "Revisar contrato com responsáveis (termo de imagem, cancelamento, LGPD)",
    "fase": "2. Comunicação e inscrições",
    "area": "Inscrições",
    "papel": "direcao",
    "apoio": "",
    "ancora": "Início",
    "dias": -55,
    "notas": "",
    "id": "escola-012"
   },
   {
    "titulo": "Aplicar as artes de divulgação da edição e enviar para aprovação da comunicação da escola",
    "fase": "2. Comunicação e inscrições",
    "area": "Comunicação",
    "papel": "direcao",
    "apoio": "",
    "ancora": "Início",
    "dias": -55,
    "notas": "",
    "id": "escola-013"
   },
   {
    "titulo": "Atualizar site de inscrição (datas, preços, vagas, fotos, textos)",
    "fase": "2. Comunicação e inscrições",
    "area": "Inscrições",
    "papel": "direcao",
    "apoio": "",
    "ancora": "Início",
    "dias": -52,
    "notas": "",
    "id": "escola-014"
   },
   {
    "titulo": "Reunião com a comunicação da escola: cronograma de postagens, bilhete na agenda, barraquinhas",
    "fase": "2. Comunicação e inscrições",
    "area": "Comunicação",
    "papel": "direcao",
    "apoio": "",
    "ancora": "Início",
    "dias": -52,
    "notas": "",
    "id": "escola-015"
   },
   {
    "titulo": "Testar inscrição completa (pagamento, e-mail de confirmação, relatório de inscritos)",
    "fase": "2. Comunicação e inscrições",
    "area": "Inscrições",
    "papel": "direcao",
    "apoio": "",
    "ancora": "Início",
    "dias": -48,
    "notas": "",
    "id": "escola-016"
   },
   {
    "titulo": "Solicitar bilhete na agenda das crianças",
    "fase": "2. Comunicação e inscrições",
    "area": "Comunicação",
    "papel": "direcao",
    "apoio": "",
    "ancora": "Início",
    "dias": -48,
    "notas": "",
    "id": "escola-017"
   },
   {
    "titulo": "Cronograma de postagens Instagram Zum (repostar escola + conteúdo próprio + patrocinador)",
    "fase": "2. Comunicação e inscrições",
    "area": "Comunicação",
    "papel": "local",
    "apoio": "",
    "ancora": "Início",
    "dias": -48,
    "notas": "",
    "id": "escola-018"
   },
   {
    "titulo": "Definir datas das barraquinhas de divulgação presencial e a decoração da barraca",
    "fase": "2. Comunicação e inscrições",
    "area": "Comunicação",
    "papel": "local",
    "apoio": "",
    "ancora": "Início",
    "dias": -48,
    "notas": "",
    "id": "escola-019"
   },
   {
    "titulo": "Configurar mensagem automática do WhatsApp com link do site",
    "fase": "2. Comunicação e inscrições",
    "area": "Comunicação",
    "papel": "local",
    "apoio": "",
    "ancora": "Início",
    "dias": -46,
    "notas": "",
    "id": "escola-020"
   },
   {
    "titulo": "ABRIR INSCRIÇÕES",
    "fase": "2. Comunicação e inscrições",
    "area": "Inscrições",
    "papel": "direcao",
    "apoio": "",
    "ancora": "Início",
    "dias": -45,
    "notas": "",
    "id": "escola-021"
   },
   {
    "titulo": "1ª onda: e-mail + WhatsApp para a base de contatos das últimas colônias",
    "fase": "2. Comunicação e inscrições",
    "area": "Comunicação",
    "papel": "direcao",
    "apoio": "local",
    "ancora": "Início",
    "dias": -44,
    "notas": "",
    "id": "escola-022"
   },
   {
    "titulo": "Imprimir panfletos e material das barraquinhas",
    "fase": "2. Comunicação e inscrições",
    "area": "Comunicação",
    "papel": "direcao",
    "apoio": "",
    "ancora": "Início",
    "dias": -42,
    "notas": "",
    "id": "escola-023"
   },
   {
    "titulo": "Ponto de controle 1: inscritos x meta (abaixo de 40% → reforçar divulgação)",
    "fase": "2. Comunicação e inscrições",
    "area": "Inscrições",
    "papel": "direcao",
    "apoio": "",
    "ancora": "Início",
    "dias": -30,
    "notas": "",
    "id": "escola-024"
   },
   {
    "titulo": "2ª onda: lembrete por e-mail + WhatsApp",
    "fase": "2. Comunicação e inscrições",
    "area": "Comunicação",
    "papel": "direcao",
    "apoio": "local",
    "ancora": "Início",
    "dias": -21,
    "notas": "",
    "id": "escola-025"
   },
   {
    "titulo": "Ponto de controle 2: inscritos x meta → define tamanho da equipe e grade de camisas",
    "fase": "2. Comunicação e inscrições",
    "area": "Inscrições",
    "papel": "direcao",
    "apoio": "",
    "ancora": "Início",
    "dias": -21,
    "notas": "",
    "id": "escola-026"
   },
   {
    "titulo": "3ª onda: \"últimas vagas\"",
    "fase": "2. Comunicação e inscrições",
    "area": "Comunicação",
    "papel": "direcao",
    "apoio": "local",
    "ancora": "Início",
    "dias": -10,
    "notas": "",
    "id": "escola-027"
   },
   {
    "titulo": "Encerrar inscrições e exportar relatório final de inscritos",
    "fase": "2. Comunicação e inscrições",
    "area": "Inscrições",
    "papel": "direcao",
    "apoio": "",
    "ancora": "Início",
    "dias": -5,
    "notas": "",
    "id": "escola-028"
   },
   {
    "titulo": "Planejamento por faixa etária a partir do banco de atividades",
    "fase": "3. Pedagógico e equipe",
    "area": "Pedagógico",
    "papel": "local",
    "apoio": "",
    "ancora": "Início",
    "dias": -40,
    "notas": "",
    "id": "escola-029"
   },
   {
    "titulo": "Reunião com a equipe de esportes da escola: espaços, horários e regras",
    "fase": "3. Pedagógico e equipe",
    "area": "Pedagógico",
    "papel": "local",
    "apoio": "",
    "ancora": "Início",
    "dias": -35,
    "notas": "",
    "id": "escola-030"
   },
   {
    "titulo": "Pré-reservar monitores (convite com as datas)",
    "fase": "3. Pedagógico e equipe",
    "area": "Equipe",
    "papel": "direcao",
    "apoio": "",
    "ancora": "Início",
    "dias": -35,
    "notas": "",
    "id": "escola-031"
   },
   {
    "titulo": "Criar a avaliação que será feita com as crianças",
    "fase": "3. Pedagógico e equipe",
    "area": "Pedagógico",
    "papel": "local",
    "apoio": "direcao",
    "ancora": "Início",
    "dias": -14,
    "notas": "",
    "id": "escola-032"
   },
   {
    "titulo": "Fechar equipe conforme inscritos (proporção monitor/criança por idade)",
    "fase": "3. Pedagógico e equipe",
    "area": "Equipe",
    "papel": "direcao",
    "apoio": "",
    "ancora": "Início",
    "dias": -14,
    "notas": "",
    "id": "escola-033"
   },
   {
    "titulo": "Termos/contratos e escala dos monitores",
    "fase": "3. Pedagógico e equipe",
    "area": "Equipe",
    "papel": "direcao",
    "apoio": "",
    "ancora": "Início",
    "dias": -10,
    "notas": "",
    "id": "escola-034"
   },
   {
    "titulo": "Enviar aos responsáveis o informativo de regras e rotina",
    "fase": "3. Pedagógico e equipe",
    "area": "Comunicação",
    "papel": "local",
    "apoio": "",
    "ancora": "Início",
    "dias": -7,
    "notas": "",
    "id": "escola-035"
   },
   {
    "titulo": "Capacitação dos monitores (planejamento, regras, segurança)",
    "fase": "3. Pedagógico e equipe",
    "area": "Equipe",
    "papel": "local",
    "apoio": "",
    "ancora": "Início",
    "dias": -7,
    "notas": "",
    "id": "escola-036"
   },
   {
    "titulo": "Arte da camisa da edição aprovada (layout base + cor/ano/patrocinador)",
    "fase": "4. Logística e compras",
    "area": "Camisas",
    "papel": "direcao",
    "apoio": "",
    "ancora": "Início",
    "dias": -45,
    "notas": "",
    "id": "escola-037"
   },
   {
    "titulo": "Orçamento de ônibus para o passeio",
    "fase": "4. Logística e compras",
    "area": "Passeio",
    "papel": "direcao",
    "apoio": "",
    "ancora": "Início",
    "dias": -30,
    "notas": "",
    "id": "escola-038"
   },
   {
    "titulo": "Lista de materiais por dia (item, quantidade e link)",
    "fase": "4. Logística e compras",
    "area": "Materiais",
    "papel": "local",
    "apoio": "",
    "ancora": "Início",
    "dias": -25,
    "notas": "",
    "id": "escola-039"
   },
   {
    "titulo": "Definir modelo do lanche, cardápio e equipe do lanche",
    "fase": "4. Logística e compras",
    "area": "Lanche",
    "papel": "direcao",
    "apoio": "",
    "ancora": "Início",
    "dias": -21,
    "notas": "",
    "id": "escola-040"
   },
   {
    "titulo": "Fechar grade de tamanhos e enviar pedido das camisas",
    "fase": "4. Logística e compras",
    "area": "Camisas",
    "papel": "direcao",
    "apoio": "",
    "ancora": "Início",
    "dias": -20,
    "notas": "",
    "id": "escola-041"
   },
   {
    "titulo": "Conferir estoque permanente x lista e fazer orçamentos",
    "fase": "4. Logística e compras",
    "area": "Materiais",
    "papel": "direcao",
    "apoio": "",
    "ancora": "Início",
    "dias": -20,
    "notas": "",
    "id": "escola-042"
   },
   {
    "titulo": "Reservar ônibus do passeio",
    "fase": "4. Logística e compras",
    "area": "Passeio",
    "papel": "direcao",
    "apoio": "",
    "ancora": "Início",
    "dias": -20,
    "notas": "",
    "id": "escola-043"
   },
   {
    "titulo": "Compras de materiais",
    "fase": "4. Logística e compras",
    "area": "Materiais",
    "papel": "direcao",
    "apoio": "",
    "ancora": "Início",
    "dias": -12,
    "notas": "",
    "id": "escola-044"
   },
   {
    "titulo": "Receber e conferir camisas (quantidade e tamanhos)",
    "fase": "4. Logística e compras",
    "area": "Camisas",
    "papel": "direcao",
    "apoio": "",
    "ancora": "Início",
    "dias": -5,
    "notas": "",
    "id": "escola-045"
   },
   {
    "titulo": "Listas de chamada por turma, crachás, fichas de saúde e autorizações",
    "fase": "4. Logística e compras",
    "area": "Operação",
    "papel": "local",
    "apoio": "",
    "ancora": "Início",
    "dias": -3,
    "notas": "",
    "id": "escola-046"
   },
   {
    "titulo": "Kit de primeiros socorros e lista de contatos de emergência",
    "fase": "4. Logística e compras",
    "area": "Operação",
    "papel": "direcao",
    "apoio": "",
    "ancora": "Início",
    "dias": -3,
    "notas": "",
    "id": "escola-047"
   },
   {
    "titulo": "Confirmar ônibus (horário, endereço, contato do motorista)",
    "fase": "4. Logística e compras",
    "area": "Passeio",
    "papel": "direcao",
    "apoio": "",
    "ancora": "Início",
    "dias": -3,
    "notas": "",
    "id": "escola-048"
   },
   {
    "titulo": "Compras do lanche",
    "fase": "4. Logística e compras",
    "area": "Lanche",
    "papel": "direcao",
    "apoio": "",
    "ancora": "Início",
    "dias": -2,
    "notas": "",
    "id": "escola-049"
   },
   {
    "titulo": "Conferência e montagem dos materiais por dia/turma",
    "fase": "4. Logística e compras",
    "area": "Operação",
    "papel": "local",
    "apoio": "",
    "ancora": "Início",
    "dias": -1,
    "notas": "",
    "id": "escola-050"
   },
   {
    "titulo": "Reunião de abertura e fechamento diário com a equipe",
    "fase": "5. Semana da colônia",
    "area": "Execução",
    "papel": "local",
    "apoio": "direcao",
    "ancora": "Início",
    "dias": 0,
    "notas": "",
    "id": "escola-051"
   },
   {
    "titulo": "Registro diário de fotos e vídeos (para relatório e próxima divulgação)",
    "fase": "5. Semana da colônia",
    "area": "Execução",
    "papel": "local",
    "apoio": "",
    "ancora": "Início",
    "dias": 0,
    "notas": "",
    "id": "escola-052"
   },
   {
    "titulo": "Aplicar a avaliação com as crianças",
    "fase": "5. Semana da colônia",
    "area": "Execução",
    "papel": "local",
    "apoio": "",
    "ancora": "Término",
    "dias": -1,
    "notas": "",
    "id": "escola-053"
   },
   {
    "titulo": "Enviar formulário de avaliação aos pais",
    "fase": "5. Semana da colônia",
    "area": "Execução",
    "papel": "local",
    "apoio": "",
    "ancora": "Término",
    "dias": 0,
    "notas": "",
    "id": "escola-054"
   },
   {
    "titulo": "Devolver espaços, recolher e inventariar materiais permanentes",
    "fase": "6. Fechamento",
    "area": "Fechamento",
    "papel": "local",
    "apoio": "",
    "ancora": "Término",
    "dias": 2,
    "notas": "",
    "id": "escola-055"
   },
   {
    "titulo": "Pagar equipe e fornecedores",
    "fase": "6. Fechamento",
    "area": "Financeiro",
    "papel": "direcao",
    "apoio": "",
    "ancora": "Término",
    "dias": 5,
    "notas": "",
    "id": "escola-056"
   },
   {
    "titulo": "Prestação de contas financeira (receitas, custos, margem)",
    "fase": "6. Fechamento",
    "area": "Financeiro",
    "papel": "direcao",
    "apoio": "",
    "ancora": "Término",
    "dias": 10,
    "notas": "",
    "id": "escola-057"
   },
   {
    "titulo": "Relatório final com avaliações (pais, crianças, equipe) e fotos",
    "fase": "6. Fechamento",
    "area": "Relatório",
    "papel": "local",
    "apoio": "direcao",
    "ancora": "Término",
    "dias": 15,
    "notas": "",
    "id": "escola-058"
   },
   {
    "titulo": "Reunião de avaliação com a escola (comunicação e direção)",
    "fase": "6. Fechamento",
    "area": "Escola",
    "papel": "direcao",
    "apoio": "",
    "ancora": "Término",
    "dias": 20,
    "notas": "",
    "id": "escola-059"
   },
   {
    "titulo": "Registrar aprendizados e atualizar o Modelo e a aba Estrutural",
    "fase": "6. Fechamento",
    "area": "Melhoria",
    "papel": "direcao",
    "apoio": "",
    "ancora": "Término",
    "dias": 20,
    "notas": "",
    "id": "escola-060"
   }
  ]
 },
 {
  "id": "smel",
  "nome": "Modelo SMEL",
  "descricao": "Colônia em parceria com a SMEL (Itabira)",
  "fases": [
   "0. Estrutura",
   "1. Alinhamento com a SMEL",
   "4. Logística e compras",
   "2. Comunicação e inscrições",
   "3. Equipe",
   "5. Semana da colônia",
   "6. Fechamento"
  ],
  "tarefas": [
   {
    "titulo": "Conferir aba Estrutural: o que está pronto e o que precisa atualizar para esta temporada",
    "fase": "0. Estrutura",
    "area": "Estrutura",
    "papel": "direcao",
    "apoio": "",
    "ancora": "Início",
    "dias": -100,
    "notas": "",
    "id": "smel-001"
   },
   {
    "titulo": "Reunião de alinhamento com a SMEL: datas, local, metas de atendimento e recursos",
    "fase": "1. Alinhamento com a SMEL",
    "area": "SMEL",
    "papel": "direcao",
    "apoio": "",
    "ancora": "Início",
    "dias": -90,
    "notas": "",
    "id": "smel-002"
   },
   {
    "titulo": "Conferir plano de trabalho e saldo de recursos por rubrica",
    "fase": "1. Alinhamento com a SMEL",
    "area": "SMEL",
    "papel": "direcao",
    "apoio": "",
    "ancora": "Início",
    "dias": -85,
    "notas": "",
    "id": "smel-003"
   },
   {
    "titulo": "Solicitar remanejamento de recursos (monitores fixos, lanche, hospedagem, carro)",
    "fase": "1. Alinhamento com a SMEL",
    "area": "SMEL",
    "papel": "direcao",
    "apoio": "",
    "ancora": "Início",
    "dias": -80,
    "notas": "",
    "id": "smel-004"
   },
   {
    "titulo": "Confirmar local (Valério?) e formalizar a locação",
    "fase": "1. Alinhamento com a SMEL",
    "area": "Local",
    "papel": "direcao",
    "apoio": "",
    "ancora": "Início",
    "dias": -75,
    "notas": "",
    "id": "smel-005"
   },
   {
    "titulo": "Lista de compras e de materiais esportivos para o processo de compra da SMEL",
    "fase": "4. Logística e compras",
    "area": "Compras",
    "papel": "local",
    "apoio": "direcao",
    "ancora": "Início",
    "dias": -60,
    "notas": "",
    "id": "smel-006"
   },
   {
    "titulo": "Contratar hospedagem para monitores e equipe de alimentação (Dona Elza / salão Valério)",
    "fase": "1. Alinhamento com a SMEL",
    "area": "Hospedagem",
    "papel": "direcao",
    "apoio": "local",
    "ancora": "Início",
    "dias": -60,
    "notas": "Na última edição ficamos no próprio clube",
    "id": "smel-007"
   },
   {
    "titulo": "Solicitar à comunicação da SMEL arte de banner, cartaz e pulseira",
    "fase": "2. Comunicação e inscrições",
    "area": "Comunicação",
    "papel": "direcao",
    "apoio": "",
    "ancora": "Início",
    "dias": -60,
    "notas": "",
    "id": "smel-008"
   },
   {
    "titulo": "Informar tecido e fechar arte das camisas",
    "fase": "4. Logística e compras",
    "area": "Camisas",
    "papel": "direcao",
    "apoio": "",
    "ancora": "Início",
    "dias": -50,
    "notas": "",
    "id": "smel-009"
   },
   {
    "titulo": "Orçamentos de materiais",
    "fase": "4. Logística e compras",
    "area": "Compras",
    "papel": "local",
    "apoio": "direcao",
    "ancora": "Início",
    "dias": -50,
    "notas": "",
    "id": "smel-010"
   },
   {
    "titulo": "Solicitar/atualizar a ficha de inscrição com a SMEL",
    "fase": "2. Comunicação e inscrições",
    "area": "Inscrições",
    "papel": "local",
    "apoio": "",
    "ancora": "Início",
    "dias": -45,
    "notas": "",
    "id": "smel-011"
   },
   {
    "titulo": "Levantar disponibilidade de monitores (indicados SMEL, UNA, FACILITA)",
    "fase": "3. Equipe",
    "area": "Monitores",
    "papel": "local",
    "apoio": "",
    "ancora": "Início",
    "dias": -45,
    "notas": "",
    "id": "smel-012"
   },
   {
    "titulo": "Alinhar com os CRAS: inscrições e pontos de referência do transporte",
    "fase": "2. Comunicação e inscrições",
    "area": "Inscrições",
    "papel": "local",
    "apoio": "",
    "ancora": "Início",
    "dias": -40,
    "notas": "Verificar CRAS como ponto de referência do transporte",
    "id": "smel-013"
   },
   {
    "titulo": "Contatar família Montanha (apoio)",
    "fase": "3. Equipe",
    "area": "Monitores",
    "papel": "local",
    "apoio": "",
    "ancora": "Início",
    "dias": -40,
    "notas": "",
    "id": "smel-014"
   },
   {
    "titulo": "Fechar parceria de alimentação (Deus Conserva) e cardápio",
    "fase": "4. Logística e compras",
    "area": "Alimentação",
    "papel": "direcao",
    "apoio": "",
    "ancora": "Início",
    "dias": -40,
    "notas": "",
    "id": "smel-015"
   },
   {
    "titulo": "Verificar recurso, definir local e orçar transporte do passeio",
    "fase": "4. Logística e compras",
    "area": "Passeio",
    "papel": "local",
    "apoio": "",
    "ancora": "Início",
    "dias": -40,
    "notas": "Na última edição o recurso de transporte foi insuficiente — buscar alternativas cedo",
    "id": "smel-016"
   },
   {
    "titulo": "Contratar salva-vidas, profissional de saúde e auxiliar de serviços gerais",
    "fase": "3. Equipe",
    "area": "Funcionários",
    "papel": "direcao",
    "apoio": "",
    "ancora": "Início",
    "dias": -35,
    "notas": "",
    "id": "smel-017"
   },
   {
    "titulo": "Confecção das camisas",
    "fase": "4. Logística e compras",
    "area": "Camisas",
    "papel": "direcao",
    "apoio": "",
    "ancora": "Início",
    "dias": -35,
    "notas": "",
    "id": "smel-018"
   },
   {
    "titulo": "Locação de infláveis",
    "fase": "4. Logística e compras",
    "area": "Locações",
    "papel": "direcao",
    "apoio": "",
    "ancora": "Início",
    "dias": -35,
    "notas": "",
    "id": "smel-019"
   },
   {
    "titulo": "Contratar ônibus (4 veículos)",
    "fase": "4. Logística e compras",
    "area": "Transporte",
    "papel": "local",
    "apoio": "",
    "ancora": "Início",
    "dias": -35,
    "notas": "",
    "id": "smel-020"
   },
   {
    "titulo": "Compra/impressão de banner e cartaz",
    "fase": "2. Comunicação e inscrições",
    "area": "Comunicação",
    "papel": "direcao",
    "apoio": "",
    "ancora": "Início",
    "dias": -30,
    "notas": "",
    "id": "smel-021"
   },
   {
    "titulo": "Montar programação semanal (2 semanas)",
    "fase": "3. Equipe",
    "area": "Programação",
    "papel": "local",
    "apoio": "",
    "ancora": "Início",
    "dias": -30,
    "notas": "",
    "id": "smel-022"
   },
   {
    "titulo": "Pedido/compra das pulseiras",
    "fase": "4. Logística e compras",
    "area": "Compras",
    "papel": "direcao",
    "apoio": "",
    "ancora": "Início",
    "dias": -30,
    "notas": "",
    "id": "smel-023"
   },
   {
    "titulo": "Empréstimo de mesas, cadeiras e projetor com a SMEL",
    "fase": "4. Logística e compras",
    "area": "Locações",
    "papel": "direcao",
    "apoio": "",
    "ancora": "Início",
    "dias": -14,
    "notas": "",
    "id": "smel-024"
   },
   {
    "titulo": "Inscrições abertas (CRAS e SMEL)",
    "fase": "2. Comunicação e inscrições",
    "area": "Inscrições",
    "papel": "local",
    "apoio": "SMEL",
    "ancora": "Início",
    "dias": -12,
    "notas": "",
    "id": "smel-025"
   },
   {
    "titulo": "Fechar grupo de monitores e monitores de transporte",
    "fase": "3. Equipe",
    "area": "Monitores",
    "papel": "local",
    "apoio": "",
    "ancora": "Início",
    "dias": -10,
    "notas": "",
    "id": "smel-026"
   },
   {
    "titulo": "Aquisição e conferência dos materiais pela SMEL",
    "fase": "4. Logística e compras",
    "area": "Compras",
    "papel": "local",
    "apoio": "SMEL",
    "ancora": "Início",
    "dias": -10,
    "notas": "",
    "id": "smel-027"
   },
   {
    "titulo": "Confirmar agendamento do passeio",
    "fase": "4. Logística e compras",
    "area": "Passeio",
    "papel": "local",
    "apoio": "",
    "ancora": "Início",
    "dias": -10,
    "notas": "",
    "id": "smel-028"
   },
   {
    "titulo": "Frete das camisas direto para Itabira",
    "fase": "4. Logística e compras",
    "area": "Camisas",
    "papel": "direcao",
    "apoio": "",
    "ancora": "Início",
    "dias": -7,
    "notas": "",
    "id": "smel-029"
   },
   {
    "titulo": "Encerrar inscrições e consolidar inscritos",
    "fase": "2. Comunicação e inscrições",
    "area": "Inscrições",
    "papel": "local",
    "apoio": "",
    "ancora": "Início",
    "dias": -6,
    "notas": "",
    "id": "smel-030"
   },
   {
    "titulo": "Fazer rotas dos ônibus a partir dos inscritos",
    "fase": "4. Logística e compras",
    "area": "Transporte",
    "papel": "local",
    "apoio": "",
    "ancora": "Início",
    "dias": -4,
    "notas": "",
    "id": "smel-031"
   },
   {
    "titulo": "Listas de chamada por semana e por rota",
    "fase": "2. Comunicação e inscrições",
    "area": "Inscrições",
    "papel": "local",
    "apoio": "",
    "ancora": "Início",
    "dias": -3,
    "notas": "",
    "id": "smel-032"
   },
   {
    "titulo": "Capacitação dos monitores no sábado anterior",
    "fase": "3. Equipe",
    "area": "Monitores",
    "papel": "local",
    "apoio": "",
    "ancora": "Sáb. antes",
    "dias": 0,
    "notas": "",
    "id": "smel-033"
   },
   {
    "titulo": "Reunião de abertura e fechamento diário com a equipe",
    "fase": "5. Semana da colônia",
    "area": "Execução",
    "papel": "local",
    "apoio": "direcao",
    "ancora": "Início",
    "dias": 0,
    "notas": "",
    "id": "smel-034"
   },
   {
    "titulo": "Registro diário de fotos, listas de presença e ocorrências (exigência da prestação de contas)",
    "fase": "5. Semana da colônia",
    "area": "Execução",
    "papel": "local",
    "apoio": "",
    "ancora": "Início",
    "dias": 0,
    "notas": "",
    "id": "smel-035"
   },
   {
    "titulo": "Virada para a semana 2: listas de chamada, rotas e reposição de materiais",
    "fase": "5. Semana da colônia",
    "area": "Semana 2",
    "papel": "local",
    "apoio": "",
    "ancora": "Semana 2",
    "dias": -3,
    "notas": "",
    "id": "smel-036"
   },
   {
    "titulo": "Aplicar avaliação com crianças/famílias",
    "fase": "5. Semana da colônia",
    "area": "Execução",
    "papel": "local",
    "apoio": "",
    "ancora": "Término",
    "dias": 0,
    "notas": "",
    "id": "smel-037"
   },
   {
    "titulo": "Devolver espaços e equipamentos emprestados; inventariar materiais",
    "fase": "6. Fechamento",
    "area": "Fechamento",
    "papel": "local",
    "apoio": "",
    "ancora": "Término",
    "dias": 2,
    "notas": "",
    "id": "smel-038"
   },
   {
    "titulo": "Pagar equipe e fornecedores",
    "fase": "6. Fechamento",
    "area": "Financeiro",
    "papel": "direcao",
    "apoio": "",
    "ancora": "Término",
    "dias": 5,
    "notas": "",
    "id": "smel-039"
   },
   {
    "titulo": "Prestação de contas à SMEL (notas, listas de presença, fotos)",
    "fase": "6. Fechamento",
    "area": "SMEL",
    "papel": "direcao",
    "apoio": "",
    "ancora": "Término",
    "dias": 15,
    "notas": "",
    "id": "smel-040"
   },
   {
    "titulo": "Relatório de cumprimento do objeto",
    "fase": "6. Fechamento",
    "area": "SMEL",
    "papel": "direcao",
    "apoio": "local",
    "ancora": "Término",
    "dias": 20,
    "notas": "",
    "id": "smel-041"
   },
   {
    "titulo": "Reunião de avaliação com a SMEL",
    "fase": "6. Fechamento",
    "area": "SMEL",
    "papel": "direcao",
    "apoio": "",
    "ancora": "Término",
    "dias": 25,
    "notas": "",
    "id": "smel-042"
   },
   {
    "titulo": "Registrar aprendizados e atualizar o Modelo e a aba Estrutural",
    "fase": "6. Fechamento",
    "area": "Melhoria",
    "papel": "direcao",
    "apoio": "",
    "ancora": "Término",
    "dias": 25,
    "notas": "",
    "id": "smel-043"
   }
  ]
 }
];

export const FERIADOS_INICIAIS = [
 {
  "data": "2026-11-02",
  "nome": "Finados"
 },
 {
  "data": "2026-11-15",
  "nome": "Proclamação da República"
 },
 {
  "data": "2026-11-20",
  "nome": "Consciência Negra"
 },
 {
  "data": "2026-12-08",
  "nome": "Imaculada Conceição (BH)"
 },
 {
  "data": "2026-12-24",
  "nome": "Recesso de fim de ano"
 },
 {
  "data": "2026-12-25",
  "nome": "Recesso de fim de ano"
 },
 {
  "data": "2026-12-26",
  "nome": "Recesso de fim de ano"
 },
 {
  "data": "2026-12-27",
  "nome": "Recesso de fim de ano"
 },
 {
  "data": "2026-12-28",
  "nome": "Recesso de fim de ano"
 },
 {
  "data": "2026-12-29",
  "nome": "Recesso de fim de ano"
 },
 {
  "data": "2026-12-30",
  "nome": "Recesso de fim de ano"
 },
 {
  "data": "2026-12-31",
  "nome": "Recesso de fim de ano"
 },
 {
  "data": "2027-01-01",
  "nome": "Recesso de fim de ano"
 },
 {
  "data": "2027-02-08",
  "nome": "Carnaval"
 },
 {
  "data": "2027-02-09",
  "nome": "Carnaval"
 },
 {
  "data": "2027-04-02",
  "nome": "Sexta-feira Santa"
 },
 {
  "data": "2027-04-21",
  "nome": "Tiradentes"
 }
];
