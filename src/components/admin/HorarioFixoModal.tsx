import { useEffect, useMemo, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { getSupabase, formatSupabaseError, type AlunosRow, type HorariosFixosRow } from '@/lib/supabase';
import { addDaysIso, horarioOcorreEm, normalizeHora } from '@/lib/agenda-unificada';
import { cn } from '@/lib/utils';
import { Slashes } from '@/components/brand/SectionLabel';

const DOW = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DOW_LONG = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

interface FormState {
  aluno_id: string;
  dias: number[];
  hora: string;
  duracao: string;
  inicio: string;
  temFim: boolean;
  fim: string;
  observacoes: string;
}

const inputCls =
  'w-full min-h-11 rounded-sm bg-brand-bg border border-white/20 px-3 text-base text-brand-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-text [color-scheme:dark]';
const labelCls = 'block mb-1.5 text-[0.95rem] uppercase';

export default function HorarioFixoModal({
  horario,
  alunos,
  today,
  onClose,
  onSaved,
}: {
  horario: HorariosFixosRow | null;
  alunos: AlunosRow[];
  today: string;
  onClose: () => void;
  onSaved: (row: HorariosFixosRow) => void;
}) {
  const [form, setForm] = useState<FormState>({
    aluno_id: '', dias: [], hora: '07:00', duracao: '60', inicio: today, temFim: false, fim: '', observacoes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    if (horario) {
      setForm({
        aluno_id: horario.aluno_id,
        dias: [...horario.dias_semana].sort(),
        hora: normalizeHora(horario.hora),
        duracao: String(horario.duracao_min),
        inicio: horario.inicio,
        temFim: !!horario.fim,
        fim: horario.fim ?? '',
        observacoes: horario.observacoes ?? '',
      });
    } else {
      setForm({ aluno_id: '', dias: [], hora: '07:00', duracao: '60', inicio: today, temFim: false, fim: '', observacoes: '' });
    }
  }, [horario, today]);

  const alunosAtivos = useMemo(
    () => alunos.filter((a) => a.status === 'ATIVO' || a.id === horario?.aluno_id).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
    [alunos, horario]
  );
  const aluno = alunos.find((a) => a.id === form.aluno_id);

  const preview = useMemo(() => {
    if (form.dias.length === 0) return null;
    const regra = { ativo: true, inicio: form.inicio || today, fim: form.temFim && form.fim ? form.fim : null, dias_semana: form.dias };
    const proximas: string[] = [];
    let total = 0;
    const start = regra.inicio > today ? regra.inicio : today;
    for (let d = start, i = 0; i < 56; i++, d = addDaysIso(d, 1)) {
      if (horarioOcorreEm({ ...regra, id: '', aluno_id: '', hora: form.hora, duracao_min: 60 }, d)) {
        total++;
        if (proximas.length < 4) proximas.push(`${DOW[new Date(`${d}T12:00:00Z`).getUTCDay()].toLowerCase()} ${d.slice(8, 10)}/${d.slice(5, 7)}`);
      }
    }
    const nomes = form.dias.map((d) => DOW_LONG[d]);
    const dias = nomes.length === 1 ? nomes[0] : `${nomes.slice(0, -1).join(', ')} e ${nomes[nomes.length - 1]}`;
    return { texto: `Toda ${dias} às ${form.hora}`, total, proximas };
  }, [form, today]);

  const toggleDia = (d: number) =>
    setForm((s) => ({ ...s, dias: s.dias.includes(d) ? s.dias.filter((x) => x !== d) : [...s.dias, d].sort() }));

  const salvar = async (patch?: Partial<{ ativo: boolean }>) => {
    if (saving) return;
    if (!patch) {
      if (!form.aluno_id) return setError('Selecione o aluno.');
      if (form.dias.length === 0) return setError('Escolha pelo menos um dia da semana.');
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(form.hora)) return setError('Informe um horário válido.');
      if (!form.inicio) return setError('Informe a data de início.');
      if (form.temFim && (!form.fim || form.fim < form.inicio)) return setError('A data de término precisa ser depois do início.');
    }
    const sb = getSupabase();
    if (!sb) return setError('Supabase não está configurado neste ambiente.');
    setSaving(true);
    setError(null);
    try {
      const payload = patch ?? {
        aluno_id: form.aluno_id,
        dias_semana: form.dias,
        hora: form.hora,
        duracao_min: Number(form.duracao),
        inicio: form.inicio,
        fim: form.temFim ? form.fim : null,
        observacoes: form.observacoes.trim() || null,
        ativo: horario ? horario.ativo : true,
      };
      const query = horario
        ? sb.from('horarios_fixos').update(payload as never).eq('id', horario.id)
        : sb.from('horarios_fixos').insert(payload as never);
      const { data, error: err } = await query.select().single();
      if (err) throw err;
      onSaved(data as HorariosFixosRow);
    } catch (err) {
      setError(formatSupabaseError(err, 'Salvar horário fixo').message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-5 sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="title-display flex items-center gap-3 text-3xl text-brand-ink">
            {horario ? 'Editar horário fixo' : 'Novo horário fixo'} <Slashes className="text-2xl" />
          </h2>
          <p className="mt-1 text-sm text-brand-muted">As aulas aparecem sozinhas na agenda, toda semana.</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Fechar" className="grid h-9 w-9 shrink-0 place-items-center border border-white/20 text-brand-muted hover:text-brand-ink">
          <X className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); salvar(); }} className="space-y-5">
        <div>
          <label htmlFor="hf-aluno" className={labelCls}>Aluno</label>
          <select id="hf-aluno" value={form.aluno_id} onChange={(e) => setForm((s) => ({ ...s, aluno_id: e.target.value }))} className={inputCls}>
            <option value="">Selecione…</option>
            {alunosAtivos.map((a) => (
              <option key={a.id} value={a.id}>{a.nome}</option>
            ))}
          </select>
          {alunosAtivos.length === 0 && <p className="mt-1.5 text-sm text-brand-subtle">Só alunos com status Ativo podem ter horário fixo.</p>}
        </div>

        <fieldset>
          <legend className={labelCls}>Dias da semana</legend>
          <div className="grid grid-cols-7 gap-1.5">
            {DOW.map((d, i) => (
              <button
                key={d}
                type="button"
                aria-pressed={form.dias.includes(i)}
                onClick={() => toggleDia(i)}
                className={cn('min-h-12 border text-base', form.dias.includes(i) ? 'border-brand-blue bg-brand-blue text-white' : 'border-white/20 text-brand-ink hover:border-brand-blue-text')}
              >
                {d}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label htmlFor="hf-hora" className={labelCls}>Horário</label>
            <input id="hf-hora" type="time" value={form.hora} onChange={(e) => setForm((s) => ({ ...s, hora: e.target.value }))} className={inputCls} />
          </div>
          <div>
            <label htmlFor="hf-dur" className={labelCls}>Duração</label>
            <select id="hf-dur" value={form.duracao} onChange={(e) => setForm((s) => ({ ...s, duracao: e.target.value }))} className={inputCls}>
              {['30', '45', '60', '75', '90', '120'].map((m) => <option key={m} value={m}>{m} min</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="hf-inicio" className={labelCls}>Começa em</label>
            <input id="hf-inicio" type="date" value={form.inicio} onChange={(e) => setForm((s) => ({ ...s, inicio: e.target.value }))} className={inputCls} />
          </div>
        </div>

        <fieldset className="space-y-2">
          <legend className={labelCls}>Termina</legend>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <label className="inline-flex min-h-11 items-center gap-2">
              <input type="radio" name="hf-fim" checked={!form.temFim} onChange={() => setForm((s) => ({ ...s, temFim: false }))} className="h-4 w-4 accent-[#1446FF]" />
              Sem data (até pausar)
            </label>
            <label className="inline-flex min-h-11 items-center gap-2">
              <input type="radio" name="hf-fim" checked={form.temFim} onChange={() => setForm((s) => ({ ...s, temFim: true }))} className="h-4 w-4 accent-[#1446FF]" />
              Em uma data
            </label>
            {form.temFim && (
              <input type="date" aria-label="Data de término" value={form.fim} min={form.inicio} onChange={(e) => setForm((s) => ({ ...s, fim: e.target.value }))} className={cn(inputCls, 'w-auto')} />
            )}
          </div>
        </fieldset>

        <div>
          <label htmlFor="hf-obs" className={labelCls}>Observações</label>
          <input id="hf-obs" type="text" value={form.observacoes} placeholder="Ex.: treino em casa, levar faixa elástica" onChange={(e) => setForm((s) => ({ ...s, observacoes: e.target.value }))} className={inputCls} />
        </div>

        {preview && (
          <div className="border border-[#2A4BD6] bg-[#14224F] px-4 py-3 text-sm text-[#DCE5FF]">
            <p className="font-semibold">{preview.texto} — {preview.total} aulas nas próximas 8 semanas.</p>
            <p className="mt-1">Próximas: {preview.proximas.join(' · ') || '—'}</p>
            {aluno && (
              <p className="mt-1 text-[#FFD889]">
                {aluno.permuta
                  ? 'Aluno em permuta: não gera cobrança.'
                  : aluno.mensalidade && aluno.dia_vencimento
                    ? `A mensalidade de ${Number(aluno.mensalidade).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} aparece na agenda todo dia ${aluno.dia_vencimento}.`
                    : 'Este aluno ainda não tem mensalidade e vencimento: configure na ficha para a cobrança aparecer na agenda.'}
              </p>
            )}
          </div>
        )}

        {error && <p role="alert" className="border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>}

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button type="submit" disabled={saving} className="btn-brand !min-h-12 disabled:opacity-60">
            {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {horario ? 'Salvar alterações' : 'Salvar horário fixo'}
          </button>
          {horario && (
            <button type="button" disabled={saving} onClick={() => salvar({ ativo: !horario.ativo })} className="min-h-12 border border-white/25 px-4 hover:border-brand-blue-text disabled:opacity-60">
              {horario.ativo ? 'Pausar horário' : 'Reativar horário'}
            </button>
          )}
          <button type="button" onClick={onClose} className="min-h-12 px-4 text-brand-muted hover:text-brand-ink">Cancelar</button>
        </div>
        {horario && (
          <p className="text-xs text-brand-subtle">
            Pausar esconde as próximas aulas deste horário. Presenças e faltas já registradas continuam no histórico.
          </p>
        )}
      </form>
    </div>
  );
}
