# Rastreio de ofertas e respostas no Outlook

Data: 08/10/2026. Requisito confirmado pelo autor: o corretor envia a oferta, resseguradoras respondem com recusa, dúvida ou aceite, e a resposta precisa ser arquivada para auditoria. Caixa informada: **Microsoft 365, conta individual**.

Estado: regra de correlação implementada e testada com metadados sintéticos; arquitetura de conexão e arquivamento automático proposta. **Nenhuma caixa foi conectada ou lida.** Não há sincronização Graph ativa, OAuth de e-mail nem Power Automate configurado. A preferência Microsoft 365 não constitui autorização para importar mensagens corporativas.

## Fluxo de negócio

1. Preparar oferta/versão/destinatários. Um rascunho ainda não é envio.
2. Corretor revisa e envia pelo Outlook. Registrar a mensagem realmente enviada, seus destinatários, horário, assunto final e identificadores; a prévia do app não substitui essa evidência.
3. Registrar cada resposta e os follow-ups da conversa, sem sobrescrever os anteriores. Dúvida pode preceder negativa ou aceite e a empresa pode responder por outro contato.
4. Associar operação → oferta → versão → destinatário/resseguradora → mensagem. Uma conversa pode conter várias versões; identidade de conversa não resolve sozinha a versão correta.
5. Arquivar a representação MIME disponibilizada pelo Microsoft 365 em `.eml`, preservando conteúdo, cabeçalhos e anexos que estiverem disponíveis. Guardar horário da mensagem, horário de captura, origem/conexão, identificadores, tamanho e hash dos bytes recuperados. Um PDF pode ser uma prévia adicional, não substitui essa captura.
6. Classificar como dúvida/pedido de informações, negativa, aceite parcial/total, outro ou a confirmar. Capturar arquivo não significa reconhecer aceite. Classificação inicial automática: a confirmar; corretor revisa. Mensagens automáticas, ausência temporária e falhas de entrega não contam como aceite/recusa do mercado.
7. Exibir linha do tempo e pendências, com recuperação do arquivo privado. Arquivo indisponível, protegido ou falha de download fica como pendência explícita; nunca indicar arquivamento concluído apenas por criar metadados.

A classificação “aceite” é um registro operacional, sem inferência automática de celebração do contrato, participação percentual ou conformidade regulatória. Nenhum cálculo de obrigação legal/multa é alterado nesta etapa.

### Ajustes necessários ao fluxo manual existente

O projeto já tem `offer_recipients`, `documents`, `responses`, Storage privado e classificação manual. A criação de respostas ainda permite documento opcional. Para aplicar integralmente o requisito confirmado, distinguir **nota/pendência operacional** de **resposta arquivada** e exigir arquivo efetivamente recebido para a segunda. Hoje o hash vem do navegador: o pipeline automático deverá calcular/verificar no servidor os bytes baixados antes de concluir arquivamento. Essa mudança ainda não foi aplicada ao banco/UI nesta rodada.

## Por que assunto não deve ser a única chave

Assuntos podem repetir em renovações, receber RE/RES/FW/ENC, ser alterados pelo mercado ou reunir várias ofertas. Remover prefixos ajuda a buscar, mas não transforma o assunto em identificador único.

Proposta de identificador visível, ainda não inserido nos assuntos do produto: `[OR-2026-001-V1-R01] Oferta patrimonial`. O código deve ser registrado e único no contexto da empresa/versão/destinatário; formato definitivo será definido na integração. Código não é senha nem prova de autenticidade. Se a corretora não quiser mudar os assuntos, a integração ainda pode usar cabeçalhos/conversa, com mais associações para revisão.

Prioridade do núcleo implementado:

- `In-Reply-To` ligado a um Message-ID já registrado: identifica o pai imediato.
- Token completo registrado no assunto, sem busca por substring.
- `conversationId`, somente se houver um destinatário/versão candidato no contexto.
- Assunto normalizado + remetente conhecido: **sugestão para revisão**.
- Referências indiretas, contato desconhecido, resposta automática, conflito entre sinais e vários candidatos: revisão. Não escolher silenciosamente a primeira oferta.

A associação considera empresa, conexão/caixa, horário do envio e remetentes autorizados conhecidos. Os identificadores da organização e caixa devem vir da conexão autenticada no servidor; o e-mail não decide a empresa. Cabeçalhos e endereço remetente são sinais de correlação, não comprovação criptográfica de origem.

Código: `web/src/lib/email-tracking.ts`. É uma função pura, sem chamadas de rede, escrita no banco ou classificação de conteúdo. Não está conectada às telas ou a um job de produção. Adapter futuro deverá extrair corretamente cabeçalhos `In-Reply-To`/`References`, incluindo cadeias e dobramento de linhas, e registrar IDs das respostas aprovadas.

## Integração recomendada para o SaaS

**Microsoft Graph com autorização delegada da conta individual.** OAuth liga uma caixa autorizada a uma empresa do Oferta Re. Para ler conteúdo/arquivar mensagens, avaliar `Mail.Read` e renovação com `offline_access`; não pedir `Mail.Send` ou `Mail.ReadWrite` para esta funcionalidade de leitura. Políticas do tenant podem exigir consentimento do administrador mesmo no modo delegado. OAuth Microsoft é independente do login Supabase.

A permissão de leitura é mais ampla que “e-mails com este assunto”: o filtro de ingestão do produto não reduz o escopo concedido pela Microsoft. Informar isso na conexão, delimitar caixas/pastas acompanhadas e importar somente mensagens relacionadas às operações registradas. Nunca guardar tokens em tabelas acessíveis ao navegador; armazenar/renovar somente no servidor, com criptografia e isolamento por conexão/empresa. Desconectar interrompe sincronização, sem apagar automaticamente comprovantes já arquivados.

Python consegue consumir Graph por HTTP/SDK. Na arquitetura atual, a primeira integração pode usar TypeScript junto ao backend do web app e um worker/job agendado para sincronização. Um processo Python separado é uma alternativa caso haja necessidade própria de processamento; não é requisito para ler Outlook. Evitar depender de automação do aplicativo desktop e de um computador Windows sempre ligado.

### Sincronização e confiabilidade

- Começar com consultas incrementais `delta` nas pastas relevantes, incluindo Itens Enviados e respostas. Delta é por pasta: regras que movem mensagens exigem acompanhar também as pastas de destino. Permitir escolher janela inicial e pastas, sem importar histórico completo por padrão.
- Persistir cursor por conexão/pasta somente depois de arquivar/processar todos os itens pertinentes da página. Paginação, retries, falhas parciais, expiração de sessão, throttling/Retry-After e reconciliação são parte do fluxo.
- Adotar IDs imutáveis Graph para a chave local da mensagem. O ID comum muda ao mover a mensagem; o imutável permanece dentro da mesma caixa, com exceções documentadas para mudança de caixa/arquivo. Guardar também Internet Message-ID, conversationId e cabeçalhos.
- Chave de deduplicação por conexão/caixa e ID imutável, com proteção de duplicatas de evidência por identidade/hash. Repetir job não deve duplicar resposta. Mover/apagar no Outlook não apaga o arquivo já capturado no app.
- Webhooks podem reduzir a latência em evolução posterior; exigem endpoint público validado, renovação de assinatura e reconciliação. Não prometer que uma notificação equivale a arquivo já preservado.
- Inicialmente mensagens ambíguas são sugestões a revisar, sem captura automática indiscriminada de correspondência fora do escopo. Definir tratamento de mensagem anterior à sincronização, novos contatos de uma resseguradora, cadeias encaminhadas e respostas em caixas não conectadas.
- MIME maior que 25 MiB excede o limite atual do bucket. Registrar pendência, sem truncar arquivo silenciosamente; aumentar limite depende de decisão de armazenamento e custos. Mensagens protegidas/criptografadas precisam de comportamento validado na caixa do piloto.

### Persistência a implementar

Conexões autorizadas por empresa/usuário, identidade de caixa/pastas, estado de sessão/sincronização, cursores, mensagens recebidas/enviadas, vínculos com versão/destinatário, candidatos de revisão, jobs/tentativas e recibos de arquivamento. Todos com RLS/vínculos da mesma empresa; tokens em armazenamento de servidor separado. Classificações/correções precisam de histórico sem reescrever evidências. Nenhuma tabela de integração foi criada nesta rodada.

## Alternativa Power Automate para piloto

Fluxo dentro do tenant do cliente: gatilho “When a new email arrives (V3)” → verificar código/conversa → obter/exportar mensagem em EML → encaminhar a um endpoint autenticado de ingestão privada do Oferta Re → guardar recibo/falha e retentar. Para exportar existe “Export email (V2)”. A conexão e o consentimento ficam no tenant do cliente, mas transferir ao SaaS continua dependendo da autorização de uso e armazenamento.

É uma boa prova de conceito, pois o cliente pode conhecer a ferramenta. Como solução padrão de vários clientes, precisa validar implantação/manutenção por tenant, licenças das ações usadas, conexão expirada, limites de tamanho e mensagens protegidas. O conector pode omitir mensagens grandes/protegidas; portanto também precisa de reconciliação. Não usar a Edge Function `ingest-susep`, que foi criada exclusivamente para o catálogo público, para ingestão de e-mails privados.

## Plano e critérios de aceite

1. **Concluído:** confirmar Microsoft 365 individual, documentar negócio e riscos de correlação, implementar núcleo local com testes sintéticos.
2. Registrar app Microsoft/Entra e escolher conta de teste autorizada; definir conexão por empresa, consentimento e armazenamento de tokens. Não usar mensagens/contatos da empresa anterior.
3. Implementar OAuth e leitura inicial de metadados/envios, seleção de pastas, cursor e marcador opcional.
4. Capturar `.eml` em Storage privado com checksum calculado no servidor, deduplicação e confirmação de upload. Exigir evidência para “resposta arquivada”.
5. Criar timeline por versão/mercado e fila de associações a revisar; classificação humana e histórico.
6. Testar envio manual no Outlook, resposta negativa/dúvida/aceite, assunto alterado, novo contato, duas versões na conversa, mensagem movida, duplicatas, falha/retry, mensagens grandes/protegidas e isolamento entre empresas. Ofertas e mensagens são sintéticas no primeiro ensaio.
7. Homologar política de retenção/backup/exportação e, se necessário, webhook e piloto autorizado. Arquivo deve continuar recuperável após desconexão ou remoção da mensagem de origem, conforme política acordada.

## Fontes técnicas consultadas

- [Recurso message, conversa, Internet Message-ID e cabeçalhos](https://learn.microsoft.com/en-us/graph/api/resources/message?view=graph-rest-1.0).
- [Conteúdo MIME por `$value`](https://learn.microsoft.com/en-us/graph/outlook-get-mime-message).
- [Delta de mensagens por pasta](https://learn.microsoft.com/en-us/graph/api/message-delta?view=graph-rest-1.0).
- [Identificadores imutáveis e suas condições](https://learn.microsoft.com/en-us/graph/outlook-immutable-id).
- [Conector Office 365 Outlook: gatilhos, Export email V2 e limitações](https://learn.microsoft.com/en-us/connectors/office365/).
- [Notificações de mudanças de mensagens](https://learn.microsoft.com/en-us/graph/outlook-change-notifications-overview).
- [Referência de permissões Graph](https://learn.microsoft.com/en-us/graph/permissions-reference).

## Verificação desta rodada

Seis testes de correlação passaram, junto aos 22 testes anteriores (28 Node no total). Cobrem mudança de assunto, versão precisa por pai imediato, token completo, horário, conflito entre sinais, conversa ambígua, contato desconhecido, mensagens automáticas, sugestão por assunto/referência indireta e isolamento por empresa/caixa. A conexão autenticada, captura MIME e recuperação no Storage ainda precisam dos testes de integração planejados; nenhuma automação de e-mail foi ativada.


## Atualização após reposicionamento do portal

A ampliação [Portal de propostas e renovações](portal-propostas-e-renovacoes.md) implementou a regra de evidência para novas respostas manuais: documento ligado ao destinatário, tipo resposta e objeto recebido no bucket privado. Classificações/correções entram no histórico da proposta; registros anteriores sem arquivo foram preservados como pendências. A menção acima ao ajuste ainda pendente descreve o estado da rodada anterior. OAuth Microsoft, sincronização, captura MIME e cálculo independente de hash no servidor continuam planejados.
