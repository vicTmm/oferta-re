# Formulário de ativação de uma empresa

Data: 08/10/2026. Estado: aprovado pelo autor (“gostei, pode implementar”) e implementado. Escopo: configurar o ambiente da empresa. Nome e e-mail existentes são reaproveitados; checkout e cobrança ainda não foram implementados. Preços, provedor de cobrança e contrato não são definidos por esta proposta.

## Separar contratação e configuração

Dados comerciais/faturamento pertencem à contratação. O formulário de ativação usa esses dados, sem pedir novamente o que já foi preenchido. Cada pessoa usa conta individual; a empresa não recebe senha compartilhada. Não associar pessoas automaticamente pelo domínio de e-mail.

Primeiro acesso em duas etapas curtas: empresa/responsável e estrutura operacional. Convites, contatos e modelos podem ser configurados depois. Salvar progresso e permitir edição pelo responsável/admin.

## Dados para iniciar

| Campo | Tratamento proposto | Finalidade |
| --- | --- | --- |
| Nome da empresa exibido no ambiente | Obrigatório, reaproveitar cadastro | Identificar o tenant na interface |
| Nome e e-mail do responsável pela conta | Obrigatório, reaproveitar usuário autenticado | Administração da licença e equipe |
| Áreas de atuação | Seleção múltipla, Treaty/Facultativo/Outra | Agrupar setores |
| Setores | Pelo menos um, nomes editáveis; permitir configurar depois usando um setor geral | Organizar registros e pessoas |
| Linhas de negócio | Lista editável com múltipla seleção, opção de adicionar e de configurar depois | Classificar operação e especialidades |
| Relação setor/linhas | Uma ou várias linhas por setor; a mesma linha pode atender vários setores | Filtros e modelos úteis para cada time |

Tratamento proposto para faturamento: razão social, CNPJ e e-mail financeiro na contratação, conforme necessidade do fluxo que será escolhido. Nome do administrador e contato financeiro são campos distintos, mesmo quando representam a mesma pessoa. Logo, site e telefone são opcionais e não bloqueiam ativação.

Áreas, setores e linhas são conceitos diferentes. O exemplo do autor tem Treaty/Soluções Estruturadas e times facultativos como Property e Financial Lines. A nomenclatura interna da empresa deve ser preservada. Esta lista não pretende substituir classificações oficiais de ramos; códigos regulatórios só serão incorporados após definir a necessidade e a fonte.

## Configurações posteriores

- Pessoas: e-mails, papel (admin/colaborador/consulta) e um ou vários setores. Usar convites existentes; geração de link não significa envio automático.
- Operação de e-mail: Outlook clássico/novo/web, conta individual ou caixa compartilhada, e qual endereço deverá assinar/preparar ofertas. Só coletar essa informação enquanto a integração estiver sendo validada; não solicitar credenciais de caixa postal no formulário.
- Base de contatos: indicar se já existe uma base própria e oferecer importação com prévia quando disponível. Especialidades dos contatos devem reutilizar a nomenclatura das linhas.
- Modelos: assunto, corpo e assinatura, gerais ou por setor/linha. Reutilizar editor/versionamento já existente. Não prometer substituição automática de variáveis antes da implementação.
- Comprovantes: informar formatos mais usados e referência interna de operação/contrato. Exibir limites reais de arquivo do produto; upload de exemplo opcional, não requisito de contratação.
- Preferências: comunicações do serviço, avisos e frequência apenas para canais implementados. Não anunciar alertas automáticos ainda inexistentes.

## Dados para aprender com o piloto

Perguntas opcionais: quantidade de usuários, setores e ofertas por mês (faixas); ferramentas atuais; principal dificuldade; resultado esperado. Servem à capacidade, suporte e pesquisa do TCC, sem determinar preço automaticamente ou bloquear o acesso. Explicar o propósito quando coletadas.

## Comportamento esperado

- Mostrar resumo final da empresa, áreas, setores e linhas antes de gravar a configuração.
- Usar valores existentes como padrão e permitir corrigir sem perder o restante.
- Não criar setores pré-definidos como se fossem obrigatórios para todas as empresas.
- Permitir entrar no produto com cadastro mínimo e checklist de tarefas restantes.
- Preservar compartilhamento de contatos/modelos/ofertas dentro da empresa, conforme decisão do autor. Setor/linha são organização e classificação; não autorizam acesso a outro tenant.
- Evitar pedir no cadastro inicial todos os contatos, modelos, anexos e preferências. O objetivo é alcançar a primeira operação útil com pouco preenchimento.

## Escopo aprovado e implementação

Implementados perfil da empresa e contato financeiro opcional, catálogo interno de linhas por organização, relação setor/linha de vários para vários e progresso de ativação. A classificação por linha em contatos, modelos e operações permanece uma próxima entrega; a classificação por setor já existe. Logo/upload de identidade, importação de contatos, cobrança e integração Outlook também permanecem entregas próprias.

### Fluxo disponível

- `/workspace/ativacao?org=UUID`: responsável/admin autenticado. Criar uma empresa direciona para o formulário. A visão geral oferece configuração inicial, retomada com etapa salva e edição após conclusão.
- Quatro etapas: **Empresa**, **Estrutura**, **Rotina opcional**, **Revisão**. Só empresa, nome e e-mail do responsável são necessários para concluir. “Salvar e continuar” grava antes de avançar; “Salvar progresso” permite retomar. Campos ainda não salvos podem ser perdidos ao sair da página.
- Áreas múltiplas: Treaty/Facultativo/Outra. Até 30 setores, com até 30 linhas por setor. Nomes de linhas são livres (2–80 caracteres), separados por vírgulas. Não existe catálogo regulatório automático.
- Concluir sem setores cria Geral uma vez. Setores existentes não são excluídos; nomes/áreas/associações podem ser atualizados. Retomada lê os setores atuais, incluindo os criados na tela de equipe. Linhas ficam visíveis na lista de setores para os membros da empresa.
- Preferências Outlook/caixa postal, base própria, formatos e referência interna são apenas informações de implantação. Diagnóstico e faixas de volume são opcionais. O formulário não conecta caixas postais, não envia mensagens e não gera cobranças.
- Após concluir, links para equipe, contatos, modelos e primeira oferta. Cada membro continua com login individual; não há inclusão automática por domínio.
- `/demonstracao/ativacao`: formulário interativo com dados fictícios. Salvamento em memória da página; não grava no banco e não sobrevive à recarga.

### Persistência, autorização e concorrência

Migração `20261009020000_company_onboarding.sql`, aplicada ao projeto Supabase `vssghglrtxqkfpsdfeik`; histórico remoto passou de quatro para cinco migrações. Sem criar perfis ou linhas privados fictícios no projeto hospedado. Aplicação pelo SQL Editor da sessão autenticada existente, sem reabrir a credencial macOS/MCP que apresentou repetição de prompts.

`company_profiles` guarda o payload validado, etapa, revisão e estado draft/complete. Campos comerciais, responsável e diagnóstico são lidos apenas por owner/admin. `business_lines` e `department_business_lines` permitem leitura aos membros da própria empresa; chaves compostas impedem relações entre tenants. Todas têm RLS; gravações novas passam pela RPC `save_company_onboarding`, com autenticação/papel, validação no banco e transação integral. Campos imprevistos são rejeitados, sem espaço para credenciais arbitrárias. Perfil e linhas usam proteção de identidade/autoria e auditoria de inserção/atualização.

A revisão esperada é comparada sob lock transacional: edição concorrente devolve conflito, sem sobrescrever silenciosamente. A aplicação valida campos também na Server Action. Remover uma linha de um setor altera sua associação; não apaga o catálogo nem registros operacionais. CNPJ é texto opcional, inclusive alfanumérico, com verificação de formato básico; não há consulta cadastral ou validação de dígitos verificadores.

### Verificação e limites

22 testes Node passaram: os 16 anteriores mais quatro cenários PostgreSQL de ativação e dois de validação de formulário. Foram verificados rascunho/retomada, relação muitos-para-muitos, idempotência, rollback, preservação de setores/contatos/operações, isolamento por empresa, leitura comercial restrita, owner/admin, bloqueio de viewer/anon e conflito de revisão. TypeScript e build de produção passaram. Demonstração percorrida até conclusão no navegador; revisão de largura 390/320 px sem rolagem horizontal após ajuste dos botões.

API hospedada recusou leitura anônima das três tabelas (401). Rota privada redireciona visitante a `/entrar` (307); demo retorna 200. O ensaio com conta real e gravação pelo navegador autenticado continua pendente junto à homologação geral de Auth; testes SQL executam as regras reais em PostgreSQL local. Não foi criado usuário de produção para este teste, não houve deploy Vercel nem commit/push.

