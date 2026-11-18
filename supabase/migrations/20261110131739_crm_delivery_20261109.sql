begin;

-- The reviewed live project has exactly one Auth user. Attach that account to
-- the single-trainer tenant and mark it admin before tightening CRM policies.
do $$
declare
  v_user record;
  v_tenant_id uuid;
  v_user_count integer;
begin
  select count(*) into v_user_count from auth.users;
  if v_user_count > 1 then
    raise exception 'Expected at most one existing Auth user for the single-trainer setup; found %; review admin mapping.', v_user_count;
  end if;
  if v_user_count = 1 then
    select id, email, raw_user_meta_data into v_user from auth.users limit 1;
    select id into v_tenant_id from public.tenants where lower(email) = lower(v_user.email) order by created_at limit 1;
    if v_tenant_id is null then
      insert into public.tenants (nome_personal, email)
      values (coalesce(nullif(v_user.raw_user_meta_data->>'full_name', ''), 'Personal Trainer'), v_user.email)
      returning id into v_tenant_id;
    end if;
    insert into public.profiles (id, tenant_id, role)
    values (v_user.id, v_tenant_id, 'admin'::public.user_role)
    on conflict (id) do update set tenant_id = excluded.tenant_id, role = 'admin'::public.user_role;
    update public.alunos set tenant_id = v_tenant_id where tenant_id is null;
    update public.agendamentos set tenant_id = v_tenant_id where tenant_id is null;
    update public.faturas set tenant_id = v_tenant_id where tenant_id is null;
  end if;
end;
$$;

-- Leads não possuem vencimento até serem convertidos em alunos ativos.
alter table public.alunos
  alter column dia_vencimento drop not null,
  alter column dia_vencimento drop default,
  alter column tenant_id set default public.get_user_tenant_id();

-- O painel envia observações e cria agendamentos no tenant do usuário.
alter table public.agendamentos
  add column if not exists observacoes text,
  alter column tenant_id set default public.get_user_tenant_id(),
  alter column status set default 'AGENDADO';
do $$
begin
  if exists (select 1 from public.agendamentos where status not in ('CONFIRMED', 'AGENDADO', 'CONCLUIDO', 'FALTOU', 'CANCELADO')) then
    raise exception 'Existem status de agenda desconhecidos; revise-os antes da migração.';
  end if;
end;
$$;
update public.agendamentos set status = 'AGENDADO' where status = 'CONFIRMED';

create or replace function public.is_crm_admin()
returns boolean language sql stable security definer
set search_path = pg_catalog, public
as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'::public.user_role);
$$;
revoke all on function public.is_crm_admin() from public, anon;
grant execute on function public.is_crm_admin() to authenticated, service_role;

-- The form may create leads only through the Edge Function. Keep student
-- self-read rules while restricting CRM operations to the administrator.
drop policy if exists "Permitir acesso total para admin autenticado" on public.alunos;
drop policy if exists "Personal visualiza apenas os seus alunos" on public.alunos;
drop policy if exists "alunos_delete_admin_autenticado" on public.alunos;
drop policy if exists "alunos_select_admin_autenticado" on public.alunos;
drop policy if exists "alunos_update_admin_autenticado" on public.alunos;
drop policy if exists "Permitir envio público de anamnese" on public.alunos;
drop policy if exists "alunos_insert_publico_anamnese" on public.alunos;
drop policy if exists "crm_admin_all_alunos" on public.alunos;
create policy "crm_admin_all_alunos" on public.alunos
  for all to authenticated using (public.is_crm_admin()) with check (public.is_crm_admin());

drop policy if exists "Personal gerencia agenda do seu tenant" on public.agendamentos;
drop policy if exists "crm_admin_all_agendamentos" on public.agendamentos;
create policy "crm_admin_all_agendamentos" on public.agendamentos
  for all to authenticated using (public.is_crm_admin()) with check (public.is_crm_admin());

drop policy if exists "Personal gerencia faturas do seu tenant" on public.faturas;
drop policy if exists "crm_admin_all_faturas" on public.faturas;
create policy "crm_admin_all_faturas" on public.faturas
  for all to authenticated using (public.is_crm_admin()) with check (public.is_crm_admin());
revoke all on table public.alunos, public.faturas, public.agendamentos from public, anon;
grant select, insert, update, delete on table public.alunos, public.faturas, public.agendamentos to authenticated;

-- Idempotency is persisted transactionally with the student row.
create table if not exists public.lead_submission_attempts (
  request_id uuid primary key,
  aluno_id uuid not null references public.alunos(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.lead_submission_attempts enable row level security;
revoke all on table public.lead_submission_attempts from public, anon, authenticated;
grant select, insert, delete on table public.lead_submission_attempts to service_role;

create or replace function public.insert_lead_idempotent(p_request_id uuid, p_payload jsonb)
returns jsonb language plpgsql security definer
set search_path = pg_catalog, public
as $$
declare
  v_aluno public.alunos%rowtype;
  v_existing_id uuid;
  v_tenant_id uuid;
begin
  if p_request_id is null then raise exception 'request id required'; end if;
  select tenant_id into v_tenant_id from public.profiles where role = 'admin'::public.user_role order by created_at limit 1;
  select aluno_id into v_existing_id from public.lead_submission_attempts where request_id = p_request_id;
  if found then
    select * into v_aluno from public.alunos where id = v_existing_id;
    return jsonb_build_object('ok', true, 'data', to_jsonb(v_aluno), 'duplicate', true);
  end if;

  insert into public.alunos (
    tenant_id, nome, idade, whatsapp, objetivo, goal_details, frequency, has_injury,
    injury_details, rotina, preferencia, status, origem, whatsapp_link
  ) values (
    v_tenant_id, left(trim(coalesce(p_payload->>'nome', '')), 120), nullif(p_payload->>'idade', '')::integer,
    p_payload->>'whatsapp', nullif(left(trim(coalesce(p_payload->>'objetivo', '')), 120), ''),
    nullif(left(trim(coalesce(p_payload->>'goal_details', '')), 1000), ''),
    nullif(left(trim(coalesce(p_payload->>'frequency', '')), 80), ''),
    lower(coalesce(p_payload->>'has_injury', 'false')) in ('true', 't', '1', 'yes', 'sim'),
    nullif(left(trim(coalesce(p_payload->>'injury_details', '')), 2000), ''),
    nullif(left(trim(coalesce(p_payload->>'rotina', '')), 2000), ''),
    nullif(left(trim(coalesce(p_payload->>'preferencia', '')), 500), ''),
    'NOVO_LEAD', 'anamnese-site', nullif(p_payload->>'whatsapp_link', '')
  ) returning * into v_aluno;

  insert into public.lead_submission_attempts (request_id, aluno_id)
  values (p_request_id, v_aluno.id) on conflict (request_id) do nothing;
  if not found then
    delete from public.alunos where id = v_aluno.id;
    select aluno_id into v_existing_id from public.lead_submission_attempts where request_id = p_request_id;
    select * into v_aluno from public.alunos where id = v_existing_id;
    return jsonb_build_object('ok', true, 'data', to_jsonb(v_aluno), 'duplicate', true);
  end if;
  return jsonb_build_object('ok', true, 'data', to_jsonb(v_aluno), 'duplicate', false);
end;
$$;
revoke all on function public.insert_lead_idempotent(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.insert_lead_idempotent(uuid, jsonb) to service_role;

-- The live table is missing columns consumed by the UI. Convert its legacy
-- textual injury flag to boolean while preserving affirmative variants.
update public.alunos
set injury_details = coalesce(
  nullif(injury_details, ''),
  nullif(substring(has_injury from '^\s*Sim\s*[—-]\s*(.+)$'), '')
)
where lower(trim(coalesce(has_injury, ''))) like 'sim%';
alter table public.alunos alter column has_injury type boolean
  using lower(trim(coalesce(has_injury, ''))) in ('true', 't', '1', 'yes', 'sim') or lower(trim(coalesce(has_injury, ''))) like 'sim%';
alter table public.faturas
  add column if not exists mes_referencia text,
  add column if not exists data_pagamento timestamptz,
  add column if not exists observacao text,
  add column if not exists registrado_em timestamptz,
  add column if not exists registrado_por uuid references auth.users(id);
create unique index if not exists faturas_aluno_mes_referencia_uidx
  on public.faturas (aluno_id, mes_referencia) where mes_referencia is not null;

create or replace function public.record_current_month_payment(p_aluno_id uuid)
returns jsonb language plpgsql security definer
set search_path = pg_catalog, public
as $$
declare
  v_aluno public.alunos%rowtype;
  v_fatura public.faturas%rowtype;
  v_month_start date := date_trunc('month', timezone('America/Sao_Paulo', now()))::date;
  v_today date := timezone('America/Sao_Paulo', now())::date;
  v_due_date date;
  v_month_ref text;
  v_tenant_id uuid;
  v_previously_paid boolean := false;
begin
  if not public.is_crm_admin() then raise exception 'admin authorization required'; end if;
  select * into v_aluno from public.alunos where id = p_aluno_id for update;
  if not found or v_aluno.status <> 'ATIVO' then raise exception 'active student not found'; end if;
  if v_aluno.mensalidade is null or v_aluno.mensalidade <= 0 then raise exception 'monthly fee must be configured'; end if;
  if v_aluno.dia_vencimento is null or v_aluno.dia_vencimento < 1 or v_aluno.dia_vencimento > 31 then raise exception 'due day must be configured'; end if;
  select tenant_id into v_tenant_id from public.profiles where id = auth.uid();
  v_tenant_id := coalesce(v_aluno.tenant_id, v_tenant_id);
  if v_tenant_id is null then raise exception 'CRM tenant is not configured'; end if;
  v_month_ref := to_char(v_month_start, 'MM/YYYY');
  v_due_date := (v_month_start + (least(v_aluno.dia_vencimento, extract(day from (v_month_start + interval '1 month - 1 day'))::integer) - 1) * interval '1 day')::date;

  select * into v_fatura from public.faturas where aluno_id = p_aluno_id and mes_referencia = v_month_ref for update;
  v_previously_paid := found and v_fatura.status = 'PAID'::public.fatura_status;
  if not found then
    insert into public.faturas (tenant_id, aluno_id, mes_referencia, valor, data_vencimento, data_pagamento, status, observacao, registrado_em, registrado_por)
    values (v_tenant_id, p_aluno_id, v_month_ref, v_aluno.mensalidade, v_due_date, now(), 'PAID'::public.fatura_status,
      'Baixa integral registrada pelo CRM', now(), auth.uid()) returning * into v_fatura;
  elsif not v_previously_paid then
    update public.faturas set valor = v_aluno.mensalidade, data_vencimento = v_due_date, data_pagamento = now(),
      status = 'PAID'::public.fatura_status, observacao = 'Baixa integral registrada pelo CRM',
      registrado_em = now(), registrado_por = auth.uid()
    where id = v_fatura.id returning * into v_fatura;
  end if;
  if not v_previously_paid then
    update public.alunos set ultimo_pagamento_data = v_today, updated_at = now() where id = p_aluno_id;
  end if;
  select * into v_aluno from public.alunos where id = p_aluno_id;
  return jsonb_build_object('ok', true, 'duplicate', v_previously_paid, 'aluno', to_jsonb(v_aluno), 'fatura', to_jsonb(v_fatura));
end;
$$;
revoke all on function public.record_current_month_payment(uuid) from public, anon;
grant execute on function public.record_current_month_payment(uuid) to authenticated;

-- Security-definer helpers are not API endpoints for public or signed-in users.
alter function public.get_user_tenant_id() set search_path = pg_catalog, public;
revoke all on function public.get_user_tenant_id() from public, anon;
grant execute on function public.get_user_tenant_id() to authenticated, service_role;
revoke all on function public.rls_auto_enable() from public, anon, authenticated;

commit;
