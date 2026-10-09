# Design e prompt para Google Stitch

Data: 08/10/2026. Especificação proposta, sem frontend novo implementado.

Atualização: o autor dispensou validação pelo Google Stitch e escolheu Oferta Re. A [direção visual atual](identidade-oferta-re.md) usa as cores da referência Dietitian e substitui nome/paleta dos prompts abaixo, preservados como histórico.

O autor ampliou o foco para preparação e acompanhamento de ofertas. Aplicar também a [adição ao prompt para ofertas e contatos](ofertas-e-contatos.md#adição-ao-prompt-do-stitch); ela torna Ofertas a tela principal do protótipo.

## Direção da interface

O usuário precisa encontrar uma resseguradora, entender quando os dados foram coletados e verificar o que mudou. A busca deve receber mais destaque que o gráfico de distribuição. Dados antigos e falhas precisam ser visíveis mesmo quando há uma base disponível.

Usar uma interface de trabalho em português brasileiro, com tabela legível, hierarquia simples e cores discretas. O tema de marca deve controlar tokens sem alterar cada componente. Oferecer tema claro inicialmente; manter equivalência de contraste se houver tema escuro. Reservar cores de status para informações de status, acompanhadas de texto.

## Aplicação das skills solicitadas

As skills não estavam instaladas nos diretórios consultados. Foram lidas diretamente nas fontes em 08/10/2026:

- [shadcn oficial](https://github.com/shadcn-ui/ui/blob/main/skills/shadcn/SKILL.md): composição de componentes existentes, variantes, tokens semânticos e estrutura acessível. Aplicada à especificação abaixo. O projeto atual usa Streamlit; o uso efetivo dos componentes requer o frontend proposto.
- [humanizer](https://github.com/blader/humanizer/blob/main/SKILL.md), versão declarada 3.1.0: revisão de redação para remover exageros, frases genéricas e repetições, preservando fatos. Aplicada aos textos desta documentação e ao prompt. A skill ajuda na escrita; não cria componentes nem substitui revisão acadêmica.
- `find-skills`: usada para localizar e verificar as fontes. Nenhuma skill foi instalada globalmente.

Na implementação React, consultar o contexto real com `npx shadcn@latest info --json`, verificar componentes existentes e buscar os necessários. Antes de implementar um componente, executar `npx shadcn@latest docs <component>` e ler os links retornados. Escolher o package runner do projeto criado. Conferir a [documentação oficial de instalação](https://ui.shadcn.com/docs/installation) no momento da implementação.

| Necessidade | Composição proposta |
| --- | --- |
| Navegação | Sidebar, Breadcrumb, Tabs |
| Busca e filtros | InputGroup, Select ou Combobox, ToggleGroup |
| Base e alterações | Table/Data Table, Badge, Pagination |
| Detalhe da entidade | Sheet com título acessível, Tabs e Table |
| Resumo operacional | Card com Header, Title, Description e Content |
| Dados defasados ou falha | Alert |
| Carregamento e ausência de resultados | Skeleton e Empty |
| Preferências de alertas | FieldGroup, Field, Switch e Checkbox |

Usar cores semânticas como `background`, `foreground`, `primary`, `muted` e `border`; configurar a marca nesses tokens. Preservar foco por teclado, rótulos de inputs, título de overlays e contraste. A especificação visual do Stitch precisa ser reconciliada com os componentes e APIs reais na implementação.

## Textos da experiência

| Situação | Texto sugerido |
| --- | --- |
| Título | Resseguradoras |
| Apoio | Consulte os dados coletados e acompanhe mudanças no cadastro. |
| Busca | Buscar por nome ou CNPJ |
| Origem | Fonte: SUSEP. Coletado em {data e horário}. |
| Nenhuma mudança | Nenhuma diferença encontrada entre as coletas de {início} e {fim}. |
| Coleta antiga | A última coleta validada foi em {data}. Os dados podem estar desatualizados. |
| Falha | Não foi possível validar a nova coleta. Exibimos a última base validada. |
| Ausência de registro | Registro ausente nesta coleta. A ocorrência aguarda confirmação. |
| Alertas ainda não implementados | Alertas por e-mail ainda não estão disponíveis. |
| Exportação | Exportar resultados |

O horário da coleta é diferente da data de autorização/cadastramento exibida na fonte. Evitar "em tempo real", "conformidade garantida" e "licença cancelada" quando a evidência disponível é somente diferença de coleta.

## Prompt para colar no Google Stitch

```text
Crie o design de um produto B2B para consultar e acompanhar o cadastro público de resseguradoras da SUSEP. Nome provisório: Rastro Resseguro. Idioma: português brasileiro. Público inicial: equipes de operações de corretoras de resseguro e seguradoras.

O produto reúne dados coletados, comparação entre snapshots e histórico. A tarefa principal é encontrar uma entidade por nome ou CNPJ, conferir dados e origem, e acompanhar mudanças. A personalização da marca de cada organização usa logo, nome e cor primária, mantendo as mesmas telas.

Crie versões desktop de 1440 px e mobile de 390 px. Use uma interface de trabalho sóbria: fundo neutro claro, superfícies brancas, texto escuro, azul discreto como cor principal e bordas leves. Tipografia legível, espaçamento consistente e tabelas com boa densidade. Use cor de status junto com texto. Mantenha foco por teclado e contraste acessível. Dê mais destaque à busca e aos resultados do que a gráficos. Evite grandes banners e animações decorativas no dashboard.

Tela 1: base de resseguradoras.
Sidebar com Base de resseguradoras, Alterações, Lista monitorada e Configurações. Cabeçalho com organização e usuário. Título Resseguradoras. Texto: Consulte os dados coletados e acompanhe mudanças no cadastro. Busca por nome ou CNPJ. Filtros por tipo: Local, Admitida e Eventual. Botão Exportar resultados. Informação de fonte e última coleta validada, com fuso informado. Tabela com nome, tipo, CNPJ, data de autorização/cadastramento e última mudança observada. CNPJ é texto e preserva zeros. Não mostrar contagem de registros coletados como comprovação de entidades ativas.

Tela 2: detalhe da entidade.
Painel lateral no desktop e tela completa no mobile. Mostrar identificação, categoria, contatos e data cadastral informados pela fonte. Abas Dados cadastrais e Histórico. Comparação com campo, valor anterior e valor observado. Mostrar intervalo entre coletas. Botão Acompanhar entidade como funcionalidade planejada.

Tela 3: alterações.
Filtros por período, categoria e ocorrência. Lista de novos registros, diferenças cadastrais e ausências na coleta. Para ausência, informar que requer confirmação. Detalhe antes/depois e ação de registrar revisão pela equipe. Estado vazio: Nenhuma diferença encontrada entre as coletas de {início} e {fim}.

Tela 4: lista monitorada e alertas, funcionalidade planejada.
Entidades selecionadas, campos acompanhados, destinatários e frequência do resumo. Mostrar configuração de alertas e preferências. Não sugerir alertas enviados quando o envio ainda não existe.

Tela 5: configurações da organização, funcionalidade planejada.
Nome, logo, cor primária e prévia da marca. Seção de membros com papéis administrador e membro. Dados públicos podem ser compartilhados entre organizações; listas, destinatários e revisões são privados.

Inclua estados de carregamento, erro de coleta, base defasada, base ainda indisponível e busca sem resultados. Quando a nova coleta falhar, exibir a última base validada com aviso: Não foi possível validar a nova coleta. Exibimos a última base validada. Não anunciar atualização em tempo real.

Use dados fictícios com indicação visível Dados de demonstração. Não use nomes, contagens ou eventos fictícios como se fossem uma lista atual da SUSEP. A data de coleta deve ser distinta da data cadastral. Identifique telas de recursos futuros como protótipo.

O design será implementado em React com shadcn/ui. Priorize padrões compatíveis com Sidebar, Table/Data Table, Badge, InputGroup, Select/Combobox, ToggleGroup, Sheet com título, Tabs, Card, Alert, Skeleton, Empty e FieldGroup. Use tokens semânticos e variantes de componentes para que outra corretora possa trocar a marca por configuração.

Entregue também tokens de cor, tipografia, espaçamento, raio e estados de componentes. No mobile, priorize identificação e tipo na lista, com demais informações no detalhe. Escreva textos curtos, específicos e sem promessas de conformidade ou solvência. Indique SUSEP como fonte de dados públicos e o produto como serviço independente.
```

## Verificação do protótipo

Pedir a usuários para localizar uma entidade, identificar a data da coleta, comparar um campo, exportar uma seleção e explicar o que significa uma ausência. Registrar conclusão, erros e dúvidas. Se interpretarem ausência como cancelamento, revisar os textos e estados. Guardar telas, versão do prompt e resultados para o TCC.
