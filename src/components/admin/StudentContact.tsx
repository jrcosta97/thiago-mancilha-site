import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { getSupabase, type AlunosRow } from '@/lib/supabase';
import { ageFromBirthDate, formatBirthDate } from '../../../supabase/functions/insert-aluno/birth-date';
import {
  normalizeStudentEmail,
  STUDENT_EMAIL_ERROR,
  STUDENT_EMAIL_MAX_LENGTH,
} from '../../../supabase/functions/insert-aluno/email';

export default function StudentContact({ aluno, onUpdated }: {
  aluno: AlunosRow;
  onUpdated: (row: AlunosRow) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [birthDraft, setBirthDraft] = useState<string | null>(null);

  const copy = async (value: string, label: string) => {
    setFeedback('');
    try {
      await navigator.clipboard.writeText(value);
      setFeedback(label);
    } catch {
      setFeedback('Não foi possível copiar. Selecione o texto para copiar manualmente.');
    }
  };

  const saveEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    setError('');
    setFeedback('');
    const email = normalizeStudentEmail(draft);
    if (!email) {
      setError(STUDENT_EMAIL_ERROR);
      return;
    }
    const sb = getSupabase();
    if (!sb) {
      setError('Não foi possível conectar ao painel. Tente novamente.');
      return;
    }
    setSaving(true);
    try {
      const { data, error: updateError } = await sb.from('alunos')
        .update({ email } as never)
        .eq('id', aluno.id)
        .select()
        .single();
      if (updateError || !data) throw new Error('Falha ao atualizar o e-mail');
      onUpdated(data as AlunosRow);
      setDraft(null);
      setFeedback('E-mail salvo.');
    } catch {
      setError('Não foi possível salvar o e-mail. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const email = aluno.email;
  const birth = aluno.data_nascimento;
  const contactText = [
    `Nome: ${aluno.nome}`,
    ...(email ? [`E-mail: ${email}`] : []),
    `Data de nascimento: ${birth ? formatBirthDate(birth) : 'não informada'}`,
    `WhatsApp: ${aluno.whatsapp}`,
  ].join('\n');

  return (
    <section aria-label="Contato do aluno" className="space-y-3 rounded-xl border border-white/10 bg-slate-950/35 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-foreground">Contato do aluno</h3>
        <Button type="button" size="sm" variant="outline" onClick={() => void copy(contactText, 'Dados do aluno copiados.')}>
          Copiar dados do aluno
        </Button>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3">
        <p className="text-sm">Nascimento: {birth ? formatBirthDate(birth) : 'pendente'}</p>
        <Button type="button" size="sm" variant="outline" onClick={() => { setBirthDraft(birth ?? ''); setError(''); }}>
          {birth ? 'Editar nascimento' : 'Adicionar nascimento'}
        </Button>
      </div>
      {birthDraft !== null && (
        <form className="flex flex-wrap gap-2" onSubmit={async (event) => {
          event.preventDefault();
          if (saving) return;
          const age = ageFromBirthDate(birthDraft);
          if (age === null || age < 10 || age > 100) { setError('Informe uma data válida para idade entre 10 e 100 anos.'); return; }
          const sb = getSupabase();
          if (!sb) { setError('Não foi possível conectar ao painel.'); return; }
          setSaving(true); setError('');
          try {
            const { data, error: updateError } = await sb.from('alunos').update({ data_nascimento: birthDraft, idade: age } as never).eq('id', aluno.id).select().single();
            if (updateError || !data) throw new Error('Falha ao salvar');
            onUpdated(data as AlunosRow); setBirthDraft(null); setFeedback('Data de nascimento salva.');
          } catch { setError('Não foi possível salvar a data. Tente novamente.'); }
          finally { setSaving(false); }
        }}>
          <label className="basis-full text-sm">Data de nascimento
            <input type="date" required value={birthDraft} disabled={saving} onChange={(event) => { setBirthDraft(event.target.value); setError(''); }}
              className="mt-1 block min-h-11 w-full rounded border border-white/20 bg-brand-bg px-3 text-base" />
          </label>
          <Button type="submit" size="sm" disabled={saving}>Salvar data</Button>
          <Button type="button" size="sm" variant="ghost" disabled={saving} onClick={() => { setBirthDraft(null); setError(''); }}>Cancelar</Button>
          {error && <p role="alert" className="basis-full text-sm text-red-300">{error}</p>}
        </form>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="min-w-0 break-words text-sm">{aluno.nome}</p>
        <Button type="button" size="sm" variant="outline" onClick={() => void copy(aluno.nome, 'Nome copiado.')}>
          Copiar nome
        </Button>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3">
        <p className="min-w-0 break-all text-sm">{email || 'E-mail pendente'}</p>
        <div className="flex flex-wrap gap-2">
          {email && (
            <Button type="button" size="sm" variant="outline" onClick={() => void copy(email, 'E-mail copiado.')}>
              Copiar e-mail
            </Button>
          )}
          {draft === null && (
            <Button type="button" size="sm" variant="outline" onClick={() => { setDraft(email ?? ''); setFeedback(''); }}>
              {email ? 'Editar e-mail' : 'Adicionar e-mail'}
            </Button>
          )}
        </div>
      </div>
      {draft !== null && (
        <form className="flex flex-wrap items-end gap-2" onSubmit={saveEmail} noValidate>
          <label className="min-w-0 basis-full text-sm">
            E-mail do aluno
            <input type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} required
              maxLength={STUDENT_EMAIL_MAX_LENGTH} disabled={saving} value={draft} aria-invalid={Boolean(error)}
              className="mt-1 block min-h-11 w-full rounded border border-white/20 bg-brand-bg px-3 text-base"
              onChange={(event) => { setDraft(event.target.value); setError(''); }} />
          </label>
          <Button type="submit" size="sm" disabled={saving}>{saving ? 'Salvando…' : 'Salvar e-mail'}</Button>
          <Button type="button" size="sm" variant="ghost" disabled={saving} onClick={() => { setDraft(null); setError(''); }}>
            Cancelar
          </Button>
          {error && <p role="alert" className="basis-full text-sm text-red-300">{error}</p>}
        </form>
      )}
      {feedback && <p role="status" className="text-sm text-slate-300">{feedback}</p>}
    </section>
  );
}
