# SaaS: empresas, pessoas e setores

Data: 08/10/2026. O autor definiu que cada empresa contratante terá um ambiente próprio e poderá ter vários setores. Após esclarecimento, escolheu **compartilhar contatos, modelos e ofertas dentro da empresa, organizando por setor**. Setores não são barreiras internas de acesso.

## Modelo aprovado

| Camada | Exemplo do autor | Responsabilidade |
| --- | --- | --- |
| Empresa | Latin Re | Ambiente privado e futura unidade de contratação/assinatura |
| Área | Treaty / Facultativo | Agrupamento do setor |
| Setor | Treaty — Soluções Estruturadas; Property; Financial Lines | Organização das pessoas e registros |
| Pessoa | Usuário individual | Login próprio, papel na empresa e vínculo a um ou mais setores |

Latin Re foi mencionada como exemplo; nenhum ambiente dessa empresa foi criado ou dado corporativo importado. A demonstração usa Corretora Exemplo e pessoas fictícias.

A empresa é o tenant: organizações diferentes não compartilham dados privados. Um usuário pode participar de mais de uma empresa mediante convite autorizado e escolher o ambiente. Dentro de cada empresa, os setores acessam a mesma base e filtram pelo setor responsável. Papéis continuam no nível da empresa, sem senha compartilhada.

## Implementado

- Botão **Entrar** para visitantes; **Meu ambiente** para usuários autenticados. Login e cadastro usam conta individual Supabase Auth.
- Entrada em `/workspace`, escolha do ambiente e link para aceitar convite. A criação de ambiente permanece como onboarding de piloto, sem cobrança.
- `/workspace/equipe`: cadastrar setores, classificar área Treaty/Facultativo/Outra, ver equipes, vincular uma pessoa a vários setores, gerar e revogar convites pendentes.
- Papéis: responsável (owner), administrador, colaborador e consulta. Somente responsável/admin gerenciam setores e vínculos. Apenas responsável convida novos administradores. Convites não criam outro responsável nem promovem quem já participa.
- Contatos, modelos e operações recebem setor responsável opcional, com chaves estrangeiras exigindo o mesmo tenant. Registros antigos permanecem sem setor definido.
- Listagens de contatos, modelos e ofertas permitem todos os setores, um setor específico ou sem setor definido. O setor não altera o acesso à base da empresa.
- `/convite`: aceita o código com sessão autenticada e o e-mail confirmado correspondente. O token fica no fragmento do link para não aparecer na URL enviada ao servidor durante navegação.
- Demonstração em `/demonstracao?tela=equipe`: setores e papéis fictícios; preparação demonstrativa de oferta também permite escolher setor.

## Convites

Token aleatório de 256 bits, armazenado somente como SHA-256 no banco. Validade de sete dias, uso único e revogação antes de aceitar. O responsável recebe o link na interface e compartilha por seu canal escolhido. Não há envio automático de e-mail. Token original não é recuperável na listagem: se perdido, crie outro convite e revogue o anterior.

Aceitar convite exige conta com o e-mail confirmado. O colega entra/cria conta, confirma seu e-mail e reabre o link. Quem já participa mantém o papel existente; o convite pode acrescentar vínculo de setor. Esse fluxo não é um mecanismo de alteração de permissões de pessoas existentes.

A listagem administrativa de pessoas usa uma RPC restrita a responsável/admin e retorna somente os membros da empresa solicitada. Usuários comuns não consultam e-mails da tabela interna de autenticação por essa RPC. Nenhum perfil é incluído automaticamente por domínio de e-mail ou pelo nome da empresa.

## Banco e verificação

Migração `20261009010000_company_teams.sql` aplicada no Supabase. Histórico remoto retornou quatro migrações e zero setores cadastrados. Novas tabelas: departments, department_members e organization_invitations, com RLS. RPCs administrativas verificam o papel na organização e vínculos têm chaves compostas. As funções transacionais de modelos/ofertas foram substituídas dentro da migração para aceitar o setor opcional, preservando chamadas anteriores com valor padrão nulo.

16 testes Node passaram. Casos novos incluem compartilhamento interno, isolamento externo de setores/equipe, viewer sem gestão, vínculo de outro tenant rejeitado, e-mail errado/não confirmado, convite expirado/revogado/reutilizado e tentativa de promoção. Testes SQL executam as migrações reais em PGlite com contexto controlado. TypeScript e build passaram. Demonstração inspecionada no Chrome; [captura](design/oferta-re-setores.jpg). Acesso anônimo às três novas tabelas foi rejeitado no Supabase e `/workspace/equipe` sem sessão redirecionou ao login.

Não foram criados usuários nem convites reais nesta etapa. Aceitação e gravação com contas hospedadas ainda precisam de ensaio. Nenhum e-mail de convite ou oferta foi enviado; não houve push nem deploy Vercel.

## Continuidade comercial e administrativa

A estrutura atende ao modelo de empresa e setores solicitado. Contratação, planos, pagamento, limites, cancelamento e suspensão de assinatura ainda não estão implementados. Proposta a validar: assinatura por empresa, com usuários/setores compartilhando a licença, e limites baseados no uso do fluxo operacional. Essa proposta não define preço nem provedor de cobrança.

Antes do piloto comercial: vincular Vercel e domínio Auth; testar duas empresas e múltiplos setores com contas reais; completar revogação de acesso de membros já aceitos e alteração auditada de papéis; recuperação de acesso e SMTP; reconciliar arquivos, ensaiar restauração e validar retenção. A revogação disponível hoje se aplica somente a convites pendentes. Listagens ainda precisam de paginação/busca no servidor para bases maiores.
