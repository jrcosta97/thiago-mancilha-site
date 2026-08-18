// =============================================================================
// Sheet Sync Service — Contrato Forte de Dados Frontend ↔️ Google Sheets
// -----------------------------------------------------------------------------
// Mapeia as 9 colunas FIXAS da "Planilha de Controle Thiago" (A..I), valida,
// detecta lacunas, formata e gera um payload MULTIFORMATO para máxima
// compatibilidade com Google Apps Script /e.parameter/.
//
// Estrutura da planilha (coluna, header, tipo de dado esperado, exemplo):
//   A  Data/Hora             Data + hora BR  DD/MM/AAAA HH:MM:SS
//   B  Nome                  Texto          Nome e sobrenome (≥2 palavras)
//   C  Idade                 Número         14..99 inteiro
//   D  WhatsApp              Telefone       (00) 00000-0000 (11 dígitos)
//   E  Objetivo              Categórico     Emagrecimento / Massa / etc.
//   F  Frequencia            Categórico     1 a 2 / 3 a 4 / 5 a 6 vezes semana
//   G  lesões                Texto/flag     "Não"  OU  "Sim — <detalhes>"
//   H  status                Categórico     "Novo Lead" (fixo)
//   I  link wpp              URL            https://api.whatsapp.com/...
// =============================================================================

export type SheetColumnLetter = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I';
export type SheetColumnIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface SheetColumnDef {
  index: SheetColumnIndex;
  letter: SheetColumnLetter;
  header: string;
  category: 'identificacao' | 'objetivo' | 'saude' | 'admin';
  example: string;
  required: boolean;
  defaultValue?: string;
  pattern?: RegExp;
  minLen?: number;
  maxLen?: number;
  minValue?: number;
  maxValue?: number;
}

export const SHEET_COLUMNS: Record<SheetColumnLetter, SheetColumnDef> = {
  A: { index: 0, letter: 'A', header: 'Data/Hora',            category: 'identificacao', example: '13/08/2026 21:04:17', required: true,  defaultValue: '' },
  B: { index: 1, letter: 'B', header: 'Nome',                 category: 'identificacao', example: 'Maria da Silva',       required: true,  minLen: 3 },
  C: { index: 2, letter: 'C', header: 'Idade',                category: 'identificacao', example: '48',                   required: true,  minValue: 14, maxValue: 99 },
  D: { index: 3, letter: 'D', header: 'WhatsApp',             category: 'identificacao', example: '(48) 99151-5892',      required: true,  pattern: /^\(\d{2}\) \d{5}-\d{4}$/ },
  E: { index: 4, letter: 'E', header: 'Objetivo',             category: 'objetivo',      example: 'Emagrecimento',        required: true,  defaultValue: 'Não informado' },
  F: { index: 5, letter: 'F', header: 'Frequencia',           category: 'objetivo',      example: '3 a 4 vezes por semana', required: true, defaultValue: 'Não informado' },
  G: { index: 6, letter: 'G', header: 'lesões',               category: 'saude',         example: 'Não',                  required: true,  defaultValue: 'Não' },
  H: { index: 7, letter: 'H', header: 'status',               category: 'admin',         example: 'Novo Lead',            required: true,  defaultValue: 'Novo Lead' },
  I: { index: 8, letter: 'I', header: 'link wpp',             category: 'admin',         example: 'https://api.whatsapp.com/send?phone=55489...', required: false, defaultValue: '' },
};

export const SHEET_COLUMN_ORDER: SheetColumnLetter[] = ['A','B','C','D','E','F','G','H','I'];

// -----------------------------------------------------------------------------
// Formatadores de valor por coluna
// -----------------------------------------------------------------------------
export const pad = (n: number) => String(n).padStart(2, '0');
export const formatDateTimeBR = (d: Date = new Date()): string => {
  return (
    `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  );
};

export const digitsOnly = (v: unknown): string => String(v ?? '').replace(/\D/g, '').slice(0, 11);

export const formatWhatsApp = (raw: unknown): { formatted: string; rawDigits: string; valid: boolean } => {
  const d = digitsOnly(raw);
  if (d.length <= 2) return { formatted: d, rawDigits: d, valid: false };
  if (d.length <= 7) return { formatted: `(${d.slice(0, 2)}) ${d.slice(2)}`, rawDigits: d, valid: false };
  if (d.length <= 10) {
    return {
      formatted: `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`,
      rawDigits: d,
      valid: d.length === 10,
    };
  }
  const formatted = `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  return { formatted, rawDigits: d, valid: d.length === 11 };
};

export const mapObjetivoLabel = (value: string, details?: string): string => {
  const extra = String(details ?? '').trim();
  switch (String(value ?? '').toLowerCase()) {
    case 'emagrecer':      return 'Emagrecimento';
    case 'hipertrofia':    return 'Ganho de Massa Muscular';
    case 'mobilidade':     return 'Saúde Funcional e Mobilidade';
    case 'forca':          return 'Força e Disposição';
    case 'outro': {
      if (extra.length > 0 && extra.length <= 60) return extra.charAt(0).toUpperCase() + extra.slice(1);
      if (extra.length > 60) return extra.slice(0, 60);
      return 'Outro objetivo';
    }
    case 'definicao':
    case 'definição':      return 'Definição';
    case 'condicionamento': return 'Condicionamento Físico';
    default: {
      const v = String(value ?? '').trim();
      if (!v) return extra ? extra : 'Não informado';
      return v.charAt(0).toUpperCase() + v.slice(1);
    }
  }
};

export const mapFrequenciaLabel = (value: string): string => {
  const v = String(value ?? '').toLowerCase();
  if (['2x','1-2','1a2','1_e_2','1 e 2','1 2 vezes','2 vezes','2 dias'].includes(v)) return '1 a 2 vezes por semana';
  if (['3x','3-4','3a4','3_e_4','3 e 4','3 dias','4x','3 ou 4'].includes(v))            return '3 a 4 vezes por semana';
  if (['5xmais','5x+','5+','5-6','5a6','5_e_6','5 e 6','5 vezes','6 vezes'].includes(v))   return '5 a 6 vezes por semana';
  if (v.includes('todo dia') || v.includes('todos os dias'))                               return 'Todos os dias';
  const raw = String(value ?? '').trim();
  if (!raw) return 'Não informado';
  return raw;
};

export const mapLesoesCell = (hasInjury: 's' | 'n' | boolean | string | unknown, details?: string): string => {
  const s = String(hasInjury ?? '').toLowerCase();
  const isYes = s === 's' || s === 'sim' || s === 'true' || s === 'yes' || s === '1';
  if (!isYes) return 'Não';
  const d = String(details ?? '').trim();
  if (!d) return 'Sim';
  const clean = d.charAt(0).toUpperCase() + d.slice(1);
  if (clean.toLowerCase().startsWith('sim')) return clean;
  return `Sim — ${clean}`;
};

export const mapPreferenciaLabel = (value: unknown): string => {
  const v = String(value ?? '').toLowerCase();
  if (v === 'presencial') return 'Atendimento Presencial';
  if (v === 'online')     return 'Atendimento Online';
  if (v === 'qualquer' || v === 'tanto faz' || v === 'indiferente') return 'Tanto faz';
  return String(value ?? '') || 'Não informado';
};

export const buildWhatsAppLink = (rawPhone: unknown): string => {
  const d = digitsOnly(rawPhone);
  if (d.length < 10) return '';
  const fullDigits = d.length === 11 ? `55${d}` : `55${d}`;
  return `https://api.whatsapp.com/send?phone=${encodeURIComponent(fullDigits)}`;
};

// -----------------------------------------------------------------------------
// Tipos de input cru vindos do formulário React Hook Form
// -----------------------------------------------------------------------------
export interface RawAnamnesisInput {
  nome: string;
  idade: string | number;
  whatsapp: string;
  goal: string;
  goalDetails?: string;
  frequency: string;
  hasInjury: 's' | 'n' | '' | boolean;
  injuryDetails?: string;
  preferencia?: string;
  rotina?: string;
}

// -----------------------------------------------------------------------------
// Validação e detecção de lacunas
// -----------------------------------------------------------------------------
export interface GapError {
  index: SheetColumnIndex;
  letter: SheetColumnLetter;
  header: string;
  severity: 'error' | 'warn' | 'info';
  code:
    | 'EMPTY_REQUIRED'
    | 'PATTERN_MISMATCH'
    | 'LENGTH_OUT_OF_RANGE'
    | 'VALUE_OUT_OF_RANGE'
    | 'TYPE_MISMATCH'
    | 'WARN_FALLBACK_USED';
  reason: string;
  rawValue: unknown;
  insertedValue: string;
  fixable: boolean;
}

export interface CellValidationResult {
  index: SheetColumnIndex;
  letter: SheetColumnLetter;
  header: string;
  rawValue: unknown;
  cleanValue: string;
  valid: boolean;
  errors: GapError[];
}

export interface SheetValidationReport {
  row: string[];                             // 9 células em ORDEM A..I (sempre)
  rowByLetter: Record<SheetColumnLetter, string>;
  cells: Record<SheetColumnLetter, CellValidationResult>;
  hasCriticalErrors: boolean;
  gapCount: number;
  fixableGapCount: number;
  errors: GapError[];
  warnings: GapError[];
  timestamp: string;
}

const makeGapError = (
  def: SheetColumnDef,
  code: GapError['code'],
  severity: GapError['severity'],
  reason: string,
  rawValue: unknown,
  insertedValue: string,
  fixable: boolean,
): GapError => ({
  index: def.index,
  letter: def.letter,
  header: def.header,
  severity,
  code,
  reason,
  rawValue,
  insertedValue,
  fixable,
});

const validateCell = (def: SheetColumnDef, rawValue: unknown, computedClean: string): CellValidationResult => {
  const errors: GapError[] = [];
  const cleanLen = String(computedClean ?? '').length;

  if (def.required && cleanLen === 0) {
    errors.push(makeGapError(def, 'EMPTY_REQUIRED', 'error',
      `Campo "${def.header}" (coluna ${def.letter}) é obrigatório e ficou vazio após formatação.`, rawValue, '', false));
  }
  if (def.minLen != null && cleanLen > 0 && cleanLen < def.minLen) {
    errors.push(makeGapError(def, 'LENGTH_OUT_OF_RANGE', 'warn',
      `Campo "${def.header}" (${def.letter}) tem ${cleanLen} caracteres, mínimo esperado ${def.minLen}.`, rawValue, computedClean, true));
  }
  if (def.maxLen != null && cleanLen > def.maxLen) {
    errors.push(makeGapError(def, 'LENGTH_OUT_OF_RANGE', 'warn',
      `Campo "${def.header}" (${def.letter}) ultrapassou ${def.maxLen} caracteres, truncado.`, rawValue, computedClean, true));
  }
  if (def.pattern && cleanLen > 0 && !def.pattern.test(String(computedClean ?? ''))) {
    errors.push(makeGapError(def, 'PATTERN_MISMATCH', 'error',
      `Campo "${def.header}" (${def.letter}) não bate com o padrão esperado: ${String(def.pattern)}. Exemplo: ${def.example}`,
      rawValue, computedClean, false));
  }
  if ((def.minValue != null || def.maxValue != null) && cleanLen > 0) {
    const n = Number(computedClean);
    if (!Number.isFinite(n)) {
      errors.push(makeGapError(def, 'TYPE_MISMATCH', 'error',
        `Campo "${def.header}" (${def.letter}) deveria ser numérico, recebeu "${computedClean}".`, rawValue, computedClean, false));
    } else {
      if (def.minValue != null && n < def.minValue) {
        errors.push(makeGapError(def, 'VALUE_OUT_OF_RANGE', 'error',
          `Campo "${def.header}" (${def.letter}) = ${n}, valor mínimo permitido ${def.minValue}.`, rawValue, computedClean, false));
      }
      if (def.maxValue != null && n > def.maxValue) {
        errors.push(makeGapError(def, 'VALUE_OUT_OF_RANGE', 'error',
          `Campo "${def.header}" (${def.letter}) = ${n}, valor máximo permitido ${def.maxValue}.`, rawValue, computedClean, false));
      }
    }
  }

  return {
    index: def.index,
    letter: def.letter,
    header: def.header,
    rawValue,
    cleanValue: computedClean,
    valid: errors.every((e) => e.severity !== 'error'),
    errors,
  };
};

// -----------------------------------------------------------------------------
// Builder principal: recebe dados brutos do form, aplica formatação, detecta
// lacunas e gera a linha pronta A..I em ORDEM FIXA.
// -----------------------------------------------------------------------------
export interface BuildRowOptions {
  now?: Date;
  statusLead?: string;
  allowFallbackDefaults?: boolean;
}

export const buildSheetRow = (
  raw: Partial<RawAnamnesisInput>,
  opts: BuildRowOptions = {},
): SheetValidationReport => {
  const now = opts.now ?? new Date();
  const statusLead = opts.statusLead ?? 'Novo Lead';
  const allowFallback = opts.allowFallbackDefaults !== false;

  // Formatação forte por célula
  const dataHora = formatDateTimeBR(now);
  const nomeClean = String(raw.nome ?? '').trim();
  const idadeNum = Number(String(raw.idade ?? '').replace(/\D/g, ''));
  const idadeClean = Number.isFinite(idadeNum) && idadeNum > 0 ? String(idadeNum) : '';
  const { formatted: wppClean, rawDigits: wppRaw } = formatWhatsApp(raw.whatsapp ?? '');
  const objetivoClean = mapObjetivoLabel(raw.goal ?? '', raw.goalDetails ?? '');
  const frequenciaClean = (() => {
    const v = mapFrequenciaLabel(raw.frequency ?? '');
    if (v === 'Não informado' && allowFallback) return 'Não informado';
    return v;
  })();
  const lesoesClean = mapLesoesCell(raw.hasInjury ?? 'n', raw.injuryDetails ?? '');
  const statusClean = statusLead;
  const linkClean = buildWhatsAppLink(wppRaw.length > 0 ? wppRaw : raw.whatsapp ?? '');

  const computedByLetter: Record<SheetColumnLetter, string> = {
    A: dataHora,
    B: nomeClean,
    C: idadeClean,
    D: wppClean,
    E: objetivoClean,
    F: frequenciaClean,
    G: lesoesClean,
    H: statusClean,
    I: linkClean,
  };

  // Preenchimento de FALLBACK se lacuna + allowFallback (evitar colunas em BRANCO)
  SHEET_COLUMN_ORDER.forEach((letter) => {
    const def = SHEET_COLUMNS[letter];
    if (!allowFallback) return;
    if (String(computedByLetter[letter] ?? '').length === 0 && def.defaultValue != null) {
      computedByLetter[letter] = def.defaultValue;
    }
  });

  // Validação célula a célula
  const cells = {} as Record<SheetColumnLetter, CellValidationResult>;
  const errors: GapError[] = [];
  const warnings: GapError[] = [];
  SHEET_COLUMN_ORDER.forEach((letter) => {
    const def = SHEET_COLUMNS[letter];
    const rawVal = ((): unknown => {
      switch (letter) {
        case 'A': return dataHora;
        case 'B': return raw.nome;
        case 'C': return raw.idade;
        case 'D': return raw.whatsapp;
        case 'E': return { goal: raw.goal, details: raw.goalDetails };
        case 'F': return raw.frequency;
        case 'G': return { hasInjury: raw.hasInjury, details: raw.injuryDetails };
        case 'H': return statusLead;
        case 'I': return wppRaw;
      }
    })();
    const res = validateCell(def, rawVal, computedByLetter[letter]);
    cells[letter] = res;
    res.errors.forEach((e) => {
      if (e.severity === 'error') errors.push(e);
      if (e.severity === 'warn') warnings.push(e);
      if (e.severity === 'info') warnings.push(e);
    });
  });

  const row = SHEET_COLUMN_ORDER.map((L) => computedByLetter[L]);
  const gapCount = errors.length + warnings.length;
  const fixableGapCount = [...errors, ...warnings].filter((e) => e.fixable).length;

  return {
    row,
    rowByLetter: computedByLetter,
    cells,
    hasCriticalErrors: errors.some((e) => e.severity === 'error'),
    gapCount,
    fixableGapCount,
    errors,
    warnings,
    timestamp: dataHora,
  };
};

// -----------------------------------------------------------------------------
// Gerador de payload UNIVERSAL para Google Apps Script /e.parameter/
// — Gera 5 formatos diferentes em um único objeto:
//   1. Chaves numéricas "0".."8"        (estilo appendRow por índice)
//   2. Chaves "col_0".."col_8"
//   3. Chaves por LETRA  "A".."I"
//   4. Chaves por header ("Data/Hora", "Nome", "WhatsApp", ..., "Frequencia", "lesões")
//   5. Chaves apelido lowercase SEM ACENTO + curtas (freq / les / linkwpp / status)
// -----------------------------------------------------------------------------
export interface UniversalSheetPayload extends Record<string, string> {
  // Para garantir que Object.keys sempre comece na ordem A..I
  '0': string; '1': string; '2': string; '3': string; '4': string;
  '5': string; '6': string; '7': string; '8': string;
}

export const buildUniversalPayload = (report: SheetValidationReport): UniversalSheetPayload => {
  const p = {} as UniversalSheetPayload;
  // 1) índices numéricos (ordem fixa, 0..8)
  report.row.forEach((val, i) => { p[String(i) as keyof UniversalSheetPayload] = val; });
  // 2) col_X
  SHEET_COLUMN_ORDER.forEach((L, i) => { p[`col_${i}`] = report.row[i]; });
  // 3) A..I
  SHEET_COLUMN_ORDER.forEach((L) => { p[L] = report.rowByLetter[L]; });
  // 4) headers e headers_lowercase
  SHEET_COLUMN_ORDER.forEach((L) => {
    const header = SHEET_COLUMNS[L].header;
    p[header] = report.rowByLetter[L];
    p[header.toLowerCase()] = report.rowByLetter[L];
    p[header.normalize('NFD').replace(/[\u0300-\u036f]/g, '')] = report.rowByLetter[L];
    p[header.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')] = report.rowByLetter[L];
  });
  // 5) apelidos longos/shortcuts lowercase + chaves EXATAS lidas pelo doPost(e) GAS Thiago
  p['Data'] = report.rowByLetter.A;
  p['data']   = report.rowByLetter.A;
  p['dataHora'] = report.rowByLetter.A;
  p['datahora'] = report.rowByLetter.A;
  p['Nome']   = report.rowByLetter.B;
  p['nome']   = report.rowByLetter.B;
  p['name']   = report.rowByLetter.B;
  p['Idade']  = report.rowByLetter.C;
  p['idade']  = report.rowByLetter.C;
  p['age']    = report.rowByLetter.C;
  p['WhatsApp'] = report.rowByLetter.D;
  p['whatsapp'] = report.rowByLetter.D;
  p['whatsApp'] = report.rowByLetter.D;
  p['Whatsapp'] = report.rowByLetter.D;
  p['wpp']      = report.rowByLetter.D;
  p['telefone'] = report.rowByLetter.D;
  p['phone']    = report.rowByLetter.D;
  p['Objetivo'] = report.rowByLetter.E;
  p['objetivo'] = report.rowByLetter.E;
  p['goal']     = report.rowByLetter.E;
  p['Frequencia'] = report.rowByLetter.F;
  p['Frequência'] = report.rowByLetter.F;
  p['frequencia'] = report.rowByLetter.F;
  p['frequência'] = report.rowByLetter.F;
  p['frequenciaTreino'] = report.rowByLetter.F;
  p['frequencia_treino'] = report.rowByLetter.F;
  p['frequencia_semanal'] = report.rowByLetter.F;
  p['freq'] = report.rowByLetter.F;
  p['Lesões'] = report.rowByLetter.G;
  p['Lesoes'] = report.rowByLetter.G;
  p['Lesao']  = report.rowByLetter.G;
  p['lesões'] = report.rowByLetter.G;
  p['lesoes'] = report.rowByLetter.G;
  p['lesao']  = report.rowByLetter.G;
  p['les']    = report.rowByLetter.G;
  p['historico'] = report.rowByLetter.G;
  p['historicoLesoes'] = report.rowByLetter.G;
  p['tem_lesao'] = /^Sim/i.test(report.rowByLetter.G) ? 'Sim' : 'Não';
  p['status']  = report.rowByLetter.H;
  p['Status']  = report.rowByLetter.H;
  p['link wpp'] = report.rowByLetter.I;
  p['link_wpp'] = report.rowByLetter.I;
  p['linkWpp']  = report.rowByLetter.I;
  p['linkwpp']  = report.rowByLetter.I;
  p['link']     = report.rowByLetter.I;
  p['whatsapp_link'] = report.rowByLetter.I;
  p['formulawpp']    = report.rowByLetter.I;
  p['formulaWpp']    = report.rowByLetter.I;
  p['linkConversa']  = report.rowByLetter.I;
  return p;
};

// -----------------------------------------------------------------------------
// Relatório em formato console.table (para debug fácil no DevTools)
// -----------------------------------------------------------------------------
export const reportToTableRows = (report: SheetValidationReport) => {
  return SHEET_COLUMN_ORDER.map((L) => {
    const def = SHEET_COLUMNS[L];
    const cell = report.cells[L];
    const lacuna = cell.errors.length > 0 ? (cell.valid ? '⚠️ AVISO' : '❌ ERRO') : '✅ OK';
    return {
      Coluna: `${L} · ${def.header}`,
      Categoria: def.category,
      Valor: cell.cleanValue || '⌀ VAZIO',
      Exemplo_esperado: def.example,
      Lacuna: lacuna,
      Motivo: cell.errors.map((e) => e.code).join(' + ') || '-',
    };
  });
};

// -----------------------------------------------------------------------------
// Gerador de CSV para corrigir manualmente linhas quebradas
// -----------------------------------------------------------------------------
export const buildSheetCSV = (rows: string[][]): string => {
  const headers = SHEET_COLUMN_ORDER.map((L) => SHEET_COLUMNS[L].header);
  const escape = (s: string): string => {
    const needsQuote = /[",;\n\r]/.test(s);
    const esc = s.replace(/"/g, '""');
    return needsQuote ? `"${esc}"` : esc;
  };
  const head = headers.map(escape).join(';');
  const body = rows.map((r) => r.map(escape).join(';')).join('\n');
  // \uFEFF BOM para Excel em PT-BR ler corretamente UTF-8
  return '\uFEFF' + head + '\n' + body + '\n';
};

export const downloadCSV = (csv: string, filename = 'planilha-controle-atualizacao.csv') => {
  if (typeof document === 'undefined') return;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
};

// -----------------------------------------------------------------------------
// Converte URLSearchParams.toString() para garantir encoding compatível GAS
// -----------------------------------------------------------------------------
export const payloadToURLSearchParams = (payload: UniversalSheetPayload): URLSearchParams => {
  const params = new URLSearchParams();
  Object.entries(payload).forEach(([k, v]) => {
    const val = String(v ?? '');
    if (val.length > 0) params.append(k, val);
  });
  return params;
};

// -----------------------------------------------------------------------------
// Varredura de planilha LOCAL (útil se você já tiver um array de linhas e
// quiser detectar lacunas). Ex: linhas vindas do Google via JSON.
// -----------------------------------------------------------------------------
export type SheetRow = Array<string | number | null | undefined>;

export const scanExistingSheetForGaps = (
  rows: SheetRow[],
  options: { skipHeader?: boolean; headerOffset?: number } = {},
): { gapsByRow: Array<{ rowIndex: number; columns: Array<{ letter: SheetColumnLetter; header: string; currentValue: unknown; severity: 'missing' | 'malformed' }> }>; totalGaps: number; } => {
  const start = options.skipHeader ? 1 : 0;
  const gapsByRow: Array<{ rowIndex: number; columns: Array<{ letter: SheetColumnLetter; header: string; currentValue: unknown; severity: 'missing' | 'malformed' }> }> = [];
  let totalGaps = 0;
  for (let r = start; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.every((c) => c == null || String(c).trim() === '')) continue;
    const cols: Array<{ letter: SheetColumnLetter; header: string; currentValue: unknown; severity: 'missing' | 'malformed' }> = [];
    SHEET_COLUMN_ORDER.forEach((letter, idx) => {
      const def = SHEET_COLUMNS[letter];
      const raw = row[idx] ?? '';
      const v = String(raw ?? '').trim();
      if (!v.length) {
        cols.push({ letter, header: def.header, currentValue: raw, severity: 'missing' });
        totalGaps++;
        return;
      }
      if (letter === 'D' && !/^\(\d{2}\) \d{4,5}-\d{4}$/.test(v)) {
        cols.push({ letter, header: def.header, currentValue: raw, severity: 'malformed' });
        totalGaps++;
      }
      if (letter === 'C' && !/^\d{2}$/.test(v)) {
        cols.push({ letter, header: def.header, currentValue: raw, severity: 'malformed' });
        totalGaps++;
      }
    });
    if (cols.length > 0) gapsByRow.push({ rowIndex: r, columns: cols });
  }
  return { gapsByRow, totalGaps };
};

// -----------------------------------------------------------------------------
// SELF-TEST: valida 6 perfis de lead e retorna relatório (para dev/console)
// Rodar no navegador: sheetSyncSelfTest().then(console.log)
// -----------------------------------------------------------------------------
export const sheetSyncSelfTest = (): Array<{ profile: string; hasCriticalErrors: boolean; gapCount: number; rowPrevia: string }> => {
  const profiles: Array<{ profile: string; input: Partial<RawAnamnesisInput> }> = [
    {
      profile: '1. Lead padrão saudável',
      input: { nome: 'Kellen Dias', idade: 19, whatsapp: '3123123-1231', goal: 'emagrecer', frequency: '2x', hasInjury: 'n' },
    },
    {
      profile: '2. Lead público 50+ com lesão (ex: linha 5 Junior)',
      input: { nome: 'Junior Fernandes', idade: 51, whatsapp: '15 15151 5151', goal: 'hipertrofia', frequency: '2x', hasInjury: 's', injuryDetails: 'artrose no joelho direito há 2 anos' },
    },
    {
      profile: '3. Lead Ozempic/Mounjaro — lacuna intencional Frequencia → deve usar fallback',
      input: { nome: 'Paciente Ozempic', idade: 42, whatsapp: '27988887777', goal: 'emagrecer', frequency: '', hasInjury: 'n' },
    },
    {
      profile: '4. Lead idade inválida (8 anos) → erro CRÍTICO',
      input: { nome: 'Criança Errada', idade: 8, whatsapp: '11911112222', goal: 'outro', goalDetails: 'crescimento saudável', frequency: '3x', hasInjury: 'n' },
    },
    {
      profile: '5. Lead WhatsApp incompleto (linha 10 "29 9292") → warn',
      input: { nome: 'Paulo Teste', idade: 29, whatsapp: '29 9292', goal: 'condicionamento', frequency: '2x', hasInjury: 'n' },
    },
    {
      profile: '6. Lead Atendimento Online + rotina detalhada',
      input: { nome: 'Gabriela Online', idade: 33, whatsapp: '61997774444', goal: 'definicao', frequency: '4x', hasInjury: 'n', preferencia: 'online', rotina: 'Home office, acordo 6h30, treino 12h.' },
    },
  ];
  return profiles.map(({ profile, input }) => {
    const report = buildSheetRow(input, { allowFallbackDefaults: true });
    const prev = report.row.map((v, i) => `${SHEET_COLUMN_ORDER[i as SheetColumnIndex]}=${v?.slice(0, 20) ?? ''}`).join(' | ');
    return { profile, hasCriticalErrors: report.hasCriticalErrors, gapCount: report.gapCount, rowPrevia: prev };
  });
};

// Auto-register no window (não executado em SSR)
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).__sheetSync__ = {
    buildSheetRow,
    buildUniversalPayload,
    scanExistingSheetForGaps,
    sheetSyncSelfTest,
    reportToTableRows,
    buildSheetCSV,
    downloadCSV,
  };
}
