# Registro de decisões

Criado em 08/10/2026. Os pedidos do autor estão registrados como confirmados; escolhas de negócio e arquitetura são propostas até validação.

## DEC-001: documentar desenvolvimento para o TCC

Estado: confirmado pelo pedido do autor.

Manter documentação versionada neste repositório. Registrar problema, alternativas, justificativa, implementação, verificações e limitações. Evidências de participantes devem ser anonimizadas e separadas de dados públicos do produto.

Consequência: cada etapa futura deve atualizar o diário e relacionar commits e evidências. Não registrar uma recomendação como resultado já alcançado.

## DEC-002: iniciar com pilotos B2B

Estado: proposto.

Alternativas: instalação por cliente, freemium por consulta e serviço por organização. A consulta gratuita da SUSEP exige validar valor adicional; a demanda de equipes específicas ainda é desconhecida.

Proposta: 2 ou 3 pilotos assistidos, com escopo e duração definidos, antes de investir em aquisição ampla e cobrança automatizada.

Revisar se o autor tiver audiência pronta, usuários com frequência comprovada ou clientes exigindo instalação própria. Aprovação e preço pendentes.

## DEC-003: personalizar marca em código compartilhado

Estado: proposto.

Alternativas: fork por corretora, instalação dedicada e configurações em um produto comum. Logo, cores e nome parecem compatíveis com configuração. Requisitos privados por cliente ainda não foram levantados.

Proposta: template visual e configuração por organização. Instalação dedicada terá implantação e manutenção próprias se for solicitada e economicamente justificada.

Consequência: autorização deve isolar listas e revisões; a marca visual não oferece isolamento de dados.

## DEC-004: validar coleta antes de publicar diferenças

Estado: proposto, prioridade P0.

O parser verifica categoria vazia, mas a comparação sobrescreve duplicatas e não bloqueia quedas parciais. Ausência pode resultar de falha na fonte ou coleta.

Proposta: validação de esquema, identificação, categoria, duplicidade e volume; baseline permanece inalterado em falha. Ausência recebe estado de confirmação.

Revisar parâmetros com exemplos da fonte e histórico. Testes controlados devem cobrir casos ainda ausentes nos relatórios reais.

## DEC-005: cobrar pelo acompanhamento da rotina

Estado: hipótese comercial.

Alternativas: busca limitada, assinatura por equipe, implantação, relatórios avulsos e integração. Proposta: assinatura por organização para monitoramento, histórico e colaboração; marca própria como complemento.

Condição de aceite: uso recorrente e disposição de pagar. Os 11 relatórios sem mudanças exigem testar utilidade em períodos estáveis. Sem preço definido.

## DEC-006: preservar Python e validar frontend comercial depois

Estado: proposto.

Streamlit atende demonstração e pilotos iniciais. React com shadcn/ui é opção para a experiência comercial; a migração deve ter justificativa em requisitos de usuários, marca, autenticação e manutenção.

Proposta: melhorar consulta em Streamlit, validar protótipo Stitch e depois decidir migração. Banco, API e fornecedores permanecem propostas, sem contratação.

## DEC-007: separar coleta e validade regulatória

Estado: proposto.

O produto observa registros na fonte. Proposta: distinguir horário da coleta, data cadastral e intervalo da mudança observada. Uma ausência no snapshot não será anunciada automaticamente como cancelamento de licença.

Consequência: textos de dashboard, relatórios e mensagens precisam refletir a evidência disponível.

## DEC-008: incluir a rotina de ofertas no foco do produto

Estado: necessidade relatada pelo autor; implementação proposta.

Evidência: o autor usa Excel para resseguradoras e contatos, pesquisa portais para atualização e prepara ofertas. Propôs reunir preparação de e-mails no produto.

Proposta: contatos privados por organização, ofertas versionadas, rascunhos e evidências. Detalhes em [Gestão de ofertas e contatos](ofertas-e-contatos.md). Priorizar essa rotina após confiabilidade do pipeline, antes de cobrar apenas pelo monitoramento cadastral. Complementa DEC-005 e DEC-006.

## DEC-009: importar contatos autorizados do cliente

Estado: proposto, alinhado à alternativa sugerida pelo autor.

Cada corretora traz sua base ou cadastra manualmente; contatos privados não se tornam um diretório compartilhado. Testes iniciais usam contatos fictícios, pois o autor não consegue exportar a base atual e o motivo permanece pendente.

Atualização: o autor esclareceu que perdeu acesso ao mudar de time e que a extração causaria problema com compliance mesmo se houvesse acesso. A base da empresa está excluída do projeto. Dados fictícios serão usados no desenvolvimento; bases de futuros clientes dependerão de autorização para uso no serviço.

## DEC-010: começar pela preparação, distinguir envio e resposta

Estado: proposto.

Rascunho, envio, evidência de entrega e resposta terão estados distintos. Integração de e-mail depende do ambiente do cliente. Checklist e percentuais precisam de regra validada por operação e versão normativa. Referências legais pesquisadas e limitações estão em [Gestão de ofertas e contatos](ofertas-e-contatos.md).

## DEC-011: biblioteca de modelos e rascunhos no Outlook

Estado: fluxo atual confirmado pelo autor; solução proposta.

O autor usa macro para selecionar empresas/anexos e criar rascunhos; revisa e envia manualmente. O texto padrão vem de mensagens anteriores. Propôs modelos editáveis por corretora, semelhantes à experiência de assinaturas.

Proposta: biblioteca privada, editor visual, assinatura separada, versões e criação de rascunhos no Outlook. Preservar revisão/envio manual. Investigar integração para rascunhos cedo, complementando DEC-010; envio automático permanece fora do MVP proposto. Confirmar conta e compatibilidade antes de escolher Graph ou add-in. Detalhes em [Modelos e Outlook](modelos-e-outlook.md).

## DEC-012: comprovantes manuais vinculados a contratos e ofertas

Estado: rotina e necessidade relatadas pelo autor; implementação proposta.

Hoje as respostas são baixadas e guardadas manualmente na pasta de rede do contrato. Proposta: upload manual no web app, com vínculo a contrato/operação, oferta, versão e resseguradora. Preservar original, datas distintas de mensagem/upload e histórico de revisão. Integração automática da caixa de entrada fica para evolução posterior. Especificação em [Contratos e comprovantes](contratos-e-comprovantes.md).

## DEC-013: acompanhar notícias e normas sobre multas

Estado: requisito solicitado pelo autor; implementação proposta.

Incluir área de atualizações regulatórias sobre oferta de resseguro e sanções, com referências oficiais, datas, vigência e versões. Começar com cadastro/revisão manual; automatizar descoberta posteriormente. Distinguir proposta e norma vigente, além de valores históricos e enquadramento aplicável. Especificação e complemento Stitch em [Atualizações regulatórias e multas](atualizacoes-regulatorias.md).

## DEC-014: nome Oferta Re e identidade inspirada no Dietitian

Estado: nome, referência e dispensa do Stitch confirmados pelo autor; composição visual proposta.

O autor escolheu Oferta Re e solicitou design inspirado em dietitian.com.br com as mesmas cores. Foi verificada a página pública e extraída a paleta do HTML/CSS. Proposta: roxo `#8005B6`, branco, cinzas, navegação clara e tabelas para operações. Disponibilidade de marca/domínio pendente. Google Stitch deixa de ser etapa necessária; os prompts anteriores ficam como histórico. Artefatos em [Identidade do Oferta Re](identidade-oferta-re.md). Sem alteração funcional do dashboard.

## Modelo para novos registros

```text
ID e título:
Data e responsável:
Estado: proposto / aceito / implementado / substituído
Problema e evidências:
Alternativas consideradas:
Decisão e justificativa:
Consequências e limites:
Critério de revisão:
Commit, verificação e evidências:
```

## Histórico desta rodada

08/10/2026: análise do README, pipeline, dashboard, workflow e CSVs; pesquisa da consulta oficial da SUSEP; leitura de shadcn e humanizer; criação da documentação de produto, roadmap, design, decisões e TCC. Nenhuma proposta comercial foi aprovada pelo autor nesta rodada. Sem mudanças funcionais, deploy ou envio de mensagens.


## DEC-015 — Primeira entrega e correção do monitoramento

Data: 08/10/2026. Estado: implementado localmente; validação no Actions pendente.

O log da execução [37828397826](https://github.com/vicTmm/pipeline-susep-resseguradoras/actions/runs/37828397826) terminou em `Nenhum campo de seleção encontrado na página da SUSEP`. A reprodução local recebeu `Web Page Blocked` no Chromium. O formulário público funcionou por GET/POST HTTP, sem navegador. Decisão: requests/BeautifulSoup, timeout, retries limitados, contagem declarada conferida e HTML preservado. Falha de layout/bloqueio permanece fatal; nenhum snapshot vazio é promovido.

As três categorias e identidades únicas são obrigatórias. Queda superior a 10% em uma categoria bloqueia publicação, como critério operacional configurável após revisão. Manifestos registram UTC, código/CSV com SHA256, contagens, origem e erro. Publicação com restauração em erro de I/O; sem transação entre processos ou proteção contra encerramento abrupto.

Actions atualizadas para versões em Node 24 e Ubuntu 24.04 fixado. Workflow continua falhando quando a coleta falha, mas versiona o manifesto para informar o painel. Dependências diretas fixadas; CI offline 3.12/3.14 criada, ainda sem resultado remoto. Dados brutos públicos ficam em artefatos por 30 dias; futuros dados privados ficam fora do Git/artefatos.

Consulta Streamlit recebeu identidade Oferta Re, busca nome/CNPJ, filtro, CSV e avisos de defasagem/falha. Removido cadastro de e-mail sem entrega de alertas. React/shadcn, autenticação e fluxos privados seguem as entregas posteriores.

Verificação: 11 testes offline e pip check locais; coleta HTTP validada com 135 entidades. O relatório inicial mostra 4 novas, 1 ausente e 131 alteradas contra junho. A extração passou a reconhecer campos com acentos antes ignorados; essas diferenças não podem ser interpretadas integralmente como atos regulatórios. Os históricos antigos foram preservados.

Critério de revisão: resultado do novo runner, mudança da fonte, falsos bloqueios do limiar ou necessidade de concorrência/transação durável.

## DEC-016 — Supabase e Next.js na Vercel

Data: 08/10/2026. Estado: escolhido pelo autor; fundação implementada, deploy Vercel pendente. A lateral e o layout Streamlit limitavam o produto. Next.js/shadcn oferece controle da interface; Supabase concentra banco, Auth, API e arquivos. Python fica no coletor. Não há API Python adicional nesta etapa. Foram aplicadas duas migrações, isolamento por organização, histórico imutável e bucket privado. Verificações e limites em [Migração](migracao-supabase-vercel.md). Revisar arquitetura após piloto, volumes e necessidades de tarefas assíncronas.

## DEC-017 — Credencial exclusiva de ingestão pública

Data: 08/10/2026. Estado: implementado. O coletor não precisa de acesso administrativo a dados privados. A Edge Function autentica token de 256 bits e aceita somente duas RPCs de publicação pública, com validação de corpo. O GitHub guarda esse token; o runtime Supabase mantém sua própria chave administrativa. Sem credencial retorna 401; publicação idempotente foi verificada. Revisar na rotação, incidentes ou mudança do escopo. Logs não devem expor tokens nem conteúdo privado.

## DEC-018 — Telas privadas e gravação atômica

Data: 08/10/2026. Estado: implementado; ensaio hospedado com conta real pendente. As telas operacionais usam Server Actions com sessão verificada e RLS por organização. Modelos e preparação de ofertas usam RPCs security invoker para garantir rollback integral. Destinatários recebem snapshot de nome/e-mail. A revisão e o envio seguem manuais; confirmação na tela apenas registra informação da equipe. Editor inicial usa texto simples.

Upload direto ao Storage evita trafegar arquivos pelo corpo das requisições Vercel. Metadados precedem autorização; falhas podem deixar registros pendentes, com reenvio explícito. Preservação, reconciliação e teste hospedado serão critérios para o piloto. Detalhes em [Telas e fluxos](telas-e-fluxos.md).

## DEC-019 — Identidade azul e verde com mascote

Data: 08/10/2026. Estado: solicitado pelo autor e implementado. Uma nova imagem de mascote criada no Stitch substitui a referência roxa de Dietitian. Recriação em SVG favorece nitidez, fundo transparente e reutilização em marca/favicon. Azul principal, verde de confirmação e ciano de apoio são tokens compartilhados; componentes mantêm suas variantes. Lateral de 80 px preservada. Verde de texto foi escurecido em relação à ilustração para contraste. Sem alterar regras de negócio ou usar o símbolo de confirmação como certificação regulatória.

Verificação: build, TypeScript e 14 testes Node; revisão desktop/mobile 390/320 px. Paleta, origem e evidências em [Identidade](identidade-oferta-re.md). Revisar após feedback do autor e testes com usuários. A direção anterior permanece como histórico, sem substituir os registros de decisões anteriores.

## DEC-020 — SaaS por empresa com setores compartilhados

Data: 08/10/2026. Estado: escolhido pelo autor; estrutura implementada. Empresa corresponde ao tenant e futura unidade de contratação. Login é individual, papéis ficam na empresa e uma pessoa pode participar de vários setores. Após pergunta explícita, o autor escolheu compartilhar contatos/modelos/ofertas na empresa, organizados por setor. Treaty/Soluções Estruturadas e setores facultativos são classificações internas, sem criar tenants separados.

Setor responsável é opcional para manter compatibilidade. Isolamento entre empresas permanece em RLS e chaves compostas. Convites têm e-mail confirmado, token com hash, expiração/uso único e revogação; não há inclusão por domínio nem envio automático. Cobrança não foi definida/implementada. Critério de revisão: piloto com empresas reais, necessidade futura de restrição interna, volume e modelo comercial. [Modelo e limites](saas-empresas-e-setores.md).

## DEC-021 — Formulário de ativação progressiva

Data: 08/10/2026. Estado: aprovado pelo autor (“gostei, pode implementar”) e implementado. O autor pediu campos para a empresa preencher ao contratar. Proposta: aproveitar dados de contratação/cadastro, iniciar com empresa/responsável e estrutura operacional, e deixar equipe/contatos/modelos para configuração posterior. Áreas, setores e linhas são conceitos distintos; setor/linha deve permitir relação de vários para vários. Perguntas de volume e diagnóstico ficam opcionais para o piloto. [Campos e critérios](formulario-de-ativacao.md).


Implementação da DEC-021: quatro etapas com rotina opcional, salvamento explícito antes de avançar, revisão e checklist posterior. Perfil comercial restrito a owner/admin; setores e linhas compartilhados na empresa. Revisão otimista evita sobrescrita simultânea e RPC grava atomicamente. Campos CNPJ/site/financeiro não bloqueiam acesso e não ativam cobrança. Preferências de e-mail não conectam Outlook. Critério de revisão: tempo até primeira operação, abandono por etapa e entrevistas de piloto. Dados de clientes usados em pesquisa exigirão tratamento próprio e anonimização; o diário documenta decisões de construção, não divulga respostas privadas.

## DEC-022 — Navegação identificável e ajuda contextual

Data: 08/10/2026. Estado: solicitado pelo autor e implementado. Ícones da lateral mostram o destino por hover/foco; explicações curtas esclarecem termos e ações ambíguas. Tooltips usam Base UI com portal, nomes acessíveis, descrição associada e fechamento por Escape. Informações necessárias à operação permanecem no texto da tela. Não adicionar tooltips repetindo todos os rótulos já claros. Revisar com feedback de usuários e uso por teclado.


## DEC-023 — Evidências de respostas e rastreio Outlook

Data: 08/10/2026. Estado: requisito de negócio e tipo de caixa confirmados; correlação local implementada. Microsoft Graph delegado é recomendação técnica para integração futura, ainda sem conexão autorizada. O corretor envia manualmente pelo Outlook; qualquer resposta do mercado precisa ser preservada para auditoria. Assunto isolado é busca/sugestão, não chave suficiente de versão/destinatário. Usar pai da resposta, código opcional e conversa/remetente, encaminhando conflitos à revisão. Captura MIME e classificação humana são etapas distintas. [Plano, fontes e limites](rastreio-outlook-e-respostas.md).

Power Automate fica como alternativa de piloto no tenant do cliente. Python é viável via Graph; a arquitetura atual também suporta implementar em TypeScript, sem outro backend obrigatório. Escolha final de conector/job, consentimento e política de retenção exige prova de conceito com caixa de teste autorizada. Sem e-mails corporativos coletados nesta rodada.


## DEC-024 — Portal de propostas e renovações como produto principal

Data: 08/10/2026. Estado: solicitado pelo autor e implementado nesta primeira ampliação. Proposta passa a ser o processo completo de novo negócio/renovação; oferta é a comunicação versionada com o mercado. O cadastro do processo não exige contatos nem e-mail. Renovação cria um novo registro ligado ao anterior, preservando condições, envios e respostas. Catálogo SUSEP é apoio à operação, não o único centro comercial do produto.

Entregues página inicial, carteira/lista/pipeline, dados de vigência/prazo/linha/setor, acompanhamento com revisão e motivo de encerramento, renovação vinculada, histórico e versões de oferta no processo. Papéis/compartilhamento por empresa foram preservados. Registros legados encerrados não viram colocação bem-sucedida. Novas respostas exigem comprovante efetivamente recebido; classificação não conclui o negócio. [Implementação e próximos passos](portal-propostas-e-renovacoes.md).

Enviar/rascunhar e capturar respostas automaticamente pelo Outlook continua dependente da conexão Microsoft 365 autorizada. Condições estruturadas, responsabilidades por pessoa, alertas, exportação de auditoria e cobrança são evoluções explicitadas. Critério de revisão: tempo até primeira oferta, recuperação de histórico, renovação assistida e feedback de piloto. Não ampliar para seguros diretos sem nova decisão do autor.


## 10/10/2026 — Repositório próprio para Oferta Re

A pedido do autor, migrar a branch e os artefatos do produto para `vicTmm/oferta-re`, preservando o histórico. Separar aplicação, Supabase e documentação do coletor Python, que permanece na origem. Manter a branch original como segurança, sem alterar a main da origem. Detalhes em [migração do repositório](migracao-repositorio.md).

## DEC-025 — Preservar acesso existente e adicionar recuperação de senha (11/10/2026)

O autor autorizou concluir a conexão real com Supabase e escolheu usar a conta existente da DEV INFOTECH; informou não lembrar a senha. Preservar usuário, empresa e dados, usando o fluxo oficial de recuperação por e-mail. A senha é definida no aplicativo, sem alteração direta de `auth.users` e sem solicitar credenciais na conversa. Usar URL/chave publicável local e manter o mock independente. A autenticação já existente no MCP autoriza administração técnica, mas não equivale à sessão de usuário no aplicativo.
