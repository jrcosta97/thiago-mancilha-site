import { describe, expect, it } from 'vitest';
import { resolveIdempotencyKey, validateAndBuildLead } from './validation';

const valid = { nome: 'Maria Teste', email: '  Maria+treino@exemplo.com  ', idade: 32, whatsapp: '11999990000', status: 'ATIVO' };

describe('validação pública de lead', () => {
  it.each([
    [{ ...valid, nome: 'M' }, 'nome'],
    [{ ...valid, idade: 9 }, 'idade'],
    [{ ...valid, idade: 101 }, 'idade'],
    [{ ...valid, whatsapp: '123' }, 'whatsapp'],
    [{ ...valid, email: undefined }, 'email'],
    [{ ...valid, email: 'maria@' }, 'email'],
  ])('rejeita campo inválido %s', (payload, field) => {
    const result = validateAndBuildLead(payload);
    expect(result.payload).toBeNull();
    expect(result.errors.join(' ')).toContain(field);
  });

  it('normaliza WhatsApp e ignora status/origem enviados pelo cliente', () => {
    const result = validateAndBuildLead(valid);
    expect(result.errors).toEqual([]);
    expect(result.payload).toMatchObject({ status: 'NOVO_LEAD', origem: 'anamnese-site', whatsapp: '(11) 99999-0000' });
    expect(result.payload?.email).toBe('Maria+treino@exemplo.com');
    expect(result.payload?.whatsapp_link).toBe('https://api.whatsapp.com/send?phone=5511999990000');
  });

  it('limpa detalhes de lesão quando a pessoa indica que não tem lesão', () => {
    const result = validateAndBuildLead({ ...valid, has_injury: false, injury_details: 'texto privado' });
    expect(result.payload?.injury_details).toBeNull();
  });
});

describe('identificador de envio', () => {
  const key = '11111111-1111-4111-8111-111111111111';
  it('mantém o identificador enviado pelo site novo', () => {
    expect(resolveIdempotencyKey(key, () => 'não deveria gerar')).toBe(key);
  });
  it('gera um identificador para o site antigo que ainda não envia cabeçalho', () => {
    expect(resolveIdempotencyKey(null, () => key)).toBe(key);
  });
  it('rejeita um identificador explicitamente inválido', () => {
    expect(resolveIdempotencyKey('inválido', () => key)).toBeNull();
    expect(resolveIdempotencyKey('', () => key)).toBeNull();
  });
});
