# Estado do projeto

Atualizado em 17/11/2026. O site é uma aplicação React, TypeScript e Vite com painel administrativo e função de cadastro no Supabase.

## Produção

- Site: `https://personal-mancilha-site.vercel.app/`
- Página de links: `/linkbio`; painel autenticado: `/admin`.
- O Supabase é a fonte principal dos cadastros; a planilha Google é uma cópia auxiliar de melhor esforço.
- O CRM oferece alunos e leads, agenda, financeiro e permuta. Permuta mantém o aluno ativo sem mensalidade, vencimento, cobrança ou baixa fictícia.
- O formulário chama a Edge Function `insert-aluno`; a chave de idempotência mantém a mesma tentativa em novas chamadas do formulário atual.
- A seção pública antiga de depoimentos e imagens de clientes foi retirada. Não a restaure sem conteúdo apropriado e autorização das pessoas envolvidas.

## Banco de dados

As migrações no diretório `supabase/migrations` correspondem às versões já registradas em produção: `20261110131739` e `20261117184202`. A migração inicial é histórica e não deve ser reaplicada manualmente. Leia `docs/superpowers/runbooks/crm-release.md` antes de qualquer mudança.

Há dados reais de alunos, inclusive informações de saúde. Use ambientes isolados e dados fictícios para testar; não limpe ou modifique dados de produção como teste. Nunca coloque segredos, backups ou tokens no repositório.

## Comandos

`npm install`, `npm run dev`, `npm test`, `npm run lint` e `npm run build`. A configuração depende das variáveis descritas em `.env.example`. O build da Vercel lê variáveis do ambiente; não inclua chaves privadas no frontend.

## Manutenção

Guarde backups fora do repositório e verifique a restauração antes de depender deles. Consulte o runbook para orientações de acesso, financeiro e publicação. Alterações de esquema precisam ser compatíveis com o frontend e o código da Edge Function.
