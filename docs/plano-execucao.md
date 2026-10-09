# Plano de execução do Oferta Re

Revisão: 08/10/2026. Desenvolvimento autorizado pelo autor após planejamento. Este plano consolida o escopo e substitui a sequência inicial centrada apenas no monitoramento. Status detalhado em [Tarefas](tarefas.md).

## Resultado esperado

Uma corretora mantém contatos privados, cria modelos, prepara ofertas e rascunhos no Outlook, revisa e envia manualmente e guarda comprovantes por operação/contrato. O cadastro SUSEP fornece referência pública e a seção regulatória reúne fontes revisadas. Nome definido: Oferta Re. Paleta atual: azul `#235DDD`, verde e ciano, a partir do mascote Stitch fornecido pelo autor; a direção roxa anterior fica como histórico. Stitch não é dependência de execução.

## Arquitetura e sequência

Preservar o pipeline Python e desenvolver em entregas verificáveis. Nesta primeira entrega, corrigir riscos de integridade do histórico e aplicar identidade/busca no Streamlit existente. A aplicação atual continua somente de consulta; não armazenará contatos/documentos privados sem a camada de acesso correspondente.

O autor escolheu Supabase e Vercel. A interface principal usa Next.js e shadcn/ui; Supabase fornece Postgres, Auth, Storage e API sob RLS. Python permanece no coletor, sem introduzir outra API para o domínio nesta etapa. Streamlit fica como consulta legada. A fundação e o catálogo foram migrados; detalhes, verificações e pendências em [Migração Supabase/Vercel](migracao-supabase-vercel.md).

### Entrega 1: coleta confiável e consulta utilizável

Validar categorias, identidade, esquema, duplicidade e quedas parciais antes de publicar. Coleta rejeitada preserva snapshot/base atual, gera manifesto de falha e mantém evidência bruta quando disponível. Manifesto usa UTC e identifica fonte, contagens, baseline e hash. Relatórios descrevem ausência observada, sem afirmar cancelamento.

Interface Oferta Re com tema roxo, busca por nome/CNPJ, filtro por categoria, exportação filtrada, dados como texto e aviso de defasagem. Remover formulário que promete alertas não implementados. Testes de comparação, falha do pipeline e interação com a busca; CI sem depender da SUSEP.

Aceite: falhas não promovem baseline; chaves duplicadas não somem silenciosamente; busca/exportação preservam identificadores; interface informa a idade dos dados e não promete envio.

### Entrega 2: domínio e acesso privado

Modelar organização, usuário/papel, entidade pública, contato, modelo/versão, operação, oferta/versão, destinatário, documento, resposta, evento e referência normativa. Separar operação pré-contratual de contrato. Autenticação, autorização por objeto e organização, migrações e backup. Frontend React/shadcn segue a direção visual já registrada.

Aceite: organização A não acessa dados de B via tela, API, URL ou exportação; banco restaurável; nenhuma informação privada entra no Git público.

### Entrega 3: contatos e modelos

Importação XLSX/CSV com prévia, mapeamento, vínculos ambíguos e duplicatas; cadastro e exportação da própria base. Editor de modelos por corretora com assinatura separada, campos e versionamento. Toda demonstração usa conteúdo fictício.

Aceite: nenhuma importação grava antes de confirmação; editar uma oferta não modifica modelo ou versões anteriores; campos não preenchidos impedem geração.

### Entrega 4: operações e preparação de ofertas

Cadastro de operação, termos/anexos, seleção por empresa e contatos, prévia individual e lote versionado. Mostrar entidades sem contato e documentos pendentes. Preservar termos e corpo gerado.

Aceite: cada destinatário recebe conteúdo/anexos da versão correta; estado rascunho é diferente de enviada; contatos não são usados como denominador de participação regulatória.

### Entrega 5: Outlook e comprovantes

Fazer prova de conceito da criação de rascunhos antes de assumir Graph. Depende de confirmar conta Outlook e autorização do cliente. Implementar geração de lote com resultado por empresa e reconciliação de falhas ambíguas. Envio permanece manual.

Em paralelo, upload manual privado dos comprovantes, vínculo a operação/oferta/versão/entidade, respostas e pacote de exportação com índice. Não depender de leitura automática de caixa postal.

Aceite: retry não duplica rascunhos; assinatura/formatação verificadas no Outlook escolhido; arquivo original recuperável; registro manual não representa envio/aceite comprovado sem evidência.

### Entrega 6: referências regulatórias e piloto

Curadoria manual de fontes, normas/artigos, vigência, faixa/critério de sanção e histórico de revisão. Estados de proposta e norma vigente separados. Validar enquadramento antes de cálculos; automatizar descoberta somente depois.

Piloto com tarefas de consulta, preparação e recuperação de comprovantes. Medir tempo, erro, uso, esforço de suporte e disposição de pagar. Disponibilizar comercialmente após acesso privado, recuperação e fluxo principal verificados. Cobrança e marca própria avançam após demanda validada.

## Dependências ainda não respondidas

- Outlook clássico/novo/web, provedor da caixa e possibilidade de autorizar Graph/add-in.
- Distribuição de um ou vários contatos por empresa e uso de Para/Cc.
- Formatos dos comprovantes (.msg/.eml/PDF/imagens) e limites de anexos.
- Papéis da equipe, volume semanal e revisão das regras aplicáveis.

Essas respostas não bloqueiam a entrega 1 e o desenho do domínio. A base corporativa anterior está excluída do projeto por restrição de compliance.

## Verificação e documentação

Usar testes controlados para mudanças e coletas incompletas, testes de interação para busca e testes de autorização/arquivos quando essas camadas existirem. Separar integração real com a SUSEP e Outlook das verificações offline. Registrar código, ambiente, resultados e limites no diário do TCC. Não marcar tarefa concluída apenas por haver protótipo.

Primeira entrega não inclui envio, importação de base corporativa, publicação externa ou promessa de conformidade. Nenhum fornecedor pago foi escolhido.

## Modelo SaaS definido

A empresa é o ambiente privado e futura unidade de assinatura; usuários têm contas individuais, papéis empresariais e vínculo a vários setores. Dados são compartilhados internamente, organizados por setor, conforme escolha do autor. Quarta migração e telas implementadas. [Detalhes e critérios para o piloto comercial](saas-empresas-e-setores.md).
