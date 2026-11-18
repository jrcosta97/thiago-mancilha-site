-- Run only in an isolated Supabase branch after 20261109120000_crm_delivery.sql.
begin;
do $$
declare
  v_key uuid := gen_random_uuid();
  v_payload jsonb := jsonb_build_object(
    'nome', 'Lead Ficticio Teste', 'idade', 30, 'whatsapp', '(11) 99999-0000',
    'objetivo', 'Teste', 'frequency', '3 vezes por semana', 'has_injury', false,
    'status', 'ATIVO'
  );
  v_first jsonb;
  v_replay jsonb;
  v_second jsonb;
begin
  v_first := public.insert_lead_idempotent(v_key, v_payload);
  v_replay := public.insert_lead_idempotent(v_key, v_payload);
  v_second := public.insert_lead_idempotent(gen_random_uuid(), v_payload);
  if v_first->'data'->>'id' is distinct from v_replay->'data'->>'id' then
    raise exception 'Same request id created a second student';
  end if;
  if v_replay->>'duplicate' is distinct from 'true' then
    raise exception 'Replay was not marked duplicate';
  end if;
  if v_first->'data'->>'status' is distinct from 'NOVO_LEAD' then
    raise exception 'Client-supplied status was not overridden';
  end if;
  if v_second->'data'->>'id' is not distinct from v_first->'data'->>'id' then
    raise exception 'Distinct request id did not create a distinct lead';
  end if;
end;
$$;
rollback;
