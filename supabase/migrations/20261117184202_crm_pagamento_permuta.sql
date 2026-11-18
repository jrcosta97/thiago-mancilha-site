begin;

alter table public.alunos
  add column if not exists permuta boolean not null default false;

alter table public.alunos
  add constraint alunos_permuta_sem_cobranca
  check (not permuta or (mensalidade is null and dia_vencimento is null));

commit;
