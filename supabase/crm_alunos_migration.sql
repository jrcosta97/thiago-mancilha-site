-- CRM de Gestão de Alunos
-- Execute este script no SQL Editor do Supabase antes de usar
-- mensalidade / dia_vencimento no painel administrativo.

alter table public.alunos
  add column if not exists mensalidade numeric(10,2),
  add column if not exists dia_vencimento integer;

alter table public.alunos
  alter column idade drop not null,
  alter column objetivo drop not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'alunos_dia_vencimento_check'
  ) then
    alter table public.alunos
      add constraint alunos_dia_vencimento_check
      check (dia_vencimento is null or dia_vencimento between 1 and 31);
  end if;
end $$;

comment on column public.alunos.mensalidade is 'Valor mensal do aluno no CRM';
comment on column public.alunos.dia_vencimento is 'Dia do vencimento mensal (1..31)';
