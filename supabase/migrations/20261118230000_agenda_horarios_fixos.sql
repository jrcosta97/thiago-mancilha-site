begin;

-- Horário fixo: a regra "este aluno treina nestes dias, neste horário".
-- As aulas de um horário fixo NÃO são geradas como linhas: o painel calcula as
-- ocorrências na hora. Só vira linha em public.agendamentos a ocorrência que
-- recebe presença, falta, cancelamento ou observação (horario_fixo_id + data_hora).
create table if not exists public.horarios_fixos (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null default public.get_user_tenant_id() references public.tenants(id) on delete cascade,
  aluno_id uuid not null references public.alunos(id) on delete cascade,
  dias_semana smallint[] not null,
  hora time not null,
  duracao_min smallint not null default 60,
  inicio date not null default (timezone('America/Sao_Paulo', now()))::date,
  fim date,
  ativo boolean not null default true,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint horarios_fixos_dias_validos check (
    cardinality(dias_semana) between 1 and 7
    and dias_semana <@ array[0, 1, 2, 3, 4, 5, 6]::smallint[]
  ),
  constraint horarios_fixos_duracao_valida check (duracao_min between 15 and 240),
  constraint horarios_fixos_periodo_valido check (fim is null or fim >= inicio)
);

create index if not exists horarios_fixos_aluno_idx on public.horarios_fixos (aluno_id);
create index if not exists horarios_fixos_ativos_idx on public.horarios_fixos (tenant_id) where ativo;

alter table public.horarios_fixos enable row level security;
drop policy if exists "crm_admin_all_horarios_fixos" on public.horarios_fixos;
create policy "crm_admin_all_horarios_fixos" on public.horarios_fixos
  for all to authenticated using (public.is_crm_admin()) with check (public.is_crm_admin());
revoke all on table public.horarios_fixos from public, anon;
grant select, insert, update, delete on table public.horarios_fixos to authenticated;

-- Liga uma aula registrada à ocorrência do horário fixo que ela representa.
alter table public.agendamentos
  add column if not exists horario_fixo_id uuid references public.horarios_fixos(id) on delete set null;
create unique index if not exists agendamentos_horario_fixo_ocorrencia_uidx
  on public.agendamentos (horario_fixo_id, data_hora) where horario_fixo_id is not null;

commit;
