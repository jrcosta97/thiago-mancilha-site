import { describe, expect, it } from 'vitest';
import { getSubmissionAttempt } from './submission-attempt';

describe('idempotência da tentativa do formulário', () => {
  it('reutiliza a chave ao repetir exatamente o mesmo payload', () => {
    const createKey = () => 'attempt-1';
    const first = getSubmissionAttempt(null, '{"nome":"Maria"}', createKey);
    const retry = getSubmissionAttempt(first, '{"nome":"Maria"}', () => 'attempt-2');
    expect(retry.key).toBe('attempt-1');
  });

  it('gera nova chave se a pessoa alterar os dados depois de uma falha', () => {
    const first = getSubmissionAttempt(null, '{"nome":"Maria"}', () => 'attempt-1');
    const edited = getSubmissionAttempt(first, '{"nome":"Mariana"}', () => 'attempt-2');
    expect(edited.key).toBe('attempt-2');
  });
});
