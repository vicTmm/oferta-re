# Pesquisa e evidências para o TCC

Data: 08/10/2026. Curso, prazo, orientação e exigências institucionais pendentes.

## Recorte sugerido

Título provisório: "Desenvolvimento e avaliação de um sistema de monitoramento de cadastros públicos de resseguradoras da SUSEP".

Pergunta: "Em que medida a automação da coleta, comparação e consulta de cadastros públicos melhora o tempo e a rastreabilidade da rotina de acompanhamento de resseguradoras?"

Objetivo geral: desenvolver e avaliar o sistema em tarefas de consulta e acompanhamento. Objetivos específicos: caracterizar a rotina atual, definir requisitos, implementar controles de qualidade da coleta, manter histórico de diferenças e avaliar correção, tempo e usabilidade.

O modelo comercial pode integrar a discussão de viabilidade. Escalabilidade técnica, adoção e viabilidade comercial exigem evidências diferentes; sucesso em um desses aspectos não comprova os demais.

## Método proposto

Combinar desenvolvimento de artefato com avaliação aplicada, ajustando o método à orientação acadêmica. Realizar entrevistas exploratórias, explicitar requisitos, desenvolver em etapas e comparar tarefas no processo atual e no produto.

Antes da coleta com pessoas, alinhar com o orientador as regras institucionais para participação, consentimento e eventual avaliação ética. Documentar o uso de ferramentas de IA conforme as regras do curso. Humanizer serve à revisão de redação e não substitui declaração de uso de IA, autoria, referências ou avaliação dos resultados.

## Entrevista inicial

1. Conte a última vez que precisou verificar uma resseguradora. O que motivou a consulta?
2. Mostre o caminho usado, sem informações confidenciais. Quanto tempo levou?
3. Com que frequência isso acontece e quem participa?
4. Que dado precisa guardar para comprovar a verificação?
5. Como descobre e revisa uma mudança? O que acontece quando a fonte falha?
6. Em períodos sem mudanças, qual trabalho continua necessário?
7. Que ferramentas já usa e o que falta nelas?
8. Quem aprovaria uma contratação? Qual condição faria testar ou abandonar o produto?

Separar relato observado, interpretação do pesquisador e hipótese. Uma declaração de interesse não equivale a uma compra.

## Avaliação técnica

| Cenário | Evidência esperada |
| --- | --- |
| Entidade nova | Diferença corretamente identificada, com referência à coleta |
| Campo alterado | Campo e valores anterior/observado corretos |
| Entidade ausente | Ocorrência indicada sem afirmar cancelamento |
| Base igual | Ausência de diferenças |
| Base parcial ou duplicada | Execução rejeitada e baseline preservado |
| Fonte indisponível | Falha registrada e última base válida disponível |
| Reexecução de envio | Nenhum alerta duplicado |
| Duas organizações | Listas, revisões e destinatários isolados |

Manter conjuntos controlados e versões do HTML usadas no parser. Marcar dados sintéticos. Para mudanças reais, fazer revisão independente da evidência disponível. Os arquivos atuais contêm apenas comparações sem mudanças; não permitem estimar sensibilidade da detecção em produção.

## Avaliação com usuários

Tarefas propostas: localizar uma entidade, informar a data da coleta, verificar um campo, identificar uma mudança e exportar evidência. Comparar com o método que o participante usa hoje, com tarefas equivalentes e ordem alternada quando possível para reduzir efeito de aprendizado.

Registrar tempo, conclusão, erro, necessidade de ajuda e compreensão dos avisos. Informar quantidade e perfil dos participantes e limitações da amostra. Perguntas de satisfação podem complementar a observação, mas não substituem desempenho medido.

Economia de tempo = (tempo do processo anterior menos tempo no produto) dividido pelo tempo anterior. Apresentar distribuição e variação entre participantes, não apenas uma média. Sem medições, não afirmar percentuais de ganho.

Rastreabilidade: avaliar se um terceiro consegue identificar fonte, horário, base anterior e diferença a partir da evidência exportada. Escalabilidade: medir consulta e ingestão separadamente sob cargas definidas; documentar ambiente, tamanho de base, concorrência, latência e erros. Um teste com 132 registros não comprova desempenho com milhões de registros.

## Organização das evidências

Manter junto à documentação pública: arquitetura, requisitos, decisões, versões de telas, resultados agregados e links de commits. Guardar entrevistas e arquivos identificáveis em local restrito, fora do Git público. Capturas e planilhas devem ser revisadas antes de publicação.

| Registro | Campos mínimos |
| --- | --- |
| Entrevista | ID anônimo, data, perfil, rotina, evidência, hipótese e ação |
| Experimento técnico | Versão do código, ambiente, entrada, esperado, observado e limitações |
| Teste de tarefa | ID anônimo, tarefa, ferramenta, tempo, resultado e erro |
| Experimento comercial | Canal, oferta, contatos qualificados, reuniões, pilotos, pagamentos e esforço |
| Decisão | Alternativas, justificativa, estado e condição de revisão |

## Diário inicial

### 08/10/2026: diagnóstico e planejamento

- Pedido: analisar o produto, pensar em escala, propor melhorias e documentar o desenvolvimento para futuro TCC.
- Base de análise: checkout `8177239`; README, módulos Python, dashboard, workflow e CSVs versionados.
- Verificação: 12 snapshots com 132 registros e sem chaves duplicadas; 11 relatórios vazios; comparação local entre todos os pares consecutivos sem diferenças.
- Achados: consulta da base completa ausente no dashboard; formulário de e-mail sem rotina de envio; validação de coleta insuficiente para queda parcial; datas sem fuso explícito; dependências sem versões.
- Entregas: estratégia de produto, plano por etapas, prompt Stitch, propostas de decisões e método de avaliação.
- Limites: não executada coleta ao vivo, não verificados Actions remotos ou deploy; não entrevistados usuários; sem validação de preço e sem alteração funcional.
- Ferramentas de apoio: leitura das skills find-skills, shadcn e humanizer; inspeção por shell/Python; consulta às fontes públicas citadas.

### 08/10/2026: ampliação para ofertas e contatos

O autor relatou uso de Excel, pesquisa em portais e preparação de ofertas, propondo bases privadas fornecidas pelas corretoras. Foram pesquisadas referências oficiais para percentual de cessão, procedimentos e sanções, distinguindo textos antigos, alterações legais e proposta operacional para 2027. O escopo sugerido passou a incluir importação de contatos, rascunhos, versões e evidências. Registro em [Gestão de ofertas e contatos](ofertas-e-contatos.md) e DEC-008 a DEC-010. Nenhum contato corporativo foi importado e nenhum e-mail foi enviado. Ambiente de e-mail e restrição de exportação ainda pendentes.

### 08/10/2026: modelos e fluxo de rascunhos

O autor esclareceu que a macro prepara rascunhos no Outlook; ele revisa formatação e texto e envia manualmente. Usa texto padrão baseado em mensagens anteriores e sugeriu modelos próprios por corretora. Foram documentados editor, assinatura, versões, preparação de lote e opções Microsoft Graph/add-in, sem implementação ou acesso à caixa postal. Tipo de conta Outlook e restrição de exportação continuam pendentes. Evidências e fontes em [Modelos e Outlook](modelos-e-outlook.md), decisão DEC-011.

### 08/10/2026: comprovantes e restrição corporativa

O autor informou que respostas são baixadas manualmente e guardadas em pasta de rede por contrato. Sugeriu reunir os comprovantes no web app. Esclareceu que mudou de time, perdeu acesso à base e não pode extraí-la por restrição de compliance. A base corporativa foi excluída do projeto. Foram propostos upload manual, vínculos por oferta/versão e exportação de evidências, com desenvolvimento e avaliação usando arquivos fictícios. Nenhum documento corporativo foi acessado. Registro em DEC-009 e DEC-012 e [Contratos e comprovantes](contratos-e-comprovantes.md).

### 08/10/2026: acompanhamento de notícias sobre multas

O autor solicitou um campo para acompanhar notícias da legislação referente ao valor da multa. Foi especificada área de atualizações regulatórias com fontes oficiais, ficha de sanções, vigência, revisão e histórico. Primeira versão proposta com curadoria manual. Registro DEC-013 e [Atualizações regulatórias e multas](atualizacoes-regulatorias.md). Nenhuma rotina de notícias foi implementada nesta rodada.

### 08/10/2026: nome e direção visual

O autor escolheu Oferta Re, dispensou validação no Google Stitch e indicou Dietitian como referência com as mesmas cores. Foram inspecionados screenshot e HTML/CSS públicos; criada especificação de identidade e composição estática SVG/PNG da tela de ofertas. Os dados exibidos são fictícios e os recursos planejados estão identificados. Verificação visual da imagem exportada realizada; sem implementação de frontend ou integração Outlook. Registro DEC-014 e [Identidade do Oferta Re](identidade-oferta-re.md).

## Fontes iniciais

- [Repositório do projeto](https://github.com/vicTmm/pipeline-susep-resseguradoras).
- [Consulta de entidades licenciadas pela SUSEP](https://www.gov.br/pt-br/servicos/consultar-entidades-licenciadas-pela-susep).
- [Fonte usada pelo coletor](https://www2.susep.gov.br/menuatendimento/procura_2011.asp).
- [Informações oficiais sobre admitidos e eventuais](https://www.gov.br/susep/pt-br/assuntos/informacoes-ao-mercado/licenciamentos/resseguradores-admitidos-e-eventuais).
- [Instalação do shadcn/ui](https://ui.shadcn.com/docs/installation).
- [Skill shadcn](https://github.com/shadcn-ui/ui/blob/main/skills/shadcn/SKILL.md).
- [Skill humanizer](https://github.com/blader/humanizer/blob/main/SKILL.md).

Consulta em 08/10/2026. Estas são fontes de produto e implementação; a fundamentação acadêmica deve ser levantada após definir o recorte com o orientador.


### 08/10/2026 — Implementação da primeira entrega

Plano e tarefas consolidados em `plano-execucao.md` e `tarefas.md`. Implementados validação, publicação com restauração em falha de I/O, manifesto UTC e consulta Oferta Re com busca, filtro/exportação e avisos. Coletor passou de Playwright para formulário HTTP após erro de seleção no Actions e reprodução de bloqueio pelo Chromium.

Ambiente local: Python 3.14.8; versões diretas em requirements.txt. 11 testes passaram, incluindo interação Streamlit, coleta incompleta, duplicatas, comparação e restauração da base. `pip check` sem conflitos. CI Python 3.12/3.14 adicionada, sem resultado remoto nesta rodada.

Coleta real: `susep_resseguradoras_20261008_200044_207836.csv`; manifesto correspondente em outputs/runs. 135 registros: 15 locais, 25 admitidas e 95 eventuais. Comparação com 05/06/2026: 4 novos, 1 ausente, 131 alterados. O reconhecimento corrigido de Código FIP, Endereço e Data Autorização/Cadastramento gera diferenças de extração; não atribuir todas a alterações reais. HTML/CSV bruto preservados localmente em data/raw (ignorado no Git).

Workflow atualizado para Node 24 e Ubuntu 24.04. Nenhum push/deploy realizado nesta rodada; falta verificar a correção no runner. Tela inspecionada no Chrome local. Não foram usados contatos corporativos, nem enviados e-mails ou criados rascunhos Outlook. Limite: sem lock de processos/transação durável, lock de dependências transitivas ou acesso privado ainda.

### 08/10/2026 — Fundação Supabase e nova interface

Escolha do autor: Supabase/Vercel. Implementadas duas migrações, 15 tabelas com RLS, bucket privado, ingestão restrita e Next.js/shadcn. Importação pública validada: 135 registros. MCP autenticado aplicou a primeira migração; repetição de solicitações do Keychain motivou encerramento dos clientes e conclusão pela sessão existente do painel. Nenhuma nova leitura da credencial foi iniciada.

Verificações: 13 testes Python, 12 Node (SQL real em PGlite, catálogo e endpoint), TypeScript e build passaram. API anônima: catálogo 200, contatos privados 401. Endpoint sem credencial: 401; publicação autenticada idempotente passou. Busca CNPJ e estado vazio inspecionados no Chrome; [captura da interface](design/oferta-re-next.jpg). Segredos restritos configurados no GitHub; não houve push, deploy Vercel, uso de dados corporativos ou envio de ofertas. Autenticação real de usuários, arquivos hospedados e restauração ainda precisam de ensaio. [Registro completo](migracao-supabase-vercel.md).

### 08/10/2026 — Telas operacionais

Implementados contatos com edição/exportação, modelos com versões/assinatura, preparação e detalhe de oferta, confirmação manual de envio, documentos privados e classificação de respostas. Terceira migração aplicada: gravação transacional sob RLS. Demonstração separada com dados fictícios, sem escrita, para revisão visual.

14 testes Node passaram, incluindo snapshot de destinatários, rollback de preparação e histórico de modelo. Build/typecheck e auditoria de dependências de produção passaram. Prévia, seleção e quatro telas demonstrativas revisadas no Chrome; acesso privado sem sessão redirecionou ao login. Não houve criação de conta nem uso de dados corporativos. Upload/download e escrita hospedada precisam de ensaio com conta autorizada. Registro e capturas em [Telas e fluxos](telas-e-fluxos.md). Sem push ou deploy Vercel nesta rodada.

### 08/10/2026 — Mascote e revisão da identidade visual

O autor enviou uma imagem produzida no Google Stitch e pediu replicação e adaptação às suas cores. Mascote recriado como SVG; tokens migrados de roxo para azul/verde/ciano. Implementação aplicada na marca, favicon, catálogo, acesso, boas-vindas, estados vazios e confirmações; consulta legada também recebeu a paleta. Nenhuma alteração de banco ou fluxo operacional.

Build/typecheck e 14 testes Node passaram. Contraste calculado: 5,70:1 no botão primário, 5,81:1 no texto de apoio e 5,40:1 no estado verde. Revisão no Chrome desktop e larguras 390/320 px, sem corte observado na marca e introdução da consulta. [Captura desktop](design/oferta-re-mascote-desktop.jpg) e [mobile](design/oferta-re-mascote-mobile.jpg). Histórico da referência anterior preservado em [Identidade](identidade-oferta-re.md). Sem commit/push/deploy nesta etapa.

### 08/10/2026 — Ajuste após revisão do autor

Removida a ilustração do mascote do bloco introdutório da consulta pública, conforme indicação direta do autor no navegador. O bloco passa a apresentar título, descrição e exportação. Ajuste visual, sem alteração do comportamento da consulta.

### 08/10/2026 — SaaS por empresa e setores

Autor solicitou ambiente de cada empresa e vários setores, citando Latin Re/Treaty/Property/Financial Lines. Esclarecimento registrado: compartilhar dados na empresa e organizar por setor. Implementados entrada individual, setores/equipe, participação múltipla, convites e setor nos registros/filtros. Nenhum dado real da empresa citada foi criado.

Quarta migração aplicada; 16 testes Node passaram, incluindo email confirmado, expiração/revogação, replay, promoção indevida e vínculo entre tenants. TypeScript/build passaram. Demonstração de setores revisada no Chrome. [Evidência visual](design/oferta-re-setores.jpg) e [detalhamento](saas-empresas-e-setores.md). Teste com contas reais e gestão da assinatura ficam pendentes; nenhum convite ou oferta foi enviado, sem push/deploy Vercel.

### 08/10/2026 — Restrição do mascote à marca

Autor apontou ilustração indevida no banner da demonstração. Removidos todos os usos decorativos no conteúdo, incluindo demonstração, acesso, boas-vindas e estados vazios. Marca e favicon permanecem. Preferência registrada para evitar reintrodução em outras telas.

### 08/10/2026 — Proposta de formulário de ativação

Autor solicitou definição dos dados de entrada de uma empresa contratante, incluindo linhas de negócio. Documentada proposta com reaproveitamento do cadastro, distinção de área/setor/linha, mínimo para ativar e configuração posterior de equipe/modelos/contatos. Nenhum formulário, alteração de banco, cobrança ou coleta de dados foi executado nesta rodada. [Proposta](formulario-de-ativacao.md).


### 08/10/2026 — Ativação progressiva da empresa

Problema: empresas contratantes precisam informar sua estrutura sem preencher contatos, modelos e preferências de implantação antes de usar o produto. O autor aprovou a proposta de formulário. Alternativas: cadastro extenso único ou cadastro mínimo com configuração progressiva. Escolhida a segunda, com empresa/responsável, áreas/setores/linhas, rotina opcional e revisão.

Mudanças: wizard Next.js/shadcn com Server Action autenticada; perfil privado a administradores; catálogo interno de linhas com associação de vários para vários; salvamento com revisão e transação; setor Geral se a estrutura for adiada. Etapas salvas podem ser retomadas. Contatos/modelos/ofertas permanecem compartilhados na empresa. Uma demonstração usa exclusivamente exemplos e estado local da página. Preferências Outlook são coleta de requisitos, sem integração real. Cobrança permanece independente.

Verificação: 22 testes Node (incluindo PostgreSQL/RLS, rollback, conflitos e retomada), TypeScript e build; Supabase com cinco migrações e nenhuma fixture privada criada nesta etapa; API anônima 401, página privada 307 para login e demo 200. Navegador percorreu quatro etapas até os próximos passos; larguras 390/320 px revisadas e transbordamento dos botões corrigido. Evidência visual: `docs/design/ativacao-empresa-desktop.jpg`.

Limites: ensaio Auth hospedado com conta real pendente, nenhum deploy Vercel nem push/commit. Classificação por linha nos registros operacionais, logo, importação, Outlook e faturamento são próximos trabalhos. A medição do piloto poderá comparar tempo até primeira oferta e abandono por etapa; resultados ainda não foram coletados. Respostas privadas de empresas não foram anexadas ao diário.

### 08/10/2026 — Tooltips e identificação da navegação

Pedido do autor: identificar os ícones da lateral ao passar o mouse e incluir ajuda contextual onde necessário. Substituído o `title` nativo por tooltip visual consistente, com abertura por hover/foco, fechamento por Escape e descrição associada via `aria-describedby`. Os links continuam sendo links e preservam os nomes acessíveis e a página ativa; foco recebe destaque visível. Componente reutilizável baseado no Base UI já instalado, sem nova dependência.

Ajuda adicionada a áreas e linhas de negócio, conta de envio, setor responsável/filtro, permissões de convite, geração do link, exportação CSV e salvamento de progresso. As instruções essenciais permanecem visíveis. Sem alterações no banco ou nas regras de acesso.

Verificação: tooltip lateral exibido por mouse e foco de teclado; Escape fecha; botão de ajuda contextual tem descrição ligada ao popup. TypeScript/build verificados. Evidência: `docs/design/tooltips-barra-lateral.jpg`.


### 08/10/2026 — Rastreio de respostas do mercado

Autor confirmou oferta enviada pelo corretor, retorno do mercado por Outlook (negativa/dúvida/aceite) e arquivamento para auditoria; caixa Microsoft 365 individual. Pesquisa em fontes oficiais Microsoft verificou Graph para metadados/MIME/sincronização e conector Power Automate para EML. Alternativas: Graph nativo ao SaaS ou fluxo Power Automate por cliente. Recomendação proposta: Graph delegado, sujeito à conexão autorizada, sem obrigatoriedade de outro backend Python.

Implementado núcleo independente de provedor para correlacionar metadados sintéticos por pai da resposta, código registrado, conversa e assunto/remetente. Ambiguidades, contatos desconhecidos, respostas automáticas e referências indiretas exigem revisão. Seis testes novos; 28 Node no total passaram. Documentado que o fluxo manual ainda permite resposta sem arquivo e que “arquivada” deverá exigir persistência confirmada da evidência, sem substituir original por classificação.

Limites: nenhum OAuth Microsoft, caixa real, importação/transferência, fluxo Power Automate, job de sincronização ou migração de e-mail nesta rodada. Sem commit/push. Comparar no piloto tempo para guardar/recuperar respostas, taxa de associação correta e revisão, duplicatas e falhas de captura. Hipóteses não são resultados medidos. [Especificação](rastreio-outlook-e-respostas.md).


### 08/10/2026 — Portal de propostas e renovações

Decisão do autor: ampliar Oferta Re para envio e controle de propostas/renovações. A proposta passa a reunir o processo comercial; ofertas ao mercado são comunicações versionadas desse processo. Renovação cria um registro vinculado ao anterior, preservando histórico e comprovantes. A consulta SUSEP permanece como apoio público.

Implementados cadastro sem depender de contatos, carteira com filtros e pipeline, setor e linha de negócio, vigências, prazos, pendências, encerramento justificado, versões de oferta e histórico de eventos. Respostas novas exigem comprovante cujo upload exista no armazenamento; classificar aceite não encerra automaticamente a proposta. Registros antigos encerrados continuam com classificação neutra, sem presumir colocação. Isolamento por empresa e compartilhamento interno foram mantidos.

Verificação: 37 testes Node passaram, incluindo PostgreSQL/RLS, revisões concorrentes, renovação, evidências e calendário brasileiro. TypeScript e build passaram. Sexta migração aplicada e conferida no Supabase. Navegador verificou filtros, pipeline, detalhe de renovação e leitura privada com sessão existente; ambiente privado conferido a 390 px sem transbordamento horizontal. Nenhuma fixture privada foi criada no serviço hospedado. Evidência: [carteira de propostas](design/portal-propostas-desktop.jpg).

Limites: gravação/upload com dados reais no serviço hospedado ainda requer homologação. Envio e captura automática Microsoft 365, condições comerciais estruturadas, alertas, faturamento e publicação Vercel permanecem pendentes. Nenhum commit/push realizado nesta etapa. A documentação distingue capacidade implementada de integração planejada; nenhuma redução de tempo ou conformidade foi medida. [Escopo e decisões](portal-propostas-e-renovacoes.md).


## 10/10/2026 — Separação do produto e coletor

Problema: produto Oferta Re e coletor SUSEP compartilhavam o repositório. A mudança autorizada importa o histórico para `vicTmm/oferta-re` e separa a árvore atual, preservando a integração pública Supabase. Alternativa: duplicar todo o pipeline; descartada para evitar duplicar coleta agendada. Registro e verificações em [migração do repositório](migracao-repositorio.md). Commit identificável no histórico pela mensagem `chore: separar Oferta Re em repositorio proprio`. Limites: sem deploy ou alteração do backend; validação Auth/Storage de produção permanece pendente.

### 11/10/2026 — Conexão real e recuperação de acesso

Problema: o checkout estava sem configuração Supabase e o autor não lembrava a senha da conta existente. Alternativas: criar outro usuário ou preservar a conta com recuperação oficial; escolhida a segunda pelo autor. Mudanças: `.env.local` ignorado com chave publicável, telas de recuperação/redefinição e callback com destinos fixos; migração para restringir helper interno de event trigger. Verificação: APIs públicas/privadas hospedadas, permissões, bucket e ensaio SQL com rollback para propostas/ofertas/renovações e isolamento. Limites: entrega do e-mail e ciclo Auth/Storage pelo navegador dependem da recuperação pelo usuário. Commit: alterações ainda locais, sem publicação.
