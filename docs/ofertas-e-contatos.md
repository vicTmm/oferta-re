# Gestão de ofertas e contatos

Atualização: 08/10/2026. Este documento amplia o foco inicial e orienta a próxima revisão do produto. O relato operacional vem do autor; o escopo abaixo é proposto, sem implementação.

Complemento confirmado pelo autor: a macro atual cria rascunhos no Outlook, com texto padrão e envio manual após revisão. [Modelos e Outlook](modelos-e-outlook.md) detalha templates e antecipa a investigação da criação integrada de rascunhos. Envio automático não integra o primeiro MVP proposto.

## Rotina relatada e proposta de valor

O autor trabalha com uma planilha de resseguradoras e outra base de contatos em Excel. Precisa visitar portais de resseguradoras para procurar contatos novos e preparar ofertas usando também os endereços já conhecidos. Não consegue exportar a base atual; ainda é necessário esclarecer se a restrição é técnica ou organizacional. Nenhum contato da empresa foi extraído nesta análise.

Proposta: reunir consulta cadastral, contatos privados, preparação das ofertas e evidências do acompanhamento em um fluxo por operação. A unidade central do produto passa a ser a oferta de resseguro. O pipeline SUSEP fornece a referência de entidades e categorias.

Essa rotina pode gerar uso mais frequente que mudanças cadastrais. Medir ofertas preparadas, tempo por oferta, retrabalho com contatos e tempo necessário para reconstruir o histórico de uma operação. A disposição de pagar permanece uma hipótese.

## Referências regulatórias verificadas

Pesquisa inicial em fontes oficiais, em 08/10/2026. Não constitui especificação jurídica completa ou parecer sobre uma operação concreta.

- O art. 11 da [LC 126/2007](https://planalto.gov.br/ccivil_03/leis/lcp/lcp126.htm) estabelece referência de 40% da cessão de resseguro para contratação ou oferta preferencial a resseguradores locais. O denominador não é a quantidade de empresas destinatárias, nem sua participação de mercado. Categoria local também não deve ser inferida da nacionalidade dos acionistas.
- Os arts. 2º a 5º e 8º da [Circular SUSEP 683/2022](https://www2.susep.gov.br/safe/scripts/bnweb/bnmapi.exe?router=upload/26902) tratam de consulta formal, aceites/recusas, condições e envio efetivo. A geração de um texto não comprova envio. A seleção por especialidade comercial do contato não deve excluir silenciosamente entidades do universo de consulta exigível. A circular tem [alteração publicada em 2023](https://www2.susep.gov.br/safe/scripts/bnweb/bnmapi.exe?router=upload/27463); consolidar o texto antes de programar regras e prazos.
- O art. 79 do [texto consultado da CNSP 393/2020, consolidado em 2022](https://www2.susep.gov.br/safe/scripts/bnweb/bnmapi.exe?router=upload/26767) prevê R$ 150 mil a R$ 1 milhão para a infração descrita de não ofertar ou contratar no País o percentual exigível. Isso explica a lembrança do autor. Não usar essa faixa como teto geral atual: o art. 108 do [DL 73/1966 compilado](https://www.planalto.gov.br/ccivil_03/decreto-lei/del0073compilado.htm), alterado pela LC 213/2025, mudou o quadro legal das sanções. O enquadramento atual, a responsabilidade e a dosimetria precisam de validação específica.
- A [SUSEP anunciou consulta pública em 29/09/2026](https://www.gov.br/susep/pt-br/central-de-conteudos/noticias/2026/setembro/susep-coloca-em-consulta-publica-proposta-de-regulamentacao-dos-procedimentos-operacionais-de-resseguro) para atualizar procedimentos e informa entrada em vigor da CNSP 494/2026 em 02/01/2027. A minuta operacional ainda é proposta; não tratá-la como norma já vigente.

Consequência para o produto: regras com fonte, versão, vigência, escopo e validação responsável. Distinguir alerta operacional, checklist e conclusão jurídica. Não exibir "conforme" apenas porque um e-mail foi preparado ou porque 40% dos destinatários receberam a oferta. A obrigação descrita na fonte se refere à cedente/sociedade seguradora; a corretora pode executar atividades de intermediação. Registrar cedente e papel da corretora em cada operação.

## Estratégia para contatos

Recomendação: cada corretora importa uma base que esteja autorizada a utilizar, ou cadastra contatos manualmente. O produto pode começar com entidades públicas e um template vazio. A base profissional de uma corretora não se torna automaticamente um ativo compartilhável do fornecedor.

| Camada | Conteúdo | Acesso |
| --- | --- | --- |
| Cadastro público | Entidade, categoria SUSEP, identificadores, origem e coleta | Compartilhável no produto |
| Diretório público verificado, se criado | Canal institucional publicado, URL de origem e data de verificação | Compartilhável após validação da finalidade do canal |
| Base privada | Pessoa/equipe, e-mail, especialidade, observações e histórico | Apenas organização proprietária |
| Operação | Risco, termos, anexos, destinatários, respostas e evidências | Organização e usuários autorizados |

O e-mail cadastral da SUSEP ou um endereço encontrado no site não comprova que aquele é o destinatário apropriado para subscrição. Contatos por ramo, linha de negócio ou tipo de contrato exigem classificação própria; locais/admitidas/eventuais é uma classificação diferente.

Campos mínimos de contato: organização, entidade vinculada, equipe ou nome, e-mail, função/especialidade, ramos, preferência por tipo de contrato, fonte, data de verificação, responsável e estado ativo/a confirmar/inativo. Permitir múltiplos contatos por entidade e ramo, além de endereços funcionais.

Importação XLSX/CSV: prévia, mapeamento de colunas, preservação dos identificadores como texto, detecção de duplicatas, erros por linha e confirmação antes de persistir. Mostrar vínculos não resolvidos para revisão. Oferecer exportação da base da própria organização para facilitar manutenção e migração.

Não coletar contatos em portais como primeira dependência do MVP. Uma fase futura pode sugerir mudanças de canais institucionais com evidência da fonte e revisão humana. Um portal que exige autenticação não deve ser presumido como fonte pública.

## Fluxo proposto

1. Cadastrar a operação: cedente, referência, ramo, tipo de contrato, vigência e responsável.
2. Registrar termos e anexos em uma versão. Cada alteração posterior gera uma versão relacionada à anterior.
3. Conferir o universo de entidades e selecionar destinatários, com ajuda da base privada. Mostrar entidades sem contato verificado e registrar justificativas para seleção/exclusão.
4. Gerar e-mails por template, com campos preenchidos e prévia individual. Bloquear placeholders sem valor e anexos faltantes. Usar dados estruturados para fatos; IA é opcional para redação, sem inventar termos.
5. Revisar destinatários e conteúdo. No primeiro MVP, exportar rascunhos; registrar explicitamente que rascunho não foi enviado.
6. Vincular evidências do envio externo. Na integração futura, enviar pela conta corporativa escolhida e guardar resultado por destinatário.
7. Registrar respostas: pedido de informação, recusa, aceitação parcial/total e parcela aceita. Separar participação ofertada, aceita e efetivamente contratada, com base de cálculo consistente e referência à versão.
8. Exportar dossiê com conteúdo e anexos de cada versão, destinatários, envios, respostas, revisão e pendências.

Estados de transporte distintos: rascunho, envio solicitado, aceito pelo provedor, falha/devolução e evidência de entrega quando disponível. Aceitação pelo servidor de e-mail não prova leitura nem aceitação do risco. Estados de resposta são registrados separadamente.

Não converter silêncio automaticamente em aceitação ou recusa. O tratamento depende do procedimento aplicável, versão normativa e fatos da operação. Prazos precisam considerar calendário, fuso, marco inicial e eventos de suspensão/retomada validados.

## Implementação em fatias

### A: contatos e ofertas em rascunho

Manter as correções P0 do pipeline. Em seguida, priorizar base completa, importação de contatos e cadastro de ofertas, antes de assinatura automática e migração extensa de frontend.

Entregas: banco para contatos/operações, isolamento por organização, mapeamento XLSX/CSV, vínculos com entidades, templates e exportação de rascunhos. Dependência: esclarecer ambiente de e-mail e regra de exportação da empresa. Testar com base fictícia.

Aceite: importação não altera histórico sem confirmação; duplicatas e vínculos ambíguos aparecem na prévia; organização A não acessa contatos de B; rascunhos preservam termos/anexos e nunca aparecem como enviados.

### B: acompanhamento e dossiê

Entregas: upload ou vínculo de evidências, respostas estruturadas, versões, participações e exportação. Não exigir leitura automática da caixa de entrada nessa fase.

Aceite: um terceiro autorizado consegue reconstruir o que foi ofertado, a quem, quando e qual resposta está documentada. Reenvio e nova versão não apagam a anterior. Percentuais usam denominador explícito e não contam contatos como entidades ou mensagens como participações.

### C: integração de e-mail

Escolher integração após identificar Outlook/Microsoft 365, Gmail ou outra infraestrutura. Avaliar permissões e políticas do cliente. Implementar autorização, revisão de lote, controle de reenvio, evidência de envio, tratamento de falha e idempotência. Nenhuma mensagem será enviada nesta etapa de planejamento.

Aceite: repetição de uma tentativa não duplica mensagens; falha parcial fica visível; destinatários de uma oferta não recebem dados de outra; alterações de conteúdo exigem nova revisão. Integração não depende de copiar credenciais pessoais para arquivos.

## Oferta comercial revisada

Proposta de assinatura por organização para gestão de contatos, ofertas, histórico e colaboração. Implantação assistida pode incluir importação autorizada e configuração de templates. Marca própria continua opcional.

Uma consulta básica gratuita pode trazer usuários ao produto. Ofertas e contatos são candidatos mais fortes para cobrança recorrente; ainda precisam de validação. No piloto, comparar o tempo de uma oferta preparada no Excel/e-mail e no produto, incluindo revisão e recuperação de evidências.

## Adição ao prompt do Stitch

```text
Atualize o protótipo: a tela principal passa a ser Ofertas de resseguro. Mantenha Base de resseguradoras como referência cadastral. Adicione Contatos, Templates e Histórico de ofertas à navegação.

Tela Ofertas: referência, cedente, ramo, tipo de contrato, responsável, versão atual e pendências. Detalhe com etapas Dados da operação, Termos e anexos, Destinatários, Revisão, Envios e Respostas. Destacar entidades sem contato verificado. Não representar cobertura regulatória pela quantidade de contatos ou mensagens.

Tela Contatos: importar XLSX/CSV, mapear colunas, prévia, duplicatas, vínculo com resseguradora, ramo/especialidade, fonte e última verificação. Mostrar Base privada da organização. Permitir edição e exportação da própria base.

Compositor: template, campos estruturados, anexos e prévia por destinatário. Na primeira versão, ação Exportar rascunhos. Texto visível: Gerar um rascunho não envia a oferta. Telas de envio integrado devem ser identificadas como recurso futuro.

Histórico: versões dos termos, evidências por destinatário, pedidos de informação, recusas e participações aceitas/contratadas separadas. Mostrar denominadores dos percentuais. Botão Exportar dossiê. Não exibir Conformidade garantida. Use dados fictícios identificados como demonstração e padrões acessíveis compatíveis com shadcn/ui.
```

## TCC e dúvidas pendentes

Recorte adicional proposto: avaliar tempo, erros e rastreabilidade na preparação e acompanhamento de ofertas. Comparar planilhas/e-mail e produto com operações simuladas equivalentes; preservar sigilo de riscos, contatos e anexos reais.

Esclarecer: ambiente de e-mail, frequência/volume, classificação comercial dos destinatários, fluxo de respostas e evidências, motivo da impossibilidade de exportação e quem revisa as regras operacionais.
