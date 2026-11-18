# Runbook de entrega do CRM

Este runbook cobre o CRM de personal trainer. O Supabase é a fonte oficial dos dados; a planilha Google é uma cópia auxiliar. Como o envio da planilha usa `no-cors`, o navegador não consegue confirmar que a linha foi gravada.

## Estado confirmado em 17/11/2026

- A entrega inicial e a opção de permuta já foram aplicadas em produção. As versões registradas no Supabase são `20261110131739` (`crm_delivery_20261109`) e `20261117184202` (`crm_pagamento_permuta`); os nomes dos arquivos locais correspondem a essas versões. Não reexecute a migração inicial em produção.
- A migração inicial é histórica e pressupunha no máximo uma conta Auth. Atualmente há mais de uma conta, portanto ela não serve como procedimento para adicionar administradores.
- Permuta é uma modalidade explícita: o aluno continua ativo sem mensalidade e vencimento, não entra na cobrança nem gera pagamento fictício. A modalidade só deve ser atribuída mediante confirmação do responsável.
- Antes de novas mudanças, faça backup atualizado, verifique as migrações já aplicadas e teste a alteração com dados fictícios. A Edge Function `insert-aluno` e as variáveis da Vercel precisam continuar alinhadas com o projeto correto.

## Histórico: preparação da entrega inicial

1. O painel do projeto informou que o plano gratuito não inclui backups automáticos. Um backup lógico foi exportado em 10/11/2026 e testado em banco local isolado. Antes de publicar, atualize o backup para incluir novos registros e confirme quem poderá restaurá-lo. O roteiro `scripts/backup-supabase-local.ps1` pede a senha do banco diretamente no terminal e salva os arquivos fora do repositório. O Supabase CLI `db dump` requer Docker; objetos do Storage e Edge Functions exigem cuidados separados. Guarde o backup com acesso restrito.
2. Confirme que a conta Auth existente ainda é a única. A migração para se encontrar mais de uma conta; com uma conta, ela cria/atualiza o perfil administrativo e associa registros sem `tenant_id` ao tenant do personal.
3. Revise a migração e os valores textuais existentes em `alunos.has_injury`. A migração copia detalhes de lesão afirmativos como `Sim — ...` para `injury_details` antes de converter o campo para booleano.
4. A migração foi executada em Supabase local com PostgreSQL 17 e dados fictícios; passaram testes de lead, autenticação e permissões básicas, agenda, pagamento repetido e reversão após erro forçado. A função local do formulário também foi exercitada pela API. O backup foi restaurado em um banco local sem rede e a migração passou também nessa cópia: quantidades, dados de lesão e acesso básico foram conferidos. Por diferenças entre versões, nove tabelas internas comprovadamente vazias foram omitidas apenas na cópia usada no teste. O backup original permaneceu intacto; confira essas diferenças e o processo de restauração antes da publicação.
5. A migração permite `dia_vencimento` vazio para leads. Para alunos ativos com mensalidade normal, o painel exige vencimento; a modalidade de permuta não exige cobrança ou vencimento.
6. A migração adiciona observações à agenda, usa o tenant do administrador como padrão em cadastros e agendamentos, e converte o antigo status `CONFIRMED` para `AGENDADO`. Ela interrompe a aplicação se encontrar outro status de agenda desconhecido. Confira novamente os dados antes da publicação.

## Verificação do cadastro de lead

1. Use um nome e telefone fictícios reservados para teste. Não informe dados reais de saúde.
2. Envie o formulário uma vez. Confirme que a tela só exibe sucesso depois de a Edge Function retornar o id do registro.
3. Repita a mesma chamada com a mesma `Idempotency-Key`; confirme que o mesmo id é retornado e que não surge outro aluno.
4. Altere os dados e envie com uma nova chave; confirme que é criado outro lead com status `NOVO_LEAD`, mesmo que a chamada tente enviar outro status.
5. Simule uma resposta perdida e tente novamente sem alterar os dados. Confirme que o navegador reutiliza a chave da tentativa. Se o Supabase estiver indisponível, o formulário deve mostrar erro e oferecer o contato por WhatsApp, sem indicar sucesso.
6. Trate a planilha como melhor esforço. Se precisar comprovar a cópia, confira a linha diretamente na planilha. Se ela não existir, reconcilie a partir do lead oficial no Supabase; a ausência na planilha não significa que o cadastro falhou.

## Acesso ao CRM

1. Confirme que a conta administrativa consegue entrar e consultar/alterar alunos, faturas e agendamentos.
2. Com a chave pública sem autenticação, confirme que `SELECT`, `INSERT`, `UPDATE` e `DELETE` em `alunos`, `faturas` e `agendamentos` são negados.
3. Com uma conta autenticada que não seja admin, confirme que as mesmas operações são negadas, exceto a leitura própria permitida para registros vinculados ao aluno.
4. Confirme que somente a Edge Function com service role consegue chamar `insert_lead_idempotent`; clientes do navegador não podem executar essa RPC.
5. Depois da migração, revise o Supabase Security Advisor. Avisos já existentes sobre a tabela `tenants`, search_path mutável de outras funções, extensão `pg_trgm` em `public` e proteção contra senhas vazadas devem ser acompanhados separadamente.

## Agenda e pagamentos

1. Em um ambiente seguro, crie e edite agendamentos fictícios às 20:00, 23:30 e em horários próximos à virada de dia/mês. Após recarregar, confirme que a data e hora de São Paulo permanecem iguais.
2. Em ambiente seguro, marque como pago o mês corrente de um aluno de teste ativo. Confirme uma fatura `PAID`, competência corrente, valor integral, vencimento efetivo, `registrado_em` e `registrado_por`.
3. Repita a baixa. Confirme que a mesma fatura e os dados de auditoria originais permanecem.
4. Confirme que vencimentos nos dias 29, 30 e 31 caem no último dia dos meses mais curtos e que o atraso começa no dia seguinte.
5. Não crie dívida de competência passada nem pagamento parcial nesta entrega.

## Histórico: publicação e rollback da entrega inicial

1. No candidato, rode `npm ci`, `npm test`, `npm run lint` e `npm run build`.
2. Publique um preview Vercel a partir do candidato e faça a verificação com dados fictícios.
3. Depois que o banco estiver validado e o backup confirmado, aplique a migração revisada, publique `insert-aluno` incluindo `validation.ts` e então publique o frontend aprovado.
   - A função publicada atualmente aceita envios sem identificador; a nova função gera uma chave para eles durante a transição. Nesses envios antigos, uma repetição não pode ser identificada automaticamente. O site novo envia sua própria chave e mantém a proteção contra repetição.
   - Entre a migração e a troca da função, a função antiga pode gravar leads sem `tenant_id`. Depois da troca, confira se há registros sem tenant e associe-os ao tenant administrativo após revisão.
4. Guarde o id do deployment Vercel anterior e a versão anterior da Edge Function antes da publicação.
5. Se uma verificação falhar, reverta frontend e Edge Function para as versões guardadas. Mantenha o schema aditivo e as políticas RLS restritivas; não restaure as políticas antigas que davam acesso amplo a usuários autenticados. Restaure dados apenas a partir do backup confirmado se o problema exigir.
6. Remova registros fictícios pelos ids exatos usados no teste e confirme que nenhum registro real foi afetado.
