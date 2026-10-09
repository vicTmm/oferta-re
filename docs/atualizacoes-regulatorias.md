# Atualizações regulatórias e multas

Data: 08/10/2026. Requisito solicitado pelo autor; funcionalidade ainda não implementada.

## Objetivo

Disponibilizar uma área para acompanhar notícias e mudanças normativas relacionadas à oferta de resseguro e às sanções por descumprimento, incluindo valores de multa. Associar notícias às referências legais, preservando histórico de alterações.

## Interface proposta

Seção Atualizações regulatórias, com filtros por assunto e estado: notícia, consulta pública, norma publicada, vigente, alterada ou revogada. Estado de notícia e estado da norma são campos separados: uma notícia pode comentar uma norma vigente ou uma proposta.

No resumo, mostrar a última atualização verificada sobre multas, a fonte e a data da revisão. Usar estado "Enquadramento pendente de revisão" quando a informação disponível não permitir apresentar uma faixa aplicável com segurança. Evitar um número isolado rotulado como "multa atual".

Cada item terá título, resumo factual, fonte oficial e link, data de publicação, data de consulta, assunto, norma/artigo relacionado e responsável pela revisão. Quando aplicável, incluir data de início de vigência e referência à alteração ou revogação. Permitir abrir o texto original.

Para multa: registrar infração descrita, sujeito ao qual a regra se aplica, faixa/critério de cálculo, moeda, tratamento de reincidência, vigência e fonte. Valores históricos permanecem identificados como históricos. Uma notícia sobre alteração não substitui automaticamente a regra exibida.

## Publicação e acompanhamento

Primeiro MVP: cadastro e revisão manual de links oficiais. A área pode ser útil sem automação de notícias. Priorizar SUSEP, Diário Oficial da União e legislação oficial do Planalto. Artigos de terceiros podem complementar contexto, identificados como análise, sem substituir a fonte normativa.

Evolução: coleta periódica de novas publicações, deduplicação e fila de revisão. Publicação de resumos e alteração da ficha de multa dependem de revisão. Registrar última busca realizada, última revisão e falha de atualização como informações distintas. Não afirmar cobertura completa de mudanças legais apenas porque a rotina automática foi executada.

Alertas de novidades serão uma preferência separada dos alertas cadastrais. Notícia, proposta e vigência devem continuar distinguíveis na mensagem.

## Relação com os contratos

A ficha de referência normativa usada em uma operação terá versão e data. Uma mudança futura não reescreve a referência histórica de uma oferta. Se houver regra de transição, registrar sua aplicação para revisão responsável; o sistema não conclui automaticamente que todo contrato anterior usa a regra nova.

## Critérios de aceite

- Usuário identifica fonte, artigo, data de revisão e estado da norma associada a uma informação sobre multa.
- Consulta pública não aparece como regra vigente.
- Atualização preserva versões anteriores e as referências usadas nas operações.
- Faixa sem enquadramento validado recebe indicação de pendência; não gera cálculo automático ou conclusão de infração.
- Notícias duplicadas não geram alertas repetidos; falha de coleta não aparece como ausência comprovada de novidades.

## Complemento para o Stitch

```text
Adicione Atualizações regulatórias à navegação. Apresente notícias e normas sobre oferta de resseguro e multas, com título, resumo, fonte oficial, publicação, última revisão e link original. Inclua filtros por assunto e estado. Distinga notícia de consulta pública e norma publicada de norma vigente.

Inclua uma ficha Referência sobre multas com infração, faixa ou critério, reincidência, artigo, vigência e data de revisão. Quando a aplicação não tiver sido revisada, mostrar Enquadramento pendente de revisão. Não apresentar um número isolado como multa atual. Mostrar histórico de alterações e preferência para avisos de novidades. Usar conteúdo fictício identificado como demonstração no protótipo.
```

## Registro para o TCC

Avaliar se usuários distinguem proposta, vigência e informação histórica; medir capacidade de localizar a fonte original. Registrar critérios de seleção das fontes e limites da cobertura. O requisito decorre do pedido do autor, não de uma implementação já concluída.
