# Tarefas do Oferta Re

Atualização: 08/10/2026. `[x]` indica implementação e verificação concluídas; `[ ]` indica trabalho pendente. Plano em [Plano de execução](plano-execucao.md).

## Entrega 1: integridade e consulta

- [x] E1-01: revisar escopo e consolidar plano/critério de aceite.
- [x] E1-02: validar identificação, campos, categorias e duplicatas antes de comparar.
- [x] E1-03: rejeitar queda parcial suspeita e preservar baseline/base atual em falha.
- [x] E1-04: registrar manifesto de sucesso/falha com UTC, origem, contagens e evidência.
- [x] E1-05: aplicar identidade Oferta Re e remover promessa de alertas inexistentes.
- [x] E1-06: busca nome/CNPJ, filtro, exportação e identificadores como texto.
- [x] E1-07: aviso de dado antigo/falha e rótulos de ausência na coleta.
- [x] E1-08: testes de comparação/pipeline e interação da consulta, CI e dependências reproduzíveis.
- [x] E1-09: separar parsing/navegação, salvar HTML de evidência e testar mudanças de layout.
- [ ] E1-10: concluir verificação no runner GitHub após publicar a correção. Coleta ao vivo local e diagnóstico dos logs concluídos; deploy ainda não verificado.

## Entrega 2: domínio e acesso

- [x] E2-01: esquema relacional e duas migrações aplicadas no Supabase.
- [x] E2-02a: implementar Supabase Auth, papéis e políticas por organização/objeto; testes SQL de isolamento.
- [ ] E2-02b: validar duas contas reais, confirmação de e-mail e sessões no domínio de produção.
- [x] E2-03a: frontend Next.js/shadcn, catálogo conectado e tokens Oferta Re.
- [ ] E2-03b: associar Vercel, configurar domínio/callback e verificar deploy.
- [x] E2-04a: bucket privado, políticas por metadados e documentos originais imutáveis.
- [ ] E2-04b: upload/download hospedado e ensaio de backup/restauração.

## Entrega 3: contatos e modelos

- [x] E3-01a: tela de cadastro/edição privada, vínculo à entidade e especialidades.
- [ ] E3-01b: ensaio de cadastro via conta real hospedada.
- [ ] E3-02: importar XLSX/CSV com prévia, mapeamento, duplicatas e confirmação.
- [x] E3-03a: exportação CSV autenticada e edição de contatos.
- [ ] E3-03b: ensaio hospedado de exportação e bases maiores.
- [x] E3-04a: biblioteca/editor em texto simples, assinatura e versões imutáveis.
- [ ] E3-04b: substituição de campos e assinatura rica.

## Entrega 4: ofertas

- [ ] E4-01: operações/contratos, termos e versões de oferta.
- [x] E4-02a: seleção de contatos, contagem e bloqueio de lista vazia na preparação.
- [ ] E4-02b: painel de pendências por empresa e versão.
- [ ] E4-03: anexos, prévia e preservação do conteúdo do lote.

## Entrega 5: Outlook e evidências

- [ ] E5-01: confirmar conta Outlook e testar criação de rascunhos/formatação/assinatura.
- [ ] E5-02: lote de rascunhos com idempotência e reconciliação de falhas.
- [x] E5-03a: telas de upload privado, vínculo e classificação de respostas.
- [ ] E5-03b: ensaio real de upload/download e reconciliação de falhas.
- [ ] E5-04: histórico e exportação de originais/índice por operação.

## Entrega 6: regulação e piloto

- [ ] E6-01: cadastro/revisão manual de fontes, vigência e referências de multa.
- [ ] E6-02: histórico normativo e referência versionada da operação.
- [ ] E6-03: avaliações técnicas e tarefas com usuários para TCC/piloto.
- [ ] E6-04: plano comercial, onboarding e cobrança após validar demanda.

## Registro da execução

Planejamento concluído e primeira entrega implementada localmente. 11 testes offline passaram em Python 3.14.8; pip check sem conflitos. Coleta pública em 08/10/2026: 135 registros (15 locais, 25 admitidas, 95 eventuais). Workflow atualizado, ainda sem execução remota desta versão. Dependências diretas fixadas; lock transitivo permanece pendente.

## Migração executada

Fundação no Supabase, 135 registros públicos, endpoint restrito e segredos do coletor no GitHub configurados. 13 testes Python e 12 testes Node passaram; TypeScript e build de produção passaram. Consulta verificada no Chrome. O workflow ainda não foi publicado e Vercel ainda não foi associada. Detalhes em [Migração](migracao-supabase-vercel.md).

Telas operacionais implementadas; critérios e limites em [Telas e fluxos](telas-e-fluxos.md). Terceira migração aplicada; 14 testes Node e build passaram.

## Identidade revisada pelo autor

- [x] Recriar mascote Stitch em SVG com fundo transparente.
- [x] Aplicar azul/verde/ciano aos tokens, marca, favicon, estados e consulta legada.
- [x] Revisar catálogo em desktop e mobile 390/320 px; registrar capturas e origem para TCC.

Build e 14 testes Node passaram. Detalhes em [Identidade](identidade-oferta-re.md).

## SaaS por empresa e setores

- [x] Registrar empresa como tenant e compartilhamento interno escolhido pelo autor.
- [x] Exibir entrada individual e ambiente da empresa.
- [x] Criar setores Treaty/Facultativo/Outra e vínculo múltiplo de pessoas.
- [x] Implementar convites com e-mail confirmado, hash, prazo, uso único e revogação de convites.
- [x] Incluir setor responsável em contatos/modelos/operações e filtros.
- [x] Aplicar quarta migração e validar isolamento/convites com 16 testes Node.
- [ ] Ensaiar convites, cadastro e equipe com contas reais hospedadas.
- [ ] Implementar revogação de acesso de membros aceitos e alteração auditada de papéis.
- [ ] Definir e implementar planos, cobrança, limites e suspensão de assinatura.

Detalhes: [Empresas e setores](saas-empresas-e-setores.md).


## Ativação da empresa (DEC-021)

- [x] A1: formulário em etapas com cadastro mínimo, rotina opcional e revisão.
- [x] A2: salvar/retomar progresso, conclusão e edição de empresa existente.
- [x] A3: áreas múltiplas, setores livres, catálogo de linhas e associação muitos-para-muitos.
- [x] A4: perfil comercial restrito ao responsável/admin; transação, RLS e controle de revisão.
- [x] A5: migração aplicada ao Supabase, navegação após criação da empresa e próximos passos.
- [x] A6: demonstração interativa, testes PostgreSQL/validação, TypeScript/build e revisão desktop/mobile.
- [x] A7: registrar escopo aprovado, decisão, evidências e limitações para o TCC.
- [ ] A8: ensaio hospedado com conta real, retomada após logout/login e dois administradores simultâneos.
- [ ] A9: associar linhas de negócio a contatos/modelos/operações e criar filtros correspondentes.
- [ ] A10: identidade da empresa por upload de logo, importação de contatos e contratação/cobrança.


## Rastreio Outlook e respostas (DEC-023)

- [x] O1: confirmar Microsoft 365 individual e registrar fluxo de negócio/auditoria.
- [x] O2: núcleo de correlação com testes de ambiguidade, versões e isolamento.
- [ ] O3: registro de app Microsoft, conta de teste autorizada, OAuth e tokens no servidor.
- [ ] O4: sincronização de envios/respostas, pastas, cursores e deduplicação.
- [ ] O5: arquivamento MIME/EML, confirmação de armazenamento e checksum no servidor.
- [ ] O6: exigir comprovante efetivamente recebido para resposta arquivada; manter notas/pendências distintas.
- [ ] O7: timeline por versão/mercado, revisão de vínculo e classificação, histórico de correções.
- [ ] O8: testes de integração, reconciliação de falhas e política de retenção/exportação no piloto.


## Portal de propostas e renovações (DEC-024)

- [x] P1: atualizar posicionamento/página inicial e manter consulta SUSEP como apoio.
- [x] P2: cadastro de negócio independente de e-mail, com tipo, cedente, risco, linha, setor, vigência e prazo.
- [x] P3: lista/pipeline, busca, filtros e indicadores operacionais de prazos e vigências.
- [x] P4: renovação vinculada, sem sobrescrever ou herdar condições/envios/respostas anteriores.
- [x] P5: ofertas e novas versões no mesmo processo com snapshots e gravação atômica.
- [x] P6: acompanhamento, encerramento com motivo, revisão concorrente e eventos imutáveis ao cliente.
- [x] P7: exigir arquivo recebido para novas respostas e guardar histórico de classificação.
- [x] P8: migração Supabase aplicada, compatibilidade de rotas antigas e demo de carteira/detalhe.
- [x] P9: testes SQL/calendário, TypeScript/build e documentação das decisões para TCC.
- [ ] P10: homologar gravação pelo formulário e ciclo completo com conta/caixa de teste autorizadas.
- [ ] P11: integração Outlook de rascunhos, envios reais e captura automática de respostas.
- [ ] P12: condições estruturadas/quadros por mercado e campos financeiros por versão, conforme exemplos aprovados.
- [ ] P13: responsável por pessoa, tarefas, aprovações, agenda e notificações entregues.
- [ ] P14: pacote de auditoria, retenção/restauração, importação autorizada e contratação/cobrança.
