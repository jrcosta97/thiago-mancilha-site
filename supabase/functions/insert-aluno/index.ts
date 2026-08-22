// ============================================================
// Supabase Edge Function: insert-aluno
// ------------------------------------------------------------
// ANON (P (PUBLICA (sem autenticação)
// Objetivo: receber payload da Ficha de Avaliação do formulario
// fazer INSERT na tabela public.alunos SEM precisar de CORS liberados no browser

import { serve } from 'https://deno.land/std@0.192.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.112.3'

// Tipos locais (copiados do front para compatibilidade)
type AlunoStatus = 'ACTIVE' | 'ARCHIVED' | 'CONTACTED' | 'CONVERTED'

interface CreateAlunoPayload {
  nome: string
  idade: number
  whatsapp: string
  objetivo: string
  goal_details?: string | null
  frequency: string
  has_injury: boolean
  injury_details?: string | null
  rotina?: string | null
  preferencia?: string | null
  status?: AlunoStatus
  origem?: string | null
  whatsapp_link?: string | null
}

const WHATSAPP_BR_REGEX = /^\(\d{2}\) \d{4,5}-\d{4}$/
const DIGITS_ONLY_REGEX = /^\d{10,11}$/

const digitsOnly = (value: unknown): string =>
  String(value ?? '').replace(/\D+/g, '')

const formatWhatsAppBR = (raw: unknown): string => {
  const d = digitsOnly(raw)
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6, 10)}`
  return String(raw ?? '')
}

const buildWhatsAppLinkBR = (raw: unknown): string => {
  const d = digitsOnly(raw)
  if (d.length < 10) return ''
  const full = d.length === 11 ? `55${d}` : `55${d}`
  return `https://api.whatsapp.com/send?phone=${encodeURIComponent(full)}`
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-application-name',
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
    const sbAdminKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ??
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''

    if (!sbUrl || !sbAdminKey) {
      return new Response(
        JSON.stringify({ error: 'Configuração Supabase ausente (SUPABASE_URL / SUPABASE_ANON_KEY)' }),
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

    // ---------- Validações RIGOROSAS (iguais do front-end ----------
    const errors: string[] = []

    const nome = String(raw.nome ?? '').trim()
    if (nome.length < 2) errors.push('nome: mínimo 2 caracteres')

    const idade = Number(raw.idade)
    if (!Number.isFinite(idade) || !Number.isInteger(idade) || idade < 10 || idade > 100) {
      errors.push(`idade: inválida "${String(raw.idade)}" (deve ser inteiro 10-100)`)
    }

    const whatsappFormatado = formatWhatsAppBR(raw.whatsapp)
    const formatoOk =
      WHATSAPP_BR_REGEX.test(whatsappFormatado) ||
      DIGITS_ONLY_REGEX.test(digitsOnly(raw.whatsapp))
    if (!formatoOk) errors.push(`whatsapp: formato inválido "${String(raw.whatsapp)}"`)

    const objetivo = String(raw.objetivo ?? '').trim() || 'nao_informado'
    const frequency = String(raw.frequency ?? '').trim() || 'nao_informado'
    const has_injury = Boolean(raw.has_injury)
    const injury_details = has_injury ? String(raw.injury_details ?? '').trim() || null : null
    const goal_details = String(raw.goal_details ?? '').trim() || null
    const rotina = String(raw.rotina ?? '').trim() || null
    const preferencia = String(raw.preferencia ?? '').trim() || null
    const origem = String(raw.origem ?? '').trim() || 'anamnese-site-edge'
    const status: AlunoStatus = (raw.status as AlunoStatus | undefined) || 'ACTIVE'
    const whatsapp_link =
      String(raw.whatsapp_link ?? '').trim() || buildWhatsAppLinkBR(raw.whatsapp) || null

    const payload = {
      nome,
      idade,
      whatsapp: whatsappFormatado || String(raw.whatsapp ?? ''),
      objetivo,
      goal_details,
      frequency,
      has_injury,
      injury_details,
      rotina,
      preferencia,
      status,
      origem,
      whatsapp_link,
    }

    if (errors.length > 0) {
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

    const { data, error } = await sb
      .from('alunos')
      .insert(payload as unknown as never[])
      .select()
      .maybeSingle()

    if (error) {
      console.error('[insert-aluno] PostgREST error:', error)
      return new Response(
        JSON.stringify({
          ok: false,
          error: {
            message: error.message,
            code: (error as unknown as { code?: string })?.code,
            hint: (error as unknown as { hint?: string })?.hint,
            details: (error as unknown as { details?: string })?.details,
          },
        }),
        {
          status: 502,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      )
    }

    return new Response(
      JSON.stringify({ ok: true, data: data ?? null }),
      { status: 201, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )
  } catch (err) {
    console.error('[insert-aluno] Uncaught error:', err)
    const message = err instanceof Error ? err.message : String(err ?? 'Erro desconhecido')
    return new Response(
      JSON.stringify({ ok: false, error: { message } }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )
  }
})
