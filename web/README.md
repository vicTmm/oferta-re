# Oferta Re — aplicação web

Next.js, shadcn/ui e Supabase. Consulte [migração e implantação](../docs/migracao-supabase-vercel.md).

Executar neste diretório: `npm ci`, configurar `.env.local` conforme `.env.example` e executar `npm run dev`. Sem as variáveis Supabase, a consulta usa o snapshot público local; com configuração, falhas do backend ficam visíveis.

Verificação: `npm test`, `npm run typecheck`, `npm run build`. Vercel: Root Directory `web`. Somente URL, chave publicável e Site URL no frontend. Nunca adicionar chaves administrativas ou o token do coletor às variáveis Next.js.
