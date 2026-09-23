import { Plus, Trash2 } from 'lucide-react'
import type { Companion } from '../types/expeditionForm'
import { FIELD_LIMITS, limitText, maskDate, onlyDigits } from '../lib/formRules'

type CompanionField = 'nome' | 'rg' | 'dataNascimento' | 'tamanhoCamiseta'

interface Props {
  companions: Companion[]
  errors: Record<string, string | undefined>
  accent: string
  onAdd: () => void
  onRemove: (id: string) => void
  onChange: (id: string, field: CompanionField, value: string) => void
}

const shirtSizes = ['PP', 'P', 'M', 'G', 'GG', 'XGG']

export function CompanionsSection({ companions, errors, accent, onAdd, onRemove, onChange }: Props) {
  return (
    <section className="mt-10 border-t border-black/10 pt-9" aria-labelledby="companions-title">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h4 className="font-display text-xl font-bold" id="companions-title">Acompanhantes</h4>
          <p className="mt-1 text-sm text-black/55">Adicione até três pessoas que irão com você. Os dados de cada uma serão revisados antes do envio.</p>
        </div>
        <span className="font-mono text-xs font-bold" style={{ color: accent }}>{companions.length}/3</span>
      </div>

      <div className="mt-6 space-y-5">
        {companions.map((companion, index) => {
          const prefix = `acompanhante-${index}`
          const field = (name: CompanionField, label: string, value: string, hint: string, numeric = false) => {
            const id = `${prefix}-${name}`
            const error = errors[id]
            return (
              <div>
                <label className="mb-2 block text-[13px] font-semibold" htmlFor={id}>{label}{name !== 'rg' && <span className="ml-1" style={{ color: accent }}>*</span>}</label>
                <input
                  aria-describedby={error ? `${id}-error` : undefined}
                  aria-invalid={Boolean(error)}
                  className={`h-14 w-full rounded-xl border bg-white px-4 text-[15px] outline-none transition focus:ring-4 ${error ? 'border-red-500 focus:ring-red-100' : 'border-black/15 focus:ring-black/5'}`}
                  id={id}
                  inputMode={numeric ? 'numeric' : 'text'}
                  maxLength={name === 'nome' ? FIELD_LIMITS.nome : name === 'rg' ? FIELD_LIMITS.rg : FIELD_LIMITS.data}
                  onChange={(event) => onChange(companion.id, name, name === 'nome' ? limitText(event.target.value, FIELD_LIMITS.nome) : name === 'rg' ? onlyDigits(event.target.value).slice(0, FIELD_LIMITS.rg) : maskDate(event.target.value))}
                  placeholder={hint}
                  required={name !== 'rg'}
                  value={value}
                />
                {error && <p className="mt-2 text-xs font-medium text-red-600" id={`${id}-error`}>{error}</p>}
              </div>
            )
          }
          const shirtId = `${prefix}-tamanhoCamiseta`
          return (
            <div className="rounded-2xl border border-black/10 bg-black/[0.015] p-5 sm:p-6" key={companion.id}>
              <div className="mb-5 flex items-center justify-between gap-4">
                <h5 className="font-display text-lg font-bold">Acompanhante {index + 1}</h5>
                <button className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7d4b3d] underline-offset-2 hover:underline" onClick={() => onRemove(companion.id)} type="button"><Trash2 aria-hidden="true" className="h-4 w-4" />Remover</button>
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="sm:col-span-2">{field('nome', 'Nome completo', companion.nome, 'Nome e sobrenome')}</div>
                {field('rg', 'RG (opcional)', companion.rg, 'Somente números', true)}
                {field('dataNascimento', 'Data de nascimento', companion.dataNascimento, 'DD/MM/AAAA', true)}
                <div>
                  <label className="mb-2 block text-[13px] font-semibold" htmlFor={shirtId}>Tamanho da camiseta<span className="ml-1" style={{ color: accent }}>*</span></label>
                  <select aria-describedby={errors[shirtId] ? `${shirtId}-error` : undefined} aria-invalid={Boolean(errors[shirtId])} className={`h-14 w-full rounded-xl border bg-white px-4 text-[15px] outline-none ${errors[shirtId] ? 'border-red-500' : 'border-black/15'}`} id={shirtId} onChange={(event) => onChange(companion.id, 'tamanhoCamiseta', event.target.value)} required value={companion.tamanhoCamiseta}>
                    <option value="">Selecione</option>
                    {shirtSizes.map((size) => <option key={size} value={size}>{size}</option>)}
                  </select>
                  {errors[shirtId] && <p className="mt-2 text-xs font-medium text-red-600" id={`${shirtId}-error`}>{errors[shirtId]}</p>}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {companions.length < 3 && <button className="mt-6 inline-flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold transition hover:bg-black/5" onClick={onAdd} style={{ borderColor: accent, color: accent }} type="button"><Plus aria-hidden="true" className="h-4 w-4" />Adicionar acompanhante</button>}
    </section>
  )
}
