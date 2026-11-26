export const STUDENT_EMAIL_MAX_LENGTH = 254;
export const STUDENT_EMAIL_ERROR = 'Informe um e-mail válido do aluno.';

export function normalizeStudentEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const email = value.trim();
  if (email.length > STUDENT_EMAIL_MAX_LENGTH) return null;
  const format = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;
  const at = email.indexOf('@');
  return at > 0 && at <= 64 && format.test(email) ? email : null;
}
