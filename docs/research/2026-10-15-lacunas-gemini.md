# Relatório de Pesquisa: Lacunas Funcionais para Portal de Corretoras de Resseguro

**Data do relatório:** 15 de outubro de 2026  
**Alvo:** Projeto Oferta Re  
**Modelo:** Gemini 3.8 Flash (High)  
**Artefatos gerados:** [2026-10-15-lacunas-gemini.md](2026-10-15-lacunas-gemini.md) e [2026-10-15-lacunas-gemini.json](2026-10-15-lacunas-gemini.json)  

---

## 1. Declaração de Modo de Pesquisa e Limitações

> [!IMPORTANT]
> **Verificação Prévia de Ferramentas e Recursos:**  
> Foi realizada uma verificação exaustiva no ambiente de execução do Antigravity CLI para identificar a disponibilidade da ferramenta oficial de **Deep Research**. Constatou-se que **não existe ferramenta ou subagente oficial de Deep Research** registrado entre os recursos do runtime.  
> 
> Em estrita conformidade com as diretrizes do usuário e do coordenador:
> 1. Declara-se explicitamente a ausência do modo oficial Deep Research;
> 2. O presente relatório fundamenta-se em **pesquisa web direta e verificação de fontes primárias oficiais** (Microsoft Graph API, Lloyd's Core Data Record, PPL London, SUSEP, e Supabase);
> 3. Em nenhuma hipótese afirma-se ter utilizado o modo oficial Deep Research;
> 4. As recomendações regulatórias têm finalidade estritamente técnica de processos e engenharia de software, **não constituindo parecer jurídico**. Exigências legais e enquadramentos perante a SUSEP demandam validação profissional por advogados especializados.

---

## 2. Resumo Executivo

O **Oferta Re** é uma plataforma concebida para atender corretoras de resseguro no Brasil, organizando o ciclo de vida de propostas, renovações vinculadas, ofertas de colocação e custódia de comprovantes em um ambiente multitenant compartilhado por empresa.

A inspeção detalhada do código-fonte e das migrações PostgreSQL revela que a **aplicação possui controles relacionais estruturados e testes locais automatizados**:
- Isolamento entre empresas via Row Level Security (RLS) e chaves compostas ([supabase/migrations/20261008225654_oferta_re_foundation.sql](../../supabase/migrations/20261008225654_oferta_re_foundation.sql#L129-L137));
- Ciclo de estados de propostas e renovações com histórico em triggers ([supabase/migrations/20261009030000_proposal_portal.sql](../../supabase/migrations/20261009030000_proposal_portal.sql#L22-L66));
- Gravação atômica de ofertas e versões via RPCs ([supabase/migrations/20261009030000_proposal_portal.sql](../../supabase/migrations/20261009030000_proposal_portal.sql#L87-L110));
- Exigência de comprovante em Storage privado para gravação de respostas ([supabase/migrations/20261009030000_proposal_portal.sql](../../supabase/migrations/20261009030000_proposal_portal.sql#L115-L124));
- 38 testes locais automatizados executando com sucesso em Node.js com banco em memória PGlite (`scripts/*.test.mjs`).

Contudo, ao confrontar a implementação com as necessidades operacionais de um **piloto real de corretora de resseguro**, com **benchmarks internacionais de colocação eletrônica** (como Lloyd's Core Data Record e PPL London) e com as **normas da SUSEP** (Resolução CNSP nº 451/2022 e Circular SUSEP nº 605/2020), identificam-se lacunas funcionais e de homologação críticas:
1. **Confiabilidade e resiliência de dados antes do piloto (GAP-12 - P0):** Conforme a documentação oficial do Supabase, os backups do banco de dados NÃO incluem os arquivos do Storage (buckets S3); além disso, Point-in-Time Recovery (PITR) é um add-on pago e o plano Free exige rotinas manuais/externas para cópias off-site. O projeto ainda não possui ensaio operacional de restauração separada de banco e arquivos com RPO/RTO pactuados.
2. **Revogação de membros e governança de acessos (GAP-13 - P0):** O sistema permite apenas convidar e revogar convites pendentes. Não há função para revogar o acesso de membros que já aceitaram o convite (`organization_members`), nem para alterar papéis com auditoria, gerando risco caso um corretor se desvincule da empresa. O compartilhamento interno de registros entre setores da mesma corretora deve ser preservado conforme a decisão aceita (`DEC-020`).
3. **Homologação ponta a ponta em produção (GAP-14 - P0):** Embora a autenticação e recuperação de senha estejam ativas e confirmadas pelo usuário, os testes locais em PGlite não substituem a homologação de sessões HTTP em navegadores reais, isolamento entre duas organizações distintas e ciclos reais de upload/download de arquivos no Storage hospedado.
4. **Ausência de quadro de colocação multimercado (GAP-01 - P1):** O sistema não consolida a colocação sindicada até 100% da capacidade, tratando destinatários como meros contatos de e-mail, sem controle de linhas escritas (*written lines*), sobrecolocação (*oversubscription*) e rateio para linhas assinadas (*signed lines* / *sign-down*).
5. **Condições da oferta não estruturadas (GAP-02 - P1):** As condições de subscrição (LMG, retenção da cedente, comissão de corretagem, prêmio/MDP, moeda e franquias) existem apenas como texto livre no corpo da mensagem, sem atributos tipados para comparação entre versões V1 e V2.
6. **Integração Microsoft 365 e evidências MIME (GAP-04 e GAP-05 - P1):** A correlação de e-mails resume-se a uma função TypeScript pura em memória. Não há conexão OAuth 2.0 delegada, sincronização delta no servidor, armazenamento de deltalinks, captura automática de mensagens brutas `.eml` via `$value`, nem validação de checksum criptográfico no backend.
7. **Gestão de consultas preferenciais locais (GAP-03 - P2):** A formalização de consultas e recusas de resseguradores locais (art. 5º da Resolução CNSP nº 451/2022) deve ser um módulo informativo e documental parametrizável, sem transformar a cota em uma calculadora matemática cega de 40% de destinatários e sem bloqueio impeditivo do envio de ofertas no MVP.

---

## 3. Critérios de Priorização e Inventário do Código

### 3.1. Definição dos Níveis de Prioridade

- **P0 (Crítico para Piloto Real / Confiabilidade):** Requisitos indispensáveis de segurança, governança de acesso, resiliência de dados e homologação técnica de infraestrutura antes de receber dados reais de clientes em produção.
- **P1 (Núcleo Operacional do Corretor):** Funcionalidades nucleares de subscrição, sindicação multimercado, mensageria integrada e rastreamento de evidências exigidas pela rotina diária da corretora.
- **P2 (Especialização Contratual e Governança Avançada):** Recursos complementares, suporte a contratos de tratados em camadas, emissão de minutas em PDF, gestão de condicionantes e acompanhamento regulatório parametrizável.

### 3.2. Classificação dos Estados

- **Implementado e Verificado Localmente:** Código existente, integrado ao banco relacional ou fluxos da aplicação, validado por suíte de testes automatizados (`scripts/*.test.mjs`) em ambiente PGlite.
- **Implementado, mas NÃO HOMOLOGADO:** Estrutura codificada e com testes unitários locais, porém pendente de homologação em ambiente de produção hospedado (ex.: upload/download reais de arquivos em nuvem, sessão com duas contas reais em domínios distintos).
- **Incompleto:** Estruturas parciais criadas no banco ou em utilitários, porém desconectadas da interface, das Server Actions ou de serviços em segundo plano.
- **Apenas Mockado:** Funcionalidades presentes exclusivamente na rota `/demonstracao` (`mock-workspace.tsx`), utilizando dados fictícios em memória ou `localStorage`, sem persistência real.
- **Ausente:** Funcionalidade inexistente tanto no código-fonte quanto no esquema do banco de dados.

### 3.3. Matriz de Inventário por Módulo

| Módulo / Funcionalidade | Estado Real | Evidência no Código-Fonte | Observações Técnicas |
| :--- | :--- | :--- | :--- |
| **Multitenancy e Isolamento de Empresas** | Implementado e Verificado | [supabase/migrations/20261008225654_oferta_re_foundation.sql](../../supabase/migrations/20261008225654_oferta_re_foundation.sql#L108-L157) | Tabelas `organizations`, `organization_members` (roles: owner, admin, member, viewer). RLS e `has_org_role` ativos e testados localmente. |
| **Setores Internos e Compartilhamento** | Implementado e Verificado | [supabase/migrations/20261009010000_company_teams.sql](../../supabase/migrations/20261009010000_company_teams.sql#L3-L20) | Tabela `departments`. Compartilhamento interno mantido sem barreiras de RLS entre setores da mesma corretora (`DEC-020`). |
| **Revogação de Membros Aceitos** | Ausente | [web/src/app/workspace/equipe/actions.ts](../../web/src/app/workspace/equipe/actions.ts#L77-L86) | Só existe `revokeInvitation` para convites pendentes. Inexiste função para revogar acesso de membros aceitos ou alterar papéis com auditoria. |
| **Cadastro e Carteira de Propostas** | Implementado e Verificado | [supabase/migrations/20261009030000_proposal_portal.sql](../../supabase/migrations/20261009030000_proposal_portal.sql#L1-L18), [web/src/components/proposal-board.tsx](../../web/src/components/proposal-board.tsx) | Tabela `operations` com `business_kind` (novo negócio / renovação), 8 etapas operacionais, vigências e prazos em horário de Brasília. |
| **Renovações Vinculadas Aclíclicas** | Implementado e Verificado | [supabase/migrations/20261009030000_proposal_portal.sql](../../supabase/migrations/20261009030000_proposal_portal.sql#L48-L55) | CTE recursiva no trigger `validate_proposal` impede ciclos e autorreferência; não herda ou copia respostas anteriores. |
| **Trilha de Eventos da Proposta** | Implementado e Verificado | [supabase/migrations/20261009030000_proposal_portal.sql](../../supabase/migrations/20261009030000_proposal_portal.sql#L22-L36) | Tabela `proposal_events` privada com RLS somente leitura; triggers gravam snapshots de alterações de etapa, ofertas e respostas. |
| **Preparo e Versionamento de Ofertas** | Implementado e Verificado | [supabase/migrations/20261009030000_proposal_portal.sql](../../supabase/migrations/20261009030000_proposal_portal.sql#L87-L110) | RPC `prepare_proposal_offer` gera versões (V1, V2) e salva snapshots imutáveis de nome e e-mail dos contatos selecionados. |
| **Exigência de Arquivo para Respostas** | Implementado e Verificado | [supabase/migrations/20261009030000_proposal_portal.sql](../../supabase/migrations/20261009030000_proposal_portal.sql#L115-L124) | Trigger `require_response_evidence` impede inserção em `responses` sem objeto correspondente no bucket privado `operation-documents`. |
| **Catálogo Público de Resseguradoras SUSEP** | Implementado e Verificado | [supabase/migrations/20261008225654_oferta_re_foundation.sql](../../supabase/migrations/20261008225654_oferta_re_foundation.sql#L22-L30) | Coleta de 135 entidades (locais, admitidas, eventuais), validação anti-queda > 10% e ingestão via Edge Function protegida por token. |
| **Algoritmo de Correlação de E-mails** | Implementado Localmente, Não Integrado | [web/src/lib/email-tracking.ts](../../web/src/lib/email-tracking.ts#L1-L74) | Função pura testada com 6 casos em `web/scripts/email-tracking.test.mjs` (Message-ID, In-Reply-To, References, Tokens). Sem chamadas de rede ou banco. |
| **Termos Financeiros da Oferta (Slip)** | Incompleto | [supabase/migrations/20261008225654_oferta_re_foundation.sql](../../supabase/migrations/20261008225654_oferta_re_foundation.sql#L231) | Existe a coluna `terms jsonb default '{}'` em `offer_versions`, mas nenhum formulário da aplicação (`offer-composer.tsx`, `flows.ts`) utiliza o campo. |
| **Upload e Download Hospedado** | Não Homologado | [docs/tarefas.md](../tarefas.md#L144) | Políticas RLS de storage e URLs assinadas existem ([web/src/app/workspace/flows.ts](../../web/src/app/workspace/flows.ts#L203)), mas o ensaio em produção com arquivos reais permanece pendente. |
| **Conexão Microsoft Graph / OAuth** | Ausente | [docs/rastreio-outlook-e-respostas.md](../rastreio-outlook-e-respostas.md#L5) | Não há app registrado no Microsoft Entra, tabelas de tokens, sincronização delta por cursores ou webhooks de notificação. |
| **Quadro de Colocação / Rateio Sindicado** | Ausente | [web/src/components/proposal-detail.tsx](../../web/src/components/proposal-detail.tsx#L282-L377) | Inexiste conceito de cota ofertada, linha escrita, linha assinada, rateio proporcional (*sign-down*) ou consolidação de 100% de capacidade. |
| **Verificação de Preferência Local** | Ausente | [supabase/migrations/20261009030000_proposal_portal.sql](../../supabase/migrations/20261009030000_proposal_portal.sql#L87) | Nenhuma verificação de proporção de resseguradores locais participantes ou emissão de relatório comprobatório de recusas locais. |
| **Importação de Contatos em Lote (CSV)** | Ausente | [docs/tarefas.md](../tarefas.md#L32) | Inserção de contatos é exclusivamente unitária e manual em [web/src/app/workspace/flows.ts](../../web/src/app/workspace/flows.ts#L29). Tarefa E3-02 segue pendente. |
| **Exportação de Dossiê de Auditoria (ZIP)** | Ausente | [web/src/app/workspace/comprovantes/page.tsx](../../web/src/app/workspace/comprovantes/page.tsx) | Não existe consolidação da operação em pacote único de conformidade com manifesto SHA-256 e arquivos MIME originais. |
| **Atribuição Individual e SLAs de Prazos** | Incompleto | [supabase/migrations/20261009030000_proposal_portal.sql](../../supabase/migrations/20261009030000_proposal_portal.sql#L10) | Existe data `due_date` e texto `next_action`, mas não há campo para corretor responsável individual nem motor de lembretes automáticos. |
| **Ambiente de Demonstração Interativa** | Apenas Mockado | [web/src/components/mock-workspace.tsx](../../web/src/components/mock-workspace.tsx) | Simulação completa operando em `localStorage` do navegador com dados fictícios de propostas e resseguradoras, sem persistência. |

---

## 4. Análise Detalhada das 14 Lacunas Funcionais

A seguir detalham-se as 14 lacunas concretas identificadas, combinando os problemas operacionais vivenciados pelos corretores, evidências no código-fonte local, justificativa técnica separando observação de inferência, riscos e critérios de aceite.

```mermaid
flowchart TD
  subgraph Prioridade P0: Confiabilidade e Piloto Real
    GAP12["GAP-12: Backup e Restauração<br/>(Cópias Separadas Banco/Storage - Free)"]
    GAP13["GAP-13: Revogação de Membros<br/>(Governança e Alteração de Papéis)"]
    GAP14["GAP-14: Homologação em Produção<br/>(Auth, Storage e Duas Contas)"]
  end

  subgraph Prioridade P1: Núcleo Operacional do Corretor
    GAP02["GAP-02: Slip Estruturado<br/>(LMG, Retenção, Prêmio, Moeda)"] --> GAP01["GAP-01: Quadro de Colocação<br/>(Written vs Signed Lines 100%)"]
    GAP04["GAP-04: Sincronização Graph<br/>(Delta Query e Immutable IDs)"] --> GAP05["GAP-05: Captura MIME .eml<br/>(Checksum SHA-256 no Servidor)"]
    GAP05 --> GAP06["GAP-06: Dossiê de Auditoria ZIP<br/>(Disponibilidade Documental)"]
    GAP07["GAP-07: Tarefas Individuais e SLA<br/>(Cronograma de Renovação)"]
    GAP08["GAP-08: Importação em Lote CSV<br/>(Contatos e Especialidades)"]
  end

  subgraph Prioridade P2: Especialização e Governança
    GAP03["GAP-03: Evidências Preferência Local<br/>(Registro de Recusas Parametrizável)"]
    GAP09["GAP-09: Gestão de Subjectivities<br/>(Condições Suspensivas de Aceite)"]
    GAP10["GAP-10: Cover Note e Closing Slip<br/>(Minutas Formais em PDF)"]
    GAP11["GAP-11: Tratados de Resseguro<br/>(Treaty Proporcional e XL em Camadas)"]
  end

  Prioridade P0: Confiabilidade e Piloto Real --> Prioridade P1: Núcleo Operacional do Corretor
  Prioridade P1: Núcleo Operacional do Corretor --> Prioridade P2: Especialização e Governança
```

---

### GAP-12: Procedimento Operacional de Backup, Restauração e Resiliência de Dados

- **Categoria:** `saas_reliability`
- **Status:** `incompleto`
- **Prioridade:** `P0` | **Esforço:** `M`
- **Problema do Corretor:** Em caso de corrupção acidental ou exclusão indevida, a perda de histórico de propostas e arquivos comprobatórios representa risco existencial para a corretora. Conforme a documentação oficial da plataforma Supabase ([supabase.com/docs/guides/platform/backups](https://supabase.com/docs/guides/platform/backups)), os backups de banco de dados **NÃO abrangem os arquivos do Storage** (buckets S3 compatíveis); além disso, o recurso Point-in-Time Recovery (PITR) é um add-on pago disponível para planos Pro, Team ou Enterprise, enquanto projetos Free precisam manter suas próprias exportações e cópias off-site. O Oferta Re carece de um Procedimento Operacional Padrão (POP) ensaiado de cópia e restauração separada (banco lógico e arquivos), viável no orçamento do plano gratuito e com metas de RPO e RTO formalizadas. Não se deve estabelecer regra fixa universal de expurgo aos 5 anos: prazos mínimos e hipóteses legais de suspensão prescricional dependem de análise jurídica específica.
- **Evidência no Código Local:**
  - O arquivo [docs/tarefas.md](../tarefas.md#L26) documenta como pendente: `- [ ] E2-04b: upload/download hospedado e ensaio de backup/restauração`. Inexistem scripts de backup off-site ou rotinas documentadas de simulação de restore no repositório.
- **Base Técnica e Justificativa:** Constatação direta da pendência no diário técnico e consulta à documentação oficial do Supabase sobre as limitações do plano Free e a separação física entre dados relacionais e Storage.
- **Riscos:** Indisponibilidade prolongada do serviço em incidentes de infraestrutura; perda irreversível de anexos caso se confie apenas nos backups automatizados do PostgreSQL.
- **Fontes Primárias:** [Supabase Platform Backups Documentation](https://supabase.com/docs/guides/platform/backups) e [Circular SUSEP nº 605/2020](https://www2.susep.gov.br/safe/scripts/bnweb/bnmapi.exe?router=upload%2F22297).
- **Critérios de Aceite:**
  1. Procedimento Operacional Padrão (POP) documentado e testado com simulação de restauração lógica do banco (`pg_dump`) e dos arquivos de Storage em ambiente de staging isolado.
  2. Definição de metas formalizadas de RPO (ex: 24 horas via rotina diária de exportação) e RTO (ex: 4 horas para restabelecimento do serviço) executáveis no plano Free.
  3. Script de verificação de integridade comparando hashes SHA-256 da tabela `documents` com os arquivos físicos no bucket `operation-documents`.
  4. Ressalva expressa de que políticas de expurgo de dados exigem parecer jurídico sobre marcos temporais e interrupções prescricionais.
- **Dependências:** Nenhuma.

---

### GAP-13: Revogação de Acesso de Membros Aceitos e Alteração Auditada de Papéis

- **Categoria:** `user_management_and_governance`
- **Status:** `ausente`
- **Prioridade:** `P0` | **Esforço:** `S`
- **Problema do Corretor:** Quando um colaborador se desliga da corretora ou muda de função, a administração precisa revogar imediatamente seu acesso ao sistema para resguardar a confidencialidade de cotações e contratos. Atualmente, o sistema só permite cancelar convites pendentes. Não há interface nem Server Action para remover membros já aceitos de `organization_members` ou alterar seus papéis (owner, admin, member, viewer). Importante: a arquitetura do Oferta Re adota compartilhamento interno irrestrito entre setores da mesma empresa (`DEC-020`); a funcionalidade deve focar na governança de membros corporativos sem propor segregação interna de setores.
- **Evidência no Código Local:**
  - O arquivo [web/src/app/workspace/equipe/actions.ts](../../web/src/app/workspace/equipe/actions.ts#L77-L86) contém unicamente a Server Action `revokeInvitation` para convites pendentes.
  - A pendência está expressamente registrada em [docs/tarefas.md](../tarefas.md#L87): `- [ ] Implementar revogação de acesso de membros aceitos e alteração auditada de papéis`.
- **Base Técnica e Justificativa:** Constatação direta no código TypeScript de Server Actions e no esquema relacional da tabela `organization_members`.
- **Riscos:** Vazamento de propostas e termos de negociação caso um ex-colaborador mantenha credenciais ativas após a rescisão contratual.
- **Fontes Primárias:** Nenhuma externa necessária (necessidade de segurança interna baseada em código local; `sourceIds: []`).
- **Critérios de Aceite:**
  1. Server Action e botão na interface para revogar acesso de membro aceito em `organization_members`, acessível por administradores ou pelo proprietário.
  2. Server Action para alteração auditada de papel (role) do membro com proteção hierárquica (somente owner pode promover ou rebaixar admins).
  3. Bloqueio que impeça o proprietário da organização de revogar o próprio acesso sem antes transferir a titularidade da empresa.
  4. Registro obrigatório de evento em `audit_events` a cada revogação ou alteração de privilégio.
  5. Manutenção estrita do compartilhamento interno de registros e propostas entre os setores da mesma empresa, sem criação de isolamentos setoriais.
- **Dependências:** Nenhuma.

---

### GAP-14: Homologação Ponta a Ponta de Auth e Storage em Ambiente Hospedado

- **Categoria:** `production_readiness`
- **Status:** `nao_homologado`
- **Prioridade:** `P0` | **Esforço:** `M`
- **Problema do Corretor:** O usuário confirmou a recuperação de senha e o login na conversa com a coordenação, comprovando que o Supabase Auth está ativo e funcional. No entanto, os testes locais da aplicação (`database.test.mjs`) executam em PostgreSQL em memória (PGlite) e não testam tráfego HTTP real de navegadores, cookies de sessão com atributos de segurança (`SameSite`, `Secure`) em domínios de produção, latência de rede na Vercel ou transferências multipart no Supabase Storage. É imprescindível realizar a homologação ponta a ponta com duas contas reais pertencentes a organizações distintas, simulando upload, download, reenvio e quotas reais antes de liberar o portal para uso diário.
- **Evidência no Código Local:**
  - O arquivo [docs/tarefas.md](../tarefas.md#L22) documenta como pendente: `- [ ] E2-02b: validar duas contas reais, confirmação de e-mail e sessões no domínio de produção`.
  - O arquivo [docs/tarefas.md](../tarefas.md#L144) registra: `- [ ] Validar upload/download reais com sessão autenticada, além das políticas já testadas`.
- **Base Técnica e Justificativa:** Constatação direta no diário de bordo e notas técnicas de migração (`migracao-supabase-vercel.md`). Ensaios unitários em PGlite não comprovam estabilidade em nuvem.
- **Riscos:** Incompatibilidade de cabeçalhos de cookies em determinados navegadores, bloqueios de CORS em chamadas de Storage ou timeouts de upload em arquivos volumosos na Vercel.
- **Fontes Primárias:** Nenhuma externa necessária (demanda estritamente de homologação de infraestrutura local; `sourceIds: []`).
- **Critérios de Aceite:**
  1. Validação em ambiente hospedado de duas contas distintas operando em organizações isoladas, comprovando que uma não visualiza ou altera registros da outra.
  2. Teste completo de upload, download e reenvio de arquivo real no bucket `operation-documents` via sessão autenticada no navegador.
  3. Verificação do fluxo de recuperação de senha por e-mail ponta a ponta no domínio de produção.
  4. Configuração de monitoramento de erros de runtime e logs na Vercel e no Supabase para detecção de falhas de produção.
- **Dependências:** Nenhuma.

---

### GAP-01: Quadro de Colocação Multimercado e Rateio de Linhas (Written vs Signed Lines)

- **Categoria:** `reinsurance_placement`
- **Status:** `ausente`
- **Prioridade:** `P1` | **Esforço:** `L`
- **Problema do Corretor:** Em riscos facultativos e contratos de resseguro, o corretor atua sindicando a capacidade entre múltiplos resseguradores para atingir 100% da ordem cedida. Quando as resseguradoras retornam suas cotações, apresentam linhas escritas (*written lines*). Caso a soma ultrapasse 100% (*oversubscription*), o corretor aplica o rateio proporcional (*sign-down*); se ficar abaixo de 100%, há capacidade descoberta que impede o fechamento do negócio. Tratar destinatários como meros contatos de e-mail impede a gestão quantitativa da colocação.
- **Evidência no Código Local:**
  - Em [web/src/components/proposal-detail.tsx](../../web/src/components/proposal-detail.tsx#L282-L377), os destinatários são exibidos em cartões isolados sem campos de participação percentual ou totalizadores.
  - Em [supabase/migrations/20261009030000_proposal_portal.sql](../../supabase/migrations/20261009030000_proposal_portal.sql#L106-L107), `offer_recipients` armazena apenas identificadores de contato e chaves da SUSEP, sem modelo numérico de quotas.
- **Base Técnica e Justificativa:** Constatação direta na interface e no esquema relacional. A estruturação de linhas escritas e assinadas alinha-se aos padrões de mercado internacional descritos no Core Data Record (CDR) do Lloyd's e nas plataformas eletrônicas PPL e Whitespace.
- **Riscos:** Complexidade em regras de arredondamento de quotas decimais no rateio (*sign-down*) e necessidade de acomodar participações mínimas exigidas por determinados subscritores.
- **Fontes Primárias:** [Lloyd's Core Data Record (CDR)](https://www.lloyds.com/market-resources/requirements-and-standards/core-data-record) e [Placing Platform Limited (PPL)](https://www.ppl-london.com/).
- **Critérios de Aceite:**
  1. Tabela de consolidação de colocação sindicada na página de detalhes da proposta.
  2. Campos quantitativos para: Cota Ofertada (`order_share_pct`), Linha Escrita (`written_line_pct`) e Linha Assinada Final (`signed_line_pct`).
  3. Totalizador de capacidade colocada com alerta visual para subcolocação (`< 100%`) e sobrecolocação (`> 100%`).
  4. Botão de rateio proporcional (*pro-rata sign-down*) automático com possibilidade de ajuste manual pelo corretor.
  5. Identificação explícita do papel de cada ressegurador na proposta (Líder vs Seguidor).
- **Dependências:** `GAP-02`.

---

### GAP-02: Condições Técnicas e Financeiras Estruturadas da Oferta (Slip Estruturado)

- **Categoria:** `reinsurance_terms`
- **Status:** `incompleto`
- **Prioridade:** `P1` | **Esforço:** `M`
- **Problema do Corretor:** Uma oferta de resseguro apoia-se em condições financeiras estritas. Atualmente, o corretor redige essas condições misturadas no corpo do e-mail. Isso impede comparar versões da oferta (ex: se o LMG ou o prêmio mudaram entre V1 e V2), automatizar minutas de colocação e filtrar propostas por volume financeiro.
- **Evidência no Código Local:**
  - Em [supabase/migrations/20261008225654_oferta_re_foundation.sql](../../supabase/migrations/20261008225654_oferta_re_foundation.sql#L231), a tabela `offer_versions` possui a coluna `terms jsonb not null default '{}'`, mas o campo não é utilizado por nenhum formulário.
  - Em [web/src/app/workspace/flows.ts](../../web/src/app/workspace/flows.ts#L105-L108), a Server Action `prepareOffer` extrai unicamente strings de texto simples para `subject`, `body` e `signature`.
- **Base Técnica e Justificativa:** Constatação direta no banco e formulários. A modelagem fundamenta-se nos campos essenciais de contrato do Core Data Record (CDR) do Lloyd's.
- **Riscos:** Sobrecarga de preenchimento pelo corretor caso a interface exija excesso de campos técnicos nas fases iniciais de cotação.
- **Fontes Primárias:** [Lloyd's Core Data Record (CDR)](https://www.lloyds.com/market-resources/requirements-and-standards/core-data-record) e [ACORD Data Standards](https://www.acord.org/standards-architecture/acord-data-standards).
- **Critérios de Aceite:**
  1. Esquema tipado para o objeto `terms` contemplando: Moeda (`currency`: BRL, USD, EUR), Limite Máximo de Garantia/Indenização (`lmg_amount`), Retenção da Cedente (`retention_amount`), Comissão de Corretagem (`brokerage_commission_pct`), Prêmio/Taxa (`rate_pct` ou `mdp_amount`) e Franquia/POS (`deductible_terms`).
  2. Formulário no componente `offer-composer.tsx` permitindo informar esses parâmetros técnicos com máscaras monetárias e percentuais.
  3. Visualização comparativa lado a lado entre versões da oferta destacando os campos financeiros alterados entre V1 e V2.
  4. Interpolação automática dos valores financeiros em variáveis de modelo de e-mail (ex: `{{lmg}}`, `{{comissao}}`).
- **Dependências:** Nenhuma.

---

### GAP-03: Gestão de Evidências e Consulta Preferencial a Resseguradores Locais

- **Categoria:** `regulatory_compliance`
- **Status:** `ausente`
- **Prioridade:** `P2` | **Esforço:** `M`
- **Problema do Corretor:** O art. 5º da Resolução CNSP nº 451/2022 e a Lei Complementar nº 126/2007 regulam o direito de preferência aos resseguradores locais. Para que uma seguradora/corretora possa colocar riscos com resseguradores admitidos ou eventuais no exterior por insuficiência de capacidade local, é indispensável comprovar a formalização da consulta e a respectiva recusa (ou decurso de prazo sem resposta). Embora o Oferta Re classifique entidades no catálogo da SUSEP, o portal não auxilia na reunião dessas evidências nem consolida as recusas formais recebidas.
- **Evidência no Código Local:**
  - Em [supabase/migrations/20261008225654_oferta_re_foundation.sql](../../supabase/migrations/20261008225654_oferta_re_foundation.sql#L26), a view `latest_public_reinsurers` extrai a categoria da SUSEP (`local`, `admitida`, `eventual`), mas a RPC `prepare_proposal_offer` em [supabase/migrations/20261009030000_proposal_portal.sql](../../supabase/migrations/20261009030000_proposal_portal.sql#L87-L110) não realiza nenhuma verificação ou registro de histórico das consultas locais.
- **Base Técnica e Justificativa:** Constatação direta da ausência de relatórios ou indicadores de consulta a locais. O módulo deve ser concebido como ferramenta de apoio à coleta de evidências com parâmetros configuráveis, e não como uma regra matemática cega de bloqueio no MVP, demandando validação jurídica das exceções aplicáveis ao caso concreto.
- **Riscos:** Mudanças regulatórias futuras decorrentes do novo Marco Legal dos Seguros (Resolução CNSP nº 494/2026); risco de falsos bloqueios na esteira operacional caso a validação seja excessivamente rígida.
- **Fontes Primárias:** [SUSEP - Supervisão Prudencial e Regulação de Resseguro](https://www.gov.br/susep/pt-br/assuntos/informacoes-ao-mercado/solvencia-supervisao-prudencial/supervisao-consolidada-cgcon).
- **Critérios de Aceite:**
  1. Painel informativo exibindo a proporção de resseguradores locais consultados na proposta.
  2. Registro estruturado de recusas formais recebidas de resseguradores locais ou decurso de prazo sem manifestação.
  3. Relatório automatizado de "Evidências de Consulta Local" para compor o processo de colocação junto à seguradora cedente.
  4. Parametrização configurável de regras de alerta, sem bloqueio mandatório do envio, acompanhado de aviso de suporte operacional sem caráter de parecer jurídico.
- **Dependências:** `GAP-01`, `GAP-02`.

---

### GAP-04: Sincronização Microsoft Graph com Delta Query e Identificadores Imutáveis

- **Categoria:** `email_integration`
- **Status:** `incompleto`
- **Prioridade:** `P1` | **Esforço:** `L`
- **Problema do Corretor:** O corretor precisa verificar manualmente sua caixa de entrada no Outlook, alternar para o Oferta Re, marcar que enviou a oferta e fazer upload manual de arquivos salvos no disco local. Isso gera esquecimentos e divergências de horários. Para automatizar o fluxo via Microsoft 365, o sistema necessita de uma esteira segura de leitura de mensagens com consumo incremental via delta query e garantia de estabilidade de IDs quando mensagens são movidas entre pastas.
- **Evidência no Código Local:**
  - O arquivo [web/src/lib/email-tracking.ts](../../web/src/lib/email-tracking.ts#L1-L74) implementa apenas regras lógicas puras para casar cabeçalhos RFC (`In-Reply-To`, `References`, tokens `[OR-...]`), sem chamadas de rede ou tabelas associadas.
  - Em [web/src/components/proposal-detail.tsx](../../web/src/components/proposal-detail.tsx#L343-L372), a confirmação de envio é um simples formulário HTML com `input type="checkbox"` e rótulo "Conferi e enviei pelo Outlook".
- **Base Técnica e Justificativa:** Constatação direta no código e no histórico de migrações. Especificação técnica fundamentada na documentação oficial de mensagens do Microsoft Graph.
- **Riscos:** Políticas corporativas de segurança da corretora restringindo o consentimento de administrador (*admin consent*) para o escopo delegado `Mail.Read` no Microsoft Entra ID.
- **Fontes Primárias:** [Microsoft Graph API - Message Delta Query](https://learn.microsoft.com/en-us/graph/api/message-delta?view=graph-rest-1.0) e [Microsoft Graph Documentation - Outlook Immutable IDs](https://learn.microsoft.com/en-us/graph/outlook-immutable-id).
- **Critérios de Aceite:**
  1. Criação de tabelas no PostgreSQL para gerenciar conexões OAuth por organização e usuário com segredos/tokens criptografados no servidor.
  2. Implementação do fluxo de autorização OAuth 2.0 com escopos `Mail.Read` e `offline_access`.
  3. Worker de sincronização incremental chamando `GET /me/mailFolders/{id}/messages/delta` e enviando o cabeçalho obrigatório `Prefer: IdType="ImmutableId"`.
  4. Persistência e atualização transacional do `@odata.deltaLink` após o processamento bem-sucedido de cada lote de mensagens.
  5. Deduplicação de mensagens capturadas baseada na tupla `(organization_id, connection_id, immutable_id)`.
- **Dependências:** Nenhuma.

---

### GAP-05: Captura e Validação de Conteúdo MIME (.eml) no Servidor com Checksum Criptográfico

- **Categoria:** `audit_and_evidence`
- **Status:** `incompleto`
- **Prioridade:** `P1` | **Esforço:** `M`
- **Problema do Corretor:** Em litígios contratuais ou regulação de sinistros em resseguro, prints de tela de e-mail ou PDFs convertidos não possuem valor probatório suficiente. A evidência autêntica é a mensagem original em formato RFC 822 (`.eml`), com os carimbos de data/hora dos servidores SMTP e cabeçalhos completos de roteamento. Atualmente, o upload é manual e o hash SHA-256 é gerado pelo navegador via JavaScript; o servidor não valida os bytes recebidos contra um stream direto da API.
- **Evidência no Código Local:**
  - A Server Action `authorizeUpload` em [web/src/app/workspace/flows.ts](../../web/src/app/workspace/flows.ts#L153-L165) recebe a string `sha256` diretamente do FormData enviado pelo cliente.
  - O documento técnico [docs/rastreio-outlook-e-respostas.md](../rastreio-outlook-e-respostas.md#L21) registra expressamente a necessidade de o pipeline calcular e verificar no servidor os bytes recuperados antes de concluir o arquivamento.
- **Base Técnica e Justificativa:** Constatação direta no código de `flows.ts` e nos registros de arquitetura de `decisoes.md`.
- **Riscos:** Mensagens com anexos pesados de engenharia excedendo os limites de tamanho de upload configurados na aplicação (limite atual de 25 MiB).
- **Fontes Primárias:** [Microsoft Graph Documentation - Get MIME message ($value)](https://learn.microsoft.com/en-us/graph/outlook-get-mime-message) e [Circular SUSEP nº 605/2020](https://www2.susep.gov.br/safe/scripts/bnweb/bnmapi.exe?router=upload%2F22297).
- **Critérios de Aceite:**
  1. Pipeline no backend que recupera o stream binário MIME bruto via `GET /me/messages/{id}/$value` do Microsoft Graph.
  2. Cálculo obrigatório de hash SHA-256 no servidor durante o streaming de upload para o bucket privado `operation-documents`.
  3. Rejeição de arquivamento caso o hash do arquivo armazenado divirja do hash calculado durante o download do Graph.
  4. Preservação estrita da imutabilidade dos arquivos de evidência após a gravação inicial no bucket.
- **Dependências:** `GAP-04`.

---

### GAP-06: Exportação Consolidada de Dossiê de Auditoria e Colocação (Compliance Package)

- **Categoria:** `compliance_and_reporting`
- **Status:** `ausente`
- **Prioridade:** `P1` | **Esforço:** `M`
- **Problema do Corretor:** Em uma fiscalização ordinária da SUSEP ou diante de um aviso de sinistro expressivo, a corretora de resseguro precisa reunir todo o histórico da operação: os termos originais acordados com a cedente, todas as versões da oferta disparadas, as respostas e eventuais recusas de resseguradores locais, os aceites das resseguradoras participantes e os respectivos arquivos `.eml` autênticos. Fazer isso manualmente baixando dezenas de arquivos avulsos consome dias e gera risco de omissão de peças fundamentais.
- **Evidência no Código Local:**
  - A rota [web/src/app/workspace/arquivos/[id]/route.ts](../../web/src/app/workspace/arquivos/[id]/route.ts) e a tela [web/src/app/workspace/comprovantes/page.tsx](../../web/src/app/workspace/comprovantes/page.tsx) oferecem unicamente download individual de documentos. Não existe qualquer funcionalidade de exportação em lote ou agrupamento de evidências por processo.
- **Base Técnica e Justificativa:** Constatação direta da ausência de rotas de exportação consolidada no código. A necessidade fundamenta-se nas diretrizes de disponibilidade documental e fiscalização da Circular SUSEP nº 605/2020.
- **Riscos:** Tempo de processamento e consumo de memória na Vercel ao compactar múltiplos arquivos MIME com anexos pesados; requer geração assíncrona com link temporário assinado.
- **Fontes Primárias:** [Circular SUSEP nº 605/2020](https://www2.susep.gov.br/safe/scripts/bnweb/bnmapi.exe?router=upload%2F22297) e [Lloyd's Core Data Record (CDR)](https://www.lloyds.com/market-resources/requirements-and-standards/core-data-record).
- **Critérios de Aceite:**
  1. Ação autenticada "Exportar Dossiê de Auditoria" na visualização detalhada da proposta.
  2. Geração de um arquivo `.zip` contendo:
     - Manifesto formal do processo em PDF e JSON (com metadados, cedente, linha de negócio, vigência, prêmio, LMG);
     - Trilha completa de eventos imutáveis extraída de `proposal_events`;
     - Quadro de colocação consolidado com percentuais escritos e assinados por ressegurador;
     - Todos os arquivos de comprovação (`.eml` e anexos) acompanhados de tabela de verificação com seus respectivos hashes SHA-256.
  3. Registro de evento de auditoria em `audit_events` a cada geração do pacote por membro da organização.
- **Dependências:** `GAP-05`.

---

### GAP-07: Gestão Operacional de Tarefas Individuais e Acompanhamento de SLAs

- **Categoria:** `task_and_sla_management`
- **Status:** `incompleto`
- **Prioridade:** `P1` | **Esforço:** `M`
- **Problema do Corretor:** Processos de renovação e novas colocações seguem cronogramas rígidos com múltiplos passos sequenciais: coleta de dados com a cedente, solicitação de inspeção, elaboração de slip, consulta a líderes, distribuição ao mercado seguidor e fechamento antes do término da apólice anterior. No Oferta Re, o negócio tem apenas uma data `due_date` e um texto `next_action`, associado a um setor genérico. Não é possível atribuir uma proposta ou tarefa a um corretor específico da equipe (`assigned_to`), nem receber alertas automáticos de prazos críticos.
- **Evidência no Código Local:**
  - Em [supabase/migrations/20261009030000_proposal_portal.sql](../../supabase/migrations/20261009030000_proposal_portal.sql#L10-L11), a tabela `operations` adicionou apenas `due_date date` e `next_action text`. Não há coluna de usuário responsável individual.
  - O [README.md](../../README.md#L9) e o documento [docs/portal-propostas-e-renovacoes.md](../portal-propostas-e-renovacoes.md#L61) ressaltam expressamente: *"Não existem lembretes automáticos ativos."*
- **Base Técnica e Justificativa:** Constatação direta no esquema do banco e na documentação operacional do produto.
- **Riscos:** Fadiga de notificações na equipe caso os avisos de vencimento sejam excessivos ou mal calibrados.
- **Fontes Primárias:** [Lloyd's Core Data Record (CDR)](https://www.lloyds.com/market-resources/requirements-and-standards/core-data-record).
- **Critérios de Aceite:**
  1. Campo `assigned_to_user_id` em `operations` referenciando membros da organização.
  2. Checklist operacional de sub-tarefas vinculadas à proposta (ex.: "Coletar histórico de sinistros", "Obter cotação do líder", "Consultar mercados locais").
  3. Cálculo de SLA com destaque visual diferenciado para prazos em D-15, D-7, D-1 e vencidos.
  4. Envio de notificações automáticas por e-mail e in-app aos responsáveis individuais conforme prazos se aproximam.
- **Dependências:** Nenhuma.

---

### GAP-08: Importação e Validação em Lote de Contatos e Mercados (CSV/XLSX)

- **Categoria:** `data_management`
- **Status:** `ausente`
- **Prioridade:** `P1` | **Esforço:** `S`
- **Problema do Corretor:** Ao contratar a plataforma, uma corretora de resseguro possui listas legadas com centenas de subscritores organizados por ramo e mercado em arquivos Excel. O cadastro manual contato por contato inviabiliza o onboarding ágil de novas empresas. A tarefa técnica E3-02 está documentada no projeto há meses, mas permanece sem qualquer código funcional.
- **Evidência no Código Local:**
  - O arquivo [docs/tarefas.md](../tarefas.md#L32) registra como pendente: `- [ ] E3-02: importar XLSX/CSV com prévia, mapeamento, duplicatas e confirmação`.
  - A tela [web/src/app/workspace/contatos/page.tsx](../../web/src/app/workspace/contatos/page.tsx) disponibiliza unicamente o formulário de cadastro unitário acionando `saveContact` em [web/src/app/workspace/flows.ts](../../web/src/app/workspace/flows.ts#L29-L70).
- **Base Técnica e Justificativa:** Constatação direta da pendência na documentação técnica e ausência de código de upload em lote.
- **Riscos:** Formatos divergentes de planilhas fornecidas pelos clientes contendo e-mails inválidos ou nomes de resseguradoras divergentes do cadastro oficial da SUSEP.
- **Fontes Primárias:** [ACORD Data Standards](https://www.acord.org/standards-architecture/acord-data-standards).
- **Critérios de Aceite:**
  1. Rota e interface de upload de arquivos CSV e XLSX na seção de contatos do workspace.
  2. Mapeamento de colunas com reconhecimento automático de cabeçalhos padrão (Nome, E-mail, Resseguradora, Especialidades, Setor).
  3. Tela de prévia de importação apontando inconsistências: e-mails inválidos, duplicatas e resseguradoras não localizadas no cadastro oficial da SUSEP.
  4. Inserção em lote atômica com confirmação expressa do usuário.
- **Dependências:** Nenhuma.

---

### GAP-09: Gestão de Cláusulas Especiais, Condições Precedentes e Subjectivities

- **Categoria:** `reinsurance_terms`
- **Status:** `ausente`
- **Prioridade:** `P2` | **Esforço:** `M`
- **Problema do Corretor:** É prática padrão no resseguro que o subscritor condicione seu aceite formal a cláusulas suspensivas ou "subjectivities" (ex: "sujeito a cláusula de guerra LMA4000", "sujeito a inspeção física satisfatória em até 30 dias", "sujeito a histórico de sinistros atualizado"). O corretor precisa acompanhar se essas condições foram cumpridas ou dispensadas pelo ressegurador; caso contrário, a cobertura pode ser anulada em sinistro. No sistema atual, há apenas um campo de texto livre de anotação na resposta.
- **Evidência no Código Local:**
  - Em [web/src/components/proposal-detail.tsx](../../web/src/components/proposal-detail.tsx#L328-L332), a resposta do mercado renderiza somente o campo textual `response.note`. Não existe tabela ou estrutura relacional para gerenciar condicionantes.
- **Base Técnica e Justificativa:** Constatação direta da limitação de modelo no código. Prática alinhada ao padrão de subjectivities do Core Data Record e contratos de mercado internacional.
- **Riscos:** Burocratização excessiva se o corretor for obrigado a estruturar toda anotação de subscritor; deve haver classificação de criticidade (suspensiva vs informativa).
- **Fontes Primárias:** [Lloyd's Core Data Record (CDR)](https://www.lloyds.com/market-resources/requirements-and-standards/core-data-record).
- **Critérios de Aceite:**
  1. Entidade relacional para registro de subjectivities associadas à proposta e ao ressegurador participante.
  2. Campos para: Descrição da Condição, Prazo Limite (*before inception* ou data limite), Status (Pendente, Atendida, Dispensada) e Anexo comprobatório.
  3. Alerta impeditivo ou de atenção ao marcar a proposta como "Colocada" enquanto houver subjectivities críticas pendentes.
- **Dependências:** `GAP-01`, `GAP-02`.

---

### GAP-10: Geração Automatizada de Nota de Cobertura (Cover Note) e Closing Slip

- **Categoria:** `contract_documentation`
- **Status:** `ausente`
- **Prioridade:** `P2` | **Esforço:** `M`
- **Problema do Corretor:** Assim que o risco atinge 100% de colocação e a proposta é concluída, a corretora tem a obrigação de emitir a Nota de Cobertura de Resseguro (*Cover Note*) para a seguradora cedente e os slips de encerramento (*closing slips*) com as participações finais assinadas para cada ressegurador. Atualmente, os corretores precisam redigir essas notas manualmente no Word copiando dados de planilhas e e-mails, o que é demorado e propício a erros de digitação de valores segurados.
- **Evidência no Código Local:**
  - A interface em [web/src/components/proposal-detail.tsx](../../web/src/components/proposal-detail.tsx#L122-L130) oferece apenas o botão "Iniciar renovação". Não há gerador de minutas contratuais ou exportador em PDF.
- **Base Técnica e Justificativa:** Constatação direta da ausência de componentes geradores de documentos contratuais no código.
- **Riscos:** Exigências de layout e cláusulas específicas variando de acordo com as diretrizes de cada seguradora cedente.
- **Fontes Primárias:** [Lloyd's Core Data Record (CDR)](https://www.lloyds.com/market-resources/requirements-and-standards/core-data-record).
- **Critérios de Aceite:**
  1. Ação "Gerar Nota de Cobertura" disponível para propostas na etapa "Colocada".
  2. Geração automatizada de PDF formatado contendo: cabeçalho da corretora, dados da cedente e segurado, resumo de vigência, condições financeiras (LMG, taxas, prêmios) e quadro final de resseguradores com as linhas assinadas.
  3. Armazenamento da minuta gerada como documento vinculado ao processo no Storage privado.
- **Dependências:** `GAP-01`, `GAP-02`.

---

### GAP-11: Suporte Especializado a Estruturas de Tratados de Resseguro (Treaty em Camadas)

- **Categoria:** `treaty_reinsurance`
- **Status:** `ausente`
- **Prioridade:** `P2` | **Esforço:** `L`
- **Problema do Corretor:** Embora a organização permita cadastrar setores chamados "Treaty", o modelo de dados de propostas é quase inteiramente concebido para riscos facultativos individuais (como comprovam campos como `insured_name` e `contract_reference`). Em contratos de tratados (resseguro automático de carteira), a lógica opera por modalidades (Proporcional: Quota-Parte, Excedente de Responsabilidade; Não Proporcional: Excesso de Danos / XL por Risco ou Catástrofe), divisão em camadas (*layers*), retenções/prioridades, limites de cobertura por evento ou agregado, e regras de reconstituição de cobertura (*reinstatements*).
- **Evidência no Código Local:**
  - O esquema em [supabase/migrations/20261009030000_proposal_portal.sql](../../supabase/migrations/20261009030000_proposal_portal.sql#L3-L18) e o tipo `Proposal` em [web/src/lib/proposals.ts](../../web/src/lib/proposals.ts#L4-L10) suportam unicamente propriedades planas de negócios singulares.
- **Base Técnica e Justificativa:** Constatação direta da modelagem relacional plana no banco.
- **Riscos:** Alta complexidade conceitual; deve ser abordado inicialmente com foco em contratos de Excesso de Danos (XL).
- **Fontes Primárias:** [ACORD Data Standards](https://www.acord.org/standards-architecture/acord-data-standards).
- **Critérios de Aceite:**
  1. Classificação da proposta entre: "Facultativo", "Tratado Proporcional" (Quota-Parte, Excedente de Responsabilidade) e "Tratado Não Proporcional" (Excess of Loss - XL por Risco ou Catástrofe).
  2. Configuração de camadas (*layers*) com definição de Prioridade/Retenção da Cedente e Limite da Camada.
  3. Quadro de colocação adaptado para permitir subscrição de linhas independentes por camada do tratado.
- **Dependências:** `GAP-01`, `GAP-02`.

---

## 5. Top 5 Lacunas Críticas e Roteiro Reestimável (30, 60 e 90 Dias)

### 5.1. Top 5 Lacunas Críticas

As 5 lacunas recomendadas como prioritárias organizam-se explicitamente em torno da **segurança/confiabilidade operacional do piloto real (P0)** e do **corte inicial de subscrição e colocação (P1)**:

1. **`GAP-12` — Procedimento Operacional de Backup, Restauração e Resiliência de Dados (P0):** Garantir procedimento de backup com cópias lógicas e sincronização de Storage viáveis no plano Free do Supabase antes de custodiar dados reais.
2. **`GAP-13` — Revogação de Acesso de Membros Aceitos e Alteração Auditada de Papéis (P0):** Permitir a revogação de acessos e auditoria de privilégios quando corretores se desvinculam da empresa, preservando o compartilhamento interno.
3. **`GAP-14` — Homologação Ponta a Ponta de Auth e Storage em Ambiente Hospedado (P0):** Validar a experiência real com duas contas em organizações separadas e transferências de arquivos em produção.
4. **`GAP-01` — Quadro de Colocação Multimercado e Rateio de Linhas (Written vs Signed Lines) (P1):** Núcleo matemático de sindicação de risco até 100% da capacidade cedida.
5. **`GAP-02` — Condições Técnicas e Financeiras Estruturadas da Oferta (Slip Estruturado) (P1):** Primeiro corte de dados financeiros (LMG, retenção, prêmio, comissão e moeda) para dar inteligência aos slips.

### 5.2. Roteiro Reestimável de 30, 60 e 90 Dias

> [!NOTE]
> O cronograma abaixo representa um **cenário de planejamento realista e reestimável**, considerando alocação de 1 desenvolvedor fullstack e validação de 1 especialista em subscrição. Os módulos foram redimensionados para evitar o acúmulo de módulos de grande porte (*L*) em fases preliminares.

```mermaid
flowchart LR
  subgraph Fase 1: 0 a 30 dias (Segurança e Fundação)
    F1_A["POP Backup Free (GAP-12)"]
    F1_B["Revogação Membros (GAP-13)"]
    F1_C["Homologação Prod (GAP-14)"]
    F1_D["1º Slice Slip (GAP-02)"]
    F1_E["Importador CSV (GAP-08)"]
  end

  subgraph Fase 2: 31 a 60 dias (Colocação e Mensageria)
    F2_A["Quadro 100% (GAP-01)"]
    F2_B["OAuth e Delta Graph (GAP-04)"]
    F2_C["Captura MIME .eml (GAP-05)"]
    F2_D["Dossiê ZIP (GAP-06)"]
  end

  subgraph Fase 3: 61 a 90 dias (Especialização Operacional)
    F3_A["Tarefas e SLAs (GAP-07)"]
    F3_B["Evidências Locais (GAP-03)"]
    F3_C["Subjectivities (GAP-09)"]
    F3_D["Cover Note PDF (GAP-10)"]
    F3_E["Tratados XL (GAP-11)"]
  end

  Fase 1: 0 a 30 dias (Segurança e Fundação) --> Fase 2: 31 a 60 dias (Colocação e Mensageria)
  Fase 2: 31 a 60 dias (Colocação e Mensageria) --> Fase 3: 61 a 90 dias (Especialização Operacional)
```

#### Fase 1 (0 a 30 dias): Confiabilidade Operacional, Segurança e Fundação do Piloto
- **Foco:** Eliminar riscos impeditivos de segurança e governança (P0), homologar a infraestrutura em nuvem e disponibilizar o primeiro corte de dados estruturados.
- **Entregas:**
  - Procedimento de backup e restauração com cópias off-site compatíveis com plano Free do Supabase (`GAP-12` - P0, Esforço M).
  - Revogação funcional de membros aceitos e alteração auditada de papéis em equipe (`GAP-13` - P0, Esforço S).
  - Homologação de Auth e Storage em produção com duas contas em organizações separadas e arquivos reais (`GAP-14` - P0, Esforço M).
  - Primeiro slice de termos estruturados do slip: LMG, retenção, moeda e prêmio (`GAP-02` - P1, Esforço M).
  - Importação de contatos em lote via CSV/XLSX (`GAP-08` - P1, Esforço S).
- **Racional de Esforço:** Totaliza módulos de esforço pequeno e médio, viabilizando entrega sólida sem sobrecarga.

#### Fase 2 (31 a 60 dias): Núcleo de Colocação Multimercado e Mensageria
- **Foco:** Viabilizar a sindicação de mercado até 100% e automatizar a captura de e-mails de retorno com integridade.
- **Entregas:**
  - Quadro de colocação multimercado com written lines, signed lines e sign-down (`GAP-01` - P1, Esforço L).
  - Conexão delegada Microsoft Graph com delta query e IDs imutáveis (`GAP-04` - P1, Esforço L).
  - Captura automática de mensagens brutas MIME `.eml` com checksum no servidor (`GAP-05` - P1, Esforço M).
  - Exportação consolidada de Dossiê de Auditoria em arquivo ZIP (`GAP-06` - P1, Esforço M).

#### Fase 3 (61 a 90 dias): Especialização Operacional e Governança Avançada
- **Foco:** Apoiar a produtividade diária da equipe, emissão documental e contratos automáticos.
- **Entregas:**
  - Atribuição de responsáveis individuais, checklists e monitoramento de SLAs (`GAP-07` - P1, Esforço M).
  - Painel de registro de consultas e recusas formais de resseguradores locais (`GAP-03` - P2, Esforço M).
  - Gerenciamento estruturado de cláusulas suspensivas (*subjectivities*) (`GAP-09` - P2, Esforço M).
  - Geração de minutas em PDF de Nota de Cobertura e Closing Slips (`GAP-10` - P2, Esforço M).
  - Modelagem inicial para Tratados de Resseguro Não Proporcionais (Excess of Loss) em camadas (`GAP-11` - P2, Esforço L).

---

## 6. Funcionalidades que NÃO Devem Ser Priorizadas

Na priorização do produto, é essencial postergar funcionalidades que adicionem complexidade desnecessária ou gerem riscos legais:

1. **Envio 100% Automático de Ofertas sem Confirmação Humana:**
   - *Justificativa:* No mercado corporativo de resseguro, o risco de responsabilidade civil decorrente do envio involuntário de condições imprecisas ou destinatários trocados é inaceitável. Práticas de mercado consolidadas (como PPL) exigem confirmação deliberada do corretor antes do envio (*human-in-the-loop*). O foco deve ser a **preparação assistida e a captura automática de respostas**, e não o disparo desatendido.
2. **Cobrança Automatizada por Cartão de Crédito e Paywall Imediato:**
   - *Justificativa:* Conforme registrado nas decisões de produto (`DEC-002` e `DEC-005`), o projeto inicia com pilotos assistidos para validar o valor da esteira operacional. A cobrança está postergada por **ausência de demanda validada e modelo comercial ainda não definido**, e não por uma regra universal de mercado. Adicionar paywall precoce apenas adicionaria fricção à validação.
3. **Módulo Completo de Sinistros e Liquidação Financeira:**
   - *Justificativa:* A regulação e liquidação financeira de sinistros de resseguro envolve conciliação bancária complexa e integração com bureaus. Tentar abarcar sinistros na fase inicial desviaria a engenharia do foco nuclear: colocação e renovação de contratos.
4. **Conector Desktop Nativo / VSTO Add-in para Windows:**
   - *Justificativa:* Como observado na `DEC-023`, plugins locais em clientes Windows geram alta dívida de manutenção e incompatibilidade entre plataformas. A integração em nuvem via Microsoft Graph API no servidor é mais resiliente, segura e universal.
5. **Emissão de Pareceres Jurídicos Regulatórios Automatizados:**
   - *Justificativa:* A plataforma deve fornecer ferramentas de conferência de dados e apoio à coleta de evidências, nunca emitir pareceres que declarem conformidade jurídica definitiva, cuja responsabilidade é privativa da assessoria jurídica da corretora.

---

## 7. Fatos Observados versus Inferências e Limitações

### 7.1. Fatos Diretamente Observados no Código e no Ambiente

- **Banco e Segurança:** A fundação relacional no PostgreSQL Supabase possui RLS ativado em tabelas públicas, advisory locks para concorrência e triggers de auditoria em `proposal_events`. Controles relacionais e testes unitários existem, mas a homologação em ambiente de produção hospedado permanece pendente.
- **Suíte de Testes:** 38 testes automatizados em Node.js (`scripts/*.test.mjs`) passam com sucesso em ambiente em memória PGlite.
- **Rastreio de E-mail:** A correlação em `email-tracking.ts` é uma biblioteca pura de teste unitário; não há tabelas de conexões OAuth, cursores delta ou chamadas de rede implementadas.
- **Demonstração:** A rota `/demonstracao` funciona como um protótipo desacoplado em `localStorage`, permitindo simulações visuais sem persistência no banco.
- **Condições Financeiras:** Os formulários operacionais manipulam apenas textos livres; a coluna `terms jsonb` de `offer_versions` permanece inativa.
- **Gestão de Equipe:** `web/src/app/workspace/equipe/actions.ts` possui apenas revogação de convites pendentes, sem função de remoção de membros aceitos.
- **Deep Research:** Não há ferramenta ou subagente oficial de Deep Research registrado no ambiente.

### 7.2. Inferências de Negócio e Processos

- **Demanda do Corretor:** Infere-se que a principal dor das corretoras não é o acesso ao cadastro público da SUSEP, mas o esforço despendido para acompanhar cotas sindicadas de colocação, cumprir prazos de renovação e manter arquivos probatórios organizados para auditorias.
- **Governança Regulatória:** Infere-se que a formalização tempestiva de consultas e recusas de resseguradores locais (exigida pela Resolução CNSP nº 451/2022) representa uma preocupação de governança de corretoras que realizam cessões ao exterior, sendo vantajoso automatizar a reunião dessas evidências.

### 7.3. Limitações de Fontes e Infraestrutura

- **Transição Normativa da SUSEP:** O marco regulatório de seguros e resseguros no Brasil encontra-se em adaptação periódica decorrente do novo Marco Legal dos Seguros e edição da Resolução CNSP nº 494/2026. Regras específicas de percentuais e prazos de resposta demandam parametrização contínua e acompanhamento legislativo formal.
- **Acesso a Portais Públicos:** Consultas automatizadas a URLs de normas públicas (como `in.gov.br`) e entidades internacionais (como `acord.org`) podem sofrer bloqueios de WAF ou inconsistências de protocolo HTTP/2; as análises fundamentaram-se em canais oficiais primários verificados com resposta 200 (`susep.gov.br`, `learn.microsoft.com`, `lloyds.com` e `ppl-london.com`).
- **Governança de Tenants Microsoft 365:** A autorização de apps OAuth no Microsoft Entra ID exige consentimento de administradores de segurança de TI da corretora, o que pode influenciar os prazos de homologação da integração.
- **Limitações do Plano Free do Supabase:** Backups do banco de dados não incluem objetos de Storage; PITR é um recurso pago opcional disponível para planos Pro, Team ou Enterprise; projetos Free precisam manter suas próprias exportações e cópias off-site para garantir retenção e recuperação independente de arquivos.

---

## 8. Fontes Primárias Consultadas

1. **Microsoft Graph Mail API - Message Delta:**  
   *Microsoft Graph REST API v1.0 - Get incremental changes to messages in a folder (delta query)*  
   URL: [https://learn.microsoft.com/en-us/graph/api/message-delta?view=graph-rest-1.0](https://learn.microsoft.com/en-us/graph/api/message-delta?view=graph-rest-1.0) — Acesso em: 15/10/2026.
2. **Microsoft Graph Mail API - Immutable Identifiers:**  
   *Microsoft Graph Documentation - Enable immutable IDs in Outlook mail items*  
   URL: [https://learn.microsoft.com/en-us/graph/outlook-immutable-id](https://learn.microsoft.com/en-us/graph/outlook-immutable-id) — Acesso em: 15/10/2026.
3. **Microsoft Graph Mail API - MIME Content Export:**  
   *Microsoft Graph Documentation - Get MIME content of an Outlook message ($value)*  
   URL: [https://learn.microsoft.com/en-us/graph/outlook-get-mime-message](https://learn.microsoft.com/en-us/graph/outlook-get-mime-message) — Acesso em: 15/10/2026.
4. **Lloyd's Market Resources - Core Data Record (CDR):**  
   *Lloyd's Core Data Record (CDR) & Blueprint Two Placing Data Standards*  
   URL: [https://www.lloyds.com/market-resources/requirements-and-standards/core-data-record](https://www.lloyds.com/market-resources/requirements-and-standards/core-data-record) — Acesso em: 15/10/2026.
5. **Placing Platform Limited (PPL London):**  
   *PPL London - Electronic Placing Platform Benchmark*  
   URL: [https://www.ppl-london.com/](https://www.ppl-london.com/) — Acesso em: 15/10/2026.
6. **SUSEP - Supervisão Prudencial e Regulação de Resseguro:**  
   *SUSEP - Supervisão Consolidada, Resolução CNSP nº 451/2022 e Circular SUSEP nº 683/2022*  
   URL: [https://www.gov.br/susep/pt-br/assuntos/informacoes-ao-mercado/solvencia-supervisao-prudencial/supervisao-consolidada-cgcon](https://www.gov.br/susep/pt-br/assuntos/informacoes-ao-mercado/solvencia-supervisao-prudencial/supervisao-consolidada-cgcon) — Acesso em: 15/10/2026.
7. **SUSEP - Circular nº 605/2020:**  
   *SUSEP - Regras e procedimentos para a guarda e conservação de documentos e registros*  
   URL: [https://www2.susep.gov.br/safe/scripts/bnweb/bnmapi.exe?router=upload%2F22297](https://www2.susep.gov.br/safe/scripts/bnweb/bnmapi.exe?router=upload%2F22297) — Acesso em: 15/10/2026.
8. **Supabase Platform Documentation - Database Backups & PITR:**  
   *Supabase Platform Documentation - Database Backups, Storage Separation, WAL Archiving and PITR*  
   URL: [https://supabase.com/docs/guides/platform/backups](https://supabase.com/docs/guides/platform/backups) — Acesso em: 15/10/2026.
9. **ACORD - Data Standards Architecture:**  
   *ACORD Standards - Global Reinsurance & Large Commercial (GRLC)*  
   URL: [https://www.acord.org/standards-architecture/acord-data-standards](https://www.acord.org/standards-architecture/acord-data-standards) — Acesso em: 15/10/2026 (Consulta sujeita a limitações de WAF/403 em requisições automatizadas sem navegador completo).
