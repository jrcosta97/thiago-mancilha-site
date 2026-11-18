# CRM Delivery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish a tested version of the trainer site and CRM with reliable lead capture, verified access controls, consistent monthly billing, and correct agenda behavior.

**Architecture:** Supabase remains the authoritative store. Public capture writes a validated, idempotent lead through the deployed Edge Function; Sheets remains a best-effort copy. Financial state changes move into one database transaction, while the existing React/Vite admin remains the operator interface. Preview and production releases use the connected Vercel project after checks pass.

**Tech Stack:** React 18, TypeScript, Vite 5, Supabase Postgres and Edge Functions, Google Apps Script, Vercel.

**Spec:** `docs/superpowers/specs/2026-11-09-entrega-crm-design.md`

## Global Constraints

- Supabase is the source of truth; Sheets is a best-effort auxiliary copy.
- A public form submission always creates `NOVO_LEAD`; never accept a client-selected CRM status.
- Billing supports integral payment for the current month only; no partial or past-month payments in this delivery.
- When the due day does not exist in a month, use that month's final day; lateness starts the following day.
- Do not invent debts for historical months or silently overwrite payment history.
- Never put service-role keys, passwords, or private tokens in frontend code or chat.
- Preserve the existing local `AdminDashboard.tsx` edits; inspect and intentionally include or exclude agenda/history changes in the candidate.
- Do not alter production data or access policies before inspecting the live schema, existing policies, and recovery options.

## Review Focus

- **Repeated form submission after a lost response:** the same submission attempt must not create duplicate leads; pin this with an Edge Function idempotency test in Task 2.
- **Unauthenticated or authenticated non-admin access:** neither may read or mutate CRM tables; pin this with policy checks and role tests in Task 3.
- **Failure between payment writes or a repeated payment action:** all payment state commits atomically and history remains correct; pin this with transaction tests in Task 4.
- **Due day 29, 30, or 31 in short months:** effective due date is the final calendar day, and lateness starts after it; pin this with date-rule tests in Task 4.
- **Agenda entries near midnight or month boundaries in São Paulo:** rendered and edited local date/time must remain the same; pin this with timezone tests in Task 5.

---

## File and Artifact Map

- `src/components/AnamnesisForm.tsx`: authoritative save confirmation, privacy-safe error handling, auxiliary Sheets dispatch.
- `src/lib/supabase.ts`: typed Edge Function request/result and idempotency key support if needed by existing helper.
- `supabase/functions/insert-aluno/index.ts`: public validation, fixed lead status, server-built fields, idempotent insert response.
- `supabase/migrations/<generated>_*.sql`: admin authorization policy corrections and transactional billing RPC/constraints, only after live schema inspection.
- `src/pages/AdminDashboard.tsx`: payment UI calling the billing transaction; retain only reviewed agenda/history changes required for this release.
- `src/lib/financial-rules.ts` (new if calculation is currently embedded): pure current-competence and due-date rules shared by UI and tests.
- `src/lib/agenda-dates.ts` (new if calculation is currently embedded): explicit São Paulo date/time parse and format functions.
- `src/**/*.test.ts(x)` and `supabase/functions/insert-aluno/*.test.ts`: focused unit/integration coverage; place tests beside current project conventions after inspecting the repository.
- `package.json`, `package-lock.json`: test runner scripts and pinned dev dependencies only if the repository lacks a usable test runner.
- `docs/superpowers/runbooks/crm-release.md` (new): deployment, smoke-check, reconciliation, and rollback procedure.

## Task 1: Establish a safe candidate and reproduce the current failure

**Files:**
- Inspect: `.deliverable-preview/`, `src/pages/AdminDashboard.tsx`, `src/components/AnamnesisForm.tsx`, `vercel.json`, `package.json`
- Create: isolated candidate branch/worktree per `superpowers:using-git-worktrees`
- Test: existing `npm run build`

**Interfaces:**
- Consumes: approved design and current local changes.
- Produces: isolated candidate containing only reviewed changes, with the current production build failure reproduced and recorded.

- [ ] Read-only inspect `git status`, branch, and last Vercel build log; identify user-owned edits before isolating work.
- [ ] Create an isolated worktree from the Vercel-connected `main` commit; copy only the approved capture change and the minimal TypeScript corrections required for the build.
- [ ] Run `npm run build` in the isolated candidate and record the exact result.
- [ ] Decide agenda/history inclusion by reviewing existing diffs and checking that the full candidate compiles; do not bring unrelated finance/agenda edits into the candidate without review.
- [ ] Verify the original workspace's changes remain untouched.

## Task 2: Make public lead capture safe and idempotent

**Files:**
- Modify: `src/components/AnamnesisForm.tsx`, `src/lib/supabase.ts`, `supabase/functions/insert-aluno/index.ts`
- Create: generated Supabase migration only if a database idempotency table/constraint is needed after schema inspection
- Test: Edge Function validation/idempotency tests and form submission tests

**Interfaces:**
- Consumes: existing `insertAlunoViaEdgeFunction` helper and public form payload.
- Produces: one stable submission id per form attempt; endpoint response `{ ok: true, data, duplicate?: true }` after a durable insert or recognized replay.

- [ ] Add tests proving invalid name, age, and WhatsApp are rejected, client-supplied status is ignored, and server output always uses `NOVO_LEAD`.
- [ ] Add a replay test: identical idempotency key creates one row and returns the original result; a different key permits a distinct lead.
- [ ] Implement key generation once per user submission attempt and reuse it across network retries; do not log form payloads or health details.
- [ ] Change the form so success is shown only after a confirmed Supabase response; on error preserve a retry path and WhatsApp fallback.
- [ ] Dispatch the Sheets copy after Supabase confirmation; make the UI copy clearly identify Sheets as auxiliary and best-effort.
- [ ] Run focused tests and verify one successful submission plus one simulated lost-response retry against a non-production dataset.

## Task 3: Verify and enforce CRM authorization

**Files:**
- Inspect: live Supabase policies/grants for `alunos`, `faturas`, `agendamentos`, Auth user settings, and Edge Function configuration.
- Create: generated migration under `supabase/migrations/` only for reviewed policy changes.
- Test: SQL policy tests or controlled API checks for anon, non-admin, and admin users.

**Interfaces:**
- Consumes: live project schema and the agreed admin identity source.
- Produces: documented authorization matrix and policies that allow only approved admins to read/write CRM records; public insert remains limited to the Edge Function.

- [ ] Inspect table grants, RLS state/policies, Auth sign-up settings, admin users, and function service-role behavior before changing anything.
- [ ] Define admin authorization using existing trusted server-side identity data; never use user-editable metadata for authorization.
- [ ] Add tests showing anon and non-admin cannot select, insert, update, or delete CRM rows; admin can perform the required dashboard actions.
- [ ] Apply the reviewed migration to a safe branch/environment, run security advisors, and verify the resulting policies.
- [ ] Apply to production only after confirming backup/recovery availability and recording the exact rollback path.

## Task 4: Make current-month billing atomic and date-correct

**Files:**
- Create: `src/lib/financial-rules.ts` and focused tests if no existing shared module fits.
- Modify: `src/pages/AdminDashboard.tsx`, `src/lib/supabase.ts`
- Create: generated migration for an atomic current-month payment function and necessary constraints after inspecting the live schema.
- Test: financial rule unit tests and database transaction tests.

**Interfaces:**
- Produces database RPC `record_current_month_payment(p_aluno_id uuid, p_paid_at date)` returning the affected student and invoice; all writes commit or roll back together.
- `getEffectiveDueDate(year: number, month: number, dueDay: number): string` returns ISO date using month-end clamping.
- `getFinancialStatus(paymentDate: string | null, effectiveDueDate: string, today: string): 'PAGO' | 'PENDENTE' | 'ATRASADO'` compares calendar dates in São Paulo.

- [ ] Add failing tests for payment in current month, unpaid before due date, late after due date, and due days 29/30/31 across February and 30-day months.
- [ ] Inspect existing invoices and legacy `ultimo_pagamento_data`; write a reconciliation report before any updates and never create old invoices as assumed debts.
- [ ] Add an RPC transaction that validates an active student, integral current-month payment, and unique student/competence; update compatibility fields and invoice atomically.
- [ ] Make repeated RPC calls idempotent for the same current-month invoice and retain the original audit information unless an explicit correction flow is used.
- [ ] Replace frontend dual writes with the RPC and surface an actionable error if it fails.
- [ ] Distinguish forecast monthly fees, received current-month payments, and currently overdue invoices in labels and calculations.
- [ ] Run financial tests and verify rollback by forcing a controlled transaction error in the safe environment.

## Task 5: Correct agenda time handling and review local agenda/history changes

**Files:**
- Create: `src/lib/agenda-dates.ts` and focused tests if no existing shared date utilities fit.
- Modify: `src/pages/AdminDashboard.tsx`, `src/lib/supabase.ts`
- Test: agenda date/time unit tests plus authenticated create/edit smoke test.

**Interfaces:**
- `formatAgendaDateTime(instant: string): { date: string; time: string }` formats a timestamp in `America/Sao_Paulo`.
- `toAgendaInstant(date: string, time: string): string` creates the stored instant from São Paulo wall-clock input.

- [ ] Add failing tests for 20:00, 23:30, midnight crossing, and month/year boundary timestamps.
- [ ] Review the current local agenda/history diff and port only changes needed for agreed scope into the isolated candidate.
- [ ] Replace string slicing/splitting of timestamps with the date helpers for grouping, display, and edit initialization.
- [ ] Validate create, edit, status transition, and student association using a test student.
- [ ] Run focused date tests and a browser check in São Paulo timezone.

## Task 6: Complete privacy, operational feedback, and release documentation

**Files:**
- Modify: `src/components/AnamnesisForm.tsx`, `supabase/functions/insert-aluno/index.ts`
- Create: `docs/superpowers/runbooks/crm-release.md`
- Test: privacy/log inspection and manual failure-mode checks.

- [ ] Search frontend and Edge Function logs for name, WhatsApp, health answers, and complete request bodies; remove personal payload logging.
- [ ] Check form content for internal spreadsheet repair instructions; retain only user-facing confirmation and contact fallback.
- [ ] Define how best-effort Sheet sync failures are noticed/reconciled by the operator, without claiming a confirmed copy.
- [ ] Document fake-data smoke steps, admin checks, backup/rollback contacts, and the limited current-month billing behavior.
- [ ] Verify the Google Apps Script target and sheet access using a test submission; avoid exposing health details in public responses.

## Task 7: Full candidate validation and production release

**Files:**
- Candidate artifacts only; no unrelated workspace files.
- Test: lint, build, automated tests, and end-to-end smoke checklist.

**Interfaces:**
- Consumes: verified outputs of Tasks 1–6.
- Produces: one reviewed Vercel candidate and an auditable production release with rollback target.

- [ ] Run `npm run lint`, `npm run build`, and the configured test command; resolve all failures before deploy.
- [ ] Deploy a Vercel preview from the isolated candidate and confirm the project/team/domain are `thiago-mancilha-site` under the authorized team.
- [ ] Smoke-test visitor form success/failure, duplicate retry, sheet copy best-effort behavior, admin login/logout/denial, lead conversion, agenda, current-month payment, and mobile layout using fake records.
- [ ] Compare the production database before/after smoke tests; confirm only intended fake records were created and remove them using the documented cleanup procedure.
- [ ] Review Vercel build/runtime logs and Supabase function/database logs for errors without logging personal payloads.
- [ ] Publish the reviewed candidate to production, verify the production domain and one new fake lead end-to-end, and record the prior deployment ID for rollback.
- [ ] Mark delivery complete only after the live smoke test and rollback target are confirmed.

## Plan self-review

- Spec coverage: capture and idempotency (Task 2); security and roles (Task 3); current-month finance and due rules (Task 4); agenda/history (Task 5); privacy and Sheets expectations (Task 6); build, preview, production, rollback (Task 7).
- Review Focus failures are pinned to the named task tests.
- Worktree isolation protects pre-existing user changes; production policy and data changes are explicitly gated by inspection and recovery verification.
- No broad dashboard rewrite or new payment automation is included.
