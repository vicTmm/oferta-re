# Identidade e design do Oferta Re

## Direção atual — mascote fornecido pelo autor

Atualização: 08/10/2026. O autor enviou um mascote criado no Google Stitch e escolheu suas cores como nova referência. Esta decisão substitui a direção roxa anterior, preservada abaixo para o histórico do TCC. O nome **Oferta Re** permanece.

O robô foi recriado em SVG a partir da imagem fornecida, mantendo corpo azul com gradiente, visor escuro, olhos verdes, antena ciano e círculo de confirmação. O arquivo tem fundo transparente e usa formas vetoriais, sem fontes, scripts ou imagens externas: [mascote.svg](../web/public/brand/mascote.svg). É uma recriação visual, sem alegação de equivalência pixel a pixel. O mascote ainda não recebeu nome próprio.

| Papel | Cor | Uso |
| --- | --- | --- |
| Azul principal | `#235DDD` | Botões, seleção, foco e marca |
| Azul profundo | `#2445AD` | Gradiente do robô |
| Ciano | `#31BEF5` | Antena, sorriso e apoio gráfico |
| Verde da ilustração | `#10B981` | Olhos e círculo do mascote |
| Verde de texto | `#08734F` | Estado salvo/envio informado |
| Fundo de sucesso | `#E6FAF2` | Superfícies de confirmação |
| Visor e texto | `#10182B` | Dados principais e títulos |
| Texto de apoio | `#53627A` | Descrições e notas |
| Fundo | `#F5F8FD` | Área de trabalho |
| Superfície | `#FFFFFF` | Cards e tabelas |
| Azul suave | `#EAF1FF` | Seleção e superfícies de apoio |
| Borda | `#DFE7F2` | Separadores |

Valores escolhidos pela inspeção da imagem e pelo contraste de texto. Branco sobre azul principal: 5,70:1; texto de apoio sobre fundo: 5,81:1; verde de texto sobre fundo de sucesso: 5,40:1. Verde vivo/ciano ficam principalmente na ilustração; rótulos essenciais usam tons mais escuros.

Aplicação implementada: mascote na lateral, marca mobile, catálogo, demonstração, login/cadastro, boas-vindas da corretora e estados vazios da consulta/regulação. Favicon usa o mesmo desenho. A lateral permanece em 80 px; em celulares o mascote aparece no cabeçalho e a ilustração maior do catálogo é ocultada para priorizar a consulta. Verde acompanha rótulos de confirmação; o desenho é decorativo e não representa validação regulatória. A consulta Streamlit legada recebeu a mesma paleta.

Verificação: build/TypeScript e 14 testes Node passaram. Chrome inspecionado em desktop e nas larguras 390/320 px; dimensão temporária restaurada. Capturas: [desktop](design/oferta-re-mascote-desktop.jpg), [mobile](design/oferta-re-mascote-mobile.jpg). Sem novas funcionalidades de negócio, migração de banco ou deploy nesta etapa.

## Histórico — direção anterior baseada em Dietitian


Data: 08/10/2026. Nome escolhido pelo autor: **Oferta Re**. Referência visual solicitada: [Dietitian](https://dietitian.com.br/), usando as mesmas cores. Disponibilidade de marca e domínio ainda não verificada.

Esta direção substitui o nome provisório Rastro Resseguro e a proposta de azul dos prompts anteriores. O autor dispensou validação no Google Stitch; os prompts ficam como registro histórico e não são uma etapa necessária. A composição atual é uma proposta visual, sem funcionalidades novas implementadas.

## Referência e paleta

Inspeção da página pública, screenshot e HTML/CSS em 08/10/2026. A referência apresenta branco, roxo, cinzas suaves, títulos grandes, botões arredondados e superfícies claras. A identidade do Oferta Re usa esses elementos em uma composição própria para operações de resseguro.

| Token | Cor | Aplicação |
| --- | --- | --- |
| Primária | `#8005B6` | Marca, botão principal, seleção e foco |
| Roxo de apoio | `#5F1BBE` | Destaques gráficos discretos |
| Roxo profundo | `#55007A` | Variação para interação e destaque |
| Superfície | `#FFFFFF` | Cards, tabelas e editor |
| Fundo | `#FBFBFB` | Área de trabalho |
| Texto forte | `#222222` | Títulos e dados principais |
| Texto de apoio | `#414552` | Corpo e descrições |
| Borda | `#E6E6E6` | Separadores e limites de componentes |

Esses valores aparecem no código público da referência. O papel de cada token no Oferta Re é uma decisão de design proposta. Lavanda clara para seleção será uma derivação da primária; cores de aviso/erro/sucesso serão tokens funcionais próprios, sempre com rótulos. Não usar cinza claro para textos essenciais sem verificar contraste.

## Marca e linguagem

Assinatura de produto: "Ofertas, contatos e comprovantes em um só lugar."

Marca tipográfica Oferta Re com símbolo simples de documento/envio, a desenvolver no sistema de ícones existente. Usar tipografia sem serifa, legível, com pesos 400, 500 e 600; fonte inicial proposta: Inter, já presente no dashboard. Identidade final do logo permanece pendente.

Na futura página de apresentação, proposta de título: "Sua rotina de ofertas de resseguro, organizada." Apoio: "Reúna contatos, prepare rascunhos no Outlook e acompanhe os comprovantes por contrato." Usar uma demonstração identificada enquanto esses recursos estiverem em desenvolvimento.

## Aplicação no web app

Sidebar clara com marca no topo, organização ativa e navegação: Visão geral, Ofertas, Contratos e operações, Resseguradoras, Contatos, Modelos e Atualizações regulatórias. Configurações no rodapé. Item selecionado em lavanda, texto e ícone roxos.

Tela principal: título Ofertas, descrição curta, busca e botão Nova oferta. Resumo com rascunhos, ofertas aguardando resposta e documentos a organizar. Dados numéricos do protótipo são fictícios.

Tabela central: referência, cedente, ramo, versão, situação e última atividade. A situação é descritiva; não implica conformidade jurídica. Filtros ficam acima da tabela, sem grandes banners que ocupem a área de trabalho.

Detalhe de oferta: navegação por Dados, Termos e anexos, Destinatários, Revisão e Respostas. Prévia do e-mail ao lado dos campos no desktop; empilhada no mobile. Ação principal Criar rascunhos no Outlook; envio permanece manual. Exibir integrações futuras como protótipo até sua implementação.

Contrato/operação: documentos e linha do tempo com vínculos de oferta, versão e resseguradora. Atualizações regulatórias: lista de fontes e ficha normativa com vigência e revisão, evitando um valor de multa solto.

Raio proposto: 10 a 12 px em controles e 16 px em cards. Bordas finas, sombras leves apenas para separar camadas. Espaçamento de 8, 12, 16, 24 e 32 px. Tabelas com densidade de trabalho; movimento discreto e respeito à preferência por redução de movimento.

## shadcn/ui e implementação

No futuro frontend React, aplicar cores em tokens semânticos e compor Sidebar, Button, InputGroup, Table, Badge, Tabs, Sheet, Card, Alert, FieldGroup e Empty conforme documentação do projeto criado. O dashboard atual continua Streamlit; a especificação não instala React ou shadcn por si só.

Logo e primária podem receber configuração de marca própria; manter componentes, estados e autorização comuns. Validar contraste e foco quando um cliente trocar a cor.

## Artefatos e verificação

[Composição SVG da tela de ofertas](design/oferta-re-ofertas.svg): proposta estática com dados fictícios, sem integração com Outlook ou cadastro real. Serve para orientar implementação, sem depender do Stitch.

[Prévia PNG](design/oferta-re-ofertas.png), renderizada e inspecionada visualmente em 08/10/2026.

Verificar antes da implementação: legibilidade em tabela, contraste, foco, prévia de e-mail, estado de integração e distinção entre rascunho/envio/resposta. A paleta foi extraída da referência; as telas e textos foram adaptados ao escopo do Oferta Re.

## Preferência atual do autor — uso restrito à marca

08/10/2026: após revisão da demonstração, o autor reiterou que não deseja o mascote como ilustração no conteúdo. Removido de banners, login/cadastro, boas-vindas e estados vazios. Preservado apenas na marca (lateral/cabeçalho mobile) e favicon. Não recolocar em áreas de conteúdo sem solicitação explícita.
