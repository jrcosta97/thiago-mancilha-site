begin;
alter table public.alunos add column data_nascimento date;
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
    tenant_id, nome, email, idade, data_nascimento, whatsapp, objetivo, goal_details, frequency, has_injury,
    injury_details, rotina, preferencia, status, origem, whatsapp_link
  ) values (
    v_tenant_id, left(trim(coalesce(p_payload->>'nome', '')), 120), nullif(btrim(p_payload->>'email'), ''), nullif(p_payload->>'idade', '')::integer, nullif(p_payload->>'data_nascimento', '')::date,
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

commit;
