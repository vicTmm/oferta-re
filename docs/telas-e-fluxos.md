# Telas de contatos, modelos, ofertas e comprovantes

Data: 08/10/2026. Desenvolvimento autorizado pelo autor após a migração da fundação. Interface em Next.js/shadcn, usando a sessão Supabase do usuário e RLS. Não há chave administrativa nos formulários.

## Entrega

- `/workspace`: entrada da corretora e navegação para as quatro áreas; organizações visíveis seguem a associação do usuário.
- `/workspace/contatos`: cadastro e edição de contato, vínculo com empresa da base pública, especialidades e origem; busca e exportação CSV da própria organização. A exportação percorre páginas da API e neutraliza fórmulas de planilha. Dados corporativos anteriores continuam excluídos.
- `/workspace/modelos`: criação, nova versão, histórico, assunto, corpo em texto simples e assinatura. Salvar cria uma versão imutável; usar em oferta carrega a versão mais recente.
- `/workspace/ofertas`: lista de operações e preparação com referência, título, cedente, contrato opcional, modelo, texto revisável e seleção de contatos. Prévia acompanha o texto. Campos entre chaves ainda não substituídos impedem preparação. Máximo de 100 destinatários.
- `/workspace/ofertas/[id]`: texto preservado e destinatários com e-mail/nome da época da preparação. Cada envio exige confirmação manual; o registro não envia e-mail nem comprova entrega.
- `/workspace/comprovantes`: documentos por operação, vínculo opcional ao destinatário, registro de resposta/classificação, observação e data recebida opcional em Brasília. O banco rejeita vínculo com comprovante de outro destinatário/operação.
- `/workspace/arquivos/[id]`: verifica sessão e organização antes de gerar link de download válido por 60 segundos, com resposta privada sem cache. `/workspace/contatos/exportar` também verifica a sessão e organização.
- `/demonstracao`: quatro telas com dados fictícios de `example.com`, sem escrita. O editor de oferta permite experimentar prévia e seleção, mas salvar fica desativado. Os formulários reais exigem conta e corretora.

A navegação usa abas compactas, sem aumentar a lateral de 80 px. Formulários em duas colunas no desktop e uma coluna em telas menores, com campos rotulados, estado de gravação e mensagens de falha.

## Persistência

Migração `20261009000000_workspace_flows.sql` aplicada no projeto `vssghglrtxqkfpsdfeik`; histórico remoto retornou três migrações. RPCs `save_email_template` e `prepare_offer` são security invoker: preservam RLS e papéis. Modelo/versão e operação/oferta/versão/destinatários são gravados atomicamente. Destinatário indisponível, duplicado ou lista vazia provoca rollback. Edição de contato não modifica destinos de ofertas já preparadas.

## Arquivos

O navegador calcula SHA-256 e solicita metadados e autorização de upload à Server Action autenticada. O arquivo vai diretamente ao Supabase, sem passar pelo corpo da requisição à Vercel. Bucket continua privado e limitado a 25 MiB. Upload usa caminho único e não permite sobrescrever. Download força anexo, evitando executar HTML enviado como conteúdo da aplicação.

Se a transferência falha após criar metadados, o registro permanece visível e oferece reenvio para o mesmo caminho, exigindo o mesmo tamanho e hash declarado. Ainda não há uma transação distribuída entre Postgres e Storage; hash calculado pelo navegador não constitui verificação independente do conteúdo armazenado. Verificação posterior e reconciliação automática ficam para a etapa de integridade dos arquivos. O link de download informa quando o arquivo ainda não foi recebido.

## Verificação

14 testes Node passaram; foram adicionados testes SQL de versionamento imutável e preparação atômica, incluindo viewer sem escrita, contato de outra organização, lista nula/vazia, duplicatas, rollback e snapshot de destinatário. TypeScript/build Next.js passaram; auditoria de dependências de produção não encontrou vulnerabilidades. Rota privada sem sessão redirecionou ao login. No Chrome, as quatro telas demonstrativas foram inspecionadas; alteração do assunto atualizou a prévia e seleção de contato atualizou a contagem.

Capturas: [oferta](design/oferta-re-ofertas.jpg) e [contatos](design/oferta-re-contatos.jpg). Não foram criadas contas de usuário, ofertas reais, contatos privados hospedados ou enviadas mensagens nesta rodada. Escrita via sessão real e upload/download hospedado aguardam ensaio com uma conta autorizada.

## Continuidade

Importação com prévia de XLSX/CSV, exportação de pacote por contrato, edição/versionamento de ofertas já preparadas, anexos vinculados à versão exata, editor HTML/assinatura rica, integração Outlook e curadoria regulatória continuam pendentes. Listagens privadas ainda dependem do limite padrão da API; paginação e busca no servidor serão necessárias antes de bases maiores. Vercel e workflow remoto seguem pendentes de publicação/associação.


## Ampliação atual: portal de propostas e renovações

A rota principal de operação é `/workspace/propostas`; as rotas `/workspace/ofertas` continuam como redirecionamentos. O cadastro da proposta vem antes do e-mail, e o detalhe prepara novas versões sem reabrir/reescrever o processo anterior. Tipo, vigência, prazo, linha e ligação de renovação são persistidos. [Telas, regras e limites atualizados](portal-propostas-e-renovacoes.md).

Novas respostas exigem comprovante ligado ao destinatário e objeto recebido no Storage; metadados com upload pendente não bastam. Registros legados sem arquivo permanecem identificados como pendentes. A classificação e suas revisões têm histórico por proposta e não concluem o negócio automaticamente. Consulta pública transferida para `/resseguradoras`; `/` apresenta o portal.
