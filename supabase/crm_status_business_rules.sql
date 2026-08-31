-- Regra de negócio do CRM: separar LEADS de ALUNOS
-- Execute este script no SQL Editor do Supabase.

-- 1) Remove constraints antigas que travam a mudança de valores de status
do $$
declare
  c record;
begin
  for c in
    select conname
    from pg_constraint
    where conrelid = 'public.alunos'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%status%'
  loop
    execute format('alter table public.alunos drop constraint if exists %I', c.conname);
  end loop;
end $$;

-- 2) Se o status for ENUM, converte para TEXT (para permitir a nova regra de negócio)
do $$
declare
  status_udt text;
begin
  select udt_name
  into status_udt
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'alunos'
    and column_name = 'status';

  -- Quando for enum, data_type costuma ser USER-DEFINED e o udt_name vem com o nome do type
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'alunos'
      and column_name = 'status'
      and data_type = 'USER-DEFINED'
  ) then
    execute 'alter table public.alunos alter column status type text using status::text';
  end if;
end $$;

-- 3) Normaliza valores antigos → regra nova
update public.alunos
set status = case
  when status = 'ACTIVE' then 'ATIVO'
  when status = 'ARCHIVED' then 'INATIVO'
  when status = 'CONTACTED' then 'EM_NEGOCIACAO'
  when status = 'CONVERTED' then 'ATIVO'
  when status is null or btrim(status) = '' then
    case
      when coalesce(origem, '') ilike '%site%' or coalesce(origem, '') ilike '%anamnese%' then 'NOVO_LEAD'
      else 'ATIVO'
    end
  else status
end
where status in ('ACTIVE', 'ARCHIVED', 'CONTACTED', 'CONVERTED')
   or status is null
   or btrim(status) = '';

-- 4) LEADS/PERDIDOS não carregam cobrança
update public.alunos
set mensalidade = null,
    dia_vencimento = null
where status in ('NOVO_LEAD', 'EM_NEGOCIACAO', 'PERDIDO');

-- 5) Default e constraint nova
alter table public.alunos
  alter column status set default 'NOVO_LEAD';

alter table public.alunos
  add constraint alunos_status_check
  check (status in ('NOVO_LEAD', 'EM_NEGOCIACAO', 'ATIVO', 'INATIVO', 'PERDIDO'));

comment on column public.alunos.status is 'Status de CRM: NOVO_LEAD, EM_NEGOCIACAO, ATIVO, INATIVO ou PERDIDO';
