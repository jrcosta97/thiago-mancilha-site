// ============================================================
// Supabase Edge Function: insert-aluno
// ------------------------------------------------------------
// ANON (P (PUBLICA (sem autenticação)
// Objetivo: receber payload da Ficha de Avaliação do formulario
// fazer INSERT na tabela public.alunos SEM precisar de CORS liberados no browser

import { serve } from 'https://deno.land/std@0.192.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.112.3'
import { resolveIdempotencyKey, validateAndBuildLead } from './validation.ts'

// Tipos locais (copiados do front para compatibilidade)
interface CreateAlunoPayload {
  nome: string
  email: string
  idade: number
  whatsapp: string
  objetivo: string
  goal_details?: string | null
  frequency: string
  has_injury: boolean
  injury_details?: string | null
  rotina?: string | null
  preferencia?: string | null
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-application-name, idempotency-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '600',
}

serve(async (req) => {
  // Preflight OPTIONS — permite CORS de QUALQUER origem
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method === 'GET') {
    const sbUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const hasAnon = Boolean(Deno.env.get('SUPABASE_ANON_KEY'))
    const hasServiceRole = Boolean(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'))

    return new Response(
      JSON.stringify({
        ok: true,
        function: 'insert-aluno',
        health: 'ok',
        supabaseUrlConfigured: Boolean(sbUrl),
        hasAnonKey: hasAnon,
        hasServiceRoleKey: hasServiceRole,
        preferredKey: hasServiceRole ? 'service_role' : (hasAnon ? 'anon' : 'missing'),
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Método não permitido. Use POST.' }),
        { status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    const sbUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const sbAdminKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    if (!sbUrl || !sbAdminKey) {
      return new Response(
        JSON.stringify({ error: 'Configuração segura Supabase ausente.' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    const raw: CreateAlunoPayload | null = await req.json().catch(() => null)
    if (!raw || typeof raw !== 'object') {
      return new Response(
        JSON.stringify({ error: 'Payload JSON inválido no corpo da requisição.' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    // A versão já publicada do site não envia o cabeçalho; cada envio antigo
    // recebe uma chave própria até os visitantes atualizarem a página.
    const idempotencyKey = resolveIdempotencyKey(req.headers.get('Idempotency-Key'))
    if (!idempotencyKey) {
      return new Response(JSON.stringify({ ok: false, error: { message: 'Identificador da tentativa inválido.' } }), {
        status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    // ---------- Validações RIGOROSAS (iguais do front-end ----------
    const { payload, errors } = validateAndBuildLead(raw as unknown as Record<string, unknown>)
    if (!payload || errors.length > 0) {
      return new Response(
        JSON.stringify({ ok: false, validationErrors: errors }),
        { status: 422, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    // ---------------- INSERT usando preferencialmente Service Role (server side, bypass total)
    const sb = createClient(sbUrl, sbAdminKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { 'x-application-name': 'edge-insert-aluno-v1' } },
    })

    const { data, error } = await sb.rpc('insert_lead_idempotent', {
      p_request_id: idempotencyKey,
      p_payload: payload,
    })

    if (error) {
      console.error('[insert-aluno] Database insert failed:', error.code)
      return new Response(
        JSON.stringify({ ok: false, error: { message: 'Não foi possível registrar a ficha.' } }),
        {
          status: 502,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      )
    }

    const duplicate = Boolean(data?.duplicate)
    const responseBody = {
      ok: data?.ok === true,
      data: data?.data?.id ? { id: data.data.id } : null,
      duplicate,
    }
    return new Response(
      JSON.stringify(responseBody),
      { status: duplicate ? 200 : 201, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )
  } catch {
    console.error('[insert-aluno] Unexpected request failure')
    return new Response(
      JSON.stringify({ ok: false, error: { message: 'Não foi possível registrar a ficha.' } }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )
  }
})
