# Oferta Re

Plataforma para corretoras de resseguro organizarem propostas, renovações, ofertas ao mercado, prazos e comprovantes em um ambiente compartilhado por empresa.

## Estado atual

Aplicação Next.js/shadcn com Supabase para banco, autenticação e arquivos. Implementa equipes e setores, contatos, modelos, propostas, renovações vinculadas, ofertas versionadas e registro manual de respostas com comprovantes. Há demonstração com dados fictícios e consulta pública de resseguradoras.

Envio pelo Outlook e classificação de respostas permanecem manuais. Integração Microsoft 365, cobrança e deploy Vercel ainda não estão concluídos.

## Desenvolvimento local

Requisito: Node.js 24 e npm. Execute:

```sh
cd web
npm ci
cp .env.example .env.local
npm run dev
```

Configure `.env.local` conforme o exemplo. Sem configuração Supabase, a consulta pública utiliza o catálogo local; os fluxos autenticados dependem do backend.

Abra http://localhost:3000 ou http://localhost:3000/demonstracao?tela=propostas.

## Verificação

```sh
cd web
npm test
npm run typecheck
npm run build
```

Os testes de banco usam PostgreSQL em PGlite e não exigem credenciais de produção. A CI executa os testes, a verificação TypeScript e o build.

## Estrutura

- `web/`: aplicação, componentes, catálogo público e testes.
- `supabase/`: migrações, configuração local e endpoint de ingestão SUSEP.
- `docs/`: produto, decisões, design, planos e evidências.
- `scripts/provision_ingestion.py`: preparação local da chave dedicada de ingestão; não executar para migrar o repositório, pois altera o hash esperado pelo endpoint.

## Dados SUSEP

O coletor Python, o dashboard Streamlit e os históricos continuam no [pipeline-susep-resseguradoras](https://github.com/vicTmm/pipeline-susep-resseguradoras). O Oferta Re mantém o catálogo público de contingência e o endpoint Supabase `ingest-susep`. O coletor pode continuar publicando no mesmo backend; a mudança de repositório não altera essa conexão.

## Implantação e documentação

Na Vercel, usar Root Directory `web`. Configurar somente as variáveis indicadas em `web/.env.example`; chaves administrativas e token do coletor não pertencem ao frontend.

Consulte [documentação do produto](docs/README.md), [configuração Supabase/Vercel](docs/migracao-supabase-vercel.md) e [registro da separação dos repositórios](docs/migracao-repositorio.md).
