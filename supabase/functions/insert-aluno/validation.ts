export type LeadPayload = {
  nome: string;
  idade: number;
  whatsapp: string;
  objetivo: string;
  goal_details: string | null;
  frequency: string;
  has_injury: boolean;
  injury_details: string | null;
  rotina: string | null;
  preferencia: string | null;
  status: 'NOVO_LEAD';
  origem: 'anamnese-site';
  whatsapp_link: string | null;
};

const digitsOnly = (value: unknown): string => String(value ?? '').replace(/\D+/g, '');

export const resolveIdempotencyKey = (provided: string | null, create = () => crypto.randomUUID()): string | null => {
  const key = provided === null ? create() : provided;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(key) ? key : null;
};

const formatWhatsAppBR = (value: unknown): string => {
  const digits = digitsOnly(value);
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return '';
};

export const validateAndBuildLead = (raw: Record<string, unknown>): { payload: LeadPayload | null; errors: string[] } => {
  const errors: string[] = [];
  const nome = String(raw.nome ?? '').trim().slice(0, 120);
  if (nome.length < 2) errors.push('nome: mínimo 2 caracteres');

  const idade = Number(raw.idade);
  if (!Number.isInteger(idade) || idade < 10 || idade > 100) errors.push('idade: deve ser um inteiro entre 10 e 100');

  const whatsapp = formatWhatsAppBR(raw.whatsapp);
  if (!whatsapp) errors.push('whatsapp: informe um número brasileiro com 10 ou 11 dígitos');
  if (errors.length) return { payload: null, errors };

  const has_injury = raw.has_injury === true || String(raw.has_injury).toLowerCase() === 'true';
  const digits = digitsOnly(whatsapp);
  return {
    errors,
    payload: {
      nome,
      idade,
      whatsapp,
      objetivo: String(raw.objetivo ?? '').trim().slice(0, 120) || 'nao_informado',
      goal_details: String(raw.goal_details ?? '').trim().slice(0, 1000) || null,
      frequency: String(raw.frequency ?? '').trim().slice(0, 80) || 'nao_informado',
      has_injury,
      injury_details: has_injury ? String(raw.injury_details ?? '').trim().slice(0, 2000) || null : null,
      rotina: String(raw.rotina ?? '').trim().slice(0, 2000) || null,
      preferencia: String(raw.preferencia ?? '').trim().slice(0, 500) || null,
      status: 'NOVO_LEAD',
      origem: 'anamnese-site',
      whatsapp_link: `https://api.whatsapp.com/send?phone=55${digits}`,
    },
  };
};
