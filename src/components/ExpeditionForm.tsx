import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, InputHTMLAttributes, ReactNode } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  FileCheck2,
  FileUp,
  LoaderCircle,
  LockKeyhole,
  ShipWheel,
  UserRound,
} from 'lucide-react'
import {
  FIELD_LIMITS,
  limitText,
  maskCep,
  maskCnpj,
  maskCpf,
  maskDate,
  maskPhone,
  onlyDigits,
  sanitizeHouseNumber,
  sanitizeIdentifier,
  validateJet,
  validatePersonal,
} from '../lib/formRules'
import { initialValues } from '../types/expeditionForm'
import { CompanionsSection } from './CompanionsSection'
import { appendCompanions } from '../lib/companionRules'
import type { Companion } from '../types/expeditionForm'
import type { FormErrors, FormValues, Ownership, OwnerType, Step } from '../types/expeditionForm'

const states = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS',
  'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC',
  'SP', 'SE', 'TO',
]

const steps = [
  { label: 'Dados pessoais', icon: UserRound },
  { label: 'Jet e habilitação', icon: ShipWheel },
  { label: 'Revisão', icon: FileCheck2 },
]

const BASIN_ENDPOINT = import.meta.env.VITE_BASIN_ENDPOINT?.trim() || 'https://usebasin.com/f/2566ad740c53'
const SUBMISSION_TIMEOUT_MS = 180_000
const PROTOCOL_REQUEST_KEY = 'usina:protocolo:solicitacao'

function isValidBasinEndpoint(endpoint: string) {
  try {
    const url = new URL(endpoint)
    return url.protocol === 'https:' && url.hostname === 'usebasin.com' && /^\/f\/[^/]+\/?$/.test(url.pathname)
  } catch {
    return false
  }
}

const BASIN_ENDPOINT_IS_VALID = isValidBasinEndpoint(BASIN_ENDPOINT)

function appendText(payload: FormData, label: string, value: string) {
  const normalizedValue = value.trim()
  if (normalizedValue) payload.append(label, normalizedValue)
}

function createBasinPayload(values: FormValues, protocol: string) {
  const payload = new FormData()
  payload.append('Protocolo da inscrição', protocol)

  payload.append('_subject', `Nova inscrição — ${values.nomeCompleto} (Expedição Angra × Paraty)`)
  payload.append('Evento', 'Expedição Angra × Paraty')
  appendText(payload, 'Nome completo', values.nomeCompleto)
  appendText(payload, 'CPF', values.cpf)
  appendText(payload, 'RG', values.rg)
  appendText(payload, 'Data de nascimento', values.dataNascimento)
  appendText(payload, 'E-mail', values.email)
  appendText(payload, 'WhatsApp', values.whatsapp)
  appendText(payload, 'CEP', values.cep)
  appendText(payload, 'Endereço', values.endereco)
  appendText(payload, 'Número', values.numero)
  appendText(payload, 'Complemento', values.complemento)
  appendText(payload, 'Cidade', values.cidade)
  appendText(payload, 'Estado', values.estado)
  appendCompanions(payload, values.acompanhantes)

  if (values.proprietarioJet === 'participante') {
    payload.append('Proprietário do jet ski', 'O próprio participante')
    payload.append('Tipo do proprietário', 'Pessoa física')
    appendText(payload, 'Nome do proprietário', values.nomeCompleto)
    appendText(payload, 'CPF do proprietário', values.cpf)
  } else {
    payload.append('Proprietário do jet ski', 'Terceiro')
    payload.append('Tipo do proprietário', values.tipoProprietario === 'pj' ? 'Pessoa jurídica' : 'Pessoa física')

    if (values.tipoProprietario === 'pj') {
      appendText(payload, 'Razão social do proprietário', values.razaoSocialProprietario)
      appendText(payload, 'CNPJ do proprietário', values.cnpjProprietario)
    } else {
      appendText(payload, 'Nome do proprietário', values.nomeProprietario)
      appendText(payload, 'CPF do proprietário', values.cpfProprietario)
    }
  }

  appendText(payload, 'Marca do jet ski', values.marcaJet)
  appendText(payload, 'Modelo do jet ski', values.modeloJet)
  appendText(payload, 'Ano do jet ski', values.anoJet)
  appendText(payload, 'Inscrição do jet ski', values.inscricaoJet)
  appendText(payload, 'Número da habilitação de motonauta', values.numeroArrais)
  appendText(payload, 'Validade da habilitação', values.validadeArrais)
  payload.append('Declaração de veracidade aceita', values.confirmacao ? 'Sim' : 'Não')

  if (values.docJet) payload.append('Documento do jet ski', values.docJet)
  if (values.docArrais) payload.append('Habilitação de motonauta', values.docArrais)

  return payload
}

const fieldClassName = (hasError: boolean) =>
  `h-14 w-full rounded-xl border bg-[#fbfcfa] px-4 text-[15px] text-[#132d36] outline-none transition duration-200 placeholder:text-[#99a5a8] hover:border-[#aab9ba] focus:border-[#0b92aa] focus:bg-white focus:ring-4 focus:ring-[#0b92aa]/10 ${
    hasError ? 'border-red-500 bg-red-50/40' : 'border-[#d1dcda]'
  }`

interface FieldShellProps {
  id: string
  label: string
  error?: string
  required?: boolean
  hint?: string
  children: ReactNode
}

function FieldShell({ id, label, error, required, hint, children }: FieldShellProps) {
  return (
    <div>
      <label className="mb-2.5 block text-[13px] font-semibold tracking-[0.01em] text-[#29434b]" htmlFor={id}>
        {label}
        {required && <span className="ml-1 text-[#0b92aa]">*</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-2.5 text-xs leading-5 text-[#78888c]">{hint}</p>}
      {error && (
        <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-600" id={`${id}-error`}>
          <AlertCircle aria-hidden="true" className="h-3.5 w-3.5" />
          {error}
        </p>
      )}
    </div>
  )
}

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
}

function TextField({ label, error, hint, required, id = '', ...props }: TextFieldProps) {
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} required={required}>
      <input
        {...props}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={fieldClassName(Boolean(error))}
        id={id}
        required={required}
      />
    </FieldShell>
  )
}

interface StateSelectProps {
  value: string
  error?: string
  onChange: (value: string) => void
}

function StateSelect({ value, error, onChange }: StateSelectProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [])

  return (
    <FieldShell id="estado" label="Estado" error={error} required>
      <div className="relative" ref={rootRef}>
        <button
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-invalid={Boolean(error)}
          className={`${fieldClassName(Boolean(error))} flex items-center justify-between text-left`}
          id="estado"
          onClick={() => setOpen((current) => !current)}
          ref={buttonRef}
          type="button"
        >
          <span className={value ? 'font-medium text-[#132d36]' : 'text-[#99a5a8]'}>
            {value || 'Selecione seu estado'}
          </span>
          <ChevronDown aria-hidden="true" className={`h-4 w-4 text-[#718087] transition ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <div className="absolute inset-x-0 top-[calc(100%+0.55rem)] z-30 rounded-2xl border border-[#d1dcda] bg-white p-3 shadow-[0_22px_70px_rgba(7,29,38,0.18)]" role="listbox">
            <p className="px-2 pb-2 pt-1 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[#87969a]">
              Selecione a UF
            </p>
            <div className="grid max-h-60 grid-cols-4 gap-1 overflow-y-auto pr-1 sm:grid-cols-5">
              {states.map((state) => (
                <button
                  aria-selected={value === state}
                  className={`rounded-lg px-2 py-2.5 text-sm font-semibold transition ${
                    value === state
                      ? 'bg-[#092f3a] text-white'
                      : 'text-[#36545e] hover:bg-[#e8f7f7] hover:text-[#087e94]'
                  }`}
                  key={state}
                  onClick={() => {
                    onChange(state)
                    setOpen(false)
                    buttonRef.current?.focus()
                  }}
                  role="option"
                  type="button"
                >
                  {state}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </FieldShell>
  )
}

interface UploadFieldProps {
  id: string
  label: string
  file: File | null
  error?: string
  onChange: (file: File | null) => void
}

function UploadField({ id, label, file, error, onChange }: UploadFieldProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.files?.[0] ?? null)
  }

  return (
    <FieldShell
      id={id}
      label={label}
      error={error}
      required
      hint="PDF, JPG ou PNG de até 10 MB."
    >
      <label
        className={`flex min-h-28 cursor-pointer items-center gap-4 rounded-2xl border border-dashed px-5 py-4 transition hover:border-[#0b92aa] hover:bg-[#f1fafb] ${
          error ? 'border-red-500 bg-red-50' : 'border-[#b8c8c8] bg-[#f8fbfa]'
        }`}
        htmlFor={id}
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#dff7fa] text-[#087e94]">
          {file ? <FileCheck2 aria-hidden="true" className="h-5 w-5" /> : <FileUp aria-hidden="true" className="h-5 w-5" />}
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-[#16313a]">
            {file ? 'Documento selecionado' : 'Selecionar documento'}
          </span>
          <span className="mt-1 block truncate text-xs text-[#718087]">
            {file?.name ?? 'Toque para escolher o arquivo'}
          </span>
        </span>
      </label>
      <input
        accept="application/pdf,image/jpeg,image/png"
        className="sr-only"
        id={id}
        onChange={handleChange}
        type="file"
      />
    </FieldShell>
  )
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 border-b border-[#dde5e5] py-3 last:border-0 sm:grid-cols-[190px_1fr] sm:gap-5">
      <dt className="text-xs font-bold uppercase tracking-[0.08em] text-[#718087]">{label}</dt>
      <dd className="break-words text-sm font-medium text-[#16313a]">{value || 'Não informado'}</dd>
    </div>
  )
}

export function ExpeditionForm() {
  const formTopRef = useRef<HTMLElement>(null)
  const requestIdRef = useRef('')
  const submittingRef = useRef(false)
  const [step, setStep] = useState<Step>(0)
  const [values, setValues] = useState<FormValues>(initialValues)
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [protocol, setProtocol] = useState('')

  const address = useMemo(
    () =>
      [
        values.endereco,
        values.numero,
        values.complemento,
        values.cidade,
        values.estado,
        values.cep,
      ]
        .filter(Boolean)
        .join(', '),
    [values],
  )

  const updateField = <Key extends keyof FormValues>(key: Key, value: FormValues[Key]) => {
    setValues((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
    setSubmitError('')
  }

  const addCompanion = () => {
    setValues((current) => current.acompanhantes.length >= 3 ? current : {
      ...current,
      acompanhantes: [...current.acompanhantes, { id: crypto.randomUUID(), nome: '', rg: '', dataNascimento: '', tamanhoCamiseta: '' }],
    })
  }

  const updateCompanion = (id: string, field: keyof Omit<Companion, 'id'>, value: string) => {
    const index = values.acompanhantes.findIndex((companion) => companion.id === id)
    setValues((current) => ({ ...current, acompanhantes: current.acompanhantes.map((companion) => companion.id === id ? { ...companion, [field]: value } : companion) }))
    if (index >= 0) setErrors((current) => ({ ...current, [`acompanhante-${index}-${field}`]: undefined }))
    setSubmitError('')
  }

  const removeCompanion = (id: string) => {
    setValues((current) => ({ ...current, acompanhantes: current.acompanhantes.filter((companion) => companion.id !== id) }))
    setErrors((current) => Object.fromEntries(Object.entries(current).filter(([key]) => !key.startsWith('acompanhante-'))))
    setSubmitError('')
  }

  const updateOwnership = (ownership: Ownership) => {
    setValues((current) => ({
      ...current,
      proprietarioJet: ownership,
      tipoProprietario: ownership === 'participante' ? '' : current.tipoProprietario,
      nomeProprietario: ownership === 'participante' ? '' : current.nomeProprietario,
      cpfProprietario: ownership === 'participante' ? '' : current.cpfProprietario,
      razaoSocialProprietario: ownership === 'participante' ? '' : current.razaoSocialProprietario,
      cnpjProprietario: ownership === 'participante' ? '' : current.cnpjProprietario,
    }))
    setErrors((current) => ({
      ...current,
      proprietarioJet: undefined,
      tipoProprietario: undefined,
      nomeProprietario: undefined,
      cpfProprietario: undefined,
      razaoSocialProprietario: undefined,
      cnpjProprietario: undefined,
    }))
    setSubmitError('')
  }

  const updateOwnerType = (ownerType: OwnerType) => {
    setValues((current) => ({
      ...current,
      tipoProprietario: ownerType,
      nomeProprietario: ownerType === 'pf' ? current.nomeProprietario : '',
      cpfProprietario: ownerType === 'pf' ? current.cpfProprietario : '',
      razaoSocialProprietario: ownerType === 'pj' ? current.razaoSocialProprietario : '',
      cnpjProprietario: ownerType === 'pj' ? current.cnpjProprietario : '',
    }))
    setErrors((current) => ({
      ...current,
      tipoProprietario: undefined,
      nomeProprietario: undefined,
      cpfProprietario: undefined,
      razaoSocialProprietario: undefined,
      cnpjProprietario: undefined,
    }))
    setSubmitError('')
  }

  const scrollToForm = () => {
    formTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const showErrors = (nextErrors: FormErrors) => {
    setErrors(nextErrors)
    const firstField = Object.keys(nextErrors)[0]
    window.setTimeout(() => document.getElementById(firstField)?.focus(), 100)
  }

  const nextStep = () => {
    const nextErrors = step === 0 ? validatePersonal(values) : validateJet(values)
    if (Object.keys(nextErrors).length > 0) {
      showErrors(nextErrors)
      return
    }
    setErrors({})
    setStep((current) => Math.min(current + 1, 2) as Step)
    window.setTimeout(scrollToForm, 50)
  }

  const previousStep = () => {
    setErrors({})
    setStep((current) => Math.max(current - 1, 0) as Step)
    window.setTimeout(scrollToForm, 50)
  }

  const submitForm = async () => {
    if (submittingRef.current) return
    const personalErrors = validatePersonal(values)
    if (Object.keys(personalErrors).length > 0) {
      setStep(0)
      showErrors(personalErrors)
      window.setTimeout(scrollToForm, 50)
      return
    }

    const jetErrors = validateJet(values)
    if (Object.keys(jetErrors).length > 0) {
      setStep(1)
      showErrors(jetErrors)
      window.setTimeout(scrollToForm, 50)
      return
    }

    if (!BASIN_ENDPOINT) {
      setSubmitError('O formulário está pronto, mas o canal de envio ainda não foi configurado.')
      return
    }

    if (!BASIN_ENDPOINT_IS_VALID) {
      setSubmitError('O endereço de envio configurado não é um endpoint válido do Basin.')
      return
    }

    submittingRef.current = true
    setSubmitting(true)
    setSubmitError('')
    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => controller.abort(), SUBMISSION_TIMEOUT_MS)
    let failureStage: 'protocol' | 'basin' = 'protocol'

    try {
      let requestId = requestIdRef.current
      try {
        requestId ||= window.sessionStorage.getItem(PROTOCOL_REQUEST_KEY) || ''
      } catch {
        // O ID continua disponível na memória se o navegador bloquear o armazenamento.
      }
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId)) {
        requestId = window.crypto.randomUUID()
      }
      requestIdRef.current = requestId
      try {
        window.sessionStorage.setItem(PROTOCOL_REQUEST_KEY, requestId)
      } catch {
        // Armazenamento opcional: a referência mantém o ID durante esta visita.
      }

      const protocolResponse = await fetch('/api/protocol', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId }),
        signal: controller.signal,
      })
      if (!protocolResponse.ok) throw new Error('Falha ao gerar protocolo')
      const protocolBody = await protocolResponse.json() as { protocol?: unknown }
      if (typeof protocolBody.protocol !== 'string' || !/^\d{3,}$/.test(protocolBody.protocol)) {
        throw new Error('Protocolo inválido')
      }
      const reservedProtocol = protocolBody.protocol

      failureStage = 'basin'
      const response = await fetch(BASIN_ENDPOINT, {
        method: 'POST',
        body: createBasinPayload(values, reservedProtocol),
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      })

      if (!response.ok) {
        let responseMessage = ''

        try {
          const responseBody = await response.json() as { error?: string; message?: string }
          responseMessage = responseBody.message ?? responseBody.error ?? ''
        } catch {
          responseMessage = ''
        }

        throw new Error(responseMessage || `Falha no envio: ${response.status}`)
      }

      setProtocol(reservedProtocol)
      setSubmitted(true)
      try {
        window.sessionStorage.removeItem(PROTOCOL_REQUEST_KEY)
      } catch {
        // O envio já foi concluído; a limpeza local não afeta o protocolo.
      }
      requestIdRef.current = ''
      scrollToForm()
    } catch (error) {
      const timedOut = error instanceof DOMException && error.name === 'AbortError'
      setSubmitError(
        timedOut
          ? 'O envio demorou mais do que o esperado. Verifique sua conexão e tente novamente.'
          : failureStage === 'protocol'
            ? 'Não foi possível gerar o protocolo agora. Verifique sua conexão e tente novamente.'
            : 'Não foi possível enviar agora. Verifique sua conexão e tente novamente.',
      )
    } finally {
      window.clearTimeout(timeoutId)
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <section className="bg-[#f4f3ee] px-6 py-24 text-[#09232d]" id="inscricao" ref={formTopRef}>
        <div className="mx-auto max-w-2xl rounded-3xl border border-[#d4ddda] bg-[#fffefc] p-8 text-center shadow-[0_24px_80px_rgba(5,29,38,0.09)] sm:p-12">
          <CheckCircle2 aria-hidden="true" className="mx-auto h-12 w-12 text-[#0b92aa]" />
          <p className="mt-6 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-[#087e94]">Inscrição recebida</p>
          <h2 className="mt-3 font-display text-3xl font-bold">Dados enviados com sucesso.</h2>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.14em] text-[#5e7077]">Seu protocolo</p>
          <p className="mt-1 font-display text-4xl font-bold tracking-[-0.04em]" aria-label={`Protocolo ${protocol}`}>{protocol}</p>
          <p className="mt-2 text-sm text-[#5e7077]">Guarde este número para identificar sua inscrição.</p>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-[#5e7077]">
            A equipe da Usina do Jet conferirá os documentos e entrará em contato pelo WhatsApp informado.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="scroll-mt-0 bg-[#f4f3ee] px-4 py-16 text-[#09232d] sm:px-8 lg:py-24" id="inscricao" ref={formTopRef}>
      <div className="mx-auto max-w-[1120px]">
        <div className="max-w-2xl sm:pl-2">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-[#087e94]">Sua inscrição</p>
          <h2 className="mt-4 font-display text-4xl font-bold leading-[1.08] tracking-[-0.04em] sm:text-5xl">Conte um pouco sobre você.</h2>
          <p className="mt-4 max-w-xl text-sm leading-6 text-[#64767b] sm:text-base">
            Os campos com <span className="font-bold text-[#0b92aa]">*</span> são obrigatórios. Você poderá revisar tudo antes do envio.
          </p>
        </div>

        <nav aria-label="Etapas da inscrição" className="mt-10 grid grid-cols-3 overflow-hidden rounded-t-3xl border border-[#d2dcda] bg-[#fffefc] shadow-[0_18px_55px_rgba(5,29,38,0.06)]">
          {steps.map(({ label, icon: Icon }, index) => {
            const active = index === step
            const complete = index < step
            return (
              <button
                aria-current={active ? 'step' : undefined}
                className={`flex min-h-24 items-center gap-3 border-r border-[#dbe3e1] px-3 text-left transition last:border-r-0 sm:px-6 ${
                  active ? 'bg-[#092f3a] text-white' : 'text-[#718087]'
                } ${complete ? 'cursor-pointer' : 'cursor-default'}`}
                disabled={!complete}
                key={label}
                onClick={() => {
                  setStep(index as Step)
                  setErrors({})
                }}
                type="button"
              >
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${active ? 'bg-cyan-300 text-[#09232d]' : complete ? 'bg-[#dff7fa] text-[#087e94]' : 'bg-[#edf2f1]'}`}>
                  {complete ? <Check aria-hidden="true" className="h-4 w-4" /> : <Icon aria-hidden="true" className="h-4 w-4" />}
                </span>
                <span className="hidden text-sm font-bold sm:block">{label}</span>
                <span className="font-mono text-[10px] font-bold sm:hidden">0{index + 1}</span>
              </button>
            )
          })}
        </nav>

        <form className="rounded-b-3xl border-x border-b border-[#d2dcda] bg-[#fffefc] p-5 shadow-[0_26px_80px_rgba(5,29,38,0.09)] sm:p-9 lg:p-14" noValidate onSubmit={(event) => event.preventDefault()}>
          {step === 0 && (
            <div>
              <div className="mb-9 flex items-start gap-4 border-b border-[#e0e6e3] pb-7">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#e2f6f7] font-mono text-[11px] font-bold text-[#087e94]">01</span>
                <div>
                  <h3 className="font-display text-2xl font-bold">Dados pessoais</h3>
                  <p className="mt-1.5 text-sm leading-6 text-[#718087]">Use os mesmos dados que constam nos seus documentos.</p>
                </div>
              </div>
              <div className="grid gap-x-6 gap-y-7 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <TextField id="nomeCompleto" label="Nome completo" required autoComplete="name" maxLength={FIELD_LIMITS.nome} value={values.nomeCompleto} error={errors.nomeCompleto} onChange={(event) => updateField('nomeCompleto', limitText(event.target.value, FIELD_LIMITS.nome))} />
                </div>
                <TextField id="cpf" label="CPF" required inputMode="numeric" maxLength={FIELD_LIMITS.cpf} placeholder="000.000.000-00" value={values.cpf} error={errors.cpf} onChange={(event) => updateField('cpf', maskCpf(event.target.value))} />
                <TextField id="rg" label="RG" required inputMode="numeric" maxLength={FIELD_LIMITS.rg} hint="Somente números, de 5 a 14 dígitos." value={values.rg} error={errors.rg} onChange={(event) => updateField('rg', onlyDigits(event.target.value).slice(0, FIELD_LIMITS.rg))} />
                <TextField id="dataNascimento" label="Data de nascimento" required inputMode="numeric" autoComplete="bday" maxLength={FIELD_LIMITS.data} placeholder="DD/MM/AAAA" value={values.dataNascimento} error={errors.dataNascimento} onChange={(event) => updateField('dataNascimento', maskDate(event.target.value))} />
                <TextField id="whatsapp" label="WhatsApp" required inputMode="numeric" autoComplete="tel" maxLength={FIELD_LIMITS.whatsapp} placeholder="(11) 99999-9999" value={values.whatsapp} error={errors.whatsapp} onChange={(event) => updateField('whatsapp', maskPhone(event.target.value))} />
                <div className="sm:col-span-2">
                  <TextField id="email" label="E-mail" required type="email" autoComplete="email" maxLength={FIELD_LIMITS.email} value={values.email} error={errors.email} onChange={(event) => updateField('email', limitText(event.target.value, FIELD_LIMITS.email))} />
                </div>
                <TextField id="cep" label="CEP" required inputMode="numeric" autoComplete="postal-code" maxLength={FIELD_LIMITS.cep} placeholder="00000-000" value={values.cep} error={errors.cep} onChange={(event) => updateField('cep', maskCep(event.target.value))} />
                <TextField id="endereco" label="Endereço" required autoComplete="address-line1" maxLength={FIELD_LIMITS.endereco} value={values.endereco} error={errors.endereco} onChange={(event) => updateField('endereco', limitText(event.target.value, FIELD_LIMITS.endereco))} />
                <TextField id="numero" label="Número" required maxLength={FIELD_LIMITS.numero} placeholder="Número ou S/N" value={values.numero} error={errors.numero} onChange={(event) => updateField('numero', sanitizeHouseNumber(event.target.value))} />
                <TextField id="complemento" label="Complemento" maxLength={FIELD_LIMITS.complemento} placeholder="Opcional" value={values.complemento} onChange={(event) => updateField('complemento', limitText(event.target.value, FIELD_LIMITS.complemento))} />
                <TextField id="cidade" label="Cidade" required autoComplete="address-level2" maxLength={FIELD_LIMITS.cidade} value={values.cidade} error={errors.cidade} onChange={(event) => updateField('cidade', limitText(event.target.value, FIELD_LIMITS.cidade))} />
                <StateSelect value={values.estado} error={errors.estado} onChange={(value) => updateField('estado', value)} />
              </div>
              <CompanionsSection companions={values.acompanhantes} errors={errors} accent="#c4e454" onAdd={addCompanion} onRemove={removeCompanion} onChange={updateCompanion} />
            </div>
          )}

          {step === 1 && (
            <div>
              <div className="mb-9 flex items-start gap-4 border-b border-[#e0e6e3] pb-7">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#e2f6f7] font-mono text-[11px] font-bold text-[#087e94]">02</span>
                <div>
                  <h3 className="font-display text-2xl font-bold">Jet e habilitação</h3>
                  <p className="mt-1.5 text-sm leading-6 text-[#718087]">Agora precisamos identificar a embarcação e a pessoa habilitada.</p>
                </div>
              </div>

              <FieldShell id="proprietarioJet" label="O jet está em nome de quem?" error={errors.proprietarioJet} required>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    ['participante', 'Está em meu nome'],
                    ['terceiro', 'Está em nome de outra pessoa ou empresa'],
                  ].map(([value, label]) => (
                    <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 text-sm font-semibold transition ${values.proprietarioJet === value ? 'border-[#0b92aa] bg-[#edfafa] text-[#087e94] ring-4 ring-[#0b92aa]/5' : 'border-[#d1dcda] bg-[#fbfcfa] text-[#52636a] hover:border-[#0b92aa]'}`} key={value}>
                      <input checked={values.proprietarioJet === value} id={value === 'participante' ? 'proprietarioJet' : undefined} name="proprietarioJet" onChange={() => updateOwnership(value as Ownership)} type="radio" value={value} />
                      {label}
                    </label>
                  ))}
                </div>
              </FieldShell>

              {values.proprietarioJet === 'terceiro' && (
                <div className="mt-6 rounded-2xl border border-[#d8e2e0] bg-[#f8fbfa] p-5 sm:p-6">
                  <FieldShell id="tipoProprietario" label="Tipo de proprietário" error={errors.tipoProprietario} required>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {[
                        ['pf', 'Pessoa física'],
                        ['pj', 'Pessoa jurídica'],
                      ].map(([value, label]) => (
                        <label className={`flex cursor-pointer items-center gap-3 rounded-xl border bg-white p-4 text-sm font-semibold transition ${values.tipoProprietario === value ? 'border-[#0b92aa] text-[#087e94] ring-4 ring-[#0b92aa]/5' : 'border-[#d1dcda] text-[#52636a] hover:border-[#0b92aa]'}`} key={value}>
                          <input checked={values.tipoProprietario === value} id={value === 'pf' ? 'tipoProprietario' : undefined} name="tipoProprietario" onChange={() => updateOwnerType(value as OwnerType)} type="radio" value={value} />
                          {label}
                        </label>
                      ))}
                    </div>
                  </FieldShell>

                  {values.tipoProprietario === 'pf' && (
                    <div className="mt-6 grid gap-6 sm:grid-cols-2">
                      <TextField id="nomeProprietario" label="Nome completo do proprietário" required maxLength={FIELD_LIMITS.nome} value={values.nomeProprietario} error={errors.nomeProprietario} onChange={(event) => updateField('nomeProprietario', limitText(event.target.value, FIELD_LIMITS.nome))} />
                      <TextField id="cpfProprietario" label="CPF do proprietário" required inputMode="numeric" maxLength={FIELD_LIMITS.cpf} placeholder="000.000.000-00" value={values.cpfProprietario} error={errors.cpfProprietario} onChange={(event) => updateField('cpfProprietario', maskCpf(event.target.value))} />
                    </div>
                  )}

                  {values.tipoProprietario === 'pj' && (
                    <div className="mt-6 grid gap-6 sm:grid-cols-2">
                      <TextField id="razaoSocialProprietario" label="Razão social" required maxLength={FIELD_LIMITS.razaoSocial} value={values.razaoSocialProprietario} error={errors.razaoSocialProprietario} onChange={(event) => updateField('razaoSocialProprietario', limitText(event.target.value, FIELD_LIMITS.razaoSocial))} />
                      <TextField id="cnpjProprietario" label="CNPJ" required inputMode="numeric" maxLength={FIELD_LIMITS.cnpj} placeholder="00.000.000/0000-00" value={values.cnpjProprietario} error={errors.cnpjProprietario} onChange={(event) => updateField('cnpjProprietario', maskCnpj(event.target.value))} />
                    </div>
                  )}
                </div>
              )}

              <div className="mt-8 grid gap-x-6 gap-y-7 sm:grid-cols-2">
                <TextField id="marcaJet" label="Marca do jet" required maxLength={FIELD_LIMITS.marcaJet} placeholder="Ex.: Sea-Doo" value={values.marcaJet} error={errors.marcaJet} onChange={(event) => updateField('marcaJet', limitText(event.target.value, FIELD_LIMITS.marcaJet))} />
                <TextField id="modeloJet" label="Modelo" required maxLength={FIELD_LIMITS.modeloJet} value={values.modeloJet} error={errors.modeloJet} onChange={(event) => updateField('modeloJet', limitText(event.target.value, FIELD_LIMITS.modeloJet))} />
                <TextField id="anoJet" label="Ano" required inputMode="numeric" maxLength={FIELD_LIMITS.anoJet} placeholder="2025" value={values.anoJet} error={errors.anoJet} onChange={(event) => updateField('anoJet', onlyDigits(event.target.value).slice(0, FIELD_LIMITS.anoJet))} />
                <TextField id="inscricaoJet" label="Número de inscrição do jet" required maxLength={FIELD_LIMITS.inscricaoJet} hint="Somente letras, números, ponto, barra e hífen." value={values.inscricaoJet} error={errors.inscricaoJet} onChange={(event) => updateField('inscricaoJet', sanitizeIdentifier(event.target.value, FIELD_LIMITS.inscricaoJet))} />
                <div className="sm:col-span-2">
                  <UploadField id="docJet" label="Documento do jet ski" file={values.docJet} error={errors.docJet} onChange={(file) => updateField('docJet', file)} />
                </div>
              </div>

              <div className="my-10 border-t border-[#dce5e5]" />

              <div className="grid gap-x-6 gap-y-7 sm:grid-cols-2">
                <TextField id="numeroArrais" label="Número da habilitação de motonauta" required maxLength={FIELD_LIMITS.numeroArrais} hint="Digite exatamente como aparece na Carteira de Habilitação de Amador." value={values.numeroArrais} error={errors.numeroArrais} onChange={(event) => updateField('numeroArrais', sanitizeIdentifier(event.target.value, FIELD_LIMITS.numeroArrais))} />
                <TextField id="validadeArrais" label="Validade da habilitação" required inputMode="numeric" maxLength={FIELD_LIMITS.data} placeholder="DD/MM/AAAA" value={values.validadeArrais} error={errors.validadeArrais} onChange={(event) => updateField('validadeArrais', maskDate(event.target.value))} />
                <div className="sm:col-span-2">
                  <UploadField id="docArrais" label="Habilitação de motonauta" file={values.docArrais} error={errors.docArrais} onChange={(file) => updateField('docArrais', file)} />
                </div>
              </div>

              <div className="mt-8">
                <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-5 ${errors.confirmacao ? 'border-red-500 bg-red-50' : 'border-[#d1dcda] bg-[#f8fbfa]'}`}>
                  <input checked={values.confirmacao} className="mt-1 h-4 w-4 accent-[#0b92aa]" id="confirmacao" onChange={(event) => updateField('confirmacao', event.target.checked)} type="checkbox" />
                  <span className="text-sm leading-6 text-[#52636a]">
                    Confirmo que os dados e documentos informados são verdadeiros e pertencem às pessoas indicadas. <strong className="text-[#0b92aa]">*</strong>
                  </span>
                </label>
                {errors.confirmacao && <p className="mt-2 text-xs font-medium text-red-600">{errors.confirmacao}</p>}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="mb-9 flex items-start gap-4 border-b border-[#e0e6e3] pb-7">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#e2f6f7] font-mono text-[11px] font-bold text-[#087e94]">03</span>
                <div>
                  <h3 className="font-display text-2xl font-bold">Revise antes de enviar</h3>
                  <p className="mt-1.5 text-sm leading-6 text-[#718087]">Confira com calma. Você ainda pode voltar e corrigir qualquer informação.</p>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-[#d8e0de] bg-[#fbfcfa] p-5 sm:p-6">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="font-display text-lg font-bold">Dados pessoais</h4>
                    <button className="text-xs font-bold text-[#087e94] underline" onClick={() => setStep(0)} type="button">Editar</button>
                  </div>
                  <dl>
                    <ReviewRow label="Nome" value={values.nomeCompleto} />
                    <ReviewRow label="CPF" value={values.cpf} />
                    <ReviewRow label="RG" value={values.rg} />
                    <ReviewRow label="Nascimento" value={values.dataNascimento} />
                    <ReviewRow label="WhatsApp" value={values.whatsapp} />
                    <ReviewRow label="E-mail" value={values.email} />
                    <ReviewRow label="Endereço" value={address} />
                    {values.acompanhantes.map((companion, index) => <ReviewRow key={companion.id} label={`Acompanhante ${index + 1}`} value={`${companion.nome} · ${companion.dataNascimento} · Camiseta ${companion.tamanhoCamiseta}${companion.rg ? ` · RG ${companion.rg}` : ''}`} />)}
                  </dl>
                </div>
                <div className="rounded-2xl border border-[#d8e0de] bg-[#fbfcfa] p-5 sm:p-6">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="font-display text-lg font-bold">Jet e habilitação</h4>
                    <button className="text-xs font-bold text-[#087e94] underline" onClick={() => setStep(1)} type="button">Editar</button>
                  </div>
                  <dl>
                    <ReviewRow label="Proprietário" value={values.proprietarioJet === 'participante' ? values.nomeCompleto : values.tipoProprietario === 'pf' ? values.nomeProprietario : values.razaoSocialProprietario} />
                    <ReviewRow label="Tipo" value={values.proprietarioJet === 'participante' || values.tipoProprietario === 'pf' ? 'Pessoa física' : 'Pessoa jurídica'} />
                    <ReviewRow label="CPF / CNPJ" value={values.proprietarioJet === 'participante' ? values.cpf : values.tipoProprietario === 'pf' ? values.cpfProprietario : values.cnpjProprietario} />
                    <ReviewRow label="Jet" value={[values.marcaJet, values.modeloJet, values.anoJet].filter(Boolean).join(' · ')} />
                    <ReviewRow label="Inscrição" value={values.inscricaoJet} />
                    <ReviewRow label="Documento do jet" value={values.docJet?.name ?? ''} />
                    <ReviewRow label="Habilitação" value={values.numeroArrais} />
                    <ReviewRow label="Validade" value={values.validadeArrais} />
                    <ReviewRow label="Documento da habilitação" value={values.docArrais?.name ?? ''} />
                  </dl>
                </div>
              </div>

              <div className="mt-6 flex items-start gap-3 rounded-xl border border-[#b9dfe5] bg-[#effbfc] p-4 text-sm leading-6 text-[#36545e]">
                <LockKeyhole aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-[#087e94]" />
                {BASIN_ENDPOINT_IS_VALID
                  ? 'Seus dados e documentos serão enviados ao canal de recebimento configurado pela Usina do Jet.'
                  : 'A integração está preparada e será ativada quando o canal de recebimento da Usina do Jet for configurado.'}
              </div>

              {submitError && (
                <p className="mt-5 flex items-center gap-2 text-sm font-medium text-red-600">
                  <AlertCircle aria-hidden="true" className="h-4 w-4" />
                  {submitError}
                </p>
              )}
            </div>
          )}

          <div className="mt-12 flex flex-col-reverse gap-3 border-t border-[#e0e6e3] pt-7 sm:flex-row sm:justify-between">
            {step > 0 ? (
              <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#b8c5c5] bg-white px-6 py-4 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[#36545e] transition hover:border-[#09232d] hover:text-[#09232d]" onClick={previousStep} type="button">
                <ArrowLeft aria-hidden="true" className="h-4 w-4" />
                Voltar
              </button>
            ) : <span />}

            {step < 2 ? (
              <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#092f3a] px-7 py-4 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-white shadow-[0_12px_28px_rgba(9,47,58,0.16)] transition hover:-translate-y-0.5 hover:bg-[#0b92aa]" onClick={nextStep} type="button">
                Continuar
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </button>
            ) : (
              <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0b92aa] px-7 py-4 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-white shadow-[0_12px_28px_rgba(11,146,170,0.18)] transition hover:-translate-y-0.5 hover:bg-[#076f81] disabled:cursor-wait disabled:opacity-70" disabled={submitting} onClick={submitForm} type="button">
                {submitting ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Check aria-hidden="true" className="h-4 w-4" />}
                {submitting ? 'Enviando...' : 'Enviar inscrição'}
              </button>
            )}
          </div>
        </form>
      </div>
    </section>
  )
}
