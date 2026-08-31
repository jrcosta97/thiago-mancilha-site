-- Controle financeiro mensal (CRM)
-- Execute este script no SQL Editor do Supabase.

alter table public.alunos
  add column if not exists ultimo_pagamento_data date;

comment on column public.alunos.ultimo_pagamento_data is 'Data do último pagamento registrado (para cálculo de PAGO/PENDENTE/ATRASADO no mês atual)';
