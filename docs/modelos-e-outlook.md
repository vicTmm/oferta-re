# Modelos de oferta e rascunhos no Outlook

Atualização: 08/10/2026. Processo atual informado pelo autor; requisitos e solução técnica propostos.

## Processo atual confirmado

Uma macro abre um formulário. O autor seleciona empresas e anexos; a macro prepara os rascunhos no Outlook. Ele revisa texto e formatação e envia manualmente. O texto é padrão entre destinatários e é escrito pelo próprio autor, com base em mensagens enviadas anteriormente.

O autor sugeriu que cada corretora crie seus modelos, com uma experiência semelhante à edição de assinaturas do Outlook. Isso não significa que a ferramenta precise acessar automaticamente a assinatura já configurada no Outlook.

## Escopo inicial

Preservar a revisão e o envio manual. O objetivo inicial é preparar rascunhos a partir de contatos organizados e modelos reutilizáveis. Integração para criação de rascunhos deve ser avaliada cedo, pois faz parte da rotina atual; envio automático e leitura de respostas podem vir depois.

Modelo, oferta e rascunho são objetos distintos. O modelo é reutilizável, a oferta reúne dados e documentos de uma operação e o rascunho representa a mensagem preparada para uma empresa destinatária. Confirmar se hoje há um rascunho por empresa e quais contatos entram em Para/Cc.

## Editor de modelos

- Biblioteca privada da corretora com nome, finalidade, assunto, corpo, autor, versão e estado ativo/arquivado.
- Editor visual com parágrafos, negrito, listas, links e tabelas simples. Permitir partir de um texto colado pelo usuário, sem depender de acesso ao histórico da caixa postal.
- Campos opcionais como `{{referencia}}`, `{{cedente}}`, `{{ramo}}` e `{{vigencia}}`. Usar dados estruturados da oferta; bloquear geração quando um campo necessário estiver vazio.
- Assinatura como bloco separado: nome, cargo, contato e identidade visual. Escolher entre inseri-la no produto ou usar a assinatura no Outlook, conforme comportamento validado. Evitar duplicação.
- Prévia e edição de uma cópia para a oferta atual. Editar uma oferta não altera o modelo compartilhado; salvar como modelo é uma ação explícita.
- Preservar a versão do modelo e o corpo efetivamente gerado. Alterar o modelo depois não reescreve rascunhos ou evidências anteriores.

O conteúdo padrão pode permanecer idêntico para todas as empresas selecionadas. Personalização por destinatário será opcional. IA para escrever mensagens não é necessária para o MVP.

## Preparação do lote

Fluxo: escolher modelo, preencher oferta, selecionar empresas/contatos, anexar documentos, revisar prévia e criar rascunhos no Outlook.

Mostrar resultado por empresa: rascunho criado, falha ou pendência. Uma nova tentativa deve tratar apenas itens pendentes, sem recriar os já confirmados. Falhas ambíguas precisam de reconciliação antes de repetir uma criação. Usar identificador de oferta, versão e destinatário para acompanhar o lote.

Arquivos precisam ter prévia de nome, tamanho e associação à oferta. Não usar `mailto:` como solução principal: ele não cobre o fluxo completo de anexos e criação persistida de um lote.

Texto da ação: "Criar rascunhos no Outlook". Feedback: "Rascunhos criados. Revise e envie pelo Outlook." Criar rascunhos não altera o estado da oferta para enviada.

## Integração técnica a investigar

Para conta compatível, Microsoft Graph permite criar uma mensagem em Rascunhos, inclusive com anexos, com permissão delegada `Mail.ReadWrite`. O envio é uma operação distinta. A criação de rascunhos não exige solicitar `Mail.Send`. A permissão de leitura/escrita ainda é ampla e depende das políticas de autorização do cliente. [Documentação Microsoft](https://learn.microsoft.com/en-us/graph/api/user-post-messages).

Usar Outlook não comprova que a conta seja Microsoft 365/Exchange Online. Confirmar provedor da caixa, Outlook clássico/novo/web e possibilidade de autorizar a integração. Fazer prova de conceito antes de escolher Graph como dependência do produto.

Um add-in é outra alternativa: a API do Outlook pode abrir um formulário de composição com destinatários, assunto, HTML e anexos. Sua compatibilidade e limites precisam ser avaliados no cliente utilizado; abrir composição é diferente de criar um lote persistido em Rascunhos. [Documentação Microsoft](https://learn.microsoft.com/javascript/api/outlook/office.mailbox).

Não presumir inserção automática da assinatura do Outlook em mensagens criadas por Graph. Verificar na prova de conceito e definir a estratégia de assinatura. Também verificar logos/imagens incorporadas, quebras de linha, tabelas, acentos e anexos representativos. Prévia no navegador não garante aparência idêntica no Outlook.

## Critérios de aceite

1. Usuário cria e reutiliza um modelo sem copiar uma mensagem antiga a cada oferta.
2. Editar o texto de uma oferta preserva o modelo e mensagens já geradas.
3. Corpo, assunto, destinatários e anexos conferem com a prévia e não contêm placeholders pendentes.
4. Rascunhos aparecem na caixa correta, sem envio automático e sem assinatura duplicada.
5. Falha parcial e repetição não geram rascunhos duplicados ou confirmação falsa de sucesso.
6. Formatação é verificada no Outlook utilizado pelo piloto; contatos, templates e anexos permanecem privados da organização.

O corpo gerado no produto pode ser alterado manualmente no Outlook. Portanto, a evidência final precisa vir da mensagem efetivamente enviada; a prévia inicial não representa necessariamente o texto final.

## Complemento para o Stitch

```text
Inclua Biblioteca de modelos privada da corretora. A experiência de edição deve ser familiar para quem configura uma assinatura de e-mail: nome do modelo, assunto, editor visual, bloco de assinatura e prévia. Permita inserir campos da oferta e duplicar modelos. Diferencie Editar esta oferta de Salvar como modelo.

No assistente de oferta, use as etapas Modelo, Dados, Empresas e contatos, Anexos e Revisão. O mesmo texto padrão pode ser aplicado ao lote. A ação final é Criar rascunhos no Outlook. Mostre resultado por empresa e falhas parciais. Não exiba mensagens como enviadas após criação dos rascunhos. Feedback: Rascunhos criados. Revise e envie pelo Outlook.

Representar integração Outlook como protótipo até implementação e validação. Incluir estados de campo vazio, anexo ausente, conta desconectada e criação parcial. Dados de demonstração devem estar identificados.
```

Pendências: tipo de conta/cliente Outlook, política de integração, um rascunho por empresa ou outra distribuição, uso de Para/Cc e assinatura atual. A limitação de exportação de contatos ainda não foi esclarecida.
