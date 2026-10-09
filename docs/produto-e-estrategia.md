# Produto e estratégia comercial

Data: 08/10/2026. Estado: reposicionamento solicitado pelo autor; hipóteses comerciais ainda em validação.

## Direção atual: portal de propostas e renovações

O autor escolheu ampliar o SaaS para envio e controle de propostas/renovações. O produto principal passa a ser o ambiente operacional da corretora; consulta SUSEP e notícias regulatórias são módulos de apoio. [Escopo, entrega e próximos passos](portal-propostas-e-renovacoes.md).

Valor a validar: reduzir planilhas paralelas, cópia de textos, perda de contexto entre versões/mercados e trabalho para arquivar/recuperar respostas. A assinatura deve acompanhar esse uso operacional da empresa, sem depender de limitar consultas públicas. Nenhum preço, plano, cobrança ou resultado de piloto foi definido/ativado. Integração Outlook permanece uma etapa própria e ainda não envia mensagens.

## Histórico da estratégia inicial

Os registros abaixo explicam a origem do projeto e hipóteses anteriores; não substituem o posicionamento atual.

Atualização após relato do autor: [Gestão de ofertas e contatos](ofertas-e-contatos.md) amplia esta estratégia. A hipótese comercial prioritária passa a incluir contatos privados e preparação/acompanhamento de ofertas, mantendo consulta e monitoramento como base do produto.

## O que o produto entrega

O sistema coleta cadastros públicos de resseguradoras locais, admitidas e eventuais, padroniza campos, compara execuções e mantém snapshots e relatórios. GitHub Actions automatiza a rotina e Streamlit apresenta os resultados.

A proposta de valor sugerida é: "Acompanhe mudanças no cadastro de resseguradoras e mantenha o histórico das consultas da sua equipe."

A [SUSEP já oferece consulta pública de entidades licenciadas](https://www.gov.br/pt-br/servicos/consultar-entidades-licenciadas-pela-susep). Portanto, a assinatura precisa justificar conveniência, acompanhamento e evidências. O histórico começa na primeira coleta do projeto; ele não recupera automaticamente informações anteriores.

O produto registra o que estava disponível na fonte em cada coleta. Uma diferença entre snapshots não comprova, sozinha, um ato regulatório, cancelamento de licença ou a data exata em que uma mudança ocorreu. Para admitidos e eventuais, a SUSEP também descreve [atualizações cadastrais e alterações sujeitas a procedimentos próprios](https://www.gov.br/susep/pt-br/assuntos/informacoes-ao-mercado/licenciamentos/resseguradores-admitidos-e-eventuais).

## Dores e compradores possíveis

As dores abaixo são hipóteses, ainda sem entrevistas ou medição de tempo.

| Rotina | Dor | Entrega útil | Quem pode comprar |
| --- | --- | --- | --- |
| Consultar contrapartes | Abrir o site e localizar registros repetidamente | Busca por nome, CNPJ e tipo, com origem e horário da coleta | Operações de resseguro |
| Atualizar planilhas | Copiar dados e comparar versões manualmente | Exportação e comparação por campo | Coordenação operacional |
| Acompanhar mudanças | Só descobrir uma alteração na próxima consulta | Lista monitorada e alertas específicos | Corretora de resseguro ou seguradora |
| Evidenciar verificações | Dificuldade para reconstruir o que foi consultado | Snapshot, período comparado e registro de revisão | Controles internos/compliance |
| Trabalhar em equipe | Cada pessoa mantém sua própria versão | Carteira compartilhada e responsáveis pela revisão | Gestor da equipe |

Começar por corretoras de resseguro que tenham uma rotina recorrente de consulta. "Corretora" precisa ser especificado: uma corretora de seguros sem operação de resseguro pode não ter essa necessidade. O usuário diário, o responsável técnico e quem aprova o gasto podem ser pessoas diferentes.

O projeto ainda não avalia solvência, rating, capacidade de subscrição ou adequação de uma contratação. Essas possibilidades dependeriam de outras fontes e validação própria.

## Comparação das opções

| Modelo | Vantagem | Custo ou risco | Condição favorável |
| --- | --- | --- | --- |
| Instalação exclusiva por corretora | Mais liberdade para requisitos internos | Deploy, atualização e suporte por cliente; venda única pode financiar pouco suporte | Cliente paga implantação e manutenção |
| Serviço com marca por corretora | Personalização com evolução compartilhada | Precisa isolar dados privados e controlar configurações | Processo central semelhante entre clientes |
| Freemium com limite de buscas | Distribuição aberta e experimentação simples | Alternativa pública gratuita; cobrança pode não acompanhar o valor percebido | Demanda ampla e busca frequente comprovadas |
| Consulta gratuita e acompanhamento pago | Acesso facilita descoberta; cobrança acompanha trabalho recorrente | Precisa entregar alertas confiáveis e histórico útil | Equipes querem monitorar uma carteira |

Recomendação inicial: serviço B2B com um único código, implantação assistida e assinatura por organização. Logo, cores, nome e preferências entram em configuração. Uma instalação dedicada permanece uma oferta excepcional, com custo próprio. Uma licença entregue ao cliente deve esclarecer manutenção, atualização e responsabilidade operacional.

Depois dos pilotos, avaliar consulta pública gratuita, com assinatura para listas monitoradas, alertas, histórico ampliado, exportações e colaboração. Limites de requisição para operação e abuso podem existir independentemente dos limites comerciais.

## Ofertas para experimentar

| Oferta proposta | Conteúdo | Cobrança a validar |
| --- | --- | --- |
| Piloto assistido | Uma equipe, carteira escolhida, busca e relatório periódico; revisão semanal do uso | Valor fixo por período, com escopo definido |
| Equipe | Lista compartilhada, alertas por entidade/campo, histórico e exportação | Assinatura por organização, com faixas claras de uso |
| Marca própria | Logo, cores, domínio e onboarding | Implantação mais assinatura |
| Integração | API, exportação agendada ou conexão com controles existentes | Implantação mais recorrência conforme esforço |

Não há preço validado. Nas entrevistas, levantar horas gastas, frequência, número de pessoas e orçamento disponível. Calcular custo de infraestrutura, entrega de e-mails, suporte, onboarding e aquisição. A fórmula inicial é: margem mensal por cliente = receita mensal menos custos variáveis e horas de suporte valorizadas. Comparar esse resultado ao esforço de manter cada oferta.

O período sem mudanças também precisa ter utilidade: consulta rápida, confirmação de monitoramento realizado e evidência para a rotina. Os arquivos analisados têm 11 comparações sem mudanças; isso torna arriscado depender apenas de alertas como razão para renovar.

Publicidade e venda de contatos não são prioridades propostas: desviam a validação da utilidade operacional e exigem escala de audiência ainda desconhecida. Relatórios avulsos podem testar demanda, mas seu uso e esforço de produção precisam ser medidos.

## Validação e divulgação

1. Conversar com 5 a 8 profissionais do segmento acessível ao autor. Pedir um exemplo recente da rotina, uma planilha anonimizada e o tempo gasto. Perguntar quem aprova a compra.
2. Demonstrar consulta, comparação e origem dos dados. Se usar alteração simulada, identificá-la claramente.
3. Oferecer um piloto de 30 dias a 2 ou 3 organizações, com escopo e disponibilidade combinados. São metas do experimento, não previsão de vendas.
4. Medir se a equipe consulta, exporta, revisa evidências e pede continuidade paga. Registrar também quem abandonou e por quê.
5. Só ampliar desenvolvimento comercial após evidência de uso recorrente e disposição de pagar.

E-mail inicial sugerido, a adaptar ao contato real:

> Estou desenvolvendo uma ferramenta para acompanhar o cadastro de resseguradoras na SUSEP e guardar o histórico das verificações. Quero entender como sua equipe faz essa rotina hoje e mostrar uma demonstração de 15 minutos. Vocês usam uma planilha, consultam o site ou já têm algum sistema para isso?

No LinkedIn, publicar uma demonstração curta da rotina e aprendizados da construção. Evitar anunciar uma mudança como real quando ela foi simulada ou dizer que a base está atualizada sem coleta recente validada. Parcerias com profissionais ativos devem ser testadas após a demonstração: medir reuniões qualificadas e pilotos, além de visualizações. Esta rodada não enviou e-mails nem contatou parceiros.

## Nome e posicionamento

Ideias para explorar: Rastro Resseguro, Radar Resseguro e Resseguro em Dia. São sugestões criativas, sem pesquisa de marca, domínio ou disponibilidade. Um nome amplo pode acomodar outros cadastros no futuro; o subtítulo deve deixar explícito o foco inicial em resseguradoras.

Usar "Dados públicos da SUSEP" como indicação de fonte. A identidade visual precisa deixar claro quem fornece o produto.

## Informações pendentes

- Público acessível ao autor e experiência com a rotina atual.
- Serviço hospedado ou instalação entregue ao cliente.
- Tempo semanal, orçamento e capacidade de suporte.
- Curso, prazo e exigências metodológicas do TCC.
- Funcionalidade pela qual uma organização aceitaria pagar e quem aprova esse gasto.
