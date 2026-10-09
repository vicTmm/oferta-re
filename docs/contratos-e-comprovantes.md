# Contratos e comprovantes de respostas

Atualização: 08/10/2026. Rotina e restrições confirmadas pelo autor; implementação proposta.

## Evidência da rotina atual

Os comprovantes de respostas são baixados manualmente e guardados na pasta de rede referente ao contrato. O autor sugeriu reunir esses documentos no web app.

A base de contatos da empresa está fora do projeto. O autor mudou de time e perdeu acesso; mesmo com acesso, a retirada do computador corporativo causaria problema com compliance. Não solicitar essa base, copiar mensagens ou anexos corporativos nem propor contornar a restrição. Desenvolvimento e demonstrações usam dados fictícios. Clientes futuros poderão fornecer dados que estejam autorizados a utilizar no serviço.

## Escopo proposto

Cada contrato terá um espaço de trabalho com referência, cedente, responsável, ofertas relacionadas e documentos. Antes de haver contratação, permitir uma referência provisória de operação, sem tratar uma oferta como contrato já celebrado.

O upload manual de comprovantes entra no MVP. Integração automática com a caixa de entrada permanece uma evolução opcional. A ferramenta pode reunir a preparação e os documentos sem depender da importação de e-mails corporativos durante o desenvolvimento.

No detalhe da operação/contrato:

- Ofertas e versões de termos/anexos.
- Empresas destinatárias e contatos usados em cada versão.
- Comprovantes de envio e respostas anexadas manualmente.
- Registro estruturado de resposta e pendências.
- Linha do tempo de uploads, classificações e revisões.
- Download dos arquivos originais e exportação de um pacote com índice.

## Registro de comprovante

Campos propostos: organização, contrato/operação, oferta e versão relacionada, resseguradora, tipo de documento, arquivo original, data da mensagem/resposta, data de upload, usuário que anexou e observação. A data da mensagem deve ser distinta da data do upload. Quando o arquivo não demonstrar uma informação, permitir estado a confirmar.

Classificações: envio, resposta, pedido de informações, recusa, aceite parcial/total e outro documento. A classificação feita pelo usuário não substitui o conteúdo do arquivo. Vincular a parcela aceita somente quando houver evidência e base de cálculo clara.

Preservar o original; correções de classificação não reescrevem o arquivo. Um hash ajuda a detectar duplicatas e mudanças de bytes, mas não autentica a origem nem comprova validade jurídica. Não inferir ausência de resposta simplesmente porque nenhum comprovante foi anexado.

## Armazenamento e acesso

Usar armazenamento privado de arquivos e metadados no banco. Validar autorização da organização em cada upload, prévia, download e exportação. Não armazenar documentos de produção em Git público ou URLs públicas permanentes.

Definir formatos aceitos, limites de tamanho, tratamento de arquivos potencialmente maliciosos, backup/restauração e política de retenção/exclusão conforme os requisitos dos clientes. Não renderizar HTML ativo de mensagens diretamente no navegador. A prévia pode ser limitada a formatos seguros; manter download do original quando permitido.

Um piloto com documentos reais depende de a organização autorizar o uso no serviço e aprovar a forma de armazenamento. Essa restrição não impede construir e avaliar o fluxo com documentos sintéticos.

## Critérios de aceite

1. Usuário localiza um contrato/operação e anexa uma resposta à oferta, versão e resseguradora corretas.
2. Usuário recupera o original e identifica quem anexou, quando e qual data de resposta foi registrada.
3. Documento sem vínculo claro aparece como pendência; upload não altera automaticamente a oferta para aceita ou concluída.
4. Organização A não acessa arquivos de B, inclusive por URL direta ou exportação.
5. Exportação contém originais e índice de versões, respostas e pendências; distingue fatos documentados de registros manuais.
6. Restauração recupera arquivos e seus vínculos. Testes usam documentos fictícios identificados como demonstração.

## Complemento para o Stitch

```text
Adicione uma área Contratos e operações. Antes da contratação, use referência provisória de operação. No detalhe, apresente Ofertas, Documentos e respostas e Histórico.

Em Documentos e respostas, permita upload manual de comprovantes e vínculo com resseguradora, oferta e versão. Exiba tipo de resposta, data da mensagem, data do upload e responsável. Diferencie Aceite registrado de documento sem classificação. Ofereça download do original e Exportar pacote com índice. Mostre documentos sem vínculo como pendências.

Inclua estados de upload em andamento, falha, duplicata provável, formato não aceito e documento a confirmar. Upload não significa aceite automático. Use contratos, contatos e comprovantes fictícios identificados como demonstração.
```

## Avaliação para o TCC

Comparar o tempo e os erros para guardar e recuperar comprovantes na estrutura de pastas e no protótipo. Usar conjuntos fictícios equivalentes. Medir se o participante encontra a resposta correta para uma versão da oferta e identifica documentos ausentes. Não usar informações da empresa anterior.

## Atualização: respostas recebidas pelo Outlook

O autor confirmou Microsoft 365 com conta individual e o arquivamento das respostas de mercado (dúvida, recusa ou aceite) como requisito. Correlação por assunto será complementada por identificadores da mensagem/conversa, com revisão de ambiguidades. [Regra implementada e integração proposta](rastreio-outlook-e-respostas.md). Arquivamento automático ainda não está conectado; o fluxo manual continua disponível e precisará distinguir registro sem arquivo de resposta efetivamente arquivada.
