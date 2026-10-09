# Diagnóstico e plano de implementação

Data: 08/10/2026. Análise estática do checkout `8177239` e verificação local dos CSVs. Não houve coleta ao vivo, inspeção das execuções remotas nem avaliação visual do dashboard.

Revisão de prioridade após relato operacional: manter a etapa 0 e a consulta da base; incorporar importação de contatos, ofertas em rascunho e dossiê conforme [Gestão de ofertas e contatos](ofertas-e-contatos.md). Essas fatias passam à frente de cobrança automatizada e migração ampla de frontend. As estimativas abaixo não incluem o novo escopo de ofertas.

## Evidências encontradas

| Evidência | Consequência | Prioridade |
| --- | --- | --- |
| 12 snapshots de 22/05 a 05/06/2026, todos com 132 registros: 15 locais, 25 admitidas, 92 eventuais | O checkout não demonstra atualização após junho; investigar Actions e deploy antes de apresentar como atual | P0 |
| 11 relatórios sem linhas de alteração; recomparação dos snapshots também sem diferenças | Resultado consistente, mas casos de inclusão, remoção e alteração precisam de testes controlados | P0 |
| `app/dashboard.py` cadastra e-mails em `data/subscribers.json`; não existe rotina de envio | A promessa de receber alertas não corresponde à entrega atual | P0 |
| `consultar_tipo` espera tempos fixos e extrai apenas registros com CNPJ | Mudança de HTML, lentidão ou registros sem CNPJ podem causar falha ou omissão | P0 |
| Há erro se uma categoria vier vazia, mas nenhuma validação de queda parcial de volume | Uma coleta incompleta ainda pode gerar remoções aparentes | P0 |
| `compare_tables` cria dicionários por chave | Chaves duplicadas são sobrescritas silenciosamente; bloquear duplicidade antes de comparar | P0 |
| Chave contém tipo e identificador; fallback usa nome | Mudança de tipo gera saída/entrada; mudança de nome pode trocar a chave quando não há identificador | P1 |
| Dashboard tem resumo, alterações e arquivos históricos, mas não exibe busca da base completa | Falta a principal tarefa de consulta do produto | P1 |
| Datas usam `datetime.now()` sem fuso; arquivos não carregam manifesto de execução | Horários locais e do runner podem ter interpretações diferentes | P0 |
| Dados brutos e logs ficam nos artefatos por 30 dias; só histórico e relatórios são commitados | A retenção da evidência original precisa de regra própria | P1 |
| Dependências sem versões e sem suíte de testes no checkout | Reprodução e detecção de regressões ficam difíceis | P0 |

Não interpretar os 132 registros como contagem atual da SUSEP. A ausência de duplicatas nesses snapshots não garante que futuras coletas sejam únicas.

## Etapa 0: confiabilidade antes do piloto

Estimativa inicial: 3 a 5 dias de trabalho focado; revisar após detalhar o parser.

1. Verificar a última execução remota, erros, agendamento, branch e dados servidos. Mostrar última coleta validada e aviso de defasagem no dashboard. A janela de atualização deve considerar dias úteis; o cron atual é `30 12 * * 1-5` em UTC.
2. Trocar a promessa de alertas por uma mensagem honesta de interesse enquanto não houver envio. Evitar coletar e-mail sem um uso operacional definido; o JSON local não oferece persistência e concorrência adequadas para serviço hospedado.
3. Separar navegação e extração para testar o parser com HTML salvo. Esperar elementos/resultados em vez de pausas fixas; definir timeout, tentativas limitadas e logs por categoria.
4. Validar esquema, identificação, categorias esperadas, duplicidade e volume por categoria. Comparar com último snapshot válido. Quedas fora de parâmetros configuráveis exigem revisão; os limites precisam ser calibrados, não assumidos como verdade regulatória.
5. Publicar base atual e baseline apenas após validação completa. Coleta rejeitada preserva a base anterior e gera estado de falha. Para remoções, exigir confirmação em nova coleta válida ou revisão; no relatório usar "ausente na coleta".
6. Criar manifesto por execução: `run_id`, início/fim em UTC, fonte, versão do código/parser, contagens por tipo, estado de validação, snapshot anterior e hash da evidência bruta. Exibir horário ao usuário em America/Sao_Paulo.
7. Fixar dependências em ambiente de Python definido e documentar instalação reproduzível. Criar CI para verificações sem depender do site externo.

Critérios de aceite: base vazia, parcial, chave duplicada e falha de parsing não substituem baseline; execução rejeitada aparece como falha; dados antigos recebem aviso; interface não promete envio inexistente. Testes cobrem inclusão, saída, alteração de campo, ausência de mudança, mudança de tipo, identificador ausente e duplicidade. Manter separada uma verificação de integração com a fonte, executada de forma controlada.

## Etapa 1: consulta útil e template de marca

Estimativa: 1 a 2 semanas de trabalho focado.

- Adicionar aba de base atual com busca por nome/CNPJ, filtro por categoria e exportação dos resultados filtrados.
- Criar detalhe de entidade com dados cadastrais, fonte e linha do tempo disponível.
- Apresentar diferenças em campos estruturados: campo, valor anterior e valor observado. A string atual continua útil para compatibilidade, mas não deve ser o único formato.
- Separar informações cadastrais de estados do monitoramento. Revisar o rótulo "Registros ativos": hoje a contagem significa registros coletados, sem validação individual do status.
- Configurar nome, logo, cores e textos de contato por organização; manter código compartilhado. Preparar template visual sem criar forks por cliente.
- Organizar a tela em torno da busca e das alterações; reduzir destaque de nomes técnicos de arquivos na experiência principal.

Critérios de aceite: usuário encontra uma entidade conhecida por nome e CNPJ, exporta o filtro correto e identifica origem e data; trocar a marca não exige editar componentes; exemplos fictícios não se misturam com dados reais. Usar essa versão para entrevistas, sem aguardar migração completa de frontend.

## Etapa 2: piloto com monitoramento e alertas

Estimativa: 2 a 3 semanas, condicionadas aos requisitos dos pilotos.

- Persistir execuções, entidades, snapshots e mudanças em banco; guardar evidência bruta em armazenamento com política de retenção e backup. Migrar CSVs preservando strings como CNPJ e códigos, datas originais e referência ao arquivo.
- Separar base pública compartilhada de organizações, usuários, listas monitoradas, revisões e destinatários privados.
- Implementar autenticação e autorização por organização. Testar acesso indevido por URL, exportação, API e identificação de objeto.
- Criar lista monitorada por entidade/campo, resumo periódico e fila de envio. Usar identificador único por destinatário/evento, tentativas limitadas e registro de entrega/falha para evitar duplicação.
- Implementar descadastro, preferências e armazenamento dos dados de contato fora do repositório público. Definir finalidade e retenção antes de coletar contatos de produção.
- Registrar revisão da mudança: responsável, data e nota. Distinguir atualização cadastral, falha de coleta e ausência confirmada.

Critérios de aceite: cada organização vê suas próprias listas; um evento não gera e-mails duplicados em reexecução; descadastro impede próximos envios; falha de entrega é visível; backup pode ser restaurado em ambiente de verificação. Relatórios e alertas apontam a fonte e o intervalo de observação.

## Etapa 3: produto comercial

Estimativa: 2 a 4 semanas após evidência de demanda.

Frontend React/Next.js com shadcn/ui para experiência comercial e marca configurável. Preservar o pipeline Python; expor consulta por uma API pequena, por exemplo FastAPI, se a separação frontend/backend se justificar. PostgreSQL é uma opção de persistência para dados relacionais. São propostas de arquitetura, sem fornecedor ou custo escolhido.

Adicionar planos por organização, convites, cobrança e administração. Aplicar permissões e limites no servidor. Pagamentos precisam suportar webhook idempotente, repetição, cancelamento, inadimplência e período de acesso; não ativar recursos pagos apenas pelo retorno do navegador. Escolher provedor depois de verificar preço, operação e integração atuais.

GitHub Actions pode continuar como agendador durante os pilotos. Migrar execução para worker/fila quando houver necessidade de tentativas controladas, maior frequência ou integração operacional. Uma coleta compartilhada atende todos os clientes; visitas à SUSEP não precisam crescer com o número de consultas dos usuários.

Critérios de aceite: estados de pagamento e acesso estão consistentes; cada plano tem limites explicáveis; consultas usam dados persistidos; indisponibilidade da fonte preserva a última base válida e informa o usuário; deploy admite rollback e recuperação do banco.

## Ordem sugerida e decisões adiadas

Confiabilidade, consulta e entrevistas podem evoluir juntas. Pilotos definem o investimento em alertas, banco e frontend. A soma das estimativas não é um prazo de entrega: disponibilidade semanal, aprendizado, vendas e respostas de usuários ainda são desconhecidos.

Adiar múltiplas fontes, IA para interpretação regulatória, aplicativo móvel, microserviços e versões exclusivas de código. Avançar nesses pontos quando uma demanda validada justificar custo e avaliação adicional.

## Métricas

- Operação: execuções válidas/previstas, idade do último dado válido, categorias cobertas, falhas e tempo de recuperação.
- Qualidade: precisão das diferenças frente a casos verificados, alertas falsos e rejeições corretas de coletas incompletas.
- Uso: organizações que completam uma tarefa útil por semana, consultas, exportações e revisões. Login isolado não demonstra valor.
- Negócio: pilotos que renovam, receita recorrente, cancelamentos, suporte por organização e esforço para conquistar um cliente.

Aumento de audiência não substitui evidência de uso e compra. Não anunciar disponibilidade ou redução de risco que ainda não foram medidas.
