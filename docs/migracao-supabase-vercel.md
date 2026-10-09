# Migração para Supabase e Vercel

Atualização: 08/10/2026. Arquitetura escolhida pelo autor: Supabase para dados, autenticação e arquivos; Vercel para Next.js. Python permanece no coletor do GitHub Actions. A interface principal passa de Streamlit para Next.js com shadcn/ui e a identidade Oferta Re.

## Implementado e verificado

Projeto Supabase: `vssghglrtxqkfpsdfeik`. Duas migrações aplicadas e registradas: `20261008225654_oferta_re_foundation.sql` e `20261008231500_private_storage.sql`. A primeira foi aplicada pelo MCP autenticado. Leituras subsequentes da credencial provocaram solicitações repetidas do macOS; os processos foram encerrados e a preparação restante foi concluída pela sessão existente do painel, sem novas leituras do Keychain.

São 15 tabelas com RLS: execuções e snapshots públicos; organizações e membros; contatos; modelos e versões; operações; ofertas e versões; destinatários; documentos; respostas; auditoria; atualizações regulatórias. Chaves compostas restringem vínculos à mesma organização. Papéis owner/admin/member/viewer delimitam alterações. Versões, documentos e eventos preservam histórico; usuários não podem se promover por alterações diretas de membros.

Bucket `operation-documents` privado, limite de 25 MiB por arquivo. Caminhos e metadados vinculam documentos à operação e organização. O cliente não pode sobrescrever ou excluir originais. A tela de upload será construída na entrega de comprovantes.

Importados 135 registros públicos: 15 locais, 25 admitidas e 95 eventuais. A API anônima retornou o catálogo com HTTP 200; contatos privados retornaram HTTP 401. Verificação remota: zero tabelas sem RLS, zero contatos privados e duas migrações. Nenhuma base corporativa foi usada.

Next.js em `web/`: consulta, busca literal por nome/CNPJ, categorias, paginação, CSV, avisos de defasagem/falha; página de regulação com estado vazio; cadastro/login por Supabase Auth e área autenticada com criação de organização. Cadastro, login e envio de confirmação estão implementados, mas não foi criada conta de usuário nem testado envio de e-mail real nesta rodada. O catálogo usa a última execução validada; falhas na conexão aparecem explicitamente. O snapshot local só é usado quando Supabase não está configurado.

## Atualização pública sem chave administrativa no GitHub

A função `ingest-susep` foi publicada no Supabase. Recebe somente as operações `publish_susep_collection` e `record_susep_failure`. Exige token aleatório de 256 bits, compara seu SHA-256, limita corpo a 2 MB e restringe método e tipo de conteúdo. Usa a chave administrativa fornecida pelo próprio ambiente Supabase apenas para chamar essas duas RPCs; ela não foi extraída nem enviada ao GitHub ou frontend.

A verificação JWT legada da função fica desativada porque a autenticação é feita pelo token exclusivo do coletor. Sem esse token, a chamada retornou 401. Publicação autenticada do mesmo manifesto foi bem-sucedida e idempotente. O token fica em `.env.ingestion.local`, ignorado e com permissão 0600; somente seu hash aparece no código da função.

Os segredos `SUPABASE_URL` e `SUPABASE_INGESTION_TOKEN` foram configurados no repositório GitHub. O workflow local já publica sucesso/falha pelo endpoint. A atualização automática ainda depende de publicar os arquivos modificados e verificar uma execução remota. Não houve push nesta rodada.

## Executar e hospedar

Interface local: http://localhost:3000. No diretório `web`, executar `npm ci` e `npm run dev`. A configuração local está em `.env.local`, ignorada. Usar `.env.example` para outro ambiente.

Na associação do repositório à Vercel, selecionar Root Directory `web`. `web/vercel.json` declara Next.js, instalação com `npm ci` e build com `npm run build`. Variáveis necessárias: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` e `NEXT_PUBLIC_SITE_URL` com o domínio final. O frontend não recebe service_role nem o token do coletor.

Depois de obter o domínio, configurar no Supabase Auth a Site URL e a callback exata `/auth/callback`; validar cadastro, confirmação, login e logout. A configuração local do CLI contém localhost:3000, mas não substitui a configuração de produção do projeto hospedado. Associação e deploy Vercel ainda não foram feitos.

## Próximas entregas e critérios

1. Publicar o código e verificar o workflow no runner; associar Vercel e validar callback e e-mails no domínio final.
2. Validar acesso com duas contas reais e upload/download via Auth e Storage; ensaiar backup/restauração antes do piloto privado.
3. Implementar telas de contatos, importação com prévia e confirmação, exportação e modelos versionados.
4. Implementar operações, seleção de destinatários, prévias e anexos; preservar cada versão.
5. Provar criação de rascunhos no Outlook com autorização da corretora; manter revisão e envio manuais. Implementar upload e recuperação de comprovantes.
6. Curadoria regulatória revisada e piloto com medidas de tempo, erros e recuperação de evidências.

## Verificação e limites

13 testes Python; 12 testes Node para consulta, autenticação do endpoint e banco; TypeScript e build Next.js passaram. Os testes de banco executam SQL real em PGlite com papéis e contexto de autenticação controlados, verificando isolamento, escopo de escrita, histórico e publicação atômica. Não substituem ensaio completo do Supabase Auth/Storage hospedado. Busca por CNPJ e estado sem resultados foram verificados no Chrome. Evidência visual: [nova interface](design/oferta-re-next.jpg).

Interfaces de contatos, modelos, ofertas, Outlook e comprovantes ainda não estão disponíveis. O esquema prepara essas etapas. Backup/restauração, SMTP de produção, revisão operacional de retenção e deploy Vercel permanecem pendentes. A aplicação não afirma conformidade jurídica nem calcula multa automaticamente.

## Atualização: telas operacionais

Uma terceira migração foi aplicada e as telas de contatos, modelos, ofertas e comprovantes foram implementadas. A seção anterior registra a fundação inicial. Consulte [estado atual das telas e verificações](telas-e-fluxos.md).
