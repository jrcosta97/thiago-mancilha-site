# Entrega do site e CRM do Thiago

## Objetivo

Entregar em uma única publicação um site e painel confiáveis para captar leads, convertê-los em alunos, organizar aulas e acompanhar mensalidades. Antes de publicar, validar os fluxos possíveis com dados fictícios e mostrar a versão candidata ao responsável.

## Estado conhecido

- O Supabase está ativo e a Edge Function `insert-aluno` versão 6 foi publicada.
- A planilha recebeu fichas de teste; ela é uma cópia auxiliar. O Supabase é a fonte oficial.
- O frontend corrigido ainda não foi publicado. Uma prévia isolada compilou com a correção da captação e ajustes mínimos de tipagem no painel.
- `src/pages/AdminDashboard.tsx` contém alterações locais anteriores com agenda e histórico; preservar essas alterações e avaliá-las antes de incorporá-las à entrega.
- Os testes de envio feitos quando o banco estava indisponível chegaram à planilha, mas não foram encontrados no Supabase.

## Escopo da entrega

1. Publicar o frontend atualizado e garantir que o formulário só confirme sucesso após o Supabase confirmar a gravação. Se falhar, permitir contato alternativo por WhatsApp e não informar sucesso indevido.
2. Manter a planilha como cópia auxiliar. A integração atual é de melhor esforço: não confirma gravação, nem garante repetição automática. A entrega deve tornar essa limitação visível ao operador e permitir reconciliação sem depender da planilha como fonte oficial; uma fila confiável é evolução posterior, salvo decisão diferente.
3. Revisar autenticação, usuários e permissões reais das tabelas, incluindo acesso anônimo e usuário autenticado sem autorização. Proteger dados de saúde e remover logs pessoais desnecessários.
4. Tornar a baixa financeira atômica e auditável: registrar operador, data do registro, data efetiva, competência e valor; impedir duplicação e divergência entre aluno e fatura.
5. Rever a agenda existente, corrigir conversão de horário e datas em `America/Sao_Paulo`, e validar criação, edição, situação e vínculo com aluno.
6. Preparar build e prévia, validar o fluxo completo com dados fictícios, e publicar a versão aprovada. Documentar operação, recuperação e limitações.

## Regras financeiras acordadas

- Nesta entrega, a baixa é integral e corresponde à competência do mês atual. Não implementar pagamentos parciais nem baixa de competências anteriores.
- Preservar o histórico de faturas anteriores para consulta; valores antigos não devem ser sobrescritos silenciosamente ao repetir uma baixa.
- Se o dia de vencimento não existir no mês, usar o último dia do mês. O atraso começa no dia seguinte ao vencimento efetivo.
- Distinguir mensalidade prevista, valores efetivamente recebidos e valores vencidos. Não chamar a soma de mensalidades dos alunos ativos de dinheiro recebido.
- Tratar PIX como configuração a definir pelo responsável, sem incluir chave desconhecida na mensagem.

## Critérios de aceite

- Um lead fictício confirmado no formulário aparece uma única vez como `NOVO_LEAD` no Supabase e no painel; falha de gravação não mostra sucesso. Testar repetição após perda de resposta, além de clique duplo, usando identificação idempotente da tentativa.
- Um acesso não autorizado não consegue ler ou alterar dados do CRM. As permissões são verificadas no banco, além da proteção visual do painel.
- Uma baixa atualiza os registros financeiros em uma transação; erro ou repetição não deixa dados divergentes nem altera histórico silenciosamente.
- Vencimentos de fim de mês e aulas próximas da meia-noite apresentam data e horário corretos para São Paulo.
- Build passa na versão candidata; login, logout, cadastro, conversão, agenda, baixa e exibição no celular são conferidos com dados fictícios.
- O deploy candidato usa o projeto e domínio corretos, e há procedimento de retorno à versão anterior antes da liberação.

## Abordagens consideradas

- Entregas graduais: libera a captação mais cedo, mas não corresponde à preferência expressa para esta entrega.
- Entrega única: integra e valida todos os fluxos antes de publicar. É a opção escolhida; requer preservar o estado atual e usar uma prévia para revisão.

## Limites e decisões de execução

- Não reescrever o sistema nem adicionar automações comerciais complexas nesta entrega.
- Não apagar dados existentes nem modificar políticas de produção sem inspeção, plano de recuperação e validação adequada.
- Não tratar pagamento parcial, competências passadas ou planilha auxiliar como fonte de verdade.
- Confirmar ambiente de teste seguro, disponibilidade de backup/restauração, critérios de autorização e mecanismo de sincronização da planilha durante o planejamento técnico.
- Definir a criação de faturas pendentes da competência atual e a conciliação dos dados legados sem inventar dívidas de meses anteriores. A regra deve refletir datas de entrada e situação efetiva dos alunos.
- Identificar administradores autorizados pelas permissões existentes e validar com contas de teste; escolher uma forma de teste que não exponha nem altere dados reais indevidamente.
- A prévia enxuta anterior excluiu as alterações locais de agenda e histórico. Avaliar e incorporar conscientemente essas alterações à versão candidata antes dos testes da entrega única.
- Os registros de teste deverão ser identificáveis e sua remoção planejada; não exigir o compartilhamento de senhas ou chaves privadas no chat.
