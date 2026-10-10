# Separação do Oferta Re em repositório próprio

Data: 10/10/2026.

## Origem e destino

Origem: https://github.com/vicTmm/pipeline-susep-resseguradoras, branch `feat/implementacao-futuro-ofertare`, commit `771570a6d23fd2586a123d711cf720d0983f9749`.

Destino: https://github.com/vicTmm/oferta-re. A branch foi importada com os ancestrais originais. Um commit posterior separa o produto do coletor; o commit inicial do destino também é preservado na integração com `main`. Arquivos antigos do coletor continuam acessíveis no histórico Git.

## Responsabilidades

O novo repositório contém `web/`, `supabase/`, documentação do produto, testes web/banco e provisionamento da autenticação do endpoint de ingestão.

O repositório original mantém Python, Streamlit, coleta, validação, históricos, relatórios, publicação Supabase e configuração dos secrets do coletor. Sua branch original foi preservada como cópia de segurança. A `main` original não foi modificada; as melhorias do coletor presentes na branch ainda precisam de uma integração específica naquela `main`.

O workflow agendado do coletor não foi duplicado no novo repositório. A publicação continua dependendo do workflow e secrets no repositório original. O script de exportação do catálogo também permanece na origem; seu JSON gerado pode ser copiado para `web/src/lib/public-catalog.json` neste projeto.

## Backend e configuração

A migração Git não cria nem altera projetos Supabase, dados, buckets, tokens, contas ou configurações Auth. As migrações e a função continuam versionadas aqui para evolução futura. Não reaplicar migrações em produção nem executar `provision_ingestion.py` apenas por causa desta separação.

Arquivos de ambiente, credenciais, dependências instaladas e artefatos de build não são publicados. A configuração Vercel continua apontando para `web`; associação ao novo repositório e deploy são etapas futuras.

## Verificação

Executar `npm ci`, `npm test`, `npm run typecheck` e `npm run build` em `web/`. Conferir que os arquivos de produto importados permanecem iguais ao commit de origem e que ambas as histórias são ancestrais de `main`.

Resultado local: `npm ci` concluído (zero vulnerabilidades reportadas), 37 testes passaram, TypeScript e build de produção passaram. Comparação de `web/`, `supabase/` e `scripts/provision_ingestion.py` com o commit de origem sem diferenças.
