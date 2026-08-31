-- Agenda de Aulas + Histórico Financeiro
-- Execute este script no SQL Editor do Supabase.

create table if not exists public.agendamentos (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references public.alunos(id) on delete cascade,
  data_hora timestamptz not null,
  dia_semana integer generated always as (extract(dow from data_hora)::integer) stored,
  status text not null default 'AGENDADO',
  observacoes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists agendamentos_aluno_id_idx on public.agendamentos(aluno_id);
create index if not exists agendamentos_data_hora_idx on public.agendamentos(data_hora);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'agendamentos_status_check'
  ) then
    alter table public.agendamentos
      add constraint agendamentos_status_check
      check (status in ('AGENDADO', 'CONCLUIDO', 'FALTOU', 'CANCELADO'));
  end if;
end $$;

create table if not exists public.faturas (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references public.alunos(id) on delete cascade,
  mes_referencia text not null,
  valor numeric(10,2) not null,
  data_vencimento date,
  data_pagamento timestamptz,
  status text not null default 'PENDENTE',
  observacao text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists faturas_aluno_id_idx on public.faturas(aluno_id);
create index if not exists faturas_mes_referencia_idx on public.faturas(mes_referencia);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'faturas_status_check'
  ) then
    alter table public.faturas
      add constraint faturas_status_check
      check (status in ('PAGO', 'PENDENTE'));
  end if;
end $$;

create unique index if not exists faturas_aluno_mes_referencia_uidx
  on public.faturas(aluno_id, mes_referencia);

comment on table public.agendamentos is 'Agenda de aulas / treinos por aluno';
comment on table public.faturas is 'Histórico financeiro mensal por aluno';
comment on column public.faturas.data_vencimento is 'Data de vencimento da cobrança mensal';
