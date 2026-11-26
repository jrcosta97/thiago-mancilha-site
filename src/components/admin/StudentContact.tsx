import { useState, type FormEvent } from 'react';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getSupabase, type AlunosRow } from '@/lib/supabase';
import { formatWhatsApp, buildWhatsAppLink } from '@/services/sheet-sync';
import { ageFromBirthDate, formatBirthDate } from '../../../supabase/functions/insert-aluno/birth-date';
import { normalizeStudentEmail, STUDENT_EMAIL_MAX_LENGTH } from '../../../supabase/functions/insert-aluno/email';

export default function StudentContact({ aluno, onUpdated }: {
  aluno: AlunosRow;
  onUpdated: (row: AlunosRow) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ nome: aluno.nome, email: aluno.email ?? '', nascimento: aluno.data_nascimento ?? '', whatsapp: aluno.whatsapp });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  const startEditing = () => {
    setDraft({ nome: aluno.nome, email: aluno.email ?? '', nascimento: aluno.data_nascimento ?? '', whatsapp: aluno.whatsapp });
    setError('');
    setFeedback('');
    setEditing(true);
  };

  const copy = async () => {
    const text = [
      `Nome: ${aluno.nome}`,
      ...(aluno.email ? [`E-mail: ${aluno.email}`] : []),
      `Data de nascimento: ${aluno.data_nascimento ? formatBirthDate(aluno.data_nascimento) : 'não informada'}`,
      `WhatsApp: ${aluno.whatsapp}`,
    ].join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setFeedback('Dados do aluno copiados.');
    } catch {
      setFeedback('Não foi possível copiar os dados.');
    }
  };

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    const nome = draft.nome.trim();
    const email = draft.email.trim() ? normalizeStudentEmail(draft.email) : null;
    const age = draft.nascimento ? ageFromBirthDate(draft.nascimento) : null;
    const phone = formatWhatsApp(draft.whatsapp);
    if (nome.length < 2) { setError('Informe um nome válido.'); return; }
    if (draft.email.trim() && !email) { setError('Informe um e-mail válido.'); return; }
    if (draft.nascimento && (age === null || age < 10 || age > 100)) { setError('Informe uma data de nascimento válida.'); return; }
    if (!phone.valid) { setError('Informe um WhatsApp válido com DDD.'); return; }
    const sb = getSupabase();
    if (!sb) { setError('Não foi possível conectar ao painel.'); return; }
    setSaving(true);
    setError('');
    try {
      const updates = {
        nome, email, data_nascimento: draft.nascimento || null,
        idade: draft.nascimento ? age : aluno.idade,
        whatsapp: phone.formatted, whatsapp_link: buildWhatsAppLink(phone.formatted) || null,
      };
      const { data, error: updateError } = await sb.from('alunos')
        .update(updates as never).eq('id', aluno.id).select().single();
      if (updateError || !data) throw new Error('Falha ao salvar contato');
      onUpdated(data as AlunosRow);
      setEditing(false);
      setFeedback('Dados do aluno atualizados.');
    } catch {
      setError('Não foi possível salvar os dados. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'mt-1 block min-h-11 w-full rounded border border-white/20 bg-brand-bg px-3 text-base';
  return (
    <section aria-label="Contato do aluno" className="space-y-3 rounded-xl border border-white/10 bg-slate-950/35 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-foreground">Contato do aluno</h3>
        <div className="flex items-center gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => void copy()}>Copiar dados do aluno</Button>
          <Button type="button" size="icon-sm" variant="outline" onClick={startEditing} aria-label="Editar dados do aluno" disabled={editing}>
            <Pencil className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
      {editing ? (
        <form className="grid gap-3 border-t border-white/10 pt-3 sm:grid-cols-2" onSubmit={save} noValidate>
          <label className="text-sm">Nome
            <input className={inputClass} autoComplete="name" value={draft.nome} disabled={saving}
              onChange={(event) => setDraft({ ...draft, nome: event.target.value })} />
          </label>
          <label className="text-sm">E-mail
            <input className={inputClass} type="email" autoComplete="email" autoCapitalize="none" maxLength={STUDENT_EMAIL_MAX_LENGTH}
              value={draft.email} disabled={saving} onChange={(event) => setDraft({ ...draft, email: event.target.value })} />
          </label>
          <label className="text-sm">Data de nascimento
            <input className={inputClass} type="date" value={draft.nascimento} disabled={saving}
              onChange={(event) => setDraft({ ...draft, nascimento: event.target.value })} />
          </label>
          <label className="text-sm">WhatsApp
            <input className={inputClass} type="tel" autoComplete="tel" value={draft.whatsapp} disabled={saving}
              onChange={(event) => setDraft({ ...draft, whatsapp: event.target.value })} />
          </label>
          {error && <p role="alert" className="text-sm text-red-300 sm:col-span-2">{error}</p>}
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" size="sm" disabled={saving}>{saving ? 'Salvando…' : 'Salvar'}</Button>
            <Button type="button" size="sm" variant="ghost" disabled={saving} onClick={() => { setEditing(false); setError(''); }}>Cancelar</Button>
          </div>
        </form>
      ) : (
        <div className="space-y-2 border-t border-white/10 pt-3 text-sm">
          <p className="break-words"><span className="text-slate-400">Nome:</span> {aluno.nome}</p>
          <p className="break-all"><span className="text-slate-400">E-mail:</span> {aluno.email || 'Pendente'}</p>
          <p><span className="text-slate-400">Nascimento:</span> {aluno.data_nascimento ? formatBirthDate(aluno.data_nascimento) : 'Pendente'}</p>
          <p><span className="text-slate-400">WhatsApp:</span> {aluno.whatsapp}</p>
        </div>
      )}
      {feedback && <p role="status" className="text-sm text-slate-300">{feedback}</p>}
    </section>
  );
}
